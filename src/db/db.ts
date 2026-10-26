import Dexie, { type EntityTable } from "dexie";
import type {
  AlvoAlocacao,
  Assinatura,
  AtivoInvestimento,
  BemPassivo,
  Cartao,
  CompraParcelada,
  Configuracao,
  Conta,
  ContaPagar,
  Divida,
  HistoricoPatrimonio,
  Lancamento,
  Meta,
  OrcamentoConfig,
  OrcamentoPlano,
  PaymentMethod,
  Quote,
  Recorrente,
  ReservaConfig,
} from "../domain/models";
import { CATEGORIAS_PADRAO, CONTAS_PADRAO, FORMAS_PAGAMENTO_PADRAO } from "../config/padroes";
import type { Categoria } from "../domain/models";
import { defineSchema } from "./schema";

/** Linha de configuração no banco: linhas da versão 1 podiam guardar o campo legado `hoje`
 * (ignorado pelo app) e não têm `hojeManual`; o app normaliza com `?? null` ao ler. */
export type ConfiguracaoRow = Omit<Configuracao, "hojeManual"> & {
  hojeManual?: string | null;
  hoje?: string;
};

export interface Tabelas {
  configuracao: EntityTable<ConfiguracaoRow, "id">;
  categorias: EntityTable<Categoria, "id">;
  contas: EntityTable<Conta, "id">;
  cartoes: EntityTable<Cartao, "id">;
  lancamentos: EntityTable<Lancamento, "id">;
  parceladas: EntityTable<CompraParcelada, "id">;
  orcamentoPlanos: EntityTable<OrcamentoPlano, "id">;
  orcamentoConfig: EntityTable<OrcamentoConfig, "id">;
  metas: EntityTable<Meta, "id">;
  reservaConfig: EntityTable<ReservaConfig, "id">;
  dividas: EntityTable<Divida, "id">;
  ativos: EntityTable<AtivoInvestimento, "id">;
  alvos: EntityTable<AlvoAlocacao, "id">;
  bensPassivos: EntityTable<BemPassivo, "id">;
  patrimonioHistorico: EntityTable<HistoricoPatrimonio, "id">;
  contasPagar: EntityTable<ContaPagar, "id">;
  assinaturas: EntityTable<Assinatura, "id">;
  recorrentes: EntityTable<Recorrente, "id">;
  paymentMethods: EntityTable<PaymentMethod, "id">;
  quotes: EntityTable<Quote, "ticker">;
}

export const db = new Dexie("cofre") as Dexie & Tabelas;

defineSchema(db);

/** Cria configuração, categorias, contas e formas de pagamento padrão se o banco estiver vazio. */
export async function inicializarBanco(): Promise<void> {
  const configExiste = await db.configuracao.get(1);
  if (!configExiste) {
    await db.configuracao.put({
      id: 1,
      nomeUsuario: "",
      anoInicial: new Date().getFullYear(),
      rendimentoAa: 10.5,
      inflacaoAa: 4.5,
      rendimentoMensalEq: (Math.pow(1.105, 1 / 12) - 1) * 100,
      hojeManual: null,
      limiteDestaque: 100000,
      perfilReserva: "CLT",
      atalhoOrcamento: "50/30/20",
      atalhoPersonalizado: { necessidades: 50, desejos: 30, poupanca: 20 },
    });
  }
  const cats = await db.categorias.count();
  if (cats === 0) {
    const ids = await db.categorias.bulkAdd(
      CATEGORIAS_PADRAO.map((c) => ({ nome: c.nome, grupo: c.grupo })),
      { allKeys: true },
    );
    void ids;
  }
  const contas = await db.contas.count();
  if (contas === 0) {
    await db.contas.bulkAdd(CONTAS_PADRAO.map((c) => ({ ...c, saldoExtrato: null })));
  }
  const formas = await db.paymentMethods.count();
  if (formas === 0) {
    await db.paymentMethods.bulkAdd(FORMAS_PAGAMENTO_PADRAO.map((name) => ({ name })));
  }
  // Linha única da reserva (Bug 1, SPEC 3): sem ela, Painel e Reserva ficam
  // presos em "Carregando..." porque get(1) em tabela vazia resolve undefined.
  const reserva = await db.reservaConfig.get(1);
  if (!reserva) {
    await db.reservaConfig.put({
      id: 1,
      perfil: "CLT",
      mesesAjustados: null,
      contaId: null,
      gastoEssencialManual: null,
      aporteMensal: 0,
    });
  }
  // Linha única do orçamento (SPEC 3.2): sem ela, a tela de Orçamento fica
  // presa em "Carregando..." porque get(1) em tabela vazia resolve undefined.
  const orcConfig = await db.orcamentoConfig.get(1);
  if (!orcConfig) {
    const hoje = new Date();
    const mesKeyAtual = hoje.getFullYear() * 100 + (hoje.getMonth() + 1);
    await db.orcamentoConfig.put({
      id: 1,
      mesKey: mesKeyAtual,
      rendaReferencia: 0,
      atalho: "50/30/20",
      usarSugestoes: false,
    });
  }
}
