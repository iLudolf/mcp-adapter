import { Prompt as PromptType } from "@modelcontextprotocol/sdk/types.js"
import { Injectable } from "@nestjs/common"
import { Reflector } from "@nestjs/core"
import { InstanceWrapper } from "@nestjs/core/injector/instance-wrapper"
import { ModulesContainer } from "@nestjs/core/injector/modules-container"
import { MetadataScanner } from "@nestjs/core/metadata-scanner"

import {
  MCP_PROMPT_METADATA,
  MCP_RESOURCE_METADATA,
  MCP_TOOL_METADATA,
} from "../decorators/constants"
import {
  IMetadataBase,
  ResourceOptions,
  ToolOptions,
} from "../interfaces"

/**
 * Represents a discovered decorated method with its associated metadata.
 */
export interface DiscoveredItem<T = any> {
  /** The class instance containing the decorated method */
  instance: any
  /** The bound method function that will be called during execution */
  handler: (...args: any[]) => any
  /** The metadata extracted from the decorator */
  metadata: IMetadataBase & { options: T }
}

/**
 * Service responsible for discovering MCP-decorated methods throughout the application.
 *
 * ExplorerService scans all modules and providers in the NestJS application
 * to find methods decorated with @McpResource, @McpTool, and @McpPrompt.
 */
@Injectable()
export class ExplorerService {
  constructor(
    private readonly modulesContainer: ModulesContainer,
    private readonly metadataScanner: MetadataScanner,
    private readonly reflector: Reflector
  ) {}

  /**
   * Generic method to explore and discover methods decorated with a specific metadata key.
   */
  explore<T = any>(metadataKey: string): DiscoveredItem<T>[] {
    const modules = [...this.modulesContainer.values()]
    const components = modules
      .flatMap((module) => [...module.providers.values()])
      .filter((wrapper) => wrapper.instance)

    const discovered: DiscoveredItem<T>[] = []

    components.forEach((wrapper: InstanceWrapper) => {
      const { instance } = wrapper
      if (!instance || typeof instance !== "object" || !instance.constructor) {
        return
      }

      const prototype = Object.getPrototypeOf(instance)
      const methodNames = this.metadataScanner.getAllMethodNames(prototype)

      methodNames.forEach((methodName) => {
        const handler = instance[methodName]
        if (!handler) {
          return
        }

        const metadata = this.reflector.get<IMetadataBase>(metadataKey, handler)

        if (metadata) {
          discovered.push({
            instance,
            handler: handler.bind(instance),
            metadata: metadata as DiscoveredItem<T>["metadata"],
          })
        }
      })
    })

    return discovered
  }

  /**
   * Discovers all methods decorated with @McpResource.
   */
  exploreResources(): DiscoveredItem<ResourceOptions>[] {
    return this.explore<ResourceOptions>(MCP_RESOURCE_METADATA)
  }

  /**
   * Discovers all methods decorated with @McpTool.
   */
  exploreTools(): DiscoveredItem<ToolOptions>[] {
    return this.explore<ToolOptions>(MCP_TOOL_METADATA)
  }

  /**
   * Discovers all methods decorated with @McpPrompt.
   */
  explorePrompts(): DiscoveredItem<PromptType>[] {
    return this.explore<PromptType>(MCP_PROMPT_METADATA)
  }
}
