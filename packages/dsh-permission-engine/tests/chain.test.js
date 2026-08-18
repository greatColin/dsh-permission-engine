import { describe, it, expect } from 'vitest'
import { PermissionChain } from '../lib/chain/chain.js'
import { ChainLink } from '../lib/chain/link.js'

class AllowLink extends ChainLink {
  id = 'allow'
  name = 'Allow'
  description = 'always allow'
  decide() {
    return this.allow()
  }
}

class DenyLink extends ChainLink {
  id = 'deny'
  name = 'Deny'
  description = 'always deny'
  decide() {
    return this.deny('blocked')
  }
}

class ThrowingLink extends ChainLink {
  id = 'throw'
  name = 'Throw'
  description = 'always throws'
  decide() {
    throw new Error('boom')
  }
}

const input = { tool: 'bash', args: { command: 'ls -la' } }

describe('PermissionChain', () => {
  it('runs links in ascending order', async () => {
    const order = []
    class TracingLink extends ChainLink {
      constructor(id) {
        super()
        this.id = id
        this.name = id
        this.description = id
      }
      decide() {
        order.push(this.id)
        return this.pass()
      }
    }
    const chain = new PermissionChain([
      { link: new TracingLink('b'), order: 200, enabled: true },
      { link: new TracingLink('a'), order: 100, enabled: true },
    ])
    const result = await chain.run(input)
    expect(order).toEqual(['a', 'b'])
    expect(result.decision.kind).toBe('allow')
  })

  it('returns the first non-null decision', async () => {
    const chain = new PermissionChain([
      { link: new AllowLink(), order: 100, enabled: true },
      { link: new DenyLink(), order: 200, enabled: true },
    ])
    const result = await chain.run(input)
    expect(result.decision).toEqual({ kind: 'allow' })
    expect(result.history).toHaveLength(1)
  })

  it('allows when every link passes', async () => {
    const chain = new PermissionChain([
      { link: new AllowLink(), order: 100, enabled: false },
    ])
    const result = await chain.run(input)
    expect(result.decision.kind).toBe('allow')
    expect(result.history).toHaveLength(0)
  })

  it('skips disabled links', async () => {
    const chain = new PermissionChain([
      { link: new DenyLink(), order: 100, enabled: false },
      { link: new AllowLink(), order: 200, enabled: true },
    ])
    const result = await chain.run(input)
    expect(result.decision).toEqual({ kind: 'allow' })
  })

  it('isolates a throwing link and continues', async () => {
    const chain = new PermissionChain([
      { link: new ThrowingLink(), order: 100, enabled: true },
      { link: new DenyLink(), order: 200, enabled: true },
    ])
    const result = await chain.run(input)
    expect(result.decision).toEqual({ kind: 'deny', reason: 'blocked' })
    expect(result.history).toHaveLength(2)
    expect(result.history[0].outcome).toBe('error')
    expect(result.history[0].error.message).toBe('boom')
    expect(result.history[1].outcome).toBe('decided')
  })

  it('records history for pass and decide steps', async () => {
    const chain = new PermissionChain([
      { link: new DenyLink(), order: 100, enabled: true },
    ])
    const result = await chain.run(input)
    expect(result.history[0]).toMatchObject({
      linkId: 'deny',
      linkName: 'Deny',
      outcome: 'decided',
    })
    expect(result.history[0].decision).toEqual({ kind: 'deny', reason: 'blocked' })
    expect(typeof result.history[0].durationMs).toBe('number')
  })
})
