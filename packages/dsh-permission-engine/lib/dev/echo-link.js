import { ChainLink } from '../chain/link.js'

export class EchoLink extends ChainLink {
  id = 'dev-echo'
  name = 'Echo'
  description = 'Development link that tags the command into the context.'

  decide(ctx) {
    ctx.tags.echoed = ctx.input.args.command ?? null
    return this.pass()
  }
}
