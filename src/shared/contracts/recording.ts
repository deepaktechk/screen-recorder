export type RecorderStatus =
    | 'idle'
    | 'countdown'
    | 'requesting-permission'
    | 'recording'
    | 'paused'
    | 'stopping'
    | 'ready'
    | 'error'

export type RecorderAction = 'pause' | 'resume' | 'stop' | 'restart' | 'cancel'

export type Recording = {
    id: string
    blob: Blob
    mimeType: string
    hasAudio: boolean
    sizeBytes: number
    durationMs: number
    createdAt: number
    name: string
}
