import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Pokemon, BattleStats } from '../types/Pokemon';

export interface HistoryEntry {
    id: string;
    date: number;
    mode: string;                 // '1v1' | '3v3' | 'story' | 'boss' | 'hunt' | ...
    winner: 1 | 2;
    turns: number;
    p1Damage: number;
    p2Damage: number;
    team1: { name: string; sprite: string }[];
    team2: { name: string; sprite: string }[];
}

const MAX_ENTRIES = 50;

interface HistoryState {
    entries: HistoryEntry[];
    addEntry: (mode: string, winner: 1 | 2, stats: BattleStats, team1: Pokemon[], team2: Pokemon[]) => void;
    clear: () => void;
}

export const useHistoryStore = create<HistoryState>()(
    persist(
        (set) => ({
            entries: [],

            addEntry: (mode, winner, stats, team1, team2) => {
                const entry: HistoryEntry = {
                    id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
                    date: Date.now(),
                    mode,
                    winner,
                    turns: stats.totalTurns,
                    p1Damage: stats.p1DamageDealt,
                    p2Damage: stats.p2DamageDealt,
                    team1: team1.map(p => ({ name: p.name, sprite: p.sprites.front_default })),
                    team2: team2.map(p => ({ name: p.name, sprite: p.sprites.front_default })),
                };
                set(s => ({ entries: [entry, ...s.entries].slice(0, MAX_ENTRIES) }));
            },

            clear: () => set({ entries: [] }),
        }),
        { name: 'pokemon-battle-history-v1' },
    ),
);
