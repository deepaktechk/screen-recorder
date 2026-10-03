import { Square, Circle, RotateCcw, Download, Loader2, Pause, Play, Trash2 } from 'lucide-react'
import type { RecorderStatus, Recording } from '@shared/contracts/recording'

type RecordingControlsProps = {
    status: RecorderStatus
    canStart: boolean
    elapsedSeconds: number
    recording: Recording | null
    onStart: () => void
    onStop: () => void
    onPause: () => void
    onResume: () => void
    onRestart: () => void
    onCancel: () => void
    onReset: () => void
    onDownload: () => void
}

function formatDuration(totalSeconds: number): string {
    const h = Math.floor(totalSeconds / 3600)
    const m = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0')
    const s = (totalSeconds % 60).toString().padStart(2, '0')
    return h > 0 ? `${h}:${m}:${s}` : `${m}:${s}`
}

function formatBytes(bytes: number): string {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

export function RecordingControls({
    status,
    canStart,
    elapsedSeconds,
    recording,
    onStart,
    onStop,
    onPause,
    onResume,
    onRestart,
    onCancel,
    onReset,
    onDownload
}: RecordingControlsProps): React.JSX.Element {
    const isRecording = status === 'recording'
    const isPaused = status === 'paused'
    const isBusy = status === 'requesting-permission' || status === 'stopping'
    const isCountingDown = status === 'countdown'
    const isReady = status === 'ready'
    const isError = status === 'error'

    return (
        <div className="flex w-full flex-col items-center" style={{ gap: '16px' }}>
            {/* ── Timer badge ──────────────────────────────────────────── */}
            {(isRecording || isPaused) && (
                <div
                    className={[
                        'fade-in flex items-center rounded-full border',
                        isPaused
                            ? 'border-amber-500/20 bg-amber-500/10 text-amber-400'
                            : 'border-red-500/20 bg-red-500/10 text-red-400'
                    ].join(' ')}
                    style={{ gap: '8px', paddingBlock: '7px', paddingInline: '16px' }}
                >
                    <span
                        className={[
                            'block h-2.5 w-2.5 rounded-full',
                            isPaused ? 'bg-amber-400' : 'recording-pulse bg-red-500'
                        ].join(' ')}
                    />
                    <span className="font-mono text-sm font-bold tabular-nums">
                        {formatDuration(elapsedSeconds)}
                    </span>
                    <span
                        className={[
                            'rounded text-[10px] font-bold uppercase tracking-wider',
                            isPaused ? 'bg-amber-500/15' : 'bg-red-500/15'
                        ].join(' ')}
                        style={{ paddingBlock: '2px', paddingInline: '6px' }}
                    >
                        {isPaused ? 'PAUSED' : 'REC'}
                    </span>
                </div>
            )}

            {/* ── Busy state ───────────────────────────────────────────── */}
            {(isBusy || isCountingDown) && (
                <div
                    className="fade-in flex items-center text-sm text-muted-foreground"
                    style={{ gap: '7px' }}
                >
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    {status === 'requesting-permission'
                        ? 'Preparing screen capture…'
                        : isCountingDown
                          ? 'Starting in a moment…'
                          : 'Finalising recording…'}
                </div>
            )}

            {/* ── Metadata (after stop) ────────────────────────────────── */}
            {isReady && recording && (
                <div
                    className="fade-in flex flex-wrap items-center justify-center rounded-lg bg-muted/40"
                    style={{ gap: '6px', paddingBlock: '7px', paddingInline: '16px' }}
                >
                    <span className="text-xs font-medium text-foreground">
                        {formatDuration(Math.round(recording.durationMs / 1000))}
                    </span>
                    <span className="text-xs text-muted-foreground">·</span>
                    <span className="text-xs font-medium text-foreground">
                        {formatBytes(recording.sizeBytes)}
                    </span>
                    <span className="text-xs text-muted-foreground">·</span>
                    <span className="text-xs text-muted-foreground">
                        {recording.hasAudio ? '🔊 Audio included' : '🔇 Video only'}
                    </span>
                </div>
            )}

            {/* ── Action buttons ───────────────────────────────────────── */}
            <div
                className="flex flex-wrap items-center justify-center"
                style={{ gap: '8px' }}
            >
                {isRecording || isPaused ? (
                    <>
                        {isPaused ? (
                            <ActionButton
                                variant="secondary"
                                icon={<Play className="h-3.5 w-3.5 fill-current" style={{ marginLeft: '2px' }} />}
                                onClick={onResume}
                            >
                                Resume
                            </ActionButton>
                        ) : (
                            <ActionButton
                                variant="secondary"
                                icon={<Pause className="h-3.5 w-3.5 fill-current" />}
                                onClick={onPause}
                            >
                                Pause
                            </ActionButton>
                        )}

                        <ActionButton
                            variant="destructive"
                            icon={<Square className="h-3.5 w-3.5" strokeWidth={2.5} />}
                            onClick={onStop}
                        >
                            Stop
                        </ActionButton>

                        <ActionButton
                            variant="ghost"
                            icon={<RotateCcw className="h-3 w-3" />}
                            onClick={onRestart}
                            title="Restart from beginning"
                        >
                            Restart
                        </ActionButton>

                        <ActionButton
                            variant="ghost"
                            icon={<Trash2 className="h-3 w-3 text-destructive" />}
                            onClick={onCancel}
                            title="Cancel and discard"
                        >
                            Cancel
                        </ActionButton>
                    </>
                ) : (
                    <ActionButton
                        variant={isError ? 'secondary' : 'primary'}
                        icon={
                            isBusy || isCountingDown
                                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                : <Circle className="h-3.5 w-3.5 fill-current" strokeWidth={0} />
                        }
                        onClick={onStart}
                        disabled={!canStart || isBusy || isCountingDown}
                    >
                        {isBusy
                            ? 'Starting…'
                            : isCountingDown
                              ? 'Counting down…'
                              : isError
                                ? 'Retry'
                                : 'Start recording'}
                    </ActionButton>
                )}

                {isReady && (
                    <>
                        <ActionButton
                            variant="primary"
                            icon={<Download className="h-3.5 w-3.5" />}
                            onClick={onDownload}
                        >
                            Download
                        </ActionButton>
                        <ActionButton
                            variant="ghost"
                            icon={<RotateCcw className="h-3 w-3" />}
                            onClick={onReset}
                        >
                            Discard
                        </ActionButton>
                    </>
                )}
            </div>
        </div>
    )
}

/* ── ActionButton ──────────────────────────────────────────────────────── */

type ActionButtonVariant = 'primary' | 'destructive' | 'secondary' | 'ghost'

type ActionButtonProps = {
    variant: ActionButtonVariant
    icon?: React.ReactNode
    onClick: () => void
    disabled?: boolean
    title?: string
    children: React.ReactNode
}

const variantClasses: Record<ActionButtonVariant, string> = {
    primary: 'bg-primary text-white shadow-sm hover:bg-primary/90 active:bg-primary/80',
    destructive: 'bg-destructive/10 text-destructive border border-destructive/20 hover:bg-destructive/20',
    secondary: 'bg-secondary text-secondary-foreground border border-border hover:bg-accent',
    ghost: 'text-muted-foreground border border-border/50 hover:bg-muted hover:text-foreground'
}

function ActionButton({
    variant,
    icon,
    onClick,
    disabled = false,
    title,
    children
}: ActionButtonProps): React.JSX.Element {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            title={title}
            className={[
                'inline-flex items-center rounded-lg text-xs font-semibold',
                'transition-all duration-150 focus:outline-none',
                'focus-visible:ring-2 focus-visible:ring-ring/50',
                'active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50',
                variantClasses[variant]
            ].join(' ')}
            style={{ gap: '6px', paddingBlock: '8px', paddingInline: '14px' }}
        >
            {icon}
            {children}
        </button>
    )
}
