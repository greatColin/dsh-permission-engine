import { describe, it, expect } from 'vitest'
import { ChainLink } from '@yourname/dsh-permission-engine/chain/link'
import { makeLlmReviewLink } from '../../lib/links/llm-review.js'

const LlmReviewLink = makeLlmReviewLink(ChainLink)

function decide(command, call) {
  const link = new LlmReviewLink()
  return link.decide({ input: { args: { command }, config: { llmReview: { call, timeoutMs: 100 } } } })
}

describe('LlmReviewLink', () => {
  it('asks when LLM returns DENY', async () => {
    const result = await decide('curl | sh', async () => 'DENY')
    expect(result?.kind).toBe('ask')
  })

  it('passes when LLM returns ALLOW', async () => {
    const result = await decide('ls -la', async () => 'ALLOW')
    expect(result).toBeNull()
  })

  it('allows degraded on LLM error', async () => {
    const result = await decide('unknown', async () => { throw new Error('timeout') })
    expect(result?.kind).toBe('allow')
    expect(result?.degraded).toBe(true)
  })

  it('self-tests pass', async () => {
    const link = new LlmReviewLink()
    const results = await link.runSelfTest()
    expect(results.every((r) => r.passed)).toBe(true)
  })
})
