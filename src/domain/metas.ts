import type { Meta } from "./models";
import { avancarMesKey, mesKeyDe } from "./datas";

export interface ProjecaoMeta {
  porcentagemConcluida: number | null; // 0-100
  falta: number; // centavos
  mesesAtePrazo: number | null; // null = sem prazo
  aporteNecessario: number | null; // PMT; null = concluída ou sem prazo
  conclusaoComAporteAtual: number | null; // NPER; null = "Sem aporte"
  situacao: "Concluída" | "No prazo" | "Atrasada: aumente o aporte" | "Sem prazo" | "Sem aporte";
  pontos: { mesKey: number; saldo: number }[];
}

/**
 * Motor de metas (4.9).
 * PMT/NPER com valor presente = guardado e valor futuro = alvo.
 * taxaMensal: a das Configurações, salvo rendimento próprio da meta ((1+aa)^(1/12)−1).
 */
export function calcularMeta(
  meta: Meta,
  mesKeyAtual: number,
  taxaMensalPadrao: number,
): ProjecaoMeta {
  const { valorAlvo, jaGuardado, aporteMensal, rendimentoAa, prazo } = meta;
  const i = rendimentoAa === null ? taxaMensalPadrao : Math.pow(1 + rendimentoAa / 100, 1 / 12) - 1;
  const falta = Math.max(0, valorAlvo - jaGuardado);
  const porcentagem = valorAlvo > 0 ? (jaGuardado / valorAlvo) * 100 : null;

  const mesesAtePrazo =
    prazo === null ? null : Math.max(0, mesKeyDe(prazo) - mesKeyAtual === 0 ? 0 : diferencaMesesReais(mesKeyAtual, mesKeyDe(prazo)));

  // PMT: aporte para ir de guardado (VP) até alvo (FV) em n meses (§4.9)
  const aporteNecessario =
    falta === 0
      ? 0
      : mesesAtePrazo === null
        ? null
        : mesesAtePrazo === 0
          ? falta
          : pmt(falta, jaGuardado, mesesAtePrazo, i);

  // NPER: meses para fechar a falta com o aporte atual (a partir de hoje)
  const conclusaoComAporteAtual =
    falta === 0 ? 0 : aporteMensal === 0 ? null : nper(falta, jaGuardado, aporteMensal, i);

  let situacao: ProjecaoMeta["situacao"];
  if (falta === 0) {
    situacao = "Concluída";
  } else if (conclusaoComAporteAtual === null) {
    situacao = "Sem aporte";
  } else if (mesesAtePrazo === null) {
    situacao = "Sem prazo";
  } else if (conclusaoComAporteAtual <= mesesAtePrazo) {
    situacao = "No prazo";
  } else {
    situacao = "Atrasada: aumente o aporte";
  }

  // evolução até 240 meses com o aporte atual (para gráfico)
  const pontos: { mesKey: number; saldo: number }[] = [];
  let saldo = jaGuardado;
  const limite = Math.min(240, conclusaoComAporteAtual ?? 240);
  for (let m = 1; m <= limite; m++) {
    saldo = Math.round(saldo * (1 + i) + aporteMensal);
    pontos.push({ mesKey: avancarMesKey(mesKeyAtual, m), saldo });
    if (falta === 0 || saldo >= valorAlvo) break;
  }

  return {
    porcentagemConcluida: porcentagem,
    falta,
    mesesAtePrazo,
    aporteNecessario,
    conclusaoComAporteAtual,
    situacao,
    pontos,
  };
}

/** Meses entre mesKeys (b − a), nunca negativo (para "meses até o prazo", mínimo 0). */
export function diferencaMesesReais(a: number, b: number): number {
  return Math.max(0, (Math.floor(b / 100) - Math.floor(a / 100)) * 12 + (b % 100) - (a % 100));
}

/**
 * PMT (§4.9): aporte mensal para ir de valorPresente a valorFuturo em n meses a taxa i.
 * taxa 0 → falta ÷ n. Pagamentos no fim do mês.
 */
export function pmt(falta: number, valorPresente: number, meses: number, taxaMensal: number): number {
  if (meses <= 0) return falta;
  const fvDoVP = valorPresente * Math.pow(1 + taxaMensal, meses);
  const fvFaltante = Math.max(0, falta - fvDoVP);
  if (taxaMensal === 0) return Math.ceil(fvFaltante / meses);
  const fator = (Math.pow(1 + taxaMensal, meses) - 1) / taxaMensal;
  return Math.ceil(fvFaltante / fator);
}

/**
 * NPER (§4.9): meses para acumular de valorPresente até valorFuturo com aporte p a taxa i.
 * Arredondado para cima; null se nunca atinge.
 */
export function nper(
  falta: number,
  valorPresente: number,
  aporte: number,
  taxaMensal: number,
): number | null {
  if (aporte <= 0) return null;
  let saldo = valorPresente;
  for (let m = 1; m <= 1200; m++) {
    saldo = saldo * (1 + taxaMensal) + aporte;
    if (saldo >= valorPresente + falta) return m;
  }
  return null;
}
