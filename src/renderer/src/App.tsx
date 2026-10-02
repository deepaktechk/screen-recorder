import { useState, useCallback, useEffect } from 'react'
import {
    RefreshCw,
    AlertCircle,
    Loader2,
    Download,
    RotateCcw,
    CheckCircle2,
    FileVideo
} from 'lucide-react'
import { useCaptureSources } from '@/features/recorder/hooks/use-capture-sources'
import { useRecorder } from '@/features/recorder/hooks/use-recorder'
import { useTheme } from '@/hooks/use-theme'
import { TitleBar } from '@/components/title-bar'
import { SourcePicker } from '@/features/recorder/components/source-picker'
import { AudioSettings } from '@/features/recorder/components/audio-settings'
import { RecordingControls } from '@/features/recorder/components/recording-controls'
import { CountdownOverlay } from '@/features/recorder/components/countdown-overlay'

function formatDuration(totalSeconds: number): string {
    const m = Math.floor(totalSeconds / 60)
        .toString()
        .padStart(2, '0')
    const s = (totalSeconds % 60).toString().padStart(2, '0')
    return `${m}:${s}`
}

function formatBytes(bytes: number): string {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

const App = (): React.JSX.Element => {
    // ── Theme ───────────────────────────────────────────────────────────────
    const { theme, resolved, cycle } = useTheme()

    // ── Audio state ─────────────────────────────────────────────────────────
    const [micEnabled, setMicEnabled] = useState(false)
    const [micDeviceId, setMicDeviceId] = useState('default')
    const [sysAudioEnabled, setSysAudioEnabled] = useState(true)
    const [sysAudioDeviceId, setSysAudioDeviceId] = useState('auto')

    // ── Data hooks ──────────────────────────────────────────────────────────
    const {
        sources,
        selectedSourceId,
        setSelectedSourceId,
        capabilities,
        micDevices,
        systemAudioDevices,
        isLoading,
        error: sourcesError,
        refresh,
        refreshDevices
    } = useCaptureSources()

    const recorder = useRecorder()

    const isRecordingActive =
        recorder.status === 'recording' ||
        recorder.status === 'paused' ||
        recorder.status === 'countdown' ||
        recorder.status === 'requesting-permission' ||
        recorder.status === 'stopping'

    // ── Actions ─────────────────────────────────────────────────────────────
    const handleStart = useCallback(() => {
        if (!selectedSourceId) return
        const source = sources.find((s) => s.id === selectedSourceId)

        void recorder.start({
            sourceId: selectedSourceId,
            sourceName: source?.name ?? 'Screen',
            platform: capabilities.platform,
            microphoneDeviceId: micEnabled ? micDeviceId || 'default' : null,
            systemAudioDeviceId: sysAudioEnabled
                ? capabilities.platform === 'linux'
                    ? sysAudioDeviceId
                    : 'auto'
                : null
        })
    }, [
        selectedSourceId,
        sources,
        recorder,
        capabilities.platform,
        micEnabled,
        micDeviceId,
        sysAudioEnabled,
        sysAudioDeviceId
    ])

    const handleDownload = useCallback(() => {
        const { recording } = recorder
        if (!recording) return
        const ext = recording.mimeType.includes('webm') ? 'webm' : 'mp4'
        const url = URL.createObjectURL(recording.blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${recording.name}.${ext}`
        a.click()
        URL.revokeObjectURL(url)
    }, [recorder])

    // Cancel countdown on Escape key
    useEffect(() => {
        if (recorder.countdown <= 0) return
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                recorder.cancelCountdown()
            }
        }
        window.addEventListener('keydown', onKeyDown)
        return () => window.removeEventListener('keydown', onKeyDown)
    }, [recorder])

    const canStart = Boolean(selectedSourceId) && !isLoading && !isRecordingActive

    return (
        <div className="flex flex-col bg-background border border-border/50 w-screen h-screen overflow-hidden select-none">
            {/* ── Frameless Title Bar ──────────────────────────────────────── */}
            <TitleBar
                theme={theme}
                resolvedTheme={resolved}
                onCycleTheme={cycle}
                platform={capabilities.platform}
            />

            {/* ── Loom 3-2-1 Animated Countdown Overlay ───────────────────── */}
            {recorder.countdown > 0 && (
                <CountdownOverlay count={recorder.countdown} onCancel={recorder.cancelCountdown} />
            )}

            {/* ── Main Studio Body ─────────────────────────────────────────── */}
            <div className="flex flex-col flex-1 overflow-hidden">
                {recorder.status === 'ready' && recorder.recording ? (
                    /* ══════════════════════════════════════════════════════════
                       REVIEW SUITE (Recording Complete)
                       ══════════════════════════════════════════════════════════ */
                    <div className="flex flex-col flex-1 justify-between mx-auto p-6 w-full max-w-3xl overflow-y-auto animate-in duration-200 fade-in zoom-in-95">
                        {/* Header */}
                        <div className="flex justify-between items-center pb-3 border-border/40 border-b">
                            <div className="flex items-center gap-3">
                                <div className="flex justify-center items-center bg-emerald-500/15 rounded-xl size-9 text-emerald-500">
                                    <CheckCircle2 className="size-5" />
                                </div>
                                <div>
                                    <h2 className="font-bold text-foreground text-base">
                                        Recording Complete
                                    </h2>
                                    <p className="text-[11px] text-muted-foreground">
                                        Review your capture or save it locally.
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={recorder.reset}
                                    className="flex items-center gap-1.5 bg-card hover:bg-muted px-3.5 py-1.5 border border-border rounded-xl font-semibold text-foreground text-xs active:scale-95 transition-all"
                                >
                                    <RotateCcw className="size-3.5" />
                                    New recording
                                </button>

                                <button
                                    type="button"
                                    onClick={handleDownload}
                                    className="flex items-center gap-2 bg-linear-to-r from-primary to-indigo-600 hover:opacity-95 shadow-md shadow-primary/25 px-4 py-1.5 rounded-xl font-bold text-white text-xs active:scale-95 transition-all"
                                >
                                    <Download className="size-3.5" />
                                    Download video
                                </button>
                            </div>
                        </div>

                        {/* Video Player Card */}
                        <div className="relative flex justify-center items-center bg-black shadow-xl my-4 border border-border/80 rounded-2xl max-h-80 overflow-hidden">
                            <video
                                src={recorder.previewUrl || undefined}
                                controls
                                autoPlay
                                playsInline
                                className="w-full max-h-80 object-contain"
                            />
                        </div>

                        {/* Metadata chips */}
                        <div className="flex justify-between items-center bg-card/60 px-4 py-3 border border-border/60 rounded-xl text-xs">
                            <div className="flex items-center gap-3">
                                <FileVideo className="size-4 text-muted-foreground" />
                                <span className="font-semibold text-foreground">
                                    {recorder.recording.name}.webm
                                </span>
                                <span className="text-muted-foreground/50">·</span>
                                <span className="bg-muted px-2 py-0.5 rounded font-medium text-muted-foreground">
                                    {formatDuration(
                                        Math.round(recorder.recording.durationMs / 1000)
                                    )}
                                </span>
                                <span className="bg-muted px-2 py-0.5 rounded font-medium text-muted-foreground">
                                    {formatBytes(recorder.recording.sizeBytes)}
                                </span>
                            </div>

                            <span className="font-medium text-emerald-500">
                                {recorder.recording.hasAudio
                                    ? '🔊 Stereo Audio Mixed'
                                    : '🔇 Video Only'}
                            </span>
                        </div>
                    </div>
                ) : isRecordingActive ? (
                    /* ══════════════════════════════════════════════════════════
                       ACTIVE RECORDING DASHBOARD
                       ══════════════════════════════════════════════════════════ */
                    <div className="flex flex-1 justify-center items-center p-8 text-center animate-in duration-200 fade-in">
                        <div className="flex flex-col items-center gap-5 bg-card/90 shadow-2xl backdrop-blur-xl p-8 border border-border/80 rounded-3xl max-w-sm">
                            <div className="flex justify-center items-center bg-red-500/10 rounded-full size-14 text-red-500">
                                <span className="bg-red-500 rounded-full size-4 recording-pulse" />
                            </div>

                            <div>
                                <h2 className="font-bold text-foreground text-lg tracking-tight">
                                    {recorder.status === 'paused'
                                        ? 'Recording Paused'
                                        : 'Recording in Progress'}
                                </h2>
                                <p className="mt-1 text-muted-foreground text-xs">
                                    The floating pill is on your screen. You can control this
                                    recording from any app.
                                </p>
                            </div>

                            <RecordingControls
                                status={recorder.status}
                                canStart={canStart}
                                elapsedSeconds={recorder.elapsedSeconds}
                                recording={recorder.recording}
                                onStart={handleStart}
                                onStop={recorder.stop}
                                onPause={recorder.pause}
                                onResume={recorder.resume}
                                onRestart={recorder.restart}
                                onCancel={recorder.cancel}
                                onReset={recorder.reset}
                                onDownload={handleDownload}
                            />
                        </div>
                    </div>
                ) : (
                    /* ══════════════════════════════════════════════════════════
                       LOOM STUDIO LAUNCHER (Pre-Recording Setup)
                       ══════════════════════════════════════════════════════════ */
                    <div className="flex flex-col flex-1 overflow-hidden">
                        {/* ── Studio Content (Scrollable if needed) ───────── */}
                        <div className="flex-1 px-6 py-4 overflow-y-auto">
                            <div className="flex flex-col gap-4 mx-auto max-w-4xl">
                                {/* Header */}
                                <div className="flex justify-between items-center pb-1">
                                    <div>
                                        <h1 className="font-extrabold text-foreground text-base tracking-tight">
                                            Recording Studio
                                        </h1>
                                        <p className="text-[11px] text-muted-foreground">
                                            Choose your screen source and audio preferences below.
                                        </p>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => void refresh()}
                                        disabled={isLoading || isRecordingActive}
                                        className="flex items-center gap-1.5 bg-card hover:bg-muted disabled:opacity-40 px-2.5 py-1 border border-border/60 rounded-lg font-semibold text-muted-foreground hover:text-foreground text-xs active:scale-95 transition-all"
                                    >
                                        <RefreshCw
                                            className={[
                                                'size-3',
                                                isLoading ? 'animate-spin' : ''
                                            ].join(' ')}
                                        />
                                        Refresh
                                    </button>
                                </div>

                                {/* Main 2-column Grid */}
                                <div className="gap-4 grid md:grid-cols-[1fr_320px]">
                                    {/* Left: Source Picker */}
                                    <div className="flex flex-col gap-3 bg-card/60 shadow-sm p-4 border border-border/70 rounded-2xl">
                                        <div className="flex justify-between items-center">
                                            <span className="font-bold text-[11px] text-muted-foreground uppercase tracking-wider">
                                                Capture Source
                                            </span>
                                        </div>

                                        {isLoading ? (
                                            <div className="flex justify-center items-center gap-3 bg-muted/20 rounded-xl h-44 text-muted-foreground text-xs">
                                                <Loader2 className="size-4 animate-spin" />
                                                Scanning screens & windows…
                                            </div>
                                        ) : sourcesError ? (
                                            <div className="flex items-start gap-2 bg-destructive/5 p-3 border border-destructive/20 rounded-xl text-destructive text-xs">
                                                <AlertCircle className="size-4 shrink-0" />
                                                {sourcesError}
                                            </div>
                                        ) : (
                                            <SourcePicker
                                                sources={sources}
                                                selectedSourceId={selectedSourceId}
                                                onSelect={setSelectedSourceId}
                                                disabled={isRecordingActive}
                                            />
                                        )}
                                    </div>

                                    {/* Right: Audio Deck */}
                                    <div className="flex flex-col gap-3 bg-card/60 shadow-sm p-4 border border-border/70 rounded-2xl">
                                        <span className="font-bold text-[11px] text-muted-foreground uppercase tracking-wider">
                                            Audio Settings
                                        </span>

                                        <AudioSettings
                                            micEnabled={micEnabled}
                                            micDeviceId={micDeviceId}
                                            micDevices={micDevices}
                                            canCaptureMicrophone={capabilities.canCaptureMicrophone}
                                            onMicEnabledChange={setMicEnabled}
                                            onMicDeviceChange={setMicDeviceId}
                                            sysAudioEnabled={sysAudioEnabled}
                                            sysAudioDeviceId={sysAudioDeviceId}
                                            sysAudioDevices={systemAudioDevices}
                                            canCaptureSystemAudio={
                                                capabilities.canCaptureSystemAudio
                                            }
                                            platform={capabilities.platform}
                                            onSysAudioEnabledChange={setSysAudioEnabled}
                                            onSysAudioDeviceChange={setSysAudioDeviceId}
                                            disabled={isRecordingActive}
                                            onRefreshDevices={() => void refreshDevices()}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ── Fixed Loom Bottom Action Dock ───────────────── */}
                        <footer className="bg-card/80 backdrop-blur-md px-6 py-3 border-border/50 border-t">
                            <div className="flex justify-between items-center mx-auto max-w-4xl">
                                {/* Helper pill info */}
                                <div className="flex items-center gap-2 text-muted-foreground text-xs">
                                    <span className="bg-primary rounded-full size-2 animate-pulse" />
                                    <span>
                                        <strong className="text-foreground">Loom Pill:</strong>{' '}
                                        Stays on top to Pause, Restart, or Finish anywhere.
                                    </span>
                                </div>

                                {/* Record Action Button */}
                                <div className="flex items-center gap-3">
                                    {recorder.error && (
                                        <div className="flex items-center gap-1.5 text-destructive text-xs">
                                            <AlertCircle className="size-3.5" />
                                            <span className="max-w-50 truncate">
                                                {recorder.error}
                                            </span>
                                        </div>
                                    )}

                                    <button
                                        type="button"
                                        onClick={handleStart}
                                        disabled={!canStart}
                                        className={[
                                            'group relative flex items-center justify-center gap-2.5 rounded-xl px-7 py-2.5 text-xs font-bold text-white shadow-md transition-all duration-200',
                                            canStart
                                                ? 'bg-linear-to-r from-indigo-600 via-violet-600 to-indigo-700 hover:from-indigo-500 hover:to-violet-500 shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:scale-[1.02] active:scale-[0.98]'
                                                : 'bg-muted text-muted-foreground shadow-none cursor-not-allowed opacity-50'
                                        ].join(' ')}
                                    >
                                        <span className="bg-red-400 group-hover:bg-red-300 rounded-full size-2 transition-colors animate-pulse" />
                                        <span>Start Recording</span>
                                    </button>
                                </div>
                            </div>
                        </footer>
                    </div>
                )}
            </div>
        </div>
    )
}

export default App
