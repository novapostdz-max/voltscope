/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect, ChangeEvent } from 'react';
import { motion, AnimatePresence, useMotionValue, animate } from 'motion/react';
import { Zap, ShieldAlert, ShieldCheck, Info, Settings2, Calculator, Plus, Trash2, Home, BookOpen, Sun, Car, Network, ArrowLeft, ChevronRight, LayoutDashboard, Battery, BatteryCharging, Activity, Gauge, Omega, Receipt, Euro, Shield, Flame, PlugZap, ClipboardList, CheckCircle2, Wrench, AlertTriangle, Lightbulb, GitFork, Grid, Check, Layers, X, Radio, GraduationCap, Compass, Monitor, Lock, Unlock, FileText } from 'lucide-react';
import { SmartMeterControls, SmartMeterDisplay, SmartMeterState, INITIAL_SMART_METER_STATE } from './components/SmartMeter';
import { RTCCSimulator } from './components/rtcc/RTCCSimulator';
import { MeterExamView } from './components/meterExam/MeterExamView';
import { SimuPhaseIframeView } from './components/champTournant/SimuPhaseIframeView';
import { AccessLockScreen } from './components/AccessLockScreen';
import { ElecPlanApp } from './components/elecplan/ElecPlanApp';
import { MadeByBadge } from './components/MadeByBadge';

// Animated counter component using Framer Motion
interface AnimatedCounterProps {
  value: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}

const AnimatedCounter: React.FC<AnimatedCounterProps> = ({ 
  value, 
  decimals = 0, 
  prefix = '', 
  suffix = '', 
  className = '' 
}) => {
  const count = useMotionValue(0);
  const [displayValue, setDisplayValue] = useState(() => {
    if (!isFinite(value)) return value === Infinity ? '∞' : String(value);
    return prefix + value.toFixed(decimals) + suffix;
  });

  useEffect(() => {
    if (!isFinite(value)) {
      setDisplayValue(value === Infinity ? '∞' : String(value));
      return;
    }
    const controls = animate(count, value, {
      duration: 0.8,
      ease: [0.16, 1, 0.3, 1], // easeOutExpo
    });
    return () => controls.stop();
  }, [value, count]);

  useEffect(() => {
    if (!isFinite(value)) return;
    const unsubscribe = count.on('change', (latest) => {
      setDisplayValue(prefix + Number(latest).toFixed(decimals) + suffix);
    });
    return () => unsubscribe();
  }, [count, value, decimals, prefix, suffix]);

  return <span className={className}>{displayValue}</span>;
};

const BREAKER_RATINGS = [6, 10, 16, 20, 32, 40, 63];
const CABLE_SECTIONS = [1.5, 2.5, 4, 6, 10, 16];
const COPPER_RESISTIVITY = 0.017; // Ω·mm²/m (at 20°C standard)
const INVERTER_EFFICIENCY = 0.95; 

const getKelvinColor = (kelvin: number) => {
  const k = kelvin / 100;
  let r, g, b;

  if (k <= 66) {
    r = 255;
    g = 99.4708025861 * Math.log(k) - 161.1195681661;
    if (k <= 19) {
      b = 0;
    } else {
      b = 138.5177312231 * Math.log(k - 10) - 305.0447927307;
    }
  } else {
    r = 329.698727446 * Math.pow(k - 60, -0.1332047592);
    g = 288.1221695283 * Math.pow(k - 60, -0.0755148492);
    b = 255;
  }

  const clamp = (val: number) => Math.floor(Math.min(255, Math.max(0, val)));
  return `rgb(${clamp(r)}, ${clamp(g)}, ${clamp(b)})`;
};

const FAULTS = [
  {
    id: 'isolement',
    type: "Défaut d'isolement",
    icon: Shield,
    symptomes: [
      "Différentiel qui disjoncte",
      "Sensations de picotements au contact de masses métalliques",
      "Valeur de tension anormale entre masses et bornes actives",
      "Consommation excessive de courant",
      "Arc électrique à l'ouverture du sectionneur de terre",
      "Disjoncteurs en amont qui disjonctent dans les installations sans différentiel (trop de courant de fuite)"
    ],
    causes: "Câble abimé (clou, vis), humidité ou eau dans les prises/luminaires extérieurs, thermoplongeur détérioré, condensation, détérioration des isolants (rongeurs, surchauffe), inversion terre et phase.",
    risques: "Électrocution (contact direct ou indirect), surconsommation électrique (fuite).",
    appareil: "Mesureur d'isolement (mégohmmètre), pince de courant de fuite.",
    valeurs: "Valeur idéale : ∞ ; Valeur régl. mini : 0.5 MΩ (sous 500V).",
    valeursMesurees: "R < 0.5 MΩ (Fuite vers la terre détectée).",
    solutions: "Remplacement de l'appareil/composant (ballast, résistance), remplacement canalisation, remplacement de câble, étanchéité, assainissement.",
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    iconColor: 'border-blue-500 text-blue-500'
  },
  {
    id: 'surcharge',
    type: "Surintensité de surcharge",
    icon: Gauge,
    symptomes: [
      "Le disjoncteur tombe après un certain temps (laps de temps long)",
      "Échauffement du disjoncteur et des conducteurs",
      "Possible décoloration ou déformation du disjoncteur concerné",
      "Disjoncteur en amont (compteur) qui disjoncte vu que le courant est trop élevé"
    ],
    causes: "Circuit trop chargé (trop d'appareils), appareil consommant trop de courant (moteur bloqué), calibre disjoncteur insuffisant.",
    risques: "Détérioration de l'installation par surchauffe, incendie.",
    appareil: "Pince ampèremétrique, Ohmmètre (hors tension).",
    valeurs: "I ≤ In (Calibre) ; Résistance ≥ R (230 / Calibre).",
    valeursMesurees: "I > Calibre disjoncteur (ex: 18A pour un C16) ; Résistance plus grande que 3 Ω et moins que la limite (R = 230 / Calibre).",
    solutions: "Délester le circuit, diviser le circuit, adapter calibre/section ou adapter courbe de déclenchement.",
    color: 'text-orange-600',
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    iconColor: 'border-orange-500 text-orange-500'
  },
  {
    id: 'court-circuit',
    type: "Surintensité de court-circuit",
    icon: Flame,
    symptomes: [
      "Bruit d'explosion",
      "Réaction immédiate lors du réarmement",
      "Déclenchement en amont",
      "Flash visible"
    ],
    causes: "Contact accidentel entre conducteurs actifs, erreur de raccordement, canalisation percée, appareil défectueux immergé.",
    risques: "Détérioration brutale de l'installation, incendie, brûlures par arc électrique.",
    appareil: "Ohmmètre (impérativement HORS TENSION).",
    valeurs: "Résistance ≥ R (230 / Calibre).",
    valeursMesurees: "R ≤ 3 Ω (Contact direct entre Phase et Neutre).",
    solutions: "Localiser/supprimer point de contact, réparer conducteurs, remplacer appareillage, corriger erreurs câblage.",
    color: 'text-red-600',
    bg: 'bg-red-50',
    border: 'border-red-200',
    iconColor: 'border-red-500 text-red-500'
  },
  {
    id: 'alimentation',
    type: "Défaut d'alimentation",
    icon: PlugZap,
    symptomes: [
      "Absence tension (installation bipolaire )",
      "Installation fonctionnant partiellement",
      "Baisse puissance lumineuse",
      "Certains appareils ne fonctionnent pas que quand d'autres fonctionnent",
      "Augmentation de voltage pour certains appareils et diminution pour d'autres (rupture neutre)"
    ],
    causes: "Panne réseau GRD, disjoncteur/différentiel déclenché, contacts brûlés, bornes desserrées/oxydées, fil mal inséré, rupture neutre.",
    risques: "Détérioration appareils (sous/survoltage), danger d'électrocution, non-fonctionnement services essentiels.",
    appareil: "Voltmètre ou testeur de tension (sous tension), testeur de continuité (hors tension).",
    valeurs: "230V entre phase et neutre.",
    valeursMesurees: "0 V ou tension anormale (< 210 V ou > 250 V).",
    solutions: "Réarmement, resserrage bornes, remplacement composants (télérupteur, prise), intervention GRD.",
    color: 'text-purple-600',
    bg: 'bg-purple-50',
    border: 'border-purple-200',
    iconColor: 'border-purple-500 text-purple-500'
  }
];

interface Appliance {
  id: string;
  name: string;
  power: number;
  hours: number;
  emoji: string;
}

interface SchemaCircuit {
  id: string;
  name: string;
  type: 'prise' | 'luminaire' | 'cuisson' | 'ev' | 'chauffe-eau' | 'chauffage';
  rating: number; // 10, 16, 20, 32, 40
  section: number; // 1.5, 2.5, 4, 6
  diff: 'A' | 'AC';
}

interface InfluenceRow {
  id: string;
  local: string;
  AA: string;
  AD: string;
  AE: string;
  AF: string;
  AG: string;
  AH: string;
  AK: string;
  AL: string;
  BA: string;
  BB: string;
  BC: string;
  BD: string;
  BE: string;
  CA: string;
  CB: string;
}

const INFLUENCES_CONFIG = {
  AA: {
    category: 'A',
    title: 'Température',
    options: [
      { code: 'AA1', label: '-60°C à +5°C', desc: 'Froid extrême (entrepôts frigorifiques)' },
      { code: 'AA2', label: '-40°C à +5°C', desc: 'Froid intense' },
      { code: 'AA3', label: '-25°C à +5°C', desc: 'Froid modéré (extérieurs montagneux en Belgique)' },
      { code: 'AA4', label: '-5°C à +40°C', desc: 'Tempéré résidentiel standard (Belgique)' },
      { code: 'AA5', label: '+5°C à +40°C', desc: 'Intérieur tempéré chauffé' },
      { code: 'AA6', label: '+5°C à +60°C', desc: 'Chaleur extrême (fonderies, chaufferies)' },
    ]
  },
  AD: {
    category: 'A',
    title: 'Eau',
    options: [
      { code: 'AD1', label: 'Négligeable', desc: 'Aucun risque d\'humidité (salon, bureau). IPX0 exécution normale.' },
      { code: 'AD2', label: 'T. humide', desc: 'Chute verticale de gouttes d\'eau (cuisine). Requis IPX1 ou IPX2.' },
      { code: 'AD3', label: 'Humides', desc: 'Pluie ou aspersion à moins de 60° (balcon couvert). Requis IPX3.' },
      { code: 'AD4', label: 'Mouillés', desc: 'Projections d\'eau de toutes directions (salle de bain/douche). Requis IPX4.' },
      { code: 'AD5', label: 'Arrosés', desc: 'Jets d\'eau sous pression (lavage, extérieur). Requis IPX5.' },
      { code: 'AD6', label: 'Paquets d\'eau', desc: 'Vagues ou jets puissants (bords de mer). Requis IPX6.' },
      { code: 'AD7', label: 'Immergés', desc: 'Immersion temporaire sous eau douce (piscine). Requis IPX7.' },
      { code: 'AD8', label: 'Submergés', desc: 'Sous eau en permanence sous pression (fond de piscine). Requis IPX8.' },
    ]
  },
  AE: {
    category: 'A',
    title: 'Corps solide',
    options: [
      { code: 'AE1', label: 'Négligeable', desc: 'Pas de poussière ou corps étrangers. IP0X ou IP2X.' },
      { code: 'AE2', label: 'Petits', desc: 'Outils ou corps fins > 2.5 mm. IP3X.' },
      { code: 'AE3', label: 'Très petits', desc: 'Fils de cuivre/acier ou corps > 1 mm. IP4X.' },
      { code: 'AE4', label: 'Poussières', desc: 'Dépôts importants de poussières (ateliers, menuiserie). IP5X ou IP6X.' },
    ]
  },
  AF: {
    category: 'A',
    title: 'Corrosion',
    options: [
      { code: 'AF1', label: 'Négligeable', desc: 'Pas d\'agent corrosif notable.' },
      { code: 'AF2', label: 'Atmosphérique', desc: 'Corrosion liée au sel, air marin ou pollution côtière belge.' },
      { code: 'AF3', label: 'Int. occ.', desc: 'Risque de projection chimique de courte durée (laboratoires).' },
      { code: 'AF4', label: 'Permanente', desc: 'Présence continue d\'agents corrosifs industriels denses.' },
    ]
  },
  AG: {
    category: 'A',
    title: 'Chocs',
    options: [
      { code: 'AG1', label: 'Faibles', desc: 'Habitations résidentielles et bureaux standards. Tenue IK02-IK06.' },
      { code: 'AG2', label: 'Moyennes', desc: 'Ateliers standard ou zones d\'activité légères. IK07-IK08.' },
      { code: 'AG3', label: 'Importantes', desc: 'Garages d\'autobus, industries lourdes, voies de circulation publics. IK10 requis.' },
    ]
  },
  AH: {
    category: 'A',
    title: 'Vibrations',
    options: [
      { code: 'AH1', label: 'Faibles', desc: 'Installation normale sans vibration notable.' },
      { code: 'AH2', label: 'Moyennes', desc: 'Proximité immédiate de moteurs ou grandes machines.' },
      { code: 'AH3', label: 'Importantes', desc: 'Fixation directe sur machines lourdes vibrantes ou voies ferrées.' },
    ]
  },
  AK: {
    category: 'A',
    title: 'Flore',
    options: [
      { code: 'AK1', label: 'Négligeable', desc: 'Aucun risque lié à la végétation.' },
      { code: 'AK2', label: 'Risques', desc: 'Développement envahissant de moisissures ou racines (souterrains, serres).' },
    ]
  },
  AL: {
    category: 'A',
    title: 'Faune',
    options: [
      { code: 'AL1', label: 'Négligeable', desc: 'Pas de nuisibles.' },
      { code: 'AL2', label: 'Risques', desc: 'Présence fréquente de rongeurs, insectes ou oiseaux (greniers, étables, hangars).' },
    ]
  },
  BA: {
    category: 'B',
    title: 'Compétence',
    options: [
      { code: 'BA1', label: 'Ordinaires', desc: 'Personnes ordinaires non averties (logements privés, commerces).' },
      { code: 'BA2', label: 'Enfants', desc: 'Crèches, écoles maternelles. Protection enfants obligatoire.' },
      { code: 'BA3', label: 'Handicapés', desc: 'Établissements médicaux ou résidences belges adaptées.' },
      { code: 'BA4', label: 'Averties', desc: 'Locaux industriels d\'exploitation sous supervision (personnels formés BA4).' },
      { code: 'BA5', label: 'Qualifiées', desc: 'Personnes qualifiées ou électriciens habilités BA5 (clé ou surveillance).' },
    ]
  },
  BB: {
    category: 'B',
    title: 'Résistance corps',
    options: [
      { code: 'BB1', label: 'Peau sèche', desc: 'Conditions normales de résistance de peau sèche : Tension limite de contact UB = 50V AC.' },
      { code: 'BB2', label: 'Peau mouillée', desc: 'Salle de bain/douche ou extérieur. Résistance réduite : Tension limite de contact UB = 25V AC.' },
      { code: 'BB3', label: 'Immergée', desc: 'Piscines ou spas. Résistance extrêmement faible : Tension limite de contact UB = 12V AC.' },
    ]
  },
  BC: {
    category: 'B',
    title: 'Contact Terre',
    options: [
      { code: 'BC1', label: 'Nul', desc: 'Revêtement isolant (bureau moquetté). Aucun contact d\'appui direct de terre.' },
      { code: 'BC2', label: 'Faibles', desc: 'Fréquentation standard d\'un atelier avec sols en béton.' },
      { code: 'BC3', label: 'Fréquents', desc: 'Contacts réguliers d\'appui avec structures métalliques reliées à la terre.' },
      { code: 'BC4', label: 'Continus', desc: 'Sujets entourés de parois conductrice (intérieurs de cuve métal, chaudière).' },
    ]
  },
  BD: {
    category: 'B',
    title: 'Évacuation',
    options: [
      { code: 'BD1', label: 'Normal', desc: 'Évacuation aisée des personnes en cas d\'urgence.' },
      { code: 'BD2', label: 'Longue', desc: 'Immeubles de grande hauteur (IGH) ou de grande longueur.' },
      { code: 'BD3', label: 'Encombrée', desc: 'Lieux publics belges à haute densité (salles de spectacles, écoles).' },
      { code: 'BD4', label: 'L. & Encombrée', desc: 'Gares souterraines, hôpitaux, IGH ERP de grande capacité.' },
    ]
  },
  BE: {
    category: 'B',
    title: 'Matières traitées',
    options: [
      { code: 'BE1', label: 'Normal', desc: 'Pas de risque spécifique de feu ou pollution.' },
      { code: 'BE2', label: 'Risque incendie', desc: 'Présence de poussières, copeaux de bois, papier suspendu (menuiseries, granges).' },
      { code: 'BE3', label: 'Risque explosion', desc: 'Stockage d\'hydrocarbure, gaz, solvants inflammables (zones ATEX).' },
      { code: 'BE4', label: 'Risque contam.', desc: 'Traitement de produits alimentaires ou pharmaceutique sensibles.' },
    ]
  },
  CA: {
    category: 'C',
    title: 'Construction',
    options: [
      { code: 'CA1', label: 'Non combust.', desc: 'Murs en briques, parpaings, plâtre ignifuge, béton.' },
      { code: 'CA2', label: 'Combustibles', desc: 'Murs et charpentes bois, chalets préfabriqués (liaison coupe-feu indispensable).' },
    ]
  },
  CB: {
    category: 'C',
    title: 'Structure',
    options: [
      { code: 'CB1', label: 'Négligeable', desc: 'Pas de risque structurel.' },
      { code: 'CB2', label: 'Propag. feu', desc: 'Effets cheminée importants (gaines verticales ou toitures extensives, faux-plafonds).' },
      { code: 'CB3', label: 'Mouvements', desc: 'Sols d\'argile gonflante ou structures de ponts sujettes à des dilatations.' },
      { code: 'CB4', label: 'Flex. / Inst.', desc: 'Bâtiments temporaires mobiles, échafaudages ou toiles tendues.' },
    ]
  }
};

const DEFAULT_INFLUENCE_ROWS: InfluenceRow[] = [
  {
    id: '1',
    local: 'Salon / Séjour',
    AA: 'AA5', AD: 'AD1', AE: 'AE1', AF: 'AF1', AG: 'AG1', AH: 'AH1', AK: 'AK1', AL: 'AL1',
    BA: 'BA1', BB: 'BB1', BC: 'BC1', BD: 'BD1', BE: 'BE1', CA: 'CA1', CB: 'CB1'
  },
  {
    id: '2',
    local: 'Cuisine',
    AA: 'AA5', AD: 'AD2', AE: 'AE2', AF: 'AF1', AG: 'AG1', AH: 'AH1', AK: 'AK1', AL: 'AL1',
    BA: 'BA1', BB: 'BB1', BC: 'BC2', BD: 'BD1', BE: 'BE1', CA: 'CA1', CB: 'CB1'
  },
  {
    id: '3',
    local: 'Salle de Bain (SDB)',
    AA: 'AA5', AD: 'AD4', AE: 'AE1', AF: 'AF1', AG: 'AG1', AH: 'AH1', AK: 'AK1', AL: 'AL1',
    BA: 'BA1', BB: 'BB2', BC: 'BC3', BD: 'BD1', BE: 'BE1', CA: 'CA1', CB: 'CB1'
  },
  {
    id: '4',
    local: 'Garage / Atelier',
    AA: 'AA4', AD: 'AD2', AE: 'AE3', AF: 'AF2', AG: 'AG2', AH: 'AH1', AK: 'AK1', AL: 'AL1',
    BA: 'BA1', BB: 'BB1', BC: 'BC2', BD: 'BD1', BE: 'BE2', CA: 'CA1', CB: 'CB1'
  },
  {
    id: '5',
    local: 'Jardin / Extérieur',
    AA: 'AA3', AD: 'AD5', AE: 'AE4', AF: 'AF2', AG: 'AG2', AH: 'AH1', AK: 'AK2', AL: 'AL2',
    BA: 'BA1', BB: 'BB2', BC: 'BC3', BD: 'BD1', BE: 'BE1', CA: 'CA2', CB: 'CB1'
  },
  {
    id: '6',
    local: 'Cave Humide',
    AA: 'AA5', AD: 'AD3', AE: 'AE2', AF: 'AF2', AG: 'AG1', AH: 'AH1', AK: 'AK1', AL: 'AL2',
    BA: 'BA1', BB: 'BB2', BC: 'BC3', BD: 'BD1', BE: 'BE1', CA: 'CA1', CB: 'CB3'
  },
  {
    id: '7',
    local: 'Piscine',
    AA: 'AA5', AD: 'AD8', AE: 'AE1', AF: 'AF1', AG: 'AG1', AH: 'AH1', AK: 'AK1', AL: 'AL1',
    BA: 'BA1', BB: 'BB3', BC: 'BC3', BD: 'BD1', BE: 'BE1', CA: 'CA1', CB: 'CB1'
  }
];

const getInfluenceDiagnostics = (row: InfluenceRow) => {
  const warnings: string[] = [];
  let ipWater = 'IPX0';
  let ipDust = 'IP2X';
  let ikRating = 'IK02';

  // Water AD
  if (row.AD === 'AD1') ipWater = 'IPX0';
  else if (row.AD === 'AD2') ipWater = 'IPX1 / IPX2';
  else if (row.AD === 'AD3') ipWater = 'IPX3';
  else if (row.AD === 'AD4') ipWater = 'IPX4';
  else if (row.AD === 'AD5') ipWater = 'IPX5';
  else if (row.AD === 'AD6') ipWater = 'IPX6';
  else if (row.AD === 'AD7') ipWater = 'IPX7';
  else if (row.AD === 'AD8') ipWater = 'IPX8';

  // Dust AE
  if (row.AE === 'AE1') ipDust = 'IP2X';
  else if (row.AE === 'AE2') ipDust = 'IP3X';
  else if (row.AE === 'AE3') ipDust = 'IP4X';
  else if (row.AE === 'AE4') ipDust = 'IP5X / IP6X';

  // RGIE belge / AREI : Pour l'immersion sous pression (AD8 / IPX8), l'indice pour les solides est au minimum de 5 ou 6, voire 7 (IP58 / IP68 obligatoire pour garantir l'étanchéité mécanique)
  if (row.AD === 'AD8') {
    if (ipDust === 'IP2X' || ipDust === 'IP3X' || ipDust === 'IP4X') {
      ipDust = 'IP5X / IP6X';
      warnings.push("RGIE (Belgique) - Immersion (AD8 - IPX8) : L'immersion sous pression exige de fait une étanchéité accrue contre les poussières et corps solides (degré minimum IP5X ou IP6X, ce qui impose une enveloppe IP58 ou IP68).");
    }
  }

  // Chocs AG
  if (row.AG === 'AG1') ikRating = 'IK02-IK06';
  else if (row.AG === 'AG2') ikRating = 'IK07-IK08';
  else if (row.AG === 'AG3') ikRating = 'IK10';

  let corrosionLabel = 'Négligeable';
  let corrosionColor = 'text-slate-600 bg-slate-50 border-slate-250';

  // Corrosion AF
  if (row.AF === 'AF2') {
    corrosionLabel = 'Atmosphérique (Salin)';
    corrosionColor = 'text-amber-800 bg-amber-50 border-amber-250';
    warnings.push("Corrosion Atmosphérique (AF2) : Air salin ou pollution côtière. Utiliser du matériel avec traitement de surface anticorrosion renforcé (polyester, composites ou acier galvanisé à chaud).");
  } else if (row.AF === 'AF3') {
    corrosionLabel = 'Intermittente (Labo)';
    corrosionColor = 'text-orange-700 bg-orange-50 border-orange-250';
    warnings.push("Corrosion Intermittente (AF3) : Risque de projection chimique temporaire. Boîtiers et composants résistants aux agents chimiques spécifiques (labo, ateliers).");
  } else if (row.AF === 'AF4') {
    corrosionLabel = 'Permanente (Sévère)';
    corrosionColor = 'text-rose-700 bg-rose-50 border-rose-250 font-black';
    warnings.push("Corrosion Permanente (AF4) : Vapoirs ou agents corrosifs continus. Enveloppes ultra-résistantes type Inox AISI 316 ou polymères anticorrosion spéciaux requises.");
  }

  // Specific risk triggers
  if (row.BA === 'BA2') {
    warnings.push("Présence d'enfants (BA2) : Prises murales avec obturateurs intégrés obligatoires.");
  }
  if (row.BB === 'BB2' || row.BB === 'BB3') {
    warnings.push(`Résistance humide/immergée (${row.BB}) : Protection amont différentielle 30mA obligatoire, TBTS privilégiable.`);
  }
  if (row.BE === 'BE2') {
    warnings.push("Risque d'incendie (BE2) : Matériel de classe II, luminaires marqués D (basse temp.) requis.");
  }
  if (row.BE === 'BE3') {
    warnings.push("Risque d'explosion (BE3) : Enceintes et matériels certifiés ATEX obligatoires, sécurité intrinsèque requise.");
  }
  if (row.CA === 'CA2') {
    warnings.push("Parois combustibles (CA2) : Boîtiers d'encastrement ignifuges non propagateurs de flamme requis.");
  }
  if (row.CB === 'CB2') {
    warnings.push("Propagation d'incendie (CB2) : Cloisonnements coupe-feu requis pour les passages de câbles.");
  }

  const cleanIpDustDigit = ipDust.includes('/') ? '5' : ipDust.replace('IP', '').replace('X', '').charAt(0);
  const cleanIpWaterDigit = ipWater.includes('/') ? '1' : ipWater.replace('IPX', '').charAt(0);
  const combinedIp = `IP${cleanIpDustDigit}${cleanIpWaterDigit}`;

  return {
    ipRequired: combinedIp === 'IP20' ? 'IP20' : combinedIp,
    ipWater,
    ipDust,
    ikRating,
    corrosionLabel,
    corrosionColor,
    warnings
  };
};

export default function App() {
  const [selectedBreaker, setSelectedBreaker] = useState<number>(16);
  const [voltage, setVoltage] = useState<number>(230);
  const [measuredResistance, setMeasuredResistance] = useState<number | string>('');
  
  // Navigation State
  const [activeTab, setActiveTab] = useState<'home' | 'threshold' | 'icc' | 'consumption' | 'notes' | 'solar' | 'pv-config' | 'ev-charger' | 'rj45' | 'autonomy' | 'specs' | 'lighting' | 'salledeau' | 'influences' | 'smart-meter' | 'rtcc' | 'meter-exam' | 'elecplan'>('home');
  
  // Security / Access Lock State - Guaranteed protected access first for code 12122012
  const [isUnlocked, setIsUnlocked] = useState<boolean>(false);

  // Idle state detection (pulses green status indicator when application is idle)
  const [isIdle, setIsIdle] = useState<boolean>(false);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;

    const resetIdleTimer = () => {
      setIsIdle(false);
      clearTimeout(timer);
      timer = setTimeout(() => {
        setIsIdle(true);
      }, 3000);
    };

    const activityEvents = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'];
    activityEvents.forEach((ev) => window.addEventListener(ev, resetIdleTimer, { passive: true }));

    timer = setTimeout(() => {
      setIsIdle(true);
    }, 3000);

    return () => {
      clearTimeout(timer);
      activityEvents.forEach((ev) => window.removeEventListener(ev, resetIdleTimer));
    };
  }, []);
  const [smartMeterState, setSmartMeterState] = useState<SmartMeterState>(INITIAL_SMART_METER_STATE);
  const [specsSubTab, setSpecsSubTab] = useState<'solar' | 'ev' | 'dedicated' | 'rcd'>('solar');
  const [selectedDedicatedAppliance, setSelectedDedicatedAppliance] = useState<string>('cooker');
  const [selectedRcdAppliance, setSelectedRcdAppliance] = useState<string>('frigo');
  const [selectedFaultId, setSelectedFaultId] = useState<string>(FAULTS[0].id);

  // PV String & Inverter Coupling States (Nouveau Concept Bilan Energétique & Parc Batterie)
  const [pvEnergyConsumptionEc, setPvEnergyConsumptionEc] = useState<number>(5000); // Ec in W or Wh
  const [pvSunHours, setPvSunHours] = useState<number>(4.5); // Peak sun hours
  const [pvBatteryPreset, setPvBatteryPreset] = useState<string>('gel_12v_250ah');
  const [pvBatteryUnitVoltage, setPvBatteryUnitVoltage] = useState<number>(12); // V
  const [pvBatteryUnitAh, setPvBatteryUnitAh] = useState<number>(250); // Ah
  const [pvBatteryType, setPvBatteryType] = useState<string>('GEL / AGM');
  const [pvUserDesiredAh, setPvUserDesiredAh] = useState<number | null>(500); // e.g. 500 Ah in user example
  const [pvManualBatteryVoltage, setPvManualBatteryVoltage] = useState<12 | 24 | 48 | null>(null);

  const [pvSeriesCount, setPvSeriesCount] = useState<number>(8);
  const [pvParallelCount, setPvParallelCount] = useState<number>(2);
  const [pvPanelPower, setPvPanelPower] = useState<number>(400);
  const [pvPanelVmp, setPvPanelVmp] = useState<number>(31.5);
  const [pvPanelImp, setPvPanelImp] = useState<number>(12.7);
  const [pvPanelVoc, setPvPanelVoc] = useState<number>(37.2);
  const [pvPanelIsc, setPvPanelIsc] = useState<number>(13.5);

  const [pvInverterPreset, setPvInverterPreset] = useState<string>('hybrid_5k');
  const [pvInverterVminMppt, setPvInverterVminMppt] = useState<number>(120);
  const [pvInverterVmaxMppt, setPvInverterVmaxMppt] = useState<number>(450);
  const [pvInverterVmaxDc, setPvInverterVmaxDc] = useState<number>(500);
  const [pvInverterImaxMppt, setPvInverterImaxMppt] = useState<number>(25);
  const [pvInverterPmaxDc, setPvInverterPmaxDc] = useState<number>(6000);
  const [pvBatteryVoltage, setPvBatteryVoltage] = useState<12 | 24 | 48>(48);
  const [pvAcOutputVoltage, setPvAcOutputVoltage] = useState<230 | 400>(230);

  const [pvMinTemp, setPvMinTemp] = useState<number>(-10);
  const [pvMaxTemp, setPvMaxTemp] = useState<number>(65);

  const applyPvBatteryPreset = (preset: string) => {
    setPvBatteryPreset(preset);
    if (preset === 'gel_12v_100ah') {
      setPvBatteryUnitVoltage(12); setPvBatteryUnitAh(100); setPvBatteryType('GEL / AGM');
    } else if (preset === 'gel_12v_150ah') {
      setPvBatteryUnitVoltage(12); setPvBatteryUnitAh(150); setPvBatteryType('GEL / AGM');
    } else if (preset === 'gel_12v_200ah') {
      setPvBatteryUnitVoltage(12); setPvBatteryUnitAh(200); setPvBatteryType('GEL / AGM');
    } else if (preset === 'gel_12v_250ah') {
      setPvBatteryUnitVoltage(12); setPvBatteryUnitAh(250); setPvBatteryType('GEL / AGM');
    } else if (preset === 'lifepo4_12v_100ah') {
      setPvBatteryUnitVoltage(12); setPvBatteryUnitAh(100); setPvBatteryType('Lithium LiFePO4');
    } else if (preset === 'lifepo4_12v_200ah') {
      setPvBatteryUnitVoltage(12); setPvBatteryUnitAh(200); setPvBatteryType('Lithium LiFePO4');
    } else if (preset === 'lifepo4_24v_100ah') {
      setPvBatteryUnitVoltage(24); setPvBatteryUnitAh(100); setPvBatteryType('Lithium LiFePO4');
    } else if (preset === 'rack_48v_100ah') {
      setPvBatteryUnitVoltage(48); setPvBatteryUnitAh(100); setPvBatteryType('Lithium Rack (5.12kWh)');
    } else if (preset === 'wall_48v_200ah') {
      setPvBatteryUnitVoltage(48); setPvBatteryUnitAh(200); setPvBatteryType('Lithium Wall (10.24kWh)');
    }
  };

  const applyPvPanelPreset = (preset: string) => {
    if (preset === '100w_12v') {
      setPvPanelPower(100); setPvPanelVmp(18.2); setPvPanelImp(5.5); setPvPanelVoc(22.5); setPvPanelIsc(6.0);
    } else if (preset === '150w_12v') {
      setPvPanelPower(150); setPvPanelVmp(18.5); setPvPanelImp(8.1); setPvPanelVoc(22.8); setPvPanelIsc(8.8);
    } else if (preset === '200w_12v') {
      setPvPanelPower(200); setPvPanelVmp(19.1); setPvPanelImp(10.5); setPvPanelVoc(23.2); setPvPanelIsc(11.2);
    } else if (preset === '370w') {
      setPvPanelPower(370); setPvPanelVmp(34.2); setPvPanelImp(10.8); setPvPanelVoc(41.5); setPvPanelIsc(11.4);
    } else if (preset === '400w') {
      setPvPanelPower(400); setPvPanelVmp(31.5); setPvPanelImp(12.7); setPvPanelVoc(37.2); setPvPanelIsc(13.5);
    } else if (preset === '450w') {
      setPvPanelPower(450); setPvPanelVmp(41.5); setPvPanelImp(10.85); setPvPanelVoc(49.8); setPvPanelIsc(11.5);
    } else if (preset === '550w') {
      setPvPanelPower(550); setPvPanelVmp(42.0); setPvPanelImp(13.1); setPvPanelVoc(49.8); setPvPanelIsc(14.0);
    }
  };

  const applyPvInverterPreset = (preset: string) => {
    setPvInverterPreset(preset);
    if (preset === 'growatt_spf_3000_24v') {
      setPvInverterVminMppt(30); setPvInverterVmaxMppt(115); setPvInverterVmaxDc(145); setPvInverterImaxMppt(80); setPvInverterPmaxDc(3000); setPvBatteryVoltage(24); setPvManualBatteryVoltage(24);
    } else if (preset === 'must_pv18_3k_24v') {
      setPvInverterVminMppt(30); setPvInverterVmaxMppt(80); setPvInverterVmaxDc(102); setPvInverterImaxMppt(60); setPvInverterPmaxDc(3000); setPvBatteryVoltage(24); setPvManualBatteryVoltage(24);
    } else if (preset === 'victron_multi_12_3000') {
      setPvInverterVminMppt(20); setPvInverterVmaxMppt(140); setPvInverterVmaxDc(150); setPvInverterImaxMppt(70); setPvInverterPmaxDc(3000); setPvBatteryVoltage(12); setPvManualBatteryVoltage(12);
    } else if (preset === 'victron_easysolar_24') {
      setPvInverterVminMppt(40); setPvInverterVmaxMppt(240); setPvInverterVmaxDc(250); setPvInverterImaxMppt(70); setPvInverterPmaxDc(3000); setPvBatteryVoltage(24); setPvManualBatteryVoltage(24);
    } else if (preset === 'growatt_spf_5000_48v') {
      setPvInverterVminMppt(120); setPvInverterVmaxMppt(430); setPvInverterVmaxDc(450); setPvInverterImaxMppt(100); setPvInverterPmaxDc(6000); setPvBatteryVoltage(48); setPvManualBatteryVoltage(48);
    } else if (preset === 'deye_sun_5k_48v') {
      setPvInverterVminMppt(150); setPvInverterVmaxMppt(425); setPvInverterVmaxDc(500); setPvInverterImaxMppt(26); setPvInverterPmaxDc(6500); setPvBatteryVoltage(48); setPvManualBatteryVoltage(48);
    } else if (preset === 'deye_sun_8k_48v') {
      setPvInverterVminMppt(150); setPvInverterVmaxMppt(425); setPvInverterVmaxDc(500); setPvInverterImaxMppt(32); setPvInverterPmaxDc(10400); setPvBatteryVoltage(48); setPvManualBatteryVoltage(48);
    } else if (preset === 'must_ph18_5k_48v') {
      setPvInverterVminMppt(60); setPvInverterVmaxMppt(145); setPvInverterVmaxDc(145); setPvInverterImaxMppt(80); setPvInverterPmaxDc(5000); setPvBatteryVoltage(48); setPvManualBatteryVoltage(48);
    } else if (preset === 'victron_easysolar_48') {
      setPvInverterVminMppt(40); setPvInverterVmaxMppt(240); setPvInverterVmaxDc(250); setPvInverterImaxMppt(100); setPvInverterPmaxDc(5000); setPvBatteryVoltage(48); setPvManualBatteryVoltage(48);
    } else if (preset === 'huawei_sun2000_5k') {
      setPvInverterVminMppt(90); setPvInverterVmaxMppt(560); setPvInverterVmaxDc(600); setPvInverterImaxMppt(12.5); setPvInverterPmaxDc(7500); setPvBatteryVoltage(48); setPvManualBatteryVoltage(48);
    } else if (preset === 'sma_sunnyboy_5k') {
      setPvInverterVminMppt(175); setPvInverterVmaxMppt(500); setPvInverterVmaxDc(600); setPvInverterImaxMppt(15); setPvInverterPmaxDc(7500); setPvBatteryVoltage(48); setPvManualBatteryVoltage(48);
    } else if (preset === 'fronius_primo_5k') {
      setPvInverterVminMppt(80); setPvInverterVmaxMppt(800); setPvInverterVmaxDc(1000); setPvInverterImaxMppt(12); setPvInverterPmaxDc(7500); setPvBatteryVoltage(48); setPvManualBatteryVoltage(48);
    }
  };

  const pvCouplingResults = useMemo(() => {
    // 1. Energy Calculation (Ec -> Ep = Ec + 25%)
    const ec = pvEnergyConsumptionEc;
    const ep = Math.round(ec * 1.25); // Ep = Ec + 25%

    // 2. Auto Battery Voltage Rule according to Ec:
    // - Ec <= 1000 W -> 12V
    // - 1000 W < Ec <= 2000 W -> 24V
    // - Ec > 2000 W -> 48V
    const autoVoltage: 12 | 24 | 48 = ec <= 1000 ? 12 : ec <= 2000 ? 24 : 48;
    const effectiveBatteryVoltage: 12 | 24 | 48 = pvManualBatteryVoltage !== null ? pvManualBatteryVoltage : autoVoltage;

    // 3. Required Capacity in Ah at effectiveBatteryVoltage (Rule: Ep / (0.8 * V_bat))
    const calculatedAhNeeded = Math.round((ep / (0.8 * effectiveBatteryVoltage)) * 10) / 10;
    const targetAhNeeded = calculatedAhNeeded;

    // 4. Battery Association Calculations
    // Number of batteries in series per string = V_bus / V_unit
    const batterySeriesCount = Math.max(1, Math.round(effectiveBatteryVoltage / pvBatteryUnitVoltage));
    // Number of parallel strings = ceil(targetAhNeeded / C_unit_Ah)
    const batteryParallelCount = Math.max(1, Math.ceil(targetAhNeeded / pvBatteryUnitAh));
    // Total batteries = batterySeriesCount * batteryParallelCount
    const totalBatteriesCount = batterySeriesCount * batteryParallelCount;

    // Installed Capacity & Energy
    const installedBatteryAh = batteryParallelCount * pvBatteryUnitAh;
    const installedBatteryWh = totalBatteriesCount * pvBatteryUnitVoltage * pvBatteryUnitAh;

    // 5. PV Panels required to produce Ep
    const requiredPvPowerW = Math.ceil(ep / pvSunHours);
    const minPanelsRequired = Math.max(1, Math.ceil(requiredPvPowerW / pvPanelPower));

    const totalPanels = pvSeriesCount * pvParallelCount;
    const totalPowerW = totalPanels * pvPanelPower;
    const totalPowerKw = totalPowerW / 1000;

    const arrayVmpNominal = pvSeriesCount * pvPanelVmp;
    const arrayVocNominal = pvSeriesCount * pvPanelVoc;

    const tempColdDiff = 25 - pvMinTemp;
    const arrayVocCold = arrayVocNominal * (1 + 0.0035 * tempColdDiff);

    const tempHotDiff = pvMaxTemp - 25;
    const arrayVmpHot = arrayVmpNominal * (1 - 0.0040 * tempHotDiff);

    const arrayImpTotal = pvParallelCount * pvPanelImp;
    const arrayIscTotal = pvParallelCount * pvPanelIsc;

    const isOverVoltageMaxDc = arrayVocCold > pvInverterVmaxDc;
    const isUnderMpptMin = arrayVmpHot < pvInverterVminMppt;
    const isOverMpptMax = arrayVmpNominal > pvInverterVmaxMppt;
    const isOverCurrentMppt = arrayImpTotal > pvInverterImaxMppt;
    const isOverPowerInverter = totalPowerW > pvInverterPmaxDc * 1.3;

    // Battery system side calculations
    const batteryCurrentPeakA = Math.round((totalPowerW / effectiveBatteryVoltage) * 10) / 10;
    const inverterMaxBatteryCurrentA = Math.round((pvInverterPmaxDc / effectiveBatteryVoltage) * 10) / 10;
    
    // AC output calculations
    const acVoltage = pvAcOutputVoltage;
    const acCurrentNominalA = Math.round((pvInverterPmaxDc / (pvAcOutputVoltage === 400 ? (400 * Math.sqrt(3)) : 230)) * 10) / 10;

    const recommendedBatteryCable = effectiveBatteryVoltage === 12 
      ? '50 mm² à 95 mm²' 
      : effectiveBatteryVoltage === 24 
        ? '35 mm² à 50 mm²' 
        : '16 mm² à 25 mm²';

    const powerRatioPercent = pvInverterPmaxDc > 0 ? Math.round((totalPowerW / pvInverterPmaxDc) * 100) : 100;

    return {
      ec,
      ep,
      autoVoltage,
      effectiveBatteryVoltage,
      calculatedAhNeeded,
      targetAhNeeded,
      batterySeriesCount,
      batteryParallelCount,
      totalBatteriesCount,
      installedBatteryAh,
      installedBatteryWh,
      requiredPvPowerW,
      minPanelsRequired,
      totalPanels,
      totalPowerW,
      totalPowerKw,
      powerRatioPercent,
      arrayVmpNominal,
      arrayVocNominal,
      arrayVocCold,
      arrayVmpHot,
      arrayImpTotal,
      arrayIscTotal,
      isOverVoltageMaxDc,
      isUnderMpptMin,
      isOverMpptMax,
      isOverCurrentMppt,
      isOverPowerInverter,
      pvBatteryVoltage: effectiveBatteryVoltage,
      batteryCurrentPeakA,
      inverterMaxBatteryCurrentA,
      acVoltage,
      acCurrentNominalA,
      recommendedBatteryCable
    };
  }, [
    pvEnergyConsumptionEc, pvSunHours, pvBatteryUnitVoltage, pvBatteryUnitAh, pvUserDesiredAh, pvManualBatteryVoltage,
    pvSeriesCount, pvParallelCount, pvPanelPower, pvPanelVmp, pvPanelImp,
    pvPanelVoc, pvPanelIsc, pvInverterVminMppt, pvInverterVmaxMppt,
    pvInverterVmaxDc, pvInverterImaxMppt, pvInverterPmaxDc, pvAcOutputVoltage, pvMinTemp, pvMaxTemp
  ]);

  // Bathroom safety states
  const [bathStandardYear, setBathStandardYear] = useState<'PRE_2025' | 'POST_2025'>('POST_2025');
  const [bathEquipmentType, setBathEquipmentType] = useState<'shower' | 'bathtub'>('shower');
  const [testEquipmentType, setTestEquipmentType] = useState<'socket' | 'switch' | 'light' | 'waterheater' | 'towel_dryer' | 'tbts_12v'>('socket');
  const [testPlacementZone, setTestPlacementZone] = useState<'volume_0' | 'volume_1' | 'volume_1bis' | 'volume_2' | 'lieu_l'>('lieu_l');
  const [testConnectionType, setTestConnectionType] = useState<'plug' | 'direct'>('plug');
  const [testIpRating, setTestIpRating] = useState<'ipx0' | 'ipx1' | 'ipx4' | 'ipx7'>('ipx4');
  const [bathtubViewMode, setBathtubViewMode] = useState<'coupe' | 'plan'>('plan');
  const [guideSelectedVolume, setGuideSelectedVolume] = useState<'volume_0' | 'volume_1' | 'volume_1bis' | 'volume_2' | 'lieu_l'>('volume_1');
  const [hasGlassPartition, setHasGlassPartition] = useState<boolean>(true);
  const [glassPartitionDepth, setGlassPartitionDepth] = useState<number>(0.8); // in meters, e.g. 0.6, 0.8, 1.0, 1.2
  const [showExtendedRadialZone, setShowExtendedRadialZone] = useState<boolean>(true); // 4.0m radial zone from faucet
  const [vol1bisTooltipVisible, setVol1bisTooltipVisible] = useState<boolean>(false);
  const [socketHas10mADifferential, setSocketHas10mADifferential] = useState<boolean>(false);
  const [socketHasTransformer, setSocketHasTransformer] = useState<boolean>(false);
  const [lightTemp, setLightTemp] = useState<number>(3000);
  const [lightLumens, setLightLumens] = useState<number>(800);
  const [lightDistance, setLightDistance] = useState<number>(3);
  const [lightAngle, setLightAngle] = useState<number>(120);
  const [targetLux, setTargetLux] = useState<number>(200);
  const [lightArea, setLightArea] = useState<number>(0);

  // Sync selected guide volume tab with active virtual tester zone
  useEffect(() => {
    setGuideSelectedVolume(testPlacementZone);
  }, [testPlacementZone]);

  // Sync lighting area whenever distance or angle changes
  useEffect(() => {
    const angleRad = (lightAngle * Math.PI) / 180;
    const radius = lightDistance * Math.tan(angleRad / 2);
    const area = Math.PI * Math.pow(radius, 2);
    setLightArea(Number(area.toFixed(2)));
  }, [lightDistance, lightAngle]);

  const handleAreaChange = (newArea: number) => {
    setLightArea(newArea);
    const angleRad = (lightAngle * Math.PI) / 180;
    const tanHalfAngle = Math.tan(angleRad / 2);
    if (tanHalfAngle > 0) {
      const newDistance = Math.sqrt(newArea / Math.PI) / tanHalfAngle;
      setLightDistance(Number(newDistance.toFixed(2)));
    }
  };

  // Icc Calculator State
  const [cableLength, setCableLength] = useState<number>(20);
  const [selectedSection, setSelectedSection] = useState<number>(2.5);
  const [shortCircuitDuration, setShortCircuitDuration] = useState<number>(1);

  // External Influences State
  const [influenceRows, setInfluenceRows] = useState<InfluenceRow[]>(() => {
    const saved = localStorage.getItem('voltscope_influence_rows');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return DEFAULT_INFLUENCE_ROWS;
  });
  const [selectedInfluenceRowId, setSelectedInfluenceRowId] = useState<string>('1');
  const [selectedInfluenceColKey, setSelectedInfluenceColKey] = useState<string>('AD');
  const [newLocalName, setNewLocalName] = useState<string>('');

  useEffect(() => {
    localStorage.setItem('voltscope_influence_rows', JSON.stringify(influenceRows));
  }, [influenceRows]);

  // Consumption Calculator State
  const [kwhPrice, setKwhPrice] = useState<number>(0.25);
  const [appliances, setAppliances] = useState<Appliance[]>([
    { id: '1', name: 'Réfrigérateur', power: 150, hours: 0, emoji: '❄️' },
    { id: '2', name: 'Télévision', power: 60, hours: 0, emoji: '📺' },
    { id: '3', name: 'PC Bureau', power: 70, hours: 0, emoji: '💻' },
    { id: '4', name: 'Sèche-linge', power: 2500, hours: 0, emoji: '👕' },
    { id: '5', name: 'Lave-linge', power: 2000, hours: 0, emoji: '🧼' },
    { id: '6', name: 'Switch', power: 10, hours: 0, emoji: '🔌' },
    { id: '7', name: 'Caméra', power: 5, hours: 0, emoji: '📹' },
    { id: '8', name: 'Box Internet', power: 15, hours: 0, emoji: '📡' },
    { id: '9', name: 'Capteur lampe', power: 1, hours: 0, emoji: '💡' },
  ]);
  const [newAppliance, setNewAppliance] = useState({ name: '', power: '', hours: '0', emoji: '🔌' });

  // Schema Unifilaire States
  const [schemaIncomerRating, setSchemaIncomerRating] = useState<number>(45); // 45A standard
  const [schemaGroundResistance, setSchemaGroundResistance] = useState<number>(35); // 35 Ohms standard
  const [schemaCircuits, setSchemaCircuits] = useState<SchemaCircuit[]>([
    { id: 'c1', name: 'Prises Salon', type: 'prise', rating: 16, section: 2.5, diff: 'AC' },
    { id: 'c2', name: 'Lumières RDC', type: 'luminaire', rating: 10, section: 1.5, diff: 'AC' },
    { id: 'c3', name: 'Plaque Cuisson', type: 'cuisson', rating: 32, section: 6.0, diff: 'A' },
    { id: 'c4', name: 'Prises Cuisine', type: 'prise', rating: 20, section: 2.5, diff: 'A' },
    { id: 'c5', name: 'Chauffe-Eau', type: 'chauffe-eau', rating: 20, section: 2.5, diff: 'AC' },
    { id: 'c6', name: 'Chauffage SDB', type: 'chauffage', rating: 20, section: 2.5, diff: 'AC' },
  ]);

  const [newCircuitName, setNewCircuitName] = useState<string>('');
  const [newCircuitType, setNewCircuitType] = useState<'prise' | 'luminaire' | 'cuisson' | 'ev' | 'chauffe-eau' | 'chauffage'>('prise');
  const [newCircuitRating, setNewCircuitRating] = useState<number>(16);
  const [newCircuitSection, setNewCircuitSection] = useState<number>(2.5);
  const [newCircuitDiff, setNewCircuitDiff] = useState<'A' | 'AC'>('AC');

  // AI Position Plan Analyzer States
  const activeStandard = 'RGIE';
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadFileName, setUploadFileName] = useState<string | null>(null);
  const [aiAnalysisResult, setAiAnalysisResult] = useState<{
    circuits: SchemaCircuit[];
    auditSummary: string;
    complianceAlerts: string[];
    rgieTips: string[];
    wiringInstructions: string[];
  } | null>(null);
  const [loadingStepName, setLoadingStepName] = useState<string>('');

  // Solar State
  const [solarPanelPower, setSolarPanelPower] = useState<number>(400); // 400 W
  const [solarPanelCount, setSolarPanelCount] = useState<number>(10); // 10 panels
  const [sunlightHours, setSunlightHours] = useState<number>(4);
  const [solarAppliancePower, setSolarAppliancePower] = useState<number>(1000); // 1000 W
  const [solarTargetConsumption, setSolarTargetConsumption] = useState<number>(15); // 15 kWh/day
  const [solarInstantLoad, setSolarInstantLoad] = useState<number>(2000); // 2000 W
  const [solarBatteryAh, setSolarBatteryAh] = useState<number>(200); // 200 Ah
  const [solarBatteryVoltage, setSolarBatteryVoltage] = useState<number>(12); // 12V
  const [solarPeAcSection, setSolarPeAcSection] = useState<number>(2.5); // Section PE AC standard (e.g. 2.5 mm2)
  const [solarHasMechanicalProtection, setSolarHasMechanicalProtection] = useState<boolean>(false); // Pose protégée ou non

  // Expert Calculator State
  const [expertPower, setExpertPower] = useState<number>(1000);
  const [expertResistance, setExpertResistance] = useState<number>(52.9);
  const [expertCurrent, setExpertCurrent] = useState<number>(4.35);
  const [expertQuantity, setExpertQuantity] = useState<number>(1);
  const [expertLastChange, setExpertLastChange] = useState<'power' | 'resistance' | 'current'>('power');
  
  // Billing State
  const [billingKWh, setBillingKWh] = useState<number>(0);
  const [billingPrice, setBillingPrice] = useState<number>(0.30);

  // EV Charger State
  const [batteryCapacity, setBatteryCapacity] = useState<number>(50); // 50 kWh
  const [chargerPower, setChargerPower] = useState<number>(7.4); // 7.4 kW (typical home wallbox)
  const [currentCharge, setCurrentCharge] = useState<number>(20); // 20%
  const [evPricePerKWh, setEvPricePerKWh] = useState<number>(0.30); // 0.30 €/kWh default

  // RJ45 State
  const [rjStandard] = useState<'T568B'>('T568B');
  const [selectedRJ45Type, setSelectedRJ45Type] = useState<string | null>(null);

  const rj45Types = [
    { name: 'UTP', full: 'U/UTP', desc: 'Unshielded Twisted Pair', detail: 'Aucun blindage. Sensible aux interférences. Utilisation domestique standard.' },
    { name: 'FTP', full: 'F/UTP', desc: 'Foiled Twisted Pair', detail: 'Blindage général par feuillard aluminium autour de toutes les paires.' },
    { name: 'STP', full: 'U/FTP', desc: 'Shielded Twisted Pair', detail: 'Blindage individuel de chaque paire avec un feuillard aluminium.' },
    { name: 'F/FTP', full: 'F/FTP', desc: 'Foiled/Foiled Twisted Pair', detail: 'Feuillard autour de chaque paire PLUS un feuillard général.' },
    { name: 'S/FTP', full: 'S/FTP', desc: 'Shielded/Foiled Twisted Pair', detail: 'Feuillard autour de chaque paire PLUS une tresse de cuivre générale.' },
    { name: 'SF/UTP', full: 'SF/UTP', desc: 'Shielded Foiled Twisted Pair', detail: 'Tresse de cuivre ET feuillard général autour des paires non blindées.' },
  ];

  const dedicatedAppliances = [
    {
      id: "cooker",
      name: "Taque électrique",
      power: "6000W - 11000W",
      breaker: "32A (Monophasé) ou 16A/20A (Triphasé)",
      cable: "6 mm² (Monophasé) ou 4 mm² (Triphasé)",
      breakerSize: "32A",
      cableSize: "3x6.0 mm²",
      connection: "Boîte de raccordement murale (nez de dalle) sans prise",
      rcd: "Type A (300mA ou 30mA)",
      rcdValue: "300mA",
      rcdInfo: "Sur différentiel 300 mA (Général / Principal)",
      rgie: "Circuit direct obligatoire avec section minimale de 6 mm² (Mono) ou 4 mm² (Tri/Tétra).",
      alert: "L'emploi de câbles de 2.5 mm² pour une taque monophasée 32A constitue une infraction majeure avec risque grave d'incendie."
    },
    {
      id: "washing",
      name: "Machine à laver",
      power: "2000W - 2800W",
      breaker: "16A ou 20A",
      cable: "2.5 mm²",
      breakerSize: "20A",
      cableSize: "3x2.5 mm²",
      connection: "Prise murale standard 16A avec contact de terre",
      rcd: "Type A (30mA)",
      rcdValue: "30mA",
      rcdInfo: "Sur différentiel 30 mA (Obligatoire - Fonction humide)",
      rgie: "Circuit dédié exclusif obligatoire (RGIE Livre 1). Ne doit alimenter aucun autre appareil.",
      alert: "L'installation dans des buanderies humides exige des prises IP44 résistantes aux projections."
    },
    {
      id: "dryer",
      name: "Sèche-linge",
      power: "2000W - 3000W",
      breaker: "16A ou 20A",
      cable: "2.5 mm²",
      breakerSize: "20A",
      cableSize: "3x2.5 mm²",
      connection: "Prise murale standard 16A avec contact de terre",
      rcd: "Type A (30mA)",
      rcdValue: "30mA",
      rcdInfo: "Sur différentiel 30 mA (Obligatoire - Fonction humide)",
      rgie: "Doit disposer de sa propre ligne individuelle séparée du lave-linge.",
      alert: "Le pontage du sèche-linge et du lave-linge sur un seul disjoncteur provoque des déclenchements constants par surcharge."
    },
    {
      id: "dishwasher",
      name: "Lave-vaisselle",
      power: "2000W - 2400W",
      breaker: "16A ou 20A",
      cable: "2.5 mm²",
      breakerSize: "20A",
      cableSize: "3x2.5 mm²",
      connection: "Prise murale avec contact de terre sous le plan de travail",
      rcd: "Type A (30mA)",
      rcdValue: "30mA",
      rcdInfo: "Sur différentiel 30 mA (Obligatoire - Fonction humide)",
      rgie: "Ligne dédiée préconisée pour assurer la continuité de service des cycles chauds.",
      alert: "La hauteur de la prise doit être bien calculée pour éviter les coulées d'eau accidentelles sous l'évier."
    },
    {
      id: "oven",
      name: "Four électrique",
      power: "2500W - 3600W",
      breaker: "16A ou 20A",
      cable: "2.5 mm²",
      breakerSize: "20A",
      cableSize: "3x2.5 mm²",
      connection: "Prise murale ou câble direct dans boîte d'encastrement",
      rcd: "Type A (300mA / Option 30mA)",
      rcdValue: "300mA",
      rcdInfo: "Sur différentiel 300 mA (Général / Principal, ou 30mA au choix)",
      rgie: "Un disjoncteur séparé exclusif est requis pour le four en raison de son échauffement continu.",
      alert: "Interdit de raccorder le four encastrable sur le même circuit que les prises de cuisine générales."
    },
    {
      id: "refrigerator",
      name: "Réfrigérateur",
      power: "150W - 400W",
      breaker: "16A ou 20A",
      cable: "2.5 mm²",
      breakerSize: "20A",
      cableSize: "3x2.5 mm²",
      connection: "Prise murale avec fiche avec contact de terre",
      rcd: "Type A (300mA conseillé)",
      rcdValue: "300mA",
      rcdInfo: "Sur différentiel 300 mA (Hautement conseillé pour éviter les coupures)",
      rgie: "Recommandé sur un circuit dédié (ou partagé) protégé par un différentiel séparé pour éviter la coupure de la chaîne du froid.",
      alert: "Assurez-vous de l'absence de déclenchement intempestif général pour préserver vos aliments stockés."
    },
    {
      id: "fridge",
      name: "Frigo / Congélateur",
      power: "150W - 350W",
      breaker: "16A ou 20A",
      cable: "2.5 mm²",
      breakerSize: "20A",
      cableSize: "3x2.5 mm²",
      connection: "Prise de courant murale dédiée",
      rcd: "Type A (300mA conseillé)",
      rcdValue: "300mA",
      rcdInfo: "Sur différentiel 300 mA (Conseillé pour prémunir des coupures intempestives)",
      rgie: "Bien que non obligatoire en circuit séparé strict, un départ individuel évite qu'une panne d'autres prises ne coupe le congélateur.",
      alert: "Placer préférentiellement hors différentiel 30mA s'il n'alimente pas de zone humide, selon tolérances belges."
    },
    {
      id: "hydrophore",
      name: "Groupe Hydrophore",
      power: "800W - 1500W",
      breaker: "16A ou 20A",
      cable: "2.5 mm²",
      breakerSize: "20A",
      cableSize: "3x2.5 mm²",
      connection: "Prise étanche IP55 ou raccordement étanche direct",
      rcd: "Type A (30mA)",
      rcdValue: "30mA",
      rcdInfo: "Sur différentiel 30 mA (Obligatoire - Contact direct d'eau)",
      rgie: "Le groupe hydrophore étant en contact direct avec l'eau de pluie/puit, la haute sensibilité 30mA est obligatoire.",
      alert: "Mise à la terre particulièrement critique pour éviter les tensions de contact sur le corps métallique de la pompe."
    },
    {
      id: "microwave",
      name: "Four Micro-ondes",
      power: "900W - 1600W",
      breaker: "16A ou 20A",
      cable: "2.5 mm²",
      breakerSize: "20A",
      cableSize: "3x2.5 mm²",
      connection: "Prise murale standard de cuisine",
      rcd: "Type A (300mA / Option 30mA)",
      rcdValue: "300mA",
      rcdInfo: "Sur différentiel 300 mA (Général / Principal, ou 30mA au choix)",
      rgie: "Doit être placé sur une ligne séparée s'il est encastré ou de forte puissance continue.",
      alert: "L'usage simultané avec d'autres appareils sur prises de plan de travail déclenchera le disjoncteur."
    },
    {
      id: "vmc",
      name: "Ventilation VMC",
      power: "40W - 150W",
      breaker: "6A, 10A ou 16A",
      cable: "1.5 mm² ou 2.5 mm²",
      breakerSize: "10A",
      cableSize: "3x1.5 mm²",
      connection: "Boîtier de dérivation ou interrupteur multiposition",
      rcd: "Type A (300mA)",
      rcdValue: "300mA",
      rcdInfo: "Sur différentiel 300 mA (Recommandé pour garantir l'aération continue)",
      rgie: "Circuit de ventilation dédié conseillé pour la continuité d'aération sanitaire.",
      alert: "Un disjoncteur de calibre adapté (max 16A pour du 1.5mm²) évite la surchauffe des petits enroulements moteurs."
    },
    {
      id: "bathroom_heater",
      name: "Radiateur Salle de Bain",
      power: "1000W - 2000W",
      breaker: "16A ou 20A",
      cable: "2.5 mm²",
      breakerSize: "26A",
      cableSize: "3x2.5 mm²",
      connection: "Sortie de câble étanche sous double isolation",
      rcd: "Type A (30mA)",
      rcdValue: "30mA",
      rcdInfo: "Sur différentiel 30 mA (Obligatoire - Volume humide SDB)",
      rgie: "Soumis aux règles strictes des volumes de SDB. Doit être installé en Volume 2 ou hors volume s'il est de classe II.",
      alert: "Aucune prise classique ne peut alimenter ce radiateur si elle est située à moins de 60 cm de la baignoire/douche."
    },
    {
      id: "hood",
      name: "Hotte aspirante",
      power: "150W - 350W",
      breaker: "10A, 16A ou 20A",
      cable: "1.5 mm² ou 2.5 mm²",
      breakerSize: "16A",
      cableSize: "3x1.5 mm²",
      connection: "Prise de courant cachée dans le cache-conduit",
      rcd: "Type A (300mA / Option 30mA)",
      rcdValue: "300mA",
      rcdInfo: "Sur différentiel 300 mA (Général / Principal, ou 30mA au choix)",
      rgie: "Branchement direct ou sur circuit de prises de cuisine partagées.",
      alert: "La hauteur de la prise doit être étudiée pour ne pas interférer avec le conduit métallique d'évacuation."
    },
    {
      id: "heat_pump",
      name: "Pompe à chaleur",
      power: "3000W - 8000W",
      breaker: "20A, 25A ou 32A",
      cable: "2.5 mm²- 4 mm² - 6 mm²",
      breakerSize: "25A",
      cableSize: "3x4.0 mm²",
      connection: "Boîtier d'alimentation extérieur étanche blindé",
      rcd: "Type A ou B (300mA conseillé)",
      rcdValue: "300mA",
      rcdInfo: "Sur différentiel 300 mA (Principal, type A ou B selon instructions constructeur)",
      rgie: "Ligne dédiée stricte obligatoire avec alimentation dimensionnée selon l'intensité maximale de démarrage.",
      alert: "Beaucoup de pompes modernes équipées de variateurs de fréquence nécessitent un différentiel de Type B pour la détection DC."
    },
    {
      id: "thermostat",
      name: "Thermostat d'ambiance",
      power: "< 10W (TBT)",
      breaker: "2A, 6A ou 10A (Circuit de commande chaudière)",
      cable: "0.75 mm² ou 1.5 mm² (TBT)",
      breakerSize: "6A",
      cableSize: "2x0.75 mm²",
      connection: "Raccordement direct Très Basse Tension (TBTS)",
      rcd: "Non applicable (TBTS)",
      rcdValue: "TBTS",
      rcdInfo: "Très Basse Tension de Sécurité (Pas de différentiel direct requis)",
      rgie: "Isolé des câbles d'énergie 230V pour écarter tout risque d'induction parasite destructrice.",
      alert: "Ne jamais glisser le câble basse tension du thermostat dans le même conduit métallique que la puissance 230V."
    },
    {
      id: "outdoor_sensor",
      name: "Sonde temp. extérieure",
      power: "< 5W (TBT)",
      breaker: "2A, 6A ou 10A (Associé au régulateur)",
      cable: "0.75 mm² ou 1.5 mm²",
      breakerSize: "6A",
      cableSize: "2x0.75 mm²",
      connection: "Borniers à vis de la régulation de chauffage",
      rcd: "Non applicable (TBTS)",
      rcdValue: "TBTS",
      rcdInfo: "Très Basse Tension de Sécurité (Pas de différentiel direct requis)",
      rgie: "Les fils d'information doivent suivre un cheminement adéquat sans interférences électromagnétiques.",
      alert: "Évitez le voisinage immédiat des câbles de compresseur moteur pour éviter la distorsion des mesures thermiques."
    }
  ];

  const rcdAppliances = [
    {
      id: "frigo",
      name: "Réfrigérateur & Congélateur",
      rcdValue: "300 mA",
      type: "Majeur",
      iconName: "snowflake",
      urgency: "Général (Origine)",
      badgeColor: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-800",
      why: "La protection 300 mA à l'origine est suffisante pour déceler un défaut majeur d'isolation et éliminer les risques d'incendie électrique. De plus, cela évite les coupures intempestives (perte des aliments) dues aux infimes courants de fuite naturels tolérés sur ces compresseurs étanches."
    },
    {
      id: "cuisiniere",
      name: "Cuisinière électrique & Four",
      rcdValue: "300 mA",
      type: "Majeur",
      iconName: "cooker",
      urgency: "Général (Origine)",
      badgeColor: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-800",
      why: "Ces gros appareils de chauffage et de cuisson installés en poste fixe hors de zones humides se contentent du différentiel général. Les résistances blindées chaudes peuvent générer naturellement des fuites infimes sans danger direct, évitant ainsi le déclenchement abusif d'un différentiel 30 mA."
    },
    {
      id: "eclairage",
      name: "Éclairage (Toute l'habitation)",
      rcdValue: "30 mA",
      type: "Sensible",
      iconName: "lightbulb",
      urgency: "Haute Sensibilité (Obligatoire)",
      badgeColor: "bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-900/40 dark:text-rose-300 dark:border-rose-800",
      why: "Le RGIE (Livre 1) impose que l'éclairage de toute l'habitation passe par un différentiel 30 mA pour minimiser les risques de chocs électriques directs lors du remplacement d'une ampoule usée ou d'une infiltration d'humidité accidentelle."
    },
    {
      id: "prises_generales",
      name: "Socles de prises générales",
      rcdValue: "30 mA",
      type: "Sensible",
      iconName: "plug",
      urgency: "Haute Sensibilité (Obligatoire)",
      badgeColor: "bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-900/40 dark:text-rose-300 dark:border-rose-800",
      why: "Toutes les prises de courant générales alimentent par définition des appareils mobiles ou portatifs tenus activement en main. En cas de défausse d'isolation ou de câble fendu, le 30 mA protège les personnes d'un choc électrique direct mortel."
    },
    {
      id: "sdb",
      name: "Salle de bains & Douches (Tous circuits)",
      rcdValue: "30 mA",
      type: "Sensible",
      iconName: "shower",
      urgency: "Haute Sensibilité (Obligatoire)",
      badgeColor: "bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-900/40 dark:text-rose-300 dark:border-rose-800",
      why: "Dans un local humide, la résistance naturelle de la peau humaine s'effondre avec l'eau et la vapeur. Un courant d'intensité minime peut être instantanément létal. Le différentiel de 30 mA réagit ultra-rapidement en cas de fuite minime sur un corps mouillé."
    },
    {
      id: "lavelinge",
      name: "Lave-linge & Sèche-linge",
      rcdValue: "300 mA ou 30 mA (*30 mA recommandé s'ils sont près d'une buanderie ou SDB, obligatoire sous 30mA pour le lave-linge)",
      type: "Sensible",
      iconName: "washing",
      urgency: "Haute Sensibilité (Obligatoire)",
      badgeColor: "bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-900/40 dark:text-rose-300 dark:border-rose-800",
      why: "Le lave-linge et le sèche-linge sont des récepteurs humides (présence d'eau active d'un côté et risque d'humidité sur carcasse métallique conductrice de l'autre). La norme impose ainsi qu'ils soient installés sous différentiel 30 mA pour préserver la vie des personnes."
    },
    {
      id: "lavevaisselle",
      name: "Lave-vaisselle",
      rcdValue: "30 mA",
      type: "Sensible",
      iconName: "dishwasher",
      urgency: "Haute Sensibilité (Obligatoire)",
      badgeColor: "bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-900/40 dark:text-rose-300 dark:border-rose-800",
      why: "Combinant présence de l'eau, raccordements d'eaux usées et réseau d'alimentation électrique à l'intérieur d'un habitacle métallique, le lave-vaisselle doit être disposé sous le giron d'une protection différentielle haute sensibilité de 30 mA."
    },
    {
      id: "ev",
      name: "Borne de recharge véhicule électrique",
      rcdValue: "30 mA (Couplé 6mA DC ou Type B)",
      type: "Sensible",
      iconName: "car",
      urgency: "Haute Sensibilité + Type B / DC 6mA",
      badgeColor: "bg-cyan-100 text-cyan-800 border-cyan-200 dark:bg-cyan-900/40 dark:text-cyan-300 dark:border-cyan-800",
      why: "Obligatoire sous 30 mA de type A ou F si la borne possède une détection de courant continu de fuite 6 mA intégrée, ou Type B obligatoire s'il n'y a pas de protection DC. Nécessaire pour parer aux fuites et à l'aveuglement du différentiel en amont."
    },
    {
      id: "chauffage_sol",
      name: "Chauffage électrique noyé dans le sol/paroi",
      rcdValue: "100 mA (Maximum autorisé)",
      type: "Intermédiaire",
      iconName: "heater",
      urgency: "Max 100 mA Séparé",
      badgeColor: "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-800",
      why: "Si le système de chauffage par résistances électriques sous 230 V est englobé de façon permanente dans une paroi ou une dalle de sol, le RGIE stipule de l'isoler sous son propre différentiel n'excédant pas 100 mA de sensibilité."
    },
    {
      id: "rasoir",
      name: "Prise rasoir (Avec transformateur de sécurité)",
      rcdValue: "300 mA (Exception tolérée)",
      type: "Majeur",
      iconName: "shaver",
      urgency: "Général toléré (Grâce au transformateur)",
      badgeColor: "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/40 dark:text-yellow-300 dark:border-yellow-800",
      why: "Si la prise rasoir installée en salle de bain est équipée d'un transformateur de séparation individuel intégré (tension galvaniquement isolée du réseau), elle n'est pas obligée d'être sur le 30 mA et peut rester sur le 300 mA du circuit général."
    }
  ];

  const recommendedEVBreaker = useMemo(() => {
    if (chargerPower === 2.3 || chargerPower === 3.7) return 20;
    if (chargerPower === 7.4) return 32;
    
    const intensity = (chargerPower * 1000) / 230;
    const intensityWithMargin = intensity * 1.15;
    return [6, 10, 16, 20, 32, 40, 63].find(r => r >= intensityWithMargin) || 63;
  }, [chargerPower]);

  const minResistance = useMemo(() => {
    if (selectedBreaker <= 0) return Infinity;
    return Number((voltage / selectedBreaker).toFixed(3));
  }, [selectedBreaker, voltage]);

  const maxPower = useMemo(() => {
    return Number((voltage * selectedBreaker).toFixed(0));
  }, [selectedBreaker, voltage]);

  const measuredPower = useMemo(() => {
    const res = Number(measuredResistance);
    if (!res || res <= 0) return 0;
    return Number(((voltage * voltage) / res).toFixed(0));
  }, [measuredResistance, voltage]);

  const measuredCurrent = useMemo(() => {
    const res = Number(measuredResistance);
    if (!res || res <= 0) return 0;
    return Number((voltage / res).toFixed(4));
  }, [measuredResistance, voltage]);

  const iccResult = useMemo(() => {
    // R = rho * (2 * L) / S
    const resistance = (COPPER_RESISTIVITY * (2 * cableLength)) / selectedSection;
    const icc = voltage / resistance;
    // Chute de tension (Voltage Drop) = R * I (using selected breaker current)
    const voltageDrop = resistance * selectedBreaker;
    const voltageDropPercent = (voltageDrop / voltage) * 100;

    // --- Short Circuit Energetics and Cost ---
    const duration = shortCircuitDuration; // short circuit duration state (1 to 60s)
    const powerW = voltage * icc; // P = U * I
    const powerKW = powerW / 1000;
    const energyJoules = powerW * duration; // E = P * t (Joules)
    const energyKJ = energyJoules / 1000;
    const energyKWh = (powerW * (duration / 3600)) / 1000; // kWh
    const rawCost = energyKWh * kwhPrice; // cost of raw electricity

    // Thermal limits of the copper cable (k = 115 for PVC copper insulation)
    const thermalStressLimit = Math.pow(115 * selectedSection, 2);
    const actualThermalStress = Math.pow(icc, 2) * duration;
    const cableDestroyed = actualThermalStress > thermalStressLimit;

    // Estimate replacement and damage cost based on destruction or severity
    const estimatedDamageCost = cableDestroyed ? (350 + selectedSection * 15 + cableLength * 10) : 75;

    return {
      resistance: Number(resistance.toFixed(4)),
      icc: Number(icc.toFixed(2)),
      voltageDrop: Number(voltageDrop.toFixed(2)),
      voltageDropPercent: Number(voltageDropPercent.toFixed(2)),
      powerKW: Number(powerKW.toFixed(2)),
      energyKJ: Number(energyKJ.toFixed(1)),
      energyKWh: Number(energyKWh.toFixed(5)),
      rawCost: Number(rawCost.toFixed(4)),
      thermalStressLimit,
      actualThermalStress,
      cableDestroyed,
      estimatedDamageCost
    };
  }, [cableLength, selectedSection, voltage, selectedBreaker, kwhPrice, shortCircuitDuration]);

  const consumptionTotals = useMemo(() => {
    const dailyWh = appliances.reduce((sum, app) => sum + (app.power * app.hours), 0);
    const dailyKWh = dailyWh / 1000;
    const monthlyKWh = dailyKWh * 30;
    const yearlyKWh = dailyKWh * 365;
    
    const dailyCost = dailyKWh * kwhPrice;
    const monthlyCost = monthlyKWh * kwhPrice;
    const yearlyCost = yearlyKWh * kwhPrice;

    return { dailyKWh, monthlyKWh, yearlyKWh, dailyCost, monthlyCost, yearlyCost };
  }, [appliances, kwhPrice]);

  const addAppliance = (preset?: { name: string, power: number, emoji: string }) => {
    const appliance = preset 
      ? { ...preset, hours: 1 } 
      : { 
          name: newAppliance.name, 
          power: Number(newAppliance.power), 
          hours: Number(newAppliance.hours), 
          emoji: newAppliance.emoji 
        };

    if (appliance.name && appliance.power) {
      setAppliances([
        ...appliances,
        {
          id: Math.random().toString(36).substr(2, 9),
          name: appliance.name,
          power: appliance.power,
          hours: appliance.hours || 0,
          emoji: appliance.emoji || '🔌',
        },
      ]);
      if (!preset) {
        setNewAppliance({ name: '', power: '', hours: '0', emoji: '🔌' });
      }
    }
  };

  const removeAppliance = (id: string) => {
    setAppliances(appliances.filter((app) => app.id !== id));
  };

  const updateApplianceHours = (id: string, hours: number) => {
    setAppliances(appliances.map(app => app.id === id ? { ...app, hours } : app));
  };

  const totalSolarPeakPower = useMemo(() => {
    return solarPanelPower * solarPanelCount;
  }, [solarPanelPower, solarPanelCount]);

  const calculatedPvGroundSection = useMemo(() => {
    const minSection = solarHasMechanicalProtection ? 2.5 : 4.0;
    return Math.max(solarPeAcSection, minSection);
  }, [solarPeAcSection, solarHasMechanicalProtection]);

  const autonomyResults = useMemo(() => {
    const totalWh = solarBatteryAh * solarBatteryVoltage;
    const usableWh = totalWh * 0.8;
    const hours = usableWh / (solarAppliancePower || 1);
    const totalMinutes = Math.round(hours * 60);
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    return {
      totalKWh: totalWh / 1000,
      usableKWh: usableWh / 1000,
      h,
      m,
      totalMinutes
    };
  }, [solarBatteryAh, solarBatteryVoltage, solarAppliancePower]);

  const expertResults = useMemo(() => {
    const qty = expertQuantity || 1;
    const U = 230;

    let calcPower = 0;
    let calcCurrent = 0;
    let calcResistance = 0;

    if (expertLastChange === 'power') {
      const totalP = expertPower * qty;
      calcCurrent = totalP / U;
      calcResistance = U / (calcCurrent / qty || 1);
      calcPower = totalP;
    } else if (expertLastChange === 'resistance') {
      const unitI = U / (expertResistance || 1);
      calcCurrent = unitI * qty;
      calcPower = U * calcCurrent;
      calcResistance = expertResistance;
    } else if (expertLastChange === 'current') {
      const totalI = expertCurrent * qty;
      calcPower = U * totalI;
      calcResistance = U / (expertCurrent || 1);
      calcCurrent = totalI;
    }

    const breakers = [6, 10, 16, 20, 25, 32, 40, 63];
    const recommendedBreaker = breakers.find(b => b >= calcCurrent) || (calcCurrent > 63 ? 'Hors Limite' : null);

    // Section de câble selon les règles :
    // max 16 A -> 1.5 mm²
    // max 20 A -> 2.5 mm²
    // max 32 A -> 4 mm²
    // max 40 A -> 6 mm²
    // max 63 A -> 10 mm² min
    const effectiveA = typeof recommendedBreaker === 'number' ? recommendedBreaker : calcCurrent;
    let recommendedCable = '1.5 mm²';
    let cableDetail = 'Pour max 16 A : 1.5 mm²';
    if (effectiveA <= 16) {
      recommendedCable = '1.5 mm²';
      cableDetail = 'Jusqu\'à 16A max ➔ Câble 1.5 mm² cuivre';
    } else if (effectiveA <= 20) {
      recommendedCable = '2.5 mm²';
      cableDetail = 'Jusqu\'à 20A max ➔ Câble 2.5 mm² cuivre';
    } else if (effectiveA <= 32) {
      recommendedCable = '4 mm²';
      cableDetail = 'Jusqu\'à 32A max ➔ Câble 4 mm² cuivre';
    } else if (effectiveA <= 40) {
      recommendedCable = '6 mm²';
      cableDetail = 'Jusqu\'à 40A max ➔ Câble 6 mm² cuivre';
    } else if (effectiveA <= 63) {
      recommendedCable = '10 mm² min';
      cableDetail = 'Jusqu\'à 63A max ➔ Câble 10 mm² cuivre min';
    } else {
      recommendedCable = '16 mm² ou plus';
      cableDetail = 'Au-delà de 63A ➔ Câble 16 mm² cuivre min';
    }

    return { 
      current: Number(calcCurrent.toFixed(2)), 
      power: Number(calcPower.toFixed(2)), 
      resistance: Number((calcResistance / qty).toFixed(2)),
      unitResistance: Number(calcResistance.toFixed(2)),
      unitPower: Number((calcPower / qty).toFixed(2)),
      unitCurrent: Number((calcCurrent / qty).toFixed(2)),
      recommendedBreaker,
      recommendedCable,
      cableDetail
    };
  }, [expertPower, expertResistance, expertCurrent, expertQuantity, expertLastChange]);

  const bathDiagnostic = useMemo(() => {
    let isConforme = true;
    let reasons: string[] = [];
    let ipNeeded = 'IPX4';
    
    let activeZoneName = testPlacementZone;
    if (bathEquipmentType === 'shower' && bathStandardYear === 'POST_2025' && testPlacementZone === 'volume_2') {
      activeZoneName = 'lieu_l';
    } else if (bathStandardYear === 'POST_2025' && testPlacementZone === 'volume_1bis') {
      activeZoneName = 'volume_1';
    }

    if (activeZoneName === 'volume_0') {
      ipNeeded = 'IPX7';
    } else if (activeZoneName === 'volume_1' || activeZoneName === 'volume_1bis' || activeZoneName === 'volume_2') {
      ipNeeded = 'IPX4';
    } else {
      ipNeeded = 'IPX1';
    }

    if (activeZoneName === 'volume_0') {
      if (testEquipmentType === 'tbts_12v') {
        if (testIpRating !== 'ipx7') {
          isConforme = false;
          reasons.push("En Volume 0 (immersion), l'équipement TBTS doit impérativement avoir un degré de protection IPX7 (résistance à l'immersion temporaire).");
        }
        if (testConnectionType !== 'direct') {
          isConforme = false;
          reasons.push("En Volume 0, l'appareil TBTS doit obligatoirement être raccordé de façon fixe, étanche et scellée de façon permanente (boîtes de dérivation et prises/fiches interdites).");
        }
      } else {
        isConforme = false;
        reasons.push("Aucun appareillage sous tension standard 230V n'est admis dans le Volume 0. Seul le matériel strictement nécessaire (comme l'éclairage intégré) en TBTS ≤ 12V AC ou 18V DC est autorisé.");
      }
    } else if (activeZoneName === 'volume_1') {
      if (testEquipmentType === 'tbts_12v') {
        if (testIpRating !== 'ipx4' && testIpRating !== 'ipx7') {
          isConforme = false;
          reasons.push("En Volume 1, l'appareil TBTS doit posséder un indice de protection d'au moins IPX4.");
        }
        if (testConnectionType !== 'direct') {
          isConforme = false;
          reasons.push("En Volume 1, l'appareil TBTS doit posséder un raccordement permanent sans fiche d'alimentation mobile.");
        }
      } else if (testEquipmentType === 'socket') {
        isConforme = false;
        reasons.push("Les prises de courant classiques de 230V sont strictement interdites dans le Volume 1.");
      } else if (testEquipmentType === 'switch') {
        isConforme = false;
        reasons.push("Les interrupteurs de commande générale de 230V sont interdits dans le Volume 1.");
      } else if (testEquipmentType === 'towel_dryer') {
        isConforme = false;
        reasons.push("Les radiateurs ou sèche-serviettes électriques ne sont pas admis dans le Volume 1.");
      } else if (testEquipmentType === 'light') {
        if (testIpRating !== 'ipx4' && testIpRating !== 'ipx7') {
          isConforme = false;
          reasons.push("Le point lumineux raccordé au volume 1 doit impérativement disposer d'un indice minimal IPX4 (protection projection d'eau).");
        }
        if (testConnectionType !== 'direct') {
          isConforme = false;
          reasons.push("Un luminaire installé en Volume 1 doit posséder un raccordement permanent par câble (pas de fiche mobile).");
        }
      } else if (testEquipmentType === 'waterheater') {
        if (testConnectionType !== 'direct') {
          isConforme = false;
          reasons.push("Les chauffe-eau fixes installés en Volume 1 doivent obligatoirement être raccordés en connexion permanente.");
        }
        if (testIpRating !== 'ipx4' && testIpRating !== 'ipx7') {
          isConforme = false;
          reasons.push("Un chauffe-eau en Volume 1 doit posséder un indice de protection d'au moins IPX4.");
        }
      }
    } else if (activeZoneName === 'volume_1bis') {
      if (testEquipmentType === 'tbts_12v') {
        if (testIpRating !== 'ipx4' && testIpRating !== 'ipx7') {
          isConforme = false;
          reasons.push("Sous la baignoire (Volume 1bis), l'appareil TBTS doit posséder un indice de protection d'au moins IPX4.");
        }
        if (testConnectionType !== 'direct') {
          isConforme = false;
          reasons.push("Sous la baignoire (Volume 1bis), l'appareil TBTS doit être raccordé de manière directe fixe (pas de fiche prise mobile).");
        }
      } else if (testEquipmentType === 'socket') {
        isConforme = false;
        reasons.push("Les prises de courant standard 230V sont interdites sous la baignoire (Volume 1bis). Seuls les raccordements fixes d'hydromassage IPX4 raccordés en direct y sont autorisés.");
      } else if (testEquipmentType === 'switch') {
        isConforme = false;
        reasons.push("Les interrupteurs de commande directs 230V sont interdits sous la baignoire (Volume 1bis).");
      } else if (testEquipmentType === 'towel_dryer') {
        isConforme = false;
        reasons.push("Les radiateurs de chauffage ne sont pas autorisés dans le Volume 1bis.");
      } else if (testEquipmentType === 'light') {
        isConforme = false;
        reasons.push("L'installation d'éclairage classique n'est pas admise sous la baignoire (Volume 1bis). Seuls les éclairages TBTS intégrés à la baignoire d'hydromassage sont tolérés.");
      } else {
        if (testIpRating !== 'ipx4' && testIpRating !== 'ipx7') {
          isConforme = false;
          reasons.push("Tout appareillage ou raccordement dans le Volume 1bis doit posséder un indice minimal IPX4.");
        }
        if (testConnectionType !== 'direct') {
          isConforme = false;
          reasons.push("La connexion d'équipements électriques (comme les moteurs d'hydromassages) sous la baignoire (Volume 1bis) doit obligatoire se faire en direct fixe (pas de fiche prise mobile).");
        }
      }
    } else if (activeZoneName === 'volume_2') {
      if (testEquipmentType === 'tbts_12v') {
        if (testIpRating !== 'ipx4' && testIpRating !== 'ipx7') {
          isConforme = false;
          reasons.push("En Volume 2, l'appareil TBTS doit posséder un indice de protection d'au moins IPX4.");
        }
      } else if (testEquipmentType === 'socket') {
        if (socketHasTransformer || socketHas10mADifferential) {
          if (testIpRating !== 'ipx4' && testIpRating !== 'ipx7') {
            isConforme = false;
            reasons.push("Une prise de courant installée en Volume 2 doit posséder un indice de protection d'au moins IPX4.");
          }
        } else {
          isConforme = false;
          reasons.push("En Volume 2, les prises de courant standard 230V sont interdites, SAUF si elles sont protégées par un transformateur de séparation (max 100W/100VA) OU par un interrupteur différentiel à haute sensibilité dédié ≤ 10 mA.");
        }
      } else if (testEquipmentType === 'switch') {
        isConforme = false;
        reasons.push("Les interrupteurs de commande directe 230V sont interdits en Volume 2.");
      } else {
        if (testIpRating !== 'ipx4' && testIpRating !== 'ipx7') {
          isConforme = false;
          reasons.push("Tout appareillage en Volume 2 doit posséder la classe d'étanchéité IPX4.");
        }
      }
    } else {
      if (testEquipmentType === 'tbts_12v') {
        if (testIpRating === 'ipx0') {
          isConforme = false;
          reasons.push("Même hors volumes, le niveau d'étanchéité d'un appareil TBTS dans une salle d'eau doit être d'au moins IPX1 (gouttes d'eau).");
        }
      } else if (testIpRating === 'ipx0') {
        isConforme = false;
        const outsideZoneName = bathStandardYear === 'POST_2025' ? 'Lieu L' : 'Volume 3';
        reasons.push(`En salle d'eau, même hors volumes (${outsideZoneName}), le niveau d'étanchéité minimal de tout appareillage doit être au moins de IPX1 (protection gouttes d'eau).`);
      }
    }

    const formatZoneLabel = (zone: string) => {
      if (zone === 'volume_0') return 'Volume 0 (Immersion)';
      if (zone === 'volume_1') return 'Volume 1 (Projection)';
      if (zone === 'volume_1bis') return 'Volume 1 bis (Espace sous baignoire)';
      if (zone === 'volume_2') return 'Volume 2 (Protection)';
      return bathStandardYear === 'POST_2025' ? 'Lieu L (Hors volumes)' : 'Volume 3 (Hors volumes)';
    };

    return {
      isConforme,
      reasons,
      ipNeeded,
      activeZoneName,
      formatZoneLabel
    };
  }, [
    testPlacementZone,
    bathEquipmentType,
    bathStandardYear,
    testEquipmentType,
    testIpRating,
    testConnectionType,
    socketHasTransformer,
    socketHas10mADifferential
  ]);

  const lightingResults = useMemo(() => {
    // Solid angle Omega = 2 * PI * (1 - cos(angle / 2))
    const angleRad = (lightAngle * Math.PI) / 180;
    const solidAngle = 2 * Math.PI * (1 - Math.cos(angleRad / 2));
    
    const candela = lightLumens / solidAngle;
    const lux = candela / Math.pow(lightDistance || 1, 2);

    // Surface area of the cone base: A = PI * r^2
    // radius r = distance * tan(angle / 2)
    const radius = lightDistance * Math.tan(angleRad / 2);
    const area = Math.PI * Math.pow(radius, 2);
    const targetSurface = lightLumens / (targetLux || 1);

    // Recommendation logic:
    // Total Lumens needed = targetLux * lightArea
    const totalLumensNeeded = Math.round(targetLux * lightArea);
    // Number of lamps = Total Lumens / Lumens per lamp
    const lampsNeeded = Math.ceil(totalLumensNeeded / (lightLumens || 1));

    return {
      candela: Math.round(candela),
      lux: Math.round(lux),
      area: Number(area.toFixed(2)),
      radius: Number(radius.toFixed(2)),
      solidAngle: Number(solidAngle.toFixed(4)),
      targetSurface: Number(targetSurface.toFixed(2)),
      totalLumensNeeded,
      lampsNeeded
    };
  }, [lightLumens, lightAngle, lightDistance, targetLux, lightArea]);

  const addCircuit = () => {
    const nameToUse = newCircuitName.trim() || `${newCircuitType === 'prise' ? 'Prises' : newCircuitType === 'luminaire' ? 'Lumières' : newCircuitType === 'cuisson' ? 'Cuisson' : newCircuitType === 'ev' ? 'Recharge VE' : newCircuitType === 'chauffe-eau' ? 'Chauffe-eau' : 'Chauffage'} ${schemaCircuits.length + 1}`;
    const newC: SchemaCircuit = {
      id: 'c_' + Date.now(),
      name: nameToUse,
      type: newCircuitType,
      rating: Number(newCircuitRating),
      section: Number(newCircuitSection),
      diff: newCircuitDiff
    };
    setSchemaCircuits([...schemaCircuits, newC]);
    setNewCircuitName('');
  };

  const removeCircuit = (id: string) => {
    setSchemaCircuits(schemaCircuits.filter(c => c.id !== id));
  };

  const handlePlanUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processPlanFile(file);
  };

  const processPlanFile = async (file: File) => {
    setIsAnalyzing(true);
    setUploadError(null);
    setUploadFileName(file.name);
    setAiAnalysisResult(null);

    const steps = [
      "Importation du fichier & conversion matricielle Haute Définition...",
      "Analyse géométrique globale de la structure de l'espace...",
      "Identification automatique des symboles (prises de courant, éclairages, sectionneurs)...",
      "Détection des charges haute puissance (Taque cuisson, Lave-linge, Ballon d'eau chaude)...",
      "Audit de conformité par rapport au référentiel technique...",
      "Génération du schéma unifilaire de répartition finale..."
    ];

    let stepIndex = 0;
    setLoadingStepName(steps[0]);
    const stepInterval = setInterval(() => {
      stepIndex++;
      if (stepIndex < steps.length) {
        setLoadingStepName(steps[stepIndex]);
      }
    }, 1800);

    try {
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = (error) => reject(error);
      });
      reader.readAsDataURL(file);
      const base64Data = await base64Promise;

      const response = await fetch("/api/analyze-plan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          imageBase64: base64Data,
          mimeType: file.type,
          standard: activeStandard,
        }),
      });

      clearInterval(stepInterval);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Une erreur s'est produite lors de l'analyse.");
      }

      const data = await response.json();
      setAiAnalysisResult(data);
    } catch (err: any) {
      clearInterval(stepInterval);
      console.error(err);
      setUploadError(err.message || "Erreur de connexion avec le serveur d'audit électrique.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const applyAiCircuits = () => {
    if (!aiAnalysisResult || !aiAnalysisResult.circuits) return;
    setSchemaCircuits(aiAnalysisResult.circuits);
  };

  const diagnostic = useMemo(() => {
    const res = Number(measuredResistance);
    if (measuredResistance === '' || isNaN(res)) return null;
    
    if (res <= 3) {
      return {
        status: 'SURINTENSITÉ DE COURT-CIRCUIT',
        color: 'text-red-600',
        bg: 'bg-red-50',
        border: 'border-red-200',
        message: "Danger immédiat ! La résistance est trop faible (≤ 3Ω)."
      };
    } else if (res < minResistance) {
      return {
        status: 'DÉFAUT DE SURINTENSITÉ DE SURCHARGE',
        color: 'text-orange-600',
        bg: 'bg-orange-50',
        border: 'border-orange-200',
        message: `Risque de surcharge (< ${minResistance === Infinity ? '∞' : minResistance}Ω).`
      };
    } else {
      return {
        status: 'CIRCUIT OK (FONCTIONNEMENT NORMAL)',
        color: 'text-green-600',
        bg: 'bg-green-50',
        border: 'border-green-200',
        message: "Installation conforme."
      };
    }
  }, [measuredResistance, minResistance]);

  const SolarBatteryIcon = ({ className }: { className?: string }) => (
    <div className="flex items-center gap-1">
      <Sun className="w-5 h-5 md:w-6 md:h-6 text-amber-500 shrink-0" />
      <BatteryCharging className="w-5 h-5 md:w-6 md:h-6 text-amber-600 shrink-0" />
    </div>
  );

  const colorClassMap: Record<string, { bgLight: string; textIcon: string; textChevron: string; bgBar: string; borderHover: string }> = {
    violet: { bgLight: 'bg-violet-50 border border-violet-100', textIcon: 'text-violet-600', textChevron: 'text-violet-500', bgBar: 'bg-violet-500', borderHover: 'hover:border-violet-300' },
    sky: { bgLight: 'bg-sky-50 border border-sky-100', textIcon: 'text-sky-600', textChevron: 'text-sky-500', bgBar: 'bg-sky-500', borderHover: 'hover:border-sky-300' },
    indigo: { bgLight: 'bg-indigo-50 border border-indigo-100', textIcon: 'text-indigo-600', textChevron: 'text-indigo-500', bgBar: 'bg-indigo-500', borderHover: 'hover:border-indigo-300' },
    cyan: { bgLight: 'bg-cyan-50 border border-cyan-100', textIcon: 'text-cyan-600', textChevron: 'text-cyan-500', bgBar: 'bg-cyan-500', borderHover: 'hover:border-cyan-300' },
    orange: { bgLight: 'bg-orange-50 border border-orange-100', textIcon: 'text-orange-600', textChevron: 'text-orange-500', bgBar: 'bg-orange-500', borderHover: 'hover:border-orange-300' },
    amber: { bgLight: 'bg-amber-50 border border-amber-100', textIcon: 'text-amber-600', textChevron: 'text-amber-500', bgBar: 'bg-amber-500', borderHover: 'hover:border-amber-300' },
    emerald: { bgLight: 'bg-emerald-50 border border-emerald-100', textIcon: 'text-emerald-600', textChevron: 'text-emerald-500', bgBar: 'bg-emerald-500', borderHover: 'hover:border-emerald-300' },
    pink: { bgLight: 'bg-pink-50 border border-pink-100', textIcon: 'text-pink-600', textChevron: 'text-pink-500', bgBar: 'bg-pink-500', borderHover: 'hover:border-pink-300' },
    yellow: { bgLight: 'bg-yellow-50 border border-yellow-100', textIcon: 'text-yellow-600', textChevron: 'text-yellow-500', bgBar: 'bg-yellow-500', borderHover: 'hover:border-yellow-300' },
    blue: { bgLight: 'bg-blue-50 border border-blue-100', textIcon: 'text-blue-600', textChevron: 'text-blue-500', bgBar: 'bg-blue-500', borderHover: 'hover:border-blue-300' },
    rose: { bgLight: 'bg-rose-50 border border-rose-100', textIcon: 'text-rose-600', textChevron: 'text-rose-500', bgBar: 'bg-rose-500', borderHover: 'hover:border-rose-300' },
    teal: { bgLight: 'bg-teal-50 border border-teal-100', textIcon: 'text-teal-600', textChevron: 'text-teal-500', bgBar: 'bg-teal-500', borderHover: 'hover:border-teal-300' },
  };

  const menuItems: { id: string; name: string; icon: React.ComponentType<{ className?: string }>; color: string; desc: string; badge?: string; category: 'schemas' | 'comptage' | 'calculs' | 'energie' | 'normes'; isNew?: boolean }[] = [
    { id: 'elecplan', name: 'ÉlecPlan · Plan PDF', icon: FileText, color: 'rose', desc: 'Téléchargement PDF & Schéma de Position Aimanté', category: 'schemas', isNew: true },
    { id: 'smart-meter', name: 'Compteur Intelligent', icon: Gauge, color: 'teal', desc: 'Index, Puissance & Port P1', category: 'comptage', isNew: true },
    { id: 'meter-exam', name: 'Question Compteur Examen', icon: GraduationCap, color: 'emerald', desc: '123 QCM Examen & Corrigé Pose Compteurs Communicants', badge: 'Examen ORES', category: 'comptage', isNew: true },
    { id: 'rtcc', name: 'Relais RTCC & 63A', icon: Radio, color: 'sky', desc: 'Télécommande 175 Hz & Accrochage', category: 'comptage', isNew: true },
    { id: 'simuphase-tetra', name: 'SimuPhase Champ Tournant', icon: Monitor, color: 'cyan', desc: 'SimuPhase Tétra & Compteur (4 Onglets)', category: 'comptage', isNew: true },
    { id: 'expert', name: 'Expert', icon: Omega, color: 'violet', desc: 'Loi d\'Ohm & Phase', category: 'calculs' },
    { id: 'billing', name: 'Facture', icon: Receipt, color: 'sky', desc: 'Facture énergie', category: 'calculs' },
    { id: 'threshold', name: 'Seuil', icon: ShieldAlert, color: 'indigo', desc: 'Tolérance impédance', category: 'calculs' },
    { id: 'icc', name: 'Icc', icon: Calculator, color: 'cyan', desc: 'Calcul de court-circuit', category: 'calculs' },
    { id: 'consumption', name: 'Conso', icon: Activity, color: 'orange', desc: 'Estimation énergétique', category: 'energie' },
    { id: 'autonomy', name: 'Autonomie', icon: Battery, color: 'amber', desc: 'Batterie', category: 'energie' },
    { id: 'ev-charger', name: 'Borne', icon: Car, color: 'emerald', desc: 'Temps de recharge EV', category: 'energie' },
    { id: 'rj45', name: 'Câble', icon: Network, color: 'pink', desc: 'Blindage & Câblage', category: 'schemas' },
    { id: 'lighting', name: 'Lumière', icon: Lightbulb, color: 'yellow', desc: 'Température Kelvin', category: 'calculs' },
    { id: 'salledeau', name: 'Salle d\'eau', icon: ShieldCheck, color: 'sky', desc: 'Sécurité Douche & Bain', category: 'normes' },
    { id: 'specs', name: 'Spécifs', icon: ClipboardList, color: 'emerald', desc: 'Installations & Coffrets', category: 'normes' },
    { id: 'notes', name: 'Guide', icon: BookOpen, color: 'blue', desc: 'Dépannage & Rappels', category: 'normes' },
    { id: 'influences', name: 'Influences', icon: Grid, color: 'rose', desc: 'Facteurs d’influences externes', category: 'normes' },
    { id: 'solar', name: 'Solaire', icon: Sun, color: 'yellow', desc: 'Calcul de production', category: 'energie' },
    { id: 'pv-config', name: 'Solaire & Batterie', icon: SolarBatteryIcon, color: 'amber', desc: 'Couplage Panneaux & Onduleur', category: 'energie', isNew: true },
  ];

  if (!isUnlocked) {
    return <AccessLockScreen onUnlock={() => setIsUnlocked(true)} />;
  }

  return (
    <div className="min-h-screen relative bg-[#F8FAFC] text-slate-800 font-sans flex flex-col justify-start items-center p-3 sm:p-6 overflow-x-hidden selection:bg-blue-600 selection:text-white">
      <AnimatePresence mode="wait">
        {activeTab === 'home' ? (
          <motion.div 
            key="home-screen"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 1.02 }}
            className="w-full max-w-[1280px] flex flex-col gap-6 md:gap-8 relative z-10 my-auto py-4"
          >
            {/* Top Brand Header */}
            <header className="flex flex-col md:flex-row items-center justify-between gap-4 p-5 md:p-6 rounded-3xl bg-white border border-slate-200/90 shadow-sm">
              <div className="group flex items-center gap-4 text-center md:text-left cursor-pointer transition-all duration-300">
                <div className="relative flex items-center justify-center w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20 group-hover:scale-105 group-hover:-translate-y-0.5 group-hover:shadow-lg group-hover:shadow-blue-500/35 transition-all duration-300 ease-out">
                  <Zap className="w-8 h-8 md:w-9 md:h-9 fill-white text-white drop-shadow-sm group-hover:scale-110 group-hover:rotate-6 group-hover:text-amber-300 transition-all duration-300 ease-out" />
                  
                  {/* Status Indicator: pulses actively when application is idle */}
                  <span className="absolute -bottom-1 -right-1 flex h-4 w-4">
                    {isIdle ? (
                      <>
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-90" style={{ animationDuration: '1.2s' }} />
                        <span className="absolute -inset-1 rounded-full bg-emerald-400/50 animate-pulse" style={{ animationDuration: '1.5s' }} />
                        <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-white shadow-[0_0_12px_#10b981] animate-pulse" />
                      </>
                    ) : (
                      <>
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-white" />
                      </>
                    )}
                  </span>
                </div>
                <div>
                  <div className="flex items-center gap-2 justify-center md:justify-start flex-wrap">
                    <h1 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900 transition-all duration-300">
                      <span className="inline-block transition-transform duration-300 group-hover:-translate-y-0.5">Volt</span>
                      <span className="text-blue-600 inline-block transition-all duration-300 group-hover:-translate-y-0.5 group-hover:text-blue-500 group-hover:drop-shadow-[0_0_10px_rgba(37,99,235,0.4)]">Scope</span>
                    </h1>
                    <span className={`hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold transition-all duration-500 ${
                      isIdle
                        ? 'bg-emerald-100/90 border border-emerald-300 text-emerald-800 shadow-[0_0_10px_rgba(16,185,129,0.3)] animate-pulse'
                        : 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                    }`}>
                      <span className="relative flex h-2 w-2">
                        {isIdle && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-80" />}
                        <span className={`relative inline-flex rounded-full h-2 w-2 ${isIdle ? 'bg-emerald-500 animate-pulse' : 'bg-emerald-500'}`} />
                      </span>
                      <span>20 Modules Opérationnels</span>
                      {isIdle && <span className="text-[9px] uppercase tracking-wider text-emerald-600 font-semibold">• Veille</span>}
                    </span>
                  </div>
                  <div className="mt-1.5 flex items-center justify-center md:justify-start">
                    <MadeByBadge variant="badge" />
                  </div>
                </div>
              </div>

              {/* Security controls */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    localStorage.removeItem('voltscope_unlocked_session');
                    sessionStorage.removeItem('voltscope_unlocked_session');
                    setIsUnlocked(false);
                  }}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 hover:border-rose-300 text-xs font-bold text-slate-700 hover:text-rose-600 transition-all shadow-2xs cursor-pointer active:scale-95"
                  title="Verrouiller l'accès"
                >
                  <Lock className="w-3.5 h-3.5 text-rose-500" />
                  <span>Verrouiller</span>
                </button>
              </div>
            </header>

            {/* Grid of 20 Windows / Tool Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
              {menuItems.map((item) => {
                const colorStyles = colorClassMap[item.color] || colorClassMap.blue;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id as any)}
                    className={`group relative bg-white hover:bg-slate-50/80 border border-slate-200 ${colorStyles.borderHover} p-5 md:p-6 rounded-3xl transition-all duration-300 hover:shadow-xl hover:shadow-slate-200/80 hover:-translate-y-1 active:scale-[0.98] text-left flex flex-col justify-between items-start gap-4 overflow-hidden shadow-xs cursor-pointer min-h-[160px]`}
                  >
                    {/* Top Row: Icon + Badge */}
                    <div className="flex items-center justify-between w-full">
                      <div className={`p-3.5 rounded-2xl ${colorStyles.bgLight} ${colorStyles.textIcon} group-hover:scale-110 group-hover:rotate-2 transition-transform duration-300 ease-out flex items-center justify-center`}>
                        <item.icon className="w-6 h-6 md:w-7 md:h-7" />
                      </div>
                      {item.badge && (
                        <span className="px-2 py-0.5 text-[9px] font-black uppercase tracking-wider bg-slate-100 border border-slate-200 text-slate-700 rounded-md shadow-2xs">
                          {item.badge}
                        </span>
                      )}
                    </div>

                    {/* Card Content */}
                    <div className="w-full">
                      <h3 className="font-extrabold text-base md:text-lg tracking-tight text-slate-900 group-hover:text-blue-600 transition-colors mb-1">
                        {item.name}
                      </h3>
                      <p className="text-xs text-slate-500 font-normal leading-relaxed line-clamp-2">
                        {item.desc}
                      </p>
                    </div>

                    {/* Right Chevron arrow */}
                    <div className="absolute top-5 right-5 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300">
                      <ChevronRight className={`w-5 h-5 ${colorStyles.textChevron}`} />
                    </div>

                    {/* Bottom Glowing Bar */}
                    <div className={`absolute bottom-0 left-0 h-1.5 w-0 ${colorStyles.bgBar} group-hover:w-full transition-all duration-500 ease-out`} />
                  </button>
                );
              })}
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="tool-screen"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className={`w-full ${activeTab === 'elecplan' ? 'max-w-[1560px]' : activeTab === 'smart-meter' || activeTab === 'rtcc' || activeTab === 'meter-exam' || activeTab === 'simuphase-tetra' ? 'max-w-[1440px]' : 'max-w-[1100px]'} flex flex-col gap-4 relative z-10 py-2`}
          >
            {/* Top Toolbar */}
            <div className="flex justify-between items-center px-1 sm:px-2">
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setActiveTab('home')}
                  className="flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-800 border border-slate-200/90 rounded-xl text-xs font-black uppercase tracking-wider shadow-sm transition-all active:scale-95 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4 text-blue-600" />
                  <span>Retour à VoltScope</span>
                </button>
                <button
                  onClick={() => {
                    localStorage.removeItem('voltscope_unlocked_session');
                    sessionStorage.removeItem('voltscope_unlocked_session');
                    setIsUnlocked(false);
                  }}
                  className="flex items-center gap-1.5 px-3 py-2.5 bg-white border border-slate-200/90 hover:border-rose-300 rounded-xl text-xs font-bold text-slate-600 hover:text-rose-600 transition-colors shadow-sm active:scale-95 cursor-pointer"
                  title="Verrouiller VoltScope"
                >
                  <Lock className="w-3.5 h-3.5 text-rose-500" />
                  <span className="hidden sm:inline">Verrouiller</span>
                </button>
              </div>
              
              <div className="flex gap-1 p-1 bg-white border border-slate-200/90 rounded-xl shadow-sm overflow-x-auto no-scrollbar max-w-[220px] md:max-w-none">
                {menuItems.map((item) => {
                  const itemColor = colorClassMap[item.color] || colorClassMap.blue;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id as any)}
                      title={item.name}
                      className={`flex items-center justify-center w-9 h-9 md:w-10 md:h-10 rounded-lg transition-all cursor-pointer ${
                        isActive 
                          ? `${itemColor.bgLight} ${itemColor.textIcon} ring-1 ring-blue-500 font-bold shadow-xs scale-105` 
                          : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <item.icon className="w-4 h-4 md:w-5 md:h-5" />
                    </button>
                  );
                })}
              </div>
            </div>

            {activeTab === 'elecplan' ? (
              <ElecPlanApp onBackToVoltScope={() => setActiveTab('home' as any)} />
            ) : activeTab === 'simuphase-tetra' ? (
              <SimuPhaseIframeView
                onOpenChampTournant={() => setActiveTab('home' as any)}
                onOpenRTCC={() => setActiveTab('rtcc' as any)}
              />
            ) : activeTab === 'rtcc' ? (
              <RTCCSimulator onOpenChampTournant={() => setActiveTab('simuphase-tetra' as any)} />
            ) : activeTab === 'meter-exam' ? (
              <MeterExamView />
            ) : (
            <div className={`w-full h-auto ${activeTab === 'smart-meter' ? 'md:h-[725px] grid-cols-1 md:grid-cols-[460px_1fr]' : 'md:h-[680px] grid-cols-1 md:grid-cols-[450px_1fr]'} bg-white rounded-[2.5rem] shadow-[0_32px_64px_rgba(0,0,0,0.12)] grid overflow-hidden border border-border-theme relative`}>
              
              {/* Left Panel: Controls */}
              <div className={`${activeTab === 'smart-meter' ? 'p-3.5 md:p-4' : 'p-6 md:p-12'} border-b md:border-b-0 md:border-r border-border-theme flex flex-col relative bg-white min-h-[500px] md:min-h-0`}>
                <div className="flex-1 relative">
                  <AnimatePresence mode="wait">
              {activeTab === 'billing' && (
                <motion.div 
                  key="billing-panel"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="absolute inset-0 bg-white flex flex-col"
                >
                  <div className="flex justify-between items-center mb-8">
                    <h2 className="text-xl font-bold tracking-tight text-sky-600 uppercase">Facture</h2>
                  </div>

                  <div className="space-y-8 overflow-y-auto pr-2">
                    <div className="p-5 bg-sky-50 rounded-2xl border border-sky-100">
                      <div className="flex justify-between items-center mb-4">
                        <span className="text-[11px] font-black text-sky-700 uppercase tracking-widest">Énergie consommée par jour</span>
                        <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-sky-200">
                           <input 
                              type="number"
                              step="0.1"
                              value={billingKWh}
                              onChange={(e) => setBillingKWh(Number(e.target.value))}
                              className="w-20 text-right font-mono font-bold text-sky-900 outline-none"
                           />
                           <span className="text-[10px] font-bold text-sky-500">kWh</span>
                        </div>
                      </div>
                      <input 
                        type="range"
                        min="0"
                        max="50"
                        step="0.5"
                        value={billingKWh}
                        onChange={(e) => setBillingKWh(Number(e.target.value))}
                        className="w-full h-2 bg-sky-200 rounded-lg appearance-none cursor-pointer accent-sky-600 mb-6"
                      />
                      <div className="grid grid-cols-4 gap-2">
                        {[2.5, 3, 3.5, 4, 5, 5.5, 6].map((val) => (
                          <button
                            key={val}
                            onClick={() => setBillingKWh(val)}
                            className={`py-2 rounded-lg text-[10px] font-bold transition-all border ${
                              billingKWh === val
                                ? 'bg-sky-600 text-white border-sky-600 shadow-sm'
                                : 'bg-white border-sky-200 text-sky-700 hover:border-sky-400'
                            }`}
                          >
                            {val}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200">
                      <div className="flex justify-between items-center mb-4">
                        <span className="text-[11px] font-black text-slate-700 uppercase tracking-widest">Tarif Unitaire</span>
                        <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-slate-200">
                           <input 
                              type="number"
                              step="0.01"
                              value={billingPrice}
                              onChange={(e) => setBillingPrice(Number(e.target.value))}
                              className="w-20 text-right font-mono font-bold text-slate-900 outline-none"
                           />
                           <Euro className="w-3 h-3 text-slate-400" />
                        </div>
                      </div>
                      <input 
                        type="range"
                        min="0"
                        max="2"
                        step="0.01"
                        value={billingPrice}
                        onChange={(e) => setBillingPrice(Number(e.target.value))}
                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-600"
                      />
                      <div className="flex justify-between mt-3 px-1 text-[9px] text-slate-400 font-bold uppercase tracking-widest">
                        <span>Min (0€)</span>
                        <span>Conseillé (0.30€)</span>
                        <span>Max (2.00€)</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
              {activeTab === 'expert' && (
                <motion.div 
                  key="expert-panel"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="absolute inset-0 bg-white flex flex-col p-6"
                >
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold tracking-tight text-violet-600">Calculatrice Expert</h2>
                  </div>

                  <div className="space-y-4 overflow-y-auto pr-2 custom-scrollbar pb-8">
                    {/* Volet 1: Puissance (Source) */}
                    <div 
                      className={`p-4 rounded-2xl border transition-all duration-300 ${
                        expertLastChange === 'power' 
                          ? 'bg-violet-50 border-violet-200 shadow-sm ring-1 ring-violet-500/10' 
                          : 'bg-white border-border-theme opacity-80'
                      }`}
                    >
                      <div className="flex justify-between items-center mb-3">
                        <span className={`text-[10px] font-black uppercase tracking-wider ${expertLastChange === 'power' ? 'text-violet-700' : 'text-text-muted'}`}>
                          {expertLastChange === 'power' && <span className="mr-2 text-violet-500">●</span>}
                          Mode Puissance (W)
                        </span>
                        <div className="bg-white px-2 py-1 rounded-lg border border-violet-100 text-xs font-mono font-bold text-violet-900 shadow-inner">
                           {expertLastChange === 'power' ? expertPower : expertResults.unitPower} W
                        </div>
                      </div>
                      <input 
                        type="range"
                        min="0"
                        max="20000"
                        step="100"
                        value={expertLastChange === 'power' ? expertPower : expertResults.unitPower}
                        onChange={(e) => {
                          setExpertPower(Number(e.target.value));
                          setExpertLastChange('power');
                        }}
                        className="w-full h-1.5 bg-violet-200 rounded-lg appearance-none cursor-pointer accent-violet-600"
                      />
                      <div className="mt-2 flex justify-between text-[8px] font-bold text-violet-400 uppercase tracking-tighter">
                        <span>0 W</span>
                        <span>20 kW</span>
                      </div>
                    </div>

                    {/* Volet 2: Résistance (Source) */}
                    <div 
                      className={`p-4 rounded-2xl border transition-all duration-300 ${
                        expertLastChange === 'resistance' 
                          ? 'bg-amber-50 border-amber-200 shadow-sm ring-1 ring-amber-500/10' 
                          : 'bg-white border-border-theme opacity-80'
                      }`}
                    >
                      <div className="flex justify-between items-center mb-3">
                        <span className={`text-[10px] font-black uppercase tracking-wider ${expertLastChange === 'resistance' ? 'text-amber-700' : 'text-text-muted'}`}>
                          {expertLastChange === 'resistance' && <span className="mr-2 text-amber-500">●</span>}
                          Mode Résistance (Ω)
                        </span>
                        <div className="bg-white px-2 py-1 rounded-lg border border-amber-100 text-xs font-mono font-bold text-amber-900 shadow-inner">
                           {expertLastChange === 'resistance' ? expertResistance : expertResults.unitResistance} Ω
                        </div>
                      </div>
                      <input 
                        type="range"
                        min="1"
                        max="1000"
                        step="1"
                        value={expertLastChange === 'resistance' ? expertResistance : expertResults.unitResistance}
                        onChange={(e) => {
                          setExpertResistance(Number(e.target.value));
                          setExpertLastChange('resistance');
                        }}
                        className="w-full h-1.5 bg-amber-200 rounded-lg appearance-none cursor-pointer accent-amber-600"
                      />
                      <div className="mt-2 flex justify-between text-[8px] font-bold text-amber-400 uppercase tracking-tighter">
                        <span>1 Ω</span>
                        <span>1000 Ω</span>
                      </div>
                    </div>

                    {/* Volet 3: Intensité (Source) */}
                    <div 
                      className={`p-4 rounded-2xl border transition-all duration-300 ${
                        expertLastChange === 'current' 
                          ? 'bg-sky-50 border-sky-200 shadow-sm ring-1 ring-sky-500/10' 
                          : 'bg-white border-border-theme opacity-80'
                      }`}
                    >
                      <div className="flex justify-between items-center mb-3">
                        <span className={`text-[10px] font-black uppercase tracking-wider ${expertLastChange === 'current' ? 'text-sky-700' : 'text-text-muted'}`}>
                          {expertLastChange === 'current' && <span className="mr-2 text-sky-500">●</span>}
                          Mode Intensité (A)
                        </span>
                        <div className="bg-white px-2 py-1 rounded-lg border border-sky-100 text-xs font-mono font-bold text-sky-900 shadow-inner">
                           {expertLastChange === 'current' ? expertCurrent : expertResults.unitCurrent} A
                        </div>
                      </div>
                      <input 
                        type="range"
                        min="0.1"
                        max="100"
                        step="0.1"
                        value={expertLastChange === 'current' ? expertCurrent : expertResults.unitCurrent}
                        onChange={(e) => {
                          setExpertCurrent(Number(e.target.value));
                          setExpertLastChange('current');
                        }}
                        className="w-full h-1.5 bg-sky-200 rounded-lg appearance-none cursor-pointer accent-sky-600"
                      />
                      <div className="mt-2 flex justify-between text-[8px] font-bold text-sky-400 uppercase tracking-tighter">
                        <span>0.1 A</span>
                        <span>100 A</span>
                      </div>
                    </div>

                    <div className="bg-bg-theme p-4 rounded-2xl border border-border-theme">
                      <span className="block text-[10px] uppercase tracking-widest text-text-muted font-black mb-2 px-1">Quantité récepteurs en //</span>
                      <input 
                        type="number"
                        min="1"
                        max="50"
                        value={expertQuantity}
                        onChange={(e) => setExpertQuantity(Number(e.target.value))}
                        className="w-full bg-white border border-border-theme rounded-xl px-3 py-2 text-sm font-bold shadow-sm focus:ring-2 focus:ring-violet-500 outline-none"
                      />
                    </div>
                  </div>
                </motion.div>
              )}
              {activeTab === 'consumption' && (
                <motion.div 
                  key="consumption-panel"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="absolute inset-0 bg-white flex flex-col"
                >
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold tracking-tight text-orange-600">Consommation</h2>
                  </div>

                <div className="flex-1 overflow-y-auto pr-2 space-y-4 mb-6">
                  {appliances.map((app) => (
                    <div key={app.id} className="p-3 bg-bg-theme rounded-lg border border-border-theme group space-y-3">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <span className="text-xl">{app.emoji}</span>
                          <div>
                            <div className="font-bold text-sm">{app.name}</div>
                            <div className="text-[10px] text-text-muted uppercase tracking-wider">
                              {app.power}W × {app.hours}h/j = {(app.power * app.hours / 1000).toFixed(2)} kWh
                            </div>
                          </div>
                        </div>
                        <button 
                          onClick={() => removeAppliance(app.id)}
                          className="p-1.5 text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="flex items-center gap-3">
                        <input 
                          type="range"
                          min="0"
                          max="24"
                          step="0.5"
                          value={app.hours}
                          onChange={(e) => updateApplianceHours(app.id, Number(e.target.value))}
                          className="flex-1 h-1 bg-border-theme rounded-lg appearance-none cursor-pointer accent-orange-500"
                        />
                        <span className="text-[10px] font-mono font-bold text-orange-600 w-8 text-right">{app.hours}h</span>
                      </div>
                    </div>
                  ))}

                  <div className="p-4 bg-accent-blue/5 rounded-lg border border-dashed border-accent-blue/30 space-y-4">
                    <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2 mb-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                      {[
                        // Cuisine
                        { name: 'Four', power: 2500, emoji: '🍕' },
                        { name: 'Plaque', power: 7000, emoji: '🥘' },
                        { name: 'Cafetière', power: 1200, emoji: '☕' },
                        { name: 'Micro-onde', power: 1250, emoji: '🍿' },
                        { name: 'Bouilloire', power: 2000, emoji: '🫖' },
                        { name: 'Frigo', power: 150, emoji: '🧊' },
                        { name: 'Congélo', power: 200, emoji: '🍦' },
                        { name: 'Lave-Vaiss.', power: 1200, emoji: '🍽️' },
                        { name: 'Grille-pain', power: 800, emoji: '🍞' },
                        { name: 'Mixeur', power: 400, emoji: '🥤' },
                        { name: 'Hotte', power: 200, emoji: '🌬️' },
                        
                        // Buanderie & Entretien
                        { name: 'Lave-Linge', power: 2000, emoji: '👕' },
                        { name: 'Sèche-Linge', power: 2500, emoji: '🧺' },
                        { name: 'Fer à rep.', power: 1500, emoji: '💨' },
                        { name: 'Aspirateur', power: 800, emoji: '🧹' },
                        
                        // Chauffage & Clim
                        { name: 'Radiateur', power: 1500, emoji: '🔥' },
                        { name: 'Clim', power: 2000, emoji: '❄️' },
                        { name: 'Sèche-serv.', power: 750, emoji: '🛁' },
                        { name: 'Ventilateur', power: 50, emoji: '🌀' },
                        
                        // High-Tech & Bureau
                        { name: 'TV / Salon', power: 60, emoji: '📺' },
                        { name: 'Console', power: 200, emoji: '🎮' },
                        { name: 'PC Bureau', power: 70, emoji: '🖥️' },
                        { name: 'PC Gamer', power: 250, emoji: '🎮' },
                        { name: 'Laptop', power: 60, emoji: '💻' },
                        { name: 'Box Inter.', power: 20, emoji: '🌐' },
                        { name: 'Chargeur', power: 15, emoji: '🔌' },
                        { name: 'Chargeur Port.', power: 25, emoji: '⚡' },
                        
                        // Beauté & Santé
                        { name: 'Sèche-cheveux', power: 1800, emoji: '💁' },
                        { name: 'Lisseur', power: 50, emoji: '✨' },
                        
                        // Divers
                        { name: 'Ampoule', power: 10, emoji: '💡' },
                        { name: 'Garage', power: 500, emoji: '🚗' },
                      ].map((preset) => (
                        <button
                          key={preset.name}
                          onClick={() => addAppliance(preset)}
                          className="flex flex-col items-center justify-center p-2 bg-white border border-border-theme rounded-lg hover:border-accent-blue transition-colors group h-16"
                        >
                          <span className="text-xl mb-0.5 group-hover:scale-110 transition-transform">{preset.emoji}</span>
                          <span className="text-[7px] font-bold uppercase text-text-muted truncate w-full text-center leading-none">{preset.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-border-theme space-y-3">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[11px] font-bold text-text-muted uppercase">Prix du kWh (€)</span>
                    <input 
                      type="number"
                      step="0.01"
                      value={kwhPrice}
                      onChange={(e) => setKwhPrice(Number(e.target.value))}
                      className="w-20 bg-bg-theme border border-border-theme rounded px-2 py-1 text-xs font-mono font-bold text-accent-blue text-right outline-none focus:border-accent-blue"
                    />
                  </div>
                </div>
              </motion.div>
            )}

              {activeTab === 'icc' && (
                <motion.div 
                  key="icc-panel"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="absolute inset-0 bg-white flex flex-col"
                >
                  <div className="flex justify-between items-center mb-8">
                    <h2 className="text-xl font-bold tracking-tight text-cyan-600">Calculateur court circuit câble</h2>
                  </div>

                  <div className="space-y-6 overflow-y-auto pr-2">
                    <div>
                      <span className="block text-[11px] uppercase tracking-widest text-text-muted mb-3 font-bold">Section du Câble (mm²)</span>
                      <div className="grid grid-cols-3 gap-2">
                        {CABLE_SECTIONS.map((s) => (
                          <button
                            key={s}
                            onClick={() => setSelectedSection(s)}
                            className={`py-2 rounded text-[11px] font-bold transition-all border ${
                              selectedSection === s
                                ? 'bg-cyan-600 text-white border-cyan-600'
                                : 'bg-white border-border-theme text-text-muted hover:border-text-muted'
                            }`}
                          >
                            {s} mm²
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-[11px] uppercase tracking-widest text-text-muted font-bold">Longueur Aller (m)</span>
                        <span className="text-lg font-bold text-cyan-600 font-mono">{cableLength} m</span>
                      </div>
                      <input 
                        type="range"
                        min="1"
                        max="200"
                        value={cableLength}
                        onChange={(e) => setCableLength(Number(e.target.value))}
                        className="w-full h-1.5 bg-border-theme rounded-lg appearance-none cursor-pointer accent-cyan-600 mb-4"
                      />
                      <div className="grid grid-cols-4 gap-2">
                        {[5, 10, 20, 50].map((len) => (
                          <button
                            key={len}
                            onClick={() => setCableLength(len)}
                            className={`py-2 rounded text-[10px] font-bold transition-all border ${
                              cableLength === len
                                ? 'bg-cyan-600 text-white border-cyan-600 shadow-sm'
                                : 'bg-white border-border-theme text-text-muted hover:border-text-muted'
                            }`}
                          >
                            {len}m
                          </button>
                        ))}
                      </div>
                      <p className="text-[10px] text-text-muted mt-2 italic">
                        Note : Le calcul inclut automatiquement l'aller et le retour (Total : {cableLength * 2}m).
                      </p>
                    </div>

                    <div className="pt-6 border-t border-border-theme space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-[11px] font-bold text-text-muted uppercase">Résistance Câble</span>
                        <span className="font-mono font-bold text-text-main">
                          <AnimatedCounter value={iccResult.resistance} decimals={3} suffix=" Ω" />
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-[11px] font-bold text-text-muted uppercase">Chute de Tension</span>
                        <div className="text-right">
                          <span className="font-mono font-bold text-text-main block">
                            <AnimatedCounter value={iccResult.voltageDrop} decimals={2} /> V
                          </span>
                          <span className="text-[10px] text-text-muted">
                            (<AnimatedCounter value={iccResult.voltageDropPercent} decimals={2} />%)
                          </span>
                        </div>
                      </div>

                      <div className="p-4 bg-cyan-600/5 rounded-lg border border-cyan-600/10">
                        <span className="block text-[10px] font-bold text-cyan-600 uppercase mb-1">Courant de Court-Circuit (Icc)</span>
                        <span className="text-3xl font-bold text-cyan-600 font-mono">
                          <AnimatedCounter value={iccResult.icc} decimals={0} suffix=" A" />
                        </span>
                      </div>

                      {/* Bilan & Coût d'un court-circuit d'une durée paramétrable */}
                      <div className="bg-slate-900 text-white rounded-[1.5rem] p-4.5 border border-white/10 space-y-4 mt-4 shadow-xl">
                        <div className="flex justify-between items-center border-b border-white/10 pb-2.5">
                          <div>
                            <span className="block text-[8px] font-black uppercase text-rose-400 tracking-wider">Physique & Coût Réel</span>
                            <h4 className="text-[11px] font-black uppercase font-mono tracking-tight text-white">Impact Court-Circuit ({shortCircuitDuration}s)</h4>
                          </div>
                          <span className="px-2 py-0.5 rounded text-[8px] font-black uppercase bg-rose-500/20 text-rose-300 border border-rose-500/30">
                            Durée : {shortCircuitDuration}s
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2.5">
                          <div className="bg-white/5 p-2.5 rounded-xl border border-white/5">
                            <span className="block text-[7.5px] font-bold text-slate-400 uppercase mb-0.5">Puissance Dissipée</span>
                            <div className="text-[11px] font-black text-rose-300 font-mono">
                              <AnimatedCounter value={iccResult.powerKW} decimals={1} suffix=" kW" />
                            </div>
                          </div>
                          <div className="bg-white/5 p-2.5 rounded-xl border border-white/5">
                            <span className="block text-[7.5px] font-bold text-slate-400 uppercase mb-0.5">Énergie Thermique</span>
                            <div className="text-[11px] font-black text-amber-300 font-mono">
                              <AnimatedCounter value={iccResult.energyKJ} decimals={1} suffix=" kJ" />
                            </div>
                          </div>
                        </div>

                        {/* Interactive Duration Customizer */}
                        <div className="p-3.5 bg-white/5 border border-white/10 rounded-xl space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-[8.5px] font-black uppercase text-rose-400 tracking-wider">Durée du Court-Circuit</span>
                            <div className="flex items-center gap-1.55">
                              <input 
                                type="number"
                                min="1"
                                max="60"
                                value={shortCircuitDuration}
                                onChange={(e) => setShortCircuitDuration(Math.max(1, Math.min(60, Number(e.target.value))))}
                                className="w-12 bg-white/10 border border-white/10 rounded px-1.5 py-0.5 text-xs font-mono font-bold text-rose-400 text-right outline-none focus:border-rose-450"
                              />
                              <span className="text-[9px] text-slate-400 font-bold">secondes</span>
                            </div>
                          </div>
                          <input 
                            type="range"
                            min="1"
                            max="60"
                            step="1"
                            value={shortCircuitDuration}
                            onChange={(e) => setShortCircuitDuration(Number(e.target.value))}
                            className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-rose-500"
                          />
                          <div className="flex justify-between text-[7px] text-slate-500 font-medium font-mono">
                            <span>1s</span>
                            <span>15s</span>
                            <span>30s</span>
                            <span>45s</span>
                            <span>60s</span>
                          </div>
                        </div>

                        {/* Interactive Price Customizer (La Barre) */}
                        <div className="p-3.5 bg-white/5 border border-white/10 rounded-xl space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-[8.5px] font-black uppercase text-cyan-300 tracking-wider">Ajuster Tarif de l'Énergie</span>
                            <div className="flex items-center gap-1.5">
                              <input 
                                type="number"
                                step="0.01"
                                min="0.01"
                                max="2.00"
                                value={kwhPrice}
                                onChange={(e) => setKwhPrice(Number(e.target.value))}
                                className="w-16 bg-white/10 border border-white/10 rounded px-1.5 py-0.5 text-xs font-mono font-bold text-cyan-300 text-right outline-none focus:border-cyan-400"
                              />
                              <span className="text-[9px] text-slate-400 font-bold">€/kWh</span>
                            </div>
                          </div>
                          <input 
                            type="range"
                            min="0.05"
                            max="1.00"
                            step="0.01"
                            value={kwhPrice}
                            onChange={(e) => setKwhPrice(Number(e.target.value))}
                            className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                          />
                          <div className="flex justify-between text-[7px] text-slate-500 font-medium font-mono">
                            <span>0.05 €</span>
                            <span>0.30 €</span>
                            <span>0.50 €</span>
                            <span>1.00 €</span>
                          </div>
                        </div>

                        <div className="space-y-2 pt-1 border-t border-white/5 text-[10px]">
                          <div className="flex justify-between items-center">
                            <span className="text-slate-400 font-medium">Coût de l'énergie brute :</span>
                            <span className="font-mono text-cyan-300 font-bold">
                              {iccResult.rawCost.toFixed(5)} €
                            </span>
                          </div>


                        </div>

                        {/* Danger alert with dynamic status */}
                        <div className={`p-3 rounded-xl border text-[9.5px] leading-relaxed ${
                          iccResult.cableDestroyed 
                            ? 'bg-rose-500/15 border-rose-500/30 text-rose-200' 
                            : 'bg-emerald-500/10 border-emerald-500/25 text-emerald-200'
                        }`}>
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className="text-xs">{iccResult.cableDestroyed ? '🔥' : '🛡️'}</span>
                            <span className="text-[8.5px] font-black uppercase tracking-wider">
                              {iccResult.cableDestroyed ? 'Destruction Critique du Câble' : 'Comportement Câble Stable'}
                            </span>
                          </div>
                          <p className="opacity-90">
                            {iccResult.cableDestroyed 
                              ? `La contrainte thermique dépasse la limite de votre section de ${selectedSection} mm². L'isolation plastique va fondre instantanément à plus de 160°C, créant un départ de feu potentiel.` 
                              : `La contrainte thermique reste sous le seuil d'endommagement physique du câble de ${selectedSection} mm² pour une durée exceptionnelle de ${shortCircuitDuration} seconde(s).`
                            }
                          </p>
                        </div>


                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'threshold' && (
                <motion.div 
                  key="threshold-panel"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="flex flex-col justify-between h-full"
                >
                  <div className="space-y-8">
                    <div>
                      <div className="inline-block px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded font-bold text-[10px] mb-4 tracking-wider">
                        SÉCURITÉ ÉLECTRIQUE
                      </div>
                      <h1 className="text-2xl font-bold tracking-tight mb-2">Seuil de Résistance</h1>
                    </div>

                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-[11px] uppercase tracking-widest text-text-muted font-bold">Calibre (A)</span>
                        <span className="text-xl font-bold text-indigo-600 font-mono">{selectedBreaker} A</span>
                      </div>
                      <input 
                        type="range"
                        min="0"
                        max="63"
                        step="1"
                        value={selectedBreaker}
                        onChange={(e) => setSelectedBreaker(Number(e.target.value))}
                        className="w-full h-1.5 bg-border-theme rounded-lg appearance-none cursor-pointer accent-indigo-600"
                      />
                      <div className="grid grid-cols-3 gap-2">
                        {[6, 10, 16, 20, 32, 63].map((rating) => (
                          <button
                            key={rating}
                            onClick={() => setSelectedBreaker(rating)}
                            className={`py-2 rounded text-[10px] font-bold transition-all border ${
                              selectedBreaker === rating
                                ? 'bg-indigo-600 text-white border-indigo-600'
                                : 'bg-white border-border-theme text-text-muted hover:border-text-muted'
                            }`}
                          >
                            {rating}A
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-6 pt-4 border-t border-border-theme">
                      <div className="flex justify-between items-end">
                        <div>
                          <span className="block text-[11px] uppercase tracking-widest text-text-muted mb-2 font-bold">Tension Réseau (V)</span>
                          <input 
                            type="number"
                            value={voltage}
                            onChange={(e) => setVoltage(Number(e.target.value))}
                            className="text-2xl font-bold font-mono text-indigo-600 border-b-2 border-border-theme pb-1 w-24 outline-none focus:border-indigo-600 transition-colors bg-transparent mb-4"
                          />
                          <div className="flex gap-2">
                            {[230].map((v) => (
                              <button
                                key={v}
                                onClick={() => setVoltage(v)}
                                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                                  voltage === v
                                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                                    : 'bg-white border-border-theme text-text-muted hover:border-text-muted'
                                }`}
                              >
                                {v}V
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="block text-[11px] uppercase tracking-widest text-text-muted mb-2 font-bold">mesure au borne (Ω)</span>
                          <input 
                            type="number"
                            step="0.1"
                            min="0.1"
                            placeholder="---"
                            value={measuredResistance}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (val === '' || Number(val) >= 0) {
                                setMeasuredResistance(val);
                              }
                            }}
                            className="text-2xl font-bold font-mono text-text-main border-b-2 border-border-theme pb-1 w-24 outline-none focus:border-indigo-600 transition-colors bg-transparent text-right mb-4"
                          />
                          <div className="flex flex-wrap gap-1 justify-end">
                            {[0.1, 1, 5, 10, 50, 500].map((r) => (
                              <button
                                key={r}
                                onClick={() => setMeasuredResistance(r)}
                                className={`px-2 py-1.5 rounded text-[10px] font-bold transition-all border ${
                                  Number(measuredResistance) === r
                                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                                    : 'bg-white border-border-theme text-text-muted hover:border-text-muted'
                                }`}
                              >
                                {r}Ω
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 pt-6 border-t border-border-theme text-[12px] text-text-muted italic leading-relaxed">
                    Calcul basé sur la loi d'Ohm : R = U / I<br />
                    Pour un disjoncteur de {selectedBreaker}A sous {voltage}V, la résistance doit être supérieure à {minResistance === Infinity ? '∞' : minResistance} Ω.
                  </div>
                </motion.div>
              )}

              {activeTab === 'solar' && (
                <motion.div 
                  key="solar-panel"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="absolute inset-0 bg-white flex flex-col"
                >
                  <div className="flex justify-between items-center mb-8">
                    <h2 className="text-xl font-bold tracking-tight text-yellow-600">Calculateur Solaire Instantané</h2>
                  </div>

                  <div className="space-y-6 overflow-y-auto pr-2">
                    {/* Section: Dimensionnement (Sizing) */}
                    <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 space-y-4 shadow-sm">
                      <div className="flex items-center gap-2 mb-1">
                        <Calculator className="w-4 h-4 text-blue-600" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-blue-700">Calcul des Besoins</span>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <span className="block text-[10px] uppercase font-bold text-blue-600 mb-1.5">Charge Instantanée (W)</span>
                          <div className="space-y-3">
                            <input 
                              type="number"
                              value={solarInstantLoad}
                              onChange={(e) => setSolarInstantLoad(Math.max(0, Number(e.target.value)))}
                              className="w-full bg-white border border-blue-200 rounded-lg px-3 py-2 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <input 
                              type="range"
                              min="0"
                              max="10000"
                              step="100"
                              value={solarInstantLoad}
                              onChange={(e) => setSolarInstantLoad(Number(e.target.value))}
                              className="w-full h-1.5 bg-blue-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                            />
                          </div>
                        </div>

                        <div className="pt-2">
                          <div className="text-[10px] font-bold text-blue-900/50 uppercase tracking-tighter mb-1">Couverture Instantanée</div>
                          <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-black text-blue-700 tabular-nums">
                              {solarInstantLoad > 0 ? ((totalSolarPeakPower * INVERTER_EFFICIENCY) / solarInstantLoad * 100).toFixed(1) : '∞'}
                            </span>
                            <span className="text-sm font-bold text-blue-600 uppercase">%</span>
                          </div>
                          <p className="text-[9px] text-blue-500 italic mt-1 leading-tight">
                            Ratio entre puissance crête installée et charge active.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <span className="block text-[11px] uppercase tracking-widest text-text-muted font-bold">Nb. Panneaux</span>
                        <span className="text-lg font-bold text-yellow-600 font-mono">{solarPanelCount}</span>
                      </div>
                      <input 
                        type="range"
                        min="1"
                        max="100"
                        step="1"
                        value={solarPanelCount}
                        onChange={(e) => setSolarPanelCount(Number(e.target.value))}
                        className="w-full h-1.5 bg-border-theme rounded-lg appearance-none cursor-pointer accent-yellow-500 mb-4"
                      />
                      <div className="grid grid-cols-4 gap-2">
                        {[10, 15, 20, 25].map((count) => (
                          <button
                            key={count}
                            onClick={() => setSolarPanelCount(count)}
                            className={`py-2 px-3 rounded-xl text-xs font-extrabold transition-all border ${
                              solarPanelCount === count
                                ? 'bg-yellow-600 text-white border-yellow-600 shadow-md font-black scale-[1.02]'
                                : 'bg-white border-slate-200 text-slate-800 hover:border-slate-400 hover:bg-slate-50 shadow-xs'
                            }`}
                          >
                            {count}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <span className="block text-[11px] uppercase tracking-widest text-text-muted font-bold">Puissance/Panneau (W)</span>
                        <span className="text-lg font-bold text-yellow-600 font-mono">{solarPanelPower} W</span>
                      </div>
                      <input 
                        type="range"
                        min="0"
                        max="1000"
                        step="10"
                        value={solarPanelPower}
                        onChange={(e) => setSolarPanelPower(Number(e.target.value))}
                        className="w-full h-1.5 bg-border-theme rounded-lg appearance-none cursor-pointer accent-yellow-500 mb-4"
                      />
                      <div className="grid grid-cols-4 gap-2">
                        {[300, 400, 500, 600].map((p) => (
                          <button
                            key={p}
                            onClick={() => setSolarPanelPower(p)}
                            className={`py-2 px-3 rounded-xl text-xs font-extrabold transition-all border ${
                              solarPanelPower === p
                                ? 'bg-yellow-600 text-white border-yellow-600 shadow-md font-black scale-[1.02]'
                                : 'bg-white border-slate-200 text-slate-800 hover:border-slate-400 hover:bg-slate-50 shadow-xs'
                            }`}
                          >
                            {p}W
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <span className="block text-[10px] uppercase tracking-[0.2em] text-text-muted font-black mb-1">Puissance Totale (brut cc)</span>
                        <div className="text-xl font-black text-yellow-700 tabular-nums">
                          {(totalSolarPeakPower / 1000).toFixed(2)} <span className="text-sm font-bold text-text-muted">kWp</span>
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <span className="block text-[10px] uppercase tracking-[0.2em] text-text-muted font-black">Puissance Totale (Net AC)</span>
                          <span className="text-[9px] font-bold text-yellow-600 bg-yellow-50 px-1.5 py-0.5 rounded">Rendement 95%</span>
                        </div>
                        <div className="text-xl font-black text-text-main tabular-nums">
                          {(totalSolarPeakPower * INVERTER_EFFICIENCY / 1000).toFixed(2)} <span className="text-sm font-bold text-text-muted">kVA</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <span className="block text-[11px] uppercase tracking-widest text-text-muted font-bold">Ensoleillement (h/jour)</span>
                        <span className="text-lg font-bold text-yellow-600 font-mono">{sunlightHours} h</span>
                      </div>
                      <input 
                        type="range"
                        min="1"
                        max="12"
                        step="0.5"
                        value={sunlightHours}
                        onChange={(e) => setSunlightHours(Number(e.target.value))}
                        className="w-full h-1.5 bg-border-theme rounded-lg appearance-none cursor-pointer accent-yellow-500 mb-4"
                      />
                      <div className="grid grid-cols-4 gap-2">
                        {[2, 4, 6, 8].map((h) => (
                          <button
                            key={h}
                            onClick={() => setSunlightHours(h)}
                            className={`py-2 px-3 rounded-xl text-xs font-extrabold transition-all border ${
                              sunlightHours === h
                                ? 'bg-yellow-600 text-white border-yellow-600 shadow-md font-black scale-[1.02]'
                                : 'bg-white border-slate-200 text-slate-800 hover:border-slate-400 hover:bg-slate-50 shadow-xs'
                            }`}
                          >
                            {h}h
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="pt-6 border-t border-border-theme space-y-6">
                      <div className="flex flex-col p-4 bg-white rounded-xl border border-border-theme/50 shadow-sm">
                        <span className="text-[10px] font-bold text-text-muted uppercase mb-1">Production Journalière (avec rendement 95%)</span>
                        <span className="text-xl font-black text-text-main tabular-nums">{(totalSolarPeakPower * sunlightHours * INVERTER_EFFICIENCY / 1000).toFixed(2)} <span className="text-sm font-bold text-text-muted">kWh</span></span>
                      </div>

                      {/* Section: Mise à la terre RGIE */}
                      <div className="p-4 bg-yellow-50/70 rounded-2xl border border-yellow-200 space-y-4 shadow-sm">
                        <div className="flex items-center gap-2 mb-1">
                          <ShieldAlert className="w-4 h-4 text-yellow-600" />
                          <span className="text-[10px] font-black uppercase tracking-widest text-yellow-800">Mise à la Terre (RGIE Livre 1)</span>
                        </div>

                        <div className="space-y-3">
                          <div>
                            <span className="block text-[10px] uppercase font-bold text-yellow-800 mb-1.5">Section PE AC (Alimentation Onduleur)</span>
                            <div className="grid grid-cols-6 gap-1.5">
                              {[1.5, 2.5, 4, 6, 10, 16].map((section) => (
                                <button
                                  type="button"
                                  key={section}
                                  onClick={() => setSolarPeAcSection(section)}
                                  className={`py-2 rounded-lg text-xs font-black transition-all border ${
                                    solarPeAcSection === section
                                      ? 'bg-yellow-600 text-white border-yellow-600 shadow-md scale-[1.05]'
                                      : 'bg-white border-yellow-300 text-yellow-900 hover:border-yellow-500 hover:bg-yellow-50 shadow-xs'
                                  }`}
                                >
                                  {section}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div>
                            <span className="block text-[10px] uppercase font-bold text-yellow-800 mb-1.5">Mode de pose du câble de terre</span>
                            <div className="grid grid-cols-2 gap-2">
                              <button
                                type="button"
                                onClick={() => setSolarHasMechanicalProtection(true)}
                                className={`p-3 rounded-2xl text-[11px] font-bold text-left transition-all border leading-tight ${
                                  solarHasMechanicalProtection
                                    ? 'bg-yellow-600 text-white border-yellow-600 shadow-md scale-[1.02]'
                                    : 'bg-white border-yellow-300 text-yellow-905 hover:border-yellow-500 hover:bg-yellow-50 shadow-xs'
                                }`}
                              >
                                <div className="font-extrabold uppercase text-xs mb-0.5">Sous tube/conduit</div>
                                <span className="opacity-80 text-[10px]">Règle mécanique (min 2,5 mm²)</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => setSolarHasMechanicalProtection(false)}
                                className={`p-3 rounded-2xl text-[11px] font-bold text-left transition-all border leading-tight ${
                                  !solarHasMechanicalProtection
                                    ? 'bg-yellow-600 text-white border-yellow-600 shadow-md scale-[1.02]'
                                    : 'bg-white border-yellow-300 text-yellow-905 hover:border-yellow-500 hover:bg-yellow-50 shadow-xs'
                                }`}
                              >
                                <div className="font-extrabold uppercase text-xs mb-0.5">Sans protection</div>
                                <span className="opacity-80 text-[10px]">Pose libre (min 4 mm²)</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'pv-config' && (
                <motion.div 
                  key="pv-config-panel"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="absolute inset-0 bg-white flex flex-col"
                >
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold tracking-tight text-amber-600 uppercase flex items-center gap-2">
                      <GitFork className="w-5 h-5 text-amber-500" />
                      Couplage PV Solaire
                    </h2>
                  </div>

                  <div className="space-y-5 overflow-y-auto pr-2 custom-scrollbar flex-1">
                    
                    {/* 1. BILAN ÉNERGÉTIQUE (Ec) & ÉNERGIE À PRODUIRE (Ep = Ec + 25%) */}
                    <div className="p-4 bg-emerald-50/80 rounded-2xl border border-emerald-200/80 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase text-emerald-900 tracking-wider flex items-center gap-1.5">
                          <Activity className="w-4 h-4 text-emerald-600" />
                          1. Bilan Énergétique & Production Requise
                        </span>
                        <span className="text-[10px] font-bold bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded-md border border-emerald-300">
                          Ep = Ec + 25%
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="flex flex-col justify-between">
                          <label className="text-[9px] font-bold text-emerald-800 uppercase mb-1 min-h-[1.25rem] flex items-center">
                            Bilan Consommation Ec (W)
                          </label>
                          <input 
                            type="number"
                            step="100"
                            min="100"
                            value={pvEnergyConsumptionEc}
                            onChange={(e) => setPvEnergyConsumptionEc(Number(e.target.value))}
                            className="w-full h-10 px-3 bg-white border border-emerald-300 rounded-lg font-mono font-black text-emerald-950 outline-none focus:ring-1 focus:ring-emerald-500 text-sm"
                          />
                        </div>

                        <div className="flex flex-col justify-between">
                          <label className="text-[9px] font-bold text-emerald-800 uppercase mb-1 min-h-[1.25rem] flex items-center">
                            Énergie Requise Ep (Ec + 25%)
                          </label>
                          <div className="w-full h-10 px-3 bg-emerald-100/90 border border-emerald-300 rounded-lg flex items-center font-mono font-black text-emerald-950 text-sm">
                            {pvCouplingResults.ep} W
                          </div>
                        </div>
                      </div>

                      <div className="p-2.5 bg-white/90 rounded-xl border border-emerald-200 text-[10px] text-emerald-950 space-y-1">
                        <div className="flex justify-between items-center font-bold">
                          <span>Formule de production nécessaire :</span>
                          <span className="font-mono font-black text-emerald-800">
                            {pvEnergyConsumptionEc} W × 1.25 = {pvCouplingResults.ep} W
                          </span>
                        </div>
                        <div className="text-[9px] text-emerald-800/80">
                          Rendement & Marge de sécurité (+25% d'énergie supplémentaire contraintes de production solaire).
                        </div>
                      </div>
                    </div>

                    {/* 2. SÉLECTION BATTERIE DU MARCHÉ & ASSOCIATION SÉRIE/PARALLÈLE */}
                    <div className="p-4 bg-amber-50/80 rounded-2xl border border-amber-200/80 space-y-3.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase text-amber-950 tracking-wider flex items-center gap-1.5">
                          <Battery className="w-4 h-4 text-amber-600" />
                          2. Batterie du Marché & Montage (Série / Parallèle)
                        </span>
                        <span className="text-[10px] font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded-md border border-amber-300">
                          {pvCouplingResults.totalBatteriesCount} Batterie{pvCouplingResults.totalBatteriesCount > 1 ? 's' : ''} au total
                        </span>
                      </div>

                      {/* Preset Selector */}
                      <div className="space-y-1">
                        <label className="text-[8.5px] font-black text-amber-900 uppercase block">
                          Modèles de Batteries du Marché
                        </label>
                        <select
                          value={pvBatteryPreset}
                          onChange={(e) => applyPvBatteryPreset(e.target.value)}
                          className="w-full bg-white border border-amber-300 rounded-xl p-2 text-[11px] font-bold text-amber-950 focus:ring-1 focus:ring-amber-500 shadow-xs"
                        >
                          <optgroup label="── Batteries Plomb GEL / AGM (12V Nominales) ──">
                            <option value="gel_12v_100ah">GEL / AGM 12V 100 Ah (1.20 kWh)</option>
                            <option value="gel_12v_150ah">GEL / AGM 12V 150 Ah (1.80 kWh)</option>
                            <option value="gel_12v_200ah">GEL / AGM 12V 200 Ah (2.40 kWh)</option>
                            <option value="gel_12v_250ah">⭐ GEL / AGM 12V 250 Ah (3.00 kWh) [Exemple Utilisateur]</option>
                          </optgroup>

                          <optgroup label="── Batteries Lithium LiFePO4 (12V & 24V Nominales) ──">
                            <option value="lifepo4_12v_100ah">Lithium LiFePO4 12V 100 Ah (1.28 kWh)</option>
                            <option value="lifepo4_12v_200ah">Lithium LiFePO4 12V 200 Ah (2.56 kWh)</option>
                            <option value="lifepo4_24v_100ah">Lithium LiFePO4 24V 100 Ah (2.56 kWh)</option>
                          </optgroup>

                          <optgroup label="── Batteries Lithium Haute Capacité (48V Monobloc) ──">
                            <option value="rack_48v_100ah">Lithium Rack Baie 48V 100 Ah (5.12 kWh)</option>
                            <option value="wall_48v_200ah">Lithium Wall Mural 48V 200 Ah (10.24 kWh)</option>
                          </optgroup>
                        </select>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div className="flex flex-col justify-between">
                          <label className="text-[8.5px] font-bold text-amber-800 uppercase mb-1 min-h-[1.25rem] flex items-center">
                            Tension Unit (V)
                          </label>
                          <input 
                            type="number"
                            value={pvBatteryUnitVoltage}
                            onChange={(e) => setPvBatteryUnitVoltage(Number(e.target.value))}
                            className="w-full h-9 px-2 bg-white border border-amber-300 rounded-lg font-mono font-bold text-amber-900 outline-none text-xs"
                          />
                        </div>
                        <div className="flex flex-col justify-between">
                          <label className="text-[8.5px] font-bold text-amber-800 uppercase mb-1 min-h-[1.25rem] flex items-center">
                            Capacité Unit (Ah)
                          </label>
                          <input 
                            type="number"
                            value={pvBatteryUnitAh}
                            onChange={(e) => setPvBatteryUnitAh(Number(e.target.value))}
                            className="w-full h-9 px-2 bg-white border border-amber-300 rounded-lg font-mono font-bold text-amber-900 outline-none text-xs"
                          />
                        </div>
                        <div className="flex flex-col justify-between">
                          <label className="text-[8.5px] font-bold text-amber-800 uppercase mb-1 min-h-[1.25rem] flex items-center">
                            Besoin Calculé (Ah)
                          </label>
                          <div className="w-full h-9 px-2 bg-amber-100/80 border border-amber-300 rounded-lg flex items-center justify-center font-mono font-extrabold text-amber-950 text-xs">
                            {pvCouplingResults.calculatedAhNeeded} Ah
                          </div>
                        </div>
                      </div>

                      {/* Association Calculation Summary Card */}
                      <div className="bg-white/90 p-3 rounded-xl border border-amber-200 text-[10px] space-y-1.5">
                        <div className="font-extrabold text-amber-900 uppercase tracking-tight text-[9.5px]">
                          🧮 Décomposition Précise du Montage :
                        </div>
                        <ul className="space-y-1 text-slate-800 font-medium">
                          <li className="flex justify-between items-center border-b border-amber-100 pb-1">
                            <span>1. Formule Besoin Cible (Ah) :</span>
                            <strong className="text-amber-900 font-mono">
                              {pvCouplingResults.ep} W / (0.8 × {pvCouplingResults.pvBatteryVoltage} V) = {pvCouplingResults.calculatedAhNeeded} Ah
                            </strong>
                          </li>
                          <li className="flex justify-between items-center border-b border-amber-100 pb-1">
                            <span>2. Batteries en série / branche :</span>
                            <strong className="text-amber-900 font-mono">
                              {pvCouplingResults.pvBatteryVoltage}V / {pvBatteryUnitVoltage}V = {pvCouplingResults.batterySeriesCount} en série
                            </strong>
                          </li>
                          <li className="flex justify-between items-center border-b border-amber-100 pb-1">
                            <span>3. Branches en parallèle :</span>
                            <strong className="text-amber-900 font-mono">
                              {pvCouplingResults.targetAhNeeded}Ah / {pvBatteryUnitAh}Ah = {pvCouplingResults.batteryParallelCount} branche(s) //
                            </strong>
                          </li>
                          <li className="flex justify-between items-center pt-0.5 font-extrabold text-amber-950">
                            <span>Total de batteries nécessaires :</span>
                            <span className="bg-amber-600 text-white px-2 py-0.5 rounded text-[10.5px] font-mono">
                              {pvCouplingResults.batterySeriesCount} × {pvCouplingResults.batteryParallelCount} = {pvCouplingResults.totalBatteriesCount} batteries
                            </span>
                          </li>
                        </ul>
                      </div>
                    </div>

                    {/* 3. SPECIFICATIONS ONDULEUR */}
                    <div className="p-4 bg-sky-50/70 rounded-2xl border border-sky-200/80 space-y-3">
                      <span className="text-[10px] font-black uppercase text-sky-900 tracking-wider block">
                        3. Onduleurs du Marché
                      </span>

                      <select
                        value={pvInverterPreset}
                        onChange={(e) => applyPvInverterPreset(e.target.value)}
                        className="w-full bg-white border border-sky-200 rounded-xl p-2 text-[11px] font-bold text-sky-950 focus:ring-1 focus:ring-sky-500 shadow-xs"
                      >
                        <optgroup label="── Onduleurs Off-Grid & Hybrides (12V / 24V DC) ──">
                          <option value="growatt_spf_3000_24v">Growatt SPF 3000TL LVM (3 kW, Bat 24V, Vmax 145V, 80A)</option>
                          <option value="must_pv18_3k_24v">Must PV18-3024 VPK (3 kW, Bat 24V, Vmax 102V, 60A)</option>
                          <option value="victron_multi_12_3000">Victron MultiPlus-II 12/3000 (3 kW, Bat 12V, Vmax 150V)</option>
                          <option value="victron_easysolar_24">Victron EasySolar-II 24/3000 (3 kW, Bat 24V, Vmax 250V)</option>
                        </optgroup>

                        <optgroup label="── Onduleurs Hybrides Résidentiels (48V DC) ──">
                          <option value="growatt_spf_5000_48v">Growatt SPF 5000ES (5 kW, Bat 48V, Vmax 450V, 100A)</option>
                          <option value="deye_sun_5k_48v">Deye SUN-5K-SG04LP1 (5 kW, Bat 48V, Vmax 500V, 26A)</option>
                          <option value="deye_sun_8k_48v">Deye SUN-8K-SG04LP1 (8 kW, Bat 48V, Vmax 500V, 32A)</option>
                          <option value="must_ph18_5k_48v">Must PH18-5048 VPK (5 kW, Bat 48V, Vmax 145V, 80A)</option>
                          <option value="victron_easysolar_48">Victron EasySolar-II 48/5000 (5 kW, Bat 48V, Vmax 250V)</option>
                        </optgroup>

                        <optgroup label="── Onduleurs Réseau & Hybrides Haute Tension (HV) ──">
                          <option value="huawei_sun2000_5k">Huawei SUN2000-5KTL-L1 (5 kW, Vmax 600V, Plage 90-560V)</option>
                          <option value="sma_sunnyboy_5k">SMA Sunny Boy 5.0 (5 kW, Vmax 600V, Plage 175-500V)</option>
                          <option value="fronius_primo_5k">Fronius Primo 5.0-1 (5 kW, Vmax 1000V, Plage 80-800V)</option>
                        </optgroup>
                      </select>
                    </div>

                  </div>
                </motion.div>
              )}

              {activeTab === 'autonomy' && (
                <motion.div 
                  key="autonomy-panel"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="absolute inset-0 bg-white flex flex-col"
                >
                  <div className="flex justify-between items-center mb-8">
                    <h2 className="text-xl font-bold tracking-tight text-amber-600">Test Autonomie</h2>
                  </div>

                  <div className="space-y-6 overflow-y-auto pr-2">
                    <div className="p-4 bg-amber-500/5 rounded-2xl border border-amber-500/10 space-y-4">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[10px] font-bold text-amber-600 uppercase tracking-widest text-center w-full">Configuration Système</span>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <span className="block text-[11px] uppercase tracking-widest text-text-muted font-bold mb-3">Tension Batterie (V)</span>
                          <div className="grid grid-cols-3 gap-2 text-[10px]">
                            {[12, 24, 48].map((v) => (
                              <button
                                key={v}
                                onClick={() => setSolarBatteryVoltage(v)}
                                className={`py-2 rounded-lg font-bold transition-all border ${
                                  solarBatteryVoltage === v
                                    ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                                    : 'bg-white/50 border-amber-200 text-amber-800 hover:border-amber-400'
                                }`}
                              >
                                {v}V
                              </button>
                            ))}
                          </div>
                          <p className="text-[9px] text-amber-700/60 mt-1 italic">
                            {solarBatteryVoltage === 12 ? "< 1000W" : solarBatteryVoltage === 24 ? "2000W - 3000W" : "> 3000W"}
                          </p>
                        </div>

                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-[11px] font-bold text-text-muted uppercase tracking-tight">Capacité Batterie (Ah)</span>
                            <span className="text-xs font-bold text-text-main font-mono">{solarBatteryAh} Ah</span>
                          </div>
                          <input 
                            type="range"
                            min="50"
                            max="1000"
                            step="5"
                            value={solarBatteryAh}
                            onChange={(e) => setSolarBatteryAh(Number(e.target.value))}
                            className="w-full h-1.5 bg-amber-200 rounded-lg appearance-none cursor-pointer accent-amber-600"
                          />
                        </div>

                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-[11px] font-bold text-text-muted">Puissance appareil (W)</span>
                            <span className="text-xs font-bold text-text-main font-mono">{solarAppliancePower} W</span>
                          </div>
                          <input 
                            type="range"
                            min="0"
                            max="5000"
                            step="1"
                            value={solarAppliancePower}
                            onChange={(e) => setSolarAppliancePower(Number(e.target.value))}
                            className="w-full h-1.5 bg-amber-200 rounded-lg appearance-none cursor-pointer accent-amber-600"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-600 text-white rounded-lg">
                          <Battery className="w-5 h-5" />
                        </div>
                        <div>
                          <span className="block text-[10px] font-bold text-amber-700 uppercase">Capacité Utile</span>
                          <span className="text-lg font-black text-amber-900 font-mono">
                            {(solarBatteryAh * solarBatteryVoltage * 0.8 / 1000).toFixed(1)} kWh
                            <span className="ml-2 text-[10px] font-normal opacity-60"> (80% de décharge)</span>
                          </span>
                          <div className="mt-2 pt-2 border-t border-amber-200/50">
                            <span className="block text-[9px] font-bold text-amber-700/70 uppercase">Capacité Réelle</span>
                            <span className="text-xs font-bold text-amber-800 font-mono">
                              {(solarBatteryAh * solarBatteryVoltage / 1000).toFixed(1)} kWh
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'ev-charger' && (
                <motion.div 
                  key="ev-panel"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="absolute inset-0 bg-white flex flex-col"
                >
                  <div className="flex justify-between items-center mb-8">
                    <h2 className="text-xl font-bold tracking-tight text-emerald-600">Borne de Recharge</h2>
                  </div>

                  <div className="space-y-6 overflow-y-auto pr-2">
                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <span className="block text-[11px] uppercase tracking-widest text-text-muted font-bold">Batterie (kWh)</span>
                        <span className="text-lg font-bold text-emerald-600 font-mono">{batteryCapacity} kWh</span>
                      </div>
                      <input 
                        type="range"
                        min="20"
                        max="160"
                        step="1"
                        value={batteryCapacity}
                        onChange={(e) => setBatteryCapacity(Number(e.target.value))}
                        className="w-full h-1.5 bg-border-theme rounded-lg appearance-none cursor-pointer accent-emerald-500 mb-4"
                      />
                      <div className="grid grid-cols-5 gap-1.5">
                        {[20, 50, 80, 100, 160].map((cap) => (
                          <button
                            key={cap}
                            onClick={() => setBatteryCapacity(cap)}
                            className={`py-2 px-3 rounded-xl text-xs font-extrabold transition-all border ${
                              batteryCapacity === cap
                                ? 'bg-emerald-600 text-white border-emerald-600 shadow-md font-black scale-[1.02]'
                                : 'bg-white border-slate-200 text-slate-800 hover:border-slate-400 hover:bg-slate-50 shadow-xs'
                            }`}
                          >
                            {cap}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <span className="block text-[11px] uppercase tracking-widest text-text-muted font-bold">Puissance Borne (kW)</span>
                        <span className="text-lg font-bold text-emerald-600 font-mono">{chargerPower} kW</span>
                      </div>
                      <div className="grid grid-cols-3 gap-1.5 mb-4">
                        {[2.3, 3.7, 7.4].map((p) => (
                          <button
                            key={p}
                            onClick={() => setChargerPower(p)}
                            className={`py-2 px-3 rounded-xl text-xs font-extrabold transition-all border ${
                              chargerPower === p
                                ? 'bg-emerald-600 text-white border-emerald-600 shadow-md font-black scale-[1.02]'
                                : 'bg-white border-slate-200 text-slate-800 hover:border-slate-400 hover:bg-slate-50 shadow-xs'
                            }`}
                          >
                            {p}
                          </button>
                        ))}
                      </div>
                      <div className="flex items-center gap-2 p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                        <ShieldAlert className="w-4 h-4 text-emerald-600" />
                        <div className="flex-1">
                          <span className="block text-[8px] font-black text-emerald-700 uppercase leading-none mb-1">Disjoncteur préconisé</span>
                          <span className="text-sm font-bold text-emerald-900">{recommendedEVBreaker}A <span className="text-[10px] opacity-60">(courbe C)</span></span>
                        </div>
                        <div className="text-right">
                          <span className="block text-[8px] font-bold text-emerald-700/50 uppercase leading-none mb-1">Intensité</span>
                          <span className="text-xs font-mono font-bold text-emerald-800 tracking-tighter">{((chargerPower * 1000) / 230).toFixed(1)}A</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <span className="block text-[11px] uppercase tracking-widest text-text-muted font-bold">Charge Actuelle (%)</span>
                        <span className="text-lg font-bold text-emerald-600 font-mono">{currentCharge} %</span>
                      </div>
                      <input 
                        type="range"
                        min="0"
                        max="99"
                        value={currentCharge}
                        onChange={(e) => setCurrentCharge(Number(e.target.value))}
                        className="w-full h-1.5 bg-border-theme rounded-lg appearance-none cursor-pointer accent-emerald-500 mb-4"
                      />
                      <div className="grid grid-cols-4 gap-1.5">
                        {[10, 20, 50, 80].map((pct) => (
                          <button
                            key={pct}
                            onClick={() => setCurrentCharge(pct)}
                            className={`py-2 px-3 rounded-xl text-xs font-extrabold transition-all border ${
                              currentCharge === pct
                                ? 'bg-emerald-600 text-white border-emerald-600 shadow-md font-black scale-[1.02]'
                                : 'bg-white border-slate-200 text-slate-800 hover:border-slate-400 hover:bg-slate-50 shadow-xs'
                            }`}
                          >
                            {pct}%
                          </button>
                        ))}
                      </div>
                    </div>

                     <div className="pt-6 border-t border-border-theme space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-[11px] font-bold text-text-muted uppercase">Énergie à Récupérer</span>
                        <span className="font-mono font-bold text-text-main">{(batteryCapacity * (100 - currentCharge) / 100).toFixed(1)} kWh</span>
                      </div>

                      <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-border-theme">
                        <div className="flex-1">
                          <span className="block text-[10px] font-bold text-text-muted uppercase mb-1">Prix du kWh</span>
                          <div className="flex items-center gap-2">
                             <input 
                              type="number"
                              step="0.01"
                              value={evPricePerKWh}
                              onChange={(e) => setEvPricePerKWh(Number(e.target.value))}
                              className="w-full text-sm font-bold text-emerald-900 outline-none"
                             />
                             <Euro className="w-3 h-3 text-emerald-400" />
                          </div>
                        </div>
                        <input 
                          type="range"
                          min="0"
                          max="2"
                          step="0.01"
                          value={evPricePerKWh}
                          onChange={(e) => setEvPricePerKWh(Number(e.target.value))}
                          className="w-24 h-1.5 bg-emerald-100 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                        />
                      </div>

                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'specs' && (
                <motion.div 
                  key="specs-panel"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="absolute inset-0 bg-white flex flex-col p-8"
                >
                  <div className="flex flex-col gap-4 mb-8">
                    <h2 className="text-xl font-black tracking-tight text-slate-900 uppercase">Spécifications Techniques</h2>
                    
                    {/* Sub-tab Navigation */}
                    <div className="grid grid-cols-2 md:flex gap-2.5 w-full bg-transparent">
                      <button 
                        onClick={() => setSpecsSubTab('solar')}
                        className={`flex-1 flex items-center justify-center gap-2.5 py-3 px-4 rounded-2xl text-[10px] sm:text-xs font-black uppercase tracking-wider transition-all border ${
                          specsSubTab === 'solar' 
                            ? 'bg-blue-600 text-white border-blue-600 shadow-md scale-[1.02]' 
                            : 'bg-white text-blue-600 border-blue-300 hover:border-blue-500 hover:bg-blue-50/50 shadow-xs'
                        }`}
                      >
                        <Sun className={`w-4 h-4 shrink-0 transition-transform ${specsSubTab === 'solar' ? 'text-white rotate-45' : 'text-blue-500'}`} />
                        Panneaux PV
                      </button>
                      <button 
                        onClick={() => setSpecsSubTab('ev')}
                        className={`flex-1 flex items-center justify-center gap-2.5 py-3 px-4 rounded-2xl text-[10px] sm:text-xs font-black uppercase tracking-wider transition-all border ${
                          specsSubTab === 'ev' 
                            ? 'bg-blue-600 text-white border-blue-600 shadow-md scale-[1.02]' 
                            : 'bg-white text-blue-600 border-blue-300 hover:border-blue-500 hover:bg-blue-50/50 shadow-xs'
                        }`}
                      >
                        <Car className={`w-4 h-4 shrink-0 ${specsSubTab === 'ev' ? 'text-white' : 'text-blue-500'}`} />
                        Borne EV
                      </button>
                      <button 
                        onClick={() => setSpecsSubTab('dedicated')}
                        className={`flex-1 flex items-center justify-center gap-2.5 py-3 px-4 rounded-2xl text-[10px] sm:text-xs font-black uppercase tracking-wider transition-all border ${
                          specsSubTab === 'dedicated' 
                            ? 'bg-blue-600 text-white border-blue-600 shadow-md scale-[1.02]' 
                            : 'bg-white text-blue-600 border-blue-300 hover:border-blue-500 hover:bg-blue-50/50 shadow-xs'
                        }`}
                      >
                        <PlugZap className={`w-4 h-4 shrink-0 ${specsSubTab === 'dedicated' ? 'text-white' : 'text-blue-500'}`} />
                        Circuits Dédiés
                      </button>
                      <button 
                        onClick={() => setSpecsSubTab('rcd')}
                        className={`flex-1 flex items-center justify-center gap-2.5 py-3 px-4 rounded-2xl text-[10px] sm:text-xs font-black uppercase tracking-wider transition-all border ${
                          specsSubTab === 'rcd' 
                            ? 'bg-blue-600 text-white border-blue-600 shadow-md scale-[1.02]' 
                            : 'bg-white text-blue-600 border-blue-300 hover:border-blue-500 hover:bg-blue-50/50 shadow-xs'
                        }`}
                      >
                        <ShieldAlert className={`w-4 h-4 shrink-0 ${specsSubTab === 'rcd' ? 'text-white' : 'text-blue-500'}`} />
                        Choix Diff 30/300
                      </button>
                    </div>
                  </div>

                  <div className="space-y-6 overflow-y-auto pr-2 custom-scrollbar flex-1">
                    <AnimatePresence mode="wait">
                      {specsSubTab === 'solar' ? (
                        <motion.div
                          key="solar-specs"
                          initial={{ opacity: 0, scale: 0.98 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.98 }}
                          className="space-y-6"
                        >
                          {/* PV Data */}
                          <div className="bg-emerald-50 p-5 rounded-3xl border border-emerald-100">
                            <div className="flex items-center gap-2 mb-4">
                              <Sun className="w-5 h-5 text-emerald-600" />
                              <h3 className="text-sm font-black text-emerald-900 uppercase">Données Installation PV</h3>
                            </div>
                            <ul className="space-y-3">
                              <li className="flex items-start gap-2 text-xs font-medium text-emerald-800">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1 shrink-0" />
                                <span>Nombre et puissance nominale des modules.</span>
                              </li>
                              <li className="flex items-start gap-2 text-xs font-medium text-emerald-800">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1 shrink-0" />
                                <span>Type, S/N et puissance AC maximale des onduleurs.</span>
                              </li>
                            </ul>
                          </div>

                          {/* Management Cabinet */}
                          <div className="bg-slate-900 p-6 rounded-[2.5rem] text-white">
                            <div className="flex items-center gap-2 mb-3">
                              <ShieldCheck className="w-5 h-5 text-emerald-400" />
                              <h3 className="text-sm font-black uppercase tracking-widest text-emerald-400">Protection du Coffret</h3>
                            </div>
                            
                            <div className="space-y-4 pt-2">
                              <div className="p-4 bg-white/5 border border-white/10 rounded-2xl">
                                <h4 className="text-[10px] font-black text-emerald-400 uppercase mb-2">Option A : Limiteur</h4>
                                <p className="text-[10px] leading-relaxed text-slate-300">
                                  Évite le remplacement des pontages en limitant l'intensité interne par un <span className="text-emerald-400 font-bold">disjoncteur limiteur</span> (même intensité nominale des différentiels) en amont des différentiels 30mA pour les protéger de l'intensité cumulée <span className="text-emerald-400 font-bold">(Panneaux + GRD)</span>.
                                </p>
                              </div>
                              <div className="p-4 bg-white/5 border border-white/10 rounded-2xl">
                                <h4 className="text-[10px] font-black text-emerald-400 uppercase mb-2">Option B : Mise à niveau</h4>
                                <p className="text-[10px] leading-relaxed text-slate-300">
                                  Remplacement pontages <span className="italic">si nécessaires</span> + différentiels subordonnés adaptés pour le <span className="text-emerald-400 font-bold">cumul GRD + PV</span>.
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Grounding of PV Frames (Belgian RGIE) */}
                          <div className="bg-yellow-50 p-6 rounded-[2.5rem] border border-yellow-200">
                            <div className="flex items-center gap-2 mb-3">
                              <ShieldAlert className="w-5 h-5 text-yellow-600 animate-pulse" />
                              <h3 className="text-sm font-black uppercase tracking-widest text-yellow-800">Mise à la Terre des Structures &amp; Cadres (RGIE)</h3>
                            </div>
                            
                            <p className="text-[10px] text-yellow-950 font-semibold leading-relaxed mb-3">
                              Pour une installation photovoltaïque domestique (<strong>≤ 10 kVA</strong>), le <strong>RGIE (Livre 1)</strong> impose des règles précises concernant la section du conducteur de protection (câble de terre) utilisé pour la mise à la terre des cadres métalliques des modules et de leurs structures :
                            </p>

                            <ol className="space-y-3 text-[10px] leading-relaxed text-yellow-900">
                              <li className="flex items-start gap-2 bg-white/60 p-3 rounded-2xl border border-yellow-100">
                                <span className="text-yellow-600 font-extrabold">1.</span>
                                <div>
                                  <strong className="text-yellow-950 block uppercase text-[9px] mb-0.5">Règle de Correspondance</strong>
                                  La section du conducteur de protection doit être au moins équivalente à celle du conducteur de protection de l’alimentation en courant alternatif (AC) de l'installation photovoltaïque.
                                </div>
                              </li>
                              <li className="flex items-start gap-2 bg-white/60 p-3 rounded-2xl border border-yellow-100">
                                <span className="text-yellow-600 font-extrabold">2.</span>
                                <div>
                                  <strong className="text-yellow-950 block uppercase text-[9px] mb-0.5">Sections minimales obligatoires</strong>
                                  Même si le conducteur de protection AC est de faible section, le câble de terre des panneaux doit respecter des minima absolus en fonction de son mode de pose :
                                  <ul className="list-disc pl-4 mt-1.5 space-y-1 text-yellow-905 font-medium">
                                    <li><strong>2,5 mm²</strong> si le conducteur comporte une protection mécanique (par exemple, s'il est placé sous tube ou conduit).</li>
                                    <li><strong>4 mm²</strong> si le conducteur ne comporte pas de protection mécanique.</li>
                                  </ul>
                                </div>
                              </li>
                            </ol>
                            
                            <p className="text-[9px] text-yellow-600 italic mt-3 leading-tight font-medium">
                              *Ces règles s'appliquent sauf indication contraire explicite du fabricant des modules photovoltaïques.
                            </p>
                          </div>
                        </motion.div>
                      ) : specsSubTab === 'ev' ? (
                        <motion.div
                          key="ev-specs"
                          initial={{ opacity: 0, scale: 0.98 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.98 }}
                          className="space-y-6"
                        >
                          <div className="p-6 bg-blue-50 rounded-[2.5rem] border border-blue-100">
                            <div className="flex items-center gap-2 mb-4">
                              <Car className="w-6 h-6 text-blue-600" />
                              <h3 className="text-sm font-black text-blue-900 uppercase font-mono">Normes Borne de Recharge</h3>
                            </div>
                            <div className="space-y-4">
                              <div className="space-y-2">
                                <h4 className="text-[10px] font-black text-blue-800 uppercase flex items-center gap-1">
                                  <Shield className="w-3.5 h-3.5" /> Protection Différentielle 30mA
                                </h4>
                                <p className="text-[11px] text-blue-700 leading-relaxed">
                                  <strong className="text-blue-900">Obligatoire :</strong> Type B recommandé (DC leakage) ou obligatoire si aucune protection DC 6mA n'est intégrée à la borne.
                                </p>
                              </div>

                              <div className="p-4 bg-white rounded-2xl border border-blue-200 shadow-sm space-y-1.5">
                                <h4 className="text-[9px] font-black text-blue-800 uppercase mb-1">Exception DC 6mA &amp; Risque d'Aveuglement</h4>
                                <p className="text-[10px] text-blue-700 leading-relaxed italic">
                                  Type A ou F suffisant si la borne possède une protection DC 6mA intégrée. 
                                </p>
                                <p className="text-[9.5px] text-red-600 leading-relaxed font-semibold">
                                  ⚠️ Si la borne ne possède pas de protection 6mA DC intégrée, l'utilisation d'un différentiel de Type B est impératif pour la borne. De plus, il faut veiller à ce que le différentiel en amont soit également adapté (Type B), sous peine d'être <strong>"aveuglé" (désensibilisé)</strong> par des fuites de courant continu et de ne plus assurer de protection du tout pour le reste de l'installation.
                                </p>
                              </div>

                              <div className="flex items-start gap-3 bg-amber-500/10 p-4 rounded-2xl border border-amber-500/20">
                                <Zap className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                                <div className="space-y-1">
                                  <h4 className="text-[10px] font-black text-amber-700 uppercase">Circuit Dédié</h4>
                                  <p className="text-[10px] text-amber-800 leading-relaxed font-bold">
                                    Disjoncteur + Différentiel PROPRE à la borne. Aucun partage.
                                  </p>
                                  <p className="text-[9px] text-amber-700 leading-relaxed font-medium mt-1">
                                    Le calibre du disjoncteur doit être choisi en fonction de la <span className="underline">puissance maximale</span> de la borne installée.
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="p-4 bg-emerald-600 text-white rounded-3xl shadow-lg border border-emerald-500">
                            <div className="text-[9px] font-black uppercase opacity-80 mb-2 flex items-center gap-1">
                              <Info className="w-3 h-3" /> Note de Conclusion
                            </div>
                            <p className="text-[10px] leading-relaxed italic font-medium">
                              Pas de différentiel 30mA externe si protection intégrée ET caractéristiques jointes aux schémas.
                            </p>
                          </div>
                        </motion.div>
                      ) : specsSubTab === 'dedicated' ? (
                        <motion.div
                          key="dedicated-specs"
                          initial={{ opacity: 0, scale: 0.98 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.98 }}
                          className="space-y-6"
                        >
                          <div className="bg-blue-50 p-5 rounded-3xl border border-blue-200">
                            <div className="flex items-center gap-2 mb-3">
                              <PlugZap className="w-5 h-5 text-blue-600 animate-pulse" />
                              <h3 className="text-sm font-black text-blue-900 uppercase">Circuits Dédiés Résidentiels</h3>
                            </div>
                            <p className="text-[10.5px] text-blue-800 leading-relaxed font-semibold">
                              Selon la réglementation du <strong>RGIE</strong>, chaque appareil électroménager énergivore ou de forte puissance continue doit faire l'objet d'un circuit exclusif et dédié.
                            </p>
                          </div>

                          {/* Appliance choice grid */}
                          <div className="grid grid-cols-2 gap-2.5">
                            {dedicatedAppliances.map((app) => (
                              <button
                                key={app.id}
                                onClick={() => setSelectedDedicatedAppliance(app.id as any)}
                                className={`p-4 rounded-[1.25rem] border text-left transition-all flex flex-col gap-2 ${
                                  selectedDedicatedAppliance === app.id
                                    ? 'bg-blue-600 border-blue-600 text-white shadow-lg scale-[1.02] font-semibold'
                                    : 'bg-white border-slate-300 text-slate-800 hover:border-blue-400 hover:bg-blue-50/20 shadow-xs'
                                }`}
                              >
                                <div className="text-xs font-black tracking-tight leading-tight uppercase flex items-center gap-2">
                                  <div className={`w-2 h-2 rounded-full shrink-0 ${selectedDedicatedAppliance === app.id ? 'bg-white' : 'bg-blue-500'}`} />
                                  {app.name}
                                </div>
                                <div className={`text-[10px] font-mono leading-none ${selectedDedicatedAppliance === app.id ? 'text-blue-100 font-bold' : 'text-slate-600 font-semibold'}`}>
                                  ⚡ {app.power}
                                </div>
                              </button>
                            ))}
                          </div>
                        </motion.div>
                      ) : (
                        <motion.div
                          key="rcd-specs"
                          initial={{ opacity: 0, scale: 0.98 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.98 }}
                          className="space-y-6"
                        >
                          <div className="bg-indigo-50 p-5 rounded-3xl border border-indigo-100">
                            <div className="flex items-center gap-2 mb-3">
                              <ShieldAlert className="w-5 h-5 text-indigo-600" />
                              <h3 className="text-sm font-black text-indigo-900 uppercase">Répartition Différentielle RGIE</h3>
                            </div>
                            <p className="text-[10.5px] text-indigo-800 leading-relaxed font-semibold">
                              La répartition des récepteurs entre les différentiels <strong>300 mA (Général)</strong> et <strong>30 mA (Haute Sensibilité)</strong> répond à des impératifs distincts du RGIE : la protection des biens (incendie) et des personnes (chocs électriques/locaux humides).
                            </p>
                          </div>

                          {/* Appliance choice selector */}
                          <div className="grid grid-cols-2 gap-2.5">
                            {rcdAppliances.map((app) => (
                              <button
                                key={app.id}
                                onClick={() => setSelectedRcdAppliance(app.id)}
                                className={`p-4 rounded-[1.25rem] border text-left transition-all flex flex-col gap-2 ${
                                  selectedRcdAppliance === app.id
                                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg scale-[1.02] font-semibold'
                                    : 'bg-white border-slate-300 text-slate-800 hover:border-indigo-400 hover:bg-indigo-50/20 shadow-xs'
                                }`}
                              >
                                <div className="text-xs font-black tracking-tight leading-tight uppercase flex items-center gap-2">
                                  <div className={`w-2 h-2 rounded-full shrink-0 ${selectedRcdAppliance === app.id ? 'bg-white' : 'bg-indigo-500'}`} />
                                  {app.name}
                                </div>
                                <div className={`text-[10px] font-mono leading-none ${selectedRcdAppliance === app.id ? 'text-indigo-100 font-bold' : 'text-slate-600 font-semibold'}`}>
                                  ⚙️ {app.rcdValue.split('(')[0].trim()}
                                </div>
                              </button>
                            ))}
                          </div>

                          {/* Selected appliance details */}
                          {(() => {
                            const app = rcdAppliances.find(a => a.id === selectedRcdAppliance) || rcdAppliances[0];
                            return (
                              <div className="bg-slate-900 p-5 rounded-[2rem] text-white space-y-4">
                                <div className="border-b border-white/10 pb-3">
                                  <div className="text-[8.5px] font-black uppercase text-indigo-400 tracking-wider mb-1">Diagnostic Répartition Différentiel</div>
                                  <h4 className="text-xs font-black uppercase text-white font-mono">{app.name}</h4>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                  <div className="bg-white/5 p-3 rounded-xl border border-white/10">
                                    <div className="text-[7.5px] font-bold text-slate-400 uppercase mb-1">Seuil RGIE obligatoire</div>
                                    <div className="text-[11px] font-black text-indigo-300 font-mono">{app.rcdValue}</div>
                                  </div>
                                  <div className="bg-white/5 p-3 rounded-xl border border-white/10">
                                    <div className="text-[7.5px] font-bold text-slate-400 uppercase mb-1">Catégorie RGIE</div>
                                    <div className="text-[10px] font-black text-teal-300 font-mono">{app.urgency}</div>
                                  </div>
                                </div>

                                <div className="space-y-3 pt-1">
                                  <div className="space-y-1">
                                    <div className="text-[8px] font-bold text-indigo-300 uppercase">Pourquoi cette répartition ?</div>
                                    <p className="text-[9.5px] text-slate-300 leading-relaxed font-sans">{app.why}</p>
                                  </div>

                                  <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl space-y-2">
                                    <div className="text-[8.5px] font-black text-indigo-400 uppercase flex items-center gap-1.5">
                                      <Info className="w-3 h-3 shrink-0" />
                                      Rappel Généralité RGIE
                                    </div>
                                    <p className="text-[9px] text-slate-400 leading-relaxed">
                                      Un différentiel de haute sensibilité (30 mA) assure la protection active des personnes contre les contacts directs / indirects dans les pièces d'eau ou sur des machines mobiles. Le différentiel général (300 mA) surveille l'isolation globale face au risque d'incendie sans disjonctions répétées intempestives.
                                    </p>
                                  </div>
                                </div>
                              </div>
                            );
                          })()}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              )}
              {activeTab === 'rj45' && (
                <motion.div 
                  key="rj45-panel"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="absolute inset-0 bg-white flex flex-col"
                >
                  <div className="flex justify-between items-center mb-8">
                    <h2 className="text-xl font-bold tracking-tight text-pink-600">Blindage câble</h2>
                  </div>

                  <div className="space-y-6 overflow-y-auto pr-2">
                    <div className="pt-2">
                      <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 shadow-sm">
                        <div className="flex items-center gap-2 mb-4">
                          <ShieldCheck className="w-4 h-4 text-slate-600" />
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-700">Blindage & Types</span>
                        </div>
                        
                        <div className="text-center py-4 bg-white rounded-xl border border-slate-200 mb-6">
                          <div className="text-2xl font-black text-slate-800 tracking-tighter">
                            <span className="text-pink-600">X</span> / <span className="text-amber-500">XX</span> TP
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div className="relative pl-4 border-l-2 border-amber-400">
                            <div className="text-[10px] font-bold text-amber-600 uppercase mb-1">Blindage individuel (<span className="text-amber-500">XX</span>)</div>
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 text-[11px]">
                                <span className="font-bold w-4">U:</span> <span>Non blindé</span>
                              </div>
                              <div className="flex items-center gap-2 text-[11px]">
                                <span className="font-bold w-4">F:</span> <span>Feuillard Alu</span>
                              </div>
                            </div>
                          </div>

                          <div className="relative pl-4 border-l-2 border-pink-400">
                            <div className="text-[10px] font-bold text-pink-600 uppercase mb-1">Blindage général (<span className="text-pink-500">X</span>)</div>
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 text-[11px]">
                                <span className="font-bold w-4">U:</span> <span>Non blindé</span>
                              </div>
                              <div className="flex items-center gap-2 text-[11px]">
                                <span className="font-bold w-4">F:</span> <span>Feuillard Alu</span>
                              </div>
                              <div className="flex items-center gap-2 text-[11px]">
                                <span className="font-bold w-4">S:</span> <span>Tresse cuivre étamé</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 shadow-sm">
                        <div className="flex items-center gap-2 mb-4">
                          <Settings2 className="w-4 h-4 text-slate-600" />
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-700">Standards & Signification</span>
                        </div>

                        <div className="space-y-3">
                          <div className="grid grid-cols-2 gap-2">
                            {rj45Types.map((type) => (
                              <button
                                key={type.name}
                                onClick={() => setSelectedRJ45Type(type.name)}
                                className={`p-3 rounded-xl border text-left transition-all ${
                                  selectedRJ45Type === type.name
                                    ? 'bg-pink-600 border-pink-600 text-white shadow-md scale-[1.02]'
                                    : 'bg-white border-slate-200 text-slate-600 hover:border-pink-300'
                                }`}
                              >
                                <div className="text-xs font-black">{type.name}</div>
                                <div className={`text-[8px] uppercase font-bold opacity-70 ${selectedRJ45Type === type.name ? 'text-white' : 'text-slate-400'}`}>
                                  {type.full}
                                </div>
                              </button>
                            ))}
                          </div>

                          <AnimatePresence mode="wait">
                            {selectedRJ45Type && (
                              <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="mt-4 p-4 bg-pink-50 border border-pink-100 rounded-2xl"
                              >
                                {rj45Types.find(t => t.name === selectedRJ45Type) && (
                                  <>
                                    <div className="text-[10px] font-black text-pink-600 uppercase mb-2">
                                      Description : {selectedRJ45Type} ({rj45Types.find(t => t.name === selectedRJ45Type)?.full})
                                    </div>
                                    <div className="text-xs font-bold text-slate-700 mb-1">
                                      {rj45Types.find(t => t.name === selectedRJ45Type)?.desc}
                                    </div>
                                    <div className="text-[11px] text-slate-600 leading-relaxed italic">
                                      {rj45Types.find(t => t.name === selectedRJ45Type)?.detail}
                                    </div>
                                    
                                    <div className="mt-4 flex gap-2">
                                       <div className={`px-2 py-1 rounded text-[9px] font-bold border ${selectedRJ45Type === 'UTP' ? 'bg-red-100 text-red-600 border-red-200' : 'bg-emerald-100 text-emerald-600 border-emerald-200'}`}>
                                          {selectedRJ45Type === 'UTP' ? 'Faible blindage' : 'Immunité interférences'}
                                       </div>
                                       <div className="px-2 py-1 rounded bg-slate-100 text-slate-600 border border-slate-200 text-[9px] font-bold">
                                          CAT 5e / 6 / 6a / 7
                                       </div>
                                    </div>
                                  </>
                                )}
                              </motion.div>
                            )}
                          </AnimatePresence>

                          {!selectedRJ45Type && (
                            <div className="text-center py-4 text-[10px] font-bold text-slate-400 italic">
                              Cliquez sur un type pour voir les détails
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
              {activeTab === 'lighting' && (
                <motion.div 
                  key="lighting-panel"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="absolute inset-0 bg-white flex flex-col"
                >
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold tracking-tight text-yellow-600 italic uppercase">Lumière</h2>
                  </div>

                  <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                    <div className="space-y-8">
                      <section className="bg-slate-50 p-6 rounded-3xl border border-slate-100 shadow-sm">
                        <div className="flex items-center gap-2 mb-6">
                          <Gauge className="w-4 h-4 text-slate-600" />
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-700">Température de Couleur</span>
                        </div>
                        
                        <div className="relative pt-6 pb-2 px-1">
                           <div 
                             className="h-3 rounded-full w-full shadow-inner"
                             style={{
                               background: 'linear-gradient(to right, #ff3800, #ff8b14, #ffc375, #ffe4be, #fff3e9, #f5f5ff, #d9e3ff, #c6d5ff, #b8caff)'
                             }}
                           />
                           <input 
                             type="range"
                             min="1000"
                             max="9000"
                             step="100"
                             value={lightTemp}
                             onChange={(e) => setLightTemp(Number(e.target.value))}
                             className="absolute top-4 left-0 w-full h-8 opacity-0 cursor-pointer z-10"
                           />
                           <motion.div 
                             className="absolute top-5 w-5 h-5 bg-white border-2 border-slate-900 rounded-full shadow-lg pointer-events-none"
                             animate={{ left: `${((lightTemp - 1000) / 8000) * 100}%` }}
                             transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                             style={{ translateX: '-50%' }}
                           />
                        </div>
                        <div className="flex justify-between text-[9px] font-black text-slate-400 mt-4 uppercase tracking-tighter">
                          <span>1000K (Bougie)</span>
                          <span>9000K (Ciel Bleu)</span>
                        </div>
                        
                        <div className="mt-8 flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200">
                           <div className="text-[10px] font-bold text-slate-400 uppercase">Valeur Actuelle</div>
                           <div className="text-3xl font-black text-slate-900 tabular-nums">
                             {lightTemp}<span className="text-sm font-bold text-yellow-500 ml-1">K</span>
                           </div>
                        </div>
                      </section>

                      <section className="bg-slate-50 p-6 rounded-3xl border border-slate-100 shadow-sm">
                        <div className="flex items-center gap-2 mb-6">
                          <Zap className="w-4 h-4 text-orange-500" />
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-700">Photométrie & Intensité</span>
                        </div>
                        
                        <div className="space-y-6">
                           <div>
                              <div className="flex justify-between mb-2">
                                <span className="text-[10px] font-bold text-slate-500 uppercase">Flux Lumineux (Lumens)</span>
                                <span className="text-xs font-black text-orange-600">{lightLumens} lm</span>
                              </div>
                              <input 
                                type="range"
                                min="10"
                                max="5000"
                                step="10"
                                value={lightLumens}
                                onChange={(e) => setLightLumens(Number(e.target.value))}
                                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-orange-500"
                              />
                           </div>

                           <div>
                              <div className="flex justify-between mb-2">
                                <span className="text-[10px] font-bold text-slate-500 uppercase">Distance de la Cible</span>
                                <span className="text-xs font-black text-blue-600">{lightDistance} m</span>
                              </div>
                              <input 
                                type="range"
                                min="0.5"
                                max="10"
                                step="0.1"
                                value={lightDistance}
                                onChange={(e) => setLightDistance(Number(e.target.value))}
                                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
                              />
                              <div className="mt-2 flex justify-end">
                                <button
                                  onClick={() => setLightDistance(3)}
                                  className={`px-2 py-0.5 rounded text-[8px] font-black uppercase transition-all border ${
                                    lightDistance === 3
                                      ? 'bg-blue-600 border-blue-600 text-white'
                                      : 'bg-white border-blue-200 text-blue-600 hover:border-blue-400'
                                  }`}
                                >
                                  3.0m (Standard)
                                </button>
                              </div>
                           </div>

                           <div>
                              <div className="flex justify-between mb-2">
                                <span className="text-[10px] font-bold text-slate-500 uppercase">Angle d'Ouverture</span>
                                <span className="text-xs font-black text-emerald-600">{lightAngle}°</span>
                              </div>
                              <input 
                                type="range"
                                min="10"
                                max="180"
                                step="5"
                                value={lightAngle}
                                onChange={(e) => setLightAngle(Number(e.target.value))}
                                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                              />
                           </div>

                           <div>
                              <div className="flex justify-between mb-2">
                                <span className="text-[10px] font-bold text-slate-500 uppercase">Superficie Éclairée (m²)</span>
                                <span className="text-xs font-black text-indigo-600">{lightArea} m²</span>
                              </div>
                              <input 
                                type="range"
                                min="0"
                                max="50"
                                step="0.5"
                                value={lightArea}
                                onChange={(e) => handleAreaChange(Number(e.target.value))}
                                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                              />
                           </div>

                           <div>
                              <div className="flex justify-between mb-2">
                                <span className="text-[10px] font-bold text-slate-500 uppercase">Éclairement Cible (Lux)</span>
                                <span className="text-xs font-black text-rose-600">{targetLux} lx</span>
                              </div>
                              <input 
                                type="range"
                                min="10"
                                max="2000"
                                step="10"
                                value={targetLux}
                                onChange={(e) => setTargetLux(Number(e.target.value))}
                                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-rose-500"
                              />
                              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                                {[
                                  { name: 'Ambiance', val: 125, range: '100-150 lx', emoji: '🛌' },
                                  { name: 'Cuisine/Bureau', val: 350, range: '200-500 lx', emoji: '🍳' },
                                  { name: 'Chambre (Expert)', val: 300, range: '300 lx', emoji: '🛋️' },
                                  { name: 'S. de bain', val: 400, range: '400 lx', emoji: '🚿' }
                                ].map((preset) => (
                                  <button
                                    key={preset.name}
                                    onClick={() => setTargetLux(preset.val)}
                                    className={`p-2.5 rounded-2xl border text-left transition-all min-h-[54px] flex flex-col justify-between ${
                                      targetLux === preset.val
                                        ? 'bg-rose-50 border-rose-200 ring-2 ring-rose-500/10'
                                        : 'bg-white border-slate-200 hover:border-rose-200 hover:shadow-sm'
                                    }`}
                                  >
                                    <div className="flex items-center gap-1.5 mb-1 min-w-0">
                                      <span className="text-xs shrink-0">{preset.emoji}</span>
                                      <span className="text-[8px] font-black uppercase text-slate-700 leading-tight truncate">
                                        {preset.name}
                                      </span>
                                    </div>
                                    <div className="text-[9px] font-black text-rose-600 mt-auto flex items-center justify-between">
                                      <span>{preset.val}</span>
                                      <span className="text-[7px] opacity-70 italic font-bold ml-1">{preset.range.split(' ')[0]}</span>
                                    </div>
                                  </button>
                                ))}
                              </div>
                           </div>
                        </div>
                      </section>
                    </div>
                  </div>
                </motion.div>
              )}
              {activeTab === 'notes' && (
                <motion.div 
                  key="notes-panel"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="absolute inset-0 bg-white flex flex-col"
                >
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold tracking-tight text-blue-600">Guide de Dépannage</h2>
                  </div>

                  <div className="flex-1 overflow-y-auto pr-2">
                    <div className="space-y-3">
                      {FAULTS.map((fault) => {
                        const Icon = fault.icon;
                        const isSelected = selectedFaultId === fault.id;
                        return (
                          <button
                            key={fault.id}
                            onClick={() => setSelectedFaultId(fault.id)}
                            className={`group relative w-full text-left p-4 rounded-2xl border transition-all duration-300 overflow-hidden ${
                              isSelected
                                ? `${fault.bg} ${fault.border} shadow-md ring-1 ring-blue-500/10`
                                : 'bg-white border-slate-100 hover:border-slate-300 hover:shadow-sm'
                            }`}
                          >
                            {isSelected && (
                              <motion.div 
                                layoutId="active-bg"
                                className="absolute inset-0 bg-gradient-to-br from-transparent to-white/50 pointer-events-none" 
                              />
                            )}
                            <div className="relative z-10 flex items-center gap-4">
                              <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110 ${
                                isSelected ? fault.iconColor : 'bg-slate-50 border-slate-100 text-slate-400'
                              }`}>
                                <Icon className="w-5 h-5" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className={`text-[9px] font-black uppercase tracking-[0.2em] mb-0.5 ${
                                  isSelected ? fault.color : 'text-slate-400'
                                }`}>
                                  {fault.id}
                                </div>
                                <div className={`font-bold text-sm leading-tight truncate ${
                                  isSelected ? 'text-slate-900' : 'text-slate-600'
                                }`}>
                                  {fault.type}
                                </div>
                              </div>
                              <ChevronRight className={`w-4 h-4 transition-transform duration-300 ${
                                isSelected ? 'text-slate-400 translate-x-0' : 'text-slate-200 -translate-x-2 opacity-0'
                              }`} />
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="mt-6 pt-6 border-t border-border-theme text-[11px] text-text-muted italic">
                    Source : Analyse et Dépannage des Défauts Électriques Résidentiels.
                  </div>
                </motion.div>
              )}

              {activeTab === 'salledeau' && (
                <motion.div 
                  key="salledeau-panel"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="absolute inset-0 bg-white flex flex-col"
                >
                  <div className="flex justify-between items-center mb-3">
                    <h2 className="text-xl font-bold tracking-tight text-sky-600">Sécurité Salle d'Eau</h2>
                  </div>

                  <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-4">
                    {/* Mode Choice */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Norme RGIE (Livre 1)</label>
                      <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-xl text-xs font-bold shadow-inner">
                        <button 
                          onClick={() => {
                            setBathStandardYear('PRE_2025');
                          }}
                          className={`py-1.5 rounded-lg transition-all text-center ${bathStandardYear === 'PRE_2025' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                        >
                          Ancien (Avant Mars 2025)
                        </button>
                        <button 
                          onClick={() => {
                            setBathStandardYear('POST_2025');
                            if (testPlacementZone === 'volume_2' || testPlacementZone === 'volume_1bis') {
                              setTestPlacementZone('lieu_l');
                            }
                            if (guideSelectedVolume === 'volume_2' || guideSelectedVolume === 'volume_1bis') {
                              setGuideSelectedVolume('volume_1');
                            }
                          }}
                          className={`py-1.5 rounded-lg transition-all text-center ${bathStandardYear === 'POST_2025' ? 'bg-sky-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                        >
                          Nouveau (Depuis Mars 2025)
                        </button>
                      </div>
                    </div>

                    {/* Equipment Type Selection */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Type d'Équipement Sanitaire</label>
                      <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-xl text-xs font-bold shadow-inner">
                        <button 
                          onClick={() => {
                            setBathEquipmentType('shower');
                            if (testPlacementZone === 'volume_1bis') {
                              setTestPlacementZone('volume_1');
                            }
                            if (bathStandardYear === 'POST_2025' && testPlacementZone === 'volume_2') {
                              setTestPlacementZone('lieu_l');
                            }
                          }}
                          className={`py-1.5 rounded-lg transition-all text-center ${bathEquipmentType === 'shower' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                        >
                          🚿 Douche
                        </button>
                        <button 
                          onClick={() => setBathEquipmentType('bathtub')}
                          className={`py-1.5 rounded-lg transition-all text-center ${bathEquipmentType === 'bathtub' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                        >
                          🛁 Baignoire
                        </button>
                      </div>
                    </div>

                    {/* Diagnostics Tester Tool */}
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3.5">
                      <div className="text-[10px] font-black text-sky-600 uppercase tracking-widest flex items-center gap-1.5">
                        <Wrench className="w-3.5 h-3.5 shrink-0" />
                        Testeur d'Appareillage Virtuel
                      </div>

                      {/* Select Placement Zone */}
                      <div className="space-y-1">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">1. Choisir l'emplacement (Zone)</span>
                        <select 
                          value={testPlacementZone}
                          onChange={(e) => setTestPlacementZone(e.target.value as any)}
                          className="w-full text-xs font-bold bg-white border border-slate-100 rounded-xl p-2.5 focus:outline-none focus:ring-1 focus:ring-sky-500 shadow-sm"
                        >
                          <option value="volume_0">Volume 0 (Immersion totale)</option>
                          <option value="volume_1">Volume 1 (Projection d'eau • h &le; 2.25m)</option>
                          {bathEquipmentType === 'bathtub' && bathStandardYear === 'PRE_2025' && (
                            <option value="volume_1bis">Volume 1 bis (Sous la baignoire / espace technique)</option>
                          )}
                          {bathStandardYear === 'PRE_2025' && (
                            <option value="volume_2">Volume 2 (Enveloppe protection • d &le; 0.60m)</option>
                          )}
                          <option value="lieu_l">
                            {bathStandardYear === 'POST_2025' ? 'Lieu L (Hors volumes)' : 'Volume 3 (Hors volumes)'}
                          </option>
                        </select>
                      </div>

                      {/* Select Appliance */}
                      <div className="space-y-1">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">2. Choisir l'appareil</span>
                        <select 
                          value={testEquipmentType}
                          onChange={(e) => {
                            const val = e.target.value as any;
                            setTestEquipmentType(val);
                            // Automatically select Volume 1 after choosing the appliance to simplify safety diagnostics
                            setTestPlacementZone('volume_1');
                            if (val === 'waterheater') {
                               setTestConnectionType('direct');
                               setTestIpRating('ipx4');
                            } else if (val === 'socket') {
                               setTestConnectionType('plug');
                               setTestIpRating('ipx4');
                            } else if (val === 'light') {
                               setTestIpRating('ipx4');
                               setTestConnectionType('direct');
                            } else if (val === 'switch') {
                               setTestIpRating('ipx4');
                               setTestConnectionType('direct');
                            } else if (val === 'towel_dryer') {
                               setTestIpRating('ipx4');
                               setTestConnectionType('direct');
                            } else if (val === 'tbts_12v') {
                               setTestIpRating('ipx7');
                               setTestConnectionType('direct');
                            }
                          }}
                          className="w-full text-xs font-bold bg-white border border-slate-100 rounded-xl p-2.5 focus:outline-none focus:ring-1 focus:ring-sky-500 shadow-sm"
                        >
                          <option value="socket"> Prise de courant (230V)</option>
                          <option value="switch"> Interrupteur (230V)</option>
                          <option value="light"> Point lumineux / Plafonnier</option>
                          <option value="waterheater"> Chauffe-eau électrique fixe</option>
                          <option value="towel_dryer"> Sèche-serviette fixe</option>
                          <option value="tbts_12v"> Appareil TBTS ≤ 12V AC (ex: spot LED subaquatique 12V)</option>
                        </select>
                      </div>

                      {/* Select Connection Type */}
                      <div className="space-y-1">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">3. Mode de Raccordement</span>
                        <div className="grid grid-cols-2 gap-2">
                          <button 
                            type="button"
                            onClick={() => setTestConnectionType('plug')}
                            disabled={testEquipmentType === 'waterheater'}
                            className={`p-2 rounded-xl text-[10px] font-semibold border transition-all ${testConnectionType === 'plug' ? 'bg-sky-50 text-sky-700 border-sky-300 shadow-sm' : 'bg-white border-slate-200 text-slate-500 disabled:opacity-40'}`}
                          >
                             Fiche Prise
                          </button>
                          <button 
                            type="button"
                            onClick={() => setTestConnectionType('direct')}
                            className={`p-2 rounded-xl text-[10px] font-semibold border transition-all ${testConnectionType === 'direct' ? 'bg-sky-50 text-sky-700 border-sky-300 shadow-sm' : 'bg-white border-slate-200 text-slate-500'}`}
                          >
                             Câblage Direct
                          </button>
                        </div>
                      </div>

                      {/* Select IP protection code */}
                      <div className="space-y-1">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">4. Indice de Protection (IP)</span>
                        <div className="grid grid-cols-4 gap-1">
                          {[
                            { code: 'ipx0', label: 'IPX0' },
                            { code: 'ipx1', label: 'IPX1' },
                            { code: 'ipx4', label: 'IPX4' },
                            { code: 'ipx7', label: 'IPX7' },
                          ].map((ip) => (
                            <button 
                              key={ip.code}
                              type="button"
                              onClick={() => setTestIpRating(ip.code as any)}
                              className={`p-1.5 rounded-lg text-[9.5px] font-bold border transition-all ${testIpRating === ip.code ? 'bg-slate-800 text-white border-slate-800' : 'bg-white border-slate-200 text-slate-500'}`}
                            >
                              {ip.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Socket-specific protections for Compliance (Volume 2 / Volume 3) */}
                      {testEquipmentType === 'socket' && (() => {
                        const isForbiddenZone = ['volume_0', 'volume_1', 'volume_1bis'].includes(testPlacementZone);
                        const isRequiredZone = testPlacementZone === 'volume_2';
                        const isOutsideZone = testPlacementZone === 'lieu_l';

                        return (
                          <div 
                            className={`space-y-3 p-3.5 rounded-xl border transition-all duration-300 ${
                              isForbiddenZone 
                                ? 'bg-rose-50 border-rose-200 shadow-sm' 
                                : isRequiredZone 
                                  ? 'bg-amber-50/90 border-amber-300 ring-2 ring-amber-100/50 shadow-sm' 
                                  : 'bg-slate-50 border-slate-200'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-1">
                              <span className={`text-[10px] font-black uppercase tracking-wider ${
                                isForbiddenZone ? 'text-rose-800' : isRequiredZone ? 'text-amber-800' : 'text-slate-700'
                              }`}>
                                Protections de Sécurité (Prise 230V)
                              </span>
                              
                              {/* Dynamic Interactive Badges depending on the volume */}
                              {isForbiddenZone && (
                                <span className="px-1.5 py-0.5 bg-rose-100 text-rose-800 text-[8.5px] font-black rounded-md uppercase tracking-wide border border-rose-200">
                                  🚫 Strictement Interdit
                                </span>
                              )}
                              {isRequiredZone && (
                                <span className="px-1.5 py-0.5 bg-amber-100 text-amber-900 text-[8.5px] font-black rounded-md uppercase tracking-wide animate-pulse border border-amber-200">
                                  ⚠️ Protection Requise !
                                </span>
                              )}
                              {isOutsideZone && (
                                <span className="px-1.5 py-0.5 bg-blue-50 text-blue-800 text-[8.5px] font-black rounded-md uppercase tracking-wide border border-blue-100">
                                  ✅ Libre (Sauf DDR 30mA Général)
                                </span>
                              )}
                            </div>

                            {/* Direct educational explanation about the selected Volume */}
                            <div className="text-[10px] leading-relaxed font-semibold text-slate-700">
                              {isForbiddenZone && (
                                <p className="text-rose-800 bg-rose-100/50 p-2 rounded-lg border border-rose-100">
                                  Les prises de courant classiques 230V sont formellement interdites dans l'eau ou l'espace de projection (Même avec un différentiel ou un transformateur).
                                </p>
                              )}
                              {isRequiredZone && (
                                <div className="space-y-2">
                                  <p className="text-amber-900 bg-amber-100/50 p-2 rounded-lg border border-amber-105">
                                    Une prise installée en Volume 2 n'est conforme que si elle est protégée individuellement. Cochez une des options ci-dessous :
                                  </p>
                                  {!(socketHasTransformer || socketHas10mADifferential) && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setSocketHas10mADifferential(true);
                                        setSocketHasTransformer(false);
                                      }}
                                      className="w-full py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-[9.5px] rounded-lg shadow-sm transition-all flex items-center justify-center gap-1.5 border border-amber-700 cursor-pointer"
                                    >
                                      💡 Cliquer pour rendre conforme (DDR 10 mA)
                                    </button>
                                  )}
                                </div>
                              )}
                              {isOutsideZone && (
                                <p className="text-slate-650 bg-slate-100 p-2 rounded-lg border border-slate-205">
                                  Prise classique autorisée. Les protections spéciales ne sont pas nécessaires ici. Le différentiel principal de 30mA de la salle de bain suffit.
                                </p>
                              )}
                            </div>

                            <div className={`space-y-2.5 pt-1.5 ${isForbiddenZone || isOutsideZone ? 'opacity-50' : 'opacity-100'}`}>
                              <label className={`flex items-start gap-2 ${isForbiddenZone || isOutsideZone ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
                                <input 
                                  type="checkbox"
                                  checked={socketHasTransformer}
                                  disabled={isForbiddenZone || isOutsideZone}
                                  onChange={(e) => {
                                    setSocketHasTransformer(e.target.checked);
                                    if (e.target.checked) {
                                      setSocketHas10mADifferential(false);
                                    }
                                  }}
                                  className="mt-0.5 rounded border-slate-300 text-sky-600 focus:ring-sky-500 h-3.5 w-3.5 cursor-pointer disabled:cursor-not-allowed"
                                />
                                <div className="text-[10px] leading-tight text-slate-700 font-medium select-none">
                                  <span className="font-extrabold block text-slate-800">
                                    Transformateur de séparation {isOutsideZone && <span className="text-[8px] font-normal text-slate-500">(Non requis)</span>}
                                  </span>
                                  <span className="text-[8.5px] text-slate-500 block">Isolateur individuel de sécurité ≤ 100W / 100VA</span>
                                </div>
                              </label>

                              <label className={`flex items-start gap-2 border-t border-sky-100/40 pt-2 ${isForbiddenZone || isOutsideZone ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
                                <input 
                                  type="checkbox"
                                  checked={socketHas10mADifferential}
                                  disabled={isForbiddenZone || isOutsideZone}
                                  onChange={(e) => {
                                    setSocketHas10mADifferential(e.target.checked);
                                    if (e.target.checked) {
                                      setSocketHasTransformer(false);
                                    }
                                  }}
                                  className="mt-0.5 rounded border-slate-300 text-sky-600 focus:ring-sky-500 h-3.5 w-3.5 cursor-pointer disabled:cursor-not-allowed"
                                />
                                <div className="text-[10px] leading-tight text-slate-700 font-medium select-none">
                                  <span className="font-extrabold block text-slate-800">
                                    Différentiel Haute Sensibilité 10 mA {isOutsideZone && <span className="text-[8px] font-normal text-slate-500">(Non requis)</span>}
                                  </span>
                                  <span className="text-[8.5px] text-slate-500 block">DDR dédié individuel de maximum 10 mA</span>
                                </div>
                              </label>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-border-theme text-[10px] text-text-muted italic text-left leading-tight">
                    La sécurité en salle de bain exige également des conducteurs de terre (liaison équipotentielle locale de 4 mm²).
                  </div>
                </motion.div>
              )}

              {activeTab === 'influences' && (
                <motion.div 
                  key="influences-panel"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="absolute inset-0 bg-white flex flex-col"
                >
                  <div className="flex justify-between items-center mb-3">
                    <h2 className="text-xl font-bold tracking-tight text-rose-600 uppercase">Influences</h2>
                  </div>

                  <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-4">
                    {(() => {
                      const selectedRow = influenceRows.find(r => r.id === selectedInfluenceRowId) || influenceRows[0];
                      if (!selectedRow) return (
                        <div className="text-xs text-slate-400">Aucun local sélectionné.</div>
                      );
                      const diag = getInfluenceDiagnostics(selectedRow);

                      return (
                        <div className="space-y-4">
                          <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl text-left">
                            <span className="text-[9px] font-black uppercase text-rose-500 tracking-wider block mb-0.5">Local sélectionné</span>
                            <span className="text-sm font-extrabold text-slate-800 block truncate">{selectedRow.local}</span>
                            
                            <div className="grid grid-cols-2 gap-2 mt-3 block">
                              <div className="bg-white p-2 rounded-xl border border-slate-100 text-center">
                                <span className="text-[8px] font-bold text-slate-400 block uppercase">Protection Eau</span>
                                <span className="font-mono font-black text-[11px] text-rose-600 block">{diag.ipWater.split(' ')[0]}</span>
                              </div>
                              <div className="bg-white p-2 rounded-xl border border-slate-100 text-center">
                                <span className="text-[8px] font-bold text-slate-400 block uppercase">Protection Solides</span>
                                <span className="font-mono font-black text-[11px] text-rose-600 block">{diag.ipDust.split(' ')[0]}</span>
                              </div>
                            </div>

                            <div className="mt-3 text-center bg-slate-900 text-white py-1.5 px-2 rounded-xl text-xs font-mono font-black">
                              IP Minimum Requis : <span className="text-emerald-400">IP {diag.ipRequired.replace('IP', '')}</span>
                            </div>
                            <div className="mt-1.5 grid grid-cols-2 gap-1.5">
                              <div className="text-center bg-slate-100 text-slate-700 py-2 px-2 rounded-xl text-[8.5px] font-bold border border-slate-200 flex flex-col justify-center">
                                <span className="text-[7.5px] text-slate-400 block uppercase font-extrabold mb-0.5">Tenue aux Chocs</span>
                                <span className="text-slate-900 font-mono font-black block leading-none">{diag.ikRating}</span>
                              </div>
                              <div className={`text-center py-2 px-2 rounded-xl text-[8.5px] font-bold border flex flex-col justify-center ${diag.corrosionColor}`}>
                                <span className="text-[7.5px] opacity-70 block uppercase font-extrabold mb-0.5">Corrosion (AF)</span>
                                <span className="font-mono font-black block leading-none truncate">{diag.corrosionLabel}</span>
                              </div>
                            </div>
                          </div>

                          {/* Actionable precautions */}
                          {diag.warnings.length > 0 ? (
                            <div className="space-y-2 text-left">
                              <h3 className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Normes & Prescription</h3>
                              <div className="space-y-1.5">
                                {diag.warnings.map((w, idx) => (
                                  <div key={idx} className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl flex gap-1.5 items-start">
                                    <ShieldAlert className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                                    <span className="text-[10px] font-semibold leading-snug text-amber-900">{w}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl flex gap-1.5 items-center text-left">
                              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                              <span className="text-[10px] font-bold text-emerald-900">Aucune contrainte de risque critique identifiée. IP standard admise.</span>
                            </div>
                          )}

                          {/* Quick Preset adder inside controls */}
                          <div className="pt-3 border-t border-slate-100 space-y-3 text-left">
                            <h3 className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Créer un Local</h3>
                            <div className="flex gap-1.5">
                              <input 
                                type="text"
                                placeholder="Nom (ex: Cave, Grenier...)"
                                value={newLocalName}
                                onChange={(e) => setNewLocalName(e.target.value)}
                                className="flex-1 text-xs border border-slate-200 py-1.5 px-3 rounded-xl outline-none focus:border-rose-450"
                              />
                              <button 
                                onClick={() => {
                                  if (!newLocalName.trim()) return;
                                  const newRow: InfluenceRow = {
                                    id: Date.now().toString(),
                                    local: newLocalName.trim(),
                                    AA: 'AA5', AD: 'AD1', AE: 'AE1', AF: 'AF1', AG: 'AG1', AH: 'AH1', AK: 'AK1', AL: 'AL1',
                                    BA: 'BA1', BB: 'BB1', BC: 'BC1', BD: 'BD1', BE: 'BE1', CA: 'CA1', CB: 'CB1'
                                  };
                                  setInfluenceRows([...influenceRows, newRow]);
                                  setSelectedInfluenceRowId(newRow.id);
                                  setNewLocalName('');
                                }}
                                className="bg-rose-500 hover:bg-rose-600 text-white px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-colors"
                              >
                               +
                              </button>
                            </div>
                            
                            <div className="text-[8.5px] font-black text-slate-400 uppercase tracking-widest">Modèles Rapides</div>
                            <div className="flex flex-wrap gap-1 max-h-[140px] overflow-y-auto p-1 bg-slate-50 rounded-xl border border-slate-100 custom-scrollbar">
                              {[
                                { name: 'Bureaux', AD: 'AD1', AE: 'AE1', BC: 'BC1' },
                                { name: 'Restaurants', AD: 'AD2', AE: 'AE2', BD: 'BD3' },
                                { name: 'Hôtels', AD: 'AD1', AE: 'AE1', BD: 'BD2' },
                                { name: 'Salons de coiffure', AD: 'AD3', AE: 'AE1', BC: 'BC2' },
                                { name: 'Cabinets médicaux', BA: 'BA3', BB: 'BB2', BC: 'BC2' },
                                { name: "Ateliers d'artisans", AD: 'AD2', AE: 'AE3', AG: 'AG2', BE: 'BE2' },
                                { name: 'Écoles', BA: 'BA2', BD: 'BD3' },
                                { name: 'Hôpitaux', BA: 'BA3', BB: 'BB2', BD: 'BD4' },
                                { name: 'Salles de sport', AD: 'AD2', AG: 'AG2', BD: 'BD3' },
                                { name: 'Usines', AD: 'AD3', AE: 'AE4', AG: 'AG3', AH: 'AH2', BA: 'BA4' },
                                { name: 'Entrepôts', AE: 'AE3', AG: 'AG2', BE: 'BE2' },
                                { name: 'Chantiers', AA: 'AA3', AD: 'AD4', AE: 'AE4', AG: 'AG3', BB: 'BB2', BC: 'BC3' },
                                { name: 'Locaux à compteurs', AE: 'AE2', BC: 'BC2', BA: 'BA4' },
                                { name: 'Chaufferies', AA: 'AA6', AD: 'AD1', AE: 'AE2', BC: 'BC2' },
                                { name: "Salles des machines d'ascenseurs", AE: 'AE2', AH: 'AH2', BC: 'BC3', BA: 'BA5' },
                                { name: 'Tôlier', AD: 'AD2', AE: 'AE4', AG: 'AG3', AH: 'AH2', BE: 'BE2' },
                                { name: 'Crèche', BA: 'BA2', BD: 'BD3' },
                              ].map((p) => (
                                <button
                                  key={p.name}
                                  onClick={() => {
                                    const newRow: InfluenceRow = {
                                      id: Date.now().toString() + '_' + Math.random().toString(36).substr(2, 5),
                                      local: p.name,
                                      AA: (p as any).AA || 'AA5',
                                      AD: p.AD || 'AD1',
                                      AE: p.AE || 'AE1',
                                      AF: 'AF1',
                                      AG: (p as any).AG || 'AG1',
                                      AH: (p as any).AH || 'AH1',
                                      AK: (p as any).AK || 'AK1',
                                      AL: (p as any).AL || 'AL1',
                                      BA: p.BA || 'BA1',
                                      BB: (p as any).BB || 'BB1',
                                      BC: p.BC || 'BC1',
                                      BD: p.BD || 'BD1',
                                      BE: (p as any).BE || 'BE1',
                                      CA: (p as any).CA || 'CA1',
                                      CB: 'CB1'
                                    };
                                    setInfluenceRows([...influenceRows, newRow]);
                                    setSelectedInfluenceRowId(newRow.id);
                                  }}
                                  className="text-[8px] bg-white hover:bg-slate-150 text-slate-700 border border-slate-200 shadow-sm px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer hover:border-rose-300"
                                >
                                  + {p.name}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </motion.div>
              )}

              {activeTab === 'smart-meter' && (
                <SmartMeterControls
                  state={smartMeterState}
                  onChange={setSmartMeterState}
                  onOpenExam={() => setActiveTab('meter-exam')}
                />
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Right Panel: Results */}
        <div className={`bg-[#FAFBFC] ${activeTab === 'smart-meter' ? 'p-2 md:p-3 md:overflow-hidden overflow-y-auto no-scrollbar' : 'p-6 md:px-10 md:py-8 overflow-y-auto'} flex flex-col items-stretch justify-start text-left relative min-h-[400px] md:min-h-0`}>
          <AnimatePresence mode="wait">
            {activeTab === 'billing' ? (
               <motion.div 
                key="billing-view"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="w-full h-full flex flex-col items-center justify-center pt-8"
              >
                <div className="text-[12px] font-semibold uppercase tracking-[0.2em] text-text-muted mb-12 text-center">
                  Total Facturé
                </div>

                <div className="relative w-64 h-64 flex items-center justify-center mb-8">
                  <div className="absolute inset-0 bg-sky-500/10 rounded-full animate-pulse" />
                  <div className="relative z-10 flex flex-col items-center text-center">
                    <Euro className="w-16 h-16 text-sky-500 mb-4" />
                    <div className="text-5xl font-black text-sky-600 tabular-nums">
                      <AnimatedCounter value={billingKWh * billingPrice} decimals={2} />
                      <span className="text-2xl ml-1">€</span>
                    </div>
                    <div className="text-[10px] text-text-muted font-bold uppercase tracking-widest mt-2">Montant journalier</div>
                  </div>
                </div>

                <div className="w-full max-w-sm space-y-4">
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-white p-3 rounded-2xl border border-border-theme shadow-sm text-center">
                      <div className="text-[9px] font-black text-text-muted uppercase mb-1">Journalier</div>
                      <div className="text-sm font-bold text-sky-600">
                        <AnimatedCounter value={billingKWh * billingPrice} decimals={2} suffix=" €" />
                      </div>
                      <div className="text-[8px] text-text-muted uppercase font-bold mt-1">(1 jour)</div>
                    </div>
                    <div className="bg-white p-3 rounded-2xl border border-border-theme shadow-sm text-center">
                      <div className="text-[9px] font-black text-text-muted uppercase mb-1">Mensuel</div>
                      <div className="text-sm font-bold text-sky-600">
                        <AnimatedCounter value={billingKWh * billingPrice * 30} decimals={2} suffix=" €" />
                      </div>
                      <div className="text-[8px] text-text-muted uppercase font-bold mt-1">(30 jours)</div>
                    </div>
                    <div className="bg-white p-3 rounded-2xl border border-border-theme shadow-sm text-center">
                      <div className="text-[9px] font-black text-text-muted uppercase mb-1">Annuel</div>
                      <div className="text-sm font-bold text-sky-600">
                        <AnimatedCounter value={billingKWh * billingPrice * 365} decimals={2} suffix=" €" />
                      </div>
                      <div className="text-[8px] text-text-muted uppercase font-bold mt-1">(365 jours)</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                     <div className="bg-bg-theme/50 p-3 rounded-xl border border-border-theme/50 text-center">
                        <div className="text-[9px] font-black text-text-muted uppercase mb-0.5">Consommation</div>
                        <div className="text-sm font-bold text-text-main">
                          <AnimatedCounter value={billingKWh} decimals={0} /> <span className="text-[10px] text-text-muted">kWh/j</span>
                        </div>
                     </div>
                     <div className="bg-bg-theme/50 p-3 rounded-xl border border-border-theme/50 text-center">
                        <div className="text-[9px] font-black text-text-muted uppercase mb-0.5">Taux</div>
                        <div className="text-sm font-bold text-text-main">
                          <AnimatedCounter value={billingPrice} decimals={2} /> <span className="text-[10px] text-text-muted">€/kWh</span>
                        </div>
                     </div>
                  </div>
                </div>

                <div className="mt-12 text-[10px] font-bold text-text-muted/40 uppercase tracking-widest">
                  Calcul : Énergie (kWh) × Tarif (€/kWh)
                </div>
              </motion.div>
            ) : activeTab === 'lighting' ? (
              <motion.div 
                key="lighting-view"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="w-full h-full flex flex-col items-center py-8"
              >
                <div className="text-[12px] font-semibold uppercase tracking-[0.2em] text-text-muted mb-8 text-center">
                  Démonstration Flux & Éclairement
                </div>

                <div className="w-full max-w-5xl px-4 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                  
                  {/* Left Column: Lamp Illustration */}
                  <div className="lg:col-span-7 flex justify-center">
                    <div className="relative w-full max-w-md aspect-square bg-slate-900 rounded-[3rem] overflow-hidden shadow-2xl border-4 border-white">
                      <svg viewBox="0 0 400 400" className="w-full h-full">
                        <defs>
                          <radialGradient id="beamGradient" cx="50%" cy="0%" r="100%" fx="50%" fy="0%">
                            <stop offset="0%" stopColor={getKelvinColor(lightTemp)} stopOpacity="0.8" />
                            <stop offset="100%" stopColor={getKelvinColor(lightTemp)} stopOpacity="0.1" />
                          </radialGradient>
                          <filter id="glow">
                            <feGaussianBlur stdDeviation="15" result="coloredBlur"/>
                            <feMerge>
                              <feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/>
                            </feMerge>
                          </filter>
                          <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="0" refY="3.5" orient="auto">
                            <polygon points="0 0, 10 3.5, 0 7" fill="#94a3b8" />
                          </marker>
                        </defs>

                        {/* Beam Cone */}
                        {(() => {
                          const dScale = lightDistance * 32;
                          const angleRad = (lightAngle * Math.PI) / 180;
                          const beamWidth = 2 * dScale * Math.tan(angleRad / 2);
                          const startX = 200;
                          const startY = 100;
                          
                          return (
                            <motion.path
                              d={`M ${startX} ${startY} L ${startX - beamWidth/2} ${startY + dScale} L ${startX + beamWidth/2} ${startY + dScale} Z`}
                              fill="url(#beamGradient)"
                              animate={{ 
                                d: `M ${startX} ${startY} L ${startX - beamWidth/2} ${startY + dScale} L ${startX + beamWidth/2} ${startY + dScale} Z`,
                                opacity: Math.min(1, lightingResults.lux / 1000 + 0.1)
                              }}
                              transition={{ type: 'spring', stiffness: 50, damping: 20 }}
                            />
                          );
                        })()}

                        {/* Ground Surface */}
                        <motion.g
                          animate={{ y: 100 + lightDistance * 32 }}
                          transition={{ type: 'spring', stiffness: 50, damping: 20 }}
                        >
                          <line x1="50" y1="0" x2="350" y2="0" stroke="white" strokeWidth="2" strokeDasharray="4 4" opacity="0.3" />
                          
                          {(() => {
                            const angleRad = (lightAngle * Math.PI) / 180;
                            const beamWidth = 2 * (lightDistance * 32) * Math.tan(angleRad / 2);
                            return (
                              <motion.ellipse
                                cx="200" cy="0"
                                rx={beamWidth / 2} ry={beamWidth / 6}
                                fill={getKelvinColor(lightTemp)}
                                animate={{ 
                                  rx: beamWidth / 2, 
                                  ry: beamWidth / 6,
                                  opacity: Math.min(1, lightingResults.lux / 500 + 0.2)
                                }}
                                filter="url(#glow)"
                              />
                            );
                          })()}
                          <motion.circle cx="340" cy="0" r="4" fill="#94a3b8" />
                          <motion.line x1="340" y1="0" x2="340" y2="-20" stroke="#94a3b8" strokeWidth="2" />
                          
                          {/* Area Label in SVG */}
                          <motion.text
                            x="200" y="35"
                            textAnchor="middle"
                            fill="white"
                            fontSize="14"
                            fontWeight="900"
                            animate={{ opacity: 1 }}
                            className="drop-shadow-lg"
                          >
                            {lightingResults.area} m²
                          </motion.text>

                          {/* Radius visual indicator */}
                          {(() => {
                            const angleRad = (lightAngle * Math.PI) / 180;
                            const beamWidth = 2 * (lightDistance * 32) * Math.tan(angleRad / 2);
                            return (
                              <g>
                                <line x1="200" y1="0" x2={200 + (beamWidth/2)} y2="0" stroke="white" strokeWidth="1" strokeDasharray="2 2" />
                                <text x={200 + (beamWidth/4)} y="-5" fill="white" fontSize="8" fontWeight="bold" textAnchor="middle">
                                  r={lightingResults.radius}m
                                </text>
                              </g>
                            );
                          })()}
                        </motion.g>

                        {/* Suspension Cable */}
                        <line x1="200" y1="0" x2="200" y2="45" stroke="#475569" strokeWidth="3" />

                        {/* Lamp Body (Rendered on top) */}
                        <g transform="translate(200, 100)">
                          {/* Socket / Base */}
                          <rect x="-18" y="-65" width="36" height="20" fill="#94a3b8" rx="2" />
                          <rect x="-15" y="-45" width="30" height="15" fill="#64748b" rx="1" />
                          
                          {/* Bulb Shape Path */}
                          <motion.path 
                            d="M -15 -30 
                               C -40 -30, -50 -10, -50 20 
                               C -50 55, -25 75, 0 75 
                               C 25 75, 50 55, 50 20 
                               C 50 -10, 40 -30, 15 -30 Z" 
                            fill={getKelvinColor(lightTemp)}
                            animate={{ 
                              fill: getKelvinColor(lightTemp),
                              filter: lightingResults.lux > 20 ? `drop-shadow(0 0 50px ${getKelvinColor(lightTemp)})` : 'none'
                            }}
                            transform="scale(0.8) translate(0, -35)"
                          />
                          
                          {/* Internal filament detail for realism */}
                          <motion.path 
                            d="M -10 0 Q 0 -15, 10 0 T 20 0" 
                            fill="none" 
                            stroke="white" 
                            strokeWidth="2" 
                            opacity="0.3"
                            transform="scale(0.8) translate(-5, -5)"
                          />
                        </g>

                        {/* Distance Dimension Line */}
                        <line x1="50" y1="100" x2="50" y2={100 + lightDistance * 32} stroke="#94a3b8" strokeWidth="1" markerEnd="url(#arrowhead)" />
                        <text x="35" y={100 + (lightDistance * 16)} fill="#94a3b8" fontSize="10" transform={`rotate(-90, 35, ${100 + lightDistance * 16})`} textAnchor="middle">
                          {lightDistance}m
                        </text>
                      </svg>
                    </div>
                  </div>

                  {/* Right Column: Measurements & Context */}
                  <div className="lg:col-span-5 space-y-4">
                    {/* Grid of 6 Compact Cards */}
                    <div className="grid grid-cols-2 gap-3">
                      {/* 1. LUX ACTUEL */}
                      <div className="bg-white p-3 rounded-[2rem] border-2 border-blue-100 shadow-sm relative overflow-hidden flex flex-col items-center justify-center text-center h-28">
                        <div className="absolute top-0 left-0 w-full h-1 bg-blue-500" />
                        <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Éclairement</div>
                        <div className="text-2xl font-black text-blue-600 tracking-tighter tabular-nums leading-none">
                          <AnimatedCounter value={lightingResults.lux} decimals={0} /> <span className="text-[10px] font-bold text-blue-300 italic uppercase">Lux</span>
                        </div>
                        <div className="text-[8px] text-blue-400 font-bold mt-1 uppercase">Actuel</div>
                      </div>

                      {/* 2. OBJECTIF */}
                      <div className="bg-white p-3 rounded-[2rem] border-2 border-rose-100 shadow-sm relative overflow-hidden flex flex-col items-center justify-center text-center h-28">
                        <div className="absolute top-0 left-0 w-full h-1 bg-rose-500" />
                        <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Objectif</div>
                        <div className="text-2xl font-black text-rose-600 tracking-tighter tabular-nums leading-none">
                          <AnimatedCounter value={targetLux} decimals={0} /> <span className="text-[10px] font-bold text-rose-300 italic uppercase">Lux</span>
                        </div>
                        <div className="text-[8px] text-rose-400 font-bold mt-1 uppercase">Souhaité</div>
                      </div>

                      {/* 3. INTENSITÉ */}
                      <div className="bg-white p-3 rounded-[2rem] border-2 border-orange-100 shadow-sm relative overflow-hidden flex flex-col items-center justify-center text-center h-28">
                        <div className="absolute top-0 left-0 w-full h-1 bg-orange-500" />
                        <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Intensité</div>
                        <div className="text-2xl font-black text-orange-600 tracking-tighter tabular-nums leading-none">
                          <AnimatedCounter value={lightingResults.candela} decimals={1} /> <span className="text-[10px] font-bold text-orange-300 italic uppercase">cd</span>
                        </div>
                        <div className="text-[8px] text-orange-400 font-bold mt-1 uppercase">Source</div>
                      </div>

                      {/* 4. SURFACE */}
                      <div className="bg-white p-3 rounded-[2rem] border-2 border-emerald-100 shadow-sm relative overflow-hidden flex flex-col items-center justify-center text-center h-28">
                        <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500" />
                        <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Superficie</div>
                        <div className="text-2xl font-black text-emerald-600 tracking-tighter tabular-nums leading-none">
                          <AnimatedCounter value={lightingResults.area} decimals={2} /> <span className="text-[10px] font-bold text-emerald-200 italic uppercase">m²</span>
                        </div>
                        <div className="text-[8px] text-emerald-400 font-bold mt-1 uppercase">Rayon: {lightingResults.radius}m</div>
                      </div>

                      {/* 5. RECOMMANDATION LAMPES */}
                      <div className="bg-white p-3 rounded-[2rem] border-2 border-indigo-100 shadow-sm relative overflow-hidden flex flex-col items-center justify-center text-center h-28">
                        <div className="absolute top-0 left-0 w-full h-1 bg-indigo-500" />
                        <div className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-1">Besoin</div>
                        <div className="text-2xl font-black text-indigo-600 tracking-tighter tabular-nums leading-none">
                          <AnimatedCounter value={lightingResults.lampsNeeded} decimals={0} /> <span className="text-[10px] font-bold text-indigo-300 italic uppercase">Lampe{lightingResults.lampsNeeded > 1 ? 's' : ''}</span>
                        </div>
                        <div className="text-[8px] text-indigo-400 font-bold mt-1 uppercase">Flux Total: {lightingResults.totalLumensNeeded} lm</div>
                      </div>

                      {/* 6. TEMPERATURE */}
                      <div className="bg-white p-3 rounded-[2rem] border-2 border-slate-100 shadow-sm relative overflow-hidden flex flex-col items-center justify-center text-center h-28">
                        <div className="absolute top-0 left-0 w-full h-1 bg-slate-400" />
                        <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Couleur</div>
                        <div className="text-2xl font-black text-slate-700 tracking-tighter tabular-nums leading-none">
                          <AnimatedCounter value={lightTemp} decimals={0} /> <span className="text-[10px] font-bold text-slate-300 italic uppercase">K</span>
                        </div>
                        <div className="text-[8px] text-slate-400 font-bold mt-1 uppercase tracking-tighter">
                          {lightTemp <= 3000 ? 'Chaud' : lightTemp <= 5000 ? 'Neutre' : 'Froid'}
                        </div>
                      </div>
                    </div>

                    <div className="bg-slate-50 p-6 rounded-[2.5rem] space-y-4 border border-slate-100/50">
                      <div className={`p-5 rounded-3xl border text-xs font-bold leading-relaxed italic text-center ${
                        lightingResults.lux < 100 
                          ? 'bg-blue-100/50 border-blue-200 text-blue-700' 
                          : lightingResults.lux > 500 
                            ? 'bg-orange-100/50 border-orange-200 text-orange-700' 
                            : 'bg-green-100/50 border-green-200 text-green-700'
                      }`}>
                        {lightingResults.lux < 100 && "Éclairage faible : Idéal pour les lieux de passage ou ambiance tamisée."}
                        {lightingResults.lux >= 100 && lightingResults.lux <= 150 && "Confort Ambiance : Idéal pour Chambre ou Salon."}
                        {lightingResults.lux > 150 && lightingResults.lux < 200 && "Éclairage intermédiaire : Entre ambiance et zone de travail."}
                        {lightingResults.lux >= 200 && lightingResults.lux <= 400 && "Zone Active : Idéal pour Cuisine, Bureau ou Salle de bain."}
                        {lightingResults.lux > 400 && lightingResults.lux <= 500 && "Zone Travail : Optimal pour Bureau ou Cuisine (plan de travail)."}
                        {lightingResults.lux > 500 && "Éclairage Intense : Recommandé pour les travaux de haute précision."}
                      </div>

                      <div className="pt-2 text-[9px] text-slate-400 text-center italic uppercase font-bold tracking-widest opacity-60">
                        Lux = cd / d²  •  cd = lm / Ω
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : activeTab === 'notes' ? (
              <motion.div 
                key="notes-view"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="w-full h-full flex flex-col"
              >
                <div className="flex items-center gap-3 mb-10 self-start">
                  <div className="w-8 h-0.5 bg-blue-600 rounded-full" />
                  <div className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-400">
                    Fiche Technique de Dépannage
                  </div>
                </div>

                {(() => {
                  const fault = FAULTS.find(f => f.id === selectedFaultId)!;
                  const Icon = fault.icon;
                  return (
                    <div className="flex-1 w-full overflow-y-auto pr-4 custom-scrollbar space-y-8 text-left">
                      {/* Header Section */}
                      <header className="flex flex-col gap-4">
                        <div className="flex items-center gap-4">
                          <div className={`p-3 rounded-2xl border-2 ${fault.iconColor} bg-white shadow-sm`}>
                            <Icon className="w-8 h-8" />
                          </div>
                          <div>
                            <h3 className="text-2xl font-black text-slate-900 leading-none mb-2">{fault.type}</h3>
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-slate-100 text-slate-500 border border-slate-200">Réf: {fault.id}</span>
                              <span className="w-1 h-1 rounded-full bg-slate-300" />
                              <span className="text-[10px] font-bold text-slate-400 italic">Diagnostic Expert</span>
                            </div>
                          </div>
                        </div>
                      </header>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                        {/* Observation: Symptoms */}
                        <section className="space-y-4">
                          <div className="flex items-center gap-2 text-blue-600">
                            <ClipboardList className="w-4 h-4" />
                            <h4 className="text-[10px] font-black uppercase tracking-[0.15em]">Observations & Symptômes</h4>
                          </div>
                          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-3">
                            {(fault.symptomes as string[]).map((s, idx) => (
                              <div key={idx} className="flex items-start gap-3 group">
                                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0 group-hover:scale-125 transition-transform" />
                                <p className="text-[13px] text-slate-600 font-medium leading-relaxed">{s}</p>
                              </div>
                            ))}
                          </div>
                        </section>

                        <div className="space-y-8">
                          {/* Causes & Risks */}
                          <section className="space-y-4">
                            <div className="flex items-center gap-2 text-amber-600">
                              <AlertTriangle className="w-4 h-4" />
                              <h4 className="text-[10px] font-black uppercase tracking-[0.15em]">Analyse des Causes</h4>
                            </div>
                            <div className="bg-amber-50/50 p-5 rounded-3xl border border-amber-100/50">
                              <p className="text-[13px] leading-relaxed text-slate-700 font-medium mb-4">
                                {fault.causes}
                              </p>
                              <div className="pt-4 border-t border-amber-200/50">
                                <span className="block text-[9px] font-black text-red-500 uppercase mb-2">Risque Critique</span>
                                <p className="text-[12px] font-bold text-red-700 leading-relaxed italic">{fault.risques}</p>
                              </div>
                            </div>
                          </section>
                        </div>
                      </div>

                      {/* Diagnostic: Measurement */}
                      <section className="bg-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-10">
                          <Activity className="w-32 h-32" />
                        </div>
                        <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-8">
                          <div className="space-y-3">
                            <div className="flex items-center gap-2 text-slate-400">
                              <Wrench className="w-4 h-4" />
                              <span className="text-[9px] font-black uppercase tracking-widest">Outil de Mesure</span>
                            </div>
                            <p className="text-sm font-bold text-white">{fault.appareil}</p>
                          </div>
                          <div className="space-y-3">
                            <div className="flex items-center gap-2 text-slate-400">
                              <Gauge className="w-4 h-4" />
                              <span className="text-[9px] font-black uppercase tracking-widest">Valeur Théorique</span>
                            </div>
                            <p className="text-sm font-mono font-bold text-blue-400">{fault.valeurs}</p>
                          </div>
                          <div className="space-y-3 border-l md:border-l-0 md:pl-0 border-white/10 pl-6">
                            <div className="flex items-center gap-2 text-red-400">
                              <Activity className="w-4 h-4" />
                              <span className="text-[9px] font-black uppercase tracking-widest text-red-400">Signe de Défaut</span>
                            </div>
                            <p className="text-sm font-bold text-red-300 italic">{fault.valeursMesurees}</p>
                          </div>
                        </div>
                      </section>

                      {/* Resolution: Solutions */}
                      <section className="space-y-4">
                        <div className="flex items-center gap-2 text-emerald-600">
                          <CheckCircle2 className="w-4 h-4" />
                          <h4 className="text-[10px] font-black uppercase tracking-[0.15em]">Protocole d'Intervention</h4>
                        </div>
                        <div className="bg-emerald-50 p-6 rounded-3xl border border-emerald-100 flex gap-4 items-start shadow-sm">
                          <div className="w-10 h-10 rounded-2xl bg-white border border-emerald-200 flex items-center justify-center shrink-0">
                            <Lightbulb className="w-5 h-5 text-emerald-600" />
                          </div>
                          <p className="text-sm leading-relaxed font-bold text-emerald-900 pt-1">
                            {fault.solutions}
                          </p>
                        </div>
                      </section>
                    </div>
                  );
                })()}
              </motion.div>
            ) : activeTab === 'expert' ? (
              <motion.div 
                key="expert-view"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="w-full flex flex-col items-center pt-8 overflow-y-auto max-h-[calc(100vh-140px)] custom-scrollbar px-2 sm:px-4 pb-14"
              >
                <div className="text-[12px] font-semibold uppercase tracking-[0.2em] text-text-muted mb-4 text-center">
                  Résultats Circuit (Parallèle)
                </div>
                
                <div className="bg-violet-50 px-3 py-1.5 rounded-full border border-violet-100 flex items-center gap-2 mb-8">
                  <span className="text-[9px] font-black uppercase tracking-widest text-violet-600">Loi d'ohm pour {expertQuantity} récepteur{expertQuantity > 1 ? 's' : ''} en //</span>
                </div>

                <div className="relative w-64 h-64 flex items-center justify-center mb-8">
                  <div className="absolute inset-0 bg-violet-500/5 rounded-full animate-pulse" />
                  <div className="relative z-10 flex flex-col items-center text-center">
                    <div className="text-4xl font-black text-text-main tabular-nums">
                      <AnimatedCounter value={expertResults.current} decimals={2} suffix=" A" />
                    </div>
                    <div className="text-sm text-text-muted font-bold uppercase tracking-widest mt-1">Intensité Totale</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-8 w-full max-w-sm mb-8">
                  <div className="text-center p-4 bg-bg-theme rounded-2xl border border-border-theme">
                    <div className="text-[10px] font-bold text-text-muted uppercase mb-1">Puissance Totale</div>
                    <div className="text-xl font-bold text-text-main">
                      <AnimatedCounter value={expertResults.power / 1000} decimals={2} suffix=" kW" />
                    </div>
                  </div>
                  <div className="text-center p-4 bg-bg-theme rounded-2xl border border-border-theme">
                    <div className="text-[10px] font-bold text-text-muted uppercase mb-1">Résistance Unitaire</div>
                    <div className="text-xl font-bold text-text-main">
                      <AnimatedCounter value={expertResults.unitResistance} decimals={1} suffix=" Ω" />
                    </div>
                  </div>
                </div>

                <div className="w-full max-w-md space-y-4">
                  <div className="p-3 bg-white rounded-xl border border-border-theme text-center">
                    <span className="text-[10px] font-bold text-text-muted uppercase mb-1 block">Résistance Équivalente (Total)</span>
                    <span className="text-sm font-bold text-violet-600 font-mono">
                      <AnimatedCounter value={expertResults.resistance} decimals={2} suffix=" Ω" />
                    </span>
                  </div>

                  {expertResults.recommendedBreaker && (
                    <div className="p-4 bg-emerald-50 rounded-2xl border-2 border-emerald-300 text-center shadow-sm">
                      <div className="flex items-center justify-center gap-2 mb-1.5">
                        <ShieldAlert className="w-4 h-4 text-emerald-600" />
                        <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">Protection &amp; Câble Recommandés</span>
                      </div>
                      <div className="text-2xl font-black text-emerald-950">
                        {typeof expertResults.recommendedBreaker === 'number' 
                          ? `Disjoncteur ${expertResults.recommendedBreaker}A` 
                          : expertResults.recommendedBreaker}
                      </div>
                      <p className="text-[9.5px] text-emerald-700 font-medium mt-1">
                        Pour un courant total appelé de <strong className="font-bold text-emerald-900">{expertResults.current} A</strong>
                      </p>

                      {/* Section du câble requis */}
                      <div className="mt-3 pt-3 border-t border-emerald-200/90 flex flex-col items-center gap-1.5">
                        <span className="text-[11px] font-bold text-emerald-900 uppercase tracking-wider">Câble cuivre obligatoire :</span>
                        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-emerald-600 text-white font-mono font-black text-base shadow-sm">
                          <Zap className="w-4 h-4 text-amber-300 fill-amber-300 animate-pulse" />
                          <span>{expertResults.recommendedCable}</span>
                        </div>
                        <span className="text-[10px] text-emerald-800 font-mono font-semibold">
                          {expertResults.cableDetail}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Tableau des Sections de Câbles Normalisées (RGIE / NF C 15-100) */}
                  <div className="p-4 sm:p-5 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-3 text-left">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600 border border-blue-200">
                          <Wrench className="w-3.5 h-3.5" />
                        </div>
                        <h4 className="text-xs font-black text-slate-800 tracking-tight">Règles des Sections de Câble Cuivre</h4>
                      </div>
                      <span className="text-[9px] font-mono font-bold text-slate-500 uppercase bg-slate-100 px-2 py-0.5 rounded-md">
                        Normes RGIE
                      </span>
                    </div>

                    <div className="space-y-1.5 text-xs font-mono">
                      {[
                        { maxA: 16, section: '1.5 mm²', label: 'Max 16 A ➔ 1.5 mm²', usage: 'Éclairage / Circuits légers' },
                        { maxA: 20, section: '2.5 mm²', label: 'Max 20 A ➔ 2.5 mm²', usage: 'Prises standards / Circuits mixtes' },
                        { maxA: 32, section: '4 mm²', label: 'Max 32 A ➔ 4 mm²', usage: 'Lignes spécifiques (32A max)' },
                        { maxA: 40, section: '6 mm²', label: 'Max 40 A ➔ 6 mm²', usage: 'Plaque cuisson / Borne 7.4 kW' },
                        { maxA: 63, section: '10 mm² min', label: 'Max 63 A ➔ 10 mm² min', usage: 'Tableau divisionnaire / Colonne' },
                      ].map((tier) => {
                        const effectiveVal = typeof expertResults.recommendedBreaker === 'number' 
                          ? expertResults.recommendedBreaker 
                          : expertResults.current;
                        
                        const isMatch = (tier.maxA === 16 && effectiveVal <= 16) ||
                          (tier.maxA === 20 && effectiveVal > 16 && effectiveVal <= 20) ||
                          (tier.maxA === 32 && effectiveVal > 20 && effectiveVal <= 32) ||
                          (tier.maxA === 40 && effectiveVal > 32 && effectiveVal <= 40) ||
                          (tier.maxA === 63 && effectiveVal > 40 && effectiveVal <= 63);

                        return (
                          <div
                            key={tier.maxA}
                            className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                              isMatch
                                ? 'bg-emerald-50/90 border-emerald-400 text-emerald-950 font-bold shadow-xs ring-1 ring-emerald-500/20'
                                : 'bg-slate-50/70 border-slate-200/80 text-slate-600 hover:bg-slate-100/70'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              {isMatch ? (
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              ) : (
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-300 ml-1 mr-1" />
                              )}
                              <span className="font-bold text-[11px]">{tier.label}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-slate-400 hidden sm:inline">{tier.usage}</span>
                              <span className={`px-2 py-0.5 rounded-lg text-[10.5px] font-black ${
                                isMatch ? 'bg-emerald-600 text-white' : 'bg-white border border-slate-200 text-slate-700'
                              }`}>
                                {tier.section}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <p className="text-[10px] text-slate-400 italic pt-1 leading-relaxed">
                      * Les conducteurs doivent être en cuivre pur. La section doit également respecter la chute de tension maximale réglementaire (ΔU ≤ 3% pour l'éclairage et ≤ 5% pour les autres usages).
                    </p>
                  </div>
                </div>
              </motion.div>
            ) : activeTab === 'consumption' ? (
              <motion.div 
                key="consumption-view"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="w-full flex flex-col items-center"
              >
                <div className="text-[12px] font-semibold uppercase tracking-[0.2em] text-text-muted mb-12">
                  Analyse de Consommation
                </div>

                <div className="relative w-64 h-64 flex items-center justify-center">
                  <div className="absolute inset-0 bg-orange-500/5 rounded-full animate-pulse" />
                  <div className="relative z-10 flex flex-col items-center">
                    <Zap className="w-16 h-16 text-orange-500 mb-4" />
                    <div className="text-4xl font-bold text-text-main">
                      <AnimatedCounter value={consumptionTotals.dailyKWh} decimals={2} />
                    </div>
                    <div className="text-sm text-text-muted font-bold uppercase tracking-widest">kWh / Jour</div>
                  </div>
                </div>

                <div className="mt-12 grid grid-cols-3 gap-4 w-full max-w-lg px-4">
                  <div className="text-center p-4 bg-white rounded-2xl border border-border-theme shadow-sm">
                    <div className="text-[9px] font-black text-text-muted uppercase mb-1">Journalier</div>
                    <div className="text-xl font-black text-orange-600">
                      <AnimatedCounter value={consumptionTotals.dailyCost} decimals={2} suffix=" €" />
                    </div>
                    <div className="text-[7px] text-text-muted uppercase font-bold mt-1 tracking-tighter">Base 24h</div>
                  </div>
                  <div className="text-center p-4 bg-white rounded-2xl border border-border-theme shadow-sm">
                    <div className="text-[9px] font-black text-text-muted uppercase mb-1">Mensuel</div>
                    <div className="text-xl font-black text-orange-600">
                      <AnimatedCounter value={consumptionTotals.monthlyCost} decimals={2} suffix=" €" />
                    </div>
                    <div className="text-[7px] text-text-muted uppercase font-bold mt-1 tracking-tighter">Base 30j</div>
                  </div>
                  <div className="text-center p-4 bg-white rounded-2xl border border-border-theme shadow-sm">
                    <div className="text-[9px] font-black text-text-muted uppercase mb-1">Annuel</div>
                    <div className="text-xl font-black text-orange-600">
                      <AnimatedCounter value={consumptionTotals.yearlyCost} decimals={2} suffix=" €" />
                    </div>
                    <div className="text-[7px] text-text-muted uppercase font-bold mt-1 tracking-tighter">Base 365j</div>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-border-theme w-full max-w-xs text-[10px] text-text-muted italic leading-relaxed text-center">
                  Équation appliquée :<br />
                  Coût = (Σ(W × h/j) / 1000) × Prix du kWh
                </div>
              </motion.div>
            ) : activeTab === 'threshold' ? (
              <motion.div 
                key="resistance-view"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="w-full"
              >
                <div className="text-[12px] font-semibold uppercase tracking-[0.2em] text-text-muted mb-6">
                  Résistance Critique (Min)
                </div>
                
                <div className="mb-2">
                  <div className="text-[112px] font-black text-text-main leading-none tabular-nums tracking-tighter">
                    <AnimatedCounter value={minResistance} decimals={0} />
                  </div>
                </div>
                <div className="text-sm font-black text-text-muted uppercase tracking-[0.3em] mb-12">Ohms (Ω)</div>

                {/* Diagnostic Overlay */}
                <AnimatePresence>
                  {diagnostic && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className={`mb-12 p-6 rounded-[24px] border-2 shadow-sm ${diagnostic.bg} ${diagnostic.border} ${diagnostic.color} relative overflow-hidden`}
                    >
                      <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Activity className="w-12 h-12" />
                      </div>
                      <div className="uppercase text-[10px] font-black tracking-widest mb-2 opacity-60">État du Circuit</div>
                      <h4 className="text-lg font-black tracking-tight mb-1">{diagnostic.status}</h4>
                      <p className="text-xs font-medium opacity-80 leading-relaxed">{diagnostic.message}</p>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="w-full mt-8">
                  <div className="relative h-10 flex items-center">
                    <div className="w-full h-1 bg-border-theme rounded-full relative">
                      {/* Scale Markers */}
                      {[0, 16, 32, 48, 63].map((val) => {
                        const pos = (val / 63) * 100;
                        const isActive = selectedBreaker === val;
                        return (
                          <div key={val} className="absolute" style={{ left: `${pos}%` }}>
                            <div className={`w-0.5 h-6 -translate-y-1/2 absolute top-1/2 ${isActive ? 'bg-text-main h-8 -top-4 w-1' : 'bg-accent-blue opacity-30'}`} />
                            <div className={`absolute top-6 -translate-x-1/2 text-[10px] ${isActive ? 'font-bold text-text-main' : 'text-text-muted opacity-50'}`}>
                              {val}A
                            </div>
                          </div>
                        );
                      })}

                      {/* Current Breaker Marker */}
                      <motion.div
                        animate={{ left: `${(selectedBreaker / 63) * 100}%` }}
                        className="absolute top-1/2 -translate-y-1/2 w-1 h-10 bg-accent-blue z-10 shadow-sm"
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : activeTab === 'solar' ? (
              <motion.div 
                key="solar-view"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="w-full h-full flex flex-col items-center justify-center pt-8"
              >
                <div className="text-[12px] font-semibold uppercase tracking-[0.2em] text-text-muted mb-12">
                  Estimation Solaire
                </div>

                <div className="relative w-64 h-64 flex items-center justify-center">
                  <div className="absolute inset-0 bg-yellow-500/5 rounded-full animate-pulse shadow-lg" />
                  <div className="relative z-10 flex flex-col items-center">
                    <Sun className="w-16 h-16 text-yellow-500 mb-4 animate-[spin_10s_linear_infinite]" />
                    <div className="text-4xl font-bold text-text-main">
                      <AnimatedCounter value={totalSolarPeakPower * sunlightHours * INVERTER_EFFICIENCY / 1000} decimals={2} />
                    </div>
                    <div className="text-sm text-text-muted font-bold uppercase tracking-widest">kWh / Jour (Net)</div>
                    <div className="text-[9px] text-text-muted mt-1 uppercase font-bold italic">Rendement onduleur : 95%</div>
                  </div>
                </div>

                <div className="mt-12 grid grid-cols-2 gap-8 w-full max-w-xs">
                  <div className="text-center">
                    <div className="text-[10px] font-bold text-text-muted uppercase mb-1">Puissance Réelle (AC)</div>
                    <div className="text-xl font-bold text-text-main">
                      <AnimatedCounter value={totalSolarPeakPower * INVERTER_EFFICIENCY} decimals={0} suffix=" W" />
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-[10px] font-bold text-text-muted uppercase mb-1">Couverture Instantanée</div>
                    <div className="text-xl font-bold text-yellow-600">
                      <AnimatedCounter value={solarInstantLoad > 0 ? ((totalSolarPeakPower * INVERTER_EFFICIENCY) / solarInstantLoad * 100) : Infinity} decimals={1} suffix="%" />
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex flex-col gap-6 w-full max-w-md pt-5 border-t border-border-theme/40">
                  <div className="flex justify-center">
                    <div className="text-center">
                      <div className="text-[10px] font-bold text-text-muted uppercase mb-1">Charge Active</div>
                      <div className="text-xl font-bold text-text-main">
                        <AnimatedCounter value={solarInstantLoad} decimals={0} suffix=" W" />
                      </div>
                    </div>
                  </div>

                  {/* Section: Mise à la terre RGIE output */}
                  <div className="bg-yellow-50/70 border border-yellow-200 rounded-[2rem] p-5 space-y-4">
                    <div className="flex items-center gap-3 justify-between">
                      <div className="flex items-center gap-2 text-yellow-900">
                        <ShieldAlert className="w-5 h-5 text-yellow-600 shrink-0" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-yellow-800">Câble de Terre RGIE (Structures / Cadres)</span>
                      </div>
                      <span className="bg-yellow-600 text-white text-[13px] font-black px-3.5 py-1.5 rounded-xl shadow-sm transition-transform">
                        {calculatedPvGroundSection} mm²
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 text-[10px] text-yellow-900 font-semibold">
                      <div className="bg-white/90 p-3 rounded-2xl border border-yellow-100 shadow-xs flex flex-col justify-center">
                        <span className="text-[8px] uppercase tracking-wider text-yellow-700 font-extrabold mb-1 block">Règle de Correspondance</span>
                        <span>Section ≥ conduct. PE AC ({solarPeAcSection} mm²)</span>
                      </div>
                      <div className="bg-white/90 p-3 rounded-2xl border border-yellow-100 shadow-xs flex flex-col justify-center">
                        <span className="text-[8px] uppercase tracking-wider text-yellow-700 font-extrabold mb-1 block">Minima de Pose</span>
                        <span>{solarHasMechanicalProtection ? "2.5 mm²" : "4.0 mm²"} ({solarHasMechanicalProtection ? "Avec prot. méc." : "Sans prot. méc."})</span>
                      </div>
                    </div>

                    <div className="text-[10px] text-yellow-900 leading-relaxed pt-3 border-t border-yellow-200/50">
                      <p className="font-semibold text-yellow-950">Réglementation Belge (RGIE Livre 1 - Domestique ≤ 10 kVA) :</p>
                      <ul className="list-disc pl-4 mt-2 space-y-1.5 text-yellow-900/95 font-medium">
                        <li>Les masses métalliques des cadres et structures doivent être raccordées à la terre.</li>
                        <li>La section minimale est de <strong>2,5 mm²</strong> sous conduit/tube (avec protection mécanique) ou de <strong>4 mm²</strong> en pose directe libre.</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : activeTab === 'pv-config' ? (
              <motion.div 
                key="pv-config-view"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="w-full h-full flex flex-col items-center py-4 overflow-y-auto custom-scrollbar"
              >
                <div className="text-[12px] font-semibold uppercase tracking-[0.2em] text-text-muted mb-6 text-center">
                  Bilan Électrique Champ PV & Compatibilité Onduleur
                </div>

                <div className="w-full max-w-2xl space-y-5 px-2">
                  
                  {/* Status Diagnostic Card */}
                  <div className={`p-4 rounded-2xl border-2 transition-all shadow-sm ${
                    pvCouplingResults.isOverVoltageMaxDc 
                      ? 'bg-rose-50 border-rose-300 text-rose-950' 
                      : (pvCouplingResults.isUnderMpptMin || pvCouplingResults.isOverCurrentMppt)
                        ? 'bg-amber-50 border-amber-300 text-amber-950'
                        : 'bg-emerald-50 border-emerald-300 text-emerald-950'
                  }`}>
                    <div className="flex items-center gap-3">
                      {pvCouplingResults.isOverVoltageMaxDc ? (
                        <div className="p-2.5 bg-rose-600 text-white rounded-xl shrink-0 animate-bounce">
                          <ShieldAlert className="w-6 h-6" />
                        </div>
                      ) : (pvCouplingResults.isUnderMpptMin || pvCouplingResults.isOverCurrentMppt) ? (
                        <div className="p-2.5 bg-amber-500 text-white rounded-xl shrink-0">
                          <AlertTriangle className="w-6 h-6" />
                        </div>
                      ) : (
                        <div className="p-2.5 bg-emerald-600 text-white rounded-xl shrink-0">
                          <CheckCircle2 className="w-6 h-6" />
                        </div>
                      )}

                      <div className="text-left flex-1">
                        <div className="font-black text-sm uppercase tracking-tight">
                          {pvCouplingResults.isOverVoltageMaxDc 
                            ? '🚨 SURTENSION DANGEREUSE : RISQUE DE DESTRUCTION' 
                            : (pvCouplingResults.isUnderMpptMin || pvCouplingResults.isOverCurrentMppt)
                              ? '⚠️ ATTENTION : CONTRAINTE TECHNIQUE DÉTECTÉE'
                              : '✅ INSTALLATION CONFORME & ONDULEUR ADAPTÉ'
                          }
                        </div>
                        <p className="text-[11px] font-semibold mt-0.5 leading-snug opacity-90">
                          {pvCouplingResults.isOverVoltageMaxDc 
                            ? `La tension à vide par grand froid (-10°C) est de ${pvCouplingResults.arrayVocCold.toFixed(1)}V, dépassant la limite maximale de ${pvInverterVmaxDc}V de l'onduleur ! Risque de détruire l'onduleur en hiver.`
                            : pvCouplingResults.isUnderMpptMin
                              ? `La tension Vmpp à chaud (${pvCouplingResults.arrayVmpHot.toFixed(1)}V) descend en dessous du seuil minimum de démarrage (${pvInverterVminMppt}V). L'onduleur risque de décrocher en plein été.`
                              : pvCouplingResults.isOverCurrentMppt
                                ? `Le courant de branchement (${pvCouplingResults.arrayImpTotal.toFixed(1)}A) dépasse le courant max d'entrée solaire de l'onduleur (${pvInverterImaxMppt}A). L'onduleur va brider la puissance.`
                                : `Les paramètres de tension (${pvCouplingResults.arrayVocCold.toFixed(1)}V Voc max) et de courant (${pvCouplingResults.arrayImpTotal.toFixed(1)}A) sont parfaitement adaptés aux spécifications de l'onduleur.`
                          }
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* 2-STAGE INVERTER & BATTERY BANK SIZING CARD */}
                  <div className="p-4 bg-gradient-to-r from-slate-900 via-sky-950 to-slate-900 text-white rounded-3xl border border-sky-800/60 shadow-lg space-y-3">
                    <div className="flex items-center justify-between border-b border-sky-800/80 pb-2.5">
                      <div className="flex items-center gap-2">
                        <Zap className="w-4 h-4 text-amber-400" />
                        <span className="text-xs font-black uppercase tracking-wider text-amber-300">
                          Sizing Solaire & Conversion (Ec = {pvEnergyConsumptionEc}W ➔ Ep = {pvCouplingResults.ep}W)
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-left">
                      {/* Stage 1: Consumption & Required Energy */}
                      <div className="bg-slate-800/80 p-3 rounded-2xl border border-emerald-500/40 flex flex-col justify-between space-y-1">
                        <div className="flex justify-between items-center text-[9px] font-black uppercase text-emerald-400">
                          <span>1. Bilan & Production (Ep)</span>
                          <span className="bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded">Ec + 25%</span>
                        </div>
                        <div className="text-lg font-black text-emerald-300 tabular-nums">
                          {pvCouplingResults.ep} <span className="text-xs font-bold text-slate-300">W</span>
                        </div>
                        <div className="text-[9.5px] font-medium text-slate-300 leading-snug">
                          Consommation Ec : <strong>{pvEnergyConsumptionEc} W</strong><br/>
                          Seuil Tension Auto : <strong className="text-emerald-200">{pvCouplingResults.autoVoltage}V DC</strong>
                        </div>
                      </div>

                      {/* Stage 2: Battery Bank Sizing (Series / Parallel) */}
                      <div className="bg-slate-800/80 p-3 rounded-2xl border border-sky-500/40 flex flex-col justify-between space-y-1">
                        <div className="flex justify-between items-center text-[9px] font-black uppercase text-sky-400">
                          <span>2. Parc Batterie ({pvCouplingResults.pvBatteryVoltage}V DC)</span>
                          <span className="bg-sky-500/20 text-sky-300 px-1.5 py-0.5 rounded">Série / Parallel</span>
                        </div>
                        <div className="text-lg font-black text-sky-300 tabular-nums">
                          {pvCouplingResults.totalBatteriesCount} <span className="text-xs font-bold text-slate-300">Batterie(s) ({pvCouplingResults.targetAhNeeded} Ah)</span>
                        </div>
                        <div className="text-[9.5px] font-medium text-slate-300 leading-snug">
                          • {pvCouplingResults.batterySeriesCount} en série par branche ({pvCouplingResults.pvBatteryVoltage}V/{pvBatteryUnitVoltage}V)<br/>
                          • {pvCouplingResults.batteryParallelCount} branche(s) // ({pvCouplingResults.targetAhNeeded}Ah/{pvBatteryUnitAh}Ah)
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 4 Summary Cards Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    
                    {/* Bilan Ec / Ep */}
                    <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 flex flex-col justify-between">
                      <span className="text-[8.5px] font-black uppercase text-emerald-800">Énergie Requise Ep</span>
                      <div className="text-xl font-black text-emerald-950 tabular-nums my-1">
                        {pvCouplingResults.ep} <span className="text-xs font-bold">W</span>
                      </div>
                      <span className="text-[8px] font-bold text-emerald-800">Ec: {pvEnergyConsumptionEc} W (+25%)</span>
                    </div>

                    {/* Target Capacity Ah & System Voltage */}
                    <div className="p-3 bg-sky-50 rounded-2xl border border-sky-200 flex flex-col justify-between">
                      <span className="text-[8.5px] font-black uppercase text-sky-800">Besoin Batterie (Ah)</span>
                      <div className="text-xl font-black text-sky-950 tabular-nums my-1">
                        {pvCouplingResults.targetAhNeeded} <span className="text-xs font-bold">Ah</span>
                      </div>
                      <span className="text-[8px] font-bold text-sky-800">Tension Bus: {pvCouplingResults.pvBatteryVoltage}V DC</span>
                    </div>

                    {/* Total Batteries Count & Montage */}
                    <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 flex flex-col justify-between">
                      <span className="text-[8.5px] font-black uppercase text-amber-800">Total Batteries</span>
                      <div className="text-xl font-black text-amber-950 tabular-nums my-1">
                        {pvCouplingResults.totalBatteriesCount} <span className="text-xs font-bold">Unités</span>
                      </div>
                      <span className="text-[8px] font-bold text-amber-800">{pvCouplingResults.batterySeriesCount}S × {pvCouplingResults.batteryParallelCount}P ({pvBatteryUnitVoltage}V {pvBatteryUnitAh}Ah)</span>
                    </div>

                    {/* Total kWp & Capacity Ratio */}
                    <div className="p-3 bg-white rounded-2xl border border-slate-200 flex flex-col justify-between">
                      <span className="text-[8.5px] font-black uppercase text-slate-400">Champ PV & Ratio DC/AC</span>
                      <div className="text-xl font-black text-amber-600 tabular-nums my-1">
                        {pvCouplingResults.totalPowerKw.toFixed(2)} <span className="text-xs font-bold">kWc</span>
                      </div>
                      <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-md inline-block w-fit ${
                        pvCouplingResults.powerRatioPercent > 130
                          ? 'bg-rose-100 text-rose-800'
                          : pvCouplingResults.powerRatioPercent >= 80 && pvCouplingResults.powerRatioPercent <= 125
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                      }`}>
                        Ratio: {pvCouplingResults.powerRatioPercent}% ({pvInverterPmaxDc}W)
                      </span>
                    </div>

                  </div>

                  {/* SCHÉMA INTERACTIF DU COUPLAGE PV & SYSTÈME BATTERIE */}
                  <div className="bg-slate-900 text-white rounded-3xl p-5 border border-slate-800 space-y-4 shadow-xl">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <div className="flex items-center gap-2">
                        <GitFork className="w-4 h-4 text-amber-400" />
                        <span className="text-xs font-black uppercase tracking-wider text-amber-400">
                          Schéma D'interconnexion : Champ PV + Parc Batterie ({pvCouplingResults.pvBatteryVoltage}V) → Onduleur
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded border border-amber-500/30 font-bold">
                          {pvSeriesCount}S × {pvParallelCount}P ({pvCouplingResults.arrayVmpNominal.toFixed(0)}V DC)
                        </span>
                        <span className="text-[10px] font-mono bg-sky-500/20 text-sky-300 px-2 py-0.5 rounded border border-sky-500/30 font-bold">
                          {pvCouplingResults.pvBatteryVoltage}V DC ({pvCouplingResults.totalBatteriesCount} Batteries)
                        </span>
                      </div>
                    </div>

                    {/* Section 1: Visual representation of PV Strings */}
                    <div className="space-y-2.5 py-1">
                      <span className="text-[9px] font-black uppercase text-amber-400 tracking-wider block">
                        1. Chaînes de Panneaux Photovoltaïques (Entrée Solaire Onduleur)
                      </span>
                      {Array.from({ length: Math.min(pvParallelCount, 3) }).map((_, stringIdx) => (
                        <div key={stringIdx} className="bg-slate-800/80 p-2.5 rounded-2xl border border-slate-700/60 flex items-center justify-between gap-2 overflow-x-auto">
                          <div className="text-[9px] font-black uppercase text-amber-400 shrink-0 w-16">
                            Chaîne {stringIdx + 1}
                          </div>
                          
                          {/* Panel chain */}
                          <div className="flex items-center gap-1.5 flex-1 overflow-x-auto custom-scrollbar py-1">
                            {Array.from({ length: Math.min(pvSeriesCount, 6) }).map((_, panelIdx) => (
                              <div 
                                key={panelIdx} 
                                className="px-2 py-1 bg-amber-500/20 border border-amber-500/40 rounded-lg text-center shrink-0 flex flex-col items-center justify-center min-w-[42px]"
                              >
                                <Sun className="w-3 h-3 text-amber-400 mb-0.5" />
                                <span className="text-[8px] font-mono font-bold text-amber-200">P{panelIdx + 1}</span>
                              </div>
                            ))}
                            {pvSeriesCount > 6 && (
                              <span className="text-[9px] font-mono font-bold text-slate-400 px-1">
                                +{pvSeriesCount - 6}
                              </span>
                            )}
                          </div>

                          {/* Line output */}
                          <div className="shrink-0 text-right font-mono text-[9px] text-amber-300 font-bold bg-slate-900/80 px-2 py-1 rounded-md border border-slate-700">
                            {(pvSeriesCount * pvPanelVmp).toFixed(0)}V / {pvPanelImp}A
                          </div>
                        </div>
                      ))}

                      {pvParallelCount > 3 && (
                        <div className="text-center text-[10px] font-bold text-slate-400 italic">
                          ... + {pvParallelCount - 3} autre(s) chaîne(s) en parallèle
                        </div>
                      )}
                    </div>

                    {/* Section 2: Dynamic Battery Wiring Schema reacting to 12V, 24V, 48V and calculated series/parallel */}
                    <div className="pt-2 border-t border-slate-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-black uppercase text-sky-400 tracking-wider block">
                          2. Configuration du Parc Batterie ({pvCouplingResults.pvBatteryVoltage}V DC - {pvCouplingResults.targetAhNeeded} Ah)
                        </span>
                        <span className="text-[9px] font-mono font-bold text-sky-300">
                          {pvCouplingResults.batterySeriesCount} SÉRIE × {pvCouplingResults.batteryParallelCount} PARALLÈLE = {pvCouplingResults.totalBatteriesCount} BATTERIES
                        </span>
                      </div>

                      <div className="bg-slate-800/90 p-3.5 rounded-2xl border border-sky-500/40 space-y-3">
                        {Array.from({ length: Math.min(pvCouplingResults.batteryParallelCount, 3) }).map((_, stringIdx) => (
                          <div key={stringIdx} className="bg-slate-900/80 p-2.5 rounded-xl border border-sky-600/30 flex items-center justify-between gap-2 overflow-x-auto">
                            <span className="text-[8.5px] font-black text-sky-400 uppercase shrink-0 w-28">
                              Branche {stringIdx + 1} ({pvBatteryUnitAh}Ah)
                            </span>
                            
                            <div className="flex items-center gap-1.5 flex-1 flex-wrap">
                              {Array.from({ length: pvCouplingResults.batterySeriesCount }).map((_, bIdx) => (
                                <React.Fragment key={bIdx}>
                                  <div className="px-2.5 py-1 bg-sky-500/20 border border-sky-400/50 rounded-lg flex items-center gap-1 text-sky-200">
                                    <Battery className="w-3.5 h-3.5 text-sky-400" />
                                    <span className="text-[9px] font-bold font-mono">
                                      Bat {bIdx + 1} ({pvBatteryUnitVoltage}V {pvBatteryUnitAh}Ah)
                                    </span>
                                  </div>
                                  {bIdx < pvCouplingResults.batterySeriesCount - 1 && (
                                    <span className="text-amber-400 font-extrabold text-[10px]">+</span>
                                  )}
                                </React.Fragment>
                              ))}
                            </div>

                            <span className="text-[8.5px] font-black text-sky-300 uppercase bg-slate-800 px-2 py-1 rounded border border-slate-700 shrink-0 font-mono">
                              = {pvCouplingResults.pvBatteryVoltage}V / {pvBatteryUnitAh}Ah
                            </span>
                          </div>
                        ))}

                        {pvCouplingResults.batteryParallelCount > 3 && (
                          <div className="text-center text-[9.5px] font-bold text-sky-300 italic">
                            ... + {pvCouplingResults.batteryParallelCount - 3} autre(s) branche(s) de {pvCouplingResults.batterySeriesCount} batteries en parallèle
                          </div>
                        )}

                        <div className="flex justify-between items-center text-[9.5px] font-mono text-slate-300 pt-1 border-t border-slate-700/60">
                          <span>Modèle choisi: <strong>{pvBatteryUnitVoltage}V {pvBatteryUnitAh}Ah</strong></span>
                          <span>Courant Décharge Max: <strong className="text-amber-300">{pvCouplingResults.batteryCurrentPeakA} A DC</strong></span>
                          <span>Câble Recommandé: <strong className="text-sky-300">{pvCouplingResults.recommendedBatteryCable}</strong></span>
                        </div>
                      </div>
                    </div>

                    {/* Section 3: Summary Connection Explanation */}
                    <div className="pt-2 border-t border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-3 text-left">
                      <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/50 text-[10px]">
                        <span className="font-extrabold text-amber-400 uppercase block mb-1">Câblage Solaire (Ns = {pvSeriesCount}, Np = {pvParallelCount})</span>
                        <p className="text-slate-300 text-[9.5px] leading-relaxed">
                          Tension totale entrée solaire = {pvCouplingResults.arrayVmpNominal.toFixed(0)}V DC ({pvSeriesCount}×{pvPanelVmp}V). Courant total = {pvCouplingResults.arrayImpTotal.toFixed(1)}A DC.
                        </p>
                      </div>

                      <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/50 text-[10px]">
                        <span className="font-extrabold text-sky-400 uppercase block mb-1">Liaison Onduleur ↔ Batterie ({pvCouplingResults.pvBatteryVoltage}V DC)</span>
                        <p className="text-slate-300 text-[9.5px] leading-relaxed">
                          Pour une tension de bus de {pvCouplingResults.pvBatteryVoltage}V DC, l'onduleur soutire jusqu'à {pvCouplingResults.batteryCurrentPeakA}A DC. Utiliser un câble cuivre souple de section {pvCouplingResults.recommendedBatteryCable} avec fusible de protection DC adapté.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Normes & Recommandations de Câblage */}
                  <div className="p-4 bg-slate-100 rounded-2xl border border-slate-200 text-left space-y-2 text-[10.5px] text-slate-700">
                    <span className="font-black uppercase text-slate-800 text-[10px] block">
                      📋 Recommandations Techniques RGIE & Association Panneaux/Onduleur
                    </span>
                    <ul className="list-disc pl-4 space-y-1.5 font-medium">
                      <li><strong>Montage Panneaux 12V / 24V :</strong> Pour un panneau 12V (Vmpp ≈ 18V), associez au moins 2 panneaux en série pour un bus 24V, 4 en série pour 48V, ou davantage pour atteindre la tension minimale de démarrage de l'onduleur (ex. 120V - 450V sur les onduleurs hybrides).</li>
                      <li><strong>Capacité Puissance & Ampérage :</strong> Un surdimensionnement solaire de 10% à 25% (Ratio DC/AC 110-125%) est courant. Si le courant solaire dépasse l'ampérage max de l'onduleur ({pvInverterImaxMppt}A), l'onduleur bridera l'excédent automatiquement. En revanche, dépasser la tension Voc Froid ({pvInverterVmaxDc}V) détruira l'onduleur !</li>
                      <li><strong>Fusibles gPV & Protection DC :</strong> Obligatoires sur chaque pôle si Np ≥ 3 chaînes en parallèle. Sectionneur omnipolaire DC obligatoire avant l'onduleur.</li>
                    </ul>
                  </div>

                </div>
              </motion.div>
            ) : activeTab === 'autonomy' ? (
              <motion.div 
                key="autonomy-view"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="w-full flex flex-col items-center pt-8 overflow-y-auto max-h-[calc(100vh-140px)] custom-scrollbar px-2 sm:px-4 pb-14"
              >
                <div className="text-[12px] font-semibold uppercase tracking-[0.2em] text-text-muted mb-12">
                  Simulation Autonomie
                </div>

                <div className="relative w-64 h-64 flex items-center justify-center">
                  <div className="absolute inset-0 bg-amber-500/5 rounded-full animate-pulse shadow-lg" />
                  <div className="relative z-10 flex flex-col items-center">
                    <Battery className="w-16 h-16 text-amber-500 mb-4" />
                    <div className="text-4xl font-black text-text-main">
                      <AnimatedCounter value={autonomyResults.h} decimals={0} />h
                    </div>
                    <div className="text-sm text-text-muted font-bold uppercase tracking-widest">
                      <AnimatedCounter value={autonomyResults.m} decimals={0} suffix=" minutes" />
                    </div>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-border-theme/40 w-full max-w-xs text-center">
                  <div className="text-[10px] font-bold text-text-muted uppercase mb-1">Puissance Appareil</div>
                  <div className="text-2xl font-black text-text-main">
                    <AnimatedCounter value={solarAppliancePower} decimals={0} suffix=" W" />
                  </div>
                </div>

                {/* Section détaillée des Équations et Formules de Calcul de l'Autonomie */}
                <div className="w-full max-w-md mt-10 p-5 sm:p-6 bg-white rounded-3xl border-2 border-amber-200 shadow-md space-y-4 text-left">
                  <div className="flex items-center justify-between border-b border-amber-100 pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-amber-50 text-amber-600 border border-amber-200">
                        <Calculator className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-slate-800 tracking-tight">Formules &amp; Équations Utilisées</h4>
                        <p className="text-[10.5px] text-slate-500 font-medium">Détail des calculs de l'autonomie et de la batterie</p>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase bg-amber-50 border border-amber-200 text-amber-700">
                      DoD 80% • C-Rate
                    </span>
                  </div>

                  <div className="space-y-3.5 text-xs">
                    {/* 1. Capacité totale brute */}
                    <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-slate-700 text-[11px]">1. Énergie brute totale (Wh &amp; kWh)</span>
                        <span className="text-[10px] font-mono font-bold text-amber-600">Résultat : {autonomyResults.totalKWh.toFixed(2)} kWh</span>
                      </div>
                      <div className="font-mono text-[11px] bg-white p-2 rounded-xl border border-slate-200 text-slate-800 font-semibold mb-1.5">
                        E_totale = C_Ah × U_bat &nbsp;[Wh] &nbsp;= (C_Ah × U_bat) / 1000 &nbsp;[kWh]
                      </div>
                      <p className="text-[10.5px] text-slate-500 font-mono">
                        Calcul : {solarBatteryAh} Ah × {solarBatteryVoltage} V = {solarBatteryAh * solarBatteryVoltage} Wh = <strong className="text-amber-700 font-bold">{autonomyResults.totalKWh.toFixed(2)} kWh</strong>
                      </p>
                    </div>

                    {/* 2. Capacité utile à 80% DoD */}
                    <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-slate-700 text-[11px]">2. Énergie utile disponible (80% décharge)</span>
                        <span className="text-[10px] font-mono font-bold text-amber-600">Résultat : {autonomyResults.usableKWh.toFixed(2)} kWh</span>
                      </div>
                      <div className="font-mono text-[11px] bg-white p-2 rounded-xl border border-slate-200 text-slate-800 font-semibold mb-1.5">
                        E_utile = E_totale × 0.80 &nbsp;(Taux DoD sécuritaire pour préserver la chimie)
                      </div>
                      <p className="text-[10.5px] text-slate-500 font-mono">
                        Calcul : {(solarBatteryAh * solarBatteryVoltage)} Wh × 0.80 = {(solarBatteryAh * solarBatteryVoltage * 0.8).toFixed(0)} Wh = <strong className="text-amber-700 font-bold">{autonomyResults.usableKWh.toFixed(2)} kWh</strong>
                      </p>
                    </div>

                    {/* 3. Temps d'autonomie */}
                    <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-slate-700 text-[11px]">3. Temps d'autonomie (heures &amp; minutes)</span>
                        <span className="text-[10px] font-mono font-bold text-amber-600">{autonomyResults.h}h {autonomyResults.m}min</span>
                      </div>
                      <div className="font-mono text-[11px] bg-white p-2 rounded-xl border border-slate-200 text-slate-800 font-semibold mb-1.5">
                        T = E_utile / P_appareil &nbsp;[heures] &nbsp;➔ &nbsp;T_min = (T % 1) × 60
                      </div>
                      <p className="text-[10.5px] text-slate-500 font-mono leading-relaxed">
                        Calcul : {(solarBatteryAh * solarBatteryVoltage * 0.8).toFixed(0)} Wh / {solarAppliancePower || 1} W = {((solarBatteryAh * solarBatteryVoltage * 0.8) / (solarAppliancePower || 1)).toFixed(2)} h<br />
                        ➔ <strong className="text-amber-700 font-bold">{autonomyResults.h}h {autonomyResults.m} minutes</strong> (soit {autonomyResults.totalMinutes} min au total)
                      </p>
                    </div>

                    {/* 4. Courant de décharge continu */}
                    <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-slate-700 text-[11px]">4. Courant de décharge batterie (A)</span>
                        <span className="text-[10px] font-mono font-bold text-amber-600">I_bat : {((solarAppliancePower || 0) / solarBatteryVoltage).toFixed(1)} A</span>
                      </div>
                      <div className="font-mono text-[11px] bg-white p-2 rounded-xl border border-slate-200 text-slate-800 font-semibold mb-1.5">
                        I_bat = P_appareil / U_bat &nbsp;[A] &nbsp;• &nbsp;Régime C-rate = I_bat / C_Ah
                      </div>
                      <p className="text-[10.5px] text-slate-500 font-mono">
                        Calcul : {solarAppliancePower} W / {solarBatteryVoltage} V = <strong className="text-slate-800 font-bold">{((solarAppliancePower || 0) / solarBatteryVoltage).toFixed(1)} A</strong> &nbsp;
                        (Régime C-rate : {(((solarAppliancePower || 0) / solarBatteryVoltage) / (solarBatteryAh || 1)).toFixed(2)}C)
                      </p>
                    </div>
                  </div>

                  {/* Note technique de longévité */}
                  <div className="mt-3 p-3 rounded-2xl bg-amber-50/80 border border-amber-200/80 text-[10px] font-medium text-amber-900 leading-relaxed flex items-start gap-2">
                    <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <span>
                      <strong>Recommandation technique :</strong> Pour maximiser le nombre de cycles de vie (cyclabilité), un seuil DoD de 80% pour Lithium/LiFePO4 ou 50% pour Plomb/GEL est préconisé. Un régime de décharge inférieur à 0.2C garantit un rendement optimal sans échauffement excessif.
                    </span>
                  </div>
                </div>
              </motion.div>
            ) : activeTab === 'ev-charger' ? (
              <motion.div 
                key="ev-view"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="w-full flex flex-col items-center pt-8 overflow-y-auto max-h-[calc(100vh-140px)] custom-scrollbar px-2 sm:px-4 pb-14"
              >
                <div className="text-[12px] font-semibold uppercase tracking-[0.2em] text-text-muted mb-12">
                  Suivi de Recharge
                </div>

                <div className="w-full max-w-xs bg-bg-theme p-6 rounded-2xl border border-border-theme space-y-8">
                  <div className="flex justify-between items-center px-2">
                    <Car className="w-8 h-8 text-emerald-600" />
                    <div className="text-right">
                      <div className="text-[10px] font-bold text-text-muted uppercase">État de charge</div>
                      <div className="text-2xl font-bold text-emerald-600">
                        <AnimatedCounter value={currentCharge} decimals={0} suffix="%" />
                      </div>
                    </div>
                  </div>

                  <div className="relative h-4 bg-emerald-100 rounded-full overflow-hidden border border-emerald-200">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${currentCharge}%` }}
                      className="absolute inset-y-0 left-0 bg-emerald-500 flex items-center justify-end px-2"
                    >
                      <Zap className="w-2.5 h-2.5 text-white animate-pulse" />
                    </motion.div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 bg-white rounded-xl border border-border-theme">
                      <div className="text-[9px] font-bold text-text-muted uppercase mb-1">Borne</div>
                      <div className="text-sm font-bold text-text-main">
                        <AnimatedCounter value={chargerPower} decimals={1} suffix=" kW" />
                      </div>
                    </div>
                    <div className="p-3 bg-white rounded-xl border border-border-theme">
                      <div className="text-[9px] font-bold text-text-muted uppercase mb-1">Protec.</div>
                      <div className="text-sm font-bold text-emerald-600">
                        <AnimatedCounter value={recommendedEVBreaker} decimals={0} suffix="A" />
                      </div>
                    </div>
                    <div className="p-3 bg-white rounded-xl border border-border-theme">
                      <div className="text-[9px] font-bold text-text-muted uppercase mb-1">À charger</div>
                      <div className="text-sm font-bold text-text-main">
                        <AnimatedCounter value={(batteryCapacity * (100 - currentCharge) / 100)} decimals={1} suffix=" kWh" />
                      </div>
                    </div>
                  </div>

                  <div className="w-full p-4 bg-emerald-600 text-white rounded-2xl shadow-lg border border-emerald-500">
                    <div className="text-[10px] font-bold uppercase opacity-80 mb-1">Coût de la Recharge Estimé</div>
                    <div className="flex items-baseline gap-1">
                       <span className="text-3xl font-black tabular-nums">
                         <AnimatedCounter value={batteryCapacity * (100 - currentCharge) / 100 * evPricePerKWh} decimals={2} />
                       </span>
                       <span className="text-lg font-bold">€ TTC</span>
                    </div>
                    <div className="mt-2 pt-2 border-t border-white/20 text-[10px] opacity-80 leading-relaxed font-medium italic">
                      Basé sur <AnimatedCounter value={((batteryCapacity * (100 - currentCharge)) / 100)} decimals={1} /> kWh à rattraper.
                    </div>
                  </div>
                </div>

                <div className="mt-10 text-center">
                  <div className="text-[10px] font-bold text-text-muted uppercase mb-2">Temps de recharge</div>
                  <div className="text-4xl font-bold text-emerald-600">
                    <AnimatedCounter value={Math.floor((batteryCapacity * (100 - currentCharge) / 100) / chargerPower)} decimals={0} />h <AnimatedCounter value={Math.round((((batteryCapacity * (100 - currentCharge) / 100) / chargerPower) % 1) * 60)} decimals={0} />m
                  </div>
                </div>

                {/* Section détaillée des Équations et Formules de Calcul */}
                <div className="w-full max-w-md mt-10 p-5 sm:p-6 bg-white rounded-3xl border-2 border-emerald-100 shadow-md space-y-4 text-left">
                  <div className="flex items-center justify-between border-b border-emerald-100 pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200">
                        <Calculator className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-slate-800 tracking-tight">Formules &amp; Équations Utilisées</h4>
                        <p className="text-[10.5px] text-slate-500 font-medium">Détail des calculs des résultats affichés ci-dessus</p>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase bg-emerald-50 border border-emerald-200 text-emerald-700">
                      RGIE / NF C 15-100
                    </span>
                  </div>

                  <div className="space-y-3.5 text-xs">
                    {/* 1. Énergie restante à charger */}
                    <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-slate-700 text-[11px]">1. Énergie à charger (kWh)</span>
                        <span className="text-[10px] font-mono font-bold text-emerald-600">Résultat : {((batteryCapacity * (100 - currentCharge)) / 100).toFixed(1)} kWh</span>
                      </div>
                      <div className="font-mono text-[11px] bg-white p-2 rounded-xl border border-slate-200 text-slate-800 font-semibold mb-1.5">
                        E = C_batterie × (1 - SoC / 100)
                      </div>
                      <p className="text-[10.5px] text-slate-500 font-mono">
                        Calcul : {batteryCapacity} kWh × (1 - {currentCharge} / 100) = <strong className="text-emerald-700 font-bold">{((batteryCapacity * (100 - currentCharge)) / 100).toFixed(1)} kWh</strong>
                      </p>
                    </div>

                    {/* 2. Temps de recharge */}
                    <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-slate-700 text-[11px]">2. Temps de recharge (heures &amp; minutes)</span>
                        <span className="text-[10px] font-mono font-bold text-emerald-600">
                          {Math.floor(((batteryCapacity * (100 - currentCharge)) / 100) / chargerPower)}h {Math.round(((((batteryCapacity * (100 - currentCharge)) / 100) / chargerPower) % 1) * 60)}m
                        </span>
                      </div>
                      <div className="font-mono text-[11px] bg-white p-2 rounded-xl border border-slate-200 text-slate-800 font-semibold mb-1.5">
                        T = E / P_borne &nbsp;[heures] &nbsp;➔ &nbsp;T_min = (T % 1) × 60
                      </div>
                      <p className="text-[10.5px] text-slate-500 font-mono">
                        Calcul : {((batteryCapacity * (100 - currentCharge)) / 100).toFixed(1)} kWh / {chargerPower} kW = {(((batteryCapacity * (100 - currentCharge)) / 100) / chargerPower).toFixed(2)} h 
                        ➔ <strong className="text-emerald-700 font-bold">{Math.floor(((batteryCapacity * (100 - currentCharge)) / 100) / chargerPower)}h {Math.round(((((batteryCapacity * (100 - currentCharge)) / 100) / chargerPower) % 1) * 60)}m</strong>
                      </p>
                    </div>

                    {/* 3. Intensité et Calibre de Protection */}
                    <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-slate-700 text-[11px]">3. Courant absorbé &amp; Calibre disjoncteur</span>
                        <span className="text-[10px] font-mono font-bold text-emerald-600">Disjoncteur : {recommendedEVBreaker}A</span>
                      </div>
                      <div className="font-mono text-[11px] bg-white p-2 rounded-xl border border-slate-200 text-slate-800 font-semibold mb-1.5">
                        I = (P_borne × 1000) / U &nbsp;[U = 230 V] &nbsp;• &nbsp;I_n ≥ 1.25 × I
                      </div>
                      <p className="text-[10.5px] text-slate-500 font-mono leading-relaxed">
                        Courant : ({chargerPower} × 1000) / 230 = <strong className="text-slate-800 font-bold">{((chargerPower * 1000) / 230).toFixed(1)} A</strong><br />
                        Facteur service continu 125% : 1.25 × {((chargerPower * 1000) / 230).toFixed(1)}A = {(((chargerPower * 1000) / 230) * 1.25).toFixed(1)}A ➔ Calibre normalisé : <strong className="text-emerald-700 font-bold">{recommendedEVBreaker}A Courbe C</strong>
                      </p>
                    </div>

                    {/* 4. Coût total de recharge */}
                    <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-slate-700 text-[11px]">4. Coût estimé de la recharge (€ TTC)</span>
                        <span className="text-[10px] font-mono font-bold text-emerald-600">
                          {(((batteryCapacity * (100 - currentCharge)) / 100) * evPricePerKWh).toFixed(2)} €
                        </span>
                      </div>
                      <div className="font-mono text-[11px] bg-white p-2 rounded-xl border border-slate-200 text-slate-800 font-semibold mb-1.5">
                        Coût = E × Prix_kWh
                      </div>
                      <p className="text-[10.5px] text-slate-500 font-mono">
                        Calcul : {((batteryCapacity * (100 - currentCharge)) / 100).toFixed(1)} kWh × {evPricePerKWh.toFixed(2)} €/kWh = <strong className="text-emerald-700 font-bold">{(((batteryCapacity * (100 - currentCharge)) / 100) * evPricePerKWh).toFixed(2)} € TTC</strong>
                      </p>
                    </div>
                  </div>

                  {/* Note normative de sécurité */}
                  <div className="mt-3 p-3 rounded-2xl bg-emerald-50/80 border border-emerald-200/80 text-[10px] font-medium text-emerald-900 leading-relaxed flex items-start gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>
                      <strong>Règle de sécurité RGIE :</strong> Alimentation sur ligne dédiée directe sans boîte de dérivation. Protection différentielle 30mA Type A avec détection courant continu 6mA (RDC-DD) ou Type B. Section minimale de cuivre recommandée : 2.5 mm² pour 16A, 10 mm² pour 32A.
                    </span>
                  </div>
                </div>
              </motion.div>
            ) : activeTab === 'specs' ? (
              <motion.div 
                key="specs-view"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="w-full h-full flex flex-col items-center justify-start overflow-y-auto custom-scrollbar p-8"
              >
                <AnimatePresence mode="wait">
                  {specsSubTab === 'solar' ? (
                    <motion.div
                      key="solar-view-anim"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="w-full flex flex-col items-center"
                    >
                      <div className="text-[11px] font-black uppercase tracking-[0.3em] text-emerald-600/60 mb-10">
                        Visualisation Coffret PV
                      </div>
                      
                      {/* PV Schematic */}
                      <div className="relative w-full max-w-sm bg-white p-8 rounded-[2.5rem] border-2 border-slate-200 shadow-xl space-y-8 overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-5">
                          <Sun className="w-48 h-48 rotate-12" />
                        </div>
                        
                        <div className="flex justify-between items-end relative z-10">
                          <div className="text-center group">
                            <Sun className="w-10 h-10 text-yellow-500 mx-auto mb-2 transition-transform group-hover:scale-110" />
                            <div className="text-[8px] font-black uppercase text-slate-400">Onduleur PV</div>
                            <div className="w-16 h-20 bg-slate-50 border-2 border-slate-200 rounded-xl flex flex-col items-center justify-center shadow-sm">
                              <Zap className="w-4 h-4 text-yellow-400 mb-1" />
                              <div className="w-8 h-1 bg-slate-200 rounded-full" />
                            </div>
                          </div>
                          
                          <div className="flex-1 px-4 flex flex-col items-center justify-center">
                            <div className="w-full h-0.5 bg-emerald-400/30 relative">
                              <motion.div 
                                animate={{ x: [-100, 100] }}
                                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                className="absolute top-0 w-20 h-full bg-gradient-to-r from-transparent via-emerald-400 to-transparent"
                              />
                            </div>
                            <span className="text-[7px] font-black text-emerald-600 mt-2 uppercase tracking-tighter">Flux Énergie AC</span>
                          </div>

                          <div className="text-center group">
                            <Home className="w-10 h-10 text-blue-500 mx-auto mb-2 transition-transform group-hover:scale-110" />
                            <div className="text-[8px] font-black uppercase text-slate-400">Réseau Public</div>
                            <div className="w-16 h-20 bg-slate-50 border-2 border-slate-200 rounded-xl flex items-center justify-center shadow-sm">
                              <Activity className="w-6 h-6 text-blue-400" />
                            </div>
                          </div>
                        </div>

                        <div className="p-5 bg-slate-900 rounded-3xl border border-white/5 relative shadow-inner">
                          <div className="text-[8px] font-black uppercase text-slate-500 mb-4 text-center tracking-widest border-b border-white/10 pb-2">Topologie du Coffret</div>
                          <div className="grid grid-cols-4 gap-2">
                             <div className="bg-emerald-500 rounded-lg h-16 flex flex-col items-center justify-center p-1 border-b-4 border-emerald-700">
                               <span className="text-[7px] font-black text-white">DIFF</span>
                               <span className="text-[5px] text-white/70">300mA</span>
                             </div>
                             <div className="bg-slate-700 rounded-lg h-16 flex flex-col items-center justify-center p-1 border-b-4 border-slate-800">
                               <span className="text-[7px] font-black text-white">DISJ</span>
                               <span className="text-[5px] text-white/70">PV</span>
                             </div>
                             {[1, 2].map(i => (
                               <div key={i} className="bg-slate-700 rounded-lg h-16 flex flex-col items-center justify-center p-1 relative border-b-4 border-slate-800">
                                 <div className="absolute -top-3 left-0 right-0 h-0.5 bg-red-500" />
                                 <span className="text-[7px] font-black text-white">DISJ</span>
                                 <span className="text-[5px] text-white/70">Hab.</span>
                               </div>
                             ))}
                          </div>
                          <div className="mt-4 flex items-center justify-center gap-2 bg-red-500/10 py-2 rounded-lg border border-red-500/20">
                             <ShieldAlert className="w-3 h-3 text-red-500" />
                             <span className="text-[7px] font-black text-red-400 uppercase tracking-tighter">Calculer Intensité Cumulée</span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ) : specsSubTab === 'ev' ? (
                    <motion.div
                      key="ev-view-anim"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="w-full flex flex-col items-center"
                    >
                      <div className="text-[11px] font-black uppercase tracking-[0.3em] text-blue-600/60 mb-10">
                        Visualisation Borne de Recharge
                      </div>

                      <div className="relative w-full max-w-sm bg-slate-900 p-8 rounded-[3rem] border border-white/10 shadow-2xl space-y-8">
                         <div className="absolute top-0 right-0 p-8 opacity-10">
                            <Activity className="w-32 h-32 text-blue-400" />
                         </div>

                         <div className="flex justify-center items-center gap-6 relative z-10">
                            <div className="w-24 h-40 bg-zinc-800 rounded-2xl border-2 border-zinc-700 p-4 flex flex-col items-center shadow-[0_10px_40px_rgba(0,0,0,0.4)]">
                               <div className="w-full h-8 bg-black rounded flex items-center justify-center mb-4 border border-zinc-600">
                                  <div className="w-6 h-1 bg-blue-500 animate-pulse rounded-full" />
                               </div>
                               <Car className="w-12 h-12 text-blue-400 mb-2" />
                               <div className="text-[8px] font-black uppercase text-zinc-500">Borne Wall</div>
                            </div>
                            
                            <div className="flex-1 space-y-4">
                               <div className="h-0.5 w-full bg-blue-500/30 relative">
                                  <motion.div 
                                    animate={{ x: [-50, 50] }}
                                    transition={{ duration: 1.5, repeat: Infinity }}
                                    className="absolute -top-1 w-4 h-2 bg-blue-400 shadow-[0_0_10px_#60a5fa] rounded-full"
                                  />
                                </div >
                               <div className="p-3 bg-white/5 rounded-xl border border-white/10 backdrop-blur-sm">
                                  <div className="text-[7px] font-black text-blue-400 uppercase mb-1">Protection Type B</div>
                                  <div className="h-6 w-full flex gap-1">
                                     <div className="bg-blue-600 w-full rounded-sm" />
                                     <div className="bg-blue-600 w-1/3 rounded-sm opacity-50" />
                                  </div>
                               </div>
                            </div>
                         </div>

                         <div className="bg-black/40 p-4 rounded-2xl border border-white/10">
                            <div className="flex items-center gap-2 mb-2">
                               <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
                               <span className="text-[8px] font-bold text-white uppercase tracking-widest">Alerte Sécurité Norme</span>
                            </div>
                            <p className="text-[9px] text-zinc-400 leading-relaxed italic">
                              "Si protection 6mA non intégrée, le Type B est impératif pour la sécurité des biens et des personnes face aux courants DC. De plus, on doit obligatoirement installer un différentiel de Type B également en amont, au risque de voir ce dernier aveuglé (désensibilisé) par les fuites de courant continu."
                            </p>
                          </div>
                      </div>
                    </motion.div>
                  ) : specsSubTab === 'dedicated' ? (
                    <motion.div
                      key="dedicated-view-anim"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="w-full flex flex-col items-center"
                    >
                      <div className="text-[11px] font-black uppercase tracking-[0.3em] text-blue-600/70 mb-10">
                        Visualisation de Ligne Dédiée
                      </div>

                      {(() => {
                        const app = dedicatedAppliances.find(a => a.id === selectedDedicatedAppliance) || dedicatedAppliances[0];
                        return (
                          <div className="w-full max-w-sm space-y-4">
                            {/* Schematic Box */}
                            <div className="relative w-full bg-slate-900 p-8 rounded-[3rem] border border-white/10 shadow-2xl space-y-6 overflow-hidden">
                              <div className="absolute top-0 right-0 p-8 opacity-5">
                                <PlugZap className="w-32 h-32 text-blue-400 rotate-12" />
                              </div>

                              <div className="flex justify-between items-center relative z-10 bg-black/40 p-5 rounded-3xl border border-white/5 shadow-inner">
                                <div className="text-center group">
                                  <Shield className="w-8 h-8 text-blue-500 mx-auto mb-2 transition-transform group-hover:scale-110" />
                                  <div className="text-[8px] font-black uppercase text-slate-400">Disjoncteur</div>
                                  <div className="w-16 h-20 bg-zinc-800 border-2 border-zinc-700 rounded-xl flex flex-col items-center justify-center shadow-sm">
                                    <div className="w-4 h-1 bg-blue-500 rounded-full mb-2 animate-pulse" />
                                    <div className="text-[10px] font-black text-white font-mono">{app.breakerSize || '20A'}</div>
                                    <div className="text-[6.5px] font-medium text-slate-500">Unipolaire</div>
                                  </div>
                                </div>

                                <div className="flex-1 px-3 flex flex-col items-center justify-center">
                                  <div className="w-full h-0.5 bg-emerald-400/30 relative">
                                    <motion.div 
                                      animate={{ x: [-50, 50] }}
                                      transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                                      className="absolute top-0 w-12 h-full bg-gradient-to-r from-transparent via-emerald-400 to-transparent"
                                    />
                                  </div>
                                  <span className="text-[7px] font-black text-emerald-400 mt-2 uppercase tracking-tighter">
                                    {app.cableSize || '3x2.5 mm²'}
                                  </span>
                                </div>

                                <div className="text-center group">
                                  <PlugZap className="w-8 h-8 text-blue-400 mx-auto mb-2 transition-transform group-hover:scale-110" />
                                  <div className="text-[8px] font-black uppercase text-slate-400">Récepteur</div>
                                  <div className="w-16 h-20 bg-zinc-800 border-2 border-zinc-700 rounded-xl flex flex-col items-center justify-center p-1 shadow-sm">
                                    <div className="text-[7.5px] font-bold text-slate-300 text-center leading-tight line-clamp-3">
                                      {app.name}
                                    </div>
                                  </div>
                                </div>
                              </div>

                              <div className="p-4 bg-zinc-800/80 rounded-2xl border border-white/10 flex items-center justify-between gap-3">
                                <div className="flex items-center gap-2">
                                  <Activity className={`w-4 h-4 ${app.rcdValue === '30mA' ? 'text-rose-400 animate-pulse' : app.rcdValue === '300mA' ? 'text-sky-400' : 'text-emerald-400'}`} />
                                  <div>
                                    <div className="text-[7.5px] font-black uppercase text-zinc-400">Protection Différentielle</div>
                                    <div className="text-[10px] font-black text-white font-mono">{app.rcdValue === 'TBTS' ? 'TBTS (Sans diff.)' : `${app.rcdValue}`}</div>
                                  </div>
                                </div>
                                <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${
                                  app.rcdValue === '30mA' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
                                  app.rcdValue === '300mA' ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30' :
                                  'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                }`}>
                                  {app.rcdValue === '30mA' ? '30 mA Humide' : app.rcdValue === '300mA' ? '300 mA Général' : 'TBT Exempté'}
                                </span>
                              </div>

                              <div className="p-4 bg-black/50 rounded-2xl border border-white/5 space-y-2">
                                <div className="flex items-center gap-1.5 mb-1">
                                  <Info className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                                  <span className="text-[8px] font-bold text-white uppercase tracking-wider">Norme de Sécurité Habituelle</span>
                                </div>
                                <p className="text-[9.5px] text-zinc-400 leading-relaxed italic">
                                  "Pas d'interrupteurs ou d'autres prises raccordés sur cette ligne. Le partage de ligne pour les appareils de cuisson ou de lavage est interdit par la réglementation pour éliminer tout risque d'échauffement continu des câbles cachés."
                                </p>
                              </div>
                            </div>

                            {/* Selected Appliance spec block */}
                            <div className="bg-slate-900 p-6 rounded-[2.5rem] border border-white/10 text-white space-y-4 shadow-xl text-left">
                              <div className="border-b border-white/10 pb-3">
                                <div className="text-[8.5px] font-black uppercase text-amber-400 tracking-wider mb-1">Raccordement Spécifique</div>
                                <h4 className="text-xs font-black uppercase text-white font-mono">{app.name}</h4>
                              </div>

                              <div className="grid grid-cols-2 gap-3">
                                <div className="bg-white/5 p-3 rounded-xl border border-white/10">
                                  <div className="text-[7.5px] font-bold text-slate-400 uppercase mb-1">Disjoncteur max</div>
                                  <div className="text-[10px] font-black text-amber-300 font-mono">{app.breaker}</div>
                                </div>
                                <div className="bg-white/5 p-3 rounded-xl border border-white/10">
                                  <div className="text-[7.5px] font-bold text-slate-400 uppercase mb-1">Section de câble</div>
                                  <div className="text-[10px] font-black text-green-300 font-mono">{app.cable}</div>
                                </div>
                              </div>

                              <div className="space-y-3 pt-1">
                                <div className="space-y-1">
                                  <div className="text-[8px] font-bold text-blue-300 uppercase">Type de branchement</div>
                                  <p className="text-[9.5px] text-slate-300 leading-snug">{app.connection}</p>
                                </div>

                                <div className="space-y-1">
                                  <div className="text-[8px] font-bold text-emerald-300 uppercase">Protection différentielle</div>
                                  <p className="text-[9.5px] text-slate-300 leading-snug font-semibold">{app.rcd}</p>
                                  <div className="mt-1.5 flex flex-wrap gap-1.5 items-center">
                                    {app.rcdValue === '30mA' && (
                                      <span className="inline-flex items-center gap-1.5 px-2.2 py-0.5 rounded-md text-[8.5px] font-black uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/30">
                                        ⚠️ Seuil direct : 30 mA (Obligatoire)
                                      </span>
                                    )}
                                    {app.rcdValue === '300mA' && (
                                      <span className="inline-flex items-center gap-1.5 px-2.2 py-0.5 rounded-md text-[8.5px] font-black uppercase tracking-wider bg-sky-500/20 text-sky-300 border border-sky-500/30">
                                        🛡️ Seuil direct : 300 mA (Général)
                                      </span>
                                    )}
                                    {app.rcdValue === 'TBTS' && (
                                      <span className="inline-flex items-center gap-1.5 px-2.2 py-0.5 rounded-md text-[8.5px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                        🔌 Très Basse Tension (TBTS)
                                      </span>
                                    )}
                                  </div>
                                  {app.rcdInfo && <p className="text-[9px] text-slate-400 mt-1 italic">{app.rcdInfo}</p>}
                                </div>

                                <div className="space-y-1">
                                  <div className="text-[8px] font-bold text-amber-300 uppercase">Règle RGIE</div>
                                  <p className="text-[9.5px] text-slate-300 leading-relaxed italic">{app.rgie}</p>
                                </div>

                                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                                  <div className="text-[8px] font-black text-red-400 uppercase mb-1">Alerte sécurité normative</div>
                                  <p className="text-[9px] text-slate-300 leading-relaxed font-semibold">{app.alert}</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </motion.div>
                  ) : (
                    <motion.div
                      key="rcd-view-anim"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="w-full flex flex-col items-center"
                    >
                      <div className="text-[11px] font-black uppercase tracking-[0.3em] text-indigo-400/60 mb-10">
                        Visualisation de Répartition RCD (RGIE)
                      </div>

                      {(() => {
                        const app = rcdAppliances.find(a => a.id === selectedRcdAppliance) || rcdAppliances[0];
                        return (
                          <div className="relative w-full max-w-sm bg-slate-900 p-8 rounded-[3rem] border border-white/10 shadow-2xl space-y-6 overflow-hidden">
                            <div className="absolute top-0 right-0 p-8 opacity-5">
                              <ShieldCheck className="w-32 h-32 text-indigo-400 rotate-12" />
                            </div>

                            <div className="text-[11px] font-black uppercase tracking-wider text-slate-300 text-center border-b border-white/10 pb-4 mb-2">
                              Architecture de Protection RGIE
                            </div>

                            <div className="space-y-4">
                              {/* General Switch 300mA Block */}
                              <div className={`p-4 rounded-2xl border transition-all ${app.rcdValue.includes('300 mA') ? 'bg-indigo-950/40 border-indigo-500/40 shadow-[0_0_15px_rgba(99,102,241,0.2)]' : 'bg-black/25 border-white/5 opacity-50'}`}>
                                <div className="flex justify-between items-center">
                                  <div className="flex items-center gap-2">
                                    <Shield className={`w-5 h-5 ${app.rcdValue.includes('300 mA') ? 'text-indigo-400' : 'text-slate-500'}`} />
                                    <div>
                                      <div className="text-[8px] font-black uppercase text-slate-400">Sectionneur de tête</div>
                                      <div className="text-[11px] font-black text-white font-mono">Différentiel Général 300 mA</div>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <span className="text-[8px] font-bold text-indigo-400 block uppercase">Protection</span>
                                    <span className="text-[10px] font-mono font-black text-white">Incendie & Biens</span>
                                  </div>
                                </div>
                                {app.rcdValue.includes('300 mA') && (
                                  <div className="mt-3 text-[9px] text-slate-300 leading-relaxed border-t border-white/10 pt-2 font-medium">
                                    ⚡ <strong>Raccordement Direct :</strong> L'appareil est branché directement en aval de cette protection générale pour éviter les sauts intempestifs.
                                  </div>
                                )}
                              </div>

                              {/* Wet/People Protected 30mA Block */}
                              <div className={`p-4 rounded-2xl border transition-all ${app.rcdValue.includes('30 mA') ? 'bg-indigo-950/40 border-indigo-500/40 shadow-[0_0_15px_rgba(99,102,241,0.2)]' : 'bg-black/25 border-white/5 opacity-50'}`}>
                                <div className="flex justify-between items-center">
                                  <div className="flex items-center gap-2">
                                    <ShieldAlert className={`w-5 h-5 ${app.rcdValue.includes('30 mA') ? 'text-rose-400 animate-pulse' : 'text-slate-500'}`} />
                                    <div>
                                      <div className="text-[8px] font-black uppercase text-slate-400">Protection Personne</div>
                                      <div className="text-[11px] font-black text-white font-mono">Haute Sensibilité 30 mA</div>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <span className="text-[8px] font-bold text-rose-400 block uppercase font-mono">Impératif</span>
                                    <span className="text-[10px] font-mono font-black text-white font-semibold">Humide / Main</span>
                                  </div>
                                </div>
                                {app.rcdValue.includes('30 mA') && (
                                  <div className="mt-3 text-[9px] text-slate-300 leading-relaxed border-t border-white/10 pt-2 font-medium">
                                    ⚡ <strong>Haute Sensibilité active :</strong> L'exposition directe à l'eau ou la manipulation de prises mobiles nécessite une coupure ultra-rapide (30mA). Max 8 circuits par 30 mA.
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="p-4 bg-black/40 rounded-2xl border border-white/5 space-y-2">
                              <div className="flex items-center gap-1.5 mb-1">
                                <Info className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                                <span className="text-[8px] font-bold text-white uppercase tracking-wider">Avis de l'Expert Technique</span>
                              </div>
                              <p className="text-[9px] text-zinc-400 leading-relaxed italic">
                                "Pour {app.name}, la prescription normative est {app.rcdValue} car le RGIE veut un équilibre idéal entre sécurité humaine active (contacts d'un corps humide) et la continuité de fonctionnement."
                              </p>
                            </div>
                          </div>
                        );
                      })()}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ) : activeTab === 'salledeau' ? (
                        (() => {
                          const { isConforme, reasons, ipNeeded, activeZoneName, formatZoneLabel } = bathDiagnostic;
                          return (
                            <motion.div 
                    key="salledeau-view"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="w-full h-full flex flex-col justify-start text-left space-y-4 font-sans"
                  >
                    <div className="flex justify-between items-center mb-1">
                      <div className="text-[11px] font-black uppercase tracking-[0.2em] text-text-muted">
                        Volume de Sécurité • Salle d'Eau & Douche
                      </div>
                      <div className="px-3 py-1 bg-sky-100 text-sky-800 text-[9px] font-black rounded-lg uppercase tracking-wider">
                        {bathStandardYear === 'POST_2025' ? 'Norme post-Mars 2025 Actuelle' : 'Norme pré-Mars 2025 de référence'}
                      </div>
                    </div>

                    {/* 2025 Regulation Core Banner */}
                    <div className="bg-gradient-to-r from-sky-900 to-indigo-950 p-4 rounded-2xl border border-sky-800/60 shadow-md text-white space-y-1.5 relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-1 bg-sky-500 text-indigo-950 text-[7px] font-black uppercase tracking-widest rounded-bl-xl shadow-md">
                        Mise à jour RGIE
                      </div>
                      <div className="flex items-center gap-1.5">
                        <ShieldAlert className="w-4 h-4 text-sky-400" />
                        <span className="text-[10.5px] font-black uppercase tracking-wider text-sky-300">
                          Évolution RGIE Livre 1 : Raccordement Salle d'Eau (1er Mars 2025)
                        </span>
                      </div>
                      <p className="text-[10px] text-sky-200/90 leading-normal font-medium">
                        Pour garantir la sécurité, la définition des volumes de douche a été simplifiée et durcie au 1er mars 2025. 
                        Le <strong>Volume 2</strong> a été supprimé pour les douches pour laisser place à un <strong>Volume 1 élargi</strong> à un rayon de <strong>1,20 m</strong> de la source d'eau fixe.
                      </p>
                    </div>

                    {/* Tester output with clear logic */}
                    <div className={`p-4 rounded-2xl border flex flex-col gap-3 text-left ${isConforme ? 'bg-emerald-50 border-emerald-200 text-emerald-950 shadow-sm' : 'bg-red-50/90 border-red-200 text-red-950 shadow-sm'}`}>
                      <div className="flex items-start gap-2.5">
                        {isConforme ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                        ) : (
                          <ShieldAlert className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                        )}
                        <div>
                          <div className="text-[10px] font-black uppercase tracking-wider block mb-0.5">
                            Diagnostic : {isConforme ? 'Configuration Conforme ✅' : 'Non Conforme ❌'}
                          </div>
                          <p className="text-[11px] font-semibold leading-relaxed">
                            {isConforme ? (
                              <span>
                                Cette configuration d'appareillage en <strong>{formatZoneLabel(activeZoneName)}</strong> respecte scrupuleusement le RGIE {bathStandardYear === 'POST_2025' ? 'Livre 1 post-Mars 2025' : 'ancien'}.
                                {bathStandardYear === 'POST_2025' && testPlacementZone === 'volume_1bis' && (
                                  <span className="block mt-1.5 p-1.5 bg-emerald-100 rounded text-[9.5px]/1.4 font-medium text-emerald-800 border border-emerald-200">
                                    💡 <strong>Note de transition RGIE 2025</strong> : L'espace d'ancien Volume 1bis (sous la baignoire) fait désormais partie intégrante du <strong>Volume 1</strong>. Les conditions réglementaires strictes du Volume 1 sont bien respectées.
                                  </span>
                                )}
                              </span>
                            ) : (
                              <span>
                                Non conforme réglementairement ! Risque d'infraction de sécurité ou danger d'électrocution.
                                {bathStandardYear === 'POST_2025' && testPlacementZone === 'volume_1bis' && (
                                  <span className="block mt-1.5 p-1.5 bg-red-100/90 rounded text-[9.5px]/1.4 font-medium text-red-900 border border-red-200">
                                    ⚠️ <strong>Note de transition RGIE 2025</strong> : L'espace d'ancien Volume 1bis (sous la baignoire) est désormais régi par le <strong>Volume 1</strong>. Votre équipement n'est pas conforme aux exigences strictes du Volume 1 !
                                  </span>
                                )}
                              </span>
                            )}
                          </p>
                        </div>
                      </div>

                      {!isConforme && reasons.length > 0 && (
                        <div className="pl-7 text-[10.5px] space-y-1.5 border-t border-red-200/50 pt-2 text-red-800">
                          {reasons.map((r, idx) => (
                            <div key={idx} className="flex gap-1.5 items-start">
                              <span className="text-red-500 font-bold">&#8226;</span>
                              <span>{r}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className={`grid grid-cols-2 gap-2 text-[10px] font-semibold border-t border-dotted p-2 rounded-lg ${isConforme ? 'bg-emerald-100/50 border-emerald-300 text-emerald-800' : 'bg-red-100/40 border-red-300 text-red-800'}`}>
                        <div>
                          <span className="text-[8px] font-black uppercase block opacity-60">Indice IP mesuré / Requis</span>
                          <span className="font-mono text-xs uppercase">{testIpRating.toUpperCase()} / {ipNeeded}</span>
                        </div>
                        <div>
                          <span className="text-[8px] font-black uppercase block opacity-60">Mode de Connexion</span>
                          <span className="text-[10.5px] font-bold">{testConnectionType === 'direct' ? 'Directe Fixe Permanente' : 'Prise & Fiche mobile'}</span>
                        </div>
                      </div>

                      {testEquipmentType === 'light' && activeZoneName === 'volume_1' && (
                        <div className={`p-3 rounded-xl border text-[10px] space-y-1.5 font-medium leading-relaxed ${isConforme ? 'bg-emerald-100/40 border-emerald-200 text-emerald-900' : 'bg-red-100/50 border-red-200 text-red-905'}`}>
                          <div className="flex items-center gap-1.5 font-black text-xs uppercase tracking-wide">
                            <span className="text-sm">💡</span> Focus Réglementaire : Lampe LED en Volume 1 (Hauteur &le; 2,25 m)
                          </div>
                          <p>
                            Pour installer légalement un luminaire LED au sein du <strong>Volume 1</strong>, le RGIE dicte 5 conditions drastiques :
                          </p>
                          <ul className="list-disc pl-4 space-y-1.5">
                            <li>
                              <strong>Luminaire fixe uniquement</strong> : L'équipement doit être fixe. Toute lampe baladeuse, mobile ou portative est strictement proscrite.
                            </li>
                            <li>
                              <strong>Connexion permanente</strong> : Pas de branchement sur socle de prise. Le câblage doit être raccordé en direct dans une boîte de connexion appropriée étanche.
                            </li>
                            <li>
                              <strong>Étanchéité IPX4 minimale</strong> : En Volume 1, l'exposition directe aux projections d'eau exige au moins un indice d'étanchéité <strong>IPX4</strong> (ou IPX7).
                            </li>
                            <li>
                              <strong>Règles d'alimentation & Transformateur</strong> :
                              <ul className="list-circle pl-4 mt-1 space-y-1 opacity-90">
                                <li><em>Option Basse tension (230V)</em> : Luminaire obligatoirement de Classe II (double isolation) et protégé en amont par un différentiel à haute sensibilité de 30 mA maximum.</li>
                                <li><em>Option Très Basse Tension (TBTS 12V)</em> : Le transformateur d'isolement (driver de la LED) doit être obligatoirement placé <strong>hors des Volumes 0 et 1</strong>.</li>
                              </ul>
                            </li>
                            <li>
                              <strong>Interrupteur interdit</strong> : Aucun interrupteur fonctionnant en tension réseau (230V) n'est autorisé dans le Volume 1. Seuls les boutons-poussoirs ou commandes de commande TBTS (TBTS ≤ 12V AC) y sont permis.
                            </li>
                          </ul>
                        </div>
                      )}
                    </div>

                    {/* Main Interactive Visual Mockup with dynamic volumes */}
                    <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm text-center">
                      {!isConforme && (
                        <div id="diagnostic-drawing-alert" className="mb-4 p-4 rounded-2xl border bg-red-50/95 border-red-200 text-red-950 text-left shadow-sm animate-fadeIn">
                          <div className="flex items-start gap-2.5">
                            <ShieldAlert className="w-5 h-5 text-red-650 shrink-0 mt-0.5" />
                            <div>
                              <div className="text-[10px] font-black uppercase tracking-wider block mb-0.5 text-red-800">
                                Diagnostic : Non Conforme ❌
                              </div>
                              <p className="text-[11px] font-heavy leading-relaxed text-red-900">
                                Non conforme réglementairement ! Risque d'infraction de sécurité ou danger d'électrocution.
                              </p>
                              <p className="text-[11px] font-medium leading-relaxed text-red-800 mt-1.5">
                                • Aucun appareillage sous tension standard 230V n'est admis dans le Volume 0. Seul le matériel strictement nécessaire (comme l'éclairage intégré) en TBTS ≤ 12V AC ou 18V DC est autorisé.
                              </p>
                              {reasons.length > 0 && (
                                <div className="mt-2 text-[10.5px] space-y-1 font-medium border-t border-red-200/50 pt-1.5 text-red-900">
                                  {reasons.map((r, idx) => (
                                    <div key={idx} className="flex gap-1.5 items-start">
                                      <span className="text-red-500 font-bold">&#8226;</span>
                                      <span>{r}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2 font-mono">Représentation interactive des volumes</div>
                  
                  {bathEquipmentType === 'shower' ? (
                    /* SHOWER MODE VIEW (BEAUTIFUL HIGH-RES INTERACTIVE SVG SCHEMATIC) */
                    <div className="relative w-full h-[280px] flex flex-col justify-center items-center overflow-hidden animate-fadeIn bg-white rounded-xl border border-slate-200">
                      <svg viewBox="0 0 540 280" className="w-full h-full cursor-default">
                        <defs>
                          <pattern id="shower-tile-grid" width="20" height="20" patternUnits="userSpaceOnUse">
                            <rect width="20" height="20" fill="none" stroke="#f1f5f9" strokeWidth="0.8" />
                          </pattern>
                          <filter id="shower-glow" x="-15%" y="-15%" width="130%" height="130%">
                            <feDropShadow dx="0" dy="0" stdDeviation="5" floodColor="#2563eb" floodOpacity="0.45"/>
                          </filter>
                          
                          <linearGradient id="vol0-grad" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.10" />
                            <stop offset="100%" stopColor="#e11d48" stopOpacity="0.16" />
                          </linearGradient>
                          <linearGradient id="active-vol0-grad" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.32" />
                            <stop offset="100%" stopColor="#e11d48" stopOpacity="0.48" />
                          </linearGradient>

                          <linearGradient id="vol1-grad" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#f97316" stopOpacity="0.08" />
                            <stop offset="100%" stopColor="#ea580c" stopOpacity="0.14" />
                          </linearGradient>
                          <linearGradient id="active-vol1-grad" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#f97316" stopOpacity="0.28" />
                            <stop offset="100%" stopColor="#ea580c" stopOpacity="0.42" />
                          </linearGradient>

                          <linearGradient id="vol2-grad" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#eab308" stopOpacity="0.08" />
                            <stop offset="100%" stopColor="#ca8a04" stopOpacity="0.13" />
                          </linearGradient>
                          <linearGradient id="active-vol2-grad" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#eab308" stopOpacity="0.28" />
                            <stop offset="100%" stopColor="#ca8a04" stopOpacity="0.40" />
                          </linearGradient>

                          <linearGradient id="vol3-grad" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#10b981" stopOpacity="0.04" />
                            <stop offset="100%" stopColor="#059669" stopOpacity="0.08" />
                          </linearGradient>
                          <linearGradient id="active-vol3-grad" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#10b981" stopOpacity="0.18" />
                            <stop offset="100%" stopColor="#059669" stopOpacity="0.30" />
                          </linearGradient>

                          <linearGradient id="hardware-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#cbd5e1" />
                            <stop offset="50%" stopColor="#94a3b8" />
                            <stop offset="100%" stopColor="#475569" />
                          </linearGradient>
                        </defs>

                        {/* Subtle interactive mosaic tiles background */}
                        <rect width="100%" height="100%" fill="url(#shower-tile-grid)" />

                        {/* Click background to select Lieu L */}
                        <rect 
                          width="100%" 
                          height="100%" 
                          fill="transparent" 
                          onClick={() => setTestPlacementZone('lieu_l')} 
                        />

                        {/* Room outline floor line */}
                        <line x1="15" y1="230" x2="525" y2="230" stroke="#475569" strokeWidth="2.5" />
                        <line x1="60" y1="15" x2="60" y2="230" stroke="#94a3b8" strokeWidth="2" />

                        {/* -------------------- SAFETY VOLUMES LAYERS -------------------- */}

                        {/* 0.5 VOLUME 3 / LIEU L (SAFE ZONE) */}
                        {(() => {
                          const vol3StartX = bathStandardYear === 'POST_2025' ? 180 : 210;
                          const vol3Width = 540 - vol3StartX;
                          return (
                            <g>
                              <rect 
                                x={vol3StartX} 
                                y="45" 
                                width={vol3Width} 
                                height="185" 
                                rx="4" 
                                fill={testPlacementZone === 'lieu_l' ? 'url(#active-vol3-grad)' : 'url(#vol3-grad)'} 
                                stroke={testPlacementZone === 'lieu_l' ? '#10b981' : '#a7f3d0'} 
                                strokeWidth={testPlacementZone === 'lieu_l' ? '2.5' : '1.2'} 
                                strokeDasharray={testPlacementZone === 'lieu_l' ? '0' : '4,3'}
                                className="cursor-pointer transition-all hover:brightness-105" 
                                style={testPlacementZone === 'lieu_l' ? { filter: 'url(#shower-glow)' } : {}}
                                onClick={(e) => { e.stopPropagation(); setTestPlacementZone('lieu_l'); }}
                              />
                              <text 
                                x={vol3StartX + vol3Width / 2} 
                                y="80" 
                                textAnchor="middle" 
                                className={`text-[9px] font-black uppercase tracking-wider select-none pointer-events-none ${testPlacementZone === 'lieu_l' ? 'fill-emerald-800' : 'fill-emerald-600/80'}`}
                              >
                                {bathStandardYear === 'POST_2025' ? 'Lieu L' : 'Volume 3'}
                              </text>
                              <text 
                                x={vol3StartX + vol3Width / 2} 
                                y="90" 
                                textAnchor="middle" 
                                className={`text-[7px] font-bold select-none pointer-events-none ${testPlacementZone === 'lieu_l' ? 'fill-emerald-700' : 'fill-emerald-500/85'}`}
                              >
                                {bathStandardYear === 'POST_2025' ? 'Hors Volume (Lieu L)' : 'Lieu de sécurité (Vol. 3)'}
                              </text>
                            </g>
                          );
                        })()}
                        
                        {/* 1. VOLUME 1 ZONE */}
                        {(() => {
                          const vol1Width = bathStandardYear === 'POST_2025' ? 120 : 90;
                          return (
                            <g>
                              <rect 
                                x="60" 
                                y="45" 
                                width={vol1Width} 
                                height="170" 
                                rx="4" 
                                fill={testPlacementZone === 'volume_1' ? 'url(#active-vol1-grad)' : 'url(#vol1-grad)'} 
                                stroke={testPlacementZone === 'volume_1' ? '#ea580c' : '#fdba74'} 
                                strokeWidth={testPlacementZone === 'volume_1' ? '2.5' : '1.2'} 
                                className="cursor-pointer transition-all hover:brightness-105" 
                                style={testPlacementZone === 'volume_1' ? { filter: 'url(#shower-glow)' } : {}}
                                onClick={(e) => { e.stopPropagation(); setTestPlacementZone('volume_1'); }}
                              />
                              <text 
                                x={60 + vol1Width / 2} 
                                y="80" 
                                textAnchor="middle" 
                                className={`text-[9px] font-black uppercase tracking-wider select-none pointer-events-none ${testPlacementZone === 'volume_1' ? 'fill-orange-800' : 'fill-orange-600/80'}`}
                              >
                                Volume 1
                              </text>
                              <text 
                                x={60 + vol1Width / 2} 
                                y="90" 
                                textAnchor="middle" 
                                className={`text-[7px] font-bold select-none pointer-events-none ${testPlacementZone === 'volume_1' ? 'fill-orange-700' : 'fill-orange-500/80'}`}
                              >
                                {bathStandardYear === 'POST_2025' ? 'Max 1,20 m élargi' : 'Espace receveur (0,60 m)'}
                              </text>
                            </g>
                          );
                        })()}

                        {/* 2. VOLUME 2 ZONE (Only present in PRE_2025/Older RGIE) */}
                        {bathStandardYear === 'PRE_2025' && (
                          <g>
                            <rect 
                              x="150" 
                              y="45" 
                              width="60" 
                              height="185" 
                              rx="4" 
                              fill={testPlacementZone === 'volume_2' ? 'url(#active-vol2-grad)' : 'url(#vol2-grad)'} 
                              stroke={testPlacementZone === 'volume_2' ? '#ca8a04' : '#fef08a'} 
                              strokeWidth={testPlacementZone === 'volume_2' ? '2.5' : '1.2'} 
                              strokeDasharray={testPlacementZone === 'volume_2' ? '0' : '4,3'}
                              className="cursor-pointer transition-all hover:brightness-105" 
                              style={testPlacementZone === 'volume_2' ? { filter: 'url(#shower-glow)' } : {}}
                              onClick={(e) => { e.stopPropagation(); setTestPlacementZone('volume_2'); }}
                            />
                            <text 
                              x="180" 
                              y="80" 
                              textAnchor="middle" 
                              className={`text-[8.5px] font-black uppercase tracking-wider select-none pointer-events-none ${testPlacementZone === 'volume_2' ? 'fill-yellow-800' : 'fill-yellow-600/85'}`}
                            >
                              Volume 2
                            </text>
                            <text 
                              x="180" 
                              y="90" 
                              textAnchor="middle" 
                              className={`text-[6.5px] font-black select-none pointer-events-none ${testPlacementZone === 'volume_2' ? 'fill-yellow-700' : 'fill-yellow-600/70'}`}
                            >
                              +0,60 m (IPX4)
                            </text>
                          </g>
                        )}

                        {/* 3. VOLUME 0 ZONE (Inside the low-profile shower tray) */}
                        <g>
                          <rect 
                            x="60" 
                            y="215" 
                            width="90" 
                            height="15" 
                            rx="2.5" 
                            fill={testPlacementZone === 'volume_0' ? 'url(#active-vol0-grad)' : 'url(#vol0-grad)'} 
                            stroke={testPlacementZone === 'volume_0' ? '#e11d48' : '#fda4af'} 
                            strokeWidth={testPlacementZone === 'volume_0' ? '2.5' : '1'} 
                            className="cursor-pointer transition-all hover:brightness-105" 
                            style={testPlacementZone === 'volume_0' ? { filter: 'url(#shower-glow)' } : {}}
                            onClick={(e) => { e.stopPropagation(); setTestPlacementZone('volume_0'); }}
                          />
                          <text 
                            x="105" 
                            y="225" 
                            textAnchor="middle" 
                            className={`text-[7.5px] font-black tracking-widest select-none pointer-events-none ${testPlacementZone === 'volume_0' ? 'fill-rose-900' : 'fill-rose-700/80'}`}
                          >
                            VOLUME 0 (IMMERSION)
                          </text>
                        </g>

                        {/* -------------------- DECORATION & REAL DEPICTION OF SHOWER CABINET -------------------- */}

                        {/* Glass screen wall */}
                        <line x1="150" y1="65" x2="150" y2="230" stroke="#bae6fd" strokeWidth="3" strokeOpacity="0.75" pointerEvents="none" />
                        <line x1="150" y1="65" x2="150" y2="230" stroke="#ffffff" strokeWidth="1" strokeDasharray="6,15" strokeOpacity="0.9" pointerEvents="none" />

                        {/* Shower hardware: column and head */}
                        <rect x="62" y="32" width="4" height="198" fill="url(#hardware-grad)" rx="1" pointerEvents="none" />
                        {/* Overhead curved arm and head */}
                        <path d="M 64,42 Q 85,40 100,48 L 100,53" fill="none" stroke="url(#hardware-grad)" strokeWidth="4" strokeLinecap="round" pointerEvents="none" />
                        <polygon points="90,52 110,52 106,58 94,58" fill="url(#hardware-grad)" pointerEvents="none" />

                        {/* Shower mixer & handle */}
                        <circle cx="64" cy="140" r="5" fill="#334155" stroke="#94a3b8" strokeWidth="1" pointerEvents="none" />
                        <line x1="64" y1="140" x2="69" y2="135" stroke="#475569" strokeWidth="2.5" strokeLinecap="round" pointerEvents="none" />

                        {/* Water Spray Paths (Cascade effects) */}
                        <path d="M 94,58 Q 91,100 88,215 M 97,58 Q 97,110 95,215 M 100,58 L 100,215 M 103,58 Q 103,110 105,215 M 106,58 Q 109,100 112,215" stroke="#38bdf8" strokeWidth="1" strokeDasharray="3,5" opacity="0.5" strokeLinecap="round" pointerEvents="none" />

                        {/* Decorative: Wooden Ladder hanger */}
                        <line x1="340" y1="45" x2="340" y2="230" stroke="#d97706" strokeWidth="3.2" strokeLinecap="round" pointerEvents="none" />
                        <line x1="385" y1="45" x2="385" y2="230" stroke="#d97706" strokeWidth="3.2" strokeLinecap="round" pointerEvents="none" />
                        <line x1="340" y1="80" x2="385" y2="80" stroke="#b45309" strokeWidth="2" pointerEvents="none" />
                        <line x1="340" y1="125" x2="385" y2="125" stroke="#b45309" strokeWidth="2" pointerEvents="none" />
                        <line x1="340" y1="170" x2="385" y2="170" stroke="#b45309" strokeWidth="2" pointerEvents="none" />
                        <line x1="340" y1="210" x2="385" y2="210" stroke="#b45309" strokeWidth="2" pointerEvents="none" />
                        {/* Towel block */}
                        <rect x="345" y="125" width="35" height="35" rx="1.5" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="0.8" pointerEvents="none" />
                        <line x1="345" y1="150" x2="380" y2="150" stroke="#cbd5e1" strokeWidth="0.8" strokeDasharray="2,2" pointerEvents="none" />
                        <text x="362" y="244" className="text-[8px] font-black fill-slate-500" textAnchor="middle" pointerEvents="none">Échelle Déco</text>

                        {/* Decorative: Styled Houseplant and planter pot */}
                        <rect x="430" y="210" width="24" height="20" rx="3" fill="#475569" stroke="#334155" strokeWidth="1" pointerEvents="none" />
                        <path d="M 442,210 C 445,190 460,185 465,180 C 458,192 448,202 442,210" fill="#15803d" pointerEvents="none" />
                        <path d="M 442,210 C 438,190 422,185 417,180 C 424,192 434,202 442,210" fill="#166534" pointerEvents="none" />
                        <path d="M 442,210 C 447,196 452,196 455,210" fill="#15803d" pointerEvents="none" />
                        <text x="442" y="244" className="text-[8px] font-black fill-slate-500" textAnchor="middle" pointerEvents="none">Plante Verte</text>

                        {/* -------------------- MEASUREMENTS & BOUNDARY DIMENSION LABELS -------------------- */}
                        
                        {bathStandardYear === 'POST_2025' ? (
                          /* POST_2025: Rayon 1.20 m extended arrow + Lieu L width 2.80 m */
                          <g className="pointer-events-none">
                            {/* Volume 1 */}
                            <line x1="60" y1="120" x2="180" y2="120" stroke="#ea580c" strokeWidth="1.2" strokeDasharray="3,2" />
                            <circle cx="60" cy="120" r="2.5" fill="#ea580c" />
                            <circle cx="180" cy="120" r="2.5" fill="#ea580c" />
                            <g transform="translate(120, 115)">
                              <rect x="-26" y="-8" width="52" height="15" rx="3" fill="#ffffff" stroke="#ea580c" strokeWidth="0.8" />
                              <text x="0" y="2" className="text-[8.5px] font-extrabold" fill="#ea580c" textAnchor="middle">R = 1,20 m</text>
                            </g>

                            {/* Lieu L */}
                            <line x1="180" y1="120" x2="460" y2="120" stroke="#10b981" strokeWidth="1.2" strokeDasharray="3,2" />
                            <line x1="460" y1="112" x2="460" y2="128" stroke="#10b981" strokeWidth="1.2" />
                            <circle cx="180" cy="120" r="2.5" fill="#10b981" />
                            <circle cx="460" cy="120" r="2.5" fill="#10b981" />
                            <g transform="translate(320, 115)">
                              <rect x="-65" y="-8" width="130" height="15" rx="3" fill="#ffffff" stroke="#10b981" strokeWidth="0.8" />
                              <text x="0" y="2" className="text-[8.5px] font-bold" fill="#047857" textAnchor="middle">L = 2,80 m (Tot: 4,00 m)</text>
                            </g>
                          </g>
                        ) : (
                          /* PRE_2025: Receveur 0.60m + Vol 2 0.60m + Vol 3 2.40m arrows */
                          <g className="pointer-events-none">
                            {/* Receveur length 0.60 m */}
                            <line x1="60" y1="105" x2="150" y2="105" stroke="#ea580c" strokeWidth="1" strokeDasharray="3,2" />
                            <circle cx="60" cy="105" r="2" fill="#ea580c" />
                            <circle cx="150" cy="105" r="2" fill="#ea580c" />
                            <g transform="translate(105, 100)">
                              <rect x="-22" y="-7" width="44" height="13" rx="2" fill="#ffffff" stroke="#ea580c" strokeWidth="0.8" />
                              <text x="0" y="2.5" className="text-[8.5px] font-black" fill="#ea580c" textAnchor="middle">0,60 m</text>
                            </g>

                            {/* Volume 2 padding 0.60 m */}
                            <line x1="150" y1="150" x2="210" y2="150" stroke="#ca8a04" strokeWidth="1" strokeDasharray="3,2" />
                            <circle cx="150" cy="150" r="2" fill="#ca8a04" />
                            <circle cx="210" cy="150" r="2" fill="#ca8a04" />
                            <g transform="translate(180, 145)">
                              <rect x="-22" y="-7" width="44" height="13" rx="2" fill="#ffffff" stroke="#ca8a04" strokeWidth="0.8" />
                              <text x="0" y="2.5" className="text-[8.5px] font-black" fill="#ca8a04" textAnchor="middle">0,60 m</text>
                            </g>

                            {/* Volume 3 padding 2.40 m */}
                            <line x1="210" y1="105" x2="540" y2="105" stroke="#10b981" strokeWidth="1" strokeDasharray="3,2" />
                            <circle cx="210" cy="105" r="2.5" fill="#10b981" />
                            <circle cx="540" cy="105" r="2.5" fill="#10b981" />
                            <g transform="translate(375, 100)">
                              <rect x="-35" y="-7" width="70" height="13" rx="2" fill="#ffffff" stroke="#10b981" strokeWidth="0.8" />
                              <text x="0" y="2.5" className="text-[8.5px] font-black" fill="#059669" textAnchor="middle">L = 2,40 m</text>
                            </g>
                          </g>
                        )}

                        {/* Visual helper badge */}
                        <g transform="translate(265, 265)" className="pointer-events-none select-none">
                          <text x="0" y="0" className="text-[9.5px] font-bold fill-slate-500" textAnchor="middle">
                            CLIQUEZ SUR VOL 0, VOL 1, VOL 2 OU L'ESPACE VERT (VOL 3 / LIEU L) POUR SIMULER
                          </text>
                        </g>
                      </svg>

                      {/* Floating pill indicators */}
                      {/* Lieu L indicator */}
                      <div 
                        className={`absolute top-2 left-2 flex flex-col items-start p-1.5 rounded-lg border transition-all duration-300 cursor-pointer ${
                          testPlacementZone === 'lieu_l' 
                            ? 'bg-emerald-100 border-emerald-500 text-emerald-950 ring-2 ring-emerald-500/20 shadow-md' 
                            : 'bg-white/80 border-slate-200 text-slate-500 hover:bg-white'
                        }`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setTestPlacementZone('lieu_l');
                        }}
                      >
                        <span className={`px-1 py-0.5 rounded text-[7.5px] font-black uppercase tracking-wider ${testPlacementZone === 'lieu_l' ? 'bg-emerald-200 text-emerald-900' : 'bg-emerald-50 text-emerald-800'}`}>
                          {bathStandardYear === 'POST_2025' ? 'Lieu L (Hors volumes)' : 'Volume 3 (Hors volumes)'}
                        </span>
                        <span className="text-[7px] text-slate-400 italic">
                          {bathStandardYear === 'POST_2025' ? 'Cliquez pour tester hors volumes' : 'Cliquez pour tester Volume 3'}
                        </span>
                      </div>

                      <div className="absolute top-2 right-2 p-1.5 bg-white border border-slate-200 rounded-lg text-[7.5px] font-bold text-slate-500 font-sans shadow-xs">
                        {bathStandardYear === 'POST_2025' ? '🚫 Aucun Volume 2' : '✅ Volume 2 Présent'}
                      </div>
                    </div>
                  ) : (
                    /* BATHTUB MODE VIEW */
                    <div className="flex flex-col space-y-3.5 w-full border border-slate-200/80 rounded-2xl p-4 bg-gradient-to-b from-slate-50 to-slate-100 animate-fadeIn relative text-left">
                      {/* Subtab inside bathtub layout */}
                      <div className="flex flex-wrap justify-between items-center gap-2 border-b border-slate-200 pb-3">
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                          Mode de modélisation
                        </span>
                        <div className="flex gap-1 p-1 bg-slate-200/70 rounded-xl text-[9px] font-black uppercase tracking-wider shadow-inner max-w-full overflow-x-auto">
                          <button 
                            type="button"
                            onClick={() => setBathtubViewMode('plan')}
                            className={`px-3 py-1.5 rounded-lg transition-all text-center whitespace-nowrap ${bathtubViewMode === 'plan' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
                          >
                            🌐 Plan de dessus (2D)
                          </button>
                          <button 
                            type="button"
                            onClick={() => setBathtubViewMode('coupe')}
                            className={`px-3 py-1.5 rounded-lg transition-all text-center whitespace-nowrap ${bathtubViewMode === 'coupe' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
                          >
                            📸 Coupe Profil (Vol 1bis)
                          </button>
                        </div>
                      </div>

                      {/* Adjustable parameters for wrapping simulation (Plan & Perspective modes) */}
                      {bathtubViewMode !== 'coupe' && (
                        <div className="bg-white p-3 rounded-xl border border-slate-200/60 shadow-sm grid grid-cols-1 sm:grid-cols-2 gap-3 mb-1 text-xs">
                          <div className="space-y-1.5">
                            <div className="flex justify-between items-center">
                              <span className="font-bold text-slate-700 flex items-center gap-1.5">
                                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block"></span>
                                Paroi vitrée de séparation
                              </span>
                              <button
                                type="button"
                                onClick={() => setHasGlassPartition(!hasGlassPartition)}
                                className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider transition-all ${hasGlassPartition ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'}`}
                              >
                                {hasGlassPartition ? 'Activée' : 'Désactivée'}
                              </button>
                            </div>
                            <p className="text-[10px] text-slate-400 italic leading-snug">
                              La présence d'un écran fixe force les volumes à contourner la paroi (règle du fil tendu de 0,60 m).
                            </p>
                          </div>

                          {hasGlassPartition && (
                            <div className="space-y-1.5">
                              <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-wider text-slate-500">
                                <span>Longueur de la paroi</span>
                                <span className="text-indigo-600 font-bold">{glassPartitionDepth.toFixed(2)} m</span>
                              </div>
                              <input 
                                type="range" 
                                min="0.4" 
                                max="1.4" 
                                step="0.2" 
                                value={glassPartitionDepth}
                                onChange={(e) => setGlassPartitionDepth(parseFloat(e.target.value))}
                                className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                              />
                              <div className="flex justify-between text-[8px] text-slate-400 font-bold">
                                <span>Court (0.4 m)</span>
                                <span>Moyen (0.8 m)</span>
                                <span>Long (1.4 m)</span>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Views */}
                      {bathtubViewMode === 'coupe' ? (
                        /* SECTION TECHNIQUE ACCORDING TO USER DIAGRAM 1 */
                        <div className="relative w-full h-56 flex flex-col justify-center items-center overflow-hidden animate-fadeIn bg-white rounded-xl border border-slate-200">
                          <svg viewBox="0 0 500 230" className="w-full h-full max-w-[480px]">
                            <defs>
                              <filter id="glow-vol0" x="-10%" y="-10%" width="120%" height="120%">
                                <feDropShadow dx="0" dy="0" stdDeviation="6" floodColor="#0284c7" floodOpacity="0.8"/>
                              </filter>
                              <filter id="glow-vol1bis" x="-10%" y="-10%" width="120%" height="120%">
                                <feDropShadow dx="0" dy="0" stdDeviation="6" floodColor="#a855f7" floodOpacity="0.8"/>
                              </filter>
                              <linearGradient id="ceramic-edge-grad" x1="0%" y1="0%" x2="0%" y2="100%">
                                <stop offset="0%" stopColor="#ffffff" />
                                <stop offset="55%" stopColor="#f8fafc" />
                                <stop offset="100%" stopColor="#cbd5e1" />
                              </linearGradient>
                              <linearGradient id="water-grad-coupe" x1="0%" y1="0%" x2="0%" y2="100%">
                                <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.85" />
                                <stop offset="70%" stopColor="#0284c7" stopOpacity="0.65" />
                                <stop offset="100%" stopColor="#0369a1" stopOpacity="0.85" />
                              </linearGradient>
                              <linearGradient id="water-grad-highlight" x1="0%" y1="0%" x2="0%" y2="100%">
                                <stop offset="0%" stopColor="#fca5a5" stopOpacity="0.9" />
                                <stop offset="100%" stopColor="#ef4444" stopOpacity="0.8" />
                              </linearGradient>
                              <linearGradient id="chrome-grad-coupe" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="#e2e8f0" />
                                <stop offset="40%" stopColor="#ffffff" />
                                <stop offset="80%" stopColor="#94a3b8" />
                                <stop offset="100%" stopColor="#475569" />
                              </linearGradient>
                              <style>{`
                                @keyframes pulse-purple-glow {
                                  0% { fill: #ebd5fc; stroke: #a855f7; stroke-width: 1.5px; }
                                  50% { fill: #f3e8ff; stroke: #c084fc; stroke-width: 2.2px; }
                                  100% { fill: #ebd5fc; stroke: #a855f7; stroke-width: 1.5px; }
                                }
                                .pulse-tech-rect {
                                  animation: pulse-purple-glow 2.5s infinite ease-in-out;
                                  transition: all 0.2s ease-in-out;
                                }
                                .g-vol1bis:hover .pulse-tech-rect {
                                  animation: none;
                                  fill: #f5e6ff !important;
                                  stroke: #a855f7 !important;
                                  stroke-width: 3px !important;
                                  cursor: pointer;
                                }
                              `}</style>
                            </defs>

                            {/* Base ground plate */}
                            <line x1="15" y1="200" x2="485" y2="200" stroke="#475569" strokeWidth="3" />

                            {/* Adjustable support feet legs under the tub for spatial realism */}
                            <g opacity="0.85">
                              {/* Left adjustable set */}
                              <rect x="110" y="155" width="20" height="8" fill="#94a3b8" stroke="#475569" strokeWidth="1" />
                              <rect x="117" y="163" width="6" height="32" fill="url(#chrome-grad-coupe)" stroke="#475569" strokeWidth="0.75" />
                              <rect x="102" y="195" width="36" height="5" rx="1.5" fill="#475569" />
                              
                              {/* Right adjustable set */}
                              <rect x="370" y="155" width="20" height="8" fill="#94a3b8" stroke="#475569" strokeWidth="1" />
                              <rect x="377" y="163" width="6" height="32" fill="url(#chrome-grad-coupe)" stroke="#475569" strokeWidth="0.75" />
                              <rect x="362" y="195" width="36" height="5" rx="1.5" fill="#475569" />
                            </g>

                            {/* Chrome plumbing trap and drain siphon assembly */}
                            <g opacity="0.9">
                              {/* Center bathtub drain pop-up */}
                              <rect x="242" y="155" width="16" height="4" fill="url(#chrome-grad-coupe)" stroke="#334155" strokeWidth="0.75" />
                              {/* Siphon tube routing to ground */}
                              <path d="M 250,159 L 250,172 A 10,10 0 0,0 260,182 L 285,182 L 285,200" fill="none" stroke="url(#chrome-grad-coupe)" strokeWidth="6" strokeLinecap="round" />
                              <path d="M 250,159 L 250,172 A 10,10 0 0,0 260,182 L 285,182 L 285,200" fill="none" stroke="#e2e8f0" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="3,3" />
                            </g>

                            {/* Outer vertical borders: Left/Right casing column (tablier) representing full structure */}
                            <rect x="25" y="30" width="15" height="170" fill={bathStandardYear === 'POST_2025' ? '#bae6fd' : '#ebd5fc'} stroke="#1e293b" strokeWidth="2" />
                            <rect x="460" y="30" width="15" height="170" fill={bathStandardYear === 'POST_2025' ? '#bae6fd' : '#ebd5fc'} stroke="#1e293b" strokeWidth="2" />
                            
                            {/* Top solid flat edge/lip rim of outer casing/walls */}
                            <rect x="25" y="20" width="450" height="10" fill={bathStandardYear === 'POST_2025' ? '#bae6fd' : '#ebd5fc'} stroke="#1e293b" strokeWidth="2" />

                            {/* Lavender backing representing Volume 1bis (technical space under bath and behind tablier) */}
                            <g 
                              className="cursor-pointer g-vol1bis group"
                              onClick={() => {
                                if (bathStandardYear === 'POST_2025') {
                                  setTestPlacementZone('volume_1');
                                } else {
                                  setTestPlacementZone('volume_1bis');
                                }
                                setVol1bisTooltipVisible(true);
                              }}
                            >
                              <rect 
                                x="40" 
                                y="30" 
                                width="420" 
                                height="170" 
                                fill={
                                  bathStandardYear === 'POST_2025' 
                                    ? (testPlacementZone === 'volume_1' ? '#bae6fd' : '#f0f9ff') 
                                    : (testPlacementZone === 'volume_1bis' ? '#f5e6ff' : '#ebdbfa')
                                } 
                                stroke="#1e293b"
                                strokeWidth="1.5"
                                className={(bathStandardYear === 'POST_2025' ? testPlacementZone === 'volume_1' : testPlacementZone === 'volume_1bis') ? 'transition-all duration-300' : 'pulse-tech-rect'}
                                style={(bathStandardYear === 'POST_2025' ? testPlacementZone === 'volume_1' : testPlacementZone === 'volume_1bis') ? { filter: bathStandardYear === 'POST_2025' ? 'url(#glow-vol0)' : 'url(#glow-vol1bis)' } : {}}
                              />
                            </g>

                            {/* Elegant wall-mounted chrome bathtub mixer faucet on the left casing wall */}
                            <g transform="translate(42, 22)">
                              {/* Connector caps */}
                              <rect x="-10" y="2" width="10" height="16" rx="1.5" fill="url(#chrome-grad-coupe)" stroke="#334155" strokeWidth="0.75" />
                              {/* Main faucet cylinder bar */}
                              <rect x="0" y="4" width="22" height="12" rx="2" fill="url(#chrome-grad-coupe)" stroke="#334155" strokeWidth="1" />
                              {/* Chrome spout */}
                              <path d="M 12,16 L 12,25 Q 12,29 20,29 L 28,29" fill="none" stroke="url(#chrome-grad-coupe)" strokeWidth="4.5" strokeLinecap="round" />
                              {/* Sparkling falling water streams */}
                              <line x1="27" y1="31" x2="27" y2="120" stroke="#38bdf8" strokeWidth="2.5" strokeDasharray="5,6" strokeOpacity="0.85" />
                              <line x1="26" y1="40" x2="26" y2="105" stroke="#e0f2fe" strokeWidth="1" strokeDasharray="3,7" strokeOpacity="0.9" />
                            </g>

                            {/* Light blue basin containing bathtub water (Volume 0) */}
                            <g 
                              className="cursor-pointer transition-all hover:brightness-105"
                              onClick={() => setTestPlacementZone('volume_0')}
                            >
                              {/* The actual double-walled acrylic bathtub body */}
                              <path 
                                d="M 55,30 C 65,75 85,155 100,155 L 400,155 C 415,155 435,75 445,30 Z" 
                                fill={testPlacementZone === 'volume_0' ? 'url(#water-grad-highlight)' : 'url(#ceramic-edge-grad)'} 
                                stroke="#1e293b" 
                                strokeWidth="2"
                                style={testPlacementZone === 'volume_0' ? { filter: 'url(#glow-vol0)' } : {}}
                              />
                              {/* Smooth water level inside the bathtub */}
                              {testPlacementZone !== 'volume_0' && (
                                <path 
                                  d="M 61,54 C 150,57 300,51 439,54 C 430,85 412,154 398,154 L 102,154 C 88,154 70,85 61,54 Z"
                                  fill="url(#water-grad-coupe)"
                                  stroke="#0284c7"
                                  strokeWidth="1.2"
                                />
                              )}
                              {/* Overlaying dynamic water ripples */}
                              {testPlacementZone !== 'volume_0' && (
                                <>
                                  <path d="M 70,70 Q 250,73 430,70" fill="none" stroke="#e0f2fe" strokeWidth="0.8" strokeOpacity="0.4" pointerEvents="none" />
                                  <path d="M 90,100 Q 250,103 410,100" fill="none" stroke="#e0f2fe" strokeWidth="0.8" strokeOpacity="0.3" pointerEvents="none" />
                                  <path d="M 120,130 Q 250,132 380,130" fill="none" stroke="#e0f2fe" strokeWidth="0.8" strokeOpacity="0.2" pointerEvents="none" />
                                </>
                              )}
                            </g>

                            {/* Custom dotted nesting line exactly tracing bottom profile like user diagram */}
                            <path 
                              d="M 55,30 C 65,75 85,155 100,155 L 400,155 C 415,155 435,75 445,30 L 445,33 C 435,78 415,158 400,158 L 100,158 C 85,158 65,78 55,33 Z"
                              fill="none" 
                              stroke="#0f172a" 
                              strokeDasharray="3,3" 
                              strokeWidth="1.5" 
                              pointerEvents="none"
                            />

                            {/* Dynamic selection visual badges/pills under the labels */}
                            <g className="pointer-events-none select-none">
                              {/* Volume 0 label precisely placed and underlined */}
                              <text 
                                x="250" 
                                y="75" 
                                textAnchor="middle" 
                                fontFamily="system-ui, sans-serif" 
                                fontWeight="900" 
                                fontSize="20" 
                                fill={testPlacementZone === 'volume_0' ? '#ef4444' : '#1d4ed8'}
                              >
                                Volume 0
                              </text>
                              <line x1="200" y1="83" x2="300" y2="83" stroke={testPlacementZone === 'volume_0' ? '#ef4444' : '#1d4ed8'} strokeWidth="2.5" />

                              {/* Volume 1bis label precisely placed and underlined */}
                              <text 
                                x="250" 
                                y="180" 
                                textAnchor="middle" 
                                fontFamily="system-ui, sans-serif" 
                                fontWeight="900" 
                                fontSize="20" 
                                fill={bathStandardYear === 'POST_2025' ? '#1d4ed8' : '#701a75'}
                              >
                                {bathStandardYear === 'POST_2025' ? 'Volume 1 (ex-Vol 1bis)' : 'Volume 1bis'}
                              </text>
                              <line x1="160" y1="188" x2="340" y2="188" stroke={bathStandardYear === 'POST_2025' ? '#1d4ed8' : '#701a75'} strokeWidth="2.5" />
                            </g>

                            {/* Left and Right casing labels */}
                            <text x="35" y="216" fontFamily="monospace" fontSize="8" fill="#64748b" fontWeight="bold">
                              Tablier Plein
                            </text>
                            <text x="465" y="216" fontFamily="monospace" fontSize="8" fill="#64748b" textAnchor="end" fontWeight="bold">
                              Sol de la salle d'eau
                            </text>
                          </svg>

                          <div className="absolute top-1 left-2 bg-white/80 p-1.5 rounded-lg border border-slate-100 text-[8px] font-bold text-slate-500">
                             Astuce : Cliquez sur les zones de l'image pour les sélectionner et tester leur conformité !
                          </div>

                          {vol1bisTooltipVisible && (
                            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[1px] flex justify-center items-center p-3 z-20 animate-fadeIn" onClick={() => setVol1bisTooltipVisible(false)}>
                              <div className="bg-white border border-purple-200 shadow-2xl rounded-xl max-w-[350px] p-4 text-xs relative animate-[scaleUp_0.2s_ease-out]" onClick={(e) => e.stopPropagation()}>
                                <button 
                                  type="button"
                                  onClick={() => setVol1bisTooltipVisible(false)}
                                  className="absolute top-2 right-2 text-slate-400 hover:text-slate-600 transition-colors p-1"
                                  title="Fermer"
                                >
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                                <div className="flex items-center gap-2 mb-1.5">
                                  <span className={`p-1 px-1.5 font-extrabold rounded text-[9px] uppercase tracking-wider ${bathStandardYear === 'POST_2025' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}`}>
                                    {bathStandardYear === 'POST_2025' ? 'Volume 1 • Espace Technique (Nouveau RGIE)' : 'Volume 1 bis • Espace Technique (Ancien RGIE)'}
                                  </span>
                                </div>
                                <h4 className="font-extrabold text-slate-800 text-[12px] mb-1">
                                  {bathStandardYear === 'POST_2025' ? "Espace technique intégré au Volume 1 (sous baignoire)" : "Volume sous la baignoire ou derrière son tablier"}
                                </h4>
                                <p className="text-slate-600 leading-relaxed text-[11px] mb-2">
                                  {bathStandardYear === 'POST_2025' ? (
                                    <span>Dans le nouveau RGIE (Livre 1), le concept de Volume 1bis a été supprimé. L'espace technique sous la baignoire fait désormais partie du <strong>Volume 1</strong>.</span>
                                  ) : (
                                    <span>Le <strong>Volume 1 bis</strong> correspond à l'espace technique situé sous la baignoire entière ou derrière son tablier plein s'il rejoint le sol.</span>
                                  )}
                                </p>
                                <ul className="space-y-1.5 text-[10px] text-slate-700 bg-slate-50 p-2 rounded-lg border border-slate-100">
                                  <li className="flex items-start gap-1">
                                    <span className="text-emerald-500 font-bold">✓</span>
                                    <span className="leading-tight"><strong>Ancien RGIE (pré-2025)</strong> : Volume à part entière. Matériel électrique de massage (moteurs, pompes IPX4) et alimentation directe autorisés. Liaison équipotentielle supplémentaire obligatoire pour toutes les masses métalliques.</span>
                                  </li>
                                  <li className="flex items-start gap-1">
                                    <span className="text-blue-500 font-bold">ℹ</span>
                                    <span className="leading-tight"><strong>Nouveau RGIE (Livre 1 post-Mars 2025)</strong> : Concept de "Volume 1 bis" supprimé pour simplification. Cet espace fait désormais partie intégrante du <strong>Volume 1</strong> et est régi par ses règles très strictes.</span>
                                  </li>
                                  <li className="flex items-start gap-1">
                                    <span className="text-red-500 font-bold">✗</span>
                                    <span className="leading-tight">Les prises de courant standards 230V et interrupteurs mobiles y sont formellement interdits dans les deux cas !</span>
                                  </li>
                                </ul>
                                <p className="text-[10px] text-indigo-600 font-semibold mt-2">
                                  💡 Cliquez sur un équipement dans le testeur pour valider sa conformité réglementaire !
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      ) : bathtubViewMode === 'plan' ? (
                        /* PLAN VUE DE DESSUS (2D FLOOR PLAN - MATCHING DIAGRAM 2) */
                        <div className="relative w-full h-[280px] flex flex-col justify-center items-center overflow-hidden animate-fadeIn bg-white rounded-xl border border-slate-200">
                          <svg viewBox="0 0 540 280" className="w-full h-full">
                            <defs>
                              {/* Grid pattern */}
                              <pattern id="tile-grid" width="20" height="20" patternUnits="userSpaceOnUse">
                                <rect width="20" height="20" fill="none" stroke="#e2e8f0" strokeWidth="0.5" />
                              </pattern>
                              {/* Pulsing highlight for selected zone */}
                              <filter id="sel-glow" x="-20%" y="-20%" width="140%" height="140%">
                                <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#1d4ed8" floodOpacity="0.6"/>
                              </filter>
                              {/* Porcelain ceramic top plan gradient */}
                              <linearGradient id="ceramic-grad-plan" x1="0%" y1="0%" x2="0%" y2="100%">
                                <stop offset="0%" stopColor="#ffffff" />
                                <stop offset="60%" stopColor="#f8fafc" />
                                <stop offset="100%" stopColor="#e2e8f0" />
                              </linearGradient>
                              {/* Sparkly pure water top plan radial gradient */}
                              <radialGradient id="water-grad-plan" cx="50%" cy="50%" r="50%">
                                <stop offset="0%" stopColor="#bae6fd" stopOpacity="0.95" />
                                <stop offset="70%" stopColor="#38bdf8" stopOpacity="0.75" />
                                <stop offset="100%" stopColor="#0284c7" stopOpacity="0.85" />
                              </radialGradient>
                              {/* Selected glowing gradient */}
                              <linearGradient id="selected-vol0-plan" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="#fca5a5" />
                                <stop offset="100%" stopColor="#f87171" />
                              </linearGradient>
                              {/* Selected glowing gradient for Volume 1 in plan */}
                               <linearGradient id="selected-vol1-plan" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="#ffedd5" />
                                <stop offset="100%" stopColor="#fed7aa" />
                              </linearGradient>
                              {/* Volume 3 Gradients inside definitions */}
                              <linearGradient id="vol3-grad" x1="0%" y1="0%" x2="0%" y2="100%">
                                <stop offset="0%" stopColor="#10b981" stopOpacity="0.04" />
                                <stop offset="100%" stopColor="#059669" stopOpacity="0.08" />
                              </linearGradient>
                              <linearGradient id="active-vol3-grad" x1="0%" y1="0%" x2="0%" y2="100%">
                                <stop offset="0%" stopColor="#10b981" stopOpacity="0.18" />
                                <stop offset="100%" stopColor="#059669" stopOpacity="0.30" />
                              </linearGradient>
                              {/* Glowing definitions for Volume 1 */}
                              <filter id="sel-glow-orange" x="-20%" y="-20%" width="140%" height="140%">
                                <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#ea580c" floodOpacity="0.6"/>
                              </filter>
                              {/* Chrome tap metal */}
                              <linearGradient id="chrome-grad-plan" x1="0%" y1="0%" x2="0%" y2="100%">
                                <stop offset="0%" stopColor="#f1f5f9" />
                                <stop offset="50%" stopColor="#94a3b8" />
                                <stop offset="100%" stopColor="#475569" />
                              </linearGradient>
                            </defs>

                            {/* Tile mosaic background */}
                            <rect width="100%" height="100%" fill="url(#tile-grid)" />

                            {/* Click background to select Lieu L / Volume 3 */}
                            <rect 
                              width="100%" 
                              height="100%" 
                              fill={testPlacementZone === 'lieu_l' ? 'rgba(16, 185, 129, 0.08)' : 'rgba(255, 255, 255, 0.01)'} 
                              onClick={() => setTestPlacementZone('lieu_l')} 
                              className="cursor-pointer transition-all duration-300 hover:fill-emerald-500/5"
                              stroke={testPlacementZone === 'lieu_l' ? '#10b981' : 'transparent'}
                              strokeWidth="3.5"
                            />

                            {/* Grid wall bounds (White outer boundaries) */}
                            <line x1="10" y1="10" x2="530" y2="10" stroke="#94a3b8" strokeWidth="2" />
                            <line x1="10" y1="10" x2="10" y2="270" stroke="#94a3b8" strokeWidth="2" />

                            {/* 1. EXTENDED ZONE AND MEASUREMENTS LAYER */}
                            {showExtendedRadialZone && (
                              bathStandardYear === 'POST_2025' ? (
                                <g className="transition-opacity duration-300">
                                  {/* NEW REGIME: Rayon 4,00 m (Lieu L) */}
                                  <path 
                                    d="M 40,40 L 260,40 A 220,220 0 0,1 40,260 Z" 
                                    fill="#a7f3d0" 
                                    fillOpacity="0.25"
                                    stroke="#059669" 
                                    strokeWidth="1.5"
                                    strokeDasharray="4,3"
                                    onClick={() => setTestPlacementZone('lieu_l')}
                                    className="cursor-pointer pointer-events-auto"
                                  />
                                </g>
                              ) : (
                                <g className="transition-opacity duration-300">
                                  {/* ANCIEN REGIME: Volume 3 (2,40m) */}
                                  {/* Highlight Volume 3 boundaries on the floor */}
                                  <rect 
                                    x="22" 
                                    y="22" 
                                    width="248" 
                                    height="188" 
                                    rx="32" 
                                    fill="#10b981" 
                                    fillOpacity="0.08" 
                                    stroke="#10b981" 
                                    strokeDasharray="5,4" 
                                    strokeWidth="1.5"
                                    onClick={() => setTestPlacementZone('lieu_l')}
                                    className="cursor-pointer pointer-events-auto"
                                  />
                                </g>
                              )
                            )}

                            {/* 2. SAFETY VOLUME ENVELOPE (YELLOW / ORANGE - WRAPPING EFFECT) */}
                            {/* Volume 2: 0.60 m around tub (Only present in PRE_2025) */}
                            {bathStandardYear === 'PRE_2025' && (
                              <g 
                                className="cursor-pointer transition-all hover:opacity-90"
                                onClick={() => setTestPlacementZone('volume_2')}
                              >
                                {hasGlassPartition ? (
                                  <>
                                    {/* Yellow safety wrapping boundary path */}
                                    <path 
                                      d={`
                                        M 40,22 
                                        L 180,22 
                                        A 18,18 0 0,1 198,40 
                                        L 198,120 
                                        A 18,18 0 0,1 180,138 
                                        L ${40 + glassPartitionDepth * 90},138 
                                        A 18,18 0 0,1 ${40 + glassPartitionDepth * 90 - 18},120 
                                        L 40,120
                                        Z
                                      `}
                                      fill={testPlacementZone === 'volume_2' ? '#fde047' : '#fef08a'}
                                      fillOpacity="0.5"
                                      stroke="#eab308"
                                      strokeWidth="1.5"
                                      style={testPlacementZone === 'volume_2' ? { filter: 'url(#sel-glow)' } : {}}
                                    />
                                    {/* Wrapping dimension label */}
                                    <path d={`M ${40 + glassPartitionDepth * 90},120 L ${40 + glassPartitionDepth * 90},138`} stroke="#b45309" strokeWidth="1.2" strokeDasharray="2,2" />
                                    <text x={40 + glassPartitionDepth * 90 + 5} y="132" fontSize="8" fontWeight="extrabold" fill="#b45309" textAnchor="start">
                                      0,6 m
                                    </text>
                                  </>
                                ) : (
                                  /* Simple standard 0.6m outline padding around tub (No glass barrier) */
                                  <rect 
                                    x="22" 
                                    y="22" 
                                    width="176" 
                                    height="116" 
                                    rx="28" 
                                    fill={testPlacementZone === 'volume_2' ? '#fde047' : '#fef08a'}
                                    fillOpacity="0.5"
                                    stroke="#eab308"
                                    strokeDasharray="2,2"
                                    strokeWidth="2"
                                    style={testPlacementZone === 'volume_2' ? { filter: 'url(#sel-glow)' } : {}}
                                  />
                                )}
                              </g>
                            )}

                            {/* 3a. BATHTUB VOLUME 1 ZONE (OUTER PERIMETER & VERTICAL PROJECTION - ORANGE/PEACH) */}
                            <g 
                              className="cursor-pointer transition-transform hover:scale-[1.01]"
                              onClick={() => setTestPlacementZone('volume_1')}
                            >
                              {/* Outer tub porcelain rim - luxury oval double-ended design, acts as selection for Volume 1 */}
                              <rect 
                                x="40" 
                                y="40" 
                                width="140" 
                                height="80" 
                                rx="38" 
                                fill={testPlacementZone === 'volume_1' ? 'url(#selected-vol1-plan)' : 'url(#ceramic-grad-plan)'} 
                                stroke={testPlacementZone === 'volume_1' ? '#ea580c' : '#64748b'} 
                                strokeWidth={testPlacementZone === 'volume_1' ? "2.5" : "1.5"}
                                style={testPlacementZone === 'volume_1' ? { filter: 'url(#sel-glow-orange)' } : {}}
                              />
                              {/* Inner rim edge highlight crease */}
                              <rect x="46" y="45" width="128" height="70" rx="33" fill="none" stroke="#e2e8f0" strokeWidth="1" />

                              {/* Subtle Volume 1 Boundary Cue in Plan View (Orange dotted border) */}
                              <rect 
                                x="37" 
                                y="37" 
                                width="146" 
                                height="86" 
                                rx="41" 
                                fill="none" 
                                stroke="#f97316" 
                                strokeWidth={testPlacementZone === 'volume_1' ? "1.8" : "1"} 
                                strokeDasharray="3,2.5" 
                                opacity={testPlacementZone === 'volume_1' ? "0.95" : "0.5"} 
                                pointerEvents="none" 
                              />

                              {/* Volume 1 Text Label placed nicely on upper lip */}
                              <text 
                                x="110" 
                                y="63" 
                                fontFamily="sans-serif" 
                                fontWeight="800" 
                                fontSize="7.5" 
                                fill={testPlacementZone === 'volume_1' ? '#ea580c' : '#475569'} 
                                textAnchor="middle"
                                className="uppercase tracking-wide select-none pointer-events-none"
                              >
                                Volume 1
                              </text>
                            </g>

                            {/* 3b. BATHTUB VOLUME 0 ZONE (INNER WATER RECIPIENT - PINK-RED ON SELECT / WATER-BLUE NORMAL) */}
                            <g 
                              className="cursor-pointer transition-transform hover:scale-[1.01]"
                              onClick={() => setTestPlacementZone('volume_0')}
                            >
                              {/* Inner water basin */}
                              <rect 
                                x="52" 
                                y="50" 
                                width="116" 
                                height="60" 
                                rx="26" 
                                fill={testPlacementZone === 'volume_0' ? '#fca5a5' : 'url(#water-grad-plan)'} 
                                stroke={testPlacementZone === 'volume_0' ? '#ef4444' : '#2563eb'} 
                                strokeWidth={testPlacementZone === 'volume_0' ? "2" : "1"} 
                                style={testPlacementZone === 'volume_0' ? { filter: 'url(#sel-glow)' } : {}}
                              />

                              {/* Ergonomic sloped shoulder curves inside deep tub */}
                              <path 
                                d="M 78,54 C 64,62 64,98 78,106" 
                                fill="none" 
                                stroke={testPlacementZone === 'volume_0' ? '#f59e0b' : '#7dd3fc'} 
                                strokeWidth="1" 
                                strokeDasharray="3,2" 
                                opacity="0.65" 
                              />
                              <path 
                                d="M 142,54 C 156,62 156,98 142,106" 
                                fill="none" 
                                stroke={testPlacementZone === 'volume_0' ? '#f59e0b' : '#7dd3fc'} 
                                strokeWidth="1" 
                                strokeDasharray="3,2" 
                                opacity="0.65" 
                              />

                              {/* Chrome central popup waste plug drain */}
                              <circle cx="110" cy="80" r="5.5" fill="url(#chrome-grad-plan)" stroke="#475569" strokeWidth="0.5" />
                              <circle cx="110" cy="80" r="2.5" fill="#334155" />

                              {/* Left-side overflow release cap */}
                              <circle cx="53" cy="80" r="2.5" fill="url(#chrome-grad-plan)" stroke="#475569" strokeWidth="0.5" />

                              {/* Backside Deck-Mounted Chrome Tub Mixer Faucet */}
                              <g transform="translate(110, 36)">
                                <rect x="-14" y="-4" width="28" height="6" rx="1" fill="url(#chrome-grad-plan)" stroke="#475569" strokeWidth="0.5" />
                                <circle cx="-8" cy="-1" r="2" fill="#ef4444" /> {/* Hot water marker */}
                                <circle cx="8" cy="-1" r="2" fill="#3b82f6" />  {/* Cold water marker */}
                                <path d="M 0,-1 L 0,10" stroke="url(#chrome-grad-plan)" strokeWidth="3" strokeLinecap="round" /> {/* Outlining spout */}
                              </g>

                              {/* Volume 0 Label */}
                              <text 
                                x="110" 
                                y="84" 
                                fontFamily="sans-serif" 
                                fontWeight="900" 
                                fontSize="9" 
                                fill={testPlacementZone === 'volume_0' ? '#7f1d1d' : '#1e3a8a'} 
                                textAnchor="middle"
                                className="uppercase tracking-wider select-none pointer-events-none"
                              >
                                Volume 0 (Cuve)
                              </text>
                            </g>

                            {/* 4. THE GLASS PARTITION (BLUE LINE - exact "vaste glazen wand") */}
                            {hasGlassPartition && (
                              <g className="transition-all">
                                {/* The solid blue glass partition wall starting on left bottom edge of bath */}
                                <line 
                                  x1="40" 
                                  y1="120" 
                                  x2={40 + glassPartitionDepth * 90} 
                                  y2="120" 
                                  stroke="#0284c7" 
                                  strokeWidth="6" 
                                  strokeLinecap="round"
                                />
                                <line 
                                  x1="40" 
                                  y1="120" 
                                  x2={40 + glassPartitionDepth * 90} 
                                  y2="120" 
                                  stroke="#ffffff" 
                                  strokeWidth="1.5" 
                                  strokeLinecap="round" 
                                  strokeDasharray="3,3"
                                />
                                {/* Annotation arrow */}
                                <text x={(40 + 40 + glassPartitionDepth * 90)/2} y="114" fontSize="8" fontWeight="bold" fill="#0369a1" textAnchor="middle">
                                  Paroi Vitrée Fixe ({ (glassPartitionDepth).toFixed(2) } m)
                                </text>
                              </g>
                            )}

                            {/* 5. DOUBLE VANITY SYNC (MEUBLE DOUBLE VASQUE - exact representation from image 1) */}
                            <g className="opacity-95 text-slate-800">
                              {/* Cabinet body */}
                              <rect x="300" y="40" width="130" height="55" rx="3" fill="#64748b" stroke="#334155" strokeWidth="1" />
                              {/* Drawer splits */}
                              <line x1="365" y1="40" x2="365" y2="95" stroke="#475569" strokeWidth="1" />
                              <line x1="300" y1="68" x2="430" y2="68" stroke="#475569" strokeWidth="1" />
                              {/* Basins */}
                              <rect x="312" y="44" width="38" height="24" rx="2" fill="#ffffff" stroke="#cbd5e1" />
                              <rect x="380" y="44" width="38" height="24" rx="2" fill="#ffffff" stroke="#cbd5e1" />
                              {/* Sinks taps */}
                              <circle cx="331" cy="42" r="3" fill="#94a3b8" />
                              <circle cx="399" cy="42" r="3" fill="#94a3b8" />
                              <text x="365" y="110" fontSize="8" fontWeight="bold" fill="#475569" textAnchor="middle">
                                Meuble Double Vasque
                              </text>
                            </g>

                            {/* 6. GREEN CORNER PLANT (Matching picture 1) */}
                            <g transform="translate(450, 45)">
                              <circle cx="0" cy="0" r="6" fill="#78350f" />
                              {/* Leaves */}
                              <path d="M 0,0 C 5,-15 15,-10 15,-15 C 15,-10 5,-5 0,0" fill="#15803d" />
                              <path d="M 0,0 C -5,-15 -15,-10 -15,-15 C -15,-10 -5,-5 0,0" fill="#166534" />
                              <path d="M 0,0 C 15,5 10,15 15,15 C 10,15 5,5 0,0" fill="#15803d" />
                              <path d="M 0,0 C -15,5 -10,15 -15,15 C -10,15 -5,5 0,0" fill="#14532d" />
                              <circle cx="0" cy="0" r="3" fill="#a16207" />
                            </g>

                            {/* FOREGROUND MEASUREMENTS & ARROWS (RENDERED ON TOP) */}
                            {showExtendedRadialZone && (
                              bathStandardYear === 'POST_2025' ? (
                                <g className="pointer-events-none select-none">
                                  {/* Radial radius indicator arrow - explicitly drawn on top */}
                                  <line x1="40" y1="40" x2="195" y2="195" stroke="#047857" strokeWidth="2" />
                                  <polygon points="195,195 186,192 192,186" fill="#047857" />

                                  {/* High contrast background shield for rotated text */}
                                  <g transform="rotate(45, 120, 120)">
                                    <rect x="92" y="112" width="58" height="15" rx="3.5" fill="#ffffff" stroke="#047857" strokeWidth="1.2" />
                                    <text x="121" y="123" fontWeight="900" fontSize="9" fill="#047857" textAnchor="middle">
                                      4,00 m
                                    </text>
                                  </g>

                                  {/* High-contrast layout pill for maximum text visibility */}
                                  <rect x="85" y="211" width="180" height="18" rx="5" fill="#ffffff" stroke="#047857" strokeWidth="1.5" />
                                  <text x="175" y="223" fontWeight="900" fontSize="9.5" fill="#047857" textAnchor="middle">
                                    H = 3,00 m (Lieu L / Hors volumes)
                                  </text>
                                </g>
                              ) : (
                                <g className="pointer-events-none select-none">
                                  {/* Measurement lines from tub edge to Vol 2 limit (0.60m) */}
                                  <line x1="180" y1="80" x2="198" y2="80" stroke="#ca8a04" strokeWidth="1.2" />
                                  <circle cx="180" cy="80" r="2" fill="#ca8a04" />
                                  <circle cx="198" cy="80" r="2" fill="#ca8a04" />
                                  <g transform="translate(189, 74)">
                                    <rect x="-18" y="-6" width="36" height="11" rx="1.5" fill="#ffffff" stroke="#ca8a04" strokeWidth="0.6" />
                                    <text x="0" y="2" fontSize="7" fontWeight="black" fill="#78350f" textAnchor="middle">0,60 m</text>
                                  </g>

                                  {/* Measurement lines from Vol 2 limit to Vol 3 limit (2.40m) */}
                                  <line x1="198" y1="80" x2="270" y2="80" stroke="#059669" strokeWidth="1.2" />
                                  <circle cx="198" cy="80" r="2" fill="#059669" />
                                  <circle cx="270" cy="80" r="2" fill="#059669" />
                                  <g transform="translate(234, 74)">
                                    <rect x="-24" y="-6" width="48" height="11" rx="1.5" fill="#ffffff" stroke="#059669" strokeWidth="0.6" />
                                    <text x="0" y="2" fontSize="7.5" fontWeight="black" fill="#064e3b" textAnchor="middle">L = 2,40 m</text>
                                  </g>

                                  {/* Height indicator pill */}
                                  <rect x="95" y="211" width="160" height="18" rx="5" fill="#ffffff" stroke="#059669" strokeWidth="1.5" />
                                  <text x="175" y="223" fontWeight="900" fontSize="9" fill="#064e3b" textAnchor="middle">
                                    H = 2,25 m (Volume 3)
                                  </text>
                                </g>
                              )
                            )}

                            {/* Compass / Key notes */}
                            <g transform="translate(425, 178)">
                              <rect x="-35" y="-35" width="135" height="120" rx="6" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="1" />
                              <text x="32" y="-22" fontSize="7.5" fontWeight="black" fill="#94a3b8" textAnchor="middle">LÉGENDE</text>
                              
                              {/* Leg 1: Vol 0 */}
                              <rect x="-25" y="-12" width="12" height="7" fill="#fca5a5" stroke="#dc2626" strokeWidth="0.5" />
                              <text x="-7" y="-6" fontSize="7.3" fontWeight="bold" fill="#475569">Vol 0 (Intérieur)</text>
                              
                              {/* Leg 2: Vol 1 */}
                              <rect x="-25" y="-1" width="12" height="7" fill="#fed7aa" stroke="#ea580c" strokeWidth="0.5" />
                              <text x="-7" y="5" fontSize="7.3" fontWeight="bold" fill="#475569">Vol 1 (Projection)</text>
                              
                              {/* Leg 3: Vol 2 / Lieu L */}
                              {bathStandardYear === 'PRE_2025' ? (
                                <>
                                  <rect x="-25" y="10" width="12" height="7" fill="#fef08a" stroke="#eab308" strokeWidth="0.5" />
                                  <text x="-7" y="16" fontSize="7.3" fontWeight="bold" fill="#475569">Vol 2 (Protection 0.6m)</text>
                                </>
                              ) : (
                                <>
                                  <rect x="-25" y="10" width="12" height="7" fill="#a7f3d0" fillOpacity="0.6" stroke="#059669" strokeWidth="0.5" />
                                  <text x="-7" y="16" fontSize="7.3" fontWeight="bold" fill="#475569">Lieu L (Hors volumes)</text>
                                </>
                              )}
                              
                              {/* Leg 4: Vol 3 / Aire d'influence */}
                              {bathStandardYear === 'PRE_2025' ? (
                                <>
                                  <rect x="-25" y="21" width="12" height="7" fill="#a7f3d0" fillOpacity="0.6" stroke="#059669" strokeWidth="0.5" />
                                  <text x="-7" y="27" fontSize="7.3" fontWeight="bold" fill="#475569">Vol 3 (Hors vol. 2.40m)</text>
                                </>
                              ) : (
                                <>
                                  <rect x="-25" y="21" width="12" height="7" fill="#a7f3d0" fillOpacity="0.2" stroke="#059669" strokeWidth="0.5" strokeDasharray="2,1" />
                                  <text x="-7" y="27" fontSize="7.3" fontWeight="bold" fill="#475569">Aire d'infl. (4.00m)</text>
                                </>
                              )}
                              
                              {/* Leg 5: Paroi Vitrée */}
                              <line x1="-25" y1="38" x2="-13" y2="38" stroke="#0284c7" strokeWidth="2.5" />
                              <text x="-7" y="41" fontSize="7.3" fontWeight="bold" fill="#0284c7">Paroi Vitrée</text>
                            </g>

                            {/* Dimensions Label Indicator */}
                            <g transform="translate(140, 248)" className="pointer-events-none select-none">
                              <text x="120" y="10" fontFamily="sans-serif" fontWeight="black" fontSize="10" fill="#475569" textAnchor="middle">
                                COUPE DE DESSUS (2D PLAN): REGLE DU FIL TENDU
                              </text>
                            </g>
                          </svg>

                          {/* Extra interactive toggle to show/hide the green extended zone */}
                          <button 
                            type="button" 
                            onClick={() => setShowExtendedRadialZone(!showExtendedRadialZone)}
                            className="absolute bottom-2 left-2 px-2.5 py-1 bg-slate-900 border border-slate-700 text-white rounded-lg text-[8px] font-black uppercase tracking-wider transition-all hover:bg-slate-800 shadow-md"
                          >
                            {showExtendedRadialZone ? 'Cacher' : 'Afficher'} {bathStandardYear === 'POST_2025' ? "l'aire d'influence (4,00m)" : "le Volume 3 (2,40m)"}
                          </button>

                          <div className="absolute top-2 left-2 bg-emerald-50 text-emerald-800 p-1 px-2 rounded-lg border border-emerald-100 text-[8px] font-bold shadow-sm">
                             Cliquez sur la baignoire, le volume jaune, ou au-delà pour tester la conformité !
                          </div>
                        </div>
                      ) : (
                        /* PERSPECTIVE SCHEMATIC VIEW (3D VIEW - MATCHING THE PERSPECTIVE DIAGRAM 1) */
                        <div className="relative w-full h-[280px] flex flex-col justify-center items-center overflow-hidden animate-fadeIn bg-white rounded-xl border border-slate-200">
                          <svg viewBox="0 0 540 280" className="w-full h-full">
                            <defs>
                              <linearGradient id="wall-left" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#f8fafc" />
                                <stop offset="100%" stopColor="#f1f5f9" />
                              </linearGradient>
                              <linearGradient id="wall-right-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#f1f5f9" stopOpacity="0.9"/>
                                <stop offset="100%" stopColor="#e2e8f0" stopOpacity="0.9"/>
                              </linearGradient>
                              <linearGradient id="floorGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                                <stop offset="0%" stopColor="#1e293b" />
                                <stop offset="100%" stopColor="#0f172a" />
                              </linearGradient>
                              {/* Custom 3D Bathtub Porcelain, Highlights, Water and Highlights */}
                              <linearGradient id="ceramic-3d-front" x1="0%" y1="0%" x2="100%" y2="50%">
                                <stop offset="0%" stopColor="#ffffff" />
                                <stop offset="15%" stopColor="#f8fafc" />
                                <stop offset="70%" stopColor="#cbd5e1" />
                                <stop offset="100%" stopColor="#94a3b8" />
                              </linearGradient>
                              <linearGradient id="ceramic-3d-side" x1="0%" y1="0%" x2="0%" y2="100%">
                                <stop offset="0%" stopColor="#cbd5e1" />
                                <stop offset="15%" stopColor="#94a3b8" />
                                <stop offset="100%" stopColor="#475569" />
                              </linearGradient>
                              <linearGradient id="water-3d-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#e0f2fe" stopOpacity="0.9" />
                                <stop offset="45%" stopColor="#38bdf8" stopOpacity="0.8" />
                                <stop offset="100%" stopColor="#0284c7" stopOpacity="0.9" />
                              </linearGradient>
                              <linearGradient id="ceramic-3d-highlight" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
                                <stop offset="50%" stopColor="#ffffff" stopOpacity="0.4" />
                                <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
                              </linearGradient>
                              <linearGradient id="selected-vol0-3d" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#fca5a5" />
                                <stop offset="100%" stopColor="#ef4444" />
                              </linearGradient>
                              {/* Glowing definitions */}
                              <filter id="glow-vol1-3d" x="-10%" y="-10%" width="120%" height="120%">
                                <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#3b82f6" floodOpacity="0.6"/>
                              </filter>
                              <filter id="glow-vol2-3d" x="-10%" y="-10%" width="120%" height="120%">
                                <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#f59e0b" floodOpacity="0.6"/>
                              </filter>
                            </defs>

                            {/* Background 3D Walls Joint Line */}
                            {/* Left wall */}
                            <polygon points="10,10 240,110 240,240 10,140" fill="url(#wall-left)" stroke="#cbd5e1" strokeWidth="0.5" />
                            {/* Right wall */}
                            <polygon points="240,110 530,10 530,140 240,240" fill="url(#wall-right-grad)" stroke="#cbd5e1" strokeWidth="0.5" />
                            {/* Dark tiled floor */}
                            <polygon points="10,140 240,240 530,140 240,270" fill="url(#floorGrad)" stroke="#020617" strokeWidth="0.5" />

                            {/* Dark floor tiles grid simulation lines */}
                            <line x1="10" y1="140" x2="240" y2="270" stroke="#334155" strokeWidth="0.5" />
                            <line x1="240" y1="240" x2="240" y2="270" stroke="#334155" strokeWidth="1" />
                            <line x1="125" y1="190" x2="385" y2="205" stroke="#334155" strokeWidth="0.5" />
                            <line x1="70" y1="165" x2="445" y2="175" stroke="#334155" strokeWidth="0.5" />

                            {/* ==================== 1. VERTICAL MEASUREMENT RULE (2,25 METER UNIT HEIGHT) ==================== */}
                            <g className="pointer-events-none select-none">
                              {/* Scale Ruler line at wall intersection */}
                              <line x1="240" y1="240" x2="240" y2="110" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="3,1" />
                              
                              {/* Horizontal tick marks */}
                              <line x1="235" y1="240" x2="245" y2="240" stroke="#ef4444" strokeWidth="2" />
                              <line x1="235" y1="110" x2="245" y2="110" stroke="#ef4444" strokeWidth="2" />
                              
                              {/* Height Ruler text */}
                              <text x="248" y="175" fontSize="8" fontWeight="black" fill="#ef4444" textAnchor="start">
                                H = 2,25 m (RGIE)
                              </text>
                              {/* Pointer reference line */}
                              <line x1="235" y1="175" x2="160" y2="100" stroke="#ef4444" strokeWidth="0.6" strokeDasharray="2,2" />
                            </g>

                            {/* ==================== 2. VOLUME 2 - 3D ENVELOPE (0.60m AMBER COLORED TRANSPARENT CUBE) ==================== */}
                            {/* Volume 2 surrounds both Volume 1 and the bathtub vertically (up to 2.25m from the floor) */}
                            {bathStandardYear === 'PRE_2025' && (
                              <g 
                                className="cursor-pointer transition-all hover:opacity-95"
                                onClick={() => setTestPlacementZone('volume_2')}
                              >
                                {/* Define Volumetric coordinates for Vol 2. 
                                    Base coordinates are scaled up and outwards around the tub.
                                    Tub: top is at (60,110)-(160,160)-(210,135)-(110,85). 
                                    If we project Volume 2 outward by 0.60m, let L-offset be 25px, W-offset be 15px.
                                    Outer Base floor profile:
                                    A_base = (35, 120), B_base = (160, 185), C_base = (235, 147), D_base = (110, 82)
                                    Top profile (Height up by 65px):
                                    A_top = (35, 55), B_top = (160, 120), C_top = (235, 82), D_top = (110, 17)
                                */}

                                {/* Back-left wall segment of Volume 2 */}
                                <polygon 
                                  points="110,82 235,147 235,82 110,17" 
                                  fill={testPlacementZone === 'volume_2' ? '#fbbf24' : '#fef08a'} 
                                  fillOpacity={testPlacementZone === 'volume_2' ? "0.20" : "0.05"} 
                                  stroke="#d97706" 
                                  strokeWidth="0.75"
                                  strokeDasharray="3,3"
                                />

                                {/* Left-front vertical wall of Vol 2 */}
                                <polygon 
                                  points="35,120 160,185 160,120 35,55" 
                                  fill={testPlacementZone === 'volume_2' ? '#fbbf24' : '#fef08a'} 
                                  fillOpacity={testPlacementZone === 'volume_2' ? "0.25" : "0.06"}
                                  stroke="#d97706" 
                                  strokeWidth="1"
                                  style={testPlacementZone === 'volume_2' ? { filter: 'url(#glow-vol2-3d)' } : {}}
                                />

                                {/* Right-front vertical wall of Vol 2 */}
                                <polygon 
                                  points="160,185 235,147 235,82 160,120" 
                                  fill={testPlacementZone === 'volume_2' ? '#fbbf24' : '#fef08a'} 
                                  fillOpacity={testPlacementZone === 'volume_2' ? "0.25" : "0.06"}
                                  stroke="#d97706" 
                                  strokeWidth="1"
                                  style={testPlacementZone === 'volume_2' ? { filter: 'url(#glow-vol2-3d)' } : {}}
                                />

                                {/* Top face ceiling enclosing Vol 2 (At 2.25m height) */}
                                <polygon 
                                  points="35,55 160,120 235,82 110,17" 
                                  fill={testPlacementZone === 'volume_2' ? '#f59e0b' : '#fef08a'} 
                                  fillOpacity={testPlacementZone === 'volume_2' ? "0.30" : "0.08"}
                                  stroke="#b45309" 
                                  strokeWidth="1"
                                />

                                {/* Volume 2 label with Pointer inside 3D */}
                                <text x="180" y="105" fontSize="8" fontWeight="black" fill="#b45309" textAnchor="middle">
                                  Volume 2 (H = 2,25m)
                                </text>
                                <line x1="160" y1="185" x2="185" y2="198" stroke="#b45309" strokeWidth="1" strokeDasharray="1,2" />
                                <text x="190" y="202" fontSize="7" fontWeight="black" fill="#b45309" textAnchor="start">
                                  + 0,60 m
                                </text>
                              </g>
                            )}

                            {/* ==================== 3. VOLUME 1 - 3D COLUMN SHIELD (BLUE TRANSPARENT CUBE) ==================== */}
                            {/* Volume 1 rises directly from the top rim perimeter of the Bathtub L=2.25m height */}
                            <g 
                              className="cursor-pointer transition-all hover:opacity-95"
                              onClick={() => setTestPlacementZone('volume_1')}
                            >
                              {/* Standard height projection upwards by 60px from the bathtub rim (60,110)-(160,160)-(210,135)-(110,85) 
                                  So top face of Volume 1 is at (60,50)-(160,100)-(210,75)-(110,25)
                              */}

                              {/* Left wall segment of Volume 1 */}
                              <polygon 
                                points="60,110 160,160 160,100 60,50" 
                                fill={testPlacementZone === 'volume_1' ? '#60a5fa' : '#93c5fd'} 
                                fillOpacity={testPlacementZone === 'volume_1' ? "0.35" : "0.15"}
                                stroke="#2563eb" 
                                strokeWidth="1.2"
                                style={testPlacementZone === 'volume_1' ? { filter: 'url(#glow-vol1-3d)' } : {}}
                              />

                              {/* Right wall segment of Volume 1 */}
                              <polygon 
                                points="160,160 210,135 210,75 160,100" 
                                fill={testPlacementZone === 'volume_1' ? '#3b82f6' : '#60a5fa'} 
                                fillOpacity={testPlacementZone === 'volume_1' ? "0.35" : "0.15"}
                                stroke="#2563eb" 
                                strokeWidth="1.2"
                                style={testPlacementZone === 'volume_1' ? { filter: 'url(#glow-vol1-3d)' } : {}}
                              />

                              {/* Top face boundary ceiling of Volume 1 (At 2.25m altitude) */}
                              <polygon 
                                points="60,50 160,100 210,75 110,25" 
                                fill={testPlacementZone === 'volume_1' ? '#2563eb' : '#93c5fd'} 
                                fillOpacity={testPlacementZone === 'volume_1' ? "0.40" : "0.18"}
                                stroke="#1d4ed8" 
                                strokeWidth="1.2"
                              />

                              {/* Horizontal projection lines indicating Height dimension of Volume 1 */}
                              <line x1="60" y1="110" x2="60" y2="50" stroke="#2563eb" strokeWidth="0.8" strokeDasharray="3,3" />
                              <line x1="210" y1="135" x2="210" y2="75" stroke="#2563eb" strokeWidth="0.8" strokeDasharray="3,3" />
                              
                              <text x="110" y="65" fontSize="8" fontWeight="black" fill="#1d4ed8" textAnchor="middle">
                                Volume 1
                              </text>
                            </g>

                            {/* ==================== 4. VOLUME 0 - 3D PHYSICAL BATHTUB BLOCK ==================== */}
                            <g 
                              className="cursor-pointer transition-all hover:scale-[1.01]"
                              onClick={() => setTestPlacementZone('volume_0')}
                            >
                              {/* Left-front vertical exterior face of bathtub (Glossy ceramic) */}
                              <polygon 
                                points="60,110 160,160 160,195 60,145" 
                                fill={testPlacementZone === 'volume_0' ? 'url(#selected-vol0-3d)' : 'url(#ceramic-3d-front)'} 
                                stroke={testPlacementZone === 'volume_0' ? '#ef4444' : '#94a3b8'} 
                                strokeWidth="1.2" 
                              />
                              
                              {/* Left-front glossy reflections overlay line */}
                              {testPlacementZone !== 'volume_0' && (
                                <>
                                  <path d="M 64,115 L 156,161" fill="none" stroke="url(#ceramic-3d-highlight)" strokeWidth="3" opacity="0.65" pointerEvents="none" />
                                  <path d="M 72,143 L 156,183" fill="none" stroke="#ffffff" strokeWidth="1.2" strokeDasharray="1,4" opacity="0.4" pointerEvents="none" />
                                </>
                              )}

                              {/* Right-front vertical exterior face (shaded darker for 3D realism) */}
                              <polygon 
                                points="160,160 210,135 210,170 160,195" 
                                fill={testPlacementZone === 'volume_0' ? 'url(#selected-vol0-3d)' : 'url(#ceramic-3d-side)'} 
                                stroke={testPlacementZone === 'volume_0' ? '#b91c1c' : '#475569'} 
                                strokeWidth="1.2" 
                              />

                              {/* Top flat thickness rim face */}
                              <polygon 
                                points="60,110 160,160 210,135 110,85" 
                                fill={testPlacementZone === 'volume_0' ? '#fee2e2' : '#ffffff'} 
                                stroke={testPlacementZone === 'volume_0' ? '#ef4444' : '#cbd5e1'} 
                                strokeWidth="1.2" 
                              />

                              {/* Inner rim edge highlighting crease */}
                              <polygon 
                                points="68,113 158,154 202,132 112,90" 
                                fill={testPlacementZone === 'volume_0' ? '#fecaca' : '#f1f5f9'} 
                                stroke={testPlacementZone === 'volume_0' ? '#ef4444' : '#cbd5e1'} 
                                strokeWidth="0.75" 
                              />

                              {/* Interior basin water representation with nice coordinates */}
                              <polygon 
                                points="74,118 155,150 196,131 115,97" 
                                fill={testPlacementZone === 'volume_0' ? '#f87171' : 'url(#water-3d-grad)'} 
                                stroke={testPlacementZone === 'volume_0' ? '#b91c1c' : '#0369a1'} 
                                strokeWidth="0.8" 
                              />

                              {/* Beautiful concentric water waves / ripples in 3D perspective */}
                              {testPlacementZone !== 'volume_0' && (
                                <g opacity="0.6" pointerEvents="none">
                                  <ellipse cx="135" cy="125" rx="22" ry="11" fill="none" stroke="#e0f2fe" strokeWidth="0.8" opacity="0.6" />
                                  <ellipse cx="135" cy="125" rx="38" ry="17" fill="none" stroke="#e0f2fe" strokeWidth="0.8" opacity="0.45" />
                                  <ellipse cx="135" cy="125" rx="52" ry="23" fill="none" stroke="#cbd5e1" strokeWidth="0.5" opacity="0.25" />
                                </g>
                              )}

                              {/* Central chrome popup waste plug drain inside 3D Perspective */}
                              <ellipse cx="135" cy="132" rx="5" ry="2.2" fill="url(#chrome-grad-plan)" stroke="#334155" strokeWidth="0.5" />

                              {/* Freestanding luxurious chrome high-spout floor faucet */}
                              <g transform="translate(108, 55)" opacity="0.95">
                                {/* Chrome vertical support pole */}
                                <rect x="-1" y="-1" width="4" height="32" fill="url(#chrome-grad-plan)" stroke="#334155" strokeWidth="0.5" />
                                {/* Curving goose-neck spout pointing forward into the tub */}
                                <path d="M 1,-1 Q 1,-13 14,-8 L 22,-5" fill="none" stroke="url(#chrome-grad-plan)" strokeWidth="3" strokeLinecap="round" />
                                {/* Soft sprinkling vertical water dropper stream */}
                                <line x1="21" y1="-2" x2="21" y2="70" stroke="#bae6fd" strokeWidth="1.2" strokeDasharray="3,3" opacity="0.85" />
                                <line x1="22" y1="-2" x2="22" y2="70" stroke="#0284c7" strokeWidth="1.2" strokeDasharray="1,5" opacity="0.9" />
                              </g>

                              {/* Highly legible overlay badge marker */}
                              <text 
                                x="135" 
                                y="143" 
                                fontSize="9" 
                                fontWeight="black" 
                                fill={testPlacementZone === 'volume_0' ? '#7f1d1d' : '#047857'}
                                textAnchor="middle"
                                className="uppercase tracking-wider select-none pointer-events-none"
                              >
                                {testPlacementZone === 'volume_0' ? 'Vol. 0 de sécurité' : 'VOLUME 0'}
                              </text>
                            </g>

                            {/* ==================== 5. INTEGRATED FIXED GLASS SCREEN + DYNAMIC Wrapping contour ==================== */}
                            {hasGlassPartition && (
                              <g className="pointer-events-none">
                                {/* Vertical metal pillar supporting post at (160, 160) extending up */}
                                <line x1="160" y1="65" x2="160" y2="160" stroke="#1e3a8a" strokeWidth="3" />
                                
                                {/* Half-transparent Blue glass pane of depth G representing the partition */}
                                <polygon 
                                  points={`
                                    160,65 
                                    ${160 - glassPartitionDepth * 40},${65 - glassPartitionDepth * 20} 
                                    ${160 - glassPartitionDepth * 40},${160 - glassPartitionDepth * 20} 
                                    160,160
                                  `} 
                                  fill="#cbd5e1" 
                                  fillOpacity="0.40" 
                                  stroke="#3b82f6" 
                                  strokeWidth="1.8" 
                                />
                                {/* Bottom profile highlight line under the glass */}
                                <line 
                                  x1="160" 
                                  y1="160" 
                                  x2={`${160 - glassPartitionDepth * 40}`} 
                                  y2={`${160 - glassPartitionDepth * 20}`} 
                                  stroke="#1d4ed8" 
                                  strokeWidth="2.5" 
                                />

                                {/* Delineating text label */}
                                <g transform={`translate(${140 - glassPartitionDepth * 15}, ${110 - glassPartitionDepth * 10})`}>
                                  <rect x="-42" y="-14" width="84" height="13" rx="2" fill="#ffffff" stroke="#1d4ed8" strokeWidth="0.5" />
                                  <text x="0" y="-5" fontSize="6.5" fontWeight="bold" fill="#1e40af" textAnchor="middle">
                                    Écran Fixe ({glassPartitionDepth}m)
                                  </text>
                                </g>

                                {/* ==================== DYNAMIC "FIL TENDU" DOTTED neon contour arrow ==================== */}
                                {/* Illustrates exactly how the 0.60m wrap rule is measured around the glass barrier edge! */}
                                <path 
                                  d={`
                                    M 115,138 
                                    Q ${160 - glassPartitionDepth * 40 - 20},${160 - glassPartitionDepth * 20 + 15} 
                                      ${160 - glassPartitionDepth * 40 - 15},${160 - glassPartitionDepth * 20 + 5} 
                                    T 165,190
                                  `}
                                  fill="none"
                                  stroke="#fbbf24"
                                  strokeWidth="2"
                                  strokeDasharray="3,1.5"
                                />
                                {/* Neon glow pointer to edge */}
                                <circle cx={`${160 - glassPartitionDepth * 40}`} cy={`${160 - glassPartitionDepth * 20}`} r="3" fill="#fbbf24" />
                                <text x={`${160 - glassPartitionDepth * 40 - 10}`} y={`${160 - glassPartitionDepth * 20 + 15}`} fontSize="7" fontWeight="black" fill="#ca8a04" textAnchor="end">
                                  Contournement (Fil Tendu)
                                </text>
                              </g>
                            )}

                            {/* ==================== 6. ACCENT DESIGN FURNITURE ITEMS (VANITY UNIT, MIRROR, CHAIR, PLANT) ==================== */}
                            {/* Double sink vanity unit */}
                            <g transform="translate(290, 80)">
                              {/* Shadow/Left wall block */}
                              <polygon points="0,40 50,15 50,60 0,85" fill="#334155" />
                              {/* Main drawer board */}
                              <polygon points="50,15 150,-35 150,10 50,60" fill="#475569" stroke="#1e293b" strokeWidth="0.75" />
                              {/* Basin top stone plate */}
                              <polygon points="0,40 50,15 150,-35 100,-10" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="0.75" />
                              {/* Dual washbasins */}
                              <ellipse cx="65" cy="12" rx="14" ry="6.5" fill="#ffffff" stroke="#94a3b8" />
                              <ellipse cx="108" cy="-10" rx="14" ry="6.5" fill="#ffffff" stroke="#94a3b8" />
                              {/* Mirror cabinets above */}
                              <polygon points="60,-50 140,-90 140,-45 60,-5" fill="#e2e8f0" fillOpacity="0.85" stroke="#64748b" strokeWidth="1" />
                              <line x1="100" y1="-70" x2="100" y2="-25" stroke="#94a3b8" strokeWidth="1.5" />
                            </g>

                            {/* Green floor plant */}
                            <g transform="translate(460, 165)">
                              <polygon points="-8,10 8,10 12,-10 -12,-10" fill="#7c2d12" />
                              <path d="M 0,-10 C 15,-30 25,-20 30,-35" stroke="#166534" strokeWidth="3.2" fill="none" strokeLinecap="round" />
                              <path d="M 0,-10 C -15,-30 -25,-20 -30,-35" stroke="#15803d" strokeWidth="3.2" fill="none" strokeLinecap="round" />
                              <path d="M 0,-10 C 10,-20 5,-40 10,-55" stroke="#14532d" strokeWidth="3.2" fill="none" strokeLinecap="round" />
                            </g>

                            {/* Designer lounge chair */}
                            <g transform="translate(480, 195)">
                              <line x1="-10" y1="10" x2="-10" y2="30" stroke="#94a3b8" strokeWidth="1.5" />
                              <line x1="10" y1="15" x2="10" y2="35" stroke="#94a3b8" strokeWidth="1.5" />
                              <polygon points="-15,10 10,15 18,2 -5, -3" fill="#ffffff" stroke="#94a3b8" strokeWidth="1" />
                              <polygon points="-5,-3 18,2 22,-18 -1,-23" fill="#f1f5f9" stroke="#94a3b8" strokeWidth="1.5" />
                            </g>

                            {/* ==================== 7. EXPLICIT ANNOTATIONS / OVERLAYS ==================== */}
                            <g transform="translate(15, 222)" className="pointer-events-none">
                              <rect x="0" y="0" width="190" height="42" rx="6" fill="#0f172a" fillOpacity="0.9" stroke="#1e293b" strokeWidth="1" />
                              <text x="8" y="14" fontSize="7" fontWeight="black" fill="#38bdf8">VUE EN PERSPECTIVE VOLUMETRIQUE (3D)</text>
                              <text x="8" y="24" fontSize="8" fontWeight="black" fill="#ffffff">Bleu : Colonne Vol. 1 (2,25m)</text>
                              <text x="8" y="34" fontSize="8" fontWeight="black" fill="#fbbf24">Orange : Enveloppe Vol. 2 (0,60m)</text>
                            </g>
                          </svg>

                          <div className="absolute top-2 right-2 bg-slate-900/90 text-white border border-slate-700 p-1 px-2 rounded-lg text-[8px] font-bold shadow-md">
                            Modèle 3D Réel (RGIE)
                          </div>

                          <div className="absolute top-2 left-2 bg-emerald-50 text-emerald-800 p-1 px-2 rounded-lg border border-emerald-100 text-[8px] font-bold shadow-sm">
                             💡 Astuce : Cliquez directement sur les volumes 3D bleu ou orange pour inspecter leur tolérance !
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Evolutionary Comparative Table block */}
                <div className="bg-slate-50 border border-slate-100 p-3.5 rounded-2xl text-xs space-y-2.5">
                  <span className="text-[9.5px] font-black text-slate-400 uppercase tracking-wider block">
                    Synthèse comparative Salle d'Eau (RGIE 2025)
                  </span>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="bg-white p-3 rounded-xl border border-slate-100 space-y-1.5 text-[10.5px]">
                      <div className="flex items-center gap-1.5 font-bold text-slate-700">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                        Ancien RGIE (Livre 1, pré-2025)
                      </div>
                      <ul className="list-disc pl-4 space-y-1 text-slate-500 leading-snug">
                        <li><strong>Volume 1bis distinct</strong> : Présent sous/derrière la baignoire, réservé à la pompe de massage avec liaison équipotentielle.</li>
                        <li><strong>Douche</strong> : 4 zones définies (Volume 0, 1, 2, 3)</li>
                        <li><strong>Volume 1 douche sans bac</strong> : limité à 0.60 m</li>
                        <li><strong>Chauffe-eau en Vol 1</strong> autorisé sous conditions</li>
                      </ul>
                    </div>

                    <div className="bg-white p-3 rounded-xl border border-sky-100 space-y-1.5 text-[10.5px] ring-1 ring-sky-500/10">
                      <div className="flex items-center gap-1.5 font-black text-sky-700">
                        <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse" />
                        Nouveau RGIE (Livre 1, depuis 1er Mars 2025)
                      </div>
                      <ul className="list-disc pl-4 space-y-1 text-slate-700 leading-snug font-medium">
                        <li><strong>Volume 1bis supprimé</strong> : L'espace sous la baignoire est maintenant intégré et régi par les règles du <strong>Volume 1</strong>.</li>
                        <li><strong>Douche : Volume 2 purement supprimé !</strong></li>
                        <li><strong>Volume 1 étendu à 1.20 m</strong> autour du mitigeur fixe.</li>
                        <li>Chauffe-eau en Volume 1 : <strong>raccordement fixe obligatoire et IPX4</strong>.</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Guide de Référence des Équipements Admis et IP par Volume */}
                <div id="volume-reference-guide" className="bg-white border border-slate-200 p-5 rounded-3xl space-y-4 shadow-sm text-left">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3.5">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="p-1 px-2.5 bg-blue-50 text-blue-700 border border-blue-100 rounded-lg text-[9.5px] font-black uppercase tracking-wider">
                          Pour Salles de Bain & Douches
                        </span>
                        <span className="text-[9.5px] font-black text-slate-500 uppercase tracking-widest">
                          Manuel RGIE de sécurité
                        </span>
                      </div>
                      <h4 className="text-[13.5px] font-black text-slate-900 tracking-wide mt-2">
                        Appareils électriques autorisés par Volume & Niveau d'Étanchéité IP
                      </h4>
                    </div>
                    <div className="text-[9.5px] bg-slate-100 border border-slate-200/80 p-1 px-2.5 rounded-full font-bold text-slate-700 self-start sm:self-auto">
                      Norme : <span className={bathStandardYear === 'POST_2025' ? 'text-indigo-600 font-extrabold' : 'text-slate-700 font-extrabold'}>{bathStandardYear === 'POST_2025' ? 'Nouveau RGIE (Post-2025)' : 'Ancien RGIE (Livre 1)'}</span>
                    </div>
                  </div>

                  <p className="text-[11.5px] text-slate-600 leading-relaxed font-semibold">
                    Sélectionnez un volume ci-dessous pour explorer instantanément les exigences réglementaires, la distance de sécurité, l'indice d'étanchéité IP requis et les types d'équipements autorisés en Belgique.
                  </p>

                  {/* Volume Selector Selector Tabs */}
                  <div className="flex flex-wrap gap-1.5 bg-slate-100/85 p-1 rounded-xl border border-slate-200/50">
                    <button 
                      type="button"
                      onClick={() => setGuideSelectedVolume('volume_0')}
                      className={`flex-1 min-w-[70px] text-center py-2 text-[10px] font-black uppercase rounded-lg transition-all ${guideSelectedVolume === 'volume_0' ? 'bg-white text-rose-600 border border-rose-200 shadow-sm font-black' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'}`}
                    >
                      Vol 0
                    </button>
                    <button 
                      type="button"
                      onClick={() => setGuideSelectedVolume('volume_1')}
                      className={`flex-1 min-w-[70px] text-center py-2 text-[10px] font-black uppercase rounded-lg transition-all ${guideSelectedVolume === 'volume_1' ? 'bg-white text-orange-600 border border-orange-200 shadow-sm font-black' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'}`}
                    >
                      Vol 1
                    </button>
                    {bathStandardYear === 'PRE_2025' && (
                      <button 
                        type="button"
                        onClick={() => setGuideSelectedVolume('volume_1bis')}
                        className={`flex-1 min-w-[70px] text-center py-2 text-[10px] font-black uppercase rounded-lg transition-all ${guideSelectedVolume === 'volume_1bis' ? 'bg-white text-purple-600 border border-purple-200 shadow-sm font-black' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'}`}
                      >
                        Vol 1 bis
                      </button>
                    )}
                    {bathStandardYear === 'PRE_2025' && (
                      <button 
                        type="button"
                        onClick={() => setGuideSelectedVolume('volume_2')}
                        className={`flex-1 min-w-[70px] text-center py-2 text-[10px] font-black uppercase rounded-lg transition-all ${guideSelectedVolume === 'volume_2' ? 'bg-white text-amber-700 border border-amber-200 shadow-sm font-black' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'}`}
                      >
                        Vol 2
                      </button>
                    )}
                    <button 
                      type="button"
                      onClick={() => setGuideSelectedVolume('lieu_l')}
                      className={`flex-1 min-w-[75px] text-center py-2 text-[10px] font-black uppercase rounded-lg transition-all ${guideSelectedVolume === 'lieu_l' ? 'bg-white text-emerald-600 border border-emerald-200 shadow-sm font-black' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'}`}
                    >
                      {bathStandardYear === 'POST_2025' ? 'Lieu L (Hors Vol)' : 'Vol 3 (Hors Vol)'}
                    </button>
                  </div>

                  {/* Volume Detailed Fact Sheet */}
                  {(() => {
                    let volTitle = 'Volume 1';
                    let ipNeeded = 'IPX4';
                    let volBoundary = '';
                    let colorTheme = 'orange';
                    let listItems: Array<{name: string, icon: string, status: 'allowed' | 'forbidden' | 'conditional', desc: string}> = [];

                    if (guideSelectedVolume === 'volume_0') {
                      volTitle = 'Volume 0 (Immersion & Contenant)';
                      ipNeeded = 'IPX7';
                      colorTheme = 'red';
                      volBoundary = "Se limite exclusivement à l'intérieur du contenant (la cuvette de la baignoire ou le bac/receveur de douche). Si un équipement (ex: une lampe) est installé au-dessus du contenant (par exemple à hauteur d'épaule ou de tête), il n'est plus dans le Volume 0 mais entre dans le Volume 1 (qui s'étend verticalement jusqu'à 2,25 m).";
                      listItems = [
                        { name: 'Matériel nécessaire uniquement', icon: '⚙️', status: 'conditional', desc: "Seul le matériel strictement nécessaire au fonctionnement de l'installation (tel que l'éclairage intégré ou les buses d'une baignoire d'hydromassage) est autorisé en Volume 0." },
                        { name: 'Alimentation TBTS obligatoire', icon: '⚡', status: 'conditional', desc: "Limitation obligatoire à la Très Basse Tension de Sécurité (TBTS) de maximum 12V AC (alternatif) ou 18V DC (continu non lisse)." },
                        { name: 'Source d\'alimentation déportée', icon: '🔌', status: 'conditional', desc: "Le transformateur de sécurité, le driver LED ou la source TBTS doivent impérativement être placés en dehors des Volumes 0, 1 et 2." },
                        { name: 'Indice de protection & Connexion', icon: '🛡️', status: 'conditional', desc: "Degré minimal IPX7 obligatoire (protection contre l'immersion temporaire) avec raccordement fixe, étanche et scellé de façon permanente." },
                        { name: 'Interdictions absolues', icon: '❌', status: 'forbidden', desc: "Les boîtes de dérivation, les prises de courant et les interrupteurs (même de très basse tension) sont totalement interdits dans le Volume 0." }
                      ];
                    } else if (guideSelectedVolume === 'volume_1') {
                      volTitle = 'Volume 1 (Projection d\'eau)';
                      ipNeeded = 'IPX4';
                      colorTheme = 'orange';
                      volBoundary = bathStandardYear === 'POST_2025' 
                        ? (bathEquipmentType === 'shower' 
                            ? "Espace entourant la douche jusqu'à une hauteur de 2.25 m. Sur douches sans receveur, cela s'étend sur un rayon élargi à 1.20 m à partir de la pomme de douche fixe (et non plus 0.60 m). Intègre désormais l'espace technique sous le bac."
                            : "Volume vertical s'élevant à l'aplomb du bord externe de la baignoire jusqu'à 2.25 m au-dessus du niveau du sol fini.")
                        : (bathEquipmentType === 'shower'
                            ? "Espace vertical autour du bac ou receveur de douche jusqu'à 2.25 m de hauteur relative. Pour les douches sans bac, limité à 0.60 m de la pomme de douche."
                            : "Volume vertical à la périphérie extérieure de la baignoire jusqu'à une hauteur de 2.25 m.");
                      listItems = [
                        { name: 'Prises de courant standard (230V)', icon: '🔌', status: 'forbidden', desc: "Strictement interdit (excepté les prises pour rasoir électrique ≤ 20 VA isolées par transformateur d'isolement)." },
                        { name: 'Interrupteurs & Organes de Commande', icon: '🎛️', status: 'conditional', desc: 'Interdit en direct 230V standard. Admis uniquement si interrupteurs alimentés en TBTS de sécurité (max 12V), interrupteurs à tirette à cordon isolant synthétique non conducteur, ou télécommandes (radio/optique).' },
                        { name: 'Points d\'éclairage / Spots de salle d\'eau', icon: '💡', status: 'conditional', desc: 'IPX4 min obligatoire dès lors qu\'il est situé en Volume 1 (haut. &le; 2,25 m relative). Luminaire impérativement fixe à raccordement direct permanent sans prise de courant. En 230V : Classe II minimum et relié sur différentiel 30 mA. En TBTS (ex : LED 12V) : transformateur/driver obligatoire hors des volumes 0 et 1. Interrupteur direct 230V interdit (TBTS ou tirette seule admise).' },
                        { name: 'Chauffe-eau électrique fixe', icon: '🚿', status: 'conditional', desc: 'IPX4 requis. Raccordement direct permanent sans fiche d\'alimentation requis. Pour le Nouveau RGIE raccordement rigide obligatoire.' },
                        { name: 'Sèche-serviette fixe ou Chauffages', icon: '🌡️', status: 'forbidden', desc: 'Strictement interdit en tension standard 230V direct (sauf si de type TBTS 12V raccordé à lointaine distance).' }
                      ];
                    } else if (guideSelectedVolume === 'volume_1bis') {
                      volTitle = 'Volume 1 bis (Espace technique d\'hydromassage)';
                      ipNeeded = 'IPX4';
                      colorTheme = 'purple';
                      volBoundary = "Présent uniquement sous l'ancien RGIE (pré-2025). Il désigne le volume fermé sous, derrière ou sur le côté de la baignoire ou du bac à douche servant de regard technique.";
                      listItems = [
                        { name: 'Prises de courant standard (230V)', icon: '🔌', status: 'forbidden', desc: 'Strictement interdit d\'installer des prises de courant.' },
                        { name: 'Interrupteurs & Éclairages généraux', icon: '🎛️', status: 'forbidden', desc: 'Interdit d\'installer des appareils de commande ou luminaires conventionnels.' },
                        { name: 'Pompes d\'hydromassage / Moteurs', icon: '⚙️', status: 'conditional', desc: 'IPX4 requis. Seuls les moteurs d\'hydromassages homologués de la baignoire y sont autorisés, à raccordement fixe permanent (sans fiche mobile) et raccordés obligatoirement à la liaison équipotentielle locale.' }
                      ];
                    } else if (guideSelectedVolume === 'volume_2') {
                      volTitle = 'Volume 2 (Enveloppe protectrice)';
                      ipNeeded = 'IPX4';
                      colorTheme = 'amber';
                      volBoundary = "Zone s'étendant à 0.60 m à l'extérieur des bords verticaux du Volume 1 du sol jusqu'à 2.25 m de hauteur. Remarque : Supprimé pour les installations de douche sous l'égide du Nouveau RGIE (post-Mars 2025) !";
                      listItems = [
                        { name: 'Prises de courant standard (230V)', icon: '🔌', status: 'conditional', desc: 'Autorisées UNIQUEMENT si alimentées par un transformateur de séparation individuel de sécurité OU protégées localement par un différentiel haute sensibilité individuel de maximum 10 mA.' },
                        { name: 'Interrupteurs & Commandes directes', icon: '🎛️', status: 'conditional', desc: 'Interrupteurs directs 230V interdits sauf s\'ils sont intégrés dans des appareils certifiés ou TBTS de sécurité.' },
                        { name: 'Points d\'éclairage / Appliques d\'angle', icon: '💡', status: 'conditional', desc: 'Admis si IPX4 minimum et obligatoirement de classe II (double isolation) raccordé en direct fixe.' },
                        { name: 'Chauffe-eau électrique de proximité', icon: '🚿', status: 'allowed', desc: 'Autorisé si IPX4 minimum avec connexion fixe permanente.' },
                        { name: 'Sèche-serviette mural / Convecteurs', icon: '🌡️', status: 'conditional', desc: 'Autorisé si de classe II obligatoirement, IPX4 minimum et alimenté en connexion fixe (pas de fiche prise volant).' }
                      ];
                    } else {
                      volTitle = bathStandardYear === 'POST_2025' ? 'Lieu L (Hors volumes de sécurité)' : 'Volume 3 (Volume Hors enveloppe)';
                      ipNeeded = 'IPX1';
                      colorTheme = 'emerald';
                      volBoundary = bathStandardYear === 'POST_2025'
                        ? "Espace délimité horizontalement par un plan vertical situé à une distance de 4,00 mètres des arrivées d'eau fixes (sortie du robinet, pomme de douche fixe ou mitigeur), et verticalement au-dessus par un plan horizontal situé à 3,00 mètres au-dessus du sol fini."
                        : "Zone située en dehors du Volume 2 s'étendant horizontalement jusqu'à 2,40 m de ses limites, limitée verticalement jusqu'à une hauteur de 2,25 m au-dessus du sol fini.";
                      listItems = [
                        { name: 'Prises de courant standard (230V)', icon: '🔌', status: 'conditional', desc: 'IPX1 requis. Admises sans restriction d\'emplacement à condition d\'être protégées par l\'interrupteur différentiel de Haute Sensibilité de maximum 30 mA obligatoire de la salle de bain.' },
                        { name: 'Interrupteurs directs (230V)', icon: '🎛️', status: 'allowed', desc: 'IPX1 requis. Autorisés s\'ils sont en aval du différentiel de 30 mA.' },
                        { name: 'Points d\'éclairage / suspensions', icon: '💡', status: 'allowed', desc: 'IPX1 minimum requis s\'ils sont situés hors portée des projections d\'eau.' },
                        { name: 'Chauffe-eau & Sèche-serviettes fixes', icon: '🚿', status: 'allowed', desc: 'IPX1 requis. Autorisés avec mise à la terre robuste raccordée sur differentiel 30mA.' }
                      ];
                    }

                    const getStatusColor = (status: string) => {
                      if (status === 'allowed') return 'bg-emerald-100 text-emerald-800 border border-emerald-200';
                      if (status === 'forbidden') return 'bg-rose-100 text-rose-800 border border-rose-200';
                      return 'bg-amber-100 text-amber-800 border border-amber-200';
                    };

                    const getStatusText = (status: string) => {
                      if (status === 'allowed') return 'Oui ✔ Admis';
                      if (status === 'forbidden') return 'Non ❌ Interdit';
                      return '⚠️ Sous conditions';
                    };

                    const getHeaderBorderAndBg = (theme: string) => {
                      if (theme === 'red') return 'bg-gradient-to-r from-red-50 to-rose-50/50 border-red-150 text-red-950';
                      if (theme === 'orange') return 'bg-gradient-to-r from-orange-50 to-amber-50/50 border-orange-150 text-orange-950';
                      if (theme === 'purple') return 'bg-gradient-to-r from-purple-50 to-fuchsia-50/50 border-purple-150 text-purple-950';
                      if (theme === 'amber') return 'bg-gradient-to-r from-amber-50 to-yellow-50/50 border-amber-150 text-amber-950';
                      return 'bg-gradient-to-r from-emerald-50 to-teal-50/50 border-emerald-150 text-emerald-950';
                    };

                    const getIndicatorDotColor = (theme: string) => {
                      if (theme === 'red') return 'bg-red-500';
                      if (theme === 'orange') return 'bg-orange-500';
                      if (theme === 'purple') return 'bg-purple-500';
                      if (theme === 'amber') return 'bg-amber-500';
                      return 'bg-emerald-500';
                    };

                    return (
                      <div className="space-y-3.5 animate-fadeIn">
                        {/* Selected Volume Banner */}
                        <div className={`p-4 rounded-xl border ${getHeaderBorderAndBg(colorTheme)} space-y-2`}>
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                            <div className="flex items-center gap-2">
                              <span className={`w-3 h-3 rounded-full ${getIndicatorDotColor(colorTheme)} animate-pulse`} />
                              <span className="font-extrabold text-sm tracking-tight">{volTitle}</span>
                            </div>
                            <div className="flex items-center gap-1.5 self-start sm:self-auto">
                              <span className="text-[10px] uppercase text-slate-500 font-bold tracking-wider">Protection requise :</span>
                              <span className="px-2.5 py-1 bg-slate-900 text-white font-mono text-xs font-black rounded-lg shadow-sm">{ipNeeded}</span>
                            </div>
                          </div>
                          <p className="text-[11.5px] text-slate-700 leading-relaxed pt-2 border-t border-black/5 font-semibold">
                            <strong>Limites spatiales</strong> : {volBoundary}
                          </p>
                        </div>

                        {/* Equipments Table List */}
                        <div className="bg-slate-50/70 rounded-2xl border border-slate-200/80 divide-y divide-slate-200/80">
                          {listItems.map((item, index) => (
                            <div key={index} className="p-3.5 flex flex-col sm:flex-row sm:items-start gap-2.5 sm:gap-4 transition-all hover:bg-slate-100/40">
                              <div className="flex items-center gap-2 shrink-0 sm:w-52">
                                <span className="text-base bg-white p-1.5 rounded-lg border border-slate-200 shadow-sm">{item.icon}</span>
                                <div className="text-[11.5px] font-extrabold text-slate-800 tracking-tight leading-tight">
                                  {item.name}
                                </div>
                              </div>
                              <div className="flex-1 space-y-1">
                                <div className="flex items-center gap-1.5">
                                  <span className={`px-2 py-0.5 text-[8.5px] font-black uppercase rounded-md tracking-wider border ${getStatusColor(item.status)}`}>
                                    {getStatusText(item.status)}
                                  </span>
                                </div>
                                <p className="text-[11px] text-slate-650 leading-relaxed font-semibold">
                                  {item.desc}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* General DDR and Equipotential Rule */}
                        <div className="bg-sky-50 border border-sky-100 p-3.5 rounded-2xl flex items-start gap-2.5 shadow-sm">
                          <Info className="w-4 h-4 text-sky-600 mt-0.5 shrink-0" />
                          <div className="text-[11px] text-sky-950 leading-relaxed font-semibold">
                            <strong>Liaison Équipotentielle Locale & Différentiels (DDR)</strong> : Tous les circuits de la salle d'eau doivent obligatoirement être protégés en amont par un dispositif à courant résiduel <strong>(DDR) d'au moins 30 mA maximum</strong>. Toutes les masses métalliques (baignoires, receveurs métalliques, tuyaux) doivent être reliées ensemble à l'aide d'un conducteur d’équipotentialité supplémentaire de section minimale de <strong>4 mm²</strong>.
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </motion.div>
            );
          })()
        ) : activeTab === 'influences' ? (
              <motion.div 
                key="influences-view"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="w-full flex flex-col pt-2 text-left"
              >
                {(() => {
                  const selectedRow = influenceRows.find(r => r.id === selectedInfluenceRowId) || influenceRows[0];
                  if (!selectedRow) return <div className="text-sm text-slate-500 font-bold">Aucun local configuré.</div>;
                  
                  return (
                    <div className="space-y-6">
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                        <div>
                          <div className="text-[10px] font-black tracking-widest text-[#F43F5E] uppercase mb-1">Localisation & Diagnostic</div>
                          <h3 className="text-2xl font-black text-slate-800 tracking-tight">{selectedRow.local}</h3>
                        </div>
                        
                        <div className="flex gap-1.5 self-stretch md:self-auto overflow-x-auto shrink-0 py-1">
                          {influenceRows.map((row) => (
                            <button
                              key={row.id}
                              onClick={() => setSelectedInfluenceRowId(row.id)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                                selectedRow.id === row.id 
                                  ? 'bg-rose-500 text-white shadow-sm'
                                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                              }`}
                            >
                              {row.local}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Diagnostic Summary Panel - Table styled */}
                      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
                        <div className="bg-slate-900 px-6 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                          <div>
                            <h4 className="text-sm font-black tracking-wide text-white uppercase">Tableau des Influences Externes (RGIE belge - AREI)</h4>
                            <p className="text-[10.5px] font-medium text-slate-400 mt-0.5">Cliquez sur un code d&apos;influence pour consulter ou modifier sa classe</p>
                          </div>
                          {influenceRows.length > 1 && (
                            <button
                              onClick={() => {
                                const remaining = influenceRows.filter(r => r.id !== selectedRow.id);
                                setInfluenceRows(remaining);
                                setSelectedInfluenceRowId(remaining[0]?.id || '');
                              }}
                              className="text-[9.5px] font-bold bg-rose-500/20 hover:bg-rose-500/30 text-rose-450 border border-rose-500/25 px-2.5 py-1 rounded-xl transition-colors shrink-0"
                            >
                              Supprimer ce local
                            </button>
                          )}
                        </div>

                        {/* Interactive Matrix Grid */}
                        <div className="overflow-x-auto custom-scrollbar">
                          <table className="w-full text-[11px] border-collapse min-w-[700px]">
                            <thead>
                              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-extrabold uppercase select-none font-sans">
                                <th className="px-4 py-3 text-left w-1/4">Domaine d&apos;influence</th>
                                <th className="px-4 py-3 text-center w-16">Code</th>
                                <th className="px-4 py-3 text-left">Classe actuelle</th>
                                <th className="px-4 py-3 text-left">Prescriptions techniques associées</th>
                              </tr>
                            </thead>
                            <tbody>
                              {Object.entries(INFLUENCES_CONFIG).map(([key, item]) => {
                                const currentCode = (selectedRow as any)[key];
                                const currentOption = item.options.find(o => o.code === currentCode) || item.options[0];
                                const isSelected = selectedInfluenceColKey === key;
                                
                               return (
                                  <tr 
                                    key={key} 
                                    className={`border-b border-slate-100 hover:bg-slate-50/50 transition-colors cursor-pointer ${
                                      isSelected ? 'bg-rose-50/40 border-l-4 border-l-rose-500' : ''
                                    } ${key === 'AF' && currentCode !== 'AF1' ? 'bg-amber-50/40 hover:bg-amber-55' : ''}`}
                                    onClick={() => setSelectedInfluenceColKey(key)}
                                  >
                                    <td className="px-4 py-3 text-slate-800 font-bold">
                                      <div className="flex items-center gap-1.5 font-sans">
                                        <span className={`text-[8.5px] font-black px-1.5 py-0.5 rounded ${
                                          key === 'AF' && currentCode !== 'AF1' ? 'bg-[#F43F5E] text-white shadow-sm ring-1 ring-rose-250 animate-pulse' :
                                          item.category === 'A' ? 'bg-blue-100 text-blue-700' :
                                          item.category === 'B' ? 'bg-purple-100 text-purple-700' :
                                          'bg-amber-100 text-amber-700'
                                        }`}>
                                          {key}
                                        </span>
                                        <span className={key === 'AF' && currentCode !== 'AF1' ? 'text-rose-700 font-black flex items-center gap-1' : ''}>
                                          {item.title}
                                          {key === 'AF' && currentCode !== 'AF1' && (
                                            <span className="text-[9px] bg-rose-200 text-rose-800 font-extrabold px-1.5 py-0.2 rounded-full uppercase leading-none">Risque Corrosion</span>
                                          )}
                                        </span>
                                      </div>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                      <span className={`font-mono font-black px-2 py-0.5 rounded-lg border ${
                                        key === 'AF' && currentCode !== 'AF1' 
                                          ? 'text-rose-700 bg-rose-50 border-[#F43F5E]' 
                                          : 'text-rose-600 bg-rose-50 border-rose-100'
                                      }`}>
                                        {currentCode}
                                      </span>
                                    </td>
                                    <td className={`px-4 py-3 font-extrabold ${
                                      key === 'AF' && currentCode !== 'AF1' ? 'text-rose-950 font-black' : 'text-slate-900'
                                    }`}>
                                      {currentOption.label}
                                    </td>
                                    <td className={`px-4 py-3 max-w-sm font-medium ${
                                      key === 'AF' && currentCode !== 'AF1' ? 'text-amber-950' : 'text-slate-500'
                                    }`}>
                                      {currentOption.desc}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>

                        {/* Dropdown Options Editor for Selected Influence Key */}
                        {selectedInfluenceColKey && INFLUENCES_CONFIG[selectedInfluenceColKey as keyof typeof INFLUENCES_CONFIG] && (() => {
                          const conf = INFLUENCES_CONFIG[selectedInfluenceColKey as keyof typeof INFLUENCES_CONFIG];
                          const currentValue = (selectedRow as any)[selectedInfluenceColKey];
                          
                          return (
                            <div className="bg-slate-50 p-5 border-t border-slate-200 text-left">
                              <div className="flex items-center gap-2 mb-3">
                                <span className="text-[10px] bg-slate-900 text-white font-black px-2 py-0.5 rounded-lg font-mono">
                                  Éditeur {selectedInfluenceColKey}
                                </span>
                                <h4 className="text-xs font-black uppercase text-slate-700">
                                  Classe de l&apos;influence : <span className="text-rose-650 font-black">{conf.title}</span>
                                </h4>
                              </div>
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                                {conf.options.map((opt) => {
                                  const isActive = opt.code === currentValue;
                                  return (
                                    <button
                                      key={opt.code}
                                      onClick={() => {
                                        const updatedRows = influenceRows.map(r => {
                                          if (r.id === selectedRow.id) {
                                            return { ...r, [selectedInfluenceColKey]: opt.code };
                                          }
                                          return r;
                                        });
                                        setInfluenceRows(updatedRows);
                                      }}
                                      className={`p-3 rounded-xl border text-left flex gap-2 w-full transition-all ${
                                        isActive 
                                          ? 'bg-rose-50 border-rose-300 text-rose-950 ring-2 ring-rose-200' 
                                          : 'bg-white border-slate-200 hover:border-slate-350 text-slate-750'
                                      }`}
                                    >
                                      {isActive ? (
                                        <Check className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                                      ) : (
                                        <span className="w-4 h-4 rounded-full border border-slate-300 shrink-0 mt-0.5 block" />
                                      )}
                                      <div>
                                        <div className="text-[11px] font-extrabold flex items-center gap-1.5">
                                          <span className="font-mono text-[10px] text-slate-400 font-normal">{opt.code}</span>
                                          <span>{opt.label}</span>
                                        </div>
                                        <p className="text-[9.5px] leading-tight text-slate-500 mt-0.5 font-medium">{opt.desc}</p>
                                      </div>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })()}
                      </div>

                      {/* Educational Guide Card */}
                      <div className="bg-slate-50 rounded-2xl p-4 border border-slate-250 flex flex-col md:flex-row items-stretch gap-4 text-left font-sans">
                        <div className="p-3 bg-white rounded-xl border border-slate-200 flex-1">
                          <h4 className="text-xs font-black text-slate-800 uppercase mb-1">💡 Comprendre la Codification</h4>
                          <p className="text-[10px] leading-relaxed text-slate-500 font-medium">
                            Chaque influence est codée avec 2 majuscules et 1 chiffre :
                            <br />• 1ère lettre : <strong>A</strong> = Environnement, <strong>B</strong> = Utilisation, <strong>C</strong> = Construction.
                            <br />• 2ème lettre : Nature de l&apos;influence externe (ex: <strong>D</strong> = Eau, <strong>G</strong> = Chocs).
                            <br />• Chiffre : Sévérité ou caractéristique de l&apos;influence.
                          </p>
                        </div>
                        <div className="p-3 bg-white rounded-xl border border-slate-200 flex-1">
                          <h4 className="text-xs font-black text-slate-800 uppercase mb-1">🎯 Rôle de l&apos;installateur</h4>
                          <p className="text-[10px] leading-relaxed text-slate-500 font-medium">
                            Le <strong>RGIE belge (Livre 1)</strong> impose à l&apos;installateur d&apos;adapter le matériel et la pose de façon à résister à ces contraintes. Une classe supérieure (ex: AD4 au lieu de AD1) contraint à augmenter l&apos;indice de protection minimal <strong>IPXX</strong> ou l&apos;indice d&apos;impact <strong>IKXX</strong>.
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </motion.div>
        ) : activeTab === 'rj45' ? (
              <motion.div 
                key="rj45-view"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="w-full flex flex-col items-center pt-4"
              >
                <div className="text-[12px] font-semibold uppercase tracking-[0.2em] text-text-muted mb-8">
                  Schéma de Câblage T568B
                </div>

                <div className="bg-white border-2 border-slate-300 rounded-xl overflow-hidden shadow-sm w-72">
                  <div className="bg-white border-b-2 border-slate-300 py-3 text-center">
                    <h3 className="text-3xl font-black text-slate-800 tracking-tighter">T-568B</h3>
                  </div>
                  
                  <div className="bg-[#fce0d8] p-4 pt-2">
                    <div className="flex justify-between px-2 mb-4">
                      {[1, 2, 3, 4, 5, 6, 7, 8].map(n => (
                        <div key={n} className="w-6 text-center text-lg font-bold text-slate-700">{n}</div>
                      ))}
                    </div>

                    <div className="flex h-56 items-stretch justify-between px-2 gap-1 mb-2">
                      {[
                        { label: 'O/', color: '#f97316', striped: true },
                        { label: 'O', color: '#f97316', striped: false },
                        { label: 'G/', color: '#22c55e', striped: true },
                        { label: 'B', color: '#2563eb', striped: false },
                        { label: 'B/', color: '#2563eb', striped: true },
                        { label: 'G', color: '#22c55e', striped: false },
                        { label: 'Br/', color: '#78350f', striped: true },
                        { label: 'Br', color: '#78350f', striped: false },
                      ].map((wire, idx) => (
                        <div key={idx} className="flex flex-col items-center flex-1">
                          <div className="w-full h-1 bg-slate-400 mb-2 rounded-full" />
                          <div 
                            className="w-full flex-1 rounded-t-sm border border-black/20 shadow-inner overflow-hidden"
                            style={{ 
                              backgroundColor: wire.striped ? '#fff' : wire.color,
                              backgroundImage: wire.striped 
                                ? `repeating-linear-gradient(45deg, transparent, transparent 10px, ${wire.color} 10px, ${wire.color} 20px)`
                                : 'none'
                            }}
                          />
                          <div className="mt-2 text-[11px] font-bold text-slate-700">{wire.label}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-10 max-w-xs text-[11px] leading-relaxed text-text-muted italic bg-pink-50/50 p-4 rounded-xl border border-pink-100">
                  <Info className="w-4 h-4 text-pink-400 mb-2" />
                  Le standard <strong>T568B</strong> est le plus utilisé en milieu résidentiel et tertiaire. Un câble "droit" utilise le même standard aux deux extrémités.
                </div>
              </motion.div>
            ) : activeTab === 'smart-meter' ? (
              <SmartMeterDisplay
                state={smartMeterState}
                onUpdateState={(patch) => setSmartMeterState({ ...smartMeterState, ...patch })}
              />
            ) : (
              <motion.div 
                key="cable-view"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="w-full flex flex-col items-center"
              >
                <div className="text-[12px] font-semibold uppercase tracking-[0.2em] text-text-muted mb-12">
                  Visualisation Câble XVB
                </div>

                {/* Cable Cross-Section Representation */}
                <div className="relative w-64 h-64 flex items-center justify-center">
                  {/* Outer Sheath (Grey) */}
                  <div className="absolute w-full h-full rounded-full bg-[#D1D5DB] shadow-inner border-4 border-[#9CA3AF] flex items-center justify-center">
                    {/* Inner Insulation Layer */}
                    <div className="w-[90%] h-[90%] rounded-full bg-[#F3F4F6] border border-[#E5E7EB] relative">
                      {/* Conductors (3G) */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        {/* Earth (Green/Yellow) */}
                        <div 
                          style={{ 
                            width: `${15 + (selectedSection / 16) * 40}%`, 
                            height: `${15 + (selectedSection / 16) * 40}%`,
                            top: '15%'
                          }}
                          className="absolute rounded-full bg-gradient-to-r from-green-500 via-yellow-400 to-green-500 border border-green-600 shadow-sm"
                        />
                        {/* Phase (Brown) */}
                        <div 
                          style={{ 
                            width: `${15 + (selectedSection / 16) * 40}%`, 
                            height: `${15 + (selectedSection / 16) * 40}%`,
                            bottom: '20%',
                            left: '15%'
                          }}
                          className="absolute rounded-full bg-[#78350F] border border-[#451A03] shadow-sm"
                        />
                        {/* Neutral (Blue) */}
                        <div 
                          style={{ 
                            width: `${15 + (selectedSection / 16) * 40}%`, 
                            height: `${15 + (selectedSection / 16) * 40}%`,
                            bottom: '20%',
                            right: '15%'
                          }}
                          className="absolute rounded-full bg-[#1D4ED8] border border-[#1E3A8A] shadow-sm"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-12 space-y-2">
                  <div className="text-3xl font-bold text-text-main">XVB 3G {selectedSection} mm²</div>
                  <div className="text-sm text-text-muted font-medium">
                    Diamètre approx. : {(Math.sqrt(selectedSection / Math.PI) * 2 * 1.5).toFixed(1)} mm
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-border-theme w-full max-w-xs text-[9px] text-text-muted italic leading-relaxed text-center space-y-1">
                  <div>R câble = (ρ × 2L) / S | ρ = 0.017</div>
                  <div>ΔU = R × I (Calibre)</div>
                  <div>Icc = U / R câble</div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {activeTab === 'threshold' && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute bottom-8 left-12 right-12 grid grid-cols-4 gap-4"
              >
                {[
                  { label: 'P. Limite', value: `${maxPower} W`, icon: Shield, color: 'text-text-main', bg: 'bg-white' },
                  { 
                    label: 'P. Tirée', 
                    value: measuredPower > 0 ? (measuredPower.toLocaleString('fr-FR') + " W") : '---', 
                    icon: Zap, 
                    color: diagnostic ? diagnostic.color : 'text-text-main',
                    bg: diagnostic ? diagnostic.bg : 'bg-white'
                  },
                  { 
                    label: 'Courant (I)', 
                    value: measuredCurrent > 0 ? (measuredCurrent.toLocaleString('fr-FR', { minimumFractionDigits: 4, maximumFractionDigits: 4 }) + " A") : '---', 
                    icon: Activity, 
                    color: diagnostic ? diagnostic.color : 'text-text-main',
                    bg: diagnostic ? diagnostic.bg : 'bg-white'
                  },
                  { label: 'R. Mesurée', value: `${measuredResistance || '---'} Ω`, icon: Omega, color: 'text-text-main', bg: 'bg-white' }
                ].map((stat) => (
                  <div 
                    key={stat.label} 
                    className={`flex flex-col p-3 rounded-xl border border-border-theme/40 ${stat.bg} shadow-[0_2px_10px_rgba(0,0,0,0.02)] transition-all duration-300`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <stat.icon className={`w-3 h-3 ${stat.color} opacity-70`} />
                      <span className="text-[9px] font-black uppercase tracking-widest text-text-muted">{stat.label}</span>
                    </div>
                    <span className={`text-sm font-black font-mono tracking-tight ${stat.color}`}>
                      {stat.value}
                    </span>
                  </div>
                ))}
              </motion.div>
            )}
                </AnimatePresence>
              </div>
            </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {activeTab === 'home' && (
        <MadeByBadge variant="banner" className="mt-8 mb-6" />
      )}
    </div>
  );
}
