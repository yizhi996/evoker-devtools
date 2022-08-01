interface ENV {
  USER_DATA_PATH: string
  APP_ID: string
}

declare global {
  interface Window {
    env: ENV
  }
}

export {}
