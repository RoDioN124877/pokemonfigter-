import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Lang = 'ru' | 'en' | 'tr' | 'kz';

interface LangState {
    lang: Lang;
    setLang: (l: Lang) => void;
}

export const useLangStore = create<LangState>()(
    persist(
        (set) => ({
            lang: 'ru',
            setLang: (lang) => set({ lang }),
        }),
        { name: 'pokemon-lang-v1' }
    )
);

// Translation dictionary — covers the menu and most-visible UI labels
type Dict = Record<string, string>;

const RU: Dict = {
    'menu.modes.1v1.title': '1 vs 1',
    'menu.modes.1v1.desc': 'Одиночная дуэль',
    'menu.modes.3v3.title': '3 vs 3',
    'menu.modes.3v3.desc': 'Командная битва',
    'menu.modes.tournament.title': 'Турнир',
    'menu.modes.tournament.desc': 'Сетка на 4–32 участника',
    'menu.modes.story.title': 'Сюжет',
    'menu.modes.story.desc': 'Кампания с прокачкой',
    'menu.modes.survival.title': 'Выживание',
    'menu.modes.survival.desc': 'Сколько волн продержишься?',
    'menu.modes.quiz.title': 'Кто это?',
    'menu.modes.quiz.desc': 'Угадай покемона по силуэту',
    'menu.modes.predict.title': 'Прогноз боя',
    'menu.modes.predict.desc': 'Угадай исход сражения',

    'menu.stat.wins': 'побед',
    'menu.stat.quizStreak': 'квиз-стрик',
    'menu.stat.tournaments': 'турниров',
    'menu.stat.waves': 'волн',
    'menu.stat.achievements': 'достижения',
    'menu.stat.history': 'история',

    'menu.lang.label': 'Язык',

    'selection.fight': 'В БОЙ!',
    'selection.random': '🎲 РАНДОМ',
    'selection.search': '🔍 Поиск по имени...',
    'selection.filters': '⚙ Фильтры',
    'selection.team': 'Команда',
    'selection.equip': '⚔️ Снаряжение',

    'survival.title': '🌊 ВЫЖИВАНИЕ',
    'survival.gameover': 'КОМАНДА ПАЛА',
    'survival.wavesCleared': 'волн пройдено',
    'survival.again': 'ЕЩЁ РАЗ',
    'survival.toMenu': 'В МЕНЮ',
    'survival.start': 'НАЧАТЬ — ВОЛНА 1',
    'survival.picked': 'Выбрано',
    'survival.record': 'Рекорд',

    'common.back': '← Назад',
    'common.menu': '← Меню',
    'common.close': '✕',
    'common.cancel': 'Отмена',
    'common.confirm': 'Подтвердить',
    'common.loading': 'Загрузка...',
};

const EN: Dict = {
    'menu.modes.1v1.title': '1 vs 1',
    'menu.modes.1v1.desc': 'Single duel',
    'menu.modes.3v3.title': '3 vs 3',
    'menu.modes.3v3.desc': 'Team battle',
    'menu.modes.tournament.title': 'Tournament',
    'menu.modes.tournament.desc': '4–32 participants bracket',
    'menu.modes.story.title': 'Story',
    'menu.modes.story.desc': 'Campaign with progression',
    'menu.modes.survival.title': 'Survival',
    'menu.modes.survival.desc': 'How many waves can you last?',
    'menu.modes.quiz.title': "Who's that?",
    'menu.modes.quiz.desc': 'Guess the silhouette',
    'menu.modes.predict.title': 'Predict',
    'menu.modes.predict.desc': 'Guess the battle outcome',

    'menu.stat.wins': 'wins',
    'menu.stat.quizStreak': 'quiz streak',
    'menu.stat.tournaments': 'tournaments',
    'menu.stat.waves': 'waves',
    'menu.stat.achievements': 'achievements',
    'menu.stat.history': 'history',

    'menu.lang.label': 'Language',

    'selection.fight': 'FIGHT!',
    'selection.random': '🎲 RANDOM',
    'selection.search': '🔍 Search by name...',
    'selection.filters': '⚙ Filters',
    'selection.team': 'Team',
    'selection.equip': '⚔️ Equipment',

    'survival.title': '🌊 SURVIVAL',
    'survival.gameover': 'TEAM FELL',
    'survival.wavesCleared': 'waves cleared',
    'survival.again': 'AGAIN',
    'survival.toMenu': 'TO MENU',
    'survival.start': 'START — WAVE 1',
    'survival.picked': 'Picked',
    'survival.record': 'Record',

    'common.back': '← Back',
    'common.menu': '← Menu',
    'common.close': '✕',
    'common.cancel': 'Cancel',
    'common.confirm': 'Confirm',
    'common.loading': 'Loading...',
};

const TR: Dict = {
    'menu.modes.1v1.title': '1 vs 1',
    'menu.modes.1v1.desc': 'Tekli düello',
    'menu.modes.3v3.title': '3 vs 3',
    'menu.modes.3v3.desc': 'Takım savaşı',
    'menu.modes.tournament.title': 'Turnuva',
    'menu.modes.tournament.desc': '4–32 katılımcılı eleme',
    'menu.modes.story.title': 'Hikâye',
    'menu.modes.story.desc': 'Gelişimli kampanya',
    'menu.modes.survival.title': 'Hayatta Kalma',
    'menu.modes.survival.desc': 'Kaç dalga dayanırsın?',
    'menu.modes.quiz.title': 'Bu kim?',
    'menu.modes.quiz.desc': 'Siluetten Pokémon’u bul',
    'menu.modes.predict.title': 'Tahmin',
    'menu.modes.predict.desc': 'Maç sonucunu tahmin et',

    'menu.stat.wins': 'zafer',
    'menu.stat.quizStreak': 'quiz serisi',
    'menu.stat.tournaments': 'turnuva',
    'menu.stat.waves': 'dalga',
    'menu.stat.achievements': 'başarılar',
    'menu.stat.history': 'geçmiş',

    'menu.lang.label': 'Dil',

    'selection.fight': 'SAVAŞ!',
    'selection.random': '🎲 RASTGELE',
    'selection.search': '🔍 İsme göre ara...',
    'selection.filters': '⚙ Filtreler',
    'selection.team': 'Takım',
    'selection.equip': '⚔️ Donanım',

    'survival.title': '🌊 HAYATTA KALMA',
    'survival.gameover': 'TAKIM DÜŞTÜ',
    'survival.wavesCleared': 'dalga geçildi',
    'survival.again': 'TEKRAR',
    'survival.toMenu': 'MENÜYE',
    'survival.start': 'BAŞLA — DALGA 1',
    'survival.picked': 'Seçildi',
    'survival.record': 'Rekor',

    'common.back': '← Geri',
    'common.menu': '← Menü',
    'common.close': '✕',
    'common.cancel': 'İptal',
    'common.confirm': 'Onayla',
    'common.loading': 'Yükleniyor...',
};

const KZ: Dict = {
    'menu.modes.1v1.title': '1-ге-1',
    'menu.modes.1v1.desc': 'Жеке шайқас',
    'menu.modes.3v3.title': '3-ке-3',
    'menu.modes.3v3.desc': 'Команда шайқасы',
    'menu.modes.tournament.title': 'Турнир',
    'menu.modes.tournament.desc': '4–32 қатысушыға арналған тор',
    'menu.modes.story.title': 'Сюжет',
    'menu.modes.story.desc': 'Дамыту кампаниясы',
    'menu.modes.survival.title': 'Аман қалу',
    'menu.modes.survival.desc': 'Қанша толқынға шыдайсың?',
    'menu.modes.quiz.title': 'Бұл кім?',
    'menu.modes.quiz.desc': 'Силуэт бойынша тап',
    'menu.modes.predict.title': 'Болжам',
    'menu.modes.predict.desc': 'Шайқас нәтижесін болжа',

    'menu.stat.wins': 'жеңіс',
    'menu.stat.quizStreak': 'квиз-серия',
    'menu.stat.tournaments': 'турнир',
    'menu.stat.waves': 'толқын',
    'menu.stat.achievements': 'жетістіктер',
    'menu.stat.history': 'тарих',

    'menu.lang.label': 'Тіл',

    'selection.fight': 'ШАЙҚАС!',
    'selection.random': '🎲 КЕЗДЕЙСОҚ',
    'selection.search': '🔍 Атпен іздеу...',
    'selection.filters': '⚙ Сүзгілер',
    'selection.team': 'Команда',
    'selection.equip': '⚔️ Жабдық',

    'survival.title': '🌊 АМАН ҚАЛУ',
    'survival.gameover': 'КОМАНДА ҚҰЛАДЫ',
    'survival.wavesCleared': 'толқын өтілді',
    'survival.again': 'ТАҒЫ',
    'survival.toMenu': 'МӘЗІРГЕ',
    'survival.start': 'БАСТА — 1-ТОЛҚЫН',
    'survival.picked': 'Таңдалды',
    'survival.record': 'Рекорд',

    'common.back': '← Артқа',
    'common.menu': '← Мәзір',
    'common.close': '✕',
    'common.cancel': 'Болдырмау',
    'common.confirm': 'Растау',
    'common.loading': 'Жүктелуде...',
};

const DICTS: Record<Lang, Dict> = { ru: RU, en: EN, tr: TR, kz: KZ };

export function t(key: string): string {
    const lang = useLangStore.getState().lang;
    return DICTS[lang]?.[key] ?? DICTS.ru[key] ?? key;
}

// React hook variant — re-renders when lang changes
import { useCallback } from 'react';
export function useT() {
    const lang = useLangStore(s => s.lang);
    return useCallback((key: string) => DICTS[lang]?.[key] ?? DICTS.ru[key] ?? key, [lang]);
}

export const LANG_OPTIONS: { id: Lang; label: string; flag: string }[] = [
    { id: 'ru', label: 'Русский', flag: '🇷🇺' },
    { id: 'en', label: 'English', flag: '🇬🇧' },
    { id: 'tr', label: 'Türkçe',  flag: '🇹🇷' },
    { id: 'kz', label: 'Қазақша', flag: '🇰🇿' },
];
