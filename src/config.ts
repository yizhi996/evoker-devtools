import { getUserDataPath } from './utils'
import fs from 'fs'
import path from 'path'

export interface AppConfig {
  appId: string
  pages: AppPageInfo[]
  window?: AppStyle
  tabBar?: AppTabBar
}

export interface AppPageInfo {
  path: string
  component: string
  style?: AppStyle
}

export interface AppStyle {
  backgroundColor?: string
  navigationBarBackgroundColor?: string
  navigationBarTextStyle?: 'black' | 'white'
  navigationBarTitleText?: string
  navigationStyle?: 'default' | 'custom'
}

export interface AppTabBar {
  list: AppTabBarItem[]
  color?: string
  selectedColor?: string
  backgroundColor?: string
  borderStyle?: 'white' | 'black'
}

export interface AppTabBarItem {
  path: string
  text: string
  iconPath?: string
  selectedIconPath?: string
}

export function loadAppConfig() {
  const root = getUserDataPath()

  const appConfigFilePath = path.join(root, `App/${window.project.appId}/dist/app.json`)
  if (fs.existsSync(appConfigFilePath)) {
    const appConfig: AppConfig = JSON.parse(
      fs.readFileSync(appConfigFilePath, { encoding: 'utf-8' })
    )

    return appConfig
  }
}
