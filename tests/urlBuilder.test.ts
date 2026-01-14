import { describe, it, expect, beforeEach } from 'vitest';
import { SalesforceUrlBuilder } from '../src/salesforce/urlBuilder.js';

describe('SalesforceUrlBuilder', () => {
  let urlBuilder: SalesforceUrlBuilder;
  const instanceUrl = 'https://myorg.lightning.force.com';

  beforeEach(() => {
    urlBuilder = new SalesforceUrlBuilder(instanceUrl);
  });

  describe('constructor and getters', () => {
    it('should store and return instance URL', () => {
      expect(urlBuilder.getInstanceUrl()).toBe(instanceUrl);
    });

    it('should allow updating instance URL', () => {
      const newUrl = 'https://neworg.lightning.force.com';
      urlBuilder.setInstanceUrl(newUrl);
      expect(urlBuilder.getInstanceUrl()).toBe(newUrl);
    });
  });

  describe('objectHome', () => {
    it('should build object home URL', () => {
      expect(urlBuilder.objectHome('Account')).toBe('/lightning/o/Account/list');
    });

    it('should build object home URL with list view', () => {
      expect(urlBuilder.objectHome('Contact', 'AllContacts')).toBe(
        '/lightning/o/Contact/list?filterName=AllContacts'
      );
    });

    it('should handle custom objects', () => {
      expect(urlBuilder.objectHome('MyObject__c')).toBe('/lightning/o/MyObject__c/list');
    });
  });

  describe('recordView', () => {
    it('should build record view URL', () => {
      expect(urlBuilder.recordView('001XXXXXXXXXXXX')).toBe(
        '/lightning/r/001XXXXXXXXXXXX/view'
      );
    });
  });

  describe('recordEdit', () => {
    it('should build record edit URL', () => {
      expect(urlBuilder.recordEdit('001XXXXXXXXXXXX')).toBe(
        '/lightning/r/001XXXXXXXXXXXX/edit'
      );
    });
  });

  describe('newRecord', () => {
    it('should build new record URL', () => {
      expect(urlBuilder.newRecord('Account')).toBe('/lightning/o/Account/new');
    });

    it('should build new record URL with record type', () => {
      expect(urlBuilder.newRecord('Account', '012XXXXXXXXXXXX')).toBe(
        '/lightning/o/Account/new?recordTypeId=012XXXXXXXXXXXX'
      );
    });
  });

  describe('home', () => {
    it('should return Lightning home URL', () => {
      expect(urlBuilder.home()).toBe('/lightning/page/home');
    });
  });

  describe('setupHome', () => {
    it('should return Setup home URL', () => {
      expect(urlBuilder.setupHome()).toBe('/lightning/setup/SetupOneHome/home');
    });
  });

  describe('setupPage', () => {
    it('should build Setup page URL', () => {
      expect(urlBuilder.setupPage('ManageUsers')).toBe('/lightning/setup/ManageUsers/home');
    });
  });

  describe('objectManager', () => {
    it('should build Object Manager URL without section', () => {
      expect(urlBuilder.objectManager('Account')).toBe('/lightning/setup/ObjectManager/Account');
    });

    it('should build Object Manager URL with Fields section', () => {
      expect(urlBuilder.objectManager('Account', 'Fields')).toBe(
        '/lightning/setup/ObjectManager/Account/FieldsAndRelationships/view'
      );
    });

    it('should build Object Manager URL with PageLayouts section', () => {
      expect(urlBuilder.objectManager('Contact', 'PageLayouts')).toBe(
        '/lightning/setup/ObjectManager/Contact/PageLayouts/view'
      );
    });

    it('should build Object Manager URL with ValidationRules section', () => {
      expect(urlBuilder.objectManager('Opportunity', 'ValidationRules')).toBe(
        '/lightning/setup/ObjectManager/Opportunity/ValidationRules/view'
      );
    });

    it('should build Object Manager URL with Triggers section', () => {
      expect(urlBuilder.objectManager('Case', 'Triggers')).toBe(
        '/lightning/setup/ObjectManager/Case/ApexTriggers/view'
      );
    });
  });

  describe('flowBuilder', () => {
    it('should return Flow list URL without flow ID', () => {
      expect(urlBuilder.flowBuilder()).toBe('/lightning/setup/Flows/home');
    });

    it('should return Flow Builder URL with flow ID', () => {
      expect(urlBuilder.flowBuilder('301XXXXXXXXXXXX')).toBe(
        '/builder_platform_interaction/flowBuilder.app?flowId=301XXXXXXXXXXXX'
      );
    });
  });

  describe('user management URLs', () => {
    it('should return users URL', () => {
      expect(urlBuilder.users()).toBe('/lightning/setup/ManageUsers/home');
    });

    it('should return permission sets URL', () => {
      expect(urlBuilder.permissionSets()).toBe('/lightning/setup/PermSets/home');
    });

    it('should return profiles URL', () => {
      expect(urlBuilder.profiles()).toBe('/lightning/setup/Profiles/home');
    });
  });

  describe('fullUrl', () => {
    it('should prepend instance URL to path', () => {
      expect(urlBuilder.fullUrl('/lightning/page/home')).toBe(
        'https://myorg.lightning.force.com/lightning/page/home'
      );
    });

    it('should handle path without leading slash', () => {
      expect(urlBuilder.fullUrl('lightning/page/home')).toBe(
        'https://myorg.lightning.force.com/lightning/page/home'
      );
    });
  });

  describe('other setup URLs', () => {
    it('should return apex classes URL', () => {
      expect(urlBuilder.apexClasses()).toBe('/lightning/setup/ApexClasses/home');
    });

    it('should return custom settings URL', () => {
      expect(urlBuilder.customSettings()).toBe('/lightning/setup/CustomSettings/home');
    });

    it('should return custom metadata types URL', () => {
      expect(urlBuilder.customMetadataTypes()).toBe('/lightning/setup/CustomMetadata/home');
    });

    it('should return app manager URL', () => {
      expect(urlBuilder.appManager()).toBe('/lightning/setup/NavigationMenus/home');
    });

    it('should return Lightning App Builder URL without page ID', () => {
      expect(urlBuilder.lightningAppBuilder()).toBe('/lightning/setup/FlexiPageList/home');
    });

    it('should return Lightning App Builder URL with page ID', () => {
      expect(urlBuilder.lightningAppBuilder('0M0XXXXXXXXXXXX')).toBe(
        '/visualEditor/appBuilder.app?pageId=0M0XXXXXXXXXXXX'
      );
    });
  });
});
