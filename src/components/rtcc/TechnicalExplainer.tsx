/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { LogEntry } from '../../types';
import { BookOpen, CheckCircle2, ShieldAlert, ListFilter, Trash2 } from 'lucide-react';

interface TechnicalExplainerProps {
  logs: LogEntry[];
  onClearLogs: () => void;
}

export const TechnicalExplainer: React.FC<TechnicalExplainerProps> = ({ logs, onClearLogs }) => {
  const [activeTab, setActiveTab] = useState<'explanation' | 'logs'>('explanation');

  return (
    <div className="flex flex-col bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
      {/* Tabs */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-4">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('explanation')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'explanation'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Rôle de l&apos;Accrochage Mécanique</span>
          </button>

          <button
            onClick={() => setActiveTab('logs')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'logs'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <ListFilter className="w-3.5 h-3.5" />
            <span>Journal Événements ({logs.length})</span>
          </button>
        </div>

        {activeTab === 'logs' && logs.length > 0 && (
          <button
            onClick={onClearLogs}
            className="flex items-center gap-1 text-[11px] text-slate-500 hover:text-rose-600 transition-colors cursor-pointer"
          >
            <Trash2 className="w-3 h-3" />
            <span>Effacer</span>
          </button>
        )}
      </div>

      {/* Tab 1: Explication détaillée de la problématique et de la solution */}
      {activeTab === 'explanation' && (
        <div className="space-y-4 text-xs text-slate-700 leading-relaxed">
          <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-300 text-emerald-950">
            <h4 className="font-bold flex items-center gap-2 text-sm text-emerald-900 mb-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Architecture des Alimentations Séparées (Disjoncteur 4P vs Compteur XT211)
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 mt-2">
              <div className="bg-white/80 p-2.5 rounded-md border border-emerald-200">
                <div className="font-bold text-slate-900 text-xs mb-1 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-sky-500"></span>
                  1. Disjoncteur Tétraphasé 4P → Alimentation RTCC
                </div>
                <p className="text-[11px] text-slate-600 leading-normal">
                  Le RTCC ne consomme que très peu d&apos;énergie pour sa platine de décodage 175 Hz. Le <strong>disjoncteur tétraphasé 4P</strong> est raccordé avec <strong>l&apos;arrivée réseau 3P+N en bas</strong> et ses <strong>sorties protégées en haut</strong> : la Borne 2 (Phase L1, signal 175 Hz) alimente l&apos;Entrée 1 du RTCC et la Borne 8 (Neutre N) alimente l&apos;Entrée 2 du RTCC. Un pontage au-dessous du RTCC relie la sortie 1 à la borne 7 (commun des relais).
                </p>
              </div>

              <div className="bg-white/80 p-2.5 rounded-md border border-emerald-200">
                <div className="font-bold text-slate-900 text-xs mb-1 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  2. Compteur Siconia XT211 → Contacts Contacteur &amp; Chauffe-eau
                </div>
                <p className="text-[11px] text-slate-600 leading-normal">
                  Placé <strong>au-dessus du contacteur</strong>, le compteur triphasé mesure l&apos;énergie du chauffage. Ses sorties L1, L2, L3 descendent <strong>en direct (« en droit »)</strong> vers les pôles 1, 3, 5 du contacteur. Sa <strong>sortie bleue (Neutre 8)</strong> descend tout droit directement vers le chauffe-eau.
                </p>
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-lg bg-amber-50 border border-amber-300 text-amber-900">
            <h4 className="font-bold flex items-center gap-2 text-sm text-amber-900 mb-1.5">
              <ShieldAlert className="w-4 h-4 text-amber-600" />
              Pourquoi l&apos;accrochage mécanique est-il indispensable ?
            </h4>
            <p className="mb-2">
              Le récepteur RTCC envoie un signal impulsionnel (télégramme 175 Hz Pulsadis) au moment du passage en <strong>Heures Creuses (HC)</strong>.
            </p>
            <p className="mb-2">
              <strong>Sans accrochage mécanique :</strong> Si une coupure d&apos;électricité survient pendant la nuit (ex: à 02h00), la bobine du contacteur perd son alimentation et les contacts s&apos;ouvrent par rappel de ressort. Au rétablissement du courant (ex: à 02h30), l&apos;impulsion RTCC étant passée depuis longtemps, le contacteur <em>reste ouvert</em> ! Le chauffage ne fonctionne plus et le client se réveille dans le froid.
            </p>
            <p>
              <strong>Avec accrochage mécanique :</strong> Le contacteur possède un loquet physique (accrochage mécanique). Lorsque l&apos;impulsion A1 ferme les contacts, le verrou s&apos;enclenche. Même en cas de coupure totale de courant, <em>les contacts restent mécaniquement verrouillés fermés</em>. Dès le retour de la tension secteur, le chauffage redémarre instantanément sans nécessiter de nouveau signal RTCC !
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="p-3.5 rounded-lg bg-sky-50/70 border border-sky-200">
              <h5 className="font-bold text-sky-900 flex items-center gap-1.5 mb-1.5 text-xs">
                <CheckCircle2 className="w-3.5 h-3.5 text-sky-600" />
                Passage en Heures Creuses (Cycle d&apos;Enclenchement)
              </h5>
              <ol className="list-decimal list-inside space-y-1.5 text-slate-700 leading-normal">
                <li>
                  <strong>Sortie 6 RTCC</strong> : Le télégramme K1 envoie le courant par le <span className="text-red-600 font-semibold">fil rouge</span> vers la borne 6 de la mémoire mécanique.
                </li>
                <li>
                  <strong>Interrupteur 6-5</strong> : Le courant traverse l&apos;interrupteur interne 6-5 fermé au repos et ressort par la <strong>Borne 5</strong>.
                </li>
                <li>
                  <strong>Alimentation Bobine A (A1)</strong> : Le <span className="text-orange-600 font-semibold">fil orange</span> alimente la bobine A du contacteur.
                </li>
                <li>
                  <strong>Fermeture mécanique</strong> : La bobine A attire l&apos;équipage mobile et ferme ses contacts de puissance <strong>1-2, 3-4, 5-6</strong> (chauffage ON) et ferme le contact auxiliaire <strong>13-14 par la force mécanique</strong>.
                </li>
                <li>
                  <strong>Verrouillage &amp; Auto-coupure 5-6</strong> : La mémoire mécanique s&apos;enclenche. <em>L&apos;interrupteur 5-6 s&apos;ouvre car la mémoire l&apos;attire</em>. La bobine A est coupée (0V, aucune consommation, aucun ronflement) tandis que les contacts restent verrouillés fermés mécaniquement.
                </li>
              </ol>
            </div>

            <div className="p-3.5 rounded-lg bg-rose-50/70 border border-rose-200">
              <h5 className="font-bold text-rose-900 flex items-center gap-1.5 mb-1.5 text-xs">
                <CheckCircle2 className="w-3.5 h-3.5 text-rose-600" />
                Passage en Heures Pleines (Cycle de Décrochage)
              </h5>
              <ol className="list-decimal list-inside space-y-1.5 text-slate-700 leading-normal">
                <li>
                  <strong>Sortie 8 RTCC</strong> : Le relais K2 envoie le courant par le <span className="text-orange-600 font-semibold">fil orange</span> vers la <strong>Borne 14</strong>.
                </li>
                <li>
                  <strong>Contact 13-14 fermé</strong> : Le courant traverse le contact 13-14 maintenu fermé mécaniquement et ressort par la <strong>Borne 13</strong> vers la bobine <strong>E1</strong>.
                </li>
                <li>
                  <strong>Bobine E1 de la mémoire</strong> : La bobine E1 attire le loquet et déclenche le <strong>décrochage mécanique</strong>.
                </li>
                <li>
                  <strong>Ouverture &amp; Protection</strong> : Les ressorts ouvrent instantanément les contacts <strong>1-2, 3-4, 5-6</strong> (chauffage OFF) et le contact <strong>13-14</strong> (auto-coupure immédiate protégeant la bobine E1).
                </li>
                <li>
                  <strong>Réarmement de 5-6</strong> : L&apos;interrupteur 5-6 se referme, prêt pour le cycle Heures Creuses suivant.
                </li>
              </ol>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Journal en direct */}
      {activeTab === 'logs' && (
        <div className="flex flex-col max-h-64 overflow-y-auto space-y-1.5 font-mono text-[11px] pr-1">
          {logs.length === 0 ? (
            <div className="text-center py-6 text-slate-500">
              Aucun événement pour le moment. Activez les boutons de commande ci-dessus pour simuler.
            </div>
          ) : (
            logs.map((log) => (
              <div
                key={log.id}
                className="flex items-start gap-2 p-1.5 rounded bg-slate-50 border border-slate-200"
              >
                <span className="text-slate-500 shrink-0">{log.timestamp}</span>
                <span
                  className={`px-1.5 py-0.2 rounded text-[9px] font-bold shrink-0 ${
                    log.type === 'SIGNAL'
                      ? 'bg-sky-50 text-sky-700 border border-sky-200'
                      : log.type === 'POWER'
                      ? 'bg-amber-50 text-amber-700 border border-amber-200'
                      : log.type === 'MECHANICAL'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {log.type}
                </span>
                <span className="text-slate-800">{log.message}</span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
