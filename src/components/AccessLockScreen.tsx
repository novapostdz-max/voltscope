import React, { useState, useEffect, useRef } from 'react';
import { Lock, Unlock, ShieldCheck, Eye, EyeOff, AlertCircle, CheckCircle2, Zap, ArrowRight } from 'lucide-react';
import { MadeByBadge } from './MadeByBadge';

const ACCESS_CODE = '12122012';
const CODE_LENGTH = 8;

interface AccessLockScreenProps {
  onUnlock: () => void;
}

export const AccessLockScreen: React.FC<AccessLockScreenProps> = ({ onUnlock }) => {
  const [pin, setPin] = useState<string>('');
  const [showPin, setShowPin] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [isShaking, setIsShaking] = useState<boolean>(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const verifyPin = (candidate: string) => {
    if (candidate === ACCESS_CODE) {
      setError(null);
      setIsSuccess(true);
      setTimeout(() => {
        onUnlock();
      }, 500);
    } else {
      setError('Code d’accès incorrect. Accès refusé.');
      setIsShaking(true);
      setIsSuccess(false);
      setTimeout(() => {
        setIsShaking(false);
        setPin('');
      }, 450);
    }
  };

  const handleInputChange = (val: string) => {
    // Only accept numeric
    const clean = val.replace(/\D/g, '').slice(0, CODE_LENGTH);
    setPin(clean);
    setError(null);
    if (clean.length === CODE_LENGTH) {
      verifyPin(clean);
    }
  };

  const handleKeyPress = (digit: string) => {
    if (pin.length < CODE_LENGTH && !isSuccess) {
      const next = pin + digit;
      setPin(next);
      setError(null);
      if (next.length === CODE_LENGTH) {
        verifyPin(next);
      }
    }
  };

  const handleDelete = () => {
    if (!isSuccess) {
      setPin(prev => prev.slice(0, -1));
      setError(null);
    }
  };

  const handleClear = () => {
    if (!isSuccess) {
      setPin('');
      setError(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-100 px-4 py-6 overflow-y-auto selection:bg-blue-600 selection:text-white">
      {/* Background ambient lighting */}
      <div className="absolute top-1/6 left-1/2 -translate-x-1/2 w-[520px] h-[520px] bg-blue-500/10 rounded-full blur-[140px] pointer-events-none z-0" />
      <div className="absolute bottom-1/6 right-1/4 w-[360px] h-[360px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none z-0" />
      
      {/* Subtle grid pattern background */}
      <div 
        className="absolute inset-0 opacity-[0.035] pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, #0f172a 1px, transparent 0)',
          backgroundSize: '24px 24px'
        }}
      />

      <div className={`relative w-full max-w-md bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-slate-300/60 flex flex-col items-center text-center transition-transform z-10 ${
        isShaking ? 'animate-[shake_0.45s_ease-in-out]' : ''
      }`}>
        
        {/* Top Electrical Security Badge */}
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-[10.5px] font-mono font-bold tracking-wider mb-5 uppercase shadow-xs">
          <Zap className="w-3.5 h-3.5 text-blue-600 animate-pulse" />
          <span>Portail d'Accès Sécurisé</span>
        </div>

        {/* Brand Icon Shield */}
        <div className="relative mb-3">
          <div className={`w-20 h-20 rounded-3xl flex items-center justify-center transition-all duration-300 shadow-md ${
            isSuccess 
              ? 'bg-emerald-50 border-2 border-emerald-500 text-emerald-600 scale-105 shadow-emerald-500/20' 
              : error 
              ? 'bg-rose-50 border-2 border-rose-500 text-rose-600 shadow-rose-500/20' 
              : 'bg-gradient-to-b from-blue-50 to-indigo-50 border-2 border-blue-200 text-blue-600 shadow-blue-500/10'
          }`}>
            {isSuccess ? (
              <Unlock className="w-9 h-9 animate-bounce text-emerald-600" />
            ) : (
              <Lock className="w-9 h-9 text-blue-600" />
            )}
          </div>
          <div className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-white border border-slate-200 text-emerald-600 shadow-xs">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
        </div>

        {/* VoltScope Logo */}
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
          Volt<span className="text-blue-600 underline decoration-blue-500/30 underline-offset-4">Scope</span>
        </h1>
        
        <p className="text-[12px] font-medium text-slate-500 mt-2 max-w-xs leading-relaxed">
          Accès strictement restreint. Veuillez saisir votre code d'accès à 8 chiffres pour déverrouiller la suite.
        </p>

        {/* Hidden native input for keyboard support */}
        <input
          ref={inputRef}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={CODE_LENGTH}
          value={pin}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && pin.length > 0) {
              verifyPin(pin);
            }
          }}
          className="opacity-0 absolute w-0 h-0 pointer-events-none"
          autoFocus
        />

        {/* 8-Digit Indicator Display */}
        <div 
          onClick={() => inputRef.current?.focus()}
          className="w-full mt-6 py-3 px-4 rounded-2xl bg-slate-50 border border-slate-200 hover:border-slate-300 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all"
        >
          <div className="flex items-center justify-center gap-2 sm:gap-2.5">
            {Array.from({ length: CODE_LENGTH }).map((_, index) => {
              const char = pin[index];
              const isFilled = char !== undefined;
              return (
                <div
                  key={index}
                  className={`w-9 h-11 sm:w-10 sm:h-12 rounded-xl flex items-center justify-center font-mono font-black text-lg transition-all duration-200 ${
                    isSuccess
                      ? 'border-2 border-emerald-500 bg-emerald-50 text-emerald-600 shadow-xs'
                      : error
                      ? 'border-2 border-rose-500 bg-rose-50 text-rose-600 shadow-xs'
                      : isFilled
                      ? 'border-2 border-blue-600 bg-blue-50 text-blue-700 shadow-xs shadow-blue-500/20'
                      : 'border border-slate-200 bg-white text-slate-400'
                  }`}
                >
                  {isFilled ? (showPin ? char : '●') : ''}
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between w-full px-2 pt-1 border-t border-slate-200/80">
            <span className="text-[10px] font-mono text-slate-500">
              {pin.length} / {CODE_LENGTH} chiffres
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowPin(!showPin);
              }}
              className="flex items-center gap-1 text-[11px] font-medium text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
            >
              {showPin ? (
                <>
                  <EyeOff className="w-3.5 h-3.5" />
                  <span>Masquer</span>
                </>
              ) : (
                <>
                  <Eye className="w-3.5 h-3.5" />
                  <span>Afficher</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Status / Error feedback */}
        <div className="h-6 mt-2 flex items-center justify-center">
          {error && (
            <div className="flex items-center gap-1.5 text-rose-600 text-xs font-semibold animate-pulse">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}
          {isSuccess && (
            <div className="flex items-center gap-1.5 text-emerald-600 text-xs font-bold">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span>Code valide ! Accès en cours...</span>
            </div>
          )}
        </div>

        {/* On-screen Numeric Keypad */}
        <div className="grid grid-cols-3 gap-2 w-full mt-2 max-w-xs select-none">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              type="button"
              onClick={() => handleKeyPress(digit)}
              className="h-12 rounded-2xl bg-white hover:bg-slate-50 active:bg-blue-600 active:text-white border border-slate-200 text-slate-800 font-mono font-bold text-lg transition-all flex items-center justify-center cursor-pointer shadow-xs active:scale-95 hover:border-slate-300"
            >
              {digit}
            </button>
          ))}
          <button
            type="button"
            onClick={handleClear}
            className="h-12 rounded-2xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-600 hover:text-slate-800 text-[10px] font-mono font-bold tracking-wider transition-all flex items-center justify-center cursor-pointer active:scale-95"
          >
            EFFACER
          </button>
          <button
            type="button"
            onClick={() => handleKeyPress('0')}
            className="h-12 rounded-2xl bg-white hover:bg-slate-50 active:bg-blue-600 active:text-white border border-slate-200 text-slate-800 font-mono font-bold text-lg transition-all flex items-center justify-center cursor-pointer shadow-xs active:scale-95 hover:border-slate-300"
          >
            0
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="h-12 rounded-2xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-[10px] font-mono font-bold tracking-wider transition-all flex items-center justify-center cursor-pointer active:scale-95"
          >
            ⌫ RETOUR
          </button>
        </div>

        {/* Validate Button */}
        <button
          type="button"
          onClick={() => verifyPin(pin)}
          disabled={pin.length !== CODE_LENGTH || isSuccess}
          className={`w-full mt-4 py-3 rounded-2xl font-bold text-xs uppercase tracking-wider transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer ${
            pin.length === CODE_LENGTH && !isSuccess
              ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/25 hover:shadow-blue-600/40 hover:-translate-y-0.5 active:translate-y-0'
              : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
          }`}
        >
          <span>Accéder à VoltScope</span>
          <ArrowRight className="w-4 h-4" />
        </button>

        {/* Footer info note */}
        <div className="mt-5 pt-3.5 border-t border-slate-100 w-full flex flex-col items-center justify-center gap-3 text-[10.5px] font-mono text-slate-400">
          <span className="flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-blue-500" />
            Accès sécurisé réservé aux techniciens habilités
          </span>
          <MadeByBadge variant="badge" />
        </div>
      </div>
    </div>
  );
};
