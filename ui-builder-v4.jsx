import { useState, useRef, useCallback, useEffect, useMemo, useReducer } from "react";

// ============================================================
// DECLARATIVE UI BUILDER v4 — ULTIMATE
// Canvas + IA + Undo/Redo + Cmd Palette + Context Menu
// + Preview: Table, Kanban, ClickUp, Notion, Gallery, Files
// ============================================================

// --- BLOCK TYPES ---
const BLOCK_TYPES = {
  crud: { label: "CRUD", icon: "☰", color: "#0f0", desc: "Tabela + Form" },
  dash: { label: "Dashboard", icon: "◧", color: "#0af", desc: "Cards + Charts" },
  form: { label: "Form", icon: "▤", color: "#fa0", desc: "Formulário" },
  kanban: { label: "Kanban", icon: "▥", color: "#f0a", desc: "Board" },
  detail: { label: "Detalhe", icon: "◉", color: "#ff0", desc: "View registro" },
  list: { label: "Lista", icon: "☷", color: "#0ff", desc: "Lista simples" },
  stat: { label: "Stat", icon: "▣", color: "#f80", desc: "Métrica" },
  chart: { label: "Chart", icon: "◔", color: "#a0f", desc: "Gráfico" },
  gallery: { label: "Galeria", icon: "▦", color: "#f55", desc: "Grid de cards" },
  files: { label: "Arquivos", icon: "📁", color: "#8a5", desc: "Pastas" },
};

const FIELD_PRESETS = {
  pessoa: "nome! email@ telefone cpf",
  empresa: "razão_social! cnpj nome_fantasia segmento",
  endereco: "cep rua número bairro cidade estado:SP|RJ|MG|BA|RS|PR|SC|PE|CE|GO",
  contato: "telefone celular email@",
  financeiro: "valor$ data tipo:Receita|Despesa",
  pipeline: "status:Lead|Qualificado|Proposta|Negociação|Fechado|Perdido",
  tarefas: "status:Pendente|Fazendo|Feito|Bloqueado prioridade:Alta|Média|Baixa",
};

// --- SHORTHAND PARSER ---
function parseFields(s) {
  if (!s?.trim()) return {};
  const fields = {};
  s.trim().split(/\s+/).forEach(t => {
    let n, type = "text", req = false, opts = null;
    if (t.endsWith("!")) { req = true; t = t.slice(0, -1); }
    if (t.includes(":")) { const [a, b] = t.split(":"); n = a; type = "select"; opts = b.split("|"); if (n.endsWith("!")) { req = true; n = n.slice(0, -1); } }
    else if (t.endsWith("$")) { n = t.slice(0, -1); type = "number"; }
    else if (t.endsWith("#")) { n = t.slice(0, -1); type = "number"; }
    else if (t.endsWith("...")) { n = t.slice(0, -3); type = "textarea"; }
    else if (t.endsWith("@")) { n = t.slice(0, -1); type = "email"; }
    else { n = t; }
    const c = { type }; if (req) c.required = true; if (opts) c.options = opts;
    fields[n] = c;
  });
  return fields;
}

function autoDash(fields) {
  const cards = [{ label: "Total", calc: "count" }], charts = [];
  Object.entries(fields).forEach(([n, c]) => {
    if (c.type === "select" && c.options) {
      const pos = c.options.find(o => /ativo|feito|pago|fechado|conclu|entregue|resolvido/i.test(o));
      if (pos) cards.push({ label: pos, calc: "count", where: { [n]: pos } });
      charts.push({ type: "bar", groupBy: n, label: `Por ${n}` });
    }
    if (c.type === "number") cards.push({ label: `Σ ${n}`, calc: "sum", field: n, prefix: /preco|preço|valor|salário|orcamento/.test(n) ? "R$ " : "" });
  });
  return { cards: cards.slice(0, 5), charts: charts.slice(0, 2) };
}

// --- UNDO/REDO ---
function useHistory(initial) {
  const [history, setHistory] = useState({ past: [], present: initial, future: [] });
  const set = useCallback((val) => {
    setHistory(h => ({
      past: [...h.past.slice(-30), h.present],
      present: typeof val === "function" ? val(h.present) : val,
      future: [],
    }));
  }, []);
  const undo = useCallback(() => {
    setHistory(h => {
      if (!h.past.length) return h;
      return { past: h.past.slice(0, -1), present: h.past[h.past.length - 1], future: [h.present, ...h.future.slice(0, 30)] };
    });
  }, []);
  const redo = useCallback(() => {
    setHistory(h => {
      if (!h.future.length) return h;
      return { past: [...h.past, h.present], present: h.future[0], future: h.future.slice(1) };
    });
  }, []);
  return [history.present, set, undo, redo, history.past.length, history.future.length];
}

// --- STYLES ---
const Z = {
  root: { fontFamily: "'IBM Plex Mono','Courier New',monospace", background: "#0a0a0a", color: "#e0e0e0", height: "100vh", display: "flex", flexDirection: "column", fontSize: 13, overflow: "hidden", position: "relative" },
  topBar: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 16px", borderBottom: "1px solid #222", background: "#0d0d0d", zIndex: 20, minHeight: 40 },
  logo: { fontSize: 14, fontWeight: "bold", color: "#0f0", display: "flex", alignItems: "center", gap: 8 },
  badge: { fontSize: 9, padding: "2px 6px", background: "#0f02", border: "1px solid #0f03", borderRadius: 8, color: "#0f0" },
  tbtn: (a) => ({ padding: "5px 10px", background: a ? "#0f02" : "transparent", border: `1px solid ${a ? "#0f03" : "#333"}`, color: a ? "#0f0" : "#888", cursor: "pointer", fontFamily: "inherit", fontSize: 11, borderRadius: 4, display: "flex", alignItems: "center", gap: 4 }),
  main: { display: "flex", flex: 1, overflow: "hidden" },
  sidebar: { width: 200, borderRight: "1px solid #222", background: "#0d0d0d", display: "flex", flexDirection: "column", overflow: "auto" },
  sideSection: { padding: "10px 12px", borderBottom: "1px solid #1a1a1a" },
  sideTitle: { fontSize: 9, color: "#555", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 },
  blockItem: (col) => ({ display: "flex", alignItems: "center", gap: 6, padding: "6px 8px", background: "#1a1a1a", border: `1px solid ${col}22`, borderRadius: 4, cursor: "grab", marginBottom: 4, fontSize: 11, userSelect: "none" }),
  blockIcon: (col) => ({ width: 22, height: 22, borderRadius: 4, background: col + "22", color: col, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, flexShrink: 0 }),
  canvas: { flex: 1, position: "relative", overflow: "auto", background: "#111" },
  canvasInner: { position: "relative", minWidth: 3000, minHeight: 2000, backgroundImage: "radial-gradient(circle, #1a1a1a 1px, transparent 1px)", backgroundSize: "24px 24px" },
  node: (col, locked, sel) => ({ position: "absolute", width: 240, background: locked ? "#181818" : "#141414", border: `2px solid ${sel ? "#fff" : locked ? col + "55" : col + "33"}`, borderRadius: 8, cursor: "grab", boxShadow: sel ? `0 0 16px ${col}22` : "0 2px 6px #0004", zIndex: sel ? 5 : 1 }),
  nodeHead: (col) => ({ padding: "8px 10px", borderBottom: `1px solid ${col}18`, display: "flex", alignItems: "center", justifyContent: "space-between" }),
  nodeTitle: { display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: "bold" },
  nodeBtn: (a) => ({ width: 20, height: 20, borderRadius: 3, border: "1px solid #333", background: a ? "#0f02" : "transparent", color: a ? "#0f0" : "#666", cursor: "pointer", fontSize: 10, display: "flex", alignItems: "center", justifyContent: "center", padding: 0 }),
  nodeBody: { padding: "6px 10px", fontSize: 10 },
  nodeField: { padding: "2px 0", color: "#999", display: "flex", alignItems: "center", gap: 4 },
  ft: (c) => ({ fontSize: 8, padding: "0 4px", borderRadius: 3, background: c + "22", color: c }),
  port: (side) => ({ position: "absolute", width: 12, height: 12, borderRadius: "50%", background: "#333", border: "2px solid #555", cursor: "crosshair", zIndex: 10, transition: "all 0.15s", ...(side === "right" ? { right: -7, top: "50%" } : { left: -7, top: "50%" }), transform: "translateY(-50%)" }),
  lockB: { fontSize: 8, padding: "1px 5px", borderRadius: 3, background: "#0f02", color: "#0f0", border: "1px solid #0f03" },
  genB: { fontSize: 8, padding: "1px 5px", borderRadius: 3, background: "#fa02", color: "#fa0", border: "1px solid #fa03" },
  panel: { width: 280, borderLeft: "1px solid #222", background: "#0d0d0d", overflow: "auto", display: "flex", flexDirection: "column" },
  panelHead: { padding: "10px 14px", borderBottom: "1px solid #222", fontSize: 12, fontWeight: "bold", color: "#0f0" },
  panelBody: { padding: "10px 14px", flex: 1, overflow: "auto" },
  pl: { fontSize: 9, color: "#555", textTransform: "uppercase", letterSpacing: 1, marginBottom: 3, marginTop: 10 },
  pi: { width: "100%", padding: "6px 8px", background: "#1a1a1a", border: "1px solid #333", color: "#eee", fontFamily: "inherit", fontSize: 11, borderRadius: 3, boxSizing: "border-box", marginBottom: 6 },
  pta: { width: "100%", padding: "6px 8px", background: "#1a1a1a", border: "1px solid #333", color: "#eee", fontFamily: "inherit", fontSize: 11, borderRadius: 3, boxSizing: "border-box", minHeight: 60, resize: "vertical" },
  ps: { width: "100%", padding: "6px 8px", background: "#1a1a1a", border: "1px solid #333", color: "#eee", fontFamily: "inherit", fontSize: 11, borderRadius: 3, marginBottom: 6 },
  pb: (c) => ({ padding: "5px 10px", background: c || "#0f0", color: c === "#900" ? "#fff" : "#000", border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: 11, fontWeight: "bold", borderRadius: 3, marginRight: 4 }),
  chip: { display: "inline-block", padding: "3px 8px", background: "#1a1a1a", border: "1px solid #333", borderRadius: 10, fontSize: 10, cursor: "pointer", margin: "0 3px 3px 0", color: "#888" },
  aiBar: { display: "flex", gap: 8, padding: "8px 16px", borderTop: "1px solid #222", background: "#0d0d0d" },
  aiInput: { flex: 1, padding: "8px 12px", background: "#1a1a1a", border: "1px solid #333", color: "#eee", fontFamily: "inherit", fontSize: 12, borderRadius: 6, outline: "none" },
  aiBtn: (ok) => ({ padding: "8px 14px", background: ok ? "#0f0" : "#333", color: ok ? "#000" : "#666", border: "none", cursor: ok ? "pointer" : "default", fontFamily: "inherit", fontSize: 12, fontWeight: "bold", borderRadius: 6 }),
  status: { padding: "0 16px 4px", fontSize: 10, color: "#555" },
  // Command Palette
  overlay: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "#000a", zIndex: 100, display: "flex", alignItems: "flex-start", justifyContent: "center", paddingTop: 120 },
  cmdBox: { width: 480, background: "#1a1a1a", border: "1px solid #333", borderRadius: 12, overflow: "hidden", boxShadow: "0 20px 60px #000a" },
  cmdInput: { width: "100%", padding: "14px 18px", background: "transparent", border: "none", borderBottom: "1px solid #222", color: "#eee", fontFamily: "inherit", fontSize: 14, outline: "none", boxSizing: "border-box" },
  cmdItem: (a) => ({ padding: "10px 18px", cursor: "pointer", background: a ? "#0f01" : "transparent", borderLeft: a ? "2px solid #0f0" : "2px solid transparent", display: "flex", alignItems: "center", gap: 10, fontSize: 12 }),
  cmdIcon: { fontSize: 14, width: 24, textAlign: "center" },
  cmdLabel: { flex: 1 },
  cmdShort: { fontSize: 10, color: "#555", background: "#1a1a1a", padding: "2px 6px", borderRadius: 3, border: "1px solid #2a2a2a" },
  // Context Menu
  ctxMenu: { position: "fixed", background: "#1e1e1e", border: "1px solid #333", borderRadius: 8, padding: "4px 0", minWidth: 180, boxShadow: "0 8px 30px #000a", zIndex: 50 },
  ctxItem: { padding: "8px 14px", cursor: "pointer", fontSize: 12, display: "flex", alignItems: "center", gap: 8 },
  ctxSep: { borderTop: "1px solid #2a2a2a", margin: "4px 0" },
  // Preview
  pvWrap: { flex: 1, overflow: "auto", background: "#111", padding: 20 },
  pvNav: { display: "flex", gap: 0, borderBottom: "1px solid #333", background: "#1a1a1a", marginBottom: 16, borderRadius: "8px 8px 0 0", overflow: "hidden" },
  pvTab: (a) => ({ padding: "8px 16px", background: a ? "#252525" : "transparent", color: a ? "#fff" : "#888", border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: 12, borderBottom: a ? "2px solid #0f0" : "2px solid transparent" }),
  pvTitle: { fontSize: 16, fontWeight: "bold", color: "#0f0", marginBottom: 16 },
  // View modes
  viewBar: { display: "flex", gap: 4, marginBottom: 12 },
  viewBtn: (a) => ({ padding: "4px 10px", background: a ? "#0f02" : "#1a1a1a", border: `1px solid ${a ? "#0f03" : "#333"}`, color: a ? "#0f0" : "#888", cursor: "pointer", fontFamily: "inherit", fontSize: 10, borderRadius: 4 }),
  // Table
  tbl: { width: "100%", borderCollapse: "collapse" },
  th: { textAlign: "left", padding: "6px 10px", borderBottom: "1px solid #333", fontSize: 10, color: "#888", textTransform: "uppercase" },
  td: { padding: "6px 10px", borderBottom: "1px solid #1e1e1e", fontSize: 12 },
  tag: (v) => { const m={"Novo":"#05f","Ativo":"#0a0","Inativo":"#888","Pendente":"#f80","Fazendo":"#0af","Feito":"#0a0","Bloqueado":"#f00","Lead":"#f80","Qualificado":"#0af","Negociação":"#fa0","Proposta":"#fa0","Fechado":"#0a0","Perdido":"#f00","Alta":"#f00","Média":"#fa0","Baixa":"#888","Receita":"#0a0","Despesa":"#f00","Cancelado":"#f00","Aberto":"#05f","Pago":"#0a0","Crítica":"#f00","Resolvido":"#0a0","Enviado":"#fa0","Entregue":"#0a0"}; const bg=m[v]||"#555"; return{display:"inline-block",padding:"2px 7px",borderRadius:8,fontSize:10,background:bg+"22",color:bg,border:`1px solid ${bg}44`}; },
  // Kanban
  kbBoard: { display: "flex", gap: 12, overflow: "auto", paddingBottom: 12 },
  kbCol: { minWidth: 200, maxWidth: 240, background: "#1a1a1a", borderRadius: 8, border: "1px solid #222", flexShrink: 0 },
  kbColHead: (c) => ({ padding: "10px 12px", borderBottom: "1px solid #222", fontSize: 11, fontWeight: "bold", color: c || "#aaa", display: "flex", justifyContent: "space-between" }),
  kbCards: { padding: 8, display: "flex", flexDirection: "column", gap: 6, minHeight: 60 },
  kbCard: { padding: "8px 10px", background: "#222", borderRadius: 6, border: "1px solid #333", fontSize: 11, lineHeight: 1.5 },
  kbCardTitle: { fontWeight: "bold", marginBottom: 4 },
  kbCardMeta: { fontSize: 10, color: "#666" },
  // Gallery
  galGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12 },
  galCard: { background: "#1a1a1a", borderRadius: 8, border: "1px solid #222", overflow: "hidden" },
  galImg: (h) => ({ height: h || 120, background: `hsl(${Math.random()*360}, 40%, 15%)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, color: "#333" }),
  galBody: { padding: "10px 12px" },
  galTitle: { fontSize: 12, fontWeight: "bold", marginBottom: 4 },
  galMeta: { fontSize: 10, color: "#666" },
  // Notion
  notionRow: { display: "flex", padding: "8px 0", borderBottom: "1px solid #1a1a1a", alignItems: "center", gap: 12 },
  notionIcon: { width: 28, height: 28, borderRadius: 4, background: "#1e1e1e", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 },
  notionTitle: { flex: 1, fontSize: 13 },
  notionProp: { fontSize: 10, color: "#666", padding: "2px 8px", background: "#1a1a1a", borderRadius: 4, border: "1px solid #222" },
  // Files
  fileGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: 10 },
  fileItem: { padding: 12, background: "#1a1a1a", borderRadius: 8, border: "1px solid #222", textAlign: "center", cursor: "pointer" },
  fileIcon: { fontSize: 28, marginBottom: 6 },
  fileName: { fontSize: 10, color: "#aaa", wordBreak: "break-all" },
  fileMeta: { fontSize: 9, color: "#555", marginTop: 4 },
  // ClickUp
  cuGroup: { marginBottom: 16 },
  cuGroupHead: (c) => ({ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", background: "#1a1a1a", borderRadius: "6px 6px 0 0", borderBottom: `2px solid ${c || "#333"}` }),
  cuGroupLabel: { fontSize: 12, fontWeight: "bold", flex: 1 },
  cuGroupCount: { fontSize: 10, color: "#666", background: "#222", padding: "1px 6px", borderRadius: 8 },
  cuRow: { display: "flex", alignItems: "center", padding: "8px 12px", borderBottom: "1px solid #1a1a1a", gap: 12, fontSize: 12 },
  cuCheck: { width: 16, height: 16, borderRadius: 3, border: "2px solid #444", cursor: "pointer", flexShrink: 0 },
  cuName: { flex: 1 },
  cuTag: (c) => ({ fontSize: 9, padding: "1px 6px", borderRadius: 4, background: (c||"#555") + "22", color: c||"#555", border: `1px solid ${(c||"#555")}33` }),
  // Dash
  dashGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 8, marginBottom: 16 },
  dashCard: { background: "#1a1a1a", border: "1px solid #222", padding: 12, borderRadius: 6 },
  dashLabel: { fontSize: 9, color: "#666", textTransform: "uppercase", letterSpacing: 1 },
  dashVal: { fontSize: 20, fontWeight: "bold", color: "#0f0", marginTop: 4 },
  chartBar: { display: "flex", alignItems: "center", gap: 6, marginBottom: 3 },
  chartLabel: { width: 80, fontSize: 10, textAlign: "right", color: "#888" },
  chartBarInner: (p) => ({ height: 14, width: `${p}%`, background: "#0f0", borderRadius: 2, minWidth: p > 0 ? 3 : 0 }),
  chartCount: { fontSize: 10, color: "#666" },
};

// --- SVG CONNECTIONS ---
function Connections({ nodes, connections, dragLine }) {
  return (
    <svg style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 0 }}>
      {connections.map((c, i) => {
        const f = nodes.find(n => n.id === c.from), t = nodes.find(n => n.id === c.to);
        if (!f || !t) return null;
        const x1 = f.x + 240, y1 = f.y + 36, x2 = t.x, y2 = t.y + 36, mx = (x1 + x2) / 2;
        return (<g key={i}>
          <path d={`M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}`} fill="none" stroke="#0f0" strokeWidth={2} opacity={0.35} />
          <circle cx={x2} cy={y2} r={3} fill="#0f0" opacity={0.5} />
          {c.label && <text x={mx} y={Math.min(y1,y2)-6} fill="#444" fontSize={9} textAnchor="middle" fontFamily="inherit">{c.label}</text>}
        </g>);
      })}
      {dragLine && <path d={`M${dragLine.x1},${dragLine.y1} C${(dragLine.x1+dragLine.x2)/2},${dragLine.y1} ${(dragLine.x1+dragLine.x2)/2},${dragLine.y2} ${dragLine.x2},${dragLine.y2}`} fill="none" stroke="#0f0" strokeWidth={2} opacity={0.6} strokeDasharray="6 3" />}
    </svg>
  );
}

// --- CANVAS NODE ---
function CanvasNode({ node, sel, onSelect, onDrag, onUpdate, onDelete, onPortDrag, onCtx }) {
  const bt = BLOCK_TYPES[node.type] || BLOCK_TYPES.crud;
  const fields = node.fields ? parseFields(node.fields) : {};
  const fe = Object.entries(fields);

  const md = (e) => {
    if (e.target.closest("[data-a]")) return;
    e.stopPropagation(); onSelect(node.id);
    const sx = e.clientX - node.x, sy = e.clientY - node.y;
    const mm = (ev) => onDrag(node.id, ev.clientX - sx, ev.clientY - sy);
    const mu = () => { window.removeEventListener("mousemove", mm); window.removeEventListener("mouseup", mu); };
    window.addEventListener("mousemove", mm); window.addEventListener("mouseup", mu);
  };

  const portMd = (e, side) => { e.stopPropagation(); e.preventDefault(); onPortDrag(node.id, side, e); };
  const portHover = (e, on) => { e.target.style.background = on ? "#0f0" : "#333"; e.target.style.borderColor = on ? "#0f0" : "#555"; e.target.style.boxShadow = on ? "0 0 8px #0f0" : "none"; };

  return (
    <div style={Z.node(bt.color, node.locked, sel)} onMouseDown={md} onContextMenu={e => { e.preventDefault(); e.stopPropagation(); onCtx(e, node.id); }}>
      <div data-a="p" style={Z.port("left")} onMouseEnter={e=>portHover(e,1)} onMouseLeave={e=>portHover(e,0)} onMouseDown={e=>portMd(e,"in")} />
      <div data-a="p" style={Z.port("right")} onMouseEnter={e=>portHover(e,1)} onMouseLeave={e=>portHover(e,0)} onMouseDown={e=>portMd(e,"out")} />
      <div style={Z.nodeHead(bt.color)}>
        <div style={Z.nodeTitle}>
          <span style={{ color: bt.color, fontSize: 14 }}>{bt.icon}</span>
          <span>{node.name || bt.label}</span>
          {node.locked && <span style={Z.lockB}>FIXO</span>}
          {node.generated && !node.locked && <span style={Z.genB}>IA</span>}
        </div>
        <div style={{ display: "flex", gap: 3 }}>
          <button data-a="l" style={Z.nodeBtn(node.locked)} onClick={()=>onUpdate(node.id,{locked:!node.locked})}>{node.locked?"🔒":"🔓"}</button>
          <button data-a="d" style={Z.nodeBtn(0)} onClick={()=>onDelete(node.id)}>✕</button>
        </div>
      </div>
      <div style={Z.nodeBody}>
        {!fe.length && <div style={{color:"#333",fontStyle:"italic"}}>Sem campos</div>}
        {fe.slice(0,5).map(([n,c])=>(<div key={n} style={Z.nodeField}><span style={Z.ft(bt.color)}>{c.type==="select"?"sel":c.type==="number"?"num":"str"}</span><span>{n}</span>{c.required&&<span style={{color:"#f00",fontSize:8}}>*</span>}</div>))}
        {fe.length>5&&<div style={{color:"#333",fontSize:9}}>+{fe.length-5}</div>}
      </div>
    </div>
  );
}

// --- PREVIEW VIEWS ---

function calcCard(items, c) {
  let f = items; if (c.where) f = items.filter(i => Object.entries(c.where).every(([k,v]) => i[k]===v));
  if (c.calc==="count") return f.length;
  if (c.calc==="sum"&&c.field) return f.reduce((s,i)=>s+(Number(i[c.field])||0),0);
  return 0;
}

function DashView({ fields, items }) {
  const dash = autoDash(fields);
  const groups = {};
  (dash.charts||[]).forEach(ch => { if(ch.groupBy) items.forEach(i => { const k=i[ch.groupBy]||"—"; groups[ch.groupBy]=groups[ch.groupBy]||{}; groups[ch.groupBy][k]=(groups[ch.groupBy][k]||0)+1; }); });
  return (<>
    <div style={Z.dashGrid}>{dash.cards.map((c,i)=><div key={i} style={Z.dashCard}><div style={Z.dashLabel}>{c.label}</div><div style={Z.dashVal}>{c.prefix||""}{calcCard(items,c).toLocaleString("pt-BR")}</div></div>)}</div>
    {(dash.charts||[]).map((ch,i)=>{ const d=groups[ch.groupBy]||{}; const e=Object.entries(d); const mx=Math.max(...e.map(([,v])=>v),1); return <div key={i} style={{marginBottom:12}}><div style={{fontSize:10,color:"#555",marginBottom:6}}>{ch.label}</div>{e.map(([k,v])=><div key={k} style={Z.chartBar}><div style={Z.chartLabel}>{k}</div><div style={{flex:1}}><div style={Z.chartBarInner((v/mx)*100)}/></div><div style={Z.chartCount}>{v}</div></div>)}</div>; })}
  </>);
}

function TableView({ fields, items }) {
  const fn = Object.keys(fields);
  const sels = fn.filter(n => fields[n].type==="select");
  return (<table style={Z.tbl}><thead><tr>{fn.map(n=><th key={n} style={Z.th}>{n}</th>)}</tr></thead>
    <tbody>{items.map((item,i)=><tr key={i}>{fn.map(n=><td key={n} style={Z.td}>{sels.includes(n)?<span style={Z.tag(item[n])}>{item[n]||"—"}</span>:(item[n]||"—")}</td>)}</tr>)}</tbody></table>);
}

function KanbanView({ fields, items, kanbanField }) {
  const kf = kanbanField || Object.keys(fields).find(n => fields[n].type === "select") || "";
  const opts = fields[kf]?.options || ["—"];
  const cols = {};
  opts.forEach(o => { cols[o] = items.filter(i => i[kf] === o); });
  const titleField = Object.keys(fields).find(n => fields[n].required) || Object.keys(fields)[0];
  const colors = {"Pendente":"#f80","Fazendo":"#0af","Feito":"#0a0","Bloqueado":"#f00","Lead":"#f80","Qualificado":"#0af","Negociação":"#fa0","Proposta":"#fa0","Fechado":"#0a0","Perdido":"#f00","Aberto":"#05f","Ativo":"#0a0","Inativo":"#888","Alta":"#f00","Média":"#fa0","Baixa":"#888"};
  return (<div style={Z.kbBoard}>{opts.map(col=>(
    <div key={col} style={Z.kbCol}>
      <div style={Z.kbColHead(colors[col])}><span>{col}</span><span style={{fontSize:10,color:"#555"}}>{cols[col]?.length||0}</span></div>
      <div style={Z.kbCards}>{(cols[col]||[]).map((item,i)=>(
        <div key={i} style={Z.kbCard}>
          <div style={Z.kbCardTitle}>{item[titleField]||"—"}</div>
          <div style={Z.kbCardMeta}>{Object.entries(item).filter(([k])=>k!==titleField&&k!==kf).slice(0,2).map(([k,v])=>`${k}: ${v}`).join(" · ")}</div>
        </div>
      ))}</div>
    </div>
  ))}</div>);
}

function ClickUpView({ fields, items }) {
  const gf = Object.keys(fields).find(n => fields[n].type === "select") || "";
  const opts = fields[gf]?.options || ["Todos"];
  const groups = {};
  opts.forEach(o => { groups[o] = items.filter(i => i[gf] === o); });
  const titleField = Object.keys(fields).find(n => fields[n].required) || Object.keys(fields)[0];
  const prioField = Object.keys(fields).find(n => /prioridade|priority/i.test(n));
  const colors = {"Pendente":"#f80","Fazendo":"#0af","Feito":"#0a0","Bloqueado":"#f00","Lead":"#f80","Ativo":"#0a0","Alta":"#f00","Média":"#fa0","Baixa":"#888","Aberto":"#05f"};
  return (<div>{opts.map(g=>(
    <div key={g} style={Z.cuGroup}>
      <div style={Z.cuGroupHead(colors[g])}><span style={Z.cuGroupLabel}>{g}</span><span style={Z.cuGroupCount}>{groups[g]?.length||0}</span></div>
      {(groups[g]||[]).map((item,i)=>(
        <div key={i} style={Z.cuRow}>
          <div style={Z.cuCheck} />
          <div style={Z.cuName}>{item[titleField]||"—"}</div>
          {prioField && item[prioField] && <span style={Z.cuTag(colors[item[prioField]])}>{item[prioField]}</span>}
          {Object.entries(item).filter(([k])=>k!==titleField&&k!==gf&&k!==prioField).slice(0,2).map(([k,v])=><span key={k} style={{fontSize:10,color:"#555"}}>{v}</span>)}
        </div>
      ))}
    </div>
  ))}</div>);
}

function NotionView({ fields, items }) {
  const titleField = Object.keys(fields).find(n => fields[n].required) || Object.keys(fields)[0];
  const icons = ["📄","📋","📌","📎","📝","🔖","💡","📊"];
  const sels = Object.keys(fields).filter(n => fields[n].type === "select");
  return (<div>{items.map((item,i)=>(
    <div key={i} style={Z.notionRow}>
      <div style={Z.notionIcon}>{icons[i % icons.length]}</div>
      <div style={Z.notionTitle}>{item[titleField]||"—"}</div>
      {sels.slice(0,2).map(s => item[s] ? <span key={s} style={Z.notionProp}>{item[s]}</span> : null)}
      {Object.entries(item).filter(([k])=>k!==titleField&&!sels.includes(k)).slice(0,1).map(([k,v])=><span key={k} style={{fontSize:10,color:"#444"}}>{v}</span>)}
    </div>
  ))}</div>);
}

function GalleryView({ fields, items }) {
  const titleField = Object.keys(fields).find(n => fields[n].required) || Object.keys(fields)[0];
  const numField = Object.keys(fields).find(n => fields[n].type === "number");
  const selField = Object.keys(fields).find(n => fields[n].type === "select");
  return (<div style={Z.galGrid}>{items.map((item,i)=>(
    <div key={i} style={Z.galCard}>
      <div style={{height:100,background:`hsl(${(i*47)%360}, 25%, 18%)`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:28,color:"#333"}}>
        {["◆","●","▲","■","◈","◐","◑","◒"][i%8]}
      </div>
      <div style={Z.galBody}>
        <div style={Z.galTitle}>{item[titleField]||"—"}</div>
        <div style={Z.galMeta}>
          {selField && item[selField] && <span style={Z.tag(item[selField])}>{item[selField]}</span>}
          {numField && item[numField] && <span style={{marginLeft:6}}>{item[numField]}</span>}
        </div>
      </div>
    </div>
  ))}</div>);
}

function FilesView({ fields, items }) {
  const titleField = Object.keys(fields).find(n => fields[n].required) || Object.keys(fields)[0];
  const typeField = Object.keys(fields).find(n => fields[n].type === "select");
  const fileIcons = {"documento":"📄","planilha":"📊","imagem":"🖼","video":"🎬","audio":"🎵","pasta":"📁","codigo":"💻","pdf":"📕","outro":"📎"};
  const typeIcons = { default: "📄" };
  if (typeField && fields[typeField]?.options) {
    fields[typeField].options.forEach(o => { const k = o.toLowerCase(); typeIcons[o] = fileIcons[k] || Object.entries(fileIcons).find(([fk])=>k.includes(fk))?.[1] || "📄"; });
  }
  return (<div style={Z.fileGrid}>{items.map((item,i)=>(
    <div key={i} style={Z.fileItem}>
      <div style={Z.fileIcon}>{typeField && item[typeField] ? (typeIcons[item[typeField]]||"📄") : "📄"}</div>
      <div style={Z.fileName}>{item[titleField]||"—"}</div>
      <div style={Z.fileMeta}>{Object.entries(item).filter(([k])=>k!==titleField).slice(0,1).map(([,v])=>v).join("")}</div>
    </div>
  ))}</div>);
}

const VIEW_MODES = [
  { id: "table", label: "Tabela", icon: "☰" },
  { id: "kanban", label: "Kanban", icon: "▥" },
  { id: "clickup", label: "ClickUp", icon: "☑" },
  { id: "notion", label: "Notion", icon: "◫" },
  { id: "gallery", label: "Galeria", icon: "▦" },
  { id: "files", label: "Arquivos", icon: "📁" },
  { id: "dash", label: "Dashboard", icon: "◧" },
];

function PreviewPage({ node, items }) {
  const [viewMode, setViewMode] = useState("table");
  const fields = parseFields(node.fields);
  if (!Object.keys(fields).length) return <div style={{ color: "#333", padding: 20 }}>Bloco sem campos configurados</div>;
  return (<div>
    <div style={Z.viewBar}>{VIEW_MODES.map(v => <button key={v.id} style={Z.viewBtn(viewMode===v.id)} onClick={()=>setViewMode(v.id)}>{v.icon} {v.label}</button>)}</div>
    {viewMode === "table" && <TableView fields={fields} items={items} />}
    {viewMode === "kanban" && <KanbanView fields={fields} items={items} kanbanField={node.kanbanField} />}
    {viewMode === "clickup" && <ClickUpView fields={fields} items={items} />}
    {viewMode === "notion" && <NotionView fields={fields} items={items} />}
    {viewMode === "gallery" && <GalleryView fields={fields} items={items} />}
    {viewMode === "files" && <FilesView fields={fields} items={items} />}
    {viewMode === "dash" && <DashView fields={fields} items={items} />}
  </div>);
}

// --- COMMAND PALETTE ---
function CmdPalette({ open, onClose, onAction, nodes }) {
  const [q, setQ] = useState("");
  const ref = useRef(null);

  useEffect(() => { if (open && ref.current) { setQ(""); ref.current.focus(); } }, [open]);

  const commands = useMemo(() => {
    const cmds = [
      { id: "undo", label: "Desfazer", icon: "↩", shortcut: "Ctrl+Z", action: "undo" },
      { id: "redo", label: "Refazer", icon: "↪", shortcut: "Ctrl+Y", action: "redo" },
      { id: "preview", label: "Toggle Preview", icon: "👁", shortcut: "Ctrl+P", action: "preview" },
      { id: "auto-layout", label: "Auto Layout", icon: "⊞", action: "autoLayout" },
      { id: "lock-all", label: "Fixar Todos", icon: "🔒", action: "lockAll" },
      { id: "unlock-all", label: "Desbloquear Todos", icon: "🔓", action: "unlockAll" },
      { id: "clear", label: "Limpar Canvas", icon: "🗑", action: "clear" },
      { id: "export", label: "Exportar Config", icon: "↓", action: "export" },
      ...Object.entries(BLOCK_TYPES).map(([k, v]) => ({ id: `add-${k}`, label: `Adicionar ${v.label}`, icon: v.icon, action: "addBlock", data: k })),
      ...nodes.map(n => ({ id: `select-${n.id}`, label: `Ir para: ${n.name || "Bloco"}`, icon: "→", action: "selectNode", data: n.id })),
    ];
    if (!q) return cmds;
    const lq = q.toLowerCase();
    return cmds.filter(c => c.label.toLowerCase().includes(lq));
  }, [q, nodes]);

  const [sel, setSel] = useState(0);
  useEffect(() => setSel(0), [q]);

  if (!open) return null;

  const run = (cmd) => { onAction(cmd.action, cmd.data); onClose(); };

  return (
    <div style={Z.overlay} onClick={onClose}>
      <div style={Z.cmdBox} onClick={e => e.stopPropagation()}>
        <input ref={ref} style={Z.cmdInput} value={q} onChange={e => setQ(e.target.value)} placeholder="Buscar comando..."
          onKeyDown={e => {
            if (e.key === "Escape") onClose();
            if (e.key === "ArrowDown") setSel(s => Math.min(s + 1, commands.length - 1));
            if (e.key === "ArrowUp") setSel(s => Math.max(s - 1, 0));
            if (e.key === "Enter" && commands[sel]) run(commands[sel]);
          }} />
        <div style={{ maxHeight: 300, overflow: "auto" }}>
          {commands.slice(0, 12).map((cmd, i) => (
            <div key={cmd.id} style={Z.cmdItem(i === sel)} onClick={() => run(cmd)}
              onMouseEnter={() => setSel(i)}>
              <span style={Z.cmdIcon}>{cmd.icon}</span>
              <span style={Z.cmdLabel}>{cmd.label}</span>
              {cmd.shortcut && <span style={Z.cmdShort}>{cmd.shortcut}</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// --- CONTEXT MENU ---
function CtxMenu({ pos, nodeId, onAction, onClose }) {
  if (!pos) return null;
  const items = [
    { label: "Duplicar", icon: "◫", action: "duplicate" },
    { label: "Fixar / Desbloquear", icon: "🔒", action: "toggleLock" },
    { sep: true },
    { label: "Adicionar conexão", icon: "→", action: "startConnect" },
    { label: "Remover conexões", icon: "✂", action: "removeConns" },
    { sep: true },
    { label: "Deletar", icon: "✕", action: "delete", color: "#f55" },
  ];
  return (
    <div style={{ ...Z.ctxMenu, left: pos.x, top: pos.y }} onClick={e => e.stopPropagation()}>
      {items.map((item, i) => item.sep ? <div key={i} style={Z.ctxSep} /> : (
        <div key={i} style={{ ...Z.ctxItem, color: item.color || "#ccc" }}
          onMouseEnter={e => { e.target.style.background = "#252525"; }}
          onMouseLeave={e => { e.target.style.background = "transparent"; }}
          onClick={() => { onAction(item.action, nodeId); onClose(); }}>
          <span>{item.icon}</span><span>{item.label}</span>
        </div>
      ))}
    </div>
  );
}

// --- SAMPLE DATA GEN ---
function genSamples(fields, count = 5) {
  const samples = [];
  const names = ["Ana","João","Maria","Pedro","Lucas","Julia","Carlos","Beatriz"];
  const empresas = ["TechCorp","DataSoft","Nexus","Innova","ByteWorks"];
  for (let i = 0; i < count; i++) {
    const item = {};
    Object.entries(fields).forEach(([n, c]) => {
      if (c.type === "select" && c.options) item[n] = c.options[i % c.options.length];
      else if (c.type === "number") item[n] = Math.round(Math.random() * 10000);
      else if (c.type === "email") item[n] = `${names[i%8].toLowerCase()}@email.com`;
      else if (/nome|cliente|responsável/.test(n)) item[n] = names[i % 8] + " " + ["Silva","Costa","Souza","Lima","Alves"][i%5];
      else if (/empresa|razão/.test(n)) item[n] = empresas[i % 5];
      else if (/produto|tarefa|titulo|projeto/.test(n)) item[n] = ["Alpha","Beta","Gamma","Delta","Epsilon"][i%5];
      else item[n] = `${n}_${i+1}`;
    });
    samples.push(item);
  }
  return samples;
}

// --- AI ---
const SYS_P = `Gere blocos de UI em JSON. Sem markdown, sem backticks, APENAS JSON.
Formato: { "nodes": [{ "id":"x", "type":"crud|dash|kanban|gallery|files|form|list|stat|chart", "name":"Nome", "fields":"shorthand", "dash":"auto|none", "kanbanField":"campo", "x":100, "y":100 }], "connections": [{ "from":"id1", "to":"id2", "label":"relação" }] }
Shorthand: nome!=required, @=email, $=number, #=number, ...=textarea, :A|B=select.
Espaçe ~300px horizontal. Se locked_nodes, NÃO mexa neles. SOMENTE JSON.`;

async function aiGen(prompt, locked) {
  const ctx = locked.length ? `FIXOS: ${JSON.stringify(locked)}\n\n${prompt}` : prompt;
  const r = await fetch("https://api.anthropic.com/v1/messages", { method: "POST", headers: {"Content-Type":"application/json"},
    body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 2000, system: SYS_P, messages: [{role:"user",content:ctx}] }) });
  const d = await r.json();
  const t = d.content?.map(i=>i.text||"").join("")||"";
  return JSON.parse(t.replace(/```json\s*/g,"").replace(/```\s*/g,"").trim());
}

// --- MAIN ---
let _id = 1;
const nid = () => `b_${_id++}`;

export default function App() {
  const [state, setState, undo, redo, pastLen, futureLen] = useHistory({ nodes: [], connections: [] });
  const { nodes, connections } = state;
  const setNodes = (fn) => setState(s => ({ ...s, nodes: typeof fn === "function" ? fn(s.nodes) : fn }));
  const setConns = (fn) => setState(s => ({ ...s, connections: typeof fn === "function" ? fn(s.connections) : fn }));
  const setBoth = (nFn, cFn) => setState(s => ({ nodes: typeof nFn === "function" ? nFn(s.nodes) : nFn, connections: typeof cFn === "function" ? cFn(s.connections) : cFn }));

  const [selected, setSelected] = useState(null);
  const [aiInput, setAiInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");
  const [dragLine, setDragLine] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);
  const [ctxMenu, setCtxMenu] = useState(null);
  const [previewTab, setPreviewTab] = useState(null);
  const connectRef = useRef(null);
  const canvasRef = useRef(null);

  const selectedNode = nodes.find(n => n.id === selected);

  // Data per node
  const [allData, setAllData] = useState({});
  useEffect(() => {
    setAllData(prev => {
      const next = { ...prev };
      nodes.forEach(n => {
        if (!next[n.id] && n.fields) {
          const f = parseFields(n.fields);
          if (Object.keys(f).length) next[n.id] = genSamples(f);
        }
      });
      return next;
    });
  }, [nodes]);

  // Keyboard shortcuts
  useEffect(() => {
    const h = (e) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); setCmdOpen(p => !p); }
      if (e.key === "z" && (e.metaKey || e.ctrlKey) && !e.shiftKey) { e.preventDefault(); undo(); }
      if ((e.key === "y" && (e.metaKey || e.ctrlKey)) || (e.key === "z" && (e.metaKey || e.ctrlKey) && e.shiftKey)) { e.preventDefault(); redo(); }
      if (e.key === "p" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); setShowPreview(p => !p); }
      if (e.key === "Delete" && selected && !e.target.closest("input,textarea,select")) {
        setNodes(p => p.filter(n => n.id !== selected));
        setConns(p => p.filter(c => c.from !== selected && c.to !== selected));
        setSelected(null);
      }
      if (e.key === "Escape") { setCmdOpen(false); setCtxMenu(null); }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [selected, undo, redo]);

  // Actions
  const addNode = (type, x, y) => {
    const bt = BLOCK_TYPES[type]; const id = nid();
    setNodes(p => [...p, { id, type, name: bt.label, fields: "", x: x||100+p.length*40, y: y||100+p.length*40, locked: false, generated: false, dash: "none" }]);
    setSelected(id);
  };

  const updateNode = (id, u) => setNodes(p => p.map(n => n.id === id ? { ...n, ...u } : n));
  const deleteNode = (id) => { setBoth(p => p.filter(n => n.id !== id), p => p.filter(c => c.from !== id && c.to !== id)); if (selected === id) setSelected(null); };
  const handleDrag = (id, x, y) => setNodes(p => p.map(n => n.id === id ? { ...n, x: Math.max(0, Math.round(x/12)*12), y: Math.max(0, Math.round(y/12)*12) } : n));

  const duplicateNode = (id) => {
    const src = nodes.find(n => n.id === id); if (!src) return;
    const newId = nid();
    setNodes(p => [...p, { ...src, id: newId, x: src.x + 30, y: src.y + 30, locked: false, name: src.name + " (cópia)" }]);
    setSelected(newId);
  };

  const autoLayout = () => {
    setNodes(p => p.map((n, i) => {
      const col = i % 3, row = Math.floor(i / 3);
      return { ...n, x: 60 + col * 300, y: 60 + row * 220 };
    }));
  };

  // Port drag
  const handlePortDrag = useCallback((nodeId, side, e) => {
    const canvas = canvasRef.current; if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const node = nodes.find(n => n.id === nodeId); if (!node) return;
    const sx = side === "out" ? node.x + 240 : node.x, sy = node.y + 36;
    connectRef.current = { fromId: nodeId }; setDragLine({ x1: sx, y1: sy, x2: sx, y2: sy });
    const mm = (ev) => setDragLine(p => p ? { ...p, x2: ev.clientX - rect.left + canvas.scrollLeft, y2: ev.clientY - rect.top + canvas.scrollTop } : null);
    const mu = (ev) => {
      window.removeEventListener("mousemove", mm); window.removeEventListener("mouseup", mu); setDragLine(null);
      if (!connectRef.current) return; const fromId = connectRef.current.fromId; connectRef.current = null;
      const mx = ev.clientX - rect.left + canvas.scrollLeft, my = ev.clientY - rect.top + canvas.scrollTop;
      const target = nodes.find(n => n.id !== fromId && mx >= n.x - 15 && mx <= n.x + 255 && my >= n.y - 15 && my <= n.y + 100);
      if (target && !connections.some(c => (c.from===fromId&&c.to===target.id)||(c.from===target.id&&c.to===fromId))) {
        setConns(p => [...p, { from: fromId, to: target.id, label: "" }]);
        flash("Conexão criada!");
      }
    };
    window.addEventListener("mousemove", mm); window.addEventListener("mouseup", mu);
  }, [nodes, connections]);

  const flash = (msg) => { setStatusMsg(msg); setTimeout(() => setStatusMsg(""), 2500); };

  // Ctx menu actions
  const ctxAction = (action, nodeId) => {
    if (action === "duplicate") duplicateNode(nodeId);
    if (action === "toggleLock") updateNode(nodeId, { locked: !nodes.find(n=>n.id===nodeId)?.locked });
    if (action === "removeConns") setConns(p => p.filter(c => c.from !== nodeId && c.to !== nodeId));
    if (action === "delete") deleteNode(nodeId);
  };

  // Command actions
  const cmdAction = (action, data) => {
    if (action === "undo") undo();
    if (action === "redo") redo();
    if (action === "preview") setShowPreview(p => !p);
    if (action === "autoLayout") autoLayout();
    if (action === "lockAll") setNodes(p => p.map(n => ({ ...n, locked: true })));
    if (action === "unlockAll") setNodes(p => p.map(n => ({ ...n, locked: false })));
    if (action === "clear") { setState({ nodes: [], connections: [] }); setSelected(null); }
    if (action === "addBlock") addNode(data);
    if (action === "selectNode") setSelected(data);
    if (action === "export") exportConfig();
  };

  // AI
  const handleAI = async () => {
    if (!aiInput.trim() || loading) return;
    setLoading(true); setStatusMsg("IA gerando..."); const t0 = Date.now();
    try {
      const locked = nodes.filter(n => n.locked);
      const result = await aiGen(aiInput, locked);
      const newNodes = (result.nodes || []).map(n => ({ ...n, id: n.id || nid(), generated: true, locked: false, dash: n.dash || "none" }));
      setBoth(p => [...p.filter(n => n.locked), ...newNodes], p => [...p.filter(c => nodes.some(n => n.locked && (n.id === c.from || n.id === c.to))), ...(result.connections || [])]);
      flash(`✅ ${newNodes.length} blocos em ${((Date.now()-t0)/1000).toFixed(1)}s`); setAiInput("");
    } catch (err) { flash(`❌ ${err.message}`); }
    setLoading(false);
  };

  const exportConfig = () => {
    const config = { title: "App", pages: {} };
    nodes.forEach(n => { const f = parseFields(n.fields); const page = { crud: { fields: f } }; if (n.dash === "auto") page.dash = autoDash(f); config.pages[n.name || "Página"] = page; });
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: "application/json" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "app_config.json"; a.click();
  };

  // Preview
  useEffect(() => { if (showPreview && nodes.length && !previewTab) setPreviewTab(nodes[0].id); }, [showPreview, nodes]);

  return (
    <div style={Z.root} onClick={() => setCtxMenu(null)}>
      <style>{`@keyframes pulse{0%,100%{opacity:.3}50%{opacity:1}} *::-webkit-scrollbar{width:6px;height:6px} *::-webkit-scrollbar-thumb{background:#333;border-radius:3px}`}</style>

      {/* TOP BAR */}
      <div style={Z.topBar}>
        <div style={Z.logo}><span style={{ color: "#0f0" }}>◈</span> Builder <span style={Z.badge}>v4</span></div>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <button style={Z.tbtn(0)} onClick={undo} disabled={!pastLen} title="Ctrl+Z">↩ {pastLen}</button>
          <button style={Z.tbtn(0)} onClick={redo} disabled={!futureLen} title="Ctrl+Y">↪ {futureLen}</button>
          <div style={{ width: 1, height: 20, background: "#333" }} />
          <button style={Z.tbtn(showPreview)} onClick={() => setShowPreview(p=>!p)} title="Ctrl+P">👁 Preview</button>
          <button style={Z.tbtn(0)} onClick={() => setCmdOpen(true)} title="Ctrl+K">⌘K</button>
          <button style={Z.tbtn(0)} onClick={autoLayout}>⊞ Layout</button>
          <button style={Z.tbtn(0)} onClick={exportConfig}>↓ Export</button>
          <span style={{ fontSize: 10, color: "#444" }}>{nodes.length}b · {connections.length}c</span>
        </div>
      </div>

      <div style={Z.main}>
        {/* SIDEBAR */}
        <div style={Z.sidebar}>
          <div style={Z.sideSection}>
            <div style={Z.sideTitle}>Blocos</div>
            {Object.entries(BLOCK_TYPES).map(([type, bt]) => (
              <div key={type} style={Z.blockItem(bt.color)} draggable
                onDragStart={e => e.dataTransfer.setData("blockType", type)}
                onClick={() => addNode(type)}>
                <div style={Z.blockIcon(bt.color)}>{bt.icon}</div>
                <div><div style={{ fontWeight: "bold" }}>{bt.label}</div><div style={{ fontSize: 9, color: "#555" }}>{bt.desc}</div></div>
              </div>
            ))}
          </div>
          <div style={Z.sideSection}>
            <div style={Z.sideTitle}>Atalhos</div>
            <div style={{ fontSize: 10, color: "#444", lineHeight: 1.8 }}>
              Ctrl+K — Comandos<br/>Ctrl+Z — Desfazer<br/>Ctrl+Y — Refazer<br/>Ctrl+P — Preview<br/>Delete — Apagar bloco<br/>Right-click — Menu
            </div>
          </div>
        </div>

        {/* CANVAS or PREVIEW */}
        {!showPreview ? (
          <div style={Z.canvas} ref={canvasRef} onClick={e => { if (e.target === canvasRef.current || e.target.parentElement === canvasRef.current) setSelected(null); }}
            onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); const t = e.dataTransfer.getData("blockType"); if (t && BLOCK_TYPES[t]) { const r = canvasRef.current.getBoundingClientRect(); addNode(t, e.clientX - r.left + canvasRef.current.scrollLeft - 120, e.clientY - r.top + canvasRef.current.scrollTop - 20); } }}>
            <div style={Z.canvasInner}>
              <Connections nodes={nodes} connections={connections} dragLine={dragLine} />
              {nodes.map(n => <CanvasNode key={n.id} node={n} sel={selected===n.id} onSelect={setSelected} onDrag={handleDrag} onUpdate={updateNode} onDelete={deleteNode} onPortDrag={handlePortDrag} onCtx={(e, id) => setCtxMenu({ x: e.clientX, y: e.clientY, nodeId: id })} />)}
              {!nodes.length && <div style={{ position: "absolute", top: "38%", left: "50%", transform: "translate(-50%,-50%)", textAlign: "center", color: "#2a2a2a" }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>◈</div>
                <div style={{ fontSize: 14 }}>Arraste blocos ou use ⌘K</div>
              </div>}
            </div>
          </div>
        ) : (
          <div style={Z.pvWrap}>
            <div style={Z.pvTitle}>Preview</div>
            {nodes.length ? <>
              <div style={Z.pvNav}>{nodes.map(n => <button key={n.id} style={Z.pvTab(previewTab===n.id)} onClick={() => setPreviewTab(n.id)}>{(BLOCK_TYPES[n.type]?.icon||"") + " " + (n.name||"Bloco")}</button>)}</div>
              {nodes.find(n=>n.id===previewTab) && <PreviewPage node={nodes.find(n=>n.id===previewTab)} items={allData[previewTab]||[]} />}
            </> : <div style={{ color: "#333" }}>Adicione blocos no canvas primeiro</div>}
          </div>
        )}

        {/* PANEL */}
        {!showPreview && <div style={Z.panel}>
          <div style={Z.panelHead}>{selectedNode ? `${BLOCK_TYPES[selectedNode.type]?.icon||""} ${selectedNode.name||"Bloco"}` : "Propriedades"}</div>
          <div style={Z.panelBody}>
            {!selectedNode ? <div style={{ color: "#333", padding: 20, textAlign: "center" }}>Selecione um bloco</div> : <>
              <div style={Z.pl}>Nome</div>
              <input style={Z.pi} value={selectedNode.name||""} onChange={e => updateNode(selectedNode.id, { name: e.target.value })} />
              <div style={Z.pl}>Tipo</div>
              <select style={Z.ps} value={selectedNode.type} onChange={e => updateNode(selectedNode.id, { type: e.target.value })}>
                {Object.entries(BLOCK_TYPES).map(([k,v]) => <option key={k} value={k}>{v.icon} {v.label}</option>)}
              </select>
              <div style={Z.pl}>Campos</div>
              <textarea style={Z.pta} value={selectedNode.fields||""} onChange={e => updateNode(selectedNode.id, { fields: e.target.value })} placeholder="nome! email@ valor$" />
              <div style={Z.pl}>Packs</div>
              <div style={{ display: "flex", flexWrap: "wrap", marginBottom: 6 }}>
                {Object.entries(FIELD_PRESETS).map(([k, v]) => <span key={k} style={Z.chip}
                  onMouseEnter={e=>{e.target.style.borderColor="#0f0";e.target.style.color="#0f0"}}
                  onMouseLeave={e=>{e.target.style.borderColor="#333";e.target.style.color="#888"}}
                  onClick={() => updateNode(selectedNode.id, { fields: (selectedNode.fields||"") + " " + v })}>+{k}</span>)}
              </div>
              <div style={Z.pl}>Dashboard</div>
              <select style={Z.ps} value={selectedNode.dash||"none"} onChange={e => updateNode(selectedNode.id, { dash: e.target.value })}>
                <option value="none">Nenhum</option><option value="auto">Auto</option>
              </select>
              <div style={Z.pl}>Estado</div>
              <button style={Z.pb(selectedNode.locked?"#333":"#0f0")} onClick={() => updateNode(selectedNode.id, { locked: !selectedNode.locked })}>
                {selectedNode.locked ? "🔓 Desbloquear" : "🔒 Fixar"}
              </button>
            </>}
          </div>
        </div>}
      </div>

      {/* AI BAR */}
      {statusMsg && <div style={Z.status}>{statusMsg}</div>}
      <div style={Z.aiBar}>
        <input style={Z.aiInput} value={aiInput} onChange={e => setAiInput(e.target.value)} placeholder='Descreva... ex: "CRM com clientes e pedidos"'
          onKeyDown={e => { if (e.key === "Enter") handleAI(); }} />
        <button style={Z.aiBtn(!loading)} onClick={handleAI} disabled={loading}>{loading ? "..." : "⚡ Gerar"}</button>
      </div>

      {/* OVERLAYS */}
      <CmdPalette open={cmdOpen} onClose={() => setCmdOpen(false)} onAction={cmdAction} nodes={nodes} />
      <CtxMenu pos={ctxMenu} nodeId={ctxMenu?.nodeId} onAction={ctxAction} onClose={() => setCtxMenu(null)} />
    </div>
  );
}
