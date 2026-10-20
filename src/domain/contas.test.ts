import { describe, it, expect } from "vitest";
import { calcularSaldoConta, calcularSaldos, resumirContas } from "./contas";
import type { Categoria, Conta, Lancamento } from "./models";

const categorias = new Map<number, Categoria>([
  [1, { id: 1, nome: "Salário", grupo: "Receita" }],
  [2, { id: 2, nome: "Mercado", grupo: "Necessidade" }],
  [3, { id: 3, nome: "Reserva", grupo: "Poupança" }],
  [4, { id: 4, nome: "Transferência", grupo: "Transferência" }],
  [5, { id: 5, nome: "Pagamento de fatura", grupo: "Transferência" }],
]);

const conta: Conta = {
  id: 10,
  nome: "Corrente",
  tipo: "Corrente",
  saldoInicial: 100000,
  saldoExtrato: null,
};

function lanc(parte: Partial<Lancamento>): Lancamento {
  return {
    id: 1,
    data: "2026-10-10",
    descricao: "t",
    categoriaId: 2,
    valor: 1000,
    contaId: 10,
    formaPagamento: "Pix",
    cartaoId: null,
    parcela: null,
    status: "Pago",
    contaDestinoId: null,
    observacao: "",
    ...parte,
  };
}

describe("saldo de conta (§8 caso 9)", () => {
  it("lançamento pendente não altera o saldo", () => {
    const saldo = calcularSaldoConta(conta, [lanc({ status: "Pendente", valor: 5000 })], categorias);
    expect(saldo).toBe(100000);
  });

  it("despesa com cartão não sai da conta", () => {
    const saldo = calcularSaldoConta(conta, [lanc({ cartaoId: 99, valor: 5000 })], categorias);
    expect(saldo).toBe(100000);
  });

  it("despesa sem cartão sai da conta", () => {
    const saldo = calcularSaldoConta(conta, [lanc({ valor: 5000 })], categorias);
    expect(saldo).toBe(95000);
  });

  it("'Pagamento de fatura' (Transferência) sai da conta de origem", () => {
    const saldo = calcularSaldoConta(
      conta,
      [lanc({ categoriaId: 5, valor: 8000 })],
      categorias,
    );
    expect(saldo).toBe(92000);
  });

  it("Poupança com destino soma na conta de destino", () => {
    const saldo = calcularSaldoConta(
      conta,
      [lanc({ categoriaId: 3, valor: 4000, contaId: 20, contaDestinoId: 10 })],
      categorias,
    );
    expect(saldo).toBe(104000);
  });
});

describe("resumo de contas", () => {
  it("agrupa disponível, poupança e investimentos", () => {
    const contas: Conta[] = [
      { id: 1, nome: "C1", tipo: "Corrente", saldoInicial: 100, saldoExtrato: null },
      { id: 2, nome: "C2", tipo: "Poupança", saldoInicial: 200, saldoExtrato: null },
      { id: 3, nome: "C3", tipo: "Investimentos", saldoInicial: 400, saldoExtrato: null },
    ];
    const resumo = resumirContas(calcularSaldos(contas, [], categorias));
    expect(resumo.saldoTotal).toBe(700);
    expect(resumo.disponivel).toBe(100);
    expect(resumo.poupancaReservas).toBe(200);
    expect(resumo.investimentos).toBe(400);
    expect(resumo.saldoSemInvestimentos).toBe(300);
  });
});
