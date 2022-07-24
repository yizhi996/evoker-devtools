import { ipcMain } from 'electron'
import Store from "electron-store"

const store = new Store()

export { store }

ipcMain.handle("getStoreValue", (event, key: string) => {
    return store.get(key)
})

ipcMain.handle("setStoreValue", (event, key: string, value: unknown) => {
    store.set(key, value)
})