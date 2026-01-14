---
description: Navigate Salesforce Setup
---

# Navigate Salesforce Setup

Help the user navigate and find items in Salesforce Setup.

## Steps

1. Ensure a session is active using `sf_session_status`. If not, start one first.

2. Navigate to Setup with `sf_navigate_setup`

3. If the user is looking for something specific:
   - Use `sf_setup_quick_find` with their search term
   - Wait for results with `sf_wait_for_spinner`

4. For common Setup destinations:
   - **Users**: `sf_navigate_setup` with section="Users"
   - **Permission Sets**: `sf_setup_permission_set` with `permissionSetName`
   - **Profiles**: `sf_setup_profile` with `profileName`
   - **Object Manager**: `sf_setup_object_manager` with `objectApiName`
   - **Flows**: `sf_setup_flow` (lists all flows) or with `flowName`

5. Take a screenshot with `sf_screenshot` to show the user the current view

## Common Setup Searches

| Looking for | Quick Find term |
|-------------|-----------------|
| Custom Objects | "Object Manager" |
| Fields | "Object Manager" then select object |
| Page Layouts | "Object Manager" then select object |
| Permission Sets | "Permission Sets" |
| Profiles | "Profiles" |
| Users | "Users" |
| Flows | "Flows" |
| Apex Classes | "Apex Classes" |
| Custom Settings | "Custom Settings" |
| Custom Metadata | "Custom Metadata" |
