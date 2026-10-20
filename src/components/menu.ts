export interface ItemMenu {
  rota: string;
  rotulo: string;
  curto: string;
}

export const ITENS_MENU: ItemMenu[] = [
  { rota: "/inicio", rotulo: "Início", curto: "Início" },
  { rota: "/painel", rotulo: "Painel", curto: "Painel" },
  { rota: "/lancamentos", rotulo: "Lançamentos", curto: "Lanç." },
  { rota: "/contas", rotulo: "Contas", curto: "Contas" },
  { rota: "/cartoes", rotulo: "Cartões", curto: "Cartões" },
  { rota: "/parcelados", rotulo: "Parcelados", curto: "Parcel." },
  { rota: "/orcamento", rotulo: "Orçamento", curto: "Orçam." },
  { rota: "/fluxo", rotulo: "Fluxo anual", curto: "Fluxo" },
  { rota: "/dia-a-dia", rotulo: "Dia a dia", curto: "Dia a dia" },
  { rota: "/recorrentes", rotulo: "Recorrentes", curto: "Recur." },
  { rota: "/metas", rotulo: "Metas", curto: "Metas" },
  { rota: "/reserva", rotulo: "Reserva", curto: "Reserva" },
  { rota: "/dividas", rotulo: "Dívidas", curto: "Dív." },
  { rota: "/investimentos", rotulo: "Investimentos", curto: "Inv." },
  { rota: "/contas-a-pagar", rotulo: "Contas a pagar", curto: "A pagar" },
  { rota: "/assinaturas", rotulo: "Assinaturas", curto: "Assin." },
  { rota: "/simuladores", rotulo: "Simuladores", curto: "Simul." },
  { rota: "/configuracoes", rotulo: "Configurações", curto: "Config." },
  { rota: "/sobre", rotulo: "Sobre", curto: "Sobre" },
];
