import { useState, useRef, useCallback } from "react";

const INIT_EVENTS = [
  { id: 1, title: "Sprint Planning", day: 24, start: 9, end: 10, color: "#4285f4", cat: "meeting" },
  { id: 2, title: "Code Review", day: 24, start: 14, end: 15.5, color: "#7c3aed", cat: "dev" },
  { id: 3, title: "Deploy v3.5", day: 25, start: 10, end: 11, color: "#34a853", cat: "deploy" },
  { id: 4, title: "1:1 com Ana", day: 25, start: 15, end: 15.5, color: "#fbbc04", cat: "meeting" },
  { id: 5, title: "Workshop IA", day: 26, start: 13, end: 16, color: "#ea4335", cat: "learning" },
  { id: 6, title: "Daily", day: 24, start: 9.5, end: 9.75, color: "#fb923c", cat: "meeting" },
  { id: 7, title: "Daily", day: 25, start: 9.5, end: 9.75, color: "#fb923c", cat: "meeting" },
  { id: 8, title: "Daily", day: 26, start: 9.5, end: 9.75, color: "#fb923c", cat: "meeting" },
  { id: 9, title: "Daily", day: 27, start: 9.5, end: 9.75, color: "#fb923c", cat: "meeting" },
  { id: 10, title: "Daily", day: 28, start: 9.5, end: 9.75, color: "#fb923c", cat: "meeting" },
  { id: 11, title: "Almoco equipe", day: 26, start: 12, end: 13, color: "#0ea5e9", cat: "social" },
  { id: 12, title: "Retro", day: 28, start: 16, end: 17, color: "#4285f4", cat: "meeting" },
  { id: 13, title: "Demo", day: 28, start: 14, end: 15, color: "#34a853", cat: "meeting" },
  { id: 14, title: "Focus time", day: 24, start: 10.5, end: 12, color: "#6366f1", cat: "dev" },
  { id: 15, title: "Focus time", day: 27, start: 10, end: 12, color: "#6366f1", cat: "dev" },
];

const GANTT_INIT = [
  { id: "g1", name: "Planejamento", cat: "Gestao", start: 0, dur: 3, color: "#4285f4", pct: 100, who: "Ana" },
  { id: "g2", name: "Design UI/UX", cat: "Design", start: 2, dur: 5, color: "#7c3aed", pct: 100, who: "Julia" },
  { id: "g3", name: "Setup Infra", cat: "DevOps", start: 3, dur: 3, color: "#0ea5e9", pct: 100, who: "Pedro" },
  { id: "g4", name: "Backend API", cat: "Dev", start: 5, dur: 8, color: "#34a853", pct: 65, who: "Joao" },
  { id: "g5", name: "Frontend App", cat: "Dev", start: 7, dur: 7, color: "#fbbc04", pct: 40, who: "Lucas" },
  { id: "g6", name: "Integracao LLM", cat: "Dev", start: 9, dur: 5, color: "#ea4335", pct: 20, who: "Maria" },
  { id: "g7", name: "Testes E2E", cat: "QA", start: 13, dur: 4, color: "#fb923c", pct: 0, who: "Rafael" },
  { id: "g8", name: "Code Review", cat: "Dev", start: 14, dur: 2, color: "#6366f1", pct: 0, who: "Joao" },
  { id: "g9", name: "Deploy Staging", cat: "DevOps", start: 16, dur: 1, color: "#0ea5e9", pct: 0, who: "Pedro" },
  { id: "g10", name: "UAT", cat: "QA", start: 17, dur: 3, color: "#fb923c", pct: 0, who: "Beatriz" },
  { id: "g11", name: "Docs", cat: "Docs", start: 15, dur: 4, color: "#71717a", pct: 0, who: "Carlos" },
  { id: "g12", name: "Go Live", cat: "Deploy", start: 20, dur: 1, color: "#ef4444", pct: 0, who: "Ana" },
];

const GANTT_DEPS = [
  ["g1","g2"],["g1","g3"],["g2","g5"],["g3","g4"],["g4","g6"],["g4","g7"],
  ["g5","g7"],["g6","g8"],["g7","g8"],["g8","g9"],["g9","g10"],["g10","g12"],["g11","g12"],
];

const WEEK = [
  { label: "SEG", sub: "24", day: 24 },
  { label: "TER", sub: "25", day: 25 },
  { label: "QUA", sub: "26", day: 26 },
  { label: "QUI", sub: "27", day: 27 },
  { label: "SEX", sub: "28", day: 28 },
];

const HOURS = Array.from({ length: 13 }, (_, i) => i + 7);
const PH = 52;
const NOW_H = 10.5;
const SNAP = 0.25;
const snp = (v) => Math.round(v / SNAP) * SNAP;
const fH = (h) => { const hr = Math.floor(h); const mn = Math.round((h - hr) * 60); return `${hr < 10 ? "0" + hr : hr}:${mn < 10 ? "0" + mn : mn}`; };
const PALETTE = ["#4285f4","#7c3aed","#34a853","#fbbc04","#ea4335","#0ea5e9","#fb923c","#6366f1"];

function Calendar() {
  const [events, setEvents] = useState(INIT_EVENTS);
  const [creating, setCreating] = useState(null);
  const [selected, setSelected] = useState(null);
  const [editModal, setEditModal] = useState(null);
  const gridRef = useRef(null);
  const dragRef = useRef(null);

  const nid = () => Math.max(0, ...events.map(e => e.id)) + 1;

  const hourFromY = useCallback((y) => {
    if (!gridRef.current) return 7;
    const r = gridRef.current.getBoundingClientRect();
    return snp(Math.max(7, Math.min(20, 7 + (y - r.top + gridRef.current.scrollTop) / PH)));
  }, []);

  const onGridDown = useCallback((day, e) => {
    if (e.target.closest("[data-ev]")) return;
    const h = hourFromY(e.clientY);
    setCreating({ day, s: h, e: h + 0.5 });
    setSelected(null);
    const mm = (ev) => { const hh = hourFromY(ev.clientY); setCreating(p => p ? { ...p, e: Math.max(p.s + 0.25, hh) } : null); };
    const mu = () => {
      window.removeEventListener("mousemove", mm);
      window.removeEventListener("mouseup", mu);
      setCreating(p => {
        if (p && p.e - p.s >= 0.25) {
          const ne = { id: nid(), title: "Novo evento", day: p.day, start: p.s, end: p.e, color: PALETTE[Math.floor(Math.random() * 8)], cat: "meeting" };
          setEvents(prev => [...prev, ne]);
          setEditModal(ne);
        }
        return null;
      });
    };
    window.addEventListener("mousemove", mm);
    window.addEventListener("mouseup", mu);
  }, [hourFromY, events]);

  const onEvtDrag = useCallback((id, mode, e) => {
    e.stopPropagation(); e.preventDefault();
    const evt = events.find(x => x.id === id);
    if (!evt) return;
    const sy = e.clientY;
    dragRef.current = { id, mode, origS: evt.start, origE: evt.end };
    document.body.style.cursor = mode === "move" ? "grabbing" : "ns-resize";
    document.body.style.userSelect = "none";

    const mm = (ev) => {
      const dy = (ev.clientY - sy) / PH;
      setEvents(p => p.map(item => {
        if (item.id !== id) return item;
        const d = dragRef.current;
        if (mode === "move") {
          const delta = snp(dy);
          const ns = Math.max(7, Math.min(19.5, d.origS + delta));
          const dur = d.origE - d.origS;
          return { ...item, start: ns, end: ns + dur };
        }
        if (mode === "rs-bot") return { ...item, end: Math.max(item.start + 0.25, snp(d.origE + dy)) };
        if (mode === "rs-top") return { ...item, start: Math.min(item.end - 0.25, snp(d.origS + dy)) };
        return item;
      }));
    };
    const mu = () => {
      window.removeEventListener("mousemove", mm);
      window.removeEventListener("mouseup", mu);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      dragRef.current = null;
    };
    window.addEventListener("mousemove", mm);
    window.addEventListener("mouseup", mu);
  }, [events]);

  const delEvt = (id) => { setEvents(p => p.filter(x => x.id !== id)); setSelected(null); setEditModal(null); };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ display: "flex", alignItems: "center", padding: "10px 20px", borderBottom: "1px solid #dadce0" }}>
        <span style={{ fontSize: 18, color: "#3c4043", marginRight: 16 }}>Marco 2026</span>
        <span style={{ fontSize: 12, color: "#70757a" }}>Semana 24-28 | Clique e arraste pra criar, arraste eventos pra mover</span>
      </div>

      <div style={{ display: "flex", flex: 1, overflow: "auto" }} ref={gridRef}>
        <div style={{ width: 56, flexShrink: 0, paddingTop: 56 }}>
          {HOURS.map(h => (
            <div key={h} style={{ height: PH, position: "relative" }}>
              <span style={{ position: "absolute", top: -7, right: 8, fontSize: 10, color: "#70757a" }}>{h < 10 ? "0" + h : h}:00</span>
            </div>
          ))}
        </div>

        {WEEK.map(wd => {
          const de = events.filter(x => x.day === wd.day);
          const isT = wd.day === 24;
          return (
            <div key={wd.day} style={{ flex: 1, borderLeft: "1px solid #e8eaed", position: "relative", minWidth: 100 }}
              onMouseDown={e => onGridDown(wd.day, e)}>
              <div style={{ height: 56, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", borderBottom: "1px solid #e8eaed" }}>
                <span style={{ fontSize: 11, color: isT ? "#4285f4" : "#70757a", letterSpacing: 1 }}>{wd.label}</span>
                <span style={{
                  fontSize: 24, color: isT ? "#fff" : "#3c4043",
                  width: isT ? 40 : "auto", height: isT ? 40 : "auto",
                  borderRadius: "50%", background: isT ? "#4285f4" : "transparent",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>{wd.sub}</span>
              </div>

              <div style={{ position: "relative" }}>
                {HOURS.map(h => (
                  <div key={h} style={{ height: PH, borderBottom: "1px solid #e8eaed" }}>
                    <div style={{ height: "50%", borderBottom: "1px dashed #f1f3f4" }} />
                  </div>
                ))}

                {isT && <div style={{ position: "absolute", left: -6, right: 0, top: (NOW_H - 7) * PH, zIndex: 15, pointerEvents: "none", display: "flex", alignItems: "center" }}>
                  <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#ea4335", flexShrink: 0 }} />
                  <div style={{ flex: 1, height: 2, background: "#ea4335" }} />
                </div>}

                {creating && creating.day === wd.day && (
                  <div style={{
                    position: "absolute", left: 4, right: 4,
                    top: (creating.s - 7) * PH, height: Math.max((creating.e - creating.s) * PH, 12),
                    background: "#4285f433", border: "2px solid #4285f4", borderRadius: 6,
                    zIndex: 12, pointerEvents: "none",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 10, color: "#4285f4", fontWeight: "500",
                  }}>{fH(creating.s)} - {fH(creating.e)}</div>
                )}

                {de.map(evt => {
                  const top = (evt.start - 7) * PH;
                  const h = Math.max((evt.end - evt.start) * PH, 18);
                  const sm = h < 34;
                  const isSel = selected === evt.id;
                  return (
                    <div key={evt.id} data-ev="1"
                      onClick={e => { e.stopPropagation(); setSelected(isSel ? null : evt.id); }}
                      onDoubleClick={e => { e.stopPropagation(); setEditModal(evt); }}
                      onMouseDown={e => onEvtDrag(evt.id, "move", e)}
                      style={{
                        position: "absolute", left: 4, right: 6, top, height: h,
                        background: evt.color, borderRadius: 6,
                        padding: sm ? "1px 8px" : "4px 8px",
                        cursor: "grab", zIndex: isSel ? 10 : 3, opacity: 0.92,
                        boxShadow: isSel ? "0 6px 20px rgba(0,0,0,0.25)" : "0 1px 3px rgba(0,0,0,0.12)",
                        overflow: "hidden",
                      }}>
                      <div style={{ fontSize: sm ? 10 : 12, fontWeight: "500", color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{evt.title}</div>
                      {!sm && <div style={{ fontSize: 10, color: "rgba(255,255,255,0.8)" }}>{fH(evt.start)} - {fH(evt.end)}</div>}
                      <div onMouseDown={e => onEvtDrag(evt.id, "rs-top", e)} style={{ position: "absolute", top: 0, left: 0, right: 0, height: 6, cursor: "ns-resize", borderRadius: "6px 6px 0 0" }} />
                      <div onMouseDown={e => onEvtDrag(evt.id, "rs-bot", e)} style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 6, cursor: "ns-resize", borderRadius: "0 0 6px 6px" }} />
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {editModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.3)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => setEditModal(null)}>
          <div style={{ background: "#fff", borderRadius: 12, padding: 24, width: 340, boxShadow: "0 12px 40px rgba(0,0,0,0.2)" }} onClick={e => e.stopPropagation()}>
            <input value={editModal.title} autoFocus
              onChange={e => { const v = e.target.value; setEditModal(p => ({ ...p, title: v })); setEvents(p => p.map(x => x.id === editModal.id ? { ...x, title: v } : x)); }}
              style={{ width: "100%", padding: "10px 0", border: "none", borderBottom: "2px solid #4285f4", fontSize: 20, color: "#3c4043", outline: "none", fontFamily: "inherit", boxSizing: "border-box" }} />
            <div style={{ marginTop: 12, fontSize: 13, color: "#5f6368" }}>Dia {editModal.day} | {fH(editModal.start)} - {fH(editModal.end)}</div>
            <div style={{ display: "flex", gap: 6, marginTop: 12 }}>
              {PALETTE.map(c => (
                <div key={c} onClick={() => { setEditModal(p => ({...p, color: c})); setEvents(p => p.map(x => x.id === editModal.id ? {...x, color: c} : x)); }}
                  style={{ width: 24, height: 24, borderRadius: "50%", background: c, cursor: "pointer", border: editModal.color === c ? "3px solid #3c4043" : "3px solid transparent" }} />
              ))}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 20 }}>
              <button onClick={() => delEvt(editModal.id)} style={{ padding: "8px 16px", background: "transparent", color: "#ea4335", border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: 13 }}>Deletar</button>
              <button onClick={() => setEditModal(null)} style={{ padding: "8px 24px", background: "#4285f4", color: "#fff", border: "none", borderRadius: 20, cursor: "pointer", fontFamily: "inherit", fontSize: 13, fontWeight: "500" }}>OK</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Gantt() {
  const [tasks, setTasks] = useState(GANTT_INIT);
  const [sel, setSel] = useState(null);
  const [hovDep, setHovDep] = useState(null);
  const [tip, setTip] = useState(null);

  const CW = 40, RH = 44, LW = 220, DAYS = 22, TODAY = 8;

  const onDrag = useCallback((tid, mode, e) => {
    e.stopPropagation(); e.preventDefault();
    const task = tasks.find(t => t.id === tid);
    if (!task) return;
    const sx = e.clientX;
    const oS = task.start, oD = task.dur;
    document.body.style.cursor = mode === "move" ? "grabbing" : "ew-resize";
    document.body.style.userSelect = "none";

    const mm = (ev) => {
      const dx = (ev.clientX - sx) / CW;
      setTasks(p => p.map(t => {
        if (t.id !== tid) return t;
        if (mode === "move") return { ...t, start: Math.max(0, Math.round(oS + dx)) };
        if (mode === "rs-r") return { ...t, dur: Math.max(1, Math.round(oD + dx)) };
        if (mode === "rs-l") { const d = Math.round(dx); return { ...t, start: Math.max(0, oS + d), dur: Math.max(1, oD - d) }; }
        return t;
      }));
    };
    const mu = () => {
      window.removeEventListener("mousemove", mm);
      window.removeEventListener("mouseup", mu);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
    window.addEventListener("mousemove", mm);
    window.addEventListener("mouseup", mu);
  }, [tasks]);

  const st = tasks.find(t => t.id === sel);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ display: "flex", alignItems: "center", padding: "10px 20px", borderBottom: "1px solid #dadce0" }}>
        <span style={{ fontSize: 18, color: "#3c4043" }}>Roadmap</span>
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: 11, color: "#70757a" }}>{tasks.length} tarefas | Arraste barras pra mover, bordas pra redimensionar</span>
      </div>

      <div style={{ display: "flex", flex: 1, overflow: "auto" }}>
        <div style={{ width: LW, flexShrink: 0, borderRight: "1px solid #dadce0" }}>
          <div style={{ height: 36, padding: "0 16px", display: "flex", alignItems: "center", borderBottom: "1px solid #dadce0", fontSize: 11, color: "#70757a", fontWeight: "500" }}>TAREFA</div>
          {tasks.map(t => (
            <div key={t.id} onClick={() => setSel(sel === t.id ? null : t.id)}
              onMouseEnter={() => setHovDep(t.id)} onMouseLeave={() => setHovDep(null)}
              style={{ height: RH, padding: "0 16px", display: "flex", alignItems: "center", gap: 10, borderBottom: "1px solid #f1f3f4", cursor: "pointer", background: sel === t.id ? "#e8f0fe" : "transparent", transition: "background 0.1s" }}>
              <div style={{ width: 10, height: 10, borderRadius: 3, background: t.color, flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: "500", color: "#3c4043", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{t.name}</div>
                <div style={{ fontSize: 10, color: "#70757a" }}>{t.who}</div>
              </div>
              <span style={{ fontSize: 10, color: t.pct === 100 ? "#34a853" : t.pct > 0 ? "#4285f4" : "#dadce0", fontWeight: "600" }}>{t.pct}%</span>
            </div>
          ))}
        </div>

        <div style={{ flex: 1, overflow: "auto", position: "relative" }}>
          <div style={{ display: "flex", height: 36, borderBottom: "1px solid #dadce0", position: "sticky", top: 0, background: "#fff", zIndex: 5 }}>
            {Array.from({ length: DAYS }, (_, i) => (
              <div key={i} style={{ width: CW, minWidth: CW, textAlign: "center", fontSize: 10, color: i === TODAY ? "#4285f4" : "#70757a", fontWeight: i === TODAY ? "700" : "400", display: "flex", alignItems: "center", justifyContent: "center", borderRight: "1px solid #f1f3f4", background: i === TODAY ? "#e8f0fe" : "transparent" }}>{i + 1}</div>
            ))}
          </div>

          <div style={{ position: "relative" }}>
            <div style={{ position: "absolute", left: TODAY * CW, top: 0, width: CW, bottom: 0, background: "#e8f0fe33", zIndex: 0 }} />

            <svg style={{ position: "absolute", top: 0, left: 0, width: DAYS * CW, height: tasks.length * RH, pointerEvents: "none", zIndex: 2 }}>
              {GANTT_DEPS.map(([fId, tId], i) => {
                const f = tasks.find(t => t.id === fId), to = tasks.find(t => t.id === tId);
                if (!f || !to) return null;
                const fi = tasks.indexOf(f), ti = tasks.indexOf(to);
                const x1 = (f.start + f.dur) * CW, y1 = fi * RH + RH / 2;
                const x2 = to.start * CW, y2 = ti * RH + RH / 2;
                const hl = hovDep === fId || hovDep === tId;
                return (
                  <g key={i}>
                    <path d={`M${x1},${y1} C${x1+16},${y1} ${x2-16},${y2} ${x2},${y2}`} fill="none" stroke={hl ? "#4285f4" : "#dadce0"} strokeWidth={hl ? 2 : 1} />
                    <polygon points={`${x2},${y2} ${x2-5},${y2-3} ${x2-5},${y2+3}`} fill={hl ? "#4285f4" : "#dadce0"} />
                  </g>
                );
              })}
            </svg>

            {tasks.map((t) => (
              <div key={t.id} style={{ height: RH, position: "relative", borderBottom: "1px solid #f1f3f4" }}
                onMouseEnter={() => setHovDep(t.id)} onMouseLeave={() => setHovDep(null)}>
                <div
                  onClick={() => setSel(sel === t.id ? null : t.id)}
                  onMouseEnter={e => setTip({ id: t.id, x: e.clientX, y: e.clientY })}
                  onMouseMove={e => setTip(p => p?.id === t.id ? { ...p, x: e.clientX, y: e.clientY } : p)}
                  onMouseLeave={() => setTip(null)}
                  onMouseDown={e => onDrag(t.id, "move", e)}
                  style={{
                    position: "absolute", left: t.start * CW + 2, width: t.dur * CW - 4,
                    top: 8, height: RH - 16, background: t.color + "22", borderRadius: 6,
                    cursor: "grab", zIndex: 3, overflow: "hidden",
                    border: sel === t.id ? `2px solid ${t.color}` : "1px solid transparent",
                    transition: "border 0.1s, box-shadow 0.1s",
                    boxShadow: sel === t.id ? `0 2px 8px ${t.color}33` : "none",
                  }}>
                  <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${t.pct}%`, background: t.color, borderRadius: "5px 0 0 5px", opacity: 0.5 }} />
                  {t.dur >= 2 && <div style={{ position: "relative", padding: "0 8px", fontSize: 11, fontWeight: "500", color: "#3c4043", lineHeight: `${RH - 18}px`, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{t.name}</div>}

                  <div onMouseDown={e => onDrag(t.id, "rs-l", e)}
                    style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 8, cursor: "ew-resize", borderRadius: "6px 0 0 6px", transition: "background 0.1s" }}
                    onMouseEnter={e => { e.currentTarget.style.background = t.color + "55"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }} />
                  <div onMouseDown={e => onDrag(t.id, "rs-r", e)}
                    style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: 8, cursor: "ew-resize", borderRadius: "0 6px 6px 0", transition: "background 0.1s" }}
                    onMouseEnter={e => { e.currentTarget.style.background = t.color + "55"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {st && (
          <div style={{ width: 240, borderLeft: "1px solid #dadce0", padding: 16, flexShrink: 0, overflow: "auto" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
              <div style={{ width: 12, height: 12, borderRadius: 3, background: st.color }} />
              <span style={{ fontSize: 15, fontWeight: "500", color: "#3c4043" }}>{st.name}</span>
            </div>
            {[["Categoria", st.cat], ["Responsavel", st.who], ["Inicio", `Dia ${st.start + 1}`], ["Duracao", `${st.dur} dias`], ["Fim", `Dia ${st.start + st.dur}`]].map(([k, v]) => (
              <div key={k} style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 10, color: "#70757a", textTransform: "uppercase", marginBottom: 2 }}>{k}</div>
                <div style={{ fontSize: 13, color: "#3c4043" }}>{v}</div>
              </div>
            ))}
            <div style={{ fontSize: 10, color: "#70757a", textTransform: "uppercase", marginBottom: 4, marginTop: 8 }}>Progresso</div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ flex: 1, height: 8, background: "#f1f3f4", borderRadius: 4, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${st.pct}%`, background: st.color, borderRadius: 4 }} />
              </div>
              <span style={{ fontSize: 13, fontWeight: "500", color: st.pct === 100 ? "#34a853" : "#3c4043" }}>{st.pct}%</span>
            </div>
            <div style={{ fontSize: 10, color: "#70757a", textTransform: "uppercase", marginBottom: 4, marginTop: 12 }}>Depende de</div>
            {GANTT_DEPS.filter(([, to]) => to === st.id).map(([from]) => { const p = tasks.find(t => t.id === from); return p ? <div key={from} style={{ fontSize: 12, color: "#5f6368", marginBottom: 2 }}>{"<-"} {p.name}</div> : null; })}
            <div style={{ fontSize: 10, color: "#70757a", textTransform: "uppercase", marginBottom: 4, marginTop: 8 }}>Bloqueia</div>
            {GANTT_DEPS.filter(([from]) => from === st.id).map(([, to]) => { const c = tasks.find(t => t.id === to); return c ? <div key={to} style={{ fontSize: 12, color: "#5f6368", marginBottom: 2 }}>{"-> "}{c.name}</div> : null; })}
          </div>
        )}
      </div>

      {tip && (() => { const t = tasks.find(x => x.id === tip.id); if (!t) return null; return (
        <div style={{ position: "fixed", left: tip.x + 12, top: tip.y - 36, pointerEvents: "none", zIndex: 100, background: "#3c4043", color: "#fff", padding: "6px 12px", borderRadius: 6, fontSize: 11, boxShadow: "0 2px 8px rgba(0,0,0,0.25)", whiteSpace: "nowrap" }}>
          {t.name} | Dia {t.start + 1}-{t.start + t.dur} | {t.pct}%
        </div>
      ); })()}
    </div>
  );
}

export default function App() {
  const [active, setActive] = useState("calendar");
  return (
    <div style={{ fontFamily: "'Google Sans','Roboto',sans-serif", background: "#fff", color: "#3c4043", height: "100vh", display: "flex", flexDirection: "column", fontSize: 14 }}>
      <div style={{ display: "flex", alignItems: "center", padding: "8px 16px", borderBottom: "1px solid #dadce0" }}>
        <span style={{ fontSize: 18, display: "flex", alignItems: "center", gap: 10, color: "#3c4043" }}>
          <span style={{ color: "#4285f4", fontSize: 22 }}>&#9672;</span> Primitivos
          <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 10, background: "#e8f0fe", color: "#4285f4" }}>Pack 2</span>
        </span>
        <div style={{ flex: 1 }} />
        <div style={{ display: "flex", borderRadius: 20, overflow: "hidden", border: "1px solid #dadce0" }}>
          <button onClick={() => setActive("calendar")} style={{ padding: "6px 20px", background: active === "calendar" ? "#e8f0fe" : "#fff", color: active === "calendar" ? "#4285f4" : "#5f6368", border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: 13, fontWeight: active === "calendar" ? "500" : "400" }}>Calendar</button>
          <button onClick={() => setActive("gantt")} style={{ padding: "6px 20px", background: active === "gantt" ? "#e8f0fe" : "#fff", color: active === "gantt" ? "#4285f4" : "#5f6368", border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: 13, fontWeight: active === "gantt" ? "500" : "400" }}>Gantt</button>
        </div>
      </div>
      <div style={{ flex: 1, overflow: "hidden" }}>
        {active === "calendar" && <Calendar />}
        {active === "gantt" && <Gantt />}
      </div>
    </div>
  );
}
