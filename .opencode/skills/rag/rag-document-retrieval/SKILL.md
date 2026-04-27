---
name: rag-document-retrieval
description: Búsqueda semántica de documentos con RAG (Retrieval-Augmented Generation)
compatibility: opencode
metadata:
  output-quality: senior-analyst
  stack: dotnet-9-10
  vector-store: sqlite-embeddings
---

## Qué hago

Implemento búsqueda semántica de documentos usando RAG (Retrieval-Augmented Generation):
- **Carga** documentos (PDF, Excel, Word) al vector store
- **Chunkifica** texto con overlap para contexto preservado
- **Genera embeddings** con PCAI (Qwen3-Embedding-0.6B)
- **Busca por similitud** coseno
- **Retorna resultados** con citas trazables

## Cuándo usarme

- Usuario necesita buscar en documentación grande (100+ páginas)
- Preguntas en lenguaje natural sobre documentos
- Migraciones: encontrar reglas de negocio en docs legacy
- Soporte técnico: responder basado en manuales
- Contexto para agentes: inyectar documentación relevante

## Arquitectura

```
┌─────────────┐
│  Document   │
│  (PDF/XLSX) │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Parse     │
│  (texto)    │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Chunk     │
│ (500 tokens)│
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Embedding  │
│  (Qwen3)    │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   SQLite    │
│ Vector Store│
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Search    │
│(similitud)  │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Results +  │
│  Citations  │
└─────────────┘
```

## Operaciones

### 1. Load (Cargar documentos)

```typescript
rag-store({
  operation: "load",
  documents: ["docs/manual.pdf", "docs/specs.xlsx"],
  chunk_size: 500,
  chunk_overlap: 100
})
```

**Proceso**:
1. Parsea cada documento
2. Divide en chunks (500 tokens, 100 overlap)
3. Genera embedding para cada chunk
4. Guarda en SQLite con metadata

**Output**:
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

### 2. Search (Búsqueda semántica)

```typescript
rag-store({
  operation: "search",
  query: "¿cómo se configura autenticación JWT?",
  top_k: 5,
  filters: { format: "pdf" }
})
```

**Proceso**:
1. Genera embedding del query
2. Calcula similitud coseno con todos los chunks
3. Ordena por similitud
4. Retorna top-k con metadata

**Output**:
```json
{
  "query": "¿cómo se configura autenticación JWT?",
  "results": [
    {
      "chunk_id": "xyz789...",
      "file_path": "docs/manual.pdf",
      "format": "pdf",
      "content": "Para configurar autenticación JWT...",
      "similarity": 0.89,
      "citation": "manual.pdf"
    }
  ],
  "total_found": 5
}
```

### 3. List (Listar documentos)

```typescript
rag-store({
  operation: "list",
  filters: { format: "pdf" }
})
```

**Output**:
```json
{
  "documents": [
    {
      "id": "abc123...",
      "file_path": "docs/manual.pdf",
      "format": "pdf",
      "loaded_at": "2025-01-15T10:30:00",
      "chunk_count": 45
    }
  ],
  "total": 3
}
```

### 4. Delete (Eliminar documento)

```typescript
rag-store({
  operation: "delete",
  query: "abc123..."  // doc_id
})
```

**Output**:
```json
{
  "deleted": true,
  "doc_id": "abc123...",
  "chunks_deleted": 45
}
```

## Configuración de Embeddings

### Variables de entorno (.env)

```bash
# Endpoint de embeddings PCAI
PCAI_EMBEDDINGS_URL=https://emb-qwen3-06b-042026.project-pyxiia-proyectos.serving.ai-application.ciisagl.local/v1

# Modelo de embeddings
PCAI_EMBEDDINGS_MODEL=Qwen/Qwen3-Embedding-0.6B
```

### Dimensiones

- **Qwen3-Embedding-0.6B**: 1024 dimensiones
- **Similitud coseno**: Rango [-1, 1], más cercano a 1 = más similar

## Estrategias de Búsqueda

### 1. Semantic Search (default)

```typescript
rag-store({
  operation: "search",
  query: "autenticación de usuarios",
  top_k: 5
})
```

**Ventajas**:
- Entiende sinonimos y contexto
- No requiere keywords exactas
- Funciona con preguntas naturales

### 2. Filtered Search

```typescript
rag-store({
  operation: "search",
  query: "autenticación",
  filters: { format: "pdf" },
  top_k: 5
})
```

**Filtros soportados**:
- `format`: "pdf", "xlsx", "docx"
- `tag`: (requiere tagging manual al cargar)

### 3. Hybrid Search (futuro)

Combinar semantic + keyword matching (TF-IDF, BM25).

## Chunking Strategy

### Configuración default

```typescript
{
  chunk_size: 500,      // tokens por chunk
  chunk_overlap: 100    // tokens de overlap
}
```

### ¿Por qué overlap?

```
Chunk 1: [tokens 0-500]
Chunk 2: [tokens 400-900]  ← 100 tokens de overlap
Chunk 3: [tokens 800-1300]
```

**Beneficios**:
- Contexto preservado entre chunks
- Evita cortar ideas a la mitad
- Mejor calidad de búsqueda

### Ajustar chunking

```typescript
rag-store({
  operation: "load",
  documents: ["docs/manual.pdf"],
  chunk_size: 1000,     // Más contexto por chunk
  chunk_overlap: 200    // Más overlap
})
```

**Recomendaciones**:
- **Documentos técnicos**: 500-800 tokens
- **Documentos legales**: 300-500 tokens (más precisión)
- **Manuales**: 800-1000 tokens (más contexto)

## Citation Tracking

Cada resultado incluye:
- `file_path`: Ruta completa del documento
- `citation`: Nombre del archivo (para mostrar)
- `chunk_index`: Posición del chunk en el documento
- `metadata`: Metadata del documento (título, autor, etc.)

### Ejemplo de uso en respuesta

```markdown
Según el documento **manual.pdf**:

> "Para configurar autenticación JWT, agregue el middleware..."

*Fuente: manual.pdf, chunk 23, similitud: 0.89*
```

## Errores Comunes

| Error | Causa | Solución |
|-------|-------|----------|
| "Error obteniendo embedding" | PCAI_EMBEDDINGS_URL no configurado | Agregar al .env |
| "Documento ya cargado" | Intenta cargar mismo archivo 2 veces | Usar `operation: delete` primero |
| "No se encontraron resultados" | Query muy específico o docs no cargados | Ampliar query o verificar `operation: list` |
| "Timeout en embeddings" | Documento muy grande | Reducir `chunk_size` o procesar en lotes |

## Integración con Agentes

### @rag-specialist

Agente especializado que usa esta skill:
- Gestiona carga de documentos
- Realiza búsquedas complejas
- Inyecta contexto en conversaciones

### @analyst / @architect

Para migraciones:
```
1. Cargar documentación legacy al RAG
2. Buscar reglas de negocio relevantes
3. Extraer patrones de arquitectura
4. Documentar en plan de migración
```

### @builder

Para implementación:
```
1. Cargar especificaciones técnicas
2. Buscar patrones de implementación
3. Generar código basado en docs
```

## Casos de Uso

### 1. Soporte Técnico

```
Contexto: Manual de 500 páginas

Flujo:
1. Cargar manual al RAG
2. Usuario: "¿cómo reseteo mi password?"
3. RAG busca secciones relevantes
4. Responde con citas del manual
```

### 2. Migración Legacy

```
Contexto: 100+ PDFs con reglas de negocio

Flujo:
1. Cargar todos los PDFs
2. Buscar: "reglas de validación de pedidos"
3. Extraer reglas de chunks relevantes
4. Mapear a especificaciones nuevas
```

### 3. Onboarding de Desarrolladores

```
Contexto: Documentación de arquitectura

Flujo:
1. Cargar docs de arquitectura
2. Nuevo dev: "¿cómo funciona autenticación?"
3. RAG retorna secciones relevantes
4. Dev lee con contexto apropiado
```

## Dependencias

```bash
pip install PyMuPDF openpyxl python-docx numpy requests --break-system-packages
```

O ejecutar:
```bash
bash .opencode/scripts/install-rag-deps.sh
```

## Referencias

- [RAG Pattern](https://patterns.ai/rag.html)
- [Qwen3 Embeddings](https://huggingface.co/Qwen/Qwen3-Embedding-0.6B)
- [Cosine Similarity](https://en.wikipedia.org/wiki/Cosine_similarity)
- [Chunking Strategies](https://www.pinecone.io/learn/chunking-strategies/)
