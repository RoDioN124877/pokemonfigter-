export interface StarterTeam {
    id: string;
    name: string;
    emoji: string;
    description: string;
    playstyle: string;
    difficulty: 'Лёгкая' | 'Средняя' | 'Сложная';
    color: string;
    pokemonIds: [number, number, number];
    strengths: string[];
    weaknesses: string[];
}

export const STARTER_TEAMS: StarterTeam[] = [
    {
        id: 'water',
        name: 'МОРСКОЙ АЛЬЯНС',
        emoji: '🌊',
        description: 'Надёжные водные бойцы. Разносят скалы, огонь и землю. Лучший старт для новичков.',
        playstyle: 'Танки / Универсалы',
        difficulty: 'Лёгкая',
        color: '#3b82f6',
        pokemonIds: [7, 60, 120],  // Squirtle, Poliwag, Staryu
        strengths: ['Броук 🪨', 'Блейн 🔥', 'Джованни 🌍'],
        weaknesses: ['Серж ⚡', 'Эрика 🌿'],
    },
    {
        id: 'nature',
        name: 'ДУХИ ПРИРОДЫ',
        emoji: '🌿',
        description: 'Трава + Земля = полное покрытие. Яды и сон изматывают врага, а Норов пробивает электро.',
        playstyle: 'Статус / Контроль',
        difficulty: 'Средняя',
        color: '#22c55e',
        pokemonIds: [1, 43, 50],   // Bulbasaur, Oddish, Diglett
        strengths: ['Броук 🪨', 'Мисти 💧', 'Серж ⚡'],
        weaknesses: ['Эрика 🌿', 'Блейн 🔥'],
    },
    {
        id: 'fire',
        name: 'ПЛАМЯ И ЯРОСТЬ',
        emoji: '🔥',
        description: 'Огонь жжёт всё. Мэнки прикрывает слабость против камня. Агрессивный и опасный стиль.',
        playstyle: 'Агрессия / Скорость',
        difficulty: 'Сложная',
        color: '#ef4444',
        pokemonIds: [4, 37, 56],   // Charmander, Vulpix, Mankey
        strengths: ['Эрика 🌿', 'Лорелей ❄️', 'Агата 👻'],
        weaknesses: ['Мисти 💧 (тяжело)', 'Сабрина 🔮'],
    },
    {
        id: 'electric',
        name: 'ЭЛЕКТРИЧЕСКИЙ ШТОРМ',
        emoji: '⚡',
        description: 'Молнии + вода + нормал-тип. Пикачу молниеносен, Тентакул берёт скалы водой, Додуо держит нейтраль.',
        playstyle: 'Спецатака / Скорость',
        difficulty: 'Средняя',
        color: '#eab308',
        pokemonIds: [25, 72, 84],  // Pikachu, Tentacool, Doduo
        strengths: ['Мисти 💧', 'Лорелей ❄️', 'Бруно 💪'],
        weaknesses: ['Эрика 🌿', 'Кога 💜'],
    },
    {
        id: 'fighter',
        name: 'КУЛАК СТАЛИ',
        emoji: '👊',
        description: 'Файтеры разносят камень, лёд и нормал. Кубон с Ground прикрывает электро. Мощная физическая команда.',
        playstyle: 'Физический урон',
        difficulty: 'Средняя',
        color: '#f97316',
        pokemonIds: [56, 66, 104], // Mankey, Machop, Cubone
        strengths: ['Броук 🪨', 'Серж ⚡', 'Лорелей ❄️', 'Бруно 💪'],
        weaknesses: ['Мисти 💧', 'Сабрина 🔮'],
    },
];
