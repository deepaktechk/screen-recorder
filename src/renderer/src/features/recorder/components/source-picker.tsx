import { useState } from 'react'
import type { CaptureSource } from '@shared/contracts/capture'
import { Monitor, AppWindow, Check } from 'lucide-react'

type SourcePickerProps = {
    sources: CaptureSource[]
    selectedSourceId: string | null
    onSelect: (sourceId: string) => void
    disabled?: boolean
}

export function SourcePicker({
    sources,
    selectedSourceId,
    onSelect,
    disabled = false
}: SourcePickerProps): React.JSX.Element {
    const screens = sources.filter((s) => s.type === 'screen')
    const windows = sources.filter((s) => s.type === 'window')

    const initialTab =
        sources.find((s) => s.id === selectedSourceId)?.type ??
        (screens.length > 0 ? 'screen' : 'window')
    const [tab, setTab] = useState<'screen' | 'window'>(initialTab)

    const activeList = tab === 'screen' ? screens : windows

    const handleTabChange = (newTab: 'screen' | 'window') => {
        setTab(newTab)
        const targetList = newTab === 'screen' ? screens : windows
        if (!targetList.some((s) => s.id === selectedSourceId) && targetList[0]) {
            onSelect(targetList[0].id)
        }
    }

    return (
        <div className="flex flex-col gap-4">
            {/* ── Mode Pill Switcher ──────────────────────────────────── */}
            <div className="flex items-center gap-1.5 rounded-xl bg-muted/50 p-1 border border-border/40 w-fit">
                <button
                    type="button"
                    disabled={disabled || screens.length === 0}
                    onClick={() => handleTabChange('screen')}
                    className={[
                        'flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all duration-200',
                        tab === 'screen'
                            ? 'bg-background text-foreground shadow-sm'
                            : 'text-muted-foreground hover:text-foreground'
                    ].join(' ')}
                >
                    <Monitor className="size-3.5" />
                    <span>Entire Screen</span>
                    <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-bold text-muted-foreground">
                        {screens.length}
                    </span>
                </button>

                <button
                    type="button"
                    disabled={disabled || windows.length === 0}
                    onClick={() => handleTabChange('window')}
                    className={[
                        'flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all duration-200',
                        tab === 'window'
                            ? 'bg-background text-foreground shadow-sm'
                            : 'text-muted-foreground hover:text-foreground'
                    ].join(' ')}
                >
                    <AppWindow className="size-3.5" />
                    <span>App Window</span>
                    <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-bold text-muted-foreground">
                        {windows.length}
                    </span>
                </button>
            </div>

            {/* ── Source Content Display ──────────────────────────────── */}
            {activeList.length === 0 ? (
                <div className="flex h-44 items-center justify-center rounded-2xl border border-dashed border-border/60 bg-muted/10 text-xs text-muted-foreground">
                    No {tab === 'screen' ? 'screens' : 'windows'} detected.
                </div>
            ) : tab === 'screen' && screens.length === 1 ? (
                /* ── Single Screen Featured Hero Card ─────────────────── */
                <div className="flex flex-col gap-2">
                    {screens.map((source) => {
                        const isSelected = source.id === selectedSourceId

                        return (
                            <button
                                key={source.id}
                                type="button"
                                disabled={disabled}
                                onClick={() => onSelect(source.id)}
                                aria-pressed={isSelected}
                                className={[
                                    'group relative flex flex-col gap-3 rounded-2xl border p-3 text-left transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50',
                                    'disabled:pointer-events-none disabled:opacity-50 max-w-md',
                                    isSelected
                                        ? 'border-primary bg-primary/[0.04] shadow-md shadow-primary/10 ring-2 ring-primary/20'
                                        : 'border-border/60 bg-card hover:border-primary/40 hover:bg-accent/20'
                                ].join(' ')}
                            >
                                <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-black/60 shadow-inner">
                                    <img
                                        src={source.thumbnailDataUrl}
                                        alt={source.name}
                                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                                        loading="lazy"
                                    />
                                    {isSelected && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-primary/20 backdrop-blur-[1px]">
                                            <div className="flex size-9 items-center justify-center rounded-full bg-primary text-white shadow-lg shadow-primary/40">
                                                <Check className="size-5" strokeWidth={2.5} />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-center justify-between px-1">
                                    <div className="flex items-center gap-2">
                                        <Monitor className="size-4 text-primary" />
                                        <span className="text-xs font-bold text-foreground">
                                            {source.name}
                                        </span>
                                    </div>
                                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                                        Primary Display
                                    </span>
                                </div>
                            </button>
                        )
                    })}
                </div>
            ) : (
                /* ── Multi-item Grid (Windows or Multi-Screen) ────────── */
                <div className="grid grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-1 sm:grid-cols-2 lg:grid-cols-3">
                    {activeList.map((source) => {
                        const isSelected = source.id === selectedSourceId

                        return (
                            <button
                                key={source.id}
                                type="button"
                                disabled={disabled}
                                onClick={() => onSelect(source.id)}
                                aria-pressed={isSelected}
                                className={[
                                    'group relative flex flex-col gap-2 rounded-2xl border p-2.5 text-left transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50',
                                    'disabled:pointer-events-none disabled:opacity-50',
                                    isSelected
                                        ? 'border-primary bg-primary/[0.04] shadow-sm ring-2 ring-primary/20'
                                        : 'border-border/60 bg-card hover:border-primary/40 hover:bg-accent/20'
                                ].join(' ')}
                            >
                                <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-black/50">
                                    <img
                                        src={source.thumbnailDataUrl}
                                        alt={source.name}
                                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                                        loading="lazy"
                                    />
                                    {isSelected && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-primary/20 backdrop-blur-[1px]">
                                            <div className="flex size-7 items-center justify-center rounded-full bg-primary text-white shadow-md shadow-primary/30">
                                                <Check className="size-4" strokeWidth={2.5} />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="px-1 pb-0.5">
                                    <p
                                        className={[
                                            'truncate text-xs font-semibold leading-tight',
                                            isSelected ? 'text-primary' : 'text-foreground'
                                        ].join(' ')}
                                        title={source.name}
                                    >
                                        {source.name}
                                    </p>
                                </div>
                            </button>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
