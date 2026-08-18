import { readdir, readFile } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'
import { join } from 'node:path'
import { ChainLink, PlainLink } from './link.js'

const safeConsole = {
  log: (...args) => console.log(...args),
  warn: (...args) => console.warn(...args),
  error: (...args) => console.error(...args),
  info: (...args) => console.info(...args),
}

const FORBIDDEN_PATTERNS = [
  /\bimport\s*\(/,
  /\bimport\s+/,
  /\brequire\s*\(/,
]

function containsForbiddenImports(code) {
  for (const pattern of FORBIDDEN_PATTERNS) {
    if (pattern.test(code)) return pattern.toString()
  }
  return false
}

export class Loader {
  constructor(ctx) {
    this.ctx = ctx
  }

  async loadFromDirectory(dir) {
    const entries = await readdir(dir, { withFileTypes: true })
    const results = []
    for (const entry of entries) {
      if (!entry.isFile() || !entry.name.endsWith('.js')) continue
      const filePath = join(dir, entry.name)
      try {
        const module = await import(pathToFileURL(filePath).href)
        const link = this.#coerceToLink(module.default)
        results.push({ link, source: { kind: 'directory', path: filePath } })
      } catch (error) {
        results.push({ source: { kind: 'directory', path: filePath }, error })
      }
    }
    return results
  }

  loadFromInlineCode(code, opts = {}) {
    const forbidden = containsForbiddenImports(code)
    if (forbidden) {
      return { source: { kind: 'inline' }, error: new Error(`inline link contains forbidden import/require pattern: ${forbidden}`) }
    }
    const sandboxModule = { exports: {} }
    try {
      const sandbox = new Function(
        'require', '__import', 'process', 'module', 'exports', 'console', 'ChainLink',
        '"use strict";\n' + code + '\n;return module.exports ?? null'
      )
      const result = sandbox(undefined, undefined, undefined, sandboxModule, sandboxModule.exports, safeConsole, ChainLink)
      const link = this.#coerceToLink(result)
      return { link, source: { kind: 'inline' } }
    } catch (error) {
      return { source: { kind: 'inline' }, error }
    }
  }

  async loadFromPackage(packageName) {
    try {
      const module = await import(packageName)
      const register = module.registerLinks ?? module.default
      if (typeof register !== 'function') {
        return { source: { kind: 'package', packageName }, error: new Error(`package "${packageName}" has no registerLinks/default export`) }
      }
      return { register, source: { kind: 'package', packageName } }
    } catch (error) {
      return { source: { kind: 'package', packageName }, error }
    }
  }

  #coerceToLink(value) {
    if (value instanceof ChainLink) return value
    if (value && typeof value === 'object' && typeof value.decide === 'function') {
      return new PlainLink(value)
    }
    if (typeof value === 'function') {
      const instance = new value()
      if (!(instance instanceof ChainLink)) {
        throw new TypeError(`exported class must extend ChainLink`)
      }
      return instance
    }
    throw new TypeError(`exported value must be a ChainLink instance/class or a plain object with decide()`)
  }
}
