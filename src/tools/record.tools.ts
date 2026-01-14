import { z } from 'zod';
import { SessionManager } from '../browser/sessionManager.js';
import { SalesforceUIPatterns } from '../salesforce/uiPatterns.js';
import { SalesforceWaitStrategies } from '../salesforce/waitStrategies.js';
import { SF_SELECTORS } from '../salesforce/selectors.js';
import { ToolResult, SalesforceError } from '../types/index.js';

// Tool schemas
export const recordNewSchema = z.object({
  objectApiName: z.string().describe('API name of the object (e.g., "Account", "Contact", "Custom__c")'),
  recordTypeId: z.string().optional().describe('Record Type ID if applicable'),
});

export const recordEditSchema = z.object({
  recordId: z.string().optional().describe('Record ID to edit. If not provided, edits the current record on the page'),
});

export const recordSaveSchema = z.object({
  waitForSave: z.boolean().optional().describe('Wait for save to complete and return result (default: true)'),
});

export const recordCancelSchema = z.object({});

export const recordDeleteSchema = z.object({
  confirm: z.boolean().optional().describe('Confirm the delete operation (default: false, will not auto-confirm)'),
});

export const recordCloneSchema = z.object({});

// Tool handlers
export async function handleRecordNew(args: z.infer<typeof recordNewSchema>): Promise<ToolResult> {
  const sessionManager = SessionManager.getInstance();

  try {
    const urlBuilder = sessionManager.getUrlBuilder();
    const path = urlBuilder.newRecord(args.objectApiName, args.recordTypeId);

    await sessionManager.navigate(path);

    const page = await sessionManager.ensureSession();
    const waitStrategies = new SalesforceWaitStrategies(page);
    await waitStrategies.waitForFormReady();

    const currentUrl = await sessionManager.getCurrentUrl();

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            object: args.objectApiName,
            recordTypeId: args.recordTypeId || null,
            currentUrl,
            message: 'New record form is ready for input',
          }),
        },
      ],
    };
  } catch (error) {
    return handleRecordError(error, 'create new record');
  }
}

export async function handleRecordEdit(args: z.infer<typeof recordEditSchema>): Promise<ToolResult> {
  const sessionManager = SessionManager.getInstance();

  try {
    const page = await sessionManager.ensureSession();
    const waitStrategies = new SalesforceWaitStrategies(page);

    if (args.recordId) {
      // Navigate to edit page
      const urlBuilder = sessionManager.getUrlBuilder();
      const path = urlBuilder.recordEdit(args.recordId);
      await sessionManager.navigate(path);
    } else {
      // Click edit button on current page
      const editButton = page.locator(SF_SELECTORS.EDIT_BUTTON).first();
      await editButton.click();
    }

    await waitStrategies.waitForFormReady();
    const currentUrl = await sessionManager.getCurrentUrl();

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            recordId: args.recordId || 'current',
            currentUrl,
            message: 'Record is now in edit mode',
          }),
        },
      ],
    };
  } catch (error) {
    return handleRecordError(error, 'edit record');
  }
}

export async function handleRecordSave(args: z.infer<typeof recordSaveSchema>): Promise<ToolResult> {
  const sessionManager = SessionManager.getInstance();

  try {
    const page = await sessionManager.ensureSession();
    const uiPatterns = new SalesforceUIPatterns(page);

    const result = await uiPatterns.saveRecord();

    if (args.waitForSave !== false) {
      const currentUrl = await sessionManager.getCurrentUrl();
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: result.success,
              message: result.message,
              currentUrl,
            }),
          },
        ],
        isError: !result.success,
      };
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            message: 'Save initiated',
          }),
        },
      ],
    };
  } catch (error) {
    return handleRecordError(error, 'save record');
  }
}

export async function handleRecordCancel(): Promise<ToolResult> {
  const sessionManager = SessionManager.getInstance();

  try {
    const page = await sessionManager.ensureSession();
    const uiPatterns = new SalesforceUIPatterns(page);

    await uiPatterns.cancelEdit();
    const currentUrl = await sessionManager.getCurrentUrl();

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            message: 'Edit cancelled',
            currentUrl,
          }),
        },
      ],
    };
  } catch (error) {
    return handleRecordError(error, 'cancel edit');
  }
}

export async function handleRecordDelete(args: z.infer<typeof recordDeleteSchema>): Promise<ToolResult> {
  const sessionManager = SessionManager.getInstance();

  try {
    const page = await sessionManager.ensureSession();
    const waitStrategies = new SalesforceWaitStrategies(page);

    // Click delete button
    const deleteButton = page.locator(SF_SELECTORS.DELETE_BUTTON).first();
    await deleteButton.click();

    // Wait for confirmation dialog
    await waitStrategies.waitForModal();

    if (args.confirm) {
      // Click confirm/delete in the modal
      const confirmButton = page.locator('button:has-text("Delete")').last();
      await confirmButton.click();

      // Wait for deletion to complete
      try {
        const toast = await waitStrategies.waitForToast(10000);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: toast.type === 'success',
                message: toast.message,
              }),
            },
          ],
          isError: toast.type !== 'success',
        };
      } catch {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                message: 'Delete operation completed',
              }),
            },
          ],
        };
      }
    } else {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              message: 'Delete confirmation dialog is open. Set confirm=true to proceed with deletion.',
              warning: 'This action cannot be undone.',
            }),
          },
        ],
      };
    }
  } catch (error) {
    return handleRecordError(error, 'delete record');
  }
}

export async function handleRecordClone(): Promise<ToolResult> {
  const sessionManager = SessionManager.getInstance();

  try {
    const page = await sessionManager.ensureSession();
    const waitStrategies = new SalesforceWaitStrategies(page);

    // Click clone button
    const cloneButton = page.locator(SF_SELECTORS.CLONE_BUTTON).first();
    await cloneButton.click();

    await waitStrategies.waitForFormReady();
    const currentUrl = await sessionManager.getCurrentUrl();

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            message: 'Record clone form is ready',
            currentUrl,
          }),
        },
      ],
    };
  } catch (error) {
    return handleRecordError(error, 'clone record');
  }
}

// Helper function for error handling
function handleRecordError(error: unknown, action: string): ToolResult {
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
export const recordTools = [
  {
    name: 'sf_record_new',
    description: 'Open a new record form for creating a record of the specified object type.',
    inputSchema: recordNewSchema,
    handler: handleRecordNew,
  },
  {
    name: 'sf_record_edit',
    description: 'Open a record in edit mode. If recordId is not provided, edits the current record on the page.',
    inputSchema: recordEditSchema,
    handler: handleRecordEdit,
  },
  {
    name: 'sf_record_save',
    description: 'Save the current record form. Returns success/failure status and any toast messages.',
    inputSchema: recordSaveSchema,
    handler: handleRecordSave,
  },
  {
    name: 'sf_record_cancel',
    description: 'Cancel the current record edit and return to view mode.',
    inputSchema: recordCancelSchema,
    handler: handleRecordCancel,
  },
  {
    name: 'sf_record_delete',
    description: 'Delete the current record. Set confirm=true to confirm the deletion.',
    inputSchema: recordDeleteSchema,
    handler: handleRecordDelete,
  },
  {
    name: 'sf_record_clone',
    description: 'Clone the current record by opening a pre-filled new record form.',
    inputSchema: recordCloneSchema,
    handler: handleRecordClone,
  },
];
