// ─── Team-based battle simulation ─────────────────────────────────
// Used for AI vs AI tournament fights and "skip" option for player.
// Re-uses single-pokemon simulateBattle() from battleUtils.

import type { Pokemon } from '../types/Pokemon';
import { simulateBattle as simSingle } from './battleUtils';

export interface TeamSimResult {
    winner: 1 | 2;
    rounds: { aliveName: string; foeName: string; aliveTurns: number }[];
    totalTurns: number;
}

// Cycle through pokemon front-to-back; whichever team runs out loses
export function simulateTeamBattle(team1: Pokemon[], team2: Pokemon[]): TeamSimResult {
    let i1 = 0, i2 = 0;
    const rounds: TeamSimResult['rounds'] = [];
    let totalTurns = 0;
    let guard = 0;

    while (i1 < team1.length && i2 < team2.length && guard < 40) {
        guard++;
        const p1 = team1[i1];
        const p2 = team2[i2];
        const res = simSingle(p1, p2);
        totalTurns += res.turns;
        if (res.winner === 1) {
            rounds.push({ aliveName: p1.name, foeName: p2.name, aliveTurns: res.turns });
            i2++;
        } else {
            rounds.push({ aliveName: p2.name, foeName: p1.name, aliveTurns: res.turns });
            i1++;
        }
    }
    return {
        winner: i2 >= team2.length ? 1 : 2,
        rounds,
        totalTurns,
    };
}

// Power score = used for odds calculation in betting
export function calcTeamPower(team: Pokemon[]): number {
    if (team.length === 0) return 1;
    return team.reduce((sum, p) => {
        const s = p.statsMap;
        return sum + s.hp * 1.5 + s.attack + s.defense + s.speed * 0.8 + s['special-attack'] + s['special-defense'];
    }, 0) / team.length;
}
