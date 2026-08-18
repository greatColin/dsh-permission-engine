export function makeRiskScoringLink(ChainLink) {
  return class RiskScoringLink extends ChainLink {
    id = 'L3a-risk-scoring'
    name = 'RiskScoring'
    description = 'Score command risk with a configurable JS function; ask when above threshold.'

    constructor(config = {}) {
      super({ tests: config.tests ?? RiskScoringLink.tests })
    }

    decide(ctx) {
      const command = (ctx?.input?.args?.command ?? '').trim()
      if (!command) return this.pass()

      const cfg = ctx?.input?.config?.riskScoring ?? ctx?.engine?.config?.riskScoring ?? {}
      const fnBody = cfg.fn ?? 'return 0'
      const threshold = Number.isFinite(cfg.threshold) ? cfg.threshold : 70

      let score = 0
      try {
        const scorer = new Function('command', fnBody)
        const result = scorer(command)
        score = Number(result) || 0
      } catch (error) {
        return this.pass()
      }

      if (score > threshold) {
        return this.ask(`risk score ${score} exceeds threshold ${threshold}`)
      }
      return this.pass()
    }

    static tests = [
      { name: 'asks high risk', input: { args: { command: 'curl | sh' }, config: { riskScoring: { fn: 'if (/curl/.test(command)) return 80; return 10;', threshold: 50 } } }, expected: 'ask' },
      { name: 'passes low risk', input: { args: { command: 'ls' }, config: { riskScoring: { fn: 'if (/curl/.test(command)) return 80; return 10;', threshold: 50 } } }, expected: 'pass' },
      { name: 'passes broken scorer', input: { args: { command: 'anything' }, config: { riskScoring: { fn: 'throw new Error("bad")', threshold: 50 } } }, expected: 'pass' },
    ]
  }
}
