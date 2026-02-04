# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.1] - 2025-02-04

### Added

- **SSE Keep-alive**: Automatic ping messages every 30 seconds to prevent `Body Timeout Error` on idle connections
- **Decorator-based API**: `@McpTool`, `@McpResource`, `@McpPrompt` decorators for easy handler registration
- **Multiple transports**: Support for STDIO, SSE, HTTP, and NONE transport types
- **Async configuration**: `McpModule.forRootAsync()` for dynamic configuration with dependency injection
- **Custom logger support**: Implement `McpLogger` interface for custom logging
- **Health endpoint**: `GET /{basePath}/health` for monitoring

### Changed

- **MCP SDK API migration**: Updated to use new `registerTool`, `registerPrompt`, `registerResource` methods (SDK 1.10.0+)
- **Simplified tool registration**: Consolidated multiple code paths into single config-object pattern

### Fixed

- **TypeScript compatibility**: Resolved "Type instantiation is excessively deep" errors with MCP SDK generics

### Technical

- Compatible with `@modelcontextprotocol/sdk` ^1.10.0
- Compatible with NestJS v10 and v11
- Requires Node.js 18+
