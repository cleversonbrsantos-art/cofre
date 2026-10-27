# EXECUCAO — SPEC 5 (Formulário de Cadastro de Ativos com Autocomplete e Cálculo Automático)

Modelo em uso: Claude Opus 5.5 (claude-opus-5-5), via Claude Code (VS Code).

## Marcos

| Marco | Início (date) | Fim (date) | typecheck | lint | test | build |
|---|---|---|---|---|---|---|---|
| 1. ativosPopulares.ts (lista estática) | 2026-10-26 00:25:35 HPBC | 2026-10-26 01:41:35 HPBC | OK (zero erros) | OK (zero erros/warnings) | OK (186/186) | OK |
| 2. FormularioAtivo.tsx (componente autocomplete) | 2026-10-26 (mesma sessão) | 2026-10-26 01:41:35 HPBC | OK (zero erros, após estender ClasseInvestimento com ETFs/BDRs — D-1) | OK (zero erros/warnings) | OK (186/186) | OK |
| 3. Integração em Investimentos.tsx | 2026-10-26 (mesma sessão) | 2026-10-26 01:41:35 HPBC | OK (zero erros) | OK (zero erros/warnings) | OK (186/186) | OK |
| 4. Testes + Gates Finais | 2026-10-26 (mesma sessão) | 2026-10-26 01:41:35 HPBC | OK (zero erros) | OK (zero erros/warnings) | OK (186/186) | OK |

Gates finais (execução real desta sessão): `typecheck` → saída vazia, zero erros; `lint` → saída vazia, zero erros e zero warnings; `test` → "Test Files  38 passed (38) / Tests  186 passed (186)"; `build` → "✓ built in 10.69s".

Preparação: `date` inicial executado (2026-10-26 00:25:35 HPBC); `docs/EXECUCAO.md` da SPEC 4 copiado para `docs/historico/EXECUCAO-SPEC4.md`; este arquivo recriado do zero (R36).

## Desvios

| DV | Regra | O que ocorreu | Motivo | Impacto | Severidade | Status |
|---|---|---|---|---|---|---|
| DV-1 | CONFLITO: R15 × §2.1.3 da SPEC 5 | A SPEC pede um "Loader2" girando no input; Loader2 é componente de `lucide-react`, pacote ausente das dependências e cuja instalação a R15 proíbe | Conflito entre SPEC e CLAUDE.md; vale o CLAUDE.md (R1, R38) | Nenhum funcional: spinner SVG inline equivalente dentro do input | BAIXA | corrigido (spinner SVG inline, substituição final) |---|

## Decisões

| D-n | Assunto | Decisão |
|---|---|---|
| D-1 | Classes "ETFs" e "BDRs" ausentes do domínio | A lista estática do autocomplete (§1 da SPEC 5) usa classes "ETFs" e "BDRs", que não existiam em `ClasseInvestimento`. A união do domínio foi estendida com as duas classes, refletida em `config/padroes.ts`, `db/backupSchema.ts` e na lista de classes da tela. O serviço de cotações já as tratava via brapi (R13: opção mais simples). |

## Erros e interrupções

| # | O que ocorreu | Como resolveu |
|---|---|---|
| 1 | Classificador de segurança do modo auto ficou temporariamente indisponível e bloqueou a execução de `lint`, `test` e `build` por alguns minutos | Aguardado retorno do serviço; gates reexecutados com sucesso (lint: zero erros/warnings; test: 186/186; build: OK) |
| 2 | Primeira execução do `lint` falhou com 2 erros em `FormularioAtivo.tsx` (promessa flutuante em `selecionarAtivo` e handler async em `onSubmit`) | Corrigido com operador `void`; gates reexecutados e todos passando |

## Não verificado

- Critérios de aceite 2 a 5 da SPEC 5 (dropdown com "PETR"/"PETR3"/"PETR4", preenchimento automático do preço pela API, cálculo em tempo real do Total Investido e exibição do ativo no Accordion após salvar): NÃO VERIFICADO — são comportamentos de UI que exigem navegador com IndexedDB e rede; nesta sessão apenas typecheck, lint, test e build foram executados.
- Aparência visual, responsividade e acessibilidade do dropdown em navegadores reais: NÃO VERIFICADO.