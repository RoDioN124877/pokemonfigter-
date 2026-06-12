import React from "react";
import type { BattleFighter, DamageType } from "../types/Pokemon";
import { getAbilityInfo, ABILITY_INFO } from "../utils/battleUtils";
import StatusOverlay from "./StatusOverlay";

interface Props {
    fighter: BattleFighter;
    isActive: boolean;
    teamNum: 1 | 2;
    animClass: string;
    damageQueue: { amount: number; type: DamageType; isCrit?: boolean; timestamp: number }[];
}

const STATUS_ICONS: Record<string, string> = {
    burn: '🔥', poison: '☠️', paralysis: '⚡', confusion: '😵',
    slow: '❄️', freeze: '🧊', sleep: '💤', drenched: '💧', bleed: '🩸',
};

const ArenaFighterCard: React.FC<Props> = ({ fighter, isActive, teamNum, animClass, damageQueue }) => {
    const { currentHP, initialHP, name, imageFront, imageBack, status, abilityNames } = fighter;
    const isFainted = currentHP <= 0;
    const hpPct = Math.max(0, (currentHP / initialHP) * 100);
    const hpColor = hpPct < 25 ? '#e74c3c' : hpPct < 55 ? '#f39c12' : '#2ecc71';

    const activeStatuses = Object.entries(status)
        .filter(([, v]) => v)
        .map(([k]) => STATUS_ICONS[k] || k);

    // Show top 1 known ability
    const topAbility = abilityNames.find(n => n in ABILITY_INFO);
    const abilityInfo = topAbility ? getAbilityInfo(topAbility) : null;

    let wrapperClass = `fighter-wrapper ${animClass}`;
    if (isActive) wrapperClass += ' active';
    else wrapperClass += ' benched';
    if (isFainted) wrapperClass += ' fainted';

    return (
        <div className={wrapperClass}>
            {/* HUD */}
            <div className="battle-hud" style={{ opacity: isFainted ? 0 : 1 }}>
                <div className="battle-hud-name">{name}</div>
                {abilityInfo && isActive && (
                    <div className="arena-ability-badge">{abilityInfo.icon} {topAbility!.replace(/-/g, ' ')}</div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <div className="hp-bar-container" style={{ flex: 1 }}>
                        <div className="hp-bar" style={{ width: `${hpPct}%`, background: hpColor }} />
                    </div>
                    <span style={{ fontSize: '0.45rem', color: hpColor, minWidth: 28 }}>
                        {Math.ceil(currentHP)}/{initialHP}
                    </span>
                </div>
                {activeStatuses.length > 0 && (
                    <div className="status-icons">{activeStatuses.join(' ')}</div>
                )}
            </div>

            {/* Sprite + status particles */}
            <div className="fighter-sprite-wrap">
                <img
                    src={teamNum === 1 ? imageBack : imageFront}
                    className="fighter-img"
                    alt={name}
                />
                {isActive && !isFainted && (
                    <StatusOverlay statuses={status} teamNum={teamNum} />
                )}
            </div>

            {/* Floating damage numbers */}
            {damageQueue.map((d, i) => (
                <div
                    key={`${d.timestamp}-${i}`}
                    className={`damage-number ${d.type}${d.isCrit ? ' crit' : ''}`}
                >
                    {d.type === 'heal' ? '+' : '-'}{d.amount}
                    {d.isCrit && ' 💥'}
                </div>
            ))}
        </div>
    );
};

export default ArenaFighterCard;
