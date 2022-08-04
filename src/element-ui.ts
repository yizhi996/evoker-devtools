import { App } from 'vue'
import {
  ElButton,
  ElIcon,
  ElForm,
  ElFormItem,
  ElInput,
  ElScrollbar,
  ElContainer,
  ElMain,
  ElSwitch,
  ElEmpty
} from 'element-plus'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import 'element-plus/theme-chalk/dark/css-vars.css'

export default {
  install: (app: App) => {
    app
      .use(ElButton)
      .use(ElIcon)
      .use(ElForm)
      .use(ElFormItem)
      .use(ElInput)
      .use(ElScrollbar)
      .use(ElContainer)
      .use(ElMain)
      .use(ElSwitch)
      .use(ElEmpty)
    for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
      app.component(key, component)
    }
  }
}
