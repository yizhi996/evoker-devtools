<template>
  <webview ref="webviewEl" class="w-full h-full" :src="src"></webview>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { getAppPath } from '../../utils'
import path from 'path'
import { usePage } from '../../composables/usePage'
import { AppService } from '../../composables/useService'

const props = defineProps<{ service: AppService; path: string }>()

const src = 'file://' + path.join(getAppPath('userData'), 'SDK/index.html')

const webviewEl = ref<Electron.WebviewTag>()

const { mount } = usePage(props.service, webviewEl)

watch(
  () => props.path,
  (newValue, oldValue) => {
    console.log(newValue, oldValue)
    if (oldValue === 'preload') {
      mount(newValue)
    }
  }
)
</script>
