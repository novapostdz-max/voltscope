/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface WireDefinition {
  name: string;
  hex: string;
  role: string;
  defaultTerminal: number;
}

export const WIRE_DEFINITIONS: Record<string, WireDefinition> = {
  brun: {
    name: 'Brun (L1)',
    hex: '#854D0E',
    role: 'L1',
    defaultTerminal: 1,
  },
  noir: {
    name: 'Noir (L2)',
    hex: '#0F172A',
    role: 'L2',
    defaultTerminal: 2,
  },
  gris: {
    name: 'Gris (L3)',
    hex: '#64748B',
    role: 'L3',
    defaultTerminal: 3,
  },
  bleu: {
    name: 'Bleu (N)',
    hex: '#0284C7',
    role: 'N',
    defaultTerminal: 4,
  },
};

export interface InputOutputTransferResult {
  isDirect: boolean;
  inputSeq: {
    isClockwise: boolean;
  };
  term1Phase: string;
  term2Phase: string;
  term3Phase: string;
  phaseAtU: string;
  phaseAtV: string;
  phaseAtW: string;
  formulaProof: string;
}

export function evaluateInputOutputTransfer(
  inputWires: [string, string, string],
  outputWires: [string, string, string]
): InputOutputTransferResult {
  // Input wire to Phase mapping:
  // Brun = L1, Noir = L2, Gris = L3
  const wireToPhase = (color: string) => {
    if (color === 'brun') return 'L1';
    if (color === 'noir') return 'L2';
    if (color === 'gris') return 'L3';
    return 'L1';
  };

  const term1Phase = wireToPhase(inputWires[0]);
  const term2Phase = wireToPhase(inputWires[1]);
  const term3Phase = wireToPhase(inputWires[2]);

  // Input sequence clockwise check:
  // L1-L2-L3, L2-L3-L1, L3-L1-L2 are direct (clockwise)
  const isInputClockwise =
    (term1Phase === 'L1' && term2Phase === 'L2' && term3Phase === 'L3') ||
    (term1Phase === 'L2' && term2Phase === 'L3' && term3Phase === 'L1') ||
    (term1Phase === 'L3' && term2Phase === 'L1' && term3Phase === 'L2');

  // Output terminal mapping:
  // Bornes 1, 2, 3 have potentials (term1Phase, term2Phase, term3Phase)
  // outputWires[0] is connected to Borne 1
  // outputWires[1] is connected to Borne 2
  // outputWires[2] is connected to Borne 3
  // Bobine U is connected to wire 'brun'
  // Bobine V is connected to wire 'noir'
  // Bobine W is connected to wire 'gris'

  let phaseAtU = '';
  let phaseAtV = '';
  let phaseAtW = '';

  const terminalPhases = [term1Phase, term2Phase, term3Phase];

  outputWires.forEach((outWire, idx) => {
    const phaseAtThisTerminal = terminalPhases[idx];
    if (outWire === 'brun') phaseAtU = phaseAtThisTerminal;
    if (outWire === 'noir') phaseAtV = phaseAtThisTerminal;
    if (outWire === 'gris') phaseAtW = phaseAtThisTerminal;
  });

  // Check if motor windings (U, V, W) receive a direct cyclic sequence (L1-L2-L3, L2-L3-L1, L3-L1-L2)
  const isDirect =
    (phaseAtU === 'L1' && phaseAtV === 'L2' && phaseAtW === 'L3') ||
    (phaseAtU === 'L2' && phaseAtV === 'L3' && phaseAtW === 'L1') ||
    (phaseAtU === 'L3' && phaseAtV === 'L1' && phaseAtW === 'L2');

  let formulaProof = '';
  if (isDirect) {
    formulaProof = `Ordre cyclique direct respecté aux enroulements (${phaseAtU}-${phaseAtV}-${phaseAtW}). Le champ magnétique statorique tourne en sens horaire (horlogique). Le moteur tourne dans le sens normal sans danger.`;
  } else {
    formulaProof = `Inversion de deux phases détectée aux enroulements (${phaseAtU}-${phaseAtV}-${phaseAtW}). Le déphasage spatial produit un vecteur champ tournant antihorlogique (sens inverse).`;
  }

  return {
    isDirect,
    inputSeq: {
      isClockwise: isInputClockwise,
    },
    term1Phase,
    term2Phase,
    term3Phase,
    phaseAtU: phaseAtU || 'L1',
    phaseAtV: phaseAtV || 'L2',
    phaseAtW: phaseAtW || 'L3',
    formulaProof,
  };
}

export interface IndustrialMachine {
  id: string;
  name: string;
  iconName: 'Droplets' | 'Wind' | 'ArrowUpDown' | 'Repeat' | 'Disc';
  dangerLevel: 'Critique' | 'Grave' | 'Modéré';
  description: string;
  normalBehavior: string;
  reverseBehavior: string;
}

export const INDUSTRIAL_MACHINES: IndustrialMachine[] = [
  {
    id: 'pump',
    name: 'Pompe Centrifuge de Relevage',
    iconName: 'Droplets',
    dangerLevel: 'Critique',
    description: 'Pompe d’évacuation des eaux ou de surpression d’immeuble.',
    normalBehavior: 'La turbine projette l’eau vers la volute avec une pression et un débit nominaux conformes.',
    reverseBehavior: 'La turbine tourne à l’envers : débit nul ou effondré de 80%, cavitation violente et risque de désamorçage ou destruction du joint mécanique.',
  },
  {
    id: 'compressor',
    name: 'Compresseur Frigorifique Scroll',
    iconName: 'Wind',
    dangerLevel: 'Critique',
    description: 'Compresseur à spirale pour chambre froide et climatisation industrielle.',
    normalBehavior: 'Les spirales aspirent et compriment le fluide frigorigène. Lubrification optimale par pompe à huile attelée.',
    reverseBehavior: 'Inversion de rotation mortelle : absence totale de lubrification, échauffement immédiat et grippage mécanique en moins de 3 minutes !',
  },
  {
    id: 'lift',
    name: 'Pont Élévateur Hydraulique d’Atelier',
    iconName: 'ArrowUpDown',
    dangerLevel: 'Grave',
    description: 'Pont pour levage de véhicules en garage automobile.',
    normalBehavior: 'Le bouton « Montée » actionne la pompe hydraulique qui envoie la pression d’huile vers les vérins.',
    reverseBehavior: 'Le moteur tourne à l’envers : la pompe ne met pas le circuit sous pression ou déclenche le clapet d’aspiration. Risque d’affaissement ou blocage.',
  },
  {
    id: 'mixer',
    name: 'Pétrin Industriel de Boulangerie',
    iconName: 'Repeat',
    dangerLevel: 'Grave',
    description: 'Pétrin à spirale pour pâte à pain et pâtisserie.',
    normalBehavior: 'La spirale malaxe la pâte du fond vers le centre de la cuve pour un réseau glutineux parfait.',
    reverseBehavior: 'La spirale tourne à l’envers et refoule la pâte hors de la cuve contre les sécurités, avec risque de bris de transmission mécanique.',
  },
  {
    id: 'fan',
    name: 'Extracteur de Désenfumage / Ventilation',
    iconName: 'Disc',
    dangerLevel: 'Grave',
    description: 'Ventilateur centrifuge d’extraction de fumées et de renouvellement d’air.',
    normalBehavior: 'Aspiration des gaz viciés et rejet forcé vers l’extérieur.',
    reverseBehavior: 'Inversion de flux : débit d’air réduit à 25-30%, refoulement des fumées dans les locaux au lieu de les évacuer !',
  },
];
