/**
 * Format a beef number as a zero-padded string: 247 → "#00247"
 */
export function formatBeefNumber(n: number): string {
  return `#${n.toString().padStart(5, "0")}`;
}

/**
 * Calculate vote percentages from raw counts.
 * Returns [percentA, percentB] each rounded to nearest integer.
 */
export function calcVotePercents(
  votesA: number,
  votesB: number
): [number, number] {
  const total = votesA + votesB;
  if (total === 0) return [50, 50];
  const pA = Math.round((votesA / total) * 100);
  return [pA, 100 - pA];
}

/**
 * Format large numbers: 1234 → "1,234", 892000 → "892K"
 */
export function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 10_000) return `${Math.round(n / 1000)}K`;
  return n.toLocaleString("en-US");
}

/**
 * Generate a short random code for challenge URLs.
 */
export function generateChallengeCode(length = 6): string {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  const values = crypto.getRandomValues(new Uint8Array(length));
  for (let i = 0; i < values.length; i++) {
    result += chars[values[i] % chars.length];
  }
  return result;
}
