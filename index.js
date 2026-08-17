#!/usr/bin/env node

import { readFileSync, realpathSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { convertFile, Extensions } from '@asciidoctor/core'
import { register } from './add-id-processor.js'

export { register }
export { default } from './add-id-processor.js'

async function main() {
  const { file, attributeOptionsFile, oneLevelIncludes } = parseArgs(process.argv.slice(2))
  if (!file) {
    console.error('Usage: asciidoc-comments [--attribute-options options.json] [--one-level-includes] <file.adoc>')
    process.exitCode = 1
    return
  }

  const attributeOptions = attributeOptionsFile ? readJson(attributeOptionsFile) : null
  const registry = Extensions.create()
  register(registry, { attributeOptions, oneLevelIncludes })
  const output = await convertFile(file, {
    extension_registry: registry,
    safe: 'unsafe',
    standalone: true,
    to_file: false,
  })

  if (typeof output === 'string') process.stdout.write(output)
}

function parseArgs(args) {
  const result = {
    file: null,
    attributeOptionsFile: null,
    oneLevelIncludes: false,
  }

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index]
    if (arg === '--attribute-options') {
      result.attributeOptionsFile = args[index + 1]
      index += 1
    } else if (arg.startsWith('--attribute-options=')) {
      result.attributeOptionsFile = arg.slice('--attribute-options='.length)
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
