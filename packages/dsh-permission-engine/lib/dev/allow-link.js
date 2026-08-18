import { ChainLink } from '../chain/link.js'

export class AllowLink extends ChainLink {
  id = 'dev-allow'
  name = 'Allow'
  description = 'Development link that always allows.'

  decide() {
    return this.allow()
  }
}
