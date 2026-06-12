import React, { useEffect, useState } from 'react';
import { useStoryStore } from '../store/storyStore';
import { useProgressStore } from '../store/progressStore';
import { useDayStore } from '../store/dayStore';

import { applyEquipmentToPokemon, applyBuffToPokemon } from '../utils/equipUtils';
import { simulateTeamBattle } from '../utils/battleSimulation';
import { OPPONENTS, FINAL_INDEX } from '../data/storyData';
import DialogueBox, { PLAYER_SPRITE } from './DialogueBox';
import { fetchPokemonsByIds } from '../services/ApiService';
import { scalePokemonToLevel, calcBattleHP } from '../utils/progressUtils';
import type { Pokemon } from '../types/Pokemon';
import BattleArena from './BattleArena';
import type { TrainerComments } from './BattleArena';
import StoryMap from './StoryMap';
import StoryTeamSelect from './StoryTeamSelect';
import StoryInventory from './StoryInventory';
import StoryShop from './StoryShop';
import StoryHunt from './StoryHunt';
import BossRush from './BossRush';
import Leaderboard from './Leaderboard';
import EvolutionQueue from './EvolutionQueue';
import Tournament from './Tournament';
import { gameplayStart, gameplayStop, showRewardedAd, scheduleCloudSave, calcAdReward } from '../utils/ysdk';


// ─────────────── Pre-Battle Screen ───────────────
const PreBattleScreen: React.FC<{
    opponent: (typeof OPPONENTS)[0];
    opponentTeam: Pokemon[];
    playerTeam: Array<{ name: string; sprite: string; level: number; maxHP: number }>;
    loading: boolean;
    hasBuff: boolean;
    isRematch: boolean;
    onFight: () => void;
    onSimulate?: () => void;
    onBack: () => void;
    onInventory: () => void;
}> = ({ opponent, opponentTeam, playerTeam, loading, hasBuff, isRematch, onFight, onSimulate, onBack, onInventory }) => (
    <div className="story-prebattle">
        <div className="prebattle-vs-bar">
            <div className="prebattle-side">
                <img src={PLAYER_SPRITE} alt="Вы" style={{ width: 48, height: 48, objectFit: 'contain', imageRendering: 'pixelated' }}
                    onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                <span className="prebattle-label">ВЫ</span>
                <div className="prebattle-sprites">
                    {playerTeam.map((p, i) => (
                        <div key={i} className="prebattle-pok-wrap">
                            <img src={p.sprite} alt={p.name} className="prebattle-sprite" />
                            <div className="prebattle-hp-bar-wrap">
                                <div className="prebattle-hp-bar-fill" style={{ width: '100%', background: '#4ade80' }} />
                            </div>
                            <div className="prebattle-pok-level">Lv.{p.level} · {p.maxHP}HP</div>
                        </div>
                    ))}
                </div>
                {hasBuff && (
                    <div style={{ marginTop: 6, background: 'rgba(79,70,229,0.2)', borderRadius: 6, padding: '4px 10px', color: '#a5b4fc', fontSize: 11, fontWeight: 700 }}>
                        ⚡ Усилители активны!
                    </div>
                )}
            </div>
            <div className="prebattle-vs">⚔️</div>
            <div className="prebattle-side">
                <span className="prebattle-label">{opponent.name}</span>
                <div className="prebattle-sprites">
                    {loading
                        ? Array.from({ length: 3 }, (_, i) => <div key={i} className="prebattle-sprite-skeleton" />)
                        : opponentTeam.map(p => (
                            <img key={p.id} src={p.sprites.front_default} alt={p.name} className="prebattle-sprite" />
                        ))
                    }
                </div>
            </div>
        </div>

        <div className="prebattle-info">
            <div className="prebattle-trainer-row">
                <img
                    src={opponent.sprite}
                    alt={opponent.name}
                    className="prebattle-trainer-sprite"
                    onError={e => {
                        const img = e.target as HTMLImageElement;
                        img.style.display = 'none';
                        (img.nextElementSibling as HTMLElement | null)?.style.removeProperty('display');
                    }}
                />
                <span className="prebattle-emoji" style={{ display: 'none' }}>{opponent.emoji}</span>
                <div>
                    <div className="prebattle-trainer-name">{opponent.name}</div>
                    <div className="prebattle-trainer-title">{opponent.title}</div>
                    <div className="prebattle-location">📍 {opponent.location} · Ур.{opponent.opponentLevel}</div>
                </div>
            </div>
            <blockquote className="prebattle-quote">"{opponent.intro}"</blockquote>
        </div>

        <div className="prebattle-btns">
            <button className="exe" onClick={onBack}>← ОТСТУПИТЬ</button>
            <button className="story-btn story-btn--secondary" onClick={onInventory}>🎒 Усилители</button>
            {isRematch && onSimulate && (
                <button className="story-btn story-btn--secondary" disabled={loading} onClick={onSimulate}>
                    💨 Симуляция
                </button>
            )}
            <button className="menu-button" disabled={loading} onClick={onFight}>
                {loading ? '⏳ Загрузка...' : '⚔️ СРАЖАТЬСЯ!'}
            </button>
        </div>
    </div>
);

// ─────────────── Victory Screen ───────────────
const VictoryScreen: React.FC<{
    opponent: (typeof OPPONENTS)[0];
    opponentTeam: Pokemon[];
    moneyEarned: number;
    onContinue: () => void;
}> = ({ opponent, opponentTeam, moneyEarned, onContinue }) => {
    const { pendingLevelUps, clearPendingLevelUps, tryCatchPokemon, bag, pendingEvolutions, lastCaughtShiny, clearLastCaughtShiny, heroLevel } = useProgressStore();
    const [catchDone, setCatchDone] = useState(false);
    const [caughtName, setCaughtName] = useState('');
    const [evosDone, setEvosDone] = useState(false);
    const [pendingCatchTarget, setPendingCatchTarget] = useState<Pokemon | null>(null);

    const hasAnyBall = ['pokeball', 'great-ball', 'ultra-ball', 'master-ball'].some(bid => (bag.find(i => i.id === bid)?.qty ?? 0) > 0);
    const canCatch = hasAnyBall && !catchDone && opponentTeam.length > 0;

    const handleCatchWithBall = (pok: Pokemon, ballId: 'pokeball' | 'great-ball' | 'ultra-ball' | 'master-ball') => {
        const level = Math.max(1, opponent.opponentLevel - 2);
        const res = tryCatchPokemon(pok, level, ballId);
        if (res.success) setCaughtName(pok.name);
        setCatchDone(true);
        setPendingCatchTarget(null);
    };

    const handleContinue = () => {
        clearPendingLevelUps();
        clearLastCaughtShiny();
        onContinue();
    };

    return (
        <div className="story-result story-victory">
            <div className="result-title">✨ ПОБЕДА! ✨</div>

            {opponent.badge && (
                <div className="result-badge-wrap">
                    <img src={opponent.badgeSprite} alt={opponent.badgeName || opponent.badge}
                        style={{ width: 48, height: 48, imageRendering: 'pixelated' }} />
                    {opponent.badgeName && <span className="result-badge-name">{opponent.badgeName}</span>}
                </div>
            )}

            <blockquote className="result-quote">
                {opponent.emoji} {opponent.name}: &ldquo;{opponent.loseQuote}&rdquo;
            </blockquote>

            <div className="victory-rewards">
                <div className="victory-reward-item">💰 +{moneyEarned.toLocaleString()}G</div>

                {pendingLevelUps.length > 0 && (
                    <div className="victory-levelups">
                        {pendingLevelUps.map((lu, i) => (
                            <div key={i} className="victory-levelup-row">
                                🎉 <strong>{lu.pokemonName}</strong> достиг уровня <strong>{lu.newLevel}</strong>!
                                {lu.hpIncrease > 0 && <span style={{ color: '#4ade80' }}> (+{lu.hpIncrease} HP)</span>}
                            </div>
                        ))}
                    </div>
                )}

                {canCatch && !pendingCatchTarget && (
                    <div className="victory-catch-section">
                        <div className="victory-catch-title" style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center' }}>
                            <img src="./sprites/balls/poke-ball.png" alt="" style={{ width: 22, height: 22, imageRendering: 'pixelated' }} />
                            Захватить покемона?
                        </div>
                        <div className="victory-catch-options">
                            {opponentTeam.map(pok => (
                                <button
                                    key={pok.id}
                                    className="story-btn story-btn--catch"
                                    onClick={() => setPendingCatchTarget(pok)}
                                >
                                    <img src={pok.sprites.front_default} alt={pok.name} style={{ width: 40, height: 40 }} />
                                    <span style={{ textTransform: 'uppercase', fontSize: 11 }}>{pok.name}</span>
                                    <span style={{ color: '#94a3b8', fontSize: 10 }}>Lv.{Math.max(1, opponent.opponentLevel - 2)}</span>
                                </button>
                            ))}
                        </div>
                        <button className="exe" onClick={() => setCatchDone(true)}>Пропустить</button>
                    </div>
                )}

                {pendingCatchTarget && (
                    <div style={{ background: '#0f172a', border: '2px solid #334155', borderRadius: 12, padding: 12, marginTop: 10 }}>
                        <div style={{ color: '#e2e8f0', fontSize: 12, marginBottom: 8 }}>
                            Выбери шар (Hero Lv.{heroLevel} vs покемон Lv.{Math.max(1, opponent.opponentLevel - 2)}):
                        </div>
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap' }}>
                            {(['pokeball', 'great-ball', 'ultra-ball', 'master-ball'] as const).map(ballId => {
                                const ballDef = bag.find(i => i.id === ballId);
                                const qty = ballDef?.qty ?? 0;
                                const targetLevel = Math.max(1, opponent.opponentLevel - 2);
                                // Inline chance calc — same as ballData.ts
                                const baseRate = ballId === 'pokeball' ? 0.35 : ballId === 'great-ball' ? 0.6 : ballId === 'ultra-ball' ? 0.85 : 1.0;
                                const delta = targetLevel - heroLevel;
                                let mult = delta <= 0 ? 1 : delta <= 5 ? 1 - delta * 0.1 : delta <= 10 ? 0.5 - (delta - 5) * 0.07 : 0.15;
                                if (ballId === 'master-ball') mult = 1;
                                const chance = Math.max(0.05, Math.min(1, baseRate * mult));
                                const sprite = ballId === 'pokeball' ? './sprites/balls/poke-ball.png' : `./sprites/balls/${ballId}.png`;
                                return (
                                    <button key={ballId} disabled={qty === 0} onClick={() => handleCatchWithBall(pendingCatchTarget, ballId)} style={{
                                        background: qty > 0 ? '#0f172a' : '#1e293b',
                                        border: `2px solid ${qty > 0 ? '#dc2626' : '#334155'}`,
                                        borderRadius: 8, padding: '8px 12px', cursor: qty > 0 ? 'pointer' : 'not-allowed',
                                        color: '#e2e8f0', opacity: qty > 0 ? 1 : 0.5, minWidth: 70,
                                    }}>
                                        <div><img src={sprite} alt={ballId} style={{ width: 28, height: 28, imageRendering: 'pixelated' }} /></div>
                                        <div style={{ fontSize: 9, color: '#94a3b8' }}>×{qty}</div>
                                        <div style={{ fontSize: 10, color: '#4ade80', fontWeight: 700 }}>{Math.round(chance * 100)}%</div>
                                    </button>
                                );
                            })}
                        </div>
                        <button className="exe" onClick={() => setPendingCatchTarget(null)} style={{ marginTop: 8 }}>← Назад</button>
                    </div>
                )}

                {caughtName && (
                    <div className="victory-caught">
                        {lastCaughtShiny ? '✨ ШАЙНИ! ' : '🎉 '}{caughtName} добавлен в ПК-Ящик!
                        {lastCaughtShiny && <span style={{ color: '#fbbf24' }}> Редкий!</span>}
                    </div>
                )}
                {catchDone && !caughtName && pendingCatchTarget === null && (
                    <div style={{ color: '#f87171', fontSize: 11, marginTop: 6 }}>💔 Не удалось поймать.</div>
                )}
            </div>

            {pendingEvolutions.length > 0 && !evosDone && (
                <EvolutionQueue onDone={() => setEvosDone(true)} />
            )}

            <button
                className="menu-button"
                onClick={handleContinue}
                disabled={canCatch && !catchDone}
                style={{ marginTop: 16 }}
            >
                ПРОДОЛЖИТЬ →
            </button>
        </div>
    );
};

// ─────────────── Defeat Screen ───────────────
const DefeatScreen: React.FC<{
    opponent: (typeof OPPONENTS)[0];
    onRetry: () => void;
    onMenu: () => void;
    onInventory: () => void;
    onRewardedRetry: () => void;
}> = ({ opponent, onRetry, onMenu, onInventory, onRewardedRetry }) => {
    const { clearPendingLevelUps, addMoney, heroLevel, defeatedCount } = useProgressStore();
    const [adWatched, setAdWatched] = useState(false);
    const adReward = calcAdReward(heroLevel, defeatedCount, 'story-defeat');

    const handleRetry = () => { clearPendingLevelUps(); onRetry(); };
    const handleMenu = () => { clearPendingLevelUps(); onMenu(); };

    const handleWatchAd = () => {
        showRewardedAd({
            onRewarded: () => {
                addMoney(adReward);
                setAdWatched(true);
            },
            onClose: () => {
                if (adWatched) {
                    clearPendingLevelUps();
                    onRewardedRetry();
                }
            },
            onError: () => { /* ignore */ },
        });
    };

    return (
        <div className="story-result story-defeat">
            <div className="result-title">💀 ПОРАЖЕНИЕ</div>
            <blockquote className="result-quote">
                {opponent.emoji} {opponent.name}: &ldquo;{opponent.winQuote}&rdquo;
            </blockquote>

            <div style={{ color: '#94a3b8', fontSize: 12, marginBottom: 14, fontStyle: 'italic' }}>
                За поражение опыт не начисляется.
            </div>

            <div style={{
                background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.3)',
                borderRadius: 10, padding: '10px 14px', marginBottom: 14, textAlign: 'center',
            }}>
                <div style={{ color: '#fbbf24', fontSize: 12, marginBottom: 6 }}>
                    📺 Посмотрите рекламу — получите +{adReward.toLocaleString()}G и второй шанс!
                </div>
                <button
                    onClick={handleWatchAd}
                    style={{
                        background: '#f59e0b', border: 'none', borderRadius: 8,
                        color: '#000', fontWeight: 700, fontSize: 12,
                        padding: '8px 20px', cursor: 'pointer',
                    }}
                >
                    📺 Смотреть рекламу
                </button>
            </div>

            <div className="result-btns">
                <button className="exe" onClick={handleMenu}>← МЕНЮ</button>
                <button className="story-btn story-btn--secondary" onClick={onInventory}>🎒 Усилители</button>
                <button className="menu-button" onClick={handleRetry}>🔄 ЕЩЁ РАЗ</button>
            </div>
        </div>
    );
};

// ─────────────── Champion Screen (two milestones) ───────────────
const ChampionScreen: React.FC<{ isFinale: boolean; onMenu: () => void; onContinue: () => void }> = ({ isFinale, onMenu, onContinue }) => (
    <div className="story-result story-champion">
        <div className="champion-crown">{isFinale ? '🧬' : '👑'}</div>
        <div className="result-title champion-title">
            {isFinale ? 'ЖИВАЯ ЛЕГЕНДА!' : 'ЧЕМПИОН ЛИГИ!'}
        </div>
        {isFinale ? (
            <p className="champion-text">
                Восемь значков. Элитная Четвёрка. Чемпион Блу.<br />
                Безмолвный Ред на вершине Маунт-Сильвер.<br />
                Легендарные птицы и сам Мьюту.<br /><br />
                Истории о тебе будут рассказывать веками.<br />
                Ты — величайший Тренер в истории Покемонов!
            </p>
        ) : (
            <p className="champion-text">
                Ты победил всех 8 Лидеров Арен, Элитную Четвёрку<br />
                и самого Чемпиона Блу.<br /><br />
                Но слухи не утихают: старые враги зашевелились,<br />
                а на вершине Маунт-Сильвер кто-то ждёт...<br />
                <strong style={{ color: '#facc15' }}>Приключение продолжается!</strong>
            </p>
        )}
        <div className="champion-badges">
            {OPPONENTS.map(o => o.badge && (
                <img key={o.id} src={o.badgeSprite} alt={o.badgeName || o.badge}
                    className="champ-badge"
                    style={{ width: 28, height: 28, imageRendering: 'pixelated' }} />
            ))}
        </div>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <button className="story-btn story-btn--secondary" onClick={onMenu}>🏠 В меню</button>
            <button className="menu-button" onClick={onContinue}>
                {isFinale ? '🗺️ НА КАРТУ' : '🌑 АКТ III →'}
            </button>
        </div>
    </div>
);

// ─────────────── Main Orchestrator ───────────────
interface Props {
    goToMenu: () => void;
}

const StoryMode: React.FC<Props> = ({ goToMenu }) => {
    const {
        phase, defeatedIndices, currentOpponentIndex, ngPlusLevel,
        setPlayerTeam, selectOpponent, startBattle, handleBattleEnd,
        goToMap, openShop, openInventory, openHunt, openBossRush, openLeaderboard, openTournament, retry, reset: resetStory, startNgPlus,
    } = useStoryStore();

    const progressStore = useProgressStore();

    const [opponentTeam, setOpponentTeam] = useState<Pokemon[]>([]);
    const [loadingOpponent, setLoadingOpponent] = useState(false);
    const [moneyEarned, setMoneyEarned] = useState(0);
    // Dialogue plays once per opponent (persisted — not replayed on retry or revisit)
    const [seenDialogues, setSeenDialogues] = useState<Set<string>>(() => {
        try { return new Set(JSON.parse(localStorage.getItem('pok-dlg-seen') ?? '[]')); }
        catch { return new Set(); }
    });

    const currentOpponent = OPPONENTS[currentOpponentIndex];
    const isRematch = defeatedIndices.includes(currentOpponentIndex);
    const dialogueDone = seenDialogues.has(currentOpponent.id);

    // Restore to map if saved progress exists but phase was reset by page refresh
    useEffect(() => {
        if (progressStore.initialized && phase === 'team-select') {
            goToMap();
        }
    }, []);

    // Load opponent Pokemon when entering pre-battle (auto-equip enemies based on opp index)
    useEffect(() => {
        if (phase !== 'pre-battle') return;
        setLoadingOpponent(true);
        setOpponentTeam([]);
        // Build enemy loadout if not pre-set on the opponent
        import('../data/equipmentData').then(({ buildEnemyLoadout }) => {
            const loadout = currentOpponent.enemyEquipment ?? buildEnemyLoadout(currentOpponentIndex);
            const ngMult = ngPlusLevel > 0 ? Math.pow(2, ngPlusLevel) : 1;
            fetchPokemonsByIds(currentOpponent.pokemonIds)
                .then(poks => {
                    const scaled = poks.map(p => {
                        let s = scalePokemonToLevel(p, currentOpponent.opponentLevel);
                        s = applyEquipmentToPokemon(s, loadout);
                        if (ngMult > 1) {
                            s = {
                                ...s,
                                statsMap: Object.fromEntries(
                                    Object.entries(s.statsMap).map(([k, v]) => [k, Math.floor((v as number) * ngMult)])
                                ) as Pokemon['statsMap'],
                                stats: s.stats.map(st => ({ ...st, base_stat: Math.floor(st.base_stat * ngMult) })),
                            };
                        }
                        return s;
                    });
                    setOpponentTeam(scaled);
                })
                .finally(() => setLoadingOpponent(false));
        });
    }, [phase, currentOpponentIndex]);

    const handleTeamSelected = (team: Pokemon[]) => {
        if (ngPlusLevel > 0) {
            const mult = Math.pow(2, ngPlusLevel);
            const boosted = team.map(p => ({
                ...p,
                statsMap: Object.fromEntries(
                    Object.entries(p.statsMap).map(([k, v]) => [k, Math.floor((v as number) * mult)])
                ) as Pokemon['statsMap'],
                stats: p.stats.map(s => ({ ...s, base_stat: Math.floor(s.base_stat * mult) })),
            }));
            progressStore.initProgress(boosted);
            setPlayerTeam(boosted);
        } else {
            progressStore.initProgress(team);
            setPlayerTeam(team);
        }
    };

    const handleBattleEndWithProgress = (winner: 1 | 2) => {
        progressStore.giveExpToTeam(currentOpponent.opponentLevel, winner === 1);
        progressStore.giveHeroXp(currentOpponent.opponentLevel, winner === 1, false);
        const isRematch = defeatedIndices.includes(currentOpponentIndex);
        const earned = winner === 1 ? Math.round(currentOpponent.moneyReward * (isRematch ? 0.4 : 1)) : 0;
        if (winner === 1) progressStore.addMoney(earned);
        setMoneyEarned(earned);
        progressStore.clearBuff();
        handleBattleEnd(winner);
        // Sync defeated count
        progressStore.setDefeatedCount(defeatedIndices.length + (winner === 1 && !isRematch ? 1 : 0));
        scheduleCloudSave();
    };

    // Preserve progress — only sets phase back to map before leaving
    const handleGoToMenu = () => {
        gameplayStop();
        goToMap();
        goToMenu();
    };

    // Full wipe — only from the explicit "Начать сначала" button
    const handleRestart = () => {
        resetStory();
        progressStore.reset();
        useDayStore.getState().reset();
        localStorage.removeItem('pok-dlg-seen');
        setSeenDialogues(new Set());
    };

    const handleNgPlus = () => {
        startNgPlus();
        localStorage.removeItem('pok-dlg-seen');
        setSeenDialogues(new Set());
    };

    // Build battle team: scaled Pokemon with optional buff applied
    const team = progressStore.getTeam();
    const pendingBuff = progressStore.pendingBuff;

    const battleTeam = team.map(owned => {
        let scaled = scalePokemonToLevel(owned.data, owned.level);
        scaled = applyEquipmentToPokemon(scaled, owned.equipment);
        return pendingBuff ? applyBuffToPokemon(scaled, pendingBuff) : scaled;
    });

    // Summary for PreBattleScreen — HP always 100%
    const preBattlePlayerTeam = team.map(owned => ({
        name: owned.data.name,
        sprite: owned.data.sprites.front_default,
        level: owned.level,
        maxHP: calcBattleHP(owned.data.statsMap.hp, owned.level),
    }));

    if (phase === 'team-select') {
        return <StoryTeamSelect onTeamSelected={handleTeamSelected} goToMenu={goToMenu} ngPlusLevel={ngPlusLevel} />;
    }

    if (phase === 'hunt') {
        return <StoryHunt onBack={goToMap} />;
    }

    if (phase === 'boss-rush') {
        return <BossRush onBack={goToMap} />;
    }

    if (phase === 'leaderboard') {
        return <Leaderboard onBack={goToMap} />;
    }

    if (phase === 'tournament') {
        return <Tournament onBack={goToMap} />;
    }

    if (phase === 'shop') {
        return <StoryShop onBack={goToMap} currentOpponentIndex={currentOpponentIndex} />;
    }

    if (phase === 'inventory') {
        return <StoryInventory onBack={goToMap} />;
    }

    if (phase === 'battle') {
        gameplayStart();
        return (
            <BattleArena
                team1={battleTeam}
                team2={opponentTeam}
                maxSize={3}
                goToMenu={goToMap}
                historyMode="story"
                onBattleEnd={handleBattleEndWithProgress}
                trainerComments={{
                    trainerName: currentOpponent.name,
                    trainerEmoji: currentOpponent.emoji,
                    trainerSprite: currentOpponent.sprite,
                    onWinning: currentOpponent.battleQuotes.onWinning,
                    onLosing: currentOpponent.battleQuotes.onLosing,
                    lastPokemon: currentOpponent.battleQuotes.lastPokemon,
                } satisfies TrainerComments}
            />
        );
    }

    if (phase === 'champion') {
        return (
            <ChampionScreen
                isFinale={currentOpponentIndex === FINAL_INDEX}
                onMenu={handleGoToMenu}
                onContinue={goToMap}
            />
        );
    }

    if (phase === 'pre-battle') {
        // Story dialogue plays before the first encounter; rematches go straight to the panel
        if (!dialogueDone && !isRematch && currentOpponent.dialogue.length > 0) {
            return (
                <DialogueBox
                    opponent={currentOpponent}
                    onDone={() => setSeenDialogues(prev => {
                        const next = new Set(prev).add(currentOpponent.id);
                        localStorage.setItem('pok-dlg-seen', JSON.stringify([...next]));
                        return next;
                    })}
                />
            );
        }
        const handleSimulate = () => {
            if (opponentTeam.length === 0) return;
            const sim = simulateTeamBattle(battleTeam, opponentTeam);
            handleBattleEndWithProgress(sim.winner);
        };
        return (
            <PreBattleScreen
                opponent={currentOpponent}
                opponentTeam={opponentTeam}
                playerTeam={preBattlePlayerTeam}
                loading={loadingOpponent}
                hasBuff={pendingBuff !== null}
                isRematch={isRematch}
                onFight={startBattle}
                onSimulate={isRematch ? handleSimulate : undefined}
                onBack={goToMap}
                onInventory={openInventory}
            />
        );
    }

    if (phase === 'victory') {
        return (
            <VictoryScreen
                opponent={currentOpponent}
                opponentTeam={opponentTeam}
                moneyEarned={moneyEarned}
                onContinue={goToMap}
            />
        );
    }

    if (phase === 'defeat') {
        return (
            <DefeatScreen
                opponent={currentOpponent}
                onRetry={retry}
                onMenu={() => { gameplayStop(); goToMap(); }}
                onInventory={openInventory}
                onRewardedRetry={retry}
            />
        );
    }

    // phase === 'map'
    return (
        <StoryMap
            defeatedIndices={defeatedIndices}
            team={team}
            money={progressStore.money}
            onSelectOpponent={selectOpponent}
            onShop={openShop}
            onInventory={openInventory}
            onHunt={openHunt}
            onBossRush={openBossRush}
            onLeaderboard={openLeaderboard}
            onTournament={openTournament}
            onMenu={handleGoToMenu}
            onRestart={handleRestart}
            onNgPlus={handleNgPlus}
        />
    );
};

export default StoryMode;
