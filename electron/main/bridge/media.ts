import { app } from 'electron'
import { join } from 'path'
import { AppService } from '../app'
import { Bridge, InvokeArgs } from '../center'
import fs from 'fs'

interface GetLocalImageParams {
  path: string
}

export function getLocalImage(service: AppService, bridge: Bridge, args: InvokeArgs) {
  const { path }: GetLocalImageParams = JSON.parse(args.params)

  let src: string = ''
  if (path.startsWith('ekfile://')) {
  } else {
    const filePath = join(app.getPath('userData'), `App/${service.appId}/dist/${path}`)
    src = `data:image/png;base64, ` + fs.readFileSync(filePath, { encoding: 'base64' })
  }
  bridge.invokeCallbackSuccess(args, { src })
}
