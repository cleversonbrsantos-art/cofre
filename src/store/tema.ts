import { create } from "zustand";

export type Tema = "claro" | "escuro" | "sistema";

interface EstadoTema {
  tema: Tema;
  definirTema: (tema: Tema) => void;
}

function lerTemaSalvo(): Tema {
  try {
    const salvo = localStorage.getItem("cofre.tema");
    if (salvo === "claro" || salvo === "escuro" || salvo === "sistema") return salvo;
  } catch {
    // localStorage indisponível: usa padrão
  }
  return "sistema";
}

export const useTemaStore = create<EstadoTema>((set) => ({
  tema: lerTemaSalvo(),
  definirTema: (tema) => {
    try {
      localStorage.setItem("cofre.tema", tema);
    } catch {
      // sem persistência disponível
    }
    set({ tema });
  },
}));

/** Aplica o tema no elemento raiz. Chamar no boot e quando o tema muda. */
export function aplicarTema(tema: Tema): void {
  const raiz = document.documentElement;
  const escuroDoSistema = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const escuro = tema === "escuro" || (tema === "sistema" && escuroDoSistema);
  raiz.dataset.theme = escuro ? "dark" : "light";
  raiz.style.colorScheme = escuro ? "dark" : "light";
}
