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
import { ref, watch } from 'vue'
import { getUserDataPath } from '../../utils'
import path from 'path'
import { usePage, PageInfo } from '../../composables/usePage'

const emit = defineEmits(['ready'])

const props = defineProps<{ page: PageInfo }>()

const src = 'file://' + path.join(getUserDataPath(), 'SDK/index.html')

const webviewEl = ref<Electron.WebviewTag>()

const { mount, onSetup } = usePage(props.page, webviewEl)

onSetup(webContentsId => {
  emit('ready', webContentsId)
})

watch(
  () => props.page.path,
  newValue => {
    if (newValue !== 'preload') {
      mount(newValue)
    }
  },
  { immediate: true }
)
</script>
