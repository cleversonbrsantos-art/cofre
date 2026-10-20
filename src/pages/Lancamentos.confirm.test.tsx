import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent, waitFor, within } from "@testing-library/react";
import { db } from "../db/db";
import type { Configuracao, Lancamento } from "../domain/models";
import { PaginaLancamentos } from "./Lancamentos";

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

const lancamento: Lancamento = {
  id: 1,
  data: "2026-10-10",
  descricao: "Supermercado",
  categoriaId: null,
  valor: 5000,
  contaId: 1,
  formaPagamento: "Pix",
  cartaoId: null,
  parcela: null,
  status: "Pago",
  contaDestinoId: null,
  observacao: "",
};

describe("Exclusão de lançamento com confirmação (C4)", () => {
  beforeEach(async () => {
    await db.open();
    await db.configuracao.put(configBase);
    await db.lancamentos.bulkPut([lancamento]);
  });

  afterEach(async () => {
    cleanup();
    await db.delete();
  });

  it("cancelar não exclui", async () => {
    render(<PaginaLancamentos />);
    fireEvent.click(await screen.findByText("Supermercado"));
    fireEvent.click(screen.getByRole("button", { name: "Excluir lançamento" }));
    expect(screen.getByRole("alertdialog")).toBeTruthy();
    fireEvent.click(within(screen.getByRole("alertdialog")).getByRole("button", { name: "Cancelar" }));
    expect(await db.lancamentos.get(1)).toBeTruthy();
    expect(screen.queryByRole("alertdialog")).toBeNull();
  });

  it("confirmar exclui", async () => {
    render(<PaginaLancamentos />);
    fireEvent.click(await screen.findByText("Supermercado"));
    fireEvent.click(screen.getByRole("button", { name: "Excluir lançamento" }));
    fireEvent.click(screen.getByRole("button", { name: "Excluir" }));
    await waitFor(async () => {
      expect(await db.lancamentos.get(1)).toBeUndefined();
    });
  });
});
