import { useState, useCallback, useEffect } from 'react'
import {
    RefreshCw,
    AlertCircle,
    Loader2,
    Download,
    RotateCcw,
    CheckCircle2,
    FileVideo,
    Video
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
    const m = Math.floor(totalSeconds / 60).toString().padStart(2, '0')
    const s = (totalSeconds % 60).toString().padStart(2, '0')
    return `${m}:${s}`
}

function formatBytes(bytes: number): string {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

const App = (): React.JSX.Element => {
    const { theme, resolved, cycle } = useTheme()

    const [micEnabled, setMicEnabled] = useState(false)
    const [micDeviceId, setMicDeviceId] = useState('default')
    const [sysAudioEnabled, setSysAudioEnabled] = useState(true)
    const [sysAudioDeviceId, setSysAudioDeviceId] = useState('auto')

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

    useEffect(() => {
        if (recorder.countdown <= 0) return
        const onKeyDown = (e: KeyboardEvent): void => {
            if (e.key === 'Escape') recorder.cancelCountdown()
        }
        window.addEventListener('keydown', onKeyDown)
        return () => window.removeEventListener('keydown', onKeyDown)
    }, [recorder])

    const canStart = Boolean(selectedSourceId) && !isLoading && !isRecordingActive

    return (
        <div
            className="flex h-screen w-screen flex-col overflow-hidden bg-background select-none"
            style={{ borderRadius: 'inherit' }}
        >
            {/* ── Title Bar ──────────────────────────────────────────────── */}
            <TitleBar
                theme={theme}
                resolvedTheme={resolved}
                onCycleTheme={cycle}
                platform={capabilities.platform}
            />

            {/* ── Countdown Overlay ──────────────────────────────────────── */}
            {recorder.countdown > 0 && (
                <CountdownOverlay count={recorder.countdown} onCancel={recorder.cancelCountdown} />
            )}

            {/* ── Main Content ───────────────────────────────────────────── */}
            <div className="flex flex-1 flex-col overflow-hidden">

                {recorder.status === 'ready' && recorder.recording ? (
                    /* ════════════════════════════════════════════════════════
                       REVIEW SUITE
                    ════════════════════════════════════════════════════════ */
                    <div className="flex flex-1 flex-col overflow-y-auto" style={{ padding: '20px 24px' }}>
                        <div className="mx-auto flex w-full max-w-2xl flex-col" style={{ gap: '16px' }}>

                            {/* Review header */}
                            <div
                                className="flex items-center justify-between border-b border-border/40"
                                style={{ paddingBottom: '14px' }}
                            >
                                <div className="flex items-center" style={{ gap: '10px' }}>
                                    <div
                                        className="flex items-center justify-center rounded-xl bg-emerald-500/12 text-emerald-500"
                                        style={{ width: '36px', height: '36px' }}
                                    >
                                        <CheckCircle2 className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <h2 className="text-sm font-semibold text-foreground">
                                            Recording complete
                                        </h2>
                                        <p className="text-[11px] text-muted-foreground" style={{ marginTop: '1px' }}>
                                            Review your capture or save it locally.
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center" style={{ gap: '8px' }}>
                                    <button
                                        type="button"
                                        onClick={recorder.reset}
                                        className="flex items-center rounded-lg border border-border bg-card text-xs font-medium text-foreground transition-colors hover:bg-muted active:scale-95"
                                        style={{ gap: '6px', paddingBlock: '7px', paddingInline: '12px' }}
                                    >
                                        <RotateCcw className="h-3.5 w-3.5" />
                                        New recording
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleDownload}
                                        className="flex items-center rounded-lg bg-primary text-xs font-semibold text-white shadow-sm transition-all hover:bg-primary/90 active:scale-95"
                                        style={{ gap: '6px', paddingBlock: '7px', paddingInline: '14px' }}
                                    >
                                        <Download className="h-3.5 w-3.5" />
                                        Download
                                    </button>
                                </div>
                            </div>

                            {/* Video player */}
                            <div className="overflow-hidden rounded-2xl border border-border/60 bg-black shadow-lg">
                                <video
                                    src={recorder.previewUrl || undefined}
                                    controls
                                    autoPlay
                                    playsInline
                                    className="w-full max-h-72 object-contain"
                                />
                            </div>

                            {/* Metadata strip */}
                            <div
                                className="flex items-center justify-between rounded-xl border border-border/50 bg-card/60"
                                style={{ paddingBlock: '10px', paddingInline: '14px' }}
                            >
                                <div className="flex items-center" style={{ gap: '10px' }}>
                                    <FileVideo className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-xs font-semibold text-foreground">
                                        {recorder.recording.name}.webm
                                    </span>
                                    <span className="text-muted-foreground/40">·</span>
                                    <span
                                        className="rounded bg-muted text-xs font-medium text-muted-foreground"
                                        style={{ paddingBlock: '2px', paddingInline: '7px' }}
                                    >
                                        {formatDuration(Math.round(recorder.recording.durationMs / 1000))}
                                    </span>
                                    <span
                                        className="rounded bg-muted text-xs font-medium text-muted-foreground"
                                        style={{ paddingBlock: '2px', paddingInline: '7px' }}
                                    >
                                        {formatBytes(recorder.recording.sizeBytes)}
                                    </span>
                                </div>
                                <span className="text-xs font-medium text-emerald-500">
                                    {recorder.recording.hasAudio ? '🔊 Audio' : '🔇 Video only'}
                                </span>
                            </div>
                        </div>
                    </div>

                ) : isRecordingActive ? (
                    /* ════════════════════════════════════════════════════════
                       RECORDING ACTIVE
                    ════════════════════════════════════════════════════════ */
                    <div className="flex flex-1 items-center justify-center" style={{ padding: '32px' }}>
                        <div
                            className="fade-in flex flex-col items-center rounded-2xl border border-border/60 bg-card shadow-xl backdrop-blur-xl"
                            style={{ padding: '32px 28px', gap: '20px', maxWidth: '340px', width: '100%' }}
                        >
                            {/* Status indicator */}
                            <div
                                className="flex items-center justify-center rounded-full bg-red-500/10"
                                style={{ width: '56px', height: '56px' }}
                            >
                                <span className="recording-pulse block h-4 w-4 rounded-full bg-red-500" />
                            </div>

                            <div className="text-center">
                                <h2 className="text-base font-semibold tracking-tight text-foreground">
                                    {recorder.status === 'paused'
                                        ? 'Recording paused'
                                        : 'Recording in progress'}
                                </h2>
                                <p className="text-xs text-muted-foreground" style={{ marginTop: '5px' }}>
                                    Control your recording from the floating pill on screen.
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
                    /* ════════════════════════════════════════════════════════
                       SETUP / LAUNCHER
                    ════════════════════════════════════════════════════════ */
                    <div className="flex flex-1 flex-col overflow-hidden">
                        {/* Scrollable body */}
                        <div className="flex-1 overflow-y-auto" style={{ padding: '18px 20px' }}>
                            <div className="mx-auto flex max-w-4xl flex-col" style={{ gap: '14px' }}>

                                {/* Section heading row */}
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h1 className="text-sm font-semibold text-foreground">
                                            New Recording
                                        </h1>
                                        <p
                                            className="text-muted-foreground"
                                            style={{ marginTop: '2px', fontSize: '11px' }}
                                        >
                                            Choose a source and configure audio below.
                                        </p>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => void refresh()}
                                        disabled={isLoading || isRecordingActive}
                                        className="flex items-center rounded-lg border border-border/60 bg-card text-xs font-medium text-muted-foreground transition-all hover:bg-muted hover:text-foreground disabled:opacity-40 active:scale-95"
                                        style={{ gap: '5px', paddingBlock: '6px', paddingInline: '10px' }}
                                    >
                                        <RefreshCw
                                            className={['h-3 w-3', isLoading ? 'animate-spin' : ''].join(' ')}
                                        />
                                        Refresh
                                    </button>
                                </div>

                                {/* Two-column layout */}
                                <div className="grid md:grid-cols-[1fr_300px]" style={{ gap: '12px' }}>
                                    {/* Left: Source Picker */}
                                    <div
                                        className="flex flex-col rounded-xl border border-border/60 bg-card/60 shadow-sm"
                                        style={{ padding: '14px', gap: '10px' }}
                                    >
                                        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                                            Capture Source
                                        </span>

                                        {isLoading ? (
                                            <div
                                                className="flex items-center justify-center rounded-xl bg-muted/20 text-xs text-muted-foreground"
                                                style={{ height: '160px', gap: '8px' }}
                                            >
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                Scanning screens & windows…
                                            </div>
                                        ) : sourcesError ? (
                                            <div
                                                className="flex items-start rounded-xl border border-destructive/20 bg-destructive/5 text-xs text-destructive"
                                                style={{ gap: '8px', padding: '10px' }}
                                            >
                                                <AlertCircle className="h-4 w-4 shrink-0" />
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

                                    {/* Right: Audio Settings */}
                                    <div
                                        className="flex flex-col rounded-xl border border-border/60 bg-card/60 shadow-sm"
                                        style={{ padding: '14px', gap: '10px' }}
                                    >
                                        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                                            Audio
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
                                            canCaptureSystemAudio={capabilities.canCaptureSystemAudio}
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

                        {/* ── Bottom Action Bar ───────────────────────────── */}
                        <footer
                            className="shrink-0 border-t border-border/50 bg-card/70 backdrop-blur-md"
                            style={{ padding: '12px 20px' }}
                        >
                            <div
                                className="mx-auto flex max-w-4xl items-center justify-between"
                            >
                                {/* Loom pill hint */}
                                <div className="flex items-center text-xs text-muted-foreground" style={{ gap: '7px' }}>
                                    <Video className="h-3.5 w-3.5 text-primary/70" />
                                    <span>
                                        A <strong className="text-foreground font-medium">floating pill</strong> will appear during recording.
                                    </span>
                                </div>

                                {/* Right: error + record button */}
                                <div className="flex items-center" style={{ gap: '10px' }}>
                                    {recorder.error && (
                                        <div
                                            className="flex items-center text-xs text-destructive"
                                            style={{ gap: '5px' }}
                                        >
                                            <AlertCircle className="h-3.5 w-3.5" />
                                            <span className="max-w-[180px] truncate">{recorder.error}</span>
                                        </div>
                                    )}

                                    <button
                                        type="button"
                                        onClick={handleStart}
                                        disabled={!canStart}
                                        className={[
                                            'flex items-center rounded-xl text-xs font-semibold text-white',
                                            'transition-all duration-200 focus:outline-none',
                                            'focus-visible:ring-2 focus-visible:ring-primary/50',
                                            canStart
                                                ? 'bg-primary shadow-sm hover:bg-primary/90 hover:shadow-md hover:shadow-primary/20 active:scale-[0.97]'
                                                : 'cursor-not-allowed bg-muted text-muted-foreground shadow-none opacity-50'
                                        ].join(' ')}
                                        style={{ gap: '8px', paddingBlock: '9px', paddingInline: '20px' }}
                                    >
                                        <span
                                            className={[
                                                'block h-2 w-2 rounded-full',
                                                canStart ? 'bg-white/70' : 'bg-current'
                                            ].join(' ')}
                                        />
                                        Start Recording
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
