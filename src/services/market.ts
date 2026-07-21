import { StockQuote } from "../types";

// Base prices representing realistic current market values for popular Brazilian tickers
const BASE_PRICES: { [ticker: string]: number } = {
  VALE3: 61.25,
  PETR4: 38.45,
  ITUB4: 34.12,
  BBDC4: 14.15,
  BBAS3: 28.30,
  WEGE3: 49.50,
  MXRF11: 9.85,
  XPML11: 114.20,
  IVVB11: 325.80,
  BOVA11: 126.40,
  MGLU3: 12.45,
  ALOS3: 22.10,
  TAEE11: 34.80,
  SBSP3: 84.60,
  SANB11: 28.15
};

let currentQuotes: { [ticker: string]: StockQuote } = {};

// Initialize quotes
Object.entries(BASE_PRICES).forEach(([ticker, price]) => {
  currentQuotes[ticker] = {
    ticker,
    price,
    changePercent: (Math.random() * 4 - 2), // random -2% to +2%
    lastUpdated: new Date().toLocaleTimeString()
  };
});

/**
 * Gets the current quote for a ticker. 
 * If it doesn't exist, initializes it with a realistic random price based on hash or defaults.
 */
export function getQuote(ticker: string): StockQuote {
  const cleanTicker = ticker.toUpperCase().trim();
  if (!cleanTicker) {
    return { ticker: "", price: 0, changePercent: 0, lastUpdated: "" };
  }

  if (currentQuotes[cleanTicker]) {
    return currentQuotes[cleanTicker];
  }

  // Generate a predictable but realistic price if ticker is new
  let hash = 0;
  for (let i = 0; i < cleanTicker.length; i++) {
    hash = cleanTicker.charCodeAt(i) + ((hash << 5) - hash);
  }
  const simulatedPrice = Math.abs((hash % 150) + 5) + (hash % 100) / 100;
  const changePercent = ((hash % 100) / 25) - 2; // -2% to +2%

  const newQuote: StockQuote = {
    ticker: cleanTicker,
    price: parseFloat(simulatedPrice.toFixed(2)),
    changePercent: parseFloat(changePercent.toFixed(2)),
    lastUpdated: new Date().toLocaleTimeString()
  };

  currentQuotes[cleanTicker] = newQuote;
  return newQuote;
}

/**
 * Simulates a market update tick, changing prices slightly.
 */
export function simulateMarketTick(): { [ticker: string]: StockQuote } {
  Object.keys(currentQuotes).forEach((ticker) => {
    const quote = currentQuotes[ticker];
    const percentage = (Math.random() * 1.6 - 0.8) / 100; // -0.8% to +0.8%
    const priceDiff = quote.price * percentage;
    const newPrice = Math.max(0.1, quote.price + priceDiff);
    
    currentQuotes[ticker] = {
      ticker,
      price: parseFloat(newPrice.toFixed(2)),
      changePercent: parseFloat(((percentage * 100) + quote.changePercent * 0.9).toFixed(2)), // auto-regressive momentum
      lastUpdated: new Date().toLocaleTimeString()
    };
  });
  return { ...currentQuotes };
}

/**
 * Set custom price manually (useful for configs)
 */
export function setCustomPrice(ticker: string, price: number): StockQuote {
  const cleanTicker = ticker.toUpperCase().trim();
  const quote = getQuote(cleanTicker);
  const changePercent = ((price - quote.price) / quote.price) * 100;
  
  currentQuotes[cleanTicker] = {
    ticker: cleanTicker,
    price: parseFloat(price.toFixed(2)),
    changePercent: parseFloat(changePercent.toFixed(2)),
    lastUpdated: new Date().toLocaleTimeString()
  };
  return currentQuotes[cleanTicker];
}

export function getAllQuotes(): { [ticker: string]: StockQuote } {
  return { ...currentQuotes };
}
