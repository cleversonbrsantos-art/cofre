# SPEC 6 — Correção de Cotações para BDRs e Tratamento de Dados Inconsistentes

## Objetivo
Corrigir o bug em que os BDRs (ex: NVDC34) estão puxando cotações astronômicas e incorretas da API `brapi.dev`. O sistema deve validar a resposta da API e, se o BDR não for encontrado corretamente na brapi, buscar de uma fonte alternativa confiável.

## 1. Validação de Dados da API (`src/services/quotes.ts`)
A função `fetchAndCacheQuote` precisa de uma camada de validação para evitar que valores absurdos (como o preço da ação original) entrem no banco.
- Se o ticker terminar em números (ex: `34`, `35`, `32`, `39`), é um forte indicativo de BDR (ex: NVDC34, AAPL34).
- Adicione uma verificação: se a API retornar um `price` (em centavos) que seja desproporcionalmente alto em relação ao esperado para um BDR na B3 (ex: maior que R$ 5.000,00 ou 500000 centavos), descarte esse valor e trate como falha.

## 2. Fallback com API Alternativa para BDRs
Se a `brapi.dev` falhar ou retornar um valor inválido para BDRs, use a API pública do **Yahoo Finance** como fallback.
- Endpoint: `https://query1.finance.yahoo.com/v8/finance/chart/{TICKER}.SA`
  *(Nota: o sufixo `.SA` indica que é um ativo da B3).*
- Exemplo de chamada: `fetch('https://query1.finance.yahoo.com/v8/finance/chart/NVDC34.SA')`
- **Como ler a resposta:** O JSON do Yahoo Finance possui o preço em `chart.result[0].meta.regularMarketPrice` e a variação diária pode ser calculada ou lida em `chart.result[0].meta.regularMarketChangePercent`.
- Se o Yahoo retornar um valor válido, salve esse valor no cache do Dexie e retorne. Se o Yahoo também falhar, retorne o cache antigo ou `null` (exibindo "Indisponível" na tela).

## 3. Limpeza do Cache Corrompido
- Como o banco já salvou o valor errado (R$ 6.964,65) para NVDC34, adicione uma instrução ou um script no console que force a limpeza da tabela `quotes` no Dexie (ou apenas aguarde o TTL de 10 minutos expirar para que a nova API seja chamada).

## Restrições
- Nenhum pacote novo (use `fetch` nativo).
- O código deve estar preferencialmente em inglês, mas os fallbacks documentados em português no código.
- Não altere a interface visual (a tabela continua a mesma).

## Critérios de Aceite
1. `npm run build` e `lint` passam.
2. Ao recarregar a tela de investimentos e limpar o cache (ou esperar expirar), o BDR `NVDC34` deve exibir um valor condizente com a realidade (ex: entre R$ 20,00 e R$ 50,00) ou "Indisponível" se ambas as APIs falharem.