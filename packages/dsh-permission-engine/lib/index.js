import { PermissionEngine } from './services/PermissionEngine.js'
import { DshHooks } from './integration/dsh-hooks.js'
import { AuditLogService } from './integration/audit-log.js'
import { installPermissionSettings } from './integration/settings.js'
import { registerHostRpc } from './integration/host-rpc.js'

export const name = 'permission-engine'

export const inject = ['tools']

export async function apply(ctx, config) {
  const engine = new PermissionEngine(ctx, config)
  ctx.provide('permissionEngine', engine)

  await installPermissionSettings(ctx, config, engine)

  const audit = new AuditLogService(ctx)
  await audit.init()
  ctx.effect(() => {
    return () => audit.dispose()
  })

  await engine.init()

  registerHostRpc(ctx, engine)

  const hooks = new DshHooks(ctx, engine, audit)
  hooks.start()
}
