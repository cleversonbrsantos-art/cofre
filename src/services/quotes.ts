import { db } from "../db/db";
import type { Quote } from "../domain/models";

const BRAPI_URL = "https://brapi.dev/api/quote";
const COINGECKO_URL = "https://api.coingecko.com/api/v3/simple/price";
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutos

/** Mapeamento de tickers de criptomoedas para IDs do CoinGecko. */
const CRYPTO_ID_MAP: Record<string, string> = {
  BITCOIN: "bitcoin",
  BTC: "bitcoin",
  ETHEREUM: "ethereum",
  ETH: "ethereum",
  BNB: "binancecoin",
  SOLANA: "solana",
  SOL: "solana",
  CARDANO: "cardano",
  ADA: "cardano",
  RIPPLE: "ripple",
  XRP: "ripple",
  DOGECOIN: "dogecoin",
  DOGE: "dogecoin",
  POLKADOT: "polkadot",
  DOT: "polkadot",
  LITECOIN: "litecoin",
  LTC: "litecoin",
  CHAINLINK: "chainlink",
  LINK: "chainlink",
  UNISWAP: "uniswap",
  UNI: "uniswap",
  MATIC: "matic-network",
  POLYGON: "matic-network",
  AVALANCHE: "avalanche-2",
  AVAX: "avalanche-2",
};

function normalizeTicker(ticker: string): string {
  return ticker.trim().toUpperCase();
}

function isCrypto(ticker: string): boolean {
  return ticker in CRYPTO_ID_MAP;
}

function getCryptoId(ticker: string): string | null {
  return CRYPTO_ID_MAP[ticker] ?? null;
}

function parseBrapiResponse(data: unknown): { price: number; changePercent: number } | null {
  try {
    const result = data as { results?: Array<{ regularMarketPrice?: number; regularMarketChangePercent?: number }> };
    const quote = result.results?.[0];
    if (!quote || typeof quote.regularMarketPrice !== "number") return null;
    const price = Math.round(quote.regularMarketPrice * 100); // converter para centavos
    const changePercent = typeof quote.regularMarketChangePercent === "number"
      ? quote.regularMarketChangePercent
      : 0;
    return { price, changePercent };
  } catch {
    return null;
  }
}

function parseCoinGeckoResponse(data: unknown, cryptoId: string): { price: number; changePercent: number } | null {
  try {
    const result = data as Record<string, { brl?: number; brl_24h_change?: number }>;
    const coin = result[cryptoId];
    if (!coin || typeof coin.brl !== "number") return null;
    const price = Math.round(coin.brl * 100); // converter para centavos
    const changePercent = typeof coin.brl_24h_change === "number" ? coin.brl_24h_change : 0;
    return { price, changePercent };
  } catch {
    return null;
  }
}

async function fetchFromBrapi(ticker: string): Promise<{ price: number; changePercent: number } | null> {
  const url = `${BRAPI_URL}/${ticker}`;
  const response = await fetch(url, { headers: { Accept: "application/json" } });
  if (!response.ok) return null;
  const data: unknown = await response.json();
  return parseBrapiResponse(data);
}

async function fetchFromCoinGecko(cryptoId: string): Promise<{ price: number; changePercent: number } | null> {
  const url = `${COINGECKO_URL}?ids=${cryptoId}&vs_currencies=brl&include_24hr_change=true`;
  const response = await fetch(url, { headers: { Accept: "application/json" } });
  if (!response.ok) return null;
  const data: unknown = await response.json();
  return parseCoinGeckoResponse(data, cryptoId);
}

export async function fetchAndCacheQuote(tickerInput: string, type: string): Promise<Quote | null> {
  const ticker = normalizeTicker(tickerInput);
  const now = Date.now();

  // 1. Verificar cache
  const cached = await db.quotes.get(ticker);
  if (cached && now - cached.updatedAt < CACHE_TTL_MS) {
    return cached;
  }

  // 2. Buscar da API
  let quoteData: { price: number; changePercent: number } | null = null;

  if (type === "Cripto" || isCrypto(ticker)) {
    const cryptoId = getCryptoId(ticker);
    if (cryptoId) {
      quoteData = await fetchFromCoinGecko(cryptoId);
    }
  } else {
    // Ações, FIIs, ETFs, BDRs, Tesouro, Outros
    quoteData = await fetchFromBrapi(ticker);
  }

  // 3. Se API falhou, retornar cache antigo (se houver) ou null
  if (!quoteData) {
    return cached ?? null;
  }

  // 4. Salvar/atualizar cache e retornar
  const quote: Quote = {
    ticker,
    price: quoteData.price,
    changePercent: quoteData.changePercent,
    updatedAt: now,
  };
  await db.quotes.put(quote);
  return quote;
}

/** Busca múltiplas cotações em paralelo, sem travar a UI. */
export async function fetchAndCacheQuotes(
  tickers: Array<{ ticker: string; type: string }>
): Promise<Map<string, Quote | null>> {
  const results = await Promise.allSettled(
    tickers.map(({ ticker, type }) => fetchAndCacheQuote(ticker, type))
  );
  const map = new Map<string, Quote | null>();
  tickers.forEach(({ ticker }, i) => {
    const normalized = normalizeTicker(ticker);
    const result = results[i];
    map.set(normalized, result.status === "fulfilled" ? result.value : null);
  });
  return map;
}