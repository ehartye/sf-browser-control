import { Page } from 'playwright';
import { SF_SELECTORS } from './selectors.js';
import { SalesforceWaitStrategies } from './waitStrategies.js';

/**
 * Handlers for common Salesforce UI patterns
 */
export class SalesforceUIPatterns {
  private waitStrategies: SalesforceWaitStrategies;

  constructor(private page: Page) {
    this.waitStrategies = new SalesforceWaitStrategies(page);
  }

  /**
   * Handle lookup field selection
   */
  async selectLookupValue(
    fieldLabel: string,
    searchTerm: string,
    selectIndex = 0
  ): Promise<void> {
    // Click the lookup field to open
    const lookupField = this.page.locator(SF_SELECTORS.LOOKUP_BY_LABEL(fieldLabel)).first();
    await lookupField.click();

    // Type search term
    const searchInput = this.page.locator(SF_SELECTORS.LOOKUP_SEARCH_INPUT).first();
    await searchInput.fill(searchTerm);

    // Wait for search results
    await this.waitStrategies.waitForLookupResults();

    // Select the result
    const options = await this.page.locator('lightning-base-combobox-item').all();
    if (options.length > selectIndex) {
      await options[selectIndex].click();
    } else if (options.length > 0) {
      await options[0].click();
    } else {
      throw new Error(
        `No lookup options found for "${searchTerm}" in field "${fieldLabel}"`
      );
    }

    // Wait for selection to complete
    await this.page.waitForTimeout(300);
  }

  /**
   * Handle picklist selection
   */
  async selectPicklistValue(fieldLabel: string, value: string): Promise<void> {
    const picklistField = this.page.locator(SF_SELECTORS.PICKLIST_BY_LABEL(fieldLabel)).first();

    // Click to open dropdown
    await picklistField.click();

    // Wait for options to appear
    await this.waitStrategies.waitForPicklistOptions();

    // Select the value
    const option = this.page.locator(SF_SELECTORS.PICKLIST_OPTION(value)).first();
    await option.click();

    // Wait for selection to complete
    await this.page.waitForTimeout(200);
  }

  /**
   * Handle checkbox toggle
   */
  async setCheckbox(fieldLabel: string, checked: boolean): Promise<void> {
    const checkbox = this.page.locator(SF_SELECTORS.CHECKBOX_BY_LABEL(fieldLabel)).first();
    const isChecked = await checkbox.isChecked();

    if (isChecked !== checked) {
      await checkbox.click();
    }
  }

  /**
   * Handle date field
   */
  async fillDateField(fieldLabel: string, dateValue: string): Promise<void> {
    const dateField = this.page.locator(SF_SELECTORS.DATE_PICKER_BY_LABEL(fieldLabel)).first();
    const input = dateField.locator('input').first();
    await input.fill(dateValue);
    // Trigger blur to ensure date is set
    await input.blur();
  }

  /**
   * Handle datetime field
   */
  async fillDateTimeField(
    fieldLabel: string,
    dateValue: string,
    timeValue?: string
  ): Promise<void> {
    const dateTimeField = this.page
      .locator(SF_SELECTORS.DATETIME_PICKER_BY_LABEL(fieldLabel))
      .first();

    // Fill date
    const dateInput = dateTimeField.locator('input[type="text"]').first();
    await dateInput.fill(dateValue);

    // Fill time if provided
    if (timeValue) {
      const timeInput = dateTimeField.locator('input[type="text"]').nth(1);
      await timeInput.fill(timeValue);
    }

    await dateInput.blur();
  }

  /**
   * Handle modal dialogs
   */
  async waitAndInteractWithModal(
    action: 'save' | 'cancel' | 'close'
  ): Promise<void> {
    await this.waitStrategies.waitForModal();

    const modal = this.page.locator(SF_SELECTORS.MODAL).first();

    switch (action) {
      case 'save':
        await modal.locator(SF_SELECTORS.SAVE_BUTTON).first().click();
        break;
      case 'cancel':
        await modal.locator(SF_SELECTORS.CANCEL_BUTTON).first().click();
        break;
      case 'close':
        await modal.locator(SF_SELECTORS.MODAL_CLOSE).first().click();
        break;
    }

    // Wait for modal to close
    await this.waitStrategies.waitForModalClose();
  }

  /**
   * Fill a form field based on field type
   */
  async fillFormField(
    fieldLabel: string,
    value: string,
    fieldType:
      | 'text'
      | 'textarea'
      | 'picklist'
      | 'lookup'
      | 'date'
      | 'datetime'
      | 'checkbox'
      | 'number' = 'text'
  ): Promise<void> {
    switch (fieldType) {
      case 'text':
      case 'number': {
        const input = this.page.locator(SF_SELECTORS.INPUT_BY_LABEL(fieldLabel)).first();
        await input.fill(value);
        break;
      }

      case 'textarea': {
        const textarea = this.page.locator(SF_SELECTORS.TEXTAREA_BY_LABEL(fieldLabel)).first();
        await textarea.fill(value);
        break;
      }

      case 'picklist':
        await this.selectPicklistValue(fieldLabel, value);
        break;

      case 'lookup':
        await this.selectLookupValue(fieldLabel, value);
        break;

      case 'date':
        await this.fillDateField(fieldLabel, value);
        break;

      case 'datetime':
        await this.fillDateTimeField(fieldLabel, value);
        break;

      case 'checkbox':
        await this.setCheckbox(
          fieldLabel,
          value.toLowerCase() === 'true' || value === '1'
        );
        break;
    }
  }

  /**
   * Use App Launcher to navigate to an app
   */
  async openApp(appName: string, timeout = 30000): Promise<void> {
    const startTime = Date.now();
    const getRemaining = () => Math.max(timeout - (Date.now() - startTime), 1000);

    // Click App Launcher button - try multiple selectors
    const appLauncherButton = this.page.locator(SF_SELECTORS.APP_LAUNCHER_BUTTON).first();
    await appLauncherButton.waitFor({ state: 'visible', timeout: getRemaining() });
    await appLauncherButton.click();

    // Wait for app launcher modal/panel to open
    await this.page.waitForTimeout(1000);

    // Wait for the App Launcher modal to be visible
    const appLauncherModal = this.page.locator('one-app-launcher-modal, div.appLauncherMenu, one-app-launcher-menu').first();
    try {
      await appLauncherModal.waitFor({ state: 'visible', timeout: getRemaining() });
    } catch {
      // Fallback: just wait a bit more
      await this.page.waitForTimeout(2000);
    }

    // Search for the app - use App Launcher specific selectors
    // The App Launcher search input is inside the modal/menu
    const searchSelectors = [
      'one-app-launcher-modal input[placeholder*="Search"]',
      'one-app-launcher-menu input[placeholder*="Search"]',
      'div.appLauncherMenu input[placeholder*="Search"]',
      'one-app-launcher-search-input input',
      'input.appLauncherSearch',
      'input[placeholder*="Search apps"]',
      'input[placeholder*="Search Apps"]',
    ];

    let searchInput = null;
    for (const selector of searchSelectors) {
      const input = this.page.locator(selector).first();
      try {
        if (await input.isVisible({ timeout: 2000 })) {
          searchInput = input;
          break;
        }
      } catch {
        // Try next selector
      }
    }

    if (!searchInput) {
      throw new Error('Could not find App Launcher search input');
    }

    await searchInput.fill(appName);

    // Wait for search results
    await this.waitStrategies.waitForNoSpinners(Math.min(getRemaining(), 5000));
    await this.page.waitForTimeout(1000);

    // Click the app - try multiple selectors with fallback
    const appSelectors = [
      `one-app-launcher-menu-item a[data-label="${appName}"]`,
      `one-app-launcher-menu-item:has-text("${appName}")`,
      `lightning-formatted-text[title="${appName}"]`,
      `a[title="${appName}"]`,
      `a:has-text("${appName}")`,
      `[data-label="${appName}"]`,
    ];

    let clicked = false;
    for (const selector of appSelectors) {
      try {
        const appItem = this.page.locator(selector).first();
        if (await appItem.isVisible({ timeout: 1000 })) {
          await appItem.click();
          clicked = true;
          break;
        }
      } catch {
        // Try next selector
      }
    }

    if (!clicked) {
      throw new Error(`Could not find app "${appName}" in App Launcher`);
    }

    // Wait for navigation
    await this.waitStrategies.waitForNavigation(getRemaining());
  }

  /**
   * Get toast notification message
   */
  async getToastMessage(
    timeout = 10000
  ): Promise<{ type: 'success' | 'error' | 'warning' | 'info'; message: string }> {
    return this.waitStrategies.waitForToast(timeout);
  }

  /**
   * Close toast notification
   */
  async closeToast(): Promise<void> {
    const closeButton = this.page.locator(SF_SELECTORS.TOAST_CLOSE).first();
    if (await closeButton.isVisible()) {
      await closeButton.click();
    }
  }

  /**
   * Click a button by its label
   */
  async clickButton(label: string): Promise<void> {
    const button = this.page.locator(SF_SELECTORS.BUTTON_BY_LABEL(label)).first();
    await button.click();
  }

  /**
   * Save the current record
   */
  async saveRecord(): Promise<{ success: boolean; message: string }> {
    // Click save button
    await this.page.locator(SF_SELECTORS.SAVE_BUTTON).first().click();

    // Wait for toast
    try {
      const toast = await this.waitStrategies.waitForToast(15000);
      return {
        success: toast.type === 'success',
        message: toast.message,
      };
    } catch {
      // Check if we navigated to a view page (successful save without toast)
      const url = this.page.url();
      if (url.includes('/view')) {
        return {
          success: true,
          message: 'Record saved successfully',
        };
      }
      return {
        success: false,
        message: 'Save operation completed but could not verify result',
      };
    }
  }

  /**
   * Cancel the current edit
   */
  async cancelEdit(): Promise<void> {
    await this.page.locator(SF_SELECTORS.CANCEL_BUTTON).first().click();
    await this.waitStrategies.waitForNoSpinners();
  }

  /**
   * Open related list new record modal
   */
  async openRelatedListNew(relatedListName: string): Promise<void> {
    const newButton = this.page
      .locator(SF_SELECTORS.RELATED_LIST_NEW_BUTTON(relatedListName))
      .first();
    await newButton.click();
    await this.waitStrategies.waitForModal();
  }

  /**
   * Click view all on a related list
   */
  async viewAllRelatedList(relatedListName: string): Promise<void> {
    const viewAllLink = this.page
      .locator(SF_SELECTORS.RELATED_LIST_VIEW_ALL(relatedListName))
      .first();
    await viewAllLink.click();
    await this.waitStrategies.waitForNavigation();
  }

  /**
   * Get field value from a form
   */
  async getFieldValue(fieldLabel: string): Promise<string> {
    // Try input first
    const input = this.page.locator(SF_SELECTORS.INPUT_BY_LABEL(fieldLabel)).first();
    if (await input.isVisible()) {
      return (await input.inputValue()) || '';
    }

    // Try textarea
    const textarea = this.page.locator(SF_SELECTORS.TEXTAREA_BY_LABEL(fieldLabel)).first();
    if (await textarea.isVisible()) {
      return (await textarea.inputValue()) || '';
    }

    // Try to get displayed value from the field container
    const fieldContainer = this.page.locator(SF_SELECTORS.FORM_FIELD_BY_LABEL(fieldLabel)).first();
    if (await fieldContainer.isVisible()) {
      const displayedValue = await fieldContainer
        .locator('lightning-formatted-text, lightning-formatted-name, span.test-id__field-value')
        .first()
        .textContent();
      return displayedValue?.trim() || '';
    }

    return '';
  }

  /**
   * Use Setup Quick Find
   */
  async setupQuickFind(searchTerm: string): Promise<void> {
    const quickFind = this.page.locator(SF_SELECTORS.SETUP_QUICK_FIND).first();
    await quickFind.fill(searchTerm);
    await this.page.waitForTimeout(500);
  }

  /**
   * Click Setup menu item
   */
  async clickSetupMenuItem(menuItemText: string): Promise<void> {
    const menuItem = this.page.locator(SF_SELECTORS.SETUP_MENU_ITEM(menuItemText)).first();
    await menuItem.click();
    await this.waitStrategies.waitForNavigation();
  }

  /**
   * Get record name from highlights panel
   */
  async getRecordName(): Promise<string> {
    const recordName = this.page.locator(SF_SELECTORS.RECORD_NAME).first();
    return (await recordName.textContent())?.trim() || '';
  }

  /**
   * Navigate using tabs
   */
  async clickTab(tabName: string): Promise<void> {
    const tab = this.page.locator(SF_SELECTORS.TAB_ITEM(tabName)).first();
    await tab.click();
    await this.waitStrategies.waitForNavigation();
  }

  /**
   * Select rows in a list view
   */
  async selectListViewRows(indices: number[]): Promise<void> {
    const checkboxes = await this.page.locator(SF_SELECTORS.LIST_VIEW_CHECKBOX).all();

    for (const index of indices) {
      if (index < checkboxes.length) {
        await checkboxes[index].click();
      }
    }
  }

  /**
   * Get all visible text from the page
   */
  async getPageText(selector?: string): Promise<string> {
    if (selector) {
      const element = this.page.locator(selector).first();
      return (await element.textContent())?.trim() || '';
    }

    return (await this.page.locator('body').textContent())?.trim() || '';
  }
}
