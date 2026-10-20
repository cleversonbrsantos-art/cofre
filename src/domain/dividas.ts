import type { Divida } from "./models";
import { avancarMesKey, dataISO, diasNoMes } from "./datas";

export type MetodoDividas = "minimo" | "neve" | "avalanche";

export const NOMES_METODOS: Record<MetodoDividas, string> = {
  minimo: "Só o mínimo",
  neve: "Bola de neve",
  avalanche: "Avalanche",
};

export interface EstadoDividaMes {
  id: number;
  nome: string;
  saldo: number; // após o pagamento do mês
  pagoMes: number;
  jurosMes: number;
}

export interface MesDividas {
  mes: number; // 1..60
  mesKey: number; // AAAAMM projetado
  saldoTotal: number; // após pagamentos
  jurosMes: number;
  pagoMes: number;
  dividas: EstadoDividaMes[];
}

export interface ResultadoMetodo {
  metodo: MetodoDividas;
  meses: number | null; // null = "mais de 60"
  rotuloMeses: string; // "12" ou "mais de 60"
  dataQuitacao: string | null;
  totalPago: number;
  jurosTotais: number;
  ordemQuitacao: number[]; // ids na ordem de quitação
  serie: MesDividas[];
}

export interface AlertaDivida {
  id: number;
  nome: string;
  mensagem: string;
}

export interface ResultadoDividas {
  porMetodo: Record<MetodoDividas, ResultadoMetodo>;
  jurosMinimo: number;
  mesesMinimo: number | null;
  alertas: AlertaDivida[];
  jurosPrimeiroMes: number;
}

const MESES_MAX = 60;

/** Motor de 60 meses (4.11). Juros antes do pagamento; último pagamento = min(parcela, saldo + juros). */
export function calcularDividas(
  dividas: Divida[],
  extraMensal: number,
  mesKeyAtual: number,
): ResultadoDividas {
  // orçamento mensal de neve/avalanche = mínimas de TODAS as dívidas (inclusive quitadas) + extra
  const orcamentoBase = dividas.reduce((s, d) => s + d.parcelaMinima, 0);
  const jurosPrimeiroMes = dividas.reduce((s, d) => s + Math.round(d.saldoDevedor * (d.jurosMes / 100)), 0);

  const alertas: AlertaDivida[] = dividas
    .filter((d) => d.saldoDevedor > 0 && d.parcelaMinima <= Math.round(d.saldoDevedor * (d.jurosMes / 100)))
    .map((d) => ({ id: d.id, nome: d.nome, mensagem: "A parcela não cobre os juros." }));

  const porMetodo = {} as Record<MetodoDividas, ResultadoMetodo>;
  for (const metodo of ["minimo", "neve", "avalanche"] as const) {
    porMetodo[metodo] = simularMetodo(dividas, metodo, extraMensal, mesKeyAtual, orcamentoBase);
  }

  return {
    porMetodo,
    jurosMinimo: porMetodo.minimo.jurosTotais,
    mesesMinimo: porMetodo.minimo.meses,
    alertas,
    jurosPrimeiroMes,
  };
}

/** Ordem de prioridade do extra: neve = menor saldo atual; avalanche = maior taxa, depois menor saldo, depois id. */
function ordenarPrioridade(a: Divida, b: Divida, metodo: MetodoDividas, saldos: Map<number, number>): number {
  if (metodo === "neve") {
    const saldoA = saldos.get(a.id) ?? 0;
    const saldoB = saldos.get(b.id) ?? 0;
    if (saldoA !== saldoB) return saldoA - saldoB;
    return a.id - b.id;
  }
  if (a.jurosMes !== b.jurosMes) return b.jurosMes - a.jurosMes;
  const saldoA = saldos.get(a.id) ?? 0;
  const saldoB = saldos.get(b.id) ?? 0;
  if (saldoA !== saldoB) return saldoA - saldoB;
  return a.id - b.id;
}

function simularMetodo(
  dividas: Divida[],
  metodo: MetodoDividas,
  extraMensal: number,
  mesKeyAtual: number,
  orcamentoBase: number,
): ResultadoMetodo {
  const ativas = dividas.filter((d) => d.saldoDevedor > 0).sort((a, b) => a.id - b.id);
  const saldos = new Map<number, number>(ativas.map((d) => [d.id, d.saldoDevedor]));
  const ordemQuitacao: number[] = [];
  const serie: MesDividas[] = [];

  let totalPago = 0;
  let jurosTotais = 0;
  let meses = 0;
  let mesKey = mesKeyAtual;

  while (meses < MESES_MAX) {
    const restantes = ativas.filter((d) => (saldos.get(d.id) ?? 0) > 0);
    if (restantes.length === 0) break;
    meses += 1;
    mesKey = avancarMesKey(mesKeyAtual, meses - 1);

    // 1. juros do mês
    const jurosPorId = new Map<number, number>();
    let jurosMes = 0;
    for (const d of restantes) {
      const j = Math.round((saldos.get(d.id) ?? 0) * (d.jurosMes / 100));
      jurosPorId.set(d.id, j);
      jurosMes += j;
      saldos.set(d.id, (saldos.get(d.id) ?? 0) + j);
    }
    jurosTotais += jurosMes;

    // 2. parcelas mínimas, em ordem de id crescente
    let pagoMes = 0;
    const estadosDoMes = new Map<number, EstadoDividaMes>();
    const quitadasPeloMinimo: number[] = [];
    for (const d of restantes) {
      const parcela = Math.min(d.parcelaMinima, saldos.get(d.id) ?? 0);
      saldos.set(d.id, (saldos.get(d.id) ?? 0) - parcela);
      pagoMes += parcela;
      totalPago += parcela;
      if ((saldos.get(d.id) ?? 0) === 0) quitadasPeloMinimo.push(d.id);
      estadosDoMes.set(d.id, {
        id: d.id,
        nome: d.nome,
        saldo: saldos.get(d.id) ?? 0,
        pagoMes: parcela,
        jurosMes: jurosPorId.get(d.id) ?? 0,
      });
    }
    ordemQuitacao.push(...quitadasPeloMinimo);

    // 3/4. extra: só neve e avalanche redistribuem o orçamento; mínimo ignora o extra
    if (metodo !== "minimo") {
      const orcamento = orcamentoBase + extraMensal;
      let sobra = orcamento - pagoMes;
      if (sobra > 0) {
        const prioridade = restantes
          .filter((d) => (saldos.get(d.id) ?? 0) > 0)
          .sort((a, b) => ordenarPrioridade(a, b, metodo, saldos));
        for (const d of prioridade) {
          if (sobra <= 0) break;
          const pagamento = Math.min(sobra, saldos.get(d.id) ?? 0);
          if (pagamento > 0) {
            saldos.set(d.id, (saldos.get(d.id) ?? 0) - pagamento);
            sobra -= pagamento;
            pagoMes += pagamento;
            totalPago += pagamento;
            const estado = estadosDoMes.get(d.id);
            if (estado) {
              estado.pagoMes += pagamento;
              estado.saldo = saldos.get(d.id) ?? 0;
            }
            if ((saldos.get(d.id) ?? 0) === 0) ordemQuitacao.push(d.id);
          }
        }
      }
    }

    serie.push({
      mes: meses,
      mesKey,
      saldoTotal: ativas.reduce((s, d) => s + (saldos.get(d.id) ?? 0), 0),
      jurosMes,
      pagoMes,
      dividas: [...estadosDoMes.values()],
    });
  }

  const quitou = ativas.every((d) => (saldos.get(d.id) ?? 0) === 0);
  if (!quitou) {
    return {
      metodo,
      meses: null,
      rotuloMeses: "mais de 60",
      dataQuitacao: null,
      totalPago,
      jurosTotais,
      ordemQuitacao,
      serie,
    };
  }

  return {
    metodo,
    meses,
    rotuloMeses: String(meses),
    dataQuitacao: dataQuitacaoEm(mesKeyAtual, meses),
    totalPago,
    jurosTotais,
    ordemQuitacao,
    serie,
  };
}

function dataQuitacaoEm(mesKeyAtual: number, meses: number): string {
  const mk = avancarMesKey(mesKeyAtual, Math.max(0, meses - 1));
  const ano = Math.floor(mk / 100);
  const mes = mk % 100;
  return dataISO(ano, mes, diasNoMes(ano, mes));
}

/** Caso §8 7: dívida única, só o mínimo — saldo 1.000, juros 2%, parcela 100 → 12 meses. */
export function mesesParaQuitar(dividas: Divida[], extraMensal: number): number | null {
  return calcularDividas(dividas, extraMensal, 202601).porMetodo.minimo.meses;
}
