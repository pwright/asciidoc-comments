import { convert, load } from '@asciidoctor/core'
import test from 'node:test'

test('inspect dlist structure', () => {
  const doc = load(`
= Test

term one::
  definition for term one
term two::
  definition for term two
`)

  function inspect(node, depth = 0) {
    const indent = '  '.repeat(depth)
    const context = node.getContext ? node.getContext() : 'unknown'
    const id = node.getId ? node.getId() : null
    console.log(`${indent}context="${context}" id="${id}"`)
    
    if (node.getBlocks) {
      const blocks = node.getBlocks()
      console.log(`${indent}  blocks.length=${blocks.length}`)
      for (const block of blocks) {
        inspect(block, depth + 1)
      }
    }
    
    if (node.getItems) {
      console.log(`${indent}  [has getItems()]`)
      const items = node.getItems()
      console.log(`${indent}  items.length=${items.length}`)
      for (let i = 0; i < items.length; i++) {
        const item = items[i]
        console.log(`${indent}  item[${i}]:`, Array.isArray(item) ? 'array' : typeof item)
        if (Array.isArray(item)) {
          console.log(`${indent}    length=${item.length}`)
          if (item[0]) {
            console.log(`${indent}    [0] (terms):`, item[0])
            if (Array.isArray(item[0])) {
              for (const term of item[0]) {
                const termText = term.getText ? term.getText() : String(term)
                const termContext = term.getContext ? term.getContext() : 'n/a'
                console.log(`${indent}      term: "${termText}" context="${termContext}"`)
              }
            }
          }
          if (item[1]) {
            const descContext = item[1].getContext ? item[1].getContext() : 'n/a'
            console.log(`${indent}    [1] (desc): context="${descContext}"`)
          }
        }
      }
    }
  }

  inspect(doc)
  
  const html = convert(doc, { safe: 'unsafe', standalone: false })
  console.log('\n--- HTML ---')
  console.log(html)
})
