// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/**
 * Handle tasks related to materialized views
 */

import { knex } from '@karya/common';

/**
 * Function to refresh all materialized views
 * in the db
 */
export async function refreshAllMatViews() {
  await knex.raw(`
  DO $$
  DECLARE
  r RECORD;
  BEGIN
    FOR r IN SELECT matviewname FROM pg_matviews WHERE matviewowner = 'karya'
    LOOP
      EXECUTE 'REFRESH MATERIALIZED VIEW CONCURRENTLY '|| r.matviewname;
    END LOOP;
  END;
  $$ LANGUAGE plpgsql;
 `);
}
