import { reactive } from 'vue'

export const SCALES = [100, 85, 75, 50]

export interface Device {
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
  haveNotch?: boolean
  notchWidth?: number
  haveHomeIndicator?: boolean
  haveDynamicIsland?: boolean
}

export const DEVICES: Record<string, Device> = {
  'iPhone 6': {
    name: 'iPhone 6',
    width: 375,
    height: 667,
    scale: 2,
    safeAreaInsets: {
      top: 0,
      bottom: 0,
      left: 0,
      right: 0,
    },
  },
  'iPhone 8': {
    name: 'iPhone 8',
    width: 375,
    height: 667,
    scale: 2,
    safeAreaInsets: {
      top: 0,
      bottom: 0,
      left: 0,
      right: 0,
    },
  },
  'iPhone 8 Plus': {
    name: 'iPhone 8 Plus',
    width: 414,
    height: 736,
    scale: 3,
    safeAreaInsets: {
      top: 0,
      bottom: 0,
      left: 0,
      right: 0,
    },
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
      right: 0,
    },
    haveNotch: true,
    haveHomeIndicator: true,
  },
  'iPhone 13 mini': {
    name: 'iPhone 13 mini',
    width: 375,
    height: 812,
    scale: 3,
    safeAreaInsets: {
      top: 50,
      bottom: 34,
      left: 0,
      right: 0,
    },
    haveNotch: true,
    haveHomeIndicator: true,
  },
  'iPhone 14': {
    name: 'iPhone 14',
    width: 390,
    height: 844,
    scale: 3,
    safeAreaInsets: {
      top: 47,
      bottom: 34,
      left: 0,
      right: 0,
    },
    haveNotch: true,
    notchWidth: 185,
    haveHomeIndicator: true,
  },
  'iPhone 14 Plus': {
    name: 'iPhone 14 Plus',
    width: 428,
    height: 926,
    scale: 3,
    safeAreaInsets: {
      top: 47,
      bottom: 34,
      left: 0,
      right: 0,
    },
    haveNotch: true,
    haveHomeIndicator: true,
  },
  'iPhone 14 Pro': {
    name: 'iPhone 14 Pro',
    width: 393,
    height: 852,
    scale: 3,
    safeAreaInsets: {
      top: 59,
      bottom: 34,
      left: 0,
      right: 0,
    },
    haveDynamicIsland: true,
    haveHomeIndicator: true,
  },
  'iPhone 14 Pro Max': {
    name: 'iPhone 14 Pro Max',
    width: 430,
    height: 932,
    scale: 3,
    safeAreaInsets: {
      top: 59,
      bottom: 34,
      left: 0,
      right: 0,
    },
    haveDynamicIsland: true,
    haveHomeIndicator: true,
  },
}

const deviceInfo = reactive({
  device: DEVICES['iPhone 14 Pro'],
  scale: SCALES[1],
})

export { deviceInfo }

export async function initialize() {
  const deviceName = (await window.electronAPI.getStorageValue('k_device')) || 'iPhone 14 Pro'
  const device = DEVICES[deviceName]
  const scale = (await window.electronAPI.getStorageValue('k_device_scale')) || SCALES[1]
  deviceInfo.device = device
  deviceInfo.scale = scale
}

export function setCurrentDevice(name: string) {
  if (!Object.keys(DEVICES).includes(name)) {
    return
  }
  deviceInfo.device = DEVICES[name]
  window.electronAPI.setStorageValue('k_device', name)
}

export function setCurrentDeviceSacle(scale: number) {
  if (!SCALES.includes(scale)) {
    return
  }
  deviceInfo.scale = scale
  window.electronAPI.setStorageValue('k_device_scale', scale)
}
