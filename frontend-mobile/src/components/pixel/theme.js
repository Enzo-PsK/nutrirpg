export const COLORS = {
  // ── Surfaces ──────────────────────────────────────────────────────────────
  BG:       '#ffffff',   // page background
  CARD:     '#f3f4f6',   // card/panel surface
  INPUT:    '#e5e7eb',   // input field background
  CARD_ALT: '#e9eaec',   // slightly darker panel

  // ── Base ──────────────────────────────────────────────────────────────────
  BLACK: '#000000',
  WHITE: '#ffffff',

  // ── Accent palette ────────────────────────────────────────────────────────
  RED:    '#e94560',   // primary / XP
  BLUE:   '#0284c7',   // hydration / info  (darker on white for contrast)
  GOLD:   '#d97706',   // level / warning
  PURPLE: '#7c3aed',   // secondary action
  GREEN:  '#16a34a',   // health / success
  CYAN:   '#0891b2',

  // ── Typography ────────────────────────────────────────────────────────────
  TEXT:         '#111111',   // primary text
  MUTED:        '#6b7280',   // secondary / captions
  MUTED_LIGHT:  '#9ca3af',

  // ── Structural ────────────────────────────────────────────────────────────
  SHADOW: '#000000',
  BORDER: '#000000',
};

// Semantic aliases for RPG contexts
export const RPG = {
  XP:      COLORS.RED,
  HP:      COLORS.GREEN,
  MANA:    COLORS.BLUE,
  GOLD:    COLORS.GOLD,
  DANGER:  '#dc2626',
  WARN:    COLORS.GOLD,
  SUCCESS: COLORS.GREEN,
};

export const PIXEL = {
  FONT:   'VT323',
  LOGO:   'ByteBounce',
  SHADOW: 4,
  BORDER: 2,
};

/**
 * Android: nunca combinar fontFamily custom (VT323/ByteBounce) com fontWeight.
 * O RN procura uma variante Bold inexistente e faz fallback para a fonte do sistema.
 * VT323 já é visualmente forte — usar letterSpacing/tamanho para ênfase.
 */

export const TEXT = {
  hero: {
    fontFamily: 'VT323',
    fontSize: 34,
    color: COLORS.TEXT,
    letterSpacing: 2,
  },
  title: {
    fontFamily: 'VT323',
    fontSize: 20,
    color: COLORS.TEXT,
    letterSpacing: 1,
  },
  heading: {
    fontFamily: 'VT323',
    fontSize: 15,
    color: COLORS.TEXT,
  },
  body: {
    fontFamily: 'VT323',
    fontSize: 13,
    color: COLORS.TEXT,
  },
  caption: {
    fontFamily: 'VT323',
    fontSize: 11,
    color: COLORS.MUTED,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  value: {
    fontFamily: 'VT323',
    fontSize: 24,
    color: COLORS.TEXT,
  },
};
