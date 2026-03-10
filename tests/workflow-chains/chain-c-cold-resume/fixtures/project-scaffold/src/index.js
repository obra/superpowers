// Entry point — task 1 complete
import { validateToken } from './auth.js';

console.log('Auth system initialized');
console.log('Token validation available:', typeof validateToken === 'function');
