import { ipcRenderer, IpcRendererEvent } from 'electron'
import { onMounted, onUnmounted, reactive } from 'vue'

export const DEVICES = ['iPhone 6', 'iPhone X']

export const SCALES = [100, 85, 75, 50]

const SIZE: Record<string, Size> = {
  'iPhone 6': {
    width: 375,
    height: 667
  },
  'iPhone X': {
    width: 375,
    height: 812
  }
}

interface Size {
  width: number
  height: number
}

const deviceInfo = reactive({
  device: DEVICES[1],
  width: SIZE[DEVICES[1]].width,
  height: SIZE[DEVICES[1]].height,
  scale: SCALES[0],
  iphonex: false
})

export { deviceInfo }

export function useDevice() {
  const Event = 'device-menu-command'

  const modify = (event: IpcRendererEvent, command: string, value: any) => {
    switch (command) {
      case 'device':
        deviceInfo.device = value
        deviceInfo.width = SIZE[value].width
        deviceInfo.height = SIZE[value].height
        deviceInfo.iphonex = value === 'iPhone X'
        break
      case 'scale':
        deviceInfo.scale = value
        break
      default:
        break
    }
  }

  ipcRenderer.on(Event, modify)

  onMounted(async () => {
    const device = (await ipcRenderer.invoke('getStoreValue', 'k_device')) || DEVICES[1]
    const scale = (await ipcRenderer.invoke('getStoreValue', 'k_device_scale')) || SCALES[0]
    deviceInfo.device = device
    deviceInfo.width = SIZE[device].width
    deviceInfo.height = SIZE[device].height
    deviceInfo.scale = scale
    deviceInfo.iphonex = device === 'iPhone X'
  })

  onUnmounted(() => {
    ipcRenderer.off(Event, modify)
  })

  return {
    deviceInfo
  }
}
