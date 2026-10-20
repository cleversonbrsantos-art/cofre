import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup, waitFor, fireEvent } from "@testing-library/react";
import { db } from "../db/db";
import type { Configuracao, PaymentMethod, Lancamento } from "../domain/models";
import { PaymentMethodsManager } from "./PaymentMethodsManager";

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

const lancamentoPix: Lancamento = {
  id: 1,
  data: "2026-10-10",
  descricao: "Compra",
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

describe("PaymentMethodsManager (C3)", () => {
  beforeEach(async () => {
    await db.open();
    await db.configuracao.put(configBase);
    await db.paymentMethods.bulkPut([
      { id: 1, name: "Pix" },
      { id: 2, name: "Crédito" },
    ] satisfies PaymentMethod[]);
  });

  afterEach(async () => {
    cleanup();
    await db.delete();
  });

  it("renderiza formas cadastradas no banco", async () => {
    render(<PaymentMethodsManager />);
    expect(await screen.findByText("Pix")).toBeTruthy();
    expect(screen.getByText("Crédito")).toBeTruthy();
  });

  it("cria forma nova", async () => {
    render(<PaymentMethodsManager />);
    const entrada = await screen.findByLabelText("Nova forma de pagamento");
    fireEvent.change(entrada, { target: { value: "Vale-alimentação" } });
    fireEvent.click(screen.getByRole("button", { name: "Adicionar" }));
    await waitFor(async () => {
      const todas = await db.paymentMethods.toArray();
      expect(todas.some((f) => f.name === "Vale-alimentação")).toBe(true);
    });
  });

  it("rejeita duplicata ignorando maiúsculas e acentos", async () => {
    render(<PaymentMethodsManager />);
    const entrada = await screen.findByLabelText("Nova forma de pagamento");
    fireEvent.change(entrada, { target: { value: " pix " } });
    fireEvent.click(screen.getByRole("button", { name: "Adicionar" }));
    expect(await screen.findByText("Já existe um item com esse nome.")).toBeTruthy();
    expect((await db.paymentMethods.toArray()).length).toBe(2);
  });

  it("renomeia forma atualizando lançamentos e contas a pagar na mesma transação", async () => {
    await db.lancamentos.bulkPut([lancamentoPix]);
    await db.contasPagar.bulkPut([
      {
        id: 1,
        descricao: "Conta de luz",
        vencimento: "2026-10-20",
        valor: 10000,
        categoriaId: null,
        status: "" as const,
        formaPagamento: "Pix",
      },
    ]);
    render(<PaymentMethodsManager />);
    fireEvent.click(await screen.findByRole("button", { name: "Renomear Pix" }));
    const entrada = screen.getByLabelText("Nome");
    fireEvent.change(entrada, { target: { value: "PIX" } });
    fireEvent.click(screen.getByRole("button", { name: "Salvar" }));
    await waitFor(async () => {
      expect((await db.paymentMethods.get(1))?.name).toBe("PIX");
      expect((await db.lancamentos.get(1))?.formaPagamento).toBe("PIX");
      expect((await db.contasPagar.get(1))?.formaPagamento).toBe("PIX");
    });
  });

  it("bloqueia exclusão de forma em uso", async () => {
    await db.lancamentos.bulkPut([lancamentoPix]);
    render(<PaymentMethodsManager />);
    fireEvent.click(await screen.findByRole("button", { name: "Excluir Pix" }));
    expect(await screen.findByText(/Em uso por 1 registro/)).toBeTruthy();
    expect((await db.paymentMethods.get(1))?.name).toBe("Pix");
  });

  it("permite excluir forma sem uso, com confirmação", async () => {
    render(<PaymentMethodsManager />);
    fireEvent.click(await screen.findByRole("button", { name: "Excluir Crédito" }));
    fireEvent.click(screen.getByRole("button", { name: "Excluir" }));
    await waitFor(async () => {
      expect(await db.paymentMethods.get(2)).toBeUndefined();
    });
  });
});
