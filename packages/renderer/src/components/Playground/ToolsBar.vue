<template>
  <div class="w-full flex items-center border-b px-3">
    <el-menu
      class="w-full h-10"
      mode="horizontal"
      active-text-color="transparency"
      @select="handleSelect"
    >
      <el-sub-menu index="1">
        <template #title>{{ deviceInfo.device.name }} {{ deviceInfo.scale }}%</template>
        <el-sub-menu index="1-1"
          ><template #title>Device</template>
          <el-menu-item
            v-for="device of Object.keys(DEVICES)"
            :key="device"
            :index="`DEVICE-${device}`"
            :disabled="device === deviceInfo.device.name"
            ><span class="flex items-center justify-between w-full">
              {{ device }}
              <el-icon class="el-icon--right">
                <Check v-if="device === deviceInfo.device.name"
              /></el-icon> </span
          ></el-menu-item>
        </el-sub-menu>
        <el-sub-menu index="1-2"
          ><template #title>Scale</template>
          <el-menu-item
            v-for="scale of SCALES"
            :key="scale"
            :index="`SCALE-${scale}`"
            :disabled="scale === deviceInfo.scale"
            ><span class="flex items-center justify-between w-full">
              {{ scale }}%
              <el-icon class="el-icon--right">
                <Check v-if="scale === deviceInfo.scale"
              /></el-icon> </span
          ></el-menu-item>
        </el-sub-menu>
      </el-sub-menu>
    </el-menu>

    <el-button
      class="ml-5"
      @click="openDevtools"
      >Current-Page-Devtools</el-button
    >
  </div>
</template>

<script setup lang="ts">
import { DEVICES, SCALES, deviceInfo, setCurrentDevice, setCurrentDeviceSacle } from '../../device'
import { globalAppService } from '../../playground/service'

const openDevtools = () => {
  const pages = globalAppService.pages.value
  const lastPage = pages[pages.length - 1]
  lastPage?.instance?.webView?.openDevTools()
}

const handleSelect = (selected: string) => {
  const [type, item] = selected.split('-')
  if (type === 'DEVICE') {
    setCurrentDevice(item)
  } else if (type === 'SCALE') {
    setCurrentDeviceSacle(parseInt(item))
  }
}
</script>
