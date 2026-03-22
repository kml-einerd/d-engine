import { useState, useEffect, useRef, useCallback, useMemo } from "react";

// ============================================================
// AGENT FLOW SIMULATOR — Advanced Real-time Execution
// Terminal, Image Gen, Connectors, Animated Pipeline
// ============================================================

// --- AGENT NODES ---
const AGENTS = {
  trigger: { icon: "⚡", label: "Trigger", color: "#0f0", type: "trigger" },
  llm: { icon: "🧠", label: "LLM Agent", color: "#a78bfa", type: "process" },
  vision: { icon: "👁", label: "Vision AI", color: "#f472b6", type: "process" },
  imagegen: { icon: "🎨", label: "Image Gen", color: "#fb923c", type: "output" },
  code: { icon: "💻", label: "Code Exec", color: "#22d3ee", type: "process" },
  router: { icon: "⑂", label: "Router", color: "#fbbf24", type: "logic" },
  wait: { icon: "⏳", label: "Wait/Delay", color: "#888", type: "logic" },
  youtube: { icon: "▶", label: "YouTube API", color: "#f00", type: "connector" },
  supabase: { icon: "⬡", label: "Supabase", color: "#3ecf8e", type: "connector" },
  web: { icon: "🌐", label: "Web Scraper", color: "#60a5fa", type: "connector" },
  email: { icon: "✉", label: "Email Send", color: "#c084fc", type: "output" },
  storage: { icon: "📦", label: "Storage", color: "#f59e0b", type: "connector" },
  output: { icon: "📤", label: "Final Output", color: "#0f0", type: "output" },
};

// --- FLOW DEFINITION ---
// --- AUTO LAYOUT: prevents overlapping ---
const NODE_W = 160;
const NODE_H = 100;
const PAD_X = 60;
const PAD_Y = 30;

function autoLayout(nodes, edges) {
  // Build adjacency and compute layers (BFS from roots)
  const inDeg = {};
  const children = {};
  nodes.forEach(n => { inDeg[n.id] = 0; children[n.id] = []; });
  edges.forEach(e => { inDeg[e.to] = (inDeg[e.to] || 0) + 1; children[e.from] = [...(children[e.from] || []), e.to]; });

  // Topological layers
  const layers = [];
  const layerOf = {};
  let queue = nodes.filter(n => inDeg[n.id] === 0).map(n => n.id);
  let visited = new Set();

  while (queue.length) {
    layers.push([...queue]);
    queue.forEach(id => { visited.add(id); layerOf[id] = layers.length - 1; });
    const next = [];
    queue.forEach(id => {
      (children[id] || []).forEach(cid => {
        if (!visited.has(cid) && !next.includes(cid)) {
          // Only add if all parents are visited
          const allParentsVisited = edges.filter(e => e.to === cid).every(e => visited.has(e.from));
          if (allParentsVisited) next.push(cid);
        }
      });
    });
    queue = next;
    if (layers.length > 20) break; // safety
  }

  // Assign any unplaced nodes
  nodes.forEach(n => {
    if (layerOf[n.id] === undefined) {
      layers.push([n.id]);
      layerOf[n.id] = layers.length - 1;
    }
  });

  // Position: each layer is a column, nodes stacked vertically with padding
  const positioned = {};
  const startX = 50;
  const colWidth = NODE_W + PAD_X;

  layers.forEach((layer, col) => {
    const totalH = layer.length * NODE_H + (layer.length - 1) * PAD_Y;
    const startY = Math.max(30, (500 - totalH) / 2); // center vertically in ~500px
    layer.forEach((id, row) => {
      positioned[id] = {
        x: startX + col * colWidth,
        y: startY + row * (NODE_H + PAD_Y),
      };
    });
  });

  return nodes.map(n => ({ ...n, ...positioned[n.id] }));
}

const FLOW_NODES_RAW = [
  { id: "n1", agent: "trigger", config: { event: "HTTP POST /api/generate", schedule: null } },
  { id: "n2", agent: "web", config: { url: "https://techcrunch.com/feed", mode: "RSS Parse" } },
  { id: "n3", agent: "youtube", config: { action: "Search Videos", query: "AI agents 2026", maxResults: 5 } },
  { id: "n4", agent: "supabase", config: { table: "content_queue", action: "SELECT * WHERE status='pending'" } },
  { id: "n5", agent: "llm", config: { model: "claude-opus-4", prompt: "Analyze and summarize content...", temperature: 0.3 } },
  { id: "n6", agent: "router", config: { condition: "if content.type === 'visual'" } },
  { id: "n7", agent: "imagegen", config: { model: "DALL-E 3", size: "1024x1024", style: "digital art" } },
  { id: "n8", agent: "code", config: { runtime: "Node.js 20", script: "transform.js", timeout: 30 } },
  { id: "n9", agent: "wait", config: { delay: "2s", reason: "Rate limit cooldown" } },
  { id: "n10", agent: "llm", config: { model: "claude-sonnet-4", prompt: "Generate social media posts...", temperature: 0.7 } },
  { id: "n11", agent: "storage", config: { bucket: "generated-content", path: "/outputs/{date}/" } },
  { id: "n12", agent: "supabase", config: { table: "posts", action: "INSERT", fields: "title,body,image_url,platform" } },
  { id: "n13", agent: "email", config: { to: "team@company.com", subject: "Content Generated", template: "daily-report" } },
  { id: "n14", agent: "output", config: { format: "JSON", webhook: "https://api.company.com/callback" } },
];

const FLOW_EDGES = [
  { from: "n1", to: "n2" }, { from: "n1", to: "n3" }, { from: "n1", to: "n4" },
  { from: "n2", to: "n5" }, { from: "n3", to: "n5" }, { from: "n4", to: "n5" },
  { from: "n5", to: "n6" },
  { from: "n6", to: "n7", label: "visual" }, { from: "n6", to: "n8", label: "text" }, { from: "n6", to: "n9", label: "rate limited" },
  { from: "n7", to: "n10" }, { from: "n8", to: "n10" }, { from: "n9", to: "n8" },
  { from: "n10", to: "n11" }, { from: "n10", to: "n12" },
  { from: "n11", to: "n13" }, { from: "n12", to: "n14" }, { from: "n13", to: "n14" },
];

const FLOW_NODES = autoLayout(FLOW_NODES_RAW, FLOW_EDGES);

// --- EXECUTION SIMULATION ---
const EXEC_SEQUENCE = [
  { nodeId: "n1", duration: 800, logs: [
    { t: 0, msg: "► Trigger received: HTTP POST /api/generate", type: "info" },
    { t: 200, msg: "  payload: { topic: 'AI agents', platforms: ['twitter','linkedin'] }", type: "data" },
    { t: 400, msg: "  Dispatching to 3 parallel connectors...", type: "info" },
  ]},
  { nodeId: "n2", duration: 2200, logs: [
    { t: 0, msg: "🌐 Fetching https://techcrunch.com/feed", type: "info" },
    { t: 400, msg: "  HTTP 200 OK (342ms)", type: "success" },
    { t: 800, msg: "  Parsing RSS... 24 entries found", type: "data" },
    { t: 1200, msg: "  Filtering by relevance: 6 articles match", type: "data" },
    { t: 1600, msg: '  Top: "OpenAI launches Agent SDK" (score: 0.94)', type: "data" },
    { t: 1900, msg: "  ✓ Output: 6 articles extracted", type: "success" },
  ]},
  { nodeId: "n3", duration: 2000, parallel: "n2", logs: [
    { t: 0, msg: "▶ YouTube Data API v3", type: "info" },
    { t: 300, msg: '  Search: "AI agents 2026" (maxResults=5)', type: "data" },
    { t: 800, msg: "  HTTP 200 OK (512ms)", type: "success" },
    { t: 1200, msg: "  Found 5 videos, fetching metadata...", type: "data" },
    { t: 1600, msg: '  Top: "Building AI Agent Swarms" (1.2M views)', type: "data" },
    { t: 1800, msg: "  ✓ Output: 5 videos with transcripts", type: "success" },
  ]},
  { nodeId: "n4", duration: 1500, parallel: "n2", logs: [
    { t: 0, msg: "⬡ Supabase: content_queue", type: "info" },
    { t: 300, msg: "  SELECT * FROM content_queue WHERE status='pending'", type: "data" },
    { t: 600, msg: "  Connected to db (pool: 4/10 active)", type: "success" },
    { t: 900, msg: "  3 rows returned (12ms)", type: "data" },
    { t: 1200, msg: "  ✓ Output: 3 queued items", type: "success" },
  ]},
  { nodeId: "n5", duration: 4000, logs: [
    { t: 0, msg: "🧠 claude-opus-4 (temp=0.3)", type: "info" },
    { t: 300, msg: "  Context: 14 sources (6 articles + 5 videos + 3 queue)", type: "data" },
    { t: 600, msg: "  Input tokens: 12,847", type: "data" },
    { t: 1000, msg: "  Analyzing content relevance...", type: "info" },
    { t: 1800, msg: "  Generating structured summary...", type: "info" },
    { t: 2500, msg: "  Cross-referencing sources...", type: "info" },
    { t: 3200, msg: "  Output tokens: 2,341", type: "data" },
    { t: 3600, msg: "  ✓ Generated: 3 content briefs + 1 trend report", type: "success" },
  ]},
  { nodeId: "n6", duration: 500, logs: [
    { t: 0, msg: "⑂ Router evaluating conditions...", type: "info" },
    { t: 200, msg: "  content[0].type = 'visual' → imagegen", type: "data" },
    { t: 300, msg: "  content[1].type = 'text' → code_exec", type: "data" },
    { t: 400, msg: "  ✓ Routed 2 items to 2 paths", type: "success" },
  ]},
  { nodeId: "n7", duration: 6000, logs: [
    { t: 0, msg: "🎨 DALL-E 3 (1024x1024, digital art)", type: "info" },
    { t: 500, msg: '  Prompt: "Futuristic AI agent network, neon connections..."', type: "data" },
    { t: 1500, msg: "  Generating image...", type: "info" },
    { t: 3000, msg: "  ████████████░░░░░░ 65%", type: "info" },
    { t: 4500, msg: "  ██████████████████ 100%", type: "success" },
    { t: 5200, msg: "  Resolution: 1024x1024, Size: 2.1MB", type: "data" },
    { t: 5700, msg: "  ✓ Image saved: /tmp/gen_a8f2c1.png", type: "success" },
  ], hasImage: true },
  { nodeId: "n8", duration: 3000, parallel: "n7", logs: [
    { t: 0, msg: "💻 Node.js 20 — transform.js", type: "info" },
    { t: 300, msg: "  > Loading content briefs...", type: "data" },
    { t: 600, msg: "  > const posts = briefs.map(formatForPlatform)", type: "code" },
    { t: 1000, msg: "  > posts.forEach(p => validateLength(p))", type: "code" },
    { t: 1400, msg: "  > Twitter: 3 threads generated (280 char/tweet)", type: "data" },
    { t: 1800, msg: "  > LinkedIn: 2 articles formatted (1200 words each)", type: "data" },
    { t: 2200, msg: "  > addHashtags(posts, trending=['#AI', '#Agents'])", type: "code" },
    { t: 2600, msg: "  exit code: 0 (2.4s)", type: "success" },
    { t: 2800, msg: "  ✓ Output: 5 formatted posts", type: "success" },
  ]},
  { nodeId: "n10", duration: 3500, logs: [
    { t: 0, msg: "🧠 claude-sonnet-4 (temp=0.7)", type: "info" },
    { t: 400, msg: "  Polishing social media copy...", type: "info" },
    { t: 1000, msg: "  Adding platform-specific formatting...", type: "info" },
    { t: 1800, msg: "  Generating alt-text for images...", type: "info" },
    { t: 2500, msg: "  Quality score: 0.92/1.0", type: "data" },
    { t: 3000, msg: "  ✓ Final: 5 posts + 3 images ready", type: "success" },
  ]},
  { nodeId: "n11", duration: 1200, logs: [
    { t: 0, msg: "📦 Storage: generated-content", type: "info" },
    { t: 300, msg: "  Uploading to /outputs/2026-03-22/", type: "data" },
    { t: 600, msg: "  3 images (6.2MB) + 5 text files (24KB)", type: "data" },
    { t: 900, msg: "  CDN propagation: ~2s", type: "info" },
    { t: 1100, msg: "  ✓ All files uploaded", type: "success" },
  ]},
  { nodeId: "n12", duration: 1000, parallel: "n11", logs: [
    { t: 0, msg: "⬡ Supabase: INSERT INTO posts", type: "info" },
    { t: 300, msg: "  5 rows inserted (8ms)", type: "success" },
    { t: 600, msg: "  Trigger: notify_slack() fired", type: "data" },
    { t: 800, msg: "  ✓ Database updated", type: "success" },
  ]},
  { nodeId: "n13", duration: 1500, logs: [
    { t: 0, msg: "✉ Sending daily-report email", type: "info" },
    { t: 400, msg: "  To: team@company.com", type: "data" },
    { t: 700, msg: "  Template: daily-report (3 sections)", type: "data" },
    { t: 1000, msg: "  SMTP 250 OK", type: "success" },
    { t: 1200, msg: "  ✓ Email delivered", type: "success" },
  ]},
  { nodeId: "n14", duration: 800, logs: [
    { t: 0, msg: "📤 Preparing final output", type: "info" },
    { t: 200, msg: "  Aggregating results from all branches...", type: "data" },
    { t: 400, msg: "  POST https://api.company.com/callback", type: "data" },
    { t: 600, msg: "  HTTP 200 OK", type: "success" },
    { t: 700, msg: "  ✓ Flow complete! 5 posts, 3 images, 1 report", type: "success" },
  ]},
];

// --- STYLES ---
const S = {
  root: { fontFamily: "'IBM Plex Mono','Courier New',monospace", background: "#08080a", color: "#e0e0e0", height: "100vh", display: "flex", flexDirection: "column", fontSize: 12, overflow: "hidden" },
  top: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 16px", borderBottom: "1px solid #1a1a1a", background: "#0c0c0e" },
  logo: { fontSize: 14, fontWeight: "bold", color: "#0f0", display: "flex", alignItems: "center", gap: 8 },
  badge: { fontSize: 9, padding: "2px 8px", borderRadius: 8, border: "1px solid" },
  tabs: { display: "flex", gap: 0, background: "#111", borderBottom: "1px solid #1a1a1a" },
  tab: (a) => ({ padding: "8px 20px", background: a ? "#1a1a1a" : "transparent", color: a ? "#fff" : "#666", border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: 11, borderBottom: a ? "2px solid #0f0" : "2px solid transparent" }),
  main: { display: "flex", flex: 1, overflow: "hidden" },
  canvas: { flex: 1, overflow: "auto", position: "relative", background: "#0a0a0c" },
  canvasInner: { position: "relative", minWidth: 1500, minHeight: 500, backgroundImage: "radial-gradient(circle, #151515 1px, transparent 1px)", backgroundSize: "20px 20px" },
  // Nodes
  node: (color, status) => ({
    position: "absolute", width: 160, background: status === "running" ? "#1a1a1a" : status === "done" ? "#121212" : "#111",
    border: `2px solid ${status === "running" ? color : status === "done" ? color + "66" : "#222"}`,
    borderRadius: 10, overflow: "hidden", transition: "all 0.3s",
    boxShadow: status === "running" ? `0 0 20px ${color}33, inset 0 0 20px ${color}08` : status === "done" ? `0 0 8px ${color}11` : "none",
    opacity: status === "idle" ? 0.45 : 1,
  }),
  nodeHead: (color, status) => ({
    padding: "8px 10px", display: "flex", alignItems: "center", gap: 6,
    borderBottom: `1px solid ${status === "running" ? color + "33" : "#1a1a1a"}`,
    background: status === "running" ? color + "0a" : "transparent",
  }),
  nodeIcon: { fontSize: 16 },
  nodeName: { fontSize: 11, fontWeight: "bold", flex: 1 },
  nodeStatus: (color, status) => ({
    width: 8, height: 8, borderRadius: "50%",
    background: status === "running" ? color : status === "done" ? color + "88" : "#333",
    boxShadow: status === "running" ? `0 0 6px ${color}` : "none",
    animation: status === "running" ? "pulse 1.2s infinite" : "none",
  }),
  nodeBody: { padding: "6px 10px", fontSize: 9, color: "#666", lineHeight: 1.5 },
  nodeTime: (color) => ({ padding: "4px 10px", fontSize: 9, color: color, borderTop: "1px solid #1a1a1a", textAlign: "right" }),
  // Right panel
  panel: { width: 380, borderLeft: "1px solid #1a1a1a", display: "flex", flexDirection: "column", background: "#0c0c0e" },
  panelTabs: { display: "flex", borderBottom: "1px solid #1a1a1a" },
  panelTab: (a) => ({ flex: 1, padding: "8px", textAlign: "center", background: a ? "#151515" : "transparent", color: a ? "#fff" : "#555", border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: 10, borderBottom: a ? "2px solid #0f0" : "2px solid transparent" }),
  terminal: { flex: 1, overflow: "auto", padding: 12, background: "#0a0a0a", fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, lineHeight: 1.7 },
  logLine: (type) => ({
    color: type === "success" ? "#0c6" : type === "error" ? "#f44" : type === "data" ? "#0af" : type === "code" ? "#fa0" : "#888",
    whiteSpace: "pre-wrap", wordBreak: "break-all",
  }),
  logTime: { color: "#333", marginRight: 8, fontSize: 9 },
  // Image preview
  imgPreview: { padding: 12, display: "flex", flexDirection: "column", gap: 12, overflow: "auto" },
  imgCard: { background: "#151515", borderRadius: 8, overflow: "hidden", border: "1px solid #222" },
  imgPlaceholder: { height: 180, display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden" },
  imgMeta: { padding: "10px 12px", fontSize: 10 },
  // Stats
  statsBar: { display: "flex", gap: 8, padding: "8px 16px", borderTop: "1px solid #1a1a1a", background: "#0c0c0e" },
  stat: { fontSize: 10, color: "#555", display: "flex", alignItems: "center", gap: 4 },
  statDot: (c) => ({ width: 6, height: 6, borderRadius: "50%", background: c }),
  // Progress
  progress: { height: 3, background: "#1a1a1a", borderRadius: 2, overflow: "hidden" },
  progressFill: (pct, color) => ({ height: "100%", width: `${pct}%`, background: color || "#0f0", transition: "width 0.3s", borderRadius: 2 }),
  // Config panel
  configPanel: { padding: 12, overflow: "auto", flex: 1 },
  configLabel: { fontSize: 9, color: "#555", textTransform: "uppercase", letterSpacing: 1, marginBottom: 3, marginTop: 10 },
  configVal: { fontSize: 11, color: "#ccc", padding: "4px 8px", background: "#1a1a1a", borderRadius: 4, marginBottom: 4 },
};

// --- EDGE DRAWING ---
function Edges({ nodes, edges, activeNodes }) {
  return (
    <svg style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none" }}>
      <defs>
        <marker id="arrow" viewBox="0 0 10 6" refX="10" refY="3" markerWidth="8" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 0 L 10 3 L 0 6 z" fill="#333" />
        </marker>
        <marker id="arrowActive" viewBox="0 0 10 6" refX="10" refY="3" markerWidth="8" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 0 L 10 3 L 0 6 z" fill="#0f0" />
        </marker>
      </defs>
      {edges.map((e, i) => {
        const from = nodes.find(n => n.id === e.from);
        const to = nodes.find(n => n.id === e.to);
        if (!from || !to) return null;
        const x1 = from.x + NODE_W, y1 = from.y + 36;
        const x2 = to.x, y2 = to.y + 36;
        const mx = (x1 + x2) / 2;
        const isActive = activeNodes.includes(e.from) && activeNodes.includes(e.to);
        const isDone = activeNodes.includes(e.to);
        return (
          <g key={i}>
            <path d={`M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}`}
              fill="none" stroke={isActive ? "#0f088" : isDone ? "#0f033" : "#222"} strokeWidth={isActive ? 2.5 : 1.5}
              markerEnd={isActive ? "url(#arrowActive)" : "url(#arrow)"} />
            {isActive && <path d={`M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}`}
              fill="none" stroke="#0f0" strokeWidth={1} strokeDasharray="6 8" opacity={0.6}>
              <animate attributeName="stroke-dashoffset" from="0" to="-28" dur="1s" repeatCount="indefinite" />
            </path>}
            {e.label && <text x={mx} y={Math.min(y1, y2) - 6} fill={isDone ? "#555" : "#333"} fontSize={8} textAnchor="middle" fontFamily="inherit">{e.label}</text>}
          </g>
        );
      })}
    </svg>
  );
}

// --- GENERATED IMAGE COMPONENT ---
function GenImage({ generating, done }) {
  return (
    <div style={{ ...S.imgPlaceholder, background: done ? "linear-gradient(135deg, #1a0a2e, #0a1628, #0a2818)" : "#111" }}>
      {generating && !done && (
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 32, marginBottom: 8, animation: "pulse 1.5s infinite" }}>🎨</div>
          <div style={{ fontSize: 10, color: "#888" }}>Generating...</div>
          <div style={{ width: 120, height: 3, background: "#222", borderRadius: 2, marginTop: 8, overflow: "hidden" }}>
            <div style={{ height: "100%", background: "#fb923c", borderRadius: 2, animation: "progress 3s ease-in-out infinite" }} />
          </div>
        </div>
      )}
      {done && (<>
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, #a78bfa22, #f472b611, #22d3ee11)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="160" height="160" viewBox="0 0 160 160">
            <defs>
              <radialGradient id="glow1" cx="50%" cy="50%"><stop offset="0%" stopColor="#a78bfa" stopOpacity="0.3"/><stop offset="100%" stopColor="transparent"/></radialGradient>
              <radialGradient id="glow2" cx="30%" cy="70%"><stop offset="0%" stopColor="#22d3ee" stopOpacity="0.2"/><stop offset="100%" stopColor="transparent"/></radialGradient>
            </defs>
            <circle cx="80" cy="80" r="70" fill="url(#glow1)" />
            <circle cx="50" cy="100" r="50" fill="url(#glow2)" />
            {[0,1,2,3,4,5].map(i => {
              const a = (i / 6) * Math.PI * 2;
              const r = 40;
              return <circle key={i} cx={80+Math.cos(a)*r} cy={80+Math.sin(a)*r} r={4+i} fill={["#a78bfa","#f472b6","#22d3ee","#fb923c","#0f0","#fbbf24"][i]} opacity={0.7}>
                <animate attributeName="r" values={`${4+i};${8+i};${4+i}`} dur={`${2+i*0.3}s`} repeatCount="indefinite"/>
              </circle>;
            })}
            {[0,1,2,3,4].map(i => {
              const a1 = (i / 6) * Math.PI * 2, a2 = ((i+1) / 6) * Math.PI * 2;
              return <line key={i} x1={80+Math.cos(a1)*40} y1={80+Math.sin(a1)*40} x2={80+Math.cos(a2)*40} y2={80+Math.sin(a2)*40} stroke="#a78bfa" strokeWidth={0.5} opacity={0.3}/>;
            })}
            <text x="80" y="82" textAnchor="middle" fill="#fff" fontSize="8" fontFamily="monospace" opacity="0.6">AI GENERATED</text>
          </svg>
        </div>
      </>)}
    </div>
  );
}

// --- MAIN ---
export default function App() {
  const [running, setRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState(-1);
  const [nodeStates, setNodeStates] = useState({});
  const [logs, setLogs] = useState([]);
  const [elapsed, setElapsed] = useState(0);
  const [activeTab, setActiveTab] = useState("flow");
  const [panelTab, setPanelTab] = useState("terminal");
  const [selectedNode, setSelectedNode] = useState(null);
  const [imgGenerating, setImgGenerating] = useState(false);
  const [imgDone, setImgDone] = useState(false);
  const termRef = useRef(null);
  const timerRef = useRef(null);

  const activeNodes = useMemo(() =>
    Object.entries(nodeStates).filter(([, s]) => s === "done" || s === "running").map(([id]) => id),
    [nodeStates]
  );

  const totalSteps = EXEC_SEQUENCE.length;
  const doneCount = Object.values(nodeStates).filter(s => s === "done").length;
  const runningCount = Object.values(nodeStates).filter(s => s === "running").length;

  useEffect(() => {
    if (termRef.current) termRef.current.scrollTop = termRef.current.scrollHeight;
  }, [logs]);

  const reset = () => {
    setCurrentStep(-1); setNodeStates({}); setLogs([]); setElapsed(0);
    setRunning(false); setImgGenerating(false); setImgDone(false);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const runFlow = useCallback(async () => {
    reset();
    setRunning(true);
    const startTime = Date.now();
    timerRef.current = setInterval(() => setElapsed(Date.now() - startTime), 100);

    for (let i = 0; i < EXEC_SEQUENCE.length; i++) {
      const step = EXEC_SEQUENCE[i];
      setCurrentStep(i);
      setNodeStates(p => ({ ...p, [step.nodeId]: "running" }));
      setSelectedNode(step.nodeId);

      if (step.nodeId === "n7") setImgGenerating(true);

      const agent = AGENTS[FLOW_NODES.find(n => n.id === step.nodeId)?.agent];
      setLogs(p => [...p, { time: Date.now() - startTime, msg: `\n━━━ ${agent?.icon || "●"} ${agent?.label || step.nodeId} ━━━`, type: "info" }]);

      for (const log of step.logs) {
        await new Promise(r => setTimeout(r, log.t === 0 ? 100 : Math.min(log.t, 400)));
        setLogs(p => [...p, { time: Date.now() - startTime, msg: log.msg, type: log.type }]);
      }

      await new Promise(r => setTimeout(r, Math.min(step.duration * 0.3, 600)));
      setNodeStates(p => ({ ...p, [step.nodeId]: "done" }));

      if (step.hasImage) { setImgGenerating(false); setImgDone(true); }
    }

    setLogs(p => [...p, { time: Date.now() - startTime, msg: "\n✅ FLOW COMPLETE — All agents finished successfully", type: "success" }]);
    clearInterval(timerRef.current);
    setElapsed(Date.now() - startTime);
    setRunning(false);
  }, []);

  const formatTime = (ms) => { const s = ms / 1000; return s < 60 ? `${s.toFixed(1)}s` : `${Math.floor(s/60)}m${Math.round(s%60)}s`; };

  const selNodeData = selectedNode ? FLOW_NODES.find(n => n.id === selectedNode) : null;
  const selAgent = selNodeData ? AGENTS[selNodeData.agent] : null;

  return (
    <div style={S.root}>
      <style>{`
        @keyframes pulse{0%,100%{opacity:.4}50%{opacity:1}}
        @keyframes progress{0%{width:0}50%{width:80%}100%{width:100%}}
        *::-webkit-scrollbar{width:5px;height:5px}
        *::-webkit-scrollbar-thumb{background:#222;border-radius:3px}
      `}</style>

      {/* TOP BAR */}
      <div style={S.top}>
        <div style={S.logo}>
          <span>◈</span> Agent Flow
          <span style={{ ...S.badge, color: running ? "#0f0" : "#555", borderColor: running ? "#0f033" : "#333" }}>
            {running ? "RUNNING" : doneCount > 0 ? "DONE" : "IDLE"}
          </span>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <div style={S.stat}><div style={S.statDot("#0f0")} />{doneCount} done</div>
          <div style={S.stat}><div style={S.statDot("#fbbf24")} />{runningCount} running</div>
          <div style={S.stat}><div style={S.statDot("#333")} />{FLOW_NODES.length - doneCount - runningCount} idle</div>
          <div style={{ width: 1, height: 16, background: "#222" }} />
          <span style={{ fontSize: 11, color: "#0f0", fontWeight: "bold" }}>{formatTime(elapsed)}</span>
          <div style={{ width: 1, height: 16, background: "#222" }} />
          {!running ? (
            <button onClick={runFlow} style={{ padding: "6px 16px", background: "#0f0", color: "#000", border: "none", borderRadius: 6, cursor: "pointer", fontFamily: "inherit", fontSize: 11, fontWeight: "bold" }}>
              ▶ {doneCount > 0 ? "Replay" : "Run Flow"}
            </button>
          ) : (
            <button onClick={reset} style={{ padding: "6px 16px", background: "#f44", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontFamily: "inherit", fontSize: 11, fontWeight: "bold" }}>
              ■ Stop
            </button>
          )}
        </div>
      </div>

      {/* Global progress */}
      <div style={S.progress}><div style={S.progressFill((doneCount / FLOW_NODES.length) * 100)} /></div>

      {/* TABS */}
      <div style={S.tabs}>
        {[
          { id: "flow", label: "◈ Flow Canvas" },
          { id: "logs", label: "▤ Full Logs" },
          { id: "outputs", label: "📤 Outputs" },
        ].map(t => <button key={t.id} style={S.tab(activeTab === t.id)} onClick={() => setActiveTab(t.id)}>{t.label}</button>)}
      </div>

      <div style={S.main}>
        {/* CANVAS */}
        {activeTab === "flow" && (
          <div style={S.canvas}>
            <div style={S.canvasInner}>
              <Edges nodes={FLOW_NODES} edges={FLOW_EDGES} activeNodes={activeNodes} />
              {FLOW_NODES.map(node => {
                const agent = AGENTS[node.agent];
                const status = nodeStates[node.id] || "idle";
                return (
                  <div key={node.id} style={{ ...S.node(agent.color, status), left: node.x, top: node.y }}
                    onClick={() => { setSelectedNode(node.id); setPanelTab("config"); }}>
                    <div style={S.nodeHead(agent.color, status)}>
                      <span style={S.nodeIcon}>{agent.icon}</span>
                      <span style={S.nodeName}>{agent.label}</span>
                      <div style={S.nodeStatus(agent.color, status)} />
                    </div>
                    <div style={S.nodeBody}>
                      {Object.entries(node.config).slice(0, 2).map(([k, v]) => (
                        <div key={k}>{k}: <span style={{ color: "#999" }}>{String(v).slice(0, 28)}</span></div>
                      ))}
                    </div>
                    {status === "done" && (
                      <div style={S.nodeTime(agent.color)}>✓ completed</div>
                    )}
                    {status === "running" && (
                      <div style={{ ...S.nodeTime(agent.color), animation: "pulse 1s infinite" }}>● processing...</div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* FULL LOGS TAB */}
        {activeTab === "logs" && (
          <div style={{ ...S.terminal, flex: 1 }} ref={activeTab === "logs" ? termRef : null}>
            {logs.length === 0 && <div style={{ color: "#333", textAlign: "center", padding: 40 }}>Click "Run Flow" to start</div>}
            {logs.map((l, i) => (
              <div key={i} style={S.logLine(l.type)}>
                <span style={S.logTime}>{formatTime(l.time)}</span>{l.msg}
              </div>
            ))}
          </div>
        )}

        {/* OUTPUTS TAB */}
        {activeTab === "outputs" && (
          <div style={{ flex: 1, overflow: "auto", padding: 20 }}>
            <div style={{ fontSize: 14, fontWeight: "bold", color: "#0f0", marginBottom: 16 }}>Generated Outputs</div>
            {!imgDone && doneCount === 0 && <div style={{ color: "#333" }}>Run the flow to see outputs</div>}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              {imgDone && (
                <div style={S.imgCard}>
                  <GenImage generating={false} done={true} />
                  <div style={S.imgMeta}>
                    <div style={{ fontWeight: "bold", marginBottom: 4 }}>AI Agent Network</div>
                    <div style={{ color: "#666" }}>1024×1024 · 2.1MB · DALL-E 3</div>
                  </div>
                </div>
              )}
              {doneCount >= 10 && [
                { title: "Twitter Thread", desc: "3 tweets · #AI #Agents", color: "#0af" },
                { title: "LinkedIn Article", desc: "1,200 words · published", color: "#0077b5" },
                { title: "Trend Report", desc: "PDF · 4 pages", color: "#f59e0b" },
              ].map((o, i) => (
                <div key={i} style={{ ...S.imgCard, padding: 16 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: o.color }} />
                    <span style={{ fontWeight: "bold" }}>{o.title}</span>
                  </div>
                  <div style={{ fontSize: 10, color: "#666" }}>{o.desc}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* RIGHT PANEL */}
        {activeTab === "flow" && (
          <div style={S.panel}>
            <div style={S.panelTabs}>
              <button style={S.panelTab(panelTab === "terminal")} onClick={() => setPanelTab("terminal")}>Terminal</button>
              <button style={S.panelTab(panelTab === "config")} onClick={() => setPanelTab("config")}>Config</button>
              <button style={S.panelTab(panelTab === "preview")} onClick={() => setPanelTab("preview")}>Preview</button>
            </div>

            {panelTab === "terminal" && (
              <div style={S.terminal} ref={termRef}>
                {logs.length === 0 && <div style={{ color: "#333" }}>$ awaiting execution...</div>}
                {logs.map((l, i) => (
                  <div key={i} style={S.logLine(l.type)}>
                    <span style={S.logTime}>{formatTime(l.time)}</span>{l.msg}
                  </div>
                ))}
                {running && <span style={{ color: "#0f0", animation: "pulse 0.8s infinite" }}>█</span>}
              </div>
            )}

            {panelTab === "config" && (
              <div style={S.configPanel}>
                {selNodeData && selAgent ? (<>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                    <span style={{ fontSize: 24 }}>{selAgent.icon}</span>
                    <div>
                      <div style={{ fontWeight: "bold", fontSize: 14 }}>{selAgent.label}</div>
                      <div style={{ fontSize: 10, color: selAgent.color }}>{selAgent.type} · {selNodeData.id}</div>
                    </div>
                    <div style={{ marginLeft: "auto" }}>
                      <span style={{ padding: "3px 8px", borderRadius: 6, fontSize: 9, fontWeight: "bold",
                        background: (nodeStates[selNodeData.id] === "done" ? "#0c6" : nodeStates[selNodeData.id] === "running" ? "#fbbf24" : "#333") + "22",
                        color: nodeStates[selNodeData.id] === "done" ? "#0c6" : nodeStates[selNodeData.id] === "running" ? "#fbbf24" : "#555",
                      }}>{nodeStates[selNodeData.id] || "idle"}</span>
                    </div>
                  </div>
                  {Object.entries(selNodeData.config).map(([k, v]) => (
                    <div key={k}>
                      <div style={S.configLabel}>{k}</div>
                      <div style={S.configVal}>{String(v)}</div>
                    </div>
                  ))}
                  <div style={S.configLabel}>Connections In</div>
                  <div style={S.configVal}>{FLOW_EDGES.filter(e => e.to === selNodeData.id).map(e => e.from).join(", ") || "none"}</div>
                  <div style={S.configLabel}>Connections Out</div>
                  <div style={S.configVal}>{FLOW_EDGES.filter(e => e.from === selNodeData.id).map(e => e.to + (e.label ? ` (${e.label})` : "")).join(", ") || "none"}</div>
                </>) : (
                  <div style={{ color: "#333", padding: 20, textAlign: "center" }}>Click a node to inspect</div>
                )}
              </div>
            )}

            {panelTab === "preview" && (
              <div style={S.imgPreview}>
                <div style={{ fontSize: 12, fontWeight: "bold", color: "#fb923c", marginBottom: 4 }}>Image Generation</div>
                <div style={S.imgCard}>
                  <GenImage generating={imgGenerating} done={imgDone} />
                  <div style={S.imgMeta}>
                    <div style={{ fontWeight: "bold", marginBottom: 2 }}>
                      {imgDone ? "✓ Generated" : imgGenerating ? "Generating..." : "Waiting for pipeline"}
                    </div>
                    <div style={{ color: "#555" }}>DALL-E 3 · 1024×1024 · digital art</div>
                  </div>
                </div>
                {imgDone && (
                  <div style={{ fontSize: 10, color: "#555", padding: "8px 0", borderTop: "1px solid #1a1a1a", marginTop: 8 }}>
                    Prompt: "Futuristic AI agent network with neon connections, nodes processing data in parallel, digital art style"
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* BOTTOM STATS */}
      <div style={S.statsBar}>
        <div style={S.stat}>Nodes: {FLOW_NODES.length}</div>
        <div style={S.stat}>Edges: {FLOW_EDGES.length}</div>
        <div style={S.stat}>Agents: {new Set(FLOW_NODES.map(n => n.agent)).size}</div>
        <div style={{ flex: 1 }} />
        <div style={S.stat}>Tokens: ~15,188</div>
        <div style={S.stat}>API calls: {doneCount}</div>
        <div style={S.stat}>Est. cost: $0.047</div>
      </div>
    </div>
  );
}
