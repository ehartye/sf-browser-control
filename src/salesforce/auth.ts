import { exec } from 'child_process';
import { promisify } from 'util';
import { OrgDisplayResult, OrgOpenResult, OrgInfo } from '../types/index.js';

const execAsync = promisify(exec);

export class SalesforceAuth {
  /**
   * Get org details including access token from SF CLI
   */
  async getOrgInfo(orgAliasOrUsername: string): Promise<OrgInfo> {
    try {
      const { stdout } = await execAsync(
        `sf org display --target-org "${orgAliasOrUsername}" --json`
      );
      const result: OrgDisplayResult = JSON.parse(stdout);

      if (result.status !== 0) {
        throw new Error(`SF CLI returned status ${result.status}: ${stdout}`);
      }

      return result.result;
    } catch (error) {
      if (error instanceof Error && error.message.includes('No org')) {
        throw new Error(
          `Org "${orgAliasOrUsername}" not found. Run "sf org list" to see available orgs.`
        );
      }
      throw error;
    }
  }

  /**
   * Get frontdoor.jsp URL for browser authentication
   * This is the preferred method as it handles session security properly
   */
  async getFrontdoorUrl(
    orgAliasOrUsername: string,
    targetPath?: string
  ): Promise<string> {
    try {
      const pathArg = targetPath ? ` --path "${targetPath}"` : '';
      const { stdout } = await execAsync(
        `sf org open --target-org "${orgAliasOrUsername}" --url-only --json${pathArg}`
      );
      const result: OrgOpenResult = JSON.parse(stdout);

      if (result.status !== 0) {
        throw new Error(`SF CLI returned status ${result.status}: ${stdout}`);
      }

      return result.result.url;
    } catch (error) {
      if (error instanceof Error && error.message.includes('No org')) {
        throw new Error(
          `Org "${orgAliasOrUsername}" not found. Run "sf org list" to see available orgs.`
        );
      }
      throw error;
    }
  }

  /**
   * List all authenticated orgs
   */
  async listOrgs(): Promise<
    Array<{ alias: string; username: string; isActive: boolean; orgId: string }>
  > {
    const { stdout } = await execAsync('sf org list --json');
    const result = JSON.parse(stdout);

    const orgs: Array<{
      alias: string;
      username: string;
      isActive: boolean;
      orgId: string;
    }> = [];

    if (result.result?.nonScratchOrgs) {
      for (const org of result.result.nonScratchOrgs) {
        orgs.push({
          alias: org.alias || '',
          username: org.username,
          isActive: org.isDefaultUsername || false,
          orgId: org.orgId,
        });
      }
    }

    if (result.result?.scratchOrgs) {
      for (const org of result.result.scratchOrgs) {
        orgs.push({
          alias: org.alias || '',
          username: org.username,
          isActive: org.isDefaultUsername || false,
          orgId: org.orgId,
        });
      }
    }

    return orgs;
  }

  /**
   * Manually construct frontdoor URL from access token
   * Useful when token is already available
   */
  buildFrontdoorUrl(
    instanceUrl: string,
    accessToken: string,
    retUrl?: string
  ): string {
    const baseUrl = `${instanceUrl}/secur/frontdoor.jsp`;
    const params = new URLSearchParams({
      sid: accessToken,
    });

    if (retUrl) {
      params.append('retURL', retUrl);
    }

    return `${baseUrl}?${params.toString()}`;
  }
}

// Cached org info with TTL
interface CachedOrgInfo {
  orgInfo: OrgInfo;
  cachedAt: Date;
  expiresAt: Date;
}

export class OrgManager {
  private cache: Map<string, CachedOrgInfo> = new Map();
  private auth: SalesforceAuth;
  private readonly CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

  constructor() {
    this.auth = new SalesforceAuth();
  }

  async getOrgInfo(orgAlias: string, forceRefresh = false): Promise<OrgInfo> {
    const cached = this.cache.get(orgAlias);

    if (!forceRefresh && cached && cached.expiresAt > new Date()) {
      return cached.orgInfo;
    }

    const orgInfo = await this.auth.getOrgInfo(orgAlias);

    this.cache.set(orgAlias, {
      orgInfo,
      cachedAt: new Date(),
      expiresAt: new Date(Date.now() + this.CACHE_TTL_MS),
    });

    return orgInfo;
  }

  async refreshAccessToken(orgAlias: string): Promise<string> {
    const orgInfo = await this.getOrgInfo(orgAlias, true);
    return orgInfo.accessToken;
  }

  async getFrontdoorUrl(orgAlias: string, targetPath?: string): Promise<string> {
    return this.auth.getFrontdoorUrl(orgAlias, targetPath);
  }

  async listOrgs() {
    return this.auth.listOrgs();
  }

  clearCache(): void {
    this.cache.clear();
  }
}
