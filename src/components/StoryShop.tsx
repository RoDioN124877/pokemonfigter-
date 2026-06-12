import React, { useEffect, useState } from 'react';
import { useProgressStore, ITEM_DEFS, BALLS } from '../store/progressStore';
import type { ItemId } from '../store/progressStore';
import { getShopEquipment, findEquip } from '../data/equipmentData';
import { fetchPokemonsByIds } from '../services/ApiService';
import type { Pokemon } from '../types/Pokemon';


const TIER_COLOR: Record<string, string> = { C: '#64748b', B: '#22c55e', A: '#f59e0b', S: '#a855f7', SS: '#ef4444' };
const TIER_BG: Record<string, string> = { C: '#1e293b', B: '#052e16', A: '#451a03', S: '#3b0764', SS: '#450a0a' };

interface Props {
    onBack: () => void;
    currentOpponentIndex: number;
}

const SHOP_POKEMON: Array<{ id: number; price: number }> = [
    { id: 133, price: 2500 }, { id: 25,  price: 2000 }, { id: 147, price: 5000 },
    { id: 131, price: 4000 }, { id: 143, price: 4500 }, { id: 123, price: 2000 },
    { id: 132, price: 3000 }, { id: 39,  price: 1500 }, { id: 129, price: 100  },
    { id: 94,  price: 3500 }, { id: 137, price: 4000 }, { id: 111, price: 1500 },
];

const PixelCard: React.FC<{ children: React.ReactNode; color?: string; style?: React.CSSProperties }> = ({ children, color = '#1e293b', style }) => (
    <div style={{
        border: `3px solid ${color}`, borderRadius: 4, background: '#0a0f1e',
        boxShadow: `4px 4px 0 ${color}`, padding: '10px 12px', ...style,
    }}>
        {children}
    </div>
);

const PixelBtn: React.FC<{ children: React.ReactNode; onClick?: () => void; disabled?: boolean; color?: string; full?: boolean }> = ({ children, onClick, disabled, color = '#1d4ed8', full }) => (
    <button onClick={onClick} disabled={disabled} style={{
        background: disabled ? '#1e293b' : color,
        color: disabled ? '#475569' : '#fff',
        border: `2px solid ${disabled ? '#334155' : '#000'}`,
        boxShadow: disabled ? 'none' : `2px 2px 0 #000`,
        borderRadius: 6, padding: '7px 14px', fontSize: 12,
        cursor: disabled ? 'not-allowed' : 'pointer', fontWeight: 700,
        textTransform: 'uppercase', letterSpacing: 0.5,
        width: full ? '100%' : 'auto',
        transition: 'transform 0.08s',
    }}
    onMouseDown={e => !disabled && (e.currentTarget.style.transform = 'translate(2px,2px)')}
    onMouseUp={e => !disabled && (e.currentTarget.style.transform = '')}
    onMouseLeave={e => !disabled && (e.currentTarget.style.transform = '')}
    >{children}</button>
);

const StoryShop: React.FC<Props> = ({ onBack, currentOpponentIndex }) => {
    const { money, bag, equipBag, ownedPokemon, defeatedCount, heroLevel,
        buyItem, buyEquipment, sellItem, sellEquipment, sellPokemon, addPokemon, spendMoney } = useProgressStore();
    const [shopPokemon, setShopPokemon] = useState<Pokemon[]>([]);
    const [loading, setLoading] = useState(true);
    const [note, setNote] = useState('');
    const [tab, setTab] = useState<'buffs' | 'balls' | 'food' | 'equip' | 'pokemon' | 'sell'>('balls');

    const shopLv = Math.max(5, currentOpponentIndex * 4 + 2);

    useEffect(() => {
        fetchPokemonsByIds(SHOP_POKEMON.map(p => p.id)).then(poks => {
            setShopPokemon(poks);
            setLoading(false);
        });
    }, []);

    const notify = (msg: string) => { setNote(msg); setTimeout(() => setNote(''), 2500); };

    const handleBuyItem = (id: ItemId) => {
        const ok = buyItem(id);
        const def = ITEM_DEFS.find(d => d.id === id);
        notify(ok ? `${def?.icon} «${def?.name}» куплен!` : '❌ Недостаточно денег!');
    };

    const handleBuyEquip = (id: string) => {
        const ok = buyEquipment(id);
        const def = findEquip(id);
        notify(ok ? `${def?.icon} «${def?.name}» куплен!` : '❌ Недостаточно денег!');
    };

    const handleSellItem = (id: ItemId) => {
        const ok = sellItem(id);
        notify(ok ? `💰 Продано (+${Math.floor((ITEM_DEFS.find(d => d.id === id)?.cost ?? 0) * 0.5)}G)` : '❌ Ошибка');
    };

    const handleSellEquip = (id: string) => {
        const def = findEquip(id);
        const ok = sellEquipment(id);
        notify(ok ? `💰 ${def?.name} продано` : '❌ Ошибка');
    };

    const handleSellPokemon = (uuid: string) => {
        const pok = ownedPokemon.find(p => p.uuid === uuid);
        if (!pok) return;
        if (!confirm(`Продать ${pok.data.name} Lv.${pok.level}?`)) return;
        const price = sellPokemon(uuid);
        notify(price > 0 ? `💰 ${pok.data.name} продан за ${price.toLocaleString()}G` : '❌ Нельзя продать (последний в команде)');
    };

    const handleBuyPokemon = (pok: Pokemon, price: number) => {
        if (money < price) { notify('❌ Недостаточно денег!'); return; }
        if (!spendMoney(price)) return;
        addPokemon(pok, shopLv, false);
        notify(`🎉 ${pok.name} (Lv.${shopLv}) добавлен в ПК!`);
    };

    const buffItems = ITEM_DEFS.filter(d => d.category === 'buff');
    const foodItems = ITEM_DEFS.filter(d => d.category === 'food');
    const availableBalls = BALLS.filter(b => defeatedCount >= b.unlockAfterOpp);
    const availableEquipment = getShopEquipment(defeatedCount);

    const TABS = [
        { key: 'balls',   label: '🔴 Шары' },
        { key: 'buffs',   label: '⚡ Усилители' },
        { key: 'food',    label: '🍖 Корм' },
        { key: 'equip',   label: '⚔️ Снаряга' },
        { key: 'pokemon', label: '🐉 Покемоны' },
        { key: 'sell',    label: '💸 Продать' },
    ] as const;

    return (
        <div className="story-screen" style={{ padding: 16, maxWidth: 760, margin: '0 auto' }}>
            <PixelCard color="#fbbf24" style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <PixelBtn onClick={onBack} color="#7f1d1d">← НАЗАД</PixelBtn>
                    <h2 style={{ flex: 1, color: '#fbbf24', fontSize: 22, margin: 0, fontWeight: 800 }}>
                        🛒 Магазин
                    </h2>
                    <div style={{ background: '#000', border: '2px solid #fbbf24', borderRadius: 6, padding: '6px 14px', fontSize: 14, color: '#fbbf24', fontWeight: 700 }}>
                        💰 {money.toLocaleString()}G
                    </div>
                </div>
                <div style={{ marginTop: 8, fontSize: 11, color: '#94a3b8' }}>
                    Hero Lv.{heroLevel} · побед {defeatedCount} · ассортимент обновляется каждую победу.
                </div>
            </PixelCard>

            {note && (
                <div style={{
                    position: 'fixed', top: 16, left: '50%', transform: 'translateX(-50%)',
                    zIndex: 9999, background: '#0f2a18', border: '2px solid #15803d',
                    borderRadius: 8, padding: '10px 20px', boxShadow: '0 4px 20px rgba(0,0,0,0.6)',
                    pointerEvents: 'none',
                }}>
                    <div style={{ color: '#4ade80', fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap' }}>{note}</div>
                </div>
            )}

            {/* Pixel-style tabs */}
            <div style={{ display: 'flex', gap: 4, marginBottom: 12, flexWrap: 'wrap' }}>
                {TABS.map(t => (
                    <button key={t.key} onClick={() => setTab(t.key)} style={{
                        fontSize: 13, padding: '9px 14px',
                        background: tab === t.key ? '#fbbf24' : '#0f172a',
                        color: tab === t.key ? '#000' : '#94a3b8',
                        border: `2px solid ${tab === t.key ? '#fbbf24' : '#334155'}`,
                        borderRadius: 6,
                        cursor: 'pointer', fontWeight: 700, letterSpacing: 0.3,
                        boxShadow: tab === t.key ? '3px 3px 0 #b7950b' : 'none',
                    }}>{t.label}</button>
                ))}
            </div>

            {/* ── BALLS TAB ── */}
            {tab === 'balls' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    {availableBalls.map(b => {
                        const qty = bag.find(i => i.id === b.id)?.qty ?? 0;
                        const ok = money >= b.cost;
                        return (
                            <PixelCard key={b.id} color="#dc2626">
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <span style={{ fontSize: 28 }}>{b.icon}</span>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ color: '#e2e8f0', fontWeight: 700, fontSize: 13 }}>{b.name}</div>
                                        <div style={{ color: '#94a3b8', fontSize: 12, marginTop: 4 }}>{b.desc}</div>
                                        <div style={{ color: '#94a3b8', fontSize: 10 }}>В сумке: ×{qty}</div>
                                    </div>
                                    <PixelBtn disabled={!ok} onClick={() => handleBuyItem(b.id)} color="#dc2626">
                                        {b.cost.toLocaleString()}G
                                    </PixelBtn>
                                </div>
                            </PixelCard>
                        );
                    })}
                    {BALLS.filter(b => defeatedCount < b.unlockAfterOpp).map(b => (
                        <PixelCard key={b.id} color="#334155" style={{ opacity: 0.45 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <span style={{ fontSize: 28, filter: 'grayscale(1)' }}>{b.icon}</span>
                                <div style={{ flex: 1 }}>
                                    <div style={{ color: '#64748b', fontWeight: 700, fontSize: 13 }}>???</div>
                                    <div style={{ color: '#475569', fontSize: 10 }}>🔒 Откроется после {b.unlockAfterOpp} побед</div>
                                </div>
                            </div>
                        </PixelCard>
                    ))}
                </div>
            )}

            {/* ── BUFFS TAB ── */}
            {tab === 'buffs' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    {buffItems.map(def => {
                        const qty = bag.find(i => i.id === def.id)?.qty ?? 0;
                        const ok = money >= def.cost;
                        return (
                            <PixelCard key={def.id} color="#3b82f6">
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <span style={{ fontSize: 26 }}>{def.icon}</span>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ color: '#e2e8f0', fontWeight: 700, fontSize: 11 }}>{def.name}</div>
                                        <div style={{ color: '#64748b', fontSize: 10 }}>{def.desc}</div>
                                        <div style={{ color: '#94a3b8', fontSize: 10 }}>×{qty}</div>
                                    </div>
                                    <PixelBtn disabled={!ok} onClick={() => handleBuyItem(def.id)}>{def.cost.toLocaleString()}G</PixelBtn>
                                </div>
                            </PixelCard>
                        );
                    })}
                </div>
            )}

            {/* ── FOOD TAB ── */}
            {tab === 'food' && (
                <>
                    <div style={{ color: '#94a3b8', fontSize: 11, marginBottom: 10 }}>
                        Корм даёт EXP покемону прямо в инвентаре. Но кормить дешевле, чем биться, больше нельзя — баланс перерасcчитан.
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                        {foodItems.map(def => {
                            const qty = bag.find(i => i.id === def.id)?.qty ?? 0;
                            const ok = money >= def.cost;
                            return (
                                <PixelCard key={def.id} color="#15803d">
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                        <span style={{ fontSize: 26 }}>{def.icon}</span>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ color: '#e2e8f0', fontWeight: 700, fontSize: 11 }}>{def.name}</div>
                                            <div style={{ color: '#64748b', fontSize: 10 }}>{def.desc}</div>
                                            <div style={{ color: '#94a3b8', fontSize: 10 }}>×{qty}</div>
                                        </div>
                                        <PixelBtn disabled={!ok} onClick={() => handleBuyItem(def.id)} color="#15803d">{def.cost.toLocaleString()}G</PixelBtn>
                                    </div>
                                </PixelCard>
                            );
                        })}
                    </div>
                </>
            )}

            {/* ── EQUIPMENT TAB ── */}
            {tab === 'equip' && (
                <>
                    <div style={{ color: '#94a3b8', fontSize: 11, marginBottom: 10 }}>
                        Снаряга появляется по мере прохождения сюжета. Каждые 5 побед старая исчезает — успей купить!
                    </div>
                    {(['weapon', 'armor', 'accessory'] as const).map(slot => {
                        const slotLabel = slot === 'weapon' ? '⚔️ Оружие' : slot === 'armor' ? '🛡️ Броня' : '💍 Аксессуары';
                        const items = availableEquipment.filter(d => d.slot === slot);
                        return (
                            <div key={slot} style={{ marginBottom: 14 }}>
                                <div style={{ color: '#fbbf24', fontSize: 13, fontWeight: 700, marginBottom: 8 }}>{slotLabel}</div>
                                {items.length === 0 ? (
                                    <div style={{ color: '#475569', fontSize: 11, padding: 8 }}>Нет в наличии — победи следующего соперника.</div>
                                ) : (
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                                        {items.map(def => {
                                            const qty = equipBag.find(i => i.id === def.id)?.qty ?? 0;
                                            const ok = money >= def.cost;
                                            return (
                                                <div key={def.id} style={{
                                                    border: `3px solid ${TIER_COLOR[def.tier]}`,
                                                    background: TIER_BG[def.tier],
                                                    boxShadow: `3px 3px 0 ${TIER_COLOR[def.tier]}55`,
                                                    padding: '8px 10px',
                                                    display: 'flex', alignItems: 'center', gap: 8,
                                                }}>
                                                    <span style={{ fontSize: 22 }}>{def.icon}</span>
                                                    <div style={{ flex: 1, minWidth: 0 }}>
                                                        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                                                            <span style={{ color: TIER_COLOR[def.tier], fontSize: 8 }}>[{def.tier}]</span>
                                                            <span style={{ color: '#e2e8f0', fontWeight: 700, fontSize: 11 }}>{def.name}</span>
                                                        </div>
                                                        <div style={{ color: '#94a3b8', fontSize: 10, marginTop: 2 }}>{def.desc}</div>
                                                        <div style={{ color: '#475569', fontSize: 9 }}>×{qty}</div>
                                                    </div>
                                                    <PixelBtn disabled={!ok} onClick={() => handleBuyEquip(def.id)} color="#7c3aed">{def.cost.toLocaleString()}G</PixelBtn>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </>
            )}

            {/* ── POKEMON TAB ── */}
            {tab === 'pokemon' && (
                <div>
                    <div style={{ color: '#94a3b8', fontSize: 11, marginBottom: 10 }}>
                        Покемоны продаются на Lv.{shopLv} и попадают в ПК-Ящик.
                    </div>
                    {loading ? (
                        <div style={{ color: '#64748b', textAlign: 'center', padding: 30 }}>Загрузка...</div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                            {shopPokemon.map(pok => {
                                const entry = SHOP_POKEMON.find(e => e.id === pok.id);
                                const price = entry?.price ?? 9999;
                                const ok = money >= price;
                                return (
                                    <PixelCard key={pok.id} color="#fbbf24">
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                            <img src={pok.sprites.front_default} alt={pok.name}
                                                style={{ width: 48, height: 48, imageRendering: 'pixelated' }} />
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ color: '#e2e8f0', fontWeight: 700, fontSize: 13, textTransform: 'uppercase' }}>
                                                    {pok.name}
                                                </div>
                                                <div style={{ color: '#64748b', fontSize: 10 }}>Lv.{shopLv}</div>
                                            </div>
                                        </div>
                                        <PixelBtn full disabled={!ok} onClick={() => handleBuyPokemon(pok, price)} color="#15803d">
                                            {price.toLocaleString()}G
                                        </PixelBtn>
                                    </PixelCard>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* ── SELL TAB ── */}
            {tab === 'sell' && (
                <div>
                    <div style={{ color: '#94a3b8', fontSize: 11, marginBottom: 14 }}>
                        Продай ненужное за 50% цены. Покемоны рассчитываются по уровню × 80G (шайни ×4).
                    </div>

                    {/* Sell items */}
                    <div style={{ marginBottom: 18 }}>
                        <div style={{ color: '#fbbf24', fontSize: 13, fontWeight: 700, marginBottom: 8 }}>🎒 ПРЕДМЕТЫ</div>
                        {bag.length === 0 ? <div style={{ color: '#475569', fontSize: 11 }}>Сумка пуста</div> :
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                                {bag.map(item => {
                                    const def = ITEM_DEFS.find(d => d.id === item.id);
                                    if (!def) return null;
                                    return (
                                        <PixelCard key={item.id} color="#dc2626">
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <span style={{ fontSize: 22 }}>{def.icon}</span>
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ color: '#e2e8f0', fontWeight: 700, fontSize: 11 }}>{def.name}</div>
                                                    <div style={{ color: '#94a3b8', fontSize: 10 }}>×{item.qty}</div>
                                                </div>
                                                <PixelBtn onClick={() => handleSellItem(item.id)} color="#dc2626">+{Math.floor(def.cost * 0.5)}G</PixelBtn>
                                            </div>
                                        </PixelCard>
                                    );
                                })}
                            </div>
                        }
                    </div>

                    {/* Sell equipment */}
                    <div style={{ marginBottom: 18 }}>
                        <div style={{ color: '#fbbf24', fontSize: 13, fontWeight: 700, marginBottom: 8 }}>⚔️ СНАРЯЖЕНИЕ</div>
                        {equipBag.length === 0 ? <div style={{ color: '#475569', fontSize: 11 }}>Сундук пуст</div> :
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                                {equipBag.map(item => {
                                    const def = findEquip(item.id);
                                    if (!def) return null;
                                    const price = Math.floor(def.cost * 0.5);
                                    return (
                                        <div key={item.id} style={{
                                            border: `2px solid ${TIER_COLOR[def.tier]}`,
                                            padding: '8px 10px', background: '#0a0f1e',
                                            display: 'flex', alignItems: 'center', gap: 8,
                                        }}>
                                            <span style={{ fontSize: 22 }}>{def.icon}</span>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ color: '#e2e8f0', fontSize: 11, fontWeight: 700 }}>{def.name}</div>
                                                <div style={{ color: '#94a3b8', fontSize: 10 }}>×{item.qty}</div>
                                            </div>
                                            <PixelBtn onClick={() => handleSellEquip(item.id)} color="#dc2626">+{price}G</PixelBtn>
                                        </div>
                                    );
                                })}
                            </div>
                        }
                    </div>

                    {/* Sell pokemon */}
                    <div>
                        <div style={{ color: '#fbbf24', fontSize: 13, fontWeight: 700, marginBottom: 8 }}>🐉 ПОКЕМОНЫ (не в команде)</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            {ownedPokemon.filter(p => !p.inTeam).map(p => {
                                const price = p.level * 80 + 200 + (p.isShiny ? (p.level * 80 + 200) * 3 : 0);
                                return (
                                    <div key={p.uuid} style={{
                                        border: '2px solid #334155', padding: '8px 10px', background: '#0a0f1e',
                                        display: 'flex', alignItems: 'center', gap: 8,
                                    }}>
                                        <img src={p.data.sprites.front_default} alt={p.data.name}
                                            style={{
                                                width: 40, height: 40, imageRendering: 'pixelated',
                                                filter: p.isShiny ? 'hue-rotate(200deg) saturate(2) brightness(1.2)' : undefined,
                                            }} />
                                        <div style={{ flex: 1 }}>
                                            <div style={{ color: '#e2e8f0', fontWeight: 700, fontSize: 11, textTransform: 'uppercase' }}>
                                                {p.isShiny && '✨ '}{p.data.name}
                                            </div>
                                            <div style={{ color: '#94a3b8', fontSize: 10 }}>Lv.{p.level}</div>
                                        </div>
                                        <PixelBtn onClick={() => handleSellPokemon(p.uuid)} color="#dc2626">+{price.toLocaleString()}G</PixelBtn>
                                    </div>
                                );
                            })}
                            {ownedPokemon.filter(p => !p.inTeam).length === 0 && (
                                <div style={{ color: '#475569', fontSize: 11 }}>Нет покемонов в ПК-ящике</div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StoryShop;
