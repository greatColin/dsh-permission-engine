export class AuditLogService {
  constructor(ctx) {
    this.ctx = ctx
    this.domain = null
  }

  async init() {
    const storageDomain = this.ctx.storageDomain
    if (!storageDomain) {
      this.ctx.logger?.warn('[permission-engine] storageDomain unavailable; audit logging disabled')
      return
    }
    try {
      this.domain = await storageDomain.open({
        name: 'permission-audit',
        schema: { tables: { records: { key: 'string', value: 'object' } } },
      })
    } catch (error) {
      this.ctx.logger?.warn(`[permission-engine] failed to open audit domain: ${error.message}`)
    }
  }

  dispose() {
    this.domain?.close?.()
    this.domain = null
  }

  async append(record) {
    if (!this.domain) return
    try {
      await this.domain.tables.records.put(record.id, record)
    } catch (error) {
      this.ctx.logger?.warn(`[permission-engine] audit append failed: ${error.message}`)
    }
  }

  async query(filter = {}) {
    if (!this.domain) return []
    const all = await this.domain.tables.records.query?.() ?? []
    return all
      .map((entry) => entry.value ?? entry)
      .filter((record) => this.#matches(record, filter))
      .sort((a, b) => (b.ts ?? 0) - (a.ts ?? 0))
  }

  async export(filter = {}, format = 'json') {
    const records = await this.query(filter)
    if (format === 'csv') {
      const header = 'id,ts,tool,command,decision,reason,sessionId'
      const rows = records.map((r) =>
        [r.id, r.ts, r.tool, r.command, r.decision?.kind, r.decision?.reason, r.sessionId].join(',')
      )
      return [header, ...rows].join('\n')
    }
    return JSON.stringify(records, null, 2)
  }

  #matches(record, filter) {
    for (const [key, value] of Object.entries(filter)) {
      if (value === undefined || value === null) continue
      if (record[key] !== value) return false
    }
    return true
  }
}
