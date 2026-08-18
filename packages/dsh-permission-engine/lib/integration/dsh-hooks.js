export class DshHooks {
  constructor(ctx, engine, audit) {
    this.ctx = ctx
    this.engine = engine
    this.audit = audit
  }

  start() {
    this.ctx.on('tools/pre-execute', async (exec, next) => {
      const input = this.#toDecisionInput(exec)
      const result = await this.engine.decide(input)
      await this.audit.append(this.#toAuditRecord(exec, result))

      const { decision } = result
      if (decision.kind === 'deny') {
        return { kind: 'deny', reason: decision.reason }
      }
      if (decision.kind === 'ask') {
        return { kind: 'ask', reason: decision.reason }
      }
      return next()
    })
  }

  #toDecisionInput(exec) {
    return {
      tool: exec.name,
      args: exec.arguments ?? {},
      context: {
        sessionId: exec.agent?.session?.id,
        workspaceId: exec.agent?.workspace?.id,
        sandboxed: this.ctx.get?.('sandbox')?.mode,
        isGitRepo: false,
        recentUserMessages: [],
      },
    }
  }

  #toAuditRecord(exec, result) {
    return {
      id: globalThis.crypto?.randomUUID?.() ?? String(Date.now()),
      ts: Date.now(),
      tool: exec.name,
      command: exec.arguments?.command,
      sessionId: exec.agent?.session?.id,
      decision: result.decision,
      history: result.history,
    }
  }
}
