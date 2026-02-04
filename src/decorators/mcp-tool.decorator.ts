import { ToolOptions } from "../interfaces"
import { createMcpDecorator } from "./base.decorator"
import { MCP_TOOL_METADATA } from "./constants"

/**
 * Decorator that marks a method as an MCP Tool handler.
 *
 * @param options Options for the tool, including name, description, and parameter schema.
 *
 * @example
 * ```typescript
 * import { z } from "zod"
 *
 * @McpTool({
 *   name: "calculator",
 *   description: "Performs basic arithmetic operations",
 *   paramsSchema: {
 *     operation: z.enum(["add", "subtract", "multiply", "divide"]),
 *     a: z.number().describe("First operand"),
 *     b: z.number().describe("Second operand"),
 *   },
 * })
 * async calculate(args: { operation: string; a: number; b: number }) {
 *   const { operation, a, b } = args
 *   switch (operation) {
 *     case "add": return { content: [{ type: "text", text: String(a + b) }] }
 *     case "subtract": return { content: [{ type: "text", text: String(a - b) }] }
 *     // ...
 *   }
 * }
 * ```
 */
export const McpTool = (options: ToolOptions): MethodDecorator =>
  createMcpDecorator(MCP_TOOL_METADATA, options)
