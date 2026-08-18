import { ChainLink } from '../../../lib/chain/link.js'

export default class FixtureAllow extends ChainLink {
  id = 'fixture-allow'
  name = 'Fixture Allow'
  description = 'fixture allow link'

  decide() {
    return this.allow()
  }
}
