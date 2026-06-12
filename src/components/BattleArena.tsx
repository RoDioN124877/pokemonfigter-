import React, { useState, useEffect, useRef, useMemo } from "react";
import type { Pokemon } from "../types/Pokemon";
import useBattleLogic from "../hooks/useBattleLogic";
import ArenaFighterCard from "./ArenaFighterCard";
import TurnQueueDisplay from "./TurnQueueDisplay";
import WeatherOverlay from "./WeatherOverlay";
import SFX, { toggleMute, isMuted } from "../utils/soundUtils";
import { useAchievementStore } from "../store/achievementStore";
import { useHistoryStore } from "../store/historyStore";
import { gameplayStart, gameplayStop, scheduleCloudSave } from "../utils/ysdk";
import { calcTeamPower } from "../utils/battleSimulation";

export interface TrainerComments {
    trainerName: string;
    trainerEmoji: string;
    trainerSprite?: string;
    onWinning: string;
    onLosing: string;
    lastPokemon: string;
}

interface BattleArenaProps {
    team1: Pokemon[];
    team2: Pokemon[];
    maxSize: 1 | 3;
    goToMenu: () => void;
    onBattleEnd?: (winner: 1 | 2, team1FinalHP?: number[]) => void;
    trainerComments?: TrainerComments;
    team1HP?: number[];
    // Records into achievements/history. Off for tournament live fights where
    // team1 is just a bracket side, not the player.
    countsForStats?: boolean;
    historyMode?: string;
}

const SPEED_OPTIONS = [0.5, 1, 2, 3] as const;
const ARENA_THEMES = ['arena-stadium', 'arena-volcano', 'arena-forest', 'arena-sea', 'arena-night'] as const;

const BattleArena: React.FC<BattleArenaProps> = ({
    team1, team2, maxSize, goToMenu, onBattleEnd, trainerComments,
    countsForStats = true, historyMode, team1HP,
}) => {
    const [battleSpeed, setBattleSpeed] = useState<number>(1);
    const [muted, setMuted] = useState(isMuted());
    const [trainerSpeech, setTrainerSpeech] = useState<string | null>(null);
    const [shake, setShake] = useState<'' | 'shake-light' | 'shake-heavy'>('');

    // Random arena theme per battle session
    const arenaTheme = useMemo(
        () => ARENA_THEMES[Math.floor(Math.random() * ARENA_THEMES.length)],
        [],
    );

    const { battleState, activeSlots, turnQueueVisual, animations, damageQueue, startBattle, resetBattle } =
        useBattleLogic(team1, team2, maxSize, battleSpeed, team1HP);

    // ─── Trainer dialogue ───────────────────────────────────────────────────
    const speechTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const prevP1KOs = useRef(0);
    const prevP2KOs = useRef(0);
    const lastMonShown = useRef(false);

    const showSpeech = (text: string) => {
        if (speechTimer.current) clearTimeout(speechTimer.current);
        setTrainerSpeech(text);
        speechTimer.current = setTimeout(() => setTrainerSpeech(null), 3500);
    };

    const { battleStats } = battleState;

    useEffect(() => {
        if (!trainerComments || !battleState.isBattleActive) return;
        const { p1KOs, p2KOs } = battleStats;

        if (p1KOs > prevP1KOs.current) {
            // Player knocked out one of the opponent's Pokemon
            if (!lastMonShown.current && maxSize - p1KOs === 1) {
                showSpeech(trainerComments.lastPokemon);
                lastMonShown.current = true;
            } else {
                showSpeech(trainerComments.onLosing);
            }
        }

        if (p2KOs > prevP2KOs.current) {
            // Opponent knocked out one of the player's Pokemon
            showSpeech(trainerComments.onWinning);
        }

        prevP1KOs.current = p1KOs;
        prevP2KOs.current = p2KOs;
    }, [battleStats.p1KOs, battleStats.p2KOs]); // eslint-disable-line react-hooks/exhaustive-deps

    // Reset tracker refs when battle resets
    useEffect(() => {
        if (!battleState.isBattleActive && battleState.winner === null) {
            prevP1KOs.current = 0;
            prevP2KOs.current = 0;
            lastMonShown.current = false;
            if (speechTimer.current) clearTimeout(speechTimer.current);
            setTrainerSpeech(null);
        }
    }, [battleState.isBattleActive, battleState.winner]);

    // ─── Victory SFX + stats/history recording ─────────────────────────────
    const recordBattleEnd = useAchievementStore(s => s.recordBattleEnd);
    const addHistoryEntry = useHistoryStore(s => s.addEntry);
    const prevWinner = useRef<1 | 2 | null>(null);
    useEffect(() => {
        if (battleState.winner !== null && prevWinner.current === null) {
            SFX.champ();
            const finalHP = Array.from({ length: maxSize }, (_, i) =>
                Math.max(0, battleState.fighters[`p1-${i + 1}`]?.currentHP ?? 0));
            onBattleEnd?.(battleState.winner, finalHP);
            if (countsForStats) {
                recordBattleEnd(battleState.winner, battleState.battleStats, maxSize);
                addHistoryEntry(
                    historyMode ?? (maxSize === 1 ? '1v1' : '3v3'),
                    battleState.winner, battleState.battleStats, team1, team2,
                );
                scheduleCloudSave();
            }
        }
        prevWinner.current = battleState.winner;
    }, [battleState.winner, onBattleEnd]); // eslint-disable-line react-hooks/exhaustive-deps

    // ─── Yandex GameplayAPI marks: active while a battle runs, in every mode ──
    useEffect(() => {
        if (battleState.isBattleActive) gameplayStart();
        else gameplayStop();
        return () => gameplayStop();
    }, [battleState.isBattleActive]);

    // ─── Screen shake on crit / KO ──────────────────────────────────────────
    const prevCrits = useRef(0);
    const prevKOs = useRef(0);
    useEffect(() => {
        const crits = battleStats.p1Crits + battleStats.p2Crits;
        const kos = battleStats.p1KOs + battleStats.p2KOs;
        if (kos > prevKOs.current) setShake('shake-heavy');
        else if (crits > prevCrits.current) setShake('shake-light');
        prevCrits.current = crits;
        prevKOs.current = kos;
    }, [battleStats.p1Crits, battleStats.p2Crits, battleStats.p1KOs, battleStats.p2KOs]);

    useEffect(() => {
        if (!shake) return;
        const t = setTimeout(() => setShake(''), 500);
        return () => clearTimeout(t);
    }, [shake]);

    const handleToggleMute = () => {
        const nowMuted = toggleMute();
        setMuted(nowMuted);
    };

    const renderTeam = (teamNum: 1 | 2) => {
        const slots = [];
        const activeIdx = teamNum === 1 ? activeSlots.p1 : activeSlots.p2;

        for (let i = 1; i <= maxSize; i++) {
            const key = `p${teamNum}-${i}`;
            const fighter = battleState.fighters[key];
            if (!fighter) continue;

            slots.push(
                <ArenaFighterCard
                    key={key}
                    fighter={fighter}
                    isActive={activeIdx === i}
                    teamNum={teamNum}
                    animClass={animations[key] || ""}
                    damageQueue={damageQueue[key] || []}
                />
            );
        }

        return teamNum === 1 ? slots.reverse() : slots;
    };

    return (
        <div className={`battle-arena ${arenaTheme} ${shake}`}>
            <div className="battle-top-bar">
                <TurnQueueDisplay queue={turnQueueVisual} />
                <div className="battle-top-controls">
                    <button
                        className={`mute-btn ${muted ? 'muted' : ''}`}
                        onClick={handleToggleMute}
                        title={muted ? 'Включить звук' : 'Выключить звук'}
                    >
                        {muted ? '🔇' : '🔊'}
                    </button>
                    <div className="speed-controls">
                        {SPEED_OPTIONS.map(s => (
                            <button
                                key={s}
                                className={`speed-btn ${battleSpeed === s ? 'active' : ''}`}
                                onClick={() => setBattleSpeed(s)}
                            >
                                {s}×
                            </button>
                        ))}
                    </div>
                    <button className="exe" onClick={goToMenu}>EXIT</button>
                </div>
            </div>

            {/* Battle scene */}
            <div className="battle-scene">
                <WeatherOverlay weather={battleState.weather} />
                <div className="platform p1" />
                <div className="platform p2" />

                <div className="team-side team-left">
                    {renderTeam(1)}
                </div>
                <div className="team-side team-right">
                    {renderTeam(2)}
                </div>

                {/* Trainer speech bubble */}
                {trainerComments && trainerSpeech && (
                    <div className="trainer-speech-bubble">
                        {trainerComments.trainerSprite && (
                            <img
                                src={trainerComments.trainerSprite}
                                alt={trainerComments.trainerName}
                                className="trainer-speech-sprite"
                                onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                            />
                        )}
                        <div style={{ minWidth: 0 }}>
                            <div className="trainer-speech-name">
                                {trainerComments.trainerEmoji} {trainerComments.trainerName}
                            </div>
                            <div className="trainer-speech-text">{trainerSpeech}</div>
                        </div>
                    </div>
                )}
            </div>

            {/* Pre-battle stats panel */}
            {!battleState.isBattleActive && battleState.winner === null && (
                <PreBattlePanel team1={team1} team2={team2} />
            )}

            {/* Controls */}
            <div className="battle-controls">
                <button
                    className="menu-button"
                    style={{ fontSize: "0.9rem", padding: "10px 20px" }}
                    disabled={battleState.isBattleActive || battleState.winner !== null}
                    onClick={startBattle}
                >
                    {battleState.isBattleActive ? "БОЙ ИДЕТ..." : "НАЧАТЬ БИТВУ"}
                </button>

                <div className="battle-log">
                    {battleState.log.slice(0, 8).map((line, idx) => (
                        <div key={idx} style={{ opacity: 1 - idx * 0.12 }}>{line}</div>
                    ))}
                </div>
            </div>

            {/* Winner overlay */}
            {battleState.winner && (
                <div className="winner-overlay">
                    {/* CSS confetti */}
                    {Array.from({ length: 26 }, (_, i) => (
                        <span
                            key={i}
                            className="confetti-piece"
                            style={{
                                left: `${(i * 3.9 + (i % 5)) % 100}%`,
                                background: ['#facc15', '#ef4444', '#38bdf8', '#2ecc71', '#a78bfa'][i % 5],
                                animationDelay: `${(i * 0.17) % 2.2}s`,
                                animationDuration: `${2.2 + (i % 4) * 0.45}s`,
                            }}
                        />
                    ))}
                    <h1 style={{ color: "gold", marginBottom: 16 }}>
                        {battleState.winner === 1 ? "ИГРОК 1" : "ИГРОК 2"} ПОБЕЖДАЕТ!
                    </h1>

                    <div className="battle-stats-grid">
                        <div className="bs-header">ИГРОК 1</div>
                        <div className="bs-header">СТАТИСТИКА</div>
                        <div className="bs-header">ИГРОК 2</div>

                        <div className={`bs-val ${battleState.winner === 1 ? 'bs-win' : ''}`}>{battleStats.p1DamageDealt}</div>
                        <div className="bs-label">Урон нанесён</div>
                        <div className={`bs-val ${battleState.winner === 2 ? 'bs-win' : ''}`}>{battleStats.p2DamageDealt}</div>

                        <div className="bs-val">{battleStats.p1Crits}</div>
                        <div className="bs-label">Критов</div>
                        <div className="bs-val">{battleStats.p2Crits}</div>

                        <div className="bs-val">{battleStats.p1KOs}</div>
                        <div className="bs-label">KO</div>
                        <div className="bs-val">{battleStats.p2KOs}</div>

                        <div className="bs-val bs-span3" style={{ gridColumn: '1 / -1' }}>
                            Всего ходов: {battleStats.totalTurns}
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: 10, marginTop: 16, justifyContent: 'center' }}>
                        <button className="menu-button" onClick={resetBattle}>РЕВАНШ</button>
                        <button className="menu-button" onClick={goToMenu}>В МЕНЮ</button>
                    </div>
                </div>
            )}
        </div>
    );
};

const STAT_KEYS: { key: keyof Pokemon['statsMap']; label: string; color: string }[] = [
    { key: 'hp', label: 'ОЗ', color: '#4ade80' },
    { key: 'attack', label: 'АТК', color: '#f87171' },
    { key: 'defense', label: 'ЗАЩ', color: '#60a5fa' },
    { key: 'special-attack', label: 'С.А', color: '#c084fc' },
    { key: 'special-defense', label: 'С.З', color: '#34d399' },
    { key: 'speed', label: 'СКР', color: '#fbbf24' },
];

const ScaledStatBars: React.FC<{ pokemon: Pokemon }> = ({ pokemon }) => {
    const sm = pokemon.statsMap;
    return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px 8px' }}>
            {STAT_KEYS.map(({ key, label, color }) => {
                const val = sm[key];
                const max = key === 'hp' ? 460 : 300;
                const pct = Math.min(100, Math.round((val / max) * 100));
                return (
                    <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                        <span style={{ color: '#475569', fontSize: 8, width: 20, textAlign: 'right', fontWeight: 700 }}>{label}</span>
                        <div style={{ flex: 1, background: '#0a0f1e', borderRadius: 2, height: 4, overflow: 'hidden' }}>
                            <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 2 }} />
                        </div>
                        <span style={{ color: '#64748b', fontSize: 8, width: 24 }}>{val}</span>
                    </div>
                );
            })}
        </div>
    );
};

const PreBattlePanel: React.FC<{ team1: Pokemon[]; team2: Pokemon[] }> = ({ team1, team2 }) => {
    const pow1 = Math.round(calcTeamPower(team1));
    const pow2 = Math.round(calcTeamPower(team2));
    const total = pow1 + pow2 || 1;
    const pct1 = Math.round((pow1 / total) * 100);

    return (
        <div style={{
            width: '95%', maxWidth: 940, margin: '0 auto 8px',
            background: 'rgba(0,0,0,0.55)', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 12, padding: '10px 14px',
        }}>
            {/* Power comparison bar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <span style={{ color: '#60a5fa', fontSize: 12, fontWeight: 800, minWidth: 36, textAlign: 'right' }}>{pow1}</span>
                <div style={{ flex: 1, height: 8, background: '#1e293b', borderRadius: 4, overflow: 'hidden', display: 'flex' }}>
                    <div style={{ width: `${pct1}%`, height: '100%', background: '#3b82f6', transition: 'width 0.4s' }} />
                    <div style={{ flex: 1, height: '100%', background: '#ef4444' }} />
                </div>
                <span style={{ color: '#f87171', fontSize: 12, fontWeight: 800, minWidth: 36 }}>{pow2}</span>
            </div>
            <div style={{ textAlign: 'center', color: '#475569', fontSize: 9, marginBottom: 8, letterSpacing: 1 }}>⚡ СРАВНЕНИЕ СИЛ ⚡</div>

            {/* Teams side by side */}
            <div style={{ display: 'flex', gap: 10 }}>
                <div style={{ flex: 1 }}>
                    {team1.map((p, i) => (
                        <div key={i} style={{ marginBottom: i < team1.length - 1 ? 6 : 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 2 }}>
                                <img src={p.sprites.front_default} alt={p.name}
                                    style={{ width: 24, height: 24, imageRendering: 'pixelated' }} />
                                <span style={{ color: '#93c5fd', fontSize: 10, fontWeight: 700, textTransform: 'uppercase' }}>{p.name}</span>
                            </div>
                            <ScaledStatBars pokemon={p} />
                        </div>
                    ))}
                </div>
                <div style={{ width: 1, background: 'rgba(255,255,255,0.06)', flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                    {team2.map((p, i) => (
                        <div key={i} style={{ marginBottom: i < team2.length - 1 ? 6 : 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 2 }}>
                                <img src={p.sprites.front_default} alt={p.name}
                                    style={{ width: 24, height: 24, imageRendering: 'pixelated' }} />
                                <span style={{ color: '#fca5a5', fontSize: 10, fontWeight: 700, textTransform: 'uppercase' }}>{p.name}</span>
                            </div>
                            <ScaledStatBars pokemon={p} />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default BattleArena;
