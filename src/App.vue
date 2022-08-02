<template>
  <div class="w-screen h-screen overflow-hidden">
    <Startup v-if="!isOpen"></Startup>
    <template v-else>
      <ToolsBar></ToolsBar>
      <SplitView>
        <Simulator></Simulator>
      </SplitView>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import Startup from './components/Startup/Startup.vue'
import Simulator from './components/Simulator/Simulator.vue'
import SplitView from './components/SplitView.vue'
import ToolsBar from './components/ToolsBar.vue'
import { useEvents } from './composables/useEvents'

const isOpen = ref(false)

useEvents().on('open-project', () => {
  isOpen.value = true
})
</script>

<style>
#app {
  font-family: -apple-system, Helvetica, Arial, sans-serif;
}
</style>
