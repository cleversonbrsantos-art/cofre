import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, cleanup, fireEvent, waitFor } from "@testing-library/react";
import { db } from "../db/db";
import type { Configuracao } from "../domain/models";
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

describe("Criação de lançamento (SPEC 3.1)", () => {
  beforeEach(async () => {
    await db.open();
    await db.configuracao.put(configBase);
    await db.contas.put({
      id: 10,
      nome: "Corrente",
      tipo: "Corrente",
      saldoInicial: 0,
      saldoExtrato: null,
    });
  });

  afterEach(async () => {
    cleanup();
    vi.restoreAllMocks();
    await db.delete();
  });

  async function abrirPainelNovoLancamento() {
    render(<PaginaLancamentos />);
    fireEvent.click(await screen.findByRole("button", { name: "Novo lançamento" }));
    await screen.findByRole("dialog", { name: "Novo lançamento" });
  }

  function preencherFormularioValido(descricao: string) {
    fireEvent.change(screen.getByLabelText("Valor"), { target: { value: "123,45" } });
    fireEvent.change(screen.getByLabelText("Descrição"), { target: { value: descricao } });
    fireEvent.change(screen.getByLabelText("Conta"), { target: { value: "10" } });
    fireEvent.click(screen.getByRole("button", { name: "Salvar" }));
  }

  it("cria sem id fixo: o Dexie gera id 1, 2, … e o registro aparece na lista imediatamente", async () => {
    await abrirPainelNovoLancamento();
    preencherFormularioValido("Mercado");

    await waitFor(async () => {
      const todos = await db.lancamentos.toArray();
      expect(todos).toHaveLength(1);
      expect(todos[0].id).toBe(1);
      expect(todos[0].valor).toBe(12345);
      expect(todos[0].descricao).toBe("Mercado");
    });
    // o painel só fecha DEPOIS que o add foi concluído com sucesso
    expect(screen.queryByRole("dialog")).toBeNull();
    // o novo lançamento aparece na lista imediatamente
    expect(await screen.findByText("Mercado")).toBeTruthy();

    // segundo lançamento recebe o id sequencial seguinte
    fireEvent.click(screen.getByRole("button", { name: "Novo lançamento" }));
    await screen.findByRole("dialog", { name: "Novo lançamento" });
    fireEvent.change(screen.getByLabelText("Valor"), { target: { value: "45,00" } });
    fireEvent.change(screen.getByLabelText("Descrição"), { target: { value: "Transporte" } });
    fireEvent.change(screen.getByLabelText("Conta"), { target: { value: "10" } });
    fireEvent.click(screen.getByRole("button", { name: "Salvar" }));

    await waitFor(async () => {
      const todos = await db.lancamentos.toArray();
      expect(todos.map((l) => l.id).sort((a, b) => a - b)).toEqual([1, 2]);
    });
  });

  it("submissão inválida mostra mensagem de erro e não fecha o painel nem grava", async () => {
    await abrirPainelNovoLancamento();
    fireEvent.click(screen.getByRole("button", { name: "Salvar" }));

    expect(screen.getByRole("alert")).toHaveTextContent("Informe um valor maior que zero.");
    expect(screen.getByRole("dialog", { name: "Novo lançamento" })).toBeTruthy();
    expect(await db.lancamentos.count()).toBe(0);
  });

  it("erro do Dexie exibe <Erro mensagem> e mantém o painel aberto", async () => {
    await abrirPainelNovoLancamento();
    vi.spyOn(db.lancamentos, "add").mockRejectedValueOnce(new Error("falha simulada do Dexie"));
    preencherFormularioValido("Mercado");

    expect(await screen.findByText(/falha simulada do Dexie/)).toBeTruthy();
    expect(screen.getByRole("dialog", { name: "Novo lançamento" })).toBeTruthy();
    expect(await db.lancamentos.count()).toBe(0);
  });
});
