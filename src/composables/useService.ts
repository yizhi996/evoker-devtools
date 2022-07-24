import { Ref, ref } from 'vue'
import path from 'path'
import fs from 'fs'
import { getAppPath, webviewLoadScript } from '../utils'
import { useBridge, Bridge } from './useBridge'
import { Page } from './usePage'

export interface AppConfig {
  appId: string
  pages: AppPageInfo[]
  window?: AppStyle
  tabBar?: AppTabBar
}

interface AppPageInfo {
  path: string
  component: string
  style?: AppStyle
}

interface AppStyle {
  backgroundColor: string
  navigationBarBackgroundColor: string
  navigationBarTextStyle: 'black' | 'white'
  navigationBarTitleText: string
  navigationStyle: 'default' | 'custom'
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

export interface AppService extends Electron.WebviewTag {
  config: AppConfig
  bridge: Bridge
  pages: Ref<Page[]>
  findPage: (id: number) => Page | null
  genPageId: () => number
  onLoaded: (callback: (page: { path: string }) => void) => void
}

export function useService(appId: string, containerEl: Ref<Electron.WebviewTag | undefined>) {
  const config = ref<AppConfig>()

  const pages = ref<Page[]>([])

  let _onLoadedCallback: (page: { path: string }) => void

  const evalScript = (script: string) => {
    const container = containerEl.value!
    return container.executeJavaScript(script)
  }

  const load = () => {
    const root = getAppPath('userData')

    const appConfigFilePath = path.join(root, `App/${appId}/dist/app.json`)
    if (fs.existsSync(appConfigFilePath)) {
      const appConfig: AppConfig = JSON.parse(
        fs.readFileSync(appConfigFilePath, { encoding: 'utf-8' })
      )

      config.value = appConfig
    }
  }

  load()

  const loadAppService = async () => {
    const container = containerEl.value

    if (!container) {
      return
    }
    const root = getAppPath('userData')

    container.loadURL('file://' + root + '/SDK/appService.html')

    evalScript(
      `globalThis.__Config = { appName: '', appIcon: '', platform: 'devtools', env: 'service' }`
    )

    await webviewLoadScript(container, './devtools.global.js')
    await webviewLoadScript(container, './vue.runtime.global.js')
    await webviewLoadScript(container, './evoker.global.js')

    await webviewLoadScript(container, `../App/${appId}/dist/app-service.js`)

    setTimeout(() => {
      const page = getFirstPage()
      _onLoadedCallback && _onLoadedCallback(page)
    }, 200)
  }

  const getFirstPage = () => {
    const { pages, tabBar } = config.value!

    if (tabBar && tabBar.list && tabBar.list.length) {
      const first = tabBar.list[0]
      return { path: first.path }
    } else if (pages.length) {
      return { path: pages[0].path }
    } else {
      console.error('app.json pages cannot be empty')
      return { path: '' }
    }
  }

  let pageId = 0

  const appService: AppService = {
    config: config.value!,
    pages,
    loadAppService,
    evalScript,
    onLoaded: (callback: (page: { path: string }) => void) => {
      _onLoadedCallback = callback
    },
    findPage: (id: number) => {
      return pages.value.find(p => p.id === id)
    },
    genPageId: () => {
      return ++pageId
    }
  }

  appService.bridge = useBridge(appService, containerEl)

  return appService
}
