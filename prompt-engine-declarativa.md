# Prompt: Engine Declarativa de UI

Use este documento como instrução para qualquer IA gerar e expandir a engine.
Cole isso no início da conversa com a IA.

---

## O que é

Uma engine React em arquivo único que transforma um objeto de configuração (APP_CONFIG) em interface funcional completa — sem escrever HTML, CSS ou lógica manual.

O usuário edita APENAS o objeto de config. A engine interpreta e renderiza tudo.

## Arquitetura

```
APP_CONFIG (dados declarativos)
    ↓
Engine (interpreta e renderiza)
    ↓
UI funcional (CRUD + Dashboard + Fluxos dinâmicos)
```

O arquivo tem duas zonas claramente separadas:

1. **ZONA DO USUÁRIO** (topo): objeto `APP_CONFIG` — é a única coisa que se edita
2. **ZONA DA ENGINE** (abaixo): componentes React que leem o config — nunca se edita

## Estrutura do APP_CONFIG

```js
const APP_CONFIG = {
  title: "Nome do App",
  pages: {
    NomeDaPagina: {
      crud: { ... },   // opcional: formulário + tabela
      dash: { ... },   // opcional: cards + gráficos
    },
    OutraPagina: { ... }
  }
}
```

### Cada página pode ter:

### crud (formulário + tabela + busca)

```js
crud: {
  fields: {
    nome_do_campo: {
      type: "text" | "email" | "number" | "select" | "textarea",
      required: true | false,           // opcional
      options: ["A", "B", "C"],         // só pra type: "select"
      showIf: {                         // opcional: campo condicional
        field: "outro_campo",
        equals: "valor"
      }
    }
  }
}
```

Regras do CRUD:
- Cada field vira um input no formulário automaticamente
- O nome da key vira o label (capitalizado)
- Fields com `showIf` só aparecem quando a condição é verdadeira
- Fields com `showIf` NÃO aparecem como coluna na tabela
- Fields `select` aparecem como tags coloridas na tabela
- A tabela tem busca automática (filtra em todos os campos)
- Ações de editar e deletar em cada linha

### dash (cards de métricas + gráficos)

```js
dash: {
  cards: [
    { label: "Total", calc: "count" },
    { label: "Ativos", calc: "count", where: { status: "Ativo" } },
    { label: "Receita", calc: "sum", field: "valor", prefix: "R$" },
    { label: "Ticket Médio", calc: "avg", field: "valor", prefix: "R$" },
    { label: "Custom", calc: "custom", fn: (items) => items.length * 2 }
  ],
  charts: [
    { type: "bar", groupBy: "campo", label: "Título do Gráfico" }
  ]
}
```

Regras do Dashboard:
- Cards calculam métricas automaticamente dos dados do CRUD
- `calc: "count"` conta registros (com filtro opcional via `where`)
- `calc: "sum"` soma um campo numérico
- `calc: "avg"` faz média de um campo numérico
- `calc: "custom"` recebe função que processa os items
- `prefix` adiciona texto antes do valor (ex: "R$")
- Charts agrupam dados por um campo e mostram barras horizontais

## Regras de implementação para a IA

### Obrigatórias:
1. Arquivo único React (.jsx), sem dependências externas
2. Estilos inline (objeto JS), sem CSS externo, sem Tailwind
3. Estética terminal/hacker: fundo escuro (#111), texto claro, verde (#0f0) como accent
4. Font monospace (Courier New)
5. State management com useState/useMemo apenas
6. Dados ficam em memória (useState), sem persistência
7. Navegação entre páginas via abas no topo
8. Formulário abre/fecha com botão "+ Novo"
9. Busca filtra em todos os campos simultaneamente
10. Campos condicionais (showIf) reagem em tempo real

### Proibidas:
1. NÃO usar localStorage, sessionStorage, ou qualquer browser storage
2. NÃO criar múltiplos arquivos
3. NÃO usar bibliotecas externas (recharts, chart.js, etc)
4. NÃO usar form tags HTML
5. NÃO adicionar features que o APP_CONFIG não pediu

## Como pedir expansões para a IA

### Adicionar nova página:
"Adiciona uma página Pedidos no APP_CONFIG com campos: cliente (text, required), 
valor (number), status (select: Aberto/Pago/Cancelado), motivo (textarea, showIf 
status = Cancelado). Dashboard com card de total e gráfico por status."

### Adicionar nova feature na engine:
"Expande a engine pra suportar [feature]. Mantém a separação CONFIG vs ENGINE. 
O usuário deve conseguir usar a feature apenas adicionando propriedades no APP_CONFIG, 
sem mexer na engine."

### Exemplos de expansões possíveis:

**Multi-step wizard:**
```js
crud: {
  steps: [
    { title: "Dados Pessoais", fields: { nome: ..., email: ... } },
    { title: "Endereço", fields: { rua: ..., cidade: ... } },
  ]
}
```

**Validação customizada:**
```js
fields: {
  email: { type: "email", validate: "email" },
  cpf:   { type: "text", validate: "cpf", mask: "999.999.999-99" },
  idade: { type: "number", min: 18, max: 120 }
}
```

**Relacionamento entre páginas:**
```js
fields: {
  cliente: { type: "ref", refPage: "Clientes", refField: "nome" }
}
```

**Mais tipos de gráfico:**
```js
charts: [
  { type: "pie", groupBy: "status", label: "Distribuição" },
  { type: "line", field: "valor", over: "data", label: "Evolução" }
]
```

**Ações customizadas:**
```js
crud: {
  actions: [
    { label: "Exportar CSV", fn: "exportCsv" },
    { label: "Enviar Email", fn: "sendEmail", showIf: { status: "Ativo" } }
  ]
}
```

**Persistência com Supabase:**
```js
crud: {
  table: "clientes",           // nome da tabela no Supabase
  persist: true,               // ativa sync automático
}
// engine conecta via supabase-js e faz CRUD real
```

## Regra de ouro

> Se o usuário precisa abrir a zona da engine pra fazer algo funcionar,
> a engine falhou. Tudo deve ser configurável via APP_CONFIG.

## Exemplo mínimo completo

```js
const APP_CONFIG = {
  title: "Meu App",
  pages: {
    Tarefas: {
      crud: {
        fields: {
          tarefa:   { type: "text", required: true },
          prazo:    { type: "text" },
          status:   { type: "select", options: ["Pendente", "Feito"] },
        }
      },
      dash: {
        cards: [
          { label: "Total", calc: "count" },
          { label: "Feitas", calc: "count", where: { status: "Feito" } },
        ],
        charts: [
          { type: "bar", groupBy: "status", label: "Progresso" }
        ]
      }
    }
  }
}
```

Isso gera uma página completa com formulário, tabela com busca, 
2 cards de métrica e 1 gráfico de barras. Zero código de UI.
