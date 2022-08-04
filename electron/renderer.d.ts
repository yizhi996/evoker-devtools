interface ENV {
  DESKTOP_PATH: string
  USER_DATA_PATH: string
}

interface Project {
  appId: string
  name: string
  path: string
}

declare global {
  interface Window {
    project: Project
    env: ENV
  }
}

export {}
