import React, { useMemo, useState } from 'react';
import { useProgressStore } from '../store/progressStore';
import { useStoryStore } from '../store/storyStore';
import { useDayStore } from '../store/dayStore';
import { fetchPokemonsByIds } from '../services/ApiService';
import { scalePokemonToLevel } from '../utils/progressUtils';
import { applyEquipmentToPokemon } from '../utils/equipUtils';
import { simulateTeamBattle, calcTeamPower } from '../utils/battleSimulation';
import {
    pickParticipants, tournamentConfigs, formatLabel,
    calcTournamentAiLevel, assignStrengthFactors, seedBracket,
} from '../data/tournamentData';
import type { AIRoster, TournamentFormat } from '../data/tournamentData';
import type { Pokemon } from '../types/Pokemon';
import BattleArena from './BattleArena';
import { gameplayStart, gameplayStop } from '../utils/ysdk';

type Phase = 'intro' | 'lobby' | 'bet' | 'round-watch' | 'round-watching' | 'final-result';

interface Participant {
    id: string;
    name: string;
    emoji: string;
    team: Pokemon[];
    eliminated: boolean;
    power: number;
    strength: number;
    sprite: string;
}

interface Match {
    round: number;
    a: Participant;
    b: Participant;
    winner?: Participant;
    completed: boolean;
    isPlayerMatch: boolean;
}

interface BetResult {
    won: boolean;
    amount: number;
    payout: number;
    odds: number;
    pickedName: string;
}

const PLAYER_ID = '__player__';

const ROUND_NAMES: Record<number, Record<number, string>> = {
    3: { 0: 'Четвертьфинал', 1: 'Полуфинал', 2: 'Финал' },
    4: { 0: '1/8 финала', 1: 'Четвертьфинал', 2: 'Полуфинал', 3: 'Финал' },
};

const Tournament: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    const progress = useProgressStore();
    const dayStore = useDayStore();
    const nextFormat = useStoryStore(s => s.nextTournamentFormat);
    const rollNextTournament = useStoryStore(s => s.rollNextTournament);
    const [phase, setPhase] = useState<Phase>('intro');
    const [format, setFormat] = useState<TournamentFormat>(nextFormat);
    const [participants, setParticipants] = useState<Participant[]>([]);
    const [matches, setMatches] = useState<Match[]>([]);
    const [roundIdx, setRoundIdx] = useState(0);
    const [matchIdx, setMatchIdx] = useState(0);
    const [loading, setLoading] = useState(false);
    const [bet, setBet] = useState<{ matchId: number; pickId: string; amount: number } | null>(null);
    const [betResult, setBetResult] = useState<BetResult | null>(null);
    const [playerWatchMode, setPlayerWatchMode] = useState<'watch' | 'simulate-all'>('watch');
    const [tournamentEnded, setTournamentEnded] = useState<{ winnerId: string; finalScore: number } | null>(null);
    const [score, setScore] = useState(0);
    const [rounds, setRounds] = useState(0);
    const [matchLog, setMatchLog] = useState<string[]>([]);
    const [playerHPCarry, setPlayerHPCarry] = useState<number[] | undefined>(undefined);
    const totalRounds = format === 'bracket-16' ? 4 : format === 'bracket-8' ? 3 : 1;

    const cfg = useMemo(() => tournamentConfigs(progress.heroLevel, progress.defeatedCount)[format], [format, progress.heroLevel, progress.defeatedCount]);
    const canPlay = dayStore.canPlayTournament();

    const startTournament = async () => {
        if (!canPlay) return;
        if (!progress.spendMoney(cfg.entryFee)) {
            alert('Недостаточно денег!');
            return;
        }
        dayStore.useTournament();
        const f = nextFormat;
        setFormat(f);
        setLoading(true);
        setPhase('lobby');
        setScore(0); setRounds(0); setTournamentEnded(null);
        setMatchLog([]); setPlayerHPCarry(undefined); setBetResult(null);

        const playerTeam = progress.getTeam().map(o => applyEquipmentToPokemon(scalePokemonToLevel(o.data, o.level), o.equipment));
        const playerPower = calcTeamPower(playerTeam);
        const player: Participant & { strength: number } = {
            id: PLAYER_ID, name: 'Вы', emoji: '👤',
            team: playerTeam, eliminated: false, power: playerPower,
            strength: 0, sprite: playerTeam[0]?.sprites.front_default ?? '',
        };

        const aiList = pickParticipants(f);
        const allIds = [...new Set(aiList.flatMap(a => a.pokemonIds))];
        const fetchedPoks = await fetchPokemonsByIds(allIds);
        const factors = assignStrengthFactors(aiList.length);

        const avgTeamLevel = Math.round(progress.getTeam().reduce((s, o) => s + o.level, 0) / Math.max(1, progress.getTeam().length));
        const aiParticipants: Participant[] = aiList.map((ai: AIRoster, idx: number) => {
            const lvl = calcTournamentAiLevel(progress.heroLevel, progress.defeatedCount, factors[idx], avgTeamLevel);
            const team = ai.pokemonIds
                .map(id => fetchedPoks.find(p => p.id === id))
                .filter((p): p is Pokemon => !!p)
                .map(p => scalePokemonToLevel(p, lvl));
            return {
                id: ai.id, name: ai.name, emoji: ai.emoji,
                team, eliminated: false, power: calcTeamPower(team),
                strength: factors[idx],
                sprite: team[0]?.sprites.front_default ?? '',
            };
        });

        let seeded: Participant[];
        if (f === 'league-6') {
            seeded = [player, ...aiParticipants.sort(() => Math.random() - 0.5)];
        } else {
            seeded = seedBracket(player, aiParticipants);
        }
        setParticipants(seeded);
        setMatches(buildFirstRound(seeded, f));
        setRoundIdx(0);
        setMatchIdx(0);
        setLoading(false);
        setPhase('round-watch');
    };

    const buildFirstRound = (parts: Participant[], f: TournamentFormat): Match[] => {
        if (f === 'league-6') {
            const out: Match[] = [];
            for (let i = 0; i < parts.length; i++) {
                for (let j = i + 1; j < parts.length; j++) {
                    out.push({
                        round: 0, a: parts[i], b: parts[j], completed: false,
                        isPlayerMatch: parts[i].id === PLAYER_ID || parts[j].id === PLAYER_ID,
                    });
                }
            }
            return out;
        }
        const out: Match[] = [];
        for (let i = 0; i < parts.length; i += 2) {
            if (parts[i + 1]) {
                out.push({
                    round: 0, a: parts[i], b: parts[i + 1], completed: false,
                    isPlayerMatch: parts[i].id === PLAYER_ID || parts[i + 1].id === PLAYER_ID,
                });
            }
        }
        return out;
    };

    const currentMatch = matches[matchIdx];
    const playerInMatch = currentMatch?.isPlayerMatch;

    const playMatch = (match: Match) => {
        const sim = simulateTeamBattle(match.a.team, match.b.team);
        const winner = sim.winner === 1 ? match.a : match.b;
        setMatchLog(l => [`${match.a.emoji} ${match.a.name} VS ${match.b.emoji} ${match.b.name} → ${winner.emoji} ${winner.name}`, ...l].slice(0, 8));
        return winner;
    };

    const finishMatch = (winner: Participant) => {
        const m = currentMatch;
        if (!m) return;
        const newMatches = matches.map((mm, i) => i === matchIdx ? { ...mm, winner, completed: true } : mm);
        if (format !== 'league-6') {
            const loserId = winner.id === m.a.id ? m.b.id : m.a.id;
            setParticipants(p => p.map(pp => pp.id === loserId ? { ...pp, eliminated: true } : pp));
        }
        if (bet && bet.matchId === matchIdx) {
            const won = bet.pickId === winner.id;
            const odds = calcOdds(m.a, m.b, bet.pickId);
            const payout = won ? Math.floor(bet.amount * odds) : 0;
            if (won) progress.addMoney(payout);
            const pickedName = participants.find(p => p.id === bet.pickId)?.name ?? '?';
            setBetResult({ won, amount: bet.amount, payout, odds, pickedName });
            setMatchLog(l => [won ? `💰 Ставка выиграла! +${payout.toLocaleString()}G` : `💸 Ставка проиграна.`, ...l]);
            setBet(null);
        }
        if (m.isPlayerMatch) {
            const aiLvl = m.a.id === PLAYER_ID ? m.b.team[0] : m.a.team[0];
            const oppLevel = aiLvl ? Math.round((aiLvl.statsMap.attack - 5) * 100 / (2 * 80)) || 20 : 20;
            if (winner.id === PLAYER_ID) {
                const earn = cfg.prizePerRound;
                progress.addMoney(earn);
                setScore(s => s + earn);
                setRounds(r => r + 1);
                progress.giveExpToTeam(oppLevel, true);
                progress.giveHeroXp(oppLevel, true, false);
            } else {
                progress.giveExpToTeam(oppLevel, false);
                progress.giveHeroXp(oppLevel, false, false);
            }
        }
        const nextIdx = matchIdx + 1;
        if (nextIdx < newMatches.length) {
            setMatches(newMatches);
            setMatchIdx(nextIdx);
            setPhase('round-watch');
        } else {
            const playerEliminated = format !== 'league-6' && newMatches.some(mm => mm.isPlayerMatch && mm.winner && mm.winner.id !== PLAYER_ID);
            if (format === 'league-6') {
                const wins: Record<string, number> = {};
                newMatches.forEach(mm => { if (mm.winner) wins[mm.winner.id] = (wins[mm.winner.id] ?? 0) + 1; });
                const sorted = Object.entries(wins).sort((a, b) => b[1] - a[1]);
                const winnerId = sorted[0]?.[0] ?? PLAYER_ID;
                if (winnerId === PLAYER_ID) {
                    progress.addMoney(cfg.winBonus);
                    setScore(s => s + cfg.winBonus);
                }
                setTournamentEnded({ winnerId, finalScore: score + (winnerId === PLAYER_ID ? cfg.winBonus : 0) });
                setMatches(newMatches);
                setPhase('final-result');
                rollNextTournament();
                return;
            }
            const winners = newMatches.filter(mm => mm.round === roundIdx).map(mm => mm.winner!).filter(Boolean);
            if (winners.length <= 1 || playerEliminated) {
                if (winners.length === 1 && winners[0].id === PLAYER_ID) {
                    progress.addMoney(cfg.winBonus);
                    setScore(s => s + cfg.winBonus);
                    setTournamentEnded({ winnerId: PLAYER_ID, finalScore: score + cfg.winBonus });
                } else {
                    setTournamentEnded({ winnerId: winners[0]?.id ?? '?', finalScore: score });
                }
                setMatches(newMatches);
                setPhase('final-result');
                rollNextTournament();
                return;
            }
            const next: Match[] = [];
            for (let i = 0; i < winners.length; i += 2) {
                if (winners[i + 1]) {
                    next.push({
                        round: roundIdx + 1, a: winners[i], b: winners[i + 1], completed: false,
                        isPlayerMatch: winners[i].id === PLAYER_ID || winners[i + 1].id === PLAYER_ID,
                    });
                }
            }
            setMatches([...newMatches, ...next]);
            setMatchIdx(newMatches.length);
            setRoundIdx(r => r + 1);
            setPhase('round-watch');
        }
    };

    const calcOdds = (a: Participant, b: Participant, pickId: string): number => {
        const ratio = pickId === a.id ? b.power / a.power : a.power / b.power;
        return Math.max(1.1, Math.min(5, ratio * 1.3));
    };

    const handleBattleEnd = (winner: 1 | 2, finalHP?: number[]) => {
        gameplayStop();
        const m = currentMatch;
        if (!m) return;
        if (finalHP) {
            const playerWasOnSide1 = m.a.id === PLAYER_ID;
            const playerWon = (playerWasOnSide1 && winner === 1) || (!playerWasOnSide1 && winner === 2);
            if (playerWon) setPlayerHPCarry(finalHP);
        }
        const w = winner === 1 ? m.a : m.b;
        finishMatch(w);
    };

    // ─── Bracket visualization ───
    const BracketView: React.FC = () => {
        if (format === 'league-6') return <LeagueTable />;
        const roundNames = ROUND_NAMES[totalRounds] ?? {};
        const roundGroups: Match[][] = [];
        for (let r = 0; r <= roundIdx; r++) {
            roundGroups.push(matches.filter(m => m.round === r));
        }
        const pendingRounds = totalRounds - roundGroups.length;
        for (let i = 0; i < pendingRounds; i++) {
            const prevCount = roundGroups[roundGroups.length - 1]?.length ?? 0;
            const slots = Math.max(1, Math.floor(prevCount / 2));
            roundGroups.push(Array.from({ length: slots }, () => null as unknown as Match));
        }

        return (
            <div style={{ display: 'flex', gap: 8, overflowX: 'auto', padding: '8px 0', marginBottom: 14 }}>
                {roundGroups.map((rMatches, rIdx) => (
                    <div key={rIdx} style={{ minWidth: 140, flex: '0 0 auto' }}>
                        <div style={{ color: '#fbbf24', fontSize: 10, fontWeight: 700, textAlign: 'center', marginBottom: 6, textTransform: 'uppercase' }}>
                            {roundNames[rIdx] ?? `Раунд ${rIdx + 1}`}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, justifyContent: 'space-around', height: '100%' }}>
                            {rMatches.map((m, mIdx) => {
                                if (!m) return (
                                    <div key={mIdx} style={{
                                        border: '1px dashed #1e293b', borderRadius: 8,
                                        padding: '8px 6px', textAlign: 'center', color: '#334155', fontSize: 10,
                                    }}>?? vs ??</div>
                                );
                                const isCurrent = matches.indexOf(m) === matchIdx && phase === 'round-watch';
                                return (
                                    <div key={mIdx} style={{
                                        border: `2px solid ${isCurrent ? '#fbbf24' : m.completed ? '#15803d' : '#1e293b'}`,
                                        borderRadius: 8, padding: '6px 8px', background: isCurrent ? '#1a1a00' : '#0a1628',
                                        position: 'relative',
                                    }}>
                                        {isCurrent && (
                                            <div style={{
                                                position: 'absolute', top: -8, right: 6, background: '#fbbf24',
                                                color: '#000', fontSize: 8, fontWeight: 800, padding: '1px 5px',
                                                borderRadius: 4,
                                            }}>СЕЙЧАС</div>
                                        )}
                                        <BracketSlot p={m.a} isWinner={m.winner?.id === m.a.id} />
                                        <div style={{ color: '#475569', fontSize: 9, textAlign: 'center', margin: '2px 0' }}>vs</div>
                                        <BracketSlot p={m.b} isWinner={m.winner?.id === m.b.id} />
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    const BracketSlot: React.FC<{ p: Participant; isWinner: boolean }> = ({ p, isWinner }) => (
        <div style={{
            display: 'flex', alignItems: 'center', gap: 4, padding: '2px 4px',
            borderRadius: 4, background: isWinner ? 'rgba(74,222,128,0.12)' : 'transparent',
            opacity: p.eliminated && !isWinner ? 0.4 : 1,
        }}>
            <img
                src={p.sprite} alt=""
                style={{ width: 20, height: 20, imageRendering: 'pixelated', flexShrink: 0 }}
                onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
            <span style={{
                color: isWinner ? '#4ade80' : p.id === PLAYER_ID ? '#93c5fd' : '#cbd5e1',
                fontSize: 10, fontWeight: isWinner || p.id === PLAYER_ID ? 700 : 400,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
                {p.name}
            </span>
            {isWinner && <span style={{ color: '#4ade80', fontSize: 9, marginLeft: 'auto' }}>✓</span>}
        </div>
    );

    const LeagueTable: React.FC = () => {
        const wins: Record<string, number> = {};
        participants.forEach(p => { wins[p.id] = 0; });
        matches.filter(m => m.completed && m.winner).forEach(m => { wins[m.winner!.id] = (wins[m.winner!.id] ?? 0) + 1; });
        const sorted = [...participants].sort((a, b) => (wins[b.id] ?? 0) - (wins[a.id] ?? 0));
        return (
            <div style={{ marginBottom: 14 }}>
                <div style={{ color: '#fbbf24', fontSize: 11, fontWeight: 700, marginBottom: 6 }}>📊 ТАБЛИЦА ЛИГИ</div>
                {sorted.map((p, i) => (
                    <div key={p.id} style={{
                        display: 'flex', alignItems: 'center', gap: 6, padding: '4px 8px',
                        background: i === 0 ? 'rgba(251,191,36,0.08)' : p.id === PLAYER_ID ? 'rgba(59,130,246,0.08)' : 'transparent',
                        borderRadius: 6, marginBottom: 2,
                    }}>
                        <span style={{ color: '#475569', fontSize: 11, width: 16 }}>{i + 1}.</span>
                        <img src={p.sprite} alt="" style={{ width: 20, height: 20, imageRendering: 'pixelated' }}
                            onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                        <span style={{ color: p.id === PLAYER_ID ? '#93c5fd' : '#cbd5e1', fontSize: 11, fontWeight: 700, flex: 1 }}>
                            {p.name}
                        </span>
                        <span style={{ color: '#fbbf24', fontSize: 11, fontWeight: 700 }}>{wins[p.id] ?? 0}W</span>
                    </div>
                ))}
            </div>
        );
    };

    // ─── INTRO ───
    if (phase === 'intro') {
        const ranges = tournamentConfigs(progress.heroLevel, progress.defeatedCount);
        return (
            <div className="story-screen" style={{ padding: 24, maxWidth: 580, margin: '0 auto', textAlign: 'center' }}>
                <div style={{ fontSize: 48, marginBottom: 8 }}>🏆</div>
                <h1 style={{ fontFamily: 'var(--font-pixel)', color: '#fbbf24', fontSize: '1.1rem', marginBottom: 12, lineHeight: 1.6 }}>
                    ТУРНИР
                </h1>
                {!canPlay && (
                    <div style={{
                        background: 'rgba(239,68,68,0.1)', border: '2px solid #ef4444',
                        borderRadius: 10, padding: '10px 16px', marginBottom: 14, color: '#f87171', fontSize: 13,
                    }}>
                        🚫 Турнир уже был сегодня! Пропустите день на карте, чтобы сыграть снова.
                    </div>
                )}
                <div style={{
                    background: 'linear-gradient(135deg, #1e1b4b, #312e81)',
                    border: '2px solid #fbbf24',
                    borderRadius: 12, padding: '14px 16px', marginBottom: 14,
                    boxShadow: '0 0 16px rgba(251,191,36,0.25)',
                }}>
                    <div style={{ color: '#fde68a', fontSize: 11, fontWeight: 700, letterSpacing: 0.5, marginBottom: 4 }}>📅 СЕГОДНЯ В АРЕНЕ:</div>
                    <div style={{ color: '#fbbf24', fontSize: 20, fontWeight: 800 }}>{formatLabel(nextFormat)}</div>
                    <div style={{ color: '#c7d2fe', fontSize: 12, marginTop: 4 }}>
                        Взнос {cfg.entryFee.toLocaleString()}G · приз за раунд +{cfg.prizePerRound.toLocaleString()}G · бонус за победу +{cfg.winBonus.toLocaleString()}G
                    </div>
                </div>
                <p style={{ color: '#94a3b8', fontSize: 13, lineHeight: 1.6, marginBottom: 16 }}>
                    Формат меняется после каждого турнира. Награда зависит от того, как далеко пройдёшь. Можешь ставить на участников.
                </p>
                <div style={{ background: '#0f172a', border: '2px solid #fbbf2455', borderRadius: 12, padding: 14, marginBottom: 16, textAlign: 'left' }}>
                    <div style={{ color: '#fbbf24', fontWeight: 700, fontSize: 13, marginBottom: 8 }}>Награды (примерно):</div>
                    {(['bracket-8', 'bracket-16', 'league-6'] as TournamentFormat[]).map(f => {
                        const c = ranges[f];
                        return (
                            <div key={f} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>
                                <span>{formatLabel(f)}</span>
                                <span>Взнос: {c.entryFee.toLocaleString()}G · Раунд: +{c.prizePerRound.toLocaleString()}G · Победа: +{c.winBonus.toLocaleString()}G</span>
                            </div>
                        );
                    })}
                </div>
                <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                    <button className="story-btn story-btn--secondary" onClick={onBack}>← Карта</button>
                    <button className="menu-button" onClick={startTournament} disabled={loading || !canPlay}>
                        {loading ? '⏳' : '🏆 НАЧАТЬ'}
                    </button>
                </div>
            </div>
        );
    }

    if (phase === 'lobby') {
        return (
            <div className="story-screen" style={{ padding: 24, maxWidth: 600, margin: '0 auto', textAlign: 'center' }}>
                <h2 style={{ color: '#fbbf24' }}>⏳ Жеребьёвка...</h2>
                <div style={{ color: '#94a3b8', fontSize: 12 }}>Формат: {formatLabel(format)}</div>
            </div>
        );
    }

    if (phase === 'round-watch') {
        const m = currentMatch;
        if (!m) return null;
        const showSkipChoice = m.isPlayerMatch && playerWatchMode === 'watch';
        const odds = (pickId: string) => calcOdds(m.a, m.b, pickId);
        const roundName = (ROUND_NAMES[totalRounds] ?? {})[roundIdx] ?? `Раунд ${roundIdx + 1}`;

        return (
            <div className="story-screen" style={{ padding: 20, maxWidth: 760, margin: '0 auto' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                    <button className="story-btn story-btn--secondary" onClick={() => { setPhase('final-result'); setTournamentEnded({ winnerId: '?', finalScore: score }); }}>← Выйти</button>
                    <h2 style={{ flex: 1, color: '#fbbf24', fontSize: 18, margin: 0 }}>🏆 {formatLabel(format)} · {roundName}</h2>
                    <div style={{ background: '#1e293b', borderRadius: 8, padding: '4px 10px', color: '#4ade80', fontSize: 12, fontWeight: 700 }}>
                        {score.toLocaleString()}G
                    </div>
                </div>

                {/* Bracket / league table */}
                <BracketView />

                {/* Bet result banner */}
                {betResult && (
                    <div style={{
                        background: betResult.won ? 'rgba(74,222,128,0.12)' : 'rgba(248,113,113,0.12)',
                        border: `2px solid ${betResult.won ? '#22c55e' : '#ef4444'}`,
                        borderRadius: 12, padding: '12px 18px', marginBottom: 14, textAlign: 'center',
                    }}>
                        <div style={{ fontSize: 28 }}>{betResult.won ? '🎉' : '💸'}</div>
                        <div style={{
                            color: betResult.won ? '#4ade80' : '#f87171',
                            fontWeight: 800, fontSize: 18, marginBottom: 4,
                        }}>
                            {betResult.won
                                ? `СТАВКА ВЫИГРАЛА! +${betResult.payout.toLocaleString()}G`
                                : `СТАВКА ПРОИГРАНА! −${betResult.amount.toLocaleString()}G`
                            }
                        </div>
                        {betResult.won && (
                            <div style={{ color: '#94a3b8', fontSize: 11 }}>
                                {betResult.amount.toLocaleString()}G × {betResult.odds.toFixed(2)} = {betResult.payout.toLocaleString()}G на {betResult.pickedName}
                            </div>
                        )}
                        <button onClick={() => setBetResult(null)} style={{
                            marginTop: 8, background: 'transparent', border: '1px solid #334155',
                            borderRadius: 6, color: '#64748b', padding: '4px 12px', fontSize: 10, cursor: 'pointer',
                        }}>OK</button>
                    </div>
                )}

                {/* Current match card */}
                <div style={{ background: '#0f172a', border: '2px solid #1e293b', borderRadius: 14, padding: 16, textAlign: 'center', marginBottom: 16 }}>
                    <div style={{ color: '#94a3b8', fontSize: 11, marginBottom: 8 }}>
                        {m.isPlayerMatch ? '⚔️ ВАШ МАТЧ' : `Матч ${matchIdx + 1}`}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 16 }}>
                        <MatchSide p={m.a} />
                        <div style={{ fontSize: 22, color: '#fbbf24' }}>⚔️</div>
                        <MatchSide p={m.b} />
                    </div>
                </div>

                {/* Betting controls */}
                {!m.isPlayerMatch && !bet && !betResult && (
                    <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 10, padding: 12, marginBottom: 14 }}>
                        <div style={{ color: '#fbbf24', fontSize: 12, marginBottom: 8, fontWeight: 700 }}>💰 Ставки</div>
                        <BetForm a={m.a} b={m.b} oddsFor={odds} maxBet={progress.money} onPlace={(pickId, amount) => {
                            if (progress.spendMoney(amount)) { setBet({ matchId: matchIdx, pickId, amount }); setBetResult(null); }
                        }} />
                    </div>
                )}
                {bet && !betResult && (
                    <div style={{ background: 'rgba(74,222,128,0.1)', border: '1px solid #15803d', borderRadius: 8, padding: '8px 14px', marginBottom: 14, color: '#86efac', fontSize: 12 }}>
                        ✓ Ставка {bet.amount.toLocaleString()}G на {participants.find(p => p.id === bet.pickId)?.name}
                    </div>
                )}

                {/* Action buttons */}
                <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginBottom: 14 }}>
                    {showSkipChoice ? (
                        <>
                            <button className="menu-button" style={{ padding: '8px 18px', fontSize: 13 }} onClick={() => { gameplayStart(); setPhase('round-watching'); setBetResult(null); }}>
                                ⚔️ Сразиться
                            </button>
                            <button className="story-btn story-btn--secondary" onClick={() => { setBetResult(null); const w = playMatch(m); finishMatch(w); }}>
                                💨 Симулировать
                            </button>
                        </>
                    ) : (
                        <button className="menu-button" style={{ padding: '8px 18px', fontSize: 13 }} onClick={() => {
                            setBetResult(null); const w = playMatch(m); finishMatch(w);
                        }}>
                            ▶️ {m.isPlayerMatch ? 'Авто-симуляция' : 'Смотреть результат'}
                        </button>
                    )}
                </div>

                <div style={{ textAlign: 'center', marginBottom: 10 }}>
                    <button onClick={() => setPlayerWatchMode(playerWatchMode === 'watch' ? 'simulate-all' : 'watch')} style={{
                        background: '#1e293b', border: '1px solid #334155', color: '#94a3b8',
                        padding: '4px 12px', borderRadius: 6, fontSize: 10, cursor: 'pointer',
                    }}>
                        {playerWatchMode === 'watch' ? '👁️ Смотреть свои · Симулировать чужие' : '⏩ Симулировать всё'}
                    </button>
                </div>

                {matchLog.length > 0 && (
                    <div style={{ background: '#0a0f1e', border: '1px solid #1e293b', borderRadius: 8, padding: 10, fontSize: 11, color: '#94a3b8' }}>
                        <div style={{ color: '#64748b', fontSize: 10, marginBottom: 4 }}>ИСТОРИЯ:</div>
                        {matchLog.slice(0, 6).map((l, i) => (
                            <div key={i} style={{ opacity: 1 - i * 0.12 }}>{l}</div>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    if (phase === 'round-watching' && currentMatch && playerInMatch) {
        const team1 = currentMatch.a.id === PLAYER_ID ? currentMatch.a.team : currentMatch.b.team;
        const team2 = currentMatch.a.id === PLAYER_ID ? currentMatch.b.team : currentMatch.a.team;
        const playerIsA = currentMatch.a.id === PLAYER_ID;
        const onResult = (winnerSideInArena: 1 | 2, finalHP?: number[]) => {
            const playerWon = winnerSideInArena === 1;
            const actualWinner: 1 | 2 = playerWon
                ? (playerIsA ? 1 : 2)
                : (playerIsA ? 2 : 1);
            handleBattleEnd(actualWinner, finalHP);
        };
        return (
            <BattleArena
                team1={team1}
                team2={team2}
                maxSize={3}
                goToMenu={() => onResult(2)}
                team1HP={playerHPCarry}
                onBattleEnd={onResult}
            />
        );
    }

    if (phase === 'final-result') {
        const won = tournamentEnded?.winnerId === PLAYER_ID;
        const winner = participants.find(p => p.id === tournamentEnded?.winnerId);
        return (
            <div className="story-screen" style={{ padding: 24, maxWidth: 520, margin: '0 auto', textAlign: 'center' }}>
                <div style={{ fontSize: 56, marginBottom: 8 }}>{won ? '🏆' : '🎫'}</div>
                <div style={{ color: won ? '#fbbf24' : '#94a3b8', fontWeight: 800, fontSize: 22, marginBottom: 6 }}>
                    {won ? 'ТУРНИР ВЫИГРАН!' : 'Турнир окончен'}
                </div>
                {winner && !won && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center', marginBottom: 8 }}>
                        <span style={{ color: '#64748b', fontSize: 12 }}>Победитель:</span>
                        <img src={winner.sprite} alt="" style={{ width: 28, height: 28, imageRendering: 'pixelated' }}
                            onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                        <span style={{ color: '#e2e8f0', fontWeight: 700, fontSize: 14 }}>{winner.name}</span>
                    </div>
                )}
                <div style={{ color: '#94a3b8', fontSize: 12, marginBottom: 6 }}>{formatLabel(format)}</div>
                <div style={{ color: '#94a3b8', fontSize: 12, marginBottom: 6 }}>
                    Раундов: <strong style={{ color: '#e2e8f0' }}>{rounds}</strong>
                </div>
                <div style={{ color: '#fbbf24', fontSize: 22, fontWeight: 700, marginBottom: 20 }}>
                    Заработано: {score.toLocaleString()}G
                </div>
                <BracketView />
                <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 16 }}>
                    <button className="story-btn story-btn--secondary" onClick={onBack}>← Карта</button>
                    <button className="menu-button" onClick={() => { setPhase('intro'); setBetResult(null); }}>🔄 Ещё</button>
                </div>
            </div>
        );
    }

    return null;
};

// ─── Match side: shows team sprites ───
const MatchSide: React.FC<{ p: Participant }> = ({ p }) => (
    <div style={{ flex: 1, textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 2, marginBottom: 4 }}>
            {p.team.slice(0, 3).map((pk, i) => (
                <img key={i} src={pk.sprites.front_default} alt={pk.name}
                    style={{ width: 40, height: 40, imageRendering: 'pixelated' }} />
            ))}
        </div>
        <div style={{
            color: p.id === PLAYER_ID ? '#93c5fd' : '#e2e8f0',
            fontWeight: 700, fontSize: 14,
        }}>{p.name}</div>
        <div style={{ color: '#64748b', fontSize: 10 }}>Сила: {Math.round(p.power)}</div>
    </div>
);

// ─── Bet form ───
const BetForm: React.FC<{
    a: Participant; b: Participant;
    oddsFor: (pickId: string) => number;
    maxBet: number;
    onPlace: (pickId: string, amount: number) => void;
}> = ({ a, b, oddsFor, maxBet, onPlace }) => {
    const [amount, setAmount] = useState(100);
    const oddsA = oddsFor(a.id);
    const oddsB = oddsFor(b.id);
    const payoutA = Math.floor(amount * oddsA);
    const payoutB = Math.floor(amount * oddsB);
    return (
        <div>
            <input
                type="range" min={50} max={Math.min(20000, maxBet)} step={50}
                value={amount} onChange={e => setAmount(Number(e.target.value))}
                style={{ width: '100%', marginBottom: 8 }}
            />
            <div style={{ color: '#e2e8f0', fontSize: 12, marginBottom: 10 }}>
                Ставка: <strong>{amount.toLocaleString()}G</strong>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
                <button disabled={amount > maxBet} onClick={() => onPlace(a.id, amount)} style={{
                    flex: 1, background: '#1d4ed8', border: 'none', borderRadius: 8, color: '#fff',
                    padding: '10px 0', fontSize: 12, cursor: 'pointer', fontWeight: 700,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
                }}>
                    <span>{a.emoji} {a.name}</span>
                    <span style={{ fontSize: 10, color: '#93c5fd' }}>×{oddsA.toFixed(2)} → {payoutA.toLocaleString()}G</span>
                </button>
                <button disabled={amount > maxBet} onClick={() => onPlace(b.id, amount)} style={{
                    flex: 1, background: '#7c2d12', border: 'none', borderRadius: 8, color: '#fff',
                    padding: '10px 0', fontSize: 12, cursor: 'pointer', fontWeight: 700,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
                }}>
                    <span>{b.emoji} {b.name}</span>
                    <span style={{ fontSize: 10, color: '#fdba74' }}>×{oddsB.toFixed(2)} → {payoutB.toLocaleString()}G</span>
                </button>
            </div>
        </div>
    );
};

export default Tournament;
