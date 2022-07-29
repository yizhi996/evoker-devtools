import { Ref, watch } from 'vue'
import { Bridge, useBridge } from './useBridge'
import { AppService } from './useService'
import { emittedOnce, webviewLoadScript, webviewLoadStyle } from '../utils'
import { ipcRenderer } from 'electron'

export interface Page {
  pageId: number
  path: string
  webView: Ref<WebView | undefined>
  bridge: Bridge
  mount: (path: string) => void
}

export interface WebView extends Electron.WebviewTag {}

export function usePage(service: AppService, webviewEl: Ref<WebView | undefined>): Page {
  const bridge = useBridge(service, webviewEl)

  const page: Page = {
    pageId: service.genPageId(),
    path: '',
    webView: webviewEl,
    bridge,
    mount: (path: string) => {
      page.path = path
      service.bridge.subscribeHandler('PAGE_BEGIN_MOUNT', {
        pageId: page.pageId,
        tabIndex: 0,
        fromTabItemTap: false,
        tabText: '',
        path
      })

      setTimeout(() => {
        ipcRenderer.invoke('Chrome-DevTools-Protocol', {
          debuggerId: webviewEl.value!.getWebContentsId(),
          method: 'DOM.getDocument',
          commandParams: {}
        })
      }, 2000)
    }
  }

  const stop = watch(
    () => webviewEl.value,
    async () => {
      const webview = webviewEl.value
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
        stop()
      }
    }
  )

  return page
}
