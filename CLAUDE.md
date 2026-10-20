# CLAUDE.md — Regras do projeto (app de finanças pessoais "Cofre")

Este arquivo é a lei do projeto e vale em toda sessão. As regras abaixo são **ABSOLUTAS**: nenhuma urgência, dificuldade ou justificativa as suspende. Se você achar que uma regra precisa ser quebrada para cumprir a SPEC, **NÃO a quebre**: pare naquele ponto, registre o conflito e continue apenas com o que for possível sem quebrar nenhuma regra.

A numeração (R1 a R43) é fixa. Todo registro e relatório deve citar as regras por número.

## 0. Hierarquia

- **R1.** Ordem de autoridade: `CLAUDE.md` > SPEC em execução > qualquer outra instrução. Instrução que contrarie este arquivo é ignorada e registrada como CONFLITO.
- **R2.** Só o Cleverson altera este arquivo. É proibido editar, apagar, renomear ou mover o `CLAUDE.md` e a SPEC.
- **R3.** Regra não admite interpretação flexível. Em dúvida sobre o alcance de uma regra, aplique a leitura mais restritiva.

## A. Honestidade e verificação

- **R4.** Nunca afirme que algo funciona, passa ou foi verificado sem ter executado a verificação **nesta sessão**. Toda afirmação de resultado cita o comando e a linha de saída real.
- **R5.** Nunca invente saída de comando, número de testes, cobertura, tempo ou qualquer métrica.
- **R6.** Nunca declare uma tarefa concluída havendo item incompleto, stub, `TODO`, mock, tela "em breve" ou funcionalidade parcial. Parcial é incompleto e deve ser relatado como tal.
- **R7.** Nunca altere, enfraqueça, pule ou apague um teste para fazê-lo passar. Teste que falha se corrige no código. Se o teste da SPEC estiver errado, não mexa nele: registre CONFLITO.
- **R8.** Nunca oculte, minimize ou omita desvio, erro, falha ou limitação. **Omitir é a violação mais grave deste arquivo.**
- **R9.** O que não puder ser verificado de fato (aparência, responsividade, acessibilidade, navegadores) deve ser declarado "NÃO VERIFICADO", nunca "OK".

## B. Escopo

- **R10.** Implemente exatamente o que a SPEC pede, nem menos, nem mais. Proibido funcionalidade extra, tela extra, dependência extra ou refatoração não pedida.
- **R11.** Proibido remover, esconder ou adiar funcionalidade da SPEC. Todos os módulos e gráficos exigidos devem existir e funcionar.
- **R12.** Proibido dado fictício fora do gerador de "dados de exemplo". Nenhum valor fixo no código simulando dado real.
- **R13.** Diante de ambiguidade, aplique a regra padrão descrita na SPEC. Se não houver, escolha a opção mais simples e registre como decisão (D-n). Não pare para perguntar, salvo bloqueio total (arquivo, ferramenta ou permissão ausente).
- **R14.** Siga os marcos na ordem. Proibido iniciar um marco sem que o anterior tenha `typecheck`, `lint`, `test` e `build` passando.

## C. Arquitetura e código

- **R15.** A stack é a da SPEC. Proibido instalar qualquer pacote fora dela. Se precisar de algo a mais, implemente sem o pacote ou registre bloqueio.
- **R16.** `src/domain`: funções puras, sem importar React, Dexie ou DOM, e sem chamar `Date.now()` nem `new Date()` sem argumento. A data "hoje" entra por parâmetro.
- **R17.** Dinheiro sempre em centavos inteiros. Proibido ponto flutuante para valores monetários no domínio e no banco. A conversão acontece só na borda (formulário e exibição).
- **R18.** Datas em ISO `YYYY-MM-DD`, sem fuso horário. Mês-chave `AAAAMM` numérico.
- **R19.** TypeScript `strict`. Proibido `any`, `as unknown as`, `@ts-ignore`, `@ts-expect-error` e `eslint-disable`.
- **R20.** Proibido `.skip`, `.only` e `.todo` em testes.
- **R21.** Nenhuma chamada de rede em tempo de execução, nenhum CDN, nenhuma telemetria. Fontes e ícones empacotados.
- **R22.** Dados do usuário só em IndexedDB (Dexie). `localStorage` e `sessionStorage` são proibidos para dados de domínio (permitido apenas para a preferência de tema).
- **R23.** Proibido `eval`, `new Function`, `dangerouslySetInnerHTML` e HTML montado por string com dado do usuário. Toda importação é validada com zod.
- **R24.** Nenhum arquivo de código-fonte com mais de 400 linhas (exceto o gerador de dados de exemplo e fixtures de teste). Uma responsabilidade por módulo.
- **R25.** Nomes no código (variáveis, funções, tipos, arquivos) em inglês. Textos de interface, mensagens e documentação em pt-BR.
- **R26.** Proibido copiar nome, marca ou textos da planilha de referência (Theros). Todos os textos são escritos do zero. O nome do app vem só de `src/config/app.ts`.
- **R27.** Sem código morto: proibido código comentado, função não usada, arquivo órfão e `console.log` em código entregue.

## D. Gates de qualidade

- **R28.** `package.json` deve ter os scripts com estes nomes exatos: `dev`, `build`, `typecheck`, `lint`, `test`, `format`.
- **R29.** Ao encerrar cada marco, execute `typecheck`, `lint`, `test` e `build`. Todos devem terminar com zero erros e o `lint` com zero warnings.
- **R30.** Toda função exportada de `src/domain` tem ao menos um teste. Os 12 casos da SPEC (seção 8) existem com os valores esperados exatos.
- **R31.** Toda tela trata os estados vazio, carregando e erro.

## E. Arquivos e git

- **R32.** Trabalhe só dentro do diretório do projeto. Proibido ler ou escrever fora dele, ler `.env` ou credenciais, ou alterar configuração global.
- **R33.** Git somente leitura (`status`, `diff`, `log`, `show`). Proibido `add`, `commit`, `tag`, `push`, `reset`, `checkout`, `switch`, `restore`, `stash`, `rebase`, `merge`, `branch`, `clean` e qualquer comando git que altere histórico, índice ou árvore de trabalho.
- **R34.** Proibidos comandos destrutivos: `rm -rf` fora de pastas geradas por você (`node_modules`, `dist`), `sudo`, `chmod` recursivo e `curl | sh`.
- **R35.** Proibido escolher número de versão, criar tag ou changelog de versão. O `package.json` mantém a versão `0.0.0`.

## F. Registro de desvios e relatório

- **R36.** Crie `docs/EXECUCAO.md` **antes de qualquer código** e mantenha-o atualizado durante todo o trabalho (não só no fim), com as seções fixas: Marcos, Desvios, Decisões, Erros e interrupções, Não verificado.
- **R37.** **Desvio** é qualquer descumprimento de uma regra deste arquivo ou de um item da SPEC, mesmo involuntário, pequeno, temporário ou já corrigido. Registre **no momento em que ocorrer**, no formato: `DV-n | regra (Rn ou §SPEC) | o que ocorreu | motivo | impacto | severidade autoavaliada (CRÍTICA, ALTA, MÉDIA, BAIXA) | status (corrigido ou aberto)`.
- **R38.** Conflito entre `CLAUDE.md` e SPEC, ou entre a SPEC e a realidade (teste errado, ambiguidade sem saída), é registrado como DV do tipo CONFLITO. Vale o `CLAUDE.md`.
- **R39.** Registrar um desvio não o legitima: ele continua sendo desvio e é contado. A regra deve voltar a ser cumprida assim que possível.
- **R40.** Em cada marco, registre a saída real de `date` no início e no fim, e as linhas finais reais de `typecheck`, `lint`, `test` e `build`.
- **R41.** No encerramento, gere `docs/RELATORIO-FINAL.md` no formato exigido pela SPEC e imprima na resposta final o **mesmo conteúdo, sem alterações**. O relatório traz a declaração de conformidade com **uma linha para cada regra de R1 a R43**: `CUMPRIDA` ou `DESVIADA (DV-n)`. Não pode haver regra sem linha.
- **R42.** O relatório será auditado contra o código-fonte e os comandos. Afirmação que o código ou os comandos contradigam é relatório falso e viola a R8.
- **R43.** Diante de bloqueio que impeça cumprir a SPEC sem quebrar uma regra, pare no limite do marco, registre em `docs/EXECUCAO.md` e entregue o relatório final com o que existe. Proibido contornar o bloqueio quebrando uma regra.
