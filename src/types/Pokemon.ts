export interface PokemonType {
    slot: number;
    type: { name: string; url: string };
}

export interface PokemonStat {
    base_stat: number;
    effort: number;
    stat: { name: string; url: string };
}

export interface Pokemon {
    id: number;
    name: string;
    sprites: {
        front_default: string;
        back_default?: string;
    };
    types: PokemonType[];
    statsMap: Record<string, number> & {
        hp: number;
        attack: number;
        defense: number;
        speed: number;
        'special-attack': number;
        'special-defense': number;
    };
    height: number;
    weight: number;
    stats: PokemonStat[];
    abilities: {
        ability: { name: string; url: string };
        is_hidden: boolean;
        slot: number;
    }[];
}

export type DamageType = 'normal' | 'critical' | 'dot' | 'heal';

export type WeatherType = 'none' | 'rain' | 'sun' | 'sand';

export type StatusName = 'burn' | 'poison' | 'confusion' | 'paralysis' | 'sleep' | 'freeze' | 'slow' | 'drenched' | 'bleed';

// Buffs/effects from equipment that travel into the battle fighter
export interface EquipBattleEffects {
    extraTypes: string[];        // e.g. ['electric'] makes any pokemon gain that STAB
    bleedChance: number;         // 0..1 chance per hit to apply bleed (4% maxHP/3 turns)
    vampirism: number;           // 0..1 — heal % of damage dealt
    lifesteal: number;           // 0..1 — heal flat % maxHP on KO
    critBonus: number;           // additive to crit chance
    fireResist: number;          // 0..1 damage reduction vs fire
    waterResist: number;
    electricResist: number;
    iceResist: number;
    grassResist: number;
    psychicResist: number;
    rockResist: number;
    groundResist: number;
    physResist: number;          // generic incoming reduction
    statusResist: number;        // 0..1 reduce chance of incoming status
    thorns: number;              // 0..1 — reflect % of damage taken
    dodge: number;               // 0..1 — chance to avoid attack
}

export const emptyEquipEffects = (): EquipBattleEffects => ({
    extraTypes: [],
    bleedChance: 0, vampirism: 0, lifesteal: 0, critBonus: 0,
    fireResist: 0, waterResist: 0, electricResist: 0, iceResist: 0,
    grassResist: 0, psychicResist: 0, rockResist: 0, groundResist: 0,
    physResist: 0, statusResist: 0, thorns: 0, dodge: 0,
});

export interface BattleFighter {
    id: number;
    name: string;
    imageFront: string;
    imageBack: string;
    currentHP: number;
    initialHP: number;
    hauntdTurns: number;
    pok: Pokemon;
    statsMap: Record<string, number>;
    status: Partial<Record<StatusName, boolean>>;
    // Ability system
    abilityNames: string[];
    atkMult: number;
    defMult: number;
    speedMult: number;
    sturdyUsed: boolean;
    // Canon additions
    flashFireActive: boolean;  // Flash Fire absorbed a fire hit → own fire attacks boosted
    sleepTurns: number;        // Remaining turns for sleep / freeze
    isToxic: boolean;          // Poison is Toxic (stacking) vs regular PSN (flat)
    // Equipment-driven battle effects
    equipEffects: EquipBattleEffects;
    bleedTurns: number;
}

export interface BattleStats {
    p1DamageDealt: number;
    p2DamageDealt: number;
    p1Crits: number;
    p2Crits: number;
    p1KOs: number;
    p2KOs: number;
    totalTurns: number;
}

export const emptyStats = (): BattleStats => ({
    p1DamageDealt: 0, p2DamageDealt: 0,
    p1Crits: 0, p2Crits: 0,
    p1KOs: 0, p2KOs: 0,
    totalTurns: 0,
});

export interface BattleState {
    log: string[];
    isBattleActive: boolean;
    isProcessing: boolean;
    winner: 1 | 2 | null;
    fighters: Record<string, BattleFighter>;
    weather: WeatherType;
    weatherTurns: number;
    battleStats: BattleStats;
}

export interface TurnQueueItem {
    key: string;
    name: string;
    img: string;
    isCurrent: boolean;
}

export interface AppState {
    allPokemons: Pokemon[];
    team1: Pokemon[];
    team2: Pokemon[];
    maxTeamSize: 1 | 3;
    currentMode: 'menu' | 'selection' | 'battle';
}
