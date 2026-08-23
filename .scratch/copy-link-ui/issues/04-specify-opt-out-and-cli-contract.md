Type: grilling
Status: resolved

## Question

What is the exact opt-out contract for disabling the copy link UI from AsciiDoc source and from the CLI?

Resolve the final attribute name, CLI flag name, parser behavior, register option shape, precedence rules, usage text changes, and tests proving the generated script/style are absent when disabled.

## Answer

Use `copy link UI` as a default-on generated HTML feature with three opt-out surfaces.

Document attribute:

- `:no-copy-link-ui:`
- If present on the AsciiDoc document, do not inject the copy link button, placement controls, copy status behavior, or copy-link-specific script/style.

CLI flag:

- `--no-copy-link-ui`
- `parseArgs()` should return `copyLinkUi: false` when present.
- CLI usage text should include the flag.
- CLI conversion should pass `{ copyLinkUi: false }` into `register()`.

Programmatic API:

- `register(registry, { copyLinkUi: false })`
- `copyLinkUi` is a positive option with default `true`.
- Avoid double-negative option names such as `noCopyLinkUi`.

Precedence:

- If any layer disables copy link UI, it is disabled.
- Effective behavior: inject copy link UI only when `config.copyLinkUi !== false` and the document does not have `no-copy-link-ui`.
- The CLI flag feeds the register option, so it participates in the same `config.copyLinkUi !== false` check.

Scope:

- Disabling copy link UI removes only copy-link-specific controls and behavior.
- The floating footer still renders non-copy tools such as Toggle IDs and the GitHub link.
- Existing attribute substitution buttons, include boundaries, semantic IDs, table row anchors, and dlist term anchors are unaffected.

Tests and docs required by this contract:

- A render test proves copy link UI is present by default.
- A render test proves `:no-copy-link-ui:` removes copy-link-specific markup/script/style while keeping the floating footer, Toggle IDs, and GitHub link.
- A CLI/parser test proves `--no-copy-link-ui` maps to `copyLinkUi: false`.
- README and `docs/index.adoc` document the attribute and CLI flag alongside the new default workflow.
