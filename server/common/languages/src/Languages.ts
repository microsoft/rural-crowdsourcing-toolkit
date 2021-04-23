// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
//
// Define the list of languages.

import { LanguageInterface } from './LanguageInterface';
import { LanguageCode } from './Index';

export const languageMap: { [key in LanguageCode]: LanguageInterface } = {
  en: {
    code: 'en',
    name: 'English',
    primary_name: 'English',
    basic_support: true,
    assistant_support: true,
  },
};
