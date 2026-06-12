import React from 'react';
import type { Pokemon } from '../types/Pokemon';

interface ComparePanelProps {
    pokemon1: Pokemon | null;
    pokemon2: Pokemon | null;
    onClose: () => void;
}

const STATS = [
    { key: 'hp',              label: 'HP'  },
    { key: 'attack',          label: 'ATK' },
    { key: 'defense',         label: 'DEF' },
    { key: 'special-attack',  label: 'SpA' },
    { key: 'special-defense', label: 'SpD' },
    { key: 'speed',           label: 'SPD' },
];

const MAX_STAT = 180;

const StatBar: React.FC<{ value: number; flip?: boolean; winner?: boolean }> = ({ value, flip, winner }) => {
    const pct = Math.min(100, (value / MAX_STAT) * 100);
    const color = winner ? '#f1c40f' : '#3498db';
    return (
        <div className="cmp-bar-wrap" style={{ flexDirection: flip ? 'row-reverse' : 'row' }}>
            <span className="cmp-stat-val" style={{ color: winner ? '#f1c40f' : undefined }}>{value}</span>
            <div className="cmp-bar-bg">
                <div className="cmp-bar-fill" style={{ width: `${pct}%`, background: color, marginLeft: flip ? 'auto' : 0 }} />
            </div>
        </div>
    );
};

const ComparePanel: React.FC<ComparePanelProps> = ({ pokemon1, pokemon2, onClose }) => {
    if (!pokemon1 && !pokemon2) return null;

    const totalStat = (p: Pokemon | null) =>
        p ? Object.values(p.statsMap).reduce((a, b) => a + b, 0) : 0;

    const t1 = totalStat(pokemon1);
    const t2 = totalStat(pokemon2);

    return (
        <div className="compare-panel">
            <button className="cmp-close-btn" onClick={onClose}>✕ Закрыть</button>

            <div className="cmp-header">
                <div className="cmp-pok-name">{pokemon1 ? pokemon1.name : '—'}</div>
                <div className="cmp-vs">VS</div>
                <div className="cmp-pok-name">{pokemon2 ? pokemon2.name : '—'}</div>
            </div>

            {pokemon1 && pokemon2 && (
                <>
                    <div className="cmp-sprites">
                        <img src={pokemon1.sprites.front_default} alt={pokemon1.name} className="cmp-sprite" />
                        <div className="cmp-total-stats">
                            <span style={{ color: t1 > t2 ? '#f1c40f' : undefined }}>BST {t1}</span>
                            <span style={{ fontSize: '0.6rem', color: '#888' }}>Сумма стат</span>
                            <span style={{ color: t2 > t1 ? '#f1c40f' : undefined }}>BST {t2}</span>
                        </div>
                        <img src={pokemon2.sprites.front_default} alt={pokemon2.name} className="cmp-sprite" />
                    </div>

                    <div className="cmp-stats-table">
                        {STATS.map(({ key, label }) => {
                            const v1 = pokemon1.statsMap[key] ?? 0;
                            const v2 = pokemon2.statsMap[key] ?? 0;
                            return (
                                <div key={key} className="cmp-stat-row">
                                    <StatBar value={v1} flip winner={v1 > v2} />
                                    <span className="cmp-stat-label">{label}</span>
                                    <StatBar value={v2} winner={v2 > v1} />
                                </div>
                            );
                        })}
                    </div>
                </>
            )}

            {(!pokemon1 || !pokemon2) && (
                <div className="cmp-hint">Выберите ещё одного покемона для сравнения (кнопка ⚖ на карточке)</div>
            )}
        </div>
    );
};

export default ComparePanel;
