export function makeHardDenyLink(ChainLink) {
  return class HardDenyLink extends ChainLink {
    id = 'L0-hard-deny'
    name = 'HardDeny'
    description = 'Deny commands matching known dangerous patterns.'

    constructor(config = {}) {
      super({ tests: config.tests ?? HardDenyLink.tests })
    }

    decide(ctx) {
      const command = (ctx?.input?.args?.command ?? '').trim()
      if (!command) return this.pass()

      const patterns = [
        /^rm\s+-rf\s+\/(\s|$)/,
        /:\s*\(\s*\)\s*\{[^}]*:\|:\s*&\s*\}\s*;\s*:/,
        /\bmkfs\.\w+\b/,
        /\bdd\b.*of\s*=\s*\/dev\/[sh]d[a-z]/,
        /[><]\s*\/dev\/[sh]d[a-z]/,
        /\bchmod\s+(-R\s+)?777\s+\/(\s|$)/,
        /\bchown\s+-R\s+[^/]*\s+\/(\s|$)/,
        /\bwget\b.*\|\s*\bsh\b/,
        /\bcurl\b.*\|\s*\bsh\b/,
      ]

      for (const pattern of patterns) {
        if (pattern.test(command)) {
          return this.deny(`hard deny: command matches dangerous pattern ${pattern.source}`)
        }
      }
      return this.pass()
    }

    static tests = [
      { name: 'denies rm -rf /', input: { args: { command: 'rm -rf /' } }, expected: 'deny' },
      { name: 'denies fork bomb', input: { args: { command: ':(){ :|:& };:' } }, expected: 'deny' },
      { name: 'passes safe ls', input: { args: { command: 'ls -la' } }, expected: 'pass' },
    ]
  }
}
