import ws from 'ws'
import { isFunction } from '@vue/shared'

const log = msg => console.log(`[Evoker devtools] ${msg}`)

const warn = msg => console.warn(`[Evoker devtools] ${msg}`)

export type Client = ws & { isService: boolean; pageId: number }

const enum HeartBeatMessage {
  PING = 'ping',
  PONG = 'pong'
}

interface CreateWebSockerServerOptions {
  port?: number
  onConnect?: (client: Client) => void
  onDisconnect?: (client: Client) => void
  onRecv?: (client: Client, message: string) => void
}

export function createWebSocketServer(options: CreateWebSockerServerOptions) {
  const host = '127.0.0.1'

  let port = options.port ?? 33233

  log(`run: ${host}:${port}`)

  let webSocketServer = new ws.WebSocketServer({ host, port })

  webSocketServer.on('connection', (client: Client) => {
    console.log()
    log('client connected')

    isFunction(options.onConnect) && options.onConnect(client)

    client.on('close', () => {
      log('client close connection')
      isFunction(options.onDisconnect) && options.onDisconnect(client)
    })

    client.on('error', error => {
      warn(`client connection error: ${error}`)
      isFunction(options.onDisconnect) && options.onDisconnect(client)
    })

    client.on('message', data => {
      const message = data.toString()
      if (message === HeartBeatMessage.PING) {
        client.send(HeartBeatMessage.PONG)
      } else {
        options.onRecv && options.onRecv(client, message)
      }
    })
  })

  webSocketServer.on('error', (error: Error & { code?: string }) => {
    if (error.code === 'EADDRINUSE') {
      log(`port: ${port} is already in use`)
      webSocketServer = new ws.WebSocketServer({ host, port: ++port })
      log(`run: ${host}:${port}`)
    } else {
      warn(`error: ${error}`)
    }
  })

  return {
    wss: webSocketServer,
    clients: () => Array.from(webSocketServer.clients) as Client[]
  }
}
