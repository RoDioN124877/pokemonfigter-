import React, { useState, useEffect, useCallback } from "react";
import type { Pokemon } from "../types/Pokemon";
import PokemonCard from "./PokemonCard";
import PokemonDetailModal from "./PokemonDetailModal";
import QuickEquipPicker from "./QuickEquipPicker";
import { usePokemonStore, type SortField } from "../store/pokemonStore";
import { useQuickEquipStore } from "../store/quickEquipStore";
import { findEquip } from "../data/equipmentData";
import { useT } from "../store/langStore";

interface SelectionProps {
    team1: Pokemon[];
    team2: Pokemon[];
    maxSize: 1 | 3;
    selectFighter: (pokemon: Pokemon) => void;
    startBattle: () => void;
    goToMenu: () => void;
    onRandomTeams: () => void;
    onCompare?: (pokemon: Pokemon) => void;
    compareSlots?: [Pokemon | null, Pokemon | null];
}

// ── Constants ──────────────────────────────────────────────────────────────
const ALL_TYPES = [
    'normal','fire','water','electric','grass','ice','fighting','poison',
    'ground','flying','psychic','bug','rock','ghost','dragon','dark','steel','fairy',
] as const;

const TYPE_ICONS: Record<string, string> = {
    normal:'⭕', fire:'🔥', water:'💧', electric:'⚡', grass:'🌿', ice:'❄️',
    fighting:'👊', poison:'☠️', ground:'🌍', flying:'🌪️', psychic:'🔮',
    bug:'🐛', rock:'🪨', ghost:'👻', dragon:'🐲', dark:'🌑', steel:'⚙️', fairy:'✨',
};

const SORT_OPTIONS: { field: SortField; label: string }[] = [
    { field: 'id',      label: '#'    },
    { field: 'name',    label: 'A-Z'  },
    { field: 'hp',      label: 'HP'   },
    { field: 'attack',  label: 'ATK'  },
    { field: 'defense', label: 'DEF'  },
    { field: 'speed',   label: 'SPD'  },
];

// ── Team slot strip ────────────────────────────────────────────────────────
const SelectionBar: React.FC<{
    team: Pokemon[]; teamNum: 1 | 2;
    selectFighter: (p: Pokemon) => void; maxSize: 1 | 3;
    onEquip: (p: Pokemon) => void;
}> = ({ team, teamNum, selectFighter, maxSize, onEquip }) => {
    const loadouts = useQuickEquipStore(s => s.loadouts);
    const t = useT();
    return (
        <div className="selection-bar-team">
            <h3 style={{ color: teamNum === 1 ? 'gold' : 'silver', fontSize: '0.75rem', margin: '0 0 6px' }}>
                {t('selection.team')} {teamNum} ({team.length}/{maxSize})
            </h3>
            <div className="team-bar-slots">
                {team.map(pok => {
                    const equip = loadouts[pok.id] ?? {};
                    const equipped = !!(equip.weapon || equip.armor || equip.accessory);
                    return (
                        <div key={pok.id} className="selected-pok-slot" style={{
                            backgroundImage: `url(${pok.sprites.front_default})`,
                            borderColor: teamNum === 1 ? 'gold' : 'silver',
                            position: 'relative',
                        }}>
                            <span className="remove-slot-btn" onClick={() => selectFighter(pok)} title={`Убрать ${pok.name}`}>✕</span>
                            <button
                                onClick={(e) => { e.stopPropagation(); onEquip(pok); }}
                                title="Снаряжение"
                                style={{
                                    position: 'absolute', bottom: -8, right: -8,
                                    background: equipped ? '#0ea5e9' : '#1e293b',
                                    border: `2px solid ${equipped ? '#0ea5e9' : '#475569'}`,
                                    color: '#fff', borderRadius: '50%',
                                    width: 26, height: 26, cursor: 'pointer',
                                    fontSize: 12, padding: 0, display: 'flex',
                                    alignItems: 'center', justifyContent: 'center',
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.5)',
                                }}
                            >
                                ⚔
                            </button>
                            {equipped && (
                                <div style={{
                                    position: 'absolute', bottom: -16, left: -8,
                                    display: 'flex', gap: 2, fontSize: 12,
                                }}>
                                    {equip.weapon && <span>{findEquip(equip.weapon)?.icon ?? ''}</span>}
                                    {equip.armor && <span>{findEquip(equip.armor)?.icon ?? ''}</span>}
                                    {equip.accessory && <span>{findEquip(equip.accessory)?.icon ?? ''}</span>}
                                </div>
                            )}
                        </div>
                    );
                })}
                {Array.from({ length: maxSize - team.length }).map((_, i) => (
                    <div key={`empty-${i}`} className="selected-pok-slot empty-slot"
                        style={{ borderColor: teamNum === 1 ? 'gold' : 'silver' }} />
                ))}
            </div>
        </div>
    );
};

// ── Main component ─────────────────────────────────────────────────────────
const Selection: React.FC<SelectionProps> = ({
    team1, team2, maxSize, selectFighter, startBattle, goToMenu, onRandomTeams, onCompare, compareSlots,
}) => {
    const {
        currentPagePokemons, currentPage, totalPages,
        searchTerm, filterType, generation, sortBy, sortDir,
        isLoadingList, isLoadingPage,
        favorites, showOnlyFavorites,
        setPage, setSearch, setFilterType, setGeneration, setSort,
        toggleFavorite, setShowOnlyFavorites,
    } = usePokemonStore();

    const [localSearch, setLocalSearch] = useState(searchTerm);
    const [showScrollTop, setShowScrollTop] = useState(false);
    const [filtersOpen, setFiltersOpen] = useState(false);
    const [detailPokemon, setDetailPokemon] = useState<Pokemon | null>(null);
    const [equipFor, setEquipFor] = useState<Pokemon | null>(null);
    const t = useT();

    // Debounce search
    useEffect(() => {
        const t = setTimeout(() => setSearch(localSearch), 350);
        return () => clearTimeout(t);
    }, [localSearch]);

    // Scroll-to-top button
    useEffect(() => {
        const onScroll = () => setShowScrollTop(window.scrollY > 400);
        window.addEventListener('scroll', onScroll);
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    const scrollToTop = useCallback(() => window.scrollTo({ top: 0, behavior: 'smooth' }), []);

    const isReady = team1.length === maxSize && team2.length === maxSize;

    // Count active filters for badge
    const activeFilterCount = (filterType ? 1 : 0) + (generation !== null ? 1 : 0) +
        (sortBy !== 'id' || sortDir !== 'asc' ? 1 : 0) + (showOnlyFavorites ? 1 : 0);

    return (
        <div className="selection-screen">
            <button className="exe" onClick={goToMenu}>✕</button>

            {/* ── Sticky top bar ── */}
            <div className="selection-bar-fixed" id="selection-top">
                <SelectionBar team={team1} teamNum={1} selectFighter={selectFighter} maxSize={maxSize} onEquip={setEquipFor} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center' }}>
                    <button className="menu-button start-battle-btn" onClick={startBattle} disabled={!isReady}>
                        {t('selection.fight')}
                    </button>
                    <button className="random-teams-btn" onClick={onRandomTeams} title="Random teams">
                        {t('selection.random')}
                    </button>
                </div>
                <SelectionBar team={team2} teamNum={2} selectFighter={selectFighter} maxSize={maxSize} onEquip={setEquipFor} />
            </div>

            {/* ── Search + filters header ── */}
            <div className="controls">
                <div className="search-row">
                    <input
                        type="text"
                        placeholder="🔍 Поиск по имени..."
                        value={localSearch}
                        onChange={e => setLocalSearch(e.target.value)}
                        className="searchInput"
                    />
                    <button
                        className={`filter-toggle-btn ${filtersOpen ? 'open' : ''} ${activeFilterCount > 0 ? 'has-active' : ''}`}
                        onClick={() => setFiltersOpen(v => !v)}
                    >
                        ⚙ Фильтры{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
                    </button>
                </div>

                {isLoadingList && <span className="loading-hint">Загрузка покемонов…</span>}

                {/* ── Expandable filter panel ── */}
                {filtersOpen && (
                    <div className="filter-panel">

                        {/* Generation */}
                        <div className="filter-row">
                            <span className="filter-label">Поколение:</span>
                            <button
                                className={`gen-btn ${generation === null ? 'active' : ''}`}
                                onClick={() => setGeneration(null)}
                            >Все</button>
                            {[1,2,3,4,5,6,7,8,9].map(g => (
                                <button key={g}
                                    className={`gen-btn ${generation === g ? 'active' : ''}`}
                                    onClick={() => setGeneration(generation === g ? null : g)}
                                >
                                    {g}
                                </button>
                            ))}
                        </div>

                        {/* Type */}
                        <div className="filter-row">
                            <span className="filter-label">Тип:</span>
                            <button
                                className={`type-pill ${filterType === null ? 'pill-all-active' : ''}`}
                                onClick={() => setFilterType(null)}
                            >Все</button>
                            {ALL_TYPES.map(type => (
                                <button key={type}
                                    className={`type-pill type-badge type-${type} ${filterType === type ? 'pill-active' : 'pill-dim'}`}
                                    onClick={() => setFilterType(filterType === type ? null : type)}
                                    title={type}
                                >
                                    {TYPE_ICONS[type]} {type}
                                </button>
                            ))}
                        </div>

                        {/* Favorites */}
                        <div className="filter-row">
                            <span className="filter-label">Избранные:</span>
                            <button
                                className={`gen-btn ${showOnlyFavorites ? 'active' : ''}`}
                                onClick={() => setShowOnlyFavorites(!showOnlyFavorites)}
                            >
                                {showOnlyFavorites ? '⭐ Только избранные' : '☆ Все'}
                            </button>
                            <span style={{ fontSize: '0.7rem', color: '#888' }}>({favorites.length} сохранено)</span>
                        </div>

                        {/* Sort */}
                        <div className="filter-row">
                            <span className="filter-label">Сорт:</span>
                            {SORT_OPTIONS.map(({ field, label }) => (
                                <button key={field}
                                    className={`sort-btn ${sortBy === field ? 'active' : ''}`}
                                    onClick={() => setSort(field)}
                                >
                                    {label}
                                    {sortBy === field && (
                                        <span className="sort-arrow">{sortDir === 'asc' ? ' ↑' : ' ↓'}</span>
                                    )}
                                </button>
                            ))}
                            {(sortBy !== 'id' || sortDir !== 'asc') && (
                                <button className="sort-btn reset-btn" onClick={() => setSort('id')}>
                                    ✕ сброс
                                </button>
                            )}
                        </div>

                        {/* Active filters summary */}
                        {activeFilterCount > 0 && (
                            <div className="active-filters-row">
                                {filterType && (
                                    <span className={`active-chip type-badge type-${filterType}`}>
                                        {TYPE_ICONS[filterType]} {filterType} ✕
                                        <button className="chip-remove" onClick={() => setFilterType(null)} />
                                    </span>
                                )}
                                {generation !== null && (
                                    <span className="active-chip gen-chip">
                                        Gen {generation} ✕
                                        <button className="chip-remove" onClick={() => setGeneration(null)} />
                                    </span>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* ── Pokemon grid ── */}
            <div className="pokemon-grid">
                {isLoadingPage
                    ? Array.from({ length: 24 }).map((_, i) => (
                        <div key={i} className="card card-skeleton" />
                    ))
                    : currentPagePokemons.map(pok => {
                        const isSelected = team1.some(p => p.id === pok.id) || team2.some(p => p.id === pok.id);
                        const isComparing = compareSlots
                            ? compareSlots[0]?.id === pok.id || compareSlots[1]?.id === pok.id
                            : false;
                        return (
                            <PokemonCard
                                key={pok.id}
                                pokemon={pok}
                                isSelected={isSelected}
                                onClick={selectFighter}
                                isFavorite={favorites.includes(pok.id)}
                                onToggleFavorite={toggleFavorite}
                                onCompare={onCompare}
                                isComparing={isComparing}
                                onInfo={setDetailPokemon}
                            />
                        );
                    })
                }
                {!isLoadingPage && currentPagePokemons.length === 0 && (
                    <div className="empty-results">
                        <div style={{ fontSize: '2rem' }}>😶</div>
                        <div>Ничего не найдено</div>
                        <button className="sort-btn" onClick={() => { setFilterType(null); setGeneration(null); setLocalSearch(''); setSearch(''); }}>
                            Сбросить фильтры
                        </button>
                    </div>
                )}
            </div>

            {/* ── Pagination ── */}
            {!isLoadingList && totalPages > 1 && (
                <div className="pagination">
                    <button className="menu-button pag-btn" onClick={() => setPage(1)}
                        disabled={currentPage === 1 || isLoadingPage}>«</button>
                    <button className="menu-button pag-btn" onClick={() => setPage(currentPage - 1)}
                        disabled={currentPage === 1 || isLoadingPage}>‹</button>
                    <span className="pag-info">{currentPage} / {totalPages}</span>
                    <button className="menu-button pag-btn" onClick={() => setPage(currentPage + 1)}
                        disabled={currentPage === totalPages || isLoadingPage}>›</button>
                    <button className="menu-button pag-btn" onClick={() => setPage(totalPages)}
                        disabled={currentPage === totalPages || isLoadingPage}>»</button>
                </div>
            )}

            {showScrollTop && (
                <button className="scroll-to-top-btn" onClick={scrollToTop}>↑ К FIGHT!</button>
            )}

            {detailPokemon && (
                <PokemonDetailModal
                    pokemon={detailPokemon}
                    onClose={() => setDetailPokemon(null)}
                    isFavorite={favorites.includes(detailPokemon.id)}
                    onToggleFavorite={toggleFavorite}
                />
            )}

            {equipFor && (
                <QuickEquipPicker pokemon={equipFor} onClose={() => setEquipFor(null)} />
            )}
        </div>
    );
};

export default Selection;
