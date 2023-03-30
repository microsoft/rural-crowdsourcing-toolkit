// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
//
// Base task chaining interface.
//
// This file describes the basic interface for task chaining.
//
// Formally, a task chain links two tasks of pre-specified scenarios: A "from"
// scenario and a "to" scenario. In an instance of the chain, this translates to
// a "from" task (FT) and a "to" task (TT). When a (set of) microtask
// assignments of FT are completed and submitted to the server, the server
// invokes a handler. This handler returns a set of microtasks of TT that are
// added to the platform. When any such microtask moves to the 'completed'
// state, the server invokes a reverse handler. This handler can update the
// status of the microtask assignments that triggered the creation of these
// microtasks.
//
// Since this core module cannot contain any database activity, the handlers
// have to be defined as part of the backend chain interface.

import { ChainName } from '../Index';
import { ScenarioName } from '../scenarios/Index';

/**
 * Chain blocking type
 *
 * A chain can be blocking or non-blocking. A blocking chain delays verification
 * of microtask assignments of the "from task" until the completion of chained
 * microtasks of the "to task". A non-blocking chain does not impose this
 * dependency.
 *
 * 'BLOCKING': All instances of this chain are blocking
 * 'NON_BLOCKING': All instances of this chain are non-blocking
 * 'EITHER': Decision deferred to the creation of the chain instance
 */

export type ChainBlockingType = 'BLOCKING' | 'NON_BLOCKING' | 'EITHER';

/**
 * Chain delay type
 *
 * Flag to indicate if the execution of the chain should be delayed till a
 * worker completes all microtasks of the source task. Useful for group
 * verifications of assignments of a given worker.
 *
 * 'IMMEDIATE': Execute chain handler immediately. Do not wait for full
 *    completion of tasks by a worker.
 * 'DELAY': Delay the chain handler exeuction until worker completes all
 *    microtasks.
 * 'EITHER': Defer this decision to the creation of a chain instance
 */
export type ChainDelayType = 'IMMEDIATE' | 'DELAY' | 'EITHER';

/**
 * Chain group type
 *
 * Flag to indicate if the newly created microtasks of the "to task" have to be
 * grouped. Grouping can be done either by worker ID or microtask ID of the
 * completed assignments.
 *
 * 'WORKER': When the chain handler is executed for a set of completed
 *    assignments, the assignments are grouped by worker ID and a seperate
 *    microtask group is created for each worker.
 * 'MICROTASK': When the chain handler is executed for a set of completed
 *    assignments, the assignments are grouped by microtask ID and a seperate
 *    microtask group is created for each (source) microtask.
 * 'NEITHER': No grouping is performed. Assignments are ordered by their
 *    completion time.
 * 'EITHER': Defer thjs decision to the creation of a chain instance.
 */
export type ChainGroupingType = 'WORKER' | 'MICROTASK' | 'NEITHER' | 'EITHER';

/**
 * Base chain interface.
 */
export interface BaseChainInterface<FromScenario extends ScenarioName, ToScenario extends ScenarioName> {
  name: ChainName;
  full_name: string;

  // From and To scenarios
  fromScenario: FromScenario;
  toScenario: ToScenario;

  // Blocking type
  blocking: ChainBlockingType;

  // Chain delay type
  delay: ChainDelayType;

  // Chain grouping type
  grouping: ChainGroupingType;
}
