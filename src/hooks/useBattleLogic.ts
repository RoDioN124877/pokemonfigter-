import { useState, useMemo, useCallback, useEffect } from "react";
import type { Pokemon, BattleFighter, BattleState, BattleStats, DamageType, TurnQueueItem, WeatherType } from "../types/Pokemon";
import { emptyStats } from "../types/Pokemon";
import SFX from "../utils/soundUtils";
import {
    createBattleFighter,
    calculateDamage,
    tryApplyStatus,
    applyDotDamage,
    applyEntryEffects,
    applyRoughSkin,
} from "../utils/battleUtils";

type TeamKey = 'p1' | 'p2';

const initializeFighters = (team1: Pokemon[], team2: Pokemon[], maxSize: 1 | 3, team1HP?: number[]): Record<string, BattleFighter> => {
    const f: Record<string, BattleFighter> = {};
    for (let i = 0; i < maxSize; i++) {
        if (team1[i]) f[`p1-${i + 1}`] = createBattleFighter(team1[i], team1HP?.[i]);
        if (team2[i]) f[`p2-${i + 1}`] = createBattleFighter(team2[i]);
    }
    return f;
};

const getActiveKey = (f: Record<string, BattleFighter>, team: TeamKey, maxSize: number): string | null => {
    for (let i = 1; i <= maxSize; i++) {
        const k = `${team}-${i}`;
        if (f[k]?.currentHP > 0) return k;
    }
    return null;
};

interface DamageEntry { amount: number; type: DamageType; isCrit?: boolean; timestamp: number }

interface BattleLogic {
    battleState: BattleState;
    activeSlots: { p1: number; p2: number };
    turnQueueVisual: TurnQueueItem[];
    startBattle: () => void;
    resetBattle: () => void;
    animations: Record<string, string>;
    damageQueue: Record<string, DamageEntry[]>;
}

const useBattleLogic = (team1: Pokemon[], team2: Pokemon[], maxSize: 1 | 3, battleSpeed = 1, team1HP?: number[]): BattleLogic => {
    const [battleState, setBattleState] = useState<BattleState>({
        fighters: initializeFighters(team1, team2, maxSize, team1HP),
        isBattleActive: false,
        isProcessing: false,
        winner: null,
        log: ["Ожидание начала боя..."],
        weather: 'none',
        weatherTurns: 0,
        battleStats: emptyStats(),
    });
    const [attackingTeam, setAttackingTeam] = useState<TeamKey>('p1');
    const [animations, setAnimations] = useState<Record<string, string>>({});
    const [damageQueue, setDamageQueue] = useState<Record<string, DamageEntry[]>>({});

    const activeSlots = useMemo(() => {
        const s = { p1: 1, p2: 1 };
        for (let i = 1; i <= maxSize; i++) if (battleState.fighters[`p1-${i}`]?.currentHP > 0) { s.p1 = i; break; }
        for (let i = 1; i <= maxSize; i++) if (battleState.fighters[`p2-${i}`]?.currentHP > 0) { s.p2 = i; break; }
        return s;
    }, [battleState.fighters, maxSize]);

    const checkWin = useCallback((f: Record<string, BattleFighter>): 1 | 2 | null => {
        const p1 = Object.keys(f).some(k => k.startsWith('p1') && f[k].currentHP > 0);
        const p2 = Object.keys(f).some(k => k.startsWith('p2') && f[k].currentHP > 0);
        if (!p1) return 2; if (!p2) return 1; return null;
    }, []);

    const turnQueueVisual = useMemo((): TurnQueueItem[] => {
        if (!battleState.isBattleActive && battleState.winner === null) return [];
        const other: TeamKey = attackingTeam === 'p1' ? 'p2' : 'p1';
        return ([attackingTeam, other] as TeamKey[])
            .map(team => getActiveKey(battleState.fighters, team, maxSize))
            .filter(Boolean)
            .map((key, i) => {
                const f = battleState.fighters[key!];
                return { key: key!, name: f.name, img: f.imageFront, isCurrent: i === 0 };
            });
    }, [battleState.fighters, battleState.isBattleActive, battleState.winner, attackingTeam, maxSize]);

    const pushDmg = useCallback((key: string, entry: DamageEntry) => {
        setDamageQueue(q => ({ ...q, [key]: [...(q[key] || []), entry] }));
    }, []);

    // Очищаем анимацию через 800мс после её появления
    // Это заменяет setTimeout внутри updater-функции — корректный side-effect в useEffect
    useEffect(() => {
        if (Object.keys(animations).length === 0) return;
        const timer = setTimeout(() => setAnimations({}), 800);
        return () => clearTimeout(timer);
    }, [animations]);

    const runBattleTurn = useCallback(() => {
        setBattleState(prev => {
            if (!prev.isBattleActive || prev.winner !== null) return prev;

            const nf = { ...prev.fighters };
            const log = [...prev.log];
            const other: TeamKey = attackingTeam === 'p1' ? 'p2' : 'p1';

            const atkKey = getActiveKey(nf, attackingTeam, maxSize);
            const defKey = getActiveKey(nf, other, maxSize);
            if (!atkKey || !defKey) {
                return { ...prev, isBattleActive: false, winner: checkWin(nf) };
            }

            const atk: BattleFighter = { ...nf[atkKey], status: { ...nf[atkKey].status } };
            const def: BattleFighter = { ...nf[defKey], status: { ...nf[defKey].status } };
            nf[atkKey] = atk; nf[defKey] = def;

            let entryWeather: WeatherType | undefined;

            // --- Speed Boost ---
            if (atk.abilityNames.includes('speed-boost')) {
                atk.speedMult = (atk.speedMult ?? 1) * 1.15;
                const spdPct = Math.round((atk.speedMult - 1) * 100);
                if (spdPct % 30 < 16)
                    log.unshift(`⚡ ${atk.name}: РАЗГОН +${spdPct}% скорость!`);
            }

            // --- Regenerator: +10% HP за ход ---
            if (atk.abilityNames.includes('regenerator') && atk.currentHP < atk.initialHP) {
                const regen = Math.max(1, Math.floor(atk.initialHP * 0.10));
                atk.currentHP = Math.min(atk.initialHP, atk.currentHP + regen);
                log.unshift(`💚 ${atk.name}: РЕГЕНЕРАЦИЯ +${regen} HP`);
                pushDmg(atkKey, { amount: regen, type: 'heal', timestamp: Date.now() });
            }

            // --- Shed Skin: 30% снять статус ---
            if (atk.abilityNames.includes('shed-skin') && Object.values(atk.status).some(Boolean) && Math.random() < 0.30) {
                const cured = (Object.keys(atk.status) as (keyof typeof atk.status)[]).find(s => atk.status[s]);
                if (cured) {
                    delete atk.status[cured];
                    log.unshift(`🐍 ${atk.name}: ЛИНЬКА — статус снят!`);
                }
            }

            // --- БАГ ИСПРАВЛЕН: Песчаная буря только для атакующего ---
            // Каждый покемон получает урон ровно 1 раз за свой ход (≈ 1 раз за полный раунд)
            if (prev.weather === 'sand') {
                const sandImmune = (f: BattleFighter) => {
                    const t1 = f.pok.types?.[0]?.type.name ?? '';
                    const t2 = f.pok.types?.[1]?.type.name ?? '';
                    return ['rock', 'ground', 'steel'].some(t => t === t1 || t === t2)
                        || f.abilityNames.some(a => ['magic-guard', 'sand-veil', 'sand-rush', 'sand-force', 'overcoat'].includes(a));
                };
                if (!sandImmune(atk)) {
                    const dmg = Math.max(1, Math.floor(atk.initialHP * 0.03));
                    atk.currentHP = Math.max(0, atk.currentHP - dmg);
                    log.unshift(`🏜️ Песчаная буря: ${atk.name} -${dmg} HP`);
                    pushDmg(atkKey, { amount: dmg, type: 'dot', timestamp: Date.now() });
                }
            }

            // --- DoT: ожог / яд (PSN или TOX) ---
            if (atk.status.burn || atk.status.poison) {
                const { damage, log: dotLog } = applyDotDamage(atk);
                if (damage > 0) {
                    atk.currentHP = Math.max(0, atk.currentHP - damage);
                    if (dotLog) log.unshift(dotLog);
                    pushDmg(atkKey, { amount: damage, type: 'dot', timestamp: Date.now() + 1 });
                }
            }
            // --- Bleed DoT ---
            if (atk.status.bleed && atk.bleedTurns > 0) {
                const dmg = Math.max(1, Math.floor(atk.initialHP * 0.04));
                atk.currentHP = Math.max(0, atk.currentHP - dmg);
                atk.bleedTurns--;
                log.unshift(`🩸 ${atk.name} истекает кровью: -${dmg} HP (осталось ${atk.bleedTurns})`);
                pushDmg(atkKey, { amount: dmg, type: 'dot', timestamp: Date.now() + 2 });
                if (atk.bleedTurns <= 0) delete atk.status.bleed;
            }
            if (atk.currentHP <= 0) {
                log.unshift(`❌ ${atk.name} падает от статусного урона!`);
                setAttackingTeam(other);
                const winner = checkWin(nf);
                return { ...prev, fighters: nf, log, winner, isBattleActive: winner === null };
            }

            // --- Сон / Заморозка (канонные статусы) ---
            if (atk.status.sleep || atk.status.freeze) {
                const isSleeping = !!atk.status.sleep;
                atk.sleepTurns = Math.max(0, atk.sleepTurns - 1);
                const wakeChance = isSleeping ? 0.33 : 0.25;
                if (atk.sleepTurns <= 0 || Math.random() < wakeChance) {
                    if (isSleeping) { delete atk.status.sleep; log.unshift(`💤 ${atk.name} просыпается!`); }
                    else            { delete atk.status.freeze; log.unshift(`🧊 ${atk.name} оттаивает!`); }
                    atk.sleepTurns = 0;
                    // Первый ход после пробуждения — пропуск (как в оригинале)
                    setAttackingTeam(other);
                    return { ...prev, fighters: nf, log };
                }
                log.unshift(isSleeping ? `💤 ${atk.name} крепко спит...` : `🧊 ${atk.name} заморожен!`);
                setAttackingTeam(other);
                return { ...prev, fighters: nf, log };
            }

            // --- Паралич: 25% пропуск хода ---
            if (atk.status.paralysis && Math.random() < 0.25) {
                log.unshift(`⚡ ${atk.name} парализован и пропускает ход!`);
                setAttackingTeam(other);
                return { ...prev, fighters: nf, log };
            }

            // --- Замешательство: удар по себе ---
            if (atk.status.confusion && Math.random() < 0.33) {
                const dmg = Math.max(1, Math.floor(atk.initialHP * 0.12));
                atk.currentHP = Math.max(0, atk.currentHP - dmg);
                log.unshift(`😵 ${atk.name} ударил себя в замешательстве (${dmg} урон)!`);
                pushDmg(atkKey, { amount: dmg, type: 'dot', timestamp: Date.now() });
                setAttackingTeam(other);
                return { ...prev, fighters: nf, log, winner: checkWin(nf) };
            }

            // --- Атака ---
            const result = calculateDamage(atk, def, prev.weather);

            // БАГ ИСПРАВЛЕН: Flash Fire активируется при поглощении огня
            if (result.triggerFlashFire && !def.flashFireActive) {
                def.flashFireActive = true;
                log.unshift(`🔥 ${def.name}: ОГНЕЩИТ активирован — огневые атаки усилены!`);
            }

            // Собираем статистику иммутабельно
            const newStats: BattleStats = { ...prev.battleStats };

            if (result.healAmount > 0) {
                def.currentHP = Math.min(def.initialHP, def.currentHP + result.healAmount);
                log.unshift(`💚 ${def.name} восстанавливает ${result.healAmount} HP! (${result.logMessage})`);
                pushDmg(defKey, { amount: result.healAmount, type: 'heal', timestamp: Date.now() });
            } else if (!result.missed) {
                // Sturdy: выжить с 1 HP при полном HP
                if (def.abilityNames.includes('sturdy') && !def.sturdyUsed && def.currentHP >= def.initialHP && result.damage >= def.currentHP) {
                    def.currentHP = 1;
                    def.sturdyUsed = true;
                    log.unshift(`🗿 ${def.name} выжил благодаря КРЕПОСТИ!`);
                    pushDmg(defKey, { amount: result.damage - 1, type: 'normal', isCrit: result.isCrit, timestamp: Date.now() });
                } else {
                    def.currentHP = Math.max(0, def.currentHP - result.damage);
                    pushDmg(defKey, { amount: result.damage, type: result.isCrit ? 'critical' : 'normal', isCrit: result.isCrit, timestamp: Date.now() });
                }

                // Статистика — иммутабельно
                if (attackingTeam === 'p1') { newStats.p1DamageDealt += result.damage; if (result.isCrit) newStats.p1Crits++; }
                else                        { newStats.p2DamageDealt += result.damage; if (result.isCrit) newStats.p2Crits++; }
                newStats.totalTurns++;

                if (result.isCrit) SFX.crit(); else SFX.hit();

                let attackLog = `➡️ ${atk.name} → ${def.name}: ${result.damage} урона`;
                if (result.logMessage) attackLog += ` (${result.logMessage})`;
                if (result.isCrit) attackLog += ' 💥 КРИТ!';
                log.unshift(attackLog);

                // Анимация атаки — через setAnimations (side effect в updater, но работает стабильно)
                // Очистка через useEffect + setTimeout вне updater-а
                setAnimations(a => ({
                    ...a,
                    [atkKey]: `anim-attack-${attackingTeam}`,
                    [defKey]: 'anim-hit',
                }));

                // Rough Skin / Iron Barbs
                const { damage: rsDmg, log: rsLog } = applyRoughSkin(atk, def);
                if (rsDmg > 0) {
                    atk.currentHP = Math.max(0, atk.currentHP - rsDmg);
                    log.unshift(rsLog);
                    pushDmg(atkKey, { amount: rsDmg, type: 'dot', timestamp: Date.now() + 1 });
                }

                // Equipment: Vampirism — heal % of damage dealt
                if (atk.equipEffects.vampirism > 0 && result.damage > 0) {
                    const heal = Math.max(1, Math.floor(result.damage * atk.equipEffects.vampirism));
                    const actualHeal = Math.min(heal, atk.initialHP - atk.currentHP);
                    if (actualHeal > 0) {
                        atk.currentHP += actualHeal;
                        log.unshift(`🩸 Вампиризм: ${atk.name} восстанавливает ${actualHeal} HP`);
                        pushDmg(atkKey, { amount: actualHeal, type: 'heal', timestamp: Date.now() + 3 });
                    }
                }

                // Equipment: Bleed chance — apply 3-turn bleed to defender
                if (atk.equipEffects.bleedChance > 0 && !def.status.bleed && Math.random() < atk.equipEffects.bleedChance) {
                    def.status.bleed = true;
                    def.bleedTurns = 3;
                    log.unshift(`🩸 ${def.name} получает КРОВОТЕЧЕНИЕ! (3 хода)`);
                }

                // Equipment: Thorns — reflect % of damage taken
                if (def.equipEffects.thorns > 0 && result.damage > 0) {
                    const reflect = Math.max(1, Math.floor(result.damage * def.equipEffects.thorns));
                    atk.currentHP = Math.max(0, atk.currentHP - reflect);
                    log.unshift(`💢 Шипы: ${atk.name} получает ${reflect} ответного урона`);
                    pushDmg(atkKey, { amount: reflect, type: 'dot', timestamp: Date.now() + 4 });
                }

                // Контактные способности
                if (result.contactAbility && !atk.status[result.contactAbility]) {
                    atk.status[result.contactAbility] = true;
                    log.unshift(result.contactMsg);
                }

                // Статус от типа атакующего
                const { status: appStatus, text: statusText, isToxic, sleepTurns } = tryApplyStatus(atk, result.attackType);
                if (appStatus && !def.status[appStatus]) {
                    def.status[appStatus] = true;
                    if (isToxic) def.isToxic = true;
                    if (sleepTurns) def.sleepTurns = sleepTurns;
                    log.unshift(`⚠️ ${def.name} ${statusText}`);
                    SFX.status();
                }
            } else {
                log.unshift(`💨 ${atk.name} промахнулся! (${result.logMessage})`);
            }

            // --- KO + эффекты выхода нового покемона ---
            if (def.currentHP <= 0) {
                log.unshift(`❌ ${def.name} выбывает!`);
                SFX.ko();

                if (attackingTeam === 'p1') newStats.p1KOs++;
                else newStats.p2KOs++;

                if (atk.abilityNames.includes('moxie')) {
                    atk.atkMult = (atk.atkMult ?? 1) * 1.25;
                    log.unshift(`🎯 ${atk.name}: КУРАЖ — атака возрастает!`);
                }

                const nextDefKey = getActiveKey(nf, other, maxSize);
                if (nextDefKey && nextDefKey !== defKey) {
                    log.unshift(`🔄 На поле выходит ${nf[nextDefKey].name}!`);
                    const nextDef = { ...nf[nextDefKey], status: { ...nf[nextDefKey].status } };
                    nf[nextDefKey] = nextDef;
                    const { msgs: entryMsgs, newWeather: entryWt } = applyEntryEffects(nextDef, atk);
                    entryMsgs.forEach(m => log.unshift(m));
                    if (entryWt) entryWeather = entryWt;
                }
            }

            // --- Погода: длительность 5 раундов (10 ходов атаки = канон) ---
            let updatedWeather: WeatherType = entryWeather ?? prev.weather;
            let updatedWeatherTurns = prev.weatherTurns;
            if (updatedWeather !== 'none') {
                updatedWeatherTurns++;
                if (updatedWeatherTurns >= 10) {
                    updatedWeather = 'none';
                    updatedWeatherTurns = 0;
                    log.unshift(`🌤️ Погода нормализовалась!`);
                }
            }

            // --- Смена атакующего ---
            setAttackingTeam(other);

            const winner = checkWin(nf);
            return {
                ...prev,
                fighters: nf,
                log,
                winner,
                isBattleActive: winner === null,
                weather: updatedWeather,
                weatherTurns: updatedWeatherTurns,
                battleStats: newStats,
            };
        });
    }, [attackingTeam, checkWin, maxSize, pushDmg]);

    useEffect(() => {
        if (!battleState.isBattleActive || battleState.winner !== null) return;
        const timer = setTimeout(runBattleTurn, Math.round(1100 / battleSpeed));
        return () => clearTimeout(timer);
    }, [battleState.isBattleActive, battleState.winner, runBattleTurn, battleSpeed]);

    const startBattle = useCallback(() => {
        const nf = initializeFighters(team1, team2, maxSize, team1HP);

        const p1Key = getActiveKey(nf, 'p1', maxSize);
        const p2Key = getActiveKey(nf, 'p2', maxSize);
        const log: string[] = [];

        let startWeather: WeatherType = 'none';
        if (p1Key && p2Key) {
            const p1f = nf[p1Key]; const p2f = nf[p2Key];
            const { msgs: m1, newWeather: wt1 } = applyEntryEffects(p1f, p2f);
            const { msgs: m2, newWeather: wt2 } = applyEntryEffects(p2f, p1f);
            m1.forEach(m => log.push(m));
            m2.forEach(m => log.push(m));
            startWeather = wt1 ?? wt2 ?? 'none';
        }

        // ИСПРАВЛЕН: паралич снижает скорость на 50% (канон Gen VII+, было -30%)
        const calcSpeed = (key: string | null): number => {
            if (!key) return 0;
            const f = nf[key];
            let spd = f.statsMap.speed * (f.speedMult ?? 1);
            if (f.status.paralysis) spd *= 0.50;
            if (f.status.slow) spd *= 0.65;
            return spd;
        };
        const p1Spd = calcSpeed(p1Key);
        const p2Spd = calcSpeed(p2Key);
        const ratio = Math.max(p1Spd, p2Spd) / Math.max(1, Math.min(p1Spd, p2Spd));
        const fasterTeam: TeamKey = p1Spd >= p2Spd ? 'p1' : 'p2';
        const first: TeamKey = ratio < 1.15 ? (Math.random() < 0.5 ? 'p1' : 'p2') : fasterTeam;
        const firstName = first === 'p1' ? nf[p1Key!]?.name : nf[p2Key!]?.name;
        const speedNote = ratio < 1.15 ? '(скорости равны — жребий!)' : '(по скорости)';
        log.unshift(`⚔️ БИТВА! Первым ходит ${firstName ?? first} ${speedNote}`);

        setAttackingTeam(first);
        SFX.start();
        setBattleState({
            fighters: nf,
            isBattleActive: true,
            isProcessing: false,
            winner: null,
            log,
            weather: startWeather,
            weatherTurns: 0,
            battleStats: emptyStats(),
        });
        setDamageQueue({});
        setAnimations({});
    }, [team1, team2, maxSize, team1HP]);

    const resetBattle = useCallback(() => {
        setBattleState({
            fighters: initializeFighters(team1, team2, maxSize, team1HP),
            isBattleActive: false,
            isProcessing: false,
            winner: null,
            log: ["Ожидание начала боя..."],
            weather: 'none',
            weatherTurns: 0,
            battleStats: emptyStats(),
        });
        setAttackingTeam('p1');
        setAnimations({});
        setDamageQueue({});
    }, [team1, team2, maxSize, team1HP]);

    return { battleState, activeSlots, turnQueueVisual, startBattle, resetBattle, animations, damageQueue };
};

export default useBattleLogic;
