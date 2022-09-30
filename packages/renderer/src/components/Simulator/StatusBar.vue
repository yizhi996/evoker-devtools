<template>
  <div
    class="w-full flex items-center"
    :style="{ height }"
  >
    <span class="text-black ml-6 text-sm cursor-default">{{ date }}</span>
    <Notch v-if="device.haveNotch"></Notch>
    <DynamicIsland v-else-if="device.haveDynamicIsland"></DynamicIsland>
  </div>
</template>

<script setup lang="ts">
import Notch from './Notch.vue'
import DynamicIsland from './DynamicIsland.vue'
import dayjs from 'dayjs'
import { onUnmounted, ref, computed } from 'vue'
import { Device } from '../../device'

const props = defineProps<{ device: Device }>()

const height = computed(() => `${props.device.safeAreaInsets.top}px`)

const now = () => dayjs(new Date()).format('HH:mm')

const date = ref(now())

const timer = setInterval(() => {
  date.value = now()
}, 1000)

onUnmounted(() => {
  clearInterval(timer)
})
</script>
