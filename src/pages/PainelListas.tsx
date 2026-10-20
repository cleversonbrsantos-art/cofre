import { formatarBRL } from "../domain/dinheiro";
import { formatarData } from "../domain/datas";
import type { ContaPagar, Lancamento } from "../domain/models";

interface Props {
  proximosVencimentos: ContaPagar[];
  maioresGastos: { lancamento: Lancamento }[];
}

/** Listas laterais do Painel: próximos vencimentos e maiores gastos do mês. */
export function PainelListas({ proximosVencimentos, maioresGastos }: Props) {
  return (
    <div className="grid md:grid-cols-2 gap-4">
      <div className="cartao p-4">
        <h2 className="font-semibold text-sm mb-3">Próximos vencimentos</h2>
        {proximosVencimentos.length === 0 ? (
          <p className="text-sm text-[var(--cor-texto-suave)]">Nenhuma conta aberta a vencer.</p>
        ) : (
          <ul className="text-sm">
            {proximosVencimentos.map((c) => (
              <li key={c.id} className="flex justify-between py-1 border-b last:border-0">
                <span>
                  {c.descricao} — {formatarData(c.vencimento)}
                </span>
                <span className="num">{formatarBRL(c.valor)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="cartao p-4">
        <h2 className="font-semibold text-sm mb-3">Maiores gastos do mês</h2>
        {maioresGastos.length === 0 ? (
          <p className="text-sm text-[var(--cor-texto-suave)]">Sem gastos no mês.</p>
        ) : (
          <ul className="text-sm">
            {maioresGastos.slice(0, 5).map(({ lancamento }) => (
              <li key={lancamento.id} className="flex justify-between py-1 border-b last:border-0">
                <span>
                  {lancamento.descricao} — {formatarData(lancamento.data)}
                </span>
                <span className="num">{formatarBRL(lancamento.valor)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
