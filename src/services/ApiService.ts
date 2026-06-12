import type { Pokemon, PokemonStat } from '../types/Pokemon';

export const PAGE_SIZE = 24;
export const MAX_POKEMON_ID = 1010;

export interface ListEntry {
    id: number;
    name: string;
}

interface PokemonApiResponse {
    id: number;
    name: string;
    types: Pokemon['types'];
    sprites: {
        front_default: string | null;
        back_default: string | null;
    };
    stats: PokemonStat[];
    height: number;
    weight: number;
    abilities: Pokemon['abilities'];
}

const getStatsMap = (stats: PokemonStat[]): Record<string, number> => {
    const map: Record<string, number> = {};
    stats.forEach(s => { map[s.stat.name] = s.base_stat; });
    return map;
};

const processPokemonData = (pok: PokemonApiResponse): Pokemon => {
    const statsMap = getStatsMap(pok.stats);
    return {
        id: pok.id,
        name: pok.name,
        types: pok.types,
        sprites: {
            front_default: pok.sprites.front_default || '',
            back_default: pok.sprites.back_default || ''
        },
        statsMap: {
            ...statsMap,
            hp: statsMap['hp'] || 0,
            attack: statsMap['attack'] || 0,
            defense: statsMap['defense'] || 0,
            speed: statsMap['speed'] || 0,
            'special-attack': statsMap['special-attack'] || 0,
            'special-defense': statsMap['special-defense'] || 0,
        },
        height: pok.height,
        weight: pok.weight,
        stats: pok.stats,
        abilities: pok.abilities,
    };
};

// Single fast request: fetches all ~1010 pokemon names
export async function fetchAllEntries(): Promise<ListEntry[]> {
    const res = await fetch(`https://pokeapi.co/api/v2/pokemon?limit=${MAX_POKEMON_ID}&offset=0`);
    if (!res.ok) throw new Error('Failed to fetch pokemon list');
    const data = await res.json();
    return (data.results as { name: string }[]).map((entry, idx) => ({
        id: idx + 1,
        name: entry.name,
    }));
}

// Fetch all pokemon IDs belonging to a type from PokeAPI /type/ endpoint
export async function fetchPokemonIdsByType(typeName: string): Promise<number[]> {
    const res = await fetch(`https://pokeapi.co/api/v2/type/${typeName}`);
    if (!res.ok) throw new Error(`Failed to fetch type ${typeName}`);
    const data = await res.json();
    return (data.pokemon as { pokemon: { url: string } }[])
        .map(entry => {
            const parts = entry.pokemon.url.split('/');
            return parseInt(parts[parts.length - 2], 10);
        })
        .filter(id => id > 0 && id <= MAX_POKEMON_ID);
}

// Batch fetch pokemon details by IDs (parallel)
export async function fetchPokemonsByIds(ids: number[]): Promise<Pokemon[]> {
    const results = await Promise.all(
        ids.map(id =>
            fetch(`https://pokeapi.co/api/v2/pokemon/${id}`)
                .then(r => {
                    if (r.status === 404) return null;
                    if (!r.ok) throw new Error(`HTTP ${r.status}`);
                    return r.json() as Promise<PokemonApiResponse>;
                })
                .catch(() => null)
        )
    );
    return results.filter(Boolean).map(d => processPokemonData(d!));
}
