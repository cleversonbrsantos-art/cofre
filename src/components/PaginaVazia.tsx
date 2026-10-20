interface Props {
  titulo: string;
  descricao?: string;
  children?: React.ReactNode;
}

export function PaginaVazia({ titulo, descricao, children }: Props) {
  return (
    <section>
      <h1 className="text-xl font-semibold mb-1">{titulo}</h1>
      {descricao && <p className="text-sm text-[var(--cor-texto-suave)] mb-4">{descricao}</p>}
      {children}
    </section>
  );
}

export function EstadoVazio({ mensagem, acao }: { mensagem: string; acao?: React.ReactNode }) {
  return (
    <div className="cartao p-8 text-center">
      <p className="text-sm text-[var(--cor-texto-suave)] mb-3">{mensagem}</p>
      {acao}
    </div>
  );
}

export function Carregando() {
  return (
    <div className="cartao p-8 text-center text-sm text-[var(--cor-texto-suave)]" role="status">
      Carregando…
    </div>
  );
}

export function Erro({ mensagem }: { mensagem: string }) {
  return (
    <div className="cartao p-8 text-center text-sm" style={{ color: "var(--cor-rosa)" }} role="alert">
      {mensagem}
    </div>
  );
}
