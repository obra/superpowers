# 1363 - Loader Templates Management

## Overview
Loader Templates provide a standardized way to configure document loaders for the Vector Search System. They integrate with Flowise document stores (see [1360](1360_FLOWISE_DOCUMENT_STORE_IMPLEMENTATION_PLAN.md)) to streamline document ingestion and processing.

## Key Features
- Pre-configured loader settings for common document types
- Centralized management through the DevSettings interface
- Integration with Flowise document stores
- Support for custom loader configurations

## Management Interface
Loader Templates can be managed via the `LoaderTemplatesTable` component in the DevSettings section (`client/src/pages/02050-information-technology/components/DevSettings/`).

## Configuration Options
Each loader template supports:
- Document type specification
- Chunk size configuration
- Metadata extraction rules
- Pre-processing hooks

## Usage Examples
```javascript
// Example loader template configuration
{
  "loaderType": "pdf",
  "chunkSize": 1000,
  "metadataFields": ["author", "date"],
  "preProcess": "cleanHeaders"
}
```

## Related Documentation
- [1360: Flowise Document Store Implementation](1360_FLOWISE_DOCUMENT_STORE_IMPLEMENTATION_PLAN.md)
- [1361: Flowise Document Store Deployment](1361_FLOWISE_DOCUMENT_STORE_DEPLOYMENT_GUIDE.md)
- [1362: Flowise Record Manager Setup](1362_FLOWISE_RECORD_MANAGER_SETUP_GUIDE.md)
