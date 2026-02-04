import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js"
import {
  DynamicModule,
  Inject,
  Module,
  OnApplicationBootstrap,
  Provider,
  Type,
} from "@nestjs/common"
import { DiscoveryModule, MetadataScanner, Reflector } from "@nestjs/core"

import { MCP_LOGGER, MCP_LOGGER_CONTEXT, MCP_MODULE_OPTIONS } from "./constants"
import {
  DefaultMcpLogger,
  McpLogger,
  McpModuleAsyncOptions,
  McpModuleOptions,
  McpOptionsFactory,
  TransportType,
} from "./interfaces"
import { McpHttpController } from "./mcp.controller"
import { ExplorerService, McpHttpService, McpService } from "./services"

/**
 * NestJS module for integrating the Model Context Protocol (MCP).
 *
 * This module discovers and registers MCP handlers (resources, tools, prompts),
 * manages transport connections (stdio or HTTP/SSE), and provides
 * configuration options through forRoot and forRootAsync methods.
 *
 * @example
 * ```typescript
 * // Synchronous configuration
 * @Module({
 *   imports: [
 *     McpModule.forRoot({
 *       serverInfo: {
 *         name: "my-mcp-server",
 *         version: "1.0.0",
 *       },
 *       transport: TransportType.SSE,
 *     }),
 *   ],
 * })
 * export class AppModule {}
 * ```
 *
 * @example
 * ```typescript
 * // Asynchronous configuration
 * @Module({
 *   imports: [
 *     McpModule.forRootAsync({
 *       imports: [ConfigModule],
 *       useFactory: (configService: ConfigService) => ({
 *         serverInfo: {
 *           name: configService.get("MCP_SERVER_NAME"),
 *           version: configService.get("MCP_SERVER_VERSION"),
 *         },
 *         transport: TransportType.SSE,
 *       }),
 *       inject: [ConfigService],
 *     }),
 *   ],
 * })
 * export class AppModule {}
 * ```
 */
@Module({})
export class McpModule implements OnApplicationBootstrap {
  constructor(
    private readonly explorerService: ExplorerService,
    private readonly mcpService: McpService,
    @Inject(MCP_LOGGER) private readonly logger: McpLogger
  ) {}

  /**
   * Registers the McpModule synchronously with given options.
   */
  static forRoot(options: McpModuleOptions): DynamicModule {
    const logger = options.logger || new DefaultMcpLogger()

    const providers: Provider[] = [
      { provide: MCP_MODULE_OPTIONS, useValue: options },
      { provide: MCP_LOGGER, useValue: logger },
      ExplorerService,
      McpService,
      McpHttpService,
      MetadataScanner,
      Reflector,
    ]

    const controllers =
      options.transport === TransportType.SSE ||
      options.transport === TransportType.HTTP
        ? [McpHttpController]
        : []

    return {
      module: McpModule,
      imports: [DiscoveryModule],
      providers,
      controllers,
      exports: [McpService, MCP_MODULE_OPTIONS, MCP_LOGGER],
      global: options.global ?? false,
    }
  }

  /**
   * Registers the McpModule asynchronously.
   */
  static forRootAsync(options: McpModuleAsyncOptions): DynamicModule {
    const asyncProviders = this.createAsyncProviders(options)

    return {
      module: McpModule,
      imports: [...(options.imports || []), DiscoveryModule],
      providers: [
        ...asyncProviders,
        ExplorerService,
        McpService,
        McpHttpService,
        MetadataScanner,
        Reflector,
      ],
      controllers: [McpHttpController],
      exports: [McpService, MCP_MODULE_OPTIONS, MCP_LOGGER],
      global: options.global ?? false,
    }
  }

  private static createAsyncProviders(
    options: McpModuleAsyncOptions
  ): Provider[] {
    if (options.useExisting || options.useFactory) {
      return [
        this.createAsyncOptionsProvider(options),
        this.createAsyncLoggerProvider(),
      ]
    }

    const useClass = options.useClass as Type<McpOptionsFactory>
    return [
      this.createAsyncOptionsProvider(options),
      this.createAsyncLoggerProvider(),
      { provide: useClass, useClass },
    ]
  }

  private static createAsyncOptionsProvider(
    options: McpModuleAsyncOptions
  ): Provider {
    if (options.useFactory) {
      return {
        provide: MCP_MODULE_OPTIONS,
        useFactory: options.useFactory,
        inject: options.inject || [],
      }
    }

    const inject = [
      (options.useClass || options.useExisting) as Type<McpOptionsFactory>,
    ]

    return {
      provide: MCP_MODULE_OPTIONS,
      useFactory: async (optionsFactory: McpOptionsFactory) => {
        return optionsFactory.createMcpOptions()
      },
      inject,
    }
  }

  private static createAsyncLoggerProvider(): Provider {
    return {
      provide: MCP_LOGGER,
      useFactory: (options: McpModuleOptions) => {
        return options.logger || new DefaultMcpLogger()
      },
      inject: [MCP_MODULE_OPTIONS],
    }
  }

  /**
   * Lifecycle hook executed after the application is fully bootstrapped.
   */
  async onApplicationBootstrap() {
    this.logger.info("Bootstrapping MCP Module...", MCP_LOGGER_CONTEXT)

    this.registerMcpHandlers()
    this.logger.info("MCP Handlers registered.", MCP_LOGGER_CONTEXT)

    const opts = this.mcpService.getOptions()

    if (opts?.transport === TransportType.STDIO) {
      try {
        const transport = new StdioServerTransport()
        const server = this.mcpService.getServer()
        await server.connect(transport)
        this.logger.info("McpServer connected to stdio transport.", MCP_LOGGER_CONTEXT)
      } catch (error: any) {
        this.logger.error("Failed to connect McpServer to stdio transport:", MCP_LOGGER_CONTEXT, error.stack)
      }
    } else {
      this.logger.info(
        "MCP Module configured for non-stdio transport. No automatic connection needed.",
        MCP_LOGGER_CONTEXT
      )
    }

    this.logger.info("MCP Module bootstrapped successfully.", MCP_LOGGER_CONTEXT)
  }

  /**
   * Registers all discovered MCP handlers: resources, tools, and prompts.
   */
  private registerMcpHandlers() {
    // Resources
    const resources = this.explorerService.exploreResources()
    resources.forEach(({ handler, metadata }) => {
      this.logger.debug(
        `Registering resource: ${metadata.options?.name || metadata.methodName}`,
        MCP_LOGGER_CONTEXT
      )
      this.mcpService.registerResource(metadata.options, handler)
    })

    // Tools
    const tools = this.explorerService.exploreTools()
    tools.forEach(({ handler, metadata }) => {
      if (!metadata.options?.name) {
        this.logger.warn(
          `Tool handler ${metadata.methodName} missing required name. Skipping.`,
          MCP_LOGGER_CONTEXT
        )
        return
      }
      this.logger.debug(`Registering tool: ${metadata.options.name}`, MCP_LOGGER_CONTEXT)
      this.mcpService.registerTool(metadata.options, handler)
    })

    // Prompts
    const prompts = this.explorerService.explorePrompts()
    prompts.forEach(({ handler, metadata }) => {
      if (!metadata.options?.name) {
        this.logger.warn(
          `Prompt handler ${metadata.methodName} missing required name. Skipping.`,
          MCP_LOGGER_CONTEXT
        )
        return
      }
      this.logger.debug(`Registering prompt: ${metadata.options.name}`, MCP_LOGGER_CONTEXT)
      this.mcpService.registerPrompt(metadata.options, handler)
    })
  }
}
