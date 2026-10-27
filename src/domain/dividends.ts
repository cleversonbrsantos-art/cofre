import type { AtivoInvestimento, Dividend } from "./models";

export interface DividendSummary {
  totalRecebido12Meses: number; // centavos
  totalAReceber: number; // centavos
  mediaMensal: number; // centavos
  detalhes: DividendDetalhe[];
}

export interface DividendDetalhe {
  ativo: string;
  tipo: string;
  status: "Pago" | "A Receber";
  dataCom: string; // ISO
  dataPagamento: string; // ISO
  quantidade: number;
  valorPorCota: number; // centavos
  total: number; // centavos
}

/**
 * Calcula o resumo de proventos cruzando ativos do usuário com dividendos da API.
 * Recebe a data "hoje" como parâmetro (pura, sem Date.now()).
 */
export function calcularResumoProventos(
  ativos: AtivoInvestimento[],
  dividendos: Dividend[],
  hoje: string // ISO YYYY-MM-DD
): DividendSummary {
  // Criar mapa de quantidade por ticker
  const qtdPorTicker = new Map<string, number>();
  for (const ativo of ativos) {
    qtdPorTicker.set(ativo.nome, ativo.quantidade);
  }

  // Filtrar dividendos dos ativos que o usuário possui
  const dividendosUsuario = dividendos.filter((d) => qtdPorTicker.has(d.ticker));

  // Ordenar por data de pagamento (mais recente primeiro)
  dividendosUsuario.sort((a, b) => b.paymentDate.localeCompare(a.paymentDate));

  // Calcular data limite para 12 meses atrás
  const [ano, mes] = hoje.split("-").map(Number);
  const dataLimite12M = `${ano - 1}-${mes.toString().padStart(2, "0")}-01`;

  let totalRecebido12Meses = 0;
  let totalAReceber = 0;
  const detalhes: DividendDetalhe[] = [];

  for (const div of dividendosUsuario) {
    const quantidade = qtdPorTicker.get(div.ticker) ?? 0;
    const total = div.amount * quantidade;
    const isPago = div.paymentDate <= hoje;
    const isUltimos12Meses = isPago && div.paymentDate >= dataLimite12M;

    if (isPago) {
      if (isUltimos12Meses) {
        totalRecebido12Meses += total;
      }
    } else {
      totalAReceber += total;
    }

    detalhes.push({
      ativo: div.ticker,
      tipo: div.type,
      status: div.status,
      dataCom: div.exDate,
      dataPagamento: div.paymentDate,
      quantidade,
      valorPorCota: div.amount,
      total,
    });
  }

  // Média mensal = total recebido 12 meses / 12
  const mediaMensal = Math.round(totalRecebido12Meses / 12);

  return {
    totalRecebido12Meses,
    totalAReceber,
    mediaMensal,
    detalhes,
  };
}

/** Filtra detalhes por status. */
export function filtrarPorStatus(
  detalhes: DividendDetalhe[],
  status: "Todos" | "Pago" | "A Receber"
): DividendDetalhe[] {
  if (status === "Todos") return detalhes;
  return detalhes.filter((d) => d.status === status);
}