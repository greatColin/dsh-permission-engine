import { describe, it, expect, vi } from 'vitest'
import { PermissionEngine } from '@yourname/dsh-permission-engine/services/engine'
import { ChainLink } from '@yourname/dsh-permission-engine/chain/link'
import { registerLinks } from '../lib/index.js'

describe('registerLinks', () => {
  it('registers all 6 default links', async () => {
    const ctx = { logger: { info: vi.fn() } }
    const engine = new PermissionEngine(ctx, { useDefaults: false })
    await registerLinks(engine, ctx)

    const ids = engine.registrations.map((r) => r.link.id)
    expect(ids).toEqual([
      'L0-hard-deny',
      'L1-safe-read',
      'L2-allowlist',
      'L3a-risk-scoring',
      'L3b-llm-review',
      'L4-remember',
    ])
  })

  it('hard-deny and safe-read chain yields correct results', async () => {
    const ctx = { logger: { info: vi.fn() } }
    const engine = new PermissionEngine(ctx, { useDefaults: false })
    await registerLinks(engine, ctx)

    const deny = await engine.decide({ args: { command: 'rm -rf /' } })
    expect(deny.decision.kind).toBe('deny')

    const allow = await engine.decide({ args: { command: 'ls -la' } })
    expect(allow.decision.kind).toBe('allow')
  })
})
