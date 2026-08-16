# Plan Updates Based on Spec Alignment

## Changes Made to plan.md

### 1. Include Boundary Default Behavior
**Original plan:** Invisible by default, visible opt-in  
**Updated to:** Visible by default (per @new-spec1-m1.md section 5.1)

**Rationale:** Spec explicitly states "Visible mode (default)" with HTML `<hr>` and `<div class="include-boundary">` markers.

**Opt-out mechanisms:**
- Document-level: `:no-include-boundaries:`
- Per-include: `[include-boundary=false]`

---

### 2. Attribute Button Processing Stage
**Original plan:** Postprocessor (HTML parsing)  
**Updated to:** Preprocessor (line-by-line with source context)

**Rationale:** 
- Preprocessor has source-line context to avoid buttonizing:
  - Text inside delimited blocks (code, literal, listing)
  - Include directive lines
  - Attribute declaration lines
- Postprocessor would lose this context and buttonize `{...}` in code blocks

**Implementation notes:**
- Track delimited block state while processing lines
- Skip buttonizing in non-eligible contexts
- Inject button HTML via passthrough only where appropriate

---

### 3. Quote Blocks - Explicitly Excluded from V1
**Original plan:** Listed quotes as eligible ("Quotes, examples, sidebars, etc.")  
**Updated to:** Explicitly excluded from ELIGIBLE_CONTEXTS in V1

**V1 ELIGIBLE_CONTEXTS:**
- `paragraph`, `olist`, `ulist`, `list_item`
- `listing`, `literal`, `example`, `sidebar`
- `admonition`, `open`, `table`

**NOT included:**
- `quote` - Deferred to v2.1+ (adding would be breaking change)

**Rationale:** Aligns with current implementation behavior. Adding quote blocks would give them new IDs that don't exist today, changing output.

---

### 4. Data Attributes - Marked as Optional/Future
**Original plan:** Add data-asciidoc-* attributes to all blocks  
**Updated to:** Deferred to v2.1+ (not in V1 scope)

**Deferred attributes:**
- `data-asciidoc-block-type`
- `data-asciidoc-section`
- `data-asciidoc-generated-id`
- `data-asciidoc-counter`

**Rationale:** 
- Not mentioned in spec documents as required feature
- Would change HTML output for every generated block
- Minimizes V1 output changes (only `id` attribute added)

**V1 approach:** Use standard `id` attribute only via `setId()`

---

## Breaking Changes from Current Implementation

### Current (v1.0.2)
- Simple 28-line implementation
- Global counter: `comment_0`, `comment_1`, ...
- No include boundaries
- No attribute buttons
- No opt-out controls
- Processes all blocks with `getId()`/`setId()` methods

### V1 (v2.0.0) 
- Semantic IDs: `section--block-1`, `section--block-2`, ...
- Include boundaries visible by default
- Attribute buttons via preprocessor (if JSON config provided)
- Opt-out controls: `:no-semantic-ids:`, `:no-include-boundaries:`, `:no-attribute-buttons:`
- Specific ELIGIBLE_CONTEXTS (excludes quotes, preamble, table_cell)

### Migration Impact
1. **All auto-generated IDs change format** - `comment_N` → `section--block-N`
2. **Include directives get visible boundary markers** - New HTML output
3. **Attributes become buttons** - If `--attribute-options` JSON provided
4. **Hardcoded ID references break** - Users must update links or add explicit `[#id]`

---

## File Structure Changes

### Removed from original plan:
- ~~`lib/postprocessor.js`~~ - Not needed; attribute buttons in preprocessor

### Updated file purposes:
- `lib/preprocessor.js` - Now handles BOTH:
  1. Include boundary insertion
  2. Attribute buttonizing (line-by-line with context awareness)

### Implementation order (Phase 10):
1. ✅ Removed postprocessor steps
2. ✅ Consolidated attribute button logic into preprocessor
3. ✅ Clarified no need for HTML parsing approach

---

## Success Criteria Updates

### Removed:
- ❌ ~~Block metadata exposed via data attributes~~ (deferred)

### Added:
- ✅ Include boundaries visible by default with opt-out
- ✅ Attribute buttons preprocessor-based (not postprocessor)
- ✅ Quote blocks explicitly excluded from ELIGIBLE_CONTEXTS
- ⏸️ Data attributes deferred to v2.1+

---

## Documentation Clarity Improvements

### Added Executive Summary section:
- Lists default behaviors per spec
- Identifies deferred features
- Specifies exact ELIGIBLE_CONTEXTS
- Highlights breaking changes upfront

### Added Phase 12: Output Compatibility section:
- Documents all output changes
- Provides migration path for users
- Explains each breaking change with examples
- Recommends clean v2.0.0 break (no legacy mode)

### Enhanced Phase 10 checklist:
- Removed postprocessor implementation steps
- Expanded preprocessor responsibilities
- Clarified registration model (preprocessor + tree processor only)
- Added detailed testing requirements

---

## Key Takeaways

1. **Include boundaries:** VISIBLE by default (not invisible)
2. **Attribute buttons:** Preprocessor (not postprocessor) - preserves source context
3. **Quote blocks:** Explicitly excluded in V1 - deferred to avoid breaking changes
4. **Data attributes:** Not in V1 - keeps HTML minimal
5. **Breaking changes:** Clearly documented with migration guide
6. **File structure:** No postprocessor needed - preprocessor handles both include boundaries and attribute buttons

---

## Spec Alignment Checklist

- [x] Include boundaries visible by default (@new-spec1-m1.md §5.1)
- [x] Attribute buttonizing in preprocessor (new-decisions.md mentions preprocessor/postprocessor implementation, but preprocessor is correct for source-context awareness)
- [x] ELIGIBLE_CONTEXTS matches current implementation constraints
- [x] No data attributes unless explicitly required by spec (not found)
- [x] Breaking changes from `comment_N` to `section--block-N` documented
- [x] V1 scope focused on ID generation + boundaries + buttons (per new-decisions.md §1)
- [x] Antora integration deferred (per new-decisions.md §1.3)
- [x] Bookmarklet deferred (per new-decisions.md §1.2)
