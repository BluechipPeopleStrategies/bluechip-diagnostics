/**
 * Build a Cal.com booking URL with diagnostic context prefilled into the notes field.
 * Returns '' when baseUrl is empty so callers can fall back gracefully.
 *
 * @param {Object} params
 * @param {string} params.baseUrl - Cal.com event URL (e.g. https://cal.com/thomas-slifka/clarity-call-free)
 * @param {string} params.diagnosticId - Diagnostic slug (e.g. 'org-pulse')
 * @param {string|null} [params.tier] - Score band tier (e.g. 'exposed', 'uneven', 'healthy')
 * @param {number|null} [params.total] - Total score 0-100
 * @returns {string} Full URL with `?notes=...` appended, or '' if baseUrl is empty
 */
export function buildClarityCallUrl({ baseUrl, diagnosticId, tier, total }) {
  if (!baseUrl) return '';
  const lines = [];
  if (diagnosticId) lines.push(`Diagnostic: ${diagnosticId}`);
  if (tier) lines.push(`Tier: ${tier}`);
  if (typeof total === 'number') lines.push(`Total: ${total}/100`);
  const notes = lines.join(' | ');
  const url = new URL(baseUrl);
  if (notes) url.searchParams.set('notes', notes);
  return url.toString();
}
