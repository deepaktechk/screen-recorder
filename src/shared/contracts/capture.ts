export type CaptureSourceType = 'screen' | 'window'

export type CaptureSource = {
    id: string
    name: string
    type: CaptureSourceType
    thumbnailDataUrl: string
    displayId: string
}

export type AudioDevice = {
    deviceId: string
    label: string
    kind: 'audioinput' | 'audiooutput'
    isMonitor?: boolean
}

export type CaptureCapabilities = {
    canCaptureScreen: boolean
    canCaptureWindow: boolean
    canCaptureSystemAudio: boolean
    canCaptureMicrophone: boolean
    platform: NodeJS.Platform
}

/** Returned by the main process when detecting PulseAudio/PipeWire monitor sources on Linux. */
export type LinuxMonitorInfo = {
    name: string
    description: string
}
