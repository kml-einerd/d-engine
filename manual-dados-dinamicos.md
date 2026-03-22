# Manual: Dados Dinâmicos — De Hardcoded para JSON/Banco

Guia prático para substituir os dados fixos por fontes reais.

---

## Onde estão os dados hoje

Em todos os arquivos que criamos, os dados ficam em constantes no topo:

```js
const SAMPLE_DATA = [
  { id: 1, titulo: "...", status: "Ativo", valor: 5000 },
  { id: 2, titulo: "...", status: "Novo", valor: 1200 },
];
```

O componente lê direto dessa constante via `useState(SAMPLE_DATA)`.
Para tornar dinâmico, você troca essa fonte. Existem 3 níveis:

---

## Nível 1: Arquivo JSON local

O mais simples. Crie um arquivo `data.json` na mesma pasta:

```json
[
  { "id": 1, "titulo": "Item A", "status": "Ativo", "valor": 5000 },
  { "id": 2, "titulo": "Item B", "status": "Novo", "valor": 1200 }
]
```

No componente, troque o hardcoded por um fetch:

```js
// ANTES (hardcoded)
const [items, setItems] = useState(SAMPLE_DATA);

// DEPOIS (JSON local)
const [items, setItems] = useState([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
  fetch('/data.json')
    .then(res => res.json())
    .then(data => { setItems(data); setLoading(false); })
    .catch(err => { console.error(err); setLoading(false); });
}, []);
```

Prós: zero setup, funciona com qualquer servidor estático.
Contras: dados não persistem (edições no app somem no refresh).

---

## Nível 2: API REST (qualquer backend)

Crie endpoints no seu backend (Express, FastAPI, etc):

```
GET    /api/items        → lista todos
POST   /api/items        → cria novo
PUT    /api/items/:id    → atualiza
DELETE /api/items/:id    → deleta
```

No componente, crie funções para cada operação:

```js
const API = '/api/items';

// Carregar
useEffect(() => {
  fetch(API).then(r => r.json()).then(setItems);
}, []);

// Criar
const addItem = async (item) => {
  const res = await fetch(API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(item),
  });
  const created = await res.json();
  setItems(prev => [...prev, created]);
};

// Atualizar
const updateItem = async (id, updates) => {
  await fetch(`${API}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  setItems(prev => prev.map(i => i.id === id ? { ...i, ...updates } : i));
};

// Deletar
const deleteItem = async (id) => {
  await fetch(`${API}/${id}`, { method: 'DELETE' });
  setItems(prev => prev.filter(i => i.id !== id));
};
```

Prós: CRUD completo, dados persistem, funciona com qualquer banco.
Contras: precisa de backend rodando.

---

## Nível 3: Supabase (o mais rápido para produção)

Supabase te dá banco Postgres + API REST + realtime, sem backend.

### Setup

```bash
npm install @supabase/supabase-js
```

Crie um arquivo `supabase.js`:

```js
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  'https://SEU_PROJETO.supabase.co',
  'SUA_ANON_KEY'
);
```

### No componente

```js
import { supabase } from './supabase';

const [items, setItems] = useState([]);

// Carregar
useEffect(() => {
  supabase.from('items').select('*').order('created_at', { ascending: false })
    .then(({ data }) => setItems(data || []));
}, []);

// Criar
const addItem = async (item) => {
  const { data } = await supabase.from('items').insert(item).select().single();
  if (data) setItems(prev => [data, ...prev]);
};

// Atualizar
const updateItem = async (id, updates) => {
  await supabase.from('items').update(updates).eq('id', id);
  setItems(prev => prev.map(i => i.id === id ? { ...i, ...updates } : i));
};

// Deletar
const deleteItem = async (id) => {
  await supabase.from('items').delete().eq('id', id);
  setItems(prev => prev.filter(i => i.id !== id));
};
```

### Realtime (dados atualizam sozinhos)

```js
useEffect(() => {
  const channel = supabase.channel('items-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'items' },
      (payload) => {
        if (payload.eventType === 'INSERT') setItems(prev => [payload.new, ...prev]);
        if (payload.eventType === 'UPDATE') setItems(prev => prev.map(i => i.id === payload.new.id ? payload.new : i));
        if (payload.eventType === 'DELETE') setItems(prev => prev.filter(i => i.id !== payload.old.id));
      }
    )
    .subscribe();

  return () => supabase.removeChannel(channel);
}, []);
```

Prós: zero backend, realtime, auth incluso, free tier generoso.
Contras: vendor lock-in leve (mas é open source, pode self-host).

---

## Como aplicar nos nossos componentes

O padrão é sempre o mesmo. Onde tiver:

```js
// Hardcoded
const [items, setItems] = useState(DADOS_FIXOS);
```

Troque por:

```js
// Dinâmico
const [items, setItems] = useState([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
  carregarDados().then(data => {
    setItems(data);
    setLoading(false);
  });
}, []);
```

E onde tiver operações de CRUD inline:

```js
// ANTES: só muda state local
setItems(prev => [...prev, novoItem]);

// DEPOIS: salva no banco E atualiza state
const saved = await salvarNoBanco(novoItem);
setItems(prev => [...prev, saved]);
```

---

## Mapa de substituição por arquivo

| Arquivo | Constante a substituir | Tabela sugerida |
|---|---|---|
| views-kanban-clickup.jsx | SAMPLE_DATA | tasks |
| views-notion-gallery.jsx | SAMPLE_DATA | documents |
| views-files-table.jsx | FILE_DATA, TABLE_DATA | files, employees |
| screens-trigger-temporal.jsx | TRIGGER_RUNS, TEMPORAL_WORKFLOWS | runs, workflows |
| screens-hatchet-maestro.jsx | HATCHET_RUNS, MAESTRO_AGENTS | runs, agents |
| agent-flow-simulator.jsx | FLOW_NODES, EXEC_SEQUENCE | flow_nodes, executions |
| generative-ui-turbo.jsx | (gerado pela IA) | app_configs |

---

## Padrão de loading e erro

Sempre adicione estados de loading e erro para UX profissional:

```js
const [items, setItems] = useState([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState(null);

useEffect(() => {
  fetchDados()
    .then(data => setItems(data))
    .catch(err => setError(err.message))
    .finally(() => setLoading(false));
}, []);

// No render
if (loading) return <div>Carregando...</div>;
if (error) return <div>Erro: {error}</div>;
// ... render normal
```

---

## Resumo

```
JSON local  → rápido pra prototipar, sem persistência
API REST    → flexível, qualquer backend/banco
Supabase    → mais rápido pra produção, zero backend
```

A engine declarativa e todos os componentes visuais que criamos são
agnósticos à fonte de dados. Eles só precisam de um array de objetos.
De onde vem esse array — hardcoded, JSON, API, Supabase, Firebase —
não muda uma linha do código de UI.
