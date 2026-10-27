import { describe, it, expect } from "vitest";
import { calcularResumoProventos, filtrarPorStatus } from "./dividends";
import type { AtivoInvestimento, Dividend } from "./models";

const hoje = "2025-06-15";

const ativosMock: AtivoInvestimento[] = [
  { id: 1, nome: "PETR4", classe: "Ações", totalAportado: 1000000, valorAtual: 1200000, quantidade: 100 },
  { id: 2, nome: "ITUB4", classe: "Ações", totalAportado: 500000, valorAtual: 600000, quantidade: 50 },
  { id: 3, nome: "HGLG11", classe: "FIIs", totalAportado: 300000, valorAtual: 350000, quantidade: 30 },
];

const dividendosMock: Dividend[] = [
  // PETR4 - pagos nos últimos 12 meses
  { id: "PETR4|2024-07-01", ticker: "PETR4", type: "Acao", amount: 200, exDate: "2024-07-01", paymentDate: "2024-07-15", status: "Pago", updatedAt: Date.now() },
  { id: "PETR4|2024-10-01", ticker: "PETR4", type: "Acao", amount: 150, exDate: "2024-10-01", paymentDate: "2024-10-15", status: "Pago", updatedAt: Date.now() },
  { id: "PETR4|2025-01-01", ticker: "PETR4", type: "Acao", amount: 180, exDate: "2025-01-01", paymentDate: "2025-01-15", status: "Pago", updatedAt: Date.now() },
  { id: "PETR4|2025-04-01", ticker: "PETR4", type: "Acao", amount: 220, exDate: "2025-04-01", paymentDate: "2025-04-15", status: "Pago", updatedAt: Date.now() },
  // PETR4 - a receber
  { id: "PETR4|2025-05-01", ticker: "PETR4", type: "Acao", amount: 190, exDate: "2025-05-01", paymentDate: "2025-07-15", status: "A Receber", updatedAt: Date.now() },
  // ITUB4 - pagos nos últimos 12 meses
  { id: "ITUB4|2024-08-01", ticker: "ITUB4", type: "Acao", amount: 100, exDate: "2024-08-01", paymentDate: "2024-08-15", status: "Pago", updatedAt: Date.now() },
  { id: "ITUB4|2025-02-01", ticker: "ITUB4", type: "Acao", amount: 120, exDate: "2025-02-01", paymentDate: "2025-02-15", status: "Pago", updatedAt: Date.now() },
  // ITUB4 - a receber
  { id: "ITUB4|2025-05-01", ticker: "ITUB4", type: "Acao", amount: 110, exDate: "2025-05-01", paymentDate: "2025-08-15", status: "A Receber", updatedAt: Date.now() },
  // HGLG11 - pagos nos últimos 12 meses
  { id: "HGLG11|2024-09-01", ticker: "HGLG11", type: "FII", amount: 50, exDate: "2024-09-01", paymentDate: "2024-09-15", status: "Pago", updatedAt: Date.now() },
  { id: "HGLG11|2024-12-01", ticker: "HGLG11", type: "FII", amount: 55, exDate: "2024-12-01", paymentDate: "2024-12-15", status: "Pago", updatedAt: Date.now() },
  { id: "HGLG11|2025-03-01", ticker: "HGLG11", type: "FII", amount: 60, exDate: "2025-03-01", paymentDate: "2025-03-15", status: "Pago", updatedAt: Date.now() },
  // HGLG11 - a receber
  { id: "HGLG11|2025-06-01", ticker: "HGLG11", type: "FII", amount: 65, exDate: "2025-06-01", paymentDate: "2025-09-15", status: "A Receber", updatedAt: Date.now() },
  // Dividendo de ativo que o usuário não possui (deve ser ignorado)
  { id: "VALE3|2025-01-01", ticker: "VALE3", type: "Acao", amount: 300, exDate: "2025-01-01", paymentDate: "2025-01-15", status: "Pago", updatedAt: Date.now() },
];

describe("calcularResumoProventos", () => {
  it("calcula total recebido nos últimos 12 meses", () => {
    const resumo = calcularResumoProventos(ativosMock, dividendosMock, hoje);
    // PETR4: (200+150+180+220) * 100 = 750 * 100 = 75000
    // ITUB4: (100+120) * 50 = 220 * 50 = 11000
    // HGLG11: (50+55+60) * 30 = 165 * 30 = 4950
    // Total = 75000 + 11000 + 4950 = 90950
    expect(resumo.totalRecebido12Meses).toBe(90950);
  });

  it("calcula total a receber", () => {
    const resumo = calcularResumoProventos(ativosMock, dividendosMock, hoje);
    // PETR4: 190 * 100 = 19000
    // ITUB4: 110 * 50 = 5500
    // HGLG11: 65 * 30 = 1950
    // Total = 19000 + 5500 + 1950 = 26450
    expect(resumo.totalAReceber).toBe(26450);
  });

  it("calcula média mensal", () => {
    const resumo = calcularResumoProventos(ativosMock, dividendosMock, hoje);
    // 90950 / 12 = 7579.16... -> 7579 (arredondado)
    expect(resumo.mediaMensal).toBe(7579);
  });

  it("gera detalhes ordenados por data de pagamento (mais recente primeiro)", () => {
    const resumo = calcularResumoProventos(ativosMock, dividendosMock, hoje);
    const datas = resumo.detalhes.map((d) => d.dataPagamento);
    for (let i = 1; i < datas.length; i++) {
      expect(datas[i - 1] >= datas[i]).toBe(true);
    }
  });

  it("ignora dividendos de ativos que o usuário não possui", () => {
    const resumo = calcularResumoProventos(ativosMock, dividendosMock, hoje);
    const tickers = resumo.detalhes.map((d) => d.ativo);
    expect(tickers).not.toContain("VALE3");
  });

  it("calcula total por linha corretamente (quantidade * valorPorCota)", () => {
    const resumo = calcularResumoProventos(ativosMock, dividendosMock, hoje);
    for (const d of resumo.detalhes) {
      expect(d.total).toBe(d.quantidade * d.valorPorCota);
    }
  });
});

describe("filtrarPorStatus", () => {
  const detalhes = [
    { ativo: "PETR4", tipo: "Acao", status: "Pago" as const, dataCom: "2025-01-01", dataPagamento: "2025-01-15", quantidade: 100, valorPorCota: 200, total: 20000 },
    { ativo: "PETR4", tipo: "Acao", status: "A Receber" as const, dataCom: "2025-05-01", dataPagamento: "2025-07-15", quantidade: 100, valorPorCota: 190, total: 19000 },
  ];

  it("retorna todos quando filtro é 'Todos'", () => {
    expect(filtrarPorStatus(detalhes, "Todos")).toHaveLength(2);
  });

  it("filtra apenas 'Pago'", () => {
    const result = filtrarPorStatus(detalhes, "Pago");
    expect(result).toHaveLength(1);
    expect(result[0].status).toBe("Pago");
  });

  it("filtra apenas 'A Receber'", () => {
    const result = filtrarPorStatus(detalhes, "A Receber");
    expect(result).toHaveLength(1);
    expect(result[0].status).toBe("A Receber");
  });
});