export function makeRememberLink(ChainLink) {
  return class RememberLink extends ChainLink {
    id = 'L4-remember'
    name = 'Remember'
    description = 'Cache recent allow/deny decisions with TTL.'

    constructor(config = {}) {
      super({ tests: config.tests ?? RememberLink.tests })
      this.cache = new Map()
      this.ttlMs = Number.isFinite(config.ttlMs) ? config.ttlMs : 60000
    }

    #key(input) {
      const sessionId = input?.context?.sessionId ?? '_'
      const command = input?.args?.command ?? ''
      return `${sessionId}::${command}`
    }

    decide(ctx) {
      const key = this.#key(ctx?.input)
      const entry = this.cache.get(key)
      if (!entry) return this.pass()
      if (Date.now() > entry.expires) {
        this.cache.delete(key)
        return this.pass()
      }
      return { ...entry.decision }
    }

    remember(input, decision) {
      if (!decision || decision.kind === 'pass') return
      const key = this.#key(input)
      this.cache.set(key, { decision: { ...decision }, expires: Date.now() + this.ttlMs })
    }

    static tests = [
      { name: 'passes unknown command', input: { args: { command: 'ls' }, context: { sessionId: 's1' } }, expected: 'pass' },
    ]
  }
}
