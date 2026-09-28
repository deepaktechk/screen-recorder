import type { ScreenRecorderApi } from '@shared/contracts/ipc'

declare global {
    interface Window {
        screenRecorder: ScreenRecorderApi
    }
}
