import { useEffect, useState } from 'react'
import { GripVertical, Pause, Play, Square, RotateCcw, Trash2 } from 'lucide-react'
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

    const sendAction = (action: RecorderAction): void => {
        void window.screenRecorder.widget.sendAction(action)
    }

    const isPaused = state.status === 'paused'

    return (
        <div className="flex justify-center items-center p-1 w-full h-full select-none">
            {/* ── Main Loom Pill ────────────────────────────────────────── */}
            <div
                className="group flex items-center gap-2 bg-neutral-900/95 shadow-[0_10px_30px_rgba(0,0,0,0.5)] backdrop-blur-2xl px-3 py-1.5 border border-white/15 rounded-full text-white transition-all"
                style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
            >
                {/* Drag handle */}
                <div
                    className="flex items-center text-white/40 hover:text-white/80 transition-colors cursor-grab active:cursor-grabbing"
                    title="Drag to reposition widget"
                >
                    <GripVertical className="size-3.5" />
                </div>

                {/* Status Dot & Elapsed Timer */}
                <div className="flex items-center gap-2 pr-1 font-mono font-semibold tabular-nums text-xs">
                    {isPaused ? (
                        <div className="flex items-center gap-1.5 text-amber-400">
                            <span className="bg-amber-400 rounded-full size-2" />
                            <span className="font-bold text-[10px] uppercase tracking-wider">
                                Paused
                            </span>
                            <span>{formatTimer(state.elapsedSeconds)}</span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-1.5 text-white">
                            <span className="bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)] rounded-full size-2 animate-pulse" />
                            <span>{formatTimer(state.elapsedSeconds)}</span>
                        </div>
                    )}
                </div>

                {/* Divider */}
                <div className="bg-white/15 w-[1px] h-4" />

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
                            className="flex justify-center items-center bg-amber-500/20 hover:bg-amber-500/30 rounded-full size-7 text-amber-300 hover:scale-105 active:scale-95 transition-all"
                            title="Resume recording"
                        >
                            <Play className="fill-current ml-0.5 size-3" />
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={() => sendAction('pause')}
                            className="flex justify-center items-center bg-white/10 hover:bg-white/20 rounded-full size-7 text-white/90 hover:text-white hover:scale-105 active:scale-95 transition-all"
                            title="Pause recording"
                        >
                            <Pause className="fill-current size-3" />
                        </button>
                    )}

                    {/* Finish / Stop Recording */}
                    <button
                        type="button"
                        onClick={() => sendAction('stop')}
                        className="relative flex justify-center items-center bg-red-600 hover:bg-red-500 shadow-[0_0_12px_rgba(220,38,38,0.5)] rounded-full size-7 text-white hover:scale-105 active:scale-95 transition-all"
                        title="Finish & Save recording"
                    >
                        <Square className="fill-current size-2.5" />
                    </button>

                    {/* Restart */}
                    <button
                        type="button"
                        onClick={() => sendAction('restart')}
                        className="flex justify-center items-center bg-white/10 hover:bg-white/20 rounded-full size-7 text-white/70 hover:text-white hover:scale-105 active:scale-95 transition-all"
                        title="Restart recording"
                    >
                        <RotateCcw className="size-3" />
                    </button>

                    {/* Cancel & Discard */}
                    <button
                        type="button"
                        onClick={() => sendAction('cancel')}
                        className="flex justify-center items-center bg-white/10 hover:bg-red-500/20 rounded-full size-7 text-white/50 hover:text-red-400 hover:scale-105 active:scale-95 transition-all"
                        title="Cancel & discard recording"
                    >
                        <Trash2 className="size-3" />
                    </button>
                </div>
            </div>
        </div>
    )
}
