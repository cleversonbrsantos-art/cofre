# EXECUCAO — SPEC 6.1 (Correção Definitiva do Preço de BDRs)

Modelo em uso: Claude Fable 5 (claude-fable-5-1), via Claude Code (VS Code).

`date` de início da SPEC 6.1: Mon Oct 26 20:42:16 HPBC 2026.

Preparação: `docs/EXECUCAO.md` da SPEC 5 copiado para `docs/historico/EXECUCAO-SPEC5.md`; este arquivo recriado do zero (R36).

## Marcos

| Marco | Início (date) | Fim (date) | typecheck | lint | test | build |
|---|---|---|---|---|---|---|
| 1. Refatoração do fallback Yahoo v8→v7 + sanidade BRL/teto + invalidação de cache de BDR em `fetchAndCacheQuote` | 2026-10-26 20:42:16 HPBC | 2026-10-26 21:08:51 HPBC | OK (zero erros) | OK (zero erros/warnings) | OK (195/195) | OK |

Gates finais (execução real desta sessão, em `C:\Cofre\Cofre`):
- `npm run typecheck` → saída apenas `> tsc -b`, zero erros (encerrado 20:59:30 HPBC).
- `npm run lint` → saída apenas `> eslint .`, zero erros e zero warnings.
- `npm run test` → "Test Files  39 passed (39)" / "Tests  195 passed (195)" (Duração 47.51s).
- `npm run build` → "✓ built in 10.91s" (avisos de tamanho de chunk do Vite, pré-existentes e sem erro).

## Desvios

| DV | Regra | O que ocorreu | Motivo | Impacto | Severidade | Status |
|---|---|---|---|---|---|---|
| DV-1 | R36/R37 | A SPEC 6 (fix-bdr-quotes) e a SPEC 7 (aba-proventos) foram implementadas nesta mesma sessão sem criar/atualizar `docs/EXECUCAO.md` no momento da execução | Falha de processo; o arquivo existente ainda continha o registro da SPEC 5 e não foi rotinado entre specs | Nenhum no código; rastreabilidade dos marcos dessas specs é tardia | ALTA | corrigido (registro tardio abaixo, somente com saídas reais desta sessão; `date` exato de início/fim dessas specs não é reconstrutível e não foi inventado — R5) |
| DV-2 | R36 | Arquivamento do `EXECUCAO.md` da SPEC 5 para `docs/historico/` só ocorreu no início da SPEC 6.1, não ao encerrar a SPEC 5 | Mesma falha de rotina de DV-1 | Nenhum no código | BAIXA | corrigido (`docs/historico/EXECUCAO-SPEC5.md` criado) |

Registro tardio (saídas reais desta sessão, citadas do histórico da conversa):
- SPEC 6: `typecheck` zero erros; `lint` zero erros/warnings; `build` OK ("✓ built in 11.08s"); `test` "Test Files 38 passed (38) / Tests 186 passed (186)". Alterações apenas em `src/services/quotes.ts` (validação de BDR + fallback Yahoo v8, hoje já substituído pela v7 da SPEC 6.1).
- SPEC 7: `typecheck` zero erros (após correções de tipos); `lint` zero erros (após correção de hooks condicionais e variável não usada em `Proventos.tsx`); `build` OK ("✓ built in 11.35s"); `test` "Test Files 39 passed (39) / Tests 195 passed (195)", incluindo `src/domain/dividends.test.ts` com 9 testes. Alterações: `src/services/dividends.ts`, `src/domain/dividends.ts` (+teste), `src/domain/models.ts`, `src/db/db.ts`, `src/db/schema.ts` (v5), `src/components/menu.ts`, `src/App.tsx`, `src/pages/Proventos.tsx`, `src/components/proventos/SummaryCards.tsx`, `src/components/proventos/ProventosTable.tsx`.

## Decisões

| D-n | Assunto | Decisão |
|---|---|---|
| D-1 | Fallback secundário da SPEC 6.1 §2 (Status Invest) | Optado por retornar `null` ("Indisponível") quando o Yahoo v7 falha. §2 é opcional na SPEC; Status Invest é endpoint não especificado em detalhe (scraping instável) e R13 manda escolher a opção mais simples. |
| D-2 | Teto de sanidade de BDR aplicado também à brapi | O teto da SPEC 6.1 §1 (R$ 500,00 = 50000 centavos) foi aplicado consistentemente às duas fontes: o `BDR_MAX_PRICE_CENTS` da SPEC 6 (que era R$ 5.000,00) foi reduzido para R$ 500,00. Sem isso, o próprio caso-alvo (NVDC34 a R$ 1.099,00 vindo da brapi) não dispararia o fallback, pois R$ 1.099,00 < R$ 5.000,00. |
| D-3 | `clearQuotesCache()` não foi criada | §3 da SPEC 6.1 oferece alternativas ("adicionar clearQuotesCache() e chamar no botão 'Atualizar Cotações', ou apenas orientar o usuário"). Não existe botão "Atualizar Cotações" na UI e a SPEC 6 proíbe alterar a interface; uma função exportada sem chamada violaria a R27 (código morto). A invalidação exigida pelo §3 ("force a invalidação do cache de todos os BDRs no fetchAndCacheQuote") foi implementada dentro de `fetchAndCacheQuote`: cache de BDR com preço acima do teto é revalidado mesmo dentro do TTL. O usuário também pode apagar o IndexedDB, como a própria SPEC sugere. |

## Erros e interrupções

| # | O que ocorreu | Como resolveu |
|---|---|---|
| (nenhum nesta sessão da SPEC 6.1) | | |

## Não verificado

- Critérios de aceite 2 da SPEC 6.1 (preço de NVDC34 menor que R$ 100,00 após limpar cache): NÃO VERIFICADO — exige navegador com IndexedDB, rede real e resposta viva das APIs brapi.dev e Yahoo Finance; nesta sessão apenas typecheck, lint, test e build foram executados.
- Disponibilidade real do endpoint Yahoo v7 (`/v7/finance/quote` tem histórico de exigir cookie/crumb e responder 401 em alguns contextos): NÃO VERIFICADO. Se falhar, o fluxo cai em `null` ("Indisponível") conforme D-1, sem quebrar o app.
- Aparência da tabela de Investimentos (inalterada por requisito da SPEC 6): NÃO VERIFICADO visualmente; nenhuma mudança de UI foi feita na SPEC 6.1.
