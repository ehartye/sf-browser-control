/**
 * Salesforce URL Builder for Lightning Experience
 * Constructs proper URLs for various Salesforce pages
 */
export class SalesforceUrlBuilder {
  constructor(private instanceUrl: string) {}

  /**
   * Build URL for object home/list view
   */
  objectHome(objectApiName: string, listViewId?: string): string {
    const base = `/lightning/o/${objectApiName}`;
    if (listViewId) {
      return `${base}/list?filterName=${listViewId}`;
    }
    return `${base}/list`;
  }

  /**
   * Build URL for record view
   */
  recordView(recordId: string): string {
    return `/lightning/r/${recordId}/view`;
  }

  /**
   * Build URL for record edit
   */
  recordEdit(recordId: string): string {
    return `/lightning/r/${recordId}/edit`;
  }

  /**
   * Build URL for new record
   */
  newRecord(objectApiName: string, recordTypeId?: string): string {
    let url = `/lightning/o/${objectApiName}/new`;
    if (recordTypeId) {
      url += `?recordTypeId=${recordTypeId}`;
    }
    return url;
  }

  /**
   * Build URL for Lightning home
   */
  home(): string {
    return '/lightning/page/home';
  }

  /**
   * Build URL for Setup home
   */
  setupHome(): string {
    return '/lightning/setup/SetupOneHome/home';
  }

  /**
   * Build URL for Setup page by name
   */
  setupPage(pageName: string): string {
    return `/lightning/setup/${pageName}/home`;
  }

  /**
   * Build URL for Object Manager
   */
  objectManager(objectApiName: string, section?: string): string {
    let url = `/lightning/setup/ObjectManager/${objectApiName}`;
    if (section) {
      const sectionMap: Record<string, string> = {
        Fields: 'FieldsAndRelationships',
        PageLayouts: 'PageLayouts',
        ValidationRules: 'ValidationRules',
        Triggers: 'ApexTriggers',
        LightningPages: 'LightningRecordPages',
        Buttons: 'ButtonsLinksActions',
      };
      url += `/${sectionMap[section] || section}/view`;
    }
    return url;
  }

  /**
   * Build URL for Flow Builder
   */
  flowBuilder(flowId?: string): string {
    if (flowId) {
      return `/builder_platform_interaction/flowBuilder.app?flowId=${flowId}`;
    }
    return '/lightning/setup/Flows/home';
  }

  /**
   * Build URL for user management
   */
  users(): string {
    return '/lightning/setup/ManageUsers/home';
  }

  /**
   * Build URL for permission sets
   */
  permissionSets(): string {
    return '/lightning/setup/PermSets/home';
  }

  /**
   * Build URL for profiles
   */
  profiles(): string {
    return '/lightning/setup/Profiles/home';
  }

  /**
   * Build URL for a specific profile
   */
  profile(profileId: string): string {
    return `/lightning/setup/Profiles/page?address=%2F${profileId}`;
  }

  /**
   * Build URL for a specific permission set
   */
  permissionSet(permSetId: string): string {
    return `/lightning/setup/PermSets/page?address=%2F${permSetId}`;
  }

  /**
   * Build URL for Apex classes
   */
  apexClasses(): string {
    return '/lightning/setup/ApexClasses/home';
  }

  /**
   * Build URL for custom settings
   */
  customSettings(): string {
    return '/lightning/setup/CustomSettings/home';
  }

  /**
   * Build URL for custom metadata types
   */
  customMetadataTypes(): string {
    return '/lightning/setup/CustomMetadata/home';
  }

  /**
   * Build URL for App Manager
   */
  appManager(): string {
    return '/lightning/setup/NavigationMenus/home';
  }

  /**
   * Build URL for Lightning App Builder
   */
  lightningAppBuilder(pageId?: string): string {
    if (pageId) {
      return `/visualEditor/appBuilder.app?pageId=${pageId}`;
    }
    return '/lightning/setup/FlexiPageList/home';
  }

  /**
   * Build URL for Developer Console
   */
  developerConsole(): string {
    return '/_ui/common/apex/debug/ApexCSIPage';
  }

  /**
   * Get full URL with instance
   */
  fullUrl(path: string): string {
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${this.instanceUrl}${cleanPath}`;
  }

  /**
   * Update instance URL (useful after session refresh)
   */
  setInstanceUrl(instanceUrl: string): void {
    this.instanceUrl = instanceUrl;
  }

  /**
   * Get current instance URL
   */
  getInstanceUrl(): string {
    return this.instanceUrl;
  }
}
