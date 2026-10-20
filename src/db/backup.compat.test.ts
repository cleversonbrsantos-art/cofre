import { describe, it, expect, beforeEach } from "vitest";
import { exportarBackup, importarBackup } from "./backup";
import { db } from "./db";
import type { Configuracao } from "../domain/models";

const configVazia: Configuracao = {
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

const tabelasVazias = {
  categorias: [],
  contas: [],
  cartoes: [],
  lancamentos: [],
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
};

describe("backup — compatibilidade de versões (C2)", () => {
  beforeEach(async () => {
    await db.open();
    await Promise.all(db.tables.map((t) => t.clear()));
  });

  it("importar backup versão 1 com 'hoje' funciona e resulta em hojeManual: null", async () => {
    const backup = {
      versao: 1,
      exportadoEm: "2026-09-01T12:00:00.000Z",
      dados: {
        configuracao: [{ ...configVazia, hoje: "2026-08-15" }],
        ...tabelasVazias,
      },
    };
    const r = await importarBackup(JSON.stringify(backup));
    expect(r.ok).toBe(true);

    const cfg = await db.configuracao.get(1);
    expect(cfg).toBeDefined();
    expect(cfg?.hojeManual).toBe(null);
    expect("hoje" in (cfg ?? {})).toBe(false);
  });

  it("exportar gera versão 2 com hojeManual e sem 'hoje'", async () => {
    await db.configuracao.put(configVazia);
    const b = await exportarBackup();
    expect(b.versao).toBe(2);
    expect(b.dados.configuracao).toHaveLength(1);
    expect(b.dados.configuracao[0]?.hojeManual).toBe(null);
    expect("hoje" in (b.dados.configuracao[0] ?? {})).toBe(false);
  });

  it("exportação inclui paymentMethods", async () => {
    await db.configuracao.put(configVazia);
    const b = await exportarBackup();
    expect(Array.isArray(b.dados.paymentMethods)).toBe(true);
  });
});
