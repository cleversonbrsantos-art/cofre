import { useState } from "react";
import { NavLink } from "react-router-dom";
import { APP } from "../config/app";
import { ITENS_MENU } from "./menu";

interface Props {
  children: React.ReactNode;
  tema: "claro" | "escuro";
  alternarTema: () => void;
}

export function AppShell({ children, tema, alternarTema }: Props) {
  const [aberta, setAberta] = useState(true);

  return (
    <div className="flex h-full">
      {/* Sidebar desktop */}
      <aside
        className={`hidden md:flex flex-col shrink-0 border-r bg-[var(--cor-superficie)] transition-[width] duration-200 ${
          aberta ? "w-56" : "w-16"
        }`}
      >
        <div className="flex items-center gap-2 px-4 h-14 border-b">
          <span
            className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-white text-sm font-bold"
            style={{ backgroundColor: "var(--cor-destaque)" }}
          >
            C
          </span>
          {aberta && <span className="font-semibold text-sm">{APP.nome}</span>}
        </div>
        <nav className="flex-1 overflow-y-auto py-2">
          {ITENS_MENU.map((item) => (
            <NavLink
              key={item.rota}
              to={item.rota}
              className={({ isActive }) =>
                `block px-4 py-2 text-sm transition-colors ${
                  isActive
                    ? "font-semibold"
                    : "text-[var(--cor-texto-suave)] hover:text-[var(--cor-texto)]"
                }`
              }
              style={({ isActive }) =>
                isActive ? { backgroundColor: "var(--cor-destaque-suave)", color: "var(--cor-destaque-forte)" } : {}
              }
            >
              {aberta ? item.rotulo : item.curto.slice(0, 2)}
            </NavLink>
          ))}
        </nav>
        <div className="border-t p-2 flex items-center justify-between">
          <button
            type="button"
            className="botao botao-secundario w-full"
            onClick={alternarTema}
            aria-label={tema === "claro" ? "Ativar tema escuro" : "Ativar tema claro"}
          >
            {tema === "claro" ? "Escuro" : "Claro"}
          </button>
        </div>
        <div className="p-2">
          <button
            type="button"
            className="botao botao-secundario w-full"
            onClick={() => setAberta(!aberta)}
            aria-label={aberta ? "Recolher menu" : "Expandir menu"}
          >
            {aberta ? "‹" : "›"}
          </button>
        </div>
      </aside>

      {/* Conteúdo */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="md:hidden flex items-center justify-between h-14 px-4 border-b bg-[var(--cor-superficie)]">
          <span className="font-semibold">{APP.nome}</span>
          <button
            type="button"
            className="botao botao-secundario"
            onClick={alternarTema}
            aria-label={tema === "claro" ? "Ativar tema escuro" : "Ativar tema claro"}
          >
            {tema === "claro" ? "Escuro" : "Claro"}
          </button>
        </header>
        <main className="flex-1 overflow-y-auto p-4 pb-20 md:pb-4">{children}</main>
      </div>

      {/* Menu inferior mobile */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-10 flex border-t bg-[var(--cor-superficie)]">
        {ITENS_MENU.slice(0, 5).map((item) => (
          <NavLink
            key={item.rota}
            to={item.rota}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center py-2 text-[11px] ${
                isActive ? "font-semibold" : "text-[var(--cor-texto-suave)]"
              }`
            }
            style={({ isActive }) =>
              isActive ? { color: "var(--cor-destaque-forte)" } : {}
            }
          >
            {item.curto}
          </NavLink>
        ))}
        <NavLink
          to="/configuracoes"
          className="flex-1 flex flex-col items-center py-2 text-[11px] text-[var(--cor-texto-suave)]"
        >
          Menu
        </NavLink>
      </nav>
    </div>
  );
}
