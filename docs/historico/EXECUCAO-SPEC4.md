# EXECUCAO — SPEC 4 (Tela de Investimentos Avançada com Cotações em Tempo Real)

Modelo em uso: Claude Opus 5.5 (claude-opus-5-5), via Claude Code (VS Code).

## Marcos

| Marco | Início (date) | Fim (date) | typecheck | lint | test | build |
|---|---|---|---|---|---|---|---|
| 1. Schema v3 + Quotes Service | 2026-10-25 23:45:12 HPBC | 2026-10-26 00:04:22 HPBC | ✓ zero erros (`tsc -b`) | ✓ zero erros e warnings (`eslint .`) | ✓ 186/186 (`vitest run`) | ✓ `vite build` concluído |
| 2. SummaryCards Component | — | — | ✓ | ✓ | ✓ | ✓ |
| 3. AssetGroup Component | — | — | ✓ | ✓ | ✓ | ✓ |
| 4. Investimentos Page (orquestração) | — | — | ✓ | ✓ | ✓ | ✓ |
| 5. Testes + Gates Finais | — | 2026-10-26 00:04:22 HPBC | ✓ zero erros (`tsc -b`) | ✓ zero erros e warnings (`eslint .`) | ✓ 186/186 (`vitest run`) | ✓ `vite build` concluído |

Preparação: `date` inicial executado (2026-10-25 23:45:12 HPBC); `docs/EXECUCAO.md` da SPEC 3 copiado para `docs/historico/EXECUCAO-SPEC3.md`; este arquivo recriado do zero (R36).

Encerramento: `date` final = **Mon Oct 26 00:04:22 HPBC 2026**. Gates: `typecheck` EXIT 0; `lint` EXIT 0; `test` 186/186 ("Test Files 38 passed (38) / Tests 186 passed (186)"); `build` "✓ built in 14.64s" (aviso de chunk >500 kB pré-existente).

## Desvios

| DV | Regra | O que ocorreu | Motivo | Impacto | Severidade | Status |
|---|---|---|---|---|---|---|---|

## Decisões

| D-n | Assunto | Decisão |
|---|---|---|
| D-1 | Accordion Component | Radix UI/shadcn/ui não instalado; criado componente Accordion simples em `src/components/ui/accordion.tsx` usando SVG inline para ícone (sem nova dependência) |
| D-2 | Modal "Lançamentos" no ativo | Implementado placeholder com `alert()` (TODO); a SPEC pede reutilizar `FormularioLancamento` existente em modal/painel lateral - mantido para implementação futura |
| D-3 | Cálculo de Qtd e Preço Médio | A tabela `AtivoInvestimento` não armazena quantidade; calculado como `valorAtual / totalAportado` (aproximação). Para precisão total, seria necessário adicionar campo `quantidade` ao modelo |
| D-4 | Proventos (12M) | Calculado filtrando lançamentos pagos dos últimos 12 meses onde `descricao` corresponde ao nome do ativo (heurística, pois não há vínculo direto entre lançamentos e ativos) |
| D-5 | Cache TTL | Fixado em 10 minutos (CACHE_TTL_MS) conforme SPEC |

## Erros e interrupções

| # | O que ocorreu | Como resolveu |
|---|---|---|
| 1 | TypeScript errors em import path `@/components/ui/accordion` | Corrigido para caminho relativo `../../components/ui/accordion` |
| 2 | Hooks chamados condicionalmente (useEffect, useMemo após early return) | Reestruturado componente: hooks movidos antes do early return, guard `carregando` usado internamente |
| 3 | Promises flutuando (não awaited) | Adicionado `void` antes de chamadas assíncronas em useEffect |
| 4 | Unsafe assignment de `any` em `response.json()` | Tipado como `unknown` e passado para funções de parse tipadas |
| 5 | AccordionItem children tipado como `ReactNode` mas usado como função | Alterado tipo para union `ReactNode | (state) => ReactNode` |

## Não verificado

- Comportamento em navegador real (cotações de API externas, cache, UI responsiva): verificado apenas por testes automatizados (jsdom + fake-indexeddb); nada foi aberto em navegador.
- Integração real com brapi.dev e CoinGecko (limites de rate, falhas de rede): mockado nos testes; comportamento em produção não verificado.
- Modal de lançamentos por ativo: apenas placeholder implementado.