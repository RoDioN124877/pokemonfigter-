import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MAX_ID = 1010;
const BATCH = 100;
const PUBLIC_DIR = path.join(__dirname, '..', 'public');
const FRONT_DIR = path.join(PUBLIC_DIR, 'sprites', 'front');
const BACK_DIR = path.join(PUBLIC_DIR, 'sprites', 'back');
const BALLS_DIR = path.join(PUBLIC_DIR, 'sprites', 'balls');

fs.mkdirSync(FRONT_DIR, { recursive: true });
fs.mkdirSync(BACK_DIR, { recursive: true });
fs.mkdirSync(BALLS_DIR, { recursive: true });

async function downloadFile(url, dest) {
    if (fs.existsSync(dest)) return true;
    try {
        const r = await fetch(url);
        if (!r.ok) return false;
        const buf = Buffer.from(await r.arrayBuffer());
        fs.writeFileSync(dest, buf);
        return true;
    } catch { return false; }
}

async function main() {
    // ── Pokemon sprites ──
    console.log(`Downloading ${MAX_ID} front + back sprites...`);
    let downloaded = 0;
    let skipped = 0;

    for (let start = 1; start <= MAX_ID; start += BATCH) {
        const end = Math.min(start + BATCH - 1, MAX_ID);
        const ids = [];
        for (let i = start; i <= end; i++) ids.push(i);

        await Promise.all(ids.map(async id => {
            const frontUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;
            const backUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/back/${id}.png`;
            const f = await downloadFile(frontUrl, path.join(FRONT_DIR, `${id}.png`));
            const b = await downloadFile(backUrl, path.join(BACK_DIR, `${id}.png`));
            if (f) downloaded++;
            else skipped++;
            if (b) downloaded++;
            else skipped++;
        }));

        console.log(`  sprites: ${downloaded} downloaded, ${skipped} missing (up to #${end})`);
    }

    // ── Pokeball sprites ──
    console.log('Downloading pokeball sprites...');
    const balls = [
        'poke-ball', 'great-ball', 'ultra-ball', 'master-ball',
        'premier-ball', 'safari-ball', 'net-ball', 'dive-ball',
        'nest-ball', 'repeat-ball', 'timer-ball', 'luxury-ball',
        'dusk-ball', 'heal-ball', 'quick-ball', 'cherish-ball',
    ];

    for (const name of balls) {
        const url = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/${name}.png`;
        const ok = await downloadFile(url, path.join(BALLS_DIR, `${name}.png`));
        console.log(`  ${name}: ${ok ? 'OK' : 'MISSING'}`);
    }

    // ── Summary ──
    const countFiles = (dir) => fs.existsSync(dir) ? fs.readdirSync(dir).length : 0;
    console.log(`\nDone!`);
    console.log(`  Front sprites: ${countFiles(FRONT_DIR)}`);
    console.log(`  Back sprites: ${countFiles(BACK_DIR)}`);
    console.log(`  Ball sprites: ${countFiles(BALLS_DIR)}`);
}

main().catch(console.error);
