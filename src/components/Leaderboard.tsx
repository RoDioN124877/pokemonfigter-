import React, { useEffect, useState } from 'react';
import { fetchBossRushLeaderboard } from '../utils/ysdk';
import type { PublicLBEntry } from '../utils/ysdk';

interface Props {
    onBack: () => void;
}

const Leaderboard: React.FC<Props> = ({ onBack }) => {
    const [entries, setEntries] = useState<PublicLBEntry[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchBossRushLeaderboard()
            .then(data => setEntries(data))
            .finally(() => setLoading(false));
    }, []);

    return (
        <div className="story-screen" style={{ padding: 24, maxWidth: 540, margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                <button className="story-btn story-btn--secondary" onClick={onBack} style={{ padding: '6px 14px' }}>← Карта</button>
                <h2 style={{ color: '#f59e0b', margin: 0, fontFamily: 'var(--font-pixel)', fontSize: '0.8rem', lineHeight: 1.6 }}>
                    🏆 Boss Rush
                </h2>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: 48, color: '#64748b' }}>Загрузка лидеров...</div>
            ) : entries.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 48 }}>
                    <div style={{ fontSize: 48, marginBottom: 12 }}>🏜️</div>
                    <div style={{ color: '#64748b', fontSize: 14 }}>
                        Пока никто не прошёл Boss Rush.<br />
                        Станьте первым!
                    </div>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {entries.map((e, i) => {
                        const isTop3 = e.rank <= 3;
                        const medal = e.rank === 1 ? '🥇' : e.rank === 2 ? '🥈' : e.rank === 3 ? '🥉' : null;
                        return (
                            <div
                                key={i}
                                style={{
                                    background: isTop3 ? 'rgba(245,158,11,0.08)' : '#0f172a',
                                    border: `1px solid ${isTop3 ? '#f59e0b44' : '#1e293b'}`,
                                    borderRadius: 10,
                                    padding: '12px 16px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 12,
                                }}
                            >
                                <div style={{
                                    fontSize: medal ? 24 : 14,
                                    color: '#64748b',
                                    fontWeight: 700,
                                    minWidth: 36,
                                    textAlign: 'center',
                                }}>
                                    {medal ?? `#${e.rank}`}
                                </div>
                                <div style={{ flex: 1, color: '#e2e8f0', fontWeight: 600, fontSize: 14 }}>
                                    {e.name}
                                </div>
                                <div style={{ color: '#fbbf24', fontWeight: 700, fontSize: 16 }}>
                                    {e.score.toLocaleString()}G
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default Leaderboard;
