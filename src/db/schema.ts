import type Dexie from "dexie";
import { FORMAS_PAGAMENTO_PADRAO } from "../config/padroes";

/**
 * Definição das versões do banco Dexie (C2), usada pelo singleton `db` e pelos testes.
 * Versão 1: esquema original. Versão 2: remove `hoje` da configuração (vira `hojeManual`)
 * e cria `paymentMethods`, preenchida com as 8 formas padrão quando vazia.
 * Versão 3 (SPEC 4): adiciona tabela `quotes` para cache de cotações em tempo real.
 * Versão 4 (SPEC 5.1): adiciona campo `quantidade` à tabela `ativos`.
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

  instance.version(3).stores({
    quotes: "ticker",
  });

  instance
    .version(4)
    .stores({
      ativos: "++id, nome, classe, quantidade",
    })
    .upgrade(async (tx) => {
      await tx.table("ativos").toCollection().modify((ativo: Record<string, unknown>) => {
        // Para ativos existentes sem quantidade, calcular baseado no totalAportado/valorAtual
        // Se totalAportado > 0 e valorAtual > 0, assumir preço médio = valorAtual
        // e quantidade = totalAportado / precoMedio. Mas como não temos o preço de compra original,
        // usamos 1 como fallback para evitar divisão por zero.
        if (ativo.quantidade === undefined || ativo.quantidade === null) {
          ativo.quantidade = 1;
        }
      });
    });
}
