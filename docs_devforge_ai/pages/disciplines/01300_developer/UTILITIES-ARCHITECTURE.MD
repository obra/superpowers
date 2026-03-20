# Utilities Architecture (0250)

This document describes the architecture and organization of utility scripts and tools within the project.

## PDF Processing Utilities

The `utils/pdf-processing/` directory contains utilities for processing PDF files.

## Automated Template Generation Utilities

The project includes automated scripts to facilitate the creation and management of organization-specific codebases based on a master template. These utilities are a key part of the [Optimized Architecture for Organization-Specific Deployments](../0200_SYSTEM_ARCHITECTURE.md#optimized-architecture-for-organization-specific-deployments) and are located in the `scripts/` directory.

These scripts handle tasks such as:
- Copying the master template structure (handled by `./scripts/create-org-template.sh`)
- Renumbering 5-digit page prefixes in file names, component names, CSS classes, and references
- Updating configuration files with organization-specific settings
- Setting up organization-specific asset directories

For a detailed explanation of the Optimized Architecture and the role of these utilities within it, please refer to the [System Architecture](../0200_SYSTEM_ARCHITECTURE.md#optimized-architecture-for-organization-specific-deployments) document.

### HTML to PDF Conversion

The `utils/pdf-processing/node/0250-html-to-pdf.js` utility is used to convert HTML files to PDF format. It uses the Puppeteer library to render HTML and generate PDF documents.
