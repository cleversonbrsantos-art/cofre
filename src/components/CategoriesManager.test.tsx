import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup, waitFor, fireEvent } from "@testing-library/react";
import { db } from "../db/db";
import type { Configuracao, Categoria } from "../domain/models";
import { CategoriesManager } from "./CategoriesManager";

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
  { id: 1, nome: "Mercado", grupo: "Necessidade" },
  { id: 2, nome: "Salário", grupo: "Receita" },
];

describe("CategoriesManager (C3)", () => {
  beforeEach(async () => {
    await db.open();
    await db.configuracao.put(configBase);
    await db.categorias.bulkPut(categoriasBase);
  });

  afterEach(async () => {
    cleanup();
    await db.delete();
  });

  it("renderiza categorias existentes com grupo", async () => {
    render(<CategoriesManager />);
    expect(await screen.findByText("Mercado")).toBeTruthy();
    expect(screen.getByText("Salário")).toBeTruthy();
    expect(screen.getAllByText("Necessidade").length).toBeGreaterThan(0);
  });

  it("cria categoria nova", async () => {
    render(<CategoriesManager />);
    const entrada = await screen.findByLabelText("Nova categoria");
    fireEvent.change(entrada, { target: { value: "Farmácia" } });
    fireEvent.click(screen.getByRole("button", { name: "Adicionar" }));
    await waitFor(async () => {
      const todas = await db.categorias.toArray();
      expect(todas.some((c) => c.nome === "Farmácia" && c.grupo === "Necessidade")).toBe(true);
    });
  });

  it("rejeita duplicata ignorando maiúsculas e acentos", async () => {
    render(<CategoriesManager />);
    const entrada = await screen.findByLabelText("Nova categoria");
    fireEvent.change(entrada, { target: { value: "MERCADO" } });
    fireEvent.click(screen.getByRole("button", { name: "Adicionar" }));
    expect(await screen.findByText("Já existe um item com esse nome.")).toBeTruthy();
    const todas = await db.categorias.toArray();
    expect(todas.length).toBe(2);
  });

  it("renomeia categoria", async () => {
    render(<CategoriesManager />);
    fireEvent.click(await screen.findByRole("button", { name: "Renomear Mercado" }));
    const entrada = screen.getByLabelText("Nome");
    fireEvent.change(entrada, { target: { value: "Supermercado" } });
    fireEvent.click(screen.getByRole("button", { name: "Salvar" }));
    await waitFor(async () => {
      const alvo = await db.categorias.get(1);
      expect(alvo?.nome).toBe("Supermercado");
    });
  });

  it("pede confirmação ao mudar grupo e aplica após confirmar", async () => {
    render(<CategoriesManager />);
    fireEvent.click(await screen.findByRole("button", { name: "Renomear Mercado" }));
    fireEvent.change(screen.getByLabelText("Grupo"), { target: { value: "Desejo" } });
    fireEvent.click(screen.getByRole("button", { name: "Salvar" }));
    // diálogo aparece antes de aplicar
    expect(screen.getByRole("alertdialog")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Confirmar" }));
    await waitFor(async () => {
      const alvo = await db.categorias.get(1);
      expect(alvo?.grupo).toBe("Desejo");
    });
  });

  it("exclui com confirmação: zera categoriaId, apaga planos e a categoria", async () => {
    await db.lancamentos.bulkPut([
      {
        id: 1,
        data: "2026-10-10",
        descricao: "Compra",
        categoriaId: 1,
        valor: 5000,
        contaId: 1,
        formaPagamento: "Pix",
        cartaoId: null,
        parcela: null,
        status: "Pago",
        contaDestinoId: null,
        observacao: "",
      },
    ]);
    await db.orcamentoPlanos.bulkPut([{ id: 1, mesKey: 202610, categoriaId: 1, valor: 10000 }]);
    render(<CategoriesManager />);
    fireEvent.click(await screen.findByRole("button", { name: "Excluir Mercado" }));
    expect(screen.getByRole("alertdialog")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Excluir" }));
    await waitFor(async () => {
      expect(await db.categorias.get(1)).toBeUndefined();
      const lct = await db.lancamentos.get(1);
      expect(lct?.categoriaId).toBeNull();
      expect(await db.orcamentoPlanos.get(1)).toBeUndefined();
    });
  });
});
