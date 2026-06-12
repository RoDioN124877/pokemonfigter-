import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { Pokemon } from '../types/Pokemon';
import { usePokemonStore } from '../store/pokemonStore';
import { useAchievementStore } from '../store/achievementStore';
import { simulateBattle } from '../utils/battleUtils';
import SFX from '../utils/soundUtils';
import { gameplayStart, gameplayStop, scheduleCloudSave } from '../utils/ysdk';

interface Props {
    goToMenu: () => void;
}

type Phase = 'loading' | 'betting' | 'fighting' | 'result';

const TYPE_ICONS: Record<string, string> = {
    normal:'⭕', fire:'🔥', water:'💧', electric:'⚡', grass:'🌿', ice:'❄️',
    fighting:'👊', poison:'☠️', ground:'🌍', flying:'🌪️', psychic:'🔮',
    bug:'🐛', rock:'🪨', ghost:'👻', dragon:'🐲', dark:'🌑', steel:'⚙️', fairy:'✨',
};

function loadBest(): number {
    return parseInt(localStorage.getItem('pok-predict-best') ?? '0', 10) || 0;
}

const FighterPanel: React.FC<{
    pokemon: Pokemon;
    side: 1 | 2;
    picked: boolean;
    disabled: boolean;
    isWinner: boolean | null;
    onPick: () => void;
}> = ({ pokemon, side, picked, disabled, isWinner, onPick }) => {
    const bst = ['hp','attack','defense','special-attack','special-defense','speed']
        .reduce((s, k) => s + (pokemon.statsMap[k] ?? 0), 0);
    return (
        <div className={`pred-fighter ${picked ? 'picked' : ''} ${isWinner === true ? 'won' : isWinner === false ? 'lost' : ''}`}>
            <img src={pokemon.sprites.front_default} alt={pokemon.name} className="pred-sprite" />
            <div className="pred-name">{pokemon.name}</div>
            <div className="pred-types">
                {pokemon.types.map(t => (
                    <span key={t.slot} className={`type-badge type-${t.type.name}`}>
                        {TYPE_ICONS[t.type.name]} {t.type.name}
                    </span>
                ))}
            </div>
            <div className="pred-stats">
                <span>ATK {Math.max(pokemon.statsMap.attack, pokemon.statsMap['special-attack'])}</span>
                <span>DEF {Math.max(pokemon.statsMap.defense, pokemon.statsMap['special-defense'])}</span>
                <span>SPD {pokemon.statsMap.speed}</span>
                <span>HP {pokemon.statsMap.hp}</span>
            </div>
            <div className="pred-bst">BST {bst}</div>
            <button className="pred-pick-btn" disabled={disabled} onClick={onPick}>
                {picked ? '✅ ВЫБРАН' : `СТАВЛЮ НА ${side === 1 ? 'ЛЕВОГО' : 'ПРАВОГО'}`}
            </button>
        </div>
    );
};

const PredictMode: React.FC<Props> = ({ goToMenu }) => {
    const getRandomPokemons = usePokemonStore(s => s.getRandomPokemons);
    const recordPredict = useAchievementStore(s => s.recordPredict);

    const [pair, setPair] = useState<[Pokemon, Pokemon] | null>(null);
    const [phase, setPhase] = useState<Phase>('loading');
    const [pick, setPick] = useState<1 | 2 | null>(null);
    const [visibleLog, setVisibleLog] = useState<string[]>([]);
    const [simWinner, setSimWinner] = useState<1 | 2 | null>(null);
    const [streak, setStreak] = useState(0);
    const [score, setScore] = useState(0);
    const [best, setBest] = useState(loadBest);
    const fullLog = useRef<string[]>([]);
    const turns = useRef(0);

    const newMatch = useCallback(async () => {
        setPhase('loading');
        setPick(null);
        setVisibleLog([]);
        setSimWinner(null);
        const two = await getRandomPokemons(2);
        if (two.length < 2) return;
        setPair([two[0], two[1]]);
        setPhase('betting');
    }, [getRandomPokemons]);

    const mounted = useRef(false);
    useEffect(() => {
        if (mounted.current) return; // StrictMode double-invoke guard
        mounted.current = true;
        newMatch();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // Yandex gameplay marks for the whole prediction session
    useEffect(() => {
        gameplayStart();
        return () => gameplayStop();
    }, []);

    // Persist records to cloud after each resolved prediction
    useEffect(() => {
        if (phase === 'result') scheduleCloudSave();
    }, [phase]);

    const makePick = (side: 1 | 2) => {
        if (phase !== 'betting' || !pair) return;
        SFX.select();
        setPick(side);
        const { winner, log, turns: t } = simulateBattle(pair[0], pair[1]);
        fullLog.current = log.slice(0, 14);
        turns.current = t;
        setSimWinner(winner);
        setPhase('fighting');
    };

    // Animate the simulated log line by line, then show the result
    useEffect(() => {
        if (phase !== 'fighting') return;
        if (visibleLog.length >= fullLog.current.length) {
            const correct = pick === simWinner;
            const t = setTimeout(() => {
                const newStreak = correct ? streak + 1 : 0;
                const newScore = correct ? score + 50 + streak * 30 : score;
                setStreak(newStreak);
                setScore(newScore);
                recordPredict(correct, newStreak);
                if (newStreak > best) {
                    setBest(newStreak);
                    localStorage.setItem('pok-predict-best', String(newStreak));
                }
                if (correct) SFX.champ(); else SFX.ko();
                setPhase('result');
            }, 500);
            return () => clearTimeout(t);
        }
        const t = setTimeout(() => {
            setVisibleLog(v => [...v, fullLog.current[v.length]]);
            SFX.hit();
        }, 240);
        return () => clearTimeout(t);
    }, [phase, visibleLog]); // eslint-disable-line react-hooks/exhaustive-deps

    const correct = pick === simWinner;

    return (
        <div className="pred-screen">
            <button className="exe" onClick={goToMenu}>✕</button>

            <div className="pred-header">
                <h1 className="pred-title">🔮 ПРОГНОЗ БОЯ</h1>
                <div className="pred-score-row">
                    <span className="quiz-stat">💯 {score}</span>
                    <span className="quiz-stat">{streak > 0 ? `🔥 стрик ${streak}` : ''}</span>
                    <span className="quiz-stat">🏅 рекорд {best}</span>
                </div>
                {phase === 'betting' && <div className="pred-hint">Кто победит? Изучи статы и типы — потом смотри симуляцию!</div>}
            </div>

            {phase === 'loading' && <div className="pred-loading"><div className="pdm-art-spinner" /></div>}

            {pair && phase !== 'loading' && (
                <div className="pred-arena">
                    <FighterPanel
                        pokemon={pair[0]} side={1}
                        picked={pick === 1}
                        disabled={phase !== 'betting'}
                        isWinner={phase === 'result' ? simWinner === 1 : null}
                        onPick={() => makePick(1)}
                    />
                    <div className="pred-vs">VS</div>
                    <FighterPanel
                        pokemon={pair[1]} side={2}
                        picked={pick === 2}
                        disabled={phase !== 'betting'}
                        isWinner={phase === 'result' ? simWinner === 2 : null}
                        onPick={() => makePick(2)}
                    />
                </div>
            )}

            {/* Simulated battle log */}
            {(phase === 'fighting' || phase === 'result') && (
                <div className="pred-log">
                    {visibleLog.map((line, i) => (
                        <div key={i} className="pred-log-line">{line}</div>
                    ))}
                </div>
            )}

            {/* Result */}
            {phase === 'result' && pair && simWinner && (
                <div className={`pred-result ${correct ? 'correct' : 'wrong'}`}>
                    <div className="pred-result-title">
                        {correct ? `✅ ТОЧНО! +${50 + (streak - 1) * 30} очков` : '❌ МИМО!'}
                    </div>
                    <div className="pred-result-sub">
                        Победил {pair[simWinner - 1].name} за {turns.current} ходов
                    </div>
                    <button className="menu-button" onClick={newMatch}>СЛЕДУЮЩИЙ БОЙ →</button>
                </div>
            )}
        </div>
    );
};

export default PredictMode;
