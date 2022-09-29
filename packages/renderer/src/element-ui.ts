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
  ElEmpty,
  ElDropdown,
  ElDropdownMenu,
  ElDropdownItem,
  ElMenu,
  ElMenuItem,
  ElSubMenu,
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
      .use(ElDropdown)
      .use(ElDropdownMenu)
      .use(ElDropdownItem)
      .use(ElMenu)
      .use(ElMenuItem)
      .use(ElSubMenu)

    for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
      app.component(key, component)
    }
  },
}
