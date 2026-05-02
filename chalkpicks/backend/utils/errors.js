'use strict';

class ApiError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
  }
}

const errors = {
  validation: (msg) => new ApiError(msg, 400, 'VALIDATION_ERROR'),
  notFound: (msg = 'Not found') => new ApiError(msg, 404, 'NOT_FOUND'),
  unauthorized: (msg = 'Unauthorized') => new ApiError(msg, 401, 'UNAUTHORIZED'),
  forbidden: (msg = 'Forbidden') => new ApiError(msg, 403, 'FORBIDDEN'),
};

module.exports = { ApiError, errors };
