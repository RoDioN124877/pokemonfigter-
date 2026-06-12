import React, { useState } from 'react';
import { OPPONENTS, ACTS } from '../data/storyData';
import type { OwnedPokemon } from '../store/progressStore';
import { useProgressStore } from '../store/progressStore';
import { useDayStore } from '../store/dayStore';
import type { TrainingEntry } from '../store/dayStore';
import { expToNextLevel, heroXpToNextLevel, calcBattleHP } from '../utils/progressUtils';
import { PLAYER_SPRITE } from './DialogueBox';



const TrainerAvatar: React.FC<{ sprite: string; emoji: string; name: string; locked: boolean }> = ({ sprite, emoji, name, locked }) => {
    const [failed, setFailed] = useState(false);
    if (failed) return <span className="opp-avatar">{locked ? '❔' : emoji}</span>;
    return (
        <img
            src={sprite}
            alt={name}
            className={`opp-avatar-img ${locked ? 'locked' : ''}`}
            onError={() => setFailed(true)}
            loading="lazy"
        />
    );
};

interface Props {
    defeatedIndices: number[];
    team: OwnedPokemon[];
    money: number;
    onSelectOpponent: (index: number) => void;
    onShop: () => void;
    onInventory: () => void;
    onHunt: () => void;
    onBossRush: () => void;
    onLeaderboard: () => void;
    onTournament: () => void;
    onMenu: () => void;
    onRestart: () => void;
    onNgPlus?: () => void;
}

const SECTIONS = ACTS.map(act => {
    const indices = OPPONENTS
        .map((o, i) => ({ o, i }))
        .filter(({ o }) => o.act === act.id)
        .map(({ i }) => i);
    return { label: act.label, sub: act.sub, start: indices[0], end: indices[indices.length - 1] + 1 };
});

const StoryMap: React.FC<Props> = ({ defeatedIndices, team, money, onSelectOpponent, onShop, onInventory, onHunt, onBossRush, onLeaderboard, onTournament, onMenu, onRestart, onNgPlus }) => {
    const [confirmRestart, setConfirmRestart] = useState(false);
    const [skipDayResult, setSkipDayResult] = useState<TrainingEntry[] | null>(null);
    const heroLevel = useProgressStore(s => s.heroLevel);
    const heroXp = useProgressStore(s => s.heroXp);
    const progressStore = useProgressStore();
    const dayStore = useDayStore();
    const heroXpNext = heroXpToNextLevel(heroLevel);
    const heroPct = Math.min(100, Math.round((heroXp / heroXpNext) * 100));
    const isDefeated = (i: number) => defeatedIndices.includes(i);
    const nextAvailable = OPPONENTS.findIndex((_, i) => !isDefeated(i));

    const earnedBadges = [...defeatedIndices]
        .sort((a, b) => a - b)
        .map(i => OPPONENTS[i].badge)
        .filter(Boolean);

    const handleSkipDay = () => {
        const completed = dayStore.skipDay();
        if (completed.length > 0) {
            completed.forEach(t => {
                const pok = progressStore.ownedPokemon.find(p => p.uuid === t.pokemonUuid);
                if (pok) {
                    let exp = pok.exp + t.xpReward;
                    let level = pok.level;
                    while (level < 100 && exp >= expToNextLevel(level)) {
                        exp -= expToNextLevel(level);
                        level++;
                    }
                    useProgressStore.setState(s => ({
                        ownedPokemon: s.ownedPokemon.map(p =>
                            p.uuid === t.pokemonUuid ? { ...p, exp, level } : p
                        ),
                    }));
                }
            });
            setSkipDayResult(completed);
        } else {
            setSkipDayResult([]);
        }
        setTimeout(() => setSkipDayResult(null), 4000);
    };

    const trainingPokemon = dayStore.training;

    return (
        <div className="story-map">
            {confirmRestart && (
                <div style={{
                    position: 'fixed', inset: 0, zIndex: 999,
                    background: 'rgba(0,0,0,0.85)', display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                }}>
                    <div style={{
                        background: '#0f172a', border: '2px solid #ef4444',
                        borderRadius: 16, padding: '28px 32px', maxWidth: 360,
                        textAlign: 'center',
                    }}>
                        <div style={{ fontSize: 36, marginBottom: 12 }}>⚠️</div>
                        <div style={{ color: '#f1f5f9', fontWeight: 700, fontSize: 18, marginBottom: 8 }}>
                            Начать сначала?
                        </div>
                        <div style={{ color: '#94a3b8', fontSize: 13, marginBottom: 24, lineHeight: 1.6 }}>
                            Весь прогресс будет удалён:<br />
                            уровни, деньги, предметы, команда.
                        </div>
                        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                            <button
                                className="story-btn story-btn--secondary"
                                onClick={() => setConfirmRestart(false)}
                                style={{ padding: '8px 20px' }}
                            >
                                Отмена
                            </button>
                            <button
                                onClick={onRestart}
                                style={{
                                    background: '#ef4444', border: 'none', borderRadius: 8,
                                    color: '#fff', fontWeight: 700, fontSize: 14,
                                    padding: '8px 20px', cursor: 'pointer',
                                }}
                            >
                                🔄 Начать сначала
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Skip day result notification */}
            {skipDayResult !== null && (
                <div style={{
                    position: 'fixed', top: 16, left: '50%', transform: 'translateX(-50%)',
                    zIndex: 9999, background: '#0f2a18', border: '2px solid #15803d',
                    borderRadius: 10, padding: '12px 20px', boxShadow: '0 4px 20px rgba(0,0,0,0.6)',
                    textAlign: 'center', maxWidth: 400,
                }}>
                    <div style={{ color: '#4ade80', fontSize: 14, fontWeight: 700, marginBottom: 4 }}>
                        🌅 День {dayStore.currentDay}!
                    </div>
                    <div style={{ color: '#94a3b8', fontSize: 11 }}>
                        Охоты и турнир сброшены.
                    </div>
                    {skipDayResult.length > 0 && (
                        <div style={{ marginTop: 6 }}>
                            {skipDayResult.map(t => (
                                <div key={t.pokemonUuid} style={{ color: '#fbbf24', fontSize: 12, fontWeight: 600 }}>
                                    🏋️ {t.pokemonName} вернулся! +{t.xpReward.toLocaleString()} EXP
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            <div className="story-map-header">
                <button className="trn-back-btn" onClick={onMenu}>← Меню</button>
                <h1 className="story-map-title">🗺️ ПУТЬ ТРЕНЕРА</h1>
                <div className="story-map-actions">
                    <div className="story-money-badge" style={{
                        background: 'linear-gradient(135deg,#7c3aed,#4338ca)',
                        color: '#fff', border: '2px solid #a78bfa',
                        display: 'flex', alignItems: 'center', gap: 8, padding: '4px 12px',
                    }} title={`Герой: ${heroXp}/${heroXpNext} XP`}>
                        <img
                            src={PLAYER_SPRITE}
                            alt="Герой"
                            style={{ width: 24, height: 24, imageRendering: 'pixelated', objectFit: 'contain' }}
                            onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                        <span style={{ fontWeight: 700, fontSize: 13 }}>Герой Ур.{heroLevel}</span>
                        <div style={{ width: 40, background: '#1e1b4b', borderRadius: 2, height: 5, overflow: 'hidden' }}>
                            <div style={{ width: `${heroPct}%`, height: '100%', background: '#fbbf24', transition: 'width 0.4s' }} />
                        </div>
                    </div>
                    <div className="story-money-badge">💰 {money.toLocaleString()}G</div>
                    {/* Day badge + skip day */}
                    <div className="story-money-badge" style={{
                        background: 'linear-gradient(135deg,#1e3a5f,#0f172a)',
                        border: '2px solid #3b82f6',
                        display: 'flex', alignItems: 'center', gap: 6,
                    }}>
                        <span style={{ fontSize: 13 }}>🌅</span>
                        <span style={{ fontWeight: 700, fontSize: 12 }}>День {dayStore.currentDay}</span>
                        <button onClick={handleSkipDay} style={{
                            background: '#1d4ed8', border: 'none', borderRadius: 4,
                            color: '#fff', fontWeight: 700, fontSize: 10,
                            padding: '2px 8px', cursor: 'pointer', marginLeft: 2,
                        }}>Пропустить</button>
                    </div>
                    <button className="story-action-btn" onClick={onShop}>🛒 Магазин</button>
                    <button className="story-action-btn" onClick={onInventory}>🎒 Инвентарь</button>
                    <button className="story-action-btn" onClick={onHunt}>🏕️ Охота</button>
                    <button className="story-action-btn" onClick={onBossRush} style={{ color: '#f59e0b', borderColor: 'rgba(245,158,11,0.3)' }}>
                        🔥 Boss Rush
                    </button>
                    <button className="story-action-btn" onClick={onTournament} style={{
                        color: dayStore.canPlayTournament() ? '#fbbf24' : '#64748b',
                        borderColor: dayStore.canPlayTournament() ? 'rgba(251,191,36,0.4)' : 'rgba(100,116,139,0.2)',
                    }}>
                        🏆 Турнир
                    </button>
                    <button className="story-action-btn" onClick={onLeaderboard} style={{ color: '#a78bfa', borderColor: 'rgba(167,139,250,0.3)' }}>
                        🥇 Рейтинг
                    </button>
                    {onNgPlus && defeatedIndices.length >= OPPONENTS.length && (
                        <button
                            className="story-action-btn"
                            onClick={onNgPlus}
                            style={{ color: '#fbbf24', borderColor: 'rgba(251,191,36,0.5)', background: 'rgba(251,191,36,0.08)' }}
                        >
                            🔥 НОВАЯ ИГРА+
                        </button>
                    )}
                    <button
                        className="story-action-btn"
                        onClick={() => setConfirmRestart(true)}
                        style={{ color: '#f87171', borderColor: 'rgba(239,68,68,0.3)' }}
                    >
                        🔄 Сначала
                    </button>
                </div>
            </div>

            {/* Training banner */}
            {trainingPokemon.length > 0 && (
                <div style={{
                    background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.3)',
                    borderRadius: 10, padding: '10px 16px', margin: '0 16px 12px',
                }}>
                    <div style={{ color: '#60a5fa', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>🏋️ ПОКЕМОНЫ НА ТРЕНИРОВКЕ</div>
                    {trainingPokemon.map(t => {
                        const daysLeft = dayStore.getTrainingDaysLeft(t.pokemonUuid);
                        return (
                            <div key={t.pokemonUuid} style={{
                                display: 'flex', alignItems: 'center', gap: 8, fontSize: 11,
                                color: '#94a3b8', padding: '3px 0',
                            }}>
                                <span style={{ textTransform: 'capitalize', fontWeight: 600, color: '#e2e8f0' }}>
                                    {t.pokemonName}
                                </span>
                                <span>→ +{t.xpReward.toLocaleString()} EXP</span>
                                <span style={{ marginLeft: 'auto', color: daysLeft <= 1 ? '#fbbf24' : '#64748b' }}>
                                    {daysLeft > 0 ? `${daysLeft} дн.` : 'Готов!'}
                                </span>
                            </div>
                        );
                    })}
                    <div style={{ color: '#475569', fontSize: 10, marginTop: 4 }}>
                        Пропустите дни, чтобы они вернулись с опытом.
                    </div>
                </div>
            )}

            {/* Team status */}
            {team.length > 0 && (
                <div className="story-team-status">
                    {team.map(owned => {
                        const maxHP = calcBattleHP(owned.data.statsMap.hp, owned.level);
                        const expNeeded = expToNextLevel(owned.level);
                        const expPct = expNeeded > 0 ? Math.min(100, Math.round((owned.exp / expNeeded) * 100)) : 0;
                        return (
                            <div key={owned.uuid} className="story-team-slot">
                                <img src={owned.data.sprites.front_default} alt={owned.data.name} className="map-team-sprite" />
                                <div className="story-team-slot-info">
                                    <div style={{ color: '#e2e8f0', fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>
                                        {owned.data.name}
                                    </div>
                                    <div style={{ color: '#64748b', fontSize: 10 }}>Lv.{owned.level} · {maxHP}HP</div>
                                    <div style={{ background: '#1a1a2e', borderRadius: 3, height: 5, overflow: 'hidden', marginTop: 3 }}>
                                        <div style={{ width: `${expPct}%`, height: '100%', background: '#a78bfa', transition: 'width 0.3s' }} />
                                    </div>
                                    <div style={{ color: '#334155', fontSize: 9, marginTop: 1 }}>
                                        EXP: {owned.exp}/{expNeeded}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {earnedBadges.length > 0 && (
                <div className="story-badges-row">
                    <span className="story-badges-label">Значки:</span>
                    {earnedBadges.map((b, i) => (
                        <span key={i} className="story-badge">{b}</span>
                    ))}
                    <span className="story-badges-label" style={{ marginLeft: 8 }}>
                        {defeatedIndices.length}/{OPPONENTS.length}
                    </span>
                </div>
            )}

            {/* Campaign progress */}
            <div className="story-progress-wrap">
                <div className="story-progress-bar">
                    <div
                        className="story-progress-fill"
                        style={{ width: `${(defeatedIndices.length / OPPONENTS.length) * 100}%` }}
                    />
                </div>
                <span className="story-progress-text">
                    Кампания: {defeatedIndices.length}/{OPPONENTS.length} ({Math.round((defeatedIndices.length / OPPONENTS.length) * 100)}%)
                </span>
            </div>

            <div className="story-map-sections">
                {SECTIONS.map(sec => (
                    <div key={sec.label} className="story-section">
                        <h3 className="story-section-label">{sec.label}</h3>
                        <div className="story-section-sub">{sec.sub}</div>
                        {OPPONENTS.slice(sec.start, sec.end).map((opp, relIdx) => {
                            const absIdx = sec.start + relIdx;
                            const defeated = isDefeated(absIdx);
                            const available = absIdx === nextAvailable;
                            const locked = !defeated && !available;

                            return (
                                <div
                                    key={opp.id}
                                    className={`story-opp-row ${defeated ? 'defeated' : available ? 'available' : 'locked'}`}
                                >
                                    <span className="opp-status-icon">
                                        {defeated ? '✅' : available ? '⚔️' : '🔒'}
                                    </span>
                                    <TrainerAvatar sprite={opp.sprite} emoji={opp.emoji} name={opp.name} locked={locked} />
                                    <div className="opp-info">
                                        <span className="opp-name">{locked && opp.act >= 3 ? '???' : opp.name}</span>
                                        <span className="opp-title">{opp.title}</span>
                                        <span className="opp-location">📍 {opp.location} · Ур.{opp.opponentLevel}</span>
                                    </div>
                                    <div className="opp-right">
                                        {defeated ? (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end' }}>
                                                {opp.badge && <span className={`type-badge type-${opp.typeTheme}`} style={{ fontSize: '1.3rem', padding: '4px 8px' }}>{opp.badge}</span>}
                                                <button
                                                    onClick={() => onSelectOpponent(absIdx)}
                                                    style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 6, color: '#64748b', fontSize: 10, padding: '3px 10px', cursor: 'pointer' }}
                                                >
                                                    🔄 Реванш (×0.4G)
                                                </button>
                                            </div>
                                        ) : locked ? (
                                            <span className="opp-locked-text">Заблокировано</span>
                                        ) : (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end' }}>
                                                <div style={{ color: '#facc15', fontSize: 11 }}>
                                                    💰 {opp.moneyReward.toLocaleString()}G
                                                </div>
                                                <button
                                                    className="menu-button opp-fight-btn"
                                                    onClick={() => onSelectOpponent(absIdx)}
                                                >
                                                    СРАЗИТЬСЯ
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default StoryMap;
