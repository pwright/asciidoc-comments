Type: grilling
Status: resolved

## Question

What exact file/module boundary should hold generated HTML enhancements so the copy link UI does not add more HTML, CSS, and browser script directly to `add-id-processor.js`?

Resolve with a concrete implementation shape: candidate file names, exported helper/API shape, which existing footer enhancement code should move, and what remains in `add-id-processor.js`.

## Answer

Create a new ESM module named `render-enhancements.js` for generated HTML enhancement composition.

The module should expose one high-level function:

```js
appendRenderEnhancements(output, config)
```

`add-id-processor.js` should continue to own Asciidoctor registration, source preprocessing, AST walking, semantic ID assignment, include-boundary insertion, table row anchor insertion, and dlist term anchor insertion. After those structural transforms, the postprocessor should call `appendRenderEnhancements(normalizedOutput, config)` once.

Move the existing browser-facing enhancement code into `render-enhancements.js` before adding the copy link UI:

- `appendFooterEnhancements`
- `appendAttributeOptionsScript`
- footer icon template helpers
- attribute-options script/style template code
- render-specific attribute option normalization needed by the attribute-options script

Keep AST/id/source helpers in `add-id-processor.js`. Do not create a broad shared utility module yet. If HTML escaping is needed in both files, keep the existing include-boundary escape helper in `add-id-processor.js` and add a small local render escape/helper in `render-enhancements.js` only where needed.

Prefer JS template functions over separate `.html` template files. This repo has no build step, already emits self-contained generated HTML, and separate template assets would create packaging and file-read concerns without enough benefit for this feature.
