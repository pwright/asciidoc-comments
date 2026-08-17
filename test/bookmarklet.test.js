import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

test('bookmarklet copies Markdown link and quoted selected text', async () => {
  const source = await readFile(new URL('../bookmarklet.js', import.meta.url), 'utf8')

  assert.match(source, /^javascript:\(async\(\)=>\{/)
  assert.doesNotThrow(() => new Function(`return ${source.replace(/^javascript:/, '')}`))
  assert.match(source, /\[\$\{title\}\]\(\$\{url\.href\}\)/)
  assert.match(source, /> \$\{line\}/)
  assert.doesNotMatch(source, /\[\$\{title\}\|\$\{url\.href\}\]/)
})

test('bookmarklet docs do not reference the old comment id format', async () => {
  const docs = await readFile(new URL('../docs/index.adoc', import.meta.url), 'utf8')

  assert.match(docs, /Copy Markdown link/)
  assert.doesNotMatch(docs, /CommentCapture/)
  assert.doesNotMatch(docs, /comment_\d+/)
})
