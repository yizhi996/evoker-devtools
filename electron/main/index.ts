import { app, BrowserWindow, shell, ipcMain, webContents } from 'electron'
import { release } from 'os'
import { join } from 'path'
import './store'
import './menu'
import { loadSDK } from './load'
import { createWebSocketClient } from './server/dev'
import { createWebSocketServer } from './server'

export const enum Commands {
  APP_SERVICE_INVOKE = 'APP_SERVICE_INVOKE',
  APP_SERVICE_PUBLISH = 'APP_SERVICE_PUBLISH',
  WEB_VIEW_INVOKE = 'WEB_VIEW_INVOKE',
  WEB_VIEW_PUBLISH = 'WEB_VIEW_PUBLISH',
  SET_PAGE_ID = 'SET_PAGE_ID'
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

// Disable GPU Acceleration for Windows 7
if (release().startsWith('6.1')) app.disableHardwareAcceleration()

// Set application name for Windows 10+ notifications
if (process.platform === 'win32') app.setAppUserModelId(app.getName())

if (!app.requestSingleInstanceLock()) {
  app.quit()
  process.exit(0)
}

process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true'

export const ROOT_PATH = {
  // /dist
  dist: join(__dirname, '../..'),
  // /dist or /public
  public: join(__dirname, app.isPackaged ? '../..' : '../../../public')
}

let win: BrowserWindow | null = null
// Here, you can also use other preload
const preload = join(__dirname, '../preload/index.js')
// 🚧 Use ['ENV_NAME'] avoid vite:define plugin
const url = `http://${process.env['VITE_DEV_SERVER_HOST']}:${process.env['VITE_DEV_SERVER_PORT']}`
const indexHtml = join(ROOT_PATH.dist, 'index.html')

const devClient = createWebSocketClient()

const wss = createWebSocketServer({
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
        const { webViewId } = args as PublishArgs
        console.log(webViewId)
        const page = wss.clients().find(c => c.pageId === webViewId)
        page && page.send(JSON.stringify({ exec: 'SUBSCRIBE_HANDLER', args }))
        break
      case Commands.WEB_VIEW_INVOKE:
        break
      case Commands.WEB_VIEW_PUBLISH:
        break
      case Commands.SET_PAGE_ID:
        client.pageId = args as any
        break
    }
  }
})

async function createWindow() {
  win = new BrowserWindow({
    title: 'Evoker Devtools',
    icon: join(ROOT_PATH.public, 'favicon.ico'),
    webPreferences: {
      preload,
      nodeIntegration: true,
      contextIsolation: false,
      webviewTag: true
    }
  })

  win.maximize()

  if (app.isPackaged) {
    win.loadFile(indexHtml)
  } else {
    win.loadURL(url)
  }

  // Test actively push message to the Electron-Renderer
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', new Date().toLocaleString())
  })

  // Make all links open with the browser, not with the application
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https:')) shell.openExternal(url)
    return { action: 'deny' }
  })
}

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  win = null
  if (process.platform !== 'darwin') app.quit()
})

app.on('second-instance', () => {
  if (win) {
    // Focus on the main window if the user tried to open another
    if (win.isMinimized()) win.restore()
    win.focus()
  }
})

app.on('activate', () => {
  const allWindows = BrowserWindow.getAllWindows()
  if (allWindows.length) {
    allWindows[0].focus()
  } else {
    createWindow()
  }
})

// new window example arg: new windows url
ipcMain.handle('open-win', (event, arg) => {
  const childWindow = new BrowserWindow({
    webPreferences: {
      preload
    }
  })

  if (app.isPackaged) {
    childWindow.loadFile(indexHtml, { hash: arg })
  } else {
    childWindow.loadURL(`${url}/#${arg}`)
    // childWindow.webContents.openDevTools({ mode: "undocked", activate: true })
  }
})

ipcMain.on('open-devtools', (event, targetId, devtoolsId) => {
  const target = webContents.fromId(targetId)
  const devtools = webContents.fromId(devtoolsId)
  target.setDevToolsWebContents(devtools)
  target.openDevTools()
  devtools.executeJavaScript('window.location.reload()')
})

ipcMain.handle('get-app-path', event => {
  const names: any[] = [
    'home',
    'appData',
    'userData',
    'cache',
    'temp',
    'exe',
    'module',
    'desktop',
    'documents',
    'downloads',
    'music',
    'pictures',
    'videos',
    'logs',
    'crashDumps'
  ]
  const result: Record<string, string> = {}
  for (const i in names) {
    const name = names[i]
    result[name] = app.getPath(name)
  }
  return result
})
