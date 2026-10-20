import { describe, it, expect } from "vitest";
import { calcularDiaADia } from "./diaadia";
import type { Categoria, Lancamento } from "./models";

const CATS: Categoria[] = [
  { id: 1, nome: "Salário", grupo: "Receita" },
  { id: 2, nome: "Mercado", grupo: "Necessidade" },
];

const mapaCats = new Map(CATS.map((c) => [c.id, c]));

function lanc(id: number, data: string, categoriaId: number | null, valor: number): Lancamento {
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

describe("diaadia — calcularDiaADia", () => {
  it("agrega receitas e despesas por dia com saldo acumulado", () => {
    const lancamentos = [
      lanc(1, "2026-01-05", 1, 3_000_00),
      lanc(2, "2026-01-10", 2, 200_00),
      lanc(3, "2026-01-11", 2, 100_00),
    ];
    const r = calcularDiaADia(202601, lancamentos, mapaCats, "2026-01-12");

    expect(r.dias).toHaveLength(31);
    expect(r.dias[4].receitas).toBe(3_000_00);
    expect(r.dias[4].saldoDia).toBe(3_000_00);
    expect(r.dias[9].despesas).toBe(200_00);
    expect(r.dias[10].despesas).toBe(100_00);
    expect(r.dias[10].saldoAcumulado).toBe(2_700_00);
  });

  it("pode gastar por dia = sobra ÷ dias restantes (incluindo hoje)", () => {
    const lancamentos = [
      lanc(1, "2026-01-01", 1, 1_000_00),
      lanc(2, "2026-01-10", 2, 400_00),
    ];
    const r = calcularDiaADia(202601, lancamentos, mapaCats, "2026-01-11");
    // sobra 600, dias restantes = 31 − 11 + 1 = 21
    expect(r.podeGastarPorDia).toBe(Math.floor(600_00 / 21));
  });

  it("pode gastar por dia nunca é negativo", () => {
    const lancamentos = [
      lanc(1, "2026-01-01", 1, 500_00),
      lanc(2, "2026-01-02", 2, 900_00),
    ];
    const r = calcularDiaADia(202601, lancamentos, mapaCats, "2026-01-03");
    expect(r.podeGastarPorDia).toBe(0);
  });

  it("fora do mês-alvo, usa o total de dias como divisor", () => {
    const lancamentos = [lanc(1, "2026-01-01", 1, 3_100_00)];
    const r = calcularDiaADia(202601, lancamentos, mapaCats, "2026-02-05");
    expect(r.podeGastarPorDia).toBe(Math.floor(3_100_00 / 31));
  });

  it("maiores gastos ordenados por valor com % das despesas", () => {
    const lancamentos = [
      lanc(1, "2026-01-05", 1, 3_000_00),
      lanc(2, "2026-01-10", 2, 200_00),
      lanc(3, "2026-01-11", 2, 800_00),
      lanc(4, "2026-01-12", 2, 100_00),
    ];
    const r = calcularDiaADia(202601, lancamentos, mapaCats, "2026-01-15");
    expect(r.maioresGastos[0].lancamento.id).toBe(3);
    expect(r.maioresGastos[0].percentualDespesas).toBeCloseTo((800_00 / 1_100_00) * 100, 5);
    expect(r.maioresGastos).toHaveLength(3);
  });

  it("limita os maiores gastos a 10", () => {
    const lancamentos = Array.from({ length: 15 }, (_, i) =>
      lanc(i + 1, `2026-01-${String((i % 28) + 1).padStart(2, "0")}`, 2, 10_00 * (i + 1)),
    );
    const r = calcularDiaADia(202601, lancamentos, mapaCats, "2026-01-28");
    expect(r.maioresGastos).toHaveLength(10);
  });
});
