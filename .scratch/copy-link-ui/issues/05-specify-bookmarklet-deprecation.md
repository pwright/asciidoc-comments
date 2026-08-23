Type: grilling
Status: resolved
Blocked by: 03

## Question

How should the old bookmarklet be deprecated without breaking users immediately?

Resolve what stays in `bookmarklet.js`, whether tests remain or change, how README and `docs/index.adoc` describe the new default workflow, what the deprecated/legacy note says, and whether package metadata should change.

## Answer

Keep `bookmarklet.js` shipped for one release while deprecating it in public docs.

File/package behavior:

- Leave `bookmarklet.js` in the package for compatibility.
- Do not remove it from `package.json` `files` in the same change that introduces copy link UI.
- Do not change its clipboard payload behavior except where tests expose an actual bug.
- Do not commit to a removal version in code or docs; say it will be removed in a future release.

Documentation behavior:

- README and `docs/index.adoc` should make copy link UI the primary workflow.
- The primary workflow should say rendered HTML includes copy link UI by default: select text in an addressable block, click the floating copy icon, and the Markdown link/quote is copied.
- Document no-selection behavior: clicking copy when a target is available copies only the Markdown link.
- Move bookmarklet instructions to a short deprecated/legacy section.
- Legacy note wording should state that the bookmarklet remains for compatibility but copy link UI is the preferred path and the bookmarklet may be removed in a future release.
- Stop using the old `CommentCapture` name in public docs. If a bookmarklet link remains in generated demo docs, label it `Deprecated copy-link bookmarklet`.

Tests:

- Keep bookmarklet tests that assert payload parity while `bookmarklet.js` ships.
- Update docs tests to assert that docs mention copy link UI as the default workflow.
- Update docs tests to assert deprecation wording for the bookmarklet and absence of the old `CommentCapture` name.

Package metadata:

- No package metadata change is required solely for deprecation unless a later release/changelog ticket decides to add explicit release notes.
