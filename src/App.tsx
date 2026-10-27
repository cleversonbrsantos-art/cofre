import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppShell } from "./components/AppShell";
import { useTemaStore, aplicarTema } from "./store/tema";
import { PaginaInicio } from "./pages/Inicio";
import { PaginaPainel } from "./pages/Painel";
import { PaginaLancamentos } from "./pages/Lancamentos";
import { PaginaContas } from "./pages/Contas";
import { PaginaCartoes } from "./pages/Cartoes";
import { PaginaParcelados } from "./pages/Parcelados";
import { PaginaOrcamento } from "./pages/Orcamento";
import { PaginaFluxo } from "./pages/Fluxo";
import { PaginaDiaADia } from "./pages/DiaADia";
import { PaginaRecorrentes } from "./pages/Recorrentes";
import { PaginaMetas } from "./pages/Metas";
import { PaginaReserva } from "./pages/Reserva";
import { PaginaDividas } from "./pages/Dividas";
import { PaginaInvestimentos } from "./pages/Investimentos";
import { PaginaProventos } from "./pages/Proventos";
import { PaginaContasAPagar } from "./pages/ContasAPagar";
import { PaginaAssinaturas } from "./pages/Assinaturas";
import { PaginaSimuladores } from "./pages/Simuladores";
import { PaginaConfiguracoes } from "./pages/Configuracoes";
import { PaginaSobre } from "./pages/Sobre";

export function App() {
  const tema = useTemaStore((s) => s.tema);
  const definirTema = useTemaStore((s) => s.definirTema);

  useEffect(() => {
    aplicarTema(tema);
  }, [tema]);

  const alternar = () => definirTema(tema === "claro" ? "escuro" : "claro");

  return (
    <BrowserRouter>
      <AppShell tema={tema === "escuro" ? "escuro" : "claro"} alternarTema={alternar}>
        <Routes>
          <Route path="/" element={<Navigate to="/inicio" replace />} />
          <Route path="/inicio" element={<PaginaInicio />} />
          <Route path="/painel" element={<PaginaPainel />} />
          <Route path="/lancamentos" element={<PaginaLancamentos />} />
          <Route path="/contas" element={<PaginaContas />} />
          <Route path="/cartoes" element={<PaginaCartoes />} />
          <Route path="/parcelados" element={<PaginaParcelados />} />
          <Route path="/orcamento" element={<PaginaOrcamento />} />
          <Route path="/fluxo" element={<PaginaFluxo />} />
          <Route path="/dia-a-dia" element={<PaginaDiaADia />} />
          <Route path="/recorrentes" element={<PaginaRecorrentes />} />
          <Route path="/metas" element={<PaginaMetas />} />
          <Route path="/reserva" element={<PaginaReserva />} />
          <Route path="/dividas" element={<PaginaDividas />} />
          <Route path="/investimentos" element={<PaginaInvestimentos />} />
          <Route path="/proventos" element={<PaginaProventos />} />
          <Route path="/contas-a-pagar" element={<PaginaContasAPagar />} />
          <Route path="/assinaturas" element={<PaginaAssinaturas />} />
          <Route path="/simuladores" element={<PaginaSimuladores />} />
          <Route path="/configuracoes" element={<PaginaConfiguracoes />} />
          <Route path="/sobre" element={<PaginaSobre />} />
          <Route path="*" element={<Navigate to="/inicio" replace />} />
        </Routes>
      </AppShell>
    </BrowserRouter>
  );
}
