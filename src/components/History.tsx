import { useState } from "react";
import { History as HistoryIcon, Trash2, FileText } from "lucide-react";
import { useApp } from "../utils/AppContext";

function scoreToBadge(score: number): string {
    if (score >= 70) return "cc-badge-green";
    if (score >= 50) return "cc-badge-amber";
    return "cc-badge-red";
}

export function HistoryPage({ onOpen }: { onOpen: () => void }) {
    const { history, openHistoryEntry, deleteHistoryEntry, clearHistory } = useApp();
    const [confirmClear, setConfirmClear] = useState(false);

    return (
        <section className="cc-history">
            <div className="cc-history-head">
                <h2><HistoryIcon size={18} strokeWidth={1.6} /> History</h2>
                {history.length > 0 && (
                    confirmClear ? (
                        <span className="cc-history-confirm">
                            Delete all {history.length} entries?
                            <button
                                type="button"
                                className="cc-history-danger"
                                onClick={() => { clearHistory(); setConfirmClear(false); }}
                            >
                                Yes, delete
                            </button>
                            <button type="button" className="cc-history-ghost" onClick={() => setConfirmClear(false)}>
                                Cancel
                            </button>
                        </span>
                    ) : (
                        <button type="button" className="cc-history-ghost" onClick={() => setConfirmClear(true)}>
                            Clear all
                        </button>
                    )
                )}
            </div>

            {history.length === 0 ? (
                <div className="cc-card cc-history-empty">
                    <p className="cc-empty-msg">
                        No history yet. Each time you analyse a chapter, it's saved here on this device.
                    </p>
                </div>
            ) : (
                <ul className="cc-history-list">
                    {history.map((e) => {
                        const r = e.analysis.readability;
                        const title = e.filename || e.text.slice(0, 70) + (e.text.length > 70 ? "…" : "");
                        return (
                            <li key={e.id} className="cc-card cc-history-item">
                                <button
                                    type="button"
                                    className="cc-history-main"
                                    onClick={() => { openHistoryEntry(e.id); onOpen(); }}
                                    aria-label={`Open analysis: ${title}`}
                                >
                                    <FileText size={18} strokeWidth={1.6} className="cc-muted" />
                                    <div className="cc-history-text">
                                        <p className="cc-row-title">{title}</p>
                                        <p className="cc-row-sub">
                                            {new Date(e.createdAt).toLocaleString(undefined, {
                                                dateStyle: "medium", timeStyle: "short",
                                            })}
                                            {r && !r.tooShort && ` · ${r.wordCount.toLocaleString()} words`}
                                            {` · ${e.analysis.difficultWords.length} difficult words`}
                                        </p>
                                    </div>
                                    {r && (
                                        <span className={`cc-badge ${r.tooShort ? "cc-badge-amber" : scoreToBadge(r.score)}`}>
                                            {r.tooShort ? "Too short" : `${r.score} · ${r.label}`}
                                        </span>
                                    )}
                                </button>
                                <button
                                    type="button"
                                    className="cc-icon-btn"
                                    onClick={() => deleteHistoryEntry(e.id)}
                                    aria-label="Delete entry"
                                    title="Delete entry"
                                >
                                    <Trash2 size={16} strokeWidth={1.6} />
                                </button>
                            </li>
                        );
                    })}
                </ul>
            )}
        </section>
    );
}