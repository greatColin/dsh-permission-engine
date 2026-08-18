# dsh-permission-engine

A DSH plugin that adds a configurable permission chain to the `tools/pre-execute` gate.

It ships as two packages:

- `@yourname/dsh-permission-engine` — the framework plugin (HOST half + CLIENT half shell).
- `@yourname/dsh-permission-engine-defaults` — default link implementations (hard-deny, safe-read, allowlist, risk scoring, LLM review, memory).

## Current phase

This is the **first-phase shell**: the HOST half is fully functional, the CLIENT half registers a `settings.section` page in DSH and exposes `host.call` RPC handlers. The settings page is a placeholder; the next phase will add chain editing.

## Quick test (no DSH required)

```bash
pnpm install
pnpm test                 # 59 tests
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
npx @deepseek-ai/dsh web
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

The CLIENT half injects a tab into `settings.section` with id `permission-engine`. In DSH's settings UI you will see a **Permission Engine** tab. Right now it shows a placeholder; editing will come in the next phase.

## Why not `ctx.settingsScope`?

DSH's api-proxy only whitelists a fixed set of settings namespaces (`locale`, `permission`, `ui-theme`, etc.). Third-party namespaces get `settings-not-exposed`. Therefore the CLIENT half does **not** use `ctx.settingsScope`; it talks to the HOST half through `host.call` RPC.

## Client RPC handlers

The HOST half registers these methods on `ctx.harness.handle`:

- `permissionEngine.listChains` → `{ groups }`
- `permissionEngine.runSelfTest` → `{ id, results }`
- `permissionEngine.updateChain` → `{ id, enabled?, order? }`
- `permissionEngine.reload` → `{ ok: true }`

The CLIENT half uses `ctx.host.call(method, payload)` to invoke them.

## Project structure

```
packages/dsh-permission-engine/
  lib/index.js              # HOST half entry
  lib/client.js             # CLIENT half source (ESM)
  lib/client.bundle.js      # CLIENT half bundle for DSH loader (CJS factory)
  lib/chain/                # ChainLink, PermissionChain, Loader, sandbox
  lib/services/             # PermissionEngine
  lib/integration/          # DshHooks, AuditLogService, settings, host-rpc
  lib/dev/                  # Dev links (optional)
packages/dsh-permission-engine-defaults/
  lib/index.js              # registerLinks(engine, ctx)
  lib/links/                # L0-L4 default links
```

## License

MIT
