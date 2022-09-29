<template>
  <div class="p-20 flex w-full h-full flex-col select-none">
    <template v-if="!showCreator">
      <div class="space-x-10">
        <el-button
          type="primary"
          size="large"
          icon="plus"
          @click="createProject"
          >创建</el-button
        >
        <el-button
          type="primary"
          size="large"
          icon="folderOpened"
          @click="openDirectory"
        >
          导入
        </el-button>
      </div>
      <div class="mt-10 text-white text-lg">项目：</div>
      <el-scrollbar
        class="mt-5"
        max-height="300px"
      >
        <el-empty
          v-if="Object.keys(projects).length === 0"
          description="No Project"
        />
        <div
          v-else
          class="flex flex-wrap text-black"
        >
          <div
            class="flex flex-col items-center justify-center w-40 h-40 bg-gray-100 rounded-md mr-3 mb-3 overflow-hidden cursor-pointer"
            v-for="project of projects"
            :key="project.path"
            @click="openProject(project.path)"
            @click.right="showProjectMenu(project)"
          >
            <el-icon
              color="black"
              size="100px"
              ><Box
            /></el-icon>
            <span class="text-base mt-2">{{ project.name }}</span>
          </div>
        </div>
      </el-scrollbar>
    </template>
    <Creator
      v-else
      @back="showCreator = false"
    ></Creator>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import Creator from './Creator.vue'

interface Project {
  name: string
  path: string
}

const projects = ref<Project[]>([])

const showCreator = ref(false)

onMounted(() => {
  loadProjects()
})

const loadProjects = async () => {
  const res = (await window.electronAPI.getStorageValue('k_projects')) || []
  projects.value = res
}

const createProject = () => {
  showCreator.value = true
}

const showProjectMenu = (project: Project) => {
  window.electronAPI.showProjectMenu(project)
}

const openDirectory = async () => {
  await window.electronAPI.openDirProject()
  loadProjects()
}

const openProject = (path: string) => {
  window.electronAPI.openProject(path)
}
</script>
