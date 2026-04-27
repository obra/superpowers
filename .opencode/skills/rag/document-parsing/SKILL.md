---
name: document-parsing
description: Parsea documentos PDF, Excel, Word y extrae texto estructurado
compatibility: opencode
metadata:
  output-quality: senior-analyst
  stack: dotnet-9-10
  formats: pdf-xlsx-docx
---

## Qué hago

Parseo documentos en formatos comunes y extraigo texto estructurado listo para:
- RAG (Retrieval-Augmented Generation)
- Migraciones de documentación legacy
- Análisis de contenido
- Indexación y búsqueda

## Formatos Soportados

| Formato | Extensión | Librería | Qué extrae |
|---------|-----------|----------|------------|
| **PDF** | .pdf | PyMuPDF (fitz) | Texto por página, headers, metadata, font sizes |
| **Excel** | .xlsx, .xls | openpyxl | Sheets, headers, rows, metadata |
| **Word** | .docx, .doc | python-docx | Secciones por heading, párrafos, metadata |

## Cuándo usarme

- Usuario necesita procesar documentación legacy (PDFs, Excels, Words)
- Migración de arquitectura: extraer reglas de negocio de documentos
- Cargar documentos al RAG para búsqueda semántica
- Analizar manuales técnicos, planes de proyecto, especificaciones

## Proceso de Parsing

### 1. PDF (PyMuPDF)

```python
# Estructura de output
{
  "file": "documento.pdf",
  "format": "pdf",
  "metadata": {
    "pages": 50,
    "title": "...",
    "author": "...",
    "creation_date": "..."
  },
  "sections": [
    {
      "page": 1,
      "content": "texto completo de la página",
      "headers": [
        {"text": "Título Principal", "page": 1, "size": 24, "font": "Arial"}
      ],
      "word_count": 500,
      "char_count": 3000,
      "base_font_size": 12
    }
  ],
  "total_word_count": 25000
}
```

**Detección de Headers**:
- Tamaño de fuente > 14px = header
- Extrae font family y size
- Útil para reconstruir jerarquía del documento

### 2. Excel (openpyxl)

```python
{
  "file": "datos.xlsx",
  "format": "xlsx",
  "metadata": {
    "sheets": 3,
    "sheet_names": ["Hoja1", "Hoja2", "Hoja3"],
    "properties": {"title": "...", "creator": "..."}
  },
  "sheets": [
    {
      "name": "Hoja1",
      "headers": ["ID", "Nombre", "Email", "Rol"],
      "rows": [
        [1, "Juan", "juan@example.com", "Admin"],
        [2, "María", "maria@example.com", "User"]
      ],
      "row_count": 100,
      "col_count": 4,
      "dimensions": "101x4"
    }
  ],
  "total_rows": 300
}
```

**Notas**:
- `data_only=True`: Obtiene valores calculados, no fórmulas
- `read_only=True`: Más eficiente para archivos grandes
- Skip filas vacías

### 3. Word (python-docx)

```python
{
  "file": "manual.docx",
  "format": "docx",
  "metadata": {
    "paragraphs": 200,
    "sections": 5,
    "properties": {"title": "...", "author": "...", "created": "..."}
  },
  "sections": [
    {
      "title": "1. Introducción",
      "content": ["Párrafo 1", "Párrafo 2"],
      "level": 1,
      "paragraph_count": 10
    },
    {
      "title": "1.1 Subsección",
      "content": ["Párrafo 1"],
      "level": 2,
      "paragraph_count": 5
    }
  ],
  "total_sections": 8,
  "total_paragraphs": 150
}
```

**Detección de Headers**:
- Basado en estilos: "Heading 1", "Heading 2", etc.
- "Title" también cuenta como header
- Reconstruye jerarquía de secciones

## Output Esperado

### JSON (default)

```json
{
  "file": "documento.pdf",
  "format": "pdf",
  "metadata": {...},
  "sections": [...],
  "parsed_at": "2025-01-15T10:30:00",
  "worktree": "/path/to/project"
}
```

## Errores Comunes

| Error | Causa | Solución |
|-------|-------|----------|
| "Archivo no encontrado" | Ruta incorrecta | Verificar con `ls` o `dir` |
| "Formato no soportado" | Extensión no reconocida | Usar solo .pdf, .xlsx, .docx |
| "PyMuPDF no instalado" | Falta dependencia | Ejecutar `install-rag-deps.sh` |
| "Error al abrir PDF" | PDF corrupto o protegido | Verificar integridad del archivo |
| "openpyxl no instalado" | Falta dependencia | Ejecutar `install-rag-deps.sh` |

## Integración con RAG

### Flujo completo:

```
1. parse-document → Extrae texto estructurado
2. rag-store (load) → Chunkifica + embeddings + guarda
3. rag-store (search) → Búsqueda semántica
4. rag-document-retrieval skill → Patrones de búsqueda
```

### Ejemplo:

```typescript
// 1. Parsear documento
const parsed = await parseDocument({
  file_path: "docs/manual.pdf",
  format: "auto"
})

// 2. Cargar al RAG
await ragStore({
  operation: "load",
  documents: ["docs/manual.pdf"]
})

// 3. Buscar
const results = await ragStore({
  operation: "search",
  query: "¿cómo se configura autenticación?",
  top_k: 5
})
```

## Dependencias

```bash
pip install PyMuPDF openpyxl python-docx numpy requests --break-system-packages
```

O ejecutar:
```bash
bash .opencode/scripts/install-rag-deps.sh
```

## Casos de Uso

### 1. Migración de Documentación Legacy

```
Contexto: Empresa tiene 100+ PDFs con reglas de negocio

Flujo:
1. parse-document para cada PDF
2. Extraer secciones relevantes
3. Mapear a user stories
4. Generar especificaciones técnicas
```

### 2. RAG para Soporte Técnico

```
Contexto: Manual técnico de 500 páginas

Flujo:
1. Cargar manual al RAG
2. Usuarios preguntan en lenguaje natural
3. RAG busca secciones relevantes
4. Responde con citas del manual
```

### 3. Análisis de Datos en Excels

```
Contexto: Reportes mensuales en Excel

Flujo:
1. parse-document para cada Excel
2. Extraer sheets y datos
3. Consolidar en base de datos
4. Generar reportes consolidados
```

## Referencias

- [PyMuPDF Docs](https://pymupdf.readthedocs.io/)
- [openpyxl Docs](https://openpyxl.readthedocs.io/)
- [python-docx Docs](https://python-docx.readthedocs.io/)
