<template>
  <webview ref="devtoolsEl" class="select-none" src="about:blank"></webview>
</template>

<script setup lang="ts">
import { emittedOnce } from '../../utils'
import { onMounted, ref, nextTick } from 'vue'
import { webContentsId } from '../../playground'

const emit = defineEmits(['ready'])

const devtoolsEl = ref<Electron.WebviewTag>()

onMounted(async () => {
  await nextTick()

  await emittedOnce(devtoolsEl.value!, 'dom-ready')

  const id = devtoolsEl.value!.getWebContentsId()

  webContentsId.devtools = id

  emit('ready', id)
})
</script>
