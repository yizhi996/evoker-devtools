<template>
  <div class="bg-white w-full h-full">
    <div v-if="config" class="inline-flex w-full" style="height: calc(100% - 40px)">
      <div
        class="w-1/3 overflow-y-auto flex items-center justify-center bg-gray-300"
        style="min-width: 400px"
      >
        <div class="relative bg-white overflow-hidden" :style="simulatorStyles">
          <webview
            ref="serviceEl"
            class="absolute top-0 left-0 w-full h-full"
            src="about:blank"
          ></webview>
          <template v-if="pages.length">
            <StatusBar
              :safe-area-inset="deviceInfo.device.safeAreaInsets.top"
              :have-notch="deviceInfo.iphonex"
              :style="{
                'background-color': lastPage.style.navigationBarBackgroundColor
              }"
            ></StatusBar>

            <NavigationBar
              v-for="(page, i) of pages"
              class="absolute"
              :key="i"
              :page="page"
              :config="config"
              :show-back="pages.length > 1"
              @back="back"
            ></NavigationBar>

            <TransitionGroup name="push">
              <WebView
                class="absolute"
                v-for="page of pages"
                :key="page.pageId"
                ref="pageRefs"
                :page="page"
              ></WebView>
            </TransitionGroup>

            <TabBar
              class="absolute left-0 bottom-0"
              v-show="config.tabBar && lastPage.isTabBar"
              :config="config"
              :current="0"
              :safe-area-inset="deviceInfo.device.safeAreaInsets.bottom"
            ></TabBar>

            <HomeIndicator v-if="deviceInfo.iphonex"></HomeIndicator>
          </template>
        </div>
      </div>
      <webview
        ref="debuggerEl"
        class="w-2/3 h-full"
        src="file:///Users/dskcpp/Downloads/frontend/devtools-frontend/out/Default/gen/front_end/devtools_app.html?ws=localhost:33233"
      ></webview>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ipcRenderer } from 'electron'
import { computed, nextTick, onMounted, ref } from 'vue'
import { useService } from '../../composables/useService'
import NavigationBar from './NavigationBar.vue'
import StatusBar from './StatusBar.vue'
import TabBar from './TabBar.vue'
import WebView from './WebView.vue'
import HomeIndicator from './HomeIndicator.vue'
import { emittedOnce } from '../../utils'
import { deviceInfo } from '../../composables/useDevice'

const serviceEl = ref<Electron.WebviewTag>()

const debuggerEl = ref<Electron.WebviewTag>()

const pageRefs = ref([])

const { config, pages, loadAppService, back } = useService(serviceEl)

const simulatorStyles = computed(() => {
  return {
    width: `${deviceInfo.device.width}px`,
    height: `${deviceInfo.device.height}px`,
    'border-radius': `${deviceInfo.iphonex ? 30 : 0}px`,
    transform: `scale(${deviceInfo.scale / 100})`,
    'transform-origin': '50% 0',
    'margin-bottom': `${window.innerHeight - 40 - deviceInfo.device.height - 44}px`
  }
})

onMounted(async () => {
  await nextTick()

  const browserReady = emittedOnce(serviceEl.value!, 'dom-ready')
  const devtoolsReady = emittedOnce(debuggerEl.value!, 'dom-ready')

  Promise.all([browserReady, devtoolsReady]).then(() => {
    loadAppService()
    const targetId = serviceEl.value!.getWebContentsId()
    const devtoolsId = debuggerEl.value!.getWebContentsId()
    ipcRenderer.send('open-devtools', targetId, devtoolsId)
  })
})

const lastPage = computed(() => {
  return pages.value[pages.value.length - 1]
})
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
