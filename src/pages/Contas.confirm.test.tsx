import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import { db } from "../db/db";
import type { Configuracao, Conta, Lancamento, ReservaConfig } from "../domain/models";
import { PaginaContas } from "./Contas";

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

const contaBanco: Conta = { id: 1, nome: "Banco", tipo: "Corrente", saldoInicial: 0, saldoExtrato: null };

function lancamento(id: number, contaId: number | null, destino: number | null): Lancamento {
  return {
    id,
    data: "2026-10-10",
    descricao: `L${id}`,
    categoriaId: null,
    valor: 1000,
    contaId,
    formaPagamento: "Pix",
    cartaoId: null,
    parcela: null,
    status: "Pago",
    contaDestinoId: destino,
    observacao: "",
  };
}

const reservaNaConta: ReservaConfig = {
  id: 1,
  perfil: "CLT",
  mesesAjustados: null,
  contaId: 1,
  gastoEssencialManual: null,
  aporteMensal: 0,
};

describe("Exclusão de conta com bloqueio referencial (C4)", () => {
  beforeEach(async () => {
    await db.open();
    await db.configuracao.put(configBase);
  });

  afterEach(async () => {
    cleanup();
    await db.delete();
  });

  it("conta com lançamentos e reserva é bloqueada e nada é apagado", async () => {
    await db.contas.bulkPut([contaBanco]);
    await db.lancamentos.bulkPut([lancamento(1, 1, null), lancamento(2, null, 1)]);
    await db.reservaConfig.put(reservaNaConta);
    render(<PaginaContas />);
    fireEvent.click(await screen.findByText("Banco"));
    fireEvent.click(screen.getByRole("button", { name: "Excluir conta" }));
    expect(screen.getByRole("alert").textContent).toMatch(/Em uso por 2 lançamentos \(e 1 /);
    expect(await db.contas.get(1)).toBeTruthy();
    expect(await db.lancamentos.count()).toBe(2);
  });

  it("conta sem referências pede confirmação e é excluída", async () => {
    await db.contas.bulkPut([contaBanco]);
    await db.lancamentos.bulkPut([lancamento(1, 2, null)]);
    render(<PaginaContas />);
    fireEvent.click(await screen.findByText("Banco"));
    fireEvent.click(screen.getByRole("button", { name: "Excluir conta" }));
    expect(screen.getByRole("alertdialog")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Excluir" }));
    await screen.findByText("Nenhuma conta cadastrada.");
    expect(await db.contas.get(1)).toBeUndefined();
  });
});
