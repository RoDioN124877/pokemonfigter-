import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Pokemon } from '../types/Pokemon';
import { CHAMPION_INDEX, FINAL_INDEX } from '../data/storyData';
import { useAchievementStore } from './achievementStore';
import { useDayStore } from './dayStore';
import { randomFormat } from '../data/tournamentData';
import type { TournamentFormat } from '../data/tournamentData';

export type StoryPhase =
    | 'team-select'
    | 'map'
    | 'shop'
    | 'inventory'
    | 'hunt'
    | 'pre-battle'
    | 'battle'
    | 'victory'
    | 'defeat'
    | 'champion'
    | 'boss-rush'
    | 'leaderboard'
    | 'tournament';

interface StoryState {
    phase: StoryPhase;
    playerTeam: Pokemon[];
    defeatedIndices: number[];
    currentOpponentIndex: number;
    ngPlusLevel: number;
    nextTournamentFormat: TournamentFormat;

    setPlayerTeam: (team: Pokemon[]) => void;
    selectOpponent: (index: number) => void;
    startBattle: () => void;
    handleBattleEnd: (winner: 1 | 2) => void;
    goToMap: () => void;
    openShop: () => void;
    openInventory: () => void;
    openHunt: () => void;
    openBossRush: () => void;
    openLeaderboard: () => void;
    openTournament: () => void;
    rollNextTournament: () => void;
    retry: () => void;
    reset: () => void;
    startNgPlus: () => void;
}

export const useStoryStore = create<StoryState>()(
    persist(
        (set) => ({
    phase: 'team-select',
    playerTeam: [],
    defeatedIndices: [],
    currentOpponentIndex: 0,
    ngPlusLevel: 0,
    nextTournamentFormat: randomFormat(),

    setPlayerTeam: (team) => set({ playerTeam: team, phase: 'map' }),

    selectOpponent: (index) => set({ currentOpponentIndex: index, phase: 'pre-battle' }),

    startBattle: () => set({ phase: 'battle' }),

    handleBattleEnd: (winner) => set((state) => {
        if (winner === 1) {
            const alreadyDefeated = state.defeatedIndices.includes(state.currentOpponentIndex);
            const newDefeated = alreadyDefeated
                ? state.defeatedIndices
                : [...state.defeatedIndices, state.currentOpponentIndex];
            // Two milestones: becoming Champion (Blue) and finishing the whole saga
            const isMilestone = !alreadyDefeated &&
                (state.currentOpponentIndex === CHAMPION_INDEX || state.currentOpponentIndex === FINAL_INDEX);
            if (isMilestone) {
                const milestone = state.currentOpponentIndex === FINAL_INDEX ? 'complete' : 'champion';
                useAchievementStore.getState().recordStoryMilestone(milestone);
                useAchievementStore.getState().recordStoryMilestoneDay(
                    milestone, useDayStore.getState().currentDay);
            }
            return { defeatedIndices: newDefeated, phase: isMilestone ? 'champion' : 'victory' };
        }
        return { phase: 'defeat' };
    }),

    goToMap: () => set({ phase: 'map' }),
    openShop: () => set({ phase: 'shop' }),
    openInventory: () => set({ phase: 'inventory' }),
    openHunt: () => set({ phase: 'hunt' }),
    openBossRush: () => set({ phase: 'boss-rush' }),
    openLeaderboard: () => set({ phase: 'leaderboard' }),
    openTournament: () => set({ phase: 'tournament' }),
    rollNextTournament: () => set({ nextTournamentFormat: randomFormat() }),

    retry: () => set({ phase: 'pre-battle' }),

    reset: () => set({
        phase: 'team-select',
        playerTeam: [],
        defeatedIndices: [],
        currentOpponentIndex: 0,
        ngPlusLevel: 0,
        nextTournamentFormat: randomFormat(),
    }),

    startNgPlus: () => set(s => ({
        phase: 'team-select',
        playerTeam: [],
        defeatedIndices: [],
        currentOpponentIndex: 0,
        ngPlusLevel: s.ngPlusLevel + 1,
    })),
        }),
        {
            name: 'pokemon-story-v1',
            partialize: (state) => ({
                defeatedIndices: state.defeatedIndices,
                currentOpponentIndex: state.currentOpponentIndex,
                ngPlusLevel: state.ngPlusLevel,
                nextTournamentFormat: state.nextTournamentFormat,
            }),
        }
    )
);
