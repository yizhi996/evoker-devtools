import { Ref, ref } from 'vue'
import { getUserDataPath, webviewLoadScript } from '../utils'
import { Bridge } from './bridge'
import { extend } from '@vue/shared'
import { deviceInfo } from './useDevice'
import { PageInfo } from './usePage'
import { AppConfig, AppPageInfo, loadAppConfig } from '../config'

let globalAppService: AppService

export { globalAppService }

export function createAppService() {
  const service = new AppService()
  globalAppService = service
  return service
}

type PageInfoCallback = (page: PageInfo) => void

type PageInfoOnBackCallback = (delta: number) => void

export class AppService {
  el?: Electron.WebviewTag

  config?: AppConfig

  bridge?: Bridge

  pages: Ref<PageInfo[]> = ref([])

  private pageId = 0

  onLoaded: PageInfoCallback | undefined

  onPush: PageInfoCallback | undefined

  onBack: PageInfoOnBackCallback | undefined

  constructor() {
    this.config = loadAppConfig()
  }

  setEl(newValue: Electron.WebviewTag) {
    this.el = newValue
    this.bridge = new Bridge(newValue)
  }

  async loadSDK() {
    const el = this.el
    if (!el) {
      return
    }
    const root = getUserDataPath()

    el.loadURL('file://' + root + '/SDK/appService.html')

    el.executeJavaScript(
      `globalThis.__Config = { appName: '', appIcon: '', platform: 'devtools', env: 'service' }`
    )

    await webviewLoadScript(el, './devtools.global.js')
    await webviewLoadScript(el, './vue.runtime.global.js')
    await webviewLoadScript(el, './evoker.global.js')
  }

  async loadApp() {
    const el = this.el
    if (!el) {
      return
    }
    await webviewLoadScript(el, `../App/${window.project.appId}/dist/app-service.js`)

    setTimeout(() => {
      const pageInfo = this.getEntryPage()!
      this.pages.value = [pageInfo]
      this.publishOnLaunch(pageInfo)
      this.publishOnShow(pageInfo)
    }, 200)
  }

  private getEntryPage() {
    const { pages, tabBar } = this.config!

    if (tabBar && tabBar.list && tabBar.list.length) {
      const first = tabBar.list[0]
      const page = pages.find(p => p.path === first.path)
      if (page) {
        return this.generatePage(page)
      }
    }

    if (pages.length) {
      return this.generatePage(pages[0])
    } else {
      console.error('app.json pages cannot be empty')
    }
  }

  private generatePage(page: AppPageInfo) {
    const { tabBar } = this.config!
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

    const style = this.getWindowInfo()
    if (page.style) {
      extend(style, page.style)
    }

    const instance: PageInfo = {
      pageId: ++this.pageId,
      path: page.path,
      style,
      isTabBar,
      top: navigationBarHeight,
      width: deviceInfo.device.width,
      height: deviceInfo.device.height - navigationBarHeight - tabBarHeight
    }
    return instance
  }

  private getWindowInfo() {
    const { window } = this.config!
    return {
      backgroundColor: window?.backgroundColor || '#ffffff',
      navigationBarBackgroundColor: window?.navigationBarBackgroundColor || '#ffffff',
      navigationBarTextStyle: window?.navigationBarTextStyle || 'black',
      navigationBarTitleText: window?.navigationBarTitleText || '',
      navigationStyle: window?.navigationStyle || 'default'
    }
  }

  push(url: string) {
    const page = this.config!.pages.find(p => p.path === url)
    if (page) {
      const pageInfo = this.generatePage(page)
      this.pages.value.push(pageInfo)
      this.onPush?.(pageInfo)
    }
  }

  back(delta: number = 1) {
    const pop = this.pages.value.pop()
    pop?.instance?.publishOnUnload()

    const last = this.pages.value[this.pages.value.length - 1]
    last?.instance?.publishOnShow()
    this.onBack?.(delta)
  }

  publishOnLaunch(page: PageInfo) {
    this.bridge?.subscribeHandler('APP_ON_LAUNCH', { path: page.path, referrerInfo: {} })
    this.onLoaded?.(page)
  }

  publishOnShow(page: PageInfo) {
    this.bridge?.subscribeHandler('APP_ON_SHOW', { path: page.path, referrerInfo: {} })
  }
}
