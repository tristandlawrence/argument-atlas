// Australia Post's published postcode ranges by state/territory. This part
// is exact — state boundaries follow postcode ranges by definition. Federal
// electorates don't: they're drawn from geographic/population boundaries
// that cut across postcodes, so that lookup is necessarily a curated,
// partial table rather than a range formula — see postcodeElectorates.ts.
export function stateForPostcode(postcode: string): string | null {
  const n = Number(postcode);
  if (!Number.isInteger(n) || postcode.length !== 4) return null;
  if (n >= 200 && n <= 299) return "ACT";
  if (n >= 2600 && n <= 2618) return "ACT";
  if (n >= 2900 && n <= 2920) return "ACT";
  if (n >= 1000 && n <= 2599) return "NSW";
  if (n >= 2619 && n <= 2899) return "NSW";
  if (n >= 2921 && n <= 2999) return "NSW";
  if (n >= 3000 && n <= 3999) return "VIC";
  if (n >= 8000 && n <= 8999) return "VIC";
  if (n >= 4000 && n <= 4999) return "QLD";
  if (n >= 9000 && n <= 9999) return "QLD";
  if (n >= 5000 && n <= 5999) return "SA";
  if (n >= 6000 && n <= 6999) return "WA";
  if (n >= 7000 && n <= 7999) return "TAS";
  if (n >= 800 && n <= 999) return "NT";
  return null;
}
