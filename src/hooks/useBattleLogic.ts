import { useState, useMemo, useCallback, useEffect } from "react";
import type { Pokemon, BattleFighter, BattleState, DamageType, TurnQueueItem } from "../types/Pokemon";
import { createBattleFighter, calculateDamage, tryApplyStatus, applyDotDamage } from "../utils/battleUtils";

const initializeFighters = (team1: Pokemon[], team2: Pokemon[], maxSize: 1 | 3): Record<string, BattleFighter> => {
    const fighters: Record<string, BattleFighter> = {};
    for (let i = 0; i < maxSize; i++) {
        if (team1[i]) fighters[`p1-${i + 1}`] = createBattleFighter(team1[i]);
        if (team2[i]) fighters[`p2-${i + 1}`] = createBattleFighter(team2[i]);
    }
    return fighters;
};

const initializeTurnQueue = (fighters: Record<string, BattleFighter>): string[] => {
    return Object.entries(fighters)
        .filter(([, f]) => f.currentHP > 0)
        .sort(([, a], [, b]) => b.statsMap.speed - a.statsMap.speed)
        .map(([key]) => key);
};

interface BattleLogic {
    battleState: BattleState;
    activeSlots: { p1: number; p2: number };
    turnQueueVisual: TurnQueueItem[];
    startBattle: () => void;
    resetBattle: () => void;
    animations: Record<string, string>;
    damageQueue: Record<string, { amount: number; type: DamageType; isCrit?: boolean; timestamp: number }[]>;
}

const useBattleLogic = (team1: Pokemon[], team2: Pokemon[], maxSize: 1 | 3): BattleLogic => {
    const [battleState, setBattleState] = useState<BattleState>({
        fighters: initializeFighters(team1, team2, maxSize),
        isBattleActive: false,
        isProcessing: false,
        winner: null,
        log: ["Ожидание начала боя..."],
    });

    const [turnQueue, setTurnQueue] = useState<string[]>([]);
    const [currentTurnIndex, setCurrentTurnIndex] = useState(0);
    const [animations, setAnimations] = useState<Record<string, string>>({});
    const [damageQueue, setDamageQueue] = useState<Record<string, { amount: number; type: DamageType; isCrit?: boolean; timestamp: number }[]>>({});

    // Определяем активные слоты (кто сейчас стоит спереди)
    const activeSlots = useMemo(() => {
        const slots = { p1: 1, p2: 1 };
        for (let i = 1; i <= maxSize; i++) {
            if (battleState.fighters[`p1-${i}`]?.currentHP > 0) {
                slots.p1 = i;
                break;
            }
        }
        for (let i = 1; i <= maxSize; i++) {
            if (battleState.fighters[`p2-${i}`]?.currentHP > 0) {
                slots.p2 = i;
                break;
            }
        }
        return slots;
    }, [battleState.fighters, maxSize]);

    const checkWin = useCallback((fighters: Record<string, BattleFighter>): 1 | 2 | null => {
        const team1Alive = Object.keys(fighters).some(k => k.startsWith('p1') && fighters[k].currentHP > 0);
        const team2Alive = Object.keys(fighters).some(k => k.startsWith('p2') && fighters[k].currentHP > 0);
        if (!team1Alive) return 2;
        if (!team2Alive) return 1;
        return null;
    }, []);

    const turnQueueVisual = useMemo(() => {
        if (!turnQueue.length) return [];
        const activeQueue = turnQueue.filter(key => battleState.fighters[key]?.currentHP > 0);
        
        let currentIndexInActive = activeQueue.indexOf(turnQueue[currentTurnIndex]);
        if (currentIndexInActive === -1) currentIndexInActive = 0;

        const shiftedQueue = [
            ...activeQueue.slice(currentIndexInActive), 
            ...activeQueue.slice(0, currentIndexInActive)
        ];

        return shiftedQueue.slice(0, 5).map((key, index) => {
            const fighter = battleState.fighters[key];
            return { 
                key, 
                name: fighter.name, 
                img: fighter.imageFront,
                isCurrent: index === 0,
            };
        });
    }, [turnQueue, currentTurnIndex, battleState.fighters]);

    const runBattleTurn = useCallback(() => {
        setBattleState(prev => {
            const newFighters = { ...prev.fighters };
            const log = [...prev.log];
            
            const currentFighterKey = turnQueue[currentTurnIndex];
            
            // Если бойца нет или он мертв — переход хода
            if (!currentFighterKey || newFighters[currentFighterKey].currentHP <= 0) {
                const nextQueue = initializeTurnQueue(newFighters);
                const newIndex = nextQueue.length > 0 ? (currentTurnIndex + 1) % nextQueue.length : 0;
                setTurnQueue(nextQueue);
                setCurrentTurnIndex(newIndex);
                return { ...prev, fighters: newFighters, log, winner: checkWin(newFighters) };
            }
            
            const attacker = newFighters[currentFighterKey];
            const targetTeam = currentFighterKey.startsWith('p1') ? 'p2' : 'p1';

            // --- 1. Урон от статусов (DoT) ---
            if (attacker.status.burn || attacker.status.poison) {
                const { damage, log: dotLog } = applyDotDamage(attacker);
                if (damage > 0) {
                    attacker.currentHP = Math.max(0, attacker.currentHP - damage);
                    if (dotLog) log.unshift(dotLog);
                    
                    setDamageQueue(prevQ => ({
                        ...prevQ,
                        [currentFighterKey]: [
                            ...(prevQ[currentFighterKey] || []),
                            { amount: damage, type: 'dot', timestamp: Date.now() }
                        ]
                    }));
                }
            }

            if (attacker.currentHP <= 0) {
                log.unshift(`❌ ${attacker.name} падает от статусного урона!`);
                const nextQueue = initializeTurnQueue(newFighters);
                const newIndex = nextQueue.length > 0 ? (currentTurnIndex + 1) % nextQueue.length : 0;
                setCurrentTurnIndex(newIndex);
                setTurnQueue(nextQueue);
                return { ...prev, fighters: newFighters, log, winner: checkWin(newFighters) };
            }

            // --- 2. Поиск цели ---
            const targetKey = Object.keys(newFighters).find(k => k.startsWith(targetTeam) && newFighters[k].currentHP > 0);
            if (!targetKey) { 
                return { ...prev, isBattleActive: false, winner: checkWin(newFighters) };
            }
            
            const defender = newFighters[targetKey];
            
            // --- 3. Атака ---
            const { damage, isCrit, logMessage } = calculateDamage(attacker, defender);
            defender.currentHP = Math.max(0, defender.currentHP - damage);
            
            let attackLog = `➡️ ${attacker.name} атакует ${defender.name}. Нанесено ${damage} урона.`;
            if (logMessage) attackLog += ` (${logMessage})`;
            log.unshift(attackLog);

            // Анимации
            setAnimations(prevAnim => ({
                ...prevAnim,
                [currentFighterKey]: `anim-attack-${currentFighterKey.startsWith('p1') ? 'p1' : 'p2'}`,
                [targetKey]: 'anim-hit'
            }));

            // Цифры урона
            setDamageQueue(prevQ => ({
                ...prevQ,
                [targetKey]: [
                    ...(prevQ[targetKey] || []),
                    { 
                        amount: damage, 
                        type: isCrit ? 'critical' : 'normal', 
                        isCrit,
                        timestamp: Date.now() 
                    }
                ]
            }));

            // --- 4. Наложение статуса ---
            const { status: appliedStatus, text: statusText } = tryApplyStatus(attacker);
            if (appliedStatus && !defender.status[appliedStatus]) {
                defender.status[appliedStatus] = true;
                log.unshift(`⚠️ ${defender.name} ${statusText}`);
            }
            
            if (defender.currentHP <= 0) {
                log.unshift(`❌ ${defender.name} падает!`);
            }
            
            // --- 5. Подготовка следующего хода ---
            const nextQueue = initializeTurnQueue(newFighters);
            const newIndex = nextQueue.length > 0 ? (currentTurnIndex + 1) % nextQueue.length : 0;
            
            setCurrentTurnIndex(newIndex);
            setTurnQueue(nextQueue);

            // Сброс анимации
            setTimeout(() => {
                setAnimations({});
            }, 800);

            return { ...prev, fighters: newFighters, log, winner: checkWin(newFighters) };
        });
    }, [currentTurnIndex, turnQueue, checkWin]);

    useEffect(() => {
        let timer: ReturnType<typeof setTimeout> | null = null;
        if (battleState.isBattleActive && battleState.winner === null) {
            timer = setTimeout(runBattleTurn, 2000);
        }
        return () => {
            if (timer) clearTimeout(timer);
        };
    }, [battleState.isBattleActive, battleState.winner, runBattleTurn]);

    const startBattle = useCallback(() => {
        const initialFighters = initializeFighters(team1, team2, maxSize);
        const initialQueue = initializeTurnQueue(initialFighters);
        
        setTurnQueue(initialQueue);
        setCurrentTurnIndex(0);
        
        setBattleState({
            fighters: initialFighters,
            isBattleActive: true,
            isProcessing: false,
            winner: null,
            log: ["БИТВА НАЧАТА! Определена очередность хода по скорости."],
        });
        setDamageQueue({});
    }, [team1, team2, maxSize]);

    const resetBattle = useCallback(() => {
        setBattleState({
            fighters: initializeFighters(team1, team2, maxSize),
            isBattleActive: false,
            isProcessing: false,
            winner: null,
            log: ["Ожидание начала боя..."],
        });
        setTurnQueue([]);
        setCurrentTurnIndex(0);
        setAnimations({});
        setDamageQueue({});
    }, [team1, team2, maxSize]);

    return {
        battleState,
        activeSlots,
        turnQueueVisual,
        startBattle,
        resetBattle,
        animations,
        damageQueue,
    };
};

export default useBattleLogic;