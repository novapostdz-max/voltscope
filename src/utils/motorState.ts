/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

class MotorStateManager {
  fieldAngleDeg: number = 0;
  rotorAngleDeg: number = 0;
  rotaPhaseAngleDeg: number = 0;
  machineAngleDeg: number = 0;

  advanceField(delta: number) {
    this.fieldAngleDeg = (this.fieldAngleDeg + delta + 360000) % 360;
  }

  advanceRotor(delta: number) {
    this.rotorAngleDeg = (this.rotorAngleDeg + delta + 360000) % 360;
  }

  advanceRotaPhase(delta: number) {
    this.rotaPhaseAngleDeg = (this.rotaPhaseAngleDeg + delta + 360000) % 360;
  }

  advanceMachine(delta: number) {
    this.machineAngleDeg = (this.machineAngleDeg + delta + 360000) % 360;
  }

  reset() {
    this.fieldAngleDeg = 0;
    this.rotorAngleDeg = 0;
    this.rotaPhaseAngleDeg = 0;
    this.machineAngleDeg = 0;
  }
}

export const motorStateManager = new MotorStateManager();
