// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/**
 * Script to reset the database and initialize some basic tables
 */

import { Promise as BBPromise } from 'bluebird';

import { knex, setupDBConnection } from '../db/Client';
import { createAllTables } from '../db/CreateTableFunctions.auto';
import { dropAllTables } from '../db/DropTableFunctions.auto';

import * as BasicModel from '../models/BasicModel';

import {
  LanguageResource,
  LanguageResourceRecord,
} from '../db/TableInterfaces.auto';

import { scenarioMap } from '../scenarios/Index';
import { registerScenarios } from '../scenarios/Register';

import { languages } from './InitLanguages';
import * as Core from './scenarios/core/Resources';
import { ResourceSpec } from './scenarios/Index';

import { bootstrapAuth } from './AuthBootstrap';

import config, { loadSecretsFromVault } from '../config/Index';
import logger from '../utils/Logger';

/**
 * Function to recreate all tables in the database
 */
async function recreateAllTables() {
  // Drop all tables and then create them
  logger.info(`Recreating all tables`);
  await dropAllTables();
  await createAllTables();
  logger.info(`Tables recreated`);
}

/**
 * Function to sync all the languages
 */
async function initializeLanguages() {
  logger.info(`Initializing language records`);
  await BBPromise.mapSeries(languages, async language => {
    try {
      await BasicModel.insertRecord('language', language);
    } catch (err) {
      try {
        await BasicModel.updateSingle(
          'language',
          { name: language.name },
          language,
        );
      } catch (e) {
        logger.error(`Failed to sync language '${language.name}'`);
      }
    }
  });
  logger.info(`Completed initializing languages`);
}

/**
 * Function to initialize core language resources
 */
async function initializeCoreLRs() {
  logger.info(`Initializing core resources`);
  await insertLanguageResources(
    true, // core
    null, // scenario_id
    Core.resources,
  );
  logger.info(`Completed initializing core resources`);
}

/**
 * Function to initialize scenario language resources
 */
async function initializeScenarioLRs() {
  await BBPromise.mapSeries(Object.keys(scenarioMap), async scenario_name => {
    logger.info(`Initializing resources for scenario '${scenario_name}'`);
    let scenarioLRs;
    try {
      scenarioLRs = await import(`./scenarios/${scenario_name}/Resources`);
    } catch (e) {
      logger.error(`No resource folder for scenario ${scenario_name}`);
      return;
    }

    // get the scenario record
    const scenarioRecord = await BasicModel.getSingle('scenario', {
      name: scenario_name,
    });

    // Initialize the scenario specific language resources
    await insertLanguageResources(
      false, // core
      scenarioRecord.id, // scenario_id
      scenarioLRs.resources,
    );
    logger.info(
      `Completed initializing resources for scenario '${scenario_name}'`,
    );
  });
}

/**
 *
 * @param core Core field of the LRs
 * @param scenario_id Scenario ID of the LRs
 * @param string_resources List of string resources
 * @param file_resources Map of file resources: key is string resource name
 */
async function insertLanguageResources(
  core: boolean,
  scenario_id: number | null,
  resources: ResourceSpec[],
) {
  // Initialize the resources for the scenario
  await BBPromise.mapSeries(resources, async res => {
    const strLR: LanguageResource = {
      core,
      scenario_id,
      type: 'string_resource',
      string_resource_id: null,
      required: true,
      ...res.str,
    };

    let strLRR: LanguageResourceRecord;
    try {
      strLRR = await BasicModel.getSingle('language_resource', {
        core,
        scenario_id,
        name: strLR.name,
      });
      // update if description has changed
      if (strLRR.description !== strLR.description) {
        strLRR = await BasicModel.updateSingle(
          'language_resource',
          { id: strLRR.id },
          strLR,
        );
      }
    } catch (e) {
      // insert
      strLRR = await BasicModel.insertRecord('language_resource', strLR);
    }

    if (res.files) {
      await BBPromise.mapSeries(res.files, async fLR => {
        const fileLR: LanguageResource = {
          core,
          scenario_id,
          type: 'file_resource',
          string_resource_id: strLRR.id,
          required: true,
          list_resource: strLRR.list_resource,
          ...fLR,
        };

        try {
          const fileLRR = await BasicModel.getSingle('language_resource', {
            core,
            scenario_id,
            name: fileLR.name,
          });
          // update if file LR has changed
          if (
            fileLRR.string_resource_id !== fileLR.string_resource_id ||
            fileLRR.description !== fileLR.description ||
            fileLRR.list_resource !== fileLR.list_resource
          ) {
            await BasicModel.updateSingle(
              'language_resource',
              { id: fileLRR.id },
              fileLR,
            );
          }
        } catch (err) {
          await BasicModel.insertRecord('language_resource', fileLR);
        }
      });
    }
  });
}

/** Script sequence */
let scriptSequence = [
  'recreate-tables',
  'init-languages',
  'init-core-lrs',
  'register-scenarios',
  'init-scenario-lrs',
  'auth-bootstrap',
];

/** Main Script to reset the DB */
(async () => {
  logger.info(`Starting reset script DB`);
  logger.info(`Loaded '${config.name}' config`);

  const option = process.argv[2] || 'all';
  if (option !== 'all') {
    if (!scriptSequence.includes(option)) {
      logger.info(
        `Unknown option '${option}' to ResetDB script. Option should be one of '${scriptSequence.join(
          ' ',
        )}'`,
      );
      process.exit(1);
    }
    scriptSequence = [option];
  }

  // If config secrets are stored in key vault, fetch them
  if (config.azureKeyVault !== null) {
    logger.info('Loading secrets from key vault');
    await loadSecretsFromVault();
  }

  setupDBConnection();

  await BBPromise.mapSeries(scriptSequence, async action => {
    switch (action) {
      case 'recreate-tables':
        await recreateAllTables();
        break;
      case 'init-languages':
        await initializeLanguages();
        break;
      case 'init-core-lrs':
        await initializeCoreLRs();
        break;
      case 'register-scenarios':
        await registerScenarios();
        break;
      case 'init-scenario-lrs':
        await initializeScenarioLRs();
        break;
      case 'auth-bootstrap':
        const cc = await bootstrapAuth();
        console.log(cc);
        break;
    }
  });
})().finally(() => knex.destroy());
