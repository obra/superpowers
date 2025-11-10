---
name: secure-implementation-patterns
description: Use when implementing authentication, authorization, secret handling, or processing user input - provides battle-tested security patterns to prevent common vulnerabilities like injection, XSS, and insecure authentication
---

# Secure Implementation Patterns

## Overview

Security vulnerabilities come from custom implementations and trusting user input. Battle-tested libraries and proven patterns prevent common attacks.

**Core principle:** Never implement security-critical code without following proven patterns. Custom crypto/auth = vulnerabilities.

**Violating the letter of these patterns is violating the spirit of security.**

## The Iron Law

```
NO CUSTOM SECURITY IMPLEMENTATIONS WITHOUT EXPERT REVIEW
Use battle-tested libraries. Follow established patterns.
```

Write your own crypto? Delete it. Start over with a library.

Rolling your own authentication? Stop. Use proven solutions.

## When to Use

Use this skill when implementing:

**Always:**
- Authentication (login, registration, password reset)
- Authorization (permissions, access control)
- Secret management (API keys, tokens, credentials)
- User input processing (forms, APIs, file uploads)
- Data encryption (at rest, in transit)
- Session management

**Especially when:**
- You're about to store passwords
- You're handling JWTs or tokens
- You're processing user-supplied data
- You're uploading files
- You're making security decisions

**Don't skip when:**
- "It's just internal" (internal systems get compromised)
- "We'll fix security later" (vulnerabilities ship, never get fixed)
- "This is a prototype" (prototypes become production)

## Security Categories

Before implementing, identify which category applies and use TodoWrite to track the checklist.

### 1. Authentication & Authorization

#### Password Handling

**DO:**
- Use bcrypt, argon2, or scrypt (never MD5, SHA1, SHA256)
- Set appropriate cost factors (bcrypt work factor 10-12)
- Salt automatically (modern libraries handle this)
- Enforce minimum password strength
- Rate limit login attempts

**DON'T:**
- Store passwords in plaintext
- Use weak hashing (MD5, SHA1)
- Implement custom hashing
- Use same salt for all passwords
- Allow unlimited login attempts

**Example (Good):**
```typescript
import bcrypt from 'bcrypt';

async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
}

async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
```

**Example (Bad):**
```typescript
// NEVER DO THIS
import crypto from 'crypto';

function hashPassword(password: string): string {
  return crypto.createHash('md5').update(password).digest('hex'); // INSECURE
}
```

#### JWT Best Practices

**DO:**
- Sign tokens with strong secret (256+ bits)
- Set expiration (short-lived access tokens)
- Use refresh tokens for re-authentication
- Validate signature on every request
- Rotate secrets periodically
- Store secrets in environment variables or secret manager

**DON'T:**
- Use 'none' algorithm
- Trust token payload without signature verification
- Store sensitive data in payload (it's base64, not encrypted)
- Use weak secrets
- Make tokens long-lived without refresh mechanism
- Hardcode secrets in code

**Example (Good):**
```typescript
import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET; // From environment
const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';

function generateAccessToken(userId: string): string {
  return jwt.sign({ userId }, SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY });
}

function verifyToken(token: string): { userId: string } {
  return jwt.verify(token, SECRET) as { userId: string };
}
```

**Example (Bad):**
```typescript
// NEVER DO THIS
import jwt from 'jsonwebtoken';

function generateToken(userId: string): string {
  return jwt.sign({ userId, password: 'secret123' }, 'weak-secret'); // INSECURE
  // - Storing password in token
  // - Weak secret
  // - No expiration
}
```

#### Session Management

**DO:**
- Use secure, httpOnly cookies
- Enable CSRF protection
- Set appropriate session timeout
- Regenerate session ID after login
- Invalidate sessions on logout
- Use SameSite cookie attribute

**DON'T:**
- Store session IDs in localStorage (XSS vulnerable)
- Use predictable session IDs
- Allow session fixation
- Skip CSRF tokens on state-changing operations

### 2. Secret Management

#### Environment Variables

**DO:**
- Store secrets in environment variables
- Use .env files (add to .gitignore)
- Use different secrets for dev/staging/production
- Rotate secrets periodically
- Use secret managers (AWS Secrets Manager, HashiCorp Vault)
- Document required environment variables

**DON'T:**
- Commit secrets to git
- Hardcode secrets in code
- Share secrets in chat/email
- Use same secrets across environments
- Log secrets (even in debug mode)

**Example (Good):**
```typescript
// config.ts
export const config = {
  database: {
    url: process.env.DATABASE_URL,
    password: process.env.DATABASE_PASSWORD,
  },
  api: {
    key: process.env.API_KEY,
  },
};

// Validate at startup
if (!config.database.url) {
  throw new Error('DATABASE_URL environment variable is required');
}
```

**.env** (in .gitignore):
```bash
DATABASE_URL=postgresql://localhost/mydb
DATABASE_PASSWORD=super-secret-password
API_KEY=abc123-secret-key
```

**Example (Bad):**
```typescript
// NEVER DO THIS
export const config = {
  database: {
    password: 'hardcoded-password', // INSECURE - committed to git
  },
  api: {
    key: 'abc123-secret-key', // INSECURE - exposed to all
  },
};
```

### 3. Input Validation & Sanitization

#### SQL Injection Prevention

**DO:**
- Use parameterized queries or prepared statements
- Use ORM with parameterization (Prisma, TypeORM, Sequelize)
- Validate input types
- Use allowlists for dynamic table/column names
- Escape special characters if building raw queries (last resort)

**DON'T:**
- Concatenate user input into SQL
- Trust user input
- Use string interpolation for SQL

**Example (Good):**
```typescript
// Using parameterized query
async function getUser(email: string) {
  return db.query('SELECT * FROM users WHERE email = $1', [email]);
}

// Using ORM
async function getUserByEmail(email: string) {
  return prisma.user.findUnique({ where: { email } });
}
```

**Example (Bad):**
```typescript
// NEVER DO THIS
async function getUser(email: string) {
  return db.query(`SELECT * FROM users WHERE email = '${email}'`); // SQL INJECTION
}
```

#### XSS Prevention

**DO:**
- Escape output by default (use framework defaults)
- Use Content Security Policy headers
- Sanitize HTML if you must accept it (DOMPurify)
- Validate input types
- Use textContent instead of innerHTML

**DON'T:**
- Insert user input directly into HTML
- Use innerHTML with user data
- Disable framework auto-escaping
- Trust user-provided HTML

**Example (Good):**
```typescript
// React auto-escapes
function UserProfile({ name }: { name: string }) {
  return <div>{name}</div>; // Safe - React escapes
}

// Manual escaping if needed
import DOMPurify from 'dompurify';

function renderHTML(userHTML: string) {
  const clean = DOMPurify.sanitize(userHTML);
  return <div dangerouslySetInnerHTML={{ __html: clean }} />;
}
```

**Example (Bad):**
```typescript
// NEVER DO THIS
function UserProfile({ name }: { name: string }) {
  return <div dangerouslySetInnerHTML={{ __html: name }} />; // XSS VULNERABILITY
}
```

#### Command Injection Prevention

**DO:**
- Avoid shell execution with user input
- Use libraries instead of shell commands
- Validate input with strict allowlists
- Use parameterized APIs (child_process.execFile)
- Escape shell arguments if necessary

**DON'T:**
- Pass user input to shell commands
- Use eval() with user input
- Trust user-provided file paths

**Example (Good):**
```typescript
import { execFile } from 'child_process';

// Use execFile with arguments array
function convertImage(inputFile: string) {
  // Validate input
  if (!/^[a-zA-Z0-9_-]+\.jpg$/.test(inputFile)) {
    throw new Error('Invalid filename');
  }

  // Use argument array (no shell)
  execFile('convert', [inputFile, 'output.png'], (error, stdout) => {
    // Handle result
  });
}
```

**Example (Bad):**
```typescript
// NEVER DO THIS
import { exec } from 'child_process';

function convertImage(inputFile: string) {
  exec(`convert ${inputFile} output.png`); // COMMAND INJECTION
}
```

#### Path Traversal Prevention

**DO:**
- Validate file paths
- Use path.join() and path.resolve()
- Check resolved path is within allowed directory
- Use allowlists for file access
- Reject paths with ../ or absolute paths

**DON'T:**
- Concatenate user input into file paths
- Allow arbitrary file access
- Trust user-provided paths

**Example (Good):**
```typescript
import path from 'path';
import fs from 'fs';

const UPLOAD_DIR = '/var/app/uploads';

function readUserFile(filename: string) {
  // Validate filename
  if (!/^[a-zA-Z0-9_-]+\.[a-z]+$/.test(filename)) {
    throw new Error('Invalid filename');
  }

  // Resolve and validate path
  const filePath = path.resolve(UPLOAD_DIR, filename);

  if (!filePath.startsWith(UPLOAD_DIR)) {
    throw new Error('Path traversal attempt');
  }

  return fs.readFileSync(filePath);
}
```

**Example (Bad):**
```typescript
// NEVER DO THIS
import fs from 'fs';

function readUserFile(filename: string) {
  return fs.readFileSync(`/var/app/uploads/${filename}`); // PATH TRAVERSAL
  // User can pass: ../../../../etc/passwd
}
```

### 4. Data Protection

#### Encryption at Rest

**DO:**
- Encrypt sensitive data (PII, financial, health)
- Use AES-256-GCM for encryption
- Store keys separately from data
- Use key management services (AWS KMS, Azure Key Vault)
- Rotate encryption keys
- Document what data is encrypted

**DON'T:**
- Store PII in plaintext
- Use weak encryption (DES, RC4)
- Store encryption keys with data
- Implement custom encryption

#### Secure File Uploads

**DO:**
- Validate file type (check magic bytes, not just extension)
- Limit file size
- Scan for malware
- Store uploads outside web root
- Generate unique filenames (prevent overwrite)
- Set appropriate file permissions
- Use Content-Type validation

**DON'T:**
- Trust file extension
- Allow unlimited file size
- Store uploads in web-accessible directory
- Use user-provided filenames

**Example (Good):**
```typescript
import multer from 'multer';
import path from 'path';
import crypto from 'crypto';

const upload = multer({
  storage: multer.diskStorage({
    destination: '/var/app/private-uploads', // Outside web root
    filename: (req, file, cb) => {
      const uniqueName = crypto.randomBytes(16).toString('hex');
      const ext = path.extname(file.originalname);
      cb(null, `${uniqueName}${ext}`);
    },
  }),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (!allowedTypes.includes(file.mimetype)) {
      cb(new Error('Invalid file type'));
    } else {
      cb(null, true);
    }
  },
});
```

**Example (Bad):**
```typescript
// NEVER DO THIS
import multer from 'multer';

const upload = multer({
  storage: multer.diskStorage({
    destination: '/public/uploads', // WEB ACCESSIBLE
    filename: (req, file, cb) => {
      cb(null, file.originalname); // USER CONTROLLED FILENAME
    },
  }),
  // No size limit
  // No type validation
});
```

## Process Checklist

When implementing security-critical code, use TodoWrite to track:

1. **Identify Category**
   - [ ] What am I implementing? (auth, secrets, input, encryption)
   - [ ] Which patterns apply?

2. **Select Battle-Tested Libraries**
   - [ ] Research proven libraries (bcrypt, jsonwebtoken, etc)
   - [ ] Verify library is actively maintained
   - [ ] Check for known vulnerabilities

3. **Implement with Pattern**
   - [ ] Follow the DO examples
   - [ ] Avoid the DON'T examples
   - [ ] Use parameterization/escaping

4. **Write Security Tests**
   - [ ] Test with malicious input (SQL injection, XSS payloads)
   - [ ] Test authentication failure cases
   - [ ] Test authorization boundaries
   - [ ] Verify secrets not logged or exposed

5. **Review Before Merge**
   - [ ] No secrets in code or git
   - [ ] All user input validated
   - [ ] Using proven libraries (not custom crypto)
   - [ ] Security tests passing

## Common Rationalizations (STOP)

If you catch yourself thinking:

- "I'll use MD5 for now, fix later" → NO. Use bcrypt now.
- "It's just internal, doesn't need security" → NO. Internal systems get breached.
- "Custom implementation is faster" → NO. Security > performance. Profile first.
- "We don't have time for security tests" → NO. Vulnerabilities are expensive.
- "This protects against XSS enough" → NO. Use proven escaping.
- "I'll hardcode the secret temporarily" → NO. Use .env from day one.

## When to Ask for Expert Review

Some security implementations require expert review:

- Custom authentication schemes
- Cryptographic implementations
- Security-critical authorization logic
- Payment processing
- Health/financial data handling
- Compliance requirements (PCI-DSS, HIPAA, SOC2)

**If in doubt, ask before implementing.**

## Integration with Other Skills

- **test-driven-development**: Write security tests first
- **verification-before-completion**: Verify no secrets committed, all tests pass
- **systematic-debugging**: When security issue found, find root cause before patching
- **requesting-code-review**: Always request review for security-critical code
