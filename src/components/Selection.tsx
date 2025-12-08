// src/components/Selection.tsx

import React, { useState } from "react";
import type { Pokemon } from "../types/Pokemon";
import PokemonCard from "./PokemonCard";

interface SelectionProps {
  allPokemons: Pokemon[];
  team1: Pokemon[];
  team2: Pokemon[];
  maxSize: 1 | 3;
  selectFighter: (pokemon: Pokemon) => void;
  startBattle: () => void;
  goToMenu: () => void;
  loadMorePokemons: () => Promise<void>;
}

// 💡 Вынесенный компонент SelectionBar
// Обратите внимание: ему теперь нужно передавать selectFighter и maxSize
const SelectionBar: React.FC<{
  team: Pokemon[];
  teamNum: 1 | 2;
  selectFighter: (pokemon: Pokemon) => void;
  maxSize: 1 | 3;
}> = ({ team, teamNum, selectFighter, maxSize }) => (
  <div className="selection-bar-team">
           {" "}
    <h3 style={{ color: teamNum === 1 ? "gold" : "silver" }}>
                  Команда {teamNum} ({team.length}/{maxSize}):        {" "}
    </h3>
           {" "}
    <div className="team-bar-slots">
                 {" "}
      {team.map((pok) => (
        <div
          key={pok.id}
          className="selected-pok-slot"
          title={`Кликните, чтобы убрать ${pok.name}`}
          style={{
            backgroundImage: `url(${pok.sprites.front_default})`,
            borderColor: teamNum === 1 ? "gold" : "silver",
          }}
          onClick={() => selectFighter(pok)} // Клик для удаления
        >
                              <span className="remove-slot-btn">X</span>       
                 {" "}
        </div>
      ))}
             {" "}
    </div>
       {" "}
  </div>
);

const Selection: React.FC<SelectionProps> = (props) => {
  const {
    allPokemons,
    team1,
    team2,
    maxSize,
    selectFighter,
    startBattle,
    goToMenu,
    loadMorePokemons,
  } = props;
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoadDisabled, setIsLoadDisabled] = useState(false);
  const isReady = team1.length === maxSize && team2.length === maxSize;

  const filteredPokemons = allPokemons.filter((pok) => {
    if (!searchTerm) return true;
    const lowerCaseTerm = searchTerm.toLowerCase();
    const nameMatch = pok.name.toLowerCase().includes(lowerCaseTerm); // ПОИСК ПО СПОСОБНОСТИ
    const abilityMatch = pok.abilities.some((a) =>
      a.ability.name.toLowerCase().includes(lowerCaseTerm)
    );
    return nameMatch || abilityMatch;
  });

  const handleLoadMore = async () => {
    setIsLoadDisabled(true);
    await loadMorePokemons();
    setIsLoadDisabled(false);
  }; // УДАЛЕНА ВНУТРЕННЯЯ ДЕКЛАРАЦИЯ SelectionBar

  return (
    <div className="selection-screen">
                 {" "}
      <button className="exe" onClick={goToMenu}>
        X
      </button>
                              {/* Selection Bar (Закреплен сверху) */}         
       {" "}
      <div className="selection-bar-fixed">
                        {/* 💡 Передаем selectFighter и maxSize */}             
         {" "}
        <SelectionBar
          team={team1}
          teamNum={1}
          selectFighter={selectFighter}
          maxSize={maxSize}
        />
                                        {/* КНОПКА FIGHT! ПЕРЕМЕЩЕНА НАВЕРХ */} 
                     {" "}
        <button
          className="menu-button start-battle-btn"
          onClick={startBattle}
          disabled={!isReady}
        >
                              FIGHT!                {" "}
        </button>
                                       {" "}
        {/* 💡 Передаем selectFighter и maxSize */}               {" "}
        <SelectionBar
          team={team2}
          teamNum={2}
          selectFighter={selectFighter}
          maxSize={maxSize}
        />
                   {" "}
      </div>
                  {/* Controls and Search */}           {" "}
      <div className="controls">
                       {" "}
        <input
          type="text"
          placeholder="Поиск по Имени или Способности..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="searchInput"
        />
                   {" "}
      </div>
                              {/* Pokemon Grid */}           {" "}
      <div className="pokemon-grid">
                       {" "}
        {filteredPokemons.map((pok) => {
          const isSelected =
            team1.some((p) => p.id === pok.id) ||
            team2.some((p) => p.id === pok.id);
          return (
            <PokemonCard
              key={pok.id}
              pokemon={pok}
              isSelected={isSelected}
              onClick={selectFighter}
            />
          );
        })}
                   {" "}
      </div>
                              {/* Load More Button */}           {" "}
      <button
        className="menu-button load-more-btn"
        onClick={handleLoadMore}
        disabled={isLoadDisabled}
      >
                       {" "}
        {isLoadDisabled
          ? "Загрузка..."
          : `Загрузить еще (${allPokemons.length} покемонов)`}
                   {" "}
      </button>
             {" "}
    </div>
  );
};

export default Selection;
