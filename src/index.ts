#!/usr/bin/env node

import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createServer, cleanupServer } from './server.js';
import { toolCount } from './tools/index.js';

async function main() {
  const server = createServer();

  // Setup graceful shutdown
  const shutdown = async (signal: string) => {
    console.error(`Received ${signal}, shutting down...`);
    await cleanupServer();
    process.exit(0);
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));

  // Handle uncaught errors
  process.on('uncaughtException', async (error) => {
    console.error('Uncaught exception:', error);
    await cleanupServer();
    process.exit(1);
  });

  process.on('unhandledRejection', async (reason) => {
    console.error('Unhandled rejection:', reason);
    await cleanupServer();
    process.exit(1);
  });

  // Connect via stdio transport
  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error(`SF Browser Control MCP Server started with ${toolCount} tools`);
  console.error('Waiting for connections...');
}

main().catch(async (error) => {
  console.error('Fatal error:', error);
  await cleanupServer();
  process.exit(1);
});
