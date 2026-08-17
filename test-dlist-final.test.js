import { convert, Extensions } from '@asciidoctor/core'
import test from 'node:test'
import { register } from './add-id-processor.js'

test('dlist with semantic IDs', async () => {
  const registry = Extensions.create()
  register(registry)
  
  const html = await convert(`
= Test

== Section

term one::
  definition for term one
term two::
  definition for term two
`, {
    extension_registry: registry,
    safe: 'unsafe',
    standalone: false
  })

  console.log('--- HTML OUTPUT ---')
  console.log(html)
  console.log('--- END ---')
  
  // Check if dlist has ID
  console.log('Has dlist with ID?', html.includes('<div id=') && html.includes('class="dlist"'))
  console.log('Has dt with ID?', html.includes('<dt id='))
  console.log('Has dd with ID?', html.includes('<dd id='))
})
