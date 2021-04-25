// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
//
// Interface specification of a language. All languages must implement this
// interface.

import { LanguageCode } from './Index';

export interface LanguageInterface {
  // ISO 639-1 code
  code: LanguageCode;

  // Name of the language in English
  name: string;

  // Name of the language in the language
  primary_name: string;

  // Does the language have basic string support?
  basic_support: boolean;

  // Does the language have assistant support?
  assistant_support: boolean;
}
