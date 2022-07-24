import { ipcRenderer, IpcRendererEvent } from 'electron'
import { onMounted, onUnmounted, ref } from 'vue'

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

type DeviceOnChangeCallback = (size: Size, scale: number, iphonex: boolean) => void

export function useDevice() {
  const Event = 'device-menu-command'

  const device = ref(DEVICES[0])
  const scale = ref(SCALES[0])

  let _callback: DeviceOnChangeCallback | null

  const modify = (event: IpcRendererEvent, command: string, value: any) => {
    switch (command) {
      case 'device':
        device.value = value
        _callback && _callback(SIZE[device.value], scale.value, device.value === 'iPhone X')
        break
      case 'scale':
        scale.value = value
        _callback && _callback(SIZE[device.value], scale.value, device.value === 'iPhone X')
        break
      default:
        break
    }
  }

  ipcRenderer.on(Event, modify)

  onMounted(async () => {
    device.value = (await ipcRenderer.invoke('getStoreValue', 'k_device')) || DEVICES[0]
    scale.value = (await ipcRenderer.invoke('getStoreValue', 'k_device_scale')) || SCALES[0]
    _callback && _callback(SIZE[device.value], scale.value, device.value === 'iPhone X')
  })

  onUnmounted(() => {
    ipcRenderer.off(Event, modify)
  })

  return {
    device,
    scale,
    onChange: (callback: DeviceOnChangeCallback) => {
      _callback = callback
    }
  }
}
