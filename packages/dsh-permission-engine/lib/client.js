export const name = 'permission-engine'

export const inject = ['slots', 'locale']

export function apply(ctx) {
  ctx.logger?.info('[permission-engine] client half loaded (ui pending)')
}
