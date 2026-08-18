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

export class PlainLink extends ChainLink {
  constructor(obj) {
    super()
    this.id = obj.id
    this.name = obj.name
    this.description = obj.description
    this._decide = obj.decide?.bind(this)
    this._selfTest = obj.selfTest?.bind(this)
    this._remember = obj.remember?.bind(this)
  }

  decide(ctx) {
    return this._decide?.(ctx)
  }

  async runSelfTest() {
    if (this._selfTest) return this._selfTest()
    return super.runSelfTest()
  }

  async remember(input, decision) {
    return this._remember?.(input, decision)
  }
}

export function defineLink(linkOrClass, config) {
  if (linkOrClass instanceof ChainLink) return linkOrClass
  return new linkOrClass(config)
}
