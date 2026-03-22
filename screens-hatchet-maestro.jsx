import { useState } from "react";

// ============================================================
// PACK 2: HATCHET + MAESTRO INSPIRED INTERFACES
// ============================================================

// --- HATCHET DATA ---
const HATCHET_WORKFLOWS = [
  { id: "wf-rag-001", name: "BasicRagWorkflow", status: "Succeeded", totalRuns: 147, failedRuns: 3, lastRun: "2026-03-22T14:20:00Z" },
  { id: "wf-ingest-002", name: "DataIngestion", status: "Running", totalRuns: 89, failedRuns: 1, lastRun: "2026-03-22T14:25:00Z" },
  { id: "wf-email-003", name: "EmailCampaign", status: "Failed", totalRuns: 234, failedRuns: 12, lastRun: "2026-03-22T13:55:00Z" },
  { id: "wf-sync-004", name: "DatabaseSync", status: "Succeeded", totalRuns: 567, failedRuns: 8, lastRun: "2026-03-22T14:10:00Z" },
];

const HATCHET_DAG_NODES = [
  { id: "start", label: "start", status: "succeeded", x: 80, y: 40, duration: 120, output: '{"status":"reading docs"}' },
  { id: "load_docs", label: "load_docs", status: "succeeded", x: 80, y: 140, duration: 2400, output: '{"status":"docs loaded","docs":"...2.4KB"}' },
  { id: "reason_docs", label: "reason_docs", status: "succeeded", x: 80, y: 240, duration: 4200, output: '{"status":"writing response","research":"...8.1KB"}' },
  { id: "generate_response", label: "generate_response", status: "running", x: 80, y: 340, duration: null, output: null },
  { id: "validate", label: "validate_output", status: "pending", x: 260, y: 340, duration: null, output: null },
  { id: "save", label: "save_to_db", status: "pending", x: 170, y: 440, duration: null, output: null },
];
const HATCHET_DAG_EDGES = [
  { from: "start", to: "load_docs" },
  { from: "load_docs", to: "reason_docs" },
  { from: "reason_docs", to: "generate_response" },
  { from: "reason_docs", to: "validate" },
  { from: "generate_response", to: "save" },
  { from: "validate", to: "save" },
];

const HATCHET_RUNS = [
  { id: "run-a1b2", workflow: "BasicRagWorkflow", status: "SUCCEEDED", startedAt: "14:20:00", duration: 6800, steps: 4, trigger: "event: question:create", input: '{"messages":[{"role":"user","content":"how do i install hatchet?"}],"url":"https://docs.hatchet.run"}' },
  { id: "run-c3d4", workflow: "BasicRagWorkflow", status: "SUCCEEDED", startedAt: "14:15:30", duration: 7200, steps: 4, trigger: "event: question:create", input: '{"messages":[{"role":"user","content":"what is a DAG?"}]}' },
  { id: "run-e5f6", workflow: "BasicRagWorkflow", status: "RUNNING", startedAt: "14:25:10", duration: null, steps: 2, trigger: "event: question:create", input: '{"messages":[{"role":"user","content":"how to use playground?"}]}' },
  { id: "run-g7h8", workflow: "BasicRagWorkflow", status: "FAILED", startedAt: "14:10:00", duration: 3400, steps: 2, trigger: "event: question:create", input: '{"messages":[{"role":"user","content":"pricing info"}]}' },
  { id: "run-i9j0", workflow: "DataIngestion", status: "RUNNING", startedAt: "14:25:00", duration: null, steps: 3, trigger: "schedule: */5 * * * *", input: '{"source":"s3://data/incoming"}' },
];

const HATCHET_WORKERS = [
  { id: "w-1", name: "rag-worker-1", status: "ACTIVE", tasks: 3, lastHeartbeat: "2s ago", labels: ["rag", "gpu"], slots: { used: 3, max: 5 } },
  { id: "w-2", name: "rag-worker-2", status: "ACTIVE", tasks: 2, lastHeartbeat: "1s ago", labels: ["rag", "gpu"], slots: { used: 2, max: 5 } },
  { id: "w-3", name: "ingest-worker-1", status: "ACTIVE", tasks: 1, lastHeartbeat: "3s ago", labels: ["ingest"], slots: { used: 1, max: 10 } },
  { id: "w-4", name: "email-worker-1", status: "INACTIVE", tasks: 0, lastHeartbeat: "45s ago", labels: ["email"], slots: { used: 0, max: 5 } },
];

// --- MAESTRO DATA ---
const MAESTRO_AGENTS = [
  { id: "a1", name: "backend-api", project: "myapp", status: "busy", model: "Claude Code", tokens: 45200, cost: 0.14, uptime: "2h 34m", lastOutput: "Implemented auth middleware with JWT validation and refresh token rotation..." },
  { id: "a2", name: "frontend-ui", project: "myapp", status: "busy", model: "Claude Code", tokens: 32100, cost: 0.10, uptime: "1h 48m", lastOutput: "Refactored Dashboard component to use React Query for data fetching..." },
  { id: "a3", name: "database-migration", project: "myapp", status: "idle", model: "Codex", tokens: 18400, cost: 0.06, uptime: "45m", lastOutput: "Migration complete: added indexes on users.email and orders.created_at" },
  { id: "a4", name: "test-suite", project: "myapp", status: "busy", model: "Claude Code", tokens: 28900, cost: 0.09, uptime: "1h 12m", lastOutput: "Writing integration tests for payment flow. 14/20 tests passing..." },
  { id: "a5", name: "docs-generator", project: "docs", status: "idle", model: "OpenCode", tokens: 12300, cost: 0.04, uptime: "30m", lastOutput: "Generated API reference for 23 endpoints. Formatting markdown tables..." },
  { id: "a6", name: "devops-infra", project: "infra", status: "error", model: "Claude Code", tokens: 8700, cost: 0.03, uptime: "15m", lastOutput: "ERROR: Kubernetes deployment failed - image pull backoff on registry..." },
];

const MAESTRO_TERMINAL_LINES = [
  { agent: "backend-api", lines: [
    { t: "info", msg: "$ Reading src/middleware/auth.ts..." },
    { t: "code", msg: "  + import { hashPassword, verifyToken } from './utils/crypto'" },
    { t: "code", msg: "  + export const authMiddleware = async (req, res, next) => {" },
    { t: "code", msg: "  +   const token = req.headers.authorization?.split(' ')[1]" },
    { t: "code", msg: "  +   if (!token) return res.status(401).json({ error: 'No token' })" },
    { t: "success", msg: "  ✓ File written: src/middleware/auth.ts (47 lines)" },
    { t: "info", msg: "$ Running tests..." },
    { t: "success", msg: "  ✓ 12 tests passed" },
  ]},
  { agent: "frontend-ui", lines: [
    { t: "info", msg: "$ Editing src/components/Dashboard.tsx..." },
    { t: "code", msg: "  - const [data, setData] = useState(null)" },
    { t: "code", msg: "  + const { data, isLoading } = useQuery('dashboard', fetchDashboard)" },
    { t: "info", msg: "$ Removing manual fetch logic..." },
    { t: "success", msg: "  ✓ Reduced component from 142 to 89 lines" },
    { t: "info", msg: "$ Running type check..." },
    { t: "success", msg: "  ✓ No type errors" },
  ]},
];

// --- COLORS ---
const C = {
  succeeded: "#10b981", SUCCEEDED: "#10b981", running: "#3b82f6", RUNNING: "#3b82f6",
  failed: "#ef4444", FAILED: "#ef4444", pending: "#71717a", ACTIVE: "#10b981", INACTIVE: "#71717a",
  busy: "#3b82f6", idle: "#71717a", error: "#ef4444",
  info: "#71717a", code: "#f59e0b", success: "#10b981",
};

const S = {
  root: { fontFamily: "'Inter','Helvetica Neue',sans-serif", background: "#09090b", color: "#e4e4e7", height: "100vh", display: "flex", flexDirection: "column", fontSize: 13, overflow: "hidden" },
  topBar: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 20px", borderBottom: "1px solid #27272a", background: "#0c0c0e" },
  logo: { fontSize: 15, fontWeight: "bold", display: "flex", alignItems: "center", gap: 8 },
  platformToggle: { display: "flex", borderRadius: 8, overflow: "hidden", border: "1px solid #27272a" },
  platformBtn: (a) => ({ padding: "6px 16px", background: a ? "#18181b" : "transparent", color: a ? "#fff" : "#71717a", border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: 12, fontWeight: a ? "600" : "400" }),
  tabs: { display: "flex", gap: 0, borderBottom: "1px solid #27272a", padding: "0 20px" },
  tab: (a) => ({ padding: "10px 16px", color: a ? "#fff" : "#71717a", border: "none", background: "none", cursor: "pointer", fontFamily: "inherit", fontSize: 12, borderBottom: a ? "2px solid #f59e0b" : "2px solid transparent", fontWeight: a ? "600" : "400" }),
  content: { flex: 1, overflow: "auto", padding: 20 },
  tag: (col) => ({ display: "inline-block", padding: "2px 8px", borderRadius: 6, fontSize: 10, background: (col || "#555") + "18", color: col || "#888", border: `1px solid ${(col || "#555")}25`, marginRight: 4 }),
  badge: (col) => ({ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 10px", borderRadius: 6, fontSize: 10, fontWeight: "600", background: col + "15", color: col, border: `1px solid ${col}30` }),
  dot: (col) => ({ width: 8, height: 8, borderRadius: "50%", background: col, display: "inline-block", marginRight: 6, boxShadow: col !== "#71717a" ? `0 0 4px ${col}66` : "none" }),
  mono: { fontFamily: "'IBM Plex Mono',monospace", fontSize: 11, color: "#a1a1aa" },
  card: { background: "#18181b", border: "1px solid #27272a", borderRadius: 10, padding: 16, marginBottom: 12 },
  tbl: { width: "100%", borderCollapse: "collapse" },
  th: { textAlign: "left", padding: "10px 12px", borderBottom: "1px solid #27272a", fontSize: 11, color: "#71717a", fontWeight: "500", textTransform: "uppercase", letterSpacing: "0.05em" },
  td: { padding: "10px 12px", borderBottom: "1px solid #18181b", fontSize: 12 },
  row: { cursor: "pointer", transition: "background 0.1s" },
  // DAG
  dagNode: (col, status) => ({
    position: "absolute", width: 140, padding: "10px 12px", background: "#18181b",
    border: `2px solid ${status === "running" ? col : col + "55"}`, borderRadius: 8,
    boxShadow: status === "running" ? `0 0 12px ${col}33` : "none",
    opacity: status === "pending" ? 0.4 : 1, cursor: "pointer", transition: "all 0.2s",
  }),
  // Agent grid
  agentCard: (col) => ({
    background: "#18181b", border: `1px solid ${col}33`, borderRadius: 10,
    padding: 16, cursor: "pointer", transition: "all 0.15s",
  }),
  agentDot: (status) => ({
    width: 10, height: 10, borderRadius: "50%", background: C[status],
    boxShadow: status === "busy" ? `0 0 6px ${C.busy}` : "none",
    animation: status === "busy" ? "pulse 1.5s infinite" : "none",
  }),
  terminal: { background: "#0a0a0a", borderRadius: 8, padding: 12, fontFamily: "'IBM Plex Mono',monospace", fontSize: 11, lineHeight: 1.7, maxHeight: 200, overflow: "auto", border: "1px solid #1a1a1a" },
  termLine: (t) => ({ color: t === "success" ? "#10b981" : t === "code" ? "#f59e0b" : t === "error" ? "#ef4444" : "#71717a" }),
  // Usage
  usageCard: { background: "#18181b", border: "1px solid #27272a", borderRadius: 10, padding: 20, textAlign: "center" },
  usageVal: { fontSize: 28, fontWeight: "bold", marginTop: 4 },
  usageLabel: { fontSize: 10, color: "#71717a", textTransform: "uppercase", letterSpacing: "0.05em" },
};

const fmtDuration = (ms) => { if (!ms) return "—"; if (ms < 1000) return `${ms}ms`; const s = ms / 1000; return s < 60 ? `${s.toFixed(1)}s` : `${Math.floor(s / 60)}m${Math.round(s % 60)}s`; };

// ============================================================
// HATCHET SCREENS
// ============================================================

function HatchetDAGView({ onSelectStep }) {
  const [selected, setSelected] = useState(null);
  const totalW = 420, totalH = 520;

  return (<div style={{ display: "flex", gap: 20 }}>
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: 16, fontWeight: "bold", marginBottom: 4 }}>BasicRagWorkflow</div>
      <div style={{ display: "flex", gap: 12, fontSize: 11, color: "#71717a", marginBottom: 16 }}>
        <span style={S.badge(C.RUNNING)}>RUNNING</span><span>Run: run-e5f6</span><span>•</span><span>Triggered by event</span>
      </div>
      <div style={{ position: "relative", width: totalW, height: totalH, background: "#18181b", borderRadius: 10, border: "1px solid #27272a" }}>
        <svg style={{ position: "absolute", top: 0, left: 0, width: totalW, height: totalH, pointerEvents: "none" }}>
          {HATCHET_DAG_EDGES.map((e, i) => {
            const from = HATCHET_DAG_NODES.find(n => n.id === e.from);
            const to = HATCHET_DAG_NODES.find(n => n.id === e.to);
            if (!from || !to) return null;
            const x1 = from.x + 70, y1 = from.y + 40;
            const x2 = to.x + 70, y2 = to.y;
            const col = C[to.status] || "#555";
            return <path key={i} d={`M${x1},${y1} C${x1},${(y1+y2)/2} ${x2},${(y1+y2)/2} ${x2},${y2}`} fill="none" stroke={col + "55"} strokeWidth={2} />;
          })}
        </svg>
        {HATCHET_DAG_NODES.map(node => {
          const col = C[node.status] || "#555";
          return (
            <div key={node.id} style={{ ...S.dagNode(col, node.status), left: node.x, top: node.y }}
              onClick={() => setSelected(node)}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                <span style={S.dot(col)} />
                <span style={{ fontSize: 12, fontWeight: "600" }}>{node.label}</span>
              </div>
              <div style={{ fontSize: 10, color: "#71717a" }}>
                {node.status === "running" ? "processing..." : node.status === "pending" ? "waiting" : fmtDuration(node.duration)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
    {selected && <div style={{ width: 300, ...S.card }}>
      <div style={{ fontSize: 14, fontWeight: "bold", marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
        <span style={S.dot(C[selected.status])} />{selected.label}
      </div>
      <div style={{ fontSize: 10, color: "#71717a", textTransform: "uppercase", marginBottom: 4 }}>Status</div>
      <div style={{ marginBottom: 12 }}><span style={S.badge(C[selected.status])}>{selected.status}</span></div>
      <div style={{ fontSize: 10, color: "#71717a", textTransform: "uppercase", marginBottom: 4 }}>Duration</div>
      <div style={{ marginBottom: 12, ...S.mono }}>{fmtDuration(selected.duration)}</div>
      {selected.output && <>
        <div style={{ fontSize: 10, color: "#71717a", textTransform: "uppercase", marginBottom: 4 }}>Output</div>
        <div style={{ background: "#0a0a0a", padding: "8px 12px", borderRadius: 6, fontSize: 11, color: "#a1a1aa", fontFamily: "monospace", overflow: "auto", whiteSpace: "pre-wrap", wordBreak: "break-all" }}>{selected.output}</div>
      </>}
    </div>}
  </div>);
}

function HatchetRunsView() {
  return (<>
    <div style={{ fontSize: 16, fontWeight: "bold", marginBottom: 16 }}>Recent Runs</div>
    <table style={S.tbl}><thead><tr>
      <th style={S.th}>Run ID</th><th style={S.th}>Workflow</th><th style={S.th}>Status</th><th style={S.th}>Steps</th><th style={S.th}>Duration</th><th style={S.th}>Trigger</th><th style={S.th}>Started</th>
    </tr></thead><tbody>
      {HATCHET_RUNS.map(r => (
        <tr key={r.id} style={S.row} onMouseEnter={e=>{e.currentTarget.style.background="#18181b"}} onMouseLeave={e=>{e.currentTarget.style.background="transparent"}}>
          <td style={S.td}><span style={S.mono}>{r.id}</span></td>
          <td style={S.td}><span style={{fontWeight:"600"}}>{r.workflow}</span></td>
          <td style={S.td}><span style={S.badge(C[r.status])}><span style={S.dot(C[r.status])}/>{r.status}</span></td>
          <td style={S.td}>{r.steps}/4</td>
          <td style={S.td}><span style={S.mono}>{fmtDuration(r.duration)}</span></td>
          <td style={S.td}><span style={S.tag("#a78bfa")}>{r.trigger}</span></td>
          <td style={{...S.td,color:"#71717a"}}>{r.startedAt}</td>
        </tr>
      ))}
    </tbody></table>
  </>);
}

function HatchetWorkersView() {
  return (<>
    <div style={{ fontSize: 16, fontWeight: "bold", marginBottom: 16 }}>Workers</div>
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
      {HATCHET_WORKERS.map(w => {
        const pct = w.slots.max ? (w.slots.used / w.slots.max) * 100 : 0;
        return (
          <div key={w.id} style={S.card}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={S.dot(C[w.status])} />
                <span style={{ fontWeight: "600" }}>{w.name}</span>
              </div>
              <span style={S.badge(C[w.status])}>{w.status}</span>
            </div>
            <div style={{ display: "flex", gap: 16, fontSize: 11, color: "#71717a", marginBottom: 12 }}>
              <span>Tasks: <span style={{color:"#e4e4e7"}}>{w.tasks}</span></span>
              <span>Slots: <span style={{color:"#e4e4e7"}}>{w.slots.used}/{w.slots.max}</span></span>
              <span>Heartbeat: <span style={{color: w.lastHeartbeat.includes("45") ? "#ef4444" : "#10b981"}}>{w.lastHeartbeat}</span></span>
            </div>
            <div style={{ display: "flex", gap: 4, marginBottom: 8 }}>{w.labels.map(l => <span key={l} style={S.tag("#f59e0b")}>{l}</span>)}</div>
            <div style={{ background: "#27272a", borderRadius: 3, height: 4, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${pct}%`, background: pct > 80 ? "#ef4444" : pct > 50 ? "#f59e0b" : "#10b981", borderRadius: 3, transition: "width 0.3s" }} />
            </div>
          </div>
        );
      })}
    </div>
  </>);
}

// ============================================================
// MAESTRO SCREENS
// ============================================================

function MaestroAgentGrid({ onSelect }) {
  return (<>
    <div style={{ fontSize: 16, fontWeight: "bold", marginBottom: 4 }}>Agent Fleet</div>
    <div style={{ fontSize: 11, color: "#71717a", marginBottom: 16 }}>
      {MAESTRO_AGENTS.filter(a=>a.status==="busy").length} busy · {MAESTRO_AGENTS.filter(a=>a.status==="idle").length} idle · {MAESTRO_AGENTS.filter(a=>a.status==="error").length} error
    </div>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
      {MAESTRO_AGENTS.map(a => (
        <div key={a.id} style={S.agentCard(C[a.status])} onClick={() => onSelect(a)}
          onMouseEnter={e=>{e.currentTarget.style.borderColor=C[a.status];e.currentTarget.style.transform="translateY(-2px)"}}
          onMouseLeave={e=>{e.currentTarget.style.borderColor=C[a.status]+"33";e.currentTarget.style.transform="none"}}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={S.agentDot(a.status)} />
              <span style={{ fontWeight: "600", fontSize: 13 }}>{a.name}</span>
            </div>
            <span style={S.tag(a.status === "error" ? "#ef4444" : "#71717a")}>{a.model}</span>
          </div>
          <div style={{ fontSize: 11, color: "#71717a", marginBottom: 8 }}>
            <span style={S.tag("#a78bfa")}>{a.project}</span>
            <span style={{ marginLeft: 8 }}>↑ {a.uptime}</span>
          </div>
          <div style={{ fontSize: 11, color: "#52525b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginBottom: 10 }}>
            {a.lastOutput.slice(0, 80)}...
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#52525b" }}>
            <span>{a.tokens.toLocaleString()} tokens</span>
            <span>{"$"}{a.cost.toFixed(2)}</span>
          </div>
        </div>
      ))}
    </div>
  </>);
}

function MaestroTerminals() {
  const [activeAgent, setActiveAgent] = useState("backend-api");
  const agents = MAESTRO_AGENTS.filter(a => a.status === "busy");
  const termData = MAESTRO_TERMINAL_LINES.find(t => t.agent === activeAgent);

  return (<>
    <div style={{ fontSize: 16, fontWeight: "bold", marginBottom: 16 }}>Live Sessions</div>
    <div style={{ display: "flex", gap: 0, marginBottom: 16, borderRadius: 8, overflow: "hidden", border: "1px solid #27272a" }}>
      {agents.map(a => (
        <button key={a.id} onClick={() => setActiveAgent(a.name)} style={{
          padding: "8px 16px", background: activeAgent === a.name ? "#18181b" : "transparent",
          color: activeAgent === a.name ? "#fff" : "#71717a", border: "none", cursor: "pointer",
          fontFamily: "inherit", fontSize: 11, borderRight: "1px solid #27272a",
          display: "flex", alignItems: "center", gap: 6,
        }}>
          <div style={S.agentDot(a.status)} />{a.name}
        </button>
      ))}
    </div>
    <div style={S.terminal}>
      <div style={{ color: "#52525b", marginBottom: 8 }}>━━━ {activeAgent} ━━━</div>
      {termData ? termData.lines.map((l, i) => (
        <div key={i} style={S.termLine(l.t)}>{l.msg}</div>
      )) : <div style={{ color: "#52525b" }}>No output available</div>}
      <span style={{ color: "#3b82f6", animation: "pulse 0.8s infinite" }}>█</span>
    </div>
    <div style={{ marginTop: 16 }}>
      <div style={{ fontSize: 12, fontWeight: "600", marginBottom: 8 }}>All Sessions</div>
      {MAESTRO_AGENTS.map(a => (
        <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 0", borderBottom: "1px solid #18181b", fontSize: 12 }}>
          <div style={S.agentDot(a.status)} />
          <span style={{ flex: 1, fontWeight: "500" }}>{a.name}</span>
          <span style={S.tag("#71717a")}>{a.model}</span>
          <span style={{ ...S.mono, width: 80, textAlign: "right" }}>{a.uptime}</span>
          <span style={{ ...S.mono, width: 60, textAlign: "right", color: a.status === "error" ? "#ef4444" : "#71717a" }}>{a.status}</span>
        </div>
      ))}
    </div>
  </>);
}

function MaestroUsageDashboard() {
  const totalTokens = MAESTRO_AGENTS.reduce((s, a) => s + a.tokens, 0);
  const totalCost = MAESTRO_AGENTS.reduce((s, a) => s + a.cost, 0);

  return (<>
    <div style={{ fontSize: 16, fontWeight: "bold", marginBottom: 16 }}>Usage Dashboard</div>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
      <div style={S.usageCard}><div style={S.usageLabel}>Total Tokens</div><div style={{ ...S.usageVal, color: "#3b82f6" }}>{(totalTokens/1000).toFixed(1)}k</div></div>
      <div style={S.usageCard}><div style={S.usageLabel}>Total Cost</div><div style={{ ...S.usageVal, color: "#10b981" }}>{"$"}{totalCost.toFixed(2)}</div></div>
      <div style={S.usageCard}><div style={S.usageLabel}>Active Agents</div><div style={{ ...S.usageVal, color: "#f59e0b" }}>{MAESTRO_AGENTS.filter(a=>a.status==="busy").length}</div></div>
      <div style={S.usageCard}><div style={S.usageLabel}>Errors</div><div style={{ ...S.usageVal, color: "#ef4444" }}>{MAESTRO_AGENTS.filter(a=>a.status==="error").length}</div></div>
    </div>
    <div style={{ fontSize: 13, fontWeight: "600", marginBottom: 12 }}>Per Agent</div>
    <div style={{ background: "#18181b", borderRadius: 10, border: "1px solid #27272a", overflow: "hidden" }}>
      {MAESTRO_AGENTS.map((a, i) => {
        const pct = (a.tokens / totalTokens) * 100;
        return (
          <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderBottom: i < MAESTRO_AGENTS.length - 1 ? "1px solid #27272a" : "none" }}>
            <div style={S.agentDot(a.status)} />
            <span style={{ width: 160, fontWeight: "500", fontSize: 12 }}>{a.name}</span>
            <div style={{ flex: 1, background: "#27272a", borderRadius: 3, height: 8, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${pct}%`, background: C[a.status], borderRadius: 3, transition: "width 0.3s" }} />
            </div>
            <span style={{ ...S.mono, width: 80, textAlign: "right" }}>{a.tokens.toLocaleString()}</span>
            <span style={{ ...S.mono, width: 60, textAlign: "right", color: "#10b981" }}>{"$"}{a.cost.toFixed(2)}</span>
          </div>
        );
      })}
    </div>
    <div style={{ marginTop: 24, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
      <div style={S.card}>
        <div style={{ fontSize: 12, fontWeight: "600", marginBottom: 12 }}>Model Distribution</div>
        {["Claude Code", "Codex", "OpenCode"].map(m => {
          const count = MAESTRO_AGENTS.filter(a => a.model === m).length;
          return <div key={m} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <span style={{ width: 100, fontSize: 11 }}>{m}</span>
            <div style={{ flex: 1, background: "#27272a", borderRadius: 3, height: 6, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${(count/MAESTRO_AGENTS.length)*100}%`, background: "#a78bfa", borderRadius: 3 }} />
            </div>
            <span style={{ ...S.mono, width: 20 }}>{count}</span>
          </div>;
        })}
      </div>
      <div style={S.card}>
        <div style={{ fontSize: 12, fontWeight: "600", marginBottom: 12 }}>Project Distribution</div>
        {["myapp", "docs", "infra"].map(p => {
          const count = MAESTRO_AGENTS.filter(a => a.project === p).length;
          return <div key={p} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <span style={{ width: 100, fontSize: 11 }}>{p}</span>
            <div style={{ flex: 1, background: "#27272a", borderRadius: 3, height: 6, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${(count/MAESTRO_AGENTS.length)*100}%`, background: "#f59e0b", borderRadius: 3 }} />
            </div>
            <span style={{ ...S.mono, width: 20 }}>{count}</span>
          </div>;
        })}
      </div>
    </div>
  </>);
}

// ============================================================
// MAIN
// ============================================================
export default function App() {
  const [platform, setPlatform] = useState("hatchet");
  const [hatchetTab, setHatchetTab] = useState("dag");
  const [maestroTab, setMaestroTab] = useState("agents");

  const hTabs = [{ id: "dag", label: "🪓 Workflow DAG" }, { id: "runs", label: "Runs" }, { id: "workers", label: "Workers" }];
  const mTabs = [{ id: "agents", label: "🎹 Agent Grid" }, { id: "terminals", label: "Terminals" }, { id: "usage", label: "Usage" }];

  const tabs = platform === "hatchet" ? hTabs : mTabs;
  const activeTab = platform === "hatchet" ? hatchetTab : maestroTab;
  const setTab = platform === "hatchet" ? setHatchetTab : setMaestroTab;

  return (
    <div style={S.root}>
      <style>{`@keyframes pulse{0%,100%{opacity:.4}50%{opacity:1}}`}</style>
      <div style={S.topBar}>
        <div style={S.logo}>
          <span style={{ color: platform === "hatchet" ? "#f59e0b" : "#a78bfa" }}>
            {platform === "hatchet" ? "🪓" : "🎹"}
          </span>
          {platform === "hatchet" ? "Hatchet" : "Maestro"}
        </div>
        <div style={S.platformToggle}>
          <button style={S.platformBtn(platform === "hatchet")} onClick={() => setPlatform("hatchet")}>🪓 Hatchet</button>
          <button style={S.platformBtn(platform === "maestro")} onClick={() => setPlatform("maestro")}>🎹 Maestro</button>
        </div>
      </div>
      <div style={S.tabs}>
        {tabs.map(t => <button key={t.id} style={S.tab(activeTab === t.id)} onClick={() => setTab(t.id)}>{t.label}</button>)}
      </div>
      <div style={S.content}>
        {platform === "hatchet" && hatchetTab === "dag" && <HatchetDAGView />}
        {platform === "hatchet" && hatchetTab === "runs" && <HatchetRunsView />}
        {platform === "hatchet" && hatchetTab === "workers" && <HatchetWorkersView />}
        {platform === "maestro" && maestroTab === "agents" && <MaestroAgentGrid onSelect={() => setMaestroTab("terminals")} />}
        {platform === "maestro" && maestroTab === "terminals" && <MaestroTerminals />}
        {platform === "maestro" && maestroTab === "usage" && <MaestroUsageDashboard />}
      </div>
    </div>
  );
}
