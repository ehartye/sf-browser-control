import { describe, it, expect } from 'vitest';
import { SF_SELECTORS, attrSelector, dataSelector } from '../src/salesforce/selectors.js';

describe('SF_SELECTORS', () => {
  describe('App Launcher selectors', () => {
    it('should have APP_LAUNCHER_BUTTON selector', () => {
      expect(SF_SELECTORS.APP_LAUNCHER_BUTTON).toBeDefined();
      expect(SF_SELECTORS.APP_LAUNCHER_BUTTON).toContain('button');
    });

    it('should generate APP_LAUNCHER_ITEM selector with app name', () => {
      const selector = SF_SELECTORS.APP_LAUNCHER_ITEM('Sales');
      expect(selector).toContain('Sales');
      expect(selector).toContain('data-label');
    });
  });

  describe('Button selectors', () => {
    it('should generate BUTTON_BY_LABEL selector', () => {
      const selector = SF_SELECTORS.BUTTON_BY_LABEL('Save');
      expect(selector).toContain('Save');
      expect(selector).toContain('button');
    });

    it('should have SAVE_BUTTON selector', () => {
      expect(SF_SELECTORS.SAVE_BUTTON).toBeDefined();
      expect(SF_SELECTORS.SAVE_BUTTON).toContain('Save');
    });

    it('should have CANCEL_BUTTON selector', () => {
      expect(SF_SELECTORS.CANCEL_BUTTON).toBeDefined();
      expect(SF_SELECTORS.CANCEL_BUTTON).toContain('Cancel');
    });

    it('should have NEW_BUTTON selector', () => {
      expect(SF_SELECTORS.NEW_BUTTON).toBeDefined();
      expect(SF_SELECTORS.NEW_BUTTON).toContain('New');
    });
  });

  describe('Form field selectors', () => {
    it('should generate FORM_FIELD_BY_LABEL selector', () => {
      const selector = SF_SELECTORS.FORM_FIELD_BY_LABEL('Account Name');
      expect(selector).toContain('Account Name');
      expect(selector).toContain('lightning-input');
    });

    it('should generate INPUT_BY_LABEL selector', () => {
      const selector = SF_SELECTORS.INPUT_BY_LABEL('First Name');
      expect(selector).toContain('First Name');
      expect(selector).toContain('input');
    });

    it('should generate TEXTAREA_BY_LABEL selector', () => {
      const selector = SF_SELECTORS.TEXTAREA_BY_LABEL('Description');
      expect(selector).toContain('Description');
      expect(selector).toContain('textarea');
    });

    it('should generate PICKLIST_BY_LABEL selector', () => {
      const selector = SF_SELECTORS.PICKLIST_BY_LABEL('Status');
      expect(selector).toContain('Status');
      expect(selector).toContain('combobox');
    });

    it('should generate PICKLIST_OPTION selector', () => {
      const selector = SF_SELECTORS.PICKLIST_OPTION('Open');
      expect(selector).toContain('Open');
      expect(selector).toContain('combobox-item');
    });

    it('should generate LOOKUP_BY_LABEL selector', () => {
      const selector = SF_SELECTORS.LOOKUP_BY_LABEL('Account');
      expect(selector).toContain('Account');
      expect(selector).toContain('lookup');
    });

    it('should generate LOOKUP_OPTION selector', () => {
      const selector = SF_SELECTORS.LOOKUP_OPTION('Acme Corp');
      expect(selector).toContain('Acme Corp');
    });

    it('should generate CHECKBOX_BY_LABEL selector', () => {
      const selector = SF_SELECTORS.CHECKBOX_BY_LABEL('Active');
      expect(selector).toContain('Active');
      expect(selector).toContain('checkbox');
    });

    it('should generate DATE_PICKER_BY_LABEL selector', () => {
      const selector = SF_SELECTORS.DATE_PICKER_BY_LABEL('Close Date');
      expect(selector).toContain('Close Date');
      expect(selector).toContain('date');
    });
  });

  describe('Record page selectors', () => {
    it('should have RECORD_FORM selector', () => {
      expect(SF_SELECTORS.RECORD_FORM).toBeDefined();
      expect(SF_SELECTORS.RECORD_FORM).toContain('record');
    });

    it('should have RECORD_HIGHLIGHTS selector', () => {
      expect(SF_SELECTORS.RECORD_HIGHLIGHTS).toBeDefined();
      expect(SF_SELECTORS.RECORD_HIGHLIGHTS).toContain('highlights');
    });

    it('should generate RELATED_LIST selector', () => {
      const selector = SF_SELECTORS.RELATED_LIST('Contacts');
      expect(selector).toContain('Contacts');
    });

    it('should generate RELATED_LIST_NEW_BUTTON selector', () => {
      const selector = SF_SELECTORS.RELATED_LIST_NEW_BUTTON('Opportunities');
      expect(selector).toContain('Opportunities');
      expect(selector).toContain('New');
    });
  });

  describe('Modal selectors', () => {
    it('should have MODAL selector', () => {
      expect(SF_SELECTORS.MODAL).toBeDefined();
      expect(SF_SELECTORS.MODAL).toContain('dialog');
    });

    it('should have MODAL_HEADER selector', () => {
      expect(SF_SELECTORS.MODAL_HEADER).toBeDefined();
      expect(SF_SELECTORS.MODAL_HEADER).toContain('modal__header');
    });

    it('should have MODAL_CLOSE selector', () => {
      expect(SF_SELECTORS.MODAL_CLOSE).toBeDefined();
      expect(SF_SELECTORS.MODAL_CLOSE).toContain('Close');
    });
  });

  describe('Toast selectors', () => {
    it('should have TOAST_CONTAINER selector', () => {
      expect(SF_SELECTORS.TOAST_CONTAINER).toBeDefined();
    });

    it('should have TOAST_MESSAGE selector', () => {
      expect(SF_SELECTORS.TOAST_MESSAGE).toBeDefined();
      expect(SF_SELECTORS.TOAST_MESSAGE).toContain('toast');
    });

    it('should have TOAST_SUCCESS selector', () => {
      expect(SF_SELECTORS.TOAST_SUCCESS).toBeDefined();
      expect(SF_SELECTORS.TOAST_SUCCESS).toContain('success');
    });

    it('should have TOAST_ERROR selector', () => {
      expect(SF_SELECTORS.TOAST_ERROR).toBeDefined();
      expect(SF_SELECTORS.TOAST_ERROR).toContain('error');
    });
  });

  describe('Spinner selectors', () => {
    it('should have SPINNER selector', () => {
      expect(SF_SELECTORS.SPINNER).toBeDefined();
      expect(SF_SELECTORS.SPINNER).toContain('spinner');
    });

    it('should have LOADING_INDICATOR selector', () => {
      expect(SF_SELECTORS.LOADING_INDICATOR).toBeDefined();
      expect(SF_SELECTORS.LOADING_INDICATOR).toContain('loading');
    });
  });

  describe('Setup selectors', () => {
    it('should have SETUP_QUICK_FIND selector', () => {
      expect(SF_SELECTORS.SETUP_QUICK_FIND).toBeDefined();
      expect(SF_SELECTORS.SETUP_QUICK_FIND).toContain('Quick Find');
    });

    it('should generate SETUP_MENU_ITEM selector', () => {
      const selector = SF_SELECTORS.SETUP_MENU_ITEM('Users');
      expect(selector).toContain('Users');
    });
  });

  describe('List view selectors', () => {
    it('should have LIST_VIEW_TABLE selector', () => {
      expect(SF_SELECTORS.LIST_VIEW_TABLE).toBeDefined();
      expect(SF_SELECTORS.LIST_VIEW_TABLE).toContain('table');
    });

    it('should have LIST_VIEW_ROW selector', () => {
      expect(SF_SELECTORS.LIST_VIEW_ROW).toBeDefined();
      expect(SF_SELECTORS.LIST_VIEW_ROW).toContain('tr');
    });

    it('should generate LIST_VIEW_CELL selector', () => {
      const selector = SF_SELECTORS.LIST_VIEW_CELL('Name');
      expect(selector).toContain('Name');
      expect(selector).toContain('data-label');
    });
  });

  describe('Tab selectors', () => {
    it('should have TAB_BAR selector', () => {
      expect(SF_SELECTORS.TAB_BAR).toBeDefined();
    });

    it('should generate TAB_ITEM selector', () => {
      const selector = SF_SELECTORS.TAB_ITEM('Accounts');
      expect(selector).toContain('Accounts');
    });
  });

  describe('Component selectors', () => {
    it('should generate LWC_COMPONENT selector', () => {
      const selector = SF_SELECTORS.LWC_COMPONENT('c-my-component');
      expect(selector).toContain('c-my-component');
    });

    it('should generate AURA_COMPONENT selector', () => {
      const selector = SF_SELECTORS.AURA_COMPONENT('force:detailPanel');
      expect(selector).toContain('force:detailPanel');
    });
  });
});

describe('Helper functions', () => {
  describe('attrSelector', () => {
    it('should build exact attribute selector', () => {
      expect(attrSelector('data-id', '123')).toBe('[data-id="123"]');
    });

    it('should build partial attribute selector', () => {
      expect(attrSelector('class', 'button', true)).toBe('[class*="button"]');
    });
  });

  describe('dataSelector', () => {
    it('should build data attribute selector', () => {
      expect(dataSelector('record-id', '001XXXX')).toBe('[data-record-id="001XXXX"]');
    });
  });
});
