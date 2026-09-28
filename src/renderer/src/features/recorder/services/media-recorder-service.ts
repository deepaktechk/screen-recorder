const PREFERRED_MIME_TYPES = [
    'video/webm;codecs=vp9,opus',
    'video/webm;codecs=vp8,opus',
    'video/webm'
]

export function getSupportedMimeType(): string {
    const mimeType = PREFERRED_MIME_TYPES.find((t) => MediaRecorder.isTypeSupported(t))
    if (!mimeType) throw new Error('This platform does not support WebM recording.')
    return mimeType
}

export function createMediaRecorder(
    stream: MediaStream,
    onData: (chunk: Blob) => void,
    onStop: () => void,
    onError: (error: unknown) => void
): MediaRecorder {
    const recorder = new MediaRecorder(stream, { mimeType: getSupportedMimeType() })

    recorder.addEventListener('dataavailable', (event) => {
        if (event.data.size > 0) onData(event.data)
    })
    recorder.addEventListener('stop', onStop)
    recorder.addEventListener('error', (event) => onError(event))

    return recorder
}
