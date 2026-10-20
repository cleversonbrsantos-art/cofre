# EXECUCAO — SPEC 2 (Correções do Cofre, itens C1 a C4)

Modelo em uso: Claude Fable 5 (claude-fable-5-1), via Claude Code (VS Code).

## Marcos

| Marco | Início (date) | Fim (date) | typecheck | lint | test | build |
|---|---|---|---|---|---|---|
| C1 | 2026-10-18 16:59:05 HPBC (início da execução) | 2026-10-18 ~17:15 | — | — | — | — |
| C2 | 2026-10-18 ~17:15 | 2026-10-18 19:37:16 HPBC | ✓ zero erros (`tsc -b`) | ✓ zero erros e warnings (`eslint .`) | ✓ 117/117 (`vitest run`) | ✓ `vite build` concluído |
| C3 | 2026-10-18 19:37 | 2026-10-18 21:43:46 HPBC | ✓ zero erros (`tsc -b`) | ✓ zero erros e warnings (`eslint .`) | ✓ 159/159 (`vitest run`) | ✓ `vite build` concluído (aviso de chunk >500 kB, pré-existente, fora de escopo) |
| C4 | 2026-10-18 ~22:00 (implementação); fase vermelha 22:34:32 | 2026-10-19 00:45:59 HPBC (gates concluídos) | ✓ zero erros (`tsc -b`) | ✓ zero erros e warnings (`eslint .`) | ✓ 180/180 (`vitest run`) | ✓ `vite build` concluído (aviso de chunk >500 kB, pré-existente, fora de escopo) |

Preparação: `date` inicial executado; `docs/EXECUCAO.md` e `docs/RELATORIO-FINAL.md` da SPEC 1 copiados para `docs/historico/` (EXECUCAO-SPEC1.md e RELATORIO-FINAL-SPEC1.md); este arquivo recriado do zero (R36).

## Desvios

| DV | Regra | O que ocorreu | Motivo | Impacto | Severidade | Status |
|---|---|---|---|---|---|---|
| DV-1 | R25 | Código contém nomes de arquivos e funções em português (ex.: `salvarConfig`, `carregarExemplo`, `salvarPlano`), além de identificadores novos adicionados em C3/C4 seguindo a mesma convenção (`atalhoOrcamento`, `salvarAtalho`, `gravarPlano`, `mudarAtalho`, `mudarPersonalizado`, `lerArquivoTexto`, `prepararImportacao`, `OPCOES_ATALHO`) | A §6 da SPEC 2 veda expressamente corrigir "os nomes de arquivos e funções em português"; os novos seguiram o padrão do arquivo em que foram inseridos | Estético/consistência; nenhum efeito funcional | BAIXA | Aberto (correção vedada pela SPEC em execução) |

## Prova vermelho→verde (C1)

Fase vermelha — `npx vitest run src/domain/debtMethods.test.ts` (17:10:33, antes da correção): **8 testes falharam** (9 passaram). Falhas reais:

- `caso AB / minimo / extra 0` — AssertionError: expected 31 to be 47
- `caso AB / minimo / extra 5000` — AssertionError: expected 25 to be 47
- `caso CD / minimo / extra 5000` — AssertionError: expected 11 to be 15
- `caso CD / avalanche / extra 0` — AssertionError: expected 86993 to be 86996
- `caso CD / minimo / extra 0` — AssertionError: expected 14 to be 15
- `sem redirecionamento: no caso AB com mínimo, a dívida 2 paga exatamente a parcela mínima até o último mês` — AssertionError: expected 31 to be 47
- `extra irrelevante no método mínimo` — AssertionError: expected { metodo: 'minimo', meses: 25, …(6) } to deeply equal { metodo: 'minimo', meses: 31, …(6) }
- `sem valor extra, neve economiza por redirecionamento` — AssertionError: expected 31 to be less than 31

Fase verde — `npx vitest run src/domain/debtMethods.test.ts src/domain/dividas.test.ts` (17:15:54): **23 testes passaram** (17 novos + 6 existentes), zero falhas. Valores exatos das tabelas AB/CD confirmados, incluindo conservação, sem redirecionamento, extra irrelevante, economia por redirecionamento e alerta mantido.

Tela: `src/pages/Dividas.tsx` usa `resultado.jurosMinimo - r.jurosTotais` na coluna "Juros economizados vs. mínimo" — coerente com o domínio corrigido; nenhuma mudança na tela foi necessária.

## Prova vermelho→verde (C2)

Fase vermelha — `npx vitest run src/lib/localDate.test.ts src/hooks/useToday.test.tsx src/db/schema.migration.test.ts src/db/backup.compat.test.ts` (17:36/18:35, antes da implementação): **4 arquivos falharam**.

- `src/lib/localDate.test.ts` — Error: Failed to resolve import "./localDate" from "src/lib/localDate.test.ts". Does the file exist?
- `src/hooks/useToday.test.tsx` e `src/db/schema.migration.test.ts` — mesmos erros de import inexistente (arquivo ainda não criado)
- `src/db/backup.compat.test.ts` — 3 falhas: `AssertionError: expected undefined to be null`; `AssertionError: expected 1 to be 2`; `AssertionError: expected false to be true`

Fase verde — mesmos 4 arquivos (18:46:28): **12 testes passaram**, zero falhas. Suíte completa: 117/117.

## Prova vermelho→verde (C4)

Fase vermelha — `npx vitest run src/domain/referentialIntegrity.test.ts src/db/importPreview.test.ts src/components/ConfirmDialog.test.tsx src/components/ImportPreview.test.tsx src/pages/Contas.confirm.test.tsx src/pages/Cartoes.confirm.test.tsx src/pages/Lancamentos.confirm.test.tsx` (22:34:32, antes da implementação): **2 arquivos falharam por import inexistente** (`Failed to resolve import "./referentialIntegrity"`, `Failed to resolve import "./ImportPreview"` — módulos ainda não criados) e **10 testes falharam** nos arquivos de página (diálogo de confirmação e bloqueio por referência ainda não implementados).

Fase vermelha (pós-implementação) — `npx vitest run` (23:42:57): **5 testes falharam, 16 passaram (21)** nos arquivos ImportPreview.test.tsx (4) e Lancamentos.confirm.test.tsx (1) — causas diagnosticadas e corrigidas (ver Erros e interrupções 4 a 7).

Fase verde — suíte completa `npx vitest run` (00:26:31): **180/180 testes passaram**, zero falhas (35 arquivos de teste; 159 anteriores + 21 novos do C4: 7 referentialIntegrity + 4 importPreview + 4 ImportPreview + 2 Contas.confirm + 2 Cartoes.confirm + 2 Lancamentos.confirm).

## Prova vermelho→verde (C3)

Fase vermelha — `npx vitest run src/domain/categoryRules.test.ts src/domain/paymentMethodRules.test.ts src/domain/shortcutRules.test.ts src/components/ConfirmDialog.test.tsx` (19:48:32, antes da implementação): **4 arquivos falharam, 0 testes executados** — `Failed to resolve import "./categoryRules"` (e paymentMethodRules, shortcutRules, ConfirmDialog: módulos ainda não criados).

Fase verde — mesmo comando (19:56:48): **28 testes passaram** (9 validateCategoryName + 2 countCategoryReferences + 6 validatePaymentMethodName + 2 countPaymentMethodUsage + 5 validateCustomShortcut + 4 ConfirmDialog), zero falhas.

Fase vermelha (componentes C3) — `npx vitest run src/components/CategoriesManager.test.tsx src/components/PaymentMethodsManager.test.tsx src/pages/Orcamento.shortcut.test.tsx` (20:09:40, antes da implementação): **3 arquivos falharam** — `Failed to resolve import "./CategoriesManager"` e `"./PaymentMethodsManager"` (componentes ainda não criados) e os 2 testes do Orcamento falharam (não havia seletor "Atalho de orçamento").

Fase verde (componentes C3) — mesmo comando (20:54:27): **14 testes passaram**, zero falhas. Suíte completa: 159/159 (21:43).

## Decisões

| D-n | Assunto | Decisão |
|---|---|---|
| D-1 | C2 — campo legado `hoje` na linha de configuração | O teste existente `backup.test.ts` (inalterável, R7) insere uma linha de configuração com `hoje` e sem `hojeManual`. Criado o tipo `ConfiguracaoRow` (linha do banco) que tolera `hoje` opcional e `hojeManual` opcional, normalizado com `?? null` na leitura. O modelo `Configuracao` em `models.ts` permanece exatamente como a SPEC pede (`hojeManual: string \| null`, sem `hoje`). |
| D-2 | C2 — infraestrutura de teste | `vitest.global-setup.ts` foi adicionado ao `include` do `tsconfig.node.json` e ao bloco de arquivos do `eslint.config.js` (aditivo, sem enfraquecer regras) para que `tsc -b` e `eslint .` cubram o arquivo novo exigido pela SPEC. |
| D-3 | C2 — timers falsos no teste do hook | `useToday.test.tsx` usa `vi.useFakeTimers({ shouldAdvanceTime: true })` para que o Dexie (que depende de timers para resolução de promises) funcione sob timers falsos; as afirmações do teste (datas 2026-10-18 → 2026-10-19, data manual fixa) não mudaram. |
| D-4 | C2 — fuso nos testes | O fuso `America/Cuiaba` fixado em `vitest.global-setup.ts` (globalSetup) vale para toda a suíte, inclusive os testes existentes, que continuam passando (117/117). |
| D-5 | C3 — soma "exatamente 100" no atalho personalizado | `validateCustomShortcut` compara a soma com tolerância de 1e-9 para neutralizar ruído de ponto flutuante (ex.: 33.3+33.3+33.4). Os casos da SPEC ({50,30,20} ok; {50,30,25} erro; {33.5,33.5,33} ok) comportam-se exatamente como especificado. |
| D-6 | C3 — prop opcional de formas | `FormularioLancamento` recebe `formas?: FormaPagamento[]` com padrão `FORMAS_PAGAMENTO_PADRAO`, para que os selects leiam a tabela `paymentMethods` sem quebrar o teste existente do formulário (que não passa a prop). `Lancamentos.tsx` e `ContasAPagar.tsx` leem a tabela do banco. |
| D-7 | C3 — hook `useConfirm` em arquivo próprio | O hook saiu de `ConfirmDialog.tsx` para `src/hooks/useConfirm.tsx` por causa da regra `react-refresh/only-export-components` do ESLint; `ConfirmDialog.tsx` passa a exportar só o componente. |

## Erros e interrupções

| # | O que ocorreu | Como resolveu |
|---|---|---|
| 4 | C4 — 4 testes de `ImportPreview.test.tsx` presos em "Carregando…" (23:42:57; diagnosticado 00:12) | `jsdom` 25.0.1 **não implementa `File.text()`** (verificado: `typeof f.text === "undefined"` no window do jsdom). A promessa rejeitava sem tratamento e o estado nunca mudava. Trocado `arquivo.text()` por leitura via `FileReader` (helper `lerArquivoTexto`), que funciona em navegador e jsdom, com `try/catch` e exibição do erro. |
| 5 | C4 — `TestingLibraryElementError: Found multiple elements with the role "button" and name "Cancelar"` em `Lancamentos.confirm.test.tsx` (00:13) | A página de Lançamentos tem um botão "Cancelar" no formulário de edição além do do diálogo. Consulta do teste desambiguada com `within(screen.getByRole("alertdialog"))` — a intenção do teste (cancelar não exclui) e a força das asserções não mudaram. |
| 6 | C4 — `AssertionError: expected 'Lançamentos11' to contain '2'` (00:19) | Erro de dado no teste (meu, criado nesta SPEC): o backup de teste tem 1 lançamento e o banco 1; o "2" referia-se às categorias. Asserção ajustada para verificar a linha "Categorias" (2 no backup), preservando a intenção de provar as duas colunas lado a lado. |
| 7 | C4 — `@typescript-eslint/require-await` em `prepareImport` e `no-base-to-string` em `ImportPreview` (00:29/00:44) | `prepareImport` mantém a assinatura `Promise` exigida pela §5.1, com o corpo extraído para o helper síncrono `prepararImportacao`. Em `ImportPreview`, `String(reader.result ?? "")` trocado por verificação `typeof reader.result === "string"`. |
| 1 | C3 — `SchemaError: KeyPath categoriaId/formaPagamento … is not indexed` nos `.modify()` das transações de exclusão/renomeio (20:47) | Os campos não são índices em `parceladas`, `contasPagar`, `assinaturas`, `recorrentes` e `lancamentos.formaPagamento`. Trocado `where("campo").equals(...)` por `filter(...) .modify(...)` nos componentes. |
| 2 | C3 — `TS1128/TS1005` em `src/hooks/useConfirm.ts` (21:44 aprox.) | O arquivo continha JSX mas tinha extensão `.ts`. Renomeado para `useConfirm.tsx`. |
| 3 | C3 — import `useState` não usado em `ConfirmDialog.tsx` após extração do hook | Removido o import excedente (TS6133). |

## Não verificado

- Aparência visual, responsividade em telas estreitas e comportamento em navegadores reais (Edge/Chrome/Firefox/Safari): a verificação foi só por testes automatizados em jsdom/fake-indexeddb; nada foi aberto em navegador nesta execução.
