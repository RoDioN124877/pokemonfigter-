import React from 'react';
import type { Pokemon } from '../types/Pokemon';
import { getAbilityInfo, ABILITY_INFO } from '../utils/battleUtils';
import SFX from '../utils/soundUtils';

interface Props {
    pokemon: Pokemon;
    isSelected: boolean;
    onClick: (pokemon: Pokemon) => void;
    isFavorite?: boolean;
    onToggleFavorite?: (id: number) => void;
    onCompare?: (pokemon: Pokemon) => void;
    isComparing?: boolean;
    onInfo?: (pokemon: Pokemon) => void;
}

const STAT_COLORS = (pct: number) =>
    pct > 66 ? '#2ecc71' : pct > 40 ? '#f39c12' : '#e74c3c';

const MAX_STAT = 180;

const StatRow: React.FC<{ label: string; value: number }> = ({ label, value }) => {
    const pct = Math.min(100, (value / MAX_STAT) * 100);
    return (
        <div className="pcard-stat-row">
            <span className="pcard-stat-label">{label}</span>
            <span className="pcard-stat-val">{value}</span>
            <div className="pcard-stat-bar-bg">
                <div className="pcard-stat-bar-fill" style={{ width: `${pct}%`, background: STAT_COLORS(pct) }} />
            </div>
        </div>
    );
};

const PokemonCard: React.FC<Props> = ({ pokemon, isSelected, onClick, isFavorite, onToggleFavorite, onCompare, isComparing, onInfo }) => {
    const mainType = pokemon.types[0]?.type.name || 'normal';
    const stats = [
        { key: 'hp',               label: 'HP'  },
        { key: 'attack',           label: 'ATK' },
        { key: 'defense',          label: 'DEF' },
        { key: 'special-attack',   label: 'SpA' },
        { key: 'special-defense',  label: 'SpD' },
        { key: 'speed',            label: 'SPD' },
    ];

    const knownAbilities = pokemon.abilities
        .map(a => a.ability.name)
        .filter(name => name in ABILITY_INFO);

    return (
        <div
            className={`pcard type-${mainType} ${isSelected ? 'selected' : ''} ${isComparing ? 'comparing' : ''}`}
            onClick={() => onClick(pokemon)}
            title={`#${pokemon.id} ${pokemon.name}`}
        >
            {/* Action buttons top-right */}
            <div className="pcard-actions">
                {onToggleFavorite && (
                    <button
                        className={`pcard-fav-btn ${isFavorite ? 'active' : ''}`}
                        onClick={e => { e.stopPropagation(); SFX.select(); onToggleFavorite(pokemon.id); }}
                        title={isFavorite ? 'Убрать из избранного' : 'В избранное'}
                    >
                        {isFavorite ? '⭐' : '☆'}
                    </button>
                )}
                {onCompare && (
                    <button
                        className={`pcard-cmp-btn ${isComparing ? 'active' : ''}`}
                        onClick={e => { e.stopPropagation(); SFX.select(); onCompare(pokemon); }}
                        title={isComparing ? 'Убрать из сравнения' : 'Сравнить'}
                    >
                        ⚖
                    </button>
                )}
                {onInfo && (
                    <button
                        className="pcard-info-btn"
                        onClick={e => { e.stopPropagation(); SFX.select(); onInfo(pokemon); }}
                        title="Подробнее"
                    >
                        ℹ
                    </button>
                )}
            </div>

            {/* Top: sprite + name */}
            <div className="pcard-top">
                <img src={pokemon.sprites.front_default} alt={pokemon.name} loading="lazy" className="pcard-img" />
                <div className="pcard-info">
                    <div className="pcard-name">{pokemon.name}</div>
                    <div className="pcard-id">#{String(pokemon.id).padStart(3, '0')}</div>
                    <div className="pcard-types">
                        {pokemon.types.map(t => (
                            <span key={t.slot} className={`type-badge type-${t.type.name}`}>{t.type.name}</span>
                        ))}
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="pcard-stats">
                {stats.map(({ key, label }) => (
                    <StatRow key={key} label={label} value={pokemon.statsMap[key] ?? 0} />
                ))}
            </div>

            {/* Abilities */}
            {knownAbilities.length > 0 && (
                <div className="pcard-abilities">
                    {knownAbilities.slice(0, 2).map(name => {
                        const info = getAbilityInfo(name);
                        return (
                            <div key={name} className={`ability-badge tier-${info.tier}`} title={info.desc}>
                                {info.icon} {name.replace(/-/g, ' ')}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default PokemonCard;
