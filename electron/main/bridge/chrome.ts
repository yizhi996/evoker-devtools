import { ipcMain, webContents } from 'electron'

interface ChromeDevtoolsProtocol {
  debuggerId: number
  method: string
  commandParams: any
}

ipcMain.handle('Chrome-DevTools-Protocol', async (event, protocol: ChromeDevtoolsProtocol) => {
  const devtools = webContents.fromId(protocol.debuggerId)
  if (!devtools.debugger.isAttached()) {
    devtools.debugger.attach()
  }
  return await devtools.debugger.sendCommand(protocol.method, protocol.commandParams)
})
