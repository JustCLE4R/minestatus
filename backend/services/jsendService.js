/**
 * JSend Response Format Service
 * 
 * Implements the JSend specification for consistent API responses
 * https://github.com/omniti-labs/jsend
 */

/**
 * Create a JSend formatted response object
 * @param {string} status - Response status: 'success', 'fail', or 'error'
 * @param {*} data - Response data (for success/fail)
 * @param {string} message - Error message (for error status)
 * @returns {Object} JSend formatted response
 */
const jsend = (status, data = null, message = null) => {
  const response = { status };

  if (data !== null) {
    response.data = data;
  }

  if (message) {
    response.message = message;
  }

  return response;
};

/**
 * Enhanced jsend with automatic HTTP response
 * Automatically sets appropriate status codes and sends JSON response
 * @param {Object} res - Express response object
 * @param {string} status - Response status: 'success', 'fail', or 'error'
 * @param {*} data - Response data (for success/fail)
 * @param {string} message - Error message (for error status)
 * @param {number} statusCode - Optional custom HTTP status code
 */
const jsendResponse = (res, status, data = null, message = null, statusCode = null) => {
  const response = jsend(status, data, message);
  
  // Auto-determine status code if not provided
  if (!statusCode) {
    switch (status) {
      case 'success':
        statusCode = 200;
        break;
      case 'fail':
        statusCode = 400;
        break;
      case 'error':
        statusCode = 500;
        break;
      default:
        statusCode = 200;
    }
  }
  
  res.status(statusCode).json(response);
};

/**
 * Convenience methods for common response types
 */
const success = (res, data = null, statusCode = 200) => {
  jsendResponse(res, 'success', data, null, statusCode);
};

const fail = (res, data = null, statusCode = 400) => {
  jsendResponse(res, 'fail', data, null, statusCode);
};

const error = (res, message, statusCode = 500) => {
  jsendResponse(res, 'error', null, message, statusCode);
};

module.exports = jsend;
module.exports.response = jsendResponse;
module.exports.success = success;
module.exports.fail = fail;
module.exports.error = error;