import { spawn } from 'node:child_process'
import path from 'node:path'

const serverPath = path.resolve(
  'c:/Users/X/Desktop/Bot-Dev/Yunzai/plugins/Yunzai-MCP-plugin/model/dist/mcp-server.js'
)

const child = spawn('node', [serverPath], { stdio: ['pipe', 'pipe', 'pipe'] })

let stderr = ''
child.stderr.setEncoding('utf8')
child.stderr.on('data', (d) => { stderr += d })

let buffer = Buffer.alloc(0)
child.stdout.on('data', (d) => {
  buffer = Buffer.concat([buffer, d])
})

function sendContentLength (obj) {
  const json = JSON.stringify(obj)
  const len = Buffer.byteLength(json, 'utf8')
  child.stdin.write(`Content-Length: ${len}\r\n\r\n${json}`)
}

function tryReadMessages () {
  const messages = []
  while (buffer.length > 0) {
    const s = buffer.toString('utf8')
    const headerEnd = s.indexOf('\r\n\r\n')
    if (headerEnd === -1) break
    const header = s.slice(0, headerEnd)
    const m = /Content-Length:\s*(\d+)/i.exec(header)
    if (!m) break
    const len = parseInt(m[1], 10)
    const bodyStartBytes = Buffer.byteLength(s.slice(0, headerEnd + 4), 'utf8')
    if (buffer.length < bodyStartBytes + len) break
    const body = buffer.slice(bodyStartBytes, bodyStartBytes + len).toString('utf8')
    buffer = buffer.slice(bodyStartBytes + len)
    try { messages.push(JSON.parse(body)) } catch {}
  }
  return messages
}

async function main () {
  sendContentLength({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2024-11-05', capabilities: {} } })
  sendContentLength({ jsonrpc: '2.0', id: 2, method: 'tools/list', params: {} })
  sendContentLength({ jsonrpc: '2.0', id: 3, method: 'resources/list', params: {} })

  const start = Date.now()
  while (Date.now() - start < 1500) {
    const msgs = tryReadMessages()
    for (const msg of msgs) {
      if (msg?.id === 1) console.log('initialize:', JSON.stringify(msg.result, null, 2))
      if (msg?.id === 2) console.log('tools/list:', JSON.stringify(msg.result, null, 2))
      if (msg?.id === 3) console.log('resources/list:', JSON.stringify(msg.result, null, 2))
    }
    if (msgs.some((m) => m?.id === 2)) break
    await new Promise((r) => setTimeout(r, 50))
  }

  if (stderr.trim()) console.error('server stderr (truncated):', stderr.trim().split('\n').slice(-5).join('\n'))
  child.kill()
}

main().catch((e) => {
  console.error(e)
  child.kill()
  process.exit(1)
})

