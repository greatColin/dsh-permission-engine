import { describe, it, expect } from 'vitest'
import { ChainLink } from '@yourname/dsh-permission-engine/chain/link'
import { makeRememberLink } from '../../lib/links/remember.js'

const RememberLink = makeRememberLink(ChainLink)

function makeLink(ttlMs = 60000) {
  return new RememberLink({ ttlMs })
}

const input = { args: { command: 'ls -la' }, context: { sessionId: 's1' } }

describe('RememberLink', () => {
  it('passes before any decision is cached', async () => {
    const link = makeLink()
    const result = await link.decide({ input })
    expect(result).toBeNull()
  })

  it('returns cached allow after remember', async () => {
    const link = makeLink()
    link.remember(input, { kind: 'allow' })
    const result = await link.decide({ input })
    expect(result?.kind).toBe('allow')
  })

  it('returns cached deny after remember', async () => {
    const link = makeLink()
    link.remember(input, { kind: 'deny', reason: 'no' })
    const result = await link.decide({ input })
    expect(result?.kind).toBe('deny')
    expect(result?.reason).toBe('no')
  })

  it('passes after TTL expires', async () => {
    const link = makeLink(1)
    link.remember(input, { kind: 'allow' })
    await new Promise((r) => setTimeout(r, 10))
    const result = await link.decide({ input })
    expect(result).toBeNull()
  })
})
