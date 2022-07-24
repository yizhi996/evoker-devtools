<template>
  <div class="w-full bg-white flex items-center" :style="{ height }">
    <span class="ml-6 text-sm cursor-default">{{ date }}</span>
    <Notch v-if="haveNotch"></Notch>
  </div>
</template>

<script setup lang="ts">
import Notch from './Notch.vue'
import dayjs from 'dayjs'
import { onUnmounted, ref, computed } from 'vue'

const props = withDefaults(defineProps<{ haveNotch: boolean; safeAreaInset: number }>(), {
  haveNotch: false
})

const height = computed(() => `${props.safeAreaInset}px`)

const now = () => dayjs(new Date()).format('HH:mm')

const date = ref(now())

const timer = setInterval(() => {
  date.value = now()
}, 1000)

onUnmounted(() => {
  clearInterval(timer)
})
</script>
