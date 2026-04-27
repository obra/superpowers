# rag-search

Busca información en documentos cargados al RAG.

## Uso

```bash
rag-store --op search --query '<QUERY>' [--top-k <K>] [--filters '<JSON>'}
```

## Argumentos

| Argumento | Requerido | Default | Descripción |
|-----------|-----------|---------|-------------|
| `--query` | Sí | - | Query de búsqueda en lenguaje natural |
| `--top-k` | No | 5 | Número de resultados (máx 20) |
| `--filters` | No | - | JSON con filtros: `{"format":"pdf"}` |

## Ejemplos

### Búsqueda básica

```bash
rag-store --op search --query "¿cómo se configura autenticación JWT?"
```

### Más resultados

```bash
rag-store --op search \
  --query "autenticación de usuarios" \
  --top-k 10
```

### Con filtros

```bash
rag-store --op search \
  --query "reglas de validación" \
  --filters '{"format":"pdf"}'
```

### Múltiples filtros

```bash
rag-store --op search \
  --query "especificaciones técnicas" \
  --filters '{"format":"docx"}'
```

## Desde OpenCode TUI

```
@rag-specialist busca información sobre autenticación JWT en los documentos
```

## Output

```json
{
  "query": "¿cómo se configura autenticación JWT?",
  "results": [
    {
      "chunk_id": "xyz789...",
      "file_path": "docs/manual.pdf",
      "format": "pdf",
      "content": "Para configurar autenticación JWT, agregue el middleware...",
      "similarity": 0.89,
      "citation": "manual.pdf"
    }
  ],
  "total_found": 5,
  "top_k": 5
}
```

## Interpretación de Resultados

| Campo | Descripción |
|-------|-------------|
| `similarity` | Similitud coseno (0-1), más alto = más relevante |
| `content` | Contenido del chunk (primeros 500 caracteres) |
| `citation` | Nombre del archivo para referenciar |
| `file_path` | Ruta completa del documento |

## Tips de Búsqueda

### Queries efectivas

✅ **Buenas**:
- "¿cómo se configura autenticación JWT?"
- "reglas de validación de pedidos"
- "patrones de integración entre servicios"

❌ **Malas**:
- "autenticación" (muy breve)
- "todo sobre el sistema" (muy vago)
- "asdf123" (sin sentido)

### Ajustar top-k

- **5-10**: Búsquedas específicas
- **10-20**: Investigación exploratoria

### Usar filtros

```bash
# Solo PDFs
--filters '{"format":"pdf"}'

# Solo Excels
--filters '{"format":"xlsx"}'
```

## Pre-requisitos

- Documentos cargados al RAG (`rag-load`)
- Variables de entorno configuradas en `.env`
- Dependencias instaladas (`install-rag-deps.sh`)

## Comandos relacionados

- `rag-load`: Cargar documentos
- `rag-store --op list`: Listar documentos cargados
- `parse-document`: Parsear documento individual

## Agente relacionado

- `@rag-specialist`: Especialista en gestión documental RAG
