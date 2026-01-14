---
description: Start a Salesforce browser session
---

# Start SF Browser Session

Help the user start an authenticated Salesforce browser session.

## Steps

1. First, list available orgs using the `sf_list_orgs` tool to show the user what's available

2. If the user hasn't specified which org to use, ask them to choose from the list

3. Start the session using `sf_session_start` with the chosen `orgAlias`

4. Verify the session is active with `sf_session_status`

5. Report success and offer next steps:
   - Navigate to a specific object or record
   - Go to Setup
   - Open the App Launcher

## Notes

- If the org list is empty, guide the user to authenticate: `sf org login web -a myalias`
- If browser launch fails, suggest: `npx playwright install chromium`
