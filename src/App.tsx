import { useState, useEffect, useCallback } from 'react';
import type { Pokemon } from './types/Pokemon';
import { usePokemonStore } from './store/pokemonStore';
import Menu from './components/Menu';
import Selection from './components/Selection';
import BattleArena from './components/BattleArena';
import TournamentSelection from './components/TournamentSelection';
import TournamentBracket from './components/TournamentBracket';
import ComparePanel from './components/ComparePanel';
import StoryMode from './components/StoryMode';
import QuizMode from './components/QuizMode';
import PredictMode from './components/PredictMode';
import SurvivalMode from './components/SurvivalMode';
import AchievementsScreen from './components/AchievementsScreen';
import HistoryScreen from './components/HistoryScreen';
import AchievementToast from './components/AchievementToast';
import { useAchievementStore } from './store/achievementStore';
import { useProgressStore } from './store/progressStore';
import { useQuickEquipStore } from './store/quickEquipStore';
import { applyEquipmentToPokemon } from './utils/equipUtils';
import { markGameReady } from './utils/ysdk';

type AppMode =
    | 'menu' | 'selection' | 'battle'
    | 'tournament-select' | 'tournament-bracket'
    | 'story' | 'quiz' | 'predict' | 'achievements' | 'history' | 'survival';

function App() {
    const [mode, setMode] = useState<AppMode>('menu');
    const [maxTeamSize, setMaxTeamSize] = useState<1 | 3>(1);
    const [team1, setTeam1] = useState<Pokemon[]>([]);
    const [team2, setTeam2] = useState<Pokemon[]>([]);
    const [tournamentParticipants, setTournamentParticipants] = useState<Pokemon[]>([]);
    const [compareSlots, setCompareSlots] = useState<[Pokemon | null, Pokemon | null]>([null, null]);

    const { init, getRandomPokemons } = usePokemonStore();

    // Menu renders immediately; pokemon list loads in background — UI is interactive now
    useEffect(() => {
        markGameReady();
        init();
    }, []);

    // ── Achievement bridges from other stores ──
    const favorites = usePokemonStore(s => s.favorites);
    const recordFavoritesCount = useAchievementStore(s => s.recordFavoritesCount);
    useEffect(() => { recordFavoritesCount(favorites.length); }, [favorites.length, recordFavoritesCount]);

    const lastCaughtShiny = useProgressStore(s => s.lastCaughtShiny);
    const recordShinyCaught = useAchievementStore(s => s.recordShinyCaught);
    useEffect(() => {
        if (lastCaughtShiny) recordShinyCaught();
    }, [lastCaughtShiny, recordShinyCaught]);

    const handleRandomTeams = useCallback(async () => {
        const pokemons = await getRandomPokemons(maxTeamSize * 2);
        setTeam1(pokemons.slice(0, maxTeamSize));
        setTeam2(pokemons.slice(maxTeamSize));
    }, [getRandomPokemons, maxTeamSize]);

    const handleSetMode = (size: 1 | 3) => {
        setMaxTeamSize(size);
        setTeam1([]);
        setTeam2([]);
        setMode('selection');
    };

    const selectFighter = (pokemon: Pokemon) => {
        const in1 = team1.some(p => p.id === pokemon.id);
        const in2 = team2.some(p => p.id === pokemon.id);

        if (in1) {
            setTeam1(prev => prev.filter(p => p.id !== pokemon.id));
        } else if (in2) {
            setTeam2(prev => prev.filter(p => p.id !== pokemon.id));
        } else if (team1.length < maxTeamSize) {
            setTeam1(prev => [...prev, pokemon]);
        } else if (team2.length < maxTeamSize) {
            setTeam2(prev => [...prev, pokemon]);
        }
    };

    const handleCompare = useCallback((pokemon: Pokemon) => {
        setCompareSlots(prev => {
            const [s1, s2] = prev;
            if (s1?.id === pokemon.id) return [null, s2];
            if (s2?.id === pokemon.id) return [s1, null];
            if (!s1) return [pokemon, s2];
            if (!s2) return [s1, pokemon];
            return [pokemon, s2];
        });
    }, []);

    const showCompare = compareSlots[0] !== null || compareSlots[1] !== null;
    const goToMenu = () => setMode('menu');

    let content: React.ReactNode;

    if (mode === 'story') {
        content = <StoryMode goToMenu={goToMenu} />;
    } else if (mode === 'quiz') {
        content = <QuizMode goToMenu={goToMenu} />;
    } else if (mode === 'predict') {
        content = <PredictMode goToMenu={goToMenu} />;
    } else if (mode === 'survival') {
        content = <SurvivalMode goToMenu={goToMenu} />;
    } else if (mode === 'achievements') {
        content = <AchievementsScreen goToMenu={goToMenu} />;
    } else if (mode === 'history') {
        content = <HistoryScreen goToMenu={goToMenu} />;
    } else if (mode === 'menu') {
        content = (
            <Menu
                setMode={handleSetMode}
                startTournament={() => setMode('tournament-select')}
                startStory={() => setMode('story')}
                startQuiz={() => setMode('quiz')}
                startPredict={() => setMode('predict')}
                startSurvival={() => setMode('survival')}
                openAchievements={() => setMode('achievements')}
                openHistory={() => setMode('history')}
            />
        );
    } else if (mode === 'tournament-select') {
        content = (
            <TournamentSelection
                onStart={participants => { setTournamentParticipants(participants); setMode('tournament-bracket'); }}
                goToMenu={goToMenu}
            />
        );
    } else if (mode === 'tournament-bracket') {
        content = <TournamentBracket pokemons={tournamentParticipants} goToMenu={goToMenu} />;
    } else if (mode === 'selection') {
        content = (
            <>
                <Selection
                    team1={team1}
                    team2={team2}
                    maxSize={maxTeamSize}
                    selectFighter={selectFighter}
                    startBattle={() => setMode('battle')}
                    goToMenu={goToMenu}
                    onRandomTeams={handleRandomTeams}
                    onCompare={handleCompare}
                    compareSlots={compareSlots}
                />
                {showCompare && (
                    <ComparePanel
                        pokemon1={compareSlots[0]}
                        pokemon2={compareSlots[1]}
                        onClose={() => setCompareSlots([null, null])}
                    />
                )}
            </>
        );
    } else {
        // Quick-mode battle — apply per-pokemon equipment loadouts
        const quickEquip = useQuickEquipStore.getState().loadouts;
        const equipped1 = team1.map(p => applyEquipmentToPokemon(p, quickEquip[p.id] ?? {}));
        const equipped2 = team2.map(p => applyEquipmentToPokemon(p, quickEquip[p.id] ?? {}));
        content = (
            <BattleArena
                team1={equipped1}
                team2={equipped2}
                maxSize={maxTeamSize}
                goToMenu={goToMenu}
            />
        );
    }

    return (
        <>
            {content}
            <AchievementToast />
        </>
    );
}

export default App;
