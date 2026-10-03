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
        <div className="flex flex-col" style={{ gap: '14px' }}>
            {/* ── Tab Switcher ─────────────────────────────────────────── */}
            <div
                className="flex w-fit items-center rounded-xl border border-border/50 bg-muted/40"
                style={{ padding: '3px', gap: '2px' }}
            >
                <TabButton
                    active={tab === 'screen'}
                    disabled={disabled || screens.length === 0}
                    onClick={() => handleTabChange('screen')}
                    icon={<Monitor className="h-3.5 w-3.5" />}
                    label="Entire Screen"
                    count={screens.length}
                />
                <TabButton
                    active={tab === 'window'}
                    disabled={disabled || windows.length === 0}
                    onClick={() => handleTabChange('window')}
                    icon={<AppWindow className="h-3.5 w-3.5" />}
                    label="App Window"
                    count={windows.length}
                />
            </div>

            {/* ── Source List ───────────────────────────────────────────── */}
            {activeList.length === 0 ? (
                <div
                    className="flex h-40 items-center justify-center rounded-2xl border border-dashed border-border/60 bg-muted/10 text-xs text-muted-foreground"
                >
                    No {tab === 'screen' ? 'screens' : 'windows'} detected.
                </div>
            ) : tab === 'screen' && screens.length === 1 ? (
                /* ── Single screen: large hero card ───────────────────── */
                <div className="flex flex-col" style={{ gap: '8px' }}>
                    {screens.map((source) => {
                        const isSelected = source.id === selectedSourceId
                        return (
                            <SourceCard
                                key={source.id}
                                source={source}
                                isSelected={isSelected}
                                disabled={disabled}
                                onSelect={onSelect}
                                badge="Primary Display"
                                badgeIcon={<Monitor className="h-3.5 w-3.5 text-primary" />}
                                large
                            />
                        )
                    })}
                </div>
            ) : (
                /* ── Grid: multi-screen or windows ────────────────────── */
                <div
                    className="grid grid-cols-2 overflow-y-auto pr-0.5 lg:grid-cols-3"
                    style={{ gap: '10px', maxHeight: '300px' }}
                >
                    {activeList.map((source) => (
                        <SourceCard
                            key={source.id}
                            source={source}
                            isSelected={source.id === selectedSourceId}
                            disabled={disabled}
                            onSelect={onSelect}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}

/* ── TabButton ─────────────────────────────────────────────────────────── */

function TabButton({
    active,
    disabled,
    onClick,
    icon,
    label,
    count
}: {
    active: boolean
    disabled: boolean
    onClick: () => void
    icon: React.ReactNode
    label: string
    count: number
}): React.JSX.Element {
    return (
        <button
            type="button"
            disabled={disabled}
            onClick={onClick}
            className={[
                'flex items-center rounded-lg text-xs font-medium transition-all duration-150',
                'disabled:pointer-events-none disabled:opacity-40',
                active
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
            ].join(' ')}
            style={{ gap: '6px', paddingInline: '12px', paddingBlock: '6px' }}
        >
            {icon}
            <span>{label}</span>
            <span
                className={[
                    'rounded-md text-[10px] font-semibold',
                    active ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                ].join(' ')}
                style={{ paddingInline: '5px', paddingBlock: '1px' }}
            >
                {count}
            </span>
        </button>
    )
}

/* ── SourceCard ────────────────────────────────────────────────────────── */

function SourceCard({
    source,
    isSelected,
    disabled,
    onSelect,
    badge,
    badgeIcon,
    large = false
}: {
    source: CaptureSource
    isSelected: boolean
    disabled: boolean
    onSelect: (id: string) => void
    badge?: string
    badgeIcon?: React.ReactNode
    large?: boolean
}): React.JSX.Element {
    return (
        <button
            type="button"
            disabled={disabled}
            onClick={() => onSelect(source.id)}
            aria-pressed={isSelected}
            className={[
                'group relative flex flex-col rounded-xl border text-left transition-all duration-200',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50',
                'disabled:pointer-events-none disabled:opacity-40',
                large ? 'max-w-md' : '',
                isSelected
                    ? 'border-primary/60 bg-primary/[0.04] shadow-md shadow-primary/10 ring-1 ring-primary/20'
                    : 'border-border/60 bg-card hover:border-primary/30 hover:bg-accent/10'
            ].join(' ')}
            style={{ padding: '10px', gap: '8px' }}
        >
            {/* Thumbnail */}
            <div className="relative w-full overflow-hidden rounded-lg bg-black/60 shadow-inner aspect-video">
                <img
                    src={source.thumbnailDataUrl}
                    alt={source.name}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                    loading="lazy"
                />
                {isSelected && (
                    <div className="absolute inset-0 flex items-center justify-center bg-primary/20 backdrop-blur-[1px]">
                        <div
                            className="flex items-center justify-center rounded-full bg-primary text-white shadow-lg shadow-primary/40"
                            style={{ width: large ? '36px' : '28px', height: large ? '36px' : '28px' }}
                        >
                            <Check
                                className={large ? 'h-5 w-5' : 'h-4 w-4'}
                                strokeWidth={2.5}
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Label row */}
            <div className="flex items-center justify-between" style={{ paddingInline: '2px' }}>
                <div className="flex items-center" style={{ gap: '6px' }}>
                    {badgeIcon}
                    <span
                        className={[
                            'truncate text-xs font-semibold leading-tight',
                            isSelected ? 'text-primary' : 'text-foreground'
                        ].join(' ')}
                        title={source.name}
                    >
                        {source.name}
                    </span>
                </div>
                {badge && (
                    <span
                        className="shrink-0 rounded-full bg-primary/10 text-[10px] font-semibold text-primary"
                        style={{ paddingInline: '8px', paddingBlock: '2px' }}
                    >
                        {badge}
                    </span>
                )}
            </div>
        </button>
    )
}
