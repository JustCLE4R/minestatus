/**
 * Centralized Logging Utility
 * 
 * Environment-aware logging service that can be used throughout the application.
 * Provides consistent log formatting and controls verbosity based on NODE_ENV.
 */

class Logger {
  constructor() {
    this.isDev = process.env.NODE_ENV !== 'production';
    this.logLevel = process.env.LOG_LEVEL || (this.isDev ? 'debug' : 'info');
  }

  /**
   * Get log level priority for filtering
   */
  getLevelPriority(level) {
    const priorities = {
      'debug': 0,
      'info': 1,
      'warn': 2,
      'error': 3
    };
    return priorities[level] || 1;
  }

  /**
   * Check if log level should be output
   */
  shouldLog(level) {
    return this.getLevelPriority(level) >= this.getLevelPriority(this.logLevel);
  }

  /**
   * Format log message with timestamp and context
   */
  formatMessage(level, context, message, ...args) {
    const timestamp = new Date().toISOString();
    const levelUpper = level.toUpperCase().padEnd(5);
    const contextStr = context ? `[${context}]` : '';
    
    // In development, use colors and emojis for better readability
    if (this.isDev) {
      const colors = {
        debug: '\x1b[36m', // cyan
        info: '\x1b[32m',  // green
        warn: '\x1b[33m',  // yellow
        error: '\x1b[31m'  // red
      };
      const reset = '\x1b[0m';
      const emoji = {
        debug: '🔍',
        info: 'ℹ️',
        warn: '⚠️',
        error: '❌'
      };
      
      return `${colors[level]}${emoji[level]} [${timestamp}] ${levelUpper}${reset} ${contextStr} ${message}`;
    }
    
    // In production, use clean format without colors
    return `[${timestamp}] ${levelUpper} ${contextStr} ${message}`;
  }

  /**
   * Core logging method
   */
  log(level, context, message, ...args) {
    if (!this.shouldLog(level)) return;
    
    const formattedMessage = this.formatMessage(level, context, message);
    
    switch (level) {
      case 'error':
        console.error(formattedMessage, ...args);
        break;
      case 'warn':
        console.warn(formattedMessage, ...args);
        break;
      case 'info':
        console.info(formattedMessage, ...args);
        break;
      case 'debug':
      default:
        console.log(formattedMessage, ...args);
        break;
    }
  }

  /**
   * Convenience methods for different log levels
   */
  debug(context, message, ...args) {
    this.log('debug', context, message, ...args);
  }

  info(context, message, ...args) {
    this.log('info', context, message, ...args);
  }

  warn(context, message, ...args) {
    this.log('warn', context, message, ...args);
  }

  error(context, message, ...args) {
    this.log('error', context, message, ...args);
  }

  /**
   * Create a context-bound logger for a specific module/service
   */
  createLogger(context) {
    return {
      debug: (message, ...args) => this.debug(context, message, ...args),
      info: (message, ...args) => this.info(context, message, ...args),
      warn: (message, ...args) => this.warn(context, message, ...args),
      error: (message, ...args) => this.error(context, message, ...args),
      log: (level, message, ...args) => this.log(level, context, message, ...args)
    };
  }

  /**
   * Log application startup information
   */
  startup(appName, version, port) {
    if (this.isDev) {
      this.info('STARTUP', `🚀 ${appName} v${version} starting on port ${port}`);
      this.info('STARTUP', `📝 Log level: ${this.logLevel.toUpperCase()}`);
      this.info('STARTUP', `🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
    } else {
      this.info('STARTUP', `${appName} v${version} starting on port ${port}`);
    }
  }

  /**
   * Log application shutdown
   */
  shutdown(appName) {
    this.info('SHUTDOWN', `${appName} shutting down gracefully`);
  }

  /**
   * Log performance metrics
   */
  performance(context, operation, duration, extra = {}) {
    const message = `${operation} completed in ${duration}ms`;
    
    if (duration > 1000) {
      this.warn(context, `${message} (slow operation)`, extra);
    } else if (this.isDev) {
      this.debug(context, message, extra);
    }
  }

  /**
   * Log HTTP requests (for middleware)
   */
  request(method, url, statusCode, duration, userAgent = '') {
    const message = `${method} ${url} ${statusCode} - ${duration}ms`;
    
    if (statusCode >= 500) {
      this.error('HTTP', message, { userAgent });
    } else if (statusCode >= 400) {
      this.warn('HTTP', message, { userAgent });
    } else if (this.isDev) {
      this.info('HTTP', message);
    }
  }
}

// Create and export singleton instance
const logger = new Logger();

module.exports = logger;