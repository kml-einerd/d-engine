import { useState, useMemo } from "react";

// ============================================================
// VIEW PACK 3: SISTEMA DE PASTAS + TABELA AVANÇADA
// Standalone, populado, CRUD completo
// ============================================================

const FILE_DATA = [
  { id: 1, nome: "Projetos", tipo: "pasta", parent: null, cor: "#0f0", atualizado: "2026-03-22", tamanho: null },
  { id: 2, nome: "Documentos", tipo: "pasta", parent: null, cor: "#0af", atualizado: "2026-03-20", tamanho: null },
  { id: 3, nome: "Mídia", tipo: "pasta", parent: null, cor: "#f80", atualizado: "2026-03-18", tamanho: null },
  { id: 4, nome: "Financeiro", tipo: "pasta", parent: null, cor: "#0c6", atualizado: "2026-03-22", tamanho: null },
  { id: 5, nome: "Arquivo Morto", tipo: "pasta", parent: null, cor: "#888", atualizado: "2026-01-15", tamanho: null },
  // Dentro de Projetos
  { id: 10, nome: "App Mobile v2", tipo: "pasta", parent: 1, cor: "#0af", atualizado: "2026-03-21", tamanho: null },
  { id: 11, nome: "Website Redesign", tipo: "pasta", parent: 1, cor: "#e0f", atualizado: "2026-03-19", tamanho: null },
  { id: 12, nome: "roadmap.md", tipo: "markdown", parent: 1, cor: null, atualizado: "2026-03-22", tamanho: "24 KB", tags: ["produto"] },
  // Dentro de App Mobile
  { id: 20, nome: "wireframes-v2.fig", tipo: "figma", parent: 10, cor: null, atualizado: "2026-03-20", tamanho: "8.2 MB", tags: ["design"] },
  { id: 21, nome: "specs-api.md", tipo: "markdown", parent: 10, cor: null, atualizado: "2026-03-18", tamanho: "12 KB", tags: ["backend"] },
  { id: 22, nome: "sprint-plan.xlsx", tipo: "excel", parent: 10, cor: null, atualizado: "2026-03-21", tamanho: "156 KB", tags: ["gestão"] },
  { id: 23, nome: "screenshots", tipo: "pasta", parent: 10, cor: "#f55", atualizado: "2026-03-19", tamanho: null },
  { id: 30, nome: "home-v1.png", tipo: "imagem", parent: 23, cor: null, atualizado: "2026-03-19", tamanho: "1.2 MB" },
  { id: 31, nome: "home-v2.png", tipo: "imagem", parent: 23, cor: null, atualizado: "2026-03-19", tamanho: "1.4 MB" },
  { id: 32, nome: "profile.png", tipo: "imagem", parent: 23, cor: null, atualizado: "2026-03-19", tamanho: "890 KB" },
  // Dentro de Website
  { id: 40, nome: "landing-page.html", tipo: "codigo", parent: 11, cor: null, atualizado: "2026-03-19", tamanho: "34 KB", tags: ["frontend"] },
  { id: 41, nome: "style-guide.pdf", tipo: "pdf", parent: 11, cor: null, atualizado: "2026-03-17", tamanho: "2.1 MB", tags: ["design"] },
  // Documentos
  { id: 50, nome: "contrato-nexus.pdf", tipo: "pdf", parent: 2, cor: null, atualizado: "2026-03-15", tamanho: "540 KB", tags: ["vendas", "legal"] },
  { id: 51, nome: "proposta-comercial.docx", tipo: "word", parent: 2, cor: null, atualizado: "2026-03-20", tamanho: "320 KB", tags: ["vendas"] },
  { id: 52, nome: "ata-board-q1.md", tipo: "markdown", parent: 2, cor: null, atualizado: "2026-03-22", tamanho: "8 KB", tags: ["gestão"] },
  { id: 53, nome: "onboarding-guide.pdf", tipo: "pdf", parent: 2, cor: null, atualizado: "2026-02-10", tamanho: "1.8 MB", tags: ["rh"] },
  // Mídia
  { id: 60, nome: "logo-principal.svg", tipo: "imagem", parent: 3, cor: null, atualizado: "2026-01-20", tamanho: "24 KB", tags: ["marca"] },
  { id: 61, nome: "video-produto.mp4", tipo: "video", parent: 3, cor: null, atualizado: "2026-03-10", tamanho: "145 MB", tags: ["marketing"] },
  { id: 62, nome: "podcast-ep12.mp3", tipo: "audio", parent: 3, cor: null, atualizado: "2026-03-18", tamanho: "42 MB", tags: ["marketing"] },
  { id: 63, nome: "fotos-evento", tipo: "pasta", parent: 3, cor: "#ff0", atualizado: "2026-03-15", tamanho: null },
  // Financeiro
  { id: 70, nome: "dre-marco.xlsx", tipo: "excel", parent: 4, cor: null, atualizado: "2026-03-22", tamanho: "890 KB", tags: ["financeiro"] },
  { id: 71, nome: "fluxo-caixa.xlsx", tipo: "excel", parent: 4, cor: null, atualizado: "2026-03-22", tamanho: "1.2 MB", tags: ["financeiro"] },
  { id: 72, nome: "notas-fiscais", tipo: "pasta", parent: 4, cor: "#0c6", atualizado: "2026-03-21", tamanho: null },
  { id: 73, nome: "budget-2026.xlsx", tipo: "excel", parent: 4, cor: null, atualizado: "2026-01-05", tamanho: "2.4 MB", tags: ["financeiro", "estratégia"] },
];

const TABLE_DATA = [
  { id: 1, nome: "Ana Silva", email: "ana@empresa.com", cargo: "Designer Lead", departamento: "Produto", status: "Ativo", salario: 12000, admissao: "2023-06-15", tags: ["design", "liderança"] },
  { id: 2, nome: "João Costa", email: "joao@empresa.com", cargo: "Backend Engineer", departamento: "Engenharia", status: "Ativo", salario: 14000, admissao: "2022-03-01", tags: ["backend", "senior"] },
  { id: 3, nome: "Maria Souza", email: "maria@empresa.com", cargo: "UX Researcher", departamento: "Produto", status: "Férias", salario: 9500, admissao: "2024-01-10", tags: ["ux", "pesquisa"] },
  { id: 4, nome: "Pedro Alves", email: "pedro@empresa.com", cargo: "DevOps Engineer", departamento: "Engenharia", status: "Ativo", salario: 15000, admissao: "2021-11-20", tags: ["devops", "infra"] },
  { id: 5, nome: "Lucas Lima", email: "lucas@empresa.com", cargo: "Frontend Engineer", departamento: "Engenharia", status: "Ativo", salario: 11000, admissao: "2023-09-05", tags: ["frontend"] },
  { id: 6, nome: "Julia Ramos", email: "julia@empresa.com", cargo: "Product Manager", departamento: "Produto", status: "Ativo", salario: 16000, admissao: "2022-07-18", tags: ["produto", "liderança"] },
  { id: 7, nome: "Carlos Neto", email: "carlos@empresa.com", cargo: "Data Analyst", departamento: "Dados", status: "Ativo", salario: 10000, admissao: "2024-04-22", tags: ["dados", "analytics"] },
  { id: 8, nome: "Beatriz Dias", email: "bea@empresa.com", cargo: "Marketing Manager", departamento: "Marketing", status: "Ativo", salario: 13000, admissao: "2023-01-08", tags: ["marketing", "liderança"] },
  { id: 9, nome: "Rafael Gomes", email: "rafa@empresa.com", cargo: "QA Engineer", departamento: "Engenharia", status: "Afastado", salario: 9000, admissao: "2024-08-12", tags: ["qa", "testes"] },
  { id: 10, nome: "Camila Torres", email: "camila@empresa.com", cargo: "HR Business Partner", departamento: "RH", status: "Ativo", salario: 11500, admissao: "2023-05-30", tags: ["rh"] },
];

const FILE_ICONS = { pasta: "📁", markdown: "📝", figma: "🎨", excel: "📊", pdf: "📕", word: "📄", imagem: "🖼", video: "🎬", audio: "🎵", codigo: "💻" };
const DEPS = ["Produto", "Engenharia", "Dados", "Marketing", "RH"];
const EMP_STATUS = ["Ativo", "Férias", "Afastado"];
const TAG_COL = { design:"#0af", liderança:"#ff0", backend:"#f80", senior:"#fa0", ux:"#a6f", pesquisa:"#a6f", devops:"#0c6", infra:"#6af", frontend:"#0af", produto:"#ff0", dados:"#0fa", analytics:"#0fa", marketing:"#e0f", qa:"#a6f", testes:"#a6f", rh:"#f55", vendas:"#0fa", legal:"#888", gestão:"#888", financeiro:"#0c6", estratégia:"#fa0", marca:"#f55" };
const STATUS_COL = { Ativo: "#0c6", Férias: "#0af", Afastado: "#f80" };

const S = {
  root: { fontFamily: "'IBM Plex Mono','Courier New',monospace", background: "#0a0a0a", color: "#e0e0e0", minHeight: "100vh", fontSize: 13 },
  topBar: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 20px", borderBottom: "1px solid #222" },
  logo: { fontSize: 16, fontWeight: "bold", color: "#0f0" },
  viewToggle: { display: "flex", gap: 0, background: "#1a1a1a", borderRadius: 6, overflow: "hidden", border: "1px solid #333" },
  viewBtn: (a) => ({ padding: "8px 18px", background: a ? "#0f02" : "transparent", color: a ? "#0f0" : "#888", border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: 12, fontWeight: a ? "bold" : "normal", borderRight: "1px solid #333" }),
  addBtn: { padding: "8px 16px", background: "#0f0", color: "#000", border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: 12, fontWeight: "bold", borderRadius: 6 },
  content: { padding: 20 },
  tag: (name) => { const cl = TAG_COL[name] || "#555"; return { display: "inline-block", padding: "2px 8px", borderRadius: 10, fontSize: 10, background: cl + "22", color: cl, border: `1px solid ${cl}33`, marginRight: 4, marginBottom: 2 }; },
  statusTag: (name) => { const cl = STATUS_COL[name] || "#555"; return { display: "inline-block", padding: "3px 10px", borderRadius: 12, fontSize: 10, fontWeight: "bold", background: cl + "22", color: cl, border: `1px solid ${cl}44` }; },
  filterBar: { display: "flex", gap: 8, padding: "12px 20px", flexWrap: "wrap", alignItems: "center", borderBottom: "1px solid #1a1a1a" },
  search: { padding: "6px 12px", background: "#1a1a1a", border: "1px solid #333", color: "#eee", fontFamily: "inherit", fontSize: 12, borderRadius: 4, width: 200 },
  filterChip: (a) => ({ padding: "4px 10px", background: a ? "#0f02" : "#1a1a1a", border: `1px solid ${a ? "#0f03" : "#333"}`, color: a ? "#0f0" : "#888", cursor: "pointer", fontFamily: "inherit", fontSize: 10, borderRadius: 12 }),
  // Modal
  overlay: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "#000a", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center" },
  modal: { background: "#1a1a1a", border: "1px solid #333", borderRadius: 12, padding: 24, width: 480, maxHeight: "80vh", overflow: "auto" },
  modalTitle: { fontSize: 16, fontWeight: "bold", color: "#0f0", marginBottom: 16 },
  label: { display: "block", fontSize: 10, color: "#888", textTransform: "uppercase", letterSpacing: 1, marginBottom: 3, marginTop: 12 },
  input: { width: "100%", padding: "8px 10px", background: "#222", border: "1px solid #444", color: "#eee", fontFamily: "inherit", fontSize: 12, borderRadius: 4, boxSizing: "border-box" },
  select: { width: "100%", padding: "8px 10px", background: "#222", border: "1px solid #444", color: "#eee", fontFamily: "inherit", fontSize: 12, borderRadius: 4 },
  btn: (bg) => ({ padding: "8px 16px", background: bg || "#0f0", color: bg === "#333" ? "#aaa" : bg === "#900" ? "#fff" : "#000", border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: 12, fontWeight: "bold", borderRadius: 4, marginRight: 8 }),
  tagPicker: { display: "flex", flexWrap: "wrap", gap: 4, marginTop: 4 },
  tagPickerItem: (sel) => ({ padding: "3px 8px", borderRadius: 10, fontSize: 10, cursor: "pointer", background: sel ? "#0f02" : "#222", border: `1px solid ${sel ? "#0f03" : "#444"}`, color: sel ? "#0f0" : "#888" }),
  // Files
  breadcrumb: { display: "flex", gap: 4, alignItems: "center", marginBottom: 16, fontSize: 12 },
  breadItem: (active) => ({ color: active ? "#0f0" : "#888", cursor: "pointer", padding: "2px 6px", borderRadius: 4 }),
  fileGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: 12 },
  fileCard: { padding: 16, background: "#141414", borderRadius: 10, border: "1px solid #222", textAlign: "center", cursor: "pointer", transition: "all 0.15s" },
  fileIcon: { fontSize: 36, marginBottom: 8 },
  fileName: { fontSize: 11, fontWeight: "bold", wordBreak: "break-all", lineHeight: 1.3, marginBottom: 4 },
  fileMeta: { fontSize: 9, color: "#555" },
  fileCount: { fontSize: 9, color: "#444", marginTop: 2 },
  // Table
  tbl: { width: "100%", borderCollapse: "collapse" },
  th: (sortable) => ({ textAlign: "left", padding: "8px 12px", borderBottom: "2px solid #333", fontSize: 10, color: "#888", textTransform: "uppercase", cursor: sortable ? "pointer" : "default", userSelect: "none", whiteSpace: "nowrap" }),
  td: { padding: "8px 12px", borderBottom: "1px solid #1a1a1a", fontSize: 12 },
  sortArrow: { marginLeft: 4, fontSize: 8 },
  avatar: { width: 28, height: 28, borderRadius: "50%", background: "#1e1e1e", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: "#888", marginRight: 8, verticalAlign: "middle" },
  statsBar: { display: "flex", gap: 12, padding: "12px 20px", borderBottom: "1px solid #1a1a1a" },
  statCard: { background: "#141414", border: "1px solid #222", borderRadius: 8, padding: "10px 16px", minWidth: 110 },
  statLabel: { fontSize: 9, color: "#555", textTransform: "uppercase", letterSpacing: 1 },
  statVal: { fontSize: 20, fontWeight: "bold", color: "#0f0", marginTop: 2 },
};

// --- FILES VIEW ---
function FilesView({ files, setFiles }) {
  const [path, setPath] = useState([]);  // array of folder ids
  const [modal, setModal] = useState(null);

  const currentParent = path.length ? path[path.length - 1] : null;
  const currentItems = files.filter(f => f.parent === currentParent).sort((a, b) => {
    if (a.tipo === "pasta" && b.tipo !== "pasta") return -1;
    if (a.tipo !== "pasta" && b.tipo === "pasta") return 1;
    return a.nome.localeCompare(b.nome);
  });

  const breadcrumbs = [{ id: null, nome: "Raiz" }];
  let tmpPath = [];
  path.forEach(pid => {
    tmpPath.push(pid);
    const f = files.find(fi => fi.id === pid);
    if (f) breadcrumbs.push({ id: pid, nome: f.nome });
  });

  const countChildren = (folderId) => files.filter(f => f.parent === folderId).length;

  const handleClick = (item) => {
    if (item.tipo === "pasta") setPath(p => [...p, item.id]);
    else setModal(item);
  };

  const handleSave = (form) => {
    if (modal?.id) {
      setFiles(p => p.map(f => f.id === modal.id ? { ...f, ...form } : f));
    } else {
      setFiles(p => [...p, { ...form, id: Math.max(0, ...p.map(f => f.id)) + 1, parent: currentParent, atualizado: new Date().toISOString().slice(0, 10) }]);
    }
    setModal(null);
  };

  const handleDelete = (id) => {
    // delete item and all children recursively
    const toDelete = new Set();
    const collect = (pid) => { toDelete.add(pid); files.filter(f => f.parent === pid).forEach(f => collect(f.id)); };
    collect(id);
    setFiles(p => p.filter(f => !toDelete.has(f.id)));
    setModal(null);
  };

  return (
    <div>
      {/* Breadcrumb */}
      <div style={S.breadcrumb}>
        {breadcrumbs.map((b, i) => (
          <span key={b.id ?? "root"}>
            {i > 0 && <span style={{ color: "#333", margin: "0 2px" }}>/</span>}
            <span style={S.breadItem(i === breadcrumbs.length - 1)} onClick={() => {
              if (b.id === null) setPath([]);
              else setPath(path.slice(0, path.indexOf(b.id) + 1));
            }}>{b.nome}</span>
          </span>
        ))}
        <span style={{ flex: 1 }} />
        <button style={S.btn()} onClick={() => setModal("new")}>+ Novo</button>
        <button style={S.btn("#333")} onClick={() => {
          const nome = prompt("Nome da pasta:");
          if (nome) setFiles(p => [...p, { id: Math.max(0, ...p.map(f => f.id)) + 1, nome, tipo: "pasta", parent: currentParent, cor: "#0f0", atualizado: new Date().toISOString().slice(0, 10), tamanho: null }]);
        }}>+ Pasta</button>
      </div>

      {/* Grid */}
      {!currentItems.length ? (
        <div style={{ textAlign: "center", padding: 60, color: "#333" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📂</div>
          <div>Pasta vazia</div>
        </div>
      ) : (
        <div style={S.fileGrid}>
          {currentItems.map(item => (
            <div key={item.id} style={S.fileCard} onClick={() => handleClick(item)}
              onMouseEnter={e => { e.currentTarget.style.borderColor = item.cor || "#555"; e.currentTarget.style.transform = "translateY(-2px)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "#222"; e.currentTarget.style.transform = "none"; }}>
              <div style={{ ...S.fileIcon, color: item.cor || undefined }}>{FILE_ICONS[item.tipo] || "📄"}</div>
              <div style={S.fileName}>{item.nome}</div>
              <div style={S.fileMeta}>
                {item.tamanho || item.atualizado}
              </div>
              {item.tipo === "pasta" && <div style={S.fileCount}>{countChildren(item.id)} itens</div>}
              {item.tags && <div style={{ marginTop: 4 }}>{item.tags.slice(0, 2).map(t => <span key={t} style={{ ...S.tag(t), fontSize: 8, padding: "1px 5px" }}>{t}</span>)}</div>}
            </div>
          ))}
        </div>
      )}

      {/* Modal for file edit */}
      {modal && modal !== "new" && modal.tipo !== "pasta" && (
        <div style={S.overlay} onClick={() => setModal(null)}>
          <div style={S.modal} onClick={e => e.stopPropagation()}>
            <div style={S.modalTitle}>Editar Arquivo</div>
            <label style={S.label}>Nome</label>
            <input style={S.input} defaultValue={modal.nome} ref={el => el && (el._val = modal.nome)}
              onChange={e => { e.target._val = e.target.value; }} />
            <div style={{ marginTop: 16, display: "flex", justifyContent: "space-between" }}>
              <div>
                <button style={S.btn()} onClick={(e) => {
                  const input = e.target.closest("div").parentElement.querySelector("input");
                  handleSave({ nome: input._val || modal.nome });
                }}>Salvar</button>
                <button style={S.btn("#333")} onClick={() => setModal(null)}>Cancelar</button>
              </div>
              <button style={S.btn("#900")} onClick={() => handleDelete(modal.id)}>Deletar</button>
            </div>
          </div>
        </div>
      )}

      {modal === "new" && (
        <div style={S.overlay} onClick={() => setModal(null)}>
          <div style={S.modal} onClick={e => e.stopPropagation()}>
            <div style={S.modalTitle}>Novo Arquivo</div>
            <NewFileForm onSave={handleSave} onClose={() => setModal(null)} />
          </div>
        </div>
      )}
    </div>
  );
}

function NewFileForm({ onSave, onClose }) {
  const [form, setForm] = useState({ nome: "", tipo: "markdown", tamanho: "0 KB", tags: [] });
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const allTags = Object.keys(TAG_COL);
  return (<>
    <label style={S.label}>Nome *</label>
    <input style={S.input} value={form.nome} onChange={e => set("nome", e.target.value)} placeholder="arquivo.ext" />
    <label style={S.label}>Tipo</label>
    <select style={S.select} value={form.tipo} onChange={e => set("tipo", e.target.value)}>
      {Object.keys(FILE_ICONS).filter(t => t !== "pasta").map(t => <option key={t} value={t}>{FILE_ICONS[t]} {t}</option>)}
    </select>
    <label style={S.label}>Tags</label>
    <div style={S.tagPicker}>{allTags.slice(0, 12).map(t => <span key={t} style={S.tagPickerItem(form.tags.includes(t))} onClick={() => set("tags", form.tags.includes(t) ? form.tags.filter(x=>x!==t) : [...form.tags, t])}>{t}</span>)}</div>
    <div style={{ marginTop: 16 }}>
      <button style={S.btn()} onClick={() => { if (form.nome) onSave(form); }}>Criar</button>
      <button style={S.btn("#333")} onClick={onClose}>Cancelar</button>
    </div>
  </>);
}

// --- TABLE VIEW ---
function TableView({ data, setData }) {
  const [sort, setSort] = useState({ field: "nome", dir: "asc" });
  const [search, setSearch] = useState("");
  const [filterDep, setFilterDep] = useState(null);
  const [filterStatus, setFilterStatus] = useState(null);
  const [modal, setModal] = useState(null);

  const sorted = useMemo(() => {
    let f = data;
    if (search) { const s = search.toLowerCase(); f = f.filter(i => i.nome.toLowerCase().includes(s) || i.email.toLowerCase().includes(s) || i.cargo.toLowerCase().includes(s)); }
    if (filterDep) f = f.filter(i => i.departamento === filterDep);
    if (filterStatus) f = f.filter(i => i.status === filterStatus);
    return [...f].sort((a, b) => {
      let va = a[sort.field], vb = b[sort.field];
      if (typeof va === "number") return sort.dir === "asc" ? va - vb : vb - va;
      return sort.dir === "asc" ? String(va).localeCompare(String(vb)) : String(vb).localeCompare(String(va));
    });
  }, [data, sort, search, filterDep, filterStatus]);

  const toggleSort = (field) => setSort(s => ({ field, dir: s.field === field && s.dir === "asc" ? "desc" : "asc" }));
  const arrow = (field) => sort.field === field ? (sort.dir === "asc" ? "▲" : "▼") : "·";

  const stats = useMemo(() => ({
    total: data.length,
    ativos: data.filter(i => i.status === "Ativo").length,
    folha: data.reduce((s, i) => s + (i.salario || 0), 0),
    media: data.length ? Math.round(data.reduce((s, i) => s + (i.salario || 0), 0) / data.length) : 0,
  }), [data]);

  const handleSave = (form) => {
    if (modal?.id) setData(p => p.map(i => i.id === modal.id ? { ...i, ...form } : i));
    else setData(p => [...p, { ...form, id: Math.max(0, ...p.map(i => i.id)) + 1 }]);
    setModal(null);
  };

  const handleDelete = (id) => { setData(p => p.filter(i => i.id !== id)); setModal(null); };

  return (
    <div>
      <div style={{ ...S.statsBar, padding: "0 0 16px 0", borderBottom: "none" }}>
        <div style={S.statCard}><div style={S.statLabel}>Pessoas</div><div style={S.statVal}>{stats.total}</div></div>
        <div style={S.statCard}><div style={S.statLabel}>Ativos</div><div style={{ ...S.statVal, color: "#0c6" }}>{stats.ativos}</div></div>
        <div style={S.statCard}><div style={S.statLabel}>Folha</div><div style={S.statVal}>R${stats.folha.toLocaleString("pt-BR")}</div></div>
        <div style={S.statCard}><div style={S.statLabel}>Média</div><div style={S.statVal}>R${stats.media.toLocaleString("pt-BR")}</div></div>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
        <input style={S.search} value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar..." />
        {DEPS.map(d => <span key={d} style={S.filterChip(filterDep === d)} onClick={() => setFilterDep(filterDep === d ? null : d)}>{d}</span>)}
        <span style={{ width: 1, height: 20, background: "#333" }} />
        {EMP_STATUS.map(s => <span key={s} style={S.filterChip(filterStatus === s)} onClick={() => setFilterStatus(filterStatus === s ? null : s)}>{s}</span>)}
        <span style={{ flex: 1 }} />
        <button style={S.btn()} onClick={() => setModal("new")}>+ Novo</button>
      </div>

      <div style={{ overflowX: "auto" }}>
        <table style={S.tbl}>
          <thead><tr>
            <th style={S.th(true)} onClick={() => toggleSort("nome")}>Nome <span style={S.sortArrow}>{arrow("nome")}</span></th>
            <th style={S.th(true)} onClick={() => toggleSort("cargo")}>Cargo <span style={S.sortArrow}>{arrow("cargo")}</span></th>
            <th style={S.th(true)} onClick={() => toggleSort("departamento")}>Dept <span style={S.sortArrow}>{arrow("departamento")}</span></th>
            <th style={S.th(false)}>Status</th>
            <th style={S.th(true)} onClick={() => toggleSort("salario")}>Salário <span style={S.sortArrow}>{arrow("salario")}</span></th>
            <th style={S.th(false)}>Tags</th>
            <th style={S.th(true)} onClick={() => toggleSort("admissao")}>Admissão <span style={S.sortArrow}>{arrow("admissao")}</span></th>
          </tr></thead>
          <tbody>{sorted.map(item => (
            <tr key={item.id} style={{ cursor: "pointer" }} onClick={() => setModal(item)}
              onMouseEnter={e => { e.currentTarget.style.background = "#1a1a1a"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}>
              <td style={S.td}><span style={S.avatar}>{item.nome.split(" ").map(n=>n[0]).join("").slice(0,2)}</span>{item.nome}</td>
              <td style={S.td}>{item.cargo}</td>
              <td style={S.td}>{item.departamento}</td>
              <td style={S.td}><span style={S.statusTag(item.status)}>{item.status}</span></td>
              <td style={{ ...S.td, color: "#0f0", fontWeight: "bold" }}>R${item.salario?.toLocaleString("pt-BR")}</td>
              <td style={S.td}>{item.tags?.map(t => <span key={t} style={S.tag(t)}>{t}</span>)}</td>
              <td style={{ ...S.td, color: "#555" }}>{item.admissao}</td>
            </tr>
          ))}</tbody>
        </table>
      </div>

      {modal && (
        <div style={S.overlay} onClick={() => setModal(null)}>
          <div style={S.modal} onClick={e => e.stopPropagation()}>
            <PersonForm item={modal === "new" ? null : modal} onSave={handleSave} onClose={() => setModal(null)} onDelete={handleDelete} />
          </div>
        </div>
      )}
    </div>
  );
}

function PersonForm({ item, onSave, onClose, onDelete }) {
  const [form, setForm] = useState(item || { nome: "", email: "", cargo: "", departamento: "Engenharia", status: "Ativo", salario: 0, admissao: "", tags: [] });
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const allTags = Object.keys(TAG_COL).slice(0, 12);
  return (<>
    <div style={S.modalTitle}>{item ? "Editar Pessoa" : "Nova Pessoa"}</div>
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
      <div><label style={S.label}>Nome *</label><input style={S.input} value={form.nome} onChange={e => set("nome", e.target.value)} /></div>
      <div><label style={S.label}>Email</label><input style={S.input} value={form.email} onChange={e => set("email", e.target.value)} /></div>
    </div>
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
      <div><label style={S.label}>Cargo</label><input style={S.input} value={form.cargo} onChange={e => set("cargo", e.target.value)} /></div>
      <div><label style={S.label}>Departamento</label><select style={S.select} value={form.departamento} onChange={e => set("departamento", e.target.value)}>{DEPS.map(d => <option key={d}>{d}</option>)}</select></div>
      <div><label style={S.label}>Status</label><select style={S.select} value={form.status} onChange={e => set("status", e.target.value)}>{EMP_STATUS.map(s => <option key={s}>{s}</option>)}</select></div>
    </div>
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
      <div><label style={S.label}>Salário</label><input style={S.input} type="number" value={form.salario} onChange={e => set("salario", Number(e.target.value))} /></div>
      <div><label style={S.label}>Admissão</label><input style={S.input} type="date" value={form.admissao} onChange={e => set("admissao", e.target.value)} /></div>
    </div>
    <label style={S.label}>Tags</label>
    <div style={S.tagPicker}>{allTags.map(t => <span key={t} style={S.tagPickerItem(form.tags?.includes(t))} onClick={() => set("tags", (form.tags||[]).includes(t) ? form.tags.filter(x=>x!==t) : [...(form.tags||[]), t])}>{t}</span>)}</div>
    <div style={{ marginTop: 20, display: "flex", justifyContent: "space-between" }}>
      <div><button style={S.btn()} onClick={() => { if (form.nome) onSave(form); }}>{item ? "Salvar" : "Adicionar"}</button><button style={S.btn("#333")} onClick={onClose}>Cancelar</button></div>
      {item && <button style={S.btn("#900")} onClick={() => onDelete(item.id)}>Deletar</button>}
    </div>
  </>);
}

// --- MAIN ---
export default function App() {
  const [view, setView] = useState("files");
  const [files, setFiles] = useState(FILE_DATA);
  const [tableData, setTableData] = useState(TABLE_DATA);

  return (
    <div style={S.root}>
      <div style={S.topBar}>
        <div style={S.logo}>◈ {view === "files" ? "Arquivos" : "Equipe"}</div>
        <div style={S.viewToggle}>
          <button style={S.viewBtn(view === "files")} onClick={() => setView("files")}>📁 Arquivos</button>
          <button style={S.viewBtn(view === "table")} onClick={() => setView("table")}>☰ Tabela</button>
        </div>
      </div>

      <div style={S.content}>
        {view === "files" && <FilesView files={files} setFiles={setFiles} />}
        {view === "table" && <TableView data={tableData} setData={setTableData} />}
      </div>
    </div>
  );
}
