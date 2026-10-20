import { useMemo, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../db/db";
import { useConfirm } from "../hooks/useConfirm";
import { useToday } from "../hooks/useToday";
import { Carregando, EstadoVazio } from "../components/PaginaVazia";
import { calcularMeta, type ProjecaoMeta } from "../domain/metas";
import { avancarMesKey, formatarData, mesKeyDe, rotuloMesKey } from "../domain/datas";
import { formatarBRL, textoParaCentavos } from "../domain/dinheiro";

interface FormularioMeta {
  nome: string;
  valorAlvo: string;
  prazo: string;
  jaGuardado: string;
  aporteMensal: string;
  rendimentoAa: string;
}

const FORM_INICIAL: FormularioMeta = {
  nome: "",
  valorAlvo: "",
  prazo: "",
  jaGuardado: "",
  aporteMensal: "",
  rendimentoAa: "",
};

const COR_SITUACAO: Record<ProjecaoMeta["situacao"], string> = {
  "Concluída": "var(--cor-verde)",
  "No prazo": "var(--cor-verde)",
  "Atrasada: aumente o aporte": "var(--cor-rosa)",
  "Sem prazo": "var(--cor-ambar)",
  "Sem aporte": "var(--cor-rosa)",
};

export function PaginaMetas() {
  const { confirmar, dialogo } = useConfirm();
  const hoje = useToday();
  const config = useLiveQuery(async () => await db.configuracao.get(1), []);
  const metas = useLiveQuery(async () => await db.metas.toArray(), []);

  const [form, setForm] = useState<FormularioMeta>(FORM_INICIAL);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [erroForm, setErroForm] = useState<string | null>(null);

  const mesKeyAtual = useMemo(() => {
    return mesKeyDe(hoje);
  }, [hoje]);

  if (config === undefined || metas === undefined) return <Carregando />;

  const totalAlvo = metas.reduce((s, m) => s + m.valorAlvo, 0);
  const totalGuardado = metas.reduce((s, m) => s + m.jaGuardado, 0);
  const projecoes = new Map<number, ProjecaoMeta>(
    metas.map((m) => [m.id, calcularMeta(m, mesKeyAtual, config.rendimentoMensalEq / 100)]),
  );
  const atrasadas = metas.filter((m) => projecoes.get(m.id)?.situacao === "Atrasada: aumente o aporte").length;

  const salvar = async () => {
    const alvo = textoParaCentavos(form.valorAlvo);
    const guardado = textoParaCentavos(form.jaGuardado);
    const aporte = textoParaCentavos(form.aporteMensal);
    const rendimento = form.rendimentoAa.trim() === "" ? null : Number(form.rendimentoAa.replace(",", "."));
    if (form.nome.trim() === "") {
      setErroForm("Informe o nome da meta.");
      return;
    }
    if (alvo === null || alvo <= 0) {
      setErroForm("Informe o valor-alvo maior que zero.");
      return;
    }
    if (rendimento !== null && (!Number.isFinite(rendimento) || rendimento < 0)) {
      setErroForm("Rendimento deve ser um percentual válido.");
      return;
    }
    await db.metas.add({
      nome: form.nome.trim(),
      valorAlvo: alvo,
      prazo: form.prazo === "" ? null : form.prazo,
      jaGuardado: guardado ?? 0,
      aporteMensal: aporte ?? 0,
      rendimentoAa: rendimento,
    });
    setForm(FORM_INICIAL);
    setMostrarForm(false);
    setErroForm(null);
  };

  const excluir = (id: number, nome: string) => {
    confirmar("Excluir meta", `Excluir a meta "${nome}"?`, () => void executarExclusao(id));
  };

  const executarExclusao = async (id: number) => {
    await db.metas.delete(id);
  };

  return (
    <section>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div>
          <h1 className="text-xl font-semibold">Metas</h1>
          <p className="text-sm text-[var(--cor-texto-suave)] num">
            Total das metas: {formatarBRL(totalAlvo)} · Guardado: {formatarBRL(totalGuardado)} · Atrasadas: {atrasadas}
          </p>
        </div>
        <button
          type="button"
          className="botao botao-primario"
          onClick={() => setMostrarForm((aberto) => !aberto)}
          aria-expanded={mostrarForm}
        >
          {mostrarForm ? "Fechar formulário" : "Nova meta"}
        </button>
      </div>

      {mostrarForm && (
        <div className="cartao p-4 mb-4" data-testid="formulario-meta">
          <h2 className="font-semibold text-sm mb-3">Nova meta</h2>
          {erroForm && (
            <p className="text-sm mb-3" style={{ color: "var(--cor-rosa)" }} role="alert">
              {erroForm}
            </p>
          )}
          <div className="grid md:grid-cols-3 gap-3">
            <div>
              <label className="rotulo" htmlFor="meta-nome">Nome</label>
              <input id="meta-nome" className="entrada" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
            </div>
            <div>
              <label className="rotulo" htmlFor="meta-alvo">Valor-alvo (R$)</label>
              <input id="meta-alvo" className="entrada num" inputMode="decimal" value={form.valorAlvo} onChange={(e) => setForm({ ...form, valorAlvo: e.target.value })} placeholder="0,00" />
            </div>
            <div>
              <label className="rotulo" htmlFor="meta-prazo">Prazo (opcional)</label>
              <input id="meta-prazo" className="entrada" type="date" value={form.prazo} onChange={(e) => setForm({ ...form, prazo: e.target.value })} />
            </div>
            <div>
              <label className="rotulo" htmlFor="meta-guardado">Já guardado (R$)</label>
              <input id="meta-guardado" className="entrada num" inputMode="decimal" value={form.jaGuardado} onChange={(e) => setForm({ ...form, jaGuardado: e.target.value })} placeholder="0,00" />
            </div>
            <div>
              <label className="rotulo" htmlFor="meta-aporte">Aporte mensal (R$)</label>
              <input id="meta-aporte" className="entrada num" inputMode="decimal" value={form.aporteMensal} onChange={(e) => setForm({ ...form, aporteMensal: e.target.value })} placeholder="0,00" />
            </div>
            <div>
              <label className="rotulo" htmlFor="meta-rend">Rendimento próprio % a.a. (vazio = usa Configurações)</label>
              <input id="meta-rend" className="entrada num" inputMode="decimal" value={form.rendimentoAa} onChange={(e) => setForm({ ...form, rendimentoAa: e.target.value })} placeholder={String(config.rendimentoAa).replace(".", ",")} />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button type="button" className="botao botao-primario" onClick={() => void salvar()}>Salvar meta</button>
            <button type="button" className="botao botao-secundario" onClick={() => { setForm(FORM_INICIAL); setMostrarForm(false); setErroForm(null); }}>Cancelar</button>
          </div>
        </div>
      )}

      {metas.length === 0 ? (
        <EstadoVazio mensagem="Nenhuma meta cadastrada. Defina um alvo, um prazo e veja o aporte necessário calculado." />
      ) : (
        metas.map((m) => {
          const p = projecoes.get(m.id);
          if (!p) return null;
          return (
            <div key={m.id} className="cartao p-4 mb-3">
              <div className="flex justify-between items-start flex-wrap gap-2">
                <div>
                  <h2 className="font-semibold">{m.nome}</h2>
                  <p className="text-xs text-[var(--cor-texto-suave)]">
                    Alvo {formatarBRL(m.valorAlvo)} · Prazo {m.prazo ? formatarData(m.prazo) : "sem prazo"}
                  </p>
                </div>
                <div className="flex gap-1">
                  <button type="button" className="botao botao-secundario text-xs" onClick={() => excluir(m.id, m.nome)}>
                    Excluir
                  </button>
                </div>
              </div>
              <p className="num text-sm mt-2">
                Guardado {formatarBRL(m.jaGuardado)} ({p.porcentagemConcluida === null ? "—" : `${p.porcentagemConcluida.toFixed(0)}%`}) ·
                Falta {formatarBRL(p.falta)} ·
                <span style={{ color: COR_SITUACAO[p.situacao], fontWeight: 600 }}> {p.situacao}</span>
              </p>
              <p className="text-sm num mt-1">
                Aporte necessário (PMT):{" "}
                <strong>{p.aporteNecessario === null ? "—" : formatarBRL(p.aporteNecessario)}</strong>
                {" "}· Conclusão com o aporte atual (NPER):{" "}
                <strong>{p.conclusaoComAporteAtual === null ? "Sem aporte" : `${p.conclusaoComAporteAtual} meses`}</strong>
                {p.conclusaoComAporteAtual !== null && (
                  <span className="text-[var(--cor-texto-suave)]">
                    {" "}(chega em {rotuloMesKey(avancarMesKey(mesKeyAtual, p.conclusaoComAporteAtual))})
                  </span>
                )}
              </p>
              <div className="mt-2 h-2 rounded-full overflow-hidden" style={{ background: "var(--cor-superficie-alt)" }}>
                <div
                  style={{
                    width: `${Math.min(100, p.porcentagemConcluida ?? 0)}%`,
                    height: "100%",
                    background: "var(--cor-destaque)",
                  }}
                />
              </div>
            </div>
          );
        })
      )}
      {dialogo}
    </section>
  );
}
