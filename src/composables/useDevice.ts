import { ipcRenderer, IpcRendererEvent } from 'electron'
import { onMounted, onUnmounted, reactive } from 'vue'

export const DEVICE_NAMES = ['iPhone 6', 'iPhone X']

export const SCALES = [100, 85, 75, 50]

const DEVICES: Record<string, Device> = {
  'iPhone 6': {
    name: 'iPhone 6',
    width: 375,
    height: 667,
    scale: 2,
    safeAreaInsets: {
      top: 0,
      bottom: 0,
      left: 0,
      right: 0
    }
  },
  'iPhone X': {
    name: 'iPhone X',
    width: 375,
    height: 812,
    scale: 3,
    safeAreaInsets: {
      top: 44,
      bottom: 34,
      left: 0,
      right: 0
    }
  }
}

interface Device {
  name: string
  width: number
  height: number
  scale: number
  safeAreaInsets: {
    top: number
    bottom: number
    left: number
    right: number
  }
}

const deviceInfo = reactive({
  device: DEVICES[DEVICE_NAMES[1]],
  scale: SCALES[0],
  iphonex: false
})

export { deviceInfo }

export async function initialize() {
  const deviceName = (await ipcRenderer.invoke('getStoreValue', 'k_device')) || DEVICE_NAMES[1]
  const device = DEVICES[deviceName]
  const scale = (await ipcRenderer.invoke('getStoreValue', 'k_device_scale')) || SCALES[0]
  deviceInfo.device = device
  deviceInfo.scale = scale
  deviceInfo.iphonex = device.name === 'iPhone X'
}

export function useDevice() {
  const Event = 'device-menu-command'

  const modify = (event: IpcRendererEvent, command: string, value: any) => {
    switch (command) {
      case 'device':
        deviceInfo.device = DEVICES[value]
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

  onUnmounted(() => {
    ipcRenderer.off(Event, modify)
  })

  return {
    deviceInfo
  }
}
