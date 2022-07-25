<template>
  <div class="bg-white w-full h-full">
    <div class="w-full flex items-center border-b px-3 h-10">
      <el-button text @click="showDeviceMenu"
        >{{ device }} {{ scale }}%<el-icon class="el-icon--right"><i-ep-caret-bottom /></el-icon
      ></el-button>
    </div>
    <div v-if="service.config" class="inline-flex w-full" style="height: calc(100% - 40px)">
      <div
        class="w-1/3 overflow-y-auto flex items-center justify-center bg-gray-300"
        style="min-width: 400px"
      >
        <div class="relative bg-white overflow-hidden" :style="simulatorStyles">
          <StatusBar :safe-area-inset="safeAreaInsets.top" :have-notch="isIPhoneX"></StatusBar>
          <NavigationBar title="Evoker" :config="service.config"></NavigationBar>
          <div
            :style="{
              width: sizeInfo.width + 'px',
              height: sizeInfo.webViewHeight + 'px'
            }"
          >
            <webview ref="serviceEl" class="w-full h-full" src="about:blank"></webview>
          </div>
          <template v-for="item of paths">
            <div
              class="absolute"
              :style="{
                width: sizeInfo.width + 'px',
                height: sizeInfo.webViewHeight + 'px',
                top: `${sizeInfo.navigationBarHeight}px`
              }"
            >
              <WebView :service="service" :path="item.path"></WebView>
            </div>
          </template>
          <TabBar
            v-show="service.config.tabBar"
            :config="service.config"
            :current="0"
            :safe-area-inset="safeAreaInsets.bottom"
          ></TabBar>
          <HomeIndicator></HomeIndicator>
        </div>
      </div>
      <webview ref="debuggerEl" class="w-2/3 h-full" src="about:blank"></webview>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ipcRenderer } from 'electron'
import { computed, nextTick, onMounted, reactive, ref } from 'vue'
import { useDevice } from '../../composables/useDevice'
import { useService } from '../../composables/useService'
import NavigationBar from './NavigationBar.vue'
import StatusBar from './StatusBar.vue'
import TabBar from './TabBar.vue'
import WebView from './WebView.vue'
import HomeIndicator from './HomeIndicator.vue'
import { emittedOnce } from '../../utils'

const props = defineProps<{ appId: string }>()

const { device, scale, onChange } = useDevice()

const isIPhoneX = ref(false)

const safeAreaInsets = computed(() => {
  return isIPhoneX
    ? {
        top: 44,
        bottom: 34,
        left: 0,
        right: 0
      }
    : {
        top: 0,
        bottom: 0,
        left: 0,
        right: 0
      }
})

const serviceEl = ref<Electron.WebviewTag>()

const debuggerEl = ref<Electron.WebviewTag>()

const service = useService(props.appId, serviceEl)

const simulatorStyles = ref<string>('')

const sizeInfo = reactive({ width: 0, height: 0, webViewHeight: 0, navigationBarHeight: 0 })

onMounted(async () => {
  await nextTick()

  const browserReady = emittedOnce(serviceEl.value!, 'dom-ready')
  const devtoolsReady = emittedOnce(debuggerEl.value!, 'dom-ready')

  Promise.all([browserReady, devtoolsReady]).then(() => {
    service.loadAppService()
    const targetId = serviceEl.value!.getWebContentsId()
    const devtoolsId = debuggerEl.value!.getWebContentsId()
    ipcRenderer.send('open-devtools', targetId, devtoolsId)
  })
})

onChange((size, scale, iphonex) => {
  isIPhoneX.value = iphonex
  sizeInfo.width = size.width
  sizeInfo.height = size.height

  const config = service.config
  sizeInfo.navigationBarHeight = safeAreaInsets.value.top + 44
  const tabBarHeight =
    config?.tabBar && config.tabBar.list.length ? 44 + safeAreaInsets.value.bottom : 0

  sizeInfo.webViewHeight = size.height - sizeInfo.navigationBarHeight - tabBarHeight
  simulatorStyles.value = `width: ${size.width}px; height: ${size.height}px; border-radius: ${
    iphonex ? 30 : 0
  }px; transform: scale(${scale / 100});transform-origin: 50% 0;margin-bottom: ${
    window.innerHeight - 40 - size.height - 44
  }px;`
})

const showDeviceMenu = () => {
  ipcRenderer.send('show-device-menu')
}

const paths = ref<{ path: string }[]>([{ path: 'preload' }])

service.onLoaded(page => {
  paths.value[0].path = page.path
})

service.onPush(page => {
  paths.value.push(page)
})
</script>
