import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { SessionManager } from './browser/sessionManager.js';

// Import all tool handlers directly
import {
  sessionStartSchema,
  handleSessionStart,
  handleSessionStatus,
  handleSessionRefresh,
  handleSessionClose,
  handleListOrgs,
} from './tools/session.tools.js';

import {
  handleNavigateHome,
  handleNavigateSetup,
  handleNavigateSetupSearch,
  handleNavigateObject,
  handleNavigateApp,
  handleNavigateUrl,
  handleNavigateRecord,
  handleNavigateTab,
  navigateSetupSchema,
  navigateSetupSearchSchema,
  navigateObjectSchema,
  navigateAppSchema,
  navigateUrlSchema,
  navigateRecordSchema,
  navigateTabSchema,
} from './tools/navigation.tools.js';

import {
  handleClick,
  handleClickButton,
  handleFill,
  handleFillField,
  handleSelectPicklist,
  handleSelectLookup,
  handleCheckCheckbox,
  handleFillDate,
  handleHover,
  handlePressKey,
  handleScroll,
  handleWaitForElement,
  clickSchema,
  clickButtonSchema,
  fillSchema,
  fillFieldSchema,
  selectPicklistSchema,
  selectLookupSchema,
  checkCheckboxSchema,
  fillDateSchema,
  hoverSchema,
  pressKeySchema,
  scrollSchema,
  waitForElementSchema,
} from './tools/interaction.tools.js';

import {
  handleRecordNew,
  handleRecordEdit,
  handleRecordSave,
  handleRecordCancel,
  handleRecordDelete,
  handleRecordClone,
  recordNewSchema,
  recordEditSchema,
  recordSaveSchema,
  recordDeleteSchema,
} from './tools/record.tools.js';

import {
  handleSetupQuickFind,
  handleSetupCreateUser,
  handleSetupPermissionSet,
  handleSetupProfile,
  handleSetupObjectManager,
  handleSetupFlow,
  setupQuickFindSchema,
  setupPermissionSetSchema,
  setupProfileSchema,
  setupObjectManagerSchema,
  setupFlowSchema,
} from './tools/setup.tools.js';

import {
  handleScreenshot,
  handleGetPageText,
  handleGetElementText,
  handleGetFieldValue,
  handleGetRecordDetails,
  handleGetToastMessage,
  handleGetCurrentUrl,
  handleEvaluateJs,
  handleWaitForSpinner,
  handleWaitForNavigation,
  screenshotSchema,
  getPageTextSchema,
  getElementTextSchema,
  getFieldValueSchema,
  getToastMessageSchema,
  evaluateJsSchema,
  waitForSpinnerSchema,
  waitForNavigationSchema,
} from './tools/capture.tools.js';

export function createServer(): McpServer {
  const server = new McpServer({
    name: 'sf-browser-control',
    version: '1.0.0',
  });

  // Session tools
  server.tool(
    'sf_session_start',
    'Launch an authenticated browser session for a Salesforce org using SF CLI credentials',
    {
      orgAlias: z.string().describe('SF CLI org alias or username'),
      browser: z.enum(['chromium', 'firefox', 'webkit']).optional().describe('Browser engine'),
      headless: z.boolean().optional().describe('Run in headless mode'),
      viewportWidth: z.number().optional().describe('Viewport width'),
      viewportHeight: z.number().optional().describe('Viewport height'),
    },
    async (args) => handleSessionStart(args)
  );

  server.tool(
    'sf_session_status',
    'Get the current browser session status and org information',
    {},
    async () => handleSessionStatus()
  );

  server.tool(
    'sf_session_refresh',
    'Refresh the access token if the session has expired',
    {},
    async () => handleSessionRefresh()
  );

  server.tool(
    'sf_session_close',
    'Close the browser session and clean up resources',
    {},
    async () => handleSessionClose()
  );

  server.tool(
    'sf_list_orgs',
    'List all Salesforce orgs authenticated with SF CLI',
    {},
    async () => handleListOrgs()
  );

  // Navigation tools
  server.tool(
    'sf_navigate_home',
    'Navigate to the Salesforce home page',
    {},
    async () => handleNavigateHome()
  );

  server.tool(
    'sf_navigate_setup',
    'Navigate to Salesforce Setup. Optionally specify a section',
    { section: z.string().optional().describe('Setup section like Users, Profiles, PermSets') },
    async (args) => handleNavigateSetup(args)
  );

  server.tool(
    'sf_navigate_setup_search',
    'Search in Setup using Quick Find and navigate to the result',
    { searchTerm: z.string().describe('The term to search for') },
    async (args) => handleNavigateSetupSearch(args)
  );

  server.tool(
    'sf_navigate_object',
    'Navigate to an object list view or a specific record',
    {
      objectApiName: z.string().describe('API name of the object'),
      recordId: z.string().optional().describe('Record ID to view'),
      listViewName: z.string().optional().describe('List view name'),
    },
    async (args) => handleNavigateObject(args)
  );

  server.tool(
    'sf_navigate_app',
    'Open the App Launcher and navigate to a specific app',
    { appName: z.string().describe('Name of the app') },
    async (args) => handleNavigateApp(args)
  );

  server.tool(
    'sf_navigate_url',
    'Navigate to a specific Salesforce URL path',
    { path: z.string().describe('Relative path to navigate to') },
    async (args) => handleNavigateUrl(args)
  );

  server.tool(
    'sf_navigate_record',
    'Navigate directly to a record by its ID',
    { recordId: z.string().describe('The Salesforce record ID') },
    async (args) => handleNavigateRecord(args)
  );

  server.tool(
    'sf_navigate_tab',
    'Navigate to a specific tab in the current app',
    { tabName: z.string().describe('Name of the tab') },
    async (args) => handleNavigateTab(args)
  );

  // Interaction tools
  server.tool(
    'sf_click',
    'Click an element by CSS selector',
    {
      selector: z.string().describe('CSS selector of the element'),
      timeout: z.number().optional().describe('Timeout in ms'),
      force: z.boolean().optional().describe('Force click'),
    },
    async (args) => handleClick(args)
  );

  server.tool(
    'sf_click_button',
    'Click a Lightning button by its visible label text',
    {
      label: z.string().describe('Button label text'),
      timeout: z.number().optional().describe('Timeout in ms'),
    },
    async (args) => handleClickButton(args)
  );

  server.tool(
    'sf_fill',
    'Fill an input element by CSS selector',
    {
      selector: z.string().describe('CSS selector'),
      value: z.string().describe('Value to enter'),
      clear: z.boolean().optional().describe('Clear before filling'),
    },
    async (args) => handleFill(args)
  );

  server.tool(
    'sf_fill_field',
    'Fill a Lightning form field by its label',
    {
      fieldLabel: z.string().describe('Field label'),
      value: z.string().describe('Value to enter'),
      fieldType: z.enum(['text', 'textarea', 'picklist', 'lookup', 'date', 'datetime', 'checkbox', 'number']).optional(),
    },
    async (args) => handleFillField(args)
  );

  server.tool(
    'sf_select_picklist',
    'Select a value from a Lightning picklist field',
    {
      fieldLabel: z.string().describe('Picklist field label'),
      value: z.string().describe('Value to select'),
    },
    async (args) => handleSelectPicklist(args)
  );

  server.tool(
    'sf_select_lookup',
    'Search and select a value in a Lightning lookup field',
    {
      fieldLabel: z.string().describe('Lookup field label'),
      searchTerm: z.string().describe('Search term'),
      selectIndex: z.number().optional().describe('Index of result to select'),
    },
    async (args) => handleSelectLookup(args)
  );

  server.tool(
    'sf_check_checkbox',
    'Check or uncheck a Lightning checkbox field',
    {
      fieldLabel: z.string().describe('Checkbox field label'),
      checked: z.boolean().describe('Whether to check'),
    },
    async (args) => handleCheckCheckbox(args)
  );

  server.tool(
    'sf_fill_date',
    'Fill a Lightning date or datetime field',
    {
      fieldLabel: z.string().describe('Date field label'),
      date: z.string().describe('Date value'),
      includeTime: z.boolean().optional(),
      time: z.string().optional().describe('Time value'),
    },
    async (args) => handleFillDate(args)
  );

  server.tool(
    'sf_hover',
    'Hover over an element',
    { selector: z.string().describe('CSS selector') },
    async (args) => handleHover(args)
  );

  server.tool(
    'sf_press_key',
    'Press a keyboard key',
    {
      key: z.string().describe('Key to press'),
      selector: z.string().optional().describe('Element to focus first'),
    },
    async (args) => handlePressKey(args)
  );

  server.tool(
    'sf_scroll',
    'Scroll the page or element',
    {
      direction: z.enum(['up', 'down', 'left', 'right']),
      amount: z.number().optional().describe('Pixels to scroll'),
      selector: z.string().optional().describe('Element to scroll'),
    },
    async (args) => handleScroll(args)
  );

  server.tool(
    'sf_wait_for_element',
    'Wait for an element to reach a specific state',
    {
      selector: z.string().describe('CSS selector'),
      state: z.enum(['visible', 'hidden', 'attached', 'detached']).optional(),
      timeout: z.number().optional(),
    },
    async (args) => handleWaitForElement(args)
  );

  // Record tools
  server.tool(
    'sf_record_new',
    'Open a new record form for creating a record',
    {
      objectApiName: z.string().describe('Object API name'),
      recordTypeId: z.string().optional(),
    },
    async (args) => handleRecordNew(args)
  );

  server.tool(
    'sf_record_edit',
    'Open a record in edit mode',
    { recordId: z.string().optional().describe('Record ID to edit') },
    async (args) => handleRecordEdit(args)
  );

  server.tool(
    'sf_record_save',
    'Save the current record form',
    { waitForSave: z.boolean().optional() },
    async (args) => handleRecordSave(args)
  );

  server.tool(
    'sf_record_cancel',
    'Cancel the current record edit',
    {},
    async () => handleRecordCancel()
  );

  server.tool(
    'sf_record_delete',
    'Delete the current record',
    { confirm: z.boolean().optional().describe('Confirm deletion') },
    async (args) => handleRecordDelete(args)
  );

  server.tool(
    'sf_record_clone',
    'Clone the current record',
    {},
    async () => handleRecordClone()
  );

  // Setup tools
  server.tool(
    'sf_setup_quick_find',
    'Use Setup Quick Find to search',
    { searchTerm: z.string().describe('Search term') },
    async (args) => handleSetupQuickFind(args)
  );

  server.tool(
    'sf_setup_create_user',
    'Navigate to the Create User form',
    {},
    async () => handleSetupCreateUser()
  );

  server.tool(
    'sf_setup_permission_set',
    'Navigate to a specific permission set',
    { permSetName: z.string().describe('Permission set name') },
    async (args) => handleSetupPermissionSet(args)
  );

  server.tool(
    'sf_setup_profile',
    'Navigate to a specific profile',
    { profileName: z.string().describe('Profile name') },
    async (args) => handleSetupProfile(args)
  );

  server.tool(
    'sf_setup_object_manager',
    'Navigate to Object Manager for an object',
    {
      objectApiName: z.string().describe('Object API name'),
      section: z.enum(['Fields', 'PageLayouts', 'ValidationRules', 'Triggers', 'LightningPages', 'Buttons']).optional(),
    },
    async (args) => handleSetupObjectManager(args)
  );

  server.tool(
    'sf_setup_flow',
    'Navigate to Flow Builder',
    { flowApiName: z.string().optional().describe('Flow API name') },
    async (args) => handleSetupFlow(args)
  );

  // Capture tools
  server.tool(
    'sf_screenshot',
    'Take a screenshot of the current page or element',
    {
      fullPage: z.boolean().optional().describe('Capture full page'),
      selector: z.string().optional().describe('Element to capture'),
    },
    async (args) => handleScreenshot(args)
  );

  server.tool(
    'sf_get_page_text',
    'Get all visible text content from the page',
    { selector: z.string().optional().describe('Element selector') },
    async (args) => handleGetPageText(args)
  );

  server.tool(
    'sf_get_element_text',
    'Get text content of a specific element',
    { selector: z.string().describe('CSS selector') },
    async (args) => handleGetElementText(args)
  );

  server.tool(
    'sf_get_field_value',
    'Get the current value of a form field',
    { fieldLabel: z.string().describe('Field label') },
    async (args) => handleGetFieldValue(args)
  );

  server.tool(
    'sf_get_record_details',
    'Get all visible record details from the current page',
    {},
    async () => handleGetRecordDetails()
  );

  server.tool(
    'sf_get_toast_message',
    'Get the current toast notification message',
    { timeout: z.number().optional() },
    async (args) => handleGetToastMessage(args)
  );

  server.tool(
    'sf_get_current_url',
    'Get the current page URL',
    {},
    async () => handleGetCurrentUrl()
  );

  server.tool(
    'sf_evaluate_js',
    'Execute JavaScript in the page context',
    { script: z.string().describe('JavaScript code') },
    async (args) => handleEvaluateJs(args)
  );

  server.tool(
    'sf_wait_for_spinner',
    'Wait for all Lightning spinners to disappear',
    { timeout: z.number().optional() },
    async (args) => handleWaitForSpinner(args)
  );

  server.tool(
    'sf_wait_for_navigation',
    'Wait for page navigation to complete',
    { timeout: z.number().optional() },
    async (args) => handleWaitForNavigation(args)
  );

  return server;
}

export async function cleanupServer(): Promise<void> {
  const sessionManager = SessionManager.getInstance();
  await sessionManager.closeSession();
}
