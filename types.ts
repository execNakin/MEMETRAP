
export enum ScamType {
  NONE = 'NONE',
  RUG_PULL = 'RUG_PULL',
  WHALE_DUMP = 'WHALE_DUMP',
  HONEYPOT = 'HONEYPOT',
  FAKE_NEWS = 'FAKE_NEWS'
}

export interface Coin {
  id: string;
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  volume24h: number;
  scamLikelihood: number; // 0-1
  isRugged: boolean;
  history: PricePoint[];
  creatorWallet: string;
  description: string;
  tax: number;
  marketCap: number;
  isUserCreated?: boolean;
  liquidityPool?: number; // Simulated liquidity for user-created coins
}

export interface PricePoint {
  time: number;
  value: number;
}

export interface PortfolioItem {
  coinId: string;
  amount: number;
  avgBuyPrice: number;
}

export interface NewsItem {
  id: string;
  title: string;
  content: string;
  source: string;
  timestamp: number;
  isFake: boolean;
  impact: 'positive' | 'negative' | 'neutral';
}

export interface UserState {
  balance: number;
  portfolio: PortfolioItem[];
  fomoMeter: number;
  greedScore: number;
}
