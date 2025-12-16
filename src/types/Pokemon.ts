export interface PokemonType {
    slot: number;
    type: {
        name: string;
        url: string;
    };
}

export interface PokemonStat {
    base_stat: number;
    effort: number;
    stat: {
        name: string;
        url: string;
    };
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
        ability: { name: string; url: string; };
        is_hidden: boolean;
        slot: number;
    }[];
}

// ✅ ИСПРАВЛЕНО: Добавлены heal и dot
export type DamageType = 'normal' | 'critical' | 'dot' | 'heal';

export type StatusName = "burn" | "poison" | "confusion" | "paralysis" | "slow" | "drenched";

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
}

export interface BattleState {
    log: string[];
    isBattleActive: boolean;
    isProcessing: boolean;
    winner: 1 | 2 | null;
    fighters: Record<string, BattleFighter>;
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