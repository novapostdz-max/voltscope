/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  Zap,
  Gauge,
  ShieldAlert,
  ShieldCheck,
  Building,
  Home,
  Flame,
  Power,
  Activity,
  Lightbulb,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Info,
  Calculator,
  Scale,
  Shuffle,
} from 'lucide-react';
import {
  SmartMeterState,
  NetworkType,
  isClientSinglePhase,
  getClientWiringInfo,
} from './SmartMeter';

interface SmartMeterExplanationProps {
  state: SmartMeterState;
  onSelectTopic?: (topic: string) => void;
}

export const SmartMeterExplanation: React.FC<SmartMeterExplanationProps> = ({
  state,
  onSelectTopic,
}) => {
  const sqrt3 = Math.sqrt(3);

  // Réseau actuellement actif (uniquement celui approprié à la configuration courante)
  const currentNetworkTopic =
    state.networkType === 'mono_230'
      ? 'network_mono_230'
      : state.networkType === 'tri_230'
      ? 'network_tri_230'
      : 'network_tri_400';

  // Si le sujet actif était un autre réseau que celui sélectionné, on bascule automatiquement sur le réseau actif
  let activeTopic = state.activeTopic || currentNetworkTopic;
  if (activeTopic.startsWith('network_') && activeTopic !== currentNetworkTopic) {
    activeTopic = currentNetworkTopic;
  }

  // Calculs électriques dynamiques selon le calibre et réseau actuels
  const ratingA = state.breakerRating;
  const upstreamA = state.upstreamBreakerRating;
  const cosPhi = state.cosPhi || 0.95;
  const isSingle = isClientSinglePhase(state.buildingType, state.networkType);
  const wiringInfo = getClientWiringInfo(state.buildingType, state.networkType);

  // Puissances maximales théoriques selon chaque réseau pour le calibre actuel
  const pMaxTri230KW = (sqrt3 * 230 * ratingA) / 1000;
  const pMaxTri400KW = (sqrt3 * 400 * ratingA) / 1000;
  const pMaxMono230KW = (230 * ratingA) / 1000;

  // Puissance maximale exploitable actuelle selon la configuration active
  let currentPMaxKW = 0;
  if (isSingle) {
    currentPMaxKW = pMaxMono230KW;
  } else if (state.networkType === 'tri_230') {
    currentPMaxKW = pMaxTri230KW;
  } else {
    currentPMaxKW = pMaxTri400KW;
  }

  // Courants de phase réels (prenant en compte le mode équilibré / déséquilibré)
  let i1 = 0;
  let i2 = 0;
  let i3 = 0;
  let iN = 0;
  let iMax = 0;

  if (isSingle) {
    i1 = state.powerW / (230 * cosPhi);
    iMax = i1;
    iN = i1;
  } else if (state.networkType === 'tri_230') {
    if (state.isBalanced) {
      i1 = state.powerW / (sqrt3 * 230 * cosPhi);
      i2 = i1;
      i3 = i1;
      iMax = i1;
    } else {
      const i12 = (state.powerL1 || 0) / (230 * cosPhi);
      const i23 = (state.powerL2 || 0) / (230 * cosPhi);
      const i31 = (state.powerL3 || 0) / (230 * cosPhi);
      i1 = Math.sqrt(i12 * i12 + i31 * i31 + i12 * i31);
      i2 = Math.sqrt(i23 * i23 + i12 * i12 + i23 * i12);
      i3 = Math.sqrt(i31 * i31 + i23 * i23 + i31 * i23);
      iMax = Math.max(i1, i2, i3);
    }
  } else {
    // 3x400V+N
    if (state.isBalanced) {
      i1 = state.powerW / (sqrt3 * 400 * cosPhi);
      i2 = i1;
      i3 = i1;
      iMax = i1;
    } else {
      i1 = (state.powerL1 || 0) / (230 * cosPhi);
      i2 = (state.powerL2 || 0) / (230 * cosPhi);
      i3 = (state.powerL3 || 0) / (230 * cosPhi);
      iMax = Math.max(i1, i2, i3);
      const valN = i1 * i1 + i2 * i2 + i3 * i3 - (i1 * i2 + i2 * i3 + i3 * i1);
      iN = Math.sqrt(Math.max(0, valN));
    }
  }

  // Courant actuel appelé par phase dimensionnant pour la charge en cours
  const currentA = iMax;

  const loadPercent = Math.min(150, (state.powerW / (currentPMaxKW * 1000)) * 100);
  const loadRatio = ratingA > 0 ? currentA / ratingA : 0;

  // Élément de topic réseau actif unique (aucun autre réseau affiché ni sélectionnable)
  const networkTopicItem =
    state.networkType === 'mono_230'
      ? { id: 'network_mono_230', label: 'Réseau 1×230V', sub: 'Monophasé' }
      : state.networkType === 'tri_230'
      ? { id: 'network_tri_230', label: 'Réseau 3×230V', sub: 'Sans Neutre' }
      : { id: 'network_tri_400', label: 'Réseau 3×400V+N', sub: 'Tétraphasé' };

  // Liste des thèmes rapides cliquables : UNIQUEMENT les paramètres appropriés à la sélection courante
  const quickTopics = [
    networkTopicItem,
    {
      id: 'client_output',
      label: 'Départ Client',
      sub: isSingle ? '1 Phase' : '3 Phases',
    },
    {
      id: 'power_active',
      label: isSingle ? 'Phase L1' : 'Phases L1 L2 L3',
      sub: `${currentA.toFixed(1)}A`,
    },
    { id: 'breaker_rating', label: `Breaker ${ratingA}A`, sub: 'Interne' },
    { id: 'upstream_breaker', label: `Disj. ${upstreamA}A`, sub: 'Amont' },
    {
      id: 'cable_section',
      label: 'Surcharge & Câble',
      sub: `${currentA.toFixed(1)}A / ${ratingA}A (${(loadRatio * 100).toFixed(0)}%)`,
    },
  ];

  return (
    <div className="mt-2 pt-2 border-t-2 border-slate-300/80 bg-white/95 rounded-2xl p-2.5 sm:p-3 border border-slate-200 shadow-xs space-y-2">
      {/* 1. BARRE DE SÉLECTION COMPACTE DES THÈMES */}
      <div className="flex flex-col gap-1 border-b border-slate-100 pb-1.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[9.5px] font-black tracking-wider uppercase text-slate-700">
            <Lightbulb className="w-3 h-3 text-amber-500" />
            <span>Explication Technique & Calculs en Direct</span>
          </div>
          <span className="text-[8px] font-bold text-teal-700 bg-teal-50 border border-teal-200 px-1.5 py-0.2 rounded-full">
            Synchro en direct
          </span>
        </div>

        {/* Pilules de sélection des sujets */}
        <div className="flex flex-wrap gap-1">
          {quickTopics.map((t) => {
            const isCable = t.id === 'cable_section';
            const isActive =
              activeTopic === t.id ||
              (t.id === 'client_output' &&
                (activeTopic === 'client_full_tri' || activeTopic === 'client_reduced_mono')) ||
              (t.id === currentNetworkTopic && activeTopic.startsWith('network_'));

            // Style dynamique pour Surcharge & Câble selon la charge croissante (Bleu -> Vert -> Orange -> Rouge)
            let buttonClass = '';
            let subClass = '';
            let indicatorDot = null;

            if (isCable) {
              if (loadRatio >= 1.0) {
                // Surcharge (> 100% ou I > In) : ROUGE VIF ALARME
                buttonClass = isActive
                  ? 'bg-rose-600 text-white border-rose-700 shadow-md ring-2 ring-rose-400 animate-pulse'
                  : 'bg-rose-100 hover:bg-rose-200 text-rose-900 border-rose-400 ring-1 ring-rose-400 font-black animate-pulse';
                subClass = isActive ? 'text-rose-100 font-bold' : 'text-rose-700 font-black';
                indicatorDot = (
                  <span className="relative flex h-2 w-2 shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-600" />
                  </span>
                );
              } else if (loadRatio >= 0.8) {
                // Seuil élevé / Critique (80% - 100%) : ORANGE / AMBRE
                buttonClass = isActive
                  ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-sm ring-1 ring-amber-300 font-bold'
                  : 'bg-amber-100 hover:bg-amber-200 text-amber-950 border-amber-400 font-bold';
                subClass = isActive ? 'text-slate-900 font-bold' : 'text-amber-800 font-bold';
                indicatorDot = <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />;
              } else if (loadRatio >= 0.45) {
                // Charge normale / nominale (45% - 80%) : VERT ÉMERAUDE
                buttonClass = isActive
                  ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                  : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border-emerald-300';
                subClass = isActive ? 'text-emerald-100' : 'text-emerald-700';
                indicatorDot = <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />;
              } else {
                // Veille / Faible charge (< 45%) : BLEU
                buttonClass = isActive
                  ? 'bg-blue-600 text-white border-blue-700 shadow-xs'
                  : 'bg-blue-50 hover:bg-blue-100 text-blue-900 border-blue-300';
                subClass = isActive ? 'text-blue-100' : 'text-blue-700';
                indicatorDot = <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />;
              }
            } else {
              buttonClass = isActive
                ? 'bg-teal-700 text-white border-teal-700 shadow-xs'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200';
              subClass = isActive ? 'text-teal-100' : 'text-slate-400';
            }

            return (
              <button
                key={t.id}
                type="button"
                onClick={() => onSelectTopic && onSelectTopic(t.id)}
                className={`px-1.5 py-0.5 rounded-md text-[9px] font-bold border transition-all cursor-pointer flex items-center gap-1 ${buttonClass}`}
              >
                {indicatorDot}
                <span>{t.label}</span>
                <span className={`text-[7.5px] opacity-80 ${subClass}`}>
                  ({t.sub})
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. GRILLE 2 COLONNES ULTRA-COMPACTE SANS SCROLL */}
      
      {/* CAS A : RÉSEAU 3x230V SANS NEUTRE (UNIQUEMENT SI ACTIF) */}
      {state.networkType === 'tri_230' &&
        (activeTopic === 'network_tri_230' || activeTopic.startsWith('network_')) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-left">
          {/* COLONNE GAUCHE : Ampérage, Puissance Max et Formule */}
          <div className="space-y-1.5">
            {/* Header Réseau */}
            <div className="flex items-center justify-between bg-amber-50/80 px-2 py-1 rounded-lg border border-amber-200">
              <div className="flex items-center gap-1 text-[10px] font-black text-amber-950 uppercase">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                <span>3×230 V (Sans Neutre)</span>
              </div>
              <span className="text-[8px] font-mono font-black bg-amber-200 text-amber-900 px-1 py-0.2 rounded">
                Triangle (3P)
              </span>
            </div>

            {/* Cartouches Ampérage & Puissance Max */}
            <div className="grid grid-cols-2 gap-1.5">
              <div className="p-1.5 bg-slate-900 text-white rounded-lg shadow-xs">
                <div className="flex justify-between items-center text-[8px] uppercase tracking-wider text-teal-400 font-bold">
                  <span>Ampérage</span>
                  <Gauge className="w-3 h-3 text-teal-400" />
                </div>
                <div className="text-lg font-black font-mono leading-tight mt-0.5">
                  {ratingA} <span className="text-[10px] font-sans font-medium text-slate-300">A / ph</span>
                </div>
                <div className="text-[7.5px] text-slate-300">Limite breaker</div>
              </div>

              <div className="p-1.5 bg-gradient-to-br from-teal-700 to-emerald-800 text-white rounded-lg shadow-xs">
                <div className="flex justify-between items-center text-[8px] uppercase tracking-wider text-emerald-200 font-bold">
                  <span>P. Max Fournie</span>
                  <Zap className="w-3 h-3 text-emerald-200" />
                </div>
                <div className="text-lg font-black font-mono leading-tight mt-0.5">
                  {pMaxTri230KW.toFixed(2)} <span className="text-[10px] font-sans font-medium text-emerald-100">kW</span>
                </div>
                <div className="text-[7.5px] text-emerald-200">{pMaxTri230KW.toFixed(1)} kVA max</div>
              </div>
            </div>

            {/* Formule de calcul et déduction de l'ampérage */}
            <div className="p-1.5 bg-slate-50 rounded-lg border border-slate-200 text-[8.5px] font-mono text-slate-800 space-y-1">
              <div className="font-sans font-bold text-slate-700 text-[8px] uppercase flex justify-between">
                <span>1. Formule Puissance : P = √3 × U × I</span>
                <span className="text-amber-700 font-mono font-bold">U = 230V</span>
              </div>
              <div className="font-bold text-slate-900 bg-white px-1.5 py-0.5 rounded border border-slate-200 text-[8px]">
                1.732 × 230 V × {ratingA} A = <span className="text-amber-800 font-black">{pMaxTri230KW.toFixed(2)} kW</span>
              </div>
              <div className="font-sans font-bold text-slate-700 text-[8px] uppercase flex justify-between pt-0.5 border-t border-slate-200">
                <span>2. Comment on trouve l&apos;ampérage : I = P ÷ (√3 × U × cos φ)</span>
                <span className="text-teal-700 font-mono font-bold">cos φ = {cosPhi}</span>
              </div>
              <div className="bg-amber-50/90 p-1 rounded border border-amber-200 text-[8px] text-amber-950 space-y-0.5">
                <div>
                  Diviseur = 1.732 × 230 × {cosPhi} = <strong className="font-mono">378.5 V</strong>
                </div>
                <div>
                  I = {state.powerW} W ÷ 378.5 = <strong className="text-amber-900 font-black font-mono">{currentA.toFixed(1)} A</strong> ({loadPercent.toFixed(0)}% du calibre).
                </div>
              </div>
            </div>
          </div>

          {/* COLONNE DROITE : Comparatif et Conseils RGIE */}
          <div className="space-y-1.5">
            {/* Comparaison sous {ratingA}A */}
            <div className="space-y-0.5">
              <div className="text-[8px] font-bold uppercase text-slate-600">
                Puissance sous le même calibre de {ratingA}A :
              </div>
              <div className="grid grid-cols-3 gap-1 text-center">
                <div className="p-1 rounded-md border bg-amber-50 border-amber-300 text-amber-950">
                  <div className="text-[7.5px] font-bold uppercase text-amber-800">3×230V</div>
                  <div className="text-[11px] font-black font-mono">{pMaxTri230KW.toFixed(1)} kW</div>
                  <div className="text-[7px] text-amber-700">Actuel</div>
                </div>
                <div className="p-1 rounded-md border bg-white border-slate-200 text-slate-700">
                  <div className="text-[7.5px] font-bold uppercase text-slate-500">3×400V+N</div>
                  <div className="text-[11px] font-black font-mono text-teal-700">{pMaxTri400KW.toFixed(1)} kW</div>
                  <div className="text-[7px] text-teal-600 font-bold">+74%</div>
                </div>
                <div className="p-1 rounded-md border bg-white border-slate-200 text-slate-700">
                  <div className="text-[7.5px] font-bold uppercase text-slate-500">Mono 230V</div>
                  <div className="text-[11px] font-black font-mono text-slate-800">{pMaxMono230KW.toFixed(1)} kW</div>
                  <div className="text-[7px] text-slate-400">-42%</div>
                </div>
              </div>
            </div>

            {/* Conseils pratiques RGIE belge */}
            <div className="p-1.5 bg-amber-50/70 rounded-lg border border-amber-200 text-[8px] text-amber-950 space-y-0.5">
              <div className="font-bold flex items-center gap-1 text-amber-900">
                <Info className="w-2.5 h-2.5 text-amber-600 shrink-0" />
                Règles spécifiques au 3×230V belge :
              </div>
              <ul className="list-disc list-inside space-y-0.5 text-slate-700 pl-0.5">
                <li>Appareils 230V raccordés entre 2 phases (L1-L2, L2-L3, L3-L1).</li>
                <li>Équilibrer les circuits de la maison sur les 3 couples de phases.</li>
                <li>Bornes VE : vérifier la compatibilité 3×230V sans neutre (sinon bridée en mono 3.7 kW).</li>
              </ul>
            </div>

            {/* REMARQUE IMPORTANTE : CONSERVATION DU CHAMP TOURNANT EN SORTIE */}
            <div className="p-2 bg-amber-50/90 rounded-lg border-2 border-amber-300 text-[8px] text-amber-950 space-y-1">
              <div className="font-bold flex items-center gap-1 text-amber-900 text-[8.5px] uppercase tracking-wide">
                <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0" />
                <span>Remarque Importante :</span>
              </div>
              <p className="leading-tight text-slate-800 font-medium">
                Le champ tournant en sortie doit impérativement être conservé à l’identique. Les câbles de sortie en tête de compteur doivent rester dans le même ordre que celui existant. Toute modification de cet ordre risque de modifier le champ tournant à l’arrivée du différentiel.
              </p>
              <p className="leading-tight text-amber-900 font-mono bg-amber-100/70 p-1 rounded border border-amber-200">
                ⚡ Si l’ordre des fils de sortie doit être modifié, celui-ci doit <strong>obligatoirement</strong> être changé selon un <strong>ordre cyclique</strong>, afin de conserver le même sens du champ tournant à l’arrivée du différentiel.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* CAS B : RÉSEAU 3x400V + N (TÉTRAPHASÉ - UNIQUEMENT SI ACTIF) */}
      {state.networkType === 'tri_400' &&
        (activeTopic === 'network_tri_400' || activeTopic.startsWith('network_')) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-left">
          {/* COLONNE GAUCHE */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between bg-teal-50 px-2 py-1 rounded-lg border border-teal-200">
              <div className="flex items-center gap-1 text-[10px] font-black text-teal-950 uppercase">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse" />
                <span>3×400 V + N (Tétraphasé)</span>
              </div>
              <span className="text-[8px] font-mono font-black bg-teal-200 text-teal-900 px-1 py-0.2 rounded">
                Étoile (3P+N)
              </span>
            </div>

            <div className="grid grid-cols-2 gap-1.5">
              <div className="p-1.5 bg-slate-900 text-white rounded-lg shadow-xs">
                <div className="flex justify-between items-center text-[8px] uppercase tracking-wider text-teal-400 font-bold">
                  <span>Ampérage</span>
                  <Gauge className="w-3 h-3 text-teal-400" />
                </div>
                <div className="text-lg font-black font-mono leading-tight mt-0.5">
                  {ratingA} <span className="text-[10px] font-sans font-medium text-slate-300">A / ph</span>
                </div>
                <div className="text-[7.5px] text-slate-300">230V Ph-N • 400V Ph-Ph</div>
              </div>

              <div className="p-1.5 bg-gradient-to-br from-teal-700 to-emerald-800 text-white rounded-lg shadow-xs">
                <div className="flex justify-between items-center text-[8px] uppercase tracking-wider text-emerald-200 font-bold">
                  <span>P. Max Fournie</span>
                  <Zap className="w-3 h-3 text-emerald-200" />
                </div>
                <div className="text-lg font-black font-mono leading-tight mt-0.5">
                  {pMaxTri400KW.toFixed(2)} <span className="text-[10px] font-sans font-medium text-emerald-100">kW</span>
                </div>
                <div className="text-[7.5px] text-emerald-200">{pMaxTri400KW.toFixed(1)} kVA max</div>
              </div>
            </div>

            <div className="p-1.5 bg-slate-50 rounded-lg border border-slate-200 text-[8.5px] font-mono text-slate-800 space-y-1">
              <div className="font-sans font-bold text-slate-700 text-[8px] uppercase flex justify-between">
                <span>1. Formule Puissance : Pmax = √3 × 400V × I</span>
                <span className="text-teal-700 font-mono font-bold">3 × 230V × I</span>
              </div>
              <div className="font-bold text-slate-900 bg-white px-1.5 py-0.5 rounded border border-slate-200 text-[8px]">
                1.732 × 400 V × {ratingA} A = <span className="text-teal-700 font-black">{pMaxTri400KW.toFixed(2)} kW</span>
              </div>
              <div className="font-sans font-bold text-slate-700 text-[8px] uppercase flex justify-between pt-0.5 border-t border-slate-200">
                <span>2. Comment on trouve l&apos;ampérage : I = P_phase ÷ (230V × cos φ)</span>
                <span className="text-teal-700 font-mono font-bold">Diviseur 218.5</span>
              </div>
              <div className="bg-teal-50/90 p-1 rounded border border-teal-200 text-[8px] text-teal-950 space-y-0.5">
                {state.isBalanced ? (
                  <div>
                    P/3 = {Math.round(state.powerW / 3)} W ÷ 218.5 V ➔ <strong className="text-teal-900 font-mono font-black">I₁=I₂=I₃ = {i1.toFixed(1)} A</strong> ({loadPercent.toFixed(0)}% du calibre)
                  </div>
                ) : (
                  <div className="space-y-0.2">
                    <div>L1: {(state.powerL1 || 0)}W ÷ 218.5 = <strong className="text-teal-900">{i1.toFixed(1)}A</strong> | L2: {(state.powerL2 || 0)}W ÷ 218.5 = <strong className="text-teal-900">{i2.toFixed(1)}A</strong></div>
                    <div>L3: {(state.powerL3 || 0)}W ÷ 218.5 = <strong className="text-teal-900">{i3.toFixed(1)}A</strong> | Neutre retour IN = <strong className="text-blue-900">{iN.toFixed(1)}A</strong></div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* COLONNE DROITE */}
          <div className="space-y-1.5">
            <div className="p-2 bg-slate-50 rounded-lg border border-slate-200 space-y-1 text-[8.5px]">
              <div className="font-bold text-slate-900 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-teal-600" />
                Standard européen moderne (3P + Neutre) :
              </div>
              <p className="text-slate-600 leading-tight">
                Permet d&apos;alimenter des appareils 230V simples (Phase-Neutre) jusqu&apos;à <strong>{pMaxMono230KW.toFixed(1)} kW</strong> par phase, et des récepteurs lourds (borne VE 11 kW/22 kW, pompe à chaleur) directement en 400V triphasé.
              </p>
            </div>

            <div className="p-1.5 bg-teal-50/70 rounded-lg border border-teal-200 text-[8px] text-teal-950 space-y-0.5">
              <div className="font-bold text-teal-900">Capacité de puissance supérieure :</div>
              <p className="text-slate-600 leading-tight">
                À ampérage égal ({ratingA}A), le réseau 3×400V+N fournit <strong>+73,9% de puissance</strong> par rapport au 3×230V ({pMaxTri400KW.toFixed(1)} kW vs {pMaxTri230KW.toFixed(1)} kW).
              </p>
            </div>

            {/* REMARQUE IMPORTANTE : CONSERVATION DU CHAMP TOURNANT EN SORTIE */}
            <div className="p-2 bg-amber-50/90 rounded-lg border-2 border-amber-300 text-[8px] text-amber-950 space-y-1">
              <div className="font-bold flex items-center gap-1 text-amber-900 text-[8.5px] uppercase tracking-wide">
                <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0" />
                <span>Remarque Importante :</span>
              </div>
              <p className="leading-tight text-slate-800 font-medium">
                Le champ tournant en sortie doit impérativement être conservé à l’identique. Les câbles de sortie en tête de compteur doivent rester dans le même ordre que celui existant. Toute modification de cet ordre risque de modifier le champ tournant à l’arrivée du différentiel.
              </p>
              <p className="leading-tight text-amber-900 font-mono bg-amber-100/70 p-1 rounded border border-amber-200">
                ⚡ Si l’ordre des fils de sortie doit être modifié, celui-ci doit <strong>obligatoirement</strong> être changé selon un <strong>ordre cyclique</strong>, afin de conserver le même sens du champ tournant à l’arrivée du différentiel.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* CAS C : RÉSEAU MONOPHASÉ 1x230V (UNIQUEMENT SI ACTIF) */}
      {state.networkType === 'mono_230' &&
        (activeTopic === 'network_mono_230' || activeTopic.startsWith('network_')) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-left">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between bg-blue-50 px-2 py-1 rounded-lg border border-blue-200">
              <div className="flex items-center gap-1 text-[10px] font-black text-blue-950 uppercase">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                <span>1×230 V (Monophasé Phase + Neutre)</span>
              </div>
              <span className="text-[8px] font-mono font-black bg-blue-200 text-blue-900 px-1 py-0.2 rounded">
                {state.buildingType === 'immeuble' ? 'Max 50A (Appartement)' : 'Calibres jusqu\'à 80A (Maison)'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-1.5">
              <div className="p-1.5 bg-slate-900 text-white rounded-lg shadow-xs">
                <div className="flex justify-between items-center text-[8px] uppercase tracking-wider text-blue-400 font-bold">
                  <span>Ampérage</span>
                  <Gauge className="w-3 h-3 text-blue-400" />
                </div>
                <div className="text-lg font-black font-mono leading-tight mt-0.5">
                  {ratingA} <span className="text-[10px] font-sans font-medium text-slate-300">A</span>
                </div>
                <div className="text-[7.5px] text-slate-300">Seuil breaker</div>
              </div>

              <div className="p-1.5 bg-gradient-to-br from-blue-700 to-indigo-800 text-white rounded-lg shadow-xs">
                <div className="flex justify-between items-center text-[8px] uppercase tracking-wider text-blue-200 font-bold">
                  <span>P. Max Fournie</span>
                  <Zap className="w-3 h-3 text-blue-200" />
                </div>
                <div className="text-lg font-black font-mono leading-tight mt-0.5">
                  {pMaxMono230KW.toFixed(2)} <span className="text-[10px] font-sans font-medium text-blue-100">kW</span>
                </div>
                <div className="text-[7.5px] text-blue-200">{pMaxMono230KW.toFixed(1)} kVA</div>
              </div>
            </div>

            <div className="p-1.5 bg-slate-50 rounded-lg border border-slate-200 text-[8.5px] font-mono text-slate-800 space-y-1">
              <div className="font-sans font-bold text-slate-700 text-[8px] uppercase flex justify-between">
                <span>1. Formule Puissance : Pmax = U × I</span>
                <span className="text-blue-700 font-mono font-bold">230V</span>
              </div>
              <div className="font-bold text-slate-900 bg-white px-1.5 py-0.5 rounded border border-slate-200 text-[8px]">
                230 V × {ratingA} A = <span className="text-blue-700 font-black">{pMaxMono230KW.toFixed(2)} kW</span>
              </div>
              <div className="font-sans font-bold text-slate-700 text-[8px] uppercase flex justify-between pt-0.5 border-t border-slate-200">
                <span>2. Comment on trouve l&apos;ampérage : I = P ÷ (230V × cos φ)</span>
                <span className="text-blue-700 font-mono font-bold">Diviseur 218.5</span>
              </div>
              <div className="bg-blue-50/90 p-1 rounded border border-blue-200 text-[8px] text-blue-950">
                Charge {state.powerW} W ÷ (230 × {cosPhi}) = {state.powerW} W ÷ 218.5 V ➔ <strong className="text-blue-900 font-mono font-black">I = {i1.toFixed(1)} A</strong> ({loadPercent.toFixed(0)}% du calibre)
              </div>
            </div>
          </div>

          <div className="space-y-1.5 text-[8.5px]">
            <div className="p-2 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
              <div className="font-bold text-slate-900">
                {state.buildingType === 'immeuble'
                  ? 'Standard appartement & habitat collectif (1 phase) :'
                  : 'Raccordement maison unifamiliale 1×230V (1 phase) :'}
              </div>
              <p className="text-slate-600 leading-tight">
                2 conducteurs actifs raccordés (Phase L1 + Neutre). {state.buildingType === 'immeuble'
                  ? 'En Belgique, le calibre maximal en appartement est fixé à 50A (11,5 kW) pour garantir la sélectivité de la colonne montante.'
                  : 'En maison individuelle, la puissance monophasée peut s\'étendre jusqu\'à 80A (18,4 kW) selon la capacité de l\'amenée GRD.'}
              </p>
            </div>
            <div className="p-1.5 bg-blue-50/70 rounded-lg border border-blue-200 text-[8px] text-blue-950">
              <strong>Courant de charge actuel :</strong> I = {currentA.toFixed(1)} A pour {(state.powerW / 1000).toFixed(2)} kW.
            </div>
          </div>
        </div>
      )}

      {/* CAS D : BREAKER CONTRACTUEL */}
      {activeTopic === 'breaker_rating' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-left">
          <div className="space-y-1.5">
            <div className="p-2 bg-slate-900 text-white rounded-lg space-y-1">
              <div className="flex justify-between items-center text-[8.5px] uppercase tracking-wider text-teal-400 font-bold">
                <span>Breaker Électronique Interne</span>
                <Power className="w-3.5 h-3.5 text-teal-400" />
              </div>
              <div className="text-xl font-black font-mono text-white">
                {ratingA} A <span className="text-xs font-sans text-teal-200 font-normal">(Pmax: {currentPMaxKW.toFixed(2)} kW)</span>
              </div>
              <div className="text-[8px] text-slate-300">
                Organe de coupure et de surveillance instantanée de puissance souscrite.
              </div>
            </div>
          </div>
          <div className="space-y-1 text-[8.5px]">
            <div className="p-1.5 bg-slate-50 rounded-lg border border-slate-200 space-y-0.5">
              <strong className="text-slate-900 block">⚡ Déclenchement instantané :</strong>
              <p className="text-slate-600 leading-tight">
                Coupe sans délai si I &gt; {ratingA}A. Télé-actionnable à distance par le GRD sans changement physique du compteur.
              </p>
            </div>
            <div className="p-1.5 bg-teal-50 rounded-lg border border-teal-200 text-teal-950 text-[8px]">
              <strong>Sélectivité :</strong> Disjoncteur amont ({upstreamA}A) ≥ Breaker interne ({ratingA}A).
            </div>
          </div>
        </div>
      )}

      {/* CAS E : DISJONCTEUR AMONT 25D60 */}
      {activeTopic === 'upstream_breaker' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-left">
          <div className="space-y-1.5">
            <div className="p-2 bg-amber-950 text-white rounded-lg space-y-1">
              <div className="flex justify-between items-center text-[8.5px] uppercase tracking-wider text-amber-400 font-bold">
                <span>Disjoncteur Amont (Coffret 25D60)</span>
                <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <div className="text-xl font-black font-mono text-white">
                {upstreamA} A <span className="text-xs font-sans text-amber-200 font-normal">(Amont ≥ Breaker {ratingA}A)</span>
              </div>
              <div className="text-[8px] text-slate-300">
                Disjoncteur magnéto-thermique mécanique du gestionnaire de réseau (GRD).
              </div>
            </div>
          </div>
          <div className="space-y-1 text-[8.5px]">
            <div className="p-1.5 bg-slate-50 rounded-lg border border-slate-200 space-y-0.5">
              <strong className="text-slate-900 block">🛡️ Protection Court-Circuit (Icc) :</strong>
              <p className="text-slate-600 leading-tight">
                Déclenche par bobine magnétique en quelques millisecondes face aux courts-circuits violents (Icc &gt; 4500A) pour protéger le câble d&apos;alimentation GRD.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* CAS E2 : SURCHARGE & CÂBLAGE RGIE (BARRE MULTICOULEUR & EXVB) */}
      {activeTopic === 'cable_section' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-left">
          <div className="space-y-1.5">
            {/* Bloc Surcharge & Seuil Breaker avec fond dynamique selon la charge */}
            <div
              className={`p-2 rounded-lg space-y-1 text-white transition-colors ${
                loadRatio >= 1.0
                  ? 'bg-rose-950 border border-rose-500 shadow-sm ring-1 ring-rose-400/50'
                  : loadRatio >= 0.8
                  ? 'bg-amber-950 border border-amber-500 ring-1 ring-amber-400/40'
                  : loadRatio >= 0.45
                  ? 'bg-emerald-950 border border-emerald-600'
                  : 'bg-slate-900 border border-slate-700'
              }`}
            >
              <div className="flex justify-between items-center text-[8.5px] uppercase tracking-wider font-bold">
                <span className={loadRatio >= 1.0 ? 'text-rose-300 font-black' : loadRatio >= 0.8 ? 'text-amber-300' : 'text-teal-400'}>
                  Surintensité de Surcharge & Breaker
                </span>
                <Zap className={`w-3.5 h-3.5 ${loadRatio >= 1.0 ? 'text-rose-400 animate-bounce' : loadRatio >= 0.8 ? 'text-amber-400' : 'text-teal-400'}`} />
              </div>
              <div className="text-xl font-black font-mono text-white flex items-baseline gap-2">
                <span>{currentA.toFixed(1)} A</span>
                <span className="text-xs font-normal text-slate-300">/ Seuil {ratingA} A</span>
                <span className={`text-[9px] font-sans font-black px-1.5 py-0.2 rounded-full border ml-auto ${
                  loadRatio >= 1.0
                    ? 'bg-rose-500 text-white border-rose-400 animate-pulse'
                    : loadRatio >= 0.8
                    ? 'bg-amber-500 text-slate-950 border-amber-400'
                    : loadRatio >= 0.45
                    ? 'bg-emerald-600 text-white border-emerald-400'
                    : 'bg-blue-600 text-white border-blue-400'
                }`}>
                  {(loadRatio * 100).toFixed(0)}%
                </span>
              </div>
              <div className="text-[8px] text-slate-300">
                {currentA > ratingA ? (
                  <span className="text-rose-300 font-bold">⚠️ Dépassement : Breaker interne déclenché par surintensité !</span>
                ) : loadRatio >= 0.8 ? (
                  <span className="text-amber-300 font-bold">⚡ Proche du seuil contractuel ({ratingA}A) : Risque de coupure si augmentation.</span>
                ) : (
                  <span className="text-emerald-300 font-medium">✓ Charge normale sous la limite contractuelle du compteur.</span>
                )}
              </div>
            </div>

            {/* Progression des 4 couleurs Bleu -> Vert -> Orange -> Rouge avec mise en surbrillance du palier actuel */}
            <div className="p-1.5 bg-slate-50 rounded-lg border border-slate-200 text-[8px] space-y-1">
              <span className="font-bold text-slate-700 uppercase block text-[7.5px]">
                Échelle de Surcharge (Bleu ➔ Vert ➔ Orange ➔ Rouge) :
              </span>
              <div className="grid grid-cols-2 gap-1 text-[7.5px]">
                <div
                  className={`flex items-center gap-1 rounded p-0.5 transition-all ${
                    loadRatio < 0.45
                      ? 'bg-blue-100 font-black text-blue-950 ring-1 ring-blue-400 shadow-2xs'
                      : 'text-blue-700 opacity-70'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                  <span><strong>Bleu :</strong> Veille (&lt; 45%)</span>
                </div>
                <div
                  className={`flex items-center gap-1 rounded p-0.5 transition-all ${
                    loadRatio >= 0.45 && loadRatio < 0.8
                      ? 'bg-emerald-100 font-black text-emerald-950 ring-1 ring-emerald-400 shadow-2xs'
                      : 'text-emerald-700 opacity-70'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                  <span><strong>Vert :</strong> Nominal (45-80%)</span>
                </div>
                <div
                  className={`flex items-center gap-1 rounded p-0.5 transition-all ${
                    loadRatio >= 0.8 && loadRatio < 1.0
                      ? 'bg-amber-100 font-black text-amber-950 ring-1 ring-amber-400 shadow-2xs'
                      : 'text-amber-700 opacity-70'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                  <span><strong>Orange :</strong> Seuil (80-100%)</span>
                </div>
                <div
                  className={`flex items-center gap-1 rounded p-0.5 transition-all ${
                    loadRatio >= 1.0
                      ? 'bg-rose-100 font-black text-rose-950 ring-1 ring-rose-400 animate-pulse shadow-2xs'
                      : 'text-rose-700 opacity-70'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-rose-600 shrink-0" />
                  <span><strong>Rouge :</strong> Surcharge (&gt; 100%)</span>
                </div>
              </div>
            </div>

            {/* Calculs de Puissance en Réseau : 3×230V, 3×400V+N, Mono */}
            <div className="p-1.5 bg-slate-50 rounded-lg border border-slate-200 text-[8px] space-y-1">
              <div className="flex justify-between items-center font-bold text-slate-800 text-[7.5px] uppercase">
                <span className="flex items-center gap-1 text-teal-900">
                  <Zap className="w-2.5 h-2.5 text-teal-600" />
                  <span>Calculs de Puissance sous {ratingA}A :</span>
                </span>
                <span className="font-mono text-slate-500 text-[7px]">cos φ = {cosPhi}</span>
              </div>
              <div className="grid grid-cols-3 gap-1 text-[7px] font-mono">
                <div
                  className={`p-1 rounded border text-center transition-all ${
                    state.networkType === 'mono_230'
                      ? 'bg-blue-50 border-blue-400 font-bold text-blue-900 ring-1 ring-blue-300 shadow-2xs'
                      : 'bg-white border-slate-200 text-slate-700'
                  }`}
                >
                  <div className="font-sans text-[6.5px] text-blue-900 font-bold uppercase">Mono 230V</div>
                  <div className="text-[9px] font-black text-blue-950 mt-0.5">{pMaxMono230KW.toFixed(1)} kW</div>
                  <div className="text-[6px] text-slate-500">230V × {ratingA}A</div>
                </div>
                <div
                  className={`p-1 rounded border text-center transition-all ${
                    state.networkType === 'tri_230'
                      ? 'bg-amber-50 border-amber-400 font-bold text-amber-900 ring-1 ring-amber-300 shadow-2xs'
                      : 'bg-white border-slate-200 text-slate-700'
                  }`}
                >
                  <div className="font-sans text-[6.5px] text-amber-900 font-bold uppercase">3×230V</div>
                  <div className="text-[9px] font-black text-amber-950 mt-0.5">{pMaxTri230KW.toFixed(1)} kW</div>
                  <div className="text-[6px] text-slate-500">√3 × 230 × {ratingA}A</div>
                </div>
                <div
                  className={`p-1 rounded border text-center transition-all ${
                    state.networkType === 'tri_400'
                      ? 'bg-teal-50 border-teal-400 font-bold text-teal-900 ring-1 ring-teal-300 shadow-2xs'
                      : 'bg-white border-slate-200 text-slate-700'
                  }`}
                >
                  <div className="font-sans text-[6.5px] text-teal-900 font-bold uppercase">3×400V+N</div>
                  <div className="text-[9px] font-black text-teal-950 mt-0.5">{pMaxTri400KW.toFixed(1)} kW</div>
                  <div className="text-[6px] text-slate-500">3 × 230 × {ratingA}A</div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-1.5 text-[8.5px]">
            {/* Protection Thermique & RGIE */}
            <div className="p-2 bg-slate-900 text-white rounded-lg space-y-1">
              <div className="flex justify-between items-center text-[8px] uppercase tracking-wider text-teal-400 font-bold">
                <span>Protection Thermique RGIE</span>
                <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
              </div>
              <div className="text-sm font-black font-mono text-white">
                Seuil de Déclenchement : {ratingA} A (In)
              </div>
              <p className="text-[7.5px] text-slate-300 leading-tight">
                Le disjoncteur protège l&apos;installation contre l&apos;échauffement excessif par effet Joule (P = R·I²). En cas de surcharge prolongée au-delà de {ratingA}A, l&apos;élément thermique déclenche la coupure automatique.
              </p>
            </div>

            <div className="p-1.5 bg-slate-50 rounded-lg border border-slate-200 space-y-0.5 text-[8px]">
              <strong className="text-slate-900 block">📋 Règles de Protection RGIE :</strong>
              <ul className="list-disc list-inside space-y-0.5 text-slate-600 pl-0.5">
                <li><strong>Courbe C normalisée :</strong> Déclenchement thermique entre 1,13 et 1,45 × In.</li>
                <li><strong>Échauffement admissible :</strong> Température maximale des conducteurs limitée à 70°C.</li>
                <li><strong>Différentiel général :</strong> 300 mA scellable placé en tête d&apos;installation.</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* CAS F : DÉPART CLIENT */}
      {(activeTopic === 'client_output' ||
        activeTopic === 'client_full_tri' ||
        activeTopic === 'client_reduced_mono') && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-left text-[8.5px]">
          <div className="p-2 bg-slate-50 rounded-lg border border-slate-200 space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 font-bold text-slate-900 text-[9.5px]">
                <Activity className="w-3.5 h-3.5 text-teal-600" />
                <span>Mode de Câblage du Départ Client :</span>
              </div>
              <span
                className={`text-[8px] font-mono font-black px-2 py-0.5 rounded-full border ${
                  isSingle
                    ? 'bg-blue-100 text-blue-900 border-blue-300'
                    : 'bg-teal-100 text-teal-950 border-teal-300'
                }`}
              >
                {isSingle ? '⚡ 1 SEULE PHASE' : '⚡⚡⚡ 3 PHASES'}
              </span>
            </div>

            {/* Règles RGIE exactes avec mise en valeur de la sélection active */}
            <div className="space-y-1">
              <div
                className={`p-1.5 rounded border text-[8px] transition-all flex items-center justify-between ${
                  state.buildingType === 'immeuble'
                    ? 'bg-indigo-50 border-indigo-400 font-bold text-indigo-950 ring-1 ring-indigo-400 shadow-2xs'
                    : 'bg-slate-50/50 border-slate-200 text-slate-400 opacity-60'
                }`}
              >
                <span>
                  🏢 <strong>Immeuble / Appartement :</strong> Toujours <strong>1 seule phase</strong> (Monophasé 230V, 2 conducteurs L1 + N, max 50A).
                </span>
                {state.buildingType === 'immeuble' && (
                  <span className="shrink-0 text-[7px] bg-indigo-600 text-white px-1.5 py-0.5 rounded-full font-black">
                    ACTIF
                  </span>
                )}
              </div>
              <div
                className={`p-1.5 rounded border text-[8px] transition-all flex items-center justify-between ${
                  state.buildingType === 'maison' && state.networkType === 'mono_230'
                    ? 'bg-blue-50 border-blue-400 font-bold text-blue-950 ring-1 ring-blue-400 shadow-2xs'
                    : 'bg-slate-50/50 border-slate-200 text-slate-400 opacity-60'
                }`}
              >
                <span>
                  🏠 <strong>Maison 1×230V :</strong> Réseau monophasé ➔ <strong>1 seule phase</strong> (2 conducteurs L1 + N, jusqu'à 80A).
                </span>
                {state.buildingType === 'maison' && state.networkType === 'mono_230' && (
                  <span className="shrink-0 text-[7px] bg-blue-600 text-white px-1.5 py-0.5 rounded-full font-black">
                    ACTIF
                  </span>
                )}
              </div>
              <div
                className={`p-1.5 rounded border text-[8px] transition-all flex items-center justify-between ${
                  state.buildingType === 'maison' && state.networkType === 'tri_230'
                    ? 'bg-teal-50 border-teal-500 font-bold text-teal-950 ring-1 ring-teal-500 shadow-2xs'
                    : 'bg-slate-50/50 border-slate-200 text-slate-400 opacity-60'
                }`}
              >
                <span>
                  🏠 <strong>Maison 3×230V :</strong> Réseau triphasé sans neutre ➔ <strong>3 phases</strong> (3 conducteurs L1 + L2 + L3).
                </span>
                {state.buildingType === 'maison' && state.networkType === 'tri_230' && (
                  <span className="shrink-0 text-[7px] bg-teal-700 text-white px-1.5 py-0.5 rounded-full font-black">
                    ACTIF
                  </span>
                )}
              </div>
              <div
                className={`p-1.5 rounded border text-[8px] transition-all flex items-center justify-between ${
                  state.buildingType === 'maison' && state.networkType === 'tri_400'
                    ? 'bg-teal-50 border-teal-500 font-bold text-teal-950 ring-1 ring-teal-500 shadow-2xs'
                    : 'bg-slate-50/50 border-slate-200 text-slate-400 opacity-60'
                }`}
              >
                <span>
                  🏠 <strong>Maison 3×400V+N :</strong> Réseau tétraphasé avec neutre ➔ <strong>3 phases</strong> (4 conducteurs L1 + L2 + L3 + N).
                </span>
                {state.buildingType === 'maison' && state.networkType === 'tri_400' && (
                  <span className="shrink-0 text-[7px] bg-teal-700 text-white px-1.5 py-0.5 rounded-full font-black">
                    ACTIF
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="p-2 bg-slate-900 text-white rounded-lg space-y-1">
              <div className="flex justify-between items-center text-[8px] uppercase tracking-wider text-teal-400 font-bold">
                <span>Configuration Active</span>
                <span className="font-mono text-teal-300">
                  {wiringInfo.phases === 1 ? 'Monophasé' : 'Triphasé'}
                </span>
              </div>
              <div className="text-sm font-black font-mono text-white">
                {wiringInfo.label} • {wiringInfo.sub}
              </div>
              <div className="text-[7.5px] text-slate-300">
                Puissance max exploitable :{' '}
                <strong className="text-teal-300">{currentPMaxKW.toFixed(1)} kW</strong> sous {ratingA}A.
              </div>
            </div>

            <div className="p-2 bg-teal-50/70 rounded-lg border border-teal-200 text-teal-950 space-y-1 text-[8px]">
              <div className="font-bold flex items-center gap-1 text-teal-900">
                <Info className="w-3 h-3 text-teal-700 shrink-0" />
                Conducteurs raccordés vers tableau divisionnaire :
              </div>
              <div className="font-mono text-slate-800 bg-white p-1 rounded border border-teal-200">
                {wiringInfo.conductors} • Section min {wiringInfo.cableSectionMin}
              </div>
              <p className="text-slate-600">
                {wiringInfo.description}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* CAS G : COURANTS DE PHASES L1, L2, L3 & DISTINCTION CLAIRE DES DEUX SITUATIONS A vs B */}
      {activeTopic === 'power_active' && (() => {
        const uPhasePhase = state.networkType === 'tri_230' ? 230 : 400;
        const s1 = 230 * i1;
        const s2 = isSingle ? 0 : 230 * i2;
        const s3 = isSingle ? 0 : 230 * i3;
        const sTotal = s1 + s2 + s3;
        const p1 = isSingle ? state.powerW : (state.isBalanced ? Math.round(state.powerW / 3) : (state.powerL1 || 0));
        const p2 = isSingle ? 0 : (state.isBalanced ? Math.round(state.powerW / 3) : (state.powerL2 || 0));
        const p3 = isSingle ? 0 : (state.isBalanced ? Math.round(state.powerW / 3) : (state.powerL3 || 0));
        const pTotal = p1 + p2 + p3;

        return (
          <div className="space-y-2 text-left">
            {/* COMPARAISON FONDAMENTALE : SITUATION A vs SITUATION B */}
            <div className="p-2 bg-slate-900 text-white rounded-xl space-y-2">
              <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                <div className="flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-teal-400" />
                  <span className="text-[9.5px] font-black uppercase tracking-wider text-teal-300">
                    Distinction Fondamentale : Charge Triphasée / Moteur vs Charges Monophasées Maison
                  </span>
                </div>
                <span className="text-[7.5px] font-mono bg-teal-950 text-teal-300 border border-teal-800 px-2 py-0.5 rounded-full font-bold">
                  Mode actif : {isSingle ? 'Monophasé 1x230V' : state.isBalanced ? 'Situation A (Équilibré)' : 'Situation B (Maison monophasée)'}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {/* SITUATION A : CHARGE TRIPHASÉE / MOTEUR */}
                <div
                  className={`p-2 rounded-lg border transition-all ${
                    state.isBalanced && !isSingle
                      ? 'bg-teal-950/70 border-teal-400 ring-1 ring-teal-400'
                      : 'bg-slate-800/70 border-slate-700 opacity-90'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-[8.5px] font-black text-teal-300 uppercase">
                      <Scale className="w-3.5 h-3.5 text-teal-400" />
                      <span>A. CHARGE TRIPHASÉE / MOTEUR</span>
                    </div>
                    {state.isBalanced && !isSingle && (
                      <span className="text-[6.5px] font-black bg-teal-500 text-slate-950 px-1.5 py-0.2 rounded uppercase">
                        Sélectionné
                      </span>
                    )}
                  </div>

                  <div className="text-[7.5px] text-slate-300 mt-0.5 font-medium">
                    Utilisation des trois phases simultanément :
                  </div>

                  <div className="p-1.5 my-1.5 rounded bg-slate-900/90 border border-teal-500/40 font-mono text-[8px] text-teal-200">
                    <div className="text-slate-400 text-[6.5px] font-sans uppercase">Formule :</div>
                    <div className="font-bold text-teal-300 text-[9px]">puissance = √3 × U_phase-phase × I</div>
                    <div className="text-[6.5px] text-slate-400 font-sans mt-0.5">
                      (avec P = √3 × U × I × cos φ en Watts et S = √3 × U × I en VA)
                    </div>
                  </div>

                  <ul className="text-[7px] text-slate-300 space-y-0.5 leading-tight list-disc pl-3">
                    <li><strong>Principe :</strong> Un récepteur triphasé unique (moteur, pompe à chaleur, borne de recharge) absorbe la même puissance sur les 3 phases.</li>
                    <li><strong>Courants égaux :</strong> I_L1 = I_L2 = I_L3 = <strong>{i1.toFixed(1)} A</strong>.</li>
                    <li><strong>Courant neutre :</strong> IN = <strong>0.0 A</strong> (les 3 vecteurs déphasés de 120° s&apos;annulent rigoureusement).</li>
                    <li><strong>Tension composée :</strong> U_phase-phase = <strong>{uPhasePhase} V</strong>.</li>
                  </ul>
                </div>

                {/* SITUATION B : CHARGES MONOPHASÉES DANS UNE MAISON */}
                <div
                  className={`p-2 rounded-lg border transition-all ${
                    !state.isBalanced && !isSingle
                      ? 'bg-amber-950/70 border-amber-400 ring-1 ring-amber-400'
                      : 'bg-slate-800/70 border-slate-700 opacity-90'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-[8.5px] font-black text-amber-300 uppercase">
                      <Shuffle className="w-3.5 h-3.5 text-amber-400" />
                      <span>B. CHARGES MONOPHASÉES DANS UNE MAISON</span>
                    </div>
                    {!state.isBalanced && !isSingle && (
                      <span className="text-[6.5px] font-black bg-amber-500 text-slate-950 px-1.5 py-0.2 rounded uppercase">
                        Sélectionné
                      </span>
                    )}
                  </div>

                  <div className="text-[7.5px] text-slate-300 mt-0.5 font-medium">
                    Chaque appareil est raccordé entre une phase et le neutre :
                  </div>

                  <div className="p-1.5 my-1.5 rounded bg-slate-900/90 border border-amber-500/40 font-mono text-[7.5px] text-amber-200 space-y-0.5">
                    <div className="text-slate-400 text-[6.5px] font-sans uppercase">Formule par phase :</div>
                    <div className="font-bold text-amber-300 text-[8.5px]">S_phase = 230 × I_phase</div>
                    <div className="text-slate-400 text-[6.5px] font-sans uppercase pt-0.5 border-t border-slate-800">
                      La puissance totale est la somme des puissances des trois phases :
                    </div>
                    <div className="font-bold text-amber-300 text-[8.5px]">S_total = S_L1 + S_L2 + S_L3</div>
                  </div>

                  <ul className="text-[7px] text-slate-300 space-y-0.5 leading-tight list-disc pl-3">
                    <li><strong>Réalité domestique :</strong> Tous les appareils ménagers (four, taque, lave-linge, TV, éclairage) sont en monophasé 230V raccordés individuellement entre Phase et Neutre.</li>
                    <li><strong>Déclenchement du disjoncteur général :</strong> Le disjoncteur surveille chaque phase indépendamment. Si I_phase &gt; {ratingA}A sur une seule phase, <strong>le disjoncteur général déclenche</strong>, même si la puissance globale S_total reste très basse !</li>
                    <li><strong>Courant neutre :</strong> IN = <strong>{iN.toFixed(1)} A</strong> (le déséquilibre physique retourne obligatoirement par le neutre).</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* DÉTAIL EN DIRECT DES COURANTS ET CALCUL NUMÉRIQUE */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {/* COLONNE GAUCHE : Cartes des phases L1, L2, L3 en direct */}
              <div className="space-y-1.5">
                <div className="p-2 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                  <div className="flex justify-between items-center text-[8px] uppercase tracking-wider text-slate-700 font-bold">
                    <span className="flex items-center gap-1">
                      <Activity className="w-3 h-3 text-teal-600" />
                      <span>Courants & Puissances en direct</span>
                    </span>
                    <span className="font-mono text-[7px] text-slate-500">Calibre : {ratingA} A</span>
                  </div>

                  <div className="grid grid-cols-3 gap-1 pt-0.5">
                    <div className="bg-white p-1.5 rounded border border-slate-200 text-center">
                      <div className="text-[7px] text-slate-500 font-bold uppercase">Phase L1</div>
                      <div className="text-sm font-black font-mono text-slate-900 leading-tight">{i1.toFixed(1)} A</div>
                      <div className="text-[6.5px] text-teal-900 font-mono font-bold">{p1} W</div>
                      <div className="text-[6px] text-slate-500 font-mono">S = {Math.round(s1)} VA</div>
                    </div>

                    <div className={`p-1.5 rounded border text-center ${!isSingle ? 'bg-white border-slate-200' : 'bg-slate-100 border-slate-200 opacity-60'}`}>
                      <div className="text-[7px] text-slate-500 font-bold uppercase">Phase L2</div>
                      <div className="text-sm font-black font-mono text-slate-900 leading-tight">{!isSingle ? `${i2.toFixed(1)} A` : '0.0 A'}</div>
                      <div className="text-[6.5px] text-teal-900 font-mono font-bold">{!isSingle ? `${p2} W` : '-'}</div>
                      <div className="text-[6px] text-slate-500 font-mono">{!isSingle ? `S = ${Math.round(s2)} VA` : '-'}</div>
                    </div>

                    <div className={`p-1.5 rounded border text-center ${!isSingle ? 'bg-white border-slate-200' : 'bg-slate-100 border-slate-200 opacity-60'}`}>
                      <div className="text-[7px] text-slate-500 font-bold uppercase">Phase L3</div>
                      <div className="text-sm font-black font-mono text-slate-900 leading-tight">{!isSingle ? `${i3.toFixed(1)} A` : '0.0 A'}</div>
                      <div className="text-[6.5px] text-teal-900 font-mono font-bold">{!isSingle ? `${p3} W` : '-'}</div>
                      <div className="text-[6px] text-slate-500 font-mono">{!isSingle ? `S = ${Math.round(s3)} VA` : '-'}</div>
                    </div>
                  </div>

                  {!isSingle && (
                    <div className="p-1 bg-white rounded border border-slate-200 text-[7px] font-mono flex flex-wrap items-center justify-between text-slate-800">
                      <span><strong>S_total = S_L1 + S_L2 + S_L3</strong> = {Math.round(sTotal)} VA ({(sTotal / 1000).toFixed(2)} kVA)</span>
                      <span>P_total = {pTotal} W ({(pTotal / 1000).toFixed(2)} kW)</span>
                    </div>
                  )}

                  {!isSingle && state.networkType === 'tri_400' && (
                    <div className="text-[7px] text-blue-900 font-mono flex justify-between items-center pt-0.5 px-0.5">
                      <span>Courant retour Neutre (IN) :</span>
                      <span className="font-bold">{iN.toFixed(1)} A {state.isBalanced ? '(Annulation vectorielle = 0A)' : '(Résultante de déséquilibre)'}</span>
                    </div>
                  )}
                </div>

                <div className="p-1.5 bg-slate-50 rounded-lg border border-slate-200 space-y-1 text-[8px]">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600 font-bold">Phase critique ({iMax.toFixed(1)}A) vs Seuil Breaker ({ratingA}A) :</span>
                    <span className={`font-mono font-black ${iMax > ratingA ? 'text-rose-600' : 'text-teal-700'}`}>
                      {iMax.toFixed(1)} A / {ratingA} A ({(loadRatio * 100).toFixed(0)}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${iMax > ratingA ? 'bg-rose-500' : loadRatio > 0.8 ? 'bg-amber-500' : 'bg-teal-600'}`}
                      style={{ width: `${Math.min(100, (iMax / ratingA) * 100)}%` }}
                    />
                  </div>
                  <div className="text-slate-500 text-[7px] leading-tight">
                    {iMax > ratingA ? (
                      <strong className="text-rose-700">⚠️ Surcharge atteinte sur la phase la plus chargée : le disjoncteur général déclenche.</strong>
                    ) : (
                      <span>✓ Fonctionnement normal sous le calibre contractuel ({ratingA}A).</span>
                    )}
                  </div>
                </div>
              </div>

              {/* COLONNE DROITE : COMMENT ON A TROUVÉ L'AMPÉRAGE */}
              <div className="p-2 bg-slate-50 rounded-lg border border-slate-200 space-y-1.5 text-[8px] text-slate-700">
                <div className="flex items-center justify-between font-bold text-slate-800 text-[8px] uppercase">
                  <span className="flex items-center gap-1">
                    <Calculator className="w-3.5 h-3.5 text-teal-600" />
                    <span>Comment a-t-on trouvé l&apos;ampérage de chaque phase ?</span>
                  </span>
                  <span className="text-teal-700 font-mono text-[7px]">cos φ = {cosPhi}</span>
                </div>

                {state.isBalanced && !isSingle ? (
                  /* CALCUL EN SITUATION A */
                  <div className="space-y-1">
                    <div className="p-1.5 bg-white rounded-md border border-slate-200 font-mono text-[7.5px] space-y-0.5">
                      <div className="font-sans font-bold text-teal-900 text-[7px] uppercase">Formule Situation A (Moteur / PAC) :</div>
                      <div className="font-bold text-slate-900">puissance = √3 × U_phase-phase × I</div>
                      <div className="text-slate-600 text-[7px] font-sans">
                        I = P ÷ (√3 × {uPhasePhase} V × {cosPhi}) = P ÷ {(Math.sqrt(3) * uPhasePhase * cosPhi).toFixed(1)}
                      </div>
                      <div className="text-teal-950 font-black text-[8px] pt-0.5 border-t border-slate-100">
                        I = {state.powerW} W ÷ {(Math.sqrt(3) * uPhasePhase * cosPhi).toFixed(1)} = <span className="bg-teal-100 px-1 py-0.2 rounded border border-teal-300 text-[8.5px]">{i1.toFixed(1)} A</span> sur L1, L2, L3
                      </div>
                    </div>
                  </div>
                ) : !isSingle ? (
                  /* CALCUL EN SITUATION B */
                  <div className="space-y-1">
                    <div className="p-1.5 bg-white rounded-md border border-slate-200 font-mono text-[7.5px] space-y-0.5">
                      <div className="font-sans font-bold text-amber-900 text-[7px] uppercase">Formules Situation B (Maison monophasée) :</div>
                      <div className="font-bold text-slate-900">S_phase = 230 × I_phase</div>
                      <div className="text-slate-600 text-[7px] font-sans">
                        Courant par phase : I_phase = P_phase ÷ (230 × cos φ) = P_phase ÷ 218.5
                      </div>
                      <div className="space-y-0.5 pt-0.5 border-t border-slate-100 text-[7px]">
                        <div>• L1 : {(state.powerL1 || 0)} W ÷ 218.5 = <strong className="text-teal-900">{i1.toFixed(1)} A</strong> ➔ S_L1 = 230 × {i1.toFixed(1)} = {Math.round(s1)} VA</div>
                        <div>• L2 : {(state.powerL2 || 0)} W ÷ 218.5 = <strong className="text-teal-900">{i2.toFixed(1)} A</strong> ➔ S_L2 = 230 × {i2.toFixed(1)} = {Math.round(s2)} VA</div>
                        <div>• L3 : {(state.powerL3 || 0)} W ÷ 218.5 = <strong className="text-teal-900">{i3.toFixed(1)} A</strong> ➔ S_L3 = 230 × {i3.toFixed(1)} = {Math.round(s3)} VA</div>
                      </div>
                      <div className="font-bold text-amber-950 text-[7.5px] pt-0.5 border-t border-slate-100">
                        S_total = S_L1 + S_L2 + S_L3 = {Math.round(sTotal)} VA ({(sTotal / 1000).toFixed(2)} kVA)
                      </div>
                    </div>
                  </div>
                ) : (
                  /* MONOPHASÉ */
                  <div className="p-1.5 bg-white rounded-md border border-slate-200 font-mono text-[7.5px] space-y-0.5">
                    <div className="font-sans font-bold text-teal-900 text-[7px] uppercase">Formule Monophasé 1x230V :</div>
                    <div className="font-bold text-slate-900">I = P ÷ (230 × cos φ) = P ÷ 218.5</div>
                    <div className="text-teal-900 font-black text-[8.5px]">
                      {state.powerW} W ÷ 218.5 = {i1.toFixed(1)} A
                    </div>
                  </div>
                )}

                <div className="p-1 bg-teal-50 rounded border border-teal-200 text-[7px] text-teal-950 font-medium">
                  💡 <strong>Règle pratique :</strong> 1000 W (1 kW) sous 230V équivaut à <strong>4,58 A</strong>. Pour trouver l&apos;ampérage, multipliez simplement les kW par 4.58 !
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* CAS I : TESTS DE DÉCLENCHEMENT */}
      {activeTopic === 'test_overload' && (
        <div className="p-2 bg-amber-50 rounded-lg border border-amber-200 text-[8.5px] text-amber-950 space-y-0.5 text-left">
          <div className="font-black flex items-center gap-1 text-amber-900">
            <AlertTriangle className="w-3 h-3 text-amber-600" />
            Simulation : Surcharge &gt; {ratingA}A (Breaker Interne Seul)
          </div>
          <p className="text-slate-700 leading-tight">
            Le breaker électronique coupe instantanément sans déclencher le disjoncteur amont, dont la courbe thermique est ralentie pour assurer la sélectivité.
          </p>
        </div>
      )}

      {activeTopic === 'test_shortcircuit' && (
        <div className="p-2 bg-rose-50 rounded-lg border border-rose-200 text-[8.5px] text-rose-950 space-y-0.5 text-left">
          <div className="font-black flex items-center gap-1 text-rose-900">
            <Flame className="w-3 h-3 text-rose-600" />
            Simulation : Court-Circuit Franc 4500A (Déclenchement Amont)
          </div>
          <p className="text-slate-700 leading-tight">
            Court-circuit franc direct. Le disjoncteur amont magnéto-thermique 25D60 saute en quelques millisecondes pour étouffer l&apos;arc et prévenir l&apos;incendie.
          </p>
        </div>
      )}
    </div>
  );
};
