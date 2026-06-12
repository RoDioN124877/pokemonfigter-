import React, { useState, useEffect, useCallback } from 'react';
import type { Pokemon } from '../types/Pokemon';
import PokemonCard from './PokemonCard';
import QuickEquipPicker from './QuickEquipPicker';
import { usePokemonStore } from '../store/pokemonStore';
import { useQuickEquipStore } from '../store/quickEquipStore';
import { findEquip } from '../data/equipmentData';

interface TournamentSelectionProps {
    onStart: (participants: Pokemon[]) => void;
    goToMenu: () => void;
}

const SIZE_OPTIONS = [
    { size: 4,  label: '4',  sub: 'Мини' },
    { size: 8,  label: '8',  sub: 'Стандарт' },
    { size: 16, label: '16', sub: 'Большой' },
    { size: 32, label: '32', sub: 'Гранд' },
] as const;

const TournamentSelection: React.FC<TournamentSelectionProps> = ({ onStart, goToMenu }) => {
    const {
        currentPagePokemons, currentPage, totalPages,
        isLoadingList, isLoadingPage,
        setPage, setSearch, getRandomPokemons,
        favorites, toggleFavorite,
    } = usePokemonStore();

    const [tournamentSize, setTournamentSize] = useState<4 | 8 | 16 | 32>(8);
    const [selected, setSelected] = useState<Pokemon[]>([]);
    const [localSearch, setLocalSearch] = useState('');
    const [equipFor, setEquipFor] = useState<Pokemon | null>(null);
    const loadouts = useQuickEquipStore(s => s.loadouts);

    // When size changes, trim or keep selection
    const handleSizeChange = (size: 4 | 8 | 16 | 32) => {
        setTournamentSize(size);
        setSelected(prev => prev.slice(0, size));
    };

    useEffect(() => {
        const t = setTimeout(() => setSearch(localSearch), 350);
        return () => clearTimeout(t);
    }, [localSearch]);

    const toggle = (pok: Pokemon) => {
        if (selected.some(p => p.id === pok.id)) {
            setSelected(prev => prev.filter(p => p.id !== pok.id));
        } else if (selected.length < tournamentSize) {
            setSelected(prev => [...prev, pok]);
        }
    };

    const handleRandom = useCallback(async () => {
        const poks = await getRandomPokemons(tournamentSize);
        setSelected(poks);
    }, [getRandomPokemons, tournamentSize]);

    const canStart = selected.length === tournamentSize;

    return (
        <div className="selection-screen">
            <button className="exe" onClick={goToMenu}>✕</button>

            {/* ── Size selector ── */}
            <div className="trn-size-bar">
                <span className="trn-size-title">Размер турнира:</span>
                {SIZE_OPTIONS.map(({ size, label, sub }) => (
                    <button
                        key={size}
                        className={`trn-size-btn ${tournamentSize === size ? 'active' : ''}`}
                        onClick={() => handleSizeChange(size as 4 | 8 | 16 | 32)}
                    >
                        <span className="trn-size-num">{label}</span>
                        <span className="trn-size-sub">{sub}</span>
                    </button>
                ))}
            </div>

            {/* ── Selected slots + action buttons ── */}
            <div className="selection-bar-fixed" id="selection-top">
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, flex: 1, width: '100%' }}>
                    <h2 style={{ color: 'gold', fontSize: '0.75rem', margin: 0 }}>
                        🏆 Выбери {tournamentSize} покемонов ({selected.length}/{tournamentSize})
                    </h2>

                    {/* Slot strip — scrollable row */}
                    <div className="trn-slot-row">
                        {selected.map(pok => {
                            const eq = loadouts[pok.id] ?? {};
                            const equipped = !!(eq.weapon || eq.armor || eq.accessory);
                            return (
                                <div key={pok.id} className="selected-pok-slot"
                                    style={{
                                        backgroundImage: `url(${pok.sprites.front_default})`,
                                        borderColor: 'gold',
                                        position: 'relative',
                                    }}>
                                    <span className="remove-slot-btn" onClick={() => toggle(pok)} title={`Убрать ${pok.name}`}>✕</span>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setEquipFor(pok); }}
                                        title="Снаряжение"
                                        style={{
                                            position: 'absolute', bottom: -8, right: -8,
                                            background: equipped ? '#0ea5e9' : '#1e293b',
                                            border: `2px solid ${equipped ? '#0ea5e9' : '#475569'}`,
                                            color: '#fff', borderRadius: '50%',
                                            width: 24, height: 24, cursor: 'pointer',
                                            fontSize: 11, padding: 0, display: 'flex',
                                            alignItems: 'center', justifyContent: 'center',
                                            boxShadow: '0 2px 4px rgba(0,0,0,0.5)',
                                        }}
                                    >
                                        ⚔
                                    </button>
                                    {equipped && (
                                        <div style={{
                                            position: 'absolute', bottom: -16, left: -4,
                                            display: 'flex', gap: 1, fontSize: 11,
                                        }}>
                                            {eq.weapon && <span>{findEquip(eq.weapon)?.icon ?? ''}</span>}
                                            {eq.armor && <span>{findEquip(eq.armor)?.icon ?? ''}</span>}
                                            {eq.accessory && <span>{findEquip(eq.accessory)?.icon ?? ''}</span>}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                        {Array.from({ length: tournamentSize - selected.length }).map((_, i) => (
                            <div key={`e-${i}`} className="selected-pok-slot empty-slot" style={{ borderColor: 'gold' }} />
                        ))}
                    </div>

                    <div style={{ display: 'flex', gap: 8 }}>
                        <button className="random-teams-btn" onClick={handleRandom}>🎲 РАНДОМ</button>
                        <button
                            className="menu-button start-battle-btn"
                            disabled={!canStart}
                            onClick={() => onStart(selected)}
                            title={!canStart ? `Нужно минимум 4, чётное число` : ''}
                        >
                            НАЧАТЬ 🏆
                        </button>
                    </div>
                </div>
            </div>

            {/* ── Search ── */}
            <div className="controls">
                <div className="search-row">
                    <input
                        type="text"
                        placeholder="🔍 Поиск..."
                        value={localSearch}
                        onChange={e => setLocalSearch(e.target.value)}
                        className="searchInput"
                    />
                </div>
                {isLoadingList && <span className="loading-hint">Загрузка…</span>}
            </div>

            {/* ── Grid ── */}
            <div className="pokemon-grid">
                {isLoadingPage
                    ? Array.from({ length: 24 }).map((_, i) => <div key={i} className="card card-skeleton" />)
                    : currentPagePokemons.map(pok => (
                        <PokemonCard
                            key={pok.id}
                            pokemon={pok}
                            isSelected={selected.some(p => p.id === pok.id)}
                            onClick={toggle}
                            isFavorite={favorites.includes(pok.id)}
                            onToggleFavorite={toggleFavorite}
                        />
                    ))
                }
            </div>

            {/* ── Pagination ── */}
            {!isLoadingList && totalPages > 1 && (
                <div className="pagination">
                    <button className="menu-button pag-btn" onClick={() => setPage(1)} disabled={currentPage === 1 || isLoadingPage}>«</button>
                    <button className="menu-button pag-btn" onClick={() => setPage(currentPage - 1)} disabled={currentPage === 1 || isLoadingPage}>‹</button>
                    <span className="pag-info">{currentPage} / {totalPages}</span>
                    <button className="menu-button pag-btn" onClick={() => setPage(currentPage + 1)} disabled={currentPage === totalPages || isLoadingPage}>›</button>
                    <button className="menu-button pag-btn" onClick={() => setPage(totalPages)} disabled={currentPage === totalPages || isLoadingPage}>»</button>
                </div>
            )}

            {equipFor && (
                <QuickEquipPicker pokemon={equipFor} onClose={() => setEquipFor(null)} />
            )}
        </div>
    );
};

export default TournamentSelection;
