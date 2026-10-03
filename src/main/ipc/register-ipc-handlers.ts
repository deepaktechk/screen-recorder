import { ipcMain } from 'electron/main'
import { registerCaptureIpc } from '../capture/display-media-handler'

export function registerIpcHandlers(): void {
    ipcMain.handle('app:get-platform', () => process.platform)
    registerCaptureIpc()
}
