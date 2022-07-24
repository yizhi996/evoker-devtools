import { createWebSocketServer } from '../server'

export const enum Commands {
  APP_SERVICE_INVOKE = 'APP_SERVICE_INVOKE',
  APP_SERVICE_PUBLISH = 'APP_SERVICE_PUBLISH',
  WEB_VIEW_INVOKE = 'WEB_VIEW_INVOKE',
  WEB_VIEW_PUBLISH = 'WEB_VIEW_PUBLISH',
  SET_PAGE_ID = 'SET_PAGE_ID',
  SET_APP_SERVICE = 'SET_APP_SERVICE'
}

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

const bridge = createWebSocketServer({
  onConnect: () => {},
  onDisconnect: () => {},
  onRecv: (client, message) => {
    const { command, args }: { command: Commands; args: InvokeArgs | PublishArgs } =
      JSON.parse(message)
    console.log('recv', command)
    switch (command) {
      case Commands.APP_SERVICE_INVOKE:
        break
      case Commands.APP_SERVICE_PUBLISH:
        appServiceOnPublish(args as PublishArgs)
        break
      case Commands.WEB_VIEW_INVOKE:
        webViewOnInvoke(args as InvokeArgs)
        break
      case Commands.WEB_VIEW_PUBLISH:
        webViewOnPublish(args as PublishArgs)
        break
      case Commands.SET_PAGE_ID:
        client.pageId = args as any
        break
      case Commands.SET_APP_SERVICE:
        client.isService = true
        break
    }
  }
})

function appServiceOnPublish(args: PublishArgs) {
  const { webViewId } = args as PublishArgs
  const page = bridge.clients().find(c => c.pageId === webViewId)
  page && page.send(JSON.stringify({ exec: 'SUBSCRIBE_HANDLER', args }))
}

function webViewOnPublish(args: PublishArgs) {
  const { event, webViewId } = args as PublishArgs

  if (
    event === 'vdSync' ||
    event === 'invokeAppServiceMethod' ||
    event === 'callbackWebViewMethod'
  ) {
    const service = bridge.clients().find(c => c.isService)
    service && service.send(JSON.stringify({ exec: 'SUBSCRIBE_HANDLER', args }))
  } else if (event === 'callbackAppServiceMethod' || event === 'invokeWebViewMethod') {
    const page = bridge.clients().find(c => c.pageId === webViewId)
    page && page.send(JSON.stringify({ exec: 'SUBSCRIBE_HANDLER', args }))
  } else if (event === 'WEBVIEW_FIRST_RENDER') {
    const service = bridge.clients().find(c => c.isService)
    service &&
      service.send(
        JSON.stringify({
          exec: 'SUBSCRIBE_HANDLER',
          args: { event: 'PAGE_ON_READY', params: JSON.stringify({ pageId: webViewId }) }
        })
      )
  }
}

function webViewOnInvoke(args: InvokeArgs) {}
