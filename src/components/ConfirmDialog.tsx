import { useEffect, useRef } from "react";

interface ConfirmDialogProps {
  titulo: string;
  mensagem: string;
  onConfirmar: () => void;
  onFechar: () => void;
  rotuloConfirmar?: string;
}

export function ConfirmDialog({ titulo, mensagem, onConfirmar, onFechar, rotuloConfirmar = "Excluir" }: ConfirmDialogProps) {
  const botaoCancelarRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    botaoCancelarRef.current?.focus();
    const aoApertarTecla = (evento: KeyboardEvent) => {
      if (evento.key === "Escape") {
        onFechar();
      }
    };
    window.addEventListener("keydown", aoApertarTecla);
    return () => window.removeEventListener("keydown", aoApertarTecla);
  }, [onFechar]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div
        role="alertdialog"
        aria-modal="true"
        aria-label={titulo}
        className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg dark:bg-zinc-800"
      >
        <h2 className="mb-2 text-lg font-semibold text-zinc-900 dark:text-zinc-50">{titulo}</h2>
        <p className="mb-6 text-sm text-zinc-600 dark:text-zinc-300">{mensagem}</p>
        <div className="flex justify-end gap-3">
          <button
            ref={botaoCancelarRef}
            type="button"
            onClick={onFechar}
            className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-600 dark:text-zinc-200 dark:hover:bg-zinc-700"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirmar}
            className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
          >
            {rotuloConfirmar}
          </button>
        </div>
      </div>
    </div>
  );
}
