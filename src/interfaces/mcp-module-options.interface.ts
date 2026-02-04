import { ServerOptions } from "@modelcontextprotocol/sdk/server/index.js"
import {
  ResourceMetadata,
  ResourceTemplate as ResourceTemplateClass,
} from "@modelcontextprotocol/sdk/server/mcp.js"
import { Implementation, Resource } from "@modelcontextprotocol/sdk/types.js"
import { ModuleMetadata, Type } from "@nestjs/common"
import { ZodRawShape } from "zod"

import { McpLogger } from "./mcp-logger.interface"

/**
 * Transport types supported by the MCP module.
 */
export enum TransportType {
  /** Standard Input/Output - for CLI tools */
  STDIO = "stdio",
  /** Server-Sent Events - for HTTP streaming */
  SSE = "sse",
  /** HTTP transport */
  HTTP = "http",
  /** No transport - manual connection management */
  NONE = "none",
}

/**
 * Configuration options for the MCP module.
 */
export interface McpModuleOptions {
  /**
   * Server implementation information including name, version, and vendor details.
   */
  serverInfo: Implementation

  /**
   * Optional server configuration options from the MCP SDK.
   */
  serverOptions?: ServerOptions

  /**
   * Transport type for communication.
   * @default TransportType.STDIO
   */
  transport?: TransportType

  /**
   * Custom logger implementation.
   * If not provided, uses a default console logger.
   */
  logger?: McpLogger

  /**
   * Base path for the HTTP controller endpoints.
   * @default "mcp"
   */
  basePath?: string

  /**
   * Whether to register the module globally.
   * @default false
   */
  global?: boolean
}

/**
 * Factory interface for creating MCP module options.
 */
export interface McpOptionsFactory {
  /**
   * Creates and returns MCP module options.
   */
  createMcpOptions(): Promise<McpModuleOptions> | McpModuleOptions
}

/**
 * Configuration options for asynchronous MCP module initialization.
 */
export interface McpModuleAsyncOptions extends Pick<ModuleMetadata, "imports"> {
  /**
   * Existing provider to use for creating MCP options.
   */
  useExisting?: Type<McpOptionsFactory>

  /**
   * Class to instantiate and use for creating MCP options.
   */
  useClass?: Type<McpOptionsFactory>

  /**
   * Factory function to create MCP options.
   */
  useFactory?: (...args: any[]) => Promise<McpModuleOptions> | McpModuleOptions

  /**
   * Dependencies to inject into the factory function.
   */
  inject?: any[]

  /**
   * Whether to register the module globally.
   * @default false
   */
  global?: boolean
}

/**
 * Configuration options for fixed (non-template) resources.
 */
export interface FixedResourceOptions extends Resource {
  /**
   * Optional metadata for the resource.
   */
  metadata?: ResourceMetadata
}

/**
 * Configuration options for template-based resources.
 */
export interface TemplateResourceOptions {
  /**
   * Name of the resource template.
   */
  name: string

  /**
   * URI template as a string or ResourceTemplate instance.
   */
  uriTemplate: string | ResourceTemplateClass

  /**
   * Optional description of the resource template.
   */
  description?: string

  /**
   * Optional metadata for the resource template.
   */
  metadata?: ResourceMetadata
}

/**
 * Union type representing either fixed or template resource options.
 */
export type ResourceOptions = FixedResourceOptions | TemplateResourceOptions

/**
 * Configuration options for MCP tools.
 */
export interface ToolOptions {
  /**
   * Unique name for the tool.
   */
  name: string

  /**
   * Optional description of what the tool does.
   */
  description?: string

  /**
   * Optional Zod schema for tool parameters.
   */
  paramsSchema?: ZodRawShape
}

/**
 * Base interface for metadata stored by decorators.
 */
export interface IMetadataBase {
  /**
   * The name of the decorated method.
   */
  methodName: string

  /**
   * Additional options specific to the decorator.
   */
  options?: any
}
