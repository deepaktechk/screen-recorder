import { useEffect, useState } from 'react'
import { X } from 'lucide-react'

type CountdownOverlayProps = {
    count: number // 3, 2, 1
    onCancel: () => void
}

export function CountdownOverlay({ count, onCancel }: CountdownOverlayProps): React.JSX.Element {
    const [scaleKey, setScaleKey] = useState(count)

    useEffect(() => {
        setScaleKey(count)
    }, [count])

    return (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/60 backdrop-blur-md transition-all duration-300">
            {/* Outer animated rings */}
            <div className="relative flex items-center justify-center">
                <div className="absolute size-48 rounded-full border border-primary/30 animate-ping opacity-30" />
                <div className="absolute size-40 rounded-full border-2 border-primary/40 animate-pulse" />

                {/* Main counter circle */}
                <div
                    key={scaleKey}
                    className="relative flex size-32 items-center justify-center rounded-full bg-gradient-to-tr from-primary to-indigo-500 shadow-[0_0_50px_oklch(var(--primary)/40%)] animate-in zoom-in-50 duration-200"
                >
                    <span className="font-mono text-6xl font-black text-white select-none drop-shadow-md">
                        {count}
                    </span>
                </div>
            </div>

            <p className="mt-8 text-sm font-medium tracking-wide text-white/80 uppercase">
                Recording starts in…
            </p>

            {/* Cancel countdown button */}
            <button
                type="button"
                onClick={onCancel}
                className="mt-6 flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold text-white/90 backdrop-blur-md transition-all hover:bg-white/20 hover:text-white active:scale-95"
            >
                <X className="size-3.5" />
                Cancel (Esc)
            </button>
        </div>
    )
}
