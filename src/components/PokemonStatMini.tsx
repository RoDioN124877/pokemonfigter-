import React from 'react';
import type { Pokemon } from '../types/Pokemon';
import { calcStatAtLevel, calcBattleHP } from '../utils/progressUtils';

const STAT_META: { key: string; label: string; color: string }[] = [
    { key: 'hp',              label: 'ОЗ',  color: '#4ade80' },
    { key: 'attack',          label: 'АТК', color: '#f87171' },
    { key: 'defense',         label: 'ЗАЩ', color: '#60a5fa' },
    { key: 'special-attack',  label: 'С.А', color: '#c084fc' },
    { key: 'special-defense', label: 'С.З', color: '#34d399' },
    { key: 'speed',           label: 'СКР', color: '#fbbf24' },
];

interface Props {
    pokemon: Pokemon;
    level: number;
    /** compact=true → 2-column grid, fixed max 300; false → single column, relative max */
    compact?: boolean;
}

const PokemonStatMini: React.FC<Props> = ({ pokemon, level, compact = false }) => {
    const sm = pokemon.statsMap;
    const values = [
        calcBattleHP(sm.hp, level),
        calcStatAtLevel(sm.attack, level),
        calcStatAtLevel(sm.defense, level),
        calcStatAtLevel(sm['special-attack'], level),
        calcStatAtLevel(sm['special-defense'], level),
        calcStatAtLevel(sm.speed, level),
    ];
    // HP is in battle-units (~3.2x other stats). Normalize bar widths separately:
    // - HP bar scaled vs HP_MAX (460)
    // - other stats scaled vs STAT_MAX (relative to their own peers)
    const HP_MAX = 460;
    const otherStats = values.slice(1);
    const STAT_MAX = Math.max(compact ? 220 : Math.max(...otherStats, 1), 80);
    const barPct = (i: number) =>
        i === 0
            ? Math.min(100, Math.round(values[0] / HP_MAX * 100))
            : Math.min(100, Math.round(values[i] / STAT_MAX * 100));

    return (
        <div style={{
            display: 'grid',
            gridTemplateColumns: compact ? '1fr 1fr' : '1fr',
            gap: compact ? '2px 10px' : 3,
        }}>
            {STAT_META.map(({ key, label, color }, i) => (
                <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ color: '#475569', fontSize: 9, width: 24, textAlign: 'right', fontWeight: 700, letterSpacing: '-0.02em' }}>
                        {label}
                    </span>
                    <div style={{ flex: 1, background: '#0a0f1e', borderRadius: 2, height: compact ? 5 : 6, overflow: 'hidden' }}>
                        <div style={{
                            width: `${barPct(i)}%`,
                            height: '100%', background: color, borderRadius: 2,
                            transition: 'width 0.4s ease',
                        }} />
                    </div>
                    <span style={{ color: '#64748b', fontSize: 9, width: 28 }}>{values[i]}</span>
                </div>
            ))}
        </div>
    );
};

export default PokemonStatMini;
