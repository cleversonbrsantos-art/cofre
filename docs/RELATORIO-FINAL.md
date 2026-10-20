# RELATÓRIO FINAL — SPEC 3.1 (Correção do Bug de Lançamentos: id 0 e Falso Sucesso)

## 1. Identificação

- **Modelo:** Claude Fable 5.1 (claude-fable-5-1[1m]) · **Provedor:** Anthropic · **Ferramenta:** Claude Code (extensão VS Code).
- **`date` do início:** `2026-10-19 22:46:57 HPBC` (início do marco SPEC 3.1; a sessão executou antes a SPEC 3, encerrada às 21:37:02 do mesmo dia).
- **`date` do fim:** `Mon Oct 19 23:06:16 HPBC 2026`.
- **Duração total:** ~19 min (relógio de parede).

## 2. Resumo executivo

Entregue a correção do Bug 2 da SPEC 3, descrito pela SPEC 3.1: em `src/pages/Lancamentos.tsx`, a função `salvar` não cria mais o registro com `id: 0`; a criação usa `Omit<Lancamento, "id">` e `db.lancamentos.add`, e o Dexie gera o id (1, 2, 3…). O fechamento do painel e a limpeza do estado continuam ocorrendo só após o `await` do `add` concluir; erro do Dexie é exibido via `<Erro mensagem>` sem fechar o painel (ambos os comportamentos agora cobertos por teste). Criado o teste de componente `src/pages/Lancamentos.criar.test.tsx` (3 testes) para verificar os critérios de aceite 2 e 3. Prova vermelho→verde executada (DV-4: correção temporariamente revertida para a fase vermelha, restaurada em seguida). Suíte final: **186/186 testes** (38 arquivos), `typecheck`/`lint`/`test`/`build` com EXIT 0 em 2026-10-19 23:05–23:06. Desvios desta SPEC: **1** (DV-4, BAIXA, corrigido) e o tema herdado da DV-3 (R25, aberto). DV-2 (Bug 2 sem descrição) foi resolvido por esta SPEC. Nenhum teste pré-existente foi alterado.

## 3. Marcos

| Marco | Início (`date`) | Fim (`date`) | Gates finais | Status |
|---|---|---|---|---|
| SPEC 3.1 — correção do Bug 2 (id: 0 e falso sucesso em Lancamentos) | 2026-10-19 22:46:57 HPBC | 2026-10-19 23:06:16 HPBC | `tsc -b` zero erros (EXIT 0) · `eslint .` zero erros/warnings (EXIT 0) · `vitest run` 186/186 (EXIT 0 recapturado sem pipe) · `vite build` "✓ built in 10.87s" (EXIT 0 recapturado sem pipe; aviso de chunk >500 kB pré-existente) | Completo |

## 4. Declaração de conformidade (R1 a R43)

- R1 — CUMPRIDA
- R2 — CUMPRIDA
- R3 — CUMPRIDA
- R4 — CUMPRIDA
- R5 — CUMPRIDA
- R6 — CUMPRIDA
- R7 — CUMPRIDA
- R8 — CUMPRIDA
- R9 — CUMPRIDA
- R10 — CUMPRIDA
- R11 — CUMPRIDA
- R12 — CUMPRIDA
- R13 — CUMPRIDA
- R14 — CUMPRIDA
- R15 — CUMPRIDA
- R16 — CUMPRIDA
- R17 — CUMPRIDA
- R18 — CUMPRIDA
- R19 — CUMPRIDA
- R20 — CUMPRIDA
- R21 — CUMPRIDA
- R22 — CUMPRIDA
- R23 — CUMPRIDA
- R24 — CUMPRIDA
- R25 — DESVIADA (DV-3)
- R26 — CUMPRIDA
- R27 — CUMPRIDA
- R28 — CUMPRIDA
- R29 — CUMPRIDA
- R30 — CUMPRIDA
- R31 — CUMPRIDA
- R32 — CUMPRIDA
- R33 — CUMPRIDA
- R34 — CUMPRIDA
- R35 — CUMPRIDA
- R36 — CUMPRIDA
- R37 — CUMPRIDA
- R38 — CUMPRIDA
- R39 — CUMPRIDA
- R40 — CUMPRIDA
- R41 — CUMPRIDA
- R42 — CUMPRIDA
- R43 — CUMPRIDA

Total: 42 CUMPRIDAS, 1 DESVIADA (DV-3). Nenhuma lacuna.

Notas de conformidade relevantes:

- **R4/R5:** toda afirmação de resultado cita comando, horário e saída real registrados no `docs/EXECUCAO.md` ou citados aqui. Os EXIT 0 de `test` e `build` foram recapturados ao final sem pipe (`npm run test >/dev/null 2>&1; echo "TEST EXIT: $?"` → `TEST EXIT: 0`; idem build → `BUILD EXIT: 0`), pois a primeira rodada encadeou a saída em `tail`, o que mascara o código de saída real.
- **R7:** nenhum teste pré-existente foi alterado, enfraquecido ou pulado. O único arquivo de teste tocado é novo (`Lancamentos.criar.test.tsx`).
- **R9:** comportamento em navegador real não foi verificado (seção 12); nada foi afirmado como "OK" sem execução nesta sessão.
- **R10:** a única adição além da correção pedida foi o teste novo, justificado como instrumento de verificação dos critérios de aceite 2 e 3 (D-4); nenhuma funcionalidade, tela ou dependência extra.
- **R14:** o marco anterior (SPEC 3) encerrou com os quatro gates zerados às 21:37 (183/183) antes de a SPEC 3.1 iniciar às 22:46.
- **R25:** ver DV-3. O arquivo de teste novo seguiu a convenção em português já estabelecida no projeto; desvio aberto (R39).
- **R33:** nenhum comando git de escrita foi executado; `git status`/`log` não foram necessários além do snapshot da sessão.

## 5. Registro de desvios

| DV | Tipo | Regra | O que ocorreu | Motivo | Impacto | Severidade | Status |
|---|---|---|---|---|---|---|---|
| DV-1 (herdado, SPEC 3) | CONFLITO | R38 | A SPEC 3 afirmava schema "v20" e 7 tabelas ausentes; verificação mostrou schema v1+v2 com todas as 19 tabelas | SPEC escrita contra estado anterior do código | Ação literal seria operação nula; Bug 1 corrigido pela causa real | ALTA | Aberto (conflito decidido pela realidade verificada) |
| DV-2 (herdado, SPEC 3) | CONFLITO | R38 | A SPEC 3 anunciava dois bugs mas descrevia apenas o Bug 1 (arquivo truncado) | Arquivo da SPEC incompleto | Bug 2 não podia ser implementado sem descrição | ALTA | Resolvido (a SPEC 3.1 trouxe a descrição; implementada nesta execução) |
| DV-3 (herdado, SPEC 3; ampliado) | DESVIO | R25 | Arquivos de teste nomeados em português (`inicializarBanco.test.ts`, `Lancamentos.criar.test.tsx`), seguindo a convenção existente | Consistência com o padrão do projeto | Estético; nenhum efeito funcional | BAIXA | Aberto |
| DV-4 (desta SPEC) | DESVIO | §SPEC 3.1 item 4 (registrado por R37) | A correção foi temporariamente revertida (o `id: 0` foi reintroduzido por ~1 minuto) para executar a fase vermelha do teste novo | Provar, por execução (R4), que o teste novo captura o bug em vez de passar trivialmente | Nenhum no estado final: código restaurado às 23:03 e todos os gates zerados às 23:06 | BAIXA | Corrigido (restaurado; verde confirmado) |

Evidência da ausência de outros desvios: `grep` de `\.skip\(|\.only\(|@ts-ignore|@ts-expect-error|eslint-disable|as unknown as|console\.log` em `src` → **0 ocorrências** (executado ao fim desta execução, 23:08).

## 6. Decisões de implementação

| D-n | Ponto | Decisão e motivo |
|---|---|---|
| D-1 a D-3 (herdadas, SPEC 3) | Arquivamento, diagnóstico do Bug 1 e sua correção | Registradas no `docs/EXECUCAO.md` da execução anterior, mantidas sem alteração |
| D-4 | Verificação dos critérios 2 e 3 da SPEC 3.1 | Criado `src/pages/Lancamentos.criar.test.tsx` (3 testes) exercitando a página real com fake-indexeddb: criação com id gerado pelo Dexie e aparição imediata na lista; submissão inválida com mensagem de erro e painel aberto; erro do Dexie exibindo `<Erro mensagem>` com painel aberto. Motivo: R4/R9 — comportamento de UI só pode ser afirmado com execução real, e o único instrumento disponível nesta sessão é a suíte automatizada |
| D-5 | Fase vermelha com código já corrigido | Como a correção já havia sido aplicada, a fase vermelha foi obtida revertendo-a temporariamente (DV-4), executando o teste novo e restaurando-a em seguida; a suíte completa foi revalidada nos gates finais |

## 7. Itens da SPEC (critérios de aceite)

- [x] **1. `npm run build` e `npm run lint` sem erros** — *Evidência: gates de 2026-10-19 23:05–23:06 — `eslint .` silencioso (EXIT 0); `vite build` "✓ built in 10.87s" (EXIT 0 recapturado sem pipe; aviso pré-existente de chunk >500 kB, fora de escopo).*
- [x] **2. Ao criar um lançamento, ele é salvo com ID 1, 2, 3… e aparece na lista imediatamente** — *Evidência: teste `Lancamentos.criar.test.tsx > "cria sem id fixo: o Dexie gera id 1, 2, … e o registro aparece na lista imediatamente"`, verde às 23:03:27 — gravação confirmada em `db.lancamentos.toArray()` com `id` 1 e depois 2, `valor` 12345 centavos, painel fechado só após o `add` (`queryByRole("dialog")` nulo) e `findByText("Mercado")` na tabela.*
- [x] **3. Se tentar salvar algo inválido, a UI mostra a mensagem de erro e não fecha o painel** — *Evidência: teste `"submissão inválida mostra mensagem de erro e não fecha o painel nem grava"` — `getByRole("alert")` com "Informe um valor maior que zero.", diálogo `Novo lançamento` ainda aberto, `db.lancamentos.count()` 0; e teste `"erro do Dexie exibe <Erro mensagem> e mantém o painel aberto"` — com `db.lancamentos.add` rejeitando, a mensagem aparece via `<Erro>` e o painel permanece aberto, sem gravação.*

Ação exigida da SPEC: item 4 atendido com `Omit<Lancamento, "id">` (sem cast); itens 5 e 6 verificados pelos testes acima (o código já garantia a ordem await→fechamento e o `<Erro>`, e agora isso é coberto por teste).

## 8. Prova vermelho→verde

Fase vermelha — `npx vitest run src/pages/Lancamentos.criar.test.tsx` (23:02:02, com o `id: 0` temporariamente reintroduzido, DV-4): **1 teste falhou, 2 passaram** (de 3). Falha real: `Lancamentos.criar.test.tsx:60:27` — `expect(todos[0].id).toBe(1)` com diff `Expected 1 / Received 0`: o registro foi gravado com `id: 0`. O DOM capturado no momento da falha exibia o estado vazio ("Nenhum lançamento encontrado com esses filtros."), coerente com o sintoma relatado de o lançamento não aparecer na lista.

Fase verde — mesmo comando após restaurar a correção (23:03:23, execução concluída 23:03:27): **3/3 testes passaram**, zero falhas.

Suíte completa — `npx vitest run` (23:05:04): **186/186 testes passaram** (38 arquivos; 183 anteriores + 3 novos), zero falhas.

## 9. Testes

**Total: 186 testes em 38 arquivos, todos passando** (`vitest run`, 23:05:04: `Test Files 38 passed (38)` / `Tests 186 passed (186)`; EXIT 0 recapturado sem pipe). Antes da SPEC 3.1: 183 em 37 arquivos. Os 3 novos estão em `src/pages/Lancamentos.criar.test.tsx` e cobrem os critérios 2 e 3 da SPEC 3.1. Nenhum teste pré-existente foi alterado.

## 10. Erros, limites e interrupções

Nenhum erro, falha de rede ou interrupção nesta execução (o único evento registrado, o teste em vermelho da fase 1, foi o resultado desejado da prova vermelho→verde; ver D-5/DV-4).

## 11. Observações (fora do escopo, não corrigidas)

- Os registros gravados carregam a propriedade extra `valorCentavos` (herdada do espalhamento de `ValoresFormulario` em `salvar`), comportamento **pré-existente** à SPEC 3.1 e mantido; sem efeito funcional observado, pois `valor` (centavos, R17) é a fonte usada pela UI.
- Aviso `Some chunks are larger than 500 kB` no `vite build`, pré-existente.
- Nomes de arquivos/funções em português (tema DV-1 da SPEC 2 / DV-3, vedada a correção em massa).
- Comportamento em navegador real não exercitado (seção 12).

## 12. Não verificado

- **Comportamento em navegador real** (o sintoma original foi relatado pelo usuário em uso): os critérios 2 e 3 foram verificados por testes automatizados (jsdom + fake-indexeddb); nada foi aberto em navegador nesta execução.
- **Aparência visual, responsividade e acessibilidade em tecnologia assistiva real.**
- **Desempenho com muitos lançamentos** e impacto real do aviso de chunk > 500 kB.

## 13. Métricas

- **Testes:** 186 em 38 arquivos (antes da SPEC 3.1: 183 em 37; antes da SPEC 3: 180 em 35).
- **Arquivos de código alterados nesta SPEC:** 1 (`src/pages/Lancamentos.tsx`); arquivos de teste criados: 1 (`src/pages/Lancamentos.criar.test.tsx`, 118 linhas); `docs/EXECUCAO.md` atualizado durante o trabalho (R36).
- **Dependências:** nenhuma adicionada ou removida (nenhum `npm install` executado; `package.json` intocado, versão `0.0.0` — R15/R35).
- **Scripts** (`package.json`): `dev`, `build`, `typecheck`, `lint`, `test`, `format` (R28).

## 14. Como rodar

```
npm install
npm run dev        # servidor de desenvolvimento (Vite)
npm run typecheck  # tsc -b
npm run lint       # eslint .
npm run test       # vitest run — suíte completa (186 testes)
npm run build      # vite build (produção)
npm run format     # prettier
```
