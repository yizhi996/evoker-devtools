import { BrowserWindow, ipcMain, Menu, MenuItem } from 'electron'
import { store } from './store'
import { Events } from '#shared'

export const DEVICES = ['iPhone 6', 'iPhone X']

export const SCALES = [100, 85, 75, 50]

ipcMain.on(Events.SHOW_DEVICE_MENU, event => {
  const currentDevice = store.get('k_device') || DEVICES[0]
  const currentScale = store.get('k_device_scale') || SCALES[0]

  const template: MenuItem[] = [
    {
      label: 'Device',
      submenu: DEVICES.map(d => {
        return {
          label: d,
          type: 'radio',
          checked: currentDevice === d,
          enabled: currentDevice !== d,
          click: () => {
            event.sender.send(Events.DEVICE_MENU_COMMAND, 'device', d)
            store.set('k_device', d)
          },
        }
      }),
    },
    {
      label: 'Scale',
      submenu: SCALES.map(d => {
        return {
          label: `${d}%`,
          type: 'radio',
          checked: d === currentScale,
          enabled: currentScale !== d,
          click: () => {
            event.sender.send(Events.DEVICE_MENU_COMMAND, 'scale', d)
            store.set('k_device_scale', d)
          },
        }
      }),
    },
  ]
  const menu = Menu.buildFromTemplate(template)
  menu.popup({ window: BrowserWindow.fromWebContents(event.sender) })
})
