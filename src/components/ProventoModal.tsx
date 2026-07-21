import React, { useState } from "react";
import { X, Calendar, Coins } from "lucide-react";

interface ProventoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (ticker: string, amount: number, date: string) => Promise<void>;
  existingTickers: string[];
}

export function ProventoModal({ isOpen, onClose, onConfirm, existingTickers }: ProventoModalProps) {
  const [date, setDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [ticker, setTicker] = useState<string>("");
  const [isCustomTicker, setIsCustomTicker] = useState(false);
  const [amount, setAmount] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  // Auto select default ticker if not customized and existingTickers has items
  React.useEffect(() => {
    if (existingTickers.length > 0 && !ticker && !isCustomTicker) {
      setTicker(existingTickers[0]);
    } else if (existingTickers.length === 0) {
      setIsCustomTicker(true);
    }
  }, [existingTickers, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticker.trim() || !amount || !date) {
      alert("Por favor, preencha todos os campos.");
      return;
    }

    const amtNum = parseFloat(amount);

    if (amtNum <= 0) {
      alert("O valor recebido deve ser maior que zero.");
      return;
    }

    try {
      setSubmitting(true);
      await onConfirm(ticker.toUpperCase().trim(), amtNum, date);
      setTicker("");
      setAmount("");
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
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
            <Coins className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-800">Lançar Proventos</h3>
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
                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
                required
              />
            </div>
          </div>

          {/* Ticker Selection */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Ativo (Ticker)</label>
              {existingTickers.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setIsCustomTicker(!isCustomTicker);
                    setTicker(isCustomTicker ? (existingTickers[0] || "") : "");
                  }}
                  className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold"
                >
                  {isCustomTicker ? "Selecionar da carteira" : "Digitar novo ticker"}
                </button>
              )}
            </div>

            {isCustomTicker || existingTickers.length === 0 ? (
              <input 
                type="text"
                placeholder="EX: VALE3"
                value={ticker}
                onChange={(e) => setTicker(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-700 font-semibold placeholder:text-slate-400 placeholder:font-normal focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all uppercase"
                required
              />
            ) : (
              <select
                value={ticker}
                onChange={(e) => setTicker(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
                required
              >
                {existingTickers.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Amount Received */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Valor Recebido (Total)</label>
            <input 
              type="number"
              step="any"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-700 font-semibold placeholder:text-slate-400 placeholder:font-normal focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
              required
            />
          </div>

          {/* Confirm Button */}
          <button 
            type="submit"
            disabled={submitting}
            className="w-full py-4 bg-emerald-600 text-white font-bold rounded-2xl hover:bg-emerald-700 active:scale-[0.98] transition-all shadow-lg shadow-emerald-200 disabled:bg-emerald-400 disabled:scale-100"
          >
            {submitting ? "Confirmando..." : "Confirmar Recebimento"}
          </button>
        </form>
      </div>
    </div>
  );
}
