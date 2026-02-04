# @iludolf/mcp-adapter

NestJS module for Model Context Protocol (MCP) integration. Enables your NestJS application to act as an MCP server, exposing tools, resources, and prompts to AI assistants.

## Features

- 🔧 **Decorator-based API** - Use `@McpTool`, `@McpResource`, `@McpPrompt` decorators
- 🚀 **Multiple transports** - STDIO, SSE, HTTP support
- 🔄 **SSE Keep-alive** - Automatic ping to prevent connection timeouts
- 📦 **NestJS integration** - Full support for dependency injection
- 🔌 **Async configuration** - Use `forRootAsync` with ConfigService

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
npm install @modelcontextprotocol/sdk@^1.10.0 @nestjs/common @nestjs/core reflect-metadata rxjs zod
```

| Package | Version |
|---------|---------|
| `@modelcontextprotocol/sdk` | `^1.10.0` |
| `@nestjs/common` | `^10.0.0 \|\| ^11.0.0` |
| `@nestjs/core` | `^10.0.0 \|\| ^11.0.0` |
| `reflect-metadata` | `^0.1.13 \|\| ^0.2.0` |
| `rxjs` | `^7.0.0` |
| `zod` | `^3.0.0` |

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

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/{basePath}/sse` | GET | SSE connection endpoint |
| `/{basePath}/messages` | POST | Message handling endpoint |
| `/{basePath}/health` | GET | Health check endpoint |

### SSE Keep-alive

SSE connections automatically send keep-alive pings every 30 seconds to prevent timeout errors (`Body Timeout Error`). This is handled transparently - no configuration needed.

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

## Compatibility

- **MCP SDK**: Uses the new `registerTool`, `registerPrompt`, `registerResource` API (SDK 1.10.0+)
- **NestJS**: Compatible with v10 and v11
- **Node.js**: Requires Node.js 18+

## License

MIT
