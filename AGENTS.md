# Repository Guidelines

- Repo: https://github.com/openclaw/openclaw
- File references: repo-root relative only; never absolute paths or `~/...`.
- Do not edit files covered by `CODEOWNERS` unless a listed owner asked.

## Project Structure

- Source: `src/` (CLI: `src/cli`, commands: `src/commands`, provider: `src/provider-web.ts`, infra: `src/infra`, media: `src/media`). Tests: colocated `*.test.ts`. Docs: `docs/`. Output: `dist/`.
- Use "plugin"/"plugins" in docs/UI/changelogs. Internal package layout unchanged.
- **Plugin naming**: keep plugin id aligned across `openclaw.plugin.json:id`, folder name, package name. `openclaw.install.npmSpec` = package name, `openclaw.channel.id` = plugin id. Exceptions need invariant test coverage.
- **Plugin deps**: extension `package.json` only, not root. Runtime deps in `dependencies`; no `workspace:*` there. Put `openclaw` in `devDeps`/`peerDeps`.
- **Import boundaries**: extensions import only `openclaw/plugin-sdk/*` + local `api.ts`/`runtime-api.ts`. Never core `src/**`, `src/plugin-sdk-internal/**`, or other extensions' `src/**`.
- Installers: `../openclaw.ai`. Channels: consider **all** built-in + extension channels when refactoring. Update `.github/labeler.yml` + labels when adding channels/plugins.

## Architecture Boundaries

- Repo map: workspace plugin tree (bundled), `src/plugin-sdk/*` (public SDK), `src/channels/*` (core channels), `src/plugins/*` (discovery/registry), `src/gateway/protocol/*` (wire protocol).
- Local guides: `AGENTS.md` in bundled-plugin-tree, `src/plugin-sdk/`, `src/channels/`, `src/plugins/`, `src/gateway/protocol/`.

### Plugin/Extension
- Extensions → core **only** via `openclaw/plugin-sdk/*`, manifest, documented helpers. No `src/**`.
- Core must not deep-import plugin internals. Expose via `api.ts` or `src/plugin-sdk/<id>.ts`.
- New seams: documented, backwards-compatible, versioned. Third-party plugins exist.
- `openclaw/plugin-sdk/<subpath>` is the **only** public cross-package contract. No relative imports into `src/plugin-sdk/**`.
- Don't self-import extension via `plugin-sdk/<extension>`; use local barrel.

### Channel: `src/channels/**` is core. Plugin authors use SDK, not channel internals.

### Provider: core owns generic inference; providers own specifics via hooks. No ad hoc `plugins.entries.<id>.config` reads. Vendor tools in owning plugin.

### Gateway Protocol: prefer additive evolution; breaking changes need versioning.

### Config Contract: keep types/schema/help/baselines aligned. Retired keys → remove from all public surfaces; legacy compat via migrations/doctor only. Don't reintroduce removed aliases. `hooks.internal.entries` = canonical.

### Extension Tests: coverage under owning plugin. Core tests use `plugin-sdk/<id>.ts` or plugin `api.ts`.

## Docs (Mintlify)
- Internal links: root-relative, no `.md`. Alphabetical order for services/providers.
- No em dashes/apostrophes in headings. User-facing: full `https://docs.openclaw.ai/...` URLs. No personal device names.
- zh-CN: generated; don't edit unless asked. Pipeline: English → glossary → `scripts/docs-i18n`.

## Build, Test, Dev
- Node 22+. Install: `pnpm install`. Pre-commit: `prek install`. `FAST_COMMIT=1` skips hook checks.
- Type-check: `pnpm build`/`pnpm tsgo`. Lint: `pnpm check`. Format: `pnpm format`/`pnpm format:fix`.
- Tests: `pnpm test`. Scoped: `pnpm test <path>` (not raw `vitest run`). Live: `OPENCLAW_LIVE_TEST=1 pnpm test:live`. Coverage: `pnpm test:coverage`.
- Drift: `pnpm config:docs:gen`/`check`, `pnpm plugin-sdk:api:gen`/`check`. Commit `.sha256` files.
- Workers ≤16. Memory pressure: `OPENCLAW_VITEST_MAX_WORKERS=1`. Don't land with failures from your change.

## Coding Style
- TypeScript ESM, strict, no `any`. Oxlint/Oxfmt. No `@ts-nocheck` unless explained.
- `zod` at boundaries. Discriminated unions, `Result<T,E>`, closed error codes. No freeform string branching.
- No mixing static + dynamic import for same module. Use `*.runtime.ts` boundary for lazy loading.
- No prototype mutation for class behavior. Explicit inheritance/composition.
- ~700 LOC guideline. `createDefaultDeps` pattern.
- **OpenClaw** (product/docs) vs `openclaw` (CLI/package/paths). American English.

## Tool Schema Guardrails
- No `Type.Union`/`anyOf`/`oneOf`/`allOf`. Use `stringEnum`/`optionalStringEnum`, `Type.Optional`. Top-level `type: "object"`. No raw `format` property names.

## Testing
- Vitest, V8 coverage (70%). `*.test.ts`/`*.e2e.test.ts`. Model examples: `sonnet-4.6`, `gpt-5.4`.
- Clean up timers/env/mocks/sockets. Don't `resetModules`+reimport per-test for heavy modules.
- Prefer mock factories over `importOriginal()`. Don't partial-mock `plugin-sdk/*` barrels; use local seams.
- Don't modify baselines/snapshots without approval.

## Prompt Cache Stability
- Deterministic ordering for all request assembly. Don't rewrite older transcript bytes. Truncate newest first. Regression test for cache-sensitive changes.

## Commits & PRs
- `$openclaw-pr-maintainer` for maintainer workflows. `/landpr` (`~/.codex/prompts/landpr.md`) for landing.
- Commit: `scripts/committer "<msg>" <file...>`. Concise messages. No merge commits on `main`; rebase.
- Bulk PR close (>5): confirm first.

## Multi-Agent Safety
- No `git stash`/worktree operations/branch switching unless requested.
- "Push": may `pull --rebase`. "Commit": scope to yours. Unrecognized files: keep going.
- Formatting-only diffs: auto-resolve. Semantic: ask.

## Collaboration & Safety
- High-confidence only; verify in code. Never update Carbon. Exact versions for patched deps.
- Patching deps: explicit approval. No streaming to external messaging.
- No version changes/publish without operator consent. Beta tags: matching npm suffix.
- Changelog: user-facing only, append to section end, one `Thanks @author` max. Pure tests don't need entry.

## Local Runtime / Platform
- "makeup" = mac app. Issues: `openclaw doctor`. Skills: `$openclaw-parallels-smoke`, `$openclaw-ghsa-maintainer`, `$openclaw-release-maintainer`.
- Never edit `node_modules`. Local ignores: `.git/info/exclude`. New `AGENTS.md` → add `CLAUDE.md` symlink.
- CLI progress: `src/cli/progress.ts`. Tables: `src/terminal/table.ts`. Palette: `src/terminal/palette.ts`.
- Gateway: restart via Mac app or `scripts/restart-mac.sh`. Logs: `./scripts/clawlog.sh`.
- SwiftUI: prefer `@Observable`/`@Bindable`. Connection providers: update all UI + docs.
- Version locations: `package.json`, `apps/android/app/build.gradle.kts`, iOS/macos `Info.plist`s, `docs/install/updating.md`. "Bump everywhere" = all except `appcast.xml`.
- Mobile pairing: `ws://` OK for private LAN/loopback; `wss://` for Tailscale/public.
- Session logs: `~/.openclaw/agents/<agentId>/sessions/*.jsonl`. Don't rebuild macOS app over SSH.
- exe.dev: `ssh exe.dev` → `ssh vm-name`. Update: `sudo npm i -g openclaw@latest`.

## Release & Security
- Release: `$openclaw-release-maintainer`. Advisory: `$openclaw-ghsa-maintainer`. Both = explicit approval.
- Creds: `~/.openclaw/credentials/`. Never commit real phone numbers/videos/live config.
- Signing credentials outside repo. Release runbook: private maintainer docs.
