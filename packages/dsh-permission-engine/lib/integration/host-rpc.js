export function registerHostRpc(ctx, engine) {
  if (!ctx.harness?.handle) {
    ctx.logger?.warn('[permission-engine] ctx.harness.handle is not available; client RPC disabled')
    return
  }

  ctx.harness.handle('permissionEngine.listChains', () => engine.listChainsForUI())

  ctx.harness.handle('permissionEngine.runSelfTest', ({ id }) => engine.runSelfTest(id))

  ctx.harness.handle('permissionEngine.reload', () => {
    engine.reloadFromSettings()
    return { ok: true }
  })

  ctx.harness.handle('permissionEngine.updateChain', ({ id, enabled, order }) => {
    if (typeof enabled === 'boolean') engine.setEnabled(id, enabled)
    if (Array.isArray(order)) engine.reorder(order)
    return { ok: true }
  })
}
