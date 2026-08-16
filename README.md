# @techwriter/asciidoc-comments

Render AsciiDoc to HTML with semantic block IDs, include boundaries, and interactive attribute buttons.

![Version](https://img.shields.io/badge/version-2.0.0-blue)
![License](https://img.shields.io/badge/license-ISC-green)
![Node](https://img.shields.io/badge/node-%3E%3D20-brightgreen)

## Features

### 🔖 Semantic Block IDs
Every eligible block gets a human-readable ID based on its section:
- **Pattern:** `<section>--block-<n>`
- **Example:** `installation--block-1`, `prerequisites--block-2`
- **Benefit:** Stable anchors for deep linking, commenting, and navigation

### 📎 Include Boundaries
Visual markers around included content:
- **Default:** Visible HTML boundaries with `<hr>` and path labels
- **Configurable:** Opt-out globally or per-include
- **Use case:** Track where included content starts/ends in compiled output

### 🔘 Interactive Attribute Buttons
Transform attribute references into interactive dropdown selectors:
- **Example:** `{product-short}` → clickable button with options
- **Features:** Synchronized updates, localStorage persistence
- **Use case:** Multi-variant documentation with user-selectable values

## Installation

```bash
npm install -g @techwriter/asciidoc-comments
```

Or as a project dependency:
```bash
npm install @techwriter/asciidoc-comments
```

## Quick Start

### Basic Usage

```bash
asciidoc-comments document.adoc
```

Output HTML to stdout with semantic IDs on all eligible blocks.

### Generate HTML File

```bash
asciidoc-comments document.adoc -o output.html
```

### With Attribute Buttons

```bash
asciidoc-comments --attribute-options config.json document.adoc -o output.html
```

**config.json:**
```json
{
  "version": 1,
  "fields": {
    "product-short": {
      "default": "Developer Hub",
      "options": ["Developer Hub", "Podman", "Docker", "Kubernetes"]
    },
    "product-long": {
      "default": "Red Hat Developer Hub",
      "options": ["Red Hat Developer Hub", "Podman Desktop", "Docker Desktop"]
    }
  }
}
```

In your AsciiDoc:
```asciidoc
You need {product-short} installed.
```

Renders as an interactive button that lets users select from the configured options.

## CLI Options

```
Usage: asciidoc-comments [options] <input.adoc>

Options:
  --attribute-options <path>    JSON config for attribute value options
  --no-semantic-ids             Disable automatic ID generation
  --no-include-boundaries       Disable include boundary markers
  --no-attribute-buttons        Disable attribute button transformation
  --output, -o <path>          Write output to file
  --help, -h                   Show help
  --version, -v                Show version

Examples:
  asciidoc-comments document.adoc
  asciidoc-comments --attribute-options config.json document.adoc -o output.html
  asciidoc-comments --no-semantic-ids document.adoc
```

## Semantic ID Generation

### How It Works

1. **Section Detection:** Each block finds its nearest parent section/heading
2. **Base Resolution:** Uses explicit `id=` or generates slug from title
3. **ID Pattern:** Combines base + `--block-` + sequential number
4. **Uniqueness:** Global collision detection with `--2`, `--3` suffixes

### Eligible Block Types

IDs are generated for:
- Paragraphs (`paragraph`)
- Lists (`olist`, `ulist`, `list_item`)
- Code blocks (`listing`, `literal`)
- Examples (`example`)
- Sidebars (`sidebar`)
- Admonitions (`admonition`)
- Open blocks (`open`)
- Tables (`table` structure, not individual cells)

**Not included:**
- Quote blocks (deferred to v2.1+)
- Preamble blocks (setId doesn't work)
- Table cells (not addressable)

### Example

**Input (AsciiDoc):**
```asciidoc
= User Guide

== Installation

This is the first paragraph.

This is the second paragraph.

=== Prerequisites

You need Docker installed.

== Configuration

Edit the config file.
```

**Output IDs:**
- `_installation--block-1` - First paragraph
- `_installation--block-2` - Second paragraph
- `_prerequisites--block-1` - Prerequisites paragraph
- `_configuration--block-1` - Configuration paragraph

### Explicit IDs Always Win

```asciidoc
[#my-custom-id]
This paragraph keeps its explicit ID.
```

Output: `<div id="my-custom-id">` (no auto-generation)

### Opt-Out Controls

**Document-level (disable for entire document):**
```asciidoc
= My Document
:no-semantic-ids:

No blocks will get auto-generated IDs.
```

**Per-block:**
```asciidoc
[semantic-id=false]
This specific paragraph won't get an ID.
```

## Include Boundaries

### Visible by Default

When you include another file:
```asciidoc
== Setup

include::installation.adoc[]
```

Output includes visible boundary markers:
```html
<div id="setup--include-1" class="include-boundary">
  <hr>
  <span>Start include: installation.adoc</span>
</div>
<!-- included content here -->
```

### Disable Boundaries

**Document-level:**
```asciidoc
= My Document
:no-include-boundaries:
```

**Per-include:**
```asciidoc
include::fragment.adoc[include-boundary=false]
```

## Attribute Buttons

### Configuration Format

Create a JSON file with attribute definitions:

```json
{
  "version": 1,
  "fields": {
    "attribute-name": {
      "default": "Default Value",
      "options": ["Option 1", "Option 2", "Option 3"]
    }
  }
}
```

### Usage in AsciiDoc

```asciidoc
Install {product-short} on your system.

Configure {product-long} by editing the settings.
```

### Generated HTML

```html
<button type="button" 
        class="attribute-substitution" 
        data-attribute="product-short" 
        title="product-short" 
        data-value="Developer Hub" 
        data-options='["Developer Hub","Podman","Docker","Kubernetes"]'>
  Developer Hub
</button>
```

### Client-Side Behavior

- Click button → dropdown menu appears
- Select option → all buttons with same attribute update
- Selection persists in localStorage
- Automatic synchronization across page

### Disable Buttons

```asciidoc
= My Document
:no-attribute-buttons:
```

Attributes render as plain text instead of buttons.

## Breaking Changes from v1.x

### ID Format Changed

**v1.x (old):**
- `comment_0`, `comment_1`, `comment_2`, ...
- Simple global counter
- No section awareness

**v2.0.0 (new):**
- `installation--block-1`, `prerequisites--block-2`, ...
- Section-aware semantic IDs
- Collision handling

### Migration Guide

1. **Update hardcoded references:**
   - Replace `#comment_42` with new semantic IDs
   - Or add explicit `[#stable-id]` to critical blocks

2. **Test conversion:**
   ```bash
   asciidoc-comments old-doc.adoc -o new-output.html
   ```

3. **Inspect generated IDs:**
   ```bash
   grep 'id=".*--block-' new-output.html
   ```

4. **Add explicit IDs where needed:**
   ```asciidoc
   [#permanent-anchor]
   Critical paragraph that needs stable URL.
   ```

## Architecture

### Two-Stage Processing

1. **Preprocessor:**
   - Insert include boundary markers
   - Transform `{attributes}` to button HTML
   - Line-by-line with source context awareness
   - Skips code blocks, literals, attribute declarations

2. **Tree Processor:**
   - Walk AST after parsing
   - Assign semantic IDs to eligible blocks
   - Handle opt-outs and collisions
   - Preserve author-provided IDs

### File Structure

```
lib/
├── id-generator.js         # Semantic ID pattern generation
├── section-resolver.js     # Find nearest section for base
├── collision-handler.js    # Global uniqueness enforcement
├── preprocessor.js         # Include boundaries + attribute buttons
├── tree-processor.js       # Block ID assignment
└── client-script.js        # Browser JS for dropdown buttons
```

## Development

### Install Dependencies

```bash
npm install
```

### Test

```bash
npm test
```

### Build

No build step required - pure JavaScript ESM.

## Requirements

- **Node.js:** >= 20
- **Asciidoctor.js:** v4.0.8+ (native JavaScript, not Opal)

## Known Limitations

### Preamble Blocks
Blocks before the first section heading cannot receive IDs (Asciidoctor limitation).

**Workaround:** Start document with a section heading.

### Table Cells
Individual table cells cannot be addressed, only whole table structures.

**Workaround:** Use nested blocks inside cells (e.g., example blocks).

## Future Enhancements (v2.1+)

- Quote block IDs (currently excluded to avoid breaking changes)
- Data attributes for debugging (`data-asciidoc-block-type`, etc.)
- Antora integration for cross-site xrefs
- Per-file ID registries for large multi-file projects

## Contributing

Issues and pull requests welcome at:
https://github.com/pwright/asciidoc-comments

## License

ISC

## Credits

Built on [Asciidoctor.js](https://docs.asciidoctor.org/asciidoctor.js/) v4 (native JavaScript).
