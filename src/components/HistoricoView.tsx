import React, { useState, useMemo } from "react";
import { Compra, Provento } from "../types";
import { History, CalendarDays, ArrowUpRight, ArrowDownRight, Trash2 } from "lucide-react";

interface HistoricoViewProps {
  compras: Compra[];
  proventos: Provento[];
  onDeleteCompra: (id: string) => Promise<void>;
  onDeleteProvento: (id: string) => Promise<void>;
}

type FilterType = "Anual" | "Proventos" | "Compras";

export function HistoricoView({
  compras,
  proventos,
  onDeleteCompra,
  onDeleteProvento
}: HistoricoViewProps) {
  const [activeFilter, setActiveFilter] = useState<FilterType>("Anual");

  // 1. Grouped by Year (Anual View)
  const yearlyData = useMemo(() => {
    const yearsMap: {
      [year: string]: {
        year: string;
        totalAportado: number;
        totalDividendos: number;
        assets: {
          [ticker: string]: {
            ticker: string;
            aportado: number;
            dividendos: number;
          };
        };
      };
    } = {};

    // Group purchases
    compras.forEach((c) => {
      const year = c.date.split("-")[0];
      if (!year) return;

      if (!yearsMap[year]) {
        yearsMap[year] = { year, totalAportado: 0, totalDividendos: 0, assets: {} };
      }

      yearsMap[year].totalAportado += c.total;

      const ticker = c.ticker.toUpperCase().trim();
      if (!yearsMap[year].assets[ticker]) {
        yearsMap[year].assets[ticker] = { ticker, aportado: 0, dividendos: 0 };
      }
      yearsMap[year].assets[ticker].aportado += c.total;
    });

    // Group proventos
    proventos.forEach((p) => {
      const year = p.date.split("-")[0];
      if (!year) return;

      if (!yearsMap[year]) {
        yearsMap[year] = { year, totalAportado: 0, totalDividendos: 0, assets: {} };
      }

      yearsMap[year].totalDividendos += p.amount;

      const ticker = p.ticker.toUpperCase().trim();
      if (!yearsMap[year].assets[ticker]) {
        yearsMap[year].assets[ticker] = { ticker, aportado: 0, dividendos: 0 };
      }
      yearsMap[year].assets[ticker].dividendos += p.amount;
    });

    // Convert map to sorted list
    return Object.values(yearsMap)
      .map((yearData) => ({
        ...yearData,
        assetsList: Object.values(yearData.assets).sort((a, b) => b.aportado - a.aportado)
      }))
      .sort((a, b) => b.year.localeCompare(a.year));
  }, [compras, proventos]);

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Title with filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-slate-200/85 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-slate-100 text-slate-700 rounded-xl">
            <History className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-wide">HISTÓRICO</h3>
            <p className="text-[11px] text-slate-400 font-bold tracking-wider uppercase mt-0.5">Extrato cronológico de investimentos</p>
          </div>
        </div>

        {/* Filter Segmented Control */}
        <div className="flex bg-slate-100 p-1 rounded-xl self-start md:self-center">
          {(["Anual", "Proventos", "Compras"] as FilterType[]).map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                activeFilter === filter
                  ? "bg-white text-slate-800 shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* ANUAL VIEW (Grouped as requested in the reference image) */}
      {activeFilter === "Anual" && (
        <div className="space-y-6">
          {yearlyData.length === 0 ? (
            <div className="bg-white border border-slate-200/85 rounded-2xl py-12 text-center text-slate-400">
              Nenhuma transação registrada ainda.
            </div>
          ) : (
            yearlyData.map((yearGroup) => (
              <div key={yearGroup.year} className="bg-white border border-slate-200/85 rounded-2xl overflow-hidden shadow-sm">
                {/* Year Header Card */}
                <div className="bg-slate-900 text-white p-5 md:px-8 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <span className="text-2xl font-bold tracking-tight">{yearGroup.year}</span>
                  <div className="flex flex-wrap items-center gap-4 md:gap-6 text-xs font-bold uppercase tracking-wider text-slate-300">
                    <div>
                      APORTADO: <span className="text-white text-sm font-bold ml-1">R$ {yearGroup.totalAportado.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="hidden sm:block text-slate-700">|</div>
                    <div>
                      DIVIDENDOS: <span className="text-emerald-400 text-sm font-bold ml-1">R$ {yearGroup.totalDividendos.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                </div>

                {/* Assets inside this Year */}
                <div className="divide-y divide-slate-100">
                  {yearGroup.assetsList.map((asset) => (
                    <div key={asset.ticker} className="p-5 md:px-8 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                      <span className="font-mono bg-slate-100 text-slate-900 border border-slate-200 px-2.5 py-1 rounded-md text-xs font-bold tracking-wider uppercase">{asset.ticker}</span>
                      
                      <div className="flex items-center gap-12 text-sm">
                        <div className="text-right">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Aportado</p>
                          <p className="font-bold text-blue-600">
                            {asset.aportado > 0 ? `R$ ${asset.aportado.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : "R$ 0,00"}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Dividendos</p>
                          <p className="font-bold text-emerald-600">
                            {asset.dividendos > 0 ? `R$ ${asset.dividendos.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : "R$ 0,00"}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* PROVENTOS LIST (Individual transaction logs with deletion) */}
      {activeFilter === "Proventos" && (
        <div className="bg-white border border-slate-200/85 rounded-2xl overflow-hidden shadow-sm">
          <div className="p-6 md:p-8 border-b border-slate-100 flex items-center gap-3">
            <CalendarDays className="w-5 h-5 text-emerald-600" />
            <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Lançamentos de Proventos</h4>
          </div>

          {proventos.length === 0 ? (
            <div className="py-12 text-center text-slate-400">Nenhum provento recebido ainda.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200/85 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="py-4 px-6">DATA</th>
                    <th className="py-4 px-6">TICKER</th>
                    <th className="py-4 px-6 text-right">VALOR RECEBIDO</th>
                    <th className="py-4 px-6 text-center">AÇÕES</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm font-semibold text-slate-600">
                  {proventos.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-4 px-6 font-mono text-xs">{p.date.split("-").reverse().join("/")}</td>
                      <td className="py-4 px-6">
                        <span className="font-mono bg-slate-100 text-slate-900 border border-slate-200 px-2.5 py-1 rounded-md text-xs font-bold tracking-wider uppercase">{p.ticker}</span>
                      </td>
                      <td className="py-4 px-6 text-right font-bold text-emerald-600">
                        R$ {p.amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-4 px-6 text-center">
                        <button
                          onClick={() => {
                            if (confirm("Deseja realmente excluir este lançamento de provento?")) {
                              onDeleteProvento(p.id);
                            }
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 transition-all cursor-pointer"
                          title="Excluir"
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
      )}

      {/* COMPRAS LIST (Individual transaction logs with deletion) */}
      {activeFilter === "Compras" && (
        <div className="bg-white border border-slate-200/85 rounded-2xl overflow-hidden shadow-sm">
          <div className="p-6 md:p-8 border-b border-slate-100 flex items-center gap-3">
            <CalendarDays className="w-5 h-5 text-blue-600" />
            <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Lançamentos de Compras</h4>
          </div>

          {compras.length === 0 ? (
            <div className="py-12 text-center text-slate-400">Nenhuma compra registrada ainda.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200/85 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="py-4 px-6">DATA</th>
                    <th className="py-4 px-6">TICKER</th>
                    <th className="py-4 px-6">CLASSE</th>
                    <th className="py-4 px-6 text-right">QTD</th>
                    <th className="py-4 px-6 text-right">PREÇO UNIT.</th>
                    <th className="py-4 px-6 text-right">APORTE TOTAL</th>
                    <th className="py-4 px-6 text-center">AÇÕES</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm font-semibold text-slate-600">
                  {compras.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-4 px-6 font-mono text-xs">{c.date.split("-").reverse().join("/")}</td>
                      <td className="py-4 px-6">
                        <div className="flex flex-col gap-1 items-start">
                          <span className="font-mono bg-slate-100 text-slate-900 border border-slate-200 px-2.5 py-1 rounded-md text-xs font-bold tracking-wider uppercase inline-block">{c.ticker}</span>
                          {c.sector && <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wide">{c.sector}</span>}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        {c.type ? (
                          <span className={`px-2 py-1 rounded-full text-[9px] font-extrabold uppercase tracking-wider border ${
                            c.type === "Ações" ? "bg-blue-50 text-blue-600 border-blue-100" :
                            c.type === "FIIs" ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                            c.type === "Renda Fixa" ? "bg-indigo-50 text-indigo-600 border-indigo-100" :
                            "bg-amber-50 text-amber-600 border-amber-100"
                          }`}>
                            {c.type}
                          </span>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-right font-bold text-slate-700">{c.quantity}</td>
                      <td className="py-4 px-6 text-right">R$ {c.price.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</td>
                      <td className="py-4 px-6 text-right font-bold text-blue-600">
                        R$ {c.total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-4 px-6 text-center">
                        <button
                          onClick={() => {
                            if (confirm("Deseja realmente excluir este lançamento de compra?")) {
                              onDeleteCompra(c.id);
                            }
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 transition-all cursor-pointer"
                          title="Excluir"
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
      )}

    </div>
  );
}
