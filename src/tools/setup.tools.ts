import { z } from 'zod';
import { SessionManager } from '../browser/sessionManager.js';
import { SalesforceUIPatterns } from '../salesforce/uiPatterns.js';
import { SalesforceWaitStrategies } from '../salesforce/waitStrategies.js';
import { ToolResult, SalesforceError } from '../types/index.js';

// Tool schemas
export const setupQuickFindSchema = z.object({
  searchTerm: z.string().describe('Search term for Setup Quick Find'),
});

export const setupCreateUserSchema = z.object({});

export const setupPermissionSetSchema = z.object({
  permSetName: z.string().describe('Name of the permission set to navigate to'),
});

export const setupProfileSchema = z.object({
  profileName: z.string().describe('Name of the profile to navigate to'),
});

export const setupObjectManagerSchema = z.object({
  objectApiName: z.string().describe('API name of the object'),
  section: z
    .enum(['Fields', 'PageLayouts', 'ValidationRules', 'Triggers', 'LightningPages', 'Buttons'])
    .optional()
    .describe('Object Manager section to navigate to'),
});

export const setupFlowSchema = z.object({
  flowApiName: z.string().optional().describe('API name of the flow to open in Flow Builder'),
});

// Tool handlers
export async function handleSetupQuickFind(
  args: z.infer<typeof setupQuickFindSchema>
): Promise<ToolResult> {
  const sessionManager = SessionManager.getInstance();

  try {
    const page = await sessionManager.ensureSession();
    const urlBuilder = sessionManager.getUrlBuilder();
    const uiPatterns = new SalesforceUIPatterns(page);
    const waitStrategies = new SalesforceWaitStrategies(page);

    // Navigate to Setup if not already there
    const currentUrl = page.url();
    if (!currentUrl.includes('/lightning/setup/')) {
      await sessionManager.navigate(urlBuilder.setupHome());
      await waitStrategies.waitForSetupPage();
    }

    // Use Quick Find
    await uiPatterns.setupQuickFind(args.searchTerm);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            searchTerm: args.searchTerm,
            message: 'Quick Find search completed. Click on a result to navigate.',
          }),
        },
      ],
    };
  } catch (error) {
    return handleSetupError(error, 'use Quick Find');
  }
}

export async function handleSetupCreateUser(): Promise<ToolResult> {
  const sessionManager = SessionManager.getInstance();

  try {
    const urlBuilder = sessionManager.getUrlBuilder();

    // Navigate to Users page first
    await sessionManager.navigate(urlBuilder.users());

    const page = await sessionManager.ensureSession();
    const waitStrategies = new SalesforceWaitStrategies(page);
    await waitStrategies.waitForSetupPage();

    // Click New User button
    const newButton = page.locator('input[name="new"], a:has-text("New User"), button:has-text("New User")').first();
    await newButton.click();

    await waitStrategies.waitForFormReady();
    const currentUrl = await sessionManager.getCurrentUrl();

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            message: 'New user form is ready',
            currentUrl,
          }),
        },
      ],
    };
  } catch (error) {
    return handleSetupError(error, 'navigate to create user');
  }
}

export async function handleSetupPermissionSet(
  args: z.infer<typeof setupPermissionSetSchema>
): Promise<ToolResult> {
  const sessionManager = SessionManager.getInstance();

  try {
    const page = await sessionManager.ensureSession();
    const urlBuilder = sessionManager.getUrlBuilder();
    const uiPatterns = new SalesforceUIPatterns(page);
    const waitStrategies = new SalesforceWaitStrategies(page);

    // Navigate to Permission Sets
    await sessionManager.navigate(urlBuilder.permissionSets());
    await waitStrategies.waitForSetupPage();

    // Search for the permission set
    await uiPatterns.setupQuickFind(args.permSetName);
    await page.waitForTimeout(500);

    // Click on the permission set link in the list
    const permSetLink = page.locator(`a:has-text("${args.permSetName}")`).first();
    await permSetLink.click();

    await waitStrategies.waitForSetupPage();
    const currentUrl = await sessionManager.getCurrentUrl();

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            permissionSet: args.permSetName,
            currentUrl,
          }),
        },
      ],
    };
  } catch (error) {
    return handleSetupError(error, 'navigate to permission set');
  }
}

export async function handleSetupProfile(
  args: z.infer<typeof setupProfileSchema>
): Promise<ToolResult> {
  const sessionManager = SessionManager.getInstance();

  try {
    const page = await sessionManager.ensureSession();
    const urlBuilder = sessionManager.getUrlBuilder();
    const uiPatterns = new SalesforceUIPatterns(page);
    const waitStrategies = new SalesforceWaitStrategies(page);

    // Navigate to Profiles
    await sessionManager.navigate(urlBuilder.profiles());
    await waitStrategies.waitForSetupPage();

    // Search for the profile
    await uiPatterns.setupQuickFind(args.profileName);
    await page.waitForTimeout(500);

    // Click on the profile link
    const profileLink = page.locator(`a:has-text("${args.profileName}")`).first();
    await profileLink.click();

    await waitStrategies.waitForSetupPage();
    const currentUrl = await sessionManager.getCurrentUrl();

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            profile: args.profileName,
            currentUrl,
          }),
        },
      ],
    };
  } catch (error) {
    return handleSetupError(error, 'navigate to profile');
  }
}

export async function handleSetupObjectManager(
  args: z.infer<typeof setupObjectManagerSchema>
): Promise<ToolResult> {
  const sessionManager = SessionManager.getInstance();

  try {
    const urlBuilder = sessionManager.getUrlBuilder();
    const path = urlBuilder.objectManager(args.objectApiName, args.section);

    await sessionManager.navigate(path);

    const page = await sessionManager.ensureSession();
    const waitStrategies = new SalesforceWaitStrategies(page);
    await waitStrategies.waitForSetupPage();

    const currentUrl = await sessionManager.getCurrentUrl();

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            object: args.objectApiName,
            section: args.section || 'Details',
            currentUrl,
          }),
        },
      ],
    };
  } catch (error) {
    return handleSetupError(error, 'navigate to Object Manager');
  }
}

export async function handleSetupFlow(args: z.infer<typeof setupFlowSchema>): Promise<ToolResult> {
  const sessionManager = SessionManager.getInstance();

  try {
    const urlBuilder = sessionManager.getUrlBuilder();
    const path = urlBuilder.flowBuilder(args.flowApiName);

    await sessionManager.navigate(path);

    const page = await sessionManager.ensureSession();
    const waitStrategies = new SalesforceWaitStrategies(page);

    if (args.flowApiName) {
      // Wait for Flow Builder to load
      await page.waitForSelector('.flowBuilderRoot, .canvas, .flow-canvas', {
        timeout: 30000,
      }).catch(() => {
        // Flow Builder might have different DOM structure
      });
    } else {
      await waitStrategies.waitForSetupPage();
    }

    const currentUrl = await sessionManager.getCurrentUrl();

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            flow: args.flowApiName || 'Flow list',
            currentUrl,
          }),
        },
      ],
    };
  } catch (error) {
    return handleSetupError(error, 'navigate to Flow');
  }
}

// Helper function for error handling
function handleSetupError(error: unknown, action: string): ToolResult {
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

  return {
    content: [
      {
        type: 'text',
        text: `Failed to ${action}: ${message}`,
      },
    ],
    isError: true,
  };
}

// Tool definitions for MCP registration
export const setupTools = [
  {
    name: 'sf_setup_quick_find',
    description: 'Use Setup Quick Find to search for setup items. Navigates to Setup first if not already there.',
    inputSchema: setupQuickFindSchema,
    handler: handleSetupQuickFind,
  },
  {
    name: 'sf_setup_create_user',
    description: 'Navigate to the Create User form in Setup.',
    inputSchema: setupCreateUserSchema,
    handler: handleSetupCreateUser,
  },
  {
    name: 'sf_setup_permission_set',
    description: 'Navigate to a specific permission set in Setup.',
    inputSchema: setupPermissionSetSchema,
    handler: handleSetupPermissionSet,
  },
  {
    name: 'sf_setup_profile',
    description: 'Navigate to a specific profile in Setup.',
    inputSchema: setupProfileSchema,
    handler: handleSetupProfile,
  },
  {
    name: 'sf_setup_object_manager',
    description: 'Navigate to Object Manager for a specific object. Optionally go to a specific section like Fields, PageLayouts, ValidationRules, Triggers, etc.',
    inputSchema: setupObjectManagerSchema,
    handler: handleSetupObjectManager,
  },
  {
    name: 'sf_setup_flow',
    description: 'Navigate to Flow Builder. Optionally open a specific flow by its API name.',
    inputSchema: setupFlowSchema,
    handler: handleSetupFlow,
  },
];
