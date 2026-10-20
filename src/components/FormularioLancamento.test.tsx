import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { FormularioLancamento } from "./FormularioLancamento";
import { valoresIniciais, type ValoresFormulario } from "./valoresFormulario";
import type { Categoria, Conta, Cartao } from "../domain/models";

const categorias: Categoria[] = [
  { id: 1, nome: "Salário", grupo: "Receita" },
  { id: 2, nome: "Mercado", grupo: "Necessidade" },
  { id: 3, nome: "Reserva", grupo: "Poupança" },
];

const contas: Conta[] = [
  { id: 10, nome: "Corrente", tipo: "Corrente", saldoInicial: 0, saldoExtrato: null },
];

const cartoes: Cartao[] = [
  { id: 20, nome: "Cartão teste", limite: 100000, diaFechamento: 25, diaVencimento: 5 },
];

function montar(onSubmit: ReturnType<typeof vi.fn>) {
  return render(
    <FormularioLancamento
      valorInicial={valoresIniciais("2026-10-15")}
      categorias={categorias}
      contas={contas}
      cartoes={cartoes}
      onSubmit={onSubmit}
      onCancel={() => {}}
      rotuloSubmit="Salvar"
    />,
  );
}

describe("FormularioLancamento (§8 teste de componente)", () => {
  it("valida valor obrigatório e submete com centavos corretos", () => {
    const onSubmit = vi.fn();
    montar(onSubmit);

    const descricao = screen.getByLabelText("Descrição");
    fireEvent.change(descricao, { target: { value: "Mercado" } });

    // sem valor: erro
    fireEvent.click(screen.getByRole("button", { name: "Salvar" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Informe um valor maior que zero.");
    expect(onSubmit).not.toHaveBeenCalled();

    // com valor válido
    const valor = screen.getByLabelText("Valor");
    fireEvent.change(valor, { target: { value: "123,45" } });
    fireEvent.change(screen.getByLabelText("Conta"), { target: { value: "10" } });
    fireEvent.click(screen.getByRole("button", { name: "Salvar" }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    const chamada = onSubmit.mock.calls[0][0] as ValoresFormulario;
    expect(chamada.valorCentavos).toBe(12345);
    expect(chamada.descricao).toBe("Mercado");
  });

  it("escolher cartão limpa a conta e força forma Crédito", () => {
    const onSubmit = vi.fn();
    montar(onSubmit);

    fireEvent.change(screen.getByLabelText("Conta"), { target: { value: "10" } });
    fireEvent.change(screen.getByLabelText("Descrição"), { target: { value: "Compra" } });
    fireEvent.change(screen.getByLabelText("Valor"), { target: { value: "50,00" } });
    fireEvent.change(screen.getByLabelText("Cartão"), { target: { value: "20" } });

    const conta: HTMLSelectElement = screen.getByLabelText("Conta");
    expect(conta.value).toBe("");

    fireEvent.click(screen.getByRole("button", { name: "Salvar" }));
    const chamada2 = onSubmit.mock.calls[0][0] as ValoresFormulario;
    expect(chamada2.cartaoId).toBe(20);
    expect(chamada2.contaId).toBeNull();
    expect(chamada2.formaPagamento).toBe("Crédito");
  });
});
