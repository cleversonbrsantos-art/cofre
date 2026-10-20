import type { Assinatura, ContaPagar } from "./models";
import { avancarMesKey, dataISO, diasNoMes, mesKeyDe } from "./datas";

export interface ResumoContasAPagar {
  totalAberto: number;
  totalMes: number;
  vencidas: { conta: ContaPagar; diasAtraso: number }[];
  vencemEmBreve: ContaPagar[]; // 0 a 7 dias (4.13)
  proximosVencimentos: ContaPagar[]; // 5 próximos
  pagasMes: number;
}

/** Resumo das contas a pagar (4.13). */
export function calcularContasAPagar(
  contas: ContaPagar[],
  hoje: string,
): ResumoContasAPagar {
  const mkHoje = mesKeyDe(hoje);
  const abertas = contas.filter((c) => c.status !== "Paga");
  const totalAberto = abertas.reduce((s, c) => s + c.valor, 0);
  const totalMes = abertas
    .filter((c) => Number(c.vencimento.slice(0, 4) + c.vencimento.slice(5, 7)) === mkHoje)
    .reduce((s, c) => s + c.valor, 0);
  const pagasMes = contas
    .filter((c) => c.status === "Paga" && Number(c.vencimento.slice(0, 4) + c.vencimento.slice(5, 7)) === mkHoje)
    .reduce((s, c) => s + c.valor, 0);

  const vencidas = abertas
    .filter((c) => c.vencimento < hoje)
    .map((c) => ({ conta: c, diasAtraso: diasEntre(c.vencimento, hoje) }))
    .sort((a, b) => b.diasAtraso - a.diasAtraso);

  const ordenadas = abertas
    .filter((c) => c.vencimento >= hoje)
    .sort((a, b) => a.vencimento.localeCompare(b.vencimento));

  const limite = addDias(hoje, 7);
  const vencemEmBreve = ordenadas.filter((c) => c.vencimento <= limite);

  return {
    totalAberto,
    totalMes,
    vencidas,
    vencemEmBreve,
    proximosVencimentos: ordenadas.slice(0, 5),
    pagasMes,
  };
}

export function addDias(dataISOStr: string, dias: number): string {
  const ano = Number(dataISOStr.slice(0, 4));
  const mes = Number(dataISOStr.slice(5, 7));
  const dia = Number(dataISOStr.slice(8, 10));
  // Date usado só como conversor de dias; entrada e saída em ISO sem fuso
  const d = new Date(ano, mes - 1, dia + dias);
  return dataISO(d.getFullYear(), d.getMonth() + 1, d.getDate());
}

export function diasEntre(deISO: string, ateISO: string): number {
  const a = Date.UTC(Number(deISO.slice(0, 4)), Number(deISO.slice(5, 7)) - 1, Number(deISO.slice(8, 10)));
  const b = Date.UTC(Number(ateISO.slice(0, 4)), Number(ateISO.slice(5, 7)) - 1, Number(ateISO.slice(8, 10)));
  return Math.round((b - a) / 86_400_000);
}

export interface ResumoAssinaturas {
  custoMensalEquivalente: number; // centavos
  custoAnual: number; // centavos
  renovacoesProximas: { assinatura: Assinatura; diasRestantes: number }[];
}

/** Assinaturas (4.13): equivalente mensal (anual ÷ 12) e próximas renovações em 30 dias. */
export function calcularAssinaturas(
  assinaturas: Assinatura[],
  hoje: string,
): ResumoAssinaturas {
  let mensal = 0;
  for (const a of assinaturas) {
    mensal += a.ciclo === "Anual" ? Math.round(a.valor / 12) : a.valor;
  }
  const renovacoes = assinaturas
    .filter((a) => a.proximaRenovacao >= hoje)
    .map((a) => ({ assinatura: a, diasRestantes: diasEntre(hoje, a.proximaRenovacao) }))
    .filter((r) => r.diasRestantes <= 30)
    .sort((a, b) => a.diasRestantes - b.diasRestantes);
  return {
    custoMensalEquivalente: mensal,
    custoAnual: mensal * 12,
    renovacoesProximas: renovacoes,
  };
}
/** Próxima renovação a partir do ciclo (uso em CRUD de assinaturas). */
export function proximaRenovacao(deISO: string, ciclo: "Mensal" | "Anual"): string {
  const mk = mesKeyDe(deISO);
  const proximo = avancarMesKey(mk, ciclo === "Mensal" ? 1 : 12);
  const ano = Math.floor(proximo / 100);
  const mes = proximo % 100;
  const dia = Math.min(Number(deISO.slice(8, 10)), diasNoMes(ano, mes));
  return dataISO(ano, mes, dia);
}
