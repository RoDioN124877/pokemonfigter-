import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { Pokemon } from '../types/Pokemon';
import { usePokemonStore } from '../store/pokemonStore';
import { useAchievementStore } from '../store/achievementStore';
import SFX from '../utils/soundUtils';
import { gameplayStart, gameplayStop, scheduleCloudSave } from '../utils/ysdk';

interface Props {
    goToMenu: () => void;
}

const ROUND_TIME = 10; // seconds
const MAX_LIVES = 3;

interface Round {
    answer: Pokemon;
    options: Pokemon[];
}

type Phase = 'loading' | 'guessing' | 'revealed' | 'gameover';

function loadBest(): { score: number; streak: number } {
    try { return JSON.parse(localStorage.getItem('pok-quiz-best') ?? '{"score":0,"streak":0}'); }
    catch { return { score: 0, streak: 0 }; }
}

const QuizMode: React.FC<Props> = ({ goToMenu }) => {
    const getRandomPokemons = usePokemonStore(s => s.getRandomPokemons);
    const recordQuizAnswer = useAchievementStore(s => s.recordQuizAnswer);
    const recordQuizGame = useAchievementStore(s => s.recordQuizGame);

    const [round, setRound] = useState<Round | null>(null);
    const [phase, setPhase] = useState<Phase>('loading');
    const [picked, setPicked] = useState<number | null>(null);
    const [score, setScore] = useState(0);
    const [streak, setStreak] = useState(0);
    const [lives, setLives] = useState(MAX_LIVES);
    const [timeLeft, setTimeLeft] = useState(ROUND_TIME);
    const [best, setBest] = useState(loadBest);
    const [roundNum, setRoundNum] = useState(0);
    const gameRecorded = useRef(false);

    const nextRound = useCallback(async () => {
        setPhase('loading');
        setPicked(null);
        const four = await getRandomPokemons(4);
        if (four.length < 4) { setPhase('loading'); return; }
        const answer = four[Math.floor(Math.random() * 4)];
        setRound({ answer, options: four });
        setTimeLeft(ROUND_TIME);
        setRoundNum(n => n + 1);
        setPhase('guessing');
    }, [getRandomPokemons]);

    const mounted = useRef(false);
    useEffect(() => {
        if (mounted.current) return; // StrictMode double-invoke guard
        mounted.current = true;
        nextRound();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // Yandex gameplay marks: quiz is active gameplay until game over / exit
    useEffect(() => {
        if (phase === 'gameover') { gameplayStop(); scheduleCloudSave(); }
        else gameplayStart();
        return () => gameplayStop();
    }, [phase === 'gameover']); // eslint-disable-line react-hooks/exhaustive-deps

    // Countdown timer
    useEffect(() => {
        if (phase !== 'guessing') return;
        if (timeLeft <= 0) { handleAnswer(null); return; }
        const t = setTimeout(() => setTimeLeft(v => v - 1), 1000);
        return () => clearTimeout(t);
    }, [phase, timeLeft]); // eslint-disable-line react-hooks/exhaustive-deps

    const saveBest = (s: number, st: number) => {
        const nb = { score: Math.max(best.score, s), streak: Math.max(best.streak, st) };
        setBest(nb);
        localStorage.setItem('pok-quiz-best', JSON.stringify(nb));
    };

    const handleAnswer = (id: number | null) => {
        if (phase !== 'guessing' || !round) return;
        const correct = id === round.answer.id;
        setPicked(id);
        setPhase('revealed');

        if (correct) {
            const gained = 100 + timeLeft * 10 + streak * 25;
            const newStreak = streak + 1;
            const newScore = score + gained;
            setScore(newScore);
            setStreak(newStreak);
            recordQuizAnswer(true, newStreak);
            saveBest(newScore, newStreak);
            SFX.heal();
        } else {
            const newLives = lives - 1;
            setLives(newLives);
            setStreak(0);
            recordQuizAnswer(false, 0);
            SFX.ko();
            if (newLives <= 0) {
                if (!gameRecorded.current) { gameRecorded.current = true; recordQuizGame(); }
                setTimeout(() => setPhase('gameover'), 1600);
                return;
            }
        }
        setTimeout(() => nextRound(), 1600);
    };

    const restart = () => {
        setScore(0); setStreak(0); setLives(MAX_LIVES); setRoundNum(0);
        gameRecorded.current = false;
        nextRound();
    };

    // ── Game over ──
    if (phase === 'gameover') {
        return (
            <div className="quiz-screen">
                <div className="quiz-gameover">
                    <h1 className="quiz-go-title">ИГРА ОКОНЧЕНА</h1>
                    <div className="quiz-go-score">{score}</div>
                    <div className="quiz-go-sub">очков за {roundNum} раундов</div>
                    <div className="quiz-go-best">
                        🏅 Рекорд: {best.score} очков · стрик {best.streak}
                    </div>
                    <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                        <button className="menu-button" onClick={restart}>ЕЩЁ РАЗ</button>
                        <button className="menu-button" onClick={goToMenu}>В МЕНЮ</button>
                    </div>
                </div>
            </div>
        );
    }

    const revealed = phase === 'revealed';
    const timePct = (timeLeft / ROUND_TIME) * 100;

    return (
        <div className="quiz-screen">
            <button className="exe" onClick={goToMenu}>✕</button>

            <div className="quiz-header">
                <h1 className="quiz-title">КТО ЭТОТ ПОКЕМОН?</h1>
                <div className="quiz-stats-row">
                    <span className="quiz-stat">💯 {score}</span>
                    <span className="quiz-stat quiz-streak">{streak > 1 ? `🔥 ×${streak}` : ''}</span>
                    <span className="quiz-stat">
                        {Array.from({ length: MAX_LIVES }, (_, i) => (i < lives ? '❤️' : '🖤')).join('')}
                    </span>
                </div>
            </div>

            {/* Timer bar */}
            {phase === 'guessing' && (
                <div className="quiz-timer-bar">
                    <div
                        className={`quiz-timer-fill ${timeLeft <= 3 ? 'urgent' : ''}`}
                        style={{ width: `${timePct}%` }}
                    />
                </div>
            )}

            {/* Silhouette */}
            <div className="quiz-sprite-zone">
                {phase === 'loading' && <div className="pdm-art-spinner" />}
                {round && phase !== 'loading' && (
                    <img
                        src={round.answer.sprites.front_default}
                        alt="?"
                        className={`quiz-sprite ${revealed ? 'revealed' : 'hidden-silhouette'}`}
                    />
                )}
                {revealed && round && (
                    <div className={`quiz-reveal-name ${picked === round.answer.id ? 'correct' : 'wrong'}`}>
                        {picked === round.answer.id ? '✅' : '❌'} Это {round.answer.name}!
                    </div>
                )}
            </div>

            {/* Options */}
            <div className="quiz-options">
                {round && phase !== 'loading' && round.options.map(p => {
                    let cls = 'quiz-option';
                    if (revealed) {
                        if (p.id === round.answer.id) cls += ' right-answer';
                        else if (p.id === picked) cls += ' wrong-answer';
                        else cls += ' faded';
                    }
                    return (
                        <button
                            key={p.id}
                            className={cls}
                            disabled={revealed}
                            onClick={() => { SFX.select(); handleAnswer(p.id); }}
                        >
                            {p.name}
                        </button>
                    );
                })}
            </div>

            <div className="quiz-footer">Раунд {roundNum} · Рекорд: {best.score}</div>
        </div>
    );
};

export default QuizMode;
