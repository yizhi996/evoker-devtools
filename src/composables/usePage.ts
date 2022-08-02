import { Ref, watch, ref } from 'vue'
import { Bridge, useBridge } from './useBridge'
import { globalAppService, AppStyle } from './useService'
import { emittedOnce, webviewLoadScript, webviewLoadStyle } from '../utils'
import { ipcRenderer } from 'electron'

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
  webView: Ref<WebView | undefined>
  bridge: Bridge
  mount: (path: string) => void
  publishOnShow: () => void
  publishOnHide: () => void
  publishOnUnload: () => void
  onSetup: (callback: PageOnSetupCallback) => void
}

export interface WebView extends Electron.WebviewTag {}

export function usePage(pageInfo: PageInfo, webviewEl: Ref<WebView | undefined>): Page {
  const service = globalAppService!

  const ready = ref(false)

  const mounted = ref(false)

  watch(
    () => [ready.value, mounted.value],
    newValue => {
      if (newValue.filter(Boolean).length === 2) {
        ipcRenderer.send(
          'set-webview-contents-id',
          window.env.APP_ID,
          webviewEl.value?.getWebContentsId()
        )
      }
    }
  )

  let setupCallback: PageOnSetupCallback | null

  const page: Page = {
    ...pageInfo,
    webView: webviewEl,
    bridge: useBridge(webviewEl),
    mount: (path: string) => {
      mounted.value = true

      page.path = path
      service.bridge.subscribeHandler('PAGE_BEGIN_MOUNT', {
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
        window.env.APP_ID,
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
    onSetup: (callback: PageOnSetupCallback) => {
      setupCallback = callback
    }
  }

  pageInfo.instance = page

  const stop = watch(
    () => webviewEl.value,
    async webview => {
      if (webview) {
        await emittedOnce(webview, 'dom-ready')

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
        await webviewLoadStyle(webview, `../App/${service.config.appId}/dist/style.css`)

        setupCallback && setupCallback(webview.getWebContentsId())
        ready.value = true
        stop()
      }
    }
  )

  return page
}
