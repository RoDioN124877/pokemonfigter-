import React, { useState } from 'react';
import { useProgressStore, ITEM_DEFS, EQUIP_DEFS } from '../store/progressStore';
import type { OwnedPokemon, EquipSlot } from '../store/progressStore';
import { useDayStore, TRAINING_DAYS, TRAINING_XP_PER_LEVEL } from '../store/dayStore';
import { EVOLUTION_MAP } from '../data/evolutionData';
import { fetchPokemonsByIds } from '../services/ApiService';
import { expToNextLevel, calcHPAtLevel } from '../utils/progressUtils';
import PokemonStatMini from './PokemonStatMini';
import EquipIcon from './EquipIcon';

interface Props { onBack: () => void }

const TIER_COLOR: Record<string, string> = { C: '#64748b', B: '#22c55e', A: '#f59e0b', S: '#a855f7' };
const SLOT_LABELS: Record<EquipSlot, string> = { weapon: '⚔️ Оружие', armor: '🛡️ Броня', accessory: '💍 Аксессуар' };

// ── Pokemon card with inline actions ─────────────────────────────
const PokemonCard: React.FC<{
    pok: OwnedPokemon;
    team: OwnedPokemon[];
    note: string;
    setNote: (m: string) => void;
    evolvingUuid: string | null;
    setEvolvingUuid: (id: string | null) => void;
    evolvedUuids: Set<string>;
    setEvolvedUuids: (fn: (s: Set<string>) => Set<string>) => void;
}> = ({ pok, team, note: _note, setNote, evolvingUuid, setEvolvingUuid, evolvedUuids, setEvolvedUuids }) => {
    const store = useProgressStore();
    const { bag, equipBag, addToTeam, removeFromTeam, swapTeamPC,
        useFoodOnPokemon, evolvePokemon, equipItem, unequipItem } = store;

    const [panel, setPanel] = useState<'stats' | 'feed' | 'equip' | null>(null);
    const [swapTarget, setSwapTarget] = useState('');

    const notify = (msg: string) => { setNote(msg); };
    const isTeam = pok.inTeam;
    const expNeeded = expToNextLevel(pok.level);
    const expPct = Math.min(100, Math.round(pok.exp / expNeeded * 100));
    const evo = EVOLUTION_MAP[pok.data.id];
    const canEvolve = evo && pok.level >= evo.minLevel;
    const evolved = evolvedUuids.has(pok.uuid);

    const foodItems = ITEM_DEFS.filter(d => d.category === 'food');
    const myEquip = pok.equipment;

    const handleFeed = (itemId: string) => {
        const lus = useFoodOnPokemon(pok.uuid, itemId as Parameters<typeof useFoodOnPokemon>[1]);
        const def = ITEM_DEFS.find(d => d.id === itemId);
        notify(lus.length > 0
            ? `${def?.icon} ${lus.map(l => `${l.pokemonName} → Lv.${l.newLevel}!`).join(' ')}`
            : `${def?.icon} +${def?.xpGain} EXP → ${pok.data.name}`
        );
    };

    const handleEvolve = async () => {
        if (!evo) return;
        setEvolvingUuid(pok.uuid);
        try {
            const poks = await fetchPokemonsByIds([evo.intoId]);
            if (poks[0]) {
                evolvePokemon(pok.uuid, poks[0]);
                setEvolvedUuids(s => new Set([...s, pok.uuid]));
                notify(`🎉 ${pok.data.name} → ${poks[0].name}!`);
            }
        } catch { notify('❌ Ошибка загрузки эволюции.'); }
        finally { setEvolvingUuid(null); }
    };

    const handleEquip = (equipId: string) => {
        const ok = equipItem(pok.uuid, equipId as Parameters<typeof equipItem>[1]);
        const def = EQUIP_DEFS.find(d => d.id === equipId);
        notify(ok ? `${def?.icon} ${def?.name} надет на ${pok.data.name}!` : '❌ Предмет не найден.');
    };

    const handleUnequip = (slot: EquipSlot) => {
        unequipItem(pok.uuid, slot);
        notify(`Снаряжение снято.`);
    };

    const hp = calcHPAtLevel(pok.data.statsMap.hp, pok.level);

    return (
        <div style={{
            border: `2px solid ${evolved ? '#fbbf24' : canEvolve ? '#a78bfa' : isTeam ? '#3b4f7a' : '#1e293b'}`,
            borderRadius: 14, background: '#0a1628', overflow: 'hidden',
            transition: 'border-color 0.3s',
        }}>
            {/* Main row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px' }}>
                {/* Team badge */}
                <div style={{
                    width: 6, alignSelf: 'stretch', borderRadius: 3,
                    background: isTeam ? '#4f46e5' : '#1e293b', flexShrink: 0,
                }} />

                <img src={pok.data.sprites.front_default} alt={pok.data.name}
                    style={{ width: 56, height: 56, imageRendering: 'pixelated', flexShrink: 0 }} />

                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        <span style={{ color: '#e2e8f0', fontWeight: 800, fontSize: 13, textTransform: 'uppercase' }}>
                            {pok.data.name}
                        </span>
                        <span style={{
                            background: isTeam ? '#1e3a8a' : '#1e293b',
                            color: isTeam ? '#93c5fd' : '#475569',
                            fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 4,
                        }}>{isTeam ? '⚔️ КОМАНДА' : '💾 ПК'}</span>
                        {canEvolve && !evolved && (
                            <span style={{ background: '#3b0764', color: '#d8b4fe', fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 4 }}>
                                ✨ ЭВОЛЮЦИЯ
                            </span>
                        )}
                    </div>
                    <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap', margin: '2px 0' }}>
                        {pok.data.types.map(t => (
                            <span key={t.type.name} className={`type-badge type-${t.type.name}`} style={{ fontSize: 9 }}>{t.type.name}</span>
                        ))}
                    </div>
                    <div style={{ color: '#64748b', fontSize: 10 }}>
                        Lv.{pok.level} · {hp} HP
                        {evo && !evolved && (
                            <span style={{ color: pok.level >= evo.minLevel ? '#a78bfa' : '#475569', marginLeft: 4 }}>
                                · Эво Lv.{evo.minLevel} → {evo.intoName}
                            </span>
                        )}
                    </div>
                    {/* EXP bar */}
                    <div style={{ background: '#1e293b', borderRadius: 2, height: 4, marginTop: 3, overflow: 'hidden' }}>
                        <div style={{ width: `${expPct}%`, height: '100%', background: '#a78bfa', transition: 'width 0.4s' }} />
                    </div>
                    <div style={{ color: '#334155', fontSize: 9, marginTop: 1 }}>{pok.exp}/{expNeeded} EXP</div>
                </div>

                {/* Equipment icons */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flexShrink: 0 }}>
                    {(['weapon', 'armor', 'accessory'] as EquipSlot[]).map(slot => {
                        const id = myEquip[slot];
                        const def = id ? EQUIP_DEFS.find(d => d.id === id) : null;
                        return (
                            <div key={slot} title={def ? def.name : SLOT_LABELS[slot]} style={{
                                width: 24, height: 24, borderRadius: 4,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                background: def ? '#1e293b' : '#0f172a',
                                border: `1px solid ${def ? TIER_COLOR[def.tier] : '#1e293b'}`,
                            }}>
                                {def ? <EquipIcon id={def.id} size={18} /> : <span style={{ color: '#334155', fontSize: 10 }}>·</span>}
                            </div>
                        );
                    })}
                </div>

                {/* Action buttons */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flexShrink: 0 }}>
                    <button onClick={() => setPanel(panel === 'stats' ? null : 'stats')} style={panelBtnStyle(panel === 'stats', '#1e3a5f')}>📊 Статы</button>
                    <button onClick={() => setPanel(panel === 'feed' ? null : 'feed')} style={panelBtnStyle(panel === 'feed', '#15803d')}>🍖 Корм</button>
                    <button onClick={() => setPanel(panel === 'equip' ? null : 'equip')} style={panelBtnStyle(panel === 'equip', '#7c3aed')}>🗡️ Экип.</button>
                    {/* Quick team toggle */}
                    {isTeam ? (
                        <button
                            onClick={() => { if (team.length > 1) { removeFromTeam(pok.uuid); notify(`${pok.data.name} отправлен в ПК-Ящик`); } else notify('❌ В отряде должен остаться хотя бы один!'); }}
                            style={panelBtnStyle(true, '#7f1d1d')}
                            title="Убрать из отряда"
                        >📤 В ПК</button>
                    ) : (
                        <button
                            onClick={() => { const ok = addToTeam(pok.uuid); notify(ok ? `${pok.data.name} теперь в отряде!` : '❌ Отряд заполнен (3/3) — сначала убери кого-то'); }}
                            style={panelBtnStyle(true, team.length < 3 ? '#1d4ed8' : '#1e293b')}
                            title="Добавить в отряд"
                        >📥 В отряд</button>
                    )}
                </div>
            </div>

            {/* ── Inline panel ── */}
            {panel && (
                <div style={{ borderTop: '1px solid #1e293b', padding: '12px 14px', background: '#060d1a' }}>

                    {/* STATS */}
                    {panel === 'stats' && (
                        <div>
                            <PokemonStatMini pokemon={pok.data} level={pok.level} />
                            {!isTeam && team.length > 0 && (
                                <div style={{ marginTop: 8, background: '#0a0f1e', borderRadius: 6, padding: '6px 10px' }}>
                                    <div style={{ color: '#475569', fontSize: 10, marginBottom: 4 }}>📊 Сравнение с отрядом:</div>
                                    {team.map(t => {
                                        const tAtk = t.data.statsMap.attack * t.level;
                                        const pAtk = pok.data.statsMap.attack * pok.level;
                                        const diff = pAtk - tAtk;
                                        return (
                                            <div key={t.uuid} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, color: '#94a3b8' }}>
                                                <span style={{ textTransform: 'uppercase' }}>{t.data.name}</span>
                                                <span style={{ color: diff > 0 ? '#4ade80' : diff < 0 ? '#f87171' : '#64748b' }}>
                                                    АТК {diff > 0 ? '+' : ''}{diff} · ОЗ {pok.data.statsMap.hp - t.data.statsMap.hp > 0 ? '+' : ''}{pok.data.statsMap.hp - t.data.statsMap.hp}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                            {canEvolve && !evolved && (
                                <div style={{ marginTop: 10, background: 'rgba(167,139,250,0.1)', border: '1px solid #7c3aed', borderRadius: 8, padding: '8px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ color: '#c4b5fd', fontSize: 12 }}>
                                        ✨ → <strong style={{ textTransform: 'capitalize' }}>{evo.intoName}</strong> (Lv.{evo.minLevel})
                                    </span>
                                    <button onClick={handleEvolve} disabled={!!evolvingUuid} style={{
                                        background: '#7c3aed', border: 'none', borderRadius: 6, color: '#fff', padding: '4px 12px', fontSize: 12, cursor: 'pointer', fontWeight: 700,
                                    }}>{evolvingUuid === pok.uuid ? '...' : '⬆️ Эволюция'}</button>
                                </div>
                            )}
                            {evolved && <div style={{ marginTop: 8, color: '#fbbf24', fontWeight: 700, textAlign: 'center' }}>🎉 Эволюция завершена!</div>}
                            {/* Team management */}
                            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                                {isTeam ? (
                                    <button
                                        onClick={() => { if (team.length > 1) { removeFromTeam(pok.uuid); notify(`${pok.data.name} → ПК`); } else notify('❌ Нельзя убрать последнего!'); }}
                                        style={{ flex: 1, padding: '6px 0', background: '#7f1d1d', border: 'none', borderRadius: 6, color: '#fca5a5', fontSize: 11, cursor: 'pointer' }}>
                                        → ПК-Ящик
                                    </button>
                                ) : (
                                    <>
                                        <button
                                            disabled={team.length >= 3}
                                            onClick={() => { const ok = addToTeam(pok.uuid); notify(ok ? `${pok.data.name} → Команда` : '❌ Команда заполнена (3/3)'); }}
                                            style={{ flex: 1, padding: '6px 0', background: team.length < 3 ? '#1d4ed8' : '#1e293b', border: 'none', borderRadius: 6, color: team.length < 3 ? '#e2e8f0' : '#475569', fontSize: 11, cursor: team.length < 3 ? 'pointer' : 'default' }}>
                                            → Команда
                                        </button>
                                        {team.length > 0 && (
                                            <select value={swapTarget} onChange={e => { if (e.target.value) { swapTeamPC(e.target.value, pok.uuid); setSwapTarget(''); notify('🔄 Поменяны.'); } else setSwapTarget(''); }}
                                                style={{ flex: 1, padding: '6px 4px', background: '#1e293b', border: '1px solid #334155', borderRadius: 6, color: '#94a3b8', fontSize: 11 }}>
                                                <option value="">Заменить...</option>
                                                {team.map(t => <option key={t.uuid} value={t.uuid}>{t.data.name}</option>)}
                                            </select>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    )}

                    {/* FEED */}
                    {panel === 'feed' && (
                        <div>
                            <div style={{ color: '#94a3b8', fontSize: 12, marginBottom: 10 }}>
                                Нажмите на еду — покемон получит EXP прямо сейчас:
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                {foodItems.map(def => {
                                    const qty = bag.find(i => i.id === def.id)?.qty ?? 0;
                                    return (
                                        <button key={def.id} onClick={() => qty > 0 && handleFeed(def.id)} disabled={qty === 0}
                                            style={{
                                                display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px',
                                                background: qty > 0 ? '#0f2a18' : '#0a0f1e',
                                                border: `1px solid ${qty > 0 ? '#15803d' : '#1e293b'}`,
                                                borderRadius: 8, cursor: qty > 0 ? 'pointer' : 'default',
                                                opacity: qty > 0 ? 1 : 0.4, textAlign: 'left',
                                            }}>
                                            <img src={def.sprite} alt={def.name} style={{ width: 24, height: 24, imageRendering: 'pixelated' }} />
                                            <div style={{ flex: 1 }}>
                                                <div style={{ color: '#e2e8f0', fontSize: 12, fontWeight: 700 }}>{def.name}</div>
                                                <div style={{ color: '#64748b', fontSize: 10 }}>+{def.xpGain} EXP</div>
                                            </div>
                                            <span style={{ color: qty > 0 ? '#4ade80' : '#475569', fontSize: 12, fontWeight: 700 }}>×{qty}</span>
                                        </button>
                                    );
                                })}
                                {foodItems.every(d => (bag.find(i => i.id === d.id)?.qty ?? 0) === 0) && (
                                    <div style={{ color: '#475569', fontSize: 12, textAlign: 'center', padding: '8px 0' }}>
                                        Нет корма. Купите в магазине.
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* EQUIP */}
                    {panel === 'equip' && (
                        <div>
                            {/* Current slots */}
                            <div style={{ marginBottom: 12 }}>
                                <div style={{ color: '#94a3b8', fontSize: 11, fontWeight: 700, marginBottom: 6 }}>НАДЕТО:</div>
                                {(['weapon', 'armor', 'accessory'] as EquipSlot[]).map(slot => {
                                    const id = myEquip[slot];
                                    const def = id ? EQUIP_DEFS.find(d => d.id === id) : null;
                                    return (
                                        <div key={slot} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0', borderBottom: '1px solid #0f172a' }}>
                                            <span style={{ color: '#475569', fontSize: 10, width: 70 }}>{SLOT_LABELS[slot]}</span>
                                            {def ? (
                                                <>
                                                    <EquipIcon id={def.id} size={20} />
                                                    <span style={{ color: TIER_COLOR[def.tier], fontSize: 11, fontWeight: 700, flex: 1 }}>{def.name}</span>
                                                    <span style={{ color: '#64748b', fontSize: 10 }}>{def.desc}</span>
                                                    <button onClick={() => handleUnequip(slot)} style={{ background: '#7f1d1d', border: 'none', borderRadius: 4, color: '#fca5a5', padding: '2px 8px', fontSize: 10, cursor: 'pointer' }}>Снять</button>
                                                </>
                                            ) : (
                                                <span style={{ color: '#334155', fontSize: 11, fontStyle: 'italic' }}>— пусто —</span>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                            {/* Bag items grouped by slot */}
                            {equipBag.filter(e => e.qty > 0).length > 0 ? (
                                <>
                                    {(['weapon', 'armor', 'accessory'] as EquipSlot[]).map(slot => {
                                        const items = equipBag.filter(e => e.qty > 0 && EQUIP_DEFS.find(d => d.id === e.id)?.slot === slot);
                                        if (items.length === 0) return null;
                                        return (
                                            <div key={slot} style={{ marginBottom: 10 }}>
                                                <div style={{ color: '#94a3b8', fontSize: 11, fontWeight: 700, marginBottom: 4 }}>{SLOT_LABELS[slot]}:</div>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                                    {items.map(e => {
                                                        const def = EQUIP_DEFS.find(d => d.id === e.id);
                                                        if (!def) return null;
                                                        const currentInSlot = myEquip[def.slot];
                                                        return (
                                                            <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', background: '#0f172a', borderRadius: 6 }}>
                                                                <EquipIcon id={def.id} size={24} />
                                                                <div style={{ flex: 1 }}>
                                                                    <span style={{ color: TIER_COLOR[def.tier], fontWeight: 700, fontSize: 11 }}>[{def.tier}] </span>
                                                                    <span style={{ color: '#e2e8f0', fontSize: 11 }}>{def.name}</span>
                                                                    <div style={{ color: '#64748b', fontSize: 10 }}>{def.desc}</div>
                                                                </div>
                                                                <span style={{ color: '#475569', fontSize: 10 }}>×{e.qty}</span>
                                                                <button onClick={() => handleEquip(e.id)} style={{ background: '#312e81', border: 'none', borderRadius: 6, color: '#c7d2fe', padding: '4px 10px', fontSize: 10, cursor: 'pointer', fontWeight: 700 }}>
                                                                    {currentInSlot ? '🔄' : '+'} Надеть
                                                                </button>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </>
                            ) : (
                                <div style={{ color: '#475569', fontSize: 12, textAlign: 'center' }}>Нет снаряжения. Купите в магазине.</div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

function panelBtnStyle(active: boolean, activeColor: string) {
    return {
        minWidth: 72, height: 24, borderRadius: 6, border: 'none', padding: '0 8px',
        background: active ? activeColor : '#1e293b',
        color: '#cbd5e1', fontSize: 10, fontWeight: 700, whiteSpace: 'nowrap',
        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3,
    } as React.CSSProperties;
}

// ── Main ──────────────────────────────────────────────────────────
const StoryInventory: React.FC<Props> = ({ onBack }) => {
    const { bag, ownedPokemon, pendingBuff, money, activateItem, cancelBuff, spendMoney } = useProgressStore();
    const dayStore = useDayStore();

    const [note, setNote] = useState('');
    const [evolvingUuid, setEvolvingUuid] = useState<string | null>(null);
    const [evolvedUuids, setEvolvedUuids] = useState<Set<string>>(new Set());
    const [tab, setTab] = useState<'pokemon' | 'buffs' | 'training'>('pokemon');

    const team = ownedPokemon.filter(p => p.inTeam);
    const pc   = ownedPokemon.filter(p => !p.inTeam);
    const allPokemon = [...team, ...pc];

    const notify = (msg: string) => { setNote(msg); setTimeout(() => setNote(''), 3000); };

    const buffItems = ITEM_DEFS.filter(d => d.category === 'buff');
    const buffSummary = pendingBuff ? [
        pendingBuff.atkMult   > 1 && `ATK ×${pendingBuff.atkMult.toFixed(2)}`,
        pendingBuff.defMult   > 1 && `DEF ×${pendingBuff.defMult.toFixed(2)}`,
        pendingBuff.speedMult > 1 && `SPD ×${pendingBuff.speedMult.toFixed(2)}`,
    ].filter(Boolean).join('  ·  ') : null;

    const handleActivate = (id: string) => {
        const ok = activateItem(id as Parameters<typeof activateItem>[0]);
        const def = ITEM_DEFS.find(d => d.id === id);
        notify(ok ? `${def?.icon} «${def?.name}» активирован для следующего боя!` : '❌ Нет в сумке.');
    };

    return (
        <div className="story-screen" style={{ padding: 20, maxWidth: 760, margin: '0 auto' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <button className="story-btn story-btn--secondary" onClick={onBack} style={{ padding: '6px 14px' }}>← Карта</button>
                <h2 style={{ color: '#e2e8f0', margin: 0, fontSize: 20, flex: 1 }}>🎒 Инвентарь</h2>
                <div style={{ background: '#1e293b', borderRadius: 20, padding: '6px 14px', color: '#fbbf24', fontWeight: 700, fontSize: 13 }}>
                    💰 {money.toLocaleString()}G
                </div>
            </div>

            {/* Notification — fixed overlay so it doesn't shift layout */}
            {note && (
                <div style={{
                    position: 'fixed', top: 16, left: '50%', transform: 'translateX(-50%)',
                    zIndex: 9999, background: '#0f2a18', border: '2px solid #15803d',
                    borderRadius: 8, padding: '10px 20px', boxShadow: '0 4px 20px rgba(0,0,0,0.6)',
                    pointerEvents: 'none',
                }}>
                    <div style={{ color: '#4ade80', fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap' }}>{note}</div>
                </div>
            )}

            {/* Tabs */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
                <button onClick={() => setTab('pokemon')} style={tabStyle(tab === 'pokemon')}>
                    👥 Покемоны ({allPokemon.length})
                </button>
                <button onClick={() => setTab('buffs')} style={tabStyle(tab === 'buffs')}>
                    ⚡ Усилители {pendingBuff ? '●' : ''}
                </button>
                <button onClick={() => setTab('training')} style={tabStyle(tab === 'training')}>
                    🏋️ Тренировка {dayStore.training.length > 0 ? `(${dayStore.training.length})` : ''}
                </button>
            </div>

            {/* ── Pokemon tab ── */}
            {tab === 'pokemon' && (
                <div>
                    <div style={{ background: '#0f172a', borderRadius: 8, padding: '8px 14px', marginBottom: 14, color: '#64748b', fontSize: 11.5, lineHeight: 1.6 }}>
                        💡 <b style={{ color: '#94a3b8' }}>Отряд</b> — те, кто выходит в бой (до 3-х). Кнопка <b style={{ color: '#93c5fd' }}>📥 В отряд</b> / <b style={{ color: '#fca5a5' }}>📤 В ПК</b> перемещает покемона.
                        Кнопка <b style={{ color: '#c4b5fd' }}>🗡️ Экип.</b> — надеть оружие, броню и аксессуар из сумки.
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                        <span style={{ color: '#93c5fd', fontSize: 13, fontWeight: 800 }}>⚔️ БОЕВОЙ ОТРЯД</span>
                        <span style={{ color: '#475569', fontSize: 11 }}>{team.length}/3</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 18 }}>
                        {team.map(pok => (
                            <PokemonCard key={pok.uuid} pok={pok} team={team} note={note} setNote={notify}
                                evolvingUuid={evolvingUuid} setEvolvingUuid={setEvolvingUuid}
                                evolvedUuids={evolvedUuids} setEvolvedUuids={setEvolvedUuids} />
                        ))}
                        {team.length === 0 && (
                            <div style={{ color: '#475569', textAlign: 'center', padding: 16 }}>Отряд пуст!</div>
                        )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                        <span style={{ color: '#64748b', fontSize: 13, fontWeight: 800 }}>💾 ПК-ЯЩИК</span>
                        <span style={{ color: '#475569', fontSize: 11 }}>{pc.length} шт. — запасные и пойманные</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {pc.map(pok => (
                            <PokemonCard key={pok.uuid} pok={pok} team={team} note={note} setNote={notify}
                                evolvingUuid={evolvingUuid} setEvolvingUuid={setEvolvingUuid}
                                evolvedUuids={evolvedUuids} setEvolvedUuids={setEvolvedUuids} />
                        ))}
                        {pc.length === 0 && (
                            <div style={{ color: '#334155', textAlign: 'center', padding: 12, fontSize: 12 }}>
                                Пусто. Лови покемонов покеболом после побед!
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ── Training tab ── */}
            {tab === 'training' && (
                <div>
                    <div style={{ background: '#0f172a', borderRadius: 8, padding: '10px 14px', marginBottom: 14, color: '#64748b', fontSize: 11.5, lineHeight: 1.6 }}>
                        🏋️ Отправь покемона на тренировку — он получит <b style={{ color: '#fbbf24' }}>много EXP</b> пропорционально его уровню.
                        Тренировка длится <b style={{ color: '#e2e8f0' }}>{TRAINING_DAYS} дня</b> (игровых). Покемон не будет доступен в это время.
                        Пропускайте дни на карте.
                    </div>

                    {/* Currently training */}
                    {dayStore.training.length > 0 && (
                        <div style={{ marginBottom: 16 }}>
                            <div style={{ color: '#60a5fa', fontSize: 13, fontWeight: 800, marginBottom: 8 }}>📋 НА ТРЕНИРОВКЕ</div>
                            {dayStore.training.map(t => {
                                const daysLeft = dayStore.getTrainingDaysLeft(t.pokemonUuid);
                                const pok = ownedPokemon.find(p => p.uuid === t.pokemonUuid);
                                return (
                                    <div key={t.pokemonUuid} style={{
                                        display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
                                        background: '#0a1628', border: '1px solid #1e3a5f', borderRadius: 10, marginBottom: 6,
                                    }}>
                                        {pok && (
                                            <img src={pok.data.sprites.front_default} alt={pok.data.name}
                                                style={{ width: 40, height: 40, imageRendering: 'pixelated' }} />
                                        )}
                                        <div style={{ flex: 1 }}>
                                            <div style={{ color: '#e2e8f0', fontWeight: 700, fontSize: 12, textTransform: 'uppercase' }}>
                                                {t.pokemonName}
                                            </div>
                                            <div style={{ color: '#fbbf24', fontSize: 11 }}>+{t.xpReward.toLocaleString()} EXP</div>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{ color: daysLeft <= 1 ? '#fbbf24' : '#94a3b8', fontWeight: 700, fontSize: 13 }}>
                                                {daysLeft > 0 ? `${daysLeft} дн.` : '✅ Готов!'}
                                            </div>
                                            {/* progress bar */}
                                            <div style={{ width: 60, height: 4, background: '#1e293b', borderRadius: 2, marginTop: 3 }}>
                                                <div style={{
                                                    width: `${Math.round(((TRAINING_DAYS - daysLeft) / TRAINING_DAYS) * 100)}%`,
                                                    height: '100%', background: '#3b82f6', borderRadius: 2,
                                                }} />
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Available for training */}
                    <div style={{ color: '#94a3b8', fontSize: 13, fontWeight: 800, marginBottom: 8 }}>📤 ОТПРАВИТЬ НА ТРЕНИРОВКУ</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {ownedPokemon.filter(p => !dayStore.isTraining(p.uuid)).length === 0 ? (
                            <div style={{ color: '#475569', fontSize: 12, textAlign: 'center', padding: 16 }}>
                                Все покемоны уже на тренировке.
                            </div>
                        ) : (
                            ownedPokemon.filter(p => !dayStore.isTraining(p.uuid)).map(pok => {
                                const cost = pok.level * 40;
                                const xpReward = pok.level * TRAINING_XP_PER_LEVEL;
                                const canAfford = money >= cost;
                                const isLastTeamMember = pok.inTeam && team.length <= 1;
                                const disabled = !canAfford || isLastTeamMember;
                                return (
                                    <div key={pok.uuid} style={{
                                        display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
                                        background: pok.inTeam ? '#0f1a2e' : '#0f172a',
                                        border: `1px solid ${pok.inTeam ? '#1e3a5f' : '#334155'}`, borderRadius: 10,
                                    }}>
                                        <img src={pok.data.sprites.front_default} alt={pok.data.name}
                                            style={{ width: 48, height: 48, imageRendering: 'pixelated' }} />
                                        <div style={{ flex: 1 }}>
                                            <div style={{ color: '#e2e8f0', fontWeight: 700, fontSize: 12, textTransform: 'uppercase' }}>
                                                {pok.data.name} <span style={{ color: '#64748b', fontWeight: 400 }}>Lv.{pok.level}</span>
                                                {pok.inTeam && <span style={{ color: '#93c5fd', fontSize: 9, marginLeft: 6 }}>⚔️ КОМАНДА</span>}
                                            </div>
                                            <div style={{ color: '#fbbf24', fontSize: 11 }}>
                                                +{xpReward.toLocaleString()} EXP за {TRAINING_DAYS} дня
                                            </div>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{ color: canAfford ? '#fbbf24' : '#f87171', fontSize: 11, marginBottom: 4 }}>
                                                💰 {cost.toLocaleString()}G
                                            </div>
                                            <button
                                                disabled={disabled}
                                                title={isLastTeamMember ? 'Нельзя — последний в команде!' : undefined}
                                                onClick={() => {
                                                    if (spendMoney(cost)) {
                                                        if (pok.inTeam) {
                                                            useProgressStore.getState().removeFromTeam(pok.uuid);
                                                        }
                                                        dayStore.startTraining(pok.uuid, pok.data.name, pok.level);
                                                        notify(`🏋️ ${pok.data.name} отправлен на тренировку на ${TRAINING_DAYS} дня!`);
                                                    }
                                                }}
                                                style={{
                                                    background: disabled ? '#1e293b' : '#1d4ed8',
                                                    border: 'none', borderRadius: 6,
                                                    color: disabled ? '#475569' : '#fff',
                                                    padding: '5px 12px', fontSize: 11, fontWeight: 700,
                                                    cursor: disabled ? 'default' : 'pointer',
                                                }}
                                            >
                                                {isLastTeamMember ? '🚫 Последний' : '🏋️ Отправить'}
                                            </button>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            )}

            {/* ── Buffs tab ── */}
            {tab === 'buffs' && (
                <div>
                    {/* Active buff banner */}
                    {pendingBuff ? (
                        <div style={{ background: 'rgba(79,70,229,0.15)', border: '2px solid #4f46e5', borderRadius: 10, padding: '12px 16px', marginBottom: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <div style={{ color: '#a5b4fc', fontWeight: 700, fontSize: 12, marginBottom: 4 }}>⚡ АКТИВНЫЕ УСИЛИТЕЛИ</div>
                                <div style={{ color: '#c7d2fe', fontSize: 15, fontWeight: 800 }}>{buffSummary}</div>
                                <div style={{ color: '#475569', fontSize: 11, marginTop: 4 }}>Применятся в следующем бою и расходуются</div>
                            </div>
                            <button onClick={() => { cancelBuff(); notify('Усилители отменены — предметы возвращены.'); }}
                                style={{ background: '#312e81', border: 'none', borderRadius: 8, color: '#e0e7ff', padding: '8px 14px', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>
                                Отмена
                            </button>
                        </div>
                    ) : (
                        <div style={{ background: '#0f172a', borderRadius: 8, padding: '10px 14px', marginBottom: 14, color: '#475569', fontSize: 12 }}>
                            💡 Усилители дают временный буст в следующем бою и расходуются после него.
                        </div>
                    )}

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                        {buffItems.map(def => {
                            const qty = bag.find(i => i.id === def.id)?.qty ?? 0;
                            return (
                                <div key={def.id} style={{
                                    border: `2px solid ${qty > 0 ? '#334155' : '#1e293b'}`,
                                    borderRadius: 10, padding: '12px 14px', background: '#0f172a',
                                    display: 'flex', alignItems: 'center', gap: 10, opacity: qty > 0 ? 1 : 0.45,
                                }}>
                                    <img src={def.sprite} alt={def.name} style={{ width: 32, height: 32, imageRendering: 'pixelated' }} />
                                    <div style={{ flex: 1 }}>
                                        <div style={{ color: '#e2e8f0', fontWeight: 700, fontSize: 13 }}>{def.name}</div>
                                        <div style={{ color: '#64748b', fontSize: 11 }}>{def.desc}</div>
                                        <div style={{ color: '#94a3b8', fontSize: 11 }}>В сумке: ×{qty}</div>
                                    </div>
                                    <button disabled={qty === 0} onClick={() => handleActivate(def.id)} style={{
                                        background: qty > 0 ? '#4f46e5' : '#0f172a', border: 'none', borderRadius: 8,
                                        color: qty > 0 ? '#fff' : '#334155', padding: '7px 12px', fontSize: 12,
                                        cursor: qty > 0 ? 'pointer' : 'default', fontWeight: 700, whiteSpace: 'nowrap',
                                    }}>Активировать</button>
                                </div>
                            );
                        })}
                    </div>

                    {/* Pokeball count */}
                    <div style={{ border: '1px solid #1e293b', borderRadius: 10, padding: '10px 14px', background: '#0f172a', display: 'flex', alignItems: 'center', gap: 10, marginTop: 10 }}>
                        <img src="./sprites/balls/poke-ball.png" alt="Покебол" style={{ width: 28, height: 28, imageRendering: 'pixelated' }} />
                        <div>
                            <div style={{ color: '#e2e8f0', fontWeight: 700, fontSize: 13 }}>Покеболы</div>
                            <div style={{ color: '#64748b', fontSize: 11 }}>Для поимки после победы</div>
                        </div>
                        <div style={{ marginLeft: 'auto', color: '#e2e8f0', fontWeight: 800, fontSize: 18 }}>
                            ×{bag.find(i => i.id === 'pokeball')?.qty ?? 0}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

function tabStyle(active: boolean): React.CSSProperties {
    return {
        padding: '9px 18px', borderRadius: 8, border: 'none', cursor: 'pointer',
        background: active ? '#4f46e5' : '#1e293b',
        color: active ? '#fff' : '#64748b', fontWeight: 700, fontSize: 13,
    };
}

export default StoryInventory;
