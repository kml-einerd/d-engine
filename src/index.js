/**
 * d-engine — Declarative UI Component Arsenal
 *
 * Quick reference:
 *
 * ENGINES (full-page generators):
 *   declarative-ui-engine.jsx  → Config-driven CRUD + Dashboard + Forms
 *   generative-ui-chat.jsx     → AI chat → generates UI in real-time
 *   generative-ui-turbo.jsx    → Shorthand presets → instant UI
 *
 * VIEWS (data visualization modes):
 *   views-kanban-clickup.jsx   → Kanban board + ClickUp-style list
 *   views-notion-gallery.jsx   → Notion rows + Gallery grid
 *   views-files-table.jsx      → File browser + Sortable table
 *
 * BUILDERS (visual editors):
 *   ui-builder-canvas.jsx      → Drag blocks, connect, lock/unlock
 *   ui-builder-v4.jsx          → Full builder: undo, cmd palette, preview
 *
 * SCREENS (platform recreations):
 *   screens-trigger-temporal.jsx → Trigger.dev runs + Temporal workflows
 *   screens-hatchet-maestro.jsx  → Hatchet DAG + Maestro agents
 *
 * SYSTEMS:
 *   theme-system-demo.jsx      → 5 themes + font scales + live toggle
 *   design-playground.jsx      → Token editor, resize, zoom, modal variants
 *   agent-flow-simulator.jsx   → DAG agent pipeline with animation
 *
 * SHARED UTILS:
 *   src/utils/calculations.js  → calcCard, shouldShow, autoDash
 *   src/utils/parser.js        → parseFieldShorthand, fieldsToShorthand, expandConfig
 *   src/utils/layout.js        → autoLayout (DAG), edgePath (SVG curves)
 *
 * SHARED THEMES:
 *   src/themes/index.js        → THEMES, SCALES, STATUS_COLORS, TAG_COLORS, makeStyles
 */

// Utils
export { calcCard, shouldShow, autoDash, formatCardValue } from './utils/calculations.js';
export { parseFieldShorthand, fieldsToShorthand, expandConfig } from './utils/parser.js';
export { autoLayout, edgePath } from './utils/layout.js';

// Themes
export { THEMES, SCALES, STATUS_COLORS, TAG_COLORS, makeStyles } from './themes/index.js';
