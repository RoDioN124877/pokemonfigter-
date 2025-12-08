// 💡 Вам нужно добавить 'heal' (и, возможно, 'critical', 'dot') в union-тип DamageType
// в файле src/types/Pokemon.ts, например:
// export type DamageType = 'normal' | 'critical' | 'dot' | 'heal';

import React from "react";
import type { BattleFighter, DamageType } from "../types/Pokemon";

interface Props {
  fighter: BattleFighter;
  isActive: boolean;
  teamNum: 1 | 2;
  animClass: string; // Проверьте, что в types/Pokemon.ts есть timestamp и isCrit
  damageQueue: {
    amount: number;
    type: DamageType;
    isCrit?: boolean;
    timestamp: number;
  }[];
}

const ArenaFighterCard: React.FC<Props> = ({
  fighter,
  isActive,
  teamNum,
  animClass,
  damageQueue,
}) => {
  const { currentHP, initialHP, name, imageFront, imageBack } = fighter;
  const isFainted = currentHP <= 0;
  const hpPct = Math.max(0, (currentHP / initialHP) * 100);

  let wrapperClass = `fighter-wrapper ${animClass}`;
  if (isActive) wrapperClass += " active";
  else wrapperClass += " benched";
  if (isFainted) wrapperClass += " fainted";

  const hpColor = hpPct < 30 ? "#e74c3c" : hpPct < 60 ? "#f1c40f" : "#2ecc71";
  return (
    <div className={wrapperClass}>
      {/* UI (ХП и Имя) скрываем если мертв */}{" "}
      <div className="battle-hud" style={{ opacity: isFainted ? 0 : 1 }}>
        {" "}
        <div style={{ fontSize: "0.8rem", fontWeight: "bold" }}>
          {name}
        </div>{" "}
        <div className="hp-bar-container">
          {" "}
          <div
            className="hp-bar"
            style={{ width: `${hpPct}%`, background: hpColor }}
          />{" "}
        </div>{" "}
      </div>
      {/* Картинка */}{" "}
      <img
        src={teamNum === 1 ? imageBack : imageFront}
        className="fighter-img"
        alt={name}
      />
      {/* Вылетающие цифры */}{" "}
      {damageQueue.map(
        (
          d // Это сравнение теперь работает, если 'heal' добавлен в DamageType
        ) => (
          <div
            key={d.timestamp}
            className={`damage-number ${d.type} ${d.isCrit ? "crit" : ""}`}
          >
            {d.type === "heal" ? "+" : "-"}
            {d.amount} {d.isCrit && "💥"}{" "}
          </div>
        )
      )}{" "}
    </div>
  );
};

export default ArenaFighterCard;
