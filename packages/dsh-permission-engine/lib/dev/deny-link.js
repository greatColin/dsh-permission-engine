import { ChainLink } from '../chain/link.js'

export class DenyLink extends ChainLink {
  id = 'dev-deny'
  name = 'Deny'
  description = 'Development link that always denies.'

  decide() {
    return this.deny('Denied by dev-deny link.')
  }
}
