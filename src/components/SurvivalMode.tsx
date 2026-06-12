import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { Pokemon } from '../types/Pokemon';
import { usePokemonStore } from '../store/pokemonStore';
import { useAchievementStore } from '../store/achievementStore';
import { createBattleFighter } from '../utils/battleUtils';
import BattleArena from './BattleArena';
import SFX from '../utils/soundUtils';

interface Props {
    goToMenu: () => void;
}

type Phase = 'loading' | 'pick' | 'battle' | 'between' | 'gameover';

const TEAM_SIZE = 3;
const PICK_POOL = 12;
const HEAL_SURVIVOR = 0.65;  // survivors heal 65% of max HP between waves
const REVIVE_FAINTED = 0.55; // fainted return with 55% HP

// Scale enemies down on early waves, up on later. Wave 1 = 60% power, wave 10 = 100%, wave 20+ = 130%.
function enemyScaleForWave(wave: number): number {
    if (wave <= 1) return 0.55;
    if (wave <= 3) return 0.65 + (wave - 1) * 0.05;
    if (wave <= 7) return 0.80 + (wave - 3) * 0.04;
    if (wave <= 15) return 1.0 + (wave - 7) * 0.025;
    return Math.min(1.6, 1.2 + (wave - 15) * 0.025);
}

function scaleEnemy(pok: Pokemon, factor: number): Pokemon {
    const scaledStats = { ...pok.statsMap };
    (Object.keys(scaledStats) as (keyof typeof scaledStats)[]).forEach(k => {
        scaledStats[k] = Math.max(1, Math.round(scaledStats[k] * factor));
    });
    return {
        ...pok,
        statsMap: scaledStats,
        stats: pok.stats.map(s => ({
            ...s,
            base_stat: Math.max(1, Math.round(s.base_stat * factor)),
        })),
    };
}

function loadBestWave(): number {
    return parseInt(localStorage.getItem('pok-survival-best') ?? '0', 10) || 0;
}

const SurvivalMode: React.FC<Props> = ({ goToMenu }) => {
    const getRandomPokemons = usePokemonStore(s => s.getRandomPokemons);
    const recordSurvivalWave = useAchievementStore(s => s.recordSurvivalWave);

    const [phase, setPhase] = useState<Phase>('loading');
    const [pool, setPool] = useState<Pokemon[]>([]);
    const [team, setTeam] = useState<Pokemon[]>([]);
    const [teamHP, setTeamHP] = useState<number[] | undefined>(undefined);
    const [enemies, setEnemies] = useState<Pokemon[]>([]);
    const [wave, setWave] = useState(0);
    const [best, setBest] = useState(loadBestWave);

    const mounted = useRef(false);
    useEffect(() => {
        if (mounted.current) return;
        mounted.current = true;
        (async () => {
            const p = await getRandomPokemons(PICK_POOL);
            setPool(p);
            setPhase('pick');
        })();
    }, [getRandomPokemons]);

    const togglePick = (pokemon: Pokemon) => {
        SFX.select();
        setTeam(prev => {
            if (prev.some(p => p.id === pokemon.id)) return prev.filter(p => p.id !== pokemon.id);
            if (prev.length >= TEAM_SIZE) return prev;
            return [...prev, pokemon];
        });
    };

    const startWave = useCallback(async (nextWave: number, hp: number[] | undefined) => {
        setPhase('loading');
        const foes = await getRandomPokemons(TEAM_SIZE);
        const scale = enemyScaleForWave(nextWave);
        const scaled = foes.map(p => scaleEnemy(p, scale));
        setEnemies(scaled);
        setTeamHP(hp);
        setWave(nextWave);
        setPhase('battle');
    }, [getRandomPokemons]);

    const handleBattleEnd = useCallback((winner: 1 | 2, finalHP?: number[]) => {
        if (winner === 1) {
            recordSurvivalWave(wave);
            if (wave > best) {
                setBest(wave);
                localStorage.setItem('pok-survival-best', String(wave));
            }
            // Heal survivors, partially revive the fainted
            const healed = team.map((p, i) => {
                const max = createBattleFighter(p).initialHP;
                const cur = finalHP?.[i] ?? max;
                return cur > 0
                    ? Math.min(max, Math.round(cur + max * HEAL_SURVIVOR))
                    : Math.round(max * REVIVE_FAINTED);
            });
            setTeamHP(healed);
            setPhase('between');
        } else {
            recordSurvivalWave(wave - 1);
            setPhase('gameover');
        }
    }, [wave, best, team, recordSurvivalWave]);

    const restart = () => {
        setTeam([]);
        setTeamHP(undefined);
        setWave(0);
        setPhase('loading');
        (async () => {
            const p = await getRandomPokemons(PICK_POOL);
            setPool(p);
            setPhase('pick');
        })();
    };

    // ── Loading ──
    if (phase === 'loading') {
        return (
            <div className="srv-screen">
                <div className="pred-loading"><div className="pdm-art-spinner" /></div>
            </div>
        );
    }

    // ── Team pick ──
    if (phase === 'pick') {
        return (
            <div className="srv-screen">
                <button className="exe" onClick={goToMenu}>✕</button>
                <h1 className="srv-title">🌊 ВЫЖИВАНИЕ</h1>
                <p className="srv-sub">Собери отряд из {TEAM_SIZE} бойцов. Враги слабее на первых волнах и крепнут к 10-й. HP переносится между волнами — выжившие лечатся на 65%, павшие встают с 55%!</p>
                <div className="srv-pick-counter">Выбрано: {team.length}/{TEAM_SIZE} · Рекорд: {best} волн</div>
                <div className="srv-pool">
                    {pool.map(p => {
                        const picked = team.some(t => t.id === p.id);
                        return (
                            <button
                                key={p.id}
                                className={`srv-pool-card ${picked ? 'picked' : ''}`}
                                onClick={() => togglePick(p)}
                            >
                                <img src={p.sprites.front_default} alt={p.name} className="srv-pool-sprite" />
                                <span className="srv-pool-name">{p.name}</span>
                                <span className="srv-pool-types">
                                    {p.types.map(t => (
                                        <span key={t.slot} className={`type-badge type-${t.type.name}`}>{t.type.name}</span>
                                    ))}
                                </span>
                            </button>
                        );
                    })}
                </div>
                <button
                    className="menu-button"
                    disabled={team.length !== TEAM_SIZE}
                    onClick={() => startWave(1, undefined)}
                >
                    НАЧАТЬ — ВОЛНА 1
                </button>
            </div>
        );
    }

    // ── Battle ──
    if (phase === 'battle') {
        return (
            <div className="tournament-live-wrap">
                <div className="trn-live-header">
                    <span className="trn-live-label">🌊 ВЫЖИВАНИЕ — ВОЛНА {wave}</span>
                    <button className="trn-back-btn" onClick={goToMenu}>✕ Сдаться</button>
                </div>
                <BattleArena
                    key={wave}
                    team1={team}
                    team2={enemies}
                    maxSize={3}
                    goToMenu={goToMenu}
                    onBattleEnd={handleBattleEnd}
                    team1HP={teamHP}
                    historyMode="survival"
                />
            </div>
        );
    }

    // ── Between waves ──
    if (phase === 'between') {
        return (
            <div className="srv-screen">
                <div className="srv-between">
                    <h1 className="srv-wave-cleared">✅ ВОЛНА {wave} ПРОЙДЕНА!</h1>
                    <div className="srv-team-status">
                        {team.map((p, i) => {
                            const max = createBattleFighter(p).initialHP;
                            const cur = teamHP?.[i] ?? max;
                            const pct = Math.round((cur / max) * 100);
                            return (
                                <div key={p.id} className="srv-status-card">
                                    <img src={p.sprites.front_default} alt={p.name} className="srv-status-sprite" />
                                    <div className="srv-status-name">{p.name}</div>
                                    <div className="prebattle-hp-bar-wrap" style={{ width: 70 }}>
                                        <div
                                            className="prebattle-hp-bar-fill"
                                            style={{ width: `${pct}%`, background: pct < 30 ? '#e74c3c' : pct < 60 ? '#f39c12' : '#2ecc71' }}
                                        />
                                    </div>
                                    <div className="srv-status-hp">{cur}/{max}</div>
                                </div>
                            );
                        })}
                    </div>
                    <div className="srv-heal-note">💚 Выжившие подлечились, павшие встали с трудом</div>
                    <button className="menu-button" onClick={() => startWave(wave + 1, teamHP)}>
                        ВОЛНА {wave + 1} →
                    </button>
                </div>
            </div>
        );
    }

    // ── Game over ──
    return (
        <div className="srv-screen">
            <div className="quiz-gameover">
                <h1 className="quiz-go-title">КОМАНДА ПАЛА</h1>
                <div className="quiz-go-score">{wave - 1}</div>
                <div className="quiz-go-sub">волн пройдено</div>
                <div className="quiz-go-best">🏅 Рекорд: {Math.max(best, wave - 1)} волн</div>
                <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                    <button className="menu-button" onClick={restart}>ЕЩЁ РАЗ</button>
                    <button className="menu-button" onClick={goToMenu}>В МЕНЮ</button>
                </div>
            </div>
        </div>
    );
};

export default SurvivalMode;
