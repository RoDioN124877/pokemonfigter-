// src/components/BattleArena.tsx

import React from "react";
import type { Pokemon } from "../types/Pokemon";
import useBattleLogic from "../hooks/useBattleLogic";
import ArenaFighterCard from "./ArenaFighterCard";

interface BattleArenaProps {
  team1: Pokemon[];
  team2: Pokemon[];
  maxSize: 1 | 3;
  goToMenu: () => void;
}

const BattleArena: React.FC<BattleArenaProps> = ({
  team1,
  team2,
  maxSize,
  goToMenu,
}) => {
  const {
    battleState,
    activeSlots, // <-- Теперь должно быть доступно из useBattleLogic
    animations,
    damageQueue,
    startBattle,
    resetBattle,
  } = useBattleLogic(team1, team2, maxSize); // ... остальной код компонента // Рендер команды

  const renderTeam = (teamNum: 1 | 2) => {
    const slots = []; // Генерируем слоты 1..maxSize
    for (let i = 1; i <= maxSize; i++) {
      const key = `p${teamNum}-${i}`;
      const fighter = battleState.fighters[key]; // Если бойца нет (баг?), пропускаем

      if (!fighter) continue;

      // Теперь activeSlots содержит число, что устраняет ошибку сравнения string/number.
      const isActive = activeSlots[`p${teamNum}`] === i;

      slots.push(
        <ArenaFighterCard
          key={key}
          fighter={fighter}
          isActive={isActive}
          teamNum={teamNum}
          animClass={animations[key] || ""}
          damageQueue={damageQueue[key] || []} // <-- damageQueue теперь имеет правильный тип
        />
      );
    }
    return slots;
  };

  // ... остальной код компонента без изменений ...

  return (
    <div className="battle-arena">
      {" "}
      <button
        className="exe"
        onClick={goToMenu}
        style={{ top: "20px", right: "20px" }}
      >
     EXIT {" "}
      </button>
       {/* --- СЦЕНА БОЯ --- */}{" "}
      <div className="battle-scene">
                        {/* Платформы (декор) */}               {" "}
        <div className="platform p1"></div>               {" "}
        <div className="platform p2"></div>               {" "}
        {/* Команда 1 (слева) */}               {" "}
        <div
          style={{
            display: "flex",
            flexDirection: "row-reverse",
            alignItems: "flex-end",
          }}
        >
                              {renderTeam(1)}               {" "}
        </div>
                        {/* Команда 2 (справа) */}               {" "}
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "flex-end",
          }}
        >
                              {renderTeam(2)}               {" "}
        </div>
                       {" "}
        {/* Снаряды (если нужна анимация полета, можно добавить сюда отдельный слой) */}
                   {" "}
      </div>
                  {/* --- ПАНЕЛЬ УПРАВЛЕНИЯ --- */}           {" "}
      <div className="battle-controls">
                       {" "}
        <button
          className="menu-button"
          style={{ fontSize: "1rem", padding: "10px 20px" }}
          disabled={battleState.isBattleActive || battleState.winner !== null}
          onClick={startBattle}
        >
                             {" "}
          {battleState.isBattleActive ? "БОЙ ИДЕТ..." : "НАЧАТЬ БИТВУ"}         
               {" "}
        </button>
                       {" "}
        <div className="battle-log">
                             {" "}
          {battleState.log.map((line, idx) => (
            <div key={idx} style={{ opacity: idx === 0 ? 1 : 0.6 }}>
                                          {line}                       {" "}
            </div>
          ))}
                         {" "}
        </div>
                       {" "}
        {battleState.winner && (
          <div
            style={{
              position: "absolute",
              top: "20%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              background: "rgba(0,0,0,0.8)",
              padding: "20px",
              borderRadius: "10px",
              border: "2px solid gold",
              textAlign: "center",
              zIndex: 999,
            }}
          >
                                   {" "}
            <h1 style={{ color: "gold" }}>
                                         {" "}
              {battleState.winner === 1 ? "PLAYER 1" : "PLAYER 2"} WINS!        
                             {" "}
            </h1>
                                   {" "}
            <button className="menu-button" onClick={resetBattle}>
                                          RESTART                        {" "}
            </button>
                               {" "}
          </div>
        )}
                   {" "}
      </div>
             {" "}
    </div>
  );
};

export default BattleArena;
