import { useState, useRef, useCallback, useMemo, useEffect } from "react";

// ============================================================
// PRIMITIVOS IRREDUTÍVEIS — Pack 3
// Spreadsheet Cell + Tree Node (Org Chart)
// ============================================================

// --- SPREADSHEET ---

const COLS = ["A","B","C","D","E","F","G","H"];
const ROWS = 20;

function initGrid() {
  const g = {};
  // Headers
  [["A1","Produto"],["B1","Categoria"],["C1","Preco Unit"],["D1","Quantidade"],["E1","Subtotal"],["F1","Desconto %"],["G1","Total"],["H1","Status"]].forEach(([k,v]) => g[k] = { v, f: null });
  // Data
  const data = [
    ["Notebook Pro","Eletronico",4500,12,null,10,null,"Ativo"],
    ["Mouse Gamer","Eletronico",250,85,null,5,null,"Ativo"],
    ["Camiseta Dev","Roupa",89,200,null,0,null,"Ativo"],
    ["Teclado Mec","Eletronico",680,45,null,15,null,"Promo"],
    ["Mochila Tech","Acessorio",320,30,null,0,null,"Ativo"],
    ["Monitor 27","Eletronico",2200,8,null,10,null,"Baixo Est"],
    ["Cabo USB-C","Acessorio",45,500,null,0,null,"Ativo"],
    ["Headset Pro","Eletronico",890,22,null,5,null,"Ativo"],
    ["Caneca Code","Acessorio",35,150,null,0,null,"Ativo"],
    ["SSD 1TB","Eletronico",420,60,null,8,null,"Ativo"],
  ];
  data.forEach((row, i) => {
    const r = i + 2;
    g[`A${r}`] = { v: row[0], f: null };
    g[`B${r}`] = { v: row[1], f: null };
    g[`C${r}`] = { v: row[2], f: null };
    g[`D${r}`] = { v: row[3], f: null };
    g[`E${r}`] = { v: null, f: `=C${r}*D${r}` };
    g[`F${r}`] = { v: row[5], f: null };
    g[`G${r}`] = { v: null, f: `=E${r}*(1-F${r}/100)` };
    g[`H${r}`] = { v: row[7], f: null };
  });
  // Totals row
  const tr = 13;
  g[`A${tr}`] = { v: "TOTAL", f: null };
  g[`D${tr}`] = { v: null, f: "=SUM(D2:D11)" };
  g[`E${tr}`] = { v: null, f: "=SUM(E2:E11)" };
  g[`G${tr}`] = { v: null, f: "=SUM(G2:G11)" };
  return g;
}

function evalFormula(formula, grid, visited = new Set()) {
  if (!formula || !formula.startsWith("=")) return formula;
  const expr = formula.slice(1);

  // SUM(range)
  const sumMatch = expr.match(/^SUM\(([A-H])(\d+):([A-H])(\d+)\)$/i);
  if (sumMatch) {
    const [, col, r1, , r2] = sumMatch;
    let sum = 0;
    for (let r = parseInt(r1); r <= parseInt(r2); r++) {
      const ref = `${col.toUpperCase()}${r}`;
      const val = getCellValue(ref, grid, visited);
      sum += Number(val) || 0;
    }
    return sum;
  }

  // Cell references and arithmetic
  let resolved = expr.replace(/([A-H])(\d+)/gi, (match) => {
    const ref = match.toUpperCase();
    if (visited.has(ref)) return 0; // circular ref protection
    const val = getCellValue(ref, grid, visited);
    return Number(val) || 0;
  });

  try {
    // Safe eval with only math operations
    const result = Function(`"use strict"; return (${resolved})`)();
    return typeof result === "number" ? Math.round(result * 100) / 100 : result;
  } catch {
    return "#ERR";
  }
}

function getCellValue(ref, grid, visited = new Set()) {
  const cell = grid[ref];
  if (!cell) return "";
  if (cell.f) {
    visited.add(ref);
    return evalFormula(cell.f, grid, new Set(visited));
  }
  return cell.v ?? "";
}

function Spreadsheet() {
  const [grid, setGrid] = useState(initGrid);
  const [editing, setEditing] = useState(null); // "A1"
  const [editVal, setEditVal] = useState("");
  const [selected, setSelected] = useState(null);
  const [colWidths, setColWidths] = useState({ A: 130, B: 100, C: 90, D: 90, E: 100, F: 80, G: 100, H: 80 });
  const inputRef = useRef(null);

  const startEdit = (ref) => {
    const cell = grid[ref];
    setEditing(ref);
    setEditVal(cell?.f || String(cell?.v ?? ""));
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const commitEdit = () => {
    if (!editing) return;
    const isFormula = editVal.startsWith("=");
    setGrid(prev => ({
      ...prev,
      [editing]: isFormula ? { v: null, f: editVal } : { v: isNaN(editVal) || editVal === "" ? editVal : Number(editVal), f: null },
    }));
    setEditing(null);
    setEditVal("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") { commitEdit(); moveSelection(0, 1); }
    if (e.key === "Tab") { e.preventDefault(); commitEdit(); moveSelection(1, 0); }
    if (e.key === "Escape") { setEditing(null); setEditVal(""); }
  };

  const moveSelection = (dc, dr) => {
    if (!selected) return;
    const col = COLS.indexOf(selected[0]);
    const row = parseInt(selected.slice(1));
    const nc = Math.max(0, Math.min(COLS.length - 1, col + dc));
    const nr = Math.max(1, Math.min(ROWS, row + dr));
    setSelected(`${COLS[nc]}${nr}`);
  };

  const handleGridKey = (e) => {
    if (editing) return;
    if (!selected) return;
    if (e.key === "ArrowDown") { e.preventDefault(); moveSelection(0, 1); }
    if (e.key === "ArrowUp") { e.preventDefault(); moveSelection(0, -1); }
    if (e.key === "ArrowRight") { e.preventDefault(); moveSelection(1, 0); }
    if (e.key === "ArrowLeft") { e.preventDefault(); moveSelection(-1, 0); }
    if (e.key === "Enter") { e.preventDefault(); startEdit(selected); }
    if (e.key === "Delete" || e.key === "Backspace") {
      setGrid(prev => ({ ...prev, [selected]: { v: "", f: null } }));
    }
    if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
      startEdit(selected);
      setEditVal(e.key);
    }
  };

  // Column resize
  const startColResize = (col, e) => {
    e.preventDefault(); e.stopPropagation();
    const startX = e.clientX;
    const startW = colWidths[col];
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    const mm = (ev) => {
      const w = Math.max(50, startW + ev.clientX - startX);
      setColWidths(prev => ({ ...prev, [col]: w }));
    };
    const mu = () => {
      window.removeEventListener("mousemove", mm);
      window.removeEventListener("mouseup", mu);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
    window.addEventListener("mousemove", mm);
    window.addEventListener("mouseup", mu);
  };

  const isHeader = (row) => row === 1;
  const isTotal = (ref) => grid[ref]?.v === "TOTAL" || (ref[0] >= "D" && parseInt(ref.slice(1)) === 13);

  const fmtVal = (ref) => {
    const val = getCellValue(ref, grid);
    if (val === "" || val === null || val === undefined) return "";
    if (typeof val === "number" && (ref[0] === "C" || ref[0] === "E" || ref[0] === "G")) {
      return val.toLocaleString("pt-BR", { minimumFractionDigits: 2 });
    }
    return String(val);
  };

  const statusColor = (val) => {
    if (val === "Ativo") return "#34a853";
    if (val === "Promo") return "#fbbc04";
    if (val === "Baixo Est") return "#ea4335";
    return "#70757a";
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }} tabIndex={0} onKeyDown={handleGridKey}>
      {/* Formula bar */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 12px", borderBottom: "1px solid #dadce0", background: "#f8f9fa" }}>
        <div style={{ width: 60, padding: "4px 8px", background: "#fff", border: "1px solid #dadce0", borderRadius: 4, fontSize: 12, textAlign: "center", color: "#3c4043", fontWeight: "500" }}>
          {selected || ""}
        </div>
        <div style={{ fontSize: 14, color: "#70757a", marginRight: 4 }}>fx</div>
        <input
          ref={inputRef}
          value={editing ? editVal : (selected ? (grid[selected]?.f || String(grid[selected]?.v ?? "")) : "")}
          onChange={e => setEditVal(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={commitEdit}
          readOnly={!editing}
          onClick={() => { if (selected && !editing) startEdit(selected); }}
          style={{ flex: 1, padding: "4px 8px", border: "1px solid #dadce0", borderRadius: 4, fontSize: 13, fontFamily: "'Google Sans',sans-serif", color: "#3c4043", outline: "none", background: editing ? "#fff" : "#f8f9fa" }}
        />
      </div>

      {/* Grid */}
      <div style={{ flex: 1, overflow: "auto" }}>
        <table style={{ borderCollapse: "collapse", tableLayout: "fixed" }}>
          <thead>
            <tr>
              <th style={{ width: 40, minWidth: 40, background: "#f8f9fa", borderBottom: "1px solid #dadce0", borderRight: "1px solid #dadce0", position: "sticky", left: 0, zIndex: 2 }} />
              {COLS.map(col => (
                <th key={col} style={{ width: colWidths[col], minWidth: colWidths[col], background: "#f8f9fa", borderBottom: "1px solid #dadce0", borderRight: "1px solid #e8eaed", padding: "6px 8px", fontSize: 11, color: "#70757a", fontWeight: "500", textAlign: "center", position: "relative", userSelect: "none" }}>
                  {col}
                  <div onMouseDown={e => startColResize(col, e)}
                    style={{ position: "absolute", right: -2, top: 0, bottom: 0, width: 4, cursor: "col-resize", zIndex: 1 }}
                    onMouseEnter={e => { e.currentTarget.style.background = "#4285f4"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: ROWS }, (_, i) => i + 1).map(row => (
              <tr key={row}>
                <td style={{ background: "#f8f9fa", borderBottom: "1px solid #e8eaed", borderRight: "1px solid #dadce0", padding: "0 8px", fontSize: 11, color: "#70757a", textAlign: "center", position: "sticky", left: 0, zIndex: 1, height: 28 }}>
                  {row}
                </td>
                {COLS.map(col => {
                  const ref = `${col}${row}`;
                  const cell = grid[ref];
                  const isSel = selected === ref;
                  const isEd = editing === ref;
                  const val = fmtVal(ref);
                  const isNum = typeof getCellValue(ref, grid) === "number";
                  const isH = isHeader(row);
                  const isT = isTotal(ref);
                  const isStatus = col === "H" && row > 1 && row < 13;

                  return (
                    <td key={ref}
                      onClick={() => { if (!isEd) { setSelected(ref); setEditing(null); } }}
                      onDoubleClick={() => startEdit(ref)}
                      style={{
                        width: colWidths[col], minWidth: colWidths[col], maxWidth: colWidths[col],
                        borderBottom: `1px solid ${isT ? "#dadce0" : "#e8eaed"}`,
                        borderRight: "1px solid #e8eaed",
                        padding: 0, height: 28, position: "relative",
                        background: isEd ? "#fff" : isSel ? "#e8f0fe" : isH ? "#f0f0f0" : isT ? "#f8f9fa" : "#fff",
                        outline: isSel && !isEd ? "2px solid #4285f4" : "none",
                        outlineOffset: -1,
                        cursor: "cell",
                      }}>
                      {isEd ? (
                        <input
                          value={editVal}
                          onChange={e => setEditVal(e.target.value)}
                          onKeyDown={handleKeyDown}
                          onBlur={commitEdit}
                          autoFocus
                          style={{
                            width: "100%", height: "100%", border: "2px solid #4285f4",
                            padding: "0 6px", fontSize: 13, fontFamily: "inherit",
                            color: "#3c4043", outline: "none", boxSizing: "border-box",
                            background: "#fff",
                          }}
                        />
                      ) : (
                        <div style={{
                          padding: "0 8px", lineHeight: "28px", overflow: "hidden",
                          whiteSpace: "nowrap", textOverflow: "ellipsis",
                          fontSize: isH ? 12 : 13,
                          fontWeight: isH || isT ? "600" : "400",
                          color: isH ? "#3c4043" : isT ? "#4285f4" : val === "#ERR" ? "#ea4335" : "#3c4043",
                          textAlign: isNum && !isH ? "right" : "left",
                        }}>
                          {isStatus && val ? (
                            <span style={{
                              display: "inline-block", padding: "1px 8px", borderRadius: 10, fontSize: 10,
                              background: statusColor(val) + "18", color: statusColor(val),
                              border: `1px solid ${statusColor(val)}30`,
                            }}>{val}</span>
                          ) : val}
                          {cell?.f && !isEd && <span style={{ position: "absolute", top: 0, right: 2, fontSize: 7, color: "#4285f4" }}>fx</span>}
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// --- TREE / ORG CHART ---

const ORG_DATA = {
  id: "ceo", name: "Ana Oliveira", role: "CEO", color: "#4285f4", collapsed: false,
  children: [
    {
      id: "cto", name: "Pedro Santos", role: "CTO", color: "#34a853", collapsed: false,
      children: [
        { id: "eng1", name: "Joao Costa", role: "Lead Backend", color: "#0ea5e9", children: [
          { id: "dev1", name: "Lucas Alves", role: "Sr Developer", color: "#0ea5e9", children: [] },
          { id: "dev2", name: "Rafael Gomes", role: "Developer", color: "#0ea5e9", children: [] },
        ]},
        { id: "eng2", name: "Maria Souza", role: "Lead Frontend", color: "#7c3aed", children: [
          { id: "dev3", name: "Julia Ramos", role: "Sr Developer", color: "#7c3aed", children: [] },
          { id: "dev4", name: "Camila Torres", role: "Developer", color: "#7c3aed", children: [] },
        ]},
        { id: "eng3", name: "Carlos Neto", role: "Lead Data", color: "#fbbc04", children: [
          { id: "dev5", name: "Bruno Lima", role: "Data Engineer", color: "#fbbc04", children: [] },
        ]},
      ],
    },
    {
      id: "cpo", name: "Beatriz Dias", role: "CPO", color: "#ea4335", collapsed: false,
      children: [
        { id: "pm1", name: "Fernanda Reis", role: "Product Manager", color: "#ea4335", children: [] },
        { id: "design1", name: "Gabriel Moura", role: "Lead Design", color: "#ea4335", children: [
          { id: "des1", name: "Isabela Cunha", role: "UX Designer", color: "#ea4335", children: [] },
        ]},
      ],
    },
    {
      id: "cfo", name: "Marcos Vieira", role: "CFO", color: "#fb923c", collapsed: false,
      children: [
        { id: "fin1", name: "Patricia Lopes", role: "Controller", color: "#fb923c", children: [] },
        { id: "hr1", name: "Renata Barros", role: "HR Manager", color: "#fb923c", children: [] },
      ],
    },
  ],
};

const NODE_W = 160;
const NODE_H = 64;
const GAP_X = 24;
const GAP_Y = 60;

function layoutTree(node, depth = 0) {
  const result = [];
  const edges = [];

  function measure(n) {
    if (!n.children?.length || n.collapsed) return NODE_W;
    const childWidths = n.children.map(c => measure(c));
    return Math.max(NODE_W, childWidths.reduce((a, b) => a + b, 0) + (n.children.length - 1) * GAP_X);
  }

  function position(n, x, y) {
    const totalW = measure(n);
    const nodeX = x + totalW / 2 - NODE_W / 2;
    result.push({ ...n, x: nodeX, y, w: totalW });

    if (n.children?.length && !n.collapsed) {
      let cx = x;
      n.children.forEach(child => {
        const cw = measure(child);
        position(child, cx, y + NODE_H + GAP_Y);
        edges.push({
          x1: nodeX + NODE_W / 2,
          y1: y + NODE_H,
          x2: cx + cw / 2,
          y2: y + NODE_H + GAP_Y,
        });
        cx += cw + GAP_X;
      });
    }
  }

  const totalW = measure(node);
  position(node, 0, 0);
  return { nodes: result, edges, totalW, totalH: result.reduce((m, n) => Math.max(m, n.y + NODE_H), 0) };
}

function TreeChart() {
  const [data, setData] = useState(ORG_DATA);
  const [selected, setSelected] = useState(null);
  const [zoom, setZoom] = useState(1);

  const toggleCollapse = useCallback((id) => {
    const toggle = (node) => {
      if (node.id === id) return { ...node, collapsed: !node.collapsed };
      return { ...node, children: node.children?.map(toggle) };
    };
    setData(prev => toggle(prev));
  }, []);

  const layout = useMemo(() => layoutTree(data), [data]);

  const findNode = (id, node = data) => {
    if (node.id === id) return node;
    for (const c of (node.children || [])) {
      const found = findNode(id, c);
      if (found) return found;
    }
    return null;
  };

  const selNode = selected ? findNode(selected) : null;
  const countDescendants = (node) => {
    if (!node?.children?.length) return 0;
    return node.children.length + node.children.reduce((s, c) => s + countDescendants(c), 0);
  };

  return (
    <div style={{ display: "flex", height: "100%" }}>
      <div style={{ flex: 1, overflow: "auto", position: "relative", background: "#fafafa" }}>
        {/* Zoom controls */}
        <div style={{ position: "sticky", top: 8, left: 8, zIndex: 10, display: "flex", gap: 4 }}>
          <button onClick={() => setZoom(z => Math.min(1.5, z + 0.1))} style={{ width: 32, height: 32, borderRadius: 8, border: "1px solid #dadce0", background: "#fff", cursor: "pointer", fontSize: 16, color: "#3c4043", display: "flex", alignItems: "center", justifyContent: "center" }}>+</button>
          <button onClick={() => setZoom(z => Math.max(0.4, z - 0.1))} style={{ width: 32, height: 32, borderRadius: 8, border: "1px solid #dadce0", background: "#fff", cursor: "pointer", fontSize: 16, color: "#3c4043", display: "flex", alignItems: "center", justifyContent: "center" }}>-</button>
          <span style={{ display: "flex", alignItems: "center", padding: "0 8px", fontSize: 11, color: "#70757a" }}>{Math.round(zoom * 100)}%</span>
          <button onClick={() => setZoom(1)} style={{ padding: "0 12px", height: 32, borderRadius: 8, border: "1px solid #dadce0", background: "#fff", cursor: "pointer", fontSize: 11, color: "#3c4043", fontFamily: "inherit" }}>Reset</button>
        </div>

        <div style={{ transform: `scale(${zoom})`, transformOrigin: "top center", padding: "40px 40px 80px", minWidth: layout.totalW + 80 }}>
          <svg style={{ position: "absolute", top: 0, left: 0, width: layout.totalW + 80, height: layout.totalH + 120, pointerEvents: "none" }}>
            {layout.edges.map((e, i) => {
              const my = (e.y1 + e.y2) / 2;
              return (
                <path key={i} d={`M${e.x1 + 40},${e.y1 + 40} C${e.x1 + 40},${my + 40} ${e.x2 + 40},${my + 40} ${e.x2 + 40},${e.y2 + 40}`}
                  fill="none" stroke="#dadce0" strokeWidth={2} />
              );
            })}
          </svg>

          {layout.nodes.map(node => {
            const isSel = selected === node.id;
            const hasKids = node.children?.length > 0;
            return (
              <div key={node.id} onClick={() => setSelected(isSel ? null : node.id)}
                style={{
                  position: "absolute", left: node.x + 40, top: node.y + 40,
                  width: NODE_W, height: NODE_H,
                  background: "#fff", borderRadius: 12,
                  border: `2px solid ${isSel ? node.color : "#e8eaed"}`,
                  boxShadow: isSel ? `0 4px 16px ${node.color}33` : "0 1px 4px rgba(0,0,0,0.08)",
                  cursor: "pointer", overflow: "hidden",
                  display: "flex", alignItems: "center", gap: 10, padding: "0 12px",
                  transition: "border 0.2s, box-shadow 0.2s",
                }}>
                {/* Avatar */}
                <div style={{
                  width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
                  background: node.color + "18", color: node.color,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 13, fontWeight: "600",
                }}>
                  {node.name.split(" ").map(n => n[0]).join("")}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: "600", color: "#3c4043", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{node.name}</div>
                  <div style={{ fontSize: 10, color: "#70757a" }}>{node.role}</div>
                </div>

                {/* Collapse toggle */}
                {hasKids && (
                  <div onClick={e => { e.stopPropagation(); toggleCollapse(node.id); }}
                    style={{
                      position: "absolute", bottom: -14, left: "50%", transform: "translateX(-50%)",
                      width: 22, height: 22, borderRadius: "50%", background: "#fff",
                      border: "2px solid #dadce0", display: "flex", alignItems: "center",
                      justifyContent: "center", fontSize: 12, color: "#70757a", cursor: "pointer",
                      zIndex: 5,
                    }}>
                    {node.collapsed ? "+" : "-"}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Detail panel */}
      {selNode && (
        <div style={{ width: 260, borderLeft: "1px solid #dadce0", padding: 20, background: "#fff", overflow: "auto", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
            <div style={{
              width: 48, height: 48, borderRadius: "50%", background: selNode.color + "18",
              color: selNode.color, display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 16, fontWeight: "600",
            }}>
              {selNode.name.split(" ").map(n => n[0]).join("")}
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: "500", color: "#3c4043" }}>{selNode.name}</div>
              <div style={{ fontSize: 12, color: "#70757a" }}>{selNode.role}</div>
            </div>
          </div>
          {[
            ["ID", selNode.id],
            ["Reports diretos", selNode.children?.length || 0],
            ["Total na equipe", countDescendants(selNode)],
          ].map(([k, v]) => (
            <div key={k} style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 10, color: "#70757a", textTransform: "uppercase", marginBottom: 2 }}>{k}</div>
              <div style={{ fontSize: 13, color: "#3c4043" }}>{v}</div>
            </div>
          ))}
          {selNode.children?.length > 0 && <>
            <div style={{ fontSize: 10, color: "#70757a", textTransform: "uppercase", marginTop: 12, marginBottom: 6 }}>Reports diretos</div>
            {selNode.children.map(c => (
              <div key={c.id} onClick={() => setSelected(c.id)}
                style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", cursor: "pointer", borderBottom: "1px solid #f1f3f4" }}>
                <div style={{ width: 24, height: 24, borderRadius: "50%", background: c.color + "18", color: c.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: "600" }}>
                  {c.name.split(" ").map(n => n[0]).join("")}
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: "500", color: "#3c4043" }}>{c.name}</div>
                  <div style={{ fontSize: 10, color: "#70757a" }}>{c.role}</div>
                </div>
              </div>
            ))}
          </>}
        </div>
      )}
    </div>
  );
}

// ============================================================
// MAIN
// ============================================================

export default function App() {
  const [active, setActive] = useState("spreadsheet");

  return (
    <div style={{ fontFamily: "'Google Sans','Roboto',sans-serif", background: "#fff", color: "#3c4043", height: "100vh", display: "flex", flexDirection: "column", fontSize: 14 }}>
      <div style={{ display: "flex", alignItems: "center", padding: "8px 16px", borderBottom: "1px solid #dadce0" }}>
        <span style={{ fontSize: 18, display: "flex", alignItems: "center", gap: 10, color: "#3c4043" }}>
          <span style={{ color: "#34a853", fontSize: 22 }}>&#9672;</span> Primitivos
          <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 10, background: "#ceead6", color: "#137333" }}>Pack 3</span>
        </span>
        <div style={{ flex: 1 }} />
        <div style={{ display: "flex", borderRadius: 20, overflow: "hidden", border: "1px solid #dadce0" }}>
          <button onClick={() => setActive("spreadsheet")} style={{ padding: "6px 20px", background: active === "spreadsheet" ? "#ceead6" : "#fff", color: active === "spreadsheet" ? "#137333" : "#5f6368", border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: 13, fontWeight: active === "spreadsheet" ? "500" : "400" }}>Spreadsheet</button>
          <button onClick={() => setActive("tree")} style={{ padding: "6px 20px", background: active === "tree" ? "#ceead6" : "#fff", color: active === "tree" ? "#137333" : "#5f6368", border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: 13, fontWeight: active === "tree" ? "500" : "400" }}>Org Chart</button>
        </div>
      </div>
      <div style={{ flex: 1, overflow: "hidden" }}>
        {active === "spreadsheet" && <Spreadsheet />}
        {active === "tree" && <TreeChart />}
      </div>
    </div>
  );
}
