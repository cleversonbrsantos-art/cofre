import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../db/db";
import { Carregando, EstadoVazio } from "../components/PaginaVazia";
import { calcularReserva } from "../domain/reserva";
import { calcularSaldos } from "../domain/contas";
import { mesKeyDaFatura } from "../domain/cartoes";
import { avancarMesKey } from "../domain/datas";
import { formatarBRL, textoParaCentavos } from "../domain/dinheiro";
import { PERFIS_RESERVA_PADRAO } from "../config/padroes";
import type { Cartao, Categoria } from "../domain/models";

export function PaginaReserva() {
  const config = useLiveQuery(async () => await db.configuracao.get(1), []);
  const reservaConfig = useLiveQuery(async () => await db.reservaConfig.get(1), []);
  const lancamentos = useLiveQuery(async () => await db.lancamentos.toArray(), []);
  const categorias = useLiveQuery(async () => await db.categorias.toArray(), []);
  const parceladas = useLiveQuery(async () => await db.parceladas.toArray(), []);
  const cartoes = useLiveQuery(async () => await db.cartoes.toArray(), []);
  const contas = useLiveQuery(async () => await db.contas.toArray(), []);

  if (
    config === undefined ||
    reservaConfig === undefined ||
    lancamentos === undefined ||
    categorias === undefined ||
    parceladas === undefined ||
    cartoes === undefined ||
    contas === undefined
  ) {
    return <Carregando />;
  }

  const mapaCat = new Map<number, Categoria>(categorias.map((c) => [c.id, c]));

  const parcelasPorMes = new Map<number, number>();
  const cartaoDe = (id: number): Cartao | undefined => cartoes.find((c) => c.id === id);
  for (const p of parceladas) {
    const cartao = cartaoDe(p.cartaoId);
    const primeira = cartao
      ? mesKeyDaFatura(p.dataCompra, cartao)
      : Number(p.dataCompra.slice(0, 4) + p.dataCompra.slice(5, 7));
    const base = Math.floor(p.valorTotal / p.numeroParcelas);
    const diferenca = p.valorTotal - base * p.numeroParcelas;
    for (let j = 0; j < p.numeroParcelas; j++) {
      const mk = avancarMesKey(primeira, j);
      parcelasPorMes.set(mk, (parcelasPorMes.get(mk) ?? 0) + (j === 0 ? base + diferenca : base));
    }
  }

  const mesesDoPerfil = PERFIS_RESERVA_PADRAO.find((p) => p.perfil === reservaConfig.perfil)?.meses ?? 6;

  const saldos = calcularSaldos(contas, lancamentos, mapaCat);
  const guardadoAtual =
    reservaConfig.contaId === null
      ? saldos.filter((s) => s.conta.tipo === "Poupança").reduce((s, x) => s + x.saldoAtual, 0)
      : (saldos.find((s) => s.conta.id === reservaConfig.contaId)?.saldoAtual ?? 0);

  const resultado = calcularReserva(
    reservaConfig,
    mesesDoPerfil,
    lancamentos,
    mapaCat,
    parcelasPorMes,
    guardadoAtual,
  );

  const salvarConfig = async (mudancas: Partial<typeof reservaConfig>) => {
    await db.reservaConfig.put({ ...reservaConfig, ...mudancas });
  };

  const corSituacao =
    resultado.situacao === "Reserva completa"
      ? "var(--cor-verde)"
      : resultado.situacao === "Quase lá"
        ? "var(--cor-ambar)"
        : "var(--cor-rosa)";

  return (
    <section>
      <div className="mb-4">
        <h1 className="text-xl font-semibold">Reserva de emergência</h1>
        <p className="text-sm text-[var(--cor-texto-suave)]">
          Alvo: {resultado.mesesAlvo} meses de gastos essenciais (perfil {reservaConfig.perfil})
        </p>
      </div>

      {resultado.situacao === "Sem dados" ? (
        <EstadoVazio mensagem="Sem gastos essenciais registrados. Cadastre lançamentos nas categorias de Necessidade para calcular a reserva." />
      ) : (
        <>
          <div className="grid md:grid-cols-3 gap-3 mb-4">
            <div className="cartao p-4">
              <p className="text-xs text-[var(--cor-texto-suave)]">Reserva atual</p>
              <p className="num text-xl font-semibold">{formatarBRL(resultado.guardadoAtual)}</p>
              <p className="text-xs text-[var(--cor-texto-suave)] num">
                Cobertura: {resultado.coberturaMeses === null ? "—" : `${resultado.coberturaMeses.toFixed(1)} meses`}
              </p>
            </div>
            <div className="cartao p-4">
              <p className="text-xs text-[var(--cor-texto-suave)]">Meta da reserva ({resultado.mesesAlvo} meses)</p>
              <p className="num text-xl font-semibold">{formatarBRL(resultado.alvoReserva)}</p>
              <p className="text-xs text-[var(--cor-texto-suave)] num">
                Gasto essencial: {formatarBRL(resultado.gastoEssencialMensal)}/mês
              </p>
            </div>
            <div className="cartao p-4">
              <p className="text-xs text-[var(--cor-texto-suave)]">Situação</p>
              <p className="text-lg font-semibold" style={{ color: corSituacao }}>
                {resultado.situacao}
              </p>
              <p className="text-xs text-[var(--cor-texto-suave)] num">
                {resultado.mesesParaCompletar === null
                  ? "Sem aporte definido"
                  : resultado.mesesParaCompletar === 0
                    ? "Já completa"
                    : `Completa em ${resultado.mesesParaCompletar} meses (aporte ${formatarBRL(reservaConfig.aporteMensal)})`}
              </p>
            </div>
          </div>

          <div className="cartao p-4 mb-4">
            <div className="h-3 rounded-full overflow-hidden" style={{ background: "var(--cor-superficie-alt)" }}>
              <div
                style={{
                  width: `${Math.min(100, resultado.percentualAtingido ?? 0)}%`,
                  height: "100%",
                  background: corSituacao,
                }}
              />
            </div>
            <p className="text-xs num mt-2 text-[var(--cor-texto-suave)]">
              {resultado.percentualAtingido === null ? "—" : `${resultado.percentualAtingido.toFixed(0)}% da meta`} ·
              Falta {formatarBRL(resultado.falta)}
            </p>
          </div>
        </>
      )}

      {/* Ajustes */}
      <div className="cartao p-4">
        <h2 className="font-semibold text-sm mb-3">Ajustes</h2>
        <div className="grid md:grid-cols-4 gap-3">
          <div>
            <label className="rotulo" htmlFor="res-perfil">Perfil</label>
            <select
              id="res-perfil"
              className="entrada"
              value={reservaConfig.perfil}
              onChange={(e) => void salvarConfig({ perfil: e.target.value as typeof reservaConfig.perfil })}
            >
              {PERFIS_RESERVA_PADRAO.map((p) => (
                <option key={p.perfil} value={p.perfil}>
                  {p.perfil} ({p.meses} meses)
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="rotulo" htmlFor="res-meses">Meses-alvo (0 = usa o perfil)</label>
            <input
              id="res-meses"
              className="entrada num"
              type="number"
              min={0}
              max={36}
              defaultValue={reservaConfig.mesesAjustados ?? 0}
              onBlur={(e) => void salvarConfig({ mesesAjustados: Number(e.target.value) || null })}
            />
          </div>
          <div>
            <label className="rotulo" htmlFor="res-conta">Conta da reserva</label>
            <select
              id="res-conta"
              className="entrada"
              value={reservaConfig.contaId === null ? "" : String(reservaConfig.contaId)}
              onChange={(e) => void salvarConfig({ contaId: e.target.value === "" ? null : Number(e.target.value) })}
            >
              <option value="">Somar contas Poupança</option>
              {contas.map((c) => (
                <option key={c.id} value={String(c.id)}>
                  {c.nome}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="rotulo" htmlFor="res-aporte">Aporte mensal (R$)</label>
            <input
              id="res-aporte"
              className="entrada num"
              inputMode="decimal"
              defaultValue={reservaConfig.aporteMensal === 0 ? "" : (reservaConfig.aporteMensal / 100).toFixed(2).replace(".", ",")}
              onBlur={(e) => {
                const v = textoParaCentavos(e.target.value);
                void salvarConfig({ aporteMensal: v ?? 0 });
              }}
              placeholder="0,00"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
