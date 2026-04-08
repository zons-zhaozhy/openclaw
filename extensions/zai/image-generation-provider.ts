import type {
  GeneratedImageAsset,
  ImageGenerationProvider,
} from "openclaw/plugin-sdk/image-generation";
import { isProviderApiKeyConfigured } from "openclaw/plugin-sdk/provider-auth";
import { resolveApiKeyForProvider } from "openclaw/plugin-sdk/provider-auth-runtime";
import {
  assertOkOrThrowHttpError,
  resolveProviderHttpRequestConfig,
} from "openclaw/plugin-sdk/provider-http";
import {
  buildHostnameAllowlistPolicyFromSuffixAllowlist,
  fetchWithSsrFGuard,
  type SsrFPolicy,
  ssrfPolicyFromDangerouslyAllowPrivateNetwork,
} from "openclaw/plugin-sdk/ssrf-runtime";

const DEFAULT_ZAI_IMAGE_MODEL = "cogview-3-flash";
const DEFAULT_ZAI_CN_BASE_URL = "https://open.bigmodel.cn/api/paas";

const ZAI_SUPPORTED_SIZES = ["1024x1024", "768x1344", "1344x768", "720x1440", "1440x720"] as const;
const ZAI_SUPPORTED_ASPECT_RATIOS = ["1:1", "3:4", "4:3", "9:16", "16:9"] as const;

type ZaiImageResponse = {
  created?: number;
  data?: Array<{
    url?: string;
  }>;
};

type ZaiNetworkPolicy = {
  apiPolicy?: SsrFPolicy;
  trustedDownloadHostSuffix?: string;
  trustedDownloadPolicy?: SsrFPolicy;
};

let zaiFetchGuard = fetchWithSsrFGuard;

export function _setZaiFetchGuardForTesting(impl: typeof fetchWithSsrFGuard | null): void {
  zaiFetchGuard = impl ?? fetchWithSsrFGuard;
}

function resolveZaiNetworkPolicy(params: {
  baseUrl: string;
  allowPrivateNetwork: boolean;
}): ZaiNetworkPolicy {
  let parsedBaseUrl: URL;
  try {
    parsedBaseUrl = new URL(params.baseUrl);
  } catch {
    return {};
  }
  const hostSuffix = parsedBaseUrl.hostname.trim().toLowerCase();
  if (!hostSuffix || !params.allowPrivateNetwork) {
    return {};
  }
  const hostPolicy = buildHostnameAllowlistPolicyFromSuffixAllowlist([hostSuffix]);
  const privateNetworkPolicy = ssrfPolicyFromDangerouslyAllowPrivateNetwork(true);
  const trustedHostPolicy = mergeSsrFPolicies(hostPolicy, privateNetworkPolicy);
  return {
    apiPolicy: trustedHostPolicy,
    trustedDownloadHostSuffix: hostSuffix,
    trustedDownloadPolicy: trustedHostPolicy,
  };
}

function mergeSsrFPolicies(...policies: Array<SsrFPolicy | undefined>): SsrFPolicy | undefined {
  const merged: SsrFPolicy = {};
  for (const policy of policies) {
    if (!policy) {
      continue;
    }
    if (policy.allowPrivateNetwork) {
      merged.allowPrivateNetwork = true;
    }
    if (policy.dangerouslyAllowPrivateNetwork) {
      merged.dangerouslyAllowPrivateNetwork = true;
    }
    if (policy.allowRfc2544BenchmarkRange) {
      merged.allowRfc2544BenchmarkRange = true;
    }
    if (policy.allowedHostnames?.length) {
      merged.allowedHostnames = Array.from(
        new Set([...(merged.allowedHostnames ?? []), ...policy.allowedHostnames]),
      );
    }
    if (policy.hostnameAllowlist?.length) {
      merged.hostnameAllowlist = Array.from(
        new Set([...(merged.hostnameAllowlist ?? []), ...policy.hostnameAllowlist]),
      );
    }
  }
  return Object.keys(merged).length > 0 ? merged : undefined;
}

function matchesTrustedHostSuffix(hostname: string, trustedSuffix: string): boolean {
  const normalizedHost = hostname.trim().toLowerCase();
  const normalizedSuffix = trustedSuffix.trim().toLowerCase();
  return normalizedHost === normalizedSuffix || normalizedHost.endsWith(`.${normalizedSuffix}`);
}

function sizeToZaiSize(
  size: string | undefined,
  aspectRatio: string | undefined,
): string | undefined {
  if (size?.trim()) {
    return size.trim();
  }
  if (!aspectRatio?.trim()) {
    return undefined;
  }
  const dimensionMap: Record<string, string> = {
    "1:1": "1024x1024",
    "3:4": "768x1344",
    "4:3": "1344x768",
    "9:16": "720x1440",
    "16:9": "1440x720",
  };
  return dimensionMap[aspectRatio.trim()] ?? undefined;
}

function fileExtensionForMimeType(mimeType: string | undefined): string {
  const normalized = mimeType?.toLowerCase().trim();
  if (!normalized) {
    return "png";
  }
  if (normalized.includes("jpeg") || normalized.includes("jpg")) {
    return "jpg";
  }
  const slashIndex = normalized.indexOf("/");
  return slashIndex >= 0 ? normalized.slice(slashIndex + 1) || "png" : "png";
}

async function fetchImageBuffer(
  url: string,
  networkPolicy?: ZaiNetworkPolicy,
): Promise<{ buffer: Buffer; mimeType: string }> {
  const downloadPolicy = (() => {
    const trustedSuffix = networkPolicy?.trustedDownloadHostSuffix;
    const trustedPolicy = networkPolicy?.trustedDownloadPolicy;
    if (!trustedSuffix || !trustedPolicy) {
      return undefined;
    }
    try {
      const parsed = new URL(url);
      return matchesTrustedHostSuffix(parsed.hostname, trustedSuffix) ? trustedPolicy : undefined;
    } catch {
      return undefined;
    }
  })();
  const { response, release } = await zaiFetchGuard({
    url,
    policy: downloadPolicy,
    auditContext: "zai-image-download",
  });
  try {
    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new Error(
        `Z.AI image download failed (${response.status}): ${text || response.statusText}`,
      );
    }
    const mimeType = response.headers.get("content-type")?.trim() || "image/png";
    const arrayBuffer = await response.arrayBuffer();
    return { buffer: Buffer.from(arrayBuffer), mimeType };
  } finally {
    await release();
  }
}

export function buildZaiImageGenerationProvider(): ImageGenerationProvider {
  return {
    id: "zai",
    label: "Z.AI (CogView)",
    defaultModel: DEFAULT_ZAI_IMAGE_MODEL,
    models: [DEFAULT_ZAI_IMAGE_MODEL, "cogview-4", "glm-image"],
    isConfigured: ({ agentDir }) =>
      isProviderApiKeyConfigured({
        provider: "zai",
        agentDir,
      }),
    capabilities: {
      generate: {
        maxCount: 1,
        supportsSize: true,
        supportsAspectRatio: true,
        supportsResolution: false,
      },
      edit: {
        enabled: false,
      },
      geometry: {
        sizes: [...ZAI_SUPPORTED_SIZES],
        aspectRatios: [...ZAI_SUPPORTED_ASPECT_RATIOS],
      },
    },
    async generateImage(req) {
      const auth = await resolveApiKeyForProvider({
        provider: "zai",
        cfg: req.cfg,
        agentDir: req.agentDir,
        store: req.authStore,
      });
      if (!auth.apiKey) {
        throw new Error("Z.AI API key missing for image generation");
      }

      const model = req.model?.trim() || DEFAULT_ZAI_IMAGE_MODEL;
      const resolvedSize = sizeToZaiSize(req.size, req.aspectRatio);
      const explicitBaseUrl = req.cfg?.models?.providers?.zai?.baseUrl?.trim();
      const { baseUrl, allowPrivateNetwork, headers, dispatcherPolicy } =
        resolveProviderHttpRequestConfig({
          baseUrl: explicitBaseUrl
            ? explicitBaseUrl.replace(/\/anthropic\/?$/, "")
            : DEFAULT_ZAI_CN_BASE_URL,
          defaultBaseUrl: DEFAULT_ZAI_CN_BASE_URL,
          allowPrivateNetwork: false,
          defaultHeaders: {
            Authorization: `Bearer ${auth.apiKey}`,
            "Content-Type": "application/json",
          },
          provider: "zai",
          capability: "image",
          transport: "http",
        });
      const networkPolicy = resolveZaiNetworkPolicy({ baseUrl, allowPrivateNetwork });

      const requestBody: Record<string, unknown> = {
        model,
        prompt: req.prompt,
      };
      if (resolvedSize) {
        requestBody.size = resolvedSize;
      }

      const { response, release } = await zaiFetchGuard({
        url: `${baseUrl}/v4/images/generations`,
        init: {
          method: "POST",
          headers,
          body: JSON.stringify(requestBody),
        },
        timeoutMs: req.timeoutMs,
        policy: networkPolicy.apiPolicy,
        dispatcherPolicy,
        auditContext: "zai-image-generate",
      });
      try {
        await assertOkOrThrowHttpError(response, "Z.AI image generation failed");
        const payload = (await response.json()) as ZaiImageResponse;
        const images: GeneratedImageAsset[] = [];
        let imageIndex = 0;
        for (const entry of payload.data ?? []) {
          const url = entry.url?.trim();
          if (!url) {
            continue;
          }
          const downloaded = await fetchImageBuffer(url, networkPolicy);
          imageIndex += 1;
          images.push({
            buffer: downloaded.buffer,
            mimeType: downloaded.mimeType,
            fileName: `image-${imageIndex}.${fileExtensionForMimeType(downloaded.mimeType)}`,
          });
        }
        if (images.length === 0) {
          throw new Error("Z.AI image generation response missing image data");
        }
        return { images, model };
      } finally {
        await release();
      }
    },
  };
}
