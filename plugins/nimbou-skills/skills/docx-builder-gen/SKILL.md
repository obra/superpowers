---
name: docx-builder-gen
description: Use this skill to turn a mail-merge .docx template into a NestJS docx builder. Trigger when the user asks to "gerar builder do docx", "criar builder a partir do template", "docx-builder-gen <arquivo.docx> <NomeBuilder>", or wants TypeScript code (builder class + context interface + module registration) generated from a Word document prepared with mail-merge fields.
---

# DOCX Builder Generator

Generate a faithful NestJS `docx` builder from a Word `.docx` template prepared
with mail-merge fields. The skill reads the document with `python-docx`, extracts
its visual + structural shape into JSON, then produces three artifacts that match
the FAEPEN builder conventions: the builder class, the `TemplateData` interface,
and the NestJS module registration snippet.

This skill targets the project at `/var/www/projetos.faepen.org.br`, whose builders
live in `apps/api/src/infrastructure/documents/builders/`.

## When to use

Use when a developer has a reference `.docx` (e.g. under `tmp/<domínio>/`) and needs
the programmatic builder that reproduces it. The developer prepares the `.docx`
beforehand by replacing dynamic values with **mail-merge fields** (Word: Insert →
Quick Parts → Field → MergeField), or by typing plain-text tokens like
`«passengerName»`. Static text stays as-is.

## Inputs

Invoked with two positional arguments (plus an optional target module):

```
docx-builder-gen <path-to-docx> <BuilderClassName> [target-module-path]
```

- `path-to-docx` — the prepared template, e.g. `apps/api/tmp/passagem/spp.docx`.
- `BuilderClassName` — PascalCase, ending in `DocxBuilder`, e.g. `SppDocxBuilder`.
- `target-module-path` — optional NestJS module to register the provider in.

If an argument is missing, ask for it before proceeding. Derive the output file
name from the class name: `SppDocxBuilder` → `spp-docx.builder.ts`.

## Workflow

### 1. Ensure python-docx is available

Run the extraction script (step 2, absolute path) with the project's Python.
If it exits with code 2 (`python-docx not installed`), install it first:

```bash
pip install python-docx          # or: python3 -m pip install python-docx
```

Prefer an existing project virtualenv if one is present; otherwise a user/global
install is fine. Do not add `python-docx` to the Node project's dependencies.

### 2. Extract the document structure

Run the bundled script using its **absolute path** — the agent's working
directory is usually the target project, not this skill, so a bare
`scripts/...` path will not resolve. Use this skill's base directory
(`<skill-dir>` below):

```bash
python3 <skill-dir>/scripts/extract_docx.py <path-to-docx> --out /tmp/docx-extract.json
```

The JSON contains:
- `fields` — deduplicated mail-merge field names, in order of appearance.
- `section` — page size, margins, header/footer references.
- `hasHeaderContent` / `hasFooterContent` — whether an institutional header/footer exists.
- `body` — ordered list of `paragraph` and `table` nodes; each paragraph's `runs`
  are split into `"kind": "static"` (literal text) and `"kind": "field"` (dynamic).

Read the JSON. If `fields` is empty, the document has no mail-merge markers — stop
and ask the developer to prepare the template (the skill cannot guess which text
is dynamic; that decision is mail-merge, per the agreed convention).

### 3. Read the builder pattern reference

Read `references/builder-pattern.md` in full before generating. It defines the
target file paths, the builder skeleton, the shared helpers to import (never
reimplement), the JSON→docx property mapping, the `TemplateData` typing rules,
the module snippet, and known limitations.

### 4. Generate the three artifacts

Following the reference, produce:

1. **`XxxTemplateData` interface** — one field per `fields` entry, typed per the
   reference's typing rules (Date/number/boolean/optional inference).
2. **`XxxDocxBuilder` class** — `@Injectable()`, `build(data): Promise<Buffer>`
   returning `toDocxBuffer(doc)`, with one private `Paragraph[]` method per visual
   block. Map each JSON node to docx constructs using the mapping table. Bind
   `"field"` runs to `data.<field>` with the appropriate formatter (`formatDate`,
   `formatBRL`, `formatCpf`, ...). Wire `buildInstitutionalHeader/Footer` when the
   reference document has header/footer content.
3. **Module registration snippet** — register the builder as a provider in the
   target module (direct class reference unless that module uses interface tokens).

Write the builder + interface to
`apps/api/src/infrastructure/documents/builders/<kebab>-docx.builder.ts`. If a
`target-module-path` was given, apply the provider registration there; otherwise
output the snippet and tell the developer where to paste it.

### 5. Report fidelity and limitations

Visual replication is the goal but the `.docx` → TypeScript gap is real. After
generating, explicitly list what to verify against the printed reference:
table-style borders, theme-inherited fonts/sizes, merged cells, numbered lists
(see the "Known limitations" section of the reference). Recommend the developer
compile and visually diff the generated output against the reference document.

## Validation

The strongest first check is regression against an already-implemented builder:
run the skill on a document that has a hand-written builder (e.g. the SPP template)
and compare the generated code with the existing `spp-docx.builder.ts`. Differences
expose extraction or mapping gaps before the skill is used on a new document.

## Resources

- **`scripts/extract_docx.py`** — python-docx extractor. Reads a `.docx`, emits
  generation-ready JSON. Recognizes complex `MERGEFIELD` fields, `w:fldSimple`
  fields, and plain-text `«token»` guillemets; skips cached field display values.
- **`references/builder-pattern.md`** — FAEPEN builder conventions, shared-helper
  imports, JSON→docx mapping table, typing rules, module snippet, and limitations.
