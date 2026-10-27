import { formatarBRL } from "../../domain/dinheiro";
import { formatarData } from "../../domain/datas";
import type { DividendDetalhe } from "../../domain/dividends";

interface BadgeProps {
  status: "Pago" | "A Receber";
}

function Badge({ status }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
        status === "Pago"
          ? "bg-[var(--cor-verde)]/15 text-[var(--cor-verde)] border border-[var(--cor-verde)]/30"
          : "bg-[var(--cor-ambar)]/15 text-[var(--cor-ambar)] border border-[var(--cor-ambar)]/30"
      }`}
    >
      {status}
    </span>
  );
}

interface ProventosTableProps {
  detalhes: DividendDetalhe[];
}

export function ProventosTable({ detalhes }: ProventosTableProps) {
  return (
    <div className="cartao overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs text-[var(--cor-texto-suave)] border-b">
            <th className="py-2 px-3">Ativo</th>
            <th className="py-2 px-3">Tipo</th>
            <th className="py-2 px-3">Status</th>
            <th className="py-2 px-3">Data Com</th>
            <th className="py-2 px-3">Data Pagamento</th>
            <th className="py-2 px-3 text-right num">Qtd</th>
            <th className="py-2 px-3 text-right num">Valor por Cota</th>
            <th className="py-2 px-3 text-right num">Total</th>
          </tr>
        </thead>
        <tbody>
          {detalhes.length === 0 ? (
            <tr>
              <td colSpan={8} className="py-8 text-center text-[var(--cor-texto-suave)]">
                Nenhum provento encontrado para o filtro selecionado.
              </td>
            </tr>
          ) : (
            detalhes.map((d) => (
              <tr key={`${d.ativo}-${d.dataPagamento}-${d.valorPorCota}`} className="border-b last:border-0 hover:bg-[var(--cor-fundo-hover)]">
                <td className="py-2 px-3 font-medium">{d.ativo}</td>
                <td className="py-2 px-3 text-[var(--cor-texto-suave)]">{d.tipo}</td>
                <td className="py-2 px-3"><Badge status={d.status} /></td>
                <td className="py-2 px-3 num">{formatarData(d.dataCom)}</td>
                <td className="py-2 px-3 num">{formatarData(d.dataPagamento)}</td>
                <td className="py-2 px-3 text-right num">{d.quantidade.toLocaleString("pt-BR")}</td>
                <td className="py-2 px-3 text-right num">{formatarBRL(d.valorPorCota)}</td>
                <td className="py-2 px-3 text-right num font-medium">{formatarBRL(d.total)}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}