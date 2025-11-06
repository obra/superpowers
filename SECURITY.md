# Security Policy

## Supported Versions

We release security updates for the following versions of Superpowers:

| Version | Supported          |
| ------- | ------------------ |
| 3.4.x   | :white_check_mark: |
| 3.3.x   | :white_check_mark: |
| 3.2.x   | :x:                |
| < 3.2   | :x:                |

## Reporting a Vulnerability

We take the security of Superpowers seriously. If you discover a security vulnerability, please follow these steps:

### How to Report

1. **DO NOT** open a public GitHub issue for security vulnerabilities
2. Email security reports to: **jesse@fsck.com**
3. Include the following information:
   - Description of the vulnerability
   - Steps to reproduce the issue
   - Potential impact
   - Suggested fix (if available)
   - Your contact information

### What to Expect

- **Acknowledgment**: We will acknowledge receipt of your report within 48 hours
- **Initial Assessment**: We will provide an initial assessment within 5 business days
- **Updates**: We will keep you informed of our progress
- **Resolution**: We aim to resolve critical vulnerabilities within 30 days
- **Credit**: With your permission, we will credit you in the release notes

### Disclosure Policy

- Please allow us adequate time to address the vulnerability before public disclosure
- We follow coordinated disclosure practices
- We will notify you before publicly disclosing the vulnerability
- Security advisories will be published on GitHub Security Advisories

## Security Best Practices

When using Superpowers, follow these security best practices:

### For Users

1. **Keep Updated**: Always use the latest version of Superpowers
2. **Review Skills**: Review skill content before installation, especially from third parties
3. **Monitor Hooks**: Be aware of what hooks execute on session start
4. **Use Sandboxes**: Test new skills in sandboxed environments first
5. **Check Permissions**: Ensure file permissions are restrictive (700 for config directories)

### For Contributors

1. **Code Review**: All code changes require security review
2. **No Secrets**: Never commit secrets, tokens, or credentials
3. **Input Validation**: Always validate and sanitize user inputs
4. **Secure Shell**: Use `set -euo pipefail` in all bash scripts
5. **Dependency Scanning**: Run security scans on dependencies
6. **Least Privilege**: Scripts should run with minimal required permissions

## Known Security Considerations

### Git Repository Cloning

- Skills are cloned from GitHub repositories
- Repository integrity should be verified
- Consider enabling GPG verification for commits

### Shell Script Execution

- Hooks execute shell scripts automatically on session start
- Scripts run with user privileges
- Always review hook content before installation

### File System Access

- Skills have access to the file system
- Configuration stored in `~/.config/superpowers/`
- Backup directories may contain sensitive data

## Security Updates

Security updates are published through:

1. **GitHub Security Advisories**: https://github.com/obra/superpowers/security/advisories
2. **Release Notes**: Check RELEASE-NOTES.md for security fixes
3. **Plugin Updates**: Security patches delivered through Claude Code plugin updates

## Vulnerability Response Process

When a vulnerability is reported, we follow this process:

1. **Triage**: Assess severity and impact (Critical, High, Medium, Low)
2. **Investigation**: Reproduce and analyze the vulnerability
3. **Development**: Create and test a fix
4. **Review**: Security review of the fix
5. **Release**: Publish security update
6. **Disclosure**: Public disclosure with credit to reporter

## Security Audit History

| Date       | Audit Type        | Findings | Status   |
|------------|-------------------|----------|----------|
| 2025-11-06 | External Security | 6 Medium-High | Addressed |

## Contact

- **Security Email**: jesse@fsck.com
- **GitHub**: https://github.com/obra/superpowers
- **Website**: https://github.com/obra/superpowers

## Acknowledgments

We would like to thank the following security researchers for their responsible disclosure:

- [List will be updated as vulnerabilities are reported and fixed]

---

**Last Updated**: November 6, 2025
