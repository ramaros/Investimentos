import React, { useState, useMemo } from "react";
import { AssetSummary } from "../types";
import { Calculator, Plus, Trash2 } from "lucide-react";
import { getQuote } from "../services/market";

interface SimuladorViewProps {
  assetSummaries: AssetSummary[];
}

interface SimItem {
  ticker: string;
  currentQty: number;
  qtyToBuy: number;
  targetPrice: number;
}

export function SimuladorView({ assetSummaries }: SimuladorViewProps) {
  // Local list of items for simulation
  const [simItems, setSimItems] = useState<SimItem[]>(() => {
    return assetSummaries.map((asset) => ({
      ticker: asset.ticker,
      currentQty: asset.quantity,
      qtyToBuy: 0,
      targetPrice: asset.currentPrice || getQuote(asset.ticker).price
    }));
  });

  const [newTicker, setNewTicker] = useState("");

  // Sync with asset summaries if items changed or portfolio updated
  React.useEffect(() => {
    // Merge portfolio assets into local simulator items safely
    setSimItems((prev) => {
      const merged = [...prev];
      assetSummaries.forEach((asset) => {
        const existingIndex = merged.findIndex((item) => item.ticker === asset.ticker);
        if (existingIndex !== -1) {
          merged[existingIndex].currentQty = asset.quantity;
        } else {
          merged.push({
            ticker: asset.ticker,
            currentQty: asset.quantity,
            qtyToBuy: 0,
            targetPrice: asset.currentPrice || getQuote(asset.ticker).price
          });
        }
      });
      return merged;
    });
  }, [assetSummaries]);

  // Update item field
  const handleUpdateItem = (ticker: string, field: "qtyToBuy" | "targetPrice", value: number) => {
    setSimItems((prev) =>
      prev.map((item) => {
        if (item.ticker === ticker) {
          return {
            ...item,
            [field]: isNaN(value) ? 0 : value
          };
        }
        return item;
      })
    );
  };

  // Add custom ticker to simulate
  const handleAddCustomTicker = (e: React.FormEvent) => {
    e.preventDefault();
    const tickerUpper = newTicker.toUpperCase().trim();
    if (!tickerUpper) return;

    const exists = simItems.some((item) => item.ticker === tickerUpper);
    if (exists) {
      alert("Este ativo já está na tabela de simulação!");
      return;
    }

    const livePrice = getQuote(tickerUpper).price;
    setSimItems((prev) => [
      ...prev,
      {
        ticker: tickerUpper,
        currentQty: 0,
        qtyToBuy: 0,
        targetPrice: livePrice
      }
    ]);
    setNewTicker("");
  };

  // Remove custom ticker from simulation list
  const handleRemoveItem = (ticker: string) => {
    setSimItems((prev) => prev.filter((item) => item.ticker !== ticker));
  };

  // Calculations
  const calculatedRows = useMemo(() => {
    return simItems.map((item) => {
      const totalAporte = item.qtyToBuy * item.targetPrice;
      const finalQty = item.currentQty + item.qtyToBuy;
      return {
        ...item,
        totalAporte,
        finalQty
      };
    });
  }, [simItems]);

  const totalAporteSum = useMemo(() => {
    return calculatedRows.reduce((sum, row) => sum + row.totalAporte, 0);
  }, [calculatedRows]);

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Header and Total pill */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-slate-200/85 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-slate-100 text-slate-700 rounded-xl">
            <Calculator className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-wide">SIMULAÇÃO DE APORTES</h3>
            <p className="text-[11px] text-slate-400 font-bold tracking-wider uppercase mt-0.5">Planeje suas próximas compras</p>
          </div>
        </div>

        {/* Total previsto highlight badge */}
        <div className="bg-[#0f172a] text-white font-bold px-5 py-3 rounded-xl shadow-md self-start md:self-center transition-transform hover:scale-[1.01]">
          Total Previsto: R$ {totalAporteSum.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
      </div>

      {/* Main Simulation Table Card */}
      <div className="bg-white border border-slate-200/85 rounded-2xl overflow-hidden shadow-sm">
        
        {/* Quick add custom asset for simulation */}
        <div className="p-6 bg-slate-50/50 border-b border-slate-100">
          <form onSubmit={handleAddCustomTicker} className="flex flex-wrap items-center gap-4">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Simular novo ativo:</span>
            <div className="flex gap-2.5 w-full sm:w-auto">
              <input 
                type="text" 
                placeholder="EX: PETR4, ITSA4" 
                value={newTicker}
                onChange={(e) => setNewTicker(e.target.value)}
                className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase w-48"
              />
              <button 
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center gap-2 text-xs transition-all shadow-sm active:scale-95 cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Adicionar
              </button>
            </div>
          </form>
        </div>

        {calculatedRows.length === 0 ? (
          <div className="py-12 text-center text-slate-400">
            Adicione um ativo para simular aportes.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200/85 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-4 px-6">ATIVO</th>
                  <th className="py-4 px-4 text-center">ATUAL</th>
                  <th className="py-4 px-4 text-center">QTDE COMPRA</th>
                  <th className="py-4 px-4 text-center">PREÇO ALVO</th>
                  <th className="py-4 px-4 text-right">APORTE TOTAL</th>
                  <th className="py-4 px-4 text-center">QTDE FINAL</th>
                  <th className="py-4 px-6 text-center">AÇÕES</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm font-semibold text-slate-600">
                {calculatedRows.map((item) => (
                  <tr key={item.ticker} className="hover:bg-slate-50/50 transition-all">
                    {/* Ticker */}
                    <td className="py-4 px-6">
                      <span className="font-mono bg-slate-100 text-slate-900 border border-slate-200 px-2.5 py-1 rounded-md text-xs font-bold tracking-wider uppercase">{item.ticker}</span>
                    </td>

                    {/* Current Quantity */}
                    <td className="py-4 px-4 text-center text-slate-500 font-bold">{item.currentQty}</td>

                    {/* Qty To Buy Input */}
                    <td className="py-4 px-4 text-center min-w-[120px]">
                      <input 
                        type="number" 
                        min="0"
                        placeholder="0"
                        value={item.qtyToBuy === 0 ? "" : item.qtyToBuy}
                        onChange={(e) => handleUpdateItem(item.ticker, "qtyToBuy", parseInt(e.target.value))}
                        className="w-20 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-center font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                      />
                    </td>

                    {/* Target Price Input */}
                    <td className="py-4 px-4 text-center min-w-[140px]">
                      <div className="relative inline-block">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">R$</span>
                        <input 
                          type="number" 
                          step="0.01"
                          placeholder="0.00"
                          value={item.targetPrice === 0 ? "" : item.targetPrice}
                          onChange={(e) => handleUpdateItem(item.ticker, "targetPrice", parseFloat(e.target.value))}
                          className="w-28 pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-center font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                        />
                      </div>
                    </td>

                    {/* Total Aporte calculated */}
                    <td className="py-4 px-4 text-right font-bold text-blue-600">
                      R$ {item.totalAporte.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </td>

                    {/* Final Quantity calculated */}
                    <td className="py-4 px-4 text-center font-bold text-slate-800">
                      {item.finalQty}
                    </td>

                    {/* Delete Item from Simulator List */}
                    <td className="py-4 px-6 text-center">
                      <button 
                        onClick={() => handleRemoveItem(item.ticker)}
                        className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 transition-all cursor-pointer"
                        title="Remover da simulação"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
