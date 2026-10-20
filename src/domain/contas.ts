import type { Conta, Lancamento } from "./models";
import { tipoEfeito, type CategoriaBasica } from "./lancamentos";
import type { TipoConta } from "./types";

export interface SaldoConta {
  conta: Conta;
  saldoAtual: number;
  diferencaExtrato: number | null;
}

/**
 * Saldo atual = saldo inicial + entradas − saídas + recebidas − enviadas,
 * considerando só lançamentos não pendentes (4.2).
 * - entradas: receitas na conta;
 * - saídas: despesas na conta SEM cartão;
 * - recebidas: Poupança/Transferência com destino = conta;
 * - enviadas: Poupança/Transferência com origem = conta (inclui pagamento de fatura).
 */
export function calcularSaldoConta(
  conta: Conta,
  lancamentos: Lancamento[],
  categorias: Map<number, CategoriaBasica>,
): number {
  let saldo = conta.saldoInicial;
  for (const l of lancamentos) {
    if (l.status === "Pendente") continue;
    const tipo = tipoEfeito(l, categorias);
    const eTransferenciaOuPoupanca = tipo === "Transferência" || tipo === "Poupança";

    if (eTransferenciaOuPoupanca) {
      if (l.contaId === conta.id) saldo -= l.valor; // enviadas
      if (l.contaDestinoId === conta.id) saldo += l.valor; // recebidas
      continue;
    }
    if (tipo === "Receita" && l.contaId === conta.id) {
      saldo += l.valor; // entradas
      continue;
    }
    if (tipo === "Despesa" && l.contaId === conta.id && l.cartaoId === null) {
      saldo -= l.valor; // saídas sem cartão
    }
  }
  return saldo;
}

export function calcularSaldos(
  contas: Conta[],
  lancamentos: Lancamento[],
  categorias: Map<number, CategoriaBasica>,
): SaldoConta[] {
  return contas.map((conta) => {
    const saldoAtual = calcularSaldoConta(conta, lancamentos, categorias);
    return {
      conta,
      saldoAtual,
      diferencaExtrato:
        conta.saldoExtrato === null ? null : saldoAtual - conta.saldoExtrato,
    };
  });
}

export interface ResumoContas {
  saldoTotal: number;
  disponivel: number;
  poupancaReservas: number;
  investimentos: number;
  saldoSemInvestimentos: number;
}

const DISPONIVEIS: TipoConta[] = ["Corrente", "Carteira", "Dinheiro"];

/** Resumo por grupos de contas (4.2). */
export function resumirContas(saldos: SaldoConta[]): ResumoContas {
  let saldoTotal = 0;
  let disponivel = 0;
  let poupancaReservas = 0;
  let investimentos = 0;
  for (const s of saldos) {
    saldoTotal += s.saldoAtual;
    if (DISPONIVEIS.includes(s.conta.tipo)) disponivel += s.saldoAtual;
    else if (s.conta.tipo === "Poupança") poupancaReservas += s.saldoAtual;
    else if (s.conta.tipo === "Investimentos") investimentos += s.saldoAtual;
  }
  return {
    saldoTotal,
    disponivel,
    poupancaReservas,
    investimentos,
    saldoSemInvestimentos: saldoTotal - investimentos,
  };
}
