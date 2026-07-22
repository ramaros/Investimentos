import React, { useState } from "react";
import { 
  TrendingUp, 
  Wallet, 
  Coins, 
  History, 
  Calculator, 
  Settings, 
  Plus, 
  Cloud, 
  CloudOff, 
  LogOut, 
  LogIn, 
  Layers, 
  Sparkles, 
  LineChart,
  Wifi,
  Database,
  RefreshCw,
  ShieldAlert,
  Copy,
  Check,
  Lock
} from "lucide-react";
import { useInvestments } from "./hooks/useInvestments";
import { useNetworkStatus } from "./hooks/useNetworkStatus";
import { firebaseConfig } from "./firebase";
import { LoginPINView } from "./components/LoginPINView";
import { KPICard } from "./components/KPICard";
import { CompraModal } from "./components/CompraModal";
import { ProventoModal } from "./components/ProventoModal";
import { AtivosView } from "./components/AtivosView";
import { DashboardView } from "./components/DashboardView";
import { HistoricoView } from "./components/HistoricoView";
import { SimuladorView } from "./components/SimuladorView";
import { ConfigView } from "./components/ConfigView";
import { AnaliseView } from "./components/AnaliseView";
import { StockQuote } from "./types";

type TabId = "Ativos" | "Dashboard" | "Análise" | "Histórico" | "Simulador" | "Config";

export default function App() {
  const {
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
  } = useInvestments();

  const networkStatus = useNetworkStatus();

  const [activeTab, setActiveTab] = useState<TabId>("Ativos");
  const [isCompraOpen, setIsCompraOpen] = useState(false);
  const [isProventoOpen, setIsProventoOpen] = useState(false);
  const [showHeaderStatus, setShowHeaderStatus] = useState(false);
  
  // Track PIN lock state for this session
  const [isUnlocked, setIsUnlocked] = useState<boolean>(() => {
    return sessionStorage.getItem("investflow_session_unlocked") === "true";
  });
  
  const [copiedRules, setCopiedRules] = useState(false);

  // List of unique tickers owned
  const existingTickers = assetSummaries.map(a => a.ticker);

  const handleGoogleSignIn = async () => {
    try {
      await loginWithGoogle();
    } catch (err: any) {
      console.error("Erro no login Firebase Auth:", err);
      const errorCode = err?.code || "";
      const errorMessage = err?.message || "";
      
      if (errorCode === "auth/unauthorized-domain" || errorMessage.includes("unauthorized-domain") || errorMessage.includes("unauthorized_client")) {
        const activeProjectId = firebaseConfig?.projectId || "analytical-falcon-sskkt";
        alert(
          "⚠️ DOMÍNIO NÃO AUTORIZADO NO FIREBASE!\n\n" +
          "O domínio de hospedagem atual (ex: ramaros.github.io) precisa ser autorizado nas configurações do Firebase Authentication.\n\n" +
          "Como corrigir isso em 1 minuto:\n" +
          "1. Acesse o Console do Firebase (https://console.firebase.google.com/)\n" +
          "2. Entre no seu projeto (" + activeProjectId + ")\n" +
          "3. No menu lateral esquerdo, vá em 'Authentication'\n" +
          "4. Clique na guia 'Configurações' (Settings) no topo\n" +
          "5. Clique em 'Domínios autorizados' (Authorized domains) na lista lateral\n" +
          "6. Clique em 'Adicionar domínio'\n" +
          "7. Digite: ramaros.github.io\n" +
          "8. Clique em Salvar e depois recarregue esta página do seu navegador!\n\n" +
          "Dica: Se o erro persistir, certifique-se também de que adicionou o domínio do Github Pages sem 'https://' ou subpastas (apenas 'ramaros.github.io')."
        );
      } else if (errorCode === "auth/popup-closed-by-user" || errorMessage.includes("popup-closed-by-user")) {
        alert("O login do Google foi fechado antes de concluir a autenticação.");
      } else if (errorCode === "auth/popup-blocked" || errorMessage.includes("popup-blocked")) {
        alert("O seu navegador bloqueou a janela de autenticação. Por favor, habilite popups para este site.");
      } else {
        alert(
          "Falha ao autenticar com o Google:\n" + 
          "Código: " + errorCode + "\n" +
          "Mensagem: " + errorMessage + "\n\n" +
          "Por favor, verifique se seu domínio 'ramaros.github.io' foi adicionado em 'Domínios Autorizados' no Console do Firebase."
        );
      }
    }
  };

  // If the app is locked with PIN, show the secure login screen
  if (!isUnlocked) {
    return (
      <LoginPINView 
        onUnlock={() => {
          sessionStorage.setItem("investflow_session_unlocked", "true");
          setIsUnlocked(true);
        }} 
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 font-sans antialiased pb-12 select-none">
      
      {/* HEADER BAR (Inspirado exatamente no design da foto) */}
      <header className="bg-[#0F172A] text-white sticky top-0 z-40 border-b border-slate-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col lg:flex-row items-center justify-between gap-4">
          
          {/* Logo & Sync Status Indicator */}
          <div className="flex items-center gap-3 relative">
            <div className="p-2 bg-blue-600 rounded-lg shadow-sm">
              <LineChart className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-wider uppercase text-white font-sans">
                InvestFlow
              </h1>
              <button 
                onClick={() => setShowHeaderStatus(!showHeaderStatus)}
                className="flex items-center gap-1.5 mt-0.5 text-left hover:opacity-80 transition-all cursor-pointer focus:outline-none"
                title="Clique para verificar conexões em tempo real"
              >
                {isOfflineMode ? (
                  <>
                    <CloudOff className="w-3 h-3 text-amber-500 animate-pulse" />
                    <span className="text-[9px] font-extrabold tracking-wider text-amber-500 uppercase flex items-center gap-1">
                      MODO LOCAL <span className="bg-slate-850 text-slate-300 px-1 py-0.5 rounded text-[8px] border border-slate-700">Verificar</span>
                    </span>
                  </>
                ) : (
                  <>
                    <Cloud className="w-3 h-3 text-emerald-400" />
                    <span className="text-[9px] font-extrabold tracking-wider text-emerald-400 uppercase flex items-center gap-1">
                      Sincronizado <span className="bg-[#1e293b] text-emerald-300 px-1 py-0.5 rounded text-[8px] border border-slate-800">Verificar</span>
                    </span>
                  </>
                )}
              </button>

              {/* Real-time dropdown connectivity info */}
              {showHeaderStatus && (
                <div className="absolute top-12 left-0 w-72 bg-[#1e293b] border border-slate-800 rounded-2xl shadow-xl p-4.5 z-50 text-white space-y-3.5 animate-fadeIn">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
                      Monitor de Conectividade
                    </span>
                    <button 
                      onClick={() => setShowHeaderStatus(false)}
                      className="text-slate-400 hover:text-white text-xs font-bold px-1"
                    >
                      X
                    </button>
                  </div>

                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-slate-400">Status da Rede:</span>
                    <span className={`flex items-center gap-1.5 ${networkStatus.isOnline ? "text-emerald-400" : "text-rose-400"}`}>
                      {networkStatus.isOnline ? (
                        <>
                          <Wifi className="w-3.5 h-3.5" /> Online
                        </>
                      ) : (
                        <>
                          <CloudOff className="w-3.5 h-3.5" /> Offline
                        </>
                      )}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-slate-400">Sincronizador Firebase:</span>
                    <span className={`flex items-center gap-1.5 ${
                      networkStatus.firebaseStatus === "connected" 
                        ? "text-emerald-400" 
                        : networkStatus.firebaseStatus === "connecting"
                          ? "text-amber-400 animate-pulse"
                          : "text-rose-400"
                    }`}>
                      <Database className="w-3.5 h-3.5" /> 
                      {networkStatus.firebaseStatus === "connected" ? "Conectado" : networkStatus.firebaseStatus === "connecting" ? "Conectando..." : "Desconectado"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-slate-400">Latência do Canal:</span>
                    <span className="font-extrabold text-blue-400">
                      {networkStatus.latency !== null ? `${networkStatus.latency} ms` : "--"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-slate-400">Último Heartbeat:</span>
                    <span className="text-slate-300">
                      {networkStatus.lastSyncTime}
                    </span>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      networkStatus.testConnection();
                    }}
                    disabled={networkStatus.isTesting}
                    className="w-full flex items-center justify-center gap-2 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-55 text-xs font-bold text-white rounded-xl transition-all cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${networkStatus.isTesting ? "animate-spin" : ""}`} />
                    {networkStatus.isTesting ? "Testando..." : "Testar Conexão Agora"}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Navigation Tabs (As styled in reference) */}
          <nav className="flex bg-[#1e293b]/70 p-1 rounded-xl border border-slate-800/50 overflow-x-auto max-w-full">
            {([
              { id: "Ativos", icon: Layers, label: "Ativos" },
              { id: "Dashboard", icon: LineChart, label: "Dashboard" },
              { id: "Análise", icon: Sparkles, label: "Análise" },
              { id: "Histórico", icon: History, label: "Histórico" },
              { id: "Simulador", icon: Calculator, label: "Simulador" },
              { id: "Config", icon: Settings, label: "Config" }
            ] as const).map((tab) => {
              const IconComp = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabId)}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeTab === tab.id
                      ? "bg-white text-[#0f172a] shadow-sm"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <IconComp className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Actions & Profile Area */}
          <div className="flex items-center gap-3">
            
            {/* Compra Button */}
            <button
              onClick={() => setIsCompraOpen(true)}
              className="flex items-center gap-1 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-xs font-bold rounded-lg text-white transition-all shadow-sm cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Compra
            </button>

            {/* Provento Button */}
            <button
              onClick={() => setIsProventoOpen(true)}
              className="flex items-center gap-1 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-xs font-bold rounded-lg text-white transition-all shadow-sm cursor-pointer"
            >
              <Coins className="w-3.5 h-3.5" /> Provento
            </button>

            {/* Authentication Action */}
            <button
              onClick={() => {
                sessionStorage.removeItem("investflow_session_unlocked");
                setIsUnlocked(false);
              }}
              title="Bloquear Aplicativo"
              className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-slate-800/80 rounded-lg transition-all cursor-pointer flex items-center justify-center"
            >
              <Lock className="w-4 h-4" />
            </button>

            {authLoading ? (
              <div className="w-6 h-6 rounded-full border-2 border-slate-700 border-t-white animate-spin" />
            ) : user ? (
              <div className="flex items-center gap-2 border-l border-slate-800 pl-3">
                <img 
                  src={user.photoURL || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"} 
                  alt="Avatar" 
                  referrerPolicy="no-referrer"
                  className="w-7 h-7 rounded-full border border-slate-700 shadow"
                />
                <button 
                  onClick={() => {
                    logout();
                    sessionStorage.removeItem("investflow_session_unlocked");
                    setIsUnlocked(false);
                  }} 
                  title="Sair e Bloquear"
                  className="p-1 text-slate-400 hover:text-rose-400 hover:bg-slate-850 rounded transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={handleGoogleSignIn}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-850 rounded-lg transition-all cursor-pointer"
                title="Entrar com Google"
              >
                <LogIn className="w-4.5 h-4.5" />
              </button>
            )}

          </div>

        </div>
      </header>

      {/* BODY CONTENT */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 space-y-8">
        
        {/* FIRESTORE RULES WARNING CARD */}
        {syncError && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-amber-100 text-amber-700 rounded-xl shrink-0 animate-pulse">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div className="space-y-3 flex-1">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                  ⚠️ Erro de Permissões no seu Banco de Dados (Firestore)
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed font-semibold">
                  Seu aplicativo conectou com sucesso ao seu projeto Firebase customizado (<span className="text-blue-600 font-extrabold">{firebaseConfig?.projectId}</span>), mas as requisições estão sendo rejeitadas devido às regras de segurança (<i>Missing or insufficient permissions</i>).
                </p>
                <div className="text-xs text-slate-600 space-y-2">
                  <p className="font-extrabold text-slate-800 uppercase tracking-wider text-[10px]">
                    Como corrigir isso em 30 segundos:
                  </p>
                  <ol className="list-decimal pl-5 space-y-1.5 font-medium">
                    <li>Acesse o <a href="https://console.firebase.google.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 font-bold hover:underline">Console do Firebase</a> e entre no seu projeto.</li>
                    <li>No menu lateral esquerdo, clique em <strong>Firestore Database</strong>.</li>
                    <li>Clique na guia <strong>Regras (Rules)</strong> no topo da página.</li>
                    <li>Substitua as regras atuais pelas regras abaixo (elas garantem que cada usuário acesse apenas seus próprios dados de forma segura):</li>
                  </ol>
                </div>

                {/* Rules Code Snippet */}
                <div className="relative mt-3">
                  <pre className="bg-slate-900 text-slate-200 text-[11px] font-mono p-4 rounded-xl overflow-x-auto select-all max-w-full">
{`rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}`}
                  </pre>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}`);
                      setCopiedRules(true);
                      setTimeout(() => setCopiedRules(false), 2000);
                    }}
                    className="absolute top-2.5 right-2.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 hover:text-white rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    {copiedRules ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        Copiado!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        Copiar Regras
                      </>
                    )}
                  </button>
                </div>

                <p className="text-[10px] text-amber-600/90 font-extrabold uppercase tracking-wide pt-1">
                  5. Clique em "Publicar" (Publish) no console do Firebase. O aplicativo começará a sincronizar automaticamente sem precisar atualizar a página!
                </p>
              </div>
            </div>
          </div>
        )}

        {/* TOP KPI CARDS ROW */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <KPICard
            title="TOTAL INVESTIDO"
            value={`R$ ${totals.totalInvested.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            subtext="Custo total de aquisição"
            icon={Wallet}
            iconBgColor="bg-blue-50"
            iconColor="text-blue-600"
          />
          <KPICard
            title="PROVENTOS ACUMULADOS"
            value={`R$ ${totals.totalDividends.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            subtext="Dividendos e JCP recebidos"
            icon={Coins}
            iconBgColor="bg-emerald-50"
            iconColor="text-emerald-600"
          />
          <KPICard
            title="YIELD ON COST"
            value={`${totals.yieldOnCost.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`}
            subtext="Retorno sobre valor investido"
            icon={TrendingUp}
            iconBgColor="bg-violet-50"
            iconColor="text-violet-600"
          />
        </section>

        {/* ACTIVE TAB CONTENT */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-4">
            <div className="w-10 h-10 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest animate-pulse">Sincronizando investimentos...</p>
          </div>
        ) : (
          <section className="min-h-[400px]">
            {activeTab === "Ativos" && (
              <AtivosView 
                assetSummaries={assetSummaries} 
                onSelectTicker={(ticker) => {
                  setActiveTab("Histórico");
                }}
              />
            )}
            {activeTab === "Dashboard" && (
              <DashboardView 
                assetSummaries={assetSummaries}
                compras={compras}
                proventos={proventos}
              />
            )}
            {activeTab === "Análise" && (
              <AnaliseView assetSummaries={assetSummaries} />
            )}
            {activeTab === "Histórico" && (
              <HistoricoView 
                compras={compras}
                proventos={proventos}
                onDeleteCompra={deleteCompra}
                onDeleteProvento={deleteProvento}
              />
            )}
            {activeTab === "Simulador" && (
              <SimuladorView assetSummaries={assetSummaries} />
            )}
            {activeTab === "Config" && (
              <ConfigView 
                onExport={exportBackup}
                onImport={importBackup}
                onClearAll={clearAllData}
                isOfflineMode={isOfflineMode}
                userEmail={user?.email || undefined}
                onGoogleSignIn={handleGoogleSignIn}
              />
            )}
          </section>
        )}

      </main>

      {/* FOOTER LIVE QUOTES BAR */}
      <footer className="mt-16 border-t border-slate-100 bg-white py-4 shadow-inner">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-bold text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span className="uppercase tracking-wider">Cotações em Tempo Real Ativas</span>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-slate-500">
            {(Object.values(quotes) as StockQuote[]).slice(0, 6).map((quote) => (
              <div key={quote.ticker} className="flex items-center gap-1.5 bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-xl">
                <span className="font-extrabold text-slate-700">{quote.ticker}:</span>
                <span className="font-extrabold text-slate-800">R$ {quote.price.toFixed(2)}</span>
                <span className={`text-[10px] ${quote.changePercent >= 0 ? "text-emerald-600" : "text-rose-500"}`}>
                  {quote.changePercent >= 0 ? "+" : ""}{quote.changePercent.toFixed(2)}%
                </span>
              </div>
            ))}
          </div>
          <div className="text-[10px] uppercase tracking-wider text-slate-400">
            Última atualização: {lastQuoteUpdate || "..."}
          </div>
        </div>
      </footer>

      {/* TRANSACTIONS MODALS */}
      <CompraModal 
        isOpen={isCompraOpen}
        onClose={() => setIsCompraOpen(false)}
        onConfirm={addCompra}
      />

      <ProventoModal 
        isOpen={isProventoOpen}
        onClose={() => setIsProventoOpen(false)}
        onConfirm={addProvento}
        existingTickers={existingTickers}
      />

    </div>
  );
}
