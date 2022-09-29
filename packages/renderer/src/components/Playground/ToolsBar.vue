<template>
  <div class="w-full flex items-center border-b px-3">
    <el-button
      text
      @click="showDeviceMenu"
      >{{ deviceInfo.device.name }} {{ deviceInfo.scale }}%<el-icon class="el-icon--right"
        ><CaretBottom /></el-icon
    ></el-button>
    <el-button @click="openDevtools">Devtools</el-button>
  </div>
</template>

<script setup lang="ts">
import { useDevice } from '../../composables/useDevice'
import { globalAppService } from '../../playground/service'

const { deviceInfo } = useDevice()

const showDeviceMenu = () => {
  window.electronAPI.showDeviceMenu()
}

const openDevtools = () => {
  const pages = globalAppService.pages.value
  const lastPage = pages[pages.length - 1]
  lastPage?.instance?.webView?.openDevTools()
}
</script>
