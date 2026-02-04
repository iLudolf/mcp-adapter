import {
  Controller,
  Get,
  Inject,
  Post,
  Req,
  Res,
} from "@nestjs/common"
import { Request, Response } from "express"

import { DEFAULT_MCP_PATH, MCP_LOGGER, MCP_MODULE_OPTIONS } from "./constants"
import { McpLogger, McpModuleOptions } from "./interfaces"
import { McpHttpService } from "./services/mcp-http.service"

/**
 * Controller for handling MCP HTTP/SSE endpoints.
 * 
 * Provides endpoints for:
 * - SSE connections (GET /sse)
 * - Message handling (POST /messages)
 * - Health checks (GET /health)
 */
@Controller()
export class McpHttpController {
  private readonly loggerCtx = "McpHttpController"
  private readonly basePath: string

  constructor(
    private readonly mcpHttpService: McpHttpService,
    @Inject(MCP_MODULE_OPTIONS) options: McpModuleOptions,
    @Inject(MCP_LOGGER) private readonly logger: McpLogger
  ) {
    this.basePath = options.basePath || DEFAULT_MCP_PATH
  }

  /**
   * Handles Server-Sent Events (SSE) connections from clients.
   */
  @Get("*/sse")
  async handleSSE(@Req() req: Request, @Res() res: Response): Promise<void> {
    if (!req.path.includes(this.basePath)) {
      res.status(404).send("Not found")
      return
    }
    this.logger.debug("SSE connection request received", this.loggerCtx)
    return this.mcpHttpService.handleSSE(res)
  }

  /**
   * Processes incoming MCP messages from clients.
   */
  @Post("*/messages")
  async handleMessages(
    @Req() req: Request,
    @Res() res: Response
  ): Promise<void> {
    if (!req.path.includes(this.basePath)) {
      res.status(404).send("Not found")
      return
    }
    this.logger.debug("MCP message received", this.loggerCtx)
    return this.mcpHttpService.handleMessage(req, res)
  }

  /**
   * Health check endpoint.
   */
  @Get("*/health")
  healthCheck(@Req() req: Request, @Res() res: Response) {
    if (!req.path.includes(this.basePath)) {
      res.status(404).send("Not found")
      return
    }
    this.logger.debug("Health check request received", this.loggerCtx)
    res.json({
      status: "ok",
      timestamp: new Date().toISOString(),
    })
  }
}
