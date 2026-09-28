import type { CaptureCapabilities, CaptureSource, LinuxMonitorInfo } from './capture'
import type { RecorderAction, RecorderStatus } from './recording'

export type { RecorderAction, RecorderStatus } from './recording'

export type AppPlatform = NodeJS.Platform

export type WidgetState = {
    status: RecorderStatus
    elapsedSeconds: number
}

export type ScreenRecorderApi = {
    platform: AppPlatform
    capture: {
        getSources: () => Promise<CaptureSource[]>
        selectSource: (sourceId: string) => Promise<void>
        clearSource: () => Promise<void>
        getCapabilities: () => Promise<CaptureCapabilities>
        detectLinuxMonitors: () => Promise<LinuxMonitorInfo[]>
    }
    widget: {
        show: () => Promise<void>
        hide: () => Promise<void>
        showMain: () => Promise<void>
        hideMain: () => Promise<void>
        updateState: (state: WidgetState) => Promise<void>
        sendAction: (action: RecorderAction) => Promise<void>
        onAction: (callback: (action: RecorderAction) => void) => () => void
        onStateUpdate: (callback: (state: WidgetState) => void) => () => void
    }
    window: {
        minimize: () => Promise<void>
        maximize: () => Promise<void>
        close: () => Promise<void>
        isMaximized: () => Promise<boolean>
        onMaximizeChange: (callback: (isMaximized: boolean) => void) => () => void
    }
}
