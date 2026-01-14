/**
 * Test configuration for SF Browser Control MCP Server
 *
 * Set the SF_TEST_ORG_ALIAS environment variable or update the default below
 * to specify which Salesforce org to use for integration tests.
 */

export const testConfig = {
  /**
   * SF CLI org alias to use for integration tests.
   * Can be overridden with SF_TEST_ORG_ALIAS environment variable.
   */
  sfOrgAlias: process.env.SF_TEST_ORG_ALIAS || 'default',

  /**
   * Browser to use for tests (chromium, firefox, webkit)
   */
  browser: (process.env.SF_TEST_BROWSER as 'chromium' | 'firefox' | 'webkit') || 'chromium',

  /**
   * Whether to run browser in headless mode for tests
   */
  headless: process.env.SF_TEST_HEADLESS !== 'false',

  /**
   * Viewport dimensions for browser tests
   */
  viewport: {
    width: parseInt(process.env.SF_TEST_VIEWPORT_WIDTH || '1920', 10),
    height: parseInt(process.env.SF_TEST_VIEWPORT_HEIGHT || '1080', 10),
  },

  /**
   * Timeout for navigation operations (ms)
   */
  navigationTimeout: parseInt(process.env.SF_TEST_NAV_TIMEOUT || '30000', 10),

  /**
   * Timeout for element operations (ms)
   */
  elementTimeout: parseInt(process.env.SF_TEST_ELEMENT_TIMEOUT || '10000', 10),

  /**
   * Skip integration tests if no org is configured
   */
  skipIntegrationIfNoOrg: process.env.SF_TEST_SKIP_IF_NO_ORG !== 'false',

  /**
   * Test data - customize for your org
   */
  testData: {
    // Object to use for record creation tests (must exist in org)
    testObject: process.env.SF_TEST_OBJECT || 'Account',

    // Existing record ID for read tests (optional)
    existingRecordId: process.env.SF_TEST_RECORD_ID || '',

    // App name that exists in the org
    testApp: process.env.SF_TEST_APP || 'Sales',

    // Tab name that exists in the org
    testTab: process.env.SF_TEST_TAB || 'Accounts',
  },
};

/**
 * Helper to check if integration tests should run
 */
export function shouldRunIntegrationTests(): boolean {
  if (testConfig.sfOrgAlias === 'default' && testConfig.skipIntegrationIfNoOrg) {
    console.warn(
      'Skipping integration tests: SF_TEST_ORG_ALIAS not set. ' +
        'Set SF_TEST_ORG_ALIAS environment variable to run integration tests.'
    );
    return false;
  }
  return true;
}

/**
 * Helper to get test config summary
 */
export function getTestConfigSummary(): string {
  return `
Test Configuration:
  - SF Org Alias: ${testConfig.sfOrgAlias}
  - Browser: ${testConfig.browser}
  - Headless: ${testConfig.headless}
  - Viewport: ${testConfig.viewport.width}x${testConfig.viewport.height}
  - Navigation Timeout: ${testConfig.navigationTimeout}ms
  - Element Timeout: ${testConfig.elementTimeout}ms
  `.trim();
}
