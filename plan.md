# Migration Plan: @techwriter/asciidoc-comments v1 (Asciidoctor.js v4)

**Goal:** Migrate from Asciidoctor v2.2.6 (Opal-based) to @asciidoctor/core v4 (native JavaScript) with semantic ID generation and enhanced output information.

---

## Executive Summary: Key Design Decisions

Based on spec alignment (new-decisions.md, @new-spec1-m1.md, new-spec2.md), this plan implements:

### ✅ Default Behaviors (Per Spec)
1. **Include boundaries: VISIBLE by default** - HTML `<hr>` + `<div class="include-boundary">` markers
   - Opt-out: `:no-include-boundaries:` or `[include-boundary=false]`
2. **Attribute buttons: Preprocessor-based** - Line-by-line processing with delimited block awareness
   - Avoids buttonizing `{...}` inside code blocks, literal blocks, include lines
   - NOT postprocessor-based (which would lose source context)
3. **ID format: Semantic** - `section--block-N` pattern, not `comment_N` counter

### ⏸️ Deferred to Future Versions
1. **Quote blocks** - NOT in ELIGIBLE_CONTEXTS for V1 (would be breaking change)
2. **Data attributes** - No `data-asciidoc-*` attributes in V1 (minimizes HTML changes)
3. **Antora integration** - Platform-specific, deferred to v1.1+

### 🔧 Eligible Block Types (V1)
**ELIGIBLE_CONTEXTS:** `paragraph`, `olist`, `ulist`, `list_item`, `listing`, `literal`, `example`, `sidebar`, `admonition`, `open`, `table`

**Excluded:** `quote` (deferred), `preamble` (setId broken), `table_cell` (not addressable)

---

## Phase 1: Dependency Migration

### 1.1 Update package.json
- **Current:** `"asciidoctor": "^2.2.6"` (Opal-based Ruby port)
- **Target:** `"@asciidoctor/core": "^4.0.8"` (native JavaScript)
- **Engine constraint:** Set `"engines": { "node": ">=20" }` (note: official docs specify >=22, but using >=20 per npm convention)
- **Add dev dependencies:** Consider adding testing framework (e.g., `mocha`, `chai`)
- **Update version:** Bump to `2.0.0` (breaking change from v1.x counter-based IDs)

### 1.2 API Changes Required
- **Synchronous → Async:** Change from `convertFile()` to async `convert()` with Promises
- **Module system:** Migrate from CommonJS `require()` to ESM `import` or maintain CommonJS with async support
- **Registry API:** Update extension registration to use v4 registry model
- **AST methods:** Verify all node methods (getId, setId, getBlocks, etc.) work in v4

---

## Phase 2: Core Architecture Refactoring

### 2.1 Replace Simple Counter with Semantic ID Generator

**Current implementation (add-id-processor.js):**
- Single tree processor
- Global counter (`comment_0`, `comment_1`, ...)
- No section awareness
- No collision handling

**New implementation requirements:**

#### 2.1.1 ID Generation Logic
- **Pattern:** `<section-base>--<kind>-<n>`
  - `<section-base>`: Derived from nearest heading (explicit `id=` or generated slug)
  - `<kind>`: Either `block` or `include`
  - `<n>`: Sequential counter within section scope
- **Examples:**
  - `install--block-1`, `install--block-2`
  - `setup--include-1`
  - `my-section--block-1`

#### 2.1.2 Section Base Resolution
- Walk up AST tree to find nearest section/heading
- Check for explicit `id=` attribute first
- Fallback to generated slug from heading title
- Default to document title or `_preamble` for blocks before first heading

#### 2.1.3 Global Registry per Document
- Maintain document-wide uniqueness (not per-section)
- Track all assigned IDs (both generated and author-provided)
- Implement collision detection and resolution
- Suffix with `--2`, `--3` for generated ID conflicts

### 2.2 Two-Stage Processor Architecture

#### 2.2.1 Stage 1: Preprocessor (Include Boundaries)
**Purpose:** Insert structural markers around included content before expansion

**Implementation:**
- Register preprocessor hook
- Detect `include::` directives
- Insert structural block anchor before include
- Pattern: `[[<section-base>--include-<n>]]`
- Optional: Insert visible boundary markers (see 2.2.3)

**Example transformation:**
```asciidoc
== Setup
include::partials/intro.adoc[]
```
→
```asciidoc
== Setup
[[setup--include-1]]
include::partials/intro.adoc[]
```

#### 2.2.2 Stage 2: Tree Processor (Block IDs)
**Purpose:** Assign IDs to blocks after parsing but before conversion

**Implementation:**
- Register tree processor hook
- Recursively traverse AST blocks
- For each eligible block:
  - Check if author-provided ID exists → skip
  - Check if opt-out attribute set → skip
  - Check if excluded node type → skip
  - Generate semantic ID
  - Check for collision → append suffix if needed
  - Call `setId()` with generated value

**Eligible block types (ELIGIBLE_CONTEXTS):**
- Paragraphs (`paragraph`)
- Lists (`olist`, `ulist`, individual `list_item`)
- Code blocks (`listing`, `literal`)
- Examples (`example`)
- Sidebars (`sidebar`)
- Admonitions (`admonition`)
- Open blocks (`open`)
- Tables (whole `table` structure, not individual cells)

**Note:** Quote blocks (`quote`) are NOT included in initial ELIGIBLE_CONTEXTS to match current implementation. Adding them would be a breaking change (new IDs on quote blocks). Consider for future enhancement if needed.

**Excluded types:**
- Preamble blocks (setId doesn't produce rendered id attribute)
- Raw `table_cell` nodes
- Blocks with author-provided IDs
- Blocks with `[semantic-id=false]` attribute

#### 2.2.3 Include Boundary Markers (Visible by Default)
**Default:** Visible boundary markers with HTML (per spec @new-spec1-m1.md section 5.1)
**Format:** Insert passthrough block with HTML

```html
<div id="section--include-1" class="include-boundary">
  <hr>
  <span>Start include: partials/intro.adoc</span>
</div>
<!-- included content here -->
<div class="include-boundary">
  <hr>
  <span>End include: partials/intro.adoc</span>
</div>
```

**Invisible mode:** Set `:no-include-boundaries:` or `[include-boundary=false]` per-include
**Invisible format:** Structural anchor only `[[section--include-1]]` without HTML markers

---

## Phase 3: Enhanced Output Information

### 3.1 Attribute Substitution Buttons
**Purpose:** Interactive value selectors for attributes with dropdown alternatives

#### 3.1.1 Preprocessor Registration (Line-by-Line Processing)
**IMPORTANT:** Implement in preprocessor, NOT postprocessor
**Reason:** Preprocessor has source-line context to avoid buttonizing:
- Text inside delimited blocks (code, literal, listing)
- Include directive lines
- Attribute declaration lines
- Other contexts where `{...}` should remain literal

**Implementation:**
- Register preprocessor hook
- Process source lines before parsing
- Track delimited block state (inside/outside code blocks, etc.)
- Skip lines that should not be buttonized
- Transform `{attribute-name}` → passthrough with button HTML only in eligible contexts

**Contrast with postprocessor approach:** 
Postprocessor would parse HTML after conversion, losing source context about delimited blocks and attribute declarations, risking buttonization of `{...}` text inside code blocks or other literal contexts.

#### 3.1.2 Button HTML Structure
```html
<button type="button" 
        class="attribute-substitution" 
        data-attribute="product-short" 
        title="Product Short" 
        data-value="Developer Hub">
  Developer Hub
</button>
```

#### 3.1.3 JSON Options Configuration
**CLI flag:** `--attribute-options path/to/options.json`

**Format:**
```json
{
  "version": 1,
  "fields": {
    "product-short": {
      "default": "Developer Hub",
      "options": ["podman", "docker", "kubernetes"]
    },
    "product-long": {
      "default": "Red Hat Developer Hub",
      "options": ["podman", "docker", "kubernetes"]
    }
  }
}
```

#### 3.1.4 Client-Side JavaScript
- Inject script to handle button clicks
- Show dropdown menu with options from `data-attribute`
- Update all buttons with same `data-attribute` when selected
- Store selection in localStorage for persistence

#### 3.1.5 Unresolved Attribute Handling
- Display attribute name as button text: `{product-short}`
- Maintain interactive behavior for future resolution
- No error/warning for missing values

### 3.2 Block Information Data Attributes
**Purpose:** Expose block metadata in HTML for debugging/tooling
**Status:** OPTIONAL ENHANCEMENT - Not in V1 spec

**Note:** The spec documents do not require data-asciidoc-* attributes. Adding them would change HTML output for every generated block. Consider this a future enhancement rather than V1 requirement.

**If implemented (future):**
```html
<div id="install--block-1" 
     data-asciidoc-block-type="paragraph"
     data-asciidoc-section="install"
     data-asciidoc-generated-id="true">
  ...
</div>
```

**Potential metadata:**
- `data-asciidoc-block-type`: Block context (paragraph, list, code, etc.)
- `data-asciidoc-section`: Section base used for ID
- `data-asciidoc-generated-id`: Boolean indicating auto-generated vs author-provided
- `data-asciidoc-counter`: Sequential number within section (debugging)

**V1 Decision:** Omit data attributes. Use standard `id` attribute only via `setId()`. Add data attributes in v2.1+ if user feedback indicates need.

---

## Phase 4: Configuration & Control Mechanisms

### 4.1 Document-Level Opt-Out
**Attribute:** `:no-semantic-ids:`

**Behavior:**
- Disable all ID generation when set
- Still allow author-provided IDs
- Check in tree processor before processing

**Implementation:**
```javascript
if (doc.getAttribute('no-semantic-ids')) {
  return doc; // Skip ID generation entirely
}
```

### 4.2 Per-Block Opt-Out
**Syntax:** `[semantic-id=false]`

**Example:**
```asciidoc
[semantic-id=false]
This paragraph won't get an auto-generated ID.
```

**Implementation:**
Check block attributes for `semantic-id=false` before calling setId()

### 4.3 Include Boundary Controls
**Attribute:** `:no-include-boundaries:` (document-level) or `[include-boundary=false]` (per-include)

**Default behavior:** Visible HTML boundary markers (per spec @new-spec1-m1.md section 5.1)
**Options:**
- **Default (visible):** Full HTML boundary markers with `<hr>`, `<div class="include-boundary">`, start/end labels
- **Invisible:** Set `:no-include-boundaries:` to use structural anchor `[[id]]` only without HTML markers
- **Per-include opt-out:** Use `[include-boundary=false]` on individual include directives

**Breaking change note:** If current implementation has invisible boundaries by default, changing to visible would alter rendered HTML output.

### 4.4 Attribute Button Controls
**Attribute:** `:no-attribute-buttons:`

**Behavior:**
- Disable postprocessor transformation
- Render attributes as plain text
- Maintain ID generation (independent feature)

---

## Phase 5: Collision Handling & Stability

### 5.1 Collision Detection Strategy

#### 5.1.1 Global Registry
Maintain document-wide Set/Map of assigned IDs:
```javascript
const assignedIds = new Set();
```

#### 5.1.2 Check Author-Provided IDs First
```javascript
// Scan document for all explicit IDs before generating
doc.findBy().forEach(block => {
  const explicitId = block.getId();
  if (explicitId) {
    assignedIds.add(explicitId);
  }
});
```

#### 5.1.3 Collision Resolution for Generated IDs
```javascript
function generateUniqueId(baseId, assignedIds) {
  if (!assignedIds.has(baseId)) {
    return baseId;
  }
  
  // Append --2, --3, etc.
  let suffix = 2;
  while (assignedIds.has(`${baseId}--${suffix}`)) {
    suffix++;
  }
  return `${baseId}--${suffix}`;
}
```

### 5.2 Stability Guarantees

**Stable across:**
- Text edits within blocks
- Insertions/deletions outside current section
- Changes to unrelated sections

**Changes occur when:**
- Inserting eligible blocks before target in same section
- Deleting blocks before target (counter shifts down)
- Renaming section heading without explicit ID
- Changing section structure (moving blocks between sections)

**Not guaranteed stable:**
- Include order changes
- Conditional content changes (ifdef, etc.)

---

## Phase 6: CLI & API Updates

### 6.1 CLI Enhancements (index.js)

#### 6.1.1 Migrate to Async API
```javascript
#!/usr/bin/env node
import Asciidoctor from '@asciidoctor/core';
import { readFile } from 'fs/promises';
import path from 'path';

const args = process.argv.slice(2);
const asciidoctor = Asciidoctor();

// Register extensions
const registry = asciidoctor.Extensions.create();
// ... register preprocessor, tree processor, postprocessor

// Async conversion
const inputPath = args[0];
const content = await readFile(inputPath, 'utf-8');
const html = await asciidoctor.convert(content, {
  extension_registry: registry,
  safe: 'unsafe',
  standalone: true,
  attributes: {
    // defaults
  }
});

console.log(html);
```

#### 6.1.2 Add CLI Flags
- `--attribute-options <path>`: Load JSON config for attribute buttons
- `--no-semantic-ids`: Disable ID generation
- `--include-boundaries <mode>`: Set boundary visibility (visible|invisible|false)
- `--no-attribute-buttons`: Disable attribute button transformation
- `--output <path>`: Write to file instead of stdout

#### 6.1.3 Help Text
```bash
asciidoc-comments [options] <input.adoc>

Options:
  --attribute-options <path>    JSON config for attribute value options
  --no-semantic-ids             Disable automatic ID generation
  --include-boundaries <mode>   Set include boundary markers (visible|invisible|false)
  --no-attribute-buttons        Disable attribute button transformation
  --output <path>              Write output to file
  -h, --help                   Show help
  --version                    Show version
```

### 6.2 Module Export (for programmatic use)
```javascript
export function convert(content, options = {}) {
  // Same logic as CLI but return HTML string
}

export function convertFile(filePath, options = {}) {
  // Read file and call convert()
}
```

---

## Phase 7: Testing Strategy

### 7.1 Unit Tests

#### 7.1.1 ID Generation Tests
- Section base resolution (explicit ID, slug, fallback)
- Pattern format validation
- Counter incrementing within sections
- Global uniqueness across sections

#### 7.1.2 Collision Tests
- Author ID always wins
- Generated collision suffix (--2, --3)
- Mixed author + generated IDs

#### 7.1.3 Opt-Out Tests
- Document-level disable
- Per-block disable
- Nested opt-out scenarios

#### 7.1.4 Excluded Node Tests
- Preamble doesn't get IDs
- Table cells excluded
- Blocks with author IDs skipped

### 7.2 Integration Tests

#### 7.2.1 Full Document Conversion
- Sample documents with various structures
- Verify HTML output matches expected IDs
- Check include boundary insertion

#### 7.2.2 Attribute Button Tests
- JSON config loading
- Button HTML generation
- Unresolved attribute handling

#### 7.2.3 Stability Tests
- Same document converted multiple times → same IDs
- Insert block in middle → IDs after it shift
- Rename section → base changes

### 7.3 Regression Tests
- Compare v1 (counter) vs v2 (semantic) outputs
- Document breaking changes
- Provide migration guide for users

---

## Phase 8: Documentation Updates

### 8.1 README.md Rewrite
- Remove old counter-based ID description
- Add semantic ID pattern explanation
- Document all CLI flags
- Add attribute options JSON format
- Provide migration guide from v1

### 8.2 Usage Examples
```asciidoc
= My Document

== Installation

This is a paragraph.  <!-- gets: installation--block-1 -->

Another paragraph.  <!-- gets: installation--block-2 -->

include::partials/intro.adoc[]  <!-- boundary: installation--include-1 -->

== Configuration

[#my-custom-id]
Explicit ID wins.  <!-- keeps: my-custom-id -->

[semantic-id=false]
No auto ID here.  <!-- no ID -->
```

### 8.3 Attribute Options Example
```json
{
  "version": 1,
  "fields": {
    "product": {
      "default": "My Product",
      "options": ["Product A", "Product B", "Product C"]
    }
  }
}
```

```bash
asciidoc-comments --attribute-options config.json input.adoc
```

### 8.4 Migration Guide
**For users upgrading from v1.x:**
1. IDs changed from `comment_N` to `section--block-N`
2. Anchors now reflect document structure
3. Author-provided IDs (`[[id]]` or `[#id]`) always preserved
4. Update any hardcoded references to `comment_*` IDs
5. Consider adding explicit IDs to critical cross-reference targets

---

## Phase 9: File Structure

### 9.1 Proposed File Organization
```
asciidoc-comments/
├── index.js                    # CLI entry point (async, v4 API)
├── lib/
│   ├── preprocessor.js         # Include boundary insertion + attribute buttonizing
│   ├── tree-processor.js       # Block ID assignment
│   ├── id-generator.js         # Semantic ID generation logic
│   ├── section-resolver.js     # Section base resolution
│   ├── collision-handler.js    # Uniqueness & collision suffix
│   └── client-script.js        # Browser JS for attribute buttons
├── test/
│   ├── id-generator.test.js
│   ├── collision.test.js
│   ├── opt-out.test.js
│   ├── integration.test.js
│   └── fixtures/
│       ├── sample.adoc
│       └── expected.html
├── examples/
│   ├── basic.adoc
│   ├── with-includes.adoc
│   └── attribute-options.json
├── bookmarklet.js              # Browser bookmarklet (optional, future)
├── package.json
├── README.md
└── plan.md                     # This file
```

### 9.2 Delete/Archive
- `add-id-processor.js` → Archive as `legacy/add-id-processor-v1.js`
- Consider keeping for reference during migration

---

## Phase 10: Implementation Checklist

### Step-by-step execution order:

- [ ] **10.1** Update package.json dependencies and version
- [ ] **10.2** Create lib/ directory structure
- [ ] **10.3** Implement id-generator.js (semantic ID pattern logic)
- [ ] **10.4** Implement section-resolver.js (find nearest heading)
- [ ] **10.5** Implement collision-handler.js (uniqueness checking)
- [ ] **10.6** Implement preprocessor.js (include boundaries + attribute buttons)
  - [ ] Include boundary insertion with visible HTML markers by default
  - [ ] Attribute buttonizing (line-by-line with delimited block awareness)
  - [ ] Load JSON options config for attribute values
  - [ ] Skip buttonizing inside code blocks, include lines, attribute declarations
- [ ] **10.7** Implement tree-processor.js (block ID assignment)
  - [ ] Integrate id-generator, section-resolver, collision-handler
  - [ ] Handle opt-out attributes
  - [ ] Exclude preamble and table_cell nodes
  - [ ] Use ELIGIBLE_CONTEXTS: paragraph, olist, ulist, list_item, listing, literal, example, sidebar, admonition, open, table
  - [ ] Do NOT include quote blocks in V1
- [ ] **10.8** Create client-script.js (browser interaction for attribute buttons)
  - [ ] Dropdown menu rendering on button click
  - [ ] Cross-button synchronization (same data-attribute updates all)
  - [ ] localStorage persistence for selected values
- [ ] **10.9** Migrate index.js to async v4 API
  - [ ] Add CLI argument parsing (--attribute-options, --no-semantic-ids, --no-include-boundaries, --no-attribute-buttons, --output)
  - [ ] Register preprocessor and tree processor (NO postprocessor needed)
  - [ ] Load and pass JSON config to preprocessor for attribute buttons
  - [ ] Handle async conversion with v4 API
- [ ] **10.10** Write unit tests
  - [ ] ID generation tests
  - [ ] Collision handling tests
  - [ ] Section base resolution tests
  - [ ] Opt-out control tests
- [ ] **10.11** Write integration tests
  - [ ] Full document conversion with includes
  - [ ] Attribute button generation (with/without JSON config)
  - [ ] Include boundary rendering (visible/invisible)
  - [ ] ELIGIBLE_CONTEXTS verification
- [ ] **10.12** Update README.md
  - [ ] Document semantic ID pattern
  - [ ] Explain include boundaries
  - [ ] Show attribute button usage with JSON config
  - [ ] List eligible block types
- [ ] **10.13** Create migration guide (v1.x → v2.0)
  - [ ] ID format changes (`comment_N` → `section--block-N`)
  - [ ] How to add explicit IDs for stable references
  - [ ] New features and opt-out controls
- [ ] **10.14** Test on sample documents from dist/
- [ ] **10.15** Update version to 2.0.0
- [ ] **10.16** Publish to npm

---

## Phase 11: Known Issues & Deferred Features

### 11.1 Known Limitations (V1 Scope)
- **Preamble blocks:** setId() doesn't produce rendered id attribute (confirmed on v2.2.6 and v4.0.8)
- **Table cells:** Raw table_cell nodes excluded (only whole tables addressable)
- **Quote blocks:** Not in ELIGIBLE_CONTEXTS for V1 (adding them would be breaking change)
- **Data attributes:** Not included in V1 (would change output for every block)
- **Antora integration:** Deferred to future release (platform-specific concerns)
- **Zero-width boundaries:** Not implemented (structural block anchor used instead)
- **Bookmarklet helper:** Non-V1 feature, possible future enhancement

### 11.2 Node Version Discrepancy
- npm convention: `node >= 20`
- Official @asciidoctor/core docs: `node >= 22`
- **Decision:** Use `>= 20` but note discrepancy in README

### 11.3 Future Enhancements (Post-V1)
- **Quote blocks in ELIGIBLE_CONTEXTS** (v2.1+) - would add IDs to quote blocks
- **Data attributes** (v2.1+) - `data-asciidoc-block-type`, `data-asciidoc-section`, etc.
- Antora cross-site xref integration
- Zero-width include boundary spans (if needed)
- Bookmarklet for copy-markdown-link-to-block
- Advanced collision resolution strategies
- Per-file ID registries for large multi-file projects
- Support for other output formats (PDF, DocBook)

---

## Phase 12: Output Compatibility & Breaking Changes

### 12.1 Changes from Current Simple Implementation
The current implementation (add-id-processor.js on all branches) is very basic:
- 28 lines of code
- Simple global counter: `comment_0`, `comment_1`, etc.
- No include boundaries, no attribute buttons, no opt-out controls
- Processes all blocks recursively that have `getId()` and `setId()` methods

### 12.2 Expected Output Changes in V1

#### 12.2.1 ID Format Changes (Breaking)
**Current:** `comment_0`, `comment_1`, `comment_2`, ...
**New:** `section--block-1`, `section--block-2`, `install--block-1`, ...

**Impact:** Any hardcoded references to `comment_*` IDs will break. Users must:
- Update documentation/links referencing old IDs
- Add explicit `[#custom-id]` to blocks requiring stable references
- Accept that auto-generated IDs now reflect structure

#### 12.2.2 Include Boundaries (New Feature)
**Current:** No include boundary markers
**New:** Visible HTML boundaries by default

**Output example:**
```html
<div id="setup--include-1" class="include-boundary">
  <hr>
  <span>Start include: partials/intro.adoc</span>
</div>
<!-- included content -->
<div class="include-boundary">
  <hr>
  <span>End include: partials/intro.adoc</span>
</div>
```

**Impact:** Visual change - documents with includes will show boundary markers. Disable with `:no-include-boundaries:` if unwanted.

#### 12.2.3 Attribute Buttons (New Feature)
**Current:** Attributes render as plain text
**New:** Attributes render as interactive buttons (if `--attribute-options` provided)

**Impact:** 
- `{product}` → `<button>` element with dropdown
- Changes HTML structure for attribute references
- Disable with `:no-attribute-buttons:` if unwanted
- Only applies when JSON config provided via CLI flag

#### 12.2.4 Eligible Block Types (Clarification)
**V1 ELIGIBLE_CONTEXTS:**
- `paragraph`, `olist`, `ulist`, `list_item`
- `listing`, `literal`, `example`, `sidebar`
- `admonition`, `open`, `table`

**NOT included (explicitly excluded in V1):**
- `quote` blocks (adding would be breaking change for v2)
- `preamble` blocks (setId doesn't work)
- `table_cell` raw nodes (not addressable)

**Impact:** Quote blocks will NOT get IDs in V1. If current implementation inadvertently assigned IDs to quotes, they would lose them.

#### 12.2.5 Data Attributes (Deferred)
**Current:** N/A
**V1:** No data-asciidoc-* attributes
**Future (v2.1+):** May add metadata attributes

**Impact:** None in V1. Keeps HTML output minimal (only `id` attribute added).

### 12.3 Migration Path for Users

#### 12.3.1 For Users on Simple Counter Implementation
1. **Review generated IDs:** Run conversion, inspect new ID format
2. **Add explicit IDs:** For any critical cross-reference targets, add `[#stable-id]` in source
3. **Update links:** Replace hardcoded `#comment_42` with new semantic IDs or explicit IDs
4. **Test rendering:** Verify include boundaries and attribute buttons (if enabled) display correctly
5. **Opt-out if needed:** Use `:no-include-boundaries:` or `:no-attribute-buttons:` to disable new features

#### 12.3.2 Compatibility Flags (Consider for Implementation)
**Optional:** Provide backward-compatibility mode for testing:
```bash
# Legacy counter mode (for comparison/migration)
asciidoc-comments --legacy-ids input.adoc

# V1 semantic mode (default)
asciidoc-comments input.adoc
```

**Recommendation:** Don't implement `--legacy-ids`. Clean break to v2.0.0 is clearer. Users who need old behavior can pin to v1.0.x.

## Phase 13: Success Criteria

### 13.1 Functional Requirements Met
- ✅ Uses @asciidoctor/core v4.x
- ✅ Generates semantic IDs with `<section-base>--<kind>-<n>` pattern
- ✅ Two-stage processing (preprocessor + tree processor)
- ✅ Include boundary markers inserted
- ✅ Attribute substitution buttons working
- ✅ Opt-out controls functional (document + per-block)
- ✅ Collision handling with suffix generation
- ✅ Author-provided IDs always preserved

### 13.2 Output Information Enhanced
- ✅ Interactive attribute buttons with JSON config (preprocessor-based, context-aware)
- ✅ Include boundaries marked visible by default (with opt-out controls)
- ⏸️ Block metadata data attributes deferred to v2.1+ (not in V1)

### 13.3 Quality Gates
- ✅ All unit tests passing
- ✅ Integration tests cover major use cases
- ✅ Documentation complete and accurate
- ✅ Migration guide available
- ✅ CLI flags working as documented
- ✅ No breaking changes to author-provided IDs

---

## Notes & References

- **Decision record:** dist/new-decisions.md
- **Spec part 1:** dist/@new-spec1-m1.md  
- **Spec part 2:** dist/new-spec2.md
- **Current implementation:** add-id-processor.js (counter-based, v2.2.6)
- **Target library:** @asciidoctor/core v4.0.8+
- **Breaking change:** ID format changes from `comment_N` to `section--block-N`
