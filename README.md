# SF Browser Control

A Claude Code plugin providing browser automation for Salesforce orgs authenticated via SF CLI. Uses Playwright for browser control and leverages SF CLI's frontdoor.jsp authentication.

## Features

- **Browser Session Management**: Launch and control browser sessions for SF CLI authenticated orgs
- **Lightning-Aware Navigation**: Navigate to Setup, objects, records, apps with automatic wait handling
- **Form Interactions**: Fill text fields, picklists, lookups, checkboxes, and date fields
- **Record Operations**: Create, edit, save, delete, and clone records
- **Setup Automation**: Quick Find, Object Manager, permission sets, profiles, and flows
- **Page Capture**: Screenshots, text extraction, and JavaScript evaluation

## Installation

### As a Claude Code Plugin (Recommended)

```bash
# Add the marketplace (one-time)
/plugin marketplace add ehartye/hartye-claude-plugins

# Install the plugin
/plugin install sf-browser-control@hartye-plugins
```

### Prerequisites

Before using the plugin, ensure you have:
- SF CLI installed and authenticated with at least one org (`sf org login web -a myalias`)
- Playwright browsers installed (`npx playwright install chromium`)

### Manual Installation

If you prefer manual setup:

```bash
git clone https://github.com/ehartye/sf-browser-control.git
cd sf-browser-control
npm install
npm run build
```

Then add to your Claude Code settings (`~/.claude/settings.json`):

```json
{
  "mcpServers": {
    "sf-browser-control": {
      "command": "node",
      "args": ["/path/to/sf-browser-control/dist/index.js"]
    }
  }
}
```

## Slash Commands

| Command | Description |
|---------|-------------|
| `/sf-browser-control:start-session` | Start an authenticated Salesforce browser session |
| `/sf-browser-control:create-record` | Create a new Salesforce record with guided form filling |
| `/sf-browser-control:setup-navigation` | Navigate Salesforce Setup and Quick Find |

## Available Tools (45 total)

### Session Management (5)
| Tool | Description |
|------|-------------|
| `sf_session_start` | Launch authenticated browser session for a Salesforce org |
| `sf_session_status` | Get current session status and org info |
| `sf_session_refresh` | Refresh access token if expired |
| `sf_session_close` | Close browser and end session |
| `sf_list_orgs` | List all SF CLI authenticated orgs |

### Navigation (8)
| Tool | Description |
|------|-------------|
| `sf_navigate_home` | Navigate to Salesforce home page |
| `sf_navigate_setup` | Navigate to Setup (optionally to a section) |
| `sf_navigate_setup_search` | Search Setup using Quick Find |
| `sf_navigate_object` | Navigate to object list view or record |
| `sf_navigate_app` | Open App Launcher and select app |
| `sf_navigate_url` | Navigate to specific Salesforce path |
| `sf_navigate_record` | Navigate to record by ID |
| `sf_navigate_tab` | Navigate to specific tab |

### UI Interaction (12)
| Tool | Description |
|------|-------------|
| `sf_click` | Click element by selector |
| `sf_click_button` | Click Lightning button by label |
| `sf_fill` | Fill input by selector |
| `sf_fill_field` | Fill Lightning field by label |
| `sf_select_picklist` | Select picklist value |
| `sf_select_lookup` | Search and select lookup value |
| `sf_check_checkbox` | Check/uncheck checkbox |
| `sf_fill_date` | Fill date/datetime field |
| `sf_hover` | Hover over element |
| `sf_press_key` | Press keyboard key |
| `sf_scroll` | Scroll page or element |
| `sf_wait_for_element` | Wait for element state |

### Record Operations (6)
| Tool | Description |
|------|-------------|
| `sf_record_new` | Open new record form |
| `sf_record_edit` | Edit current record |
| `sf_record_save` | Save record form |
| `sf_record_cancel` | Cancel edit |
| `sf_record_delete` | Delete record |
| `sf_record_clone` | Clone record |

### Setup (6)
| Tool | Description |
|------|-------------|
| `sf_setup_quick_find` | Use Setup Quick Find |
| `sf_setup_create_user` | Navigate to create user form |
| `sf_setup_permission_set` | Navigate to permission set |
| `sf_setup_profile` | Navigate to profile |
| `sf_setup_object_manager` | Open Object Manager for object |
| `sf_setup_flow` | Navigate to Flow Builder |

### Capture & Utility (10)
| Tool | Description |
|------|-------------|
| `sf_screenshot` | Take screenshot |
| `sf_get_page_text` | Get visible text content |
| `sf_get_element_text` | Get element text |
| `sf_get_field_value` | Get form field value |
| `sf_get_record_details` | Get record details |
| `sf_get_toast_message` | Get toast notification |
| `sf_get_current_url` | Get current URL |
| `sf_evaluate_js` | Execute JavaScript |
| `sf_wait_for_spinner` | Wait for spinners |
| `sf_wait_for_navigation` | Wait for navigation |

## Example Usage

### Start a session and navigate

```
1. Use sf_list_orgs to see available orgs
2. Use sf_session_start with orgAlias="myorg" to launch browser
3. Use sf_navigate_object with objectApiName="Account" to view Accounts
```

### Create a new record

```
1. Use sf_session_start with orgAlias="myorg"
2. Use sf_record_new with objectApiName="Contact"
3. Use sf_fill_field with fieldLabel="First Name" value="John"
4. Use sf_fill_field with fieldLabel="Last Name" value="Doe"
5. Use sf_select_lookup with fieldLabel="Account Name" searchTerm="Acme"
6. Use sf_record_save
7. Use sf_get_toast_message to confirm success
```

### Navigate Setup and modify configuration

```
1. Use sf_session_start with orgAlias="myorg"
2. Use sf_navigate_setup with section="Users"
3. Use sf_setup_quick_find with searchTerm="Permission Sets"
4. Use sf_screenshot to capture the current view
```

## Development

```bash
# Build
npm run build

# Run in development mode (with tsx)
npm run dev

# Clean build
npm run clean
```

## Architecture

```
src/
├── index.ts                # Entry point
├── server.ts               # MCP server setup with tool registration
├── browser/
│   └── sessionManager.ts   # Browser lifecycle management
├── salesforce/
│   ├── auth.ts             # SF CLI authentication
│   ├── urlBuilder.ts       # Salesforce URL construction
│   ├── selectors.ts        # Lightning CSS selectors
│   ├── waitStrategies.ts   # Lightning-aware wait conditions
│   └── uiPatterns.ts       # UI pattern handlers
├── tools/
│   ├── session.tools.ts    # Session management tools
│   ├── navigation.tools.ts # Navigation tools
│   ├── interaction.tools.ts# UI interaction tools
│   ├── record.tools.ts     # Record operation tools
│   ├── setup.tools.ts      # Setup tools
│   └── capture.tools.ts    # Screenshot and capture tools
└── types/
    └── index.ts            # Shared type definitions
```

## Key Implementation Details

### Authentication
Uses SF CLI's `sf org open --url-only` to get a frontdoor.jsp URL with an embedded session token. This provides secure authentication without handling passwords.

### Lightning-Aware Waits
Custom wait strategies handle:
- Lightning spinners
- Skeleton loaders (stencils)
- Aura framework initialization
- Modal dialogs and toasts

### Selectors
Prioritizes stable selectors:
- `lightning-input-field:has(label:text-is("Name"))` over dynamic IDs
- Semantic attributes over generated class names

## Troubleshooting

### "Org not found" error
- Run `sf org list` to see authenticated orgs
- Authenticate with `sf org login web -a myalias`

### Browser doesn't launch
- Install Playwright browsers: `npx playwright install chromium`
- Check if another process is using the port

### Elements not found
- Use `sf_screenshot` to see current page state
- Check if page has finished loading with `sf_wait_for_spinner`
- Try `sf_wait_for_element` with a specific selector

## License

MIT
