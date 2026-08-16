# Justfile Reference for @techwriter/asciidoc-comments

This project includes a comprehensive `justfile` with recipes for testing the v2.0.0 implementation against the 1,336 AsciiDoc files in `dist/test/`.

## Prerequisites

```bash
# Install just command runner
# On Fedora/RHEL: sudo dnf install just
# On Ubuntu: cargo install just
# Or see: https://github.com/casey/just

# Verify installation
just --version
```

## Quick Start

```bash
# List all available recipes
just

# Show statistics about test files
just stats

# Test conversion on a sample file
just test-sample

# Run all tests
just test
```

## Recipe Categories

### 📊 Information & Statistics

#### `stats`
Show statistics about AsciiDoc files in `dist/test/`
```bash
just stats
```
Output:
- Total files count
- Assemblies, modules, artifacts breakdown
- Assembly categories with file counts

#### `list-assembly-titles`
List all assembly titles by category
```bash
just list-assembly-titles
```

#### `extract-titles OUTPUT="titles.txt"`
Extract titles from all AsciiDoc files to a text file
```bash
just extract-titles                    # Default: titles.txt
just extract-titles my-titles.txt      # Custom output
```

#### `find-with-includes`
Find files containing `include::` directives (useful for boundary testing)
```bash
just find-with-includes
```

### 🔄 Single File Conversion

#### `convert FILE OUTPUT="output.html"`
Convert a single AsciiDoc file to HTML
```bash
just convert test-doc.adoc
just convert test-doc.adoc my-output.html
```

#### `convert-with-options FILE OPTIONS OUTPUT="output.html"`
Convert with attribute button configuration
```bash
just convert-with-options test-doc.adoc test-options.json output.html
```

### 📚 Titles (Master TOC Files)

The `dist/test/titles/` directory contains 36 master TOC files (one per category) that include assemblies and modules using `include::` directives.

#### `list-titles`
List all available title master.adoc files
```bash
just list-titles
```
Shows:
- Title directory name
- Document title (from `= Title` line)
- Number of include directives

#### `titles-stats`
Show statistics about titles
```bash
just titles-stats
```
Output:
- Total titles count (36)
- Breakdown by category prefix
- Total includes across all titles (322)

#### `analyze-title TITLE`
Analyze a specific title's include structure
```bash
just analyze-title configure_configuring-rhdh
just analyze-title extend_orchestrator-in-rhdh
```
Shows:
- Document title
- Include statistics (assemblies vs modules)
- Complete list of included files

#### `convert-title TITLE OUTPUT_DIR="build/titles"`
Convert a single title/master.adoc file
```bash
just convert-title configure_configuring-rhdh
just convert-title extend_orchestrator-in-rhdh build/my-titles
```

#### `convert-all-titles OUTPUT_DIR="build/titles"`
Convert ALL title master.adoc files
```bash
just convert-all-titles
```
**Note:** Processes 36 titles with ~322 includes

#### `compare-title TITLE`
Compare conversion with/without semantic IDs
```bash
just compare-title configure_configuring-rhdh
```
Generates two files:
- `build/compare/{TITLE}-with-ids.html`
- `build/compare/{TITLE}-no-ids.html`

Shows comparison of block ID counts and file sizes.

#### `test-titles-with-includes`
Test first 3 titles for include boundary generation
```bash
just test-titles-with-includes
```

#### `find-titles-by-category PREFIX`
Find titles matching a category prefix
```bash
just find-titles-by-category install
just find-titles-by-category extend
just find-titles-by-category configure
```

### 📁 Batch Conversion

#### `convert-assemblies CATEGORY OUTPUT_DIR="build/assemblies"`
Convert all assemblies in a specific category
```bash
just convert-assemblies configure_configuring-rhdh
just convert-assemblies extend_orchestrator-in-rhdh build/my-output
```

#### `convert-all-assemblies OUTPUT_DIR="build/assemblies"`
Convert ALL assemblies from all categories
```bash
just convert-all-assemblies
```
**Note:** Processes 140 files

#### `convert-modules CATEGORY OUTPUT_DIR="build/modules"`
Convert all modules in a specific category
```bash
just convert-modules configure_configuring-rhdh
```

#### `convert-all-modules OUTPUT_DIR="build/modules"`
Convert ALL modules from all categories
```bash
just convert-all-modules
```
**Note:** Processes 704 files

#### `convert-all`
Convert everything (assemblies + modules)
```bash
just convert-all
```
**Warning:** Processes 844 files - takes several minutes

### ✅ Verification & Testing

#### `verify-ids FILE`
Verify semantic IDs in a converted HTML file
```bash
just verify-ids build/test-sample.html
```
Shows:
- Sample block IDs
- Total block ID count
- Include boundary IDs

#### `count-ids FILE`
Count generated IDs by type
```bash
just count-ids build/test-sample.html
```
Output:
- Block IDs count
- Include IDs count
- Explicit IDs count

#### `test-sample`
Quick test on a sample assembly file
```bash
just test-sample
```
Generates: `build/test-sample.html`

#### `test-with-options`
Test attribute buttons with JSON configuration
```bash
just test-with-options
```
Uses: `test-options.json` and `test-doc.adoc`

#### `test-includes OUTPUT_DIR="build/with-includes"`
Test include boundary markers on files with includes
```bash
just test-includes
```
Processes first 10 files with `include::` directives

#### `test`
Run all test recipes
```bash
just test
```
Runs: `test-sample`, `test-with-options`, `test-includes`

### 📈 Performance

#### `benchmark COUNT="10"`
Benchmark conversion speed
```bash
just benchmark           # Default: 10 files
just benchmark 50        # Custom count
```
Output: Total time and average time per file

### 🛠️ Utilities

#### `install`
Install npm dependencies
```bash
just install
```

#### `clean`
Remove all build artifacts
```bash
just clean
```
Deletes:
- `build/` directory
- `test-output*.html` files

## Common Workflows

### Working with Titles (Master TOC Files)

```bash
# List all titles
just list-titles

# Show statistics
just titles-stats

# Analyze a specific title
just analyze-title configure_configuring-rhdh

# Convert a title with all its includes
just convert-title configure_configuring-rhdh

# Convert all titles
just convert-all-titles

# Compare with/without IDs
just compare-title extend_orchestrator-in-rhdh

# Find titles by category
just find-titles-by-category install
```

### Test Implementation on Real Files

```bash
# 1. Check statistics
just stats

# 2. Test on sample
just test-sample

# 3. Convert specific category
just convert-assemblies configure_configuring-rhdh

# 4. Verify IDs
just verify-ids build/assemblies/configure_configuring-rhdh/assembly-automate-environment-provisioning-with-predefined-operator-configurations.html
```

### Test Include Boundaries

```bash
# Find files with includes
just find-with-includes

# Convert and check boundaries
just test-includes

# Manual check
just convert dist/test/assemblies/configure_configuring-rhdh/assembly-configure-external-postgresql-databases.adoc build/test-include.html
grep "include-boundary" build/test-include.html
```

### Test Attribute Buttons

```bash
# Create custom options
cat > my-options.json << 'EOF'
{
  "version": 1,
  "fields": {
    "product": {
      "default": "Red Hat Developer Hub",
      "options": ["Red Hat Developer Hub", "RHDH", "Developer Hub"]
    },
    "product-short": {
      "default": "RHDH",
      "options": ["RHDH", "Developer Hub"]
    }
  }
}
EOF

# Convert with options
just convert-with-options dist/test/assemblies/configure_configuring-rhdh/assembly-rhdh-default-configuration.adoc my-options.json build/with-buttons.html

# Verify buttons
grep -c '<button.*attribute-substitution' build/with-buttons.html
```

### Performance Testing

```bash
# Benchmark small set
just benchmark 10

# Benchmark larger set
just benchmark 100

# Full conversion (all files)
time just convert-all
```

## File Structure After Running Recipes

```
asciidoc-comments/
├── build/                          # Generated by recipes
│   ├── titles/                     # From convert-title / convert-all-titles
│   │   ├── configure_configuring-rhdh.html
│   │   ├── extend_orchestrator-in-rhdh.html
│   │   └── ... (36 total)
│   ├── assemblies/                 # From convert-all-assemblies
│   │   ├── configure_configuring-rhdh/
│   │   ├── configure_customizing-rhdh/
│   │   └── ...
│   ├── modules/                    # From convert-all-modules
│   │   └── ...
│   ├── compare/                    # From compare-title
│   │   ├── {TITLE}-with-ids.html
│   │   └── {TITLE}-no-ids.html
│   ├── titles-test/                # From test-titles-with-includes
│   ├── with-includes/              # From test-includes
│   ├── test-sample.html            # From test-sample
│   └── test-with-options.html      # From test-with-options
├── titles.txt                      # From extract-titles
└── test-output*.html               # From manual testing
```

## Tips & Tricks

### Run Multiple Categories in Parallel

```bash
# Convert 3 categories concurrently
just convert-assemblies configure_configuring-rhdh &
just convert-assemblies configure_customizing-rhdh &
just convert-assemblies extend_orchestrator-in-rhdh &
wait
echo "✅ All done"
```

### Extract IDs from All Converted Files

```bash
# Convert a category
just convert-assemblies configure_configuring-rhdh

# Extract all IDs
find build/assemblies/configure_configuring-rhdh -name "*.html" -exec grep -oH 'id="[^"]*--block-[0-9]*"' {} \; > all-ids.txt

# Count unique ID patterns
cat all-ids.txt | cut -d'"' -f2 | cut -d'-' -f1-3 | sort -u | wc -l
```

### Find Files Without Semantic IDs

```bash
# Convert and check
just convert-assemblies configure_configuring-rhdh

# Find files with no block IDs
for f in build/assemblies/configure_configuring-rhdh/*.html; do
    count=$(grep -c 'id=".*--block-' "$f" 2>/dev/null || echo "0")
    if [ "$count" = "0" ]; then
        echo "No IDs: $f"
    fi
done
```

## Known Issues & Workarounds

### "level 0 sections" Errors

Many files (especially title master.adoc files) produce `ERROR: level 0 sections can only be used when doctype is book` warnings. These are filtered out in recipes and don't affect output. The titles are designed to be built with Pantheon's `ccutil` tool, not standalone asciidoctor.

### "include file not found" Errors

The `dist/test/` files reference includes with paths like `modules/configure_configuring-rhdh/...` which don't exist in this repo structure. The converter still works, but you'll see warnings. These are also filtered in recipes.

**Workaround:** For testing include boundaries specifically, use `test-includes` which handles this gracefully.

### Large Batch Conversions

`convert-all` processes 844 files and can take 5-10 minutes depending on your system.

**Tip:** Use `convert-assemblies <category>` or `convert-modules <category>` for faster targeted testing.

## Troubleshooting

### Recipe fails with exit code 141

This is usually from grep/head pipe issues. Recipes have been updated to handle this, but if you see it:

```bash
# Run with explicit error handling
bash -c "set +e; just test-sample; exit 0"
```

### Permission denied

Ensure index.js is executable:
```bash
chmod +x index.js
```

### Node version issues

Ensure Node.js >= 20:
```bash
node --version  # Should be v20.x or higher
```

## See Also

- `plan.md` - Full migration plan
- `IMPLEMENTATION_SUMMARY.md` - Feature verification
- `README.md` - User documentation
- `MIGRATION_COMPLETE.md` - Implementation status
