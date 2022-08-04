<template>
  <webview
    ref="webviewEl"
    class="w-full h-full bg-white"
    :src="src"
    :style="{
      width: page.width + 'px',
      height: page.height + 'px',
      top: page.top + 'px'
    }"
  ></webview>
</template>

<script setup lang="ts">
import { onMounted, ref, watch, nextTick } from 'vue'
import { emittedOnce, getUserDataPath } from '../../utils'
import path from 'path'
import { usePage, PageInfo } from '../../composables/usePage'

const emit = defineEmits(['ready'])

const props = defineProps<{ page: PageInfo }>()

const src = 'file://' + path.join(getUserDataPath(), 'SDK/index.html')

const webviewEl = ref<Electron.WebviewTag>()

const { loadSDK, loadApp, mount } = usePage(props.page, webviewEl)

onMounted(async () => {
  await nextTick()

  await emittedOnce(webviewEl.value!, 'dom-ready')

  await loadSDK()
  await loadApp()

  mount(props.page.path)

  emit('ready', webviewEl.value!.getWebContentsId())
})
</script>
