import { Prompt as PromptType } from "@modelcontextprotocol/sdk/types.js"

import { createMcpDecorator } from "./base.decorator"
import { MCP_PROMPT_METADATA } from "./constants"

/**
 * Decorator that marks a method as an MCP Prompt handler.
 *
 * @param options Configuration options for the prompt including name, description, and arguments.
 *
 * @example
 * ```typescript
 * @McpPrompt({
 *   name: "greetingPrompt",
 *   description: "Generates a personalized greeting message",
 *   arguments: [
 *     {
 *       name: "name",
 *       description: "The name of the person to greet",
 *       required: true
 *     },
 *     {
 *       name: "formal",
 *       description: "Whether to use formal greeting style",
 *       required: false
 *     }
 *   ]
 * })
 * async generateGreeting(params: { arguments: { name: string; formal?: string } }) {
 *   const { name, formal } = params.arguments
 *   const greeting = formal === "true" ? "Greetings" : "Hello"
 *
 *   return {
 *     messages: [
 *       {
 *         role: "assistant",
 *         content: {
 *           type: "text",
 *           text: `${greeting}, ${name}! Welcome to our service.`
 *         }
 *       }
 *     ]
 *   }
 * }
 * ```
 */
export const McpPrompt = (options: PromptType): MethodDecorator =>
  createMcpDecorator(MCP_PROMPT_METADATA, options)
