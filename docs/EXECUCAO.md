# EXECUCAO — SPEC 3 (Correção Urgente: Dexie Schema e Criação de Lançamentos)

Modelo em uso: Claude Fable 5.1 (claude-fable-5-1[1m]), via Claude Code (VS Code).

## Marcos

| Marco | Início (date) | Fim (date) | typecheck | lint | test | build |
|---|---|---|---|---|---|---|
| Preparação + diagnóstico + correção do Bug 1 | 2026-10-19 20:19:23 HPBC | 2026-10-19 ~21:06 HPBC (gates concluídos; `date` final registrado acima) | ✓ zero erros (`tsc -b`, EXIT: 0) | ✓ zero erros e warnings (`eslint .`, EXIT: 0) | ✓ 183/183 (`vitest run`) | ✓ `vite build` concluído (aviso de chunk >500 kB, pré-existente, fora de escopo) |

Preparação: `date` inicial executado (2026-10-19 20:19:23 HPBC); `docs/EXECUCAO.md` e `docs/RELATORIO-FINAL.md` da SPEC 2 copiados para `docs/historico/` (EXECUCAO-SPEC2.md e RELATORIO-FINAL-SPEC2.md); este arquivo recriado do zero (R36). Linha de base: `npx vitest run` concluída às 20:28:42 — **180/180 testes passaram** (35 arquivos), zero falhas.

Encerramento: `date` final = **segunda-feira, 19 de outubro de 2026 21:37:02 HPBC**.

## Desvios

| DV | Regra | O que ocorreu | Motivo | Impacto | Severidade | Status |
|---|---|---|---|---|---|---|
| DV-1 | R38 (CONFLITO) | A SPEC 3 afirma que o schema está "atualmente na v20" e que faltam 7 tabelas (`metas`, `parceladas`, `orcamentoPlanos`, `recorrentes`, `reservaConfig`, `paymentMethods`, `patrimonioHistorico`) em `src/db/schema.ts`. Verificação nesta sessão: o schema define as versões 1 e 2 e declara **TODAS** as 19 tabelas da interface `Tabelas` — inclusive exatamente as 7 citadas (v1 declara 18; v2 acrescenta `paymentMethods`); não existe versão 20 em nenhum arquivo do código (`grep version\(` só encontra `version(1)` e `version(2)`) | A SPEC foi escrita contra um estado de código anterior/diferente (após a C2 da SPEC 2 o schema foi consolidado em v1+v2) | A ação literal da SPEC (criar v21) seria operação nula; o sintoma real (Painel em "Carregando...") está sendo diagnosticado quanto à causa verdadeira | ALTA | Aberto (CONFLITO — vale a realidade verificada) |
| DV-2 | R38 (CONFLITO) | O objetivo da SPEC 3 anuncia "dois bugs", mas o arquivo contém apenas o Bug 1 (termina dentro do próprio exemplo de código, linha 20); o Bug 2 ("Criação de Lançamentos", citado no título) não está no arquivo | Arquivo da SPEC truncado/incompleto | O Bug 2 não pode ser implementado sem descrição (R10); registrado para o relatório final | ALTA | Aberto (CONFLITO — aguardando complemento da SPEC) |
| DV-3 | R25 | Novo arquivo de teste `src/db/inicializarBanco.test.ts` nomeado em português, seguindo a convenção dos arquivos existentes do projeto | Consistência com o padrão já estabelecido (mesmo tema da DV-1 da SPEC 2, em aberto) | Estético; nenhum efeito funcional | BAIXA | Aberto (mesmo tema da DV-1 da SPEC 2) |

Evidências de ausência de outros desvios (buscas residuais às 21:37, `src`): `\.skip\(|\.only\(|@ts-ignore|@ts-expect-error|eslint-disable|as unknown as` → **0 ocorrências**; `console\.log` → **0**; `config\.hoje\b|toISOString\(\)\.slice` → **0**; `localStorage|sessionStorage` → apenas 3 ocorrências em `src/store/tema.ts` (preferência de tema, permitida pela R22); `new Date\(` em `src/domain` → apenas 2 ocorrências pré-existentes e com argumentos (`contasapagar.ts:55`, `datas.ts:20`), conformes à R16.

## Prova vermelho→verde (Bug 1)

Fase vermelha — `npx vitest run src/db/inicializarBanco.test.ts src/pages/Painel.freshDb.test.tsx` (20:58:56, antes da correção): **2 testes falharam, 1 passou** (3). Falha reais registradas:

- `Painel com banco recém-criado (usuário novo, sem dados de exemplo) > não fica preso em Carregando: mostra o estado vazio` — `TestingLibraryElementError: Unable to find an element with the text: /Sem dados ainda/`; o corpo renderizado contém apenas **"Carregando…"** (sintoma exato relatado na SPEC 3).
- `inicializarBanco — linha padrão de reservaConfig > cria a linha padrão da reserva em um banco vazio` — `AssertionError: expected undefined to deeply equal { id: 1, perfil: 'CLT', …(4) }` (recebido `undefined`: a linha não era criada; reexecução de 21:01:57).

Fase verde — suíte completa `npx vitest run` (21:04:42): **183/183 testes passaram** (37 arquivos; 180 anteriores + 3 novos: 2 de `inicializarBanco` + 1 de `Painel.freshDb`), zero falhas. Gates: `npm run typecheck` (EXIT: 0), `npm run lint` (EXIT: 0), `npm run build` (EXIT: 0, com aviso pré-existente de chunk >500 kB).

## Decisões

| D-n | Assunto | Decisão |
|---|---|---|
| D-1 | Arquivamento | Antes de recriar `docs/EXECUCAO.md` desta execução, os documentos da SPEC 2 foram copiados para `docs/historico/` (EXECUCAO-SPEC2.md, RELATORIO-FINAL-SPEC2.md), preservando o registro (R8/R36) |
| D-2 | Diagnóstico do Bug 1 | A premissa da SPEC (tabelas ausentes) é falsa no código atual; o sintoma "Carregando eterno" será investigado quanto à causa real antes de qualquer correção. Suspeita inicial: linha única de `reservaConfig` nunca criada — `get(1)` em tabela vazia resolve `undefined` e a tela nunca sai do estado Carregando |
| D-3 | Correção do Bug 1 | A causa real confirmada: `inicializarBanco` (chamado em `main.tsx` na inicialização) criava configuração, categorias, contas e formas de pagamento, mas **não** a linha única de `reservaConfig` (id 1). Com banco de usuário novo, `db.reservaConfig.get(1)` resolve `undefined`, `useLiveQuery` mantém `undefined` e `Painel.tsx` (linha 68) e `Reserva.tsx` (linha 23) ficam eternamente em "Carregando...". Corrigido criando a linha padrão (id 1, perfil "CLT", mesesAjustados null, contaId null, gastoEssencialManual null, aporteMensal 0) dentro de `inicializarBanco` (`src/db/db.ts`), sem criar versão 21 de schema — todas as tabelas já são criadas por v1+v2 (DV-1) |

## Erros e interrupções

| # | O que ocorreu | Como resolveu |
|---|---|---|
| 1 | Fase vermelha 1ª tentativa (20:50:05): os 2 testes novos falharam com `DatabaseClosedError: Database has been closed` — motivo de infraestrutura, não o desejado: após `db.delete()` o singleton Dexie fica fechado e `inicializarBanco()` não reabre automaticamente | Adicionado `await db.open()` após o `db.delete()` nos `beforeEach` dos dois arquivos de teste; fase vermelha será reexecutada |

## Não verificado

- Comportamento em navegador real (sintoma original relatado pelo usuário): a verificação nesta sessão é por leitura de código e testes automatizados (jsdom/fake-indexeddb); nada foi aberto em navegador.
