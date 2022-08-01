import { Ref, ref } from 'vue'
import path from 'path'
import fs from 'fs'
import { getUserDataPath, webviewLoadScript } from '../utils'
import { useBridge, Bridge } from './useBridge'
import { extend } from '@vue/shared'
import { deviceInfo } from './useDevice'
import { PageInfo } from './usePage'

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

export interface AppService extends Electron.WebviewTag {
  config: AppConfig
  bridge: Bridge
  pages: Ref<PageInfo[]>
  evalScript: (script: string) => Promise<any>
  loadAppService: () => void
  findPage: (pageId: number) => PageInfo | undefined
  genPageId: () => number
  onLoaded: (callback: (page: PageInfo) => void) => void
  onPush: (callback: (page: PageInfo) => void) => void
  onBack: (callback: (delta: number) => void) => void
  push: (url: string) => void
  back: (delta: number) => void
}

export let globalAppService: AppService | undefined

export function useService(containerEl: Ref<Electron.WebviewTag | undefined>) {
  if (globalAppService) {
    return globalAppService
  }
  const config = ref<AppConfig>()

  const pages = ref<PageInfo[]>([])

  let _onLoadedCallback: (page: PageInfo) => void

  let _onPushCallback: (page: PageInfo) => void

  let _onBackCallback: (delta: number) => void

  const evalScript = (script: string) => {
    const container = containerEl.value!
    return container.executeJavaScript(script)
  }

  const load = () => {
    const root = getUserDataPath()

    const appConfigFilePath = path.join(root, `App/${window.env.APP_ID}/dist/app.json`)
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
    const root = getUserDataPath()

    container.loadURL('file://' + root + '/SDK/appService.html')

    evalScript(
      `globalThis.__Config = { appName: '', appIcon: '', platform: 'devtools', env: 'service' }`
    )

    await webviewLoadScript(container, './devtools.global.js')
    await webviewLoadScript(container, './vue.runtime.global.js')
    await webviewLoadScript(container, './evoker.global.js')

    await webviewLoadScript(container, `../App/${window.env.APP_ID}/dist/app-service.js`)

    setTimeout(() => {
      const pageInfo = getFirstPage()!
      pages.value.push(pageInfo)
      onLoad(pageInfo)
      onShow(pageInfo)
    }, 200)
  }

  const getWindowInfo = () => {
    const { window } = config.value!
    return {
      backgroundColor: window?.backgroundColor || '#ffffff',
      navigationBarBackgroundColor: window?.navigationBarBackgroundColor || '#ffffff',
      navigationBarTextStyle: window?.navigationBarTextStyle || 'black',
      navigationBarTitleText: window?.navigationBarTitleText || '',
      navigationStyle: window?.navigationStyle || 'default'
    }
  }

  const getPageInfo = (page: AppPageInfo): PageInfo => {
    const { tabBar } = config.value!
    let isTabBar = false
    if (tabBar && tabBar.list) {
      const i = tabBar.list.findIndex(p => p.path === page.path)
      isTabBar = i > -1
    }

    let tabBarHeight = 0
    if (isTabBar) {
      tabBarHeight = tabBar!.list.length ? 44 + deviceInfo.device.safeAreaInsets.bottom : 0
    }

    const navigationBarHeight = deviceInfo.device.safeAreaInsets.top + 44

    let style = getWindowInfo()
    if (page.style) {
      extend(style, page.style)
    }

    return {
      pageId: ++pageId,
      path: page.path,
      style,
      isTabBar,
      top: navigationBarHeight,
      width: deviceInfo.device.width,
      height: deviceInfo.device.height - navigationBarHeight - tabBarHeight
    }
  }

  const getFirstPage = () => {
    const { pages, tabBar } = config.value!

    if (tabBar && tabBar.list && tabBar.list.length) {
      const first = tabBar.list[0]
      const page = pages.find(p => p.path === first.path)
      if (page) {
        return getPageInfo(page)
      }
    }

    if (pages.length) {
      return getPageInfo(pages[0])
    } else {
      console.error('app.json pages cannot be empty')
    }
  }

  let pageId = 0

  const appService: AppService = {
    config: config.value!,
    pages,
    bridge: useBridge(containerEl),
    loadAppService,
    evalScript,
    onLoaded: (callback: (page: PageInfo) => void) => {
      _onLoadedCallback = callback
    },
    onPush: (callback: (page: PageInfo) => void) => {
      _onPushCallback = callback
    },
    onBack: (callback: (delta: number) => void) => {
      _onBackCallback = callback
    },
    findPage: (pageId: number) => {
      return pages.value.find(p => p.pageId === pageId)
    },
    genPageId: () => {
      return ++pageId
    },
    push: (url: string) => {
      const page = config.value!.pages.find(p => p.path === url)
      if (page) {
        const pageInfo = getPageInfo(page)
        pages.value.push(pageInfo)
        _onPushCallback && _onPushCallback(pageInfo)
      }
    },
    back: (delta: number = 1) => {
      pages.value.pop()
      const last = pages.value[pages.value.length - 1]
      if (last) {
        last
      }
      _onBackCallback && _onBackCallback(delta)
    }
  }

  const onLoad = (page: PageInfo) => {
    appService.bridge.subscribeHandler('APP_ON_LAUNCH', { path: page.path, referrerInfo: {} })
    _onLoadedCallback && _onLoadedCallback(page)
  }

  const onShow = (page: PageInfo) => {
    appService.bridge.subscribeHandler('APP_ON_SHOW', { path: page.path, referrerInfo: {} })
  }

  globalAppService = appService

  return appService
}
