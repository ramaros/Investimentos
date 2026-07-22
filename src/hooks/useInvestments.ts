import { useState, useEffect, useMemo } from "react";
import { Compra, Provento, AssetSummary, StockQuote } from "../types";
import { auth, db, loginWithGoogle, logout } from "../firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import { 
  collection, 
  onSnapshot, 
  doc, 
  setDoc, 
  deleteDoc, 
  writeBatch,
  query,
  orderBy
} from "firebase/firestore";
import { getQuote, simulateMarketTick } from "../services/market";

export function inferAssetClassAndSector(ticker: string): { type: string; sector: string } {
  const clean = ticker.toUpperCase().trim();
  
  if (clean === "MXRF11" || clean === "XPML11" || (clean.endsWith("11") && !["IVVB11", "BOVA11", "SMAL11"].includes(clean))) {
    return { type: "FIIs", sector: "Imobiliário" };
  }
  
  if (["BTC", "ETH", "SOL", "ADA", "XRP", "DOT", "DOGE", "SHIB", "LTC", "LINK", "UNI"].includes(clean) || clean.includes("COIN") || clean.includes("BTC") || clean.includes("ETH") || clean === "CRYPTO") {
    return { type: "Criptomoedas", sector: "Criptoativos" };
  }
  
  if (clean.includes("CDB") || clean.includes("TESOURO") || clean.includes("LCI") || clean.includes("LCA") || clean.includes("POUPANCA") || clean.includes("CRI") || clean.includes("CRA") || clean.includes("RENDA FIXA") || clean.includes("FIXA") || clean.includes("CDI") || clean.includes("SELIC")) {
    return { type: "Renda Fixa", sector: "Renda Fixa" };
  }
  
  // Ações sectors
  if (["VALE3", "CSNA3", "USIM5", "GGBR4"].includes(clean)) return { type: "Ações", sector: "Materiais Básicos" };
  if (["PETR4", "PETR3", "PRIO3", "RECV3", "UGPA3", "RRRP3"].includes(clean)) return { type: "Ações", sector: "Petróleo, Gás e Biocombustíveis" };
  if (["ITUB4", "BBDC4", "BBAS3", "SANB11", "BPAC11", "BBSE3", "CXSE3", "PSSA3"].includes(clean)) return { type: "Ações", sector: "Financeiro" };
  if (["WEGE3", "ELET3", "ELET6", "CPLE6", "EQTL3", "TAEE11", "TRPL4", "AURE3"].includes(clean)) return { type: "Ações", sector: "Utilidade Pública" };
  if (["MGLU3", "LREN3", "AMER3", "ARZZ3", "BHIA3", "ALPA4"].includes(clean)) return { type: "Ações", sector: "Consumo Cíclico" };
  if (["SBSP3", "SANEPAR", "SAPR11", "CSMG3"].includes(clean)) return { type: "Ações", sector: "Saneamento" };
  if (["ALOS3", "MULT3", "IGTI11"].includes(clean)) return { type: "Ações", sector: "Shopping Centers" };
  
  return { type: "Ações", sector: "Outros" };
}

export function useInvestments() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isOfflineMode, setIsOfflineMode] = useState(false);

  // Core transaction states
  const [compras, setCompras] = useState<Compra[]>([]);
  const [proventos, setProventos] = useState<Provento[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncError, setSyncError] = useState<string | null>(null);

  // Quotes from our market service (refreshable)
  const [quotes, setQuotes] = useState<{ [ticker: string]: StockQuote }>({});
  const [lastQuoteUpdate, setLastQuoteUpdate] = useState<string>("");

  // Track Auth changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setAuthLoading(false);
      
      if (firebaseUser) {
        setIsOfflineMode(false);
      } else {
        // If not authenticated, default to local storage offline mode or let user sign in
        setIsOfflineMode(true);
      }
    });
    return unsubscribe;
  }, []);

  // Sync market quotes periodically
  useEffect(() => {
    // Initial fetch
    const updateQuotes = () => {
      const allQuotes: { [ticker: string]: StockQuote } = {};
      const uniqueTickers = new Set<string>();
      compras.forEach(c => uniqueTickers.add(c.ticker.toUpperCase().trim()));
      proventos.forEach(p => uniqueTickers.add(p.ticker.toUpperCase().trim()));
      
      // Ensure VALE3 and PETR4 are always in quotes for default view
      uniqueTickers.add("VALE3");
      uniqueTickers.add("PETR4");

      uniqueTickers.forEach(ticker => {
        if (ticker) {
          allQuotes[ticker] = getQuote(ticker);
        }
      });
      setQuotes(allQuotes);
      setLastQuoteUpdate(new Date().toLocaleTimeString());
    };

    updateQuotes();

    // Setup periodic real-time tick simulation
    const interval = setInterval(() => {
      simulateMarketTick();
      updateQuotes();
    }, 4000); // simulation tick every 4s

    return () => clearInterval(interval);
  }, [compras, proventos]);

  // Load / Sync Data depending on Auth mode
  useEffect(() => {
    if (authLoading) return;

    if (user) {
      // Firebase Synchronized Mode
      setLoading(true);
      setSyncError(null);
      
      const comprasRef = collection(db, "users", user.uid, "compras");
      const proventosRef = collection(db, "users", user.uid, "proventos");

      const unsubCompras = onSnapshot(comprasRef, (snapshot) => {
        const list: Compra[] = [];
        snapshot.forEach((doc) => {
          list.push({ id: doc.id, ...doc.data() } as Compra);
        });
        // Sort by date descending
        list.sort((a, b) => b.date.localeCompare(a.date));
        setCompras(list);
        setLoading(false);
      }, (error) => {
        console.error("Erro sincronizando compras do Firestore:", error);
        setSyncError(error.message || "Erro de permissão ou conexão no Firestore.");
        setLoading(false);
      });

      const unsubProventos = onSnapshot(proventosRef, (snapshot) => {
        const list: Provento[] = [];
        snapshot.forEach((doc) => {
          list.push({ id: doc.id, ...doc.data() } as Provento);
        });
        // Sort by date descending
        list.sort((a, b) => b.date.localeCompare(a.date));
        setProventos(list);
        setLoading(false);
      }, (error) => {
        console.error("Erro sincronizando proventos do Firestore:", error);
        setSyncError(error.message || "Erro de permissão ou conexão no Firestore.");
        setLoading(false);
      });

      return () => {
        unsubCompras();
        unsubProventos();
      };
    } else {
      // Offline/Local Storage fallback mode
      const localCompras = localStorage.getItem("controle_acoes_compras");
      const localProventos = localStorage.getItem("controle_acoes_proventos");

      const parsedCompras = localCompras ? JSON.parse(localCompras) : [];
      const parsedProventos = localProventos ? JSON.parse(localProventos) : [];

      // Sort descending
      parsedCompras.sort((a: Compra, b: Compra) => b.date.localeCompare(a.date));
      parsedProventos.sort((a: Provento, b: Provento) => b.date.localeCompare(a.date));

      setCompras(parsedCompras);
      setProventos(parsedProventos);
      setLoading(false);
    }
  }, [user, authLoading]);

  // Persist local state if offline
  const saveLocalData = (newCompras: Compra[], newProventos: Provento[]) => {
    if (!user) {
      localStorage.setItem("controle_acoes_compras", JSON.stringify(newCompras));
      localStorage.setItem("controle_acoes_proventos", JSON.stringify(newProventos));
    }
  };

  // Transaction Helpers
  const addCompra = async (ticker: string, quantity: number, price: number, date: string, type?: string, sector?: string) => {
    const cleanTicker = ticker.toUpperCase().trim();
    const id = "c_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
    
    // Fallback automatic inference if type/sector is not explicitly selected
    const inferred = inferAssetClassAndSector(cleanTicker);
    const finalType = type || inferred.type;
    const finalSector = sector || inferred.sector;

    const newCompra: Compra = {
      id,
      ticker: cleanTicker,
      quantity,
      price,
      total: parseFloat((quantity * price).toFixed(2)),
      date,
      type: finalType,
      sector: finalSector
    };

    if (user) {
      const docRef = doc(db, "users", user.uid, "compras", id);
      await setDoc(docRef, newCompra);
    } else {
      const updated = [newCompra, ...compras];
      setCompras(updated);
      saveLocalData(updated, proventos);
    }
  };

  const deleteCompra = async (id: string) => {
    if (user) {
      const docRef = doc(db, "users", user.uid, "compras", id);
      await deleteDoc(docRef);
    } else {
      const updated = compras.filter(c => c.id !== id);
      setCompras(updated);
      saveLocalData(updated, proventos);
    }
  };

  const addProvento = async (ticker: string, amount: number, date: string) => {
    const cleanTicker = ticker.toUpperCase().trim();
    const id = "p_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
    const newProvento: Provento = {
      id,
      ticker: cleanTicker,
      amount,
      date
    };

    if (user) {
      const docRef = doc(db, "users", user.uid, "proventos", id);
      await setDoc(docRef, newProvento);
    } else {
      const updated = [newProvento, ...proventos];
      setProventos(updated);
      saveLocalData(compras, updated);
    }
  };

  const deleteProvento = async (id: string) => {
    if (user) {
      const docRef = doc(db, "users", user.uid, "proventos", id);
      await deleteDoc(docRef);
    } else {
      const updated = proventos.filter(p => p.id !== id);
      setProventos(updated);
      saveLocalData(compras, updated);
    }
  };

  const clearAllData = async () => {
    if (user) {
      // Clear Firestore via batch
      const batch = writeBatch(db);
      compras.forEach(c => {
        const ref = doc(db, "users", user.uid, "compras", c.id);
        batch.delete(ref);
      });
      proventos.forEach(p => {
        const ref = doc(db, "users", user.uid, "proventos", p.id);
        batch.delete(ref);
      });
      await batch.commit();
    } else {
      setCompras([]);
      setProventos([]);
      localStorage.removeItem("controle_acoes_compras");
      localStorage.removeItem("controle_acoes_proventos");
    }
  };

  // Export JSON backup
  const exportBackup = () => {
    const data = {
      compras,
      proventos,
      exportedAt: new Date().toISOString(),
      version: "1.0"
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `controle_investimentos_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Import JSON backup
  const importBackup = async (jsonData: any) => {
    try {
      if (!jsonData || typeof jsonData !== "object") {
        throw new Error("Formato inválido");
      }
      const importedCompras = Array.isArray(jsonData.compras) ? jsonData.compras : [];
      const importedProventos = Array.isArray(jsonData.proventos) ? jsonData.proventos : [];

      if (user) {
        // Upload to Firebase in batches
        const batch = writeBatch(db);
        importedCompras.forEach((c: any) => {
          const id = c.id || "c_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
          const ref = doc(db, "users", user.uid, "compras", id);
          const inferred = inferAssetClassAndSector(c.ticker || "");
          batch.set(ref, {
            id,
            ticker: c.ticker.toUpperCase().trim(),
            quantity: Number(c.quantity) || 0,
            price: Number(c.price) || 0,
            total: Number(c.total) || ((Number(c.quantity) || 0) * (Number(c.price) || 0)),
            date: c.date || new Date().toISOString().split('T')[0],
            type: c.type || inferred.type,
            sector: c.sector || inferred.sector
          });
        });

        importedProventos.forEach((p: any) => {
          const id = p.id || "p_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
          const ref = doc(db, "users", user.uid, "proventos", id);
          batch.set(ref, {
            id,
            ticker: p.ticker.toUpperCase().trim(),
            amount: Number(p.amount) || 0,
            date: p.date || new Date().toISOString().split('T')[0]
          });
        });

        await batch.commit();
      } else {
        const processedCompras = importedCompras.map((c: any) => {
          const inferred = inferAssetClassAndSector(c.ticker || "");
          return {
            ...c,
            type: c.type || inferred.type,
            sector: c.sector || inferred.sector
          };
        });
        const updatedC = [...processedCompras, ...compras];
        const updatedP = [...importedProventos, ...proventos];
        setCompras(updatedC);
        setProventos(updatedP);
        saveLocalData(updatedC, updatedP);
      }
    } catch (e) {
      console.error("Erro importando backup:", e);
      throw e;
    }
  };

  // Compute Aggregations
  const assetSummaries = useMemo<AssetSummary[]>(() => {
    const summaryMap: { [ticker: string]: AssetSummary } = {};

    // Group purchases
    compras.forEach((c) => {
      const ticker = c.ticker.toUpperCase().trim();
      if (!ticker) return;

      if (!summaryMap[ticker]) {
        const inferred = inferAssetClassAndSector(ticker);
        const finalType = c.type || inferred.type;
        const finalSector = c.sector || inferred.sector;

        summaryMap[ticker] = {
          ticker,
          quantity: 0,
          averagePrice: 0,
          totalInvested: 0,
          totalDividends: 0,
          monthsPaid: {},
          currentPrice: getQuote(ticker).price,
          currentTotalValue: 0,
          yieldOnCost: 0,
          totalReturnAmount: 0,
          totalReturnPercent: 0,
          type: finalType,
          sector: finalSector
        };
      }

      summaryMap[ticker].quantity += c.quantity;
      summaryMap[ticker].totalInvested += c.total;
    });

    // Compute average prices
    Object.keys(summaryMap).forEach((ticker) => {
      const summary = summaryMap[ticker];
      if (summary.quantity > 0) {
        summary.averagePrice = parseFloat((summary.totalInvested / summary.quantity).toFixed(2));
      }
    });

    // Group dividends/proventos
    proventos.forEach((p) => {
      const ticker = p.ticker.toUpperCase().trim();
      if (!ticker) return;

      // In case we received dividends for an asset we sold completely or didn't buy through the app
      if (!summaryMap[ticker]) {
        const inferred = inferAssetClassAndSector(ticker);
        summaryMap[ticker] = {
          ticker,
          quantity: 0,
          averagePrice: 0,
          totalInvested: 0,
          totalDividends: 0,
          monthsPaid: {},
          currentPrice: getQuote(ticker).price,
          currentTotalValue: 0,
          yieldOnCost: 0,
          totalReturnAmount: 0,
          totalReturnPercent: 0,
          type: inferred.type,
          sector: inferred.sector
        };
      }

      summaryMap[ticker].totalDividends += p.amount;

      // Parse month (date YYYY-MM-DD)
      const dateParts = p.date.split("-");
      if (dateParts.length >= 2) {
        const month = dateParts[1]; // "01", "02" etc
        summaryMap[ticker].monthsPaid[month] = true;
      }
    });

    // Compute active pricing metrics (current prices from live feed)
    const summariesList = Object.values(summaryMap);
    summariesList.forEach((summary) => {
      const liveQuote = quotes[summary.ticker] || getQuote(summary.ticker);
      summary.currentPrice = liveQuote.price;
      summary.currentTotalValue = parseFloat((summary.quantity * summary.currentPrice).toFixed(2));
      summary.yieldOnCost = summary.totalInvested > 0 
        ? parseFloat(((summary.totalDividends / summary.totalInvested) * 100).toFixed(2))
        : 0;
      summary.totalReturnAmount = parseFloat((summary.currentTotalValue + summary.totalDividends - summary.totalInvested).toFixed(2));
      summary.totalReturnPercent = summary.totalInvested > 0
        ? parseFloat(((summary.totalReturnAmount / summary.totalInvested) * 100).toFixed(2))
        : 0;
    });

    return summariesList;
  }, [compras, proventos, quotes]);

  // Overall calculations
  const totals = useMemo(() => {
    let totalInvested = 0;
    let totalDividends = 0;
    let currentTotalValue = 0;

    assetSummaries.forEach((summary) => {
      totalInvested += summary.totalInvested;
      totalDividends += summary.totalDividends;
      currentTotalValue += summary.currentTotalValue;
    });

    const yieldOnCost = totalInvested > 0 
      ? parseFloat(((totalDividends / totalInvested) * 100).toFixed(2))
      : 0;

    const totalReturnAmount = parseFloat((currentTotalValue + totalDividends - totalInvested).toFixed(2));
    const totalReturnPercent = totalInvested > 0
      ? parseFloat(((totalReturnAmount / totalInvested) * 100).toFixed(2))
      : 0;

    return {
      totalInvested: parseFloat(totalInvested.toFixed(2)),
      totalDividends: parseFloat(totalDividends.toFixed(2)),
      currentTotalValue: parseFloat(currentTotalValue.toFixed(2)),
      yieldOnCost,
      totalReturnAmount,
      totalReturnPercent
    };
  }, [assetSummaries]);

  return {
    user,
    authLoading,
    isOfflineMode,
    loginWithGoogle,
    logout,
    compras,
    proventos,
    loading,
    syncError,
    quotes,
    lastQuoteUpdate,
    assetSummaries,
    totals,
    addCompra,
    deleteCompra,
    addProvento,
    deleteProvento,
    clearAllData,
    exportBackup,
    importBackup
  };
}
