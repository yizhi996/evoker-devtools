import { app, BrowserWindow, ipcMain, dialog } from 'electron'
import { existsSync, readFileSync } from 'fs'
import path from 'path'
import { MessageCenter } from '../center'
import { store } from '../store'
import { ProjectDevServer } from '../server'
import { execa, ExecaChildProcess } from 'execa'
import { Events } from '@shared/event'

interface Project {
  name: string
  path: string
  lastOpenedAt: number
}

interface ProjectInstance {
  win: BrowserWindow
  cli: ExecaChildProcess
  devServer: ProjectDevServer
  messageCenter: MessageCenter
}

const projects = new Map<string, ProjectInstance>()

export { projects }

ipcMain.handle(Events.OPEN_DIRECTORY_PROJECT, async () => {
  const res = await dialog.showOpenDialog(BrowserWindow.getFocusedWindow(), {
    buttonLabel: 'open',
    properties: ['openDirectory']
  })
  if (!res.canceled) {
    const projectPath = res.filePaths[0]
    if (projectPath) {
      const projects: Project[] = (store.get('k_projects') as []) || []
      const i = projects.findIndex(p => p.path === projectPath)
      if (i > -1) {
        const project = projects[i]
        project.lastOpenedAt = Date.now()
      } else {
        projects.push({
          name: path.basename(projectPath),
          path: projectPath,
          lastOpenedAt: Date.now()
        })
      }
      store.set('k_projects', projects)
      openProject(projectPath)
    }
  }
})

function openProject(projectPath: string) {
  const appConfigPath = path.join(projectPath, 'src/app.json')
  if (existsSync(appConfigPath)) {
    const appConfig = JSON.parse(readFileSync(appConfigPath, { encoding: 'utf-8' }))
    const appId = appConfig.appId

    let win: BrowserWindow
    const prevProject = projects.get(appId)
    if (prevProject) {
      prevProject.messageCenter.close()
      prevProject.devServer.close()
      prevProject.cli.kill()
      win = prevProject.win
    }

    if (!win) {
      win = BrowserWindow.getFocusedWindow()
    }

    const cli = execa('evoker', ['dev'], {
      cwd: projectPath,
      stdio: 'inherit'
    })

    const messageCenter = new MessageCenter(appId, 'localhost', 33233)
    const devServer = new ProjectDevServer(appId, 5173)
    devServer.onUpdate = () => {
      win.webContents.send('reload')
    }
    const project = { win, messageCenter, devServer, cli }
    projects.set(appId, project)

    win.webContents.send(Events.OPEN_PROJECT, { appId, path: projectPath })
  }
}

ipcMain.on(Events.OPEN_PROJECT, async (event, projectPath) => {
  openProject(projectPath)
})

ipcMain.on('show-project-menu', (event, project) => {})
