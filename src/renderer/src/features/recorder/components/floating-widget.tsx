import { useEffect, useState } from 'react'
import {
    GripVertical,
    Pause,
    Play,
    Square,
    RotateCcw,
    Trash2
} from 'lucide-react'
import type { RecorderAction, WidgetState } from '@shared/contracts/ipc'

function formatTimer(totalSeconds: number): string {
    const m = Math.floor(totalSeconds / 60)
        .toString()
        .padStart(2, '0')
    const s = (totalSeconds % 60).toString().padStart(2, '0')
    return `${m}:${s}`
}

export function FloatingWidget(): React.JSX.Element {
    const [state, setState] = useState<WidgetState>({
        status: 'recording',
        elapsedSeconds: 0
    })

    useEffect(() => {
        // Apply widget body styling so transparent window renders properly
        document.body.classList.add('widget-mode')
        document.documentElement.classList.add('widget-mode')

        const unsubscribe = window.screenRecorder.widget.onStateUpdate((newState) => {
            setState(newState)
        })

        return () => {
            unsubscribe()
            document.body.classList.remove('widget-mode')
            document.documentElement.classList.remove('widget-mode')
        }
    }, [])

    const sendAction = (action: RecorderAction) => {
        void window.screenRecorder.widget.sendAction(action)
    }

    const isPaused = state.status === 'paused'

    return (
        <div className="flex h-full w-full items-center justify-center p-1 select-none">
            {/* ── Main Loom Pill ────────────────────────────────────────── */}
            <div
                className="group flex items-center gap-2 rounded-full border border-white/15 bg-neutral-900/95 px-3 py-1.5 text-white shadow-[0_10px_30px_rgba(0,0,0,0.5)] backdrop-blur-2xl transition-all"
                style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
            >
                {/* Drag handle */}
                <div
                    className="flex cursor-grab items-center text-white/40 transition-colors hover:text-white/80 active:cursor-grabbing"
                    title="Drag to reposition widget"
                >
                    <GripVertical className="size-3.5" />
                </div>

                {/* Status Dot & Elapsed Timer */}
                <div className="flex items-center gap-2 pr-1 font-mono text-xs font-semibold tabular-nums">
                    {isPaused ? (
                        <div className="flex items-center gap-1.5 text-amber-400">
                            <span className="size-2 rounded-full bg-amber-400" />
                            <span className="text-[10px] font-bold tracking-wider uppercase">Paused</span>
                            <span>{formatTimer(state.elapsedSeconds)}</span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-1.5 text-white">
                            <span className="size-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
                            <span>{formatTimer(state.elapsedSeconds)}</span>
                        </div>
                    )}
                </div>

                {/* Divider */}
                <div className="h-4 w-[1px] bg-white/15" />

                {/* ── Control Actions ──────────────────────────────────── */}
                <div
                    className="flex items-center gap-1"
                    style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
                >
                    {/* Pause / Resume */}
                    {isPaused ? (
                        <button
                            type="button"
                            onClick={() => sendAction('resume')}
                            className="flex size-7 items-center justify-center rounded-full bg-amber-500/20 text-amber-300 transition-all hover:bg-amber-500/30 hover:scale-105 active:scale-95"
                            title="Resume recording"
                        >
                            <Play className="size-3 fill-current ml-0.5" />
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={() => sendAction('pause')}
                            className="flex size-7 items-center justify-center rounded-full bg-white/10 text-white/90 transition-all hover:bg-white/20 hover:text-white hover:scale-105 active:scale-95"
                            title="Pause recording"
                        >
                            <Pause className="size-3 fill-current" />
                        </button>
                    )}

                    {/* Finish / Stop Recording */}
                    <button
                        type="button"
                        onClick={() => sendAction('stop')}
                        className="relative flex size-7 items-center justify-center rounded-full bg-red-600 text-white shadow-[0_0_12px_rgba(220,38,38,0.5)] transition-all hover:bg-red-500 hover:scale-105 active:scale-95"
                        title="Finish & Save recording"
                    >
                        <Square className="size-2.5 fill-current" />
                    </button>

                    {/* Restart */}
                    <button
                        type="button"
                        onClick={() => sendAction('restart')}
                        className="flex size-7 items-center justify-center rounded-full bg-white/10 text-white/70 transition-all hover:bg-white/20 hover:text-white hover:scale-105 active:scale-95"
                        title="Restart recording"
                    >
                        <RotateCcw className="size-3" />
                    </button>

                    {/* Cancel & Discard */}
                    <button
                        type="button"
                        onClick={() => sendAction('cancel')}
                        className="flex size-7 items-center justify-center rounded-full bg-white/10 text-white/50 transition-all hover:bg-red-500/20 hover:text-red-400 hover:scale-105 active:scale-95"
                        title="Cancel & discard recording"
                    >
                        <Trash2 className="size-3" />
                    </button>
                </div>
            </div>
        </div>
    )
}
