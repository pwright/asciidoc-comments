#!/usr/bin/env node

import { readFileSync, realpathSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { convertFile, Extensions } from '@asciidoctor/core'
import { register } from './add-id-processor.js'

export { register }
export { default } from './add-id-processor.js'

async function main() {
  const { file, attributeAddFile, masterAttributesFile, oneLevelIncludes } = parseArgs(process.argv.slice(2))
  if (!file) {
    console.error('Usage: asciidoc-comments [--attribute-add options.json] [--master-attributes master.adoc] [--one-level-includes] <file.adoc>')
    process.exitCode = 1
    return
  }

  // Extract attributes from master.adoc at the inclusion point
  const masterAttributes = masterAttributesFile
    ? extractAttributesAtInclusion(masterAttributesFile, file)
    : {}

  // Load alternative values for UI dropdowns
  const attributeOptions = attributeAddFile
    ? (attributeAddFile.endsWith('.adoc')
        ? parseAttributeAlternatives(attributeAddFile)
        : readJson(attributeAddFile))
    : null

  const registry = Extensions.create()
  register(registry, { attributeOptions, oneLevelIncludes })
  const output = await convertFile(file, {
    extension_registry: registry,
    attributes: { doctype: 'book', ...masterAttributes },
    safe: 'unsafe',
    standalone: true,
    to_file: false,
  })

  if (typeof output === 'string') process.stdout.write(output)
}

function parseArgs(args) {
  const result = {
    file: null,
    attributeAddFile: null,
    masterAttributesFile: null,
    oneLevelIncludes: false,
  }

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index]
    if (arg === '--attribute-add') {
      result.attributeAddFile = args[index + 1]
      index += 1
    } else if (arg.startsWith('--attribute-add=')) {
      result.attributeAddFile = arg.slice('--attribute-add='.length)
    } else if (arg === '--master-attributes') {
      result.masterAttributesFile = args[index + 1]
      index += 1
    } else if (arg.startsWith('--master-attributes=')) {
      result.masterAttributesFile = arg.slice('--master-attributes='.length)
    } else if (arg === '--one-level-includes') {
      result.oneLevelIncludes = true
    } else if (!result.file) {
      result.file = arg
    }
  }

  return result
}

function readJson(file) {
  return JSON.parse(readFileSync(file, 'utf8'))
}

function parseAttributeAlternatives(adocFile) {
  const content = readFileSync(adocFile, 'utf8')
  const attributeValues = {}

  // Match :attrname: value
  const attrRegex = /^:([^:]+):\s*(.+)$/gm

  let match
  while ((match = attrRegex.exec(content)) !== null) {
    const [, name, value] = match

    if (!attributeValues[name]) {
      attributeValues[name] = []
    }
    attributeValues[name].push(value.trim())
  }

  // Convert to attribute options format
  const fields = {}
  for (const [name, values] of Object.entries(attributeValues)) {
    if (values.length > 0) {
      fields[name] = {
        default: values[0],  // first definition is default
        options: values       // all definitions as options
      }
    }
  }

  return { version: 1, fields }
}

function extractAttributesAtInclusion(masterFile, targetFile) {
  const content = readFileSync(masterFile, 'utf8')
  const lines = content.split('\n')
  const attributes = {}
  const targetBasename = targetFile.split('/').pop()

  for (const line of lines) {
    // Track attribute definitions: :attrname: value
    const attrMatch = line.match(/^:([^:]+):\s*(.*)$/)
    if (attrMatch) {
      const [, name, value] = attrMatch
      // Skip special attributes (ending with !)
      if (!name.endsWith('!')) {
        attributes[name] = value.trim()
      }
      continue
    }

    // Check for include directive matching target file
    const includeMatch = line.match(/^include::(.+?)(?:\[.*\])?$/)
    if (includeMatch) {
      const includePath = includeMatch[1]
      const includeBasename = includePath.split('/').pop()

      // If this is our target file, return current attribute state
      if (includeBasename === targetBasename || includePath === targetFile) {
        return attributes
      }
    }
  }

  // If target file not found in includes, return all attributes from master
  return attributes
}

function isCliEntryPoint() {
  if (!process.argv[1]) return false
  return realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)
}

if (isCliEntryPoint()) {
  main().catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
}
