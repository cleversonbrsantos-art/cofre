import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import Dexie from "dexie";
import { PaginaPainel } from "./Painel";
import { db, type Tabelas } from "../db/db";
import { carregarDadosExemplo } from "../db/exemplo";

/** Painel com dados de exemplo (§8 teste de componente) — banco Dexie em memória. */
describe("Painel (§8 teste de componente, dados de exemplo)", () => {
  beforeEach(async () => {
    cleanup();
    // substitui o banco real por um em memória com o mesmo esquema
    const mem = new Dexie("cofre-teste") as Dexie & Tabelas;
    mem.version(1).stores({
      configuracao: "id",
      categorias: "++id, nome, grupo",
      contas: "++id, nome, tipo",
      cartoes: "++id, nome",
      lancamentos: "++id, data, categoriaId, contaId, cartaoId, status",
      parceladas: "++id, cartaoId, dataCompra",
      orcamentoPlanos: "++id, mesKey, categoriaId",
      orcamentoConfig: "id",
      metas: "++id, nome",
      reservaConfig: "id",
      dividas: "++id, nome",
      ativos: "++id, nome, classe",
      alvos: "++id, classe",
      bensPassivos: "++id, nome",
      patrimonioHistorico: "++id, mesKey",
      contasPagar: "++id, vencimento, status",
      assinaturas: "++id, proximaRenovacao",
      recorrentes: "++id, descricao",
    });
    Object.assign(db, mem);
    await mem.open();
    await carregarDadosExemplo(mem);
  });

  it("renderiza indicadores, nota de saúde, destaques e vencimentos", async () => {
    render(<PaginaPainel />);

    // indicadores aparecem com os rótulos da 4.15
    expect(await screen.findByText("Receitas do mês")).toBeTruthy();
    expect(screen.getByText("Despesas do mês")).toBeTruthy();
    expect(screen.getByText("Saldo do mês")).toBeTruthy();
    expect(screen.getByText("Taxa de poupança (meta 20%)")).toBeTruthy();
    expect(screen.getByText("Patrimônio líquido")).toBeTruthy();
    expect(screen.getByText("Reserva (cobertura)")).toBeTruthy();
    expect(screen.getByText("Orçamento usado")).toBeTruthy();
    expect(screen.getByText("Pode gastar por dia")).toBeTruthy();

    // nota de saúde: regras da 4.15
    expect(screen.getByText("Saúde financeira")).toBeTruthy();
    expect(screen.getByText("Poupança")).toBeTruthy();
    expect(screen.getByText("Reserva de emergência")).toBeTruthy();

    // destaques e vencimentos
    expect(screen.getByText("Maior categoria de gasto")).toBeTruthy();
    expect(screen.getByText("Próximos vencimentos")).toBeTruthy();
    expect(screen.getByText("Maiores gastos do mês")).toBeTruthy();

    // gráficos do painel
    expect(screen.getByText("Para onde foi o dinheiro no mês")).toBeTruthy();
    expect(screen.getByText("Regra 50/30/20: real × ideal")).toBeTruthy();
    expect(screen.getByText("Progresso das metas")).toBeTruthy();
  });
});
