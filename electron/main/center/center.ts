import ws from 'ws'
import { isFunction, isString } from '@vue/shared'

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

export interface Bridge extends ws.WebSocket {
  invokeCallbackSuccess: (args: InvokeArgs, result?: Record<string, any>) => void
  invokeCallbackFail: (args: InvokeArgs, error: string) => void
  subscribeHandler: (args: PublishArgs) => void
}

export const enum Protocol {
  APPSERVICEDEVTOOLS = 'APPSERVICEDEVTOOLS',
  APPSERVICE = 'APPSERVICE',
  WEBVIEW = 'WEBVIEW'
}

const clients = new Map<Protocol, Map<string, Bridge>>([
  [Protocol.APPSERVICEDEVTOOLS, new Map()],
  [Protocol.APPSERVICE, new Map()],
  [Protocol.WEBVIEW, new Map()]
])

interface CreateWebSockerServerOptions {
  port?: number
  onConnect?: (bridge: ws.WebSocket | Bridge) => void
  onDisconnect?: (bridge: ws.WebSocket | Bridge) => void
  onRecv?: (bridge: ws.WebSocket | Bridge, message: string) => void
}

export const splitClientGroup = (ws: ws.WebSocket) => {
  let [main, sub = ''] = ws.protocol.split('_')
  if (!main) {
    main = Protocol.APPSERVICEDEVTOOLS
  }
  if (!isString(sub)) {
    sub = `${sub}`
  }
  return [main, sub] as [Protocol, string]
}

export function createWebSocketServer(options: CreateWebSockerServerOptions) {
  const host = '127.0.0.1'

  let port = options.port ?? 33233

  log(`run: ${host}:${port}`)

  let webSocketServer = new ws.WebSocketServer({ host, port })

  webSocketServer.on('connection', (bridge: Bridge) => {
    console.log()

    log(`client connected: ${bridge.protocol}`)

    const [main, sub] = splitClientGroup(bridge)

    const bridgeMap = clients.get(main)

    bridgeMap.set(sub, bridge)

    isFunction(options.onConnect) && options.onConnect(clientToBridge(bridge))

    bridge.on('close', () => {
      log('client close connection')
      isFunction(options.onDisconnect) && options.onDisconnect(clientToBridge(bridge))
      bridgeMap.delete(sub)
    })

    bridge.on('error', error => {
      warn(`client connection error: ${error}`)
      isFunction(options.onDisconnect) && options.onDisconnect(clientToBridge(bridge))
      bridgeMap.delete(sub)
    })

    bridge.on('message', data => {
      const message = data.toString()
      options.onRecv && options.onRecv(clientToBridge(bridge), message)
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

  const clientToBridge = (client: ws.WebSocket) => {
    const [main] = splitClientGroup(client)
    if (main === Protocol.APPSERVICE || main === Protocol.WEBVIEW) {
      const bridge = client as Bridge
      if (bridge.invokeCallbackSuccess) {
        return bridge
      }
      bridge.invokeCallbackSuccess = (args: InvokeArgs, result?: Record<string, any>) => {
        invokeCallback(bridge, args.event, args.callbackId, '', result)
      }
      bridge.invokeCallbackFail = (args: InvokeArgs, errMsg: string) => {
        invokeCallback(bridge, args.event, args.callbackId, errMsg)
      }
      bridge.subscribeHandler = (args: PublishArgs) => {
        bridge.readyState == bridge.OPEN &&
          bridge.send(JSON.stringify({ exec: 'SUBSCRIBE_HANDLER', args }))
      }
      return bridge
    }
    return client
  }

  return {
    wss: webSocketServer,
    clients
  }
}
