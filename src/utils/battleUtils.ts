import type { BattleFighter, Pokemon, StatusName, WeatherType, EquipBattleEffects } from '../types/Pokemon';
import { emptyEquipEffects } from '../types/Pokemon';

// Resist soft cap helper — never let any single resist exceed 60%
function damageResistFromEquip(attackType: string, eff: EquipBattleEffects): number {
    switch (attackType) {
        case 'fire':     return eff.fireResist;
        case 'water':    return eff.waterResist;
        case 'electric': return eff.electricResist;
        case 'ice':      return eff.iceResist;
        case 'grass':    return eff.grassResist;
        case 'psychic':  return eff.psychicResist;
        case 'rock':     return eff.rockResist;
        case 'ground':   return eff.groundResist;
        default:         return 0;
    }
}

// ===================== TYPE CHART =====================
export const typeChart: Record<string, Record<string, number>> = {
    normal:   { rock: 0.5, ghost: 0, steel: 0.5 },
    fire:     { fire: 0.5, water: 0.5, grass: 2, ice: 2, bug: 2, rock: 0.5, dragon: 0.5, steel: 2 },
    water:    { fire: 2, water: 0.5, grass: 0.5, ground: 2, rock: 2, dragon: 0.5 },
    electric: { water: 2, electric: 0.5, grass: 0.5, ground: 0, flying: 2, dragon: 0.5 },
    grass:    { fire: 0.5, water: 2, grass: 0.5, poison: 0.5, ground: 2, flying: 0.5, bug: 0.5, rock: 2, dragon: 0.5, steel: 0.5 },
    ice:      { fire: 0.5, water: 0.5, grass: 2, ice: 0.5, ground: 2, flying: 2, dragon: 2, steel: 0.5 },
    fighting: { normal: 2, ice: 2, rock: 2, dark: 2, steel: 2, poison: 0.5, flying: 0.5, psychic: 0.5, bug: 0.5, ghost: 0, fairy: 0.5 },
    poison:   { grass: 2, fairy: 2, poison: 0.5, ground: 0.5, rock: 0.5, ghost: 0.5, steel: 0 },
    ground:   { fire: 2, electric: 2, grass: 0.5, poison: 2, rock: 2, bug: 0.5, steel: 2, flying: 0 },
    flying:   { electric: 0.5, grass: 2, fighting: 2, bug: 2, rock: 0.5, steel: 0.5 },
    psychic:  { fighting: 2, poison: 2, psychic: 0.5, dark: 0, steel: 0.5 },
    bug:      { fire: 0.5, grass: 2, fighting: 0.5, flying: 0.5, psychic: 2, ghost: 0.5, dark: 2, steel: 0.5, fairy: 0.5 },
    rock:     { fire: 2, ice: 2, fighting: 0.5, ground: 0.5, flying: 2, bug: 2, steel: 0.5 },
    ghost:    { normal: 0, psychic: 2, ghost: 2, dark: 0.5 },
    dragon:   { dragon: 2, steel: 0.5, fairy: 0 },
    dark:     { fighting: 0.5, psychic: 2, ghost: 2, dark: 0.5, fairy: 0.5 },
    steel:    { fire: 0.5, water: 0.5, electric: 0.5, ice: 2, rock: 2, steel: 0.5, fairy: 2 },
    fairy:    { fire: 0.5, fighting: 2, poison: 0.5, dragon: 2, dark: 2, steel: 0.5 },
};

// ===================== ABILITY DESCRIPTIONS =====================
export const ABILITY_INFO: Record<string, { icon: string; desc: string; tier: 'S' | 'A' | 'B' }> = {
    'huge-power':     { icon: '💪', desc: 'Атака ×1.85', tier: 'S' },
    'pure-power':     { icon: '💪', desc: 'Атака ×1.85', tier: 'S' },
    'wonder-guard':   { icon: '✨', desc: 'Только суперэффективно наносит урон', tier: 'S' },
    'sturdy':         { icon: '🗿', desc: 'Выживает с 1 HP при полном здоровье', tier: 'A' },
    'multiscale':     { icon: '🛡️', desc: 'При полном HP получает -50% урон', tier: 'A' },
    'intimidate':     { icon: '😤', desc: 'При выходе снижает ATK врага на 20%', tier: 'A' },
    'magic-guard':    { icon: '✨', desc: 'Иммунитет к DoT и статус-урону', tier: 'A' },
    'speed-boost':    { icon: '⚡', desc: 'Скорость +15% каждый ход', tier: 'A' },
    'moxie':          { icon: '🎯', desc: 'После KO получает +25% Атаки', tier: 'A' },
    'guts':           { icon: '🦾', desc: 'При статус-эффекте Атака +50%', tier: 'A' },
    'hustle':         { icon: '🎲', desc: 'Атака +50%, но 25% промах', tier: 'B' },
    'water-absorb':   { icon: '💧', desc: 'Вода лечит вместо урона', tier: 'B' },
    'volt-absorb':    { icon: '⚡', desc: 'Электро лечит вместо урона', tier: 'B' },
    'flash-fire':     { icon: '🔥', desc: 'Поглощает огонь → свои огн. атаки +30%', tier: 'B' },
    'levitate':       { icon: '🌀', desc: 'Иммунитет к Ground-атакам', tier: 'B' },
    'thick-fat':      { icon: '🧈', desc: 'Огонь и Лёд наносят -50% урон', tier: 'B' },
    'static':         { icon: '⚡', desc: '30% шанс паралича при ударе', tier: 'B' },
    'flame-body':     { icon: '🔥', desc: '30% шанс ожога при ударе', tier: 'B' },
    'poison-point':   { icon: '☠️', desc: '30% шанс яда при ударе', tier: 'B' },
    'rough-skin':     { icon: '🩸', desc: 'Наносит 5% HP урона атакующему', tier: 'B' },
    'iron-barbs':     { icon: '🩸', desc: 'Наносит 5% HP урона атакующему', tier: 'B' },
    'blaze':          { icon: '🔥', desc: 'При HP<33% огневые атаки +50%', tier: 'B' },
    'torrent':        { icon: '💧', desc: 'При HP<33% водные атаки +50%', tier: 'B' },
    'overgrow':       { icon: '🌿', desc: 'При HP<33% травяные атаки +50%', tier: 'B' },
    'swarm':          { icon: '🐛', desc: 'При HP<33% жучьи атаки +50%', tier: 'B' },
    'regenerator':    { icon: '💚', desc: 'Восстанавливает 10% HP каждый ход', tier: 'A' },
    'shed-skin':      { icon: '🐍', desc: '30% шанс снять статус каждый ход', tier: 'B' },
    'sheer-force':    { icon: '💥', desc: 'Урон +30%, убирает доп. эффекты', tier: 'B' },
    'technician':     { icon: '🔧', desc: 'Слабые атаки усиливаются +50%', tier: 'B' },
    'sand-stream':    { icon: '🏜️', desc: 'Вызывает песчаную бурю', tier: 'B' },
    'drizzle':        { icon: '🌧️', desc: 'Призывает дождь: Вода +30%', tier: 'B' },
    'drought':        { icon: '☀️', desc: 'Призывает солнце: Огонь +30%', tier: 'B' },
};

// Canonical attack types each Pokemon can use (primary STAB + coverage moves).
// Sampled randomly in calculateDamage, making battles type-diverse.
const MOVE_POOL: Record<number, string[]> = {
    // Water starters
    7: ['water', 'normal', 'ice'], 8: ['water', 'normal', 'ice'], 9: ['water', 'ice', 'normal'],
    60: ['water', 'normal'], 61: ['water', 'fighting', 'normal'], 62: ['water', 'fighting', 'ice'],
    72: ['water', 'poison', 'normal'], 73: ['water', 'poison', 'ice'],
    86: ['water', 'ice', 'normal'], 87: ['water', 'ice', 'normal'],
    116: ['water', 'dragon', 'normal'], 117: ['water', 'dragon', 'ice'],
    120: ['water', 'psychic', 'normal'], 121: ['water', 'psychic', 'ice'],
    54: ['water', 'psychic', 'normal'], 55: ['water', 'psychic', 'ice'],
    // Grass/Poison
    1: ['grass', 'poison', 'normal'], 2: ['grass', 'poison', 'normal'], 3: ['grass', 'poison', 'normal'],
    43: ['grass', 'poison', 'normal'], 44: ['grass', 'poison', 'normal'], 45: ['grass', 'poison', 'normal'],
    69: ['grass', 'poison', 'normal'], 70: ['grass', 'poison', 'water'], 71: ['grass', 'poison', 'normal'],
    114: ['grass', 'normal', 'poison'],
    // Fire
    4: ['fire', 'normal', 'dragon'], 5: ['fire', 'normal', 'dragon'], 6: ['fire', 'flying', 'dragon'],
    37: ['fire', 'normal'], 38: ['fire', 'normal', 'psychic'],
    58: ['fire', 'normal', 'ground'], 59: ['fire', 'normal', 'ground'], 78: ['fire', 'normal'],
    // Electric
    25: ['electric', 'normal'], 26: ['electric', 'normal'],
    81: ['electric', 'steel'], 82: ['electric', 'steel'],
    100: ['electric', 'normal'], 101: ['electric', 'normal'],
    125: ['electric', 'fighting', 'normal'], 135: ['electric', 'normal'],
    // Ground/Rock
    50: ['ground', 'normal'], 51: ['ground', 'rock', 'normal'],
    74: ['rock', 'ground', 'fighting'], 75: ['rock', 'ground', 'fighting'], 76: ['rock', 'ground', 'fighting'],
    95: ['rock', 'ground', 'normal'],
    104: ['ground', 'rock', 'normal'], 105: ['ground', 'rock', 'fighting'],
    112: ['ground', 'rock', 'normal'], 111: ['ground', 'rock', 'normal'],
    31: ['ground', 'poison', 'normal'], 34: ['ground', 'fighting', 'poison'],
    // Fighting
    56: ['fighting', 'normal'], 57: ['fighting', 'normal'],
    66: ['fighting', 'rock', 'normal'], 67: ['fighting', 'rock', 'normal'], 68: ['fighting', 'rock', 'normal'],
    106: ['fighting', 'normal'], 107: ['fighting', 'fire', 'ice'],
    // Flying
    84: ['normal', 'flying', 'ground'], 85: ['normal', 'flying'],
    18: ['normal', 'flying'],
    // Psychic
    64: ['psychic', 'fighting', 'normal'], 65: ['psychic', 'fighting', 'normal'],
    122: ['psychic', 'normal', 'ice'],
    124: ['ice', 'psychic', 'normal'],
    // Poison/Ghost
    109: ['poison', 'fire', 'normal'], 110: ['poison', 'fire', 'normal'],
    89: ['poison', 'dark', 'normal'], 88: ['poison', 'normal'],
    24: ['poison', 'normal'], 23: ['poison', 'normal'],
    93: ['ghost', 'poison', 'normal'], 94: ['ghost', 'poison', 'dark'],
    // Ice
    91: ['water', 'ice', 'normal'],
    // Dragon
    147: ['dragon', 'water', 'normal'], 148: ['dragon', 'water', 'normal'], 149: ['dragon', 'fire', 'flying'],
    130: ['water', 'dragon', 'dark'],
    // Normal/others
    115: ['normal', 'fighting', 'ground'],
    143: ['normal', 'ground', 'ice'],
    // New opponents: fossils, eeveelutions, misc
    141: ['rock', 'water', 'normal'],        // Kabutops — Rock/Water fossil, Slash
    134: ['water', 'normal', 'ice'],         // Vaporeon — Water tank, Bite
    131: ['water', 'ice', 'normal'],         // Lapras — Water/Ice icon
    103: ['grass', 'psychic', 'normal'],     // Exeggutor — Grass/Psychic, Stomp
    97:  ['psychic', 'normal'],              // Hypno — Psychic, Hypnosis
    126: ['fire', 'fighting', 'normal'],     // Magmar — Fire Punch + Karate Chop
    142: ['rock', 'flying', 'normal'],       // Aerodactyl — Rock/Flying prehistoric
    136: ['fire', 'normal'],                 // Flareon
    133: ['normal'],                         // Eevee
};

function getMoveTypes(pok: Pokemon): string[] {
    const pool = MOVE_POOL[pok.id];
    if (pool) return pool;
    const types = pok.types.map(t => t.type.name);
    return types.length > 0 ? [...new Set([...types, 'normal'])] : ['normal'];
}

export function getAbilityInfo(name: string): { icon: string; desc: string; tier: string } {
    return ABILITY_INFO[name] || { icon: '◆', desc: name.replace(/-/g, ' '), tier: 'B' };
}

// ===================== FIGHTER CREATION =====================
export function createBattleFighter(pokemon: Pokemon, startingHP?: number): BattleFighter {
    const rawHP = pokemon.statsMap.hp * 3.2;
    const initialHP = Math.max(1, Math.round(Math.min(460, rawHP)));
    const abilityNames = pokemon.abilities.map(a => a.ability.name);
    const has = (n: string) => abilityNames.includes(n);

    const statsMap = { ...pokemon.statsMap };

    // Permanent stat boosts applied at creation
    if (has('huge-power') || has('pure-power')) statsMap.attack = Math.floor(statsMap.attack * 1.85);
    if (has('hustle')) statsMap.attack = Math.floor(statsMap.attack * 1.5);

    // Pull equipEffects if present (set by applyEquipmentToPokemon)
    const equipEffects: EquipBattleEffects = (pokemon as Pokemon & { equipEffects?: EquipBattleEffects }).equipEffects ?? emptyEquipEffects();

    return {
        id: pokemon.id,
        name: pokemon.name,
        imageFront: pokemon.sprites.front_default,
        imageBack: pokemon.sprites.back_default || pokemon.sprites.front_default,
        statsMap,
        currentHP: startingHP !== undefined ? Math.min(Math.max(0, startingHP), initialHP) : initialHP,
        initialHP,
        status: {},
        hauntdTurns: 0,
        pok: pokemon,
        abilityNames,
        atkMult: 1.0,
        defMult: 1.0,
        speedMult: 1.0,
        sturdyUsed: false,
        flashFireActive: false,
        sleepTurns: 0,
        isToxic: false,
        equipEffects,
        bleedTurns: 0,
    };
}

// ===================== ENTRY EFFECTS =====================
export function applyEntryEffects(
    entrant: BattleFighter,
    opponent: BattleFighter
): { msgs: string[]; newWeather?: WeatherType } {
    const msgs: string[] = [];
    const has = (n: string) => entrant.abilityNames.includes(n);

    if (has('intimidate')) {
        opponent.atkMult = Math.max(0.30, (opponent.atkMult ?? 1) * 0.80);
        msgs.push(`😤 ${entrant.name}: ЗАПУГИВАНИЕ — атака ${opponent.name} снижена на 20%!`);
    }

    let newWeather: WeatherType | undefined;
    if (has('drizzle')) {
        newWeather = 'rain';
        msgs.push(`🌧️ ${entrant.name}: ДОЖДЬ — водные атаки усилены, огненные ослаблены!`);
    }
    if (has('drought')) {
        newWeather = 'sun';
        msgs.push(`☀️ ${entrant.name}: ЗАСУХА — огненные атаки усилены, водные ослаблены!`);
    }
    if (has('sand-stream')) {
        newWeather = 'sand';
        msgs.push(`🏜️ ${entrant.name}: ПЕСКОСТРУЙ — начинается буря (3% HP каждый ход)!`);
    }

    return { msgs, newWeather };
}

// ===================== DOT DAMAGE =====================
export function applyDotDamage(fighter: BattleFighter): { damage: number; log: string } {
    if (fighter.abilityNames.includes('magic-guard')) {
        return { damage: 0, log: '' };
    }
    if (fighter.status.burn) {
        // Burn: 1/16 HP per turn (canon Gen VI+)
        const damage = Math.max(1, Math.floor(fighter.initialHP * 0.0625));
        return { damage, log: `🔥 ${fighter.name} горит: -${damage} HP!` };
    }
    if (fighter.status.poison) {
        if (fighter.isToxic) {
            // Toxic: stacking — 1/16, 2/16, 3/16... capped at 5/16
            fighter.hauntdTurns = Math.min(fighter.hauntdTurns + 1, 5);
            const damage = Math.max(1, Math.floor(fighter.initialHP * fighter.hauntdTurns * 0.0625));
            return { damage, log: `☠️ ${fighter.name}: ТОКСИН ×${fighter.hauntdTurns} — -${damage} HP!` };
        } else {
            // Regular PSN: flat 1/8 HP per turn (canon)
            const damage = Math.max(1, Math.floor(fighter.initialHP * 0.125));
            return { damage, log: `☠️ ${fighter.name} отравлен: -${damage} HP!` };
        }
    }
    return { damage: 0, log: '' };
}

// ===================== MAIN DAMAGE CALCULATION =====================
export interface DamageResult {
    damage: number;
    isCrit: boolean;
    logMessage: string;
    missed: boolean;
    healAmount: number;
    contactAbility: StatusName | null;
    contactMsg: string;
    triggerFlashFire: boolean;  // defender's Flash Fire was activated this hit
    attackType: string;         // which type was used this turn (for log)
    hasStab: boolean;           // STAB was applied
}

export function calculateDamage(
    attacker: BattleFighter,
    defender: BattleFighter,
    weather: WeatherType = 'none'
): DamageResult {
    // --- СТАБ + выбор типа атаки ---
    // Покемон случайно выбирает из своего пула ходов (STAB + coverage)
    const moveTypes = getMoveTypes(attacker.pok);
    const attType = moveTypes[Math.floor(Math.random() * moveTypes.length)];

    const defType1 = defender.pok.types?.[0]?.type.name || 'normal';
    const defType2 = defender.pok.types?.[1]?.type.name;

    // Смягчённая шкала эффективности: преимущество типа ощутимо, но не приговор
    // (огонь против воды страдает, но статы/уровень/предметы решают больше)
    let mult = (typeChart[attType]?.[defType1] ?? 1) * (defType2 ? (typeChart[attType]?.[defType2] ?? 1) : 1);
    if (mult >= 4) mult = 2.0;
    else if (mult >= 2) mult = 1.5;
    else if (mult > 0 && mult <= 0.25) mult = 0.62;
    else if (mult > 0 && mult < 1) mult = 0.72;

    // STAB: +50% если тип атаки совпадает с одним из типов покемона (канон)
    const hasStab = attacker.pok.types.some(t => t.type.name === attType);
    const stabMult = hasStab ? 1.5 : 1.0;

    const defHas = (n: string) => defender.abilityNames.includes(n);
    const attHas = (n: string) => attacker.abilityNames.includes(n);

    // Struggle: минимальный урон при иммунитете — предотвращает бесконечный бой
    // Снижен с 4% до 3%, чтобы иммунитеты имели больше значения
    const struggle = (logMessage: string, healAmount = 0): DamageResult => ({
        damage: healAmount > 0 ? 0 : Math.max(2, Math.floor(defender.initialHP * 0.03)),
        isCrit: false,
        logMessage,
        missed: false,
        healAmount,
        contactAbility: null,
        contactMsg: '',
        triggerFlashFire: false,
        attackType: attType,
        hasStab,
    });

    // --- Иммунитет по типу (mult === 0) ---
    if (mult === 0) return struggle('Не действует! 😓');

    // --- Levitate: иммунитет к Ground ---
    if (attType === 'ground' && defHas('levitate'))
        return struggle('🌀 ЛЕВИТАЦИЯ — не действует! 😓');

    // --- Absorb-способности: лечат ниже полного HP, блокируют (0 урона) на полном ---
    if (attType === 'water' && defHas('water-absorb')) {
        if (defender.currentHP < defender.initialHP) {
            const heal = Math.floor(defender.initialHP * 0.25);
            return struggle('💧 ВОДОПОГЛОЩЕНИЕ — лечит!', heal);
        }
        return { ...struggle('💧 Поглощено (HP полное)'), damage: 0 };
    }
    if (attType === 'electric' && defHas('volt-absorb')) {
        if (defender.currentHP < defender.initialHP) {
            const heal = Math.floor(defender.initialHP * 0.25);
            return struggle('⚡ ЭЛЕКТРОПОГЛОЩЕНИЕ — лечит!', heal);
        }
        return { ...struggle('⚡ Поглощено (HP полное)'), damage: 0 };
    }

    // --- Flash Fire: иммунитет к огню + активация флага ---
    if (attType === 'fire' && defHas('flash-fire')) {
        return {
            ...struggle('🔥 ОГНЕЩИТ — поглощено! Сила огня растёт!'),
            damage: 0,
            triggerFlashFire: true,
        };
    }

    // --- Wonder Guard: только суперэффективно ---
    if (defHas('wonder-guard') && mult < 2)
        return struggle('✨ ЧУДОЗАЩИТА — отражено! 😓');

    // --- Hustle промах ---
    if (attHas('hustle') && Math.random() < 0.25) {
        return {
            damage: 0, isCrit: false, logMessage: '🎲 УСЕРДИЕ — промах!', missed: true,
            healAmount: 0, contactAbility: null, contactMsg: '',
            triggerFlashFire: false, attackType: attType, hasStab,
        };
    }

    // --- Equipment-driven DODGE (defender) ---
    if (defender.equipEffects.dodge > 0 && Math.random() < defender.equipEffects.dodge) {
        return {
            damage: 0, isCrit: false, logMessage: '🌀 УВОРОТ — мимо!', missed: true,
            healAmount: 0, contactAbility: null, contactMsg: '',
            triggerFlashFire: false, attackType: attType, hasStab,
        };
    }

    // --- Эффективная атака ---
    let effectiveAtk = Math.max(attacker.statsMap.attack, attacker.statsMap['special-attack']);
    effectiveAtk = Math.floor(effectiveAtk * attacker.atkMult);

    // Ожог: -35% ATK (смягчено с канонных -50% — не приговор для физ. атакёров)
    if (attacker.status.burn) effectiveAtk = Math.floor(effectiveAtk * 0.65);
    // Паралич больше не снижает ATK (только скорость — канон Gen VII+)

    // Guts: статус → +50% ATK
    if (attHas('guts') && Object.values(attacker.status).some(Boolean))
        effectiveAtk = Math.floor(effectiveAtk * 1.5);

    // Стартовые бусты при HP < 33% (Blaze / Torrent / Overgrow / Swarm)
    const hpPct = attacker.currentHP / attacker.initialHP;
    if (hpPct < 0.33) {
        const starterBoost =
            (attType === 'fire'  && attHas('blaze'))   ||
            (attType === 'water' && attHas('torrent'))  ||
            (attType === 'grass' && attHas('overgrow')) ||
            (attType === 'bug'   && attHas('swarm'));
        if (starterBoost) effectiveAtk = Math.floor(effectiveAtk * 1.5);
    }

    // Flash Fire буст: активируется после поглощения огненной атаки
    if (attType === 'fire' && attHas('flash-fire') && attacker.flashFireActive)
        effectiveAtk = Math.floor(effectiveAtk * 1.3);

    const rawDef = Math.max(1, Math.max(defender.statsMap.defense, defender.statsMap['special-defense']));
    const effectiveDef = Math.floor(rawDef * defender.defMult);

    // Last Stand: атакующий ниже 20% HP — отчаянный рывок
    const attackerHpPct = attacker.currentHP / attacker.initialHP;
    let critBonus = 0;
    if (attackerHpPct < 0.20) {
        effectiveAtk = Math.floor(effectiveAtk * 1.20);
        critBonus = 0.12;
    }

    // --- Базовый урон ---
    // Формула скомпенсирована под STAB: (sqrt * 14.5 + 4) * 1.5 ≈ sqrt * 21.75 + 6
    // → среднее значение близко к прежнему sqrt * 22 + 6
    const variance = 0.85 + Math.random() * 0.30;
    let baseDamage = (Math.sqrt(effectiveAtk / Math.max(1, effectiveDef)) * 14.5 + 4) * variance * stabMult;

    // Крит: ×1.75 для зрелищности; шанс растёт со скоростью + бонус от снаряжения
    const effectiveSpeed = attacker.statsMap.speed * (attacker.speedMult ?? 1);
    const critChance = 0.065 + Math.min(0.13, effectiveSpeed / 1000) + critBonus + attacker.equipEffects.critBonus;
    const isCrit = Math.random() < critChance;
    if (isCrit) baseDamage *= 1.75;

    let total = Math.floor(baseDamage * mult);

    // Thick Fat: -50% от огня/льда
    if ((attType === 'fire' || attType === 'ice') && defHas('thick-fat'))
        total = Math.floor(total * 0.5);

    // Multiscale: -50% при полном HP
    if (defHas('multiscale') && defender.currentHP >= defender.initialHP)
        total = Math.floor(total * 0.5);

    // Дебаффы защитника
    if (defender.status.drenched)  total = Math.floor(total * 1.35);
    if (defender.status.slow)      total = Math.floor(total * 1.18);
    if (defender.status.confusion) total = Math.floor(total * 1.15);

    // Погода
    if (weather === 'rain') {
        if (attType === 'water') total = Math.floor(total * 1.30);
        if (attType === 'fire')  total = Math.floor(total * 0.70);
    } else if (weather === 'sun') {
        if (attType === 'fire')  total = Math.floor(total * 1.30);
        if (attType === 'water') total = Math.floor(total * 0.70);
    }

    // Sheer Force: +30%, убирает контактные эффекты
    const sheerForce = attHas('sheer-force');
    if (sheerForce) total = Math.floor(total * 1.3);

    // ── Equipment-driven type resist (defender) ──
    const typeResist = damageResistFromEquip(attType, defender.equipEffects);
    if (typeResist > 0) total = Math.floor(total * (1 - typeResist));
    // ── Physical resist (generic) ──
    if (defender.equipEffects.physResist > 0) total = Math.floor(total * (1 - defender.equipEffects.physResist));

    // Минимум 3% maxHP — нельзя стать бессмертным против иммунного
    const minDmg = Math.max(2, Math.floor(defender.initialHP * 0.03));
    total = Math.max(minDmg, total);

    // --- Лог-сообщение ---
    let logMessage = '';
    const stabTag = hasStab ? ' (STAB)' : '';
    if (mult >= 2.0) logMessage = `⚡⚡ НЕВЕРОЯТНО эффективно!!${stabTag}`;
    else if (mult > 1) logMessage = `⚡ Супер эффективно!${stabTag}`;
    else if (mult < 1)  logMessage = '😐 Не очень...';
    else if (hasStab)   logMessage = 'STAB';

    // --- Контактные способности защитника ---
    let contactAbility: StatusName | null = null;
    let contactMsg = '';
    if (!sheerForce) {
        if (defHas('static') && Math.random() < 0.3)         { contactAbility = 'paralysis'; contactMsg = '⚡ СТАТИК: атакующий парализован!'; }
        else if (defHas('flame-body') && Math.random() < 0.3) { contactAbility = 'burn';      contactMsg = '🔥 ОГНЕННОЕ ТЕЛО: атакующий поджён!'; }
        else if (defHas('poison-point') && Math.random() < 0.3) { contactAbility = 'poison'; contactMsg = '☠️ ЯД КОЖИ: атакующий отравлен!'; }
    }

    return {
        damage: Math.max(1, total),
        isCrit,
        logMessage,
        missed: false,
        healAmount: 0,
        contactAbility,
        contactMsg,
        triggerFlashFire: false,
        attackType: attType,
        hasStab,
    };
}

// ===================== ROUGH SKIN / IRON BARBS =====================
export function applyRoughSkin(attacker: BattleFighter, defender: BattleFighter): { damage: number; log: string } {
    if (defender.abilityNames.includes('rough-skin') || defender.abilityNames.includes('iron-barbs')) {
        const dmg = Math.max(1, Math.floor(attacker.initialHP * 0.05));
        const ability = defender.abilityNames.includes('rough-skin') ? 'ГРУБАЯ КОЖА' : 'ЖЕЛЕЗНЫЕ ШИП.';
        return { damage: dmg, log: `🩸 ${ability}: ${attacker.name} получает ${dmg} урона!` };
    }
    return { damage: 0, log: '' };
}

// ===================== STATUS APPLICATION =====================
export function tryApplyStatus(attacker: BattleFighter, attackType: string, defender?: BattleFighter): {
    status: StatusName | null;
    text: string;
    isToxic?: boolean;
    sleepTurns?: number;
} {
    const has = (n: string) => attacker.abilityNames.includes(n);
    if (has('sheer-force')) return { status: null, text: '' };
    // Defender status resist
    const baseChance = 0.28;
    const resist = defender?.equipEffects.statusResist ?? 0;
    const finalChance = baseChance * (1 - resist);
    if (Math.random() > finalChance) return { status: null, text: '' };
    switch (attackType) {
        case 'fire':     return { status: 'burn',      text: '🔥 получает ОЖОГ!' };
        case 'poison':   return { status: 'poison',    text: '☠️ получает ТОКСИН!', isToxic: true };
        case 'electric': return { status: 'paralysis', text: '⚡ получает ПАРАЛИЧ!' };
        case 'ice':      return { status: 'freeze',    text: '❄️ ЗАМОРОЖЕН!', sleepTurns: 1 + Math.floor(Math.random() * 2) };
        case 'grass':    return { status: 'sleep',     text: '🌿 СПОРЫ: УСЫПЛЁН!', sleepTurns: 2 + Math.floor(Math.random() * 2) };
        case 'water':    return { status: 'drenched',  text: '💧 ПРОМОК!' };
        case 'psychic':  return { status: 'confusion', text: '😵 получает ПУТАНИЦУ!' };
        case 'dark':     return { status: 'confusion', text: '🌑 ЗАМЕШАТЕЛЬСТВО!' };
        case 'rock':     return { status: 'slow',      text: '🪨 ОБЛОМКИ: ЗАМЕДЛЕН!' };
        case 'ghost':    return { status: 'confusion', text: '👻 СТРАХ: ЗАМЕШАТЕЛЬСТВО!' };
        case 'dragon':   return { status: 'drenched',  text: '🐉 ЧЕШУЯ: ПРОМОК!' };
        default:         return { status: null, text: '' };
    }
}

// ===================== TOURNAMENT BATTLE SIMULATION =====================
export function simulateBattle(pokemon1: Pokemon, pokemon2: Pokemon): { winner: 1 | 2; log: string[]; turns: number } {
    const f1 = createBattleFighter(pokemon1);
    const f2 = createBattleFighter(pokemon2);
    const log: string[] = [];

    let weather: WeatherType = 'none';
    let weatherTurns = 0;

    // Entry effects
    const e1 = applyEntryEffects(f1, f2);
    const e2 = applyEntryEffects(f2, f1);
    if (e1.newWeather) weather = e1.newWeather;
    if (e2.newWeather) weather = e2.newWeather;

    const p1Spd = f1.statsMap.speed * f1.speedMult;
    const p2Spd = f2.statsMap.speed * f2.speedMult;
    const ratio = Math.max(p1Spd, p2Spd) / Math.max(1, Math.min(p1Spd, p2Spd));
    let attackerId: 1 | 2 = ratio < 1.15
        ? (Math.random() < 0.5 ? 1 : 2)
        : (p1Spd >= p2Spd ? 1 : 2);

    let turns = 0;

    while (f1.currentHP > 0 && f2.currentHP > 0 && turns < 400) {
        const atk = attackerId === 1 ? f1 : f2;
        const def = attackerId === 1 ? f2 : f1;

        // Speed Boost
        if (atk.abilityNames.includes('speed-boost'))
            atk.speedMult = (atk.speedMult ?? 1) * 1.15;

        // Погода: только атакующий получает урон от песка за свой ход
        if (weather === 'sand') {
            const sandImmune = (f: BattleFighter) => {
                const t1 = f.pok.types?.[0]?.type.name ?? '';
                const t2 = f.pok.types?.[1]?.type.name ?? '';
                return ['rock', 'ground', 'steel'].some(t => t === t1 || t === t2)
                    || f.abilityNames.some(a => ['magic-guard', 'sand-veil', 'sand-rush', 'sand-force', 'overcoat'].includes(a));
            };
            if (!sandImmune(atk)) atk.currentHP = Math.max(0, atk.currentHP - Math.max(1, Math.floor(atk.initialHP * 0.03)));
        }

        // DoT
        if (atk.status.burn || atk.status.poison) {
            const { damage } = applyDotDamage(atk);
            atk.currentHP = Math.max(0, atk.currentHP - damage);
        }
        if (atk.currentHP <= 0) break;

        // Сон / Заморозка
        if (atk.status.sleep || atk.status.freeze) {
            atk.sleepTurns = Math.max(0, atk.sleepTurns - 1);
            const wakeChance = atk.status.sleep ? 0.33 : 0.25;
            if (atk.sleepTurns <= 0 || Math.random() < wakeChance) {
                if (atk.status.sleep) delete atk.status.sleep;
                else delete atk.status.freeze;
                atk.sleepTurns = 0;
            } else {
                attackerId = attackerId === 1 ? 2 : 1; turns++; continue;
            }
        }

        // Паралич: пропуск хода
        if (atk.status.paralysis && Math.random() < 0.25) {
            attackerId = attackerId === 1 ? 2 : 1; turns++; continue;
        }

        // Замешательство: удар по себе
        if (atk.status.confusion && Math.random() < 0.33) {
            atk.currentHP = Math.max(0, atk.currentHP - Math.floor(atk.initialHP * 0.12));
            attackerId = attackerId === 1 ? 2 : 1; turns++; continue;
        }

        // Атака
        const result = calculateDamage(atk, def, weather);

        // Активация Flash Fire у защитника
        if (result.triggerFlashFire) def.flashFireActive = true;

        if (result.healAmount > 0) {
            def.currentHP = Math.min(def.initialHP, def.currentHP + result.healAmount);
        } else if (!result.missed) {
            if (def.abilityNames.includes('sturdy') && !def.sturdyUsed && def.currentHP >= def.initialHP && result.damage >= def.currentHP) {
                def.currentHP = 1; def.sturdyUsed = true;
            } else {
                def.currentHP = Math.max(0, def.currentHP - result.damage);
            }
            log.push(`${atk.name} → ${def.name}: ${result.damage}${result.isCrit ? ' 💥' : ''}${result.hasStab ? ' [STAB]' : ''}`);
            const { damage: rsDmg } = applyRoughSkin(atk, def);
            if (rsDmg > 0) atk.currentHP = Math.max(0, atk.currentHP - rsDmg);
            if (result.contactAbility && !atk.status[result.contactAbility]) atk.status[result.contactAbility] = true;
            const { status: appS, isToxic, sleepTurns } = tryApplyStatus(atk, result.attackType);
            if (appS && !def.status[appS]) {
                def.status[appS] = true;
                if (isToxic) def.isToxic = true;
                if (sleepTurns) def.sleepTurns = sleepTurns;
            }
        }
        if (def.currentHP <= 0 && atk.abilityNames.includes('moxie'))
            atk.atkMult = (atk.atkMult ?? 1) * 1.25;

        // Погода: обновление длительности
        if (weather !== 'none') {
            weatherTurns++;
            if (weatherTurns >= 10) { weather = 'none'; weatherTurns = 0; }
        }

        attackerId = attackerId === 1 ? 2 : 1;
        turns++;
    }

    if (f1.currentHP <= 0 && f2.currentHP <= 0)
        return { winner: Math.random() < 0.5 ? 1 : 2, log, turns };
    return { winner: f1.currentHP > 0 ? 1 : 2, log, turns };
}
