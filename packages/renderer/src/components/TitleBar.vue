<template>
  <div
    class="title w-screen h-7 text-white text-center text-xs"
    @dblclick="maximize"
  >
    <slot></slot>
  </div>
</template>

<script setup lang="ts">
const maximize = () => {
  window.electronAPI.maximizeWindow()
}
</script>

<style scoped>
.title {
  -webkit-app-region: drag;
  -webkit-user-select: none;
  line-height: 28px;
  background-color: var(--el-bg-color-overlay);
}
</style>
