export class PermissionChain {
  constructor(registrations = []) {
    this.registrations = registrations
  }

  sorted() {
    return [...this.registrations]
      .filter((r) => r.enabled)
      .sort((a, b) => a.order - b.order)
  }

  async run(input) {
    const ctx = { input, tags: {}, history: [] }
    for (const registration of this.sorted()) {
      const { link } = registration
      const start = performance.now()
      try {
        const decision = await link.decide(ctx)
        const durationMs = performance.now() - start
        if (decision !== null) {
          ctx.history.push({
            linkId: link.id,
            linkName: link.name,
            outcome: 'decided',
            decision,
            durationMs,
          })
          return { decision, history: ctx.history }
        }
        ctx.history.push({
          linkId: link.id,
          linkName: link.name,
          outcome: 'passed',
          durationMs,
        })
      } catch (error) {
        const durationMs = performance.now() - start
        ctx.history.push({
          linkId: link.id,
          linkName: link.name,
          outcome: 'error',
          error,
          durationMs,
        })
      }
    }
    return { decision: { kind: 'allow' }, history: ctx.history }
  }
}
