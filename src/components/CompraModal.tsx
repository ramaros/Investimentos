import React, { useState } from "react";
import { X, Calendar, Wallet } from "lucide-react";

interface CompraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (ticker: string, quantity: number, price: number, date: string, type: string, sector: string) => Promise<void>;
}

export function CompraModal({ isOpen, onClose, onConfirm }: CompraModalProps) {
  const [date, setDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [ticker, setTicker] = useState<string>("");
  const [quantity, setQuantity] = useState<string>("");
  const [price, setPrice] = useState<string>("");
  const [assetClass, setAssetClass] = useState<string>("Ações");
  const [sector, setSector] = useState<string>("Financeiro");
  const [customSector, setCustomSector] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  // Sector lists by asset class
  const sectorsByClass: { [key: string]: string[] } = {
    "Ações": [
      "Financeiro",
      "Materiais Básicos",
      "Petróleo, Gás e Biocombustíveis",
      "Utilidade Pública",
      "Consumo Cíclico",
      "Saneamento",
      "Shopping Centers",
      "Tecnologia e Telecomunicações",
      "Saúde",
      "Outro (Digitar)"
    ],
    "FIIs": [
      "Tijolo - Logística",
      "Tijolo - Shopping",
      "Tijolo - Lajes Corporativas",
      "Tijolo - Híbrido",
      "Fundo de Papel (Crédito)",
      "Fundo de Fundos (FOFs)",
      "Outro (Digitar)"
    ],
    "Renda Fixa": [
      "Tesouro Selic",
      "Tesouro IPCA+",
      "Tesouro Pré-fixado",
      "CDB",
      "LCI / LCA",
      "CRI / CRA",
      "Debêntures",
      "Outro (Digitar)"
    ],
    "Criptomoedas": [
      "Criptoativos L1 (BTC, ETH, etc.)",
      "Protocolos L2 & DeFi",
      "Meme Coins",
      "Web3 & Games",
      "Stablecoins",
      "Outro (Digitar)"
    ]
  };

  // Reset sector when asset class changes
  React.useEffect(() => {
    const list = sectorsByClass[assetClass] || [];
    if (list.length > 0) {
      setSector(list[0]);
    }
  }, [assetClass]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticker.trim() || !quantity || !price || !date || !assetClass) {
      alert("Por favor, preencha todos os campos.");
      return;
    }

    const qtyNum = parseFloat(quantity);
    const priceNum = parseFloat(price);

    if (qtyNum <= 0 || priceNum <= 0) {
      alert("Quantidade e preço devem ser maiores que zero.");
      return;
    }

    const finalSector = sector === "Outro (Digitar)" ? (customSector.trim() || "Outros") : sector;

    try {
      setSubmitting(true);
      await onConfirm(ticker.toUpperCase().trim(), qtyNum, priceNum, date, assetClass, finalSector);
      setTicker("");
      setQuantity("");
      setPrice("");
      setCustomSector("");
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-white border border-slate-100 rounded-3xl p-6 shadow-2xl animate-scale-up">
        
        {/* Close Button */}
        <button 
          onClick={onClose} 
          className="absolute right-4 top-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
            <Wallet className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-800">Nova Compra</h3>
            <p className="text-xs text-slate-500">Registe os detalhes da operação.</p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Date Picker */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Data do Lançamento</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
              <input 
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                required
              />
            </div>
          </div>

          {/* Ticker */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Ativo (Ticker)</label>
            <input 
              type="text"
              placeholder="EX: BBAS3, VALE3, PETR4"
              value={ticker}
              onChange={(e) => setTicker(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-700 font-semibold placeholder:text-slate-400 placeholder:font-normal focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all uppercase"
              required
            />
          </div>

          {/* Classe de Ativo & Setor */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Classe de Ativo</label>
              <select
                value={assetClass}
                onChange={(e) => setAssetClass(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                required
              >
                <option value="Ações">Ações</option>
                <option value="FIIs">FIIs (Fundos Imob.)</option>
                <option value="Renda Fixa">Renda Fixa</option>
                <option value="Criptomoedas">Criptomoedas</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Setor / Subclasse</label>
              <select
                value={sector}
                onChange={(e) => setSector(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                required
              >
                {(sectorsByClass[assetClass] || []).map((sec) => (
                  <option key={sec} value={sec}>{sec}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Custom Sector Input if "Outro (Digitar)" is selected */}
          {sector === "Outro (Digitar)" && (
            <div className="animate-fade-in">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Digite o Setor Personalizado</label>
              <input 
                type="text"
                placeholder="Ex: Infraestrutura, Web3, Energia Solar"
                value={customSector}
                onChange={(e) => setCustomSector(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-700 font-semibold placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                required
              />
            </div>
          )}

          {/* Quantity & Price */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Quantidade</label>
              <input 
                type="number"
                step="any"
                placeholder="0.00"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-700 font-semibold placeholder:text-slate-400 placeholder:font-normal focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Preço Pago Unit.</label>
              <input 
                type="number"
                step="any"
                placeholder="0.00"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-700 font-semibold placeholder:text-slate-400 placeholder:font-normal focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                required
              />
            </div>
          </div>

          {/* Total Preview */}
          {quantity && price && (
            <div className="p-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200 flex justify-between items-center">
              <span className="text-sm font-semibold text-slate-500">Aporte Estimado:</span>
              <span className="text-lg font-bold text-blue-600">
                R$ {(parseFloat(quantity) * parseFloat(price)).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          )}

          {/* Confirm Button */}
          <button 
            type="submit"
            disabled={submitting}
            className="w-full py-4 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 active:scale-[0.98] transition-all shadow-lg shadow-blue-200 disabled:bg-blue-400 disabled:scale-100"
          >
            {submitting ? "Confirmando..." : "Confirmar Compra"}
          </button>
        </form>
      </div>
    </div>
  );
}
