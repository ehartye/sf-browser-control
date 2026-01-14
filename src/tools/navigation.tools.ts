import { z } from 'zod';
import { SessionManager } from '../browser/sessionManager.js';
import { SalesforceWaitStrategies } from '../salesforce/waitStrategies.js';
import { SalesforceUIPatterns } from '../salesforce/uiPatterns.js';
import { ToolResult, SalesforceError } from '../types/index.js';

// Tool schemas
export const navigateHomeSchema = z.object({});

export const navigateSetupSchema = z.object({
  section: z
    .string()
    .optional()
    .describe('Optional setup section to navigate to (e.g., "Users", "Profiles", "PermSets")'),
});

export const navigateSetupSearchSchema = z.object({
  searchTerm: z.string().describe('The term to search for in Setup Quick Find'),
});

export const navigateObjectSchema = z.object({
  objectApiName: z
    .string()
    .describe('API name of the object (e.g., "Account", "Contact", "Custom__c")'),
  recordId: z.string().optional().describe('Record ID to view a specific record'),
  listViewName: z.string().optional().describe('List view API name or ID'),
});

export const navigateAppSchema = z.object({
  appName: z.string().describe('Name of the app to open via App Launcher'),
});

export const navigateUrlSchema = z.object({
  path: z.string().describe('Relative path to navigate to (e.g., "/lightning/setup/Users/home")'),
});

export const navigateRecordSchema = z.object({
  recordId: z.string().describe('The 15 or 18 character Salesforce record ID'),
});

export const navigateTabSchema = z.object({
  tabName: z.string().describe('Name of the tab to navigate to'),
});

// Tool handlers
export async function handleNavigateHome(): Promise<ToolResult> {
  const sessionManager = SessionManager.getInstance();

  try {
    const urlBuilder = sessionManager.getUrlBuilder();
    await sessionManager.navigate(urlBuilder.home());

    const currentUrl = await sessionManager.getCurrentUrl();

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            navigatedTo: 'Home',
            currentUrl,
          }),
        },
      ],
    };
  } catch (error) {
    return handleNavigationError(error);
  }
}

export async function handleNavigateSetup(
  args: z.infer<typeof navigateSetupSchema>
): Promise<ToolResult> {
  const sessionManager = SessionManager.getInstance();

  try {
    const urlBuilder = sessionManager.getUrlBuilder();
    let path: string;

    if (args.section) {
      // Map common section names to setup paths
      const sectionMap: Record<string, string> = {
        Users: 'ManageUsers',
        Profiles: 'Profiles',
        PermSets: 'PermSets',
        PermissionSets: 'PermSets',
        Roles: 'Roles',
        ObjectManager: 'ObjectManager',
        Apps: 'NavigationMenus',
        Flows: 'Flows',
        ApexClasses: 'ApexClasses',
        CustomSettings: 'CustomSettings',
        CustomMetadata: 'CustomMetadata',
      };
      const setupSection = sectionMap[args.section] || args.section;
      path = urlBuilder.setupPage(setupSection);
    } else {
      path = urlBuilder.setupHome();
    }

    await sessionManager.navigate(path);
    const currentUrl = await sessionManager.getCurrentUrl();

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            navigatedTo: args.section ? `Setup - ${args.section}` : 'Setup Home',
            currentUrl,
          }),
        },
      ],
    };
  } catch (error) {
    return handleNavigationError(error);
  }
}

export async function handleNavigateSetupSearch(
  args: z.infer<typeof navigateSetupSearchSchema>
): Promise<ToolResult> {
  const sessionManager = SessionManager.getInstance();

  try {
    const page = await sessionManager.ensureSession();
    const urlBuilder = sessionManager.getUrlBuilder();
    const uiPatterns = new SalesforceUIPatterns(page);
    const waitStrategies = new SalesforceWaitStrategies(page);

    // First navigate to Setup if not already there
    const currentUrl = page.url();
    if (!currentUrl.includes('/lightning/setup/')) {
      await sessionManager.navigate(urlBuilder.setupHome());
      await waitStrategies.waitForSetupPage();
    }

    // Use Quick Find
    await uiPatterns.setupQuickFind(args.searchTerm);

    // Click the first matching result
    await page.waitForTimeout(500); // Wait for search results
    await uiPatterns.clickSetupMenuItem(args.searchTerm);

    const newUrl = await sessionManager.getCurrentUrl();

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            searchTerm: args.searchTerm,
            currentUrl: newUrl,
          }),
        },
      ],
    };
  } catch (error) {
    return handleNavigationError(error);
  }
}

export async function handleNavigateObject(
  args: z.infer<typeof navigateObjectSchema>
): Promise<ToolResult> {
  const sessionManager = SessionManager.getInstance();

  try {
    const urlBuilder = sessionManager.getUrlBuilder();
    let path: string;

    if (args.recordId) {
      path = urlBuilder.recordView(args.recordId);
    } else {
      path = urlBuilder.objectHome(args.objectApiName, args.listViewName);
    }

    await sessionManager.navigate(path);
    const currentUrl = await sessionManager.getCurrentUrl();

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            object: args.objectApiName,
            recordId: args.recordId || null,
            listView: args.listViewName || null,
            currentUrl,
          }),
        },
      ],
    };
  } catch (error) {
    return handleNavigationError(error);
  }
}

export async function handleNavigateApp(
  args: z.infer<typeof navigateAppSchema>
): Promise<ToolResult> {
  const sessionManager = SessionManager.getInstance();

  try {
    const page = await sessionManager.ensureSession();
    const uiPatterns = new SalesforceUIPatterns(page);

    await uiPatterns.openApp(args.appName);
    const currentUrl = await sessionManager.getCurrentUrl();

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            app: args.appName,
            currentUrl,
          }),
        },
      ],
    };
  } catch (error) {
    return handleNavigationError(error);
  }
}

export async function handleNavigateUrl(
  args: z.infer<typeof navigateUrlSchema>
): Promise<ToolResult> {
  const sessionManager = SessionManager.getInstance();

  try {
    await sessionManager.navigate(args.path);
    const currentUrl = await sessionManager.getCurrentUrl();

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            path: args.path,
            currentUrl,
          }),
        },
      ],
    };
  } catch (error) {
    return handleNavigationError(error);
  }
}

export async function handleNavigateRecord(
  args: z.infer<typeof navigateRecordSchema>
): Promise<ToolResult> {
  const sessionManager = SessionManager.getInstance();

  try {
    const urlBuilder = sessionManager.getUrlBuilder();
    const path = urlBuilder.recordView(args.recordId);

    await sessionManager.navigate(path);
    const currentUrl = await sessionManager.getCurrentUrl();

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            recordId: args.recordId,
            currentUrl,
          }),
        },
      ],
    };
  } catch (error) {
    return handleNavigationError(error);
  }
}

export async function handleNavigateTab(
  args: z.infer<typeof navigateTabSchema>
): Promise<ToolResult> {
  const sessionManager = SessionManager.getInstance();

  try {
    const page = await sessionManager.ensureSession();
    const uiPatterns = new SalesforceUIPatterns(page);

    await uiPatterns.clickTab(args.tabName);
    const currentUrl = await sessionManager.getCurrentUrl();

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            tab: args.tabName,
            currentUrl,
          }),
        },
      ],
    };
  } catch (error) {
    return handleNavigationError(error);
  }
}

// Helper function for error handling
function handleNavigationError(error: unknown): ToolResult {
  if (error instanceof SalesforceError) {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: false,
            error: error.code,
            message: error.message,
            suggestion: error.suggestion,
          }),
        },
      ],
      isError: true,
    };
  }

  const message = error instanceof Error ? error.message : 'Unknown error';

  // Check for common navigation errors
  if (message.includes('Timeout')) {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: false,
            error: 'NAVIGATION_TIMEOUT',
            message: 'Navigation timed out. The page may be slow to load.',
            suggestion: 'Try again or check your network connection.',
          }),
        },
      ],
      isError: true,
    };
  }

  return {
    content: [
      {
        type: 'text',
        text: `Navigation failed: ${message}`,
      },
    ],
    isError: true,
  };
}

// Tool definitions for MCP registration
export const navigationTools = [
  {
    name: 'sf_navigate_home',
    description: 'Navigate to the Salesforce home page.',
    inputSchema: navigateHomeSchema,
    handler: handleNavigateHome,
  },
  {
    name: 'sf_navigate_setup',
    description:
      'Navigate to Salesforce Setup. Optionally specify a section like "Users", "Profiles", "PermSets", "ObjectManager", etc.',
    inputSchema: navigateSetupSchema,
    handler: handleNavigateSetup,
  },
  {
    name: 'sf_navigate_setup_search',
    description: 'Search in Setup using Quick Find and navigate to the result.',
    inputSchema: navigateSetupSearchSchema,
    handler: handleNavigateSetupSearch,
  },
  {
    name: 'sf_navigate_object',
    description:
      'Navigate to an object list view or a specific record. Use objectApiName for the object (e.g., "Account", "Contact", "MyObject__c").',
    inputSchema: navigateObjectSchema,
    handler: handleNavigateObject,
  },
  {
    name: 'sf_navigate_app',
    description: 'Open the App Launcher and navigate to a specific app by name.',
    inputSchema: navigateAppSchema,
    handler: handleNavigateApp,
  },
  {
    name: 'sf_navigate_url',
    description:
      'Navigate to a specific Salesforce URL path (relative path after the instance URL).',
    inputSchema: navigateUrlSchema,
    handler: handleNavigateUrl,
  },
  {
    name: 'sf_navigate_record',
    description: 'Navigate directly to a record by its ID.',
    inputSchema: navigateRecordSchema,
    handler: handleNavigateRecord,
  },
  {
    name: 'sf_navigate_tab',
    description: 'Navigate to a specific tab in the current app.',
    inputSchema: navigateTabSchema,
    handler: handleNavigateTab,
  },
];
