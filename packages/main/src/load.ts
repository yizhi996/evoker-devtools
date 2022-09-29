import { app } from 'electron'
import * as fs from 'fs'
import * as path from 'path'
import AdmZip from 'adm-zip'

export async function unpackSDK() {
  const fp = path.resolve(__dirname, 'assets/SDK/evoker-sdk.evpkg')
  console.log(app.getPath('userData'))
  if (fs.existsSync(fp)) {
    const zip = new AdmZip(fp)
    zip.extractAllTo(path.join(app.getPath('userData'), '/SDK'), true)
  }
}
