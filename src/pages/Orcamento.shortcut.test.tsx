import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup, waitFor, fireEvent } from "@testing-library/react";
import { db } from "../db/db";
import type { Configuracao, Categoria, OrcamentoConfig } from "../domain/models";
import { PaginaOrcamento } from "./Orcamento";

const configBase: Configuracao = {
  id: 1,
  nomeUsuario: "",
  anoInicial: 2026,
  rendimentoAa: 10.5,
  inflacaoAa: 4.5,
  rendimentoMensalEq: 0.8345,
  hojeManual: null,
  limiteDestaque: 100000,
  perfilReserva: "CLT",
  atalhoOrcamento: "50/30/20",
  atalhoPersonalizado: { necessidades: 50, desejos: 30, poupanca: 20 },
};

const categoriasBase: Categoria[] = [
  { id: 1, nome: "Salário", grupo: "Receita" },
  { id: 2, nome: "Mercado", grupo: "Necessidade" },
  { id: 3, nome: "Restaurantes e delivery", grupo: "Desejo" },
  { id: 4, nome: "Investimentos", grupo: "Poupança" },
];

const orcConfigBase: OrcamentoConfig = {
  id: 1,
  mesKey: 202610,
  rendaReferencia: 500000,
  atalho: "50/30/20",
  usarSugestoes: false,
};

describe("Atalho de orçamento (C3)", () => {
  beforeEach(async () => {
    await db.open();
    await db.configuracao.put(configBase);
    await db.categorias.bulkPut(categoriasBase);
    await db.orcamentoConfig.put(orcConfigBase);
  });

  afterEach(async () => {
    cleanup();
    await db.delete();
  });

  it("troca o atalho e grava em configuracao e orcamentoConfig", async () => {
    render(<PaginaOrcamento />);
    const seletor = await screen.findByLabelText("Atalho de orçamento");
    fireEvent.change(seletor, { target: { value: "60/30/10" } });
    await waitFor(async () => {
      expect((await db.configuracao.get(1))?.atalhoOrcamento).toBe("60/30/10");
      expect((await db.orcamentoConfig.get(1))?.atalho).toBe("60/30/10");
    });
  });

  it("atalho Personalizado mostra campos, valida e grava percentuais", async () => {
    render(<PaginaOrcamento />);
    const seletor = await screen.findByLabelText("Atalho de orçamento");
    fireEvent.change(seletor, { target: { value: "Personalizado" } });
    expect((await db.configuracao.get(1))?.atalhoOrcamento).toBe("Personalizado");
    expect((await db.orcamentoConfig.get(1))?.atalho).toBe("Personalizado");

    // soma inválida: erro e não grava
    fireEvent.change(screen.getByLabelText("Poupança (%)"), { target: { value: "25" } });
    expect(await screen.findByText("A soma dos três valores deve ser 100.")).toBeTruthy();
    expect((await db.configuracao.get(1))?.atalhoPersonalizado.poupanca).toBe(20);

    // soma correta: grava
    fireEvent.change(screen.getByLabelText("Poupança (%)"), { target: { value: "20" } });
    await waitFor(async () => {
      const alvo = (await db.configuracao.get(1))?.atalhoPersonalizado;
      expect(alvo).toEqual({ necessidades: 50, desejos: 30, poupanca: 20 });
    });
  });
});
