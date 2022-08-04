<template>
  <div class="w-full flex items-center border-b px-3">
    <el-button text @click="showDeviceMenu"
      >{{ deviceInfo.device.name }} {{ deviceInfo.scale }}%<el-icon class="el-icon--right"
        ><CaretBottom /></el-icon
    ></el-button>
    <el-button @click="openDevtools">Devtools</el-button>
  </div>
</template>

<script setup lang="ts">
import { ipcRenderer } from 'electron'
import { useEvents } from '../../composables/useEvents'
import { useDevice } from '../../composables/useDevice'

const { deviceInfo } = useDevice()

const showDeviceMenu = () => {
  ipcRenderer.send('show-device-menu')
}

const openDevtools = () => {
  useEvents().dispatch('open-current-webpage-devtools')
}
</script>
