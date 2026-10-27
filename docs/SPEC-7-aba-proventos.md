# SPEC 7 — Aba de Proventos (Dividendos e JCP)

## Objetivo
Criar uma nova aba dedicada a Proventos (`/proventos`), inspirada na experiência do Investidor10. O sistema deve buscar o histórico de dividendos dos ativos da carteira do usuário, calcular os proventos recebidos e a receber, e exibir uma tabela detalhada.

## 1. Camada de Dados (API e Domínio)

### 1.1. Busca de Dividendos (`src/services/dividends.ts`)
Crie um novo serviço para buscar proventos.
*   **Função:** `fetchAndCacheDividends(ticker: string, type: string): Promise<Dividend[]>`
*   **API:** Use a `brapi.dev` (`/api/v2/stocks/dividends` para Ações e `/api/v2/fii/dividends` para FIIs).
*   **Cache:** Crie uma tabela `dividends` no Dexie (versão 4 do schema) com TTL de 24 horas (proventos não mudam toda hora).
*   **Objeto `Dividend`:** `{ ticker, type, amount (centavos), exDate, paymentDate, status: "Pago" | "A Receber" }`.

### 1.2. Regra de Domínio (`src/domain/dividends.ts`)
Crie uma função pura que cruze os dados:
*   **Entrada:** Lista de ativos do usuário (ticker + quantidade) e a lista de dividendos retornada da API.
*   **Saída:** Um resumo com:
    *   Total Recebido (12 meses).
    *   Total a Receber (futuro).
    *   Média Mensal.
    *   Lista detalhada para a tabela: `{ ativo, tipo, dataCom, dataPagamento, quantidade, valorPorCota, total }`.

## 2. Camada de UI (A Tela de Proventos)

### 2.1. Navegação
*   Adicione o link "Proventos" no menu lateral (com ícone de moeda/cifrão).

### 2.2. Estrutura da Tela (`src/pages/Proventos.tsx`)
*   **Topo (Cards):** 3 cartões simples (Total Recebido 12M, Total a Receber, Média Mensal).
*   **Tabela de Histórico:** 
    *   Colunas: Ativo, Tipo (Dividendo/JCP), Status (badge verde "Pago" / amarelo "A Receber"), Data Com, Data Pagamento, Qtd, Valor por Cota, Total.
    *   Ordenação por Data de Pagamento (mais recente primeiro).
*   **Filtros:** Um select simples para filtrar por "Todos", "Pago", "A Receber".

## 3. Restrições
*   **R15:** Nenhum pacote novo (use fetch nativo).
*   **R24:** Componentize a tabela e os cards em arquivos separados.
*   **R25:** Identificadores em inglês, UI em pt-BR.
*   **Falha de API:** Se a brapi falhar, mostre os dados do cache ou uma mensagem de "Não foi possível carregar os proventos". O app não deve quebrar.

## Critérios de Aceite
1. `npm run build` e `lint` passam.
2. A aba Proventos aparece no menu e abre corretamente.
3. Os ativos que o usuário possui (ex: PETR4, ITUB4) têm seus dividendos listados na tabela.
4. O status "Pago" ou "A Receber" é calculado com base na data de pagamento em relação à data de hoje.