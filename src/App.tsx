import React, { useState, useEffect } from 'react';
import type { AppState, Pokemon } from './types/Pokemon';
import { fetchPokemonsBatch, INITIAL_LOAD_COUNT } from './services/ApiService';
import Menu from './components/Menu';
import Selection from './components/Selection';
import BattleArena from './components/BattleArena';

const initialAppState: AppState & { nextPokemonIdToLoad: number } = {
    allPokemons: [],
    team1: [],
    team2: [],
    maxTeamSize: 1,
    currentMode: 'menu',
    nextPokemonIdToLoad: INITIAL_LOAD_COUNT + 1,
};

function App() {
    const [state, setState] = useState<typeof initialAppState>(initialAppState);
    
    useEffect(() => {
        const loadInitialData = async () => {
            const poks = await fetchPokemonsBatch(1, INITIAL_LOAD_COUNT);
            setState(prev => ({ 
                ...prev, 
                allPokemons: poks,
                nextPokemonIdToLoad: INITIAL_LOAD_COUNT + 1
            }));
        };
        loadInitialData();
    }, []);

    const loadMorePokemons = async () => {
        const newPoks = await fetchPokemonsBatch(state.nextPokemonIdToLoad);
        if (newPoks.length > 0) {
            setState(prev => ({
                ...prev,
                allPokemons: [...prev.allPokemons, ...newPoks],
                nextPokemonIdToLoad: prev.nextPokemonIdToLoad + newPoks.length,
            }));
        }
    };

    const setMode = (maxTeamSize: 1 | 3) => {
        setState(prev => ({
            ...prev,
            maxTeamSize,
            currentMode: 'selection',
            team1: [],
            team2: []
        }));
    };

    const selectFighter = (pokemon: Pokemon) => {
        setState(prev => {
            const isInTeam1 = prev.team1.some(p => p.id === pokemon.id);
            const isInTeam2 = prev.team2.some(p => p.id === pokemon.id);
            
            if (isInTeam1) {
                return {
                    ...prev,
                    team1: prev.team1.filter(p => p.id !== pokemon.id)
                };
            } else if (isInTeam2) {
                return {
                    ...prev,
                    team2: prev.team2.filter(p => p.id !== pokemon.id)
                };
            } else {
                if (prev.team1.length < prev.maxTeamSize) {
                    return {
                        ...prev,
                        team1: [...prev.team1, pokemon]
                    };
                } else if (prev.team2.length < prev.maxTeamSize) {
                    return {
                        ...prev,
                        team2: [...prev.team2, pokemon]
                    };
                }
            }
            return prev;
        });
    };

    const startBattle = () => {
        setState(prev => ({
            ...prev,
            currentMode: 'battle'
        }));
    };

    const renderScreen = () => {
        switch (state.currentMode) {
            case 'menu':
                return <Menu setMode={setMode} />;
            case 'selection':
                return (
                    <Selection 
                        allPokemons={state.allPokemons}
                        team1={state.team1}
                        team2={state.team2}
                        maxSize={state.maxTeamSize}
                        selectFighter={selectFighter}
                        startBattle={startBattle}
                        goToMenu={() => setState({
                            ...initialAppState, 
                            allPokemons: state.allPokemons,
                            currentMode: 'menu'
                        })}
                        loadMorePokemons={loadMorePokemons}
                    />
                );
            case 'battle':
                return (
                    <BattleArena 
                        team1={state.team1}
                        team2={state.team2}
                        maxSize={state.maxTeamSize}
                        goToMenu={() => setState({
                            ...initialAppState,
                            allPokemons: state.allPokemons,
                            currentMode: 'menu'
                        })}
                    />
                );
            default:
                return <Menu setMode={setMode} />;
        }
    };

    return (
        <div className="App">
            {renderScreen()}
        </div>
    );
}

export default App;