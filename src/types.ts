/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type TariffMode = 'HP' | 'HC';

export interface ContactorState {
  mainCoilActive: boolean; // Bobine A (A1 - A2)
  releaseCoilActive: boolean; // Bobine E (E1 - E2 de décrochage)
  contactsClosed: boolean; // Pôles 1-2, 3-4, 5-6
  auxContactClosed: boolean; // Contact auxiliaire 13-14
  mechanicallyLatched: boolean; // État du verrou mécanique (latch)
}

export interface RTCCRelayState {
  k1Active: boolean; // Contact K1 (Heures Creuses)
  k2Active: boolean; // Contact K2 (Heures Pleines)
  k3Active?: boolean; // Contact K3 (Auxiliaire)
}

export interface LogEntry {
  id: string;
  timestamp: string;
  type: 'SIGNAL' | 'POWER' | 'MECHANICAL' | 'INFO';
  message: string;
}
