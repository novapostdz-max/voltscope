/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Flame, Thermometer, Zap, Clock, ShieldCheck, CheckCircle2 } from 'lucide-react';

interface BoilerDisplayProps {
  temperature: number; // e.g. 15 to 65 °C
  targetTemp: number; // e.g. 65 °C
  isThermostatClosed: boolean; // true = demande de chauffe (contact thermostat fermé)
  isPoweredFromContactor: boolean; // true = le contacteur fournit du 230/400V (HC actif)
  isHeatingElementOn: boolean; // isPoweredFromContactor && isThermostatClosed
  elapsedHeatingMinutes: number; // e.g. 0 to 344 min (5h44)
  capacityLiters?: number; // 200 L
  powerWatts?: number; // 2000 W (2 kW)
  onToggleThermostatManual?: () => void;
  onResetBoiler?: () => void;
}

export const BoilerGraphic: React.FC<BoilerDisplayProps> = ({
  temperature,
  targetTemp = 65,
  isThermostatClosed,
  isPoweredFromContactor,
  isHeatingElementOn,
  elapsedHeatingMinutes,
  capacityLiters = 200,
  powerWatts = 2000,
  onToggleThermostatManual,
  onResetBoiler,
}) => {
  // Format heating time
  const hours = Math.floor(elapsedHeatingMinutes / 60);
  const minutes = Math.floor(elapsedHeatingMinutes % 60);
  const timeString = `${hours}h ${minutes.toString().padStart(2, '0')}min`;

  // Water level & color gradient based on temperature
  // Temp between 15°C (cold blue) to 65°C (hot amber/red)
  const tempRatio = Math.min(1, Math.max(0, (temperature - 15) / 50));
  const waterColor =
    tempRatio < 0.3
      ? '#38bdf8' // Sky blue
      : tempRatio < 0.7
      ? '#f59e0b' // Amber warm
      : '#ef4444'; // Hot red

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col md:flex-row items-center gap-6 text-slate-800">
      {/* 1. Chauffe-eau SVG réaliste avec coupe et résistance */}
      <div className="relative shrink-0">
        <svg
          width="180"
          height="240"
          viewBox="0 0 180 240"
          className="drop-shadow-md select-none"
        >
          <defs>
            {/* Dégradé du corps cylindrique émaillé blanc/gris perle */}
            <linearGradient id="boiler-casing" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#f1f5f9" />
              <stop offset="25%" stopColor="#ffffff" />
              <stop offset="70%" stopColor="#f8fafc" />
              <stop offset="100%" stopColor="#cbd5e1" />
            </linearGradient>

            {/* Dégradé de l'eau chauffée */}
            <linearGradient id="boiler-water" x1="0%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stopColor={waterColor} stopOpacity="0.85" />
              <stop offset="100%" stopColor={waterColor} stopOpacity="0.4" />
            </linearGradient>

            {/* Lueur résistance en chauffe */}
            <filter id="glow-element" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Dôme supérieur émaillé */}
          <path
            d="M 25 50 C 25 20, 155 20, 155 50 L 155 190 C 155 215, 25 215, 25 190 Z"
            fill="url(#boiler-casing)"
            stroke="#94a3b8"
            strokeWidth="2.5"
          />

          {/* Calotte supérieure décorative */}
          <path
            d="M 30 48 C 30 25, 150 25, 150 48"
            fill="none"
            stroke="#e2e8f0"
            strokeWidth="2"
          />

          {/* Cuve intérieure d'eau (Vue en coupe transparente) */}
          <path
            d="M 35 60 C 35 38, 145 38, 145 60 L 145 180 C 145 198, 35 198, 35 180 Z"
            fill="url(#boiler-water)"
            stroke="#64748b"
            strokeWidth="1"
            strokeDasharray="3,3"
            opacity="0.9"
          />

          {/* Bulles d'ébullition / convection si résistance active */}
          {isHeatingElementOn && (
            <g className="animate-pulse">
              <circle cx="80" cy="140" r="3" fill="#ffffff" opacity="0.8" />
              <circle cx="95" cy="115" r="4" fill="#ffffff" opacity="0.7" />
              <circle cx="85" cy="90" r="3" fill="#ffffff" opacity="0.6" />
              <circle cx="105" cy="130" r="2.5" fill="#ffffff" opacity="0.8" />
              <circle cx="70" cy="110" r="2" fill="#ffffff" opacity="0.7" />
            </g>
          )}

          {/* Résistance blindée stéatite / thermoplongeur 2200W */}
          <g transform="translate(70, 130)">
            <path
              d="M 0 50 L 0 0 C 0 -15, 20 -15, 20 0 L 20 50 C 20 60, 40 60, 40 50 L 40 0"
              fill="none"
              stroke={isHeatingElementOn ? '#ea580c' : '#64748b'}
              strokeWidth="4"
              strokeLinecap="round"
              filter={isHeatingElementOn ? 'url(#glow-element)' : undefined}
            />
            {isHeatingElementOn && (
              <path
                d="M 0 50 L 0 0 C 0 -15, 20 -15, 20 0 L 20 50 C 20 60, 40 60, 40 50 L 40 0"
                fill="none"
                stroke="#fef08a"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            )}
          </g>

          {/* Sonde de thermostat plongeante */}
          <line
            x1="125"
            y1="80"
            x2="125"
            y2="190"
            stroke="#0284c7"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <circle cx="125" cy="80" r="4" fill="#0284c7" />

          {/* Thermostat interne électromécanique à bulbe */}
          <g transform="translate(110, 195)">
            <rect
              x="-5"
              y="0"
              width="30"
              height="20"
              rx="3"
              fill={isThermostatClosed ? '#dcfce7' : '#fee2e2'}
              stroke={isThermostatClosed ? '#16a34a' : '#dc2626'}
              strokeWidth="1.5"
            />
            {/* Contact de thermostat */}
            <line
              x1="0"
              y1="10"
              x2={isThermostatClosed ? '20' : '15'}
              y2={isThermostatClosed ? '10' : '4'}
              stroke={isThermostatClosed ? '#16a34a' : '#dc2626'}
              strokeWidth="2"
            />
            <text
              x="10"
              y="30"
              fontSize="8"
              fontWeight="bold"
              textAnchor="middle"
              fill={isThermostatClosed ? '#15803d' : '#b91c1c'}
            >
              {isThermostatClosed ? 'Th. FERMÉ' : 'Th. COUPÉ'}
            </text>
          </g>

          {/* Sortie Eau Chaude (Rouge) & Entrée Eau Froide (Bleue) */}
          <rect x="50" y="210" width="10" height="20" fill="#dc2626" rx="2" />
          <text x="55" y="238" fontSize="7" fontWeight="bold" fill="#dc2626" textAnchor="middle">
            EC (65°)
          </text>

          <rect x="85" y="210" width="10" height="20" fill="#0284c7" rx="2" />
          <text x="90" y="238" fontSize="7" fontWeight="bold" fill="#0284c7" textAnchor="middle">
            EF (15°)
          </text>

          {/* Capot électronique avec AFFICHEUR DIGITAL LED intégré */}
          <g transform="translate(45, 80)">
            <rect
              x="0"
              y="0"
              width="90"
              height="45"
              rx="6"
              fill="#0f172a"
              stroke="#334155"
              strokeWidth="2"
            />
            {/* Écran Digital rétroéclairé */}
            <rect
              x="6"
              y="6"
              width="78"
              height="33"
              rx="4"
              fill="#020617"
              stroke="#1e293b"
              strokeWidth="1"
            />
            {/* Affichage Température LED */}
            <text
              x="45"
              y="23"
              fill={isHeatingElementOn ? '#22c55e' : '#38bdf8'}
              fontSize="14"
              fontFamily="monospace"
              fontWeight="900"
              textAnchor="middle"
            >
              {temperature.toFixed(1)}°C
            </text>
            {/* Statut sous la température */}
            <text
              x="45"
              y="34"
              fill={isHeatingElementOn ? '#f59e0b' : '#94a3b8'}
              fontSize="7"
              fontFamily="sans-serif"
              fontWeight="bold"
              textAnchor="middle"
            >
              {isHeatingElementOn
                ? '⚡ CHAUFFE EN COURS'
                : temperature >= targetTemp
                ? '✓ TEMP. ATTEINTE (65°C)'
                : '○ EN ATTENTE HC'}
            </text>
          </g>

          {/* Étiquette constructeur sur le boiler */}
          <rect x="40" y="32" width="100" height="15" rx="3" fill="#ffffff" stroke="#cbd5e1" />
          <text x="90" y="42" fill="#0f172a" fontSize="7.5" fontWeight="900" textAnchor="middle">
            CHAUFFE-EAU 200 L — 2000 W (2 kW)
          </text>
        </svg>

        {/* Badge capacité et puissance */}
        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-slate-900 text-white font-mono text-[10px] px-2.5 py-0.5 rounded-full whitespace-nowrap shadow-xs">
          {capacityLiters} L • {powerWatts} W (2 kW) • Δt=49°C
        </div>
      </div>

      {/* 2. Tableau de bord digital & Explications physiques */}
      <div className="flex-1 space-y-3 w-full">
        {/* En-tête avec état de chauffe */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-base font-black text-slate-900 tracking-tight">
                Boiler / Chauffe-eau à accumulation 200 L
              </h4>
              <span
                className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${
                  isHeatingElementOn
                    ? 'bg-amber-500 text-white animate-pulse'
                    : temperature >= targetTemp
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-200 text-slate-700'
                }`}
              >
                {isHeatingElementOn
                  ? 'Résistance 2000W (2 kW) ACTIVE'
                  : temperature >= targetTemp
                  ? 'Régulation Thermostat (Coupé)'
                  : 'Veille (Attente HC)'}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Puissance 2000 W (2 kW) • Consommation : <strong>2 kWh par heure</strong> • Δt=49°C : <strong>5h 42min</strong>
            </p>
          </div>

          {/* Bouton reset / recharge eau froide */}
          {onResetBoiler && (
            <button
              onClick={onResetBoiler}
              className="px-2.5 py-1 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold transition-all cursor-pointer"
              title="Vider et réinjecter 200L d'eau froide à 15°C"
            >
              Réinitialiser Eau Froide (15°C)
            </button>
          )}
        </div>

        {/* 3 Blocs métriques de l'afficheur */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs font-mono">
          {/* Température instantanée */}
          <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-[10px] text-slate-500 font-sans block flex items-center gap-1">
              <Thermometer className="w-3 h-3 text-sky-600" />
              Température Eau
            </span>
            <span
              className={`text-lg font-black block mt-0.5 ${
                temperature >= targetTemp ? 'text-emerald-600' : 'text-slate-900'
              }`}
            >
              {temperature.toFixed(1)} °C
            </span>
            <span className="text-[10px] text-slate-400 font-sans block">Consigne : 65.0 °C</span>
          </div>

          {/* Temps de chauffe écoulé */}
          <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-[10px] text-slate-500 font-sans block flex items-center gap-1">
              <Clock className="w-3 h-3 text-indigo-600" />
              Temps de Chauffe
            </span>
            <span className="text-lg font-black text-slate-900 block mt-0.5">
              {timeString}
            </span>
            <span className="text-[10px] text-slate-400 font-sans block">Total max : 5h 42m</span>
          </div>

          {/* Puissance électrique appelée */}
          <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-[10px] text-slate-500 font-sans block flex items-center gap-1">
              <Zap className="w-3 h-3 text-amber-500" />
              Puissance Réseau
            </span>
            <span
              className={`text-lg font-black block mt-0.5 ${
                isHeatingElementOn ? 'text-amber-600' : 'text-slate-400'
              }`}
            >
              {isHeatingElementOn ? '2000 W (2 kW)' : '0 W'}
            </span>
            <span className="text-[10px] text-slate-400 font-sans block">
              {isHeatingElementOn ? '2 kWh consommés par heure' : 'Aucun tirage'}
            </span>
          </div>

          {/* État du thermostat interne */}
          <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-[10px] text-slate-500 font-sans block flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-600" />
              Thermostat Interne
            </span>
            <span
              className={`text-sm font-black block mt-1.5 ${
                isThermostatClosed ? 'text-emerald-700' : 'text-rose-600'
              }`}
            >
              {isThermostatClosed ? 'FERMÉ (Demande)' : 'OUVERT (Coupure)'}
            </span>
            <span className="text-[10px] text-slate-400 font-sans block">Coupe à 65°C</span>
          </div>
        </div>

        {/* Barre de progression de la montée en température */}
        <div className="space-y-1">
          <div className="flex justify-between text-[11px] font-medium text-slate-600">
            <span>Eau Froide : 15°C</span>
            <span className="font-bold text-slate-800">
              Progression thermique : {Math.round(tempRatio * 100)}%
            </span>
            <span className="text-emerald-700 font-bold">Eau Chaude prête : 65°C</span>
          </div>
          <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-200 p-0.5">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${tempRatio * 100}%`,
                backgroundColor: waterColor,
              }}
            />
          </div>
        </div>

        {/* Règle technique fondamentale demandée par l'utilisateur */}
        <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl text-xs text-amber-950 flex items-start gap-2.5">
          <CheckCircle2 className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <p className="font-bold text-amber-900">
              Fonctionnement spécifique du thermostat vs contacteur :
            </p>
            <p className="text-amber-800 leading-relaxed text-[11px]">
              Quand les 65°C sont atteints après les <strong>5h44 de chauffe</strong>, c&apos;est le{' '}
              <strong>thermostat interne du boiler qui coupe le courant</strong> de la résistance (2200 W → 0 W). Le{' '}
              <strong>contacteur 63A reste verrouillé en position Heures Creuses normale</strong> jusqu&apos;à ce que le signal de télécommande HP (6h00) vienne déverrouiller sa mémoire mécanique.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
