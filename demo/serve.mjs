import { apply } from '../packages/dsh-permission-engine/lib/index.js'
import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))

function makeCtx() {
  const listeners = new Map()
  const auditRecords = []
  return {
    logger: {
      info: (msg) => console.log(`[host] ${msg}`),
      warn: (msg) => console.warn(`[host] ${msg}`),
    },
    provide: (name, value) => {},
    on: (event, handler) => { listeners.set(event, handler) },
    effect: (fn) => { const dispose = fn(); return { dispose } },
    settings: { register: () => {} },
    storageDomain: {
      open: async () => ({
        tables: {
          records: {
            put: async (id, value) => auditRecords.push({ id, value }),
            query: async () => auditRecords,
          },
        },
        close: async () => {},
      }),
    },
    get: (key) => (key === 'sandbox' ? { mode: 'workspace-write' } : undefined),
    _listeners: listeners,
    _auditRecords: auditRecords,
  }
}

async function main() {
  const ctx = makeCtx()
  let engine
  const originalProvide = ctx.provide
  ctx.provide = (name, value) => {
    if (name === 'permissionEngine') engine = value
    originalProvide(name, value)
  }

  await apply(ctx, {
    useDefaults: true,
    devLinks: false,
    defaultsPackage: '../../../dsh-permission-engine-defaults/lib/index.js',
  })

  const server = createServer(async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Content-Type', 'application/json')

    try {
      if (req.url === '/' || req.url === '/index.html') {
        const html = await readFile(join(__dirname, 'client-demo.html'), 'utf8')
        res.setHeader('Content-Type', 'text/html')
        res.end(html)
        return
      }

      if (req.url.startsWith('/api/decide')) {
        const url = new URL(req.url, `http://${req.headers.host}`)
        const command = url.searchParams.get('command') ?? ''
        const handler = ctx._listeners.get('tools/pre-execute')
        const decision = await handler(
          { name: 'bash', arguments: { command }, agent: { session: { id: 'demo' } } },
          () => ({ kind: 'allow' }),
        )
        res.end(JSON.stringify({ command, decision }))
        return
      }

      if (req.url === '/api/chains') {
        res.end(JSON.stringify(engine.listChainsForUI()))
        return
      }

      if (req.url.startsWith('/api/selftest')) {
        const url = new URL(req.url, `http://${req.headers.host}`)
        const id = url.searchParams.get('id') ?? ''
        const results = await engine.runSelfTest(id)
        res.end(JSON.stringify({ id, results }))
        return
      }

      if (req.url === '/api/reload') {
        await engine.reloadFromSettings()
        res.end(JSON.stringify({ ok: true }))
        return
      }

      res.statusCode = 404
      res.end(JSON.stringify({ error: 'not found' }))
    } catch (err) {
      res.statusCode = 500
      res.end(JSON.stringify({ error: err.message }))
    }
  })

  const PORT = process.env.PORT ?? 3456
  server.listen(PORT, () => {
    console.log(`Permission engine demo server running at http://localhost:${PORT}`)
  })
}

main().catch((err) => { console.error(err); process.exit(1) })
