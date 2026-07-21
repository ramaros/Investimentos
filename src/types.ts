export interface Compra {
  id: string;
  ticker: string;
  quantity: number;
  price: number;
  total: number;
  date: string; // YYYY-MM-DD
  createdAt?: any;
  type?: string;   // "Ações" | "FIIs" | "Renda Fixa" | "Criptomoedas"
  sector?: string; // e.g. "Tecnologia", "Financeiro", "Energia", "Tesouro", etc.
}

export interface Provento {
  id: string;
  ticker: string;
  amount: number;
  date: string; // YYYY-MM-DD
  createdAt?: any;
}

export interface AssetSummary {
  ticker: string;
  quantity: number;
  averagePrice: number;
  totalInvested: number;
  totalDividends: number;
  monthsPaid: { [month: string]: boolean }; // e.g., { "01": true, "02": false }
  currentPrice: number;
  currentTotalValue: number;
  yieldOnCost: number;
  totalReturnAmount: number; // total value + dividends - total invested
  totalReturnPercent: number;
  type: string;   // "Ações" | "FIIs" | "Renda Fixa" | "Criptomoedas"
  sector: string; // e.g., "Tecnologia", "Financeiro", etc.
}

export interface StockQuote {
  ticker: string;
  price: number;
  changePercent: number;
  lastUpdated: string;
}

export interface SimulatorItem {
  ticker: string;
  currentPrice: number;
  quantityToBuy: number;
  targetPrice: number;
  totalAporte: number;
  finalQuantity: number;
}
