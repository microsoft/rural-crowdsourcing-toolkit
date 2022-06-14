// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
//
// Common scenario functions for all scenarios

import Papa from 'papaparse';

/**
 * Convert a CSV file to JSON. The first row of the CSV is used as keys for the
 * JSON objects and for each subsequent row an object is created.
 * @param csvData CSV data string
 */
export function csvToJson<T = any>(csvData: string): T[] {
  const json = Papa.parse<T>(csvData, { header: true, trimHeaders: true, dynamicTyping: true, skipEmptyLines: true });
  return json.data;
}
