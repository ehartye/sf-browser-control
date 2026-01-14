import { z } from 'zod';
import { SessionManager } from '../browser/sessionManager.js';
import { ToolResult, SalesforceError, SalesforceErrorCode } from '../types/index.js';

// Tool schemas
export const sessionStartSchema = z.object({
  orgAlias: z.string().describe('SF CLI org alias or username'),
  browser: z
    .enum(['chromium', 'firefox', 'webkit'])
    .optional()
    .describe('Browser engine to use (default: chromium)'),
  headless: z.boolean().optional().describe('Run in headless mode (default: false)'),
  viewportWidth: z.number().optional().describe('Viewport width in pixels (default: 1920)'),
  viewportHeight: z.number().optional().describe('Viewport height in pixels (default: 1080)'),
});

export const sessionStatusSchema = z.object({});

export const sessionRefreshSchema = z.object({});

export const sessionCloseSchema = z.object({});

export const listOrgsSchema = z.object({});

// Tool handlers
export async function handleSessionStart(
  args: z.infer<typeof sessionStartSchema>
): Promise<ToolResult> {
  const sessionManager = SessionManager.getInstance();

  try {
    await sessionManager.startSession({
      orgAlias: args.orgAlias,
      browser: args.browser,
      headless: args.headless,
      viewport:
        args.viewportWidth && args.viewportHeight
          ? { width: args.viewportWidth, height: args.viewportHeight }
          : undefined,
    });

    const status = sessionManager.getStatus();

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              success: true,
              message: `Session started for org: ${status.orgInfo?.orgName || args.orgAlias}`,
              instanceUrl: status.instanceUrl,
              username: status.orgInfo?.username,
              orgId: status.orgInfo?.id,
            },
            null,
            2
          ),
        },
      ],
    };
  } catch (error) {
    if (error instanceof SalesforceError) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                success: false,
                error: error.code,
                message: error.message,
                suggestion: error.suggestion,
              },
              null,
              2
            ),
          },
        ],
        isError: true,
      };
    }

    return {
      content: [
        {
          type: 'text',
          text: `Failed to start session: ${error instanceof Error ? error.message : 'Unknown error'}`,
        },
      ],
      isError: true,
    };
  }
}

export async function handleSessionStatus(): Promise<ToolResult> {
  const sessionManager = SessionManager.getInstance();
  const status = sessionManager.getStatus();

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(
          {
            status: status.status,
            orgAlias: status.orgAlias,
            instanceUrl: status.instanceUrl,
            username: status.orgInfo?.username,
            orgId: status.orgInfo?.id,
            orgName: status.orgInfo?.orgName,
            lastActivity: status.lastActivity?.toISOString(),
          },
          null,
          2
        ),
      },
    ],
  };
}

export async function handleSessionRefresh(): Promise<ToolResult> {
  const sessionManager = SessionManager.getInstance();

  try {
    await sessionManager.refreshToken();

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              success: true,
              message: 'Session token refreshed successfully',
            },
            null,
            2
          ),
        },
      ],
    };
  } catch (error) {
    if (error instanceof SalesforceError) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                success: false,
                error: error.code,
                message: error.message,
                suggestion: error.suggestion,
              },
              null,
              2
            ),
          },
        ],
        isError: true,
      };
    }

    return {
      content: [
        {
          type: 'text',
          text: `Failed to refresh session: ${error instanceof Error ? error.message : 'Unknown error'}`,
        },
      ],
      isError: true,
    };
  }
}

export async function handleSessionClose(): Promise<ToolResult> {
  const sessionManager = SessionManager.getInstance();

  await sessionManager.closeSession();

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(
          {
            success: true,
            message: 'Session closed successfully',
          },
          null,
          2
        ),
      },
    ],
  };
}

export async function handleListOrgs(): Promise<ToolResult> {
  const sessionManager = SessionManager.getInstance();

  try {
    const orgs = await sessionManager.listOrgs();

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              success: true,
              orgs: orgs,
              count: orgs.length,
            },
            null,
            2
          ),
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Failed to list orgs: ${error instanceof Error ? error.message : 'Unknown error'}`,
        },
      ],
      isError: true,
    };
  }
}

// Tool definitions for MCP registration
export const sessionTools = [
  {
    name: 'sf_session_start',
    description:
      'Launch an authenticated browser session for a Salesforce org using SF CLI credentials. This must be called before using any other SF tools.',
    inputSchema: sessionStartSchema,
    handler: handleSessionStart,
  },
  {
    name: 'sf_session_status',
    description: 'Get the current browser session status and org information.',
    inputSchema: sessionStatusSchema,
    handler: handleSessionStatus,
  },
  {
    name: 'sf_session_refresh',
    description: 'Refresh the access token if the session has expired or is about to expire.',
    inputSchema: sessionRefreshSchema,
    handler: handleSessionRefresh,
  },
  {
    name: 'sf_session_close',
    description: 'Close the browser session and clean up resources.',
    inputSchema: sessionCloseSchema,
    handler: handleSessionClose,
  },
  {
    name: 'sf_list_orgs',
    description: 'List all Salesforce orgs authenticated with SF CLI.',
    inputSchema: listOrgsSchema,
    handler: handleListOrgs,
  },
];
