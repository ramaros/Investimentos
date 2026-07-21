import React, { useMemo, useState } from "react";
import { AssetSummary } from "../types";
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
  AreaChart, 
  Area 
} from "recharts";
import { 
  TrendingUp, 
  ShieldCheck, 
  Percent, 
  BarChart3, 
  LineChart, 
  Briefcase, 
  Sliders, 
  AlertTriangle,
  Info
} from "lucide-react";

interface AnaliseViewProps {
  assetSummaries: AssetSummary[];
}

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#06b6d4"];

export function AnaliseView({ assetSummaries }: AnaliseViewProps) {
  // Inputs for Projection
  const [years, setYears] = useState<number>(10);
  const [monthlyAporte, setMonthlyAporte] = useState<number>(1000);

  // 1. Current Portfolio Value & Weights
  const currentTotalValue = useMemo(() => {
    return assetSummaries.reduce((sum, item) => sum + item.currentTotalValue, 0);
  }, [assetSummaries]);

  // Group by Asset Class (Classe de Ativo)
  const classAllocation = useMemo(() => {
    const classMap: { [key: string]: number } = {
      "Ações": 0,
      "FIIs": 0,
      "Renda Fixa": 0,
      "Criptomoedas": 0
    };

    assetSummaries.forEach((a) => {
      const type = a.type || "Ações";
      if (classMap[type] !== undefined) {
        classMap[type] += a.currentTotalValue;
      } else {
        classMap[type] = a.currentTotalValue;
      }
    });

    const total = Object.values(classMap).reduce((sum, val) => sum + val, 0);

    return Object.entries(classMap).map(([name, value]) => ({
      name,
      value: parseFloat(value.toFixed(2)),
      weight: total > 0 ? value / total : 0,
      percentage: total > 0 ? ((value / total) * 100).toFixed(1) + "%" : "0%"
    })).filter(item => item.value > 0 || currentTotalValue === 0);
  }, [assetSummaries, currentTotalValue]);

  // Group by Sector (Setor de Ativo)
  const sectorAllocation = useMemo(() => {
    const sectorMap: { [key: string]: number } = {};

    assetSummaries.forEach((a) => {
      const sector = a.sector || "Outros";
      sectorMap[sector] = (sectorMap[sector] || 0) + a.currentTotalValue;
    });

    const total = Object.values(sectorMap).reduce((sum, val) => sum + val, 0);

    return Object.entries(sectorMap)
      .map(([name, value]) => ({
        name,
        value: parseFloat(value.toFixed(2)),
        weight: total > 0 ? value / total : 0,
        percent: total > 0 ? parseFloat(((value / total) * 100).toFixed(1)) : 0
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10); // Top 10 sectors
  }, [assetSummaries]);

  // 2. Risk Metrics (Volatility & Beta)
  // Industry-standard assumptions for class risks:
  // Volatilities: Fixed Income: 3%, FIIs: 11%, Stocks: 23%, Crypto: 65%
  // Betas (relative to market benchmark): Fixed Income: 0.05, FIIs: 0.35, Stocks: 1.05, Crypto: 2.15
  const riskMetrics = useMemo(() => {
    let portfolioVol = 0;
    let portfolioBeta = 0;

    const classVols: { [key: string]: number } = {
      "Renda Fixa": 0.028, // 2.8%
      "FIIs": 0.115,       // 11.5%
      "Ações": 0.23,        // 23.0%
      "Criptomoedas": 0.65  // 65.0%
    };

    const classBetas: { [key: string]: number } = {
      "Renda Fixa": 0.02,
      "FIIs": 0.38,
      "Ações": 1.05,
      "Criptomoedas": 2.10
    };

    classAllocation.forEach((item) => {
      const vol = classVols[item.name] || 0.23;
      const beta = classBetas[item.name] || 1.0;
      portfolioVol += item.weight * vol;
      portfolioBeta += item.weight * beta;
    });

    // If portfolio is empty, set defaults
    if (currentTotalValue === 0) {
      return { volatility: 0, beta: 0, rating: "Sem Ativos", ratingColor: "text-slate-400 bg-slate-100 border-slate-200" };
    }

    let rating = "Moderado";
    let ratingColor = "text-amber-700 bg-amber-50 border-amber-200";

    if (portfolioVol < 0.06) {
      rating = "Conservador (Baixo Risco)";
      ratingColor = "text-emerald-700 bg-emerald-50 border-emerald-200";
    } else if (portfolioVol < 0.15) {
      rating = "Moderado (Médio Risco)";
      ratingColor = "text-blue-700 bg-blue-50 border-blue-200";
    } else if (portfolioVol < 0.30) {
      rating = "Arrojado (Alto Risco)";
      ratingColor = "text-orange-700 bg-orange-50 border-orange-200";
    } else {
      rating = "Ultra Arrojado (Risco Elevado)";
      ratingColor = "text-rose-700 bg-rose-50 border-rose-200";
    }

    return {
      volatility: portfolioVol * 100, // as percentage
      beta: portfolioBeta,
      rating,
      ratingColor
    };
  }, [classAllocation, currentTotalValue]);

  // 3. Projections Formula (Compound interest with monthly deposits)
  // Projected yearly series
  const projectionData = useMemo(() => {
    // Expected annualized returns by class:
    // Estresse / Bear: Renda Fixa: 8.5%, FIIs: -2%, Stocks: -8%, Crypto: -30%
    // Histórico / Neutro: Renda Fixa: 10.5%, FIIs: 11.5%, Stocks: 14%, Crypto: 28%
    // Otimista / Bull: Renda Fixa: 11.5%, FIIs: 18%, Stocks: 24%, Crypto: 75%
    
    let rateStress = 0;
    let rateHist = 0;
    let rateOptimistic = 0;

    const stressReturns: { [key: string]: number } = { "Renda Fixa": 0.08, "FIIs": -0.01, "Ações": -0.06, "Criptomoedas": -0.25 };
    const histReturns: { [key: string]: number } = { "Renda Fixa": 0.1025, "FIIs": 0.115, "Ações": 0.142, "Criptomoedas": 0.30 };
    const optReturns: { [key: string]: number } = { "Renda Fixa": 0.115, "FIIs": 0.18, "Ações": 0.245, "Criptomoedas": 0.70 };

    classAllocation.forEach((item) => {
      rateStress += item.weight * (stressReturns[item.name] || -0.05);
      rateHist += item.weight * (histReturns[item.name] || 0.12);
      rateOptimistic += item.weight * (optReturns[item.name] || 0.22);
    });

    // If portfolio is empty, use standard average rates
    if (currentTotalValue === 0) {
      rateStress = 0.06;
      rateHist = 0.11;
      rateOptimistic = 0.18;
    }

    const dataList = [];
    const pv = currentTotalValue; // present value
    const pmt = monthlyAporte;   // monthly deposit

    // Year 0
    dataList.push({
      year: "Hoje",
      "Estresse / Urso": parseFloat(pv.toFixed(0)),
      "Média Histórica": parseFloat(pv.toFixed(0)),
      "Otimista / Touro": parseFloat(pv.toFixed(0))
    });

    for (let y = 1; y <= years; y++) {
      // Stress projection
      const fvStress = pv * Math.pow(1 + rateStress, y) + 
        pmt * ((Math.pow(1 + rateStress / 12, 12 * y) - 1) / (rateStress / 12)) * (1 + rateStress / 12);
      
      // Historical average projection
      const fvHist = pv * Math.pow(1 + rateHist, y) + 
        pmt * ((Math.pow(1 + rateHist / 12, 12 * y) - 1) / (rateHist / 12)) * (1 + rateHist / 12);
      
      // Optimistic projection
      const fvOpt = pv * Math.pow(1 + rateOptimistic, y) + 
        pmt * ((Math.pow(1 + rateOptimistic / 12, 12 * y) - 1) / (rateOptimistic / 12)) * (1 + rateOptimistic / 12);

      dataList.push({
        year: `Ano ${y}`,
        "Estresse / Urso": parseFloat(Math.max(0, fvStress).toFixed(0)),
        "Média Histórica": parseFloat(fvHist.toFixed(0)),
        "Otimista / Touro": parseFloat(fvOpt.toFixed(0))
      });
    }

    return dataList;
  }, [classAllocation, currentTotalValue, years, monthlyAporte]);

  // Asset correlation table grid data
  const correlationMatrix = [
    { row: "Ações", Ações: 1.0, FIIs: 0.38, "Renda Fixa": -0.15, Criptomoedas: 0.42 },
    { row: "FIIs", Ações: 0.38, FIIs: 1.0, "Renda Fixa": 0.08, Criptomoedas: 0.15 },
    { row: "Renda Fixa", Ações: -0.15, FIIs: 0.08, "Renda Fixa": 1.0, Criptomoedas: -0.05 },
    { row: "Criptomoedas", Ações: 0.42, FIIs: 0.15, "Renda Fixa": -0.05, Criptomoedas: 1.0 }
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* 1. DIVERSIFICATION SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Classes de Ativo */}
        <div className="bg-white border border-slate-200/85 rounded-2xl p-6 md:p-8 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                <Briefcase className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 tracking-wide uppercase">Alocação por Classe de Ativo</h4>
                <p className="text-[11px] text-slate-400 font-bold tracking-wider uppercase mt-0.5">Equilíbrio do Portfólio</p>
              </div>
            </div>

            {classAllocation.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-slate-400 font-medium text-sm">
                Nenhum ativo cadastrado para análise.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                <div className="md:col-span-6 h-56 relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={classAllocation}
                        cx="50%"
                        cy="50%"
                        innerRadius={65}
                        outerRadius={85}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {classAllocation.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(val: number) => `R$ ${val.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
                        contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0" }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-[9px] uppercase tracking-widest font-bold text-slate-400">Total</span>
                    <span className="text-base font-bold text-slate-800">
                      R$ {currentTotalValue.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}
                    </span>
                  </div>
                </div>

                <div className="md:col-span-6 space-y-2.5">
                  {classAllocation.map((item, index) => (
                    <div key={item.name} className="flex justify-between items-center text-xs p-2 bg-slate-50 border border-slate-100 rounded-xl">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                        <span className="font-bold text-slate-700">{item.name}</span>
                      </div>
                      <div className="text-right font-bold text-slate-900">
                        <span>{item.percentage}</span>
                        <span className="block text-[10px] text-slate-400 font-semibold">R$ {item.value.toLocaleString("pt-BR")}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Alocação Setorial */}
        <div className="bg-white border border-slate-200/85 rounded-2xl p-6 md:p-8 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                <BarChart3 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 tracking-wide uppercase">Distribuição Setorial</h4>
                <p className="text-[11px] text-slate-400 font-bold tracking-wider uppercase mt-0.5">Top Setores do Portfólio</p>
              </div>
            </div>

            {sectorAllocation.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-slate-400 font-medium text-sm">
                Sem setores para exibir.
              </div>
            ) : (
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={sectorAllocation} layout="vertical" margin={{ top: 0, right: 10, left: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                    <XAxis type="number" stroke="#94a3b8" fontSize={9} fontWeight={600} tickLine={false} />
                    <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={9} fontWeight={700} tickLine={false} width={80} />
                    <Tooltip 
                      formatter={(val: number) => `R$ ${val.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
                      contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0" }}
                    />
                    <Bar dataKey="value" fill="#6366f1" radius={[0, 4, 4, 0]} name="Valor Investido" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* 2. RISK ANALYSIS AND CORRELATION HEATMAP */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Risk Metrics Cards */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white border border-slate-200/85 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wide">Análise de Risco</h4>
            </div>

            <div className="space-y-4">
              {/* Rating */}
              <div className={`p-4 rounded-xl border flex flex-col justify-center items-center text-center ${riskMetrics.ratingColor}`}>
                <span className="text-[10px] font-extrabold tracking-widest uppercase">Perfil do Portfólio</span>
                <span className="text-lg font-extrabold mt-1">{riskMetrics.rating}</span>
              </div>

              {/* Volatility */}
              <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-bold text-slate-500">Volatilidade Anualizada</span>
                  <span className="text-sm font-extrabold text-slate-800">{riskMetrics.volatility.toFixed(2)}%</span>
                </div>
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden mt-2">
                  <div 
                    className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-yellow-500 to-rose-500 transition-all duration-1000" 
                    style={{ width: `${Math.min(100, (riskMetrics.volatility / 40) * 100)}%` }}
                  />
                </div>
                <span className="text-[10px] text-slate-400 font-semibold block mt-2 leading-relaxed">
                  Indica a flutuação média esperada da sua carteira em um ano. Valores baixos significam maior estabilidade.
                </span>
              </div>

              {/* Beta */}
              <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-500">Beta do Portfólio</span>
                  <span className="text-sm font-extrabold text-slate-800">{riskMetrics.beta.toFixed(2)}</span>
                </div>
                <div className="flex items-center gap-1.5 mt-2.5">
                  <span className="text-[10px] text-slate-400 font-semibold leading-relaxed">
                    Mede a sensibilidade ao Ibovespa. Um Beta de 1.00 se move em sincronia com a bolsa. 
                    {riskMetrics.beta < 0.5 ? " Sua carteira é altamente defensiva." : riskMetrics.beta > 1.2 ? " Sua carteira é agressiva/direcionada." : " Sua carteira acompanha o mercado."}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Correlation Heatmap */}
        <div className="lg:col-span-7 bg-white border border-slate-200/85 rounded-2xl p-6 md:p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <Percent className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 tracking-wide uppercase">Matriz de Correlação do Mercado</h4>
              <p className="text-[11px] text-slate-400 font-bold tracking-wider uppercase mt-0.5">Grau de diversificação entre classes</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-center border-collapse">
              <thead>
                <tr className="text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 bg-slate-50">
                  <th className="py-2.5 px-3 text-left">CLASSE</th>
                  <th className="py-2.5 px-3">AÇÕES</th>
                  <th className="py-2.5 px-3">FIIs</th>
                  <th className="py-2.5 px-3">REND. FIXA</th>
                  <th className="py-2.5 px-3">CRIPTO</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {correlationMatrix.map((row) => (
                  <tr key={row.row} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-3 text-left font-bold text-slate-600 uppercase text-[10px] tracking-wide">
                      {row.row}
                    </td>
                    
                    {/* Ações */}
                    <td className="py-3 px-1 font-bold">
                      <span className={`px-2 py-1.5 rounded-lg block font-mono ${
                        row.Ações === 1 ? "bg-slate-100 text-slate-500" :
                        row.Ações > 0.3 ? "bg-emerald-50 text-emerald-700" :
                        row.Ações < 0 ? "bg-rose-50 text-rose-700" : "bg-blue-50 text-blue-700"
                      }`}>
                        {row.Ações.toFixed(2)}
                      </span>
                    </td>

                    {/* FIIs */}
                    <td className="py-3 px-1 font-bold">
                      <span className={`px-2 py-1.5 rounded-lg block font-mono ${
                        row.FIIs === 1 ? "bg-slate-100 text-slate-500" :
                        row.FIIs > 0.3 ? "bg-emerald-50 text-emerald-700" :
                        row.FIIs < 0 ? "bg-rose-50 text-rose-700" : "bg-blue-50 text-blue-700"
                      }`}>
                        {row.FIIs.toFixed(2)}
                      </span>
                    </td>

                    {/* Renda Fixa */}
                    <td className="py-3 px-1 font-bold">
                      <span className={`px-2 py-1.5 rounded-lg block font-mono ${
                        row["Renda Fixa"] === 1 ? "bg-slate-100 text-slate-500" :
                        row["Renda Fixa"] > 0.3 ? "bg-emerald-50 text-emerald-700" :
                        row["Renda Fixa"] < 0 ? "bg-rose-50 text-rose-700" : "bg-blue-50 text-blue-700"
                      }`}>
                        {row["Renda Fixa"].toFixed(2)}
                      </span>
                    </td>

                    {/* Cripto */}
                    <td className="py-3 px-1 font-bold">
                      <span className={`px-2 py-1.5 rounded-lg block font-mono ${
                        row.Criptomoedas === 1 ? "bg-slate-100 text-slate-500" :
                        row.Criptomoedas > 0.3 ? "bg-emerald-50 text-emerald-700" :
                        row.Criptomoedas < 0 ? "bg-rose-50 text-rose-700" : "bg-blue-50 text-blue-700"
                      }`}>
                        {row.Criptomoedas.toFixed(2)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-start gap-2.5 bg-blue-50/50 border border-blue-100 p-3.5 rounded-xl mt-5">
            <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <p className="text-[10px] text-blue-700 leading-relaxed font-medium">
              <strong>Como ler:</strong> Correlações próximas de <strong>1.0</strong> indicam que as classes se movem na mesma direção. 
              Valores próximos a <strong>0.0</strong> ou <strong>negativos</strong> (como Renda Fixa vs Ações) indicam um excelente 
              equilíbrio de diversificação — protegendo seu patrimônio em momentos de estresse de mercado.
            </p>
          </div>
        </div>

      </div>

      {/* 3. HISTORICAL SCENARIOS AND RETURN PROJECTIONS */}
      <div className="bg-white border border-slate-200/85 rounded-2xl p-6 md:p-8 shadow-sm">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 border-b border-slate-100 pb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <LineChart className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 tracking-wide uppercase">Projeção de Patrimônio Futuro</h4>
              <p className="text-[11px] text-slate-400 font-bold tracking-wider uppercase mt-0.5">Cenários baseados no histórico das classes</p>
            </div>
          </div>

          {/* Interactive Controllers */}
          <div className="flex flex-wrap items-center gap-4">
            {/* Aporte Mensal */}
            <div className="space-y-1">
              <label className="block text-[9px] font-extrabold text-slate-400 uppercase">Aporte Mensal (R$)</label>
              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
                <Sliders className="w-3.5 h-3.5 text-slate-400" />
                <input 
                  type="number"
                  value={monthlyAporte}
                  onChange={(e) => setMonthlyAporte(Number(e.target.value) || 0)}
                  className="w-20 bg-transparent text-xs font-bold text-slate-700 focus:outline-none"
                />
              </div>
            </div>

            {/* Prazo */}
            <div className="space-y-1">
              <label className="block text-[9px] font-extrabold text-slate-400 uppercase">Prazo (Anos)</label>
              <select
                value={years}
                onChange={(e) => setYears(Number(e.target.value))}
                className="bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 focus:outline-none"
              >
                <option value={5}>5 Anos</option>
                <option value={10}>10 Anos</option>
                <option value={20}>20 Anos</option>
                <option value={30}>30 Anos</option>
              </select>
            </div>
          </div>
        </div>

        {/* Quick Selection Chips */}
        <div className="flex flex-wrap gap-2 mb-6">
          <span className="text-[10px] font-bold text-slate-400 uppercase self-center mr-2">Sugestões de Aporte:</span>
          {[0, 200, 500, 1000, 2000, 5000].map((val) => (
            <button
              key={val}
              onClick={() => setMonthlyAporte(val)}
              className={`px-3 py-1.5 rounded-full text-[10px] font-bold tracking-wide cursor-pointer transition-colors ${
                monthlyAporte === val 
                  ? "bg-blue-600 text-white" 
                  : "bg-slate-100 text-slate-500 hover:bg-slate-200"
              }`}
            >
              R$ {val}
            </button>
          ))}
        </div>

        {/* Simulation Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          <div className="lg:col-span-8 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={projectionData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorStress" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0}/>
                  </linearGradient>
                  <linearGradient id="colorHist" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0}/>
                  </linearGradient>
                  <linearGradient id="colorOpt" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="year" stroke="#94a3b8" fontSize={10} fontWeight={600} tickLine={false} />
                <YAxis 
                  stroke="#94a3b8" 
                  fontSize={10} 
                  fontWeight={600} 
                  tickLine={false}
                  tickFormatter={(val) => `R$ ${(val/1000).toFixed(0)}k`}
                />
                <Tooltip 
                  formatter={(val: number) => `R$ ${val.toLocaleString("pt-BR")}`}
                  contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0" }}
                />
                <Legend verticalAlign="top" height={36} iconSize={10} />
                
                {/* Optimistic scenario */}
                <Area 
                  type="monotone" 
                  dataKey="Otimista / Touro" 
                  stroke="#10b981" 
                  strokeWidth={2.5}
                  fillOpacity={1} 
                  fill="url(#colorOpt)" 
                />
                
                {/* Historical scenario */}
                <Area 
                  type="monotone" 
                  dataKey="Média Histórica" 
                  stroke="#2563eb" 
                  strokeWidth={2.5}
                  fillOpacity={1} 
                  fill="url(#colorHist)" 
                />

                {/* Stress scenario */}
                <Area 
                  type="monotone" 
                  dataKey="Estresse / Urso" 
                  stroke="#f43f5e" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorStress)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="lg:col-span-4 space-y-4">
            <h5 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">Patrimônio Esperado em {years} anos</h5>
            
            {/* Display Year projection totals */}
            {projectionData.length > 0 && (
              <div className="space-y-3">
                {/* Otimista */}
                <div className="p-4 bg-emerald-50/50 border border-emerald-100 rounded-2xl flex justify-between items-center">
                  <div>
                    <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wide">Cenário Otimista</span>
                    <p className="text-[9px] text-emerald-500 font-semibold mt-0.5">Mercado em forte alta</p>
                  </div>
                  <span className="text-base font-extrabold text-emerald-700">
                    R$ {projectionData[projectionData.length - 1]["Otimista / Touro"].toLocaleString("pt-BR")}
                  </span>
                </div>

                {/* Histórico */}
                <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-2xl flex justify-between items-center">
                  <div>
                    <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wide">Média Histórica</span>
                    <p className="text-[9px] text-blue-500 font-semibold mt-0.5">Expectativa realista</p>
                  </div>
                  <span className="text-base font-extrabold text-blue-700">
                    R$ {projectionData[projectionData.length - 1]["Média Histórica"].toLocaleString("pt-BR")}
                  </span>
                </div>

                {/* Estresse */}
                <div className="p-4 bg-rose-50/50 border border-rose-100 rounded-2xl flex justify-between items-center">
                  <div>
                    <span className="text-[10px] font-bold text-rose-600 uppercase tracking-wide">Cenário Estresse</span>
                    <p className="text-[9px] text-rose-500 font-semibold mt-0.5">Sucessivas quedas/crise</p>
                  </div>
                  <span className="text-base font-extrabold text-rose-700">
                    R$ {projectionData[projectionData.length - 1]["Estresse / Urso"].toLocaleString("pt-BR")}
                  </span>
                </div>
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}
