import { app } from 'electron'
import path from 'path'
import AdmZip from 'adm-zip'
import ws from 'ws'

const enum Methods {
  CHECK_VERSION = '--CHECKVERSION--',
  UPDATE = '--UPDATE--'
}

export function createWebSocketClient(port: number = 5173) {
  const client = new ws.WebSocket(`ws://127.0.0.1:${port}`)
  client.on('connection', () => {
    console.log('connected')
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
  const message = JSON.parse(body.toString())
  const data = {
    event: 'version',
    data: { version: appVersions[message.appId] || '0' }
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
  const { appId } = message
  appVersions[appId] = message.version
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

  console.log(dest)

  const zip = new AdmZip(body)
  zip.extractAllTo(dest, true)
}
