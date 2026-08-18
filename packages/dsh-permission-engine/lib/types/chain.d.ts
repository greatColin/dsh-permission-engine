/** Core type contracts for dsh-permission-engine chains. */

import type { ChainLink as ChainLinkClass } from '../chain/link.js'
export { ChainLink } from '../chain/link.js'

/** A tool call arriving at the decision chain. */
export interface DecisionInput {
  tool: string
  args: Record<string, unknown>
  context?: DecisionContext
}

/** Optional ambient context a link can read for more informed decisions. */
export interface DecisionContext {
  sessionId?: string
  workspaceId?: string
  sandboxed?: boolean
  isGitRepo?: boolean
  recentUserMessages?: string[]
  [key: string]: unknown
}

/** The final decision one link can return. */
export type DecisionKind = 'allow' | 'deny' | 'ask'

export interface Decision {
  kind: DecisionKind
  reason?: string
  degraded?: boolean
}

/** A link's null result means "no opinion — continue to the next link". */
export type LinkResult = Decision | null

/** One self-test case declared by a link (via static tests or config.tests). */
export interface TestCase {
  name: string
  input: DecisionInput
  /** 'pass' means the link returns null (no opinion); otherwise a decision kind. */
  expected: 'pass' | DecisionKind
}

/** One step record appended to ChainContext.history by PermissionChain. */
export interface ChainStep {
  linkId: string
  linkName: string
  outcome: 'skipped' | 'passed' | 'decided' | 'error'
  decision?: Decision
  durationMs?: number
  skipped?: boolean
  error?: unknown
}

/** Mutable per-run state threaded through the chain. */
export interface ChainContext {
  input: DecisionInput
  tags: Record<string, unknown>
  history: ChainStep[]
}

/** The static shape of a ChainLink subclass (declares default tests). */
export interface ChainLinkConstructor {
  tests: TestCase[]
  new (config?: { tests?: TestCase[] }): ChainLinkClass
}

export interface SelfTestResult {
  name: string
  passed: boolean
  actual: DecisionKind | 'pass' | 'error'
  expected: TestCase['expected']
  error?: unknown
}

/** A link plus its registration metadata. */
export interface ChainLinkRegistration {
  link: ChainLink
  order: number
  enabled: boolean
  registeredBy: string
}

/** Links grouped by source for the UI (Chains tab). */
export interface GroupedLinks {
  groups: Array<{ source: string; links: LinkView[] }>
}

/** The UI projection of one link. */
export interface LinkView {
  id: string
  name: string
  description: string
  order: number
  enabled: boolean
  registeredBy: string
}

/** Result of a full-chain decide run, including per-step history. */
export interface EngineDecision {
  decision: Decision
  history: ChainStep[]
}
