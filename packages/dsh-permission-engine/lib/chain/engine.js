import { PermissionChain } from './chain.js'

export class PermissionEngine {
  constructor(ctx, config = {}) {
    this.ctx = ctx
    this.config = config
    this.registrations = []
    this.chain = new PermissionChain(this.registrations)
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
    if (opts.test) {
      const snapshot = this.registrations.map((r) => ({ ...r }))
      return this.chain.run(input)
    }
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

  reloadFromSettings() {
    this.chain = new PermissionChain(this.registrations)
  }
}
