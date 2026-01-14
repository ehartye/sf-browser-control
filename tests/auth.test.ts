import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { exec } from 'child_process';
import { promisify } from 'util';

// Mock child_process exec
vi.mock('child_process', () => ({
  exec: vi.fn(),
}));

// Import after mocking
import { SalesforceAuth, OrgManager } from '../src/salesforce/auth.js';

const mockExec = exec as unknown as ReturnType<typeof vi.fn>;

describe('SalesforceAuth', () => {
  let auth: SalesforceAuth;

  beforeEach(() => {
    auth = new SalesforceAuth();
    vi.clearAllMocks();
  });

  describe('getOrgInfo', () => {
    it('should return org info from SF CLI', async () => {
      const mockOrgInfo = {
        status: 0,
        result: {
          id: '00D000000000000',
          accessToken: 'mock-token-123',
          instanceUrl: 'https://myorg.lightning.force.com',
          username: 'test@example.com',
          status: 'Active',
        },
      };

      mockExec.mockImplementation((_cmd: string, callback: Function) => {
        callback(null, { stdout: JSON.stringify(mockOrgInfo) });
      });

      const result = await auth.getOrgInfo('myalias');

      expect(result.id).toBe('00D000000000000');
      expect(result.accessToken).toBe('mock-token-123');
      expect(result.instanceUrl).toBe('https://myorg.lightning.force.com');
      expect(result.username).toBe('test@example.com');
    });

    it('should throw error when org not found', async () => {
      mockExec.mockImplementation((_cmd: string, callback: Function) => {
        callback(new Error('No org configuration found for name badorg'));
      });

      await expect(auth.getOrgInfo('badorg')).rejects.toThrow('not found');
    });

    it('should throw error on non-zero status', async () => {
      const mockResponse = {
        status: 1,
        message: 'Error occurred',
      };

      mockExec.mockImplementation((_cmd: string, callback: Function) => {
        callback(null, { stdout: JSON.stringify(mockResponse) });
      });

      await expect(auth.getOrgInfo('myalias')).rejects.toThrow('status 1');
    });
  });

  describe('getFrontdoorUrl', () => {
    it('should return frontdoor URL from SF CLI', async () => {
      const mockResponse = {
        status: 0,
        result: {
          orgId: '00D000000000000',
          url: 'https://myorg.lightning.force.com/secur/frontdoor.jsp?sid=token123',
          username: 'test@example.com',
        },
      };

      mockExec.mockImplementation((_cmd: string, callback: Function) => {
        callback(null, { stdout: JSON.stringify(mockResponse) });
      });

      const result = await auth.getFrontdoorUrl('myalias');

      expect(result).toContain('frontdoor.jsp');
      expect(result).toContain('sid=token123');
    });

    it('should include path parameter when provided', async () => {
      const mockResponse = {
        status: 0,
        result: {
          orgId: '00D000000000000',
          url: 'https://myorg.lightning.force.com/secur/frontdoor.jsp?sid=token123&retURL=/lightning/setup',
          username: 'test@example.com',
        },
      };

      mockExec.mockImplementation((cmd: string, callback: Function) => {
        expect(cmd).toContain('--path');
        callback(null, { stdout: JSON.stringify(mockResponse) });
      });

      await auth.getFrontdoorUrl('myalias', '/lightning/setup');
    });
  });

  describe('listOrgs', () => {
    it('should return list of authenticated orgs', async () => {
      const mockResponse = {
        status: 0,
        result: {
          nonScratchOrgs: [
            { alias: 'prod', username: 'admin@prod.com', isDefaultUsername: true, orgId: '00D1' },
            { alias: 'sandbox', username: 'admin@sandbox.com', isDefaultUsername: false, orgId: '00D2' },
          ],
          scratchOrgs: [
            { alias: 'scratch1', username: 'test@scratch.com', isDefaultUsername: false, orgId: '00D3' },
          ],
        },
      };

      mockExec.mockImplementation((_cmd: string, callback: Function) => {
        callback(null, { stdout: JSON.stringify(mockResponse) });
      });

      const result = await auth.listOrgs();

      expect(result).toHaveLength(3);
      expect(result[0].alias).toBe('prod');
      expect(result[0].isActive).toBe(true);
      expect(result[1].alias).toBe('sandbox');
      expect(result[2].alias).toBe('scratch1');
    });

    it('should handle empty org lists', async () => {
      const mockResponse = {
        status: 0,
        result: {
          nonScratchOrgs: [],
          scratchOrgs: [],
        },
      };

      mockExec.mockImplementation((_cmd: string, callback: Function) => {
        callback(null, { stdout: JSON.stringify(mockResponse) });
      });

      const result = await auth.listOrgs();
      expect(result).toHaveLength(0);
    });
  });

  describe('buildFrontdoorUrl', () => {
    it('should build frontdoor URL from components', () => {
      const result = auth.buildFrontdoorUrl(
        'https://myorg.lightning.force.com',
        'token123'
      );

      expect(result).toBe(
        'https://myorg.lightning.force.com/secur/frontdoor.jsp?sid=token123'
      );
    });

    it('should include retURL when provided', () => {
      const result = auth.buildFrontdoorUrl(
        'https://myorg.lightning.force.com',
        'token123',
        '/lightning/setup'
      );

      expect(result).toContain('sid=token123');
      expect(result).toContain('retURL=%2Flightning%2Fsetup');
    });
  });
});

describe('OrgManager', () => {
  let orgManager: OrgManager;

  beforeEach(() => {
    orgManager = new OrgManager();
    vi.clearAllMocks();
  });

  describe('getOrgInfo with caching', () => {
    it('should cache org info', async () => {
      const mockOrgInfo = {
        status: 0,
        result: {
          id: '00D000000000000',
          accessToken: 'mock-token-123',
          instanceUrl: 'https://myorg.lightning.force.com',
          username: 'test@example.com',
          status: 'Active',
        },
      };

      mockExec.mockImplementation((_cmd: string, callback: Function) => {
        callback(null, { stdout: JSON.stringify(mockOrgInfo) });
      });

      // First call should hit SF CLI
      await orgManager.getOrgInfo('myalias');
      expect(mockExec).toHaveBeenCalledTimes(1);

      // Second call should use cache
      await orgManager.getOrgInfo('myalias');
      expect(mockExec).toHaveBeenCalledTimes(1);
    });

    it('should bypass cache with forceRefresh', async () => {
      const mockOrgInfo = {
        status: 0,
        result: {
          id: '00D000000000000',
          accessToken: 'mock-token-123',
          instanceUrl: 'https://myorg.lightning.force.com',
          username: 'test@example.com',
          status: 'Active',
        },
      };

      mockExec.mockImplementation((_cmd: string, callback: Function) => {
        callback(null, { stdout: JSON.stringify(mockOrgInfo) });
      });

      await orgManager.getOrgInfo('myalias');
      await orgManager.getOrgInfo('myalias', true);

      expect(mockExec).toHaveBeenCalledTimes(2);
    });
  });

  describe('clearCache', () => {
    it('should clear cached org info', async () => {
      const mockOrgInfo = {
        status: 0,
        result: {
          id: '00D000000000000',
          accessToken: 'mock-token-123',
          instanceUrl: 'https://myorg.lightning.force.com',
          username: 'test@example.com',
          status: 'Active',
        },
      };

      mockExec.mockImplementation((_cmd: string, callback: Function) => {
        callback(null, { stdout: JSON.stringify(mockOrgInfo) });
      });

      await orgManager.getOrgInfo('myalias');
      orgManager.clearCache();
      await orgManager.getOrgInfo('myalias');

      expect(mockExec).toHaveBeenCalledTimes(2);
    });
  });
});
