export interface AIRoster {
    id: string;
    name: string;
    emoji: string;
    pokemonIds: number[];
}

export const AI_PARTICIPANTS: AIRoster[] = [
    { id: 'lt-storm',   name: 'Шторм',     emoji: '⛈️', pokemonIds: [26, 135, 145] },
    { id: 'aqua-king',  name: 'Аквакинг',  emoji: '🌊', pokemonIds: [134, 131, 130] },
    { id: 'inferno',    name: 'Инферно',   emoji: '🔥', pokemonIds: [59, 6, 38] },
    { id: 'iron-fist',  name: 'Кулак',     emoji: '🥊', pokemonIds: [68, 107, 106] },
    { id: 'frost',      name: 'Фрост',     emoji: '❄️', pokemonIds: [91, 124, 144] },
    { id: 'venom',      name: 'Веном',     emoji: '☠️', pokemonIds: [89, 94, 110] },
    { id: 'rocky',      name: 'Рокки',     emoji: '🗻', pokemonIds: [76, 112, 95] },
    { id: 'mindbreak',  name: 'Mindbreak', emoji: '🧠', pokemonIds: [65, 122, 103] },
    { id: 'sky-lord',   name: 'Небоход',   emoji: '🦅', pokemonIds: [18, 142, 146] },
    { id: 'shadow',     name: 'Шэдоу',     emoji: '👻', pokemonIds: [94, 51, 24] },
    { id: 'beast',      name: 'Зверь',     emoji: '🐺', pokemonIds: [59, 143, 115] },
    { id: 'rivermaw',   name: 'Риврмо',    emoji: '🦈', pokemonIds: [130, 91, 9] },
    { id: 'gladiator',  name: 'Гладиатор', emoji: '⚔️', pokemonIds: [68, 76, 143] },
    { id: 'ace',        name: 'Эйс',       emoji: '🃏', pokemonIds: [149, 6, 130] },
    { id: 'witch',      name: 'Ведьма',    emoji: '🔮', pokemonIds: [122, 65, 94] },
];

export type TournamentFormat = 'bracket-8' | 'bracket-16' | 'league-6';

export interface TournamentConfig {
    format: TournamentFormat;
    entryFee: number;
    prizePerRound: number;
    winBonus: number;
}

export function tournamentConfigs(heroLevel: number, defeatedCount: number): Record<TournamentFormat, TournamentConfig> {
    const power = Math.max(1, heroLevel + defeatedCount);
    const base = power * 45;
    return {
        'bracket-8': {
            format: 'bracket-8',
            entryFee: base * 4,
            prizePerRound: base * 5,
            winBonus: base * 15,
        },
        'bracket-16': {
            format: 'bracket-16',
            entryFee: base * 6,
            prizePerRound: base * 4,
            winBonus: base * 28,
        },
        'league-6': {
            format: 'league-6',
            entryFee: base * 5,
            prizePerRound: base * 3,
            winBonus: base * 20,
        },
    };
}

export function randomFormat(): TournamentFormat {
    const formats: TournamentFormat[] = ['bracket-8', 'bracket-16', 'league-6'];
    return formats[Math.floor(Math.random() * formats.length)];
}

export function pickParticipants(format: TournamentFormat): AIRoster[] {
    const count = format === 'bracket-16' ? 15 : format === 'bracket-8' ? 7 : 5;
    const shuffled = [...AI_PARTICIPANTS].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
}

export function formatLabel(f: TournamentFormat): string {
    if (f === 'bracket-8') return 'Сетка на 8';
    if (f === 'bracket-16') return 'Сетка на 16';
    return 'Лига на 6 (круговая)';
}

export function calcTournamentAiLevel(heroLevel: number, defeatedCount: number, strengthFactor: number, avgTeamLevel?: number): number {
    const effectiveLevel = Math.max(heroLevel, avgTeamLevel ?? heroLevel);
    const progress = effectiveLevel + defeatedCount;
    const base = Math.max(28, Math.round(18 + progress * 2.5));
    const championBeaten = defeatedCount >= 13;
    const penaltyFactor = championBeaten ? 0.88 : 1.1;
    return Math.min(100, Math.round(base * strengthFactor * penaltyFactor));
}

export function assignStrengthFactors(count: number): number[] {
    const factors: number[] = [];
    for (let i = 0; i < count; i++) {
        factors.push(0.85 + (i / Math.max(1, count - 1)) * 0.55 + (Math.random() - 0.5) * 0.08);
    }
    return factors.sort((a, b) => a - b);
}

export function seedBracket<T extends { id: string; strength: number }>(
    player: T,
    ais: T[],
): T[] {
    const sorted = [...ais].sort((a, b) => a.strength - b.strength);
    const half = Math.ceil(sorted.length / 2);
    const playerHalf = sorted.slice(0, half);
    const otherHalf = sorted.slice(half);
    playerHalf.sort(() => Math.random() - 0.5);
    otherHalf.sort(() => Math.random() - 0.5);
    const result: T[] = [player, ...playerHalf, ...otherHalf];
    while (result.length % 2 !== 0) result.pop();
    return result;
}
