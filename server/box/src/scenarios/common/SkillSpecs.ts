// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/**
 * Specification of language skill requirements for a scenario
 */

// Skills in a given language
type LanguageSkills = {
  read: number;
  speak: number;
  type: number;
};

// Skill specification for a scenario. Each scenario needs skills in at least
// one and at most two languages;
export type SkillSpecs = {
  l1: LanguageSkills;
  l2?: LanguageSkills;
};
