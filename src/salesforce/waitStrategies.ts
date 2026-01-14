import { Page } from 'playwright';
import { SF_SELECTORS } from './selectors.js';

/**
 * Lightning-aware wait strategies for Salesforce pages
 */
export class SalesforceWaitStrategies {
  constructor(private page: Page) {}

  /**
   * Wait for Lightning Experience to fully load
   */
  async waitForLightningReady(timeout = 30000): Promise<void> {
    const startTime = Date.now();
    const getRemaining = () => Math.max(timeout - (Date.now() - startTime), 1000);

    // SF redirects through multiple domains:
    // frontdoor.jsp -> contentDoor (file.force.com) -> lightning.force.com -> salesforce-setup.com (for Setup)
    // We need to wait for the final URL to stabilize

    // First, wait for URL to leave the auth/redirect domains
    await this.page.waitForURL(
      (url) => {
        const href = url.href;
        // Skip auth and intermediate redirect URLs
        if (href.includes('frontdoor.jsp')) return false;
        if (href.includes('contentDoor')) return false;
        if (href.includes('file.force.com')) return false;
        // Must be a Lightning URL
        return href.includes('/lightning/');
      },
      { timeout: getRemaining() }
    );

    // Wait for URL to stabilize (SF may do one more redirect from lightning.force.com to salesforce-setup.com)
    let lastUrl = this.page.url();
    let stableCount = 0;
    while (stableCount < 3 && Date.now() - startTime < timeout) {
      await this.page.waitForTimeout(500);
      const currentUrl = this.page.url();
      if (currentUrl === lastUrl) {
        stableCount++;
      } else {
        stableCount = 0;
        lastUrl = currentUrl;
      }
    }

    // Now wait for DOM to be ready on the final page
    await this.page.waitForLoadState('domcontentloaded', { timeout: getRemaining() });

    // Wait for the Lightning app container to be visible
    // Use polling with evaluate() instead of waitForFunction (more reliable with SF pages)
    const containerSelectors = [
      'div.desktop.container',
      'div.oneContent',
      'one-app',
      '.setupcontent',
      'setup-root',
      'div[data-aura-rendered-by]',
      '.slds-template__container',
    ];

    let containerFound = false;
    const pollInterval = 250;
    while (!containerFound && Date.now() - startTime < timeout) {
      containerFound = await this.page.evaluate((selectors) => {
        for (const selector of selectors) {
          const container = document.querySelector(selector);
          if (container) {
            const style = window.getComputedStyle(container);
            if (style.display !== 'none' && style.visibility !== 'hidden') {
              return true;
            }
          }
        }
        return false;
      }, containerSelectors);

      if (!containerFound) {
        await this.page.waitForTimeout(pollInterval);
      }
    }

    if (!containerFound) {
      throw new Error('Timeout waiting for Lightning container to be visible');
    }

    // Wait for no active spinners (using polling)
    await this.waitForNoSpinners(Math.min(getRemaining(), 15000));

    // Skip Aura check - not needed for LWC pages and can cause issues
  }

  /**
   * Wait for all Lightning spinners to disappear (using polling)
   */
  async waitForNoSpinners(timeout = 15000): Promise<void> {
    const startTime = Date.now();
    const pollInterval = 250;

    while (Date.now() - startTime < timeout) {
      const noSpinners = await this.page.evaluate(() => {
        const spinners = document.querySelectorAll(
          'lightning-spinner, .slds-spinner_container:not([class*="slds-hide"]), .slds-spinner'
        );
        return (
          spinners.length === 0 ||
          Array.from(spinners).every((s) => {
            const el = s as HTMLElement;
            const style = window.getComputedStyle(el);
            return style.display === 'none' || style.visibility === 'hidden';
          })
        );
      });

      if (noSpinners) {
        return;
      }
      await this.page.waitForTimeout(pollInterval);
    }
    // Don't throw on spinner timeout - page might still be usable
  }

  /**
   * Wait for stencils (skeleton loaders) to disappear (using polling)
   */
  async waitForNoStencils(timeout = 15000): Promise<void> {
    const startTime = Date.now();
    const pollInterval = 250;

    while (Date.now() - startTime < timeout) {
      const noStencils = await this.page.evaluate(() => {
        const stencils = document.querySelectorAll('.stencil, [class*="stencil"], .slds-is-loading');
        return (
          stencils.length === 0 ||
          Array.from(stencils).every((s) => {
            const style = window.getComputedStyle(s);
            return style.display === 'none' || style.visibility === 'hidden';
          })
        );
      });

      if (noStencils) {
        return;
      }
      await this.page.waitForTimeout(pollInterval);
    }
    // Don't throw on stencil timeout - page might still be usable
  }

  /**
   * Wait for record page to load completely
   */
  async waitForRecordPage(timeout = 20000): Promise<void> {
    // Wait for record highlights panel or detail panel
    await this.page.waitForSelector(
      'records-highlights2, records-record-layout-event-broker, records-lwc-detail-panel, records-lwc-highlights-panel',
      { timeout }
    );
    await this.waitForNoSpinners(timeout);
    await this.waitForNoStencils(timeout / 2);
  }

  /**
   * Wait for Setup page to load
   */
  async waitForSetupPage(timeout = 20000): Promise<void> {
    await this.page.waitForSelector('.setupcontent, [class*="setup"], setup-split-view-panel', {
      timeout,
    });
    await this.waitForNoSpinners(timeout);
  }

  /**
   * Wait for list view to load
   */
  async waitForListView(timeout = 20000): Promise<void> {
    await this.page.waitForSelector(
      'lightning-datatable, lst-list-view-manager-header, force-list-view-manager-presented',
      { timeout }
    );
    await this.waitForNoSpinners(timeout);
    await this.waitForNoStencils(timeout / 2);
  }

  /**
   * Wait for modal to appear
   */
  async waitForModal(timeout = 10000): Promise<void> {
    await this.page.waitForSelector(SF_SELECTORS.MODAL, { state: 'visible', timeout });
    await this.waitForNoSpinners(timeout / 2);
  }

  /**
   * Wait for modal to close
   */
  async waitForModalClose(timeout = 10000): Promise<void> {
    await this.page.waitForSelector(SF_SELECTORS.MODAL, { state: 'hidden', timeout });
  }

  /**
   * Wait for toast message to appear
   */
  async waitForToast(timeout = 10000): Promise<{ type: 'success' | 'error' | 'warning' | 'info'; message: string }> {
    await this.page.waitForSelector(SF_SELECTORS.TOAST_CONTAINER, { state: 'visible', timeout });

    // Get the toast message
    const messageLocator = this.page.locator(SF_SELECTORS.TOAST_MESSAGE).first();
    const message = (await messageLocator.textContent()) || '';

    // Determine toast type
    const isSuccess = (await this.page.locator(SF_SELECTORS.TOAST_SUCCESS).count()) > 0;
    const isError = (await this.page.locator(SF_SELECTORS.TOAST_ERROR).count()) > 0;
    const isWarning = (await this.page.locator(SF_SELECTORS.TOAST_WARNING).count()) > 0;

    let type: 'success' | 'error' | 'warning' | 'info' = 'info';
    if (isSuccess) type = 'success';
    else if (isError) type = 'error';
    else if (isWarning) type = 'warning';

    return { type, message: message.trim() };
  }

  /**
   * Wait for navigation to complete (URL change and page load)
   */
  async waitForNavigation(timeout = 30000): Promise<void> {
    await Promise.all([
      this.page.waitForLoadState('domcontentloaded', { timeout }),
      this.page.waitForLoadState('networkidle', { timeout: timeout / 2 }).catch(() => {
        // Network idle might not happen on some SF pages due to long-polling
      }),
    ]);
    await this.waitForNoSpinners(timeout / 2);
  }

  /**
   * Wait for URL to contain specific path
   */
  async waitForUrlContains(urlPart: string, timeout = 30000): Promise<void> {
    await this.page.waitForURL((url) => url.href.includes(urlPart), { timeout });
  }

  /**
   * Wait for element to be visible and stable
   */
  async waitForElementStable(selector: string, timeout = 10000): Promise<void> {
    const locator = this.page.locator(selector).first();
    await locator.waitFor({ state: 'visible', timeout });
    // Wait a brief moment for any animations to complete
    await this.page.waitForTimeout(100);
  }

  /**
   * Wait for form to be ready for input
   */
  async waitForFormReady(timeout = 15000): Promise<void> {
    const startTime = Date.now();
    const getRemaining = () => Math.max(timeout - (Date.now() - startTime), 1000);

    // Extended list of form selectors that cover various SF form types
    const formSelectors = [
      SF_SELECTORS.RECORD_FORM,
      'lightning-record-form',
      'lightning-record-edit-form',
      'records-record-edit-form',
      'records-lwc-record-layout',
      'records-record-layout-event-broker',
      'force-record-layout-block',
      'div.modal-body lightning-input',
      'div.modal-body lightning-input-field',
      'section.slds-modal lightning-input',
      'lightning-input-field',
    ].join(', ');

    await this.page.waitForSelector(formSelectors, { timeout: getRemaining() });
    await this.waitForNoSpinners(getRemaining());
    await this.waitForNoStencils(Math.min(getRemaining(), 5000));
  }

  /**
   * Wait for picklist options to load
   */
  async waitForPicklistOptions(timeout = 10000): Promise<void> {
    await this.page.waitForSelector('lightning-base-combobox-item', { state: 'visible', timeout });
  }

  /**
   * Wait for lookup search results
   */
  async waitForLookupResults(timeout = 10000): Promise<void> {
    await this.page.waitForSelector(
      'lightning-base-combobox-item, lightning-grouped-combobox-option',
      { state: 'visible', timeout }
    );
    await this.waitForNoSpinners(timeout / 2);
  }

  /**
   * Wait for page to be interactable (no overlays, modals, spinners)
   */
  async waitForPageInteractable(timeout = 15000): Promise<void> {
    await this.waitForNoSpinners(timeout);

    // Check for any blocking overlays using polling
    const startTime = Date.now();
    const pollInterval = 250;
    const overlayTimeout = timeout / 2;

    while (Date.now() - startTime < overlayTimeout) {
      const noOverlays = await this.page.evaluate(() => {
        const overlays = document.querySelectorAll('.slds-backdrop, .slds-backdrop_open');
        return (
          overlays.length === 0 ||
          Array.from(overlays).every((o) => {
            const style = window.getComputedStyle(o);
            return style.display === 'none' || style.visibility === 'hidden';
          })
        );
      });

      if (noOverlays) {
        return;
      }
      await this.page.waitForTimeout(pollInterval);
    }
    // Don't throw on overlay timeout - page might still be usable
  }

  /**
   * Wait for App Launcher to be ready
   */
  async waitForAppLauncher(timeout = 10000): Promise<void> {
    await this.page.waitForSelector(SF_SELECTORS.APP_LAUNCHER_SEARCH, {
      state: 'visible',
      timeout,
    });
  }

  /**
   * Wait for component to render (by checking for specific content)
   */
  async waitForComponentRender(
    componentSelector: string,
    contentIndicator?: string,
    timeout = 15000
  ): Promise<void> {
    await this.page.waitForSelector(componentSelector, { state: 'visible', timeout });

    if (contentIndicator) {
      await this.page.waitForSelector(`${componentSelector} ${contentIndicator}`, {
        state: 'visible',
        timeout: timeout / 2,
      });
    }

    await this.waitForNoSpinners(timeout / 2);
  }

  /**
   * Smart wait - waits for various conditions based on current page context
   */
  async smartWait(timeout = 15000): Promise<void> {
    const url = this.page.url();

    if (url.includes('/lightning/r/')) {
      // Record page (view or edit)
      if (url.includes('/edit')) {
        await this.waitForFormReady(timeout);
      } else {
        await this.waitForRecordPage(timeout);
      }
    } else if (url.includes('/lightning/o/') && url.includes('/new')) {
      // New record form
      await this.waitForFormReady(timeout);
    } else if (url.includes('/lightning/o/')) {
      // List view
      await this.waitForListView(timeout);
    } else if (url.includes('/lightning/setup/')) {
      // Setup page
      await this.waitForSetupPage(timeout);
    } else {
      // Generic Lightning page
      await this.waitForLightningReady(timeout);
    }
  }
}
