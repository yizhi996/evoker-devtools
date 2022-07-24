<template>
  <div class="w-full" :style="{ height, 'background-color': tabBarStyle.backgroundColor }">
    <div class="w-full h-[1px]" :style="{ 'background-color': tabBarTopLineColor }"></div>
    <div
      class="flex h-full items-center justify-around"
      :style="{ 'padding-bottom': `${safeAreaInset}px` }"
    >
      <div
        v-for="(items, i) of config.tabBar!.list"
        :key="items.text"
        class="flex flex-col items-center"
        @click="onClick"
      >
        <img class="w-[25px] h-[25px]" :src="iconPath(i, items.iconPath, items.selectedIconPath)" />
        <span
          class="text-xs"
          :style="{ color: i === current ? tabBarStyle.selectedColor : tabBarStyle.color }"
          >{{ items.text }}</span
        >
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { AppConfig } from '../../composables/useService'
import { getAppPath } from '../../utils'
import path from 'path'

const props = withDefaults(
  defineProps<{
    safeAreaInset: number
    config: AppConfig
    current: number
  }>(),
  {
    current: 0
  }
)

const tabBarStyle = computed(() => {
  return {
    color: props.config.tabBar!.color || '#353535',
    selectedColor: props.config.tabBar!.selectedColor || '#1989fa',
    backgroundColor: props.config.tabBar!.backgroundColor || '#ffffff',
    borderStyle: props.config.tabBar!.borderStyle || 'black'
  }
})

const tabBarTopLineColor = computed(() => {
  return tabBarStyle.value.borderStyle === 'white' ? 'rgba(1, 1, 1, 0.3)' : 'rgba(0, 0, 0, 0.3)'
})

const height = computed(() => `${props.safeAreaInset + 48}px`)

const iconPath = (index: number, iconPath?: string, selectedIconPath?: string) => {
  if (!iconPath || !selectedIconPath) {
    return
  }
  const src = index === props.current ? selectedIconPath : iconPath
  const res = 'file://' + path.join(getAppPath('userData'), `App/${props.config.appId}/dist/${src}`)
  return res
}

const onClick = () => {}
</script>
