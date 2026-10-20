import { z } from "zod";

/** Schema zod do backup completo (importação validada, §7). */
const centavos = z.number().int();

const enumPerfil = z.enum([
  "CLT",
  "Servidor público",
  "Autônomo/MEI/PJ",
  "Empresário ou renda variável",
  "Personalizado",
]);
const enumGrupo = z.enum([
  "Receita",
  "Necessidade",
  "Desejo",
  "Poupança",
  "Transferência",
]);
const enumTipoConta = z.enum([
  "Corrente",
  "Poupança",
  "Carteira",
  "Investimentos",
  "Dinheiro",
  "Outro",
]);
const enumStatus = z.enum(["Pago", "Pendente"]);
const enumCiclo = z.enum(["Mensal", "Anual"]);
const enumAtalho = z.enum([
  "50/30/20",
  "60/30/10",
  "70/20/10",
  "50/20/30",
  "40/30/30",
  "Personalizado",
]);
const enumForma = z.string().min(1);
const enumClasse = z.enum([
  "Renda fixa",
  "Ações",
  "FIIs",
  "Cripto",
  "Exterior",
  "Outros",
]);

const schemaConfigBackup = z
  .object({
    id: z.number(),
    nomeUsuario: z.string(),
    anoInicial: z.number(),
    rendimentoAa: z.number(),
    inflacaoAa: z.number(),
    rendimentoMensalEq: z.number(),
    // v1 guardava "hoje" (ignorado na importação); v2 guarda "hojeManual" (data simulada)
    hoje: z.string().optional(),
    hojeManual: z.string().nullable().optional(),
    limiteDestaque: centavos,
    perfilReserva: enumPerfil,
    atalhoOrcamento: enumAtalho,
    atalhoPersonalizado: z.object({
      necessidades: z.number(),
      desejos: z.number(),
      poupanca: z.number(),
    }),
  })
  .transform((c) => ({
    id: c.id,
    nomeUsuario: c.nomeUsuario,
    anoInicial: c.anoInicial,
    rendimentoAa: c.rendimentoAa,
    inflacaoAa: c.inflacaoAa,
    rendimentoMensalEq: c.rendimentoMensalEq,
    hojeManual: c.hojeManual ?? null,
    limiteDestaque: c.limiteDestaque,
    perfilReserva: c.perfilReserva,
    atalhoOrcamento: c.atalhoOrcamento,
    atalhoPersonalizado: c.atalhoPersonalizado,
  }));

const schemaBackup = z.object({
  versao: z.number(),
  exportadoEm: z.string(),
  dados: z.object({
    configuracao: z.array(schemaConfigBackup),
    paymentMethods: z
      .array(z.object({ id: z.number(), name: z.string().min(1) }))
      .optional(),
    categorias: z.array(
      z.object({ id: z.number(), nome: z.string(), grupo: enumGrupo }),
    ),
    contas: z.array(
      z.object({
        id: z.number(),
        nome: z.string(),
        tipo: enumTipoConta,
        saldoInicial: centavos,
        saldoExtrato: centavos.nullable(),
      }),
    ),
    cartoes: z.array(
      z.object({
        id: z.number(),
        nome: z.string(),
        limite: centavos,
        diaFechamento: z.number(),
        diaVencimento: z.number(),
      }),
    ),
    lancamentos: z.array(
      z.object({
        id: z.number(),
        data: z.string(),
        descricao: z.string(),
        categoriaId: z.number().nullable(),
        valor: centavos,
        contaId: z.number().nullable(),
        formaPagamento: enumForma,
        cartaoId: z.number().nullable(),
        parcela: z.string().nullable(),
        status: enumStatus,
        contaDestinoId: z.number().nullable(),
        observacao: z.string(),
      }),
    ),
    parceladas: z.array(
      z.object({
        id: z.number(),
        descricao: z.string(),
        cartaoId: z.number(),
        categoriaId: z.number().nullable(),
        dataCompra: z.string(),
        valorTotal: centavos,
        numeroParcelas: z.number().int().positive(),
      }),
    ),
    orcamentoPlanos: z.array(
      z.object({
        id: z.number(),
        mesKey: z.number(),
        categoriaId: z.number(),
        valor: centavos,
      }),
    ),
    orcamentoConfig: z.array(
      z.object({
        id: z.number(),
        mesKey: z.number(),
        rendaReferencia: centavos,
        atalho: enumAtalho,
        usarSugestoes: z.boolean(),
      }),
    ),
    metas: z.array(
      z.object({
        id: z.number(),
        nome: z.string(),
        valorAlvo: centavos,
        prazo: z.string().nullable(),
        jaGuardado: centavos,
        aporteMensal: centavos,
        rendimentoAa: z.number().nullable(),
      }),
    ),
    reservaConfig: z.array(
      z.object({
        id: z.number(),
        perfil: enumPerfil,
        mesesAjustados: z.number().nullable(),
        contaId: z.number().nullable(),
        gastoEssencialManual: centavos.nullable(),
        aporteMensal: centavos,
      }),
    ),
    dividas: z.array(
      z.object({
        id: z.number(),
        nome: z.string(),
        saldoDevedor: centavos,
        jurosMes: z.number(),
        parcelaMinima: centavos,
      }),
    ),
    ativos: z.array(
      z.object({
        id: z.number(),
        nome: z.string(),
        classe: enumClasse,
        totalAportado: centavos,
        valorAtual: centavos,
      }),
    ),
    alvos: z.array(
      z.object({ id: z.number(), classe: enumClasse, percentual: z.number() }),
    ),
    bensPassivos: z.array(
      z.object({ id: z.number(), nome: z.string(), valor: centavos }),
    ),
    patrimonioHistorico: z.array(
      z.object({ id: z.number(), mesKey: z.number(), ativos: centavos, passivos: centavos }),
    ),
    contasPagar: z.array(
      z.object({
        id: z.number(),
        descricao: z.string(),
        vencimento: z.string(),
        valor: centavos,
        categoriaId: z.number().nullable(),
        status: z.enum(["", "Paga"]),
        formaPagamento: enumForma,
      }),
    ),
    assinaturas: z.array(
      z.object({
        id: z.number(),
        servico: z.string(),
        valor: centavos,
        ciclo: enumCiclo,
        proximaRenovacao: z.string(),
        categoriaId: z.number().nullable(),
      }),
    ),
    recorrentes: z.array(
      z.object({
        id: z.number(),
        descricao: z.string(),
        categoriaId: z.number().nullable(),
        valorMensal: centavos,
        diaMes: z.number(),
        inicio: z.string().nullable(),
        fim: z.string().nullable(),
      }),
    ),
  }),
});

export { schemaBackup };
