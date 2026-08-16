/**
 * Collision Handler
 * Maintains global registry of assigned IDs and resolves collisions
 */

export class CollisionHandler {
  constructor() {
    this.assignedIds = new Set();
  }

  /**
   * Register an author-provided ID (takes precedence)
   * @param {string} id - Explicit ID from source
   */
  registerExplicitId(id) {
    if (id) {
      this.assignedIds.add(id);
    }
  }

  /**
   * Generate a unique ID, handling collisions with suffix
   * @param {string} candidateId - Proposed ID
   * @returns {string} Unique ID (may have --2, --3 suffix)
   */
  makeUnique(candidateId) {
    if (!this.assignedIds.has(candidateId)) {
      this.assignedIds.add(candidateId);
      return candidateId;
    }

    // Collision detected - append suffix
    let suffix = 2;
    let uniqueId;

    do {
      uniqueId = `${candidateId}--${suffix}`;
      suffix++;
    } while (this.assignedIds.has(uniqueId));

    this.assignedIds.add(uniqueId);
    return uniqueId;
  }

  /**
   * Check if an ID is already assigned
   * @param {string} id - ID to check
   * @returns {boolean} True if already assigned
   */
  isAssigned(id) {
    return this.assignedIds.has(id);
  }

  /**
   * Reset registry (for new document)
   */
  reset() {
    this.assignedIds.clear();
  }
}
