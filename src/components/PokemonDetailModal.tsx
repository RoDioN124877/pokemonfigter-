import React, { useState, useEffect, useMemo } from 'react';
import type { Pokemon } from '../types/Pokemon';
import { typeChart, getAbilityInfo, ABILITY_INFO } from '../utils/battleUtils';
import SFX from '../utils/soundUtils';

interface Props {
    pokemon: Pokemon;
    onClose: () => void;
    isFavorite?: boolean;
    onToggleFavorite?: (id: number) => void;
}

const ALL_TYPES = [
    'normal','fire','water','electric','grass','ice','fighting','poison',
    'ground','flying','psychic','bug','rock','ghost','dragon','dark','steel','fairy',
];

const TYPE_ICONS: Record<string, string> = {
    normal:'⭕', fire:'🔥', water:'💧', electric:'⚡', grass:'🌿', ice:'❄️',
    fighting:'👊', poison:'☠️', ground:'🌍', flying:'🌪️', psychic:'🔮',
    bug:'🐛', rock:'🪨', ghost:'👻', dragon:'🐲', dark:'🌑', steel:'⚙️', fairy:'✨',
};

const STAT_LABELS: { key: string; label: string }[] = [
    { key: 'hp', label: 'HP' },
    { key: 'attack', label: 'Атака' },
    { key: 'defense', label: 'Защита' },
    { key: 'special-attack', label: 'Сп. Атака' },
    { key: 'special-defense', label: 'Сп. Защита' },
    { key: 'speed', label: 'Скорость' },
];

const MAX_STAT = 200;

const statColor = (v: number) =>
    v >= 120 ? '#a78bfa' : v >= 90 ? '#2ecc71' : v >= 60 ? '#f39c12' : '#e74c3c';

// Defensive matchups: how much damage each attacking type deals to this pokemon
function getDefensiveMatchups(pokemon: Pokemon) {
    const t1 = pokemon.types[0]?.type.name;
    const t2 = pokemon.types[1]?.type.name;
    const groups: Record<string, string[]> = { x4: [], x2: [], half: [], quarter: [], zero: [] };

    for (const attType of ALL_TYPES) {
        let mult = typeChart[attType]?.[t1] ?? 1;
        if (t2) mult *= typeChart[attType]?.[t2] ?? 1;
        if (mult === 0) groups.zero.push(attType);
        else if (mult >= 4) groups.x4.push(attType);
        else if (mult >= 2) groups.x2.push(attType);
        else if (mult <= 0.25) groups.quarter.push(attType);
        else if (mult < 1) groups.half.push(attType);
    }
    return groups;
}

const TypePillRow: React.FC<{ title: string; types: string[]; cls: string }> = ({ title, types, cls }) =>
    types.length === 0 ? null : (
        <div className="pdm-matchup-row">
            <span className={`pdm-matchup-tag ${cls}`}>{title}</span>
            <div className="pdm-matchup-types">
                {types.map(t => (
                    <span key={t} className={`type-badge type-${t}`}>{TYPE_ICONS[t]} {t}</span>
                ))}
            </div>
        </div>
    );

const ART_URL = (id: number, shiny: boolean) =>
    `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${shiny ? 'shiny/' : ''}${id}.png`;

const PokemonDetailModal: React.FC<Props> = ({ pokemon, onClose, isFavorite, onToggleFavorite }) => {
    const [shiny, setShiny] = useState(false);
    const [artLoaded, setArtLoaded] = useState(false);

    const matchups = useMemo(() => getDefensiveMatchups(pokemon), [pokemon]);
    const bst = STAT_LABELS.reduce((sum, { key }) => sum + (pokemon.statsMap[key] ?? 0), 0);
    const mainType = pokemon.types[0]?.type.name || 'normal';

    // Escape closes the modal
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [onClose]);

    useEffect(() => { setArtLoaded(false); }, [shiny, pokemon.id]);

    const knownAbilities = pokemon.abilities.map(a => a.ability.name);

    return (
        <div className="pdm-backdrop" onClick={onClose}>
            <div className={`pdm-modal type-glow-${mainType}`} onClick={e => e.stopPropagation()}>
                <button className="pdm-close" onClick={onClose}>✕</button>

                {/* ── Header: art + identity ── */}
                <div className="pdm-header">
                    <div className="pdm-art-wrap">
                        {!artLoaded && <div className="pdm-art-spinner" />}
                        <img
                            key={`${pokemon.id}-${shiny}`}
                            src={ART_URL(pokemon.id, shiny)}
                            alt={pokemon.name}
                            className={`pdm-art ${artLoaded ? 'loaded' : ''} ${shiny ? 'shiny' : ''}`}
                            onLoad={() => setArtLoaded(true)}
                            onError={e => { (e.target as HTMLImageElement).src = pokemon.sprites.front_default; setArtLoaded(true); }}
                        />
                        <button
                            className={`pdm-shiny-btn ${shiny ? 'active' : ''}`}
                            onClick={() => { SFX.select(); setShiny(s => !s); }}
                            title="Шайни-форма"
                        >
                            ✨
                        </button>
                    </div>

                    <div className="pdm-identity">
                        <div className="pdm-id">#{String(pokemon.id).padStart(3, '0')}</div>
                        <h2 className="pdm-name">{pokemon.name}{shiny && <span className="pdm-shiny-mark"> ✨</span>}</h2>
                        <div className="pdm-types">
                            {pokemon.types.map(t => (
                                <span key={t.slot} className={`type-badge type-${t.type.name}`}>
                                    {TYPE_ICONS[t.type.name]} {t.type.name}
                                </span>
                            ))}
                        </div>
                        <div className="pdm-physical">
                            <span>📏 {(pokemon.height / 10).toFixed(1)} м</span>
                            <span>⚖️ {(pokemon.weight / 10).toFixed(1)} кг</span>
                        </div>
                        {onToggleFavorite && (
                            <button
                                className={`pdm-fav-btn ${isFavorite ? 'active' : ''}`}
                                onClick={() => { SFX.select(); onToggleFavorite(pokemon.id); }}
                            >
                                {isFavorite ? '⭐ В избранном' : '☆ В избранное'}
                            </button>
                        )}
                    </div>
                </div>

                {/* ── Stats ── */}
                <div className="pdm-section">
                    <h3 className="pdm-section-title">Характеристики <span className="pdm-bst">BST: {bst}</span></h3>
                    <div className="pdm-stats">
                        {STAT_LABELS.map(({ key, label }) => {
                            const v = pokemon.statsMap[key] ?? 0;
                            return (
                                <div key={key} className="pdm-stat-row">
                                    <span className="pdm-stat-label">{label}</span>
                                    <span className="pdm-stat-val" style={{ color: statColor(v) }}>{v}</span>
                                    <div className="pdm-stat-bar-bg">
                                        <div
                                            className="pdm-stat-bar-fill"
                                            style={{ width: `${Math.min(100, (v / MAX_STAT) * 100)}%`, background: statColor(v) }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* ── Type matchups ── */}
                <div className="pdm-section">
                    <h3 className="pdm-section-title">Уязвимости и резисты</h3>
                    <TypePillRow title="×4 урон" types={matchups.x4} cls="tag-x4" />
                    <TypePillRow title="×2 урон" types={matchups.x2} cls="tag-x2" />
                    <TypePillRow title="×½ урон" types={matchups.half} cls="tag-half" />
                    <TypePillRow title="×¼ урон" types={matchups.quarter} cls="tag-quarter" />
                    <TypePillRow title="Иммунитет" types={matchups.zero} cls="tag-zero" />
                    {Object.values(matchups).every(g => g.length === 0) && (
                        <div className="pdm-no-matchups">Нейтрален ко всем типам</div>
                    )}
                </div>

                {/* ── Abilities ── */}
                <div className="pdm-section">
                    <h3 className="pdm-section-title">Способности</h3>
                    <div className="pdm-abilities">
                        {knownAbilities.map(name => {
                            const info = getAbilityInfo(name);
                            const known = name in ABILITY_INFO;
                            return (
                                <div key={name} className={`pdm-ability ${known ? `tier-${info.tier}` : 'tier-unknown'}`}>
                                    <span className="pdm-ability-icon">{info.icon}</span>
                                    <div className="pdm-ability-text">
                                        <div className="pdm-ability-name">{name.replace(/-/g, ' ')}</div>
                                        <div className="pdm-ability-desc">{known ? info.desc : 'Не влияет на бой в этой игре'}</div>
                                    </div>
                                    {known && <span className={`pdm-ability-tier tier-${info.tier}`}>{info.tier}</span>}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PokemonDetailModal;
