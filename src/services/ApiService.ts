import type { Pokemon, PokemonStat } from '../types/Pokemon';

export const BATCH_SIZE = 50;
export const INITIAL_LOAD_COUNT = 100;

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
    const statsMap: Record<string, number> = {};
    stats.forEach(stat => {
        statsMap[stat.stat.name] = stat.base_stat;
    });
    return statsMap;
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
            'special-defense': statsMap['special-defense'] || 0
        },
        height: pok.height,
        weight: pok.weight,
        stats: pok.stats,
        abilities: pok.abilities,
    };
};

export async function fetchPokemonsBatch(startId: number, count: number = BATCH_SIZE): Promise<Pokemon[]> {
    const promises = [];
    const endId = Math.min(startId + count - 1, 1010); // Ограничиваем максимальный ID

    for (let i = startId; i <= endId; i++) {
        promises.push(
            fetch(`https://pokeapi.co/api/v2/pokemon/${i}`)
                .then(r => {
                    if (r.status === 404) return null;
                    if (!r.ok) throw new Error(`HTTP error! status: ${r.status}`);
                    return r.json();
                })
                .catch(() => null)
        );
    }

    const data = await Promise.all(promises);
    return data.filter(Boolean).map(processPokemonData);
}