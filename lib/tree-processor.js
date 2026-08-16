/**
 * Tree Processor
 * Assigns semantic IDs to eligible blocks in the AST
 */

import { IdGenerator } from './id-generator.js';
import { SectionResolver } from './section-resolver.js';
import { CollisionHandler } from './collision-handler.js';

// Eligible block contexts for ID generation (per spec)
const ELIGIBLE_CONTEXTS = new Set([
  'paragraph',
  'olist',
  'ulist',
  'list_item',
  'listing',
  'literal',
  'example',
  'sidebar',
  'admonition',
  'open',
  'table'
  // Note: 'quote' explicitly excluded in V1
  // Note: 'preamble' excluded (setId doesn't work)
  // Note: 'table_cell' excluded (not addressable)
]);

export function createTreeProcessor(registry) {
  registry.treeProcessor(function () {
    const self = this;

    self.process(function (doc) {
      // Check for document-level opt-out
      if (doc.getAttribute('no-semantic-ids')) {
        return doc;
      }

      const idGenerator = new IdGenerator();
      const sectionResolver = new SectionResolver();
      const collisionHandler = new CollisionHandler();

      // First pass: register all author-provided IDs
      const allBlocks = doc.findBy();
      allBlocks.forEach(block => {
        const explicitId = block.getId && block.getId();
        if (explicitId) {
          collisionHandler.registerExplicitId(explicitId);
        }
      });

      // Second pass: assign generated IDs
      processBlocks(doc.getBlocks(), doc, idGenerator, sectionResolver, collisionHandler);

      return doc;
    });
  });
}

function processBlocks(blocks, doc, idGenerator, sectionResolver, collisionHandler) {
  if (!blocks) return;

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];

    // Skip if no getId/setId methods
    if (!block.getId || !block.setId) {
      // Recurse into nested blocks if available
      if (block.hasBlocks && block.hasBlocks()) {
        processBlocks(block.getBlocks(), doc, idGenerator, sectionResolver, collisionHandler);
      }
      continue;
    }

    // Skip if block already has author-provided ID
    if (block.getId()) {
      // But still recurse into nested blocks
      if (block.hasBlocks && block.hasBlocks()) {
        processBlocks(block.getBlocks(), doc, idGenerator, sectionResolver, collisionHandler);
      }
      continue;
    }

    // Check for per-block opt-out
    const semanticIdAttr = block.getAttribute && block.getAttribute('semantic-id');
    if (semanticIdAttr === 'false' || semanticIdAttr === false) {
      // Skip but still recurse
      if (block.hasBlocks && block.hasBlocks()) {
        processBlocks(block.getBlocks(), doc, idGenerator, sectionResolver, collisionHandler);
      }
      continue;
    }

    // Check if block type is eligible
    const context = block.getContext && block.getContext();
    if (!context || !ELIGIBLE_CONTEXTS.has(context)) {
      // Not eligible, but still recurse
      if (block.hasBlocks && block.hasBlocks()) {
        processBlocks(block.getBlocks(), doc, idGenerator, sectionResolver, collisionHandler);
      }
      continue;
    }

    // Generate semantic ID
    const sectionBase = sectionResolver.resolve(block, doc);
    const candidateId = idGenerator.generate(sectionBase, 'block');
    const uniqueId = collisionHandler.makeUnique(candidateId);

    // Assign ID
    block.setId(uniqueId);

    // Recurse into nested blocks
    if (block.hasBlocks && block.hasBlocks()) {
      processBlocks(block.getBlocks(), doc, idGenerator, sectionResolver, collisionHandler);
    }
  }
}
