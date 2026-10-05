/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface WireColorDef {
  id: string;
  code: string;
  name: string;
  hex: string;
  description: string;
  recommendedUse: string;
}

export const WIRE_A_TO_Z_COLORS: WireColorDef[] = [
  { id: 'circ_A', code: 'A', name: 'Bleu Roi', hex: '#2563eb', description: 'Circuit Éclairage Principal', recommendedUse: 'Lampes & spots Salon' },
  { id: 'circ_B', code: 'B', name: 'Rouge Vif', hex: '#dc2626', description: 'Circuit Prises Séjour', recommendedUse: 'Prises TV & salon' },
  { id: 'circ_C', code: 'C', name: 'Vert Émeraude', hex: '#16a34a', description: 'Circuit Prises Cuisine', recommendedUse: 'Prises plan de travail' },
  { id: 'circ_D', code: 'D', name: 'Orange Fluo', hex: '#ea580c', description: 'Circuit Mixte', recommendedUse: 'Prises & éclairage hall' },
  { id: 'circ_E', code: 'E', name: 'Violet Électrique', hex: '#7c3aed', description: 'Circuit Prises Chambres', recommendedUse: 'Chambres 1 à 3' },
  { id: 'circ_F', code: 'F', name: 'Cyan Intense', hex: '#0891b2', description: 'Circuit Éclairage Extérieur', recommendedUse: 'Spots terrasse & façade' },
  { id: 'circ_G', code: 'G', name: 'Rose Magenta', hex: '#db2777', description: 'Circuit Salle de Bain (30mA)', recommendedUse: 'Prises & miroir SDB' },
  { id: 'circ_H', code: 'H', name: 'Or / Ambre', hex: '#ca8a04', description: 'Circuit Taque Cuisson (32A)', recommendedUse: 'Plaque induction 5G6' },
  { id: 'circ_I', code: 'I', name: 'Indigo Nuit', hex: '#4f46e5', description: 'Circuit Four & Micro-ondes', recommendedUse: 'Four encastré 20A' },
  { id: 'circ_J', code: 'J', name: 'Vert Menthe', hex: '#059669', description: 'Circuit Lave-Linge (30mA)', recommendedUse: 'Buanderie dédiée' },
  { id: 'circ_K', code: 'K', name: 'Ambre Doré', hex: '#d97706', description: 'Circuit Sèche-Linge', recommendedUse: 'Buanderie dédiée 20A' },
  { id: 'circ_L', code: 'L', name: 'Bleu Azur', hex: '#0284c7', description: 'Circuit Lave-Vaisselle', recommendedUse: 'Cuisine dédiée 20A' },
  { id: 'circ_M', code: 'M', name: 'Pourpre Royal', hex: '#9333ea', description: 'Circuit Chauffage / Chauffe-eau', recommendedUse: 'Ballon thermodynamique' },
  { id: 'circ_N', code: 'N', name: 'Rouge Cerise', hex: '#e11d48', description: 'Borne de Recharge VE (32A)', recommendedUse: 'Wallbox garage 3x32A' },
  { id: 'circ_O', code: 'O', name: 'Vert Pomme', hex: '#65a30d', description: 'Panneaux Photovoltaïques', recommendedUse: 'Liaison Onduleur DC/AC' },
  { id: 'circ_P', code: 'P', name: 'Fuchsia Vif', hex: '#c026d3', description: 'Domotique & Volets roulants', recommendedUse: 'Moteurs volets électriques' },
  { id: 'circ_Q', code: 'Q', name: 'Teal Océan', hex: '#0d9488', description: 'Pompe à Chaleur / Clim', recommendedUse: 'Unité PAC extérieure' },
  { id: 'circ_R', code: 'R', name: 'Jaune Soleil', hex: '#eab308', description: 'Prises Bureau & Informatique', recommendedUse: 'PC & Baie de brassage' },
  { id: 'circ_S', code: 'S', name: 'Lime Électrique', hex: '#84cc16', description: 'Éclairage d’Ambiance & LED', recommendedUse: 'Rubans LED & corniches' },
  { id: 'circ_T', code: 'T', name: 'Iris Bleu', hex: '#6366f1', description: 'Ventilation VMC Simple/Double', recommendedUse: 'Groupe d’extraction VMC' },
  { id: 'circ_U', code: 'U', name: 'Rose Bonbon', hex: '#ec4899', description: 'Interphone & Sonnette', recommendedUse: 'Vidéophone & carillon' },
  { id: 'circ_V', code: 'V', name: 'Turquoise Vif', hex: '#14b8a6', description: 'Circuits Secourus (Onduleur)', recommendedUse: 'Frigo & alarme secourus' },
  { id: 'circ_W', code: 'W', name: 'Orange Mandarine', hex: '#f97316', description: 'Portail Électrique & Garage', recommendedUse: 'Moteur porte sectionnelle' },
  { id: 'circ_X', code: 'X', name: 'Violet Lavande', hex: '#8b5cf6', description: 'Réseau RJ45 & Multimédia', recommendedUse: 'Prises réseau RJ45 Cat6A' },
  { id: 'circ_Y', code: 'Y', name: 'Mauve Lumineux', hex: '#a855f7', description: 'Sécurité & Alarme Incendie', recommendedUse: 'Détecteurs DAAF & intrusion' },
  { id: 'circ_Z', code: 'Z', name: 'Émeraude Clair', hex: '#10b981', description: 'Piscine & Jardin Extérieur', recommendedUse: 'Pompe filtration piscine' },
];

export const WIRE_10_COLORS: WireColorDef[] = WIRE_A_TO_Z_COLORS.slice(0, 10);
