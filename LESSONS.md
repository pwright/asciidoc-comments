# Implementation Lessons

## The Agnostic Pipeline Model

This implementation is a textbook example of the Agnostic Pipeline Model.

**Decoupling the input format from the output format breaks your process into three distinct, isolated stages:**

$$
\text{Source File} \xrightarrow{\text{Parse}} \text{Intermediate Representation (IR)} \xrightarrow{\text{Interventions}} \text{Mutated IR} \xrightarrow{\text{Generate}} \text{Target File}
$$

- **1. Parse (Input Driver):** A format-specific parser converts your source file (e.g., Markdown, YAML, custom DSL, XML) into a generic IR—typically a tree structure or node graph.
- **2. Intervene (Middleware Pipeline):** Transformation hooks operate strictly on the generic IR, completely agnostic to the input or output formats. When a marker node is encountered, a handler intercepts it, executes your external script or disk read, and mutates or replaces the IR node.
- **3. Generate (Output Writer):** A target-specific serializer consumes the mutated IR and emits the desired format (e.g., PDF, JSON, HTML, SQL, plain text).

**Key Design Patterns**

- **Intermediate Representation (IR):** Normalizing data into a central model prevents $M×N$ complexity. Instead of writing separate intervention logic for $M$ source types and $N$ target types, you only write interventions against 1 shared IR.
- **Pipe and Filter / Middleware:** Treat every intervention as a pluggable filter in a chain. Each filter inspects the IR payload, performs its task, and passes the modified payload to the next step.
- **Strategy Pattern (Serializers):** Keep your core pipeline target-blind. You can attach a `PdfGenerator`, `HtmlGenerator`, or `JsonGenerator` strategy at the final step without altering any of the intervention logic.

## How This Implementation Applies the Model

### Three-Stage Pipeline

**1. Parse (Input Driver)**
- Asciidoctor.js parses AsciiDoc markup → Document tree (AST)
- Entry: `convertFile()` at index.js:22

**2. Intervene (Middleware Chain)**

Three independent filters operating on different IRs:

- **Preprocessor** (add-id-processor.js:43-100): Operates on the *line stream* IR to inject include boundaries and buttonize attribute references
- **TreeProcessor** (add-id-processor.js:102-115): Operates on the *document tree* IR to assign semantic IDs
- **Postprocessor** (add-id-processor.js:117-123): Operates on the *output string* IR to normalize buttons and inject JavaScript

**3. Generate (Output Writer)**
- Asciidoctor.js converts the mutated tree → HTML output

### Why This Matches the Model

✅ **Format-agnostic interventions**: The tree processor (add-id-processor.js:372-427) never touches AsciiDoc syntax or HTML tags — it operates purely on abstract block nodes via `getContext()`, `setId()`, `getBlocks()`.

✅ **M×N complexity avoided**: Because the code operates on Asciidoctor's IR, the same extension works with any Asciidoctor backend (HTML5, PDF, DocBook) without modification.

✅ **Pipe and Filter**: Each processor is a composable filter: `preprocessor → [parse] → treeProcessor → [generate] → postprocessor`

✅ **Pluggable strategies**: Asciidoctor's converter system is the Strategy pattern — swap backends without changing intervention logic.

### Key Insight

**You're not transforming AsciiDoc → HTML. You're transforming IR → IR**, and Asciidoctor handles the parse/generate boundaries for you.
