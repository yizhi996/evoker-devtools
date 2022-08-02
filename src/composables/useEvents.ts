import { isFunction } from '@vue/shared'

type Callback<T> = (res: T) => void

const events: Record<string, Record<string, Callback<any>[]>> = {}

export function useEvents(scope: string = 'global') {
  function on<T = unknown>(type: string, callback: Callback<T>) {
    const ev = events[scope] || (events[scope] = { [type]: [] })
    ev[type].push(callback)
  }

  function off<T = unknown>(type: string, callback: number | Callback<T>) {
    if (events[scope]) {
      const ev = events[scope][type]
      if (ev) {
        const idx = ev.findIndex(cb => cb === callback)
        idx > -1 && ev.splice(idx, 1)
      }
    }
  }

  function dispatch(type: string, data?: any) {
    if (events[scope]) {
      const ev = events[scope][type]
      if (ev) {
        ev.forEach(cb => {
          isFunction(cb) && cb(data)
        })
      }
    }
  }

  return {
    on,
    off,
    dispatch
  }
}
