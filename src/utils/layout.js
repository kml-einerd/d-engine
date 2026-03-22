/**
 * Auto-layout utilities for DAG/graph positioning.
 * Extracted from: agent-flow-simulator
 */

/**
 * Compute topological layers (BFS) from root nodes, then position
 * nodes in a grid layout with no overlap.
 *
 * @param {Object[]} nodes - Array of { id, ... }
 * @param {Object[]} edges - Array of { from, to }
 * @param {Object} opts - { nodeW, nodeH, gapX, gapY, startX, startY }
 * @returns {Object[]} Nodes with computed x, y positions
 */
export function autoLayout(nodes, edges, opts = {}) {
  const {
    nodeW = 160,
    nodeH = 80,
    gapX = 60,
    gapY = 30,
    startX = 40,
    startY = 40,
  } = opts;

  // Build adjacency and in-degree
  const adj = {};
  const inDeg = {};
  nodes.forEach(n => {
    adj[n.id] = [];
    inDeg[n.id] = 0;
  });
  edges.forEach(e => {
    if (adj[e.from]) adj[e.from].push(e.to);
    if (inDeg[e.to] !== undefined) inDeg[e.to]++;
  });

  // BFS layers
  const layers = [];
  const visited = new Set();
  let queue = nodes.filter(n => inDeg[n.id] === 0).map(n => n.id);
  if (queue.length === 0 && nodes.length > 0) queue = [nodes[0].id];

  while (queue.length > 0) {
    layers.push([...queue]);
    queue.forEach(id => visited.add(id));
    const next = [];
    queue.forEach(id => {
      (adj[id] || []).forEach(child => {
        if (!visited.has(child) && !next.includes(child)) {
          next.push(child);
        }
      });
    });
    queue = next;
  }

  // Assign positions
  const positions = {};
  layers.forEach((layer, col) => {
    const totalH = layer.length * nodeH + (layer.length - 1) * gapY;
    const offsetY = startY + (layers.length > 1 ? 0 : 0);
    layer.forEach((id, row) => {
      positions[id] = {
        x: startX + col * (nodeW + gapX),
        y: offsetY + row * (nodeH + gapY) - totalH / 2 + 200,
      };
    });
  });

  return nodes.map(n => ({
    ...n,
    x: positions[n.id]?.x ?? 0,
    y: positions[n.id]?.y ?? 0,
  }));
}

/**
 * Calculate SVG path for a curved edge between two nodes.
 * @param {Object} from - { x, y }
 * @param {Object} to - { x, y }
 * @param {number} nodeW - Node width
 * @returns {string} SVG path d attribute
 */
export function edgePath(from, to, nodeW = 160) {
  const x1 = from.x + nodeW;
  const y1 = from.y + 40;
  const x2 = to.x;
  const y2 = to.y + 40;
  const cx = (x1 + x2) / 2;
  return `M${x1},${y1} C${cx},${y1} ${cx},${y2} ${x2},${y2}`;
}
