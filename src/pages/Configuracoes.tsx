import { useRef, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db, inicializarBanco } from "../db/db";
import { useToday } from "../hooks/useToday";
import { apagarTudo, exportarBackup } from "../db/backup";
import { ImportPreview } from "../components/ImportPreview";
import { carregarDadosExemplo } from "../db/exemplo";
import { CategoriesManager } from "../components/CategoriesManager";
import { PaymentMethodsManager } from "../components/PaymentMethodsManager";
import { Carregando } from "../components/PaginaVazia";
import type { Configuracao } from "../domain/models";
import { formatarBRL, textoParaCentavos } from "../domain/dinheiro";

export function PaginaConfiguracoes() {
  const hoje = useToday();
  const config = useLiveQuery(async () => await db.configuracao.get(1), []);
  const [mensagem, setMensagem] = useState<string | null>(null);
  const arquivoRef = useRef<HTMLInputElement>(null);
  const [arquivoImportacao, setArquivoImportacao] = useState<File | null>(null);

  if (config === undefined) return <Carregando />;

  const salvarConfig = async (parte: Partial<Configuracao>) => {
    if (!config) return;
    await db.configuracao.put({ ...config, ...parte, id: 1 });
  };

  const baixar = (conteudo: string, nome: string, tipo: string) => {
    const blob = new Blob([conteudo], { type: tipo });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = nome;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportarJSON = async () => {
    const backup = await exportarBackup();
    baixar(JSON.stringify(backup, null, 2), "cofre-backup.json", "application/json");
    setMensagem("Backup JSON exportado.");
  };


  const exportarCSV = async () => {
    const lancamentos = await db.lancamentos.orderBy("data").toArray();
    const contas = await db.contas.toArray();
    const cartoes = await db.cartoes.toArray();
    const cats = await db.categorias.toArray();
    const nomeConta = (id: number | null) => contas.find((c) => c.id === id)?.nome ?? "";
    const nomeCartao = (id: number | null) => cartoes.find((c) => c.id === id)?.nome ?? "";
    const nomeCategoria = (id: number | null) => cats.find((c) => c.id === id)?.nome ?? "Sem categoria";
    const linhas = [
      "data;descricao;categoria;valor;conta;forma;cartao;parcela;status;destino;observacao",
      ...lancamentos.map((l) =>
        [
          l.data,
          l.descricao,
          nomeCategoria(l.categoriaId),
          (l.valor / 100).toFixed(2).replace(".", ","),
          nomeConta(l.contaId),
          l.formaPagamento,
          nomeCartao(l.cartaoId),
          l.parcela ?? "",
          l.status,
          nomeConta(l.contaDestinoId),
          l.observacao,
        ]
          .map((campo) => `"${campo.replaceAll('"', '""')}"`)
          .join(";"),
      ),
    ];
    baixar(linhas.join("\n"), "cofre-lancamentos.csv", "text/csv");
    setMensagem("CSV de lançamentos exportado.");
  };

  const carregarExemplo = async () => {
    const confirmado = window.confirm(
      "Isso substituirá todos os dados atuais pelos dados de exemplo. Continuar?",
    );
    if (!confirmado) return;
    await carregarDadosExemplo(db);
    setMensagem("Dados de exemplo carregados.");
  };

  const apagar = async () => {
    const confirmado = window.confirm(
      "Isso apaga TODOS os dados permanentemente. Tem certeza absoluta?",
    );
    if (!confirmado) return;
    await apagarTudo();
    await inicializarBanco();
    setMensagem("Todos os dados foram apagados.");
  };

  return (
    <section>
      <h1 className="text-xl font-semibold mb-1">Configurações</h1>
      <p className="text-sm text-[var(--cor-texto-suave)] mb-4">
        Premissas, categorias e gestão dos dados.
      </p>

      {mensagem && (
        <div className="cartao p-3 mb-4 text-sm" style={{ color: "var(--cor-verde)" }} role="status">
          {mensagem}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Premissas */}
        <div className="cartao p-4 space-y-3">
          <h2 className="font-semibold text-sm">Premissas</h2>
          <div>
            <label className="rotulo" htmlFor="cfg-nome">
              Seu nome
            </label>
            <input
              id="cfg-nome"
              className="entrada"
              defaultValue={config?.nomeUsuario ?? ""}
              onBlur={(e) => void salvarConfig({ nomeUsuario: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="rotulo" htmlFor="cfg-rend">
                Rendimento esperado (% a.a.)
              </label>
              <input
                id="cfg-rend"
                className="entrada num"
                defaultValue={config?.rendimentoAa ?? 10.5}
                onBlur={(e) => void salvarConfig({ rendimentoAa: Number(e.target.value) })}
                inputMode="decimal"
              />
            </div>
            <div>
              <label className="rotulo" htmlFor="cfg-infl">
                Inflação (% a.a.)
              </label>
              <input
                id="cfg-infl"
                className="entrada num"
                defaultValue={config?.inflacaoAa ?? 4.5}
                onBlur={(e) => void salvarConfig({ inflacaoAa: Number(e.target.value) })}
                inputMode="decimal"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="rotulo" htmlFor="cfg-hoje">
                Data simulada (opcional)
              </label>
              <input
                id="cfg-hoje"
                type="date"
                className="entrada"
                defaultValue={config?.hojeManual ?? ""}
                onBlur={(e) =>
                  void salvarConfig({ hojeManual: e.target.value === "" ? null : e.target.value })
                }
              />
              <p className="text-xs text-[var(--cor-texto-suave)] mt-1">
                Deixe vazio para usar a data de hoje
                {hoje !== null ? <> (hoje: {hoje})</> : null}
              </p>
              <button
                type="button"
                className="botao botao-secundario text-xs mt-1"
                onClick={() => void salvarConfig({ hojeManual: null })}
              >
                Usar a data de hoje
              </button>
            </div>
            <div>
              <label className="rotulo" htmlFor="cfg-limite">
                Limite de destaque
              </label>
              <input
                id="cfg-limite"
                className="entrada"
                defaultValue={config ? (config.limiteDestaque / 100).toFixed(2) : ""}
                onBlur={(e) => {
                  const centavos = textoParaCentavos(e.target.value);
                  if (centavos !== null) void salvarConfig({ limiteDestaque: centavos });
                }}
                inputMode="decimal"
              />
            </div>
          </div>
          <div>
            <label className="rotulo" htmlFor="cfg-perfil">
              Perfil de reserva
            </label>
            <select
              id="cfg-perfil"
              className="entrada"
              defaultValue={config?.perfilReserva ?? "CLT"}
              onChange={(e) =>
                void salvarConfig({ perfilReserva: e.target.value as Configuracao["perfilReserva"] })
              }
            >
              {["CLT", "Servidor público", "Autônomo/MEI/PJ", "Empresário ou renda variável", "Personalizado"].map(
                (p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ),
              )}
            </select>
          </div>
        </div>

        {/* Dados */}
        <div className="cartao p-4 space-y-3">
          <h2 className="font-semibold text-sm">Dados</h2>
          <p className="text-xs text-[var(--cor-texto-suave)]">
            Backup completo em JSON; lançamentos em CSV; dados de exemplo para explorar o app.
          </p>
          <div className="flex flex-wrap gap-2">
            <button type="button" className="botao botao-primario" onClick={() => void exportarJSON()}>
              Exportar JSON
            </button>
            <button type="button" className="botao botao-secundario" onClick={() => arquivoRef.current?.click()}>
              Importar JSON
            </button>
            <input
              ref={arquivoRef}
              type="file"
              accept="application/json"
              className="hidden"
              aria-label="Arquivo de backup JSON"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) setArquivoImportacao(f);
                e.target.value = "";
              }}
            />
            <button type="button" className="botao botao-secundario" onClick={() => void exportarCSV()}>
              Exportar CSV
            </button>
            <button type="button" className="botao botao-secundario" onClick={() => void carregarExemplo()}>
              Carregar dados de exemplo
            </button>
            <button
              type="button"
              className="botao botao-secundario"
              style={{ color: "var(--cor-rosa)" }}
              onClick={() => void apagar()}
            >
              Apagar tudo
            </button>
          </div>
        </div>

        {arquivoImportacao && (
          <div className="cartao p-4">
            <ImportPreview
              arquivo={arquivoImportacao}
              onConcluido={() => {
                setArquivoImportacao(null);
                setMensagem("Importação concluída.");
              }}
              onCancelar={() => setArquivoImportacao(null)}
            />
          </div>
        )}

        {/* Categorias */}
        <div className="cartao p-4">
          <h2 className="font-semibold text-sm mb-3">Categorias</h2>
          <CategoriesManager />
        </div>

        {/* Formas de pagamento */}
        <div className="cartao p-4">
          <h2 className="font-semibold text-sm mb-3">Formas de pagamento</h2>
          <PaymentMethodsManager />
        </div>
      </div>

      {config && (
        <p className="text-xs text-[var(--cor-texto-suave)] mt-4 num">
          Rendimento mensal equivalente calculado: {config.rendimentoMensalEq.toFixed(4)}% ·
          limite de destaque: {formatarBRL(config.limiteDestaque)}
        </p>
      )}
    </section>
  );
}
