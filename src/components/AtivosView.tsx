import React, { useMemo } from "react";
import { AssetSummary } from "../types";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Layers, TrendingUp, ChevronRight, Activity } from "lucide-react";

interface AtivosViewProps {
  assetSummaries: AssetSummary[];
  onSelectTicker?: (ticker: string) => void;
}

const MONTHS_LABELS = [
  { key: "01", label: "Jan" },
  { key: "02", label: "Fev" },
  { key: "03", label: "Mar" },
  { key: "04", label: "Abr" },
  { key: "05", label: "Mai" },
  { key: "06", label: "Jun" },
  { key: "07", label: "Jul" },
  { key: "08", label: "Ago" },
  { key: "09", label: "Set" },
  { key: "10", label: "Out" },
  { key: "11", label: "Nov" },
  { key: "12", label: "Dez" }
];

// Aesthetic clean colors for the pie chart sections
const COLORS = [
  "#2563eb", // Blue 600
  "#10b981", // Emerald 500
  "#f59e0b", // Amber 500
  "#8b5cf6", // Violet 500
  "#ec4899", // Pink 500
  "#06b6d4", // Cyan 500
  "#f43f5e", // Rose 500
  "#14b8a6", // Teal 500
  "#6366f1"  // Indigo 500
];

export function AtivosView({ assetSummaries, onSelectTicker }: AtivosViewProps) {
  // Sort asset summaries by total invested descending
  const sortedAssets = useMemo(() => {
    return [...assetSummaries].sort((a, b) => b.totalInvested - a.totalInvested);
  }, [assetSummaries]);

  // Sum of all invested amounts
  const totalInvestedSum = useMemo(() => {
    return sortedAssets.reduce((sum, item) => sum + item.totalInvested, 0);
  }, [sortedAssets]);

  // Chart data
  const chartData = useMemo(() => {
    if (sortedAssets.length === 0) return [];
    return sortedAssets.map((asset) => ({
      name: asset.ticker,
      value: asset.totalInvested,
      percent: totalInvestedSum > 0 ? (asset.totalInvested / totalInvestedSum) * 100 : 0
    }));
  }, [sortedAssets, totalInvestedSum]);

  return (
    <div className="space-y-8">
      
      {/* Composition and Share card */}
      <div className="bg-white border border-slate-200/85 rounded-2xl p-6 md:p-8 shadow-sm">
        <div className="flex items-center gap-3 mb-6 md:mb-8">
          <div className="p-3 bg-slate-100 text-slate-700 rounded-xl">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-wide">COMPOSIÇÃO DA CARTEIRA</h3>
            <p className="text-[11px] text-slate-400 font-bold tracking-wider uppercase mt-0.5">Diversificação por custo total</p>
          </div>
        </div>

        {sortedAssets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400">
            <Activity className="w-12 h-12 stroke-1 mb-3 animate-pulse" />
            <p className="font-semibold text-slate-500">Nenhum ativo cadastrado ainda</p>
            <p className="text-xs text-slate-400">Use os botões acima para registrar sua primeira compra!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Chart Area */}
            <div className="lg:col-span-5 flex justify-center h-64 relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={95}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(val: number) => `R$ ${val.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
                    contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0", boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}
                  />
                </PieChart>
              </ResponsiveContainer>

              {/* Total display inside donut chart */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[10px] uppercase tracking-widest font-bold text-slate-400">Total</span>
                <span className="text-lg font-bold text-slate-800">
                  R$ {totalInvestedSum.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}
                </span>
              </div>
            </div>

            {/* Legend / Side Progress bars */}
            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {chartData.map((data, index) => {
                const color = COLORS[index % COLORS.length];
                return (
                  <div key={data.name} className="bg-slate-50/50 border border-slate-200/60 rounded-xl p-4 flex flex-col justify-between space-y-2 hover:bg-slate-100/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: color }} />
                        <span className="font-bold text-slate-700 tracking-tight">{data.name}</span>
                      </div>
                      <span className="text-xs font-bold text-slate-800">{data.percent.toFixed(1)}%</span>
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="w-full bg-slate-200/80 h-1.5 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${data.percent}%`, backgroundColor: color }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Meus Ativos Table section */}
      <div className="bg-white border border-slate-200/85 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-6 md:p-8 border-b border-slate-100 flex items-center gap-3">
          <TrendingUp className="w-5 h-5 text-blue-600" />
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">MEUS ATIVOS</h3>
        </div>

        {sortedAssets.length === 0 ? (
          <div className="py-12 text-center text-slate-400">
            <p className="font-medium">Nenhum registro de ativos para exibir.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-200/85 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-4 px-6">ATIVO</th>
                  <th className="py-4 px-4 text-center">MESES PAGTO</th>
                  <th className="py-4 px-4 text-center">QTD</th>
                  <th className="py-4 px-4 text-right">P. MÉDIO</th>
                  <th className="py-4 px-4 text-right">INVESTIMENTO</th>
                  <th className="py-4 px-6 text-right">PROVENTOS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {sortedAssets.map((asset) => (
                  <tr 
                    key={asset.ticker} 
                    onClick={() => onSelectTicker?.(asset.ticker)}
                    className="hover:bg-slate-50/70 transition-colors cursor-pointer group"
                  >
                    {/* Ticker */}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <span className="font-mono bg-slate-100 text-slate-900 border border-slate-200 px-2.5 py-1 rounded-md text-xs font-bold tracking-wider uppercase group-hover:bg-blue-50 group-hover:text-blue-600 group-hover:border-blue-200/60 transition-colors">
                          {asset.ticker}
                        </span>
                        <ChevronRight className="w-4 h-4 text-slate-300 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                      </div>
                    </td>

                    {/* Meses Pagto Badges */}
                    <td className="py-4 px-4 min-w-[320px]">
                      <div className="flex items-center justify-center gap-1">
                        {MONTHS_LABELS.map((m) => {
                          const isPaid = asset.monthsPaid[m.key];
                          return (
                            <span 
                              key={m.key} 
                              title={isPaid ? `Recebeu proventos em ${m.label}` : `Sem proventos em ${m.label}`}
                              className={`text-[9px] font-bold px-1.5 py-1 rounded text-center transition-all ${
                                isPaid 
                                  ? "bg-emerald-500 text-white shadow-sm" 
                                  : "bg-slate-100 text-slate-300"
                              }`}
                            >
                              {m.label}
                            </span>
                          );
                        })}
                      </div>
                    </td>

                    {/* Quantity */}
                    <td className="py-4 px-4 text-center font-bold text-slate-600">
                      {asset.quantity}
                    </td>

                    {/* Average Price */}
                    <td className="py-4 px-4 text-right font-semibold text-slate-600">
                      R$ {asset.averagePrice.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </td>

                    {/* Invested Total */}
                    <td className="py-4 px-4 text-right font-bold text-slate-800">
                      R$ {asset.totalInvested.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </td>

                    {/* Dividends Total */}
                    <td className="py-4 px-6 text-right font-bold text-emerald-600">
                      R$ {asset.totalDividends.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
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
