import React from 'react';
import { useHistoryStore } from '../store/historyStore';

interface Props {
    goToMenu: () => void;
}

const MODE_LABELS: Record<string, string> = {
    '1v1': '⚔️ 1v1',
    '3v3': '👥 3v3',
    story: '📖 Сюжет',
    boss: '👹 Босс',
    hunt: '🏹 Охота',
    survival: '🌊 Выживание',
};

function formatDate(ts: number): string {
    const d = new Date(ts);
    const today = new Date();
    const isToday = d.toDateString() === today.toDateString();
    const time = d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    return isToday ? `Сегодня ${time}` : `${d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })} ${time}`;
}

const HistoryScreen: React.FC<Props> = ({ goToMenu }) => {
    const { entries, clear } = useHistoryStore();

    const wins = entries.filter(e => e.winner === 1).length;
    const winRate = entries.length > 0 ? Math.round((wins / entries.length) * 100) : 0;

    return (
        <div className="hist-screen">
            <div className="ach-screen-header">
                <button className="exe" onClick={goToMenu}>✕</button>
                <h1 className="ach-screen-title">📜 История боёв</h1>
                {entries.length > 0 && (
                    <div className="hist-summary">
                        <span className="hist-summary-item">Боёв: <b>{entries.length}</b></span>
                        <span className="hist-summary-item">Побед: <b style={{ color: '#2ecc71' }}>{wins}</b></span>
                        <span className="hist-summary-item">Винрейт: <b style={{ color: winRate >= 50 ? '#2ecc71' : '#e74c3c' }}>{winRate}%</b></span>
                    </div>
                )}
            </div>

            {entries.length === 0 ? (
                <div className="empty-results" style={{ marginTop: 60 }}>
                    <div style={{ fontSize: '2.5rem' }}>🗒️</div>
                    <div>История пуста — сыграй первый бой!</div>
                </div>
            ) : (
                <>
                    <div className="hist-list">
                        {entries.map(e => (
                            <div key={e.id} className={`hist-entry ${e.winner === 1 ? 'win' : 'loss'}`}>
                                <div className="hist-outcome">{e.winner === 1 ? 'W' : 'L'}</div>
                                <div className="hist-teams">
                                    <div className="hist-team">
                                        {e.team1.map((p, i) => (
                                            <img key={i} src={p.sprite} alt={p.name} title={p.name} className="hist-sprite" />
                                        ))}
                                    </div>
                                    <span className="hist-vs">vs</span>
                                    <div className="hist-team">
                                        {e.team2.map((p, i) => (
                                            <img key={i} src={p.sprite} alt={p.name} title={p.name} className="hist-sprite" />
                                        ))}
                                    </div>
                                </div>
                                <div className="hist-meta">
                                    <span className="hist-mode">{MODE_LABELS[e.mode] ?? e.mode}</span>
                                    <span className="hist-turns">{e.turns} ходов</span>
                                    <span className="hist-dmg">⚔ {e.p1Damage} / {e.p2Damage}</span>
                                    <span className="hist-date">{formatDate(e.date)}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div style={{ textAlign: 'center', margin: '18px 0 30px' }}>
                        <button className="story-btn story-btn--secondary" onClick={clear}>🗑 Очистить историю</button>
                    </div>
                </>
            )}
        </div>
    );
};

export default HistoryScreen;
