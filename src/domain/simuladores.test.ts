import { describe, it, expect } from "vitest";
import {
  simularJurosCompostos,
  custoDoHabito,
  independenciaFinanceira,
} from "./simuladores";
import { calcularContasAPagar, calcularAssinaturas, addDias, diasEntre, proximaRenovacao } from "./contasapagar";
import type { Assinatura, ContaPagar } from "./models";

/** §8 caso 11: simulador — inicial 10.000; aporte 500; 10 anos; 10,5% a.a. (tolerância de 1 centavo). */
describe("simuladores — §8 caso 11: juros compostos", () => {
  it("confere com a fórmula fechada VF = inicial(1+i)^n + aporte((1+i)^n−1)/i", () => {
    const i = Math.pow(1 + 10.5 / 100, 1 / 12) - 1;
    const n = 120;
    const vf = 1_000_000 * Math.pow(1 + i, n) + (50_000 * (Math.pow(1 + i, n) - 1)) / i;
    const r = simularJurosCompostos(1_000_000, 50_000, 10.5, 10, 0);
    expect(Math.abs(r.montanteFinal - Math.round(vf))).toBeLessThanOrEqual(1);
    expect(r.totalAportado).toBe(1_000_000 + 50_000 * 120);
    expect(r.jurosTotal).toBe(r.montanteFinal - r.totalAportado);
    expect(r.pontos).toHaveLength(10); // 10 anos
  });

  it("taxa 0 → VF = inicial + aportes", () => {
    const r = simularJurosCompostos(1_000_000, 50_000, 0, 10, 0);
    expect(r.montanteFinal).toBe(7_000_000);
  });

  it("poder de compra desconta a inflação", () => {
    const r = simularJurosCompostos(1_000_000, 0, 10.5, 10, 4.5);
    const i = Math.pow(1.105, 1 / 12) - 1;
    const vf = Math.round(1_000_000 * Math.pow(1 + i, 120));
    const descontado = Math.round(vf / Math.pow(1.045, 10));
    expect(r.valorFuturoHoje).toBe(descontado);
    expect(r.valorFuturoHoje).toBeLessThan(vf);
  });
});

describe("simuladores — independência financeira (4.14.2)", () => {
  it("patrimônio necessário = renda × 12 × 25", () => {
    const r = independenciaFinanceira(8_000_00, 150_000, 0, 10.5, 4.5, 20);
    expect(r.patrimonioNecessario).toBe(8_000_00 * 12 * 25);
    expect(r.falta).toBe(r.patrimonioNecessario);
    expect(r.percentualPercorrido).toBe(0);
    expect(r.rendaPassivaHoje).toBe(0);
    expect(r.aporteNecessario).toBeGreaterThan(0);
  });

  it("renda passiva de hoje = patrimônio × 4% ÷ 12", () => {
    const r = independenciaFinanceira(8_000_00, 150_000, 240_000_00, 10.5, 4.5, 20);
    expect(r.rendaPassivaHoje).toBe(Math.round((240_000_00 * 0.04) / 12));
    expect(r.percentualPercorrido).toBeCloseTo(10, 5); // 240.000 ÷ 2.400.000
  });

  it("patrimônio suficiente → 0 anos e renda passiva positiva", () => {
    const r = independenciaFinanceira(8_000_00, 0, 2_400_000_00 * 12, 10.5, 4.5, 20);
    expect(r.falta).toBe(0);
    expect(r.anosParaChegar).toBe(0);
    expect(r.rendaPassivaHoje).toBeGreaterThan(0);
  });
});

describe("simuladores — custo do hábito (4.14.3)", () => {
  it("gasto = valor × vezes × meses; investido ≥ gasto com juros", () => {
    const r = custoDoHabito(3_000, 25, 0, 10);
    expect(r.meses).toBe(120);
    expect(r.gastoTotal).toBe(3_000 * 25 * 120);
    expect(r.investidoTotal).toBe(r.gastoTotal); // taxa 0

    const comJuros = custoDoHabito(3_000, 25, 10.5, 10);
    expect(comJuros.investidoTotal).toBeGreaterThan(comJuros.gastoTotal);
    expect(comJuros.diferenca).toBe(comJuros.investidoTotal - comJuros.gastoTotal);
  });
});

describe("contasapagar — calcularContasAPagar (4.13)", () => {
  const conta = (id: number, vencimento: string, valor: number, status: "" | "Paga" = ""): ContaPagar => ({
    id,
    descricao: `C${id}`,
    vencimento,
    valor,
    categoriaId: null,
    status,
    formaPagamento: "Boleto",
  });

  it("separa vencidas, vencem em breve (0–7d), próximos 5 e pagas do mês", () => {
    const contas = [
      conta(1, "2026-10-05", 200_00), // vencida (hoje 2026-10-17)
      conta(2, "2026-10-20", 300_00), // vence em breve (3 dias)
      conta(3, "2026-10-25", 400_00), // vence em breve (8 dias) — mas fora de 7
      conta(4, "2026-11-30", 500_00), // próxima (1º dos 5)
      conta(5, "2026-12-15", 600_00),
      conta(6, "2026-10-10", 100_00, "Paga"),
    ];
    const r = calcularContasAPagar(contas, "2026-10-17");
    expect(r.totalAberto).toBe(2_000_00);
    expect(r.totalMes).toBe(900_00); // 200+300+400 (abertas de outubro)
    expect(r.pagasMes).toBe(100_00);
    expect(r.vencidas).toHaveLength(1);
    expect(r.vencidas[0].diasAtraso).toBe(12);
    expect(r.vencemEmBreve).toHaveLength(1); // só a de 2026-10-20 (0–7 dias)
    expect(r.proximosVencimentos[0].id).toBe(2);
    expect(r.proximosVencimentos).toHaveLength(4); // abertas futuras: 2, 3, 4, 5
  });

  it("addDias e diasEntre consistentes", () => {
    expect(addDias("2026-10-17", 7)).toBe("2026-10-24");
    expect(addDias("2026-10-31", 1)).toBe("2026-11-01");
    expect(diasEntre("2026-10-05", "2026-10-17")).toBe(12);
    expect(diasEntre("2026-01-31", "2026-02-01")).toBe(1);
  });
});

describe("assinaturas — calcularAssinaturas (4.13)", () => {
  const ass = (id: number, valor: number, ciclo: "Mensal" | "Anual", renovacao: string): Assinatura => ({
    id,
    servico: `S${id}`,
    valor,
    ciclo,
    proximaRenovacao: renovacao,
    categoriaId: null,
  });

  it("anual é dividida por 12 no equivalente mensal; anual × 12", () => {
    const r = calcularAssinaturas(
      [ass(1, 120_000, "Anual", "2027-01-10"), ass(2, 2_990, "Mensal", "2026-10-25")],
      "2026-10-17",
    );
    expect(r.custoMensalEquivalente).toBe(10_000 + 2_990);
    expect(r.custoAnual).toBe((10_000 + 2_990) * 12);
    expect(r.renovacoesProximas).toHaveLength(1);
    expect(r.renovacoesProximas[0].assinatura.id).toBe(2);
  });
});

describe("assinaturas — proximaRenovacao", () => {
  it("mensal avança 1 mês (clamp no fim do mês); anual avança 12", () => {
    expect(proximaRenovacao("2026-01-31", "Mensal")).toBe("2026-02-28");
    expect(proximaRenovacao("2026-10-17", "Anual")).toBe("2027-10-17");
  });
});
