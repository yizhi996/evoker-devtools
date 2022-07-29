import { AppService } from '../app'
import { Bridge, createWebSocketServer, InvokeArgs, PublishArgs } from './center'
import { apis } from './api'
import './chrome'
import { webContents } from 'electron'
import { devtoolsWebContentesId, serviceWebContentesId } from '..'

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

export function createBridgeCenter(appService: AppService) {
  const center = createWebSocketServer({
    onConnect: () => {},
    onDisconnect: bridge => {
      if (!bridge.isService) {
        pendingMessages.delete(bridge.pageId)
      }
    },
    onRecv: async (bridge, message) => {
      const raw = JSON.parse(message) as BridgeMessage | DevtoolsProtocolMessage
      console.log(raw)
      if ('id' in raw) {
        bridge.isDevtools = true
        const { id, method, params } = raw
        const devtools = webContents.fromId(serviceWebContentesId)
        if (!devtools.debugger.isAttached()) {
          devtools.debugger.attach()
        }
        devtools.debugger
          .sendCommand(method, params)
          .then(result => {
            bridge.send(JSON.stringify({ id, method, result }))
          })
          .catch(error => {
            bridge.send(
              JSON.stringify({ id, method, error: { code: -32000, message: error.message } })
            )
          })
      } else {
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
          case Commands.SET_PAGE_ID:
            bridge.pageId = args as any
            const pending = pendingMessages.get(bridge.pageId)
            if (pending) {
              pending.forEach(message => bridge.send(message))
              pendingMessages.delete(bridge.pageId)
            }
            break
          case Commands.SET_APP_SERVICE:
            bridge.isService = true
            break
        }
      }
    }
  })
  return center
}

function appServiceOnPublish(center: ReturnType<typeof createWebSocketServer>, args: PublishArgs) {
  const { webViewId } = args as PublishArgs
  const page = center.clients().find(c => c.pageId === webViewId)
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
    const service = center.clients().find(c => c.isService)
    service && service.subscribeHandler(args)
  } else if (event === 'callbackAppServiceMethod' || event === 'invokeWebViewMethod') {
    const page = center.clients().find(c => c.pageId === webViewId)
    page && page.subscribeHandler(args)
  } else if (event === 'WEBVIEW_FIRST_RENDER') {
    const service = center.clients().find(c => c.isService)
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
