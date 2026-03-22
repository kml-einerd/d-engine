import { useState, createContext, useContext, useMemo } from "react";

// ============================================================
// SISTEMA DE TEMAS — separado do código dos componentes
// Troca tema, fonte, tamanho — tudo sem mexer nos componentes
// ============================================================

// --- TEMAS: ficam num arquivo separado (themes.js) ---
// Cada tema é um objeto plano. Componentes NUNCA usam cor direto.

const THEMES = {
  hacker: {
    name: "Hacker",
    bg: "#0a0a0a",
    bgSurface: "#141414",
    bgHover: "#1e1e1e",
    border: "#222",
    text: "#e0e0e0",
    textMuted: "#888",
    textFaint: "#555",
    accent: "#0f0",
    accentBg: "#0f012",
    danger: "#f44",
    success: "#0c6",
    warning: "#fa0",
    font: "'IBM Plex Mono', 'Courier New', monospace",
    radius: 6,
  },
  clean: {
    name: "Clean",
    bg: "#ffffff",
    bgSurface: "#f5f5f5",
    bgHover: "#eee",
    border: "#e0e0e0",
    text: "#1a1a1a",
    textMuted: "#666",
    textFaint: "#aaa",
    accent: "#2563eb",
    accentBg: "#2563eb12",
    danger: "#dc2626",
    success: "#16a34a",
    warning: "#f59e0b",
    font: "'Inter', 'Helvetica Neue', sans-serif",
    radius: 8,
  },
  midnight: {
    name: "Midnight",
    bg: "#0f172a",
    bgSurface: "#1e293b",
    bgHover: "#334155",
    border: "#334155",
    text: "#f1f5f9",
    textMuted: "#94a3b8",
    textFaint: "#64748b",
    accent: "#a78bfa",
    accentBg: "#a78bfa15",
    danger: "#f87171",
    success: "#4ade80",
    warning: "#fbbf24",
    font: "'DM Sans', 'Segoe UI', sans-serif",
    radius: 10,
  },
  warm: {
    name: "Warm",
    bg: "#1c1917",
    bgSurface: "#292524",
    bgHover: "#3a3533",
    border: "#44403c",
    text: "#fafaf9",
    textMuted: "#a8a29e",
    textFaint: "#78716c",
    accent: "#f97316",
    accentBg: "#f9731615",
    danger: "#ef4444",
    success: "#22c55e",
    warning: "#eab308",
    font: "'Merriweather', Georgia, serif",
    radius: 4,
  },
  pastel: {
    name: "Pastel",
    bg: "#fef7ff",
    bgSurface: "#fce7f3",
    bgHover: "#f9d0e8",
    border: "#f0abfc44",
    text: "#4a044e",
    textMuted: "#86198f",
    textFaint: "#c084fc",
    accent: "#d946ef",
    accentBg: "#d946ef18",
    danger: "#e11d48",
    success: "#16a34a",
    warning: "#ca8a04",
    font: "'Nunito', 'Quicksand', sans-serif",
    radius: 14,
  },
};

// --- FONT SIZES: escala separada ---
const SCALES = {
  xs:  { base: 11, sm: 9,  md: 11, lg: 14, xl: 18, xxl: 24 },
  sm:  { base: 12, sm: 10, md: 12, lg: 16, xl: 20, xxl: 28 },
  md:  { base: 14, sm: 11, md: 14, lg: 18, xl: 24, xxl: 32 },
  lg:  { base: 16, sm: 13, md: 16, lg: 20, xl: 28, xxl: 36 },
  xl:  { base: 18, sm: 14, md: 18, lg: 24, xl: 32, xxl: 42 },
};

// --- CONTEXT: componentes leem daqui ---
const ThemeCtx = createContext();

function useTheme() {
  return useContext(ThemeCtx);
}

// --- STYLE FACTORY: gera estilos a partir do tema ---
// Componentes chamam isso, nunca hardcodam cores
function makeStyles(t, s) {
  return {
    root: { fontFamily: t.font, background: t.bg, color: t.text, minHeight: "100vh", fontSize: s.base, transition: "all 0.3s" },
    card: { background: t.bgSurface, border: `1px solid ${t.border}`, borderRadius: t.radius, padding: 16, marginBottom: 12, transition: "all 0.3s" },
    title: { fontSize: s.xl, fontWeight: "bold", color: t.accent, marginBottom: 4 },
    subtitle: { fontSize: s.lg, fontWeight: "bold", color: t.text },
    text: { fontSize: s.base, color: t.text, lineHeight: 1.6 },
    muted: { fontSize: s.sm, color: t.textMuted },
    faint: { fontSize: s.sm, color: t.textFaint },
    tag: (color) => ({ display: "inline-block", padding: "2px 10px", borderRadius: t.radius * 2, fontSize: s.sm, background: (color || t.accent) + "22", color: color || t.accent, border: `1px solid ${(color || t.accent)}33`, marginRight: 4, marginBottom: 4 }),
    btn: { padding: `${s.sm}px ${s.md + 4}px`, background: t.accent, color: t.bg, border: "none", cursor: "pointer", fontFamily: t.font, fontSize: s.base, fontWeight: "bold", borderRadius: t.radius, transition: "all 0.2s" },
    btnGhost: { padding: `${s.sm}px ${s.md + 4}px`, background: "transparent", color: t.textMuted, border: `1px solid ${t.border}`, cursor: "pointer", fontFamily: t.font, fontSize: s.base, borderRadius: t.radius, transition: "all 0.2s" },
    input: { width: "100%", padding: `${s.sm}px ${s.md}px`, background: t.bgSurface, border: `1px solid ${t.border}`, color: t.text, fontFamily: t.font, fontSize: s.base, borderRadius: t.radius, boxSizing: "border-box", transition: "all 0.3s", outline: "none" },
    table: { width: "100%", borderCollapse: "collapse" },
    th: { textAlign: "left", padding: `${s.sm}px ${s.md}px`, borderBottom: `2px solid ${t.border}`, fontSize: s.sm, color: t.textMuted, textTransform: "uppercase", letterSpacing: 1 },
    td: { padding: `${s.sm}px ${s.md}px`, borderBottom: `1px solid ${t.border}`, fontSize: s.base },
    status: (color) => ({ display: "inline-block", padding: `2px ${s.sm}px`, borderRadius: t.radius, fontSize: s.sm, fontWeight: "bold", background: (color || t.accent) + "22", color: color || t.accent }),
    avatar: { width: s.xl + 4, height: s.xl + 4, borderRadius: "50%", background: t.bgHover, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: s.sm, color: t.textMuted, marginRight: 8, verticalAlign: "middle" },
    divider: { borderTop: `1px solid ${t.border}`, margin: "16px 0" },
    bar: (pct) => ({ height: s.md, width: `${pct}%`, background: t.accent, borderRadius: t.radius, transition: "all 0.3s" }),
    barBg: { background: t.bgSurface, borderRadius: t.radius, overflow: "hidden" },
  };
}

// ============================================================
// COMPONENTES — não sabem nada de cores, só usam useTheme()
// ============================================================

function DemoContent() {
  const { theme: t, scale: s, styles: $ } = useTheme();

  const data = [
    { nome: "Ana Silva", cargo: "Designer Lead", status: "Ativo", dept: "Produto", salario: 12000, tags: ["design", "liderança"] },
    { nome: "João Costa", cargo: "Backend Engineer", status: "Ativo", dept: "Engenharia", salario: 14000, tags: ["backend"] },
    { nome: "Maria Souza", cargo: "UX Researcher", status: "Férias", dept: "Produto", salario: 9500, tags: ["ux", "pesquisa"] },
    { nome: "Pedro Alves", cargo: "DevOps Engineer", status: "Ativo", dept: "Engenharia", salario: 15000, tags: ["devops"] },
    { nome: "Lucas Lima", cargo: "Frontend Dev", status: "Ativo", dept: "Engenharia", salario: 11000, tags: ["frontend"] },
  ];

  const statusColors = { Ativo: t.success, Férias: t.warning, Afastado: t.danger };

  return (
    <div style={{ padding: 24, maxWidth: 900, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={$.title}>Equipe</div>
        <div style={$.muted}>5 pessoas · R${data.reduce((acc,i) => acc + i.salario, 0).toLocaleString("pt-BR")} folha mensal</div>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 24 }}>
        {[
          { label: "Total", val: "5" },
          { label: "Ativos", val: "4" },
          { label: "Média salarial", val: "R$12.300" },
        ].map(item => (
          <div key={item.label} style={$.card}>
            <div style={$.faint}>{item.label}</div>
            <div style={{ fontSize: s.xl, fontWeight: "bold", color: t.accent, marginTop: 4 }}>{item.val}</div>
          </div>
        ))}
      </div>

      {/* Progress */}
      <div style={{ ...$.card, marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
          <span style={$.text}>Orçamento utilizado</span>
          <span style={{ ...$.text, color: t.accent, fontWeight: "bold" }}>73%</span>
        </div>
        <div style={$.barBg}><div style={$.bar(73)} /></div>
      </div>

      {/* Table */}
      <div style={{ ...$.card, padding: 0, overflow: "hidden" }}>
        <table style={$.table}>
          <thead>
            <tr>
              <th style={$.th}>Nome</th>
              <th style={$.th}>Cargo</th>
              <th style={$.th}>Status</th>
              <th style={$.th}>Salário</th>
              <th style={$.th}>Tags</th>
            </tr>
          </thead>
          <tbody>
            {data.map(p => (
              <tr key={p.nome}>
                <td style={$.td}>
                  <span style={$.avatar}>{p.nome.split(" ").map(n => n[0]).join("")}</span>
                  {p.nome}
                </td>
                <td style={$.td}>{p.cargo}</td>
                <td style={$.td}><span style={$.status(statusColors[p.status])}>{p.status}</span></td>
                <td style={{ ...$.td, fontWeight: "bold", color: t.accent }}>R${p.salario.toLocaleString("pt-BR")}</td>
                <td style={$.td}>{p.tags.map(tag => <span key={tag} style={$.tag()}>{tag}</span>)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Form sample */}
      <div style={{ ...$.card, marginTop: 24 }}>
        <div style={{ ...$.subtitle, marginBottom: 12 }}>Adicionar pessoa</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <input style={$.input} placeholder="Nome" />
          <input style={$.input} placeholder="Email" />
          <input style={$.input} placeholder="Cargo" />
          <input style={$.input} placeholder="Salário" type="number" />
        </div>
        <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
          <button style={$.btn}>Salvar</button>
          <button style={$.btnGhost}>Cancelar</button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// THEME CONTROLLER — o painel que troca tudo
// ============================================================

function ThemeController({ themeKey, setThemeKey, sizeKey, setSizeKey }) {
  const { theme: t, scale: s, styles: $ } = useTheme();

  return (
    <div style={{
      position: "fixed", top: 16, right: 16, zIndex: 100,
      background: t.bgSurface, border: `1px solid ${t.border}`,
      borderRadius: t.radius + 4, padding: 16, width: 220,
      fontFamily: t.font, fontSize: s.sm, color: t.text,
      boxShadow: `0 8px 30px ${t.bg}88`,
    }}>
      <div style={{ fontSize: s.md, fontWeight: "bold", color: t.accent, marginBottom: 12 }}>Tema</div>

      {/* Theme selector */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 16 }}>
        {Object.entries(THEMES).map(([key, theme]) => (
          <div key={key}
            onClick={() => setThemeKey(key)}
            style={{
              padding: "6px 12px",
              borderRadius: t.radius,
              background: themeKey === key ? t.accent + "22" : t.bgHover,
              border: `1px solid ${themeKey === key ? t.accent + "55" : t.border}`,
              color: themeKey === key ? t.accent : t.textMuted,
              cursor: "pointer",
              fontSize: s.sm,
              fontWeight: themeKey === key ? "bold" : "normal",
            }}>
            {theme.name}
          </div>
        ))}
      </div>

      {/* Size */}
      <div style={{ fontSize: s.sm, color: t.textMuted, marginBottom: 6 }}>Tamanho do texto</div>
      <div style={{ display: "flex", gap: 4, marginBottom: 16 }}>
        {Object.keys(SCALES).map(key => (
          <div key={key}
            onClick={() => setSizeKey(key)}
            style={{
              flex: 1, textAlign: "center", padding: "6px 0",
              borderRadius: t.radius,
              background: sizeKey === key ? t.accent + "22" : t.bgHover,
              border: `1px solid ${sizeKey === key ? t.accent + "55" : t.border}`,
              color: sizeKey === key ? t.accent : t.textMuted,
              cursor: "pointer",
              fontSize: s.sm,
              fontWeight: sizeKey === key ? "bold" : "normal",
            }}>
            {key.toUpperCase()}
          </div>
        ))}
      </div>

      {/* Preview */}
      <div style={{ borderTop: `1px solid ${t.border}`, paddingTop: 12 }}>
        <div style={{ fontSize: s.sm, color: t.textFaint, marginBottom: 6 }}>Preview</div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          <div style={{ width: 20, height: 20, borderRadius: 4, background: t.accent }} title="accent" />
          <div style={{ width: 20, height: 20, borderRadius: 4, background: t.success }} title="success" />
          <div style={{ width: 20, height: 20, borderRadius: 4, background: t.warning }} title="warning" />
          <div style={{ width: 20, height: 20, borderRadius: 4, background: t.danger }} title="danger" />
          <div style={{ width: 20, height: 20, borderRadius: 4, background: t.bg, border: `1px solid ${t.border}` }} title="bg" />
          <div style={{ width: 20, height: 20, borderRadius: 4, background: t.bgSurface, border: `1px solid ${t.border}` }} title="surface" />
        </div>
        <div style={{ fontSize: s.sm, color: t.textFaint, marginTop: 8 }}>{t.font.split(",")[0].replace(/'/g, "")}</div>
      </div>
    </div>
  );
}

// ============================================================
// APP — junta tudo
// ============================================================

export default function App() {
  const [themeKey, setThemeKey] = useState("hacker");
  const [sizeKey, setSizeKey] = useState("md");

  const theme = THEMES[themeKey];
  const scale = SCALES[sizeKey];
  const styles = useMemo(() => makeStyles(theme, scale), [theme, scale]);

  return (
    <ThemeCtx.Provider value={{ theme, scale, styles }}>
      <div style={styles.root}>
        <ThemeController themeKey={themeKey} setThemeKey={setThemeKey} sizeKey={sizeKey} setSizeKey={setSizeKey} />
        <DemoContent />
      </div>
    </ThemeCtx.Provider>
  );
}
