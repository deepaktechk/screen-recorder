import { BrowserWindow, ipcMain, screen } from 'electron/main'
import { join } from 'path'
import { is } from '@electron-toolkit/utils'
import type { RecorderAction, WidgetState } from '../../shared/contracts/ipc'

let widgetWindow: BrowserWindow | null = null
let mainWindowRef: BrowserWindow | null = null
let currentStatus = 'idle'

export function isRecordingActive(): boolean {
    return (
        currentStatus === 'recording' ||
        currentStatus === 'paused' ||
        currentStatus === 'countdown' ||
        currentStatus === 'stopping'
    )
}

export function createWidgetWindow(mainWindow: BrowserWindow): BrowserWindow {
    mainWindowRef = mainWindow

    const primaryDisplay = screen.getPrimaryDisplay()
    const { height } = primaryDisplay.workAreaSize

    const widgetWidth = 380
    const widgetHeight = 72
    // Position at bottom-left corner with 32px margins
    const x = 32
    const y = height - widgetHeight - 32

    widgetWindow = new BrowserWindow({
        width: widgetWidth,
        height: widgetHeight,
        x,
        y,
        show: false,
        frame: false,
        transparent: true,
        backgroundColor: '#00000000',
        alwaysOnTop: true,
        resizable: false,
        skipTaskbar: true,
        hasShadow: false,
        focusable: true,
        webPreferences: {
            preload: join(__dirname, '../preload/index.js'),
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: true,
            backgroundThrottling: false
        }
    })

    widgetWindow.setVisibleOnAllWorkspaces?.(true, { visibleOnFullScreen: true })
    widgetWindow.setAlwaysOnTop(true, 'screen-saver')

    if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
        widgetWindow.loadURL(`${process.env['ELECTRON_RENDERER_URL']}#/widget`)
    } else {
        widgetWindow.loadFile(join(__dirname, '../renderer/index.html'), { hash: 'widget' })
    }

    widgetWindow.on('closed', () => {
        widgetWindow = null
    })

    return widgetWindow
}

export function registerWidgetIpc(): void {
    ipcMain.handle('widget:show', () => {
        if (!widgetWindow || widgetWindow.isDestroyed()) return
        widgetWindow.showInactive()
        widgetWindow.setAlwaysOnTop(true, 'screen-saver')
    })

    ipcMain.handle('widget:hide', () => {
        if (!widgetWindow || widgetWindow.isDestroyed()) return
        widgetWindow.hide()
    })

    ipcMain.handle('widget:show-main', () => {
        if (!mainWindowRef || mainWindowRef.isDestroyed()) return
        mainWindowRef.show()
        mainWindowRef.focus()
    })

    ipcMain.handle('widget:hide-main', () => {
        if (!mainWindowRef || mainWindowRef.isDestroyed()) return
        mainWindowRef.hide()
    })

    ipcMain.handle('widget:update-state', (_event, state: WidgetState) => {
        currentStatus = state.status
        if (!widgetWindow || widgetWindow.isDestroyed()) return
        widgetWindow.webContents.send('widget:state-update', state)
    })

    ipcMain.handle('widget:send-action', (_event, action: RecorderAction) => {
        if (!mainWindowRef || mainWindowRef.isDestroyed()) return
        if (action === 'stop' || action === 'cancel') {
            mainWindowRef.show()
            mainWindowRef.focus()
        }
        mainWindowRef.webContents.send('widget:action-received', action)
    })
}
