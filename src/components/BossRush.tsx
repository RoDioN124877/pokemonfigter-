import React, { useState } from 'react';
import { useProgressStore } from '../store/progressStore';
import { fetchPokemonsByIds } from '../services/ApiService';
import { scalePokemonToLevel } from '../utils/progressUtils';
import { gameplayStart, gameplayStop, submitBossRushScore } from '../utils/ysdk';
import { OPPONENTS } from '../data/storyData';
import type { Pokemon } from '../types/Pokemon';
import BattleArena from './BattleArena';
import type { TrainerComments } from './BattleArena';
import { applyEquipmentToPokemon } from '../utils/equipUtils';

type Phase = 'intro' | 'fighting' | 'between' | 'lost' | 'cleared';

const BossRush: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    const progressStore = useProgressStore();

    const [phase, setPhase] = useState<Phase>('intro');
    const [currentIdx, setCurrentIdx] = useState(0);
    const [wins, setWins] = useState(0);
    const [score, setScore] = useState(0);
    const [opponentTeam, setOpponentTeam] = useState<Pokemon[]>([]);
    const [loadingOpponent, setLoadingOpponent] = useState(false);
    const [scoreSubmitted, setScoreSubmitted] = useState(false);
    // HP carries over between fights — user requested this
    const [teamHPCarry, setTeamHPCarry] = useState<number[] | undefined>(undefined);

    const opponent = OPPONENTS[currentIdx];

    // HP factor: decreases 7% per win, floor at 30%
    const hpFactor = Math.max(0.3, 1.0 - wins * 0.07);

    const loadOpponentTeam = async (idx: number): Promise<Pokemon[]> => {
        setLoadingOpponent(true);
        try {
            const poks = await fetchPokemonsByIds(OPPONENTS[idx].pokemonIds);
            const scaled = poks.map(p => scalePokemonToLevel(p, OPPONENTS[idx].opponentLevel));
            setOpponentTeam(scaled);
            return scaled;
        } finally {
            setLoadingOpponent(false);
        }
    };

    const startBossRush = async () => {
        setCurrentIdx(0);
        setWins(0);
        setScore(0);
        setScoreSubmitted(false);
        setTeamHPCarry(undefined);
        setPhase('between');
        await loadOpponentTeam(0);
        setPhase('fighting');
        gameplayStart();
    };

    const handleBattleEnd = (winner: 1 | 2, finalHP?: number[]) => {
        gameplayStop();
        if (winner === 1) {
            const earned = opponent.moneyReward;
            const newScore = score + earned;
            const newWins = wins + 1;
            setScore(newScore);
            setWins(newWins);
            // Pay out money on each win (so partial runs are rewarded)
            progressStore.addMoney(earned);
            progressStore.giveExpToTeam(opponent.opponentLevel, true);
            progressStore.giveHeroXp(opponent.opponentLevel, true, false);
            // Save HP for carryover to next fight
            if (finalHP) setTeamHPCarry(finalHP);
            if (currentIdx >= OPPONENTS.length - 1) {
                submitBossRushScore(newScore).then(() => setScoreSubmitted(true));
                setPhase('cleared');
            } else {
                loadOpponentTeam(currentIdx + 1);
                setPhase('between');
            }
        } else {
            progressStore.giveExpToTeam(opponent.opponentLevel, false);
            progressStore.giveHeroXp(opponent.opponentLevel, false, false);
            setPhase('lost');
        }
    };

    const nextFight = async () => {
        const nextIdx = currentIdx + 1;
        setCurrentIdx(nextIdx);
        await loadOpponentTeam(nextIdx);
        setPhase('fighting');
        gameplayStart();
    };

    // Build battle team with HP penalty
    const team = progressStore.getTeam();
    const battleTeam = team.map(owned => {
        let p = scalePokemonToLevel(owned.data, owned.level);
        p = applyEquipmentToPokemon(p, owned.equipment);
        const reducedHp = Math.max(1, Math.round(p.statsMap.hp * hpFactor));
        const newSm = { ...p.statsMap, hp: reducedHp };
        const newStats = p.stats.map(s => s.stat.name === 'hp' ? { ...s, base_stat: reducedHp } : s);
        return { ...p, statsMap: newSm, stats: newStats };
    });

    // ── INTRO ──
    if (phase === 'intro') return (
        <div className="story-screen" style={{ padding: 24, maxWidth: 580, margin: '0 auto', textAlign: 'center' }}>
            <div style={{ fontSize: 56, marginBottom: 8 }}>🔥</div>
            <h1 style={{ fontFamily: 'var(--font-pixel)', color: '#f59e0b', fontSize: '1.1rem', marginBottom: 8, lineHeight: 1.6 }}>
                BOSS RUSH
            </h1>
            <p style={{ color: '#94a3b8', fontSize: 13, lineHeight: 1.6, marginBottom: 24 }}>
                Сражайся со всеми {OPPONENTS.length} противниками подряд.<br />
                После каждой победы HP твоей команды уменьшается на 7%.<br />
                Проигрыш = конец. Результат идёт в таблицу лидеров.
            </p>

            <div style={{ background: '#0f172a', border: '2px solid #f59e0b44', borderRadius: 12, padding: 16, marginBottom: 24 }}>
                <div style={{ color: '#fbbf24', fontSize: 13, fontWeight: 700, marginBottom: 12 }}>⚔️ БОССЫ</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                    {OPPONENTS.map((o, i) => (
                        <div key={o.id} style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: 22 }}>{o.emoji}</div>
                            <div style={{ color: '#64748b', fontSize: 9, textTransform: 'uppercase' }}>
                                {i + 1}. {o.name}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                <button className="story-btn story-btn--secondary" onClick={onBack}>← Карта</button>
                <button className="menu-button" onClick={startBossRush} disabled={team.length === 0}>
                    🔥 НАЧАТЬ BOSS RUSH!
                </button>
            </div>
            {team.length === 0 && (
                <p style={{ color: '#f87171', fontSize: 11, marginTop: 12 }}>Нет команды для боя</p>
            )}
        </div>
    );

    // ── FIGHTING ──
    if (phase === 'fighting') return (
        <BattleArena
            team1={battleTeam}
            team2={opponentTeam}
            maxSize={3}
            goToMenu={() => { gameplayStop(); setPhase('lost'); }}
            historyMode="boss"
            team1HP={teamHPCarry}
            onBattleEnd={handleBattleEnd}
            trainerComments={{
                trainerName: opponent.name,
                trainerEmoji: opponent.emoji,
                trainerSprite: opponent.sprite,
                onWinning: opponent.battleQuotes.onWinning,
                onLosing: opponent.battleQuotes.onLosing,
                lastPokemon: opponent.battleQuotes.lastPokemon,
            } satisfies TrainerComments}
        />
    );

    // ── BETWEEN FIGHTS ──
    if (phase === 'between') {
        const nextOpp = OPPONENTS[currentIdx + 1];
        const hpPct = Math.round(hpFactor * 100);
        return (
            <div className="story-screen" style={{ padding: 24, maxWidth: 480, margin: '0 auto', textAlign: 'center' }}>
                <div style={{ fontSize: 40, marginBottom: 6 }}>✅</div>
                <div style={{ color: '#4ade80', fontWeight: 800, fontSize: 22, marginBottom: 4 }}>
                    {opponent.name} повержен!
                </div>
                <div style={{ color: '#fbbf24', fontSize: 18, marginBottom: 16 }}>
                    +{opponent.moneyReward.toLocaleString()}G · Счёт: {score.toLocaleString()}
                </div>

                <div style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 10, padding: 14, marginBottom: 20 }}>
                    <div style={{ color: '#94a3b8', fontSize: 12, marginBottom: 8 }}>
                        Осталось боссов: <strong style={{ color: '#e2e8f0' }}>{OPPONENTS.length - 1 - currentIdx}</strong>
                    </div>
                    <div style={{ color: '#f87171', fontSize: 12, marginBottom: 8 }}>
                        ❤️ Макс. HP: <strong>{hpPct}%</strong>
                        {teamHPCarry && teamHPCarry.length > 0 && (
                            <span style={{ color: '#fca5a5', marginLeft: 8 }}>
                                · Текущее HP сохраняется между боями
                            </span>
                        )}
                    </div>
                    {teamHPCarry && (
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginBottom: 8 }}>
                            {battleTeam.map((p, i) => {
                                const maxHp = Math.round(p.statsMap.hp * 3.2);
                                const cur = teamHPCarry[i] ?? maxHp;
                                const pct = Math.round((cur / maxHp) * 100);
                                return (
                                    <div key={i} style={{ flex: 1, background: '#1e293b', borderRadius: 4, padding: '4px 6px' }}>
                                        <div style={{ color: '#cbd5e1', fontSize: 10, textTransform: 'uppercase' }}>{p.name.slice(0, 6)}</div>
                                        <div style={{ background: '#000', borderRadius: 2, height: 5, marginTop: 2 }}>
                                            <div style={{ width: `${pct}%`, height: '100%', background: pct < 25 ? '#ef4444' : pct < 60 ? '#f59e0b' : '#22c55e', borderRadius: 2 }} />
                                        </div>
                                        <div style={{ color: '#94a3b8', fontSize: 9, marginTop: 2 }}>{cur}/{maxHp}</div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                    <div style={{ color: '#e2e8f0', fontSize: 13, fontWeight: 700, marginBottom: 4 }}>
                        Следующий: {nextOpp.emoji} {nextOpp.name}
                    </div>
                    <div style={{ color: '#64748b', fontSize: 11, marginBottom: 6 }}>{nextOpp.title} · Ур.{nextOpp.opponentLevel}</div>
                    {opponentTeam.length > 0 && (
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center' }}>
                            {opponentTeam.map(p => (
                                <div key={p.id} style={{ textAlign: 'center', background: '#1e293b', borderRadius: 6, padding: '4px 8px' }}>
                                    <img src={p.sprites.front_default} alt={p.name} style={{ width: 40, height: 40, imageRendering: 'pixelated' }} />
                                    <div style={{ color: '#94a3b8', fontSize: 9, textTransform: 'uppercase' }}>{p.name}</div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <button
                    className="menu-button"
                    onClick={nextFight}
                    disabled={loadingOpponent}
                >
                    {loadingOpponent ? '⏳ Загрузка...' : `⚔️ VS ${nextOpp.name}!`}
                </button>
            </div>
        );
    }

    // ── LOST ──
    if (phase === 'lost') return (
        <div className="story-screen" style={{ padding: 24, maxWidth: 480, margin: '0 auto', textAlign: 'center' }}>
            <div style={{ fontSize: 56, marginBottom: 8 }}>💀</div>
            <div style={{ color: '#f87171', fontWeight: 800, fontSize: 24, marginBottom: 8 }}>BOSS RUSH ОКОНЧЕН</div>
            <div style={{ color: '#94a3b8', fontSize: 13, marginBottom: 6 }}>
                Остановлен на: {opponent.emoji} {opponent.name}
            </div>
            <div style={{ color: '#fbbf24', fontSize: 22, fontWeight: 700, marginBottom: 8 }}>
                Счёт: {score.toLocaleString()}G
            </div>
            <div style={{ color: '#64748b', fontSize: 12, marginBottom: 24 }}>
                Побед: {wins} / {OPPONENTS.length}
            </div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                <button className="story-btn story-btn--secondary" onClick={onBack}>← Карта</button>
                <button className="menu-button" onClick={startBossRush}>🔄 Снова!</button>
            </div>
        </div>
    );

    // ── CLEARED ──
    if (phase === 'cleared') return (
        <div className="story-screen" style={{ padding: 24, maxWidth: 480, margin: '0 auto', textAlign: 'center' }}>
            <div style={{ fontSize: 56, marginBottom: 8 }}>🏆</div>
            <div style={{ color: '#f59e0b', fontWeight: 800, fontFamily: 'var(--font-pixel)', fontSize: '1rem', marginBottom: 8, lineHeight: 1.6 }}>
                ПРОЙДЕН!
            </div>
            <div style={{ color: '#4ade80', fontSize: 22, fontWeight: 700, marginBottom: 4 }}>
                {score.toLocaleString()}G
            </div>
            <div style={{ color: '#94a3b8', fontSize: 12, marginBottom: 20 }}>
                Все {OPPONENTS.length} боссов повержены!
                {scoreSubmitted && <span style={{ color: '#4ade80' }}> ✓ Результат сохранён в таблицу лидеров</span>}
            </div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                <button className="story-btn story-btn--secondary" onClick={onBack}>← Карта</button>
                <button className="menu-button" onClick={startBossRush}>🔄 Снова!</button>
            </div>
        </div>
    );

    return null;
};

export default BossRush;
