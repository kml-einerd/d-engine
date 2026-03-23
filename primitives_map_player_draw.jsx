import { useState, useRef, useCallback, useEffect } from "react";

// ============================================================
// PRIMITIVOS IRREDUTÍVEIS — Pack 4
// Map Marker + Media Player + Drawing Stroke
// ============================================================

// --- MAP DATA ---
const MAP_MARKERS = [
  { id: 1, name: "Escritorio Central", lat: 340, lng: 420, color: "#4285f4", cat: "office", desc: "Sede principal - Av Paulista 1000", rating: 4.8 },
  { id: 2, name: "Coworking Alpha", lat: 280, lng: 320, color: "#34a853", cat: "cowork", desc: "Espaco compartilhado - Vila Madalena", rating: 4.5 },
  { id: 3, name: "Data Center SP1", lat: 410, lng: 500, color: "#ea4335", cat: "infra", desc: "Rack 12A - Uptime 99.99%", rating: 4.9 },
  { id: 4, name: "Cafe & Code", lat: 300, lng: 380, color: "#fbbc04", cat: "social", desc: "Melhor cafe da regiao", rating: 4.7 },
  { id: 5, name: "Lab de Inovacao", lat: 370, lng: 280, color: "#7c3aed", cat: "lab", desc: "P&D e prototipagem", rating: 4.6 },
  { id: 6, name: "Servidor Backup", lat: 220, lng: 500, color: "#ea4335", cat: "infra", desc: "Disaster recovery site", rating: 4.8 },
  { id: 7, name: "Hub Logistica", lat: 450, lng: 350, color: "#fb923c", cat: "ops", desc: "Centro de distribuicao", rating: 4.3 },
];

// --- MEDIA DATA ---
const PLAYLIST = [
  { id: 1, title: "Keynote - AI Agents 2026", artist: "TechConf", duration: 2847, type: "video", cover: "#4285f4" },
  { id: 2, title: "Deep Dive: Orchestration", artist: "DevPodcast", duration: 1923, type: "audio", cover: "#34a853" },
  { id: 3, title: "Workshop: Building DAGs", artist: "Hatchet Team", duration: 3612, type: "video", cover: "#7c3aed" },
  { id: 4, title: "Interview: Future of Work", artist: "TechRadar", duration: 1245, type: "audio", cover: "#ea4335" },
  { id: 5, title: "Tutorial: Temporal Basics", artist: "Temporal.io", duration: 2156, type: "video", cover: "#fbbc04" },
];

// --- DRAWING TOOLS ---
const DRAW_COLORS = ["#3c4043", "#ea4335", "#4285f4", "#34a853", "#fbbc04", "#7c3aed", "#fb923c", "#0ea5e9"];
const DRAW_SIZES = [2, 4, 8, 14, 24];

const fmtTime = (s) => { const m = Math.floor(s / 60); const sec = Math.floor(s % 60); return `${m}:${sec < 10 ? "0" + sec : sec}`; };

// ============================================================
// MAP
// ============================================================

function MapView() {
  const [markers, setMarkers] = useState(MAP_MARKERS);
  const [selected, setSelected] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [filter, setFilter] = useState(null);
  const [adding, setAdding] = useState(false);
  const mapRef = useRef(null);

  const cats = [...new Set(markers.map(m => m.cat))];
  const filtered = filter ? markers.filter(m => m.cat === filter) : markers;

  const handlePan = useCallback((e) => {
    if (e.target.closest("[data-marker]") || e.target.closest("[data-popup]")) return;
    setSelected(null);
    const sx = e.clientX, sy = e.clientY;
    const ox = offset.x, oy = offset.y;
    setDragging(true);
    const mm = (ev) => setOffset({ x: ox + ev.clientX - sx, y: oy + ev.clientY - sy });
    const mu = () => { window.removeEventListener("mousemove", mm); window.removeEventListener("mouseup", mu); setDragging(false); };
    window.addEventListener("mousemove", mm);
    window.addEventListener("mouseup", mu);
  }, [offset]);

  const handleWheel = (e) => {
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setZoom(z => Math.max(0.5, Math.min(3, z + delta)));
  };

  const handleMapClick = (e) => {
    if (!adding) return;
    const rect = mapRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left - offset.x) / zoom;
    const y = (e.clientY - rect.top - offset.y) / zoom;
    const newMarker = { id: Math.max(...markers.map(m => m.id)) + 1, name: "Novo local", lat: y, lng: x, color: DRAW_COLORS[Math.floor(Math.random() * 8)], cat: "custom", desc: "Clique pra editar", rating: 0 };
    setMarkers(p => [...p, newMarker]);
    setSelected(newMarker.id);
    setAdding(false);
  };

  const selMarker = markers.find(m => m.id === selected);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 16px", borderBottom: "1px solid #dadce0", background: "#fff" }}>
        <span style={{ fontSize: 14, fontWeight: "500" }}>Mapa Interativo</span>
        <div style={{ display: "flex", gap: 4, marginLeft: 12 }}>
          <span onClick={() => setFilter(null)} style={{ padding: "3px 10px", borderRadius: 12, fontSize: 10, cursor: "pointer", background: !filter ? "#e8f0fe" : "#f1f3f4", color: !filter ? "#4285f4" : "#5f6368", border: `1px solid ${!filter ? "#4285f4" : "#dadce0"}30` }}>Todos</span>
          {cats.map(c => (
            <span key={c} onClick={() => setFilter(filter === c ? null : c)} style={{ padding: "3px 10px", borderRadius: 12, fontSize: 10, cursor: "pointer", background: filter === c ? "#e8f0fe" : "#f1f3f4", color: filter === c ? "#4285f4" : "#5f6368", border: `1px solid ${filter === c ? "#4285f4" : "#dadce0"}30`, textTransform: "capitalize" }}>{c}</span>
          ))}
        </div>
        <div style={{ flex: 1 }} />
        <button onClick={() => setAdding(!adding)} style={{ padding: "4px 14px", borderRadius: 16, border: `1px solid ${adding ? "#ea4335" : "#dadce0"}`, background: adding ? "#fce8e6" : "#fff", color: adding ? "#ea4335" : "#5f6368", cursor: "pointer", fontFamily: "inherit", fontSize: 11 }}>
          {adding ? "Cancelar" : "+ Marcador"}
        </button>
        <div style={{ display: "flex", gap: 4 }}>
          <button onClick={() => setZoom(z => Math.min(3, z + 0.2))} style={{ width: 28, height: 28, borderRadius: 6, border: "1px solid #dadce0", background: "#fff", cursor: "pointer", fontSize: 14, color: "#3c4043" }}>+</button>
          <button onClick={() => setZoom(z => Math.max(0.5, z - 0.2))} style={{ width: 28, height: 28, borderRadius: 6, border: "1px solid #dadce0", background: "#fff", cursor: "pointer", fontSize: 14, color: "#3c4043" }}>-</button>
        </div>
        <span style={{ fontSize: 10, color: "#70757a" }}>{Math.round(zoom * 100)}%</span>
      </div>

      <div ref={mapRef} style={{ flex: 1, overflow: "hidden", position: "relative", cursor: adding ? "crosshair" : dragging ? "grabbing" : "grab", background: "#e8eaed" }}
        onMouseDown={adding ? undefined : handlePan} onWheel={handleWheel} onClick={adding ? handleMapClick : undefined}>
        <div style={{ transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`, transformOrigin: "0 0", position: "relative", width: 700, height: 600 }}>
          {/* Grid background */}
          <svg width="700" height="600" style={{ position: "absolute" }}>
            <defs>
              <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
                <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#dadce0" strokeWidth="0.5" />
              </pattern>
              <pattern id="gridLg" width="200" height="200" patternUnits="userSpaceOnUse">
                <path d="M 200 0 L 0 0 0 200" fill="none" stroke="#c0c0c0" strokeWidth="0.8" />
              </pattern>
            </defs>
            <rect width="700" height="600" fill="#f0f0f0" />
            <rect width="700" height="600" fill="url(#grid)" />
            <rect width="700" height="600" fill="url(#gridLg)" />
            {/* Simulated roads */}
            {[[100,0,100,600],[350,0,350,600],[0,150,700,150],[0,300,700,300],[0,450,700,450]].map(([x1,y1,x2,y2],i) => (
              <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#dadce0" strokeWidth="3" />
            ))}
            {/* Simulated blocks */}
            {[[130,30,190,110],[130,170,190,280],[380,30,200,110],[380,170,200,280],[380,320,200,110],[20,320,70,110],[130,470,190,110]].map(([x,y,w,h],i) => (
              <rect key={i} x={x} y={y} width={w} height={h} fill="#e0e0e0" rx="4" />
            ))}
          </svg>

          {/* Markers */}
          {filtered.map(m => (
            <div key={m.id} data-marker="1"
              onClick={e => { e.stopPropagation(); setSelected(selected === m.id ? null : m.id); }}
              style={{ position: "absolute", left: m.lng - 14, top: m.lat - 38, cursor: "pointer", zIndex: selected === m.id ? 20 : 5, transition: "transform 0.15s", transform: selected === m.id ? "scale(1.2)" : "scale(1)" }}>
              <svg width="28" height="40" viewBox="0 0 28 40">
                <path d="M14 0C6.27 0 0 6.27 0 14c0 10.5 14 26 14 26s14-15.5 14-26C28 6.27 21.73 0 14 0z" fill={m.color} />
                <circle cx="14" cy="14" r="6" fill="#fff" />
              </svg>
              {selected === m.id && (
                <div data-popup="1" onClick={e => e.stopPropagation()} style={{
                  position: "absolute", bottom: 48, left: "50%", transform: "translateX(-50%)",
                  background: "#fff", borderRadius: 12, padding: 16, width: 220,
                  boxShadow: "0 4px 20px rgba(0,0,0,0.15)", zIndex: 30, whiteSpace: "normal",
                }}>
                  <div style={{ fontSize: 14, fontWeight: "500", color: "#3c4043", marginBottom: 4 }}>{m.name}</div>
                  <div style={{ fontSize: 11, color: "#70757a", marginBottom: 6 }}>{m.desc}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11 }}>
                    <span style={{ padding: "2px 8px", borderRadius: 8, background: m.color + "18", color: m.color, fontSize: 10 }}>{m.cat}</span>
                    <span style={{ color: "#fbbc04" }}>{"*".repeat(Math.round(m.rating))}</span>
                    <span style={{ color: "#70757a" }}>{m.rating}</span>
                  </div>
                  <div style={{ position: "absolute", bottom: -6, left: "50%", transform: "translateX(-50%) rotate(45deg)", width: 12, height: 12, background: "#fff" }} />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// MEDIA PLAYER
// ============================================================

function MediaPlayer() {
  const [playlist] = useState(PLAYLIST);
  const [current, setCurrent] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(75);
  const [showVol, setShowVol] = useState(false);
  const [repeat, setRepeat] = useState(false);
  const [shuffle, setShuffle] = useState(false);
  const timerRef = useRef(null);

  const track = playlist[current];

  useEffect(() => {
    if (playing) {
      timerRef.current = setInterval(() => {
        setProgress(p => {
          if (p >= track.duration) {
            if (repeat) return 0;
            if (current < playlist.length - 1) { setCurrent(c => c + 1); return 0; }
            setPlaying(false); return track.duration;
          }
          return p + 1;
        });
      }, 100); // 10x speed for demo
    }
    return () => clearInterval(timerRef.current);
  }, [playing, current, repeat, track.duration]);

  const seekTo = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    setProgress(Math.floor(pct * track.duration));
  };

  const next = () => { setCurrent(c => (shuffle ? Math.floor(Math.random() * playlist.length) : Math.min(playlist.length - 1, c + 1))); setProgress(0); };
  const prev = () => { if (progress > 5) { setProgress(0); } else { setCurrent(c => Math.max(0, c - 1)); setProgress(0); } };

  const pct = track.duration ? (progress / track.duration) * 100 : 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "#0c0c0e" }}>
      {/* Visualization area */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden" }}>
        {/* Background gradient */}
        <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse at center, ${track.cover}22, #0c0c0e)`, transition: "background 0.5s" }} />

        {/* Album art */}
        <div style={{
          width: 240, height: 240, borderRadius: track.type === "audio" ? "50%" : 16,
          background: `linear-gradient(135deg, ${track.cover}44, ${track.cover}22)`,
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: `0 20px 60px ${track.cover}33`,
          animation: playing && track.type === "audio" ? "spin 8s linear infinite" : "none",
          transition: "border-radius 0.3s",
          position: "relative",
        }}>
          <span style={{ fontSize: 64, opacity: 0.5 }}>{track.type === "video" ? "▶" : "♪"}</span>
          {track.type === "video" && !playing && (
            <div onClick={() => setPlaying(true)} style={{
              position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
              background: "rgba(0,0,0,0.3)", borderRadius: 16, cursor: "pointer",
            }}>
              <div style={{ width: 60, height: 60, borderRadius: "50%", background: "rgba(255,255,255,0.9)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontSize: 24, color: "#3c4043", marginLeft: 4 }}>▶</span>
              </div>
            </div>
          )}
        </div>

        {/* Track info overlay */}
        <div style={{ position: "absolute", bottom: 100, textAlign: "center" }}>
          <div style={{ fontSize: 20, fontWeight: "600", color: "#fff", marginBottom: 4 }}>{track.title}</div>
          <div style={{ fontSize: 13, color: "#a1a1aa" }}>{track.artist}</div>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ padding: "0 24px" }}>
        <div onClick={seekTo} style={{ height: 6, background: "#27272a", borderRadius: 3, cursor: "pointer", position: "relative", marginBottom: 8 }}>
          <div style={{ height: "100%", width: `${pct}%`, background: track.cover, borderRadius: 3, transition: "width 0.1s" }} />
          <div style={{ position: "absolute", top: -4, left: `${pct}%`, transform: "translateX(-50%)", width: 14, height: 14, borderRadius: "50%", background: "#fff", boxShadow: "0 1px 4px rgba(0,0,0,0.3)", opacity: 0, transition: "opacity 0.2s" }}
            onMouseEnter={e => { e.target.style.opacity = "1"; }} onMouseLeave={e => { e.target.style.opacity = "0"; }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#71717a" }}>
          <span>{fmtTime(progress)}</span>
          <span>{fmtTime(track.duration)}</span>
        </div>
      </div>

      {/* Controls */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 20, padding: "16px 24px" }}>
        <button onClick={() => setShuffle(!shuffle)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 16, color: shuffle ? track.cover : "#71717a", padding: 8 }} title="Shuffle">
          &#8646;
        </button>
        <button onClick={prev} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, color: "#e4e4e7", padding: 8 }}>
          &#9198;
        </button>
        <button onClick={() => setPlaying(!playing)} style={{
          width: 52, height: 52, borderRadius: "50%", background: "#fff", border: "none",
          cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
        }}>
          <span style={{ fontSize: 22, color: "#3c4043", marginLeft: playing ? 0 : 3 }}>{playing ? "❚❚" : "▶"}</span>
        </button>
        <button onClick={next} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, color: "#e4e4e7", padding: 8 }}>
          &#9197;
        </button>
        <button onClick={() => setRepeat(!repeat)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 14, color: repeat ? track.cover : "#71717a", padding: 8 }} title="Repeat">
          &#8634;
        </button>
      </div>

      {/* Volume */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "0 24px 12px" }}>
        <button onClick={() => setVolume(v => v === 0 ? 75 : 0)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 14, color: "#71717a" }}>
          {volume === 0 ? "🔇" : volume < 50 ? "🔉" : "🔊"}
        </button>
        <input type="range" min="0" max="100" value={volume} onChange={e => setVolume(Number(e.target.value))}
          style={{ width: 120, accentColor: track.cover }} />
        <span style={{ fontSize: 10, color: "#52525b", width: 30 }}>{volume}%</span>
      </div>

      {/* Playlist */}
      <div style={{ borderTop: "1px solid #27272a", overflow: "auto", maxHeight: 200 }}>
        {playlist.map((t, i) => (
          <div key={t.id} onClick={() => { setCurrent(i); setProgress(0); setPlaying(true); }}
            style={{
              display: "flex", alignItems: "center", gap: 12, padding: "10px 24px",
              background: i === current ? "#18181b" : "transparent", cursor: "pointer",
              borderBottom: "1px solid #1a1a1c", transition: "background 0.1s",
            }}
            onMouseEnter={e => { if (i !== current) e.currentTarget.style.background = "#18181b"; }}
            onMouseLeave={e => { if (i !== current) e.currentTarget.style.background = "transparent"; }}>
            <div style={{ width: 36, height: 36, borderRadius: t.type === "audio" ? "50%" : 6, background: t.cover + "33", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, color: t.cover, flexShrink: 0 }}>
              {i === current && playing ? "▮▮" : t.type === "video" ? "▶" : "♪"}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: i === current ? "600" : "400", color: i === current ? "#fff" : "#e4e4e7", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{t.title}</div>
              <div style={{ fontSize: 10, color: "#71717a" }}>{t.artist}</div>
            </div>
            <span style={{ fontSize: 10, color: "#52525b" }}>{fmtTime(t.duration)}</span>
            <span style={{ padding: "2px 6px", borderRadius: 4, fontSize: 9, background: t.type === "video" ? "#4285f418" : "#34a85318", color: t.type === "video" ? "#4285f4" : "#34a853" }}>{t.type}</span>
          </div>
        ))}
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ============================================================
// DRAWING CANVAS
// ============================================================

function DrawingCanvas() {
  const canvasRef = useRef(null);
  const [tool, setTool] = useState("pen");
  const [color, setColor] = useState("#3c4043");
  const [size, setSize] = useState(4);
  const [strokes, setStrokes] = useState([]);
  const [currentStroke, setCurrentStroke] = useState(null);
  const [history, setHistory] = useState([]);

  const getPos = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const handleDown = (e) => {
    const pos = getPos(e);
    if (tool === "eraser") {
      // Find and remove stroke near click
      setStrokes(prev => {
        const idx = prev.findIndex(s => s.points.some(p => Math.abs(p.x - pos.x) < 12 && Math.abs(p.y - pos.y) < 12));
        if (idx >= 0) { setHistory(h => [...h, prev]); return prev.filter((_, i) => i !== idx); }
        return prev;
      });
      return;
    }
    setCurrentStroke({ color: tool === "highlighter" ? color + "55" : color, size: tool === "highlighter" ? size * 3 : size, points: [pos], tool });

    const mm = (ev) => {
      const p = getPos(ev);
      setCurrentStroke(prev => prev ? { ...prev, points: [...prev.points, p] } : null);
    };
    const mu = () => {
      window.removeEventListener("mousemove", mm);
      window.removeEventListener("mouseup", mu);
      setCurrentStroke(prev => {
        if (prev && prev.points.length > 1) {
          setHistory(h => [...h, strokes]);
          setStrokes(s => [...s, prev]);
        }
        return null;
      });
    };
    window.addEventListener("mousemove", mm);
    window.addEventListener("mouseup", mu);
  };

  const undo = () => {
    if (history.length) {
      setStrokes(history[history.length - 1]);
      setHistory(h => h.slice(0, -1));
    }
  };

  const clear = () => {
    setHistory(h => [...h, strokes]);
    setStrokes([]);
  };

  const renderStroke = (stroke, key) => {
    if (stroke.points.length < 2) return null;
    let d = `M${stroke.points[0].x},${stroke.points[0].y}`;
    for (let i = 1; i < stroke.points.length; i++) {
      const p0 = stroke.points[i - 1];
      const p1 = stroke.points[i];
      const mx = (p0.x + p1.x) / 2;
      const my = (p0.y + p1.y) / 2;
      d += ` Q${p0.x},${p0.y} ${mx},${my}`;
    }
    const last = stroke.points[stroke.points.length - 1];
    d += ` L${last.x},${last.y}`;
    return <path key={key} d={d} fill="none" stroke={stroke.color} strokeWidth={stroke.size} strokeLinecap="round" strokeLinejoin="round" />;
  };

  const TOOLS = [
    { id: "pen", icon: "✎", label: "Caneta" },
    { id: "highlighter", icon: "▬", label: "Marcador" },
    { id: "eraser", icon: "◻", label: "Borracha" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Toolbar */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 16px", borderBottom: "1px solid #dadce0", background: "#fff", flexWrap: "wrap" }}>
        {/* Tools */}
        <div style={{ display: "flex", gap: 4, borderRadius: 8, overflow: "hidden", border: "1px solid #dadce0" }}>
          {TOOLS.map(t => (
            <button key={t.id} onClick={() => setTool(t.id)} title={t.label}
              style={{ padding: "6px 14px", background: tool === t.id ? "#e8f0fe" : "#fff", color: tool === t.id ? "#4285f4" : "#5f6368", border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: 13, fontWeight: tool === t.id ? "500" : "400" }}>
              {t.icon}
            </button>
          ))}
        </div>

        <div style={{ width: 1, height: 24, background: "#dadce0" }} />

        {/* Colors */}
        <div style={{ display: "flex", gap: 4 }}>
          {DRAW_COLORS.map(c => (
            <div key={c} onClick={() => setColor(c)} style={{
              width: 24, height: 24, borderRadius: "50%", background: c, cursor: "pointer",
              border: color === c ? "3px solid #4285f4" : "3px solid transparent",
              boxShadow: color === c ? "0 0 0 1px #fff" : "none",
            }} />
          ))}
        </div>

        <div style={{ width: 1, height: 24, background: "#dadce0" }} />

        {/* Sizes */}
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          {DRAW_SIZES.map(s => (
            <div key={s} onClick={() => setSize(s)} style={{
              width: Math.max(s + 8, 20), height: Math.max(s + 8, 20),
              borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", border: size === s ? "2px solid #4285f4" : "2px solid transparent",
            }}>
              <div style={{ width: s, height: s, borderRadius: "50%", background: color }} />
            </div>
          ))}
        </div>

        <div style={{ flex: 1 }} />

        <button onClick={undo} disabled={!history.length} style={{ padding: "4px 12px", borderRadius: 6, border: "1px solid #dadce0", background: "#fff", color: history.length ? "#3c4043" : "#dadce0", cursor: history.length ? "pointer" : "default", fontFamily: "inherit", fontSize: 11 }}>Desfazer</button>
        <button onClick={clear} style={{ padding: "4px 12px", borderRadius: 6, border: "1px solid #dadce0", background: "#fff", color: "#5f6368", cursor: "pointer", fontFamily: "inherit", fontSize: 11 }}>Limpar</button>
        <span style={{ fontSize: 10, color: "#70757a" }}>{strokes.length} tracos</span>
      </div>

      {/* Canvas */}
      <div ref={canvasRef} onMouseDown={handleDown}
        style={{ flex: 1, cursor: tool === "eraser" ? "crosshair" : "crosshair", background: "#fff", position: "relative", overflow: "hidden" }}>
        <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
          {/* Grid dots */}
          <defs>
            <pattern id="dots" width="24" height="24" patternUnits="userSpaceOnUse">
              <circle cx="12" cy="12" r="0.8" fill="#dadce0" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#dots)" />

          {strokes.map((s, i) => renderStroke(s, i))}
          {currentStroke && renderStroke(currentStroke, "current")}
        </svg>
      </div>
    </div>
  );
}

// ============================================================
// MAIN
// ============================================================

export default function App() {
  const [active, setActive] = useState("map");

  return (
    <div style={{ fontFamily: "'Google Sans','Roboto',sans-serif", background: "#fff", color: "#3c4043", height: "100vh", display: "flex", flexDirection: "column", fontSize: 14 }}>
      <div style={{ display: "flex", alignItems: "center", padding: "8px 16px", borderBottom: "1px solid #dadce0" }}>
        <span style={{ fontSize: 18, display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ color: "#ea4335", fontSize: 22 }}>&#9672;</span> Primitivos
          <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 10, background: "#fce8e6", color: "#c5221f" }}>Pack 4</span>
        </span>
        <div style={{ flex: 1 }} />
        <div style={{ display: "flex", borderRadius: 20, overflow: "hidden", border: "1px solid #dadce0" }}>
          {[
            { id: "map", label: "Map" },
            { id: "player", label: "Player" },
            { id: "draw", label: "Drawing" },
          ].map(t => (
            <button key={t.id} onClick={() => setActive(t.id)} style={{
              padding: "6px 16px", background: active === t.id ? "#fce8e6" : "#fff",
              color: active === t.id ? "#c5221f" : "#5f6368", border: "none", cursor: "pointer",
              fontFamily: "inherit", fontSize: 13, fontWeight: active === t.id ? "500" : "400",
            }}>{t.label}</button>
          ))}
        </div>
      </div>
      <div style={{ flex: 1, overflow: "hidden" }}>
        {active === "map" && <MapView />}
        {active === "player" && <MediaPlayer />}
        {active === "draw" && <DrawingCanvas />}
      </div>
    </div>
  );
}
