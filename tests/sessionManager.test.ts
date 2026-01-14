import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { chromium, Browser, BrowserContext, Page } from 'playwright';

// Mock playwright
vi.mock('playwright', () => ({
  chromium: {
    launch: vi.fn(),
  },
  firefox: {
    launch: vi.fn(),
  },
  webkit: {
    launch: vi.fn(),
  },
}));

// Mock the auth module
vi.mock('../src/salesforce/auth.js', () => ({
  OrgManager: vi.fn().mockImplementation(() => ({
    getOrgInfo: vi.fn().mockResolvedValue({
      id: '00D000000000000',
      accessToken: 'mock-token',
      instanceUrl: 'https://test.lightning.force.com',
      username: 'test@example.com',
      status: 'Active',
      orgName: 'Test Org',
    }),
    getFrontdoorUrl: vi.fn().mockResolvedValue(
      'https://test.lightning.force.com/secur/frontdoor.jsp?sid=mocktoken'
    ),
    refreshAccessToken: vi.fn().mockResolvedValue('new-token'),
    listOrgs: vi.fn().mockResolvedValue([
      { alias: 'CFGAGNT3', username: 'test@example.com', isActive: true, orgId: '00D1' },
    ]),
  })),
}));

// Import after mocking
import { SessionManager } from '../src/browser/sessionManager.js';

describe('SessionManager', () => {
  let sessionManager: SessionManager;
  let mockPage: Partial<Page>;
  let mockContext: Partial<BrowserContext>;
  let mockBrowser: Partial<Browser>;

  beforeEach(() => {
    // Reset singleton for each test
    // @ts-expect-error - accessing private static property for testing
    SessionManager.instance = undefined;

    // Create mock page
    mockPage = {
      goto: vi.fn().mockResolvedValue(null),
      waitForSelector: vi.fn().mockResolvedValue(null),
      waitForFunction: vi.fn().mockResolvedValue(null),
      waitForURL: vi.fn().mockResolvedValue(null),
      waitForTimeout: vi.fn().mockResolvedValue(null),
      waitForLoadState: vi.fn().mockResolvedValue(null),
      locator: vi.fn().mockReturnValue({
        first: vi.fn().mockReturnValue({
          isVisible: vi.fn().mockResolvedValue(true),
          click: vi.fn().mockResolvedValue(null),
          fill: vi.fn().mockResolvedValue(null),
          textContent: vi.fn().mockResolvedValue('Test Content'),
        }),
      }),
      url: vi.fn().mockReturnValue('https://test.lightning.force.com/lightning/page/home'),
      close: vi.fn().mockResolvedValue(null),
      evaluate: vi.fn().mockResolvedValue(true),
      screenshot: vi.fn().mockResolvedValue(Buffer.from('fake-image')),
    };

    // Create mock context
    mockContext = {
      newPage: vi.fn().mockResolvedValue(mockPage),
      close: vi.fn().mockResolvedValue(null),
    };

    // Create mock browser
    mockBrowser = {
      newContext: vi.fn().mockResolvedValue(mockContext),
      close: vi.fn().mockResolvedValue(null),
    };

    // Setup chromium mock
    (chromium.launch as ReturnType<typeof vi.fn>).mockResolvedValue(mockBrowser);

    sessionManager = SessionManager.getInstance();
  });

  afterEach(async () => {
    await sessionManager.closeSession();
    vi.clearAllMocks();
  });

  describe('getInstance', () => {
    it('should return singleton instance', () => {
      const instance1 = SessionManager.getInstance();
      const instance2 = SessionManager.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('getStatus', () => {
    it('should return disconnected status initially', () => {
      const status = sessionManager.getStatus();
      expect(status.status).toBe('disconnected');
      expect(status.instanceUrl).toBeNull();
      expect(status.orgInfo).toBeNull();
    });
  });

  describe('startSession', () => {
    it('should launch browser and authenticate', async () => {
      await sessionManager.startSession({ orgAlias: 'CFGAGNT3' });

      const status = sessionManager.getStatus();
      expect(status.status).toBe('connected');
      expect(status.instanceUrl).toBe('https://test.lightning.force.com');
      expect(status.orgAlias).toBe('CFGAGNT3');
      expect(chromium.launch).toHaveBeenCalled();
    });

    it('should use custom viewport when provided', async () => {
      await sessionManager.startSession({
        orgAlias: 'CFGAGNT3',
        viewport: { width: 1280, height: 720 },
      });

      expect(mockBrowser.newContext).toHaveBeenCalledWith(
        expect.objectContaining({
          viewport: { width: 1280, height: 720 },
        })
      );
    });

    it('should navigate to frontdoor URL', async () => {
      await sessionManager.startSession({ orgAlias: 'CFGAGNT3' });

      expect(mockPage.goto).toHaveBeenCalledWith(
        expect.stringContaining('frontdoor.jsp'),
        expect.any(Object)
      );
    });
  });

  describe('ensureSession', () => {
    it('should throw error when session not started', async () => {
      await expect(sessionManager.ensureSession()).rejects.toThrow('No active browser session');
    });

    it('should return page when session is active', async () => {
      await sessionManager.startSession({ orgAlias: 'CFGAGNT3' });
      const page = await sessionManager.ensureSession();
      expect(page).toBeDefined();
    });
  });

  describe('closeSession', () => {
    it('should close browser resources', async () => {
      await sessionManager.startSession({ orgAlias: 'CFGAGNT3' });
      await sessionManager.closeSession();

      expect(mockPage.close).toHaveBeenCalled();
      expect(mockContext.close).toHaveBeenCalled();
      expect(mockBrowser.close).toHaveBeenCalled();

      const status = sessionManager.getStatus();
      expect(status.status).toBe('disconnected');
    });

    it('should handle close when no session', async () => {
      // Should not throw
      await sessionManager.closeSession();
    });
  });

  describe('navigate', () => {
    it('should navigate to path', async () => {
      await sessionManager.startSession({ orgAlias: 'CFGAGNT3' });
      await sessionManager.navigate('/lightning/setup');

      expect(mockPage.goto).toHaveBeenCalledWith(
        'https://test.lightning.force.com/lightning/setup',
        expect.any(Object)
      );
    });
  });

  describe('screenshot', () => {
    it('should take screenshot', async () => {
      await sessionManager.startSession({ orgAlias: 'CFGAGNT3' });
      const buffer = await sessionManager.screenshot();

      expect(mockPage.screenshot).toHaveBeenCalled();
      expect(buffer).toBeInstanceOf(Buffer);
    });

    it('should take full page screenshot', async () => {
      await sessionManager.startSession({ orgAlias: 'CFGAGNT3' });
      await sessionManager.screenshot({ fullPage: true });

      expect(mockPage.screenshot).toHaveBeenCalledWith({ fullPage: true });
    });
  });

  describe('getCurrentUrl', () => {
    it('should return current URL', async () => {
      await sessionManager.startSession({ orgAlias: 'CFGAGNT3' });
      const url = await sessionManager.getCurrentUrl();

      expect(url).toBe('https://test.lightning.force.com/lightning/page/home');
    });
  });

  describe('evaluate', () => {
    it('should execute JavaScript in page context', async () => {
      await sessionManager.startSession({ orgAlias: 'CFGAGNT3' });
      const result = await sessionManager.evaluate<boolean>('true');

      expect(mockPage.evaluate).toHaveBeenCalledWith('true');
      expect(result).toBe(true);
    });
  });

  describe('listOrgs', () => {
    it('should return list of orgs', async () => {
      const orgs = await sessionManager.listOrgs();

      expect(orgs).toHaveLength(1);
      expect(orgs[0].alias).toBe('CFGAGNT3');
    });
  });

  describe('getUrlBuilder', () => {
    it('should throw when session not started', () => {
      expect(() => sessionManager.getUrlBuilder()).toThrow('URL builder not available');
    });

    it('should return URL builder when session is active', async () => {
      await sessionManager.startSession({ orgAlias: 'CFGAGNT3' });
      const urlBuilder = sessionManager.getUrlBuilder();

      expect(urlBuilder).toBeDefined();
      expect(urlBuilder.getInstanceUrl()).toBe('https://test.lightning.force.com');
    });
  });
});
