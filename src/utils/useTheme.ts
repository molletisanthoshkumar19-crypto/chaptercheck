import { useState, useEffect, useCallback } from "react";

export type Theme = "dark" | "light";
const STORAGE_KEY = "cc-theme";

function getInitialTheme(): Theme {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved === "light" || saved === "dark") return saved;
    } catch {
        // storage unavailable (private mode etc.) — fall through
    }
    return "dark"; // your app's original look
}

export function useTheme() {
    const [theme, setTheme] = useState<Theme>(getInitialTheme);

    useEffect(() => {
        document.documentElement.setAttribute("data-theme", theme);
        try {
            localStorage.setItem(STORAGE_KEY, theme);
        } catch {
            /* ignore */
        }
    }, [theme]);

    const toggleTheme = useCallback(
        () => setTheme((t) => (t === "dark" ? "light" : "dark")),
        []
    );

    return { theme, toggleTheme };
}