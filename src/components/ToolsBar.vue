<template>
  <div class="bg-white w-full flex items-center border-b px-3 h-10">
    <el-button text @click="showDeviceMenu"
      >{{ deviceInfo.device.name }} {{ deviceInfo.scale }}%<el-icon class="el-icon--right"
        ><i-ep-caret-bottom /></el-icon
    ></el-button>
  </div>
</template>

<script setup lang="ts">
import { ipcRenderer } from 'electron'
import { useDevice } from '../composables/useDevice'

const { deviceInfo } = useDevice()

const showDeviceMenu = () => {
  ipcRenderer.send('show-device-menu')
}
</script>
