import React, { useEffect, useState, useMemo } from 'react';
import { STARTER_TEAMS } from '../data/starterTeams';
import type { StarterTeam } from '../data/starterTeams';
import { fetchPokemonsByIds } from '../services/ApiService';
import type { Pokemon } from '../types/Pokemon';

const NG_PLUS_POOLS = [
    [3, 6, 9], [65, 68, 76], [130, 143, 149], [94, 59, 131], [145, 146, 144],
    [62, 34, 103], [38, 112, 78], [91, 97, 89], [124, 126, 127], [136, 135, 134],
    [55, 106, 82], [71, 105, 110], [57, 73, 49], [128, 123, 121], [141, 142, 139],
];

function generateNgPlusTeams(ngLevel: number): StarterTeam[] {
    const mult = Math.pow(2, ngLevel);
    const seed = ngLevel * 7919;
    const shuffled = [...NG_PLUS_POOLS].sort((a, b) => {
        const ha = ((a[0] + seed) * 2654435761) >>> 0;
        const hb = ((b[0] + seed) * 2654435761) >>> 0;
        return ha - hb;
    });
    return shuffled.slice(0, 5).map((ids, i) => ({
        id: `ng-${ngLevel}-${i}`,
        name: `НГ+${ngLevel} КОМАНДА ${i + 1}`,
        emoji: ['🔥', '💎', '⚡', '🌊', '🐉'][i],
        description: `Усиленная команда ×${mult}. Враги тоже сильнее в ×${mult}.`,
        playstyle: `NG+${ngLevel}`,
        difficulty: 'Сложная' as const,
        color: ['#ef4444', '#3b82f6', '#fbbf24', '#22c55e', '#a855f7'][i],
        pokemonIds: ids as [number, number, number],
        strengths: [`×${mult} стартовая сила`],
        weaknesses: [`×${mult} враги`],
    }));
}

interface Props {
    onTeamSelected: (team: Pokemon[]) => void;
    goToMenu: () => void;
    ngPlusLevel?: number;
}

const DIFF_CLASS: Record<string, string> = {
    'Лёгкая': 'easy',
    'Средняя': 'mid',
    'Сложная': 'hard',
};

const StoryTeamSelect: React.FC<Props> = ({ onTeamSelected, goToMenu, ngPlusLevel = 0 }) => {
    const [allPokemon, setAllPokemon] = useState<Record<number, Pokemon>>({});
    const [loading, setLoading] = useState(true);
    const [selectedId, setSelectedId] = useState<string | null>(null);

    const teams = useMemo(() => ngPlusLevel > 0 ? generateNgPlusTeams(ngPlusLevel) : STARTER_TEAMS, [ngPlusLevel]);

    useEffect(() => {
        fetchPokemonsByIds(teams.flatMap(t => t.pokemonIds)).then(poks => {
            const map: Record<number, Pokemon> = {};
            poks.forEach(p => { map[p.id] = p; });
            setAllPokemon(map);
            setLoading(false);
        });
    }, [teams]);

    const selectedTeam = teams.find(t => t.id === selectedId);

    const handleConfirm = () => {
        if (!selectedTeam) return;
        const team = selectedTeam.pokemonIds.map(id => allPokemon[id]).filter(Boolean);
        if (team.length === 3) onTeamSelected(team);
    };

    return (
        <div className="sts-screen">
            <div className="sts-header">
                <button className="sts-back-btn" onClick={goToMenu}>← Меню</button>
                <div>
                    <h1 className="sts-title">⚔️ ВЫБЕРИ СВОЙ ПУТЬ</h1>
                    <p className="sts-subtitle">Каждая команда — уникальная тактика и вызов</p>
                </div>
            </div>

            {loading ? (
                <div className="sts-loading">Загрузка команд...</div>
            ) : (
                <>
                    {ngPlusLevel > 0 && (
                        <div style={{ background: 'rgba(239,68,68,0.1)', border: '2px solid #ef4444', borderRadius: 12, padding: '12px 16px', marginBottom: 16, textAlign: 'center' }}>
                            <div style={{ color: '#fbbf24', fontWeight: 800, fontSize: 18 }}>🔥 НОВАЯ ИГРА +{ngPlusLevel}</div>
                            <div style={{ color: '#f87171', fontSize: 12 }}>
                                Враги ×{Math.pow(2, ngPlusLevel)} сильнее · Стартовые покемоны ×{Math.pow(2, ngPlusLevel)} · Снаряжение ×{Math.pow(2, ngPlusLevel)}
                            </div>
                        </div>
                    )}
                    <div className="sts-grid">
                        {teams.map(team => {
                            const isSelected = selectedId === team.id;
                            const poks = team.pokemonIds.map(id => allPokemon[id]).filter(Boolean);

                            return (
                                <div
                                    key={team.id}
                                    className={`sts-card ${isSelected ? 'sts-card--on' : ''}`}
                                    style={{ '--col': team.color } as React.CSSProperties}
                                    onClick={() => setSelectedId(isSelected ? null : team.id)}
                                >
                                    <div className="sts-card-bar" />

                                    <div className="sts-card-top">
                                        <span className="sts-card-emoji">{team.emoji}</span>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div className="sts-card-name">{team.name}</div>
                                            <div className="sts-card-style">{team.playstyle}</div>
                                        </div>
                                        <div className={`sts-diff sts-diff--${DIFF_CLASS[team.difficulty] ?? 'mid'}`}>
                                            {team.difficulty}
                                        </div>
                                    </div>

                                    <div className="sts-pok-row">
                                        {poks.map(p => (
                                            <div key={p.id} className="sts-pok-slot">
                                                <img src={p.sprites.front_default} alt={p.name} className="sts-pok-img" />
                                                <div className="sts-pok-name">{p.name}</div>
                                                <div className="sts-pok-types">
                                                    {p.types.map(t => (
                                                        <span key={t.type.name} className={`type-badge type-${t.type.name}`}>
                                                            {t.type.name}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <p className="sts-card-desc">{team.description}</p>

                                    <div className="sts-matchups">
                                        <div className="sts-mu sts-mu--str"><span>✅</span><span>{team.strengths.join(' · ')}</span></div>
                                        <div className="sts-mu sts-mu--wk"><span>⚠️</span><span>{team.weaknesses.join(' · ')}</span></div>
                                    </div>

                                    {isSelected && <div className="sts-check">✓ ВЫБРАНА</div>}
                                </div>
                            );
                        })}
                    </div>

                    <div className="sts-confirm-bar">
                        {selectedTeam ? (
                            <>
                                <span className="sts-confirm-label">{selectedTeam.emoji} {selectedTeam.name}</span>
                                <button className="menu-button" onClick={handleConfirm}>🗺️ НАЧАТЬ ПУТЬ!</button>
                            </>
                        ) : (
                            <span className="sts-pick-hint">Выбери команду выше ↑</span>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

export default StoryTeamSelect;
