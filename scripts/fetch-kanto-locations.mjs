import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, '..', 'src', 'data', 'kantoLocations.json');

const LOCATIONS = [
    { id: 88,  key: 'route-1',         name: 'Маршрут 1',          emoji: '🌿', color: '#22c55e', desc: 'Тихая тропа из Палет-тауна. Слабые покемоны — идеально для начала.' },
    { id: 99,  key: 'route-2',         name: 'Маршрут 2',          emoji: '🌳', color: '#16a34a', desc: 'Лесная дорога к Вирижиан-форесту. Жуки и птицы.' },
    { id: 155, key: 'viridian-forest', name: 'Вирижиан Форест',    emoji: '🐛', color: '#65a30d', desc: 'Густой лес полный жуков. Если повезёт — встретишь Пикачу!' },
    { id: 80,  key: 'mt-moon',         name: 'Гора Мун',           emoji: '🌙', color: '#a78bfa', desc: 'Тёмная пещера с редкими Клефейри и опасными Зубатами.' },
    { id: 109, key: 'route-3',         name: 'Маршрут 3',          emoji: '🛤️', color: '#059669', desc: 'Дорога к горе Мун. Тренеры и дикие Спиро.' },
    { id: 120, key: 'route-4',         name: 'Маршрут 4',          emoji: '⛰️', color: '#0d9488', desc: 'Скалистая дорога после горы Мун. Сандшрю и Экансы.' },
    { id: 87,  key: 'rock-tunnel',     name: 'Каменный туннель',   emoji: '🪨', color: '#78716c', desc: 'Кромешная тьма! Нужна вспышка. Оникс, Геодуд, Мачоп.' },
    { id: 103, key: 'route-24',        name: 'Мост Наггет',        emoji: '🌉', color: '#0ea5e9', desc: 'Знаменитый мост к северу от Серулиан-сити. Разнообразные покемоны.' },
    { id: 104, key: 'route-25',        name: 'Маршрут 25',         emoji: '🏖️', color: '‌#06b6d4', desc: 'Мыс Билла. Абра, Одиш и другие.' },
    { id: 160, key: 'pokemon-tower',   name: 'Башня покемонов',    emoji: '👻', color: '#7c3aed', desc: 'Жуткая башня в Лавендер-тауне. Гастли и Хонтеры бродят этажами.' },
    { id: 162, key: 'safari-zone',     name: 'Сафари-зона',        emoji: '🦏', color: '#d97706', desc: 'Редкие покемоны! Тауросы, Кангасханы, Скайтеры и Пинсиры.' },
    { id: 158, key: 'power-plant',     name: 'Электростанция',     emoji: '⚡', color: '#eab308', desc: 'Заброшенная ЭС. Вольторбы, Магнемайты и легендарный Запдос.' },
    { id: 136, key: 'seafoam-islands', name: 'Острова Сифом',      emoji: '🧊', color: '#38bdf8', desc: 'Ледяные пещеры. Силы, Шеллдеры и легендарный Артикуно.' },
    { id: 161, key: 'pokemon-mansion', name: 'Покемон Мэншн',      emoji: '🏚️', color: '#f97316', desc: 'Заброшенный особняк на Циннабар. Коффинги, Граймеры и Дитто.' },
    { id: 159, key: 'victory-road',    name: 'Дорога победы',      emoji: '🏆', color: '#dc2626', desc: 'Финальное испытание перед Лигой. Мачоки, Ониксы, Молтрес!' },
    { id: 147, key: 'cerulean-cave',   name: 'Серулиан Кейв',      emoji: '🔮', color: '#c026d3', desc: 'Запретная пещера. Сильнейшие дикие покемоны и... Мьюту.' },
];

const VALID_VERSIONS = new Set([
    'red', 'blue', 'yellow', 'gold', 'silver', 'crystal',
    'firered', 'leafgreen', 'heartgold', 'soulsilver',
    'lets-go-pikachu', 'lets-go-eevee',
]);

const delay = (ms) => new Promise(r => setTimeout(r, ms));

async function fetchJson(url) {
    const r = await fetch(url);
    if (!r.ok) throw new Error(`${r.status} ${url}`);
    return r.json();
}

function pokemonIdFromUrl(url) {
    const m = url.match(/\/pokemon\/(\d+)\//);
    return m ? Number(m[1]) : 0;
}

async function main() {
    const result = [];

    for (const loc of LOCATIONS) {
        console.log(`Fetching location ${loc.key} (id=${loc.id})...`);
        const locData = await fetchJson(`https://pokeapi.co/api/v2/location/${loc.id}/`);
        const areas = locData.areas || [];
        console.log(`  ${areas.length} area(s)`);

        const encounterMap = new Map(); // pokemonId -> { id, chance, minLevel, maxLevel }

        for (const area of areas) {
            await delay(200);
            console.log(`  Fetching area: ${area.name}`);
            const areaData = await fetchJson(area.url);

            for (const enc of areaData.pokemon_encounters) {
                const pokId = pokemonIdFromUrl(enc.pokemon.url);
                if (pokId === 0 || pokId > 1010) continue;

                for (const vd of enc.version_details) {
                    if (!VALID_VERSIONS.has(vd.version.name)) continue;

                    for (const ed of vd.encounter_details) {
                        const existing = encounterMap.get(pokId);
                        if (existing) {
                            existing.chance = Math.max(existing.chance, ed.chance);
                            existing.minLevel = Math.min(existing.minLevel, ed.min_level);
                            existing.maxLevel = Math.max(existing.maxLevel, ed.max_level);
                        } else {
                            encounterMap.set(pokId, {
                                id: pokId,
                                chance: ed.chance,
                                minLevel: ed.min_level,
                                maxLevel: ed.max_level,
                            });
                        }
                    }
                }
            }
        }

        const encounters = [...encounterMap.values()]
            .filter(e => e.id <= 1010)
            .sort((a, b) => b.chance - a.chance);

        console.log(`  → ${encounters.length} unique pokemon`);

        result.push({
            key: loc.key,
            name: loc.name,
            emoji: loc.emoji,
            color: loc.color,
            desc: loc.desc,
            encounters,
        });
    }

    fs.writeFileSync(OUT, JSON.stringify(result, null, 2));
    console.log(`\nDone! Saved ${result.length} locations to ${OUT}`);
    for (const loc of result) {
        console.log(`  ${loc.name}: ${loc.encounters.length} pokemon`);
    }
}

main().catch(console.error);
