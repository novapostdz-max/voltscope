/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ContactorState, RTCCRelayState, TariffMode } from '../../types';
import { Power, Play, Moon, Sun, Clock } from 'lucide-react';

interface SchematicViewProps {
  gridPower: boolean;
  relays: RTCCRelayState;
  contactor: ContactorState;
  latchInstalled: boolean;
  loadPower: boolean;
  tariff?: TariffMode;
  boilerTemp?: number;
  kwhHCIndex?: number;
  kwhHPIndex?: number;
  isK1Pulsing?: boolean;
  isK2Pulsing?: boolean;
  signal175HzActive?: boolean;
  isDemoRunning?: boolean;
  isAutoClockRunning?: boolean;
  currentTimeHours?: number;
  onTriggerK1: () => void;
  onTriggerK2: () => void;
  onToggleGrid: () => void;
  onToggleLatch?: () => void;
  onToggleAutoClock?: () => void;
  onRunDemo?: () => void;
  onSignalReseau22h?: () => void;
}

export const SchematicView: React.FC<SchematicViewProps> = ({
  gridPower,
  relays,
  contactor,
  latchInstalled,
  loadPower,
  tariff = 'HP',
  boilerTemp = 16,
  kwhHCIndex = 14285.4,
  kwhHPIndex = 38410.2,
  isK1Pulsing = false,
  isK2Pulsing = false,
  signal175HzActive = false,
  isDemoRunning = false,
  isAutoClockRunning = false,
  currentTimeHours = 22,
  onTriggerK1,
  onTriggerK2,
  onToggleGrid,
  onToggleLatch,
  onToggleAutoClock,
  onRunDemo,
  onSignalReseau22h,
}) => {
  // Electrical wire states
  const phase1Active = gridPower;
  const phase2Active = gridPower;
  const phase3Active = gridPower;
  const neutralActive = gridPower;

  // Format 24h clock string
  const hours = Math.floor(currentTimeHours || 0);
  const minutes = Math.floor(((currentTimeHours || 0) % 1) * 60);
  const timeString = `${hours.toString().padStart(2, '0')}h${minutes.toString().padStart(2, '0')}`;

  // Heures Creuses active status during 24h clock simulation (22h00 - 07h00)
  const isClockHC = currentTimeHours >= 22 || currentTimeHours < 7;
  const isClockHP = currentTimeHours >= 7 && currentTimeHours < 22;
  const isHCActiveNow = isAutoClockRunning ? isClockHC : (tariff === 'HC' || isK1Pulsing);
  const isHPActiveNow = isAutoClockRunning ? isClockHP : (tariff === 'HP' || isK2Pulsing);

  // Signal wire to Borne 6 accrocheur (from RTCC Sortie 8 / contact b de K2 - Heures Creuses)
  const wireHCActive = gridPower && (isHCActiveNow || isK1Pulsing);
  const wireK1Active = wireHCActive;
  // Signal wire from Borne 5 to Borne A1: active only when coil A is energized (switch 5-6 closed)
  const wire5toA1Active = contactor.mainCoilActive;

  // Signal wire to Borne 14 contacteur (from RTCC Sortie 6 / contact a de K2 - Heures Pleines)
  const wireHPActive = gridPower && (isHPActiveNow || isK2Pulsing);
  const wireK2to14Active = wireHPActive;
  // Signal wire from 13 to E1: active if order arrives and aux contact 13-14 is closed
  const wire13toE1Active = wireK2to14Active && contactor.auxContactClosed;

  // Output power to load: active if grid power is on and contacts are closed
  const loadActive = gridPower && contactor.contactsClosed;

  // Le badge "signal réseau 175 hz (pulsadis)" apparaît et disparaît exactement avec la durée du signal (1.2s), pas plus
  const isSignal175HzComing = gridPower && (isK1Pulsing || isK2Pulsing || signal175HzActive);

  return (
    <div className="flex flex-col bg-white border border-slate-300 rounded-2xl overflow-hidden shadow-lg">
      {/* Top Banner with Realtime indicators & Action Toolbar */}
      <div className="flex flex-wrap items-center justify-end gap-3 px-4 py-3 bg-slate-900 text-white border-b border-slate-700">
        {/* The 5-6 Buttons directly on the plan */}
        <div className="flex flex-wrap items-center gap-2">
          {/* 1. Démo automatique (en jaune - Test mémoire mécanique 3s HC -> HP) */}
          <button
            onClick={onRunDemo}
            disabled={isDemoRunning}
            id="btn-schematic-demo"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black bg-amber-400 hover:bg-amber-300 text-slate-950 border border-amber-300 shadow-md transition-all active:scale-95 cursor-pointer disabled:opacity-50"
            title="Tester la mémoire mécanique : active le mode Heures Creuses pendant 3 secondes puis bascule en Heures Pleines"
          >
            <Play className="w-3.5 h-3.5 fill-current text-slate-950" />
            <span>{isDemoRunning ? 'Test mémoire (3s HC → HP)...' : 'Démo automatique (Test mémoire)'}</span>
          </button>

          {/* Horloge simulation 24h (Vitesse 2 heures / seconde) */}
          <button
            onClick={onToggleAutoClock}
            id="btn-schematic-clock-24h"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all shadow-md active:scale-95 cursor-pointer ${
              isAutoClockRunning
                ? 'bg-indigo-600 hover:bg-indigo-500 text-white border-indigo-400 ring-2 ring-indigo-400/40'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-600'
            }`}
            title="Démarrer ou arrêter l'horloge simulation 24h (vitesse : 2 heures par seconde)"
          >
            <Clock className={`w-3.5 h-3.5 ${isAutoClockRunning ? 'text-amber-300 animate-spin' : 'text-indigo-300'}`} style={{ animationDuration: '3s' }} />
            <span>Horloge 24h :</span>
            <span className="font-mono text-amber-300 font-black tracking-wide text-xs">
              {timeString}
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-950/70 text-indigo-200 border border-indigo-400/30">
              {isAutoClockRunning ? '2h/s (En marche)' : '2h/s (Démarrer)'}
            </span>
          </button>

          {/* 2. Provoquer coupure réseau (qui devient Réalimenter le réseau après) */}
          <button
            onClick={onToggleGrid}
            id="btn-schematic-grid-toggle"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-md cursor-pointer ${
              gridPower
                ? 'bg-rose-600 hover:bg-rose-500 text-white border border-rose-400'
                : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 border border-emerald-300 animate-pulse font-black'
            }`}
            title={gridPower ? 'Simuler une coupure de courant 0V' : 'Rétablir la tension réseau 230/400V'}
          >
            <Power className="w-3.5 h-3.5" />
            <span>{gridPower ? 'Provoquer coupure réseau' : '🔌 Réalimenter le réseau'}</span>
          </button>

          {/* 4. Heures Creuses (Vert clair & réactif à l'horloge 24h) */}
          <button
            onClick={onTriggerK1}
            disabled={!gridPower}
            id="btn-schematic-hc"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all disabled:opacity-40 cursor-pointer ${
              isHCActiveNow && isAutoClockRunning
                ? 'bg-emerald-300 hover:bg-emerald-200 text-emerald-950 border-2 border-emerald-500 ring-2 ring-emerald-400 shadow-md shadow-emerald-400/40 animate-pulse font-black scale-102'
                : isHCActiveNow
                ? 'bg-emerald-200 hover:bg-emerald-300 text-emerald-950 border-2 border-emerald-400 shadow-xs font-bold'
                : 'bg-emerald-100 hover:bg-emerald-200 text-emerald-900 border border-emerald-300 shadow-xs'
            } ${isK1Pulsing ? 'ring-4 ring-emerald-500 scale-105' : ''}`}
            title="Émettre l'ordre Heures Creuses (contact b de K2 - Sortie 6) - Actif de 22h00 à 07h00"
          >
            <Moon className={`w-3.5 h-3.5 ${isHCActiveNow ? 'text-emerald-900 fill-emerald-700/40' : 'text-emerald-700'}`} />
            <span>Heures creuses</span>
            {isAutoClockRunning && isClockHC && (
              <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-emerald-950/20 text-emerald-950 font-black">
                ● ACTIF
              </span>
            )}
          </button>

          {/* 5. Heures Pleines (Blanc clair & symbole soleil en jaune) */}
          <button
            onClick={onTriggerK2}
            disabled={!gridPower}
            id="btn-schematic-hp"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all disabled:opacity-40 cursor-pointer ${
              isHPActiveNow && isAutoClockRunning
                ? 'bg-white hover:bg-slate-50 text-slate-950 border-2 border-amber-400 ring-2 ring-amber-300 shadow-md font-black'
                : isHPActiveNow
                ? 'bg-white hover:bg-slate-50 text-slate-900 border-2 border-amber-300 shadow-xs font-bold'
                : 'bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 shadow-xs'
            } ${isK2Pulsing ? 'ring-4 ring-amber-400 scale-105' : ''}`}
            title="Émettre l'ordre Heures Pleines (contact K2 RTCC) - Actif de 07h00 à 22h00"
          >
            <Sun className="w-4 h-4 text-yellow-400 fill-yellow-400 drop-shadow-xs" />
            <span className="text-slate-800 font-bold">Heures pleines</span>
            {isAutoClockRunning && isClockHP && (
              <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-amber-100 text-amber-900 font-bold border border-amber-300">
                ● ACTIF
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Main SVG Schematic with pure white background */}
      <div className="relative w-full overflow-x-auto p-4 bg-white flex justify-center">
        <svg
          viewBox="0 0 1000 605"
          className="w-full max-w-[1000px] h-auto select-none font-sans text-xs bg-white"
          id="rtcc-electrical-schematic"
        >
          <defs>
            <style>{`
              @keyframes flowAnimation {
                from { stroke-dashoffset: 24; }
                to { stroke-dashoffset: 0; }
              }
              .flow-wire {
                animation: flowAnimation 0.8s linear infinite;
              }
              .fast-flow-wire {
                animation: flowAnimation 0.4s linear infinite;
              }
            `}</style>
            <filter id="glow-orange" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <filter id="glow-red" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <filter id="glow-green" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2.5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <filter id="glow-amber" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2.5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <filter id="glow-blue" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2.5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <pattern id="light-grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#f1f5f9" strokeWidth="1" />
            </pattern>
          </defs>

          {/* Crisp Pure White Background & Grid */}
          <rect x="0" y="0" width="1000" height="605" fill="#ffffff" />
          <rect x="0" y="0" width="1000" height="605" fill="url(#light-grid)" />

          {/* ============================================================ */}
          {/* 1. NETWORK INCOMING WIRES */}
          {/* Arrivée Réseau 3P+N : Alimente le Compteur Siconia XT211 & le RTCC */}
          {/* ============================================================ */}
          {/* ============================================================ */}
          {/* 1. DISJONCTEUR TÉTRAPOLAIRE 4P (Alimentation & Protection RTCC) */}
          {/* ARRIVÉE RÉSEAU 3P+N EN BAS et SORTIES PROTÉGÉES EN HAUT */}
          {/* Reçoit le Réseau 3P+N par le bas et fournit 1 Phase (L1 - 175 Hz) + Neutre (N) par le haut au RTCC */}
          {/* ============================================================ */}
          <g id="disjoncteur-tetrapolaire-rtcc">
            {/* Boîtier modulaire du Disjoncteur Tétrapolaire 4P (rail DIN) */}
            <rect
              x="18"
              y="55"
              width="115"
              height="132"
              rx="6"
              fill="#f8fafc"
              stroke="#64748b"
              strokeWidth="2"
              className="drop-shadow-md"
            />

            {/* Séparations modulaires entre les 4 pôles */}
            <line x1="46" y1="55" x2="46" y2="187" stroke="#cbd5e1" strokeWidth="1" />
            <line x1="74" y1="55" x2="74" y2="187" stroke="#cbd5e1" strokeWidth="1" />
            <line x1="102" y1="55" x2="102" y2="187" stroke="#cbd5e1" strokeWidth="1" />

            {/* BORNES AVAL EN HAUT (2, 4, 6, 8) */}
            {/* Borne 2 : Sortie Phase L1 (175 Hz) vers RTCC Entrée 1 */}
            <circle cx="32" cy="63" r="4.5" fill="#ea580c" stroke="#ffffff" strokeWidth="1.5" />
            <text x="32" y="74" fill="#ea580c" fontSize="6" fontWeight="bold" textAnchor="middle">2 (L1)</text>

            {/* Borne 4 (L2) & Borne 6 (L3) : Réserve / non utilisées */}
            <circle cx="60" cy="63" r="3.5" fill="#94a3b8" />
            <text x="60" y="74" fill="#94a3b8" fontSize="5" textAnchor="middle">4 (L2)</text>
            <text x="60" y="81" fill="#94a3b8" fontSize="4" textAnchor="middle">Réserve</text>

            <circle cx="88" cy="63" r="3.5" fill="#94a3b8" />
            <text x="88" y="74" fill="#94a3b8" fontSize="5" textAnchor="middle">6 (L3)</text>
            <text x="88" y="81" fill="#94a3b8" fontSize="4" textAnchor="middle">Réserve</text>

            {/* Borne 8 : Sortie Neutre N protégé vers RTCC Entrée 2 */}
            <circle cx="117" cy="63" r="4.5" fill="#2563eb" stroke="#ffffff" strokeWidth="1.5" />
            <text x="117" y="74" fill="#2563eb" fontSize="6" fontWeight="bold" textAnchor="middle">8 (N)</text>

            {/* Zone médiane : Fenêtre d'état & Manettes 4P jumelées */}
            <rect x="23" y="86" width="105" height="42" rx="4" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="1" />
            <text x="75" y="97" fill="#0f172a" fontSize="6.5" fontWeight="bold" textAnchor="middle">
              4P - C16 (400V~)
            </text>

            {/* Voyant indicateur mécanique (Vert = Ouvert, Rouge = Fermé) */}
            <rect x="65" y="101" width="20" height="7" rx="2" fill={gridPower ? '#ef4444' : '#22c55e'} />
            <text x="75" y="106.5" fill="#ffffff" fontSize="4.5" fontWeight="bold" textAnchor="middle">
              {gridPower ? 'I (FERMÉ)' : 'O (OUVERT)'}
            </text>

            {/* Manettes de déclenchement jumelées par une barre noire */}
            {[32, 60, 88, 117].map((mx) => (
              <rect key={mx} x={mx - 4} y="112" width="8" height="14" rx="2" fill="#0f172a" />
            ))}
            <line x1="28" y1="117" x2="121" y2="117" stroke="#334155" strokeWidth="3" strokeLinecap="round" />

            {/* Étiquette d'identification du disjoncteur */}
            <text x="75" y="140" fill="#0f172a" fontSize="6" fontWeight="bold" textAnchor="middle">
              DISJONCTEUR TÉTRA 4P
            </text>
            <text x="75" y="148" fill="#475569" fontSize="5" fontWeight="semibold" textAnchor="middle">
              Protection Récepteur RTCC
            </text>
            {/* BORNES AMONT EN BAS (1, 3, 5, 7) */}
            {[
              { num: '1', name: '1 (L1)', x: 32, col: '#ea580c' },
              { num: '3', name: '3 (L2)', x: 60, col: '#0f172a' },
              { num: '5', name: '5 (L3)', x: 88, col: '#475569' },
              { num: '7', name: '7 (N)',  x: 117, col: '#2563eb' },
            ].map((p) => (
              <g key={p.num}>
                <circle cx={p.x} cy="177" r="4.5" fill={p.col} stroke="#ffffff" strokeWidth="1.5" />
                <text x={p.x} y="169" fill={p.col} fontSize="5.5" fontWeight="bold" textAnchor="middle">
                  {p.name}
                </text>
              </g>
            ))}

            {/* Lignes d'entrée amont provenant du bas vers les 4 pôles du disjoncteur */}
            <path d="M 32 208 L 32 182" stroke="#ea580c" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M 60 208 L 60 182" stroke="#0f172a" strokeWidth="2" strokeLinecap="round" />
            <path d="M 88 208 L 88 182" stroke="#475569" strokeWidth="2" strokeLinecap="round" />
            <path d="M 117 208 L 117 182" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" />

            {/* Flèches montantes du flux réseau vers le bas du disjoncteur */}
            {gridPower && (
              <g>
                <path d="M 30 197 L 32 192 L 34 197" fill="none" stroke="#ea580c" strokeWidth="1.2" />
                <path d="M 58 197 L 60 192 L 62 197" fill="none" stroke="#0f172a" strokeWidth="1.2" />
                <path d="M 86 197 L 88 192 L 90 197" fill="none" stroke="#475569" strokeWidth="1.2" />
                <path d="M 115 197 L 117 192 L 119 197" fill="none" stroke="#2563eb" strokeWidth="1.2" />
              </g>
            )}

            {/* Arrivée Réseau 3P+N EN BAS du disjoncteur */}
            <g transform="translate(18, 208)">
              <rect x="0" y="0" width="115" height="28" rx="4" fill="#0f172a" stroke="#334155" strokeWidth="1" className="drop-shadow-xs" />
              <text x="57.5" y="11" fill="#38bdf8" textAnchor="middle" fontSize="6.5" fontWeight="bold">ARRIVÉE RÉSEAU 3P+N (BAS)</text>
              <text x="57.5" y="21" fill={gridPower ? '#22c55e' : '#ef4444'} textAnchor="middle" fontSize="6" fontWeight="bold">
                {gridPower ? '230/400 V ~ 50 Hz' : '0 V (Secteur Coupé)'}
              </text>
            </g>
          </g>

          {/* ============================================================ */}
          {/* LIGNES D'ALIMENTATION RTCC DEPUIS LE HAUT DU DISJONCTEUR */}
          {/* Sortie Phase L1 (Haut Borne 2) -> Entrée 1 RTCC */}
          {/* Sortie Neutre N (Haut Borne 8) -> Entrée 2 RTCC */}
          {/* ============================================================ */}
          <g id="rtcc-power-from-breaker">
            {/* CÂBLE NOIR (Phase L1 avec télégramme 175 Hz Pulsadis) */}
            {/* Sort par le haut de la Borne 2 du disjoncteur (x=32, y=63), monte à y=25, */}
            {/* longe horizontalement jusqu'à x=175, descend le long du RTCC à y=268, */}
            {/* puis rejoint par le dessous la Borne 1 (x=201, y=250) */}
            <path
              id="fil-noir-l1-vers-rtcc1"
              d="M 32 58 L 32 25 L 175 25 L 175 268 L 201 268 L 201 250"
              fill="none"
              stroke={phase1Active ? '#0f172a' : '#94a3b8'}
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {phase1Active && (
              <path
                d="M 32 58 L 32 25 L 175 25 L 175 268 L 201 268 L 201 250"
                fill="none"
                stroke="#38bdf8"
                strokeWidth="2"
                strokeDasharray="5,5"
                className="flow-wire"
              />
            )}
            {/* Pastille Sortie Borne 2 disjoncteur */}
            <circle cx="32" cy="58" r="3.5" fill="#ea580c" stroke="#ffffff" strokeWidth="1" />
            {/* Pastille d'Entrée Borne 1 RTCC */}
            <circle cx="201" cy="250" r="4" fill="#0f172a" stroke="#ffffff" strokeWidth="1.5" />

            {/* CÂBLE BLEU (Neutre N protégé) */}
            {/* Sort par le haut de la Borne 8 du disjoncteur (x=117, y=63), monte à y=42, */}
            {/* longe horizontalement jusqu'à x=155, descend à y=285, */}
            {/* puis rejoint par le dessous la Borne 2 (x=216, y=250) */}
            <path
              id="fil-neutre-infeed-vers-rtcc2"
              d="M 117 58 L 117 42 L 155 42 L 155 285 L 216 285 L 216 250"
              fill="none"
              stroke={neutralActive ? '#2563eb' : '#93c5fd'}
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {neutralActive && (
              <g id="flow-electrons-infeed-neutre">
                <path
                  d="M 117 58 L 117 42 L 155 42 L 155 285 L 216 285 L 216 250"
                  fill="none"
                  stroke="#38bdf8"
                  strokeWidth="2.5"
                  strokeDasharray="5,5"
                  className="fast-flow-wire"
                  filter="url(#glow-blue)"
                />
                {/* Flèches de circulation des électrons */}
                <path d="M 119.5 48 L 117 42 L 114.5 48" fill="none" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" />
                <path d="M 134 40 L 140 42 L 134 44" fill="none" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" />
                <path d="M 152.5 160 L 155 166 L 157.5 160" fill="none" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" />
                <path d="M 180 282.5 L 186 285 L 180 287.5" fill="none" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" />
                <path d="M 213.5 268 L 216 262 L 218.5 268" fill="none" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" />
              </g>
            )}
            {/* Pastille Sortie Borne 8 disjoncteur */}
            <circle cx="117" cy="58" r="3.5" fill="#2563eb" stroke="#ffffff" strokeWidth="1" />
            {/* Pastille d'Entrée Borne 2 RTCC */}
            <circle cx="216" cy="250" r="4" fill="#2563eb" stroke="#ffffff" strokeWidth="1.5" />

            {/* ============================================================ */}
            {/* SORTIE DE BORNE 2 DU RTCC VERS BOBINE CONTACTEUR A2 & E2 */}
            {/* Ressort de la Borne 2 (x=224, y=250) vers Bobines A2 et E2 */}
            {/* Le neutre du chauffe-eau provient EXCLUSIVEMENT du Compteur XT211 */}
            {/* ============================================================ */}
            <circle cx="224" cy="250" r="4" fill="#2563eb" stroke="#ffffff" strokeWidth="1.5" />
            <path
              id="fil-bleu-sortie-rtcc2-vers-destinations"
              d="M 224 250 L 224 340 L 745 340 L 745 278"
              fill="none"
              stroke={neutralActive ? '#2563eb' : '#93c5fd'}
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {neutralActive && (
              <g id="flow-electrons-fil-bleu-bus">
                <path
                  d="M 224 250 L 224 340 L 745 340 L 745 278"
                  fill="none"
                  stroke="#38bdf8"
                  strokeWidth="2.5"
                  strokeDasharray="5,5"
                  className="fast-flow-wire"
                  filter="url(#glow-blue)"
                />
                {/* Flèches de circulation des électrons le long du bus neutre bleu */}
                <path d="M 221.5 295 L 224 301 L 226.5 295" fill="none" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" />
                <path d="M 330 337.5 L 336 340 L 330 342.5" fill="none" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" />
                <path d="M 520 337.5 L 526 340 L 520 342.5" fill="none" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" />
                <path d="M 680 337.5 L 686 340 L 680 342.5" fill="none" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" />
                <path d="M 742.5 315 L 745 309 L 747.5 315" fill="none" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" />
                {/* Libellé sur le fil bleu */}
                <text x="350" y="350" fill="#1d4ed8" fontSize="5.5" fontWeight="bold">
                  ⚡ Électrons Neutre (N) ➔ Borne A2 de la Bobine
                </text>
              </g>
            )}
            <circle cx="745" cy="278" r="5" fill="#2563eb" stroke="#1d4ed8" strokeWidth="1.5" />

            {/* Raccordement Neutre vers Bobine A2 du Contacteur (x=455, y=280) */}
            <path
              id="fil-bleu-vers-bobine-a2"
              d="M 455 340 L 455 280"
              fill="none"
              stroke={neutralActive ? '#2563eb' : '#93c5fd'}
              strokeWidth="3.5"
              strokeLinecap="round"
            />
            {neutralActive && (
              <g id="flow-electrons-vers-a2">
                <path
                  d="M 455 340 L 455 280"
                  fill="none"
                  stroke="#38bdf8"
                  strokeWidth="2.5"
                  strokeDasharray="4,4"
                  className="fast-flow-wire"
                  filter="url(#glow-blue)"
                />
                {/* Flèches des électrons qui montent directement dans la borne A2 de la bobine */}
                <path d="M 452.5 320 L 455 314 L 457.5 320" fill="none" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" />
                <path d="M 452.5 298 L 455 292 L 457.5 298" fill="none" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" />
              </g>
            )}
            <circle cx="455" cy="340" r="4" fill="#2563eb" stroke="#ffffff" strokeWidth="1" />

            {/* Borne A2 de la Bobine avec électrons en mouvement */}
            {neutralActive && (
              <circle cx="455" cy="280" r="7" fill="#38bdf8" className="animate-ping" opacity={0.7} />
            )}
            <circle cx="455" cy="280" r="5" fill="#2563eb" stroke="#93c5fd" strokeWidth="1.5" />
            <circle cx="455" cy="280" r="2.5" fill="#ffffff" />
            <text x="455" y="273" fill="#1d4ed8" fontSize="6.5" fontWeight="900" textAnchor="middle">
              A2
            </text>
          </g>

          {/* ============================================================ */}
          {/* 2. RTCC MODULE (Relais Télécommande Centralisée) */}
          {/* ============================================================ */}
          <g id="rtcc-module">
            {/* Boîtier principal du récepteur RTCC */}
            <rect
              x="188"
              y="126"
              width="186"
              height="124"
              rx="8"
              fill="#f8fafc"
              stroke="#0284c7"
              strokeWidth="2"
              className="drop-shadow-sm"
            />

            {/* En-tête / Badge RTCC à gauche */}
            <rect x="194" y="132" width="28" height="16" rx="3" fill="#e0f2fe" stroke="#38bdf8" strokeWidth="1" />
            <text x="208" y="143.5" fill="#0369a1" textAnchor="middle" fontWeight="bold" fontSize="8" letterSpacing="0.5">
              RTCC
            </text>

            {/* ------------------------------------------------------------ */}
            {/* COLONNE 1 : RELAIS K1 (en face des bornes 3, 4, 5) */}
            {/* ------------------------------------------------------------ */}
            <g id="k1-column">
              {/* En-tête K1 (neutre, ne s'allume jamais) */}
              <rect
                x="226"
                y="132"
                width="38"
                height="16"
                rx="3"
                fill="#1e293b"
                stroke="#475569"
                strokeWidth="1"
              />
              <text x="245" y="143.5" fill="#94a3b8" textAnchor="middle" fontWeight="bold" fontSize="8">
                K1
              </text>

              {/* Module relais K1 (statique, passif, aucun contact mobile) */}
              <g transform="translate(226, 151)">
                <rect
                  x="0"
                  y="0"
                  width="38"
                  height="73"
                  rx="3"
                  fill="#ffffff"
                  stroke="#cbd5e1"
                  strokeWidth="1.2"
                />
                <text x="19" y="24" fill="#334155" textAnchor="middle" fontWeight="bold" fontSize="9">
                  K1
                </text>
                <text x="19" y="38" fill="#64748b" textAnchor="middle" fontSize="5" fontWeight="bold">
                  RELAIS
                </text>
                <text x="19" y="60" fill="#94a3b8" fontSize="4.5" textAnchor="middle">
                  Sorties 3-4-5
                </text>
              </g>
            </g>

            {/* ------------------------------------------------------------ */}
            {/* COLONNE 2 : RELAIS K2 (avec le module noir et sorties 6, 7, 8) */}
            {/* ------------------------------------------------------------ */}
            <g id="k2-column">
              {/* En-tête K2 */}
              <rect
                x="268"
                y="132"
                width="54"
                height="16"
                rx="3"
                fill="#1e293b"
                stroke="#dc2626"
                strokeWidth="1"
                onClick={onTriggerK2}
                className="cursor-pointer"
              />
              <text x="295" y="143.5" fill="#f87171" textAnchor="middle" fontWeight="bold" fontSize="8">
                K2 (Inverseur)
              </text>

              {/* Module Débrochable en NOIR (Fidèle à la photo : Ic 25 A, sélecteur a/b et schéma en face de 6, 7, 8) */}
              <g
                id="rtcc-k2-cartridge"
                transform="translate(268, 151)"
                className="cursor-pointer select-none"
                onClick={isHCActiveNow ? onTriggerK2 : onTriggerK1}
              >
                <title>Module K2 Ic 25 A : Cliquez pour basculer manuellement entre a (HP) et b (HC)</title>

                {/* Corps noir de la cartouche */}
                <rect x="0" y="0" width="54" height="73" rx="3" fill="#090d16" stroke="#334155" strokeWidth="1.2" />

                {/* Bordure latérale droite transparente avec repères rouges (comme sur la photo) */}
                <rect x="47" y="1" width="6" height="71" rx="1" fill="#94a3b8" fillOpacity="0.25" stroke="#cbd5e1" strokeWidth="0.5" strokeOpacity="0.4" />
                <line x1="46" y1="28" x2="53" y2="28" stroke="#ef4444" strokeWidth="1" strokeOpacity="0.8" />
                <line x1="46" y1="42" x2="53" y2="42" stroke="#ef4444" strokeWidth="1" strokeOpacity="0.8" />

                {/* 1. Écriture supérieure exacte : Ic 25 A */}
                <text x="23" y="10.5" fill="#ffffff" fontSize="7" fontWeight="900" fontFamily="sans-serif" textAnchor="middle" letterSpacing="0.4">
                  Ic 25 A
                </text>

                {/* 2. Bouton poussoir / sélecteur rouge en croix (se déplace entre a à gauche et b à droite selon le tarif) */}
                <g id="k2-slider-container">
                  {/* Repère a à gauche (Pleine) - Cliquable */}
                  <g
                    className="cursor-pointer select-none"
                    onClick={(e) => {
                      e.stopPropagation();
                      onTriggerK2();
                    }}
                  >
                    <title>Position &apos;a&apos; (Heures Pleines) : Cliquez pour basculer sur a</title>
                    <rect x="1" y="13" width="11" height="13" fill="transparent" />
                    <text
                      x="6"
                      y="21"
                      fill={!isHCActiveNow ? '#fef08a' : '#64748b'}
                      fontSize="7.5"
                      fontWeight="900"
                      fontFamily="sans-serif"
                      textAnchor="middle"
                    >
                      a
                    </text>
                  </g>

                  {/* Curseur rouge mobile (se déplace horizontalement vers a à gauche ou vers b à droite au clic) */}
                  <g
                    id="k2-slider-button"
                    transform={`translate(${isHCActiveNow ? 23 : 11}, 14)`}
                    className="transition-transform duration-300 ease-in-out cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (isHCActiveNow) {
                        onTriggerK2();
                      } else {
                        onTriggerK1();
                      }
                    }}
                  >
                    <title>
                      {isHCActiveNow
                        ? "Bouton rouge sur 'b' (Heures Creuses) : Cliquez pour changer la position vers 'a' (Heures Pleines)"
                        : "Bouton rouge sur 'a' (Heures Pleines) : Cliquez pour changer la position vers 'b' (Heures Creuses)"}
                    </title>

                    {/* Zone de clic élargie et halo d'interaction */}
                    <rect x="-3" y="-3" width="26" height="17" fill="transparent" />
                    <rect x="-1" y="1" width="22" height="8.5" rx="2.5" fill="#ffffff" opacity="0.12" />

                    {/* Barre horizontale de la croix rouge */}
                    <rect
                      x="0"
                      y="2"
                      width="20"
                      height="6.5"
                      rx="1.5"
                      fill="#ef4444"
                      stroke="#b91c1c"
                      strokeWidth="0.7"
                      filter="drop-shadow(0 1px 2px rgba(0,0,0,0.6))"
                    />
                    {/* Noyau central vertical de la croix rouge */}
                    <rect x="6.5" y="0" width="7" height="11" rx="1.5" fill="#dc2626" stroke="#991b1b" strokeWidth="0.7" />
                    {/* Témoin central lumineux sur le bouton rouge */}
                    <circle cx="10" cy="5.2" r="1.5" fill="#ffffff" opacity="0.9" />
                  </g>

                  {/* Repère b à droite (Creuse) - Cliquable */}
                  <g
                    className="cursor-pointer select-none"
                    onClick={(e) => {
                      e.stopPropagation();
                      onTriggerK1();
                    }}
                  >
                    <title>Position &apos;b&apos; (Heures Creuses) : Cliquez pour basculer sur b</title>
                    <rect x="42" y="13" width="11" height="13" fill="transparent" />
                    <text
                      x="47"
                      y="21"
                      fill={isHCActiveNow ? '#f87171' : '#64748b'}
                      fontSize="7.5"
                      fontWeight="900"
                      fontFamily="sans-serif"
                      textAnchor="middle"
                    >
                      b
                    </text>
                  </g>
                </g>

                {/* 3. Schéma électrique exact imprimé en blanc : a à gauche, b à droite, commun au milieu sans lettre */}
                <g transform="translate(4, 31)">
                  {/* Cadre blanc du schéma */}
                  <rect x="0" y="0" width="46" height="30" rx="1.5" fill="#020617" stroke="#ffffff" strokeWidth="0.8" />

                  {/* 3 bornes circulaires en bas (en face des bornes 6, 7, 8) */}
                  {/* Borne gauche : a (en face de 6) */}
                  <circle cx="9" cy="25" r="1.8" fill="none" stroke="#ffffff" strokeWidth="0.8" />
                  {/* Borne milieu : Commun (en face de 7, SANS AUCUNE LETTRE) */}
                  <circle cx="23" cy="25" r="1.8" fill="none" stroke="#ffffff" strokeWidth="0.8" />
                  {/* Borne droite : b (en face de 8) */}
                  <circle cx="37" cy="25" r="1.8" fill="none" stroke="#ffffff" strokeWidth="0.8" />

                  {/* Ligne gauche montant vers le contact fixe a (à gauche) */}
                  <line x1="9" y1="23.2" x2="9" y2="8" stroke="#ffffff" strokeWidth="0.8" />
                  <circle cx="9" cy="8" r="1.2" fill="#ffffff" />
                  <text x="9" y="6" fill="#ffffff" fontSize="5.5" fontWeight="bold" fontFamily="sans-serif" textAnchor="middle">a</text>

                  {/* Ligne centrale (Le COMMUN au milieu, aucune lettre) montant vers le pivot de la lame */}
                  <line x1="23" y1="23.2" x2="23" y2="15" stroke="#ffffff" strokeWidth="0.8" />
                  <circle cx="23" cy="15" r="1.4" fill="#ffffff" />

                  {/* Ligne droite montant vers le contact fixe b (à droite) */}
                  <line x1="37" y1="23.2" x2="37" y2="8" stroke="#ffffff" strokeWidth="0.8" />
                  <circle cx="37" cy="8" r="1.2" fill="#ffffff" />
                  <text x="37" y="6" fill="#ffffff" fontSize="5.5" fontWeight="bold" fontFamily="sans-serif" textAnchor="middle">b</text>

                  {/* Lame mobile issue du COMMUN (au milieu) : bascule sur a (gauche) ou sur b (droite) selon HC/HP */}
                  {isHCActiveNow ? (
                    /* En Heures Creuses : le commun est relié à b (à droite) */
                    <line x1="23" y1="15" x2="37" y2="8" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" />
                  ) : (
                    /* En Heures Pleines : le commun est relié à a (à gauche) */
                    <line x1="23" y1="15" x2="9" y2="8" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" />
                  )}

                  {/* ============================================================ */}
                  {/* COURANT ACTIF QUI TRAVERSE LE COMMUN ET a OU b PUIS SORT */}
                  {/* ============================================================ */}
                  {gridPower && (
                    <g id="k2-internal-current-flow">
                      {/* 1) Courant qui monte dans la ligne du COMMUN depuis la borne milieu */}
                      <path
                        d="M 23 25 L 23 15"
                        fill="none"
                        stroke="#38bdf8"
                        strokeWidth="2.2"
                        strokeDasharray="3,3"
                        className="fast-flow-wire"
                        filter="url(#glow-orange)"
                      />
                      <circle cx="23" cy="15" r="2" fill="#38bdf8" className="animate-pulse" />

                      {isHCActiveNow ? (
                        /* 2) En Heures Creuses : le courant traverse la lame vers b (droite) et descend vers la sortie */
                        <g id="current-to-b">
                          {/* Courant traversant la lame vers b */}
                          <path
                            d="M 23 15 L 37 8"
                            fill="none"
                            stroke="#f87171"
                            strokeWidth="2.5"
                            strokeDasharray="3,3"
                            className="fast-flow-wire"
                            filter="url(#glow-red)"
                          />
                          {/* Courant descendant le long de la ligne b vers la sortie */}
                          <path
                            d="M 37 8 L 37 25"
                            fill="none"
                            stroke="#f87171"
                            strokeWidth="2.2"
                            strokeDasharray="3,3"
                            className="fast-flow-wire"
                            filter="url(#glow-red)"
                          />
                          {/* Pastille active de sortie b */}
                          <circle cx="37" cy="25" r="2.2" fill="#f87171" className="animate-ping" opacity="0.7" />
                          <circle cx="37" cy="25" r="2" fill="#dc2626" />
                          {/* Flèche indiquant la sortie du courant */}
                          <path
                            d="M 37 25 L 37 29.5 M 35.5 28 L 37 29.5 L 38.5 28"
                            fill="none"
                            stroke="#f87171"
                            strokeWidth="1.2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </g>
                      ) : (
                        /* 2) En Heures Pleines : le courant traverse la lame vers a (gauche) et descend vers la sortie */
                        <g id="current-to-a">
                          {/* Courant traversant la lame vers a */}
                          <path
                            d="M 23 15 L 9 8"
                            fill="none"
                            stroke="#fef08a"
                            strokeWidth="2.5"
                            strokeDasharray="3,3"
                            className="fast-flow-wire"
                            filter="url(#glow-orange)"
                          />
                          {/* Courant descendant le long de la ligne a vers la sortie */}
                          <path
                            d="M 9 8 L 9 25"
                            fill="none"
                            stroke="#fef08a"
                            strokeWidth="2.2"
                            strokeDasharray="3,3"
                            className="fast-flow-wire"
                            filter="url(#glow-orange)"
                          />
                          {/* Pastille active de sortie a */}
                          <circle cx="9" cy="25" r="2.2" fill="#fef08a" className="animate-ping" opacity="0.7" />
                          <circle cx="9" cy="25" r="2" fill="#eab308" />
                          {/* Flèche indiquant la sortie du courant */}
                          <path
                            d="M 9 25 L 9 29.5 M 7.5 28 L 9 29.5 L 10.5 28"
                            fill="none"
                            stroke="#fef08a"
                            strokeWidth="1.2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </g>
                      )}
                    </g>
                  )}
                </g>

                {/* Texte explicatif en bas du module */}
                <text x="27" y="68" fill={isHCActiveNow ? '#f87171' : '#fef08a'} fontSize="4.2" fontWeight="bold" textAnchor="middle">
                  {isHCActiveNow ? 'Courant : Commun ➔ b (Sortie 8)' : 'Courant : Commun ➔ a (Sortie 6)'}
                </text>
              </g>
            </g>

            {/* ------------------------------------------------------------ */}
            {/* COLONNE 3 : RELAIS K3 (en face des bornes 9, 10, 11) */}
            {/* ------------------------------------------------------------ */}
            <g id="k3-column">
              {/* En-tête K3 */}
              <rect
                x="326"
                y="132"
                width="42"
                height="16"
                rx="3"
                fill="#1e293b"
                stroke="#475569"
                strokeWidth="1"
              />
              <text x="347" y="143.5" fill="#94a3b8" textAnchor="middle" fontWeight="bold" fontSize="8">
                K3
              </text>

              {/* Module relais K3 (statique, passif, aucun contact mobile) */}
              <g transform="translate(326, 151)">
                <rect
                  x="0"
                  y="0"
                  width="42"
                  height="73"
                  rx="3"
                  fill="#ffffff"
                  stroke="#cbd5e1"
                  strokeWidth="1.2"
                />
                <text x="21" y="24" fill="#334155" textAnchor="middle" fontWeight="bold" fontSize="9">
                  K3
                </text>
                <text x="21" y="38" fill="#64748b" textAnchor="middle" fontSize="5" fontWeight="bold">
                  RELAIS
                </text>
                <text x="21" y="60" fill="#94a3b8" fontSize="4.5" textAnchor="middle">
                  Sorties 9-10-11
                </text>
              </g>
            </g>

            {/* ------------------------------------------------------------ */}
            {/* BORNIER DU RTCC : Bornes 1 à 11 */}
            {/* 3, 4, 5 en face K1 | 6, 7, 8 en face K2 | 9, 10, 11 en face K3 */}
            {/* ------------------------------------------------------------ */}
            <g id="rtcc-terminals">
              <rect x="188" y="226" width="186" height="24" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="1" />
              {[
                { num: '1', x: 205 },
                { num: '2', x: 220 },
                { num: '3', x: 236 },
                { num: '4', x: 248 },
                { num: '5', x: 260 },
                { num: '6', x: 280 },
                { num: '7', x: 295 },
                { num: '8', x: 310 },
                { num: '9', x: 334 },
                { num: '10', x: 348 },
                { num: '11', x: 362 },
              ].map((term) => (
                <g key={term.num}>
                  <line x1={term.x} y1="226" x2={term.x} y2="250" stroke="#cbd5e1" strokeWidth="0.5" />
                  <text
                    x={term.x}
                    y="242"
                    fill={term.num === '6' ? '#dc2626' : term.num === '8' ? '#ea580c' : term.num === '1' ? '#0f172a' : term.num === '2' ? '#1d4ed8' : term.num === '7' ? '#0f172a' : '#334155'}
                    textAnchor="middle"
                    fontSize={term.num === '6' || term.num === '8' || term.num === '1' || term.num === '2' || term.num === '7' ? '11' : '9'}
                    fontWeight="bold"
                  >
                    {term.num}
                  </text>
                  {term.num === '1' ? (
                    <g>
                      <rect x="198" y="247" width="14" height="6" rx="2" fill="#0f172a" />
                      <circle cx="201" cy="250" r="3.5" fill="#0f172a" stroke="#ffffff" strokeWidth="1" />
                      <circle cx="209" cy="250" r="3.5" fill="#0f172a" stroke="#ffffff" strokeWidth="1" />
                      <text x="201" y="262" fill="#0f172a" fontSize="5.5" fontWeight="bold" textAnchor="middle">Entrée</text>
                      <text x="209" y="262" fill="#0f172a" fontSize="5.5" fontWeight="bold" textAnchor="middle">Sortie</text>
                    </g>
                  ) : term.num === '2' ? (
                    <g>
                      <rect x="213" y="247" width="14" height="6" rx="2" fill="#2563eb" />
                      <circle cx="216" cy="250" r="3.5" fill="#2563eb" stroke="#ffffff" strokeWidth="1" />
                      <circle cx="224" cy="250" r="3.5" fill="#2563eb" stroke="#ffffff" strokeWidth="1" />
                      <text x="216" y="262" fill="#1d4ed8" fontSize="5.5" fontWeight="bold" textAnchor="middle">Entrée</text>
                      <text x="224" y="262" fill="#1d4ed8" fontSize="5.5" fontWeight="bold" textAnchor="middle">Sortie</text>
                    </g>
                  ) : term.num === '7' ? (
                    <g>
                      <rect x="285" y="247" width="20" height="6" rx="2" fill="#0f172a" />
                      <circle cx="295" cy="250" r="4" fill="#0f172a" stroke="#ffffff" strokeWidth="1.5" />
                      <text x="295" y="262" fill="#0f172a" fontSize="5" fontWeight="bold" textAnchor="middle">7 (Commun)</text>
                    </g>
                  ) : term.num === '6' ? (
                    <g>
                      {gridPower && !isHCActiveNow && (
                        <>
                          <circle cx={term.x} cy="250" r={8} fill="#fef08a" className="animate-ping" opacity={0.6} />
                          <path
                            d={`M ${term.x} 250 L ${term.x} 265 M ${term.x - 2.5} 262 L ${term.x} 265 L ${term.x + 2.5} 262`}
                            fill="none"
                            stroke="#eab308"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                          />
                        </>
                      )}
                      <circle
                        cx={term.x}
                        cy="250"
                        r={5}
                        fill={gridPower && !isHCActiveNow ? '#f59e0b' : '#dc2626'}
                        stroke={gridPower && !isHCActiveNow ? '#d97706' : '#991b1b'}
                        strokeWidth={1.5}
                      />
                      <text x={term.x} y="262" fill={gridPower && !isHCActiveNow ? '#b45309' : '#dc2626'} fontSize="5" fontWeight="bold" textAnchor="middle">6 (a)</text>
                    </g>
                  ) : term.num === '8' ? (
                    <g>
                      {gridPower && isHCActiveNow && (
                        <>
                          <circle cx={term.x} cy="250" r={8} fill="#fca5a5" className="animate-ping" opacity={0.6} />
                          <path
                            d={`M ${term.x} 250 L ${term.x} 265 M ${term.x - 2.5} 262 L ${term.x} 265 L ${term.x + 2.5} 262`}
                            fill="none"
                            stroke="#dc2626"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                          />
                        </>
                      )}
                      <circle
                        cx={term.x}
                        cy="250"
                        r={5}
                        fill={gridPower && isHCActiveNow ? '#dc2626' : '#ea580c'}
                        stroke={gridPower && isHCActiveNow ? '#991b1b' : '#9a3412'}
                        strokeWidth={1.5}
                      />
                      <text x={term.x} y="262" fill={gridPower && isHCActiveNow ? '#991b1b' : '#ea580c'} fontSize="5" fontWeight="bold" textAnchor="middle">8 (b)</text>
                    </g>
                  ) : (
                    <circle
                      cx={term.x}
                      cy="250"
                      r={2.5}
                      fill="#64748b"
                    />
                  )}
                </g>
              ))}

              {/* Repères des 3 groupes de bornes sous K1, K2 et K3 */}
              <text x="248" y="271" fill="#0284c7" fontSize="4.5" fontWeight="bold" textAnchor="middle">
                [ 3 4 5 ] K1
              </text>
              <text x="295" y="271" fill="#dc2626" fontSize="4.5" fontWeight="bold" textAnchor="middle">
                [ 6(a)  7(Com)  8(b) ] K2
              </text>
              <text x="348" y="271" fill="#64748b" fontSize="4.5" fontWeight="bold" textAnchor="middle">
                [ 9 10 11 ] K3
              </text>

              {/* Liaisons internes entre les broches de K2 et le bornier 6, 7, 8 */}
              {/* Liaison montante Borne 7 -> Commun K2 */}
              <line x1="295" y1="226" x2="295" y2="215" stroke="#0f172a" strokeWidth="2.5" />
              {gridPower && (
                <path
                  d="M 295 250 L 295 210"
                  fill="none"
                  stroke="#38bdf8"
                  strokeWidth="2.2"
                  strokeDasharray="3,3"
                  className="fast-flow-wire"
                />
              )}
              {/* Liaison descendante K2 (b) -> Borne 8 (HC) */}
              <line x1="309" y1="210" x2="310" y2="226" stroke={isHCActiveNow ? '#dc2626' : '#cbd5e1'} strokeWidth="2.5" />
              {gridPower && isHCActiveNow && (
                <path
                  d="M 309 210 L 310 250"
                  fill="none"
                  stroke="#f87171"
                  strokeWidth="2.2"
                  strokeDasharray="3,3"
                  className="fast-flow-wire"
                />
              )}
              {/* Liaison descendante K2 (a) -> Borne 6 (HP) */}
              <line x1="281" y1="210" x2="280" y2="226" stroke={!isHCActiveNow ? '#eab308' : '#cbd5e1'} strokeWidth="2.5" />
              {gridPower && !isHCActiveNow && (
                <path
                  d="M 281 210 L 280 250"
                  fill="none"
                  stroke="#fef08a"
                  strokeWidth="2.2"
                  strokeDasharray="3,3"
                  className="fast-flow-wire"
                />
              )}
            </g>

            {/* Badge Signal Réseau 175 Hz (Pulsadis) : déplacé à gauche et visible uniquement quand le signal arrive (à 22h ou à 7h) */}
            {isSignal175HzComing && (
              <g className="animate-pulse">
                {/* Décalé un peu à gauche (x=130 au lieu de x=210) au-dessus de l'arrivée Phase L1 vers Borne 1 */}
                <rect
                  x="130"
                  y="105"
                  width="142"
                  height="18"
                  rx="9"
                  fill="#0284c7"
                  stroke="#38bdf8"
                  strokeWidth="1.5"
                  className="drop-shadow-md"
                />
                <circle cx="142" cy="114" r="3.5" fill="#38bdf8" className="animate-ping" />
                <circle cx="142" cy="114" r="3" fill="#ffffff" />
                <text
                  x="206"
                  y="117.5"
                  fill="#ffffff"
                  textAnchor="middle"
                  fontSize="7.5"
                  fontWeight="bold"
                  letterSpacing="0.4"
                >
                  signal réseau 175 hz (pulsadis)
                </text>
              </g>
            )}

          </g>

          {/* ============================================================ */}
          {/* 3. CONTROL WIRES: RTCC -> ACCROCHEUR MÉCANIQUE -> BOBINE A1 */}
          {/* ============================================================ */}
          <g id="control-wires">
            {/* FIL ROUGE : Sortie 8 (b) RTCC vers Borne 6 Accrocheur Mécanique (Heures Creuses) */}
            <path
              id="fil-rouge-rtcc8-vers-accrocheur6"
              d="M 310 250 L 310 300 L 785 300 L 785 285"
              fill="none"
              stroke="#dc2626"
              strokeWidth="3.5"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
            {wireHCActive && (
              <g id="flow-wire-8-to-accrocheur6">
                <path
                  d="M 310 250 L 310 300 L 785 300 L 785 285"
                  fill="none"
                  stroke="#f87171"
                  strokeWidth="2.8"
                  strokeDasharray="6,6"
                  className="fast-flow-wire"
                  filter="url(#glow-red)"
                />
                {/* Flèches de direction indiquant le sens d'écoulement Sortie 8 -> Accrocheur */}
                <path d="M 307.5 272 L 310 278 L 312.5 272" fill="none" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" />
                <path d="M 456 297.5 L 462 300 L 456 302.5" fill="none" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" />
                <path d="M 636 297.5 L 642 300 L 636 302.5" fill="none" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" />
                <path d="M 782.5 294 L 785 288 L 787.5 294" fill="none" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" />
                {/* Libellé sur le fil */}
                <text x="550" y="296" fill="#b91c1c" fontSize="5.5" fontWeight="bold">
                  ⚡ Courant HC (Sortie 8 ➔ Accrocheur 6)
                </text>
              </g>
            )}
            <circle cx="310" cy="250" r="5" fill="#dc2626" stroke="#991b1b" strokeWidth="1.5" />
            <circle cx="785" cy="285" r="5" fill="#dc2626" stroke="#991b1b" strokeWidth="1.5" />

            {/* FIL ORANGE : Borne 5 Accrocheur Mécanique vers Borne A1 Contacteur */}
            <path
              id="fil-orange-accrocheur5-vers-a1"
              d="M 785 225 L 785 205 L 455 205 L 455 240"
              fill="none"
              stroke="#ea580c"
              strokeWidth="3.5"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
            {wire5toA1Active && (
              <path
                d="M 785 225 L 785 205 L 455 205 L 455 240"
                fill="none"
                stroke="#ffedd5"
                strokeWidth="2.5"
                strokeDasharray="6,6"
                className="fast-flow-wire"
                filter="url(#glow-orange)"
              />
            )}
            <circle cx="785" cy="225" r="5" fill="#ea580c" stroke="#9a3412" strokeWidth="1.5" />
            <circle cx="455" cy="240" r="5" fill="#ea580c" stroke="#9a3412" strokeWidth="1.5" />

            {/* FIL ORANGE : Borne 13 contacteur vers Borne E1 Mémoire Mécanique */}
            <path
              id="fil-orange-13-vers-e1"
              d="M 695 230 L 695 215 L 745 215 L 745 240"
              fill="none"
              stroke="#ea580c"
              strokeWidth="3.5"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
            {(wire13toE1Active || contactor.releaseCoilActive) && (
              <path
                d="M 695 230 L 695 215 L 745 215 L 745 240"
                fill="none"
                stroke="#ffedd5"
                strokeWidth="2"
                strokeDasharray="5,5"
                className="fast-flow-wire"
                filter="url(#glow-orange)"
              />
            )}
            <circle cx="695" cy="230" r="4.5" fill="#ea580c" stroke="#9a3412" strokeWidth="1.5" />
            <circle cx="745" cy="240" r="4.5" fill="#ea580c" stroke="#9a3412" strokeWidth="1.5" />

            {/* FIL AMBRE/JAUNE : Sortie 6 (a) RTCC vers Borne 14 Mémoire Mécanique (Heures Pleines) */}
            <path
              id="fil-ambre-rtcc6-vers-14"
              d="M 280 250 L 280 322 L 695 322 L 695 260"
              fill="none"
              stroke="#d97706"
              strokeWidth="3.5"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
            {wireHPActive && (
              <g id="flow-wire-6-to-14">
                <path
                  d="M 280 250 L 280 322 L 695 322 L 695 260"
                  fill="none"
                  stroke="#fef08a"
                  strokeWidth="2.8"
                  strokeDasharray="6,6"
                  className="fast-flow-wire"
                  filter="url(#glow-amber)"
                />
                {/* Flèches de direction indiquant le sens d'écoulement Sortie 6 -> Borne 14 */}
                <path d="M 277.5 272 L 280 278 L 282.5 272" fill="none" stroke="#78350f" strokeWidth="1.5" strokeLinecap="round" />
                <path d="M 406 319.5 L 412 322 L 406 324.5" fill="none" stroke="#78350f" strokeWidth="1.5" strokeLinecap="round" />
                <path d="M 556 319.5 L 562 322 L 556 324.5" fill="none" stroke="#78350f" strokeWidth="1.5" strokeLinecap="round" />
                <path d="M 692.5 275 L 695 268 L 697.5 275" fill="none" stroke="#78350f" strokeWidth="1.5" strokeLinecap="round" />
                {/* Libellé sur le fil */}
                <text x="490" y="331" fill="#b45309" fontSize="5.5" fontWeight="bold">
                  ⚡ Courant HP (Sortie 6 ➔ Déclencheur 14)
                </text>
              </g>
            )}
            <circle cx="280" cy="250" r="5" fill="#f59e0b" stroke="#b45309" strokeWidth="1.5" />
            <circle cx="695" cy="260" r="4.5" fill="#f59e0b" stroke="#b45309" strokeWidth="1.5" />
          </g>

          {/* ============================================================ */}
          {/* PONTAGE FIL NOIR AU-DESSOUS DU RTCC : SORTIE BORNE 1 VERS BORNE 7 */}
          {/* Ressort de la Borne 1 (x=209) par le bas, longe au-dessous du RTCC */}
          {/* avec sauts de câble (pontets) au-dessus du neutre et du fil de commande */}
          {/* et se raccorde dans la Borne 7 (x=295) */}
          {/* ============================================================ */}
          <g id="rtcc-bridge-1-to-7-below">
            {/* Halo blanc isolant pour marquer nettement le saut par-dessus les fils sous-jacents */}
            <path
              d="M 209 250 L 209 272 L 211 272 A 9 8 0 0 1 229 272 L 274 272 A 6 6 0 0 1 286 272 L 295 272 L 295 250"
              fill="none"
              stroke="#ffffff"
              strokeWidth="7"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Ligne conductrice principale en noir intense */}
            <path
              id="fil-noir-rtcc1-vers-rtcc7"
              d="M 209 250 L 209 272 L 211 272 A 9 8 0 0 1 229 272 L 274 272 A 6 6 0 0 1 286 272 L 295 272 L 295 250"
              fill="none"
              stroke="#0f172a"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Animation de flux 175 Hz actif */}
            {phase1Active && (
              <path
                d="M 209 250 L 209 272 L 211 272 A 9 8 0 0 1 229 272 L 274 272 A 6 6 0 0 1 286 272 L 295 272 L 295 250"
                fill="none"
                stroke="#38bdf8"
                strokeWidth="2"
                strokeDasharray="5,5"
                className="flow-wire"
              />
            )}

            {/* Flèche indiquant le sens d'écoulement Sortie 1 -> Borne 7 */}
            <path
              d="M 248 269 L 253 272 L 248 275"
              fill="none"
              stroke="#38bdf8"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Pastille Sortie Borne 1 */}
            <circle cx="209" cy="250" r="4.5" fill="#0f172a" stroke="#ffffff" strokeWidth="1.5" />
            {/* Pastille Borne 7 */}
            <circle cx="295" cy="250" r="4.5" fill="#0f172a" stroke="#ffffff" strokeWidth="1.5" />
          </g>

          {/* ============================================================ */}
          {/* COMPTEUR ÉLECTRIQUE TRIPHASÉ SICONIA XT211 (SAGEMCOM) */}
          {/* Placé DIRECTEMENT AU-DESSUS DU CONTACTEUR 63A */}
          {/* Ses sorties descendent TOUT DROIT ("en droit") vers les contacts 1, 3, 5 */}
          {/* et la sortie Neutre bleue (8) descend directement vers le chauffe-eau */}
          {/* ============================================================ */}
          <g id="compteur-siconia-xt211" transform="translate(475, 12)">
            {/* Boîtier principal blanc crème du compteur */}
            <rect
              x="0"
              y="0"
              width="235"
              height="178"
              rx="10"
              fill="#f8fafc"
              stroke="#94a3b8"
              strokeWidth="2"
              className="drop-shadow-md"
            />
            <rect x="2.5" y="2.5" width="230" height="173" rx="8" fill="none" stroke="#e2e8f0" strokeWidth="1" />

            {/* Arrivée Réseau 3P+N en amont du compteur */}
            <g transform="translate(8, -10)">
              <rect x="0" y="0" width="130" height="14" rx="3" fill="#0f172a" stroke="#475569" strokeWidth="0.8" />
              <text x="65" y="9.5" fill="#f8fafc" textAnchor="middle" fontSize="5.5" fontWeight="bold">
                Arrivée Réseau Triphasé 3P+N (Amont)
              </text>
            </g>
            <line x1="20" y1="4" x2="20" y2="12" stroke="#ea580c" strokeWidth="2" strokeLinecap="round" />
            <line x1="38" y1="4" x2="38" y2="12" stroke="#0f172a" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="56" y1="4" x2="56" y2="12" stroke="#475569" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="74" y1="4" x2="74" y2="12" stroke="#2563eb" strokeWidth="1.5" strokeLinecap="round" />

            {/* Haut gauche : Modèle XT211 & Marquage CE */}
            <text x="14" y="22" fill="#0f172a" fontSize="8.5" fontWeight="bold" fontFamily="monospace">
              XT211
            </text>
            <text x="14" y="29" fill="#64748b" fontSize="4.5">22/211059 CH</text>
            <rect x="14" y="31" width="30" height="9" rx="1.5" fill="none" stroke="#475569" strokeWidth="0.8" />
            <text x="19" y="38" fill="#0f172a" fontSize="5.5" fontWeight="bold">CE</text>
            <text x="28" y="38" fill="#0f172a" fontSize="5" fontWeight="bold">M23 0071</text>

            {/* Centre supérieur : Marque SICONIA */}
            <text x="110" y="22" fill="#0f172a" fontSize="9.5" fontWeight="900" textAnchor="middle" letterSpacing="1">
              SICONIA
            </text>
            <circle cx="110" cy="11" r="2" fill="#334155" />

            {/* Bouton poussoir vert avec cercle jaune (défilement écran) */}
            <circle cx="28" cy="54" r="7.5" fill="#22c55e" stroke="#eab308" strokeWidth="1.5" />
            <circle cx="28" cy="54" r="5" fill="#4ade80" />

            {/* Hublot optique supérieur droit (port de lecture optique) */}
            <circle cx="206" cy="30" r="14" fill="#334155" stroke="#1e293b" strokeWidth="1.5" />
            <circle cx="206" cy="30" r="8.5" fill="#0f172a" />
            <circle cx="206" cy="30" r="4" fill="#020617" />
            <circle cx="204" cy="28" r="1.2" fill="#ffffff" opacity="0.6" />

            {/* Voyants métrologiques kWh et kvarh */}
            <g transform="translate(178, 48)">
              <circle
                cx="6"
                cy="6"
                r="2.8"
                fill={loadActive ? '#ef4444' : '#475569'}
                stroke={loadActive ? '#dc2626' : '#334155'}
                strokeWidth="0.8"
                className={loadActive ? 'animate-ping' : ''}
              />
              <circle cx="6" cy="6" r="2.2" fill={loadActive ? '#ef4444' : '#475569'} />
              <text x="6" y="14" fill="#475569" fontSize="4" fontWeight="bold" textAnchor="middle">kWh (B)</text>

              <circle cx="28" cy="6" r="2.8" fill="#475569" stroke="#334155" strokeWidth="0.8" />
              <text x="28" y="14" fill="#475569" fontSize="4" fontWeight="bold" textAnchor="middle">kvarh (2)</text>
            </g>

            {/* Marque Sagemcom */}
            <g transform="translate(178, 68)">
              <text x="0" y="7" fill="#0f172a" fontSize="6.5" fontWeight="bold">Sagemcom</text>
              <text x="0" y="13" fill="#64748b" fontSize="4">FRANCE</text>
            </g>

            {/* Écran Digital LCD rétro-éclairé au centre */}
            <g transform="translate(56, 25)">
              <rect x="0" y="0" width="98" height="46" rx="3" fill="#022c22" stroke="#065f46" strokeWidth="1.2" />
              <rect x="1.5" y="1.5" width="95" height="43" rx="2" fill="#064e3b" />
              
              {/* Filigrane discret LCD : Client : Boularabi Amine */}
              <text
                x="5"
                y="8"
                fill="#a7f3d0"
                opacity="0.3"
                fontSize="4.8"
                fontWeight="500"
                fontFamily="monospace"
                letterSpacing="0.2"
              >
                client : boularabi amine
              </text>

              {/* Ligne 1 : Phases & Réseau */}
              <text x="5" y="16.5" fill="#a7f3d0" fontSize="5" fontFamily="monospace">
                3x230/400V [L1][L2][L3] LTE NB2
              </text>
              
              {/* Ligne 2 : Tarif actif HC/HP */}
              <text x="5" y="25" fill="#34d399" fontSize="5.5" fontWeight="bold" fontFamily="monospace">
                {loadActive
                  ? '1.8.2 HC (Chauffe-eau 2.0 kW)'
                  : isHCActiveNow
                    ? '1.8.2 HC (Veille)'
                    : '1.8.1 HP (Veille)'}
              </text>

              {/* Ligne 3 : Index d'énergie avec compteur tournant dynamique (kWh) */}
              <g transform="translate(5, 33.5)">
                <text fill="#ffffff" fontSize="6.5" fontWeight="bold" fontFamily="monospace">
                  {loadActive || isHCActiveNow
                    ? `1.8.2 HC : ${kwhHCIndex.toFixed(2).padStart(8, '0')} kWh`
                    : `1.8.1 HP : ${kwhHPIndex.toFixed(2).padStart(8, '0')} kWh`}
                </text>
                {loadActive && (
                  <g transform="translate(73, -1)">
                    <circle cx="2" cy="-2" r="2" fill="#34d399" className="animate-ping" />
                    <text x="0" y="0" fill="#34d399" fontSize="5" fontWeight="bold">▶</text>
                  </g>
                )}
              </g>

              {/* Ligne 4 : Puissance instantanée (2.00 kW pendant la consommation) */}
              <text x="5" y="41" fill={loadActive ? '#fef08a' : '#6ee7b7'} fontSize="6" fontWeight="bold" fontFamily="monospace">
                {loadActive ? 'P_inst : 2.00 kW' : 'P_inst : 0.00 kW'}
              </text>
            </g>

            {/* Ligne de séparation médiane du capot */}
            <line x1="0" y1="84" x2="235" y2="84" stroke="#cbd5e1" strokeWidth="1" />

            {/* Scellé central avec pastille verte plombée */}
            <g transform="translate(110, 84)">
              <circle cx="0" cy="0" r="7" fill="#f1f5f9" stroke="#94a3b8" strokeWidth="1" />
              <circle cx="0" cy="0" r="2.5" fill="#64748b" />
              <path d="M -3 2 Q 0 7 3 2" fill="none" stroke="#eab308" strokeWidth="1.2" />
              <rect x="-3.5" y="5" width="7" height="9" rx="2" fill="#10b981" stroke="#059669" strokeWidth="0.8" />
            </g>

            {/* Données techniques sous l'écran */}
            <g transform="translate(14, 92)">
              <text x="0" y="6" fill="#64748b" fontSize="4.5">3 x 230/400 V ~ 50Hz</text>
              <text x="0" y="12" fill="#475569" fontSize="4.5" fontWeight="semibold">0.25 - 5 (100) A</text>
              <text x="0" y="18" fill="#64748b" fontSize="4">Cl. B / IP54  OVC III</text>
            </g>

            {/* QR Code à droite */}
            <g transform="translate(182, 88)">
              <rect x="0" y="0" width="20" height="20" fill="#ffffff" stroke="#0f172a" strokeWidth="0.8" />
              <rect x="2" y="2" width="6" height="6" fill="#0f172a" />
              <rect x="12" y="2" width="6" height="6" fill="#0f172a" />
              <rect x="2" y="12" width="6" height="6" fill="#0f172a" />
              <rect x="9" y="9" width="3" height="3" fill="#0f172a" />
            </g>

            {/* Trappe vert-anis sur le quart inférieur gauche (fidèle à la photo) */}
            <g transform="translate(4, 114)">
              <rect
                x="0"
                y="0"
                width="46"
                height="45"
                rx="3"
                fill="#84cc16"
                stroke="#65a30d"
                strokeWidth="1.2"
                className="drop-shadow-xs"
              />
              <rect x="12" y="-2" width="20" height="3" rx="1" fill="#65a30d" />
              <rect x="11" y="26" width="16" height="10" rx="1.5" fill="#4d7c0f" />
              <rect x="33" y="29" width="6" height="2.5" fill="#15803d" />
            </g>

            <text x="135" y="127" fill="#334155" fontSize="6.5" fontWeight="bold" textAnchor="middle">
              COMPTEUR SICONIA XT211
            </text>

            {/* ============================================================ */}
            {/* BORNIER DE SORTIE EN DESSOUS DU COMPTEUR */}
            {/* Alignement parfait au pixel près avec les contacts du contacteur : */}
            {/* Borne 2 (L1) = x: 55 (abs 530) */}
            {/* Borne 4 (L2) = x: 95 (abs 570) */}
            {/* Borne 6 (L3) = x: 135 (abs 610) */}
            {/* Borne 8 (N)  = x: 175 (abs 650) */}
            {/* ============================================================ */}
            <rect x="35" y="160" width="165" height="18" rx="3" fill="#0f172a" stroke="#334155" strokeWidth="1" />

            {/* Borne 2 : Sortie Phase L1 */}
            <circle cx="55" cy="169" r="4.5" fill="#ea580c" stroke="#ffffff" strokeWidth="1.2" />
            <text x="55" y="166" fill="#ffffff" fontSize="4.5" fontWeight="bold" textAnchor="middle">2</text>
            <text x="55" y="156" fill="#ea580c" fontSize="5" fontWeight="bold" textAnchor="middle">L1</text>

            {/* Borne 4 : Sortie Phase L2 */}
            <circle cx="95" cy="169" r="4.5" fill="#0f172a" stroke="#ffffff" strokeWidth="1.2" />
            <text x="95" y="166" fill="#ffffff" fontSize="4.5" fontWeight="bold" textAnchor="middle">4</text>
            <text x="95" y="156" fill="#334155" fontSize="5" fontWeight="bold" textAnchor="middle">L2</text>

            {/* Borne 6 : Sortie Phase L3 */}
            <circle cx="135" cy="169" r="4.5" fill="#475569" stroke="#ffffff" strokeWidth="1.2" />
            <text x="135" y="166" fill="#ffffff" fontSize="4.5" fontWeight="bold" textAnchor="middle">6</text>
            <text x="135" y="156" fill="#475569" fontSize="5" fontWeight="bold" textAnchor="middle">L3</text>

            {/* Borne 8 : Sortie Neutre N (Bleu) */}
            <circle cx="175" cy="169" r="4.5" fill="#2563eb" stroke="#ffffff" strokeWidth="1.2" />
            <text x="175" y="166" fill="#ffffff" fontSize="4.5" fontWeight="bold" textAnchor="middle">8</text>
            <text x="175" y="156" fill="#2563eb" fontSize="5" fontWeight="bold" textAnchor="middle">N</text>
          </g>

          {/* ============================================================ */}
          {/* CONDUCTEURS DE SORTIE DU COMPTEUR DIRECTS ("EN DROIT") */}
          {/* L1 -> Contact 1 Contacteur (530) */}
          {/* L2 -> Contact 3 Contacteur (570) */}
          {/* L3 -> Contact 5 Contacteur (610) */}
          {/* Neutre N -> TOUT DROIT VERS LE CHAUFFE-EAU (650) */}
          {/* ============================================================ */}
          <g id="compteur-sorties-en-droit">
            {/* L1 : Sortie 2 Compteur (530, 190) -> Contact 1 Contacteur (530, 230) */}
            <path
              id="fil-compteur2-vers-contact1"
              d="M 530 190 L 530 230"
              fill="none"
              stroke={phase1Active ? '#ea580c' : '#cbd5e1'}
              strokeWidth="3.5"
              strokeLinecap="round"
            />
            {phase1Active && (
              <path
                d="M 530 190 L 530 230"
                fill="none"
                stroke="#ffedd5"
                strokeWidth={loadActive ? '2.5' : '1.5'}
                strokeDasharray="6,6"
                className={loadActive ? 'fast-flow-wire' : 'flow-wire'}
              />
            )}

            {/* L2 : Sortie 4 Compteur (570, 190) -> Contact 3 Contacteur (570, 230) */}
            <path
              id="fil-compteur4-vers-contact3"
              d="M 570 190 L 570 230"
              fill="none"
              stroke={phase2Active ? '#0f172a' : '#cbd5e1'}
              strokeWidth="3.5"
              strokeLinecap="round"
            />
            {phase2Active && (
              <path
                d="M 570 190 L 570 230"
                fill="none"
                stroke="#94a3b8"
                strokeWidth={loadActive ? '2' : '1.5'}
                strokeDasharray="6,6"
                className={loadActive ? 'fast-flow-wire' : 'flow-wire'}
              />
            )}

            {/* L3 : Sortie 6 Compteur (610, 190) -> Contact 5 Contacteur (610, 230) */}
            <path
              id="fil-compteur6-vers-contact5"
              d="M 610 190 L 610 230"
              fill="none"
              stroke={phase3Active ? '#475569' : '#cbd5e1'}
              strokeWidth="3.5"
              strokeLinecap="round"
            />
            {phase3Active && (
              <path
                d="M 610 190 L 610 230"
                fill="none"
                stroke="#cbd5e1"
                strokeWidth={loadActive ? '2' : '1.5'}
                strokeDasharray="6,6"
                className={loadActive ? 'fast-flow-wire' : 'flow-wire'}
              />
            )}

            {/* NEUTRE N : Sortie 8 Compteur (650, 190) -> TOUT DROIT VERS CHAUFFE-EAU (650, 480) */}
            {/* Traverse librement l'espace sans croiser les contacts du contacteur */}
            <path
              id="fil-neutre-compteur8-vers-chauffe-eau"
              d="M 650 190 L 650 395"
              fill="none"
              stroke={neutralActive ? '#2563eb' : '#93c5fd'}
              strokeWidth="3.5"
              strokeLinecap="round"
            />
            {neutralActive && (
              <g id="flow-electrons-neutre-chauffe-eau">
                <path
                  d="M 650 190 L 650 395"
                  fill="none"
                  stroke="#38bdf8"
                  strokeWidth={loadActive ? '2.5' : '2'}
                  strokeDasharray="5,5"
                  className={loadActive ? 'fast-flow-wire' : 'flow-wire'}
                  filter="url(#glow-blue)"
                />
                {/* Flèches de circulation des électrons du neutre */}
                <path d="M 647.5 250 L 650 256 L 652.5 250" fill="none" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" />
                <path d="M 647.5 320 L 650 326 L 652.5 320" fill="none" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" />
              </g>
            )}
            <circle cx="650" cy="190" r="4.5" fill="#2563eb" stroke="#ffffff" strokeWidth="1.5" />
            <circle cx="650" cy="395" r="4.5" fill="#2563eb" stroke="#1d4ed8" strokeWidth="1.5" />
          </g>

          {/* ============================================================ */}
          {/* 4. CONTACTOR ENCLOSURE & ACCROCHEUR MÉCANIQUE */}
          {/* ============================================================ */}
          <g id="contactor-enclosure">
            <rect
              x="430"
              y="208"
              width="405"
              height="98"
              rx="8"
              fill="none"
              stroke="#64748b"
              strokeWidth="2"
              strokeDasharray="6,4"
            />

            <line
              x1="718"
              y1="208"
              x2="718"
              y2="306"
              stroke="#f59e0b"
              strokeWidth="1.5"
              strokeDasharray="4,4"
            />

            {/* Coil A1 - A2 */}
            <g id="coil-A1-A2" transform="translate(445, 240)">
              <rect
                x="0"
                y="0"
                width="28"
                height="40"
                rx="4"
                fill={contactor.mainCoilActive ? '#ea580c' : '#fff7ed'}
                stroke="#ea580c"
                strokeWidth="2"
              />
              <line x1="0" y1="40" x2="28" y2="0" stroke={contactor.mainCoilActive ? '#ffffff' : '#ea580c'} strokeWidth="1.5" />
              <text x="14" y="-4" fill="#ea580c" textAnchor="middle" fontSize="10" fontWeight="bold">
                A1
              </text>
              <text x="14" y="52" fill="#2563eb" textAnchor="middle" fontSize="10" fontWeight="bold">
                A2
              </text>
              {contactor.mainCoilActive && (
                <circle cx="14" cy="20" r="8" fill="#f97316" filter="url(#glow-orange)" opacity="0.6" />
              )}
            </g>

            {/* Power Contact Poles 1-2, 3-4, 5-6 (Alignés directement avec sorties 2, 4, 6 du compteur) */}
            {[
              { inNum: '1', outNum: '2', x: 530, color: '#ea580c' },
              { inNum: '3', outNum: '4', x: 570, color: '#0f172a' },
              { inNum: '5', outNum: '6', x: 610, color: '#475569' },
            ].map((pole) => (
              <g key={pole.inNum} id={`pole-${pole.inNum}-${pole.outNum}`}>
                <circle cx={pole.x} cy="230" r="3.5" fill={pole.color} />
                <text x={pole.x - 7} y="228" fill="#334155" fontSize="9" fontWeight="bold">
                  {pole.inNum}
                </text>

                <circle cx={pole.x} cy="285" r="3.5" fill={pole.color} />
                <text x={pole.x - 7} y="296" fill="#334155" fontSize="9" fontWeight="bold">
                  {pole.outNum}
                </text>

                <line
                  x1={pole.x}
                  y1="230"
                  x2={contactor.contactsClosed ? pole.x : pole.x - 10}
                  y2={contactor.contactsClosed ? '285' : '275'}
                  stroke={pole.color}
                  strokeWidth="3"
                  strokeLinecap="round"
                />

                {contactor.contactsClosed && (
                  <circle cx={pole.x} cy="257" r="2.5" fill="#16a34a" />
                )}
              </g>
            ))}

            {/* Auxiliary Contact 13 - 14 NO avec deux crochets qui s'accrochent l'un à l'autre */}
            <g id="aux-contact-13-14">
              <circle cx="695" cy="230" r="4.5" fill="#ea580c" stroke="#9a3412" strokeWidth="1.5" />
              <text x="680" y="228" fill="#c2410c" fontSize="9" fontWeight="bold">13</text>

              <circle cx="695" cy="260" r="4.5" fill="#ea580c" stroke="#9a3412" strokeWidth="1.5" />
              <text x="680" y="272" fill="#c2410c" fontSize="9" fontWeight="bold">14</text>

              {/* Lame de contact de l'interrupteur 13-14 */}
              <line
                x1="695"
                y1="230"
                x2={contactor.auxContactClosed ? '695' : '688'}
                y2={contactor.auxContactClosed ? '260' : '255'}
                stroke={contactor.auxContactClosed ? '#ea580c' : '#64748b'}
                strokeWidth="2.5"
                strokeLinecap="round"
              />

              {/* Système des deux crochets qui s'agrippent l'un à l'autre */}
              <g id="crochets-accrochage-13-14">
                {contactor.mechanicallyLatched || contactor.auxContactClosed ? (
                  // Position fermée : LES DEUX CROCHETS S'EMBOÎTENT ET SE TIENNENT MUTUELLEMENT
                  <g>
                    {/* Crochet 1 (solidaire de la lame 13-14 / contact) : pointe vers la droite */}
                    <path
                      d="M 695 245 L 700 245 L 700 240 L 696 240"
                      fill="none"
                      stroke="#ea580c"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <circle cx="696" cy="240" r="2" fill="#ea580c" />

                    {/* Crochet 2 (inversé, venant du verrouillage / loquet mécanique) : pointe vers la gauche et emprisonne le crochet 1 */}
                    <path
                      d="M 711 245 L 698 245 L 698 238 L 702 238"
                      fill="none"
                      stroke="#d97706"
                      strokeWidth="2.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <circle cx="702" cy="238" r="2" fill="#16a34a" />
                    <circle cx="711" cy="245" r="3" fill="#d97706" />

                    <text x="704" y="222" fill="#d97706" fontSize="6.5" fontWeight="bold" textAnchor="middle">
                      Crochets verrouillés
                    </text>
                  </g>
                ) : (
                  // Position ouverte : LES DEUX CROCHETS SONT DÉGAGÉS ET SE LÂCHENT
                  <g>
                    {/* Crochet 1 (sur la lame ouverte 13-14) : écarté vers la gauche */}
                    <path
                      d="M 688 243 L 693 243 L 693 238 L 690 238"
                      fill="none"
                      stroke="#94a3b8"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />

                    {/* Crochet 2 (loquet libre relevé) : décroché et relâché */}
                    <path
                      d="M 711 245 L 701 235 L 697 238"
                      fill="none"
                      stroke="#64748b"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <circle cx="711" cy="245" r="3" fill="#94a3b8" />

                    <text x="704" y="222" fill="#64748b" fontSize="6.5" fontWeight="bold" textAnchor="middle">
                      Crochets relâchés
                    </text>
                  </g>
                )}
              </g>
            </g>

            {/* Mechanical Linkage Bar */}
            <line
              x1="475"
              y1="257"
              x2="785"
              y2="257"
              stroke="#d97706"
              strokeWidth="2"
              strokeDasharray="4,3"
            />
            <text x="500" y="253" fill="#b45309" fontSize="8" fontWeight="bold">
              Liaison mécanique
            </text>

            {/* Accrocheur Mécanique Section */}
            <g id="latch-subassembly">
              <rect
                x="733"
                y="240"
                width="24"
                height="38"
                rx="4"
                fill={contactor.releaseCoilActive ? '#ef4444' : '#fee2e2'}
                stroke="#dc2626"
                strokeWidth="1.5"
              />
              <line x1="733" y1="278" x2="757" y2="240" stroke="#dc2626" strokeWidth="1.2" />
              <circle cx="745" cy="240" r="4.5" fill="#ea580c" stroke="#9a3412" strokeWidth="1.5" />
              <text x="733" y="235" fill="#c2410c" fontSize="10" fontWeight="bold">E1</text>
              <circle cx="745" cy="278" r="5" fill="#2563eb" stroke="#1d4ed8" strokeWidth="1.5" />
              <text x="758" y="285" fill="#1d4ed8" fontSize="11" fontWeight="bold">E2</text>
              {contactor.releaseCoilActive && (
                <circle cx="745" cy="259" r="6" fill="#ef4444" filter="url(#glow-red)" opacity="0.6" />
              )}

              {/* Contacts de l'Accrocheur Mécanique (Bornes 5 - 6) */}
              <g id="latch-aux-contacts">
                <circle cx="765" cy="225" r="2.5" fill="#94a3b8" />
                <circle cx="765" cy="285" r="2.5" fill="#94a3b8" />
                <line x1="765" y1="225" x2={contactor.contactsClosed ? '765' : '758'} y2={contactor.contactsClosed ? '285' : '280'} stroke="#94a3b8" strokeWidth="1.5" />
                <text x="757" y="222" fill="#64748b" fontSize="7">3</text>
                <text x="757" y="295" fill="#64748b" fontSize="7">4</text>

                {/* Borne 5 */}
                <circle cx="785" cy="225" r="5" fill="#ea580c" stroke="#9a3412" strokeWidth="1.5" />
                <text x="773" y="222" fill="#c2410c" fontSize="11" fontWeight="bold">5</text>

                {/* Borne 6 */}
                <circle cx="785" cy="285" r="5" fill="#dc2626" stroke="#991b1b" strokeWidth="1.5" />
                <text x="773" y="298" fill="#b91c1c" fontSize="11" fontWeight="bold">6</text>

                <line
                  x1="785"
                  y1="225"
                  x2={contactor.mechanicallyLatched ? '775' : '785'}
                  y2={contactor.mechanicallyLatched ? '278' : '285'}
                  stroke="#ea580c"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
                <text
                  x="793"
                  y="256"
                  fill={contactor.mechanicallyLatched ? '#dc2626' : '#16a34a'}
                  fontSize="7.5"
                  fontWeight="bold"
                >
                  {contactor.mechanicallyLatched ? '5-6 OUVERT' : '5-6 FERMÉ'}
                </text>
              </g>

              {/* Physical Latch Pawl */}
              <g id="latch-pawl-graphic" transform="translate(712, 245)">
                <circle cx="0" cy="0" r="3.5" fill="#d97706" />
                {contactor.mechanicallyLatched ? (
                  <g>
                    <path
                      d="M 0 0 L 15 0 L 15 15 L 10 15"
                      fill="none"
                      stroke="#d97706"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
                    <circle cx="10" cy="15" r="2.5" fill="#16a34a" />
                    <text x="22" y="10" fill="#15803d" fontSize="8" fontWeight="bold">VERROUILLÉ</text>
                  </g>
                ) : (
                  <g>
                    <path
                      d="M 0 0 L 12 -8 L 18 -4"
                      fill="none"
                      stroke="#64748b"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                  </g>
                )}
              </g>
            </g>
          </g>

          {/* ============================================================ */}
          {/* 5. LOAD FEED: VERS CLIENT (Chauffage) */}
          {/* ============================================================ */}
          <g id="client-load-section">
            {/* L1 vers chauffe-eau */}
            <path
              d="M 530 285 L 530 395"
              fill="none"
              stroke={loadActive ? '#ea580c' : '#cbd5e1'}
              strokeWidth="3.5"
            />
            {loadActive && (
              <path
                d="M 530 285 L 530 395"
                fill="none"
                stroke="#ffedd5"
                strokeWidth="2"
                strokeDasharray="6,6"
                className="fast-flow-wire"
              />
            )}

            {/* L2 vers chauffe-eau */}
            <path
              d="M 570 285 L 570 395"
              fill="none"
              stroke={loadActive ? '#0f172a' : '#cbd5e1'}
              strokeWidth="3"
            />
            {loadActive && (
              <path
                d="M 570 285 L 570 395"
                fill="none"
                stroke="#94a3b8"
                strokeWidth="1.5"
                strokeDasharray="6,6"
                className="fast-flow-wire"
              />
            )}

            {/* L3 vers chauffe-eau */}
            <path
              d="M 610 285 L 610 395"
              fill="none"
              stroke={loadActive ? '#475569' : '#cbd5e1'}
              strokeWidth="3"
            />
            {loadActive && (
              <path
                d="M 610 285 L 610 395"
                fill="none"
                stroke="#cbd5e1"
                strokeWidth="1.5"
                strokeDasharray="6,6"
                className="fast-flow-wire"
              />
            )}

            {/* Pastilles des 4 conducteurs arrivant en droit sur le haut du chauffe-eau : L1, L2, L3, N */}
            <circle cx="530" cy="395" r="4.5" fill="#ea580c" stroke="#ffffff" strokeWidth="1.5" />
            <circle cx="570" cy="395" r="4.5" fill="#0f172a" stroke="#ffffff" strokeWidth="1.5" />
            <circle cx="610" cy="395" r="4.5" fill="#475569" stroke="#ffffff" strokeWidth="1.5" />
            <circle cx="650" cy="395" r="4.5" fill="#2563eb" stroke="#ffffff" strokeWidth="1.5" />

            {/* Chauffe-eau électrique noir design avec affichage digital LED (Quality Heating) */}
            <g transform="translate(522, 395)" id="water-heater-load">
              <defs>
                {/* Dégradé métallique / cylindrique du ballon noir */}
                <linearGradient id="boilerGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#1e293b" />
                  <stop offset="25%" stopColor="#0f172a" />
                  <stop offset="60%" stopColor="#020617" />
                  <stop offset="85%" stopColor="#1e293b" />
                  <stop offset="100%" stopColor="#090d16" />
                </linearGradient>

                {/* Reflet lumineux sur la façade courbée */}
                <linearGradient id="boilerSheen" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#ffffff" stopOpacity="0.08" />
                  <stop offset="40%" stopColor="#ffffff" stopOpacity="0.25" />
                  <stop offset="70%" stopColor="#ffffff" stopOpacity="0" />
                </linearGradient>
              </defs>

              {/* Corps cylindrique principal du chauffe-eau noir arrondi */}
              <rect
                x="0"
                y="0"
                width="135"
                height="195"
                rx="24"
                fill="url(#boilerGradient)"
                stroke={loadActive ? '#ea580c' : '#334155'}
                strokeWidth={loadActive ? '2.5' : '1.5'}
                filter="drop-shadow(0 6px 12px rgba(0, 0, 0, 0.35))"
              />

              {/* Reflet spéculaire courbé sur le flanc */}
              <rect
                x="14"
                y="4"
                width="24"
                height="187"
                rx="12"
                fill="url(#boilerSheen)"
              />

              {/* Étiquette d'efficacité énergétique verte (Classe B comme sur la photo) */}
              <g transform="translate(6, 75)">
                <rect x="0" y="0" width="16" height="12" rx="2" fill="#16a34a" />
                <text x="8" y="9" fill="#ffffff" fontSize="8" fontWeight="black" textAnchor="middle">B</text>
                {/* Barres d'énergie empilées colorées */}
                <rect x="0" y="14" width="14" height="2.5" fill="#15803d" rx="0.5" />
                <rect x="0" y="17.5" width="17" height="2.5" fill="#22c55e" rx="0.5" />
                <rect x="0" y="21" width="20" height="2.5" fill="#eab308" rx="0.5" />
                <rect x="0" y="24.5" width="23" height="2.5" fill="#f97316" rx="0.5" />
                <rect x="0" y="28" width="26" height="2.5" fill="#ef4444" rx="0.5" />
              </g>

              {/* Logo / Marque en lettres élégantes */}
              <text
                x="67"
                y="54"
                fill="#cbd5e1"
                fontSize="8.5"
                fontFamily="serif"
                fontWeight="500"
                textAnchor="middle"
                letterSpacing="0.5"
                opacity="0.85"
              >
                Quality Heating
              </text>
              <text
                x="67"
                y="65"
                fill="#94a3b8"
                fontSize="6"
                fontFamily="sans-serif"
                fontWeight="bold"
                textAnchor="middle"
                letterSpacing="0.3"
              >
                2000 W • 2 kW
              </text>

              {/* Panneau de contrôle noir encastré en bas */}
              <rect
                x="45"
                y="110"
                width="44"
                height="68"
                rx="6"
                fill="#090d16"
                stroke="#1e293b"
                strokeWidth="1.5"
              />

              {/* Écran Digital LED 7 segments */}
              <rect
                x="50"
                y="116"
                width="34"
                height="22"
                rx="3"
                fill="#020617"
                stroke="#334155"
                strokeWidth="0.8"
              />
              <text
                x="67"
                y="132"
                fill={loadActive ? '#ef4444' : '#475569'}
                fontSize="14"
                fontWeight="black"
                fontFamily="monospace"
                textAnchor="middle"
                style={{ filter: loadActive ? 'drop-shadow(0 0 4px #ef4444)' : 'none' }}
              >
                {boilerTemp}°
              </text>
              <text x="67" y="137" fill="#64748b" fontSize="4.5" textAnchor="middle">
                TEMPERATURE
              </text>

              {/* Bouton rotatif moleté supérieur (Thermostat) */}
              <g transform="translate(67, 148)">
                <circle cx="0" cy="0" r="8" fill="#1e293b" stroke="#475569" strokeWidth="1" />
                <circle cx="0" cy="0" r="6" fill="#0f172a" />
                <line x1="0" y1="-2" x2="0" y2="-6" stroke={loadActive ? '#ef4444' : '#94a3b8'} strokeWidth="1.5" strokeLinecap="round" />
              </g>

              {/* Bouton rotatif moleté inférieur (Mode / Puissance) */}
              <g transform="translate(67, 168)">
                <circle cx="0" cy="0" r="8" fill="#1e293b" stroke="#475569" strokeWidth="1" />
                <circle cx="0" cy="0" r="6" fill="#0f172a" />
                <line x1="-3" y1="3" x2="-5" y2="5" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" />
              </g>

              {/* Ondes de chaleur / vapeur d'eau chaude lorsque le chauffe-eau est alimenté */}
              {loadActive && (
                <g opacity="0.85" transform="translate(0, -18)">
                  <path d="M 45 12 Q 52 4 45 -4" stroke="#f97316" strokeWidth="2" fill="none" strokeLinecap="round" className="animate-pulse" />
                  <path d="M 67 12 Q 74 4 67 -4" stroke="#ef4444" strokeWidth="2.2" fill="none" strokeLinecap="round" className="animate-pulse" />
                  <path d="M 89 12 Q 96 4 89 -4" stroke="#f97316" strokeWidth="2" fill="none" strokeLinecap="round" className="animate-pulse" />
                </g>
              )}
            </g>
          </g>
        </svg>
      </div>
    </div>
  );
};
