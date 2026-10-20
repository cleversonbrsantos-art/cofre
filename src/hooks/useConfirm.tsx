import { useState } from "react";
import { ConfirmDialog } from "../components/ConfirmDialog";

export interface PedidoConfirmacao {
  titulo: string;
  mensagem: string;
  rotuloConfirmar?: string;
  onConfirmar: () => void;
}

export function useConfirm() {
  const [pedido, setPedido] = useState<PedidoConfirmacao | null>(null);

  const confirmar = (
    titulo: string,
    mensagem: string,
    onConfirmar: () => void,
    rotuloConfirmar?: string,
  ) => {
    setPedido({ titulo, mensagem, onConfirmar, rotuloConfirmar });
  };

  const dialogo = pedido ? (
    <ConfirmDialog
      titulo={pedido.titulo}
      mensagem={pedido.mensagem}
      rotuloConfirmar={pedido.rotuloConfirmar}
      onConfirmar={() => {
        const acao = pedido.onConfirmar;
        setPedido(null);
        acao();
      }}
      onFechar={() => setPedido(null)}
    />
  ) : null;

  return { confirmar, dialogo };
}
