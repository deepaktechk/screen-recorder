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

    const handleTabChange = (newTab: 'screen' | 'window'): void => {
        setTab(newTab)
        const targetList = newTab === 'screen' ? screens : windows
        if (!targetList.some((s) => s.id === selectedSourceId) && targetList[0]) {
            onSelect(targetList[0].id)
        }
    }

    return (
        <div className="flex flex-col gap-4">
            {/* ── Mode Pill Switcher ──────────────────────────────────── */}
            <div className="flex items-center gap-1.5 bg-muted/50 p-1 border border-border/40 rounded-xl w-fit">
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
                    <span className="bg-muted px-1.5 py-0.5 rounded-md font-bold text-[10px] text-muted-foreground">
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
                    <span className="bg-muted px-1.5 py-0.5 rounded-md font-bold text-[10px] text-muted-foreground">
                        {windows.length}
                    </span>
                </button>
            </div>

            {/* ── Source Content Display ──────────────────────────────── */}
            {activeList.length === 0 ? (
                <div className="flex justify-center items-center bg-muted/10 border border-border/60 border-dashed rounded-2xl h-44 text-muted-foreground text-xs">
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
                                        ? 'border-primary bg-primary/4 shadow-md shadow-primary/10 ring-2 ring-primary/20'
                                        : 'border-border/60 bg-card hover:border-primary/40 hover:bg-accent/20'
                                ].join(' ')}
                            >
                                <div className="relative bg-black/60 shadow-inner rounded-xl w-full aspect-video overflow-hidden">
                                    <img
                                        src={source.thumbnailDataUrl}
                                        alt={source.name}
                                        className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
                                        loading="lazy"
                                    />
                                    {isSelected && (
                                        <div className="absolute inset-0 flex justify-center items-center bg-primary/20 backdrop-blur-[1px]">
                                            <div className="flex justify-center items-center bg-primary shadow-lg shadow-primary/40 rounded-full size-9 text-white">
                                                <Check className="size-5" strokeWidth={2.5} />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="flex justify-between items-center px-1">
                                    <div className="flex items-center gap-2">
                                        <Monitor className="size-4 text-primary" />
                                        <span className="font-bold text-foreground text-xs">
                                            {source.name}
                                        </span>
                                    </div>
                                    <span className="bg-primary/10 px-2 py-0.5 rounded-full font-bold text-[10px] text-primary">
                                        Primary Display
                                    </span>
                                </div>
                            </button>
                        )
                    })}
                </div>
            ) : (
                /* ── Multi-item Grid (Windows or Multi-Screen) ────────── */
                <div className="gap-3 grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 pr-1 max-h-75 overflow-y-auto">
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
                                        ? 'border-primary bg-primary/4 shadow-sm ring-2 ring-primary/20'
                                        : 'border-border/60 bg-card hover:border-primary/40 hover:bg-accent/20'
                                ].join(' ')}
                            >
                                <div className="relative bg-black/50 rounded-xl w-full aspect-video overflow-hidden">
                                    <img
                                        src={source.thumbnailDataUrl}
                                        alt={source.name}
                                        className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
                                        loading="lazy"
                                    />
                                    {isSelected && (
                                        <div className="absolute inset-0 flex justify-center items-center bg-primary/20 backdrop-blur-[1px]">
                                            <div className="flex justify-center items-center bg-primary shadow-md shadow-primary/30 rounded-full size-7 text-white">
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
