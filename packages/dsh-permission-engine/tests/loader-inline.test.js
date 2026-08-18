import { describe, it, expect } from 'vitest'
import { Loader } from '../lib/chain/loader.js'

const makeLoader = () => new Loader({})

describe('inline sandbox isolation', () => {
  it('rejects require() calls', () => {
    const code = `
      require('node:fs')
      class X extends ChainLink { decide() { return this.pass() } }
      module.exports = new X()
    `
    const result = makeLoader().loadFromInlineCode(code)
    expect(result.error).toBeInstanceOf(Error)
    expect(result.error.message).toMatch(/require|is not a function|undefined/)
  })

  it('rejects dynamic import() calls', () => {
    const code = `
      import('node:fs')
      class X extends ChainLink { decide() { return this.pass() } }
      module.exports = new X()
    `
    const result = makeLoader().loadFromInlineCode(code)
    expect(result.error).toBeInstanceOf(Error)
  })

  it('loads the demo template', () => {
    const demo = `
class DemoLink extends ChainLink {
  id = 'demo'
  name = 'Demo'
  description = 'demo'
  decide(ctx) {
    if ((ctx.input.args.command ?? '').startsWith('echo ')) return this.allow()
    return this.pass()
  }
}
module.exports = new DemoLink()
    `
    const result = makeLoader().loadFromInlineCode(demo)
    expect(result.error).toBeUndefined()
    expect(result.link.id).toBe('demo')
  })
})
