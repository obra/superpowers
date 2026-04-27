# rag-load

Carga documentos al vector store RAG.

## Uso

```bash
rag-store --op load --docs '<JSON_ARRAY>' [--chunk-size <SIZE>] [--chunk-overlap <OVERLAP>]
```

## Argumentos

| Argumento | Requerido | Default | Descripción |
|-----------|-----------|---------|-------------|
| `--docs` | Sí | - | JSON array con rutas de documentos |
| `--chunk-size` | No | 500 | Tamaño de chunk en tokens |
| `--chunk-overlap` | No | 100 | Overlap entre chunks en tokens |

## Ejemplos

### Cargar un documento

```bash
rag-store --op load --docs '["docs/manual.pdf"]'
```

### Cargar múltiples documentos

```bash
rag-store --op load --docs '["docs/manual.pdf","docs/specs.xlsx","docs/requirements.docx"]'
```

### Cargar con chunking custom

```bash
rag-store --op load \
  --docs '["docs/manual.pdf"]' \
  --chunk-size 800 \
  --chunk-overlap 200
```

## Desde OpenCode TUI

```
@rag-specialist carga estos documentos: docs/manual.pdf, docs/specs.xlsx
```

## Formatos Soportados

| Formato | Extensiones |
|---------|-------------|
| PDF | .pdf |
| Excel | .xlsx, .xls |
| Word | .docx, .doc |

## Output

```json
{
  "loaded": [
    {
      "file": "docs/manual.pdf",
      "chunks": 45,
      "total_tokens": 22500,
      "doc_id": "abc123..."
    }
  ],
  "errors": []
}
```

## Pre-requisitos

- Variables de entorno configuradas en `.env`
- Dependencias instaladas (`install-rag-deps.sh`)

## Comandos relacionados

- `rag-search`: Buscar en documentos cargados
- `rag-store --op list`: Listar documentos cargados
- `rag-store --op delete`: Eliminar documento

## Agente relacionado

- `@rag-specialist`: Especialista en gestión documental RAG
