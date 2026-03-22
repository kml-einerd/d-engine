# d-engine — Arsenal de Componentes UI Declarativos

Biblioteca de componentes React + estilos inline gerados por IA. Cada arquivo JSX na raiz e um modulo autonomo (single-file) que funciona sozinho.

## Estrutura

```
/                           ← Modulos autonomos (single-file JSX)
├── declarative-ui-engine   ← Engine: config JSON → CRUD + Dashboard + Forms
├── generative-ui-chat      ← Engine: chat com IA → gera UI em tempo real
├── generative-ui-turbo     ← Engine: shorthand presets → UI instantanea
├── ui-builder-canvas       ← Builder: arrastar blocos, conectar, lock/unlock
├── ui-builder-v4           ← Builder: undo/redo, cmd palette, 7 views, preview
├── views-kanban-clickup    ← Views: kanban + clickup com CRUD completo
├── views-notion-gallery    ← Views: notion rows + gallery grid
├── views-files-table       ← Views: file browser + tabela sortable
├── screens-trigger-temporal← Screens: Trigger.dev runs + Temporal workflows
├── screens-hatchet-maestro ← Screens: Hatchet DAG + Maestro agents
├── theme-system-demo       ← Sistema: 5 temas + font scales
├── design-playground       ← Sistema: tokens, resize, zoom, modal variants
├── agent-flow-simulator    ← Sistema: DAG pipeline de agentes animado
│
├── src/                    ← Codigo compartilhado (extraido dos modulos)
│   ├── utils/
│   │   ├── calculations.js ← calcCard, shouldShow, autoDash
│   │   ├── parser.js       ← parseFieldShorthand, fieldsToShorthand
│   │   └── layout.js       ← autoLayout (DAG), edgePath (SVG)
│   ├── themes/
│   │   └── index.js        ← THEMES, SCALES, STATUS_COLORS, TAG_COLORS, makeStyles
│   └── index.js            ← Re-exports tudo
│
├── prompt-engine-declarativa.md  ← Prompt para IA reproduzir a engine
└── manual-dados-dinamicos.md     ← Como conectar dados reais (JSON/API/Supabase)
```

## Como usar

Cada arquivo JSX na raiz funciona sozinho como React component. Para usar num projeto:

1. Copie o arquivo desejado para seu projeto
2. Importe como componente React
3. Edite o APP_CONFIG ou INITIAL_DATA no topo do arquivo

## Shorthand de campos

```
nome!          → text, required
email@         → email
valor$         → number, prefix R$
quantidade#    → number
descricao...   → textarea
status:A|B|C   → select com opcoes
```

## Temas disponiveis

hacker (verde/preto), clean (branco/azul), midnight (roxo/escuro), warm (laranja/marrom), pastel (rosa/claro)

## Regras para expansao

- Nunca quebrar a separacao config/engine
- Componentes nunca hardcodam cores — usam theme tokens
- Novos elementos devem ser declarativos (config → render)
- Manter cada modulo como single-file autonomo
