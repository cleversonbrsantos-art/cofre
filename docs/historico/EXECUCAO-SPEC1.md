# EXECUÇÃO — Cofre (SPEC 1)

Registro contínuo de execução, conforme R36–R39. Este arquivo é mantido durante todo o trabalho.

## Marcos

| Marco | Início (date) | Fim (date) | Status |
|---|---|---|---|
| M1 | Thu Oct 15 21:05:59 HPBC 2026 | Fri Oct 16 14:08:54 HPBC 2026 | Completo |
| M2 | Fri Oct 16 14:14:00 HPBC 2026 | Fri Oct 16 19:14:09 HPBC 2026 | Completo |
| M3 | Fri Oct 16 19:25:01 HPBC 2026 | Fri Oct 16 21:49:10 HPBC 2026 | Completo |
| M4 | Fri Oct 16 22:26:35 HPBC 2026 | Sat Oct 17 15:15:14 HPBC 2026 | Completo |
| M5 | Sat Oct 17 15:20:00 HPBC 2026 (aprox.) | Sat Oct 17 18:06 HPBC 2026 | Completo |
| M6 | Sat Oct 17 19:08:41 HPBC 2026 | Sat Oct 17 19:44:11 HPBC 2026 | Completo |
| M7 | Sat Oct 17 19:45:35 HPBC 2026 | Sun Oct 18 10:52:05 HPBC 2026 | Completo |
| M8 | Sun Oct 18 11:23:24 HPBC 2026 | Sun Oct 18 15:47:12 HPBC 2026 | Completo |

### Linhas finais reais dos gates — M1

- `typecheck`: `tsc -b` → exit 0, nenhuma saída de erro (Fri Oct 16 14:08:54 HPBC 2026)
- `lint`: `npx eslint .` → exit 0, nenhuma saída (Fri Oct 16 14:08:54 HPBC 2026)
- `test`: `npx vitest run` → `Test Files 1 passed (1)` / `Tests 1 passed (1)` (smoke: tipoDoGrupo)
- `build`: `npm run build` → `✓ built in 4.40s` — dist/ gerado (index.html 0.51 kB, CSS 10.66 kB, JS 355.62 kB)

### Linhas finais reais dos gates — M2

- `typecheck`: `npx tsc -b` → exit 0, sem erros
- `lint`: `npx eslint .` → exit 0, sem saída
- `test`: `npx vitest run` → `Test Files 4 passed (4)` / `Tests 12 passed (12)`
- `build`: `npm run build` → `✓ built in 17.88s`

### Linhas finais reais dos gates — M3

- `typecheck`: `npx tsc -b` → exit 0, sem erros
- `lint`: `npx eslint .` → exit 0, sem erros nem warnings
- `test`: `npx vitest run` → `Tests 14 passed (14)` (5 arquivos)
- `build`: `npm run build` → `✓ built in 14.23s` (aviso de chunk >500 kB, informativo)

### Linhas finais reais dos gates — M4

- `typecheck`: `npx tsc -b` → exit 0, sem erros (Sat Oct 17 15:10 HPBC 2026)
- `lint`: `npx eslint .` → exit 0, sem erros nem warnings (Sat Oct 17 15:11 HPBC 2026)
- `test`: `npx vitest run` → `Test Files 9 passed (9)` / `Tests 36 passed (36)` (Sat Oct 17 15:12:34 HPBC 2026)
- `build`: `npm run build` → `✓ built in 15.19s` (aviso de chunk >500 kB, informativo; dist/ gerado)

Conteúdo do M4: domínio `orcamento.ts`, `fluxo.ts`, `diaadia.ts`, `recorrentes.ts` (+ `tiposOrcamento.ts`); testes `orcamento.test.ts`, `fluxo.test.ts`, `diaadia.test.ts`, `recorrentes.test.ts`; telas `Orcamento.tsx`, `Fluxo.tsx`, `DiaADia.tsx`, `Recorrentes.tsx`. Gráficos entregues: 1 (receitas × despesas por mês), 4 (saldo acumulado), 7 (parcelas por cartão, M3), 8 (despesas por dia), 9 (saldo do mês e caixa projetado). Mapa de calor categoria × mês na tela Fluxo.

### Linhas finais reais dos gates — M5

- `typecheck`: `npx tsc -b` → exit 0, sem erros (Sat Oct 17 18:04 HPBC 2026)
- `lint`: `npx eslint .` → exit 0, sem erros nem warnings (Sat Oct 17 18:04 HPBC 2026)
- `test`: `npx vitest run` → `Test Files 12 passed (12)` / `Tests 65 passed (65)` (Sat Oct 17 18:04:02 HPBC 2026)
- `build`: `npm run build` → `✓ built in 9.95s` (aviso de chunk >500 kB, informativo; dist/ gerado)

Conteúdo do M5: domínio `metas.ts` (PMT/NPER conforme §4.9), `reserva.ts` (§4.10), `contasapagar.ts` (§4.13, contas + assinaturas), `simuladores.ts` (§4.14); testes `metas.test.ts` (§8 casos 5 e 6), `reserva.test.ts`, `simuladores.test.ts` (§8 caso 11, contas a pagar e assinaturas); telas `Metas.tsx`, `Reserva.tsx`, `ContasAPagar.tsx`, `Assinaturas.tsx`, `Simuladores.tsx` (juros compostos com gráfico, independência financeira, custo do hábito). Removidas funções exportadas sem uso/teste `simularMesAMeses` e `mesesAte` (R27/R30). Início do M5 registrado como aproximação (15:20): o `date` de início não foi capturado na virada M4→M5; desvio registrado como DV-4.

### Linhas finais reais dos gates — M6

- `typecheck`: `npx tsc -b` → exit 0, sem erros (Sat Oct 17 19:42 HPBC 2026)
- `lint`: `npx eslint .` → exit 0, sem erros nem warnings (Sat Oct 17 19:42 HPBC 2026)
- `test`: `npx vitest run` → `Test Files 14 passed (14)` / `Tests 79 passed (79)` (Sat Oct 17 19:43:11 HPBC 2026)
- `build`: `npm run build` → `✓ built in 9.84s` (aviso de chunk >500 kB, informativo; dist/ gerado) (Sat Oct 17 19:44 HPBC 2026)

Conteúdo do M6: domínio `dividas.ts` (motor de 60 meses, métodos mínimo/neve/avalanche, redirecionamento de parcelas, alerta "A parcela não cobre os juros", casos §8 7 e 8) e `investimentos.ts` (rentabilidade por ativo, alocação por classe com ajuste, patrimônio líquido §8 caso 10, série do histórico); testes `dividas.test.ts` (6) e `investimentos.test.ts` (8); telas `Dividas.tsx` (com gráfico 10 — saldo devedor nos 3 métodos, campo de valor extra, comparativo de juros economizados) e `Investimentos.tsx` (gráfico 11 — alocação atual × alvo; gráfico 12 — evolução do patrimônio; alvos por classe; bens/passivos; histórico mensal com "Registrar mês atual").

### Linhas finais reais dos gates — M7

- `typecheck`: `npx tsc -b` → exit 0, sem erros (Sat Oct 17 22:00+ HPBC 2026, revalidado Sun Oct 18)
- `lint`: `npx eslint .` → exit 0, sem erros nem warnings (Sun Oct 18 10:33 HPBC 2026)
- `test`: `npx vitest run` → `Test Files 17 passed (17)` / `Tests 88 passed (88)` (Sun Oct 18 10:35:35 HPBC 2026)
- `build`: `npm run build` → `✓ built in 16.07s` (aviso de chunk >500 kB, informativo; dist/ gerado) (Sun Oct 18 10:36 HPBC 2026)

Conteúdo do M7: domínio `saude.ts` (nota de saúde §4.15: 5 regras de até 20 pontos, clamp, regra sem dados fica fora da nota; caso §8 1) com `saude.test.ts` (5 testes); tela `Painel.tsx` (8 indicadores, medidor circular da nota, tabela das 5 regras, 3 destaques, gráficos 2 — rosca das maiores categorias, 3 — 50/30/20 real × ideal, 5 — orçamento × realizado, 6 — progresso das metas, além de fluxo do ano e despesas por dia já presentes; próximos vencimentos e maiores gastos) com `Painel.test.tsx` (teste de componente §8 com dados de exemplo). Com o Painel, os 13 gráficos da §5 estão completos. Teste do caso §8 12 criado em `src/db/backup.test.ts` (3 testes: JSON malformado, estrutura inválida e backup válido, usando o próprio `db` aberto sobre fake-indexeddb). `src/db/backup.ts` corrigido: `as unknown as` (R19) removido e enums zod (`z.enum`) alinhados aos unions do domínio. `vitest.setup.ts`: `fake-indexeddb/auto` e stub de `ResizeObserver` (jsdom não implementa; exigido pelo ResponsiveContainer do Recharts).

### Linhas finais reais dos gates — M8

- `typecheck`: `npx tsc -b` → exit 0, sem erros (Sun Oct 18 15:43 HPBC 2026)
- `lint`: `npx eslint .` → exit 0, sem erros nem warnings (Sun Oct 18 15:43 HPBC 2026)
- `test`: `npx vitest run` → `Test Files 17 passed (17)` / `Tests 88 passed (88)` (Sun Oct 18 15:43:56 HPBC 2026)
- `build`: `npm run build` → `✓ built in 13.82s` (aviso de chunk >500 kB, informativo; dist/ gerado) (Sun Oct 18 15:47 HPBC 2026)

Conteúdo do M8 (polimento): R24 restaurada — os 5 arquivos acima de 400 linhas (DV-7) foram divididos: `backup.ts` (406→183) com o schema zod extraído para `backupSchema.ts` (228); `Painel.tsx` (596→398) com gráficos em `PainelGraficos.tsx`, listas em `PainelListas.tsx` e `Indicador.tsx`; `Investimentos.tsx` (447→373) com bens/histórico em `InvestimentosBens.tsx`; `Recorrentes.tsx` (418→333) com gráfico 9 e tabela de previsão em `RecorrentesPrevisao.tsx`; `Lancamentos.tsx` (404→336) com a barra de filtros em `FiltrosLancamentos.tsx`. Tabelas de Configurações, DiaADia e Painel ganharam scroll horizontal (`overflow-x-auto`) para telas estreitas. README.md criado (instalação, scripts, estrutura, privacidade). Estado final: nenhum arquivo de código além do gerador de exemplo (465, isento) excede 400 linhas.

## Desvios

| DV | Regra | O que ocorreu | Motivo | Impacto | Severidade | Status |
|---|---|---|---|---|---|---|
| DV-1 | R15 | Instalação dos pacotes da stack exige usar `npm create vite` e `npm install`, que baixam pacotes da rede em tempo de build (não de execução) | Ferramenta de scaffolding padrão do ecossistema | Nenhum em runtime: a SPEC exige app sem rede em execução; downloads de dev-dependencies não são rede em tempo de execução do app | BAIXA | Corrigido |
| DV-2 | R15 | Instalados `@types/node`, `tailwindcss`, `autoprefixer`, `@testing-library/jest-dom` além da lista nominal da §2 | Tailwind é exigido pela stack mas sem versão de plugin PostCSS incluída; `@types/node` é necessário para `vite.config.ts`; `jest-dom` para os matchers do Testing Library pedidos na §8 | Nenhum: todos são devDependencies de suporte à stack exigida, sem efeito em runtime | BAIXA | Aberto (registro; necessário para compilar) |
| DV-3 | §2 | Vite rebaixado de ^6.0.1 para ^5.4.11 | Vitest 2.1.x embute Vite 5 e conflita com Vite 6 na tipagem de `vite.config.ts` | Nenhum funcional: Vite 5 atende todos os requisitos | BAIXA | Aberto (decisão de compat) |
| DV-4 | R40 | `date` de início do M5 não foi capturado na virada M4→M5; início registrado por aproximação (~15:20 HPBC 2026-10-17) | Compaction da sessão durante a transição de marcos | Menor: fim do M5 e gates têm saídas reais; só o timestamp exato de início é aproximado | BAIXA | Aberto (registro; irreversível) |
| DV-5 | R15 | Instalado `fake-indexeddb@6.2.6` como devDependency, fora da lista nominal da §2 | jsdom (ambiente de teste) não implementa IndexedDB; o teste de componente do Painel (§8) e o teste de backup (§8 caso 12) exigem um IndexedDB real em teste | Nenhum em runtime do app: é devDependency usada só no ambiente Vitest | BAIXA | Aberto (necessário para os testes de componente/Dexie) |
| DV-6 | R19 | `src/db/backup.ts` (M1) continha `as unknown as` na conversão do resultado do zod | Escrito na sessão inicial; detectado ao criar o teste do §8 12 no M7 | Nenhum residual: corrigido no M7 (enums zod alinhados aos unions do domínio); typecheck/lint/test zerados após a correção | MÉDIA | Corrigido |
| DV-7 | R24 | 5 arquivos acima de 400 linhas no fim do M7: `Painel.tsx` (596), `Investimentos.tsx` (447), `Recorrentes.tsx` (418), `backup.ts` (406), `Lancamentos.tsx` (404) | Os arquivos cresceram marcos a marcos; a contagem de linhas não foi verificada na entrega de cada marco (o `wc -l` só foi rodado no M8) | Nenhum funcional; violação do limite estrutural. Correção no M8: divisão em submódulos com uma responsabilidade cada | MÉDIA | Corrigido (ver M8) |
| DV-8 | R37 | DV-7 não foi registrado no momento em que os arquivos ultrapassaram 400 linhas (M3–M7); só detectado no M8 com `wc -l` | A verificação de tamanho de arquivo não estava no checklist de gates dos marcos anteriores | Nenhum em código (o desvio em si é o DV-7); registro atrasado | BAIXA | Aberto (registro; irreversível) |

## Decisões

| D | Ponto ambíguo | Decisão | Motivo |
|---|---|---|---|
| D-1 | Idioma dos identificadores no gerador de exemplo: função `cat()` e variáveis curtas | Mantidos em inglês/padrão do projeto (R25); textos dos dados em pt-BR | R25 exige código em inglês e interface em pt-BR; dados fictícios são conteúdo de interface |
| D-2 | A §5 da SPEC intitula-se "Telas (20 módulos)" mas a tabela do próprio §5 enumera exatamente 19 rotas (`/inicio` a `/sobre`, contagem confirmada com `grep -c` = 19) | Implementadas as 19 rotas enumeradas na tabela; o número "20" do título é tratado como erro tipográfico da SPEC | R13: aplicada a regra padrão da própria SPEC (a tabela concreta) em vez do número abstrato do título; nenhuma funcionalidade omitida |

## Erros e interrupções

| # | Marco | O que ocorreu | Resolução |
|---|---|---|---|
| 1 | M1 | `npm create vite` cancelado (diretório não vazio) e ferramenta Write com falha de validação repetida ("content type expected as string but provided as object"); classificador de segurança indisponível por alguns minutos, bloqueando Bash | Estrutura criada manualmente (mkdir + printf); Write voltou a funcionar para docs/EXECUCAO.md; novos arquivos de código escritos via printf/heredoc quando Write falhar |
| 2 | M4 | Write produziu conteúdo corrompido/misturado em `DiaADia.tsx` e `Recorrentes.tsx` (tags quebradas, trechos truncados, tipo inexistente) durante instabilidade | Arquivos reescritos por inteiro com Write; verificados via typecheck e lint |
| 3 | M4 | Pipeline PowerShell (`Get-Content -replace | Set-Content`) corrompeu o encoding UTF-8 dos 3 arquivos de teste (mojibake em pt-BR) | Arquivos reescritos via Write (UTF-8 preservado); typecheck e testes ok |
| 4 | M7 | Teste do backup falhava com `DatabaseClosedError` no 3º caso: `Object.assign(db, mem)` copia as tabelas (propriedades próprias) mas não o método `transaction` (prototype), então a importação rodava a transação no banco real, não no em memória; além disso, `Dexie.delete` fechava a conexão anterior de forma assíncrona, fechando o banco errado | Teste reescrito para abrir o próprio `db` real sobre o fake-indexeddb (`db.open()` + `clear` das tabelas no `beforeEach`); vitest isola módulos por arquivo, então não afeta outros testes; 3/3 passando |

## Não verificado

- Aparência visual, responsividade real em dispositivos, acessibilidade em leitores de tela e comportamento em navegadores distintos: NÃO VERIFICADO (ambiente só de linha de comando).
