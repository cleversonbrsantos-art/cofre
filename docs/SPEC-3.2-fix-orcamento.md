# SPEC 3.2 — Correção do Carregamento Infinito no Orçamento

## Objetivo
Corrigir o bug em que a tela de Orçamento (`src/pages/Orcamento.tsx`) fica eternamente no estado "Carregando..." em um banco de dados novo.

## Contexto
Conforme observado na seção 11 do relatório da SPEC 3, a tela de Orçamento faz `db.orcamentoConfig.get(1)`. Como o banco novo não cria essa linha por padrão, a query retorna `undefined`, e o guard do componente trava a renderização.

## Ação Exigida
1. Abra o arquivo `src/db/db.ts`.
2. Localize a função `inicializarBanco()`.
3. Adicione a criação da linha padrão da tabela `orcamentoConfig` (assim como foi feito para `reservaConfig` na SPEC 3).
   *Use o ID `1` e os valores padrão (provavelmente existe um objeto de configuração inicial ou você pode criar um com os campos vazios/zerados esperados pela interface).*
4. Verifique se as telas que usam `orcamentoConfig.get(1)` agora conseguem renderizar com segurança.

## Critérios de Aceite
1. `npm run build` e `npm run lint` passam sem erros.
2. Em um banco de dados vazio, a tela de Orçamento carrega imediatamente (mostrando o estado vazio ou os dados zerados, mas sem travar).