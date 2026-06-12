import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { StoryOpponent } from '../data/storyData';
import SFX from '../utils/soundUtils';

interface Props {
    opponent: StoryOpponent;
    onDone: () => void;
}

const TYPE_SPEED_MS = 22;
export const PLAYER_SPRITE = './sprites/trainers/ethan.png';

// Pre-battle dialogue: typewriter text, click to reveal/advance, skippable.
const DialogueBox: React.FC<Props> = ({ opponent, onDone }) => {
    const [lineIdx, setLineIdx] = useState(0);
    const [shown, setShown] = useState(0); // characters revealed
    const [spriteOk, setSpriteOk] = useState(true);
    const [playerSpriteOk, setPlayerSpriteOk] = useState(true);
    const timer = useRef<ReturnType<typeof setInterval> | null>(null);

    const lines = opponent.dialogue;
    const line = lines[lineIdx];
    const fullyShown = shown >= line.text.length;
    const isLast = lineIdx === lines.length - 1;

    // Typewriter effect
    useEffect(() => {
        setShown(0);
        if (timer.current) clearInterval(timer.current);
        timer.current = setInterval(() => {
            setShown(s => {
                if (s + 1 >= lines[lineIdx].text.length && timer.current) clearInterval(timer.current);
                return s + 1;
            });
        }, TYPE_SPEED_MS);
        return () => { if (timer.current) clearInterval(timer.current); };
    }, [lineIdx, lines]);

    const advance = useCallback(() => {
        if (!fullyShown) {
            // First click: reveal the whole line instantly
            if (timer.current) clearInterval(timer.current);
            setShown(line.text.length);
            return;
        }
        SFX.select();
        if (isLast) onDone();
        else setLineIdx(i => i + 1);
    }, [fullyShown, isLast, line.text.length, onDone]);

    // Space / Enter also advance
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); advance(); }
            if (e.key === 'Escape') onDone();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [advance, onDone]);

    const isOpp = line.who === 'opp';
    const speakerName = isOpp ? opponent.name : 'ВЫ';

    return (
        <div className="dlg-screen" onClick={advance}>
            <button
                className="dlg-skip"
                onClick={e => { e.stopPropagation(); onDone(); }}
            >
                Пропустить ⏭
            </button>

            {/* Trainer portrait */}
            <div className={`dlg-stage ${isOpp ? 'opp-active' : 'you-active'}`}>
                <div className="dlg-portrait dlg-portrait-opp">
                    {spriteOk ? (
                        <img
                            src={opponent.sprite}
                            alt={opponent.name}
                            className="dlg-trainer-img"
                            onError={() => setSpriteOk(false)}
                        />
                    ) : (
                        <span className="dlg-trainer-emoji">{opponent.emoji}</span>
                    )}
                </div>
                <div className="dlg-portrait dlg-portrait-you">
                    {playerSpriteOk ? (
                        <img
                            src={PLAYER_SPRITE}
                            alt="Вы"
                            className="dlg-trainer-img"
                            onError={() => setPlayerSpriteOk(false)}
                        />
                    ) : (
                        <span className="dlg-trainer-emoji">🧑‍🦱</span>
                    )}
                </div>
            </div>

            {/* Dialogue window */}
            <div className={`dlg-box ${isOpp ? 'from-opp' : 'from-you'}`}>
                <div className="dlg-speaker">{isOpp ? `${opponent.emoji} ${speakerName}` : `🧢 ${speakerName}`}</div>
                <div className="dlg-text">
                    {line.text.slice(0, shown)}
                    {!fullyShown && <span className="dlg-cursor">▌</span>}
                </div>
                <div className="dlg-hint">
                    {fullyShown ? (isLast ? '⚔️ Нажми — К БОЮ!' : '▼ Нажми, чтобы продолжить') : ''}
                </div>
                <div className="dlg-progress">{lineIdx + 1}/{lines.length}</div>
            </div>
        </div>
    );
};

export default DialogueBox;
