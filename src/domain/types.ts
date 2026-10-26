export type CategoriaGrupo =
  | "Receita"
  | "Necessidade"
  | "Desejo"
  | "Poupança"
  | "Transferência";

export type CategoriaTipo = "Receita" | "Despesa" | "Poupança" | "Transferência";

export function tipoDoGrupo(grupo: CategoriaGrupo): CategoriaTipo {
  switch (grupo) {
    case "Receita":
      return "Receita";
    case "Necessidade":
    case "Desejo":
      return "Despesa";
    case "Poupança":
      return "Poupança";
    case "Transferência":
      return "Transferência";
  }
}

export type TipoConta =
  | "Corrente"
  | "Poupança"
  | "Carteira"
  | "Investimentos"
  | "Dinheiro"
  | "Outro";

export type FormaPagamento = string;

export type StatusLancamento = "Pago" | "Pendente";

export type PerfilReserva =
  | "CLT"
  | "Servidor público"
  | "Autônomo/MEI/PJ"
  | "Empresário ou renda variável"
  | "Personalizado";

export type AtalhoOrcamento =
  | "50/30/20"
  | "60/30/10"
  | "70/20/10"
  | "50/20/30"
  | "40/30/30"
  | "Personalizado";

export type ClasseInvestimento =
  | "Renda fixa"
  | "Ações"
  | "FIIs"
  | "ETFs"
  | "BDRs"
  | "Cripto"
  | "Exterior"
  | "Outros";

export type CicloAssinatura = "Mensal" | "Anual";
