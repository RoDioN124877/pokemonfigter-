import React from 'react';
import type { EquipId } from '../store/progressStore';
import { findEquip } from '../data/equipmentData';

interface Props {
    id: EquipId | string;
    size?: number;
}

const S = (d: string, fill: string, stroke?: string, sw?: number) =>
    <path d={d} fill={fill} stroke={stroke ?? 'none'} strokeWidth={sw ?? 0} />;

const ICONS: Record<string, (sz: number) => React.JSX.Element> = {
    // ═══════════════════════════════════════════════════════════════
    // WEAPONS
    // ═══════════════════════════════════════════════════════════════
    'bone-club': () => (
        <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
            <rect x="14" y="8" width="5" height="18" rx="2" fill="#c9a96e" />
            <circle cx="14" cy="7" r="3.5" fill="#e8d5b0" stroke="#a0845c" strokeWidth="1" />
            <circle cx="19" cy="7" r="3.5" fill="#e8d5b0" stroke="#a0845c" strokeWidth="1" />
            <circle cx="16.5" cy="5" r="2.5" fill="#e8d5b0" stroke="#a0845c" strokeWidth="1" />
        </svg>
    ),
    'wooden-sword': () => (
        <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
            {S('M15 3L18 4L17 20L14 20L13 4Z', '#a0845c', '#6d4c1d', 0.8)}
            <rect x="11" y="19" width="10" height="3" rx="1" fill="#6d4c1d" />
            <rect x="14.5" y="22" width="3" height="5" rx="1" fill="#8B6914" />
        </svg>
    ),
    'poison-dagger': () => (
        <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
            {S('M15 3L18 5L17 17L14 17L13 5Z', '#84cc16', '#4d7c0f', 0.8)}
            <rect x="12" y="16" width="8" height="2.5" rx="1" fill="#7c3aed" />
            <rect x="14.5" y="18.5" width="3" height="5" rx="1" fill="#5b21b6" />
            <circle cx="16" cy="8" r="1.5" fill="#a3e635" opacity="0.7" />
            <circle cx="18" cy="21" r="1" fill="#84cc16" opacity="0.6" />
        </svg>
    ),
    'iron-sword': () => (
        <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
            {S('M14.5 2L17.5 3L17 19L15 19L14.5 2Z', '#cbd5e1', '#94a3b8', 0.8)}
            <line x1="15" y1="6" x2="17" y2="6" stroke="#e2e8f0" strokeWidth="0.5" opacity="0.6" />
            <rect x="11" y="18.5" width="10" height="3" rx="1" fill="#78716c" />
            <rect x="14" y="21.5" width="4" height="5" rx="1" fill="#57534e" />
            <circle cx="16" cy="24" r="0.8" fill="#fbbf24" />
        </svg>
    ),
    'thunder-lance': () => (
        <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
            {S('M16 1L19 8L17 8L17 22L15 22L15 8L13 8Z', '#facc15', '#ca8a04', 0.7)}
            <rect x="15" y="22" width="2" height="8" fill="#78716c" />
            <line x1="14" y1="12" x2="18" y2="12" stroke="#fde68a" strokeWidth="0.6" opacity="0.5" />
            {S('M14 5L16 1L18 5L16.5 4Z', '#fef08a')}
        </svg>
    ),
    'ice-axe': () => (
        <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
            <rect x="15" y="10" width="2.5" height="18" rx="1" fill="#78716c" />
            {S('M8 5L18 8L18 13L8 10Z', '#38bdf8', '#0284c7', 0.8)}
            {S('M10 6L14 7.5L14 10L10 9Z', '#7dd3fc', undefined, 0)}
            <line x1="12" y1="8" x2="16" y2="9" stroke="#bae6fd" strokeWidth="0.5" opacity="0.5" />
        </svg>
    ),
    'shadow-blade': () => (
        <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
            {S('M13 2C13 2 11 10 12 18L16 18C18 10 20 2 16 2Z', '#a78bfa', '#7c3aed', 0.8)}
            <rect x="11" y="17.5" width="9" height="2.5" rx="1" fill="#4c1d95" />
            <rect x="13.5" y="20" width="4" height="5" rx="1" fill="#3b0764" />
            <circle cx="14.5" cy="8" r="0.8" fill="#c4b5fd" opacity="0.7" />
            <circle cx="15.5" cy="12" r="0.6" fill="#ddd6fe" opacity="0.5" />
        </svg>
    ),
    'flame-saber': () => (
        <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
            {S('M14 3L18 4L17 19L14 19Z', '#f97316', '#dc2626', 0.8)}
            {S('M13 5C11 3 14 1 16 2C18 1 21 3 19 5L16 8Z', '#fbbf24', '#f97316', 0.5)}
            <rect x="11.5" y="18.5" width="9" height="2.5" rx="1" fill="#7f1d1d" />
            <rect x="14" y="21" width="4" height="5" rx="1" fill="#991b1b" />
            <circle cx="16" cy="10" r="1" fill="#fef08a" opacity="0.6" />
        </svg>
    ),
    'crystal-wand': () => (
        <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
            <rect x="15" y="12" width="2.5" height="16" rx="1" fill="#6366f1" />
            {S('M16.2 3L20 8L16.2 13L12.5 8Z', '#67e8f9', '#06b6d4', 0.8)}
            <circle cx="16.2" cy="8" r="2" fill="#a5f3fc" opacity="0.5" />
            <circle cx="16.2" cy="3" r="1" fill="#ecfeff" opacity="0.8" />
            <line x1="13" y1="16" x2="19.5" y2="16" stroke="#818cf8" strokeWidth="0.7" opacity="0.4" />
        </svg>
    ),
    'void-scythe': () => (
        <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
            <rect x="15" y="8" width="2" height="20" rx="0.5" fill="#57534e" transform="rotate(-10 16 18)" />
            {S('M8 3C8 3 6 8 10 12L18 8C18 8 14 2 8 3Z', '#7c3aed', '#581c87', 0.8)}
            {S('M9 5C9 5 8 8 11 10L15 8C15 8 13 4 9 5Z', '#a78bfa', undefined, 0)}
            <circle cx="10" cy="6" r="0.7" fill="#ddd6fe" opacity="0.6" />
        </svg>
    ),
    'dragon-fang': () => (
        <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
            {S('M14 2C14 2 12 8 13 14L16 18L19 14C20 8 18 2 18 2L16 1Z', '#4ade80', '#16a34a', 0.8)}
            <rect x="13" y="17" width="6" height="3" rx="1" fill="#166534" />
            <rect x="14.5" y="20" width="3" height="5" rx="1" fill="#14532d" />
            {S('M15 6L16 4L17 6L16 5.5Z', '#bbf7d0', undefined, 0)}
            <circle cx="15" cy="10" r="0.7" fill="#86efac" opacity="0.5" />
        </svg>
    ),
    'celestial-bow': () => (
        <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
            {S('M8 4C4 10 4 20 8 26', 'none', '#f59e0b', 2.5)}
            <line x1="8" y1="4" x2="8" y2="26" stroke="#fde68a" strokeWidth="0.7" />
            {S('M8 15L22 13L24 15L22 17Z', '#fbbf24', '#b45309', 0.6)}
            {S('M22 14L26 15L22 16Z', '#dc2626')}
            <circle cx="8" cy="4" r="1.2" fill="#fef08a" />
            <circle cx="8" cy="26" r="1.2" fill="#fef08a" />
        </svg>
    ),
    'inferno-katana': () => (
        <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
            {S('M17 1C16 1 13 8 13 18L16 18C18 10 19 3 17 1Z', '#ef4444', '#b91c1c', 0.8)}
            {S('M14 4C12 2 15 0 17 1L15 5Z', '#fb923c', undefined, 0)}
            <rect x="11" y="17.5" width="8" height="2" rx="0.8" fill="#1c1917" />
            <rect x="13.5" y="19.5" width="3.5" height="6" rx="1" fill="#292524" />
            <line x1="14" y1="8" x2="15" y2="12" stroke="#fca5a5" strokeWidth="0.5" opacity="0.5" />
            <circle cx="15" cy="22.5" r="0.6" fill="#dc2626" />
        </svg>
    ),
    'titan-hammer': () => (
        <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
            <rect x="14.5" y="14" width="3" height="14" rx="1" fill="#78716c" />
            <rect x="6" y="4" width="20" height="11" rx="2.5" fill="#94a3b8" stroke="#64748b" strokeWidth="1" />
            <rect x="8" y="6" width="7" height="7" rx="1" fill="#78716c" opacity="0.4" />
            <rect x="17" y="6" width="7" height="7" rx="1" fill="#78716c" opacity="0.4" />
            <circle cx="16" cy="9.5" r="1.5" fill="#fb923c" opacity="0.7" />
        </svg>
    ),
    'genesis-blade': () => (
        <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
            {S('M14 1L18 2L17 18L15 18Z', 'url(#gen-w)', '#818cf8', 0.8)}
            <defs>
                <linearGradient id="gen-w" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#e0e7ff" />
                    <stop offset="50%" stopColor="#a78bfa" />
                    <stop offset="100%" stopColor="#6366f1" />
                </linearGradient>
            </defs>
            <rect x="10.5" y="17.5" width="11" height="3" rx="1" fill="#4f46e5" />
            <rect x="14" y="20.5" width="4" height="5" rx="1" fill="#3730a3" />
            <circle cx="16" cy="5" r="1.5" fill="#fef9c3" opacity="0.9" />
            <circle cx="16" cy="9" r="1" fill="#fef9c3" opacity="0.6" />
            <circle cx="16" cy="23" r="0.7" fill="#c4b5fd" />
        </svg>
    ),

    // ═══════════════════════════════════════════════════════════════
    // ARMOR
    // ═══════════════════════════════════════════════════════════════
    'leather-vest': () => (
        <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
            {S('M8 8L13 6L16 9L19 6L24 8L24 24L20 26L16 24L12 26L8 24Z', '#a0845c', '#6d4c1d', 1)}
            <line x1="16" y1="9" x2="16" y2="24" stroke="#6d4c1d" strokeWidth="0.8" />
            <circle cx="16" cy="12" r="0.6" fill="#6d4c1d" />
            <circle cx="16" cy="15" r="0.6" fill="#6d4c1d" />
            <circle cx="16" cy="18" r="0.6" fill="#6d4c1d" />
        </svg>
    ),
    'iron-shield': () => (
        <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
            {S('M16 3L26 8L24 24L16 28L8 24L6 8Z', '#94a3b8', '#64748b', 1)}
            {S('M16 6L23 10L21.5 22L16 25L10.5 22L9 10Z', '#cbd5e1', undefined, 0)}
            <line x1="16" y1="6" x2="16" y2="25" stroke="#94a3b8" strokeWidth="0.7" />
            <line x1="9" y1="13" x2="23" y2="13" stroke="#94a3b8" strokeWidth="0.7" />
        </svg>
    ),
    'wooden-buckler': () => (
        <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
            <circle cx="16" cy="16" r="11" fill="#a0845c" stroke="#6d4c1d" strokeWidth="1.5" />
            <circle cx="16" cy="16" r="7" fill="none" stroke="#8B7355" strokeWidth="1" />
            <circle cx="16" cy="16" r="3" fill="#6d4c1d" />
            <circle cx="16" cy="16" r="1.2" fill="#c9a96e" />
        </svg>
    ),
    'chain-mail': () => (
        <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
            {S('M8 7L13 5L16 8L19 5L24 7L24 25L20 27L16 25L12 27L8 25Z', '#94a3b8', '#64748b', 1)}
            {[10,14,18,22].map(y => [10,13,16,19,22].map(x =>
                <circle key={`${x}-${y}`} cx={x} cy={y} r="1.3" fill="none" stroke="#78716c" strokeWidth="0.6" />
            ))}
        </svg>
    ),
    'frost-cloak': () => (
        <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
            {S('M10 4L16 3L22 4L24 10L22 26L16 28L10 26L8 10Z', '#38bdf8', '#0284c7', 1)}
            {S('M12 6L16 5L20 6L22 10L20 24L16 26L12 24L10 10Z', '#7dd3fc', undefined, 0)}
            {S('M16 10L17.5 13L16 12L14.5 13Z', '#bae6fd')}
            {S('M16 15L17.5 18L16 17L14.5 18Z', '#bae6fd')}
            <circle cx="13" cy="11" r="0.8" fill="#e0f2fe" opacity="0.6" />
            <circle cx="19" cy="19" r="0.8" fill="#e0f2fe" opacity="0.6" />
        </svg>
    ),
    'dragon-scale': () => (
        <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
            {S('M16 3L26 8L24 24L16 28L8 24L6 8Z', '#16a34a', '#166534', 1)}
            {[8,13,18,23].map((y, yi) =>
                [11,16,21].filter((_, xi) => (yi + xi) % 2 === 0).map(x =>
                    <ellipse key={`${x}-${y}`} cx={x} cy={y} rx="3" ry="2.2" fill="#4ade80" opacity="0.5" stroke="#16a34a" strokeWidth="0.5" />
                )
            )}
        </svg>
    ),
    'thunder-guard': () => (
        <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
            {S('M16 3L26 8L24 24L16 28L8 24L6 8Z', '#facc15', '#ca8a04', 1)}
            {S('M16 6L23 10L21.5 22L16 25L10.5 22L9 10Z', '#fde68a', undefined, 0)}
            {S('M17 9L14 16L17 15L15 23L19 14L16 15Z', '#ca8a04')}
        </svg>
    ),
    'aegis-plate': () => (
        <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
            {S('M7 7L13 4L16 7L19 4L25 7L26 15L24 24L20 27L16 25L12 27L8 24L6 15Z', '#cbd5e1', '#94a3b8', 1)}
            {S('M9 8L13 6L16 8L19 6L23 8L24 15L22 22L19 24L16 23L13 24L10 22L8 15Z', '#e2e8f0', undefined, 0)}
            <line x1="16" y1="8" x2="16" y2="23" stroke="#94a3b8" strokeWidth="0.6" />
            <circle cx="16" cy="13" r="2" fill="#94a3b8" opacity="0.4" />
        </svg>
    ),
    'shadow-robe': () => (
        <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
            {S('M10 3L16 2L22 3L24 10L26 28L16 26L6 28L8 10Z', '#7c3aed', '#5b21b6', 1)}
            {S('M12 4L16 3L20 4L22 10L23 25L16 24L9 25L10 10Z', '#8b5cf6', undefined, 0)}
            {S('M14 8L16 6L18 8L16 9Z', '#c4b5fd')}
            <circle cx="13" cy="16" r="0.8" fill="#ddd6fe" opacity="0.5" />
            <circle cx="19" cy="20" r="0.8" fill="#ddd6fe" opacity="0.5" />
        </svg>
    ),
    'crystal-armor': () => (
        <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
            {S('M7 7L13 4L16 7L19 4L25 7L26 16L24 25L16 28L8 25L6 16Z', '#06b6d4', '#0891b2', 1)}
            {S('M16 7L21 10L20 20L16 24L12 20L11 10Z', '#67e8f9', undefined, 0)}
            {S('M14 10L16 7L18 10L16 12Z', '#a5f3fc')}
            {S('M12 16L16 14L20 16L16 18Z', '#a5f3fc', undefined, 0)}
            <circle cx="16" cy="20" r="1.5" fill="#cffafe" opacity="0.5" />
        </svg>
    ),
    'phoenix-mantle': () => (
        <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
            {S('M10 4L16 3L22 4L26 10L24 26L16 28L8 26L6 10Z', '#f97316', '#ea580c', 1)}
            {S('M12 5L16 4L20 5L23 10L22 24L16 26L10 24L9 10Z', '#fb923c', undefined, 0)}
            {S('M6 8L3 4L8 6Z', '#fbbf24')}
            {S('M26 8L29 4L24 6Z', '#fbbf24')}
            {S('M4 6L2 1L7 5Z', '#fde68a')}
            {S('M28 6L30 1L25 5Z', '#fde68a')}
            <circle cx="16" cy="12" r="2" fill="#fbbf24" opacity="0.5" />
        </svg>
    ),
    'mythril-armor': () => (
        <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
            {S('M7 6L13 3L16 6L19 3L25 6L27 16L25 26L16 29L7 26L5 16Z', '#818cf8', '#6366f1', 1)}
            {S('M9 7L13 5L16 7L19 5L23 7L25 16L23 24L16 27L9 24L7 16Z', '#a5b4fc', undefined, 0)}
            {S('M16 7L19 10L16 13L13 10Z', '#c7d2fe')}
            <line x1="16" y1="13" x2="16" y2="27" stroke="#818cf8" strokeWidth="0.5" />
            <circle cx="16" cy="10" r="1" fill="#e0e7ff" opacity="0.8" />
        </svg>
    ),
    'titan-shell': () => (
        <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
            {S('M16 2L28 10L26 26L16 30L6 26L4 10Z', '#92400e', '#78350f', 1.5)}
            {S('M16 5L25 11L23 24L16 27L9 24L7 11Z', '#b45309', undefined, 0)}
            {[8,14,20].map(y =>
                <rect key={y} x="9" y={y} width="14" height="4" rx="2" fill="#a16207" opacity="0.5" />
            )}
            <circle cx="16" cy="16" r="3" fill="#78350f" />
            <circle cx="16" cy="16" r="1.5" fill="#fbbf24" opacity="0.6" />
        </svg>
    ),
    'void-barrier': () => (
        <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <linearGradient id="void-a" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#7c3aed" />
                    <stop offset="100%" stopColor="#3b0764" />
                </linearGradient>
            </defs>
            {S('M16 2L27 9L25 25L16 29L7 25L5 9Z', 'url(#void-a)', '#6d28d9', 1)}
            <circle cx="16" cy="16" r="6" fill="none" stroke="#a78bfa" strokeWidth="1" opacity="0.6" />
            <circle cx="16" cy="16" r="3" fill="none" stroke="#c4b5fd" strokeWidth="0.8" opacity="0.5" />
            <circle cx="16" cy="16" r="1.5" fill="#ddd6fe" opacity="0.7" />
            {S('M16 5L17 8L16 7L15 8Z', '#c4b5fd', undefined, 0)}
            {S('M16 27L17 24L16 25L15 24Z', '#c4b5fd', undefined, 0)}
        </svg>
    ),
    'genesis-aegis': () => (
        <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <linearGradient id="gen-a" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#fef9c3" />
                    <stop offset="33%" stopColor="#e0e7ff" />
                    <stop offset="66%" stopColor="#ccfbf1" />
                    <stop offset="100%" stopColor="#fce7f3" />
                </linearGradient>
            </defs>
            {S('M16 1L28 8L26 25L16 30L6 25L4 8Z', 'url(#gen-a)', '#a78bfa', 1.2)}
            {S('M16 4L25 9L23.5 23L16 27L8.5 23L7 9Z', '#f0f0ff', undefined, 0)}
            {S('M16 8L20 12L16 16L12 12Z', '#c4b5fd', '#818cf8', 0.5)}
            <circle cx="16" cy="12" r="2" fill="#fef9c3" opacity="0.7" />
            <circle cx="16" cy="20" r="1.5" fill="#a78bfa" opacity="0.5" />
        </svg>
    ),

    // ═══════════════════════════════════════════════════════════════
    // ACCESSORIES
    // ═══════════════════════════════════════════════════════════════
    'berry-pendant': () => (
        <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
            {S('M10 4Q16 8 22 4', 'none', '#94a3b8', 1.2)}
            <line x1="16" y1="6" x2="16" y2="16" stroke="#94a3b8" strokeWidth="0.8" />
            <circle cx="16" cy="20" r="5" fill="#ef4444" stroke="#b91c1c" strokeWidth="1" />
            <circle cx="14.5" cy="18.5" r="1.5" fill="#fca5a5" opacity="0.6" />
            {S('M15 14L16 13L17 14L16.5 15L15.5 15Z', '#22c55e')}
        </svg>
    ),
    'focus-lens': () => (
        <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
            <circle cx="16" cy="14" r="8" fill="none" stroke="#64748b" strokeWidth="2" />
            <circle cx="16" cy="14" r="5.5" fill="#3b82f6" opacity="0.3" />
            <circle cx="16" cy="14" r="5.5" fill="none" stroke="#93c5fd" strokeWidth="0.8" />
            <line x1="22" y1="20" x2="27" y2="27" stroke="#64748b" strokeWidth="2.5" strokeLinecap="round" />
            <circle cx="14" cy="12" r="1.5" fill="#bfdbfe" opacity="0.5" />
        </svg>
    ),
    'quick-claw': () => (
        <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
            {S('M10 26L13 8L16 6L14 26Z', '#e2e8f0', '#94a3b8', 0.8)}
            {S('M14 26L17 5L20 4L18 26Z', '#e2e8f0', '#94a3b8', 0.8)}
            {S('M18 26L21 7L24 6L22 26Z', '#e2e8f0', '#94a3b8', 0.8)}
            <rect x="8" y="25" width="16" height="4" rx="2" fill="#94a3b8" />
        </svg>
    ),
    'speed-boots': () => (
        <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
            {S('M8 8L12 6L14 8L14 22L4 24L4 22L8 20Z', '#3b82f6', '#1d4ed8', 0.8)}
            {S('M18 8L22 6L24 8L24 22L28 24L28 22L24 20Z', '#3b82f6', '#1d4ed8', 0.8)}
            <rect x="3" y="23" width="12" height="4" rx="1.5" fill="#1e40af" />
            <rect x="17" y="23" width="12" height="4" rx="1.5" fill="#1e40af" />
            {S('M5 21L7 19L9 21', 'none', '#93c5fd', 0.7)}
            {S('M21 21L23 19L25 21', 'none', '#93c5fd', 0.7)}
        </svg>
    ),
    'mystic-ring': () => (
        <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
            <ellipse cx="16" cy="18" rx="9" ry="6" fill="none" stroke="#9333ea" strokeWidth="2.5" />
            <ellipse cx="16" cy="18" rx="6" ry="3.5" fill="none" stroke="#a855f7" strokeWidth="1" opacity="0.5" />
            {S('M13 10L16 6L19 10L16 12Z', '#c084fc', '#7c3aed', 0.8)}
            <circle cx="16" cy="8.5" r="1.2" fill="#e9d5ff" opacity="0.8" />
        </svg>
    ),
    'guardian-charm': () => (
        <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
            <circle cx="16" cy="17" r="9" fill="#1e40af" stroke="#3b82f6" strokeWidth="1.5" />
            <circle cx="16" cy="17" r="6" fill="#1e3a8a" />
            <circle cx="16" cy="17" r="4" fill="#3b82f6" />
            <circle cx="16" cy="17" r="2" fill="#1e3a8a" />
            <circle cx="16" cy="17" r="1" fill="#93c5fd" />
            {S('M10 4Q16 7 22 4', 'none', '#64748b', 1)}
            <line x1="16" y1="5.5" x2="16" y2="8" stroke="#64748b" strokeWidth="0.8" />
        </svg>
    ),
    'life-orb': () => (
        <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
            <circle cx="16" cy="16" r="10" fill="#166534" stroke="#15803d" strokeWidth="1.5" />
            <circle cx="16" cy="16" r="7" fill="#22c55e" opacity="0.6" />
            <circle cx="16" cy="16" r="4" fill="#4ade80" opacity="0.5" />
            <circle cx="16" cy="16" r="2" fill="#bbf7d0" opacity="0.7" />
            <circle cx="13" cy="12" r="2" fill="#86efac" opacity="0.4" />
        </svg>
    ),
    'scope-lens': () => (
        <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
            <circle cx="16" cy="16" r="10" fill="none" stroke="#dc2626" strokeWidth="1.5" />
            <circle cx="16" cy="16" r="7" fill="#7f1d1d" opacity="0.4" />
            <circle cx="16" cy="16" r="7" fill="none" stroke="#f87171" strokeWidth="0.8" />
            <line x1="16" y1="5" x2="16" y2="27" stroke="#ef4444" strokeWidth="0.8" opacity="0.6" />
            <line x1="5" y1="16" x2="27" y2="16" stroke="#ef4444" strokeWidth="0.8" opacity="0.6" />
            <circle cx="16" cy="16" r="1.5" fill="#fca5a5" />
        </svg>
    ),
    'eviolite': () => (
        <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
            {S('M16 3L24 10L24 22L16 29L8 22L8 10Z', '#22c55e', '#16a34a', 1.2)}
            {S('M16 6L22 11L22 21L16 26L10 21L10 11Z', '#4ade80', undefined, 0)}
            {S('M16 10L19 13L19 19L16 22L13 19L13 13Z', '#86efac', undefined, 0)}
            <circle cx="16" cy="16" r="2" fill="#dcfce7" opacity="0.7" />
        </svg>
    ),
    'amulet-coin': () => (
        <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
            <circle cx="16" cy="17" r="9" fill="#ca8a04" stroke="#a16207" strokeWidth="1.5" />
            <circle cx="16" cy="17" r="6.5" fill="#eab308" />
            <circle cx="16" cy="17" r="6.5" fill="none" stroke="#fde68a" strokeWidth="0.5" />
            <text x="16" y="20.5" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#92400e" fontFamily="serif">$</text>
            {S('M10 4Q16 7 22 4', 'none', '#94a3b8', 1)}
            <line x1="16" y1="5.5" x2="16" y2="8" stroke="#94a3b8" strokeWidth="0.8" />
            <circle cx="12" cy="13" r="1.5" fill="#fef9c3" opacity="0.5" />
        </svg>
    ),
    'power-band': () => (
        <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
            <ellipse cx="16" cy="16" rx="10" ry="7" fill="none" stroke="#f97316" strokeWidth="3" />
            <ellipse cx="16" cy="16" rx="10" ry="7" fill="none" stroke="#fb923c" strokeWidth="1" opacity="0.5" />
            <circle cx="16" cy="9.5" r="2.5" fill="#ea580c" stroke="#c2410c" strokeWidth="0.8" />
            <circle cx="16" cy="9.5" r="1" fill="#fed7aa" opacity="0.7" />
            {S('M8 14L6 12', 'none', '#fbbf24', 0.8)}
            {S('M24 14L26 12', 'none', '#fbbf24', 0.8)}
        </svg>
    ),
    'king-rock': () => (
        <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
            {S('M6 18L10 12L16 8L22 12L26 18L24 26L8 26Z', '#78716c', '#57534e', 1.2)}
            {S('M8 18L11 13L16 10L21 13L24 18L22 24L10 24Z', '#94a3b8', undefined, 0)}
            {S('M12 8L14 4L16 6L18 4L20 8L16 10Z', '#fbbf24', '#ca8a04', 0.8)}
            <circle cx="16" cy="5" r="1" fill="#fef9c3" />
        </svg>
    ),
    'champion-belt': () => (
        <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
            <rect x="3" y="12" width="26" height="8" rx="3" fill="#92400e" stroke="#78350f" strokeWidth="1" />
            <rect x="3" y="12" width="26" height="8" rx="3" fill="none" stroke="#b45309" strokeWidth="0.5" />
            <rect x="11" y="10" width="10" height="12" rx="2" fill="#eab308" stroke="#ca8a04" strokeWidth="1" />
            <circle cx="16" cy="16" r="3" fill="#fbbf24" />
            <circle cx="16" cy="16" r="1.5" fill="#fef9c3" />
            <rect x="6" y="14" width="3" height="4" rx="0.5" fill="#a16207" />
            <rect x="23" y="14" width="3" height="4" rx="0.5" fill="#a16207" />
        </svg>
    ),
    'soul-dew': () => (
        <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
            {S('M16 4L22 16L16 28L10 16Z', '#3b82f6', '#2563eb', 1)}
            {S('M16 7L20 16L16 25L12 16Z', '#60a5fa', undefined, 0)}
            {S('M16 10L18 16L16 22L14 16Z', '#93c5fd', undefined, 0)}
            <circle cx="16" cy="14" r="1.5" fill="#bfdbfe" opacity="0.8" />
            <circle cx="14" cy="12" r="0.8" fill="#dbeafe" opacity="0.5" />
        </svg>
    ),
    'master-crown': () => (
        <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
            {S('M4 22L7 8L12 14L16 6L20 14L25 8L28 22Z', '#eab308', '#ca8a04', 1.2)}
            {S('M6 22L8 11L12 15L16 8L20 15L24 11L26 22Z', '#fbbf24', undefined, 0)}
            <rect x="4" y="21" width="24" height="4" rx="1" fill="#ca8a04" stroke="#a16207" strokeWidth="0.5" />
            <circle cx="9" cy="22.5" r="1.5" fill="#ef4444" />
            <circle cx="16" cy="22.5" r="1.5" fill="#3b82f6" />
            <circle cx="23" cy="22.5" r="1.5" fill="#22c55e" />
            <circle cx="16" cy="8" r="1.2" fill="#fef9c3" />
            <circle cx="7" cy="10" r="1" fill="#fef9c3" opacity="0.7" />
            <circle cx="25" cy="10" r="1" fill="#fef9c3" opacity="0.7" />
        </svg>
    ),
};

const EquipIcon: React.FC<Props> = ({ id, size = 28 }) => {
    const renderer = ICONS[id];
    if (!renderer) {
        const def = findEquip(id);
        return <span style={{ fontSize: size * 0.75, lineHeight: 1 }}>{def?.icon ?? '?'}</span>;
    }
    return (
        <span style={{ width: size, height: size, display: 'inline-flex', flexShrink: 0 }}>
            {renderer(size)}
        </span>
    );
};

export default EquipIcon;
