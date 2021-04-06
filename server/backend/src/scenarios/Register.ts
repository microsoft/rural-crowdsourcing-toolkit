// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/**
 * Register list of scenarios with the DB
 */

import * as fs from 'fs';

import {
  LanguageResource,
  Policy,
  Scenario,
  ScenarioRecord,
  BasicModel,
} from '@karya/db';
import { IScenario, scenarioById, scenarioMap } from './Index';

import { updateLanguageResource } from '../models/LanguageResourceModel';

import bbPromise from 'bluebird';
import logger from '../utils/Logger';
import { IPolicy } from './common/PolicyInterface';

/**
 * Function to register the list of scenarios with the DB.
 *
 * For each scenario in the scenario list, attempt to insert an entry into the
 * DB table. This may fail for already inserted scenarios, which is fine.
 *
 * In the other direction, for each scenario in the table, check if there is a
 * entry in the scenario map (i.e., the scenario is backed by validation code,
 * etc.). Flag an error for all the scenarios that do not associated entry in
 * the scenario map.
 *
 * Insert the default language resources for each scenario: scenario_name, and
 * scenario_description.
 */

export async function registerScenarios() {
  /** Part 1:  For all records in the table, check if there is a matching entry
   * in the scenario map
   */

  const dbRecordMap: { [id: string]: ScenarioRecord } = {};
  const dbRecords = await BasicModel.getRecords('scenario', {});

  for (const record of dbRecords) {
    // if the record is not in the map, mark it as disabled and flag an error
    if (!(record.name in scenarioMap)) {
      await BasicModel.updateRecords(
        'scenario',
        { name: record.name },
        { enabled: false },
      );
      logger.error(
        `Scenario DB record '${record.name}' does not have matching implementation`,
      );
      continue;
    } else {
      scenarioMap[record.name].id = record.id;
    }

    // insert the record into the record map
    dbRecordMap[record.name] = record;
  }

  /**
   * Part 2: Add new records for scenarios or sync modified scenarios
   *
   * In case of new scenarios, insert the language resource records for the name
   * and description.
   *
   * In case of modified scenarios, update the language resource records if
   * necessary.
   */
  for (const scenario of Object.values(scenarioMap)) {
    if (scenario.name in dbRecordMap) {
      // Scenario is already in the database. Check if it needs to be updated
      const dbRecord = dbRecordMap[scenario.name];
      scenarioById[Number.parseInt(dbRecord.id, 10)] = scenario;

      // Extract the last updated time for the scenario description file
      const scenarioDescriptionFile = `${process.cwd()}/src/scenarios/${
        scenario.name
      }/Index.ts`;
      if (!fs.existsSync(scenarioDescriptionFile)) {
        logger.error(
          `Scenario description file '${scenarioDescriptionFile}' not present. Ensure appropriate file naming`,
        );
        continue;
      }
      const SDFLastUpdated = fs.statSync(scenarioDescriptionFile).mtime;
      const recordLastUpdated = new Date(dbRecord.last_updated_at);

      if (SDFLastUpdated > recordLastUpdated) {
        try {
          const updatedScenarioObject: Scenario = {
            name: scenario.name,
            full_name: scenario.full_name,
            description: scenario.description,
            task_params: scenario.task_params,
            assignment_granularity: scenario.assignment_granularity,
            group_assignment_order: scenario.group_assignment_order,
            microtask_assignment_order: scenario.microtask_assignment_order,
            skills: scenario.skills,
            params: scenario.params,
            enabled: scenario.enabled,
            synchronous_validation: scenario.synchronous_validation,
          };

          // sync scenario  with DB
          await BasicModel.updateSingle(
            'scenario',
            { name: scenario.name },
            updatedScenarioObject,
          );
          logger.info(`Synced scenario '${scenario.name}' with DB`);

          // check if language resource needs to be synced
          if (scenario.full_name !== dbRecord.full_name) {
            // update the language resource for scenario name
            await updateLanguageResource(
              { scenario_id: dbRecord.id, name: 'scenario_name' },
              { description: scenario.full_name },
            );
          }

          if (scenario.description !== dbRecord.description) {
            // update the language resource for scenario description
            await updateLanguageResource(
              { scenario_id: dbRecord.id, name: 'scenario_description' },
              { description: scenario.description },
            );
          }
          // update policies
          const success = await updateScenarioPolicies(scenario, dbRecord.id);
          if (!success) {
            throw new Error(
              `Failed to update policies associated with '${scenario.name}'`,
            );
          }
        } catch (err) {
          logger.error(`Failed to sync scenario '${scenario.name}'`);
          logger.error(`${err.message}`);
          continue;
        }
      } else {
        logger.info(`Scenario '${scenario.name}' already up-to-date`);
      }
    } else {
      // Scenario is not in the database. Needs to be inserted.
      const newScenarioObject: Scenario = {
        name: scenario.name,
        full_name: scenario.full_name,
        description: scenario.description,
        task_params: scenario.task_params,
        assignment_granularity: scenario.assignment_granularity,
        group_assignment_order: scenario.group_assignment_order,
        microtask_assignment_order: scenario.microtask_assignment_order,
        skills: scenario.skills,
        params: scenario.params,
        enabled: scenario.enabled,
        synchronous_validation: scenario.synchronous_validation,
      };

      // insert the record into the DB
      try {
        const dbRecord = await BasicModel.insertRecord(
          'scenario',
          newScenarioObject,
        );
        scenarioById[Number.parseInt(dbRecord.id, 10)] = scenario;
        logger.info(`Inserted scenario '${scenario.name}' into the DB`);

        // Insert the language resource records
        // scenario name
        const lrNameRecord: LanguageResource = {
          scenario_id: dbRecord.id,
          type: 'string_resource',
          name: 'scenario_name',
          description: scenario.full_name,
          required: true,
        };
        await BasicModel.insertRecord('language_resource', lrNameRecord);

        // scenario description
        const lrDescRecord: LanguageResource = {
          scenario_id: dbRecord.id,
          type: 'string_resource',
          name: 'scenario_description',
          description: scenario.description,
          required: true,
        };
        await BasicModel.insertRecord('language_resource', lrDescRecord);

        const success = await createScenarioPolicies(scenario, dbRecord.id);
        if (!success) {
          throw new Error(
            `Failed to insert policies associated with '${scenario.name}'`,
          );
        } else {
          logger.info(`Inserted policy records for '${scenario.name}'`);
        }
      } catch (err) {
        logger.error(`Failed to insert scenario '${scenario.name}'into DB`);
        logger.error(`${err.message}`);
        continue;
      }
    }
  }
}

async function createScenarioPolicies(scenario: IScenario, scenarioId: string) {
  const policies: IPolicy[] = scenario.policies;
  let success = true;
  await bbPromise
    .map(policies, async (policy) => {
      const policyObject: Policy = {
        name: policy.name,
        description: policy.description,
        scenario_id: scenarioId,
        params: policy.params,
      };
      await BasicModel.insertRecord('policy', policyObject);
    })
    .catch((err) => {
      success = false;
    });
  return success;
}

async function updateScenarioPolicies(
  scenario: IScenario,
  scenario_id: string,
) {
  const policies: IPolicy[] = scenario.policies;
  let success = true;
  await bbPromise
    .map(policies, async (policy) => {
      const updatedPolicyObject: Policy = {
        name: policy.name,
        description: policy.description,
        scenario_id,
        params: policy.params,
      };
      await BasicModel.updateRecords(
        'policy',
        { name: policy.name, scenario_id },
        updatedPolicyObject,
      );
    })
    .catch((err) => {
      success = false;
    });
  return success;
}
