import { describe, it, expect, beforeEach } from "vitest";
import { importarBackup } from "./backup";
import { db } from "./db";

/** §8 caso 12: importação de JSON inválido é rejeitada sem alterar os dados. */
describe("backup — importação validada com zod (§8 caso 12)", () => {
  beforeEach(async () => {
    await db.open();
    await Promise.all(
      db.tables.map((t) => t.clear()),
    );
    await db.configuracao.add({
      id: 1,
      nomeUsuario: "Teste",
      anoInicial: 2026,
      rendimentoAa: 10,
      inflacaoAa: 4,
      rendimentoMensalEq: 0.797,
      hoje: "2026-10-17",
      limiteDestaque: 500_00,
      perfilReserva: "CLT",
      atalhoOrcamento: "50/30/20",
      atalhoPersonalizado: { necessidades: 50, desejos: 30, poupanca: 20 },
    });
    await db.lancamentos.add({
      id: 1,
      data: "2026-10-05",
      descricao: "Salário",
      categoriaId: null,
      valor: 300_000,
      contaId: null,
      formaPagamento: "Pix",
      cartaoId: null,
      parcela: null,
      status: "Pago",
      contaDestinoId: null,
      observacao: "",
    });
  });

  it("JSON malformado → erro, dados preservados", async () => {
    const r = await importarBackup("{isto não é json");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.erro).toContain("JSON");
    expect(await db.configuracao.count()).toBe(1);
    expect(await db.lancamentos.count()).toBe(1);
  });

  it("estrutura inválida (valor em float) → erro, dados preservados", async () => {
    const r = await importarBackup(
      JSON.stringify({
        versao: 1,
        exportadoEm: "2026-10-17T00:00:00.000Z",
        dados: {
          configuracao: [],
          categorias: [],
          contas: [],
          cartoes: [],
          lancamentos: [
            {
              id: 1,
              data: "2026-10-05",
              descricao: "X",
              categoriaId: null,
              valor: 99.99, // proibido: não é inteiro em centavos
              contaId: null,
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
      }),
    );
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.erro).toContain("inválida");
    expect(await db.lancamentos.count()).toBe(1);
    const lanc = await db.lancamentos.get(1);
    expect(lanc?.valor).toBe(300_000); // dado original intacto
  });

  it("backup válido → importa e substitui os dados", async () => {
    const backup = {
      versao: 1,
      exportadoEm: "2026-10-17T00:00:00.000Z",
      dados: {
        configuracao: [],
        categorias: [],
        contas: [],
        cartoes: [],
        lancamentos: [
          {
            id: 5,
            data: "2026-10-10",
            descricao: "Novo",
            categoriaId: null,
            valor: 1_000,
            contaId: null,
            formaPagamento: "Pix",
            cartaoId: null,
            parcela: null,
            status: "Pendente",
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
    const r = await importarBackup(JSON.stringify(backup));
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.contagens.lancamentos).toBe(1);
    const lanc = await db.lancamentos.toArray();
    expect(lanc.length).toBe(1);
    expect(lanc[0]?.descricao).toBe("Novo");
    expect(lanc[0]?.valor).toBe(1_000);
    expect(await db.configuracao.count()).toBe(0); // antigos substituídos
  });
});
