export function registerHostRpc(ctx, engine) {
  const harness = ctx.get('harness')
  if (!harness?.handle) {
    ctx.logger?.warn('[permission-engine] ctx.harness.handle is not available; client RPC disabled')
    return
  }

  harness.handle('permissionEngine.listChains', () => engine.listChainsForUI())

  harness.handle('permissionEngine.runSelfTest', async ({ id }) => {
    const result = engine.runSelfTest(id)
    return await result
  })

  harness.handle('permissionEngine.reload', async () => {
    engine.reloadFromSettings()
    await engine.saveState()
    return { ok: true }
  })

  harness.handle('permissionEngine.updateChain', async ({ id, enabled, order }) => {
    if (typeof enabled === 'boolean') engine.setEnabled(id, enabled)
    if (Array.isArray(order)) engine.reorder(order)
    await engine.saveState()
    return { ok: true }
  })

  harness.handle('permissionEngine.addInlineLink', async ({ id, name, description, code }) => {
    const result = engine.loadInlineLink(id, name, description, code)
    if (result.error) return { ok: false, error: result.error.message }
    await engine.saveState()
    return { ok: true, id }
  })

  harness.handle('permissionEngine.removeLink', async ({ id }) => {
    engine.unregisterLink(id)
    await engine.saveState()
    return { ok: true }
  })
}
