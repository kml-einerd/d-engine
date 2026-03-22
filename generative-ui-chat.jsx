import { useState, useCallback, useMemo, useRef, useEffect } from "react";

// ============================================================
// GENERATIVE UI ENGINE
// Chat → AI gera config → Engine renderiza
// ============================================================

// --- ENGINE (mesma do protótipo anterior, compacta) ---

function calcCard(items, card) {
  if (card.calc === "custom" && card.fn) return card.fn(items);
  let f = items;
  if (card.where) f = items.filter(i => Object.entries(card.where).every(([k, v]) => i[k] === v));
  if (card.calc === "count") return f.length;
  if (card.calc === "sum" && card.field) return f.reduce((s, i) => s + (Number(i[card.field]) || 0), 0);
  if (card.calc === "avg" && card.field) { if (!f.length) return 0; return (f.reduce((s, i) => s + (Number(i[card.field]) || 0), 0) / f.length).toFixed(1); }
  return 0;
}

function shouldShow(fc, fd) { if (!fc.showIf) return true; return fd[fc.showIf.field] === fc.showIf.equals; }

const T = {
  root: { fontFamily: "'IBM Plex Mono', 'Courier New', monospace", background: "#0a0a0a", color: "#e0e0e0", minHeight: "100vh", fontSize: 13 },
  splitLayout: { display: "flex", height: "100vh", overflow: "hidden" },
  chatSide: { width: 380, minWidth: 320, borderRight: "1px solid #222", display: "flex", flexDirection: "column", background: "#0d0d0d" },
  previewSide: { flex: 1, overflow: "auto", background: "#111" },
  chatHeader: { padding: "16px 20px", borderBottom: "1px solid #222", fontSize: 14, fontWeight: "bold", color: "#0f0", display: "flex", alignItems: "center", gap: 8 },
  chatMessages: { flex: 1, overflow: "auto", padding: "16px 20px" },
  chatInputWrap: { padding: "12px 16px", borderTop: "1px solid #222", display: "flex", gap: 8 },
  chatInput: { flex: 1, padding: "10px 14px", background: "#1a1a1a", border: "1px solid #333", color: "#eee", fontFamily: "inherit", fontSize: 13, borderRadius: 6, outline: "none", resize: "none", minHeight: 42, maxHeight: 120 },
  chatBtn: { padding: "10px 16px", background: "#0f0", color: "#000", border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: 13, fontWeight: "bold", borderRadius: 6, whiteSpace: "nowrap" },
  msgUser: { background: "#1a2a1a", border: "1px solid #0f03", borderRadius: "12px 12px 4px 12px", padding: "10px 14px", marginBottom: 10, maxWidth: "90%", marginLeft: "auto", fontSize: 13, lineHeight: 1.5 },
  msgAi: { background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: "12px 12px 12px 4px", padding: "10px 14px", marginBottom: 10, maxWidth: "90%", fontSize: 13, lineHeight: 1.5 },
  msgSystem: { color: "#555", fontSize: 11, textAlign: "center", margin: "8px 0", fontStyle: "italic" },
  dot: { width: 8, height: 8, borderRadius: "50%", background: "#0f0", display: "inline-block" },
  // preview styles
  nav: { display: "flex", gap: 0, borderBottom: "1px solid #333", background: "#1a1a1a" },
  navBtn: (a) => ({ padding: "10px 20px", background: a ? "#333" : "transparent", color: a ? "#fff" : "#888", border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: 13, borderBottom: a ? "2px solid #0f0" : "2px solid transparent" }),
  header: { padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" },
  title: { fontSize: 18, fontWeight: "bold", color: "#0f0" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10, padding: "0 20px 16px" },
  card: { background: "#1e1e1e", border: "1px solid #333", padding: 14, borderRadius: 4 },
  cardLabel: { fontSize: 11, color: "#888", textTransform: "uppercase", letterSpacing: 1 },
  cardVal: { fontSize: 22, fontWeight: "bold", color: "#0f0", marginTop: 4 },
  chartWrap: { padding: "0 20px 16px" },
  chartTitle: { fontSize: 12, color: "#888", marginBottom: 8 },
  barRow: { display: "flex", alignItems: "center", gap: 8, marginBottom: 4 },
  barLabel: { width: 90, fontSize: 12, textAlign: "right", color: "#aaa" },
  bar: (pct) => ({ height: 18, width: `${pct}%`, background: "#0f0", borderRadius: 2, minWidth: pct > 0 ? 4 : 0, transition: "width 0.3s" }),
  barCount: { fontSize: 12, color: "#888", marginLeft: 4 },
  table: { width: "100%", borderCollapse: "collapse" },
  th: { textAlign: "left", padding: "8px 12px", borderBottom: "1px solid #333", fontSize: 11, color: "#888", textTransform: "uppercase" },
  td: { padding: "8px 12px", borderBottom: "1px solid #222", fontSize: 13 },
  fieldWrap: { marginBottom: 10 },
  label: { display: "block", fontSize: 11, color: "#888", marginBottom: 3, textTransform: "uppercase" },
  input: { width: "100%", padding: "8px 10px", background: "#1e1e1e", border: "1px solid #444", color: "#eee", fontFamily: "inherit", fontSize: 13, borderRadius: 3, boxSizing: "border-box" },
  select: { width: "100%", padding: "8px 10px", background: "#1e1e1e", border: "1px solid #444", color: "#eee", fontFamily: "inherit", fontSize: 13, borderRadius: 3 },
  textarea: { width: "100%", padding: "8px 10px", background: "#1e1e1e", border: "1px solid #444", color: "#eee", fontFamily: "inherit", fontSize: 13, borderRadius: 3, minHeight: 60, boxSizing: "border-box" },
  btn: (c) => ({ padding: "8px 16px", background: c || "#0f0", color: c === "#900" ? "#fff" : "#000", border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: 13, fontWeight: "bold", borderRadius: 3, marginRight: 6 }),
  tag: (v) => { const c = { Novo:"#05f",Ativo:"#0a0",Inativo:"#888",Pendente:"#f80",Feito:"#0a0",Cancelado:"#f00",Aberto:"#05f",Pago:"#0a0" }; const bg=c[v]||"#555"; return { display:"inline-block",padding:"2px 8px",borderRadius:10,fontSize:11,background:bg+"33",color:bg,border:`1px solid ${bg}55` }; },
  empty: { padding: 40, textAlign: "center", color: "#555" },
  topBar: { display: "flex", gap: 8, padding: "0 20px 12px", flexWrap: "wrap" },
  search: { flex: 1, minWidth: 150, padding: "8px 10px", background: "#1e1e1e", border: "1px solid #444", color: "#eee", fontFamily: "inherit", fontSize: 13, borderRadius: 3 },
  section: { marginBottom: 8, fontSize: 12, color: "#555", padding: "0 20px", textTransform: "uppercase", letterSpacing: 1 },
  loading: { display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", color: "#0f0", fontSize: 12 },
  emptyPreview: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", color: "#333", gap: 16 },
  emptyIcon: { fontSize: 64, opacity: 0.3 },
  suggestion: { padding: "8px 14px", background: "#1a1a1a", border: "1px solid #333", borderRadius: 20, cursor: "pointer", fontSize: 12, color: "#888", transition: "all 0.2s" },
};

// --- PREVIEW COMPONENTS ---

function DashSection({ config, items }) {
  if (!config) return null;
  const groups = {};
  (config.charts || []).forEach(ch => {
    if (ch.groupBy) { items.forEach(item => { const key = item[ch.groupBy] || "(vazio)"; groups[ch.groupBy] = groups[ch.groupBy] || {}; groups[ch.groupBy][key] = (groups[ch.groupBy][key] || 0) + 1; }); }
  });
  return (<>
    {config.cards && <div style={T.grid}>{config.cards.map((c, i) => { const val = calcCard(items, c); return (<div key={i} style={T.card}><div style={T.cardLabel}>{c.label}</div><div style={T.cardVal}>{c.prefix || ""}{typeof val === "number" ? val.toLocaleString("pt-BR") : val}</div></div>); })}</div>}
    {(config.charts || []).map((ch, ci) => { const data = groups[ch.groupBy] || {}; const entries = Object.entries(data); const max = Math.max(...entries.map(([, v]) => v), 1); return (<div key={ci} style={T.chartWrap}><div style={T.chartTitle}>{ch.label}</div>{entries.map(([k, v]) => (<div key={k} style={T.barRow}><div style={T.barLabel}>{k}</div><div style={{ flex: 1 }}><div style={T.bar((v / max) * 100)} /></div><div style={T.barCount}>{v}</div></div>))}</div>); })}
  </>);
}

function FieldInput({ name, conf, value, onChange }) {
  const props = { style: conf.type === "textarea" ? T.textarea : conf.type === "select" ? T.select : T.input, value: value || "", onChange: e => onChange(name, e.target.value) };
  if (conf.type === "select") return (<select {...props}><option value="">— selecione —</option>{(conf.options || []).map(o => <option key={o} value={o}>{o}</option>)}</select>);
  if (conf.type === "textarea") return <textarea {...props} />;
  return <input {...props} type={conf.type === "number" ? "number" : "text"} />;
}

function PageView({ pageConfig, pageKey, allData, setAllData }) {
  const items = allData[pageKey] || [];
  const setItems = (fn) => setAllData(prev => ({ ...prev, [pageKey]: typeof fn === 'function' ? fn(prev[pageKey] || []) : fn }));
  const [formData, setFormData] = useState({});
  const [showForm, setShowForm] = useState(false);
  const [editIdx, setEditIdx] = useState(null);
  const [search, setSearch] = useState("");
  const fields = pageConfig.crud?.fields || {};
  const fieldNames = Object.keys(fields);
  const selectFields = Object.entries(fields).filter(([, c]) => c.type === "select").map(([n]) => n);

  const filteredItems = useMemo(() => {
    if (!search) return items;
    const s = search.toLowerCase();
    return items.filter(item => Object.values(item).some(v => String(v).toLowerCase().includes(s)));
  }, [items, search]);

  const handleChange = (name, val) => setFormData(prev => ({ ...prev, [name]: val }));
  const handleSave = () => {
    const req = Object.entries(fields).filter(([, c]) => c.required).map(([n]) => n);
    if (req.some(n => !formData[n])) { alert(`Preencha: ${req.filter(n => !formData[n]).join(", ")}`); return; }
    if (editIdx !== null) setItems(prev => prev.map((item, i) => i === editIdx ? { ...formData } : item));
    else setItems(prev => [...prev, { ...formData }]);
    setFormData({}); setShowForm(false); setEditIdx(null);
  };

  return (<>
    {pageConfig.dash && <><div style={T.section}>Dashboard</div><DashSection config={pageConfig.dash} items={items} /></>}
    {pageConfig.crud && <>
      <div style={{ ...T.section, marginTop: 12 }}>Registros</div>
      <div style={T.topBar}>
        <input style={T.search} placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} />
        <button style={T.btn()} onClick={() => { setFormData({}); setEditIdx(null); setShowForm(!showForm); }}>{showForm ? "✕" : "+ Novo"}</button>
      </div>
      {showForm && <div style={{ padding: "0 20px 16px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "0 16px" }}>
          {fieldNames.map(name => { const conf = fields[name]; if (!shouldShow(conf, formData)) return null; return (<div key={name} style={T.fieldWrap}><label style={T.label}>{name}{conf.required ? " *" : ""}</label><FieldInput name={name} conf={conf} value={formData[name]} onChange={handleChange} /></div>); })}
        </div>
        <div style={{ marginTop: 10 }}><button style={T.btn()} onClick={handleSave}>{editIdx !== null ? "Salvar" : "Adicionar"}</button><button style={T.btn("#333")} onClick={() => { setShowForm(false); setEditIdx(null); setFormData({}); }}>Cancelar</button></div>
      </div>}
      {!filteredItems.length ? <div style={T.empty}>Nenhum registro.</div> : <div style={{ overflowX: "auto", padding: "0 20px" }}>
        <table style={T.table}><thead><tr>{fieldNames.filter(n => !fields[n].showIf).map(n => <th key={n} style={T.th}>{n}</th>)}<th style={T.th}>ações</th></tr></thead>
        <tbody>{filteredItems.map((item, i) => (<tr key={i}>{fieldNames.filter(n => !fields[n].showIf).map(n => (<td key={n} style={T.td}>{selectFields.includes(n) ? <span style={T.tag(item[n])}>{item[n] || "—"}</span> : (item[n] || "—")}</td>))}<td style={T.td}><button style={T.btn("#333")} onClick={() => { setFormData({...items[i]}); setEditIdx(i); setShowForm(true); }}>✎</button><button style={T.btn("#900")} onClick={() => setItems(prev => prev.filter((_,idx) => idx !== i))}>✕</button></td></tr>))}</tbody></table></div>}
    </>}
  </>);
}

function Preview({ config, allData, setAllData }) {
  const pages = Object.keys(config.pages || {});
  const [active, setActive] = useState(pages[0] || "");
  useEffect(() => { if (pages.length && !pages.includes(active)) setActive(pages[0]); }, [config]);

  if (!pages.length) return (
    <div style={T.emptyPreview}>
      <div style={T.emptyIcon}>⚡</div>
      <div style={{ fontSize: 16, color: "#444" }}>Descreva o que você quer no chat</div>
      <div style={{ fontSize: 12, color: "#333" }}>A interface aparece aqui automaticamente</div>
    </div>
  );

  return (<>
    <div style={T.header}><div style={T.title}>{config.title || "App"}</div><div style={{ fontSize: 11, color: "#555" }}>generative UI</div></div>
    <nav style={T.nav}>{pages.map(p => <button key={p} style={T.navBtn(p === active)} onClick={() => setActive(p)}>{p}</button>)}</nav>
    <div style={{ padding: "16px 0" }}>{config.pages[active] && <PageView pageConfig={config.pages[active]} pageKey={active} allData={allData} setAllData={setAllData} />}</div>
  </>);
}

// --- AI CONFIG GENERATOR ---

const SYSTEM_PROMPT = `Você é um gerador de interfaces declarativas. O usuário descreve o que quer em linguagem natural e você retorna APENAS um JSON válido no formato APP_CONFIG.

REGRAS ABSOLUTAS:
1. Retorne APENAS o JSON, sem markdown, sem backticks, sem explicação
2. O JSON deve seguir esta estrutura exata:
{
  "title": "Nome do App",
  "pages": {
    "NomeDaPagina": {
      "crud": {
        "fields": {
          "nome_campo": {
            "type": "text|email|number|select|textarea",
            "required": true|false,
            "options": ["A","B"],
            "showIf": { "field": "outro_campo", "equals": "valor" }
          }
        }
      },
      "dash": {
        "cards": [
          { "label": "Total", "calc": "count" },
          { "label": "Filtrado", "calc": "count", "where": { "campo": "valor" } },
          { "label": "Soma", "calc": "sum", "field": "campo_numerico", "prefix": "R$" }
        ],
        "charts": [
          { "type": "bar", "groupBy": "campo", "label": "Título" }
        ]
      }
    }
  },
  "sampleData": {
    "NomeDaPagina": [
      { "nome_campo": "valor exemplo", "outro": "dado" }
    ]
  }
}

3. SEMPRE inclua "sampleData" com 3-5 registros de exemplo realistas pra cada página
4. Use campos condicionais (showIf) quando fizer sentido pro contexto
5. Adicione dashboard relevante com cards e charts quando possível
6. Se o usuário pedir pra MODIFICAR, retorne o config COMPLETO atualizado (não só a parte modificada)
7. Campos type "select" DEVEM ter "options"
8. Interprete o pedido do usuário de forma inteligente - adicione campos úteis que ele não mencionou mas que fazem sentido

IMPORTANTE: Retorne SOMENTE o JSON. Qualquer texto fora do JSON vai causar erro.`;

async function generateConfig(userMessage, currentConfig) {
  const messages = [
    {
      role: "user",
      content: currentConfig
        ? `Config atual: ${JSON.stringify(currentConfig)}\n\nModificação pedida: ${userMessage}\n\nRetorne o config COMPLETO atualizado.`
        : userMessage
    }
  ];

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4000,
      system: SYSTEM_PROMPT,
      messages,
    }),
  });

  const data = await response.json();
  const text = data.content?.map(i => i.text || "").join("") || "";
  const clean = text.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
  return JSON.parse(clean);
}

// --- MAIN APP ---

const SUGGESTIONS = [
  "Sistema de gestão de clientes com status e valor",
  "Controle de estoque com categorias e preço",
  "Gerenciador de tarefas com prioridade e prazo",
  "CRM de vendas com pipeline e forecast",
];

export default function App() {
  const [config, setConfig] = useState({ title: "", pages: {} });
  const [allData, setAllData] = useState({});
  const [messages, setMessages] = useState([
    { role: "system", text: "Descreva a interface que você quer. Eu gero na hora." }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const chatRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [messages]);

  const handleSend = async (text) => {
    const msg = text || input.trim();
    if (!msg || loading) return;
    setInput("");
    setMessages(prev => [...prev, { role: "user", text: msg }]);
    setLoading(true);

    try {
      const hasConfig = Object.keys(config.pages || {}).length > 0;
      const result = await generateConfig(msg, hasConfig ? config : null);

      const newConfig = { title: result.title || config.title || "App", pages: result.pages || {} };
      setConfig(newConfig);

      if (result.sampleData) {
        setAllData(prev => {
          const merged = { ...prev };
          Object.entries(result.sampleData).forEach(([key, data]) => {
            if (!merged[key] || merged[key].length === 0) merged[key] = data;
          });
          return merged;
        });
      }

      setMessages(prev => [...prev, { role: "ai", text: `✅ Pronto! Gerei "${newConfig.title}" com ${Object.keys(newConfig.pages).length} página(s): ${Object.keys(newConfig.pages).join(", ")}. Quer mudar algo?` }]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { role: "ai", text: `❌ Erro ao gerar: ${err.message}. Tenta descrever de outro jeito.` }]);
    }
    setLoading(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const hasContent = Object.keys(config.pages || {}).length > 0;

  return (
    <div style={T.root}>
      <div style={T.splitLayout}>
        {/* CHAT */}
        <div style={T.chatSide}>
          <div style={T.chatHeader}><span style={T.dot} /> Generative UI</div>
          <div style={T.chatMessages} ref={chatRef}>
            {messages.map((m, i) => {
              if (m.role === "system") return <div key={i} style={T.msgSystem}>{m.text}</div>;
              return <div key={i} style={m.role === "user" ? T.msgUser : T.msgAi}>{m.text}</div>;
            })}
            {loading && <div style={T.loading}>
              <span style={{ animation: "pulse 1s infinite", display: "inline-block" }}>●</span>
              <span>Gerando interface...</span>
              <style>{`@keyframes pulse { 0%,100% { opacity: 0.3; } 50% { opacity: 1; } }`}</style>
            </div>}
            {messages.length === 1 && !loading && (
              <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ fontSize: 11, color: "#555", marginBottom: 4 }}>SUGESTÕES</div>
                {SUGGESTIONS.map((s, i) => (
                  <div key={i} style={T.suggestion}
                    onMouseEnter={e => { e.target.style.borderColor = "#0f0"; e.target.style.color = "#0f0"; }}
                    onMouseLeave={e => { e.target.style.borderColor = "#333"; e.target.style.color = "#888"; }}
                    onClick={() => handleSend(s)}>{s}</div>
                ))}
              </div>
            )}
          </div>
          <div style={T.chatInputWrap}>
            <textarea
              ref={inputRef}
              style={T.chatInput}
              placeholder="Descreva a interface..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
            />
            <button style={{ ...T.chatBtn, opacity: loading ? 0.5 : 1 }} onClick={() => handleSend()} disabled={loading}>
              Gerar
            </button>
          </div>
        </div>

        {/* PREVIEW */}
        <div style={T.previewSide}>
          <Preview config={config} allData={allData} setAllData={setAllData} />
        </div>
      </div>
    </div>
  );
}
