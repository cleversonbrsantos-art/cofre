# SPEC 2 — Correções do Cofre (itens C1 a C4)

## 0. LEIA ANTES DE QUALQUER COISA

1. Leia o `CLAUDE.md` **integralmente** antes de começar. Se ele não existir na raiz do projeto, **pare e informe**.
2. As regras desta spec são **adicionais**, nunca substitutas. Em caso de conflito, o `CLAUDE.md` prevalece e a divergência deve ser registrada como DV do tipo CONFLITO (R38) e reportada no relatório final.
3. **Todo desvio** (de qualquer regra R1 a R43 ou de qualquer item desta spec) é registrado em `docs/EXECUCAO.md` **no momento em que ocorrer** (R36 a R39) e aparece no relatório final. Omitir um desvio é a pior violação possível (R8). O relatório será auditado contra o código-fonte e os comandos (R42).
4. Escopo **estrito** (R10): execute somente C1 a C4. A seção 6 lista o que **não** deve ser tocado.
5. Antes de qualquer código: rode `date`. Copie `docs/EXECUCAO.md` para `docs/historico/EXECUCAO-SPEC1.md` e `docs/RELATORIO-FINAL.md` para `docs/historico/RELATORIO-FINAL-SPEC1.md` (cópias, sem editar os originais antes disso). Depois, recrie `docs/EXECUCAO.md` do zero para esta execução, com as seções fixas da R36.
6. Registre o modelo em uso e todo erro de ferramenta, limite de requisições (429) ou interrupção.

## 1. Contexto

A auditoria da entrega da SPEC 1 encontrou quatro grupos de defeitos. Cada item abaixo descreve o comportamento atual (defeituoso), o comportamento exigido e os testes que o provam.

Regras desta execução:

- **Nenhum teste existente pode ser alterado** (R7). Se algum falhar após suas mudanças, é regressão: corrija o código, não o teste. Se achar que um teste existente está errado, registre CONFLITO e não mexa nele.
- **Vermelho → verde, obrigatório.** Para cada item, escreva os testes novos **antes** do código e execute-os: eles **devem falhar**. Registre em `docs/EXECUCAO.md` a linha real de falha (nome do teste e mensagem). Só então implemente, e rode de novo até passar.
- Identificadores novos (arquivos, funções, tipos, tabelas) em **inglês** (R25). Textos de interface em pt-BR. **Não renomeie nada existente.**
- Nenhum pacote novo (R15). Nenhum arquivo acima de 400 linhas (R24): extraia componentes novos para arquivos próprios, como indicado.
- Sem código morto (R27): nada exportado e não usado.
- Não altere a versão (R35). Sem commit, tag ou push (R33).

## 2. C1 — Dívidas: "só o mínimo" está errado

**Defeito atual.** Em `src/domain/dividas.ts`, os três métodos usam o mesmo total mensal (mínimas + extra) e redirecionam a parcela de uma dívida quitada. Por isso "só o mínimo" se comporta como bola de neve, os três métodos dão resultado idêntico sem valor extra, e a "economia vs. só o mínimo" fica errada.

**Comportamento exigido** (a assinatura pública de `calcularDividas` e o formato do resultado **não mudam**). A cada mês, até 60:

1. **Juros:** para cada dívida com saldo > 0, `juros = Math.round(saldo × jurosMes / 100)`; some ao saldo. (Mesma fórmula atual.)
2. **Parcelas mínimas:** cada dívida com saldo > 0 paga `min(parcelaMinima, saldo)`. A ordem de processamento é por `id` crescente. Dívida que zera aqui entra em `ordemQuitacao` nessa ordem.
3. **Método `minimo`:** termina aqui. **O extra é ignorado.** A parcela de uma dívida quitada **não** é redirecionada.
4. **Métodos `neve` e `avalanche`:** orçamento do mês = soma das `parcelaMinima` **originais de todas as dívidas** (inclusive as já quitadas) + `extraMensal`. Depois de pagar as mínimas (passo 2), o que sobrar do orçamento vai para as dívidas com saldo > 0, na ordem de prioridade, cada uma recebendo `min(sobra, saldo)`:
   - `neve`: menor saldo atual (após juros e mínimas do mês) primeiro; empate por `id` crescente.
   - `avalanche`: maior `jurosMes` primeiro; empate por menor saldo, depois `id` crescente.
   - Dívidas que zeram nesta etapa entram em `ordemQuitacao` na ordem de prioridade, depois das quitadas pelas mínimas do mesmo mês.
5. `totalPago`, `jurosTotais`, `meses`, `serie` e `alertas` seguem as definições atuais. `meses = null` ("mais de 60") quando restar saldo após 60 meses.

**Testes** em `src/domain/debtMethods.test.ts` (`mesKeyAtual = 202610`; valores em centavos; `jurosTotais`, `totalPago`, `meses` e `ordemQuitacao` exatos):

Caso AB: dívida 1 (saldo 100000, 2%, mínima 10000) e dívida 2 (saldo 500000, 3%, mínima 20000).

| Método | extra | meses | jurosTotais | totalPago | ordemQuitacao |
|---|---|---|---|---|---|
| minimo | 0 | 47 | 450715 | 1050715 | [1,2] |
| minimo | 5000 | 47 | 450715 | 1050715 | [1,2] |
| neve | 0 | 31 | 316024 | 916024 | [1,2] |
| neve | 5000 | 25 | 247142 | 847142 | [1,2] |
| avalanche | 0 | 31 | 316024 | 916024 | [1,2] |
| avalanche | 5000 | 25 | 243514 | 843514 | [1,2] |

Caso CD: dívida 1 (saldo 200000, 5%, mínima 20000) e dívida 2 (saldo 80000, 1%, mínima 8000).

| Método | extra | meses | jurosTotais | totalPago | ordemQuitacao |
|---|---|---|---|---|---|
| minimo | 5000 | 15 | 88934 | 368934 | [2,1] |
| neve | 5000 | 11 | 75171 | 355171 | [2,1] |
| avalanche | 5000 | 11 | 66619 | 346619 | [1,2] |
| neve | 0 | 14 | 86996 | 366996 | [2,1] |
| avalanche | 0 | 14 | 86996 | 366996 | [2,1] |
| minimo | 0 | 15 | 88934 | 368934 | [2,1] |

Testes adicionais:

- **Conservação:** para todo cenário acima e todo método, `totalPago = soma dos saldos originais + jurosTotais`.
- **Sem redirecionamento:** no caso AB com `minimo`, a dívida 2 paga **exatamente** `parcelaMinima` em todos os meses até o último (`serie[i].dividas` com `pagoMes` = 20000 enquanto o saldo permitir).
- **Extra irrelevante:** `minimo` com extra 0 e extra 5000 produzem resultados idênticos.
- **Sem valor extra, neve e avalanche economizam só por redirecionamento:** no caso AB, `neve.meses < minimo.meses` e `neve.jurosTotais < minimo.jurosTotais`.
- **Alerta mantido:** parcela ≤ juros do mês continua gerando o alerta existente.

**Tela.** Em `src/pages/Dividas.tsx`, confira que a comparação de "juros economizados" usa `jurosMinimo` (já corrigido pelo domínio). Mude a tela só se algo ficar incoerente, e registre.

## 3. C2 — A data "Hoje" congelada e em UTC

**Defeito atual.** `inicializarBanco` grava `hoje` uma única vez em `configuracao`, com `new Date().toISOString().slice(0, 10)` (data em UTC, que à noite no Brasil vira o dia seguinte). Nada a atualiza depois. Todas as telas leem `config.hoje`, então vencimentos, "pode gastar por dia", atrasos e a data padrão de novos lançamentos envelhecem sozinhos.

**Comportamento exigido.**

1. **`src/lib/localDate.ts`:** `toLocalISODate(date: Date): string` (usa `getFullYear`, `getMonth`, `getDate` locais) e `todayLocalISO(now: Date = new Date()): string`.
2. **Modelo:** em `Configuracao`, **remova** `hoje: string` e **adicione** `hojeManual: string | null` ("data simulada", ISO). O domínio continua recebendo "hoje" **por parâmetro** (R16); nada muda nas funções puras.
3. **`src/hooks/useToday.ts`:** `useToday(): string` devolve `config.hojeManual ?? todayLocalISO()`. Quando não há data manual, reavalia a cada 60 s e nos eventos `visibilitychange` (ao ficar visível) e `focus`, e só re-renderiza se a string mudar.
4. **Todos os consumidores** de `config.hoje` passam a usar `useToday()`: `Assinaturas`, `Cartoes`, `ContasAPagar`, `DiaADia`, `Dividas`, `Fluxo`, `Investimentos`, `Lancamentos` (data padrão de novo lançamento), `Metas`, `Orcamento`, `Painel`, `Parcelados` (data padrão da compra), `Recorrentes`. A tela de Configurações usa o mesmo hook onde mostrar a data.
5. **Esquema do banco:** extraia a definição de versões do Dexie para `src/db/schema.ts` com `defineSchema(instance: Dexie): void`, usada pelo singleton `db` e pelos testes. Crie a **versão 2** com migração: para a linha de configuração existente, apague `hoje` e defina `hojeManual = null`.
6. **`inicializarBanco`** e **`carregarDadosExemplo`:** nunca gravam a data atual; criam `hojeManual: null`. `anoInicial` vem de `new Date().getFullYear()` (local).
7. **Backup:** a importação aceita `versao` 1 e 2. Em arquivos antigos, `hoje` é aceito e **ignorado** (vira `hojeManual: null`). A exportação grava `versao: 2` com `hojeManual` e **sem** `hoje`. Os testes existentes de backup (que usam `versao: 1` com `hoje`) devem continuar passando sem alteração.
8. **Configurações:** campo "Data simulada (opcional)" (`type="date"`), texto de ajuda "Deixe vazio para usar a data de hoje" e botão "Usar a data de hoje" que grava `null`.
9. **Busca de resíduos:** ao final, `grep -rn "config.hoje" src` e `grep -rn "toISOString().slice(0, 10)" src` devem retornar **zero** linhas (a `exportadoEm` do backup, que é um timestamp completo, é permitida).

**Testes:**

- **Fuso fixado.** Em `vitest.global-setup.ts` (e registrado em `globalSetup`), defina `process.env.TZ = "America/Cuiaba"`. Teste de sanidade em `src/lib/localDate.test.ts`: `new Date(2026, 9, 18, 21, 30).getTimezoneOffset()` é `240`. Todos os testes existentes devem continuar passando com esse fuso.
- `toLocalISODate(new Date(2026, 9, 18, 21, 30))` → `"2026-10-18"` (com o código antigo baseado em `toISOString` daria `"2026-10-19"`). Também `new Date(2026, 0, 1, 0, 0)` → `"2026-01-01"` e `new Date(2026, 11, 31, 23, 59)` → `"2026-12-31"`.
- `src/hooks/useToday.test.tsx` com timers falsos: com o relógio em `new Date(2026, 9, 18, 23, 59)` o hook devolve `"2026-10-18"`; avançando 2 minutos, devolve `"2026-10-19"`. Com `hojeManual = "2026-03-10"`, devolve sempre `"2026-03-10"`.
- `src/db/schema.migration.test.ts`: crie um banco com o esquema da versão 1 (configuração com `hoje: "2026-10-15"`), feche, reabra com `defineSchema` (versão 2) e confirme `hojeManual === null` e ausência de `hoje`.
- `src/db/backup.compat.test.ts`: importar backup `versao: 1` com `hoje` funciona e resulta em `hojeManual: null`; exportar gera `versao: 2` com `hojeManual` e sem `hoje`.

## 4. C3 — Configurações incompletas

**Defeito atual.** Categorias aparecem só em tabela de leitura; formas de pagamento são chips fixos; o atalho de orçamento (50/30/20 etc.) **não pode ser escolhido em lugar nenhum** e o "Personalizado" não pode ser editado.

### 4.1 Categorias (`src/components/CategoriesManager.tsx`, usado em Configurações)

- **Criar:** nome + grupo (`Receita`, `Necessidade`, `Desejo`, `Poupança`, `Transferência`).
- **Renomear** e **mudar grupo**. Ao mudar o grupo, peça confirmação avisando que a classificação de todos os lançamentos da categoria muda (o tipo deriva do grupo).
- **Excluir**, com confirmação (ver C4) que mostra quantos registros serão afetados. Ao confirmar, numa única transação: `categoriaId = null` em `lancamentos`, `parceladas`, `contasPagar`, `assinaturas` e `recorrentes`; **apagar** as linhas de `orcamentoPlanos` dessa categoria; apagar a categoria.
- **Regras puras** em `src/domain/categoryRules.ts`:
  - `validateCategoryName(name: string, existing: { id: number; nome: string }[], ignoreId?: number): { ok: true; name: string } | { ok: false; error: string }`: remove espaços nas pontas, exige 1 a 60 caracteres e unicidade ignorando maiúsculas, minúsculas e acentos (ignorando o `id` informado).
  - `countCategoryReferences(categoryId: number, data: { lancamentos; parceladas; contasPagar; assinaturas; recorrentes; orcamentoPlanos }): Record<string, number>`: contagem por entidade.

### 4.2 Formas de pagamento (`src/components/PaymentMethodsManager.tsx`)

- Nova tabela `paymentMethods` (`{ id, name }`), criada na **versão 2** do esquema, preenchida com as 8 formas padrão por `inicializarBanco` (e pela migração, se a tabela estiver vazia). `carregarDadosExemplo` **não** mexe nessa tabela.
- O tipo `FormaPagamento` passa a ser `string`. O `enumForma` de `src/db/backupSchema.ts` passa a `z.string().min(1)`. O backup passa a incluir `paymentMethods` (opcional na importação; ausente = as 8 padrão).
- **Criar**, **renomear** e **excluir**. Renomear atualiza `formaPagamento` em `lancamentos` e `contasPagar` na mesma transação. Excluir é **bloqueado** quando houver uso, com mensagem "Em uso por N registros"; sem uso, pede confirmação.
- Os selects de forma de pagamento (formulário de lançamento e contas a pagar) leem a tabela.
- Regras puras em `src/domain/paymentMethodRules.ts`: `validatePaymentMethodName` (mesma regra de nome única, sobre a lista de formas) e `countPaymentMethodUsage(name, { lancamentos, contasPagar })`.

### 4.3 Atalho de orçamento (na tela Orçamento)

- Substitua o rótulo fixo por um **select** com: 50/30/20, 60/30/10, 70/20/10, 50/20/30, 40/30/30 e Personalizado. A escolha grava `config.atalhoOrcamento` (e `orcamentoConfig.atalho`).
- Em "Personalizado", mostre três campos (necessidades, desejos, poupança, em %) gravados em `config.atalhoPersonalizado`. Só salva se a validação passar; senão mostra o erro e não grava.
- Regra pura em `src/domain/shortcutRules.ts`: `validateCustomShortcut(p: { necessidades: number; desejos: number; poupanca: number }): { ok: true } | { ok: false; error: string }`. Cada valor entre 0 e 100 e **soma exatamente 100**.
- Os percentuais exibidos e as metas por grupo passam a refletir o atalho escolhido.

**Testes:**

- `src/domain/categoryRules.test.ts`: nome vazio rejeitado; 61 caracteres rejeitado; `"  Mercado "` com existente `Mercado` rejeitado; `"mercado"` e `"MERCADÓ"` rejeitados como duplicata; renomear a própria categoria para o mesmo nome (com `ignoreId`) aceito; `countCategoryReferences` conta corretamente por entidade em um conjunto de dados montado no teste.
- `src/domain/paymentMethodRules.test.ts`: validação de nome e contagem de uso.
- `src/domain/shortcutRules.test.ts`: `{50,30,20}` ok; `{50,30,25}` erro; `{-10,60,50}` erro; `{101,0,0}` erro; `{33.5,33.5,33}` ok.
- `src/components/CategoriesManager.test.tsx` (banco em memória): criar, renomear e mudar grupo persistem; excluir uma categoria usada por um lançamento deixa o lançamento com `categoriaId = null` e apaga o plano de orçamento dela, só após confirmar; cancelar não altera nada.
- `src/components/PaymentMethodsManager.test.tsx`: renomear "Pix" para "PIX Instantâneo" atualiza os lançamentos que usavam "Pix"; excluir forma em uso é bloqueado e a contagem aparece.
- `src/pages/Orcamento.shortcut.test.tsx`: trocar o select para 60/30/10 persiste e atualiza os percentuais exibidos; Personalizado com soma 95 mostra erro e não grava.

## 5. C4 — Segurança dos dados

**Defeito atual.** Importar JSON sobrescreve tudo sem pré-visualização nem confirmação. Todas as exclusões acontecem sem confirmação. Excluir conta ou cartão deixa lançamentos órfãos.

### 5.1 Importação com pré-visualização e confirmação

- Em `src/db/backup.ts`, adicione `prepareImport(text: string): Promise<{ ok: true; summary: { version: number; exportedAt: string; counts: Record<string, number> } } | { ok: false; error: string }>`: valida (mesmo schema) e **não grava nada**. `importarBackup` mantém a assinatura atual.
- Novo `src/components/ImportPreview.tsx`: ao escolher o arquivo, mostra versão, data de exportação e contagem por entidade, ao lado da contagem atual do banco, e dois botões: "Substituir todos os dados" e "Cancelar". Só o primeiro chama `importarBackup`. Arquivo inválido mostra o erro e não oferece substituir.

### 5.2 Confirmação em todas as exclusões

- Novo `src/components/ConfirmDialog.tsx` (e hook `useConfirm`): diálogo com `role="alertdialog"`, foco no botão "Cancelar", `Esc` cancela, texto configurável, botão destrutivo "Excluir".
- **Todas** as exclusões passam por ele: lançamento, conta, cartão, compra parcelada, meta, dívida, ativo, bem ou passivo, item do histórico de patrimônio, conta a pagar, assinatura, recorrente, e a limpeza de planos do mês no Orçamento (e as exclusões novas do C3). As duas confirmações `window.confirm` já existentes em Configurações **ficam como estão**.

### 5.3 Integridade referencial

- Regras puras em `src/domain/referentialIntegrity.ts`:
  - `countAccountReferences(accountId: number, data: { lancamentos; reservaConfig }): { lancamentos: number; reservaConfig: number }` — considera `contaId` e `contaDestinoId` dos lançamentos e `contaId` da configuração de reserva.
  - `countCardReferences(cardId: number, data: { lancamentos; parceladas }): { lancamentos: number; parceladas: number }`.
- **Excluir conta ou cartão com referências é bloqueado**, com mensagem "Em uso por N lançamentos (e M …)" e sem apagar nada. Sem referências, pede confirmação e exclui.

**Testes:**

- `src/domain/referentialIntegrity.test.ts`: conta referenciada só como `contaDestinoId` é contada; conta na reserva é contada; conta sem uso devolve zeros; idem para cartão (lançamentos e parceladas).
- `src/db/importPreview.test.ts`: `prepareImport` com arquivo válido devolve o resumo e **não altera** as contagens do banco; JSON malformado e estrutura inválida devolvem `ok: false`.
- `src/components/ConfirmDialog.test.tsx`: abre com foco em "Cancelar"; `Esc` cancela; "Excluir" confirma.
- `src/components/ImportPreview.test.tsx` (banco em memória, com dados): escolher arquivo mostra o resumo e **os dados atuais continuam intactos**; "Cancelar" mantém tudo; "Substituir todos os dados" troca o conteúdo.
- Testes de página (um por entidade crítica): excluir conta com lançamentos é bloqueado e mantém o registro; excluir cartão com parcelada é bloqueado; excluir lançamento só ocorre depois de confirmar e cancelar não exclui.

## 6. Fora de escopo (não tocar)

Não corrija nem refatore: a lógica de parcelas repetida em várias telas, a fonte Inter, o BOM do CSV, o tamanho do bundle, os nomes de arquivos e funções em português, o código morto já existente, a cobertura de testes do domínio, o teste do Painel, o formato da data inicial do ciclo do cartão, o `README`. Se encontrar algo mais, **registre no relatório** (seção de observações), sem alterar.

## 7. Critérios de aceite

- [ ] C1: os testes de `debtMethods.test.ts` passam com os valores exatos das tabelas, e falharam antes da correção (saída real registrada).
- [ ] C2: nenhuma ocorrência de `config.hoje` nem de `toISOString().slice(0, 10)` em `src`. Testes novos passam e falharam antes.
- [ ] C3: categorias, formas de pagamento e atalho de orçamento editáveis, com os testes novos passando.
- [ ] C4: importação com pré-visualização, exclusões com confirmação e bloqueio de conta e cartão em uso.
- [ ] Nenhum teste existente foi alterado. `typecheck`, `lint`, `test` e `build` sem erros e sem warnings de lint.
- [ ] `docs/EXECUCAO.md` e `docs/RELATORIO-FINAL.md` novos, e os da SPEC 1 preservados em `docs/historico/`.
- [ ] Declaração de conformidade cobrindo R1 a R43, sem lacunas. Nenhum desvio sem registro.

## 8. Relatório final

Ao terminar (ou ao parar por bloqueio), gere `docs/RELATORIO-FINAL.md` e imprima o **mesmo conteúdo, sem alterações**, na resposta final. Use as 12 seções do §12 da SPEC 1 (`docs/SPEC-app-financas-pessoais.md`), nesta ordem, com estas diferenças:

- **Marcos:** use C1, C2, C3 e C4 no lugar de M1 a M8, com `date` de início e de fim e as linhas finais reais de `typecheck`, `lint`, `test` e `build`.
- **Itens da SPEC:** liste os critérios de aceite da seção 7 com `[x]` ou `[ ]` e a evidência.
- **Nova seção "Prova vermelho→verde":** para cada teste novo, a linha real de falha antes da correção e a de sucesso depois.
- **Nova seção "Observações":** qualquer defeito encontrado fora do escopo, sem tê-lo corrigido.
- **Não verificado:** inclua explicitamente tudo o que não foi exercitado em navegador real.
- **Métricas:** inclua o número total de testes antes e depois, e o maior arquivo de código (caminho e linhas).
