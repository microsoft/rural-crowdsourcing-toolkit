// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
//
// List of language codes

import { ParameterDefinition } from '@karya/parameter-specs';

export const languageCodes = ['EN', 'HI'] as const;
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
  code: LanguageCode;
  name: string;
  primary_name: string;
  basic_support: boolean;
  assistant_support: boolean;
}

/**
 * Language map from language code to language interface
 */
export const languageMap: { [key in LanguageCode]: LanguageInterface } = {
  EN: {
    code: 'EN',
    name: 'English',
    primary_name: 'English',
    basic_support: true,
    assistant_support: false,
  },
  HI: {
    code: 'HI',
    name: 'Hindi',
    primary_name: 'हिंदी',
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
  const values = Object.values(languageMap).map((l) => [l.code, `${l.name} (${l.primary_name})`] as [string, string]);
  return {
    id,
    label,
    description,
    required: true,
    type: 'enum',
    list: values,
  };
}
