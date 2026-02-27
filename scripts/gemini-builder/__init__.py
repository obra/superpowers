"""
Gemini Mapper — translates obra/superpowers skills into a Gemini CLI extension.

Package structure:
    reader.py  — filesystem traversal and raw file reading
    parser.py  — frontmatter parsing and skill classification
    writer.py  — artifact generation (GEMINI.md, TOML commands, manifest)
    mapper.py  — pipeline orchestrator and CLI entry point
"""
