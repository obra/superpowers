'use strict';

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email));
}

function validatePassword(pw) {
  return typeof pw === 'string' && pw.length >= 8;
}

function validateRequired(body, fields) {
  return fields.filter((f) => body[f] === undefined || body[f] === null || body[f] === '');
}

function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

module.exports = { validateEmail, validatePassword, validateRequired, asyncHandler };
