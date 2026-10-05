/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'motion/react';
import { ContactorState, RTCCRelayState, TariffMode, LogEntry } from '../../types';
import { SchematicView } from './SchematicView';
import { TechnicalExplainer } from './TechnicalExplainer';
import { Radio, Zap, ShieldCheck, RotateCcw, Clock, Compass } from 'lucide-react';

interface RTCCSimulatorProps {
  onOpenChampTournant?: () => void;
}

export const RTCCSimulator: React.FC<RTCCSimulatorProps> = ({ onOpenChampTournant }) => {
  // Grid and system state
  const [gridPower, setGridPower] = useState<boolean>(true);
  const [tariff, setTariff] = useState<TariffMode>('HP');
  const [latchInstalled, setLatchInstalled] = useState<boolean>(true);

  // RTCC relay state
  const [relays, setRelays] = useState<RTCCRelayState>({
    k1Active: false,
    k2Active: false,
  });

  // Contactor state
  const [contactor, setContactor] = useState<ContactorState>({
    mainCoilActive: false,
    releaseCoilActive: false,
    contactsClosed: false,
    auxContactClosed: false,
    mechanicallyLatched: false,
  });

  // Transient pulsing indicators
  const [isK1Pulsing, setIsK1Pulsing] = useState<boolean>(false);
  const [isK2Pulsing, setIsK2Pulsing] = useState<boolean>(false);
  const [signal175HzActive, setSignal175HzActive] = useState<boolean>(false);
  const signalTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Index de consommation kWh du compteur (tourne en temps réel pendant la consommation)
  const [kwhHCIndex, setKwhHCIndex] = useState<number>(14285.4);
  const [kwhHPIndex, setKwhHPIndex] = useState<number>(38410.2);

  const emitSignal175Hz = useCallback(() => {
    if (signalTimerRef.current) clearTimeout(signalTimerRef.current);
    setSignal175HzActive(true);
    signalTimerRef.current = setTimeout(() => {
      setSignal175HzActive(false);
    }, 1200); // Durée rigoureusement identique à l'impulsion du signal (1.2s), pas plus
  }, []);

  // 24h simulated clock (vitesse fixée à 2 heures par seconde)
  const [currentTimeHours, setCurrentTimeHours] = useState<number>(8.0); // 08h00 Heures Pleines
  const [isAutoClockRunning, setIsAutoClockRunning] = useState<boolean>(false);
  const lastHourTriggerRef = useRef<'K1' | 'K2' | null>(null);
  const lastTickTimeRef = useRef<number | null>(null);

  // Température dynamique du chauffe-eau (16°C au repos/HP, monte jusqu'à 65°C en HC/chauffe active)
  const [boilerTemp, setBoilerTemp] = useState<number>(16);
  const boilerTempRef = useRef<number>(16);

  // Demo status
  const [isDemoRunning, setIsDemoRunning] = useState<boolean>(false);
  const demoTimersRef = useRef<NodeJS.Timeout[]>([]);

  // Logs
  const [logs, setLogs] = useState<LogEntry[]>([
    {
      id: 'init-1',
      timestamp: '21:54:00',
      type: 'INFO',
      message: 'Simulateur RTCC & Contacteur 63A initialisé. Tension réseau 3×400V + N présente.',
    },
    {
      id: 'init-2',
      timestamp: '21:54:00',
      type: 'MECHANICAL',
      message: 'Bloc d’accrochage mécanique actif (mémoire mécanique bi-stable prête).',
    },
  ]);

  const addLog = useCallback((type: LogEntry['type'], message: string) => {
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
    setLogs((prev) => [
      {
        id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        timestamp: timeStr,
        type,
        message,
      },
      ...prev.slice(0, 99), // Keep last 100 entries
    ]);
  }, []);

  // Trigger Heures Creuses (via contact b de K2)
  const triggerK1 = useCallback(() => {
    if (!gridPower) {
      addLog('SIGNAL', '⚠️ Impossible d’émettre l’ordre HC : tension réseau absente (0V).');
      return;
    }

    emitSignal175Hz();
    setIsK1Pulsing(true);
    setTariff('HC');
    setCurrentTimeHours(22.0);
    setRelays((r) => ({ ...r, k1Active: false, k2Active: true }));
    addLog('SIGNAL', '📡 Signal Pulsadis 175 Hz : Le contact de K2 bascule sur b (Sortie 8 - Heures Creuses). Le courant traverse Commun ➔ b et sort par la borne 8.');

    // Fil rouge (Sortie 8 RTCC -> Borne 6 Accrocheur)
    // Au repos, 6-5 est fermé -> Borne 5 -> Fil orange -> Borne A1 bobine principale
    setContactor((prev) => {
      if (latchInstalled) {
        addLog(
          'POWER',
          'Courant traverse l’interrupteur 6-5 -> Borne A1 excitée -> Pôles 1-2, 3-4, 5-6 et Aux 13-14 fermés.'
        );
        addLog(
          'MECHANICAL',
          '🔒 Mémoire mécanique : loquet verrouillé ! L’interrupteur 5-6 s’ouvre par accrochage mécanique (bobine A coupée, 0 W).'
        );
        return {
          ...prev,
          mainCoilActive: false, // Auto-coupée immédiatement par l'ouverture mécanique de 5-6
          contactsClosed: true,
          auxContactClosed: true,
          mechanicallyLatched: true,
        };
      } else {
        addLog(
          'POWER',
          'Contacteur standard (sans loquet) : Bobine A maintenue sous tension, pôles 1-2, 3-4, 5-6 fermés.'
        );
        return {
          ...prev,
          mainCoilActive: true,
          contactsClosed: true,
          auxContactClosed: true,
          mechanicallyLatched: false,
        };
      }
    });

    // End pulse after 1.2s
    setTimeout(() => {
      setIsK1Pulsing(false);
      setRelays((r) => ({ ...r, k1Active: false, k2Active: false }));
      setTariff('HC');
      addLog('POWER', '🌙 Tarif Heures Creuses (HC) actif. Chauffe-eau alimenté à 2 kW (consommation 2 kWh/h).');
    }, 1200);
  }, [gridPower, latchInstalled, addLog]);

  // Trigger K2 (Passage en Heures Pleines)
  const triggerK2 = useCallback(() => {
    if (!gridPower) {
      addLog('SIGNAL', '⚠️ Impossible d’émettre l’ordre K2 : tension réseau absente (0V).');
      return;
    }

    emitSignal175Hz();
    setIsK2Pulsing(true);
    setTariff('HP');
    setCurrentTimeHours(8.0);
    setRelays((r) => ({ ...r, k2Active: true }));
    addLog('SIGNAL', '📡 Signal Pulsadis 175 Hz : Le contact de K2 bascule sur a (Sortie 6 - Heures Pleines). Le courant traverse Commun ➔ a et sort par la borne 6.');

    // Fil ambre (Sortie 6 RTCC -> Borne 14)
    // Traverse contact 13-14 maintenu fermé -> Borne 13 -> Bobine E1
    setContactor((prev) => {
      if (prev.contactsClosed || prev.mechanicallyLatched) {
        addLog(
          'MECHANICAL',
          '🔓 Bobine E1 excitée via contact 13-14 : Décrochage mécanique du loquet !'
        );
        addLog(
          'POWER',
          'Ressorts libérés : Pôles 1-2, 3-4, 5-6 ouverts (Chauffage OFF) & Contact 13-14 ouvert (auto-coupure de sécurité de E1).'
        );
        return {
          ...prev,
          mainCoilActive: false,
          releaseCoilActive: false,
          contactsClosed: false,
          auxContactClosed: false,
          mechanicallyLatched: false,
        };
      } else {
        addLog('INFO', 'Contacteur déjà en position ouverte (repos).');
        return prev;
      }
    });

    setTimeout(() => {
      setIsK2Pulsing(false);
      setRelays((r) => ({ ...r, k2Active: false }));
      setTariff('HP');
      addLog('POWER', '☀️ Tarif Heures Pleines (HP) actif. Chauffe-eau à l’arrêt (0 kW).');
    }, 1200);
  }, [gridPower, addLog]);

  // Toggle Grid Power (Coupure / Rétablissement)
  const toggleGrid = useCallback(() => {
    setGridPower((prevPower) => {
      const nextPower = !prevPower;
      if (!nextPower) {
        // Coupure de courant
        addLog('POWER', '⚡ COUPURE DE COURANT SECTEUR (0V).');
        setContactor((c) => {
          if (latchInstalled && c.mechanicallyLatched) {
            addLog(
              'MECHANICAL',
              '✅ ACCROCHAGE MÉCANIQUE : Les pôles restent physiquement verrouillés fermés par le loquet mécanique !'
            );
            return c; // Contacts remain mechanically closed
          } else {
            addLog(
              'POWER',
              '❌ Contacteur standard sans loquet : les ressorts ouvrent immédiatement les contacts.'
            );
            return {
              ...c,
              mainCoilActive: false,
              contactsClosed: false,
              auxContactClosed: false,
              mechanicallyLatched: false,
            };
          }
        });
      } else {
        // Retour du courant
        addLog('POWER', '🔌 Rétablissement de la tension secteur 3×400V + N.');
        setContactor((c) => {
          if (latchInstalled && c.mechanicallyLatched) {
            addLog(
              'POWER',
              '🚀 REPRISE INSTANTANÉE : Les contacts étant restés verrouillés, le chauffe-eau redémarre instantanément à 2 kW !'
            );
          } else {
            addLog(
              'POWER',
              'Le contacteur étant retombé, le chauffage reste arrêté tant qu’un nouveau signal RTCC n’est pas émis.'
            );
          }
          return c;
        });
      }
      return nextPower;
    });
  }, [latchInstalled, addLog]);

  // Toggle Latch block
  const toggleLatch = useCallback(() => {
    setLatchInstalled((prev) => {
      const next = !prev;
      addLog(
        'MECHANICAL',
        next
          ? 'Bloc d’accrochage mécanique ACTIVÉ (Mémoire mécanique bi-stable avec auto-coupure 5-6).'
          : 'Bloc d’accrochage DÉSACTIVÉ (Fonctionnement en contacteur standard classique).'
      );
      if (!next) {
        setContactor((c) => ({
          ...c,
          mechanicallyLatched: false,
        }));
      }
      return next;
    });
  }, [addLog]);

  // Signal de réseau à 22h
  const triggerSignalReseau22h = useCallback(() => {
    setCurrentTimeHours(22.0);
    if (!gridPower) {
      setGridPower(true);
      addLog('POWER', 'Tension réseau réalimentée pour le signal de 22h.');
    }
    addLog(
      'SIGNAL',
      '📡 Envoi du signal de réseau à 22h00 (Télégramme Pulsadis 175 Hz) pour activer le récepteur RTCC.'
    );
    emitSignal175Hz();
    triggerK1();
  }, [gridPower, emitSignal175Hz, triggerK1, addLog]);

  // Automated Scenario: Test de la mémoire mécanique (HC pendant 3s puis passage en HP)
  const runScenarioHC_Outage = useCallback(() => {
    // Clear any pending timers
    demoTimersRef.current.forEach(clearTimeout);
    demoTimersRef.current = [];

    setIsDemoRunning(true);
    setLatchInstalled(true);
    setGridPower(true);

    addLog(
      'INFO',
      '▶️ DÉMO TEST MÉMOIRE MÉCANIQUE : Activation du mode Heures Creuses pendant 3 secondes...'
    );
    addLog(
      'MECHANICAL',
      '🔒 Étape 1/2 : Impulsion K1 (HC). Le contacteur se ferme et le loquet mécanique verrouille la position fermée (mémoire active).'
    );

    // Étape 1: Activation du mode Heures Creuses (K1)
    setCurrentTimeHours(22.0);
    boilerTempRef.current = 65;
    setBoilerTemp(65);
    triggerK1();

    // Étape 2: Après exactement 3 secondes, activation du mode Heures Pleines (K2)
    const t1 = setTimeout(() => {
      addLog(
        'INFO',
        '--- Étape 2/2 : 3 secondes écoulées en HC -> Activation automatique du mode Heures Pleines (HP) ---'
      );
      addLog(
        'MECHANICAL',
        '🔓 Test de décrochage : Ordre K2 (HP). La bobine E1 est excitée et libère le loquet mécanique, les pôles s’ouvrent.'
      );
      setCurrentTimeHours(6.0);
      triggerK2();
    }, 3000);

    // Étape 3: Clôture de la démo après fin de l'impulsion K2
    const t2 = setTimeout(() => {
      setIsDemoRunning(false);
      addLog(
        'INFO',
        '✅ Test de la mémoire mécanique terminé : Verrouillage HC (3s) puis déverrouillage HP réussis.'
      );
    }, 4300);

    demoTimersRef.current.push(t1, t2);
  }, [triggerK1, triggerK2, addLog]);

  // Reset simulation
  const resetSimulation = useCallback(() => {
    demoTimersRef.current.forEach(clearTimeout);
    demoTimersRef.current = [];
    setIsDemoRunning(false);
    setIsAutoClockRunning(false);
    setGridPower(true);
    setTariff('HP');
    setLatchInstalled(true);
    setIsK1Pulsing(false);
    setIsK2Pulsing(false);
    setCurrentTimeHours(8.0);
    lastHourTriggerRef.current = null;
    lastTickTimeRef.current = null;
    setRelays({ k1Active: false, k2Active: false });
    boilerTempRef.current = 16;
    setBoilerTemp(16);
    setKwhHCIndex(14285.4);
    setContactor({
      mainCoilActive: false,
      releaseCoilActive: false,
      contactsClosed: false,
      auxContactClosed: false,
      mechanicallyLatched: false,
    });
    addLog('INFO', 'Simulation réinitialisée à son état initial (Horloge calée à 08h00, Tarif Heures Pleines, Chauffe-eau 16°C).');
  }, [addLog]);

  // Simulation thermique dynamique et consommation continue (kWh) du chauffe-eau :
  // 1) En mode manuel (hors horloge 24h) :
  //    - En chauffe : monte vers 65°C et l'index kWh tourne en temps réel (+0.02 kWh toutes les 150ms).
  //    - Au repos : déperdition très lente (inertie sur au moins 17 heures).
  useEffect(() => {
    // Si l'horloge automatique 24h tourne, la mise à jour est effectuée dans le ticker d'horloge
    if (isAutoClockRunning) return;

    const isHeating = gridPower && contactor.contactsClosed;

    const interval = setInterval(() => {
      if (isHeating) {
        // En chauffe : montée progressive vers 65°C
        if (boilerTempRef.current < 65) {
          boilerTempRef.current = Math.min(65, boilerTempRef.current + 0.3);
          setBoilerTemp(Math.round(boilerTempRef.current));
        }
        // Le compteur de consommation kWh tourne en temps réel pendant la consommation
        setKwhHCIndex((prev) => +(prev + 0.02).toFixed(2));
      } else {
        // Au repos / HP / hors tension : refroidissement très lent (au moins 17 heures d'inertie thermique)
        if (boilerTempRef.current > 16) {
          // Refroidissement lent : ~0.038°C toutes les 200ms (~2.88°C par heure équivalente)
          boilerTempRef.current = Math.max(16, boilerTempRef.current - 0.038);
          setBoilerTemp(Math.round(boilerTempRef.current));
        }
      }
    }, 200);

    return () => clearInterval(interval);
  }, [isAutoClockRunning, gridPower, contactor.contactsClosed]);

  // 24h clock ticker (vitesse : exactement 2 heures par seconde)
  useEffect(() => {
    if (!isAutoClockRunning) {
      lastTickTimeRef.current = null;
      return;
    }

    lastTickTimeRef.current = performance.now();

    const interval = setInterval(() => {
      const now = performance.now();
      const last = lastTickTimeRef.current ?? now;
      lastTickTimeRef.current = now;

      // Temps écoulé en secondes réelles
      const elapsedSec = (now - last) / 1000;
      // Vitesse calibrée : 2 heures par seconde
      const hoursToAdd = elapsedSec * 2.0;

      // Simulation thermique synchronisée avec le temps d'horloge simulé
      const isHeating = gridPower && contactor.contactsClosed;
      if (isHeating) {
        // Chauffe en Heures Creuses (8h total) : atteint 65°C en environ 4 heures (12.25°C par heure simulée)
        const heatingRatePerHour = 49 / 4.0;
        boilerTempRef.current = Math.min(65, boilerTempRef.current + heatingRatePerHour * hoursToAdd);
        setBoilerTemp(Math.round(boilerTempRef.current));

        // Consommation en kWh qui tourne pendant l'horloge simulée (puissance 2.0 kW : 2 kWh par heure)
        const kwhAdded = 2.0 * hoursToAdd;
        setKwhHCIndex((prev) => +(prev + kwhAdded).toFixed(2));
      } else {
        // Déperdition thermique en Heures Pleines : prend au moins 17 heures pour refroidir complètement (49°C / 17h = 2.882°C / h)
        const coolingRatePerHour = 49 / 17.0;
        boilerTempRef.current = Math.max(16, boilerTempRef.current - coolingRatePerHour * hoursToAdd);
        setBoilerTemp(Math.round(boilerTempRef.current));
      }

      setCurrentTimeHours((prev) => {
        const next = (prev + hoursToAdd) % 24;

        // Détection passage 22h00 (Heures Creuses K1)
        const crossed22 = (prev < 22 && next >= 22) || (prev > 20 && prev < 22 && next < prev);
        if (crossed22 && lastHourTriggerRef.current !== 'K1') {
          lastHourTriggerRef.current = 'K1';
          addLog('SIGNAL', '⏰ Horloge 22h00 (2h/s) : Émission automatique du télégramme K1 (Heures Creuses).');
          triggerK1();
        }

        // Détection passage 07h00 (Heures Pleines K2)
        const crossed7 = (prev < 7 && next >= 7) || (prev > 22 && next >= 7 && next < 12);
        if (crossed7 && lastHourTriggerRef.current !== 'K2') {
          lastHourTriggerRef.current = 'K2';
          addLog('SIGNAL', '⏰ Horloge 07h00 (2h/s) : Émission automatique du télégramme K2 (Heures Pleines).');
          triggerK2();
        }

        // Réinitialiser les déclencheurs à mi-journée pour le tour suivant
        if (next >= 12 && next < 16) {
          lastHourTriggerRef.current = null;
        }

        return next;
      });
    }, 50);

    return () => clearInterval(interval);
  }, [isAutoClockRunning, gridPower, contactor.contactsClosed, triggerK1, triggerK2, addLog]);

  return (
    <motion.div
      key="rtcc-simulator-container"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className="w-full space-y-4 text-left"
    >
      {/* Title Header with Badges */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-sky-50 text-sky-600 rounded-xl border border-sky-200 shadow-xs">
            <Radio className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
                Télécommande RTCC &amp; Contacteur 63A
              </h2>
              <span className="px-2 py-0.5 text-[10px] font-black uppercase bg-emerald-500 text-white rounded-md tracking-wider">
                Accrochage Mécanique
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Simulation interactive des télégrammes 175 Hz Pulsadis, mémoire bi-stable et reprise automatique après coupure de courant
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono font-bold flex items-center gap-2 text-slate-700">
            <Zap className={`w-4 h-4 ${gridPower ? 'text-amber-500' : 'text-slate-400'}`} />
            <span>{gridPower ? 'RÉSEAU 230/400V OK' : 'SECTEUR 0V'}</span>
          </div>

          <div className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono font-bold flex items-center gap-2 text-slate-700">
            <span className={`w-2 h-2 rounded-full ${tariff === 'HC' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
            <span>TARIF : {tariff === 'HC' ? 'HEURES CREUSES (HC)' : 'HEURES PLEINES (HP)'}</span>
          </div>

          <div className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono font-bold flex items-center gap-2 text-slate-700">
            <span className={`w-2 h-2 rounded-full ${boilerTemp > 25 ? 'bg-red-500 animate-pulse' : 'bg-sky-500'}`} />
            <span>BALLON : {boilerTemp}°C</span>
          </div>

          <div className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono font-bold flex items-center gap-2 text-slate-700">
            <Clock className={`w-4 h-4 ${isAutoClockRunning ? 'text-indigo-600 animate-spin' : 'text-slate-400'}`} style={{ animationDuration: '3s' }} />
            <span>
              24H : {Math.floor(currentTimeHours).toString().padStart(2, '0')}h{Math.floor((currentTimeHours % 1) * 60).toString().padStart(2, '0')} (2h/s)
            </span>
          </div>

          <div className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono font-bold flex items-center gap-2 text-slate-700">
            <ShieldCheck className={`w-4 h-4 ${contactor.mechanicallyLatched ? 'text-emerald-600' : 'text-slate-400'}`} />
            <span>{contactor.mechanicallyLatched ? 'LOQUET VERROUILLÉ' : 'LOQUET LIBRE'}</span>
          </div>

          {onOpenChampTournant && (
            <button
              onClick={onOpenChampTournant}
              id="btn-goto-simuphase"
              className="px-3 py-1.5 rounded-xl bg-cyan-50 hover:bg-cyan-100 border border-cyan-200 text-xs font-bold flex items-center gap-1.5 text-cyan-800 hover:text-cyan-950 transition-all cursor-pointer shadow-xs active:scale-95"
              title="Ouvrir la fenêtre SimuPhase Champ Tournant & Compteur"
            >
              <Compass className="w-3.5 h-3.5 text-cyan-600 animate-spin" style={{ animationDuration: '6s' }} />
              <span>SimuPhase Champ Tournant</span>
            </button>
          )}

          <button
            onClick={resetSimulation}
            id="btn-header-reset"
            className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-xs font-semibold flex items-center gap-1.5 text-slate-600 hover:text-slate-900 transition-all cursor-pointer shadow-xs"
            title="Réinitialiser la simulation (Horloge calée à 08h00)"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Réinitialiser (08h00)</span>
          </button>
        </div>
      </div>

      {/* Interactive SVG Schematic */}
      <SchematicView
        gridPower={gridPower}
        relays={relays}
        contactor={contactor}
        latchInstalled={latchInstalled}
        loadPower={gridPower && contactor.contactsClosed}
        tariff={tariff}
        boilerTemp={boilerTemp}
        kwhHCIndex={kwhHCIndex}
        kwhHPIndex={kwhHPIndex}
        isK1Pulsing={isK1Pulsing}
        isK2Pulsing={isK2Pulsing}
        signal175HzActive={signal175HzActive}
        isDemoRunning={isDemoRunning}
        isAutoClockRunning={isAutoClockRunning}
        currentTimeHours={currentTimeHours}
        onTriggerK1={triggerK1}
        onTriggerK2={triggerK2}
        onToggleGrid={toggleGrid}
        onToggleLatch={toggleLatch}
        onToggleAutoClock={() => setIsAutoClockRunning((v) => !v)}
        onRunDemo={runScenarioHC_Outage}
        onSignalReseau22h={triggerSignalReseau22h}
      />

      {/* 3. Technical Explainer & Log Journal */}
      <TechnicalExplainer logs={logs} onClearLogs={() => setLogs([])} />
    </motion.div>
  );
};
