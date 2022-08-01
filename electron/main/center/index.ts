import { AppService } from '../app'
import {
  Bridge,
  createWebSocketServer,
  InvokeArgs,
  PublishArgs,
  Protocol,
  splitClientGroup
} from './center'
import { apis } from '../bridge'
import { webContents } from 'electron'
import { serviceWebContentesId, currentPageWebContentesId } from '..'

export * from './center'

export const enum Commands {
  APP_SERVICE_INVOKE = 'APP_SERVICE_INVOKE',
  APP_SERVICE_PUBLISH = 'APP_SERVICE_PUBLISH',
  WEB_VIEW_INVOKE = 'WEB_VIEW_INVOKE',
  WEB_VIEW_PUBLISH = 'WEB_VIEW_PUBLISH',
  SET_PAGE_ID = 'SET_PAGE_ID',
  SET_APP_SERVICE = 'SET_APP_SERVICE'
}

let pendingMessages = new Map<number, string[]>()

interface BridgeMessage {
  command: Commands
  args: InvokeArgs | PublishArgs
}

interface DevtoolsProtocolMessage {
  id: number
  method: string
  params: any
}

const splitQualifiedName = (string: string) => string.split('.')

const serviceDomain = ['Runtime', 'Debugger', 'Log', 'Page']

export function createBridgeCenter(appService: AppService) {
  const center = createWebSocketServer({
    onConnect: client => {
      const [main, sub] = splitClientGroup(client)
      if (main === Protocol.WEBVIEW) {
        const id = parseFloat(sub)
        const pendings = pendingMessages.get(id)
        pendings.forEach(msg => {
          client.readyState === client.OPEN && client.send(msg)
        })
        pendingMessages.delete(id)
      }
    },
    onDisconnect: client => {
      const [main, sub] = splitClientGroup(client)
      if (main === Protocol.WEBVIEW) {
        const id = parseFloat(sub)
        pendingMessages.delete(id)
      }
    },
    onRecv: async (client, message) => {
      const raw = JSON.parse(message) as BridgeMessage | DevtoolsProtocolMessage
      console.log(raw)
      if ('id' in raw) {
        const { id, method, params } = raw

        const [domain] = splitQualifiedName(method)

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
        const { command, args } = raw
        switch (command) {
          case Commands.APP_SERVICE_INVOKE:
            appServiceOnInvoke(appService, bridge, args as InvokeArgs)
            break
          case Commands.APP_SERVICE_PUBLISH:
            appServiceOnPublish(center, args as PublishArgs)
            break
          case Commands.WEB_VIEW_INVOKE:
            webViewOnInvoke(appService, bridge, args as InvokeArgs)
            break
          case Commands.WEB_VIEW_PUBLISH:
            webViewOnPublish(center, args as PublishArgs)
            break
        }
      }
    }
  })
  return center
}

function appServiceOnPublish(center: ReturnType<typeof createWebSocketServer>, args: PublishArgs) {
  const { webViewId } = args as PublishArgs
  const page = center.clients.get(Protocol.WEBVIEW).get(`${webViewId}`)
  const message = JSON.stringify({ exec: 'SUBSCRIBE_HANDLER', args })
  if (page) {
    page.send(message)
  } else {
    const pending = pendingMessages.get(webViewId)
    if (pending) {
      pending.push(message)
    } else {
      pendingMessages.set(webViewId, [message])
    }
  }
}

function webViewOnPublish(center: ReturnType<typeof createWebSocketServer>, args: PublishArgs) {
  const { event, webViewId } = args as PublishArgs

  if (
    event === 'vdSync' ||
    event === 'invokeAppServiceMethod' ||
    event === 'callbackWebViewMethod'
  ) {
    const service = center.clients.get(Protocol.APPSERVICE).get('')
    service && service.subscribeHandler(args)
  } else if (event === 'callbackAppServiceMethod' || event === 'invokeWebViewMethod') {
    const page = center.clients.get(Protocol.WEBVIEW).get(`${webViewId}`)
    page && page.subscribeHandler(args)
  } else if (event === 'WEBVIEW_FIRST_RENDER') {
    const service = center.clients.get(Protocol.APPSERVICE).get('')
    service &&
      service.subscribeHandler({
        event: 'PAGE_ON_READY',
        params: JSON.stringify({ pageId: webViewId }),
        webViewId: 0
      })
  }
}

function onInvoke(appService: AppService, bridge: Bridge, args: InvokeArgs) {
  const api = apis[args.event]
  if (api) {
    api(appService, bridge, args)
  } else {
    bridge.invokeCallbackFail(args, 'this api not implement')
  }
}

function appServiceOnInvoke(appService: AppService, bridge: Bridge, args: InvokeArgs) {
  onInvoke(appService, bridge, args)
}

function webViewOnInvoke(appService: AppService, bridge: Bridge, args: InvokeArgs) {
  onInvoke(appService, bridge, args)
}
