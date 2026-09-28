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
        <div className="flex flex-col gap-3">
            {/* ── Microphone Card ────────────────────────────────────── */}
            <div
                className={[
                    'flex flex-col rounded-2xl border transition-all duration-200',
                    disabled
                        ? 'border-border/40 bg-muted/20 opacity-50'
                        : micEnabled
                          ? 'border-primary/40 bg-primary/[0.03] shadow-sm'
                          : 'border-border/70 bg-card hover:border-border'
                ].join(' ')}
            >
                {/* Header Row */}
                <div className="flex items-center justify-between p-3.5">
                    <div className="flex items-center gap-3">
                        <div
                            className={[
                                'flex size-9 shrink-0 items-center justify-center rounded-xl transition-colors',
                                micEnabled && !disabled
                                    ? 'bg-primary/15 text-primary'
                                    : 'bg-muted text-muted-foreground'
                            ].join(' ')}
                        >
                            {micEnabled ? <Mic className="size-4.5" /> : <MicOff className="size-4.5" />}
                        </div>
                        <div>
                            <p className="text-xs font-bold leading-tight text-foreground">
                                Microphone
                            </p>
                            <p className="mt-0.5 text-[11px] text-muted-foreground">
                                {!canCaptureMicrophone
                                    ? 'Not available'
                                    : hasMicDevices
                                      ? `${micDevices.length} device${micDevices.length > 1 ? 's' : ''} detected`
                                      : 'No microphones found'}
                            </p>
                        </div>
                    </div>

                    {/* Switch */}
                    <button
                        type="button"
                        role="switch"
                        aria-checked={micEnabled}
                        disabled={disabled || !canCaptureMicrophone}
                        onClick={() => onMicEnabledChange(!micEnabled)}
                        className={[
                            'relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 disabled:cursor-not-allowed',
                            micEnabled && !disabled ? 'bg-primary' : 'bg-muted-foreground/25'
                        ].join(' ')}
                    >
                        <span
                            className={[
                                'pointer-events-none inline-block size-5 rounded-full bg-white shadow-sm transition-transform duration-200',
                                micEnabled ? 'translate-x-[22px]' : 'translate-x-[2px]'
                            ].join(' ')}
                        />
                    </button>
                </div>

                {/* Expanded Device Selector */}
                {micEnabled && (
                    <div className="border-t border-border/40 p-3 bg-muted/20 flex flex-col gap-2 rounded-b-2xl">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                Mic Device
                            </span>
                            <div className="flex items-center gap-2">
                                <AudioVisualizer enabled={micEnabled} deviceId={micDeviceId} />
                                {onRefreshDevices && (
                                    <button
                                        type="button"
                                        onClick={onRefreshDevices}
                                        disabled={disabled}
                                        className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
                                        title="Refresh audio devices"
                                    >
                                        <RefreshCw className="size-2.5" />
                                    </button>
                                )}
                            </div>
                        </div>

                        {!hasMicDevices ? (
                            <div className="flex items-center gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 px-2.5 py-1.5 text-[11px] text-amber-500">
                                <AlertTriangle className="size-3.5 shrink-0" />
                                <span>No microphone detected</span>
                            </div>
                        ) : (
                            <div className="relative">
                                <select
                                    value={micDeviceId}
                                    disabled={disabled}
                                    onChange={(e) => onMicDeviceChange(e.target.value)}
                                    className="w-full appearance-none rounded-xl border border-border/80 bg-background py-1.5 pl-3 pr-8 text-xs font-medium text-foreground transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/40 disabled:cursor-not-allowed"
                                >
                                    {micDevices.map((d) => (
                                        <option key={d.deviceId} value={d.deviceId}>
                                            🎙️ {d.label}
                                        </option>
                                    ))}
                                </select>
                                <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* ── System Audio Card ──────────────────────────────────── */}
            <div
                className={[
                    'flex flex-col rounded-2xl border transition-all duration-200',
                    disabled
                        ? 'border-border/40 bg-muted/20 opacity-50'
                        : sysAudioEnabled
                          ? 'border-primary/40 bg-primary/[0.03] shadow-sm'
                          : 'border-border/70 bg-card hover:border-border'
                ].join(' ')}
            >
                {/* Header Row */}
                <div className="flex items-center justify-between p-3.5">
                    <div className="flex items-center gap-3">
                        <div
                            className={[
                                'flex size-9 shrink-0 items-center justify-center rounded-xl transition-colors',
                                sysAudioEnabled && !disabled
                                    ? 'bg-primary/15 text-primary'
                                    : 'bg-muted text-muted-foreground'
                            ].join(' ')}
                        >
                            {sysAudioEnabled ? <Volume2 className="size-4.5" /> : <VolumeX className="size-4.5" />}
                        </div>
                        <div>
                            <p className="text-xs font-bold leading-tight text-foreground">
                                System Audio
                            </p>
                            <p className="mt-0.5 text-[11px] text-muted-foreground">
                                {!canCaptureSystemAudio
                                    ? 'Not supported on this platform'
                                    : platform === 'linux'
                                      ? 'PulseAudio / PipeWire Loopback'
                                      : 'Captures desktop & app sounds'}
                            </p>
                        </div>
                    </div>

                    {/* Switch */}
                    <button
                        type="button"
                        role="switch"
                        aria-checked={sysAudioEnabled}
                        disabled={disabled || !canCaptureSystemAudio}
                        onClick={() => onSysAudioEnabledChange(!sysAudioEnabled)}
                        className={[
                            'relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 disabled:cursor-not-allowed',
                            sysAudioEnabled && !disabled ? 'bg-primary' : 'bg-muted-foreground/25'
                        ].join(' ')}
                    >
                        <span
                            className={[
                                'pointer-events-none inline-block size-5 rounded-full bg-white shadow-sm transition-transform duration-200',
                                sysAudioEnabled ? 'translate-x-[22px]' : 'translate-x-[2px]'
                            ].join(' ')}
                        />
                    </button>
                </div>

                {/* Expanded System Audio Device (Linux Loopback) */}
                {sysAudioEnabled && platform === 'linux' && (
                    <div className="border-t border-border/40 p-3 bg-muted/20 flex flex-col gap-2 rounded-b-2xl">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                Loopback Source
                            </span>
                            {onRefreshDevices && (
                                <button
                                    type="button"
                                    onClick={onRefreshDevices}
                                    disabled={disabled}
                                    className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
                                    title="Refresh audio devices"
                                >
                                    <RefreshCw className="size-2.5" />
                                </button>
                            )}
                        </div>

                        <div className="relative">
                            <select
                                value={sysAudioDeviceId}
                                disabled={disabled}
                                onChange={(e) => onSysAudioDeviceChange(e.target.value)}
                                className="w-full appearance-none rounded-xl border border-border/80 bg-background py-1.5 pl-3 pr-8 text-xs font-medium text-foreground transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/40 disabled:cursor-not-allowed"
                            >
                                <option value="auto">🔄 Auto-detect monitor</option>
                                {sysAudioDevices.map((d) => (
                                    <option key={d.deviceId} value={d.deviceId}>
                                        🔊 {d.label}
                                    </option>
                                ))}
                            </select>
                            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
