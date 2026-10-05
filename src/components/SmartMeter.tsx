/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import {
  Gauge,
  Activity,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Info,
  RefreshCw,
  Sun,
  Power,
  Building,
  Home,
  Flame,
  Layers,
  Lock,
  RotateCcw,
  Pause,
  Lightbulb,
  BookOpen,
  HelpCircle,
  Check,
  ListOrdered,
  Plus,
  Minus,
  Zap,
  Calculator,
  Scale,
  Shuffle,
  SlidersHorizontal,
  GraduationCap,
} from 'lucide-react';
import { ConnectionStepsGameModal } from './ConnectionStepsGameModal';
import { ShortCircuitExplosion } from './ShortCircuitExplosion';
import { SmartMeterExplanation } from './SmartMeterExplanation';

export type BuildingType = 'immeuble' | 'maison';
export type NetworkType = 'mono_230' | 'tri_230' | 'tri_400';
export type ClientOutputMode = '1_phase' | '3_phases' | 'full_tri' | 'reduced_mono';

export const isClientSinglePhase = (buildingType: BuildingType, networkType: NetworkType): boolean => {
  return buildingType === 'immeuble' || networkType === 'mono_230';
};

export const getClientWiringInfo = (buildingType: BuildingType, networkType: NetworkType) => {
  if (buildingType === 'immeuble') {
    return {
      phases: 1 as const,
      label: '1 seule phase',
      sub: 'Monophasé 230V',
      conductors: '2 conducteurs (L1 + N)',
      description: "En immeuble : départ client toujours en 1 seule phase (monophasé 230V) alimentant le coffret de l'appartement.",
      cableSectionMin: '2×10 mm²',
    };
  }
  if (networkType === 'mono_230') {
    return {
      phases: 1 as const,
      label: '1 seule phase',
      sub: 'Monophasé 230V',
      conductors: '2 conducteurs (L1 + N)',
      description: "Sur maison 1×230V : départ client raccordé en 1 seule phase (monophasé 230V) alimentant l'habitation.",
      cableSectionMin: '2×10 mm²',
    };
  }
  if (networkType === 'tri_230') {
    return {
      phases: 3 as const,
      label: '3 phases',
      sub: 'Triphasé 3×230V sans neutre',
      conductors: '3 conducteurs (L1 + L2 + L3)',
      description: "Sur maison 3×230V : départ client raccordé en 3 phases pour alimenter le tableau de l'habitation.",
      cableSectionMin: '4×10 mm²',
    };
  }
  // tri_400 (3x400V+N)
  return {
    phases: 3 as const,
    label: '3 phases',
    sub: 'Tétraphasé 3×400V + Neutre',
    conductors: '4 conducteurs (L1 + L2 + L3 + N)',
    description: "Sur maison 3×400V+N : départ client raccordé en 3 phases + neutre pour le tableau de l'habitation.",
    cableSectionMin: '4×10 mm²',
  };
};

export interface SmartMeterState {
  buildingType: BuildingType; // 'immeuble' (mono 4 bornes) ou 'maison' (polyphasé 4 pôles)
  networkType: NetworkType; // 'mono_230', 'tri_230' (3x230V sans neutre), 'tri_400' (3x400V+N)
  clientOutputMode?: ClientOutputMode; // En immeuble / mono 1x230: '1_phase'. En maison 3x230 / 3x400+N: '3_phases'.
  breakerRating: number; // A (16, 20, 25, 32, 40, 50, 63) -> Consigne du BREAKER INTERNE instantané
  upstreamBreakerRating: number; // A (ex: 63A) -> Disjoncteur magnéto-thermique amont (court-circuit)
  internalBreakerTripped: boolean; // État du breaker électronique interne de coupure
  upstreamBreakerTripped: boolean; // État du disjoncteur magnétothermique amont (protection Icc court-circuit)
  triggerExplosionTimestamp?: number; // Horodatage pour déclencher l'animation d'arc flash / explosion avec feu
  activeTopic?: string; // Sujet actif cliqué dans le panneau de gauche pour explication
  mode: 'consumption' | 'injection';
  powerW: number;
  powerL1: number;
  powerL2: number;
  powerL3: number;
  isBalanced: boolean;
  cosPhi: number;
  tariffPeriod: 'HP' | 'HC';
  priceConsumption: number; // €/kWh
  priceInjection: number; // €/kWh
  indexHP_Import: number; // 1.8.1 in kWh
  indexHC_Import: number; // 1.8.2 in kWh
  indexHP_Export: number; // 2.8.1 in kWh
  indexHC_Export: number; // 2.8.2 in kWh
  peak15MinKW: number; // Belgian capacity tariff / max demand peak
  p1PortActive: boolean;
}

export const INITIAL_SMART_METER_STATE: SmartMeterState = {
  buildingType: 'maison',
  networkType: 'tri_230',
  clientOutputMode: '3_phases',
  breakerRating: 40,
  upstreamBreakerRating: 40, // Disjoncteur >= Breaker (égal ou plus grand)
  internalBreakerTripped: false,
  upstreamBreakerTripped: false,
  activeTopic: 'network_tri_230',
  mode: 'consumption',
  powerW: 4500,
  powerL1: 1500,
  powerL2: 1500,
  powerL3: 1500,
  isBalanced: true,
  cosPhi: 0.95,
  tariffPeriod: 'HP',
  priceConsumption: 0.32,
  priceInjection: 0.08,
  indexHP_Import: 12450.6,
  indexHC_Import: 8930.2,
  indexHP_Export: 1420.5,
  indexHC_Export: 320.1,
  peak15MinKW: 4.25,
  p1PortActive: true,
};

interface SmartMeterControlsProps {
  state: SmartMeterState;
  onChange: (newState: SmartMeterState) => void;
  onOpenExam?: () => void;
}

export const SmartMeterControls: React.FC<SmartMeterControlsProps> = ({ state, onChange, onOpenExam }) => {
  const [isGameOpen, setIsGameOpen] = useState(false);
  const [autoSizeBreakers, setAutoSizeBreakers] = useState(true);
  const [showExplosionModal, setShowExplosionModal] = useState(false);

  useEffect(() => {
    if (state.triggerExplosionTimestamp) {
      setShowExplosionModal(true);
    }
  }, [state.triggerExplosionTimestamp]);

  const update = (patch: Partial<SmartMeterState>) => {
    onChange({ ...state, ...patch });
  };

  const breakerOptions = [16, 20, 25, 32, 40, 50, 63, 80];

  // Calibres standards du disjoncteur amont magnéto-thermique (Coffret 25D60 / Branchement)
  // Règle fondamentale : Le disjoncteur est TOUJOURS ÉGAL OU PLUS GRAND que le calibre du breaker interne (Disjoncteur >= Breaker).
  // Donc si le breaker est à 40A, tous les calibres < 40A sont désactivés pour le disjoncteur (40A, 50A, 63A, 80A autorisés).
  const upstreamBreakerOptions = [16, 20, 25, 32, 40, 50, 63, 80];

  const getRecommendedUpstreamBreaker = (breakerA: number, buildingType: BuildingType = state.buildingType): number => {
    const maxAllowed = buildingType === 'immeuble' ? 50 : 80;
    // Si le disjoncteur amont actuel est déjà valide (>= breakerA et <= maxAllowed), on le conserve
    if (state.upstreamBreakerRating >= breakerA && state.upstreamBreakerRating <= maxAllowed) {
      return state.upstreamBreakerRating;
    }
    // Sinon, on calibre le disjoncteur pour qu'il soit au minimum égal au breaker (ou plafonné à maxAllowed)
    return Math.min(breakerA, maxAllowed);
  };

  // Calcule le courant requis et le calibre standard de breaker minimal pour une puissance donnée
  const getRequiredRating = (powerWatts: number) => {
    const isSingle = isClientSinglePhase(state.buildingType, state.networkType);
    const sqrt3 = Math.sqrt(3);
    let maxI = 0;

    if (isSingle) {
      maxI = powerWatts / (230 * state.cosPhi);
    } else if (state.networkType === 'tri_230') {
      if (state.isBalanced) {
        maxI = powerWatts / (sqrt3 * 230 * state.cosPhi);
      } else {
        const totalP = (state.powerL1 || 0) + (state.powerL2 || 0) + (state.powerL3 || 0) || 1;
        const r1 = (state.powerL1 || 0) / totalP;
        const r2 = (state.powerL2 || 0) / totalP;
        const r3 = (state.powerL3 || 0) / totalP;
        const I12 = (powerWatts * r1) / (230 * state.cosPhi);
        const I23 = (powerWatts * r2) / (230 * state.cosPhi);
        const I31 = (powerWatts * r3) / (230 * state.cosPhi);
        const I1 = Math.sqrt(I12 * I12 + I31 * I31 + I12 * I31);
        const I2 = Math.sqrt(I23 * I23 + I12 * I12 + I23 * I12);
        const I3 = Math.sqrt(I31 * I31 + I23 * I23 + I31 * I23);
        maxI = Math.max(I1, I2, I3);
      }
    } else {
      // tri_400 (3x400V+N)
      if (state.isBalanced) {
        maxI = powerWatts / (sqrt3 * 400 * state.cosPhi);
      } else {
        const totalP = (state.powerL1 || 0) + (state.powerL2 || 0) + (state.powerL3 || 0) || 1;
        const r1 = (state.powerL1 || 0) / totalP;
        const r2 = (state.powerL2 || 0) / totalP;
        const r3 = (state.powerL3 || 0) / totalP;
        const I1 = (powerWatts * r1) / (230 * state.cosPhi);
        const I2 = (powerWatts * r2) / (230 * state.cosPhi);
        const I3 = (powerWatts * r3) / (230 * state.cosPhi);
        maxI = Math.max(I1, I2, I3);
      }
    }

    const maxAllowed = state.buildingType === 'immeuble' ? 50 : 80;
    const standardRatings = [16, 20, 25, 32, 40, 50, 63, 80].filter((r) => r <= maxAllowed);
    // Tolérance de 0.1A pour les puissances étalons (ex: 17.3 kW -> 24.97 A -> Calibre 25 A)
    const matched = standardRatings.find((r) => r >= maxI - 0.1);
    const rating = matched || standardRatings[standardRatings.length - 1];

    return {
      currentA: maxI,
      rating,
    };
  };

  // Calcul de la puissance maximale exploitable en kW selon le réseau, calibre et mode client
  const currentMaxExploitableKW = useMemo(() => {
    const isSingle = isClientSinglePhase(state.buildingType, state.networkType);
    if (isSingle) {
      return (230 * state.breakerRating) / 1000;
    } else if (state.networkType === 'tri_230') {
      return (Math.sqrt(3) * 230 * state.breakerRating) / 1000;
    } else {
      return (Math.sqrt(3) * 400 * state.breakerRating) / 1000;
    }
  }, [state.buildingType, state.networkType, state.breakerRating]);

  // Puissance en triphasé intégral (pour comparer si le client est en dérivation mono)
  const fullTriMaxKW = useMemo(() => {
    if (isClientSinglePhase(state.buildingType, state.networkType)) {
      return (230 * state.breakerRating) / 1000;
    } else if (state.networkType === 'tri_230') {
      return (Math.sqrt(3) * 230 * state.breakerRating) / 1000;
    } else {
      return (Math.sqrt(3) * 400 * state.breakerRating) / 1000;
    }
  }, [state.buildingType, state.networkType, state.breakerRating]);

  // Courants par phase et courant dans le neutre (tenant compte du mode équilibré / déséquilibré)
  const computedCurrents = useMemo(() => {
    const isSingle = isClientSinglePhase(state.buildingType, state.networkType);
    const sqrt3 = Math.sqrt(3);
    const cosPhi = state.cosPhi || 0.95;

    if (isSingle) {
      const I = state.powerW / (230 * cosPhi);
      return { I1: I, I2: 0, I3: 0, Imax: I, IN: I };
    } else if (state.networkType === 'tri_230') {
      if (state.isBalanced) {
        const I = state.powerW / (sqrt3 * 230 * cosPhi);
        return { I1: I, I2: I, I3: I, Imax: I, IN: 0 };
      } else {
        const I12 = (state.powerL1 || 0) / (230 * cosPhi);
        const I23 = (state.powerL2 || 0) / (230 * cosPhi);
        const I31 = (state.powerL3 || 0) / (230 * cosPhi);
        const I1 = Math.sqrt(I12 * I12 + I31 * I31 + I12 * I31);
        const I2 = Math.sqrt(I23 * I23 + I12 * I12 + I23 * I12);
        const I3 = Math.sqrt(I31 * I31 + I23 * I23 + I31 * I23);
        return { I1, I2, I3, Imax: Math.max(I1, I2, I3), IN: 0 };
      }
    } else {
      // tri_400 (3x400V+N)
      if (state.isBalanced) {
        const I = state.powerW / (sqrt3 * 400 * cosPhi);
        return { I1: I, I2: I, I3: I, Imax: I, IN: 0 };
      } else {
        const I1 = (state.powerL1 || 0) / (230 * cosPhi);
        const I2 = (state.powerL2 || 0) / (230 * cosPhi);
        const I3 = (state.powerL3 || 0) / (230 * cosPhi);
        const valN = I1 * I1 + I2 * I2 + I3 * I3 - (I1 * I2 + I2 * I3 + I3 * I1);
        const IN = Math.sqrt(Math.max(0, valN));
        return { I1, I2, I3, Imax: Math.max(I1, I2, I3), IN };
      }
    }
  }, [
    state.buildingType,
    state.networkType,
    state.isBalanced,
    state.powerW,
    state.powerL1,
    state.powerL2,
    state.powerL3,
    state.cosPhi,
  ]);

  // Courant actuel dimensionnant par phase (en déséquilibré, c'est la phase la plus chargée)
  const currentCalculatedA = computedCurrents.Imax;

  // Phase critique la plus chargée
  const criticalPhase = useMemo(() => {
    if (isClientSinglePhase(state.buildingType, state.networkType)) return 'L1';
    if (computedCurrents.I1 >= computedCurrents.I2 && computedCurrents.I1 >= computedCurrents.I3) return 'L1';
    if (computedCurrents.I2 >= computedCurrents.I1 && computedCurrents.I2 >= computedCurrents.I3) return 'L2';
    return 'L3';
  }, [state.buildingType, state.networkType, computedCurrents]);

  // Puissances étalons dimensionnées selon le réseau sélectionné pour alimenter le logement
  const homePowerPresets = useMemo(() => {
    const isSingle = isClientSinglePhase(state.buildingType, state.networkType);
    const sqrt3 = Math.sqrt(3);

    const ratings = isSingle
      ? [16, 20, 25, 32, 40, 50]
      : [16, 20, 25, 32, 40, 50, 63, 80];

    return ratings.map((rating) => {
      let watts = 0;
      if (isSingle) {
        watts = Math.round(230 * rating);
      } else if (state.networkType === 'tri_230') {
        watts = Math.round(sqrt3 * 230 * rating);
      } else {
        // tri_400 (3x400V+N)
        watts = Math.round(sqrt3 * 400 * rating);
      }
      const kwVal = parseFloat((watts / 1000).toFixed(1));
      let note = '';
      if (state.networkType === 'tri_400' && rating === 25) note = 'Ex: 17.3 kW = 25A';
      else if (state.networkType === 'tri_230' && rating === 40) note = 'Ex: 15.9 kW = 40A';
      else if (isSingle && rating === 40) note = 'Standard Mono 40A';

      return {
        kw: kwVal,
        watts,
        breakerA: rating,
        note,
      };
    });
  }, [state.buildingType, state.networkType]);

  // Gestion du changement de type de bâtiment
  const handleBuildingChange = (type: BuildingType) => {
    if (type === 'immeuble') {
      // Pour les immeubles : toujours 1 seule phase (monophasé 230V, max 50A)
      update({
        buildingType: 'immeuble',
        networkType: 'mono_230',
        clientOutputMode: '1_phase',
        breakerRating: Math.min(state.breakerRating, 50),
        upstreamBreakerRating: Math.min(state.upstreamBreakerRating, 50),
        isBalanced: true,
        powerL1: state.powerW,
        powerL2: 0,
        powerL3: 0,
        internalBreakerTripped: false,
        activeTopic: 'client_output',
      });
    } else {
      // Pour les maisons : par défaut 3x230V triphasé (3 phases)
      const recUpstream = getRecommendedUpstreamBreaker(state.breakerRating, 'maison');
      const perPhase = Math.round(state.powerW / 3);
      update({
        buildingType: 'maison',
        networkType: 'tri_230',
        clientOutputMode: '3_phases',
        upstreamBreakerRating: Math.max(state.upstreamBreakerRating, recUpstream),
        powerL1: perPhase,
        powerL2: perPhase,
        powerL3: state.powerW - 2 * perPhase,
        internalBreakerTripped: false,
        activeTopic: 'client_output',
      });
    }
  };

  // Basculement entre Système Équilibré et Système Déséquilibré
  const handleToggleBalance = (balanced: boolean) => {
    if (balanced) {
      const perPhase = Math.round(state.powerW / 3);
      update({
        isBalanced: true,
        powerL1: perPhase,
        powerL2: perPhase,
        powerL3: state.powerW - 2 * perPhase,
        activeTopic: 'power_active',
      });
    } else {
      // Configuration déséquilibrée réaliste pour une habitation :
      // Répartition typique : L1 (55% gros électroménager), L2 (30% prises/buanderie), L3 (15% éclairages/veille)
      const totalW = state.powerW || 4500;
      const p1 = Math.round(totalW * 0.55);
      const p2 = Math.round(totalW * 0.30);
      const p3 = Math.max(0, totalW - p1 - p2);
      update({
        isBalanced: false,
        powerL1: p1,
        powerL2: p2,
        powerL3: p3,
        activeTopic: 'power_active',
      });
    }
  };

  // Modification individuelle de la puissance d'une phase (en mode déséquilibré)
  const handlePhasePowerChange = (phase: 'L1' | 'L2' | 'L3', newWatts: number) => {
    const clamped = Math.max(0, Math.min(25000, newWatts));
    const p1 = phase === 'L1' ? clamped : (state.powerL1 || 0);
    const p2 = phase === 'L2' ? clamped : (state.powerL2 || 0);
    const p3 = phase === 'L3' ? clamped : (state.powerL3 || 0);
    const totalW = p1 + p2 + p3;
    update({
      isBalanced: false,
      powerL1: p1,
      powerL2: p2,
      powerL3: p3,
      powerW: totalW,
    });
  };

  // Gestion du changement de réseau selon les règles du départ client :
  // - Immeuble : 1 seule phase
  // - Maison 1x230 : 1 seule phase
  // - Maison 3x230 : 3 phases
  // - Maison 3x400+N : 3 phases
  const handleNetworkChange = (net: NetworkType) => {
    const isSingle = state.buildingType === 'immeuble' || net === 'mono_230';
    let patch: Partial<SmartMeterState> = {
      networkType: net,
      clientOutputMode: isSingle ? '1_phase' : '3_phases',
      activeTopic: 'network_' + net,
      internalBreakerTripped: false,
    };

    if (isSingle) {
      patch.powerL1 = state.powerW;
      patch.powerL2 = 0;
      patch.powerL3 = 0;
    } else if (state.isBalanced) {
      const perPhase = Math.round(state.powerW / 3);
      patch.powerL1 = perPhase;
      patch.powerL2 = perPhase;
      patch.powerL3 = state.powerW - 2 * perPhase;
    } else {
      // Conserve les proportions des phases
      const currentTotal = (state.powerL1 || 0) + (state.powerL2 || 0) + (state.powerL3 || 0) || 1;
      const r1 = (state.powerL1 || 0) / currentTotal;
      const r2 = (state.powerL2 || 0) / currentTotal;
      patch.powerL1 = Math.round(state.powerW * r1);
      patch.powerL2 = Math.round(state.powerW * r2);
      patch.powerL3 = Math.max(0, state.powerW - (patch.powerL1 || 0) - (patch.powerL2 || 0));
    }

    update(patch);
  };

  // Applique la puissance nécessaire pour alimenter la maison
  // Ajuste le breaker interne et positionne le disjoncteur amont au calibre supérieur (ex: 40A -> 63A)
  const applyHousePowerNeeded = (valWatts: number, forceAutoBreaker: boolean = true) => {
    const clamped = Math.max(0, Math.min(45000, valWatts));
    let patch: Partial<SmartMeterState> = { powerW: clamped };
    const isSingle = isClientSinglePhase(state.buildingType, state.networkType);

    if (isSingle) {
      patch.powerL1 = clamped;
      patch.powerL2 = 0;
      patch.powerL3 = 0;
    } else if (state.isBalanced) {
      const perPhase = Math.round(clamped / 3);
      patch.powerL1 = perPhase;
      patch.powerL2 = perPhase;
      patch.powerL3 = clamped - 2 * perPhase;
    } else {
      const currentTotal = (state.powerL1 || 0) + (state.powerL2 || 0) + (state.powerL3 || 0) || 1;
      const r1 = (state.powerL1 || 0) / currentTotal;
      const r2 = (state.powerL2 || 0) / currentTotal;
      patch.powerL1 = Math.round(clamped * r1);
      patch.powerL2 = Math.round(clamped * r2);
      patch.powerL3 = Math.max(0, clamped - (patch.powerL1 || 0) - (patch.powerL2 || 0));
    }

    if (forceAutoBreaker || autoSizeBreakers) {
      const { rating } = getRequiredRating(clamped);
      patch.breakerRating = rating;
      // Règle demandée : le disjoncteur amont est mis à la valeur supérieure au breaker (ex: 40A -> 63A)
      patch.upstreamBreakerRating = getRecommendedUpstreamBreaker(rating, state.buildingType);
      patch.internalBreakerTripped = false;
    } else {
      // Mode simulation surcharge manuelle
      const { currentA } = getRequiredRating(clamped);
      if (currentA > state.breakerRating) {
        patch.internalBreakerTripped = true;
      }
    }

    update(patch);
  };

  // Contrôle direct de la surcharge par intensité (Ampères)
  // Lorsque le courant dépasse le calibre du breaker interne, déclenche la surintensité de surcharge
  const handleOverloadSliderChange = (targetA: number) => {
    const isSingle = isClientSinglePhase(state.buildingType, state.networkType);
    let watts = 0;

    if (isSingle) {
      watts = Math.round(230 * targetA * state.cosPhi);
    } else if (state.networkType === 'tri_230') {
      watts = Math.round(Math.sqrt(3) * 230 * targetA * state.cosPhi);
    } else {
      // tri_400 (3x400V+N)
      watts = Math.round(Math.sqrt(3) * 400 * targetA * state.cosPhi);
    }

    const patch: Partial<SmartMeterState> = {
      powerW: watts,
      activeTopic: 'cable_section',
    };

    if (isSingle) {
      patch.powerL1 = watts;
      patch.powerL2 = 0;
      patch.powerL3 = 0;
    } else if (state.isBalanced) {
      const perPhase = Math.round(watts / 3);
      patch.powerL1 = perPhase;
      patch.powerL2 = perPhase;
      patch.powerL3 = watts - 2 * perPhase;
    } else {
      const currentTotal = (state.powerL1 || 0) + (state.powerL2 || 0) + (state.powerL3 || 0) || 1;
      const r1 = (state.powerL1 || 0) / currentTotal;
      const r2 = (state.powerL2 || 0) / currentTotal;
      patch.powerL1 = Math.round(watts * r1);
      patch.powerL2 = Math.round(watts * r2);
      patch.powerL3 = Math.max(0, watts - (patch.powerL1 || 0) - (patch.powerL2 || 0));
    }

    // Déclenchement instantané si le courant dépasse l'ampérage du breaker
    if (targetA > state.breakerRating) {
      patch.internalBreakerTripped = true;
    } else {
      patch.internalBreakerTripped = false;
    }

    update(patch);
  };

  return (
    <motion.div
      key="smart-meter-controls"
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -10 }}
      className="absolute inset-0 bg-white flex flex-col justify-between p-1"
    >
      {/* EN-TÊTE COMPACT */}
      <div className="flex justify-between items-center pb-2 shrink-0 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-teal-50 text-teal-600 rounded-lg border border-teal-200">
            <Gauge className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-black tracking-tight text-slate-900 uppercase leading-none">
              Compteur Intelligent
            </h2>
            <div className="text-[10px] text-slate-500 font-medium mt-0.5">
              {state.buildingType === 'immeuble' ? 'Monophasé 230V • 4 Bornes' : state.networkType === 'tri_400' ? 'Tétraphasé 3×400V+N • 4 Pôles' : state.networkType === 'tri_230' ? 'Triphasé 3×230V • 4 Pôles' : 'Monophasé 230V'}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {onOpenExam && (
            <button
              type="button"
              onClick={onOpenExam}
              className="px-2 py-1 text-[10px] font-black uppercase bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 active:scale-95 text-white rounded-full shadow-2xs border border-emerald-400/40 flex items-center gap-1 transition-all cursor-pointer"
              title="Ouvrir l'examen QCM Pose Compteurs Communicants (123 questions + Corrigé)"
            >
              <GraduationCap className="w-3 h-3 text-emerald-200 shrink-0" />
              <span>Examen (123 QCM)</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => setIsGameOpen(true)}
            className="px-2 py-1 text-[10px] font-black uppercase bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 active:scale-95 text-white rounded-full shadow-2xs border border-teal-400/40 flex items-center gap-1 transition-all cursor-pointer group"
            title="Lancer le jeu de classement des 12 étapes de raccordement"
          >
            <ListOrdered className="w-3 h-3 text-teal-200 group-hover:rotate-12 transition-transform shrink-0" />
            <span>Jeu Étapes (12)</span>
          </button>
        </div>
      </div>

      {/* CORPS DES CONTRÔLES SANS SCROLL */}
      <div className="space-y-2 py-2 flex-1 flex flex-col justify-between overflow-y-auto no-scrollbar">
        {/* 1. BÂTIMENT & RÉSEAU */}
        <div className="p-2.5 bg-slate-50/80 rounded-xl border border-slate-200 space-y-2">
          <div className="flex items-center justify-between text-[10px] font-bold text-slate-700 uppercase">
            <span className="flex items-center gap-1">
              <Building className="w-3.5 h-3.5 text-indigo-600" />
              1. Bâtiment & Réseau
            </span>
            <span className="text-[9px] font-mono text-slate-500">
              {state.buildingType === 'immeuble' ? 'Appartement (Max 50A)' : 'Maison (Max 80A)'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleBuildingChange('immeuble')}
              className={`py-1.5 px-2 rounded-lg border text-left transition-all cursor-pointer flex items-center gap-2 ${
                state.buildingType === 'immeuble'
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
              }`}
            >
              <Building className="w-3.5 h-3.5 shrink-0" />
              <div>
                <div className="text-[11px] font-black leading-tight">Immeuble / Appt</div>
                <div className={`text-[8.5px] ${state.buildingType === 'immeuble' ? 'text-indigo-100' : 'text-slate-400'}`}>
                  Mono 230V (Max 50A)
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleBuildingChange('maison')}
              className={`py-1.5 px-2 rounded-lg border text-left transition-all cursor-pointer flex items-center gap-2 ${
                state.buildingType === 'maison'
                  ? 'bg-teal-700 text-white border-teal-700 shadow-xs'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
              }`}
            >
              <Home className="w-3.5 h-3.5 shrink-0" />
              <div>
                <div className="text-[11px] font-black leading-tight">Maison Unifamiliale</div>
                <div className={`text-[8.5px] ${state.buildingType === 'maison' ? 'text-teal-100' : 'text-slate-400'}`}>
                  Polyphasé (Max 80A)
                </div>
              </div>
            </button>
          </div>

          {state.buildingType === 'maison' && (
            <div className="grid grid-cols-3 gap-1.5 pt-1 border-t border-slate-200/80">
              {[
                { id: 'tri_400', label: '3×400V + N', desc: 'Tétraphasé' },
                { id: 'tri_230', label: '3×230V', desc: 'Sans neutre' },
                { id: 'mono_230', label: '1×230V', desc: 'Monophasé' },
              ].map((net) => (
                <button
                  key={net.id}
                  type="button"
                  onClick={() => handleNetworkChange(net.id as NetworkType)}
                  className={`py-1 px-1 rounded-md border text-center transition-all cursor-pointer ${
                    state.networkType === net.id
                      ? 'bg-slate-900 text-white border-slate-900 shadow-2xs font-black'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 font-bold'
                  }`}
                >
                  <div className="text-[10px] leading-tight">{net.label}</div>
                  <div className="text-[8px] opacity-70">{net.desc}</div>
                </button>
              ))}
            </div>
          )}

          {/* MODE DE CÂBLAGE DU DÉPART CLIENT :
              - Immeuble : 1 seule phase
              - Maison 1x230 : 1 seule phase
              - Maison 3x230 : 3 phases
              - Maison 3x400+N : 3 phases */}
          <div
            onClick={() => update({ activeTopic: 'client_output' })}
            className={`p-2 rounded-lg border transition-all cursor-pointer space-y-1.5 ${
              state.activeTopic === 'client_output'
                ? 'bg-teal-50/90 border-teal-500 shadow-xs ring-1 ring-teal-400'
                : 'bg-white border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[9.5px] font-bold text-slate-800 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-teal-600" />
                <span>Mode de Câblage du Départ Client :</span>
              </span>
              <span
                className={`text-[9px] font-mono font-black px-2 py-0.5 rounded-full border ${
                  isClientSinglePhase(state.buildingType, state.networkType)
                    ? 'bg-blue-50 text-blue-800 border-blue-200'
                    : 'bg-teal-50 text-teal-900 border-teal-300'
                }`}
              >
                {isClientSinglePhase(state.buildingType, state.networkType)
                  ? '⚡ 1 SEULE PHASE'
                  : '⚡⚡⚡ 3 PHASES'}
              </span>
            </div>

            <div className="flex items-center justify-between text-[8px] bg-slate-50 p-1.5 rounded border border-slate-100">
              <span className="text-slate-700 font-semibold">
                {state.buildingType === 'immeuble'
                  ? '🏢 Immeuble : 1 seule phase (Monophasé 230V)'
                  : state.networkType === 'mono_230'
                  ? '🏠 Maison 1×230V : 1 seule phase (Monophasé 230V)'
                  : state.networkType === 'tri_230'
                  ? '🏠 Maison 3×230V : 3 phases (Triphasé sans neutre)'
                  : '🏠 Maison 3×400V+N : 3 phases (Tétraphasé avec neutre)'}
              </span>
              <span className="font-mono font-bold text-slate-800 px-1.5 py-0.2 bg-white rounded border border-slate-200">
                {state.buildingType === 'immeuble' || state.networkType === 'mono_230'
                  ? '2 conducteurs (L1 + N)'
                  : state.networkType === 'tri_230'
                  ? '3 conducteurs (L1 + L2 + L3)'
                  : '4 conducteurs (L1 + L2 + L3 + N)'}
              </span>
            </div>

            {/* Visualisation des conducteurs de phase vers le tableau divisionnaire */}
            <div className="grid grid-cols-3 gap-1 text-[8px] font-mono font-bold text-center">
              <div className="p-1 rounded bg-teal-100 text-teal-900 border border-teal-300">
                Phase L1 : Active
              </div>
              <div
                className={`p-1 rounded border ${
                  isClientSinglePhase(state.buildingType, state.networkType)
                    ? 'bg-slate-100 text-slate-400 border-slate-200'
                    : 'bg-teal-100 text-teal-900 border-teal-300'
                }`}
              >
                Phase L2 : {isClientSinglePhase(state.buildingType, state.networkType) ? 'Non raccordée' : 'Active'}
              </div>
              <div
                className={`p-1 rounded border ${
                  isClientSinglePhase(state.buildingType, state.networkType)
                    ? 'bg-slate-100 text-slate-400 border-slate-200'
                    : 'bg-teal-100 text-teal-900 border-teal-300'
                }`}
              >
                Phase L3 : {isClientSinglePhase(state.buildingType, state.networkType) ? 'Non raccordée' : 'Active'}
              </div>
            </div>
          </div>
        </div>

        {/* 2. PROTECTIONS & CALIBRES (BREAKER INTERNE + DISJONCTEUR AMONT) */}
        <div className="p-2.5 bg-amber-50/70 rounded-xl border border-amber-200 space-y-2">
          {/* LIGNE A : BREAKER INTERNE */}
          <div className="space-y-1">
            <div className="flex justify-between items-center text-[10px] font-bold text-slate-800 uppercase">
              <span className="flex items-center gap-1">
                <Power className="w-3.5 h-3.5 text-teal-600" />
                Breaker Interne (Contrat) :
              </span>
              <span className="text-[10px] font-mono text-teal-800 font-black">
                {state.breakerRating} A • P. Max : {currentMaxExploitableKW.toFixed(1)} kW
              </span>
            </div>

            {/* GRILLE UNIQUE DES 8 CALIBRES DU BREAKER */}
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-1">
              {breakerOptions.map((rating) => {
                const isSingle = isClientSinglePhase(state.buildingType, state.networkType);
                let pKW = 0;
                if (isSingle) {
                  pKW = (230 * rating) / 1000;
                } else if (state.networkType === 'tri_230') {
                  pKW = (Math.sqrt(3) * 230 * rating) / 1000;
                } else {
                  pKW = (Math.sqrt(3) * 400 * rating) / 1000;
                }

                const isDisabled = state.buildingType === 'immeuble' && rating > 50;
                const isCurrent = state.breakerRating === rating;

                return (
                  <button
                    key={rating}
                    type="button"
                    disabled={isDisabled}
                    onClick={() => {
                      const newUpstream = getRecommendedUpstreamBreaker(rating, state.buildingType);
                      update({
                        breakerRating: rating,
                        upstreamBreakerRating: newUpstream,
                        internalBreakerTripped: false,
                        activeTopic: 'breaker_rating',
                      });
                    }}
                    className={`py-1 px-1 rounded-md border text-center transition-all cursor-pointer ${
                      isDisabled
                        ? 'opacity-30 cursor-not-allowed bg-slate-200/50 border-slate-200 text-slate-400 line-through'
                        : isCurrent
                        ? 'bg-teal-600 text-white font-black border-teal-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-teal-300'
                    }`}
                    title={isDisabled ? 'Non autorisé en monophasé (50A max)' : `Activer Breaker ${rating}A (${pKW.toFixed(1)} kW)`}
                  >
                    <div className="text-[10px] font-mono font-bold leading-none">{rating}A</div>
                    <div className="text-[8px] font-mono opacity-80 mt-0.5">{pKW.toFixed(1)}k</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* LIGNE B : DISJONCTEUR AMONT 25D60 (RÈGLE STRICTE DISJONCTEUR >= BREAKER) */}
          <div className="pt-1.5 border-t border-amber-200/80 space-y-1">
            <div className="flex justify-between items-center text-[10px] font-bold text-amber-950 uppercase">
              <span className="flex items-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
                Disjoncteur Amont 25D60 (Court-Circuit) :
              </span>
              <div className="flex items-center gap-1">
                <span className="text-[9.5px] font-mono font-black text-amber-900 bg-amber-200/80 px-1.5 py-0.2 rounded">
                  {state.upstreamBreakerRating} A {state.upstreamBreakerRating === state.breakerRating ? '(Égal)' : '(> Breaker)'}
                </span>
                <div className="flex items-center bg-white border border-amber-300 rounded p-0.5">
                  <button
                    type="button"
                    disabled={state.upstreamBreakerRating <= state.breakerRating}
                    onClick={() => {
                      const allowed = upstreamBreakerOptions.filter((r) => {
                        if (state.buildingType === 'immeuble' && r > 50) return false;
                        return r >= state.breakerRating;
                      });
                      const idx = allowed.indexOf(state.upstreamBreakerRating);
                      if (idx > 0) {
                        update({ upstreamBreakerRating: allowed[idx - 1], activeTopic: 'upstream_breaker' });
                      }
                    }}
                    className="w-4 h-4 rounded text-amber-800 hover:bg-amber-100 disabled:opacity-30 disabled:hover:bg-transparent flex items-center justify-center cursor-pointer transition-colors"
                    title="Diminuer (bloqué au niveau du breaker)"
                  >
                    <Minus className="w-2.5 h-2.5" />
                  </button>
                  <button
                    type="button"
                    disabled={
                      state.upstreamBreakerRating >= (state.buildingType === 'immeuble' ? 50 : 80)
                    }
                    onClick={() => {
                      const allowed = upstreamBreakerOptions.filter((r) => {
                        if (state.buildingType === 'immeuble' && r > 50) return false;
                        return r >= state.breakerRating;
                      });
                      const idx = allowed.indexOf(state.upstreamBreakerRating);
                      if (idx < allowed.length - 1 && idx !== -1) {
                        update({ upstreamBreakerRating: allowed[idx + 1], activeTopic: 'upstream_breaker' });
                      }
                    }}
                    className="w-4 h-4 rounded text-amber-800 hover:bg-amber-100 disabled:opacity-30 disabled:hover:bg-transparent flex items-center justify-center cursor-pointer transition-colors"
                    title="Augmenter calibre disjoncteur"
                  >
                    <Plus className="w-2.5 h-2.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Grille du disjoncteur amont avec calibres < Breaker verrouillés */}
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-1">
              {upstreamBreakerOptions.map((rating) => {
                const isBelowBreaker = rating < state.breakerRating;
                const isOverBuildingMax = state.buildingType === 'immeuble' && rating > 50;
                const isDisabled = isBelowBreaker || isOverBuildingMax;
                const isSelected = state.upstreamBreakerRating === rating;
                const isEqual = rating === state.breakerRating;

                return (
                  <button
                    key={rating}
                    type="button"
                    disabled={isDisabled}
                    onClick={() => update({ upstreamBreakerRating: rating, activeTopic: 'upstream_breaker' })}
                    className={`py-1 px-1 rounded-md border text-center transition-all cursor-pointer ${
                      isDisabled
                        ? 'opacity-35 cursor-not-allowed bg-slate-200/50 border-slate-200 text-slate-400'
                        : isSelected
                        ? 'bg-amber-600 text-white font-black border-amber-600 shadow-xs'
                        : 'bg-white text-slate-700 border-amber-200 hover:border-amber-300'
                    }`}
                    title={
                      isBelowBreaker
                        ? `Désactivé : le disjoncteur amont doit être ≥ ${state.breakerRating}A`
                        : isOverBuildingMax
                        ? 'Désactivé : max 50A en immeuble monophasé'
                        : `Calibre disjoncteur ${rating}A`
                    }
                  >
                    <div className="text-[10px] font-mono font-bold leading-none">{rating}A</div>
                    <div className="text-[7.5px] font-sans font-medium opacity-80 mt-0.5">
                      {isBelowBreaker ? <Lock className="w-2.5 h-2.5 mx-auto text-slate-400" /> : isEqual ? 'Égal' : '> Brk'}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* LIGNE C : ACTIONS ET TESTS DE DÉCLENCHEMENT */}
          <div className="pt-1.5 border-t border-amber-200/80 flex items-center gap-1.5">
            {state.internalBreakerTripped || state.upstreamBreakerTripped ? (
              <button
                type="button"
                onClick={() =>
                  update({
                    internalBreakerTripped: false,
                    upstreamBreakerTripped: false,
                    powerW: Math.min(state.powerW, 2000),
                  })
                }
                className="flex-1 py-1.5 px-2 bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white rounded-lg font-black text-[11px] transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1.5 animate-bounce"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Réarmer Tout ({state.internalBreakerTripped ? 'Breaker' : ''} {state.upstreamBreakerTripped ? 'Disjoncteur' : ''})
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  update({
                    upstreamBreakerTripped: true,
                    triggerExplosionTimestamp: Date.now(),
                    activeTopic: 'test_shortcircuit',
                  });
                  setShowExplosionModal(true);
                }}
                className="w-full py-1.5 px-2 bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 active:scale-98 text-white rounded-lg font-black text-[10.5px] transition-all shadow-2xs cursor-pointer flex items-center justify-center gap-1.5 group"
                title="Court-circuit franc (4500A) avec explosion et feu"
              >
                <Flame className="w-3.5 h-3.5 text-amber-200 fill-amber-300 group-hover:scale-110 transition-transform" />
                <span>💥 Court-Circuit Franc 4500A</span>
              </button>
            )}
          </div>
        </div>

        {/* 3. COURANTS DE PHASE L1, L2, L3 & DISTINCTION CLAIRE DES 2 SITUATIONS A vs B */}
        {(() => {
          const isSingle = isClientSinglePhase(state.buildingType, state.networkType);
          const i1 = computedCurrents.I1;
          const i2 = computedCurrents.I2;
          const i3 = computedCurrents.I3;
          const iN = computedCurrents.IN;
          const breakerA = state.breakerRating;
          const uPhasePhase = state.networkType === 'tri_230' ? 230 : 400;

          // Puissances apparentes par phase : S_phase = 230 × I_phase
          const s1 = 230 * i1;
          const s2 = isSingle ? 0 : 230 * i2;
          const s3 = isSingle ? 0 : 230 * i3;
          // Puissance totale : S_total = S_L1 + S_L2 + S_L3
          const sTotal = s1 + s2 + s3;

          const p1 = isSingle ? state.powerW : (state.isBalanced ? Math.round(state.powerW / 3) : (state.powerL1 || 0));
          const p2 = isSingle ? 0 : (state.isBalanced ? Math.round(state.powerW / 3) : (state.powerL2 || 0));
          const p3 = isSingle ? 0 : (state.isBalanced ? Math.round(state.powerW / 3) : (state.powerL3 || 0));
          const pTotal = p1 + p2 + p3;

          return (
            <div
              onClick={() => update({ activeTopic: 'power_active' })}
              className={`p-2.5 rounded-xl border transition-all cursor-pointer space-y-2.5 ${
                state.activeTopic === 'power_active'
                  ? 'bg-teal-50/50 border-teal-400 shadow-2xs'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-800 uppercase">
                  <Activity className="w-3.5 h-3.5 text-teal-600" />
                  <span>3. Répartition des Phases (L1, L2, L3)</span>
                </div>
                <div className="flex items-center gap-1">
                  {isSingle ? (
                    <span className="text-[7.5px] font-mono font-bold bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded border border-slate-200">
                      1 Phase (Monophasé)
                    </span>
                  ) : state.isBalanced ? (
                    <span className="text-[7.5px] font-mono font-bold bg-teal-100 text-teal-800 px-1.5 py-0.5 rounded border border-teal-300 flex items-center gap-1">
                      <Scale className="w-2.5 h-2.5 text-teal-600" />
                      Situation A : Moteur Triphasé
                    </span>
                  ) : (
                    <span className="text-[7.5px] font-mono font-bold bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded border border-amber-300 flex items-center gap-1">
                      <Shuffle className="w-2.5 h-2.5 text-amber-600" />
                      Situation B : Maison Monophasée (Max: {criticalPhase})
                    </span>
                  )}
                </div>
              </div>

              {/* COMMUTATEUR EXPLICITE DES 2 SITUATIONS : A (MOTEUR TRIPHASÉ) vs B (CHARGES MONOPHASÉES MAISON) */}
              {!isSingle && (
                <div className="space-y-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-lg border border-slate-200/80">
                    {/* BOUTON SITUATION A */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleBalance(true);
                      }}
                      className={`p-2 rounded-lg text-left transition-all cursor-pointer flex flex-col justify-between gap-1 ${
                        state.isBalanced
                          ? 'bg-white text-teal-950 shadow-xs ring-2 ring-teal-600 font-bold'
                          : 'bg-white/60 text-slate-600 hover:text-slate-900 hover:bg-white'
                      }`}
                      title="Situation A : Charge triphasée / Moteur (3 phases simultanées)"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 text-[9px] font-black uppercase text-teal-900">
                          <Scale className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                          <span>A. Charge Triphasée / Moteur</span>
                        </div>
                        {state.isBalanced && (
                          <span className="text-[6.5px] font-black uppercase bg-teal-600 text-white px-1.5 py-0.2 rounded-full">
                            Actif
                          </span>
                        )}
                      </div>
                      <div className="text-[7px] text-slate-500 font-medium">
                        Utilisation des 3 phases simultanément
                      </div>
                      <div className="p-1 rounded bg-teal-50/90 border border-teal-200 text-[7px] font-mono text-teal-950 font-bold">
                        puissance = √3 × U_phase-phase × I
                      </div>
                    </button>

                    {/* BOUTON SITUATION B */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleBalance(false);
                      }}
                      className={`p-2 rounded-lg text-left transition-all cursor-pointer flex flex-col justify-between gap-1 ${
                        !state.isBalanced
                          ? 'bg-amber-500 text-white shadow-xs ring-2 ring-amber-600 font-bold'
                          : 'bg-white/60 text-slate-600 hover:text-slate-900 hover:bg-white'
                      }`}
                      title="Situation B : Charges monophasées dans une maison (circuits phase-neutre)"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 text-[9px] font-black uppercase text-white">
                          <Shuffle className="w-3.5 h-3.5 shrink-0" />
                          <span>B. Charges Monophasées Maison</span>
                        </div>
                        {!state.isBalanced && (
                          <span className="text-[6.5px] font-black uppercase bg-white text-amber-900 px-1.5 py-0.2 rounded-full">
                            Actif
                          </span>
                        )}
                      </div>
                      <div className={`text-[7px] ${!state.isBalanced ? 'text-amber-100 font-medium' : 'text-slate-500 font-medium'}`}>
                        Chaque appareil raccordé entre phase et neutre
                      </div>
                      <div
                        className={`p-1 rounded text-[6.5px] font-mono font-bold leading-tight ${
                          !state.isBalanced
                            ? 'bg-amber-600 text-white border border-amber-400'
                            : 'bg-slate-100 text-slate-800'
                        }`}
                      >
                        S_phase = 230 × I_phase • S_total = S_L1 + S_L2 + S_L3
                      </div>
                    </button>
                  </div>

                  {/* ENCADRÉ DIDACTIQUE DÉTAILLÉ DE LA SITUATION SÉLECTIONNÉE */}
                  {state.isBalanced ? (
                    <div className="p-2 bg-teal-50/90 border border-teal-200 rounded-lg text-[8px] text-teal-950 space-y-1.5">
                      <div className="flex items-center justify-between font-bold">
                        <span className="flex items-center gap-1 text-[8.5px] text-teal-900">
                          <Scale className="w-3.5 h-3.5 text-teal-600" />
                          <span>SITUATION A : CHARGE TRIPHASÉE / MOTEUR</span>
                        </span>
                        <span className="font-mono text-[7px] bg-teal-200/80 px-1.5 py-0.2 rounded text-teal-900 font-bold">
                          U_phase-phase = {uPhasePhase} V
                        </span>
                      </div>
                      <p className="text-slate-700 leading-tight">
                        <strong>Utilisation des trois phases simultanément :</strong> un récepteur triphasé unique (moteur, compresseur de PAC, borne de recharge) absorbe une puissance parfaitement symétrique sur les 3 conducteurs.
                      </p>
                      <div className="p-1.5 bg-white rounded border border-teal-200 font-mono text-[7.5px] space-y-0.5">
                        <div className="text-teal-900 font-black">
                          • Formule : <strong>puissance = √3 × U_phase-phase × I</strong>
                        </div>
                        <div className="text-slate-800">
                          • Déduction du courant : I = {state.powerW} W ÷ (√3 × {uPhasePhase} V × {state.cosPhi || 0.95}) = <strong className="text-teal-900 font-black text-[8.5px]">{i1.toFixed(1)} A</strong>
                        </div>
                        <div className="text-slate-600 text-[7px]">
                          • Symétrie : I_L1 = I_L2 = I_L3 = <strong>{i1.toFixed(1)} A</strong>
                        </div>
                        {state.networkType === 'tri_400' && (
                          <div className="text-blue-900 pt-0.5 border-t border-teal-100 font-bold">
                            • Courant neutre : <strong>IN = 0.0 A</strong> (somme vectorielle nulle à 120°).
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="p-2 bg-amber-50/90 border border-amber-200 rounded-lg text-[8px] text-amber-950 space-y-1.5">
                      <div className="flex items-center justify-between font-bold">
                        <span className="flex items-center gap-1 text-[8.5px] text-amber-900">
                          <Shuffle className="w-3.5 h-3.5 text-amber-600" />
                          <span>SITUATION B : CHARGES MONOPHASÉES DANS UNE MAISON</span>
                        </span>
                        <span className="font-mono text-[7px] bg-amber-200 px-1.5 py-0.2 rounded text-amber-950 font-bold">
                          Raccordement Phase - Neutre (230V)
                        </span>
                      </div>
                      <p className="text-slate-700 leading-tight">
                        <strong>Chaque appareil est raccordé entre une phase et le neutre :</strong> dans une habitation, les circuits 230V sont indépendants (four, taque, lave-linge, prises, éclairage), ce qui crée un déséquilibre naturel.
                      </p>
                      <div className="p-1.5 bg-white rounded border border-amber-200 font-mono text-[7.5px] space-y-0.5">
                        <div className="text-amber-950 font-bold">
                          • Formule par phase : <strong>S_phase = 230 × I_phase</strong>
                        </div>
                        <div className="text-slate-700">
                          • S_L1 = 230 × {i1.toFixed(1)} = <strong className="text-amber-900">{Math.round(s1)} VA</strong> | S_L2 = 230 × {i2.toFixed(1)} = <strong className="text-amber-900">{Math.round(s2)} VA</strong> | S_L3 = 230 × {i3.toFixed(1)} = <strong className="text-amber-900">{Math.round(s3)} VA</strong>
                        </div>
                        <div className="text-amber-950 font-black pt-0.5 border-t border-amber-100">
                          • Puissance totale : <strong>S_total = S_L1 + S_L2 + S_L3 = {Math.round(sTotal)} VA ({(sTotal / 1000).toFixed(2)} kVA)</strong>
                        </div>
                        <div className="text-slate-600 text-[7px]">
                          • Puissance active totale : P_total = P_L1 + P_L2 + P_L3 = <strong>{pTotal} W ({(pTotal / 1000).toFixed(2)} kW)</strong>
                        </div>
                        <div className="text-[7px] text-rose-800 font-sans pt-0.5">
                          ⚠️ <strong>Règle du disjoncteur général :</strong> déclenche dès que la phase critique <strong>{criticalPhase} ({computedCurrents.Imax.toFixed(1)}A)</strong> dépasse le calibre ({breakerA}A), même si S_total reste sous la puissance souscrite !
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Jauges Phase par Phase L1, L2, L3 */}
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  {
                    label: 'L1',
                    sub: 'Four / Taque',
                    watts: isSingle ? state.powerW : state.powerL1 || 0,
                    a: i1,
                    va: s1,
                    active: true,
                    key: 'L1' as const,
                  },
                  {
                    label: 'L2',
                    sub: 'Lave-linge / Ballon',
                    watts: isSingle ? 0 : state.powerL2 || 0,
                    a: isSingle ? null : i2,
                    va: s2,
                    active: !isSingle,
                    key: 'L2' as const,
                  },
                  {
                    label: 'L3',
                    sub: 'Salon / Prises',
                    watts: isSingle ? 0 : state.powerL3 || 0,
                    a: isSingle ? null : i3,
                    va: s3,
                    active: !isSingle,
                    key: 'L3' as const,
                  },
                ].map((p) => {
                  const val = p.a !== null ? p.a : null;
                  const isPhaseOver = val !== null && val > breakerA;
                  const ratioPhase = val !== null ? Math.min(100, (val / breakerA) * 100) : 0;

                  return (
                    <div
                      key={p.label}
                      className={`p-1.5 rounded-lg border flex flex-col justify-between transition-all ${
                        !p.active
                          ? 'bg-slate-100/60 border-slate-200 text-slate-400 opacity-60'
                          : isPhaseOver
                          ? 'bg-rose-50 border-rose-400 ring-1 ring-rose-400 text-rose-950 shadow-2xs'
                          : p.key === criticalPhase && !state.isBalanced && !isSingle
                          ? 'bg-amber-50/70 border-amber-300 text-slate-800 shadow-2xs'
                          : 'bg-slate-50/80 border-slate-200 text-slate-800'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] font-black">{p.label}</span>
                          {isPhaseOver && (
                            <span className="text-[6.5px] font-black bg-rose-600 text-white px-1 py-0.2 rounded animate-pulse">
                              &gt; {breakerA}A
                            </span>
                          )}
                          {!isPhaseOver && p.key === criticalPhase && !state.isBalanced && !isSingle && (
                            <span className="text-[6.5px] font-bold bg-amber-200 text-amber-900 px-1 py-0.2 rounded">
                              MAX
                            </span>
                          )}
                        </div>
                        <div className="text-[7px] text-slate-500 font-sans truncate">
                          {p.active ? p.sub : '(Non câblé)'}
                        </div>
                      </div>

                      <div className="my-1 text-center space-y-0.5">
                        <div className="text-xs font-mono font-black text-slate-900">
                          {val !== null ? `${val.toFixed(1)} A` : '0.0 A'}
                        </div>
                        <div className="text-[7.5px] font-mono text-slate-700 font-bold">
                          {p.active ? `${p.watts} W` : '-'}
                        </div>
                        {p.active && val !== null && (
                          <div className="text-[6.5px] font-mono text-slate-500 bg-white/80 rounded px-0.5 py-0.2 border border-slate-200/60" title={`S_phase = 230 × I = ${Math.round(230 * val)} VA`}>
                            S = <strong>{Math.round(230 * val)} VA</strong>
                          </div>
                        )}

                        {/* Calcul direct montrant comment l'ampérage a été trouvé */}
                        {p.active && val !== null && (
                          <div
                            className="text-[6px] font-mono text-teal-900 bg-teal-100/70 border border-teal-200 rounded px-1 py-0.2"
                            title={`Comment on a trouvé ${val.toFixed(1)}A : I = Puissance ÷ (Tension × cos φ)`}
                          >
                            {state.networkType === 'tri_230' && state.isBalanced ? (
                              <span>{p.watts}W ÷ 378.5 = <strong>{val.toFixed(1)}A</strong></span>
                            ) : (
                              <span>{p.watts}W ÷ 218.5 = <strong>{val.toFixed(1)}A</strong></span>
                            )}
                          </div>
                        )}

                        {/* Barre de charge par phase */}
                        {p.active && (
                          <div className="w-full h-1 bg-slate-200 rounded-full overflow-hidden mt-1">
                            <div
                              className={`h-full rounded-full transition-all ${
                                isPhaseOver
                                  ? 'bg-rose-600'
                                  : ratioPhase > 80
                                  ? 'bg-amber-500'
                                  : 'bg-teal-500'
                              }`}
                              style={{ width: `${ratioPhase}%` }}
                            />
                          </div>
                        )}
                      </div>

                      {/* Contrôles individuels par phase en mode déséquilibré */}
                      {p.active && !state.isBalanced && !isSingle && (
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className="pt-1 border-t border-slate-200/80 flex flex-col gap-1"
                        >
                          <div className="flex items-center justify-between gap-1">
                            <button
                              type="button"
                              onClick={() => handlePhasePowerChange(p.key, Math.max(0, p.watts - 500))}
                              className="w-4 h-4 bg-white hover:bg-slate-200 rounded border border-slate-300 text-slate-700 flex items-center justify-center text-[9px] font-black cursor-pointer shadow-2xs"
                              title="Réduire 500W sur cette phase"
                            >
                              -
                            </button>
                            <span className="text-[6.5px] font-mono text-slate-500 font-bold">
                              {(p.watts / 1000).toFixed(1)}kW
                            </span>
                            <button
                              type="button"
                              onClick={() => handlePhasePowerChange(p.key, p.watts + 500)}
                              className="w-4 h-4 bg-white hover:bg-slate-200 rounded border border-slate-300 text-slate-700 flex items-center justify-center text-[9px] font-black cursor-pointer shadow-2xs"
                              title="Augmenter 500W sur cette phase"
                            >
                              +
                            </button>
                          </div>

                          <input
                            type="range"
                            min="0"
                            max="9000"
                            step="100"
                            value={p.watts}
                            onChange={(e) => handlePhasePowerChange(p.key, Number(e.target.value))}
                            className="w-full h-1 bg-slate-200 rounded cursor-pointer accent-amber-600"
                            title={`Ajuster la puissance absorbée sur ${p.label}`}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* SYNTHÈSE DE LA PUISSANCE TOTALE S_total = S_L1 + S_L2 + S_L3 */}
              {!isSingle && (
                <div className="p-1.5 bg-slate-50 rounded-lg border border-slate-200 flex flex-wrap items-center justify-between gap-1 text-[7.5px] font-mono">
                  <div className="flex items-center gap-1 text-slate-700 font-bold">
                    <span className="font-sans uppercase text-[6.5px] text-slate-500">Puissance Totale :</span>
                    <span className="bg-white px-1.5 py-0.5 rounded border border-slate-200 text-teal-950 font-black">
                      S_total = S_L1 + S_L2 + S_L3 = {(sTotal / 1000).toFixed(2)} kVA ({Math.round(sTotal)} VA)
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-slate-600">
                    <span>P_total = {(pTotal / 1000).toFixed(2)} kW</span>
                    <span className="text-slate-300">|</span>
                    <span className={computedCurrents.Imax > breakerA ? 'text-rose-600 font-bold' : 'text-slate-700'}>
                      Phase critique : {criticalPhase} ({computedCurrents.Imax.toFixed(1)} A / {breakerA} A)
                    </span>
                  </div>
                </div>
              )}

              {/* CONDUCTEUR NEUTRE (EN RÉSEAU 3x400V+N) */}
              {!isSingle && state.networkType === 'tri_400' && (
                <div className="p-1.5 bg-blue-50/70 border border-blue-200 rounded-lg flex items-center justify-between text-[8px] font-sans text-blue-950">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-black bg-blue-600 text-white px-1.5 py-0.2 rounded text-[7.5px]">
                      Neutre (N)
                    </span>
                    <span>
                      Courant retour dans le neutre : <strong className="font-mono">{iN.toFixed(1)} A</strong>
                    </span>
                  </div>
                  <span className="text-[7px] text-blue-700 font-mono">
                    {state.isBalanced
                      ? 'IN = 0 A (Équilibré)'
                      : `Résultante vectorielle : ${iN.toFixed(1)} A`}
                  </span>
                </div>
              )}

              {/* PRÉRÉGLAGES DE CIRCUITS DOMESTIQUES RÉALISTES (1 CLIC) */}
              {!isSingle && !state.isBalanced && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="pt-1 border-t border-slate-200/80 space-y-1"
                >
                  <div className="flex items-center justify-between text-[7px] font-bold uppercase text-slate-500">
                    <span>Scénarios réels de consommation :</span>
                    <span className="text-amber-700 font-semibold">Circuits indépendants</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        update({
                          isBalanced: false,
                          powerL1: 4200,
                          powerL2: 1200,
                          powerL3: 600,
                          powerW: 6000,
                        });
                      }}
                      className="text-[7.5px] px-1.5 py-0.5 bg-white hover:bg-slate-100 border border-slate-300 rounded font-semibold text-slate-800 cursor-pointer shadow-2xs"
                    >
                      🍳 Taque/Four sur L1 (4.2kW)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        update({
                          isBalanced: false,
                          powerL1: 800,
                          powerL2: 3500,
                          powerL3: 700,
                          powerW: 5000,
                        });
                      }}
                      className="text-[7.5px] px-1.5 py-0.5 bg-white hover:bg-slate-100 border border-slate-300 rounded font-semibold text-slate-800 cursor-pointer shadow-2xs"
                    >
                      🧺 Lave-linge sur L2 (3.5kW)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const overloadWatts = Math.round(breakerA * 1.15 * 230);
                        update({
                          isBalanced: false,
                          powerL1: overloadWatts,
                          powerL2: 1000,
                          powerL3: 500,
                          powerW: overloadWatts + 1500,
                        });
                      }}
                      className="text-[7.5px] px-1.5 py-0.5 bg-rose-50 hover:bg-rose-100 border border-rose-300 rounded font-bold text-rose-800 cursor-pointer shadow-2xs"
                    >
                      ⚡ Surcharge L1 (&gt; {breakerA}A)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggleBalance(true)}
                      className="text-[7.5px] px-1.5 py-0.5 bg-teal-50 hover:bg-teal-100 border border-teal-300 rounded font-bold text-teal-800 cursor-pointer shadow-2xs ml-auto"
                    >
                      ⚖️ Égaliser L1=L2=L3
                    </button>
                  </div>
                </div>
              )}

              {/* DÉMONSTRATION PÉDAGOGIQUE : COMMENT ON A TROUVÉ L'AMPÉRAGE DE CHAQUE PHASE (A vs B) */}
              <div className="p-2 bg-slate-50/90 rounded-lg border border-slate-200 text-[7.5px] text-slate-700 space-y-1.5">
                <div className="flex items-center justify-between font-bold text-slate-800 text-[7px] uppercase">
                  <div className="flex items-center gap-1">
                    <Calculator className="w-3.5 h-3.5 text-teal-600" />
                    <span className="text-teal-950 font-black">Comment on a trouvé l&apos;ampérage de chaque phase :</span>
                  </div>
                  <span className="text-teal-700 font-mono text-[6.5px]">Tension 230V • cos φ={state.cosPhi || 0.95}</span>
                </div>

                {state.isBalanced && !isSingle ? (
                  /* SITUATION A */
                  <div className="space-y-1">
                    <div className="p-1 bg-teal-50/80 rounded border border-teal-200 text-teal-950">
                      <div className="font-bold flex items-center gap-1 text-[7.5px]">
                        <Scale className="w-3 h-3 text-teal-700" />
                        <span>A. CHARGE TRIPHASÉE / MOTEUR (Utilisation des 3 phases simultanément)</span>
                      </div>
                      <div className="font-mono text-[7px] mt-0.5">
                        Formule : <strong>puissance = √3 × U_phase-phase × I</strong> (active : P = √3 × U × I × cos φ)
                      </div>
                    </div>

                    <div className="p-1.5 bg-white rounded border border-slate-200 font-mono text-[7px] text-slate-800 space-y-0.5">
                      <div>
                        • Tension entre phases : <strong>U_phase-phase = {uPhasePhase} V</strong>
                      </div>
                      <div>
                        • Calcul du courant : I = {state.powerW} W ÷ (√3 × {uPhasePhase} V × {state.cosPhi || 0.95})
                      </div>
                      <div className="text-teal-900 font-black text-[8px]">
                        ➔ I = {state.powerW} W ÷ {(Math.sqrt(3) * uPhasePhase * (state.cosPhi || 0.95)).toFixed(1)} = <span className="text-[9px] bg-teal-100 px-1 py-0.2 rounded border border-teal-300">{i1.toFixed(1)} A</span> sur L1, L2, L3
                      </div>
                    </div>
                  </div>
                ) : !isSingle ? (
                  /* SITUATION B */
                  <div className="space-y-1">
                    <div className="p-1 bg-amber-50/90 rounded border border-amber-200 text-amber-950">
                      <div className="font-bold flex items-center gap-1 text-[7.5px]">
                        <Shuffle className="w-3 h-3 text-amber-700" />
                        <span>B. CHARGES MONOPHASÉES DANS UNE MAISON (Raccordées entre phase et neutre)</span>
                      </div>
                      <div className="font-mono text-[7px] mt-0.5">
                        Formules : <strong>S_phase = 230 × I_phase</strong> • <strong>S_total = S_L1 + S_L2 + S_L3</strong>
                      </div>
                    </div>

                    <div className="p-1.5 bg-white rounded border border-slate-200 font-mono text-[7px] text-slate-800 space-y-1">
                      <div className="text-slate-600 font-sans text-[6.5px]">
                        Courant de chaque phase : <strong>I_phase = P_phase ÷ (230 × cos φ) = P_phase ÷ 218.5</strong>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-1">
                        <div className="p-1 rounded bg-amber-50/50 border border-amber-200">
                          <div className="text-[6.5px] font-sans font-bold text-amber-900">Phase L1 :</div>
                          <div>{(state.powerL1 || 0)} W ÷ 218.5 = <strong className="text-amber-950 font-black text-[8px]">{i1.toFixed(1)} A</strong></div>
                          <div className="text-[6px] text-slate-500">S_L1 = 230 × {i1.toFixed(1)} = {Math.round(s1)} VA</div>
                        </div>
                        <div className="p-1 rounded bg-amber-50/50 border border-amber-200">
                          <div className="text-[6.5px] font-sans font-bold text-amber-900">Phase L2 :</div>
                          <div>{(state.powerL2 || 0)} W ÷ 218.5 = <strong className="text-amber-950 font-black text-[8px]">{i2.toFixed(1)} A</strong></div>
                          <div className="text-[6px] text-slate-500">S_L2 = 230 × {i2.toFixed(1)} = {Math.round(s2)} VA</div>
                        </div>
                        <div className="p-1 rounded bg-amber-50/50 border border-amber-200">
                          <div className="text-[6.5px] font-sans font-bold text-amber-900">Phase L3 :</div>
                          <div>{(state.powerL3 || 0)} W ÷ 218.5 = <strong className="text-amber-950 font-black text-[8px]">{i3.toFixed(1)} A</strong></div>
                          <div className="text-[6px] text-slate-500">S_L3 = 230 × {i3.toFixed(1)} = {Math.round(s3)} VA</div>
                        </div>
                      </div>
                      <div className="pt-0.5 border-t border-slate-100 flex flex-wrap items-center justify-between text-[7px]">
                        <span>Somme totale : <strong>S_total = {Math.round(s1)} + {Math.round(s2)} + {Math.round(s3)} = {Math.round(sTotal)} VA ({(sTotal / 1000).toFixed(2)} kVA)</strong></span>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* MONOPHASÉ */
                  <div className="p-1.5 bg-white rounded border border-slate-200 font-mono text-[7px] text-slate-800 space-y-0.5">
                    <div>• <strong>Formule :</strong> I = P ÷ (230 × {state.cosPhi || 0.95}) = P ÷ 218.5</div>
                    <div className="text-teal-900 font-bold">
                      • Phase L1 : {state.powerW} W ÷ 218.5 = <span className="text-[8.5px] font-black">{i1.toFixed(1)} A</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })()}

        {/* 4. SURCHARGE & RACCORDEMENT RGIE AVEC BARRE MULTICOULEUR (BLEU -> VERT -> ORANGE -> ROUGE) */}
        {(() => {
          const upA = state.upstreamBreakerRating;
          const breakerA = state.breakerRating;
          const isMono = state.networkType === 'mono_230' || state.buildingType === 'immeuble';
          const cableSection = upA <= 40 ? (isMono ? '2×10 mm²' : '4×10 mm²') : upA <= 63 ? (isMono ? '2×16 mm²' : '4×16 mm²') : '4×25 mm²';
          const conduitDiam = upA <= 63 ? 'Ø 50 mm' : 'Ø 63 mm';

          // Surcharge max : 160% de l'ampérage du breaker contractuel
          const maxOverloadA = Math.round(breakerA * 1.6);
          const currentA = Math.min(maxOverloadA, Math.max(0, currentCalculatedA));
          const currentPercent = Math.min(100, Math.max(0, (currentA / maxOverloadA) * 100));
          const breakerThresholdPercent = (breakerA / maxOverloadA) * 100;

          // Ratio par rapport au calibre du breaker interne
          const ratio = currentA / breakerA;
          const isOverloaded = ratio > 1.0;

          // Progression de la couleur de la barre : Bleu -> Vert -> Orange -> Rouge
          let barBgClass = 'bg-blue-500';
          let barTextClass = 'text-blue-600';
          let badgeClass = 'bg-blue-100 text-blue-800 border-blue-300';
          let glowClass = 'shadow-[0_0_8px_rgba(59,130,246,0.5)]';
          let statusLabel = 'Charge Faible';
          let statusIcon = '🔵';

          if (ratio <= 0.45) {
            barBgClass = 'bg-blue-500';
            barTextClass = 'text-blue-600';
            badgeClass = 'bg-blue-100 text-blue-800 border-blue-300';
            glowClass = 'shadow-[0_0_8px_rgba(59,130,246,0.5)]';
            statusLabel = 'Charge Faible';
            statusIcon = '🔵';
          } else if (ratio <= 0.80) {
            barBgClass = 'bg-emerald-500';
            barTextClass = 'text-emerald-600';
            badgeClass = 'bg-emerald-100 text-emerald-800 border-emerald-300';
            glowClass = 'shadow-[0_0_8px_rgba(16,185,129,0.5)]';
            statusLabel = 'Charge Nominale OK';
            statusIcon = '🟢';
          } else if (ratio <= 1.0) {
            barBgClass = 'bg-amber-500';
            barTextClass = 'text-amber-600';
            badgeClass = 'bg-amber-100 text-amber-900 border-amber-300';
            glowClass = 'shadow-[0_0_10px_rgba(245,158,11,0.6)]';
            statusLabel = 'Seuil Breaker Proche';
            statusIcon = '🟠';
          } else {
            barBgClass = 'bg-rose-600';
            barTextClass = 'text-rose-600';
            badgeClass = 'bg-rose-100 text-rose-900 border-rose-400 font-black animate-pulse';
            glowClass = 'shadow-[0_0_14px_rgba(239,68,68,0.8)]';
            statusLabel = '⚠️ SURINTENSITÉ DE SURCHARGE';
            statusIcon = '🔴';
          }

          return (
            <div
              onClick={() => update({ activeTopic: 'cable_section' })}
              className={`p-2.5 rounded-xl border transition-all cursor-pointer shadow-2xs space-y-2 ${
                isOverloaded
                  ? 'bg-rose-50/70 border-rose-300 shadow-xs'
                  : state.activeTopic === 'cable_section'
                  ? 'bg-teal-50/90 border-teal-400 text-slate-900 shadow-xs'
                  : 'bg-slate-50/90 hover:bg-slate-100/90 border-slate-200 text-slate-800'
              }`}
            >
              {/* Entête avec titre et badge de surcharge */}
              <div className="flex items-center justify-between text-[10px] font-bold uppercase">
                <span className="flex items-center gap-1.5 text-slate-800">
                  <Zap className={`w-3.5 h-3.5 ${isOverloaded ? 'text-rose-600 animate-bounce' : 'text-teal-600'}`} />
                  <span>4. Surcharge & Câblage RGIE</span>
                </span>
                <span className={`text-[8px] font-mono font-bold px-1.5 py-0.2 rounded border ${badgeClass}`}>
                  {statusIcon} {statusLabel}
                </span>
              </div>

              {/* Barre de surcharge interactive */}
              <div className="space-y-1 bg-white p-2 rounded-lg border border-slate-200 shadow-2xs">
                {/* Métriques d'intensité en direct */}
                <div className="flex items-center justify-between">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-[8.5px] uppercase font-bold text-slate-500">
                      {isMono || state.isBalanced ? 'Courant :' : `Courant max (${criticalPhase}) :`}
                    </span>
                    <span className={`text-sm font-black font-mono tracking-tight ${barTextClass}`}>
                      {currentA.toFixed(1)} A
                    </span>
                    <span className="text-[8.5px] text-slate-400 font-mono">
                      ({(state.powerW / 1000).toFixed(2)} kW total)
                    </span>
                  </div>
                  <div className="text-[8.5px] font-mono font-bold text-slate-600">
                    Seuil Breaker : <span className="text-slate-900 font-black">{breakerA} A</span>
                  </div>
                </div>

                {/* Barre de progression avec dégradé et curseur */}
                <div className="relative pt-3 pb-1">
                  {/* Marqueur du seuil Breaker */}
                  <div
                    className="absolute top-0 -translate-x-1/2 flex flex-col items-center pointer-events-none z-10"
                    style={{ left: `${breakerThresholdPercent}%` }}
                  >
                    <span className="text-[7px] font-mono font-black bg-slate-800 text-white px-1 py-0.2 rounded whitespace-nowrap shadow-2xs">
                      Breaker {breakerA}A
                    </span>
                    <div className="w-0.5 h-1 bg-slate-800" />
                  </div>

                  {/* Piste de fond avec guide subtil des 4 couleurs */}
                  <div className="relative w-full h-3 bg-slate-100 rounded-full border border-slate-300 overflow-hidden shadow-inner">
                    {/* Dégradé sous-jacent bleu -> vert -> orange -> rouge */}
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-100 via-emerald-100 via-amber-100 to-rose-200 opacity-60 pointer-events-none" />

                    {/* Repère vertical breaker */}
                    <div
                      className="absolute top-0 bottom-0 w-0.5 bg-slate-500/70 z-1 pointer-events-none"
                      style={{ left: `${breakerThresholdPercent}%` }}
                    />

                    {/* Remplissage de la barre dynamique selon la valeur actuelle */}
                    <div
                      className={`h-full transition-all duration-75 rounded-full ${barBgClass} ${glowClass}`}
                      style={{ width: `${currentPercent}%` }}
                    />
                  </div>

                  {/* Input range invisible superposé pour le contrôle tactile et souris */}
                  <input
                    type="range"
                    min="0"
                    max={maxOverloadA}
                    step="0.5"
                    value={Math.round(currentA * 10) / 10}
                    onChange={(e) => handleOverloadSliderChange(Number(e.target.value))}
                    className="absolute inset-x-0 bottom-1 top-3 w-full h-3 opacity-0 cursor-pointer z-20"
                    title="Glisser pour tester l'intensité et la surintensité de surcharge"
                  />
                </div>

                {/* Échelle colorée explicative : Bleu, Vert, Orange, Rouge */}
                <div className="flex items-center justify-between text-[7px] font-bold pt-0.5 border-t border-slate-100">
                  <span className="text-blue-600 flex items-center gap-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    0A (Bleu)
                  </span>
                  <span className="text-emerald-600 flex items-center gap-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Nominal (Vert)
                  </span>
                  <span className="text-amber-600 flex items-center gap-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    Seuil {breakerA}A (Orange)
                  </span>
                  <span className="text-rose-600 flex items-center gap-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />
                    Max {maxOverloadA}A (Rouge)
                  </span>
                </div>
              </div>

              {/* Message d'alerte instantanée en cas de surintensité de surcharge */}
              {isOverloaded && (
                <div className="p-1.5 bg-rose-100/90 border border-rose-300 rounded-lg text-rose-900 text-[8.5px] flex items-center justify-between gap-1 animate-pulse">
                  <div className="flex items-center gap-1.5 font-bold">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                    <span>
                      ⚠️ <strong>Surintensité de surcharge :</strong> Breaker interne coupé (
                      {!isMono && !state.isBalanced ? `Phase ${criticalPhase} : ` : ''}
                      {currentA.toFixed(1)}A &gt; {breakerA}A)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (isMono || state.isBalanced) {
                        handleOverloadSliderChange(Math.round(breakerA * 0.7));
                      } else {
                        const safeW = Math.round(breakerA * 0.7 * 230);
                        handlePhasePowerChange(criticalPhase as 'L1' | 'L2' | 'L3', safeW);
                      }
                    }}
                    className="px-2 py-0.5 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white rounded text-[7.5px] font-black cursor-pointer shadow-2xs shrink-0"
                  >
                    Rétablir (&lt; {breakerA}A)
                  </button>
                </div>
              )}

              {/* Grille des caractéristiques normalisées RGIE */}
              <div className="grid grid-cols-3 gap-1 text-center">
                <div className="p-1 rounded-lg bg-white border border-slate-200">
                  <span className="text-[7px] text-slate-500 font-bold uppercase block">Câble EXVB</span>
                  <span className="text-[10px] font-mono font-black text-teal-800">{cableSection}</span>
                </div>
                <div className="p-1 rounded-lg bg-white border border-slate-200">
                  <span className="text-[7px] text-slate-500 font-bold uppercase block">Coffret GRD</span>
                  <span className="text-[10px] font-mono font-black text-slate-800">25D60</span>
                </div>
                <div className="p-1 rounded-lg bg-white border border-slate-200">
                  <span className="text-[7px] text-slate-500 font-bold uppercase block">Diff. Tête</span>
                  <span className="text-[10px] font-mono font-black text-indigo-800">300 mA</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-[7.5px] text-slate-500 font-medium px-0.5">
                <span>Gaine rouge : <strong className="text-slate-700 font-mono">{conduitDiam}</strong></span>
                <span className="text-teal-700 font-bold">ΔU &lt; 0.5% (Conforme RGIE)</span>
              </div>
            </div>
          );
        })()}

        {/* 5. CALCULS DE PUISSANCE EN RÉSEAU (MONO 230V, 3×230V, 3×400V+N) */}
        {(() => {
          const rating = state.breakerRating;
          const cosPhi = state.cosPhi || 1;
          const sqrt3 = Math.sqrt(3);

          // Puissances maximales contractuelles (cos phi = 1 par défaut)
          const pMonoKW = (230 * rating * cosPhi) / 1000;
          const pTri230KW = (sqrt3 * 230 * rating * cosPhi) / 1000;
          const pTri400KW = (sqrt3 * 400 * rating * cosPhi) / 1000;

          // Courant absorbé pour la puissance active actuelle
          const pWatts = Math.max(state.powerW, 100);
          const iMono = pWatts / (230 * cosPhi);
          const iTri230 = pWatts / (sqrt3 * 230 * cosPhi);
          const iTri400 = pWatts / (sqrt3 * 400 * cosPhi);

          return (
            <div className="p-2 rounded-xl border border-slate-200 bg-white space-y-1.5 shadow-2xs">
              <div className="flex items-center justify-between text-[10px] font-bold text-slate-800 uppercase">
                <span className="flex items-center gap-1.5">
                  <Calculator className="w-3.5 h-3.5 text-teal-600" />
                  <span>5. Calculs de Puissance Réseau ({rating}A)</span>
                </span>
                <span className="text-[7.5px] font-mono text-slate-500 font-medium">
                  U : 230V / 400V
                </span>
              </div>

              {/* 3 Cartes dynamiques des 3 réseaux avec formule d'ampérage */}
              <div className="grid grid-cols-3 gap-1 text-left">
                {/* 1. MONOPHASÉ 1×230V */}
                <div
                  onClick={() => handleNetworkChange('mono_230')}
                  className={`p-1.5 rounded-lg border transition-all cursor-pointer flex flex-col justify-between ${
                    state.networkType === 'mono_230'
                      ? 'bg-blue-50 border-blue-400 ring-1 ring-blue-400 shadow-2xs'
                      : 'bg-slate-50/60 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[8.5px] font-black text-blue-900">Mono 230V</span>
                      {state.networkType === 'mono_230' && (
                        <span className="text-[6.5px] font-black bg-blue-600 text-white px-1 py-0.2 rounded-full">
                          ACTIF
                        </span>
                      )}
                    </div>
                    <div className="text-[6.5px] font-mono text-slate-500 mt-0.5">
                      P = U × I × cos φ
                    </div>
                    <div className="text-[6.5px] font-mono text-blue-900 font-bold">
                      I = P ÷ (230 × cos φ)
                    </div>
                  </div>
                  <div className="mt-1">
                    <div className="text-xs font-black font-mono text-blue-950">
                      {pMonoKW.toFixed(1)} <span className="text-[8px] font-sans font-normal text-slate-600">kW</span>
                    </div>
                    <div className="text-[6.5px] font-mono text-slate-500 mt-0.2">
                      230V × {rating}A
                    </div>
                    <div className="text-[6.5px] font-mono text-blue-800 font-black border-t border-blue-100/80 pt-0.5 mt-0.5">
                      I = {iMono.toFixed(1)} A
                    </div>
                  </div>
                </div>

                {/* 2. TRIPHASÉ 3×230V */}
                <div
                  onClick={() => {
                    if (state.buildingType === 'immeuble') {
                      handleBuildingChange('maison');
                    }
                    handleNetworkChange('tri_230');
                  }}
                  className={`p-1.5 rounded-lg border transition-all cursor-pointer flex flex-col justify-between ${
                    state.networkType === 'tri_230'
                      ? 'bg-amber-50 border-amber-400 ring-1 ring-amber-400 shadow-2xs'
                      : 'bg-slate-50/60 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[8.5px] font-black text-amber-900">3×230V</span>
                      {state.networkType === 'tri_230' && (
                        <span className="text-[6.5px] font-black bg-amber-600 text-white px-1 py-0.2 rounded-full">
                          ACTIF
                        </span>
                      )}
                    </div>
                    <div className="text-[6.5px] font-mono text-slate-500 mt-0.5">
                      P = √3 × U × I × cos φ
                    </div>
                    <div className="text-[6.5px] font-mono text-amber-900 font-bold">
                      I = P ÷ (√3 × 230 × cos φ)
                    </div>
                  </div>
                  <div className="mt-1">
                    <div className="text-xs font-black font-mono text-amber-950">
                      {pTri230KW.toFixed(1)} <span className="text-[8px] font-sans font-normal text-slate-600">kW</span>
                    </div>
                    <div className="text-[6.5px] font-mono text-slate-500 mt-0.2">
                      1.732 × 230 × {rating}A
                    </div>
                    <div className="text-[6.5px] font-mono text-amber-800 font-black border-t border-amber-100/80 pt-0.5 mt-0.5">
                      I = {iTri230.toFixed(1)} A <span className="text-[6px] text-slate-400 font-normal">(+73%)</span>
                    </div>
                  </div>
                </div>

                {/* 3. TÉTRAPHASÉ 3×400V+N */}
                <div
                  onClick={() => {
                    if (state.buildingType === 'immeuble') {
                      handleBuildingChange('maison');
                    }
                    handleNetworkChange('tri_400');
                  }}
                  className={`p-1.5 rounded-lg border transition-all cursor-pointer flex flex-col justify-between ${
                    state.networkType === 'tri_400'
                      ? 'bg-teal-50 border-teal-500 ring-1 ring-teal-500 shadow-2xs'
                      : 'bg-slate-50/60 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[8.5px] font-black text-teal-950">3×400V+N</span>
                      {state.networkType === 'tri_400' && (
                        <span className="text-[6.5px] font-black bg-teal-700 text-white px-1 py-0.2 rounded-full">
                          ACTIF
                        </span>
                      )}
                    </div>
                    <div className="text-[6.5px] font-mono text-slate-500 mt-0.5">
                      P = √3 × 400 × I × cos φ
                    </div>
                    <div className="text-[6.5px] font-mono text-teal-900 font-bold">
                      I_ph = P_ph ÷ (230 × cos φ)
                    </div>
                  </div>
                  <div className="mt-1">
                    <div className="text-xs font-black font-mono text-teal-950">
                      {pTri400KW.toFixed(1)} <span className="text-[8px] font-sans font-normal text-slate-600">kW</span>
                    </div>
                    <div className="text-[6.5px] font-mono text-slate-500 mt-0.2">
                      3 × 230V × {rating}A
                    </div>
                    <div className="text-[6.5px] font-mono text-teal-800 font-black border-t border-teal-100/80 pt-0.5 mt-0.5">
                      I = {iTri400.toFixed(1)} A <span className="text-[6px] text-teal-600 font-bold">(3× Mono)</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Synthèse des formules exactes et démonstration pas à pas */}
              <div className="p-2 bg-slate-50 rounded-lg border border-slate-200 text-[7px] font-mono text-slate-700 space-y-1.5">
                <div className="flex justify-between items-center text-[7px] font-sans font-bold text-slate-600 uppercase">
                  <span className="flex items-center gap-1 text-slate-800">
                    <Calculator className="w-3 h-3 text-teal-600" />
                    <span>Détail mathématique : comment trouver l&apos;ampérage (I) de chaque phase</span>
                  </span>
                  <span className="text-teal-700 font-semibold lowercase">cos φ = {cosPhi}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
                  {/* Mono */}
                  <div className={`p-1.5 rounded border text-left ${state.networkType === 'mono_230' ? 'bg-blue-50 border-blue-300 ring-1 ring-blue-300 text-blue-950 shadow-2xs' : 'bg-white border-slate-200'}`}>
                    <div className="font-sans font-black text-[7.5px] text-blue-900 flex justify-between items-center">
                      <span>1×230V Monophasé</span>
                      {state.networkType === 'mono_230' && <span className="text-[6px] bg-blue-600 text-white px-1 py-0.2 rounded font-mono">ACTIF</span>}
                    </div>
                    <div className="text-[6.5px] text-slate-500 mt-0.5">
                      Formule : <strong className="text-blue-900">I = P ÷ (230 × cos φ)</strong>
                    </div>
                    <div className="mt-1 p-1 bg-blue-100/50 rounded text-[6.5px] text-blue-950 font-mono">
                      I = {state.powerW}W ÷ 218.5V<br />
                      = <strong className="text-[8px] text-blue-900 font-black">{computedCurrents.I1.toFixed(1)} A</strong>
                    </div>
                  </div>

                  {/* 3x230V */}
                  <div className={`p-1.5 rounded border text-left ${state.networkType === 'tri_230' ? 'bg-amber-50 border-amber-300 ring-1 ring-amber-300 text-amber-950 shadow-2xs' : 'bg-white border-slate-200'}`}>
                    <div className="font-sans font-black text-[7.5px] text-amber-900 flex justify-between items-center">
                      <span>3×230V Triphasé</span>
                      {state.networkType === 'tri_230' && <span className="text-[6px] bg-amber-600 text-white px-1 py-0.2 rounded font-mono">ACTIF</span>}
                    </div>
                    <div className="text-[6.5px] text-slate-500 mt-0.5">
                      Formule : <strong className="text-amber-900">I = P ÷ (√3 × 230 × cos φ)</strong>
                    </div>
                    <div className="mt-1 p-1 bg-amber-100/50 rounded text-[6.5px] text-amber-950 font-mono">
                      {state.isBalanced ? (
                        <>
                          I = {state.powerW}W ÷ (1.732 × 230 × {cosPhi})<br />
                          = {state.powerW}W ÷ 378.5V = <strong className="text-[8px] text-amber-900 font-black">{computedCurrents.I1.toFixed(1)} A</strong>
                        </>
                      ) : (
                        <>
                          Imax phase critique = <strong className="text-[8px] text-amber-900 font-black">{computedCurrents.Imax.toFixed(1)} A</strong><br />
                          (L1: {computedCurrents.I1.toFixed(1)}A | L2: {computedCurrents.I2.toFixed(1)}A | L3: {computedCurrents.I3.toFixed(1)}A)
                        </>
                      )}
                    </div>
                  </div>

                  {/* 3x400V+N */}
                  <div className={`p-1.5 rounded border text-left ${state.networkType === 'tri_400' ? 'bg-teal-50 border-teal-300 ring-1 ring-teal-300 text-teal-950 shadow-2xs' : 'bg-white border-slate-200'}`}>
                    <div className="font-sans font-black text-[7.5px] text-teal-950 flex justify-between items-center">
                      <span>3×400V+N Tétraphasé</span>
                      {state.networkType === 'tri_400' && <span className="text-[6px] bg-teal-700 text-white px-1 py-0.2 rounded font-mono">ACTIF</span>}
                    </div>
                    <div className="text-[6.5px] text-slate-500 mt-0.5">
                      Par phase : <strong className="text-teal-900">I_ph = P_ph ÷ (230 × cos φ)</strong>
                    </div>
                    <div className="mt-1 p-1 bg-teal-100/50 rounded text-[6.5px] text-teal-950 font-mono">
                      {state.isBalanced ? (
                        <>
                          P/3 = {Math.round(state.powerW / 3)}W ÷ 218.5V<br />
                          I₁ = I₂ = I₃ = <strong className="text-[8px] text-teal-900 font-black">{computedCurrents.I1.toFixed(1)} A</strong> (IN = 0A)
                        </>
                      ) : (
                        <>
                          L1: {(state.powerL1 || 0)}W÷218.5 = <strong className="text-teal-900">{computedCurrents.I1.toFixed(1)}A</strong><br />
                          L2: {(state.powerL2 || 0)}W÷218.5 = <strong className="text-teal-900">{computedCurrents.I2.toFixed(1)}A</strong><br />
                          L3: {(state.powerL3 || 0)}W÷218.5 = <strong className="text-teal-900">{computedCurrents.I3.toFixed(1)}A</strong>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Synthèse finale en une ligne claire */}
                <div className="pt-1 border-t border-slate-200/80 text-[6.5px] flex items-center justify-between text-slate-600">
                  <span>
                    💡 <strong>Règle de conversion pratique :</strong> 1000 W (1 kW) sous 230V avec cos φ 0.95 produit exactement <strong>4,58 Ampères</strong> (1000 ÷ 218.5).
                  </span>
                  <span className="font-mono font-bold text-teal-800">
                    I = P (kW) × 4.58 A
                  </span>
                </div>
              </div>
            </div>
          );
        })()}
      </div>

      <ConnectionStepsGameModal
        isOpen={isGameOpen}
        onClose={() => setIsGameOpen(false)}
      />

      <ShortCircuitExplosion
        isOpen={showExplosionModal}
        onClose={() => setShowExplosionModal(false)}
        onResetBreaker={() => {
          update({
            upstreamBreakerTripped: false,
            internalBreakerTripped: false,
            powerW: Math.min(state.powerW, 2000),
          });
        }}
        breakerRating={state.breakerRating}
        upstreamRating={state.upstreamBreakerRating}
        iccValue={4500}
      />
    </motion.div>
  );
};

interface SmartMeterDisplayProps {
  state: SmartMeterState;
  onUpdateState?: (newState: Partial<SmartMeterState>) => void;
}

export const SmartMeterDisplay: React.FC<SmartMeterDisplayProps> = ({ state, onUpdateState }) => {
  const [currentObisScreen, setCurrentObisScreen] = useState<number>(0);
  const [pulseTick, setPulseTick] = useState<boolean>(false);
  const [showExplosionModal, setShowExplosionModal] = useState<boolean>(false);

  useEffect(() => {
    if (state.triggerExplosionTimestamp) {
      setShowExplosionModal(true);
    }
  }, [state.triggerExplosionTimestamp]);

  // Tension nominale
  const U_nominal = state.networkType === 'tri_400' ? 400 : 230;
  const sqrt3 = Math.sqrt(3);

  // Puissance apparente S = P / cosPhi
  const activePowerKW = state.powerW / 1000;
  const apparentPowerKVA = state.cosPhi > 0 ? activePowerKW / state.cosPhi : activePowerKW;

  const isSingle = isClientSinglePhase(state.buildingType, state.networkType);

  // Puissance maximale contractuelle (kVA) définie par le breaker interne
  const maxContractedKVA = useMemo(() => {
    if (isSingle) {
      return (230 * state.breakerRating) / 1000;
    } else if (state.networkType === 'tri_230') {
      return (sqrt3 * 230 * state.breakerRating) / 1000;
    } else {
      return (sqrt3 * 400 * state.breakerRating) / 1000;
    }
  }, [isSingle, state.networkType, state.breakerRating, sqrt3]);

  // Courants par phase et courant dans le neutre
  const currents = useMemo(() => {
    const cosPhi = state.cosPhi || 0.95;
    if (isSingle) {
      const I = state.powerW / (230 * cosPhi);
      return { I1: I, I2: 0, I3: 0, Imax: I, IN: I };
    } else if (state.networkType === 'tri_230') {
      if (state.isBalanced) {
        const I = state.powerW / (sqrt3 * 230 * cosPhi);
        return { I1: I, I2: I, I3: I, Imax: I, IN: 0 };
      } else {
        const I12 = (state.powerL1 || 0) / (230 * cosPhi);
        const I23 = (state.powerL2 || 0) / (230 * cosPhi);
        const I31 = (state.powerL3 || 0) / (230 * cosPhi);
        const I1 = Math.sqrt(I12 * I12 + I31 * I31 + I12 * I31);
        const I2 = Math.sqrt(I23 * I23 + I12 * I12 + I23 * I12);
        const I3 = Math.sqrt(I31 * I31 + I23 * I23 + I31 * I23);
        return { I1, I2, I3, Imax: Math.max(I1, I2, I3), IN: 0 };
      }
    } else {
      // tri_400 (3x400V+N : Tension simple 230V entre phase et neutre)
      if (state.isBalanced) {
        const I = state.powerW / (sqrt3 * 400 * cosPhi);
        return { I1: I, I2: I, I3: I, Imax: I, IN: 0 };
      } else {
        const I1 = (state.powerL1 || 0) / (230 * cosPhi);
        const I2 = (state.powerL2 || 0) / (230 * cosPhi);
        const I3 = (state.powerL3 || 0) / (230 * cosPhi);
        const valN = I1 * I1 + I2 * I2 + I3 * I3 - (I1 * I2 + I2 * I3 + I3 * I1);
        const IN = Math.sqrt(Math.max(0, valN));
        return { I1, I2, I3, Imax: Math.max(I1, I2, I3), IN };
      }
    }
  }, [isSingle, state, sqrt3]);

  // Dépassement d'intensité par rapport au breaker interne
  const isOverloaded = currents.Imax > state.breakerRating;
  const loadPercentage = maxContractedKVA > 0 ? (apparentPowerKVA / maxContractedKVA) * 100 : 0;

  // Effet de déclenchement instantané automatique si surintensité non encore déclenchée
  useEffect(() => {
    if (isOverloaded && !state.internalBreakerTripped && !state.upstreamBreakerTripped && onUpdateState) {
      onUpdateState({ internalBreakerTripped: true });
    }
  }, [isOverloaded, state.internalBreakerTripped, state.upstreamBreakerTripped, onUpdateState]);

  // Clignotement LED métrologique (1000 imp/kWh = 1 imp / Wh)
  useEffect(() => {
    if (state.internalBreakerTripped || state.upstreamBreakerTripped || state.powerW <= 10) return;
    const periodMs = Math.max(120, Math.min(5000, 3600000 / state.powerW));
    const interval = setInterval(() => {
      setPulseTick((prev) => !prev);
    }, periodMs);
    return () => clearInterval(interval);
  }, [state.powerW, state.internalBreakerTripped, state.upstreamBreakerTripped]);

  // Registres OBIS dans l'ordre officiel du bouton de défilement (Norme belge / Fluvius / ORES / RESA)
  const isTri = state.networkType !== 'mono_230';

  const padEnergy = (kwh: number) => {
    const val = Math.max(0, kwh);
    const parts = val.toFixed(3).split('.');
    const intPart = parts[0].padStart(6, '0');
    return `${intPart}.${parts[1]} kWh`;
  };

  const padPower = (kw: number) => {
    const val = Math.max(0, kw);
    const parts = val.toFixed(3).split('.');
    const intPart = parts[0].padStart(4, '0');
    return `${intPart}.${parts[1]} kW`;
  };

  const padCurrent = (a: number) => {
    const val = Math.max(0, a);
    const parts = val.toFixed(1).split('.');
    const intPart = parts[0].padStart(3, '0');
    return `${intPart}.${parts[1]} A`;
  };

  const padVoltage = (v: number) => {
    const val = Math.max(0, v);
    const parts = val.toFixed(1).split('.');
    const intPart = parts[0].padStart(3, '0');
    return `${intPart}.${parts[1]} V`;
  };

  const obisScreens = useMemo(() => {
    const totalImport = state.indexHP_Import + state.indexHC_Import;
    const totalExport = state.indexHP_Export + state.indexHC_Export;
    const isPowerCut = state.internalBreakerTripped || state.upstreamBreakerTripped;
    const powerConsKw = isPowerCut ? 0 : state.mode === 'consumption' ? state.powerW / 1000 : 0;
    const powerInjKw = isPowerCut ? 0 : state.mode === 'injection' ? state.powerW / 1000 : 0;

    const list = [
      {
        code: '1.8.0',
        title: 'Énergie Totale Prélevée (HP + HC)',
        label: 'Energie totale prélevée, en kWh (somme des codes 1.8.1 et 1.8.2)',
        value: `${totalImport.toFixed(1)} kWh`,
        lcdVal: padEnergy(totalImport),
        unit: 'kWh',
        sub: `Somme : 1.8.1 (${state.indexHP_Import.toFixed(1)} kWh) + 1.8.2 (${state.indexHC_Import.toFixed(1)} kWh)`,
        badge: 'TOTAL PRÉLEVÉ (HP+HC)',
        category: 'prélèvement',
        categoryBadge: 'Consommation Réseau',
        categoryColor: 'rose',
        whatItIs: 'Cumul absolu de tous les kilowattheures soutirés sur le réseau public depuis la pose du compteur. Il correspond rigoureusement à l’addition exacte de l’index Heures Pleines (1.8.1) et de l’index Heures Creuses (1.8.2).',
        billImpact: 'Index de référence indispensable pour les contrats en tarif simple (mono-horaire). Pour les contrats bi-horaires, il permet de certifier l’énergie totale facturée par votre fournisseur.',
        practicalTip: 'Relevez cet index chaque fin de mois ou d’année pour calculer votre consommation globale moyenne et vérifier la cohérence de vos factures de régularisation.',
      },
      {
        code: '1.8.1',
        title: 'Index Consommation Heures Pleines (HP - Jour)',
        label: 'Index des kWh consommés en heures pleines',
        value: `${state.indexHP_Import.toFixed(1)} kWh`,
        lcdVal: padEnergy(state.indexHP_Import),
        unit: 'kWh',
        sub: 'Énergie active prélevée en tarif Heures Pleines (HP)',
        badge: state.tariffPeriod === 'HP' ? 'TARIF HP EN COURS' : 'INDEX HP (T1)',
        category: 'prélèvement',
        categoryBadge: 'Tarif Jour (T1)',
        categoryColor: 'rose',
        whatItIs: 'Kilowattheures consommés en semaine pendant la journée (ex: du lundi au vendredi de 7h00 à 22h00). C’est le créneau horaire où la demande sur le réseau belge est la plus forte.',
        billImpact: 'Facturé au tarif plein le plus élevé. Cet index représente en moyenne 60% à 70% de la facture d’un ménage sans programmation horaire.',
        practicalTip: 'Décalez l’utilisation des appareils très consommateurs (lave-linge, lave-vaisselle, sèche-linge, chauffe-eau) vers les heures creuses ou lancez-les aux heures d’ensoleillement si vous possédez des panneaux photovoltaïques.',
      },
      {
        code: '1.8.2',
        title: 'Index Consommation Heures Creuses (HC - Nuit & WE)',
        label: 'Index des kWh consommés en heures creuses',
        value: `${state.indexHC_Import.toFixed(1)} kWh`,
        lcdVal: padEnergy(state.indexHC_Import),
        unit: 'kWh',
        sub: 'Énergie active prélevée en tarif Heures Creuses (HC)',
        badge: state.tariffPeriod === 'HC' ? 'TARIF HC EN COURS' : 'INDEX HC (T2)',
        category: 'prélèvement',
        categoryBadge: 'Tarif Nuit & WE (T2)',
        categoryColor: 'rose',
        whatItIs: 'Kilowattheures consommés la nuit (22h00 à 7h00) et pendant tout le week-end du vendredi soir au lundi matin.',
        billImpact: 'Bénéficie d’un tarif au kWh plus économique sur la part énergie et sur les redevances de distribution.',
        practicalTip: 'Programmez la recharge de votre véhicule électrique, votre pompe à chaleur ou vos ballons d’eau chaude sanitaire pour s’enclencher automatiquement durant cette plage horaire avantageuse.',
      },
      {
        code: '2.8.0',
        title: 'Énergie Totale Injectée (Prosumers / Solaire)',
        label: 'Energie totale injectée, en kWh (somme des codes 2.8.1 et 2.8.2)',
        value: `${totalExport.toFixed(1)} kWh`,
        lcdVal: padEnergy(totalExport),
        unit: 'kWh',
        sub: `Somme injection : 2.8.1 (${state.indexHP_Export.toFixed(1)} kWh) + 2.8.2 (${state.indexHC_Export.toFixed(1)} kWh)`,
        badge: 'TOTAL INJECTION (HP+HC)',
        category: 'injection',
        categoryBadge: 'Injection Solaire Globale',
        categoryColor: 'emerald',
        whatItIs: 'Cumul de toute l’électricité verte excédentaire produite par votre installation solaire et renvoyée sur le réseau public (somme de 2.8.1 et 2.8.2).',
        billImpact: 'Sert de base de calcul pour la valorisation de votre surplus solaire (contrat de rachat prosumer avec votre fournisseur).',
        practicalTip: 'Le prix de rachat de l’injection (environ 0,05 à 0,08 €/kWh) est nettement inférieur au coût d’achat de l’électricité (~0,30 €/kWh). Votre priorité doit être de consommer votre production sur place !',
      },
      {
        code: '2.8.1',
        title: 'Index Injection Solaire en Heures Pleines',
        label: 'Index des kWh injectés en heures pleines (pour les prosumers)',
        value: `${state.indexHP_Export.toFixed(1)} kWh`,
        lcdVal: padEnergy(state.indexHP_Export),
        unit: 'kWh',
        sub: 'Surplus solaire PV injecté en Heures Pleines',
        badge: 'INJECTION PROSUMER HP',
        category: 'injection',
        categoryBadge: 'Injection Solaire HP',
        categoryColor: 'emerald',
        whatItIs: 'Surplus solaire renvoyé sur le réseau durant les plages horaires de jour en semaine (période de pointe de production photovoltaïque).',
        billImpact: 'Comptabilisé pour la rémunération de votre surplus injecté en heures pleines sur votre décompte périodique.',
        practicalTip: 'Concentrez le fonctionnement des gros consommateurs (filtration piscine, cuisson de midi, climatisation) entre 11h30 et 15h30 pour capturer cette énergie gratuite.',
      },
      {
        code: '2.8.2',
        title: 'Index Injection Solaire en Heures Creuses',
        label: 'Index des kWh injectés en heures creuses',
        value: `${state.indexHC_Export.toFixed(1)} kWh`,
        lcdVal: padEnergy(state.indexHC_Export),
        unit: 'kWh',
        sub: 'Surplus solaire PV injecté en Heures Creuses',
        badge: 'INJECTION PROSUMER HC',
        category: 'injection',
        categoryBadge: 'Injection Solaire HC',
        categoryColor: 'emerald',
        whatItIs: 'Surplus solaire injecté sur le réseau durant les week-ends ou tôt le matin / tard le soir en saison estivale.',
        billImpact: 'Valorisé selon le tarif de rachat injection du week-end stipulé dans votre contrat fournisseur.',
        practicalTip: 'Le week-end, profitez de votre présence pour cuisiner et lancer vos lessives en journée pour maximiser votre taux d’autoconsommation.',
      },
      {
        code: '1.6.0',
        title: 'Pic de Puissance Mensuel Quart-Horaire (kW)',
        label: 'Pic de puissance prélevée pendant le mois en cours, en kW',
        value: `${state.peak15MinKW.toFixed(2)} kW`,
        lcdVal: padPower(state.peak15MinKW),
        unit: 'kW',
        sub: 'Moyenne mobile maximale sur 15 minutes (base tarif capacitaire)',
        badge: 'PIC QUART-HORAIRE',
        category: 'pic',
        categoryBadge: 'Tarif Capacitaire (15 min)',
        categoryColor: 'amber',
        whatItIs: 'La puissance moyenne la plus élevée prélevée sur un intervalle de 15 minutes consécutives au cours du mois civil en cours. Le compteur mémorise et réinitialise ce pic le 1er de chaque mois.',
        billImpact: 'Pilier fondamental du Tarif Capacitaire. Plus ce pic quart-horaire est haut, plus votre facture de réseau augmente. Un plancher légal minimum de 2,5 kW est appliqué.',
        practicalTip: 'Ne faites pas fonctionner plusieurs appareils de forte puissance simultanément (ex: four + plaque à induction + borne de recharge + fer à repasser). Échelonnez leurs démarrages pour éviter les pics !',
      },
      {
        code: '1.7.0',
        title: 'Puissance Instantanée Soutirée (kW)',
        label: 'Puissance en cours de prélèvement sur le réseau, en kW',
        value: `${powerConsKw.toFixed(3)} kW`,
        lcdVal: padPower(powerConsKw),
        unit: 'kW',
        sub: state.upstreamBreakerTripped
          ? 'Disjoncteur amont ouvert (0.000 kW - tension 0V)'
          : state.internalBreakerTripped
          ? 'Breaker interne ouvert (0.000 kW débité)'
          : `S = ${apparentPowerKVA.toFixed(2)} kVA • cos φ = ${state.cosPhi.toFixed(2)}`,
        badge: state.upstreamBreakerTripped
          ? 'AMONT COUPÉ (0V)'
          : state.internalBreakerTripped
          ? 'BREAKER OUVERT'
          : state.mode === 'consumption'
          ? 'SOUTIRAGE ACTIF ➔'
          : 'SOUTIRAGE 0 kW',
        category: 'puissance',
        categoryBadge: 'Puissance Active Soutirée',
        categoryColor: 'amber',
        whatItIs: 'Puissance électrique active prélevée à la seconde précise par tous les récepteurs branchés dans votre bâtiment.',
        billImpact: 'Mesure en direct votre niveau d’appel de puissance. Si cette valeur reste haute pendant plus de 15 minutes, votre registre de pic (1.6.0) va grimper.',
        practicalTip: 'Observez cet écran en allumant un appareil (ex: bouilloire, radiateur d’appoint) pour découvrir instantanément sa puissance réelle en kilowatts.',
      },
      {
        code: '2.7.0',
        title: 'Puissance Instantanée Injectée (kW)',
        label: "Puissance en cours d'injection sur le réseau, en kW (pour les prosumers)",
        value: `${powerInjKw.toFixed(3)} kW`,
        lcdVal: padPower(powerInjKw),
        unit: 'kW',
        sub: isPowerCut
          ? 'Coupure active (injection nulle)'
          : 'Surplus d’autoproduction PV renvoyé vers le réseau GRD',
        badge: isPowerCut
          ? 'COUPURE ACTIVE'
          : state.mode === 'injection'
          ? 'INJECTION ACTIVE ⬅'
          : 'INJECTION 0 kW',
        category: 'puissance',
        categoryBadge: 'Puissance Active Injectée',
        categoryColor: 'emerald',
        whatItIs: 'Puissance active instantanée que vos panneaux solaires réinjectent sur le réseau à cet instant après avoir couvert vos besoins intérieurs.',
        billImpact: 'Tant que ce chiffre est supérieur à zéro, votre maison ne consomme aucune électricité payante du réseau et vous vendez votre surplus.',
        practicalTip: 'C’est le signal parfait pour lancer une recharge de batterie ou la chauffe du ballon d’eau chaude : l’énergie consommée est 100% gratuite et locale !',
      },
    ];

    if (!isTri) {
      // Compteur monophasé (XS212)
      list.push(
        {
          code: '31.7.0',
          title: 'Courant Instantané Monophasé (A)',
          label: 'Courant instantané, en A',
          value: `${(isPowerCut ? 0 : currents.I1).toFixed(1)} A`,
          lcdVal: padCurrent(isPowerCut ? 0 : currents.I1),
          unit: 'A',
          sub: `Courant monophasé instantané (Breaker limité à ${state.breakerRating} A)`,
          badge: state.upstreamBreakerTripped
            ? 'AMONT TRIP'
            : isOverloaded
            ? '⚠️ SURINTENSITÉ'
            : 'COURANT MONO OK',
          category: 'courant',
          categoryBadge: 'Courant Monophasé',
          categoryColor: 'blue',
          whatItIs: 'Intensité instantanée en Ampères circulant dans le câble de phase. Cette valeur est surveillée en continu par le breaker électronique interne.',
          billImpact: `Si le courant dépasse le calibre souscrit (${state.breakerRating} A), le disjoncteur électronique interne coupe instantanément l'alimentation du logement !`,
          practicalTip: 'En 230V monophasé, chaque tranche de 2300W (2,3 kW) consomme 10 Ampères. À 40A, votre puissance maximale admissible est de 9,2 kW.',
        },
        {
          code: '32.7.0',
          title: 'Tension Instantanée Monophasée (V)',
          label: 'Tension instantanée, en V',
          value: `${isPowerCut ? '0.0' : '230.2'} V`,
          lcdVal: padVoltage(isPowerCut ? 0 : 230.2),
          unit: 'V',
          sub: 'Tension réseau monophasée (Phase - Neutre)',
          badge: state.upstreamBreakerTripped
            ? '0 V (AMONT OUVERT)'
            : state.internalBreakerTripped
            ? '0 V (BREAKER OUVERT)'
            : 'TENSION 230V',
          category: 'tension',
          categoryBadge: 'Tension Réseau',
          categoryColor: 'blue',
          whatItIs: 'Tension efficace alternative entre la phase et le neutre mesurée à l’entrée du compteur.',
          billImpact: 'Garantie de conformité de la fourniture (norme EN 50160 : 230 V ± 10%, soit entre 207 V et 253 V).',
          practicalTip: 'Si beaucoup de voisins injectent du solaire, la tension peut grimper. Au-delà de 253V pendant 10 minutes, les onduleurs solaires doivent se couper par sécurité.',
        }
      );
    } else {
      // Compteurs triphasés (T211)
      const isRedMono = state.clientOutputMode === 'reduced_mono';
      list.push(
        {
          code: '31.7.0',
          title: 'Courant Instantané Phase L1 (A)',
          label: 'Courant instantané, en A, sur la phase 1',
          value: `${(isPowerCut ? 0 : currents.I1).toFixed(1)} A`,
          lcdVal: padCurrent(isPowerCut ? 0 : currents.I1),
          unit: 'A',
          sub: `Courant instantané Phase L1 (Breaker limité à ${state.breakerRating} A)`,
          badge: isPowerCut
            ? '0.0 A'
            : currents.I1 > state.breakerRating
            ? '⚠️ SURINTENSITÉ L1'
            : 'COURANT L1 OK',
          category: 'courant',
          categoryBadge: 'Intensité L1',
          categoryColor: 'blue',
          whatItIs: 'Intensité en Ampères circulant sur le premier conducteur de phase (L1).',
          billImpact: `Le breaker interne triphasé déclenche et coupe les 3 phases dès qu’une seule phase dépasse la consigne souscrite (${state.breakerRating} A).`,
          practicalTip: isRedMono
            ? (state.networkType === 'tri_230'
              ? 'Raccordement 2 phases (L1-L2 en 3×230V) : la phase L1 porte l’intensité aller du circuit monophasé 230V.'
              : 'Raccordement Phase+N (L1+N en 3×400V) : TOUTE votre consommation transite par la phase L1. Veillez à ne pas dépasser ' + state.breakerRating + 'A !')
            : 'En triphasé équilibré, les courants sur L1, L2 et L3 doivent être au plus proche pour exploiter toute la puissance souscrite.',
        },
        {
          code: '51.7.0',
          title: 'Courant Instantané Phase L2 (A)',
          label: 'Courant instantané, en A, sur la phase 2',
          value: `${(isPowerCut ? 0 : currents.I2).toFixed(1)} A`,
          lcdVal: padCurrent(isPowerCut ? 0 : currents.I2),
          unit: 'A',
          sub: `Courant instantané Phase L2 (Breaker limité à ${state.breakerRating} A)`,
          badge: isPowerCut
            ? '0.0 A'
            : currents.I2 > state.breakerRating
            ? '⚠️ SURINTENSITÉ L2'
            : 'COURANT L2 OK',
          category: 'courant',
          categoryBadge: 'Intensité L2',
          categoryColor: 'blue',
          whatItIs: 'Intensité en Ampères circulant sur le deuxième conducteur de phase (L2).',
          billImpact: 'Surveillance de la charge appliquée sur la seconde phase.',
          practicalTip: isRedMono
            ? (state.networkType === 'tri_230'
              ? 'En réseau 3×230V avec sortie 2 phases, L2 assure le retour de courant et affiche le même ampérage que L1.'
              : 'En réseau 3×400V Étoile avec sortie Phase+N, la phase L2 n’est pas utilisée pour alimenter le client et reste à 0.0 A.')
            : 'Répartissez les circuits du tableau électrique (ex: four sur L1, cuisson sur L2, lave-linge sur L3).',
        },
        {
          code: '71.7.0',
          title: 'Courant Instantané Phase L3 (A)',
          label: 'Courant instantané, en A, sur la phase 3',
          value: `${(isPowerCut ? 0 : currents.I3).toFixed(1)} A`,
          lcdVal: padCurrent(isPowerCut ? 0 : currents.I3),
          unit: 'A',
          sub: `Courant instantané Phase L3 (Breaker limité à ${state.breakerRating} A)`,
          badge: isPowerCut
            ? '0.0 A'
            : currents.I3 > state.breakerRating
            ? '⚠️ SURINTENSITÉ L3'
            : 'COURANT L3 OK',
          category: 'courant',
          categoryBadge: 'Intensité L3',
          categoryColor: 'blue',
          whatItIs: 'Intensité en Ampères circulant sur le troisième conducteur de phase (L3).',
          billImpact: 'Complète l’analyse vectorielle de la charge polyphasée.',
          practicalTip: isRedMono
            ? 'Sortie client configurée en alimentation monophasée : le pôle L3 n’est pas raccordé côté client et affiche 0.0 A.'
            : 'Un bon équilibrage triphasé protège votre installation contre les échauffements anormaux du neutre.',
        },
        ...(state.networkType === 'tri_400'
          ? [
              {
                code: '91.7.0',
                title: 'Courant Neutre Instantané IN (A)',
                label: 'Courant instantané sur le conducteur neutre',
                value: `${(isPowerCut ? 0 : currents.IN).toFixed(1)} A`,
                lcdVal: padCurrent(isPowerCut ? 0 : currents.IN),
                unit: 'A',
                sub: state.isBalanced
                  ? 'Système équilibré : somme vectorielle des courants nulle (IN = 0 A)'
                  : `Déséquilibre des phases (retour neutre IN = ${currents.IN.toFixed(1)} A)`,
                badge: isPowerCut
                  ? '0.0 A'
                  : state.isBalanced
                  ? '0.0 A (ÉQUILIBRÉ)'
                  : `IN = ${currents.IN.toFixed(1)} A`,
                category: 'courant' as const,
                categoryBadge: 'Courant Neutre',
                categoryColor: 'blue' as const,
                whatItIs:
                  'Courant de retour résultant circulant dans le conducteur de Neutre (N) en réseau 3×400V+N.',
                billImpact:
                  'En régime équilibré (moteurs), le courant dans le neutre est nul. En usage résidentiel déséquilibré, le neutre draine le déséquilibre résiduel.',
                practicalTip:
                  'Le conducteur neutre ne doit jamais être coupé séparément sous charge sous peine de surtensions destructrices sur les phases.',
              },
            ]
          : []),
        {
          code: '32.7.0',
          title: 'Tension Instantanée Phase 1 (V)',
          label: 'Tension instantanée, en V, sur la phase 1',
          value: `${isPowerCut ? '0.0' : '230.1'} V`,
          lcdVal: padVoltage(isPowerCut ? 0 : 230.1),
          unit: 'V',
          sub:
            state.networkType === 'tri_400'
              ? 'Tension simple L1 - N (230 V)'
              : 'Tension composée L1 - L2 (230 V)',
          badge: isPowerCut ? '0 V (COUPURE)' : 'TENSION L1',
          category: 'tension',
          categoryBadge: 'Tension Phase L1',
          categoryColor: 'blue',
          whatItIs: state.networkType === 'tri_400'
            ? 'Tension simple efficace mesurée entre la Phase 1 et le Neutre (230V nominal).'
            : 'Tension composée efficace mesurée entre la Phase 1 et la Phase 2 en réseau 3×230V.',
          billImpact: 'Assure la stabilité d’alimentation requise pour la longévité de vos appareils électroniques.',
          practicalTip: 'En cas de coupure du disjoncteur amont ou du breaker interne, cette mesure chute à 0.0 V.',
        },
        {
          code: '52.7.0',
          title: 'Tension Instantanée Phase 2 (V)',
          label: 'Tension instantanée, en V, sur la phase 2',
          value: `${isPowerCut ? '0.0' : '231.4'} V`,
          lcdVal: padVoltage(isPowerCut ? 0 : 231.4),
          unit: 'V',
          sub:
            state.networkType === 'tri_400'
              ? 'Tension simple L2 - N (230 V)'
              : 'Tension composée L2 - L3 (230 V)',
          badge: isPowerCut ? '0 V (COUPURE)' : 'TENSION L2',
          category: 'tension',
          categoryBadge: 'Tension Phase L2',
          categoryColor: 'blue',
          whatItIs: state.networkType === 'tri_400'
            ? 'Tension simple mesurée entre la Phase 2 et le Neutre (230V nominal).'
            : 'Tension composée mesurée entre la Phase 2 et la Phase 3 (230V nominal).',
          billImpact: 'Permet de vérifier la symétrie du réseau de distribution triphasé.',
          practicalTip: 'Un écart de tension supérieur à 10V entre phases indique un déséquilibre sur le réseau de quartier.',
        },
        {
          code: '72.7.0',
          title: 'Tension Instantanée Phase 3 (V)',
          label: 'Tension instantanée, en V, sur la phase 3',
          value: `${isPowerCut ? '0.0' : '229.8'} V`,
          lcdVal: padVoltage(isPowerCut ? 0 : 229.8),
          unit: 'V',
          sub:
            state.networkType === 'tri_400'
              ? 'Tension simple L3 - N (230 V)'
              : 'Tension composée L3 - L1 (230 V)',
          badge: isPowerCut ? '0 V (COUPURE)' : 'TENSION L3',
          category: 'tension',
          categoryBadge: 'Tension Phase L3',
          categoryColor: 'blue',
          whatItIs: state.networkType === 'tri_400'
            ? 'Tension simple mesurée entre la Phase 3 et le Neutre (230V nominal).'
            : 'Tension composée mesurée entre la Phase 3 et la Phase 1 (230V nominal).',
          billImpact: 'Garantit l’alimentation équilibrée des moteurs et appareils triphasés.',
          practicalTip: 'Les trois tensions doivent être comprises entre 207V et 253V selon la norme européenne.',
        }
      );
    }

    return list;
  }, [state, currents, isOverloaded, apparentPowerKVA, isTri]);

  const currentScreen = obisScreens[currentObisScreen % obisScreens.length];

  return (
    <motion.div
      key="smart-meter-display"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="w-full h-full flex flex-col items-center justify-start py-0 overflow-visible"
    >
      <div className="w-full max-w-2xl space-y-1.5 px-0.5">
        {/* BOÎTIER DU COMPTEUR INTELLIGENT SAGEMCOM XS212 / SICONIA (FORME RÉELLE CONFORME PHOTO) */}
          <div className="bg-[#F2F4F7] border-2 border-[#CFD4DC] rounded-[24px] p-2.5 sm:p-3 shadow-md relative select-none w-full mx-auto text-slate-800 font-sans">
            
            {/* 1. SECTION SUPÉRIEURE : MARQUAGES MID & SCELLÉS GRD */}
            <div className="flex justify-between items-start mb-1.5 px-1">
              {/* Marquages MID & Fabricant */}
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-700">
                  <span className="tracking-tighter">CE</span>
                  <span className="border border-black px-1 py-0.2 rounded-xs font-mono text-[9px] bg-white">M23</span>
                  <span className="font-mono text-[10px]">0071</span>
                </div>
                {/* Logo Siconia avec 3 points */}
                <div className="flex items-center gap-1 mt-1">
                  <div className="flex flex-col gap-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-500 block"></span>
                    <div className="flex gap-0.5">
                      <span className="w-1 h-1 rounded-full bg-slate-400 block"></span>
                      <span className="w-1 h-1 rounded-full bg-slate-400 block"></span>
                    </div>
                  </div>
                  <span className="text-[10px] font-black tracking-wider text-slate-700">SICONIA</span>
                </div>
              </div>

              {/* Modèle gravé au centre */}
              <div className="flex flex-col items-center">
                <div className="flex items-center gap-2">
                  <span className="text-xl font-black tracking-widest text-slate-300 select-none">
                    {state.buildingType === 'immeuble' ? 'XS212' : 'T211'}
                  </span>
                  <div className="flex items-center gap-1 text-[10px] text-slate-400">
                    <span>☽</span>
                    <span>☼</span>
                  </div>
                </div>
              </div>

              {/* Plomb de scellé métallique GRD et voyants LED métrologiques */}
              <div className="flex flex-col items-end">
                {/* Scellé métallique supérieur avec fil torsadé */}
                <div className="flex items-center gap-1 mb-1">
                  <div className="w-5 h-2 bg-gradient-to-r from-amber-200 to-yellow-400 rounded-xs border border-amber-600 shadow-2xs rotate-12 flex items-center justify-center">
                    <span className="text-[6px] font-bold text-amber-950">GRD</span>
                  </div>
                  <span className="text-[8px] text-slate-400 font-mono">1500 imp/kWh</span>
                </div>

                {/* Voyant LED 1 : 1500 imp/kWh (LED rouge clignotante) */}
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <div className="relative flex items-center justify-center">
                      <div
                        className={`w-3.5 h-3.5 rounded-full transition-all duration-75 border border-slate-500 ${
                          !state.internalBreakerTripped && pulseTick
                            ? 'bg-red-500 shadow-[0_0_10px_#ef4444]'
                            : 'bg-red-950/70'
                        }`}
                      />
                      {!state.internalBreakerTripped && pulseTick && (
                        <div className="absolute w-5 h-5 rounded-full bg-red-400/30 animate-ping" />
                      )}
                    </div>
                  </div>

                  {/* Fente de vis de verrouillage avec cadenas */}
                  <div className="w-4 h-4 rounded-full bg-slate-300 border border-slate-400 flex items-center justify-center shadow-inner">
                    <Lock className="w-2.5 h-2.5 text-slate-600" />
                  </div>
                </div>

                {/* Voyant LED 2 : 1500 imp/kvarh (énergie réactive) */}
                <div className="flex items-center gap-1.5 mt-1 text-[8px] text-slate-400 font-mono">
                  <span>kvarh ②</span>
                  <div className="w-2.5 h-2.5 rounded-full bg-red-950/40 border border-slate-400" />
                </div>
              </div>
            </div>

            {/* 2. ZONE CENTRALE : BOUTON POUSSOIR JAUNE + TÊTE OPTIQUE + GRAND ÉCRAN LCD AGRANDI */}
            <div className="flex items-center justify-between gap-2.5 sm:gap-3 my-1.5">
              
              {/* COLONNE GAUCHE : Bouton de défilement Jaune + Tête optique infrarouge */}
              <div className="flex flex-col items-center gap-1.5 shrink-0">
                {/* BOUTON POUSSOIR ROND JAUNE ICONIQUE (CONFORME PHOTO) */}
                <div className="flex flex-col items-center">
                  <button
                    onClick={() => setCurrentObisScreen((prev) => (prev + 1) % obisScreens.length)}
                    title="Bouton de commande (Défilement des registres de l'afficheur)"
                    className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-[#E5EC1C] hover:bg-[#d8df17] active:scale-90 active:shadow-inner border-2 border-[#b8bf15] shadow-[inset_0_2px_4px_rgba(255,255,255,0.9),0_4px_8px_rgba(0,0,0,0.18)] flex items-center justify-center cursor-pointer transition-all relative group"
                  >
                    <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-b from-[#eaf034] to-[#d6dc14] shadow-inner flex items-center justify-center">
                      <RefreshCw className="w-4 h-4 text-[#737905] group-hover:rotate-90 transition-transform duration-300" />
                    </div>
                  </button>
                  <span className="text-[7px] font-black text-slate-600 uppercase mt-0.5 tracking-tighter text-center">
                    BOUTON DE<br />COMMANDE
                  </span>
                </div>

                {/* TÊTE OPTIQUE INFRAROUGE MÉTALLIQUE */}
                <div className="flex flex-col items-center mt-0.5">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-b from-[#E2E5EB] via-[#D1D5DC] to-[#BAC1CC] border-2 border-[#9CA3AF] shadow-inner flex items-center justify-center relative">
                    <div className="w-7 h-7 rounded-full border border-slate-400/80 flex items-center justify-center bg-[#CBD0D8]">
                      <div className="w-3.5 h-3.5 rounded-full bg-[#0F172A] border-2 border-slate-600 shadow-[inset_0_2px_4px_rgba(0,0,0,0.9)] flex items-center justify-center">
                        <div className="w-1 h-1 rounded-full bg-slate-700/80" />
                      </div>
                    </div>
                  </div>
                  <span className="text-[6.5px] text-slate-400 font-mono mt-0.5">PORT OPTIQUE</span>
                </div>
              </div>

              {/* CENTRE / DROITE : GRAND ÉCRAN LCD AGRANDI HAUTE VISIBILITÉ DU COMPTEUR */}
              <div className="flex-1">
                <div
                  className={`p-1.5 sm:p-2 rounded-2xl shadow-[inset_0_2px_8px_rgba(0,0,0,0.45)] border-2 transition-colors ${
                    state.upstreamBreakerTripped
                      ? 'bg-[#291605] border-amber-800'
                      : state.internalBreakerTripped
                      ? 'bg-[#2A0C0C] border-rose-800'
                      : 'bg-[#4B8C29] border-[#3F7522]'
                  }`}
                >
                  <div
                    className={`rounded-xl p-2 sm:p-2.5 font-mono shadow-inner relative flex flex-col justify-between min-h-[110px] sm:min-h-[120px] select-none border border-black/10 ${
                      state.upstreamBreakerTripped
                        ? 'bg-[#1a0c02] text-amber-300'
                        : state.internalBreakerTripped
                        ? 'bg-[#1E0808] text-rose-300'
                        : 'bg-[#64BD39] text-[#0A2307]'
                    }`}
                  >
                    {/* Reflet de vitre d'afficheur */}
                    <div className="absolute top-0 left-0 right-0 h-1/3 bg-gradient-to-b from-white/20 to-transparent pointer-events-none rounded-t-xl" />

                    {/* LIGNE 1 DE L'ÉCRAN : CODE OBIS + NOM DU REGISTRE + PHASE & TARIF */}
                    <div className="flex justify-between items-center text-[10.5px] font-bold border-b border-black/20 pb-1">
                      {/* Code OBIS et badge de registre */}
                      <div className="flex items-center gap-1.5">
                        <span className="tracking-tight text-sm sm:text-base font-black bg-black/15 px-1.5 py-0.2 rounded text-[#061804]">
                          {state.upstreamBreakerTripped ? '0.0.0' : currentScreen.code}
                        </span>
                        <span className="text-[9.5px] sm:text-[10px] font-bold tracking-tight text-[#061804]/90 uppercase truncate max-w-[130px] sm:max-w-[170px]">
                          {state.upstreamBreakerTripped
                            ? 'COUPURE AMONT'
                            : currentScreen.code === '2.8.1'
                            ? '☀️ INJECTION HP'
                            : currentScreen.code === '2.8.2'
                            ? '🌙 INJECTION HC'
                            : currentScreen.code === '2.8.0'
                            ? 'INJECTION TOTALE'
                            : currentScreen.code === '1.8.1'
                            ? 'CONSO HP'
                            : currentScreen.code === '1.8.2'
                            ? 'CONSO HC'
                            : currentScreen.code === '1.6.0'
                            ? '⚡ PIC MENSUEL'
                            : currentScreen.categoryBadge}
                        </span>
                      </div>

                      {/* Indicateurs de communication, direction & réseau */}
                      <div className="flex items-center gap-1.5 text-[9.5px] font-bold">
                        {/* Flèche de flux directionnel : ⇦ si injection solaire, ➔ si prélèvement */}
                        {!state.upstreamBreakerTripped && (
                          <span className={`px-1.5 py-0.2 rounded font-black text-[9px] ${
                            currentScreen.category === 'injection' || state.mode === 'injection'
                              ? 'bg-emerald-950/20 text-[#061804] border border-emerald-900/30'
                              : 'bg-black/10 text-[#061804]'
                          }`}>
                            {currentScreen.category === 'injection' || state.mode === 'injection' ? '⇦ ⌂ EXP' : '➔ ⌂ IMP'}
                          </span>
                        )}

                        {/* Phase L1 ou L1 L2 L3 */}
                        <span className="opacity-90 font-bold bg-black/10 px-1.5 py-0.2 rounded">
                          {state.upstreamBreakerTripped
                            ? '0V'
                            : isClientSinglePhase(state.buildingType, state.networkType)
                            ? 'L1'
                            : 'L1 L2 L3'}
                        </span>

                        {!state.upstreamBreakerTripped && (
                          <div className="flex items-end gap-0.5 h-2.5">
                            <span className="w-1 h-1 bg-current block rounded-2xs" />
                            <span className="w-1 h-1.5 bg-current block rounded-2xs" />
                            <span className="w-1 h-2 bg-current block rounded-2xs" />
                            <span className="w-1 h-2.5 bg-current block rounded-2xs" />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* LIGNE 2 DE L'ÉCRAN : VALEUR NUMÉRIQUE EN TRÈS GRANDS CARACTÈRES NUMÉRIQUES */}
                    <div className="py-1 text-right flex flex-col justify-center">
                      {state.upstreamBreakerTripped ? (
                        <div className="text-center py-1">
                          <div className="text-base font-black text-amber-400 animate-pulse">
                            [COUPURE AMONT 0V]
                          </div>
                          <div className="text-[9px] text-amber-200 opacity-95 mt-0.5">
                            DISJONCTEUR MAGNÉTO OUVERT (Icc COUPÉ)
                          </div>
                        </div>
                      ) : state.internalBreakerTripped ? (
                        <div className="text-center py-1">
                          <div className="text-base font-black text-rose-400 animate-pulse">
                            [BREAKER OUVERT]
                          </div>
                          <div className="text-[9px] text-rose-300 opacity-90 mt-0.5">
                            SURINTENSITÉ &gt; {state.breakerRating}A
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div className="text-2xl sm:text-3xl font-black tracking-tight tabular-nums drop-shadow-xs text-[#061804] leading-tight">
                            {currentScreen.lcdVal || currentScreen.value}
                          </div>
                          <div className="text-[9.5px] sm:text-[10px] text-[#061804]/80 font-sans font-bold mt-0.5">
                            {currentScreen.code === '2.8.1'
                              ? 'Index Énergie Réinjectée sur le Réseau (Surplus Solaire HP)'
                              : currentScreen.code === '2.8.2'
                              ? 'Index Énergie Réinjectée sur le Réseau (Surplus Solaire HC)'
                              : currentScreen.title}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* LIGNE 3 DE L'ÉCRAN : DRAPEAUX OBIS & SYMBOLE TARIFAIRE */}
                    <div className="flex justify-between items-center pt-1 border-t border-black/20 text-[8.5px] font-bold">
                      <div className="flex items-center gap-1.5 text-[8.5px] opacity-80">
                        <span>▼</span>
                        <span>▼</span>
                        <span>▼</span>
                        <span>▼</span>
                        <span className="text-[7.5px] font-mono tracking-wider ml-1">
                          MID Cl.B • 1500 imp/kWh
                        </span>
                      </div>
                      <span className="text-[8.5px] opacity-90 uppercase font-sans font-black bg-black/15 px-1.5 py-0.2 rounded">
                        {state.upstreamBreakerTripped
                          ? 'GRD HORS TENSION'
                          : state.tariffPeriod === 'HP'
                          ? 'HP (TARIF 1)'
                          : 'HC (TARIF 2)'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bouton d'urgence si coupure amont */}
                {state.upstreamBreakerTripped && (
                  <div className="mt-1.5 space-y-1">
                    <button
                      onClick={() => {
                        if (onUpdateState) {
                          onUpdateState({
                            upstreamBreakerTripped: false,
                            internalBreakerTripped: false,
                            powerW: Math.min(state.powerW, 2000),
                          });
                        }
                      }}
                      className="w-full py-1 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white rounded-lg text-[11px] font-black transition-all shadow-md cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <RotateCcw className="w-3 h-3" />
                      [RÉARMER DISJONCTEUR AMONT {state.upstreamBreakerRating}A]
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowExplosionModal(true)}
                      className="w-full py-1 bg-gradient-to-r from-rose-600 via-amber-600 to-rose-600 hover:from-rose-500 hover:to-amber-500 active:scale-95 text-white rounded-lg text-[11px] font-black transition-all shadow-md cursor-pointer flex items-center justify-center gap-1.5 animate-bounce"
                    >
                      <Flame className="w-3.5 h-3.5 fill-amber-300 text-amber-300 animate-pulse" />
                      💥 REVOIR L'EXPLOSION DU COURT-CIRCUIT (FEU & ÉTINCELLES)
                    </button>
                  </div>
                )}

                {/* Bouton d'urgence si disjonction du breaker */}
                {!state.upstreamBreakerTripped && state.internalBreakerTripped && (
                  <div className="mt-1.5 space-y-1">
                    <div className="p-1 bg-rose-50 border border-rose-300 rounded-lg text-rose-900 text-[9px] leading-tight font-medium">
                      ⚠️ <strong>Coupure instantanée :</strong> Le breaker électronique interne ({state.breakerRating}A) limite la puissance souscrite contractuelle et coupe instantanément en cas de dépassement d'ampérage (surcharge).
                    </div>
                    <button
                      onClick={() => {
                        if (onUpdateState) {
                          onUpdateState({
                            internalBreakerTripped: false,
                            powerW: Math.min(state.powerW, 2000),
                          });
                        }
                      }}
                      className="w-full py-1 bg-rose-600 hover:bg-rose-500 active:scale-95 text-white rounded-lg text-[11px] font-black transition-all shadow-md cursor-pointer flex items-center justify-center gap-1.5 animate-bounce"
                    >
                      <RotateCcw className="w-3 h-3" />
                      [RÉARMER LE BREAKER ÉLECTRONIQUE ({state.breakerRating}A)]
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* 3. NOUVELLE ZONE TECHNIQUE D'EXPLICATION INTERACTIVE (REMPLACE QR CODE, CODE BARRE, PORT P1 ET CAPOT BORNIER) */}
            <SmartMeterExplanation
              state={state}
              onSelectTopic={(topic) => onUpdateState && onUpdateState({ activeTopic: topic })}
            />
          </div>


          {/* BANDEAU DE STATUT COMPACT SOUS LE COMPTEUR (AUCUN DOUBLON) */}
          <div className="grid grid-cols-3 gap-1.5 text-left pt-0.5">
            <div className="p-1.5 px-2 bg-white rounded-lg border border-slate-200 shadow-2xs">
              <div className="text-[8px] font-bold uppercase text-slate-500 flex items-center justify-between">
                <span>Breaker Interne</span>
                <span className={`w-1.5 h-1.5 rounded-full ${state.internalBreakerTripped ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'}`} />
              </div>
              <div className="text-[11px] font-mono font-black text-slate-900 mt-0.5">
                {state.breakerRating} A
              </div>
              <div className="text-[7.5px] font-medium text-slate-500">
                {state.internalBreakerTripped ? 'Coupé instantané' : 'Enclenché'}
              </div>
            </div>

            <div className="p-1.5 px-2 bg-white rounded-lg border border-slate-200 shadow-2xs">
              <div className="text-[8px] font-bold uppercase text-slate-500 flex items-center justify-between">
                <span>Disjoncteur Amont</span>
                <span className={`w-1.5 h-1.5 rounded-full ${state.upstreamBreakerTripped ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'}`} />
              </div>
              <div className="text-[11px] font-mono font-black text-slate-900 mt-0.5">
                {state.upstreamBreakerRating} A
              </div>
              <div className="text-[7.5px] font-medium text-slate-500">
                {state.upstreamBreakerTripped ? 'Ouvert (Court-Circuit)' : 'Enclenché'}
              </div>
            </div>

            <div className="p-1.5 px-2 bg-white rounded-lg border border-slate-200 shadow-2xs">
              <div className="text-[8px] font-bold uppercase text-slate-500 flex items-center justify-between">
                <span>Flux Réseau</span>
                <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
              </div>
              <div className="text-[11px] font-mono font-black text-slate-900 mt-0.5">
                {(state.powerW / 1000).toFixed(2)} kW
              </div>
              <div className="text-[7.5px] font-medium text-teal-700">
                {state.mode === 'consumption' ? 'Soutirage' : 'Injection PV'}
              </div>
            </div>
          </div>
        </div>

      <ShortCircuitExplosion
        isOpen={showExplosionModal}
        onClose={() => setShowExplosionModal(false)}
        onResetBreaker={() => {
          if (onUpdateState) {
            onUpdateState({
              upstreamBreakerTripped: false,
              internalBreakerTripped: false,
              powerW: Math.min(state.powerW, 2000),
            });
          }
        }}
        breakerRating={state.breakerRating}
        upstreamRating={state.upstreamBreakerRating}
        iccValue={4500}
      />
    </motion.div>
  );
};
