#!/usr/bin/env node

/**
 * @techwriter/asciidoc-comments v2.0.0
 * Render AsciiDoc to HTML with semantic block IDs, include boundaries, and interactive attribute buttons
 */

import { convert, Extensions } from '@asciidoctor/core';
import { readFile, writeFile } from 'fs/promises';
import { resolve } from 'path';
import { createTreeProcessor } from './lib/tree-processor.js';
import { createPreprocessor } from './lib/preprocessor.js';
import { injectClientScript } from './lib/client-script.js';

async function main() {
  const args = process.argv.slice(2);

  // Parse CLI arguments
  const options = parseArgs(args);

  if (options.help) {
    showHelp();
    process.exit(0);
  }

  if (options.version) {
    console.log('2.0.0');
    process.exit(0);
  }

  if (!options.input) {
    console.error('Error: No input file specified');
    showHelp();
    process.exit(1);
  }

  try {
    // Load attribute options if provided
    let attributeOptions = {};
    if (options.attributeOptionsPath) {
      const optionsContent = await readFile(options.attributeOptionsPath, 'utf-8');
      attributeOptions = JSON.parse(optionsContent);
    }

    // Read input file
    const inputPath = resolve(options.input);
    const content = await readFile(inputPath, 'utf-8');

    // Create extension registry
    const registry = Extensions.create();

    // Register preprocessor (include boundaries + attribute buttons)
    createPreprocessor(registry, { attributeOptions });

    // Register tree processor (semantic IDs)
    createTreeProcessor(registry);

    // Set document attributes based on CLI flags
    const attributes = {};

    if (options.noSemanticIds) {
      attributes['no-semantic-ids'] = '';
    }

    if (options.noIncludeBoundaries) {
      attributes['no-include-boundaries'] = '';
    }

    if (options.noAttributeButtons) {
      attributes['no-attribute-buttons'] = '';
    }

    // Convert document (async in v4)
    const html = await convert(content, {
      extension_registry: registry,
      safe: 'unsafe',
      standalone: true,
      attributes
    });

    // Inject client script if attribute buttons are enabled
    let finalHtml = html;
    if (!options.noAttributeButtons && options.attributeOptionsPath) {
      finalHtml = injectScriptIntoHtml(html, injectClientScript());
    }

    // Output
    if (options.output) {
      await writeFile(options.output, finalHtml, 'utf-8');
      console.log(`Output written to: ${options.output}`);
    } else {
      console.log(finalHtml);
    }
  } catch (error) {
    console.error('Error:', error.message);
    if (process.env.DEBUG) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

function parseArgs(args) {
  const options = {
    input: null,
    output: null,
    attributeOptionsPath: null,
    noSemanticIds: false,
    noIncludeBoundaries: false,
    noAttributeButtons: false,
    help: false,
    version: false
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    switch (arg) {
      case '--attribute-options':
        options.attributeOptionsPath = args[++i];
        break;
      case '--no-semantic-ids':
        options.noSemanticIds = true;
        break;
      case '--no-include-boundaries':
        options.noIncludeBoundaries = true;
        break;
      case '--no-attribute-buttons':
        options.noAttributeButtons = true;
        break;
      case '--output':
      case '-o':
        options.output = args[++i];
        break;
      case '--help':
      case '-h':
        options.help = true;
        break;
      case '--version':
      case '-v':
        options.version = true;
        break;
      default:
        if (!arg.startsWith('--') && !options.input) {
          options.input = arg;
        }
        break;
    }
  }

  return options;
}

function showHelp() {
  console.log(`
Usage: asciidoc-comments [options] <input.adoc>

Options:
  --attribute-options <path>    JSON config for attribute value options
  --no-semantic-ids             Disable automatic ID generation
  --no-include-boundaries       Disable include boundary markers
  --no-attribute-buttons        Disable attribute button transformation
  --output, -o <path>          Write output to file
  --help, -h                   Show this help message
  --version, -v                Show version number

Examples:
  asciidoc-comments document.adoc
  asciidoc-comments --attribute-options config.json document.adoc -o output.html
  asciidoc-comments --no-semantic-ids document.adoc
`);
}

function injectScriptIntoHtml(html, script) {
  // Inject before </body> or at end if no </body>
  if (html.includes('</body>')) {
    return html.replace('</body>', script + '\n</body>');
  } else {
    return html + '\n' + script;
  }
}

main();
