const fs = require('fs');

const codes = Intl.supportedValuesOf('currency');
const names = new Intl.DisplayNames(['en'], { type: 'currency' });
// Metals, test and special codes are ISO-4217 registered but nobody prices in them.
const EXCLUDE = new Set([
  'XAU', 'XAG', 'XPT', 'XPD', 'XTS', 'XXX', 'XDR', 'XBA', 'XBB', 'XBC', 'XBD', 'XSU', 'XUA',
]);

const rows = [];
for (const code of codes) {
  if (EXCLUDE.has(code)) continue;
  const name = names.of(code);
  if (!name || name === code) continue; // unknown to ICU
  if (/[()]/.test(name)) continue; // '(1998-2008)' style historicals
  let symbol = code;
  try {
    const parts = new Intl.NumberFormat('en', {
      style: 'currency',
      currency: code,
      currencyDisplay: 'narrowSymbol',
    }).formatToParts(0);
    const found = parts.find(p => p.type === 'currency');
    if (found) symbol = found.value;
  } catch {
    /* keep the code as the symbol */
  }
  rows.push({ code, name, symbol });
}
rows.sort((a, b) => a.name.localeCompare(b.name, 'en'));

const q = s => "'" + s.replace(/\\/g, '\\\\').replace(/'/g, "\\'") + "'";
const body = rows
  .map(r => `  { code: ${q(r.code)}, name: ${q(r.name)}, symbol: ${q(r.symbol)} },`)
  .join('\n');

const out = `/**
 * Every currency the picker can browse — ${rows.length} ISO-4217 codes, sorted by name.
 *
 * Generated from Node's ICU data (Intl.supportedValuesOf('currency') +
 * Intl.DisplayNames) and committed rather than derived at runtime: this list
 * renders during SSR, and ICU versions differ between Node and the browser, so
 * computing it live would risk a hydration mismatch on the names. Metals (XAU,
 * XAG, …), test/special codes (XXX, XTS, XDR) and ICU's historical entries are
 * excluded — registered, but nobody prices work in them.
 *
 * This list is a browsing aid, never a constraint: the API and the DB both
 * validate the saved value on shape (^[A-Z]{3}$) alone, so a code missing here
 * is a gap in what can be browsed, not in what can be stored. Regenerate with
 * scripts/gen-currencies.js if ISO-4217 changes.
 */
export interface Currency {
  code: string;
  /** Display name, e.g. 'Ugandan Shilling'. */
  name: string;
  /** Narrow symbol, e.g. 'USh'; falls back to the code where ICU has none. */
  symbol: string;
}

export const ALL_CURRENCIES: readonly Currency[] = [
${body}
];
`;

fs.writeFileSync(process.argv[2], out);
console.log('wrote', rows.length, 'currencies to', process.argv[2]);
