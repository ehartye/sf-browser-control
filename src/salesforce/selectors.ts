/**
 * Salesforce Lightning CSS Selectors
 * Prioritizes stable selectors over dynamic IDs
 */

export const SF_SELECTORS = {
  // Global navigation
  APP_LAUNCHER_BUTTON:
    'button.slds-icon-waffle_container, one-app-launcher-header button, div.appLauncher button',
  APP_LAUNCHER_SEARCH: 'input[placeholder*="Search apps"], input[placeholder*="Search Apps"]',
  APP_LAUNCHER_ITEM: (appName: string) =>
    `one-app-launcher-menu-item a[data-label="${appName}"], lightning-formatted-text[title="${appName}"], a[title="${appName}"]`,
  GLOBAL_SEARCH: 'button[class*="search-button"], input[placeholder*="Search"]',
  GLOBAL_SEARCH_INPUT: 'input[class*="search-input"], lightning-input[class*="search"] input',

  // Lightning buttons
  BUTTON_BY_LABEL: (label: string) =>
    `button:has-text("${label}"), lightning-button:has-text("${label}"), a.slds-button:has-text("${label}"), lightning-button-icon-stateful[title="${label}"]`,
  PRIMARY_BUTTON: 'button.slds-button_brand, lightning-button[variant="brand"] button',
  SAVE_BUTTON:
    'button[name="SaveEdit"], button[title="Save"], button:has-text("Save"):not(:has-text("Save &"))',
  SAVE_AND_NEW_BUTTON: 'button[name="SaveAndNew"], button:has-text("Save & New")',
  CANCEL_BUTTON: 'button[name="CancelEdit"], button:has-text("Cancel")',
  EDIT_BUTTON: 'button[name="Edit"], button:has-text("Edit")',
  DELETE_BUTTON: 'button[name="Delete"], button:has-text("Delete")',
  CLONE_BUTTON: 'button[name="Clone"], button:has-text("Clone")',
  NEW_BUTTON: 'a[title="New"], button:has-text("New"), lightning-button:has-text("New")',

  // Forms and fields
  FORM_FIELD_BY_LABEL: (label: string) =>
    `lightning-input-field:has(label:text-is("${label}")), ` +
    `lightning-input:has(label:text-is("${label}")), ` +
    `lightning-combobox:has(label:text-is("${label}")), ` +
    `lightning-textarea:has(label:text-is("${label}")), ` +
    `lightning-lookup:has(label:text-is("${label}")), ` +
    `lightning-grouped-combobox:has(label:text-is("${label}"))`,
  INPUT_BY_LABEL: (label: string) =>
    `lightning-input-field:has(label:text-is("${label}")) input, ` +
    `lightning-input:has(label:text-is("${label}")) input, ` +
    `lightning-primitive-input-simple:has(label:text-is("${label}")) input`,
  TEXTAREA_BY_LABEL: (label: string) =>
    `lightning-textarea:has(label:text-is("${label}")) textarea, ` +
    `lightning-input-field:has(label:text-is("${label}")) textarea`,
  PICKLIST_BY_LABEL: (label: string) =>
    `lightning-combobox:has(label:text-is("${label}")), ` +
    `lightning-input-field[data-field-type="Picklist"]:has(label:text-is("${label}"))`,
  PICKLIST_DROPDOWN: 'lightning-base-combobox[role="combobox"]',
  PICKLIST_OPTION: (value: string) =>
    `lightning-base-combobox-item[data-value="${value}"], ` +
    `lightning-base-combobox-item:has-text("${value}")`,
  LOOKUP_BY_LABEL: (label: string) =>
    `lightning-lookup:has(label:text-is("${label}")), ` +
    `lightning-grouped-combobox:has(label:text-is("${label}")), ` +
    `lightning-input-field[data-field-type="Lookup"]:has(label:text-is("${label}"))`,
  LOOKUP_SEARCH_INPUT:
    'input[placeholder*="Search"], lightning-base-combobox input[role="combobox"]',
  LOOKUP_OPTION: (text: string) =>
    `lightning-base-combobox-item:has-text("${text}"), ` +
    `lightning-base-combobox-formatted-text:has-text("${text}")`,
  CHECKBOX_BY_LABEL: (label: string) =>
    `lightning-input[data-field-type="Boolean"]:has(label:text-is("${label}")) input[type="checkbox"], ` +
    `lightning-input:has(label:text-is("${label}")) input[type="checkbox"]`,
  DATE_PICKER_BY_LABEL: (label: string) =>
    `lightning-datepicker:has(label:text-is("${label}")), ` +
    `lightning-input[type="date"]:has(label:text-is("${label}")), ` +
    `lightning-input-field[data-field-type="Date"]:has(label:text-is("${label}"))`,
  DATETIME_PICKER_BY_LABEL: (label: string) =>
    `lightning-datetimepicker:has(label:text-is("${label}")), ` +
    `lightning-input-field[data-field-type="DateTime"]:has(label:text-is("${label}"))`,
  RICH_TEXT_BY_LABEL: (label: string) =>
    `lightning-input-rich-text:has(label:text-is("${label}"))`,

  // Record page
  RECORD_FORM: 'records-record-edit-form, lightning-record-edit-form, records-lwc-detail-panel',
  RECORD_HIGHLIGHTS: 'records-highlights2, force-highlights-panel, records-lwc-highlights-panel',
  RECORD_DETAIL_SECTION: 'records-record-layout-section, lightning-accordion-section',
  RECORD_NAME:
    'lightning-formatted-text[slot="primaryField"], records-lwc-highlights-panel h1, .slds-page-header__title',
  RELATED_LIST: (name: string) =>
    `lst-related-list-single-app-builder-mapper:has(h2:text-is("${name}")), ` +
    `article:has(h2:text-is("${name}"))`,
  RELATED_LIST_NEW_BUTTON: (listName: string) =>
    `lst-related-list-single-app-builder-mapper:has(h2:text-is("${listName}")) button[title="New"], ` +
    `article:has(h2:text-is("${listName}")) a[title="New"]`,
  RELATED_LIST_VIEW_ALL: (listName: string) =>
    `lst-related-list-single-app-builder-mapper:has(h2:text-is("${listName}")) a:has-text("View All")`,
  RELATED_LIST_ACTION: (listName: string, actionName: string) =>
    `lst-related-list-single-app-builder-mapper:has(h2:text-is("${listName}")) ` +
    `lightning-button-menu lightning-menu-item:has-text("${actionName}")`,

  // Modals and dialogs
  MODAL: 'section[role="dialog"], div.slds-modal__container, div[role="dialog"]',
  MODAL_HEADER: '.slds-modal__header h2, header.slds-modal__header h2',
  MODAL_FOOTER: '.slds-modal__footer, footer.slds-modal__footer',
  MODAL_CLOSE: 'button.slds-modal__close, lightning-button-icon[title="Close"]',
  MODAL_CONTENT: '.slds-modal__content',

  // Toast notifications
  TOAST_CONTAINER: 'lightning-notif-log, div.slds-notify-container, div.toastContainer',
  TOAST_MESSAGE: '.toastMessage, .slds-notify__content, lightning-primitive-formatted-text',
  TOAST_SUCCESS: 'lightning-icon[icon-name="utility:success"], .slds-theme_success',
  TOAST_ERROR: 'lightning-icon[icon-name="utility:error"], .slds-theme_error',
  TOAST_WARNING: 'lightning-icon[icon-name="utility:warning"], .slds-theme_warning',
  TOAST_CLOSE: 'lightning-button-icon[title="Close"], button.slds-notify__close',

  // Spinners and loading
  SPINNER:
    'lightning-spinner, div.slds-spinner_container, div.slds-spinner, lightning-primitive-spinner',
  LOADING_INDICATOR: '[class*="loading"], .is-loading, .slds-is-loading',
  STENCIL: '.stencil, [class*="stencil"]',

  // Setup
  SETUP_SIDEBAR: '.setupcontent .sidebar, setup-split-view-panel, one-setup-side-nav',
  SETUP_QUICK_FIND:
    'input[placeholder*="Quick Find"], input.filter-box, input[type="search"][placeholder*="Quick"]',
  SETUP_MENU_ITEM: (text: string) =>
    `.setupLeaf a:text-is("${text}"), setup-split-view-panel a:text-is("${text}"), ` +
    `one-setup-side-nav-item a:text-is("${text}")`,
  SETUP_TREE_ITEM: (text: string) =>
    `lightning-tree-item:has-text("${text}"), .slds-tree__item:has-text("${text}")`,

  // Tables and lists
  LIST_VIEW_TABLE: 'table.slds-table, lightning-datatable table',
  LIST_VIEW_ROW: 'table.slds-table tbody tr, lightning-datatable tbody tr',
  LIST_VIEW_CELL: (columnLabel: string) =>
    `td[data-label="${columnLabel}"], th[data-label="${columnLabel}"]`,
  LIST_VIEW_HEADER: (columnLabel: string) =>
    `th[data-label="${columnLabel}"], th:has-text("${columnLabel}")`,
  LIST_VIEW_CHECKBOX: 'td lightning-primitive-cell-checkbox input[type="checkbox"]',
  LIST_VIEW_ACTIONS: 'td lightning-primitive-cell-actions button',

  // Tab navigation
  TAB_BAR: 'one-app-nav-bar, ul[role="tablist"], lightning-tabset',
  TAB_ITEM: (label: string) =>
    `one-app-nav-bar-item-root a[title="${label}"], ` +
    `li[role="presentation"] a:has-text("${label}"), ` +
    `lightning-tab-bar li:has-text("${label}")`,
  TAB_OVERFLOW_MENU: 'one-app-nav-bar-menu-button, button[title="More Tabs"]',

  // Path component (Sales Path, etc.)
  PATH_COMPONENT: 'lightning-path',
  PATH_STAGE: (stageName: string) =>
    `lightning-path-item:has-text("${stageName}"), .slds-path__item:has-text("${stageName}")`,
  PATH_MARK_COMPLETE: 'button:has-text("Mark Status as Complete"), button:has-text("Mark as Complete")',
  PATH_SELECT_CLOSED: 'button:has-text("Select Closed Stage")',

  // Activity timeline
  ACTIVITY_TIMELINE: 'lightning-activity-timeline, activity-timeline',
  ACTIVITY_ITEM: 'lightning-activity-timeline-item, activity-timeline-item',
  LOG_A_CALL: 'button:has-text("Log a Call")',
  NEW_TASK: 'button:has-text("New Task")',
  NEW_EVENT: 'button:has-text("New Event")',

  // Utility bar
  UTILITY_BAR: 'one-appnav-bar-utilities, lightning-utilitiy-bar-item',
  UTILITY_BAR_ITEM: (label: string) =>
    `lightning-utility-bar-item[title="${label}"], one-appnav-bar-utilities button:has-text("${label}")`,

  // Lightning components
  LWC_COMPONENT: (name: string) => `${name}, [data-component-id*="${name}"]`,
  AURA_COMPONENT: (name: string) => `[data-aura-rendered-by*="${name}"]`,

  // Flexipage
  FLEXIPAGE_COMPONENT: (label: string) =>
    `laf-component:has(span:text-is("${label}")), lightning-card:has(span:text-is("${label}"))`,

  // Chatter/Feed
  CHATTER_PUBLISHER: 'lightning-publisher, .publisherComponent',
  CHATTER_POST_INPUT: 'lightning-input-rich-text[class*="publisher"], .publisherShareButton',
  CHATTER_POST_BUTTON: 'button:has-text("Share"), button:has-text("Post")',
  FEED_ITEM: 'article.feeditem, lightning-feed-item',
};

/**
 * Helper to build attribute selector
 */
export function attrSelector(attr: string, value: string, partial = false): string {
  if (partial) {
    return `[${attr}*="${value}"]`;
  }
  return `[${attr}="${value}"]`;
}

/**
 * Helper to build data-* attribute selector
 */
export function dataSelector(dataAttr: string, value: string): string {
  return `[data-${dataAttr}="${value}"]`;
}
