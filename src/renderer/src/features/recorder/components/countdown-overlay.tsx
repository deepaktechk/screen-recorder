import { useEffect, useState } from 'react'
import { X } from 'lucide-react'

type CountdownOverlayProps = {
    count: number
    onCancel: () => void
}

export function CountdownOverlay({ count, onCancel }: CountdownOverlayProps): React.JSX.Element {
    const [scaleKey, setScaleKey] = useState(count)

    useEffect(() => {
        setScaleKey(count)
    }, [count])

    return (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/65 backdrop-blur-md">
            {/* Animated rings */}
            <div className="relative flex items-center justify-center">
                <div className="absolute h-48 w-48 rounded-full border border-primary/25 animate-ping opacity-25" />
                <div className="absolute h-40 w-40 rounded-full border-2 border-primary/35 animate-pulse" />

                {/* Counter */}
                <div
                    key={scaleKey}
                    className="relative flex items-center justify-center rounded-full bg-gradient-to-br from-primary to-violet-500 animate-in zoom-in-75 duration-200"
                    style={{ width: '120px', height: '120px', boxShadow: '0 0 60px oklch(0.64 0.20 265 / 35%)' }}
                >
                    <span className="select-none font-mono text-6xl font-black text-white drop-shadow">
                        {count}
                    </span>
                </div>
            </div>

            <p
                className="text-[11px] font-medium uppercase tracking-widest text-white/70"
                style={{ marginTop: '28px' }}
            >
                Recording starts in…
            </p>

            <button
                type="button"
                onClick={onCancel}
                className="flex items-center rounded-full border border-white/20 bg-white/10 text-xs font-medium text-white/80 backdrop-blur-md transition-all hover:bg-white/20 hover:text-white active:scale-95"
                style={{ marginTop: '20px', gap: '6px', paddingBlock: '8px', paddingInline: '16px' }}
            >
                <X className="h-3.5 w-3.5" />
                Cancel (Esc)
            </button>
        </div>
    )
}
