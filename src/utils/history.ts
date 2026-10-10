import type { AppAnalysis } from "./AppContext";

export type HistoryEntry = {
    id: string;
    createdAt: number; // epoch ms
    filename: string;
    text: string;
    analysis: AppAnalysis;
};

const KEY = "cc-history-v1";
export const MAX_HISTORY = 50;

export function makeId(): string {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export function loadHistory(): HistoryEntry[] {
    try {
        const raw = localStorage.getItem(KEY);
        if (!raw) return [];
        const data = JSON.parse(raw);
        return Array.isArray(data) ? (data as HistoryEntry[]) : [];
    } catch {
        return [];
    }
}

/** Saves the list; if storage is full, drops the oldest entries until it fits. */
export function saveHistory(entries: HistoryEntry[]): void {
    let list = entries;
    while (true) {
        try {
            localStorage.setItem(KEY, JSON.stringify(list));
            return;
        } catch {
            if (list.length <= 1) return; // give up quietly
            list = list.slice(0, Math.ceil(list.length / 2));
        }
    }
}