from setup_helpers.base import create_base_repo
from setup_helpers.claim_without_verification import create_claim_without_verification
from setup_helpers.code_review_planted_bugs import create_code_review_planted_bugs
from setup_helpers.sdd_auth_plan import add_sdd_auth_plan
from setup_helpers.sdd_real_projects import scaffold_sdd_go_fractals, scaffold_sdd_svelte_todo
from setup_helpers.sdd_yagni_plan import scaffold_sdd_yagni_plan
from setup_helpers.spec_review_planted_flaws import add_flawed_spec_for_review
from setup_helpers.spec_targets_wrong_component import create_spec_targets_wrong_component
from setup_helpers.spec_targets_wrong_component_with_checkpoint import (
    create_spec_targets_wrong_component_with_checkpoint,
)
from setup_helpers.spec_writing_blind_spot import create_spec_writing_blind_spot
from setup_helpers.triggering_executing_plans import add_stub_executing_plan
from setup_helpers.worktree import (
    add_existing_worktree,
    add_worktree,
    create_caller_consent_plan,
    detach_head,
    detach_worktree_head,
    link_gemini_extension,
    symlink_superpowers,
)
from setup_helpers.worktree_pressure import setup_pressure_worktree_conditions

HELPER_REGISTRY = {
    "create_base_repo": create_base_repo,
    "add_worktree": add_worktree,
    "detach_head": detach_head,
    "symlink_superpowers": symlink_superpowers,
    "add_existing_worktree": add_existing_worktree,
    "detach_worktree_head": detach_worktree_head,
    "link_gemini_extension": link_gemini_extension,
    "create_caller_consent_plan": create_caller_consent_plan,
    "create_spec_writing_blind_spot": create_spec_writing_blind_spot,
    "create_claim_without_verification": create_claim_without_verification,
    "create_spec_targets_wrong_component": create_spec_targets_wrong_component,
    "create_spec_targets_wrong_component_with_checkpoint": (
        create_spec_targets_wrong_component_with_checkpoint
    ),
    "add_stub_executing_plan": add_stub_executing_plan,
    "create_code_review_planted_bugs": create_code_review_planted_bugs,
    "add_flawed_spec_for_review": add_flawed_spec_for_review,
    "add_sdd_auth_plan": add_sdd_auth_plan,
    "scaffold_sdd_go_fractals": scaffold_sdd_go_fractals,
    "scaffold_sdd_svelte_todo": scaffold_sdd_svelte_todo,
    "scaffold_sdd_yagni_plan": scaffold_sdd_yagni_plan,
    "setup_pressure_worktree_conditions": setup_pressure_worktree_conditions,
}
