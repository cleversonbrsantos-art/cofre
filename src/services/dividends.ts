import { db } from "../db/db";
import type { Dividend } from "../domain/models";

const BRAPI_STOCKS_DIVIDENDS_URL = "https://brapi.dev/api/v2/stocks/dividends";
const BRAPI_FII_DIVIDENDS_URL = "https://brapi.dev/api/v2/fii/dividends";
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 horas

function normalizeTicker(ticker: string): string {
  return ticker.trim().toUpperCase();
}

function isFII(ticker: string): boolean {
  // FIIs terminam com 11 (ex: HGLG11, MXRF11)
  return /^[A-Z]{4}11$/.test(ticker);
}

function parseBrapiDividendsResponse(
  data: unknown,
  ticker: string,
  type: string
): Dividend[] {
  try {
    const result = data as {
      results?: Array<{
        dividends?: Array<{
          date?: string; // data com
          paymentDate?: string; // data de pagamento
          value?: number; // valor por cota
        }>;
      }>;
    };
    const dividendsData = result.results?.[0]?.dividends;
    if (!dividendsData || !Array.isArray(dividendsData)) return [];

    const now = new Date();
    const hoje = now.toISOString().split("T")[0]; // YYYY-MM-DD

    return dividendsData
      .filter((d) => d.date && d.paymentDate && typeof d.value === "number")
      .map((d) => ({
        id: `${ticker}|${d.date!}`,
        ticker,
        type,
        amount: Math.round(d.value! * 100), // converter para centavos
        exDate: d.date!,
        paymentDate: d.paymentDate!,
        status: d.paymentDate! <= hoje ? "Pago" : "A Receber",
        updatedAt: Date.now(),
      }));
  } catch {
    return [];
  }
}

async function fetchFromBrapi(
  ticker: string,
  type: string
): Promise<Dividend[]> {
  const isFiiAsset = isFII(ticker);
  const url = isFiiAsset
    ? `${BRAPI_FII_DIVIDENDS_URL}/${ticker}`
    : `${BRAPI_STOCKS_DIVIDENDS_URL}/${ticker}`;

  const response = await fetch(url, { headers: { Accept: "application/json" } });
  if (!response.ok) return [];
  const data: unknown = await response.json();
  return parseBrapiDividendsResponse(data, ticker, type);
}

export async function fetchAndCacheDividends(
  tickerInput: string,
  type: string
): Promise<Dividend[]> {
  const ticker = normalizeTicker(tickerInput);
  const now = Date.now();

  // 1. Verificar cache
  const cached = await db.dividends
    .where("ticker")
    .equals(ticker)
    .toArray();
  if (cached.length > 0 && now - cached[0].updatedAt < CACHE_TTL_MS) {
    return cached;
  }

  // 2. Buscar da API
  const dividends = await fetchFromBrapi(ticker, type);

  // 3. Se API falhou, retornar cache antigo (se houver)
  if (dividends.length === 0) {
    return cached;
  }

  // 4. Salvar/atualizar cache e retornar
  // Limpar entradas antigas deste ticker
  await db.dividends.where("ticker").equals(ticker).delete();
  // Inserir novas
  await db.dividends.bulkAdd(dividends);
  return dividends;
}

/** Busca múltiplos proventos em paralelo. */
export async function fetchAndCacheAllDividends(
  tickers: Array<{ ticker: string; type: string }>
): Promise<Map<string, Dividend[]>> {
  const results = await Promise.allSettled(
    tickers.map(({ ticker, type }) => fetchAndCacheDividends(ticker, type))
  );
  const map = new Map<string, Dividend[]>();
  tickers.forEach(({ ticker }, i) => {
    const normalized = normalizeTicker(ticker);
    const result = results[i];
    map.set(normalized, result.status === "fulfilled" ? result.value : []);
  });
  return map;
}