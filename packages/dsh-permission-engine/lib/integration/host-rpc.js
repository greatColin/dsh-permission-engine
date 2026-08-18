export function registerHostRpc(ctx, engine) {
  const harness = ctx.get('harness')
  if (!harness?.handle) {
    ctx.logger?.warn('[permission-engine] ctx.harness.handle is not available; client RPC disabled')
    return
  }

  harness.handle('permissionEngine.listChains', () => engine.listChainsForUI())

  harness.handle('permissionEngine.runSelfTest', ({ id }) => engine.runSelfTest(id))

  harness.handle('permissionEngine.reload', () => {
    engine.reloadFromSettings()
    return { ok: true }
  })

  harness.handle('permissionEngine.updateChain', ({ id, enabled, order }) => {
    if (typeof enabled === 'boolean') engine.setEnabled(id, enabled)
    if (Array.isArray(order)) engine.reorder(order)
    return { ok: true }
  })

  harness.handle('permissionEngine.addInlineLink', ({ id, name, description, code }) => {
    const result = engine.loadInlineLink(id, name, description, code)
    if (result.error) return { ok: false, error: result.error.message }
    return { ok: true, id }
  })

  harness.handle('permissionEngine.removeLink', ({ id }) => {
    engine.unregisterLink(id)
    return { ok: true }
  })
}
