// Yandex Games SDK wrapper
// Safe to import anywhere — gracefully no-ops outside the Yandex Games iframe.

interface YSDKFeatures {
    LoadingAPI?: { ready: () => void };
    GameplayAPI?: { start: () => void; stop: () => void };
}

interface YSDKPlayer {
    setData: (data: Record<string, unknown>, flush?: boolean) => Promise<void>;
    getData: (keys?: string[]) => Promise<Record<string, unknown>>;
}

interface LBEntry {
    rank: number;
    score: number;
    player: { publicName: string };
}

interface YSDKLeaderboards {
    setLeaderboardScore: (name: string, score: number) => Promise<void>;
    getLeaderboardEntries: (
        name: string,
        opts?: { includeUser?: boolean; quantityAround?: number; quantityTop?: number }
    ) => Promise<{ entries: LBEntry[]; userEntry?: LBEntry }>;
}

interface YSDKAdv {
    showRewardedVideo: (opts: { callbacks: RewardedAdCallbacks }) => void;
}

interface YSDK {
    features: YSDKFeatures;
    environment?: { i18n?: { lang?: string } };
    getPlayer: (opts?: { scopes?: boolean }) => Promise<YSDKPlayer>;
    leaderboards: YSDKLeaderboards;
    adv: YSDKAdv;
}

declare const YaGames: { init: () => Promise<YSDK> } | undefined;

let sdk: YSDK | null = null;
let sdkPlayer: YSDKPlayer | null = null;

function waitForYaGames(timeout = 5000): Promise<boolean> {
    if (typeof YaGames !== 'undefined') return Promise.resolve(true);
    return new Promise(resolve => {
        const start = Date.now();
        const check = () => {
            if (typeof YaGames !== 'undefined') return resolve(true);
            if (Date.now() - start > timeout) return resolve(false);
            setTimeout(check, 100);
        };
        check();
    });
}

export async function initYSDK(): Promise<void> {
    const available = await waitForYaGames();
    if (!available || typeof YaGames === 'undefined') return;
    try {
        sdk = await YaGames.init();
        // NOTE: LoadingAPI.ready() is NOT called here — call markGameReady()
        // when the UI is actually interactive (first screen rendered).
        const lang = sdk.environment?.i18n?.lang;
        if (lang) document.documentElement.lang = lang;
        try {
            sdkPlayer = await sdk.getPlayer({ scopes: false });
        } catch {
            // Anonymous player — Player API unavailable
        }
    } catch {
        // Not in Yandex environment — ignore
    }
}

/** Call once when the game UI is rendered and interactive (Yandex moderation). */
let readySent = false;
export function markGameReady(): void {
    if (readySent) return;
    readySent = true;
    sdk?.features.LoadingAPI?.ready();
}

/** Language from the Yandex environment ('ru', 'en', …); null outside Yandex. */
export function getYandexLang(): string | null {
    return sdk?.environment?.i18n?.lang ?? null;
}

// ── Gameplay marks (deduplicated — safe to call from any mode) ────
let gameplayActive = false;

/** Call when active gameplay starts (required for Yandex moderation) */
export function gameplayStart(): void {
    if (gameplayActive) return;
    gameplayActive = true;
    sdk?.features.GameplayAPI?.start();
}

/** Call when gameplay pauses / menu opens (required for Yandex moderation) */
export function gameplayStop(): void {
    if (!gameplayActive) return;
    gameplayActive = false;
    sdk?.features.GameplayAPI?.stop();
}

// ── Cloud Save (full meta bundle, timestamp-resolved) ─────────────

// Every localStorage key that should survive a device switch.
const CLOUD_SYNC_KEYS = [
    'pokemon-progress-v3',       // story campaign
    'pokemon-achievements-v1',   // achievements + counters
    'pokemon-battle-history-v1', // battle history
    'pokemon-story-v1',          // story progress (opponent index, etc.)
    'pokemon-day-v1',            // day system, training, fatigue
    'pokemon-quickequip-v1',     // quick equip presets
    'pok-quiz-best',
    'pok-predict-best',
    'pok-survival-best',
    'pok-favorites',
    'pok-dlg-seen',
] as const;

const CLOUD_BUNDLE_KEY = 'pokemon-save-bundle';
const LOCAL_TS_KEY = 'pok-last-save-ts';

interface CloudBundle {
    savedAt: number;
    data: Record<string, string>;
}

/** Upload all known progress keys to Yandex cloud as one bundle. */
export async function cloudSaveAll(): Promise<void> {
    if (!sdkPlayer) return;
    const data: Record<string, string> = {};
    for (const k of CLOUD_SYNC_KEYS) {
        const v = localStorage.getItem(k);
        if (v !== null) data[k] = v;
    }
    const bundle: CloudBundle = { savedAt: Date.now(), data };
    localStorage.setItem(LOCAL_TS_KEY, String(bundle.savedAt));
    try {
        await sdkPlayer.setData({ [CLOUD_BUNDLE_KEY]: JSON.stringify(bundle) }, true);
    } catch { /* ignore — local state remains */ }
}

// Debounced save: call freely after any progress event.
let saveTimer: ReturnType<typeof setTimeout> | null = null;
export function scheduleCloudSave(delayMs = 4000): void {
    if (!sdkPlayer) return;
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(() => { saveTimer = null; cloudSaveAll(); }, delayMs);
}

/**
 * Restore the cloud bundle if it is NEWER than the local save.
 * Returns true when localStorage was overwritten (caller should reload stores).
 */
export async function cloudRestoreAll(): Promise<boolean> {
    if (!sdkPlayer) return false;
    try {
        const raw = await sdkPlayer.getData([CLOUD_BUNDLE_KEY]);
        const json = raw[CLOUD_BUNDLE_KEY] as string | undefined;
        if (!json) return false;
        const bundle = JSON.parse(json) as CloudBundle;
        if (!bundle?.data) return false;

        const localTs = parseInt(localStorage.getItem(LOCAL_TS_KEY) ?? '0', 10) || 0;
        const hasAnyLocal = CLOUD_SYNC_KEYS.some(k => localStorage.getItem(k) !== null);

        // Apply cloud when local is empty, or the cloud bundle is strictly newer
        if (!hasAnyLocal || bundle.savedAt > localTs) {
            for (const [k, v] of Object.entries(bundle.data)) {
                localStorage.setItem(k, v);
            }
            localStorage.setItem(LOCAL_TS_KEY, String(bundle.savedAt));
            return true;
        }
        return false;
    } catch {
        return false;
    }
}

// ── Rewarded Ads ──────────────────────────────────────────────────

export interface RewardedAdCallbacks {
    onOpen?: () => void;
    onRewarded: () => void;
    onClose?: () => void;
    onError?: (err: unknown) => void;
}

/** Show a rewarded video ad. Outside Yandex, rewards immediately (for dev/test). */
export function showRewardedAd(callbacks: RewardedAdCallbacks): void {
    if (!sdk) {
        callbacks.onRewarded();
        callbacks.onClose?.();
        return;
    }
    // Pause gameplay marks while the ad is on screen (Yandex requirement)
    const wasActive = gameplayActive;
    const wrapped: RewardedAdCallbacks = {
        onOpen: () => { gameplayStop(); callbacks.onOpen?.(); },
        onRewarded: callbacks.onRewarded,
        onClose: () => { if (wasActive) gameplayStart(); callbacks.onClose?.(); },
        onError: (err) => { if (wasActive) gameplayStart(); callbacks.onError?.(err); },
    };
    try {
        sdk.adv.showRewardedVideo({ callbacks: wrapped });
    } catch (err) {
        wrapped.onError?.(err);
    }
}

// ── Reward calculation for rewarded ads ───────────────────────────
// Scales with hero level + defeated count so it feels meaningful as
// the player progresses (200₽ at level 1 → 6000₽ at level 30).
export function calcAdReward(heroLevel: number, defeatedCount: number, source: 'hunt-defeat' | 'story-defeat' | 'merchant-bonus'): number {
    const base = 200 + heroLevel * 220 + defeatedCount * 80;
    switch (source) {
        case 'story-defeat':    return Math.floor(base * 2.0);
        case 'hunt-defeat':     return Math.floor(base * 1.4);
        case 'merchant-bonus':  return Math.floor(base * 1.6);
    }
}

// ── Leaderboard ───────────────────────────────────────────────────

const LB_BOSS_RUSH = 'pokemon-boss-rush';

export async function submitBossRushScore(score: number): Promise<void> {
    if (!sdk) return;
    try {
        await sdk.leaderboards.setLeaderboardScore(LB_BOSS_RUSH, score);
    } catch { /* ignore */ }
}

export interface PublicLBEntry {
    rank: number;
    name: string;
    score: number;
}

export async function fetchBossRushLeaderboard(): Promise<PublicLBEntry[]> {
    if (!sdk) return [];
    try {
        const { entries } = await sdk.leaderboards.getLeaderboardEntries(LB_BOSS_RUSH, {
            includeUser: true,
            quantityAround: 3,
            quantityTop: 10,
        });
        return entries.map(e => ({
            rank: e.rank,
            name: e.player.publicName || 'Тренер',
            score: e.score,
        }));
    } catch {
        return [];
    }
}
