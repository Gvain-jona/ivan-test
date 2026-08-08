/**
 * Rollups that are either exact or honestly absent.
 *
 * v2 has no aggregate read layer yet, so a total has to be summed from rows.
 * Home already does that with a bounded fetch and a figure that is quietly
 * approximate — STATE.md records the regret. This is the alternative: fetch up
 * to a cap, compare what came back against the *exact* count PostgREST
 * returns, and say which of the two you got.
 *
 * A caller can then render a real number or say nothing, instead of rendering
 * a number that is wrong in a way nobody can see. When the metrics layer
 * arrives this whole module goes away.
 */

/** Above this, summing rows client-side stops being reasonable. */
export const ROLLUP_ROW_CAP = 500;

export interface Rollup<T> {
  /** Exact — PostgREST counts rows, it doesn't sample them. */
  count: number;
  /** Sums over the rows fetched. Trustworthy only when `exact`. */
  totals: T;
  /**
   * False when the record has more rows than the cap, so the sums cover only
   * part of them. The count stays exact either way.
   */
  exact: boolean;
}

export function buildRollup<Row, T>(
  rows: Row[],
  count: number | null,
  sum: (rows: Row[]) => T,
): Rollup<T> {
  const total = count ?? rows.length;
  return {
    count: total,
    totals: sum(rows),
    exact: rows.length >= total,
  };
}

/** Numeric coercion that treats null/NaN as zero, as every money sum wants. */
export function money(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}
