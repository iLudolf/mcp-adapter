import { ResourceOptions } from "../interfaces"
import { createMcpDecorator } from "./base.decorator"
import { MCP_RESOURCE_METADATA } from "./constants"

/**
 * Decorator that marks a method as an MCP Resource handler.
 *
 * @param options Options for the resource, including name, URI or URI template, and metadata.
 *
 * @example
 * ```typescript
 * // Fixed URI resource
 * @McpResource({
 *   name: "myResource",
 *   uri: "https://example.com/resource",
 *   description: "A fixed URI resource"
 * })
 * async handleResource() {
 *   return { contents: [{ uri: "...", text: "..." }] }
 * }
 * ```
 *
 * @example
 * ```typescript
 * // Template resource
 * @McpResource({
 *   name: "templateResource",
 *   uriTemplate: "https://example.com/{id}",
 *   description: "A resource with a template pattern"
 * })
 * async handleTemplateResource({ id }: { id: string }) {
 *   return { contents: [{ uri: `https://example.com/${id}`, text: "..." }] }
 * }
 * ```
 */
export const McpResource = (options: ResourceOptions): MethodDecorator =>
  createMcpDecorator(MCP_RESOURCE_METADATA, options)
