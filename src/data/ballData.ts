// ─── Pokeball types ──────────────────────────────────────────────
export type BallId = 'pokeball' | 'great-ball' | 'ultra-ball' | 'master-ball';

export interface BallDef {
    id: BallId;
    name: string;
    icon: string;
    cost: number;
    baseRate: number;     // base catch chance for equal-level pokemon
    desc: string;
    unlockAfterOpp: number;
}

export const BALLS: BallDef[] = [
    {
        id: 'pokeball', name: 'Покебол', icon: '🔴', cost: 600, baseRate: 0.35,
        desc: '35% базово (зависит от разницы уровней)', unlockAfterOpp: 0,
    },
    {
        id: 'great-ball', name: 'Грейтбол', icon: '🔵', cost: 1500, baseRate: 0.60,
        desc: '60% базово, лучшая ловля сильных покемонов', unlockAfterOpp: 3,
    },
    {
        id: 'ultra-ball', name: 'Ультрабол', icon: '⚫', cost: 3500, baseRate: 0.85,
        desc: '85% базово, надёжный шар для редких', unlockAfterOpp: 8,
    },
    {
        id: 'master-ball', name: 'Мастербол', icon: '🟣', cost: 25000, baseRate: 1.0,
        desc: 'Гарантированная поимка (даже легендарных)', unlockAfterOpp: 14,
    },
];

// Catch chance = baseRate × levelDelta where:
//   if heroLevel >= pokemonLevel: 1.0
//   if pokemonLevel - heroLevel == 1..5: linearly drops to 0.5
//   if pokemonLevel - heroLevel > 5: drops to 0.15
// Master ball ignores the delta and is always 1.0
export function calcCatchChance(ballId: BallId, heroLevel: number, pokemonLevel: number): number {
    const ball = BALLS.find(b => b.id === ballId);
    if (!ball) return 0;
    if (ballId === 'master-ball') return 1.0;
    const heroBonus = Math.min(0.25, heroLevel * 0.005);
    const delta = pokemonLevel - heroLevel;
    let mult: number;
    if (delta <= 0) mult = 1.0 + Math.min(0.15, Math.abs(delta) * 0.02);
    else if (delta <= 5) mult = 1.0 - delta * 0.08;
    else if (delta <= 10) mult = 0.6 - (delta - 5) * 0.06;
    else mult = 0.2;
    return Math.max(0.08, Math.min(1, ball.baseRate * mult + heroBonus));
}

export function findBall(id: BallId): BallDef | undefined {
    return BALLS.find(b => b.id === id);
}
