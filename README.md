# dsh-permission-engine

A DSH plugin that adds a configurable permission chain to the `tools/pre-execute` gate.

It ships as two packages:

- `@yourname/dsh-permission-engine` — the framework plugin (HOST half + CLIENT half).
- `@yourname/dsh-permission-engine-defaults` — default link implementations (hard-deny, safe-read, allowlist, risk scoring, LLM review, memory).

## Status

**Work in progress.** End-to-end self-test against a live DSH web instance is in progress. The core works, but some UX polish is pending.

### What works

- HOST half:
  - `PermissionEngine` service with chain ordering, enable/disable, reorder, self-test
  - `DshHooks` gates every `tools/pre-execute` call
  - `AuditLogService` persists decisions to `ctx.storageDomain`
  - `ConfigStorage` persists inline links, enabled flags, and order to `ctx.storageDomain`
  - `registerHostRpc` exposes `permissionEngine.*` to the client half
- Defaults package:
  - L0 HardDeny, L1 SafeRead, L2 Allowlist, L3a RiskScoring, L3b LlmReview, L4 Remember
- CLIENT half:
  - Settings page injected as a `settings.section` tab
  - Grouped chain list with toggle, reorder, self-test modal, remove
  - Inline link editor form (id, name, description, code)
  - i18n (en, zh) via `ctx.locale.bind`
- DSH integration:
  - `lib/bundle.cordis.patch.yml` registers the framework as a profile layer
  - `scripts/bundle-client.mjs` produces a DSH-ready `client.bundle.js`
  - 68/68 unit + integration tests pass

### What is still rough

- No end-to-end automated test against a live DSH web — verification is manual for now.
- Inline link editor has a syntax error UI but no inline linting.
- No import/export of chain configuration.
- No preset templates (e.g., "strict", "permissive", "balanced").

## Quick test (no DSH required)

```bash
pnpm install
pnpm test                 # 68 tests
pnpm demo:host            # console decision demo
pnpm demo:server          # browser demo at http://localhost:3456
pnpm build:client         # regenerate lib/client.bundle.js from lib/client.js
```

## How to plug into DSH

There are two ways to use this plugin with DSH:

1. **npx / prebuilt DSH CLI** — use `dsh plugin --profile web add <path>`.
2. **DSH source monorepo** — symlink/copy packages into the workspace.

### Option A: npx DSH CLI (no source checkout)

This works with `npx @deepseek-ai/dsh web`.

```bash
# 1. Install the framework plugin as a profile bundle
npx @deepseek-ai/dsh plugin --profile web add /absolute/path/to/dsh-permission-engine/packages/dsh-permission-engine

# 2. Install the defaults package so the framework can load it
npx @deepseek-ai/dsh plugin --profile web add /absolute/path/to/dsh-permission-engine/packages/dsh-permission-engine-defaults

# 3. Start DSH web
DSH_HOME=/path/to/dsh-home npx @deepseek-ai/dsh web
```

The framework package declares `dsh.bundle.patch`, so `dsh plugin add` automatically inserts it into the web profile layer stack.

### Option B: DSH source monorepo

If you have the DSH source checkout and want to develop side-by-side:

```bash
# inside your DSH checkout
ln -s /path/to/dsh-permission-engine/packages/dsh-permission-engine packages/plugins/dsh-permission-engine
ln -s /path/to/dsh-permission-engine/packages/dsh-permission-engine-defaults packages/plugins/dsh-permission-engine-defaults
```

Then add the plugin paths to DSH's `pnpm-workspace.yaml`:

```yaml
packages:
  - 'packages/*'
  - 'packages/plugins/*'
```

Run `pnpm install` in the DSH checkout to link them, then boot DSH normally.

### Open the settings page

After DSH web starts, open the **Settings** tab. You should see a **Permission Engine** menu item (order: 100, after the built-in Models / Plugins / etc.).

Click into it to see the chain management page.

## Architecture

```
DSH agent decides to call a tool
    ↓
our DshHooks (tools/pre-execute waterfall listener)
    ↓
PermissionEngine.decide(input)
    ↓
PermissionChain runs each enabled link in order
    ↓
first non-pass decision wins (allow / deny / ask)
    ↓
if pass: tool executes
if allow / deny / ask: that decision wins
```

**Independent of DSH's built-in presets.** DSH's read Only / workspace write / Full access controls which tools are exposed. Our chain runs in the `tools/pre-execute` waterfall and decides what to do for each call. To make our engine the sole gatekeeper, select Full access in DSH and configure your rules in Permission Engine.

## Why not `ctx.settingsScope`?

DSH's api-proxy only whitelists a fixed set of settings namespaces (`locale`, `permission`, `ui-theme`, etc.). Third-party namespaces get `settings-not-exposed`. Therefore the CLIENT half does **not** use `ctx.settingsScope`; it talks to the HOST half through `host.call` RPC and persists state via `ctx.storageDomain` on the HOST side.

## Client RPC handlers

The HOST half registers these methods on `ctx.harness.handle`:

- `permissionEngine.listChains` → `{ groups: [{ source, links: [...] }] }`
- `permissionEngine.runSelfTest` → `{ id }` → `[{ name, passed, ... }]`
- `permissionEngine.updateChain` → `{ id, enabled?, order? }` (persists state)
- `permissionEngine.addInlineLink` → `{ id, name, description, code }` (persists state)
- `permissionEngine.removeLink` → `{ id }` (persists state)
- `permissionEngine.reload` → `{ ok: true }`

The CLIENT half uses the closure parameter `host.call(method, payload)` to invoke them.

## Project structure

```
packages/dsh-permission-engine/
  lib/index.js              # HOST half entry
  lib/client.js             # CLIENT half source (ESM)
  lib/client.bundle.js      # CLIENT half bundle for DSH loader (CJS factory)
  lib/chain/                # ChainLink, PermissionChain, Loader, sandbox
  lib/services/             # PermissionEngine
  lib/integration/          # DshHooks, AuditLogService, ConfigStorage, settings, host-rpc
  lib/dev/                  # Dev links (optional)
  tests/                    # vitest
packages/dsh-permission-engine-defaults/
  lib/index.js              # registerLinks(engine, ctx)
  lib/links/                # L0-L4 default links
  tests/                    # vitest
```

## License

MIT