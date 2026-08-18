export class ConfigStorage {
  constructor(ctx) {
    this.ctx = ctx
    this.domain = null
  }

  async init() {
    const storageDomain = this.ctx.get('storageDomain')
    if (!storageDomain) {
      this.ctx.logger?.warn('[permission-engine] storageDomain unavailable; config persistence disabled')
      return
    }
    try {
      this.domain = await storageDomain.open({
        name: 'permission-config',
        schema: { tables: { state: { key: 'string', value: 'object' } } },
      })
    } catch (error) {
      this.ctx.logger?.warn(`[permission-engine] failed to open config domain: ${error.message}`)
    }
  }

  dispose() {
    this.domain?.close?.()
    this.domain = null
  }

  async loadChainState() {
    if (!this.domain) return null
    try {
      const rows = await this.domain.tables.state.query?.({ key: 'chainState' }) ?? []
      const record = rows.find((r) => r.value?.key === 'chainState') ?? rows[0]
      return record?.value?.payload ?? null
    } catch (error) {
      this.ctx.logger?.warn(`[permission-engine] failed to load chain state: ${error.message}`)
      return null
    }
  }

  async saveChainState(payload) {
    if (!this.domain) return
    try {
      await this.domain.tables.state.put('chainState', { key: 'chainState', payload, ts: Date.now() })
    } catch (error) {
      this.ctx.logger?.warn(`[permission-engine] failed to save chain state: ${error.message}`)
    }
  }

  async clear() {
    if (!this.domain) return
    try {
      const rows = await this.domain.tables.state.query?.({ key: 'chainState' }) ?? []
      for (const row of rows) {
        const key = row.value?.key ?? row.key
        if (key === 'chainState') {
          await this.domain.tables.state.delete?.(key) ?? this.domain.tables.state.put?.(key, null)
        }
      }
    } catch (error) {
      this.ctx.logger?.warn(`[permission-engine] failed to clear chain state: ${error.message}`)
    }
  }
}
