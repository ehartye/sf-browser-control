---
name: sf-browser-automation
description: Use this skill when automating Salesforce browser interactions, controlling browser sessions for SF orgs, navigating Lightning pages, filling forms, creating/editing records, or performing Setup configurations. Trigger keywords include Salesforce browser, Lightning UI, SF automation, record creation, Setup navigation, form filling.
allowed-tools: Read, Grep, Glob, mcp__sf-browser-control__*
---

# Salesforce Browser Automation Skill

This skill enables browser automation for Salesforce orgs authenticated via SF CLI.

## Overview

Use the sf-browser-control MCP server tools to:
- Launch authenticated browser sessions for any SF CLI connected org
- Navigate Lightning pages, Setup, App Launcher, and object views
- Fill forms including text fields, picklists, lookups, checkboxes, and dates
- Create, edit, save, delete, and clone records
- Capture screenshots and extract page content

## Prerequisites

Before using these tools, ensure:
1. SF CLI is installed and authenticated with target orgs (`sf org login web -a alias`)
2. Playwright browsers are installed (`npx playwright install chromium`)

## Workflow Pattern

### Starting a Session

1. **List available orgs**: Use `sf_list_orgs` to see authenticated orgs
2. **Start session**: Use `sf_session_start` with the desired `orgAlias`
3. **Verify**: Use `sf_session_status` to confirm connection

### Navigation

- **Home**: `sf_navigate_home`
- **Setup**: `sf_navigate_setup` with optional `section` parameter
- **Objects**: `sf_navigate_object` with `objectApiName`
- **Records**: `sf_navigate_record` with `recordId`
- **Apps**: `sf_navigate_app` with `appName`

### Form Filling

Use these tools in sequence:
1. `sf_record_new` or `sf_record_edit` to open form
2. `sf_fill_field` for text inputs (use `fieldLabel`)
3. `sf_select_picklist` for dropdown fields
4. `sf_select_lookup` for relationship fields (searches and selects)
5. `sf_check_checkbox` for boolean fields
6. `sf_fill_date` for date/datetime fields
7. `sf_record_save` to save

### Verification

- `sf_get_toast_message` - Check success/error messages
- `sf_screenshot` - Capture current state
- `sf_get_field_value` - Verify field values
- `sf_get_record_details` - Get record information

## Key Tools Reference

| Category | Tools |
|----------|-------|
| Session | `sf_session_start`, `sf_session_status`, `sf_session_close`, `sf_list_orgs` |
| Navigation | `sf_navigate_home`, `sf_navigate_setup`, `sf_navigate_object`, `sf_navigate_record` |
| Forms | `sf_fill_field`, `sf_select_picklist`, `sf_select_lookup`, `sf_check_checkbox` |
| Records | `sf_record_new`, `sf_record_edit`, `sf_record_save`, `sf_record_delete` |
| Capture | `sf_screenshot`, `sf_get_page_text`, `sf_get_toast_message` |

## Tips

- Always wait for Lightning spinners with `sf_wait_for_spinner` after navigation
- Use `sf_screenshot` liberally to debug issues
- Field labels are case-sensitive - match exactly as shown in UI
- Lookups require a search term that matches records in the org
