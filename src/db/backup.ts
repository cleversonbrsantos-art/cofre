import { schemaBackup } from "./backupSchema";
import type {
  AlvoAlocacao,
  Assinatura,
  AtivoInvestimento,
  BemPassivo,
  Cartao,
  Categoria,
  CompraParcelada,
  Conta,
  ContaPagar,
  Divida,
  HistoricoPatrimonio,
  Lancamento,
  Meta,
  OrcamentoConfig,
  OrcamentoPlano,
  PaymentMethod,
  Recorrente,
  ReservaConfig,
} from "../domain/models";
import { db, type ConfiguracaoRow } from "./db";
import { FORMAS_PAGAMENTO_PADRAO } from "../config/padroes";

export interface Backup {
  versao: number;
  exportadoEm: string;
  dados: {
    configuracao: ConfiguracaoRow[];
    paymentMethods?: PaymentMethod[];
    categorias: Categoria[];
    contas: Conta[];
    cartoes: Cartao[];
    lancamentos: Lancamento[];
    parceladas: CompraParcelada[];
    orcamentoPlanos: OrcamentoPlano[];
    orcamentoConfig: OrcamentoConfig[];
    metas: Meta[];
    reservaConfig: ReservaConfig[];
    dividas: Divida[];
    ativos: AtivoInvestimento[];
    alvos: AlvoAlocacao[];
    bensPassivos: BemPassivo[];
    patrimonioHistorico: HistoricoPatrimonio[];
    contasPagar: ContaPagar[];
    assinaturas: Assinatura[];
    recorrentes: Recorrente[];
  };
}

export async function exportarBackup(): Promise<Backup> {
  const dados = {
    configuracao: await db.configuracao.toArray(),
    paymentMethods: await db.paymentMethods.toArray(),
    categorias: await db.categorias.toArray(),
    contas: await db.contas.toArray(),
    cartoes: await db.cartoes.toArray(),
    lancamentos: await db.lancamentos.toArray(),
    parceladas: await db.parceladas.toArray(),
    orcamentoPlanos: await db.orcamentoPlanos.toArray(),
    orcamentoConfig: await db.orcamentoConfig.toArray(),
    metas: await db.metas.toArray(),
    reservaConfig: await db.reservaConfig.toArray(),
    dividas: await db.dividas.toArray(),
    ativos: await db.ativos.toArray(),
    alvos: await db.alvos.toArray(),
    bensPassivos: await db.bensPassivos.toArray(),
    patrimonioHistorico: await db.patrimonioHistorico.toArray(),
    contasPagar: await db.contasPagar.toArray(),
    assinaturas: await db.assinaturas.toArray(),
    recorrentes: await db.recorrentes.toArray(),
  };
  return { versao: 2, exportadoEm: new Date().toISOString(), dados };
}


export type ResultadoImportacao =
  | { ok: true; contagens: Record<string, number> }
  | { ok: false; erro: string };

export type ResumoImportacao = {
  version: number;
  exportedAt: string;
  counts: Record<string, number>;
};

export type ResultadoPreparo =
  | { ok: true; summary: ResumoImportacao }
  | { ok: false; error: string };

/** Valida um backup JSON sem gravar nada, devolvendo o resumo para pré-visualização (C4). */
export function prepareImport(texto: string): Promise<ResultadoPreparo> {
  return Promise.resolve(prepararImportacao(texto));
}

function prepararImportacao(texto: string): ResultadoPreparo {
  let bruto: unknown;
  try {
    bruto = JSON.parse(texto);
  } catch {
    return { ok: false, error: "O arquivo não é um JSON válido." };
  }
  const resultado = schemaBackup.safeParse(bruto);
  if (!resultado.success) {
    return { ok: false, error: "Estrutura do arquivo inválida: " + resultado.error.issues[0]?.path.join(".") };
  }
  const dados = resultado.data.dados;
  const counts: Record<string, number> = {
    configuracao: dados.configuracao.length,
    paymentMethods: dados.paymentMethods === undefined ? 0 : dados.paymentMethods.length,
    categorias: dados.categorias.length,
    contas: dados.contas.length,
    cartoes: dados.cartoes.length,
    lancamentos: dados.lancamentos.length,
    parceladas: dados.parceladas.length,
    orcamentoPlanos: dados.orcamentoPlanos.length,
    orcamentoConfig: dados.orcamentoConfig.length,
    metas: dados.metas.length,
    reservaConfig: dados.reservaConfig.length,
    dividas: dados.dividas.length,
    ativos: dados.ativos.length,
    alvos: dados.alvos.length,
    bensPassivos: dados.bensPassivos.length,
    patrimonioHistorico: dados.patrimonioHistorico.length,
    contasPagar: dados.contasPagar.length,
    assinaturas: dados.assinaturas.length,
    recorrentes: dados.recorrentes.length,
  };
  return {
    ok: true,
    summary: { version: resultado.data.versao, exportedAt: resultado.data.exportadoEm, counts },
  };
}

/** Valida e importa um backup JSON, sobrescrevendo os dados atuais. */
export async function importarBackup(texto: string): Promise<ResultadoImportacao> {
  let bruto: unknown;
  try {
    bruto = JSON.parse(texto);
  } catch {
    return { ok: false, erro: "O arquivo não é um JSON válido." };
  }
  const resultado = schemaBackup.safeParse(bruto);
  if (!resultado.success) {
    return { ok: false, erro: "Estrutura do arquivo inválida: " + resultado.error.issues[0]?.path.join(".") };
  }
  const dados = resultado.data.dados;
  await db.transaction(
    "rw",
    [
      db.configuracao,
      db.paymentMethods,
      db.categorias,
      db.contas,
      db.cartoes,
      db.lancamentos,
      db.parceladas,
      db.orcamentoPlanos,
      db.orcamentoConfig,
      db.metas,
      db.reservaConfig,
      db.dividas,
      db.ativos,
      db.alvos,
      db.bensPassivos,
      db.patrimonioHistorico,
      db.contasPagar,
      db.assinaturas,
      db.recorrentes,
    ],
    async () => {
      await Promise.all([
        db.configuracao.clear(),
        db.paymentMethods.clear(),
        db.categorias.clear(),
        db.contas.clear(),
        db.cartoes.clear(),
        db.lancamentos.clear(),
        db.parceladas.clear(),
        db.orcamentoPlanos.clear(),
        db.orcamentoConfig.clear(),
        db.metas.clear(),
        db.reservaConfig.clear(),
        db.dividas.clear(),
        db.ativos.clear(),
        db.alvos.clear(),
        db.bensPassivos.clear(),
        db.patrimonioHistorico.clear(),
        db.contasPagar.clear(),
        db.assinaturas.clear(),
        db.recorrentes.clear(),
      ]);
      await db.configuracao.bulkPut(dados.configuracao);
      if (dados.paymentMethods !== undefined) {
        await db.paymentMethods.bulkPut(dados.paymentMethods);
      } else {
        // backup antigo (v1) sem formas de pagamento: restaura as 8 padrão
        await db.paymentMethods.bulkAdd(FORMAS_PAGAMENTO_PADRAO.map((name) => ({ name })));
      }
      await db.categorias.bulkPut(dados.categorias);
      await db.contas.bulkPut(dados.contas);
      await db.cartoes.bulkPut(dados.cartoes);
      await db.lancamentos.bulkPut(dados.lancamentos);
      await db.parceladas.bulkPut(dados.parceladas);
      await db.orcamentoPlanos.bulkPut(dados.orcamentoPlanos);
      await db.orcamentoConfig.bulkPut(dados.orcamentoConfig);
      await db.metas.bulkPut(dados.metas);
      await db.reservaConfig.bulkPut(dados.reservaConfig);
      await db.dividas.bulkPut(dados.dividas);
      await db.ativos.bulkPut(dados.ativos);
      await db.alvos.bulkPut(dados.alvos);
      await db.bensPassivos.bulkPut(dados.bensPassivos);
      await db.patrimonioHistorico.bulkPut(dados.patrimonioHistorico);
      await db.contasPagar.bulkPut(dados.contasPagar);
      await db.assinaturas.bulkPut(dados.assinaturas);
      await db.recorrentes.bulkPut(dados.recorrentes);
    },
  );
  const contagens: Record<string, number> = {};
  for (const [k, v] of Object.entries(dados)) {
    contagens[k] = v.length;
  }
  return { ok: true, contagens };
}

/** Apaga todos os dados de todas as tabelas. */
export async function apagarTudo(): Promise<void> {
  await Promise.all([
    db.configuracao.clear(),
    db.paymentMethods.clear(),
    db.categorias.clear(),
    db.contas.clear(),
    db.cartoes.clear(),
    db.lancamentos.clear(),
    db.parceladas.clear(),
    db.orcamentoPlanos.clear(),
    db.orcamentoConfig.clear(),
    db.metas.clear(),
    db.reservaConfig.clear(),
    db.dividas.clear(),
    db.ativos.clear(),
    db.alvos.clear(),
    db.bensPassivos.clear(),
    db.patrimonioHistorico.clear(),
    db.contasPagar.clear(),
    db.assinaturas.clear(),
    db.recorrentes.clear(),
  ]);
}
