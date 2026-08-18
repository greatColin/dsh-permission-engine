import { describe, it, expect } from 'vitest'
import { PermissionEngine } from '../lib/chain/engine.js'
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

const input = { tool: 'bash', args: { command: 'ls -la' } }

describe('PermissionEngine', () => {
  it('registers and runs links in order', async () => {
    const engine = new PermissionEngine({})
    engine.registerLink(new AllowLink(), { order: 100, registeredBy: 'dev' })
    const result = await engine.decide(input)
    expect(result.decision.kind).toBe('allow')
  })

  it('toggling enabled state takes effect on next decide', async () => {
    const engine = new PermissionEngine({})
    engine.registerLink(new DenyLink(), { order: 100, registeredBy: 'dev' })
    engine.setEnabled('deny', false)
    const result = await engine.decide(input)
    expect(result.decision.kind).toBe('allow')
    engine.setEnabled('deny', true)
    const denied = await engine.decide(input)
    expect(denied.decision.kind).toBe('deny')
  })

  it('reorder changes execution priority', async () => {
    const engine = new PermissionEngine({})
    engine.registerLink(new AllowLink(), { order: 100, registeredBy: 'dev' })
    engine.registerLink(new DenyLink(), { order: 200, registeredBy: 'dev' })
    engine.reorder(['deny', 'allow'])
    const result = await engine.decide(input)
    expect(result.decision.kind).toBe('deny')
  })

  it('unregister removes a link', async () => {
    const engine = new PermissionEngine({})
    engine.registerLink(new DenyLink(), { order: 100, registeredBy: 'dev' })
    engine.unregisterLink('deny')
    const result = await engine.decide(input)
    expect(result.decision.kind).toBe('allow')
  })

  it('runSelfTest delegates to the link', async () => {
    const engine = new PermissionEngine({})
    engine.registerLink(new AllowLink(), { order: 100, registeredBy: 'dev' })
    const results = await engine.runSelfTest('allow')
    expect(results).toEqual([])
  })

  it('listChainsForUI groups by registeredBy', async () => {
    const engine = new PermissionEngine({})
    engine.registerLink(new AllowLink(), { order: 100, registeredBy: 'a' })
    engine.registerLink(new DenyLink(), { order: 200, registeredBy: 'b' })
    const groups = engine.listChainsForUI()
    expect(groups.groups.map((g) => g.source)).toEqual(['a', 'b'])
    expect(groups.groups[0].links[0]).toMatchObject({
      id: 'allow',
      name: 'Allow',
      order: 100,
      enabled: true,
    })
  })
})
