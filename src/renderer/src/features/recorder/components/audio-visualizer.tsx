import { useEffect, useRef, useState } from 'react'

type AudioVisualizerProps = {
    enabled: boolean
    deviceId?: string | null
    barCount?: number
}

export function AudioVisualizer({
    enabled,
    deviceId,
    barCount = 5
}: AudioVisualizerProps): React.JSX.Element {
    const [levels, setLevels] = useState<number[]>(() => new Array(barCount).fill(0.1))
    const animationFrameRef = useRef<number | null>(null)
    const streamRef = useRef<MediaStream | null>(null)
    const audioCtxRef = useRef<AudioContext | null>(null)

    useEffect(() => {
        if (!enabled) {
            setLevels(new Array(barCount).fill(0.1))
            return
        }

        let isMounted = true

        async function initAudio() {
            try {
                const audioConstraint =
                    deviceId && deviceId !== 'default' && deviceId !== 'auto'
                        ? { deviceId: { exact: deviceId } }
                        : true

                const stream = await navigator.mediaDevices.getUserMedia({
                    audio: audioConstraint,
                    video: false
                })

                if (!isMounted) {
                    stream.getTracks().forEach((t) => t.stop())
                    return
                }

                streamRef.current = stream

                const audioCtx = new AudioContext()
                audioCtxRef.current = audioCtx

                const analyser = audioCtx.createAnalyser()
                analyser.fftSize = 64
                analyser.smoothingTimeConstant = 0.65

                const source = audioCtx.createMediaStreamSource(stream)
                source.connect(analyser)

                const dataArray = new Uint8Array(analyser.frequencyBinCount)

                const updateMeter = () => {
                    if (!isMounted) return
                    analyser.getByteFrequencyData(dataArray)

                    // Compute volume from frequency bins
                    const step = Math.floor(dataArray.length / barCount)
                    const newLevels: number[] = []

                    for (let i = 0; i < barCount; i++) {
                        const val = dataArray[i * step] || 0
                        // Normalize 0..1 with a minimum base height
                        const normalized = Math.max(0.15, Math.min(1, val / 180))
                        newLevels.push(normalized)
                    }

                    setLevels(newLevels)
                    animationFrameRef.current = requestAnimationFrame(updateMeter)
                }

                updateMeter()
            } catch (err) {
                console.warn('AudioVisualizer initialization error:', err)
                if (isMounted) {
                    setLevels(new Array(barCount).fill(0.1))
                }
            }
        }

        void initAudio()

        return () => {
            isMounted = false
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current)
            }
            if (streamRef.current) {
                streamRef.current.getTracks().forEach((t) => t.stop())
                streamRef.current = null
            }
            if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
                void audioCtxRef.current.close()
                audioCtxRef.current = null
            }
        }
    }, [enabled, deviceId, barCount])

    return (
        <div
            className="flex items-center gap-[3px] h-5 px-1.5 py-0.5 rounded-md bg-muted/40"
            title={enabled ? 'Live microphone input level' : 'Microphone disabled'}
            aria-label="Audio level meter"
        >
            {levels.map((lvl, idx) => (
                <div
                    key={idx}
                    className="w-[3px] rounded-full transition-all duration-75"
                    style={{
                        height: `${Math.round(lvl * 16)}px`,
                        backgroundColor: enabled
                            ? lvl > 0.6
                                ? 'oklch(0.65 0.22 265)' // Loom primary accent
                                : 'oklch(0.60 0.18 145)' // Success green
                            : 'oklch(0.5 0.02 260 / 40%)'
                    }}
                />
            ))}
        </div>
    )
}
