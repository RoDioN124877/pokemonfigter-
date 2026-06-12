import React, { useMemo, useState } from 'react';
import { useAchievementStore } from '../store/achievementStore';
import { ACHIEVEMENTS, RARITY_LABELS, type AchievementDef } from '../data/achievements';

interface Props {
    goToMenu: () => void;
}

type Filter = 'all' | 'unlocked' | 'locked';

const AchievementCard: React.FC<{ def: AchievementDef; unlockedAt?: number; value: number }> = ({ def, unlockedAt, value }) => {
    const isUnlocked = unlockedAt !== undefined;
    const rarity = RARITY_LABELS[def.rarity];
    const pct = Math.min(100, (value / def.target) * 100);

    return (
        <div className={`ach-card rarity-${def.rarity} ${isUnlocked ? 'unlocked' : 'locked'}`}>
            <div className="ach-card-icon">{isUnlocked ? def.icon : '🔒'}</div>
            <div className="ach-card-body">
                <div className="ach-card-name">{def.name}</div>
                <div className="ach-card-desc">{def.desc}</div>
                {!isUnlocked && (
                    <div className="ach-card-progress">
                        <div className="ach-card-progress-bar">
                            <div className="ach-card-progress-fill" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="ach-card-progress-text">{Math.min(value, def.target)}/{def.target}</span>
                    </div>
                )}
                {isUnlocked && (
                    <div className="ach-card-date">
                        Получено {new Date(unlockedAt).toLocaleDateString('ru-RU')}
                    </div>
                )}
            </div>
            <div className="ach-card-rarity" style={{ color: rarity.color }}>{rarity.label}</div>
        </div>
    );
};

const AchievementsScreen: React.FC<Props> = ({ goToMenu }) => {
    const { counters, unlocked } = useAchievementStore();
    const [filter, setFilter] = useState<Filter>('all');

    const unlockedCount = Object.keys(unlocked).length;

    const visible = useMemo(() => {
        const list = ACHIEVEMENTS.filter(a => {
            if (filter === 'unlocked') return unlocked[a.id] !== undefined;
            if (filter === 'locked') return unlocked[a.id] === undefined;
            return true;
        });
        // Unlocked first (newest first), then locked by progress descending
        return [...list].sort((a, b) => {
            const ua = unlocked[a.id]; const ub = unlocked[b.id];
            if (ua && ub) return ub - ua;
            if (ua) return -1;
            if (ub) return 1;
            return (b.value(counters) / b.target) - (a.value(counters) / a.target);
        });
    }, [filter, unlocked, counters]);

    return (
        <div className="ach-screen">
            <div className="ach-screen-header">
                <button className="exe" onClick={goToMenu}>✕</button>
                <h1 className="ach-screen-title">🏆 Достижения</h1>
                <div className="ach-screen-counter">
                    {unlockedCount} / {ACHIEVEMENTS.length}
                    <div className="ach-total-bar">
                        <div className="ach-total-fill" style={{ width: `${(unlockedCount / ACHIEVEMENTS.length) * 100}%` }} />
                    </div>
                </div>
            </div>

            <div className="ach-filter-row">
                {(['all', 'unlocked', 'locked'] as Filter[]).map(f => (
                    <button
                        key={f}
                        className={`gen-btn ${filter === f ? 'active' : ''}`}
                        onClick={() => setFilter(f)}
                    >
                        {f === 'all' ? 'Все' : f === 'unlocked' ? '✅ Открытые' : '🔒 Закрытые'}
                    </button>
                ))}
            </div>

            <div className="ach-grid">
                {visible.map(def => (
                    <AchievementCard
                        key={def.id}
                        def={def}
                        unlockedAt={unlocked[def.id]}
                        value={def.value(counters)}
                    />
                ))}
                {visible.length === 0 && (
                    <div className="empty-results">
                        <div style={{ fontSize: '2rem' }}>🏜️</div>
                        <div>{filter === 'unlocked' ? 'Пока ничего не открыто — вперёд в бой!' : 'Всё открыто. Невероятно!'}</div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AchievementsScreen;
