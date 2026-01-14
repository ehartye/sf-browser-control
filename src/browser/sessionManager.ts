import { Browser, BrowserContext, Page, chromium, firefox, webkit } from 'playwright';
import {
  SessionState,
  SessionConfig,
  OrgInfo,
  SalesforceError,
  SalesforceErrorCode,
  DEFAULT_CONFIG,
} from '../types/index.js';
import { OrgManager } from '../salesforce/auth.js';
import { SalesforceWaitStrategies } from '../salesforce/waitStrategies.js';
import { SalesforceUrlBuilder } from '../salesforce/urlBuilder.js';

/**
 * Singleton manager for browser sessions
 */
export class SessionManager {
  private static instance: SessionManager;
  private state: SessionState;
  private orgManager: OrgManager;
  private tokenRefreshInterval: ReturnType<typeof setInterval> | null = null;
  private urlBuilder: SalesforceUrlBuilder | null = null;

  private constructor() {
    this.state = {
      browser: null,
      context: null,
      page: null,
      orgInfo: null,
      status: 'disconnected',
      lastActivity: null,
      instanceUrl: null,
      orgAlias: null,
    };
    this.orgManager = new OrgManager();
  }

  static getInstance(): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager();
    }
    return SessionManager.instance;
  }

  /**
   * Start a new browser session for a Salesforce org
   */
  async startSession(config: SessionConfig): Promise<void> {
    // Clean up any existing session
    await this.closeSession();

    this.state.status = 'connecting';
    this.state.orgAlias = config.orgAlias;

    try {
      // Get org info from SF CLI
      const orgInfo = await this.orgManager.getOrgInfo(config.orgAlias);
      this.state.orgInfo = orgInfo;
      this.state.instanceUrl = orgInfo.instanceUrl;
      this.urlBuilder = new SalesforceUrlBuilder(orgInfo.instanceUrl);

      // Get frontdoor URL for authentication
      const frontdoorUrl = await this.orgManager.getFrontdoorUrl(config.orgAlias);

      // Launch browser
      const browserType =
        config.browser === 'firefox'
          ? firefox
          : config.browser === 'webkit'
            ? webkit
            : chromium;

      this.state.browser = await browserType.launch({
        headless: config.headless ?? DEFAULT_CONFIG.defaultHeadless,
      });

      // Create browser context with viewport
      this.state.context = await this.state.browser.newContext({
        viewport: config.viewport ?? DEFAULT_CONFIG.defaultViewport,
        userAgent:
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      });

      // Create page
      this.state.page = await this.state.context.newPage();

      // Navigate to frontdoor URL to authenticate
      await this.state.page.goto(frontdoorUrl, {
        waitUntil: 'domcontentloaded',
        timeout: DEFAULT_CONFIG.navigationTimeout,
      });

      // Wait for Lightning Experience to load
      const waitStrategies = new SalesforceWaitStrategies(this.state.page);
      await waitStrategies.waitForLightningReady(DEFAULT_CONFIG.navigationTimeout);

      this.state.status = 'connected';
      this.state.lastActivity = new Date();

      // Start token refresh monitoring
      this.startTokenRefreshMonitoring();
    } catch (error) {
      this.state.status = 'error';
      await this.closeSession();

      if (error instanceof Error) {
        if (error.message.includes('not found') || error.message.includes('No org')) {
          throw new SalesforceError(
            SalesforceErrorCode.ORG_NOT_FOUND,
            `Org "${config.orgAlias}" not found. Run "sf org list" to see available orgs.`,
            false,
            'Verify the org alias is correct and the org is authenticated with SF CLI.'
          );
        }
        throw new SalesforceError(
          SalesforceErrorCode.AUTHENTICATION_FAILED,
          `Failed to start session: ${error.message}`,
          true,
          'Try re-authenticating the org with "sf org login web".'
        );
      }
      throw error;
    }
  }

  /**
   * Ensure session is active, throw if not
   */
  async ensureSession(): Promise<Page> {
    if (this.state.status !== 'connected' || !this.state.page) {
      throw new SalesforceError(
        SalesforceErrorCode.SESSION_NOT_STARTED,
        'No active browser session. Call sf_session_start first.',
        false,
        'Use the sf_session_start tool to start a browser session.'
      );
    }

    // Check if page is still valid
    try {
      await this.state.page.evaluate(() => true);
    } catch {
      throw new SalesforceError(
        SalesforceErrorCode.SESSION_EXPIRED,
        'Browser session has expired or been closed.',
        true,
        'Start a new session with sf_session_start.'
      );
    }

    this.state.lastActivity = new Date();
    return this.state.page;
  }

  /**
   * Get current session status
   */
  getStatus(): {
    status: SessionState['status'];
    instanceUrl: string | null;
    orgInfo: OrgInfo | null;
    orgAlias: string | null;
    lastActivity: Date | null;
  } {
    return {
      status: this.state.status,
      instanceUrl: this.state.instanceUrl,
      orgInfo: this.state.orgInfo,
      orgAlias: this.state.orgAlias,
      lastActivity: this.state.lastActivity,
    };
  }

  /**
   * Get URL builder instance
   */
  getUrlBuilder(): SalesforceUrlBuilder {
    if (!this.urlBuilder || !this.state.instanceUrl) {
      throw new SalesforceError(
        SalesforceErrorCode.SESSION_NOT_STARTED,
        'URL builder not available. Start a session first.',
        false
      );
    }
    return this.urlBuilder;
  }

  /**
   * Refresh the access token
   */
  async refreshToken(): Promise<void> {
    if (!this.state.orgAlias) {
      throw new SalesforceError(
        SalesforceErrorCode.SESSION_NOT_STARTED,
        'No org alias set. Start a session first.',
        false
      );
    }

    try {
      const newToken = await this.orgManager.refreshAccessToken(this.state.orgAlias);

      // Update org info
      this.state.orgInfo = await this.orgManager.getOrgInfo(this.state.orgAlias, true);

      // If page exists and we're still logged in, we might need to re-authenticate
      // In most cases the existing session should still be valid
      if (this.state.page) {
        // Check if we're still logged in by checking for the app container
        const isLoggedIn = await this.state.page
          .locator('div.desktop, one-app')
          .first()
          .isVisible()
          .catch(() => false);

        if (!isLoggedIn) {
          // Re-authenticate using new token
          const frontdoorUrl = await this.orgManager.getFrontdoorUrl(this.state.orgAlias);
          await this.state.page.goto(frontdoorUrl, {
            waitUntil: 'domcontentloaded',
            timeout: DEFAULT_CONFIG.navigationTimeout,
          });

          const waitStrategies = new SalesforceWaitStrategies(this.state.page);
          await waitStrategies.waitForLightningReady();
        }
      }
    } catch (error) {
      throw new SalesforceError(
        SalesforceErrorCode.SESSION_EXPIRED,
        `Failed to refresh token: ${error instanceof Error ? error.message : 'Unknown error'}`,
        true,
        'Try re-authenticating the org with "sf org login web".'
      );
    }
  }

  /**
   * Close the browser session
   */
  async closeSession(): Promise<void> {
    // Stop token refresh monitoring
    if (this.tokenRefreshInterval) {
      clearInterval(this.tokenRefreshInterval);
      this.tokenRefreshInterval = null;
    }

    // Close browser resources
    if (this.state.page) {
      await this.state.page.close().catch(() => {});
      this.state.page = null;
    }

    if (this.state.context) {
      await this.state.context.close().catch(() => {});
      this.state.context = null;
    }

    if (this.state.browser) {
      await this.state.browser.close().catch(() => {});
      this.state.browser = null;
    }

    // Reset state
    this.state.status = 'disconnected';
    this.state.orgInfo = null;
    this.state.instanceUrl = null;
    this.state.lastActivity = null;
    this.urlBuilder = null;
  }

  /**
   * Start monitoring for token refresh
   */
  private startTokenRefreshMonitoring(): void {
    // Check every 30 minutes if we need to refresh
    this.tokenRefreshInterval = setInterval(
      async () => {
        try {
          if (this.state.status === 'connected') {
            // Proactively refresh the token to keep the session alive
            await this.orgManager.getOrgInfo(this.state.orgAlias!, true);
          }
        } catch (error) {
          console.error('Token refresh check failed:', error);
        }
      },
      DEFAULT_CONFIG.tokenRefreshIntervalMs
    );
  }

  /**
   * Navigate to a URL within the Salesforce org
   */
  async navigate(path: string): Promise<void> {
    const page = await this.ensureSession();
    const urlBuilder = this.getUrlBuilder();

    await page.goto(urlBuilder.fullUrl(path), {
      waitUntil: 'domcontentloaded',
      timeout: DEFAULT_CONFIG.navigationTimeout,
    });

    const waitStrategies = new SalesforceWaitStrategies(page);
    await waitStrategies.smartWait();
  }

  /**
   * Take a screenshot
   */
  async screenshot(options?: {
    fullPage?: boolean;
    selector?: string;
  }): Promise<Buffer> {
    const page = await this.ensureSession();

    if (options?.selector) {
      const element = page.locator(options.selector).first();
      return element.screenshot();
    }

    return page.screenshot({ fullPage: options?.fullPage ?? false });
  }

  /**
   * Execute JavaScript in the page context
   */
  async evaluate<T>(script: string): Promise<T> {
    const page = await this.ensureSession();
    return page.evaluate(script) as Promise<T>;
  }

  /**
   * Get the current page URL
   */
  async getCurrentUrl(): Promise<string> {
    const page = await this.ensureSession();
    return page.url();
  }

  /**
   * Get browser console logs
   */
  async getConsoleLogs(
    level?: 'all' | 'error' | 'warning'
  ): Promise<Array<{ type: string; text: string }>> {
    const page = await this.ensureSession();
    const logs: Array<{ type: string; text: string }> = [];

    // Note: This requires setting up console event listeners when the page is created
    // For now, we'll return an empty array as a placeholder
    // In a real implementation, you'd capture console events during page creation

    return logs;
  }

  /**
   * List available orgs from SF CLI
   */
  async listOrgs(): Promise<
    Array<{ alias: string; username: string; isActive: boolean; orgId: string }>
  > {
    return this.orgManager.listOrgs();
  }
}
