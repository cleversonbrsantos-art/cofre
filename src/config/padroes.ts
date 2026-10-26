import type {
  AtalhoOrcamento,
  Categoria,
  ClasseInvestimento,
  Conta,
  FormaPagamento,
  PerfilReserva,
} from "../domain/models";
import type { CategoriaGrupo } from "../domain/types";

export const CATEGORIAS_PADRAO: { nome: string; grupo: CategoriaGrupo }[] = [
  // Receita
  { nome: "Salário", grupo: "Receita" },
  { nome: "13º e férias", grupo: "Receita" },
  { nome: "Renda extra e freelance", grupo: "Receita" },
  { nome: "Rendimentos de investimentos", grupo: "Receita" },
  { nome: "Reembolsos", grupo: "Receita" },
  { nome: "Outras receitas", grupo: "Receita" },
  // Necessidade
  { nome: "Moradia (aluguel ou financiamento)", grupo: "Necessidade" },
  { nome: "Condomínio e IPTU", grupo: "Necessidade" },
  { nome: "Contas da casa (luz, água, gás)", grupo: "Necessidade" },
  { nome: "Internet e celular", grupo: "Necessidade" },
  { nome: "Mercado", grupo: "Necessidade" },
  { nome: "Transporte", grupo: "Necessidade" },
  { nome: "Saúde e farmácia", grupo: "Necessidade" },
  { nome: "Educação", grupo: "Necessidade" },
  { nome: "Seguros", grupo: "Necessidade" },
  { nome: "Impostos e taxas", grupo: "Necessidade" },
  { nome: "Dívidas e parcelas", grupo: "Necessidade" },
  { nome: "Filhos e família", grupo: "Necessidade" },
  { nome: "Pets", grupo: "Necessidade" },
  // Desejo
  { nome: "Restaurantes e delivery", grupo: "Desejo" },
  { nome: "Lazer e entretenimento", grupo: "Desejo" },
  { nome: "Viagens", grupo: "Desejo" },
  { nome: "Assinaturas e streaming", grupo: "Desejo" },
  { nome: "Compras pessoais", grupo: "Desejo" },
  { nome: "Beleza e cuidados", grupo: "Desejo" },
  { nome: "Presentes e doações", grupo: "Desejo" },
  { nome: "Outros gastos", grupo: "Desejo" },
  // Poupança
  { nome: "Reserva de emergência", grupo: "Poupança" },
  { nome: "Investimentos", grupo: "Poupança" },
  { nome: "Metas e sonhos", grupo: "Poupança" },
  { nome: "Aposentadoria", grupo: "Poupança" },
  // Transferência
  { nome: "Transferência entre contas", grupo: "Transferência" },
  { nome: "Pagamento de fatura", grupo: "Transferência" },
];

export const FORMAS_PAGAMENTO_PADRAO: FormaPagamento[] = [
  "Pix",
  "Débito",
  "Crédito",
  "Dinheiro",
  "Boleto",
  "Transferência",
  "Débito automático",
  "Outro",
];

export const CONTAS_PADRAO: { nome: string; tipo: Conta["tipo"]; saldoInicial: number }[] = [
  { nome: "Conta corrente", tipo: "Corrente", saldoInicial: 0 },
  { nome: "Poupança", tipo: "Poupança", saldoInicial: 0 },
  { nome: "Carteira", tipo: "Carteira", saldoInicial: 0 },
  { nome: "Corretora", tipo: "Investimentos", saldoInicial: 0 },
];

export const PERFIS_RESERVA_PADRAO: { perfil: PerfilReserva; meses: number }[] = [
  { perfil: "CLT", meses: 6 },
  { perfil: "Servidor público", meses: 3 },
  { perfil: "Autônomo/MEI/PJ", meses: 12 },
  { perfil: "Empresário ou renda variável", meses: 12 },
  { perfil: "Personalizado", meses: 6 },
];

export const ATALHOS_ORCAMENTO: Record<
  AtalhoOrcamento,
  { necessidades: number; desejos: number; poupanca: number }
> = {
  "50/30/20": { necessidades: 50, desejos: 30, poupanca: 20 },
  "60/30/10": { necessidades: 60, desejos: 30, poupanca: 10 },
  "70/20/10": { necessidades: 70, desejos: 20, poupanca: 10 },
  "50/20/30": { necessidades: 50, desejos: 20, poupanca: 30 },
  "40/30/30": { necessidades: 40, desejos: 30, poupanca: 30 },
  Personalizado: { necessidades: 50, desejos: 30, poupanca: 20 },
};

export const CLASSES_INVESTIMENTO: ClasseInvestimento[] = [
  "Renda fixa",
  "Ações",
  "FIIs",
  "ETFs",
  "BDRs",
  "Cripto",
  "Exterior",
  "Outros",
];

export function categoriasFabrica(): Omit<Categoria, "id">[] {
  return CATEGORIAS_PADRAO.map((c) => ({ nome: c.nome, grupo: c.grupo }));
}

export function contasFabrica(): Omit<Conta, "id">[] {
  return CONTAS_PADRAO.map((c) => ({ ...c, saldoExtrato: null }));
}
