import { describe, it, expect } from 'vitest'
import { ChainLink } from '@yourname/dsh-permission-engine/chain/link'
import { makeSafeReadLink } from '../../lib/links/safe-read.js'

const SafeReadLink = makeSafeReadLink(ChainLink)

function decide(command) {
  const link = new SafeReadLink()
  return link.decide({ input: { args: { command } } })
}

describe('SafeReadLink', () => {
  it('allows ls -la', async () => {
    const result = await decide('ls -la')
    expect(result?.kind).toBe('allow')
  })

  it('allows git status', async () => {
    const result = await decide('git status --short')
    expect(result?.kind).toBe('allow')
  })

  it('passes commands with redirection', async () => {
    const result = await decide('ls -la > out.txt')
    expect(result).toBeNull()
  })

  it('passes rm', async () => {
    const result = await decide('rm file.txt')
    expect(result).toBeNull()
  })

  it('self-tests pass', async () => {
    const link = new SafeReadLink()
    const results = await link.runSelfTest()
    expect(results.every((r) => r.passed)).toBe(true)
  })
})
