import { useCallback, useEffect, useRef, useState } from 'react'
import type { AudioDevice, CaptureSource } from '@shared/contracts/capture'
import { enumerateAudioInputDevices, tagMonitorDevices } from '../services/capture-service'

type UseCaptureSources = {
    sources: CaptureSource[]
    selectedSourceId: string | null
    setSelectedSourceId: (id: string) => void
    capabilities: {
        canCaptureSystemAudio: boolean
        canCaptureMicrophone: boolean
        platform: string
    }
    micDevices: AudioDevice[]
    systemAudioDevices: AudioDevice[]
    allAudioDevices: AudioDevice[]
    isLoading: boolean
    error: string | null
    refresh: () => Promise<void>
    refreshDevices: () => Promise<void>
}

async function fetchTaggedDevices(platform: string): Promise<AudioDevice[]> {
    const devices = await enumerateAudioInputDevices()
    if (platform === 'linux') {
        try {
            const monitors = await window.screenRecorder.capture.detectLinuxMonitors()
            return tagMonitorDevices(devices, monitors)
        } catch {
            return tagMonitorDevices(devices, [])
        }
    }
    return tagMonitorDevices(devices, [])
}

export function useCaptureSources(): UseCaptureSources {
    const [sources, setSources] = useState<CaptureSource[]>([])
    const [selectedSourceId, setSelectedSourceId] = useState<string | null>(null)
    const [allAudioDevices, setAllAudioDevices] = useState<AudioDevice[]>([])
    const [capabilities, setCapabilities] = useState({
        canCaptureSystemAudio: false,
        canCaptureMicrophone: false,
        platform: 'linux'
    })
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // Track if we've already initialized to avoid double-refresh in StrictMode
    const initializedRef = useRef(false)

    const refreshDevices = useCallback(async () => {
        try {
            const tagged = await fetchTaggedDevices(capabilities.platform)
            setAllAudioDevices(tagged)
        } catch {
            // Non-critical — device list may be incomplete
        }
    }, [capabilities.platform])

    const refresh = useCallback(async () => {
        setIsLoading(true)
        setError(null)

        try {
            if (!window.screenRecorder?.capture) {
                throw new Error('Recorder bridge unavailable. Please restart the app.')
            }

            const [availableSources, caps] = await Promise.all([
                window.screenRecorder.capture.getSources(),
                window.screenRecorder.capture.getCapabilities()
            ])

            setSources(availableSources)
            setCapabilities({
                canCaptureSystemAudio: caps.canCaptureSystemAudio,
                canCaptureMicrophone: caps.canCaptureMicrophone,
                platform: caps.platform
            })

            setSelectedSourceId((current) =>
                current && availableSources.some((s) => s.id === current)
                    ? current
                    : (availableSources[0]?.id ?? null)
            )

            // Enumerate audio devices
            if (caps.canCaptureMicrophone || caps.canCaptureSystemAudio) {
                const tagged = await fetchTaggedDevices(caps.platform)
                setAllAudioDevices(tagged)
            }
        } catch (err) {
            setSources([])
            setSelectedSourceId(null)
            setError(err instanceof Error ? err.message : 'Could not load capture sources.')
        } finally {
            setIsLoading(false)
        }
    }, [])

    // Initial load
    useEffect(() => {
        if (initializedRef.current) return
        initializedRef.current = true
        void refresh()
    }, [refresh])

    // Listen for device hot-plug events
    useEffect(() => {
        const handler = (): void => void refreshDevices()
        navigator.mediaDevices.addEventListener('devicechange', handler)
        return () => navigator.mediaDevices.removeEventListener('devicechange', handler)
    }, [refreshDevices])

    // Derived: split devices into mic and system audio categories
    const micDevices = allAudioDevices.filter((d) => !d.isMonitor)
    const systemAudioDevices = allAudioDevices.filter((d) => d.isMonitor)

    return {
        sources,
        selectedSourceId,
        setSelectedSourceId,
        capabilities,
        micDevices,
        systemAudioDevices,
        allAudioDevices,
        isLoading,
        error,
        refresh,
        refreshDevices
    }
}
