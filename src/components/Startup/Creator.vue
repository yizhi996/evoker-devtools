<template>
  <div class="flex flex-col">
    <div>
      <el-button icon="arrowLeftBold" circle @click="onBack"></el-button>
    </div>
    <span class="mt-10 text-white text-lg">选择模板：</span>
    <div class="flex flex-warp mt-3">
      <div
        v-for="template of templates"
        :key="template"
        class="w-20 h-20 bg-gray-100 text-black mb-3 mr-3 rounded-md flex items-center justify-center cursor-pointer"
        :class="{ 'border-4 border-blue-500': template === createInfo.template }"
        @click="createInfo.template = template"
      >
        {{ template }}
      </div>
    </div>
    <el-form class="max-w-[500px]" :model="createInfo" label-position="top">
      <el-form-item label="项目名称">
        <el-input v-model="createInfo.projectName" />
      </el-form-item>
      <el-form-item label="项目路径">
        <el-input v-model="createInfo.projectPath" />
      </el-form-item>
      <el-form-item label="是否导入 iOS 原生启动器">
        <el-switch v-model="createInfo.platform" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="onSubmit">创建</el-button>
        <el-button @click="onBack">取消</el-button>
      </el-form-item>
    </el-form>
  </div>
  <div></div>
</template>

<script setup lang="ts">
import { reactive } from 'vue'
import path from 'path'

const emit = defineEmits(['back'])

const templates = ['blank', 'example']

const createInfo = reactive({
  template: '',
  projectName: 'my-app',
  projectPath: path.join(window.env.DESKTOP_PATH, 'Evoker/my-app'),
  platform: false
})

const onBack = () => {
  emit('back')
}

const onSubmit = () => {}
</script>
