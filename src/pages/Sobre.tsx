import { PaginaVazia } from "../components/PaginaVazia";
import { APP } from "../config/app";

export function PaginaSobre() {
  return (
    <PaginaVazia titulo="Sobre">
      <div className="cartao p-6 space-y-4 max-w-2xl text-sm">
        <p>
          <strong>{APP.nome}</strong> versão {APP.versao} — {APP.descricao}
        </p>
        <div>
          <h2 className="font-semibold mb-1">Limites e avisos</h2>
          <ul className="list-disc list-inside space-y-1 text-[var(--cor-texto-suave)]">
            <li>
              Este aplicativo <strong>não é consultoria financeira</strong>. As informações são
              organização dos seus próprios dados.
            </li>
            <li>
              Simulações (juros compostos, independência financeira, dívidas) são{" "}
              <strong>estimativas</strong> baseadas nas premissas que você informou. Rendimentos
              reais podem variar.
            </li>
            <li>
              Os dados ficam somente no armazenamento local do navegador (IndexedDB). Limpar os
              dados do navegador apaga o app. Faça backups periódicos em Configurações → Exportar
              JSON.
            </li>
            <li>Sem servidor, sem login e sem envio de dados a terceiros.</li>
          </ul>
        </div>
      </div>
    </PaginaVazia>
  );
}
