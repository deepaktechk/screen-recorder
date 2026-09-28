import { useCallback, useEffect, useMemo, useState } from 'react'

export type Theme = 'light' | 'dark' | 'system'

type UseTheme = {
    theme: Theme
    resolved: 'light' | 'dark'
    setTheme: (t: Theme) => void
    cycle: () => void
}

export function useTheme(): UseTheme {
    const [theme, setThemeState] = useState<Theme>(() => {
        try {
            return (localStorage.getItem('capturely-theme') as Theme) || 'system'
        } catch {
            return 'system'
        }
    })

    const [systemDark, setSystemDark] = useState(
        () => window.matchMedia('(prefers-color-scheme: dark)').matches
    )

    const resolved = useMemo<'light' | 'dark'>(
        () => (theme === 'system' ? (systemDark ? 'dark' : 'light') : theme),
        [theme, systemDark]
    )

    // Listen for system theme changes
    useEffect(() => {
        const mql = window.matchMedia('(prefers-color-scheme: dark)')
        const handler = (e: MediaQueryListEvent): void => setSystemDark(e.matches)
        mql.addEventListener('change', handler)
        return () => mql.removeEventListener('change', handler)
    }, [])

    // Apply theme to DOM and persist
    useEffect(() => {
        document.documentElement.classList.toggle('dark', resolved === 'dark')
        try {
            localStorage.setItem('capturely-theme', theme)
        } catch {
            // Storage unavailable
        }
    }, [theme, resolved])

    const setTheme = useCallback((t: Theme) => setThemeState(t), [])

    const cycle = useCallback(() => {
        setThemeState((current) => {
            const order: Theme[] = ['system', 'light', 'dark']
            return order[(order.indexOf(current) + 1) % order.length]
        })
    }, [])

    return { theme, resolved, setTheme, cycle }
}
