import { app, BrowserWindow, ipcMain, dialog } from 'electron'
import { existsSync, readFileSync } from 'fs'
import { basename, join } from 'path'
import { MessageCenter } from '../center'
import { store } from '../store'

interface Project {
  win: BrowserWindow
  messageCenter: MessageCenter
}

const projects = new Map<string, Project>()

export { projects }

ipcMain.handle('openDirectory', async () => {
  const res = await dialog.showOpenDialog(BrowserWindow.getFocusedWindow(), {
    buttonLabel: 'open',
    properties: ['openDirectory']
  })
  if (!res.canceled) {
    const projectPath = res.filePaths[0]
    if (projectPath) {
      const projects = store.get('projects') || {}
      projects[projectPath] = { name: basename(projectPath) }
      store.set('projects', projects)
    }
  }
})

ipcMain.on('openProject', (event, projectPath) => {
  const appConfigPath = join(projectPath, 'src/app.json')
  if (existsSync(appConfigPath)) {
    const appConfig = JSON.parse(readFileSync(appConfigPath, { encoding: 'utf-8' }))
    const appId = appConfig.appId
    const messageCenter = new MessageCenter('localhost', 33233, appId)
    const project = { win: BrowserWindow.getFocusedWindow(), messageCenter }
    projects.set(appId, project)

    project.win.webContents.send('init_env', {
      USER_DATA_PATH: app.getPath('userData'),
      APP_ID: appId
    })
  }
})
