import { describe, it, expect } from 'vitest'
import { ChainLink } from '@yourname/dsh-permission-engine/chain/link'
import { makeAllowlistLink } from '../../lib/links/allowlist.js'

const AllowlistLink = makeAllowlistLink(ChainLink)
const allowlist = ['npm run dev', 'git status']

function decide(command) {
  const link = new AllowlistLink()
  return link.decide({ input: { args: { command }, config: { allowlist } } })
}

describe('AllowlistLink', () => {
  it('allows exact prefix match', async () => {
    const result = await decide('npm run dev')
    expect(result?.kind).toBe('allow')
  })

  it('allows longer command under prefix', async () => {
    const result = await decide('git status --short')
    expect(result?.kind).toBe('allow')
  })

  it('passes non-matching command', async () => {
    const result = await decide('rm file.txt')
    expect(result).toBeNull()
  })

  it('self-tests pass', async () => {
    const link = new AllowlistLink()
    const results = await link.runSelfTest()
    expect(results.every((r) => r.passed)).toBe(true)
  })
})
