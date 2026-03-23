# GitHub Project Setup Guide

Manual configuration steps to set up the kanban board views for both projects.

## Project #1: Bug Fixes

**URL:** https://github.com/orgs/superpowers-agent/projects/1

### Step 1: Configure Status Field Options

1. Open the project
2. Click on the **Status** column header dropdown (or go to Settings)
3. Edit the Status field
4. Replace the default options with these 5 stages:
   - **Triage**
   - **Fix**
   - **Test**
   - **UserTest**
   - **Done**
5. Delete the default "Todo", "In Progress" options
6. Save changes

### Step 2: Configure Board View

1. In the project, ensure you have a "Board" view (or create one if needed)
2. Configure the Board view settings:
   - **Group by:** Status
   - **Columns:** Should automatically show: Triage, Fix, Test, UserTest, Done
3. Arrange columns in the workflow order (left to right):
   - Triage → Fix → Test → UserTest → Done

### Step 3: Set Default View (Optional)

1. If you created a new Board view, set it as the default view for the project
2. Name it "Workflow" or "Kanban"

---

## Project #2: Feature Development

**URL:** https://github.com/orgs/superpowers-agent/projects/2

### Step 1: Configure Status Field Options

1. Open the project
2. Click on the **Status** column header dropdown (or go to Settings)
3. Edit the Status field
4. Replace the default options with these 6 stages:
   - **Brainstorm**
   - **Design Review**
   - **Plan**
   - **Implement**
   - **Review**
   - **Done**
5. Delete the default "Todo", "In Progress" options
6. Save changes

### Step 2: Configure Board View

1. In the project, ensure you have a "Board" view (or create one if needed)
2. Configure the Board view settings:
   - **Group by:** Status
   - **Columns:** Should automatically show: Brainstorm, Design Review, Plan, Implement, Review, Done
3. Arrange columns in the workflow order (left to right):
   - Brainstorm → Design Review → Plan → Implement → Review → Done

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
