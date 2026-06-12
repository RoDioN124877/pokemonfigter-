import React, { useMemo, useState } from 'react';
import { useProgressStore } from '../store/progressStore';
import { pickMerchantOffers } from '../data/equipmentData';

interface Props {
    onLeave: () => void;
}

const TIER_COLOR: Record<string, string> = { C: '#64748b', B: '#22c55e', A: '#f59e0b', S: '#a855f7', SS: '#ef4444' };

const StrangeMerchant: React.FC<Props> = ({ onLeave }) => {
    const { money, buyEquipment } = useProgressStore();
    // Seed once on mount so offers are stable for this encounter
    const offers = useMemo(() => pickMerchantOffers(Math.floor(Math.random() * 1_000_000)), []);
    const [note, setNote] = useState('');
    const [purchased, setPurchased] = useState<Set<string>>(new Set());

    const notify = (msg: string) => { setNote(msg); setTimeout(() => setNote(''), 2500); };

    const handleBuy = (id: string) => {
        if (buyEquipment(id)) {
            setPurchased(s => new Set([...s, id]));
            notify('✨ Куплено! Найдешь в инвентаре.');
        } else {
            notify('❌ Не хватает денег');
        }
    };

    return (
        <div className="story-screen" style={{ padding: 24, maxWidth: 600, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 16 }}>
                <div style={{ fontSize: 56, marginBottom: 4 }}>🧙‍♂️</div>
                <h2 style={{ color: '#fbbf24', fontFamily: 'var(--font-pixel)', fontSize: '0.85rem', lineHeight: 1.6, margin: 0 }}>
                    СТРАННЫЙ ТОРГОВЕЦ
                </h2>
                <p style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: 12, marginTop: 8 }}>
                    "А-а, путник... Видишь эту коллекцию? Каждая вещь — единственная в мире. Решайся быстро, я ухожу с закатом."
                </p>
                <div style={{ background: '#1e293b', borderRadius: 20, padding: '4px 14px', color: '#fbbf24', fontWeight: 700, fontSize: 12, display: 'inline-block', marginTop: 8 }}>
                    💰 {money.toLocaleString()}G
                </div>
            </div>

            {note && (
                <div style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 8, padding: '8px 14px', color: '#e2e8f0', marginBottom: 12, fontSize: 12, textAlign: 'center' }}>{note}</div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {offers.map(o => {
                    const owned = purchased.has(o.id);
                    const canBuy = money >= o.cost && !owned;
                    return (
                        <div key={o.id} style={{
                            border: `2px solid ${TIER_COLOR[o.tier]}88`,
                            borderRadius: 12, padding: '12px 14px', background: '#0a0f1e',
                            display: 'flex', alignItems: 'center', gap: 12,
                            opacity: owned ? 0.55 : 1,
                        }}>
                            <span style={{ fontSize: 32 }}>{o.icon}</span>
                            <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 3 }}>
                                    <span style={{ color: TIER_COLOR[o.tier], fontWeight: 700, fontSize: 10 }}>[{o.tier} · РЕДКОЕ]</span>
                                    <span style={{ color: '#e2e8f0', fontWeight: 800, fontSize: 13 }}>{o.name}</span>
                                </div>
                                <div style={{ color: '#94a3b8', fontSize: 11, lineHeight: 1.4 }}>{o.desc}</div>
                            </div>
                            <button onClick={() => handleBuy(o.id)} disabled={!canBuy} style={{
                                background: canBuy ? '#7c3aed' : owned ? '#15803d' : '#1e293b',
                                border: 'none', borderRadius: 8, padding: '8px 14px',
                                color: canBuy ? '#fff' : owned ? '#86efac' : '#475569',
                                fontWeight: 700, fontSize: 12, cursor: canBuy ? 'pointer' : 'default',
                                whiteSpace: 'nowrap',
                            }}>
                                {owned ? '✓ Куплено' : `${o.cost.toLocaleString()}G`}
                            </button>
                        </div>
                    );
                })}
            </div>

            <div style={{ textAlign: 'center', marginTop: 20 }}>
                <button className="menu-button" onClick={onLeave}>🚶 Уйти</button>
            </div>
        </div>
    );
};

export default StrangeMerchant;
