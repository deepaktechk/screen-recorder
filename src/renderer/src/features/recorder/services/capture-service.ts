import type { AudioDevice, LinuxMonitorInfo } from '@shared/contracts/capture'

export type CaptureOptions = {
    sourceId: string
    microphoneDeviceId: string | null
    systemAudioDeviceId: string | null
    platform: string
}

// ─── Device Enumeration ───────────────────────────────────────────────────────

/**
 * Enumerate all audio input devices available to the browser.
 * Chromium hides device labels until permission is granted — warm up if needed.
 */
export async function enumerateAudioInputDevices(): Promise<AudioDevice[]> {
    let devices = await navigator.mediaDevices.enumerateDevices()
    let inputs = devices.filter((d) => d.kind === 'audioinput')

    // Warm up permission if labels are withheld
    if (inputs.length > 0 && inputs.every((d) => !d.label)) {
        try {
            const warmup = await navigator.mediaDevices.getUserMedia({ audio: true })
            warmup.getTracks().forEach((t) => t.stop())
            devices = await navigator.mediaDevices.enumerateDevices()
            inputs = devices.filter((d) => d.kind === 'audioinput')
        } catch {
            // Permission not granted or no mic available
        }
    }

    return inputs.map((d, index) => ({
        deviceId: d.deviceId,
        label: d.label || `Audio device ${index + 1}`,
        kind: 'audioinput' as const
    }))
}

/**
 * Tag audio devices with isMonitor flag using label heuristics and
 * PulseAudio/PipeWire monitor descriptions.
 */
export function tagMonitorDevices(
    devices: AudioDevice[],
    linuxMonitors: LinuxMonitorInfo[]
): AudioDevice[] {
    const monitorDescriptions = new Set(
        linuxMonitors.map((m) => m.description.toLowerCase())
    )

    return devices.map((device) => {
        const labelLower = device.label.toLowerCase()
        const isMonitor =
            labelLower.includes('monitor') ||
            labelLower.includes('loopback') ||
            labelLower.includes('stereo mix') ||
            monitorDescriptions.has(labelLower)

        return { ...device, isMonitor }
    })
}

/** Capture audio from a specific device by ID. */
async function captureAudioDevice(deviceId: string): Promise<MediaStream> {
    return navigator.mediaDevices.getUserMedia({
        audio: { deviceId: { exact: deviceId } },
        video: false
    })
}

// ─── Audio Mixer ─────────────────────────────────────────────────────────────

/**
 * Merge multiple audio streams into a single audio track using Web Audio API.
 * Ensures MediaRecorder does not drop additional audio tracks.
 */
async function mixAudioStreams(streams: MediaStream[]): Promise<{ track: MediaStreamTrack; cleanup: () => void } | null> {
    const audioTracks = streams.flatMap((s) => s.getAudioTracks())
    if (audioTracks.length === 0) return null
    if (audioTracks.length === 1) return { track: audioTracks[0], cleanup: () => {} }

    try {
        const audioCtx = new AudioContext()
        if (audioCtx.state === 'suspended') {
            await audioCtx.resume()
        }
        const dest = audioCtx.createMediaStreamDestination()

        for (const stream of streams) {
            if (stream.getAudioTracks().length > 0) {
                const source = audioCtx.createMediaStreamSource(stream)
                source.connect(dest)
            }
        }

        const mixedTrack = dest.stream.getAudioTracks()[0]
        return {
            track: mixedTrack,
            cleanup: () => {
                void audioCtx.close()
            }
        }
    } catch {
        return { track: audioTracks[0], cleanup: () => {} }
    }
}

// ─── Main Entry Point ────────────────────────────────────────────────────────

/**
 * Requests the combined screen/window video and audio streams for recording.
 * - Handles system loopback audio with voice filters disabled for high fidelity.
 * - Captures optional microphone audio.
 * - Automatically mixes audio if both sources are active.
 */
export async function requestCaptureStream(options: CaptureOptions): Promise<MediaStream> {
    await window.screenRecorder.capture.selectSource(options.sourceId)

    const { microphoneDeviceId, systemAudioDeviceId } = options
    const wantSystemAudio = Boolean(systemAudioDeviceId)
    const isCustomAudioDevice = wantSystemAudio && systemAudioDeviceId !== 'auto'
    // Always request loopback from displayMedia if system audio is wanted
    const requestLoopback = wantSystemAudio

    // 1. Capture screen/window video (and system loopback audio if requested)
    const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: requestLoopback
            ? {
                  echoCancellation: false,
                  noiseSuppression: false,
                  autoGainControl: false
              }
            : false
    })

    const videoTracks = displayStream.getVideoTracks()
    const collectedAudioStreams: MediaStream[] = []
    const streamsToCleanup: MediaStream[] = [displayStream]

    // 2. System Audio
    if (wantSystemAudio) {
        const loopbackTracks = displayStream.getAudioTracks()

        if (loopbackTracks.length > 0) {
            // Always prefer native system loopback from display media
            loopbackTracks.forEach((t) => (t.enabled = true))
            collectedAudioStreams.push(new MediaStream(loopbackTracks))
        } else if (isCustomAudioDevice && systemAudioDeviceId) {
            // Fallback to custom audio device if loopback track was not returned
            try {
                const customStream = await captureAudioDevice(systemAudioDeviceId)
                collectedAudioStreams.push(customStream)
                streamsToCleanup.push(customStream)
            } catch (err) {
                streamsToCleanup.forEach(stopMediaStream)
                throw err
            }
        }
    }

    // 3. Microphone
    if (microphoneDeviceId) {
        try {
            const micStream =
                microphoneDeviceId === 'default'
                    ? await navigator.mediaDevices.getUserMedia({ audio: true })
                    : await captureAudioDevice(microphoneDeviceId)

            collectedAudioStreams.push(micStream)
            streamsToCleanup.push(micStream)
        } catch (err) {
            streamsToCleanup.forEach(stopMediaStream)
            throw err
        }
    }

    // 4. Combine Video + Audio tracks (mixed if multiple audio sources)
    const finalTracks: MediaStreamTrack[] = [...videoTracks]

    if (collectedAudioStreams.length === 1) {
        collectedAudioStreams[0].getAudioTracks().forEach((t) => finalTracks.push(t))
    } else if (collectedAudioStreams.length > 1) {
        const mixed = await mixAudioStreams(collectedAudioStreams)
        if (mixed) {
            finalTracks.push(mixed.track)
            videoTracks[0]?.addEventListener('ended', () => {
                mixed.cleanup()
            })
        }
    }

    const finalStream = new MediaStream(finalTracks)

    // Ensure all background streams are released when recording stops
    finalStream.getVideoTracks()[0]?.addEventListener('ended', () => {
        streamsToCleanup.forEach(stopMediaStream)
    })

    return finalStream
}

export function stopMediaStream(stream: MediaStream | null): void {
    stream?.getTracks().forEach((track) => track.stop())
}
