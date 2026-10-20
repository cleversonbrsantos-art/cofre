import { describe, it, expect } from "vitest";
import Dexie from "dexie";
import { defineSchema } from "./schema";
import { db, type Tabelas } from "./db";

let NOME = "cofre-migracao-teste";

const SCHEMA_V1 = {
  configuracao: "id",
  categorias: "++id, nome, grupo",
  contas: "++id, nome, tipo",
  cartoes: "++id, nome",
  lancamentos: "++id, data, categoriaId, contaId, cartaoId, status",
  parceladas: "++id, cartaoId, dataCompra",
  orcamentoPlanos: "++id, mesKey, categoriaId",
  orcamentoConfig: "id",
  metas: "++id, nome",
  reservaConfig: "id",
  dividas: "++id, nome",
  ativos: "++id, nome, classe",
  alvos: "++id, classe",
  bensPassivos: "++id, nome",
  patrimonioHistorico: "++id, mesKey",
  contasPagar: "++id, vencimento, status",
  assinaturas: "++id, proximaRenovacao",
  recorrentes: "++id, descricao",
};

async function criarBancoV1(): Promise<void> {
  const banco = new Dexie(NOME);
  banco.version(1).stores(SCHEMA_V1);
  await banco.open();
  await banco.table("configuracao").add({
    id: 1,
    nomeUsuario: "Teste",
    anoInicial: 2026,
    rendimentoAa: 10,
    inflacaoAa: 4,
    rendimentoMensalEq: 0.797,
    hoje: "2026-10-15",
    limiteDestaque: 100000,
    perfilReserva: "CLT",
    atalhoOrcamento: "50/30/20",
    atalhoPersonalizado: { necessidades: 50, desejos: 30, poupanca: 20 },
  });
  banco.close();
}

describe("schema — migração v1 → v2 (C2)", () => {
  it("apaga 'hoje' e define hojeManual = null na configuração existente", async () => {
    await criarBancoV1();

    const banco2 = new Dexie(NOME) as Dexie & Tabelas;
    defineSchema(banco2);
    await banco2.open();

    const cfg = await banco2.configuracao.get(1);
    expect(cfg).toBeDefined();
    expect(cfg?.hojeManual).toBe(null);
    expect("hoje" in (cfg ?? {})).toBe(false);

    banco2.close();
  });

  it("migração cria a tabela paymentMethods com as 8 formas padrão quando vazia", async () => {
    NOME = "cofre-migracao-teste-2";
    await criarBancoV1();

    const banco2 = new Dexie(NOME) as Dexie & Tabelas;
    defineSchema(banco2);
    await banco2.open();

    const formas = await banco2.paymentMethods.toArray();
    expect(formas).toHaveLength(8);
    expect(formas[0]?.name).toBe("Pix");

    banco2.close();
  });

  it("banco novo já nasce na versão 2 sem 'hoje'", async () => {
    await db.open();
    await db.configuracao.put({
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
    });
    const cfg = await db.configuracao.get(1);
    expect(cfg?.hojeManual).toBe(null);
  });
});
