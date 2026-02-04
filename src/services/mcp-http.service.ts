import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js"
import { Inject, Injectable } from "@nestjs/common"
import { Request, Response } from "express"

import { MCP_LOGGER } from "../constants"
import { McpLogger } from "../interfaces"
import { McpService } from "./mcp.service"

/**
 * Service responsible for handling HTTP/SSE communication for the MCP server.
 */
@Injectable()
export class McpHttpService {
  private readonly loggerCtx = "McpHttpService"
  private transports: { [sessionId: string]: SSEServerTransport } = {}

  constructor(
    private readonly mcpService: McpService,
    @Inject(MCP_LOGGER) private readonly logger: McpLogger
  ) {}

  /**
   * Handles a new Server-Sent Events (SSE) connection request.
   */
  async handleSSE(res: Response, messagesPath?: string): Promise<void> {
    const basePath = this.mcpService.getOptions().basePath || "mcp"
    const path = messagesPath || `/${basePath}/messages`
    
    const transport = new SSEServerTransport(path, res)
    const sessionId = transport.sessionId
    this.transports[sessionId] = transport

    this.logger.info(`New SSE connection established: ${sessionId}`, this.loggerCtx)

    res.on("close", () => {
      this.logger.info(`SSE connection closed: ${sessionId}`, this.loggerCtx)
      delete this.transports[sessionId]

      transport
        .close()
        .catch((err) =>
          this.logger.error(
            "Error closing transport on disconnect: " + err.message,
            this.loggerCtx
          )
        )
    })

    try {
      const server = this.mcpService.getServer()
      if (!server) {
        this.logger.error("MCP Server instance is not available.", this.loggerCtx)
        if (!res.headersSent) {
          res.status(500).send("MCP Server not initialized")
        }
        return
      }
      await server.connect(transport)
    } catch (error: any) {
      this.logger.error(
        `Error in SSE connection or during connect: ${error.message}`,
        this.loggerCtx
      )
      if (!res.headersSent) {
        res.status(500).send("Error establishing SSE connection")
      } else {
        res.end()
      }
    }
  }

  /**
   * Handles an incoming message request for an existing SSE connection.
   */
  async handleMessage(req: Request, res: Response): Promise<void> {
    const sessionId = req.query.sessionId as string

    if (!sessionId) {
      this.logger.warn("Message received without sessionId", this.loggerCtx)
      res.status(400).send("Missing sessionId parameter")
      return
    }

    const transport = this.transports[sessionId]

    if (transport) {
      try {
        await transport.handlePostMessage(req, res, { ...req.body })
      } catch (error: any) {
        this.logger.error(
          `Error handling message for session ${sessionId}: ${error.message}`,
          this.loggerCtx
        )
        if (!res.headersSent) {
          res.status(500).send("Error processing message")
        }
      }
    } else {
      this.logger.warn(
        `No active transport found for sessionId: ${sessionId}`,
        this.loggerCtx
      )
      res.status(404).send("No connection found for this sessionId")
    }
  }
}
