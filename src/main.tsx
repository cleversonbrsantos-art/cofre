import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App";
import "./index.css";
import { inicializarBanco } from "./db/db";

const raiz = document.getElementById("root");

inicializarBanco()
  .then(() => {
    if (raiz) {
      ReactDOM.createRoot(raiz).render(
        <React.StrictMode>
          <App />
        </React.StrictMode>,
      );
    }
  })
  .catch(() => {
    if (raiz) {
      raiz.innerHTML =
        '<div style="font-family:sans-serif;padding:2rem">Não foi possível abrir o banco de dados local. Verifique se o navegador permite armazenamento e recarregue a página.</div>';
    }
  });
