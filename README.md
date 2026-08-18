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

### 1. Put the packages where DSH can find them

Because DSH's rc packages depend on internal unpublished packages, you need to work inside a DSH source checkout. The simplest way is to copy or symlink this repo's two packages into DSH's workspace:

```bash
# inside your DSH checkout
ln -s /path/to/dsh-permission-engine/packages/dsh-permission-engine packages/plugins/dsh-permission-engine
ln -s /path/to/dsh-permission-engine/packages/dsh-permission-engine-defaults packages/plugins/dsh-permission-engine-defaults
```

Then add the package paths to DSH's `pnpm-workspace.yaml` so pnpm links them.

### 2. Enable the plugin in DSH config

Create or edit `cordis.patch.yml` (or the equivalent DSH config file) and add:

```yaml
plugins:
  permission-engine:
    package: '@yourname/dsh-permission-engine'
    # optional: use your own defaults package or disable defaults
    # config:
    #   useDefaults: true
```

When DSH boots it will:

- Load the HOST half from `lib/index.js`.
- Register the `PermissionEngine` service.
- Hook `tools/pre-execute` so every bash/fs/web tool decision flows through the chain.
- Expose RPC handlers on `ctx.harness.handle('permissionEngine.*', ...)`.
- Serve the CLIENT half bundle (`lib/client.bundle.js`) through DSH's plugin loader.

### 3. Open the settings page

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
