// 의존성 0 로컬 정적 서버 (브라우저 플레이용). file:// 더블클릭은 ES모듈 CORS로 막혀
// http로 서빙해야 함. listen 후 기본 브라우저 자동 오픈(win32).
// 사용: node serve.js [port]   (기본 8080). npm run serve / serve.bat 도 동일.
import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { extname, join, normalize, resolve } from 'node:path'
import { spawn } from 'node:child_process'

const PORT = Number(process.argv[2]) || 8080
const HOST = '127.0.0.1'            // 로컬 전용(LAN 노출 안 함)
const ROOT = resolve(process.cwd()) // serve.bat/npm 모두 repo 루트에서 실행
const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
}

const server = createServer(async (req, res) => {
  try {
    const urlPath = decodeURIComponent(req.url.split('?')[0])
    let rel = normalize(urlPath)
    if (rel === '/' || rel === '\\' || rel === '.') rel = 'index.html'
    const file = resolve(join(ROOT, rel))
    if (file !== ROOT && !file.startsWith(ROOT + (process.platform === 'win32' ? '\\' : '/'))) {
      res.writeHead(403); res.end('403 Forbidden'); return // 루트 밖 경로 차단
    }
    const body = await readFile(file)
    res.writeHead(200, { 'content-type': TYPES[extname(file)] || 'application/octet-stream' })
    res.end(body)
  } catch {
    res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' })
    res.end('404 Not Found')
  }
})

server.listen(PORT, HOST, () => {
  const url = `http://localhost:${PORT}/`
  console.log(`로컬 서버 실행: ${url}\n(이 창을 닫거나 Ctrl+C로 종료)`)
  if (process.platform === 'win32' && !process.env.NO_OPEN) {
    spawn('cmd', ['/c', 'start', '', url], { detached: true, stdio: 'ignore' }).unref()
  }
})
