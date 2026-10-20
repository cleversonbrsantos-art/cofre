import { describe, it, expect } from "vitest";
import { gastoEssencialMedio, calcularReserva } from "./reserva";
import type { Categoria, Lancamento, ReservaConfig } from "./models";

const CATS: Categoria[] = [
  { id: 1, nome: "Salário", grupo: "Receita" },
  { id: 2, nome: "Mercado", grupo: "Necessidade" },
  { id: 3, nome: "Lazer", grupo: "Desejo" },
];

const mapaCats = new Map(CATS.map((c) => [c.id, c]));

function lanc(id: number, data: string, categoriaId: number, valor: number): Lancamento {
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

describe("reserva — gastoEssencialMedio (4.10)", () => {
  it("média das necessidades dos 3 últimos meses com movimento", () => {
    const lancamentos = [
      lanc(1, "2026-05-10", 2, 1_000_00),
      lanc(2, "2026-06-10", 2, 1_200_00),
      lanc(3, "2026-07-10", 2, 1_600_00),
      lanc(4, "2026-07-15", 3, 900_00), // desejo: não entra
      lanc(5, "2026-07-20", 1, 5_000_00), // receita: não entra
    ];
    expect(gastoEssencialMedio(lancamentos, mapaCats, new Map())).toBe(1_266_67);
  });

  it("inclui parcelas dos cartões do mês da fatura", () => {
    const lancamentos = [
      lanc(1, "2026-06-10", 2, 1_000_00),
      lanc(2, "2026-07-10", 2, 1_000_00),
    ];
    const parcelas = new Map<number, number>([[202607, 200_00]]);
    // julho: 1.000 + 200 = 1.200; junho: 1.000 → média 1.100
    expect(gastoEssencialMedio(lancamentos, mapaCats, parcelas)).toBe(1_100_00);
  });

  it("sem movimento, devolve 0", () => {
    expect(gastoEssencialMedio([], mapaCats, new Map())).toBe(0);
  });
});

describe("reserva — calcularReserva (4.10)", () => {
  const config: ReservaConfig = {
    id: 1,
    perfil: "CLT",
    mesesAjustados: null,
    contaId: null,
    gastoEssencialManual: null,
    aporteMensal: 50_000,
  };

  it("alvo = essencial × meses do perfil; cobertura e situações", () => {
    // meses[0]=jan: cobertura = 1.500.000/1.000.000 = 1,5 → Em construção
    // falta = 6.000 − 1.500 = 4.500; aporte 500 → 9 meses
    const lancamentos = [lanc(1, "2026-07-10", 2, 1_000_00)];
    const r = calcularReserva(config, 6, lancamentos, mapaCats, new Map(), 3_000_00);
    expect(r.mesesAlvo).toBe(6);
    expect(r.gastoEssencialMensal).toBe(1_000_00);
    expect(r.alvoReserva).toBe(6_000_00);
    expect(r.coberturaMeses).toBeCloseTo(3, 5);
    expect(r.situacao).toBe("Quase lá"); // 3 ≥ 6/2
    expect(r.mesesParaCompletar).toBe(6); // falta 3.000 ÷ aporte 500
  });

  it("meses ajustados manualmente e gasto manual têm prioridade", () => {
    const ajustado: ReservaConfig = { ...config, mesesAjustados: 3, gastoEssencialManual: 2_000_00 };
    const r = calcularReserva(ajustado, 6, [], mapaCats, new Map(), 0);
    expect(r.mesesAlvo).toBe(3);
    expect(r.gastoEssencialMensal).toBe(2_000_00);
    expect(r.alvoReserva).toBe(6_000_00);
    expect(r.situacao).toBe("Crítica (menos de 1 mês)");
  });

  it("reserva completa quando cobertura ≥ meses-alvo", () => {
    const lancamentos = [lanc(1, "2026-07-10", 2, 1_000_00)];
    const r = calcularReserva(config, 6, lancamentos, mapaCats, new Map(), 6_000_00);
    expect(r.situacao).toBe("Reserva completa");
    expect(r.mesesParaCompletar).toBe(0);
    expect(r.falta).toBe(0);
  });

  it("em construção entre 1 e metade", () => {
    const lancamentos = [lanc(1, "2026-07-10", 2, 1_000_00)];
    const r = calcularReserva(config, 6, lancamentos, mapaCats, new Map(), 1_500_00);
    expect(r.situacao).toBe("Em construção");
  });

  it("sem aporte → mesesParaCompletar null (Sem aporte)", () => {
    const semAporte: ReservaConfig = { ...config, aporteMensal: 0 };
    const lancamentos = [lanc(1, "2026-07-10", 2, 1_000_00)];
    const r = calcularReserva(semAporte, 6, lancamentos, mapaCats, new Map(), 0);
    expect(r.mesesParaCompletar).toBe(null);
  });
});
