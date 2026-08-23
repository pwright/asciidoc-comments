## Destination

Produce an implementation-ready spec for deprecating the bookmarklet and replacing its primary workflow with a default-on floating copy link UI in generated HTML.

## Notes

- Use `/grilling` and `/domain-modeling` when working decision tickets.
- Issue tracker: local markdown under `.scratch/copy-link-ui/`.
- Feature name: copy link UI.
- The generated UI is default-on for standalone HTML renders.
- The user workflow is: select text in an addressable block, click a floating icon, and copy Markdown to the clipboard.
- Copied output keeps bookmarklet parity:

```markdown
[Page title](https://example.com/page.html#block-id)

> selected text
```

- With no selected text, copy only the Markdown link to the nearest addressable target.
- Target the nearest element with an `id`; for multi-block selections, target the first addressable block containing the selection start.
- Use both `:no-copy-link-ui:` and `--no-copy-link-ui` opt-outs.
- Clipboard fallback should use a prompt with the Markdown text if `navigator.clipboard.writeText` fails.
- Generated HTML must be self-contained with no runtime external asset requests.
- Show transient accessible success/failure feedback after copy attempts.
- Keep the existing footer Toggle IDs tool separate from the floating copy icon, though implementation may share a render-enhancements module.
- Keep `bookmarklet.js` shipped for one release and move docs to a deprecated/legacy note.

## Decisions so far

- [Specify Render Enhancements Boundary](issues/01-specify-render-enhancements-boundary.md) — move browser-facing generated HTML snippets into `render-enhancements.js`, called from `add-id-processor.js` through one `appendRenderEnhancements(output, config)` function; keep AST/source logic in `add-id-processor.js` and use JS template functions rather than separate HTML assets.
- [Specify Floating Icon Interaction](issues/02-specify-floating-icon-interaction.md) — default the copy icon to the current margin-style render on desktop, fall back to selection placement on narrow/mobile viewports, expose placement as a user option in a persistent floating footer, and move Toggle IDs/GitHub/status feedback into that footer.
- [Specify Copy Target and Clipboard Contract](issues/03-specify-copy-target-and-clipboard-contract.md) — mirror bookmarklet Markdown payload rules while anchoring selected text from the selection start, excluding generated UI chrome from targets, falling back to focused/hash targets for no-selection copy, and reporting copy/fallback status through the floating footer instead of alerts.
- [Specify Opt-Out and CLI Contract](issues/04-specify-opt-out-and-cli-contract.md) — use `:no-copy-link-ui:`, `--no-copy-link-ui`, and `register(registry, { copyLinkUi: false })`; any disabling layer wins, and disabling copy link UI removes only copy-specific controls while leaving the floating footer, Toggle IDs, and GitHub link.
- [Specify Bookmarklet Deprecation](issues/05-specify-bookmarklet-deprecation.md) — keep `bookmarklet.js` shipped for compatibility, make copy link UI the primary documented workflow, move bookmarklet instructions to a deprecated legacy note, stop using `CommentCapture`, and keep bookmarklet payload parity tests while it ships.
- [Specify Test and Acceptance Plan](issues/06-specify-test-and-acceptance-plan.md) — use existing Node render/string tests plus pure helper unit tests for payload construction; cover default injection, opt-outs, CLI parsing, floating footer tools, bookmarklet parity/deprecation docs, regenerated docs output, and keep the prototype as non-shipping `.scratch/` material.

## Not yet specified

None. The implementation route is specified.

## Out of scope

- Removing `bookmarklet.js` in the same change that introduces copy link UI.
- Using external runtime assets for the generated copy link UI.
