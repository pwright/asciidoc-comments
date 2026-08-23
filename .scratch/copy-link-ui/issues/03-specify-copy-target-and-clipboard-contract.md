Type: grilling
Status: resolved
Blocked by: 02

## Question

What exact browser-side algorithm should compute the target URL and Markdown payload for selected text and no-selection copy actions?

Resolve with acceptance criteria for nearest `id` lookup, selection-start handling for multi-block selections, URL/hash construction, Markdown title escaping, quote formatting, no-target behavior, clipboard API fallback, and parity with `bookmarklet.js`.

## Answer

The production browser-side algorithm should mirror `bookmarklet.js` where it affects the clipboard payload, but adapt failures and target filtering for generated page UI.

Target lookup:

- Start with `window.getSelection()`.
- If the selection exists, has at least one range, and `selection.toString().trim()` is not empty, use `selection.getRangeAt(0).startContainer` as the anchor node.
- Resolve the copy target with `anchorElement.closest('[id]')`, where `anchorElement` is the start container if it is an element or its parent element otherwise.
- For multi-block selections, the URL points to the first addressable content target containing the selection start.
- If there is no usable selected text, fall back to the active/focused element, then to the current `window.location.hash` target when present.
- Exclude generated UI chrome from content targeting: copy button, floating footer, status region, Toggle IDs control, GitHub link, copy placement controls, attribute substitution menu, and any element inside those generated controls.
- Attribute substitution buttons in document content should not trigger copy UI repositioning when clicked, but if selected text starts inside one, the nearest content target should be the surrounding addressable document block rather than the button itself.

Payload construction:

- Create a `URL` from `window.location.href` and set `url.hash = target.id`.
- Keep existing query parameters and path as-is; only replace the hash.
- Use `(document.title || url.href).replace(/\s+/g, ' ').trim()` as the Markdown link text source.
- Escape backslashes, `[`, and `]` in the Markdown link text exactly like the bookmarklet.
- If selected text is present, trim it and append a blank line followed by each selected line prefixed with `> `.
- If no selected text is present, copy only `[Title](url#target-id)` with no empty quote block.

Failure and fallback behavior:

- If no content target with an ID can be found, show non-blocking failure status in the floating footer/status region. Do not use `alert()`.
- Attempt `navigator.clipboard.writeText(markdown)` first.
- If clipboard write fails, open `window.prompt('Copy Markdown link', markdown)` as the manual copy fallback and report that fallback through the status region.
- Copy success and fallback/failure status must be announced through the accessible status region.

Acceptance criteria:

- Copied Markdown for selected text remains format-compatible with `bookmarklet.js`.
- Multi-block selection links to the first selected block, not the block where selection ends.
- Clicking or focusing generated UI chrome never produces a URL to generated controls.
- No-selection copy never appends an empty quote.
- Hash replacement handles existing hashes without duplicating fragments.
