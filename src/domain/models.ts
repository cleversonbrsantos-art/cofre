import type {
  AtalhoOrcamento,
  CategoriaGrupo,
  CicloAssinatura,
  ClasseInvestimento,
  FormaPagamento,
  PerfilReserva,
  StatusLancamento,
  TipoConta,
} from "./types";

export type {
  AtalhoOrcamento,
  CategoriaGrupo,
  CicloAssinatura,
  ClasseInvestimento,
  FormaPagamento,
  PerfilReserva,
  StatusLancamento,
  TipoConta,
} from "./types";

export interface Configuracao {
  id: number;
  nomeUsuario: string;
  anoInicial: number;
  rendimentoAa: number; // % a.a., ex.: 10.5
  inflacaoAa: number; // % a.a.
  rendimentoMensalEq: number; // calculado: (1+aa)^(1/12)-1, em %
  hojeManual: string | null; // "data simulada" ISO YYYY-MM-DD; null = usar a data de hoje
  limiteDestaque: number; // centavos
  perfilReserva: PerfilReserva;
  atalhoOrcamento: AtalhoOrcamento;
  atalhoPersonalizado: { necessidades: number; desejos: number; poupanca: number };
}

export interface PaymentMethod {
  id: number;
  name: string;
}

export interface Categoria {
  id: number;
  nome: string;
  grupo: CategoriaGrupo;
}

export interface Conta {
  id: number;
  nome: string;
  tipo: TipoConta;
  saldoInicial: number; // centavos
  saldoExtrato: number | null; // centavos, opcional
}

export interface Cartao {
  id: number;
  nome: string;
  limite: number; // centavos
  diaFechamento: number; // 1-28
  diaVencimento: number; // 1-28
}

export interface Lancamento {
  id: number;
  data: string; // ISO
  descricao: string;
  categoriaId: number | null; // null = Sem categoria
  valor: number; // centavos, sempre positivo
  contaId: number | null; // null quando cartão preenchido
  formaPagamento: FormaPagamento;
  cartaoId: number | null;
  parcela: string | null; // "x/y" informativo
  status: StatusLancamento;
  contaDestinoId: number | null;
  observacao: string;
}

export interface CompraParcelada {
  id: number;
  descricao: string;
  cartaoId: number;
  categoriaId: number | null;
  dataCompra: string; // ISO
  valorTotal: number; // centavos
  numeroParcelas: number;
}

export interface OrcamentoPlano {
  id: number;
  mesKey: number; // AAAAMM
  categoriaId: number;
  valor: number; // centavos
}

export interface OrcamentoConfig {
  id: number; // 1 único registro
  mesKey: number;
  rendaReferencia: number; // centavos
  atalho: AtalhoOrcamento;
  usarSugestoes: boolean;
}

export interface Meta {
  id: number;
  nome: string;
  valorAlvo: number; // centavos
  prazo: string | null; // ISO, opcional
  jaGuardado: number; // centavos
  aporteMensal: number; // centavos
  rendimentoAa: number | null; // % a.a., opcional
}

export interface ReservaConfig {
  id: number; // 1 único registro
  perfil: PerfilReserva;
  mesesAjustados: number | null;
  contaId: number | null;
  gastoEssencialManual: number | null; // centavos
  aporteMensal: number; // centavos
}

export interface Divida {
  id: number;
  nome: string;
  saldoDevedor: number; // centavos
  jurosMes: number; // % a.m.
  parcelaMinima: number; // centavos
}

export interface AtivoInvestimento {
  id: number;
  nome: string;
  classe: ClasseInvestimento;
  totalAportado: number; // centavos
  valorAtual: number; // centavos
}

export interface AlvoAlocacao {
  id: number;
  classe: ClasseInvestimento;
  percentual: number; // 0-100
}

export interface BemPassivo {
  id: number;
  nome: string;
  valor: number; // centavos (positivo = bem, negativo = passivo)
}

export interface HistoricoPatrimonio {
  id: number;
  mesKey: number; // AAAAMM
  ativos: number; // centavos
  passivos: number; // centavos
}

export interface ContaPagar {
  id: number;
  descricao: string;
  vencimento: string; // ISO
  valor: number; // centavos
  categoriaId: number | null;
  status: "" | "Paga";
  formaPagamento: FormaPagamento;
}

export interface Assinatura {
  id: number;
  servico: string;
  valor: number; // centavos
  ciclo: CicloAssinatura;
  proximaRenovacao: string; // ISO
  categoriaId: number | null;
}

export interface Recorrente {
  id: number;
  descricao: string;
  categoriaId: number | null;
  valorMensal: number; // centavos
  diaMes: number; // 1-31
  inicio: string | null; // ISO, opcional
  fim: string | null; // ISO, opcional
}
