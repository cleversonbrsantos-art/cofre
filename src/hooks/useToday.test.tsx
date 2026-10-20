import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act, cleanup, waitFor } from "@testing-library/react";
import { useToday } from "./useToday";
import { db } from "../db/db";
import type { Configuracao } from "../domain/models";

function Sonda() {
  const hoje = useToday();
  return <span data-testid="hoje">{hoje}</span>;
}

const configBase: Configuracao = {
  id: 1,
  nomeUsuario: "",
  anoInicial: 2026,
  rendimentoAa: 10.5,
  inflacaoAa: 4.5,
  rendimentoMensalEq: 0.8345,
  hojeManual: null,
  limiteDestaque: 100000,
  perfilReserva: "CLT",
  atalhoOrcamento: "50/30/20",
  atalhoPersonalizado: { necessidades: 50, desejos: 30, poupanca: 20 },
};

describe("useToday — data local com reavaliação e data manual", () => {
  beforeEach(async () => {
    await db.open();
    // shouldAdvanceTime: as operações assíncronas do Dexie seguem rodando com os timers falsos
    vi.useFakeTimers({ now: new Date(2026, 9, 18, 23, 59), shouldAdvanceTime: true });
  });

  afterEach(async () => {
    cleanup();
    vi.useRealTimers();
    await db.delete();
  });

  it("sem data manual, devolve a data local do relógio e vira o dia após 2 minutos", async () => {
    await db.configuracao.put({ ...configBase, hojeManual: null });
    render(<Sonda />);
    await waitFor(() => expect(screen.getByTestId("hoje").textContent).toBe("2026-10-18"));

    act(() => {
      vi.advanceTimersByTime(2 * 60 * 1000); // 23:59 → 00:01 do dia seguinte
    });
    await waitFor(() => expect(screen.getByTestId("hoje").textContent).toBe("2026-10-19"));
  });

  it("com data manual, devolve sempre a data simulada", async () => {
    await db.configuracao.put({ ...configBase, hojeManual: "2026-03-10" });
    render(<Sonda />);
    await waitFor(() => expect(screen.getByTestId("hoje").textContent).toBe("2026-03-10"));

    act(() => {
      vi.advanceTimersByTime(2 * 60 * 1000);
    });
    expect(screen.getByTestId("hoje").textContent).toBe("2026-03-10");
  });
});
