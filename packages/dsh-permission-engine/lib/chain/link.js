export class ChainLink {
  static tests = []

  constructor(config) {
    this.tests = config?.tests ?? this.constructor.tests
  }

  async runSelfTest() {
    const results = []
    for (const test of this.tests) {
      const chainCtx = { input: test.input, tags: {}, history: [] }
      try {
        const actual = await this.decide(chainCtx)
        const passed = test.expected === 'pass' ? actual === null : actual?.kind === test.expected
        results.push({
          name: test.name,
          passed,
          actual: actual?.kind ?? 'pass',
          expected: test.expected,
        })
      } catch (error) {
        results.push({ name: test.name, passed: false, actual: 'error', expected: test.expected, error })
      }
    }
    return results
  }

  allow() {
    return { kind: 'allow' }
  }

  deny(reason) {
    return { kind: 'deny', reason }
  }

  ask(reason) {
    return { kind: 'ask', reason }
  }

  pass() {
    return null
  }
}

export function defineLink(linkOrClass, config) {
  if (linkOrClass instanceof ChainLink) return linkOrClass
  return new linkOrClass(config)
}
