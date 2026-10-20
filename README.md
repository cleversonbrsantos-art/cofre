# Cofre

Aplicação web de controle financeiro pessoal, local-first: todos os dados ficam
no seu navegador (IndexedDB). Nada é enviado para servidor algum — o app não
faz nenhuma chamada de rede em tempo de execução.

## Recursos

- **Lançamentos** com contas, cartões, categorias, recorrentes e compras parceladas
- **Orçamento** por categoria com atalhos 50/30/20 e personalizados
- **Fluxo anual**, **Dia a dia** e mapa de calor de categoria × mês
- **Metas**, **reserva de emergência** com perfil de risco e plano de aporte
- **Contas a pagar**, **assinaturas** e **simuladores** (juros compostos,
  independência financeira, custo do hábito)
- **Dívidas** com estratégias mínima/bola de neve/avalanche (60 meses)
- **Investimentos**: rentabilidade, alocação por classe e patrimônio líquido
- **Painel** com 8 indicadores, nota de saúde financeira (5 regras), destaques
  e 13 gráficos no total
- **Tema claro e escuro**, interface responsiva de 360 px a telas largas
- **Exportar e importar backup** em JSON (validado com zod)
- **Dados de exemplo** para explorar o app antes de cadastrar seus dados

## Stack

React 18 · TypeScript (strict) · Vite · Tailwind CSS · React Router ·
Recharts · Dexie (IndexedDB) · Zustand · zod · Vitest + Testing Library

## Como rodar

```bash
npm install        # instalar dependências (uma vez)
npm run dev        # servidor de desenvolvimento
npm run build      # build de produção em dist/
npm run typecheck  # TypeScript sem emitir
npm run lint       # ESLint
npm run test       # Vitest (suíte completa)
npm run format     # Prettier nos fontes
```

## Estrutura

```
src/
  components/   # shell do app, formulário de lançamento, estados de página
  config/       # nome do app e dados padrão (categorias/contas iniciais)
  db/           # Dexie (esquema), backup/exportação, dados de exemplo
  domain/       # funções PURAS de cálculo (dinheiro em centavos, datas ISO)
  pages/        # as 20 telas do app
  store/        # estado global (Zustand)
```

O domínio (`src/domain`) é puro: sem React, sem banco, sem `Date.now()` —
a data "hoje" sempre entra por parâmetro, o que torna os cálculos testáveis.
Dinheiro é sempre inteiro em centavos; conversão para reais só acontece na
borda (formulários e exibição).

## Privacidade

Os dados são gravados exclusivamente no IndexedDB do seu navegador. O botão
"Exportar backup" (Configurações) gera um arquivo JSON que você guarda onde
quiser; "Importar backup" restaura a partir dele.

## Documentação

- `docs/SPEC-app-financas-pessoais.md` — especificação do produto
- `docs/EXECUCAO.md` — registro de execução (marcos, desvios, decisões)
- `docs/RELATORIO-FINAL.md` — relatório final de conformidade
