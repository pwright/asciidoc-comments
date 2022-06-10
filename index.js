#!/usr/bin/env node

const myArgs = process.argv.slice(2);
const asciidoctor = require('asciidoctor')()
const registry = asciidoctor.Extensions.create()
require('./add-id-processor.js')(registry)

const doc = asciidoctor.convertFile(myArgs[0], { 'extension_registry': registry })
