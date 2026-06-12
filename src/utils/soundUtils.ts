let _ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
    try {
        if (!_ctx) _ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        if (_ctx.state === 'suspended') _ctx.resume();
        return _ctx;
    } catch { return null; }
}

function tone(freq: number, dur: number, type: OscillatorType = 'square', vol = 0.12) {
    const c = getCtx(); if (!c) return;
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.connect(gain); gain.connect(c.destination);
    osc.type = type;
    osc.frequency.setValueAtTime(freq, c.currentTime);
    gain.gain.setValueAtTime(vol, c.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + dur);
    osc.start(); osc.stop(c.currentTime + dur + 0.01);
}

function sweep(from: number, to: number, dur: number, type: OscillatorType = 'square', vol = 0.12) {
    const c = getCtx(); if (!c) return;
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.connect(gain); gain.connect(c.destination);
    osc.type = type;
    osc.frequency.setValueAtTime(from, c.currentTime);
    osc.frequency.linearRampToValueAtTime(to, c.currentTime + dur);
    gain.gain.setValueAtTime(vol, c.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + dur);
    osc.start(); osc.stop(c.currentTime + dur + 0.01);
}

let _muted = localStorage.getItem('sfx-muted') === '1';

const raw = {
    hit:    () => { tone(200, 0.05, 'square', 0.14); sweep(280, 140, 0.07, 'square', 0.08); },
    crit:   () => { tone(500, 0.04, 'square', 0.2); tone(700, 0.06, 'square', 0.18); sweep(700, 280, 0.1, 'square', 0.15); },
    ko:     () => { sweep(300, 70, 0.35, 'square', 0.15); setTimeout(() => tone(60, 0.25, 'square', 0.12), 200); },
    start:  () => { [220, 277, 330, 440].forEach((f, i) => setTimeout(() => tone(f, 0.15, 'square', 0.13), i * 90)); },
    status: () => sweep(400, 240, 0.13, 'sawtooth', 0.09),
    heal:   () => { tone(523, 0.07, 'sine', 0.1); setTimeout(() => tone(659, 0.1, 'sine', 0.08), 60); },
    select: () => tone(440, 0.04, 'sine', 0.07),
    champ:  () => { [262, 330, 392, 523, 659, 784, 1047].forEach((f, i) => setTimeout(() => tone(f, 0.22, 'square', 0.14), i * 110)); },
};

type SFXKey = keyof typeof raw;
const SFX = {} as typeof raw;
(Object.keys(raw) as SFXKey[]).forEach(k => {
    (SFX as any)[k] = () => { if (!_muted) (raw as any)[k](); };
});

export default SFX;

export const toggleMute = (): boolean => {
    _muted = !_muted;
    localStorage.setItem('sfx-muted', _muted ? '1' : '0');
    return _muted;
};
export const isMuted = () => _muted;
