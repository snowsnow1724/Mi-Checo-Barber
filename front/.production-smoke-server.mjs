import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { extname, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import handler from './.vercel/output/functions/_render.func/dist/server/entry.mjs'

const root = resolve(fileURLToPath(new URL('./.vercel/output/static/', import.meta.url)))
const mimeTypes = {
  '.css': 'text/css',
  '.html': 'text/html',
  '.ico': 'image/x-icon',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
}

createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', 'http://127.0.0.1:4321')
  const staticPath = resolve(root, `.${decodeURIComponent(url.pathname)}`)
  if (staticPath.startsWith(root + sep)) {
    try {
      const data = await readFile(staticPath)
      res.writeHead(200, { 'content-type': mimeTypes[extname(staticPath)] ?? 'application/octet-stream' })
      res.end(data)
      return
    } catch (error) {
      if (error.code !== 'ENOENT') throw error
    }
  }
  const request = new Request(url, { method: req.method, headers: req.headers })
  const response = await handler.fetch(request)
  res.writeHead(response.status, Object.fromEntries(response.headers))
  res.end(Buffer.from(await response.arrayBuffer()))
}).listen(4321, '127.0.0.1', () => console.log('Production bundle listening at http://127.0.0.1:4321'))
