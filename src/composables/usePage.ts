import { Ref, watch } from 'vue'
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
}

export interface Page extends PageInfo {
  webView: Ref<WebView | undefined>
  bridge: Bridge
  mount: (path: string) => void
}

export interface WebView extends Electron.WebviewTag {}

export function usePage(pageInfo: PageInfo, webviewEl: Ref<WebView | undefined>): Page {
  const service = globalAppService!

  let isMounted = false

  const page: Page = {
    ...pageInfo,
    webView: webviewEl,
    bridge: useBridge(webviewEl),
    mount: (path: string) => {
      isMounted = true

      page.path = path
      service.bridge.subscribeHandler('PAGE_BEGIN_MOUNT', {
        pageId: page.pageId,
        tabIndex: 0,
        fromTabItemTap: false,
        tabText: '',
        path
      })
    }
  }

  const stop = watch(
    () => webviewEl.value,
    async () => {
      const webview = webviewEl.value
      if (webview) {
        await emittedOnce(webview, 'dom-ready')

        ipcRenderer.send('set-webview-contents-id', webview.getWebContentsId())

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

        stop()
      }
    }
  )

  return page
}
