import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface TrainingEntry {
    pokemonUuid: string;
    pokemonName: string;
    startDay: number;
    endDay: number;
    xpReward: number;
}

export type DailyEventType = 'double_xp' | 'shiny_boost' | 'shop_sale' | 'bonus_hunts' | null;

export interface DailyEvent {
    type: DailyEventType;
    label: string;
    emoji: string;
    desc: string;
}

const DAILY_EVENTS: DailyEvent[] = [
    { type: 'double_xp', label: 'Двойной опыт', emoji: '⚡', desc: 'Весь EXP ×2 сегодня!' },
    { type: 'shiny_boost', label: 'Шайни-день', emoji: '✨', desc: 'Шанс шайни ×2 сегодня!' },
    { type: 'shop_sale', label: 'Распродажа', emoji: '🏷️', desc: 'Скидка 30% в магазине!' },
    { type: 'bonus_hunts', label: 'Бонус-охота', emoji: '🎯', desc: '+3 охоты во всех зонах!' },
];

const HEAL_COST_PER_LEVEL = 15;

const MAX_HUNTS_PER_AREA = 3;
const MAX_AD_HUNTS = 3;
const TRAINING_DAYS = 3;
const TRAINING_XP_PER_LEVEL = 600;

interface DayState {
    currentDay: number;
    huntUses: Record<string, number>;
    areaRefreshes: Record<string, number>;
    adHuntsUsed: number;
    tournamentPlayedToday: boolean;
    training: TrainingEntry[];
    todayEvent: DailyEventType;
    fatiguedUuids: string[];

    canHunt: (areaKey: string) => boolean;
    useHunt: (areaKey: string) => void;
    getHuntsLeft: (areaKey: string) => number;
    getMaxHunts: () => number;
    canRefreshFree: (areaKey: string) => boolean;
    needsAdForRefresh: (areaKey: string) => boolean;
    useRefresh: (areaKey: string) => void;
    canAdHunt: () => boolean;
    useAdHunt: (areaKey: string) => void;
    getAdHuntsLeft: () => number;
    canPlayTournament: () => boolean;
    useTournament: () => void;
    startTraining: (uuid: string, name: string, level: number) => number;
    isTraining: (uuid: string) => boolean;
    getTrainingInfo: (uuid: string) => TrainingEntry | undefined;
    getTrainingDaysLeft: (uuid: string) => number;
    skipDay: () => TrainingEntry[];
    reset: () => void;
    getDailyEvent: () => DailyEvent | null;
    hasEvent: (type: DailyEventType) => boolean;
    addFatigue: (uuids: string[]) => void;
    isFatigued: (uuid: string) => boolean;
    healPokemon: (uuid: string) => void;
    healAll: () => void;
    getHealCost: (level: number) => number;
}

export { MAX_HUNTS_PER_AREA, MAX_AD_HUNTS, TRAINING_DAYS, TRAINING_XP_PER_LEVEL, HEAL_COST_PER_LEVEL };

function rollDailyEvent(): DailyEventType {
    if (Math.random() < 0.35) return null;
    return DAILY_EVENTS[Math.floor(Math.random() * DAILY_EVENTS.length)].type;
}

export const useDayStore = create<DayState>()(
    persist(
        (set, get) => ({
            currentDay: 1,
            huntUses: {},
            areaRefreshes: {},
            adHuntsUsed: 0,
            tournamentPlayedToday: false,
            training: [],
            todayEvent: null as DailyEventType,
            fatiguedUuids: [] as string[],

            getMaxHunts: () => get().todayEvent === 'bonus_hunts' ? MAX_HUNTS_PER_AREA + 3 : MAX_HUNTS_PER_AREA,

            canHunt: (areaKey) => (get().huntUses[areaKey] ?? 0) < get().getMaxHunts(),

            useHunt: (areaKey) => set(s => ({
                huntUses: { ...s.huntUses, [areaKey]: (s.huntUses[areaKey] ?? 0) + 1 },
            })),

            getHuntsLeft: (areaKey) => get().getMaxHunts() - (get().huntUses[areaKey] ?? 0),

            canRefreshFree: (areaKey) => (get().areaRefreshes[areaKey] ?? 0) === 0,

            needsAdForRefresh: (areaKey) => (get().areaRefreshes[areaKey] ?? 0) >= 1,

            useRefresh: (areaKey) => set(s => ({
                areaRefreshes: { ...s.areaRefreshes, [areaKey]: (s.areaRefreshes[areaKey] ?? 0) + 1 },
            })),

            canAdHunt: () => get().adHuntsUsed < MAX_AD_HUNTS,

            useAdHunt: (_areaKey) => set(s => ({
                adHuntsUsed: s.adHuntsUsed + 1,
            })),

            getAdHuntsLeft: () => MAX_AD_HUNTS - get().adHuntsUsed,

            canPlayTournament: () => !get().tournamentPlayedToday,

            useTournament: () => set({ tournamentPlayedToday: true }),

            startTraining: (uuid, name, level) => {
                const xpReward = level * TRAINING_XP_PER_LEVEL;
                const cost = level * 40;
                const entry: TrainingEntry = {
                    pokemonUuid: uuid,
                    pokemonName: name,
                    startDay: get().currentDay,
                    endDay: get().currentDay + TRAINING_DAYS,
                    xpReward,
                };
                set(s => ({ training: [...s.training, entry] }));
                return cost;
            },

            isTraining: (uuid) => get().training.some(t => t.pokemonUuid === uuid),

            getTrainingInfo: (uuid) => get().training.find(t => t.pokemonUuid === uuid),

            getTrainingDaysLeft: (uuid) => {
                const t = get().training.find(e => e.pokemonUuid === uuid);
                if (!t) return 0;
                return Math.max(0, t.endDay - get().currentDay);
            },

            getDailyEvent: () => {
                const t = get().todayEvent;
                return DAILY_EVENTS.find(e => e.type === t) ?? null;
            },

            hasEvent: (type) => get().todayEvent === type,

            addFatigue: (uuids) => set(s => ({
                fatiguedUuids: [...new Set([...s.fatiguedUuids, ...uuids])],
            })),

            isFatigued: (uuid) => get().fatiguedUuids.includes(uuid),

            healPokemon: (uuid) => set(s => ({
                fatiguedUuids: s.fatiguedUuids.filter(u => u !== uuid),
            })),

            healAll: () => set({ fatiguedUuids: [] }),

            getHealCost: (level) => level * HEAL_COST_PER_LEVEL,

            skipDay: () => {
                const state = get();
                const nextDay = state.currentDay + 1;
                const completed = state.training.filter(t => t.endDay <= nextDay);
                const remaining = state.training.filter(t => t.endDay > nextDay);
                set({
                    currentDay: nextDay,
                    huntUses: {},
                    areaRefreshes: {},
                    adHuntsUsed: 0,
                    tournamentPlayedToday: false,
                    training: remaining,
                    todayEvent: rollDailyEvent(),
                    fatiguedUuids: [],
                });
                return completed;
            },

            reset: () => set({
                currentDay: 1,
                huntUses: {},
                areaRefreshes: {},
                adHuntsUsed: 0,
                tournamentPlayedToday: false,
                training: [],
                todayEvent: null,
                fatiguedUuids: [],
            }),
        }),
        {
            name: 'pokemon-day-v1',
            partialize: (s) => ({
                currentDay: s.currentDay,
                huntUses: s.huntUses,
                areaRefreshes: s.areaRefreshes,
                adHuntsUsed: s.adHuntsUsed,
                tournamentPlayedToday: s.tournamentPlayedToday,
                training: s.training,
                todayEvent: s.todayEvent,
                fatiguedUuids: s.fatiguedUuids,
            }),
        }
    )
);
