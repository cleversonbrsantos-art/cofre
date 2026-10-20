# SPEC 3 — Correção Urgente: Dexie Schema e Criação de Lançamentos

## Objetivo
Corrigir dois bugs críticos de integração com o banco de dados Dexie que estão impedindo o uso do aplicativo.

## Bug 1: Tabelas ausentes no Schema do Dexie
**Sintoma:** Telas como o Painel (`Painel.tsx`) ficam eternamente no estado "Carregando...".
**Causa:** O arquivo `src/db/schema.ts` não está criando todas as tabelas declaradas na interface `Tabelas` do arquivo `src/db/db.ts`. Faltam as tabelas: `metas`, `parceladas`, `orcamentoPlanos`, `recorrentes`, `reservaConfig`, `paymentMethods`, `patrimonioHistorico`.
**Ação:**
1. Abra `src/db/schema.ts`.
2. Localize a última versão do banco (atualmente na v20).
3. Crie uma nova versão (v21) que declare **TODAS** as tabelas da interface `Tabelas`, com os mesmos índices da versão 1, garantindo que o banco crie os stores vazios que faltam.
4. Exemplo esperado:
```typescript
db.version(21).stores({
  // copie todas as chaves da versão 1 e adicione as que faltavam
  metas: "++id, nome",
  parceladas: "++id, cartaoId, dataCompra",
  // ...etc
});