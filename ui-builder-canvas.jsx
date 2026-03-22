import { useState, useRef, useCallback, useEffect, useMemo } from "react";

// ============================================================
// DECLARATIVE UI BUILDER v3
// Canvas visual + IA generativa + Lock/Unlock
// ============================================================

const BLOCK_TYPES = {
  crud: { label: "CRUD", icon: "☰", color: "#0f0", desc: "Tabela + Formulário" },
  dash: { label: "Dashboard", icon: "◧", color: "#0af", desc: "Cards + Gráficos" },
  form: { label: "Formulário", icon: "▤", color: "#fa0", desc: "Form standalone" },
  kanban: { label: "Kanban", icon: "▥", color: "#f0a", desc: "Board de cards" },
  detail: { label: "Detalhe", icon: "◉", color: "#ff0", desc: "View de registro" },
  list: { label: "Lista", icon: "☷", color: "#0ff", desc: "Lista simples" },
  stat: { label: "Stat Card", icon: "▣", color: "#f80", desc: "Métrica única" },
  chart: { label: "Gráfico", icon: "◔", color: "#a0f", desc: "Chart isolado" },
};

const FIELD_PRESETS = {
  pessoa: ["nome!", "email@", "telefone", "cpf"],
  empresa: ["razão_social!", "cnpj", "segmento"],
  endereco: ["cep", "rua", "número", "bairro", "cidade", "estado:SP|RJ|MG|BA|RS|PR|SC|PE|CE|GO"],
  contato: ["telefone", "celular", "email@"],
  financeiro: ["valor$", "data", "tipo:Receita|Despesa"],
  status_basico: ["status:Ativo|Inativo"],
  status_pipeline: ["status:Lead|Qualificado|Proposta|Negociação|Fechado|Perdido"],
  status_tarefa: ["status:Pendente|Fazendo|Feito|Bloqueado", "prioridade:Alta|Média|Baixa"],
};

// --- SHORTHAND PARSER (same as v2) ---
function parseFields(shorthand) {
  if (!shorthand || !shorthand.trim()) return {};
  const fields = {};
  shorthand.trim().split(/\s+/).forEach(token => {
    let name, type = "text", required = false, options = null;
    if (token.endsWith("!")) { required = true; token = token.slice(0, -1); }
    if (token.includes(":")) {
      const [n, opts] = token.split(":");
      name = n; type = "select"; options = opts.split("|");
      if (name.endsWith("!")) { required = true; name = name.slice(0, -1); }
    } else if (token.endsWith("$")) { name = token.slice(0, -1); type = "number"; }
    else if (token.endsWith("#")) { name = token.slice(0, -1); type = "number"; }
    else if (token.endsWith("...")) { name = token.slice(0, -3); type = "textarea"; }
    else if (token.endsWith("@")) { name = token.slice(0, -1); type = "email"; }
    else { name = token; }
    const conf = { type };
    if (required) conf.required = true;
    if (options) conf.options = options;
    fields[name] = conf;
  });
  return fields;
}

function fieldsToShorthand(fields) {
  if (!fields) return "";
  return Object.entries(fields).map(([name, conf]) => {
    let s = name;
    if (conf.type === "select" && conf.options) s += ":" + conf.options.join("|");
    else if (conf.type === "number") s += "$";
    else if (conf.type === "email") s += "@";
    else if (conf.type === "textarea") s += "...";
    if (conf.required) s += "!";
    return s;
  }).join(" ");
}

// --- AUTO DASHBOARD ---
function autoDash(fields) {
  const cards = [{ label: "Total", calc: "count" }];
  const charts = [];
  Object.entries(fields).forEach(([name, conf]) => {
    if (conf.type === "select" && conf.options) {
      const pos = conf.options.find(o => /ativo|feito|pago|fechado|conclu|entregue|resolvido/i.test(o));
      if (pos) cards.push({ label: pos, calc: "count", where: { [name]: pos } });
      charts.push({ type: "bar", groupBy: name, label: `Por ${name}` });
    }
    if (conf.type === "number") cards.push({ label: `Total ${name}`, calc: "sum", field: name, prefix: /preco|preço|valor|salário|orcamento/.test(name) ? "R$ " : "" });
  });
  return { cards: cards.slice(0, 5), charts: charts.slice(0, 2) };
}

// --- STYLES ---
const Z = {
  root: { fontFamily: "'IBM Plex Mono','Courier New',monospace", background: "#0a0a0a", color: "#e0e0e0", height: "100vh", display: "flex", flexDirection: "column", fontSize: 13, overflow: "hidden" },
  topBar: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 16px", borderBottom: "1px solid #222", background: "#0d0d0d", zIndex: 10 },
  logo: { fontSize: 15, fontWeight: "bold", color: "#0f0", display: "flex", alignItems: "center", gap: 8 },
  badge: { fontSize: 10, padding: "2px 8px", background: "#0f02", border: "1px solid #0f03", borderRadius: 10, color: "#0f0" },
  main: { display: "flex", flex: 1, overflow: "hidden" },
  // Sidebar
  sidebar: { width: 220, borderRight: "1px solid #222", background: "#0d0d0d", display: "flex", flexDirection: "column", overflow: "auto" },
  sideSection: { padding: "12px 14px", borderBottom: "1px solid #1a1a1a" },
  sideTitle: { fontSize: 10, color: "#555", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 },
  blockItem: (col) => ({ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", background: "#1a1a1a", border: `1px solid ${col}33`, borderRadius: 6, cursor: "grab", marginBottom: 6, transition: "all 0.15s", userSelect: "none" }),
  blockIcon: (col) => ({ width: 28, height: 28, borderRadius: 6, background: col + "22", color: col, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }),
  blockLabel: { fontSize: 12, fontWeight: "bold" },
  blockDesc: { fontSize: 10, color: "#666" },
  presetChip: { display: "inline-block", padding: "4px 10px", background: "#1a1a1a", border: "1px solid #333", borderRadius: 12, fontSize: 11, cursor: "pointer", margin: "0 4px 4px 0", color: "#888" },
  // Canvas
  canvas: { flex: 1, position: "relative", overflow: "auto", background: "#111" },
  canvasInner: { position: "relative", minWidth: 2000, minHeight: 1200 },
  gridBg: { backgroundImage: "radial-gradient(circle, #222 1px, transparent 1px)", backgroundSize: "24px 24px" },
  // Nodes
  node: (col, locked, selected) => ({
    position: "absolute", width: 260, background: locked ? "#1a1a1a" : "#151515",
    border: `2px solid ${selected ? "#fff" : locked ? col + "66" : col + "44"}`,
    borderRadius: 8, cursor: "grab", boxShadow: selected ? `0 0 20px ${col}33` : "0 2px 8px #0005",
    transition: "box-shadow 0.2s", zIndex: selected ? 5 : 1,
  }),
  nodeHead: (col) => ({ padding: "10px 12px", borderBottom: `1px solid ${col}22`, display: "flex", alignItems: "center", justifyContent: "space-between" }),
  nodeTitle: { display: "flex", alignItems: "center", gap: 8 },
  nodeIcon: (col) => ({ fontSize: 16, color: col }),
  nodeName: { fontSize: 13, fontWeight: "bold" },
  nodeActions: { display: "flex", gap: 4 },
  nodeBtn: (active) => ({ width: 24, height: 24, borderRadius: 4, border: "1px solid #333", background: active ? "#0f02" : "transparent", color: active ? "#0f0" : "#666", cursor: "pointer", fontSize: 11, display: "flex", alignItems: "center", justifyContent: "center" }),
  nodeBody: { padding: "10px 12px", fontSize: 11 },
  nodeField: { padding: "3px 0", color: "#aaa", display: "flex", alignItems: "center", gap: 6 },
  nodeFieldType: (col) => ({ fontSize: 9, padding: "1px 5px", borderRadius: 4, background: col + "22", color: col }),
  lockBadge: { fontSize: 9, padding: "1px 6px", borderRadius: 4, background: "#0f02", color: "#0f0", border: "1px solid #0f03" },
  genBadge: { fontSize: 9, padding: "1px 6px", borderRadius: 4, background: "#fa02", color: "#fa0", border: "1px solid #fa03" },
  // Connector ports
  port: (side) => ({
    position: "absolute", width: 14, height: 14, borderRadius: "50%", background: "#333", border: "2px solid #555",
    cursor: "crosshair", zIndex: 10, transition: "all 0.15s",
    ...(side === "right" ? { right: -8, top: "50%" } : { left: -8, top: "50%" }),
    transform: "translateY(-50%)",
  }),
  // Panel (right)
  panel: { width: 300, borderLeft: "1px solid #222", background: "#0d0d0d", overflow: "auto", display: "flex", flexDirection: "column" },
  panelHead: { padding: "12px 16px", borderBottom: "1px solid #222", fontSize: 13, fontWeight: "bold", color: "#0f0" },
  panelBody: { padding: "12px 16px", flex: 1, overflow: "auto" },
  panelLabel: { fontSize: 10, color: "#555", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4, marginTop: 12 },
  panelInput: { width: "100%", padding: "8px 10px", background: "#1a1a1a", border: "1px solid #333", color: "#eee", fontFamily: "inherit", fontSize: 12, borderRadius: 4, boxSizing: "border-box", marginBottom: 8 },
  panelTextarea: { width: "100%", padding: "8px 10px", background: "#1a1a1a", border: "1px solid #333", color: "#eee", fontFamily: "inherit", fontSize: 12, borderRadius: 4, boxSizing: "border-box", minHeight: 80, resize: "vertical" },
  panelSelect: { width: "100%", padding: "8px 10px", background: "#1a1a1a", border: "1px solid #333", color: "#eee", fontFamily: "inherit", fontSize: 12, borderRadius: 4, marginBottom: 8 },
  panelBtn: (c) => ({ padding: "8px 14px", background: c || "#0f0", color: c === "#900" ? "#fff" : "#000", border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: 12, fontWeight: "bold", borderRadius: 4, marginRight: 6 }),
  // AI bar
  aiBar: { display: "flex", gap: 8, padding: "10px 16px", borderTop: "1px solid #222", background: "#0d0d0d" },
  aiInput: { flex: 1, padding: "10px 14px", background: "#1a1a1a", border: "1px solid #333", color: "#eee", fontFamily: "inherit", fontSize: 13, borderRadius: 6, outline: "none" },
  aiBtn: (ok) => ({ padding: "10px 16px", background: ok ? "#0f0" : "#333", color: ok ? "#000" : "#666", border: "none", cursor: ok ? "pointer" : "default", fontFamily: "inherit", fontSize: 13, fontWeight: "bold", borderRadius: 6 }),
  aiStatus: { padding: "0 16px 8px", fontSize: 11, color: "#555" },
};

// --- SVG CONNECTIONS ---
function Connections({ nodes, connections, dragLine }) {
  return (
    <svg style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 0 }}>
      {connections.map((conn, i) => {
        const from = nodes.find(n => n.id === conn.from);
        const to = nodes.find(n => n.id === conn.to);
        if (!from || !to) return null;
        const x1 = from.x + 260;
        const y1 = from.y + 40;
        const x2 = to.x;
        const y2 = to.y + 40;
        const mx = (x1 + x2) / 2;
        return (
          <g key={i}>
            <path d={`M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}`} fill="none" stroke="#0f0" strokeWidth={2} opacity={0.4} />
            <circle cx={x2} cy={y2} r={4} fill="#0f0" opacity={0.6} />
            {conn.label && <text x={mx} y={Math.min(y1, y2) - 8} fill="#555" fontSize={10} textAnchor="middle" fontFamily="inherit">{conn.label}</text>}
          </g>
        );
      })}
      {dragLine && (
        <g>
          <path d={`M${dragLine.x1},${dragLine.y1} C${(dragLine.x1+dragLine.x2)/2},${dragLine.y1} ${(dragLine.x1+dragLine.x2)/2},${dragLine.y2} ${dragLine.x2},${dragLine.y2}`}
            fill="none" stroke="#0f0" strokeWidth={2} opacity={0.6} strokeDasharray="6 4" />
          <circle cx={dragLine.x2} cy={dragLine.y2} r={6} fill="#0f0" opacity={0.3} />
        </g>
      )}
    </svg>
  );
}

// --- NODE COMPONENT ---
function Node({ node, selected, onSelect, onDrag, onUpdate, onDelete, onPortDragStart }) {
  const bt = BLOCK_TYPES[node.type] || BLOCK_TYPES.crud;
  const fields = node.fields ? parseFields(node.fields) : {};
  const fieldEntries = Object.entries(fields);

  const handleMouseDown = (e) => {
    if (e.target.closest("[data-action]")) return;
    e.stopPropagation();
    onSelect(node.id);
    const startX = e.clientX - node.x;
    const startY = e.clientY - node.y;
    const handleMove = (ev) => onDrag(node.id, ev.clientX - startX, ev.clientY - startY);
    const handleUp = () => { window.removeEventListener("mousemove", handleMove); window.removeEventListener("mouseup", handleUp); };
    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);
  };

  const handlePortMouseDown = (e, side) => {
    e.stopPropagation();
    e.preventDefault();
    onPortDragStart(node.id, side, e);
  };

  return (
    <div style={{ ...Z.node(bt.color, node.locked, selected), left: node.x, top: node.y }} onMouseDown={handleMouseDown}>
      {/* Ports */}
      <div data-action="port" style={Z.port("left")} data-node-id={node.id} data-port-side="in"
        onMouseEnter={e => { e.target.style.background = "#0f0"; e.target.style.borderColor = "#0f0"; e.target.style.boxShadow = "0 0 8px #0f0"; }}
        onMouseLeave={e => { e.target.style.background = "#333"; e.target.style.borderColor = "#555"; e.target.style.boxShadow = "none"; }}
        onMouseDown={(e) => handlePortMouseDown(e, "in")} />
      <div data-action="port" style={Z.port("right")} data-node-id={node.id} data-port-side="out"
        onMouseEnter={e => { e.target.style.background = "#0f0"; e.target.style.borderColor = "#0f0"; e.target.style.boxShadow = "0 0 8px #0f0"; }}
        onMouseLeave={e => { e.target.style.background = "#333"; e.target.style.borderColor = "#555"; e.target.style.boxShadow = "none"; }}
        onMouseDown={(e) => handlePortMouseDown(e, "out")} />

      <div style={Z.nodeHead(bt.color)}>
        <div style={Z.nodeTitle}>
          <span style={Z.nodeIcon(bt.color)}>{bt.icon}</span>
          <span style={Z.nodeName}>{node.name || bt.label}</span>
          {node.locked && <span style={Z.lockBadge}>FIXO</span>}
          {node.generated && !node.locked && <span style={Z.genBadge}>IA</span>}
        </div>
        <div style={Z.nodeActions}>
          <button data-action="lock" style={Z.nodeBtn(node.locked)} onClick={() => onUpdate(node.id, { locked: !node.locked })} title={node.locked ? "Desbloquear" : "Fixar"}>
            {node.locked ? "🔒" : "🔓"}
          </button>
          <button data-action="del" style={Z.nodeBtn(false)} onClick={() => onDelete(node.id)} title="Remover">✕</button>
        </div>
      </div>
      <div style={Z.nodeBody}>
        {fieldEntries.length === 0 && <div style={{ color: "#444", fontStyle: "italic" }}>Clique pra configurar</div>}
        {fieldEntries.slice(0, 6).map(([name, conf]) => (
          <div key={name} style={Z.nodeField}>
            <span style={Z.nodeFieldType(bt.color)}>{conf.type === "select" ? "sel" : conf.type === "number" ? "num" : conf.type === "email" ? "eml" : conf.type === "textarea" ? "txt" : "str"}</span>
            <span>{name}</span>
            {conf.required && <span style={{ color: "#f00", fontSize: 10 }}>*</span>}
          </div>
        ))}
        {fieldEntries.length > 6 && <div style={{ color: "#444", fontSize: 10, marginTop: 4 }}>+{fieldEntries.length - 6} campos</div>}
      </div>
    </div>
  );
}

// --- PROPERTIES PANEL ---
function PropertiesPanel({ node, onUpdate, fieldPresets }) {
  if (!node) return (
    <div style={Z.panel}>
      <div style={Z.panelHead}>Propriedades</div>
      <div style={Z.panelBody}>
        <div style={{ color: "#444", padding: 20, textAlign: "center" }}>Selecione um bloco no canvas pra editar</div>
      </div>
    </div>
  );

  const bt = BLOCK_TYPES[node.type] || BLOCK_TYPES.crud;

  return (
    <div style={Z.panel}>
      <div style={Z.panelHead}>
        <span style={{ color: bt.color }}>{bt.icon}</span> {node.name || bt.label}
        {node.locked && <span style={{ ...Z.lockBadge, marginLeft: 8 }}>FIXO</span>}
      </div>
      <div style={Z.panelBody}>
        <div style={Z.panelLabel}>Nome</div>
        <input style={Z.panelInput} value={node.name || ""} onChange={e => onUpdate(node.id, { name: e.target.value })} placeholder={bt.label} />

        <div style={Z.panelLabel}>Tipo</div>
        <select style={Z.panelSelect} value={node.type} onChange={e => onUpdate(node.id, { type: e.target.value })}>
          {Object.entries(BLOCK_TYPES).map(([k, v]) => <option key={k} value={k}>{v.icon} {v.label}</option>)}
        </select>

        <div style={Z.panelLabel}>Campos (shorthand)</div>
        <textarea style={Z.panelTextarea} value={node.fields || ""} onChange={e => onUpdate(node.id, { fields: e.target.value })} placeholder={'nome! email@ valor$ status:A|B|C'} />

        <div style={Z.panelLabel}>Field Packs</div>
        <div style={{ display: "flex", flexWrap: "wrap", marginBottom: 8 }}>
          {Object.entries(fieldPresets).map(([k, v]) => (
            <span key={k} style={Z.presetChip}
              onMouseEnter={e => { e.target.style.borderColor = bt.color; e.target.style.color = bt.color; }}
              onMouseLeave={e => { e.target.style.borderColor = "#333"; e.target.style.color = "#888"; }}
              onClick={() => {
                const current = node.fields || "";
                const newFields = current + (current ? " " : "") + v.join(" ");
                onUpdate(node.id, { fields: newFields });
              }}>+ {k}</span>
          ))}
        </div>

        {node.type === "kanban" && <>
          <div style={Z.panelLabel}>Coluna Kanban (campo select)</div>
          <input style={Z.panelInput} value={node.kanbanField || ""} onChange={e => onUpdate(node.id, { kanbanField: e.target.value })} placeholder="status" />
        </>}

        <div style={Z.panelLabel}>Dashboard</div>
        <select style={Z.panelSelect} value={node.dash || "none"} onChange={e => onUpdate(node.id, { dash: e.target.value })}>
          <option value="none">Nenhum</option>
          <option value="auto">Auto (baseado nos campos)</option>
        </select>

        <div style={Z.panelLabel}>Estado</div>
        <div style={{ display: "flex", gap: 8 }}>
          <button style={Z.panelBtn(node.locked ? "#333" : "#0f0")} onClick={() => onUpdate(node.id, { locked: !node.locked })}>
            {node.locked ? "🔓 Desbloquear" : "🔒 Fixar"}
          </button>
        </div>
        <div style={{ fontSize: 10, color: "#444", marginTop: 8 }}>
          {node.locked ? "Bloco fixado — IA não pode modificar" : "Bloco livre — IA pode regenerar"}
        </div>
      </div>
    </div>
  );
}

// --- AI GENERATION ---
const SYS_PROMPT = `Você é um assistente que gera blocos de interface no formato JSON para um canvas visual.

Retorne APENAS JSON válido. Sem markdown, sem backticks.

FORMATO:
{
  "nodes": [
    {
      "id": "unique_id",
      "type": "crud|dash|form|kanban|detail|list|stat|chart",
      "name": "Nome do Bloco",
      "fields": "nome! email@ valor$ status:Ativo|Inativo",
      "dash": "auto|none",
      "kanbanField": "status",
      "x": 100, "y": 100
    }
  ],
  "connections": [
    { "from": "id1", "to": "id2", "label": "tem muitos" }
  ]
}

SHORTHAND: nome!=text required, email@=email, valor$=number, qtd#=number, obs...=textarea, status:A|B|C=select

Distribua os blocos no canvas com espaçamento (~300px horizontal, ~200px vertical).
Crie conexões quando houver relacionamento entre entidades.
Adicione campos inteligentes que fazem sentido pro contexto.

Se receber "locked_nodes", NÃO modifique esses blocos. Adicione/modifique apenas os não-locked.

RETORNE SOMENTE JSON.`;

async function aiGenerate(prompt, lockedNodes) {
  const context = lockedNodes.length
    ? `Blocos FIXOS (não modifique): ${JSON.stringify(lockedNodes)}\n\nPedido: ${prompt}`
    : prompt;

  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514", max_tokens: 2000, system: SYS_PROMPT,
      messages: [{ role: "user", content: context }],
    }),
  });
  const d = await r.json();
  const t = d.content?.map(i => i.text || "").join("") || "";
  return JSON.parse(t.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim());
}

// --- MAIN APP ---
let idCounter = 1;
const newId = () => `block_${idCounter++}`;

export default function App() {
  const [nodes, setNodes] = useState([]);
  const [connections, setConnections] = useState([]);
  const [selected, setSelected] = useState(null);
  const [aiInput, setAiInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [dragLine, setDragLine] = useState(null);
  const connectRef = useRef(null); // { fromId, side }
  const canvasRef = useRef(null);

  const selectedNode = nodes.find(n => n.id === selected);

  const addNode = (type, x, y) => {
    const bt = BLOCK_TYPES[type];
    const id = newId();
    setNodes(prev => [...prev, { id, type, name: bt.label, fields: "", x: x || 100 + prev.length * 50, y: y || 100 + prev.length * 50, locked: false, generated: false, dash: "none" }]);
    setSelected(id);
  };

  const updateNode = (id, updates) => {
    setNodes(prev => prev.map(n => n.id === id ? { ...n, ...updates } : n));
  };

  const deleteNode = (id) => {
    setNodes(prev => prev.filter(n => n.id !== id));
    setConnections(prev => prev.filter(c => c.from !== id && c.to !== id));
    if (selected === id) setSelected(null);
  };

  const handleDrag = (id, x, y) => {
    setNodes(prev => prev.map(n => n.id === id ? { ...n, x: Math.max(0, x), y: Math.max(0, y) } : n));
  };

  const handlePortDragStart = useCallback((nodeId, side, e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;

    const startX = side === "out" ? node.x + 260 : node.x;
    const startY = node.y + 40;

    connectRef.current = { fromId: nodeId, side };
    setDragLine({ x1: startX, y1: startY, x2: startX, y2: startY });

    const handleMove = (ev) => {
      const mx = ev.clientX - rect.left + canvas.scrollLeft;
      const my = ev.clientY - rect.top + canvas.scrollTop;
      setDragLine(prev => prev ? { ...prev, x2: mx, y2: my } : null);
    };

    const handleUp = (ev) => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
      setDragLine(null);

      if (!connectRef.current) return;
      const fromId = connectRef.current.fromId;
      connectRef.current = null;

      // Find target node under cursor
      const mx = ev.clientX - rect.left + canvas.scrollLeft;
      const my = ev.clientY - rect.top + canvas.scrollTop;
      const target = nodes.find(n => {
        if (n.id === fromId) return false;
        return mx >= n.x - 15 && mx <= n.x + 275 && my >= n.y - 15 && my <= n.y + 120;
      });

      if (target) {
        const exists = connections.some(c =>
          (c.from === fromId && c.to === target.id) || (c.from === target.id && c.to === fromId)
        );
        if (!exists) {
          setConnections(prev => [...prev, { from: fromId, to: target.id, label: "" }]);
          setStatus("Conexão criada!");
          setTimeout(() => setStatus(""), 2000);
        }
      }
    };

    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);
  }, [nodes, connections]);

  const handleCanvasClick = (e) => {
    if (e.target === canvasRef.current || e.target.parentElement === canvasRef.current) {
      setSelected(null);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const type = e.dataTransfer.getData("blockType");
    if (type && BLOCK_TYPES[type]) {
      const rect = canvasRef.current.getBoundingClientRect();
      addNode(type, e.clientX - rect.left + canvasRef.current.scrollLeft - 130, e.clientY - rect.top + canvasRef.current.scrollTop - 20);
    }
  };

  const handleAI = async () => {
    if (!aiInput.trim() || loading) return;
    setLoading(true);
    setStatus("IA gerando...");
    const t0 = Date.now();

    try {
      const locked = nodes.filter(n => n.locked);
      const result = await aiGenerate(aiInput, locked);

      const newNodes = (result.nodes || []).map(n => ({
        ...n, id: n.id || newId(), generated: true, locked: false, dash: n.dash || "none"
      }));

      setNodes(prev => {
        const kept = prev.filter(n => n.locked);
        return [...kept, ...newNodes];
      });

      setConnections(prev => {
        const kept = prev.filter(c => nodes.some(n => n.locked && (n.id === c.from || n.id === c.to)));
        return [...kept, ...(result.connections || [])];
      });

      const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
      setStatus(`✅ Gerado em ${elapsed}s — ${newNodes.length} blocos. Blocos fixos mantidos.`);
      setAiInput("");
    } catch (err) {
      console.error(err);
      setStatus(`❌ Erro: ${err.message}`);
    }
    setLoading(false);
  };

  // --- EXPORT to APP_CONFIG ---
  const exportConfig = () => {
    const config = { title: "App", pages: {} };
    nodes.forEach(node => {
      const fields = parseFields(node.fields);
      const page = { crud: { fields } };
      if (node.dash === "auto") page.dash = autoDash(fields);
      config.pages[node.name || "Página"] = page;
    });
    const json = JSON.stringify(config, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "app_config.json"; a.click();
    URL.revokeObjectURL(url);
    setStatus("Config exportada!");
  };

  return (
    <div style={Z.root}>
      {/* TOP BAR */}
      <div style={Z.topBar}>
        <div style={Z.logo}>
          <span style={{ color: "#0f0" }}>◈</span> Builder
          <span style={Z.badge}>v3</span>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span style={{ fontSize: 11, color: "#555" }}>{nodes.length} blocos · {connections.length} conexões · {nodes.filter(n => n.locked).length} fixos</span>
          <button style={Z.panelBtn("#333")} onClick={exportConfig}>↓ Exportar Config</button>
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
                onMouseEnter={e => { e.currentTarget.style.borderColor = bt.color; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = bt.color + "33"; }}
                onClick={() => addNode(type)}>
                <div style={Z.blockIcon(bt.color)}>{bt.icon}</div>
                <div>
                  <div style={Z.blockLabel}>{bt.label}</div>
                  <div style={Z.blockDesc}>{bt.desc}</div>
                </div>
              </div>
            ))}
          </div>
          <div style={Z.sideSection}>
            <div style={Z.sideTitle}>Dica</div>
            <div style={{ fontSize: 11, color: "#555", lineHeight: 1.6 }}>
              Arraste blocos pro canvas.<br />
              Arraste dos pontos laterais pra conectar.<br />
              🔒 Fixar = IA não mexe.<br />
              Use o chat embaixo pra gerar com IA.
            </div>
          </div>
        </div>

        {/* CANVAS */}
        <div style={Z.canvas} ref={canvasRef} onClick={handleCanvasClick}
          onDragOver={e => e.preventDefault()} onDrop={handleDrop}>
          <div style={{ ...Z.canvasInner, ...Z.gridBg }}>
            <Connections nodes={nodes} connections={connections} dragLine={dragLine} />
            {nodes.map(node => (
              <Node key={node.id} node={node} selected={selected === node.id}
                onSelect={setSelected} onDrag={handleDrag} onUpdate={updateNode}
                onDelete={deleteNode} onPortDragStart={handlePortDragStart} />
            ))}
            {nodes.length === 0 && (
              <div style={{ position: "absolute", top: "40%", left: "50%", transform: "translate(-50%,-50%)", textAlign: "center", color: "#333" }}>
                <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.3 }}>◈</div>
                <div style={{ fontSize: 16 }}>Arraste blocos ou use a IA</div>
                <div style={{ fontSize: 12, marginTop: 8 }}>Ex: "CRM com clientes, pedidos e produtos"</div>
              </div>
            )}
          </div>
        </div>

        {/* PROPERTIES PANEL */}
        <PropertiesPanel node={selectedNode} onUpdate={updateNode} fieldPresets={FIELD_PRESETS} />
      </div>

      {/* AI BAR */}
      {status && <div style={Z.aiStatus}>{status}</div>}
      <div style={Z.aiBar}>
        <input style={Z.aiInput} value={aiInput} onChange={e => setAiInput(e.target.value)}
          placeholder="Descreva o que quer... ex: 'CRM com clientes, pedidos e dashboard'"
          onKeyDown={e => { if (e.key === "Enter") handleAI(); }} />
        <button style={Z.aiBtn(!loading && aiInput.trim())} onClick={handleAI} disabled={loading}>
          {loading ? "Gerando..." : "⚡ Gerar"}
        </button>
      </div>
    </div>
  );
}
