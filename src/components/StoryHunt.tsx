import React, { useState } from 'react';
import { useProgressStore, BALLS } from '../store/progressStore';
import type { BallId } from '../store/progressStore';
import { useStoryStore } from '../store/storyStore';
import { useDayStore, MAX_HUNTS_PER_AREA, MAX_AD_HUNTS } from '../store/dayStore';
import { gameplayStart, gameplayStop, showRewardedAd, calcAdReward } from '../utils/ysdk';
import EvolutionQueue from './EvolutionQueue';
import StrangeMerchant from './StrangeMerchant';
import { fetchPokemonsByIds } from '../services/ApiService';
import { scalePokemonToLevel } from '../utils/progressUtils';
import { calcCatchChance } from '../data/ballData';
import { simulateTeamBattle } from '../utils/battleSimulation';
import { applyEquipmentToPokemon } from '../utils/equipUtils';
import type { Pokemon } from '../types/Pokemon';
import BattleArena from './BattleArena';
import PokemonStatMini from './PokemonStatMini';

const POOL_GRASS    = [16, 19, 21, 23, 27, 29, 32, 35, 41, 46, 48, 52, 60, 63, 74, 77, 79, 84];
const POOL_MOUNTAIN = [88, 90, 95, 98, 102, 104, 111, 114, 118, 120, 122, 124, 125, 126, 128];
const POOL_CAVE     = [130, 131, 134, 135, 136, 137, 140, 142, 143, 144, 145, 146, 147, 148];
const POOL_OCEAN    = [55, 62, 73, 87, 91, 99, 116, 117, 119, 121, 129, 130, 138, 139];
const POOL_VOLCANO  = [4, 5, 6, 37, 38, 58, 59, 77, 78, 126, 136, 146];
const POOL_RUINS    = [63, 64, 65, 92, 93, 94, 96, 97, 103, 105, 106, 122, 124, 137, 143, 144, 145, 150];

interface AreaDef {
    key: string;
    label: string;
    emoji: string;
    desc: string;
    pool: number[];
    baseLevel: number;
    levelScale: number;
    moneyPerLevel: number;
    minOpponent: number;
    color: string;
}

const AREAS: AreaDef[] = [
    {
        key: 'grass', label: 'Луга', emoji: '🌿',
        desc: 'Слабые дикие покемоны. Хороший старт для гринда.',
        pool: POOL_GRASS, baseLevel: 5, levelScale: 2, moneyPerLevel: 28,
        minOpponent: 0, color: '#22c55e',
    },
    {
        key: 'mountain', label: 'Горы', emoji: '🏔️',
        desc: 'Сильные противники. Больше денег и опыта.',
        pool: POOL_MOUNTAIN, baseLevel: 18, levelScale: 3, moneyPerLevel: 55,
        minOpponent: 3, color: '#f97316',
    },
    {
        key: 'ocean', label: 'Океан', emoji: '🌊',
        desc: 'Водные покемоны. Хороший заработок.',
        pool: POOL_OCEAN, baseLevel: 22, levelScale: 3, moneyPerLevel: 65,
        minOpponent: 4, color: '#3b82f6',
    },
    {
        key: 'cave', label: 'Пещеры', emoji: '🌑',
        desc: 'Опасные редкие покемоны. Высокая награда.',
        pool: POOL_CAVE, baseLevel: 38, levelScale: 4, moneyPerLevel: 100,
        minOpponent: 7, color: '#a855f7',
    },
    {
        key: 'volcano', label: 'Вулкан', emoji: '🌋',
        desc: 'Огненные покемоны. Очень высокая награда.',
        pool: POOL_VOLCANO, baseLevel: 45, levelScale: 4, moneyPerLevel: 140,
        minOpponent: 10, color: '#ef4444',
    },
    {
        key: 'ruins', label: 'Руины', emoji: '🏛️',
        desc: 'Призраки и психики. Легендарные встречи. Максимум денег.',
        pool: POOL_RUINS, baseLevel: 55, levelScale: 5, moneyPerLevel: 200,
        minOpponent: 14, color: '#eab308',
    },
];

interface Encounter {
    pokemon: Pokemon;
    level: number;
    moneyReward: number;
}

type View = 'pick-area' | 'pick-encounter' | 'battling' | 'result' | 'merchant';

const StoryHunt: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    const progressStore = useProgressStore();
    const { currentOpponentIndex } = useStoryStore();
    const dayStore = useDayStore();

    const [view, setView] = useState<View>('pick-area');
    const [area, setArea] = useState<AreaDef | null>(null);
    const [encounters, setEncounters] = useState<Encounter[]>([]);
    const [loading, setLoading] = useState(false);
    const [active, setActive] = useState<Encounter | null>(null);
    const [result, setResult] = useState<{ winner: 1 | 2; money: number } | null>(null);
    const [caughtName, setCaughtName] = useState('');
    const [catchDone, setCatchDone] = useState(false);
    const [adWatching, setAdWatching] = useState(false);
    const [evosDone, setEvosDone] = useState(false);

    const loadEncounters = (a: AreaDef) => {
        if (Math.random() < 0.15) {
            setView('merchant');
            return;
        }
        setLoading(true);
        const shuffled = [...a.pool].sort(() => Math.random() - 0.5).slice(0, 4);
        fetchPokemonsByIds(shuffled).then(poks => {
            setEncounters(poks.map(p => {
                const lv = Math.min(70, a.baseLevel + currentOpponentIndex * a.levelScale + Math.floor(Math.random() * 6));
                return { pokemon: p, level: lv, moneyReward: lv * a.moneyPerLevel };
            }));
            setLoading(false);
        });
    };

    const selectArea = (a: AreaDef) => {
        setArea(a);
        loadEncounters(a);
        setView('pick-encounter');
    };

    const startFight = (enc: Encounter) => {
        if (!area) return;
        const canFree = dayStore.canHunt(area.key);
        if (!canFree) {
            if (!dayStore.canAdHunt()) return;
            // Ad hunt path — handled in UI before calling this
        }
        dayStore.useHunt(area.key);
        gameplayStart();
        setActive(enc);
        setCaughtName('');
        setCatchDone(false);
        setView('battling');
    };

    const startFightWithAd = (enc: Encounter) => {
        if (!area) return;
        setAdWatching(true);
        showRewardedAd({
            onRewarded: () => {
                dayStore.useAdHunt(area.key);
                gameplayStart();
                setActive(enc);
                setCaughtName('');
                setCatchDone(false);
                setView('battling');
            },
            onClose: () => setAdWatching(false),
            onError: () => setAdWatching(false),
        });
    };

    const handleBattleEnd = (winner: 1 | 2) => {
        gameplayStop();
        if (!active) return;
        progressStore.giveExpToTeam(active.level, winner === 1);
        progressStore.giveHeroXp(active.level, winner === 1, true);
        if (winner === 1) progressStore.addMoney(active.moneyReward);
        setResult({ winner, money: winner === 1 ? active.moneyReward : 0 });
        setView('result');
    };

    const handleCatchWithBall = (ballId: BallId) => {
        if (!active) return;
        const res = progressStore.tryCatchPokemon(active.pokemon, active.level, ballId);
        if (res.success) setCaughtName(active.pokemon.name);
        else setCaughtName('');
        setCatchDone(true);
    };

    const simulateFight = (enc: Encounter) => {
        if (!area) return;
        const canFree = dayStore.canHunt(area.key);
        if (!canFree && !dayStore.canAdHunt()) return;
        if (canFree) dayStore.useHunt(area.key);
        else dayStore.useAdHunt(area.key);

        const playerBattleTeam = progressStore.getTeam().map(o => applyEquipmentToPokemon(scalePokemonToLevel(o.data, o.level), o.equipment));
        const simResult = simulateTeamBattle(playerBattleTeam, [scalePokemonToLevel(enc.pokemon, enc.level)]);
        setActive(enc);
        setCaughtName('');
        setCatchDone(false);
        progressStore.giveExpToTeam(enc.level, simResult.winner === 1);
        progressStore.giveHeroXp(enc.level, simResult.winner === 1, true);
        if (simResult.winner === 1) progressStore.addMoney(enc.moneyReward);
        setResult({ winner: simResult.winner, money: simResult.winner === 1 ? enc.moneyReward : 0 });
        setView('result');
    };

    const handleRefreshWithAd = () => {
        if (!area) return;
        setAdWatching(true);
        showRewardedAd({
            onRewarded: () => {
                dayStore.useRefresh(area.key);
                loadEncounters(area);
            },
            onClose: () => setAdWatching(false),
            onError: () => setAdWatching(false),
        });
    };

    const handleFreeRefresh = () => {
        if (!area) return;
        dayStore.useRefresh(area.key);
        loadEncounters(area);
    };

    const handleWatchAdForRetry = () => {
        setAdWatching(true);
        const reward = calcAdReward(progressStore.heroLevel, progressStore.defeatedCount, 'hunt-defeat');
        showRewardedAd({
            onRewarded: () => progressStore.addMoney(reward),
            onClose: () => {
                setAdWatching(false);
                if (area) {
                    loadEncounters(area);
                    setView('pick-encounter');
                    setResult(null);
                }
            },
            onError: () => setAdWatching(false),
        });
    };

    const team = progressStore.getTeam();
    const battleTeam = team.map(o => scalePokemonToLevel(o.data, o.level));

    // ─── Pick area ───
    if (view === 'pick-area') return (
        <div className="story-screen" style={{ padding: 20, maxWidth: 700, margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <button className="story-btn story-btn--secondary" onClick={onBack} style={{ padding: '6px 14px' }}>← Карта</button>
                <h2 style={{ color: '#e2e8f0', margin: 0, fontSize: 20 }}>🏕️ Дикая охота</h2>
                <div style={{ marginLeft: 'auto', color: '#fbbf24', fontSize: 12, fontWeight: 700 }}>
                    День {dayStore.currentDay}
                </div>
            </div>
            <p style={{ color: '#64748b', fontSize: 13, marginBottom: 6 }}>
                Сражайся с дикими покемонами — зарабатывай деньги, получай опыт и лови новых.
            </p>
            <div style={{
                background: '#0f172a', border: '1px solid #334155', borderRadius: 8,
                padding: '8px 14px', marginBottom: 16, fontSize: 11, color: '#94a3b8',
            }}>
                📺 Охот за рекламу сегодня: <strong style={{ color: dayStore.canAdHunt() ? '#fbbf24' : '#f87171' }}>
                    {dayStore.getAdHuntsLeft()}/{MAX_AD_HUNTS}
                </strong>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                {AREAS.map(a => {
                    const locked = currentOpponentIndex < a.minOpponent;
                    const lv = a.baseLevel + currentOpponentIndex * a.levelScale;
                    const huntsLeft = dayStore.getHuntsLeft(a.key);
                    const exhausted = huntsLeft <= 0 && !dayStore.canAdHunt();
                    return (
                        <div key={a.key} onClick={() => !locked && !exhausted && selectArea(a)} style={{
                            border: `2px solid ${locked || exhausted ? '#1e293b' : a.color + '55'}`,
                            borderRadius: 14, padding: '16px 12px', textAlign: 'center',
                            background: locked || exhausted ? '#080f1a' : '#0f172a',
                            cursor: locked || exhausted ? 'not-allowed' : 'pointer',
                            opacity: locked ? 0.45 : exhausted ? 0.6 : 1, transition: 'all 0.2s',
                        }}
                            onMouseEnter={e => !locked && !exhausted && (e.currentTarget.style.borderColor = a.color)}
                            onMouseLeave={e => !locked && !exhausted && (e.currentTarget.style.borderColor = a.color + '55')}
                        >
                            <div style={{ fontSize: 34, marginBottom: 6 }}>{a.emoji}</div>
                            <div style={{ color: '#e2e8f0', fontWeight: 700, fontSize: 14, marginBottom: 3 }}>{a.label}</div>
                            <div style={{ color: '#64748b', fontSize: 10, marginBottom: 6, lineHeight: 1.4 }}>{a.desc}</div>
                            <div style={{ color: '#94a3b8', fontSize: 11 }}>Lv.{lv}–{lv + 5}</div>
                            <div style={{ color: '#fbbf24', fontSize: 12, marginTop: 3 }}>
                                🏆 до {(lv * a.moneyPerLevel).toLocaleString()}G
                            </div>
                            {/* Hunt counter */}
                            {!locked && (
                                <div style={{
                                    marginTop: 6, fontSize: 10, fontWeight: 700,
                                    color: huntsLeft > 2 ? '#4ade80' : huntsLeft > 0 ? '#fbbf24' : '#f87171',
                                }}>
                                    🎯 {huntsLeft}/{MAX_HUNTS_PER_AREA} охот
                                </div>
                            )}
                            {locked && (
                                <div style={{ color: '#475569', fontSize: 10, marginTop: 6 }}>
                                    🔒 Нужно {a.minOpponent} побед
                                </div>
                            )}
                            {exhausted && !locked && (
                                <div style={{ color: '#f87171', fontSize: 10, marginTop: 4 }}>
                                    Пропустите день
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );

    // ─── Pick encounter ───
    if (view === 'pick-encounter') {
        const huntsLeft = area ? dayStore.getHuntsLeft(area.key) : 0;
        const needsAd = huntsLeft <= 0;
        const canRefreshFree = area ? dayStore.canRefreshFree(area.key) : false;
        const canRefreshAd = area ? dayStore.needsAdForRefresh(area.key) : false;

        return (
            <div className="story-screen" style={{ padding: 20, maxWidth: 700, margin: '0 auto' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                    <button className="story-btn story-btn--secondary" onClick={() => setView('pick-area')} style={{ padding: '6px 14px' }}>← Назад</button>
                    <h2 style={{ color: '#e2e8f0', margin: 0, fontSize: 20 }}>{area?.emoji} {area?.label}</h2>
                    <div style={{ marginLeft: 'auto', display: 'flex', gap: 6, alignItems: 'center' }}>
                        <span style={{
                            fontSize: 11, fontWeight: 700,
                            color: huntsLeft > 2 ? '#4ade80' : huntsLeft > 0 ? '#fbbf24' : '#f87171',
                        }}>
                            🎯 {huntsLeft}/{MAX_HUNTS_PER_AREA}
                        </span>
                        {canRefreshFree ? (
                            <button onClick={handleFreeRefresh} style={{
                                background: '#1e293b', border: '1px solid #334155',
                                borderRadius: 8, color: '#4ade80', padding: '5px 10px', cursor: 'pointer', fontSize: 11, fontWeight: 700,
                            }}>🔄 Обновить (бесп.)</button>
                        ) : canRefreshAd ? (
                            <button onClick={handleRefreshWithAd} disabled={adWatching} style={{
                                background: '#1e293b', border: '1px solid #f59e0b55',
                                borderRadius: 8, color: '#fbbf24', padding: '5px 10px', cursor: 'pointer', fontSize: 11, fontWeight: 700,
                            }}>{adWatching ? '⏳' : '📺 Обновить (реклама)'}</button>
                        ) : null}
                    </div>
                </div>
                {loading ? (
                    <div style={{ textAlign: 'center', padding: 50, color: '#64748b' }}>Загрузка...</div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        {encounters.map((enc, i) => (
                            <div key={i} style={{
                                border: '2px solid #334155', borderRadius: 12, padding: 14,
                                background: '#0f172a', display: 'flex', flexDirection: 'column', gap: 10,
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <img src={enc.pokemon.sprites.front_default} alt={enc.pokemon.name}
                                        style={{ width: 64, height: 64, imageRendering: 'pixelated' }} />
                                    <div style={{ flex: 1 }}>
                                        <div style={{ color: '#e2e8f0', fontWeight: 700, textTransform: 'uppercase', fontSize: 13 }}>
                                            {enc.pokemon.name}
                                        </div>
                                        <div style={{ color: '#64748b', fontSize: 11, marginBottom: 4 }}>Lv.{enc.level}</div>
                                        <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                                            {enc.pokemon.types.map(t => (
                                                <span key={t.type.name} className={`type-badge type-${t.type.name}`} style={{ fontSize: 9 }}>
                                                    {t.type.name}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <div style={{ background: '#080f1e', borderRadius: 8, padding: '6px 8px' }}>
                                    <PokemonStatMini pokemon={enc.pokemon} level={enc.level} compact />
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', gap: 6 }}>
                                    <span style={{ color: '#fbbf24', fontSize: 13, fontWeight: 700 }}>
                                        💰 {enc.moneyReward.toLocaleString()}G
                                    </span>
                                    <div style={{ display: 'flex', gap: 6 }}>
                                        {!needsAd ? (
                                            <>
                                                <button onClick={() => simulateFight(enc)} style={{
                                                    background: '#1e293b', border: '1px solid #475569', borderRadius: 6,
                                                    color: '#94a3b8', padding: '6px 10px', fontSize: 11, cursor: 'pointer',
                                                }}>💨 Sim</button>
                                                <button className="menu-button" style={{ padding: '6px 12px', fontSize: 11 }}
                                                    onClick={() => startFight(enc)}>
                                                    ⚔️ Бой!
                                                </button>
                                            </>
                                        ) : dayStore.canAdHunt() ? (
                                            <button onClick={() => startFightWithAd(enc)} disabled={adWatching} style={{
                                                background: '#78350f', border: '1px solid #f59e0b', borderRadius: 6,
                                                color: '#fbbf24', padding: '6px 12px', fontSize: 11, cursor: 'pointer', fontWeight: 700,
                                            }}>
                                                {adWatching ? '⏳' : `📺 Бой (${dayStore.getAdHuntsLeft()} ост.)`}
                                            </button>
                                        ) : (
                                            <span style={{ color: '#f87171', fontSize: 10 }}>Лимит исчерпан</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    // ─── Strange Merchant ───
    if (view === 'merchant') return (
        <StrangeMerchant onLeave={() => setView('pick-area')} />
    );

    // ─── Battle ───
    if (view === 'battling' && active) return (
        <BattleArena
            team1={battleTeam}
            team2={[scalePokemonToLevel(active.pokemon, active.level)]}
            maxSize={3}
            goToMenu={() => { gameplayStop(); setView('pick-encounter'); }}
            onBattleEnd={handleBattleEnd}
        />
    );

    // ─── Result ───
    if (view === 'result' && active) {
        const isWin = result?.winner === 1;
        const hasAnyBall = BALLS.some(b => (progressStore.bag.find(i => i.id === b.id)?.qty ?? 0) > 0);
        const canCatch = isWin && hasAnyBall && !catchDone;
        const isShinyIcon = progressStore.lastCaughtShiny && caughtName;
        const hasPendingEvos = progressStore.pendingEvolutions.length > 0;

        return (
            <div style={{ padding: 24, maxWidth: 480, margin: '0 auto', textAlign: 'center' }}>
                <div style={{ fontSize: 48, marginBottom: 8 }}>{isWin ? '✨' : '💀'}</div>
                <div style={{ color: isWin ? '#4ade80' : '#f87171', fontWeight: 800, fontSize: 24, marginBottom: 16 }}>
                    {isWin ? 'ПОБЕДА!' : 'ПОРАЖЕНИЕ'}
                </div>
                <div style={{ position: 'relative', display: 'inline-block', marginBottom: 12 }}>
                    <img
                        src={active.pokemon.sprites.front_default}
                        alt={active.pokemon.name}
                        style={{
                            width: 96, height: 96, imageRendering: 'pixelated',
                            filter: isShinyIcon ? 'hue-rotate(200deg) saturate(2) brightness(1.2)' : undefined,
                        }}
                    />
                </div>
                <div style={{ color: '#e2e8f0', fontSize: 14, marginBottom: 16 }}>
                    {isWin
                        ? <span style={{ color: '#fbbf24', fontWeight: 700, fontSize: 20 }}>+{result?.money.toLocaleString()}G</span>
                        : <span style={{ color: '#64748b' }}>За поражение опыт не начисляется.</span>
                    }
                </div>

                {!isWin && (
                    <div style={{
                        background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.3)',
                        borderRadius: 10, padding: '10px 14px', marginBottom: 14,
                    }}>
                        <div style={{ color: '#fbbf24', fontSize: 11, marginBottom: 6 }}>
                            📺 Посмотрите рекламу — получите +300G и ещё попытки!
                        </div>
                        <button
                            onClick={handleWatchAdForRetry}
                            disabled={adWatching}
                            style={{
                                background: '#f59e0b', border: 'none', borderRadius: 8,
                                color: '#000', fontWeight: 700, fontSize: 11,
                                padding: '6px 16px', cursor: 'pointer',
                            }}
                        >
                            {adWatching ? '⏳...' : '📺 Смотреть рекламу'}
                        </button>
                    </div>
                )}

                {canCatch && (
                    <div style={{
                        background: '#0f172a', border: '2px solid #334155', borderRadius: 12,
                        padding: 16, marginBottom: 16,
                    }}>
                        <div style={{ color: '#e2e8f0', fontSize: 13, marginBottom: 10 }}>
                            Выбери шар, чтобы поймать <strong style={{ textTransform: 'capitalize' }}>{active.pokemon.name}</strong> Lv.{active.level}:
                        </div>
                        <div style={{ color: '#94a3b8', fontSize: 11, marginBottom: 12 }}>
                            Ваш Hero Lv.{progressStore.heroLevel} — шансы зависят от разницы уровней.
                        </div>
                        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
                            {BALLS.map(ball => {
                                const qty = progressStore.bag.find(i => i.id === ball.id)?.qty ?? 0;
                                const chance = calcCatchChance(ball.id, progressStore.heroLevel, active.level);
                                const blocked = qty === 0;
                                return (
                                    <button key={ball.id} disabled={blocked} onClick={() => handleCatchWithBall(ball.id)} style={{
                                        background: blocked ? '#1e293b' : '#0f172a',
                                        border: `2px solid ${blocked ? '#334155' : '#dc2626'}`,
                                        borderRadius: 8, padding: '10px 14px', cursor: blocked ? 'not-allowed' : 'pointer',
                                        color: '#e2e8f0', opacity: blocked ? 0.5 : 1,
                                        display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 78,
                                    }}>
                                        <div style={{ fontSize: 24 }}>{ball.icon}</div>
                                        <div style={{ fontSize: 9, color: '#94a3b8' }}>×{qty}</div>
                                        <div style={{ fontSize: 11, color: '#4ade80', fontWeight: 700 }}>{Math.round(chance * 100)}%</div>
                                    </button>
                                );
                            })}
                        </div>
                        <button className="exe" onClick={() => setCatchDone(true)} style={{ marginTop: 12 }}>Пропустить</button>
                    </div>
                )}
                {catchDone && !caughtName && active && (
                    <div style={{ color: '#f87171', fontSize: 12, marginBottom: 10 }}>
                        💔 Покемон вырвался! Попробуй шар получше или подними уровень героя.
                    </div>
                )}
                {caughtName && (
                    <div style={{ color: isShinyIcon ? '#fbbf24' : '#4ade80', fontWeight: 600, marginBottom: 12, fontSize: 14 }}>
                        {isShinyIcon ? '✨ ШАЙНИ ПОЙМАН! ' : '🎉 '}{caughtName} добавлен в ПК-Ящик!
                    </div>
                )}

                {hasPendingEvos && !evosDone && (
                    <EvolutionQueue onDone={() => setEvosDone(true)} />
                )}

                <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 20 }}>
                    <button className="story-btn story-btn--secondary"
                        onClick={() => { progressStore.clearLastCaughtShiny(); setEvosDone(false); setView('pick-area'); setResult(null); }}>
                        🏕️ Ещё охота
                    </button>
                    <button className="menu-button" onClick={() => { progressStore.clearLastCaughtShiny(); onBack(); }}>← На карту</button>
                </div>
            </div>
        );
    }

    return null;
};

export default StoryHunt;
