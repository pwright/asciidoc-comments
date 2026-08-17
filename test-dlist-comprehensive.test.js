import { convert, Extensions } from '@asciidoctor/core'
import assert from 'node:assert'
import test from 'node:test'
import { register } from './add-id-processor.js'

async function render(input) {
  const registry = Extensions.create()
  register(registry)
  return await convert(input, {
    extension_registry: registry,
    safe: 'unsafe',
    standalone: false,
  })
}

test('dlist with auto-generated ID gets term IDs', async () => {
  const html = await render(`
= Test

== Configuration

server::
  The server name
port::
  The port number
`)

  // Dlist wrapper should have auto-generated ID
  assert.match(html, /<div id="configuration--block-1" class="dlist">/)

  // Terms should have IDs
  assert.match(html, /<dt id="configuration--block-1-term-1"/)
  assert.match(html, /<dt id="configuration--block-1-term-2"/)

  // Descriptions should NOT have IDs
  assert.doesNotMatch(html, /<dd id=/)
})

test('dlist with explicit ID does NOT get term IDs', async () => {
  const html = await render(`
= Test

[#my-dlist]
term one::
  definition one
term two::
  definition two
`)

  // Dlist wrapper should have explicit ID
  assert.match(html, /<div id="my-dlist" class="dlist">/)

  // Terms should NOT have IDs (only auto-generated dlists get term IDs)
  assert.doesNotMatch(html, /<dt id="my-dlist-term-/)
  assert.doesNotMatch(html, /<dt id=/)
})

test('dlist with semantic-id=false opts out', async () => {
  const html = await render(`
= Test

[semantic-id=false]
term::
  definition
`)

  // Should not have any IDs
  assert.doesNotMatch(html, /<div id=.*class="dlist"/)
  assert.doesNotMatch(html, /<dt id=/)
})

test('multiple dlists in different sections', async () => {
  const html = await render(`
= Test

== First Section

term1::
  def1

== Second Section

term2::
  def2
term3::
  def3
`)

  // First section dlist
  assert.match(html, /<div id="first-section--block-1" class="dlist">/)
  assert.match(html, /<dt id="first-section--block-1-term-1"/)

  // Second section dlist
  assert.match(html, /<div id="second-section--block-1" class="dlist">/)
  assert.match(html, /<dt id="second-section--block-1-term-1"/)
  assert.match(html, /<dt id="second-section--block-1-term-2"/)
})

test('dlist is added to eligible contexts alongside other list types', async () => {
  const html = await render(`
= Test

== Section One

. Ordered list item

== Section Two

* Unordered list item

== Section Three

term::
  definition
`)

  // All list types should get IDs in their respective sections
  assert.match(html, /<div id="section-one--block-1" class="olist/)
  assert.match(html, /<div id="section-two--block-1" class="ulist/)
  assert.match(html, /<div id="section-three--block-1" class="dlist/)
})
