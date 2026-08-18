export function installPermissionSettings(ctx, config, engine) {
  const settings = ctx.settings
  if (!settings) {
    ctx.logger?.warn('[permission-engine] settings service unavailable; using composed config only')
    return
  }

  const schema = {
    useDefaults: { type: 'boolean', default: config.useDefaults ?? true },
    hardDeny: { type: 'object', default: { patterns: [] } },
    safeRead: { type: 'object', default: { commands: [] } },
    llm: { type: 'object', default: { prompt: '', timeoutMs: 30000 } },
    risk: { type: 'object', default: { js: '' } },
    memory: { type: 'object', default: { ttlMs: 3600000 } },
    inlineLinks: { type: 'array', default: [] },
    customDir: { type: 'string', default: '' },
  }

  const base = {
    useDefaults: config.useDefaults ?? true,
    hardDeny: config.hardDeny ?? { patterns: [] },
    safeRead: config.safeRead ?? { commands: [] },
    llm: config.llm ?? { prompt: '', timeoutMs: 30000 },
    risk: config.risk ?? { js: '' },
    memory: config.memory ?? { ttlMs: 3600000 },
    inlineLinks: config.inlineLinks ?? [],
    customDir: config.customDir ?? '',
  }

  settings.register?.('permission-engine', {
    schema,
    base,
    onChange: () => engine.reloadFromSettings(),
  })
}
