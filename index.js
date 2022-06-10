const asciidoctor = require('asciidoctor')()
const registry = asciidoctor.Extensions.create()
require('./add-id-processor.js')(registry)

const doc = asciidoctor.convertFile('test.adoc', { 'extension_registry': registry })
