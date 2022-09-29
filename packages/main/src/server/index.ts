import { app } from 'electron'
import path from 'path'
import AdmZip from 'adm-zip'
import ws from 'ws'
import { store } from '../store'

const enum Methods {
  APP_INFO = '--APPINFO--',
  CHECK_VERSION = '--CHECKVERSION--',
  UPDATE = '--UPDATE--',
}

interface AppUpdateInfo {
  appId: string
  version: string
  files: string[]
}

export class ProjectDevServer {
  private ws: ws.WebSocket

  private port: number

  private appId: string

  private version: string

  private needUpdateFiles: string[] = []

  private retryTimes: number = 0

  private stop = false

  onUpdate: () => void | null

  constructor(appId: string, port: number = 5173) {
    this.appId = appId
    this.port = port
    this.version = (store.get(`app_version:${appId}`) as string) || '0'
    this.connection()
  }

  private connection() {
    this.ws = new ws.WebSocket(`ws://192.168.0.102:${this.port}`)

    this.ws.on('connection', () => {
      this.retryTimes = 0
      console.log('connected')
    })

    this.ws.on('close', () => {
      !this.stop &&
        setTimeout(() => {
          console.log('retry connect dev server')
          this.retryTimes <= 5 && this.retryTimes++
          this.connection()
        }, 1000 * this.retryTimes * 2)
    })

    this.ws.on('error', err => {
      console.log('ws err', err)
    })

    this.ws.on('message', data => {
      const head = data.slice(0, 64)
      const body = data.slice(64)
      const headString = head.toString().replace(/\0/g, '')
      switch (headString) {
        case Methods.APP_INFO:
          this.setAppInfo(body)
          break
        case Methods.UPDATE:
          this.update(body)
          break
        default:
          this.recvFile(body, headString.split('---'))
          break
      }
    })
  }

  close() {
    this.stop = true
    this.ws.close()
  }

  private send(data: string | Buffer) {
    this.ws.readyState == ws.OPEN && this.ws.send(data)
  }

  private setAppInfo(body: Buffer | ArrayBuffer | Buffer[]) {
    const { appId, version, envVersion } = JSON.parse(body.toString()) as {
      appId: string
      version: string
      envVersion: string
    }

    const data = {
      event: 'version',
      data: { version: this.version },
    }
    this.send(JSON.stringify(data))
  }

  private update(body: Buffer | ArrayBuffer | Buffer[]) {
    const { appId, version, files } = JSON.parse(body.toString()) as AppUpdateInfo
    console.log(appId, this.appId, files)
    if (appId !== this.appId) {
      return
    }
    this.version = version
    store.set(`app_version:${appId}`, version)
    this.needUpdateFiles = files
  }

  private recvFile(body: Buffer | ArrayBuffer | Buffer[], header: string[]) {
    const [appId, version, pkg] = header

    if (appId !== this.appId) {
      return
    }

    if (!this.needUpdateFiles.length) {
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

    const index = this.needUpdateFiles.indexOf(pkg)
    console.log(dest, index)

    if (index > -1) {
      console.log(`${pkg} update`)
      const zip = new AdmZip(body)
      zip.extractAllTo(dest, true)
      this.needUpdateFiles.splice(index, 1)
    }
    console.log(this.needUpdateFiles)
    if (this.needUpdateFiles.length === 0) {
      console.log('reload')
      this.onUpdate?.()
    }
  }
}
