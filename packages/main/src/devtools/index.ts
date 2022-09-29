import { ipcMain, webContents } from 'electron'
import { Protocol } from '../center'
import { projects } from '../project'
import { Events } from '#shared'

let serviceWebContentesId = 0

let devtoolsWebContentesId = 0

let firstWebContentsId = 0

let currentPageWebContentesId = 0

export { serviceWebContentesId, devtoolsWebContentesId, currentPageWebContentesId }

ipcMain.on(Events.OPEN_DEVTOOLS, (event, appId, serviceId, devtoolsId, webId) => {
  const service = webContents.fromId(serviceId)
  const devtools = webContents.fromId(devtoolsId)

  serviceWebContentesId = serviceId
  devtoolsWebContentesId = devtoolsId
  currentPageWebContentesId = webId

  function onMessage(event: Electron.Event, method: string, params: any) {
    const project = projects.get(appId)
    if (project) {
      const bridge = project.messageCenter.clients.get(Protocol.APPSERVICEDEVTOOLS).get('')
      bridge?.send(JSON.stringify({ method, params }))
    }
  }

  const webview = webContents.fromId(webId)
  if (firstWebContentsId) {
    const prev = webContents.fromId(firstWebContentsId)
    prev?.debugger.removeListener('message', onMessage)
  }
  webview.debugger.addListener('message', onMessage)

  firstWebContentsId = webId

  devtools.loadURL('devtools://devtools/bundled/devtools_app.html?ws=localhost:33233')

  service.debugger.addListener('message', onMessage)
})

ipcMain.on(Events.SET_WEBVIEW_CONTENTS_ID, async (_, appId, targetId) => {
  function onMessage(event: Electron.Event, method: string, params: any) {
    const project = projects.get(appId)
    if (project) {
      const bridge = project.messageCenter.clients.get(Protocol.APPSERVICEDEVTOOLS).get('')
      bridge?.send(JSON.stringify({ method, params }))
    }
  }

  const target = webContents.fromId(targetId)
  if (currentPageWebContentesId) {
    const prev = webContents.fromId(targetId)
    prev?.debugger.removeListener('message', onMessage)
  }
  const needsReloadElementsPanel = targetId !== currentPageWebContentesId
  currentPageWebContentesId = targetId

  target.debugger.addListener('message', onMessage)

  if (needsReloadElementsPanel) {
    if (!target.debugger.isAttached()) {
      target.debugger.attach()
    }
    await target.debugger.sendCommand('DOM.enable', {})
    await target.debugger.sendCommand('CSS.enable', {})
    await target.debugger.sendCommand('Overlay.enable', {})

    const project = projects.get(appId)
    if (project) {
      const bridge = project.messageCenter.clients.get(Protocol.APPSERVICEDEVTOOLS).get('')
      bridge?.send(JSON.stringify({ method: 'DOM.documentUpdated', params: {} }))
    }
  }
})
