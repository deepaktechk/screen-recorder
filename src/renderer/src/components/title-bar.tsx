import { useEffect, useState } from 'react'
import {
    Minus,
    Square,
    Copy,
    X,
    ScreenShare,
    Sun,
    Moon,
    Monitor
} from 'lucide-react'

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

    const handleMinimize = () => {
        void window.screenRecorder?.window?.minimize()
    }

    const handleMaximize = () => {
        void window.screenRecorder?.window?.maximize()
    }

    const handleClose = () => {
        void window.screenRecorder?.window?.close()
    }

    const ThemeIcon =
        theme === 'system' ? Monitor : resolvedTheme === 'dark' ? Moon : Sun

    return (
        <header
            className="flex h-11 w-full select-none items-center justify-between border-b border-border/40 bg-card/60 px-3 backdrop-blur-xl"
            style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
        >
            {/* ── Brand Logo & Title ────────────────────────────────────── */}
            <div className="flex items-center gap-2.5 pl-1">
                <div className="flex size-6.5 items-center justify-center rounded-lg bg-gradient-to-tr from-primary to-indigo-500 shadow-sm shadow-primary/20">
                    <ScreenShare className="size-3.5 text-white" />
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-xs font-bold tracking-tight text-foreground">
                        Capturely
                    </span>
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[9px] font-bold tracking-wider uppercase text-primary">
                        Studio
                    </span>
                </div>
            </div>

            {/* ── Right: Theme Toggle & Window Controls ────────────────── */}
            <div
                className="flex items-center gap-1"
                style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
            >
                {platform && (
                    <span className="mr-2 rounded-md bg-muted/60 px-2 py-0.5 text-[10px] font-medium tracking-wide uppercase text-muted-foreground/70">
                        {platform}
                    </span>
                )}

                {/* Theme switch */}
                <button
                    type="button"
                    onClick={onCycleTheme}
                    className="flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    title={`Theme: ${theme}`}
                    aria-label="Switch theme"
                >
                    <ThemeIcon className="size-3.5" />
                </button>

                <div className="mx-1 h-3.5 w-[1px] bg-border/60" />

                {/* Minimize */}
                <button
                    type="button"
                    onClick={handleMinimize}
                    className="flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground active:scale-95"
                    title="Minimize"
                    aria-label="Minimize window"
                >
                    <Minus className="size-3.5" />
                </button>

                {/* Maximize / Restore */}
                <button
                    type="button"
                    onClick={handleMaximize}
                    className="flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground active:scale-95"
                    title={isMaximized ? 'Restore' : 'Maximize'}
                    aria-label={isMaximized ? 'Restore window' : 'Maximize window'}
                >
                    {isMaximized ? (
                        <Copy className="size-3 rotate-180" />
                    ) : (
                        <Square className="size-3" />
                    )}
                </button>

                {/* Close */}
                <button
                    type="button"
                    onClick={handleClose}
                    className="flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive hover:text-destructive-foreground active:scale-95"
                    title="Close"
                    aria-label="Close window"
                >
                    <X className="size-3.5" />
                </button>
            </div>
        </header>
    )
}
