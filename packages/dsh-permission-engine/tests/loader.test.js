import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { Loader } from '../lib/chain/loader.js'
import { ChainLink } from '../lib/chain/link.js'

const makeLoader = () => new Loader({})

describe('Loader.loadFromDirectory', () => {
  let dir

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'dsh-pe-links-'))
  })

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true })
  })

  it('loads fixture directory links', async () => {
    const results = await makeLoader().loadFromDirectory(new URL('./fixtures/link-dir', import.meta.url).pathname)
    expect(results).toHaveLength(1)
    expect(results[0].link).toBeInstanceOf(ChainLink)
    expect(results[0].link.id).toBe('fixture-allow')
    expect(results[0].error).toBeUndefined()
  })

  it('ignores non-.js files', async () => {
    writeFileSync(join(dir, 'readme.txt'), 'noop')
    const results = await makeLoader().loadFromDirectory(dir)
    expect(results).toHaveLength(0)
  })

  it('returns error for files with syntax errors without throwing', async () => {
    writeFileSync(join(dir, 'bad.js'), 'this is not valid javascript')
    const results = await makeLoader().loadFromDirectory(dir)
    expect(results).toHaveLength(1)
    expect(results[0].link).toBeUndefined()
    expect(results[0].error).toBeInstanceOf(Error)
  })
})

describe('Loader.loadFromInlineCode', () => {
  it('loads a link from inline code', () => {
    const code = `
      class Allow extends ChainLink {
        id = 'inline-allow'
        name = 'Inline Allow'
        description = 'inline allow'
        decide() { return this.allow() }
      }
      module.exports = new Allow()
    `
    const result = makeLoader().loadFromInlineCode(code)
    expect(result.link).toBeInstanceOf(ChainLink)
    expect(result.link.id).toBe('inline-allow')
    expect(result.error).toBeUndefined()
  })

  it('returns error for syntax errors without throwing', () => {
    const result = makeLoader().loadFromInlineCode('this is not valid')
    expect(result.link).toBeUndefined()
    expect(result.error).toBeInstanceOf(Error)
  })
})

describe('Loader.loadFromPackage', () => {
  it('loads a fixture package by relative path', async () => {
    const result = await makeLoader().loadFromPackage('../../tests/fixtures/npm-pkg')
    expect(typeof result.register).toBe('function')
    expect(result.error).toBeUndefined()
  })

  it('returns error for missing package', async () => {
    const result = await makeLoader().loadFromPackage('this-package-does-not-exist-xyz')
    expect(result.register).toBeUndefined()
    expect(result.error).toBeInstanceOf(Error)
  })
})
