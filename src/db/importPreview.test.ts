import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { db } from "./db";
import { exportarBackup, prepareImport } from "./backup";
import type { Configuracao } from "../domain/models";

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

describe("prepareImport (C4)", () => {
  beforeEach(async () => {
    await db.open();
    await db.configuracao.put(configBase);
    await db.lancamentos.bulkPut([
      {
        id: 1,
        data: "2026-10-01",
        descricao: "A",
        categoriaId: null,
        valor: 100,
        contaId: 1,
        formaPagamento: "Pix",
        cartaoId: null,
        parcela: null,
        status: "Pago",
        contaDestinoId: null,
        observacao: "",
      },
      {
        id: 2,
        data: "2026-10-02",
        descricao: "B",
        categoriaId: null,
        valor: 200,
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
    await db.delete();
  });

  it("arquivo válido devolve o resumo e não altera o banco", async () => {
    const backup = await exportarBackup();
    const antes = await db.lancamentos.count();
    const r = await prepareImport(JSON.stringify(backup));
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.summary.version).toBe(2);
      expect(r.summary.exportedAt).toBe(backup.exportadoEm);
      expect(r.summary.counts.lancamentos).toBe(2);
    }
    expect(await db.lancamentos.count()).toBe(antes);
  });

  it("backup da versão 1 é aceito, com paymentMethods zerado", async () => {
    const backup = await exportarBackup();
    const linhaV1 = { ...backup.dados.configuracao[0], hoje: "2026-01-01" };
    delete (linhaV1 as Record<string, unknown>).hojeManual;
    const dadosV1 = {
      ...backup.dados,
      configuracao: [linhaV1],
      paymentMethods: undefined,
    };
    const textoV1 = JSON.stringify({ ...backup, versao: 1, dados: dadosV1 });
    const r = await prepareImport(textoV1);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.summary.version).toBe(1);
      expect(r.summary.counts.paymentMethods).toBe(0);
    }
  });

  it("JSON malformado devolve ok: false", async () => {
    const r = await prepareImport("{isto não é json");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toBeTruthy();
  });

  it("estrutura inválida (sem lançamentos) devolve ok: false", async () => {
    const backup = await exportarBackup();
    const quebrado = { ...backup, dados: { ...backup.dados, lancamentos: undefined } };
    const r = await prepareImport(JSON.stringify(quebrado));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toBeTruthy();
  });
});
