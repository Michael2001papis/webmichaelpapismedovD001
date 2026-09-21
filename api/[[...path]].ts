import type { IncomingMessage, ServerResponse } from 'node:http'
import { handleNodeRequest } from '../server/http'

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  const handled = await handleNodeRequest(req, res)
  if (!handled) {
    res.statusCode = 404
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    res.end(JSON.stringify({ error: 'not_found' }))
  }
}
