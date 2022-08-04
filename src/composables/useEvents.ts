import { isFunction } from '@vue/shared'

type Callback<T> = (res: T) => void

const events: Record<string, Record<string, Callback<any>[]>> = {}

export function useEvents(scope: string = 'global') {
  function on<T = unknown>(type: string, callback: Callback<T>) {
    const scopeEvent = events[scope] || (events[scope] = {})
    const eventList = scopeEvent[type] || (scopeEvent[type] = [])
    eventList.push(callback)
  }

  function off<T = unknown>(type: string, callback: number | Callback<T>) {
    if (events[scope]) {
      const eventList = events[scope][type]
      if (eventList) {
        const idx = eventList.findIndex(cb => cb === callback)
        idx > -1 && eventList.splice(idx, 1)
      }
    }
  }

  function dispatch(type: string, data?: any) {
    if (events[scope]) {
      const eventList = events[scope][type]
      eventList?.forEach(cb => {
        isFunction(cb) && cb(data)
      })
    }
  }

  return {
    on,
    off,
    dispatch
  }
}
