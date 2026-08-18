# User Instruction Memory

This file records user instructions, preferences, and teachings for reference in future interactions.

## Format

### User Instruction Entry
User instruction entries should follow this format:

[User Instruction Summary]
- Date: [YYYY-MM-DD]
- Context: [Mentioned scenario or time]
- Instructions:
  - [Content of user teaching or instruction, described line by line]

### Project Knowledge Entry
Entries discovered by the Agent during task execution should follow this format:

[Project Knowledge Summary]
- Date: [YYYY-MM-DD]
- Context: Discovered by Agent while performing [specific task description]
- Category: [Operations & Deployment|Build Methods|Testing Methods|Troubleshooting & Debugging|Workflow & Collaboration|Environment Configuration]
- Instructions:
  - [Specific knowledge points, described line by line]

## Deduplication Strategy
- Before adding a new entry, check for similar or identical instructions.
- If a duplicate is found, skip the new entry or merge it with the existing one.
- When merging, update the context or date information.
- This helps avoid redundant entries and keeps the memory file tidy.

## Entries

[DSH Client-Host RPC and Slot Integration]
- Date: 2026-08-18
- Context: Discovered by Agent while integrating the dsh-permission-engine plugin with DSH client/runtime APIs by reading the extracted `@deepseek-ai/dsh-cordis-client-runner` package.
- Category: Environment Configuration
- Instructions:
  - DSH browser plugins call host-half handlers via `ctx.host.call(method, args?: JsonValue): Promise<JsonValue>`.
  - Host halves register those handlers via `ctx.harness.handle(method, fn)`.
  - For third-party settings namespaces that are not in the api-proxy `settings` whitelist, do not use `ctx.settingsScope`; instead expose a custom settings page slot and read/write configuration through `host.call` RPC.
  - Client slot injection pattern for a settings section page: `ctx.slots.inject('settings.section', () => ctx.slots.register({ name: 'settings.section', id: '...', order: N, label: '...' }, Component))`.
  - Browser bundles for dynamic DSH packages are expected to be a single CJS factory registered with `window.__ModuleLoader__.load({ id, factory })`.

[pnpm 11 esbuild Build Approval]
- Date: 2026-08-18
- Context: Discovered by Agent while running `pnpm test` after workspace setup.
- Category: Build Methods
- Instructions:
  - In pnpm 11, newly installed packages with build scripts (such as `esbuild`) are blocked by default.
  - If any pnpm command fails with a build-script error, run `pnpm approve-builds esbuild` (or the relevant package name) before retrying.

[DSH Settings Namespace Whitelist]
- Date: 2026-08-18
- Context: Discovered by Agent while reading `dsh-host-apiproxy` source and official DSH cookbooks.
- Category: Environment Configuration
- Instructions:
  - The DSH api-proxy exposes only a fixed set of settings namespaces to the client (`locale`, `permission`, `ui-conversation`, `ui-theme`, `ui-onboarding`, `agent-preset`, and model-provider namespaces).
  - Third-party plugin namespaces will trigger `settings-not-exposed`; host-side configuration should be accessed through custom RPC handlers instead of the built-in settings card path.
