import { useEffect, useState } from 'react'
import { Minus, Square, Copy, X, Video, Sun, Moon, Monitor } from 'lucide-react'

type TitleBarProps = {
    theme: 'light' | 'dark' | 'system'
    resolvedTheme: 'light' | 'dark'
    onCycleTheme: () => void
    platform?: string
}

export function TitleBar({
    theme,
    resolvedTheme,
    onCycleTheme,
    platform
}: TitleBarProps): React.JSX.Element {
    const [isMaximized, setIsMaximized] = useState(false)

    useEffect(() => {
        if (!window.screenRecorder?.window) return

        void window.screenRecorder.window.isMaximized().then(setIsMaximized)

        const unsubscribe = window.screenRecorder.window.onMaximizeChange?.((max) => {
            setIsMaximized(max)
        })

        return () => {
            unsubscribe?.()
        }
    }, [])

    const handleMinimize = (): void => {
        void window.screenRecorder?.window?.minimize()
    }

    const handleMaximize = (): void => {
        void window.screenRecorder?.window?.maximize()
    }

    const handleClose = (): void => {
        void window.screenRecorder?.window?.close()
    }

    const ThemeIcon = theme === 'system' ? Monitor : resolvedTheme === 'dark' ? Moon : Sun

    return (
        <header
            className="flex h-10 w-full shrink-0 select-none items-center justify-between border-b border-border/50 bg-card/70 px-3 backdrop-blur-xl"
            style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
        >
            {/* ── Brand ────────────────────────────────────────────────── */}
            <div className="flex items-center gap-2.5">
                <div className="flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br from-primary to-violet-500 shadow-sm">
                    <Video className="h-3 w-3 text-white" strokeWidth={2.5} />
                </div>
                <span className="text-[13px] font-semibold tracking-tight text-foreground">
                    Capturely
                </span>
                {platform && (
                    <span className="rounded bg-muted/80 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground/70">
                        {platform}
                    </span>
                )}
            </div>

            {/* ── Right Controls ───────────────────────────────────────── */}
            <div
                className="flex items-center gap-0.5"
                style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
            >
                {/* Theme toggle */}
                <button
                    type="button"
                    onClick={onCycleTheme}
                    className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    title={`Theme: ${theme}`}
                    aria-label="Switch theme"
                >
                    <ThemeIcon className="h-3.5 w-3.5" />
                </button>

                <div className="mx-1.5 h-3.5 w-px bg-border/60" />

                {/* Minimize */}
                <button
                    type="button"
                    onClick={handleMinimize}
                    className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground active:scale-95"
                    title="Minimize"
                    aria-label="Minimize window"
                >
                    <Minus className="h-3.5 w-3.5" />
                </button>

                {/* Maximize */}
                <button
                    type="button"
                    onClick={handleMaximize}
                    className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground active:scale-95"
                    title={isMaximized ? 'Restore' : 'Maximize'}
                    aria-label={isMaximized ? 'Restore window' : 'Maximize window'}
                >
                    {isMaximized ? (
                        <Copy className="h-3 w-3 rotate-180" />
                    ) : (
                        <Square className="h-3 w-3" />
                    )}
                </button>

                {/* Close */}
                <button
                    type="button"
                    onClick={handleClose}
                    className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/80 hover:text-white active:scale-95"
                    title="Close"
                    aria-label="Close window"
                >
                    <X className="h-3.5 w-3.5" />
                </button>
            </div>
        </header>
    )
}
