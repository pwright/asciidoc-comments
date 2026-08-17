import assert from 'node:assert/strict'
import { mkdir, mkdtemp, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import test from 'node:test'
import { convert, Extensions } from '@asciidoctor/core'
import { register, slugify } from '../add-id-processor.js'

async function render(source, options = {}, registerOptions = {}) {
  const registry = Extensions.create()
  register(registry, registerOptions)
  return convert(source, {
    extension_registry: registry,
    safe: 'unsafe',
    standalone: false,
    ...options,
  })
}

test('slugifies headings into stable id fragments', () => {
  assert.equal(slugify('Install & Configure'), 'install-configure')
  assert.equal(slugify('API: v4 AST'), 'api-v4-ast')
})

test('generates section-derived block ids and preserves author-provided ids', async () => {
  const html = await render(`
= Document

[#install]
== Install

First paragraph.

Second paragraph.

[#manual]
Manual paragraph.
`)

  assert.match(html, /id="install--block-1"/)
  assert.match(html, /id="install--block-2"/)
  assert.match(html, /id="manual"/)
  assert.doesNotMatch(html, /id="install--block-3"/)
})

test('suffixes generated ids when an author id already occupies the candidate', async () => {
  const html = await render(`
= Document

[#install]
== Install

[#install--block-1]
Existing paragraph.

Generated paragraph.
`)

  assert.match(html, /id="install--block-1"/)
  assert.match(html, /id="install--block-1--2"/)
})

test('can opt out for a block or the whole document', async () => {
  const blockHtml = await render(`
= Document

== Install

[semantic-id=false]
Skipped paragraph.

Indexed paragraph.
`)

  assert.doesNotMatch(blockHtml, /id="install--block-1"[^>]*>\s*Skipped paragraph/)
  assert.match(blockHtml, /id="install--block-1"[\s\S]*Indexed paragraph/)

  const docHtml = await render(`
= Document
:no-semantic-ids:

== Install

Paragraph.
`)

  assert.doesNotMatch(docHtml, /install--block/)
})

test('renders visible include boundary markers by default', async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'asciidoc-comments-'))
  await mkdir(path.join(dir, 'partials'))
  await writeFile(path.join(dir, 'partials', 'intro.adoc'), 'Included paragraph.\n')

  const html = await render(
    `
= Document

[#install]
== Install

include::partials/intro.adoc[]
`,
    { base_dir: dir },
  )

  assert.match(html, /<hr>\n<div id="install--include-1" class="include-boundary" style="margin-left: -40px;"><span style="color: red;">Start<\/span>: <code>partials\/intro.adoc<\/code><\/div>/)
  assert.match(html, /Included paragraph\.[\s\S]*<div class="include-boundary" style="margin-left: -40px;"><span style="color: red;">End<\/span>: <code>partials\/intro.adoc<\/code><\/div>\n<hr>/)
})

test('uses explicit heading ids for include-boundary bases before the AST exists', async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'asciidoc-comments-'))
  await writeFile(path.join(dir, 'intro.adoc'), 'Included paragraph.\n')

  const html = await render(
    `
= Document

[#custom-install]
== Install

include::intro.adoc[]
`,
    { base_dir: dir },
  )

  assert.match(html, /id="custom-install--include-1"[\s\S]*Included paragraph/)
})

test('can opt out of visible include boundary markers for a document', async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'asciidoc-comments-'))
  await writeFile(path.join(dir, 'intro.adoc'), 'Included paragraph.\n')

  const html = await render(
    `
= Document
:no-include-boundaries:

[#install]
== Install

include::intro.adoc[]
`,
    { base_dir: dir },
  )

  assert.doesNotMatch(html, /include-boundary/)
  assert.match(html, /id="install--include-1"[\s\S]*Included paragraph/)
})

test('can opt out of visible include boundary markers for one include', async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'asciidoc-comments-'))
  await writeFile(path.join(dir, 'intro.adoc'), 'Included paragraph.\n')

  const html = await render(
    `
= Document

[#install]
== Install

include::intro.adoc[include-boundary=false]
`,
    { base_dir: dir },
  )

  assert.doesNotMatch(html, /include-boundary/)
  assert.match(html, /id="install--include-1"[\s\S]*Included paragraph/)
})

test('renders attribute substitutions as buttons by default', async () => {
  const html = await render(`
= Document
:product: Widget

== Install

Use {product}.
`)

  assert.match(html, /Use <button type="button" class="attribute-substitution" data-attribute="product" data-value="Widget" title="product">Widget<\/button>\./)
})

test('renders unresolved attribute substitutions as buttons with attribute-name text', async () => {
  const html = await render(`
= Document

== Install

Use {missing}.
`)

  assert.match(html, /Use <button type="button" class="attribute-substitution" data-attribute="missing" data-value="missing" title="missing">missing<\/button>\./)
  assert.doesNotMatch(html, /\{missing\}/)
})

test('can opt out of attribute substitution buttons for a document', async () => {
  const html = await render(`
= Document
:product: Widget
:no-attribute-buttons:

== Install

Use {product}.
`)

  assert.match(html, /Use Widget\./)
  assert.doesNotMatch(html, /attribute-substitution/)
})

test('does not buttonize escaped attributes or delimited blocks', async () => {
  const html = await render(`
= Document
:product: Widget

== Install

Use \\{product}.

[source,asciidoc]
----
Use {product}.
----
`)

  assert.match(html, /Use \{product}\./)
  assert.match(html, /<code class="language-asciidoc" data-lang="asciidoc">Use \{product}\./)
  assert.doesNotMatch(html, /data-attribute="product">Widget<\/button>[\s\S]*language-asciidoc/)
})

test('attribute substitution buttons can offer configured alternative values', async () => {
  const html = await render(
    `
= Document
:product-short: Developer Hub

== Install

Use {product-short} with {product-short}.
`,
    {},
    {
      attributeOptions: {
        fields: {
          'product-short': {
            default: 'Developer Hub',
            options: ['podman', 'docker', 'kubernetes'],
          },
        },
      },
    },
  )

  assert.match(html, /data-attribute="product-short" data-value="Developer Hub" title="product-short">Developer Hub<\/button>/)
  assert.match(html, /const attributeOptions = \{"product-short":\{"default":"Developer Hub","options":\["podman","docker","kubernetes"\]\}\};/)
  assert.match(html, /setAttributeValue\(name, option\)/)
})

test('walks list items and nested list blocks', async () => {
  const html = await render(`
= Document

== Steps

* One
* Two
+
More about two.
`)

  assert.match(html, /<div id="steps--block-1" class="ulist">/)
  assert.match(html, /<li id="steps--block-2">/)
  assert.match(html, /<li id="steps--block-3">/)
  assert.match(html, /<div id="steps--block-4" class="paragraph">/)
})
