import { describe, it, expect } from "vitest";
import { calcularFluxoAnual } from "./fluxo";
import type { Categoria, CompraParcelada, Lancamento } from "./models";

const CATS: Categoria[] = [
  { id: 1, nome: "Salário", grupo: "Receita" },
  { id: 2, nome: "Moradia", grupo: "Necessidade" },
  { id: 3, nome: "Lazer", grupo: "Desejo" },
  { id: 4, nome: "Reserva", grupo: "Poupança" },
];

function lanc(
  id: number,
  data: string,
  categoriaId: number | null,
  valor: number,
): Lancamento {
  return {
    id,
    data,
    descricao: `L${id}`,
    categoriaId,
    valor,
    contaId: 1,
    formaPagamento: "Pix",
    cartaoId: null,
    parcela: null,
    status: "Pago",
    contaDestinoId: null,
    observacao: "",
  };
}

describe("fluxo — calcularFluxoAnual", () => {
  it("calcula receitas, despesas, saldo, taxa de poupança e acumulado", () => {
    const lancamentos = [
      lanc(1, "2026-01-05", 1, 3_000_00),
      lanc(2, "2026-01-10", 2, 1_200_00),
      lanc(3, "2026-01-20", 3, 400_00),
      lanc(4, "2026-01-25", 4, 500_00),
      lanc(5, "2026-02-05", 1, 3_000_00),
      lanc(6, "2026-02-15", 2, 2_500_00),
    ];
    const r = calcularFluxoAnual(2026, lancamentos, [], CATS, () => 0);

    const jan = r.meses[0];
    expect(jan.receitas).toBe(3_000_00);
    expect(jan.despesas).toBe(1_600_00);
    expect(jan.guardadoInvestido).toBe(500_00);
    expect(jan.saldo).toBe(3_000_00 - 1_600_00 - 500_00);
    expect(jan.taxaPoupanca).toBeCloseTo(((3_000_00 - 1_600_00 - 500_00) / 3_000_00) * 100, 5);
    expect(jan.necessidades).toBe(1_200_00);
    expect(jan.desejos).toBe(400_00);
    expect(jan.saldoAcumulado).toBe(jan.saldo);

    const fev = r.meses[1];
    expect(fev.saldoAcumulado).toBe(jan.saldo + fev.saldo);

    expect(r.totalAno.receitas).toBe(6_000_00);
    expect(r.totalAno.despesas).toBe(4_100_00);
    expect(r.melhorMes?.mesKey).toBe(202601);
    expect(r.piorMes?.mesKey).toBe(202602);
  });

  it("meses sem movimento ficam zerados e não entram no acumulado", () => {
    const lancamentos = [lanc(1, "2026-03-05", 1, 1_000_00)];
    const r = calcularFluxoAnual(2026, lancamentos, [], CATS, () => 0);
    expect(r.meses[0].saldoAcumulado).toBe(0);
    expect(r.meses[2].saldoAcumulado).toBe(1_000_00);
    expect(r.meses[11].saldoAcumulado).toBe(0);
  });

  it("despesa sem categoria aparece em semCategoria", () => {
    const lancamentos = [
      lanc(1, "2026-04-05", 1, 2_000_00),
      lanc(2, "2026-04-06", null, 150_00),
    ];
    const r = calcularFluxoAnual(2026, lancamentos, [], CATS, () => 0);
    expect(r.meses[3].semCategoria).toBe(150_00);
    expect(r.meses[3].despesas).toBe(150_00);
  });

  it("parcelas de cartão entram na despesa do mês da fatura", () => {
    const lancamentos = [lanc(1, "2026-05-05", 1, 2_000_00)];
    const parceladas: CompraParcelada[] = [
      {
        id: 1,
        descricao: "Notebook",
        cartaoId: 1,
        categoriaId: 2,
        dataCompra: "2026-05-10",
        valorTotal: 120_000,
        numeroParcelas: 2,
      },
    ];
    // fatura: compra no dia 10 com fechamento 25 → fatura do próprio mês
    const r = calcularFluxoAnual(2026, lancamentos, parceladas, CATS, () => 202605);
    expect(r.meses[4].despesas).toBe(60_000);
    expect(r.meses[5].despesas).toBe(60_000);
  });

  it("mapa de calor acumula despesas por categoria e mês", () => {
    const lancamentos = [
      lanc(1, "2026-06-05", 1, 2_000_00),
      lanc(2, "2026-06-10", 2, 300_00),
      lanc(3, "2026-06-20", 2, 200_00),
      lanc(4, "2026-07-10", 3, 100_00),
    ];
    const r = calcularFluxoAnual(2026, lancamentos, [], CATS, () => 0);
    const moradia = r.calor.find((l) => l.nome === "Moradia");
    expect(moradia?.total).toBe(500_00);
    expect(moradia?.valores.get(6)).toBe(500_00);
    const lazer = r.calor.find((l) => l.nome === "Lazer");
    expect(lazer?.valores.get(7)).toBe(100_00);
  });
});
