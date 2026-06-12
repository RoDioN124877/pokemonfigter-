import React, { useState, useCallback, useEffect, useRef } from 'react';
import type { Pokemon } from '../types/Pokemon';
import { simulateBattle } from '../utils/battleUtils';
import BattleArena from './BattleArena';
import { useAchievementStore } from '../store/achievementStore';
import { useDayStore } from '../store/dayStore';
import { useQuickEquipStore } from '../store/quickEquipStore';
import { applyEquipmentToPokemon } from '../utils/equipUtils';

interface TournamentBracketProps {
    pokemons: Pokemon[];
    goToMenu: () => void;
}

interface Match {
    p1: Pokemon;
    p2: Pokemon;
    winner?: Pokemon;
}

interface Round {
    matches: Match[];
    label: string;
}

interface LiveBattle {
    roundIdx: number;
    matchIdx: number;
    p1: Pokemon;
    p2: Pokemon;
}

function buildFirstRound(pokemons: Pokemon[]): Round {
    const matches: Match[] = [];
    for (let i = 0; i < pokemons.length - 1; i += 2) {
        matches.push({ p1: pokemons[i], p2: pokemons[i + 1] });
    }
    return { matches, label: 'Раунд 1' };
}

function roundLabel(roundIdx: number, totalRounds: number): string {
    const fromEnd = totalRounds - 1 - roundIdx;
    if (fromEnd === 0) return 'ФИНАЛ';
    if (fromEnd === 1) return 'Полуфинал';
    return `Раунд ${roundIdx + 1}`;
}

const MatchCard: React.FC<{
    match: Match;
    onFight: () => void;
    onSimulate: () => void;
}> = ({ match, onFight, onSimulate }) => (
    <div className={`trn-match ${match.winner ? 'done' : 'pending'}`}>
        <div className={`trn-fighter ${match.winner?.id === match.p1.id ? 'winner' : match.winner ? 'loser' : ''}`}>
            <img src={match.p1.sprites.front_default} alt={match.p1.name} className="trn-sprite" />
            <span className="trn-name">{match.p1.name}</span>
        </div>

        <div className="trn-vs">
            {match.winner ? (
                <span className="trn-done-mark">✓</span>
            ) : (
                <div className="trn-btn-group">
                    <button className="trn-fight-btn" onClick={onFight} title="Живой бой">⚔️ БОЙ</button>
                    <button className="trn-sim-btn" onClick={onSimulate} title="Быстрая симуляция">⚡</button>
                </div>
            )}
        </div>

        <div className={`trn-fighter trn-fighter-right ${match.winner?.id === match.p2.id ? 'winner' : match.winner ? 'loser' : ''}`}>
            <img src={match.p2.sprites.front_default} alt={match.p2.name} className="trn-sprite" />
            <span className="trn-name">{match.p2.name}</span>
        </div>
    </div>
);

const TournamentBracket: React.FC<TournamentBracketProps> = ({ pokemons, goToMenu }) => {
    const totalRounds = Math.ceil(Math.log2(pokemons.length)) + 1;
    const [rounds, setRounds] = useState<Round[]>([buildFirstRound(pokemons)]);
    const [liveBattle, setLiveBattle] = useState<LiveBattle | null>(null);

    const currentRoundIdx = rounds.length - 1;
    const currentRound = rounds[currentRoundIdx];
    const allDone = currentRound.matches.every(m => m.winner);
    const champion = allDone && currentRound.matches.length === 1 ? currentRound.matches[0].winner : null;

    // Record completed tournament once for achievements
    const recordTournamentEnd = useAchievementStore(s => s.recordTournamentEnd);
    const recordTournamentWonDay = useAchievementStore(s => s.recordTournamentWonDay);
    const tournamentRecorded = useRef(false);
    useEffect(() => {
        if (champion && !tournamentRecorded.current) {
            tournamentRecorded.current = true;
            recordTournamentEnd(true);
            recordTournamentWonDay(useDayStore.getState().currentDay);
        }
    }, [champion, recordTournamentEnd, recordTournamentWonDay]);

    const recordWinner = useCallback((roundIdx: number, matchIdx: number, winner: Pokemon) => {
        setRounds(prev => prev.map((r, ri) =>
            ri !== roundIdx ? r : {
                ...r,
                matches: r.matches.map((m, mi) => mi !== matchIdx ? m : { ...m, winner }),
            }
        ));
    }, []);

    const equipped = useCallback((p: Pokemon) => {
        const eq = useQuickEquipStore.getState().loadouts[p.id] ?? {};
        return applyEquipmentToPokemon(p, eq);
    }, []);

    const simulateMatch = useCallback((roundIdx: number, matchIdx: number) => {
        const match = rounds[roundIdx].matches[matchIdx];
        if (match.winner) return;
        const { winner: w } = simulateBattle(equipped(match.p1), equipped(match.p2));
        recordWinner(roundIdx, matchIdx, w === 1 ? match.p1 : match.p2);
    }, [rounds, recordWinner, equipped]);

    const simulateAll = useCallback(() => {
        setRounds(prev => prev.map((r, ri) =>
            ri !== prev.length - 1 ? r : {
                ...r,
                matches: r.matches.map(m => {
                    if (m.winner) return m;
                    const { winner: w } = simulateBattle(equipped(m.p1), equipped(m.p2));
                    return { ...m, winner: w === 1 ? m.p1 : m.p2 };
                }),
            }
        ));
    }, [equipped]);

    const advanceRound = useCallback(() => {
        const winners = currentRound.matches.map(m => m.winner!);
        if (winners.length < 2) return;
        const newMatches: Match[] = [];
        for (let i = 0; i + 1 < winners.length; i += 2) {
            newMatches.push({ p1: winners[i], p2: winners[i + 1] });
        }
        const label = roundLabel(rounds.length, totalRounds);
        setRounds(prev => [...prev, { matches: newMatches, label }]);
    }, [currentRound, rounds.length, totalRounds]);

    const handleLiveBattleEnd = useCallback((winnerNum: 1 | 2) => {
        if (!liveBattle) return;
        const winner = winnerNum === 1 ? liveBattle.p1 : liveBattle.p2;
        recordWinner(liveBattle.roundIdx, liveBattle.matchIdx, winner);
        setLiveBattle(null);
    }, [liveBattle, recordWinner]);

    // ── Live battle mode ──
    if (liveBattle) {
        return (
            <div className="tournament-live-wrap">
                <div className="trn-live-header">
                    <span className="trn-live-label">🏆 ТУРНИР — {currentRound.label}</span>
                    <button className="trn-back-btn" onClick={() => setLiveBattle(null)}>← Назад к сетке</button>
                </div>
                <BattleArena
                    team1={[equipped(liveBattle.p1)]}
                    team2={[equipped(liveBattle.p2)]}
                    maxSize={1}
                    goToMenu={() => setLiveBattle(null)}
                    onBattleEnd={handleLiveBattleEnd}
                    countsForStats={false}
                />
            </div>
        );
    }

    // ── Bracket view ──
    return (
        <div className="tournament-screen">
            <div className="trn-header">
                <h1 className="trn-title">🏆 ТУРНИР</h1>
                <button className="exe" onClick={goToMenu}>EXIT</button>
            </div>

            {/* Round tabs */}
            <div className="trn-round-tabs">
                {rounds.map((r, i) => (
                    <span key={i} className={`trn-round-tab ${i === currentRoundIdx ? 'active' : ''}`}>
                        {r.label}
                    </span>
                ))}
            </div>

            {/* Champion */}
            {champion && (
                <div className="trn-champion">
                    <div className="trn-champ-label">🏆 ЧЕМПИОН</div>
                    <img src={champion.sprites.front_default} alt={champion.name} className="trn-champ-sprite" />
                    <div className="trn-champ-name">{champion.name}</div>
                    <button className="menu-button" style={{ marginTop: 16 }} onClick={goToMenu}>В МЕНЮ</button>
                </div>
            )}

            {/* Matches */}
            {!champion && (
                <div className="trn-matches">
                    <div className="trn-round-label">{currentRound.label}</div>
                    {currentRound.matches.map((match, idx) => (
                        <MatchCard
                            key={idx}
                            match={match}
                            onFight={() => setLiveBattle({
                                roundIdx: currentRoundIdx,
                                matchIdx: idx,
                                p1: match.p1,
                                p2: match.p2,
                            })}
                            onSimulate={() => simulateMatch(currentRoundIdx, idx)}
                        />
                    ))}
                </div>
            )}

            {/* Controls */}
            {!champion && (
                <div className="trn-controls">
                    {!allDone && (
                        <button className="menu-button" onClick={simulateAll}>
                            ⚡ Симулировать все
                        </button>
                    )}
                    {allDone && currentRound.matches.length > 1 && (
                        <button className="menu-button" onClick={advanceRound}>
                            Следующий раунд →
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

export default TournamentBracket;
