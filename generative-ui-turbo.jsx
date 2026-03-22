import { useState, useMemo, useRef, useEffect } from "react";

// ============================================================
// GENERATIVE UI v2 — TURBO MODE
// Blocos pré-prontos + sintaxe curta = IA gera em ~200 tokens
// ============================================================

// --- PRESETS: blocos reutilizáveis ---
const PRESETS = {
  // Templates de página inteira
  "crm":        { fields: "nome! email telefone status:Lead|Qualificado|Negociando|Fechado|Perdido valor$ origem fonte:Site|Indicação|Anúncio|Outro", dash: "auto" },
  "estoque":    { fields: "produto! sku categoria:Eletrônico|Roupa|Alimento|Outro preço$ quantidade# fornecedor", dash: "auto" },
  "tarefas":    { fields: "tarefa! responsável prioridade:Alta|Média|Baixa status:Pendente|Fazendo|Feito|Bloqueado prazo", dash: "auto" },
  "pedidos":    { fields: "cliente! produto valor$ status:Aberto|Preparando|Enviado|Entregue|Cancelado data", dash: "auto" },
  "financeiro": { fields: "descrição! tipo:Receita|Despesa categoria:Fixo|Variável|Investimento valor$ data", dash: "auto" },
  "rh":         { fields: "nome! cargo departamento:TI|RH|Comercial|Financeiro|Operações salário$ admissão status:Ativo|Férias|Afastado|Desligado", dash: "auto" },
  "projetos":   { fields: "projeto! cliente responsável status:Planejamento|Execução|Review|Concluído|Pausado orçamento$ inicio fim", dash: "auto" },
  "tickets":    { fields: "titulo! cliente prioridade:Crítica|Alta|Média|Baixa status:Aberto|Andamento|Resolvido|Fechado categoria:Bug|Feature|Suporte|Dúvida", dash: "auto" },

  // Templates de campo (field packs)
  "endereco":   { pack: "cep rua número bairro cidade estado:AC|AL|AP|AM|BA|CE|DF|ES|GO|MA|MT|MS|MG|PA|PB|PR|PE|PI|RJ|RN|RS|RO|RR|SC|SP|SE|TO" },
  "contato":    { pack: "telefone celular email" },
  "pessoa":     { pack: "nome! cpf nascimento sexo:Masculino|Feminino|Outro" },
  "empresa":    { pack: "razão_social! cnpj nome_fantasia segmento" },
};

// --- SHORTHAND PARSER ---
// "nome!" = text + required
// "status:A|B|C" = select com opções
// "valor$" = number (money)
// "qtd#" = number
// "obs..." = textarea
// "email@" = email
// Tudo mais = text

function parseFieldShorthand(shorthand) {
  const fields = {};
  const tokens = shorthand.trim().split(/\s+/);

  tokens.forEach(token => {
    let name, type = "text", required = false, options = null;

    if (token.endsWith("!")) { required = true; token = token.slice(0, -1); }

    if (token.includes(":")) {
      const [n, opts] = token.split(":");
      name = n; type = "select"; options = opts.split("|");
      if (name.endsWith("!")) { required = true; name = name.slice(0, -1); }
    } else if (token.endsWith("$")) {
      name = token.slice(0, -1); type = "number";
    } else if (token.endsWith("#")) {
      name = token.slice(0, -1); type = "number";
    } else if (token.endsWith("...")) {
      name = token.slice(0, -3); type = "textarea";
    } else if (token.endsWith("@")) {
      name = token.slice(0, -1); type = "email";
    } else {
      name = token;
    }

    const conf = { type };
    if (required) conf.required = true;
    if (options) conf.options = options;
    fields[name] = conf;
  });

  return fields;
}

function autoDash(fields) {
  const cards = [{ label: "Total", calc: "count" }];
  const charts = [];

  Object.entries(fields).forEach(([name, conf]) => {
    if (conf.type === "select" && conf.options) {
      // card pro primeiro status "positivo"
      const positive = conf.options.find(o => /ativo|feito|pago|fechado|conclu|entregue|resolvido/i.test(o));
      if (positive) cards.push({ label: positive, calc: "count", where: { [name]: positive } });
      charts.push({ type: "bar", groupBy: name, label: `Por ${name}` });
    }
    if (conf.type === "number") {
      cards.push({ label: `Total ${name}`, calc: "sum", field: name, prefix: /preco|preço|valor|salário|salario|orçamento|orcamento/.test(name) ? "R$ " : "" });
    }
  });

  return { cards: cards.slice(0, 5), charts: charts.slice(0, 2) };
}

// --- EXPAND CONFIG from turbo format ---

function expandConfig(turbo) {
  const config = { title: turbo.title || "App", pages: {} };
  const sampleData = {};

  Object.entries(turbo.pages || {}).forEach(([pageName, page]) => {
    let fields;

    // Se referencia um preset
    if (page.use && PRESETS[page.use]) {
      const preset = PRESETS[page.use];
      const base = parseFieldShorthand(preset.fields || "");
      const extra = page.fields ? parseFieldShorthand(page.fields) : {};
      fields = { ...base, ...extra };
    } else if (page.fields) {
      // Pode ser shorthand string ou objeto completo
      fields = typeof page.fields === "string" ? parseFieldShorthand(page.fields) : page.fields;
    } else {
      fields = {};
    }

    // Expand field packs
    if (page.include) {
      const packs = Array.isArray(page.include) ? page.include : [page.include];
      packs.forEach(packName => {
        if (PRESETS[packName]?.pack) {
          const packFields = parseFieldShorthand(PRESETS[packName].pack);
          fields = { ...fields, ...packFields };
        }
      });
    }

    // showIf support
    if (page.showIf) {
      Object.entries(page.showIf).forEach(([fieldName, condition]) => {
        if (fields[fieldName]) {
          fields[fieldName].showIf = condition;
        }
      });
    }

    const pageConf = { crud: { fields } };
    if (page.dash === "auto") pageConf.dash = autoDash(fields);
    else if (page.dash) pageConf.dash = page.dash;

    config.pages[pageName] = pageConf;
    if (page.samples) sampleData[pageName] = page.samples;
  });

  return { config, sampleData };
}

// --- UI STYLES ---

const S = {
  root: { fontFamily: "'IBM Plex Mono', 'Courier New', monospace", background: "#0a0a0a", color: "#e0e0e0", minHeight: "100vh", fontSize: 13 },
  split: { display: "flex", height: "100vh", overflow: "hidden" },
  chat: { width: 400, minWidth: 340, borderRight: "1px solid #222", display: "flex", flexDirection: "column", background: "#0d0d0d" },
  preview: { flex: 1, overflow: "auto", background: "#111" },
  chatHead: { padding: "14px 20px", borderBottom: "1px solid #222", display: "flex", alignItems: "center", justifyContent: "space-between" },
  chatTitle: { fontSize: 14, fontWeight: "bold", color: "#0f0", display: "flex", alignItems: "center", gap: 8 },
  chatBadge: { fontSize: 10, padding: "2px 8px", background: "#0f02", border: "1px solid #0f03", borderRadius: 10, color: "#0f0" },
  msgs: { flex: 1, overflow: "auto", padding: "16px 20px" },
  inputWrap: { padding: "12px 16px", borderTop: "1px solid #222", display: "flex", gap: 8 },
  input: { flex: 1, padding: "10px 14px", background: "#1a1a1a", border: "1px solid #333", color: "#eee", fontFamily: "inherit", fontSize: 13, borderRadius: 6, outline: "none", resize: "none", minHeight: 42, maxHeight: 120 },
  sendBtn: (ok) => ({ padding: "10px 16px", background: ok ? "#0f0" : "#333", color: ok ? "#000" : "#666", border: "none", cursor: ok ? "pointer" : "default", fontFamily: "inherit", fontSize: 13, fontWeight: "bold", borderRadius: 6 }),
  msgU: { background: "#1a2a1a", border: "1px solid #0f03", borderRadius: "12px 12px 4px 12px", padding: "10px 14px", marginBottom: 10, maxWidth: "90%", marginLeft: "auto", fontSize: 13, lineHeight: 1.5 },
  msgA: { background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: "12px 12px 12px 4px", padding: "10px 14px", marginBottom: 10, maxWidth: "90%", fontSize: 13, lineHeight: 1.5 },
  msgS: { color: "#555", fontSize: 11, textAlign: "center", margin: "8px 0" },
  suggest: { padding: "8px 14px", background: "#1a1a1a", border: "1px solid #333", borderRadius: 20, cursor: "pointer", fontSize: 12, color: "#888", transition: "all 0.15s" },
  presetTag: { display: "inline-block", padding: "3px 10px", background: "#0f01", border: "1px solid #0f03", borderRadius: 12, fontSize: 11, color: "#0f0", cursor: "pointer", transition: "all 0.15s" },
  loading: { display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", color: "#0f0", fontSize: 12 },
  // preview
  nav: { display: "flex", gap: 0, borderBottom: "1px solid #333", background: "#1a1a1a" },
  navBtn: (a) => ({ padding: "10px 20px", background: a ? "#333" : "transparent", color: a ? "#fff" : "#888", border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: 13, borderBottom: a ? "2px solid #0f0" : "2px solid transparent" }),
  header: { padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" },
  title: { fontSize: 18, fontWeight: "bold", color: "#0f0" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10, padding: "0 20px 16px" },
  card: { background: "#1e1e1e", border: "1px solid #333", padding: 14, borderRadius: 4 },
  cardL: { fontSize: 11, color: "#888", textTransform: "uppercase", letterSpacing: 1 },
  cardV: { fontSize: 22, fontWeight: "bold", color: "#0f0", marginTop: 4 },
  chartW: { padding: "0 20px 16px" },
  chartT: { fontSize: 12, color: "#888", marginBottom: 8 },
  barR: { display: "flex", alignItems: "center", gap: 8, marginBottom: 4 },
  barL: { width: 100, fontSize: 12, textAlign: "right", color: "#aaa", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
  bar: (p) => ({ height: 18, width: `${p}%`, background: "#0f0", borderRadius: 2, minWidth: p > 0 ? 4 : 0, transition: "width 0.3s" }),
  barC: { fontSize: 12, color: "#888", marginLeft: 4 },
  tbl: { width: "100%", borderCollapse: "collapse" },
  th: { textAlign: "left", padding: "8px 12px", borderBottom: "1px solid #333", fontSize: 11, color: "#888", textTransform: "uppercase" },
  td: { padding: "8px 12px", borderBottom: "1px solid #222", fontSize: 13 },
  inp: { width: "100%", padding: "8px 10px", background: "#1e1e1e", border: "1px solid #444", color: "#eee", fontFamily: "inherit", fontSize: 13, borderRadius: 3, boxSizing: "border-box" },
  sel: { width: "100%", padding: "8px 10px", background: "#1e1e1e", border: "1px solid #444", color: "#eee", fontFamily: "inherit", fontSize: 13, borderRadius: 3 },
  ta: { width: "100%", padding: "8px 10px", background: "#1e1e1e", border: "1px solid #444", color: "#eee", fontFamily: "inherit", fontSize: 13, borderRadius: 3, minHeight: 60, boxSizing: "border-box" },
  btn: (c) => ({ padding: "8px 16px", background: c || "#0f0", color: c === "#900" ? "#fff" : "#000", border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: 13, fontWeight: "bold", borderRadius: 3, marginRight: 6 }),
  tag: (v) => { const m = { Novo:"#05f",Ativo:"#0a0",Inativo:"#888",Pendente:"#f80",Feito:"#0a0",Cancelado:"#f00",Aberto:"#05f",Pago:"#0a0",Lead:"#f80",Qualificado:"#0af",Negociando:"#fa0",Fechado:"#0a0",Perdido:"#f00",Alta:"#f00",Média:"#fa0",Baixa:"#888",Fazendo:"#0af",Bloqueado:"#f00",Crítica:"#f00",Resolvido:"#0a0",Preparando:"#0af",Enviado:"#fa0",Entregue:"#0a0",Receita:"#0a0",Despesa:"#f00",Execução:"#0af",Review:"#fa0",Concluído:"#0a0",Pausado:"#888",Planejamento:"#f80",Férias:"#0af",Afastado:"#fa0",Desligado:"#f00",Bug:"#f00",Feature:"#0af",Suporte:"#fa0",Dúvida:"#888" }; const bg = m[v] || "#555"; return { display:"inline-block",padding:"2px 8px",borderRadius:10,fontSize:11,background:bg+"33",color:bg,border:`1px solid ${bg}55` }; },
  empty: { padding: 40, textAlign: "center", color: "#555" },
  topBar: { display: "flex", gap: 8, padding: "0 20px 12px", flexWrap: "wrap" },
  search: { flex: 1, minWidth: 150, padding: "8px 10px", background: "#1e1e1e", border: "1px solid #444", color: "#eee", fontFamily: "inherit", fontSize: 13, borderRadius: 3 },
  sec: { marginBottom: 8, fontSize: 12, color: "#555", padding: "0 20px", textTransform: "uppercase", letterSpacing: 1 },
  emptyP: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", color: "#333", gap: 16 },
  tokenInfo: { fontSize: 10, color: "#333", padding: "8px 20px", borderTop: "1px solid #1a1a1a" },
};

// --- PREVIEW COMPONENTS ---

function calcCard(items, c) {
  let f = items;
  if (c.where) f = items.filter(i => Object.entries(c.where).every(([k, v]) => i[k] === v));
  if (c.calc === "count") return f.length;
  if (c.calc === "sum" && c.field) return f.reduce((s, i) => s + (Number(i[c.field]) || 0), 0);
  if (c.calc === "avg" && c.field) { if (!f.length) return 0; return (f.reduce((s, i) => s + (Number(i[c.field]) || 0), 0) / f.length).toFixed(1); }
  return 0;
}

function Dash({ config, items }) {
  if (!config) return null;
  const groups = {};
  (config.charts || []).forEach(ch => { if (ch.groupBy) items.forEach(item => { const k = item[ch.groupBy] || "(vazio)"; groups[ch.groupBy] = groups[ch.groupBy] || {}; groups[ch.groupBy][k] = (groups[ch.groupBy][k] || 0) + 1; }); });
  return (<>
    {config.cards && <div style={S.grid}>{config.cards.map((c, i) => <div key={i} style={S.card}><div style={S.cardL}>{c.label}</div><div style={S.cardV}>{c.prefix || ""}{calcCard(items, c).toLocaleString("pt-BR")}</div></div>)}</div>}
    {(config.charts || []).map((ch, i) => { const d = groups[ch.groupBy] || {}; const e = Object.entries(d); const mx = Math.max(...e.map(([,v]) => v), 1); return <div key={i} style={S.chartW}><div style={S.chartT}>{ch.label}</div>{e.map(([k, v]) => <div key={k} style={S.barR}><div style={S.barL}>{k}</div><div style={{ flex: 1 }}><div style={S.bar((v/mx)*100)} /></div><div style={S.barC}>{v}</div></div>)}</div>; })}
  </>);
}

function FI({ name, conf, value, onChange }) {
  const p = { value: value || "", onChange: e => onChange(name, e.target.value) };
  if (conf.type === "select") return <select style={S.sel} {...p}><option value="">—</option>{(conf.options||[]).map(o => <option key={o} value={o}>{o}</option>)}</select>;
  if (conf.type === "textarea") return <textarea style={S.ta} {...p} />;
  return <input style={S.inp} {...p} type={conf.type === "number" ? "number" : "text"} />;
}

function Page({ pc, pk, allData, setAllData }) {
  const items = allData[pk] || [];
  const setItems = fn => setAllData(p => ({ ...p, [pk]: typeof fn === "function" ? fn(p[pk] || []) : fn }));
  const [fd, setFd] = useState({});
  const [show, setShow] = useState(false);
  const [edit, setEdit] = useState(null);
  const [q, setQ] = useState("");
  const fields = pc.crud?.fields || {};
  const fnames = Object.keys(fields);
  const selects = fnames.filter(n => fields[n].type === "select");
  const vis = fnames.filter(n => !fields[n].showIf);

  const filtered = useMemo(() => {
    if (!q) return items;
    const s = q.toLowerCase();
    return items.filter(item => Object.values(item).some(v => String(v).toLowerCase().includes(s)));
  }, [items, q]);

  const save = () => {
    const req = fnames.filter(n => fields[n].required);
    if (req.some(n => !fd[n])) { alert(`Preencha: ${req.filter(n=>!fd[n]).join(", ")}`); return; }
    if (edit !== null) setItems(p => p.map((x,i) => i===edit ? {...fd} : x));
    else setItems(p => [...p, {...fd}]);
    setFd({}); setShow(false); setEdit(null);
  };

  return (<>
    {pc.dash && <><div style={S.sec}>Dashboard</div><Dash config={pc.dash} items={items} /></>}
    {pc.crud && <>
      <div style={{...S.sec, marginTop: 12}}>Registros</div>
      <div style={S.topBar}>
        <input style={S.search} placeholder="Buscar..." value={q} onChange={e => setQ(e.target.value)} />
        <button style={S.btn()} onClick={() => { setFd({}); setEdit(null); setShow(!show); }}>{show ? "✕" : "+ Novo"}</button>
      </div>
      {show && <div style={{ padding: "0 20px 16px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "0 16px" }}>
          {fnames.map(n => { const c = fields[n]; if (c.showIf && fd[c.showIf.field] !== c.showIf.equals) return null; return <div key={n} style={{ marginBottom: 10 }}><label style={{ display:"block",fontSize:11,color:"#888",marginBottom:3,textTransform:"uppercase" }}>{n}{c.required?" *":""}</label><FI name={n} conf={c} value={fd[n]} onChange={(k,v) => setFd(p=>({...p,[k]:v}))} /></div>; })}
        </div>
        <div style={{marginTop:10}}><button style={S.btn()} onClick={save}>{edit!==null?"Salvar":"Adicionar"}</button><button style={S.btn("#333")} onClick={()=>{setShow(false);setEdit(null);setFd({})}}>Cancelar</button></div>
      </div>}
      {!filtered.length ? <div style={S.empty}>Nenhum registro.</div> :
      <div style={{ overflowX:"auto", padding:"0 20px" }}><table style={S.tbl}><thead><tr>{vis.map(n=><th key={n} style={S.th}>{n}</th>)}<th style={S.th}>ações</th></tr></thead>
      <tbody>{filtered.map((item,i) => <tr key={i}>{vis.map(n => <td key={n} style={S.td}>{selects.includes(n)?<span style={S.tag(item[n])}>{item[n]||"—"}</span>:(item[n]||"—")}</td>)}<td style={S.td}><button style={S.btn("#333")} onClick={()=>{setFd({...items[i]});setEdit(i);setShow(true)}}>✎</button><button style={S.btn("#900")} onClick={()=>setItems(p=>p.filter((_,j)=>j!==i))}>✕</button></td></tr>)}</tbody></table></div>}
    </>}
  </>);
}

function Preview({ config, allData, setAllData }) {
  const pages = Object.keys(config.pages || {});
  const [active, setActive] = useState(pages[0] || "");
  useEffect(() => { if (pages.length && !pages.includes(active)) setActive(pages[0]); }, [config]);
  if (!pages.length) return <div style={S.emptyP}><div style={{ fontSize: 64, opacity: 0.2 }}>⚡</div><div style={{ fontSize: 16, color: "#444" }}>Descreva o que quer no chat</div></div>;
  return (<>
    <div style={S.header}><div style={S.title}>{config.title}</div><div style={{fontSize:11,color:"#555"}}>turbo engine v2</div></div>
    <nav style={S.nav}>{pages.map(p => <button key={p} style={S.navBtn(p===active)} onClick={()=>setActive(p)}>{p}</button>)}</nav>
    <div style={{padding:"16px 0"}}>{config.pages[active] && <Page pc={config.pages[active]} pk={active} allData={allData} setAllData={setAllData} />}</div>
  </>);
}

// --- AI PROMPT (TURBO) ---

const SYS = `Você gera configs de UI no formato TURBO. Retorne APENAS JSON válido, sem markdown, sem backticks.

FORMATO:
{
  "title": "Nome",
  "pages": {
    "Pagina": {
      "use": "preset_name",     // opcional: crm, estoque, tarefas, pedidos, financeiro, rh, projetos, tickets
      "fields": "campo! email@ valor$ qtd# obs... status:A|B|C",   // shorthand OU override
      "include": ["endereco", "contato"],  // opcional: packs de campos
      "dash": "auto",           // "auto" gera dashboard automaticamente
      "showIf": { "campo": { "field": "outro", "equals": "valor" } },  // opcional
      "samples": [ { "campo": "exemplo" } ]  // 3-5 registros
    }
  }
}

SINTAXE DOS FIELDS (shorthand):
- "nome!" = text obrigatório
- "email@" = email
- "valor$" = number (dinheiro)
- "qtd#" = number
- "obs..." = textarea
- "status:A|B|C" = select com opções
- "campo" = text simples

PRESETS disponíveis: crm, estoque, tarefas, pedidos, financeiro, rh, projetos, tickets
PACKS disponíveis: endereco, contato, pessoa, empresa

REGRAS:
1. Se o pedido casa com um preset, USE o preset (menos tokens, mais rápido)
2. SEMPRE inclua samples com 3-5 dados realistas
3. dash: "auto" gera dashboard automático baseado nos campos
4. Se pedido pra MODIFICAR, retorne config COMPLETO
5. Interprete de forma inteligente, adicione campos que fazem sentido

EXEMPLOS DE PEDIDOS E RESPOSTAS:

"quero um crm" → { "title": "CRM", "pages": { "Clientes": { "use": "crm", "samples": [...] } } }

"sistema de tarefas com projeto" → { "title": "Tarefas", "pages": { "Tarefas": { "use": "tarefas", "fields": "projeto!", "samples": [...] } } }

"controle financeiro pessoal" → { "title": "Finanças", "pages": { "Transações": { "use": "financeiro", "samples": [...] } } }

RETORNE SOMENTE O JSON.`;

async function gen(msg, cur) {
  const messages = [{ role: "user", content: cur && Object.keys(cur.pages||{}).length ? `Atual: ${JSON.stringify(cur)}\n\nPedido: ${msg}\n\nRetorne COMPLETO.` : msg }];
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 2000, system: SYS, messages }),
  });
  const d = await r.json();
  const t = d.content?.map(i => i.text || "").join("") || "";
  return JSON.parse(t.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim());
}

// --- MAIN ---

const SUGGESTIONS = [
  "Quero um CRM",
  "Controle de estoque",
  "Gerenciador de tarefas",
  "Sistema financeiro",
  "Controle de pedidos",
  "Gestão de RH",
];

export default function App() {
  const [config, setConfig] = useState({ title: "", pages: {} });
  const [allData, setAllData] = useState({});
  const [msgs, setMsgs] = useState([{ role: "s", text: "Descreva o que quer. Ou clique num preset." }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const ref = useRef(null);
  const iref = useRef(null);

  useEffect(() => { if (ref.current) ref.current.scrollTop = ref.current.scrollHeight; }, [msgs]);

  const send = async (txt) => {
    const m = txt || input.trim();
    if (!m || loading) return;
    setInput("");
    setMsgs(p => [...p, { role: "u", text: m }]);
    setLoading(true);
    const t0 = Date.now();

    try {
      const has = Object.keys(config.pages || {}).length > 0;
      const turbo = await gen(m, has ? config : null);
      const { config: newConf, sampleData } = expandConfig(turbo);

      setConfig(newConf);
      if (sampleData) setAllData(p => {
        const merged = { ...p };
        Object.entries(sampleData).forEach(([k, d]) => { if (!merged[k]?.length) merged[k] = d; });
        return merged;
      });

      const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
      const pageNames = Object.keys(newConf.pages);
      setMsgs(p => [...p, { role: "a", text: `✅ "${newConf.title}" — ${pageNames.length} página(s): ${pageNames.join(", ")} [${elapsed}s]` }]);
    } catch (err) {
      console.error(err);
      setMsgs(p => [...p, { role: "a", text: `❌ ${err.message}` }]);
    }
    setLoading(false);
    iref.current?.focus();
  };

  const noContent = !Object.keys(config.pages || {}).length;

  return (
    <div style={S.root}>
      <style>{`@keyframes pulse{0%,100%{opacity:.3}50%{opacity:1}}`}</style>
      <div style={S.split}>
        <div style={S.chat}>
          <div style={S.chatHead}>
            <div style={S.chatTitle}><span style={{ width:8,height:8,borderRadius:"50%",background:"#0f0",display:"inline-block" }} /> Generative UI</div>
            <div style={S.chatBadge}>TURBO</div>
          </div>
          <div style={S.msgs} ref={ref}>
            {msgs.map((m, i) => {
              if (m.role === "s") return <div key={i} style={S.msgS}>{m.text}</div>;
              return <div key={i} style={m.role === "u" ? S.msgU : S.msgA}>{m.text}</div>;
            })}
            {loading && <div style={S.loading}><span style={{ animation: "pulse 1s infinite" }}>●</span> Gerando...</div>}
            {msgs.length <= 1 && !loading && (
              <div style={{ marginTop: 16 }}>
                <div style={{ fontSize: 11, color: "#555", marginBottom: 8 }}>PRESETS RÁPIDOS</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 16 }}>
                  {Object.keys(PRESETS).filter(k => !PRESETS[k].pack).map(k => (
                    <div key={k} style={S.presetTag}
                      onMouseEnter={e => { e.target.style.background = "#0f03"; e.target.style.borderColor = "#0f0"; }}
                      onMouseLeave={e => { e.target.style.background = "#0f01"; e.target.style.borderColor = "#0f03"; }}
                      onClick={() => send(`Quero um sistema de ${k}`)}>
                      {k}
                    </div>
                  ))}
                </div>
                <div style={{ fontSize: 11, color: "#555", marginBottom: 8 }}>OU DESCREVA</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {SUGGESTIONS.slice(0, 3).map((s, i) => (
                    <div key={i} style={S.suggest}
                      onMouseEnter={e => { e.target.style.borderColor = "#0f0"; e.target.style.color = "#0f0"; }}
                      onMouseLeave={e => { e.target.style.borderColor = "#333"; e.target.style.color = "#888"; }}
                      onClick={() => send(s)}>{s}</div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div style={S.tokenInfo}>presets reduzem tokens da IA em ~70%</div>
          <div style={S.inputWrap}>
            <textarea ref={iref} style={S.input} placeholder="Descreva a interface..." value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }} rows={1} />
            <button style={S.sendBtn(!loading && input.trim())} onClick={() => send()} disabled={loading}>Gerar</button>
          </div>
        </div>
        <div style={S.preview}>
          <Preview config={config} allData={allData} setAllData={setAllData} />
        </div>
      </div>
    </div>
  );
}
