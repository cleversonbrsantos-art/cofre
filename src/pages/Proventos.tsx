import { useEffect, useState, useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../db/db";
import { useToday } from "../hooks/useToday";
import { Carregando, EstadoVazio, Erro } from "../components/PaginaVazia";
import { calcularResumoProventos, filtrarPorStatus } from "../domain/dividends";
import { ProventosSummaryCards } from "../components/proventos/SummaryCards";
import { ProventosTable } from "../components/proventos/ProventosTable";
import { fetchAndCacheAllDividends } from "../services/dividends";

export function PaginaProventos() {
  const hoje = useToday();
  const ativos = useLiveQuery(async () => await db.ativos.toArray(), []);
  const [dividendos, setDividendos] = useState<Map<string, import("../domain/models").Dividend[]>>(new Map());
  const [erro, setErro] = useState<string | null>(null);
  const [filtro, setFiltro] = useState<"Todos" | "Pago" | "A Receber">("Todos");

  const carregando = ativos === undefined;

  // Achatar todos os dividendos em um único array
  const todosDividendos = useMemo(() => {
    const arr: import("../domain/models").Dividend[] = [];
    dividendos.forEach((arrDiv) => arr.push(...arrDiv));
    return arr;
  }, [dividendos]);

  // Calcular resumo
  const resumo = useMemo(() => {
    if (!ativos || ativos.length === 0) {
      return {
        totalRecebido12Meses: 0,
        totalAReceber: 0,
        mediaMensal: 0,
        detalhes: [] as import("../domain/dividends").DividendDetalhe[],
      };
    }
    return calcularResumoProventos(ativos, todosDividendos, hoje);
  }, [ativos, todosDividendos, hoje]);

  // Filtrar detalhes
  const detalhesFiltrados = useMemo(
    () => filtrarPorStatus(resumo.detalhes, filtro),
    [resumo.detalhes, filtro]
  );

  // Buscar proventos quando ativos mudarem
  useEffect(() => {
    if (carregando || !ativos || ativos.length === 0) return;
    let cancelado = false;

    async function carregarDividendos() {
      try {
        const ativosDef = ativos!;
        const tickers = ativosDef.map((a) => ({ ticker: a.nome, type: a.classe }));
        const resultado = await fetchAndCacheAllDividends(tickers);
        if (!cancelado) {
          setDividendos(resultado);
          setErro(null);
        }
      } catch {
        if (!cancelado) {
          setErro("Não foi possível carregar os proventos. Exibindo dados do cache.");
        }
      }
    }

    void carregarDividendos();
    return () => { cancelado = true; };
  }, [ativos, carregando]);

  if (carregando) {
    return <Carregando />;
  }

  const temAtivosComProventos = ativos.length > 0 && resumo.detalhes.length > 0;

  return (
    <section>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div>
          <h1 className="text-xl font-semibold">Proventos</h1>
          <p className="text-sm text-[var(--cor-texto-suave)] num">
            Histórico de dividendos e JCP dos ativos da carteira
          </p>
        </div>
      </div>

      {erro && <Erro mensagem={erro} />}

      <ProventosSummaryCards
        totalRecebido12Meses={resumo.totalRecebido12Meses}
        totalAReceber={resumo.totalAReceber}
        mediaMensal={resumo.mediaMensal}
      />

      {/* Filtros */}
      <div className="cartao p-3 mb-4 flex items-center gap-3 flex-wrap">
        <label className="rotulo text-sm" htmlFor="filtro-proventos">Filtrar:</label>
        <select
          id="filtro-proventos"
          className="entrada w-auto"
          value={filtro}
          onChange={(event) => setFiltro(event.target.value as "Todos" | "Pago" | "A Receber")}
        >
          <option value="Todos">Todos</option>
          <option value="Pago">Pago</option>
          <option value="A Receber">A Receber</option>
        </select>
        <span className="text-xs text-[var(--cor-texto-suave)] ml-auto">
          {detalhesFiltrados.length} de {resumo.detalhes.length} proventos
        </span>
      </div>

      {ativos.length === 0 ? (
        <EstadoVazio mensagem="Nenhum ativo cadastrado. Adicione ativos na aba Investimentos para ver seus proventos." />
      ) : !temAtivosComProventos ? (
        <EstadoVazio mensagem="Nenhum provento encontrado para os ativos da carteira. Verifique se os tickers estão corretos." />
      ) : (
        <ProventosTable detalhes={detalhesFiltrados} />
      )}
    </section>
  );
}