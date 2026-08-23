Type: grilling
Status: resolved
Blocked by: 02, 03, 04, 05

## Question

What test suite and acceptance criteria should the implementation-ready spec require?

Resolve the minimum tests for render-enhancement injection, opt-outs, clipboard-format parity, no-selection behavior, failure fallback, docs deprecation, and preservation of existing footer Toggle IDs and attribute substitution behavior.

## Answer

Use the repo's existing `node --test` style as the primary test level for this implementation. Do not add browser automation solely for this feature.

Implementation should make the browser payload logic testable without a browser by extracting pure helper functions where practical. DOM-heavy behavior such as selection tracking and visual placement can remain covered by generated HTML/script assertions, but Markdown payload construction and title escaping should have direct unit coverage.

Required test coverage:

- Rendered HTML includes copy link UI by default.
- Rendered HTML includes the persistent floating footer with Toggle IDs and GitHub link.
- Rendered HTML includes copy placement controls with margin as the default desktop behavior and selection as the narrow/mobile fallback.
- `:no-copy-link-ui:` removes copy-link-specific markup/script/style while preserving non-copy footer tools.
- `register(registry, { copyLinkUi: false })` removes copy-link-specific markup/script/style while preserving non-copy footer tools.
- CLI parsing maps `--no-copy-link-ui` to `copyLinkUi: false`.
- Markdown payload helpers preserve bookmarklet-compatible output for selected text:

```markdown
[Page title](https://example.com/page.html#block-id)

> selected text
```

- No-selection payload copies only `[Page title](url#block-id)`.
- Title escaping covers backslashes and square brackets.
- Existing bookmarklet tests continue to assert payload parity while `bookmarklet.js` ships.
- Docs tests assert copy link UI is the primary documented workflow.
- Docs tests assert bookmarklet deprecation wording and absence of `CommentCapture`.
- Existing attribute substitution button behavior remains covered.
- Existing Toggle IDs behavior remains covered after moving it into the floating footer.

Add a focused AsciiDoc fixture or inline render source that covers paragraphs, lists, attribute buttons, generated IDs, and author-provided IDs so render tests have stable targets.

Acceptance should include regenerating demo HTML under `docs/` when that is part of the repo's normal demo update flow. At minimum, `docs/index.html` should reflect the new default workflow after implementation.

The throwaway prototype stays in `.scratch/copy-link-ui/` as a planning artifact and must not be included in production package files.
