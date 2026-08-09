// Export — FALLOW-SPEC.md §9. JSON for portability; the printable summary
// is its own screen. User-initiated only; no automatic sync of any kind.

import type { Settings, TaughtRule, Week, Weights } from './types';

export interface FallowExport {
  fallow: 1;
  exportedAt: string;
  weeks: Week[];
  weights: Weights;
  settings: Settings;
  rules: TaughtRule[];
}

export function buildExport(weeks: Week[], weights: Weights, settings: Settings, rules: TaughtRule[]): FallowExport {
  return { fallow: 1, exportedAt: new Date().toISOString(), weeks, weights, settings, rules };
}

export function downloadJson(data: FallowExport): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `fallow-export-${data.exportedAt.slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

/** Parse a Fallow export file. Throws on anything else. */
export function parseExport(text: string): FallowExport {
  const data = JSON.parse(text);
  if (data?.fallow !== 1 || !Array.isArray(data.weeks)) throw new Error('not-fallow');
  return data as FallowExport;
}
