import React, { useState } from 'react';
import type { Pokemon } from '../types/Pokemon';
import { useQuickEquipStore } from '../store/quickEquipStore';
import { EQUIPMENT_V2, findEquip } from '../data/equipmentData';
import type { EquipSlotV2 } from '../data/equipmentData';

interface Props {
    pokemon: Pokemon;
    onClose: () => void;
}

const TIER_COLOR: Record<string, string> = {
    C: '#64748b', B: '#22c55e', A: '#f59e0b', S: '#a855f7', SS: '#ef4444',
};

const SLOT_LABELS: Record<EquipSlotV2, string> = {
    weapon: '⚔️ Оружие',
    armor: '🛡️ Броня',
    accessory: '💍 Аксессуар',
};

const QuickEquipPicker: React.FC<Props> = ({ pokemon, onClose }) => {
    const equipRaw = useQuickEquipStore(s => s.loadouts[pokemon.id]);
    const equip = equipRaw ?? {};
    const setSlot = useQuickEquipStore(s => s.setSlot);
    const clear = useQuickEquipStore(s => s.clear);
    const [activeSlot, setActiveSlot] = useState<EquipSlotV2>('weapon');
    const [tierFilter, setTierFilter] = useState<string | null>(null);

    const itemsForSlot = EQUIPMENT_V2
        .filter(e => e.slot === activeSlot && (!tierFilter || e.tier === tierFilter))
        .sort((a, b) => a.cost - b.cost);

    return (
        <div
            onClick={onClose}
            style={{
                position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
                zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: 12, backdropFilter: 'blur(4px)',
            }}
        >
            <div
                onClick={e => e.stopPropagation()}
                style={{
                    background: '#0a0f1e', border: '2px solid #1e293b', borderRadius: 14,
                    padding: 18, maxWidth: 720, width: '100%', maxHeight: '92vh', overflow: 'auto',
                }}
            >
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                    <img src={pokemon.sprites.front_default} alt={pokemon.name}
                        style={{ width: 64, height: 64, imageRendering: 'pixelated' }} />
                    <div style={{ flex: 1 }}>
                        <div style={{ color: '#e2e8f0', fontWeight: 800, fontSize: 18, textTransform: 'uppercase' }}>
                            {pokemon.name}
                        </div>
                        <div style={{ color: '#94a3b8', fontSize: 12 }}>
                            Подбери снаряжение из полного каталога
                        </div>
                    </div>
                    <button onClick={onClose} style={{
                        background: '#7f1d1d', border: 'none', color: '#fff',
                        padding: '6px 14px', borderRadius: 8, cursor: 'pointer', fontWeight: 700,
                    }}>✕ ОК</button>
                </div>

                {/* Slot tabs */}
                <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
                    {(['weapon', 'armor', 'accessory'] as EquipSlotV2[]).map(slot => {
                        const currentId = equip[slot];
                        const currentDef = currentId ? findEquip(currentId) : null;
                        return (
                            <button key={slot} onClick={() => setActiveSlot(slot)} style={{
                                flex: 1, padding: '10px 8px',
                                background: activeSlot === slot ? '#1d4ed8' : '#0f172a',
                                color: activeSlot === slot ? '#fff' : '#94a3b8',
                                border: `2px solid ${activeSlot === slot ? '#1d4ed8' : '#334155'}`,
                                borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: 12,
                            }}>
                                <div>{SLOT_LABELS[slot]}</div>
                                <div style={{ fontSize: 10, color: currentDef ? TIER_COLOR[currentDef.tier] : '#64748b', marginTop: 2 }}>
                                    {currentDef ? `${currentDef.icon} ${currentDef.name}` : '— пусто —'}
                                </div>
                            </button>
                        );
                    })}
                </div>

                {/* Tier filter */}
                <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
                    <button onClick={() => setTierFilter(null)} style={tierBtnStyle(tierFilter === null, '#64748b')}>
                        Все
                    </button>
                    {(['C', 'B', 'A', 'S', 'SS'] as const).map(tier => (
                        <button key={tier} onClick={() => setTierFilter(tier)} style={tierBtnStyle(tierFilter === tier, TIER_COLOR[tier])}>
                            [{tier}]
                        </button>
                    ))}
                    {equip[activeSlot] && (
                        <button
                            onClick={() => setSlot(pokemon.id, activeSlot, undefined)}
                            style={{
                                marginLeft: 'auto', background: '#7f1d1d', border: 'none',
                                color: '#fca5a5', padding: '4px 12px', borderRadius: 6,
                                fontSize: 11, cursor: 'pointer',
                            }}
                        >
                            Снять
                        </button>
                    )}
                    <button onClick={() => clear(pokemon.id)} style={{
                        background: '#1e293b', border: '1px solid #334155',
                        color: '#94a3b8', padding: '4px 12px', borderRadius: 6,
                        fontSize: 11, cursor: 'pointer',
                    }}>
                        Очистить всё
                    </button>
                </div>

                {/* Item list */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 8 }}>
                    {itemsForSlot.map(item => {
                        const equipped = equip[activeSlot] === item.id;
                        return (
                            <button
                                key={item.id}
                                onClick={() => setSlot(pokemon.id, activeSlot, equipped ? undefined : item.id)}
                                style={{
                                    background: equipped ? '#0c4a6e' : '#0f172a',
                                    border: `2px solid ${equipped ? '#0ea5e9' : TIER_COLOR[item.tier] + '88'}`,
                                    borderRadius: 8, padding: '8px 10px', textAlign: 'left',
                                    color: '#e2e8f0', cursor: 'pointer', display: 'flex', gap: 8,
                                    alignItems: 'center', minHeight: 64,
                                }}
                            >
                                <img src={item.sprite} alt={item.name} style={{ width: 28, height: 28, imageRendering: 'pixelated' }} />
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontSize: 11, color: TIER_COLOR[item.tier], fontWeight: 700 }}>
                                        [{item.tier}{item.rare ? ' · РЕДКОЕ' : ''}]
                                    </div>
                                    <div style={{ fontSize: 12, fontWeight: 700 }}>{item.name}</div>
                                    <div style={{ fontSize: 10, color: '#94a3b8', lineHeight: 1.3 }}>{item.desc}</div>
                                </div>
                                {equipped && (
                                    <span style={{ fontSize: 18, color: '#22d3ee' }}>✓</span>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

function tierBtnStyle(active: boolean, color: string): React.CSSProperties {
    return {
        background: active ? color : '#1e293b',
        color: active ? '#000' : '#94a3b8',
        border: `2px solid ${active ? color : '#334155'}`,
        padding: '4px 12px', borderRadius: 6, cursor: 'pointer',
        fontSize: 11, fontWeight: 700,
    };
}

export default QuickEquipPicker;
