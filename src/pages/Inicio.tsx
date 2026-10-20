import { PaginaVazia } from "../components/PaginaVazia";
import { APP } from "../config/app";

export function PaginaInicio() {
  return (
    <PaginaVazia titulo={`Bem-vindo ao ${APP.nome}`}>
      <div className="cartao p-6 space-y-4 max-w-2xl">
        <p className="text-sm">
          Seu controle financeiro pessoal, guardado só no seu navegador. Nada sai do seu
          computador.
        </p>
        <h2 className="font-semibold text-sm">5 passos para começar</h2>
        <ol className="list-decimal list-inside text-sm space-y-1 text-[var(--cor-texto-suave)]">
          <li>Confira seu nome e premissas em Configurações</li>
          <li>Ajuste suas contas em Contas</li>
          <li>Cadastre seus cartões em Cartões</li>
          <li>Registre receitas e despesas em Lançamentos</li>
          <li>Monte seu orçamento em Orçamento</li>
        </ol>
        <h2 className="font-semibold text-sm">Legenda de cores</h2>
        <ul className="text-sm space-y-1">
          <li>
            <span className="etiqueta etiqueta-verde">Verde</span> dentro do plano
          </li>
          <li>
            <span className="etiqueta etiqueta-ambar">Âmbar</span> atenção
          </li>
          <li>
            <span className="etiqueta etiqueta-rosa">Rosa</span> estourou ou atrasou
          </li>
        </ul>
      </div>
    </PaginaVazia>
  );
}
