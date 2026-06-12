import { create } from 'zustand';
import type { Pokemon } from '../types/Pokemon';
import {
    fetchAllEntries,
    fetchPokemonsByIds,
    fetchPokemonIdsByType,
    PAGE_SIZE,
    type ListEntry,
} from '../services/ApiService';

export type SortField = 'id' | 'name' | 'hp' | 'attack' | 'defense' | 'speed';

const GEN_RANGES: [number, number][] = [
    [1, 151], [152, 251], [252, 386], [387, 493],
    [494, 649], [650, 721], [722, 809], [810, 905], [906, 1010],
];

interface PokemonStore {
    allEntries: ListEntry[];
    cache: Record<number, Pokemon>;
    currentPagePokemons: Pokemon[];
    currentPage: number;
    totalPages: number;
    searchTerm: string;
    filterType: string | null;
    generation: number | null;
    sortBy: SortField;
    sortDir: 'asc' | 'desc';
    typeIdCache: Record<string, number[]>;
    isLoadingList: boolean;
    isLoadingPage: boolean;
    favorites: number[];
    showOnlyFavorites: boolean;

    init: () => Promise<void>;
    setPage: (page: number) => Promise<void>;
    setSearch: (term: string) => Promise<void>;
    setFilterType: (type: string | null) => Promise<void>;
    setGeneration: (gen: number | null) => Promise<void>;
    setSort: (by: SortField) => Promise<void>;
    getRandomPokemons: (count: number) => Promise<Pokemon[]>;
    toggleFavorite: (id: number) => Promise<void>;
    setShowOnlyFavorites: (v: boolean) => Promise<void>;
}

function loadFavorites(): number[] {
    try { return JSON.parse(localStorage.getItem('pok-favorites') ?? '[]'); } catch { return []; }
}

function saveFavorites(ids: number[]) {
    localStorage.setItem('pok-favorites', JSON.stringify(ids));
}

function applyFilters(
    allEntries: ListEntry[],
    cache: Record<number, Pokemon>,
    typeIdCache: Record<string, number[]>,
    term: string,
    filterType: string | null,
    generation: number | null,
    sortBy: SortField,
    sortDir: 'asc' | 'desc',
    favorites: number[],
    showOnlyFavorites: boolean,
): ListEntry[] {
    let entries = allEntries;

    // 1. Name search
    if (term.trim()) {
        const lower = term.toLowerCase();
        entries = entries.filter(e => e.name.includes(lower));
    }

    // 2. Generation (ID range, no pokemon data needed)
    if (generation !== null && GEN_RANGES[generation - 1]) {
        const [min, max] = GEN_RANGES[generation - 1];
        entries = entries.filter(e => e.id >= min && e.id <= max);
    }

    // 3. Type filter (requires typeIdCache to be populated first)
    if (filterType !== null && typeIdCache[filterType]) {
        const ids = new Set(typeIdCache[filterType]);
        entries = entries.filter(e => ids.has(e.id));
    }

    // 3b. Favorites filter
    if (showOnlyFavorites && favorites.length > 0) {
        const favSet = new Set(favorites);
        entries = entries.filter(e => favSet.has(e.id));
    }

    // 4. Sort
    if (sortBy === 'name') {
        entries = [...entries].sort((a, b) =>
            sortDir === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name),
        );
    } else if (sortBy === 'id') {
        entries = sortDir === 'desc' ? [...entries].reverse() : entries;
    } else {
        // Stat sort: split cached / uncached, sort cached by stat, append uncached
        const cached: ListEntry[] = [];
        const uncached: ListEntry[] = [];
        for (const e of entries) {
            (cache[e.id] ? cached : uncached).push(e);
        }
        cached.sort((a, b) => {
            const va = cache[a.id]!.statsMap[sortBy] ?? 0;
            const vb = cache[b.id]!.statsMap[sortBy] ?? 0;
            return sortDir === 'asc' ? va - vb : vb - va;
        });
        entries = [...cached, ...uncached];
    }

    return entries;
}

async function loadPage(
    entries: ListEntry[],
    cache: Record<number, Pokemon>,
    page: number,
): Promise<{ pokemons: Pokemon[]; newCache: Record<number, Pokemon> }> {
    const start = (page - 1) * PAGE_SIZE;
    const pageEntries = entries.slice(start, start + PAGE_SIZE);
    const missing = pageEntries.filter(e => !cache[e.id]).map(e => e.id);

    let newCache = cache;
    if (missing.length > 0) {
        const fetched = await fetchPokemonsByIds(missing);
        newCache = { ...cache };
        fetched.forEach(p => { newCache[p.id] = p; });
    }

    const pokemons = pageEntries.map(e => newCache[e.id]).filter(Boolean) as Pokemon[];
    return { pokemons, newCache };
}

export const usePokemonStore = create<PokemonStore>((set, get) => ({
    allEntries: [],
    cache: {},
    currentPagePokemons: [],
    currentPage: 1,
    totalPages: 1,
    searchTerm: '',
    filterType: null,
    generation: null,
    sortBy: 'id',
    sortDir: 'asc',
    typeIdCache: {},
    isLoadingList: false,
    isLoadingPage: false,
    favorites: loadFavorites(),
    showOnlyFavorites: false,

    init: async () => {
        set({ isLoadingList: true });
        try {
            const entries = await fetchAllEntries();
            const totalPages = Math.max(1, Math.ceil(entries.length / PAGE_SIZE));
            set({ allEntries: entries, totalPages, isLoadingList: false });
            await get().setPage(1);
        } catch {
            set({ isLoadingList: false });
        }
    },

    setPage: async (page: number) => {
        const { allEntries, searchTerm, filterType, generation, sortBy, sortDir, cache, typeIdCache, favorites, showOnlyFavorites } = get();
        const filtered = applyFilters(allEntries, cache, typeIdCache, searchTerm, filterType, generation, sortBy, sortDir, favorites, showOnlyFavorites);
        const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
        const clamped = Math.max(1, Math.min(page, totalPages));
        set({ currentPage: clamped, totalPages, isLoadingPage: true });
        const { pokemons, newCache } = await loadPage(filtered, cache, clamped);
        set({ currentPagePokemons: pokemons, cache: newCache, isLoadingPage: false });
    },

    setSearch: async (term: string) => {
        const { allEntries, filterType, generation, sortBy, sortDir, cache, typeIdCache, favorites, showOnlyFavorites } = get();
        const filtered = applyFilters(allEntries, cache, typeIdCache, term, filterType, generation, sortBy, sortDir, favorites, showOnlyFavorites);
        const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
        set({ searchTerm: term, currentPage: 1, totalPages, isLoadingPage: true });
        const { pokemons, newCache } = await loadPage(filtered, cache, 1);
        set({ currentPagePokemons: pokemons, cache: newCache, isLoadingPage: false });
    },

    setFilterType: async (type: string | null) => {
        let { typeIdCache, allEntries, searchTerm, generation, sortBy, sortDir, cache, favorites, showOnlyFavorites } = get();

        // Fetch type IDs from PokeAPI if not cached yet
        if (type !== null && !typeIdCache[type]) {
            set({ isLoadingPage: true });
            try {
                const ids = await fetchPokemonIdsByType(type);
                typeIdCache = { ...typeIdCache, [type]: ids };
                set({ typeIdCache });
            } catch {
                set({ isLoadingPage: false });
                return;
            }
        }

        const filtered = applyFilters(allEntries, cache, typeIdCache, searchTerm, type, generation, sortBy, sortDir, favorites, showOnlyFavorites);
        const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
        set({ filterType: type, currentPage: 1, totalPages, isLoadingPage: true });
        const { pokemons, newCache } = await loadPage(filtered, cache, 1);
        set({ currentPagePokemons: pokemons, cache: newCache, isLoadingPage: false });
    },

    setGeneration: async (gen: number | null) => {
        const { allEntries, searchTerm, filterType, sortBy, sortDir, cache, typeIdCache, favorites, showOnlyFavorites } = get();
        const filtered = applyFilters(allEntries, cache, typeIdCache, searchTerm, filterType, gen, sortBy, sortDir, favorites, showOnlyFavorites);
        const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
        set({ generation: gen, currentPage: 1, totalPages, isLoadingPage: true });
        const { pokemons, newCache } = await loadPage(filtered, cache, 1);
        set({ currentPagePokemons: pokemons, cache: newCache, isLoadingPage: false });
    },

    setSort: async (by: SortField) => {
        const { allEntries, searchTerm, filterType, generation, cache, typeIdCache, sortBy, sortDir, favorites, showOnlyFavorites } = get();
        const newDir: 'asc' | 'desc' =
            sortBy === by
                ? sortDir === 'asc' ? 'desc' : 'asc'
                : ['hp', 'attack', 'defense', 'speed'].includes(by) ? 'desc' : 'asc';

        set({ sortBy: by, sortDir: newDir, currentPage: 1, isLoadingPage: true });

        let workingCache = cache;

        // For stat sorts: pre-fetch all filtered entries so sort is accurate across all pages
        if (['hp', 'attack', 'defense', 'speed'].includes(by)) {
            const preFiltered = applyFilters(allEntries, cache, typeIdCache, searchTerm, filterType, generation, 'id', 'asc', favorites, showOnlyFavorites);
            const missing = preFiltered.filter(e => !cache[e.id]).map(e => e.id);
            if (missing.length > 0 && missing.length <= 500) {
                const fetched = await fetchPokemonsByIds(missing);
                workingCache = { ...cache };
                fetched.forEach(p => { workingCache[p.id] = p; });
                set({ cache: workingCache });
            }
        }

        const filtered = applyFilters(allEntries, workingCache, typeIdCache, searchTerm, filterType, generation, by, newDir, favorites, showOnlyFavorites);
        const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
        set({ totalPages });
        const { pokemons, newCache } = await loadPage(filtered, workingCache, 1);
        set({ currentPagePokemons: pokemons, cache: newCache, isLoadingPage: false });
    },

    toggleFavorite: async (id: number) => {
        const { favorites, allEntries, searchTerm, filterType, generation, sortBy, sortDir, cache, typeIdCache, showOnlyFavorites } = get();
        const newFavs = favorites.includes(id) ? favorites.filter(f => f !== id) : [...favorites, id];
        saveFavorites(newFavs);
        const filtered = applyFilters(allEntries, cache, typeIdCache, searchTerm, filterType, generation, sortBy, sortDir, newFavs, showOnlyFavorites);
        const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
        set({ favorites: newFavs, totalPages });
        if (showOnlyFavorites) {
            set({ isLoadingPage: true });
            const { pokemons, newCache } = await loadPage(filtered, cache, 1);
            set({ currentPagePokemons: pokemons, cache: newCache, currentPage: 1, isLoadingPage: false });
        }
    },

    setShowOnlyFavorites: async (v: boolean) => {
        const { allEntries, searchTerm, filterType, generation, sortBy, sortDir, cache, typeIdCache, favorites } = get();
        const filtered = applyFilters(allEntries, cache, typeIdCache, searchTerm, filterType, generation, sortBy, sortDir, favorites, v);
        const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
        set({ showOnlyFavorites: v, currentPage: 1, totalPages, isLoadingPage: true });
        const { pokemons, newCache } = await loadPage(filtered, cache, 1);
        set({ currentPagePokemons: pokemons, cache: newCache, isLoadingPage: false });
    },

    getRandomPokemons: async (count: number): Promise<Pokemon[]> => {
        const { allEntries, cache } = get();
        if (!allEntries.length) return [];
        const shuffled = [...allEntries].sort(() => Math.random() - 0.5);
        const picked = shuffled.slice(0, count);
        const missing = picked.filter(e => !cache[e.id]).map(e => e.id);
        let newCache = cache;
        if (missing.length > 0) {
            const fetched = await fetchPokemonsByIds(missing);
            newCache = { ...cache };
            fetched.forEach(p => { newCache[p.id] = p; });
            set({ cache: newCache });
        }
        return picked.map(e => newCache[e.id]).filter(Boolean) as Pokemon[];
    },
}));
