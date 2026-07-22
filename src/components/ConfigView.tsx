import React, { useRef, useState } from "react";
import { Database, Download, Upload, Trash2, ShieldAlert, BadgeInfo, CheckCircle, RefreshCw, Key, HelpCircle, ShieldCheck } from "lucide-react";
import { getQuote, setCustomPrice, getAllQuotes } from "../services/market";
import { StockQuote } from "../types";

interface ConfigViewProps {
  onExport: () => void;
  onImport: (json: any) => Promise<void>;
  onClearAll: () => Promise<void>;
  userEmail?: string;
  isOfflineMode: boolean;
  onGoogleSignIn?: () => Promise<void>;
}

export function ConfigView({
  onExport,
  onImport,
  onClearAll,
  userEmail,
  isOfflineMode,
  onGoogleSignIn
}: ConfigViewProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importStatus, setImportStatus] = useState<{ type: "success" | "error" | null; msg: string }>({ type: null, msg: "" });
  const [clearing, setClearing] = useState(false);
  
  // Custom manual price controls
  const [manualTicker, setManualTicker] = useState("");
  const [manualPrice, setManualPrice] = useState("");
  const [overrideSuccess, setOverrideSuccess] = useState(false);

  // Custom Firebase configuration states
  const [customFirebaseJson, setCustomFirebaseJson] = useState(() => {
    return localStorage.getItem("custom_firebase_config") || "";
  });
  const [firebaseSaveSuccess, setFirebaseSaveSuccess] = useState(false);
  const [firebaseError, setFirebaseError] = useState<string | null>(null);

  // Helper parser for Firebase config copy-pasted text
  const parseFirebaseConfig = (text: string) => {
    try {
      // Direct strict JSON parse
      const parsed = JSON.parse(text);
      if (parsed.apiKey && parsed.projectId && parsed.appId) {
        return parsed;
      }
    } catch (e) {}

    // Regex extract values for lenient copy-pasting (can handle raw JS objects or strings)
    const apiKeyMatch = text.match(/apiKey:\s*["']([^"']+)["']|["']apiKey["']:\s*["']([^"']+)["']/);
    const authDomainMatch = text.match(/authDomain:\s*["']([^"']+)["']|["']authDomain["']:\s*["']([^"']+)["']/);
    const projectIdMatch = text.match(/projectId:\s*["']([^"']+)["']|["']projectId["']:\s*["']([^"']+)["']/);
    const storageBucketMatch = text.match(/storageBucket:\s*["']([^"']+)["']|["']storageBucket["']:\s*["']([^"']+)["']/);
    const messagingSenderIdMatch = text.match(/messagingSenderId:\s*["']([^"']+)["']|["']messagingSenderId["']:\s*["']([^"']+)["']/);
    const appIdMatch = text.match(/appId:\s*["']([^"']+)["']|["']appId["']:\s*["']([^"']+)["']/);

    const apiKey = apiKeyMatch ? (apiKeyMatch[1] || apiKeyMatch[2]) : null;
    const authDomain = authDomainMatch ? (authDomainMatch[1] || authDomainMatch[2]) : null;
    const projectId = projectIdMatch ? (projectIdMatch[1] || projectIdMatch[2]) : null;
    const storageBucket = storageBucketMatch ? (storageBucketMatch[1] || storageBucketMatch[2]) : null;
    const messagingSenderId = messagingSenderIdMatch ? (messagingSenderIdMatch[1] || messagingSenderIdMatch[2]) : null;
    const appId = appIdMatch ? (appIdMatch[1] || appIdMatch[2]) : null;

    if (apiKey && projectId && appId) {
      return { apiKey, authDomain, projectId, storageBucket, messagingSenderId, appId };
    }

    return null;
  };

  const handleSaveCustomFirebase = (e: React.FormEvent) => {
    e.preventDefault();
    setFirebaseError(null);
    setFirebaseSaveSuccess(false);

    if (!customFirebaseJson.trim()) {
      setFirebaseError("Por favor, cole um objeto de configuração do Firebase.");
      return;
    }

    const config = parseFirebaseConfig(customFirebaseJson);
    if (!config) {
      setFirebaseError("Não foi possível detectar as credenciais de um projeto Firebase. Certifique-se de incluir apiKey, projectId e appId.");
      return;
    }

    try {
      localStorage.setItem("custom_firebase_config", JSON.stringify(config, null, 2));
      sessionStorage.removeItem("investflow_session_unlocked");
      setFirebaseSaveSuccess(true);
      setTimeout(() => {
        // Reload to let main.tsx initialize with new credentials
        window.location.reload();
      }, 1500);
    } catch (err: any) {
      setFirebaseError("Falha ao salvar configuração: " + err.message);
    }
  };

  const handleClearCustomFirebase = () => {
    if (window.confirm("Deseja mesmo redefinir para o Firebase padrão do InvestFlow? O aplicativo será recarregado.")) {
      localStorage.removeItem("custom_firebase_config");
      sessionStorage.removeItem("investflow_session_unlocked");
      window.location.reload();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);
        await onImport(parsed);
        setImportStatus({ type: "success", msg: "Backup importado com sucesso! Dados sincronizados." });
        setTimeout(() => setImportStatus({ type: null, msg: "" }), 5000);
      } catch (err) {
        console.error(err);
        setImportStatus({ type: "error", msg: "Falha ao importar backup. Verifique se o arquivo JSON está no formato correto." });
        setTimeout(() => setImportStatus({ type: null, msg: "" }), 5000);
      }
    };
    reader.readAsText(file);
  };

  const handleClearClick = async () => {
    const firstConfirm = confirm("ATENÇÃO: Você está prestes a excluir TODOS os registros de investimento. Deseja continuar?");
    if (!firstConfirm) return;

    const secondConfirm = confirm("Deseja realmente confirmar a exclusão definitiva? Esta ação NÃO pode ser desfeita!");
    if (!secondConfirm) return;

    try {
      setClearing(true);
      await onClearAll();
      alert("Todos os dados foram excluídos com sucesso.");
    } catch (err) {
      console.error(err);
      alert("Erro ao excluir dados.");
    } finally {
      setClearing(false);
    }
  };

  const handleOverridePriceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const tickerUpper = manualTicker.toUpperCase().trim();
    const priceNum = parseFloat(manualPrice);

    if (!tickerUpper || isNaN(priceNum) || priceNum <= 0) {
      alert("Por favor, informe um ticker e preço válidos.");
      return;
    }

    setCustomPrice(tickerUpper, priceNum);
    setOverrideSuccess(true);
    setManualTicker("");
    setManualPrice("");
    setTimeout(() => setOverrideSuccess(false), 3000);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Header */}
      <div className="flex items-center gap-3 bg-white border border-slate-200/85 rounded-2xl p-6 shadow-sm">
        <div className="p-3 bg-slate-100 text-slate-700 rounded-xl">
          <Database className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-slate-950 font-sans uppercase tracking-wide">GESTÃO DA BASE</h3>
          <p className="text-[11px] text-slate-400 font-bold uppercase mt-0.5">Gerencie seus dados e configurações do aplicativo</p>
        </div>
      </div>

      {/* Sync Status Box */}
      <div className="bg-slate-50/60 border border-slate-200/60 rounded-xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <BadgeInfo className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-slate-900 text-sm">Status de Sincronização</h4>
            <p className="text-xs text-slate-500 font-medium leading-relaxed max-w-xl mt-1">
              {isOfflineMode 
                ? "Você está utilizando o modo Sandbox Local (offline). Seus dados estão salvos neste navegador. Faça login com o Google para salvar e sincronizar em tempo real entre o Windows e Celular."
                : `Conectado via conta Google (${userEmail}). Seus investimentos estão sendo sincronizados na nuvem em tempo real.`
              }
            </p>
          </div>
        </div>

        {isOfflineMode && onGoogleSignIn && (
          <button
            onClick={onGoogleSignIn}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-bold rounded-xl transition-all shadow-sm self-start md:self-center cursor-pointer"
          >
            Fazer Login com Google
          </button>
        )}
      </div>

      {/* Import / Export Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Export Base */}
        <div className="bg-white border border-slate-200/85 rounded-2xl p-6 md:p-8 shadow-sm flex flex-col justify-between items-start space-y-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-slate-900 text-white rounded-xl">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wide">Exportar Dados</h4>
              <p className="text-[11px] text-slate-400 font-bold uppercase mt-0.5">Gere um backup completo em JSON.</p>
            </div>
          </div>
          <button
            onClick={onExport}
            className="w-full py-3 bg-[#0f172a] text-white font-bold rounded-xl hover:bg-slate-800 transition-all shadow-sm active:scale-[0.98] flex items-center justify-center gap-2 text-xs cursor-pointer"
          >
            <Download className="w-4 h-4" /> Baixar Backup
          </button>
        </div>

        {/* Import Base */}
        <div className="bg-white border border-slate-200/85 rounded-2xl p-6 md:p-8 shadow-sm flex flex-col justify-between items-start space-y-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wide">Importar Dados</h4>
              <p className="text-[11px] text-slate-400 font-bold uppercase mt-0.5">Adicione dados via JSON.</p>
            </div>
          </div>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".json"
            className="hidden"
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-all shadow-sm active:scale-[0.98] flex items-center justify-center gap-2 text-xs cursor-pointer"
          >
            <Upload className="w-4 h-4" /> Selecionar Ficheiro
          </button>
        </div>

      </div>

      {/* Import statuses alerts */}
      {importStatus.type && (
        <div className={`p-4 rounded-xl flex items-center gap-3 border ${
          importStatus.type === "success" 
            ? "bg-emerald-50 border-emerald-200 text-emerald-800" 
            : "bg-rose-50 border-rose-200 text-rose-800"
        }`}>
          <CheckCircle className="w-5 h-5 shrink-0" />
          <span className="text-xs font-bold">{importStatus.msg}</span>
        </div>
      )}

      {/* CONEXÃO FIREBASE PERSONALIZADA (Bypass de Domínio Autorizado) */}
      <div className="bg-white border border-slate-200/85 rounded-2xl p-6 md:p-8 shadow-sm">
        <div className="flex items-start gap-4 mb-6">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Key className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-950 uppercase tracking-wide">Banco de Dados Firebase Próprio</h4>
            <p className="text-[11px] text-slate-400 font-bold uppercase mt-0.5">Sincronize seus dados em qualquer domínio sem restrições de permissão</p>
          </div>
        </div>

        {/* Informative notice explaining the issue and step-by-step solution */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 mb-6 space-y-4 text-xs font-medium text-slate-600 leading-relaxed">
          <div className="flex items-start gap-2 text-slate-800 font-bold">
            <HelpCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <span>Por que configurar um Firebase próprio?</span>
          </div>
          <p>
            O Firebase padrão do InvestFlow é gerenciado pelo AI Studio, o que impede que você autorize o seu domínio de publicação (<strong>ramaros.github.io</strong>) diretamente para login com Google (erro de permissão no console).
          </p>
          <p className="font-semibold text-slate-800">
            Você pode corrigir isso de forma definitiva e ter um banco de dados 100% seu e grátis em 4 passos simples:
          </p>
          <ol className="list-decimal pl-5 space-y-2.5">
            <li>Acesse o <a href="https://console.firebase.google.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 font-bold hover:underline inline-flex items-center gap-0.5">Console do Firebase</a> com sua conta Google e crie um novo projeto gratuito.</li>
            <li>No menu lateral, ative o <strong>Firestore Database</strong> (crie em Modo Produção ou Teste) e habilite o provedor de login <strong>Google</strong> na guia <strong>Authentication</strong>.</li>
            <li>Na aba <strong>Authentication &gt; Configurações (Settings) &gt; Domínios Autorizados</strong>, adicione o seu domínio: <code className="bg-slate-200 text-slate-800 px-1.5 py-0.5 rounded font-mono text-[11px]">ramaros.github.io</code></li>
            <li>Vá em <strong>Configurações do Projeto &gt; Geral</strong>, role até "Seus aplicativos", registre um aplicativo Web e copie o objeto de configuração correspondente (contendo <i>apiKey, authDomain, projectId, appId</i>, etc.).</li>
          </ol>
        </div>

        {/* Input Form for custom Firebase Config */}
        <form onSubmit={handleSaveCustomFirebase} className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              Objeto de Configuração Firebase (JS ou JSON)
            </label>
            <textarea
              rows={6}
              placeholder={`const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "seu-projeto.firebaseapp.com",
  projectId: "seu-projeto",
  storageBucket: "seu-projeto.firebasestorage.app",
  messagingSenderId: "1234567890",
  appId: "1:1234567:web:abcd"
};`}
              value={customFirebaseJson}
              onChange={(e) => setCustomFirebaseJson(e.target.value)}
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-mono text-[11px] font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white placeholder:text-slate-300"
            />
          </div>

          {/* Feedback alerts */}
          {firebaseError && (
            <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-600 text-xs font-bold uppercase tracking-wide">
              {firebaseError}
            </div>
          )}

          {firebaseSaveSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-600 text-xs font-bold uppercase tracking-wide flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-500" /> Configurações salvas! Recarregando aplicativo...
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="submit"
              className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold rounded-xl transition-all text-xs cursor-pointer flex items-center justify-center gap-2"
            >
              <Key className="w-4 h-4" /> Salvar Conexão Customizada
            </button>
            
            {localStorage.getItem("custom_firebase_config") && (
              <button
                type="button"
                onClick={handleClearCustomFirebase}
                className="py-3 px-5 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-600 font-bold rounded-xl transition-all text-xs cursor-pointer"
              >
                Voltar para Padrão do App
              </button>
            )}
          </div>
        </form>
      </div>

      {/* MANUAL PRICE OVERRIDE SECTION */}
      <div className="bg-white border border-slate-200/85 rounded-2xl p-6 md:p-8 shadow-sm">
        <div className="flex items-start gap-4 mb-6">
          <div className="p-3 bg-slate-100 text-slate-700 rounded-xl">
            <RefreshCw className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-950 uppercase tracking-wide">Ajuste de Cotações</h4>
            <p className="text-[11px] text-slate-400 font-bold uppercase mt-0.5">Substitua preços do simulador ou cotações ativas manualmente</p>
          </div>
        </div>

        <form onSubmit={handleOverridePriceSubmit} className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Ticker</label>
            <input
              type="text"
              placeholder="EX: VALE3"
              value={manualTicker}
              onChange={(e) => setManualTicker(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white uppercase"
              required
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Preço de Cotação (R$)</label>
            <input
              type="number"
              step="0.01"
              placeholder="0.00"
              value={manualPrice}
              onChange={(e) => setManualPrice(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full py-2.5 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 active:scale-95 transition-all text-xs cursor-pointer"
          >
            Atualizar Cotação
          </button>
        </form>

        {overrideSuccess && (
          <p className="text-xs text-emerald-600 font-bold mt-3">Preço de cotação updated com sucesso!</p>
        )}
      </div>

      {/* DANGER ZONE (Zona de Perigo) */}
      <div className="bg-rose-50/50 border border-rose-200 rounded-2xl p-6 md:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-rose-100/80 text-rose-600 rounded-xl">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-rose-900 uppercase tracking-tight">ZONA DE PERIGO</h4>
              <p className="text-xs text-rose-600 font-semibold mt-1">Esta ação irá eliminar todos os seus ativos permanentemente.</p>
            </div>
          </div>
          <button
            onClick={handleClearClick}
            disabled={clearing}
            className="px-6 py-3 bg-rose-600 text-white text-xs font-bold rounded-xl hover:bg-rose-700 active:scale-[0.98] transition-all shadow-sm flex items-center gap-2 self-start sm:self-center cursor-pointer"
          >
            <Trash2 className="w-4 h-4" /> Limpar Tudo
          </button>
        </div>
      </div>

    </div>
  );
}
