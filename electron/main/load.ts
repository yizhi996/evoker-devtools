import { app, ipcMain } from 'electron'

import fs from 'fs'
import path from 'path'
import AdmZip from 'adm-zip'

export async function loadSDK() {
//   const fp = path.resolve(__dirname, 'assets/SDK/evoker-sdk.evpkg')
//   if (fs.existsSync(fp)) {
//     const zip = new AdmZip(fp)
//     zip.extractAllTo(path.join(app.getPath('userData'), '/SDK'), true)
//   }
}

