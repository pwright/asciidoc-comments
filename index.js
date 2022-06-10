const asciidoctor = require('asciidoctor')()
const registry = asciidoctor.Extensions.create()
require('./gdpr-tree-processor.js')(registry)

const doc = asciidoctor.convertFile('README.adoc', { 'extension_registry': registry })
console.log(doc.getBlocks()[0].getSource()) // 'GDPR compliant :)'