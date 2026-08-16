/**
 * Semantic ID Generator
 * Generates IDs with pattern: <section-base>--<kind>-<n>
 *
 * Examples:
 *   - install--block-1
 *   - setup--include-1
 *   - my-section--block-2
 */

export class IdGenerator {
  constructor() {
    this.counters = new Map(); // section-base -> {block: n, include: n}
  }

  /**
   * Generate a semantic ID
   * @param {string} sectionBase - Section identifier from nearest heading
   * @param {string} kind - Either 'block' or 'include'
   * @returns {string} Generated ID (e.g., 'install--block-1')
   */
  generate(sectionBase, kind) {
    if (!sectionBase) {
      sectionBase = '_preamble';
    }

    // Normalize section base to valid ID format
    const normalizedBase = this.normalizeId(sectionBase);

    // Initialize counter for this section if needed
    if (!this.counters.has(normalizedBase)) {
      this.counters.set(normalizedBase, { block: 0, include: 0 });
    }

    const sectionCounters = this.counters.get(normalizedBase);

    // Increment counter for this kind
    sectionCounters[kind] = (sectionCounters[kind] || 0) + 1;

    // Generate ID: section--kind-n
    return `${normalizedBase}--${kind}-${sectionCounters[kind]}`;
  }

  /**
   * Normalize a string to be a valid HTML ID
   * @param {string} str - Input string
   * @returns {string} Normalized ID
   */
  normalizeId(str) {
    return str
      .toLowerCase()
      .replace(/[^\w\s-]/g, '') // Remove non-word chars except spaces and hyphens
      .replace(/\s+/g, '-')      // Replace spaces with hyphens
      .replace(/-+/g, '-')       // Collapse multiple hyphens
      .replace(/^-|-$/g, '');    // Remove leading/trailing hyphens
  }

  /**
   * Reset all counters (for new document)
   */
  reset() {
    this.counters.clear();
  }
}
