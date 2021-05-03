// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
//
// Entry point for the languages module.

// List of supported languages specified using the ISO 639-1 code.
export const languageCodes = ['en'] as const;
export type LanguageCode = typeof languageCodes[number];

// Export the language map
export { languageMap } from './Languages';
