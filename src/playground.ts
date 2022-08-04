import { ipcRenderer } from 'electron'
import { ref, reactive, watch } from 'vue'

const webContentsId = reactive({ service: 0, devtools: 0, webviews: [] as number[] })

let devtoolsLoaded = false

watch(
  () => webContentsId,
  newValue => {
    if (!devtoolsLoaded && newValue.service && newValue.devtools && newValue.webviews.length) {
      devtoolsLoaded = true
      ipcRenderer.send(
        'open-devtools',
        window.project.appId,
        newValue.service,
        newValue.devtools,
        newValue.webviews[0]
      )
    }
  },
  { deep: true }
)

export { webContentsId }
