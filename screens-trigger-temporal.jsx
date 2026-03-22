import { useState, useMemo, useEffect, useRef } from "react";

// ============================================================
// PACK 1: TRIGGER.DEV + TEMPORAL.IO INSPIRED INTERFACES
// 3 screens each, toggle between them
// ============================================================

// --- DATA ---
const TRIGGER_RUNS = [
  { id: "run_a8f2c1d", task: "generate-social-posts", status: "COMPLETED", duration: 12400, startedAt: "2026-03-22T14:23:01Z", tags: ["prod", "ai", "batch-42"], version: "v3.4.1", queue: "ai-pipeline", attempt: 1, output: '{"posts": 5, "images": 3}' },
  { id: "run_b3e7f9a", task: "process-video", status: "COMPLETED", duration: 45200, startedAt: "2026-03-22T14:18:30Z", tags: ["prod", "media"], version: "v3.4.1", queue: "media", attempt: 1, output: '{"format": "mp4", "size": "24MB"}' },
  { id: "run_c1d4e8b", task: "sync-database", status: "FAILED", duration: 3200, startedAt: "2026-03-22T14:15:22Z", tags: ["prod", "sync"], version: "v3.4.0", queue: "default", attempt: 3, output: '{"error": "Connection timeout"}' },
  { id: "run_d9a2b5c", task: "send-email-batch", status: "RUNNING", duration: null, startedAt: "2026-03-22T14:25:00Z", tags: ["prod", "email", "priority"], version: "v3.4.1", queue: "email", attempt: 1, output: null },
  { id: "run_e4f8c2d", task: "generate-social-posts", status: "QUEUED", duration: null, startedAt: null, tags: ["staging", "ai"], version: "v3.4.1", queue: "ai-pipeline", attempt: 0, output: null },
  { id: "run_f7b1a3e", task: "scrape-feeds", status: "COMPLETED", duration: 8900, startedAt: "2026-03-22T13:55:10Z", tags: ["prod", "scraper"], version: "v3.4.1", queue: "default", attempt: 1, output: '{"feeds": 12, "articles": 87}' },
  { id: "run_g2c5d8f", task: "process-video", status: "COMPLETED", duration: 38100, startedAt: "2026-03-22T13:40:00Z", tags: ["prod", "media"], version: "v3.4.0", queue: "media", attempt: 2, output: '{"format": "webm", "size": "18MB"}' },
  { id: "run_h6e9a1b", task: "generate-report", status: "CANCELED", duration: 1500, startedAt: "2026-03-22T13:30:15Z", tags: ["staging"], version: "v3.4.0", queue: "default", attempt: 1, output: null },
  { id: "run_i8d3f5c", task: "sync-database", status: "COMPLETED", duration: 2100, startedAt: "2026-03-22T13:20:00Z", tags: ["prod", "sync"], version: "v3.4.1", queue: "default", attempt: 1, output: '{"rows": 1247}' },
  { id: "run_j1a7b4e", task: "generate-social-posts", status: "REATTEMPTING", duration: null, startedAt: "2026-03-22T14:20:00Z", tags: ["prod", "ai"], version: "v3.4.1", queue: "ai-pipeline", attempt: 2, output: null },
];

const TRIGGER_TRACES = [
  { id: "s1", name: "generate-social-posts", type: "task", start: 0, end: 12400, status: "completed", depth: 0 },
  { id: "s2", name: "fetch-content-sources", type: "subtask", start: 200, end: 3400, status: "completed", depth: 1 },
  { id: "s2a", name: "HTTP GET techcrunch.com/feed", type: "http", start: 300, end: 1800, status: "completed", depth: 2 },
  { id: "s2b", name: "HTTP GET youtube.com/api", type: "http", start: 400, end: 2200, status: "completed", depth: 2 },
  { id: "s2c", name: "Supabase SELECT content_queue", type: "db", start: 500, end: 1200, status: "completed", depth: 2 },
  { id: "s3", name: "analyze-with-llm", type: "subtask", start: 3500, end: 7800, status: "completed", depth: 1 },
  { id: "s3a", name: "Claude claude-opus-4 completion", type: "llm", start: 3600, end: 7600, status: "completed", depth: 2 },
  { id: "s4", name: "generate-images", type: "subtask", start: 7900, end: 10800, status: "completed", depth: 1 },
  { id: "s4a", name: "DALL-E 3 generation", type: "llm", start: 8000, end: 10600, status: "completed", depth: 2 },
  { id: "s5", name: "save-to-storage", type: "subtask", start: 10900, end: 11800, status: "completed", depth: 1 },
  { id: "s5a", name: "Supabase INSERT posts", type: "db", start: 11000, end: 11600, status: "completed", depth: 2 },
  { id: "s6", name: "send-notifications", type: "subtask", start: 11900, end: 12300, status: "completed", depth: 1 },
];

const TRIGGER_QUEUES = [
  { name: "ai-pipeline", concurrency: 5, running: 3, queued: 2, completed: 147, failed: 3, avgDuration: 14200 },
  { name: "media", concurrency: 2, running: 1, queued: 0, completed: 89, failed: 1, avgDuration: 41000 },
  { name: "email", concurrency: 10, running: 4, queued: 12, completed: 1203, failed: 8, avgDuration: 3200 },
  { name: "default", concurrency: 20, running: 2, queued: 0, completed: 567, failed: 15, avgDuration: 5400 },
  { name: "scraper", concurrency: 3, running: 0, queued: 0, completed: 234, failed: 5, avgDuration: 8900 },
];

// Temporal data
const TEMPORAL_WORKFLOWS = [
  { id: "order-proc-a8f2", type: "OrderProcessing", status: "Running", startTime: "2026-03-22T14:00:00Z", taskQueue: "order-queue", parentId: null, memo: "Order #12345 - Premium customer" },
  { id: "payment-b3e7", type: "PaymentWorkflow", status: "Completed", startTime: "2026-03-22T13:45:00Z", closeTime: "2026-03-22T13:52:30Z", taskQueue: "payment-queue", parentId: "order-proc-a8f2", memo: "Payment $1,247.00" },
  { id: "shipping-c1d4", type: "ShippingWorkflow", status: "Running", startTime: "2026-03-22T13:53:00Z", taskQueue: "shipping-queue", parentId: "order-proc-a8f2", memo: "Express shipping - São Paulo" },
  { id: "inventory-d9a2", type: "InventoryCheck", status: "Completed", startTime: "2026-03-22T13:46:00Z", closeTime: "2026-03-22T13:46:30Z", taskQueue: "inventory-queue", parentId: "order-proc-a8f2", memo: "3 items in stock" },
  { id: "notify-e4f8", type: "NotificationWorkflow", status: "Completed", startTime: "2026-03-22T13:52:35Z", closeTime: "2026-03-22T13:52:40Z", taskQueue: "notification-queue", parentId: "order-proc-a8f2", memo: "Email + SMS sent" },
  { id: "refund-f7b1", type: "RefundWorkflow", status: "Failed", startTime: "2026-03-22T12:30:00Z", closeTime: "2026-03-22T12:35:00Z", taskQueue: "payment-queue", parentId: null, memo: "Refund #R-789 - Timeout" },
  { id: "batch-g2c5", type: "BatchImport", status: "Running", startTime: "2026-03-22T10:00:00Z", taskQueue: "batch-queue", parentId: null, memo: "Import 50k records from CSV" },
  { id: "report-h6e9", type: "DailyReport", status: "Completed", startTime: "2026-03-22T06:00:00Z", closeTime: "2026-03-22T06:02:15Z", taskQueue: "report-queue", parentId: null, memo: "Daily metrics report" },
];

const TEMPORAL_TIMELINE = [
  { id: "e1", group: "Workflow", name: "OrderProcessing started", start: 0, end: null, status: "running", type: "workflow" },
  { id: "e2", group: "Activity", name: "ValidateOrder", start: 100, end: 800, status: "completed", type: "activity" },
  { id: "e3", group: "Child WF", name: "InventoryCheck", start: 900, end: 1400, status: "completed", type: "child" },
  { id: "e4", group: "Activity", name: "CalculateTotal", start: 1500, end: 2000, status: "completed", type: "activity" },
  { id: "e5", group: "Child WF", name: "PaymentWorkflow", start: 2100, end: 6600, status: "completed", type: "child" },
  { id: "e6", group: "Signal", name: "PaymentConfirmed", start: 6700, end: 6700, status: "completed", type: "signal" },
  { id: "e7", group: "Child WF", name: "NotificationWorkflow", start: 6800, end: 7100, status: "completed", type: "child" },
  { id: "e8", group: "Timer", name: "CooldownTimer (2s)", start: 7200, end: 9200, status: "completed", type: "timer" },
  { id: "e9", group: "Child WF", name: "ShippingWorkflow", start: 9300, end: null, status: "running", type: "child" },
  { id: "e10", group: "Activity", name: "UpdateOrderStatus", start: 9400, end: null, status: "running", type: "activity" },
];

const TEMPORAL_EVENTS = [
  { id: 1, type: "WorkflowExecutionStarted", time: "14:00:00.000", detail: "TaskQueue: order-queue", status: "ok" },
  { id: 2, type: "WorkflowTaskScheduled", time: "14:00:00.001", detail: "TaskQueue: order-queue", status: "ok" },
  { id: 3, type: "WorkflowTaskStarted", time: "14:00:00.050", detail: "Worker: worker-1", status: "ok" },
  { id: 4, type: "WorkflowTaskCompleted", time: "14:00:00.100", detail: "Commands: ScheduleActivityTask", status: "ok" },
  { id: 5, type: "ActivityTaskScheduled", time: "14:00:00.100", detail: "ValidateOrder", status: "ok" },
  { id: 6, type: "ActivityTaskStarted", time: "14:00:00.150", detail: "Worker: worker-2", status: "ok" },
  { id: 7, type: "ActivityTaskCompleted", time: "14:00:00.800", detail: '{"valid": true, "items": 3}', status: "ok" },
  { id: 8, type: "ChildWorkflowExecutionStarted", time: "14:00:00.900", detail: "InventoryCheck", status: "ok" },
  { id: 9, type: "ChildWorkflowExecutionCompleted", time: "14:00:01.400", detail: '{"inStock": true}', status: "ok" },
  { id: 10, type: "ActivityTaskScheduled", time: "14:00:01.500", detail: "CalculateTotal", status: "ok" },
  { id: 11, type: "ActivityTaskCompleted", time: "14:00:02.000", detail: '{"total": 1247.00}', status: "ok" },
  { id: 12, type: "ChildWorkflowExecutionStarted", time: "14:00:02.100", detail: "PaymentWorkflow", status: "ok" },
  { id: 13, type: "ChildWorkflowExecutionCompleted", time: "14:00:06.600", detail: '{"charged": true}', status: "ok" },
  { id: 14, type: "WorkflowExecutionSignaled", time: "14:00:06.700", detail: "Signal: PaymentConfirmed", status: "signal" },
  { id: 15, type: "TimerStarted", time: "14:00:07.200", detail: "Duration: 2s", status: "timer" },
  { id: 16, type: "TimerFired", time: "14:00:09.200", detail: "CooldownTimer", status: "timer" },
  { id: 17, type: "ChildWorkflowExecutionStarted", time: "14:00:09.300", detail: "ShippingWorkflow", status: "running" },
  { id: 18, type: "ActivityTaskScheduled", time: "14:00:09.400", detail: "UpdateOrderStatus", status: "running" },
];

// --- STYLES ---
const C = {
  COMPLETED: "#10b981", RUNNING: "#3b82f6", FAILED: "#ef4444", QUEUED: "#888", CANCELED: "#888", REATTEMPTING: "#f59e0b",
  Completed: "#10b981", Running: "#3b82f6", Failed: "#ef4444",
  completed: "#10b981", running: "#3b82f6", failed: "#ef4444", ok: "#10b981", signal: "#a78bfa", timer: "#f59e0b",
  activity: "#3b82f6", child: "#a78bfa", workflow: "#10b981", http: "#60a5fa", db: "#3ecf8e", llm: "#f472b6", subtask: "#888", task: "#10b981",
};

const S = {
  root: { fontFamily: "'Inter','Helvetica Neue',sans-serif", background: "#09090b", color: "#e4e4e7", height: "100vh", display: "flex", flexDirection: "column", fontSize: 13, overflow: "hidden" },
  topBar: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 20px", borderBottom: "1px solid #27272a", background: "#0c0c0e" },
  logo: { fontSize: 15, fontWeight: "bold", display: "flex", alignItems: "center", gap: 8 },
  platformToggle: { display: "flex", borderRadius: 8, overflow: "hidden", border: "1px solid #27272a" },
  platformBtn: (a) => ({ padding: "6px 16px", background: a ? "#18181b" : "transparent", color: a ? "#fff" : "#71717a", border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: 12, fontWeight: a ? "600" : "400" }),
  tabs: { display: "flex", gap: 0, borderBottom: "1px solid #27272a", padding: "0 20px" },
  tab: (a) => ({ padding: "10px 16px", color: a ? "#fff" : "#71717a", border: "none", background: "none", cursor: "pointer", fontFamily: "inherit", fontSize: 12, borderBottom: a ? "2px solid #3b82f6" : "2px solid transparent", fontWeight: a ? "600" : "400" }),
  content: { flex: 1, overflow: "auto", padding: 20 },
  // Common
  tag: (col) => ({ display: "inline-block", padding: "2px 8px", borderRadius: 6, fontSize: 10, background: (col || "#555") + "18", color: col || "#888", border: `1px solid ${(col || "#555")}25`, marginRight: 4 }),
  statusDot: (col) => ({ width: 8, height: 8, borderRadius: "50%", background: col, display: "inline-block", marginRight: 6, boxShadow: `0 0 4px ${col}66` }),
  badge: (col) => ({ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 10px", borderRadius: 6, fontSize: 10, fontWeight: "600", background: col + "15", color: col, border: `1px solid ${col}30` }),
  // Table
  tbl: { width: "100%", borderCollapse: "collapse" },
  th: { textAlign: "left", padding: "10px 12px", borderBottom: "1px solid #27272a", fontSize: 11, color: "#71717a", fontWeight: "500", textTransform: "uppercase", letterSpacing: "0.05em" },
  td: { padding: "10px 12px", borderBottom: "1px solid #18181b", fontSize: 12 },
  row: { cursor: "pointer", transition: "background 0.1s" },
  mono: { fontFamily: "'IBM Plex Mono',monospace", fontSize: 11, color: "#a1a1aa" },
  // Trace
  traceRow: { display: "flex", alignItems: "center", padding: "4px 0", gap: 8, fontSize: 11 },
  traceBar: (start, end, total, color) => {
    const left = (start / total) * 100;
    const width = Math.max(((end - start) / total) * 100, 0.5);
    return { position: "absolute", left: `${left}%`, width: `${width}%`, height: 20, background: color + "55", borderRadius: 3, border: `1px solid ${color}66`, minWidth: 3 };
  },
  // Queue
  queueCard: { background: "#18181b", border: "1px solid #27272a", borderRadius: 10, padding: 16, marginBottom: 12 },
  queueBar: (pct, col) => ({ height: 6, borderRadius: 3, background: col, width: `${pct}%`, transition: "width 0.3s" }),
  // Timeline
  timelineRow: { display: "flex", alignItems: "center", padding: "6px 0", borderBottom: "1px solid #18181b" },
  timelineLabel: { width: 140, fontSize: 11, color: "#71717a", flexShrink: 0, paddingRight: 12 },
  timelineTrack: { flex: 1, position: "relative", height: 24 },
  // Event history
  evtRow: { display: "flex", gap: 12, padding: "8px 0", borderBottom: "1px solid #18181b", alignItems: "flex-start", fontSize: 12 },
  evtDot: (col) => ({ width: 10, height: 10, borderRadius: "50%", background: col, marginTop: 4, flexShrink: 0 }),
  evtLine: { width: 1, background: "#27272a", position: "absolute", top: 22, bottom: 0, left: 4 },
  // Side panel
  panel: { width: 360, borderLeft: "1px solid #27272a", background: "#0c0c0e", overflow: "auto", display: "flex", flexDirection: "column" },
  panelHead: { padding: "14px 16px", borderBottom: "1px solid #27272a", fontWeight: "600" },
  panelBody: { padding: 16, flex: 1, overflow: "auto" },
  panelLabel: { fontSize: 10, color: "#71717a", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4, marginTop: 14 },
  panelVal: { fontSize: 12, color: "#e4e4e7", marginBottom: 8 },
  panelCode: { fontFamily: "'IBM Plex Mono',monospace", fontSize: 11, background: "#18181b", padding: "8px 12px", borderRadius: 6, color: "#a1a1aa", overflowX: "auto", whiteSpace: "pre-wrap", wordBreak: "break-all" },
};

const fmtDuration = (ms) => { if (!ms) return "—"; if (ms < 1000) return `${ms}ms`; const s = ms / 1000; return s < 60 ? `${s.toFixed(1)}s` : `${Math.floor(s / 60)}m${Math.round(s % 60)}s`; };
const fmtTime = (iso) => iso ? new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" }) : "—";

// ============================================================
// TRIGGER.DEV SCREENS
// ============================================================

function TriggerRunList({ onSelect }) {
  const [filter, setFilter] = useState("");
  const filtered = TRIGGER_RUNS.filter(r => !filter || r.task.includes(filter) || r.tags.some(t => t.includes(filter)));
  return (<>
    <div style={{ display: "flex", gap: 8, marginBottom: 16, alignItems: "center" }}>
      <input style={{ padding: "8px 12px", background: "#18181b", border: "1px solid #27272a", color: "#e4e4e7", borderRadius: 6, fontFamily: "inherit", fontSize: 12, width: 280 }} placeholder="Filter by task or tag..." value={filter} onChange={e => setFilter(e.target.value)} />
      <span style={{ fontSize: 11, color: "#71717a" }}>{filtered.length} runs</span>
    </div>
    <table style={S.tbl}><thead><tr>
      <th style={S.th}>Run ID</th><th style={S.th}>Task</th><th style={S.th}>Status</th><th style={S.th}>Duration</th><th style={S.th}>Started</th><th style={S.th}>Tags</th><th style={S.th}>Version</th>
    </tr></thead><tbody>
      {filtered.map(r => (
        <tr key={r.id} style={S.row} onClick={() => onSelect(r)}
          onMouseEnter={e => { e.currentTarget.style.background = "#18181b"; }} onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}>
          <td style={S.td}><span style={S.mono}>{r.id}</span></td>
          <td style={S.td}><span style={{ fontWeight: "600" }}>{r.task}</span></td>
          <td style={S.td}><span style={S.badge(C[r.status])}><span style={S.statusDot(C[r.status])} />{r.status}</span></td>
          <td style={S.td}><span style={S.mono}>{fmtDuration(r.duration)}</span></td>
          <td style={S.td}><span style={{ color: "#71717a", fontSize: 11 }}>{fmtTime(r.startedAt)}</span></td>
          <td style={S.td}>{r.tags.map(t => <span key={t} style={S.tag("#3b82f6")}>{t}</span>)}</td>
          <td style={S.td}><span style={S.mono}>{r.version}</span></td>
        </tr>
      ))}
    </tbody></table>
  </>);
}

function TriggerTraceView() {
  const total = 12400;
  const [hovered, setHovered] = useState(null);
  return (<>
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 16, fontWeight: "bold", marginBottom: 4 }}>generate-social-posts</div>
      <div style={{ display: "flex", gap: 12, fontSize: 11, color: "#71717a" }}>
        <span>run_a8f2c1d</span><span>•</span><span style={S.badge(C.COMPLETED)}>COMPLETED</span><span>•</span><span>{fmtDuration(total)}</span><span>•</span><span>Attempt 1</span>
      </div>
    </div>
    <div style={{ background: "#18181b", borderRadius: 10, padding: 16, border: "1px solid #27272a" }}>
      {TRIGGER_TRACES.map(span => (
        <div key={span.id} style={{ ...S.traceRow, paddingLeft: span.depth * 24 }} onMouseEnter={() => setHovered(span.id)} onMouseLeave={() => setHovered(null)}>
          <span style={{ width: 200, fontSize: 11, color: hovered === span.id ? "#fff" : "#a1a1aa", fontWeight: span.depth === 0 ? "600" : "400", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            <span style={S.statusDot(C[span.type] || "#888")} />{span.name}
          </span>
          <div style={{ flex: 1, position: "relative", height: 20 }}>
            <div style={{ position: "absolute", inset: 0, background: "#27272a33", borderRadius: 3 }} />
            <div style={S.traceBar(span.start, span.end, total, C[span.type] || "#888")} />
          </div>
          <span style={S.mono}>{fmtDuration(span.end - span.start)}</span>
        </div>
      ))}
    </div>
  </>);
}

function TriggerQueuesView() {
  return (<div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
    {TRIGGER_QUEUES.map(q => {
      const total = q.running + q.queued;
      const pct = q.concurrency ? (q.running / q.concurrency) * 100 : 0;
      return (
        <div key={q.name} style={S.queueCard}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
            <span style={{ fontWeight: "600", fontSize: 14 }}>{q.name}</span>
            <span style={S.badge(pct > 80 ? "#ef4444" : pct > 50 ? "#f59e0b" : "#10b981")}>{q.running}/{q.concurrency}</span>
          </div>
          <div style={{ display: "flex", gap: 16, fontSize: 11, color: "#71717a", marginBottom: 12 }}>
            <span><span style={{ color: "#3b82f6" }}>{q.running}</span> running</span>
            <span><span style={{ color: "#f59e0b" }}>{q.queued}</span> queued</span>
            <span><span style={{ color: "#10b981" }}>{q.completed}</span> completed</span>
            <span><span style={{ color: "#ef4444" }}>{q.failed}</span> failed</span>
          </div>
          <div style={{ fontSize: 10, color: "#71717a", marginBottom: 6 }}>Concurrency {Math.round(pct)}%</div>
          <div style={{ background: "#27272a", borderRadius: 3, height: 6, overflow: "hidden" }}>
            <div style={S.queueBar(pct, pct > 80 ? "#ef4444" : pct > 50 ? "#f59e0b" : "#10b981")} />
          </div>
          <div style={{ fontSize: 10, color: "#52525b", marginTop: 8 }}>Avg duration: {fmtDuration(q.avgDuration)}</div>
        </div>
      );
    })}
  </div>);
}

// ============================================================
// TEMPORAL.IO SCREENS
// ============================================================

function TemporalWorkflowList({ onSelect }) {
  const [savedView, setSavedView] = useState("all");
  const views = { all: "All Workflows", running: "Running", completed: "Completed", failed: "Failed" };
  const filtered = TEMPORAL_WORKFLOWS.filter(w => savedView === "all" || w.status.toLowerCase() === savedView);

  return (<>
    <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
      {Object.entries(views).map(([k, v]) => (
        <button key={k} style={{ padding: "6px 14px", borderRadius: 6, border: `1px solid ${savedView === k ? "#3b82f6" : "#27272a"}`, background: savedView === k ? "#3b82f618" : "transparent", color: savedView === k ? "#3b82f6" : "#71717a", cursor: "pointer", fontFamily: "inherit", fontSize: 11, fontWeight: savedView === k ? "600" : "400" }}
          onClick={() => setSavedView(k)}>{v} {k !== "all" && <span style={{ marginLeft: 4, opacity: 0.6 }}>({TEMPORAL_WORKFLOWS.filter(w => k === "all" || w.status.toLowerCase() === k).length})</span>}</button>
      ))}
    </div>
    <table style={S.tbl}><thead><tr>
      <th style={S.th}>Workflow ID</th><th style={S.th}>Type</th><th style={S.th}>Status</th><th style={S.th}>Start Time</th><th style={S.th}>Task Queue</th><th style={S.th}>Memo</th>
    </tr></thead><tbody>
      {filtered.map(w => (
        <tr key={w.id} style={S.row} onClick={() => onSelect(w)}
          onMouseEnter={e => { e.currentTarget.style.background = "#18181b"; }} onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}>
          <td style={S.td}><span style={S.mono}>{w.id}</span></td>
          <td style={S.td}><span style={{ fontWeight: "600" }}>{w.type}</span></td>
          <td style={S.td}><span style={S.badge(C[w.status])}><span style={S.statusDot(C[w.status])} />{w.status}</span></td>
          <td style={S.td}><span style={{ color: "#71717a", fontSize: 11 }}>{fmtTime(w.startTime)}</span></td>
          <td style={S.td}><span style={S.tag("#a78bfa")}>{w.taskQueue}</span></td>
          <td style={S.td}><span style={{ color: "#a1a1aa", fontSize: 11 }}>{w.memo}</span></td>
        </tr>
      ))}
    </tbody></table>
  </>);
}

function TemporalTimelineView() {
  const maxTime = 12000;
  return (<>
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 16, fontWeight: "bold", marginBottom: 4 }}>OrderProcessing</div>
      <div style={{ display: "flex", gap: 12, fontSize: 11, color: "#71717a" }}>
        <span style={S.mono}>order-proc-a8f2</span><span>•</span><span style={S.badge(C.Running)}>Running</span><span>•</span><span>Started 14:00:00</span>
      </div>
    </div>
    <div style={{ background: "#18181b", borderRadius: 10, padding: 16, border: "1px solid #27272a" }}>
      {/* Time ruler */}
      <div style={{ display: "flex", marginBottom: 8, paddingLeft: 152 }}>
        {[0, 3, 6, 9, 12].map(s => <span key={s} style={{ flex: 1, fontSize: 9, color: "#52525b" }}>{s}s</span>)}
      </div>
      {TEMPORAL_TIMELINE.map(evt => {
        const end = evt.end || maxTime;
        const isPoint = evt.type === "signal";
        return (
          <div key={evt.id} style={S.timelineRow}>
            <div style={S.timelineLabel}>
              <span style={{ color: C[evt.type] || "#888" }}>{evt.name}</span>
            </div>
            <div style={S.timelineTrack}>
              <div style={{ position: "absolute", inset: 0, background: "#27272a22", borderRadius: 3 }} />
              {isPoint ? (
                <div style={{ position: "absolute", left: `${(evt.start / maxTime) * 100}%`, top: 8, width: 8, height: 8, borderRadius: "50%", background: C[evt.type], transform: "translateX(-50%)" }} />
              ) : (
                <div style={{
                  position: "absolute", left: `${(evt.start / maxTime) * 100}%`,
                  width: `${Math.max(((end - evt.start) / maxTime) * 100, 0.5)}%`,
                  height: 18, top: 3, borderRadius: 4,
                  background: (C[evt.type] || "#555") + "44",
                  border: `1px solid ${(C[evt.type] || "#555")}66`,
                }} />
              )}
            </div>
          </div>
        );
      })}
    </div>
  </>);
}

function TemporalEventHistory() {
  return (<>
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 16, fontWeight: "bold", marginBottom: 4 }}>Event History</div>
      <div style={{ fontSize: 11, color: "#71717a" }}>{TEMPORAL_EVENTS.length} events · OrderProcessing</div>
    </div>
    <div style={{ background: "#18181b", borderRadius: 10, padding: 16, border: "1px solid #27272a" }}>
      {TEMPORAL_EVENTS.map((evt, i) => {
        const col = C[evt.status] || "#888";
        const isChild = evt.type.includes("Child");
        const isSignal = evt.type.includes("Signal");
        const isTimer = evt.type.includes("Timer");
        return (
          <div key={evt.id} style={{ ...S.evtRow, position: "relative" }}>
            {i < TEMPORAL_EVENTS.length - 1 && <div style={{ ...S.evtLine, left: 4 }} />}
            <div style={S.evtDot(col)} />
            <span style={S.mono}>{evt.id}</span>
            <span style={{ color: "#71717a", fontSize: 11, width: 80 }}>{evt.time}</span>
            <span style={{ flex: 1, fontWeight: isChild || isSignal || isTimer ? "600" : "400", color: isChild ? "#a78bfa" : isSignal ? "#a78bfa" : isTimer ? "#f59e0b" : "#e4e4e7", fontSize: 12 }}>
              {evt.type}
            </span>
            <span style={{ ...S.mono, maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{evt.detail}</span>
          </div>
        );
      })}
    </div>
  </>);
}

// ============================================================
// MAIN APP
// ============================================================
export default function App() {
  const [platform, setPlatform] = useState("trigger");
  const [triggerTab, setTriggerTab] = useState("runs");
  const [temporalTab, setTemporalTab] = useState("workflows");
  const [selectedRun, setSelectedRun] = useState(null);
  const [selectedWf, setSelectedWf] = useState(null);

  const triggerTabs = [
    { id: "runs", label: "Runs" },
    { id: "trace", label: "Trace View" },
    { id: "queues", label: "Queues" },
  ];
  const temporalTabs = [
    { id: "workflows", label: "Workflows" },
    { id: "timeline", label: "Timeline" },
    { id: "events", label: "Event History" },
  ];

  const tabs = platform === "trigger" ? triggerTabs : temporalTabs;
  const activeTab = platform === "trigger" ? triggerTab : temporalTab;
  const setActiveTab = platform === "trigger" ? setTriggerTab : setTemporalTab;
  const selected = platform === "trigger" ? selectedRun : selectedWf;

  return (
    <div style={S.root}>
      <div style={S.topBar}>
        <div style={S.logo}>
          <span style={{ color: platform === "trigger" ? "#22c55e" : "#7c3aed" }}>
            {platform === "trigger" ? "⚡" : "⏱"}
          </span>
          <span>{platform === "trigger" ? "Trigger.dev" : "Temporal.io"}</span>
        </div>
        <div style={S.platformToggle}>
          <button style={S.platformBtn(platform === "trigger")} onClick={() => setPlatform("trigger")}>⚡ Trigger.dev</button>
          <button style={S.platformBtn(platform === "temporal")} onClick={() => setPlatform("temporal")}>⏱ Temporal.io</button>
        </div>
      </div>

      <div style={S.tabs}>
        {tabs.map(t => <button key={t.id} style={S.tab(activeTab === t.id)} onClick={() => setActiveTab(t.id)}>{t.label}</button>)}
      </div>

      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        <div style={S.content}>
          {platform === "trigger" && triggerTab === "runs" && <TriggerRunList onSelect={r => { setSelectedRun(r); setTriggerTab("trace"); }} />}
          {platform === "trigger" && triggerTab === "trace" && <TriggerTraceView />}
          {platform === "trigger" && triggerTab === "queues" && <TriggerQueuesView />}
          {platform === "temporal" && temporalTab === "workflows" && <TemporalWorkflowList onSelect={w => { setSelectedWf(w); setTemporalTab("timeline"); }} />}
          {platform === "temporal" && temporalTab === "timeline" && <TemporalTimelineView />}
          {platform === "temporal" && temporalTab === "events" && <TemporalEventHistory />}
        </div>

        {/* Side panel */}
        {selected && <div style={S.panel}>
          <div style={S.panelHead}>
            {platform === "trigger" ? "Run Details" : "Workflow Details"}
            <button onClick={() => { setSelectedRun(null); setSelectedWf(null); }} style={{ float: "right", background: "none", border: "none", color: "#71717a", cursor: "pointer", fontSize: 14 }}>✕</button>
          </div>
          <div style={S.panelBody}>
            {platform === "trigger" && selectedRun && (<>
              <div style={S.panelLabel}>Run ID</div><div style={{ ...S.panelVal, ...S.mono }}>{selectedRun.id}</div>
              <div style={S.panelLabel}>Task</div><div style={S.panelVal}>{selectedRun.task}</div>
              <div style={S.panelLabel}>Status</div><div style={S.panelVal}><span style={S.badge(C[selectedRun.status])}>{selectedRun.status}</span></div>
              <div style={S.panelLabel}>Queue</div><div style={S.panelVal}>{selectedRun.queue}</div>
              <div style={S.panelLabel}>Version</div><div style={{ ...S.panelVal, ...S.mono }}>{selectedRun.version}</div>
              <div style={S.panelLabel}>Attempt</div><div style={S.panelVal}>{selectedRun.attempt}</div>
              <div style={S.panelLabel}>Duration</div><div style={S.panelVal}>{fmtDuration(selectedRun.duration)}</div>
              <div style={S.panelLabel}>Tags</div><div style={S.panelVal}>{selectedRun.tags.map(t => <span key={t} style={S.tag("#3b82f6")}>{t}</span>)}</div>
              {selectedRun.output && <><div style={S.panelLabel}>Output</div><div style={S.panelCode}>{selectedRun.output}</div></>}
            </>)}
            {platform === "temporal" && selectedWf && (<>
              <div style={S.panelLabel}>Workflow ID</div><div style={{ ...S.panelVal, ...S.mono }}>{selectedWf.id}</div>
              <div style={S.panelLabel}>Type</div><div style={S.panelVal}>{selectedWf.type}</div>
              <div style={S.panelLabel}>Status</div><div style={S.panelVal}><span style={S.badge(C[selectedWf.status])}>{selectedWf.status}</span></div>
              <div style={S.panelLabel}>Task Queue</div><div style={S.panelVal}><span style={S.tag("#a78bfa")}>{selectedWf.taskQueue}</span></div>
              <div style={S.panelLabel}>Start Time</div><div style={S.panelVal}>{fmtTime(selectedWf.startTime)}</div>
              {selectedWf.closeTime && <><div style={S.panelLabel}>Close Time</div><div style={S.panelVal}>{fmtTime(selectedWf.closeTime)}</div></>}
              {selectedWf.parentId && <><div style={S.panelLabel}>Parent</div><div style={{ ...S.panelVal, ...S.mono }}>{selectedWf.parentId}</div></>}
              <div style={S.panelLabel}>Memo</div><div style={S.panelVal}>{selectedWf.memo}</div>
            </>)}
          </div>
        </div>}
      </div>
    </div>
  );
}
