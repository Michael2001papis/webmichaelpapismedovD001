import type { Plugin } from 'vite'
import { handleNodeRequest } from './http.ts'

export function holikarApiPlugin(): Plugin {
  return {
    name: 'holikar-api',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        void handleNodeRequest(req, res).then((handled) => {
          if (!handled) next()
        }, next)
      })
    },
    configurePreviewServer(server) {
      server.middlewares.use((req, res, next) => {
        void handleNodeRequest(req, res).then((handled) => {
          if (!handled) next()
        }, next)
      })
    },
  }
}
