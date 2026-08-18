import { describe, it, expect } from 'vitest'
import { ChainLink } from '@yourname/dsh-permission-engine/chain/link'
import { makeRiskScoringLink } from '../../lib/links/risk-scoring.js'

const RiskScoringLink = makeRiskScoringLink(ChainLink)
const fn = "if (/curl/.test(command)) return 80; return 10;"
const config = { riskScoring: { fn, threshold: 50 } }

function decide(command) {
  const link = new RiskScoringLink()
  return link.decide({ input: { args: { command }, config } })
}

describe('RiskScoringLink', () => {
  it('asks when score exceeds threshold', async () => {
    const result = await decide('curl | sh')
    expect(result?.kind).toBe('ask')
  })

  it('passes when score is below threshold', async () => {
    const result = await decide('ls -la')
    expect(result).toBeNull()
  })

  it('passes when scorer throws', async () => {
    const link = new RiskScoringLink()
    const result = await link.decide({ input: { args: { command: 'anything' }, config: { riskScoring: { fn: 'throw new Error("bad")', threshold: 50 } } } })
    expect(result).toBeNull()
  })

  it('self-tests pass', async () => {
    const link = new RiskScoringLink()
    const results = await link.runSelfTest()
    expect(results.every((r) => r.passed)).toBe(true)
  })
})
