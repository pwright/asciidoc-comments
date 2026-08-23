Type: prototype
Status: resolved
Blocked by: 01

## Question

What should the first-version floating copy icon interaction look and behave like in rendered AsciiDoc HTML?

Resolve the concrete UI behavior for positioning, visibility timing, keyboard/focus handling, success and failure feedback, mobile/touch behavior, and how the icon avoids interfering with text selection or existing attribute substitution buttons.

## Answer

Prototype artifact: [prototype-floating-icon.html](../prototype-floating-icon.html).

Use the current margin-style render as the default copy link UI placement on desktop. The copy icon appears when the user has selected text in or near an addressable target, aligned near the target block's left margin so it stays close to the block without covering selected text or inline controls.

Keep placement user-selectable at runtime through document tools. The first-version UI should support at least:

- **Margin**: default desktop behavior; align the icon in the margin beside the selected block.
- **Selection**: fallback behavior for narrow/mobile viewports; place the icon above the selection because there may be no useful left margin.
- **Block**: optional placement at the target block edge for users who prefer controls closer to the content box.

Add a persistent floating footer for generated document tools. It should replace the current static footer enhancement area as the visible home for:

- copy link UI placement option
- Toggle IDs
- GitHub link
- transient copy/status feedback

The prototype keeps debug state in the floating footer. Production should keep the footer persistent, but debug payload text should not ship as visible user-facing copy unless the implementation later adds an explicit debug mode.

Interaction requirements:

- The icon appears only when there is an active text selection for the default workflow.
- Clicking attribute substitution buttons must not trigger or reposition the copy icon.
- The icon remains keyboard-focusable and has an accessible label.
- Copy success/failure is announced through a short-lived status region in the floating footer.
- Pressing Escape or clearing the selection hides the icon unless it currently has focus.
- On narrow/mobile viewports, margin placement falls back to selection placement.
