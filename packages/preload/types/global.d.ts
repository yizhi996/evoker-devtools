import { API } from '../src'

export interface ENV {
  DESKTOP_PATH: string
  USER_DATA_PATH: string
}

export interface Project {
  appId: string
  name: string
  path: string
}

declare global {
  interface Window {
    project: Project
    env: ENV
    electronAPI: typeof API
  }
}

export {}
