import { useState, useMemo } from "react";

// ============================================================
// VIEW PACK 1: KANBAN + CLICKUP
// Standalone, populado, CRUD completo
// ============================================================

const SAMPLE_DATA = [
  { id: 1, titulo: "Redesign da landing page", responsavel: "Ana Silva", status: "Fazendo", prioridade: "Alta", tags: ["design", "urgente"], valor: 5000, prazo: "2026-04-01" },
  { id: 2, titulo: "Integração API de pagamentos", responsavel: "João Costa", status: "Pendente", prioridade: "Alta", tags: ["backend", "fintech"], valor: 12000, prazo: "2026-04-15" },
  { id: 3, titulo: "Configurar CI/CD pipeline", responsavel: "Pedro Alves", status: "Feito", prioridade: "Média", tags: ["devops"], valor: 3000, prazo: "2026-03-20" },
  { id: 4, titulo: "Escrever docs da API", responsavel: "Maria Souza", status: "Pendente", prioridade: "Baixa", tags: ["docs"], valor: 1500, prazo: "2026-05-01" },
  { id: 5, titulo: "Migrar banco pra Supabase", responsavel: "Lucas Lima", status: "Fazendo", prioridade: "Alta", tags: ["backend", "banco"], valor: 8000, prazo: "2026-04-10" },
  { id: 6, titulo: "Testes E2E com Playwright", responsavel: "Julia Ramos", status: "Bloqueado", prioridade: "Média", tags: ["qa", "testes"], valor: 4000, prazo: "2026-04-20" },
  { id: 7, titulo: "Otimizar bundle size", responsavel: "Carlos Neto", status: "Pendente", prioridade: "Baixa", tags: ["frontend", "performance"], valor: 2000, prazo: "2026-05-15" },
  { id: 8, titulo: "Implementar dark mode", responsavel: "Beatriz Dias", status: "Feito", prioridade: "Média", tags: ["frontend", "design"], valor: 3500, prazo: "2026-03-25" },
  { id: 9, titulo: "Setup monitoramento", responsavel: "Ana Silva", status: "Fazendo", prioridade: "Média", tags: ["devops", "infra"], valor: 6000, prazo: "2026-04-05" },
  { id: 10, titulo: "Redesign do onboarding", responsavel: "Julia Ramos", status: "Pendente", prioridade: "Alta", tags: ["design", "ux"], valor: 7000, prazo: "2026-04-25" },
  { id: 11, titulo: "Corrigir bug de autenticação", responsavel: "Pedro Alves", status: "Bloqueado", prioridade: "Alta", tags: ["backend", "bug", "urgente"], valor: 2500, prazo: "2026-03-28" },
  { id: 12, titulo: "Criar dashboard analytics", responsavel: "João Costa", status: "Pendente", prioridade: "Média", tags: ["frontend", "dados"], valor: 9000, prazo: "2026-05-10" },
];

const STATUSES = ["Pendente", "Fazendo", "Bloqueado", "Feito"];
const PRIORITIES = ["Alta", "Média", "Baixa"];
const ALL_TAGS = ["design", "frontend", "backend", "devops", "qa", "testes", "docs", "ux", "bug", "urgente", "fintech", "infra", "banco", "performance", "dados"];

const COLORS = {
  Pendente: "#f80", Fazendo: "#0af", Bloqueado: "#f44", Feito: "#0c6",
  Alta: "#f44", Média: "#fa0", Baixa: "#888",
  design: "#e0f", frontend: "#0af", backend: "#f80", devops: "#0c6", qa: "#a6f",
  testes: "#a6f", docs: "#888", ux: "#ff6", bug: "#f44", urgente: "#f00",
  fintech: "#0fa", infra: "#6af", banco: "#fa0", performance: "#0ff", dados: "#af0",
};

const c = (name) => COLORS[name] || "#555";

const S = {
  root: { fontFamily: "'IBM Plex Mono','Courier New',monospace", background: "#0a0a0a", color: "#e0e0e0", minHeight: "100vh", fontSize: 13 },
  topBar: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 20px", borderBottom: "1px solid #222" },
  logo: { fontSize: 16, fontWeight: "bold", color: "#0f0" },
  viewToggle: { display: "flex", gap: 0, background: "#1a1a1a", borderRadius: 6, overflow: "hidden", border: "1px solid #333" },
  viewBtn: (a) => ({ padding: "8px 18px", background: a ? "#0f02" : "transparent", color: a ? "#0f0" : "#888", border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: 12, fontWeight: a ? "bold" : "normal", borderRight: "1px solid #333" }),
  addBtn: { padding: "8px 16px", background: "#0f0", color: "#000", border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: 12, fontWeight: "bold", borderRadius: 6 },
  filterBar: { display: "flex", gap: 8, padding: "12px 20px", flexWrap: "wrap", alignItems: "center", borderBottom: "1px solid #1a1a1a" },
  search: { padding: "6px 12px", background: "#1a1a1a", border: "1px solid #333", color: "#eee", fontFamily: "inherit", fontSize: 12, borderRadius: 4, width: 200 },
  filterChip: (a) => ({ padding: "4px 10px", background: a ? "#0f02" : "#1a1a1a", border: `1px solid ${a ? "#0f03" : "#333"}`, color: a ? "#0f0" : "#888", cursor: "pointer", fontFamily: "inherit", fontSize: 10, borderRadius: 12 }),
  content: { padding: 20 },
  tag: (name) => ({ display: "inline-block", padding: "2px 8px", borderRadius: 10, fontSize: 10, background: c(name) + "22", color: c(name), border: `1px solid ${c(name)}33`, marginRight: 4, marginBottom: 2 }),
  statusTag: (name) => ({ display: "inline-block", padding: "3px 10px", borderRadius: 12, fontSize: 10, fontWeight: "bold", background: c(name) + "22", color: c(name), border: `1px solid ${c(name)}44` }),
  prioTag: (name) => ({ display: "inline-block", padding: "2px 8px", borderRadius: 8, fontSize: 9, background: c(name) + "22", color: c(name), border: `1px solid ${c(name)}33` }),
  // Modal
  overlay: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "#000a", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center" },
  modal: { background: "#1a1a1a", border: "1px solid #333", borderRadius: 12, padding: 24, width: 480, maxHeight: "80vh", overflow: "auto" },
  modalTitle: { fontSize: 16, fontWeight: "bold", color: "#0f0", marginBottom: 16 },
  label: { display: "block", fontSize: 10, color: "#888", textTransform: "uppercase", letterSpacing: 1, marginBottom: 3, marginTop: 12 },
  input: { width: "100%", padding: "8px 10px", background: "#222", border: "1px solid #444", color: "#eee", fontFamily: "inherit", fontSize: 12, borderRadius: 4, boxSizing: "border-box" },
  select: { width: "100%", padding: "8px 10px", background: "#222", border: "1px solid #444", color: "#eee", fontFamily: "inherit", fontSize: 12, borderRadius: 4 },
  btn: (bg) => ({ padding: "8px 16px", background: bg || "#0f0", color: bg === "#333" ? "#aaa" : "#000", border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: 12, fontWeight: "bold", borderRadius: 4, marginRight: 8 }),
  tagPicker: { display: "flex", flexWrap: "wrap", gap: 4, marginTop: 4 },
  tagPickerItem: (sel) => ({ padding: "3px 8px", borderRadius: 10, fontSize: 10, cursor: "pointer", background: sel ? "#0f02" : "#222", border: `1px solid ${sel ? "#0f03" : "#444"}`, color: sel ? "#0f0" : "#888" }),
  // Kanban
  kBoard: { display: "flex", gap: 16, overflow: "auto", paddingBottom: 16 },
  kCol: { minWidth: 260, maxWidth: 300, background: "#141414", borderRadius: 10, border: "1px solid #222", flexShrink: 0 },
  kColHead: (col) => ({ padding: "12px 14px", borderBottom: `2px solid ${col}`, display: "flex", justifyContent: "space-between", alignItems: "center" }),
  kColTitle: (col) => ({ fontSize: 12, fontWeight: "bold", color: col }),
  kColCount: { fontSize: 10, color: "#555", background: "#1e1e1e", padding: "2px 8px", borderRadius: 8 },
  kCards: { padding: 10, display: "flex", flexDirection: "column", gap: 8, minHeight: 80 },
  kCard: { padding: "12px 14px", background: "#1e1e1e", borderRadius: 8, border: "1px solid #2a2a2a", cursor: "pointer", transition: "border-color 0.15s" },
  kCardTitle: { fontWeight: "bold", fontSize: 13, marginBottom: 6, lineHeight: 1.4 },
  kCardMeta: { display: "flex", alignItems: "center", gap: 8, marginBottom: 6, fontSize: 11, color: "#888" },
  kCardTags: { display: "flex", flexWrap: "wrap", gap: 3 },
  kCardFooter: { display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8, fontSize: 10, color: "#555" },
  // ClickUp
  cuGroup: { marginBottom: 20 },
  cuGroupHead: (col) => ({ display: "flex", alignItems: "center", gap: 10, padding: "10px 16px", background: "#141414", borderRadius: "8px 8px 0 0", borderBottom: `3px solid ${col}`, borderLeft: `3px solid ${col}` }),
  cuGroupLabel: { fontSize: 13, fontWeight: "bold", flex: 1 },
  cuGroupCount: { fontSize: 10, color: "#666", background: "#222", padding: "2px 8px", borderRadius: 8 },
  cuRow: { display: "flex", alignItems: "center", padding: "10px 16px", borderBottom: "1px solid #1a1a1a", gap: 12, fontSize: 12, cursor: "pointer", transition: "background 0.1s" },
  cuCheck: (done) => ({ width: 18, height: 18, borderRadius: 4, border: `2px solid ${done ? "#0c6" : "#444"}`, background: done ? "#0c622" : "transparent", cursor: "pointer", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "#0c6", fontSize: 11 }),
  cuName: { flex: 1, fontWeight: "bold" },
  cuAvatar: { width: 24, height: 24, borderRadius: "50%", background: "#222", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: "#888", flexShrink: 0 },
  cuValor: { fontSize: 11, color: "#0f0", fontWeight: "bold" },
  cuPrazo: (late) => ({ fontSize: 10, color: late ? "#f44" : "#555" }),
  // Stats bar
  statsBar: { display: "flex", gap: 12, padding: "12px 20px", borderBottom: "1px solid #1a1a1a" },
  statCard: { background: "#141414", border: "1px solid #222", borderRadius: 8, padding: "10px 16px", minWidth: 120 },
  statLabel: { fontSize: 9, color: "#555", textTransform: "uppercase", letterSpacing: 1 },
  statVal: { fontSize: 20, fontWeight: "bold", color: "#0f0", marginTop: 2 },
};

// --- MODAL FORM ---
function ItemModal({ item, onSave, onClose }) {
  const [form, setForm] = useState(item || { titulo: "", responsavel: "", status: "Pendente", prioridade: "Média", tags: [], valor: 0, prazo: "" });
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const toggleTag = (t) => set("tags", form.tags.includes(t) ? form.tags.filter(x => x !== t) : [...form.tags, t]);

  return (
    <div style={S.overlay} onClick={onClose}>
      <div style={S.modal} onClick={e => e.stopPropagation()}>
        <div style={S.modalTitle}>{item ? "Editar" : "Novo Item"}</div>

        <label style={S.label}>Título *</label>
        <input style={S.input} value={form.titulo} onChange={e => set("titulo", e.target.value)} placeholder="Nome da tarefa..." />

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            <label style={S.label}>Responsável</label>
            <input style={S.input} value={form.responsavel} onChange={e => set("responsavel", e.target.value)} />
          </div>
          <div>
            <label style={S.label}>Valor (R$)</label>
            <input style={S.input} type="number" value={form.valor} onChange={e => set("valor", Number(e.target.value))} />
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
          <div>
            <label style={S.label}>Status</label>
            <select style={S.select} value={form.status} onChange={e => set("status", e.target.value)}>
              {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label style={S.label}>Prioridade</label>
            <select style={S.select} value={form.prioridade} onChange={e => set("prioridade", e.target.value)}>
              {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label style={S.label}>Prazo</label>
            <input style={S.input} type="date" value={form.prazo} onChange={e => set("prazo", e.target.value)} />
          </div>
        </div>

        <label style={S.label}>Tags</label>
        <div style={S.tagPicker}>
          {ALL_TAGS.map(t => (
            <span key={t} style={S.tagPickerItem(form.tags.includes(t))} onClick={() => toggleTag(t)}>{t}</span>
          ))}
        </div>

        <div style={{ marginTop: 20, display: "flex" }}>
          <button style={S.btn()} onClick={() => { if (form.titulo) onSave(form); }}>
            {item ? "Salvar" : "Adicionar"}
          </button>
          <button style={S.btn("#333")} onClick={onClose}>Cancelar</button>
        </div>
      </div>
    </div>
  );
}

// --- KANBAN VIEW ---
function KanbanView({ items, onEdit, onMove }) {
  const cols = {};
  STATUSES.forEach(s => { cols[s] = items.filter(i => i.status === s); });

  const handleDragStart = (e, item) => { e.dataTransfer.setData("itemId", String(item.id)); };
  const handleDrop = (e, status) => { e.preventDefault(); const id = Number(e.dataTransfer.getData("itemId")); if (id) onMove(id, status); };

  return (
    <div style={S.kBoard}>
      {STATUSES.map(status => (
        <div key={status} style={S.kCol} onDragOver={e => e.preventDefault()} onDrop={e => handleDrop(e, status)}>
          <div style={S.kColHead(c(status))}>
            <span style={S.kColTitle(c(status))}>{status}</span>
            <span style={S.kColCount}>{cols[status].length}</span>
          </div>
          <div style={S.kCards}>
            {cols[status].map(item => (
              <div key={item.id} style={S.kCard} draggable onDragStart={e => handleDragStart(e, item)}
                onClick={() => onEdit(item)}
                onMouseEnter={e => { e.currentTarget.style.borderColor = c(status); }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "#2a2a2a"; }}>
                <div style={S.kCardTitle}>{item.titulo}</div>
                <div style={S.kCardMeta}>
                  <span>{item.responsavel}</span>
                  <span style={S.prioTag(item.prioridade)}>{item.prioridade}</span>
                </div>
                <div style={S.kCardTags}>
                  {item.tags.map(t => <span key={t} style={S.tag(t)}>{t}</span>)}
                </div>
                <div style={S.kCardFooter}>
                  <span>R$ {item.valor?.toLocaleString("pt-BR")}</span>
                  <span>{item.prazo}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// --- CLICKUP VIEW ---
function ClickUpView({ items, onEdit, onToggleDone }) {
  const groups = {};
  STATUSES.forEach(s => { groups[s] = items.filter(i => i.status === s); });

  const isLate = (prazo) => prazo && new Date(prazo) < new Date();

  return (
    <div>
      {STATUSES.map(status => (
        <div key={status} style={S.cuGroup}>
          <div style={S.cuGroupHead(c(status))}>
            <span style={S.cuGroupLabel}>{status}</span>
            <span style={S.cuGroupCount}>{groups[status].length}</span>
          </div>
          {groups[status].map(item => (
            <div key={item.id} style={S.cuRow}
              onMouseEnter={e => { e.currentTarget.style.background = "#1a1a1a"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
              onClick={() => onEdit(item)}>
              <div style={S.cuCheck(item.status === "Feito")} onClick={e => { e.stopPropagation(); onToggleDone(item.id); }}>
                {item.status === "Feito" && "✓"}
              </div>
              <div style={S.cuName}>{item.titulo}</div>
              <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                {item.tags.slice(0, 3).map(t => <span key={t} style={S.tag(t)}>{t}</span>)}
              </div>
              <span style={S.prioTag(item.prioridade)}>{item.prioridade}</span>
              <div style={S.cuAvatar}>{item.responsavel?.split(" ").map(n => n[0]).join("").slice(0, 2)}</div>
              <span style={S.cuValor}>R${item.valor?.toLocaleString("pt-BR")}</span>
              <span style={S.cuPrazo(isLate(item.prazo))}>{item.prazo || "—"}</span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

// --- MAIN ---
export default function App() {
  const [items, setItems] = useState(SAMPLE_DATA);
  const [view, setView] = useState("kanban");
  const [modal, setModal] = useState(null); // null | "new" | item
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState(null);
  const [filterPrio, setFilterPrio] = useState(null);
  const [filterTag, setFilterTag] = useState(null);

  const filtered = useMemo(() => {
    let f = items;
    if (search) { const s = search.toLowerCase(); f = f.filter(i => i.titulo.toLowerCase().includes(s) || i.responsavel.toLowerCase().includes(s)); }
    if (filterStatus) f = f.filter(i => i.status === filterStatus);
    if (filterPrio) f = f.filter(i => i.prioridade === filterPrio);
    if (filterTag) f = f.filter(i => i.tags.includes(filterTag));
    return f;
  }, [items, search, filterStatus, filterPrio, filterTag]);

  const stats = useMemo(() => ({
    total: items.length,
    feito: items.filter(i => i.status === "Feito").length,
    bloqueado: items.filter(i => i.status === "Bloqueado").length,
    valor: items.reduce((s, i) => s + (i.valor || 0), 0),
  }), [items]);

  const handleSave = (form) => {
    if (modal && modal.id) {
      setItems(p => p.map(i => i.id === modal.id ? { ...i, ...form } : i));
    } else {
      setItems(p => [...p, { ...form, id: Math.max(...p.map(i => i.id)) + 1 }]);
    }
    setModal(null);
  };

  const handleMove = (id, newStatus) => {
    setItems(p => p.map(i => i.id === id ? { ...i, status: newStatus } : i));
  };

  const handleToggleDone = (id) => {
    setItems(p => p.map(i => i.id === id ? { ...i, status: i.status === "Feito" ? "Pendente" : "Feito" } : i));
  };

  const handleDelete = (id) => {
    setItems(p => p.filter(i => i.id !== id));
    setModal(null);
  };

  return (
    <div style={S.root}>
      {/* TOP */}
      <div style={S.topBar}>
        <div style={S.logo}>◈ Projetos</div>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <div style={S.viewToggle}>
            <button style={S.viewBtn(view === "kanban")} onClick={() => setView("kanban")}>▥ Kanban</button>
            <button style={S.viewBtn(view === "clickup")} onClick={() => setView("clickup")}>☑ ClickUp</button>
          </div>
          <button style={S.addBtn} onClick={() => setModal("new")}>+ Novo</button>
        </div>
      </div>

      {/* STATS */}
      <div style={S.statsBar}>
        <div style={S.statCard}><div style={S.statLabel}>Total</div><div style={S.statVal}>{stats.total}</div></div>
        <div style={S.statCard}><div style={S.statLabel}>Concluídos</div><div style={{ ...S.statVal, color: "#0c6" }}>{stats.feito}</div></div>
        <div style={S.statCard}><div style={S.statLabel}>Bloqueados</div><div style={{ ...S.statVal, color: "#f44" }}>{stats.bloqueado}</div></div>
        <div style={S.statCard}><div style={S.statLabel}>Valor Total</div><div style={S.statVal}>R${stats.valor.toLocaleString("pt-BR")}</div></div>
      </div>

      {/* FILTERS */}
      <div style={S.filterBar}>
        <input style={S.search} value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar..." />
        <span style={{ fontSize: 10, color: "#555" }}>Status:</span>
        <span style={S.filterChip(!filterStatus)} onClick={() => setFilterStatus(null)}>Todos</span>
        {STATUSES.map(s => <span key={s} style={S.filterChip(filterStatus === s)} onClick={() => setFilterStatus(filterStatus === s ? null : s)}>{s}</span>)}
        <span style={{ fontSize: 10, color: "#555", marginLeft: 8 }}>Prio:</span>
        {PRIORITIES.map(p => <span key={p} style={S.filterChip(filterPrio === p)} onClick={() => setFilterPrio(filterPrio === p ? null : p)}>{p}</span>)}
        <span style={{ fontSize: 10, color: "#555", marginLeft: 8 }}>Tag:</span>
        {ALL_TAGS.slice(0, 6).map(t => <span key={t} style={S.filterChip(filterTag === t)} onClick={() => setFilterTag(filterTag === t ? null : t)}>{t}</span>)}
        {filterTag && ALL_TAGS.indexOf(filterTag) >= 6 && <span style={S.filterChip(true)}>{filterTag}</span>}
      </div>

      {/* CONTENT */}
      <div style={S.content}>
        {view === "kanban" && <KanbanView items={filtered} onEdit={setModal} onMove={handleMove} />}
        {view === "clickup" && <ClickUpView items={filtered} onEdit={setModal} onToggleDone={handleToggleDone} />}
      </div>

      {/* MODAL */}
      {modal && (
        <ItemModal
          item={modal === "new" ? null : modal}
          onSave={handleSave}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}
