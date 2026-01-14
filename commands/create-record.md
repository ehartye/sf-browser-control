---
description: Create a new Salesforce record
---

# Create Salesforce Record

Guide the user through creating a new record in Salesforce.

## Steps

1. Ensure a session is active using `sf_session_status`. If not, start one first.

2. Ask the user which object they want to create a record for (e.g., Account, Contact, Opportunity)

3. Open the new record form with `sf_record_new` and the `objectApiName`

4. Wait for the form to load with `sf_wait_for_spinner`

5. For each field the user wants to fill:
   - Text fields: Use `sf_fill_field` with `fieldLabel` and `value`
   - Picklists: Use `sf_select_picklist` with `fieldLabel` and `value`
   - Lookups: Use `sf_select_lookup` with `fieldLabel` and `searchTerm`
   - Checkboxes: Use `sf_check_checkbox` with `fieldLabel` and `checked`
   - Dates: Use `sf_fill_date` with `fieldLabel` and `value`

6. Save the record with `sf_record_save`

7. Check the result with `sf_get_toast_message`

8. If successful, offer to:
   - View the record details
   - Create another record
   - Navigate elsewhere

## Tips

- Field labels must match exactly as shown in the Salesforce UI
- Required fields will prevent save if not filled
- Use `sf_screenshot` to debug if fields aren't being found
