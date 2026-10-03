import { Mic, Volume2, MicOff, VolumeX, ChevronDown, RefreshCw, AlertTriangle } from 'lucide-react'
import type { AudioDevice } from '@shared/contracts/capture'
import { AudioVisualizer } from './audio-visualizer'

export type AudioSettingsProps = {
    micEnabled: boolean
    micDeviceId: string
    micDevices: AudioDevice[]
    canCaptureMicrophone: boolean
    onMicEnabledChange: (enabled: boolean) => void
    onMicDeviceChange: (deviceId: string) => void

    sysAudioEnabled: boolean
    sysAudioDeviceId: string
    sysAudioDevices: AudioDevice[]
    canCaptureSystemAudio: boolean
    platform: string
    onSysAudioEnabledChange: (enabled: boolean) => void
    onSysAudioDeviceChange: (deviceId: string) => void

    disabled?: boolean
    onRefreshDevices?: () => void
}

export function AudioSettings({
    micEnabled,
    micDeviceId,
    micDevices,
    canCaptureMicrophone,
    onMicEnabledChange,
    onMicDeviceChange,
    sysAudioEnabled,
    sysAudioDeviceId,
    sysAudioDevices,
    canCaptureSystemAudio,
    platform,
    onSysAudioEnabledChange,
    onSysAudioDeviceChange,
    disabled = false,
    onRefreshDevices
}: AudioSettingsProps): React.JSX.Element {
    const hasMicDevices = micDevices.length > 0

    return (
        <div className="flex flex-col" style={{ gap: '10px' }}>
            {/* ── Microphone ───────────────────────────────────────────── */}
            <AudioCard
                enabled={micEnabled}
                disabled={disabled || !canCaptureMicrophone}
                icon={
                    micEnabled
                        ? <Mic className="h-4 w-4" />
                        : <MicOff className="h-4 w-4" />
                }
                title="Microphone"
                subtitle={
                    !canCaptureMicrophone
                        ? 'Not available'
                        : hasMicDevices
                          ? `${micDevices.length} device${micDevices.length > 1 ? 's' : ''} found`
                          : 'No microphones found'
                }
                onToggle={() => onMicEnabledChange(!micEnabled)}
            >
                {micEnabled && (
                    <div
                        className="border-t border-border/30 bg-muted/20"
                        style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '8px' }}
                    >
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                                Input Device
                            </span>
                            <div className="flex items-center" style={{ gap: '6px' }}>
                                <AudioVisualizer enabled={micEnabled} deviceId={micDeviceId} />
                                {onRefreshDevices && (
                                    <RefreshButton onClick={onRefreshDevices} disabled={disabled} />
                                )}
                            </div>
                        </div>

                        {!hasMicDevices ? (
                            <WarningBanner message="No microphone detected" />
                        ) : (
                            <SelectInput
                                value={micDeviceId}
                                disabled={disabled}
                                onChange={onMicDeviceChange}
                            >
                                {micDevices.map((d) => (
                                    <option key={d.deviceId} value={d.deviceId}>
                                        {d.label}
                                    </option>
                                ))}
                            </SelectInput>
                        )}
                    </div>
                )}
            </AudioCard>

            {/* ── System Audio ─────────────────────────────────────────── */}
            <AudioCard
                enabled={sysAudioEnabled}
                disabled={disabled || !canCaptureSystemAudio}
                icon={
                    sysAudioEnabled
                        ? <Volume2 className="h-4 w-4" />
                        : <VolumeX className="h-4 w-4" />
                }
                title="System Audio"
                subtitle={
                    !canCaptureSystemAudio
                        ? 'Not supported on this platform'
                        : platform === 'linux'
                          ? 'PulseAudio / PipeWire Loopback'
                          : 'Desktop & app sounds'
                }
                onToggle={() => onSysAudioEnabledChange(!sysAudioEnabled)}
            >
                {sysAudioEnabled && platform === 'linux' && (
                    <div
                        className="border-t border-border/30 bg-muted/20"
                        style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '8px' }}
                    >
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                                Loopback Source
                            </span>
                            {onRefreshDevices && (
                                <RefreshButton onClick={onRefreshDevices} disabled={disabled} />
                            )}
                        </div>

                        <SelectInput
                            value={sysAudioDeviceId}
                            disabled={disabled}
                            onChange={onSysAudioDeviceChange}
                        >
                            <option value="auto">Auto-detect monitor</option>
                            {sysAudioDevices.map((d) => (
                                <option key={d.deviceId} value={d.deviceId}>
                                    {d.label}
                                </option>
                            ))}
                        </SelectInput>
                    </div>
                )}
            </AudioCard>
        </div>
    )
}

/* ── AudioCard ─────────────────────────────────────────────────────────── */

function AudioCard({
    enabled,
    disabled,
    icon,
    title,
    subtitle,
    onToggle,
    children
}: {
    enabled: boolean
    disabled: boolean
    icon: React.ReactNode
    title: string
    subtitle: string
    onToggle: () => void
    children?: React.ReactNode
}): React.JSX.Element {
    return (
        <div
            className={[
                'flex flex-col overflow-hidden rounded-xl border transition-all duration-200',
                disabled
                    ? 'border-border/30 bg-muted/10 opacity-50'
                    : enabled
                      ? 'border-primary/30 bg-primary/[0.03]'
                      : 'border-border/50 bg-card hover:border-border/70'
            ].join(' ')}
        >
            {/* Header */}
            <div
                className="flex items-center justify-between"
                style={{ padding: '12px 14px' }}
            >
                <div className="flex items-center" style={{ gap: '10px' }}>
                    {/* Icon */}
                    <div
                        className={[
                            'flex shrink-0 items-center justify-center rounded-lg transition-colors',
                            enabled && !disabled
                                ? 'bg-primary/12 text-primary'
                                : 'bg-muted text-muted-foreground'
                        ].join(' ')}
                        style={{ width: '34px', height: '34px' }}
                    >
                        {icon}
                    </div>

                    {/* Text */}
                    <div>
                        <p className="text-xs font-semibold leading-tight text-foreground">
                            {title}
                        </p>
                        <p
                            className="leading-tight text-muted-foreground"
                            style={{ marginTop: '2px', fontSize: '11px' }}
                        >
                            {subtitle}
                        </p>
                    </div>
                </div>

                {/* Toggle switch */}
                <button
                    type="button"
                    role="switch"
                    aria-checked={enabled}
                    disabled={disabled}
                    onClick={onToggle}
                    className={[
                        'relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full',
                        'transition-colors duration-200 focus:outline-none',
                        'focus-visible:ring-2 focus-visible:ring-primary/50 disabled:cursor-not-allowed',
                        enabled && !disabled ? 'bg-primary' : 'bg-muted-foreground/25'
                    ].join(' ')}
                >
                    <span
                        className={[
                            'pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200',
                            enabled ? 'translate-x-4' : 'translate-x-0.5'
                        ].join(' ')}
                    />
                </button>
            </div>

            {/* Expandable content */}
            {children}
        </div>
    )
}

/* ── SelectInput ───────────────────────────────────────────────────────── */

function SelectInput({
    value,
    disabled,
    onChange,
    children
}: {
    value: string
    disabled: boolean
    onChange: (val: string) => void
    children: React.ReactNode
}): React.JSX.Element {
    return (
        <div className="relative">
            <select
                value={value}
                disabled={disabled}
                onChange={(e) => onChange(e.target.value)}
                className={[
                    'w-full appearance-none rounded-lg border border-border/70 bg-background',
                    'text-xs font-medium text-foreground',
                    'transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30',
                    'disabled:cursor-not-allowed'
                ].join(' ')}
                style={{ paddingBlock: '7px', paddingInlineStart: '10px', paddingInlineEnd: '28px' }}
            >
                {children}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        </div>
    )
}

/* ── WarningBanner ─────────────────────────────────────────────────────── */

function WarningBanner({ message }: { message: string }): React.JSX.Element {
    return (
        <div
            className="flex items-center rounded-lg border border-amber-500/20 bg-amber-500/5 text-amber-500"
            style={{ gap: '6px', paddingBlock: '7px', paddingInline: '10px', fontSize: '11px' }}
        >
            <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
            <span>{message}</span>
        </div>
    )
}

/* ── RefreshButton ─────────────────────────────────────────────────────── */

function RefreshButton({
    onClick,
    disabled
}: {
    onClick: () => void
    disabled: boolean
}): React.JSX.Element {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            className="flex items-center rounded text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            style={{ gap: '3px', paddingBlock: '2px', paddingInline: '5px', fontSize: '10px' }}
            title="Refresh audio devices"
        >
            <RefreshCw className="h-2.5 w-2.5" />
        </button>
    )
}
