# justfile for @techwriter/asciidoc-comments testing with dist/test/ files
# Provides recipes to convert AsciiDoc files and verify semantic ID generation

# Default recipe - show available commands
default:
    @just --list

# Convert a single AsciiDoc file to HTML
convert FILE OUTPUT="output.html":
    #!/usr/bin/env bash
    mkdir -p "$(dirname {{OUTPUT}})"
    node index.js "{{FILE}}" > "{{OUTPUT}}"
    echo "✅ Converted {{FILE}} → {{OUTPUT}}"

# Convert with attribute options
convert-with-options FILE OPTIONS OUTPUT="output.html":
    node index.js --attribute-options "{{OPTIONS}}" "{{FILE}}" > "{{OUTPUT}}"
    @echo "✅ Converted {{FILE}} with options → {{OUTPUT}}"

# Convert all assembly files in a specific directory
convert-assemblies CATEGORY OUTPUT_DIR="build/assemblies":
    #!/usr/bin/env bash
    set -euo pipefail
    mkdir -p "{{OUTPUT_DIR}}/{{CATEGORY}}"
    count=0
    for file in dist/test/assemblies/{{CATEGORY}}/*.adoc; do
        if [ -f "$file" ]; then
            basename=$(basename "$file" .adoc)
            node index.js "$file" > "{{OUTPUT_DIR}}/{{CATEGORY}}/${basename}.html" 2>&1 || echo "⚠️  Failed: $file"
            count=$((count + 1))
        fi
    done
    echo "✅ Converted $count files from {{CATEGORY}}"

# Convert all assemblies (all categories)
convert-all-assemblies OUTPUT_DIR="build/assemblies":
    #!/usr/bin/env bash
    set -euo pipefail
    for category in dist/test/assemblies/*/; do
        if [ -d "$category" ]; then
            cat_name=$(basename "$category")
            echo "📁 Processing category: $cat_name"
            just convert-assemblies "$cat_name" "{{OUTPUT_DIR}}"
        fi
    done

# Convert all module files in a specific directory
convert-modules CATEGORY OUTPUT_DIR="build/modules":
    #!/usr/bin/env bash
    set -euo pipefail
    mkdir -p "{{OUTPUT_DIR}}/{{CATEGORY}}"
    count=0
    for file in dist/test/modules/{{CATEGORY}}/*.adoc; do
        if [ -f "$file" ]; then
            basename=$(basename "$file" .adoc)
            node index.js "$file" > "{{OUTPUT_DIR}}/{{CATEGORY}}/${basename}.html" 2>&1 || echo "⚠️  Failed: $file"
            count=$((count + 1))
        fi
    done
    echo "✅ Converted $count modules from {{CATEGORY}}"

# Convert all modules (all categories)
convert-all-modules OUTPUT_DIR="build/modules":
    #!/usr/bin/env bash
    set -euo pipefail
    for category in dist/test/modules/*/; do
        if [ -d "$category" ]; then
            cat_name=$(basename "$category")
            echo "📁 Processing category: $cat_name"
            just convert-modules "$cat_name" "{{OUTPUT_DIR}}"
        fi
    done

# Convert everything (assemblies + modules)
convert-all: convert-all-assemblies convert-all-modules
    @echo "✅ All files converted"

# Convert all with interactive attribute buttons (demo feature)
convert-all-demo:
    #!/usr/bin/env bash
    set -euo pipefail
    echo "📁 Converting with attribute buttons enabled..."
    just convert-assemblies-with-options configure_configuring-rhdh rhdh-test.json build/demo/assemblies
    echo "✅ Demo conversion complete - check build/demo/ for interactive buttons"

# Convert assemblies with attribute options
convert-assemblies-with-options CATEGORY OPTIONS OUTPUT_DIR="build/assemblies":
    #!/usr/bin/env bash
    set -euo pipefail
    mkdir -p "{{OUTPUT_DIR}}/{{CATEGORY}}"
    count=0
    for file in dist/test/assemblies/{{CATEGORY}}/*.adoc; do
        if [ -f "$file" ]; then
            basename=$(basename "$file" .adoc)
            node index.js --attribute-options "{{OPTIONS}}" "$file" > "{{OUTPUT_DIR}}/{{CATEGORY}}/${basename}.html" 2>&1 || echo "⚠️  Failed: $file"
            count=$((count + 1))
        fi
    done
    echo "✅ Converted $count files with attribute options from {{CATEGORY}}"

# Extract titles from all AsciiDoc files
extract-titles OUTPUT="titles.txt":
    #!/usr/bin/env bash
    set -euo pipefail
    echo "# Document Titles from dist/test/" > "{{OUTPUT}}"
    echo "# Generated: $(date)" >> "{{OUTPUT}}"
    echo "" >> "{{OUTPUT}}"

    for file in dist/test/**/*.adoc; do
        if [ -f "$file" ]; then
            # Extract title (first line starting with =)
            title=$(head -20 "$file" | grep -m1 '^=' | sed 's/^=* *//' || echo "No title")
            echo "$file: $title" >> "{{OUTPUT}}"
        fi
    done

    echo "✅ Extracted titles to {{OUTPUT}}"
    wc -l "{{OUTPUT}}"

# List all assembly titles
list-assembly-titles:
    #!/usr/bin/env bash
    echo "Assembly Titles:"
    echo "================"
    for file in dist/test/assemblies/**/*.adoc; do
        if [ -f "$file" ]; then
            title=$(head -20 "$file" | grep -m1 '^=' | sed 's/^=* *//' || echo "No title")
            category=$(basename $(dirname "$file"))
            basename=$(basename "$file" .adoc)
            echo "[$category] $basename: $title"
        fi
    done

# Verify semantic IDs in a converted file
verify-ids FILE:
    #!/usr/bin/env bash
    set +e  # Don't exit on pipe errors
    if [ ! -f "{{FILE}}" ]; then
        echo "❌ File not found: {{FILE}}"
        exit 1
    fi

    echo "Semantic IDs in {{FILE}}:"
    echo "========================="
    grep -oE 'id="[^"]*--block-[0-9]+"' "{{FILE}}" 2>/dev/null | sort -u | head -10
    count=$(grep -c 'id=".*--block-' "{{FILE}}" 2>/dev/null || echo "0")
    echo "Total block IDs: $count"
    echo ""
    echo "Include boundaries:"
    echo "==================="
    grep -oE 'id="[^"]*--include-[0-9]+"' "{{FILE}}" 2>/dev/null | head -5 || echo "No include boundaries found"
    exit 0  # Always succeed

# Count generated IDs in a file
count-ids FILE:
    @echo "ID Statistics for {{FILE}}:"
    @echo "Block IDs: $(grep -c 'id=".*--block-' {{FILE}} || echo 0)"
    @echo "Include IDs: $(grep -c 'id=".*--include-' {{FILE}} || echo 0)"
    @echo "Explicit IDs: $(grep -c 'id="[^"]*"' {{FILE}} | awk '{print $$1 - $(grep -c "id=\".*--block-\\|id=\".*--include-" {{FILE}} || echo 0)}')"

# Test conversion on a sample assembly
test-sample:
    #!/usr/bin/env bash
    set -e
    mkdir -p build

    # Pick first available assembly
    sample="dist/test/assemblies/configure_configuring-rhdh/assembly-automate-environment-provisioning-with-predefined-operator-configurations.adoc"

    echo "Testing with: $sample"
    node index.js "$sample" -o build/test-sample.html 2>/dev/null || true

    if [ -f build/test-sample.html ]; then
        count=$(grep -c 'id=".*--block-' build/test-sample.html 2>/dev/null || echo "0")
        echo "✅ Generated $count semantic IDs"
        echo "Sample IDs:"
        grep -oE 'id="[^"]*--block-[0-9]+"' build/test-sample.html 2>/dev/null | head -5 || echo "  (none found)"
        echo ""
        echo "✅ Test complete - output: build/test-sample.html"
    else
        echo "❌ Conversion failed"
        exit 1
    fi

# Test with attribute options
test-with-options:
    node index.js --attribute-options test-options.json test-doc.adoc -o build/test-with-options.html
    @echo "✅ Testing attribute buttons"
    @grep -c '<button.*attribute-substitution' build/test-with-options.html && echo "Buttons found" || echo "No buttons"

# Clean build artifacts
clean:
    rm -rf build/
    rm -f test-output*.html
    @echo "✅ Cleaned build artifacts"

# Statistics about dist/test files
stats:
    #!/usr/bin/env bash
    echo "📊 dist/test/ Statistics"
    echo "======================="
    echo "Total .adoc files: $(find dist/test -name '*.adoc' | wc -l)"
    echo "Assemblies: $(find dist/test/assemblies -name '*.adoc' | wc -l)"
    echo "Modules: $(find dist/test/modules -name '*.adoc' | wc -l)"
    echo "Artifacts: $(find dist/test/artifacts -name '*.adoc' | wc -l)"
    echo ""
    echo "Assembly categories:"
    find dist/test/assemblies -mindepth 1 -maxdepth 1 -type d | while read dir; do
        count=$(find "$dir" -name '*.adoc' | wc -l)
        echo "  $(basename $dir): $count files"
    done

# Find files with includes
find-with-includes:
    #!/usr/bin/env bash
    echo "Files with include:: directives:"
    echo "================================"
    grep -r "include::" dist/test --include="*.adoc" -l | head -20
    echo ""
    echo "Total: $(grep -r 'include::' dist/test --include='*.adoc' -l | wc -l) files"

# Convert files with includes (for boundary testing)
test-includes OUTPUT_DIR="build/with-includes":
    #!/usr/bin/env bash
    set -euo pipefail
    mkdir -p "{{OUTPUT_DIR}}"

    # Find files with includes
    files_with_includes=$(grep -r "include::" dist/test/assemblies --include="*.adoc" -l | head -10)

    count=0
    for file in $files_with_includes; do
        basename=$(basename "$file" .adoc)
        category=$(basename $(dirname "$file"))

        echo "Converting: $category/$basename"
        node index.js "$file" -o "{{OUTPUT_DIR}}/${category}_${basename}.html" 2>&1 | grep -E "(ERROR|WARNING|include-boundary)" || true
        count=$((count + 1))
    done

    echo "✅ Converted $count files with includes"
    echo "Checking for include boundaries..."
    grep -c "include-boundary" "{{OUTPUT_DIR}}"/*.html | grep -v ":0" || echo "No boundaries found"

# Benchmark conversion speed
benchmark COUNT="10":
    #!/usr/bin/env bash
    echo "Benchmarking conversion of {{COUNT}} files..."

    files=$(find dist/test/assemblies -name "*.adoc" | head -{{COUNT}})

    start=$(date +%s)
    count=0

    for file in $files; do
        node index.js "$file" > /dev/null 2>&1
        count=$((count + 1))
    done

    end=$(date +%s)
    duration=$((end - start))
    avg=$(echo "scale=2; $duration / $count" | bc)

    echo "✅ Converted $count files in ${duration}s (avg: ${avg}s per file)"

# Convert a single title/master.adoc file
convert-title TITLE OUTPUT_DIR="build/titles":
    #!/usr/bin/env bash
    set -e
    mkdir -p "{{OUTPUT_DIR}}"

    if [ ! -f "dist/test/titles/{{TITLE}}/master.adoc" ]; then
        echo "❌ Title not found: {{TITLE}}"
        echo "Available titles:"
        ls -1 dist/test/titles/
        exit 1
    fi

    echo "Converting title: {{TITLE}}"
    node index.js "dist/test/titles/{{TITLE}}/master.adoc" -o "{{OUTPUT_DIR}}/{{TITLE}}.html" 2>/dev/null || true

    if [ -f "{{OUTPUT_DIR}}/{{TITLE}}.html" ]; then
        count=$(grep -c 'id=".*--block-' "{{OUTPUT_DIR}}/{{TITLE}}.html" 2>/dev/null || echo "0")
        include_count=$(grep -c 'id=".*--include-' "{{OUTPUT_DIR}}/{{TITLE}}.html" 2>/dev/null || echo "0")
        echo "✅ Generated $count block IDs and $include_count include boundaries"
        echo "   Output: {{OUTPUT_DIR}}/{{TITLE}}.html"
    else
        echo "❌ Conversion failed"
        exit 1
    fi

# Convert all titles/master.adoc files
convert-all-titles OUTPUT_DIR="build/titles":
    #!/usr/bin/env bash
    set -euo pipefail
    mkdir -p "{{OUTPUT_DIR}}"

    count=0
    total=$(ls -1d dist/test/titles/*/ 2>/dev/null | wc -l)

    echo "Converting $total title master.adoc files..."

    for title_dir in dist/test/titles/*/; do
        if [ -d "$title_dir" ]; then
            title=$(basename "$title_dir")
            echo "[$((count + 1))/$total] Processing: $title"

            node index.js "${title_dir}master.adoc" > "{{OUTPUT_DIR}}/${title}.html" 2>&1 || echo "  ⚠️  Failed: $title"
            count=$((count + 1))
        fi
    done

    echo ""
    echo "✅ Converted $count title files"
    echo "   Output directory: {{OUTPUT_DIR}}"

# Convert all titles with attribute options (for interactive buttons)
convert-titles OUTPUT_DIR="build/titles-demo":
    #!/usr/bin/env bash
    set -euo pipefail
    mkdir -p "{{OUTPUT_DIR}}"

    count=0
    total=$(ls -1d dist/test/titles/*/ 2>/dev/null | wc -l)

    echo "Converting $total title master.adoc files with rhdh-test.json..."

    for title_dir in dist/test/titles/*/; do
        if [ -d "$title_dir" ]; then
            title=$(basename "$title_dir")
            echo "[$((count + 1))/$total] Processing: $title"

            node index.js --attribute-options rhdh-test.json "${title_dir}master.adoc" > "{{OUTPUT_DIR}}/${title}.html" 2>&1 || echo "  ⚠️  Failed: $title"
            count=$((count + 1))
        fi
    done

    echo ""
    echo "✅ Converted $count title files with attribute buttons"
    echo "   Output directory: {{OUTPUT_DIR}}"

# List all available titles
list-titles:
    #!/usr/bin/env bash
    echo "Available Titles (dist/test/titles/):"
    echo "======================================"

    for title_dir in dist/test/titles/*/; do
        if [ -d "$title_dir" ]; then
            title=$(basename "$title_dir")
            master_file="${title_dir}master.adoc"

            # Extract title from master.adoc if it exists
            if [ -f "$master_file" ]; then
                doc_title=$(grep -m1 '^= ' "$master_file" 2>/dev/null | sed 's/^= *//' || echo "No title")
                includes=$(grep -c '^include::' "$master_file" 2>/dev/null || echo "0")
                echo "$title"
                echo "  Title: $doc_title"
                echo "  Includes: $includes files"
                echo ""
            fi
        fi
    done

# Analyze a specific title's include structure
analyze-title TITLE:
    #!/usr/bin/env bash
    set -e

    master_file="dist/test/titles/{{TITLE}}/master.adoc"

    if [ ! -f "$master_file" ]; then
        echo "❌ Title not found: {{TITLE}}"
        echo "Run 'just list-titles' to see available titles"
        exit 1
    fi

    echo "Analyzing: {{TITLE}}"
    echo "===================="
    echo ""

    # Extract title
    title=$(grep -m1 '^= ' "$master_file" 2>/dev/null | sed 's/^= *//' || echo "No title")
    echo "Document Title: $title"
    echo ""

    # Count includes
    total_includes=$(grep -c '^include::' "$master_file" 2>/dev/null || echo "0")
    assemblies=$(grep -c '^include::assemblies/' "$master_file" 2>/dev/null || echo "0")
    modules=$(grep -c '^include::modules/' "$master_file" 2>/dev/null || echo "0")

    echo "Include Statistics:"
    echo "  Total includes: $total_includes"
    echo "  Assemblies: $assemblies"
    echo "  Modules: $modules"
    echo ""

    echo "Included Files:"
    echo "---------------"
    grep '^include::' "$master_file" | sed 's/include::/  - /' | sed 's/\[.*//'

# Compare title conversion with/without semantic IDs
compare-title TITLE:
    #!/usr/bin/env bash
    set -e
    mkdir -p build/compare

    echo "Converting {{TITLE}} with and without semantic IDs..."

    # With semantic IDs
    node index.js "dist/test/titles/{{TITLE}}/master.adoc" -o "build/compare/{{TITLE}}-with-ids.html" 2>/dev/null || true

    # Without semantic IDs
    node index.js --no-semantic-ids "dist/test/titles/{{TITLE}}/master.adoc" -o "build/compare/{{TITLE}}-no-ids.html" 2>/dev/null || true

    if [ -f "build/compare/{{TITLE}}-with-ids.html" ] && [ -f "build/compare/{{TITLE}}-no-ids.html" ]; then
        with_ids=$(grep -c 'id=".*--block-' "build/compare/{{TITLE}}-with-ids.html" 2>/dev/null || echo "0")
        without_ids=$(grep -c 'id=".*--block-' "build/compare/{{TITLE}}-no-ids.html" 2>/dev/null || echo "0")

        echo ""
        echo "Comparison Results:"
        echo "==================="
        echo "With semantic IDs:    $with_ids block IDs"
        echo "Without semantic IDs: $without_ids block IDs"
        echo ""
        echo "File sizes:"
        ls -lh build/compare/{{TITLE}}-*.html | awk '{print "  " $9 ": " $5}'
    else
        echo "❌ Conversion failed"
        exit 1
    fi

# Test titles with include boundaries
test-titles-with-includes:
    #!/usr/bin/env bash
    set -e
    mkdir -p build/titles-test

    echo "Testing titles with include boundaries..."

    # Pick first 3 titles to test
    count=0
    for title_dir in dist/test/titles/*/; do
        if [ $count -ge 3 ]; then
            break
        fi

        title=$(basename "$title_dir")
        echo ""
        echo "[$((count + 1))] Testing: $title"

        node index.js "${title_dir}master.adoc" -o "build/titles-test/${title}.html" 2>/dev/null || true

        if [ -f "build/titles-test/${title}.html" ]; then
            block_ids=$(grep -c 'id=".*--block-' "build/titles-test/${title}.html" 2>/dev/null || echo "0")
            include_ids=$(grep -c 'id=".*--include-' "build/titles-test/${title}.html" 2>/dev/null || echo "0")
            boundaries=$(grep -c 'class="include-boundary"' "build/titles-test/${title}.html" 2>/dev/null || echo "0")

            echo "  Block IDs: $block_ids"
            echo "  Include boundaries: $include_ids"
            echo "  Boundary markers: $boundaries"
        fi

        count=$((count + 1))
    done

    echo ""
    echo "✅ Test complete - outputs in build/titles-test/"

# Find titles by category prefix
find-titles-by-category PREFIX:
    #!/usr/bin/env bash
    echo "Titles matching: {{PREFIX}}*"
    echo "=============================="
    ls -1d dist/test/titles/{{PREFIX}}*/ 2>/dev/null | while read dir; do
        title=$(basename "$dir")
        echo "  $title"
    done

# Statistics about titles
titles-stats:
    #!/usr/bin/env bash
    echo "📊 Titles Statistics"
    echo "===================="
    echo ""

    total=$(ls -1d dist/test/titles/*/ 2>/dev/null | wc -l)
    echo "Total titles: $total"
    echo ""

    echo "By category prefix:"
    echo "-------------------"
    for prefix in configure control-access develop discover explore extend get-started install integrate observability observe product upgrade; do
        count=$(ls -1d dist/test/titles/${prefix}* 2>/dev/null | wc -l)
        if [ $count -gt 0 ]; then
            echo "  $prefix: $count"
        fi
    done
    echo ""

    echo "Total includes across all titles:"
    total_includes=0
    for master in dist/test/titles/*/master.adoc; do
        if [ -f "$master" ]; then
            includes=$(grep -c '^include::' "$master" 2>/dev/null || echo "0")
            total_includes=$((total_includes + includes))
        fi
    done
    echo "  $total_includes total include directives"

# Convert docs/*.adoc files to HTML (demonstrates all features)
convert-docs OUTPUT_DIR="docs":
    #!/usr/bin/env bash
    set -euo pipefail
    mkdir -p "{{OUTPUT_DIR}}"

    count=0
    for file in docs/*.adoc; do
        if [ -f "$file" ]; then
            basename=$(basename "$file" .adoc)
            echo "Converting: $basename.adoc"
            node index.js "$file" > "{{OUTPUT_DIR}}/${basename}.html" 2>&1 || echo "  ⚠️  Failed: $file"
            count=$((count + 1))
        fi
    done

    echo ""
    echo "✅ Converted $count docs files"
    echo "   Output directory: {{OUTPUT_DIR}}"
    echo ""
    echo "Features demonstrated:"
    echo "  • Semantic IDs: $(grep -c 'id=".*--block-' "{{OUTPUT_DIR}}"/*.html 2>/dev/null || echo '0') block IDs"
    echo "  • Include boundaries: $(grep -c 'include-boundary' "{{OUTPUT_DIR}}"/*.html 2>/dev/null || echo '0') markers"
    echo ""
    echo "Open {{OUTPUT_DIR}}/test.html to see include boundaries and semantic IDs"

# Convert docs/*.adoc with attribute buttons
convert-docs-demo OUTPUT_DIR="docs":
    #!/usr/bin/env bash
    set -euo pipefail
    mkdir -p "{{OUTPUT_DIR}}"

    count=0
    for file in docs/*.adoc; do
        if [ -f "$file" ]; then
            basename=$(basename "$file" .adoc)
            echo "Converting: $basename.adoc (with attribute buttons)"
            node index.js --attribute-options docs.json "$file" > "{{OUTPUT_DIR}}/${basename}.html" 2>&1 || echo "  ⚠️  Failed: $file"
            count=$((count + 1))
        fi
    done

    echo ""
    echo "✅ Converted $count docs files with interactive attribute buttons"
    echo "   Output directory: {{OUTPUT_DIR}}"
    echo ""
    echo "Features demonstrated:"
    echo "  • Semantic IDs: $(grep -c 'id=".*--block-' "{{OUTPUT_DIR}}"/*.html 2>/dev/null || echo '0') block IDs"
    echo "  • Include boundaries: $(grep -c 'include-boundary' "{{OUTPUT_DIR}}"/*.html 2>/dev/null || echo '0') markers"
    echo "  • Attribute buttons: $(grep -c 'attribute-substitution' "{{OUTPUT_DIR}}"/*.html 2>/dev/null || echo '0') interactive buttons"
    echo ""
    echo "Open {{OUTPUT_DIR}}/test.html in a browser to test all features"

# Install dependencies (if needed)
install:
    npm install
    @echo "✅ Dependencies installed"

# Run all tests
test: test-sample test-with-options test-includes
    @echo "✅ All tests complete"

# Quick test: convert one title with buttons
test-title-buttons TITLE="configure_configuring-rhdh":
    just convert-titles
    @echo ""
    @echo "📊 Checking {{TITLE}}.html for attribute buttons..."
    @grep -c 'attribute-substitution' build/titles-demo/{{TITLE}}.html || echo "0"
    @echo "Unique buttonized attributes:"
    @grep -o 'data-attribute="[^"]*"' build/titles-demo/{{TITLE}}.html | sed 's/data-attribute="\([^"]*\)"/\1/' | sort -u | head -10
