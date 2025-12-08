// src/components/PokemonCard.tsx

import React from 'react';
import type { Pokemon } from '../types/Pokemon';

interface PokemonCardProps {
    pokemon: Pokemon;
    isSelected: boolean;
    onClick: (pokemon: Pokemon) => void;
}

const PokemonCard: React.FC<PokemonCardProps> = ({ pokemon, isSelected, onClick }) => {
    
    const mainType = pokemon.types[0]?.type.name || 'normal';
    const hp = pokemon.statsMap.hp;

    return (
        <div 
            className={`card type-${mainType} ${isSelected ? 'selected' : ''}`} 
            onClick={() => onClick(pokemon)}
            data-id={pokemon.id}
        >
            <img src={pokemon.sprites.front_default} alt={pokemon.name} loading="lazy" />
            <h3>{pokemon.name}</h3>
            
            {/* HP BAR С ЧИСЛАМИ */}
            <div className="hp-bar-display">
                <div className="hp-text">HP: {hp}</div>
                <div className="hp-bar">
                    <div className="hp-bar-fill" style={{ width: '100%' }}></div>
                </div>
            </div>
            {/* КОНЕЦ HP BAR */}
            
            <div className="types">
                {pokemon.types.map(t => (
                    <span key={t.slot} className={`type type-${t.type.name}`}>
                        {t.type.name}
                    </span>
                ))}
            </div>
        </div>
    );
};
export default PokemonCard;