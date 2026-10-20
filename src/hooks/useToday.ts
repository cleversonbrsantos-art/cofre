import { useEffect, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../db/db";
import { todayLocalISO } from "../lib/localDate";

/**
 * Data "hoje" do app (C2): a data simulada (hojeManual na configuração) ou a data local do dia.
 * Sem data manual, reavalia a cada 60 s e nos eventos visibilitychange/focus;
 * só re-renderiza quando a string muda.
 */
export function useToday(): string {
  const hojeManual = useLiveQuery(async () => (await db.configuracao.get(1))?.hojeManual ?? null, []);
  const [hojeLocal, setHojeLocal] = useState(() => todayLocalISO());

  useEffect(() => {
    const atualizar = () => {
      const hoje = todayLocalISO();
      setHojeLocal((anterior) => (anterior === hoje ? anterior : hoje));
    };
    const intervalo = setInterval(atualizar, 60_000);
    const aoFicarVisivel = () => {
      if (document.visibilityState === "visible") atualizar();
    };
    document.addEventListener("visibilitychange", aoFicarVisivel);
    window.addEventListener("focus", atualizar);
    return () => {
      clearInterval(intervalo);
      document.removeEventListener("visibilitychange", aoFicarVisivel);
      window.removeEventListener("focus", atualizar);
    };
  }, []);

  return hojeManual ?? hojeLocal;
}
