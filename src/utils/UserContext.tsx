import React, {
    createContext, useContext, useState, useEffect, useCallback,
} from "react";

export type Theme = "dark" | "light";
export type Profile = { name: string; email: string };

const THEME_KEY = "cc-theme";
const PROFILE_KEY = "cc-profile";

function loadTheme(): Theme {
    try {
        const t = localStorage.getItem(THEME_KEY);
        if (t === "light" || t === "dark") return t;
    } catch { /* ignore */ }
    return "dark";
}

function loadProfile(): Profile | null {
    try {
        const raw = localStorage.getItem(PROFILE_KEY);
        if (!raw) return null;
        const p = JSON.parse(raw);
        if (p && typeof p.name === "string" && typeof p.email === "string") return p;
    } catch { /* ignore */ }
    return null;
}

type UserCtx = {
    profile: Profile | null;
    saveProfile: (p: Profile) => void;
    signOut: () => void;
    theme: Theme;
    toggleTheme: () => void;
};

const Ctx = createContext<UserCtx | null>(null);

export function UserProvider({ children }: { children: React.ReactNode }) {
    const [profile, setProfile] = useState<Profile | null>(loadProfile);
    const [theme, setTheme] = useState<Theme>(loadTheme);

    useEffect(() => {
        document.documentElement.setAttribute("data-theme", theme);
        try { localStorage.setItem(THEME_KEY, theme); } catch { /* ignore */ }
    }, [theme]);

    const saveProfile = useCallback((p: Profile) => {
        setProfile(p);
        try { localStorage.setItem(PROFILE_KEY, JSON.stringify(p)); } catch { /* ignore */ }
    }, []);

    const signOut = useCallback(() => {
        setProfile(null);
        try { localStorage.removeItem(PROFILE_KEY); } catch { /* ignore */ }
    }, []);

    const toggleTheme = useCallback(
        () => setTheme((t) => (t === "dark" ? "light" : "dark")),
        [],
    );

    return (
        <Ctx.Provider value={{ profile, saveProfile, signOut, theme, toggleTheme }}>
            {children}
        </Ctx.Provider>
    );
}

export function useUser(): UserCtx {
    const ctx = useContext(Ctx);
    if (!ctx) throw new Error("useUser must be used inside UserProvider");
    return ctx;
}