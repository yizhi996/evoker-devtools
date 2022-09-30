<template>
  <el-container>
    <el-main
      class="w-screen h-screen"
      style="overflow: hidden; padding: 0"
    >
      <TitleBar>Evoker devtools</TitleBar>
      <Startup v-if="route === 'startup'"></Startup>
      <Playground v-else-if="route === 'playground'"></Playground>
    </el-main>
  </el-container>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import Startup from './components/Startup/Startup.vue'
import Playground from './components/Playground/Playground.vue'
import { useEvents } from './composables/useEvents'
import { Events } from '#shared'
import TitleBar from './components/TitleBar.vue'

const route = ref('startup')

const { on } = useEvents()

on(Events.OPEN_PROJECT, () => {
  route.value = 'playground'
})
</script>

<style>
#app {
  font-family: -apple-system, Helvetica, Arial, sans-serif;
}
</style>
