_MESSAGE_LC=$(tr '[:upper:]' '[:lower:]' < "$SP_TEST_MESSAGE_FILE")
_EXPLICIT_PROJECT_MEMORY_ROUTE=""
_MUTATING_PROJECT_MEMORY_PATH="(set up|repair|rewrite|update|edit|fix|add|append|write|create|remove|delete|trim|prune).{0,120}docs/project_notes/(readme|bugs|decisions|key_facts|issues)\\.md"
_EXPLICIT_PROJECT_MEMORY_RECORD_PATH="(log|record) (this |a )?bug fix in docs/project_notes/bugs\\.md|record (durable )?bugs in docs/project_notes/bugs\\.md|record (this |a |durable )?decisions? in docs/project_notes/decisions\\.md|update (our )?key facts in docs/project_notes/key_facts\\.md|record (durable )?issue breadcrumbs in docs/project_notes/issues\\.md"
_NEGATED_PROJECT_MEMORY_ROUTE="(do not|don't) (use featureforge:project-memory|work on project memory itself|set up project memory|repair project memory|(log|record) (this |a )?bug fix in project memory|record (this |a )?decision in project memory|update (our )?key facts in project memory|record durable bugs in project memory|record durable decisions in project memory|record (durable )?key facts in project memory|record (durable )?issue breadcrumbs in project memory|$_EXPLICIT_PROJECT_MEMORY_RECORD_PATH|$_MUTATING_PROJECT_MEMORY_PATH)"
_POSITIVE_PROJECT_MEMORY_ROUTE="(use|invoke) featureforge:project-memory|work on project memory itself|(set up|repair) project memory|(log|record) (this |a )?bug fix in project memory|record (this |a )?decision in project memory|update (our )?key facts in project memory|record durable bugs in project memory|record durable decisions in project memory|record (durable )?key facts in project memory|record (durable )?issue breadcrumbs in project memory|$_EXPLICIT_PROJECT_MEMORY_RECORD_PATH|$_MUTATING_PROJECT_MEMORY_PATH"
if printf '%s' "$_MESSAGE_LC" | grep -Eq "$_NEGATED_PROJECT_MEMORY_ROUTE"; then
  _EXPLICIT_PROJECT_MEMORY_ROUTE=""
elif printf '%s' "$_MESSAGE_LC" | grep -Eq "$_POSITIVE_PROJECT_MEMORY_ROUTE"; then
  _EXPLICIT_PROJECT_MEMORY_ROUTE="featureforge:project-memory"
fi
if [ -n "$_EXPLICIT_PROJECT_MEMORY_ROUTE" ]; then
  printf '%s\n' "$_EXPLICIT_PROJECT_MEMORY_ROUTE"
elif [ -n "${SP_TEST_WORKFLOW_NEXT_SKILL:-}" ]; then
  printf '%s\n' "$SP_TEST_WORKFLOW_NEXT_SKILL"
fi
