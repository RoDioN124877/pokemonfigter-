// Per-session equipment loadouts for quick battle modes (1v1, 3v3, tournament).
// Maps pokemon.id → PokemonEquipment. Players can freely pick from the entire
// equipment catalog (incl. rare merchant items) — these are quick-play sandbox loadouts.

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { PokemonEquipment } from './progressStore';

interface QuickEquipState {
    loadouts: Record<number, PokemonEquipment>;
    setSlot: (pokemonId: number, slot: keyof PokemonEquipment, equipId: string | undefined) => void;
    clear: (pokemonId: number) => void;
    clearAll: () => void;
    get: (pokemonId: number) => PokemonEquipment;
}

export const useQuickEquipStore = create<QuickEquipState>()(
    persist(
        (set, get) => ({
            loadouts: {},
            setSlot: (pokemonId, slot, equipId) =>
                set(s => {
                    const current = s.loadouts[pokemonId] ?? {};
                    const next: PokemonEquipment = { ...current, [slot]: equipId };
                    if (!next.weapon && !next.armor && !next.accessory) {
                        const { [pokemonId]: _, ...rest } = s.loadouts;
                        return { loadouts: rest };
                    }
                    return { loadouts: { ...s.loadouts, [pokemonId]: next } };
                }),
            clear: (pokemonId) =>
                set(s => {
                    const { [pokemonId]: _, ...rest } = s.loadouts;
                    return { loadouts: rest };
                }),
            clearAll: () => set({ loadouts: {} }),
            get: (pokemonId) => get().loadouts[pokemonId] ?? {},
        }),
        { name: 'pokemon-quickequip-v1' }
    )
);
