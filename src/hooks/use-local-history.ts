"use client";

import { useCallback, useEffect, useState } from 'react';

export type HistoryEntry = {
  id?: string;
  kind: 'analysis' | 'forgery';
  createdAt: number;
  summary: string;
  documentType?: string;
  statusLabel: string;
  payload: unknown;
};

const STORAGE_KEY = 'certicheck:history:v1';

export function useLocalHistory() {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as HistoryEntry[];
        setEntries(parsed);
      }
    } catch {}
  }, []);

  const persist = (list: HistoryEntry[]) => {
    setEntries(list);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(list)); } catch {}
  };

  const addHistory = useCallback((entry: HistoryEntry) => {
    const withId = { ...entry, id: `${entry.kind}-${entry.createdAt}` };
    const next = [withId, ...entries].slice(0, 10);
    persist(next);
  }, [entries]);

  const clearHistory = useCallback(() => persist([]), []);

  return { entries, addHistory, clearHistory };
}