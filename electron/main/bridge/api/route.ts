import { BrowserWindow } from 'electron'
import { join } from 'path'
import { AppService } from '../../app'
import { Bridge, InvokeArgs } from '../center'
import fs from 'fs'

interface NavigateToParams {
  url: string
}

export function navigateTo(service: AppService, bridge: Bridge, args: InvokeArgs) {
  const params: NavigateToParams = JSON.parse(args.params)

  const win = BrowserWindow.getAllWindows()[0]
  win.webContents.send(`API_INVOKE`, args.event, params)

  bridge.invokeCallbackSuccess(args)
}
