import { describe, it, expect } from 'vitest'
import { ChainLink } from '@yourname/dsh-permission-engine/chain/link'
import { makeHardDenyLink } from '../../lib/links/hard-deny.js'

const HardDenyLink = makeHardDenyLink(ChainLink)

function decide(command) {
  const link = new HardDenyLink()
  return link.decide({ input: { args: { command } } })
}

describe('HardDenyLink', () => {
  it('denies rm -rf /', async () => {
    const result = await decide('rm -rf /')
    expect(result?.kind).toBe('deny')
  })

  it('denies fork bomb', async () => {
    const result = await decide(':(){ :|:& };:')
    expect(result?.kind).toBe('deny')
  })

  it('passes ordinary ls', async () => {
    const result = await decide('ls -la')
    expect(result).toBeNull()
  })

  it('self-tests pass', async () => {
    const link = new HardDenyLink()
    const results = await link.runSelfTest()
    expect(results.every((r) => r.passed)).toBe(true)
  })
})
