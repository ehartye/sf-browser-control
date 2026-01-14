import { z } from 'zod';
import { SessionManager } from '../browser/sessionManager.js';
import { SalesforceUIPatterns } from '../salesforce/uiPatterns.js';
import { SalesforceWaitStrategies } from '../salesforce/waitStrategies.js';
import { SF_SELECTORS } from '../salesforce/selectors.js';
import { ToolResult, SalesforceError } from '../types/index.js';

// Tool schemas
export const screenshotSchema = z.object({
  fullPage: z.boolean().optional().describe('Capture the full scrollable page (default: false)'),
  selector: z.string().optional().describe('CSS selector of specific element to capture'),
});

export const getPageTextSchema = z.object({
  selector: z.string().optional().describe('CSS selector to get text from specific element'),
});

export const getElementTextSchema = z.object({
  selector: z.string().describe('CSS selector of the element'),
});

export const getFieldValueSchema = z.object({
  fieldLabel: z.string().describe('The visible label of the form field'),
});

export const getRecordDetailsSchema = z.object({});

export const getToastMessageSchema = z.object({
  timeout: z.number().optional().describe('Timeout in milliseconds to wait for toast (default: 10000)'),
});

export const getCurrentUrlSchema = z.object({});

export const evaluateJsSchema = z.object({
  script: z.string().describe('JavaScript code to execute in the page context'),
});

export const waitForSpinnerSchema = z.object({
  timeout: z.number().optional().describe('Timeout in milliseconds (default: 15000)'),
});

export const waitForNavigationSchema = z.object({
  timeout: z.number().optional().describe('Timeout in milliseconds (default: 30000)'),
});

// Tool handlers
export async function handleScreenshot(args: z.infer<typeof screenshotSchema>): Promise<ToolResult> {
  const sessionManager = SessionManager.getInstance();

  try {
    const buffer = await sessionManager.screenshot({
      fullPage: args.fullPage,
      selector: args.selector,
    });

    const base64 = buffer.toString('base64');

    return {
      content: [
        {
          type: 'image',
          data: base64,
          mimeType: 'image/png',
        },
      ],
    };
  } catch (error) {
    return handleCaptureError(error, 'take screenshot');
  }
}

export async function handleGetPageText(args: z.infer<typeof getPageTextSchema>): Promise<ToolResult> {
  const sessionManager = SessionManager.getInstance();

  try {
    const page = await sessionManager.ensureSession();
    const uiPatterns = new SalesforceUIPatterns(page);

    const text = await uiPatterns.getPageText(args.selector);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            text: text.substring(0, 10000), // Limit text length
            truncated: text.length > 10000,
          }),
        },
      ],
    };
  } catch (error) {
    return handleCaptureError(error, 'get page text');
  }
}

export async function handleGetElementText(
  args: z.infer<typeof getElementTextSchema>
): Promise<ToolResult> {
  const sessionManager = SessionManager.getInstance();

  try {
    const page = await sessionManager.ensureSession();
    const element = page.locator(args.selector).first();
    const text = await element.textContent();

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            selector: args.selector,
            text: text?.trim() || '',
          }),
        },
      ],
    };
  } catch (error) {
    return handleCaptureError(error, 'get element text');
  }
}

export async function handleGetFieldValue(
  args: z.infer<typeof getFieldValueSchema>
): Promise<ToolResult> {
  const sessionManager = SessionManager.getInstance();

  try {
    const page = await sessionManager.ensureSession();
    const uiPatterns = new SalesforceUIPatterns(page);

    const value = await uiPatterns.getFieldValue(args.fieldLabel);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            field: args.fieldLabel,
            value,
          }),
        },
      ],
    };
  } catch (error) {
    return handleCaptureError(error, 'get field value');
  }
}

export async function handleGetRecordDetails(): Promise<ToolResult> {
  const sessionManager = SessionManager.getInstance();

  try {
    const page = await sessionManager.ensureSession();
    const uiPatterns = new SalesforceUIPatterns(page);

    // Get record name from highlights panel
    const recordName = await uiPatterns.getRecordName();

    // Get all visible field values from the record page
    const details: Record<string, string> = {
      recordName,
    };

    // Try to extract field values from the detail section
    const detailSections = await page.locator(SF_SELECTORS.RECORD_DETAIL_SECTION).all();

    for (const section of detailSections) {
      // Get field labels and values
      const fields = await section
        .locator('records-record-layout-item, lightning-output-field')
        .all();

      for (const field of fields) {
        try {
          const labelEl = await field.locator('label, span[class*="label"]').first();
          const valueEl = await field
            .locator(
              'lightning-formatted-text, lightning-formatted-name, lightning-formatted-phone, lightning-formatted-email, lightning-formatted-url, lightning-formatted-number, span[class*="value"]'
            )
            .first();

          const label = await labelEl.textContent().catch(() => null);
          const value = await valueEl.textContent().catch(() => null);

          if (label && value) {
            details[label.trim()] = value.trim();
          }
        } catch {
          // Skip fields that can't be read
        }
      }
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            details,
          }, null, 2),
        },
      ],
    };
  } catch (error) {
    return handleCaptureError(error, 'get record details');
  }
}

export async function handleGetToastMessage(
  args: z.infer<typeof getToastMessageSchema>
): Promise<ToolResult> {
  const sessionManager = SessionManager.getInstance();

  try {
    const page = await sessionManager.ensureSession();
    const uiPatterns = new SalesforceUIPatterns(page);

    const toast = await uiPatterns.getToastMessage(args.timeout ?? 10000);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            type: toast.type,
            message: toast.message,
          }),
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: false,
            message: 'No toast message found within timeout',
          }),
        },
      ],
    };
  }
}

export async function handleGetCurrentUrl(): Promise<ToolResult> {
  const sessionManager = SessionManager.getInstance();

  try {
    const url = await sessionManager.getCurrentUrl();

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            url,
          }),
        },
      ],
    };
  } catch (error) {
    return handleCaptureError(error, 'get current URL');
  }
}

export async function handleEvaluateJs(args: z.infer<typeof evaluateJsSchema>): Promise<ToolResult> {
  const sessionManager = SessionManager.getInstance();

  try {
    const result = await sessionManager.evaluate(args.script);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            result,
          }, null, 2),
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: false,
            error: error instanceof Error ? error.message : 'Script execution failed',
          }),
        },
      ],
      isError: true,
    };
  }
}

export async function handleWaitForSpinner(
  args: z.infer<typeof waitForSpinnerSchema>
): Promise<ToolResult> {
  const sessionManager = SessionManager.getInstance();

  try {
    const page = await sessionManager.ensureSession();
    const waitStrategies = new SalesforceWaitStrategies(page);

    await waitStrategies.waitForNoSpinners(args.timeout ?? 15000);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            message: 'Spinners have disappeared',
          }),
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: false,
            message: 'Spinners did not disappear within timeout',
          }),
        },
      ],
      isError: true,
    };
  }
}

export async function handleWaitForNavigation(
  args: z.infer<typeof waitForNavigationSchema>
): Promise<ToolResult> {
  const sessionManager = SessionManager.getInstance();

  try {
    const page = await sessionManager.ensureSession();
    const waitStrategies = new SalesforceWaitStrategies(page);

    await waitStrategies.waitForNavigation(args.timeout ?? 30000);
    const url = await sessionManager.getCurrentUrl();

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            message: 'Navigation completed',
            currentUrl: url,
          }),
        },
      ],
    };
  } catch (error) {
    return handleCaptureError(error, 'wait for navigation');
  }
}

// Helper function for error handling
function handleCaptureError(error: unknown, action: string): ToolResult {
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
export const captureTools = [
  {
    name: 'sf_screenshot',
    description: 'Take a screenshot of the current page or a specific element.',
    inputSchema: screenshotSchema,
    handler: handleScreenshot,
  },
  {
    name: 'sf_get_page_text',
    description: 'Get all visible text content from the page or a specific element.',
    inputSchema: getPageTextSchema,
    handler: handleGetPageText,
  },
  {
    name: 'sf_get_element_text',
    description: 'Get the text content of a specific element by selector.',
    inputSchema: getElementTextSchema,
    handler: handleGetElementText,
  },
  {
    name: 'sf_get_field_value',
    description: 'Get the current value of a form field by its label.',
    inputSchema: getFieldValueSchema,
    handler: handleGetFieldValue,
  },
  {
    name: 'sf_get_record_details',
    description: 'Get all visible record details from the current record page.',
    inputSchema: getRecordDetailsSchema,
    handler: handleGetRecordDetails,
  },
  {
    name: 'sf_get_toast_message',
    description: 'Get the current toast notification message. Waits for a toast to appear if none is visible.',
    inputSchema: getToastMessageSchema,
    handler: handleGetToastMessage,
  },
  {
    name: 'sf_get_current_url',
    description: 'Get the current page URL.',
    inputSchema: getCurrentUrlSchema,
    handler: handleGetCurrentUrl,
  },
  {
    name: 'sf_evaluate_js',
    description: 'Execute JavaScript code in the page context and return the result.',
    inputSchema: evaluateJsSchema,
    handler: handleEvaluateJs,
  },
  {
    name: 'sf_wait_for_spinner',
    description: 'Wait for all Lightning spinners to disappear.',
    inputSchema: waitForSpinnerSchema,
    handler: handleWaitForSpinner,
  },
  {
    name: 'sf_wait_for_navigation',
    description: 'Wait for page navigation to complete.',
    inputSchema: waitForNavigationSchema,
    handler: handleWaitForNavigation,
  },
];
