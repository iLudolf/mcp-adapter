/**
 * Interface for custom logger implementation.
 * Allows users to provide their own logger that integrates with the MCP module.
 */
export interface McpLogger {
  /**
   * Log informational messages.
   */
  info(message: string, context?: string): void

  /**
   * Log warning messages.
   */
  warn(message: string, context?: string): void

  /**
   * Log error messages with optional stack trace.
   */
  error(message: string, context?: string, trace?: string): void

  /**
   * Log debug messages for development.
   */
  debug(message: string, context?: string): void
}

/**
 * Default console logger implementation.
 * Used when no custom logger is provided.
 */
export class DefaultMcpLogger implements McpLogger {
  info(message: string, context?: string): void {
    console.log(`[INFO] ${context ? `[${context}] ` : ""}${message}`)
  }

  warn(message: string, context?: string): void {
    console.warn(`[WARN] ${context ? `[${context}] ` : ""}${message}`)
  }

  error(message: string, context?: string, trace?: string): void {
    console.error(`[ERROR] ${context ? `[${context}] ` : ""}${message}`)
    if (trace) {
      console.error(trace)
    }
  }

  debug(message: string, context?: string): void {
    console.debug(`[DEBUG] ${context ? `[${context}] ` : ""}${message}`)
  }
}
