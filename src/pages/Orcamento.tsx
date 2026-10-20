import { useEffect, useMemo, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../db/db";
import { useConfirm } from "../hooks/useConfirm";
import { useToday } from "../hooks/useToday";
import { Carregando, EstadoVazio } from "../components/PaginaVazia";
import { calcularOrcamento, metaPorGrupo, rendaReferenciaPadrao } from "../domain/orcamento";
import { ATALHOS_ORCAMENTO } from "../config/padroes";
import { validateCustomShortcut } from "../domain/shortcutRules";
import { avancarMesKey, rotuloMesKey, anoDeMesKey, mesDeMesKey } from "../domain/datas";
import { formatarBRL, textoParaCentavos } from "../domain/dinheiro";
import type { AtalhoOrcamento } from "../domain/types";

const OPCOES_ATALHO: AtalhoOrcamento[] = [
  "50/30/20",
  "60/30/10",
  "70/20/10",
  "50/20/30",
  "40/30/30",
  "Personalizado",
];

export function PaginaOrcamento() {
  const { confirmar, dialogo } = useConfirm();
  const hoje = useToday();
  const config = useLiveQuery(async () => await db.configuracao.get(1), []);
  const categorias = useLiveQuery(async () => await db.categorias.toArray(), []);
  const lancamentos = useLiveQuery(async () => await db.lancamentos.toArray(), []);
  const planos = useLiveQuery(async () => await db.orcamentoPlanos.toArray(), []);
  const orcConfig = useLiveQuery(async () => await db.orcamentoConfig.get(1), []);

  const mesKeyAtual = useMemo(() => {
    return Number(hoje.slice(0, 4) + hoje.slice(5, 7));
  }, [hoje]);
  const [mesSelecionado, setMesSelecionado] = useState<string>("atual");
  const [personalizado, setPersonalizado] = useState(
    config?.atalhoPersonalizado ?? { necessidades: 50, desejos: 30, poupanca: 20 },
  );
  const [erroAtalho, setErroAtalho] = useState<string | null>(null);

  useEffect(() => {
    if (config) {
      setPersonalizado(config.atalhoPersonalizado);
      setErroAtalho(null);
    }
  }, [config]);

  if (
    config === undefined ||
    categorias === undefined ||
    lancamentos === undefined ||
    planos === undefined ||
    orcConfig === undefined
  ) {
    return <Carregando />;
  }

  const mkAlvo =
    mesSelecionado === "atual" ? mesKeyAtual : Number(mesSelecionado);
  const mkAnterior = avancarMesKey(mkAlvo, -1);

  const mapaCategorias = new Map(categorias.map((c) => [c.id, c]));
  const rendaPadrao = rendaReferenciaPadrao(lancamentos, mapaCategorias, (d) => Number(d.slice(0, 4) + d.slice(5, 7)));
  const rendaReferencia = orcConfig.mesKey === mkAlvo ? orcConfig.rendaReferencia : rendaPadrao;

  const resultado = calcularOrcamento(mkAlvo, mkAnterior, planos, lancamentos, categorias, rendaReferencia);

  const atalhoAtual: AtalhoOrcamento = config.atalhoOrcamento;
  const percentuais =
    atalhoAtual === "Personalizado"
      ? config.atalhoPersonalizado
      : ATALHOS_ORCAMENTO[atalhoAtual];
  const metas = metaPorGrupo(percentuais, rendaReferencia);

  const aplicarSugestoes = async () => {
    const { sugerirPlanos } = await import("../domain/orcamento");
    const sugestoes = sugerirPlanos(metas, categorias, lancamentos, mkAlvo);
    await db.transaction("rw", db.orcamentoPlanos, async () => {
      await db.orcamentoPlanos.where("mesKey").equals(mkAlvo).delete();
      await db.orcamentoPlanos.bulkAdd(sugestoes.map((s) => ({ ...s, mesKey: mkAlvo })));
    });
  };

  const salvarPlano = (categoriaId: number, texto: string) => {
    const valor = textoParaCentavos(texto);
    const existente = planos.find((p) => p.categoriaId === categoriaId && p.mesKey === mkAlvo);
    if (valor === null || valor === 0) {
      if (existente)
        confirmar(
          "Limpar plano do mês",
          "Apagar o plano desta categoria neste mês?",
          () => void db.orcamentoPlanos.delete(existente.id),
        );
      return;
    }
    void gravarPlano(categoriaId, valor);
  };

  const gravarPlano = async (categoriaId: number, valor: number) => {
    const existente = planos.find((p) => p.categoriaId === categoriaId && p.mesKey === mkAlvo);
    if (existente) await db.orcamentoPlanos.put({ ...existente, valor });
    else await db.orcamentoPlanos.add({ mesKey: mkAlvo, categoriaId, valor });
  };

  const salvarRenda = async (texto: string) => {
    const valor = textoParaCentavos(texto);
    if (valor === null) return;
    await db.orcamentoConfig.put({
      id: 1,
      mesKey: mkAlvo,
      rendaReferencia: valor,
      atalho: atalhoAtual,
      usarSugestoes: orcConfig?.usarSugestoes ?? false,
    });
  };

  const salvarAtalho = async (valor: AtalhoOrcamento) => {
    setErroAtalho(null);
    await db.configuracao.put({ ...config, atalhoOrcamento: valor, id: 1 });
    await db.orcamentoConfig.put({ ...orcConfig, atalho: valor, id: 1 });
  };

  const mudarAtalho = (valor: AtalhoOrcamento) => {
    void salvarAtalho(valor);
    if (valor === "Personalizado") {
      setPersonalizado(config.atalhoPersonalizado);
    }
  };

  const mudarPersonalizado = (parte: Partial<{ necessidades: number; desejos: number; poupanca: number }>) => {
    const novo = { ...personalizado, ...parte };
    setPersonalizado(novo);
    const validacao = validateCustomShortcut(novo);
    if (!validacao.ok) {
      setErroAtalho(validacao.error);
      return;
    }
    setErroAtalho(null);
    void db.configuracao.put({ ...config, atalhoPersonalizado: novo, id: 1 });
  };

  const ano = anoDeMesKey(mkAlvo);
  const opcoesMes = Array.from({ length: 12 }, (_, i) => ano * 100 + i + 1);

  return (
    <section>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div>
          <h1 className="text-xl font-semibold">Orçamento</h1>
          <p className="text-sm text-[var(--cor-texto-suave)]">{rotuloMesKey(mkAlvo)}</p>
        </div>
        <select
          className="entrada max-w-44"
          value={mesSelecionado}
          onChange={(e) => setMesSelecionado(e.target.value)}
          aria-label="Mês do orçamento"
        >
          <option value="atual">Mês atual ({rotuloMesKey(mesKeyAtual)})</option>
          {opcoesMes.map((mk) => (
            <option key={mk} value={String(mk)}>
              {rotuloMesKey(mk)}
            </option>
          ))}
        </select>
      </div>

      {/* Renda e atalho */}
      <div className="grid md:grid-cols-3 gap-3 mb-4">
        <div className="cartao p-4">
          <label className="rotulo" htmlFor="orc-renda">
            Renda de referência (padrão: média de 3 meses)
          </label>
          <input
            id="orc-renda"
            className="entrada num"
            defaultValue={rendaReferencia === 0 ? "" : (rendaReferencia / 100).toFixed(2).replace(".", ",")}
            onBlur={(e) => void salvarRenda(e.target.value)}
            placeholder={rendaPadrao === 0 ? "0,00" : undefined}
          />
          <p className="text-xs text-[var(--cor-texto-suave)] mt-1 num">
            Sugerido: {formatarBRL(rendaPadrao)}
          </p>
        </div>
        <div className="cartao p-4">
          <label className="rotulo" htmlFor="orc-atalho">
            Atalho de orçamento
          </label>
          <select
            id="orc-atalho"
            className="entrada"
            value={atalhoAtual}
            onChange={(e) => mudarAtalho(e.target.value as AtalhoOrcamento)}
          >
            {OPCOES_ATALHO.map((opcao) => (
              <option key={opcao} value={opcao}>
                {opcao}
              </option>
            ))}
          </select>
          {atalhoAtual === "Personalizado" ? (
            <div className="mt-2 grid grid-cols-3 gap-2">
              <div>
                <label className="rotulo text-xs" htmlFor="orc-pers-nec">
                  Necessidades (%)
                </label>
                <input
                  id="orc-pers-nec"
                  type="number"
                  className="entrada num"
                  value={personalizado.necessidades}
                  onChange={(e) => mudarPersonalizado({ necessidades: Number(e.target.value) })}
                />
              </div>
              <div>
                <label className="rotulo text-xs" htmlFor="orc-pers-des">
                  Desejos (%)
                </label>
                <input
                  id="orc-pers-des"
                  type="number"
                  className="entrada num"
                  value={personalizado.desejos}
                  onChange={(e) => mudarPersonalizado({ desejos: Number(e.target.value) })}
                />
              </div>
              <div>
                <label className="rotulo text-xs" htmlFor="orc-pers-pou">
                  Poupança (%)
                </label>
                <input
                  id="orc-pers-pou"
                  type="number"
                  className="entrada num"
                  value={personalizado.poupanca}
                  onChange={(e) => mudarPersonalizado({ poupanca: Number(e.target.value) })}
                />
              </div>
            </div>
          ) : (
            <p className="text-xs text-[var(--cor-texto-suave)] mt-1 num">
              {percentuais.necessidades}/{percentuais.desejos}/{percentuais.poupanca}
            </p>
          )}
          {erroAtalho && <p className="text-sm text-[var(--cor-rosa)] mt-2">{erroAtalho}</p>}
          <p className="text-sm num mt-2">
            Necessidades: {formatarBRL(metas.necessidades)} · Desejos: {formatarBRL(metas.desejos)} ·
            Poupança: {formatarBRL(metas.poupanca)}
          </p>
        </div>
        <div className="cartao p-4 flex flex-col justify-between">
          <div>
            <p className="text-xs text-[var(--cor-texto-suave)]">Sobra a alocar (renda − plano)</p>
            <p
              className="num text-lg font-semibold"
              style={{
                color:
                  resultado.sobraAlocar === 0
                    ? "var(--cor-verde)"
                    : resultado.sobraAlocar > 0
                      ? "var(--cor-ambar)"
                      : "var(--cor-rosa)",
              }}
            >
              {formatarBRL(resultado.sobraAlocar)}
            </p>
          </div>
          <button type="button" className="botao botao-secundario text-xs" onClick={() => void aplicarSugestoes()}>
            Usar sugestões do atalho
          </button>
        </div>
      </div>

      {/* Grupos */}
      <div className="grid md:grid-cols-3 gap-3 mb-4">
        {resultado.grupos.map((g) => (
          <div key={g.grupo} className="cartao p-4">
            <div className="flex justify-between items-center">
              <p className="font-medium text-sm">{g.grupo}</p>
              <span
                className={`etiqueta ${g.situacao === "Dentro do plano" ? "etiqueta-verde" : g.situacao === "Estourou" ? "etiqueta-rosa" : "etiqueta-ambar"}`}
              >
                {g.situacao}
              </span>
            </div>
            <p className="text-sm num mt-2">
              Planejado: {formatarBRL(g.planejado)}
              <br />
              Realizado: {formatarBRL(g.realizado)}
              <br />
              Diferença: {formatarBRL(g.diferenca)}
            </p>
          </div>
        ))}
      </div>

      {/* Tabela por categoria */}
      {categorias.length === 0 ? (
        <EstadoVazio mensagem="Cadastre categorias primeiro em Configurações." />
      ) : (
        <div className="cartao overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-[var(--cor-texto-suave)] border-b">
                <th className="py-2 px-3">Categoria</th>
                <th className="py-2 px-3">Grupo</th>
                <th className="py-2 px-3 text-right">Planejado</th>
                <th className="py-2 px-3 text-right">Realizado</th>
                <th className="py-2 px-3 text-right">Variação</th>
                <th className="py-2 px-3 text-right">Uso da meta</th>
                <th className="py-2 px-3">Situação</th>
                <th className="py-2 px-3 text-right">vs. mês anterior</th>
              </tr>
            </thead>
            <tbody>
              {resultado.linhas.map((l) => (
                <tr key={l.categoriaId} className="border-b last:border-0">
                  <td className="py-1.5 px-3">{l.nome}</td>
                  <td className="py-1.5 px-3 text-[var(--cor-texto-suave)]">{l.grupo}</td>
                  <td className="py-1.5 px-3 text-right num">
                    <input
                      className="entrada num text-right w-28 py-0.5"
                      defaultValue={l.planejado === 0 ? "" : (l.planejado / 100).toFixed(2).replace(".", ",")}
                      onBlur={(e) => salvarPlano(l.categoriaId, e.target.value)}
                      aria-label={`Plano de ${l.nome}`}
                      placeholder="0,00"
                    />
                  </td>
                  <td className="py-1.5 px-3 text-right num">{formatarBRL(l.realizado)}</td>
                  <td
                    className="py-1.5 px-3 text-right num"
                    style={{ color: l.variacao >= 0 ? "var(--cor-verde)" : "var(--cor-rosa)" }}
                  >
                    {formatarBRL(l.variacao)}
                  </td>
                  <td className="py-1.5 px-3 text-right num">
                    {l.usoMeta === null ? "—" : `${l.usoMeta.toFixed(0)}%`}
                  </td>
                  <td className="py-1.5 px-3">
                    <span
                      className={`etiqueta ${l.situacao === "Dentro do plano" ? "etiqueta-verde" : l.situacao === "Estourou" ? "etiqueta-rosa" : "etiqueta-ambar"}`}
                    >
                      {l.situacao}
                    </span>
                  </td>
                  <td className="py-1.5 px-3 text-right num">
                    {l.variacaoMesAnterior === null ? "—" : formatarBRL(l.variacaoMesAnterior)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-xs text-[var(--cor-texto-suave)] mt-3 num">
        Uso do orçamento:{" "}
        {resultado.usoOrcamento === null ? "sem plano" : `${resultado.usoOrcamento.toFixed(0)}%`} ·
        Poupança do mês (receitas − despesas): {formatarBRL(resultado.poupancaDoGrupo)} ·
        Plano de {rotuloMesKey(mkAnterior)} ficou em {formatarBRL(
          planos.filter((p) => p.mesKey === mkAnterior).reduce((s, p) => s + p.valor, 0)
        )}
        {" "}(mês {mesDeMesKey(mkAnterior)}/{anoDeMesKey(mkAnterior)})
      </p>
      {dialogo}
    </section>
  );
}
