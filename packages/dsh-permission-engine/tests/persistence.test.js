import { describe, it, expect, vi, beforeEach } from 'vitest'
import { PermissionEngine } from '../lib/services/PermissionEngine.js'
import { ConfigStorage } from '../lib/integration/config-storage.js'

function makeStorage(initial = null) {
  const rows = new Map()
  if (initial) rows.set('chainState', { key: 'chainState', payload: initial, ts: Date.now() })
  let domain = null
  const getDomain = () => domain ?? (domain = {
    tables: {
      state: {
        put: vi.fn(async (key, value) => { rows.set(key, value) }),
        query: vi.fn(async () => [...rows.values()].map((v) => ({ value: v }))),
        delete: vi.fn(async (key) => { rows.delete(key) }),
      },
    },
  })
  const storageDomain = {
    open: vi.fn(async () => getDomain()),
  }
  return { domain: getDomain(), storageDomain, rows }
}

function makeCtx(storage) {
  return {
    logger: { info: vi.fn(), warn: vi.fn() },
    get: (key) => (key === 'storageDomain' ? storage : undefined),
  }
}

describe('ConfigStorage', () => {
  it('initializes and loads null when no state exists', async () => {
    const { storageDomain } = makeStorage()
    const ctx = makeCtx(storageDomain)
    const storage = new ConfigStorage(ctx)
    await storage.init()
    const state = await storage.loadChainState()
    expect(state).toBeNull()
  })

  it('saves and loads chain state', async () => {
    const { storageDomain } = makeStorage()
    const ctx = makeCtx(storageDomain)
    const storage = new ConfigStorage(ctx)
    await storage.init()
    await storage.saveChainState({ enabledById: { foo: false }, orderIds: ['foo'], inlineLinks: [] })
    const loaded = await storage.loadChainState()
    expect(loaded).toEqual({ enabledById: { foo: false }, orderIds: ['foo'], inlineLinks: [] })
  })

  it('returns null when storageDomain is unavailable', async () => {
    const ctx = { logger: { warn: vi.fn() }, get: () => undefined }
    const storage = new ConfigStorage(ctx)
    await storage.init()
    const state = await storage.loadChainState()
    expect(state).toBeNull()
    await storage.saveChainState({})
  })
})

describe('PermissionEngine persistence', () => {
  let storage
  let ctx
  let engine

  beforeEach(async () => {
    const handle = makeStorage()
    storage = handle.storageDomain
    ctx = makeCtx(storage)
    engine = new PermissionEngine(ctx, { useDefaults: false, devLinks: false })
    const configStorage = new ConfigStorage(ctx)
    await configStorage.init()
    engine.setConfigStorage(configStorage)
  })

  it('restores inline links from storage on init', async () => {
    const code = `return { id: 'my-link', name: 'My', description: '', decide() { return null } }`
    const handle = makeStorage({
      enabledById: { 'my-link': false },
      orderIds: ['my-link'],
      inlineLinks: [{ id: 'my-link', name: 'My', description: '', code }],
    })
    const ctx2 = makeCtx(handle.storageDomain)
    const e = new PermissionEngine(ctx2, { useDefaults: false, devLinks: false })
    const cs = new ConfigStorage(ctx2)
    await cs.init()
    e.setConfigStorage(cs)
    await e.init()

    const reg = e.registrations.find((r) => r.link.id === 'my-link')
    expect(reg).toBeDefined()
    expect(reg.enabled).toBe(false)
    expect(reg.registeredBy).toBe('inline')
  })

  it('persists inline links when added via RPC flow', async () => {
    const code = `return { id: 'custom', name: 'Custom', description: 'test', decide() { return null } }`
    const result = engine.loadInlineLink('custom', 'Custom', 'test', code)
    expect(result.error).toBeUndefined()
    await engine.saveState()

    const configStorage = new ConfigStorage(ctx)
    await configStorage.init()
    const loaded = await configStorage.loadChainState()
    expect(loaded.inlineLinks).toHaveLength(1)
    expect(loaded.inlineLinks[0].id).toBe('custom')
    expect(loaded.inlineLinks[0].code).toBe(code)
  })

  it('persists enabled flag changes', async () => {
    const code = `return { id: 'a', name: 'A', description: '', decide() { return null } }`
    engine.loadInlineLink('a', 'A', '', code)
    engine.setEnabled('a', false)
    await engine.saveState()

    const configStorage = new ConfigStorage(ctx)
    await configStorage.init()
    const loaded = await configStorage.loadChainState()
    expect(loaded.enabledById['a']).toBe(false)
  })

  it('removes inline link from storage when unregistered', async () => {
    const code = `return { id: 'temp', name: 'Temp', description: '', decide() { return null } }`
    engine.loadInlineLink('temp', 'Temp', '', code)
    await engine.saveState()
    engine.unregisterLink('temp')
    await engine.saveState()

    const configStorage = new ConfigStorage(ctx)
    await configStorage.init()
    const loaded = await configStorage.loadChainState()
    expect(loaded.inlineLinks).toHaveLength(0)
  })

  it('handles missing storage gracefully', async () => {
    const ctxNoStorage = { logger: { warn: vi.fn() }, get: () => undefined }
    const e = new PermissionEngine(ctxNoStorage, { useDefaults: false, devLinks: false })
    await e.init()
    e.loadInlineLink('x', 'X', '', `return { id: 'x', name: 'X', description: '', decide() { return null } }`)
    await e.saveState()
    expect(e.registrations).toHaveLength(1)
    expect(e.registrations[0].link.id).toBe('x')
  })

  it('warns when ConfigStorage cannot open storageDomain', async () => {
    const ctxWarn = { logger: { warn: vi.fn() }, get: () => ({ open: vi.fn(async () => { throw new Error('open failed') }) }) }
    const cs = new ConfigStorage(ctxWarn)
    await cs.init()
    expect(ctxWarn.logger.warn).toHaveBeenCalledWith(expect.stringContaining('failed to open'))
  })
})
