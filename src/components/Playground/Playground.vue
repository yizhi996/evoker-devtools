<template>
  <div class="w-full h-full">
    <ToolsBar class="h-10"></ToolsBar>
    <div class="inline-flex w-full" style="height: calc(100% - 40px)">
      <Simulator class="w-1/3 h-full" style="min-width: 400px"></Simulator>
      <Devtools class="w-2/3 h-full" @ready="onDevtoolsReady"></Devtools>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import Simulator from '../Simulator/Simulator.vue'
import ToolsBar from './ToolsBar.vue'
import Devtools from './Devtools.vue'
import { useEvents } from '../../composables/useEvents'
import { createAppService } from '../../composables/service'

const service = createAppService()

const onDevtoolsReady = () => {}
</script>
