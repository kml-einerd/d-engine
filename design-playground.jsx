import { useState, useRef, useMemo, useCallback } from "react";

// ============================================================
// DESIGN PLAYGROUND
// Refinamentos visuais + Zoom + Gradientes + Variações de modal
// ============================================================

// --- LIVE DESIGN TOKENS (editáveis em tempo real) ---
const DEFAULT_TOKENS = {
  radius: 8,
  borderWidth: 1,
  borderColor: "#333333",
  bgPrimary: "#0a0a0a",
  bgSurface: "#151515",
  bgHover: "#1e1e1e",
  accent: "#00ff88",
  accentSecondary: "#00aaff",
  text: "#e0e0e0",
  textMuted: "#888888",
  danger: "#ff4444",
  success: "#00cc66",
  warning: "#ffaa00",
  gradientEnabled: true,
  gradientAngle: 135,
  gradientFrom: "#00ff8811",
  gradientTo: "#00aaff08",
  shadowEnabled: true,
  shadowBlur: 12,
  shadowColor: "#00000044",
  font: "mono",
  spacing: 16,
};

const FONTS = {
  mono: "'IBM Plex Mono', 'Courier New', monospace",
  sans: "'Inter', 'Helvetica Neue', sans-serif",
  serif: "'Georgia', 'Merriweather', serif",
  round: "'Nunito', 'Quicksand', sans-serif",
};

function tok2style(tk) {
  const font = FONTS[tk.font] || FONTS.mono;
  const grad = tk.gradientEnabled ? `linear-gradient(${tk.gradientAngle}deg, ${tk.gradientFrom}, ${tk.gradientTo})` : "none";
  const shadow = tk.shadowEnabled ? `0 ${tk.shadowBlur/3}px ${tk.shadowBlur}px ${tk.shadowColor}` : "none";
  return {
    card: {
      background: tk.bgSurface,
      backgroundImage: grad,
      border: `${tk.borderWidth}px solid ${tk.borderColor}`,
      borderRadius: tk.radius,
      boxShadow: shadow,
      fontFamily: font,
      transition: "all 0.25s ease",
    },
    btn: {
      background: tk.accent,
      color: tk.bgPrimary,
      border: "none",
      borderRadius: tk.radius,
      fontFamily: font,
      fontWeight: "bold",
      cursor: "pointer",
      transition: "all 0.2s",
    },
    btnGhost: {
      background: "transparent",
      color: tk.textMuted,
      border: `${tk.borderWidth}px solid ${tk.borderColor}`,
      borderRadius: tk.radius,
      fontFamily: font,
      cursor: "pointer",
      transition: "all 0.2s",
    },
    input: {
      background: tk.bgSurface,
      border: `${tk.borderWidth}px solid ${tk.borderColor}`,
      borderRadius: tk.radius,
      color: tk.text,
      fontFamily: font,
      transition: "all 0.2s",
      outline: "none",
    },
    tag: (color) => ({
      display: "inline-block",
      padding: "3px 10px",
      borderRadius: tk.radius * 3,
      fontSize: 11,
      background: (color || tk.accent) + "22",
      color: color || tk.accent,
      border: `1px solid ${(color || tk.accent)}33`,
    }),
    root: {
      background: tk.bgPrimary,
      color: tk.text,
      fontFamily: font,
      fontSize: 13,
    },
  };
}

// --- RESIZABLE ELEMENT (like Miro) ---
function Resizable({ children, style }) {
  const [size, setSize] = useState({ w: style?.width || 260, h: style?.height || 180 });
  const [scale, setScale] = useState(1);
  const ref = useRef(null);

  const handleResize = (e) => {
    e.preventDefault(); e.stopPropagation();
    const startX = e.clientX, startY = e.clientY;
    const startW = size.w, startH = size.h;
    const mm = (ev) => setSize({ w: Math.max(120, startW + ev.clientX - startX), h: Math.max(80, startH + ev.clientY - startY) });
    const mu = () => { window.removeEventListener("mousemove", mm); window.removeEventListener("mouseup", mu); };
    window.addEventListener("mousemove", mm); window.addEventListener("mouseup", mu);
  };

  const handleWheel = (e) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      setScale(s => Math.max(0.5, Math.min(2, s + (e.deltaY > 0 ? -0.05 : 0.05))));
    }
  };

  return (
    <div style={{ position: "relative", width: size.w, height: size.h, ...style }} onWheel={handleWheel} ref={ref}>
      <div style={{ transform: `scale(${scale})`, transformOrigin: "top left", width: size.w / scale, height: size.h / scale, overflow: "hidden" }}>
        {children}
      </div>
      {/* Resize handle */}
      <div onMouseDown={handleResize} style={{
        position: "absolute", bottom: 0, right: 0, width: 16, height: 16, cursor: "nwse-resize",
        background: "linear-gradient(135deg, transparent 50%, #555 50%)", borderRadius: "0 0 4px 0", opacity: 0.5,
      }} />
      <div style={{ position: "absolute", bottom: -18, right: 0, fontSize: 9, color: "#555" }}>
        {Math.round(size.w)}×{Math.round(size.h)} · {Math.round(scale * 100)}%
      </div>
    </div>
  );
}

// ============================================================
// POPUP VARIATIONS — cada uma diferente
// ============================================================

// 1) SIDE PANEL (abre da direita, foco em texto longo)
function SidePanel({ open, onClose, tk }) {
  const s = tok2style(tk);
  if (!open) return null;
  return (
    <div style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: 420, background: tk.bgSurface, borderLeft: `1px solid ${tk.borderColor}`, zIndex: 60, boxShadow: `-8px 0 30px ${tk.shadowColor}`, display: "flex", flexDirection: "column", fontFamily: FONTS[tk.font], transition: "all 0.3s" }}>
      <div style={{ padding: "16px 20px", borderBottom: `1px solid ${tk.borderColor}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 15, fontWeight: "bold", color: tk.accent }}>Detalhes do Documento</span>
        <button onClick={onClose} style={{ ...s.btnGhost, padding: "4px 10px", fontSize: 12 }}>✕</button>
      </div>
      <div style={{ flex: 1, overflow: "auto", padding: 20 }}>
        <div style={{ fontSize: 10, color: tk.textMuted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>Título</div>
        <div style={{ fontSize: 18, fontWeight: "bold", marginBottom: 16, color: tk.text }}>Relatório de Performance Q1 2026</div>

        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          <span style={s.tag(tk.success)}>Publicado</span>
          <span style={s.tag(tk.accentSecondary)}>relatório</span>
          <span style={s.tag()}>Q1</span>
        </div>

        <div style={{ fontSize: 10, color: tk.textMuted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>Conteúdo</div>
        <div style={{ color: tk.text, lineHeight: 1.8, fontSize: 13, marginBottom: 16 }}>
          Este relatório apresenta os resultados consolidados do primeiro trimestre de 2026. A receita total atingiu R$ 2.4M, um crescimento de 23% em relação ao mesmo período do ano anterior.
          <br /><br />
          Os principais destaques incluem a expansão da base de clientes em 15%, redução do churn para 2.1%, e o lançamento bem-sucedido de 3 novos produtos. O NPS subiu de 42 para 58 pontos.
          <br /><br />
          Para o próximo trimestre, as prioridades são: escalar o time de vendas, implementar automação de marketing, e finalizar a migração para a nova infraestrutura cloud.
        </div>

        <div style={{ borderTop: `1px solid ${tk.borderColor}`, paddingTop: 16 }}>
          <div style={{ fontSize: 10, color: tk.textMuted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Metadados</div>
          {[["Autor", "Ana Silva"], ["Criado", "15 Mar 2026"], ["Atualizado", "22 Mar 2026"], ["Versão", "3.1"]].map(([k, v]) => (
            <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: `1px solid ${tk.borderColor}22`, fontSize: 12 }}>
              <span style={{ color: tk.textMuted }}>{k}</span>
              <span style={{ color: tk.text }}>{v}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// 2) CENTER MODAL com TABLE EDITOR
function TableModal({ open, onClose, tk }) {
  const s = tok2style(tk);
  const [rows, setRows] = useState([
    { item: "Servidor Cloud", qtd: 3, unit: 450, total: 1350 },
    { item: "Licença Software", qtd: 10, unit: 120, total: 1200 },
    { item: "Domínio .com.br", qtd: 2, unit: 40, total: 80 },
    { item: "Certificado SSL", qtd: 5, unit: 89, total: 445 },
  ]);

  const addRow = () => setRows(p => [...p, { item: "", qtd: 1, unit: 0, total: 0 }]);
  const removeRow = (i) => setRows(p => p.filter((_, idx) => idx !== i));
  const updateRow = (i, field, val) => {
    setRows(p => p.map((r, idx) => {
      if (idx !== i) return r;
      const updated = { ...r, [field]: field === "item" ? val : Number(val) };
      if (field === "qtd" || field === "unit") updated.total = updated.qtd * updated.unit;
      return updated;
    }));
  };

  if (!open) return null;
  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "#000a", zIndex: 60, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={onClose}>
      <div style={{ ...s.card, padding: 0, width: 600, maxHeight: "80vh", overflow: "hidden" }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: "16px 20px", borderBottom: `1px solid ${tk.borderColor}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 15, fontWeight: "bold", color: tk.accent }}>Editor de Tabela</span>
          <button onClick={onClose} style={{ ...s.btnGhost, padding: "4px 10px", fontSize: 12 }}>✕</button>
        </div>
        <div style={{ overflow: "auto", maxHeight: "60vh" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["Item", "Qtd", "Unit (R$)", "Total (R$)", ""].map(h => (
                  <th key={h} style={{ textAlign: "left", padding: "8px 12px", borderBottom: `2px solid ${tk.borderColor}`, fontSize: 10, color: tk.textMuted, textTransform: "uppercase" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i}>
                  <td style={{ padding: "4px 8px", borderBottom: `1px solid ${tk.borderColor}22` }}>
                    <input style={{ ...s.input, padding: "6px 8px", fontSize: 12, width: "100%", boxSizing: "border-box" }} value={row.item} onChange={e => updateRow(i, "item", e.target.value)} />
                  </td>
                  <td style={{ padding: "4px 8px", borderBottom: `1px solid ${tk.borderColor}22`, width: 70 }}>
                    <input style={{ ...s.input, padding: "6px 8px", fontSize: 12, width: "100%", boxSizing: "border-box", textAlign: "right" }} type="number" value={row.qtd} onChange={e => updateRow(i, "qtd", e.target.value)} />
                  </td>
                  <td style={{ padding: "4px 8px", borderBottom: `1px solid ${tk.borderColor}22`, width: 100 }}>
                    <input style={{ ...s.input, padding: "6px 8px", fontSize: 12, width: "100%", boxSizing: "border-box", textAlign: "right" }} type="number" value={row.unit} onChange={e => updateRow(i, "unit", e.target.value)} />
                  </td>
                  <td style={{ padding: "8px 12px", borderBottom: `1px solid ${tk.borderColor}22`, fontWeight: "bold", color: tk.accent, fontSize: 12 }}>
                    R$ {row.total.toLocaleString("pt-BR")}
                  </td>
                  <td style={{ padding: "4px 8px", borderBottom: `1px solid ${tk.borderColor}22`, width: 40 }}>
                    <button onClick={() => removeRow(i)} style={{ ...s.btnGhost, padding: "2px 8px", fontSize: 11, color: tk.danger, borderColor: tk.danger + "44" }}>✕</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ padding: "12px 20px", borderTop: `1px solid ${tk.borderColor}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <button onClick={addRow} style={{ ...s.btnGhost, padding: "6px 14px", fontSize: 12 }}>+ Linha</button>
          <div style={{ fontSize: 14, fontWeight: "bold", color: tk.accent }}>
            Total: R$ {rows.reduce((acc, r) => acc + r.total, 0).toLocaleString("pt-BR")}
          </div>
        </div>
      </div>
    </div>
  );
}

// 3) INLINE EXPAND (expande no lugar, sem overlay)
function InlineExpand({ expanded, children, tk }) {
  const s = tok2style(tk);
  return (
    <div style={{
      ...s.card,
      padding: expanded ? 20 : 14,
      maxHeight: expanded ? 500 : 60,
      overflow: "hidden",
      transition: "all 0.35s cubic-bezier(0.4, 0, 0.2, 1)",
      cursor: "pointer",
    }}>
      {children}
    </div>
  );
}

// 4) TOAST NOTIFICATION
function Toast({ visible, message, type, tk }) {
  const colors = { success: tk.success, danger: tk.danger, warning: tk.warning, info: tk.accentSecondary };
  const color = colors[type] || tk.accent;
  return (
    <div style={{
      position: "fixed", bottom: visible ? 24 : -60, left: "50%", transform: "translateX(-50%)",
      background: tk.bgSurface, border: `1px solid ${color}44`, borderLeft: `4px solid ${color}`,
      borderRadius: tk.radius, padding: "12px 20px", fontSize: 13,
      fontFamily: FONTS[tk.font], color: tk.text, zIndex: 70,
      boxShadow: `0 8px 24px ${tk.shadowColor}`, transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
      display: "flex", alignItems: "center", gap: 10,
    }}>
      <span style={{ color, fontSize: 16 }}>{type === "success" ? "✓" : type === "danger" ? "✕" : type === "warning" ? "⚠" : "ℹ"}</span>
      <span>{message}</span>
    </div>
  );
}

// 5) COMPACT POPOVER (pequeno, aparece perto do elemento)
function Popover({ pos, onClose, tk }) {
  const s = tok2style(tk);
  if (!pos) return null;
  return (<>
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 55 }} onClick={onClose} />
    <div style={{
      position: "fixed", left: pos.x, top: pos.y, zIndex: 56,
      ...s.card, padding: 0, width: 200, overflow: "hidden",
    }}>
      {["Editar", "Duplicar", "Mover para...", "Exportar PDF"].map((item, i) => (
        <div key={i} onClick={onClose} style={{
          padding: "10px 14px", fontSize: 12, cursor: "pointer", color: tk.text,
          borderBottom: i < 3 ? `1px solid ${tk.borderColor}22` : "none",
          transition: "background 0.1s",
        }}
          onMouseEnter={e => { e.target.style.background = tk.bgHover; }}
          onMouseLeave={e => { e.target.style.background = "transparent"; }}>
          {item}
        </div>
      ))}
      <div style={{ borderTop: `1px solid ${tk.borderColor}`, padding: "10px 14px", fontSize: 12, color: tk.danger, cursor: "pointer" }}
        onMouseEnter={e => { e.target.style.background = tk.danger + "11"; }}
        onMouseLeave={e => { e.target.style.background = "transparent"; }}
        onClick={onClose}>Deletar</div>
    </div>
  </>);
}

// ============================================================
// DESIGN CONTROL PANEL
// ============================================================

function DesignPanel({ tk, setTk }) {
  const Slider = ({ label, field, min, max, step }) => (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: tk.textMuted, marginBottom: 3 }}>
        <span>{label}</span><span style={{ color: tk.accent }}>{tk[field]}</span>
      </div>
      <input type="range" min={min} max={max} step={step || 1} value={tk[field]}
        onChange={e => setTk(p => ({ ...p, [field]: Number(e.target.value) }))}
        style={{ width: "100%", accentColor: tk.accent }} />
    </div>
  );

  const Color = ({ label, field }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
      <input type="color" value={tk[field]} onChange={e => setTk(p => ({ ...p, [field]: e.target.value }))}
        style={{ width: 28, height: 28, border: `1px solid ${tk.borderColor}`, borderRadius: tk.radius, cursor: "pointer", padding: 0, background: "none" }} />
      <div>
        <div style={{ fontSize: 10, color: tk.textMuted }}>{label}</div>
        <div style={{ fontSize: 11, color: tk.text }}>{tk[field]}</div>
      </div>
    </div>
  );

  const Toggle = ({ label, field }) => (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, cursor: "pointer" }}
      onClick={() => setTk(p => ({ ...p, [field]: !p[field] }))}>
      <span style={{ fontSize: 11, color: tk.textMuted }}>{label}</span>
      <div style={{
        width: 36, height: 20, borderRadius: 10, background: tk[field] ? tk.accent + "44" : tk.bgHover,
        border: `1px solid ${tk[field] ? tk.accent + "66" : tk.borderColor}`, position: "relative", transition: "all 0.2s",
      }}>
        <div style={{
          width: 14, height: 14, borderRadius: "50%", background: tk[field] ? tk.accent : tk.textMuted,
          position: "absolute", top: 2, left: tk[field] ? 19 : 2, transition: "all 0.2s",
        }} />
      </div>
    </div>
  );

  return (
    <div style={{
      width: 240, borderRight: `1px solid ${tk.borderColor}`, background: tk.bgSurface,
      overflow: "auto", padding: 16, fontFamily: FONTS[tk.font], fontSize: 12,
    }}>
      <div style={{ fontSize: 13, fontWeight: "bold", color: tk.accent, marginBottom: 16 }}>Design Tokens</div>

      <div style={{ fontSize: 10, color: tk.textMuted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Forma</div>
      <Slider label="Border Radius" field="radius" min={0} max={24} />
      <Slider label="Border Width" field="borderWidth" min={0} max={4} />
      <Slider label="Spacing" field="spacing" min={8} max={32} />

      <div style={{ fontSize: 10, color: tk.textMuted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8, marginTop: 16 }}>Cores</div>
      <Color label="Accent" field="accent" />
      <Color label="Accent 2" field="accentSecondary" />
      <Color label="Background" field="bgPrimary" />
      <Color label="Surface" field="bgSurface" />
      <Color label="Border" field="borderColor" />
      <Color label="Text" field="text" />

      <div style={{ fontSize: 10, color: tk.textMuted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8, marginTop: 16 }}>Gradiente</div>
      <Toggle label="Ativar gradiente" field="gradientEnabled" />
      {tk.gradientEnabled && <>
        <Slider label="Ângulo" field="gradientAngle" min={0} max={360} />
        <Color label="Cor início" field="gradientFrom" />
        <Color label="Cor fim" field="gradientTo" />
      </>}

      <div style={{ fontSize: 10, color: tk.textMuted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8, marginTop: 16 }}>Sombra</div>
      <Toggle label="Ativar sombra" field="shadowEnabled" />
      {tk.shadowEnabled && <Slider label="Blur" field="shadowBlur" min={0} max={40} />}

      <div style={{ fontSize: 10, color: tk.textMuted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8, marginTop: 16 }}>Fonte</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
        {Object.keys(FONTS).map(f => (
          <div key={f} onClick={() => setTk(p => ({ ...p, font: f }))} style={{
            padding: "4px 10px", borderRadius: tk.radius, cursor: "pointer", fontSize: 11,
            background: tk.font === f ? tk.accent + "22" : tk.bgHover,
            border: `1px solid ${tk.font === f ? tk.accent + "55" : tk.borderColor}`,
            color: tk.font === f ? tk.accent : tk.textMuted,
            fontFamily: FONTS[f],
          }}>{f}</div>
        ))}
      </div>

      <div style={{ marginTop: 20, paddingTop: 12, borderTop: `1px solid ${tk.borderColor}` }}>
        <button onClick={() => setTk(DEFAULT_TOKENS)} style={{
          width: "100%", padding: "8px", background: "transparent", border: `1px solid ${tk.borderColor}`,
          color: tk.textMuted, borderRadius: tk.radius, cursor: "pointer", fontFamily: FONTS[tk.font], fontSize: 11,
        }}>Reset</button>
      </div>
    </div>
  );
}

// ============================================================
// MAIN
// ============================================================

export default function App() {
  const [tk, setTk] = useState(DEFAULT_TOKENS);
  const s = useMemo(() => tok2style(tk), [tk]);

  const [sideOpen, setSideOpen] = useState(false);
  const [tableOpen, setTableOpen] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [toast, setToast] = useState(null);
  const [popover, setPopover] = useState(null);

  const showToast = (msg, type) => { setToast({ msg, type }); setTimeout(() => setToast(null), 2500); };

  const expandItems = [
    { id: 1, title: "Receita Mensal", preview: "R$ 142.000", detail: "Janeiro: R$ 120k · Fevereiro: R$ 135k · Março: R$ 142k\n\nCrescimento de 18% no trimestre. Meta Q2: R$ 180k. Principais drivers: expansão do plano Enterprise e redução do churn de 4.2% para 2.8%." },
    { id: 2, title: "Tickets Abertos", preview: "23 tickets", detail: "Críticos: 3 · Altos: 8 · Médios: 7 · Baixos: 5\n\nTempo médio de resolução: 4.2h. SLA compliance: 94%. Backlog cresceu 12% vs mês anterior — considerar priorizar contratação de suporte." },
    { id: 3, title: "Deploy Pipeline", preview: "98.7% uptime", detail: "Último deploy: há 2h (v3.4.1)\nDeploys no mês: 47 · Rollbacks: 2\n\nIncidente recente: timeout no serviço de auth em 18/03, resolvido em 23min. Post-mortem pendente." },
  ];

  return (
    <div style={{ ...s.root, height: "100vh", display: "flex", overflow: "hidden" }}>
      {/* Design Panel */}
      <DesignPanel tk={tk} setTk={setTk} />

      {/* Main content */}
      <div style={{ flex: 1, overflow: "auto", padding: tk.spacing * 1.5 }}>
        <div style={{ maxWidth: 800, margin: "0 auto" }}>

          <div style={{ fontSize: 20, fontWeight: "bold", color: tk.accent, marginBottom: 4 }}>Playground</div>
          <div style={{ fontSize: 12, color: tk.textMuted, marginBottom: tk.spacing * 1.5 }}>Ajuste os tokens na esquerda — tudo muda em tempo real</div>

          {/* Section: Resizable elements */}
          <div style={{ fontSize: 11, color: tk.textMuted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>Resize + Zoom (Ctrl+scroll)</div>
          <div style={{ display: "flex", gap: tk.spacing, marginBottom: tk.spacing * 2, flexWrap: "wrap" }}>
            <Resizable style={{ width: 220, height: 140 }}>
              <div style={{ ...s.card, height: "100%", padding: 14, boxSizing: "border-box" }}>
                <div style={{ fontSize: 10, color: tk.textMuted, textTransform: "uppercase" }}>Receita</div>
                <div style={{ fontSize: 28, fontWeight: "bold", color: tk.accent, marginTop: 8 }}>R$ 142k</div>
                <div style={{ fontSize: 11, color: tk.success, marginTop: 4 }}>▲ 18%</div>
              </div>
            </Resizable>
            <Resizable style={{ width: 220, height: 140 }}>
              <div style={{ ...s.card, height: "100%", padding: 14, boxSizing: "border-box", backgroundImage: `linear-gradient(${tk.gradientAngle}deg, ${tk.accentSecondary}15, ${tk.accent}08)` }}>
                <div style={{ fontSize: 10, color: tk.textMuted, textTransform: "uppercase" }}>Clientes</div>
                <div style={{ fontSize: 28, fontWeight: "bold", color: tk.accentSecondary, marginTop: 8 }}>1.847</div>
                <div style={{ fontSize: 11, color: tk.success, marginTop: 4 }}>▲ 23 este mês</div>
              </div>
            </Resizable>
          </div>

          {/* Section: Popup variations */}
          <div style={{ fontSize: 11, color: tk.textMuted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>Variações de Popup / Interação</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: tk.spacing, marginBottom: tk.spacing * 2 }}>
            <button onClick={() => setSideOpen(true)} style={{ ...s.card, padding: 16, cursor: "pointer", textAlign: "center", border: `${tk.borderWidth}px solid ${tk.accentSecondary}33` }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>◨</div>
              <div style={{ fontSize: 12, fontWeight: "bold", color: tk.text }}>Side Panel</div>
              <div style={{ fontSize: 10, color: tk.textMuted, marginTop: 4 }}>Texto longo, metadata</div>
            </button>
            <button onClick={() => setTableOpen(true)} style={{ ...s.card, padding: 16, cursor: "pointer", textAlign: "center", border: `${tk.borderWidth}px solid ${tk.accent}33` }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>▤</div>
              <div style={{ fontSize: 12, fontWeight: "bold", color: tk.text }}>Table Editor</div>
              <div style={{ fontSize: 10, color: tk.textMuted, marginTop: 4 }}>Editar linhas, calcular</div>
            </button>
            <button onClick={e => setPopover({ x: e.clientX, y: e.clientY })} style={{ ...s.card, padding: 16, cursor: "pointer", textAlign: "center", border: `${tk.borderWidth}px solid ${tk.warning}33` }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>◱</div>
              <div style={{ fontSize: 12, fontWeight: "bold", color: tk.text }}>Popover</div>
              <div style={{ fontSize: 10, color: tk.textMuted, marginTop: 4 }}>Menu rápido</div>
            </button>
            <button onClick={() => showToast("Arquivo salvo com sucesso!", "success")} style={{ ...s.card, padding: 16, cursor: "pointer", textAlign: "center", border: `${tk.borderWidth}px solid ${tk.success}33` }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>◳</div>
              <div style={{ fontSize: 12, fontWeight: "bold", color: tk.text }}>Toast</div>
              <div style={{ fontSize: 10, color: tk.textMuted, marginTop: 4 }}>Notificação rápida</div>
            </button>
          </div>

          {/* Toasts demo */}
          <div style={{ display: "flex", gap: 8, marginBottom: tk.spacing * 2 }}>
            {[
              { label: "Sucesso", type: "success", msg: "Operação concluída!" },
              { label: "Erro", type: "danger", msg: "Falha ao salvar arquivo" },
              { label: "Aviso", type: "warning", msg: "Conexão instável" },
              { label: "Info", type: "info", msg: "Novo update disponível" },
            ].map(t => (
              <button key={t.type} onClick={() => showToast(t.msg, t.type)} style={{ ...s.btnGhost, padding: "6px 14px", fontSize: 11 }}>
                {t.label}
              </button>
            ))}
          </div>

          {/* Section: Inline expand */}
          <div style={{ fontSize: 11, color: tk.textMuted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>Expand Inline (sem overlay)</div>
          {expandItems.map(item => (
            <div key={item.id} onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}>
              <InlineExpand expanded={expandedId === item.id} tk={tk}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 16 }}>{expandedId === item.id ? "▾" : "▸"}</span>
                    <span style={{ fontWeight: "bold", color: tk.text }}>{item.title}</span>
                  </div>
                  <span style={{ fontSize: 12, color: tk.accent, fontWeight: "bold" }}>{item.preview}</span>
                </div>
                {expandedId === item.id && (
                  <div style={{ marginTop: 16, paddingTop: 12, borderTop: `1px solid ${tk.borderColor}`, color: tk.textMuted, lineHeight: 1.8, fontSize: 12, whiteSpace: "pre-line" }}>
                    {item.detail}
                  </div>
                )}
              </InlineExpand>
            </div>
          ))}

          {/* Section: Gradient showcase */}
          <div style={{ fontSize: 11, color: tk.textMuted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 12, marginTop: tk.spacing * 2 }}>Gradientes</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: tk.spacing, marginBottom: tk.spacing }}>
            {[
              { from: tk.accent, to: tk.accentSecondary, label: "Accent" },
              { from: tk.success, to: tk.accentSecondary, label: "Fresh" },
              { from: tk.warning, to: tk.danger, label: "Warm" },
            ].map((g, i) => (
              <div key={i} style={{
                ...s.card, padding: 20,
                backgroundImage: `linear-gradient(${tk.gradientAngle}deg, ${g.from}22, ${g.to}22)`,
                borderColor: g.from + "33",
              }}>
                <div style={{ fontSize: 10, color: tk.textMuted }}>{g.label}</div>
                <div style={{ height: 8, borderRadius: tk.radius, background: `linear-gradient(90deg, ${g.from}, ${g.to})`, marginTop: 8 }} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Overlays */}
      <SidePanel open={sideOpen} onClose={() => setSideOpen(false)} tk={tk} />
      <TableModal open={tableOpen} onClose={() => setTableOpen(false)} tk={tk} />
      <Popover pos={popover} onClose={() => setPopover(null)} tk={tk} />
      <Toast visible={!!toast} message={toast?.msg || ""} type={toast?.type || "info"} tk={tk} />
    </div>
  );
}
