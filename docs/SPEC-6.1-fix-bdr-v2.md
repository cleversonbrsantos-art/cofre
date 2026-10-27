# SPEC 6.1 — Correção Definitiva do Preço de BDRs

## Objetivo
Corrigir o valor do BDR NVDC34 (que está puxando R$ 1.099,00 em vez de ~R$ 24,00). A API do Yahoo Finance v8 retornou o valor errado ou em dólares. Precisamos de uma solução robusta.

## 1. Refatorar o Yahoo Finance (`src/services/quotes.ts`)
Altere a URL do fallback do Yahoo Finance da v8 para a v7, que retorna o preço do ativo brasileiro corretamente:
*   **Endpoint:** `https://query1.finance.yahoo.com/v7/finance/quote?symbols={TICKER}.SA`
*   **Como ler a resposta:** A resposta estará em `quoteResponse.result[0]`.
    *   O preço atual está em `regularMarketPrice`.
    *   A variação está em `regularMarketChangePercent`.
    *   A moeda está em `currency` (deve ser "BRL").
*   **Sanidade:** Se a `currency` retornada não for "BRL", ou se o preço for maior que R$ 500,00, descarte o valor e trate como falha.

## 2. Fallback Secundário (Opcional)
Se o Yahoo Finance v7 falhar, use a API pública do **Status Invest** (que não exige chave e é muito precisa para a B3) ou retorne `null` (para aparecer "Indisponível").

## 3. Limpeza de Cache
Para garantir que o usuário veja o valor novo imediatamente, force a invalidação do cache de todos os BDRs no `fetchAndCacheQuote` (você pode adicionar uma função `clearQuotesCache()` no Dexie e chamar no botão "Atualizar Cotações" da tela, ou apenas orientar o usuário a apagar o IndexedDB).

## Critérios de Aceite
1. `npm run build` e `lint` passam.
2. Ao limpar o cache do Dexie para `NVDC34` e recarregar a tela, o preço atual deve ser menor que R$ 100,00 (condizente com o valor real do BDR) e a moeda deve ser BRL.