import React from "react";
import type { Pokemon } from "../types/Pokemon";
import useBattleLogic from "../hooks/useBattleLogic";
import ArenaFighterCard from "./ArenaFighterCard";
import TurnQueueDisplay from "./TurnQueueDisplay"; // Импорт добавлен

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
    activeSlots,
    turnQueueVisual, // Достаем визуальную очередь
    animations,
    damageQueue,
    startBattle,
    resetBattle,
  } = useBattleLogic(team1, team2, maxSize);

  const renderTeam = (teamNum: 1 | 2) => {
    const slots = [];
    for (let i = 1; i <= maxSize; i++) {
      const key = `p${teamNum}-${i}`;
      const fighter = battleState.fighters[key];

      if (!fighter) continue;

      // Получаем number из activeSlots
      const currentActiveIndex = teamNum === 1 ? activeSlots.p1 : activeSlots.p2;
      const isActive = currentActiveIndex === i;

      slots.push(
        <ArenaFighterCard
          key={key}
          fighter={fighter}
          isActive={isActive}
          teamNum={teamNum}
          animClass={animations[key] || ""}
          damageQueue={damageQueue[key] || []}
        />
      );
    }
    return slots;
  };

  return (
    <div className="battle-arena">
      
      {/* --- ВЕРХНЯЯ ЧАСТЬ: Очередь ходов --- */}
      <div style={{ position: 'absolute', top: 20, left: 20, zIndex: 100 }}>
         <TurnQueueDisplay queue={turnQueueVisual} />
      </div>

      <button
        className="exe"
        onClick={goToMenu}
        style={{ position: 'absolute', top: "20px", right: "20px", zIndex: 101 }}
      >
        EXIT
      </button>

      {/* --- СЦЕНА БОЯ --- */}
      <div className="battle-scene">
        {/* Платформы */}
        <div className="platform p1"></div>
        <div className="platform p2"></div>

        {/* Команда 1 */}
        <div
          style={{
            display: "flex",
            flexDirection: "row-reverse",
            alignItems: "flex-end",
          }}
        >
          {renderTeam(1)}
        </div>

        {/* Команда 2 */}
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "flex-end",
          }}
        >
          {renderTeam(2)}
        </div>
      </div>
      
      {/* --- ПАНЕЛЬ УПРАВЛЕНИЯ --- */}
      <div className="battle-controls">
        <button
          className="menu-button"
          style={{ fontSize: "1rem", padding: "10px 20px" }}
          disabled={battleState.isBattleActive || battleState.winner !== null}
          onClick={startBattle}
        >
          {battleState.isBattleActive ? "БОЙ ИДЕТ..." : "НАЧАТЬ БИТВУ"}
        </button>
        
        <div className="battle-log">
          {battleState.log.map((line, idx) => (
            <div key={idx} style={{ opacity: idx === 0 ? 1 : 0.6 }}>
              {line}
            </div>
          ))}
        </div>

        {battleState.winner && (
          <div
            style={{
              position: "absolute",
              top: "40%", // Чуть опустил
              left: "50%",
              transform: "translate(-50%, -50%)",
              background: "rgba(0,0,0,0.9)",
              padding: "30px",
              borderRadius: "10px",
              border: "3px solid gold",
              textAlign: "center",
              zIndex: 999,
            }}
          >
            <h1 style={{ color: "gold", marginBottom: '20px' }}>
              {battleState.winner === 1 ? "PLAYER 1" : "PLAYER 2"} WINS!
            </h1>
            <button className="menu-button" onClick={resetBattle}>
               RESTART
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default BattleArena;