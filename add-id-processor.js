import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const DEFAULT_OPTIONS = {
  disableAttribute: 'no-semantic-ids',
  controlAttribute: 'semantic-id',
  includeBoundaryAttribute: 'include-boundary',
  disableIncludeBoundariesAttribute: 'no-include-boundaries',
  disableAttributeButtonsAttribute: 'no-attribute-buttons',
  attributeOptions: null,
  idSeparator: '-',
  oneLevelIncludes: false,
}

const ELIGIBLE_CONTEXTS = new Set([
  'admonition',
  'example',
  'list_item',
  'listing',
  'literal',
  'olist',
  'open',
  'paragraph',
  'sidebar',
  'table',
  'ulist',
])

export function slugify(value, separator = '-') {
  return String(value || 'section')
    .toLowerCase()
    .replace(/&[a-z0-9#]+;/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/[^a-z0-9]+/g, separator)
    .replace(new RegExp(`${escapeRegExp(separator)}+`, 'g'), separator)
    .replace(new RegExp(`^${escapeRegExp(separator)}|${escapeRegExp(separator)}$`, 'g'), '')
    || 'section'
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export function register(registry, options = {}) {
  const config = { ...DEFAULT_OPTIONS, ...options }

  // Shared state for include tracking
  const includeCounters = new Map()
  const sectionStack = []

  // Use includeProcessor for nested includes unless oneLevelIncludes is true
  if (!config.oneLevelIncludes) {
    // Track sections via preprocessor to maintain section context for ID generation
    registry.preprocessor(function () {
      this.process(function (doc, reader) {
        if (isDocumentDisabled(doc, config)) return reader

        const lines = reader.lines
        let pendingLines = []

        for (const line of lines) {
          const heading = parseHeading(line)
          if (heading) {
            updateSectionStack(heading, sectionStack, pendingLines, config)
            pendingLines = []
          }
          pendingLines = nextPendingLines(line, pendingLines)
        }

        return reader
      })
    })

    registry.includeProcessor(function () {
      const self = this
      self.handles(function () {
        return true
      })
      self.process(function (doc, reader, target, attrs) {
        if (isDocumentDisabled(doc, config)) {
          // Let default processor handle it
          return
        }

        const includeBoundariesEnabled = !hasAttribute(doc, config.disableIncludeBoundariesAttribute)
        const shouldShowBoundary = includeBoundariesEnabled && !hasFalseAttribute(attrs, config.includeBoundaryAttribute)

        // Get directory from reader cursor
        const dir = reader._dir || reader.dir || reader.cursor?.dir
        if (!dir) {
          // No directory context, let default processor handle it
          return
        }

        const filePath = join(dir, target)

        let content
        try {
          content = readFileSync(filePath, 'utf8')
        } catch (err) {
          // File doesn't exist - let default processor handle the error
          return
        }

        const lines = content.trimEnd().split('\n')

        if (shouldShowBoundary) {
          const sectionBase = currentSectionBase(sectionStack)
          const index = increment(includeCounters, sectionBase)
          const includeId = `${sectionBase}--include-${index}`
          const wrappedLines = [
            '++++',
            '<hr>',
            `<div id="${escapeHtml(includeId)}" class="include-boundary" style="margin-left: -40px;"><span style="color: red;">Start</span>: <code>${escapeHtml(target)}</code></div>`,
            '++++',
            '',
            ...lines,
            '',
            '++++',
            `<div class="include-boundary" style="margin-left: -40px;"><span style="color: red;">End</span>: <code>${escapeHtml(target)}</code></div>`,
            '<hr>',
            '++++',
          ]
          reader.pushInclude(wrappedLines, filePath, target, 1, attrs)
        } else {
          reader.pushInclude(lines, filePath, target, 1, attrs)
        }

        return reader
      })
    })
  } else {
    // One-level includes mode: use preprocessor for top-level includes only
    registry.preprocessor(function () {
      this.process(function (doc, reader) {
        if (isDocumentDisabled(doc, config)) return reader

        const lines = reader.lines
        const rewritten = []
        const sectionStack = []
        let pendingLines = []
        let includeBoundariesEnabled = !hasAttribute(doc, config.disableIncludeBoundariesAttribute)
        let attributeButtonsEnabled = !hasAttribute(doc, config.disableAttributeButtonsAttribute)
        let delimitedBlock = null
        const includeCounters = new Map()

        for (const line of lines) {
          if (isDisableIncludeBoundariesAttributeLine(line, config)) {
            includeBoundariesEnabled = false
          }
          if (isDisableAttributeButtonsAttributeLine(line, config)) {
            attributeButtonsEnabled = false
          }

          const heading = parseHeading(line)
          if (heading) {
            updateSectionStack(heading, sectionStack, pendingLines, config)
            pendingLines = []
          }

          const include = parseIncludeDirective(line)
          const shouldAddIncludeBoundary = include && !isOptOutLine(rewritten, config)
          const shouldShowVisibleIncludeBoundary = shouldAddIncludeBoundary && shouldShowIncludeBoundary(include, includeBoundariesEnabled, config)

          if (shouldAddIncludeBoundary) {
            const sectionBase = currentSectionBase(sectionStack)
            const index = increment(includeCounters, sectionBase)
            const includeId = `${sectionBase}--include-${index}`
            if (shouldShowVisibleIncludeBoundary) {
              rewritten.push(...includeBoundaryBlock(includeId, 'Start', include.target, { hrBefore: true }))
            } else {
              rewritten.push(`[[${includeId}]]`)
              rewritten.push('')
            }
          }

          const shouldRewriteAttributes = attributeButtonsEnabled
            && !delimitedBlock
            && !include
            && !isAttributeDeclaration(line)
          rewritten.push(shouldRewriteAttributes ? buttonizeAttributeReferences(line) : line)
          if (shouldShowVisibleIncludeBoundary) {
            rewritten.push(...includeBoundaryBlock(null, 'End', include.target, { hrAfter: true }))
          }
          delimitedBlock = nextDelimitedBlock(line, delimitedBlock)
          pendingLines = nextPendingLines(line, pendingLines)
        }

        return new reader.constructor(doc, rewritten, reader.getCursor(), { normalize: true })
      })
    })
  }

  // Attribute button handling (only in includeProcessor mode, since preprocessor mode handles it inline)
  if (!config.oneLevelIncludes) {
    registry.preprocessor(function () {
      this.process(function (doc, reader) {
        if (isDocumentDisabled(doc, config)) return reader

        const lines = reader.lines
        const rewritten = []
        let attributeButtonsEnabled = !hasAttribute(doc, config.disableAttributeButtonsAttribute)
        let delimitedBlock = null

        for (const line of lines) {
          if (isDisableAttributeButtonsAttributeLine(line, config)) {
            attributeButtonsEnabled = false
          }

          const shouldRewriteAttributes = attributeButtonsEnabled
            && !delimitedBlock
            && !parseIncludeDirective(line)
            && !isAttributeDeclaration(line)
          rewritten.push(shouldRewriteAttributes ? buttonizeAttributeReferences(line) : line)
          delimitedBlock = nextDelimitedBlock(line, delimitedBlock)
        }

        return new reader.constructor(doc, rewritten, reader.getCursor(), { normalize: true })
      })
    })
  }

  registry.treeProcessor(function () {
    this.process(function (doc) {
      if (isDocumentDisabled(doc, config)) return doc

      const state = {
        config,
        usedIds: collectUsedIds(doc),
        sectionCounters: new Map(),
        tableMetadata: new Map(),
      }

      walkBlocks(doc, null, state)

      // Pass table metadata to postprocessor
      doc.tableMetadata = state.tableMetadata

      return doc
    })
  })

  registry.postprocessor(function () {
    this.process(function (doc, output) {
      let normalizedOutput = normalizeUnresolvedAttributeButtons(String(output))

      // Add row anchors to tables
      if (doc.tableMetadata && doc.tableMetadata.size > 0) {
        normalizedOutput = addTableRowAnchors(normalizedOutput, doc.tableMetadata)
      }

      if (!hasAttributeOptions(config.attributeOptions)) return normalizedOutput
      return appendAttributeOptionsScript(normalizedOutput, config.attributeOptions)
    })
  })
}

export default register

function isDocumentDisabled(doc, config) {
  return hasAttribute(doc, config.disableAttribute) || getAttribute(doc, config.controlAttribute) === 'false'
}

function parseIncludeDirective(line) {
  const match = String(line).match(/^(\s*)include::([^[]+)\[(.*)]\s*$/)
  if (!match) return null
  return {
    indent: match[1],
    target: match[2],
    attributes: match[3],
  }
}

function isDisableIncludeBoundariesAttributeLine(line, config) {
  return new RegExp(`^:${escapeRegExp(config.disableIncludeBoundariesAttribute)}:\\s*$`).test(String(line).trim())
}

function isDisableAttributeButtonsAttributeLine(line, config) {
  return new RegExp(`^:${escapeRegExp(config.disableAttributeButtonsAttribute)}:\\s*$`).test(String(line).trim())
}

function shouldShowIncludeBoundary(include, includeBoundariesEnabled, config) {
  return includeBoundariesEnabled && !hasFalseAttribute(include.attributes, config.includeBoundaryAttribute)
}

function hasFalseAttribute(attributes, name) {
  // Handle object attrs from includeProcessor
  if (typeof attributes === 'object' && attributes !== null && !Array.isArray(attributes)) {
    const value = attributes[name]
    return value === false || value === 'false'
  }
  // Handle string attrs from preprocessor
  const pattern = new RegExp(`(?:^|,)\\s*${escapeRegExp(name)}\\s*=\\s*false(?:\\s*,|$)`)
  return pattern.test(String(attributes))
}

function includeBoundaryBlock(id, label, target, { hrBefore = false, hrAfter = false } = {}) {
  const idAttribute = id ? ` id="${escapeHtml(id)}"` : ''
  const lines = [
    '++++',
  ]
  if (hrBefore) lines.push('<hr>')
  lines.push(`<div${idAttribute} class="include-boundary" style="margin-left: -40px;"><span style="color: red;">${escapeHtml(label)}</span>: <code>${escapeHtml(target)}</code></div>`)
  if (hrAfter) lines.push('<hr>')
  lines.push('++++', '')
  return lines
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function isAttributeDeclaration(line) {
  return /^:[A-Za-z0-9_][A-Za-z0-9_-]*:/.test(String(line).trim())
}

function buttonizeAttributeReferences(line) {
  return String(line).replace(/(^|[^\\$])\{([A-Za-z0-9_][A-Za-z0-9_-]*)\}/g, (_match, prefix, name) => {
    const escapedName = escapeHtml(name)
    return `${prefix}pass:a[<button type="button" class="attribute-substitution" data-attribute="${escapedName}" data-value="{${name}}" title="${escapedName}">{${name}}</button>]`
  })
}

function nextDelimitedBlock(line, current) {
  const marker = delimitedBlockMarker(line)
  if (!marker) return current
  if (current === marker) return null
  if (current) return current
  return marker
}

function delimitedBlockMarker(line) {
  const trimmed = String(line).trim()
  return /^(?:----|\.\.\.\.|____|\+\+\+\+|\*\*\*\*|====|--)$/.test(trimmed) ? trimmed : null
}

function normalizeUnresolvedAttributeButtons(output) {
  return output.replace(
    /(<button\b(?=[^>]*\bclass="attribute-substitution")(?=[^>]*\bdata-attribute="([A-Za-z0-9_-]+)")(?=[^>]*\bdata-value="\{([A-Za-z0-9_-]+)\}")[^>]*>)\{\3\}(<\/button>)/g,
    (match, opening, attributeName, referenceName, closing) => {
      if (attributeName !== referenceName) return match
      return `${opening.replace(`data-value="{${referenceName}}"`, `data-value="${attributeName}"`)}${attributeName}${closing}`
    },
  )
}

function hasAttributeOptions(attributeOptions) {
  return Object.keys(normalizeAttributeOptions(attributeOptions)).length > 0
}

function normalizeAttributeOptions(attributeOptions) {
  const fields = attributeOptions?.fields || attributeOptions || {}
  const normalized = {}
  for (const [name, config] of Object.entries(fields)) {
    const options = Array.isArray(config) ? config : config?.options
    if (!Array.isArray(options) || options.length === 0) continue
    normalized[name] = {
      default: typeof config?.default === 'string' ? config.default : null,
      options: options.map((option) => String(option)),
    }
  }
  return normalized
}

function addTableRowAnchors(html, tableMetadata) {
  // For each table with a generated ID, add row IDs to tbody/tfoot rows
  for (const [tableId] of tableMetadata.entries()) {
    const escapedId = escapeRegExp(tableId)

    // Match the specific table element
    const tablePattern = new RegExp(
      `(<table[^>]*\\bid="${escapedId}"[^>]*>)([\\s\\S]*?)</table>`,
      'g',
    )

    html = html.replace(tablePattern, (_match, openingTag, content) => {
      let rowIndex = 0

      // Add id attributes to each <tr> in <tbody> and <tfoot>
      // Skip <thead> rows (they're header rows, not data rows)
      const withRowIds = content.replace(
        /(<tbody>|<tfoot>)([\s\S]*?)(<\/tbody>|<\/tfoot>)/g,
        (_sectionMatch, openTag, sectionContent, closeTag) => {
          const withIds = sectionContent.replace(
            /<tr([^>]*)>/g,
            (_rowMatch, attributes) => {
              rowIndex += 1
              const rowId = `${tableId}-row-${rowIndex}`
              // Add id attribute to <tr> tag
              return `<tr id="${escapeHtml(rowId)}"${attributes}>`
            },
          )
          return `${openTag}${withIds}${closeTag}`
        },
      )

      return `${openingTag}${withRowIds}</table>`
    })
  }

  return html
}

function appendAttributeOptionsScript(output, attributeOptions) {
  const optionsJson = JSON.stringify(normalizeAttributeOptions(attributeOptions)).replace(/</g, '\\u003c')
  const script = `
<style>
.attribute-substitution-menu {
  position: absolute;
  z-index: 1000;
  margin-top: 2px;
  font-family: inherit;
  font-size: 0.9em;
  border: 1px solid #ccc;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
  background-color: white;
  min-width: 150px;
  max-width: 250px;
  width: auto;
}
</style>
<script>
(() => {
  const attributeOptions = ${optionsJson};
  let menu;

  function closeMenu() {
    if (menu) menu.remove();
    menu = null;
  }

  function setAttributeValue(name, value) {
    document.querySelectorAll(\`.attribute-substitution[data-attribute="\${CSS.escape(name)}"]\`).forEach((button) => {
      button.textContent = value;
      button.dataset.value = value;
    });
  }

  function showMenu(button, name) {
    closeMenu();
    const config = attributeOptions[name];
    if (!config) return;

    // Build comprehensive list of all available options
    const allOptions = [];
    const currentValue = button.dataset.value;
    const attributeRef = \`{\${name}}\`;

    // Add current value if it's different from other values
    if (currentValue && currentValue !== attributeRef && currentValue !== config.default && !config.options.includes(currentValue)) {
      allOptions.push(currentValue);
    }

    // Add attribute reference
    allOptions.push(attributeRef);

    // Add default value if it exists and is different from current value
    if (config.default && config.default !== currentValue) {
      allOptions.push(config.default);
    }

    // Add all configured options
    for (const option of config.options) {
      if (!allOptions.includes(option)) {
        allOptions.push(option);
      }
    }

    // Create native select dropdown
    menu = document.createElement('select');
    menu.className = 'attribute-substitution-menu';
    menu.setAttribute('size', Math.min(allOptions.length, 10));

    // Add placeholder option
    const placeholder = document.createElement('option');
    placeholder.textContent = \`Select value for {\${name}}...\`;
    placeholder.disabled = true;
    placeholder.selected = true;
    menu.append(placeholder);

    // Add all options
    for (const option of allOptions) {
      const optionElement = document.createElement('option');
      optionElement.value = option;
      optionElement.textContent = option;
      menu.append(optionElement);
    }

    // Handle selection
    menu.addEventListener('change', () => {
      setAttributeValue(name, menu.value);
      closeMenu();
    });

    // Close on blur
    menu.addEventListener('blur', () => {
      closeMenu();
    });

    button.insertAdjacentElement('afterend', menu);
    menu.focus();
  }

  document.addEventListener('click', (event) => {
    const button = event.target.closest?.('.attribute-substitution');
    if (!button) {
      if (!event.target.closest?.('.attribute-substitution-menu')) closeMenu();
      return;
    }

    const name = button.dataset.attribute;
    if (!attributeOptions[name]) return;
    event.preventDefault();
    showMenu(button, name);
  });
})();
</script>`

  return output.includes('</body>')
    ? output.replace('</body>', `${script}\n</body>`)
    : `${output}${script}`
}

function parseHeading(line) {
  const match = String(line).match(/^(={1,6})\s+(.+?)\s*$/)
  if (!match) return
  return {
    level: match[1].length,
    title: match[2].replace(/\s+\[\[.*]]\s*$/, ''),
  }
}

function updateSectionStack(heading, sectionStack, pendingLines, config) {
  const explicitId = findPendingExplicitId(pendingLines)
  const base = explicitId || slugify(heading.title, config.idSeparator)

  sectionStack.length = Math.max(0, heading.level - 1)
  sectionStack[heading.level - 1] = { level: heading.level, base }
}

function nextPendingLines(line, pendingLines) {
  const trimmed = String(line).trim()
  if (!trimmed) return []
  if (trimmed.startsWith('[')) return [...pendingLines, trimmed]
  return []
}

function findPendingExplicitId(lines) {
  for (let index = lines.length - 1; index >= 0; index--) {
    const line = lines[index]
    const shorthand = line.match(/^\[#([^,\]]+)/)
    if (shorthand) return shorthand[1]
    const anchor = line.match(/^\[\[([^\],]+)/)
    if (anchor) return anchor[1]
    const longhand = line.match(/^\[.*\bid=([^,\]]+)/)
    if (longhand) return longhand[1]
    if (line.trim() && !line.startsWith('[')) break
  }
  return null
}

function isOptOutLine(rewritten, config) {
  const pending = lastAttributeLines(rewritten)
  return pending.some((line) => {
    const longhand = new RegExp(`\\b${escapeRegExp(config.controlAttribute)}\\s*=\\s*false\\b`)
    return line.includes('%no-semantic-id') || line.includes('%no-semantic-ids') || longhand.test(line)
  })
}

function lastAttributeLines(lines) {
  const result = []
  for (let index = lines.length - 1; index >= 0; index--) {
    const line = lines[index]
    if (!line.trim()) break
    if (!line.trim().startsWith('[')) break
    result.unshift(line.trim())
  }
  return result
}

function currentSectionBase(sectionStack) {
  for (let index = sectionStack.length - 1; index >= 0; index--) {
    if (sectionStack[index]) return sectionStack[index].base
  }
  return 'document'
}

function collectUsedIds(doc) {
  const ids = new Set()
  visitBlocks(doc, (node) => {
    const id = getNodeId(node)
    if (id) ids.add(id)
  })

  const refs = doc.getRefs?.() || doc.getCatalog?.()?.refs || doc.getReferences?.()?.refs
  if (refs && typeof refs === 'object') {
    for (const id of Object.keys(refs)) ids.add(id)
  }

  return ids
}

function walkBlocks(node, currentSection, state) {
  for (const child of getChildBlocks(node)) {
    const context = getContext(child)
    const section = context === 'section' ? child : currentSection

    if (isEligibleGeneratedTarget(child) && !isDisabledByAncestor(child, state.config)) {
      assignGeneratedId(child, section, state)
    }

    walkBlocks(child, section, state)
  }
}

function assignGeneratedId(node, section, state) {
  if (getNodeId(node)) return

  const sectionBase = getSectionBase(section, state.config)
  const index = increment(state.sectionCounters, `${sectionBase}:block`)
  const candidate = `${sectionBase}--block-${index}`
  const id = uniqueGeneratedId(candidate, state.usedIds)
  node.setId(id)
  state.usedIds.add(id)

  // Track table metadata for postprocessor
  if (getContext(node) === 'table') {
    const rowCount = countTableRows(node)
    state.tableMetadata.set(id, { rowCount })
  }
}

function uniqueGeneratedId(candidate, usedIds) {
  if (!usedIds.has(candidate)) return candidate
  let counter = 2
  while (usedIds.has(`${candidate}--${counter}`)) counter += 1
  return `${candidate}--${counter}`
}

function getSectionBase(section, config) {
  if (!section) return 'document'
  const id = getNodeId(section)
  if (id && !id.startsWith('_')) return id
  const title = section.getTitle?.() || section.getCaptionedTitle?.() || 'section'
  return slugify(title, config.idSeparator)
}

function isEligibleGeneratedTarget(node) {
  const context = getContext(node)
  const nodeName = node.getNodeName?.()
  if (nodeName === 'preamble' || context === 'preamble' || context === 'table_cell') return false
  return ELIGIBLE_CONTEXTS.has(context)
}

function isDisabledByAncestor(node, config) {
  let current = node
  while (current) {
    if (getAttribute(current, config.controlAttribute) === 'false' || hasRole(current, 'no-semantic-id') || hasRole(current, 'no-semantic-ids')) {
      return true
    }
    current = current.getParent?.()
  }
  return false
}

function visitBlocks(node, visitor) {
  visitor(node)
  for (const child of getChildBlocks(node)) visitBlocks(child, visitor)
}

function getChildBlocks(node) {
  const children = []
  if (node?.getBlocks) children.push(...node.getBlocks())

  if (node?.getItems) {
    for (const item of node.getItems()) {
      children.push(item)
      if (item?.getBlocks) children.push(...item.getBlocks())
    }
  }

  if (node?.getRows) {
    const rows = node.getRows()
    for (const cells of Object.values(rows || {})) {
      for (const row of cells || []) {
        for (const cell of row || []) {
          const innerDocument = cell?.getInnerDocument?.()
          if (innerDocument) children.push(innerDocument)
          if (cell?.getBlocks) children.push(...cell.getBlocks())
        }
      }
    }
  }

  return children
}

function getNodeId(node) {
  return node?.getId?.() || null
}

function getContext(node) {
  return node?.getContext?.() || node?.getNodeName?.() || ''
}

function getAttribute(node, name) {
  const value = node?.getAttribute?.(name)
  if (value === undefined || value === null) return null
  return String(value)
}

function hasAttribute(node, name) {
  if (node?.hasAttribute) return node.hasAttribute(name)
  return getAttribute(node, name) !== null
}

function hasRole(node, role) {
  if (node?.hasRoleAttribute) return node.hasRoleAttribute(role)
  const roles = getAttribute(node, 'role')
  return roles ? roles.split(/\s+/).includes(role) : false
}

function increment(counters, key) {
  const next = (counters.get(key) || 0) + 1
  counters.set(key, next)
  return next
}

function countTableRows(tableNode) {
  const rows = tableNode.getRows?.()
  if (!rows) return 0
  const head = rows.head?.length || 0
  const body = rows.body?.length || 0
  const foot = rows.foot?.length || 0
  return head + body + foot
}
