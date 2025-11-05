/**
 * Centralized Logger Utility
 * Provides structured logging for API routes with severity levels
 * and metadata support for production debugging
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';
type LogMetadata = Record<string, unknown>;

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  metadata?: LogMetadata;
  error?: {
    message: string;
    stack?: string;
    code?: string;
  };
}

class Logger {
  private readonly serviceName: string;
  private readonly logLevel: LogLevel;

  constructor(serviceName: string = 'api') {
    this.serviceName = serviceName;
    this.logLevel = (process.env.LOG_LEVEL as LogLevel) || 'info';
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    const currentLevelIndex = levels.indexOf(this.logLevel);
    const messageLevelIndex = levels.indexOf(level);
    return messageLevelIndex >= currentLevelIndex;
  }

  private formatLogEntry(level: LogLevel, message: string, metadata?: LogMetadata, error?: Error): LogEntry {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message: `[${this.serviceName}] ${message}`,
      metadata,
    };

    if (error) {
      entry.error = {
        message: error.message,
        stack: error.stack,
        code: (error as unknown as { code?: string }).code,
      };
    }

    return entry;
  }

  private output(entry: LogEntry): void {
    const logString = JSON.stringify(entry);

    switch (entry.level) {
      case 'error':
        console.error(logString);
        break;
      case 'warn':
        console.warn(logString);
        break;
      case 'info':
        console.info(logString);
        break;
      case 'debug':
        console.debug(logString);
        break;
    }
  }

  /**
   * Log debug message (development only)
   */
  debug(message: string, metadata?: LogMetadata): void {
    if (this.shouldLog('debug')) {
      this.output(this.formatLogEntry('debug', message, metadata));
    }
  }

  /**
   * Log informational message
   */
  info(message: string, metadata?: LogMetadata): void {
    if (this.shouldLog('info')) {
      this.output(this.formatLogEntry('info', message, metadata));
    }
  }

  /**
   * Log warning message
   */
  warn(message: string, metadata?: LogMetadata): void {
    if (this.shouldLog('warn')) {
      this.output(this.formatLogEntry('warn', message, metadata));
    }
  }

  /**
   * Log error message
   */
  error(message: string, error?: Error, metadata?: LogMetadata): void {
    if (this.shouldLog('error')) {
      this.output(this.formatLogEntry('error', message, metadata, error));
    }
  }

  /**
   * Log metric for monitoring systems
   */
  metric(metricName: string, value: number, metadata?: LogMetadata): void {
    if (this.shouldLog('info')) {
      this.output(this.formatLogEntry('info', `METRIC: ${metricName}`, {
        ...metadata,
        metricName,
        metricValue: value,
      }));
    }
  }

  /**
   * Create a child logger with additional context
   */
  child(context: LogMetadata): Logger {
    const child = new Logger(this.serviceName);
    // Store context for future use
    (child as unknown as { context: LogMetadata }).context = context;
    return child;
  }
}

// Export singleton instance for API routes
export const logger = new Logger('api');

// Export class for custom instances
export { Logger };

// Export types
export type { LogLevel, LogMetadata };
