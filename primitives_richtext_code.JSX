import { useState, useRef, useCallback, useEffect } from "react";

// ============================================================
// PRIMITIVOS IRREDUTÍVEIS — Pack 1
// Rich Text Block + Code Block
// Funcionais de verdade, não simulação
// ============================================================

// --- RICH TEXT EDITOR ---
// Usa contentEditable + execCommand (funcional real)

function RichTextBlock({ initialContent, onChange, placeholder }) {
  const editorRef = useRef(null);
  const [activeFormats, setActiveFormats] = useState({});
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [wordCount, setWordCount] = useState(0);
  const initialized = useRef(false);

  // Set initial content ONCE via ref, not via React render
  useEffect(() => {
    if (editorRef.current && !initialized.current && initialContent) {
      editorRef.current.innerHTML = initialContent;
      initialized.current = true;
      const text = editorRef.current.innerText || "";
      setWordCount(text.trim() ? text.trim().split(/\s+/).length : 0);
    }
  }, [initialContent]);

  const exec = useCallback((cmd, val) => {
    document.execCommand(cmd, false, val || null);
    editorRef.current?.focus();
    updateActiveFormats();
  }, []);

  const updateActiveFormats = useCallback(() => {
    setActiveFormats({
      bold: document.queryCommandState("bold"),
      italic: document.queryCommandState("italic"),
      underline: document.queryCommandState("underline"),
      strikeThrough: document.queryCommandState("strikeThrough"),
      insertUnorderedList: document.queryCommandState("insertUnorderedList"),
      insertOrderedList: document.queryCommandState("insertOrderedList"),
      justifyLeft: document.queryCommandState("justifyLeft"),
      justifyCenter: document.queryCommandState("justifyCenter"),
      justifyRight: document.queryCommandState("justifyRight"),
    });
  }, []);

  const handleInput = () => {
    const text = editorRef.current?.innerText || "";
    setWordCount(text.trim() ? text.trim().split(/\s+/).length : 0);
    onChange?.(editorRef.current?.innerHTML || "");
  };

  const handleKeyDown = (e) => {
    if (e.key === "b" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); exec("bold"); }
    if (e.key === "i" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); exec("italic"); }
    if (e.key === "u" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); exec("underline"); }
    if (e.key === "Tab") {
      e.preventDefault();
      exec("insertText", "    ");
    }
  };

  const insertLink = () => {
    if (linkUrl) {
      exec("createLink", linkUrl);
      setLinkUrl("");
      setShowLinkInput(false);
    }
  };

  const formatBlock = (tag) => {
    exec("formatBlock", tag);
  };

  const ToolBtn = ({ cmd, icon, label, active }) => (
    <button
      onMouseDown={e => { e.preventDefault(); exec(cmd); }}
      title={label}
      style={{
        width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center",
        background: (active || activeFormats[cmd]) ? "#2563eb22" : "transparent",
        border: "1px solid transparent", borderRadius: 4, cursor: "pointer",
        color: (active || activeFormats[cmd]) ? "#2563eb" : "#888", fontSize: 13,
        fontWeight: (active || activeFormats[cmd]) ? "bold" : "normal",
        fontFamily: "inherit", transition: "all 0.1s",
      }}
    >{icon}</button>
  );

  const Sep = () => <div style={{ width: 1, height: 20, background: "#27272a", margin: "0 4px" }} />;

  return (
    <div style={{ background: "#18181b", border: "1px solid #27272a", borderRadius: 10, overflow: "hidden" }}>
      {/* Toolbar */}
      <div style={{ display: "flex", alignItems: "center", gap: 2, padding: "6px 10px", borderBottom: "1px solid #27272a", flexWrap: "wrap", background: "#0f0f11" }}
        onMouseDown={e => e.preventDefault()}>
        {/* Block format */}
        <select
          onChange={e => { formatBlock(e.target.value); e.target.value = ""; }}
          style={{ padding: "4px 8px", background: "#1a1a1a", border: "1px solid #333", color: "#aaa", borderRadius: 4, fontSize: 11, fontFamily: "inherit", cursor: "pointer", marginRight: 4 }}
          defaultValue="">
          <option value="" disabled>Formato</option>
          <option value="p">Parágrafo</option>
          <option value="h1">Título 1</option>
          <option value="h2">Título 2</option>
          <option value="h3">Título 3</option>
          <option value="blockquote">Citação</option>
          <option value="pre">Código</option>
        </select>

        <Sep />

        <ToolBtn cmd="bold" icon="B" label="Negrito (Ctrl+B)" />
        <ToolBtn cmd="italic" icon="I" label="Itálico (Ctrl+I)" />
        <ToolBtn cmd="underline" icon="U" label="Sublinhado (Ctrl+U)" />
        <ToolBtn cmd="strikeThrough" icon="S" label="Riscado" />

        <Sep />

        <ToolBtn cmd="insertUnorderedList" icon="•" label="Lista" />
        <ToolBtn cmd="insertOrderedList" icon="1." label="Lista Numerada" />

        <Sep />

        <ToolBtn cmd="justifyLeft" icon="≡" label="Alinhar Esquerda" />
        <ToolBtn cmd="justifyCenter" icon="≡" label="Centralizar" />
        <ToolBtn cmd="justifyRight" icon="≡" label="Alinhar Direita" />

        <Sep />

        <button
          onMouseDown={e => { e.preventDefault(); setShowLinkInput(!showLinkInput); }}
          title="Inserir Link"
          style={{ width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center", background: showLinkInput ? "#2563eb22" : "transparent", border: "1px solid transparent", borderRadius: 4, cursor: "pointer", color: showLinkInput ? "#2563eb" : "#888", fontSize: 13, fontFamily: "inherit" }}>
          🔗
        </button>

        <button
          onMouseDown={e => { e.preventDefault(); exec("insertHorizontalRule"); }}
          title="Linha Horizontal"
          style={{ width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center", background: "transparent", border: "1px solid transparent", borderRadius: 4, cursor: "pointer", color: "#888", fontSize: 11, fontFamily: "inherit" }}>
          ―
        </button>

        <button
          onMouseDown={e => { e.preventDefault(); exec("removeFormat"); }}
          title="Limpar Formatação"
          style={{ width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center", background: "transparent", border: "1px solid transparent", borderRadius: 4, cursor: "pointer", color: "#888", fontSize: 11, fontFamily: "inherit" }}>
          ✕
        </button>

        <div style={{ flex: 1 }} />
        <span style={{ fontSize: 10, color: "#52525b" }}>{wordCount} palavras</span>
      </div>

      {/* Link input */}
      {showLinkInput && (
        <div style={{ display: "flex", gap: 6, padding: "8px 10px", borderBottom: "1px solid #27272a", background: "#0f0f11" }}>
          <input
            value={linkUrl} onChange={e => setLinkUrl(e.target.value)}
            placeholder="https://..."
            onKeyDown={e => { if (e.key === "Enter") insertLink(); }}
            style={{ flex: 1, padding: "4px 8px", background: "#1a1a1a", border: "1px solid #333", color: "#eee", borderRadius: 4, fontSize: 12, fontFamily: "inherit", outline: "none" }}
          />
          <button onClick={insertLink} style={{ padding: "4px 12px", background: "#2563eb", color: "#fff", border: "none", borderRadius: 4, fontSize: 11, cursor: "pointer", fontFamily: "inherit" }}>OK</button>
          <button onClick={() => setShowLinkInput(false)} style={{ padding: "4px 8px", background: "transparent", color: "#888", border: "1px solid #333", borderRadius: 4, fontSize: 11, cursor: "pointer", fontFamily: "inherit" }}>✕</button>
        </div>
      )}

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        onKeyUp={updateActiveFormats}
        onMouseUp={updateActiveFormats}
        onFocus={updateActiveFormats}
        data-placeholder={placeholder || "Comece a escrever..."}
        style={{
          minHeight: 300, padding: "16px 20px", outline: "none",
          color: "#e4e4e7", fontSize: 14, lineHeight: 1.8,
          fontFamily: "'Inter','Helvetica Neue',sans-serif",
          overflow: "auto", maxHeight: 500,
        }}
      />

      {/* Editor styles */}
      <style>{`
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: #52525b;
          pointer-events: none;
        }
        [contenteditable] h1 { font-size: 28px; font-weight: 700; color: #fff; margin: 16px 0 8px; line-height: 1.3; }
        [contenteditable] h2 { font-size: 22px; font-weight: 600; color: #e4e4e7; margin: 14px 0 6px; line-height: 1.3; }
        [contenteditable] h3 { font-size: 17px; font-weight: 600; color: #a1a1aa; margin: 12px 0 4px; line-height: 1.3; }
        [contenteditable] blockquote {
          border-left: 3px solid #3b82f6; margin: 12px 0; padding: 8px 16px;
          background: #3b82f608; color: #94a3b8; font-style: italic;
        }
        [contenteditable] pre {
          background: #0a0a0a; padding: 12px 16px; border-radius: 6;
          font-family: 'IBM Plex Mono', monospace; font-size: 13px; color: #a1a1aa;
          overflow-x: auto; margin: 8px 0; border: 1px solid #27272a;
        }
        [contenteditable] a { color: #3b82f6; text-decoration: underline; }
        [contenteditable] ul, [contenteditable] ol { padding-left: 24px; margin: 8px 0; }
        [contenteditable] li { margin: 4px 0; }
        [contenteditable] hr { border: none; border-top: 1px solid #27272a; margin: 16px 0; }
        [contenteditable] b, [contenteditable] strong { color: #fff; }
      `}</style>
    </div>
  );
}

// --- CODE BLOCK ---
// Syntax highlighting com regex, line numbers, language selector

const LANGUAGES = {
  javascript: {
    name: "JavaScript",
    keywords: /\b(const|let|var|function|return|if|else|for|while|class|export|import|from|async|await|try|catch|throw|new|this|typeof|instanceof|switch|case|break|default|continue|do|in|of|yield|void|delete|with)\b/g,
    strings: /(["'`])(?:(?=(\\?))\2[\s\S])*?\1/g,
    comments: /(\/\/.*$|\/\*[\s\S]*?\*\/)/gm,
    numbers: /\b(\d+\.?\d*)\b/g,
    functions: /\b([a-zA-Z_$][\w$]*)\s*(?=\()/g,
    operators: /([+\-*/%=!<>&|^~?:]+)/g,
  },
  python: {
    name: "Python",
    keywords: /\b(def|class|return|if|elif|else|for|while|import|from|as|try|except|finally|raise|with|yield|lambda|pass|break|continue|and|or|not|is|in|True|False|None|self|async|await|print)\b/g,
    strings: /("""[\s\S]*?"""|'''[\s\S]*?'''|"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/g,
    comments: /(#.*$)/gm,
    numbers: /\b(\d+\.?\d*)\b/g,
    functions: /\b([a-zA-Z_][\w]*)\s*(?=\()/g,
    decorators: /(@\w+)/g,
  },
  html: {
    name: "HTML",
    tags: /(<\/?[a-zA-Z][\w-]*)/g,
    attributes: /\s([a-zA-Z-]+)=/g,
    strings: /(".*?"|'.*?')/g,
    comments: /(<!--[\s\S]*?-->)/g,
  },
  sql: {
    name: "SQL",
    keywords: /\b(SELECT|FROM|WHERE|INSERT|INTO|VALUES|UPDATE|SET|DELETE|CREATE|TABLE|ALTER|DROP|INDEX|JOIN|LEFT|RIGHT|INNER|OUTER|ON|AND|OR|NOT|NULL|AS|ORDER|BY|GROUP|HAVING|LIMIT|OFFSET|DISTINCT|COUNT|SUM|AVG|MAX|MIN|LIKE|IN|BETWEEN|EXISTS|UNION|ALL|PRIMARY|KEY|FOREIGN|REFERENCES|CASCADE|DEFAULT|CHECK|UNIQUE|CONSTRAINT)\b/gi,
    strings: /('.*?')/g,
    comments: /(--.*$|\/\*[\s\S]*?\*\/)/gm,
    numbers: /\b(\d+\.?\d*)\b/g,
  },
};

const TOKEN_COLORS = {
  keyword: "#c084fc",
  string: "#86efac",
  comment: "#52525b",
  number: "#fb923c",
  function: "#60a5fa",
  operator: "#f472b6",
  tag: "#f87171",
  attribute: "#fbbf24",
  decorator: "#fbbf24",
  default: "#e4e4e7",
};

function highlightCode(code, lang) {
  const rules = LANGUAGES[lang];
  if (!rules) return escapeHtml(code);

  let html = escapeHtml(code);

  // Apply highlighting in order: comments first (highest priority), then strings, then keywords, etc.
  const replacements = [];

  const processRule = (regex, tokenType) => {
    const re = new RegExp(regex.source, regex.flags);
    let match;
    // We need to work on original code to get positions
    const origRe = new RegExp(regex.source, regex.flags);
    while ((match = origRe.exec(code)) !== null) {
      replacements.push({
        start: match.index,
        end: match.index + match[0].length,
        text: match[0],
        type: tokenType,
        priority: tokenType === "comment" ? 0 : tokenType === "string" ? 1 : 2,
      });
    }
  };

  if (rules.comments) processRule(rules.comments, "comment");
  if (rules.strings) processRule(rules.strings, "string");
  if (rules.decorators) processRule(rules.decorators, "decorator");
  if (rules.keywords) processRule(rules.keywords, "keyword");
  if (rules.tags) processRule(rules.tags, "tag");
  if (rules.attributes) processRule(rules.attributes, "attribute");
  if (rules.functions) processRule(rules.functions, "function");
  if (rules.numbers) processRule(rules.numbers, "number");

  // Sort by position, then priority (lower = higher priority)
  replacements.sort((a, b) => a.start - b.start || a.priority - b.priority);

  // Remove overlapping (keep higher priority)
  const filtered = [];
  let lastEnd = 0;
  for (const r of replacements) {
    if (r.start >= lastEnd) {
      filtered.push(r);
      lastEnd = r.end;
    }
  }

  // Build highlighted HTML
  let result = "";
  let pos = 0;
  for (const r of filtered) {
    if (r.start > pos) result += escapeHtml(code.slice(pos, r.start));
    result += `<span style="color:${TOKEN_COLORS[r.type] || TOKEN_COLORS.default}">${escapeHtml(r.text)}</span>`;
    pos = r.end;
  }
  if (pos < code.length) result += escapeHtml(code.slice(pos));

  return result;
}

function escapeHtml(str) {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

const SAMPLE_CODES = {
  javascript: `// Agent workflow orchestrator
const processWorkflow = async (config) => {
  const { steps, context } = config;
  const results = {};

  for (const step of steps) {
    console.log(\`Running: \${step.name}\`);

    try {
      const output = await step.execute(context);
      results[step.name] = { status: "done", output };
      context.previous = output;
    } catch (error) {
      results[step.name] = { status: "failed", error };
      if (step.retries > 0) {
        await retry(step, step.retries);
      }
    }
  }

  return { success: true, results, duration: Date.now() };
};

export default processWorkflow;`,
  python: `# RAG pipeline with Hatchet
import hatchet
from typing import List

@hatchet.workflow(on_events=["query:create"])
class RAGWorkflow:

    @hatchet.step()
    def load_documents(self, ctx) -> dict:
        """Load and parse source documents."""
        url = ctx.workflow_input()["url"]
        docs = fetch_and_parse(url)
        return {"status": "loaded", "count": len(docs)}

    @hatchet.step(parents=["load_documents"])
    async def generate_embeddings(self, ctx) -> dict:
        count = ctx.step_output("load_documents")["count"]
        embeddings = await embed_batch(count)
        return {"embeddings": len(embeddings)}

    @hatchet.step(parents=["generate_embeddings"])
    def query_and_respond(self, ctx) -> dict:
        results = vector_search(ctx.workflow_input()["query"])
        response = llm_generate(results, temperature=0.3)
        return {"answer": response, "sources": len(results)}`,
  html: `<!-- Dashboard component -->
<div class="dashboard-container">
  <header class="dash-header">
    <h1>Agent Monitor</h1>
    <nav class="dash-nav">
      <a href="/agents" class="active">Agents</a>
      <a href="/workflows">Workflows</a>
      <a href="/settings">Settings</a>
    </nav>
  </header>

  <main class="dash-content">
    <section class="agent-grid" id="agents">
      <div class="agent-card" data-status="active">
        <span class="status-dot"></span>
        <h3>backend-api</h3>
        <p>Claude Code &middot; 2h 34m</p>
      </div>
    </section>
  </main>
</div>`,
  sql: `-- Agent execution analytics
SELECT
    a.agent_name,
    COUNT(*) AS total_runs,
    AVG(r.duration_ms) AS avg_duration,
    SUM(CASE WHEN r.status = 'SUCCESS' THEN 1 ELSE 0 END) AS successes,
    SUM(r.tokens_used) AS total_tokens,
    ROUND(SUM(r.cost), 2) AS total_cost
FROM agents a
INNER JOIN runs r ON r.agent_id = a.id
WHERE r.created_at BETWEEN '2026-03-01' AND '2026-03-22'
GROUP BY a.agent_name
ORDER BY total_runs DESC
LIMIT 20;`,
};

function CodeBlock({ initialLang, initialCode, editable }) {
  const [lang, setLang] = useState(initialLang || "javascript");
  const [code, setCode] = useState(initialCode || SAMPLE_CODES[initialLang || "javascript"] || "");
  const [copied, setCopied] = useState(false);
  const [showLineNumbers, setShowLineNumbers] = useState(true);
  const [wrapLines, setWrapLines] = useState(false);
  const textareaRef = useRef(null);
  const highlightRef = useRef(null);

  const lines = code.split("\n");
  const highlighted = highlightCode(code, lang);

  const handleCopy = () => {
    navigator.clipboard?.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLangChange = (newLang) => {
    setLang(newLang);
    if (SAMPLE_CODES[newLang] && !initialCode) {
      setCode(SAMPLE_CODES[newLang]);
    }
  };

  const syncScroll = () => {
    if (textareaRef.current && highlightRef.current) {
      highlightRef.current.scrollTop = textareaRef.current.scrollTop;
      highlightRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  };

  return (
    <div style={{ background: "#0c0c0e", border: "1px solid #27272a", borderRadius: 10, overflow: "hidden" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", borderBottom: "1px solid #27272a", background: "#111113" }}>
        {/* Window dots */}
        <div style={{ display: "flex", gap: 6, marginRight: 8 }}>
          <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#ef4444" }} />
          <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#f59e0b" }} />
          <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#22c55e" }} />
        </div>

        {/* Language tabs */}
        <div style={{ display: "flex", gap: 0, borderRadius: 6, overflow: "hidden", border: "1px solid #27272a" }}>
          {Object.entries(LANGUAGES).map(([key, val]) => (
            <button key={key} onClick={() => handleLangChange(key)} style={{
              padding: "4px 12px", fontSize: 10, fontFamily: "inherit",
              background: lang === key ? "#27272a" : "transparent",
              color: lang === key ? "#fff" : "#71717a",
              border: "none", cursor: "pointer", borderRight: "1px solid #27272a",
            }}>{val.name}</button>
          ))}
        </div>

        <div style={{ flex: 1 }} />

        {/* Controls */}
        <button onClick={() => setShowLineNumbers(!showLineNumbers)}
          style={{ padding: "3px 8px", fontSize: 9, background: showLineNumbers ? "#27272a" : "transparent", border: "1px solid #333", color: "#888", borderRadius: 4, cursor: "pointer", fontFamily: "inherit" }}>
          {showLineNumbers ? "#" : "—"}
        </button>
        <button onClick={() => setWrapLines(!wrapLines)}
          style={{ padding: "3px 8px", fontSize: 9, background: wrapLines ? "#27272a" : "transparent", border: "1px solid #333", color: "#888", borderRadius: 4, cursor: "pointer", fontFamily: "inherit" }}>
          wrap
        </button>
        <button onClick={handleCopy}
          style={{ padding: "3px 10px", fontSize: 10, background: copied ? "#22c55e22" : "transparent", border: `1px solid ${copied ? "#22c55e44" : "#333"}`, color: copied ? "#22c55e" : "#888", borderRadius: 4, cursor: "pointer", fontFamily: "inherit", fontWeight: copied ? "600" : "400" }}>
          {copied ? "Copiado!" : "Copiar"}
        </button>

        <span style={{ fontSize: 10, color: "#52525b" }}>{lines.length} linhas</span>
      </div>

      {/* Code area */}
      <div style={{ position: "relative", fontSize: 13, fontFamily: "'IBM Plex Mono','Courier New',monospace", lineHeight: 1.7 }}>
        {/* Line numbers */}
        {showLineNumbers && (
          <div style={{
            position: "absolute", left: 0, top: 0, bottom: 0, width: 48,
            padding: "14px 0", textAlign: "right", color: "#3f3f46",
            fontSize: 12, lineHeight: 1.7, userSelect: "none",
            borderRight: "1px solid #1a1a1c", background: "#0a0a0c",
            overflow: "hidden",
          }}>
            {lines.map((_, i) => (
              <div key={i} style={{ paddingRight: 12, height: "1.7em" }}>{i + 1}</div>
            ))}
          </div>
        )}

        {/* Highlighted display */}
        <div
          ref={highlightRef}
          style={{
            padding: "14px 16px",
            paddingLeft: showLineNumbers ? 64 : 16,
            overflow: "auto", maxHeight: 450,
            whiteSpace: wrapLines ? "pre-wrap" : "pre",
            wordBreak: wrapLines ? "break-all" : "normal",
            color: TOKEN_COLORS.default,
          }}
          dangerouslySetInnerHTML={{ __html: highlighted }}
        />

        {/* Editable textarea overlay */}
        {editable && (
          <textarea
            ref={textareaRef}
            value={code}
            onChange={e => setCode(e.target.value)}
            onScroll={syncScroll}
            spellCheck={false}
            style={{
              position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
              padding: "14px 16px",
              paddingLeft: showLineNumbers ? 64 : 16,
              fontFamily: "'IBM Plex Mono','Courier New',monospace",
              fontSize: 13, lineHeight: 1.7,
              color: "transparent", caretColor: "#fff",
              background: "transparent", border: "none", outline: "none",
              resize: "none", overflow: "auto",
              whiteSpace: wrapLines ? "pre-wrap" : "pre",
              wordBreak: wrapLines ? "break-all" : "normal",
            }}
          />
        )}
      </div>
    </div>
  );
}

// ============================================================
// DEMO APP
// ============================================================

const DEMO_CONTENT = `<h1>Documentação do Fluxo de Agentes</h1>
<p>Este documento descreve a arquitetura do sistema de <b>orquestração de agentes</b> que desenvolvemos. O sistema é composto por três camadas principais.</p>
<h2>Camada 1: Trigger</h2>
<p>Os workflows são iniciados via <i>HTTP webhooks</i>, <i>eventos</i> ou <i>schedules</i>. Cada trigger valida o payload e enfileira na queue apropriada.</p>
<h2>Camada 2: Processamento</h2>
<p>Os agentes LLM processam o conteúdo em paralelo:</p>
<ul>
<li>Análise de conteúdo com Claude Opus</li>
<li>Geração de imagens com DALL-E 3</li>
<li>Transformação de texto para plataformas</li>
</ul>
<h3>Observações importantes</h3>
<blockquote>Todo agente deve ter retry configurado com backoff exponencial. O timeout padrão é 30 segundos para atividades e ilimitado para workflows.</blockquote>
<h2>Camada 3: Output</h2>
<p>Os resultados são salvos no <b>Supabase</b>, distribuídos via CDN, e notificações são enviadas por email e Slack.</p>
<hr>
<p>Para mais detalhes, consulte o código fonte no repositório.</p>`;

export default function App() {
  const [activeDemo, setActiveDemo] = useState("richtext");
  const [editableCode, setEditableCode] = useState(true);

  return (
    <div style={{
      fontFamily: "'Inter','Helvetica Neue',sans-serif",
      background: "#09090b", color: "#e4e4e7",
      minHeight: "100vh", fontSize: 13,
    }}>
      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "12px 20px", borderBottom: "1px solid #27272a", background: "#0c0c0e",
      }}>
        <div style={{ fontSize: 15, fontWeight: "bold", display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ color: "#a78bfa" }}>◈</span> Primitivos Irredutíveis
          <span style={{ fontSize: 9, padding: "2px 8px", borderRadius: 8, background: "#a78bfa15", border: "1px solid #a78bfa30", color: "#a78bfa" }}>Pack 1</span>
        </div>
        <div style={{ display: "flex", borderRadius: 8, overflow: "hidden", border: "1px solid #27272a" }}>
          <button onClick={() => setActiveDemo("richtext")} style={{
            padding: "6px 16px", background: activeDemo === "richtext" ? "#18181b" : "transparent",
            color: activeDemo === "richtext" ? "#fff" : "#71717a", border: "none", cursor: "pointer",
            fontFamily: "inherit", fontSize: 12, fontWeight: activeDemo === "richtext" ? "600" : "400",
          }}>Rich Text</button>
          <button onClick={() => setActiveDemo("code")} style={{
            padding: "6px 16px", background: activeDemo === "code" ? "#18181b" : "transparent",
            color: activeDemo === "code" ? "#fff" : "#71717a", border: "none", cursor: "pointer",
            fontFamily: "inherit", fontSize: 12, fontWeight: activeDemo === "code" ? "600" : "400",
          }}>Code Block</button>
          <button onClick={() => setActiveDemo("both")} style={{
            padding: "6px 16px", background: activeDemo === "both" ? "#18181b" : "transparent",
            color: activeDemo === "both" ? "#fff" : "#71717a", border: "none", cursor: "pointer",
            fontFamily: "inherit", fontSize: 12, fontWeight: activeDemo === "both" ? "600" : "400",
          }}>Lado a Lado</button>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: 20, maxWidth: activeDemo === "both" ? 1400 : 900, margin: "0 auto" }}>
        {activeDemo === "richtext" && (<>
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 16, fontWeight: "bold", marginBottom: 4 }}>Rich Text Block</div>
            <div style={{ fontSize: 11, color: "#71717a" }}>contentEditable real — negrito, itálico, headings, listas, links, citações. Atalhos: Ctrl+B, Ctrl+I, Ctrl+U</div>
          </div>
          <RichTextBlock initialContent={DEMO_CONTENT} />
        </>)}

        {activeDemo === "code" && (<>
          <div style={{ marginBottom: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: "bold", marginBottom: 4 }}>Code Block</div>
              <div style={{ fontSize: 11, color: "#71717a" }}>Syntax highlighting real — JS, Python, HTML, SQL. Line numbers, word wrap, copiar.</div>
            </div>
            <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "#71717a", cursor: "pointer" }}>
              <input type="checkbox" checked={editableCode} onChange={e => setEditableCode(e.target.checked)} style={{ accentColor: "#a78bfa" }} />
              Editável
            </label>
          </div>
          <CodeBlock editable={editableCode} />
        </>)}

        {activeDemo === "both" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: "600", marginBottom: 8, color: "#a78bfa" }}>Rich Text</div>
              <RichTextBlock initialContent={DEMO_CONTENT} />
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: "600", marginBottom: 8, color: "#a78bfa" }}>Code Block</div>
              <CodeBlock editable={true} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
