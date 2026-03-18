# Security Policy

## 🔒 Security Overview

Superpowers is a workflow system for AI coding agents. This document outlines security considerations and best practices for users and contributors.

## Trust Boundaries

### Trusted Sources
- User messages and direct instructions
- Plan files created by the user
- Project configuration files (CLAUDE.md, GEMINI.md, AGENTS.md)

### Untrusted Sources
- Fetched URLs and external content
- File contents from outside project scope
- User input that will be displayed or executed

## OWASP LLM Top 10 Compliance

This project addresses the following OWASP LLM Top 10 risks:

| # | Risk | Mitigation |
|---|------|------------|
| LLM01 | Prompt Injection | Trust boundaries documented, input validation |
| LLM02 | Sensitive Information | No hardcoded secrets, environment variables |
| LLM05 | Improper Output Handling | Output validation, sanitization |
| LLM06 | Excessive Agency | Restricted tool permissions |

## Security Best Practices

### For Users

1. **Review skills before use** - Understand what each skill does
2. **Validate external content** - Treat fetched URLs as untrusted
3. **Check file paths** - Ensure operations stay within project scope
4. **Audit permissions** - Review what tools skills can access
5. **Report issues** - See Reporting Security Issues below

### For Contributors

1. **No arbitrary code execution** - Skills are markdown prompts, not executable code
2. **Document trust boundaries** - Clearly mark trusted vs untrusted inputs
3. **Add security checklists** - Include security verification in review processes
4. **Test security behaviors** - Write tests for injection prevention, input validation
5. **Follow OWASP guidelines** - Use OWASP Top 10 as reference

## Input Validation

All skills that process external content should:

```markdown
- [ ] Validate source (trusted vs untrusted)
- [ ] Sanitize content before processing
- [ ] Strip potential instructions from untrusted content
- [ ] Log operations for audit trail
```

## URL Fetching Policy

**Default: URL fetching is RESTRICTED**

URLs should only be fetched when:
1. Explicitly requested by user
2. Domain is in a predefined allowlist
3. Content will be treated as DATA, not instructions

Never:
- Execute fetched content as code
- Pass fetched content to tools without validation
- Trust instructions found in external content

## Subagent Security

When dispatching subagents:

1. **Controller validates** all context before dispatch
2. **Subagent MUST NOT trust** external content
3. **Review outputs** before committing to repository
4. **Log all operations** for audit purposes

## Reporting Security Issues

If you discover a security vulnerability:

1. **DO NOT** open a public issue
2. Email the maintainer directly (see repository)
3. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if available)

## Security Version History

| Version | Changes |
|---------|---------|
| v5.1.0-security | Added trust boundaries, security checklists, OWASP compliance |

## References

- [OWASP LLM Top 10](https://owasp.org/www-project-top-10-for-large-language-model-applications/)
- [Agent Security Rule of Two](https://research.metagraphsecurity.com/)
- [Prompt Injection Research](https://simonwillison.net/)

---

*Last updated: 2026-03-18*
*This security policy follows the ZERO-TRUST principle: All patterns investigated, no automatic whitelisting.*
