# @iludolf/mcp-adapter

NestJS module for Model Context Protocol (MCP) integration. Enables your NestJS application to act as an MCP server, exposing tools, resources, and prompts to AI assistants.

## Installation

```bash
npm install @iludolf/mcp-adapter
# or
pnpm add @iludolf/mcp-adapter
# or  
yarn add @iludolf/mcp-adapter
```

## Peer Dependencies

Make sure you have these peer dependencies installed:

```bash
npm install @modelcontextprotocol/sdk @nestjs/common @nestjs/core reflect-metadata rxjs zod
```

## Quick Start

### 1. Import the module

```typescript
import { Module } from "@nestjs/common"
import { McpModule, TransportType } from "@iludolf/mcp-adapter"

@Module({
  imports: [
    McpModule.forRoot({
      serverInfo: {
        name: "my-mcp-server",
        version: "1.0.0",
      },
      transport: TransportType.SSE, // or TransportType.STDIO
    }),
  ],
})
export class AppModule {}
```

### 2. Create MCP handlers

```typescript
import { Injectable } from "@nestjs/common"
import { McpTool, McpResource, McpPrompt } from "@iludolf/mcp-adapter"
import { z } from "zod"

@Injectable()
export class MyMcpHandlers {
  @McpTool({
    name: "calculator",
    description: "Performs basic arithmetic",
    paramsSchema: {
      operation: z.enum(["add", "subtract"]),
      a: z.number(),
      b: z.number(),
    },
  })
  async calculate(args: { operation: string; a: number; b: number }) {
    const result = args.operation === "add" 
      ? args.a + args.b 
      : args.a - args.b
    return { content: [{ type: "text", text: String(result) }] }
  }

  @McpResource({
    name: "config",
    uri: "config://app",
    description: "Application configuration",
  })
  async getConfig() {
    return {
      contents: [{
        uri: "config://app",
        mimeType: "application/json",
        text: JSON.stringify({ version: "1.0.0" }),
      }],
    }
  }

  @McpPrompt({
    name: "greeting",
    description: "Generate a greeting",
    arguments: [{ name: "name", required: true }],
  })
  async generateGreeting(params: { arguments: { name: string } }) {
    return {
      messages: [{
        role: "assistant",
        content: { type: "text", text: `Hello, ${params.arguments.name}!` },
      }],
    }
  }
}
```

### 3. Register the handlers provider

```typescript
@Module({
  imports: [McpModule.forRoot({ /* ... */ })],
  providers: [MyMcpHandlers],
})
export class AppModule {}
```

## Configuration Options

### McpModuleOptions

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `serverInfo` | `Implementation` | required | Server name and version |
| `serverOptions` | `ServerOptions` | - | MCP SDK server options |
| `transport` | `TransportType` | `STDIO` | Transport type (STDIO, SSE, HTTP, NONE) |
| `logger` | `McpLogger` | `DefaultMcpLogger` | Custom logger |
| `basePath` | `string` | `"mcp"` | Base path for HTTP endpoints |
| `global` | `boolean` | `false` | Register module globally |

### Async Configuration

```typescript
McpModule.forRootAsync({
  imports: [ConfigModule],
  useFactory: (config: ConfigService) => ({
    serverInfo: {
      name: config.get("MCP_NAME"),
      version: config.get("MCP_VERSION"),
    },
    transport: TransportType.SSE,
  }),
  inject: [ConfigService],
})
```

## HTTP Endpoints (SSE/HTTP transport)

When using SSE or HTTP transport, the following endpoints are available:

- `GET /{basePath}/sse` - SSE connection endpoint
- `POST /{basePath}/messages` - Message handling endpoint  
- `GET /{basePath}/health` - Health check endpoint

## Custom Logger

```typescript
import { McpLogger } from "@iludolf/mcp-adapter"

class MyLogger implements McpLogger {
  info(message: string, context?: string) { /* ... */ }
  warn(message: string, context?: string) { /* ... */ }
  error(message: string, context?: string, trace?: string) { /* ... */ }
  debug(message: string, context?: string) { /* ... */ }
}

McpModule.forRoot({
  serverInfo: { name: "my-server", version: "1.0.0" },
  logger: new MyLogger(),
})
```

## License

MIT
