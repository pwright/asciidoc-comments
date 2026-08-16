# Titles Recipes Reference

Quick reference for working with the 36 master TOC files in `dist/test/titles/`.

## Overview

Each title is a master.adoc file that includes assemblies and modules to create a complete documentation guide. These represent the top-level table of contents for different documentation categories.

**Total:** 36 titles  
**Total includes:** 322 (assemblies + modules + artifacts)

## Categories

```
configure       (4)  │  extend        (6)  │  integrate    (4)
control-access  (2)  │  get-started   (2)  │  observability(5)
develop         (2)  │  install       (6)  │  observe      (1)
discover        (1)  │  integrate     (4)  │  product      (1)
explore         (1)  │                     │  upgrade      (1)
```

## Quick Reference

### Information Commands

```bash
# List all titles with details
just list-titles

# Show statistics
just titles-stats

# Find titles by category
just find-titles-by-category configure
just find-titles-by-category extend
just find-titles-by-category install

# Analyze a specific title
just analyze-title configure_configuring-rhdh
```

### Conversion Commands

```bash
# Convert one title
just convert-title configure_configuring-rhdh

# Convert all titles (36 files)
just convert-all-titles

# Convert to custom directory
just convert-title extend_orchestrator-in-rhdh build/my-output

# Compare with/without semantic IDs
just compare-title configure_configuring-rhdh
```

### Testing Commands

```bash
# Test include boundaries on 3 titles
just test-titles-with-includes
```

## Example Workflow

```bash
# 1. Explore available titles
just list-titles | less

# 2. Check statistics
just titles-stats

# 3. Analyze a specific title
just analyze-title extend_orchestrator-in-rhdh

# 4. Convert it
just convert-title extend_orchestrator-in-rhdh

# 5. Verify semantic IDs
just verify-ids build/titles/extend_orchestrator-in-rhdh.html

# 6. Compare output
just compare-title extend_orchestrator-in-rhdh
```

## Sample Output

### analyze-title
```
Analyzing: configure_configuring-rhdh
====================

Document Title: {title}

Include Statistics:
  Total includes: 20
  Assemblies: 10
  Modules: 9

Included Files:
---------------
  - artifacts/attributes.adoc
  - assemblies/configure_configuring-rhdh/assembly-understanding-rhdh-configuration-files.adoc
  - assemblies/configure_configuring-rhdh/assembly-provision-and-use-your-custom-rhdh-configuration.adoc
  [... and 17 more]
```

### convert-title
```
Converting title: configure_configuring-rhdh
Output written to: build/titles/configure_configuring-rhdh.html
✅ Generated 42 block IDs and 20 include boundaries
   Output: build/titles/configure_configuring-rhdh.html
```

### titles-stats
```
📊 Titles Statistics
====================

Total titles: 36

By category prefix:
-------------------
  configure: 4
  control-access: 2
  develop: 2
  discover: 1
  explore: 1
  extend: 6
  get-started: 2
  install: 6
  integrate: 4
  observability: 5
  observe: 1
  product: 1
  upgrade: 1

Total includes across all titles:
  322 total include directives
```

## All Available Titles

### Configure (4)
- `configure_configuring-rhdh` - 20 includes
- `configure_customizing-rhdh` - 19 includes
- `configure_helm-chart-config-reference` - 3 includes
- `configure_techdocs-for-rhdh` - 8 includes

### Control Access (2)
- `control-access_authentication-in-rhdh` - 9 includes
- `control-access_authorization-in-rhdh` - 16 includes

### Develop (2)
- `develop_manage-and-consume-technical-documentation-within-rhdh` - 7 includes
- `develop_streamline-software-development-and-management-in-rhdh` - 4 includes

### Discover (1)
- `discover_about-rhdh` - 9 includes

### Explore (1)
- `explore_preview-of-emerging-capabilities` - 2 includes

### Extend (6)
- `extend_configuring-dynamic-plugins` - 10 includes
- `extend_develop-and-deploy-plugins-in-rhdh` - 4 includes
- `extend_dynamic-plugins-reference` - 6 includes
- `extend_installing-and-viewing-plugins-in-rhdh` - 12 includes
- `extend_orchestrator-in-rhdh` - 23 includes (largest!)
- `extend_using-dynamic-plugins-in-rhdh` - 6 includes

### Get Started (2)
- `get-started_navigate-rhdh-on-your-first-day` - 9 includes
- `get-started_setting-up-and-configuring-your-first-red-hat-developer-hub-instance` - 9 includes

### Install (6)
- `install_installing-rhdh-in-an-air-gapped-environment` - 6 includes
- `install_installing-rhdh-on-aks` - 8 includes
- `install_installing-rhdh-on-eks` - 8 includes
- `install_installing-rhdh-on-gke` - 8 includes
- `install_installing-rhdh-on-ocp` - 8 includes
- `install_installing-rhdh-on-osd-on-gcp` - 8 includes

### Integrate (4)
- `integrate_accelerating-ai-development-with-openshift-ai-connector-for-rhdh` - 8 includes
- `integrate_integrating-rhdh-with-your-git-provider` - 7 includes
- `integrate_interacting-with-developer-lightspeed-for-rhdh` - 3 includes
- `integrate_interacting-with-model-context-protocol-tools-for-rhdh` - 6 includes

### Observability (5)
- `observability_adoption-insights-in-rhdh` - 6 includes
- `observability_audit-logs-in-rhdh` - 3 includes
- `observability_evaluate-project-health-using-scorecards` - 7 includes
- `observability_monitoring-and-logging` - 7 includes
- `observability_telemetry-data-collection-and-analysis` - 4 includes

### Observe (1)
- `observe_diagnostic-data-collection` - 4 includes

### Product (1)
- `product_product` - 13 includes

### Upgrade (1)
- `upgrade_upgrade-rhdh` - 7 includes

## Tips

### Convert Multiple Specific Titles

```bash
# Convert all install guides
for title in install_installing-rhdh-on-*; do
    just convert-title "$title"
done
```

### Extract All Titles

```bash
# Get list of all titles
just list-titles > all-titles.txt
```

### Batch Analyze

```bash
# Analyze all extend titles
for title in extend_*; do
    echo "=== $title ==="
    just analyze-title "$title"
    echo ""
done
```

## Understanding Include Boundaries

When you convert a title, each `include::` directive gets an include boundary marker:

```html
<div id="configure-rhdh--include-1" class="include-boundary">
  <hr>
  <span>Start include: assemblies/configure_configuring-rhdh/assembly-understanding-rhdh-configuration-files.adoc</span>
</div>
<!-- included content with its own block IDs -->
```

This makes it easy to see where each assembly/module begins in the final HTML.

## Semantic ID Generation

Each title generates:
- **Block IDs:** `section--block-N` for paragraphs, lists, code blocks, etc.
- **Include IDs:** `section--include-N` for each `include::` directive

Example from `configure_configuring-rhdh` (42 block IDs, 20 include boundaries):
- First section blocks: `configuring-rhdh--block-1`, `configuring-rhdh--block-2`, etc.
- Includes: `configuring-rhdh--include-1` through `configuring-rhdh--include-20`

## See Also

- [JUSTFILE_README.md](JUSTFILE_README.md) - Complete recipe reference
- [README.md](README.md) - User guide
- [PROJECT_STATUS.md](PROJECT_STATUS.md) - Project overview
