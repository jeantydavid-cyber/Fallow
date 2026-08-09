// Refit — FALLOW-SPEC.md §5. After ≥8 weeks that have markers: ridge
// regression of weighted balance against a marker composite, regularised
// toward the calibrated prior. Each weight bounded to ±40% of its calibrated
// value; per-refit movement capped so nothing lurches; pinned weights never
// touched. If the refit doesn't beat the prior on held-out weeks, keep the
// prior.

import type { LoadCategory, RecoveryCategory, Week, Weights } from './types';
import { LOAD_CATEGORIES, RECOVERY_CATEGORIES } from './types';

const RIDGE_LAMBDA = 4;
const BOUND = 0.4; // ±40% of calibrated value
const STEP_CAP = 0.15; // max movement per refit run, in weight units

const N_FEATURES = LOAD_CATEGORIES.length + RECOVERY_CATEGORIES.length;

/** Marker composite: skillLoss weighted heaviest — it is the most sensitive
    early indicator in the system (spec §3). */
export function markerComposite(w: Week): number | null {
  if (!w.markers) return null;
  const { emptiness, skillLoss, stimulusTolerance } = w.markers;
  return 1.0 * emptiness + 1.6 * skillLoss + 1.0 * stimulusTolerance;
}

function featureRow(w: Week): number[] {
  const row = new Array(N_FEATURES).fill(0);
  for (const e of w.entries) {
    if (e.kind === 'load') {
      const i = LOAD_CATEGORIES.indexOf(e.category as LoadCategory);
      if (i >= 0) row[i] -= e.hours; // load pulls the balance down
    } else {
      const i = RECOVERY_CATEGORIES.indexOf(e.category as RecoveryCategory);
      if (i >= 0) row[LOAD_CATEGORIES.length + i] += e.hours;
    }
  }
  return row;
}

function weightsVector(w: Weights): number[] {
  return [
    ...LOAD_CATEGORIES.map((c) => w.load[c]),
    ...RECOVERY_CATEGORIES.map((c) => w.recovery[c]),
  ];
}

/** Solve Ax = b by Gaussian elimination with partial pivoting. */
function solve(A: number[][], b: number[]): number[] | null {
  const n = b.length;
  const M = A.map((row, i) => [...row, b[i]]);
  for (let col = 0; col < n; col++) {
    let pivot = col;
    for (let r = col + 1; r < n; r++) {
      if (Math.abs(M[r][col]) > Math.abs(M[pivot][col])) pivot = r;
    }
    if (Math.abs(M[pivot][col]) < 1e-12) return null;
    [M[col], M[pivot]] = [M[pivot], M[col]];
    for (let r = 0; r < n; r++) {
      if (r === col) continue;
      const f = M[r][col] / M[col][col];
      for (let c = col; c <= n; c++) M[r][c] -= f * M[col][c];
    }
  }
  return M.map((row, i) => row[n] / M[i][i]);
}

function mse(rows: number[][], y: number[], w: number[]): number {
  let s = 0;
  for (let i = 0; i < rows.length; i++) {
    const pred = rows[i].reduce((acc, x, j) => acc + x * w[j], 0);
    s += (pred - y[i]) ** 2;
  }
  return s / rows.length;
}

/** Attempt a refit. Returns updated weights, or the prior unchanged if the
    refit is not justified. */
export function refit(weeks: Week[], prior: Weights, now: number): Weights {
  const usable = weeks
    .filter((w) => w.markers !== null && w.recoveryKnown)
    .sort((a, b) => (a.id < b.id ? -1 : 1));
  if (usable.length < 8) return prior;

  const X = usable.map(featureRow);
  // Bad markers should track a negative balance: y = −composite, scaled to
  // roughly balance units.
  const composites = usable.map((w) => markerComposite(w) as number);
  const y = composites.map((c) => -3 * c);

  // Hold out the most recent quarter for validation.
  const holdN = Math.max(2, Math.floor(usable.length / 4));
  const trainX = X.slice(0, X.length - holdN);
  const trainY = y.slice(0, y.length - holdN);
  const testX = X.slice(X.length - holdN);
  const testY = y.slice(y.length - holdN);

  const w0 = weightsVector(prior);

  // Ridge toward prior: (XᵀX + λI) w = Xᵀy + λ w0
  const A: number[][] = Array.from({ length: N_FEATURES }, (_, i) =>
    Array.from({ length: N_FEATURES }, (_, j) => {
      let s = i === j ? RIDGE_LAMBDA : 0;
      for (const row of trainX) s += row[i] * row[j];
      return s;
    }),
  );
  const b = Array.from({ length: N_FEATURES }, (_, i) => {
    let s = RIDGE_LAMBDA * w0[i];
    for (let r = 0; r < trainX.length; r++) s += trainX[r][i] * trainY[r];
    return s;
  });

  const fitted = solve(A, b);
  if (!fitted) return prior;

  // Bound to ±40% of calibrated, cap movement, keep on a sane scale.
  const bounded = fitted.map((v, i) => {
    const lo = w0[i] * (1 - BOUND);
    const hi = w0[i] * (1 + BOUND);
    const clamped = Math.min(hi, Math.max(lo, v));
    const stepped = Math.min(w0[i] + STEP_CAP, Math.max(w0[i] - STEP_CAP, clamped));
    return Math.round(stepped * 100) / 100;
  });

  // Keep the prior unless the refit wins on held-out weeks.
  if (mse(testX, testY, bounded) >= mse(testX, testY, w0)) return prior;

  const load = { ...prior.load };
  const recovery = { ...prior.recovery };
  LOAD_CATEGORIES.forEach((c, i) => {
    if (!prior.pinned[c]) load[c] = bounded[i];
  });
  RECOVERY_CATEGORIES.forEach((c, i) => {
    if (!prior.pinned[c]) recovery[c] = bounded[LOAD_CATEGORIES.length + i];
  });

  return { ...prior, load, recovery, refittedAt: now };
}
