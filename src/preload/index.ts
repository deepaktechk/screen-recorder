import { contextBridge } from 'electron'
import { screenRecorderApi } from './api'

const isolatedWindow = window as typeof window & {
    screenRecorder: typeof screenRecorderApi
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
    try {
        contextBridge.exposeInMainWorld('screenRecorder', screenRecorderApi)
    } catch (error) {
        console.error(error)
    }
} else {
    isolatedWindow.screenRecorder = screenRecorderApi
}
