import ws from 'ws'
import { isString } from '@vue/shared'
import { webContents } from 'electron'
import { currentPageWebContentesId, serviceWebContentesId } from '../devtools'
import { apis } from '../bridge'

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

export const enum Commands {
  APP_SERVICE_INVOKE = 'APP_SERVICE_INVOKE',
  APP_SERVICE_PUBLISH = 'APP_SERVICE_PUBLISH',
  WEB_VIEW_INVOKE = 'WEB_VIEW_INVOKE',
  WEB_VIEW_PUBLISH = 'WEB_VIEW_PUBLISH',
  SET_PAGE_ID = 'SET_PAGE_ID',
  SET_APP_SERVICE = 'SET_APP_SERVICE'
}

interface BridgeMessage {
  command: Commands
  args: InvokeArgs | PublishArgs
}

interface DevtoolsProtocolMessage {
  id: number
  method: string
  params: any
}

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

export const splitProtocol = (ws: ws.WebSocket) => {
  let [main, sub = ''] = ws.protocol.split('_')
  if (!main) {
    main = Protocol.APPSERVICEDEVTOOLS
  }
  if (!isString(sub)) {
    sub = `${sub}`
  }
  return [main, sub] as [Protocol, string]
}

const serviceDomain = ['Runtime', 'Debugger', 'Log', 'Page']

export class MessageCenter {
  private wss: ws.WebSocketServer

  private host: string

  private port: number

  private pendingMessages = new Map<number, string[]>()

  private appId: string

  clients = new Map<Protocol, Map<string, ws.WebSocket>>([
    [Protocol.APPSERVICEDEVTOOLS, new Map()],
    [Protocol.APPSERVICE, new Map()],
    [Protocol.WEBVIEW, new Map()]
  ])

  constructor(host: string, port: number, appId: string) {
    this.host = host
    this.port = port
    this.appId = appId

    this.wss = new ws.WebSocketServer({ host, port })

    this.setup()
  }

  private setup() {
    log(`run: ${this.host}:${this.port}`)

    this.wss.on('connection', client => {
      this.onConnection(client)
    })

    this.wss.on('error', (error: Error & { code?: string }) => {
      if (error.code === 'EADDRINUSE') {
        log(`port: ${this.port} is already in use`)
        this.wss = new ws.WebSocketServer({ host: this.host, port: ++this.port })
        this.setup()
      } else {
        warn(`error: ${error}`)
      }
    })
  }

  private invokeCallback(
    bridge: Bridge,
    event: string,
    callbackId: number,
    errMsg: string,
    data?: Record<string, any>
  ) {
    const result = JSON.stringify({
      id: callbackId,
      event,
      errMsg,
      data: data || {}
    })
    bridge.readyState == bridge.OPEN &&
      bridge.send(JSON.stringify({ exec: 'INVOKE_CALLBACK', result }))
  }

  private clientToBridge(client: ws.WebSocket) {
    const [main] = splitProtocol(client)
    if (main === Protocol.APPSERVICE || main === Protocol.WEBVIEW) {
      const bridge = client as Bridge
      if (bridge.invokeCallbackSuccess) {
        return bridge
      }
      bridge.invokeCallbackSuccess = (args: InvokeArgs, result?: Record<string, any>) => {
        this.invokeCallback(bridge, args.event, args.callbackId, '', result)
      }
      bridge.invokeCallbackFail = (args: InvokeArgs, errMsg: string) => {
        this.invokeCallback(bridge, args.event, args.callbackId, errMsg)
      }
      bridge.subscribeHandler = (args: PublishArgs) => {
        bridge.readyState == bridge.OPEN &&
          bridge.send(JSON.stringify({ exec: 'SUBSCRIBE_HANDLER', args }))
      }
    }
  }

  private onConnection(client: ws.WebSocket) {
    log(`client connected: ${client.protocol}`)

    this.clientToBridge(client)

    const [main, sub] = splitProtocol(client)

    const group = this.clients.get(main)
    group.set(sub, client)

    if (main === Protocol.WEBVIEW) {
      const id = parseFloat(sub)
      const pendings = this.pendingMessages.get(id)
      pendings?.forEach(message => {
        client.readyState === client.OPEN && client.send(message)
      })
      this.pendingMessages.delete(id)
    }

    client.on('close', () => {
      log('client close connection')

      if (main === Protocol.WEBVIEW) {
        const id = parseFloat(sub)
        this.pendingMessages.delete(id)
      }

      group.delete(sub)
    })

    client.on('error', error => {
      warn(`client connection error: ${error}`)

      if (main === Protocol.WEBVIEW) {
        const id = parseFloat(sub)
        this.pendingMessages.delete(id)
      }

      group.delete(sub)
    })

    client.on('message', data => {
      const message = data.toString()
      this.onRecv(client, JSON.parse(message))
    })
  }

  private onRecv(client: ws.WebSocket, message: BridgeMessage | DevtoolsProtocolMessage) {
    console.log(message)
    if ('id' in message) {
      const { id, method, params } = message

      const [domain] = method.split('.')

      const send = (debuggerInstance: Electron.Debugger) => {
        if (!debuggerInstance.isAttached()) {
          debuggerInstance.attach()
        }
        debuggerInstance
          .sendCommand(method, params)
          .then(result => {
            client.send(JSON.stringify({ id, method, result }))
          })
          .catch(error => {
            client.send(
              JSON.stringify({ id, method, error: { code: -32000, message: error.message } })
            )
          })
      }

      let debuggerInstance: Electron.Debugger
      if (serviceDomain.includes(domain)) {
        const service = webContents.fromId(serviceWebContentesId)
        debuggerInstance = service.debugger
      } else {
        const page = webContents.fromId(currentPageWebContentesId)
        debuggerInstance = page.debugger
      }

      debuggerInstance && send(debuggerInstance)
    } else {
      const bridge = client as Bridge
      const { command, args } = message
      switch (command) {
        case Commands.APP_SERVICE_INVOKE:
          this.onInvoke(bridge, args as InvokeArgs)
          break
        case Commands.APP_SERVICE_PUBLISH:
          this.appServiceOnPublish(args as PublishArgs)
          break
        case Commands.WEB_VIEW_INVOKE:
          this.onInvoke(bridge, args as InvokeArgs)
          break
        case Commands.WEB_VIEW_PUBLISH:
          this.webViewOnPublish(args as PublishArgs)
          break
      }
    }
  }

  private appServiceOnPublish(args: PublishArgs) {
    const { webViewId } = args as PublishArgs
    const page = this.clients.get(Protocol.WEBVIEW).get(`${webViewId}`)
    const message = JSON.stringify({ exec: 'SUBSCRIBE_HANDLER', args })
    if (page) {
      page.send(message)
    } else {
      const pending = this.pendingMessages.get(webViewId)
      if (pending) {
        pending.push(message)
      } else {
        this.pendingMessages.set(webViewId, [message])
      }
    }
  }

  private webViewOnPublish(args: PublishArgs) {
    const { event, webViewId } = args as PublishArgs

    if (
      event === 'vdSync' ||
      event === 'invokeAppServiceMethod' ||
      event === 'callbackWebViewMethod'
    ) {
      const service = this.clients.get(Protocol.APPSERVICE).get('') as Bridge
      service && service.subscribeHandler(args)
    } else if (event === 'callbackAppServiceMethod' || event === 'invokeWebViewMethod') {
      const page = this.clients.get(Protocol.WEBVIEW).get(`${webViewId}`) as Bridge
      page && page.subscribeHandler(args)
    } else if (event === 'WEBVIEW_FIRST_RENDER') {
      const service = this.clients.get(Protocol.APPSERVICE).get('') as Bridge
      service &&
        service.subscribeHandler({
          event: 'PAGE_ON_READY',
          params: JSON.stringify({ pageId: webViewId }),
          webViewId: 0
        })
    }
  }

  private onInvoke(bridge: Bridge, args: InvokeArgs) {
    const api = apis[args.event]
    if (api) {
      api(this.appId, bridge, args)
    } else {
      bridge.invokeCallbackFail(args, 'this api not implement')
    }
  }
}
