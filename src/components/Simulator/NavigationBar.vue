<template>
  <div class="w-full h-11 bg-white flex items-center justify-center">
    <span>{{ title }}</span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { AppConfig } from '../../composables/useService'

const props = withDefaults(
  defineProps<{
    title: string
    config: AppConfig
  }>(),
  {}
)

const windowStyle = computed(() => {
  return {

  }
})
</script>
