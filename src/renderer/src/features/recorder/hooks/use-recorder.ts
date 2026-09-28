import { useCallback, useEffect, useRef, useState } from 'react'
import type { RecorderAction, RecorderStatus, Recording } from '@shared/contracts/recording'
import { requestCaptureStream, stopMediaStream } from '../services/capture-service'
import { createMediaRecorder } from '../services/media-recorder-service'

export type StartOptions = {
    sourceId: string
    sourceName: string
    platform: string
    microphoneDeviceId: string | null
    systemAudioDeviceId: string | null
}

function humanError(error: unknown): string {
    if (error instanceof DOMException) {
        switch (error.name) {
            case 'NotAllowedError':
                return 'Permission denied. Allow screen/microphone access and try again.'
            case 'NotFoundError':
                return 'No capture device found. Check your screen sharing permissions.'
            case 'NotReadableError':
                return 'Capture device is already in use by another application.'
            case 'OverconstrainedError':
                return 'The selected device does not match the requested constraints.'
            case 'AbortError':
                return 'Capture was cancelled.'
        }
    }
    return error instanceof Error ? error.message : 'Recording could not be started.'
}

export type UseRecorder = {
    status: RecorderStatus
    recording: Recording | null
    previewUrl: string | null
    error: string | null
    elapsedSeconds: number
    countdown: number
    start: (options: StartOptions) => Promise<void>
    cancelCountdown: () => void
    pause: () => void
    resume: () => void
    restart: () => void
    cancel: () => void
    stop: () => void
    reset: () => void
}

export function useRecorder(): UseRecorder {
    const [status, setStatus] = useState<RecorderStatus>('idle')
    const [recording, setRecording] = useState<Recording | null>(null)
    const [previewUrl, setPreviewUrl] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [elapsedSeconds, setElapsedSeconds] = useState(0)
    const [countdown, setCountdown] = useState(0)

    const streamRef = useRef<MediaStream | null>(null)
    const recorderRef = useRef<MediaRecorder | null>(null)
    const chunksRef = useRef<Blob[]>([])
    const startedAtRef = useRef<number>(0)
    const pauseStartedAtRef = useRef<number>(0)
    const totalPausedDurationRef = useRef<number>(0)
    const sourceNameRef = useRef<string>('')
    const countdownTimerRef = useRef<number | null>(null)
    const lastOptionsRef = useRef<StartOptions | null>(null)

    const revokePreview = useCallback(() => {
        setPreviewUrl((url) => {
            if (url) URL.revokeObjectURL(url)
            return null
        })
    }, [])

    // ── Widget state sync ────────────────────────────────────────────────────
    useEffect(() => {
        if (typeof window !== 'undefined' && window.screenRecorder?.widget) {
            void window.screenRecorder.widget.updateState({
                status,
                elapsedSeconds
            })
        }
    }, [status, elapsedSeconds])

    const stop = useCallback(() => {
        const recorder = recorderRef.current
        if (!recorder || recorder.state === 'inactive') return
        setStatus('stopping')
        void window.screenRecorder?.widget?.hide()
        void window.screenRecorder?.widget?.showMain()
        recorder.stop()
    }, [])

    const pause = useCallback(() => {
        const recorder = recorderRef.current
        if (!recorder || recorder.state !== 'recording') return
        recorder.pause()
        pauseStartedAtRef.current = Date.now()
        setStatus('paused')
    }, [])

    const resume = useCallback(() => {
        const recorder = recorderRef.current
        if (!recorder || recorder.state !== 'paused') return
        totalPausedDurationRef.current += Date.now() - pauseStartedAtRef.current
        recorder.resume()
        setStatus('recording')
    }, [])

    const cancel = useCallback(() => {
        if (countdownTimerRef.current) {
            window.clearInterval(countdownTimerRef.current)
            countdownTimerRef.current = null
        }
        setCountdown(0)
        void window.screenRecorder?.widget?.hide()
        void window.screenRecorder?.widget?.showMain()

        const recorder = recorderRef.current
        if (recorder && recorder.state !== 'inactive') {
            recorder.onstop = null
            recorder.onerror = null
            try {
                recorder.stop()
            } catch {
                // Ignore any error on cancel
            }
        }

        stopMediaStream(streamRef.current)
        streamRef.current = null
        recorderRef.current = null
        chunksRef.current = []
        setElapsedSeconds(0)
        setStatus('idle')
    }, [])

    const reset = useCallback(() => {
        cancel()
        revokePreview()
        setRecording(null)
        setError(null)
    }, [cancel, revokePreview])

    const cancelCountdown = useCallback(() => {
        if (countdownTimerRef.current) {
            window.clearInterval(countdownTimerRef.current)
            countdownTimerRef.current = null
        }
        setCountdown(0)
        stopMediaStream(streamRef.current)
        streamRef.current = null
        setStatus('idle')
    }, [])

    const startRecordingActual = useCallback((stream: MediaStream) => {
        chunksRef.current = []
        startedAtRef.current = Date.now()
        totalPausedDurationRef.current = 0

        const recorder = createMediaRecorder(
            stream,
            (chunk) => chunksRef.current.push(chunk),
            () => {
                const blob = new Blob(chunksRef.current, { type: recorder.mimeType })
                const durationMs = Math.max(
                    0,
                    Date.now() - startedAtRef.current - totalPausedDurationRef.current
                )
                const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)

                setRecording({
                    id: crypto.randomUUID(),
                    blob,
                    mimeType: recorder.mimeType,
                    hasAudio: stream.getAudioTracks().length > 0,
                    sizeBytes: blob.size,
                    durationMs,
                    createdAt: Date.now(),
                    name: `capturely-${timestamp}`
                })
                setPreviewUrl(URL.createObjectURL(blob))
                stopMediaStream(streamRef.current)
                streamRef.current = null
                recorderRef.current = null
                void window.screenRecorder?.widget?.hide()
                void window.screenRecorder?.widget?.showMain()
                setStatus('ready')
            },
            (recorderError) => {
                setError(humanError(recorderError))
                stopMediaStream(streamRef.current)
                streamRef.current = null
                recorderRef.current = null
                void window.screenRecorder?.widget?.hide()
                void window.screenRecorder?.widget?.showMain()
                setStatus('error')
            }
        )

        recorderRef.current = recorder
        recorder.start(1000)
        setStatus('recording')
        void window.screenRecorder?.widget?.show()
        void window.screenRecorder?.widget?.hideMain()

        // If the user stops sharing via the browser / OS stop sharing banner
        stream.getVideoTracks()[0]?.addEventListener('ended', stop)
    }, [stop])

    const start = useCallback(
        async (options: StartOptions) => {
            if (
                status === 'recording' ||
                status === 'paused' ||
                status === 'countdown' ||
                status === 'requesting-permission' ||
                status === 'stopping'
            ) {
                return
            }

            setError(null)
            revokePreview()
            setRecording(null)
            setElapsedSeconds(0)
            setStatus('requesting-permission')
            chunksRef.current = []
            sourceNameRef.current = options.sourceName
            lastOptionsRef.current = options

            try {
                const stream = await requestCaptureStream({
                    sourceId: options.sourceId,
                    platform: options.platform,
                    microphoneDeviceId: options.microphoneDeviceId,
                    systemAudioDeviceId: options.systemAudioDeviceId
                })

                streamRef.current = stream

                // Begin Loom animated 3-2-1 countdown
                setStatus('countdown')
                setCountdown(3)

                let currentCount = 3
                countdownTimerRef.current = window.setInterval(() => {
                    currentCount -= 1
                    if (currentCount <= 0) {
                        if (countdownTimerRef.current) {
                            window.clearInterval(countdownTimerRef.current)
                            countdownTimerRef.current = null
                        }
                        setCountdown(0)
                        startRecordingActual(stream)
                    } else {
                        setCountdown(currentCount)
                    }
                }, 1000)
            } catch (captureError) {
                stopMediaStream(streamRef.current)
                streamRef.current = null
                setError(humanError(captureError))
                setStatus('error')
            }
        },
        [revokePreview, startRecordingActual, status]
    )

    const restart = useCallback(() => {
        cancel()
        if (lastOptionsRef.current) {
            void start(lastOptionsRef.current)
        }
    }, [cancel, start])

    // Wire up actions from the floating widget window
    const actionsRef = useRef({ pause, resume, stop, restart, cancel })
    useEffect(() => {
        actionsRef.current = { pause, resume, stop, restart, cancel }
    })

    useEffect(() => {
        if (!window.screenRecorder?.widget?.onAction) return
        const unsubscribe = window.screenRecorder.widget.onAction((action: RecorderAction) => {
            switch (action) {
                case 'pause':
                    actionsRef.current.pause()
                    break
                case 'resume':
                    actionsRef.current.resume()
                    break
                case 'stop':
                    actionsRef.current.stop()
                    break
                case 'restart':
                    actionsRef.current.restart()
                    break
                case 'cancel':
                    actionsRef.current.cancel()
                    break
            }
        })
        return unsubscribe
    }, [])

    // Live elapsed-time counter
    useEffect(() => {
        if (status !== 'recording') return
        const interval = window.setInterval(() => {
            const elapsed = Math.floor(
                (Date.now() - startedAtRef.current - totalPausedDurationRef.current) / 1000
            )
            setElapsedSeconds(Math.max(0, elapsed))
        }, 250)
        return () => window.clearInterval(interval)
    }, [status])

    // Cleanup on unmount
    useEffect(
        () => () => {
            if (countdownTimerRef.current) {
                window.clearInterval(countdownTimerRef.current)
            }
            stopMediaStream(streamRef.current)
            if (previewUrl) URL.revokeObjectURL(previewUrl)
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        []
    )

    return {
        status,
        recording,
        previewUrl,
        error,
        elapsedSeconds,
        countdown,
        start,
        cancelCountdown,
        pause,
        resume,
        restart,
        cancel,
        stop,
        reset
    }
}

