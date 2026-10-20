import http from 'node:http'
import { writeFileSync, appendFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
const out = process.env.MOCK_OUT || tmpdir()
let n = 0
http.createServer((req, res) => {
  let b = ''; req.on('data', c => b += c); req.on('end', () => {
    n++; appendFileSync(join(out, 'mock-log.txt'), `${req.method} ${req.url}\n`)
    if (b) writeFileSync(join(out, `mock-req-${n}.json`), b)
    res.writeHead(200, { 'content-type': 'text/event-stream' })
    const ev = (t, d) => res.write(`event: ${t}\ndata: ${JSON.stringify(d)}\n\n`)
    ev('message_start', { type: 'message_start', message: { id: 'm1', type: 'message', role: 'assistant', model: 'deepseek-flash', content: [], stop_reason: null, usage: { input_tokens: 1, output_tokens: 0 } } })
    const body = b ? JSON.parse(b) : {}
    const hasTool = (body.tools || []).some(t => t.name === 'zh_design_lint')
    const done = JSON.stringify(body.messages || []).includes('tool_result')
    if (hasTool && !done) {
      ev('content_block_start', { type: 'content_block_start', index: 0, content_block: { type: 'tool_use', id: 'toolu_1', name: 'zh_design_lint', input: {} } })
      ev('content_block_delta', { type: 'content_block_delta', index: 0, delta: { type: 'input_json_delta', partial_json: JSON.stringify({ paths: ['a.html'] }) } })
      ev('content_block_stop', { type: 'content_block_stop', index: 0 })
      ev('message_delta', { type: 'message_delta', delta: { stop_reason: 'tool_use' }, usage: { output_tokens: 1 } })
    } else {
      ev('content_block_start', { type: 'content_block_start', index: 0, content_block: { type: 'text', text: '' } })
      ev('content_block_delta', { type: 'content_block_delta', index: 0, delta: { type: 'text_delta', text: 'MOCK-OK' } })
      ev('content_block_stop', { type: 'content_block_stop', index: 0 })
      ev('message_delta', { type: 'message_delta', delta: { stop_reason: 'end_turn' }, usage: { output_tokens: 1 } })
    }
    ev('message_stop', { type: 'message_stop' })
    res.end()
  })
}).listen(8787, '127.0.0.1')
