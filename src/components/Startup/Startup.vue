<template>
  <div class="p-20 flex w-full h-full bg-slate-600 flex-col">
    <div>
      <el-button class="mr-10" type="primary" size="large">
        <el-icon class="el-icon--left"><i-ep-plus /></el-icon>
        Create
      </el-button>
      <el-button type="primary" size="large" @click="openDirectory">
        <el-icon class="el-icon--left"><i-ep-folder-opened /></el-icon>
        Import
      </el-button>
    </div>
    <div class="mt-10 text-white text-lg">Projects:</div>
    <el-scrollbar class="mt-5" max-height="400px">
      <div class="flex flex-wrap text-black">
        <div
          class="flex flex-col items-center justify-center w-40 h-40 bg-white rounded-md mr-3 mb-3 overflow-hidden cursor-pointer"
          v-for="(project, path) of projects"
          :key="path"
          @click="openProject(path)"
        >
          <el-icon color="black" size="100px"><i-ep-box /></el-icon>
          <span class="text-base mt-2">{{ project.name }}</span>
        </div>
      </div>
    </el-scrollbar>
  </div>
</template>

<script setup lang="ts">
import { ipcRenderer } from 'electron'
import { onMounted, ref } from 'vue'

interface Project {
  name: string
}

const projects = ref<Record<string, Project>>({})

onMounted(() => {
  loadProjects()
})

const loadProjects = async () => {
  const res = await ipcRenderer.invoke('getStoreValue', 'projects')
  projects.value = res
}

const createProject = ()=> {

}

const openDirectory = async () => {
  await ipcRenderer.invoke('openDirectory')
  loadProjects()
}

const openProject = (path: string) => {
  ipcRenderer.send('openProject', path)
}
</script>
