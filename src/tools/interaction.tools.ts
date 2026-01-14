import { z } from 'zod';
import { SessionManager } from '../browser/sessionManager.js';
import { SalesforceUIPatterns } from '../salesforce/uiPatterns.js';
import { SalesforceWaitStrategies } from '../salesforce/waitStrategies.js';
import { SF_SELECTORS } from '../salesforce/selectors.js';
import { ToolResult, SalesforceError } from '../types/index.js';

// Tool schemas
export const clickSchema = z.object({
  selector: z.string().describe('CSS selector of the element to click'),
  timeout: z.number().optional().describe('Timeout in milliseconds (default: 10000)'),
  force: z.boolean().optional().describe('Force click even if element is not visible'),
});

export const clickButtonSchema = z.object({
  label: z.string().describe('The visible label text of the button to click'),
  timeout: z.number().optional().describe('Timeout in milliseconds (default: 10000)'),
});

export const fillSchema = z.object({
  selector: z.string().describe('CSS selector of the input element'),
  value: z.string().describe('Value to enter'),
  clear: z.boolean().optional().describe('Clear existing value before filling (default: true)'),
});

export const fillFieldSchema = z.object({
  fieldLabel: z.string().describe('The visible label of the Lightning field'),
  value: z.string().describe('Value to enter'),
  fieldType: z
    .enum(['text', 'textarea', 'picklist', 'lookup', 'date', 'datetime', 'checkbox', 'number'])
    .optional()
    .describe('Type of field for proper handling (default: text)'),
});

export const selectPicklistSchema = z.object({
  fieldLabel: z.string().describe('The visible label of the picklist field'),
  value: z.string().describe('The value to select'),
});

export const selectLookupSchema = z.object({
  fieldLabel: z.string().describe('The visible label of the lookup field'),
  searchTerm: z.string().describe('Search term to find the record'),
  selectIndex: z.number().optional().describe('Index of result to select (default: 0, first result)'),
});

export const checkCheckboxSchema = z.object({
  fieldLabel: z.string().describe('The visible label of the checkbox field'),
  checked: z.boolean().describe('Whether the checkbox should be checked'),
});

export const fillDateSchema = z.object({
  fieldLabel: z.string().describe('The visible label of the date field'),
  date: z.string().describe('Date value in format MM/DD/YYYY or YYYY-MM-DD'),
  includeTime: z.boolean().optional().describe('Whether to include time (for datetime fields)'),
  time: z.string().optional().describe('Time value in format HH:MM AM/PM'),
});

export const hoverSchema = z.object({
  selector: z.string().describe('CSS selector of the element to hover over'),
});

export const pressKeySchema = z.object({
  key: z.string().describe('Key to press (e.g., "Enter", "Tab", "Escape", "ArrowDown")'),
  selector: z.string().optional().describe('Optional selector to focus before pressing key'),
});

export const scrollSchema = z.object({
  direction: z.enum(['up', 'down', 'left', 'right']).describe('Direction to scroll'),
  amount: z.number().optional().describe('Amount to scroll in pixels (default: 300)'),
  selector: z.string().optional().describe('Optional selector of element to scroll within'),
});

export const waitForElementSchema = z.object({
  selector: z.string().describe('CSS selector of the element to wait for'),
  state: z
    .enum(['visible', 'hidden', 'attached', 'detached'])
    .optional()
    .describe('State to wait for (default: visible)'),
  timeout: z.number().optional().describe('Timeout in milliseconds (default: 10000)'),
});

// Tool handlers
export async function handleClick(args: z.infer<typeof clickSchema>): Promise<ToolResult> {
  const sessionManager = SessionManager.getInstance();

  try {
    const page = await sessionManager.ensureSession();
    const waitStrategies = new SalesforceWaitStrategies(page);

    const locator = page.locator(args.selector).first();
    await locator.click({
      timeout: args.timeout ?? 10000,
      force: args.force,
    });

    await waitStrategies.waitForNoSpinners(5000).catch(() => {});

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            clicked: args.selector,
          }),
        },
      ],
    };
  } catch (error) {
    return handleInteractionError(error, 'click');
  }
}

export async function handleClickButton(
  args: z.infer<typeof clickButtonSchema>
): Promise<ToolResult> {
  const sessionManager = SessionManager.getInstance();

  try {
    const page = await sessionManager.ensureSession();
    const uiPatterns = new SalesforceUIPatterns(page);
    const waitStrategies = new SalesforceWaitStrategies(page);

    await uiPatterns.clickButton(args.label);
    await waitStrategies.waitForNoSpinners(5000).catch(() => {});

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            clickedButton: args.label,
          }),
        },
      ],
    };
  } catch (error) {
    return handleInteractionError(error, 'click button');
  }
}

export async function handleFill(args: z.infer<typeof fillSchema>): Promise<ToolResult> {
  const sessionManager = SessionManager.getInstance();

  try {
    const page = await sessionManager.ensureSession();
    const locator = page.locator(args.selector).first();

    if (args.clear !== false) {
      await locator.clear();
    }
    await locator.fill(args.value);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            filled: args.selector,
            value: args.value,
          }),
        },
      ],
    };
  } catch (error) {
    return handleInteractionError(error, 'fill');
  }
}

export async function handleFillField(
  args: z.infer<typeof fillFieldSchema>
): Promise<ToolResult> {
  const sessionManager = SessionManager.getInstance();

  try {
    const page = await sessionManager.ensureSession();
    const uiPatterns = new SalesforceUIPatterns(page);

    await uiPatterns.fillFormField(args.fieldLabel, args.value, args.fieldType ?? 'text');

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            field: args.fieldLabel,
            value: args.value,
            fieldType: args.fieldType ?? 'text',
          }),
        },
      ],
    };
  } catch (error) {
    return handleInteractionError(error, 'fill field');
  }
}

export async function handleSelectPicklist(
  args: z.infer<typeof selectPicklistSchema>
): Promise<ToolResult> {
  const sessionManager = SessionManager.getInstance();

  try {
    const page = await sessionManager.ensureSession();
    const uiPatterns = new SalesforceUIPatterns(page);

    await uiPatterns.selectPicklistValue(args.fieldLabel, args.value);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            field: args.fieldLabel,
            selectedValue: args.value,
          }),
        },
      ],
    };
  } catch (error) {
    return handleInteractionError(error, 'select picklist');
  }
}

export async function handleSelectLookup(
  args: z.infer<typeof selectLookupSchema>
): Promise<ToolResult> {
  const sessionManager = SessionManager.getInstance();

  try {
    const page = await sessionManager.ensureSession();
    const uiPatterns = new SalesforceUIPatterns(page);

    await uiPatterns.selectLookupValue(args.fieldLabel, args.searchTerm, args.selectIndex ?? 0);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            field: args.fieldLabel,
            searchTerm: args.searchTerm,
            selectedIndex: args.selectIndex ?? 0,
          }),
        },
      ],
    };
  } catch (error) {
    return handleInteractionError(error, 'select lookup');
  }
}

export async function handleCheckCheckbox(
  args: z.infer<typeof checkCheckboxSchema>
): Promise<ToolResult> {
  const sessionManager = SessionManager.getInstance();

  try {
    const page = await sessionManager.ensureSession();
    const uiPatterns = new SalesforceUIPatterns(page);

    await uiPatterns.setCheckbox(args.fieldLabel, args.checked);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            field: args.fieldLabel,
            checked: args.checked,
          }),
        },
      ],
    };
  } catch (error) {
    return handleInteractionError(error, 'check checkbox');
  }
}

export async function handleFillDate(args: z.infer<typeof fillDateSchema>): Promise<ToolResult> {
  const sessionManager = SessionManager.getInstance();

  try {
    const page = await sessionManager.ensureSession();
    const uiPatterns = new SalesforceUIPatterns(page);

    if (args.includeTime && args.time) {
      await uiPatterns.fillDateTimeField(args.fieldLabel, args.date, args.time);
    } else {
      await uiPatterns.fillDateField(args.fieldLabel, args.date);
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            field: args.fieldLabel,
            date: args.date,
            time: args.time,
          }),
        },
      ],
    };
  } catch (error) {
    return handleInteractionError(error, 'fill date');
  }
}

export async function handleHover(args: z.infer<typeof hoverSchema>): Promise<ToolResult> {
  const sessionManager = SessionManager.getInstance();

  try {
    const page = await sessionManager.ensureSession();
    const locator = page.locator(args.selector).first();
    await locator.hover();

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            hoveredOver: args.selector,
          }),
        },
      ],
    };
  } catch (error) {
    return handleInteractionError(error, 'hover');
  }
}

export async function handlePressKey(args: z.infer<typeof pressKeySchema>): Promise<ToolResult> {
  const sessionManager = SessionManager.getInstance();

  try {
    const page = await sessionManager.ensureSession();

    if (args.selector) {
      const locator = page.locator(args.selector).first();
      await locator.press(args.key);
    } else {
      await page.keyboard.press(args.key);
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            pressed: args.key,
            onElement: args.selector || 'page',
          }),
        },
      ],
    };
  } catch (error) {
    return handleInteractionError(error, 'press key');
  }
}

export async function handleScroll(args: z.infer<typeof scrollSchema>): Promise<ToolResult> {
  const sessionManager = SessionManager.getInstance();

  try {
    const page = await sessionManager.ensureSession();
    const amount = args.amount ?? 300;

    let deltaX = 0;
    let deltaY = 0;

    switch (args.direction) {
      case 'up':
        deltaY = -amount;
        break;
      case 'down':
        deltaY = amount;
        break;
      case 'left':
        deltaX = -amount;
        break;
      case 'right':
        deltaX = amount;
        break;
    }

    if (args.selector) {
      const element = page.locator(args.selector).first();
      await element.evaluate(
        (el, { dx, dy }) => {
          el.scrollBy(dx, dy);
        },
        { dx: deltaX, dy: deltaY }
      );
    } else {
      await page.mouse.wheel(deltaX, deltaY);
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            direction: args.direction,
            amount,
            element: args.selector || 'page',
          }),
        },
      ],
    };
  } catch (error) {
    return handleInteractionError(error, 'scroll');
  }
}

export async function handleWaitForElement(
  args: z.infer<typeof waitForElementSchema>
): Promise<ToolResult> {
  const sessionManager = SessionManager.getInstance();

  try {
    const page = await sessionManager.ensureSession();
    const locator = page.locator(args.selector).first();

    await locator.waitFor({
      state: args.state ?? 'visible',
      timeout: args.timeout ?? 10000,
    });

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            selector: args.selector,
            state: args.state ?? 'visible',
          }),
        },
      ],
    };
  } catch (error) {
    return handleInteractionError(error, 'wait for element');
  }
}

// Helper function for error handling
function handleInteractionError(error: unknown, action: string): ToolResult {
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

  if (message.includes('Timeout') || message.includes('waiting')) {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: false,
            error: 'ELEMENT_NOT_FOUND',
            message: `Element not found or not interactable during ${action}`,
            suggestion: 'Verify the selector is correct and the element is visible. Try taking a screenshot to see the current page state.',
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
        text: `Failed to ${action}: ${message}`,
      },
    ],
    isError: true,
  };
}

// Tool definitions for MCP registration
export const interactionTools = [
  {
    name: 'sf_click',
    description: 'Click an element by CSS selector.',
    inputSchema: clickSchema,
    handler: handleClick,
  },
  {
    name: 'sf_click_button',
    description: 'Click a Lightning button by its visible label text.',
    inputSchema: clickButtonSchema,
    handler: handleClickButton,
  },
  {
    name: 'sf_fill',
    description: 'Fill an input element by CSS selector.',
    inputSchema: fillSchema,
    handler: handleFill,
  },
  {
    name: 'sf_fill_field',
    description:
      'Fill a Lightning form field by its label. Supports text, textarea, picklist, lookup, date, datetime, checkbox, and number fields.',
    inputSchema: fillFieldSchema,
    handler: handleFillField,
  },
  {
    name: 'sf_select_picklist',
    description: 'Select a value from a Lightning picklist field.',
    inputSchema: selectPicklistSchema,
    handler: handleSelectPicklist,
  },
  {
    name: 'sf_select_lookup',
    description: 'Search and select a value in a Lightning lookup field.',
    inputSchema: selectLookupSchema,
    handler: handleSelectLookup,
  },
  {
    name: 'sf_check_checkbox',
    description: 'Check or uncheck a Lightning checkbox field.',
    inputSchema: checkCheckboxSchema,
    handler: handleCheckCheckbox,
  },
  {
    name: 'sf_fill_date',
    description: 'Fill a Lightning date or datetime field.',
    inputSchema: fillDateSchema,
    handler: handleFillDate,
  },
  {
    name: 'sf_hover',
    description: 'Hover over an element to reveal tooltips or dropdowns.',
    inputSchema: hoverSchema,
    handler: handleHover,
  },
  {
    name: 'sf_press_key',
    description: 'Press a keyboard key, optionally on a specific element.',
    inputSchema: pressKeySchema,
    handler: handlePressKey,
  },
  {
    name: 'sf_scroll',
    description: 'Scroll the page or a specific element.',
    inputSchema: scrollSchema,
    handler: handleScroll,
  },
  {
    name: 'sf_wait_for_element',
    description: 'Wait for an element to reach a specific state (visible, hidden, attached, detached).',
    inputSchema: waitForElementSchema,
    handler: handleWaitForElement,
  },
];
