// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
//
// List of language codes

import { ParameterDefinition } from '@karya/parameter-specs';

export const languageCodes = [
  'AS',
  'BN',
  'BRX',
  'DOI',
  'EN',
  'GU',
  'HI',
  'KOK',
  'KN',
  'KS',
  'MAI',
  'ML',
  'MNI',
  'MR',
  'NE',
  'PA',
  'OR',
  'SA',
  'SAT',
  'SD',
  'TE',
  'TA',
  'UR',
  'ISL',
  'NRI',
  'BRX',
] as const;
export type LanguageCode = typeof languageCodes[number];

/**
 * Language interface to be implemented for all languages
 * code: ISO 639-1 code
 * name: Name of the language in English
 * primary_name: Name of the language in its native script
 * basic_support: Does the language have basic string support
 * assistant_support: Does the language have basic voice assistant support
 */
export interface LanguageInterface {
  name: string;
  primary_name: string;
  basic_support: boolean;
  assistant_support: boolean;
}

/**
 * Language map from language code to language interface
 */
export const languageMap: { [key in LanguageCode]: LanguageInterface } = {
  AS: {
    name: 'Assamese',
    primary_name: 'অসমীয়া',
    basic_support: false,
    assistant_support: false,
  },

  BN: {
    name: 'Bengali',
    primary_name: 'বাংলা',
    basic_support: false,
    assistant_support: false,
  },

  BRX: {
    name: 'Bodo',
    primary_name: 'बड़',
    basic_support: false,
    assistant_support: false,
  },

  DOI: {
    name: 'Dogri',
    primary_name: 'डोगरी',
    basic_support: false,
    assistant_support: false,
  },

  EN: {
    name: 'English',
    primary_name: 'English',
    basic_support: true,
    assistant_support: false,
  },

  GU: {
    name: 'Gujarati',
    primary_name: 'ગુજરાતી',
    basic_support: false,
    assistant_support: false,
  },

  HI: {
    name: 'Hindi',
    primary_name: 'हिंदी',
    basic_support: false,
    assistant_support: false,
  },

  KOK: {
    name: 'Konkani',
    primary_name: 'कोंकणी',
    basic_support: false,
    assistant_support: false,
  },

  KN: {
    name: 'Kannada',
    primary_name: 'ಕನ್ನಡ',
    basic_support: false,
    assistant_support: false,
  },

  KS: {
    name: 'Kashmiri',
    primary_name: 'कॉशुर',
    basic_support: false,
    assistant_support: false,
  },

  MAI: {
    name: 'Maithili',
    primary_name: 'मैथिली',
    basic_support: false,
    assistant_support: false,
  },

  ML: {
    name: 'Malayalam',
    primary_name: 'മലയാളം',
    basic_support: false,
    assistant_support: false,
  },

  MNI: {
    name: 'Manipuri',
    primary_name: 'ꯃꯤꯇꯩꯂꯣꯟ',
    basic_support: false,
    assistant_support: false,
  },

  MR: {
    name: 'Marathi',
    primary_name: 'मराठी',
    basic_support: false,
    assistant_support: false,
  },

  NE: {
    name: 'Nepali',
    primary_name: 'नेपाली',
    basic_support: false,
    assistant_support: false,
  },

  PA: {
    name: 'Punjabi',
    primary_name: 'ਪੰਜਾਬੀ',
    basic_support: false,
    assistant_support: false,
  },

  OR: {
    name: 'Odia',
    primary_name: 'ଓଡ଼ିଆ',
    basic_support: false,
    assistant_support: false,
  },

  SA: {
    name: 'Sanskrit',
    primary_name: 'संस्कृत',
    basic_support: false,
    assistant_support: false,
  },

  SAT: {
    name: 'Santali',
    primary_name: 'संताली',
    basic_support: false,
    assistant_support: false,
  },

  SD: {
    name: 'Sindhi',
    primary_name: 'सिन्धी',
    basic_support: false,
    assistant_support: false,
  },

  TE: {
    name: 'Telugu',
    primary_name: 'తెలుగు',
    basic_support: false,
    assistant_support: false,
  },

  TA: {
    name: 'Tamil',
    primary_name: 'தமிழ்',
    basic_support: false,
    assistant_support: false,
  },

  UR: {
    name: 'Urdu',
    primary_name: 'اُردُو',
    basic_support: false,
    assistant_support: false,
  },

  ISL: {
    name: 'Sign Language',
    primary_name: 'Sign Language',
    basic_support: false,
    assistant_support: false,
  },

  NRI: {
    name: 'Chokri',
    primary_name: 'Chokri',
    basic_support: false,
    assistant_support: false,
  },
};

/**
 * Create a language parameter
 * @param id ID of the language parameter
 * @param label Label to be displayed in a form
 * @param description Description for a form
 */
export function languageParameter<ID>(
  id: Extract<ID, string>,
  label: string,
  description: string
): ParameterDefinition<ID> {
  const values = Object.entries(languageMap).map(
    ([code, l]) => [code, `${l.name} (${l.primary_name})`] as [string, string]
  );
  return {
    id,
    label,
    description,
    required: true,
    type: 'enum',
    list: values,
  };
}
