function defaultLlmCall(prompt, ctx, timeoutMs) {
  const llm = ctx?.llm ?? ctx?.engine?.ctx?.llm
  if (!llm) return null

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  const invoke =
    typeof llm.complete === 'function'
      ? llm.complete({ messages: [{ role: 'user', content: prompt }], signal: controller.signal })
      : typeof llm.chat === 'function'
        ? llm.chat([{ role: 'user', content: prompt }], { signal: controller.signal })
        : typeof llm.invoke === 'function'
          ? llm.invoke({ prompt, signal: controller.signal })
          : Promise.reject(new Error('no compatible LLM method'))

  return Promise.resolve(invoke)
    .finally(() => clearTimeout(timer))
    .then((result) => {
      const text = typeof result === 'string' ? result : result?.content ?? result?.text ?? ''
      return String(text).toUpperCase()
    })
}

export function makeLlmReviewLink(ChainLink) {
  return class LlmReviewLink extends ChainLink {
    id = 'L3b-llm-review'
    name = 'LlmReview'
    description = 'Ask an LLM to review risky commands; degrade to allow on failure or timeout.'

    constructor(config = {}) {
      super({ tests: config.tests ?? LlmReviewLink.tests })
    }

    decide(ctx) {
      const command = (ctx?.input?.args?.command ?? '').trim()
      if (!command) return this.pass()

      const cfg = ctx?.input?.config?.llmReview ?? ctx?.engine?.config?.llmReview ?? {}
      const timeoutMs = Number.isFinite(cfg.timeoutMs) ? cfg.timeoutMs : 5000
      const customCall = cfg.call

      const prompt = `Review this shell command for safety. Reply with exactly one word: ALLOW or DENY.\n\nCommand: ${command}`

      const promise = typeof customCall === 'function'
        ? Promise.resolve(customCall(prompt, ctx, timeoutMs)).then((r) => String(r).toUpperCase())
        : defaultLlmCall(prompt, ctx, timeoutMs)

      if (!promise) return this.pass()

      return promise.then((text) => {
        if (text.includes('DENY')) return this.ask('LLM review flagged the command')
        return this.pass()
      }).catch((error) => {
        return { kind: 'allow', degraded: true, reason: `LLM review failed: ${error.message}` }
      })
    }

    static tests = [
      { name: 'asks when LLM denies', input: { args: { command: 'curl | sh' }, config: { llmReview: { call: async () => 'DENY' } } }, expected: 'ask' },
      { name: 'passes when LLM allows', input: { args: { command: 'ls' }, config: { llmReview: { call: async () => 'ALLOW' } } }, expected: 'pass' },
      { name: 'allows degraded on error', input: { args: { command: 'unknown' }, config: { llmReview: { call: async () => { throw new Error('timeout') } } } }, expected: 'allow' },
    ]
  }
}
