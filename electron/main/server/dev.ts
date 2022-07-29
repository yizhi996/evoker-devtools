import { app, webContents } from 'electron'
import path from 'path'
import AdmZip from 'adm-zip'
import ws from 'ws'
import { store } from '../store'

const enum Methods {
  CHECK_VERSION = '--CHECKVERSION--',
  UPDATE = '--UPDATE--'
}

export function createWebSocketClient(port: number = 5173) {
  let client = new ws.WebSocket(`ws://127.0.0.1:${port}`)
  client.on('connection', () => {
    console.log('connected')
  })

  client.on('close', () => {
    setTimeout(() => {
      console.log('retry connect dev server')
      client = createWebSocketClient(port)
    }, 1000)
  })

  client.on('error', err => {
    console.log(err)
  })

  client.on('message', (data, isBinary) => {
    if (isBinary) {
      const head = data.slice(0, 64)
      const body = data.slice(64)
      const headString = head.toString().replace(/\0/g, '')
      switch (headString) {
        case Methods.CHECK_VERSION:
          checkVersion(client, body)
          break
        case Methods.UPDATE:
          update(client, body)
          break
        default:
          recvFile(client, body, headString.split('---'))
          break
      }
    }
  })
  return client
}

const appVersions = new Map<string, string>()

function checkVersion(client: ws.WebSocket, body: Buffer | ArrayBuffer | Buffer[]) {
  const { appId } = JSON.parse(body.toString()) as { appId: string }
  const data = {
    event: 'version',
    data: {
      version: appVersions[appId] || store.get(`app_version:${appId}`) || '0'
    }
  }
  client.send(JSON.stringify(data))
}

interface AppUpdateInfo {
  appId: string
  version: string
  files: string[]
}

const needUpdateApps = new Map<string, AppUpdateInfo>()

function update(client: ws.WebSocket, body: Buffer | ArrayBuffer | Buffer[]) {
  const message: AppUpdateInfo = JSON.parse(body.toString())
  const { appId, version } = message
  appVersions[appId] = version
  store.set(`app_version:${appId}`, version)
  needUpdateApps.set(appId, message)
}

function recvFile(client: ws.WebSocket, body: Buffer | ArrayBuffer | Buffer[], header: string[]) {
  const [appId, pkg] = header

  const options = needUpdateApps.get(appId)
  if (!options) {
    return
  }

  let dest: string
  if (pkg === 'app') {
    dest = path.join(app.getPath('userData'), `App/${appId}/dist`)
  } else if (pkg === 'sdk') {
    dest = path.join(app.getPath('userData'), `SDK`)
  } else {
    return
  }

  const index = options.files.indexOf(pkg)
  if (index > -1) {
    console.log(`${pkg} update`)
    const zip = new AdmZip(body)
    zip.extractAllTo(dest, true)
    options.files.splice(index, 1)
  }

  if (options.files.length === 0) {
    console.log('reload')
    needUpdateApps.delete(appId)
    webContents.getAllWebContents()[0].reload()
  }
}
