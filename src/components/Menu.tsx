import React from 'react';
import { useAchievementStore } from '../store/achievementStore';
import { ACHIEVEMENTS } from '../data/achievements';
import { useLangStore, useT, LANG_OPTIONS } from '../store/langStore';
import type { Lang } from '../store/langStore';
import SFX from '../utils/soundUtils';

interface MenuProps {
    setMode: (size: 1 | 3) => void;
    startTournament: () => void;
    startStory: () => void;
    startQuiz: () => void;
    startPredict: () => void;
    startSurvival: () => void;
    openAchievements: () => void;
    openHistory: () => void;
}

interface ModeCard {
    icon: string;
    title: string;
    desc: string;
    accent: string;
    onClick: () => void;
}

const Menu: React.FC<MenuProps> = ({
    setMode, startTournament, startStory, startQuiz, startPredict, startSurvival, openAchievements, openHistory,
}) => {
    const counters = useAchievementStore(s => s.counters);
    const unlocked = useAchievementStore(s => s.unlocked);
    const unlockedCount = Object.keys(unlocked).length;
    const t = useT();
    const lang = useLangStore(s => s.lang);
    const setLang = useLangStore(s => s.setLang);

    const cards: ModeCard[] = [
        { icon: '⚔️', title: t('menu.modes.1v1.title'),        desc: t('menu.modes.1v1.desc'),        accent: '#ef4444', onClick: () => setMode(1) },
        { icon: '👥', title: t('menu.modes.3v3.title'),        desc: t('menu.modes.3v3.desc'),        accent: '#f97316', onClick: () => setMode(3) },
        { icon: '🏆', title: t('menu.modes.tournament.title'), desc: t('menu.modes.tournament.desc'), accent: '#facc15', onClick: startTournament },
        { icon: '📖', title: t('menu.modes.story.title'),      desc: t('menu.modes.story.desc'),      accent: '#4f46e5', onClick: startStory },
        { icon: '🌊', title: t('menu.modes.survival.title'),   desc: t('menu.modes.survival.desc'),   accent: '#06b6d4', onClick: startSurvival },
        { icon: '❓', title: t('menu.modes.quiz.title'),       desc: t('menu.modes.quiz.desc'),       accent: '#10b981', onClick: startQuiz },
        { icon: '🔮', title: t('menu.modes.predict.title'),    desc: t('menu.modes.predict.desc'),    accent: '#a78bfa', onClick: startPredict },
    ];

    return (
        <section className="main-menu menu-v2">
            <h1 className="menu-logo">POKEMON<span className="menu-logo-accent">FIGHTER</span></h1>

            {/* Language switcher */}
            <div className="menu-lang-switcher" style={{ display: 'flex', gap: 6, justifyContent: 'center', marginBottom: 12 }}>
                {LANG_OPTIONS.map(o => (
                    <button
                        key={o.id}
                        onClick={() => { SFX.select(); setLang(o.id as Lang); }}
                        style={{
                            background: lang === o.id ? '#fbbf24' : '#1e293b',
                            color: lang === o.id ? '#000' : '#94a3b8',
                            border: `2px solid ${lang === o.id ? '#fbbf24' : '#334155'}`,
                            borderRadius: 8,
                            padding: '6px 12px',
                            fontSize: 13,
                            cursor: 'pointer',
                            fontWeight: 700,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 5,
                            transition: 'all 0.15s',
                        }}
                        title={o.label}
                    >
                        <span style={{ fontSize: 16 }}>{o.flag}</span>
                        <span>{o.label}</span>
                    </button>
                ))}
            </div>

            {/* Player profile strip */}
            <div className="menu-profile">
                <div className="menu-profile-stat">
                    <span className="mps-value">{counters.battlesWon}</span>
                    <span className="mps-label">{t('menu.stat.wins')}</span>
                </div>
                <div className="menu-profile-stat">
                    <span className="mps-value">{counters.quizBestStreak}</span>
                    <span className="mps-label">{t('menu.stat.quizStreak')}</span>
                </div>
                <div className="menu-profile-stat">
                    <span className="mps-value">{counters.tournamentsWon}</span>
                    <span className="mps-label">{t('menu.stat.tournaments')}</span>
                </div>
                <div className="menu-profile-stat">
                    <span className="mps-value">{counters.survivalBestWave}</span>
                    <span className="mps-label">{t('menu.stat.waves')}</span>
                </div>
                <button className="menu-profile-stat mps-btn" onClick={() => { SFX.select(); openAchievements(); }}>
                    <span className="mps-value">🏆 {unlockedCount}/{ACHIEVEMENTS.length}</span>
                    <span className="mps-label">{t('menu.stat.achievements')}</span>
                </button>
                <button className="menu-profile-stat mps-btn" onClick={() => { SFX.select(); openHistory(); }}>
                    <span className="mps-value">📜</span>
                    <span className="mps-label">{t('menu.stat.history')}</span>
                </button>
            </div>

            {/* Mode cards */}
            <div className="menu-grid">
                {cards.map((c, i) => (
                    <button
                        key={c.title}
                        className="menu-card"
                        style={{ ['--accent' as string]: c.accent, animationDelay: `${i * 0.06}s` }}
                        onClick={() => { SFX.select(); c.onClick(); }}
                    >
                        <span className="menu-card-icon">{c.icon}</span>
                        <span className="menu-card-title">{c.title}</span>
                        <span className="menu-card-desc">{c.desc}</span>
                    </button>
                ))}
            </div>
        </section>
    );
};

export default Menu;
