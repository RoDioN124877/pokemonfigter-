export interface EvolutionEntry {
    intoId: number;
    intoName: string;
    minLevel: number;
}

// Base Pokemon ID → next evolution form
export const EVOLUTION_MAP: Record<number, EvolutionEntry> = {
    // Bulbasaur line
    1:   { intoId: 2,   intoName: 'ivysaur',    minLevel: 16 },
    2:   { intoId: 3,   intoName: 'venusaur',   minLevel: 32 },
    // Charmander line
    4:   { intoId: 5,   intoName: 'charmeleon', minLevel: 16 },
    5:   { intoId: 6,   intoName: 'charizard',  minLevel: 36 },
    // Squirtle line
    7:   { intoId: 8,   intoName: 'wartortle',  minLevel: 16 },
    8:   { intoId: 9,   intoName: 'blastoise',  minLevel: 36 },
    // Pidgey line
    16:  { intoId: 17,  intoName: 'pidgeotto',  minLevel: 18 },
    17:  { intoId: 18,  intoName: 'pidgeot',    minLevel: 36 },
    // Rattata
    19:  { intoId: 20,  intoName: 'raticate',   minLevel: 20 },
    // Spearow
    21:  { intoId: 22,  intoName: 'fearow',     minLevel: 20 },
    // Pikachu
    25:  { intoId: 26,  intoName: 'raichu',     minLevel: 30 },
    // Sandshrew
    27:  { intoId: 28,  intoName: 'sandslash',  minLevel: 22 },
    // Vulpix
    37:  { intoId: 38,  intoName: 'ninetales',  minLevel: 30 },
    // Jigglypuff
    39:  { intoId: 40,  intoName: 'wigglytuff', minLevel: 30 },
    // Oddish line
    43:  { intoId: 44,  intoName: 'gloom',      minLevel: 21 },
    44:  { intoId: 45,  intoName: 'vileplume',  minLevel: 36 },
    // Paras
    46:  { intoId: 47,  intoName: 'parasect',   minLevel: 24 },
    // Venonat
    48:  { intoId: 49,  intoName: 'venomoth',   minLevel: 31 },
    // Meowth
    52:  { intoId: 53,  intoName: 'persian',    minLevel: 28 },
    // Mankey
    56:  { intoId: 57,  intoName: 'primeape',   minLevel: 28 },
    // Growlithe
    58:  { intoId: 59,  intoName: 'arcanine',   minLevel: 28 },
    // Poliwag line
    60:  { intoId: 61,  intoName: 'poliwhirl',  minLevel: 25 },
    61:  { intoId: 62,  intoName: 'poliwrath',  minLevel: 40 },
    // Machop line
    66:  { intoId: 67,  intoName: 'machoke',    minLevel: 28 },
    67:  { intoId: 68,  intoName: 'machamp',    minLevel: 40 },
    // Bellsprout line
    69:  { intoId: 70,  intoName: 'weepinbell', minLevel: 21 },
    70:  { intoId: 71,  intoName: 'victreebel', minLevel: 36 },
    // Geodude line
    74:  { intoId: 75,  intoName: 'graveler',   minLevel: 25 },
    75:  { intoId: 76,  intoName: 'golem',      minLevel: 40 },
    // Ponyta
    77:  { intoId: 78,  intoName: 'rapidash',   minLevel: 40 },
    // Slowpoke
    79:  { intoId: 80,  intoName: 'slowbro',    minLevel: 37 },
    // Magnemite
    81:  { intoId: 82,  intoName: 'magneton',   minLevel: 30 },
    // Doduo
    84:  { intoId: 85,  intoName: 'dodrio',     minLevel: 31 },
    // Seel
    86:  { intoId: 87,  intoName: 'dewgong',    minLevel: 34 },
    // Grimer
    88:  { intoId: 89,  intoName: 'muk',        minLevel: 38 },
    // Gastly line
    92:  { intoId: 93,  intoName: 'haunter',    minLevel: 25 },
    93:  { intoId: 94,  intoName: 'gengar',     minLevel: 40 },
    // Drowzee
    96:  { intoId: 97,  intoName: 'hypno',      minLevel: 26 },
    // Voltorb
    100: { intoId: 101, intoName: 'electrode',  minLevel: 30 },
    // Koffing
    109: { intoId: 110, intoName: 'weezing',    minLevel: 35 },
    // Rhyhorn
    111: { intoId: 112, intoName: 'rhydon',     minLevel: 42 },
    // Horsea
    116: { intoId: 117, intoName: 'seadra',     minLevel: 32 },
    // Goldeen
    118: { intoId: 119, intoName: 'seaking',    minLevel: 33 },
    // Staryu (no evo without stone, use level 30)
    // Scyther (no gen1 evo)
    // Eevee → Vaporeon
    133: { intoId: 134, intoName: 'vaporeon',   minLevel: 30 },
    // Caterpie line
    10:  { intoId: 11,  intoName: 'metapod',    minLevel: 7  },
    11:  { intoId: 12,  intoName: 'butterfree', minLevel: 10 },
    // Weedle line
    13:  { intoId: 14,  intoName: 'kakuna',     minLevel: 7  },
    14:  { intoId: 15,  intoName: 'beedrill',   minLevel: 10 },
    // Clefairy
    35:  { intoId: 36,  intoName: 'clefable',   minLevel: 36 },
    // Ekans
    23:  { intoId: 24,  intoName: 'arbok',      minLevel: 22 },
    // Nidoran lines
    29:  { intoId: 30,  intoName: 'nidorina',   minLevel: 16 },
    30:  { intoId: 31,  intoName: 'nidoqueen',  minLevel: 36 },
    32:  { intoId: 33,  intoName: 'nidorino',   minLevel: 16 },
    33:  { intoId: 34,  intoName: 'nidoking',   minLevel: 36 },
    // Zubat
    41:  { intoId: 42,  intoName: 'golbat',     minLevel: 22 },
    // Diglett
    50:  { intoId: 51,  intoName: 'dugtrio',    minLevel: 26 },
    // Psyduck
    54:  { intoId: 55,  intoName: 'golduck',    minLevel: 33 },
    // Tentacool
    72:  { intoId: 73,  intoName: 'tentacruel', minLevel: 30 },
    // Abra line
    63:  { intoId: 64,  intoName: 'kadabra',    minLevel: 16 },
    64:  { intoId: 65,  intoName: 'alakazam',   minLevel: 46 },
    // Shellder
    90:  { intoId: 91,  intoName: 'cloyster',   minLevel: 32 },
    // Krabby
    98:  { intoId: 99,  intoName: 'kingler',    minLevel: 28 },
    // Exeggcute
    102: { intoId: 103, intoName: 'exeggutor',  minLevel: 27 },
    // Cubone
    104: { intoId: 105, intoName: 'marowak',    minLevel: 28 },
    // Staryu
    120: { intoId: 121, intoName: 'starmie',    minLevel: 20 },
    // Magikarp
    129: { intoId: 130, intoName: 'gyarados',   minLevel: 20 },
    // Dratini line
    147: { intoId: 148, intoName: 'dragonair',  minLevel: 30 },
    148: { intoId: 149, intoName: 'dragonite',  minLevel: 55 },
};
