import type { Pokemon } from '../types/Pokemon';
import bundleData from '../data/pokemonBundle.json';

export const PAGE_SIZE = 24;
export const MAX_POKEMON_ID = 1010;

export interface ListEntry {
    id: number;
    name: string;
}

const bundle = bundleData as {
    pokemon: Pokemon[];
    typeMappings: Record<string, number[]>;
};

const pokemonById = new Map<number, Pokemon>();
for (const p of bundle.pokemon) {
    pokemonById.set(p.id, p);
}

export async function fetchAllEntries(): Promise<ListEntry[]> {
    return bundle.pokemon.map(p => ({ id: p.id, name: p.name }));
}

export async function fetchPokemonIdsByType(typeName: string): Promise<number[]> {
    return bundle.typeMappings[typeName] ?? [];
}

export async function fetchPokemonsByIds(ids: number[]): Promise<Pokemon[]> {
    return ids.map(id => pokemonById.get(id)).filter(Boolean) as Pokemon[];
}
