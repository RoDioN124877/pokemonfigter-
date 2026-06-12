import React, { useEffect, useState } from 'react';
import { useAchievementStore, getAchievementDef } from '../store/achievementStore';
import { RARITY_LABELS } from '../data/achievements';
import SFX from '../utils/soundUtils';

// Global toast that pops whenever any achievement unlocks.
// Mounted once in App so it works in every mode.
const AchievementToast: React.FC = () => {
    const toastQueue = useAchievementStore(s => s.toastQueue);
    const popToast = useAchievementStore(s => s.popToast);
    const [leaving, setLeaving] = useState(false);

    const currentId = toastQueue[0];
    const def = currentId ? getAchievementDef(currentId) : undefined;

    useEffect(() => {
        if (!currentId) return;
        setLeaving(false);
        SFX.heal();
        const hideTimer = setTimeout(() => setLeaving(true), 3200);
        const popTimer = setTimeout(() => popToast(), 3600);
        return () => { clearTimeout(hideTimer); clearTimeout(popTimer); };
    }, [currentId, popToast]);

    if (!def) return null;
    const rarity = RARITY_LABELS[def.rarity];

    return (
        <div className={`ach-toast rarity-${def.rarity} ${leaving ? 'leaving' : ''}`}>
            <div className="ach-toast-icon">{def.icon}</div>
            <div className="ach-toast-body">
                <div className="ach-toast-title">🏆 Достижение получено!</div>
                <div className="ach-toast-name">{def.name}</div>
                <div className="ach-toast-desc">{def.desc}</div>
            </div>
            <div className="ach-toast-rarity" style={{ color: rarity.color }}>{rarity.label}</div>
        </div>
    );
};

export default AchievementToast;
