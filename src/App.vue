<template>
  <div class="w-screen h-screen overflow-hidden">
    <ToolsBar></ToolsBar>
    <SplitView>
      <Simulator app-id="com.evokerdev.example"></Simulator>
    </SplitView>
  </div>
</template>

<script setup lang="ts">
import Simulator from './components/Simulator/Simulator.vue'
import SplitView from './components/SplitView.vue'
import ToolsBar from './components/ToolsBar.vue'
</script>

<style>
#app {
  font-family: -apple-system, Helvetica, Arial, sans-serif;
}
</style>
