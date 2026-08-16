/**
 * Preprocessor
 * Handles:
 * 1. Include boundary insertion (visible HTML by default)
 * 2. Attribute buttonizing (line-by-line with delimited block awareness)
 */

export function createPreprocessor(registry, options = {}) {
  registry.preprocessor(function () {
    const self = this;

    self.process(function (doc, reader) {
      // Check opt-out flags
      const noIncludeBoundaries = doc.getAttribute('no-include-boundaries');
      const noAttributeButtons = doc.getAttribute('no-attribute-buttons');

      const lines = reader.getLines();
      const processedLines = [];

      // State tracking
      let inDelimitedBlock = false;
      let delimiterPattern = null;
      let includeCounter = 0;

      // Load attribute options if provided
      const attributeOptions = options.attributeOptions || {};

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // Track delimited block state (for attribute buttonizing)
        if (isDelimiterLine(line)) {
          if (!inDelimitedBlock) {
            // Entering delimited block
            inDelimitedBlock = true;
            delimiterPattern = getDelimiterPattern(line);
          } else if (delimiterPattern && line.match(delimiterPattern)) {
            // Exiting delimited block
            inDelimitedBlock = false;
            delimiterPattern = null;
          }
        }

        // Handle include directives (boundary insertion)
        if (!noIncludeBoundaries && line.trim().startsWith('include::')) {
          includeCounter++;

          // Check for per-include opt-out
          const hasOptOut = line.includes('[include-boundary=false]');

          if (!hasOptOut) {
            // Insert visible boundary marker before include
            // Format: ++++\n<div id="section--include-N" class="include-boundary"><hr><span>Start include: path</span></div>\n++++
            const includePath = extractIncludePath(line);
            const boundaryId = `_placeholder--include-${includeCounter}`; // Simplified for now
            const boundaryHtml = `++++\n<div id="${boundaryId}" class="include-boundary">\n  <hr>\n  <span>Start include: ${includePath}</span>\n</div>\n++++`;

            processedLines.push(boundaryHtml);
          }

          processedLines.push(line);
          continue;
        }

        // Handle attribute buttonizing
        if (!noAttributeButtons && !inDelimitedBlock && !isAttributeDeclaration(line) && !line.trim().startsWith('include::')) {
          const buttonizedLine = buttonizeAttributes(line, attributeOptions);
          processedLines.push(buttonizedLine);
        } else {
          processedLines.push(line);
        }
      }

      // Replace reader lines
      reader.restoreLines(processedLines);
      return reader;
    });
  });
}

/**
 * Check if line is a delimiter for code/literal blocks
 */
function isDelimiterLine(line) {
  const trimmed = line.trim();
  return /^(----+|====+|\.\.\.\.|\/\/\/\/+|\+\+\+\+|\*\*\*\*|____+)$/.test(trimmed);
}

/**
 * Get pattern to match the closing delimiter
 */
function getDelimiterPattern(line) {
  const trimmed = line.trim();
  const char = trimmed[0];
  const count = trimmed.length;
  return new RegExp(`^\\${char}{${count},}$`);
}

/**
 * Check if line is an attribute declaration
 */
function isAttributeDeclaration(line) {
  return /^:\w+:/.test(line.trim());
}

/**
 * Extract include path from include directive
 */
function extractIncludePath(line) {
  const match = line.match(/include::([^\[]+)/);
  return match ? match[1] : 'unknown';
}

/**
 * Transform {attribute} references to button elements
 */
function buttonizeAttributes(line, attributeOptions) {
  // Match {attribute-name} patterns
  return line.replace(/\{([a-zA-Z0-9_-]+)\}/g, (match, attrName) => {
    const fieldConfig = attributeOptions.fields && attributeOptions.fields[attrName];
    const defaultValue = fieldConfig?.default || match; // Show {attr} if unresolved
    const options = fieldConfig?.options || [];

    // Generate button HTML
    const optionsJson = JSON.stringify(options).replace(/"/g, '&quot;');
    const buttonHtml = `<button type="button" class="attribute-substitution" data-attribute="${attrName}" title="${attrName}" data-value="${defaultValue}" data-options="${optionsJson}">${defaultValue}</button>`;

    // Wrap in passthrough to preserve HTML - use +++ format for raw HTML
    return `+++${buttonHtml}+++`;
  });
}
