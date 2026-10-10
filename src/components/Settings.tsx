import { Sun, Moon, History as HistoryIcon, ChevronRight, LogOut, User, Mail } from "lucide-react";
import { useUser } from "../utils/UserContext";
import { useApp } from "../utils/AppContext";

export function SettingsPage({ onOpenHistory }: { onOpenHistory: () => void }) {
    const { profile, theme, toggleTheme, signOut } = useUser();
    const { history } = useApp();
    const isDark = theme === "dark";

    return (
        <section className="cc-settings">
            <h2 className="cc-settings-title">Settings</h2>

            <div className="cc-card cc-settings-card">
                <div className="cc-set-row">
                    <User size={17} strokeWidth={1.6} className="cc-muted" />
                    <div className="cc-set-body">
                        <small>Name</small>
                        <p>{profile?.name}</p>
                    </div>
                </div>
                <div className="cc-set-row">
                    <Mail size={17} strokeWidth={1.6} className="cc-muted" />
                    <div className="cc-set-body">
                        <small>Email</small>
                        <p>{profile?.email}</p>
                    </div>
                </div>
                <div className="cc-set-row">
                    {isDark ? <Moon size={17} strokeWidth={1.6} className="cc-muted" /> : <Sun size={17} strokeWidth={1.6} className="cc-muted" />}
                    <div className="cc-set-body">
                        <small>Appearance</small>
                        <p>{isDark ? "Dark theme" : "Light theme"}</p>
                    </div>
                    <button
                        type="button"
                        className={`cc-switch${isDark ? "" : " is-on"}`}
                        role="switch"
                        aria-checked={!isDark}
                        aria-label="Toggle light theme"
                        onClick={toggleTheme}
                    >
                        <span className="cc-switch-knob" />
                    </button>
                </div>
                <button type="button" className="cc-set-row cc-set-link" onClick={onOpenHistory}>
                    <HistoryIcon size={17} strokeWidth={1.6} className="cc-muted" />
                    <div className="cc-set-body">
                        <small>History</small>
                        <p>{history.length} saved {history.length === 1 ? "analysis" : "analyses"}</p>
                    </div>
                    <ChevronRight size={16} className="cc-muted" />
                </button>
            </div>

            <button type="button" className="cc-history-ghost cc-signout" onClick={signOut}>
                <LogOut size={14} /> Log out
            </button>
        </section>
    );
}