import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { BattleStats } from '../types/Pokemon';
import {
    ACHIEVEMENTS, emptyCounters,
    type AchievementCounters, type AchievementDef,
} from '../data/achievements';

interface AchievementState {
    counters: AchievementCounters;
    unlocked: Record<string, number>; // id → unlock timestamp
    toastQueue: string[];             // achievement ids awaiting toast display

    recordBattleEnd: (winner: 1 | 2, stats: BattleStats, maxSize: 1 | 3) => void;
    recordTournamentEnd: (won: boolean) => void;
    recordQuizAnswer: (correct: boolean, streak: number) => void;
    recordQuizGame: () => void;
    recordPredict: (correct: boolean, streak: number) => void;
    recordFavoritesCount: (count: number) => void;
    recordShinyCaught: () => void;
    recordSurvivalWave: (wave: number) => void;
    recordStoryMilestone: (milestone: 'champion' | 'complete') => void;
    recordStoryMilestoneDay: (milestone: 'champion' | 'complete', day: number) => void;
    recordTournamentWonDay: (day: number) => void;
    popToast: () => void;
}

function withUnlockCheck(
    counters: AchievementCounters,
    unlocked: Record<string, number>,
    toastQueue: string[],
): Pick<AchievementState, 'counters' | 'unlocked' | 'toastQueue'> {
    const newUnlocked = { ...unlocked };
    const newToasts = [...toastQueue];
    for (const a of ACHIEVEMENTS) {
        if (!newUnlocked[a.id] && a.value(counters) >= a.target) {
            newUnlocked[a.id] = Date.now();
            newToasts.push(a.id);
        }
    }
    return { counters, unlocked: newUnlocked, toastQueue: newToasts };
}

export const useAchievementStore = create<AchievementState>()(
    persist(
        (set, get) => {
            const update = (patch: Partial<AchievementCounters>) => {
                const s = get();
                const counters = { ...s.counters, ...patch };
                set(withUnlockCheck(counters, s.unlocked, s.toastQueue));
            };

            return {
                counters: emptyCounters(),
                unlocked: {},
                toastQueue: [],

                recordBattleEnd: (winner, stats, maxSize) => {
                    const c = get().counters;
                    const won = winner === 1;
                    const hour = new Date().getHours();
                    update({
                        battlesPlayed: c.battlesPlayed + 1,
                        battlesWon: c.battlesWon + (won ? 1 : 0),
                        totalCrits: c.totalCrits + stats.p1Crits,
                        totalKOs: c.totalKOs + stats.p1KOs,
                        flawlessWins: c.flawlessWins + (won && maxSize === 3 && stats.p2KOs === 0 ? 1 : 0),
                        longestBattle: Math.max(c.longestBattle, stats.totalTurns),
                        maxDamageBattle: Math.max(c.maxDamageBattle, stats.p1DamageDealt),
                        nightBattles: c.nightBattles + (hour < 5 ? 1 : 0),
                    });
                },

                recordTournamentEnd: (won) => {
                    const c = get().counters;
                    update({
                        tournamentsPlayed: c.tournamentsPlayed + 1,
                        tournamentsWon: c.tournamentsWon + (won ? 1 : 0),
                    });
                },

                recordQuizAnswer: (correct, streak) => {
                    const c = get().counters;
                    update({
                        quizCorrect: c.quizCorrect + (correct ? 1 : 0),
                        quizBestStreak: Math.max(c.quizBestStreak, streak),
                    });
                },

                recordQuizGame: () => {
                    update({ quizGames: get().counters.quizGames + 1 });
                },

                recordPredict: (correct, streak) => {
                    const c = get().counters;
                    update({
                        predictCorrect: c.predictCorrect + (correct ? 1 : 0),
                        predictBestStreak: Math.max(c.predictBestStreak, streak),
                    });
                },

                recordFavoritesCount: (count) => {
                    if (count > get().counters.favoritesMax) update({ favoritesMax: count });
                },

                recordShinyCaught: () => {
                    update({ shinyCaught: get().counters.shinyCaught + 1 });
                },

                recordSurvivalWave: (wave) => {
                    if (wave > get().counters.survivalBestWave) update({ survivalBestWave: wave });
                },

                recordStoryMilestone: (milestone) => {
                    if (milestone === 'champion') update({ storyChampion: 1 });
                    else update({ storyComplete: 1 });
                },

                recordStoryMilestoneDay: (milestone, day) => {
                    const c = get().counters;
                    if (milestone === 'champion' && day < c.storyChampionDay) {
                        update({ storyChampionDay: day });
                    } else if (milestone === 'complete' && day < c.storyCompleteDay) {
                        update({ storyCompleteDay: day });
                    }
                },

                recordTournamentWonDay: (day) => {
                    if (day < get().counters.tournamentWonDay) update({ tournamentWonDay: day });
                },

                popToast: () => set(s => ({ toastQueue: s.toastQueue.slice(1) })),
            };
        },
        {
            name: 'pokemon-achievements-v1',
            partialize: (s) => ({ counters: s.counters, unlocked: s.unlocked }),
            merge: (persisted, current) => {
                const p = persisted as Partial<AchievementState> | undefined;
                return {
                    ...current,
                    counters: { ...emptyCounters(), ...(p?.counters ?? {}) },
                    unlocked: p?.unlocked ?? {},
                };
            },
        },
    ),
);

export function getAchievementDef(id: string): AchievementDef | undefined {
    return ACHIEVEMENTS.find(a => a.id === id);
}
