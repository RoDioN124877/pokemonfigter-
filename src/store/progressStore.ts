import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Pokemon } from '../types/Pokemon';
import { calcBattleHP, calcExpGain, expToNextLevel, heroXpToNextLevel, calcHeroXp } from '../utils/progressUtils';
import { EVOLUTION_MAP } from '../data/evolutionData';
import { EQUIPMENT_V2, findEquip, sellPrice as sellPriceForEquip } from '../data/equipmentData';
import type { EquipDefV2, EquipSlotV2 } from '../data/equipmentData';
import { BALLS, calcCatchChance } from '../data/ballData';
import type { BallId, BallDef } from '../data/ballData';

const genId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

// ── Re-exports for backward compat ─────────────────────────────────
export type EquipSlot = EquipSlotV2;
export type EquipId = string;
export type EquipDef = EquipDefV2;
export const EQUIP_DEFS: EquipDefV2[] = EQUIPMENT_V2;
export { findEquip, BALLS };
export type { BallId, BallDef };

export interface PokemonEquipment {
    weapon?: string;
    armor?: string;
    accessory?: string;
}

// ── Items ─────────────────────────────────────────────────────────

export interface PendingEvolution {
    uuid: string;
    fromName: string;
    toId: number;
    toName: string;
}

export interface OwnedPokemon {
    uuid: string;
    data: Pokemon;
    level: number;
    exp: number;
    inTeam: boolean;
    equipment: PokemonEquipment;
    isShiny?: boolean;
    nickname?: string;
}

export type ItemId =
    | 'x-attack' | 'x-defense' | 'x-speed' | 'elixir'
    | BallId
    | 'pokefood' | 'super-food' | 'rare-treat';

export interface BagItem { id: ItemId; qty: number; }
export interface EquipBagItem { id: string; qty: number; }

export interface BattleBuff {
    atkMult: number;
    defMult: number;
    speedMult: number;
    itemsUsed: ItemId[];
}

export interface LevelUpResult {
    uuid: string;
    pokemonName: string;
    newLevel: number;
    hpIncrease: number;
}

export interface HeroLevelUp {
    newLevel: number;
}

export interface ItemDef {
    id: ItemId;
    name: string;
    desc: string;
    cost: number;
    icon: string;
    xpGain?: number;
    category: 'buff' | 'food' | 'catch';
}

export const ITEM_DEFS: ItemDef[] = [
    { id: 'x-attack',   category: 'buff',  name: 'Икс-Атака',       desc: '+40% Атака команды в бою',          cost: 800,  icon: '⚔️' },
    { id: 'x-defense',  category: 'buff',  name: 'Икс-Защита',      desc: '+40% Защита команды в бою',          cost: 800,  icon: '🛡️' },
    { id: 'x-speed',    category: 'buff',  name: 'Икс-Скорость',    desc: '+35% Скорость команды в бою',        cost: 600,  icon: '💨' },
    { id: 'elixir',     category: 'buff',  name: 'Эликсир',         desc: '+25% Атака и Защита команды в бою',  cost: 1200, icon: '🔮' },
    { id: 'pokefood',   category: 'food',  name: 'Покекорм',        desc: '+200 EXP одному покемону',           cost: 200,  icon: '🍖', xpGain: 200  },
    { id: 'super-food', category: 'food',  name: 'Суперкорм',       desc: '+650 EXP одному покемону',           cost: 500,  icon: '🥩', xpGain: 650  },
    { id: 'rare-treat', category: 'food',  name: 'Редкое угощение', desc: '+2200 EXP одному покемону',          cost: 1400, icon: '⭐', xpGain: 2200 },
    ...BALLS.map(b => ({
        id: b.id as ItemId, category: 'catch' as const, name: b.name, desc: b.desc,
        cost: b.cost, icon: b.icon,
    })),
];

// ── Store ─────────────────────────────────────────────────────────

interface ProgressState {
    initialized: boolean;
    money: number;
    bag: BagItem[];
    equipBag: EquipBagItem[];
    ownedPokemon: OwnedPokemon[];
    pendingLevelUps: LevelUpResult[];
    pendingBuff: BattleBuff | null;
    pendingEvolutions: PendingEvolution[];
    lastCaughtShiny: boolean;
    heroLevel: number;
    heroXp: number;
    pendingHeroLevel: HeroLevelUp | null;
    defeatedCount: number;

    initProgress: (starters: Pokemon[]) => void;
    getTeam: () => OwnedPokemon[];
    addMoney: (amount: number) => void;
    spendMoney: (amount: number) => boolean;
    buyItem: (id: ItemId) => boolean;
    buyEquipment: (id: string) => boolean;
    sellItem: (id: ItemId) => boolean;
    sellEquipment: (id: string) => boolean;
    sellPokemon: (uuid: string) => number;
    activateItem: (id: ItemId) => boolean;
    clearBuff: () => void;
    cancelBuff: () => void;
    equipItem: (uuid: string, equipId: string) => boolean;
    unequipItem: (uuid: string, slot: EquipSlot) => void;
    useFoodOnPokemon: (uuid: string, itemId: ItemId) => LevelUpResult[];
    evolvePokemon: (uuid: string, newPokemon: Pokemon) => void;
    confirmEvolution: (uuid: string, newPokemon: Pokemon) => void;
    clearPendingEvolutions: () => void;
    clearLastCaughtShiny: () => void;
    tryCatchPokemon: (pokemon: Pokemon, level: number, ballId: BallId) => { success: boolean; chance: number; ballUsed: boolean };
    catchPokemon: (pokemon: Pokemon, level: number) => boolean;
    giveExpToTeam: (opponentLevel: number, isVictory: boolean) => LevelUpResult[];
    giveHeroXp: (opponentLevel: number, isVictory: boolean, isHunt: boolean) => void;
    clearPendingHeroLevel: () => void;
    setDefeatedCount: (n: number) => void;
    renamePokemon: (uuid: string, nickname: string) => void;
    addPokemon: (pokemon: Pokemon, level: number, inTeam?: boolean) => OwnedPokemon;
    swapTeamPC: (teamUuid: string, pcUuid: string) => void;
    addToTeam: (pcUuid: string) => boolean;
    removeFromTeam: (teamUuid: string) => void;
    clearPendingLevelUps: () => void;
    reset: () => void;
}

const MAX_CATCH_LEVEL_OVER_HERO = 4;

export const useProgressStore = create<ProgressState>()(
    persist(
        (set, get) => ({
            initialized: false,
            money: 0,
            bag: [],
            equipBag: [],
            ownedPokemon: [],
            pendingLevelUps: [],
            pendingBuff: null,
            pendingEvolutions: [],
            lastCaughtShiny: false,
            heroLevel: 1,
            heroXp: 0,
            pendingHeroLevel: null,
            defeatedCount: 0,

            initProgress: (starters) => {
                const owned: OwnedPokemon[] = starters.slice(0, 3).map((pok) => ({
                    uuid: genId(), data: pok, level: 5, exp: 0, inTeam: true, equipment: {},
                }));
                set({
                    initialized: true, money: 800,
                    bag: [{ id: 'pokeball', qty: 2 }, { id: 'x-attack', qty: 1 }, { id: 'pokefood', qty: 3 }],
                    equipBag: [],
                    ownedPokemon: owned, pendingLevelUps: [], pendingBuff: null,
                    heroLevel: 1, heroXp: 0, pendingHeroLevel: null, defeatedCount: 0,
                });
            },

            getTeam: () => get().ownedPokemon.filter(p => p.inTeam),

            addMoney: (amount) => set(s => ({ money: s.money + amount })),

            spendMoney: (amount) => {
                if (get().money < amount) return false;
                set(s => ({ money: s.money - amount }));
                return true;
            },

            buyItem: (id) => {
                const def = ITEM_DEFS.find(d => d.id === id);
                if (!def || !get().spendMoney(def.cost)) return false;
                set(s => {
                    const existing = s.bag.find(i => i.id === id);
                    return existing
                        ? { bag: s.bag.map(i => i.id === id ? { ...i, qty: i.qty + 1 } : i) }
                        : { bag: [...s.bag, { id, qty: 1 }] };
                });
                return true;
            },

            buyEquipment: (id) => {
                const def = findEquip(id);
                if (!def || !get().spendMoney(def.cost)) return false;
                set(s => {
                    const existing = s.equipBag.find(i => i.id === id);
                    return existing
                        ? { equipBag: s.equipBag.map(i => i.id === id ? { ...i, qty: i.qty + 1 } : i) }
                        : { equipBag: [...s.equipBag, { id, qty: 1 }] };
                });
                return true;
            },

            sellItem: (id) => {
                const item = get().bag.find(i => i.id === id);
                if (!item || item.qty <= 0) return false;
                const def = ITEM_DEFS.find(d => d.id === id);
                if (!def) return false;
                const price = Math.floor(def.cost * 0.5);
                set(s => ({
                    money: s.money + price,
                    bag: s.bag.map(i => i.id === id ? { ...i, qty: i.qty - 1 } : i).filter(i => i.qty > 0),
                }));
                return true;
            },

            sellEquipment: (id) => {
                const item = get().equipBag.find(i => i.id === id);
                if (!item || item.qty <= 0) return false;
                const price = sellPriceForEquip(id);
                set(s => ({
                    money: s.money + price,
                    equipBag: s.equipBag.map(i => i.id === id ? { ...i, qty: i.qty - 1 } : i).filter(i => i.qty > 0),
                }));
                return true;
            },

            sellPokemon: (uuid) => {
                const pok = get().ownedPokemon.find(p => p.uuid === uuid);
                if (!pok) return 0;
                const team = get().ownedPokemon.filter(p => p.inTeam);
                if (pok.inTeam && team.length <= 1) return 0;
                let price = pok.level * 80 + 200;
                if (pok.isShiny) price *= 4;
                set(s => {
                    let newEquipBag = [...s.equipBag];
                    (['weapon', 'armor', 'accessory'] as EquipSlot[]).forEach(slot => {
                        const eq = pok.equipment[slot];
                        if (eq) {
                            const existing = newEquipBag.find(i => i.id === eq);
                            if (existing) newEquipBag = newEquipBag.map(i => i.id === eq ? { ...i, qty: i.qty + 1 } : i);
                            else newEquipBag = [...newEquipBag, { id: eq, qty: 1 }];
                        }
                    });
                    return {
                        money: s.money + price,
                        ownedPokemon: s.ownedPokemon.filter(p => p.uuid !== uuid),
                        equipBag: newEquipBag,
                    };
                });
                return price;
            },

            activateItem: (id) => {
                const item = get().bag.find(i => i.id === id && i.qty > 0);
                const def = ITEM_DEFS.find(d => d.id === id);
                if (!item || def?.category !== 'buff') return false;
                const current = get().pendingBuff;
                if (current) {
                    if (current.itemsUsed.length >= 4) return false;
                    if (current.itemsUsed.filter(u => u === id).length >= 2) return false;
                }
                set(s => {
                    const base = s.pendingBuff ?? { atkMult: 1, defMult: 1, speedMult: 1, itemsUsed: [] };
                    const b = { ...base, itemsUsed: [...base.itemsUsed, id] };
                    if (id === 'x-attack')  b.atkMult   *= 1.4;
                    if (id === 'x-defense') b.defMult   *= 1.4;
                    if (id === 'x-speed')   b.speedMult *= 1.35;
                    if (id === 'elixir')  { b.atkMult *= 1.25; b.defMult *= 1.25; }
                    return {
                        pendingBuff: b,
                        bag: s.bag.map(i => i.id === id ? { ...i, qty: i.qty - 1 } : i).filter(i => i.qty > 0),
                    };
                });
                return true;
            },

            clearBuff: () => set({ pendingBuff: null }),

            cancelBuff: () => set(s => {
                if (!s.pendingBuff) return {};
                const returns: Partial<Record<ItemId, number>> = {};
                s.pendingBuff.itemsUsed.forEach(id => { returns[id] = (returns[id] ?? 0) + 1; });
                const newBag = [...s.bag];
                (Object.entries(returns) as [ItemId, number][]).forEach(([id, qty]) => {
                    const existing = newBag.find(i => i.id === id);
                    if (existing) existing.qty += qty;
                    else newBag.push({ id, qty });
                });
                return { pendingBuff: null, bag: newBag };
            }),

            equipItem: (uuid, equipId) => {
                const state = get();
                const equipEntry = state.equipBag.find(i => i.id === equipId && i.qty > 0);
                if (!equipEntry) return false;
                const pok = state.ownedPokemon.find(p => p.uuid === uuid);
                if (!pok) return false;
                const def = findEquip(equipId);
                if (!def) return false;
                const slot = def.slot;
                const currentEquip = pok.equipment[slot];

                set(s => {
                    let newEquipBag = s.equipBag.map(i => i.id === equipId ? { ...i, qty: i.qty - 1 } : i).filter(i => i.qty > 0);
                    if (currentEquip) {
                        const existing = newEquipBag.find(i => i.id === currentEquip);
                        if (existing) newEquipBag = newEquipBag.map(i => i.id === currentEquip ? { ...i, qty: i.qty + 1 } : i);
                        else newEquipBag = [...newEquipBag, { id: currentEquip, qty: 1 }];
                    }
                    return {
                        equipBag: newEquipBag,
                        ownedPokemon: s.ownedPokemon.map(p =>
                            p.uuid === uuid ? { ...p, equipment: { ...p.equipment, [slot]: equipId } } : p
                        ),
                    };
                });
                return true;
            },

            unequipItem: (uuid, slot) => {
                const pok = get().ownedPokemon.find(p => p.uuid === uuid);
                if (!pok) return;
                const equipId = pok.equipment[slot];
                if (!equipId) return;
                set(s => {
                    const existing = s.equipBag.find(i => i.id === equipId);
                    const newEquipBag = existing
                        ? s.equipBag.map(i => i.id === equipId ? { ...i, qty: i.qty + 1 } : i)
                        : [...s.equipBag, { id: equipId, qty: 1 }];
                    return {
                        equipBag: newEquipBag,
                        ownedPokemon: s.ownedPokemon.map(p =>
                            p.uuid === uuid ? { ...p, equipment: { ...p.equipment, [slot]: undefined } } : p
                        ),
                    };
                });
            },

            useFoodOnPokemon: (uuid, itemId) => {
                const def = ITEM_DEFS.find(d => d.id === itemId);
                if (!def?.xpGain) return [];
                const state = get();
                const item = state.bag.find(i => i.id === itemId && i.qty > 0);
                if (!item) return [];
                const pok = state.ownedPokemon.find(p => p.uuid === uuid);
                if (!pok) return [];

                const levelUps: LevelUpResult[] = [];
                let exp = pok.exp + def.xpGain;
                let level = pok.level;

                while (level < 100 && exp >= expToNextLevel(level)) {
                    exp -= expToNextLevel(level);
                    const oldHP = calcBattleHP(pok.data.statsMap.hp, level);
                    level++;
                    const newHP = calcBattleHP(pok.data.statsMap.hp, level);
                    levelUps.push({ uuid, pokemonName: pok.data.name, newLevel: level, hpIncrease: newHP - oldHP });
                }

                set(s => ({
                    bag: s.bag.map(i => i.id === itemId ? { ...i, qty: i.qty - 1 } : i).filter(i => i.qty > 0),
                    ownedPokemon: s.ownedPokemon.map(p => p.uuid === uuid ? { ...p, exp, level } : p),
                }));
                return levelUps;
            },

            evolvePokemon: (uuid, newPokemon) => {
                set(s => ({
                    ownedPokemon: s.ownedPokemon.map(p => p.uuid === uuid ? { ...p, data: newPokemon } : p),
                }));
            },

            tryCatchPokemon: (pokemon, level, ballId) => {
                const state = get();
                const ball = state.bag.find(i => i.id === ballId && i.qty > 0);
                if (!ball) return { success: false, chance: 0, ballUsed: false };
                if (ballId !== 'master-ball' && level > state.heroLevel + MAX_CATCH_LEVEL_OVER_HERO) {
                    return { success: false, chance: 0, ballUsed: false };
                }
                const chance = calcCatchChance(ballId, state.heroLevel, level);
                const ok = Math.random() < chance;
                const isShiny = ok && Math.random() < 0.01;
                set(s => ({
                    bag: s.bag.map(i => i.id === ballId ? { ...i, qty: i.qty - 1 } : i).filter(i => i.qty > 0),
                    ownedPokemon: ok
                        ? [...s.ownedPokemon, { uuid: genId(), data: pokemon, level, exp: 0, inTeam: false, equipment: {}, isShiny }]
                        : s.ownedPokemon,
                    lastCaughtShiny: ok ? isShiny : s.lastCaughtShiny,
                }));
                return { success: ok, chance, ballUsed: true };
            },

            catchPokemon: (pokemon, level) => {
                return get().tryCatchPokemon(pokemon, level, 'pokeball').success;
            },

            giveExpToTeam: (opponentLevel, isVictory) => {
                // No XP on defeat — discourage farming losses
                if (!isVictory) return [];
                const team = get().ownedPokemon.filter(p => p.inTeam);
                const mult = 1.0;
                const levelUps: LevelUpResult[] = [];
                const evolutions: PendingEvolution[] = [];

                const updates = team.map(pok => {
                    const gain = Math.floor(calcExpGain(opponentLevel, pok.level) * mult);
                    let exp = pok.exp + gain;
                    let level = pok.level;
                    while (level < 100 && exp >= expToNextLevel(level)) {
                        exp -= expToNextLevel(level);
                        const oldHP = calcBattleHP(pok.data.statsMap.hp, level);
                        level++;
                        const newHP = calcBattleHP(pok.data.statsMap.hp, level);
                        levelUps.push({ uuid: pok.uuid, pokemonName: pok.data.name, newLevel: level, hpIncrease: newHP - oldHP });
                        const evo = EVOLUTION_MAP[pok.data.id];
                        if (evo && level === evo.minLevel && !evolutions.find(e => e.uuid === pok.uuid)) {
                            evolutions.push({ uuid: pok.uuid, fromName: pok.data.name, toId: evo.intoId, toName: evo.intoName });
                        }
                    }
                    return { uuid: pok.uuid, exp, level };
                });

                set(s => ({
                    ownedPokemon: s.ownedPokemon.map(p => {
                        const u = updates.find(x => x.uuid === p.uuid);
                        return u ? { ...p, exp: u.exp, level: u.level } : p;
                    }),
                    pendingLevelUps: levelUps,
                    pendingEvolutions: [
                        ...s.pendingEvolutions.filter(e => !evolutions.find(n => n.uuid === e.uuid)),
                        ...evolutions,
                    ],
                }));
                return levelUps;
            },

            giveHeroXp: (opponentLevel, isVictory, isHunt) => {
                if (!isVictory) return;
                const gain = calcHeroXp(opponentLevel, isVictory, isHunt);
                set(s => {
                    let xp = s.heroXp + gain;
                    let level = s.heroLevel;
                    let pending = s.pendingHeroLevel;
                    while (level < 100 && xp >= heroXpToNextLevel(level)) {
                        xp -= heroXpToNextLevel(level);
                        level++;
                        pending = { newLevel: level };
                    }
                    return { heroXp: xp, heroLevel: level, pendingHeroLevel: pending };
                });
            },

            clearPendingHeroLevel: () => set({ pendingHeroLevel: null }),

            setDefeatedCount: (n) => set({ defeatedCount: n }),

            renamePokemon: (uuid, nickname) => {
                set(s => ({
                    ownedPokemon: s.ownedPokemon.map(p => p.uuid === uuid ? { ...p, nickname } : p),
                }));
            },

            confirmEvolution: (uuid, newPokemon) => {
                set(s => ({
                    ownedPokemon: s.ownedPokemon.map(p => p.uuid === uuid ? { ...p, data: newPokemon } : p),
                    pendingEvolutions: s.pendingEvolutions.filter(e => e.uuid !== uuid),
                }));
            },

            clearPendingEvolutions: () => set({ pendingEvolutions: [] }),

            addPokemon: (pokemon, level, inTeam = false) => {
                const newOwned: OwnedPokemon = { uuid: genId(), data: pokemon, level, exp: 0, inTeam, equipment: {} };
                set(s => ({ ownedPokemon: [...s.ownedPokemon, newOwned] }));
                return newOwned;
            },

            swapTeamPC: (teamUuid, pcUuid) => {
                set(s => ({
                    ownedPokemon: s.ownedPokemon.map(p => {
                        if (p.uuid === teamUuid) return { ...p, inTeam: false };
                        if (p.uuid === pcUuid)   return { ...p, inTeam: true };
                        return p;
                    }),
                }));
            },

            addToTeam: (pcUuid) => {
                if (get().ownedPokemon.filter(p => p.inTeam).length >= 3) return false;
                set(s => ({ ownedPokemon: s.ownedPokemon.map(p => p.uuid === pcUuid ? { ...p, inTeam: true } : p) }));
                return true;
            },

            removeFromTeam: (teamUuid) => {
                set(s => ({ ownedPokemon: s.ownedPokemon.map(p => p.uuid === teamUuid ? { ...p, inTeam: false } : p) }));
            },

            clearPendingLevelUps: () => set({ pendingLevelUps: [] }),

            clearLastCaughtShiny: () => set({ lastCaughtShiny: false }),

            reset: () => set({
                initialized: false, money: 0, bag: [], equipBag: [], ownedPokemon: [],
                pendingLevelUps: [], pendingBuff: null, pendingEvolutions: [], lastCaughtShiny: false,
                heroLevel: 1, heroXp: 0, pendingHeroLevel: null, defeatedCount: 0,
            }),
        }),
        {
            name: 'pokemon-progress-v3',
            partialize: (state) => ({
                initialized: state.initialized,
                money: state.money,
                bag: state.bag,
                equipBag: state.equipBag,
                ownedPokemon: state.ownedPokemon,
                heroLevel: state.heroLevel,
                heroXp: state.heroXp,
                defeatedCount: state.defeatedCount,
            }),
        }
    )
);
