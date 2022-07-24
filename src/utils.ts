import { ipcRenderer } from 'electron'

const appPath = new Map<string, string>()

export async function loadAppPath() {
  const result: Record<string, string> = await ipcRenderer.invoke('get-app-path')
  for (const [k, v] of Object.entries(result)) {
    appPath.set(k, v)
  }
}

export const getAppPath = (name: string) => appPath.get(name)!

export function webviewLoadScript(webview: Electron.WebviewTag, filePath: string) {
  const script = `(function() {
    const head = document.head || document.getElementsByTagName("head")
    const script = document.createElement("script")
    script.type = "text/javascript"
    script.src = "${filePath}"
    head.appendChild(script)
  })()`
  return webview.executeJavaScript(script)
}

export function webviewLoadStyle(webview: Electron.WebviewTag, filePath: string) {
  const script = `(function() {
    const head = document.head || document.getElementsByTagName("head")
    const link = document.createElement("link")
    link.rel = "stylesheet"
    link.type = "text/css"
    link.href = "${filePath}"
    head.appendChild(link)
  })()`
  return webview.executeJavaScript(script)
}

export function emittedOnce(element: HTMLElement, eventName: string) {
  return new Promise<Event>(resolve => {
    element.addEventListener(eventName, event => resolve(event), { once: true })
  })
}
