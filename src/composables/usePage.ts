import { Ref, watch, ref } from 'vue'
import { Bridge } from './bridge'
import { globalAppService } from './service'
import { webviewLoadScript, webviewLoadStyle } from '../utils'
import { ipcRenderer } from 'electron'
import { useEvents } from './useEvents'
import { AppStyle } from '../config'

export interface PageInfo {
  pageId: number
  path: string
  style: Required<AppStyle>
  isTabBar: boolean
  top: number
  width: number
  height: number
  instance?: Page
}

type PageOnSetupCallback = (webContentsId: number) => void

export interface Page extends PageInfo {
  webView: Ref<Electron.WebviewTag | undefined>
  bridge: Bridge
  mount: (path: string) => void
  publishOnShow: () => void
  publishOnHide: () => void
  publishOnUnload: () => void
  loadSDK: () => void
  loadApp: () => void
}

export function usePage(pageInfo: PageInfo, webviewEl: Ref<Electron.WebviewTag | undefined>): Page {
  const service = globalAppService!

  const ready = ref(false)

  const mounted = ref(false)

  watch(
    () => [ready.value, mounted.value],
    newValue => {
      if (newValue.filter(Boolean).length === 2) {
        ipcRenderer.send(
          'set-webview-contents-id',
          window.project.appId,
          webviewEl.value?.getWebContentsId()
        )
      }
    }
  )

  const page: Page = {
    ...pageInfo,
    webView: webviewEl,
    mount: (path: string) => {
      mounted.value = true

      page.path = path
      
      globalAppService.bridge?.subscribeHandler('PAGE_BEGIN_MOUNT', {
        pageId: page.pageId,
        tabIndex: 0,
        fromTabItemTap: false,
        tabText: '',
        path
      })
    },
    publishOnShow: () => {
      ipcRenderer.send(
        'set-webview-contents-id',
        window.project.appId,
        webviewEl.value?.getWebContentsId()
      )
      page.bridge.subscribeHandler('PAGE_ON_SHOW', { pageId: page.pageId })
    },
    publishOnHide: () => {
      page.bridge.subscribeHandler('PAGE_ON_HIDE', { pageId: page.pageId })
    },
    publishOnUnload: () => {
      page.bridge.subscribeHandler('PAGE_ON_UNLOAD', { pageId: page.pageId })
    },
    loadSDK: async () => {
      const webview = webviewEl.value
      if (!webview) {
        return
      }

      page.bridge = new Bridge(webview)

      webview.executeJavaScript(
        `window.webViewId = ${page.pageId}
        globalThis.__Config = { 
          appName: '', 
          appIcon: '',
          platform: 'devtools', 
          env: 'webview',
          webViewId: ${page.pageId} }`
      )
      await webviewLoadScript(webview, './devtools.global.js')
      await webviewLoadScript(webview, './webview.global.js')

      ready.value = true
    },
    loadApp: async () => {
      const webview = webviewEl.value
      if (!webview) {
        return
      }
      await webviewLoadStyle(webview, `../App/${window.project.appId}/dist/style.css`)
    }
  }

  pageInfo.instance = page

  const { on } = useEvents()

  return page
}
