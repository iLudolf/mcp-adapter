import {
  McpServer,
  ReadResourceCallback,
  ReadResourceTemplateCallback,
  ResourceMetadata,
  ResourceTemplate,
} from "@modelcontextprotocol/sdk/server/mcp.js"
import { Prompt as PromptType } from "@modelcontextprotocol/sdk/types.js"
import { Inject, Injectable } from "@nestjs/common"
import { z, ZodOptional, ZodString, ZodType, ZodTypeDef } from "zod"

import { MCP_LOGGER, MCP_MODULE_OPTIONS } from "../constants"
import {
  McpLogger,
  McpModuleOptions,
  ResourceOptions,
  TemplateResourceOptions,
  ToolOptions,
  TransportType,
} from "../interfaces"

type PromptArgsRawShape = {
  [k: string]:
    | ZodType<string, ZodTypeDef, string>
    | ZodOptional<ZodType<string, ZodTypeDef, string>>
}

/**
 * Service responsible for managing the McpServer instance and registering
 * resources, prompts, and tools.
 */
@Injectable()
export class McpService {
  private readonly loggerCtx = "McpService"
  private readonly server: McpServer

  constructor(
    @Inject(MCP_MODULE_OPTIONS) private readonly options: McpModuleOptions,
    @Inject(MCP_LOGGER) private readonly logger: McpLogger
  ) {
    const { serverInfo, serverOptions, transport } = options

    this.server = new McpServer(serverInfo, serverOptions)

    this.logger.info("McpServer instance created.", this.loggerCtx)
    this.logger.info(`MCP Server Transport: ${transport || TransportType.STDIO}`, this.loggerCtx)
  }

  /**
   * Retrieves the underlying McpServer instance.
   */
  getServer(): McpServer {
    return this.server
  }

  /**
   * Retrieves the module options.
   */
  getOptions(): McpModuleOptions {
    return this.options
  }

  /**
   * Registers a resource or a resource template with the McpServer.
   */
  registerResource(
    definition: ResourceOptions,
    handler: ReadResourceCallback | ReadResourceTemplateCallback
  ) {
    if (!definition.name) {
      this.logger.warn(
        "Resource missing required name. Skipping registration.",
        this.loggerCtx
      )
      return
    }

    this.logger.info(`Registering resource: ${definition.name}`, this.loggerCtx)
    const metadata: ResourceMetadata = definition.metadata || {}

    if (this.isTemplateResource(definition)) {
      if (typeof definition.uriTemplate === "string") {
        const template = new ResourceTemplate(definition.uriTemplate, {
          list: undefined,
        })

        return this.server.registerResource(
          definition.name,
          template,
          metadata,
          handler as ReadResourceTemplateCallback
        )
      } else if (definition.uriTemplate instanceof ResourceTemplate) {
        return this.server.registerResource(
          definition.name,
          definition.uriTemplate,
          metadata,
          handler as ReadResourceTemplateCallback
        )
      } else {
        this.logger.error("Invalid uriTemplate type for template resource.", this.loggerCtx)
        return
      }
    } else {
      return this.server.registerResource(
        definition.name,
        definition.uri,
        metadata,
        handler as ReadResourceCallback
      )
    }
  }

  /**
   * Registers a prompt with the McpServer.
   */
  registerPrompt(
    definition: PromptType,
    handler: any
  ) {
    if (!definition.name) {
      this.logger.warn(
        "Prompt missing required name. Skipping registration.",
        this.loggerCtx
      )
      return
    }

    this.logger.info(`Registering prompt: ${definition.name}`, this.loggerCtx)
    const description = definition.description || ""

    if (!definition.arguments || definition.arguments.length === 0) {
      return (this.server.registerPrompt as any)(
        definition.name,
        { description },
        handler
      )
    }

    const argsSchema: PromptArgsRawShape = {}
    for (const arg of definition.arguments) {
      if (!arg.name) {
        this.logger.warn(
          `Prompt "${definition.name}" has an argument without a name. Skipping argument.`,
          this.loggerCtx
        )
        continue
      }
      let schema: ZodString | ZodOptional<ZodString> = z.string()
      if (arg.description) {
        schema = schema.describe(arg.description)
      }
      if (arg.required) {
        argsSchema[arg.name] = schema
      } else {
        argsSchema[arg.name] = schema.optional()
      }
    }

    if (Object.keys(argsSchema).length === 0) {
      this.logger.warn(
        `Prompt "${definition.name}" arguments processing resulted in empty schema. Registering as no-argument prompt.`,
        this.loggerCtx
      )
      return (this.server.registerPrompt as any)(
        definition.name,
        { description },
        handler
      )
    }

    return (this.server.registerPrompt as any)(
      definition.name,
      { description, argsSchema },
      handler
    )
  }

  /**
   * Registers a tool with the McpServer.
   */
  registerTool(
    definition: ToolOptions,
    handler: any
  ) {
    if (!definition || !definition.name) {
      this.logger.warn(
        "Tool definition missing required name. Skipping registration.",
        this.loggerCtx
      )
      return
    }

    this.logger.info(`Registering tool: ${definition.name}`, this.loggerCtx)

    const config: { description?: string; inputSchema?: typeof definition.paramsSchema } = {}

    if (definition.description) {
      config.description = definition.description
    }

    if (definition.paramsSchema && Object.keys(definition.paramsSchema).length > 0) {
      config.inputSchema = definition.paramsSchema
    }

    return (this.server.registerTool as any)(definition.name, config, handler)
  }

  private isTemplateResource(
    options: ResourceOptions
  ): options is TemplateResourceOptions {
    return "uriTemplate" in options
  }
}
