// ── Achievement definitions ──────────────────────────────────────
// Each achievement reads progress from the global counters object.
// value(c) >= target → unlocked.

export interface AchievementCounters {
    battlesPlayed: number;
    battlesWon: number;
    totalCrits: number;
    totalKOs: number;
    flawlessWins: number;
    longestBattle: number;
    maxDamageBattle: number;
    tournamentsWon: number;
    tournamentsPlayed: number;
    quizCorrect: number;
    quizBestStreak: number;
    quizGames: number;
    predictCorrect: number;
    predictBestStreak: number;
    favoritesMax: number;
    shinyCaught: number;
    nightBattles: number;
    survivalBestWave: number;
    storyChampion: number;
    storyComplete: number;
    storyChampionDay: number;
    storyCompleteDay: number;
    tournamentWonDay: number;
}

export const emptyCounters = (): AchievementCounters => ({
    battlesPlayed: 0, battlesWon: 0, totalCrits: 0, totalKOs: 0,
    flawlessWins: 0, longestBattle: 0, maxDamageBattle: 0,
    tournamentsWon: 0, tournamentsPlayed: 0,
    quizCorrect: 0, quizBestStreak: 0, quizGames: 0,
    predictCorrect: 0, predictBestStreak: 0,
    favoritesMax: 0, shinyCaught: 0, nightBattles: 0,
    survivalBestWave: 0, storyChampion: 0, storyComplete: 0,
    storyChampionDay: 999, storyCompleteDay: 999, tournamentWonDay: 999,
});

export interface AchievementDef {
    id: string;
    icon: string;
    name: string;
    desc: string;
    target: number;
    value: (c: AchievementCounters) => number;
    rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export const ACHIEVEMENTS: AchievementDef[] = [
    // ── Battles ──
    { id: 'first-blood',    icon: '🩸', name: 'Первая кровь',      desc: 'Выиграй свой первый бой',                target: 1,   value: c => c.battlesWon,      rarity: 'common' },
    { id: 'veteran',        icon: '🎖️', name: 'Ветеран',            desc: 'Выиграй 10 боёв',                        target: 10,  value: c => c.battlesWon,      rarity: 'common' },
    { id: 'warlord',        icon: '👑', name: 'Полководец',         desc: 'Выиграй 50 боёв',                        target: 50,  value: c => c.battlesWon,      rarity: 'epic' },
    { id: 'addicted',       icon: '🎮', name: 'Втянулся',           desc: 'Сыграй 25 боёв',                         target: 25,  value: c => c.battlesPlayed,   rarity: 'common' },
    { id: 'no-life',        icon: '🌀', name: 'Здесь навсегда',     desc: 'Сыграй 100 боёв',                        target: 100, value: c => c.battlesPlayed,   rarity: 'epic' },
    { id: 'flawless',       icon: '💎', name: 'Безупречно',         desc: 'Победи, не потеряв ни одного покемона (3v3)', target: 1, value: c => c.flawlessWins,  rarity: 'rare' },
    { id: 'flawless-5',     icon: '🛡️', name: 'Неприкасаемый',      desc: '5 безупречных побед',                    target: 5,   value: c => c.flawlessWins,    rarity: 'epic' },
    { id: 'marathon',       icon: '⏳', name: 'Марафонец',          desc: 'Бой длиной 30+ ходов',                   target: 30,  value: c => c.longestBattle,   rarity: 'rare' },
    { id: 'nuker',          icon: '☢️', name: 'Ядерный удар',       desc: 'Нанеси 600+ урона за один бой',          target: 600, value: c => c.maxDamageBattle, rarity: 'rare' },
    { id: 'night-owl',      icon: '🦉', name: 'Ночная сова',        desc: 'Сыграй бой между 00:00 и 05:00',         target: 1,   value: c => c.nightBattles,    rarity: 'rare' },

    // ── Crits & KOs ──
    { id: 'crit-novice',    icon: '💥', name: 'Точно в цель',       desc: 'Нанеси 25 критических ударов',           target: 25,  value: c => c.totalCrits,      rarity: 'common' },
    { id: 'crit-master',    icon: '🎯', name: 'Снайпер',            desc: 'Нанеси 100 критических ударов',          target: 100, value: c => c.totalCrits,      rarity: 'epic' },
    { id: 'ko-collector',   icon: '🥊', name: 'Нокаутёр',           desc: '25 нокаутов',                            target: 25,  value: c => c.totalKOs,        rarity: 'common' },
    { id: 'ko-legend',      icon: '🏅', name: 'Легенда ринга',      desc: '100 нокаутов',                           target: 100, value: c => c.totalKOs,        rarity: 'epic' },

    // ── Tournament ──
    { id: 'tourney-first',  icon: '🏆', name: 'Чемпион',            desc: 'Выиграй турнир',                         target: 1,   value: c => c.tournamentsWon,  rarity: 'rare' },
    { id: 'tourney-king',   icon: '👑', name: 'Король арены',       desc: 'Выиграй 5 турниров',                     target: 5,   value: c => c.tournamentsWon,  rarity: 'legendary' },

    // ── Quiz ──
    { id: 'quiz-first',     icon: '🧠', name: 'Кто этот покемон?',  desc: 'Угадай первого покемона в квизе',        target: 1,   value: c => c.quizCorrect,     rarity: 'common' },
    { id: 'quiz-streak-5',  icon: '🔥', name: 'В ударе',            desc: 'Стрик 5 в квизе',                        target: 5,   value: c => c.quizBestStreak,  rarity: 'common' },
    { id: 'quiz-streak-10', icon: '⚡', name: 'Энциклопедия',       desc: 'Стрик 10 в квизе',                       target: 10,  value: c => c.quizBestStreak,  rarity: 'rare' },
    { id: 'quiz-streak-20', icon: '🌟', name: 'Профессор Оук',      desc: 'Стрик 20 в квизе',                       target: 20,  value: c => c.quizBestStreak,  rarity: 'legendary' },
    { id: 'quiz-50',        icon: '📚', name: 'Покедекс в голове',  desc: '50 верных ответов в квизе',              target: 50,  value: c => c.quizCorrect,     rarity: 'rare' },

    // ── Predictions ──
    { id: 'predict-first',  icon: '🔮', name: 'Провидец',           desc: 'Угадай исход боя',                       target: 1,   value: c => c.predictCorrect,     rarity: 'common' },
    { id: 'predict-streak', icon: '🎰', name: 'Букмекер',           desc: '5 верных прогнозов подряд',              target: 5,   value: c => c.predictBestStreak,  rarity: 'rare' },
    { id: 'predict-oracle', icon: '🧿', name: 'Оракул',             desc: '10 верных прогнозов подряд',             target: 10,  value: c => c.predictBestStreak,  rarity: 'legendary' },
    { id: 'predict-25',     icon: '📈', name: 'Аналитик',           desc: '25 верных прогнозов',                    target: 25,  value: c => c.predictCorrect,     rarity: 'rare' },

    // ── Story ──
    { id: 'story-champion',  icon: '👑', name: 'Чемпион Канто',     desc: 'Победи Чемпиона Блу в сюжете',           target: 1,   value: c => c.storyChampion, rarity: 'epic' },
    { id: 'story-complete',  icon: '🧬', name: 'Конец истории',     desc: 'Заверши все 4 акта сюжетной кампании',   target: 1,   value: c => c.storyComplete, rarity: 'legendary' },

    // ── Survival ──
    { id: 'survival-3',     icon: '🌊', name: 'Волнорез',           desc: 'Продержись 3 волны в Выживании',         target: 3,   value: c => c.survivalBestWave, rarity: 'common' },
    { id: 'survival-6',     icon: '🌪️', name: 'Несокрушимый',       desc: 'Продержись 6 волн в Выживании',          target: 6,   value: c => c.survivalBestWave, rarity: 'epic' },
    { id: 'survival-10',    icon: '🌋', name: 'Последний герой',    desc: 'Продержись 10 волн в Выживании',         target: 10,  value: c => c.survivalBestWave, rarity: 'legendary' },

    // ── Speed runs ──
    { id: 'speed-champ-30', icon: '🏃', name: 'Быстрый тренер',     desc: 'Победи чемпиона до дня 30',              target: 1,   value: c => c.storyChampionDay <= 30 ? 1 : 0,   rarity: 'rare' },
    { id: 'speed-champ-20', icon: '⚡', name: 'Спидраннер',          desc: 'Победи чемпиона до дня 20',              target: 1,   value: c => c.storyChampionDay <= 20 ? 1 : 0,   rarity: 'epic' },
    { id: 'speed-champ-15', icon: '🚀', name: 'Молния Канто',       desc: 'Победи чемпиона до дня 15',              target: 1,   value: c => c.storyChampionDay <= 15 ? 1 : 0,   rarity: 'legendary' },
    { id: 'speed-story-40', icon: '📖', name: 'Полный финиш',       desc: 'Заверши всю кампанию до дня 40',         target: 1,   value: c => c.storyCompleteDay <= 40 ? 1 : 0,   rarity: 'epic' },
    { id: 'speed-story-25', icon: '💨', name: 'Не задержался',      desc: 'Заверши всю кампанию до дня 25',         target: 1,   value: c => c.storyCompleteDay <= 25 ? 1 : 0,   rarity: 'legendary' },
    { id: 'speed-tourney',  icon: '🏅', name: 'Ранний чемпион',     desc: 'Выиграй турнир до дня 10',               target: 1,   value: c => c.tournamentWonDay <= 10 ? 1 : 0,   rarity: 'epic' },

    // ── Misc ──
    { id: 'collector',      icon: '⭐', name: 'Коллекционер',       desc: 'Добавь 10 покемонов в избранное',        target: 10,  value: c => c.favoritesMax,    rarity: 'common' },
    { id: 'shiny-hunter',   icon: '✨', name: 'Охотник за блеском', desc: 'Поймай шайни-покемона в сюжете',         target: 1,   value: c => c.shinyCaught,     rarity: 'legendary' },
];

export const RARITY_LABELS: Record<AchievementDef['rarity'], { label: string; color: string }> = {
    common:    { label: 'Обычное',     color: '#94a3b8' },
    rare:      { label: 'Редкое',      color: '#38bdf8' },
    epic:      { label: 'Эпическое',   color: '#a78bfa' },
    legendary: { label: 'Легендарное', color: '#facc15' },
};
