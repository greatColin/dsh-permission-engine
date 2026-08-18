const READ_ONLY_COMMANDS = [
  'ls', 'cat', 'pwd', 'echo', 'grep', 'find', 'ps', 'top', 'htop', 'df', 'du',
  'whoami', 'date', 'head', 'tail', 'less', 'more', 'which', 'env', 'uname',
  'git status', 'git log', 'git diff', 'git branch', 'git show',
]

const UNSAFE_SUBSTRINGS = ['>', '>>', '|', ';', '&&', '||', '`', '$(']
const UNSAFE_TOKENS = ['rm', 'mv', 'cp', 'chmod', 'chown', 'curl', 'wget', 'sudo', 'su', 'dd', 'mkfs']

export function makeSafeReadLink(ChainLink) {
  return class SafeReadLink extends ChainLink {
    id = 'L1-safe-read'
    name = 'SafeRead'
    description = 'Allow curated read-only commands without side effects.'

    constructor(config = {}) {
      super({ tests: config.tests ?? SafeReadLink.tests })
    }

    decide(ctx) {
      const command = (ctx?.input?.args?.command ?? '').trim()
      if (!command) return this.pass()

      const raw = command.replace(/^\s+/, '')
      const firstWord = raw.split(/\s+/)[0]
      const multiWord = READ_ONLY_COMMANDS.find((prefix) => raw.startsWith(prefix))
      const matched = multiWord ?? firstWord

      if (!READ_ONLY_COMMANDS.includes(matched)) return this.pass()

      for (const token of UNSAFE_SUBSTRINGS) {
        if (command.includes(token)) return this.pass()
      }
      for (const token of UNSAFE_TOKENS) {
        const re = new RegExp(`\\b${token}\\b`)
        if (re.test(command)) return this.pass()
      }
      return this.allow()
    }

    static tests = [
      { name: 'allows ls -la', input: { args: { command: 'ls -la' } }, expected: 'allow' },
      { name: 'allows git status', input: { args: { command: 'git status --short' } }, expected: 'allow' },
      { name: 'passes redirection', input: { args: { command: 'ls -la > out.txt' } }, expected: 'pass' },
      { name: 'passes rm', input: { args: { command: 'rm file.txt' } }, expected: 'pass' },
    ]
  }
}
