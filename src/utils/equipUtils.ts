import type { Pokemon, EquipBattleEffects } from '../types/Pokemon';
import { findEquip, aggregateEffects } from '../data/equipmentData';
import type { PokemonEquipment, BattleBuff } from '../store/progressStore';

export interface PokemonWithEquip extends Pokemon {
    equipEffects?: EquipBattleEffects;
}

export function applyEquipmentToPokemon(pok: Pokemon, equip: PokemonEquipment): PokemonWithEquip {
    const sm = { ...pok.statsMap };
    const ids = [equip.weapon, equip.armor, equip.accessory];
    // First pass: multiplicative stats
    ids.forEach(id => {
        if (!id) return;
        const def = findEquip(id);
        if (!def) return;
        if (def.atkMult)   { sm.attack = Math.round(sm.attack * def.atkMult); sm['special-attack'] = Math.round(sm['special-attack'] * def.atkMult); }
        if (def.defMult)   { sm.defense = Math.round(sm.defense * def.defMult); sm['special-defense'] = Math.round(sm['special-defense'] * def.defMult); }
        if (def.speedMult) { sm.speed = Math.round(sm.speed * def.speedMult); }
        if (def.hpMult)    { sm.hp = Math.round(sm.hp * def.hpMult); }
    });
    // Second pass: flat bonuses (applied AFTER multipliers so they're always meaningful)
    ids.forEach(id => {
        if (!id) return;
        const def = findEquip(id);
        if (!def) return;
        if (def.flatAtk) { sm.attack += def.flatAtk; sm['special-attack'] += def.flatAtk; }
        if (def.flatDef) { sm.defense += def.flatDef; sm['special-defense'] += def.flatDef; }
        if (def.flatSpd) { sm.speed += def.flatSpd; }
    });
    const stats = pok.stats.map(s => ({ ...s, base_stat: sm[s.stat.name as keyof typeof sm] ?? s.base_stat }));
    const equipEffects = aggregateEffects(ids);
    // Add extra types as virtual types for STAB
    let types = pok.types;
    if (equipEffects.extraTypes.length > 0) {
        const existingNames = new Set(types.map(t => t.type.name));
        const additions = equipEffects.extraTypes
            .filter(t => !existingNames.has(t))
            .map(name => ({ slot: 99, type: { name, url: '' } }));
        types = [...types, ...additions];
    }
    return { ...pok, statsMap: sm, stats, types, equipEffects };
}

export function applyBuffToPokemon(pok: PokemonWithEquip, buff: BattleBuff): PokemonWithEquip {
    const sm = { ...pok.statsMap };
    if (buff.atkMult !== 1) {
        sm.attack = Math.round(sm.attack * buff.atkMult);
        sm['special-attack'] = Math.round(sm['special-attack'] * buff.atkMult);
    }
    if (buff.defMult !== 1) {
        sm.defense = Math.round(sm.defense * buff.defMult);
        sm['special-defense'] = Math.round(sm['special-defense'] * buff.defMult);
    }
    if (buff.speedMult !== 1) {
        sm.speed = Math.round(sm.speed * buff.speedMult);
    }
    const stats = pok.stats.map(s => ({
        ...s,
        base_stat: sm[s.stat.name as keyof typeof sm] ?? s.base_stat,
    }));
    return { ...pok, statsMap: sm, stats };
}
