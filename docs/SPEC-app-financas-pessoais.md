# SPEC 1 — App web de controle financeiro pessoal (escopo: planilha inteira)

## 0. LEIA ANTES DE QUALQUER COISA

1. Leia o `CLAUDE.md` **integralmente** antes de começar. Se ele não existir na raiz do projeto, **pare e informe**: não comece o trabalho.
2. As regras desta spec são **adicionais**, nunca substitutas. Em caso de conflito, o `CLAUDE.md` prevalece e a divergência deve ser registrada como DV do tipo CONFLITO (R38) e reportada no relatório final.
3. **Todo desvio** (de qualquer regra R1 a R43 ou de qualquer item desta spec) deve ser registrado em `docs/EXECUCAO.md` **no momento em que ocorrer** (R36 a R39) e aparecer no relatório final (§12). Omitir um desvio é a pior violação possível (R8). O relatório será auditado contra o código-fonte e os comandos (R42).
4. Antes de escrever qualquer código: rode `date` e crie `docs/EXECUCAO.md` com as seções fixas da R36.
5. Esta spec é executada em dois modelos diferentes (teste comparativo). Registre o modelo em uso e todo erro de ferramenta, limite de requisições (429) ou interrupção.

## 1. Objetivo

Construir um aplicativo para **navegador** de controle financeiro pessoal, **bonito, elegante e completo**, que reproduza as funções de uma planilha de referência de 20 abas e apresente um **Painel** com todos os gráficos e informações que o usuário precisa.

Pontos fixos:

- **Local-first:** todos os dados ficam no navegador do usuário (IndexedDB). Sem servidor, sem login, sem envio de dados a terceiros.
- Idioma **pt-BR**, moeda **BRL**, datas no formato `dd/mm/aaaa`.
- Nome provisório do app: **Cofre**. Deve ficar em um único arquivo (`src/config/app.ts`) para troca fácil.
- Não use o nome, a marca nem os textos da planilha de referência (Theros). Escreva textos próprios. As funções (orçamento, metas, dívidas etc.) são conceitos gerais de finanças pessoais.

## 2. Stack (obrigatória)

React 18 + TypeScript (`strict`) + Vite + Tailwind CSS + React Router + Recharts + Dexie (IndexedDB) + Zustand + zod + Vitest + Testing Library + ESLint + Prettier.

Regras de arquitetura:

- **Domínio puro** em `src/domain/` (cálculos), sem importar React nem Dexie. Toda regra de negócio fica aqui e é testada.
- **Dinheiro em centavos (inteiros)** em todo o domínio e no banco. Converta só na borda (formulário e exibição).
- **Datas** como string ISO `YYYY-MM-DD`, sem fuso horário. Mês-chave `AAAAMM` como número (ex.: `202610`).
- `Intl.NumberFormat` e `Intl.DateTimeFormat` para formatação.
- Sem dependências de rede em tempo de execução (fontes e ícones empacotados).
- **Nenhum pacote fora desta stack** (R15).

## 3. Modelo de dados

| Entidade | Campos |
|---|---|
| Configuração | nome do usuário, ano inicial, rendimento esperado a.a. (padrão 10,5%), inflação a.a. (padrão 4,5%), rendimento mensal equivalente (calculado: `(1+aa)^(1/12)-1`), data "Hoje" (padrão: data real; editável), limite de destaque de valores (padrão R$ 1.000), perfil de reserva, atalho de orçamento |
| Categoria | id, nome, grupo (`Receita`, `Necessidade`, `Desejo`, `Poupança`, `Transferência`). O **tipo** é derivado do grupo: Receita→`Receita`; Necessidade e Desejo→`Despesa`; Poupança→`Poupança`; Transferência→`Transferência` |
| Conta | id, nome, tipo (`Corrente`, `Poupança`, `Carteira`, `Investimentos`, `Dinheiro`, `Outro`), saldo inicial, saldo no extrato (opcional) |
| Cartão | id, nome, limite, dia de fechamento, dia de vencimento |
| Lançamento | id, data, descrição, categoria, valor (sempre positivo), conta, forma de pagamento, cartão (opcional), parcela "x/y" (texto informativo), status (`Pago`/`Pendente`), conta destino, observação |
| Compra parcelada | id, descrição, cartão, categoria, data da compra, valor total, nº de parcelas |
| Orçamento | plano por categoria e mês (valor), renda de referência (opcional), atalho escolhido, flag "usar sugestões do atalho" |
| Meta | id, nome, valor-alvo, prazo (data), já guardado, aporte mensal atual, rendimento a.a. (opcional) |
| Reserva | perfil, meses ajustados (opcional), conta da reserva, gasto essencial manual (opcional), aporte mensal |
| Dívida | id, nome, saldo devedor, juros % ao mês, parcela mínima |
| Ativo de investimento | id, nome, classe, total aportado, valor atual |
| Alvo de alocação | classe → % alvo (devem somar 100%) |
| Bem / Outro passivo | id, nome, valor |
| Histórico de patrimônio | mês, ativos, passivos (PL e variação são calculados) |
| Conta a pagar | id, descrição, vencimento, valor, categoria, status (vazio = Pendente), forma de pagamento |
| Assinatura | id, serviço, valor, ciclo (`Mensal`/`Anual`), próxima renovação, categoria |
| Recorrente | id, descrição, categoria, valor mensal, dia do mês, início (opcional), fim (opcional). O tipo (receita, despesa, aporte) é derivado do grupo da categoria |

**Padrões de fábrica** (editáveis em Configurações):

- **Categorias (33):**
  - Receita: Salário; 13º e férias; Renda extra e freelance; Rendimentos de investimentos; Reembolsos; Outras receitas.
  - Necessidade: Moradia (aluguel ou financiamento); Condomínio e IPTU; Contas da casa (luz, água, gás); Internet e celular; Mercado; Transporte; Saúde e farmácia; Educação; Seguros; Impostos e taxas; Dívidas e parcelas; Filhos e família; Pets.
  - Desejo: Restaurantes e delivery; Lazer e entretenimento; Viagens; Assinaturas e streaming; Compras pessoais; Beleza e cuidados; Presentes e doações; Outros gastos.
  - Poupança: Reserva de emergência; Investimentos; Metas e sonhos; Aposentadoria.
  - Transferência: Transferência entre contas; Pagamento de fatura.
- **Formas de pagamento:** Pix, Débito, Crédito, Dinheiro, Boleto, Transferência, Débito automático, Outro.
- **Contas iniciais:** Conta corrente (Corrente), Poupança (Poupança), Carteira (Carteira), Corretora (Investimentos).
- **Perfis de reserva (meses):** CLT 6; Servidor público 3; Autônomo/MEI/PJ 12; Empresário ou renda variável 12; Personalizado 6.
- **Atalhos de orçamento (necessidade/desejo/poupança):** 50/30/20 (clássico); 60/30/10; 70/20/10; 50/20/30 (foco em poupar); 40/30/30 (foco em investir); Personalizado (padrão 50/30/20, editável).
- **Classes de investimento:** Renda fixa, Ações, FIIs, Cripto, Exterior, Outros.

Renomear categoria deve **atualizar os lançamentos existentes** (melhoria sobre a planilha). Lançamento cuja categoria foi apagada vira "Sem categoria".

## 4. Motor de cálculo (`src/domain`)

Quando algo estiver ambíguo, adote a regra abaixo e registre no relatório como **decisão de implementação**. Não improvise em silêncio.

### 4.1 Lançamentos

- Valor com sinal: Receita `+valor`; Transferência `0`; demais `-valor`.
- **Pendente** conta no mês (competência) nas visões de fluxo, orçamento e painel, mas **não** altera saldo de conta.
- Despesa com cartão preenchido: a conta fica em branco. O dinheiro só sai da conta quando o usuário lança "Pagamento de fatura" (categoria Transferência) na conta de origem.

### 4.2 Contas

`saldo atual = saldo inicial + entradas − saídas + recebidas − enviadas`, considerando só lançamentos **não pendentes**:

- entradas: receitas na conta;
- saídas: despesas na conta **sem cartão**;
- recebidas: lançamentos de Poupança e Transferência com essa conta como **destino**;
- enviadas: lançamentos de Poupança e Transferência com essa conta como **origem** (inclui pagamento de fatura).

Resumo: saldo total; disponível (Corrente, Carteira, Dinheiro); poupança e reservas; investimentos (contas); saldo sem contas de investimento. Cada conta mostra % do total e **diferença vs. saldo do extrato** (quando preenchido).

### 4.3 Cartões e faturas

Para o mês analisado `M` e um cartão com fechamento `F` e vencimento `V`:

- Ciclo começa em `min(F, último dia do mês M-1) + 1` do mês anterior; fecha em `min(F, dias do mês M)`.
- Vence: se `V > F`, no mesmo mês `M`; senão, no mês seguinte (sempre limitado ao último dia do mês).
- Compra feita **até** o dia do fechamento entra na fatura daquele mês; **depois**, na seguinte.
- Compras do ciclo = soma das despesas com esse cartão dentro do ciclo.
- Parcelas do mês = soma das parcelas de Compras parceladas desse cartão cuja fatura é `M`.
- **Fatura do mês = compras do ciclo + parcelas do mês.** % do limite = fatura ÷ limite.
- Parcelas futuras = soma do "restante a pagar" das parceladas do cartão (só faturas **posteriores** a `M`).
- Limite livre estimado = limite − fatura − parcelas futuras.
- Projeção de 12 meses a partir de `M` (inclusive) de parcelas comprometidas, por cartão.

### 4.4 Compras parceladas

- Valor da parcela = valor total ÷ nº de parcelas (distribuir centavos: a diferença vai na primeira parcela).
- 1ª fatura = mês da fatura em que a data da compra cai (regra de fechamento acima). Última fatura = 1ª + (n−1) meses.
- As parcelas entram nas **despesas do mês da fatura**, com a categoria da compra.
- O usuário registra a compra **uma vez** (não também em Lançamentos). Mostre aviso na tela.

### 4.5 Orçamento

- Renda de referência: padrão = média das receitas dos **3 últimos meses com movimento**; editável.
- Meta por grupo (R$/mês) = % do atalho × renda de referência.
- "Usar sugestões do atalho": **Sim** = o plano de cada categoria passa a ser a meta do grupo repartida pelo histórico de gastos; **Não** = vale o que o usuário digitou.
- Tabela do mês: categoria, grupo, planejado, realizado, variação R$ e %, uso da meta, situação (dentro do plano / estourou), variação vs. mês anterior.
- Por grupo: planejado, realizado, diferença, situação. Poupança do grupo = sobra (receitas − despesas).
- **Sobra a alocar** = renda − plano do mês (base zero: ajustar até zerar).
- **Uso do orçamento** = despesas realizadas ÷ despesas planejadas do mês.
- Visão anual: plano do ano, realizado no ano, variação.

### 4.6 Fluxo anual

Para cada mês do ano analisado: receitas; despesas (**inclui parcelas dos cartões**); saldo; taxa de poupança (saldo ÷ receitas); saldo acumulado (só meses com movimento); necessidades; desejos; guardado e investido; "sem categoria". Mais: total do ano, média mensal, **melhor mês** e **pior mês** (maior e menor saldo) e **mapa de calor** categoria × mês com escala de cor.

### 4.7 Dia a dia

- Por dia do mês: receitas, despesas, saldo do dia, saldo acumulado.
- **Pode gastar por dia** = `max(0, sobra do mês ÷ dias restantes)`, usando a data "Hoje". Decisão de implementação: dias restantes = dias do mês − dia de hoje + 1, mínimo 1; fora do mês analisado, usar os dias do mês.
- 10 maiores gastos do mês (data, descrição, categoria, valor, % das despesas).

### 4.8 Recorrentes e previsão

Previsão dos próximos 12 meses a partir do mês analisado. Linhas: receitas recorrentes; despesas recorrentes; parcelas dos cartões; aportes planejados; **saldo do mês = receitas − despesas − parcelas − aportes**; **caixa projetado** = parte do saldo atual das contas do dia a dia (Corrente, Carteira, Dinheiro) e acumula o saldo do mês. Respeitar início e fim de cada recorrente.

### 4.9 Metas

Taxa mensal usada = a das Configurações, salvo se a meta tiver rendimento próprio (`(1+aa)^(1/12)-1`).

- % concluído = guardado ÷ alvo. Falta = `max(0, alvo − guardado)`.
- Meses até o prazo = diferença de meses entre "Hoje" e o prazo (mínimo 0).
- **Aporte necessário = PMT** da taxa mensal, nº de meses, valor presente = guardado, valor futuro = alvo (0 se já concluída; se faltarem 0 meses, = falta).
- **Conclusão com o aporte atual = NPER** (arredondado para cima), a partir do mês de "Hoje". Sem aporte → "Sem aporte".
- Situação: Concluída; No prazo (conclusão ≤ prazo); Atrasada: aumente o aporte; Sem prazo; Sem aporte.
- Total das metas e quantidade de atrasadas.

### 4.10 Reserva de emergência

- Meses-alvo = ajuste manual (se > 0) ou o do perfil.
- Gasto essencial = manual (se > 0) ou média dos **3 últimos meses** das categorias do grupo Necessidade, **incluindo parcelas dos cartões**.
- Meta da reserva = meses-alvo × gasto essencial. Reserva atual = saldo da conta escolhida. Falta = `max(0, meta − atual)`. % da meta.
- **Cobertura (meses)** = reserva atual ÷ gasto essencial.
- Situação: ≥ meses-alvo "Reserva completa"; ≥ metade "Quase lá"; ≥ 1 "Em construção"; senão "Crítica (menos de 1 mês)".
- Meses para completar = NPER(taxa mensal, aporte, reserva atual → meta), arredondado para cima; "Já completa" ou "Sem aporte" quando for o caso.

### 4.11 Dívidas (motor de 60 meses)

Três métodos, até 60 meses: **só o mínimo**, **bola de neve** (menor saldo primeiro) e **avalanche** (maior juros primeiro).

- Total por mês para dívidas = soma das parcelas mínimas + valor extra informado.
- Juros do mês = saldo × taxa (aplicados antes do pagamento). Último pagamento = `min(parcela, saldo + juros)`.
- Em bola de neve e avalanche, a parcela de uma dívida quitada é **redirecionada** para a próxima da ordem (o total mensal se mantém).
- Saída por método: meses para quitar ("mais de 60" se não quitar), data de quitação, total pago, juros totais, juros e meses economizados vs. só o mínimo, saldo devedor mês a mês (gráfico).
- **Alerta** por dívida quando a parcela mínima ≤ saldo × juros ("A parcela não cobre os juros").
- Juros estimados do 1º mês = soma de saldo × taxa.

### 4.12 Investimentos e patrimônio

- Por ativo: rentabilidade R$ = atual − aportado; % = R$ ÷ aportado; % da carteira.
- Alocação por classe: valor atual, % atual, % alvo, diferença em p.p., **ajuste para chegar ao alvo** = `alvo% × total − valor atual`, situação. Alertar quando os alvos não somam 100%.
- **Patrimônio líquido** = ativos − passivos. Ativos = saldos das contas (sem contas de Investimentos) + carteira + bens. Passivos = dívidas cadastradas + outros passivos.
- Histórico mensal manual (botão "registrar mês atual"): ativos, passivos, PL e variação no mês.

### 4.13 Contas a pagar e assinaturas

- Contas a pagar: dias para vencer = vencimento − "Hoje". Situação: Paga; Atrasada (pendente e dias < 0); Vence em breve (0 a 7 dias); No prazo. Cartões: em aberto (total), atrasadas, vencem em 7 dias, pendentes no mês analisado. Lista dos **5 próximos vencimentos**.
- Assinaturas: custo mensal (anual ÷ 12), custo anual (mensal × 12), renova em (dias), situação, **peso na renda** = custo mensal total ÷ receita média mensal do ano. Quantidade de ativas e próxima renovação.

### 4.14 Simuladores

Aporte no fim do mês, taxa mensal `i = (1+aa)^(1/12)-1`.

1. **Juros compostos:** `VF = inicial·(1+i)^n + aporte·((1+i)^n−1)/i`. Tabela e gráfico ano a ano (saldo, aportado, juros). Mostrar também o valor futuro em poder de compra de hoje: `VF ÷ (1+inflação)^anos`, e a parte do resultado que vem de juros. Padrões: inicial 10.000; aporte 500; 10 anos.
2. **Independência financeira (regra dos 25x / 4% a.a.):** patrimônio necessário = renda desejada × 12 × 25; quanto falta; % percorrido; renda passiva do patrimônio de hoje = patrimônio × 4% ÷ 12; anos para chegar com o aporte atual (NPER, taxa real mensal); aporte necessário para chegar no prazo (PMT). Padrões: renda 8.000; aporte 1.500; 20 anos.
3. **Custo do hábito:** gasto por vez × vezes por mês × 12 × anos; total gasto; valor se fosse investido todo mês; diferença. Padrões: 25 × 30 vezes por mês; 10 anos.

### 4.15 Painel e nota de saúde

Período: "Automático" = ano e mês do último lançamento; o usuário pode escolher outro.

**Indicadores (8):** receitas do mês; despesas do mês; saldo do mês; taxa de poupança (saldo ÷ receitas, meta 20%); patrimônio líquido; reserva de emergência (cobertura em meses); % do orçamento usado; pode gastar por dia.

**Nota de saúde financeira (0 a 100).** Cinco regras, até 20 pontos cada. `clamp(x) = max(0, min(1, x))`:

| Regra | Valor | Pontos |
|---|---|---|
| Poupança (meta ≥ 20%) | taxa de poupança | `clamp(taxa ÷ 0,20) × 20` |
| Reserva | cobertura ÷ meses-alvo | `clamp(cobertura ÷ meses-alvo) × 20` |
| Dívidas (meta ≤ 30%) | parcelas mínimas ÷ receitas | `clamp((0,6 − x) ÷ 0,3) × 20` |
| Gastos fixos (meta ≤ 50%) | necessidades ÷ receitas | `clamp((0,8 − x) ÷ 0,3) × 20` |
| Orçamento (meta ≤ 100%) | uso do orçamento | `clamp((1,3 − x) ÷ 0,3) × 20` |

- Regra **sem dados** (receitas = 0, sem gasto essencial ou sem plano) fica **fora** da nota.
- **Nota = pontos obtidos ÷ (20 × nº de regras com dados) × 100.**
- Situação de cada regra: ≥ 18 "Ótimo"; ≥ 12 "Bom"; ≥ 6 "Atenção"; senão "Crítico".
- A tela exibe as regras abertas, o valor de cada uma, a meta, os pontos e a situação.

**Destaques do mês (3):** maior categoria de gasto; categoria com maior aumento vs. mês anterior (R$); maior gasto individual.
**Também no Painel:** próximos vencimentos (5) e maiores gastos do mês.

## 5. Telas (20 módulos)

Navegação: barra lateral recolhível no desktop; menu inferior e gaveta no celular. Cada tela abaixo reproduz as colunas e os resumos descritos na seção 4.

| Rota | Conteúdo |
|---|---|
| `/inicio` | Boas-vindas, 5 passos de configuração, atalhos, legenda de cores, dicas |
| `/painel` | Seção 4.15, com os 6 gráficos do Painel |
| `/lancamentos` | Tabela com busca, filtros (período, categoria, conta, cartão, status, tipo), ordenação, edição em linha ou em painel lateral, 4 totais (receitas, despesas, poupança e investimentos, pendente), destaque de valores acima do limite, atalho para novo lançamento |
| `/contas` | 4.2, com cartões de resumo |
| `/cartoes` | 4.3, com gráfico de parcelas comprometidas por mês |
| `/parcelados` | 4.4, com a projeção mensal das parcelas |
| `/orcamento` | 4.5 |
| `/fluxo` | 4.6, com mapa de calor |
| `/dia-a-dia` | 4.7, calendário do mês e gráfico de despesas por dia |
| `/recorrentes` | 4.8, com gráfico de saldo do mês e caixa projetado |
| `/metas` | 4.9 |
| `/reserva` | 4.10 |
| `/dividas` | 4.11, com gráfico de saldo devedor nos 3 métodos |
| `/investimentos` | 4.12, com 2 gráficos (alocação atual × alvo; evolução do patrimônio) |
| `/contas-a-pagar` | 4.13 |
| `/assinaturas` | 4.13 |
| `/simuladores` | 4.14, com gráfico de juros compostos |
| `/configuracoes` | Premissas, categorias (criar, renomear, mudar grupo, excluir), formas de pagamento, perfis, atalhos de orçamento, **exportar e importar JSON**, **exportar lançamentos em CSV**, **carregar dados de exemplo**, **apagar tudo** (com confirmação) |
| `/sobre` | Versão, limites, avisos (não é consultoria financeira; simulações são estimativas) |

**Gráficos (13):**

1. Receitas × despesas por mês (barras, ano).
2. Para onde foi o dinheiro no mês (rosca, 8 maiores categorias + "Outras categorias").
3. Regra 50/30/20: real × ideal (% da renda).
4. Saldo acumulado no ano (linha).
5. Orçamento × realizado (maiores gastos do mês).
6. Progresso das metas (% concluído).
7. Parcelas já comprometidas por mês (cartões).
8. Despesas por dia do mês.
9. Saldo do mês e caixa projetado.
10. Saldo devedor ao longo do tempo (3 métodos).
11. Alocação atual × alvo.
12. Evolução do patrimônio.
13. Juros compostos: saldo × total aportado.

## 6. Design (bonito e elegante)

- Direção visual: sóbria e acolhedora. Fundo claro suave, cartões brancos com sombra leve e cantos arredondados, bastante espaço em branco. Cor de destaque única (verde-petróleo) e cores semânticas: verde (dentro do plano), âmbar (atenção), rosa-avermelhado (estourou ou atrasou).
- **Tema claro e escuro**, com troca manual e respeito ao tema do sistema. Todas as cores como tokens (variáveis CSS).
- Tipografia: Inter empacotada localmente (sem CDN), números tabulares em valores monetários.
- Painel com hierarquia clara: 8 indicadores no topo, nota de saúde em destaque (medidor circular), gráficos em grade responsiva, listas de destaques e vencimentos.
- Gráficos com paleta consistente, tooltips em BRL, legendas legíveis e sem depender só de cor.
- Estados vazios bem desenhados (texto + ação), carregamento e erro tratados.
- Microinterações discretas (transições de 150–250 ms). Respeitar `prefers-reduced-motion`.
- Responsivo de 360 px a telas largas. Acessível: teclado, foco visível, contraste AA, rótulos em formulários.

## 7. Persistência, importação e dados de exemplo

- Dexie/IndexedDB com versão de esquema e migrações.
- **Exportar JSON** (backup completo) e **importar JSON** validado com zod, com pré-visualização e confirmação antes de sobrescrever.
- **Dados de exemplo:** gerar cerca de 6 meses de dados fictícios coerentes (receitas, despesas por todas as categorias, 2 cartões com parcelados, metas, dívidas, investimentos, contas a pagar, assinaturas, recorrentes). Servem para avaliar o Painel e os gráficos. Nunca devem aparecer sem o usuário pedir.

## 8. Testes (Vitest, obrigatórios)

Todo o `src/domain` com testes. Casos que **devem** existir (valores esperados):

1. **Nota de saúde:** receitas 5.000; despesas 4.500 → taxa 10% → 10 pts. Dívidas 45% → 10 pts. Necessidades 65% → 10 pts. Orçamento 115% → 10 pts. Cobertura 3 de 6 meses → 10 pts. Soma = 50 pts de 100 possíveis → nota 50. Se a regra de reserva estiver sem dados, sobram 4 regras com 10 pts cada: 40 pts de 80 possíveis → nota 50.
2. **Fatura:** cartão com fechamento dia 25 e vencimento dia 5, mês analisado outubro/2026 → ciclo 26/09 a 25/10, vence 05/11. Compra em 25/10 entra em outubro; compra em 26/10 entra em novembro.
3. **Parcelado:** compra em 28/10/2026, fechamento dia 25, 3 parcelas, total R$ 300,00 → 1ª fatura novembro/2026, última janeiro/2027, parcela R$ 100,00.
4. **Parcelas com centavos:** R$ 100,00 em 3 parcelas → 33,34 + 33,33 + 33,33.
5. **PMT de meta:** alvo 12.000, guardado 0, 12 meses, taxa 0,5% a.m. → ≈ R$ 972,80. Com taxa 0 → R$ 1.000,00.
6. **NPER:** retorna "Sem aporte" quando o aporte é 0 e o guardado é menor que o alvo.
7. **Dívida só mínimo:** saldo 1.000, juros 2% a.m., parcela 100 → quita em **12** meses. Parcela 20 (= juros) → alerta e "mais de 60".
8. **Avalanche vs. bola de neve:** com duas dívidas de saldos e juros em ordem oposta, as ordens de quitação diferem e a avalanche paga menos juros totais.
9. **Saldo de conta:** pendentes não alteram o saldo; despesa com cartão não sai da conta; "Pagamento de fatura" sai.
10. **Patrimônio líquido:** ativos (contas sem investimentos + carteira + bens) − passivos (dívidas + outros).
11. **Simulador:** inicial 10.000; aporte 500; 10 anos; 10,5% a.a. → valor futuro conferido com a fórmula 4.14 (tolerância de 1 centavo).
12. **Importação de JSON:** arquivo inválido é rejeitado sem alterar os dados.

Além disso: testes de componente para o formulário de lançamento e para o Painel com dados de exemplo.

## 9. Marcos de execução

Execute **nesta ordem**. Em cada marco:

1. Rode `date` ao iniciar e ao terminar (R40).
2. Ao terminar, rode `typecheck`, `lint`, `test` e `build`. Todos devem passar (R29). Só então inicie o marco seguinte (R14).
3. Atualize `docs/EXECUCAO.md` com o status do marco, as linhas finais reais dos quatro comandos e qualquer desvio, decisão ou erro ocorrido.
4. Se houver interrupção (limite de requisições, erro de ferramenta) ou bloqueio, pare **no limite de um marco** (R43) e deixe o status claro no `docs/EXECUCAO.md` e no relatório final.

| Marco | Entrega |
|---|---|
| M1 | Fundação: projeto, layout, tema, rotas, Dexie com esquema, tipos, padrões de fábrica, exportar e importar JSON, dados de exemplo |
| M2 | Domínio do núcleo (4.1 a 4.4) com testes |
| M3 | Telas do núcleo: Início, Lançamentos, Contas, Cartões, Parcelados, Configurações |
| M4 | Orçamento, Fluxo anual, Dia a dia, Recorrentes (domínio, testes e telas) |
| M5 | Metas, Reserva, Contas a pagar, Assinaturas, Simuladores |
| M6 | Dívidas, Investimentos e patrimônio |
| M7 | Painel completo: 8 indicadores, nota de saúde, destaques, 6 gráficos, vencimentos |
| M8 | Polimento: acessibilidade, responsivo, estados vazios, README, `docs/EXECUCAO.md` completo e `docs/RELATORIO-FINAL.md` (§12) |

## 10. Critérios de aceite

- [ ] Os 20 módulos existem, com as colunas e os resumos da seção 4.
- [ ] Os 13 gráficos renderizam com dados reais e com estado vazio.
- [ ] A nota de saúde segue exatamente a seção 4.15.
- [ ] Todos os testes da seção 8 passam. `typecheck`, `lint` e `build` sem erros.
- [ ] Dados persistem ao recarregar. Exportar e importar JSON funcionam.
- [ ] Nenhum acesso à rede em tempo de execução.
- [ ] Tema claro e escuro; responsivo de 360 px a telas largas.
- [ ] Nenhum uso do nome, da marca ou dos textos da planilha de referência.
- [ ] `docs/EXECUCAO.md` existe, foi mantido durante o trabalho e traz marcos, desvios, decisões, erros e não verificado.
- [ ] `docs/RELATORIO-FINAL.md` existe, segue a §12 e o mesmo conteúdo foi impresso na resposta final.
- [ ] A declaração de conformidade cobre R1 a R43, sem lacunas.
- [ ] Nenhum desvio ficou sem registro.

## 11. Fora de escopo

Servidor, login, sincronização entre dispositivos, importação de extratos bancários ou da planilha original, PWA offline, notificações, múltiplos usuários.

## 12. Relatório final (obrigatório)

Ao terminar (ou ao parar por bloqueio), gere `docs/RELATORIO-FINAL.md` e imprima o **mesmo conteúdo, sem alterações**, na resposta final. Um revisor externo vai auditá-lo contra o código-fonte e a saída dos comandos: afirmação sem evidência, ou contradita pelo código, conta como relatório falso (R8, R42). Use exatamente estas seções, nesta ordem:

1. **Identificação:** modelo, provedor, ferramenta (Claude Code e extensão), saída de `date` do início e do fim, duração total.
2. **Resumo executivo:** no máximo 5 linhas: o que foi entregue, o que não foi, e o número de desvios por severidade.
3. **Marcos:** tabela M1 a M8 com início e fim (saída de `date`), a linha final real de `typecheck`, `lint`, `test` e `build`, e o status (Completo, Parcial ou Não iniciado).
4. **Declaração de conformidade:** uma linha para cada regra, de R1 a R43: `Rn — CUMPRIDA` ou `Rn — DESVIADA (DV-x)`. Sem lacunas.
5. **Registro de desvios:** tabela com DV-n, tipo (DESVIO ou CONFLITO), regra ou seção, o que ocorreu, motivo, impacto, severidade autoavaliada e status. Se não houve nenhum, escreva "Nenhum desvio" e aponte a evidência.
6. **Decisões de implementação:** D-n com o ponto ambíguo, a decisão e o motivo.
7. **Itens da SPEC:** todos os critérios de aceite da §10 com `[x]` ou `[ ]` e a evidência (arquivo ou comando). Inclua a lista dos 20 módulos e dos 13 gráficos, cada um com status (Completo, Parcial ou Ausente) e o arquivo responsável.
8. **Testes:** número total de testes, número por arquivo de domínio e quais dos 12 casos da §8 existem, com o caminho de cada teste.
9. **Erros, limites e interrupções:** cada erro de ferramenta, 429, nova tentativa ou travamento, com o marco, o que ocorreu e como foi resolvido.
10. **Não verificado:** tudo o que não foi verificado de fato (aparência, responsividade, acessibilidade, navegadores, desempenho com muitos lançamentos), sem eufemismos.
11. **Métricas:** número de arquivos de código, total de linhas, maior arquivo (caminho e linhas) e as dependências (conteúdo de `dependencies` e `devDependencies` do `package.json`).
12. **Como rodar:** comandos exatos.
