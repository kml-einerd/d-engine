/**
 * Theme system — 5 themes + 5 font scales.
 * Extracted from: theme-system-demo, design-playground
 *
 * Usage:
 *   import { THEMES, SCALES, makeStyles } from './themes'
 *   const styles = makeStyles(THEMES.clean, SCALES.md)
 */

export const THEMES = {
  hacker: {
    bg: '#0a0a0a',
    bgSurface: '#141414',
    accent: '#00ff41',
    accentHover: '#33ff6f',
    text: '#e0e0e0',
    textMuted: '#888',
    textFaint: '#555',
    border: '#1a3a1a',
    font: "'IBM Plex Mono', monospace",
    radius: 4,
  },
  clean: {
    bg: '#ffffff',
    bgSurface: '#f8fafc',
    accent: '#2563eb',
    accentHover: '#1d4ed8',
    text: '#1e293b',
    textMuted: '#64748b',
    textFaint: '#94a3b8',
    border: '#e2e8f0',
    font: "'Inter', -apple-system, sans-serif",
    radius: 8,
  },
  midnight: {
    bg: '#0f172a',
    bgSurface: '#1e293b',
    accent: '#a78bfa',
    accentHover: '#8b5cf6',
    text: '#e2e8f0',
    textMuted: '#94a3b8',
    textFaint: '#64748b',
    border: '#334155',
    font: "'DM Sans', sans-serif",
    radius: 10,
  },
  warm: {
    bg: '#1c1917',
    bgSurface: '#292524',
    accent: '#f97316',
    accentHover: '#ea580c',
    text: '#fafaf9',
    textMuted: '#a8a29e',
    textFaint: '#78716c',
    border: '#44403c',
    font: "'Merriweather', Georgia, serif",
    radius: 6,
  },
  pastel: {
    bg: '#fef7ff',
    bgSurface: '#fdf4ff',
    accent: '#d946ef',
    accentHover: '#c026d3',
    text: '#581c87',
    textMuted: '#9333ea',
    textFaint: '#c084fc',
    border: '#f0abfc',
    font: "'Nunito', sans-serif",
    radius: 16,
  },
};

export const SCALES = {
  xs: { base: 11, sm: 9, md: 11, lg: 14, xl: 18, xxl: 24 },
  sm: { base: 12, sm: 10, md: 12, lg: 16, xl: 20, xxl: 28 },
  md: { base: 14, sm: 11, md: 14, lg: 18, xl: 24, xxl: 32 },
  lg: { base: 16, sm: 13, md: 16, lg: 20, xl: 28, xxl: 36 },
  xl: { base: 18, sm: 14, md: 18, lg: 24, xl: 32, xxl: 42 },
};

/**
 * Status/semantic colors — same across all themes.
 */
export const STATUS_COLORS = {
  success: '#10b981',
  running: '#3b82f6',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#6366f1',
  pending: '#6b7280',
  queued: '#8b5cf6',
};

/**
 * Tag colors — reusable palette for tag rendering.
 */
export const TAG_COLORS = {
  design: '#0af',
  backend: '#f80',
  frontend: '#0f0',
  urgente: '#f44',
  security: '#f0f',
  infra: '#fa0',
  docs: '#888',
  feature: '#0c6',
  bug: '#f44',
  debt: '#a78bfa',
};

/**
 * Generate complete style set from theme + scale.
 * @param {Object} theme - One of THEMES
 * @param {Object} scale - One of SCALES
 * @returns {Object} Styles object
 */
export function makeStyles(theme, scale) {
  const t = theme;
  const s = scale;

  return {
    // Root
    root: {
      background: t.bg,
      color: t.text,
      fontFamily: t.font,
      fontSize: s.base,
      minHeight: '100vh',
    },

    // Cards
    card: {
      background: t.bgSurface,
      border: `1px solid ${t.border}`,
      borderRadius: t.radius,
      padding: 16,
    },

    // Table
    table: { width: '100%', borderCollapse: 'collapse' },
    th: {
      textAlign: 'left',
      padding: '8px 12px',
      fontSize: s.sm,
      color: t.textMuted,
      borderBottom: `1px solid ${t.border}`,
      fontWeight: 600,
    },
    td: {
      padding: '8px 12px',
      fontSize: s.base,
      borderBottom: `1px solid ${t.border}20`,
    },

    // Inputs
    input: {
      background: t.bg,
      border: `1px solid ${t.border}`,
      borderRadius: t.radius / 2,
      padding: '6px 10px',
      color: t.text,
      fontSize: s.base,
      fontFamily: t.font,
      outline: 'none',
      width: '100%',
    },

    // Buttons
    btn: (color = t.accent) => ({
      background: color,
      color: '#fff',
      border: 'none',
      borderRadius: t.radius / 2,
      padding: '8px 16px',
      fontSize: s.base,
      fontFamily: t.font,
      cursor: 'pointer',
      fontWeight: 600,
    }),

    // Tags
    tag: (color = t.accent) => ({
      display: 'inline-block',
      background: color + '20',
      color: color,
      borderRadius: 50,
      padding: '2px 10px',
      fontSize: s.sm,
      fontWeight: 600,
    }),

    // Modal overlay
    overlay: {
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      background: '#000a',
      zIndex: 50,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
    modal: {
      background: t.bgSurface,
      border: `1px solid ${t.border}`,
      borderRadius: t.radius * 1.5,
      padding: 24,
      width: 480,
      maxHeight: '80vh',
      overflow: 'auto',
    },

    // Typography
    h1: { fontSize: s.xxl, fontWeight: 700, color: t.text },
    h2: { fontSize: s.xl, fontWeight: 700, color: t.text },
    h3: { fontSize: s.lg, fontWeight: 600, color: t.text },
    muted: { color: t.textMuted, fontSize: s.sm },
    faint: { color: t.textFaint, fontSize: s.sm },
  };
}
