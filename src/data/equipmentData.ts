// ═══════════════════════════════════════════════════════════════════
// Equipment Data — ~100 items unlocked via sliding 4-window across opponents
// ═══════════════════════════════════════════════════════════════════
// Each opponent (0..18) unlocks one TIER of equipment. After defeating
// opponent N, the player gains access to TIER[N]. Once they defeat
// opponent N+4, TIER[N] disappears from the shop (sold out).
//
// Items already in equipBag are kept (not deleted), but they no longer
// appear in shop. This forces progression and prevents over-stockpiling.
//
// Effects use the new EquipBattleEffects system from types/Pokemon.

import type { EquipBattleEffects } from '../types/Pokemon';

export type EquipSlotV2 = 'weapon' | 'armor' | 'accessory';

export interface EquipDefV2 {
    id: string;
    slot: EquipSlotV2;
    name: string;
    desc: string;
    tier: 'C' | 'B' | 'A' | 'S' | 'SS';
    cost: number;
    icon: string;
    unlockAfterOpp: number;        // first opponent index that unlocks this in shop
    atkMult?: number;
    defMult?: number;
    speedMult?: number;
    hpMult?: number;               // multiplies base HP
    flatAtk?: number;              // flat added on top of multipliers
    flatDef?: number;
    flatSpd?: number;
    effects?: Partial<EquipBattleEffects>;
    rare?: boolean;                // strange merchant only (won't appear in shop list)
}

// helper to define an item more compactly
const w = (
    unlockAfterOpp: number,
    tier: EquipDefV2['tier'],
    id: string, icon: string, name: string, desc: string, cost: number,
    extras: Partial<EquipDefV2>,
): EquipDefV2 => ({ slot: 'weapon', id, icon, name, desc, tier, cost, unlockAfterOpp, ...extras });
const a = (
    unlockAfterOpp: number,
    tier: EquipDefV2['tier'],
    id: string, icon: string, name: string, desc: string, cost: number,
    extras: Partial<EquipDefV2>,
): EquipDefV2 => ({ slot: 'armor', id, icon, name, desc, tier, cost, unlockAfterOpp, ...extras });
const ac = (
    unlockAfterOpp: number,
    tier: EquipDefV2['tier'],
    id: string, icon: string, name: string, desc: string, cost: number,
    extras: Partial<EquipDefV2>,
): EquipDefV2 => ({ slot: 'accessory', id, icon, name, desc, tier, cost, unlockAfterOpp, ...extras });

// ─── ACT I (opponents 0..7) ────────────────────────────────────────
export const EQUIPMENT_V2: EquipDefV2[] = [
    // ── Opponent 0 / Brock unlock — Tier C basics ──
    w(0, 'C', 'twig-club',     '🥢', 'Сук',                 '+8% Атака',                                     250,  { atkMult: 1.08 }),
    w(0, 'C', 'wooden-sword',  '🗡️', 'Деревянный меч',      '+12% Атака',                                    600,  { atkMult: 1.12 }),
    a(0, 'C', 'leather-vest',  '🦺', 'Кожаный жилет',       '+10% Защита',                                   500,  { defMult: 1.10 }),
    a(0, 'C', 'wooden-shield', '🪵', 'Деревянный щит',      '+12% Защита, 5% уворот',                        700,  { defMult: 1.12, effects: { dodge: 0.05 } }),
    ac(0,'C', 'leather-gloves','🧤', 'Кожаные перчатки',     '+5% Скорость, +3% крит',                       400,  { speedMult: 1.05, effects: { critBonus: 0.03 } }),

    // ── Opponent 1 / Misty — water themed Tier C+ ──
    w(1, 'C', 'water-trident', '🔱', 'Трезубец русалки',     '+14% Атака, +5% водный резист',                 800,  { atkMult: 1.14, effects: { waterResist: 0.05 } }),
    a(1, 'C', 'pearl-armor',   '🐚', 'Жемчужная броня',      '+14% Защита, +15% водный резист',               900,  { defMult: 1.14, effects: { waterResist: 0.15 } }),
    ac(1,'C', 'fishing-amulet','🎣', 'Амулет рыбака',        '+10% золота с боёв',                            600,  { effects: { critBonus: 0.04 } }),

    // ── Opponent 2 / Surge — electric themed Tier B ──
    w(2, 'B', 'iron-sword',    '⚔️', 'Железный меч',          '+22% Атака',                                   1400, { atkMult: 1.22 }),
    w(2, 'B', 'thunder-rod',   '⚡', 'Громовый жезл',         '+18% Атака, +5% шанс паралич с удара',         1700, { atkMult: 1.18, effects: { extraTypes: ['electric'] } }),
    a(2, 'B', 'rubber-suit',   '🥽', 'Резиновый костюм',     '+12% Защита, +25% электро-резист',              1600, { defMult: 1.12, effects: { electricResist: 0.25 } }),
    ac(2,'B', 'lightning-ring','💍', 'Кольцо разряда',        '+8% Скорость, +5% крит, +10% электро-резист',  1500, { speedMult: 1.08, effects: { critBonus: 0.05, electricResist: 0.10 } }),

    // ── Opponent 3 / Erika — grass/poison Tier B ──
    w(3, 'B', 'thorned-whip',  '🌿', 'Шипастый хлыст',        '+20% Атака, 10% шанс кровотечения',             1800, { atkMult: 1.20, effects: { bleedChance: 0.10 } }),
    a(3, 'B', 'bark-armor',    '🪨', 'Древесная броня',       '+22% Защита, +15% травяной резист',            1900, { defMult: 1.22, effects: { grassResist: 0.15 } }),
    ac(3,'B', 'pollen-amulet', '🌼', 'Пыльцевой амулет',      '+8% статус-резист, +5% уворот',                 1600, { effects: { statusResist: 0.08, dodge: 0.05 } }),

    // ── Opponent 4 / Koga — poison/ninja Tier B ──
    w(4, 'B', 'tanto',         '🗡️', 'Танто ниндзя',          '+25% Атака, +6% крит',                          2100, { atkMult: 1.25, effects: { critBonus: 0.06 } }),
    w(4, 'B', 'poison-fang',   '☠️', 'Ядовитый клык',         '+18% Атака, 12% шанс яда',                      2300, { atkMult: 1.18, effects: { extraTypes: ['poison'], bleedChance: 0.05 } }),
    a(4, 'B', 'shadow-cloak',  '🥷', 'Плащ тени',             '+15% Защита, +10% уворот',                      2200, { defMult: 1.15, effects: { dodge: 0.10 } }),
    ac(4,'B', 'smoke-pendant', '💨', 'Кулон дыма',            '+8% уворот, +10% скорость',                     2000, { speedMult: 1.10, effects: { dodge: 0.08 } }),

    // ── Opponent 5 / Sabrina — psychic Tier A ──
    w(5, 'A', 'psi-blade',     '🔮', 'Псиклинок',             '+28% Атака, +psy тип',                          2800, { atkMult: 1.28, effects: { extraTypes: ['psychic'] } }),
    a(5, 'A', 'mind-veil',     '👁️', 'Покров разума',         '+18% Защита, +20% psychic-резист, +15% статус', 2700, { defMult: 1.18, effects: { psychicResist: 0.20, statusResist: 0.15 } }),
    ac(5,'A', 'foresight-eye', '🧿', 'Око предвидения',       '+12% уворот, +8% крит',                         2900, { effects: { dodge: 0.12, critBonus: 0.08 } }),

    // ── Opponent 6 / Blaine — fire Tier A ──
    w(6, 'A', 'flame-saber',   '🔥', 'Пламенный сейбер',      '+30% Атака, +fire тип, +10% вампиризм',          3200, { atkMult: 1.30, effects: { extraTypes: ['fire'], vampirism: 0.10 } }),
    a(6, 'A', 'magma-plate',   '🧱', 'Магмовая пластина',     '+25% Защита, +25% fire-резист, шипы 5%',         3400, { defMult: 1.25, effects: { fireResist: 0.25, thorns: 0.05 } }),
    ac(6,'A', 'salamander-fang','🦎','Клык саламандры',       '+15% Атака, +15% fire-резист',                   3000, { atkMult: 1.15, effects: { fireResist: 0.15 } }),

    // ── Opponent 7 / Giovanni — ground/dark Tier A ──
    w(7, 'A', 'rocket-katana', '⚔️', 'Катана Рокета',         '+35% Атака, +10% крит',                          4000, { atkMult: 1.35, effects: { critBonus: 0.10 } }),
    a(7, 'A', 'rocket-plate',  '🛡️', 'Бронежилет Рокета',     '+30% Защита, +12% статус-резист',                4200, { defMult: 1.30, effects: { statusResist: 0.12 } }),
    ac(7,'A', 'boss-amulet',   '🏵️', 'Амулет босса',           '+12% Атака, +12% Защита (Амулет Удачи)',         3800, { atkMult: 1.12, defMult: 1.12 }),

    // ── ACT II — Opponents 8..12 (Elite + Champion) Tier S ──
    w(8, 'S', 'frost-glaive',  '❄️', 'Ледяная глефа',         '+32% Атака, +ice тип, +15% ice-резист',          5200, { atkMult: 1.32, effects: { extraTypes: ['ice'], iceResist: 0.15 } }),
    a(8, 'S', 'glacier-mail',  '🧊', 'Глетчерная кольчуга',   '+35% Защита, +30% ice-резист, +10% physResist',  5400, { defMult: 1.35, effects: { iceResist: 0.30, physResist: 0.10 } }),
    ac(8,'S', 'frost-pendant', '🌨️', 'Кулон стужи',            '+10% Атака, +20% ice-резист',                    5000, { atkMult: 1.10, effects: { iceResist: 0.20 } }),

    w(9, 'S', 'warrior-fists', '🥊', 'Перчатки воина',        '+38% Атака, +12% крит',                          5800, { atkMult: 1.38, effects: { critBonus: 0.12 } }),
    a(9, 'S', 'champion-belt', '🥇', 'Пояс чемпиона',         '+22% Атака, +22% Защита',                        6200, { atkMult: 1.22, defMult: 1.22 }),
    ac(9,'S', 'martial-band',  '🤜', 'Боевой браслет',         '+10% Атака, +6% шипы',                           5500, { atkMult: 1.10, effects: { thorns: 0.06 } }),

    w(10,'S', 'spectral-dagger','👻','Кинжал призрака',       '+30% Атака, +ghost тип, +15% уворот',            6400, { atkMult: 1.30, effects: { extraTypes: ['ghost'], dodge: 0.15 } }),
    a(10,'S', 'phantom-robes', '🥋', 'Одеяние фантома',       '+25% Защита, +20% psychic-резист, +15% уворот',  6600, { defMult: 1.25, effects: { psychicResist: 0.20, dodge: 0.15 } }),
    ac(10,'S','soul-locket',   '🕯️', 'Медальон душ',          '+8% вампиризм, +12% статус-резист',              6300, { effects: { vampirism: 0.08, statusResist: 0.12 } }),

    w(11,'S', 'dragon-fang',   '🐉', 'Клык дракона',          '+42% Атака, +dragon тип',                        7200, { atkMult: 1.42, effects: { extraTypes: ['dragon'] } }),
    a(11,'S', 'dragon-scale',  '🪶', 'Чешуя дракона',         '+38% Защита, +15% fire/ice резист',              7400, { defMult: 1.38, effects: { fireResist: 0.15, iceResist: 0.15 } }),
    ac(11,'S','dragon-claw',   '🦅', 'Коготь дракона',        '+18% Атака, +8% крит, +5% вампиризм',            7000, { atkMult: 1.18, effects: { critBonus: 0.08, vampirism: 0.05 } }),

    w(12,'S', 'mastercraft-blade','🗡️','Меч мастера',         '×1.7 Атака +30, +20% крит, +15% вампир',         8500, { atkMult: 1.70, flatAtk: 30, effects: { critBonus: 0.20, vampirism: 0.15 } }),
    a(12,'S', 'mythril-armor', '✨', 'Мифриловая броня',       '×1.65 Защита +30, +20% HP, +15% physResist',     8800, { defMult: 1.65, hpMult: 1.20, flatDef: 30, effects: { physResist: 0.15 } }),
    ac(12,'S','champion-crown','👑', 'Корона чемпиона',        '×1.3 Атак/Защ +20, ×1.15 Скорость',              9000, { atkMult: 1.30, defMult: 1.30, speedMult: 1.15, flatAtk: 20, flatDef: 20 }),

    // ── ACT III — opponents 13..16 Tier SS ──
    w(13,'SS','rocket-railgun','🚀', 'Рельсотрон Рокета',     '+50% Атака, +10% крит, +psy/dark тип',           10500,{ atkMult: 1.50, effects: { extraTypes: ['psychic', 'dark'], critBonus: 0.10 } }),
    a(13,'SS','plasma-armor',  '🟣', 'Плазменная броня',      '+50% Защита, +20% статус-резист, шипы 10%',     11000,{ defMult: 1.50, effects: { statusResist: 0.20, thorns: 0.10 } }),
    ac(13,'SS','rocket-emblem','🎖️','Эмблема Рокета',         '+20% Атака, +15% золота с боёв',                 10000,{ atkMult: 1.20 }),

    w(14,'SS','silver-edge',   '🗡️', 'Серебряное лезвие',     '+48% Атака, +dark тип, +12% уворот',             11500,{ atkMult: 1.48, effects: { extraTypes: ['dark'], dodge: 0.12 } }),
    a(14,'SS','shadow-mantle', '🖤', 'Мантия тьмы',            '+45% Защита, +25% psychic-резист, +15% уворот', 12000,{ defMult: 1.45, effects: { psychicResist: 0.25, dodge: 0.15 } }),
    ac(14,'SS','rivals-fang',  '🩸', 'Клык соперника',         '+15% Атака, +12% вампиризм, +10% крит',          11200,{ atkMult: 1.15, effects: { vampirism: 0.12, critBonus: 0.10 } }),

    w(15,'SS','kingdra-trident','🔱','Трезубец Кингдры',       '+50% Атака, +dragon/water тип',                 13000,{ atkMult: 1.50, effects: { extraTypes: ['dragon', 'water'] } }),
    a(15,'SS','sea-king-mail', '🌊', 'Чешуя морского царя',   '+45% Защита, +30% water-резист, +15% ice',      13500,{ defMult: 1.45, effects: { waterResist: 0.30, iceResist: 0.15 } }),
    ac(15,'SS','tidal-orb',    '🔵', 'Волновая сфера',         '+15% Атака, +15% Скорость',                      12800,{ atkMult: 1.15, speedMult: 1.15 }),

    w(16,'SS','red-blade',     '🔴', 'Меч молчания',          '+55% Атака, +15% крит, +ghost тип',              14500,{ atkMult: 1.55, effects: { extraTypes: ['ghost'], critBonus: 0.15 } }),
    a(16,'SS','red-cap',       '🧢', 'Алая бандана',           '+40% Защита, +20% всех типов резиста, +15% уворот',15000,{ defMult: 1.40, effects: { fireResist: 0.20, iceResist: 0.20, electricResist: 0.20, psychicResist: 0.20, dodge: 0.15 } }),
    ac(16,'SS','legendary-pin','📛', 'Значок легенды',         '+20% Атака, +20% Защита',                        14000,{ atkMult: 1.20, defMult: 1.20 }),

    // ── ACT IV — opponents 17..18 Tier SS+ (final) ──
    w(17,'SS','storm-talon',   '⚡', 'Когти бури',             '×2.0 Атака +60, +flying/electric, +30% крит',    17000,{ atkMult: 2.00, flatAtk: 60, effects: { extraTypes: ['flying', 'electric'], critBonus: 0.30 } }),
    a(17,'SS','aurora-plate',  '🌈', 'Авроровая пластина',     '×1.7 Защ +40, +30% HP, +30% всех резистов',     17500,{ defMult: 1.70, hpMult: 1.30, flatDef: 40, effects: { fireResist: 0.30, iceResist: 0.30, electricResist: 0.30, waterResist: 0.30, grassResist: 0.30, psychicResist: 0.30 } }),
    ac(17,'SS','sky-feather',  '🪶', 'Перо неба',              '×1.5 Атака +30, ×1.4 Скорость',                  16500,{ atkMult: 1.50, speedMult: 1.40, flatAtk: 30 }),

    w(18,'SS','genome-blade',  '🧬', 'Геномный клинок',        '×2.4 Атака +100, +40% крит, +25% вампир, +psy', 22000,{ atkMult: 2.40, flatAtk: 100, effects: { extraTypes: ['psychic'], critBonus: 0.40, vampirism: 0.25 } }),
    a(18,'SS','apex-armor',    '🛡️', 'Броня АПЕКС',            '×2.0 Защ +80, +50% HP, +30% physResist, шипы 25%', 23000, { defMult: 2.00, hpMult: 1.50, flatDef: 80, effects: { physResist: 0.30, thorns: 0.25, statusResist: 0.30 } }),
    ac(18,'SS','perfect-core', '💠', 'Идеальное ядро',         '×1.6 Атак/Защ +50, ×1.4 Скор, +25% HP',          24000,{ atkMult: 1.60, defMult: 1.60, speedMult: 1.40, hpMult: 1.25, flatAtk: 50, flatDef: 50 }),

    // ─── EXTRA EQUIPMENT (extra options per opponent) ───
    // Each opponent unlocks an additional weapon/armor/accessory option
    // to give the player choices within each tier.

    w(0, 'C', 'bone-club', '🦴', 'Костяная булава', '+10% Атака, +3% крит', 400, { atkMult: 1.10, effects: { critBonus: 0.03 } }),
    a(0, 'C', 'straw-hat', '👒', 'Соломенная шляпа', '+5% Защита, +4% уворот', 300, { defMult: 1.05, effects: { dodge: 0.04 } }),
    ac(0, 'C', 'wooden-charm', '🪵', 'Деревянный талисман', '+5% статус-резист', 350, { effects: { statusResist: 0.05 } }),

    w(1, 'C', 'water-spear', '💦', 'Водяное копьё', '+15% Атака, +5% Скорость', 1000, { atkMult: 1.15, speedMult: 1.05 }),
    a(1, 'C', 'kelp-cloak', '🌿', 'Морской плащ', '+12% Защита, +10% статус', 1100, { defMult: 1.12, effects: { statusResist: 0.10 } }),
    ac(1, 'C', 'sea-charm', '🐚', 'Морской амулет', '+5% уворот, +10% water-резист', 800, { effects: { dodge: 0.05, waterResist: 0.10 } }),

    w(2, 'B', 'volt-claws', '🦾', 'Электрокогти', '+22% Атака, +electric тип', 1600, { atkMult: 1.22, effects: { extraTypes: ['electric'] } }),
    a(2, 'B', 'storm-cape', '☁️', 'Грозовой плащ', '+15% Защита, +15% уворот', 1700, { defMult: 1.15, effects: { dodge: 0.15 } }),
    ac(2, 'B', 'spark-band', '✨', 'Искристый браслет', '+12% Скорость, +3% крит', 1300, { speedMult: 1.12, effects: { critBonus: 0.03 } }),

    w(3, 'B', 'venom-blade', '🐍', 'Ядовитый клинок', '+22% Атака, 8% bleed, +poison тип', 1900, { atkMult: 1.22, effects: { extraTypes: ['poison'], bleedChance: 0.08 } }),
    a(3, 'B', 'thorn-vest', '🌵', 'Шиповатый жилет', '+18% Защита, +8% шипы', 2000, { defMult: 1.18, effects: { thorns: 0.08 } }),
    ac(3, 'B', 'mossy-ring', '💚', 'Кольцо мха', '+15% grass-резист, +5% вампиризм', 1700, { effects: { grassResist: 0.15, vampirism: 0.05 } }),

    w(4, 'B', 'silent-kunai', '🥷', 'Кунай', '+20% Атака, +10% крит, +5% bleed', 2100, { atkMult: 1.20, effects: { critBonus: 0.10, bleedChance: 0.05 } }),
    a(4, 'B', 'mesh-armor', '⬛', 'Сетчатая броня', '+18% Защита, +12% physResist', 2300, { defMult: 1.18, effects: { physResist: 0.12 } }),
    ac(4, 'B', 'venom-vial', '🧪', 'Колба с ядом', '+poison тип, +10% bleed', 2000, { effects: { extraTypes: ['poison'], bleedChance: 0.10 } }),

    w(5, 'A', 'mind-orb', '🌀', 'Сфера разума', '+25% Атака, +psy тип, +5% уворот', 2700, { atkMult: 1.25, effects: { extraTypes: ['psychic'], dodge: 0.05 } }),
    a(5, 'A', 'meditation-belt', '🧘', 'Пояс медитации', '+20% Защита, +20% статус-резист', 2800, { defMult: 1.20, effects: { statusResist: 0.20 } }),
    ac(5, 'A', 'crystal-ball', '🔮', 'Магический шар', '+10% крит, +8% уворот', 2600, { effects: { critBonus: 0.10, dodge: 0.08 } }),

    w(6, 'A', 'volcanic-hammer', '🔨', 'Вулканический молот', '+35% Атака, +fire тип, +8% шипы', 3500, { atkMult: 1.35, effects: { extraTypes: ['fire'], thorns: 0.08 } }),
    a(6, 'A', 'lava-greaves', '🦵', 'Лавовые поножи', '+20% Защита, +20% fire-резист, +8% Скорость', 3300, { defMult: 1.20, speedMult: 1.08, effects: { fireResist: 0.20 } }),
    ac(6, 'A', 'ember-eye', '👁️', 'Тлеющее око', '+12% крит, +10% fire-резист', 3100, { effects: { critBonus: 0.12, fireResist: 0.10 } }),

    w(7, 'A', 'gold-hammer', '🔨', 'Золотой молот', '+30% Атака, +20% Защита', 4100, { atkMult: 1.30, defMult: 1.20 }),
    a(7, 'A', 'tank-plate', '🚜', 'Танковая броня', '+35% Защита, +15% physResist, шипы 8%', 4300, { defMult: 1.35, effects: { physResist: 0.15, thorns: 0.08 } }),
    ac(7, 'A', 'rocket-medal', '🎖️', 'Медаль Рокета', '+10% Атака, +10% Защита, +10% Скорость', 3900, { atkMult: 1.10, defMult: 1.10, speedMult: 1.10 }),

    w(8, 'S', 'cryo-axe', '🪓', 'Криотопор', '+35% Атака, +ice тип, 12% bleed', 5500, { atkMult: 1.35, effects: { extraTypes: ['ice'], bleedChance: 0.12 } }),
    a(8, 'S', 'frost-gauntlets', '🧤', 'Морозные перчатки', '+15% Атака, +20% Защита, +15% ice-резист', 5300, { atkMult: 1.15, defMult: 1.20, effects: { iceResist: 0.15 } }),
    ac(8, 'S', 'snowflake-pin', '❄️', 'Снежинка', '+25% ice-резист, +10% статус-резист', 4900, { effects: { iceResist: 0.25, statusResist: 0.10 } }),

    w(9, 'S', 'kicker-boots', '🥋', 'Боевые сапоги', '+30% Атака, +18% Скорость', 5700, { atkMult: 1.30, speedMult: 1.18 }),
    a(9, 'S', 'sparring-pads', '🤼', 'Спарринг-щитки', '+30% Защита, +15% physResist, +10% статус', 6000, { defMult: 1.30, effects: { physResist: 0.15, statusResist: 0.10 } }),
    ac(9, 'S', 'champion-bandana', '🎽', 'Бандана чемпиона', '+15% Атака, +10% крит', 5400, { atkMult: 1.15, effects: { critBonus: 0.10 } }),

    w(10, 'S', 'banshee-claws', '👹', 'Когти банши', '+32% Атака, +ghost тип, 15% bleed', 6500, { atkMult: 1.32, effects: { extraTypes: ['ghost'], bleedChance: 0.15 } }),
    a(10, 'S', 'spectral-veil', '🕸️', 'Призрачная вуаль', '+25% Защита, +18% уворот, +20% psychic-резист', 6700, { defMult: 1.25, effects: { dodge: 0.18, psychicResist: 0.20 } }),
    ac(10, 'S', 'wraith-pendant', '👻', 'Кулон призрака', '+10% вампиризм, +ghost тип', 6400, { effects: { vampirism: 0.10, extraTypes: ['ghost'] } }),

    w(11, 'S', 'wyvern-spear', '🐲', 'Копьё виверна', '+40% Атака, +dragon тип, +12% крит', 7300, { atkMult: 1.40, effects: { extraTypes: ['dragon'], critBonus: 0.12 } }),
    a(11, 'S', 'wyrm-cuirass', '🐉', 'Кираса дракона', '+35% Защита, +20% physResist', 7500, { defMult: 1.35, effects: { physResist: 0.20 } }),
    ac(11, 'S', 'dragon-tooth', '🦷', 'Зуб дракона', '+18% Атака, +10% вампиризм', 6900, { atkMult: 1.18, effects: { vampirism: 0.10 } }),

    w(12, 'S', 'rune-axe', '⚒️', 'Рунный топор', '+42% Атака, +12% крит, 12% bleed', 8200, { atkMult: 1.42, effects: { critBonus: 0.12, bleedChance: 0.12 } }),
    a(12, 'S', 'rune-mail', '🔗', 'Рунная кольчуга', '+40% Защита, +15% статус, +10% уворот', 8600, { defMult: 1.40, effects: { statusResist: 0.15, dodge: 0.10 } }),
    ac(12, 'S', 'star-ring', '⭐', 'Звёздное кольцо', '+12% Атака, +12% Защита, +10% Скорость', 8800, { atkMult: 1.12, defMult: 1.12, speedMult: 1.10 }),

    w(13, 'SS', 'plasma-edge', '🟣', 'Плазменное лезвие', '+45% Атака, +psy/dark тип, +15% вампиризм', 10300, { atkMult: 1.45, effects: { extraTypes: ['psychic', 'dark'], vampirism: 0.15 } }),
    a(13, 'SS', 'magnet-plate', '🧲', 'Магнитная броня', '+45% Защита, +30% electric-резист, шипы 8%', 10800, { defMult: 1.45, effects: { electricResist: 0.30, thorns: 0.08 } }),
    ac(13, 'SS', 'jet-belt', '🚀', 'Реактивный пояс', '+25% Скорость, +12% крит', 9800, { speedMult: 1.25, effects: { critBonus: 0.12 } }),

    w(14, 'SS', 'rival-sabre', '🗡️', 'Сабля соперника', '+45% Атака, +dark тип, +12% крит', 11300, { atkMult: 1.45, effects: { extraTypes: ['dark'], critBonus: 0.12 } }),
    a(14, 'SS', 'rival-cloak', '🖤', 'Плащ соперника', '+40% Защита, +15% уворот, +15% статус', 11800, { defMult: 1.40, effects: { dodge: 0.15, statusResist: 0.15 } }),
    ac(14, 'SS', 'silver-tongue', '🪙', 'Серебряный язык', '+15% золота, +10% Атака', 10800, { atkMult: 1.10 }),

    w(15, 'SS', 'storm-trident', '⛈️', 'Грозовой трезубец', '+48% Атака, +water/electric, +10% крит', 12800, { atkMult: 1.48, effects: { extraTypes: ['water', 'electric'], critBonus: 0.10 } }),
    a(15, 'SS', 'kraken-shell', '🐙', 'Панцирь кракена', '+42% Защита, +25% water-резист, шипы 10%', 13300, { defMult: 1.42, effects: { waterResist: 0.25, thorns: 0.10 } }),
    ac(15, 'SS', 'pearl-of-tide', '🦪', 'Жемчужина прилива', '+12% вампиризм, +15% Скорость', 12200, { speedMult: 1.15, effects: { vampirism: 0.12 } }),

    w(16, 'SS', 'silent-thunder', '🌩️', 'Безмолвный гром', '+52% Атака, +20% крит, +electric тип', 14200, { atkMult: 1.52, effects: { extraTypes: ['electric'], critBonus: 0.20 } }),
    a(16, 'SS', 'mt-silver-armor', '🗻', 'Броня горы', '+45% Защита, +20% всех резистов', 14700, { defMult: 1.45, effects: { fireResist: 0.20, iceResist: 0.20, electricResist: 0.20, waterResist: 0.20 } }),
    ac(16, 'SS', 'silent-charm', '🤫', 'Безмолвный амулет', '+25% Атака, +25% Защита', 13800, { atkMult: 1.25, defMult: 1.25 }),

    w(17, 'SS', 'phoenix-talon', '🦅', 'Коготь феникса', '×2.0 Атака +60, +fire/flying, +25% вампир', 17000, { atkMult: 2.00, flatAtk: 60, effects: { extraTypes: ['fire', 'flying'], vampirism: 0.25 } }),
    a(17, 'SS', 'thunderbird-mail', '⚡', 'Доспехи громовержца', '×1.7 Защ, +30% HP, +40% electric', 17500, { defMult: 1.70, hpMult: 1.30, flatDef: 40, effects: { electricResist: 0.40 } }),
    ac(17, 'SS', 'storm-eye', '🌪️', 'Око бури', '+30% крит, ×1.4 Скорость, +25 Атака', 16800, { speedMult: 1.40, flatAtk: 25, effects: { critBonus: 0.30 } }),

    w(18, 'SS', 'apex-lance', '🔱', 'Копьё АПЕКС', '×2.2 Атака +90, +35% крит, +20% вампир', 22500, { atkMult: 2.20, flatAtk: 90, effects: { extraTypes: ['psychic'], critBonus: 0.35, vampirism: 0.20 } }),
    a(18, 'SS', 'genome-shroud', '🧬', 'Геномная мантия', '×1.8 Защ +60, +40% HP, +30% резистов, +20% уворот', 23000, { defMult: 1.80, hpMult: 1.40, flatDef: 60, effects: { fireResist: 0.30, iceResist: 0.30, electricResist: 0.30, psychicResist: 0.30, dodge: 0.20 } }),
    ac(18, 'SS', 'mewtwo-medallion', '🧠', 'Медальон Мьюту', '×1.5 Атак +40, ×1.4 Защ +40, +30% статус', 23500, { atkMult: 1.50, defMult: 1.40, flatAtk: 40, flatDef: 40, effects: { statusResist: 0.30 } }),

    // ─── STRANGE MERCHANT (rare=true, not in shop) ───
    w(0,'SS','vampire-fang',    '🩸', 'Кровавый клык',          '×1.8 Атака +40, +35% вампир',                    7500, { atkMult: 1.80, flatAtk: 40, effects: { vampirism: 0.35 }, rare: true }),
    w(0,'SS','electro-mace',    '⚡', 'Электробулава',          '×1.8 Атака +50, +electric, 25% паралич',         7800, { atkMult: 1.80, flatAtk: 50, effects: { extraTypes: ['electric'] }, rare: true }),
    w(0,'SS','frostbite-sickle','🥶', 'Серп обморожения',       '×1.8 Атака +40, +ice, +30% bleed',               8000, { atkMult: 1.80, flatAtk: 40, effects: { extraTypes: ['ice'], bleedChance: 0.30 }, rare: true }),
    w(0,'SS','soul-reaver',     '💀', 'Жнец душ',               '×1.9 Атака +50, +ghost, +25% вампир',            9500, { atkMult: 1.90, flatAtk: 50, effects: { extraTypes: ['ghost'], vampirism: 0.25 }, rare: true }),
    w(0,'SS','blood-axe',       '🪓', 'Кровавый топор',         '×1.9 Атака +60, +45% шанс bleed',                9000, { atkMult: 1.90, flatAtk: 60, effects: { bleedChance: 0.45 }, rare: true }),
    a(0,'SS','crystal-cuirass', '💎', 'Кристальная кираса',     '×1.7 Защ +50, +30% HP, шипы 35%',                9200, { defMult: 1.70, hpMult: 1.30, flatDef: 50, effects: { thorns: 0.35 }, rare: true }),
    a(0,'SS','phoenix-feather-cloak','🔥','Плащ феникса',       '×1.6 Защ +40, +35% HP, +60% fire, +20% вампир',  9300, { defMult: 1.60, hpMult: 1.35, flatDef: 40, effects: { fireResist: 0.60, vampirism: 0.20 }, rare: true }),
    a(0,'SS','void-mantle',     '🕳️', 'Мантия пустоты',         '×1.6 Защ +40, +25% HP, +30% уворот, +30% статус',9400, { defMult: 1.60, hpMult: 1.25, flatDef: 40, effects: { dodge: 0.30, statusResist: 0.30 }, rare: true }),
    ac(0,'SS','heros-medallion','🏅', 'Медальон героя',          '×1.4 всех статов +30 ко всем',                   12000,{ atkMult: 1.40, defMult: 1.40, speedMult: 1.40, hpMult: 1.20, flatAtk: 30, flatDef: 30, flatSpd: 30, rare: true }),
    ac(0,'SS','dragon-eye',     '👁️‍🗨️','Око дракона',           '×1.5 Атака +40, +dragon, +30% крит',             9800, { atkMult: 1.50, flatAtk: 40, effects: { extraTypes: ['dragon'], critBonus: 0.30 }, rare: true }),
];

// ─── Helpers ───────────────────────────────────────────────────────

// Sliding window: items unlock at opp N, leave shop at opp N+4
export function getShopEquipment(defeatedCount: number): EquipDefV2[] {
    return EQUIPMENT_V2.filter(e => {
        if (e.rare) return false;
        const sinceUnlock = defeatedCount - e.unlockAfterOpp;
        return sinceUnlock >= 0 && sinceUnlock < 5;
    });
}

export function findEquip(id: string): EquipDefV2 | undefined {
    return EQUIPMENT_V2.find(e => e.id === id);
}

export function aggregateEffects(equipIds: (string | undefined)[]): EquipBattleEffects {
    const agg: EquipBattleEffects = {
        extraTypes: [],
        bleedChance: 0, vampirism: 0, lifesteal: 0, critBonus: 0,
        fireResist: 0, waterResist: 0, electricResist: 0, iceResist: 0,
        grassResist: 0, psychicResist: 0, rockResist: 0, groundResist: 0,
        physResist: 0, statusResist: 0, thorns: 0, dodge: 0,
    };
    for (const id of equipIds) {
        if (!id) continue;
        const def = findEquip(id);
        if (!def?.effects) continue;
        const e = def.effects;
        if (e.extraTypes) agg.extraTypes.push(...e.extraTypes);
        if (e.bleedChance)    agg.bleedChance    += e.bleedChance;
        if (e.vampirism)      agg.vampirism      += e.vampirism;
        if (e.lifesteal)      agg.lifesteal      += e.lifesteal;
        if (e.critBonus)      agg.critBonus      += e.critBonus;
        if (e.fireResist)     agg.fireResist     += e.fireResist;
        if (e.waterResist)    agg.waterResist    += e.waterResist;
        if (e.electricResist) agg.electricResist += e.electricResist;
        if (e.iceResist)      agg.iceResist      += e.iceResist;
        if (e.grassResist)    agg.grassResist    += e.grassResist;
        if (e.psychicResist)  agg.psychicResist  += e.psychicResist;
        if (e.rockResist)     agg.rockResist     += e.rockResist;
        if (e.groundResist)   agg.groundResist   += e.groundResist;
        if (e.physResist)     agg.physResist     += e.physResist;
        if (e.statusResist)   agg.statusResist   += e.statusResist;
        if (e.thorns)         agg.thorns         += e.thorns;
        if (e.dodge)          agg.dodge          += e.dodge;
    }
    // Resist soft cap — relaxed so top-tier loadouts feel impactful
    const cap = (v: number, max: number) => Math.min(max, v);
    agg.fireResist = cap(agg.fireResist, 0.7);
    agg.waterResist = cap(agg.waterResist, 0.7);
    agg.electricResist = cap(agg.electricResist, 0.7);
    agg.iceResist = cap(agg.iceResist, 0.7);
    agg.grassResist = cap(agg.grassResist, 0.7);
    agg.psychicResist = cap(agg.psychicResist, 0.7);
    agg.rockResist = cap(agg.rockResist, 0.7);
    agg.groundResist = cap(agg.groundResist, 0.7);
    agg.physResist = cap(agg.physResist, 0.65);
    agg.statusResist = cap(agg.statusResist, 0.8);
    agg.dodge = cap(agg.dodge, 0.45);
    agg.thorns = cap(agg.thorns, 0.45);
    agg.critBonus = cap(agg.critBonus, 0.55);
    agg.vampirism = cap(agg.vampirism, 0.45);
    agg.bleedChance = cap(agg.bleedChance, 0.55);
    return agg;
}

// ── Strange merchant rare items ──
export function getRareItems(): EquipDefV2[] {
    return EQUIPMENT_V2.filter(e => e.rare);
}

// ── Pick 3 random rare items for a merchant visit ──
export function pickMerchantOffers(seed: number): EquipDefV2[] {
    const rares = getRareItems();
    const out: EquipDefV2[] = [];
    const used = new Set<number>();
    let s = seed;
    while (out.length < 3 && used.size < rares.length) {
        s = (s * 1664525 + 1013904223) >>> 0;
        const i = s % rares.length;
        if (!used.has(i)) { used.add(i); out.push(rares[i]); }
    }
    return out;
}

// ── Sale price (50% of buy cost) ──
export function sellPrice(equipId: string): number {
    const def = findEquip(equipId);
    return Math.floor((def?.cost ?? 0) * 0.5);
}

// ── Build an EquipmentLoadout for an enemy automatically based on opp index ──
// Just picks the best weapon/armor unlocked before that opp + the best accessory
export function buildEnemyLoadout(oppIndex: number): { weapon?: string; armor?: string; accessory?: string } {
    // pick items unlockedAfterOpp <= oppIndex, prefer highest cost
    const candidates = EQUIPMENT_V2.filter(e => !e.rare && e.unlockAfterOpp <= oppIndex);
    const pick = (slot: EquipSlotV2): string | undefined => {
        const opts = candidates.filter(e => e.slot === slot).sort((a, b) => b.cost - a.cost);
        // pick highest, but downgrade slightly for early opponents — opp 0 gets weakest, opp 18 best
        const idx = Math.min(opts.length - 1, Math.floor(opts.length * (oppIndex / 22)));
        return opts[idx]?.id;
    };
    return { weapon: pick('weapon'), armor: pick('armor'), accessory: pick('accessory') };
}
