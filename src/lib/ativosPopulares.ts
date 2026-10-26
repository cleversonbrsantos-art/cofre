/**
 * Lista estática de ativos populares para autocomplete.
 * Não depende de API externa — evita rate limit e funciona offline.
 * Fonte: maiores empresas da B3 por liquidez + principais criptomoedas.
 */

export interface AtivoPopular {
  ticker: string;
  nome: string;
  classe: "Ações" | "FIIs" | "Cripto" | "ETFs" | "BDRs";
}

export const ATIVOS_POPULARES: AtivoPopular[] = [
  // Ações - Grandes bancos
  { ticker: "ITUB4", nome: "Itaú Unibanco PN", classe: "Ações" },
  { ticker: "BBDC4", nome: "Bradesco PN", classe: "Ações" },
  { ticker: "BBAS3", nome: "Banco do Brasil ON", classe: "Ações" },
  { ticker: "SANB11", nome: "Santander Brasil Units", classe: "Ações" },
  { ticker: "BPAC11", nome: "BTG Pactual Units", classe: "Ações" },

  // Ações - Petróleo e Gás
  { ticker: "PETR4", nome: "Petrobras PN", classe: "Ações" },
  { ticker: "PETR3", nome: "Petrobras ON", classe: "Ações" },
  { ticker: "PRIO3", nome: "PRIO ON", classe: "Ações" },
  { ticker: "RRRP3", nome: "3R Petroleum ON", classe: "Ações" },
  { ticker: "RECV3", nome: "PetroReconcavo ON", classe: "Ações" },

  // Ações - Mineração e Siderurgia
  { ticker: "VALE3", nome: "Vale ON", classe: "Ações" },
  { ticker: "CSNA3", nome: "CSN ON", classe: "Ações" },
  { ticker: "GGBR4", nome: "Gerdau PN", classe: "Ações" },
  { ticker: "USIM5", nome: "Usiminas PNA", classe: "Ações" },
  { ticker: "GOAU4", nome: "Gerdau Met. PN", classe: "Ações" },

  // Ações - Varejo e Consumo
  { ticker: "MGLU3", nome: "Magazine Luiza ON", classe: "Ações" },
  { ticker: "AMER3", nome: "Americanas ON", classe: "Ações" },
  { ticker: "VIIA3", nome: "Via ON", classe: "Ações" },
  { ticker: "LREN3", nome: "Lojas Renner ON", classe: "Ações" },
  { ticker: "PETZ3", nome: "Petz ON", classe: "Ações" },
  { ticker: "RENT3", nome: "Localiza ON", classe: "Ações" },
  { ticker: "RAIL3", nome: "Rumo ON", classe: "Ações" },

  // Ações - Alimentos e Bebidas
  { ticker: "ABEV3", nome: "Ambev ON", classe: "Ações" },
  { ticker: "JBS3", nome: "JBS ON", classe: "Ações" },
  { ticker: "BRFS3", nome: "BRF ON", classe: "Ações" },
  { ticker: "MRFG3", nome: "Marfrig ON", classe: "Ações" },
  { ticker: "BEEF3", nome: "Minerva ON", classe: "Ações" },
  { ticker: "SMTO3", nome: "São Martinho ON", classe: "Ações" },

  // Ações - Energia Elétrica
  { ticker: "ELET3", nome: "Eletrobras ON", classe: "Ações" },
  { ticker: "ELET6", nome: "Eletrobras PNB", classe: "Ações" },
  { ticker: "CMIG4", nome: "Cemig PN", classe: "Ações" },
  { ticker: "TAEE11", nome: "Taesa Units", classe: "Ações" },
  { ticker: "CPLE6", nome: "Copel PNB", classe: "Ações" },
  { ticker: "ENGI11", nome: "Engie Brasil Units", classe: "Ações" },
  { ticker: "EQTL3", nome: "Equatorial ON", classe: "Ações" },
  { ticker: "SBSP3", nome: "Sabesp ON", classe: "Ações" },

  // Ações - Papel e Celulose
  { ticker: "SUZB3", nome: "Suzano ON", classe: "Ações" },
  { ticker: "KLBN11", nome: "Klabin Units", classe: "Ações" },

  // Ações - Saúde
  { ticker: "RADL3", nome: "RaiaDrogasil ON", classe: "Ações" },
  { ticker: "HAPV3", nome: "Hapvida ON", classe: "Ações" },
  { ticker: "FLRY3", nome: "Fleury ON", classe: "Ações" },
  { ticker: "QUAL3", nome: "Qualicorp ON", classe: "Ações" },

  // Ações - Tecnologia e Telecomunicações
  { ticker: "VIVT3", nome: "Telefônica Brasil ON", classe: "Ações" },
  { ticker: "TIMS3", nome: "TIM ON", classe: "Ações" },
  { ticker: "TOTS3", nome: "Totvs ON", classe: "Ações" },
  { ticker: "LWSA3", nome: "Locaweb ON", classe: "Ações" },

  // Ações - Transporte e Logística
  { ticker: "CCRO3", nome: "CCR ON", classe: "Ações" },
  { ticker: "ECOR3", nome: "Ecorodovias ON", classe: "Ações" },
  { ticker: "UGPA3", nome: "Ultrapar ON", classe: "Ações" },

  // Ações - Construção e Imobiliárias
  { ticker: "MRVE3", nome: "MRV ON", classe: "Ações" },
  { ticker: "CYRE3", nome: "Cyrela ON", classe: "Ações" },
  { ticker: "EZTC3", nome: "Eztec ON", classe: "Ações" },
  { ticker: "DIRR3", nome: "Direnge ON", classe: "Ações" },

  // Ações - Seguros
  { ticker: "BBSE3", nome: "BB Seguridade ON", classe: "Ações" },
  { ticker: "PSSA3", nome: "Porto Seguro ON", classe: "Ações" },
  { ticker: "SULA11", nome: "SulAmérica Units", classe: "Ações" },

  // Ações - Outras Blue Chips
  { ticker: "WEGE3", nome: "WEG ON", classe: "Ações" },
  { ticker: "EMBR3", nome: "Embraer ON", classe: "Ações" },
  { ticker: "AZUL4", nome: "Azul PN", classe: "Ações" },
  { ticker: "GOLL4", nome: "Gol PN", classe: "Ações" },
  { ticker: "CVCB3", nome: "CVC ON", classe: "Ações" },
  { ticker: "YDUQ3", nome: "Yduqs ON", classe: "Ações" },
  { ticker: "COGN3", nome: "Cogna ON", classe: "Ações" },
  { ticker: "SOMA3", nome: "Grupo Soma ON", classe: "Ações" },
  { ticker: "ARZZ3", nome: "Arezzo ON", classe: "Ações" },
  { ticker: "ALPA4", nome: "Alpargatas PN", classe: "Ações" },

  // FIIs - Fundos Imobiliários
  { ticker: "HGLG11", nome: "CSHG Logística", classe: "FIIs" },
  { ticker: "XPLG11", nome: "XP Logística", classe: "FIIs" },
  { ticker: "VISC11", nome: "Vinci Logística", classe: "FIIs" },
  { ticker: "BTLG11", nome: "BTG Logística", classe: "FIIs" },
  { ticker: "RBRP11", nome: "RBR Properties", classe: "FIIs" },
  { ticker: "RCRB11", nome: "RCRB", classe: "FIIs" },
  { ticker: "KNRI11", nome: "Kinea Renda Imob.", classe: "FIIs" },
  { ticker: "XPML11", nome: "XP Malls", classe: "FIIs" },
  { ticker: "HGBS11", nome: "CSHG Recebíveis", classe: "FIIs" },
  { ticker: "MXRF11", nome: "Maxi Renda", classe: "FIIs" },
  { ticker: "VILG11", nome: "Vila Galvão", classe: "FIIs" },
  { ticker: "RECT11", nome: "RBR Rendimentos", classe: "FIIs" },
  { ticker: "IRDM11", nome: "Iridium Recebíveis", classe: "FIIs" },
  { ticker: "DEVA11", nome: "Devant Recebíveis", classe: "FIIs" },
  { ticker: "HGRE11", nome: "CSHG Renda Urbana", classe: "FIIs" },
  { ticker: "BCFF11", nome: "BTG Pactual FOF", classe: "FIIs" },
  { ticker: "VINO11", nome: "Vinci Offices", classe: "FIIs" },
  { ticker: "HSAF11", nome: "HSI Alpha FOF", classe: "FIIs" },
  { ticker: "XPCI11", nome: "XP Crédito Imob.", classe: "FIIs" },
  { ticker: "RFOF11", nome: "RBR FOF", classe: "FIIs" },

  // ETFs
  { ticker: "BOVA11", nome: "ETF Ibovespa", classe: "ETFs" },
  { ticker: "SMAL11", nome: "ETF Small Caps", classe: "ETFs" },
  { ticker: "IVVB11", nome: "ETF S&P 500", classe: "ETFs" },
  { ticker: "FIXA11", nome: "ETF Renda Fixa", classe: "ETFs" },
  { ticker: "IMAB11", nome: "ETF IMAB", classe: "ETFs" },
  { ticker: "BOVD11", nome: "ETF Dividendos", classe: "ETFs" },
  { ticker: "MATB11", nome: "ETF Mat. Basicas", classe: "ETFs" },
  { ticker: "GOAU11", nome: "ETF Gerdau", classe: "ETFs" },

  // BDRs
  { ticker: "AAPL34", nome: "Apple BDR", classe: "BDRs" },
  { ticker: "MSFT34", nome: "Microsoft BDR", classe: "BDRs" },
  { ticker: "GOGL34", nome: "Alphabet (Google) BDR", classe: "BDRs" },
  { ticker: "AMZO34", nome: "Amazon BDR", classe: "BDRs" },
  { ticker: "TSLA34", nome: "Tesla BDR", classe: "BDRs" },
  { ticker: "NVDC34", nome: "NVIDIA BDR", classe: "BDRs" },
  { ticker: "META34", nome: "Meta BDR", classe: "BDRs" },
  { ticker: "NFLX34", nome: "Netflix BDR", classe: "BDRs" },

  // Criptomoedas (top 20 por market cap)
  { ticker: "BTC", nome: "Bitcoin", classe: "Cripto" },
  { ticker: "ETH", nome: "Ethereum", classe: "Cripto" },
  { ticker: "USDT", nome: "Tether", classe: "Cripto" },
  { ticker: "BNB", nome: "BNB", classe: "Cripto" },
  { ticker: "SOL", nome: "Solana", classe: "Cripto" },
  { ticker: "XRP", nome: "Ripple", classe: "Cripto" },
  { ticker: "USDC", nome: "USD Coin", classe: "Cripto" },
  { ticker: "ADA", nome: "Cardano", classe: "Cripto" },
  { ticker: "AVAX", nome: "Avalanche", classe: "Cripto" },
  { ticker: "DOGE", nome: "Dogecoin", classe: "Cripto" },
  { ticker: "TRX", nome: "TRON", classe: "Cripto" },
  { ticker: "LINK", nome: "Chainlink", classe: "Cripto" },
  { ticker: "DOT", nome: "Polkadot", classe: "Cripto" },
  { ticker: "MATIC", nome: "Polygon", classe: "Cripto" },
  { ticker: "ICP", nome: "Internet Computer", classe: "Cripto" },
  { ticker: "SHIB", nome: "Shiba Inu", classe: "Cripto" },
  { ticker: "LTC", nome: "Litecoin", classe: "Cripto" },
  { ticker: "BCH", nome: "Bitcoin Cash", classe: "Cripto" },
  { ticker: "NEAR", nome: "NEAR Protocol", classe: "Cripto" },
  { ticker: "UNI", nome: "Uniswap", classe: "Cripto" },
];

/**
 * Filtra a lista de ativos populares por termo de busca.
 * Busca tanto no ticker quanto no nome (case-insensitive).
 */
export function filtrarAtivos(termo: string): AtivoPopular[] {
  if (!termo || termo.length < 2) return [];
  const termoUpper = termo.toUpperCase();
  return ATIVOS_POPULARES.filter(
    (ativo) =>
      ativo.ticker.toUpperCase().includes(termoUpper) ||
      ativo.nome.toUpperCase().includes(termoUpper)
  ).slice(0, 10); // Limita a 10 resultados
}