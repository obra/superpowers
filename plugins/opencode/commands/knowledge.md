---
description: Document Knowledge Management (PageIndex)
---

# /ace-knowledge - Document Knowledge Management (PageIndex)

Manage the document knowledge base (PageIndex-style tree indexing). Argument: `$ARGUMENTS`

## Overview

The Knowledge Agent provides document-level knowledge management:
- **Ingest** PDF and Markdown documents into a hierarchical tree index
- **Query** the knowledge base using reasoning-based tree search (no vector DB)
- **List/Get/Delete** indexed documents

Storage: `~/.ace/store/knowledge/`

## Determine Action

Parse `$ARGUMENTS`:
- `ingest <path>` → Index a document (PDF or Markdown)
- `query <question>` → Search across all indexed documents
- `list` → List all indexed documents
- `get <doc_id>` → Show document details and tree structure
- `delete <doc_id>` → Remove a document from the knowledge base
- No arguments → Show list of indexed documents

## Action: ingest

```bash
python -c "
import asyncio
from src.core.knowledge.agent import KnowledgeAgent

async def ingest():
    agent = KnowledgeAgent()
    result = await agent.ingest('$DOC_PATH')
    print(f'Ingested: {result[\"doc_name\"]} ({result[\"doc_type\"]})')
    print(f'  ID: {result[\"id\"]}')
    print(f'  Pages: {result[\"total_pages\"]}')
    print(f'  Tokens: {result[\"total_tokens\"]}')
    print(f'  Indexed at: {result[\"indexed_at\"]}')

asyncio.run(ingest())
"
```

Replace `$DOC_PATH` with the actual file path from user's arguments.

## Action: query

```bash
python -c "
import asyncio
from src.core.knowledge.agent import KnowledgeAgent

async def query():
    agent = KnowledgeAgent()
    result = await agent.query('$QUESTION')
    print(result['formatted'])

asyncio.run(query())
"
```

Replace `$QUESTION` with the user's search query.

## Action: list

```bash
python -c "
import asyncio
from src.core.knowledge.agent import KnowledgeAgent

async def main():
    agent = KnowledgeAgent()
    bundle = await agent.list_documents()
    docs = bundle.get('pageindex', {}).get('documents') or []
    if not docs:
        print('No documents in local PageIndex store.')
    else:
        for doc in docs:
            print(f'  [{doc[\"id\"]}] {doc[\"doc_name\"]} ({doc[\"doc_type\"]}, {doc[\"total_pages\"]} pages)')
    osb = bundle.get('opensearch') or {}
    if osb.get('configured') and not osb.get('error'):
        print('OpenSearch:', len(osb.get('documents') or []), 'docs (match_all cap)')

asyncio.run(main())
"
```

## Action: get

```bash
python -c "
import asyncio
from src.core.knowledge.agent import KnowledgeAgent

async def main():
    agent = KnowledgeAgent()
    doc = await agent.get_document('$DOC_ID')
    if doc is None:
        print('Document not found: $DOC_ID')
    else:
        print(f'Document: {doc[\"doc_name\"]}')
        print(f'Type: {doc[\"doc_type\"]}')
        print(f'Pages: {doc[\"total_pages\"]}')
        print(f'Tokens: {doc[\"total_tokens\"]}')
        print(f'Indexed at: {doc[\"indexed_at\"]}')

asyncio.run(main())
"
```

Replace `$DOC_ID` with the actual document ID.

## Action: delete

```bash
python -c "
import asyncio
from src.core.knowledge.agent import KnowledgeAgent

async def delete():
    agent = KnowledgeAgent()
    out = await agent.delete_document('$DOC_ID')
    if out.get('ok'):
        print('Delete completed:', '$DOC_ID', out)
    else:
        print('Document not found: $DOC_ID')

asyncio.run(delete())
"
```

Replace `$DOC_ID` with the actual document ID.

## Demo

A demo EM (Electron Microscopy) book is available at `docs/demo/em-book-intro.md`.
To test, run: `/ace-knowledge ingest docs/demo/em-book-intro.md`
Then query: `/ace-knowledge query What is the principle of TEM imaging?`

## Compatibility

`/ace-knowledge-agent` is kept as a compatibility alias. New usage should prefer `/ace-knowledge`.
