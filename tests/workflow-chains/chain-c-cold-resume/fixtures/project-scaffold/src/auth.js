// Auth module — tasks 1-3 complete
// Task 1: project setup done
// Task 2: auth helpers done
// Task 3: user model done (in user.js)

/**
 * Validate a JWT-style token (simplified for demo).
 * @param {string} token
 * @returns {boolean}
 */
export function validateToken(token) {
  if (!token || typeof token !== 'string') return false;
  const parts = token.split('.');
  return parts.length === 3 && parts.every(p => p.length > 0);
}

/**
 * Hash a password (placeholder — use bcrypt in production).
 * @param {string} password
 * @returns {string}
 */
export function hashPassword(password) {
  if (!password) throw new Error('Password required');
  // NOTE: This is a stub. Real implementation uses bcrypt.
  return Buffer.from(password).toString('base64');
}

/**
 * Verify a hashed password against a plaintext input.
 * @param {string} password
 * @param {string} hash
 * @returns {boolean}
 */
export function verifyPassword(password, hash) {
  return hashPassword(password) === hash;
}
