# DSH Permission Engine Development Progress

## Goal

Build the `@yourname/dsh-permission-engine` DSH plugin: a configurable responsibility chain that gates `tools/pre-execute`, ships default links in a separate `@yourname/dsh-permission-engine-defaults` package, and exposes a browser settings UI through DSH's client slot system.

## Current Status

First-phase integration shell is complete. The plugin can now be dropped into DSH by adding it to `cordis.yml` / `cordis.patch.yml`. The CLIENT half registers a `settings.section` page, and the HOST half exposes `permissionEngine.*` RPC handlers via `ctx.harness.handle`. The settings page is a placeholder; full chain editing is the next phase.

- 59/59 tests pass.
- `pnpm demo:host` / `pnpm demo:server` still work.
- `pnpm build:client` regenerates the DSH-ready `lib/client.bundle.js`.

## Completed Steps

### Step 1: Workspace + chain core

- [x] pnpm workspace with two packages
- [x] `ChainLink`, `PermissionChain`, `PermissionEngine` skeleton
- [x] Chain ordering, enable/disable, reorder, self-test
- [x] Tests: chain, engine, link

### Step 2: Loader + sandbox

- [x] Loader: directory, inline code, npm package sources
- [x] Inline sandbox: `new Function` + variable masking + static scan for `import`/`require`
- [x] Demo link template
- [x] Tests: loader, loader-inline

### Step 3a: Engine + DSH integration (HOST half)

- [x] `PermissionEngine` service
- [x] `DshHooks` on `tools/pre-execute`
- [x] `AuditLogService` over `ctx.storageDomain`
- [x] Settings registration helper
- [x] Defaults package dynamic loader with `defaultsPackage` override for local demos
- [x] `tests/integration/full-flow.test.js`

### Step 3b: Defaults package 6 links

- [x] L0 HardDeny
- [x] L1 SafeRead
- [x] L2 Allowlist
- [x] L3a RiskScoring
- [x] L3b LlmReview
- [x] L4 Remember
- [x] 27 defaults-package tests

### Phase 1 demo + integration shell

- [x] `demo/host-demo.mjs` — console demo of the host half
- [x] `demo/serve.mjs` + `demo/client-demo.html` — browser demo with React + REST endpoints
- [x] `package.json` demo scripts
- [x] `lib/client.js` registers a `settings.section` slot with i18n
- [x] HOST-side RPC handlers: `permissionEngine.listChains`, `permissionEngine.runSelfTest`, `permissionEngine.updateChain`, `permissionEngine.reload`
- [x] `scripts/bundle-client.mjs` + `pnpm build:client` produces DSH-ready `lib/client.bundle.js`
- [x] `lib/bundle.cordis.patch.yml` + `dsh.bundle.patch` metadata for `dsh plugin add`
- [x] `README.md` with both npx and source-monorepo integration instructions

## Next Step

Add full chain editing in the CLIENT half (enable/disable, reorder, inline link editor) and corresponding RPC handlers. Per the development rules, I will stop after completing that full Step 3c and ask for your review before moving to Step 4.

## Key Design Decisions

- D1: `tools/pre-execute` returns `allow` via `next()`, `deny`/`ask` via typed decision object.
- D2: Defaults package is loaded dynamically; framework never hard-imports it.
- D3: Inline sandbox uses `new Function` with explicit variable masking and static `import`/`require` rejection.
- D4: Client UI is React-based and uses `host.call` RPC instead of `ctx.settingsScope` because third-party namespaces are not exposed by the DSH api-proxy whitelist.
- D5: Audit log persists to `ctx.storageDomain`.
- D6: LLM review degrades to `allow` with `degraded: true` on timeout/error.
- D7: Sandbox mode is read from `ctx.get('sandbox')`.
- D8: Client bundle is a single CJS factory for DSH's `__ModuleLoader__`.
- D9: `defaultsPackage` config lets local demos load the defaults package by relative path when bare workspace resolution is unavailable outside Vitest.

## How to Test

```bash
# Run all tests
pnpm test

# Console host demo
pnpm demo:host

# Browser demo server (visit the printed URL)
pnpm demo:server

# Regenerate the DSH client bundle
pnpm build:client
```

## References

- DSH extension cookbook: `extension-cookbook.md`
- DSH settings card cookbook: `adding-a-settings-card.md`
- DSH client-runtime package (extracted): `deepseek-ai-dsh-client-runtime-0.0.1-rc.1`
- DSH cordis-client-runner package (extracted): `deepseek-ai-dsh-cordis-client-runner-0.0.1-rc.3`
- DSH host api-proxy whitelist: `dsh-host-apiproxy lib/index.js`
