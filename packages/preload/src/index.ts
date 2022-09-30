import { contextBridge, ipcRenderer } from 'electron'
import path from 'path'
import fs from 'fs'
import type { IpcRendererEvent } from 'electron'
import type { ENV, Project } from '../types/global'
import { Events } from '#shared'

export const API = {
  /** 初始化 env 时调用 */
  onInitEnv: (callback: (event: IpcRendererEvent, env: ENV) => void) =>
    ipcRenderer.on(Events.INIT_ENV, callback),
  /** 需要执行 api 时调用 */
  onApiInvoke: (
    callback: (event: IpcRendererEvent, eventName: string, params: Record<string, any>) => void,
  ) => ipcRenderer.on(Events.API_INVOKE, callback),
  onOpenProject: (callback: (event: IpcRendererEvent, project: Project) => void) =>
    ipcRenderer.on(Events.OPEN_PROJECT, callback),
  onReload: (callback: (event: IpcRendererEvent) => void) =>
    ipcRenderer.on(Events.RELOAD, callback),
  openDevtools: (appId: string, service: number, devtools: number, webview: number) =>
    ipcRenderer.send(Events.OPEN_DEVTOOLS, appId, service, devtools, webview),
  setWebViewContentsId: (appId: string, webContentsId: number) =>
    ipcRenderer.send(Events.SET_WEBVIEW_CONTENTS_ID, appId, webContentsId),
  getStorageValue: (key: string) => ipcRenderer.invoke(Events.GET_STORE_VALUE, key),
  setStorageValue: (key: string, value: unknown) =>
    ipcRenderer.invoke(Events.SET_STORE_VALUE, key, value),
  selectProjectDestDir: () => ipcRenderer.invoke(Events.SELECT_PROJECT_DESTINATION_DIRECTORY),
  openDirProject: () => ipcRenderer.invoke(Events.OPEN_DIRECTORY_PROJECT),
  openProject: (path: string) => ipcRenderer.send(Events.OPEN_PROJECT, path),
  showProjectMenu: (project: Project) => ipcRenderer.send(Events.SHOW_PROJECT_MENU, project),
  maximizeWindow: () => ipcRenderer.send(Events.MAXIMIZE_WINDOW),
}

contextBridge.exposeInMainWorld('electronAPI', API)

export { path, fs }
