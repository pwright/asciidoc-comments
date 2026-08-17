# @techwriter/asciidoc-comments

Render AsciiDoc to HTML with semantic block IDs, include boundaries, and interactive attribute buttons.

Generated IDs are scoped to the nearest section and the block position inside
that section:

```text
install--block-1
install--block-2
install--include-1
```

Author-provided IDs always win. Generated collisions are suffixed:

```text
install--block-1--2
```

## Install

```bash
npm install @techwriter/asciidoc-comments
```

To install the command directly from a clone on Linux or macOS:

```bash
git clone https://github.com/pwright/asciidoc-comments.git
cd asciidoc-comments
npm install --global .
```

Then run:

```bash
asciidoc-comments <filename>.adoc
```

With `just` installed, the same local install command is:

```bash
just install-global
```

## Use as an extension

```js
import { convertFile, Extensions } from '@asciidoctor/core'
import { register } from '@techwriter/asciidoc-comments'

const registry = Extensions.create()
register(registry)

const html = await convertFile('document.adoc', {
  extension_registry: registry,
  safe: 'unsafe',
  standalone: true,
  to_file: false,
})
```

## Use the CLI

```bash
asciidoc-comments <filename>.adoc
```

To enable alternative values for attribute buttons, pass an options file:

```bash
asciidoc-comments --attribute-options rhdh-test.json <filename>.adoc
```

## Bookmarklet

The bookmarklet in [bookmarklet.js](bookmarklet.js) copies a Markdown link to
the nearest block ID. If text is selected, it appends the selected text as a
Markdown quote:

```markdown
[Page title](https://example.com/page.html#install--block-1)

> selected text
```

Create a browser bookmark whose URL is the contents of `bookmarklet.js`.

## Opt out

Disable generated IDs for a document:

```asciidoc
:no-semantic-ids:
```

Disable generated IDs for one block:

```asciidoc
[semantic-id=false]
This block keeps no generated ID.
```

## Attribute substitutions

Attribute references render as buttons by default:

```asciidoc
:product: Widget

Use {product}.
```

The rendered output includes:

```html
Use <button type="button" class="attribute-substitution" data-attribute="product" data-value="Widget" title="product">Widget</button>.
```

If an attribute has no resolved value, the button displays the attribute name.

Disable attribute substitution buttons for a document:

```asciidoc
:no-attribute-buttons:
```

To offer alternative values when a reader clicks an attribute button, define the
values in a JSON file:

```json
{
  "version": 1,
  "fields": {
    "product-short": {
      "default": "Developer Hub",
      "options": ["podman", "docker", "kubernetes"]
    }
  }
}
```

Then render with:

```bash
asciidoc-comments --attribute-options rhdh-test.json <filename>.adoc
```

Clicking any `product-short` button opens the configured list. Choosing a value
updates every `product-short` button on the page to the same value.

## Include boundaries

Include directives get visible boundary markers by default. The start marker
gets a semantic boundary ID, and both markers show the include target exactly as
it appears in the source:

```asciidoc
[#install]
== Install

include::partials/setup.adoc[]
```

The rendered output includes markers like:

```html
<hr>
<div id="install--include-1" class="include-boundary">Start include: <code>partials/setup.adoc</code></div>
...
<div class="include-boundary">End include: <code>partials/setup.adoc</code></div>
<hr>
```

Disable visible include boundary markers for a document:

```asciidoc
:no-include-boundaries:
```

Disable visible include boundary markers for one include:

```asciidoc
include::partials/setup.adoc[include-boundary=false]
```

When visible markers are disabled, the processor still inserts an invisible
semantic boundary ID before the include so the first rendered block from the
include remains addressable as `install--include-1`.

### Nested includes

By default, include boundaries are rendered **recursively for all nested includes**.
For example, if `master.adoc` includes `chapter.adoc`, which itself includes
`section.adoc`, both include directives will get boundary markers.

This is implemented using an `includeProcessor` that reads and wraps each include
file's content before passing it back to Asciidoctor for further processing.

**Limitations:**

- The processor bypasses Asciidoctor's built-in include resolution, so advanced
  include directive attributes like `tag`, `tags`, `lines`, and `indent` are
  **not currently supported**.
- Only basic file includes work. Includes with line filtering or tag selection
  will include the entire file.

### One-level includes mode

For simpler use cases or when you need Asciidoctor's full include directive
support, use `--one-level-includes`:

```bash
asciidoc-comments --one-level-includes <filename>.adoc
```

This uses a preprocessor-based approach that:
- ✅ Only renders boundaries for **top-level includes** (includes in the main document)
- ✅ Fully supports all Asciidoctor include directive attributes (`tag`, `tags`, `lines`, etc.)
- ❌ Does **not** render boundaries for nested includes (includes within included files)

**When to use `--one-level-includes`:**
- You need `tag`, `tags`, `lines`, or other advanced include directive features
- Your documentation structure is flat (no nested includes)
- You only care about top-level assembly boundaries, not module-level nesting
