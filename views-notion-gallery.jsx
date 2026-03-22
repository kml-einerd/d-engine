import { useState, useMemo } from "react";

// ============================================================
// VIEW PACK 2: NOTION + GALERIA
// Standalone, populado, CRUD completo
// ============================================================

const SAMPLE_DATA = [
  { id: 1, titulo: "Plano de Marketing Q2", tipo: "Documento", status: "Em progresso", responsavel: "Ana Silva", tags: ["marketing", "estratégia"], cor: "#e0f", atualizado: "2026-03-20", descricao: "Planejamento completo de campanhas para o segundo trimestre incluindo budget e KPIs." },
  { id: 2, titulo: "Wireframes App Mobile", tipo: "Design", status: "Concluído", responsavel: "Julia Ramos", tags: ["design", "mobile"], cor: "#0af", atualizado: "2026-03-18", descricao: "Wireframes de todas as telas do app mobile v2 com fluxos de navegação." },
  { id: 3, titulo: "Relatório Financeiro Março", tipo: "Planilha", status: "Em progresso", responsavel: "Carlos Neto", tags: ["financeiro", "relatório"], cor: "#0c6", atualizado: "2026-03-22", descricao: "DRE, balanço e fluxo de caixa consolidado do mês de março." },
  { id: 4, titulo: "Specs API v3", tipo: "Documento", status: "Rascunho", responsavel: "Pedro Alves", tags: ["backend", "api"], cor: "#fa0", atualizado: "2026-03-15", descricao: "Documentação técnica da nova API REST incluindo endpoints e schemas." },
  { id: 5, titulo: "Brand Guidelines 2026", tipo: "Design", status: "Concluído", responsavel: "Beatriz Dias", tags: ["design", "marca"], cor: "#f55", atualizado: "2026-03-10", descricao: "Manual de identidade visual completo com cores, tipografia e aplicações." },
  { id: 6, titulo: "Roadmap Produto", tipo: "Board", status: "Em progresso", responsavel: "Lucas Lima", tags: ["produto", "estratégia"], cor: "#ff0", atualizado: "2026-03-21", descricao: "Roadmap trimestral com features priorizadas por impacto e esforço." },
  { id: 7, titulo: "Pesquisa de Usuários", tipo: "Documento", status: "Concluído", responsavel: "Maria Souza", tags: ["ux", "pesquisa"], cor: "#a6f", atualizado: "2026-03-12", descricao: "Resultado das entrevistas com 20 usuários sobre o fluxo de onboarding." },
  { id: 8, titulo: "Proposta Comercial Nexus", tipo: "Planilha", status: "Rascunho", responsavel: "João Costa", tags: ["vendas", "proposta"], cor: "#0fa", atualizado: "2026-03-19", descricao: "Proposta técnica e comercial para o cliente Nexus Corp - projeto de 6 meses." },
  { id: 9, titulo: "Fotos do Produto v2", tipo: "Mídia", status: "Em progresso", responsavel: "Beatriz Dias", tags: ["design", "produto"], cor: "#f80", atualizado: "2026-03-17", descricao: "Sessão fotográfica dos novos produtos para e-commerce e redes sociais." },
  { id: 10, titulo: "Scripts de Migração", tipo: "Código", status: "Concluído", responsavel: "Pedro Alves", tags: ["backend", "banco"], cor: "#6af", atualizado: "2026-03-14", descricao: "Scripts SQL de migração do PostgreSQL 14 para 16 com rollback." },
  { id: 11, titulo: "Ata Reunião Board", tipo: "Documento", status: "Rascunho", responsavel: "Ana Silva", tags: ["gestão", "reunião"], cor: "#888", atualizado: "2026-03-22", descricao: "Notas e decisões da reunião trimestral do board de diretores." },
  { id: 12, titulo: "Campanha Instagram Abril", tipo: "Mídia", status: "Em progresso", responsavel: "Julia Ramos", tags: ["marketing", "social"], cor: "#e0f", atualizado: "2026-03-20", descricao: "Calendário de posts e stories para abril com copy e arte." },
];

const TIPOS = ["Documento", "Design", "Planilha", "Board", "Mídia", "Código"];
const STATUSES = ["Rascunho", "Em progresso", "Concluído"];
const ALL_TAGS = ["marketing", "estratégia", "design", "mobile", "financeiro", "relatório", "backend", "api", "marca", "produto", "ux", "pesquisa", "vendas", "proposta", "banco", "gestão", "reunião", "social"];

const ICONS = { Documento: "📄", Design: "🎨", Planilha: "📊", Board: "📋", Mídia: "🖼", Código: "💻" };
const STATUS_COL = { Rascunho: "#888", "Em progresso": "#0af", Concluído: "#0c6" };
const TAG_COL = { marketing: "#e0f", estratégia: "#fa0", design: "#0af", mobile: "#0fa", financeiro: "#0c6", relatório: "#6af", backend: "#f80", api: "#fa0", marca: "#f55", produto: "#ff0", ux: "#a6f", pesquisa: "#a6f", vendas: "#0fa", proposta: "#0fa", banco: "#f80", gestão: "#888", reunião: "#888", social: "#e0f" };

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
  tag: (name) => { const cl = TAG_COL[name] || "#555"; return { display: "inline-block", padding: "2px 8px", borderRadius: 10, fontSize: 10, background: cl + "22", color: cl, border: `1px solid ${cl}33`, marginRight: 4, marginBottom: 2 }; },
  statusTag: (name) => { const cl = STATUS_COL[name] || "#555"; return { display: "inline-block", padding: "3px 10px", borderRadius: 12, fontSize: 10, fontWeight: "bold", background: cl + "22", color: cl, border: `1px solid ${cl}44` }; },
  tipoTag: { display: "inline-block", padding: "2px 8px", borderRadius: 8, fontSize: 10, background: "#1e1e1e", color: "#888", border: "1px solid #333" },
  // Modal
  overlay: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "#000a", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center" },
  modal: { background: "#1a1a1a", border: "1px solid #333", borderRadius: 12, padding: 24, width: 520, maxHeight: "80vh", overflow: "auto" },
  modalTitle: { fontSize: 16, fontWeight: "bold", color: "#0f0", marginBottom: 16 },
  label: { display: "block", fontSize: 10, color: "#888", textTransform: "uppercase", letterSpacing: 1, marginBottom: 3, marginTop: 12 },
  input: { width: "100%", padding: "8px 10px", background: "#222", border: "1px solid #444", color: "#eee", fontFamily: "inherit", fontSize: 12, borderRadius: 4, boxSizing: "border-box" },
  textarea: { width: "100%", padding: "8px 10px", background: "#222", border: "1px solid #444", color: "#eee", fontFamily: "inherit", fontSize: 12, borderRadius: 4, boxSizing: "border-box", minHeight: 80, resize: "vertical" },
  select: { width: "100%", padding: "8px 10px", background: "#222", border: "1px solid #444", color: "#eee", fontFamily: "inherit", fontSize: 12, borderRadius: 4 },
  btn: (bg) => ({ padding: "8px 16px", background: bg || "#0f0", color: bg === "#333" ? "#aaa" : "#000", border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: 12, fontWeight: "bold", borderRadius: 4, marginRight: 8 }),
  tagPicker: { display: "flex", flexWrap: "wrap", gap: 4, marginTop: 4 },
  tagPickerItem: (sel) => ({ padding: "3px 8px", borderRadius: 10, fontSize: 10, cursor: "pointer", background: sel ? "#0f02" : "#222", border: `1px solid ${sel ? "#0f03" : "#444"}`, color: sel ? "#0f0" : "#888" }),
  colorPicker: { display: "flex", gap: 6, marginTop: 4 },
  colorDot: (cor, sel) => ({ width: 20, height: 20, borderRadius: "50%", background: cor, cursor: "pointer", border: sel ? "2px solid #fff" : "2px solid transparent" }),
  // Notion
  notionList: { borderTop: "1px solid #1e1e1e" },
  notionRow: { display: "flex", padding: "12px 0", borderBottom: "1px solid #1a1a1a", alignItems: "center", gap: 14, cursor: "pointer", transition: "background 0.1s" },
  notionIcon: (cor) => ({ width: 32, height: 32, borderRadius: 6, background: (cor || "#333") + "22", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0, border: `1px solid ${(cor || "#333")}33` }),
  notionMain: { flex: 1, minWidth: 0 },
  notionTitle: { fontSize: 14, fontWeight: "bold", marginBottom: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
  notionDesc: { fontSize: 11, color: "#555", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 400 },
  notionProps: { display: "flex", gap: 8, alignItems: "center", flexShrink: 0 },
  notionDate: { fontSize: 10, color: "#555" },
  notionAvatar: { width: 22, height: 22, borderRadius: "50%", background: "#1e1e1e", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, color: "#888" },
  // Gallery
  galGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 16 },
  galCard: { background: "#141414", borderRadius: 10, border: "1px solid #222", overflow: "hidden", cursor: "pointer", transition: "border-color 0.15s, transform 0.15s" },
  galCover: (cor) => ({ height: 130, background: `linear-gradient(135deg, ${cor || "#333"}33, ${cor || "#333"}11)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 40, position: "relative" }),
  galBadge: { position: "absolute", top: 10, right: 10 },
  galBody: { padding: "14px 16px" },
  galTitle: { fontSize: 14, fontWeight: "bold", marginBottom: 6, lineHeight: 1.3 },
  galDesc: { fontSize: 11, color: "#555", marginBottom: 8, lineHeight: 1.4, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" },
  galFooter: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  galTags: { display: "flex", flexWrap: "wrap", gap: 3, marginBottom: 8 },
  galMeta: { display: "flex", alignItems: "center", gap: 6, fontSize: 10, color: "#555" },
  // Stats
  statsBar: { display: "flex", gap: 12, padding: "12px 20px", borderBottom: "1px solid #1a1a1a" },
  statCard: { background: "#141414", border: "1px solid #222", borderRadius: 8, padding: "10px 16px", minWidth: 110 },
  statLabel: { fontSize: 9, color: "#555", textTransform: "uppercase", letterSpacing: 1 },
  statVal: { fontSize: 20, fontWeight: "bold", color: "#0f0", marginTop: 2 },
};

const COLORS_PICK = ["#e0f", "#0af", "#0c6", "#fa0", "#f55", "#ff0", "#a6f", "#0fa", "#6af", "#f80", "#888"];

// --- MODAL ---
function ItemModal({ item, onSave, onClose, onDelete }) {
  const [form, setForm] = useState(item || { titulo: "", tipo: "Documento", status: "Rascunho", responsavel: "", tags: [], cor: "#0af", descricao: "", atualizado: new Date().toISOString().slice(0, 10) });
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const toggleTag = (t) => set("tags", form.tags.includes(t) ? form.tags.filter(x => x !== t) : [...form.tags, t]);

  return (
    <div style={S.overlay} onClick={onClose}>
      <div style={S.modal} onClick={e => e.stopPropagation()}>
        <div style={S.modalTitle}>{item ? "Editar" : "Novo Item"}</div>

        <label style={S.label}>Título *</label>
        <input style={S.input} value={form.titulo} onChange={e => set("titulo", e.target.value)} />

        <label style={S.label}>Descrição</label>
        <textarea style={S.textarea} value={form.descricao} onChange={e => set("descricao", e.target.value)} />

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
          <div><label style={S.label}>Tipo</label><select style={S.select} value={form.tipo} onChange={e => set("tipo", e.target.value)}>{TIPOS.map(t => <option key={t}>{t}</option>)}</select></div>
          <div><label style={S.label}>Status</label><select style={S.select} value={form.status} onChange={e => set("status", e.target.value)}>{STATUSES.map(s => <option key={s}>{s}</option>)}</select></div>
          <div><label style={S.label}>Responsável</label><input style={S.input} value={form.responsavel} onChange={e => set("responsavel", e.target.value)} /></div>
        </div>

        <label style={S.label}>Cor</label>
        <div style={S.colorPicker}>
          {COLORS_PICK.map(cor => <div key={cor} style={S.colorDot(cor, form.cor === cor)} onClick={() => set("cor", cor)} />)}
        </div>

        <label style={S.label}>Tags</label>
        <div style={S.tagPicker}>
          {ALL_TAGS.map(t => <span key={t} style={S.tagPickerItem(form.tags.includes(t))} onClick={() => toggleTag(t)}>{t}</span>)}
        </div>

        <div style={{ marginTop: 20, display: "flex", justifyContent: "space-between" }}>
          <div>
            <button style={S.btn()} onClick={() => { if (form.titulo) onSave(form); }}>
              {item ? "Salvar" : "Adicionar"}
            </button>
            <button style={S.btn("#333")} onClick={onClose}>Cancelar</button>
          </div>
          {item && <button style={S.btn("#900")} onClick={() => onDelete(item.id)}>Deletar</button>}
        </div>
      </div>
    </div>
  );
}

// --- NOTION VIEW ---
function NotionView({ items, onEdit }) {
  return (
    <div style={S.notionList}>
      {items.map(item => (
        <div key={item.id} style={S.notionRow} onClick={() => onEdit(item)}
          onMouseEnter={e => { e.currentTarget.style.background = "#1a1a1a"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}>
          <div style={S.notionIcon(item.cor)}>{ICONS[item.tipo] || "📄"}</div>
          <div style={S.notionMain}>
            <div style={S.notionTitle}>{item.titulo}</div>
            <div style={S.notionDesc}>{item.descricao}</div>
          </div>
          <div style={S.notionProps}>
            {item.tags.slice(0, 2).map(t => <span key={t} style={S.tag(t)}>{t}</span>)}
            <span style={S.statusTag(item.status)}>{item.status}</span>
            <span style={S.tipoTag}>{item.tipo}</span>
            <div style={S.notionAvatar}>{item.responsavel?.split(" ").map(n => n[0]).join("").slice(0, 2)}</div>
            <span style={S.notionDate}>{item.atualizado}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

// --- GALLERY VIEW ---
function GalleryView({ items, onEdit }) {
  return (
    <div style={S.galGrid}>
      {items.map(item => (
        <div key={item.id} style={S.galCard} onClick={() => onEdit(item)}
          onMouseEnter={e => { e.currentTarget.style.borderColor = item.cor || "#555"; e.currentTarget.style.transform = "translateY(-2px)"; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = "#222"; e.currentTarget.style.transform = "none"; }}>
          <div style={S.galCover(item.cor)}>
            <span>{ICONS[item.tipo] || "📄"}</span>
            <div style={S.galBadge}><span style={S.statusTag(item.status)}>{item.status}</span></div>
          </div>
          <div style={S.galBody}>
            <div style={S.galTitle}>{item.titulo}</div>
            <div style={S.galDesc}>{item.descricao}</div>
            <div style={S.galTags}>
              {item.tags.map(t => <span key={t} style={S.tag(t)}>{t}</span>)}
            </div>
            <div style={S.galFooter}>
              <div style={S.galMeta}>
                <div style={{ ...S.notionAvatar, width: 18, height: 18, fontSize: 8 }}>{item.responsavel?.split(" ").map(n => n[0]).join("").slice(0, 2)}</div>
                <span>{item.responsavel}</span>
              </div>
              <span style={{ fontSize: 10, color: "#444" }}>{item.atualizado}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// --- MAIN ---
export default function App() {
  const [items, setItems] = useState(SAMPLE_DATA);
  const [view, setView] = useState("notion");
  const [modal, setModal] = useState(null);
  const [search, setSearch] = useState("");
  const [filterTipo, setFilterTipo] = useState(null);
  const [filterStatus, setFilterStatus] = useState(null);

  const filtered = useMemo(() => {
    let f = items;
    if (search) { const s = search.toLowerCase(); f = f.filter(i => i.titulo.toLowerCase().includes(s) || i.descricao?.toLowerCase().includes(s)); }
    if (filterTipo) f = f.filter(i => i.tipo === filterTipo);
    if (filterStatus) f = f.filter(i => i.status === filterStatus);
    return f;
  }, [items, search, filterTipo, filterStatus]);

  const stats = useMemo(() => ({
    total: items.length,
    docs: items.filter(i => i.tipo === "Documento").length,
    concluido: items.filter(i => i.status === "Concluído").length,
    tipos: TIPOS.map(t => ({ tipo: t, count: items.filter(i => i.tipo === t).length })).filter(t => t.count > 0),
  }), [items]);

  const handleSave = (form) => {
    if (modal?.id) setItems(p => p.map(i => i.id === modal.id ? { ...i, ...form, atualizado: new Date().toISOString().slice(0, 10) } : i));
    else setItems(p => [...p, { ...form, id: Math.max(0, ...p.map(i => i.id)) + 1 }]);
    setModal(null);
  };

  const handleDelete = (id) => { setItems(p => p.filter(i => i.id !== id)); setModal(null); };

  return (
    <div style={S.root}>
      <div style={S.topBar}>
        <div style={S.logo}>◈ Workspace</div>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <div style={S.viewToggle}>
            <button style={S.viewBtn(view === "notion")} onClick={() => setView("notion")}>◫ Notion</button>
            <button style={S.viewBtn(view === "gallery")} onClick={() => setView("gallery")}>▦ Galeria</button>
          </div>
          <button style={S.addBtn} onClick={() => setModal("new")}>+ Novo</button>
        </div>
      </div>

      <div style={S.statsBar}>
        <div style={S.statCard}><div style={S.statLabel}>Total</div><div style={S.statVal}>{stats.total}</div></div>
        <div style={S.statCard}><div style={S.statLabel}>Concluídos</div><div style={{ ...S.statVal, color: "#0c6" }}>{stats.concluido}</div></div>
        {stats.tipos.map(t => <div key={t.tipo} style={S.statCard}><div style={S.statLabel}>{t.tipo}</div><div style={S.statVal}>{t.count}</div></div>)}
      </div>

      <div style={S.filterBar}>
        <input style={S.search} value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar..." />
        <span style={{ fontSize: 10, color: "#555" }}>Tipo:</span>
        <span style={S.filterChip(!filterTipo)} onClick={() => setFilterTipo(null)}>Todos</span>
        {TIPOS.map(t => <span key={t} style={S.filterChip(filterTipo === t)} onClick={() => setFilterTipo(filterTipo === t ? null : t)}>{ICONS[t]} {t}</span>)}
        <span style={{ fontSize: 10, color: "#555", marginLeft: 8 }}>Status:</span>
        {STATUSES.map(s => <span key={s} style={S.filterChip(filterStatus === s)} onClick={() => setFilterStatus(filterStatus === s ? null : s)}>{s}</span>)}
      </div>

      <div style={S.content}>
        {view === "notion" && <NotionView items={filtered} onEdit={setModal} />}
        {view === "gallery" && <GalleryView items={filtered} onEdit={setModal} />}
      </div>

      {modal && <ItemModal item={modal === "new" ? null : modal} onSave={handleSave} onClose={() => setModal(null)} onDelete={handleDelete} />}
    </div>
  );
}
