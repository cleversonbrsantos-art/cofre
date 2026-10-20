import type { ReservaConfig, Lancamento, Categoria } from "./models";
import { mesKeyDe } from "./datas";

export interface ResultadoReserva {
  mesesAlvo: number;
  gastoEssencialMensal: number; // centavos
  alvoReserva: number; // centavos
  guardadoAtual: number; // centavos
  falta: number; // centavos
  percentualAtingido: number | null; // % da meta
  coberturaMeses: number | null; // reserva atual ÷ gasto essencial
  situacao: "Reserva completa" | "Quase lá" | "Em construção" | "Crítica (menos de 1 mês)" | "Sem dados";
  mesesParaCompletar: number | null; // NPER; null = "Sem aporte"
}

/** Gasto essencial (4.10): média dos 3 últimos meses do grupo Necessidade, incluindo parcelas dos cartões. */
export function gastoEssencialMedio(
  lancamentos: Lancamento[],
  categorias: Map<number, Categoria>,
  parcelasPorMes: Map<number, number>,
): number {
  const porMes = new Map<number, number>();
  for (const l of lancamentos) {
    const cat = l.categoriaId === null ? undefined : categorias.get(l.categoriaId);
    if (!cat || cat.grupo !== "Necessidade") continue;
    const mk = mesKeyDe(l.data);
    porMes.set(mk, (porMes.get(mk) ?? 0) + l.valor);
  }
  // parcelas de cartão entram como gasto essencial do mês da fatura
  for (const [mk, valor] of parcelasPorMes) {
    porMes.set(mk, (porMes.get(mk) ?? 0) + valor);
  }
  const meses = [...porMes.keys()].sort((a, b) => b - a).slice(0, 3);
  if (meses.length === 0) return 0;
  const soma = meses.reduce((s, mk) => s + (porMes.get(mk) ?? 0), 0);
  return Math.round(soma / meses.length);
}

/**
 * Reserva de emergência (4.10): alvo = gasto essencial × meses-alvo.
 * guardadoAtual = saldo da conta vinculada (o chamador fornece).
 * @param parcelasPorMes totais de parcelas por mesKey (cartões)
 */
export function calcularReserva(
  config: ReservaConfig,
  mesesDoPerfil: number,
  lancamentos: Lancamento[],
  categorias: Map<number, Categoria>,
  parcelasPorMes: Map<number, number>,
  guardadoAtual: number,
): ResultadoReserva {
  const mesesAlvo = config.mesesAjustados !== null && config.mesesAjustados > 0 ? config.mesesAjustados : mesesDoPerfil;
  const essencial = config.gastoEssencialManual !== null && config.gastoEssencialManual > 0
    ? config.gastoEssencialManual
    : gastoEssencialMedio(lancamentos, categorias, parcelasPorMes);
  const alvo = essencial * mesesAlvo;
  const falta = Math.max(0, alvo - guardadoAtual);
  const percentual = alvo > 0 ? (guardadoAtual / alvo) * 100 : null;
  const cobertura = essencial > 0 ? guardadoAtual / essencial : null;

  let situacao: ResultadoReserva["situacao"];
  if (essencial === 0) {
    situacao = "Sem dados";
  } else if (cobertura !== null && cobertura >= mesesAlvo) {
    situacao = "Reserva completa";
  } else if (cobertura !== null && cobertura >= mesesAlvo / 2) {
    situacao = "Quase lá";
  } else if (cobertura !== null && cobertura >= 1) {
    situacao = "Em construção";
  } else {
    situacao = "Crítica (menos de 1 mês)";
  }

  const mesesParaCompletar =
    falta === 0 ? 0 : config.aporteMensal === 0 ? null : Math.ceil(falta / config.aporteMensal);

  return {
    mesesAlvo,
    gastoEssencialMensal: essencial,
    alvoReserva: alvo,
    guardadoAtual,
    falta,
    percentualAtingido: percentual,
    coberturaMeses: cobertura,
    situacao,
    mesesParaCompletar,
  };
}
