import { describe, it, expect } from 'vitest'
import { ChainLink, defineLink } from '../lib/chain/link.js'

const input = { tool: 'bash', args: { command: 'ls -la' } }

class PatternLink extends ChainLink {
  static tests = [
    { name: 'allows read', input: { tool: 'bash', args: { command: 'ls -la' } }, expected: 'allow' },
    { name: 'passes on write', input: { tool: 'bash', args: { command: 'touch a' } }, expected: 'pass' },
  ]

  id = 'pattern'
  name = 'Pattern'
  description = 'patterns'

  decide(ctx) {
    if (ctx.input.args.command?.startsWith('ls')) return this.allow()
    return this.pass()
  }
}

describe('ChainLink', () => {
  it('collects tests from static declaration', async () => {
    const link = new PatternLink()
    expect(link.tests).toHaveLength(2)
    const results = await link.runSelfTest()
    expect(results).toEqual([
      { name: 'allows read', passed: true, actual: 'allow', expected: 'allow' },
      { name: 'passes on write', passed: true, actual: 'pass', expected: 'pass' },
    ])
  })

  it('prefers config.tests over static tests', async () => {
    const custom = [{ name: 'x', input, expected: 'pass' }]
    const link = new PatternLink({ tests: custom })
    expect(link.tests).toEqual(custom)
  })

  it('reports a failing test case', async () => {
    const link = new PatternLink({ tests: [{ name: 'x', input, expected: 'deny' }] })
    const results = await link.runSelfTest()
    expect(results[0].passed).toBe(false)
    expect(results[0].actual).toBe('allow')
  })

  it('reports an erroring test case', async () => {
    class BrokenLink extends ChainLink {
      id = 'b'
      name = 'B'
      description = 'b'
      decide() {
        throw new Error('nope')
      }
    }
    const link = new BrokenLink({ tests: [{ name: 'x', input, expected: 'pass' }] })
    const results = await link.runSelfTest()
    expect(results[0].passed).toBe(false)
    expect(results[0].actual).toBe('error')
    expect(results[0].error.message).toBe('nope')
  })

  it('helpers return canonical decision shapes', () => {
    const link = new PatternLink()
    expect(link.allow()).toEqual({ kind: 'allow' })
    expect(link.deny('why')).toEqual({ kind: 'deny', reason: 'why' })
    expect(link.ask('sure?')).toEqual({ kind: 'ask', reason: 'sure?' })
    expect(link.pass()).toBeNull()
  })
})

describe('defineLink', () => {
  it('returns the instance when already a link', () => {
    const link = new PatternLink()
    expect(defineLink(link)).toBe(link)
  })

  it('instantiates a class', () => {
    const link = defineLink(PatternLink)
    expect(link).toBeInstanceOf(PatternLink)
  })
})
