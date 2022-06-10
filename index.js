const asciidoctor = require('asciidoctor')()
const registry = asciidoctor.Extensions.create()
require('./add-id-processor.js')(registry)

const doc = asciidoctor.convertFile(process.argv[1], { 'extension_registry': registry })
