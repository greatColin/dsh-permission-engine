import { PermissionChain } from '../chain/chain.js'
import { Loader } from '../chain/loader.js'

export class PermissionEngine {
  constructor(ctx, config = {}) {
    this.ctx = ctx
    this.config = config
    this.registrations = []
    this.chain = new PermissionChain(this.registrations)
    this.loader = new Loader(ctx)
    this.memoryLinks = []
    this.configStorage = null
    this._inlineCodes = new Map()
  }

  setConfigStorage(storage) {
    this.configStorage = storage
  }

  async init() {
    this.#registerDevLinks()
    if (this.config.useDefaults !== false) {
      await this.loadDefaults()
    }
    if (this.configStorage) {
      await this.#restoreFromStorage()
    }
    await this.reloadFromSettings()
  }

  registerLink(link, opts = {}) {
    const { order = 100, enabled = true, registeredBy = 'user' } = opts
    this.registrations.push({ link, order, enabled, registeredBy })
    if (typeof link.remember === 'function') this.memoryLinks.push(link)
    this.chain = new PermissionChain(this.registrations)
  }

  unregisterLink(linkId) {
    const index = this.registrations.findIndex((r) => r.link.id === linkId)
    if (index >= 0) {
      const registration = this.registrations[index]
      this.registrations.splice(index, 1)
      this.memoryLinks = this.memoryLinks.filter((l) => l !== registration.link)
      if (registration.registeredBy === 'inline') {
        this._inlineCodes.delete(linkId)
      }
    }
    this.chain = new PermissionChain(this.registrations)
  }

  setEnabled(linkId, enabled) {
    const registration = this.registrations.find((r) => r.link.id === linkId)
    if (registration) registration.enabled = enabled
    this.chain = new PermissionChain(this.registrations)
  }

  reorder(orderedIds) {
    const byId = new Map(this.registrations.map((r) => [r.link.id, r]))
    const next = orderedIds
      .map((id) => byId.get(id))
      .filter((r) => r !== undefined)
    const rest = this.registrations.filter((r) => !orderedIds.includes(r.link.id))
    this.registrations = [...next, ...rest].map((r, index) => ({ ...r, order: index + 1 }))
    this.chain = new PermissionChain(this.registrations)
  }

  async decide(input, opts = {}) {
    const result = await this.chain.run(input)
    const decision = result.decision
    if (decision?.kind && decision.kind !== 'pass') {
      for (const link of this.memoryLinks) {
        try {
          await link.remember(input, decision)
        } catch (error) {
          this.ctx.logger?.warn(`[permission-engine] remember failed: ${error.message}`)
        }
      }
    }
    return result
  }

  async runSelfTest(linkId) {
    const registration = this.registrations.find((r) => r.link.id === linkId)
    if (!registration) return []
    return registration.link.runSelfTest()
  }

  listChainsForUI() {
    const groups = new Map()
    for (const registration of this.registrations) {
      const { link, order, enabled, registeredBy } = registration
      if (!groups.has(registeredBy)) groups.set(registeredBy, [])
      groups.get(registeredBy).push({
        id: link.id,
        name: link.name,
        description: link.description,
        order,
        enabled,
        registeredBy,
      })
    }
    return {
      groups: [...groups.entries()].map(([source, links]) => ({
        source,
        links: links.sort((a, b) => a.order - b.order),
      })),
    }
  }

  async loadDefaults() {
    try {
      const path = this.config.defaultsPackage ?? '@yourname/dsh-permission-engine-defaults'
      const defaults = await import(path)
      const register = defaults.registerLinks ?? defaults.default
      if (typeof register === 'function') {
        await register(this, this.ctx)
      }
    } catch (error) {
      this.ctx.logger?.warn(`[permission-engine] failed to load defaults: ${error.message}`)
    }
  }

  async loadFromDirectory(dir) {
    const results = await this.loader.loadFromDirectory(dir)
    for (const result of results) {
      if (result.link) {
        this.registerLink(result.link, { order: 300, registeredBy: 'directory' })
      } else if (result.error) {
        this.ctx.logger?.warn(`[permission-engine] failed to load ${result.source.path}: ${result.error.message}`)
      }
    }
    return results
  }

  loadInlineLink(id, name, description, code, opts = {}) {
    const result = this.loader.loadFromInlineCode(code)
    if (result.error) return result
    result.link.id = id
    result.link.name = name
    result.link.description = description
    this._inlineCodes.set(id, { name, description, code })
    this.registerLink(result.link, { order: opts.order ?? 300, registeredBy: 'inline' })
    return result
  }

  async loadPackage(packageName) {
    const result = await this.loader.loadFromPackage(packageName)
    if (result.register) {
      result.register(this, this.ctx)
    }
    return result
  }

  reloadFromSettings() {
    this.chain = new PermissionChain(this.registrations)
  }

  #registerDevLinks() {
    const devLinks = this.config.devLinks ?? true
    if (!devLinks) return
    import('../dev/allow-link.js').then((m) => this.registerLink(new m.AllowLink(), { order: 10, registeredBy: 'dev' }))
    import('../dev/deny-link.js').then((m) => this.registerLink(new m.DenyLink(), { order: 11, registeredBy: 'dev' }))
    import('../dev/echo-link.js').then((m) => this.registerLink(new m.EchoLink(), { order: 12, registeredBy: 'dev' }))
  }

  async #restoreFromStorage() {
    if (!this.configStorage) return
    const state = await this.configStorage.loadChainState()
    if (!state) return

    if (Array.isArray(state.inlineLinks)) {
      for (const entry of state.inlineLinks) {
        const { id, name, description, code } = entry
        if (!id || !code) continue
        const result = this.loadInlineLink(id, name ?? id, description ?? '', code)
        if (result.error) {
          this.ctx.logger?.warn(`[permission-engine] failed to restore inline link ${id}: ${result.error.message}`)
        }
      }
    }

    if (state.enabledById && typeof state.enabledById === 'object') {
      for (const registration of this.registrations) {
        const id = registration.link.id
        if (id in state.enabledById) {
          registration.enabled = Boolean(state.enabledById[id])
        }
      }
    }

    if (Array.isArray(state.orderIds) && state.orderIds.length > 0) {
      const existing = new Set(this.registrations.map((r) => r.link.id))
      const validOrder = state.orderIds.filter((id) => existing.has(id))
      const missing = this.registrations.filter((r) => !validOrder.includes(r.link.id))
      this.registrations = [
        ...validOrder.map((id, idx) => {
          const reg = this.registrations.find((r) => r.link.id === id)
          return { ...reg, order: idx + 1 }
        }),
        ...missing,
      ]
    }

    this.chain = new PermissionChain(this.registrations)
  }

  async saveState() {
    if (!this.configStorage) return
    const enabledById = {}
    const orderIds = []
    for (const registration of [...this.registrations].sort((a, b) => a.order - b.order)) {
      const id = registration.link.id
      if (registration.registeredBy === 'inline') {
        enabledById[id] = registration.enabled
      }
      orderIds.push(id)
    }
    const inlineLinks = [...this._inlineCodes.entries()].map(([id, meta]) => ({ id, ...meta }))
    await this.configStorage.saveChainState({ enabledById, orderIds, inlineLinks })
  }
}
