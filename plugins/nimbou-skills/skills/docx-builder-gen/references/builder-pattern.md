# FAEPEN DOCX Builder Pattern

Reference for generating a builder that matches the conventions already in
`apps/api/src/infrastructure/documents/` of the FAEPEN project. The generated
code must look like it was written by the same hand as `spp-docx.builder.ts`.

## Target locations

| Artifact | Path |
| --- | --- |
| Builder class | `apps/api/src/infrastructure/documents/builders/<kebab>-docx.builder.ts` |
| Shared helpers | `apps/api/src/infrastructure/documents/shared/` (import, never recreate) |
| Institutional assets | `apps/api/src/infrastructure/documents/assets/` |
| Module registration | the NestJS module that owns the originating domain |

Class name → file name: `SppDocxBuilder` → `spp-docx.builder.ts`. Strip the
`DocxBuilder`/`Builder` suffix, kebab-case the remainder, append `-docx.builder.ts`.

## Builder skeleton

```ts
import { Injectable } from '@nestjs/common';
import { Document, Paragraph, TextRun, AlignmentType } from 'docx';

import { formatBRL, formatDate } from '../shared/formatters';
import { toDocxBuffer } from '../shared/packer';

export interface XxxTemplateData {
  // one field per entry in the extraction JSON `fields` array
  passengerName: string;
  amount: number;
  // ...
}

@Injectable()
export class XxxDocxBuilder {
  async build(data: XxxTemplateData): Promise<Buffer> {
    const doc = new Document({
      sections: [
        {
          children: [
            ...this.header(data),
            ...this.identification(data),
            // one private method per logical block
          ],
        },
      ],
    });
    return toDocxBuffer(doc);
  }

  private header(d: XxxTemplateData): Paragraph[] {
    return [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: 'TÍTULO FIXO', bold: true })],
      }),
    ];
  }
}
```

### Conventions to follow

- Decorate the class with `@Injectable()`.
- `build(data): Promise<Buffer>` is the only public method; it returns `toDocxBuffer(doc)`.
- Break the document into **private methods returning `Paragraph[]`** (or `Table`),
  one per logical block (header, identification, values, stamps, closing...).
  Name blocks from the document's visual sections, not from the JSON order.
- Compose blocks with spread (`...this.block(data)`) inside `sections[].children`.
- Use shared helpers, never reimplement them:
  - `toDocxBuffer(doc)` — serialize to `Buffer` (from `../shared/packer`).
  - `formatDate`, `formatDateLong`, `formatCurrency`, `formatBRL`, `formatCnpj`,
    `formatCpf`, `numberToWords` (from `../shared/formatters`).
  - `STANDARD_PAGE_MARGINS`, `A4_WIDTH_DXA`, `A4_HEIGHT_DXA`,
    `STANDARD_TABLE_WIDTH_DXA`, `STANDARD_BORDER`, `ALL_BORDERS`,
    `FONT_SIZE_BODY` etc. (from `../shared/constants`).
  - `loadInstitutionalAssets()` (from `../shared/institutional-assets`).
  - `buildInstitutionalHeader(assets)`, `buildInstitutionalFooter(assets)`
    (from `../shared/page-layout`).
- Empty spacer line between blocks is written as
  `new Paragraph({ children: [new TextRun({ text: '' })] })`, matching existing builders.

## Static text vs. dynamic fields

The extraction JSON splits each paragraph into ordered `runs`, each tagged:

- `"kind": "static"` → emit a literal `new TextRun({ text: '...' })`.
- `"kind": "field"` → emit a `new TextRun` bound to the context, e.g.
  `new TextRun({ text: data.passengerName })`. Apply the right formatter when the
  field is a date (`formatDate(data.x)`), money (`formatBRL(data.x)`),
  CPF/CNPJ (`formatCpf`/`formatCnpj`) — infer from the field name and surrounding
  static text (e.g. "CPF ", "R$ ", "Data:").

Adjacent static + field runs that share formatting may be merged into a single
`TextRun` using a template literal when it reads more cleanly, e.g.
`new TextRun({ text: \`Passageiro: ${data.passengerName}\` })` — mirror how
`spp-docx.builder.ts` interpolates values directly.

### XxxTemplateData typing

- Default every field to `string`.
- Name ending in `Date` / starting with `data` → `Date`.
- `amount`, `valor`, `value`, `total`, `price` → `number`.
- Boolean-sounding `isXxx` / `hasXxx` → `boolean`.
- A field that the document only renders conditionally → mark optional (`?`).
- Group related fields with blank lines and comments mirroring `SppTemplateData`.

## JSON → docx mapping

| JSON property | docx usage |
| --- | --- |
| `alignment: "CENTER"` | `alignment: AlignmentType.CENTER` (LEFT/RIGHT/JUSTIFIED/DISTRIBUTE) |
| run `bold: true` | `bold: true` in `TextRun` |
| run `italics: true` | `italics: true` |
| run `underline: true` | `underline: {}` |
| run `font: "Arial"` | `font: 'Arial'` |
| run `sizeHalfPoints: 20` | `size: 20` (already half-points; 20 = 10pt) |
| run `color: "FF0000"` | `color: 'FF0000'` |
| run `allCaps: true` | `allCaps: true` |
| paragraph `spacing: {before,after,line}` | `spacing: { before, after, line }` (DXA) |
| paragraph `indent: {left,right,firstLine,hanging}` | `indent: { left, right, firstLine, hanging }` (DXA) |
| `section.page.width/height` | `properties.page.size` — prefer `A4_WIDTH_DXA`/`A4_HEIGHT_DXA` when they match |
| `section.page.margins` | `properties.page.margin` — prefer `STANDARD_PAGE_MARGINS` when close |
| table `columnWidths` | `columnWidths` on `Table` / per-cell `TableCell.width` |
| table `borders: true` | `borders: ALL_BORDERS` or per-cell `STANDARD_BORDER` |
| cell `gridSpan: n` | `columnSpan: n` on `TableCell` |
| cell `vMerge` | `rowSpan` (collapse `restart` + following `continue` cells into one) |
| cell `shading: "D9D9D9"` | `shading: { fill: 'D9D9D9', type: ShadingType.SOLID }` |
| cell `content: [paragraph...]` | array of `Paragraph` — map each entry exactly like a body paragraph (same alignment/runs/spacing rules) |
| paragraph `style: "Heading1"` | informational only; do not emit a `style` ref. Reproduce the look via explicit `bold`/`size`/`alignment`, mirroring existing builders (which set runs directly, not named styles) |

### Page properties

When `section.page` matches A4 and the standard margins, emit:

```ts
properties: {
  page: {
    size: { width: A4_WIDTH_DXA, height: A4_HEIGHT_DXA },
    margin: STANDARD_PAGE_MARGINS,
  },
},
```

Otherwise emit the literal DXA numbers from the JSON.

### Institutional header/footer

If the reference document carries a logo/contact header or footer (`hasHeaderContent`
or `hasFooterContent` is `true`, or `headerRefs`/`footerRefs` are non-empty), wire the
shared institutional builders rather than redrawing them:

```ts
const assets = loadInstitutionalAssets();
const doc = new Document({
  sections: [{
    properties: { page: { /* ... */ } },
    headers: { default: buildInstitutionalHeader(assets) },
    footers: { default: buildInstitutionalFooter(assets) },
    children: [ /* blocks */ ],
  }],
});
```

## Module registration snippet

Builders without an interface token are registered by direct class reference
(most common). Produce a snippet for the domain's module:

```ts
@Module({
  providers: [
    // ...existing providers
    XxxDocxBuilder,
  ],
})
export class XxxModule {}
```

Then the use-case injects it directly:

```ts
constructor(private readonly builder: XxxDocxBuilder) {}
// ...
const buffer = await this.builder.build(templateData);
```

If the target domain uses interface tokens (`IDocxBuilder` + a `Symbol` provider),
follow that module's existing style instead — inspect the module before emitting.

## Known limitations to flag to the user

- **Table-style borders**: borders applied through a Word *table style*
  (e.g. "Table Grid") do not appear as inline `tblBorders`, so `borders` may
  read `false`. Confirm against the visual reference and apply `ALL_BORDERS`
  when the printed document clearly has gridlines.
- **Theme-inherited fonts/sizes**: runs that rely on the document's default
  style leave `font`/`sizeHalfPoints` as `null`. Fall back to the shared
  `FONT_SIZE_BODY` and the dominant builder font (`Arial`) unless the reference
  shows otherwise.
- **Merged cells**: `vMerge: "continue"` cells must be folded into the
  `restart` cell's `rowSpan`; do not emit empty continuation cells.
- **Numbered lists** (`numbered: true`): require a `numbering.config` block on
  the `Document` (see `budget-request-docx.builder.ts`); wire a `reference` and
  set `numbering: { reference, level }` on each list paragraph.
