<template>
  <div
    class="w-full h-11 flex items-center justify-center"
    :style="{ 'background-color': page.style.navigationBarBackgroundColor }"
  >
    <div v-if="showBack" class="absolute left-5" @click="onBack">
      <el-icon :size="20" :color="page.style.navigationBarTextStyle"><ArrowLeftBold /></el-icon>
    </div>
    <span class="text-lg" :style="{ color: page.style.navigationBarTextStyle }">{{
      page.style.navigationBarTitleText
    }}</span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { AppConfig } from '../../config'
import { PageInfo } from '../../composables/usePage'

const emit = defineEmits(['back'])

const props = withDefaults(
  defineProps<{
    config: AppConfig
    page: PageInfo
    showBack: boolean
  }>(),
  { showBack: false }
)

const windowStyle = computed(() => {
  return {}
})

const onBack = () => {
  emit('back')
}
</script>
