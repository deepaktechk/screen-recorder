import { Video } from 'lucide-react'
import type { RecorderStatus } from '@shared/contracts/recording'

type RecordingPreviewProps = {
    previewUrl: string | null
    status: RecorderStatus
}

export function RecordingPreview({ previewUrl, status }: RecordingPreviewProps): React.JSX.Element {
    const isRecording = status === 'recording'
    const isBusy = status === 'requesting-permission' || status === 'stopping'

    if (previewUrl) {
        return (
            <div className="slide-up relative overflow-hidden rounded-2xl border border-border bg-black shadow-lg">
                <video
                    key={previewUrl}
                    src={previewUrl}
                    controls
                    playsInline
                    autoPlay={false}
                    className="aspect-video w-full object-contain"
                />
            </div>
        )
    }

    return (
        <div
            className={[
                'relative flex aspect-video w-full flex-col items-center justify-center gap-3',
                'overflow-hidden rounded-2xl border',
                isRecording
                    ? 'border-destructive/30 bg-destructive/5'
                    : isBusy
                      ? 'border-primary/30 bg-primary/5'
                      : 'border-dashed border-border bg-muted/10'
            ].join(' ')}
        >
            {/* Subtle grid background */}
            {!isRecording && !isBusy && (
                <div
                    className="pointer-events-none absolute inset-0 opacity-[0.03]"
                    style={{
                        backgroundImage:
                            'linear-gradient(var(--foreground) 1px, transparent 1px), linear-gradient(90deg, var(--foreground) 1px, transparent 1px)',
                        backgroundSize: '32px 32px'
                    }}
                />
            )}

            {isRecording ? (
                <>
                    <div className="flex items-center gap-2.5">
                        <span className="recording-pulse size-3.5 rounded-full bg-destructive" />
                        <span className="text-sm font-bold tracking-wide text-destructive">
                            RECORDING
                        </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Preview will be available after stopping
                    </p>
                </>
            ) : isBusy ? (
                <>
                    <div className="size-10 animate-spin rounded-full border-[3px] border-primary/20 border-t-primary" />
                    <p className="text-sm text-muted-foreground">
                        {status === 'requesting-permission'
                            ? 'Requesting permission…'
                            : 'Processing…'}
                    </p>
                </>
            ) : (
                <>
                    <div className="flex size-16 items-center justify-center rounded-2xl bg-muted/60 backdrop-blur-sm">
                        <Video className="size-7 text-muted-foreground/60" />
                    </div>
                    <div className="text-center">
                        <p className="text-sm font-medium text-muted-foreground">
                            No recording yet
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground/50">
                            Select a source and start recording
                        </p>
                    </div>
                </>
            )}
        </div>
    )
}
