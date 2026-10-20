import { useEffect, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../db/db";
import { importarBackup, prepareImport, type ResumoImportacao } from "../db/backup";

const ENTIDADES: { chave: string; rotulo: string }[] = [
  { chave: "configuracao", rotulo: "Configuração" },
  { chave: "paymentMethods", rotulo: "Formas de pagamento" },
  { chave: "categorias", rotulo: "Categorias" },
  { chave: "contas", rotulo: "Contas" },
  { chave: "cartoes", rotulo: "Cartões" },
  { chave: "lancamentos", rotulo: "Lançamentos" },
  { chave: "parceladas", rotulo: "Compras parceladas" },
  { chave: "orcamentoPlanos", rotulo: "Planos de orçamento" },
  { chave: "orcamentoConfig", rotulo: "Config. do orçamento" },
  { chave: "metas", rotulo: "Metas" },
  { chave: "reservaConfig", rotulo: "Config. da reserva" },
  { chave: "dividas", rotulo: "Dívidas" },
  { chave: "ativos", rotulo: "Ativos" },
  { chave: "alvos", rotulo: "Alvos de alocação" },
  { chave: "bensPassivos", rotulo: "Bens e passivos" },
  { chave: "patrimonioHistorico", rotulo: "Histórico de patrimônio" },
  { chave: "contasPagar", rotulo: "Contas a pagar" },
  { chave: "assinaturas", rotulo: "Assinaturas" },
  { chave: "recorrentes", rotulo: "Recorrentes" },
];

interface ImportPreviewProps {
  arquivo: File;
  onConcluido: () => void;
  onCancelar: () => void;
}

function lerArquivoTexto(arquivo: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : "");
    reader.onerror = () => reject(reader.error ?? new Error("Falha ao ler o arquivo."));
    reader.readAsText(arquivo);
  });
}

/** Pré-visualização da importação (C4): resumo ao lado do banco atual; só o botão confirma grava. */
export function ImportPreview({ arquivo, onConcluido, onCancelar }: ImportPreviewProps) {
  const [resumo, setResumo] = useState<ResumoImportacao | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [importando, setImportando] = useState(false);

  const contagensAtuais = useLiveQuery(async (): Promise<Record<string, number>> => {
    return {
      configuracao: await db.configuracao.count(),
      paymentMethods: await db.paymentMethods.count(),
      categorias: await db.categorias.count(),
      contas: await db.contas.count(),
      cartoes: await db.cartoes.count(),
      lancamentos: await db.lancamentos.count(),
      parceladas: await db.parceladas.count(),
      orcamentoPlanos: await db.orcamentoPlanos.count(),
      orcamentoConfig: await db.orcamentoConfig.count(),
      metas: await db.metas.count(),
      reservaConfig: await db.reservaConfig.count(),
      dividas: await db.dividas.count(),
      ativos: await db.ativos.count(),
      alvos: await db.alvos.count(),
      bensPassivos: await db.bensPassivos.count(),
      patrimonioHistorico: await db.patrimonioHistorico.count(),
      contasPagar: await db.contasPagar.count(),
      assinaturas: await db.assinaturas.count(),
      recorrentes: await db.recorrentes.count(),
    } satisfies Record<string, number>;
  }, []);

  useEffect(() => {
    let ativo = true;
    const preparar = async () => {
      try {
        const texto = await lerArquivoTexto(arquivo);
        const resultado = await prepareImport(texto);
        if (!ativo) return;
        if (resultado.ok) setResumo(resultado.summary);
        else setErro(resultado.error);
      } catch (e) {
        if (ativo) setErro(e instanceof Error ? e.message : "Falha ao ler o arquivo.");
      }
    };
    void preparar();
    return () => {
      ativo = false;
    };
  }, [arquivo]);

  const substituir = async () => {
    if (!resumo) return;
    setImportando(true);
    try {
      const texto = await lerArquivoTexto(arquivo);
      const resultado = await importarBackup(texto);
      setImportando(false);
      if (resultado.ok) onConcluido();
      else setErro(resultado.erro);
    } catch (e) {
      setImportando(false);
      setErro(e instanceof Error ? e.message : "Falha ao ler o arquivo.");
    }
  };

  if (erro) {
    return (
      <div className="cartao p-4">
        <h2 className="font-semibold text-sm mb-2">Importar backup</h2>
        <p className="text-sm mb-3" style={{ color: "var(--cor-rosa)" }} role="alert">
          {erro}
        </p>
        <button type="button" className="botao botao-secundario" onClick={onCancelar}>
          Cancelar
        </button>
      </div>
    );
  }

  if (!resumo || contagensAtuais === undefined) {
    return <p className="text-sm text-[var(--cor-texto-suave)]">Carregando…</p>;
  }

  return (
    <div className="cartao p-4">
      <h2 className="font-semibold text-sm mb-1">Importar backup</h2>
      <p className="text-xs text-[var(--cor-texto-suave)] mb-3">
        Versão: {resumo.version} · Exportado em: {resumo.exportedAt}
      </p>
      <div className="overflow-x-auto mb-3">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-[var(--cor-texto-suave)] border-b">
              <th className="py-1 pr-3">Entidade</th>
              <th className="py-1 pr-3 text-right">Backup</th>
              <th className="py-1 text-right">Banco atual</th>
            </tr>
          </thead>
          <tbody>
            {ENTIDADES.map((e) => (
              <tr key={e.chave} className="border-b last:border-0">
                <td className="py-1 pr-3">{e.rotulo}</td>
                <td className="py-1 pr-3 text-right num">{resumo.counts[e.chave] ?? 0}</td>
                <td className="py-1 text-right num">{contagensAtuais[e.chave]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs mb-3" style={{ color: "var(--cor-ambar)" }}>
        Substituir apaga todos os dados atuais antes de importar.
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          className="botao"
          style={{ background: "var(--cor-rosa)", color: "#fff" }}
          disabled={importando}
          onClick={() => void substituir()}
        >
          Substituir todos os dados
        </button>
        <button type="button" className="botao botao-secundario" onClick={onCancelar}>
          Cancelar
        </button>
      </div>
    </div>
  );
}
