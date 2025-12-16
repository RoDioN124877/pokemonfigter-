import type { Pokemon, BattleFighter, StatusName } from '../types/Pokemon';

export const STATUS_EFFECTS: Record<string, StatusName> = {
    BURN: 'burn',
    POISON: 'poison',
    CONFUSION: 'confusion',
    PARALYSIS: 'paralysis',
    SLOW: 'slow',
    DRENCHED: 'drenched',
};

export const typeChart: Record<string, Record<string, number>> = {
    fire: { grass: 2, water: 0.5, ice: 2, bug: 2, steel: 2, fire: 0.5 },
    water: { fire: 2, ground: 2, rock: 2, grass: 0.5, water: 0.5, electric: 0.5 },
    grass: { water: 2, ground: 2, rock: 2, fire: 0.5, flying: 0.5, grass: 0.5, bug: 0.5 },
    electric: { water: 2, flying: 2, ground: 0, electric: 0.5, grass: 0.5 },
    psychic: { fighting: 2, poison: 2, dark: 0, psychic: 0.5 },
    normal: { rock: 0.5, ghost: 0, steel: 0.5 }, // Добавил normal
    fighting: { normal: 2, rock: 2, steel: 2, flying: 0.5, psychic: 0.5, bug: 0.5 },
    flying: { grass: 2, fighting: 2, bug: 2, electric: 0.5, rock: 0.5, steel: 0.5 },
    poison: { grass: 2, fairy: 2, ground: 0.5, psychic: 0.5, rock: 0.5 },
    ground: { fire: 2, electric: 2, poison: 2, rock: 2, steel: 2, grass: 0.5, bug: 0.5, flying: 0 },
    rock: { fire: 2, ice: 2, flying: 2, bug: 2, fighting: 0.5, ground: 0.5, steel: 0.5 },
    bug: { grass: 2, psychic: 2, dark: 2, fire: 0.5, fighting: 0.5, flying: 0.5, ghost: 0.5 },
    ghost: { psychic: 2, ghost: 2, normal: 0, dark: 0.5 },
    steel: { ice: 2, rock: 2, fairy: 2, fire: 0.5, fighting: 0.5, ground: 0.5 },
    ice: { grass: 2, ground: 2, flying: 2, dragon: 2, fire: 0.5, steel: 0.5, ice: 0.5 },
    dragon: { dragon: 2, steel: 0.5, fairy: 0 },
    dark: { psychic: 2, ghost: 2, fighting: 0.5, dark: 0.5, fairy: 0.5 },
    fairy: { fighting: 2, dragon: 2, dark: 2, poison: 0.5, steel: 0.5, fire: 0.5 },
};

export function createBattleFighter(pokemon: Pokemon): BattleFighter {
    const initialHP = pokemon.statsMap.hp * 3;
    return {
        id: pokemon.id,
        name: pokemon.name,
        imageFront: pokemon.sprites.front_default,
        imageBack: pokemon.sprites.back_default || pokemon.sprites.front_default,
        statsMap: pokemon.statsMap,
        currentHP: initialHP,
        initialHP: initialHP,
        status: {},
        hauntdTurns: 0,
        pok: pokemon,
    };
}

export function calculateDamage(attacker: BattleFighter, defender: BattleFighter): {
    damage: number;
    isCrit: boolean;
    logMessage: string;
} {
    const atk = Math.max(attacker.statsMap.attack, attacker.statsMap['special-attack']);
    const def = Math.max(defender.statsMap.defense, defender.statsMap['special-defense']);

    const attType = attacker.pok.types?.[0]?.type.name || 'normal';
    const defType = defender.pok.types?.[0]?.type.name || 'normal';

    const mult = typeChart[attType]?.[defType] || 1;
    let logMessage = '';

    let effectiveAtk = atk;
    if (attacker.status.burn) effectiveAtk *= 0.7;

    let baseDamage = (effectiveAtk / def) * 25;

    const isCrit = Math.random() < 0.15;
    if (isCrit) {
        baseDamage *= 1.5;
        logMessage = "КРИТИЧЕСКИЙ УДАР!";
    }

    let totalDamage = Math.floor(baseDamage * mult);

    if (defender.status.drenched) totalDamage = Math.floor(totalDamage * 1.3);
    if (defender.status.slow) totalDamage = Math.floor(totalDamage * 1.1);

    if (mult > 1 && !isCrit) logMessage = "Супер эффективно!";
    if (mult < 1 && !isCrit) logMessage = "Не очень эффективно...";

    return {
        damage: Math.max(1, totalDamage),
        isCrit,
        logMessage
    };
}

export function tryApplyStatus(attacker: BattleFighter): { status: StatusName | null; text: string } {
    const type = attacker.pok.types?.[0]?.type.name;
    const r = Math.random();

    if (r > 0.4 || !type) return { status: null, text: '' };

    if (type === 'fire') return { status: 'burn', text: 'горит!' };
    if (type === 'poison') return { status: 'poison', text: 'отравлен!' };
    if (type === 'electric') return { status: 'paralysis', text: 'парализован!' };
    if (type === 'ice') return { status: 'slow', text: 'заморожен!' };
    if (type === 'water') return { status: 'drenched', text: 'промок!' };
    if (type === 'psychic') return { status: 'confusion', text: 'запутан!' };

    return { status: null, text: '' };
}

export function applyDotDamage(fighter: BattleFighter): { damage: number; log: string | null } {
    let damage = 0;
    let log: string | null = null;

    if (fighter.status.burn) {
        damage = Math.floor(fighter.initialHP * 0.05);
        log = `🔥 ${fighter.name} получает урон от ожога: ${damage}`;
    } else if (fighter.status.poison) {
        damage = Math.floor(fighter.initialHP * 0.08);
        log = `☠️ ${fighter.name} получает урон от яда: ${damage}`;
    }

    return { damage, log };
}