import { PermissionChain } from '../chain/chain.js'
import { Loader } from '../chain/loader.js'

export class PermissionEngine {
  constructor(ctx, config = {}) {
    this.ctx = ctx
    this.config = config
    this.registrations = []
    this.chain = new PermissionChain(this.registrations)
    this.loader = new Loader(ctx)
  }

  async init() {
    this.#registerDevLinks()
    if (this.config.useDefaults !== false) {
      await this.loadDefaults()
    }
    await this.reloadFromSettings()
  }

  registerLink(link, opts = {}) {
    const { order = 100, enabled = true, registeredBy = 'user' } = opts
    this.registrations.push({ link, order, enabled, registeredBy })
    this.chain = new PermissionChain(this.registrations)
  }

  unregisterLink(linkId) {
    const index = this.registrations.findIndex((r) => r.link.id === linkId)
    if (index >= 0) this.registrations.splice(index, 1)
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
    return this.chain.run(input)
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
      const defaults = await import('@yourname/dsh-permission-engine-defaults')
      const register = defaults.registerLinks ?? defaults.default
      if (typeof register === 'function') {
        register(this, this.ctx)
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
    // Dev links are loaded lazily via dynamic import so the core package stays testable
    // without a hard dependency on the dev modules at the top level.
    import('../dev/allow-link.js').then((m) => this.registerLink(new m.AllowLink(), { order: 10, registeredBy: 'dev' }))
    import('../dev/deny-link.js').then((m) => this.registerLink(new m.DenyLink(), { order: 11, registeredBy: 'dev' }))
    import('../dev/echo-link.js').then((m) => this.registerLink(new m.EchoLink(), { order: 12, registeredBy: 'dev' }))
  }
}
