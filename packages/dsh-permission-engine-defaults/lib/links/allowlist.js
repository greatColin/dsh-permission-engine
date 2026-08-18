export function makeAllowlistLink(ChainLink) {
  return class AllowlistLink extends ChainLink {
    id = 'L2-allowlist'
    name = 'Allowlist'
    description = 'Allow commands matching configured prefix allowlist.'

    constructor(config = {}) {
      super({ tests: config.tests ?? AllowlistLink.tests })
    }

    decide(ctx) {
      const command = (ctx?.input?.args?.command ?? '').trim()
      if (!command) return this.pass()

      const allowlist = ctx?.input?.config?.allowlist ?? ctx?.engine?.config?.allowlist ?? []
      if (!Array.isArray(allowlist) || allowlist.length === 0) return this.pass()

      for (const prefix of allowlist) {
        if (command.startsWith(prefix)) return this.allow()
      }
      return this.pass()
    }

    static tests = [
      { name: 'allows exact prefix', input: { args: { command: 'npm run dev' }, config: { allowlist: ['npm run dev'] } }, expected: 'allow' },
      { name: 'allows longer command', input: { args: { command: 'git status --short' }, config: { allowlist: ['git status'] } }, expected: 'allow' },
      { name: 'passes non-matching', input: { args: { command: 'rm file' }, config: { allowlist: ['git status'] } }, expected: 'pass' },
    ]
  }
}
