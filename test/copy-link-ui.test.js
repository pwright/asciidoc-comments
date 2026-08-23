import assert from 'node:assert/strict'
import test from 'node:test'
import { convert, Extensions } from '@asciidoctor/core'
import { register } from '../add-id-processor.js'
import { parseArgs } from '../index.js'
import { compactUrlPreview, markdownLinkPayload } from '../render-enhancements.js'

async function render(source, registerOptions = {}) {
  const registry = Extensions.create()
  register(registry, registerOptions)
  return convert(source, {
    extension_registry: registry,
    safe: 'unsafe',
    standalone: false,
  })
}

test('renders copy link UI by default', async () => {
  const html = await render(`
= Document

== Install

Select this paragraph.
`)

  assert.match(html, /class="floating-footer"/)
  assert.match(html, /class="copy-link-button"/)
  assert.match(html, /id="copy-link-status"/)
  assert.match(html, /id="copy-link-url"/)
  assert.match(html, /data-copy-placement="margin"/)
  assert.doesNotMatch(html, /<span>Copy<\/span>/)
  assert.match(html, /Toggle IDs/)
  assert.match(html, /GitHub/)
})

test('document attribute disables only copy link UI', async () => {
  const html = await render(`
= Document
:no-copy-link-ui:

== Install

Select this paragraph.
`)

  assert.match(html, /class="floating-footer"/)
  assert.match(html, /Toggle IDs/)
  assert.match(html, /GitHub/)
  assert.doesNotMatch(html, /class="copy-link-button"/)
  assert.doesNotMatch(html, /id="copy-link-status"/)
  assert.doesNotMatch(html, /data-copy-placement="margin"/)
})

test('register option disables only copy link UI', async () => {
  const html = await render(`
= Document

== Install

Select this paragraph.
`, { copyLinkUi: false })

  assert.match(html, /class="floating-footer"/)
  assert.match(html, /Toggle IDs/)
  assert.match(html, /GitHub/)
  assert.doesNotMatch(html, /class="copy-link-button"/)
})

test('builds bookmarklet-compatible Markdown payloads', () => {
  assert.equal(
    markdownLinkPayload({
      title: 'A [draft] \\ title',
      href: 'https://example.com/page.html?mode=demo#old',
      targetId: 'install--block-1',
      selectedText: 'first line\nsecond line',
    }),
    '[A \\[draft\\] \\\\ title](https://example.com/page.html?mode=demo#install--block-1)\n\n> first line\n> second line',
  )
})

test('omits quote block when there is no selected text', () => {
  assert.equal(
    markdownLinkPayload({
      title: 'Document',
      href: 'https://example.com/page.html',
      targetId: 'install--block-1',
      selectedText: '',
    }),
    '[Document](https://example.com/page.html#install--block-1)',
  )
})

test('compacts URL preview while preserving the hash target', () => {
  assert.equal(
    compactUrlPreview('https://example.com/docs/index.html?mode=demo#install--block-1'),
    'e.c/d/i?mode=demo#install--block-1',
  )
})

test('CLI parser maps copy link UI opt-out', () => {
  assert.deepEqual(
    parseArgs(['--no-copy-link-ui', '--one-level-includes', 'docs/index.adoc']),
    {
      file: 'docs/index.adoc',
      attributeAddFile: null,
      masterAttributesFile: null,
      oneLevelIncludes: true,
      copyLinkUi: false,
    },
  )
})
