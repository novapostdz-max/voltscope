/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { SimuPhaseTetraFullApp } from './SimuPhaseTetraFullApp';

interface SimuPhaseIframeViewProps {
  onOpenRTCC?: () => void;
  onOpenChampTournant?: () => void;
}

export const SimuPhaseIframeView: React.FC<SimuPhaseIframeViewProps> = ({
  onOpenRTCC,
  onOpenChampTournant,
}) => {
  return (
    <div className="w-full">
      <SimuPhaseTetraFullApp
        onOpenRTCC={onOpenRTCC}
        onBackHome={onOpenChampTournant}
      />
    </div>
  );
};
