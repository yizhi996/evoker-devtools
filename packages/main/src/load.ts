import { app } from 'electron'
import * as fs from 'fs'
import * as path from 'path'
import AdmZip from 'adm-zip'

export async function unpackSDK() {
  const filePath = path.resolve(__dirname, 'assets/SDK/evoker-sdk.evpkg')
  const dest = path.join(app.getPath('userData'), '/SDK')
  if (fs.existsSync(filePath)) {
    const zip = new AdmZip(filePath)
    zip.extractAllTo(dest, true)
  }
  
  const devtoolsFilePath = path.resolve(__dirname, 'assets/SDK/devtools.global.prod.js')
  if (fs.existsSync(devtoolsFilePath)) {
    fs.copyFileSync(devtoolsFilePath, path.join(dest, 'devtools.global.prod.js'))
  }
}
