import { describe, it, expect, vi } from 'vitest'
import { apply } from '../../lib/index.js'
import { ChainLink } from '../../lib/chain/link.js'

class HardDeny extends ChainLink {
  id = 'L0-hard-deny'
  name = 'HardDeny'
  description = 'hard deny'
  decide(ctx) {
    if (/rm -rf \//.test(ctx.input.args.command ?? '')) return this.deny('hard deny: rm -rf /')
    return this.pass()
  }
}

class SafeRead extends ChainLink {
  id = 'L1-safe-read'
  name = 'SafeRead'
  description = 'safe read'
  decide(ctx) {
    if ((ctx.input.args.command ?? '').startsWith('ls ')) return this.allow()
    return this.pass()
  }
}

function makeCtx() {
  const listeners = new Map()
  const auditRecords = []
  return {
    logger: { info: vi.fn(), warn: vi.fn() },
    provide: vi.fn(),
    on: (event, handler) => {
      listeners.set(event, handler)
      return () => listeners.delete(event)
    },
    effect: (fn) => {
      const dispose = fn()
      return { dispose }
    },
    settings: {
      register: vi.fn((ns, opts) => {
        if (opts.onChange) opts.onChange()
      }),
    },
    storageDomain: {
      open: vi.fn(async () => ({
        tables: { records: { put: async (id, value) => auditRecords.push({ id, value }) } },
        close: vi.fn(),
      })),
    },
    get: vi.fn((key) => {
      if (key === 'sandbox') return { mode: 'workspace-write' }
      return undefined
    }),
    _listeners: listeners,
    _auditRecords: auditRecords,
  }
}

function makeExec(command) {
  return {
    name: 'bash',
    arguments: { command },
    agent: { session: { id: 's1' }, workspace: { id: 'w1' } },
  }
}

describe('full-flow integration', () => {
  it('loads plugin, registers service, and hooks tools/pre-execute', async () => {
    const ctx = makeCtx()
    await apply(ctx, { useDefaults: false, devLinks: false })
    expect(ctx.provide).toHaveBeenCalledWith('permissionEngine', expect.any(Object))
    expect(ctx._listeners.has('tools/pre-execute')).toBe(true)
  })

  it('denies rm -rf / via hard-deny link', async () => {
    const ctx = makeCtx()
    await apply(ctx, { useDefaults: false, devLinks: false })
    const engine = ctx.provide.mock.calls[0][1]
    engine.registerLink(new HardDeny(), { order: 100, registeredBy: 'test' })

    const handler = ctx._listeners.get('tools/pre-execute')
    const next = vi.fn(() => ({ kind: 'allow' }))
    const result = await handler(makeExec('rm -rf /'), next)
    expect(result).toEqual({ kind: 'deny', reason: 'hard deny: rm -rf /' })
    expect(next).not.toHaveBeenCalled()
    expect(ctx._auditRecords.length).toBeGreaterThan(0)
    expect(ctx._auditRecords[0].value.decision.kind).toBe('deny')
  })

  it('allows ls -la via safe-read link', async () => {
    const ctx = makeCtx()
    await apply(ctx, { useDefaults: false, devLinks: false })
    const engine = ctx.provide.mock.calls[0][1]
    engine.registerLink(new HardDeny(), { order: 100, registeredBy: 'test' })
    engine.registerLink(new SafeRead(), { order: 200, registeredBy: 'test' })

    const handler = ctx._listeners.get('tools/pre-execute')
    const next = vi.fn(() => ({ kind: 'allow' }))
    const result = await handler(makeExec('ls -la'), next)
    expect(next).toHaveBeenCalled()
    expect(result).toEqual({ kind: 'allow' })
    expect(ctx._auditRecords[ctx._auditRecords.length - 1].value.decision.kind).toBe('allow')
  })
})
