import { convert, load } from '@asciidoctor/core'
import test from 'node:test'

test('simple dlist AST check', () => {
  const doc = load(`
= Test

== Section

term one::
  definition for term one
`)

  console.log('doc type:', typeof doc)
  console.log('doc.getBlocks:', typeof doc.getBlocks)
  
  const blocks = doc.getBlocks()
  console.log('blocks.length:', blocks.length)
  
  if (blocks.length > 0) {
    const section = blocks[0]
    console.log('section context:', section.getContext())
    console.log('section id:', section.getId())
    
    const sectionBlocks = section.getBlocks()
    console.log('section blocks.length:', sectionBlocks.length)
    
    if (sectionBlocks.length > 0) {
      const dlist = sectionBlocks[0]
      console.log('dlist context:', dlist.getContext())
      console.log('dlist has getItems:', typeof dlist.getItems)
      
      if (dlist.getItems) {
        const items = dlist.getItems()
        console.log('dlist items.length:', items.length)
        console.log('item[0] is array:', Array.isArray(items[0]))
        
        if (Array.isArray(items[0])) {
          console.log('item[0].length:', items[0].length)
          console.log('item[0][0] (terms):', items[0][0])
          console.log('item[0][1] (desc) context:', items[0][1]?.getContext?.())
        }
      }
    }
  }
})
