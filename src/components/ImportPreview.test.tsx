import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup, waitFor, fireEvent } from "@testing-library/react";
import { db } from "../db/db";
import type { Configuracao } from "../domain/models";
import { ImportPreview } from "./ImportPreview";

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

const backupValido = {
  versao: 2,
  exportadoEm: "2026-10-17T12:00:00.000Z",
  dados: {
    configuracao: [configBase],
    paymentMethods: [{ id: 1, name: "Pix" }],
    categorias: [
      { id: 1, nome: "Mercado", grupo: "Necessidade" },
      { id: 2, nome: "Salário", grupo: "Receita" },
    ],
    contas: [],
    cartoes: [],
    lancamentos: [
      {
        id: 1,
        data: "2026-10-01",
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
    ],
    parceladas: [],
    orcamentoPlanos: [],
    orcamentoConfig: [],
    metas: [],
    reservaConfig: [],
    dividas: [],
    ativos: [],
    alvos: [],
    bensPassivos: [],
    patrimonioHistorico: [],
    contasPagar: [],
    assinaturas: [],
    recorrentes: [],
  },
};

function arquivoDe(texto: string): File {
  return new File([texto], "backup.json", { type: "application/json" });
}

describe("ImportPreview (C4)", () => {
  beforeEach(async () => {
    await db.open();
    await db.configuracao.put(configBase);
    await db.lancamentos.bulkPut([
      {
        id: 10,
        data: "2026-09-15",
        descricao: "Atual",
        categoriaId: null,
        valor: 1000,
        contaId: 1,
        formaPagamento: "Pix",
        cartaoId: null,
        parcela: null,
        status: "Pago",
        contaDestinoId: null,
        observacao: "",
      },
    ]);
  });

  afterEach(async () => {
    cleanup();
    await db.delete();
  });

  it("mostra o resumo lado a lado com o banco e mantém os dados intactos", async () => {
    const onConcluido = vi.fn();
    render(
      <ImportPreview arquivo={arquivoDe(JSON.stringify(backupValido))} onConcluido={onConcluido} onCancelar={() => {}} />,
    );
    expect(await screen.findByText("Lançamentos")).toBeTruthy();
    const linha = screen.getByText("Lançamentos").closest("tr");
    expect(linha?.textContent).toContain("1"); // 1 no backup, 1 no banco
    const linhaCategorias = screen.getByText("Categorias").closest("tr");
    expect(linhaCategorias?.textContent).toContain("2"); // 2 categorias no backup
    expect(screen.getByText(/Versão/)).toBeTruthy();
    // nada foi importado ainda
    expect(await db.lancamentos.count()).toBe(1);
    expect(onConcluido).not.toHaveBeenCalled();
  });

  it("Cancelar mantém tudo", async () => {
    const onCancelar = vi.fn();
    render(
      <ImportPreview arquivo={arquivoDe(JSON.stringify(backupValido))} onConcluido={() => {}} onCancelar={onCancelar} />,
    );
    fireEvent.click(await screen.findByRole("button", { name: "Cancelar" }));
    expect(onCancelar).toHaveBeenCalledTimes(1);
    expect(await db.lancamentos.count()).toBe(1);
  });

  it('"Substituir todos os dados" troca o conteúdo', async () => {
    const onConcluido = vi.fn();
    render(
      <ImportPreview arquivo={arquivoDe(JSON.stringify(backupValido))} onConcluido={onConcluido} onCancelar={() => {}} />,
    );
    fireEvent.click(await screen.findByRole("button", { name: "Substituir todos os dados" }));
    await waitFor(() => expect(onConcluido).toHaveBeenCalledTimes(1));
    await waitFor(async () => {
      expect(await db.lancamentos.count()).toBe(1);
      const lct = await db.lancamentos.get(1);
      expect(lct?.descricao).toBe("Compra");
    });
    expect(await db.categorias.count()).toBe(2);
  });

  it("arquivo inválido mostra o erro e não oferece substituir", async () => {
    render(
      <ImportPreview arquivo={arquivoDe("{quebrado")} onConcluido={() => {}} onCancelar={() => {}} />,
    );
    const erro = await screen.findByRole("alert");
    expect(erro.textContent).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Substituir todos os dados" })).toBeNull();
  });
});
