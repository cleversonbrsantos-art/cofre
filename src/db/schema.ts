import type Dexie from "dexie";
import { FORMAS_PAGAMENTO_PADRAO } from "../config/padroes";

/**
 * Definição das versões do banco Dexie (C2), usada pelo singleton `db` e pelos testes.
 * Versão 1: esquema original. Versão 2: remove `hoje` da configuração (vira `hojeManual`)
 * e cria `paymentMethods`, preenchida com as 8 formas padrão quando vazia.
 */
export function defineSchema(instance: Dexie): void {
  instance.version(1).stores({
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
  });

  instance
    .version(2)
    .stores({
      paymentMethods: "++id, name",
    })
    .upgrade(async (tx) => {
      await tx
        .table("configuracao")
        .toCollection()
        .modify((linha: Record<string, unknown>) => {
          linha.hojeManual = null;
          delete linha.hoje;
        });
      const total = await tx.table("paymentMethods").count();
      if (total === 0) {
        await tx
          .table("paymentMethods")
          .bulkAdd(FORMAS_PAGAMENTO_PADRAO.map((name) => ({ name })));
      }
    });
}
