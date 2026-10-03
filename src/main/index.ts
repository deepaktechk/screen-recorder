import { app, BrowserWindow, session, ipcMain } from 'electron/main'
import { shell } from 'electron/common'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { registerDisplayMediaHandler } from './capture/display-media-handler'
import { registerIpcHandlers } from './ipc/register-ipc-handlers'
import { createWidgetWindow, registerWidgetIpc, isRecordingActive } from './widget/widget-window'

let isQuitting = false

// Enable system audio loopback and modern screen capturer features across platforms
app.commandLine.appendSwitch(
    'enable-features',
    [
        'PulseaudioLoopbackForScreenShare',
        'WebRTCPipeWireCapturer',
        'MacLoopbackAudioForScreenShare',
        'MacSckSystemAudioLoopbackOverride'
    ].join(',')
)

function registerWindowControlIpc(mainWindow: BrowserWindow): void {
    ipcMain.removeHandler('window:minimize')
    ipcMain.removeHandler('window:maximize')
    ipcMain.removeHandler('window:close')
    ipcMain.removeHandler('window:is-maximized')

    ipcMain.handle('window:minimize', () => {
        if (!mainWindow.isDestroyed()) mainWindow.minimize()
    })

    ipcMain.handle('window:maximize', () => {
        if (!mainWindow.isDestroyed()) {
            if (mainWindow.isMaximized()) {
                mainWindow.unmaximize()
            } else {
                mainWindow.maximize()
            }
        }
    })

    ipcMain.handle('window:close', () => {
        if (!mainWindow.isDestroyed()) mainWindow.close()
    })

    ipcMain.handle('window:is-maximized', () => {
        return !mainWindow.isDestroyed() && mainWindow.isMaximized()
    })

    mainWindow.on('maximize', () => {
        if (!mainWindow.isDestroyed()) {
            mainWindow.webContents.send('window:maximize-change', true)
        }
    })

    mainWindow.on('unmaximize', () => {
        if (!mainWindow.isDestroyed()) {
            mainWindow.webContents.send('window:maximize-change', false)
        }
    })
}

function createWindow(): BrowserWindow {
    const mainWindow = new BrowserWindow({
        width: 880,
        height: 620,
        minWidth: 800,
        minHeight: 560,
        show: false,
        frame: false,
        autoHideMenuBar: true,
        ...(process.platform === 'linux' ? { icon } : {}),
        webPreferences: {
            preload: join(__dirname, '../preload/index.js'),
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: true,
            backgroundThrottling: false
        }
    })

    registerWindowControlIpc(mainWindow)

    mainWindow.on('ready-to-show', () => {
        mainWindow.show()
        if (is.dev) {
            mainWindow.webContents.openDevTools()
        }
    })

    mainWindow.on('close', (event) => {
        if (!isQuitting && isRecordingActive()) {
            event.preventDefault()
            mainWindow.hide()
        }
    })

    mainWindow.webContents.setWindowOpenHandler((details) => {
        shell.openExternal(details.url)
        return { action: 'deny' }
    })

    if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
        mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
    } else {
        mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
    }

    return mainWindow
}

app.whenReady().then(() => {
    electronApp.setAppUserModelId('com.capturely.app')

    // Automatically allow media and display-capture permissions
    session.defaultSession.setPermissionRequestHandler((_webContents, _permission, callback) => {
        callback(true)
    })
    session.defaultSession.setPermissionCheckHandler(() => true)

    registerIpcHandlers()
    registerDisplayMediaHandler()
    registerWidgetIpc()

    app.on('browser-window-created', (_, window) => {
        optimizer.watchWindowShortcuts(window)
    })

    const mainWindow = createWindow()
    createWidgetWindow(mainWindow)

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            const win = createWindow()
            createWidgetWindow(win)
        }
    })
})

app.on('before-quit', () => {
    isQuitting = true
})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})
