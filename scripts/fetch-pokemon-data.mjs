import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MAX_ID = 1010;
const BATCH = 50;
const OUT = path.join(__dirname, '..', 'src', 'data', 'pokemonBundle.json');

async function fetchJson(url) {
    const r = await fetch(url);
    if (!r.ok) throw new Error(`${r.status} ${url}`);
    return r.json();
}

async function main() {
    console.log(`Fetching ${MAX_ID} pokemon...`);

    const allPokemon = [];

    for (let start = 1; start <= MAX_ID; start += BATCH) {
        const end = Math.min(start + BATCH - 1, MAX_ID);
        const ids = [];
        for (let i = start; i <= end; i++) ids.push(i);

        const batch = await Promise.all(
            ids.map(async id => {
                try {
                    const d = await fetchJson(`https://pokeapi.co/api/v2/pokemon/${id}`);
                    const statsMap = {};
                    d.stats.forEach(s => { statsMap[s.stat.name] = s.base_stat; });
                    return {
                        id: d.id,
                        name: d.name,
                        types: d.types,
                        sprites: {
                            front_default: d.sprites.front_default || '',
                            back_default: d.sprites.back_default || '',
                        },
                        statsMap: {
                            hp: statsMap['hp'] || 0,
                            attack: statsMap['attack'] || 0,
                            defense: statsMap['defense'] || 0,
                            speed: statsMap['speed'] || 0,
                            'special-attack': statsMap['special-attack'] || 0,
                            'special-defense': statsMap['special-defense'] || 0,
                        },
                        stats: d.stats,
                        height: d.height,
                        weight: d.weight,
                        abilities: d.abilities,
                    };
                } catch (e) {
                    console.warn(`  Skip #${id}: ${e.message}`);
                    return null;
                }
            })
        );

        allPokemon.push(...batch.filter(Boolean));
        console.log(`  ${allPokemon.length}/${MAX_ID}`);
    }

    // Also fetch type->pokemon mappings
    console.log('Fetching type mappings...');
    const typeList = await fetchJson('https://pokeapi.co/api/v2/type?limit=30');
    const typeMappings = {};

    for (const t of typeList.results) {
        const data = await fetchJson(t.url);
        typeMappings[t.name] = data.pokemon
            .map(p => {
                const parts = p.pokemon.url.split('/');
                return parseInt(parts[parts.length - 2], 10);
            })
            .filter(id => id > 0 && id <= MAX_ID);
        console.log(`  ${t.name}: ${typeMappings[t.name].length} pokemon`);
    }

    const bundle = {
        pokemon: allPokemon,
        typeMappings,
    };

    fs.writeFileSync(OUT, JSON.stringify(bundle));
    const sizeMB = (fs.statSync(OUT).size / 1024 / 1024).toFixed(2);
    console.log(`Done! ${allPokemon.length} pokemon saved to ${OUT} (${sizeMB} MB)`);
}

main().catch(console.error);
