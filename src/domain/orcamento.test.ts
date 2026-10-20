import { describe, it, expect } from "vitest";
import {
  metaPorGrupo,
  rendaReferenciaPadrao,
  sugerirPlanos,
  calcularOrcamento,
} from "./orcamento";
import type { Categoria, Lancamento, OrcamentoPlano } from "./models";

const CATS: Categoria[] = [
  { id: 1, nome: "Salário", grupo: "Receita" },
  { id: 2, nome: "Moradia", grupo: "Necessidade" },
  { id: 3, nome: "Lazer", grupo: "Desejo" },
  { id: 4, nome: "Reserva", grupo: "Poupança" },
];

const mapaCats = new Map(CATS.map((c) => [c.id, c]));

function lanc(
  id: number,
  data: string,
  categoriaId: number,
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

describe("orcamento — metaPorGrupo", () => {
  it("calcula 50/30/20 sobre a renda de referência", () => {
    const metas = metaPorGrupo({ necessidades: 50, desejos: 30, poupanca: 20 }, 1_000_00);
    expect(metas.necessidades).toBe(500_00);
    expect(metas.desejos).toBe(300_00);
    expect(metas.poupanca).toBe(200_00);
  });
});

describe("orcamento — rendaReferenciaPadrao", () => {
  it("média das receitas dos 3 últimos meses com movimento", () => {
    const lancamentos = [
      lanc(1, "2026-05-05", 1, 1_000_00),
      lanc(2, "2026-07-05", 1, 2_000_00),
      lanc(3, "2026-08-05", 1, 3_000_00),
      lanc(4, "2026-08-10", 2, 500_00),
    ];
    const renda = rendaReferenciaPadrao(lancamentos, mapaCats, (d) => Number(d.slice(0, 4) + d.slice(5, 7)));
    expect(renda).toBe(2_000_00);
  });
});

describe("orcamento — sugerirPlanos", () => {
  it("reparte a meta do grupo proporcionalmente ao histórico", () => {
    const lancamentos = [
      lanc(1, "2026-08-05", 1, 2_000_00),
      lanc(2, "2026-08-10", 2, 600_00),
      lanc(3, "2026-08-15", 3, 400_00),
    ];
    const planos = sugerirPlanos(
      { necessidades: 1_000_00, desejos: 600_00, poupanca: 400_00 },
      CATS,
      lancamentos,
      202608,
    );
    const moradia = planos.find((p) => p.categoriaId === 2);
    const lazer = planos.find((p) => p.categoriaId === 3);
    expect(moradia?.valor).toBe(1_000_00);
    expect(lazer?.valor).toBe(600_00);
  });
});

describe("orcamento — calcularOrcamento", () => {
  const planos: OrcamentoPlano[] = [
    { id: 1, mesKey: 202609, categoriaId: 2, valor: 700_00 },
    { id: 2, mesKey: 202609, categoriaId: 3, valor: 250_00 },
  ];

  const lancamentos = [
    lanc(1, "2026-09-05", 1, 2_500_00),
    lanc(2, "2026-09-10", 2, 600_00),
    lanc(3, "2026-09-20", 2, 200_00),
    lanc(4, "2026-09-22", 3, 300_00),
  ];

  it("linhas com planejado, realizado, variação e situação", () => {
    const r = calcularOrcamento(202609, 202608, planos, lancamentos, CATS, 2_500_00);
    const moradia = r.linhas.find((l) => l.categoriaId === 2);
    const lazer = r.linhas.find((l) => l.categoriaId === 3);

    expect(moradia?.planejado).toBe(700_00);
    expect(moradia?.realizado).toBe(800_00);
    expect(moradia?.variacao).toBe(-100_00); // estourou 100
    expect(moradia?.situacao).toBe("Estourou");

    const reserva = r.linhas.find((l) => l.categoriaId === 4);
    expect(reserva?.situacao).toBe("Sem plano");

    expect(lazer?.planejado).toBe(250_00);
    expect(lazer?.realizado).toBe(300_00);
    expect(lazer?.variacao).toBe(-50_00);
    expect(lazer?.situacao).toBe("Estourou");
  });

  it("sobra a alocar = renda − total planejado", () => {
    const r = calcularOrcamento(202609, 202608, planos, lancamentos, CATS, 2_500_00);
    expect(r.sobraAlocar).toBe(2_500_00 - 950_00);
  });

  it("grupos somam planejado e realizado do grupo", () => {
    const r = calcularOrcamento(202609, 202608, planos, lancamentos, CATS, 2_500_00);
    const necessidade = r.grupos.find((g) => g.grupo === "Necessidade");
    expect(necessidade).toBeDefined();
    expect(necessidade?.realizado).toBe(800_00);
  });
});
