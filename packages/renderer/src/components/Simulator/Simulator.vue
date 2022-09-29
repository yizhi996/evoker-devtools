<template>
  <div class="select-none overflow-y-auto flex items-center justify-center bg-gray-300">
    <div
      class="relative bg-white overflow-hidden"
      :style="simulatorStyles"
    >
      <Service
        class="absolute top-0 left-0 w-full h-full"
        @ready="onServiceReady"
      ></Service>
      <template v-if="globalAppService.pages.value.length">
        <StatusBar
          :safe-area-inset="deviceInfo.device.safeAreaInsets.top"
          :have-notch="deviceInfo.iphonex"
          :style="{
            'background-color': lastPage.style.navigationBarBackgroundColor,
          }"
        ></StatusBar>
        <NavigationBar
          v-for="(page, i) of globalAppService.pages.value"
          class="absolute"
          :key="i"
          :page="page"
          :config="globalAppService.config"
          :show-back="globalAppService.pages.value.length > 1"
          @back="globalAppService.back()"
        ></NavigationBar>
        <TransitionGroup name="push">
          <WebView
            class="absolute"
            v-for="page of globalAppService.pages.value"
            :key="page.pageId"
            :page="page"
            @ready="onWebViewReady"
          ></WebView>
        </TransitionGroup>

        <TabBar
          class="absolute left-0 bottom-0"
          v-show="globalAppService.config.tabBar && lastPage.isTabBar"
          :config="globalAppService.config"
          :current="0"
          :safe-area-inset="deviceInfo.device.safeAreaInsets.bottom"
        ></TabBar>

        <HomeIndicator v-if="deviceInfo.iphonex"></HomeIndicator>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { globalAppService } from '../../playground/service'
import NavigationBar from './NavigationBar.vue'
import StatusBar from './StatusBar.vue'
import TabBar from './TabBar.vue'
import WebView from './WebView.vue'
import HomeIndicator from './HomeIndicator.vue'
import Service from './Service.vue'
import { deviceInfo } from '../../composables/useDevice'
import { useEvents } from '../../composables/useEvents'
import { webContentsId } from '../../playground'
import { Events } from '#shared'

const { on } = useEvents()

on(Events.RELOAD, () => {})

const simulatorStyles = computed(() => {
  return {
    width: `${deviceInfo.device.width}px`,
    height: `${deviceInfo.device.height}px`,
    'border-radius': `${deviceInfo.iphonex ? 30 : 0}px`,
    transform: `scale(${deviceInfo.scale / 100})`,
    'transform-origin': '50% 0',
    'margin-bottom': `${window.innerHeight - 40 - deviceInfo.device.height - 44}px`,
  }
})

const onServiceReady = (id: number) => {
  webContentsId.service = id
}

const onWebViewReady = (id: number) => {
  webContentsId.webviews.push(id)
}

const lastPage = computed(() => {
  const pages = globalAppService.pages.value
  const last = pages[pages.length - 1]
  return last
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
