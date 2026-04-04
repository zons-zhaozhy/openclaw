import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { createJiti } from "jiti";
import { openBoundaryFileSync } from "../../infra/boundary-file-read.js";
import { createSubsystemLogger } from "../../logging/subsystem.js";
import { discoverOpenClawPlugins } from "../../plugins/discovery.js";
import { loadPluginManifestRegistry } from "../../plugins/manifest-registry.js";
import type { PluginRuntime } from "../../plugins/runtime/types.js";
import {
  buildPluginLoaderAliasMap,
  buildPluginLoaderJitiOptions,
  shouldPreferNativeJiti,
} from "../../plugins/sdk-alias.js";
import type { ChannelId, ChannelPlugin } from "./types.js";

type GeneratedBundledChannelEntry = {
  id: string;
  entry: {
    channelPlugin: ChannelPlugin;
    setChannelRuntime?: (runtime: PluginRuntime) => void;
  };
  setupEntry?: {
    plugin: ChannelPlugin;
  };
};

type BundledChannelDiscoveryCandidate = {
  rootDir: string;
  packageManifest?: {
    extensions?: string[];
  };
};

const BUNDLED_CHANNEL_ENTRY_BASENAMES = [
  "channel-entry.ts",
  "channel-entry.mts",
  "channel-entry.js",
  "channel-entry.mjs",
] as const;

const log = createSubsystemLogger("channels");

function resolveChannelPluginModuleEntry(
  moduleExport: unknown,
): GeneratedBundledChannelEntry["entry"] | null {
  const resolveNamedFallback = (value: unknown): GeneratedBundledChannelEntry["entry"] | null => {
    if (!value || typeof value !== "object") {
      return null;
    }
    // Object.entries triggers getters on re-exported ESM bindings. When jiti
    // loads a bundled channel-entry.js via CJS require, the ESM re-exports
    // become live getters that can throw if the source chunk is still
    // initializing (circular dependency). Safely collect entries instead.
    const entries: [string, unknown][] = [];
    try {
      for (const [key, candidate] of Object.entries(value as Record<string, unknown>)) {
        if (key !== "default") {
          entries.push([key, candidate]);
        }
      }
    } catch {
      return null;
    }
    const pluginCandidates = entries.filter(
      ([key, candidate]) =>
        key.endsWith("Plugin") &&
        !!candidate &&
        typeof candidate === "object" &&
        "id" in (candidate as Record<string, unknown>),
    );
    if (pluginCandidates.length !== 1) {
      return null;
    }
    const runtimeCandidates = entries.filter(
      ([key, candidate]) =>
        key.startsWith("set") && key.endsWith("Runtime") && typeof candidate === "function",
    );
    return {
      channelPlugin: pluginCandidates[0][1] as ChannelPlugin,
      ...(runtimeCandidates.length === 1
        ? {
            setChannelRuntime: runtimeCandidates[0][1] as (runtime: PluginRuntime) => void,
          }
        : {}),
    };
  };

  const resolved =
    moduleExport &&
    typeof moduleExport === "object" &&
    "default" in (moduleExport as Record<string, unknown>)
      ? (moduleExport as { default: unknown }).default
      : moduleExport;
  if (!resolved || typeof resolved !== "object") {
    return null;
  }
  const record = resolved as {
    channelPlugin?: unknown;
    setChannelRuntime?: unknown;
  };
  if (!record.channelPlugin || typeof record.channelPlugin !== "object") {
    return resolveNamedFallback(resolved) ?? resolveNamedFallback(moduleExport);
  }
  return {
    channelPlugin: record.channelPlugin as ChannelPlugin,
    ...(typeof record.setChannelRuntime === "function"
      ? { setChannelRuntime: record.setChannelRuntime as (runtime: PluginRuntime) => void }
      : {}),
  };
}

function resolveChannelSetupModuleEntry(
  moduleExport: unknown,
): GeneratedBundledChannelEntry["setupEntry"] | null {
  const resolved =
    moduleExport &&
    typeof moduleExport === "object" &&
    "default" in (moduleExport as Record<string, unknown>)
      ? (moduleExport as { default: unknown }).default
      : moduleExport;
  if (!resolved || typeof resolved !== "object") {
    return null;
  }
  const record = resolved as {
    plugin?: unknown;
  };
  if (!record.plugin || typeof record.plugin !== "object") {
    return null;
  }
  return {
    plugin: record.plugin as ChannelPlugin,
  };
}

function createModuleLoader() {
  const jitiLoaders = new Map<string, ReturnType<typeof createJiti>>();

  return (modulePath: string) => {
    // For already-compiled .js files in dist/, skip jiti and use Node's
    // native require() directly. Jiti's CJS interop for ESM re-exports can
    // trigger live getter errors when shared chunks haven't finished
    // initializing in the module graph. Native require() in Node 22 uses
    // importSyncForRequire which correctly handles ESM modules already
    // present in the module graph.
    if (modulePath.endsWith(".js") && modulePath.includes(`${path.sep}dist${path.sep}`)) {
      return (resolvedPath: string) => {
        const req = createRequire(import.meta.url);
        return req(resolvedPath);
      };
    }

    const tryNative =
      shouldPreferNativeJiti(modulePath) || modulePath.includes(`${path.sep}dist${path.sep}`);
    const aliasMap = buildPluginLoaderAliasMap(modulePath, process.argv[1], import.meta.url);
    const cacheKey = JSON.stringify({
      tryNative,
      aliasMap: Object.entries(aliasMap).toSorted(([left], [right]) => left.localeCompare(right)),
    });
    const cached = jitiLoaders.get(cacheKey);
    if (cached) {
      return cached;
    }
    const loader = createJiti(import.meta.url, {
      ...buildPluginLoaderJitiOptions(aliasMap),
      tryNative,
    });
    jitiLoaders.set(cacheKey, loader);
    return loader;
  };
}

const loadModule = createModuleLoader();

function loadBundledModule(modulePath: string, rootDir: string): unknown {
  const boundaryRoot = resolveCompiledBundledModulePath(rootDir);
  const opened = openBoundaryFileSync({
    absolutePath: modulePath,
    rootPath: boundaryRoot,
    boundaryLabel: "plugin root",
    rejectHardlinks: false,
    skipLexicalRootCheck: true,
  });
  if (!opened.ok) {
    throw new Error("plugin entry path escapes plugin root or fails alias checks");
  }
  const safePath = opened.path;
  fs.closeSync(opened.fd);
  const result = loadModule(safePath)(safePath);
  return result;
}

function resolveCompiledBundledModulePath(modulePath: string): string {
  const compiledDistModulePath = modulePath.replace(
    `${path.sep}dist-runtime${path.sep}`,
    `${path.sep}dist${path.sep}`,
  );
  return compiledDistModulePath !== modulePath && fs.existsSync(compiledDistModulePath)
    ? compiledDistModulePath
    : modulePath;
}

function resolveBundledChannelSourceCandidates(
  candidate: BundledChannelDiscoveryCandidate,
  manifest: ReturnType<typeof loadPluginManifestRegistry>["plugins"][number],
): string[] {
  const candidates: string[] = [];
  for (const basename of BUNDLED_CHANNEL_ENTRY_BASENAMES) {
    const preferred = resolveCompiledBundledModulePath(path.resolve(candidate.rootDir, basename));
    if (fs.existsSync(preferred)) {
      candidates.push(preferred);
    }
  }
  const declaredEntry = candidate.packageManifest?.extensions?.find(
    (entry): entry is string => typeof entry === "string" && entry.trim().length > 0,
  );
  if (declaredEntry) {
    const resolved = resolveCompiledBundledModulePath(
      path.resolve(candidate.rootDir, declaredEntry),
    );
    if (!candidates.includes(resolved)) {
      candidates.push(resolved);
    }
  }
  const manifestSource = resolveCompiledBundledModulePath(manifest.source);
  if (!candidates.includes(manifestSource)) {
    candidates.push(manifestSource);
  }
  return candidates;
}

function loadGeneratedBundledChannelEntries(): readonly GeneratedBundledChannelEntry[] {
  const discovery = discoverOpenClawPlugins({ cache: false });
  const manifestRegistry = loadPluginManifestRegistry({
    cache: false,
    config: {},
    candidates: discovery.candidates,
    diagnostics: discovery.diagnostics,
  });
  const manifestByRoot = new Map(
    manifestRegistry.plugins.map((plugin) => [plugin.rootDir, plugin] as const),
  );
  const seenIds = new Set<string>();
  const entries: GeneratedBundledChannelEntry[] = [];

  for (const candidate of discovery.candidates) {
    const manifest = manifestByRoot.get(candidate.rootDir);
    if (!manifest || manifest.origin !== "bundled" || manifest.channels.length === 0) {
      continue;
    }
    if (seenIds.has(manifest.id)) {
      continue;
    }
    seenIds.add(manifest.id);

    try {
      const sourceCandidates = resolveBundledChannelSourceCandidates(candidate, manifest);
      let entry: GeneratedBundledChannelEntry["entry"] | null = null;
      for (const sourcePath of sourceCandidates) {
        try {
          const loaded = loadBundledModule(sourcePath, candidate.rootDir);
          entry = resolveChannelPluginModuleEntry(loaded);
          if (entry) {
            break;
          }
        } catch (e: unknown) {
          // Node 22 throws ERR_REQUIRE_CYCLE_MODULE when require()ing an ESM
          // module whose dependency graph cycles back to the caller. This
          // happens during plugin auto-enable where config-presence calls
          // listPotentialConfiguredChannelIds → loadBundledModule → channel-entry
          // → runtime → ... → plugin-auto-enable → config-presence (cycle).
          // Subsequent calls after the module graph settles will succeed, so
          // we silently skip here and let the caller retry later.
          const code =
            e instanceof Error && "code" in e ? (e as NodeJS.ErrnoException).code : undefined;
          if (code === "ERR_REQUIRE_CYCLE_MODULE") {
            continue;
          }
          throw e;
        }
      }
      if (!entry) {
        // If all candidates failed due to require cycles, don't warn —
        // the channel will be discovered when the module graph settles.
        continue;
      }
      const setupEntry = manifest.setupSource
        ? resolveChannelSetupModuleEntry(
            loadBundledModule(
              resolveCompiledBundledModulePath(manifest.setupSource),
              candidate.rootDir,
            ),
          )
        : null;
      entries.push({
        id: manifest.id,
        entry,
        ...(setupEntry ? { setupEntry } : {}),
      });
    } catch (error) {
      log.warn(
        `[channels] failed to load bundled channel ${manifest.id} from ${candidate.source}: ${String(error)}`,
      );
    }
  }

  return entries;
}

function buildBundledChannelPluginsById(plugins: readonly ChannelPlugin[]) {
  const byId = new Map<ChannelId, ChannelPlugin>();
  for (const plugin of plugins) {
    if (byId.has(plugin.id)) {
      throw new Error(`duplicate bundled channel plugin id: ${plugin.id}`);
    }
    byId.set(plugin.id, plugin);
  }
  return byId;
}

type BundledChannelState = {
  entries: readonly GeneratedBundledChannelEntry[];
  plugins: readonly ChannelPlugin[];
  setupPlugins: readonly ChannelPlugin[];
  pluginsById: Map<ChannelId, ChannelPlugin>;
  runtimeSettersById: Map<
    ChannelId,
    NonNullable<GeneratedBundledChannelEntry["entry"]["setChannelRuntime"]>
  >;
};

let cachedBundledChannelState: BundledChannelState | null = null;

function getBundledChannelState(): BundledChannelState {
  if (cachedBundledChannelState) {
    return cachedBundledChannelState;
  }

  const entries = loadGeneratedBundledChannelEntries();
  const plugins = entries.map(({ entry }) => entry.channelPlugin);
  const setupPlugins = entries.flatMap(({ setupEntry }) => {
    const plugin = setupEntry?.plugin;
    return plugin ? [plugin] : [];
  });
  const runtimeSettersById = new Map<
    ChannelId,
    NonNullable<GeneratedBundledChannelEntry["entry"]["setChannelRuntime"]>
  >();
  for (const { entry } of entries) {
    if (entry.setChannelRuntime) {
      runtimeSettersById.set(entry.channelPlugin.id, entry.setChannelRuntime);
    }
  }

  cachedBundledChannelState = {
    entries,
    plugins,
    setupPlugins,
    pluginsById: buildBundledChannelPluginsById(plugins),
    runtimeSettersById,
  };
  return cachedBundledChannelState;
}

export function listBundledChannelPlugins(): readonly ChannelPlugin[] {
  return getBundledChannelState().plugins;
}

export function listBundledChannelSetupPlugins(): readonly ChannelPlugin[] {
  return getBundledChannelState().setupPlugins;
}

export function getBundledChannelPlugin(id: ChannelId): ChannelPlugin | undefined {
  return getBundledChannelState().pluginsById.get(id);
}

export function requireBundledChannelPlugin(id: ChannelId): ChannelPlugin {
  const plugin = getBundledChannelPlugin(id);
  if (!plugin) {
    throw new Error(`missing bundled channel plugin: ${id}`);
  }
  return plugin;
}

export function setBundledChannelRuntime(id: ChannelId, runtime: PluginRuntime): void {
  const setter = getBundledChannelState().runtimeSettersById.get(id);
  if (!setter) {
    throw new Error(`missing bundled channel runtime setter: ${id}`);
  }
  setter(runtime);
}
