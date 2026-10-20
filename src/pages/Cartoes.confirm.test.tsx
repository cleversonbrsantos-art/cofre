import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import { db } from "../db/db";
import type { Cartao, CompraParcelada, Configuracao } from "../domain/models";
import { PaginaCartoes } from "./Cartoes";

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

const cartao: Cartao = { id: 1, nome: "Cartão Azul", limite: 100000, diaFechamento: 5, diaVencimento: 10 };

const parcelada: CompraParcelada = {
  id: 1,
  descricao: "Notebook",
  cartaoId: 1,
  categoriaId: null,
  dataCompra: "2026-09-10",
  valorTotal: 300000,
  numeroParcelas: 10,
};

describe("Exclusão de cartão com bloqueio referencial (C4)", () => {
  beforeEach(async () => {
    await db.open();
    await db.configuracao.put(configBase);
  });

  afterEach(async () => {
    cleanup();
    await db.delete();
  });

  it("cartão com compra parcelada é bloqueado e nada é apagado", async () => {
    await db.cartoes.bulkPut([cartao]);
    await db.parceladas.bulkPut([parcelada]);
    render(<PaginaCartoes />);
    fireEvent.click(await screen.findByText("Cartão Azul"));
    fireEvent.click(screen.getByRole("button", { name: "Excluir cartão" }));
    expect(screen.getByRole("alert").textContent).toMatch(/Em uso por 1 parcelada/);
    expect(await db.cartoes.get(1)).toBeTruthy();
    expect(await db.parceladas.count()).toBe(1);
  });

  it("cartão sem referências pede confirmação e é excluído", async () => {
    await db.cartoes.bulkPut([cartao]);
    render(<PaginaCartoes />);
    fireEvent.click(await screen.findByText("Cartão Azul"));
    fireEvent.click(screen.getByRole("button", { name: "Excluir cartão" }));
    expect(screen.getByRole("alertdialog")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Excluir" }));
    await screen.findByText("Nenhum cartão cadastrado.");
    expect(await db.cartoes.get(1)).toBeUndefined();
  });
});
