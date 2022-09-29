import { Events } from '#shared'
import { ipcMain } from 'electron'
import Store from 'electron-store'

const store = new Store()

export { store }

ipcMain.handle(Events.GET_STORE_VALUE, (event, key: string) => {
  return store.get(key)
})

ipcMain.handle(Events.SET_STORE_VALUE, (event, key: string, value: unknown) => {
  store.set(key, value)
})
