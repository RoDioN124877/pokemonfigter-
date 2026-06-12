import type { Pokemon } from '../types/Pokemon';

// ── Canon-accurate level formulas ─────────────────────────────────

export function calcHPAtLevel(baseHP: number, level: number): number {
    return Math.floor(2 * baseHP * level / 100 + level + 10);
}

export function calcStatAtLevel(baseStat: number, level: number): number {
    return Math.floor(2 * baseStat * level / 100 + 5);
}

// HP in battle-arena units (matches createBattleFighter's ×3.2 formula)
export function calcBattleHP(baseHP: number, level: number): number {
    const scaled = calcHPAtLevel(baseHP, level);
    return Math.round(Math.min(460, scaled * 3.2));
}

// EXP required to advance from `level` to `level + 1`
export function expToNextLevel(level: number): number {
    return Math.floor(level * level * 4); // L5→6: 100, L10→11: 400, L20→21: 1600
}

// EXP gained per Pokemon from one battle — rebalanced to be much more rewarding
// Old: max(25, opp*26/lvl + 24)  — ~70 XP for a Lv 7 fight at Lv 5 — too slow
// New: scales with opponent level so grinding feels worthwhile
export function calcExpGain(opponentLevel: number, participantLevel: number): number {
    const base = opponentLevel * 22 + 50;
    const delta = opponentLevel - participantLevel;
    let mult = 1.0;
    if (delta > 0) mult = 1 + Math.min(1.5, delta * 0.08);
    else if (delta < -3) mult = Math.max(0.3, 1 + delta * 0.06);
    return Math.max(80, Math.floor(base * mult));
}

// Hero level XP — gained from battles, hunt, quests
export function heroXpToNextLevel(level: number): number {
    return Math.floor(60 + level * level * 12);  // Lv1→2: 72, Lv5→6: 360, Lv10→11: 1260
}

// XP awarded to the hero per encounter
export function calcHeroXp(opponentLevel: number, isVictory: boolean, isHunt: boolean): number {
    const base = opponentLevel * (isHunt ? 1.5 : 4);
    const mult = isVictory ? 1.0 : 0.4;
    return Math.max(5, Math.floor(base * mult));
}

// Create a Pokemon object with all stats scaled to the given level
export function scalePokemonToLevel(pokemon: Pokemon, level: number): Pokemon {
    return {
        ...pokemon,
        statsMap: {
            ...pokemon.statsMap,
            hp: calcHPAtLevel(pokemon.statsMap.hp, level),
            attack: calcStatAtLevel(pokemon.statsMap.attack, level),
            defense: calcStatAtLevel(pokemon.statsMap.defense, level),
            speed: calcStatAtLevel(pokemon.statsMap.speed, level),
            'special-attack': calcStatAtLevel(pokemon.statsMap['special-attack'], level),
            'special-defense': calcStatAtLevel(pokemon.statsMap['special-defense'], level),
        },
        stats: pokemon.stats.map(s => ({
            ...s,
            base_stat: s.stat.name === 'hp'
                ? calcHPAtLevel(s.base_stat, level)
                : calcStatAtLevel(s.base_stat, level),
        })),
    };
}
