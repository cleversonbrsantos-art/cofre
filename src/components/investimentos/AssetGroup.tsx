import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  AccordionHeader,
} from "../../components/ui/accordion";
import { formatarBRL, textoParaCentavos } from "../../domain/dinheiro";
import type { AtivoInvestimento, Quote, ClasseInvestimento } from "../../domain/models";
import { useState } from "react";
import { db } from "../../db/db";
import { useConfirm } from "../../hooks/useConfirm";

interface AssetGroupProps {
  classe: ClasseInvestimento;
  ativos: AtivoInvestimento[];
  quotes: Map<string, Quote | null>;
  onOpenLancamentos: (ativo: AtivoInvestimento) => void;
  onEditarAtivo: (ativo: AtivoInvestimento) => void;
  onExcluirAtivo: (ativo: AtivoInvestimento) => void;
}

interface AtivoLinhaProps {
  ativo: AtivoInvestimento;
  quote: Quote | null;
  onOpenLancamentos: () => void;
  onUpdateValorAtual: (novoValor: number) => Promise<void>;
  onEditar: () => void;
  onExcluir: () => void;
}

function AtivoLinha({ ativo, quote, onOpenLancamentos, onUpdateValorAtual, onEditar, onExcluir }: AtivoLinhaProps) {
  const [editando, setEditando] = useState(false);
  const [valorEdit, setValorEdit] = useState("");
  const { confirmar, dialogo } = useConfirm();

  const precoAtual = quote?.price ?? ativo.valorAtual;
  const variacao = quote?.changePercent ?? 0;

  // Usar a quantidade armazenada no ativo
  const qtd = ativo.quantidade ?? 0;
  // Preço médio = totalAportado / quantidade (em centavos por unidade)
  const precoMedio = qtd > 0 ? ativo.totalAportado / qtd : 0;
  // Rentabilidade = ((Preço Atual - Preço Médio) / Preço Médio) * 100
  const rentabilidade = qtd > 0 && precoMedio > 0 ? ((precoAtual - precoMedio) / precoMedio) * 100 : 0;
  // Saldo = Preço Atual * Quantidade
  const saldo = qtd * precoAtual;

  const isLoading = quote === null && ativo.valorAtual === 0;

  const handleSave = async () => {
    const valor = textoParaCentavos(valorEdit);
    if (valor === null || valor < 0) return;
    await onUpdateValorAtual(valor);
    setEditando(false);
  };

  // Funções auxiliares para exibição
  const formatarPrecoMedio = () => {
    if (qtd <= 0 || precoMedio <= 0) return "—";
    return formatarBRL(Math.round(precoMedio));
  };

  const formatarRentabilidade = () => {
    if (qtd <= 0 || precoMedio <= 0) return "—";
    const sinal = rentabilidade >= 0 ? "+" : "";
    return `${sinal}${rentabilidade.toFixed(2).replace(".", ",")}%`;
  };

  if (isLoading) {
    return (
      <tr className="border-b animate-pulse">
        <td className="py-1.5 px-3"><div className="h-4 w-24 bg-[var(--cor-borda)] rounded" /></td>
        <td className="py-1.5 px-3 text-right"><div className="h-4 w-16 bg-[var(--cor-borda)] rounded" /></td>
        <td className="py-1.5 px-3 text-right"><div className="h-4 w-16 bg-[var(--cor-borda)] rounded" /></td>
        <td className="py-1.5 px-3 text-right"><div className="h-4 w-16 bg-[var(--cor-borda)] rounded" /></td>
        <td className="py-1.5 px-3 text-right"><div className="h-4 w-16 bg-[var(--cor-borda)] rounded" /></td>
        <td className="py-1.5 px-3 text-right"><div className="h-4 w-16 bg-[var(--cor-borda)] rounded" /></td>
        <td className="py-1.5 px-3" />
      </tr>
    );
  }

  return (
    <>
      <tr className="border-b last:border-0">
        <td className="py-1.5 px-3 font-medium">{ativo.nome}</td>
        <td className="py-1.5 px-3 text-right num">
          {editando ? (
            <input
              type="text"
              className="entrada num w-28 text-right"
              value={valorEdit}
              onChange={(e) => setValorEdit(e.target.value)}
              onBlur={() => void handleSave()}
              onKeyDown={(e) => { if (e.key === "Enter") void handleSave(); }}
              autoFocus
            />
          ) : (
            <span onDoubleClick={() => { setValorEdit((precoAtual / 100).toFixed(2).replace(".", ",")); setEditando(true); }}>
              {formatarBRL(precoAtual)}
            </span>
          )}
        </td>
        <td className="py-1.5 px-3 text-right num">{qtd > 0 ? qtd.toFixed(qtd % 1 === 0 ? 0 : 4) : "—"}</td>
        <td className="py-1.5 px-3 text-right num">{formatarPrecoMedio()}</td>
        <td className="py-1.5 px-3 text-right num" style={{ color: variacao >= 0 ? "var(--cor-verde)" : "var(--cor-rosa)" }}>
          {variacao >= 0 ? "+" : ""}{variacao.toFixed(2).replace(".", ",")}%
        </td>
        <td className="py-1.5 px-3 text-right num" style={{ color: rentabilidade >= 0 ? "var(--cor-verde)" : "var(--cor-rosa)" }}>
          {formatarRentabilidade()}
        </td>
        <td className="py-1.5 px-3 text-right num">{formatarBRL(Math.round(saldo))}</td>
        <td className="py-1.5 px-3">
          <div className="flex items-center gap-1">
            <button
              type="button"
              className="botao botao-secundario text-xs"
              onClick={onOpenLancamentos}
              title="Lançamentos"
            >
              📋
            </button>
            <button
              type="button"
              className="botao botao-secundario text-xs"
              onClick={onEditar}
              title="Editar"
            >
              ✏️
            </button>
            <button
              type="button"
              className="botao botao-secundario text-xs"
              onClick={() => confirmar("Excluir ativo", `Excluir ${ativo.nome}?`, onExcluir)}
              title="Excluir"
              style={{ color: "var(--cor-rosa)" }}
            >
              🗑️
            </button>
          </div>
        </td>
      </tr>
      {dialogo}
    </>
  );
}

export function AssetGroup({ classe, ativos, quotes, onOpenLancamentos, onEditarAtivo, onExcluirAtivo }: AssetGroupProps) {
  if (ativos.length === 0) return null;

  // Calcular totais da classe
  let valorTotalClasse = 0;
  let variacaoDiaClasse = 0;

  for (const ativo of ativos) {
    const quote = quotes.get(ativo.nome.toUpperCase());
    const precoAtual = quote?.price ?? ativo.valorAtual;
    valorTotalClasse += precoAtual;
  }

  if (valorTotalClasse > 0) {
    for (const ativo of ativos) {
      const quote = quotes.get(ativo.nome.toUpperCase());
      const precoAtual = quote?.price ?? ativo.valorAtual;
      if (quote) {
        variacaoDiaClasse += quote.changePercent * (precoAtual / valorTotalClasse);
      }
    }
  }

  const handleUpdateValorAtual = async (ativo: AtivoInvestimento, novoValor: number) => {
    await db.ativos.update(ativo.id, { valorAtual: novoValor });
  };

  return (
    <AccordionItem value={classe}>
      <AccordionHeader>
        <AccordionTrigger className="flex items-center justify-between w-full px-0 py-2">
          <div className="flex items-center gap-3">
            <span className="font-medium">{classe}</span>
            <span className="text-xs text-[var(--cor-texto-suave)]">({ativos.length})</span>
          </div>
          <div className="flex items-center gap-4 text-sm num">
            <span>{formatarBRL(Math.round(valorTotalClasse))}</span>
            <span style={{ color: variacaoDiaClasse >= 0 ? "var(--cor-verde)" : "var(--cor-rosa)" }}>
              {variacaoDiaClasse >= 0 ? "+" : ""}{variacaoDiaClasse.toFixed(2).replace(".", ",")}%
            </span>
          </div>
        </AccordionTrigger>
      </AccordionHeader>
      <AccordionContent className="p-0">
        <div className="cartao overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-[var(--cor-texto-suave)] border-b">
                <th className="py-2 px-3">Ativo</th>
                <th className="py-2 px-3 text-right">Preço Atual</th>
                <th className="py-2 px-3 text-right">Qtd</th>
                <th className="py-2 px-3 text-right">Preço Médio</th>
                <th className="py-2 px-3 text-right">Variação (Dia)</th>
                <th className="py-2 px-3 text-right">Rentabilidade</th>
                <th className="py-2 px-3 text-right">Saldo</th>
                <th className="py-2 px-3" />
              </tr>
            </thead>
            <tbody>
              {ativos.map((ativo) => {
                const quote = quotes.get(ativo.nome.toUpperCase());
                return (
                  <AtivoLinha
                    key={ativo.id}
                    ativo={ativo}
                    quote={quote ?? null}
                    onOpenLancamentos={() => onOpenLancamentos(ativo)}
                    onUpdateValorAtual={(valor) => handleUpdateValorAtual(ativo, valor)}
                    onEditar={() => onEditarAtivo(ativo)}
                    onExcluir={() => onExcluirAtivo(ativo)}
                  />
                );
              })}
            </tbody>
          </table>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}