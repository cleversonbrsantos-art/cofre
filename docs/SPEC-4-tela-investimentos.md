# SPEC 4 — Tela de Investimentos Avançada com Cotações em Tempo Real

## 0. LEIA ANTES DE QUALQUER COISA
1. Leia o `CLAUDE.md` integralmente.
2. As regras R1 a R43 continuam valendo. Todo desvio deve ser registrado no `docs/EXECUCAO.md`.
3. Escopo estrito: implemente apenas o que está descrito aqui.
4. Rode `date` no início e no fim. Crie a cópia de segurança do `EXECUCAO.md` atual.

## 1. Objetivo
Substituir a tela atual de Investimentos por um dashboard completo e agrupado (inspirado no Investidor10). A tela deve exibir o patrimônio total atualizado, cartões de resumo e uma lista de ativos dividida por classes (Accordions) com cotações em tempo real via API pública (sem exigir chave de API do usuário) e cache local para respeitar os limites de requisição.

## 2. Camada de Dados (Dexie + API + Domínio)

### 2.1. Nova Tabela no Dexie (Schema Versão 3)
No arquivo `src/db/schema.ts`, crie a versão 3 do banco adicionando a tabela `quotes`:
*   `quotes`: `{ ticker: string (PK), price: number, changePercent: number, updatedAt: number }`

### 2.2. Serviço de Cotações (`src/services/quotes.ts`)
Crie um serviço isolado para buscar as cotações.
*   **Função:** `fetchAndCacheQuote(ticker: string, type: string): Promise<Quote | null>`
*   **Lógica:**
    1. Normalize o `ticker` (maiúsculo).
    2. Verifique a tabela `quotes` no Dexie. Se `updatedAt` for menor que 10 minutos, retorne o valor do cache.
    3. Se estiver velho ou não existir, faça a chamada de API usando `fetch` nativo:
        *   **Ações, FIIs, ETFs, BDRs:** `https://brapi.dev/api/quote/{ticker}` (Endpoints públicos não exigem chave no plano básico. Mapeie `regularMarketPrice` para `price` e `regularMarketChangePercent` para `changePercent`).
        *   **Criptomoedas:** `https://api.coingecko.com/api/v3/simple/price?ids={ticker}&vs_currencies=brl&include_24hr_change=true` (Mapeie o ID da moeda. Ex: Bitcoin -> `bitcoin`).
    4. Se a API falhar (ex: erro 429), retorne o valor antigo do cache (se houver) ou `null`, sem quebrar a tela.
    5. Salve/atualize o registro na tabela `quotes` e retorne o objeto.

## 3. Camada de UI (Componentes)

### 3.1. Top Cards (`src/components/investimentos/SummaryCards.tsx`)
Quatro cartões no topo da tela:
1.  **Patrimônio Total:** Soma do (Qtd × Preço Atual) de todos os ativos + valor dos bens/passivos.
2.  **Lucro Total:** (Valor Atual - Valor Investido). Exiba o valor em R$ e a % sobre o total investido. Verde se positivo, vermelho se negativo.
3.  **Proventos (12M):** Soma de dividendos recebidos nos últimos 12 meses. (Use a tabela de histórico/lançamentos existente).
4.  **Rentabilidade:** Exiba duas métricas: Rentabilidade Total (%) e Variação do Dia (%). A variação do dia é a soma ponderada das variações (`changePercent`) dos ativos.

### 3.2. Accordion de Ativos (`src/components/investimentos/AssetGroup.tsx`)
Agrupe os ativos pela sua `classe` (ex: Ações, FIIs, Cripto, Tesouro).
*   **Cabeçalho do Accordion (Fechado/Aberto):** Mostre o Nome da Classe, Quantidade de ativos, Valor Total da Classe (atualizado) e a Variação do Dia.
*   **Corpo (Aberto):** Uma tabela com os ativos:
    *   **Ativo:** Ticker + Logo (se houver).
    *   **Qtd:** Quantidade.
    *   **Preço Médio:** (Total Investido / Quantidade).
    *   **Preço Atual:** Buscado via API. Enquanto carrega, exiba um esqueleto piscante (`animate-pulse`).
    *   **Variação:** `changePercent` (Hoje).
    *   **Rentabilidade:** % de lucro do ativo.
    *   **Saldo:** Qtd × Preço Atual.
    *   **Ações:** Um botão de "Lançamentos" (ícone de lista ou dinheiro) que abre um modal ou painel lateral (reutilize o `FormularioLancamento` já existente) focado naquele ativo.

### 3.3. A Página Principal (`src/pages/Investimentos.tsx`)
*   Orquestre o carregamento dos dados: busque todos os ativos, e para cada um, dispare a `fetchAndCacheQuote`.
*   Use um estado global (Zustand) ou hook customizado (`useQuotes`) para gerenciar o carregamento das cotações de forma assíncrona sem travar a renderização da página (use `Promise.allSettled`).
*   Mantenha a funcionalidade atual de cadastrar um novo ativo e editar.

## 4. Restrições e Regras de Negócio
*   **R15:** Nenhum pacote novo. Use as APIs nativas do navegador (`fetch`) e componentes Radix (Accordion) já instalados via shadcn/ui.
*   **R24:** Componentize! Não crie arquivos com mais de 400 linhas. Isole a lógica de API no `services`, a lógica de Accordion em `components` e a orquestração na `page`.
*   **R25:** Identificadores de código (funções, tipos, variáveis) em inglês. Textos da interface em pt-BR.
*   **Tratamento de Falhas:** Se a API da brapi estourar o limite, a tela NÃO deve quebrar. Ela deve exibir "Indisponível" ou o último preço salvo no cache (com um ícone de aviso).

## 5. Critérios de Aceite
1. `npm run build`, `lint` e `test` passam (adicione testes para o `services/quotes.ts` mockando o `fetch`).
2. A tela agrupa os ativos em Accordions por classe.
3. O preço atual é preenchido automaticamente via API (brapi/CoinGecko) e salvo no Dexie.
4. O preço não muda ao recarregar a página se o cache for recente (< 10 min).
5. Clicar em "Lançamentos" dentro do ativo abre o formulário correto.
6. O topo exibe os valores totais corretos, incluindo o cálculo do lucro/prejuízo e da variação do dia.