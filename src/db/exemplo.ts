/**
 * Gerador de dados de exemplo — cerca de 6 meses de dados fictícios coerentes.
 * Nunca deve aparecer sem o usuário pedir (Configurações > "Carregar dados de exemplo").
 * ARQUIVO DE GERAÇÃO DE DADOS DE EXEMPLO — permitido exceder 400 linhas (R24).
 */
import type { db as DbTipo } from "./db";

type Db = typeof DbTipo;

export async function carregarDadosExemplo(db: Db): Promise<void> {
  const hoje = new Date();
  const ano = hoje.getFullYear();
  const mesAtual = hoje.getMonth() + 1;

  // Mês-chave dos 6 últimos meses, inclusive o atual.
  const meses: number[] = [];
  for (let i = 5; i >= 0; i--) {
    const total = ano * 12 + (mesAtual - 1) - i;
    meses.push(Math.floor(total / 12) * 100 + (total % 12) + 1);
  }

  await db.transaction(
    "rw",
    [
      db.configuracao,
      db.categorias,
      db.contas,
      db.cartoes,
      db.lancamentos,
      db.parceladas,
      db.orcamentoPlanos,
      db.orcamentoConfig,
      db.metas,
      db.reservaConfig,
      db.dividas,
      db.ativos,
      db.alvos,
      db.bensPassivos,
      db.patrimonioHistorico,
      db.contasPagar,
      db.assinaturas,
      db.recorrentes,
    ],
    async () => {
      // ---- Configuração
      await db.configuracao.put({
        id: 1,
        nomeUsuario: "Ana",
        anoInicial: ano,
        rendimentoAa: 10.5,
        inflacaoAa: 4.5,
        rendimentoMensalEq: (Math.pow(1.105, 1 / 12) - 1) * 100,
        hojeManual: null,
        limiteDestaque: 100000,
        perfilReserva: "CLT",
        atalhoOrcamento: "50/30/20",
        atalhoPersonalizado: { necessidades: 50, desejos: 30, poupanca: 20 },
      });

      // ---- Categorias (limpa e recria padrão)
      await db.categorias.clear();
      const idsCategorias = await db.categorias.bulkAdd(
        [
          { nome: "Salário", grupo: "Receita" },
          { nome: "Renda extra e freelance", grupo: "Receita" },
          { nome: "Rendimentos de investimentos", grupo: "Receita" },
          { nome: "Moradia (aluguel ou financiamento)", grupo: "Necessidade" },
          { nome: "Condomínio e IPTU", grupo: "Necessidade" },
          { nome: "Contas da casa (luz, água, gás)", grupo: "Necessidade" },
          { nome: "Internet e celular", grupo: "Necessidade" },
          { nome: "Mercado", grupo: "Necessidade" },
          { nome: "Transporte", grupo: "Necessidade" },
          { nome: "Saúde e farmácia", grupo: "Necessidade" },
          { nome: "Educação", grupo: "Necessidade" },
          { nome: "Seguros", grupo: "Necessidade" },
          { nome: "Impostos e taxas", grupo: "Necessidade" },
          { nome: "Dívidas e parcelas", grupo: "Necessidade" },
          { nome: "Filhos e família", grupo: "Necessidade" },
          { nome: "Pets", grupo: "Necessidade" },
          { nome: "Restaurantes e delivery", grupo: "Desejo" },
          { nome: "Lazer e entretenimento", grupo: "Desejo" },
          { nome: "Viagens", grupo: "Desejo" },
          { nome: "Assinaturas e streaming", grupo: "Desejo" },
          { nome: "Compras pessoais", grupo: "Desejo" },
          { nome: "Beleza e cuidados", grupo: "Desejo" },
          { nome: "Presentes e doações", grupo: "Desejo" },
          { nome: "Outros gastos", grupo: "Desejo" },
          { nome: "Reserva de emergência", grupo: "Poupança" },
          { nome: "Investimentos", grupo: "Poupança" },
          { nome: "Metas e sonhos", grupo: "Poupança" },
          { nome: "Aposentadoria", grupo: "Poupança" },
          { nome: "Transferência entre contas", grupo: "Transferência" },
          { nome: "Pagamento de fatura", grupo: "Transferência" },
        ],
        { allKeys: true },
      );
      const cat = (nome: string): number => {
        const idx = [
          "Salário",
          "Renda extra e freelance",
          "Rendimentos de investimentos",
          "Moradia (aluguel ou financiamento)",
          "Condomínio e IPTU",
          "Contas da casa (luz, água, gás)",
          "Internet e celular",
          "Mercado",
          "Transporte",
          "Saúde e farmácia",
          "Educação",
          "Seguros",
          "Impostos e taxas",
          "Dívidas e parcelas",
          "Filhos e família",
          "Pets",
          "Restaurantes e delivery",
          "Lazer e entretenimento",
          "Viagens",
          "Assinaturas e streaming",
          "Compras pessoais",
          "Beleza e cuidados",
          "Presentes e doações",
          "Outros gastos",
          "Reserva de emergência",
          "Investimentos",
          "Metas e sonhos",
          "Aposentadoria",
          "Transferência entre contas",
          "Pagamento de fatura",
        ].indexOf(nome);
        const id = idsCategorias[idx];
        if (id === undefined) throw new Error("categoria exemplo não encontrada: " + nome);
        return id;
      };

      // ---- Contas e cartões
      await db.contas.clear();
      const idsContas = await db.contas.bulkAdd(
        [
          { nome: "Conta corrente", tipo: "Corrente", saldoInicial: 150000, saldoExtrato: 212430 },
          { nome: "Poupança", tipo: "Poupança", saldoInicial: 800000, saldoExtrato: null },
          { nome: "Carteira", tipo: "Carteira", saldoInicial: 30000, saldoExtrato: null },
          { nome: "Corretora", tipo: "Investimentos", saldoInicial: 2500000, saldoExtrato: null },
        ],
        { allKeys: true },
      );
      const contaCorrente = idsContas[0];
      const poupanca = idsContas[1];
      const carteira = idsContas[2];
      const corretora = idsContas[3];

      await db.cartoes.clear();
      const idsCartoes = await db.cartoes.bulkAdd(
        [
          { nome: "Cartão prata", limite: 500000, diaFechamento: 25, diaVencimento: 5 },
          { nome: "Cartão ouro", limite: 800000, diaFechamento: 20, diaVencimento: 1 },
        ],
        { allKeys: true },
      );
      const cartaoPrata = idsCartoes[0];
      const cartaoOuro = idsCartoes[1];

      // ---- Lançamentos
      await db.lancamentos.clear();
      await db.parceladas.clear();
      const lancamentos: {
        id: number;
        data: string;
        descricao: string;
        categoriaId: number;
        valor: number;
        contaId: number | null;
        formaPagamento: "Pix" | "Débito" | "Crédito" | "Dinheiro" | "Boleto" | "Transferência" | "Débito automático" | "Outro";
        cartaoId: number | null;
        parcela: string | null;
        status: "Pago" | "Pendente";
        contaDestinoId: number | null;
        observacao: string;
      }[] = [];
      let seq = 1;
      const diaISO = (mesKeyNum: number, dia: number): string => {
        const a = Math.floor(mesKeyNum / 100);
        const m = mesKeyNum % 100;
        const dias = new Date(a, m, 0).getDate();
        const d = Math.min(dia, dias);
        return `${a}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      };
      const add = (
        mesKeyNum: number,
        dia: number,
        descricao: string,
        categoriaNome: string,
        valor: number,
        conta: number | null,
        forma: "Pix" | "Débito" | "Crédito" | "Dinheiro" | "Boleto" | "Transferência" | "Débito automático" | "Outro",
        cartao: number | null = null,
        status: "Pago" | "Pendente" = "Pago",
        destino: number | null = null,
      ): void => {
        lancamentos.push({
          id: seq++,
          data: diaISO(mesKeyNum, dia),
          descricao,
          categoriaId: cat(categoriaNome),
          valor,
          contaId: conta,
          formaPagamento: forma,
          cartaoId: cartao,
          parcela: null,
          status,
          contaDestinoId: destino,
          observacao: "",
        });
      };

      for (let i = 0; i < meses.length; i++) {
        const m = meses[i];
        // Receitas
        add(m, 5, "Salário", "Salário", 850000, contaCorrente, "Transferência");
        if (i % 2 === 0) add(m, 18, "Projeto freelance", "Renda extra e freelance", 120000, contaCorrente, "Pix");
        add(m, 20, "Rendimento CDB", "Rendimentos de investimentos", 18500, corretora, "Transferência");
        // Necessidades
        add(m, 10, "Aluguel", "Moradia (aluguel ou financiamento)", 180000, contaCorrente, "Pix");
        add(m, 10, "Condomínio", "Condomínio e IPTU", 45000, contaCorrente, "Boleto");
        add(m, 12, "Luz", "Contas da casa (luz, água, gás)", 18000, contaCorrente, "Boleto");
        add(m, 12, "Água", "Contas da casa (luz, água, gás)", 9000, contaCorrente, "Boleto");
        add(m, 15, "Internet fibra", "Internet e celular", 12000, contaCorrente, "Débito automático");
        add(m, 8, "Mercado do mês", "Mercado", 120000, contaCorrente, "Débito");
        add(m, 20, "Mercado complementar", "Mercado", 65000, cartaoPrata, "Crédito");
        add(m, 22, "Combustível", "Transporte", 45000, carteira, "Dinheiro");
        add(m, 14, "Farmácia", "Saúde e farmácia", 32000, cartaoPrata, "Crédito");
        add(m, 16, "Curso de inglês", "Educação", 38000, contaCorrente, "Boleto");
        add(m, 3, "Plano de saúde", "Seguros", 42000, contaCorrente, "Débito automático");
        add(m, 25, "Veterinário", "Pets", 15000, carteira, "Dinheiro");
        // Desejos (variação para o gráfico)
        const extraDesejo = i * 8000;
        add(m, 7, "Pizzaria", "Restaurantes e delivery", 8500 + extraDesejo, cartaoPrata, "Crédito");
        add(m, 13, "Cinema", "Lazer e entretenimento", 6000, cartaoPrata, "Crédito");
        add(m, 17, "Delivery sábado", "Restaurantes e delivery", 7800, cartaoOuro, "Crédito");
        add(m, 21, "Streaming família", "Assinaturas e streaming", 7990, cartaoOuro, "Crédito");
        add(m, 24, "Presente aniversário", "Presentes e doações", 15000, cartaoOuro, "Crédito");
        add(m, 27, "Roupas", "Compras pessoais", 22000 + extraDesejo, cartaoOuro, "Crédito");
        // Poupança
        add(m, 6, "Aporte reserva", "Reserva de emergência", 60000, contaCorrente, "Transferência", null, "Pago", poupanca);
        add(m, 6, "Aporte investimentos", "Investimentos", 100000, contaCorrente, "Transferência", null, "Pago", corretora);
        add(m, 6, "Aporte aposentadoria", "Aposentadoria", 30000, contaCorrente, "Transferência", null, "Pago", corretora);
        // Transferência entre contas
        add(m, 9, "Reserva para gastos", "Transferência entre contas", 40000, contaCorrente, "Transferência", null, "Pago", carteira);
        // Um lançamento pendente no mês atual
        if (i === meses.length - 1) {
          add(m, 28, "Conta de luz (prevista)", "Contas da casa (luz, água, gás)", 19000, contaCorrente, "Boleto", null, "Pendente");
        }
      }
      await db.lancamentos.bulkAdd(lancamentos);

      // ---- Compras parceladas (2 cartões)
      const mesAtualK = meses[meses.length - 1];
      await db.parceladas.bulkAdd([
        {
          descricao: "Notebook",
          cartaoId: cartaoPrata,
          categoriaId: cat("Compras pessoais"),
          dataCompra: diaISO(mesAtualK, 20),
          valorTotal: 480000,
          numeroParcelas: 10,
        },
        {
          descricao: "Jogo de panelas",
          cartaoId: cartaoOuro,
          categoriaId: cat("Outros gastos"),
          dataCompra: diaISO(meses[3], 15),
          valorTotal: 36000,
          numeroParcelas: 3,
        },
      ]);

      // ---- Orçamento do mês atual
      const plano = [
        { c: "Mercado", v: 180000 },
        { c: "Moradia (aluguel ou financiamento)", v: 180000 },
        { c: "Condomínio e IPTU", v: 45000 },
        { c: "Contas da casa (luz, água, gás)", v: 28000 },
        { c: "Internet e celular", v: 12000 },
        { c: "Transporte", v: 50000 },
        { c: "Saúde e farmácia", v: 35000 },
        { c: "Educação", v: 38000 },
        { c: "Restaurantes e delivery", v: 25000 },
        { c: "Lazer e entretenimento", v: 15000 },
        { c: "Assinaturas e streaming", v: 8000 },
        { c: "Compras pessoais", v: 40000 },
        { c: "Reserva de emergência", v: 60000 },
        { c: "Investimentos", v: 100000 },
      ];
      await db.orcamentoPlanos.clear();
      await db.orcamentoPlanos.bulkAdd(
        plano.map((p) => ({ mesKey: mesAtualK, categoriaId: cat(p.c), valor: p.v })),
      );
      await db.orcamentoConfig.put({
        id: 1,
        mesKey: mesAtualK,
        rendaReferencia: 970000,
        atalho: "50/30/20",
        usarSugestoes: false,
      });

      // ---- Metas
      await db.metas.bulkAdd([
        {
          nome: "Viagem à praia",
          valorAlvo: 800000,
          prazo: diaISO(mesAtualK, 15).replace(/^\d{4}/, String(ano + 1)),
          jaGuardado: 240000,
          aporteMensal: 50000,
          rendimentoAa: null,
        },
        {
          nome: "Trocar o carro",
          valorAlvo: 6000000,
          prazo: null,
          jaGuardado: 900000,
          aporteMensal: 150000,
          rendimentoAa: 9.0,
        },
        {
          nome: "Notebook novo",
          valorAlvo: 800000,
          prazo: null,
          jaGuardado: 100000,
          aporteMensal: 0,
          rendimentoAa: null,
        },
      ]);

      // ---- Reserva
      await db.reservaConfig.put({
        id: 1,
        perfil: "CLT",
        mesesAjustados: null,
        contaId: poupanca,
        gastoEssencialManual: null,
        aporteMensal: 60000,
      });

      // ---- Dívidas
      await db.dividas.bulkAdd([
        { nome: "Cartão rolado", saldoDevedor: 320000, jurosMes: 9.9, parcelaMinima: 40000 },
        { nome: "Empréstimo banco", saldoDevedor: 850000, jurosMes: 2.5, parcelaMinima: 120000 },
        { nome: "Financiamento moto", saldoDevedor: 450000, jurosMes: 1.8, parcelaMinima: 75000 },
      ]);

      // ---- Investimentos e alvos
      await db.ativos.bulkAdd([
        { nome: "CDB liquidez diária", classe: "Renda fixa", totalAportado: 1500000, valorAtual: 1620000, quantidade: 150 },
        { nome: "Tesouro Selic", classe: "Renda fixa", totalAportado: 800000, valorAtual: 842000, quantidade: 80 },
        { nome: "ETF ações Brasil", classe: "Ações", totalAportado: 500000, valorAtual: 565000, quantidade: 50 },
        { nome: "FII shoppings", classe: "FIIs", totalAportado: 300000, valorAtual: 318000, quantidade: 30 },
        { nome: "Bitcoin", classe: "Cripto", totalAportado: 150000, valorAtual: 189000, quantidade: 0.5 },
      ]);
      await db.alvos.bulkAdd([
        { classe: "Renda fixa", percentual: 60 },
        { classe: "Ações", percentual: 20 },
        { classe: "FIIs", percentual: 10 },
        { classe: "Cripto", percentual: 5 },
        { classe: "Exterior", percentual: 5 },
        { classe: "Outros", percentual: 0 },
      ]);

      // ---- Bens e passivos
      await db.bensPassivos.bulkAdd([
        { nome: "Carro", valor: 4500000 },
        { nome: "Notebook atual", valor: 300000 },
        { nome: "Financiamento da moto", valor: -450000 },
      ]);

      // ---- Histórico de patrimônio
      await db.patrimonioHistorico.bulkAdd(
        meses.map((m, i) => ({
          mesKey: m,
          ativos: 3200000 + i * 180000,
          passivos: 1600000 - i * 40000,
        })),
      );

      // ---- Contas a pagar
      await db.contasPagar.bulkAdd([
        {
          descricao: "IPTU parcela",
          vencimento: diaISO(mesAtualK, 15),
          valor: 32000,
          categoriaId: cat("Impostos e taxas"),
          status: "",
          formaPagamento: "Boleto",
        },
        {
          descricao: "Plano de saúde",
          vencimento: diaISO(mesAtualK, 3),
          valor: 42000,
          categoriaId: cat("Seguros"),
          status: "",
          formaPagamento: "Débito automático",
        },
        {
          descricao: "Escola das crianças",
          vencimento: diaISO(mesAtualK, 10),
          valor: 98000,
          categoriaId: cat("Educação"),
          status: "Paga",
          formaPagamento: "Pix",
        },
      ]);

      // ---- Assinaturas
      await db.assinaturas.bulkAdd([
        {
          servico: "Streaming de vídeo",
          valor: 5590,
          ciclo: "Mensal",
          proximaRenovacao: diaISO(mesAtualK, 22),
          categoriaId: cat("Assinaturas e streaming"),
        },
        {
          servico: "Streaming de música",
          valor: 2190,
          ciclo: "Mensal",
          proximaRenovacao: diaISO(mesAtualK, 8),
          categoriaId: cat("Assinaturas e streaming"),
        },
        {
          servico: "Nuvem de fotos",
          valor: 29900,
          ciclo: "Anual",
          proximaRenovacao: diaISO(mesAtualK, 19),
          categoriaId: cat("Assinaturas e streaming"),
        },
      ]);

      // ---- Recorrentes
      await db.recorrentes.bulkAdd([
        {
          descricao: "Aluguel",
          categoriaId: cat("Moradia (aluguel ou financiamento)"),
          valorMensal: 180000,
          diaMes: 10,
          inicio: null,
          fim: null,
        },
        {
          descricao: "Salário",
          categoriaId: cat("Salário"),
          valorMensal: 850000,
          diaMes: 5,
          inicio: null,
          fim: null,
        },
        {
          descricao: "Aporte mensal investimentos",
          categoriaId: cat("Investimentos"),
          valorMensal: 100000,
          diaMes: 6,
          inicio: null,
          fim: null,
        },
      ]);
    },
  );
}
