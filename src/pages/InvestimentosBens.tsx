import { formatarBRL } from "../domain/dinheiro";
import { rotuloMesKey } from "../domain/datas";
import type { BemPassivo, HistoricoPatrimonio } from "../domain/models";

interface Props {
  bens: BemPassivo[];
  novoBem: { nome: string; valor: string };
  setNovoBem: (b: { nome: string; valor: string }) => void;
  registrarBem: () => void;
  excluirBem: (id: number) => void;
  historico: HistoricoPatrimonio[];
  serie: { mesKey: number; patrimonio: number }[];
  registrarMesHistorico: () => void;
  excluirHistorico: (id: number) => void;
}

/** Bens e passivos + histórico mensal do patrimônio (parte da tela Investimentos). */
export function InvestimentosBens({
  bens,
  novoBem,
  setNovoBem,
  registrarBem,
  excluirBem,
  historico,
  serie,
  registrarMesHistorico,
  excluirHistorico,
}: Props) {
  return (
    <>
      {/* Bens e passivos */}
      <div className="cartao p-4 mb-4">
        <h2 className="font-semibold text-sm mb-3">Bens e outros passivos</h2>
        <div className="flex items-end gap-3 flex-wrap mb-3">
          <div>
            <label className="rotulo" htmlFor="bem-nome">Nome</label>
            <input id="bem-nome" className="entrada" value={novoBem.nome} onChange={(e) => setNovoBem({ ...novoBem, nome: e.target.value })} />
          </div>
          <div>
            <label className="rotulo" htmlFor="bem-valor">Valor (R$; negativo = passivo)</label>
            <input id="bem-valor" className="entrada num" inputMode="decimal" value={novoBem.valor} onChange={(e) => setNovoBem({ ...novoBem, valor: e.target.value })} placeholder="0,00" />
          </div>
          <button type="button" className="botao botao-primario" onClick={() => void registrarBem()}>Adicionar</button>
        </div>
        {bens.length > 0 && (
          <table className="w-full text-sm">
            <tbody>
              {bens.map((b) => (
                <tr key={b.id} className="border-b last:border-0">
                  <td className="py-1.5 px-3">{b.nome}</td>
                  <td className="py-1.5 px-3 text-right num" style={{ color: b.valor > 0 ? "var(--cor-verde)" : "var(--cor-rosa)" }}>
                    {formatarBRL(b.valor)}
                  </td>
                  <td className="py-1.5 px-3 text-right">
                    <button type="button" className="botao botao-secundario text-xs" onClick={() => void excluirBem(b.id)}>Excluir</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Histórico mensal */}
      <div className="cartao p-4">
        <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
          <h2 className="font-semibold text-sm">Histórico mensal do patrimônio</h2>
          <button type="button" className="botao botao-secundario" onClick={() => void registrarMesHistorico()}>
            Registrar mês atual
          </button>
        </div>
        {historico.length === 0 ? (
          <p className="text-sm text-[var(--cor-texto-suave)]">
            Sem registros. Clique em "Registrar mês atual" para guardar ativos, passivos e PL deste mês.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-[var(--cor-texto-suave)] border-b">
                <th className="py-2 px-3">Mês</th>
                <th className="py-2 px-3 text-right">Ativos</th>
                <th className="py-2 px-3 text-right">Passivos</th>
                <th className="py-2 px-3 text-right">PL</th>
                <th className="py-2 px-3 text-right">Variação no mês</th>
                <th className="py-2 px-3" />
              </tr>
            </thead>
            <tbody>
              {serie
                .map((p) => {
                  const h = historico.find((x) => x.mesKey === p.mesKey);
                  return { p, h };
                })
                .filter(({ h }) => h !== undefined)
                .map(({ p, h }, idx, lista) => {
                  const anterior = idx > 0 ? lista[idx - 1].p.patrimonio : null;
                  const variacao = anterior === null ? null : p.patrimonio - anterior;
                  return (
                    <tr key={h!.id} className="border-b last:border-0">
                      <td className="py-1.5 px-3">{rotuloMesKey(p.mesKey)}</td>
                      <td className="py-1.5 px-3 text-right num">{formatarBRL(h!.ativos)}</td>
                      <td className="py-1.5 px-3 text-right num">{formatarBRL(h!.passivos)}</td>
                      <td className="py-1.5 px-3 text-right num">{formatarBRL(p.patrimonio)}</td>
                      <td className="py-1.5 px-3 text-right num" style={{ color: variacao === null ? undefined : variacao >= 0 ? "var(--cor-verde)" : "var(--cor-rosa)" }}>
                        {variacao === null ? "—" : formatarBRL(variacao)}
                      </td>
                      <td className="py-1.5 px-3 text-right">
                        <button type="button" className="botao botao-secundario text-xs" onClick={() => void excluirHistorico(h!.id)}>Excluir</button>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
