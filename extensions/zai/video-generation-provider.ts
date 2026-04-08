import { isProviderApiKeyConfigured } from "openclaw/plugin-sdk/provider-auth";
import { resolveApiKeyForProvider } from "openclaw/plugin-sdk/provider-auth-runtime";
import {
  assertOkOrThrowHttpError,
  resolveProviderHttpRequestConfig,
} from "openclaw/plugin-sdk/provider-http";
import {
  fetchWithSsrFGuard,
  ssrfPolicyFromDangerouslyAllowPrivateNetwork,
} from "openclaw/plugin-sdk/ssrf-runtime";
import type {
  GeneratedVideoAsset,
  VideoGenerationProvider,
} from "openclaw/plugin-sdk/video-generation";

const DEFAULT_ZAI_VIDEO_MODEL = "cogvideox-flash";
const DEFAULT_ZAI_CN_BASE_URL = "https://open.bigmodel.cn/api/paas";
const DEFAULT_HTTP_TIMEOUT_MS = 30_000;
const DEFAULT_OPERATION_TIMEOUT_MS = 600_000; // 10 minutes
const POLL_INTERVAL_MS = 5_000;

let zaiVideoFetchGuard = fetchWithSsrFGuard;

export function _setZaiVideoFetchGuardForTesting(impl: typeof fetchWithSsrFGuard | null): void {
  zaiVideoFetchGuard = impl ?? fetchWithSsrFGuard;
}

type ZaiVideoSubmitResponse = {
  id?: string;
  model?: string;
  request_id?: string;
  task_status?: string;
};

type ZaiVideoResultEntry = {
  url?: string;
  cover_image_url?: string;
};

type ZaiVideoAsyncResultResponse = {
  id?: string;
  model?: string;
  task_status?: string;
  video_result?: ZaiVideoResultEntry[];
};

export function buildZaiVideoGenerationProvider(): VideoGenerationProvider {
  return {
    id: "zai",
    label: "Z.AI (CogVideoX)",
    defaultModel: DEFAULT_ZAI_VIDEO_MODEL,
    models: [DEFAULT_ZAI_VIDEO_MODEL, "cogvideox-3", "cogvideox-2"],
    isConfigured: ({ agentDir }) =>
      isProviderApiKeyConfigured({
        provider: "zai",
        agentDir,
      }),
    capabilities: {
      generate: {
        maxVideos: 1,
        supportsAspectRatio: true,
        supportsSize: false,
        supportsResolution: true,
        resolutions: ["480P", "720P", "1080P"],
      },
      imageToVideo: {
        enabled: true,
        maxVideos: 1,
        maxInputImages: 1,
        supportsAspectRatio: true,
        supportsSize: false,
        supportsResolution: true,
      },
      videoToVideo: {
        enabled: false,
      },
    },
    async generateVideo(req) {
      if ((req.inputVideos?.length ?? 0) > 0) {
        throw new Error("Z.AI video generation does not support video reference inputs.");
      }
      if ((req.inputImages?.length ?? 0) > 1) {
        throw new Error("Z.AI video generation supports at most one image reference.");
      }

      const auth = await resolveApiKeyForProvider({
        provider: "zai",
        cfg: req.cfg,
        agentDir: req.agentDir,
        store: req.authStore,
      });
      if (!auth.apiKey) {
        throw new Error("Z.AI API key missing for video generation");
      }

      const model = req.model?.trim() || DEFAULT_ZAI_VIDEO_MODEL;
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
          capability: "video",
          transport: "http",
        });

      const policy = allowPrivateNetwork
        ? ssrfPolicyFromDangerouslyAllowPrivateNetwork(true)
        : undefined;

      // Build request body
      const requestBody: Record<string, unknown> = {
        model,
        prompt: req.prompt,
      };
      if (req.size?.trim()) {
        requestBody.size = req.size.trim();
      } else if (req.aspectRatio?.trim()) {
        requestBody.aspect_ratio = req.aspectRatio.trim();
      }
      if (req.resolution) {
        requestBody.resolution = req.resolution;
      }
      if (req.durationSeconds && Number.isFinite(req.durationSeconds)) {
        requestBody.duration = Math.max(1, Math.round(req.durationSeconds));
      }
      if (req.quality === "quality" || req.quality === "speed") {
        requestBody.quality = req.quality;
      }
      if (req.fps === 30 || req.fps === 60) {
        requestBody.fps = req.fps;
      }
      if (req.audio !== undefined) {
        requestBody.with_audio = req.audio;
      }

      // For image-to-video, include the image
      const inputImage = req.inputImages?.[0];
      if (inputImage) {
        if (inputImage.url?.trim()) {
          requestBody.image_url = inputImage.url.trim();
        } else if (inputImage.buffer) {
          const base64 = inputImage.buffer.toString("base64");
          const mime = inputImage.mimeType?.trim() || "image/png";
          requestBody.image_url = `data:${mime};base64,${base64}`;
        }
      }

      // Step 1: Submit async task
      const submitUrl = `${baseUrl}/v4/videos/generations`;
      const { response: submitResponse, release: submitRelease } = await zaiVideoFetchGuard({
        url: submitUrl,
        init: {
          method: "POST",
          headers,
          body: JSON.stringify(requestBody),
        },
        timeoutMs: DEFAULT_HTTP_TIMEOUT_MS,
        policy,
        dispatcherPolicy,
        auditContext: "zai-video-submit",
      });

      let taskId: string;
      try {
        await assertOkOrThrowHttpError(submitResponse, "Z.AI video generation submit failed");
        const submitPayload = (await submitResponse.json()) as ZaiVideoSubmitResponse;
        taskId = submitPayload.id?.trim() ?? "";
        if (!taskId) {
          throw new Error("Z.AI video generation submit response missing task id");
        }
      } finally {
        await submitRelease();
      }

      // Step 2: Poll for result
      const deadline = Date.now() + (req.timeoutMs ?? DEFAULT_OPERATION_TIMEOUT_MS);
      let lastStatus = "unknown";
      while (Date.now() < deadline) {
        const resultUrl = `${baseUrl}/v4/async-result/${taskId}`;
        const { response: pollResponse, release: pollRelease } = await zaiVideoFetchGuard({
          url: resultUrl,
          init: {
            method: "GET",
            headers,
          },
          timeoutMs: DEFAULT_HTTP_TIMEOUT_MS,
          policy,
          dispatcherPolicy,
          auditContext: "zai-video-poll",
        });

        try {
          await assertOkOrThrowHttpError(pollResponse, "Z.AI video poll failed");
          const pollPayload = (await pollResponse.json()) as ZaiVideoAsyncResultResponse;
          const status = pollPayload.task_status?.trim().toUpperCase();
          if (status) {
            lastStatus = status;
          }

          if (status === "SUCCESS") {
            const entry = pollPayload.video_result?.[0];
            const videoUrl = entry?.url?.trim();
            if (!videoUrl) {
              throw new Error("Z.AI video generation succeeded but no video URL in response");
            }

            // Download the video
            const { response: dlResponse, release: dlRelease } = await zaiVideoFetchGuard({
              url: videoUrl,
              timeoutMs: DEFAULT_HTTP_TIMEOUT_MS,
              policy,
              auditContext: "zai-video-download",
            });
            try {
              if (!dlResponse.ok) {
                throw new Error(`Z.AI video download failed: ${dlResponse.status}`);
              }
              const mimeType = dlResponse.headers.get("content-type")?.trim() || "video/mp4";
              const arrayBuffer = await dlResponse.arrayBuffer();
              const video: GeneratedVideoAsset = {
                buffer: Buffer.from(arrayBuffer),
                mimeType,
                fileName: `video-1.${mimeType.includes("webm") ? "webm" : "mp4"}`,
              };
              return {
                videos: [video],
                model,
                metadata: {
                  taskId,
                  ...(entry?.cover_image_url?.trim()
                    ? { coverImageUrl: entry.cover_image_url.trim() }
                    : {}),
                },
              };
            } finally {
              await dlRelease();
            }
          }

          if (status === "FAIL") {
            throw new Error(`Z.AI video generation task failed (task_id=${taskId})`);
          }
        } finally {
          await pollRelease();
        }

        // Wait before next poll
        await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
      }

      throw new Error(
        `Z.AI video generation did not finish in time (task_id=${taskId}, last_status=${lastStatus})`,
      );
    },
  };
}
