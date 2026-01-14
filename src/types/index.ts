import { Browser, BrowserContext, Page } from 'playwright';

// SF CLI org display result
export interface OrgInfo {
  id: string;
  accessToken: string;
  instanceUrl: string;
  username: string;
  clientId?: string;
  alias?: string;
  expirationDate?: string;
  devHubId?: string;
  edition?: string;
  orgName?: string;
  status: string;
}

export interface OrgDisplayResult {
  status: number;
  result: OrgInfo;
}

export interface OrgOpenResult {
  status: number;
  result: {
    orgId: string;
    url: string;
    username: string;
  };
}

// Session configuration
export interface SessionConfig {
  orgAlias: string;
  browser?: 'chromium' | 'firefox' | 'webkit';
  headless?: boolean;
  viewport?: { width: number; height: number };
}

// Session state
export interface SessionState {
  browser: Browser | null;
  context: BrowserContext | null;
  page: Page | null;
  orgInfo: OrgInfo | null;
  status: 'disconnected' | 'connecting' | 'connected' | 'error';
  lastActivity: Date | null;
  instanceUrl: string | null;
  orgAlias: string | null;
}

// Tool result types - matches MCP SDK expected types
export interface TextContent {
  type: 'text';
  text: string;
}

export interface ImageContent {
  type: 'image';
  data: string;
  mimeType: string;
}

export type ToolResultContent = TextContent | ImageContent;

export interface ToolResult {
  [key: string]: unknown;
  content: ToolResultContent[];
  isError?: boolean;
}

// Server configuration
export interface ServerConfig {
  defaultBrowser: 'chromium' | 'firefox' | 'webkit';
  defaultHeadless: boolean;
  defaultViewport: { width: number; height: number };
  navigationTimeout: number;
  elementTimeout: number;
  spinnerTimeout: number;
  toastTimeout: number;
  tokenRefreshIntervalMs: number;
  sessionIdleTimeoutMs: number;
}

export const DEFAULT_CONFIG: ServerConfig = {
  defaultBrowser: 'chromium',
  defaultHeadless: false,
  defaultViewport: { width: 1920, height: 1080 },
  navigationTimeout: 30000,
  elementTimeout: 10000,
  spinnerTimeout: 15000,
  toastTimeout: 10000,
  tokenRefreshIntervalMs: 30 * 60 * 1000,
  sessionIdleTimeoutMs: 2 * 60 * 60 * 1000,
};

// Error codes
export enum SalesforceErrorCode {
  SESSION_NOT_STARTED = 'SESSION_NOT_STARTED',
  SESSION_EXPIRED = 'SESSION_EXPIRED',
  ORG_NOT_FOUND = 'ORG_NOT_FOUND',
  ELEMENT_NOT_FOUND = 'ELEMENT_NOT_FOUND',
  NAVIGATION_TIMEOUT = 'NAVIGATION_TIMEOUT',
  AUTHENTICATION_FAILED = 'AUTHENTICATION_FAILED',
  SF_CLI_ERROR = 'SF_CLI_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

export class SalesforceError extends Error {
  constructor(
    public code: SalesforceErrorCode,
    message: string,
    public recoverable: boolean = false,
    public suggestion?: string
  ) {
    super(message);
    this.name = 'SalesforceError';
  }
}
