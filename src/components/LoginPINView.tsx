import React, { useState, useEffect } from "react";
import { Lock, Unlock, Wifi, WifiOff, Database, RefreshCw, Delete, CheckCircle2, ShieldCheck, AlertCircle } from "lucide-react";
import { useNetworkStatus } from "../hooks/useNetworkStatus";

interface LoginPINViewProps {
  onUnlock: () => void;
}

export function LoginPINView({ onUnlock }: LoginPINViewProps) {
  const [pin, setPin] = useState<string>("");
  const [storedPin, setStoredPin] = useState<string | null>(null);
  const [isSetup, setIsSetup] = useState<boolean>(false);
  const [setupStep, setSetupStep] = useState<"enter" | "confirm">("enter");
  const [tempPin, setTempPin] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isShaking, setIsShaking] = useState<boolean>(false);
  const [showStatusDetails, setShowStatusDetails] = useState<boolean>(false);

  // Hook for real-time network and Firebase status
  const network = useNetworkStatus();

  // Load PIN from local storage
  useEffect(() => {
    const savedPin = localStorage.getItem("investflow_security_pin");
    if (savedPin) {
      setStoredPin(savedPin);
      setIsSetup(false);
    } else {
      setIsSetup(true);
      setSetupStep("enter");
    }
  }, []);

  // Handle number click on PIN pad
  const handleNumberClick = (num: number) => {
    if (errorMsg) setErrorMsg(null);
    if (pin.length < 4) {
      const newPin = pin + num;
      setPin(newPin);
      
      // Auto submit/verify when 4 digits are entered
      if (newPin.length === 4) {
        // Debounce slightly to show the 4th dot filled
        setTimeout(() => {
          verifyPin(newPin);
        }, 150);
      }
    }
  };

  // Handle delete last digit
  const handleDelete = () => {
    if (errorMsg) setErrorMsg(null);
    if (pin.length > 0) {
      setPin(pin.slice(0, -1));
    }
  };

  // Handle clear pin
  const handleClear = () => {
    if (errorMsg) setErrorMsg(null);
    setPin("");
  };

  // Verify PIN entered
  const verifyPin = (enteredPin: string) => {
    if (isSetup) {
      if (setupStep === "enter") {
        setTempPin(enteredPin);
        setSetupStep("confirm");
        setPin("");
        setSuccessMsg("Confirme o seu PIN digitando-o novamente.");
        setTimeout(() => setSuccessMsg(null), 3000);
      } else {
        // Confirmation step
        if (enteredPin === tempPin) {
          localStorage.setItem("investflow_security_pin", enteredPin);
          setStoredPin(enteredPin);
          setIsSetup(false);
          setSuccessMsg("PIN de segurança criado com sucesso!");
          setPin("");
          setTimeout(() => {
            setSuccessMsg(null);
            onUnlock();
          }, 1000);
        } else {
          setErrorMsg("Os PINs digitados não coincidem. Tente novamente.");
          setPin("");
          setIsShaking(true);
          setSetupStep("enter");
          setTempPin("");
          setTimeout(() => setIsShaking(false), 500);
        }
      }
    } else {
      // Normal Login step
      if (enteredPin === storedPin) {
        setSuccessMsg("Acesso autorizado!");
        setTimeout(() => {
          setSuccessMsg(null);
          onUnlock();
        }, 300);
      } else {
        setErrorMsg("PIN incorreto. Tente novamente.");
        setPin("");
        setIsShaking(true);
        setTimeout(() => setIsShaking(false), 500);
      }
    }
  };

  // Handle PIN reset/forgot
  const handleResetPin = () => {
    if (window.confirm("Para redefinir seu PIN de segurança, o PIN atual será apagado de sua máquina. Os dados cadastrados não serão perdidos. Deseja redefinir?")) {
      localStorage.removeItem("investflow_security_pin");
      setStoredPin(null);
      setIsSetup(true);
      setSetupStep("enter");
      setTempPin("");
      setPin("");
      setErrorMsg(null);
      setSuccessMsg("Redefinição ativa. Crie um novo PIN.");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#F8FAFC] text-slate-800 font-sans px-4 py-8 select-none">
      
      {/* Real-time sync floating widget in top corner */}
      <div className="absolute top-4 right-4 flex items-center gap-2">
        <button
          onClick={() => setShowStatusDetails(!showStatusDetails)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-100 rounded-xl shadow-sm text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all cursor-pointer"
        >
          {network.isOnline ? (
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          ) : (
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
          )}
          <span>{network.isOnline ? "Online" : "Offline"}</span>
        </button>
      </div>

      {/* Main card box */}
      <div className="w-full max-w-md bg-white border border-slate-100 rounded-2xl shadow-sm p-8 flex flex-col items-center transition-all">
        
        {/* Shield / Lock Circle Header (Exatamente igual ao layout da foto) */}
        <div className="w-16 h-16 bg-blue-50 border border-blue-100 rounded-full flex items-center justify-center shadow-sm mb-6">
          {isSetup ? (
            <ShieldCheck className="w-8 h-8 text-blue-600 animate-pulse" />
          ) : (
            <Lock className="w-7 h-7 text-blue-600" />
          )}
        </div>

        {/* Title Group */}
        <h2 className="text-xl font-bold text-slate-900 tracking-tight text-center mb-1">
          {isSetup 
            ? "Configurar PIN de Segurança" 
            : "Controle de Investimentos"
          }
        </h2>
        <p className="text-xs font-semibold text-slate-400 text-center max-w-[280px] leading-relaxed mb-8">
          {isSetup
            ? setupStep === "enter"
              ? "Crie uma senha numérica de 4 dígitos para proteger suas informações."
              : "Digite o PIN de 4 dígitos novamente para confirmar o acesso."
            : "Digite seu PIN de segurança de 4 dígitos para acessar."
          }
        </p>

        {/* PIN Indicators Row */}
        <div className={`flex justify-center gap-6 mb-10 ${isShaking ? "animate-bounce" : ""}`}>
          {[0, 1, 2, 3].map((index) => (
            <div
              key={index}
              className={`w-4 h-4 rounded-full border-2 transition-all duration-150 ${
                index < pin.length
                  ? "bg-blue-600 border-blue-600 scale-110 shadow-sm"
                  : "bg-slate-50 border-slate-300"
              }`}
            />
          ))}
        </div>

        {/* Error / Success Notifications */}
        {errorMsg && (
          <div className="w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-rose-50 border border-rose-100 rounded-xl mb-6 animate-pulse">
            <AlertCircle className="w-4 h-4 text-rose-500" />
            <span className="text-[11px] font-bold text-rose-600 uppercase tracking-wide text-center">
              {errorMsg}
            </span>
          </div>
        )}

        {successMsg && (
          <div className="w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-emerald-50 border border-emerald-100 rounded-xl mb-6">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wide text-center">
              {successMsg}
            </span>
          </div>
        )}

        {/* Numeric PIN Pad Grid (Exatamente igual ao visual do app do usuário) */}
        <div className="grid grid-cols-3 gap-x-6 gap-y-4 w-full max-w-[270px] mb-8">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <button
              key={num}
              onClick={() => handleNumberClick(num)}
              className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-100/50 hover:bg-slate-100 active:scale-95 text-xl font-bold text-slate-800 transition-all shadow-sm flex items-center justify-center cursor-pointer"
            >
              {num}
            </button>
          ))}
          
          {/* Action: Limpar */}
          <button
            onClick={handleClear}
            className="text-xs font-bold text-slate-400 hover:text-slate-600 active:scale-95 uppercase tracking-wider flex items-center justify-center cursor-pointer transition-colors"
          >
            Limpar
          </button>

          {/* Number 0 */}
          <button
            onClick={() => handleNumberClick(0)}
            className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-100/50 hover:bg-slate-100 active:scale-95 text-xl font-bold text-slate-800 transition-all shadow-sm flex items-center justify-center cursor-pointer"
          >
            0
          </button>

          {/* Action: Backspace */}
          <button
            onClick={handleDelete}
            className="text-slate-400 hover:text-slate-600 active:scale-95 flex items-center justify-center cursor-pointer transition-colors"
            title="Apagar dígito"
          >
            <Delete className="w-5 h-5" />
          </button>
        </div>

        {/* Reset Action */}
        {!isSetup && (
          <button
            onClick={handleResetPin}
            className="text-[10px] font-bold text-slate-400 hover:text-blue-500 uppercase tracking-wider transition-colors cursor-pointer"
          >
            Esqueci meu PIN / Redefinir
          </button>
        )}
      </div>

      {/* Real-time Status Card & Monitoring Panel */}
      <div className="mt-8 w-full max-w-md">
        <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-5 flex flex-col">
          <button
            onClick={() => setShowStatusDetails(!showStatusDetails)}
            className="flex items-center justify-between w-full text-left"
          >
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${network.isOnline ? "bg-emerald-500" : "bg-rose-500"} animate-ping`} />
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500">
                Verificador de Sincronia em Tempo Real
              </span>
            </div>
            <span className="text-xs font-bold text-blue-600 hover:underline">
              {showStatusDetails ? "Esconder detalhes" : "Visualizar diagnóstico"}
            </span>
          </button>

          {/* Expandable Diagnosis Panel */}
          {showStatusDetails && (
            <div className="mt-4 pt-4 border-t border-slate-100 space-y-3.5 animate-fadeIn">
              {/* Row 1: Conexão Geral */}
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-slate-400 uppercase tracking-wide">Status Geral da Rede:</span>
                <span className={`flex items-center gap-1.5 ${network.isOnline ? "text-emerald-600" : "text-rose-500"}`}>
                  {network.isOnline ? (
                    <>
                      <Wifi className="w-3.5 h-3.5" /> Dispositivo Online
                    </>
                  ) : (
                    <>
                      <WifiOff className="w-3.5 h-3.5" /> Dispositivo Offline
                    </>
                  )}
                </span>
              </div>

              {/* Row 2: Banco de dados Firebase */}
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-slate-400 uppercase tracking-wide">Servidor Firebase:</span>
                <span className={`flex items-center gap-1.5 ${
                  network.firebaseStatus === "connected" 
                    ? "text-emerald-600" 
                    : network.firebaseStatus === "connecting"
                      ? "text-amber-500 animate-pulse"
                      : "text-rose-500"
                }`}>
                  <Database className="w-3.5 h-3.5" /> 
                  {network.firebaseStatus === "connected" && "Conectado & Sincronizado"}
                  {network.firebaseStatus === "connecting" && "Conectando..."}
                  {network.firebaseStatus === "offline" && "Modo Local Ativo"}
                </span>
              </div>

              {/* Row 3: Latency */}
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-slate-400 uppercase tracking-wide">Latência de Resposta:</span>
                <span className="text-slate-600 uppercase font-extrabold">
                  {network.latency !== null ? `${network.latency} ms` : "--"}
                </span>
              </div>

              {/* Row 4: Last update */}
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-slate-400 uppercase tracking-wide">Último Heartbeat:</span>
                <span className="text-slate-600">
                  {network.lastSyncTime}
                </span>
              </div>

              {/* Refresh Sync Button */}
              <button
                onClick={network.testConnection}
                disabled={network.isTesting}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-50 hover:bg-blue-100 disabled:opacity-50 text-xs font-extrabold text-blue-600 rounded-xl transition-all cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${network.isTesting ? "animate-spin" : ""}`} />
                {network.isTesting ? "Testando Conexão..." : "Testar Sincronia Agora"}
              </button>
            </div>
          )}

          {/* Simple footer line */}
          <div className="flex justify-between text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-3 pt-2.5 border-t border-slate-50">
            <span>Ambiente Seguro</span>
            <span>Criptografado</span>
          </div>
        </div>
      </div>

    </div>
  );
}
