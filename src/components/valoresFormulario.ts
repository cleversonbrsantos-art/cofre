import type { FormaPagamento } from "../domain/models";

export interface ValoresFormulario {
  data: string;
  descricao: string;
  categoriaId: number | null;
  valorCentavos: number | null;
  contaId: number | null;
  formaPagamento: FormaPagamento;
  cartaoId: number | null;
  parcela: string | null;
  status: "Pago" | "Pendente";
  contaDestinoId: number | null;
  observacao: string;
}

export function valoresIniciais(hoje: string): ValoresFormulario {
  return {
    data: hoje,
    descricao: "",
    categoriaId: null,
    valorCentavos: null,
    contaId: null,
    formaPagamento: "Pix",
    cartaoId: null,
    parcela: null,
    status: "Pago",
    contaDestinoId: null,
    observacao: "",
  };
}
