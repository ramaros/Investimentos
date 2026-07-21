import React, { useMemo } from "react";
import { AssetSummary, Compra, Provento } from "../types";
import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  LineChart, 
  Line 
} from "recharts";
import { PieChartIcon, BarChart3, TrendingUp, CalendarDays } from "lucide-react";

interface DashboardViewProps {
  assetSummaries: AssetSummary[];
  compras: Compra[];
  proventos: Provento[];
}

const COLORS = ["#2563eb", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#06b6d4"];

export function DashboardView({ assetSummaries, compras, proventos }: DashboardViewProps) {
  
  // 1. Current Asset Allocation Data (Current Value = qty * currentPrice)
  const currentAllocationData = useMemo(() => {
    const data = assetSummaries
      .filter((a) => a.quantity > 0)
      .map((a) => ({
        name: a.ticker,
        value: a.currentTotalValue,
      }))
      .sort((a, b) => b.value - a.value);
    
    const total = data.reduce((sum, item) => sum + item.value, 0);
    return data.map((item) => ({
      ...item,
      percentage: total > 0 ? ((item.value / total) * 100).toFixed(1) + "%" : "0%"
    }));
  }, [assetSummaries]);

  // 2. Investment vs Dividend Return
  const returnComparisonData = useMemo(() => {
    return assetSummaries.map((a) => ({
      name: a.ticker,
      Investido: a.totalInvested,
      Retornado: a.totalDividends,
    })).sort((a, b) => b.Investido - a.Investido);
  }, [assetSummaries]);

  // 3. 12 Months Aportes evolution
  const aportesLast12Months = useMemo(() => {
    const monthlyMap: { [key: string]: number } = {};
    
    // Initialize last 12 months
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      monthlyMap[key] = 0;
    }

    // Accumulate purchases
    compras.forEach((c) => {
      const parts = c.date.split("-"); // YYYY-MM-DD
      if (parts.length >= 2) {
        const key = `${parts[0]}-${parts[1]}`;
        if (monthlyMap[key] !== undefined) {
          monthlyMap[key] += c.total;
        }
      }
    });

    // Translate to sorted list for chart
    return Object.entries(monthlyMap).map(([key, value]) => {
      const [year, month] = key.split("-");
      const monthsAbbr = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
      const label = `${monthsAbbr[parseInt(month) - 1]}/${year.substring(2)}`;
      return {
        key,
        label,
        "Total Aportado": parseFloat(value.toFixed(2))
      };
    }).sort((a, b) => a.key.localeCompare(b.key));
  }, [compras]);

  // 4. 12 Months Monthly Dividends Yield
  const rendimentoLast12Months = useMemo(() => {
    const monthlyMap: { [key: string]: number } = {};
    
    // Initialize last 12 months
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      monthlyMap[key] = 0;
    }

    // Accumulate proventos
    proventos.forEach((p) => {
      const parts = p.date.split("-");
      if (parts.length >= 2) {
        const key = `${parts[0]}-${parts[1]}`;
        if (monthlyMap[key] !== undefined) {
          monthlyMap[key] += p.amount;
        }
      }
    });

    return Object.entries(monthlyMap).map(([key, value]) => {
      const [year, month] = key.split("-");
      const monthsAbbr = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
      const label = `${monthsAbbr[parseInt(month) - 1]}/${year.substring(2)}`;
      return {
        key,
        label,
        "Proventos": parseFloat(value.toFixed(2))
      };
    }).sort((a, b) => a.key.localeCompare(b.key));
  }, [proventos]);

  return (
    <div className="space-y-8">
      {/* Top Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Alocação de Ativos */}
        <div className="bg-white border border-slate-200/85 rounded-2xl p-6 md:p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <PieChartIcon className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 tracking-wide">ALOCAÇÃO DE ATIVOS</h4>
              <p className="text-[11px] text-slate-400 font-bold tracking-wider uppercase mt-0.5">Participação por valor de mercado atual</p>
            </div>
          </div>

          {currentAllocationData.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-slate-400 font-medium text-sm">
              Sem dados de ativos disponíveis.
            </div>
          ) : (
            <div className="h-64 relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={currentAllocationData}
                    cx="50%"
                    cy="50%"
                    outerRadius={85}
                    dataKey="value"
                    label={(props: any) => `${props.name} ${props.percentage || ""}`}
                  >
                    {currentAllocationData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(val: number) => `R$ ${val.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
                    contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Investimento vs Retorno */}
        <div className="bg-white border border-slate-200/85 rounded-2xl p-6 md:p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 tracking-wide">INVESTIMENTO VS RETORNO</h4>
              <p className="text-[11px] text-slate-400 font-bold tracking-wider uppercase mt-0.5">Custo de aquisição vs proventos acumulados</p>
            </div>
          </div>

          {returnComparisonData.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-slate-400 font-medium text-sm">
              Sem dados disponíveis.
            </div>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={returnComparisonData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} fontWeight={600} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} fontWeight={600} tickLine={false} />
                  <Tooltip 
                    formatter={(val: number) => `R$ ${val.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
                    contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0" }}
                  />
                  <Legend verticalAlign="top" height={36} iconSize={10} />
                  <Bar dataKey="Investido" fill="#2563eb" radius={[4, 4, 0, 0]} name="Custo Investido" />
                  <Bar dataKey="Retornado" fill="#10b981" radius={[4, 4, 0, 0]} name="Proventos Recebidos" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

      </div>

      {/* Bottom Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Evolução de Aportes (12M) */}
        <div className="bg-white border border-slate-200/85 rounded-2xl p-6 md:p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <CalendarDays className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 tracking-wide">EVOLUÇÃO DE APORTES (12M)</h4>
              <p className="text-[11px] text-slate-400 font-bold tracking-wider uppercase mt-0.5">Total aportado mensalmente</p>
            </div>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={aportesLast12Months} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="label" stroke="#94a3b8" fontSize={10} fontWeight={600} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={10} fontWeight={600} tickLine={false} />
                <Tooltip 
                  formatter={(val: number) => `R$ ${val.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
                  contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0" }}
                />
                <Bar dataKey="Total Aportado" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Rendimento Mensal (12M) */}
        <div className="bg-white border border-slate-200/85 rounded-2xl p-6 md:p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 tracking-wide">RENDIMENTO MENSAL (12M)</h4>
              <p className="text-[11px] text-slate-400 font-bold tracking-wider uppercase mt-0.5">Total de proventos pagos por mês</p>
            </div>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={rendimentoLast12Months} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="label" stroke="#94a3b8" fontSize={10} fontWeight={600} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={10} fontWeight={600} tickLine={false} />
                <Tooltip 
                  formatter={(val: number) => `R$ ${val.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
                  contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0" }}
                />
                <Line 
                  type="monotone" 
                  dataKey="Proventos" 
                  stroke="#10b981" 
                  strokeWidth={3} 
                  dot={{ r: 4, stroke: "#10b981", strokeWidth: 2, fill: "#fff" }} 
                  activeDot={{ r: 6 }} 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
}
