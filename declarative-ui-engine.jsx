import { useState, useCallback, useMemo } from "react";

// ============================================================
// 🔧 SUA CONFIG VAI AQUI — é só isso que você edita
// ============================================================
const APP_CONFIG = {
  title: "Minha App",
  pages: {
    Clientes: {
      crud: {
        fields: {
          nome:     { type: "text", required: true },
          email:    { type: "email" },
          telefone: { type: "text" },
          status:   { type: "select", options: ["Novo", "Ativo", "Inativo"] },
          valor:    { type: "number" },
          origem:   { type: "text", showIf: { field: "status", equals: "Novo" } },
          notas:    { type: "textarea", showIf: { field: "status", equals: "Inativo" } },
        },
      },
      dash: {
        cards: [
          { label: "Total", calc: "count" },
          { label: "Ativos", calc: "count", where: { status: "Ativo" } },
          { label: "Receita Total", calc: "sum", field: "valor", prefix: "R$" },
        ],
        charts: [
          { type: "bar", groupBy: "status", label: "Por Status" },
        ],
      },
    },
    Produtos: {
      crud: {
        fields: {
          produto:    { type: "text", required: true },
          categoria:  { type: "select", options: ["Eletrônico", "Roupa", "Alimento", "Outro"] },
          preco:      { type: "number" },
          estoque:    { type: "number" },
          descricao:  { type: "textarea", showIf: { field: "categoria", equals: "Outro" } },
        },
      },
      dash: {
        cards: [
          { label: "Produtos", calc: "count" },
          { label: "Valor em Estoque", calc: "custom", fn: (items) => items.reduce((s, i) => s + (i.preco || 0) * (i.estoque || 0), 0), prefix: "R$" },
        ],
        charts: [
          { type: "bar", groupBy: "categoria", label: "Por Categoria" },
        ],
      },
    },
  },
};

// ============================================================
// ENGINE — você NÃO precisa mexer aqui
// ============================================================

const S = {
  root: { fontFamily: "'Courier New', monospace", background: "#111", color: "#eee", minHeight: "100vh", fontSize: 14 },
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
  form: { padding: "0 20px 16px" },
  fieldWrap: { marginBottom: 10 },
  label: { display: "block", fontSize: 11, color: "#888", marginBottom: 3, textTransform: "uppercase" },
  input: { width: "100%", padding: "8px 10px", background: "#1e1e1e", border: "1px solid #444", color: "#eee", fontFamily: "inherit", fontSize: 13, borderRadius: 3, boxSizing: "border-box" },
  select: { width: "100%", padding: "8px 10px", background: "#1e1e1e", border: "1px solid #444", color: "#eee", fontFamily: "inherit", fontSize: 13, borderRadius: 3 },
  textarea: { width: "100%", padding: "8px 10px", background: "#1e1e1e", border: "1px solid #444", color: "#eee", fontFamily: "inherit", fontSize: 13, borderRadius: 3, minHeight: 60, boxSizing: "border-box" },
  btn: (c) => ({ padding: "8px 16px", background: c || "#0f0", color: c === "#900" ? "#fff" : "#000", border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: 13, fontWeight: "bold", borderRadius: 3, marginRight: 6 }),
  actions: { display: "flex", gap: 6 },
  tag: (v) => {
    const colors = { Novo: "#05f", Ativo: "#0a0", Inativo: "#888", Eletrônico: "#f80", Roupa: "#e0e", Alimento: "#0cc", Outro: "#888" };
    const bg = colors[v] || "#555";
    return { display: "inline-block", padding: "2px 8px", borderRadius: 10, fontSize: 11, background: bg + "33", color: bg, border: `1px solid ${bg}55` };
  },
  empty: { padding: 40, textAlign: "center", color: "#555" },
  topBar: { display: "flex", gap: 8, padding: "0 20px 12px", flexWrap: "wrap" },
  search: { flex: 1, minWidth: 150, padding: "8px 10px", background: "#1e1e1e", border: "1px solid #444", color: "#eee", fontFamily: "inherit", fontSize: 13, borderRadius: 3 },
  section: { marginBottom: 8, fontSize: 12, color: "#555", padding: "0 20px", textTransform: "uppercase", letterSpacing: 1 },
};

function calcCard(items, card) {
  if (card.calc === "custom" && card.fn) return card.fn(items);
  let filtered = items;
  if (card.where) {
    filtered = items.filter(i => Object.entries(card.where).every(([k, v]) => i[k] === v));
  }
  if (card.calc === "count") return filtered.length;
  if (card.calc === "sum" && card.field) return filtered.reduce((s, i) => s + (Number(i[card.field]) || 0), 0);
  if (card.calc === "avg" && card.field) {
    if (!filtered.length) return 0;
    return (filtered.reduce((s, i) => s + (Number(i[card.field]) || 0), 0) / filtered.length).toFixed(1);
  }
  return 0;
}

function DashSection({ config, items }) {
  if (!config) return null;
  const groups = {};
  (config.charts || []).forEach(ch => {
    if (ch.groupBy) {
      items.forEach(item => {
        const key = item[ch.groupBy] || "(vazio)";
        groups[ch.groupBy] = groups[ch.groupBy] || {};
        groups[ch.groupBy][key] = (groups[ch.groupBy][key] || 0) + 1;
      });
    }
  });

  return (
    <>
      {config.cards && (
        <div style={S.grid}>
          {config.cards.map((c, i) => {
            const val = calcCard(items, c);
            return (
              <div key={i} style={S.card}>
                <div style={S.cardLabel}>{c.label}</div>
                <div style={S.cardVal}>{c.prefix || ""}{typeof val === "number" ? val.toLocaleString("pt-BR") : val}</div>
              </div>
            );
          })}
        </div>
      )}
      {(config.charts || []).map((ch, ci) => {
        const data = groups[ch.groupBy] || {};
        const entries = Object.entries(data);
        const max = Math.max(...entries.map(([, v]) => v), 1);
        return (
          <div key={ci} style={S.chartWrap}>
            <div style={S.chartTitle}>{ch.label}</div>
            {entries.map(([k, v]) => (
              <div key={k} style={S.barRow}>
                <div style={S.barLabel}>{k}</div>
                <div style={{ flex: 1 }}><div style={S.bar((v / max) * 100)} /></div>
                <div style={S.barCount}>{v}</div>
              </div>
            ))}
          </div>
        );
      })}
    </>
  );
}

function shouldShow(fieldConf, formData) {
  if (!fieldConf.showIf) return true;
  return formData[fieldConf.showIf.field] === fieldConf.showIf.equals;
}

function FieldInput({ name, conf, value, onChange }) {
  const props = { style: conf.type === "textarea" ? S.textarea : conf.type === "select" ? S.select : S.input, value: value || "", onChange: e => onChange(name, e.target.value) };
  if (conf.type === "select") {
    return (
      <select {...props}>
        <option value="">— selecione —</option>
        {(conf.options || []).map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    );
  }
  if (conf.type === "textarea") return <textarea {...props} />;
  return <input {...props} type={conf.type === "number" ? "number" : "text"} />;
}

function FormSection({ fields, formData, setFormData, onSave, onCancel, editing }) {
  const handleChange = (name, val) => setFormData(prev => ({ ...prev, [name]: val }));
  return (
    <div style={S.form}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "0 16px" }}>
        {Object.entries(fields).map(([name, conf]) => {
          if (!shouldShow(conf, formData)) return null;
          return (
            <div key={name} style={S.fieldWrap}>
              <label style={S.label}>{name}{conf.required ? " *" : ""}</label>
              <FieldInput name={name} conf={conf} value={formData[name]} onChange={handleChange} />
            </div>
          );
        })}
      </div>
      <div style={{ marginTop: 10 }}>
        <button style={S.btn()} onClick={onSave}>{editing ? "Salvar" : "Adicionar"}</button>
        {onCancel && <button style={S.btn("#333")} onClick={onCancel}>Cancelar</button>}
      </div>
    </div>
  );
}

function CrudTable({ fields, items, onEdit, onDelete }) {
  const fieldNames = Object.keys(fields);
  const selectFields = Object.entries(fields).filter(([, c]) => c.type === "select").map(([n]) => n);

  if (!items.length) return <div style={S.empty}>Nenhum registro. Clique + pra adicionar.</div>;
  return (
    <div style={{ overflowX: "auto", padding: "0 20px" }}>
      <table style={S.table}>
        <thead>
          <tr>
            {fieldNames.filter(n => !fields[n].showIf).map(n => <th key={n} style={S.th}>{n}</th>)}
            <th style={S.th}>ações</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, i) => (
            <tr key={i} style={{ background: i % 2 ? "transparent" : "#1a1a1a08" }}>
              {fieldNames.filter(n => !fields[n].showIf).map(n => (
                <td key={n} style={S.td}>
                  {selectFields.includes(n) ? <span style={S.tag(item[n])}>{item[n] || "—"}</span> : (item[n] || "—")}
                </td>
              ))}
              <td style={S.td}>
                <div style={S.actions}>
                  <button style={S.btn("#333")} onClick={() => onEdit(i)}>✎</button>
                  <button style={S.btn("#900")} onClick={() => onDelete(i)}>✕</button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PageView({ pageConfig, pageKey }) {
  const [items, setItems] = useState(() => {
    // seed data pra demo
    if (pageKey === "Clientes") return [
      { nome: "Ana Silva", email: "ana@email.com", telefone: "11999", status: "Ativo", valor: 5000 },
      { nome: "João Costa", email: "joao@email.com", telefone: "11888", status: "Novo", valor: 1200, origem: "Google" },
      { nome: "Maria Souza", email: "maria@email.com", telefone: "11777", status: "Inativo", valor: 3000, notas: "Cancelou" },
      { nome: "Pedro Alves", email: "pedro@email.com", telefone: "11666", status: "Ativo", valor: 8000 },
    ];
    if (pageKey === "Produtos") return [
      { produto: "Notebook", categoria: "Eletrônico", preco: 4500, estoque: 12 },
      { produto: "Camiseta", categoria: "Roupa", preco: 89, estoque: 200 },
      { produto: "Arroz 5kg", categoria: "Alimento", preco: 28, estoque: 50 },
    ];
    return [];
  });
  const [formData, setFormData] = useState({});
  const [showForm, setShowForm] = useState(false);
  const [editIdx, setEditIdx] = useState(null);
  const [search, setSearch] = useState("");

  const fields = pageConfig.crud?.fields || {};

  const filteredItems = useMemo(() => {
    if (!search) return items;
    const s = search.toLowerCase();
    return items.filter(item => Object.values(item).some(v => String(v).toLowerCase().includes(s)));
  }, [items, search]);

  const handleSave = () => {
    const required = Object.entries(fields).filter(([, c]) => c.required).map(([n]) => n);
    const missing = required.filter(n => !formData[n]);
    if (missing.length) { alert(`Preencha: ${missing.join(", ")}`); return; }
    if (editIdx !== null) {
      setItems(prev => prev.map((item, i) => i === editIdx ? { ...formData } : item));
    } else {
      setItems(prev => [...prev, { ...formData }]);
    }
    setFormData({});
    setShowForm(false);
    setEditIdx(null);
  };

  const handleEdit = (i) => {
    setFormData({ ...items[i] });
    setEditIdx(i);
    setShowForm(true);
  };

  const handleDelete = (i) => {
    setItems(prev => prev.filter((_, idx) => idx !== i));
  };

  const handleCancel = () => {
    setFormData({});
    setShowForm(false);
    setEditIdx(null);
  };

  return (
    <>
      {pageConfig.dash && (
        <>
          <div style={S.section}>Dashboard</div>
          <DashSection config={pageConfig.dash} items={items} />
        </>
      )}

      {pageConfig.crud && (
        <>
          <div style={{ ...S.section, marginTop: 12 }}>Registros</div>
          <div style={S.topBar}>
            <input style={S.search} placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} />
            <button style={S.btn()} onClick={() => { setFormData({}); setEditIdx(null); setShowForm(!showForm); }}>
              {showForm ? "✕ Fechar" : "+ Novo"}
            </button>
          </div>

          {showForm && (
            <FormSection
              fields={fields}
              formData={formData}
              setFormData={setFormData}
              onSave={handleSave}
              onCancel={handleCancel}
              editing={editIdx !== null}
            />
          )}

          <CrudTable fields={fields} items={filteredItems} onEdit={handleEdit} onDelete={handleDelete} />
        </>
      )}
    </>
  );
}

export default function App() {
  const pages = Object.keys(APP_CONFIG.pages);
  const [activePage, setActivePage] = useState(pages[0]);

  return (
    <div style={S.root}>
      <div style={S.header}>
        <div style={S.title}>{APP_CONFIG.title}</div>
        <div style={{ fontSize: 11, color: "#555" }}>declarative engine v1</div>
      </div>
      <nav style={S.nav}>
        {pages.map(p => (
          <button key={p} style={S.navBtn(p === activePage)} onClick={() => setActivePage(p)}>{p}</button>
        ))}
      </nav>
      <div style={{ padding: "16px 0" }}>
        <PageView pageConfig={APP_CONFIG.pages[activePage]} pageKey={activePage} />
      </div>
    </div>
  );
}
