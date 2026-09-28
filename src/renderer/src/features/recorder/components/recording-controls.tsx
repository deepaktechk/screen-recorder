import {
    Square,
    Circle,
    RotateCcw,
    Download,
    Loader2,
    Pause,
    Play,
    Trash2
} from 'lucide-react'
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
    const m = Math.floor((totalSeconds % 3600) / 60)
        .toString()
        .padStart(2, '0')
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
        <div className="flex flex-col items-center gap-4">
            {/* Recording badge */}
            {(isRecording || isPaused) && (
                <div
                    className={[
                        'fade-in flex items-center gap-2.5 rounded-full border px-4 py-2 shadow-sm',
                        isPaused
                            ? 'border-amber-500/20 bg-amber-500/10 text-amber-500'
                            : 'border-destructive/20 bg-destructive/8 text-destructive'
                    ].join(' ')}
                >
                    <span
                        className={[
                            'size-2.5 rounded-full',
                            isPaused ? 'bg-amber-500' : 'recording-pulse bg-destructive'
                        ].join(' ')}
                    />
                    <span className="font-mono text-sm font-bold tabular-nums">
                        {formatDuration(elapsedSeconds)}
                    </span>
                    <span
                        className={[
                            'rounded px-1.5 py-0.5 text-[10px] font-bold tracking-wider uppercase',
                            isPaused ? 'bg-amber-500/15' : 'bg-destructive/15'
                        ].join(' ')}
                    >
                        {isPaused ? 'PAUSED' : 'REC'}
                    </span>
                </div>
            )}

            {/* Status text */}
            {(isBusy || isCountingDown) && (
                <div className="fade-in flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="size-3.5 animate-spin" />
                    {status === 'requesting-permission'
                        ? 'Preparing screen capture…'
                        : isCountingDown
                          ? 'Starting in a moment…'
                          : 'Finalizing recording…'}
                </div>
            )}

            {/* Recording metadata */}
            {isReady && recording && (
                <div className="fade-in flex flex-wrap justify-center gap-x-3 gap-y-1 rounded-lg bg-muted/40 px-4 py-2">
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

            {/* Action buttons */}
            <div className="flex flex-wrap items-center justify-center gap-2.5">
                {isRecording || isPaused ? (
                    <>
                        {isPaused ? (
                            <ActionButton
                                variant="secondary"
                                icon={<Play className="size-3.5 fill-current ml-0.5" />}
                                onClick={onResume}
                            >
                                Resume
                            </ActionButton>
                        ) : (
                            <ActionButton
                                variant="secondary"
                                icon={<Pause className="size-3.5 fill-current" />}
                                onClick={onPause}
                            >
                                Pause
                            </ActionButton>
                        )}

                        <ActionButton
                            variant="destructive"
                            icon={<Square className="size-3.5" strokeWidth={2.5} />}
                            onClick={onStop}
                        >
                            Stop recording
                        </ActionButton>

                        <ActionButton
                            variant="ghost"
                            icon={<RotateCcw className="size-3" />}
                            onClick={onRestart}
                            title="Restart recording from beginning"
                        >
                            Restart
                        </ActionButton>

                        <ActionButton
                            variant="ghost"
                            icon={<Trash2 className="size-3 text-destructive" />}
                            onClick={onCancel}
                            title="Cancel and discard recording"
                        >
                            Cancel
                        </ActionButton>
                    </>
                ) : (
                    <ActionButton
                        variant={isError ? 'secondary' : 'primary'}
                        icon={
                            isBusy || isCountingDown ? (
                                <Loader2 className="size-3.5 animate-spin" />
                            ) : (
                                <Circle className="size-3.5 fill-current" strokeWidth={0} />
                            )
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
                            icon={<Download className="size-3.5" />}
                            onClick={onDownload}
                        >
                            Download
                        </ActionButton>
                        <ActionButton
                            variant="ghost"
                            icon={<RotateCcw className="size-3" />}
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

// ─── Internal button ──────────────────────────────────────────────────────────

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
    primary: [
        'bg-primary text-primary-foreground shadow-sm',
        'hover:bg-primary/90 active:bg-primary/80 active:scale-[0.98]'
    ].join(' '),
    destructive: [
        'bg-destructive/10 text-destructive border border-destructive/20',
        'hover:bg-destructive/20 active:bg-destructive/25 active:scale-[0.98]'
    ].join(' '),
    secondary: [
        'bg-secondary text-secondary-foreground border border-border',
        'hover:bg-accent active:scale-[0.98]'
    ].join(' '),
    ghost: [
        'text-muted-foreground border border-border/50',
        'hover:bg-muted hover:text-foreground active:scale-[0.98]'
    ].join(' ')
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
                'inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold',
                'transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
                'disabled:pointer-events-none disabled:opacity-50',
                variantClasses[variant]
            ].join(' ')}
        >
            {icon}
            {children}
        </button>
    )
}
