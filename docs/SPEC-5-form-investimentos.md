# SPEC 5 — Formulário de Cadastro de Ativos com Autocomplete e Cálculo Automático

## Objetivo
Melhorar a experiência de cadastro de novos investimentos. O usuário não deve digitar o ticker cegamente. Ele deve buscar o ativo, ter o preço atual preenchido automaticamente (podendo ser editado, caso tenha comprado a um preço diferente) e o valor total investido deve ser calculado multiplicando Preço Pago × Quantidade.

## 1. Dados para o Autocomplete
Para não estourar a API de busca a cada letra digitada, crie um arquivo `src/lib/ativosPopulares.ts` exportando uma lista estática com os ~100 tickers mais famosos da B3 (ex: PETR4, VALE3, ITUB4, BBAS3, MGLU3, etc.) e as top 20 criptomoedas (Ex: BTC, ETH, SOL, etc.). 
Inclua o nome da empresa e a classe do ativo (Ações, FIIs, Cripto) para facilitar a busca.

## 2. O Novo Formulário (`src/components/investimentos/FormularioAtivo.tsx`)
Substitua o formulário atual de "Novo Ativo" por um componente dedicado.

### 2.1. Campos e Comportamento
1.  **Busca (Ticker):** Um input de texto. Ao digitar 2 ou mais letras, abra um dropdown flutuante abaixo do input filtrando a lista de `ativosPopulares.ts` (tanto por Ticker quanto por Nome). 
    *   *Acessibilidade:* O usuário deve conseguir navegar no dropdown com as setas (Cima/Baixo) e selecionar com Enter.
2.  **Seleção:** Quando o usuário seleciona o ativo no dropdown (ex: PETR4), o input preenche o ticker e a classe.
3.  **Preço Unitário Atual:** Assim que o ticker é selecionado, o formulário deve chamar a função `fetchAndCacheQuote(ticker, classe)` (já criada na SPEC 4). 
    *   Enquanto carrega, mostre um `Loader2` girando dentro do input.
    *   Quando o preço chegar, preencha o campo.
4.  **Preço de Compra (Editável):** O campo "Preço Pago" é preenchido automaticamente com o valor da API, mas **o usuário pode alterá-lo**.
5.  **Quantidade:** Input numérico (aceita decimais para cripto, ex: 0.5 BTC).
6.  **Total Investido (Read-only):** Um campo calculado em tempo real como `Preço Pago × Quantidade`.

### 2.2. Conversão de Centavos
Lembre-se da regra R17: o banco salva em centavos. O formulário deve exibir em Reais (R$). Converta a string do usuário (ex: "38,50") para 3850 centavos.

## 3. Integração
*   Modifique a página `src/pages/Investimentos.tsx` para usar esse novo formulário.
*   Ao salvar, o objeto enviado ao Dexie deve calcular o `totalAportado` com base no `Preço Pago × Quantidade`.
*   A tabela do Accordion deve exibir o Preço Médio (que neste caso de cadastro é o Preço Pago) e o Saldo Atual.

## Restrições
*   **R15:** Nenhum pacote novo (construa o dropdown de autocomplete na mão com React).
*   **R24:** Mantenha o formulário em um arquivo separado (`FormularioAtivo.tsx`) e abaixo de 400 linhas.
*   **Falha de API:** Se a API falhar ao buscar o preço do ativo, não bloqueie o cadastro. Deixe o campo "Preço Pago" vazio para o usuário digitar manualmente.

## Critérios de Aceite
1. `npm run build` e `lint` passam.
2. Ao digitar "PETR", o dropdown mostra "PETR4" e "PETR3".
3. Ao clicar em PETR4, o campo de preço é preenchido automaticamente (ex: R$ 38,50).
4. Ao alterar a quantidade para 100, o "Total Investido" exibe R$ 3.850,00 instantaneamente.
5. Ao clicar em "Salvar", o ativo aparece no Accordion correto com o saldo de R$ 3.850,00.