<template>
  <div class="bg-white w-full h-full">
    <div v-if="service.config" class="inline-flex w-full" style="height: calc(100% - 40px)">
      <div
        class="w-1/3 overflow-y-auto flex items-center justify-center bg-gray-300"
        style="min-width: 400px"
      >
        <div class="relative bg-white overflow-hidden" :style="simulatorStyles">
          <webview
            ref="serviceEl"
            class="absolute top-0 left-0"
            :style="{
              width: deviceInfo.width + 'px',
              height: deviceInfo.height + 'px'
            }"
            src="about:blank"
          ></webview>

          <StatusBar
            :safe-area-inset="safeAreaInsets.top"
            :have-notch="deviceInfo.iphonex"
          ></StatusBar>

          <NavigationBar
            v-for="(page, i) of pages"
            :key="i"
            :page="page"
            :config="service.config"
            :show-back="pages.length > 1"
            @back="onBack"
          ></NavigationBar>

          <TransitionGroup name="push">
            <WebView
              class="absolute"
              v-for="(page, i) of pages"
              :key="i"
              :style="{
                width: deviceInfo.width + 'px',
                height: sizeInfo.webViewHeight + 'px',
                top: sizeInfo.navigationBarHeight + 'px'
              }"
              :service="service"
              :path="page.path"
            ></WebView>
          </TransitionGroup>

          <TabBar
            class="absolute left-0 bottom-0"
            v-show="service.config.tabBar"
            :config="service.config"
            :current="0"
            :safe-area-inset="safeAreaInsets.bottom"
          ></TabBar>

          <HomeIndicator v-if="deviceInfo.iphonex"></HomeIndicator>
        </div>
      </div>
      <webview ref="debuggerEl" class="w-2/3 h-full" src="about:blank"></webview>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ipcRenderer } from 'electron'
import { computed, nextTick, onMounted, reactive, ref } from 'vue'
import { useService, PageInfo } from '../../composables/useService'
import NavigationBar from './NavigationBar.vue'
import StatusBar from './StatusBar.vue'
import TabBar from './TabBar.vue'
import WebView from './WebView.vue'
import HomeIndicator from './HomeIndicator.vue'
import { emittedOnce } from '../../utils'
import { deviceInfo } from '../../composables/useDevice'

const props = defineProps<{ appId: string }>()

const serviceEl = ref<Electron.WebviewTag>()

const debuggerEl = ref<Electron.WebviewTag>()

const service = useService(props.appId, serviceEl)

const simulatorStyles = computed(() => {
  return `width: ${deviceInfo.width}px; height: ${deviceInfo.height}px; border-radius: ${
    deviceInfo.iphonex ? 30 : 0
  }; transform: scale(${deviceInfo.scale / 100});transform-origin: 50% 0;margin-bottom: ${
    window.innerHeight - 40 - deviceInfo.height - 44
  }px;`
})

const safeAreaInsets = computed(() => {
  return deviceInfo.iphonex
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

const sizeInfo = computed(() => {
  const config = service.config
  const navigationBarHeight = safeAreaInsets.value.top + 44
  const tabBarHeight =
    config?.tabBar && config.tabBar.list.length ? 44 + safeAreaInsets.value.bottom : 0

  const webViewHeight = deviceInfo.height - navigationBarHeight - tabBarHeight
  return {
    navigationBarHeight,
    webViewHeight
  }
})

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

// onChange((size, scale, iphonex) => {
//   isIPhoneX.value = iphonex
//   sizeInfo.width = size.width
//   sizeInfo.height = size.height

//   const config = service.config
//   sizeInfo.navigationBarHeight = safeAreaInsets.value.top + 44
//   const tabBarHeight =
//     config?.tabBar && config.tabBar.list.length ? 44 + safeAreaInsets.value.bottom : 0

//   sizeInfo.webViewHeight = size.height - sizeInfo.navigationBarHeight - tabBarHeight
//   simulatorStyles.value = `width: ${size.width}px; height: ${size.height}px; border-radius: ${
//     iphonex ? 30 : 0
//   }px; transform: scale(${scale / 100});transform-origin: 50% 0;margin-bottom: ${
//     window.innerHeight - 40 - size.height - 44
//   }px;`
// })

const pages = ref<PageInfo[]>([])

service.onLoaded(page => {
  pages.value.push(page)
})

service.onPush(page => {
  pages.value.push(page)
})

service.onBack(delta => {
  pages.value.pop()
})

const onBack = () => {
  pages.value.pop()
}
</script>

<style scpoed>
.push-enter-active {
  transition: transform 0.5s cubic-bezier(0.2, 0.9, 0.42, 1);
}

.push-leave-active {
  transition: transform 0.25s ease;
}

.push-enter-from,
.push-leave-to {
  transform: translateX(100%);
}
</style>
