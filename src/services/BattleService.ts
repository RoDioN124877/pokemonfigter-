// battleUtils.ts

import type { Pokemon, BattleFighter, StatusName } from '../types/Pokemon';

// --- КОНСТАНТЫ ---
export const STATUS_EFFECTS: Record<string, StatusName> = {
    BURN: 'burn', 
    POISON: 'poison', 
    CONFUSION: 'confusion', 
    PARALYSIS: 'paralysis', 
    SLOW: 'slow', 
    DRENCHED: 'drenched', 
};

// Простая таблица типов (1.0 = норма, 2.0 = супер, 0.5 = мало)
export const typeChart: Record<string, Record<string, number>> = {
    fire: { grass: 2, water: 0.5, ice: 2, bug: 2, steel: 2 },
    water: { fire: 2, ground: 2, rock: 2, grass: 0.5 },
    grass: { water: 2, ground: 2, rock: 2, fire: 0.5, flying: 0.5 },
    electric: { water: 2, flying: 2, ground: 0 },
    psychic: { fighting: 2, poison: 2, dark: 0 },
    // ... можно дополнить
};

// --- ФУНКЦИИ ---

export function createBattleFighter(pokemon: Pokemon): BattleFighter {
    // Увеличиваем HP для затяжных боев
    const initialHP = pokemon.statsMap.hp * 3; 
    return {
        id: pokemon.id,
        name: pokemon.name,
        imageFront: pokemon.sprites.front_default,
        imageBack: pokemon.sprites.back_default || pokemon.sprites.front_default,
        statsMap: pokemon.statsMap,
        currentHP: initialHP,
        initialHP: initialHP,
        status: {}, // Инициализируем пустым объектом
        hauntdTurns: 0,
        pok: pokemon, // Добавляем ссылку на оригинал (для доступа к statsMap)
    };
}

export function calculateDamage(attacker: BattleFighter, defender: BattleFighter): { damage: number, isCrit: boolean, logMessage: string } {
    // ... остальная логика остается прежней ...
    const atk = Math.max(attacker.statsMap.attack, attacker.statsMap['special-attack']);
    const def = Math.max(defender.statsMap.defense, defender.statsMap['special-defense']);
    
    // ИСПРАВЛЕНИЕ: Типы берутся из attacker.pok.types, а не statsMap
    const attType = attacker.pok.types?.[0]?.type.name || 'normal'; 
    const defType = defender.pok.types?.[0]?.type.name || 'normal'; // Аналогично для защиты

    const mult = typeChart[attType]?.[defType] || 1;
    let logMessage = '';

    // Статусы влияют на атаку
    let effectiveAtk = atk;
    if (attacker.status.burn) effectiveAtk *= 0.7; // Ожог сильно режет атаку

    // ФОРМУЛА: (ATK / DEF) * 25
    let baseDamage = (effectiveAtk / def) * 25;

    // Крит (15% шанс)
    const isCrit = Math.random() < 0.15;
    if (isCrit) baseDamage *= 1.5;

    let totalDamage = Math.floor(baseDamage * mult);

    // Модификаторы защиты
    if (defender.status.drenched) totalDamage = Math.floor(totalDamage * 1.3); // Мокрый получает больше урона
    if (defender.status.slow) totalDamage = Math.floor(totalDamage * 1.1);

    if (mult > 1) logMessage = "Супер эффективно!";
    if (mult < 1) logMessage = "Не очень эффективно...";

    return { damage: Math.max(1, totalDamage), isCrit, logMessage };
}

export function tryApplyStatus(attacker: BattleFighter): { status: StatusName | null, text: string } {
    // ИСПРАВЛЕНИЕ: Типы берутся из attacker.pok.types, а не statsMap
    const type = attacker.pok.types?.[0]?.type.name; 
    const r = Math.random();

    // Шанс 40% на статус
    if (r > 0.4 || !type) return { status: null, text: '' };

    if (type === 'fire') return { status: 'burn', text: '🔥 ПОДОЖЖЕН!' };
    if (type === 'poison') return { status: 'poison', text: '☠️ ОТРАВЛЕН!' };
    if (type === 'electric') return { status: 'paralysis', text: '⚡ ПАРАЛИЗОВАН!' };
    if (type === 'ice') return { status: 'slow', text: '❄️ ЗАМОРОЖЕН!' };
    if (type === 'water') return { status: 'drenched', text: '💧 ПРОМОК!' };
    if (type === 'psychic') return { status: 'confusion', text: '😵 ЗАПУТАН!' };

    return { status: null, text: '' };
}