import ws from 'ws'
import { isFunction } from '@vue/shared'

export interface InvokeArgs {
  event: string
  params: string
  callbackId: number
}

export interface PublishArgs {
  event: string
  params: string
  webViewId: number
}

const log = msg => console.log(`[Evoker devtools] ${msg}`)

const warn = msg => console.warn(`[Evoker devtools] ${msg}`)

interface BridgeInterface {
  isService: boolean
  isDevtools: boolean
  pageId: number
  invokeCallbackSuccess: (args: InvokeArgs, result?: Record<string, any>) => void
  invokeCallbackFail: (args: InvokeArgs, error: string) => void
  subscribeHandler: (args: PublishArgs) => void
}

export type Bridge = ws & BridgeInterface

const enum HeartBeatMessage {
  PING = 'ping',
  PONG = 'pong'
}

interface CreateWebSockerServerOptions {
  port?: number
  onConnect?: (bridge: Bridge) => void
  onDisconnect?: (bridge: Bridge) => void
  onRecv?: (bridge: Bridge, message: string) => void
}

export function createWebSocketServer(options: CreateWebSockerServerOptions) {
  const host = '127.0.0.1'

  let port = options.port ?? 33233

  log(`run: ${host}:${port}`)

  let webSocketServer = new ws.WebSocketServer({ host, port })

  webSocketServer.on('connection', (bridge: Bridge) => {
    console.log()
    log('client connected')

    isFunction(options.onConnect) && options.onConnect(clientToBridge(bridge))

    bridge.on('close', () => {
      log('client close connection')
      isFunction(options.onDisconnect) && options.onDisconnect(clientToBridge(bridge))
    })

    bridge.on('error', error => {
      warn(`client connection error: ${error}`)
      isFunction(options.onDisconnect) && options.onDisconnect(clientToBridge(bridge))
    })

    bridge.on('message', data => {
      const message = data.toString()
      if (message === HeartBeatMessage.PING) {
        bridge.send(HeartBeatMessage.PONG)
      } else {
        options.onRecv && options.onRecv(clientToBridge(bridge), message)
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

  const invokeCallback = (
    bridge: Bridge,
    event: string,
    callbackId: number,
    errMsg: string,
    data?: Record<string, any>
  ) => {
    const result = JSON.stringify({
      id: callbackId,
      event,
      errMsg,
      data: data || {}
    })
    bridge.readyState == bridge.OPEN &&
      bridge.send(JSON.stringify({ exec: 'INVOKE_CALLBACK', result }))
  }

  const clientToBridge = (client: Bridge) => {
    if (client.invokeCallbackSuccess) {
      return client
    }
    client.invokeCallbackSuccess = (args: InvokeArgs, result?: Record<string, any>) => {
      invokeCallback(client, args.event, args.callbackId, '', result)
    }
    client.invokeCallbackFail = (args: InvokeArgs, errMsg: string) => {
      invokeCallback(client, args.event, args.callbackId, errMsg)
    }
    client.subscribeHandler = (args: PublishArgs) => {
      client.readyState == client.OPEN &&
        client.send(JSON.stringify({ exec: 'SUBSCRIBE_HANDLER', args }))
    }
    return client
  }

  return {
    wss: webSocketServer,
    clients: () => {
      return (Array.from(webSocketServer.clients) as Bridge[]).map(clientToBridge)
    }
  }
}
