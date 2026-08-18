export async function registerLinks(engine, ctx) {
  ctx?.logger?.info('[permission-engine-defaults] registering default links')

  const { ChainLink } = await import('@yourname/dsh-permission-engine/chain/link')

  const [{ makeHardDenyLink }, { makeSafeReadLink }, { makeAllowlistLink }, { makeRiskScoringLink }, { makeLlmReviewLink }, { makeRememberLink }] =
    await Promise.all([
      import('./links/hard-deny.js'),
      import('./links/safe-read.js'),
      import('./links/allowlist.js'),
      import('./links/risk-scoring.js'),
      import('./links/llm-review.js'),
      import('./links/remember.js'),
    ])

  engine.registerLink(new (makeHardDenyLink(ChainLink))(), { order: 0, registeredBy: '@yourname/dsh-permission-engine-defaults' })
  engine.registerLink(new (makeSafeReadLink(ChainLink))(), { order: 100, registeredBy: '@yourname/dsh-permission-engine-defaults' })
  engine.registerLink(new (makeAllowlistLink(ChainLink))(), { order: 200, registeredBy: '@yourname/dsh-permission-engine-defaults' })
  engine.registerLink(new (makeRiskScoringLink(ChainLink))(), { order: 300, registeredBy: '@yourname/dsh-permission-engine-defaults' })
  engine.registerLink(new (makeLlmReviewLink(ChainLink))(), { order: 400, registeredBy: '@yourname/dsh-permission-engine-defaults' })
  engine.registerLink(new (makeRememberLink(ChainLink))(), { order: 500, registeredBy: '@yourname/dsh-permission-engine-defaults' })
}
