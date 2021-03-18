// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/**
 * This file describes the scenario interface for the frontend. It specifies all
 * the functions that have to be implemented for complete specification of a
 * scenario.
 */

import { Scenario } from '../../../db/TableInterfaces.auto';

export interface IScenario extends Scenario {
  name: string;

  /**
   * Scenario verification component
   */
  Verifier: React.Component;
}
