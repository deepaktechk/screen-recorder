import { ipcRenderer } from 'electron/renderer'
import type { RecorderAction, ScreenRecorderApi, WidgetState } from '@shared/contracts/ipc'

export const screenRecorderApi: ScreenRecorderApi = {
    platform: process.platform,
    capture: {
        getSources: () => ipcRenderer.invoke('capture:list-sources'),
        selectSource: (sourceId) => ipcRenderer.invoke('capture:select-source', sourceId),
        clearSource: () => ipcRenderer.invoke('capture:clear-source'),
        getCapabilities: () => ipcRenderer.invoke('capture:get-capabilities'),
        detectLinuxMonitors: () => ipcRenderer.invoke('capture:detect-linux-monitors')
    },
    widget: {
        show: () => ipcRenderer.invoke('widget:show'),
        hide: () => ipcRenderer.invoke('widget:hide'),
        showMain: () => ipcRenderer.invoke('widget:show-main'),
        hideMain: () => ipcRenderer.invoke('widget:hide-main'),
        updateState: (state: WidgetState) => ipcRenderer.invoke('widget:update-state', state),
        sendAction: (action: RecorderAction) => ipcRenderer.invoke('widget:send-action', action),
        onAction: (callback: (action: RecorderAction) => void) => {
            const listener = (_event: unknown, action: RecorderAction): void => callback(action)
            ipcRenderer.on('widget:action-received', listener)
            return () => {
                ipcRenderer.removeListener('widget:action-received', listener)
            }
        },
        onStateUpdate: (callback: (state: WidgetState) => void) => {
            const listener = (_event: unknown, state: WidgetState): void => callback(state)
            ipcRenderer.on('widget:state-update', listener)
            return () => {
                ipcRenderer.removeListener('widget:state-update', listener)
            }
        }
    },
    window: {
        minimize: () => ipcRenderer.invoke('window:minimize'),
        maximize: () => ipcRenderer.invoke('window:maximize'),
        close: () => ipcRenderer.invoke('window:close'),
        isMaximized: () => ipcRenderer.invoke('window:is-maximized'),
        onMaximizeChange: (callback: (isMaximized: boolean) => void) => {
            const listener = (_event: unknown, isMax: boolean): void => callback(isMax)
            ipcRenderer.on('window:maximize-change', listener)
            return () => {
                ipcRenderer.removeListener('window:maximize-change', listener)
            }
        }
    }
}

