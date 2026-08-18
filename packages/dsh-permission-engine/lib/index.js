export const name = 'permission-engine'

export const inject = ['tools']

export function apply(ctx) {
  ctx.logger?.info('[permission-engine] host half loaded (integration pending)')
}
