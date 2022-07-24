<template>
  <slot ref="view"></slot>
</template>

<script setup lang="ts">
import { ref } from "vue"

const view = ref<HTMLElement>()


</script>