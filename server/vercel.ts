import type { IncomingMessage, ServerResponse } from 'node:http'
import { handleNodeRequest } from './http.ts'

export default async function vercelApi(req: IncomingMessage, res: ServerResponse) {
  try {
    const handled = await handleNodeRequest(req, res)
    if (!handled) {
      res.statusCode = 404
      res.setHeader('Content-Type', 'application/json; charset=utf-8')
      res.end(JSON.stringify({ error: 'not_found' }))
    }
  } catch (error) {
    console.error('api_failed', error instanceof Error ? error.message : 'unknown')
    if (!res.headersSent) {
      res.statusCode = 500
      res.setHeader('Content-Type', 'application/json; charset=utf-8')
      res.end(JSON.stringify({ error: 'server_error' }))
    }
  }
}
