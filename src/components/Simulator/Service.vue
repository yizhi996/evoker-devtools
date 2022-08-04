<template>
  <webview ref="serviceEl" class="select-none" src="about:blank"></webview>
</template>

<script setup lang="ts">
import { createAppService, globalAppService } from '../../composables/service.js'
import { emittedOnce } from '../../utils.js'
import { onMounted, ref, nextTick } from 'vue'

const emit = defineEmits(['ready'])

const serviceEl = ref<Electron.WebviewTag>()

onMounted(async () => {
  await nextTick()

  globalAppService.setEl(serviceEl.value!)

  await emittedOnce(serviceEl.value!, 'dom-ready')

  await globalAppService.loadSDK()
  await globalAppService.loadApp()

  emit('ready', serviceEl.value!.getWebContentsId())
})
</script>
