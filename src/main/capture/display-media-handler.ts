import { desktopCapturer, ipcMain, session } from 'electron/main'
import { execFile } from 'child_process'
import { promisify } from 'util'
import type {
    CaptureCapabilities,
    CaptureSource,
    LinuxMonitorInfo
} from '../../shared/contracts/capture'

const execFileAsync = promisify(execFile)

// Holds the renderer-chosen source until getDisplayMedia fires.
let selectedSourceId: string | undefined

// ─── Helpers ────────────────────────────────────────────────────────────────

async function fetchDesktopSources(thumbnailSize: {
    width: number
    height: number
}): Promise<Electron.DesktopCapturerSource[]> {
    const opts = {
        types: ['screen', 'window'] as ('screen' | 'window')[],
        thumbnailSize,
        fetchWindowIcons: false
    }

    const sources = await desktopCapturer.getSources(opts)

    // On some Linux compositors, combining types may return nothing.
    // Fall back to fetching screens and windows separately.
    if (sources.length === 0 && process.platform === 'linux') {
        const [screens, windows] = await Promise.all([
            desktopCapturer.getSources({ ...opts, types: ['screen'] }),
            desktopCapturer.getSources({ ...opts, types: ['window'] })
        ])
        return [...screens, ...windows]
    }

    return sources
}

function mapToCaptureSources(sources: Electron.DesktopCapturerSource[]): CaptureSource[] {
    return sources.map((source) => ({
        id: source.id,
        name: source.name,
        type: source.id.startsWith('screen:') ? 'screen' : 'window',
        thumbnailDataUrl: source.thumbnail.isEmpty()
            ? 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="640" height="360"%3E%3Crect width="640" height="360" fill="%230f172a"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="system-ui" font-size="14" fill="%2394a3b8"%3ENo preview%3C/text%3E%3C/svg%3E'
            : source.thumbnail.toDataURL(),
        displayId: source.display_id
    }))
}

// ─── Linux Monitor Detection ─────────────────────────────────────────────────

/**
 * Detect PulseAudio / PipeWire monitor sources on Linux.
 * Returns descriptions that can be matched against browser device labels.
 */
async function detectLinuxMonitors(): Promise<LinuxMonitorInfo[]> {
    if (process.platform !== 'linux') return []

    // Attempt 1: pactl with JSON output (PulseAudio >= 16, PipeWire)
    try {
        const { stdout } = await execFileAsync('pactl', ['-f', 'json', 'list', 'sources'], {
            timeout: 5000
        })
        const sources = JSON.parse(stdout) as Array<{
            name: string
            description: string
            monitor_source: string
        }>

        return sources
            .filter((s) => s.name.includes('.monitor'))
            .map((s) => ({ name: s.name, description: s.description }))
    } catch {
        // JSON format not available — try text parsing
    }

    // Attempt 2: pactl list sources (text output)
    try {
        const { stdout } = await execFileAsync('pactl', ['list', 'sources'], { timeout: 5000 })

        const monitors: LinuxMonitorInfo[] = []
        let currentName = ''
        let currentDescription = ''

        for (const line of stdout.split('\n')) {
            const trimmed = line.trim()
            if (trimmed.startsWith('Name:')) {
                currentName = trimmed.slice(5).trim()
            } else if (trimmed.startsWith('Description:')) {
                currentDescription = trimmed.slice(12).trim()
                if (currentName.includes('.monitor')) {
                    monitors.push({ name: currentName, description: currentDescription })
                }
            }
        }

        return monitors
    } catch {
        // pactl not available
    }

    return []
}

/** Ensure Linux monitor sources are unmuted and set to 100% volume for recording */
async function unattenuateLinuxMonitors(): Promise<void> {
    if (process.platform !== 'linux') return
    try {
        const monitors = await detectLinuxMonitors()
        for (const mon of monitors) {
            try {
                await execFileAsync('pactl', ['set-source-mute', mon.name, '0'])
                await execFileAsync('pactl', ['set-source-volume', mon.name, '100%'])
            } catch {
                // Ignore per-source errors
            }
        }
    } catch {
        // pactl not available
    }
}

// ─── IPC Handlers ────────────────────────────────────────────────────────────

export function registerCaptureIpc(): void {
    ipcMain.handle('capture:list-sources', async () => {
        const sources = await fetchDesktopSources({ width: 640, height: 360 })
        return mapToCaptureSources(sources)
    })

    ipcMain.handle('capture:select-source', async (_event, sourceId: unknown) => {
        if (typeof sourceId !== 'string' || sourceId.length === 0) {
            throw new TypeError('A valid capture source ID is required.')
        }
        selectedSourceId = sourceId
        if (process.platform === 'linux') {
            await unattenuateLinuxMonitors()
        }
    })

    ipcMain.handle('capture:clear-source', () => {
        selectedSourceId = undefined
    })

    ipcMain.handle('capture:get-capabilities', (): CaptureCapabilities => {
        const platform = process.platform

        return {
            canCaptureScreen: true,
            canCaptureWindow: true,
            canCaptureSystemAudio:
                platform === 'win32' || platform === 'linux' || platform === 'darwin',
            canCaptureMicrophone: true,
            platform
        }
    })

    ipcMain.handle('capture:detect-linux-monitors', async () => {
        return detectLinuxMonitors()
    })
}

// ─── Display Media Request Handler ───────────────────────────────────────────

export function registerDisplayMediaHandler(): void {
    session.defaultSession.setDisplayMediaRequestHandler(
        async (request, callback) => {
            if (!request.videoRequested) {
                callback({})
                return
            }

            const sources = await fetchDesktopSources({ width: 640, height: 360 })
            const source = sources.find(({ id }) => id === selectedSourceId) ?? sources[0]

            if (!source) {
                callback({})
                selectedSourceId = undefined
                return
            }

            if (request.audioRequested && process.platform === 'linux') {
                await unattenuateLinuxMonitors()
            }

            callback({
                video: source,
                // Loopback audio capture across Windows, Linux, and macOS (ScreenCaptureKit)
                audio: request.audioRequested ? 'loopback' : undefined
            })

            selectedSourceId = undefined
        },
        { useSystemPicker: false }
    )
}
