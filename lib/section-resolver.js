/**
 * Section Base Resolver
 * Resolves the section base for a block by walking up the AST tree
 */

export class SectionResolver {
  /**
   * Get section base for a block
   * @param {Object} block - Asciidoctor block node
   * @param {Object} doc - Asciidoctor document
   * @returns {string} Section base identifier
   */
  resolve(block, doc) {
    // Try to find parent section by walking up
    let current = block;

    while (current) {
      // Check if this node is a section
      if (current.getContext && current.getContext() === 'section') {
        // Check for explicit ID first
        const explicitId = current.getId();
        if (explicitId) {
          return explicitId;
        }

        // Fallback to title-based slug
        const title = current.getTitle && current.getTitle();
        if (title) {
          return this.slugify(title);
        }
      }

      // Move up to parent
      current = current.getParent && current.getParent();
    }

    // No section found, try document title
    if (doc) {
      const docTitle = doc.getDocumentTitle && doc.getDocumentTitle();
      if (docTitle) {
        return this.slugify(String(docTitle));
      }
    }

    // Final fallback
    return '_preamble';
  }

  /**
   * Convert title to slug (matches Asciidoctor's default behavior)
   * @param {string} title - Section title
   * @returns {string} Slugified title
   */
  slugify(title) {
    return title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')  // Remove special chars
      .replace(/\s+/g, '-')       // Spaces to hyphens
      .replace(/-+/g, '-')        // Collapse hyphens
      .replace(/^-|-$/g, '');     // Trim hyphens
  }
}
