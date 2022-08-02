import { BrowserWindow } from 'electron'
import { Bridge, InvokeArgs } from '../center'

interface NavigateToParams {
  url: string
}

export function navigateTo(appId: string, bridge: Bridge, args: InvokeArgs) {
  const params: NavigateToParams = JSON.parse(args.params)

  const win = BrowserWindow.getAllWindows()[0]
  win.webContents.send(`API_INVOKE`, args.event, params)

  bridge.invokeCallbackSuccess(args)
}

interface NavigateBackParams {
  delta?: number
}

export function navigateBack(appId: string, bridge: Bridge, args: InvokeArgs) {
  const params: NavigateBackParams = JSON.parse(args.params)

  const win = BrowserWindow.getAllWindows()[0]
  win.webContents.send(`API_INVOKE`, args.event, params)

  bridge.invokeCallbackSuccess(args)
}
