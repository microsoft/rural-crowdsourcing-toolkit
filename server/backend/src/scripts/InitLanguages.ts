// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/**
 * Script to initialize the languages table. Inserts some initial set of
 * languages into the table. New languages can always be added via the web
 * interface.
 */

import { Language } from '../db/TableInterfaces.auto';

// Initial set of languages
export const languages: Language[] = [
  // Indian English
  {
    name: 'English',
    primary_language_name: 'English',
    locale: 'en_IN',
    iso_639_3_code: 'eng',
  },
];
