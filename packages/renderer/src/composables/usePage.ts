import { Ref, watch, ref } from 'vue'
import { Bridge } from '../playground/bridge'
import { globalAppService } from '../playground/service'
import { webviewLoadScript, webviewLoadStyle } from '../utils'
import { useEvents } from './useEvents'
import { AppStyle } from '../config'
import { useDevJSSDK } from '../env'

export interface PageInfo {
  pageId: number
  path: string
  style: Required<AppStyle>
  isTabBar: boolean
  top: number
  width: number
  height: number
  instance?: Page
  css?: string
}

export interface Page extends PageInfo {
  webView: Ref<Electron.WebviewTag | undefined>
  bridge?: Bridge
  mount: (path: string) => void
  publishOnShow: () => void
  publishOnHide: () => void
  publishOnUnload: () => void
  loadSDK: () => void
  loadApp: () => void
}

export function usePage(pageInfo: PageInfo, webviewEl: Ref<Electron.WebviewTag | undefined>): Page {
  const ready = ref(false)

  const mounted = ref(false)

  watch(
    () => [ready.value, mounted.value],
    newValue => {
      if (newValue.filter(Boolean).length === 2) {
        window.electronAPI.setWebViewContentsId(
          window.project.appId,
          webviewEl.value!.getWebContentsId(),
        )
      }
    },
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
        path,
      })
    },
    publishOnShow: () => {
      window.electronAPI.setWebViewContentsId(
        window.project.appId,
        webviewEl.value!.getWebContentsId(),
      )
      page.bridge?.subscribeHandler('PAGE_ON_SHOW', { pageId: page.pageId })
    },
    publishOnHide: () => {
      page.bridge?.subscribeHandler('PAGE_ON_HIDE', { pageId: page.pageId })
    },
    publishOnUnload: () => {
      page.bridge?.subscribeHandler('PAGE_ON_UNLOAD', { pageId: page.pageId })
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
          webViewId: ${page.pageId} }`,
      )
      await webviewLoadScript(webview, './devtools.global.js')

      const ext = useDevJSSDK ? 'js' : 'prod.js'
      await webviewLoadScript(webview, `./webview.global.${ext}`)

      ready.value = true
    },
    loadApp: async () => {
      const webview = webviewEl.value
      if (!webview) {
        return
      }
      for (const css of globalAppService.config!.chunkCSS) {
        await webviewLoadStyle(webview, `../App/${window.project.appId}/dist/${css}`)
      }
      if (pageInfo.css) {
        await webviewLoadStyle(webview, `../App/${window.project.appId}/dist/${pageInfo.css}`)
      }
    },
  }

  pageInfo.instance = page

  const { on } = useEvents()

  return page
}
