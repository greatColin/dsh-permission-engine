import { readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const pkg = join(root, 'packages/dsh-permission-engine')

const sourcePath = join(pkg, 'lib/client.js')
const outputPath = join(pkg, 'lib/client.bundle.js')

const source = await readFile(sourcePath, 'utf8')

const body = source
  .replace(/^export const name = /m, 'const name = ')
  .replace(/^export const inject = /m, 'const inject = ')
  .replace(/^export function apply/m, 'function apply')

const exportLines = `
    exports.name = name;
    exports.inject = inject;
    exports.apply = apply;
`

const bundle = `// AUTO-GENERATED from lib/client.js — run \`pnpm build:client\` to regenerate
window.__ModuleLoader__.load({
  id: '@yourname/dsh-permission-engine',
  factory: (require) => {
    var module = { exports: {} };
    var exports = module.exports;

${body.split('\n').map((line) => '    ' + line).join('\n')}${exportLines}
    return module.exports;
  },
});
`

await writeFile(outputPath, bundle)
console.log(`Built ${outputPath}`)
