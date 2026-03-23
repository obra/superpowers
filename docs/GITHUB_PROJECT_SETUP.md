# GitHub Project Setup Guide

Manual configuration steps to set up the kanban board views for both projects.

## Project #1: Bug Fixes

**URL:** https://github.com/orgs/superpowers-agent/projects/1

### Step 1: Configure Status Field Options

1. Open the project
2. Select **"Settings"** from the **"..."** dropdown menu at the top right of the project
3. Navigate to **"Status"** in the left pane under "Fields"
4. Edit/add options to match these exact names (suggested colors and descriptions):

   **Name:** Triage
   **Color:** Red (optional)
   **Description:** "Investigating root cause" (optional)

   **Name:** Fix
   **Color:** Orange (optional)
   **Description:** "Implementing the fix" (optional)

   **Name:** Test
   **Color:** Yellow (optional)
   **Description:** "Running CI gates" (optional)

   **Name:** UserTest
   **Color:** Blue (optional)
   **Description:** "Ready for user acceptance testing" (optional)

   **Name:** Done
   **Color:** Green (optional)
   **Description:** "Complete and merged" (optional)

5. Delete the default "Todo", "In Progress" options
6. Save changes

### Step 2: Configure Board View

1. In the project, click the **view selector** (gear icon) on the right side of the screen
2. Select "Board" view (or create a new Board view if needed)
3. Click the view's dropdown menu (•••) and select "Settings"
4. Configure the Board view settings:
   - **Group by:** Status
   - **Columns:** Should automatically show: Triage, Fix, Test, UserTest, Done
5. The columns will appear in the order of the Status field options
6. Save the view

### Step 3: Set Default View (Optional)

1. If you created a new Board view, set it as the default view for the project
2. Name it "Workflow" or "Kanban"

---

## Project #2: Feature Development

**URL:** https://github.com/orgs/superpowers-agent/projects/2

### Step 1: Configure Status Field Options

1. Open the project
2. Select **"Settings"** from the **"..."** dropdown menu at the top right of the project
3. Navigate to **"Status"** in the left pane under "Fields"
4. Edit/add options to match these exact names (suggested colors and descriptions):

   **Name:** Brainstorm
   **Color:** Blue (optional)
   **Description:** "Exploring ideas and requirements" (optional)

   **Name:** Design Review
   **Color:** Green (optional)
   **Description:** "Ready for design review" (optional)

   **Name:** Plan
   **Color:** Yellow (optional)
   **Description:** "Creating implementation plan" (optional)

   **Name:** Implement
   **Color:** Orange (optional)
   **Description:** "Implementing the feature" (optional)

   **Name:** Test
   **Color:** Red (optional)
   **Description:** "Running CI gates" (optional)

   **Name:** Review
   **Color:** Pink (optional)
   **Description:** "Ready for code review" (optional)

   **Name:** Done
   **Color:** Purple (optional)
   **Description:** "Complete and merged" (optional)

5. Delete the default "Todo", "In Progress" options
6. Save changes

### Step 2: Configure Board View

1. In the project, click the **view selector** (gear icon) on the right side of the screen
2. Select "Board" view (or create a new Board view if needed)
3. Click the view's dropdown menu (•••) and select "Settings"
4. Configure the Board view settings:
   - **Group by:** Status
   - **Columns:** Should automatically show: Brainstorm, Design Review, Plan, Implement, Review, Done
5. The columns will appear in the order of the Status field options
6. Save the view

### Step 3: Set Default View (Optional)

1. If you created a new Board view, set it as the default view for the project
2. Name it "Workflow" or "Kanban"

---

## Verification

After completing the setup for both projects:

1. Each project should have a Board view with columns matching the workflow stages
2. The Status field should have exactly the stage names listed above
3. Issues added to the project can be moved between stages by dragging cards or changing the Status field

## Testing

To test the setup:

1. Create a test issue in the super-agents repo
2. Add it to one of the projects
3. Set its Status to the first stage (Triage or Brainstorm)
4. Verify it appears in the correct column
5. Move it to the next stage and verify it updates

## Next Steps

Once both projects are configured:

1. The loop orchestrator can process issues through these stages
2. Each stage maps to a skill defined in `project-flows.json`
3. The loop reads the Status field to determine which skill to dispatch
4. Skills post markers to GitHub issues as they progress

Ready to use with `/loop` command.
