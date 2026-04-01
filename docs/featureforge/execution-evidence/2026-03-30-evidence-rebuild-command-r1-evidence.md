# Execution Evidence: 2026-03-30-evidence-rebuild-command

**Plan Path:** docs/featureforge/plans/2026-03-30-evidence-rebuild-command.md
**Plan Revision:** 1
**Plan Fingerprint:** f1edf6b969eae02b3b0f91d5e117ee55e95bd593b6697bb2ccc11d3f5adc70ee
**Source Spec Path:** docs/featureforge/specs/2026-03-30-evidence-rebuild-command-spec.md
**Source Spec Revision:** 1
**Source Spec Fingerprint:** 703523948e6b4ff16c90c48dd2db06141040deb1837af211d0316cf8175d753a

## Step Evidence

### Task 1 Step 1
#### Attempt 1
**Status:** Invalidated
**Recorded At:** 2026-03-30T19:31:16.024455Z
**Execution Source:** featureforge:executing-plans
**Task Number:** 1
**Step Number:** 1
**Packet Fingerprint:** 62978646c68d654a6828310f614563d0469dc863dcaa1b47f1e3ff025375fb30
**Head SHA:** 5527e0d7d94e617dc9d44b77194aa7f0a958b98d
**Base SHA:** 5527e0d7d94e617dc9d44b77194aa7f0a958b98d
**Claim:** Added the initial red coverage for rebuild-evidence command shape and flag parsing.
**Files Proven:**
- tests/plan_execution.rs | sha256:ac367ab590968cdb46124755448141d73f16546701b05c3997437790576ed42f
**Verify Command:** cargo test --test plan_execution rebuild_
**Verification Summary:** `cargo test --test plan_execution rebuild_` -> 6 rebuild-focused tests passed
**Invalidation Reason:** Evidence rebuild: packet_fingerprint_mismatch

#### Attempt 2
**Status:** Invalidated
**Recorded At:** 2026-03-31T18:04:58.523134Z
**Execution Source:** featureforge:executing-plans
**Task Number:** 1
**Step Number:** 1
**Packet Fingerprint:** 18d1196022c2e4c8bd0719e2c5efd63d11a09d202db0d91fc06e5cf48c45c48e
**Head SHA:** 5527e0d7d94e617dc9d44b77194aa7f0a958b98d
**Base SHA:** 5527e0d7d94e617dc9d44b77194aa7f0a958b98d
**Claim:** Added the initial red coverage for rebuild-evidence command shape and flag parsing.
**Files Proven:**
- tests/plan_execution.rs | sha256:b9753e1ef63075d58f02c382eeaeb0c0b3778eddcdc6da165dbb405116df0fce
**Verify Command:** cargo test --test plan_execution rebuild_
**Verification Summary:** `cargo test --test plan_execution rebuild_` -> passed: running 30 tests test rebuild_candidate_discovery_source_spec_fingerprint_drift ... ok test rebuild_evidence_invalid_scope ... ok test rebuild_evidence_command_shape ... ok test rebuild_candidate_discovery_stale_targets ... ok test rebuild_candidate_discovery_unreadable_artifact ... ok test rebuild_candidate_filtering ... ok test rebuild_candidate_discovery_plan_fingerprint_drift ... ok test rebuild_evidence_json_output_fields ... ok test rebuild_evidence_dry_run_is_noop ... ok test rebuild_evidence_rejects_parallel_max_jobs ... ok test rebuild_evidence_rejects_zero_max_jobs ... ok test rebuild_evidence_manual_required_default ... ok test rebuild_evidence_manual_required_rerun_resumes_open_step ... ok test rebuild_evidence_json_schema ... ok test rebuild_evidence_scope_empty ... ok test rebuild_evidence_legacy_summary_command_replays ... ok test rebuild_evidence_session_not_found ... ok test rebuild_evidence_text_output_summary ... ok test rebuild_executor_no_output_summary ... ok test rebuild_evidence_state_transition_blocked_rerun_resumes_open_step ... ok test rebuild_executor_reopens_and_recompletes ... ok test rebuild_evidence_verify_command_failed_rerun_resumes_open_step ... ok test rebuild_state_transition_retry_rehydrates_verify_command ... ok test rebuild_evidence_text_failure_output ... ok test rebuild_target_race_detected ... ok test rebuild_target_state_transition_blocked ... ok test rebuild_target_race_retries_and_rehydrates_verify_command ... ok test rebuild_evidence_partial_failure_resume ... ok test rebuild_evidence_exit_statuses ... ok test rebuild_evidence_noop_and_partial_failures ... ok test result: ok. 30 passed; 0 failed; 0 ignored; 0 measured; 167 filtered out; finished in 4.37s
**Invalidation Reason:** Evidence rebuild: source_spec_fingerprint_mismatch

#### Attempt 3
**Status:** Invalidated
**Recorded At:** 2026-04-01T06:02:25.71113Z
**Execution Source:** featureforge:executing-plans
**Task Number:** 1
**Step Number:** 1
**Packet Fingerprint:** 23051e0e5c1d1df78f964401096351d4ac98436a3619184c1bb6eb45135f4202
**Head SHA:** 2f97045889529eeb7d7214a0500963d34e9cf47d
**Base SHA:** 2f97045889529eeb7d7214a0500963d34e9cf47d
**Claim:** Added the initial red coverage for rebuild-evidence command shape and flag parsing.
**Files Proven:**
- tests/plan_execution.rs | sha256:6cca045a452626783a0b40e47a3b66f64f23e84cd7286139521b52a7f9a9bb6d
**Verify Command:** cargo test --test plan_execution rebuild_
**Verification Summary:** `cargo test --test plan_execution rebuild_` -> passed: running 41 tests test rebuild_candidate_discovery_unreadable_artifact ... ok test rebuild_candidate_discovery_plan_fingerprint_drift ... ok test rebuild_candidate_discovery_stale_targets ... ok test rebuild_candidate_filtering ... ok test rebuild_evidence_command_shape ... ok test rebuild_candidate_discovery_source_spec_fingerprint_drift ... ok test rebuild_evidence_continue_on_error_clears_failed_earlier_interrupted_target ... ok test rebuild_evidence_dry_run_is_noop ... ok test rebuild_evidence_does_not_publish_contract_bound_receipts_without_active_contract ... ok test rebuild_evidence_invalid_scope ... ok test rebuild_evidence_clears_later_interrupted_step_before_reopening_earlier_target ... ok test rebuild_evidence_json_output_fields ... ok test rebuild_evidence_json_schema ... ok test rebuild_evidence_legacy_summary_command_replays ... ok test rebuild_evidence_manual_required_default ... ok test rebuild_evidence_manual_required_rerun_resumes_open_step ... ok test rebuild_evidence_manual_required_does_not_block_later_command_targets ... ok test rebuild_evidence_keeps_missing_prior_task_review_dispatch_blocked ... ok test rebuild_evidence_noop_refreshes_receipt_only_strategy_checkpoint_drift ... ok test rebuild_evidence_rejects_parallel_max_jobs ... ok test rebuild_evidence_rejects_zero_max_jobs ... ok test rebuild_evidence_session_not_found ... ok test rebuild_evidence_scope_empty ... ok test rebuild_evidence_refreshes_malformed_prior_task_review_receipt_before_task_boundary_retry ... ok test rebuild_evidence_refreshes_prior_task_closure_receipts_across_tasks ... ok test rebuild_evidence_refreshes_non_independent_prior_task_review_receipt_before_task_boundary_retry ... ok test rebuild_evidence_refreshes_preflight_acceptance_before_task_boundary_receipt_recovery ... ok test rebuild_evidence_reuses_active_contract_for_serial_unit_review_receipts ... ok test rebuild_evidence_state_transition_blocked_rerun_resumes_open_step ... ok test rebuild_evidence_text_output_summary ... ok test rebuild_executor_no_output_summary ... ok test rebuild_evidence_verify_command_failed_rerun_resumes_open_step ... ok test rebuild_executor_reopens_and_recompletes ... ok test rebuild_evidence_text_failure_output ... ok test rebuild_evidence_partial_failure_resume ... ok test rebuild_state_transition_retry_rehydrates_verify_command ... ok test rebuild_target_race_detected ... ok test rebuild_target_state_transition_blocked ... ok test rebuild_target_race_retries_and_rehydrates_verify_command ... ok test rebuild_evidence_noop_and_partial_failures ... ok test rebuild_evidence_exit_statuses ... ok test result: ok. 41 passed; 0 failed; 0 ignored; 0 measured; 180 filtered out; finished in 8.56s
**Invalidation Reason:** Evidence rebuild: plan_fingerprint_mismatch

#### Attempt 4
**Status:** Completed
**Recorded At:** 2026-04-01T06:02:32.905135Z
**Execution Source:** featureforge:executing-plans
**Task Number:** 1
**Step Number:** 1
**Packet Fingerprint:** 248ced49301f6b6c4b849c07d112a0b42c577ae4106b762d2e17402b94320e73
**Head SHA:** 3cb97e9af57fb687bc8b01d3be18664e28101118
**Base SHA:** 3cb97e9af57fb687bc8b01d3be18664e28101118
**Claim:** Added the initial red coverage for rebuild-evidence command shape and flag parsing.
**Files Proven:**
- tests/plan_execution.rs | sha256:cee706e9b3195e2468b78c09114b0752288fc66ce6af374795ed37047177f995
**Verify Command:** cargo test --test plan_execution rebuild_
**Verification Summary:** `cargo test --test plan_execution rebuild_` -> passed: running 48 tests test rebuild_evidence_command_shape ... ok test rebuild_candidate_discovery_source_spec_fingerprint_drift ... ok test rebuild_candidate_discovery_stale_targets ... ok test rebuild_candidate_discovery_plan_fingerprint_drift ... ok test rebuild_candidate_filtering ... ok test rebuild_candidate_discovery_unreadable_artifact ... ok test rebuild_evidence_continue_on_error_clears_failed_earlier_interrupted_target ... ok test rebuild_evidence_dry_run_is_noop ... ok test rebuild_evidence_does_not_publish_contract_bound_receipts_without_active_contract ... ok test rebuild_evidence_invalid_scope ... ok test rebuild_evidence_clears_later_interrupted_step_before_reopening_earlier_target ... ok test rebuild_evidence_manual_required_default ... ok test rebuild_evidence_json_output_fields ... ok test rebuild_evidence_json_schema ... ok test rebuild_evidence_legacy_summary_command_replays ... ok test rebuild_evidence_manual_required_does_not_block_later_command_targets ... ok test rebuild_evidence_manual_required_rerun_resumes_open_step ... ok test rebuild_evidence_noop_allows_intermediate_test_plan_only_state ... ok test rebuild_evidence_noop_refreshes_receipt_only_strategy_checkpoint_drift ... ok test rebuild_evidence_manual_required_keeps_downstream_truth_stale_until_repaired ... ok test rebuild_evidence_noop_refreshes_final_review_without_requiring_release_readiness ... ok test rebuild_evidence_refreshes_malformed_prior_task_review_receipt_before_task_boundary_retry ... ok test rebuild_evidence_noop_rebinds_late_gate_artifacts_after_rebase_only_head_drift ... ok test rebuild_evidence_refreshes_prior_task_closure_receipts_across_tasks ... ok test rebuild_evidence_noop_rebinds_late_gate_artifacts_after_replayed_rebase_changes ... ok test rebuild_evidence_noop_restores_authoritative_late_gate_truth ... ok test rebuild_evidence_refreshes_preflight_acceptance_before_task_boundary_receipt_recovery ... ok test rebuild_evidence_refreshes_non_independent_prior_task_review_receipt_before_task_boundary_retry ... ok test rebuild_evidence_rejects_parallel_max_jobs ... ok test rebuild_evidence_rejects_zero_max_jobs ... ok test rebuild_evidence_scope_empty ... ok test rebuild_evidence_partial_failure_resume ... ok test rebuild_evidence_session_not_found ... ok test rebuild_evidence_state_transition_blocked_rerun_resumes_open_step ... ok test rebuild_evidence_exit_statuses ... ok test rebuild_evidence_restores_post_execution_state_when_prior_task_review_dispatch_missing ... ok test rebuild_evidence_text_output_summary ... ok test rebuild_evidence_noop_and_partial_failures ... ok test rebuild_evidence_reuses_active_contract_for_serial_unit_review_receipts ... ok test rebuild_executor_no_output_summary ... ok test rebuild_evidence_verify_command_failed_rerun_resumes_open_step ... ok test rebuild_evidence_text_failure_output ... ok test rebuild_executor_reopens_and_recompletes ... ok test rebuild_state_transition_retry_rehydrates_verify_command ... ok test rebuild_evidence_restores_authoritative_late_gate_truth_after_successful_rebuild ... ok test rebuild_target_state_transition_blocked ... ok test rebuild_target_race_detected ... ok test rebuild_target_race_retries_and_rehydrates_verify_command ... ok test result: ok. 48 passed; 0 failed; 0 ignored; 0 measured; 181 filtered out; finished in 6.15s
**Invalidation Reason:** N/A

### Task 1 Step 2
#### Attempt 1
**Status:** Invalidated
**Recorded At:** 2026-03-30T19:39:33.410978Z
**Execution Source:** featureforge:executing-plans
**Task Number:** 1
**Step Number:** 2
**Packet Fingerprint:** 539ca37b103ea58944a2347b7a370312d0e3c88d7cfbd4a8067c2b5ea1dbc862
**Head SHA:** 5527e0d7d94e617dc9d44b77194aa7f0a958b98d
**Base SHA:** 5527e0d7d94e617dc9d44b77194aa7f0a958b98d
**Claim:** Added rebuild-evidence CLI flags, max-jobs validation, and runtime dispatch wiring.
**Files Proven:**
- src/cli/plan_execution.rs | sha256:f8b4457b9ff9bd84064ba59d3a5483b92c71c539d16ea8509e3c71cc837a1d25
- src/lib.rs | sha256:75b052845775d8999b24ab0e83d6a8a175426019aed2515566dbc04740f5e22c
**Verify Command:** cargo test --test plan_execution rebuild_
**Verification Summary:** `cargo test --test plan_execution rebuild_` -> 6 rebuild-focused tests passed
**Invalidation Reason:** Evidence rebuild: packet_fingerprint_mismatch

#### Attempt 2
**Status:** Invalidated
**Recorded At:** 2026-03-31T01:51:37.496825Z
**Execution Source:** featureforge:executing-plans
**Task Number:** 1
**Step Number:** 2
**Packet Fingerprint:** 2be11ae78d78e54e22697fa53fbcd580a2a248d25e1e41dbf4854e7c361ed9a6
**Head SHA:** 5527e0d7d94e617dc9d44b77194aa7f0a958b98d
**Base SHA:** 5527e0d7d94e617dc9d44b77194aa7f0a958b98d
**Claim:** Added rebuild-evidence CLI flags, max-jobs validation, and runtime dispatch wiring.
**Files Proven:**
- src/cli/plan_execution.rs | sha256:f8b4457b9ff9bd84064ba59d3a5483b92c71c539d16ea8509e3c71cc837a1d25
- src/lib.rs | sha256:b19fa24d1ec5ef880a8d30ad4f807296b04b6d71889443607014fb213f9cb567
**Verify Command:** cargo test --test plan_execution rebuild_
**Verification Summary:** `cargo test --test plan_execution rebuild_` -> passed: running 30 tests test rebuild_candidate_discovery_plan_fingerprint_drift ... ok test rebuild_candidate_filtering ... ok test rebuild_candidate_discovery_source_spec_fingerprint_drift ... ok test rebuild_candidate_discovery_unreadable_artifact ... ok test rebuild_evidence_command_shape ... ok test rebuild_candidate_discovery_stale_targets ... ok test rebuild_evidence_invalid_scope ... ok test rebuild_evidence_json_output_fields ... ok test rebuild_evidence_dry_run_is_noop ... ok test rebuild_evidence_rejects_parallel_max_jobs ... ok test rebuild_evidence_rejects_zero_max_jobs ... ok test rebuild_evidence_manual_required_default ... ok test rebuild_evidence_manual_required_rerun_resumes_open_step ... ok test rebuild_evidence_legacy_summary_command_replays ... ok test rebuild_evidence_scope_empty ... ok test rebuild_evidence_json_schema ... ok test rebuild_evidence_session_not_found ... ok test rebuild_evidence_text_output_summary ... ok test rebuild_evidence_state_transition_blocked_rerun_resumes_open_step ... ok test rebuild_executor_no_output_summary ... ok test rebuild_executor_reopens_and_recompletes ... ok test rebuild_evidence_verify_command_failed_rerun_resumes_open_step ... ok test rebuild_state_transition_retry_rehydrates_verify_command ... ok test rebuild_evidence_text_failure_output ... ok test rebuild_target_race_detected ... ok test rebuild_target_state_transition_blocked ... ok test rebuild_target_race_retries_and_rehydrates_verify_command ... ok test rebuild_evidence_partial_failure_resume ... ok test rebuild_evidence_exit_statuses ... ok test rebuild_evidence_noop_and_partial_failures ... ok test result: ok. 30 passed; 0 failed; 0 ignored; 0 measured; 167 filtered out; finished in 4.38s
**Invalidation Reason:** Evidence rebuild: files_proven_drifted

#### Attempt 3
**Status:** Invalidated
**Recorded At:** 2026-03-31T18:05:09.378835Z
**Execution Source:** featureforge:executing-plans
**Task Number:** 1
**Step Number:** 2
**Packet Fingerprint:** 2be11ae78d78e54e22697fa53fbcd580a2a248d25e1e41dbf4854e7c361ed9a6
**Head SHA:** 3a6a1610f1d611a85cc50964438053167b832265
**Base SHA:** 3a6a1610f1d611a85cc50964438053167b832265
**Claim:** Added rebuild-evidence CLI flags, max-jobs validation, and runtime dispatch wiring.
**Files Proven:**
- src/cli/plan_execution.rs | sha256:42d7da85cd564afa98362e9563eb60cde71c257e3c7243542758ee5b082ab9b9
- src/lib.rs | sha256:43736c7d1dcc234aaa1413b458f37b9791642d27cbf15971fc73691747c9295a
**Verify Command:** cargo test --test plan_execution rebuild_
**Verification Summary:** `cargo test --test plan_execution rebuild_` -> passed: running 35 tests test rebuild_evidence_command_shape ... ok test rebuild_candidate_discovery_source_spec_fingerprint_drift ... ok test rebuild_candidate_discovery_unreadable_artifact ... ok test rebuild_candidate_discovery_stale_targets ... ok test rebuild_candidate_discovery_plan_fingerprint_drift ... ok test rebuild_candidate_filtering ... ok test rebuild_evidence_dry_run_is_noop ... ok test rebuild_evidence_does_not_publish_contract_bound_receipts_without_active_contract ... ok test rebuild_evidence_invalid_scope ... ok test rebuild_evidence_clears_later_interrupted_step_before_reopening_earlier_target ... ok test rebuild_evidence_manual_required_default ... ok test rebuild_evidence_json_output_fields ... ok test rebuild_evidence_legacy_summary_command_replays ... ok test rebuild_evidence_manual_required_rerun_resumes_open_step ... ok test rebuild_evidence_json_schema ... ok test rebuild_evidence_rejects_parallel_max_jobs ... ok test rebuild_evidence_session_not_found ... ok test rebuild_evidence_rejects_zero_max_jobs ... ok test rebuild_evidence_scope_empty ... ok test rebuild_evidence_refreshes_prior_task_closure_receipts_across_tasks ... ok test rebuild_evidence_text_output_summary ... ok test rebuild_evidence_reuses_active_contract_for_serial_unit_review_receipts ... ok test rebuild_evidence_verify_command_failed_rerun_resumes_open_step ... ok test rebuild_evidence_state_transition_blocked_rerun_resumes_open_step ... ok test rebuild_evidence_refreshes_preflight_acceptance_before_task_boundary_receipt_recovery ... ok test rebuild_evidence_text_failure_output ... ok test rebuild_executor_no_output_summary ... ok test rebuild_executor_reopens_and_recompletes ... ok test rebuild_state_transition_retry_rehydrates_verify_command ... ok test rebuild_target_state_transition_blocked ... ok test rebuild_target_race_detected ... ok test rebuild_target_race_retries_and_rehydrates_verify_command ... ok test rebuild_evidence_partial_failure_resume ... ok test rebuild_evidence_exit_statuses ... ok test rebuild_evidence_noop_and_partial_failures ... ok test result: ok. 35 passed; 0 failed; 0 ignored; 0 measured; 171 filtered out; finished in 4.04s
**Invalidation Reason:** Evidence rebuild: source_spec_fingerprint_mismatch

#### Attempt 4
**Status:** Invalidated
**Recorded At:** 2026-04-01T06:02:33.192327Z
**Execution Source:** featureforge:executing-plans
**Task Number:** 1
**Step Number:** 2
**Packet Fingerprint:** 943d73db31be8b5690f8b3cfebf814b92897c69801c207bcba37d94b33e03ce1
**Head SHA:** 2f97045889529eeb7d7214a0500963d34e9cf47d
**Base SHA:** 2f97045889529eeb7d7214a0500963d34e9cf47d
**Claim:** Added rebuild-evidence CLI flags, max-jobs validation, and runtime dispatch wiring.
**Files Proven:**
- src/cli/plan_execution.rs | sha256:3fb495a7b72f4d30bffa8d6fb1f5cbabcd289fe097333cb3458eb62484172a0d
- src/lib.rs | sha256:054ecf4acaf515b60d966d38d95724c9cf40c445f1f7ba6c7a4465800a2d8317
**Verify Command:** cargo test --test plan_execution rebuild_
**Verification Summary:** `cargo test --test plan_execution rebuild_` -> passed: running 41 tests test rebuild_candidate_discovery_plan_fingerprint_drift ... ok test rebuild_evidence_command_shape ... ok test rebuild_candidate_discovery_source_spec_fingerprint_drift ... ok test rebuild_candidate_discovery_unreadable_artifact ... ok test rebuild_candidate_filtering ... ok test rebuild_candidate_discovery_stale_targets ... ok test rebuild_evidence_dry_run_is_noop ... ok test rebuild_evidence_continue_on_error_clears_failed_earlier_interrupted_target ... ok test rebuild_evidence_does_not_publish_contract_bound_receipts_without_active_contract ... ok test rebuild_evidence_invalid_scope ... ok test rebuild_evidence_clears_later_interrupted_step_before_reopening_earlier_target ... ok test rebuild_evidence_legacy_summary_command_replays ... ok test rebuild_evidence_json_output_fields ... ok test rebuild_evidence_json_schema ... ok test rebuild_evidence_manual_required_default ... ok test rebuild_evidence_manual_required_rerun_resumes_open_step ... ok test rebuild_evidence_manual_required_does_not_block_later_command_targets ... ok test rebuild_evidence_keeps_missing_prior_task_review_dispatch_blocked ... ok test rebuild_evidence_noop_refreshes_receipt_only_strategy_checkpoint_drift ... ok test rebuild_evidence_rejects_parallel_max_jobs ... ok test rebuild_evidence_rejects_zero_max_jobs ... ok test rebuild_evidence_session_not_found ... ok test rebuild_evidence_scope_empty ... ok test rebuild_evidence_refreshes_prior_task_closure_receipts_across_tasks ... ok test rebuild_evidence_refreshes_preflight_acceptance_before_task_boundary_receipt_recovery ... ok test rebuild_evidence_refreshes_malformed_prior_task_review_receipt_before_task_boundary_retry ... ok test rebuild_evidence_refreshes_non_independent_prior_task_review_receipt_before_task_boundary_retry ... ok test rebuild_evidence_reuses_active_contract_for_serial_unit_review_receipts ... ok test rebuild_evidence_state_transition_blocked_rerun_resumes_open_step ... ok test rebuild_evidence_text_output_summary ... ok test rebuild_evidence_verify_command_failed_rerun_resumes_open_step ... ok test rebuild_executor_no_output_summary ... ok test rebuild_executor_reopens_and_recompletes ... ok test rebuild_evidence_text_failure_output ... ok test rebuild_evidence_partial_failure_resume ... ok test rebuild_state_transition_retry_rehydrates_verify_command ... ok test rebuild_target_race_detected ... ok test rebuild_target_race_retries_and_rehydrates_verify_command ... ok test rebuild_target_state_transition_blocked ... ok test rebuild_evidence_noop_and_partial_failures ... ok test rebuild_evidence_exit_statuses ... ok test result: ok. 41 passed; 0 failed; 0 ignored; 0 measured; 180 filtered out; finished in 8.83s
**Invalidation Reason:** Evidence rebuild: plan_fingerprint_mismatch

#### Attempt 5
**Status:** Completed
**Recorded At:** 2026-04-01T06:02:39.539764Z
**Execution Source:** featureforge:executing-plans
**Task Number:** 1
**Step Number:** 2
**Packet Fingerprint:** 995ee48dea899c7e92d35513534d4fbfb816a9adda660090074a1aa4d961e7c7
**Head SHA:** 3cb97e9af57fb687bc8b01d3be18664e28101118
**Base SHA:** 3cb97e9af57fb687bc8b01d3be18664e28101118
**Claim:** Added rebuild-evidence CLI flags, max-jobs validation, and runtime dispatch wiring.
**Files Proven:**
- src/cli/plan_execution.rs | sha256:3fb495a7b72f4d30bffa8d6fb1f5cbabcd289fe097333cb3458eb62484172a0d
- src/lib.rs | sha256:054ecf4acaf515b60d966d38d95724c9cf40c445f1f7ba6c7a4465800a2d8317
**Verify Command:** cargo test --test plan_execution rebuild_
**Verification Summary:** `cargo test --test plan_execution rebuild_` -> passed: running 48 tests test rebuild_candidate_discovery_plan_fingerprint_drift ... ok test rebuild_candidate_discovery_source_spec_fingerprint_drift ... ok test rebuild_candidate_discovery_unreadable_artifact ... ok test rebuild_evidence_command_shape ... ok test rebuild_candidate_filtering ... ok test rebuild_candidate_discovery_stale_targets ... ok test rebuild_evidence_continue_on_error_clears_failed_earlier_interrupted_target ... ok test rebuild_evidence_dry_run_is_noop ... ok test rebuild_evidence_does_not_publish_contract_bound_receipts_without_active_contract ... ok test rebuild_evidence_invalid_scope ... ok test rebuild_evidence_clears_later_interrupted_step_before_reopening_earlier_target ... ok test rebuild_evidence_manual_required_default ... ok test rebuild_evidence_json_output_fields ... ok test rebuild_evidence_legacy_summary_command_replays ... ok test rebuild_evidence_json_schema ... ok test rebuild_evidence_manual_required_does_not_block_later_command_targets ... ok test rebuild_evidence_manual_required_rerun_resumes_open_step ... ok test rebuild_evidence_noop_allows_intermediate_test_plan_only_state ... ok test rebuild_evidence_noop_refreshes_receipt_only_strategy_checkpoint_drift ... ok test rebuild_evidence_manual_required_keeps_downstream_truth_stale_until_repaired ... ok test rebuild_evidence_noop_refreshes_final_review_without_requiring_release_readiness ... ok test rebuild_evidence_refreshes_malformed_prior_task_review_receipt_before_task_boundary_retry ... ok test rebuild_evidence_noop_rebinds_late_gate_artifacts_after_rebase_only_head_drift ... ok test rebuild_evidence_refreshes_prior_task_closure_receipts_across_tasks ... ok test rebuild_evidence_noop_rebinds_late_gate_artifacts_after_replayed_rebase_changes ... ok test rebuild_evidence_noop_restores_authoritative_late_gate_truth ... ok test rebuild_evidence_refreshes_preflight_acceptance_before_task_boundary_receipt_recovery ... ok test rebuild_evidence_rejects_parallel_max_jobs ... ok test rebuild_evidence_refreshes_non_independent_prior_task_review_receipt_before_task_boundary_retry ... ok test rebuild_evidence_rejects_zero_max_jobs ... ok test rebuild_evidence_partial_failure_resume ... ok test rebuild_evidence_session_not_found ... ok test rebuild_evidence_scope_empty ... ok test rebuild_evidence_state_transition_blocked_rerun_resumes_open_step ... ok test rebuild_evidence_exit_statuses ... ok test rebuild_evidence_text_output_summary ... ok test rebuild_executor_no_output_summary ... ok test rebuild_evidence_noop_and_partial_failures ... ok test rebuild_evidence_restores_post_execution_state_when_prior_task_review_dispatch_missing ... ok test rebuild_evidence_verify_command_failed_rerun_resumes_open_step ... ok test rebuild_evidence_reuses_active_contract_for_serial_unit_review_receipts ... ok test rebuild_evidence_text_failure_output ... ok test rebuild_executor_reopens_and_recompletes ... ok test rebuild_evidence_restores_authoritative_late_gate_truth_after_successful_rebuild ... ok test rebuild_state_transition_retry_rehydrates_verify_command ... ok test rebuild_target_race_detected ... ok test rebuild_target_state_transition_blocked ... ok test rebuild_target_race_retries_and_rehydrates_verify_command ... ok test result: ok. 48 passed; 0 failed; 0 ignored; 0 measured; 181 filtered out; finished in 5.78s
**Invalidation Reason:** N/A

### Task 1 Step 3
#### Attempt 1
**Status:** Invalidated
**Recorded At:** 2026-03-30T19:39:38.308126Z
**Execution Source:** featureforge:executing-plans
**Task Number:** 1
**Step Number:** 3
**Packet Fingerprint:** 321afff7a18c4e4a2b50ec9a5a951ed539ea8704fb825894ee5770fcead72e28
**Head SHA:** 5527e0d7d94e617dc9d44b77194aa7f0a958b98d
**Base SHA:** 5527e0d7d94e617dc9d44b77194aa7f0a958b98d
**Claim:** Implemented the no-mutation dry-run path and structured dry-run output for rebuild-evidence.
**Files Proven:**
- src/execution/mutate.rs | sha256:aa0589d4f599e114cf871d218ea09494fda9153c2937b3c6cec004b7028874b3
- src/execution/state.rs | sha256:23ed1703587e382e9c5d6c138b4091eb9201e0c432e970e2d6cfb659479c7419
**Verify Command:** cargo test --test plan_execution rebuild_
**Verification Summary:** `cargo test --test plan_execution rebuild_` -> 6 rebuild-focused tests passed
**Invalidation Reason:** Evidence rebuild: packet_fingerprint_mismatch

#### Attempt 2
**Status:** Invalidated
**Recorded At:** 2026-03-31T18:05:19.878357Z
**Execution Source:** featureforge:executing-plans
**Task Number:** 1
**Step Number:** 3
**Packet Fingerprint:** fa7386af4fdf6a54b0384493691b82392faeee04b76b3ec681c7721d203ab361
**Head SHA:** 5527e0d7d94e617dc9d44b77194aa7f0a958b98d
**Base SHA:** 5527e0d7d94e617dc9d44b77194aa7f0a958b98d
**Claim:** Implemented the no-mutation dry-run path and structured dry-run output for rebuild-evidence.
**Files Proven:**
- src/execution/mutate.rs | sha256:12521ded0ac4b5249de119e65bfc3b0f71aad5758dede82aa0e662f406a4c6cf
- src/execution/state.rs | sha256:b88d17aadff261f4bb3c478a552753c214d707adfad86302d15ebe9f5eb914c7
**Verify Command:** cargo test --test plan_execution rebuild_
**Verification Summary:** `cargo test --test plan_execution rebuild_` -> passed: running 30 tests test rebuild_candidate_discovery_plan_fingerprint_drift ... ok test rebuild_candidate_discovery_stale_targets ... ok test rebuild_evidence_command_shape ... ok test rebuild_candidate_discovery_source_spec_fingerprint_drift ... ok test rebuild_candidate_discovery_unreadable_artifact ... ok test rebuild_candidate_filtering ... ok test rebuild_evidence_invalid_scope ... ok test rebuild_evidence_json_output_fields ... ok test rebuild_evidence_dry_run_is_noop ... ok test rebuild_evidence_rejects_parallel_max_jobs ... ok test rebuild_evidence_rejects_zero_max_jobs ... ok test rebuild_evidence_manual_required_default ... ok test rebuild_evidence_json_schema ... ok test rebuild_evidence_manual_required_rerun_resumes_open_step ... ok test rebuild_evidence_scope_empty ... ok test rebuild_evidence_legacy_summary_command_replays ... ok test rebuild_evidence_session_not_found ... ok test rebuild_evidence_text_output_summary ... ok test rebuild_executor_no_output_summary ... ok test rebuild_executor_reopens_and_recompletes ... ok test rebuild_evidence_state_transition_blocked_rerun_resumes_open_step ... ok test rebuild_evidence_verify_command_failed_rerun_resumes_open_step ... ok test rebuild_state_transition_retry_rehydrates_verify_command ... ok test rebuild_evidence_text_failure_output ... ok test rebuild_target_race_detected ... ok test rebuild_target_state_transition_blocked ... ok test rebuild_target_race_retries_and_rehydrates_verify_command ... ok test rebuild_evidence_partial_failure_resume ... ok test rebuild_evidence_exit_statuses ... ok test rebuild_evidence_noop_and_partial_failures ... ok test result: ok. 30 passed; 0 failed; 0 ignored; 0 measured; 167 filtered out; finished in 4.43s
**Invalidation Reason:** Evidence rebuild: source_spec_fingerprint_mismatch

#### Attempt 3
**Status:** Invalidated
**Recorded At:** 2026-04-01T06:02:39.831725Z
**Execution Source:** featureforge:executing-plans
**Task Number:** 1
**Step Number:** 3
**Packet Fingerprint:** 8b75e6a0eab80d142cc38dd88af36c92f938a1f382723a9045e1bc0f3974038c
**Head SHA:** 2f97045889529eeb7d7214a0500963d34e9cf47d
**Base SHA:** 2f97045889529eeb7d7214a0500963d34e9cf47d
**Claim:** Implemented the no-mutation dry-run path and structured dry-run output for rebuild-evidence.
**Files Proven:**
- src/execution/mutate.rs | sha256:bcc0e28d2766a823f2dd4e058999a2d3f9539e1515434c520c38b25b7db2a051
- src/execution/state.rs | sha256:a5286e2720b77da5888f2964d86f69f798f714db130e9df07e297fa13073b3e8
**Verify Command:** cargo test --test plan_execution rebuild_
**Verification Summary:** `cargo test --test plan_execution rebuild_` -> passed: running 41 tests test rebuild_candidate_discovery_unreadable_artifact ... ok test rebuild_candidate_filtering ... ok test rebuild_candidate_discovery_stale_targets ... ok test rebuild_evidence_command_shape ... ok test rebuild_candidate_discovery_plan_fingerprint_drift ... ok test rebuild_candidate_discovery_source_spec_fingerprint_drift ... ok test rebuild_evidence_dry_run_is_noop ... ok test rebuild_evidence_continue_on_error_clears_failed_earlier_interrupted_target ... ok test rebuild_evidence_does_not_publish_contract_bound_receipts_without_active_contract ... ok test rebuild_evidence_invalid_scope ... ok test rebuild_evidence_clears_later_interrupted_step_before_reopening_earlier_target ... ok test rebuild_evidence_json_output_fields ... ok test rebuild_evidence_legacy_summary_command_replays ... ok test rebuild_evidence_json_schema ... ok test rebuild_evidence_manual_required_default ... ok test rebuild_evidence_manual_required_rerun_resumes_open_step ... ok test rebuild_evidence_manual_required_does_not_block_later_command_targets ... ok test rebuild_evidence_keeps_missing_prior_task_review_dispatch_blocked ... ok test rebuild_evidence_noop_refreshes_receipt_only_strategy_checkpoint_drift ... ok test rebuild_evidence_rejects_parallel_max_jobs ... ok test rebuild_evidence_rejects_zero_max_jobs ... ok test rebuild_evidence_scope_empty ... ok test rebuild_evidence_session_not_found ... ok test rebuild_evidence_refreshes_prior_task_closure_receipts_across_tasks ... ok test rebuild_evidence_refreshes_preflight_acceptance_before_task_boundary_receipt_recovery ... ok test rebuild_evidence_refreshes_malformed_prior_task_review_receipt_before_task_boundary_retry ... ok test rebuild_evidence_refreshes_non_independent_prior_task_review_receipt_before_task_boundary_retry ... ok test rebuild_evidence_reuses_active_contract_for_serial_unit_review_receipts ... ok test rebuild_evidence_state_transition_blocked_rerun_resumes_open_step ... ok test rebuild_evidence_text_output_summary ... ok test rebuild_executor_no_output_summary ... ok test rebuild_executor_reopens_and_recompletes ... ok test rebuild_evidence_verify_command_failed_rerun_resumes_open_step ... ok test rebuild_evidence_text_failure_output ... ok test rebuild_evidence_partial_failure_resume ... ok test rebuild_state_transition_retry_rehydrates_verify_command ... ok test rebuild_target_race_detected ... ok test rebuild_target_race_retries_and_rehydrates_verify_command ... ok test rebuild_target_state_transition_blocked ... ok test rebuild_evidence_noop_and_partial_failures ... ok test rebuild_evidence_exit_statuses ... ok test result: ok. 41 passed; 0 failed; 0 ignored; 0 measured; 180 filtered out; finished in 10.41s
**Invalidation Reason:** Evidence rebuild: plan_fingerprint_mismatch

#### Attempt 4
**Status:** Completed
**Recorded At:** 2026-04-01T06:02:46.265546Z
**Execution Source:** featureforge:executing-plans
**Task Number:** 1
**Step Number:** 3
**Packet Fingerprint:** 900ed545b1365b0267cd4d6ce87b8713d9dc3da3288a4482910a189587953fdd
**Head SHA:** 3cb97e9af57fb687bc8b01d3be18664e28101118
**Base SHA:** 3cb97e9af57fb687bc8b01d3be18664e28101118
**Claim:** Implemented the no-mutation dry-run path and structured dry-run output for rebuild-evidence.
**Files Proven:**
- src/execution/mutate.rs | sha256:41a1c51647a67eb2deac38823562f6345bff4e3040a2cc9a8eec47e75561d650
- src/execution/state.rs | sha256:13a15d5260cb5e748143fc1ca617c56ec81a0ebf64d9cfb10b23aebeac3dc8c6
**Verify Command:** cargo test --test plan_execution rebuild_
**Verification Summary:** `cargo test --test plan_execution rebuild_` -> passed: running 48 tests test rebuild_candidate_discovery_plan_fingerprint_drift ... ok test rebuild_candidate_discovery_source_spec_fingerprint_drift ... ok test rebuild_candidate_filtering ... ok test rebuild_candidate_discovery_unreadable_artifact ... ok test rebuild_candidate_discovery_stale_targets ... ok test rebuild_evidence_command_shape ... ok test rebuild_evidence_continue_on_error_clears_failed_earlier_interrupted_target ... ok test rebuild_evidence_dry_run_is_noop ... ok test rebuild_evidence_does_not_publish_contract_bound_receipts_without_active_contract ... ok test rebuild_evidence_invalid_scope ... ok test rebuild_evidence_clears_later_interrupted_step_before_reopening_earlier_target ... ok test rebuild_evidence_manual_required_default ... ok test rebuild_evidence_json_output_fields ... ok test rebuild_evidence_legacy_summary_command_replays ... ok test rebuild_evidence_json_schema ... ok test rebuild_evidence_manual_required_does_not_block_later_command_targets ... ok test rebuild_evidence_manual_required_rerun_resumes_open_step ... ok test rebuild_evidence_noop_allows_intermediate_test_plan_only_state ... ok test rebuild_evidence_noop_refreshes_receipt_only_strategy_checkpoint_drift ... ok test rebuild_evidence_manual_required_keeps_downstream_truth_stale_until_repaired ... ok test rebuild_evidence_noop_refreshes_final_review_without_requiring_release_readiness ... ok test rebuild_evidence_refreshes_malformed_prior_task_review_receipt_before_task_boundary_retry ... ok test rebuild_evidence_noop_rebinds_late_gate_artifacts_after_rebase_only_head_drift ... ok test rebuild_evidence_refreshes_prior_task_closure_receipts_across_tasks ... ok test rebuild_evidence_noop_rebinds_late_gate_artifacts_after_replayed_rebase_changes ... ok test rebuild_evidence_noop_restores_authoritative_late_gate_truth ... ok test rebuild_evidence_refreshes_preflight_acceptance_before_task_boundary_receipt_recovery ... ok test rebuild_evidence_rejects_parallel_max_jobs ... ok test rebuild_evidence_refreshes_non_independent_prior_task_review_receipt_before_task_boundary_retry ... ok test rebuild_evidence_rejects_zero_max_jobs ... ok test rebuild_evidence_partial_failure_resume ... ok test rebuild_evidence_session_not_found ... ok test rebuild_evidence_scope_empty ... ok test rebuild_evidence_state_transition_blocked_rerun_resumes_open_step ... ok test rebuild_evidence_exit_statuses ... ok test rebuild_evidence_restores_post_execution_state_when_prior_task_review_dispatch_missing ... ok test rebuild_evidence_text_output_summary ... ok test rebuild_evidence_noop_and_partial_failures ... ok test rebuild_executor_no_output_summary ... ok test rebuild_evidence_reuses_active_contract_for_serial_unit_review_receipts ... ok test rebuild_evidence_verify_command_failed_rerun_resumes_open_step ... ok test rebuild_evidence_text_failure_output ... ok test rebuild_executor_reopens_and_recompletes ... ok test rebuild_state_transition_retry_rehydrates_verify_command ... ok test rebuild_target_state_transition_blocked ... ok test rebuild_target_race_detected ... ok test rebuild_target_race_retries_and_rehydrates_verify_command ... ok test rebuild_evidence_restores_authoritative_late_gate_truth_after_successful_rebuild ... ok test result: ok. 48 passed; 0 failed; 0 ignored; 0 measured; 181 filtered out; finished in 5.84s
**Invalidation Reason:** N/A

### Task 1 Step 4
#### Attempt 1
**Status:** Invalidated
**Recorded At:** 2026-03-30T13:35:29.474176Z
**Execution Source:** featureforge:executing-plans
**Task Number:** 1
**Step Number:** 4
**Packet Fingerprint:** 72bbd49f6e1b07ba6623e16410246f4a021396c7d26f65a838f967c210a32d9e
**Head SHA:** 5527e0d7d94e617dc9d44b77194aa7f0a958b98d
**Base SHA:** 5527e0d7d94e617dc9d44b77194aa7f0a958b98d
**Claim:** Added invalid-scope guard coverage and early scope_no_matches failure handling.
**Files Proven:**
- src/execution/state.rs | sha256:23ed1703587e382e9c5d6c138b4091eb9201e0c432e970e2d6cfb659479c7419
- tests/plan_execution.rs | sha256:ac367ab590968cdb46124755448141d73f16546701b05c3997437790576ed42f
**Verify Command:** cargo test --test plan_execution rebuild_
**Verification Summary:** `cargo test --test plan_execution rebuild_` -> 6 rebuild-focused tests passed
**Invalidation Reason:** Task review found Task 1 precondition mismatches: missing session_not_found and scope_empty enforcement.

#### Attempt 2
**Status:** Invalidated
**Recorded At:** 2026-03-30T19:39:43.180346Z
**Execution Source:** featureforge:executing-plans
**Task Number:** 1
**Step Number:** 4
**Packet Fingerprint:** 72bbd49f6e1b07ba6623e16410246f4a021396c7d26f65a838f967c210a32d9e
**Head SHA:** 5527e0d7d94e617dc9d44b77194aa7f0a958b98d
**Base SHA:** 5527e0d7d94e617dc9d44b77194aa7f0a958b98d
**Claim:** Fixed Task 1 precondition handling so rebuild-evidence distinguishes session_not_found, scope_no_matches, and scope_empty, and added the matching regression tests.
**Files Proven:**
- src/execution/mutate.rs | sha256:999fd930f2b5cce6a25e8d099d3e3b8699505483b06470bff67306f82b631454
- tests/plan_execution.rs | sha256:bfd69ce643ab0c2c6dd932d93620be41574eb127ff09803a0ded969db1a9ee52
**Verify Command:** cargo test --test plan_execution rebuild_
**Verification Summary:** `cargo test --test plan_execution rebuild_` -> 9 rebuild-focused tests passed
**Invalidation Reason:** Evidence rebuild: packet_fingerprint_mismatch

#### Attempt 3
**Status:** Invalidated
**Recorded At:** 2026-03-31T18:05:31.702084Z
**Execution Source:** featureforge:executing-plans
**Task Number:** 1
**Step Number:** 4
**Packet Fingerprint:** cdfa7f4c394d0e2101f57762db9436e1acc9136aa490b20c8fb4ffa58e80d567
**Head SHA:** 5527e0d7d94e617dc9d44b77194aa7f0a958b98d
**Base SHA:** 5527e0d7d94e617dc9d44b77194aa7f0a958b98d
**Claim:** Fixed Task 1 precondition handling so rebuild-evidence distinguishes session_not_found, scope_no_matches, and scope_empty, and added the matching regression tests.
**Files Proven:**
- src/execution/mutate.rs | sha256:12521ded0ac4b5249de119e65bfc3b0f71aad5758dede82aa0e662f406a4c6cf
- tests/plan_execution.rs | sha256:b9753e1ef63075d58f02c382eeaeb0c0b3778eddcdc6da165dbb405116df0fce
**Verify Command:** cargo test --test plan_execution rebuild_
**Verification Summary:** `cargo test --test plan_execution rebuild_` -> passed: running 30 tests test rebuild_evidence_invalid_scope ... ok test rebuild_candidate_filtering ... ok test rebuild_candidate_discovery_stale_targets ... ok test rebuild_evidence_command_shape ... ok test rebuild_candidate_discovery_source_spec_fingerprint_drift ... ok test rebuild_candidate_discovery_unreadable_artifact ... ok test rebuild_candidate_discovery_plan_fingerprint_drift ... ok test rebuild_evidence_json_output_fields ... ok test rebuild_evidence_dry_run_is_noop ... ok test rebuild_evidence_rejects_parallel_max_jobs ... ok test rebuild_evidence_rejects_zero_max_jobs ... ok test rebuild_evidence_manual_required_default ... ok test rebuild_evidence_json_schema ... ok test rebuild_evidence_manual_required_rerun_resumes_open_step ... ok test rebuild_evidence_legacy_summary_command_replays ... ok test rebuild_evidence_scope_empty ... ok test rebuild_evidence_session_not_found ... ok test rebuild_evidence_text_output_summary ... ok test rebuild_executor_no_output_summary ... ok test rebuild_executor_reopens_and_recompletes ... ok test rebuild_evidence_verify_command_failed_rerun_resumes_open_step ... ok test rebuild_evidence_state_transition_blocked_rerun_resumes_open_step ... ok test rebuild_state_transition_retry_rehydrates_verify_command ... ok test rebuild_evidence_text_failure_output ... ok test rebuild_target_race_detected ... ok test rebuild_target_state_transition_blocked ... ok test rebuild_target_race_retries_and_rehydrates_verify_command ... ok test rebuild_evidence_partial_failure_resume ... ok test rebuild_evidence_exit_statuses ... ok test rebuild_evidence_noop_and_partial_failures ... ok test result: ok. 30 passed; 0 failed; 0 ignored; 0 measured; 167 filtered out; finished in 4.69s
**Invalidation Reason:** Evidence rebuild: source_spec_fingerprint_mismatch

#### Attempt 4
**Status:** Invalidated
**Recorded At:** 2026-04-01T06:02:46.553777Z
**Execution Source:** featureforge:executing-plans
**Task Number:** 1
**Step Number:** 4
**Packet Fingerprint:** 2ed81ee7855fe62aa32d53211eeced0a1f383bdf45a3c7f830c01366fbf9ab9e
**Head SHA:** 2f97045889529eeb7d7214a0500963d34e9cf47d
**Base SHA:** 2f97045889529eeb7d7214a0500963d34e9cf47d
**Claim:** Fixed Task 1 precondition handling so rebuild-evidence distinguishes session_not_found, scope_no_matches, and scope_empty, and added the matching regression tests.
**Files Proven:**
- src/execution/mutate.rs | sha256:bcc0e28d2766a823f2dd4e058999a2d3f9539e1515434c520c38b25b7db2a051
- tests/plan_execution.rs | sha256:6cca045a452626783a0b40e47a3b66f64f23e84cd7286139521b52a7f9a9bb6d
**Verify Command:** cargo test --test plan_execution rebuild_
**Verification Summary:** `cargo test --test plan_execution rebuild_` -> passed: running 41 tests test rebuild_candidate_discovery_unreadable_artifact ... ok test rebuild_candidate_discovery_stale_targets ... ok test rebuild_evidence_command_shape ... ok test rebuild_candidate_discovery_source_spec_fingerprint_drift ... ok test rebuild_candidate_discovery_plan_fingerprint_drift ... ok test rebuild_candidate_filtering ... ok test rebuild_evidence_continue_on_error_clears_failed_earlier_interrupted_target ... ok test rebuild_evidence_dry_run_is_noop ... ok test rebuild_evidence_does_not_publish_contract_bound_receipts_without_active_contract ... ok test rebuild_evidence_invalid_scope ... ok test rebuild_evidence_clears_later_interrupted_step_before_reopening_earlier_target ... ok test rebuild_evidence_json_output_fields ... ok test rebuild_evidence_json_schema ... ok test rebuild_evidence_legacy_summary_command_replays ... ok test rebuild_evidence_manual_required_default ... ok test rebuild_evidence_manual_required_does_not_block_later_command_targets ... ok test rebuild_evidence_manual_required_rerun_resumes_open_step ... ok test rebuild_evidence_keeps_missing_prior_task_review_dispatch_blocked ... ok test rebuild_evidence_noop_refreshes_receipt_only_strategy_checkpoint_drift ... ok test rebuild_evidence_rejects_zero_max_jobs ... ok test rebuild_evidence_rejects_parallel_max_jobs ... ok test rebuild_evidence_session_not_found ... ok test rebuild_evidence_scope_empty ... ok test rebuild_evidence_refreshes_preflight_acceptance_before_task_boundary_receipt_recovery ... ok test rebuild_evidence_refreshes_prior_task_closure_receipts_across_tasks ... ok test rebuild_evidence_refreshes_malformed_prior_task_review_receipt_before_task_boundary_retry ... ok test rebuild_evidence_refreshes_non_independent_prior_task_review_receipt_before_task_boundary_retry ... ok test rebuild_evidence_reuses_active_contract_for_serial_unit_review_receipts ... ok test rebuild_evidence_state_transition_blocked_rerun_resumes_open_step ... ok test rebuild_evidence_text_output_summary ... ok test rebuild_executor_no_output_summary ... ok test rebuild_executor_reopens_and_recompletes ... ok test rebuild_evidence_verify_command_failed_rerun_resumes_open_step ... ok test rebuild_evidence_partial_failure_resume ... ok test rebuild_evidence_text_failure_output ... ok test rebuild_state_transition_retry_rehydrates_verify_command ... ok test rebuild_target_race_detected ... ok test rebuild_target_state_transition_blocked ... ok test rebuild_target_race_retries_and_rehydrates_verify_command ... ok test rebuild_evidence_noop_and_partial_failures ... ok test rebuild_evidence_exit_statuses ... ok test result: ok. 41 passed; 0 failed; 0 ignored; 0 measured; 180 filtered out; finished in 13.09s
**Invalidation Reason:** Evidence rebuild: plan_fingerprint_mismatch

#### Attempt 5
**Status:** Completed
**Recorded At:** 2026-04-01T06:02:53.757017Z
**Execution Source:** featureforge:executing-plans
**Task Number:** 1
**Step Number:** 4
**Packet Fingerprint:** 3bbaf774660df8863de859fbce7e249437e9572ba7a5fba0b5102ef60e1df6a5
**Head SHA:** 3cb97e9af57fb687bc8b01d3be18664e28101118
**Base SHA:** 3cb97e9af57fb687bc8b01d3be18664e28101118
**Claim:** Fixed Task 1 precondition handling so rebuild-evidence distinguishes session_not_found, scope_no_matches, and scope_empty, and added the matching regression tests.
**Files Proven:**
- src/execution/mutate.rs | sha256:41a1c51647a67eb2deac38823562f6345bff4e3040a2cc9a8eec47e75561d650
- tests/plan_execution.rs | sha256:cee706e9b3195e2468b78c09114b0752288fc66ce6af374795ed37047177f995
**Verify Command:** cargo test --test plan_execution rebuild_
**Verification Summary:** `cargo test --test plan_execution rebuild_` -> passed: running 48 tests test rebuild_candidate_filtering ... ok test rebuild_evidence_command_shape ... ok test rebuild_candidate_discovery_source_spec_fingerprint_drift ... ok test rebuild_candidate_discovery_unreadable_artifact ... ok test rebuild_candidate_discovery_plan_fingerprint_drift ... ok test rebuild_candidate_discovery_stale_targets ... ok test rebuild_evidence_continue_on_error_clears_failed_earlier_interrupted_target ... ok test rebuild_evidence_dry_run_is_noop ... ok test rebuild_evidence_does_not_publish_contract_bound_receipts_without_active_contract ... ok test rebuild_evidence_invalid_scope ... ok test rebuild_evidence_clears_later_interrupted_step_before_reopening_earlier_target ... ok test rebuild_evidence_manual_required_default ... ok test rebuild_evidence_legacy_summary_command_replays ... ok test rebuild_evidence_json_schema ... ok test rebuild_evidence_json_output_fields ... ok test rebuild_evidence_manual_required_does_not_block_later_command_targets ... ok test rebuild_evidence_manual_required_rerun_resumes_open_step ... ok test rebuild_evidence_noop_allows_intermediate_test_plan_only_state ... ok test rebuild_evidence_noop_refreshes_receipt_only_strategy_checkpoint_drift ... ok test rebuild_evidence_manual_required_keeps_downstream_truth_stale_until_repaired ... ok test rebuild_evidence_noop_refreshes_final_review_without_requiring_release_readiness ... ok test rebuild_evidence_refreshes_malformed_prior_task_review_receipt_before_task_boundary_retry ... ok test rebuild_evidence_noop_rebinds_late_gate_artifacts_after_rebase_only_head_drift ... ok test rebuild_evidence_refreshes_prior_task_closure_receipts_across_tasks ... ok test rebuild_evidence_noop_rebinds_late_gate_artifacts_after_replayed_rebase_changes ... ok test rebuild_evidence_noop_restores_authoritative_late_gate_truth ... ok test rebuild_evidence_refreshes_preflight_acceptance_before_task_boundary_receipt_recovery ... ok test rebuild_evidence_refreshes_non_independent_prior_task_review_receipt_before_task_boundary_retry ... ok test rebuild_evidence_rejects_zero_max_jobs ... ok test rebuild_evidence_rejects_parallel_max_jobs ... ok test rebuild_evidence_scope_empty ... ok test rebuild_evidence_partial_failure_resume ... ok test rebuild_evidence_session_not_found ... ok test rebuild_evidence_state_transition_blocked_rerun_resumes_open_step ... ok test rebuild_evidence_exit_statuses ... ok test rebuild_evidence_restores_post_execution_state_when_prior_task_review_dispatch_missing ... ok test rebuild_evidence_text_output_summary ... ok test rebuild_evidence_noop_and_partial_failures ... ok test rebuild_evidence_reuses_active_contract_for_serial_unit_review_receipts ... ok test rebuild_evidence_verify_command_failed_rerun_resumes_open_step ... ok test rebuild_executor_no_output_summary ... ok test rebuild_evidence_text_failure_output ... ok test rebuild_executor_reopens_and_recompletes ... ok test rebuild_state_transition_retry_rehydrates_verify_command ... ok test rebuild_target_race_detected ... ok test rebuild_target_state_transition_blocked ... ok test rebuild_evidence_restores_authoritative_late_gate_truth_after_successful_rebuild ... ok test rebuild_target_race_retries_and_rehydrates_verify_command ... ok test result: ok. 48 passed; 0 failed; 0 ignored; 0 measured; 181 filtered out; finished in 6.63s
**Invalidation Reason:** N/A

### Task 1 Step 5
#### Attempt 1
**Status:** Invalidated
**Recorded At:** 2026-03-30T13:39:05.645214Z
**Execution Source:** featureforge:executing-plans
**Task Number:** 1
**Step Number:** 5
**Packet Fingerprint:** b76ee1dcbaff7bd7fa6745f29815ac24fdfbb477ce4f3ee37649507cb8ae03f6
**Head SHA:** 5527e0d7d94e617dc9d44b77194aa7f0a958b98d
**Base SHA:** 5527e0d7d94e617dc9d44b77194aa7f0a958b98d
**Claim:** Ran the focused rebuild command-shape verification slice and confirmed the initial runtime-facing contract passes.
**Files Proven:**
- src/cli/plan_execution.rs | sha256:f8b4457b9ff9bd84064ba59d3a5483b92c71c539d16ea8509e3c71cc837a1d25
- src/lib.rs | sha256:75b052845775d8999b24ab0e83d6a8a175426019aed2515566dbc04740f5e22c
- tests/plan_execution.rs | sha256:ac367ab590968cdb46124755448141d73f16546701b05c3997437790576ed42f
**Verify Command:** cargo test --test plan_execution rebuild_
**Verification Summary:** `cargo test --test plan_execution rebuild_` -> 6 rebuild-focused tests passed
**Invalidation Reason:** Task 1 verification must be refreshed after the Step 4 review remediation changes.

#### Attempt 2
**Status:** Invalidated
**Recorded At:** 2026-03-30T19:39:48.349777Z
**Execution Source:** featureforge:executing-plans
**Task Number:** 1
**Step Number:** 5
**Packet Fingerprint:** b76ee1dcbaff7bd7fa6745f29815ac24fdfbb477ce4f3ee37649507cb8ae03f6
**Head SHA:** 5527e0d7d94e617dc9d44b77194aa7f0a958b98d
**Base SHA:** 5527e0d7d94e617dc9d44b77194aa7f0a958b98d
**Claim:** Re-ran the focused rebuild verification slice after review remediation and confirmed the updated Task 1 contract passes.
**Files Proven:**
- src/execution/mutate.rs | sha256:999fd930f2b5cce6a25e8d099d3e3b8699505483b06470bff67306f82b631454
- tests/plan_execution.rs | sha256:bfd69ce643ab0c2c6dd932d93620be41574eb127ff09803a0ded969db1a9ee52
**Verify Command:** cargo test --test plan_execution rebuild_
**Verification Summary:** `cargo test --test plan_execution rebuild_` -> 9 rebuild-focused tests passed
**Invalidation Reason:** Evidence rebuild: packet_fingerprint_mismatch

#### Attempt 3
**Status:** Invalidated
**Recorded At:** 2026-03-31T18:05:46.87302Z
**Execution Source:** featureforge:executing-plans
**Task Number:** 1
**Step Number:** 5
**Packet Fingerprint:** 1dc3232016266cd5c2951bb42b57211f6ffe12bbc358bd27e4fbf244c9309031
**Head SHA:** 5527e0d7d94e617dc9d44b77194aa7f0a958b98d
**Base SHA:** 5527e0d7d94e617dc9d44b77194aa7f0a958b98d
**Claim:** Re-ran the focused rebuild verification slice after review remediation and confirmed the updated Task 1 contract passes.
**Files Proven:**
- src/execution/mutate.rs | sha256:12521ded0ac4b5249de119e65bfc3b0f71aad5758dede82aa0e662f406a4c6cf
- tests/plan_execution.rs | sha256:b9753e1ef63075d58f02c382eeaeb0c0b3778eddcdc6da165dbb405116df0fce
**Verify Command:** cargo test --test plan_execution rebuild_
**Verification Summary:** `cargo test --test plan_execution rebuild_` -> passed: running 30 tests test rebuild_evidence_invalid_scope ... ok test rebuild_candidate_discovery_source_spec_fingerprint_drift ... ok test rebuild_candidate_discovery_stale_targets ... ok test rebuild_candidate_filtering ... ok test rebuild_candidate_discovery_unreadable_artifact ... ok test rebuild_evidence_command_shape ... ok test rebuild_candidate_discovery_plan_fingerprint_drift ... ok test rebuild_evidence_json_output_fields ... ok test rebuild_evidence_dry_run_is_noop ... ok test rebuild_evidence_rejects_parallel_max_jobs ... ok test rebuild_evidence_rejects_zero_max_jobs ... ok test rebuild_evidence_manual_required_default ... ok test rebuild_evidence_legacy_summary_command_replays ... ok test rebuild_evidence_json_schema ... ok test rebuild_evidence_manual_required_rerun_resumes_open_step ... ok test rebuild_evidence_scope_empty ... ok test rebuild_evidence_session_not_found ... ok test rebuild_evidence_text_output_summary ... ok test rebuild_executor_no_output_summary ... ok test rebuild_evidence_state_transition_blocked_rerun_resumes_open_step ... ok test rebuild_executor_reopens_and_recompletes ... ok test rebuild_evidence_verify_command_failed_rerun_resumes_open_step ... ok test rebuild_state_transition_retry_rehydrates_verify_command ... ok test rebuild_evidence_text_failure_output ... ok test rebuild_target_race_detected ... ok test rebuild_target_state_transition_blocked ... ok test rebuild_target_race_retries_and_rehydrates_verify_command ... ok test rebuild_evidence_partial_failure_resume ... ok test rebuild_evidence_exit_statuses ... ok test rebuild_evidence_noop_and_partial_failures ... ok test result: ok. 30 passed; 0 failed; 0 ignored; 0 measured; 167 filtered out; finished in 4.30s
**Invalidation Reason:** Evidence rebuild: source_spec_fingerprint_mismatch

#### Attempt 4
**Status:** Invalidated
**Recorded At:** 2026-04-01T06:02:54.041881Z
**Execution Source:** featureforge:executing-plans
**Task Number:** 1
**Step Number:** 5
**Packet Fingerprint:** b5e73bdf12f3c7fa5a99726cd5243c9b33f94a35f22a8eb0dbae26c492eac8c8
**Head SHA:** 2f97045889529eeb7d7214a0500963d34e9cf47d
**Base SHA:** 2f97045889529eeb7d7214a0500963d34e9cf47d
**Claim:** Re-ran the focused rebuild verification slice after review remediation and confirmed the updated Task 1 contract passes.
**Files Proven:**
- src/execution/mutate.rs | sha256:bcc0e28d2766a823f2dd4e058999a2d3f9539e1515434c520c38b25b7db2a051
- tests/plan_execution.rs | sha256:6cca045a452626783a0b40e47a3b66f64f23e84cd7286139521b52a7f9a9bb6d
**Verify Command:** cargo test --test plan_execution rebuild_
**Verification Summary:** `cargo test --test plan_execution rebuild_` -> passed: running 41 tests test rebuild_candidate_discovery_source_spec_fingerprint_drift ... ok test rebuild_evidence_command_shape ... ok test rebuild_candidate_filtering ... ok test rebuild_candidate_discovery_plan_fingerprint_drift ... ok test rebuild_candidate_discovery_unreadable_artifact ... ok test rebuild_candidate_discovery_stale_targets ... ok test rebuild_evidence_dry_run_is_noop ... ok test rebuild_evidence_continue_on_error_clears_failed_earlier_interrupted_target ... ok test rebuild_evidence_does_not_publish_contract_bound_receipts_without_active_contract ... ok test rebuild_evidence_invalid_scope ... ok test rebuild_evidence_clears_later_interrupted_step_before_reopening_earlier_target ... ok test rebuild_evidence_json_output_fields ... ok test rebuild_evidence_legacy_summary_command_replays ... ok test rebuild_evidence_json_schema ... ok test rebuild_evidence_manual_required_default ... ok test rebuild_evidence_manual_required_rerun_resumes_open_step ... ok test rebuild_evidence_manual_required_does_not_block_later_command_targets ... ok test rebuild_evidence_keeps_missing_prior_task_review_dispatch_blocked ... ok test rebuild_evidence_noop_refreshes_receipt_only_strategy_checkpoint_drift ... ok test rebuild_evidence_rejects_parallel_max_jobs ... ok test rebuild_evidence_rejects_zero_max_jobs ... ok test rebuild_evidence_scope_empty ... ok test rebuild_evidence_session_not_found ... ok test rebuild_evidence_refreshes_prior_task_closure_receipts_across_tasks ... ok test rebuild_evidence_refreshes_preflight_acceptance_before_task_boundary_receipt_recovery ... ok test rebuild_evidence_refreshes_malformed_prior_task_review_receipt_before_task_boundary_retry ... ok test rebuild_evidence_refreshes_non_independent_prior_task_review_receipt_before_task_boundary_retry ... ok test rebuild_evidence_reuses_active_contract_for_serial_unit_review_receipts ... ok test rebuild_evidence_state_transition_blocked_rerun_resumes_open_step ... ok test rebuild_evidence_text_output_summary ... ok test rebuild_evidence_verify_command_failed_rerun_resumes_open_step ... ok test rebuild_executor_no_output_summary ... ok test rebuild_executor_reopens_and_recompletes ... ok test rebuild_evidence_text_failure_output ... ok test rebuild_evidence_partial_failure_resume ... ok test rebuild_state_transition_retry_rehydrates_verify_command ... ok test rebuild_target_race_detected ... ok test rebuild_target_state_transition_blocked ... ok test rebuild_target_race_retries_and_rehydrates_verify_command ... ok test rebuild_evidence_exit_statuses ... ok test rebuild_evidence_noop_and_partial_failures ... ok test result: ok. 41 passed; 0 failed; 0 ignored; 0 measured; 180 filtered out; finished in 10.96s
**Invalidation Reason:** Evidence rebuild: plan_fingerprint_mismatch

#### Attempt 5
**Status:** Completed
**Recorded At:** 2026-04-01T06:03:00.482858Z
**Execution Source:** featureforge:executing-plans
**Task Number:** 1
**Step Number:** 5
**Packet Fingerprint:** 7fe997d9b5630939b94ae8244537f91f48c9d80ae3be909017863fe38bef88c8
**Head SHA:** 3cb97e9af57fb687bc8b01d3be18664e28101118
**Base SHA:** 3cb97e9af57fb687bc8b01d3be18664e28101118
**Claim:** Re-ran the focused rebuild verification slice after review remediation and confirmed the updated Task 1 contract passes.
**Files Proven:**
- src/execution/mutate.rs | sha256:41a1c51647a67eb2deac38823562f6345bff4e3040a2cc9a8eec47e75561d650
- tests/plan_execution.rs | sha256:cee706e9b3195e2468b78c09114b0752288fc66ce6af374795ed37047177f995
**Verify Command:** cargo test --test plan_execution rebuild_
**Verification Summary:** `cargo test --test plan_execution rebuild_` -> passed: running 48 tests test rebuild_candidate_discovery_stale_targets ... ok test rebuild_candidate_discovery_source_spec_fingerprint_drift ... ok test rebuild_candidate_filtering ... ok test rebuild_candidate_discovery_unreadable_artifact ... ok test rebuild_candidate_discovery_plan_fingerprint_drift ... ok test rebuild_evidence_command_shape ... ok test rebuild_evidence_continue_on_error_clears_failed_earlier_interrupted_target ... ok test rebuild_evidence_dry_run_is_noop ... ok test rebuild_evidence_does_not_publish_contract_bound_receipts_without_active_contract ... ok test rebuild_evidence_invalid_scope ... ok test rebuild_evidence_clears_later_interrupted_step_before_reopening_earlier_target ... ok test rebuild_evidence_manual_required_default ... ok test rebuild_evidence_json_schema ... ok test rebuild_evidence_legacy_summary_command_replays ... ok test rebuild_evidence_json_output_fields ... ok test rebuild_evidence_manual_required_rerun_resumes_open_step ... ok test rebuild_evidence_manual_required_does_not_block_later_command_targets ... ok test rebuild_evidence_noop_allows_intermediate_test_plan_only_state ... ok test rebuild_evidence_noop_refreshes_receipt_only_strategy_checkpoint_drift ... ok test rebuild_evidence_manual_required_keeps_downstream_truth_stale_until_repaired ... ok test rebuild_evidence_noop_refreshes_final_review_without_requiring_release_readiness ... ok test rebuild_evidence_refreshes_malformed_prior_task_review_receipt_before_task_boundary_retry ... ok test rebuild_evidence_noop_rebinds_late_gate_artifacts_after_rebase_only_head_drift ... ok test rebuild_evidence_refreshes_prior_task_closure_receipts_across_tasks ... ok test rebuild_evidence_noop_restores_authoritative_late_gate_truth ... ok test rebuild_evidence_noop_rebinds_late_gate_artifacts_after_replayed_rebase_changes ... ok test rebuild_evidence_refreshes_preflight_acceptance_before_task_boundary_receipt_recovery ... ok test rebuild_evidence_rejects_parallel_max_jobs ... ok test rebuild_evidence_refreshes_non_independent_prior_task_review_receipt_before_task_boundary_retry ... ok test rebuild_evidence_rejects_zero_max_jobs ... ok test rebuild_evidence_partial_failure_resume ... ok test rebuild_evidence_scope_empty ... ok test rebuild_evidence_session_not_found ... ok test rebuild_evidence_state_transition_blocked_rerun_resumes_open_step ... ok test rebuild_evidence_exit_statuses ... ok test rebuild_evidence_text_output_summary ... ok test rebuild_executor_no_output_summary ... ok test rebuild_evidence_noop_and_partial_failures ... ok test rebuild_evidence_restores_post_execution_state_when_prior_task_review_dispatch_missing ... ok test rebuild_evidence_verify_command_failed_rerun_resumes_open_step ... ok test rebuild_evidence_reuses_active_contract_for_serial_unit_review_receipts ... ok test rebuild_evidence_text_failure_output ... ok test rebuild_executor_reopens_and_recompletes ... ok test rebuild_state_transition_retry_rehydrates_verify_command ... ok test rebuild_evidence_restores_authoritative_late_gate_truth_after_successful_rebuild ... ok test rebuild_target_race_detected ... ok test rebuild_target_state_transition_blocked ... ok test rebuild_target_race_retries_and_rehydrates_verify_command ... ok test result: ok. 48 passed; 0 failed; 0 ignored; 0 measured; 181 filtered out; finished in 5.79s
**Invalidation Reason:** N/A

### Task 2 Step 1
#### Attempt 1
**Status:** Invalidated
**Recorded At:** 2026-03-30T19:39:53.1128Z
**Execution Source:** featureforge:executing-plans
**Task Number:** 2
**Step Number:** 1
**Packet Fingerprint:** 12dbb56587aa4ecd2c23f0952df7b9ea2ae60f810fca78ce44923493ab88b113
**Head SHA:** 5527e0d7d94e617dc9d44b77194aa7f0a958b98d
**Base SHA:** 5527e0d7d94e617dc9d44b77194aa7f0a958b98d
**Claim:** Added planner coverage for stale proofs and invalidated attempts so candidate discovery is exercised through the runtime-facing test harness.
**Files Proven:**
- tests/plan_execution.rs | sha256:bfd69ce643ab0c2c6dd932d93620be41574eb127ff09803a0ded969db1a9ee52
**Verify Command:** cargo test --test plan_execution -- rebuild_candidate_discovery_stale_targets --exact
**Verification Summary:** `cargo test --test plan_execution -- rebuild_candidate_discovery_stale_targets --exact` -> stale target discovery test passed
**Invalidation Reason:** Evidence rebuild: packet_fingerprint_mismatch

#### Attempt 2
**Status:** Invalidated
**Recorded At:** 2026-03-31T18:05:59.367517Z
**Execution Source:** featureforge:executing-plans
**Task Number:** 2
**Step Number:** 1
**Packet Fingerprint:** 14f058618be7f0e85a23fd868304004a0e4a38e400bf189e16200ffbfcd9ed08
**Head SHA:** 5527e0d7d94e617dc9d44b77194aa7f0a958b98d
**Base SHA:** 5527e0d7d94e617dc9d44b77194aa7f0a958b98d
**Claim:** Added planner coverage for stale proofs and invalidated attempts so candidate discovery is exercised through the runtime-facing test harness.
**Files Proven:**
- tests/plan_execution.rs | sha256:c665e38721a4d0a23bbd1ea089837183e32fa1b126582b9eab792652ebf5b0f6
**Verify Command:** cargo test --test plan_execution -- rebuild_candidate_discovery_stale_targets --exact
**Verification Summary:** `cargo test --test plan_execution -- rebuild_candidate_discovery_stale_targets --exact` -> passed: running 1 test test rebuild_candidate_discovery_stale_targets ... ok test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 197 filtered out; finished in 0.82s
**Invalidation Reason:** Evidence rebuild: source_spec_fingerprint_mismatch

#### Attempt 3
**Status:** Invalidated
**Recorded At:** 2026-04-01T06:03:00.789133Z
**Execution Source:** featureforge:executing-plans
**Task Number:** 2
**Step Number:** 1
**Packet Fingerprint:** cd344fd25b090de2f5831b3fef2a661299dee124dd9b8dbcbba7e85482293616
**Head SHA:** 2f97045889529eeb7d7214a0500963d34e9cf47d
**Base SHA:** 2f97045889529eeb7d7214a0500963d34e9cf47d
**Claim:** Added planner coverage for stale proofs and invalidated attempts so candidate discovery is exercised through the runtime-facing test harness.
**Files Proven:**
- tests/plan_execution.rs | sha256:16d6e788dd8c83391c96898ba801e1e7f8ba03589a0c33802e00ef596e2814a4
**Verify Command:** cargo test --test plan_execution -- rebuild_candidate_discovery_stale_targets --exact
**Verification Summary:** `cargo test --test plan_execution -- rebuild_candidate_discovery_stale_targets --exact` -> passed: running 1 test test rebuild_candidate_discovery_stale_targets ... ok test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 220 filtered out; finished in 1.59s
**Invalidation Reason:** Evidence rebuild: plan_fingerprint_mismatch

#### Attempt 4
**Status:** Completed
**Recorded At:** 2026-04-01T06:03:02.493512Z
**Execution Source:** featureforge:executing-plans
**Task Number:** 2
**Step Number:** 1
**Packet Fingerprint:** 8c0cae29bbc8eea6fdca1c2bdf54f6e6b1f1029d85e6889dadd99625b14471fa
**Head SHA:** 3cb97e9af57fb687bc8b01d3be18664e28101118
**Base SHA:** 3cb97e9af57fb687bc8b01d3be18664e28101118
**Claim:** Added planner coverage for stale proofs and invalidated attempts so candidate discovery is exercised through the runtime-facing test harness.
**Files Proven:**
- tests/plan_execution.rs | sha256:cee706e9b3195e2468b78c09114b0752288fc66ce6af374795ed37047177f995
**Verify Command:** cargo test --test plan_execution -- rebuild_candidate_discovery_stale_targets --exact
**Verification Summary:** `cargo test --test plan_execution -- rebuild_candidate_discovery_stale_targets --exact` -> passed: running 1 test test rebuild_candidate_discovery_stale_targets ... ok test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 228 filtered out; finished in 0.85s
**Invalidation Reason:** N/A

### Task 2 Step 2
#### Attempt 1
**Status:** Invalidated
**Recorded At:** 2026-03-30T20:09:08.363005Z
**Execution Source:** featureforge:executing-plans
**Task Number:** 2
**Step Number:** 2
**Packet Fingerprint:** 2d737c1c0d6ff83f2368156f763ef154dd8f4b38372fb5770e65ad8801afbefe
**Head SHA:** 5527e0d7d94e617dc9d44b77194aa7f0a958b98d
**Base SHA:** 5527e0d7d94e617dc9d44b77194aa7f0a958b98d
**Claim:** Added a deterministic ordering key and attempt-epoch metadata to rebuild discovery candidates so selection order stays stable and later replay can detect stale rows.
**Files Proven:**
- src/execution/state.rs | sha256:00384f08a7ffc2b1248aac1cb1d5dbbf0690089d2a1d878a566b28c29413b411
**Verify Command:** cargo test --test plan_execution rebuild_
**Verification Summary:** `cargo test --test plan_execution rebuild_` -> 9 rebuild-focused tests passed
**Invalidation Reason:** Evidence rebuild: packet_fingerprint_mismatch

#### Attempt 2
**Status:** Invalidated
**Recorded At:** 2026-03-31T19:17:59.041387Z
**Execution Source:** featureforge:executing-plans
**Task Number:** 2
**Step Number:** 2
**Packet Fingerprint:** a96bdd71ecfecdd55400d0c4a822476a79ec695d40e955fa473560d2b19842fe
**Head SHA:** 5527e0d7d94e617dc9d44b77194aa7f0a958b98d
**Base SHA:** 5527e0d7d94e617dc9d44b77194aa7f0a958b98d
**Claim:** Added a deterministic ordering key and attempt-epoch metadata to rebuild discovery candidates so selection order stays stable and later replay can detect stale rows.
**Files Proven:**
- src/execution/state.rs | sha256:b88d17aadff261f4bb3c478a552753c214d707adfad86302d15ebe9f5eb914c7
**Verify Command:** cargo test --test plan_execution rebuild_
**Verification Summary:** `cargo test --test plan_execution rebuild_` -> passed: running 31 tests test rebuild_candidate_discovery_stale_targets ... ok test rebuild_evidence_command_shape ... ok test rebuild_candidate_filtering ... ok test rebuild_candidate_discovery_plan_fingerprint_drift ... ok test rebuild_candidate_discovery_source_spec_fingerprint_drift ... ok test rebuild_candidate_discovery_unreadable_artifact ... ok test rebuild_evidence_invalid_scope ... ok test rebuild_evidence_json_output_fields ... ok test rebuild_evidence_dry_run_is_noop ... ok test rebuild_evidence_rejects_parallel_max_jobs ... ok test rebuild_evidence_manual_required_default ... ok test rebuild_evidence_json_schema ... ok test rebuild_evidence_legacy_summary_command_replays ... ok test rebuild_evidence_rejects_zero_max_jobs ... ok test rebuild_evidence_manual_required_rerun_resumes_open_step ... ok test rebuild_evidence_session_not_found ... ok test rebuild_evidence_scope_empty ... ok test rebuild_evidence_refreshes_prior_task_closure_receipts_across_tasks ... ok test rebuild_evidence_text_output_summary ... ok test rebuild_evidence_verify_command_failed_rerun_resumes_open_step ... ok test rebuild_evidence_state_transition_blocked_rerun_resumes_open_step ... ok test rebuild_executor_no_output_summary ... ok test rebuild_executor_reopens_and_recompletes ... ok test rebuild_evidence_text_failure_output ... ok test rebuild_state_transition_retry_rehydrates_verify_command ... ok test rebuild_target_race_detected ... ok test rebuild_target_state_transition_blocked ... ok test rebuild_target_race_retries_and_rehydrates_verify_command ... ok test rebuild_evidence_partial_failure_resume ... ok test rebuild_evidence_exit_statuses ... ok test rebuild_evidence_noop_and_partial_failures ... ok test result: ok. 31 passed; 0 failed; 0 ignored; 0 measured; 167 filtered out; finished in 4.61s
**Invalidation Reason:** Evidence rebuild: packet_fingerprint_mismatch

#### Attempt 3
**Status:** Invalidated
**Recorded At:** 2026-04-01T06:03:02.850155Z
**Execution Source:** featureforge:executing-plans
**Task Number:** 2
**Step Number:** 2
**Packet Fingerprint:** 1e77e332682122c2c68cf90d316a01e78293f960a45cadd9a09be69663fcf5aa
**Head SHA:** 2f97045889529eeb7d7214a0500963d34e9cf47d
**Base SHA:** 2f97045889529eeb7d7214a0500963d34e9cf47d
**Claim:** Added a deterministic ordering key and attempt-epoch metadata to rebuild discovery candidates so selection order stays stable and later replay can detect stale rows.
**Files Proven:**
- src/execution/state.rs | sha256:a5286e2720b77da5888f2964d86f69f798f714db130e9df07e297fa13073b3e8
**Verify Command:** cargo test --test plan_execution rebuild_
**Verification Summary:** `cargo test --test plan_execution rebuild_` -> passed: running 41 tests test rebuild_candidate_filtering ... ok test rebuild_evidence_command_shape ... ok test rebuild_candidate_discovery_plan_fingerprint_drift ... ok test rebuild_candidate_discovery_source_spec_fingerprint_drift ... ok test rebuild_candidate_discovery_unreadable_artifact ... ok test rebuild_candidate_discovery_stale_targets ... ok test rebuild_evidence_continue_on_error_clears_failed_earlier_interrupted_target ... ok test rebuild_evidence_dry_run_is_noop ... ok test rebuild_evidence_does_not_publish_contract_bound_receipts_without_active_contract ... ok test rebuild_evidence_invalid_scope ... ok test rebuild_evidence_clears_later_interrupted_step_before_reopening_earlier_target ... ok test rebuild_evidence_manual_required_default ... ok test rebuild_evidence_json_output_fields ... ok test rebuild_evidence_json_schema ... ok test rebuild_evidence_legacy_summary_command_replays ... ok test rebuild_evidence_manual_required_rerun_resumes_open_step ... ok test rebuild_evidence_manual_required_does_not_block_later_command_targets ... ok test rebuild_evidence_noop_refreshes_receipt_only_strategy_checkpoint_drift ... ok test rebuild_evidence_rejects_parallel_max_jobs ... ok test rebuild_evidence_rejects_zero_max_jobs ... ok test rebuild_evidence_refreshes_prior_task_closure_receipts_across_tasks ... ok test rebuild_evidence_scope_empty ... ok test rebuild_evidence_refreshes_preflight_acceptance_before_task_boundary_receipt_recovery ... ok test rebuild_evidence_refreshes_non_independent_prior_task_review_receipt_before_task_boundary_retry ... ok test rebuild_evidence_refreshes_malformed_prior_task_review_receipt_before_task_boundary_retry ... ok test rebuild_evidence_session_not_found ... ok test rebuild_evidence_restores_post_execution_state_when_prior_task_review_dispatch_missing ... ok test rebuild_evidence_reuses_active_contract_for_serial_unit_review_receipts ... ok test rebuild_evidence_state_transition_blocked_rerun_resumes_open_step ... ok test rebuild_evidence_text_output_summary ... ok test rebuild_executor_no_output_summary ... ok test rebuild_evidence_verify_command_failed_rerun_resumes_open_step ... ok test rebuild_evidence_partial_failure_resume ... ok test rebuild_executor_reopens_and_recompletes ... ok test rebuild_evidence_text_failure_output ... ok test rebuild_state_transition_retry_rehydrates_verify_command ... ok test rebuild_target_race_detected ... ok test rebuild_target_race_retries_and_rehydrates_verify_command ... ok test rebuild_target_state_transition_blocked ... ok test rebuild_evidence_noop_and_partial_failures ... ok test rebuild_evidence_exit_statuses ... ok test result: ok. 41 passed; 0 failed; 0 ignored; 0 measured; 180 filtered out; finished in 8.92s
**Invalidation Reason:** Evidence rebuild: plan_fingerprint_mismatch

#### Attempt 4
**Status:** Completed
**Recorded At:** 2026-04-01T06:03:09.405831Z
**Execution Source:** featureforge:executing-plans
**Task Number:** 2
**Step Number:** 2
**Packet Fingerprint:** a46ac54b2d731aaf683778f62770df18eedaa2001186dbc0d75ac43a44a2b783
**Head SHA:** 3cb97e9af57fb687bc8b01d3be18664e28101118
**Base SHA:** 3cb97e9af57fb687bc8b01d3be18664e28101118
**Claim:** Added a deterministic ordering key and attempt-epoch metadata to rebuild discovery candidates so selection order stays stable and later replay can detect stale rows.
**Files Proven:**
- src/execution/state.rs | sha256:13a15d5260cb5e748143fc1ca617c56ec81a0ebf64d9cfb10b23aebeac3dc8c6
**Verify Command:** cargo test --test plan_execution rebuild_
**Verification Summary:** `cargo test --test plan_execution rebuild_` -> passed: running 48 tests test rebuild_candidate_discovery_stale_targets ... ok test rebuild_candidate_discovery_plan_fingerprint_drift ... ok test rebuild_candidate_discovery_unreadable_artifact ... ok test rebuild_candidate_filtering ... ok test rebuild_candidate_discovery_source_spec_fingerprint_drift ... ok test rebuild_evidence_command_shape ... ok test rebuild_evidence_continue_on_error_clears_failed_earlier_interrupted_target ... ok test rebuild_evidence_dry_run_is_noop ... ok test rebuild_evidence_invalid_scope ... ok test rebuild_evidence_does_not_publish_contract_bound_receipts_without_active_contract ... ok test rebuild_evidence_clears_later_interrupted_step_before_reopening_earlier_target ... ok test rebuild_evidence_manual_required_default ... ok test rebuild_evidence_json_output_fields ... ok test rebuild_evidence_legacy_summary_command_replays ... ok test rebuild_evidence_json_schema ... ok test rebuild_evidence_manual_required_does_not_block_later_command_targets ... ok test rebuild_evidence_manual_required_rerun_resumes_open_step ... ok test rebuild_evidence_noop_allows_intermediate_test_plan_only_state ... ok test rebuild_evidence_noop_refreshes_receipt_only_strategy_checkpoint_drift ... ok test rebuild_evidence_manual_required_keeps_downstream_truth_stale_until_repaired ... ok test rebuild_evidence_noop_refreshes_final_review_without_requiring_release_readiness ... ok test rebuild_evidence_refreshes_malformed_prior_task_review_receipt_before_task_boundary_retry ... ok test rebuild_evidence_noop_rebinds_late_gate_artifacts_after_rebase_only_head_drift ... ok test rebuild_evidence_refreshes_prior_task_closure_receipts_across_tasks ... ok test rebuild_evidence_noop_rebinds_late_gate_artifacts_after_replayed_rebase_changes ... ok test rebuild_evidence_refreshes_preflight_acceptance_before_task_boundary_receipt_recovery ... ok test rebuild_evidence_noop_restores_authoritative_late_gate_truth ... ok test rebuild_evidence_refreshes_non_independent_prior_task_review_receipt_before_task_boundary_retry ... ok test rebuild_evidence_rejects_parallel_max_jobs ... ok test rebuild_evidence_rejects_zero_max_jobs ... ok test rebuild_evidence_scope_empty ... ok test rebuild_evidence_partial_failure_resume ... ok test rebuild_evidence_session_not_found ... ok test rebuild_evidence_exit_statuses ... ok test rebuild_evidence_state_transition_blocked_rerun_resumes_open_step ... ok test rebuild_evidence_text_output_summary ... ok test rebuild_evidence_reuses_active_contract_for_serial_unit_review_receipts ... ok test rebuild_evidence_noop_and_partial_failures ... ok test rebuild_evidence_restores_post_execution_state_when_prior_task_review_dispatch_missing ... ok test rebuild_evidence_verify_command_failed_rerun_resumes_open_step ... ok test rebuild_executor_no_output_summary ... ok test rebuild_evidence_text_failure_output ... ok test rebuild_executor_reopens_and_recompletes ... ok test rebuild_state_transition_retry_rehydrates_verify_command ... ok test rebuild_target_race_detected ... ok test rebuild_target_state_transition_blocked ... ok test rebuild_evidence_restores_authoritative_late_gate_truth_after_successful_rebuild ... ok test rebuild_target_race_retries_and_rehydrates_verify_command ... ok test result: ok. 48 passed; 0 failed; 0 ignored; 0 measured; 181 filtered out; finished in 5.81s
**Invalidation Reason:** N/A

### Task 2 Step 3
#### Attempt 1
**Status:** Invalidated
**Recorded At:** 2026-03-30T14:06:17.260791Z
**Execution Source:** featureforge:executing-plans
**Task Number:** 2
**Step Number:** 3
**Packet Fingerprint:** 78212b9865b166c22e8d5f8d70d0d6389d03de70f26dd2e7d51614bff9c95bfd
**Head SHA:** 5527e0d7d94e617dc9d44b77194aa7f0a958b98d
**Base SHA:** 5527e0d7d94e617dc9d44b77194aa7f0a958b98d
**Claim:** Expanded discovery selection rules to preserve artifact_read_error outcomes for unreadable proofs while keeping deterministic stale-target selection and explicit failure-class reporting.
**Files Proven:**
- src/execution/mutate.rs | sha256:69538252ef72c9094f702e9bda061f6baa018db7a669338f63a4ec4f66c19d28
- src/execution/state.rs | sha256:5ae94c7ce77bb665a623558dbdb71a90a93eeeab27a9740803e5c68ea9ef2ed4
- tests/plan_execution.rs | sha256:cd64a58d3a9fec93772090ee03c56f7427087a9dd9b8d081e21b0cc042455c14
**Verify Command:** cargo test --test plan_execution rebuild_
**Verification Summary:** `cargo test --test plan_execution rebuild_` -> 10 rebuild-focused tests passed
**Invalidation Reason:** Task 2 review found missing top-level evidence fingerprint drift discovery and artifact_read_error should not block unrelated targets by default.

#### Attempt 2
**Status:** Invalidated
**Recorded At:** 2026-03-30T20:09:13.524128Z
**Execution Source:** featureforge:executing-plans
**Task Number:** 2
**Step Number:** 3
**Packet Fingerprint:** 78212b9865b166c22e8d5f8d70d0d6389d03de70f26dd2e7d51614bff9c95bfd
**Head SHA:** 5527e0d7d94e617dc9d44b77194aa7f0a958b98d
**Base SHA:** 5527e0d7d94e617dc9d44b77194aa7f0a958b98d
**Claim:** Reused the runtime's top-level evidence provenance checks for plan and source-spec fingerprint drift, and made artifact_read_error non-blocking so unrelated targets can continue.
**Files Proven:**
- src/execution/mutate.rs | sha256:0b99a105c6f2aca358271f62cc5d3b2d91f60bceff9a842e7a0f67494590620d
- src/execution/state.rs | sha256:98084a7f9433204edb00c6a8e1dacd99d02a41ec5ecbb43a511c67ae96ee5509
- tests/plan_execution.rs | sha256:0e9b181481b6cb81c4ae7ac7adb988435526d102f391652a4428ece56c8dded2
**Verify Command:** cargo test --test plan_execution rebuild_
**Verification Summary:** `cargo test --test plan_execution rebuild_` -> 12 rebuild-focused tests passed
**Invalidation Reason:** Evidence rebuild: packet_fingerprint_mismatch

#### Attempt 3
**Status:** Invalidated
**Recorded At:** 2026-03-31T19:18:10.285151Z
**Execution Source:** featureforge:executing-plans
**Task Number:** 2
**Step Number:** 3
**Packet Fingerprint:** 69dc473a063045b9717858dc58fe9c521eaafb8afe37d566e5d5317236fec9a4
**Head SHA:** 5527e0d7d94e617dc9d44b77194aa7f0a958b98d
**Base SHA:** 5527e0d7d94e617dc9d44b77194aa7f0a958b98d
**Claim:** Reused the runtime's top-level evidence provenance checks for plan and source-spec fingerprint drift, and made artifact_read_error non-blocking so unrelated targets can continue.
**Files Proven:**
- src/execution/mutate.rs | sha256:af579e0936f04058ce24a5547e204c7433c24757a820161834dc6d7c4e2243c5
- src/execution/state.rs | sha256:b88d17aadff261f4bb3c478a552753c214d707adfad86302d15ebe9f5eb914c7
- tests/plan_execution.rs | sha256:c665e38721a4d0a23bbd1ea089837183e32fa1b126582b9eab792652ebf5b0f6
**Verify Command:** cargo test --test plan_execution rebuild_
**Verification Summary:** `cargo test --test plan_execution rebuild_` -> passed: running 31 tests test rebuild_candidate_filtering ... ok test rebuild_evidence_invalid_scope ... ok test rebuild_candidate_discovery_plan_fingerprint_drift ... ok test rebuild_candidate_discovery_stale_targets ... ok test rebuild_candidate_discovery_unreadable_artifact ... ok test rebuild_candidate_discovery_source_spec_fingerprint_drift ... ok test rebuild_evidence_command_shape ... ok test rebuild_evidence_json_output_fields ... ok test rebuild_evidence_dry_run_is_noop ... ok test rebuild_evidence_rejects_parallel_max_jobs ... ok test rebuild_evidence_manual_required_default ... ok test rebuild_evidence_json_schema ... ok test rebuild_evidence_legacy_summary_command_replays ... ok test rebuild_evidence_rejects_zero_max_jobs ... ok test rebuild_evidence_manual_required_rerun_resumes_open_step ... ok test rebuild_evidence_session_not_found ... ok test rebuild_evidence_scope_empty ... ok test rebuild_evidence_refreshes_prior_task_closure_receipts_across_tasks ... ok test rebuild_evidence_text_output_summary ... ok test rebuild_evidence_verify_command_failed_rerun_resumes_open_step ... ok test rebuild_evidence_state_transition_blocked_rerun_resumes_open_step ... ok test rebuild_executor_no_output_summary ... ok test rebuild_executor_reopens_and_recompletes ... ok test rebuild_evidence_text_failure_output ... ok test rebuild_state_transition_retry_rehydrates_verify_command ... ok test rebuild_target_race_detected ... ok test rebuild_target_state_transition_blocked ... ok test rebuild_target_race_retries_and_rehydrates_verify_command ... ok test rebuild_evidence_partial_failure_resume ... ok test rebuild_evidence_exit_statuses ... ok test rebuild_evidence_noop_and_partial_failures ... ok test result: ok. 31 passed; 0 failed; 0 ignored; 0 measured; 167 filtered out; finished in 3.56s
**Invalidation Reason:** Evidence rebuild: packet_fingerprint_mismatch

#### Attempt 4
**Status:** Invalidated
**Recorded At:** 2026-04-01T06:03:09.768472Z
**Execution Source:** featureforge:executing-plans
**Task Number:** 2
**Step Number:** 3
**Packet Fingerprint:** 9c1b9d45cfad05ac420c0de32e0831724946227dc7c18611d6a3da3e73b68625
**Head SHA:** 2f97045889529eeb7d7214a0500963d34e9cf47d
**Base SHA:** 2f97045889529eeb7d7214a0500963d34e9cf47d
**Claim:** Reused the runtime's top-level evidence provenance checks for plan and source-spec fingerprint drift, and made artifact_read_error non-blocking so unrelated targets can continue.
**Files Proven:**
- src/execution/mutate.rs | sha256:4dc1fb491af9d06ae831b51b26ff31cc83e410fbc03c20a36b18ecb3e2a54259
- src/execution/state.rs | sha256:a5286e2720b77da5888f2964d86f69f798f714db130e9df07e297fa13073b3e8
- tests/plan_execution.rs | sha256:16d6e788dd8c83391c96898ba801e1e7f8ba03589a0c33802e00ef596e2814a4
**Verify Command:** cargo test --test plan_execution rebuild_
**Verification Summary:** `cargo test --test plan_execution rebuild_` -> passed: running 41 tests test rebuild_candidate_discovery_plan_fingerprint_drift ... ok test rebuild_candidate_filtering ... ok test rebuild_candidate_discovery_unreadable_artifact ... ok test rebuild_candidate_discovery_source_spec_fingerprint_drift ... ok test rebuild_candidate_discovery_stale_targets ... ok test rebuild_evidence_command_shape ... ok test rebuild_evidence_continue_on_error_clears_failed_earlier_interrupted_target ... ok test rebuild_evidence_dry_run_is_noop ... ok test rebuild_evidence_does_not_publish_contract_bound_receipts_without_active_contract ... ok test rebuild_evidence_invalid_scope ... ok test rebuild_evidence_clears_later_interrupted_step_before_reopening_earlier_target ... ok test rebuild_evidence_manual_required_default ... ok test rebuild_evidence_json_schema ... ok test rebuild_evidence_json_output_fields ... ok test rebuild_evidence_legacy_summary_command_replays ... ok test rebuild_evidence_manual_required_rerun_resumes_open_step ... ok test rebuild_evidence_manual_required_does_not_block_later_command_targets ... ok test rebuild_evidence_rejects_parallel_max_jobs ... ok test rebuild_evidence_noop_refreshes_receipt_only_strategy_checkpoint_drift ... ok test rebuild_evidence_rejects_zero_max_jobs ... ok test rebuild_evidence_scope_empty ... ok test rebuild_evidence_refreshes_prior_task_closure_receipts_across_tasks ... ok test rebuild_evidence_refreshes_preflight_acceptance_before_task_boundary_receipt_recovery ... ok test rebuild_evidence_refreshes_malformed_prior_task_review_receipt_before_task_boundary_retry ... ok test rebuild_evidence_refreshes_non_independent_prior_task_review_receipt_before_task_boundary_retry ... ok test rebuild_evidence_session_not_found ... ok test rebuild_evidence_restores_post_execution_state_when_prior_task_review_dispatch_missing ... ok test rebuild_evidence_reuses_active_contract_for_serial_unit_review_receipts ... ok test rebuild_evidence_state_transition_blocked_rerun_resumes_open_step ... ok test rebuild_evidence_text_output_summary ... ok test rebuild_evidence_verify_command_failed_rerun_resumes_open_step ... ok test rebuild_evidence_partial_failure_resume ... ok test rebuild_executor_no_output_summary ... ok test rebuild_evidence_text_failure_output ... ok test rebuild_executor_reopens_and_recompletes ... ok test rebuild_state_transition_retry_rehydrates_verify_command ... ok test rebuild_target_race_detected ... ok test rebuild_target_state_transition_blocked ... ok test rebuild_target_race_retries_and_rehydrates_verify_command ... ok test rebuild_evidence_noop_and_partial_failures ... ok test rebuild_evidence_exit_statuses ... ok test result: ok. 41 passed; 0 failed; 0 ignored; 0 measured; 180 filtered out; finished in 10.03s
**Invalidation Reason:** Evidence rebuild: plan_fingerprint_mismatch

#### Attempt 5
**Status:** Completed
**Recorded At:** 2026-04-01T06:03:16.317695Z
**Execution Source:** featureforge:executing-plans
**Task Number:** 2
**Step Number:** 3
**Packet Fingerprint:** 446fd18127f8be0bf52a0de0deeaeec7e296b6fa01d7235e660191c58090b59b
**Head SHA:** 3cb97e9af57fb687bc8b01d3be18664e28101118
**Base SHA:** 3cb97e9af57fb687bc8b01d3be18664e28101118
**Claim:** Reused the runtime's top-level evidence provenance checks for plan and source-spec fingerprint drift, and made artifact_read_error non-blocking so unrelated targets can continue.
**Files Proven:**
- src/execution/mutate.rs | sha256:41a1c51647a67eb2deac38823562f6345bff4e3040a2cc9a8eec47e75561d650
- src/execution/state.rs | sha256:13a15d5260cb5e748143fc1ca617c56ec81a0ebf64d9cfb10b23aebeac3dc8c6
- tests/plan_execution.rs | sha256:cee706e9b3195e2468b78c09114b0752288fc66ce6af374795ed37047177f995
**Verify Command:** cargo test --test plan_execution rebuild_
**Verification Summary:** `cargo test --test plan_execution rebuild_` -> passed: running 48 tests test rebuild_candidate_discovery_source_spec_fingerprint_drift ... ok test rebuild_candidate_discovery_plan_fingerprint_drift ... ok test rebuild_candidate_discovery_stale_targets ... ok test rebuild_candidate_filtering ... ok test rebuild_candidate_discovery_unreadable_artifact ... ok test rebuild_evidence_command_shape ... ok test rebuild_evidence_continue_on_error_clears_failed_earlier_interrupted_target ... ok test rebuild_evidence_dry_run_is_noop ... ok test rebuild_evidence_does_not_publish_contract_bound_receipts_without_active_contract ... ok test rebuild_evidence_invalid_scope ... ok test rebuild_evidence_clears_later_interrupted_step_before_reopening_earlier_target ... ok test rebuild_evidence_manual_required_default ... ok test rebuild_evidence_json_schema ... ok test rebuild_evidence_json_output_fields ... ok test rebuild_evidence_legacy_summary_command_replays ... ok test rebuild_evidence_manual_required_does_not_block_later_command_targets ... ok test rebuild_evidence_manual_required_rerun_resumes_open_step ... ok test rebuild_evidence_noop_allows_intermediate_test_plan_only_state ... ok test rebuild_evidence_noop_refreshes_receipt_only_strategy_checkpoint_drift ... ok test rebuild_evidence_manual_required_keeps_downstream_truth_stale_until_repaired ... ok test rebuild_evidence_noop_refreshes_final_review_without_requiring_release_readiness ... ok test rebuild_evidence_refreshes_malformed_prior_task_review_receipt_before_task_boundary_retry ... ok test rebuild_evidence_noop_rebinds_late_gate_artifacts_after_rebase_only_head_drift ... ok test rebuild_evidence_refreshes_prior_task_closure_receipts_across_tasks ... ok test rebuild_evidence_noop_rebinds_late_gate_artifacts_after_replayed_rebase_changes ... ok test rebuild_evidence_noop_restores_authoritative_late_gate_truth ... ok test rebuild_evidence_rejects_parallel_max_jobs ... ok test rebuild_evidence_refreshes_preflight_acceptance_before_task_boundary_receipt_recovery ... ok test rebuild_evidence_rejects_zero_max_jobs ... ok test rebuild_evidence_refreshes_non_independent_prior_task_review_receipt_before_task_boundary_retry ... ok test rebuild_evidence_partial_failure_resume ... ok test rebuild_evidence_session_not_found ... ok test rebuild_evidence_scope_empty ... ok test rebuild_evidence_state_transition_blocked_rerun_resumes_open_step ... ok test rebuild_evidence_exit_statuses ... ok test rebuild_evidence_restores_post_execution_state_when_prior_task_review_dispatch_missing ... ok test rebuild_evidence_text_output_summary ... ok test rebuild_evidence_noop_and_partial_failures ... ok test rebuild_evidence_reuses_active_contract_for_serial_unit_review_receipts ... ok test rebuild_executor_no_output_summary ... ok test rebuild_evidence_verify_command_failed_rerun_resumes_open_step ... ok test rebuild_evidence_text_failure_output ... ok test rebuild_executor_reopens_and_recompletes ... ok test rebuild_state_transition_retry_rehydrates_verify_command ... ok test rebuild_target_state_transition_blocked ... ok test rebuild_evidence_restores_authoritative_late_gate_truth_after_successful_rebuild ... ok test rebuild_target_race_detected ... ok test rebuild_target_race_retries_and_rehydrates_verify_command ... ok test result: ok. 48 passed; 0 failed; 0 ignored; 0 measured; 181 filtered out; finished in 5.67s
**Invalidation Reason:** N/A

### Task 2 Step 4
#### Attempt 1
**Status:** Invalidated
**Recorded At:** 2026-03-30T20:09:17.618847Z
**Execution Source:** featureforge:executing-plans
**Task Number:** 2
**Step Number:** 4
**Packet Fingerprint:** 2469061ee7e098c6ee989b334d60cb7c1add7fc8e06f91e84f5e6fbf7e571df9
**Head SHA:** 5527e0d7d94e617dc9d44b77194aa7f0a958b98d
**Base SHA:** 5527e0d7d94e617dc9d44b77194aa7f0a958b98d
**Claim:** Completed exact task/step selector filtering with deterministic scope matching across rebuild candidate discovery.
**Files Proven:**
- src/execution/state.rs | sha256:5ae94c7ce77bb665a623558dbdb71a90a93eeeab27a9740803e5c68ea9ef2ed4
- tests/plan_execution.rs | sha256:cd64a58d3a9fec93772090ee03c56f7427087a9dd9b8d081e21b0cc042455c14
**Verify Command:** cargo test --test plan_execution -- rebuild_candidate_filtering --exact
**Verification Summary:** `cargo test --test plan_execution -- rebuild_candidate_filtering --exact` -> scoped candidate filtering test passed
**Invalidation Reason:** Evidence rebuild: packet_fingerprint_mismatch

#### Attempt 2
**Status:** Invalidated
**Recorded At:** 2026-03-31T19:18:22.510929Z
**Execution Source:** featureforge:executing-plans
**Task Number:** 2
**Step Number:** 4
**Packet Fingerprint:** 1bf8a7ef54d556039282f89f5f5bce0d7b67d2d69abadb962657b16d548c2d57
**Head SHA:** 5527e0d7d94e617dc9d44b77194aa7f0a958b98d
**Base SHA:** 5527e0d7d94e617dc9d44b77194aa7f0a958b98d
**Claim:** Completed exact task/step selector filtering with deterministic scope matching across rebuild candidate discovery.
**Files Proven:**
- src/execution/state.rs | sha256:b88d17aadff261f4bb3c478a552753c214d707adfad86302d15ebe9f5eb914c7
- tests/plan_execution.rs | sha256:c665e38721a4d0a23bbd1ea089837183e32fa1b126582b9eab792652ebf5b0f6
**Verify Command:** cargo test --test plan_execution -- rebuild_candidate_filtering --exact
**Verification Summary:** `cargo test --test plan_execution -- rebuild_candidate_filtering --exact` -> passed: running 1 test test rebuild_candidate_filtering ... ok test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 197 filtered out; finished in 0.81s
**Invalidation Reason:** Evidence rebuild: packet_fingerprint_mismatch

#### Attempt 3
**Status:** Invalidated
**Recorded At:** 2026-04-01T06:03:16.701232Z
**Execution Source:** featureforge:executing-plans
**Task Number:** 2
**Step Number:** 4
**Packet Fingerprint:** c4ce7894533e04ea69216987492b22b198e836ea4c0fd4aa90f4adcba02f0d4e
**Head SHA:** 2f97045889529eeb7d7214a0500963d34e9cf47d
**Base SHA:** 2f97045889529eeb7d7214a0500963d34e9cf47d
**Claim:** Completed exact task/step selector filtering with deterministic scope matching across rebuild candidate discovery.
**Files Proven:**
- src/execution/state.rs | sha256:a5286e2720b77da5888f2964d86f69f798f714db130e9df07e297fa13073b3e8
- tests/plan_execution.rs | sha256:16d6e788dd8c83391c96898ba801e1e7f8ba03589a0c33802e00ef596e2814a4
**Verify Command:** cargo test --test plan_execution -- rebuild_candidate_filtering --exact
**Verification Summary:** `cargo test --test plan_execution -- rebuild_candidate_filtering --exact` -> passed: running 1 test test rebuild_candidate_filtering ... ok test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 220 filtered out; finished in 0.94s
**Invalidation Reason:** Evidence rebuild: plan_fingerprint_mismatch

#### Attempt 4
**Status:** Completed
**Recorded At:** 2026-04-01T06:03:18.370671Z
**Execution Source:** featureforge:executing-plans
**Task Number:** 2
**Step Number:** 4
**Packet Fingerprint:** d26bbc140144786f9560e589b7ebf3023da8e5f70d7584ac8053f37a4090aeff
**Head SHA:** 3cb97e9af57fb687bc8b01d3be18664e28101118
**Base SHA:** 3cb97e9af57fb687bc8b01d3be18664e28101118
**Claim:** Completed exact task/step selector filtering with deterministic scope matching across rebuild candidate discovery.
**Files Proven:**
- src/execution/state.rs | sha256:13a15d5260cb5e748143fc1ca617c56ec81a0ebf64d9cfb10b23aebeac3dc8c6
- tests/plan_execution.rs | sha256:cee706e9b3195e2468b78c09114b0752288fc66ce6af374795ed37047177f995
**Verify Command:** cargo test --test plan_execution -- rebuild_candidate_filtering --exact
**Verification Summary:** `cargo test --test plan_execution -- rebuild_candidate_filtering --exact` -> passed: running 1 test test rebuild_candidate_filtering ... ok test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 228 filtered out; finished in 0.84s
**Invalidation Reason:** N/A

### Task 2 Step 5
#### Attempt 1
**Status:** Invalidated
**Recorded At:** 2026-03-30T20:09:19.053554Z
**Execution Source:** featureforge:executing-plans
**Task Number:** 2
**Step Number:** 5
**Packet Fingerprint:** f9411eee5dff92e74dcdb02c99b0d9a3a948f6a5ba71ae282a0ec59fe5b1986a
**Head SHA:** 5527e0d7d94e617dc9d44b77194aa7f0a958b98d
**Base SHA:** 5527e0d7d94e617dc9d44b77194aa7f0a958b98d
**Claim:** Verified scope-only planning output stays constrained to the selected task and step subset under the rebuild discovery path.
**Files Proven:**
- tests/plan_execution.rs | sha256:cd64a58d3a9fec93772090ee03c56f7427087a9dd9b8d081e21b0cc042455c14
**Verify Command:** cargo test --test plan_execution -- rebuild_candidate_filtering --exact
**Verification Summary:** `cargo test --test plan_execution -- rebuild_candidate_filtering --exact` -> scoped candidate filtering test passed
**Invalidation Reason:** Evidence rebuild: packet_fingerprint_mismatch

#### Attempt 2
**Status:** Invalidated
**Recorded At:** 2026-03-31T19:18:25.216439Z
**Execution Source:** featureforge:executing-plans
**Task Number:** 2
**Step Number:** 5
**Packet Fingerprint:** 46242d6d8cef1cd164523dfe4bb00a59859bb62cae870bd9898780886fd93e98
**Head SHA:** 5527e0d7d94e617dc9d44b77194aa7f0a958b98d
**Base SHA:** 5527e0d7d94e617dc9d44b77194aa7f0a958b98d
**Claim:** Verified scope-only planning output stays constrained to the selected task and step subset under the rebuild discovery path.
**Files Proven:**
- tests/plan_execution.rs | sha256:c665e38721a4d0a23bbd1ea089837183e32fa1b126582b9eab792652ebf5b0f6
**Verify Command:** cargo test --test plan_execution -- rebuild_candidate_filtering --exact
**Verification Summary:** `cargo test --test plan_execution -- rebuild_candidate_filtering --exact` -> passed: running 1 test test rebuild_candidate_filtering ... ok test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 197 filtered out; finished in 0.81s
**Invalidation Reason:** Evidence rebuild: packet_fingerprint_mismatch

#### Attempt 3
**Status:** Invalidated
**Recorded At:** 2026-04-01T06:03:18.731546Z
**Execution Source:** featureforge:executing-plans
**Task Number:** 2
**Step Number:** 5
**Packet Fingerprint:** d5db503c202247c8cc51caebd21288a4d15b6e061c4e8018ed2c50e1f37bcb6c
**Head SHA:** 2f97045889529eeb7d7214a0500963d34e9cf47d
**Base SHA:** 2f97045889529eeb7d7214a0500963d34e9cf47d
**Claim:** Verified scope-only planning output stays constrained to the selected task and step subset under the rebuild discovery path.
**Files Proven:**
- tests/plan_execution.rs | sha256:16d6e788dd8c83391c96898ba801e1e7f8ba03589a0c33802e00ef596e2814a4
**Verify Command:** cargo test --test plan_execution -- rebuild_candidate_filtering --exact
**Verification Summary:** `cargo test --test plan_execution -- rebuild_candidate_filtering --exact` -> passed: running 1 test test rebuild_candidate_filtering ... ok test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 220 filtered out; finished in 0.89s
**Invalidation Reason:** Evidence rebuild: plan_fingerprint_mismatch

#### Attempt 4
**Status:** Completed
**Recorded At:** 2026-04-01T06:03:20.515612Z
**Execution Source:** featureforge:executing-plans
**Task Number:** 2
**Step Number:** 5
**Packet Fingerprint:** 60aa2fae4ebd0e77d483bd4a490237cfe778d6e4281ac20202a938df809df3c1
**Head SHA:** 3cb97e9af57fb687bc8b01d3be18664e28101118
**Base SHA:** 3cb97e9af57fb687bc8b01d3be18664e28101118
**Claim:** Verified scope-only planning output stays constrained to the selected task and step subset under the rebuild discovery path.
**Files Proven:**
- tests/plan_execution.rs | sha256:cee706e9b3195e2468b78c09114b0752288fc66ce6af374795ed37047177f995
**Verify Command:** cargo test --test plan_execution -- rebuild_candidate_filtering --exact
**Verification Summary:** `cargo test --test plan_execution -- rebuild_candidate_filtering --exact` -> passed: running 1 test test rebuild_candidate_filtering ... ok test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 228 filtered out; finished in 0.99s
**Invalidation Reason:** N/A

### Task 3 Step 1
#### Attempt 1
**Status:** Invalidated
**Recorded At:** 2026-03-30T20:09:20.522736Z
**Execution Source:** featureforge:executing-plans
**Task Number:** 3
**Step Number:** 1
**Packet Fingerprint:** caa17903ea83f05adddcdf1cd390df33cf9c24abfd46e69f2986f77399d774d4
**Head SHA:** 5527e0d7d94e617dc9d44b77194aa7f0a958b98d
**Base SHA:** 5527e0d7d94e617dc9d44b77194aa7f0a958b98d
**Claim:** Confirmed the replay executor reopens stale command-backed targets and recompletes them through the existing transition paths.
**Files Proven:**
- src/execution/mutate.rs | sha256:0b99a105c6f2aca358271f62cc5d3b2d91f60bceff9a842e7a0f67494590620d
- tests/plan_execution.rs | sha256:0e9b181481b6cb81c4ae7ac7adb988435526d102f391652a4428ece56c8dded2
**Verify Command:** cargo test --test plan_execution -- rebuild_executor_reopens_and_recompletes --exact
**Verification Summary:** `cargo test --test plan_execution -- rebuild_executor_reopens_and_recompletes --exact` -> replay executor test passed
**Invalidation Reason:** Evidence rebuild: packet_fingerprint_mismatch

#### Attempt 2
**Status:** Invalidated
**Recorded At:** 2026-03-31T19:18:27.689713Z
**Execution Source:** featureforge:executing-plans
**Task Number:** 3
**Step Number:** 1
**Packet Fingerprint:** bad5f7ae62e7b7a55d5069afb92cefcc8ca244e80adbb186df7c7e1ef4868fec
**Head SHA:** 5527e0d7d94e617dc9d44b77194aa7f0a958b98d
**Base SHA:** 5527e0d7d94e617dc9d44b77194aa7f0a958b98d
**Claim:** Confirmed the replay executor reopens stale command-backed targets and recompletes them through the existing transition paths.
**Files Proven:**
- src/execution/mutate.rs | sha256:af579e0936f04058ce24a5547e204c7433c24757a820161834dc6d7c4e2243c5
- tests/plan_execution.rs | sha256:c665e38721a4d0a23bbd1ea089837183e32fa1b126582b9eab792652ebf5b0f6
**Verify Command:** cargo test --test plan_execution -- rebuild_executor_reopens_and_recompletes --exact
**Verification Summary:** `cargo test --test plan_execution -- rebuild_executor_reopens_and_recompletes --exact` -> passed: running 1 test test rebuild_executor_reopens_and_recompletes ... ok test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 197 filtered out; finished in 0.96s
**Invalidation Reason:** Evidence rebuild: packet_fingerprint_mismatch

#### Attempt 3
**Status:** Invalidated
**Recorded At:** 2026-04-01T06:03:20.879838Z
**Execution Source:** featureforge:executing-plans
**Task Number:** 3
**Step Number:** 1
**Packet Fingerprint:** 15298a98564884cdfee56999d8f526632bfef6d972895ce5416f32eccc0ec927
**Head SHA:** 2f97045889529eeb7d7214a0500963d34e9cf47d
**Base SHA:** 2f97045889529eeb7d7214a0500963d34e9cf47d
**Claim:** Confirmed the replay executor reopens stale command-backed targets and recompletes them through the existing transition paths.
**Files Proven:**
- src/execution/mutate.rs | sha256:4dc1fb491af9d06ae831b51b26ff31cc83e410fbc03c20a36b18ecb3e2a54259
- tests/plan_execution.rs | sha256:16d6e788dd8c83391c96898ba801e1e7f8ba03589a0c33802e00ef596e2814a4
**Verify Command:** cargo test --test plan_execution -- rebuild_executor_reopens_and_recompletes --exact
**Verification Summary:** `cargo test --test plan_execution -- rebuild_executor_reopens_and_recompletes --exact` -> passed: running 1 test test rebuild_executor_reopens_and_recompletes ... ok test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 220 filtered out; finished in 1.10s
**Invalidation Reason:** Evidence rebuild: plan_fingerprint_mismatch

#### Attempt 4
**Status:** Completed
**Recorded At:** 2026-04-01T06:03:22.695179Z
**Execution Source:** featureforge:executing-plans
**Task Number:** 3
**Step Number:** 1
**Packet Fingerprint:** 6e2ba43075ab9c709715ace1c9ee3ed1bd5885dba1d6e4ca9ffb4d893ee5cacf
**Head SHA:** 3cb97e9af57fb687bc8b01d3be18664e28101118
**Base SHA:** 3cb97e9af57fb687bc8b01d3be18664e28101118
**Claim:** Confirmed the replay executor reopens stale command-backed targets and recompletes them through the existing transition paths.
**Files Proven:**
- src/execution/mutate.rs | sha256:41a1c51647a67eb2deac38823562f6345bff4e3040a2cc9a8eec47e75561d650
- tests/plan_execution.rs | sha256:cee706e9b3195e2468b78c09114b0752288fc66ce6af374795ed37047177f995
**Verify Command:** cargo test --test plan_execution -- rebuild_executor_reopens_and_recompletes --exact
**Verification Summary:** `cargo test --test plan_execution -- rebuild_executor_reopens_and_recompletes --exact` -> passed: running 1 test test rebuild_executor_reopens_and_recompletes ... ok test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 228 filtered out; finished in 0.95s
**Invalidation Reason:** N/A

### Task 3 Step 2
#### Attempt 1
**Status:** Invalidated
**Recorded At:** 2026-03-30T20:09:22.25102Z
**Execution Source:** featureforge:executing-plans
**Task Number:** 3
**Step Number:** 2
**Packet Fingerprint:** b002c44d0c43dfcc55b885e0fd3540bf03396e04b2aa769108979e305ad073ae
**Head SHA:** 5527e0d7d94e617dc9d44b77194aa7f0a958b98d
**Base SHA:** 5527e0d7d94e617dc9d44b77194aa7f0a958b98d
**Claim:** Implemented replay conflict handling for invalidated targets, state-transition retries, and target_race detection using live attempt identity checks.
**Files Proven:**
- src/execution/mutate.rs | sha256:db8135c6f9900bab4858d58f849f858e248edb1aad43930b9cd09665000b0065
- src/execution/state.rs | sha256:74c8d2b5f54c455b5e11812e4408e5eed8c562fd876facefba857dbf5d6133f7
- tests/plan_execution.rs | sha256:242f18f54fa5c32742f6cf8fb6ca6bd072f9e8f8700c852c0294cabe5a3ae620
**Verify Command:** cargo test --test plan_execution rebuild_
**Verification Summary:** `cargo test --test plan_execution rebuild_` -> 14 rebuild-focused tests passed
**Invalidation Reason:** Evidence rebuild: packet_fingerprint_mismatch

#### Attempt 2
**Status:** Invalidated
**Recorded At:** 2026-03-31T01:09:02.161323Z
**Execution Source:** featureforge:executing-plans
**Task Number:** 3
**Step Number:** 2
**Packet Fingerprint:** 86c1711fc7166090c05088d95dac6beb87237a2b4baad1586492c5b60eece5dd
**Head SHA:** 5527e0d7d94e617dc9d44b77194aa7f0a958b98d
**Base SHA:** 5527e0d7d94e617dc9d44b77194aa7f0a958b98d
**Claim:** Implemented replay conflict handling for invalidated targets, state-transition retries, and target_race detection using live attempt identity checks.
**Files Proven:**
- src/execution/mutate.rs | sha256:af579e0936f04058ce24a5547e204c7433c24757a820161834dc6d7c4e2243c5
- src/execution/state.rs | sha256:b88d17aadff261f4bb3c478a552753c214d707adfad86302d15ebe9f5eb914c7
- tests/plan_execution.rs | sha256:c665e38721a4d0a23bbd1ea089837183e32fa1b126582b9eab792652ebf5b0f6
**Verify Command:** cargo test --test plan_execution rebuild_
**Verification Summary:** `cargo test --test plan_execution rebuild_` -> passed: running 31 tests test rebuild_candidate_discovery_source_spec_fingerprint_drift ... ok test rebuild_evidence_invalid_scope ... ok test rebuild_candidate_discovery_stale_targets ... ok test rebuild_candidate_discovery_unreadable_artifact ... ok test rebuild_candidate_filtering ... ok test rebuild_evidence_command_shape ... ok test rebuild_candidate_discovery_plan_fingerprint_drift ... ok test rebuild_evidence_json_output_fields ... ok test rebuild_evidence_dry_run_is_noop ... ok test rebuild_evidence_rejects_parallel_max_jobs ... ok test rebuild_evidence_manual_required_default ... ok test rebuild_evidence_json_schema ... ok test rebuild_evidence_legacy_summary_command_replays ... ok test rebuild_evidence_rejects_zero_max_jobs ... ok test rebuild_evidence_manual_required_rerun_resumes_open_step ... ok test rebuild_evidence_session_not_found ... ok test rebuild_evidence_scope_empty ... ok test rebuild_evidence_refreshes_prior_task_closure_receipts_across_tasks ... ok test rebuild_evidence_text_output_summary ... ok test rebuild_evidence_verify_command_failed_rerun_resumes_open_step ... ok test rebuild_evidence_state_transition_blocked_rerun_resumes_open_step ... ok test rebuild_executor_no_output_summary ... ok test rebuild_executor_reopens_and_recompletes ... ok test rebuild_evidence_text_failure_output ... ok test rebuild_state_transition_retry_rehydrates_verify_command ... ok test rebuild_target_race_detected ... ok test rebuild_target_state_transition_blocked ... ok test rebuild_target_race_retries_and_rehydrates_verify_command ... ok test rebuild_evidence_partial_failure_resume ... ok test rebuild_evidence_exit_statuses ... ok test rebuild_evidence_noop_and_partial_failures ... ok test result: ok. 31 passed; 0 failed; 0 ignored; 0 measured; 167 filtered out; finished in 3.53s
**Invalidation Reason:** Evidence rebuild: files_proven_drifted

#### Attempt 3
**Status:** Invalidated
**Recorded At:** 2026-03-31T19:18:30.644768Z
**Execution Source:** featureforge:executing-plans
**Task Number:** 3
**Step Number:** 2
**Packet Fingerprint:** 86c1711fc7166090c05088d95dac6beb87237a2b4baad1586492c5b60eece5dd
**Head SHA:** 3a6a1610f1d611a85cc50964438053167b832265
**Base SHA:** 3a6a1610f1d611a85cc50964438053167b832265
**Claim:** Implemented replay conflict handling for invalidated targets, state-transition retries, and target_race detection using live attempt identity checks.
**Files Proven:**
- src/execution/mutate.rs | sha256:9366214d624e2eba4d7ca4208362481ab7d5f5f3b5f2094df2873cd06551a268
- src/execution/state.rs | sha256:fb21eeb768e1bf13fd46c4ad1170e8ab1c19cd6789892bc85d8bb4f8b5a1bdb6
- tests/plan_execution.rs | sha256:96a93d5707e93ae57952c6f9a4dd3fca6834895a936d20fb83555fc1d6969452
**Verify Command:** cargo test --test plan_execution rebuild_
**Verification Summary:** `cargo test --test plan_execution rebuild_` -> passed: running 35 tests test rebuild_candidate_filtering ... ok test rebuild_candidate_discovery_stale_targets ... ok test rebuild_candidate_discovery_unreadable_artifact ... ok test rebuild_evidence_command_shape ... ok test rebuild_candidate_discovery_plan_fingerprint_drift ... ok test rebuild_candidate_discovery_source_spec_fingerprint_drift ... ok test rebuild_evidence_dry_run_is_noop ... ok test rebuild_evidence_does_not_publish_contract_bound_receipts_without_active_contract ... ok test rebuild_evidence_invalid_scope ... ok test rebuild_evidence_clears_later_interrupted_step_before_reopening_earlier_target ... ok test rebuild_evidence_manual_required_default ... ok test rebuild_evidence_json_output_fields ... ok test rebuild_evidence_legacy_summary_command_replays ... ok test rebuild_evidence_manual_required_rerun_resumes_open_step ... ok test rebuild_evidence_json_schema ... ok test rebuild_evidence_rejects_parallel_max_jobs ... ok test rebuild_evidence_session_not_found ... ok test rebuild_evidence_rejects_zero_max_jobs ... ok test rebuild_evidence_scope_empty ... ok test rebuild_evidence_refreshes_prior_task_closure_receipts_across_tasks ... ok test rebuild_evidence_refreshes_preflight_acceptance_before_task_boundary_receipt_recovery ... ok test rebuild_evidence_text_output_summary ... ok test rebuild_evidence_verify_command_failed_rerun_resumes_open_step ... ok test rebuild_evidence_state_transition_blocked_rerun_resumes_open_step ... ok test rebuild_evidence_reuses_active_contract_for_serial_unit_review_receipts ... ok test rebuild_evidence_text_failure_output ... ok test rebuild_executor_no_output_summary ... ok test rebuild_executor_reopens_and_recompletes ... ok test rebuild_state_transition_retry_rehydrates_verify_command ... ok test rebuild_target_state_transition_blocked ... ok test rebuild_target_race_retries_and_rehydrates_verify_command ... ok test rebuild_target_race_detected ... ok test rebuild_evidence_partial_failure_resume ... ok test rebuild_evidence_exit_statuses ... ok test rebuild_evidence_noop_and_partial_failures ... ok test result: ok. 35 passed; 0 failed; 0 ignored; 0 measured; 170 filtered out; finished in 4.16s
**Invalidation Reason:** Evidence rebuild: packet_fingerprint_mismatch

#### Attempt 4
**Status:** Invalidated
**Recorded At:** 2026-04-01T06:03:23.064743Z
**Execution Source:** featureforge:executing-plans
**Task Number:** 3
**Step Number:** 2
**Packet Fingerprint:** 59d9fb1a50cd3cea43a25d6c1e49c35aa7ff08e8c80730f37b25ccf7655bbf25
**Head SHA:** 2f97045889529eeb7d7214a0500963d34e9cf47d
**Base SHA:** 2f97045889529eeb7d7214a0500963d34e9cf47d
**Claim:** Implemented replay conflict handling for invalidated targets, state-transition retries, and target_race detection using live attempt identity checks.
**Files Proven:**
- src/execution/mutate.rs | sha256:4dc1fb491af9d06ae831b51b26ff31cc83e410fbc03c20a36b18ecb3e2a54259
- src/execution/state.rs | sha256:a5286e2720b77da5888f2964d86f69f798f714db130e9df07e297fa13073b3e8
- tests/plan_execution.rs | sha256:16d6e788dd8c83391c96898ba801e1e7f8ba03589a0c33802e00ef596e2814a4
**Verify Command:** cargo test --test plan_execution rebuild_
**Verification Summary:** `cargo test --test plan_execution rebuild_` -> passed: running 41 tests test rebuild_candidate_discovery_plan_fingerprint_drift ... ok test rebuild_evidence_command_shape ... ok test rebuild_candidate_discovery_stale_targets ... ok test rebuild_candidate_discovery_unreadable_artifact ... ok test rebuild_candidate_discovery_source_spec_fingerprint_drift ... ok test rebuild_candidate_filtering ... ok test rebuild_evidence_continue_on_error_clears_failed_earlier_interrupted_target ... ok test rebuild_evidence_dry_run_is_noop ... ok test rebuild_evidence_does_not_publish_contract_bound_receipts_without_active_contract ... ok test rebuild_evidence_invalid_scope ... ok test rebuild_evidence_clears_later_interrupted_step_before_reopening_earlier_target ... ok test rebuild_evidence_manual_required_default ... ok test rebuild_evidence_json_schema ... ok test rebuild_evidence_legacy_summary_command_replays ... ok test rebuild_evidence_json_output_fields ... ok test rebuild_evidence_manual_required_rerun_resumes_open_step ... ok test rebuild_evidence_manual_required_does_not_block_later_command_targets ... ok test rebuild_evidence_rejects_parallel_max_jobs ... ok test rebuild_evidence_noop_refreshes_receipt_only_strategy_checkpoint_drift ... ok test rebuild_evidence_rejects_zero_max_jobs ... ok test rebuild_evidence_refreshes_prior_task_closure_receipts_across_tasks ... ok test rebuild_evidence_scope_empty ... ok test rebuild_evidence_refreshes_preflight_acceptance_before_task_boundary_receipt_recovery ... ok test rebuild_evidence_refreshes_malformed_prior_task_review_receipt_before_task_boundary_retry ... ok test rebuild_evidence_refreshes_non_independent_prior_task_review_receipt_before_task_boundary_retry ... ok test rebuild_evidence_session_not_found ... ok test rebuild_evidence_restores_post_execution_state_when_prior_task_review_dispatch_missing ... ok test rebuild_evidence_reuses_active_contract_for_serial_unit_review_receipts ... ok test rebuild_evidence_state_transition_blocked_rerun_resumes_open_step ... ok test rebuild_evidence_text_output_summary ... ok test rebuild_evidence_verify_command_failed_rerun_resumes_open_step ... ok test rebuild_executor_no_output_summary ... ok test rebuild_evidence_partial_failure_resume ... ok test rebuild_evidence_text_failure_output ... ok test rebuild_executor_reopens_and_recompletes ... ok test rebuild_state_transition_retry_rehydrates_verify_command ... ok test rebuild_target_race_detected ... ok test rebuild_target_state_transition_blocked ... ok test rebuild_target_race_retries_and_rehydrates_verify_command ... ok test rebuild_evidence_noop_and_partial_failures ... ok test rebuild_evidence_exit_statuses ... ok test result: ok. 41 passed; 0 failed; 0 ignored; 0 measured; 180 filtered out; finished in 6.49s
**Invalidation Reason:** Evidence rebuild: plan_fingerprint_mismatch

#### Attempt 5
**Status:** Completed
**Recorded At:** 2026-04-01T06:03:29.93057Z
**Execution Source:** featureforge:executing-plans
**Task Number:** 3
**Step Number:** 2
**Packet Fingerprint:** 058f45adab0fe22c6f0d2057f8f8b8e62d0dd44cd098abad441dc551cbc1df43
**Head SHA:** 3cb97e9af57fb687bc8b01d3be18664e28101118
**Base SHA:** 3cb97e9af57fb687bc8b01d3be18664e28101118
**Claim:** Implemented replay conflict handling for invalidated targets, state-transition retries, and target_race detection using live attempt identity checks.
**Files Proven:**
- src/execution/mutate.rs | sha256:41a1c51647a67eb2deac38823562f6345bff4e3040a2cc9a8eec47e75561d650
- src/execution/state.rs | sha256:13a15d5260cb5e748143fc1ca617c56ec81a0ebf64d9cfb10b23aebeac3dc8c6
- tests/plan_execution.rs | sha256:cee706e9b3195e2468b78c09114b0752288fc66ce6af374795ed37047177f995
**Verify Command:** cargo test --test plan_execution rebuild_
**Verification Summary:** `cargo test --test plan_execution rebuild_` -> passed: running 48 tests test rebuild_candidate_filtering ... ok test rebuild_evidence_command_shape ... ok test rebuild_candidate_discovery_plan_fingerprint_drift ... ok test rebuild_candidate_discovery_stale_targets ... ok test rebuild_candidate_discovery_source_spec_fingerprint_drift ... ok test rebuild_candidate_discovery_unreadable_artifact ... ok test rebuild_evidence_continue_on_error_clears_failed_earlier_interrupted_target ... ok test rebuild_evidence_dry_run_is_noop ... ok test rebuild_evidence_does_not_publish_contract_bound_receipts_without_active_contract ... ok test rebuild_evidence_invalid_scope ... ok test rebuild_evidence_clears_later_interrupted_step_before_reopening_earlier_target ... ok test rebuild_evidence_manual_required_default ... ok test rebuild_evidence_json_schema ... ok test rebuild_evidence_json_output_fields ... ok test rebuild_evidence_legacy_summary_command_replays ... ok test rebuild_evidence_manual_required_does_not_block_later_command_targets ... ok test rebuild_evidence_manual_required_rerun_resumes_open_step ... ok test rebuild_evidence_noop_allows_intermediate_test_plan_only_state ... ok test rebuild_evidence_noop_refreshes_receipt_only_strategy_checkpoint_drift ... ok test rebuild_evidence_manual_required_keeps_downstream_truth_stale_until_repaired ... ok test rebuild_evidence_noop_refreshes_final_review_without_requiring_release_readiness ... ok test rebuild_evidence_refreshes_malformed_prior_task_review_receipt_before_task_boundary_retry ... ok test rebuild_evidence_noop_rebinds_late_gate_artifacts_after_rebase_only_head_drift ... ok test rebuild_evidence_refreshes_prior_task_closure_receipts_across_tasks ... ok test rebuild_evidence_noop_rebinds_late_gate_artifacts_after_replayed_rebase_changes ... ok test rebuild_evidence_noop_restores_authoritative_late_gate_truth ... ok test rebuild_evidence_rejects_parallel_max_jobs ... ok test rebuild_evidence_refreshes_preflight_acceptance_before_task_boundary_receipt_recovery ... ok test rebuild_evidence_refreshes_non_independent_prior_task_review_receipt_before_task_boundary_retry ... ok test rebuild_evidence_rejects_zero_max_jobs ... ok test rebuild_evidence_session_not_found ... ok test rebuild_evidence_partial_failure_resume ... ok test rebuild_evidence_scope_empty ... ok test rebuild_evidence_state_transition_blocked_rerun_resumes_open_step ... ok test rebuild_evidence_exit_statuses ... ok test rebuild_evidence_restores_post_execution_state_when_prior_task_review_dispatch_missing ... ok test rebuild_evidence_noop_and_partial_failures ... ok test rebuild_evidence_text_output_summary ... ok test rebuild_evidence_reuses_active_contract_for_serial_unit_review_receipts ... ok test rebuild_executor_no_output_summary ... ok test rebuild_evidence_verify_command_failed_rerun_resumes_open_step ... ok test rebuild_evidence_text_failure_output ... ok test rebuild_executor_reopens_and_recompletes ... ok test rebuild_evidence_restores_authoritative_late_gate_truth_after_successful_rebuild ... ok test rebuild_state_transition_retry_rehydrates_verify_command ... ok test rebuild_target_race_detected ... ok test rebuild_target_state_transition_blocked ... ok test rebuild_target_race_retries_and_rehydrates_verify_command ... ok test result: ok. 48 passed; 0 failed; 0 ignored; 0 measured; 181 filtered out; finished in 5.99s
**Invalidation Reason:** N/A

### Task 3 Step 3
#### Attempt 1
**Status:** Invalidated
**Recorded At:** 2026-03-30T20:09:26.415913Z
**Execution Source:** featureforge:executing-plans
**Task Number:** 3
**Step Number:** 3
**Packet Fingerprint:** a677127b490bb39af07b3785695e60e99d39391bc9552778af1b9223aae35ea3
**Head SHA:** 5527e0d7d94e617dc9d44b77194aa7f0a958b98d
**Base SHA:** 5527e0d7d94e617dc9d44b77194aa7f0a958b98d
**Claim:** Verified command-backed replay captures deterministic verification summaries and honors --no-output without suppressing the command run itself.
**Files Proven:**
- src/execution/mutate.rs | sha256:db8135c6f9900bab4858d58f849f858e248edb1aad43930b9cd09665000b0065
- tests/plan_execution.rs | sha256:8f1592424fd5db9c1605594c0e058a7fc0c00dc988f5b59ae3170a9634f1a208
**Verify Command:** cargo test --test plan_execution rebuild_
**Verification Summary:** `cargo test --test plan_execution rebuild_` -> 15 rebuild-focused tests passed
**Invalidation Reason:** Evidence rebuild: packet_fingerprint_mismatch

#### Attempt 2
**Status:** Invalidated
**Recorded At:** 2026-03-31T19:18:38.615359Z
**Execution Source:** featureforge:executing-plans
**Task Number:** 3
**Step Number:** 3
**Packet Fingerprint:** f09ef8f3fd6ba8a14653a797ccc0c7a5f602d11f16b150e9535eedaa52440447
**Head SHA:** 5527e0d7d94e617dc9d44b77194aa7f0a958b98d
**Base SHA:** 5527e0d7d94e617dc9d44b77194aa7f0a958b98d
**Claim:** Verified command-backed replay captures deterministic verification summaries and honors --no-output without suppressing the command run itself.
**Files Proven:**
- src/execution/mutate.rs | sha256:af579e0936f04058ce24a5547e204c7433c24757a820161834dc6d7c4e2243c5
- tests/plan_execution.rs | sha256:c665e38721a4d0a23bbd1ea089837183e32fa1b126582b9eab792652ebf5b0f6
**Verify Command:** cargo test --test plan_execution rebuild_
**Verification Summary:** `cargo test --test plan_execution rebuild_` -> passed: running 31 tests test rebuild_evidence_invalid_scope ... ok test rebuild_evidence_command_shape ... ok test rebuild_candidate_discovery_stale_targets ... ok test rebuild_candidate_discovery_source_spec_fingerprint_drift ... ok test rebuild_candidate_filtering ... ok test rebuild_candidate_discovery_plan_fingerprint_drift ... ok test rebuild_candidate_discovery_unreadable_artifact ... ok test rebuild_evidence_json_output_fields ... ok test rebuild_evidence_dry_run_is_noop ... ok test rebuild_evidence_rejects_parallel_max_jobs ... ok test rebuild_evidence_manual_required_default ... ok test rebuild_evidence_rejects_zero_max_jobs ... ok test rebuild_evidence_json_schema ... ok test rebuild_evidence_manual_required_rerun_resumes_open_step ... ok test rebuild_evidence_legacy_summary_command_replays ... ok test rebuild_evidence_session_not_found ... ok test rebuild_evidence_scope_empty ... ok test rebuild_evidence_refreshes_prior_task_closure_receipts_across_tasks ... ok test rebuild_evidence_text_output_summary ... ok test rebuild_evidence_verify_command_failed_rerun_resumes_open_step ... ok test rebuild_evidence_state_transition_blocked_rerun_resumes_open_step ... ok test rebuild_executor_no_output_summary ... ok test rebuild_executor_reopens_and_recompletes ... ok test rebuild_evidence_text_failure_output ... ok test rebuild_state_transition_retry_rehydrates_verify_command ... ok test rebuild_target_race_detected ... ok test rebuild_target_state_transition_blocked ... ok test rebuild_target_race_retries_and_rehydrates_verify_command ... ok test rebuild_evidence_partial_failure_resume ... ok test rebuild_evidence_exit_statuses ... ok test rebuild_evidence_noop_and_partial_failures ... ok test result: ok. 31 passed; 0 failed; 0 ignored; 0 measured; 167 filtered out; finished in 3.63s
**Invalidation Reason:** Evidence rebuild: packet_fingerprint_mismatch

#### Attempt 3
**Status:** Invalidated
**Recorded At:** 2026-04-01T06:03:30.406486Z
**Execution Source:** featureforge:executing-plans
**Task Number:** 3
**Step Number:** 3
**Packet Fingerprint:** ebb5d9f825181a63ee3e7932dbb7c1988d9bbd417520dc8bc345f7d729f99ddf
**Head SHA:** 2f97045889529eeb7d7214a0500963d34e9cf47d
**Base SHA:** 2f97045889529eeb7d7214a0500963d34e9cf47d
**Claim:** Verified command-backed replay captures deterministic verification summaries and honors --no-output without suppressing the command run itself.
**Files Proven:**
- src/execution/mutate.rs | sha256:4dc1fb491af9d06ae831b51b26ff31cc83e410fbc03c20a36b18ecb3e2a54259
- tests/plan_execution.rs | sha256:16d6e788dd8c83391c96898ba801e1e7f8ba03589a0c33802e00ef596e2814a4
**Verify Command:** cargo test --test plan_execution rebuild_
**Verification Summary:** `cargo test --test plan_execution rebuild_` -> passed: running 41 tests test rebuild_candidate_discovery_stale_targets ... ok test rebuild_candidate_discovery_source_spec_fingerprint_drift ... ok test rebuild_candidate_discovery_plan_fingerprint_drift ... ok test rebuild_candidate_discovery_unreadable_artifact ... ok test rebuild_evidence_command_shape ... ok test rebuild_candidate_filtering ... ok test rebuild_evidence_continue_on_error_clears_failed_earlier_interrupted_target ... ok test rebuild_evidence_dry_run_is_noop ... ok test rebuild_evidence_does_not_publish_contract_bound_receipts_without_active_contract ... ok test rebuild_evidence_invalid_scope ... ok test rebuild_evidence_clears_later_interrupted_step_before_reopening_earlier_target ... ok test rebuild_evidence_manual_required_default ... ok test rebuild_evidence_json_schema ... ok test rebuild_evidence_legacy_summary_command_replays ... ok test rebuild_evidence_json_output_fields ... ok test rebuild_evidence_manual_required_rerun_resumes_open_step ... ok test rebuild_evidence_manual_required_does_not_block_later_command_targets ... ok test rebuild_evidence_noop_refreshes_receipt_only_strategy_checkpoint_drift ... ok test rebuild_evidence_rejects_parallel_max_jobs ... ok test rebuild_evidence_rejects_zero_max_jobs ... ok test rebuild_evidence_refreshes_prior_task_closure_receipts_across_tasks ... ok test rebuild_evidence_scope_empty ... ok test rebuild_evidence_refreshes_preflight_acceptance_before_task_boundary_receipt_recovery ... ok test rebuild_evidence_refreshes_malformed_prior_task_review_receipt_before_task_boundary_retry ... ok test rebuild_evidence_refreshes_non_independent_prior_task_review_receipt_before_task_boundary_retry ... ok test rebuild_evidence_session_not_found ... ok test rebuild_evidence_reuses_active_contract_for_serial_unit_review_receipts ... ok test rebuild_evidence_restores_post_execution_state_when_prior_task_review_dispatch_missing ... ok test rebuild_evidence_state_transition_blocked_rerun_resumes_open_step ... ok test rebuild_evidence_text_output_summary ... ok test rebuild_evidence_verify_command_failed_rerun_resumes_open_step ... ok test rebuild_executor_no_output_summary ... ok test rebuild_evidence_partial_failure_resume ... ok test rebuild_executor_reopens_and_recompletes ... ok test rebuild_evidence_text_failure_output ... ok test rebuild_state_transition_retry_rehydrates_verify_command ... ok test rebuild_target_race_detected ... ok test rebuild_target_state_transition_blocked ... ok test rebuild_target_race_retries_and_rehydrates_verify_command ... ok test rebuild_evidence_noop_and_partial_failures ... ok test rebuild_evidence_exit_statuses ... ok test result: ok. 41 passed; 0 failed; 0 ignored; 0 measured; 180 filtered out; finished in 6.56s
**Invalidation Reason:** Evidence rebuild: plan_fingerprint_mismatch

#### Attempt 4
**Status:** Completed
**Recorded At:** 2026-04-01T06:03:37.014607Z
**Execution Source:** featureforge:executing-plans
**Task Number:** 3
**Step Number:** 3
**Packet Fingerprint:** d096fefa98162be3047730a06f0244bf05ce24909d617b696e9ae472a11833d4
**Head SHA:** 3cb97e9af57fb687bc8b01d3be18664e28101118
**Base SHA:** 3cb97e9af57fb687bc8b01d3be18664e28101118
**Claim:** Verified command-backed replay captures deterministic verification summaries and honors --no-output without suppressing the command run itself.
**Files Proven:**
- src/execution/mutate.rs | sha256:41a1c51647a67eb2deac38823562f6345bff4e3040a2cc9a8eec47e75561d650
- tests/plan_execution.rs | sha256:cee706e9b3195e2468b78c09114b0752288fc66ce6af374795ed37047177f995
**Verify Command:** cargo test --test plan_execution rebuild_
**Verification Summary:** `cargo test --test plan_execution rebuild_` -> passed: running 48 tests test rebuild_candidate_discovery_stale_targets ... ok test rebuild_candidate_discovery_source_spec_fingerprint_drift ... ok test rebuild_candidate_discovery_unreadable_artifact ... ok test rebuild_candidate_filtering ... ok test rebuild_evidence_command_shape ... ok test rebuild_candidate_discovery_plan_fingerprint_drift ... ok test rebuild_evidence_continue_on_error_clears_failed_earlier_interrupted_target ... ok test rebuild_evidence_dry_run_is_noop ... ok test rebuild_evidence_does_not_publish_contract_bound_receipts_without_active_contract ... ok test rebuild_evidence_invalid_scope ... ok test rebuild_evidence_clears_later_interrupted_step_before_reopening_earlier_target ... ok test rebuild_evidence_manual_required_default ... ok test rebuild_evidence_json_schema ... ok test rebuild_evidence_json_output_fields ... ok test rebuild_evidence_legacy_summary_command_replays ... ok test rebuild_evidence_manual_required_rerun_resumes_open_step ... ok test rebuild_evidence_manual_required_does_not_block_later_command_targets ... ok test rebuild_evidence_noop_allows_intermediate_test_plan_only_state ... ok test rebuild_evidence_noop_refreshes_receipt_only_strategy_checkpoint_drift ... ok test rebuild_evidence_manual_required_keeps_downstream_truth_stale_until_repaired ... ok test rebuild_evidence_noop_refreshes_final_review_without_requiring_release_readiness ... ok test rebuild_evidence_refreshes_malformed_prior_task_review_receipt_before_task_boundary_retry ... ok test rebuild_evidence_noop_rebinds_late_gate_artifacts_after_rebase_only_head_drift ... ok test rebuild_evidence_refreshes_prior_task_closure_receipts_across_tasks ... ok test rebuild_evidence_noop_rebinds_late_gate_artifacts_after_replayed_rebase_changes ... ok test rebuild_evidence_noop_restores_authoritative_late_gate_truth ... ok test rebuild_evidence_refreshes_preflight_acceptance_before_task_boundary_receipt_recovery ... ok test rebuild_evidence_rejects_parallel_max_jobs ... ok test rebuild_evidence_refreshes_non_independent_prior_task_review_receipt_before_task_boundary_retry ... ok test rebuild_evidence_rejects_zero_max_jobs ... ok test rebuild_evidence_partial_failure_resume ... ok test rebuild_evidence_session_not_found ... ok test rebuild_evidence_scope_empty ... ok test rebuild_evidence_state_transition_blocked_rerun_resumes_open_step ... ok test rebuild_evidence_exit_statuses ... ok test rebuild_evidence_text_output_summary ... ok test rebuild_evidence_restores_post_execution_state_when_prior_task_review_dispatch_missing ... ok test rebuild_evidence_verify_command_failed_rerun_resumes_open_step ... ok test rebuild_executor_no_output_summary ... ok test rebuild_evidence_reuses_active_contract_for_serial_unit_review_receipts ... ok test rebuild_evidence_noop_and_partial_failures ... ok test rebuild_evidence_text_failure_output ... ok test rebuild_executor_reopens_and_recompletes ... ok test rebuild_state_transition_retry_rehydrates_verify_command ... ok test rebuild_target_race_detected ... ok test rebuild_target_state_transition_blocked ... ok test rebuild_target_race_retries_and_rehydrates_verify_command ... ok test rebuild_evidence_restores_authoritative_late_gate_truth_after_successful_rebuild ... ok test result: ok. 48 passed; 0 failed; 0 ignored; 0 measured; 181 filtered out; finished in 5.78s
**Invalidation Reason:** N/A

### Task 3 Step 4
#### Attempt 1
**Status:** Invalidated
**Recorded At:** 2026-03-30T20:09:30.610574Z
**Execution Source:** featureforge:executing-plans
**Task Number:** 3
**Step Number:** 4
**Packet Fingerprint:** 15257a823fe2607e89e2e0c671ce51107695401c681558d6ea2727f2ca94d63b
**Head SHA:** 5527e0d7d94e617dc9d44b77194aa7f0a958b98d
**Base SHA:** 5527e0d7d94e617dc9d44b77194aa7f0a958b98d
**Claim:** Verified manual fallback behavior for commandless targets in both default and strict replay modes, including the strict all-manual exit mapping.
**Files Proven:**
- src/execution/mutate.rs | sha256:db8135c6f9900bab4858d58f849f858e248edb1aad43930b9cd09665000b0065
- tests/plan_execution.rs | sha256:c409ff9a72c8d06e659f48bb1f2eba1242be57d3936eb560504fa0ec783a42ab
**Verify Command:** cargo test --test plan_execution rebuild_
**Verification Summary:** `cargo test --test plan_execution rebuild_` -> 16 rebuild-focused tests passed
**Invalidation Reason:** Evidence rebuild: packet_fingerprint_mismatch

#### Attempt 2
**Status:** Invalidated
**Recorded At:** 2026-03-31T19:18:46.599978Z
**Execution Source:** featureforge:executing-plans
**Task Number:** 3
**Step Number:** 4
**Packet Fingerprint:** 6a2988bb6d4a794e42606b8f2f84ca3d052764e33c6c1681780a5e58e81b70ae
**Head SHA:** 5527e0d7d94e617dc9d44b77194aa7f0a958b98d
**Base SHA:** 5527e0d7d94e617dc9d44b77194aa7f0a958b98d
**Claim:** Verified manual fallback behavior for commandless targets in both default and strict replay modes, including the strict all-manual exit mapping.
**Files Proven:**
- src/execution/mutate.rs | sha256:af579e0936f04058ce24a5547e204c7433c24757a820161834dc6d7c4e2243c5
- tests/plan_execution.rs | sha256:c665e38721a4d0a23bbd1ea089837183e32fa1b126582b9eab792652ebf5b0f6
**Verify Command:** cargo test --test plan_execution rebuild_
**Verification Summary:** `cargo test --test plan_execution rebuild_` -> passed: running 31 tests test rebuild_evidence_command_shape ... ok test rebuild_candidate_discovery_source_spec_fingerprint_drift ... ok test rebuild_evidence_invalid_scope ... ok test rebuild_candidate_filtering ... ok test rebuild_candidate_discovery_stale_targets ... ok test rebuild_candidate_discovery_unreadable_artifact ... ok test rebuild_candidate_discovery_plan_fingerprint_drift ... ok test rebuild_evidence_json_output_fields ... ok test rebuild_evidence_dry_run_is_noop ... ok test rebuild_evidence_rejects_parallel_max_jobs ... ok test rebuild_evidence_manual_required_default ... ok test rebuild_evidence_json_schema ... ok test rebuild_evidence_legacy_summary_command_replays ... ok test rebuild_evidence_manual_required_rerun_resumes_open_step ... ok test rebuild_evidence_rejects_zero_max_jobs ... ok test rebuild_evidence_session_not_found ... ok test rebuild_evidence_scope_empty ... ok test rebuild_evidence_refreshes_prior_task_closure_receipts_across_tasks ... ok test rebuild_evidence_text_output_summary ... ok test rebuild_evidence_verify_command_failed_rerun_resumes_open_step ... ok test rebuild_evidence_state_transition_blocked_rerun_resumes_open_step ... ok test rebuild_executor_no_output_summary ... ok test rebuild_executor_reopens_and_recompletes ... ok test rebuild_evidence_text_failure_output ... ok test rebuild_state_transition_retry_rehydrates_verify_command ... ok test rebuild_target_race_detected ... ok test rebuild_target_state_transition_blocked ... ok test rebuild_target_race_retries_and_rehydrates_verify_command ... ok test rebuild_evidence_partial_failure_resume ... ok test rebuild_evidence_exit_statuses ... ok test rebuild_evidence_noop_and_partial_failures ... ok test result: ok. 31 passed; 0 failed; 0 ignored; 0 measured; 167 filtered out; finished in 3.62s
**Invalidation Reason:** Evidence rebuild: packet_fingerprint_mismatch

#### Attempt 3
**Status:** Invalidated
**Recorded At:** 2026-04-01T06:03:37.364365Z
**Execution Source:** featureforge:executing-plans
**Task Number:** 3
**Step Number:** 4
**Packet Fingerprint:** eb0921fe08e36dbc3d75c9beda76b8a7c6650e25ad7799104e9d8597bfaba19d
**Head SHA:** 2f97045889529eeb7d7214a0500963d34e9cf47d
**Base SHA:** 2f97045889529eeb7d7214a0500963d34e9cf47d
**Claim:** Verified manual fallback behavior for commandless targets in both default and strict replay modes, including the strict all-manual exit mapping.
**Files Proven:**
- src/execution/mutate.rs | sha256:4dc1fb491af9d06ae831b51b26ff31cc83e410fbc03c20a36b18ecb3e2a54259
- tests/plan_execution.rs | sha256:16d6e788dd8c83391c96898ba801e1e7f8ba03589a0c33802e00ef596e2814a4
**Verify Command:** cargo test --test plan_execution rebuild_
**Verification Summary:** `cargo test --test plan_execution rebuild_` -> passed: running 41 tests test rebuild_candidate_discovery_stale_targets ... ok test rebuild_candidate_filtering ... ok test rebuild_evidence_command_shape ... ok test rebuild_candidate_discovery_plan_fingerprint_drift ... ok test rebuild_candidate_discovery_unreadable_artifact ... ok test rebuild_candidate_discovery_source_spec_fingerprint_drift ... ok test rebuild_evidence_dry_run_is_noop ... ok test rebuild_evidence_continue_on_error_clears_failed_earlier_interrupted_target ... ok test rebuild_evidence_does_not_publish_contract_bound_receipts_without_active_contract ... ok test rebuild_evidence_invalid_scope ... ok test rebuild_evidence_clears_later_interrupted_step_before_reopening_earlier_target ... ok test rebuild_evidence_manual_required_default ... ok test rebuild_evidence_legacy_summary_command_replays ... ok test rebuild_evidence_json_schema ... ok test rebuild_evidence_json_output_fields ... ok test rebuild_evidence_manual_required_rerun_resumes_open_step ... ok test rebuild_evidence_manual_required_does_not_block_later_command_targets ... ok test rebuild_evidence_rejects_parallel_max_jobs ... ok test rebuild_evidence_noop_refreshes_receipt_only_strategy_checkpoint_drift ... ok test rebuild_evidence_rejects_zero_max_jobs ... ok test rebuild_evidence_refreshes_prior_task_closure_receipts_across_tasks ... ok test rebuild_evidence_scope_empty ... ok test rebuild_evidence_refreshes_preflight_acceptance_before_task_boundary_receipt_recovery ... ok test rebuild_evidence_refreshes_malformed_prior_task_review_receipt_before_task_boundary_retry ... ok test rebuild_evidence_refreshes_non_independent_prior_task_review_receipt_before_task_boundary_retry ... ok test rebuild_evidence_session_not_found ... ok test rebuild_evidence_restores_post_execution_state_when_prior_task_review_dispatch_missing ... ok test rebuild_evidence_reuses_active_contract_for_serial_unit_review_receipts ... ok test rebuild_evidence_state_transition_blocked_rerun_resumes_open_step ... ok test rebuild_evidence_text_output_summary ... ok test rebuild_executor_no_output_summary ... ok test rebuild_evidence_verify_command_failed_rerun_resumes_open_step ... ok test rebuild_evidence_partial_failure_resume ... ok test rebuild_evidence_text_failure_output ... ok test rebuild_executor_reopens_and_recompletes ... ok test rebuild_state_transition_retry_rehydrates_verify_command ... ok test rebuild_target_race_detected ... ok test rebuild_target_state_transition_blocked ... ok test rebuild_target_race_retries_and_rehydrates_verify_command ... ok test rebuild_evidence_exit_statuses ... ok test rebuild_evidence_noop_and_partial_failures ... ok test result: ok. 41 passed; 0 failed; 0 ignored; 0 measured; 180 filtered out; finished in 6.52s
**Invalidation Reason:** Evidence rebuild: plan_fingerprint_mismatch

#### Attempt 4
**Status:** Completed
**Recorded At:** 2026-04-01T06:03:43.976874Z
**Execution Source:** featureforge:executing-plans
**Task Number:** 3
**Step Number:** 4
**Packet Fingerprint:** daaef8b29f27a5074051f5b150edced5de0214a5b4612ca5266987d473aa3fa2
**Head SHA:** 3cb97e9af57fb687bc8b01d3be18664e28101118
**Base SHA:** 3cb97e9af57fb687bc8b01d3be18664e28101118
**Claim:** Verified manual fallback behavior for commandless targets in both default and strict replay modes, including the strict all-manual exit mapping.
**Files Proven:**
- src/execution/mutate.rs | sha256:41a1c51647a67eb2deac38823562f6345bff4e3040a2cc9a8eec47e75561d650
- tests/plan_execution.rs | sha256:cee706e9b3195e2468b78c09114b0752288fc66ce6af374795ed37047177f995
**Verify Command:** cargo test --test plan_execution rebuild_
**Verification Summary:** `cargo test --test plan_execution rebuild_` -> passed: running 48 tests test rebuild_candidate_filtering ... ok test rebuild_candidate_discovery_source_spec_fingerprint_drift ... ok test rebuild_candidate_discovery_plan_fingerprint_drift ... ok test rebuild_candidate_discovery_unreadable_artifact ... ok test rebuild_candidate_discovery_stale_targets ... ok test rebuild_evidence_command_shape ... ok test rebuild_evidence_continue_on_error_clears_failed_earlier_interrupted_target ... ok test rebuild_evidence_dry_run_is_noop ... ok test rebuild_evidence_does_not_publish_contract_bound_receipts_without_active_contract ... ok test rebuild_evidence_invalid_scope ... ok test rebuild_evidence_clears_later_interrupted_step_before_reopening_earlier_target ... ok test rebuild_evidence_manual_required_default ... ok test rebuild_evidence_json_output_fields ... ok test rebuild_evidence_json_schema ... ok test rebuild_evidence_legacy_summary_command_replays ... ok test rebuild_evidence_manual_required_does_not_block_later_command_targets ... ok test rebuild_evidence_manual_required_rerun_resumes_open_step ... ok test rebuild_evidence_noop_allows_intermediate_test_plan_only_state ... ok test rebuild_evidence_noop_refreshes_receipt_only_strategy_checkpoint_drift ... ok test rebuild_evidence_manual_required_keeps_downstream_truth_stale_until_repaired ... ok test rebuild_evidence_noop_refreshes_final_review_without_requiring_release_readiness ... ok test rebuild_evidence_refreshes_malformed_prior_task_review_receipt_before_task_boundary_retry ... ok test rebuild_evidence_noop_rebinds_late_gate_artifacts_after_rebase_only_head_drift ... ok test rebuild_evidence_refreshes_prior_task_closure_receipts_across_tasks ... ok test rebuild_evidence_noop_rebinds_late_gate_artifacts_after_replayed_rebase_changes ... ok test rebuild_evidence_noop_restores_authoritative_late_gate_truth ... ok test rebuild_evidence_refreshes_preflight_acceptance_before_task_boundary_receipt_recovery ... ok test rebuild_evidence_rejects_parallel_max_jobs ... ok test rebuild_evidence_refreshes_non_independent_prior_task_review_receipt_before_task_boundary_retry ... ok test rebuild_evidence_rejects_zero_max_jobs ... ok test rebuild_evidence_partial_failure_resume ... ok test rebuild_evidence_session_not_found ... ok test rebuild_evidence_scope_empty ... ok test rebuild_evidence_state_transition_blocked_rerun_resumes_open_step ... ok test rebuild_evidence_exit_statuses ... ok test rebuild_evidence_text_output_summary ... ok test rebuild_executor_no_output_summary ... ok test rebuild_evidence_restores_post_execution_state_when_prior_task_review_dispatch_missing ... ok test rebuild_evidence_reuses_active_contract_for_serial_unit_review_receipts ... ok test rebuild_evidence_verify_command_failed_rerun_resumes_open_step ... ok test rebuild_evidence_noop_and_partial_failures ... ok test rebuild_evidence_text_failure_output ... ok test rebuild_executor_reopens_and_recompletes ... ok test rebuild_state_transition_retry_rehydrates_verify_command ... ok test rebuild_target_race_detected ... ok test rebuild_target_state_transition_blocked ... ok test rebuild_target_race_retries_and_rehydrates_verify_command ... ok test rebuild_evidence_restores_authoritative_late_gate_truth_after_successful_rebuild ... ok test result: ok. 48 passed; 0 failed; 0 ignored; 0 measured; 181 filtered out; finished in 5.76s
**Invalidation Reason:** N/A

### Task 3 Step 5
#### Attempt 1
**Status:** Invalidated
**Recorded At:** 2026-03-30T19:31:20.898592Z
**Execution Source:** featureforge:executing-plans
**Task Number:** 3
**Step Number:** 5
**Packet Fingerprint:** a9c9e539dff783c4cf70b5f0754d40c315eae3e1156a7fb9673ba20e2cf5a37a
**Head SHA:** 5527e0d7d94e617dc9d44b77194aa7f0a958b98d
**Base SHA:** 5527e0d7d94e617dc9d44b77194aa7f0a958b98d
**Claim:** Added deterministic replay conflict coverage for state_transition_blocked and target_race outcomes under the rebuild executor.
**Files Proven:**
- src/execution/mutate.rs | sha256:db8135c6f9900bab4858d58f849f858e248edb1aad43930b9cd09665000b0065
- tests/plan_execution.rs | sha256:c409ff9a72c8d06e659f48bb1f2eba1242be57d3936eb560504fa0ec783a42ab
**Verify Command:** cargo test --test plan_execution rebuild_target_state_transition_blocked --exact && cargo test --test plan_execution rebuild_target_race_detected --exact
**Verification Summary:** `cargo test --test plan_execution rebuild_target_state_transition_blocked --exact && cargo test --test plan_execution rebuild_target_race_detected --exact` -> target_race and state_transition_blocked replay tests passed
**Invalidation Reason:** Evidence rebuild: packet_fingerprint_mismatch

#### Attempt 2
**Status:** Invalidated
**Recorded At:** 2026-03-30T20:09:34.790089Z
**Execution Source:** featureforge:executing-plans
**Task Number:** 3
**Step Number:** 5
**Packet Fingerprint:** e27f1ae04ada80ac71538a587ddf23b33e800743cb3063021fcfca9dc6153587
**Head SHA:** 5527e0d7d94e617dc9d44b77194aa7f0a958b98d
**Base SHA:** 5527e0d7d94e617dc9d44b77194aa7f0a958b98d
**Claim:** Added deterministic replay conflict coverage for state_transition_blocked and target_race outcomes under the rebuild executor.
**Files Proven:**
- src/execution/mutate.rs | sha256:12521ded0ac4b5249de119e65bfc3b0f71aad5758dede82aa0e662f406a4c6cf
- tests/plan_execution.rs | sha256:b9753e1ef63075d58f02c382eeaeb0c0b3778eddcdc6da165dbb405116df0fce
**Verify Command:** cargo test --test plan_execution -- rebuild_target_state_transition_blocked --exact && cargo test --test plan_execution -- rebuild_target_race_detected --exact
**Verification Summary:** `cargo test --test plan_execution -- rebuild_target_state_transition_blocked --exact && cargo test --test plan_execution -- rebuild_target_race_detected --exact` -> `cargo test --test plan_execution -- rebuild_target_state_transition_blocked --exact && cargo test --test plan_execution -- rebuild_target_race_detected --exact` -> target_race and state_transition_blocked replay tests passed
**Invalidation Reason:** Evidence rebuild: files_proven_drifted

#### Attempt 3
**Status:** Invalidated
**Recorded At:** 2026-03-30T21:57:32.262668Z
**Execution Source:** featureforge:executing-plans
**Task Number:** 3
**Step Number:** 5
**Packet Fingerprint:** e27f1ae04ada80ac71538a587ddf23b33e800743cb3063021fcfca9dc6153587
**Head SHA:** 5527e0d7d94e617dc9d44b77194aa7f0a958b98d
**Base SHA:** 5527e0d7d94e617dc9d44b77194aa7f0a958b98d
**Claim:** Added deterministic replay conflict coverage for state_transition_blocked and target_race outcomes under the rebuild executor.
**Files Proven:**
- src/execution/mutate.rs | sha256:af579e0936f04058ce24a5547e204c7433c24757a820161834dc6d7c4e2243c5
- tests/plan_execution.rs | sha256:c665e38721a4d0a23bbd1ea089837183e32fa1b126582b9eab792652ebf5b0f6
**Verify Command:** cargo test --test plan_execution -- rebuild_target_state_transition_blocked --exact && cargo test --test plan_execution -- rebuild_target_race_detected --exact
**Verification Summary:** `cargo test --test plan_execution -- rebuild_target_state_transition_blocked --exact && cargo test --test plan_execution -- rebuild_target_race_detected --exact` -> passed: running 1 test test rebuild_target_state_transition_blocked ... ok test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 197 filtered out; finished in 0.92s running 1 test test rebuild_target_race_detected ... ok test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 197 filtered out; finished in 0.97s
**Invalidation Reason:** Evidence rebuild: files_proven_drifted

#### Attempt 4
**Status:** Invalidated
**Recorded At:** 2026-03-31T01:09:07.033212Z
**Execution Source:** featureforge:executing-plans
**Task Number:** 3
**Step Number:** 5
**Packet Fingerprint:** e27f1ae04ada80ac71538a587ddf23b33e800743cb3063021fcfca9dc6153587
**Head SHA:** 1f93d03d042759e81f9a22b95edc26a6b8d40bdc
**Base SHA:** 1f93d03d042759e81f9a22b95edc26a6b8d40bdc
**Claim:** Added deterministic replay conflict coverage for state_transition_blocked and target_race outcomes under the rebuild executor.
**Files Proven:**
- src/execution/mutate.rs | sha256:f605424f9780df78dcabb26405aa7040592e41603298119ee8671049d05ee6c3
- tests/plan_execution.rs | sha256:61a62e274acb4404534c434fe25936e0cc9f813839631bf0de795fe3aec10d74
**Verify Command:** cargo test --test plan_execution -- rebuild_target_state_transition_blocked --exact && cargo test --test plan_execution -- rebuild_target_race_detected --exact
**Verification Summary:** `cargo test --test plan_execution -- rebuild_target_state_transition_blocked --exact && cargo test --test plan_execution -- rebuild_target_race_detected --exact` -> passed: running 1 test test rebuild_target_state_transition_blocked ... ok test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 201 filtered out; finished in 0.92s running 1 test test rebuild_target_race_detected ... ok test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 201 filtered out; finished in 0.96s
**Invalidation Reason:** Evidence rebuild: files_proven_drifted

#### Attempt 5
**Status:** Invalidated
**Recorded At:** 2026-03-31T01:15:44.193229Z
**Execution Source:** featureforge:executing-plans
**Task Number:** 3
**Step Number:** 5
**Packet Fingerprint:** e27f1ae04ada80ac71538a587ddf23b33e800743cb3063021fcfca9dc6153587
**Head SHA:** 3a6a1610f1d611a85cc50964438053167b832265
**Base SHA:** 3a6a1610f1d611a85cc50964438053167b832265
**Claim:** Added deterministic replay conflict coverage for state_transition_blocked and target_race outcomes under the rebuild executor.
**Files Proven:**
- src/execution/mutate.rs | sha256:9366214d624e2eba4d7ca4208362481ab7d5f5f3b5f2094df2873cd06551a268
- tests/plan_execution.rs | sha256:96a93d5707e93ae57952c6f9a4dd3fca6834895a936d20fb83555fc1d6969452
**Verify Command:** cargo test --test plan_execution -- rebuild_target_state_transition_blocked --exact && cargo test --test plan_execution -- rebuild_target_race_detected --exact
**Verification Summary:** `cargo test --test plan_execution -- rebuild_target_state_transition_blocked --exact && cargo test --test plan_execution -- rebuild_target_race_detected --exact` -> passed: running 1 test test rebuild_target_state_transition_blocked ... ok test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 204 filtered out; finished in 0.97s running 1 test test rebuild_target_race_detected ... ok test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 204 filtered out; finished in 0.98s
**Invalidation Reason:** Evidence rebuild: files_proven_drifted

#### Attempt 6
**Status:** Invalidated
**Recorded At:** 2026-03-31T02:18:23.669137Z
**Execution Source:** featureforge:executing-plans
**Task Number:** 3
**Step Number:** 5
**Packet Fingerprint:** e27f1ae04ada80ac71538a587ddf23b33e800743cb3063021fcfca9dc6153587
**Head SHA:** 3a6a1610f1d611a85cc50964438053167b832265
**Base SHA:** 3a6a1610f1d611a85cc50964438053167b832265
**Claim:** Added deterministic replay conflict coverage for state_transition_blocked and target_race outcomes under the rebuild executor.
**Files Proven:**
- src/execution/mutate.rs | sha256:7f1574247ca06f35ce79fdbff3de1ff9a031e4fa62184a5f1407ac6e4fdf988e
- tests/plan_execution.rs | sha256:578db96882a40e68b8415abf2a060f94780bdedb3ab0529afb3a5d00f3b848f3
**Verify Command:** cargo test --test plan_execution -- rebuild_target_state_transition_blocked --exact && cargo test --test plan_execution -- rebuild_target_race_detected --exact
**Verification Summary:** `cargo test --test plan_execution -- rebuild_target_state_transition_blocked --exact && cargo test --test plan_execution -- rebuild_target_race_detected --exact` -> passed: running 1 test test rebuild_target_state_transition_blocked ... ok test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 204 filtered out; finished in 1.22s running 1 test test rebuild_target_race_detected ... ok test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 204 filtered out; finished in 1.00s
**Invalidation Reason:** Evidence rebuild: files_proven_drifted

#### Attempt 7
**Status:** Invalidated
**Recorded At:** 2026-03-31T02:56:49.617853Z
**Execution Source:** featureforge:executing-plans
**Task Number:** 3
**Step Number:** 5
**Packet Fingerprint:** e27f1ae04ada80ac71538a587ddf23b33e800743cb3063021fcfca9dc6153587
**Head SHA:** 3a6a1610f1d611a85cc50964438053167b832265
**Base SHA:** 3a6a1610f1d611a85cc50964438053167b832265
**Claim:** Added deterministic replay conflict coverage for state_transition_blocked and target_race outcomes under the rebuild executor.
**Files Proven:**
- src/execution/mutate.rs | sha256:f6f2288d7ba4a177eea7a617121de95d94687370fd9a60f9396b486f6c3d86ae
- tests/plan_execution.rs | sha256:4fd9b03c352413cb54bbdcf1f9b35645095cce7f423c354201095f9cf5691247
**Verify Command:** cargo test --test plan_execution -- rebuild_target_state_transition_blocked --exact && cargo test --test plan_execution -- rebuild_target_race_detected --exact
**Verification Summary:** `cargo test --test plan_execution -- rebuild_target_state_transition_blocked --exact && cargo test --test plan_execution -- rebuild_target_race_detected --exact` -> passed: running 1 test test rebuild_target_state_transition_blocked ... ok test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 207 filtered out; finished in 1.03s running 1 test test rebuild_target_race_detected ... ok test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 207 filtered out; finished in 1.00s
**Invalidation Reason:** Evidence rebuild: files_proven_drifted

#### Attempt 8
**Status:** Invalidated
**Recorded At:** 2026-03-31T03:30:44.41516Z
**Execution Source:** featureforge:executing-plans
**Task Number:** 3
**Step Number:** 5
**Packet Fingerprint:** e27f1ae04ada80ac71538a587ddf23b33e800743cb3063021fcfca9dc6153587
**Head SHA:** 3a6a1610f1d611a85cc50964438053167b832265
**Base SHA:** 3a6a1610f1d611a85cc50964438053167b832265
**Claim:** Added deterministic replay conflict coverage for state_transition_blocked and target_race outcomes under the rebuild executor.
**Files Proven:**
- src/execution/mutate.rs | sha256:f321f6ecd28fc441bc557008276cb99d5e9edf95d89fe9e90558e645cf2fcda3
- tests/plan_execution.rs | sha256:e5681ed1b1658fd0badb93e2a8ddba9481a316027ea01fc313ee8f5c98fe4a3e
**Verify Command:** cargo test --test plan_execution -- rebuild_target_state_transition_blocked --exact && cargo test --test plan_execution -- rebuild_target_race_detected --exact
**Verification Summary:** `cargo test --test plan_execution -- rebuild_target_state_transition_blocked --exact && cargo test --test plan_execution -- rebuild_target_race_detected --exact` -> passed: running 1 test test rebuild_target_state_transition_blocked ... ok test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 208 filtered out; finished in 1.09s running 1 test test rebuild_target_race_detected ... ok test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 208 filtered out; finished in 1.15s
**Invalidation Reason:** Evidence rebuild: files_proven_drifted

#### Attempt 9
**Status:** Invalidated
**Recorded At:** 2026-03-31T04:03:13.908676Z
**Execution Source:** featureforge:executing-plans
**Task Number:** 3
**Step Number:** 5
**Packet Fingerprint:** e27f1ae04ada80ac71538a587ddf23b33e800743cb3063021fcfca9dc6153587
**Head SHA:** 3a6a1610f1d611a85cc50964438053167b832265
**Base SHA:** 3a6a1610f1d611a85cc50964438053167b832265
**Claim:** Added deterministic replay conflict coverage for state_transition_blocked and target_race outcomes under the rebuild executor.
**Files Proven:**
- src/execution/mutate.rs | sha256:3250918eac1e9ff2cc3cf8029b0fbe415398492b478f4380a67023c4b3df08e2
- tests/plan_execution.rs | sha256:ee07e11ff22b072a892162470aadcc88b925459e3daab7ad4e7aaee38679fe36
**Verify Command:** cargo test --test plan_execution -- rebuild_target_state_transition_blocked --exact && cargo test --test plan_execution -- rebuild_target_race_detected --exact
**Verification Summary:** `cargo test --test plan_execution -- rebuild_target_state_transition_blocked --exact && cargo test --test plan_execution -- rebuild_target_race_detected --exact` -> passed: running 1 test test rebuild_target_state_transition_blocked ... ok test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 209 filtered out; finished in 1.03s running 1 test test rebuild_target_race_detected ... ok test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 209 filtered out; finished in 0.97s
**Invalidation Reason:** Evidence rebuild: files_proven_drifted

#### Attempt 10
**Status:** Invalidated
**Recorded At:** 2026-03-31T19:18:54.692347Z
**Execution Source:** featureforge:executing-plans
**Task Number:** 3
**Step Number:** 5
**Packet Fingerprint:** e27f1ae04ada80ac71538a587ddf23b33e800743cb3063021fcfca9dc6153587
**Head SHA:** a037d0d42dcdc22779c0d9e903fe0865d4813b86
**Base SHA:** a037d0d42dcdc22779c0d9e903fe0865d4813b86
**Claim:** Added deterministic replay conflict coverage for state_transition_blocked and target_race outcomes under the rebuild executor.
**Files Proven:**
- src/execution/mutate.rs | sha256:77ebd4b0bf64be807799671be6ba4c006625ff0adbfb9b4c55e4cb5ce07ec4a8
- tests/plan_execution.rs | sha256:ee07e11ff22b072a892162470aadcc88b925459e3daab7ad4e7aaee38679fe36
**Verify Command:** cargo test --test plan_execution -- rebuild_target_state_transition_blocked --exact && cargo test --test plan_execution -- rebuild_target_race_detected --exact
**Verification Summary:** `cargo test --test plan_execution -- rebuild_target_state_transition_blocked --exact && cargo test --test plan_execution -- rebuild_target_race_detected --exact` -> passed: running 1 test test rebuild_target_state_transition_blocked ... ok test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 209 filtered out; finished in 0.94s running 1 test test rebuild_target_race_detected ... ok test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 209 filtered out; finished in 0.93s
**Invalidation Reason:** Evidence rebuild: packet_fingerprint_mismatch

#### Attempt 11
**Status:** Invalidated
**Recorded At:** 2026-03-31T21:46:02.636673Z
**Execution Source:** featureforge:executing-plans
**Task Number:** 3
**Step Number:** 5
**Packet Fingerprint:** 9dcd424770e38329269fa62e60b2e8ddfbc628cceabd46c3e90982d2822018b6
**Head SHA:** 2f97045889529eeb7d7214a0500963d34e9cf47d
**Base SHA:** 2f97045889529eeb7d7214a0500963d34e9cf47d
**Claim:** Added deterministic replay conflict coverage for state_transition_blocked and target_race outcomes under the rebuild executor.
**Files Proven:**
- src/execution/mutate.rs | sha256:4dc1fb491af9d06ae831b51b26ff31cc83e410fbc03c20a36b18ecb3e2a54259
- tests/plan_execution.rs | sha256:16d6e788dd8c83391c96898ba801e1e7f8ba03589a0c33802e00ef596e2814a4
**Verify Command:** cargo test --test plan_execution -- rebuild_target_state_transition_blocked --exact && cargo test --test plan_execution -- rebuild_target_race_detected --exact
**Verification Summary:** `cargo test --test plan_execution -- rebuild_target_state_transition_blocked --exact && cargo test --test plan_execution -- rebuild_target_race_detected --exact` -> passed: running 1 test test rebuild_target_state_transition_blocked ... ok test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 220 filtered out; finished in 1.17s running 1 test test rebuild_target_race_detected ... ok test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 220 filtered out; finished in 1.16s
**Invalidation Reason:** Evidence rebuild: files_proven_drifted

#### Attempt 12
**Status:** Invalidated
**Recorded At:** 2026-03-31T22:03:21.345728Z
**Execution Source:** featureforge:executing-plans
**Task Number:** 3
**Step Number:** 5
**Packet Fingerprint:** 9dcd424770e38329269fa62e60b2e8ddfbc628cceabd46c3e90982d2822018b6
**Head SHA:** 2f97045889529eeb7d7214a0500963d34e9cf47d
**Base SHA:** 2f97045889529eeb7d7214a0500963d34e9cf47d
**Claim:** Added deterministic replay conflict coverage for state_transition_blocked and target_race outcomes under the rebuild executor.
**Files Proven:**
- src/execution/mutate.rs | sha256:9f2086485f724b1a0d4fe117b3037dd50620865a990152055b7bca67425056ed
- tests/plan_execution.rs | sha256:80321c51e5813a2375223df35d682651d11b9de3580392a86c691b77a4845010
**Verify Command:** cargo test --test plan_execution -- rebuild_target_state_transition_blocked --exact && cargo test --test plan_execution -- rebuild_target_race_detected --exact
**Verification Summary:** `cargo test --test plan_execution -- rebuild_target_state_transition_blocked --exact && cargo test --test plan_execution -- rebuild_target_race_detected --exact` -> passed: running 1 test test rebuild_target_state_transition_blocked ... ok test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 221 filtered out; finished in 1.07s running 1 test test rebuild_target_race_detected ... ok test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 221 filtered out; finished in 1.14s
**Invalidation Reason:** Evidence rebuild: files_proven_drifted

#### Attempt 13
**Status:** Invalidated
**Recorded At:** 2026-03-31T22:58:12.029629Z
**Execution Source:** featureforge:executing-plans
**Task Number:** 3
**Step Number:** 5
**Packet Fingerprint:** 9dcd424770e38329269fa62e60b2e8ddfbc628cceabd46c3e90982d2822018b6
**Head SHA:** 2f97045889529eeb7d7214a0500963d34e9cf47d
**Base SHA:** 2f97045889529eeb7d7214a0500963d34e9cf47d
**Claim:** Added deterministic replay conflict coverage for state_transition_blocked and target_race outcomes under the rebuild executor.
**Files Proven:**
- src/execution/mutate.rs | sha256:915293bba1bf74b44c4e5f0d50eafc2c924c67621fa8f789068fb1a0e803cac1
- tests/plan_execution.rs | sha256:80321c51e5813a2375223df35d682651d11b9de3580392a86c691b77a4845010
**Verify Command:** cargo test --test plan_execution -- rebuild_target_state_transition_blocked --exact && cargo test --test plan_execution -- rebuild_target_race_detected --exact
**Verification Summary:** `cargo test --test plan_execution -- rebuild_target_state_transition_blocked --exact && cargo test --test plan_execution -- rebuild_target_race_detected --exact` -> passed: running 1 test test rebuild_target_state_transition_blocked ... ok test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 221 filtered out; finished in 1.05s running 1 test test rebuild_target_race_detected ... ok test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 221 filtered out; finished in 1.15s
**Invalidation Reason:** Evidence rebuild: files_proven_drifted

#### Attempt 14
**Status:** Invalidated
**Recorded At:** 2026-03-31T23:47:27.0384Z
**Execution Source:** featureforge:executing-plans
**Task Number:** 3
**Step Number:** 5
**Packet Fingerprint:** 9dcd424770e38329269fa62e60b2e8ddfbc628cceabd46c3e90982d2822018b6
**Head SHA:** 2f97045889529eeb7d7214a0500963d34e9cf47d
**Base SHA:** 2f97045889529eeb7d7214a0500963d34e9cf47d
**Claim:** Added deterministic replay conflict coverage for state_transition_blocked and target_race outcomes under the rebuild executor.
**Files Proven:**
- src/execution/mutate.rs | sha256:d2a5c562d52ecb0df6512328d2893445a0f6ccac68542632b9edde4e9f07b201
- tests/plan_execution.rs | sha256:fa1ea9d0d4c8771f7f8a241591a09f7553339601b85eb410bdc7ae26630f3d7c
**Verify Command:** cargo test --test plan_execution -- rebuild_target_state_transition_blocked --exact && cargo test --test plan_execution -- rebuild_target_race_detected --exact
**Verification Summary:** `cargo test --test plan_execution -- rebuild_target_state_transition_blocked --exact && cargo test --test plan_execution -- rebuild_target_race_detected --exact` -> passed: running 1 test test rebuild_target_state_transition_blocked ... ok test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 222 filtered out; finished in 0.97s running 1 test test rebuild_target_race_detected ... ok test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 222 filtered out; finished in 0.97s
**Invalidation Reason:** Evidence rebuild: files_proven_drifted

#### Attempt 15
**Status:** Invalidated
**Recorded At:** 2026-04-01T00:13:58.18412Z
**Execution Source:** featureforge:executing-plans
**Task Number:** 3
**Step Number:** 5
**Packet Fingerprint:** 9dcd424770e38329269fa62e60b2e8ddfbc628cceabd46c3e90982d2822018b6
**Head SHA:** 2f97045889529eeb7d7214a0500963d34e9cf47d
**Base SHA:** 2f97045889529eeb7d7214a0500963d34e9cf47d
**Claim:** Added deterministic replay conflict coverage for state_transition_blocked and target_race outcomes under the rebuild executor.
**Files Proven:**
- src/execution/mutate.rs | sha256:d6d368b7ce1c532095d1385e2b169f1d45e394d3012e45a58f2202590e54130d
- tests/plan_execution.rs | sha256:3160dd51010756e39f120d7bd011c8c31ca696a0f56404d7d21fd0846ec54b7a
**Verify Command:** cargo test --test plan_execution -- rebuild_target_state_transition_blocked --exact && cargo test --test plan_execution -- rebuild_target_race_detected --exact
**Verification Summary:** `cargo test --test plan_execution -- rebuild_target_state_transition_blocked --exact && cargo test --test plan_execution -- rebuild_target_race_detected --exact` -> passed: running 1 test test rebuild_target_state_transition_blocked ... ok test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 223 filtered out; finished in 0.99s running 1 test test rebuild_target_race_detected ... ok test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 223 filtered out; finished in 1.02s
**Invalidation Reason:** Evidence rebuild: files_proven_drifted

#### Attempt 16
**Status:** Invalidated
**Recorded At:** 2026-04-01T05:18:01.84024Z
**Execution Source:** featureforge:executing-plans
**Task Number:** 3
**Step Number:** 5
**Packet Fingerprint:** 9dcd424770e38329269fa62e60b2e8ddfbc628cceabd46c3e90982d2822018b6
**Head SHA:** 2f97045889529eeb7d7214a0500963d34e9cf47d
**Base SHA:** 2f97045889529eeb7d7214a0500963d34e9cf47d
**Claim:** Added deterministic replay conflict coverage for state_transition_blocked and target_race outcomes under the rebuild executor.
**Files Proven:**
- src/execution/mutate.rs | sha256:b3963f42792cf6c82d6191cb6b9e72766f118a4cf63d28f1e5a3b2ad6094d901
- tests/plan_execution.rs | sha256:50f7d7bf9a2cec97ffca9899087009a10a798c325f00c8933c4e0a7e45d90842
**Verify Command:** cargo test --test plan_execution -- rebuild_target_state_transition_blocked --exact && cargo test --test plan_execution -- rebuild_target_race_detected --exact
**Verification Summary:** `cargo test --test plan_execution -- rebuild_target_state_transition_blocked --exact && cargo test --test plan_execution -- rebuild_target_race_detected --exact` -> passed: running 1 test test rebuild_target_state_transition_blocked ... ok test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 224 filtered out; finished in 1.00s running 1 test test rebuild_target_race_detected ... ok test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 224 filtered out; finished in 0.97s
**Invalidation Reason:** Evidence rebuild: files_proven_drifted

#### Attempt 17
**Status:** Invalidated
**Recorded At:** 2026-04-01T06:03:44.373231Z
**Execution Source:** featureforge:executing-plans
**Task Number:** 3
**Step Number:** 5
**Packet Fingerprint:** 9dcd424770e38329269fa62e60b2e8ddfbc628cceabd46c3e90982d2822018b6
**Head SHA:** 2f97045889529eeb7d7214a0500963d34e9cf47d
**Base SHA:** 2f97045889529eeb7d7214a0500963d34e9cf47d
**Claim:** Added deterministic replay conflict coverage for state_transition_blocked and target_race outcomes under the rebuild executor.
**Files Proven:**
- src/execution/mutate.rs | sha256:41a1c51647a67eb2deac38823562f6345bff4e3040a2cc9a8eec47e75561d650
- tests/plan_execution.rs | sha256:cee706e9b3195e2468b78c09114b0752288fc66ce6af374795ed37047177f995
**Verify Command:** cargo test --test plan_execution -- rebuild_target_state_transition_blocked --exact && cargo test --test plan_execution -- rebuild_target_race_detected --exact
**Verification Summary:** `cargo test --test plan_execution -- rebuild_target_state_transition_blocked --exact && cargo test --test plan_execution -- rebuild_target_race_detected --exact` -> passed: running 1 test test rebuild_target_state_transition_blocked ... ok test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 228 filtered out; finished in 1.17s running 1 test test rebuild_target_race_detected ... ok test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 228 filtered out; finished in 0.93s
**Invalidation Reason:** Evidence rebuild: plan_fingerprint_mismatch

#### Attempt 18
**Status:** Completed
**Recorded At:** 2026-04-01T06:03:47.596076Z
**Execution Source:** featureforge:executing-plans
**Task Number:** 3
**Step Number:** 5
**Packet Fingerprint:** 1256942e9a198d04b2ba58e336419c54015ed4c05d6bb90f6abf64da951ebea8
**Head SHA:** 3cb97e9af57fb687bc8b01d3be18664e28101118
**Base SHA:** 3cb97e9af57fb687bc8b01d3be18664e28101118
**Claim:** Added deterministic replay conflict coverage for state_transition_blocked and target_race outcomes under the rebuild executor.
**Files Proven:**
- src/execution/mutate.rs | sha256:41a1c51647a67eb2deac38823562f6345bff4e3040a2cc9a8eec47e75561d650
- tests/plan_execution.rs | sha256:cee706e9b3195e2468b78c09114b0752288fc66ce6af374795ed37047177f995
**Verify Command:** cargo test --test plan_execution -- rebuild_target_state_transition_blocked --exact && cargo test --test plan_execution -- rebuild_target_race_detected --exact
**Verification Summary:** `cargo test --test plan_execution -- rebuild_target_state_transition_blocked --exact && cargo test --test plan_execution -- rebuild_target_race_detected --exact` -> passed: running 1 test test rebuild_target_state_transition_blocked ... ok test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 228 filtered out; finished in 0.98s running 1 test test rebuild_target_race_detected ... ok test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 228 filtered out; finished in 0.95s
**Invalidation Reason:** N/A

### Task 4 Step 1
#### Attempt 1
**Status:** Invalidated
**Recorded At:** 2026-03-30T20:09:37.682177Z
**Execution Source:** featureforge:executing-plans
**Task Number:** 4
**Step Number:** 1
**Packet Fingerprint:** 551b767dcb436e214d6250da6f22e7ae537e845088fa8d7787425c8023bd1df2
**Head SHA:** 5527e0d7d94e617dc9d44b77194aa7f0a958b98d
**Base SHA:** 5527e0d7d94e617dc9d44b77194aa7f0a958b98d
**Claim:** Expanded the rebuild exit-status coverage into a full 0/1/2/3 matrix for noop, usage failure, target failure, and strict manual-only runs.
**Files Proven:**
- tests/plan_execution.rs | sha256:600bf5a5cf08f69b7b2779a6cf9b3d42b323a1ee92b68ecf25ec84e921c67174
**Verify Command:** cargo test --test plan_execution -- rebuild_evidence_exit_statuses --exact && cargo test --test plan_execution rebuild_
**Verification Summary:** `cargo test --test plan_execution -- rebuild_evidence_exit_statuses --exact && cargo test --test plan_execution rebuild_` -> exit-status matrix test passed and rebuild-focused suite stayed green
**Invalidation Reason:** Evidence rebuild: packet_fingerprint_mismatch

#### Attempt 2
**Status:** Invalidated
**Recorded At:** 2026-03-31T19:18:59.623556Z
**Execution Source:** featureforge:executing-plans
**Task Number:** 4
**Step Number:** 1
**Packet Fingerprint:** 69eb2d74eb98a3de4a49c543d960984e02893fc4c5a46e109cfde5c4e6693df8
**Head SHA:** 5527e0d7d94e617dc9d44b77194aa7f0a958b98d
**Base SHA:** 5527e0d7d94e617dc9d44b77194aa7f0a958b98d
**Claim:** Expanded the rebuild exit-status coverage into a full 0/1/2/3 matrix for noop, usage failure, target failure, and strict manual-only runs.
**Files Proven:**
- tests/plan_execution.rs | sha256:c665e38721a4d0a23bbd1ea089837183e32fa1b126582b9eab792652ebf5b0f6
**Verify Command:** cargo test --test plan_execution -- rebuild_evidence_exit_statuses --exact && cargo test --test plan_execution rebuild_
**Verification Summary:** `cargo test --test plan_execution -- rebuild_evidence_exit_statuses --exact && cargo test --test plan_execution rebuild_` -> passed: running 1 test test rebuild_evidence_exit_statuses ... ok test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 197 filtered out; finished in 3.29s running 31 tests test rebuild_evidence_command_shape ... ok test rebuild_candidate_filtering ... ok test rebuild_candidate_discovery_unreadable_artifact ... ok test rebuild_candidate_discovery_plan_fingerprint_drift ... ok test rebuild_evidence_invalid_scope ... ok test rebuild_candidate_discovery_stale_targets ... ok test rebuild_candidate_discovery_source_spec_fingerprint_drift ... ok test rebuild_evidence_json_output_fields ... ok test rebuild_evidence_dry_run_is_noop ... ok test rebuild_evidence_manual_required_default ... ok test rebuild_evidence_rejects_parallel_max_jobs ... ok test rebuild_evidence_json_schema ... ok test rebuild_evidence_legacy_summary_command_replays ... ok test rebuild_evidence_manual_required_rerun_resumes_open_step ... ok test rebuild_evidence_rejects_zero_max_jobs ... ok test rebuild_evidence_session_not_found ... ok test rebuild_evidence_scope_empty ... ok test rebuild_evidence_refreshes_prior_task_closure_receipts_across_tasks ... ok test rebuild_evidence_text_output_summary ... ok test rebuild_evidence_verify_command_failed_rerun_resumes_open_step ... ok test rebuild_evidence_state_transition_blocked_rerun_resumes_open_step ... ok test rebuild_executor_no_output_summary ... ok test rebuild_executor_reopens_and_recompletes ... ok test rebuild_evidence_text_failure_output ... ok test rebuild_state_transition_retry_rehydrates_verify_command ... ok test rebuild_target_race_detected ... ok test rebuild_target_race_retries_and_rehydrates_verify_command ... ok test rebuild_target_state_transition_blocked ... ok test rebuild_evidence_partial_failure_resume ... ok test rebuild_evidence_exit_statuses ... ok test rebuild_evidence_noop_and_partial_failures ... ok test result: ok. 31 passed; 0 failed; 0 ignored; 0 measured; 167 filtered out; finished in 3.50s
**Invalidation Reason:** Evidence rebuild: packet_fingerprint_mismatch

#### Attempt 3
**Status:** Invalidated
**Recorded At:** 2026-04-01T06:03:48.040682Z
**Execution Source:** featureforge:executing-plans
**Task Number:** 4
**Step Number:** 1
**Packet Fingerprint:** 9bbeeaf72924bb432f0307d1fca1a964a429f95c81ba73171e26d69434a0b5d2
**Head SHA:** 2f97045889529eeb7d7214a0500963d34e9cf47d
**Base SHA:** 2f97045889529eeb7d7214a0500963d34e9cf47d
**Claim:** Expanded the rebuild exit-status coverage into a full 0/1/2/3 matrix for noop, usage failure, target failure, and strict manual-only runs.
**Files Proven:**
- tests/plan_execution.rs | sha256:16d6e788dd8c83391c96898ba801e1e7f8ba03589a0c33802e00ef596e2814a4
**Verify Command:** cargo test --test plan_execution -- rebuild_evidence_exit_statuses --exact && cargo test --test plan_execution rebuild_
**Verification Summary:** `cargo test --test plan_execution -- rebuild_evidence_exit_statuses --exact && cargo test --test plan_execution rebuild_` -> passed: running 1 test test rebuild_evidence_exit_statuses ... ok test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 220 filtered out; finished in 5.06s running 41 tests test rebuild_candidate_discovery_plan_fingerprint_drift ... ok test rebuild_candidate_discovery_unreadable_artifact ... ok test rebuild_evidence_command_shape ... ok test rebuild_candidate_discovery_stale_targets ... ok test rebuild_candidate_filtering ... ok test rebuild_candidate_discovery_source_spec_fingerprint_drift ... ok test rebuild_evidence_continue_on_error_clears_failed_earlier_interrupted_target ... ok test rebuild_evidence_dry_run_is_noop ... ok test rebuild_evidence_does_not_publish_contract_bound_receipts_without_active_contract ... ok test rebuild_evidence_invalid_scope ... ok test rebuild_evidence_clears_later_interrupted_step_before_reopening_earlier_target ... ok test rebuild_evidence_manual_required_default ... ok test rebuild_evidence_json_schema ... ok test rebuild_evidence_json_output_fields ... ok test rebuild_evidence_legacy_summary_command_replays ... ok test rebuild_evidence_manual_required_rerun_resumes_open_step ... ok test rebuild_evidence_manual_required_does_not_block_later_command_targets ... ok test rebuild_evidence_rejects_parallel_max_jobs ... ok test rebuild_evidence_noop_refreshes_receipt_only_strategy_checkpoint_drift ... ok test rebuild_evidence_rejects_zero_max_jobs ... ok test rebuild_evidence_refreshes_prior_task_closure_receipts_across_tasks ... ok test rebuild_evidence_scope_empty ... ok test rebuild_evidence_refreshes_preflight_acceptance_before_task_boundary_receipt_recovery ... ok test rebuild_evidence_refreshes_malformed_prior_task_review_receipt_before_task_boundary_retry ... ok test rebuild_evidence_refreshes_non_independent_prior_task_review_receipt_before_task_boundary_retry ... ok test rebuild_evidence_session_not_found ... ok test rebuild_evidence_restores_post_execution_state_when_prior_task_review_dispatch_missing ... ok test rebuild_evidence_reuses_active_contract_for_serial_unit_review_receipts ... ok test rebuild_evidence_state_transition_blocked_rerun_resumes_open_step ... ok test rebuild_evidence_text_output_summary ... ok test rebuild_evidence_verify_command_failed_rerun_resumes_open_step ... ok test rebuild_executor_no_output_summary ... ok test rebuild_evidence_partial_failure_resume ... ok test rebuild_evidence_text_failure_output ... ok test rebuild_executor_reopens_and_recompletes ... ok test rebuild_state_transition_retry_rehydrates_verify_command ... ok test rebuild_target_race_detected ... ok test rebuild_target_state_transition_blocked ... ok test rebuild_target_race_retries_and_rehydrates_verify_command ... ok test rebuild_evidence_noop_and_partial_failures ... ok test rebuild_evidence_exit_statuses ... ok test result: ok. 41 passed; 0 failed; 0 ignored; 0 measured; 180 filtered out; finished in 7.73s
**Invalidation Reason:** Evidence rebuild: plan_fingerprint_mismatch

#### Attempt 4
**Status:** Completed
**Recorded At:** 2026-04-01T06:03:58.470592Z
**Execution Source:** featureforge:executing-plans
**Task Number:** 4
**Step Number:** 1
**Packet Fingerprint:** 2ad9ba06a311b55a15c57f500bec0a7dc7f8553445b4f8e19e9b521349756708
**Head SHA:** 3cb97e9af57fb687bc8b01d3be18664e28101118
**Base SHA:** 3cb97e9af57fb687bc8b01d3be18664e28101118
**Claim:** Expanded the rebuild exit-status coverage into a full 0/1/2/3 matrix for noop, usage failure, target failure, and strict manual-only runs.
**Files Proven:**
- tests/plan_execution.rs | sha256:cee706e9b3195e2468b78c09114b0752288fc66ce6af374795ed37047177f995
**Verify Command:** cargo test --test plan_execution -- rebuild_evidence_exit_statuses --exact && cargo test --test plan_execution rebuild_
**Verification Summary:** `cargo test --test plan_execution -- rebuild_evidence_exit_statuses --exact && cargo test --test plan_execution rebuild_` -> passed: running 1 test test rebuild_evidence_exit_statuses ... ok test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 228 filtered out; finished in 3.31s running 48 tests test rebuild_evidence_command_shape ... ok test rebuild_candidate_discovery_stale_targets ... ok test rebuild_candidate_discovery_unreadable_artifact ... ok test rebuild_candidate_discovery_source_spec_fingerprint_drift ... ok test rebuild_candidate_discovery_plan_fingerprint_drift ... ok test rebuild_candidate_filtering ... ok test rebuild_evidence_continue_on_error_clears_failed_earlier_interrupted_target ... ok test rebuild_evidence_dry_run_is_noop ... ok test rebuild_evidence_does_not_publish_contract_bound_receipts_without_active_contract ... ok test rebuild_evidence_invalid_scope ... ok test rebuild_evidence_clears_later_interrupted_step_before_reopening_earlier_target ... ok test rebuild_evidence_manual_required_default ... ok test rebuild_evidence_json_output_fields ... ok test rebuild_evidence_legacy_summary_command_replays ... ok test rebuild_evidence_json_schema ... ok test rebuild_evidence_manual_required_rerun_resumes_open_step ... ok test rebuild_evidence_manual_required_does_not_block_later_command_targets ... ok test rebuild_evidence_noop_allows_intermediate_test_plan_only_state ... ok test rebuild_evidence_noop_refreshes_receipt_only_strategy_checkpoint_drift ... ok test rebuild_evidence_manual_required_keeps_downstream_truth_stale_until_repaired ... ok test rebuild_evidence_noop_refreshes_final_review_without_requiring_release_readiness ... ok test rebuild_evidence_refreshes_malformed_prior_task_review_receipt_before_task_boundary_retry ... ok test rebuild_evidence_noop_rebinds_late_gate_artifacts_after_rebase_only_head_drift ... ok test rebuild_evidence_refreshes_prior_task_closure_receipts_across_tasks ... ok test rebuild_evidence_noop_rebinds_late_gate_artifacts_after_replayed_rebase_changes ... ok test rebuild_evidence_noop_restores_authoritative_late_gate_truth ... ok test rebuild_evidence_rejects_parallel_max_jobs ... ok test rebuild_evidence_refreshes_preflight_acceptance_before_task_boundary_receipt_recovery ... ok test rebuild_evidence_refreshes_non_independent_prior_task_review_receipt_before_task_boundary_retry ... ok test rebuild_evidence_rejects_zero_max_jobs ... ok test rebuild_evidence_session_not_found ... ok test rebuild_evidence_partial_failure_resume ... ok test rebuild_evidence_scope_empty ... ok test rebuild_evidence_state_transition_blocked_rerun_resumes_open_step ... ok test rebuild_evidence_exit_statuses ... ok test rebuild_evidence_restores_post_execution_state_when_prior_task_review_dispatch_missing ... ok test rebuild_evidence_reuses_active_contract_for_serial_unit_review_receipts ... ok test rebuild_evidence_text_output_summary ... ok test rebuild_evidence_verify_command_failed_rerun_resumes_open_step ... ok test rebuild_executor_no_output_summary ... ok test rebuild_evidence_noop_and_partial_failures ... ok test rebuild_evidence_text_failure_output ... ok test rebuild_executor_reopens_and_recompletes ... ok test rebuild_state_transition_retry_rehydrates_verify_command ... ok test rebuild_evidence_restores_authoritative_late_gate_truth_after_successful_rebuild ... ok test rebuild_target_state_transition_blocked ... ok test rebuild_target_race_detected ... ok test rebuild_target_race_retries_and_rehydrates_verify_command ... ok test result: ok. 48 passed; 0 failed; 0 ignored; 0 measured; 181 filtered out; finished in 5.91s
**Invalidation Reason:** N/A

### Task 4 Step 2
#### Attempt 1
**Status:** Invalidated
**Recorded At:** 2026-03-30T20:09:45.353902Z
**Execution Source:** featureforge:executing-plans
**Task Number:** 4
**Step Number:** 2
**Packet Fingerprint:** 660627025f36b5b2c05997bd5354c9b5097478772f07a78d325f281825b41a2d
**Head SHA:** 5527e0d7d94e617dc9d44b77194aa7f0a958b98d
**Base SHA:** 5527e0d7d94e617dc9d44b77194aa7f0a958b98d
**Claim:** Implemented deterministic text-mode rebuild output with a stable summary line and per-target records while preserving the existing JSON path.
**Files Proven:**
- src/execution/state.rs | sha256:9571a25d89581fdff88109dbbc51d574fb97e48e9b79d5e5aec3fc8ed23785d9
- src/lib.rs | sha256:f790422e917486ac21a1b79968185d802c45f20db1836b96d46b1a70ef32734f
- tests/plan_execution.rs | sha256:1239d9b90c491844d34f2f5b146bf0b0fb0e9801fb42338c6ffac34e615789be
**Verify Command:** cargo test --test plan_execution -- rebuild_evidence_text_output_summary --exact && cargo test --test plan_execution rebuild_
**Verification Summary:** `cargo test --test plan_execution -- rebuild_evidence_text_output_summary --exact && cargo test --test plan_execution rebuild_` -> text output summary test passed and rebuild-focused suite stayed green
**Invalidation Reason:** Evidence rebuild: packet_fingerprint_mismatch

#### Attempt 2
**Status:** Invalidated
**Recorded At:** 2026-03-30T21:03:07.249741Z
**Execution Source:** featureforge:executing-plans
**Task Number:** 4
**Step Number:** 2
**Packet Fingerprint:** 9b272c957cdc521d32b7bdf99a92813fcb09a439ff2f86577174775e29ab116f
**Head SHA:** 5527e0d7d94e617dc9d44b77194aa7f0a958b98d
**Base SHA:** 5527e0d7d94e617dc9d44b77194aa7f0a958b98d
**Claim:** Implemented deterministic text-mode rebuild output with a stable summary line and per-target records while preserving the existing JSON path.
**Files Proven:**
- src/execution/state.rs | sha256:b88d17aadff261f4bb3c478a552753c214d707adfad86302d15ebe9f5eb914c7
- src/lib.rs | sha256:b19fa24d1ec5ef880a8d30ad4f807296b04b6d71889443607014fb213f9cb567
- tests/plan_execution.rs | sha256:c665e38721a4d0a23bbd1ea089837183e32fa1b126582b9eab792652ebf5b0f6
**Verify Command:** cargo test --test plan_execution -- rebuild_evidence_text_output_summary --exact && cargo test --test plan_execution rebuild_
**Verification Summary:** `cargo test --test plan_execution -- rebuild_evidence_text_output_summary --exact && cargo test --test plan_execution rebuild_` -> passed: running 1 test test rebuild_evidence_text_output_summary ... ok test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 197 filtered out; finished in 1.03s running 31 tests test rebuild_evidence_invalid_scope ... ok test rebuild_candidate_discovery_source_spec_fingerprint_drift ... ok test rebuild_candidate_discovery_unreadable_artifact ... ok test rebuild_candidate_discovery_stale_targets ... ok test rebuild_evidence_command_shape ... ok test rebuild_candidate_filtering ... ok test rebuild_candidate_discovery_plan_fingerprint_drift ... ok test rebuild_evidence_json_output_fields ... ok test rebuild_evidence_dry_run_is_noop ... ok test rebuild_evidence_rejects_parallel_max_jobs ... ok test rebuild_evidence_manual_required_default ... ok test rebuild_evidence_json_schema ... ok test rebuild_evidence_legacy_summary_command_replays ... ok test rebuild_evidence_rejects_zero_max_jobs ... ok test rebuild_evidence_manual_required_rerun_resumes_open_step ... ok test rebuild_evidence_session_not_found ... ok test rebuild_evidence_scope_empty ... ok test rebuild_evidence_refreshes_prior_task_closure_receipts_across_tasks ... ok test rebuild_evidence_text_output_summary ... ok test rebuild_evidence_verify_command_failed_rerun_resumes_open_step ... ok test rebuild_evidence_state_transition_blocked_rerun_resumes_open_step ... ok test rebuild_executor_no_output_summary ... ok test rebuild_executor_reopens_and_recompletes ... ok test rebuild_evidence_text_failure_output ... ok test rebuild_state_transition_retry_rehydrates_verify_command ... ok test rebuild_target_race_detected ... ok test rebuild_target_race_retries_and_rehydrates_verify_command ... ok test rebuild_target_state_transition_blocked ... ok test rebuild_evidence_partial_failure_resume ... ok test rebuild_evidence_exit_statuses ... ok test rebuild_evidence_noop_and_partial_failures ... ok test result: ok. 31 passed; 0 failed; 0 ignored; 0 measured; 167 filtered out; finished in 3.49s
**Invalidation Reason:** Evidence rebuild: files_proven_drifted

#### Attempt 3
**Status:** Invalidated
**Recorded At:** 2026-03-30T21:57:35.167763Z
**Execution Source:** featureforge:executing-plans
**Task Number:** 4
**Step Number:** 2
**Packet Fingerprint:** 9b272c957cdc521d32b7bdf99a92813fcb09a439ff2f86577174775e29ab116f
**Head SHA:** 1f93d03d042759e81f9a22b95edc26a6b8d40bdc
**Base SHA:** 1f93d03d042759e81f9a22b95edc26a6b8d40bdc
**Claim:** Implemented deterministic text-mode rebuild output with a stable summary line and per-target records while preserving the existing JSON path.
**Files Proven:**
- src/execution/state.rs | sha256:43e2ee0438ad9f003c5d4e7704121804bb651ed4f59b6999e73d27a52b4de022
- src/lib.rs | sha256:b19fa24d1ec5ef880a8d30ad4f807296b04b6d71889443607014fb213f9cb567
- tests/plan_execution.rs | sha256:349a9525649bb6107203aaa542dd82d54a2f69a7e0ae66dbdbbdce3ae05fa70f
**Verify Command:** cargo test --test plan_execution -- rebuild_evidence_text_output_summary --exact && cargo test --test plan_execution rebuild_
**Verification Summary:** `cargo test --test plan_execution -- rebuild_evidence_text_output_summary --exact && cargo test --test plan_execution rebuild_` -> passed: running 1 test test rebuild_evidence_text_output_summary ... ok test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 199 filtered out; finished in 0.90s running 31 tests test rebuild_evidence_command_shape ... ok test rebuild_candidate_discovery_stale_targets ... ok test rebuild_evidence_invalid_scope ... ok test rebuild_candidate_discovery_unreadable_artifact ... ok test rebuild_candidate_filtering ... ok test rebuild_candidate_discovery_plan_fingerprint_drift ... ok test rebuild_candidate_discovery_source_spec_fingerprint_drift ... ok test rebuild_evidence_json_output_fields ... ok test rebuild_evidence_dry_run_is_noop ... ok test rebuild_evidence_rejects_parallel_max_jobs ... ok test rebuild_evidence_manual_required_default ... ok test rebuild_evidence_legacy_summary_command_replays ... ok test rebuild_evidence_manual_required_rerun_resumes_open_step ... ok test rebuild_evidence_json_schema ... ok test rebuild_evidence_rejects_zero_max_jobs ... ok test rebuild_evidence_session_not_found ... ok test rebuild_evidence_scope_empty ... ok test rebuild_evidence_refreshes_prior_task_closure_receipts_across_tasks ... ok test rebuild_evidence_text_output_summary ... ok test rebuild_evidence_verify_command_failed_rerun_resumes_open_step ... ok test rebuild_evidence_state_transition_blocked_rerun_resumes_open_step ... ok test rebuild_executor_no_output_summary ... ok test rebuild_executor_reopens_and_recompletes ... ok test rebuild_evidence_text_failure_output ... ok test rebuild_state_transition_retry_rehydrates_verify_command ... ok test rebuild_target_race_detected ... ok test rebuild_target_race_retries_and_rehydrates_verify_command ... ok test rebuild_target_state_transition_blocked ... ok test rebuild_evidence_partial_failure_resume ... ok test rebuild_evidence_exit_statuses ... ok test rebuild_evidence_noop_and_partial_failures ... ok test result: ok. 31 passed; 0 failed; 0 ignored; 0 measured; 169 filtered out; finished in 3.76s
**Invalidation Reason:** Evidence rebuild: files_proven_drifted

#### Attempt 4
**Status:** Invalidated
**Recorded At:** 2026-03-31T00:35:03.038641Z
**Execution Source:** featureforge:executing-plans
**Task Number:** 4
**Step Number:** 2
**Packet Fingerprint:** 9b272c957cdc521d32b7bdf99a92813fcb09a439ff2f86577174775e29ab116f
**Head SHA:** 1f93d03d042759e81f9a22b95edc26a6b8d40bdc
**Base SHA:** 1f93d03d042759e81f9a22b95edc26a6b8d40bdc
**Claim:** Implemented deterministic text-mode rebuild output with a stable summary line and per-target records while preserving the existing JSON path.
**Files Proven:**
- src/execution/state.rs | sha256:4c979e518e4fda9becc133a05b1be7ce15b38216c078c8c713380756f57c85db
- src/lib.rs | sha256:b19fa24d1ec5ef880a8d30ad4f807296b04b6d71889443607014fb213f9cb567
- tests/plan_execution.rs | sha256:61a62e274acb4404534c434fe25936e0cc9f813839631bf0de795fe3aec10d74
**Verify Command:** cargo test --test plan_execution -- rebuild_evidence_text_output_summary --exact && cargo test --test plan_execution rebuild_
**Verification Summary:** `cargo test --test plan_execution -- rebuild_evidence_text_output_summary --exact && cargo test --test plan_execution rebuild_` -> passed: running 1 test test rebuild_evidence_text_output_summary ... ok test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 201 filtered out; finished in 0.89s running 33 tests test rebuild_evidence_invalid_scope ... ok test rebuild_candidate_discovery_unreadable_artifact ... ok test rebuild_candidate_discovery_stale_targets ... ok test rebuild_candidate_discovery_source_spec_fingerprint_drift ... ok test rebuild_candidate_discovery_plan_fingerprint_drift ... ok test rebuild_candidate_filtering ... ok test rebuild_evidence_command_shape ... ok test rebuild_evidence_dry_run_is_noop ... ok test rebuild_evidence_does_not_publish_contract_bound_receipts_without_active_contract ... ok test rebuild_evidence_manual_required_default ... ok test rebuild_evidence_json_output_fields ... ok test rebuild_evidence_manual_required_rerun_resumes_open_step ... ok test rebuild_evidence_legacy_summary_command_replays ... ok test rebuild_evidence_json_schema ... ok test rebuild_evidence_rejects_parallel_max_jobs ... ok test rebuild_evidence_rejects_zero_max_jobs ... ok test rebuild_evidence_session_not_found ... ok test rebuild_evidence_scope_empty ... ok test rebuild_evidence_refreshes_prior_task_closure_receipts_across_tasks ... ok test rebuild_evidence_state_transition_blocked_rerun_resumes_open_step ... ok test rebuild_evidence_text_output_summary ... ok test rebuild_executor_no_output_summary ... ok test rebuild_evidence_verify_command_failed_rerun_resumes_open_step ... ok test rebuild_evidence_reuses_active_contract_for_serial_unit_review_receipts ... ok test rebuild_evidence_text_failure_output ... ok test rebuild_executor_reopens_and_recompletes ... ok test rebuild_state_transition_retry_rehydrates_verify_command ... ok test rebuild_evidence_partial_failure_resume ... ok test rebuild_target_race_detected ... ok test rebuild_target_state_transition_blocked ... ok test rebuild_target_race_retries_and_rehydrates_verify_command ... ok test rebuild_evidence_exit_statuses ... ok test rebuild_evidence_noop_and_partial_failures ... ok test result: ok. 33 passed; 0 failed; 0 ignored; 0 measured; 169 filtered out; finished in 3.76s
**Invalidation Reason:** Evidence rebuild: files_proven_drifted

#### Attempt 5
**Status:** Invalidated
**Recorded At:** 2026-03-31T01:51:42.13169Z
**Execution Source:** featureforge:executing-plans
**Task Number:** 4
**Step Number:** 2
**Packet Fingerprint:** 9b272c957cdc521d32b7bdf99a92813fcb09a439ff2f86577174775e29ab116f
**Head SHA:** 3a6a1610f1d611a85cc50964438053167b832265
**Base SHA:** 3a6a1610f1d611a85cc50964438053167b832265
**Claim:** Implemented deterministic text-mode rebuild output with a stable summary line and per-target records while preserving the existing JSON path.
**Files Proven:**
- src/execution/state.rs | sha256:fb21eeb768e1bf13fd46c4ad1170e8ab1c19cd6789892bc85d8bb4f8b5a1bdb6
- src/lib.rs | sha256:b19fa24d1ec5ef880a8d30ad4f807296b04b6d71889443607014fb213f9cb567
- tests/plan_execution.rs | sha256:96a93d5707e93ae57952c6f9a4dd3fca6834895a936d20fb83555fc1d6969452
**Verify Command:** cargo test --test plan_execution -- rebuild_evidence_text_output_summary --exact && cargo test --test plan_execution rebuild_
**Verification Summary:** `cargo test --test plan_execution -- rebuild_evidence_text_output_summary --exact && cargo test --test plan_execution rebuild_` -> passed: running 1 test test rebuild_evidence_text_output_summary ... ok test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 204 filtered out; finished in 0.92s running 35 tests test rebuild_candidate_discovery_stale_targets ... ok test rebuild_candidate_discovery_source_spec_fingerprint_drift ... ok test rebuild_candidate_discovery_plan_fingerprint_drift ... ok test rebuild_candidate_discovery_unreadable_artifact ... ok test rebuild_candidate_filtering ... ok test rebuild_evidence_command_shape ... ok test rebuild_evidence_dry_run_is_noop ... ok test rebuild_evidence_does_not_publish_contract_bound_receipts_without_active_contract ... ok test rebuild_evidence_invalid_scope ... ok test rebuild_evidence_clears_later_interrupted_step_before_reopening_earlier_target ... ok test rebuild_evidence_manual_required_default ... ok test rebuild_evidence_json_schema ... ok test rebuild_evidence_manual_required_rerun_resumes_open_step ... ok test rebuild_evidence_json_output_fields ... ok test rebuild_evidence_legacy_summary_command_replays ... ok test rebuild_evidence_rejects_parallel_max_jobs ... ok test rebuild_evidence_session_not_found ... ok test rebuild_evidence_rejects_zero_max_jobs ... ok test rebuild_evidence_scope_empty ... ok test rebuild_evidence_refreshes_prior_task_closure_receipts_across_tasks ... ok test rebuild_evidence_refreshes_preflight_acceptance_before_task_boundary_receipt_recovery ... ok test rebuild_evidence_text_output_summary ... ok test rebuild_evidence_verify_command_failed_rerun_resumes_open_step ... ok test rebuild_evidence_state_transition_blocked_rerun_resumes_open_step ... ok test rebuild_evidence_reuses_active_contract_for_serial_unit_review_receipts ... ok test rebuild_evidence_text_failure_output ... ok test rebuild_executor_no_output_summary ... ok test rebuild_executor_reopens_and_recompletes ... ok test rebuild_target_race_detected ... ok test rebuild_state_transition_retry_rehydrates_verify_command ... ok test rebuild_target_state_transition_blocked ... ok test rebuild_target_race_retries_and_rehydrates_verify_command ... ok test rebuild_evidence_partial_failure_resume ... ok test rebuild_evidence_exit_statuses ... ok test rebuild_evidence_noop_and_partial_failures ... ok test result: ok. 35 passed; 0 failed; 0 ignored; 0 measured; 170 filtered out; finished in 4.50s
**Invalidation Reason:** Evidence rebuild: files_proven_drifted

#### Attempt 6
**Status:** Invalidated
**Recorded At:** 2026-03-31T19:19:14.483815Z
**Execution Source:** featureforge:executing-plans
**Task Number:** 4
**Step Number:** 2
**Packet Fingerprint:** 9b272c957cdc521d32b7bdf99a92813fcb09a439ff2f86577174775e29ab116f
**Head SHA:** 3a6a1610f1d611a85cc50964438053167b832265
**Base SHA:** 3a6a1610f1d611a85cc50964438053167b832265
**Claim:** Implemented deterministic text-mode rebuild output with a stable summary line and per-target records while preserving the existing JSON path.
**Files Proven:**
- src/execution/state.rs | sha256:fd6d20278e9f5ecb97696048e8a985ba3233a78225fd4e89543a383cf93af298
- src/lib.rs | sha256:43736c7d1dcc234aaa1413b458f37b9791642d27cbf15971fc73691747c9295a
- tests/plan_execution.rs | sha256:1c9ef0d722ac2844abf382057fd3a3b921e7b41d94d78736f18a323a6f88d867
**Verify Command:** cargo test --test plan_execution -- rebuild_evidence_text_output_summary --exact && cargo test --test plan_execution rebuild_
**Verification Summary:** `cargo test --test plan_execution -- rebuild_evidence_text_output_summary --exact && cargo test --test plan_execution rebuild_` -> passed: running 1 test test rebuild_evidence_text_output_summary ... ok test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 205 filtered out; finished in 0.94s running 35 tests test rebuild_candidate_discovery_unreadable_artifact ... ok test rebuild_candidate_filtering ... ok test rebuild_evidence_command_shape ... ok test rebuild_candidate_discovery_source_spec_fingerprint_drift ... ok test rebuild_candidate_discovery_stale_targets ... ok test rebuild_candidate_discovery_plan_fingerprint_drift ... ok test rebuild_evidence_dry_run_is_noop ... ok test rebuild_evidence_does_not_publish_contract_bound_receipts_without_active_contract ... ok test rebuild_evidence_invalid_scope ... ok test rebuild_evidence_clears_later_interrupted_step_before_reopening_earlier_target ... ok test rebuild_evidence_manual_required_default ... ok test rebuild_evidence_json_schema ... ok test rebuild_evidence_legacy_summary_command_replays ... ok test rebuild_evidence_manual_required_rerun_resumes_open_step ... ok test rebuild_evidence_json_output_fields ... ok test rebuild_evidence_rejects_parallel_max_jobs ... ok test rebuild_evidence_rejects_zero_max_jobs ... ok test rebuild_evidence_session_not_found ... ok test rebuild_evidence_scope_empty ... ok test rebuild_evidence_refreshes_prior_task_closure_receipts_across_tasks ... ok test rebuild_evidence_text_output_summary ... ok test rebuild_evidence_refreshes_preflight_acceptance_before_task_boundary_receipt_recovery ... ok test rebuild_evidence_verify_command_failed_rerun_resumes_open_step ... ok test rebuild_evidence_state_transition_blocked_rerun_resumes_open_step ... ok test rebuild_evidence_reuses_active_contract_for_serial_unit_review_receipts ... ok test rebuild_evidence_text_failure_output ... ok test rebuild_executor_no_output_summary ... ok test rebuild_executor_reopens_and_recompletes ... ok test rebuild_state_transition_retry_rehydrates_verify_command ... ok test rebuild_target_state_transition_blocked ... ok test rebuild_target_race_detected ... ok test rebuild_target_race_retries_and_rehydrates_verify_command ... ok test rebuild_evidence_partial_failure_resume ... ok test rebuild_evidence_exit_statuses ... ok test rebuild_evidence_noop_and_partial_failures ... ok test result: ok. 35 passed; 0 failed; 0 ignored; 0 measured; 171 filtered out; finished in 4.01s
**Invalidation Reason:** Evidence rebuild: packet_fingerprint_mismatch

#### Attempt 7
**Status:** Invalidated
**Recorded At:** 2026-04-01T00:30:58.46705Z
**Execution Source:** featureforge:executing-plans
**Task Number:** 4
**Step Number:** 2
**Packet Fingerprint:** 161e8facafaf605eade3ec4a1a7c904827daac0e11fa1b9222733cc75910f0f9
**Head SHA:** 2f97045889529eeb7d7214a0500963d34e9cf47d
**Base SHA:** 2f97045889529eeb7d7214a0500963d34e9cf47d
**Claim:** Implemented deterministic text-mode rebuild output with a stable summary line and per-target records while preserving the existing JSON path.
**Files Proven:**
- src/execution/state.rs | sha256:a5286e2720b77da5888f2964d86f69f798f714db130e9df07e297fa13073b3e8
- src/lib.rs | sha256:054ecf4acaf515b60d966d38d95724c9cf40c445f1f7ba6c7a4465800a2d8317
- tests/plan_execution.rs | sha256:16d6e788dd8c83391c96898ba801e1e7f8ba03589a0c33802e00ef596e2814a4
**Verify Command:** cargo test --test plan_execution -- rebuild_evidence_text_output_summary --exact && cargo test --test plan_execution rebuild_
**Verification Summary:** `cargo test --test plan_execution -- rebuild_evidence_text_output_summary --exact && cargo test --test plan_execution rebuild_` -> passed: running 1 test test rebuild_evidence_text_output_summary ... ok test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 220 filtered out; finished in 1.49s running 41 tests test rebuild_candidate_discovery_plan_fingerprint_drift ... ok test rebuild_evidence_command_shape ... ok test rebuild_candidate_discovery_source_spec_fingerprint_drift ... ok test rebuild_candidate_filtering ... ok test rebuild_candidate_discovery_unreadable_artifact ... ok test rebuild_candidate_discovery_stale_targets ... ok test rebuild_evidence_continue_on_error_clears_failed_earlier_interrupted_target ... ok test rebuild_evidence_dry_run_is_noop ... ok test rebuild_evidence_does_not_publish_contract_bound_receipts_without_active_contract ... ok test rebuild_evidence_invalid_scope ... ok test rebuild_evidence_clears_later_interrupted_step_before_reopening_earlier_target ... ok test rebuild_evidence_manual_required_default ... ok test rebuild_evidence_json_output_fields ... ok test rebuild_evidence_legacy_summary_command_replays ... ok test rebuild_evidence_json_schema ... ok test rebuild_evidence_manual_required_rerun_resumes_open_step ... ok test rebuild_evidence_manual_required_does_not_block_later_command_targets ... ok test rebuild_evidence_noop_refreshes_receipt_only_strategy_checkpoint_drift ... ok test rebuild_evidence_rejects_parallel_max_jobs ... ok test rebuild_evidence_rejects_zero_max_jobs ... ok test rebuild_evidence_refreshes_prior_task_closure_receipts_across_tasks ... ok test rebuild_evidence_scope_empty ... ok test rebuild_evidence_refreshes_preflight_acceptance_before_task_boundary_receipt_recovery ... ok test rebuild_evidence_refreshes_non_independent_prior_task_review_receipt_before_task_boundary_retry ... ok test rebuild_evidence_refreshes_malformed_prior_task_review_receipt_before_task_boundary_retry ... ok test rebuild_evidence_session_not_found ... ok test rebuild_evidence_reuses_active_contract_for_serial_unit_review_receipts ... ok test rebuild_evidence_restores_post_execution_state_when_prior_task_review_dispatch_missing ... ok test rebuild_evidence_state_transition_blocked_rerun_resumes_open_step ... ok test rebuild_evidence_text_output_summary ... ok test rebuild_evidence_verify_command_failed_rerun_resumes_open_step ... ok test rebuild_executor_no_output_summary ... ok test rebuild_evidence_partial_failure_resume ... ok test rebuild_evidence_text_failure_output ... ok test rebuild_executor_reopens_and_recompletes ... ok test rebuild_state_transition_retry_rehydrates_verify_command ... ok test rebuild_target_race_detected ... ok test rebuild_target_state_transition_blocked ... ok test rebuild_target_race_retries_and_rehydrates_verify_command ... ok test rebuild_evidence_noop_and_partial_failures ... ok test rebuild_evidence_exit_statuses ... ok test result: ok. 41 passed; 0 failed; 0 ignored; 0 measured; 180 filtered out; finished in 6.52s
**Invalidation Reason:** Evidence rebuild: files_proven_drifted

#### Attempt 8
**Status:** Invalidated
**Recorded At:** 2026-04-01T06:03:58.873887Z
**Execution Source:** featureforge:executing-plans
**Task Number:** 4
**Step Number:** 2
**Packet Fingerprint:** 161e8facafaf605eade3ec4a1a7c904827daac0e11fa1b9222733cc75910f0f9
**Head SHA:** 2f97045889529eeb7d7214a0500963d34e9cf47d
**Base SHA:** 2f97045889529eeb7d7214a0500963d34e9cf47d
**Claim:** Implemented deterministic text-mode rebuild output with a stable summary line and per-target records while preserving the existing JSON path.
**Files Proven:**
- src/execution/state.rs | sha256:13a15d5260cb5e748143fc1ca617c56ec81a0ebf64d9cfb10b23aebeac3dc8c6
- src/lib.rs | sha256:054ecf4acaf515b60d966d38d95724c9cf40c445f1f7ba6c7a4465800a2d8317
- tests/plan_execution.rs | sha256:2588e9f3943f025ed73c17a6203749fc186259095ee794c8b75907c93eb5ebee
**Verify Command:** cargo test --test plan_execution -- rebuild_evidence_text_output_summary --exact && cargo test --test plan_execution rebuild_
**Verification Summary:** `cargo test --test plan_execution -- rebuild_evidence_text_output_summary --exact && cargo test --test plan_execution rebuild_` -> passed: running 1 test test rebuild_evidence_text_output_summary ... ok test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 225 filtered out; finished in 0.99s running 45 tests test rebuild_candidate_discovery_source_spec_fingerprint_drift ... ok test rebuild_candidate_discovery_plan_fingerprint_drift ... ok test rebuild_candidate_discovery_unreadable_artifact ... ok test rebuild_candidate_discovery_stale_targets ... ok test rebuild_candidate_filtering ... ok test rebuild_evidence_command_shape ... ok test rebuild_evidence_continue_on_error_clears_failed_earlier_interrupted_target ... ok test rebuild_evidence_dry_run_is_noop ... ok test rebuild_evidence_does_not_publish_contract_bound_receipts_without_active_contract ... ok test rebuild_evidence_invalid_scope ... ok test rebuild_evidence_clears_later_interrupted_step_before_reopening_earlier_target ... ok test rebuild_evidence_manual_required_default ... ok test rebuild_evidence_json_output_fields ... ok test rebuild_evidence_legacy_summary_command_replays ... ok test rebuild_evidence_json_schema ... ok test rebuild_evidence_manual_required_rerun_resumes_open_step ... ok test rebuild_evidence_manual_required_does_not_block_later_command_targets ... ok test rebuild_evidence_noop_refreshes_receipt_only_strategy_checkpoint_drift ... ok test rebuild_evidence_refreshes_malformed_prior_task_review_receipt_before_task_boundary_retry ... ok test rebuild_evidence_refreshes_preflight_acceptance_before_task_boundary_receipt_recovery ... ok test rebuild_evidence_refreshes_non_independent_prior_task_review_receipt_before_task_boundary_retry ... ok test rebuild_evidence_noop_rebinds_late_gate_artifacts_after_rebase_only_head_drift ... ok test rebuild_evidence_rejects_parallel_max_jobs ... ok test rebuild_evidence_refreshes_prior_task_closure_receipts_across_tasks ... ok test rebuild_evidence_noop_restores_authoritative_late_gate_truth ... ok test rebuild_evidence_noop_rebinds_late_gate_artifacts_after_replayed_rebase_changes ... ok test rebuild_evidence_rejects_zero_max_jobs ... ok test rebuild_evidence_session_not_found ... ok test rebuild_evidence_scope_empty ... ok test rebuild_evidence_partial_failure_resume ... ok test rebuild_evidence_state_transition_blocked_rerun_resumes_open_step ... ok test rebuild_evidence_text_output_summary ... ok test rebuild_evidence_restores_post_execution_state_when_prior_task_review_dispatch_missing ... ok test rebuild_executor_no_output_summary ... ok test rebuild_evidence_reuses_active_contract_for_serial_unit_review_receipts ... ok test rebuild_evidence_verify_command_failed_rerun_resumes_open_step ... ok test rebuild_evidence_text_failure_output ... ok test rebuild_evidence_noop_and_partial_failures ... ok test rebuild_evidence_exit_statuses ... ok test rebuild_executor_reopens_and_recompletes ... ok test rebuild_evidence_restores_authoritative_late_gate_truth_after_successful_rebuild ... ok test rebuild_state_transition_retry_rehydrates_verify_command ... ok test rebuild_target_race_detected ... ok test rebuild_target_state_transition_blocked ... ok test rebuild_target_race_retries_and_rehydrates_verify_command ... ok test result: ok. 45 passed; 0 failed; 0 ignored; 0 measured; 181 filtered out; finished in 6.54s
**Invalidation Reason:** Evidence rebuild: plan_fingerprint_mismatch

#### Attempt 9
**Status:** Completed
**Recorded At:** 2026-04-01T06:04:06.918578Z
**Execution Source:** featureforge:executing-plans
**Task Number:** 4
**Step Number:** 2
**Packet Fingerprint:** 1c94350255e16a19d014fb3d083188ea14e72de55187df45d827885f8302203d
**Head SHA:** 3cb97e9af57fb687bc8b01d3be18664e28101118
**Base SHA:** 3cb97e9af57fb687bc8b01d3be18664e28101118
**Claim:** Implemented deterministic text-mode rebuild output with a stable summary line and per-target records while preserving the existing JSON path.
**Files Proven:**
- src/execution/state.rs | sha256:13a15d5260cb5e748143fc1ca617c56ec81a0ebf64d9cfb10b23aebeac3dc8c6
- src/lib.rs | sha256:054ecf4acaf515b60d966d38d95724c9cf40c445f1f7ba6c7a4465800a2d8317
- tests/plan_execution.rs | sha256:cee706e9b3195e2468b78c09114b0752288fc66ce6af374795ed37047177f995
**Verify Command:** cargo test --test plan_execution -- rebuild_evidence_text_output_summary --exact && cargo test --test plan_execution rebuild_
**Verification Summary:** `cargo test --test plan_execution -- rebuild_evidence_text_output_summary --exact && cargo test --test plan_execution rebuild_` -> passed: running 1 test test rebuild_evidence_text_output_summary ... ok test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 228 filtered out; finished in 1.19s running 48 tests test rebuild_candidate_discovery_unreadable_artifact ... ok test rebuild_candidate_discovery_source_spec_fingerprint_drift ... ok test rebuild_candidate_discovery_stale_targets ... ok test rebuild_candidate_discovery_plan_fingerprint_drift ... ok test rebuild_candidate_filtering ... ok test rebuild_evidence_command_shape ... ok test rebuild_evidence_continue_on_error_clears_failed_earlier_interrupted_target ... ok test rebuild_evidence_dry_run_is_noop ... ok test rebuild_evidence_does_not_publish_contract_bound_receipts_without_active_contract ... ok test rebuild_evidence_invalid_scope ... ok test rebuild_evidence_clears_later_interrupted_step_before_reopening_earlier_target ... ok test rebuild_evidence_manual_required_default ... ok test rebuild_evidence_json_output_fields ... ok test rebuild_evidence_legacy_summary_command_replays ... ok test rebuild_evidence_json_schema ... ok test rebuild_evidence_manual_required_rerun_resumes_open_step ... ok test rebuild_evidence_manual_required_does_not_block_later_command_targets ... ok test rebuild_evidence_noop_allows_intermediate_test_plan_only_state ... ok test rebuild_evidence_noop_refreshes_receipt_only_strategy_checkpoint_drift ... ok test rebuild_evidence_manual_required_keeps_downstream_truth_stale_until_repaired ... ok test rebuild_evidence_noop_refreshes_final_review_without_requiring_release_readiness ... ok test rebuild_evidence_refreshes_malformed_prior_task_review_receipt_before_task_boundary_retry ... ok test rebuild_evidence_noop_rebinds_late_gate_artifacts_after_rebase_only_head_drift ... ok test rebuild_evidence_refreshes_prior_task_closure_receipts_across_tasks ... ok test rebuild_evidence_noop_restores_authoritative_late_gate_truth ... ok test rebuild_evidence_noop_rebinds_late_gate_artifacts_after_replayed_rebase_changes ... ok test rebuild_evidence_refreshes_preflight_acceptance_before_task_boundary_receipt_recovery ... ok test rebuild_evidence_rejects_parallel_max_jobs ... ok test rebuild_evidence_refreshes_non_independent_prior_task_review_receipt_before_task_boundary_retry ... ok test rebuild_evidence_rejects_zero_max_jobs ... ok test rebuild_evidence_partial_failure_resume ... ok test rebuild_evidence_scope_empty ... ok test rebuild_evidence_session_not_found ... ok test rebuild_evidence_state_transition_blocked_rerun_resumes_open_step ... ok test rebuild_evidence_exit_statuses ... ok test rebuild_evidence_restores_post_execution_state_when_prior_task_review_dispatch_missing ... ok test rebuild_evidence_noop_and_partial_failures ... ok test rebuild_evidence_text_output_summary ... ok test rebuild_evidence_reuses_active_contract_for_serial_unit_review_receipts ... ok test rebuild_executor_no_output_summary ... ok test rebuild_evidence_verify_command_failed_rerun_resumes_open_step ... ok test rebuild_evidence_text_failure_output ... ok test rebuild_executor_reopens_and_recompletes ... ok test rebuild_evidence_restores_authoritative_late_gate_truth_after_successful_rebuild ... ok test rebuild_target_state_transition_blocked ... ok test rebuild_state_transition_retry_rehydrates_verify_command ... ok test rebuild_target_race_detected ... ok test rebuild_target_race_retries_and_rehydrates_verify_command ... ok test result: ok. 48 passed; 0 failed; 0 ignored; 0 measured; 181 filtered out; finished in 5.56s
**Invalidation Reason:** N/A

### Task 4 Step 3
#### Attempt 1
**Status:** Invalidated
**Recorded At:** 2026-03-30T20:09:50.878161Z
**Execution Source:** featureforge:executing-plans
**Task Number:** 4
**Step Number:** 3
**Packet Fingerprint:** b6b7ee4660517de56ba482d02c00f2bef977222f9060e22693814815410f80cc
**Head SHA:** 5527e0d7d94e617dc9d44b77194aa7f0a958b98d
**Base SHA:** 5527e0d7d94e617dc9d44b77194aa7f0a958b98d
**Claim:** Verified the rebuild-evidence JSON output schema directly and confirmed the existing payload already includes the required top-level and per-target fields.
**Files Proven:**
- tests/plan_execution.rs | sha256:f35d3dadea80349fa6d20c8580c7b1023e9f85d7846bb542db85eadb2c2b1ecd
**Verify Command:** cargo test --test plan_execution -- rebuild_evidence_json_output_fields --exact && cargo test --test plan_execution rebuild_
**Verification Summary:** `cargo test --test plan_execution -- rebuild_evidence_json_output_fields --exact && cargo test --test plan_execution rebuild_` -> json output schema test passed and rebuild-focused suite stayed green
**Invalidation Reason:** Evidence rebuild: packet_fingerprint_mismatch

#### Attempt 2
**Status:** Invalidated
**Recorded At:** 2026-03-31T19:19:24.578686Z
**Execution Source:** featureforge:executing-plans
**Task Number:** 4
**Step Number:** 3
**Packet Fingerprint:** fb2ed2e68c1635d42530749aab8eeaff68be0e94d0873217776b8e12d9c50465
**Head SHA:** 5527e0d7d94e617dc9d44b77194aa7f0a958b98d
**Base SHA:** 5527e0d7d94e617dc9d44b77194aa7f0a958b98d
**Claim:** Verified the rebuild-evidence JSON output schema directly and confirmed the existing payload already includes the required top-level and per-target fields.
**Files Proven:**
- tests/plan_execution.rs | sha256:c665e38721a4d0a23bbd1ea089837183e32fa1b126582b9eab792652ebf5b0f6
**Verify Command:** cargo test --test plan_execution -- rebuild_evidence_json_output_fields --exact && cargo test --test plan_execution rebuild_
**Verification Summary:** `cargo test --test plan_execution -- rebuild_evidence_json_output_fields --exact && cargo test --test plan_execution rebuild_` -> passed: running 1 test test rebuild_evidence_json_output_fields ... ok test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 197 filtered out; finished in 0.88s running 31 tests test rebuild_candidate_discovery_source_spec_fingerprint_drift ... ok test rebuild_candidate_discovery_stale_targets ... ok test rebuild_evidence_invalid_scope ... ok test rebuild_evidence_command_shape ... ok test rebuild_candidate_filtering ... ok test rebuild_candidate_discovery_plan_fingerprint_drift ... ok test rebuild_candidate_discovery_unreadable_artifact ... ok test rebuild_evidence_json_output_fields ... ok test rebuild_evidence_dry_run_is_noop ... ok test rebuild_evidence_rejects_parallel_max_jobs ... ok test rebuild_evidence_manual_required_default ... ok test rebuild_evidence_legacy_summary_command_replays ... ok test rebuild_evidence_manual_required_rerun_resumes_open_step ... ok test rebuild_evidence_rejects_zero_max_jobs ... ok test rebuild_evidence_json_schema ... ok test rebuild_evidence_session_not_found ... ok test rebuild_evidence_scope_empty ... ok test rebuild_evidence_refreshes_prior_task_closure_receipts_across_tasks ... ok test rebuild_evidence_text_output_summary ... ok test rebuild_evidence_verify_command_failed_rerun_resumes_open_step ... ok test rebuild_evidence_state_transition_blocked_rerun_resumes_open_step ... ok test rebuild_executor_reopens_and_recompletes ... ok test rebuild_executor_no_output_summary ... ok test rebuild_evidence_text_failure_output ... ok test rebuild_state_transition_retry_rehydrates_verify_command ... ok test rebuild_target_race_detected ... ok test rebuild_target_race_retries_and_rehydrates_verify_command ... ok test rebuild_target_state_transition_blocked ... ok test rebuild_evidence_partial_failure_resume ... ok test rebuild_evidence_exit_statuses ... ok test rebuild_evidence_noop_and_partial_failures ... ok test result: ok. 31 passed; 0 failed; 0 ignored; 0 measured; 167 filtered out; finished in 3.48s
**Invalidation Reason:** Evidence rebuild: packet_fingerprint_mismatch

#### Attempt 3
**Status:** Invalidated
**Recorded At:** 2026-04-01T06:04:07.261016Z
**Execution Source:** featureforge:executing-plans
**Task Number:** 4
**Step Number:** 3
**Packet Fingerprint:** ae59275b8a1164a61c117b69082e4dd701e0774553772757b2f4a458a6342815
**Head SHA:** 2f97045889529eeb7d7214a0500963d34e9cf47d
**Base SHA:** 2f97045889529eeb7d7214a0500963d34e9cf47d
**Claim:** Verified the rebuild-evidence JSON output schema directly and confirmed the existing payload already includes the required top-level and per-target fields.
**Files Proven:**
- tests/plan_execution.rs | sha256:16d6e788dd8c83391c96898ba801e1e7f8ba03589a0c33802e00ef596e2814a4
**Verify Command:** cargo test --test plan_execution -- rebuild_evidence_json_output_fields --exact && cargo test --test plan_execution rebuild_
**Verification Summary:** `cargo test --test plan_execution -- rebuild_evidence_json_output_fields --exact && cargo test --test plan_execution rebuild_` -> passed: running 1 test test rebuild_evidence_json_output_fields ... ok test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 220 filtered out; finished in 1.04s running 41 tests test rebuild_candidate_discovery_unreadable_artifact ... ok test rebuild_candidate_discovery_stale_targets ... ok test rebuild_candidate_filtering ... ok test rebuild_evidence_command_shape ... ok test rebuild_candidate_discovery_plan_fingerprint_drift ... ok test rebuild_candidate_discovery_source_spec_fingerprint_drift ... ok test rebuild_evidence_continue_on_error_clears_failed_earlier_interrupted_target ... ok test rebuild_evidence_dry_run_is_noop ... ok test rebuild_evidence_does_not_publish_contract_bound_receipts_without_active_contract ... ok test rebuild_evidence_invalid_scope ... ok test rebuild_evidence_clears_later_interrupted_step_before_reopening_earlier_target ... ok test rebuild_evidence_manual_required_default ... ok test rebuild_evidence_json_output_fields ... ok test rebuild_evidence_json_schema ... ok test rebuild_evidence_legacy_summary_command_replays ... ok test rebuild_evidence_manual_required_rerun_resumes_open_step ... ok test rebuild_evidence_manual_required_does_not_block_later_command_targets ... ok test rebuild_evidence_rejects_parallel_max_jobs ... ok test rebuild_evidence_noop_refreshes_receipt_only_strategy_checkpoint_drift ... ok test rebuild_evidence_rejects_zero_max_jobs ... ok test rebuild_evidence_refreshes_prior_task_closure_receipts_across_tasks ... ok test rebuild_evidence_scope_empty ... ok test rebuild_evidence_refreshes_preflight_acceptance_before_task_boundary_receipt_recovery ... ok test rebuild_evidence_refreshes_non_independent_prior_task_review_receipt_before_task_boundary_retry ... ok test rebuild_evidence_refreshes_malformed_prior_task_review_receipt_before_task_boundary_retry ... ok test rebuild_evidence_session_not_found ... ok test rebuild_evidence_restores_post_execution_state_when_prior_task_review_dispatch_missing ... ok test rebuild_evidence_reuses_active_contract_for_serial_unit_review_receipts ... ok test rebuild_evidence_state_transition_blocked_rerun_resumes_open_step ... ok test rebuild_evidence_text_output_summary ... ok test rebuild_executor_no_output_summary ... ok test rebuild_evidence_verify_command_failed_rerun_resumes_open_step ... ok test rebuild_evidence_partial_failure_resume ... ok test rebuild_evidence_text_failure_output ... ok test rebuild_executor_reopens_and_recompletes ... ok test rebuild_state_transition_retry_rehydrates_verify_command ... ok test rebuild_target_race_detected ... ok test rebuild_target_state_transition_blocked ... ok test rebuild_target_race_retries_and_rehydrates_verify_command ... ok test rebuild_evidence_noop_and_partial_failures ... ok test rebuild_evidence_exit_statuses ... ok test result: ok. 41 passed; 0 failed; 0 ignored; 0 measured; 180 filtered out; finished in 6.67s
**Invalidation Reason:** Evidence rebuild: plan_fingerprint_mismatch

#### Attempt 4
**Status:** Completed
**Recorded At:** 2026-04-01T06:04:15.071306Z
**Execution Source:** featureforge:executing-plans
**Task Number:** 4
**Step Number:** 3
**Packet Fingerprint:** 8251809271db16987dfc81c32fbec26146133d653ea1da49be1c9124db69bf57
**Head SHA:** 3cb97e9af57fb687bc8b01d3be18664e28101118
**Base SHA:** 3cb97e9af57fb687bc8b01d3be18664e28101118
**Claim:** Verified the rebuild-evidence JSON output schema directly and confirmed the existing payload already includes the required top-level and per-target fields.
**Files Proven:**
- tests/plan_execution.rs | sha256:cee706e9b3195e2468b78c09114b0752288fc66ce6af374795ed37047177f995
**Verify Command:** cargo test --test plan_execution -- rebuild_evidence_json_output_fields --exact && cargo test --test plan_execution rebuild_
**Verification Summary:** `cargo test --test plan_execution -- rebuild_evidence_json_output_fields --exact && cargo test --test plan_execution rebuild_` -> passed: running 1 test test rebuild_evidence_json_output_fields ... ok test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 228 filtered out; finished in 0.91s running 48 tests test rebuild_candidate_discovery_source_spec_fingerprint_drift ... ok test rebuild_candidate_discovery_unreadable_artifact ... ok test rebuild_evidence_command_shape ... ok test rebuild_candidate_filtering ... ok test rebuild_candidate_discovery_stale_targets ... ok test rebuild_candidate_discovery_plan_fingerprint_drift ... ok test rebuild_evidence_continue_on_error_clears_failed_earlier_interrupted_target ... ok test rebuild_evidence_dry_run_is_noop ... ok test rebuild_evidence_does_not_publish_contract_bound_receipts_without_active_contract ... ok test rebuild_evidence_invalid_scope ... ok test rebuild_evidence_clears_later_interrupted_step_before_reopening_earlier_target ... ok test rebuild_evidence_manual_required_default ... ok test rebuild_evidence_json_output_fields ... ok test rebuild_evidence_json_schema ... ok test rebuild_evidence_legacy_summary_command_replays ... ok test rebuild_evidence_manual_required_rerun_resumes_open_step ... ok test rebuild_evidence_manual_required_does_not_block_later_command_targets ... ok test rebuild_evidence_noop_allows_intermediate_test_plan_only_state ... ok test rebuild_evidence_noop_refreshes_receipt_only_strategy_checkpoint_drift ... ok test rebuild_evidence_manual_required_keeps_downstream_truth_stale_until_repaired ... ok test rebuild_evidence_noop_refreshes_final_review_without_requiring_release_readiness ... ok test rebuild_evidence_refreshes_malformed_prior_task_review_receipt_before_task_boundary_retry ... ok test rebuild_evidence_noop_rebinds_late_gate_artifacts_after_rebase_only_head_drift ... ok test rebuild_evidence_refreshes_prior_task_closure_receipts_across_tasks ... ok test rebuild_evidence_noop_rebinds_late_gate_artifacts_after_replayed_rebase_changes ... ok test rebuild_evidence_noop_restores_authoritative_late_gate_truth ... ok test rebuild_evidence_refreshes_preflight_acceptance_before_task_boundary_receipt_recovery ... ok test rebuild_evidence_rejects_parallel_max_jobs ... ok test rebuild_evidence_refreshes_non_independent_prior_task_review_receipt_before_task_boundary_retry ... ok test rebuild_evidence_rejects_zero_max_jobs ... ok test rebuild_evidence_partial_failure_resume ... ok test rebuild_evidence_session_not_found ... ok test rebuild_evidence_scope_empty ... ok test rebuild_evidence_state_transition_blocked_rerun_resumes_open_step ... ok test rebuild_evidence_exit_statuses ... ok test rebuild_evidence_text_output_summary ... ok test rebuild_evidence_restores_post_execution_state_when_prior_task_review_dispatch_missing ... ok test rebuild_evidence_reuses_active_contract_for_serial_unit_review_receipts ... ok test rebuild_evidence_noop_and_partial_failures ... ok test rebuild_executor_no_output_summary ... ok test rebuild_evidence_verify_command_failed_rerun_resumes_open_step ... ok test rebuild_evidence_text_failure_output ... ok test rebuild_executor_reopens_and_recompletes ... ok test rebuild_state_transition_retry_rehydrates_verify_command ... ok test rebuild_evidence_restores_authoritative_late_gate_truth_after_successful_rebuild ... ok test rebuild_target_race_detected ... ok test rebuild_target_state_transition_blocked ... ok test rebuild_target_race_retries_and_rehydrates_verify_command ... ok test result: ok. 48 passed; 0 failed; 0 ignored; 0 measured; 181 filtered out; finished in 5.59s
**Invalidation Reason:** N/A

### Task 4 Step 4
#### Attempt 1
**Status:** Invalidated
**Recorded At:** 2026-03-30T20:09:56.262716Z
**Execution Source:** featureforge:executing-plans
**Task Number:** 4
**Step Number:** 4
**Packet Fingerprint:** 9d84e1e2cebc3c03dd2c4ba7f1b7d26d230f7b69e8e2249c212aba655bbaf37f
**Head SHA:** 5527e0d7d94e617dc9d44b77194aa7f0a958b98d
**Base SHA:** 5527e0d7d94e617dc9d44b77194aa7f0a958b98d
**Claim:** Added consolidated no-op and partial-failure output coverage, including persistent target_race, verify_command_failed, strict manual-only exit 3, and unsupported max-jobs rejection.
**Files Proven:**
- tests/plan_execution.rs | sha256:ed16ae844292b37b7c443995ecb5ca0e5edecdeb39466c6e7d97fac4b30719d7
**Verify Command:** cargo test --test plan_execution -- rebuild_evidence_noop_and_partial_failures --exact && cargo test --test plan_execution rebuild_
**Verification Summary:** `cargo test --test plan_execution -- rebuild_evidence_noop_and_partial_failures --exact && cargo test --test plan_execution rebuild_` -> consolidated output regression passed and rebuild-focused suite stayed green
**Invalidation Reason:** Evidence rebuild: packet_fingerprint_mismatch

#### Attempt 2
**Status:** Invalidated
**Recorded At:** 2026-03-31T19:19:34.290663Z
**Execution Source:** featureforge:executing-plans
**Task Number:** 4
**Step Number:** 4
**Packet Fingerprint:** 631f91c38d1035cf245105e5ffa1e4f5c35e300ca6dd7e8757c6635d5ed64dfa
**Head SHA:** 5527e0d7d94e617dc9d44b77194aa7f0a958b98d
**Base SHA:** 5527e0d7d94e617dc9d44b77194aa7f0a958b98d
**Claim:** Added consolidated no-op and partial-failure output coverage, including persistent target_race, verify_command_failed, strict manual-only exit 3, and unsupported max-jobs rejection.
**Files Proven:**
- tests/plan_execution.rs | sha256:c665e38721a4d0a23bbd1ea089837183e32fa1b126582b9eab792652ebf5b0f6
**Verify Command:** cargo test --test plan_execution -- rebuild_evidence_noop_and_partial_failures --exact && cargo test --test plan_execution rebuild_
**Verification Summary:** `cargo test --test plan_execution -- rebuild_evidence_noop_and_partial_failures --exact && cargo test --test plan_execution rebuild_` -> passed: running 1 test test rebuild_evidence_noop_and_partial_failures ... ok test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 197 filtered out; finished in 2.96s running 31 tests test rebuild_candidate_discovery_stale_targets ... ok test rebuild_candidate_filtering ... ok test rebuild_candidate_discovery_unreadable_artifact ... ok test rebuild_candidate_discovery_source_spec_fingerprint_drift ... ok test rebuild_candidate_discovery_plan_fingerprint_drift ... ok test rebuild_evidence_invalid_scope ... ok test rebuild_evidence_command_shape ... ok test rebuild_evidence_json_output_fields ... ok test rebuild_evidence_dry_run_is_noop ... ok test rebuild_evidence_rejects_parallel_max_jobs ... ok test rebuild_evidence_manual_required_default ... ok test rebuild_evidence_legacy_summary_command_replays ... ok test rebuild_evidence_manual_required_rerun_resumes_open_step ... ok test rebuild_evidence_json_schema ... ok test rebuild_evidence_rejects_zero_max_jobs ... ok test rebuild_evidence_scope_empty ... ok test rebuild_evidence_session_not_found ... ok test rebuild_evidence_refreshes_prior_task_closure_receipts_across_tasks ... ok test rebuild_evidence_text_output_summary ... ok test rebuild_evidence_verify_command_failed_rerun_resumes_open_step ... ok test rebuild_evidence_state_transition_blocked_rerun_resumes_open_step ... ok test rebuild_executor_no_output_summary ... ok test rebuild_executor_reopens_and_recompletes ... ok test rebuild_evidence_text_failure_output ... ok test rebuild_state_transition_retry_rehydrates_verify_command ... ok test rebuild_target_state_transition_blocked ... ok test rebuild_target_race_detected ... ok test rebuild_target_race_retries_and_rehydrates_verify_command ... ok test rebuild_evidence_partial_failure_resume ... ok test rebuild_evidence_exit_statuses ... ok test rebuild_evidence_noop_and_partial_failures ... ok test result: ok. 31 passed; 0 failed; 0 ignored; 0 measured; 167 filtered out; finished in 3.45s
**Invalidation Reason:** Evidence rebuild: packet_fingerprint_mismatch

#### Attempt 3
**Status:** Invalidated
**Recorded At:** 2026-04-01T06:04:15.445415Z
**Execution Source:** featureforge:executing-plans
**Task Number:** 4
**Step Number:** 4
**Packet Fingerprint:** c10898ee49f7ef9312ef9cdf97f680647485ee029d1ec11401148153ca905d05
**Head SHA:** 2f97045889529eeb7d7214a0500963d34e9cf47d
**Base SHA:** 2f97045889529eeb7d7214a0500963d34e9cf47d
**Claim:** Added consolidated no-op and partial-failure output coverage, including persistent target_race, verify_command_failed, strict manual-only exit 3, and unsupported max-jobs rejection.
**Files Proven:**
- tests/plan_execution.rs | sha256:16d6e788dd8c83391c96898ba801e1e7f8ba03589a0c33802e00ef596e2814a4
**Verify Command:** cargo test --test plan_execution -- rebuild_evidence_noop_and_partial_failures --exact && cargo test --test plan_execution rebuild_
**Verification Summary:** `cargo test --test plan_execution -- rebuild_evidence_noop_and_partial_failures --exact && cargo test --test plan_execution rebuild_` -> passed: running 1 test test rebuild_evidence_noop_and_partial_failures ... ok test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 220 filtered out; finished in 4.49s running 41 tests test rebuild_candidate_discovery_source_spec_fingerprint_drift ... ok test rebuild_candidate_discovery_stale_targets ... ok test rebuild_evidence_command_shape ... ok test rebuild_candidate_discovery_unreadable_artifact ... ok test rebuild_candidate_discovery_plan_fingerprint_drift ... ok test rebuild_candidate_filtering ... ok test rebuild_evidence_continue_on_error_clears_failed_earlier_interrupted_target ... ok test rebuild_evidence_dry_run_is_noop ... ok test rebuild_evidence_does_not_publish_contract_bound_receipts_without_active_contract ... ok test rebuild_evidence_invalid_scope ... ok test rebuild_evidence_clears_later_interrupted_step_before_reopening_earlier_target ... ok test rebuild_evidence_manual_required_default ... ok test rebuild_evidence_json_schema ... ok test rebuild_evidence_legacy_summary_command_replays ... ok test rebuild_evidence_json_output_fields ... ok test rebuild_evidence_manual_required_rerun_resumes_open_step ... ok test rebuild_evidence_manual_required_does_not_block_later_command_targets ... ok test rebuild_evidence_rejects_parallel_max_jobs ... ok test rebuild_evidence_noop_refreshes_receipt_only_strategy_checkpoint_drift ... ok test rebuild_evidence_rejects_zero_max_jobs ... ok test rebuild_evidence_refreshes_prior_task_closure_receipts_across_tasks ... ok test rebuild_evidence_scope_empty ... ok test rebuild_evidence_refreshes_preflight_acceptance_before_task_boundary_receipt_recovery ... ok test rebuild_evidence_refreshes_malformed_prior_task_review_receipt_before_task_boundary_retry ... ok test rebuild_evidence_refreshes_non_independent_prior_task_review_receipt_before_task_boundary_retry ... ok test rebuild_evidence_session_not_found ... ok test rebuild_evidence_restores_post_execution_state_when_prior_task_review_dispatch_missing ... ok test rebuild_evidence_reuses_active_contract_for_serial_unit_review_receipts ... ok test rebuild_evidence_state_transition_blocked_rerun_resumes_open_step ... ok test rebuild_evidence_text_output_summary ... ok test rebuild_evidence_verify_command_failed_rerun_resumes_open_step ... ok test rebuild_executor_no_output_summary ... ok test rebuild_evidence_partial_failure_resume ... ok test rebuild_executor_reopens_and_recompletes ... ok test rebuild_evidence_text_failure_output ... ok test rebuild_state_transition_retry_rehydrates_verify_command ... ok test rebuild_target_race_detected ... ok test rebuild_target_state_transition_blocked ... ok test rebuild_target_race_retries_and_rehydrates_verify_command ... ok test rebuild_evidence_noop_and_partial_failures ... ok test rebuild_evidence_exit_statuses ... ok test result: ok. 41 passed; 0 failed; 0 ignored; 0 measured; 180 filtered out; finished in 7.89s
**Invalidation Reason:** Evidence rebuild: plan_fingerprint_mismatch

#### Attempt 4
**Status:** Completed
**Recorded At:** 2026-04-01T06:04:25.345027Z
**Execution Source:** featureforge:executing-plans
**Task Number:** 4
**Step Number:** 4
**Packet Fingerprint:** 1b6f68b0fce17de00197278ef555abc499f61ab367a25b355ee7d54ea4234044
**Head SHA:** 3cb97e9af57fb687bc8b01d3be18664e28101118
**Base SHA:** 3cb97e9af57fb687bc8b01d3be18664e28101118
**Claim:** Added consolidated no-op and partial-failure output coverage, including persistent target_race, verify_command_failed, strict manual-only exit 3, and unsupported max-jobs rejection.
**Files Proven:**
- tests/plan_execution.rs | sha256:cee706e9b3195e2468b78c09114b0752288fc66ce6af374795ed37047177f995
**Verify Command:** cargo test --test plan_execution -- rebuild_evidence_noop_and_partial_failures --exact && cargo test --test plan_execution rebuild_
**Verification Summary:** `cargo test --test plan_execution -- rebuild_evidence_noop_and_partial_failures --exact && cargo test --test plan_execution rebuild_` -> passed: running 1 test test rebuild_evidence_noop_and_partial_failures ... ok test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 228 filtered out; finished in 2.85s running 48 tests test rebuild_evidence_command_shape ... ok test rebuild_candidate_discovery_unreadable_artifact ... ok test rebuild_candidate_discovery_source_spec_fingerprint_drift ... ok test rebuild_candidate_discovery_plan_fingerprint_drift ... ok test rebuild_candidate_discovery_stale_targets ... ok test rebuild_candidate_filtering ... ok test rebuild_evidence_continue_on_error_clears_failed_earlier_interrupted_target ... ok test rebuild_evidence_dry_run_is_noop ... ok test rebuild_evidence_does_not_publish_contract_bound_receipts_without_active_contract ... ok test rebuild_evidence_invalid_scope ... ok test rebuild_evidence_clears_later_interrupted_step_before_reopening_earlier_target ... ok test rebuild_evidence_manual_required_default ... ok test rebuild_evidence_json_output_fields ... ok test rebuild_evidence_legacy_summary_command_replays ... ok test rebuild_evidence_json_schema ... ok test rebuild_evidence_manual_required_does_not_block_later_command_targets ... ok test rebuild_evidence_manual_required_rerun_resumes_open_step ... ok test rebuild_evidence_noop_allows_intermediate_test_plan_only_state ... ok test rebuild_evidence_noop_refreshes_receipt_only_strategy_checkpoint_drift ... ok test rebuild_evidence_manual_required_keeps_downstream_truth_stale_until_repaired ... ok test rebuild_evidence_noop_refreshes_final_review_without_requiring_release_readiness ... ok test rebuild_evidence_refreshes_malformed_prior_task_review_receipt_before_task_boundary_retry ... ok test rebuild_evidence_noop_rebinds_late_gate_artifacts_after_rebase_only_head_drift ... ok test rebuild_evidence_refreshes_prior_task_closure_receipts_across_tasks ... ok test rebuild_evidence_noop_rebinds_late_gate_artifacts_after_replayed_rebase_changes ... ok test rebuild_evidence_noop_restores_authoritative_late_gate_truth ... ok test rebuild_evidence_refreshes_preflight_acceptance_before_task_boundary_receipt_recovery ... ok test rebuild_evidence_rejects_parallel_max_jobs ... ok test rebuild_evidence_refreshes_non_independent_prior_task_review_receipt_before_task_boundary_retry ... ok test rebuild_evidence_rejects_zero_max_jobs ... ok test rebuild_evidence_session_not_found ... ok test rebuild_evidence_scope_empty ... ok test rebuild_evidence_partial_failure_resume ... ok test rebuild_evidence_state_transition_blocked_rerun_resumes_open_step ... ok test rebuild_evidence_exit_statuses ... ok test rebuild_evidence_text_output_summary ... ok test rebuild_executor_no_output_summary ... ok test rebuild_evidence_restores_post_execution_state_when_prior_task_review_dispatch_missing ... ok test rebuild_evidence_verify_command_failed_rerun_resumes_open_step ... ok test rebuild_evidence_reuses_active_contract_for_serial_unit_review_receipts ... ok test rebuild_evidence_noop_and_partial_failures ... ok test rebuild_evidence_text_failure_output ... ok test rebuild_executor_reopens_and_recompletes ... ok test rebuild_target_race_detected ... ok test rebuild_state_transition_retry_rehydrates_verify_command ... ok test rebuild_target_state_transition_blocked ... ok test rebuild_evidence_restores_authoritative_late_gate_truth_after_successful_rebuild ... ok test rebuild_target_race_retries_and_rehydrates_verify_command ... ok test result: ok. 48 passed; 0 failed; 0 ignored; 0 measured; 181 filtered out; finished in 5.75s
**Invalidation Reason:** N/A

### Task 5 Step 1
#### Attempt 1
**Status:** Invalidated
**Recorded At:** 2026-03-30T20:10:03.602083Z
**Execution Source:** featureforge:executing-plans
**Task Number:** 5
**Step Number:** 1
**Packet Fingerprint:** db9433615ff58d755bf80266fd44d84904b0a75bcecda27818fb75929975cfa6
**Head SHA:** 5527e0d7d94e617dc9d44b77194aa7f0a958b98d
**Base SHA:** 5527e0d7d94e617dc9d44b77194aa7f0a958b98d
**Claim:** Added stale command-backed regression coverage for rebuild-evidence, including legacy summary-only command recovery and mixed stale-target fixtures.
**Files Proven:**
- tests/plan_execution.rs | sha256:2172973f9da237c2ce4bc3adc432b826406936961682419394304db3b8a94805
**Verify Command:** cargo test --test plan_execution rebuild_
**Verification Summary:** `cargo test --test plan_execution rebuild_` -> rebuild-focused regression suite passed with stale command-backed coverage
**Invalidation Reason:** Evidence rebuild: packet_fingerprint_mismatch

#### Attempt 2
**Status:** Invalidated
**Recorded At:** 2026-03-31T19:19:48.678313Z
**Execution Source:** featureforge:executing-plans
**Task Number:** 5
**Step Number:** 1
**Packet Fingerprint:** 278d6734b1409bc80546217d90b757cb055ed0c3cd0c9bd37df2d37855bda207
**Head SHA:** 5527e0d7d94e617dc9d44b77194aa7f0a958b98d
**Base SHA:** 5527e0d7d94e617dc9d44b77194aa7f0a958b98d
**Claim:** Added stale command-backed regression coverage for rebuild-evidence, including legacy summary-only command recovery and mixed stale-target fixtures.
**Files Proven:**
- tests/plan_execution.rs | sha256:c665e38721a4d0a23bbd1ea089837183e32fa1b126582b9eab792652ebf5b0f6
**Verify Command:** cargo test --test plan_execution rebuild_
**Verification Summary:** `cargo test --test plan_execution rebuild_` -> passed: running 31 tests test rebuild_candidate_discovery_stale_targets ... ok test rebuild_candidate_filtering ... ok test rebuild_candidate_discovery_plan_fingerprint_drift ... ok test rebuild_evidence_command_shape ... ok test rebuild_evidence_invalid_scope ... ok test rebuild_candidate_discovery_source_spec_fingerprint_drift ... ok test rebuild_candidate_discovery_unreadable_artifact ... ok test rebuild_evidence_json_output_fields ... ok test rebuild_evidence_dry_run_is_noop ... ok test rebuild_evidence_rejects_parallel_max_jobs ... ok test rebuild_evidence_manual_required_default ... ok test rebuild_evidence_legacy_summary_command_replays ... ok test rebuild_evidence_json_schema ... ok test rebuild_evidence_rejects_zero_max_jobs ... ok test rebuild_evidence_manual_required_rerun_resumes_open_step ... ok test rebuild_evidence_session_not_found ... ok test rebuild_evidence_scope_empty ... ok test rebuild_evidence_refreshes_prior_task_closure_receipts_across_tasks ... ok test rebuild_evidence_text_output_summary ... ok test rebuild_evidence_verify_command_failed_rerun_resumes_open_step ... ok test rebuild_evidence_state_transition_blocked_rerun_resumes_open_step ... ok test rebuild_executor_no_output_summary ... ok test rebuild_executor_reopens_and_recompletes ... ok test rebuild_evidence_text_failure_output ... ok test rebuild_state_transition_retry_rehydrates_verify_command ... ok test rebuild_target_race_detected ... ok test rebuild_target_race_retries_and_rehydrates_verify_command ... ok test rebuild_target_state_transition_blocked ... ok test rebuild_evidence_partial_failure_resume ... ok test rebuild_evidence_exit_statuses ... ok test rebuild_evidence_noop_and_partial_failures ... ok test result: ok. 31 passed; 0 failed; 0 ignored; 0 measured; 167 filtered out; finished in 3.64s
**Invalidation Reason:** Evidence rebuild: packet_fingerprint_mismatch

#### Attempt 3
**Status:** Invalidated
**Recorded At:** 2026-04-01T06:04:25.745748Z
**Execution Source:** featureforge:executing-plans
**Task Number:** 5
**Step Number:** 1
**Packet Fingerprint:** 323fca5ec0847a59073f569fedc3a433f446e20bfd7decc233dc59675f01c4e3
**Head SHA:** 2f97045889529eeb7d7214a0500963d34e9cf47d
**Base SHA:** 2f97045889529eeb7d7214a0500963d34e9cf47d
**Claim:** Added stale command-backed regression coverage for rebuild-evidence, including legacy summary-only command recovery and mixed stale-target fixtures.
**Files Proven:**
- tests/plan_execution.rs | sha256:16d6e788dd8c83391c96898ba801e1e7f8ba03589a0c33802e00ef596e2814a4
**Verify Command:** cargo test --test plan_execution rebuild_
**Verification Summary:** `cargo test --test plan_execution rebuild_` -> passed: running 41 tests test rebuild_candidate_discovery_stale_targets ... ok test rebuild_candidate_discovery_plan_fingerprint_drift ... ok test rebuild_candidate_discovery_source_spec_fingerprint_drift ... ok test rebuild_evidence_command_shape ... ok test rebuild_candidate_filtering ... ok test rebuild_candidate_discovery_unreadable_artifact ... ok test rebuild_evidence_continue_on_error_clears_failed_earlier_interrupted_target ... ok test rebuild_evidence_dry_run_is_noop ... ok test rebuild_evidence_does_not_publish_contract_bound_receipts_without_active_contract ... ok test rebuild_evidence_invalid_scope ... ok test rebuild_evidence_clears_later_interrupted_step_before_reopening_earlier_target ... ok test rebuild_evidence_manual_required_default ... ok test rebuild_evidence_json_output_fields ... ok test rebuild_evidence_legacy_summary_command_replays ... ok test rebuild_evidence_json_schema ... ok test rebuild_evidence_manual_required_rerun_resumes_open_step ... ok test rebuild_evidence_manual_required_does_not_block_later_command_targets ... ok test rebuild_evidence_rejects_parallel_max_jobs ... ok test rebuild_evidence_noop_refreshes_receipt_only_strategy_checkpoint_drift ... ok test rebuild_evidence_rejects_zero_max_jobs ... ok test rebuild_evidence_refreshes_prior_task_closure_receipts_across_tasks ... ok test rebuild_evidence_scope_empty ... ok test rebuild_evidence_refreshes_preflight_acceptance_before_task_boundary_receipt_recovery ... ok test rebuild_evidence_refreshes_malformed_prior_task_review_receipt_before_task_boundary_retry ... ok test rebuild_evidence_refreshes_non_independent_prior_task_review_receipt_before_task_boundary_retry ... ok test rebuild_evidence_session_not_found ... ok test rebuild_evidence_restores_post_execution_state_when_prior_task_review_dispatch_missing ... ok test rebuild_evidence_reuses_active_contract_for_serial_unit_review_receipts ... ok test rebuild_evidence_state_transition_blocked_rerun_resumes_open_step ... ok test rebuild_evidence_text_output_summary ... ok test rebuild_evidence_verify_command_failed_rerun_resumes_open_step ... ok test rebuild_evidence_partial_failure_resume ... ok test rebuild_executor_no_output_summary ... ok test rebuild_evidence_text_failure_output ... ok test rebuild_executor_reopens_and_recompletes ... ok test rebuild_state_transition_retry_rehydrates_verify_command ... ok test rebuild_target_race_detected ... ok test rebuild_target_state_transition_blocked ... ok test rebuild_target_race_retries_and_rehydrates_verify_command ... ok test rebuild_evidence_noop_and_partial_failures ... ok test rebuild_evidence_exit_statuses ... ok test result: ok. 41 passed; 0 failed; 0 ignored; 0 measured; 180 filtered out; finished in 8.16s
**Invalidation Reason:** Evidence rebuild: plan_fingerprint_mismatch

#### Attempt 4
**Status:** Completed
**Recorded At:** 2026-04-01T06:04:32.471529Z
**Execution Source:** featureforge:executing-plans
**Task Number:** 5
**Step Number:** 1
**Packet Fingerprint:** f683820c968d5d35c81106f6df8aadf3b4357085240ac2cf5dc016d70bdbfceb
**Head SHA:** 3cb97e9af57fb687bc8b01d3be18664e28101118
**Base SHA:** 3cb97e9af57fb687bc8b01d3be18664e28101118
**Claim:** Added stale command-backed regression coverage for rebuild-evidence, including legacy summary-only command recovery and mixed stale-target fixtures.
**Files Proven:**
- tests/plan_execution.rs | sha256:cee706e9b3195e2468b78c09114b0752288fc66ce6af374795ed37047177f995
**Verify Command:** cargo test --test plan_execution rebuild_
**Verification Summary:** `cargo test --test plan_execution rebuild_` -> passed: running 48 tests test rebuild_candidate_discovery_unreadable_artifact ... ok test rebuild_candidate_discovery_source_spec_fingerprint_drift ... ok test rebuild_candidate_discovery_plan_fingerprint_drift ... ok test rebuild_evidence_command_shape ... ok test rebuild_candidate_filtering ... ok test rebuild_candidate_discovery_stale_targets ... ok test rebuild_evidence_continue_on_error_clears_failed_earlier_interrupted_target ... ok test rebuild_evidence_dry_run_is_noop ... ok test rebuild_evidence_invalid_scope ... ok test rebuild_evidence_does_not_publish_contract_bound_receipts_without_active_contract ... ok test rebuild_evidence_clears_later_interrupted_step_before_reopening_earlier_target ... ok test rebuild_evidence_manual_required_default ... ok test rebuild_evidence_json_output_fields ... ok test rebuild_evidence_legacy_summary_command_replays ... ok test rebuild_evidence_json_schema ... ok test rebuild_evidence_manual_required_does_not_block_later_command_targets ... ok test rebuild_evidence_manual_required_rerun_resumes_open_step ... ok test rebuild_evidence_noop_allows_intermediate_test_plan_only_state ... ok test rebuild_evidence_noop_refreshes_receipt_only_strategy_checkpoint_drift ... ok test rebuild_evidence_manual_required_keeps_downstream_truth_stale_until_repaired ... ok test rebuild_evidence_noop_refreshes_final_review_without_requiring_release_readiness ... ok test rebuild_evidence_refreshes_malformed_prior_task_review_receipt_before_task_boundary_retry ... ok test rebuild_evidence_noop_rebinds_late_gate_artifacts_after_rebase_only_head_drift ... ok test rebuild_evidence_refreshes_prior_task_closure_receipts_across_tasks ... ok test rebuild_evidence_noop_rebinds_late_gate_artifacts_after_replayed_rebase_changes ... ok test rebuild_evidence_noop_restores_authoritative_late_gate_truth ... ok test rebuild_evidence_rejects_parallel_max_jobs ... ok test rebuild_evidence_refreshes_preflight_acceptance_before_task_boundary_receipt_recovery ... ok test rebuild_evidence_refreshes_non_independent_prior_task_review_receipt_before_task_boundary_retry ... ok test rebuild_evidence_rejects_zero_max_jobs ... ok test rebuild_evidence_session_not_found ... ok test rebuild_evidence_partial_failure_resume ... ok test rebuild_evidence_scope_empty ... ok test rebuild_evidence_state_transition_blocked_rerun_resumes_open_step ... ok test rebuild_evidence_restores_post_execution_state_when_prior_task_review_dispatch_missing ... ok test rebuild_evidence_exit_statuses ... ok test rebuild_evidence_text_output_summary ... ok test rebuild_executor_no_output_summary ... ok test rebuild_evidence_reuses_active_contract_for_serial_unit_review_receipts ... ok test rebuild_evidence_verify_command_failed_rerun_resumes_open_step ... ok test rebuild_evidence_noop_and_partial_failures ... ok test rebuild_evidence_text_failure_output ... ok test rebuild_executor_reopens_and_recompletes ... ok test rebuild_state_transition_retry_rehydrates_verify_command ... ok test rebuild_target_race_detected ... ok test rebuild_target_state_transition_blocked ... ok test rebuild_evidence_restores_authoritative_late_gate_truth_after_successful_rebuild ... ok test rebuild_target_race_retries_and_rehydrates_verify_command ... ok test result: ok. 48 passed; 0 failed; 0 ignored; 0 measured; 181 filtered out; finished in 5.89s
**Invalidation Reason:** N/A

### Task 5 Step 2
#### Attempt 1
**Status:** Invalidated
**Recorded At:** 2026-03-30T20:10:07.909006Z
**Execution Source:** featureforge:executing-plans
**Task Number:** 5
**Step Number:** 2
**Packet Fingerprint:** 3871ab8573af2392ab5e13f60203f99e1f9ea6388f84fda063d0b17fc68de5be
**Head SHA:** 5527e0d7d94e617dc9d44b77194aa7f0a958b98d
**Base SHA:** 5527e0d7d94e617dc9d44b77194aa7f0a958b98d
**Claim:** Added dry-run parity coverage proving rebuild-evidence preserves candidate parity and leaves plan, evidence, and runtime state untouched, including with --no-output.
**Files Proven:**
- tests/plan_execution.rs | sha256:c0709568c6708c14aadb81e333284a937c0e2e411be242e88047708551ae7e82
**Verify Command:** cargo test --test plan_execution -- rebuild_evidence_dry_run_is_noop --exact && cargo test --test plan_execution rebuild_
**Verification Summary:** `cargo test --test plan_execution -- rebuild_evidence_dry_run_is_noop --exact && cargo test --test plan_execution rebuild_` -> dry-run parity regression passed and rebuild-focused regression slice stayed green
**Invalidation Reason:** Evidence rebuild: packet_fingerprint_mismatch

#### Attempt 2
**Status:** Invalidated
**Recorded At:** 2026-03-31T19:19:58.685103Z
**Execution Source:** featureforge:executing-plans
**Task Number:** 5
**Step Number:** 2
**Packet Fingerprint:** 0c186d0d010fa12012a98c5253956ab842e8953610523b3c1f80f3de96b9ff74
**Head SHA:** 5527e0d7d94e617dc9d44b77194aa7f0a958b98d
**Base SHA:** 5527e0d7d94e617dc9d44b77194aa7f0a958b98d
**Claim:** Added dry-run parity coverage proving rebuild-evidence preserves candidate parity and leaves plan, evidence, and runtime state untouched, including with --no-output.
**Files Proven:**
- tests/plan_execution.rs | sha256:c665e38721a4d0a23bbd1ea089837183e32fa1b126582b9eab792652ebf5b0f6
**Verify Command:** cargo test --test plan_execution -- rebuild_evidence_dry_run_is_noop --exact && cargo test --test plan_execution rebuild_
**Verification Summary:** `cargo test --test plan_execution -- rebuild_evidence_dry_run_is_noop --exact && cargo test --test plan_execution rebuild_` -> passed: running 1 test test rebuild_evidence_dry_run_is_noop ... ok test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 197 filtered out; finished in 1.03s running 31 tests test rebuild_candidate_discovery_plan_fingerprint_drift ... ok test rebuild_evidence_invalid_scope ... ok test rebuild_candidate_discovery_stale_targets ... ok test rebuild_candidate_discovery_unreadable_artifact ... ok test rebuild_evidence_command_shape ... ok test rebuild_candidate_discovery_source_spec_fingerprint_drift ... ok test rebuild_candidate_filtering ... ok test rebuild_evidence_json_output_fields ... ok test rebuild_evidence_dry_run_is_noop ... ok test rebuild_evidence_rejects_parallel_max_jobs ... ok test rebuild_evidence_manual_required_default ... ok test rebuild_evidence_rejects_zero_max_jobs ... ok test rebuild_evidence_json_schema ... ok test rebuild_evidence_legacy_summary_command_replays ... ok test rebuild_evidence_manual_required_rerun_resumes_open_step ... ok test rebuild_evidence_session_not_found ... ok test rebuild_evidence_scope_empty ... ok test rebuild_evidence_refreshes_prior_task_closure_receipts_across_tasks ... ok test rebuild_evidence_text_output_summary ... ok test rebuild_evidence_verify_command_failed_rerun_resumes_open_step ... ok test rebuild_evidence_state_transition_blocked_rerun_resumes_open_step ... ok test rebuild_executor_no_output_summary ... ok test rebuild_executor_reopens_and_recompletes ... ok test rebuild_evidence_text_failure_output ... ok test rebuild_state_transition_retry_rehydrates_verify_command ... ok test rebuild_target_race_detected ... ok test rebuild_target_race_retries_and_rehydrates_verify_command ... ok test rebuild_target_state_transition_blocked ... ok test rebuild_evidence_partial_failure_resume ... ok test rebuild_evidence_exit_statuses ... ok test rebuild_evidence_noop_and_partial_failures ... ok test result: ok. 31 passed; 0 failed; 0 ignored; 0 measured; 167 filtered out; finished in 4.02s
**Invalidation Reason:** Evidence rebuild: packet_fingerprint_mismatch

#### Attempt 3
**Status:** Invalidated
**Recorded At:** 2026-04-01T06:04:32.871745Z
**Execution Source:** featureforge:executing-plans
**Task Number:** 5
**Step Number:** 2
**Packet Fingerprint:** e0f452ed42a66193f3f83d897f43aa2953b7f14a03a7c1cd964f9e4926dc176a
**Head SHA:** 2f97045889529eeb7d7214a0500963d34e9cf47d
**Base SHA:** 2f97045889529eeb7d7214a0500963d34e9cf47d
**Claim:** Added dry-run parity coverage proving rebuild-evidence preserves candidate parity and leaves plan, evidence, and runtime state untouched, including with --no-output.
**Files Proven:**
- tests/plan_execution.rs | sha256:16d6e788dd8c83391c96898ba801e1e7f8ba03589a0c33802e00ef596e2814a4
**Verify Command:** cargo test --test plan_execution -- rebuild_evidence_dry_run_is_noop --exact && cargo test --test plan_execution rebuild_
**Verification Summary:** `cargo test --test plan_execution -- rebuild_evidence_dry_run_is_noop --exact && cargo test --test plan_execution rebuild_` -> passed: running 1 test test rebuild_evidence_dry_run_is_noop ... ok test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 220 filtered out; finished in 1.64s running 41 tests test rebuild_candidate_filtering ... ok test rebuild_candidate_discovery_plan_fingerprint_drift ... ok test rebuild_candidate_discovery_unreadable_artifact ... ok test rebuild_candidate_discovery_source_spec_fingerprint_drift ... ok test rebuild_evidence_command_shape ... ok test rebuild_candidate_discovery_stale_targets ... ok test rebuild_evidence_dry_run_is_noop ... ok test rebuild_evidence_continue_on_error_clears_failed_earlier_interrupted_target ... ok test rebuild_evidence_does_not_publish_contract_bound_receipts_without_active_contract ... ok test rebuild_evidence_invalid_scope ... ok test rebuild_evidence_clears_later_interrupted_step_before_reopening_earlier_target ... ok test rebuild_evidence_manual_required_default ... ok test rebuild_evidence_json_output_fields ... ok test rebuild_evidence_json_schema ... ok test rebuild_evidence_legacy_summary_command_replays ... ok test rebuild_evidence_manual_required_rerun_resumes_open_step ... ok test rebuild_evidence_manual_required_does_not_block_later_command_targets ... ok test rebuild_evidence_rejects_parallel_max_jobs ... ok test rebuild_evidence_noop_refreshes_receipt_only_strategy_checkpoint_drift ... ok test rebuild_evidence_rejects_zero_max_jobs ... ok test rebuild_evidence_refreshes_prior_task_closure_receipts_across_tasks ... ok test rebuild_evidence_scope_empty ... ok test rebuild_evidence_refreshes_preflight_acceptance_before_task_boundary_receipt_recovery ... ok test rebuild_evidence_refreshes_malformed_prior_task_review_receipt_before_task_boundary_retry ... ok test rebuild_evidence_refreshes_non_independent_prior_task_review_receipt_before_task_boundary_retry ... ok test rebuild_evidence_session_not_found ... ok test rebuild_evidence_reuses_active_contract_for_serial_unit_review_receipts ... ok test rebuild_evidence_restores_post_execution_state_when_prior_task_review_dispatch_missing ... ok test rebuild_evidence_state_transition_blocked_rerun_resumes_open_step ... ok test rebuild_evidence_text_output_summary ... ok test rebuild_executor_no_output_summary ... ok test rebuild_evidence_verify_command_failed_rerun_resumes_open_step ... ok test rebuild_evidence_partial_failure_resume ... ok test rebuild_evidence_text_failure_output ... ok test rebuild_executor_reopens_and_recompletes ... ok test rebuild_state_transition_retry_rehydrates_verify_command ... ok test rebuild_target_race_detected ... ok test rebuild_target_state_transition_blocked ... ok test rebuild_target_race_retries_and_rehydrates_verify_command ... ok test rebuild_evidence_noop_and_partial_failures ... ok test rebuild_evidence_exit_statuses ... ok test result: ok. 41 passed; 0 failed; 0 ignored; 0 measured; 180 filtered out; finished in 7.46s
**Invalidation Reason:** Evidence rebuild: plan_fingerprint_mismatch

#### Attempt 4
**Status:** Completed
**Recorded At:** 2026-04-01T06:04:40.727235Z
**Execution Source:** featureforge:executing-plans
**Task Number:** 5
**Step Number:** 2
**Packet Fingerprint:** bc30a241926e4fd47e5c5453a827ddc15d930fccea6ec1ce6335d160f0e5ecbd
**Head SHA:** 3cb97e9af57fb687bc8b01d3be18664e28101118
**Base SHA:** 3cb97e9af57fb687bc8b01d3be18664e28101118
**Claim:** Added dry-run parity coverage proving rebuild-evidence preserves candidate parity and leaves plan, evidence, and runtime state untouched, including with --no-output.
**Files Proven:**
- tests/plan_execution.rs | sha256:cee706e9b3195e2468b78c09114b0752288fc66ce6af374795ed37047177f995
**Verify Command:** cargo test --test plan_execution -- rebuild_evidence_dry_run_is_noop --exact && cargo test --test plan_execution rebuild_
**Verification Summary:** `cargo test --test plan_execution -- rebuild_evidence_dry_run_is_noop --exact && cargo test --test plan_execution rebuild_` -> passed: running 1 test test rebuild_evidence_dry_run_is_noop ... ok test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 228 filtered out; finished in 1.02s running 48 tests test rebuild_candidate_discovery_source_spec_fingerprint_drift ... ok test rebuild_evidence_command_shape ... ok test rebuild_candidate_discovery_unreadable_artifact ... ok test rebuild_candidate_discovery_stale_targets ... ok test rebuild_candidate_discovery_plan_fingerprint_drift ... ok test rebuild_candidate_filtering ... ok test rebuild_evidence_continue_on_error_clears_failed_earlier_interrupted_target ... ok test rebuild_evidence_dry_run_is_noop ... ok test rebuild_evidence_invalid_scope ... ok test rebuild_evidence_does_not_publish_contract_bound_receipts_without_active_contract ... ok test rebuild_evidence_clears_later_interrupted_step_before_reopening_earlier_target ... ok test rebuild_evidence_manual_required_default ... ok test rebuild_evidence_json_schema ... ok test rebuild_evidence_legacy_summary_command_replays ... ok test rebuild_evidence_json_output_fields ... ok test rebuild_evidence_manual_required_does_not_block_later_command_targets ... ok test rebuild_evidence_manual_required_rerun_resumes_open_step ... ok test rebuild_evidence_noop_allows_intermediate_test_plan_only_state ... ok test rebuild_evidence_manual_required_keeps_downstream_truth_stale_until_repaired ... ok test rebuild_evidence_noop_refreshes_receipt_only_strategy_checkpoint_drift ... ok test rebuild_evidence_noop_refreshes_final_review_without_requiring_release_readiness ... ok test rebuild_evidence_refreshes_malformed_prior_task_review_receipt_before_task_boundary_retry ... ok test rebuild_evidence_noop_rebinds_late_gate_artifacts_after_rebase_only_head_drift ... ok test rebuild_evidence_refreshes_prior_task_closure_receipts_across_tasks ... ok test rebuild_evidence_noop_rebinds_late_gate_artifacts_after_replayed_rebase_changes ... ok test rebuild_evidence_noop_restores_authoritative_late_gate_truth ... ok test rebuild_evidence_refreshes_preflight_acceptance_before_task_boundary_receipt_recovery ... ok test rebuild_evidence_rejects_parallel_max_jobs ... ok test rebuild_evidence_refreshes_non_independent_prior_task_review_receipt_before_task_boundary_retry ... ok test rebuild_evidence_rejects_zero_max_jobs ... ok test rebuild_evidence_scope_empty ... ok test rebuild_evidence_session_not_found ... ok test rebuild_evidence_partial_failure_resume ... ok test rebuild_evidence_state_transition_blocked_rerun_resumes_open_step ... ok test rebuild_evidence_exit_statuses ... ok test rebuild_evidence_text_output_summary ... ok test rebuild_evidence_reuses_active_contract_for_serial_unit_review_receipts ... ok test rebuild_evidence_restores_post_execution_state_when_prior_task_review_dispatch_missing ... ok test rebuild_evidence_noop_and_partial_failures ... ok test rebuild_executor_no_output_summary ... ok test rebuild_evidence_verify_command_failed_rerun_resumes_open_step ... ok test rebuild_evidence_text_failure_output ... ok test rebuild_executor_reopens_and_recompletes ... ok test rebuild_state_transition_retry_rehydrates_verify_command ... ok test rebuild_evidence_restores_authoritative_late_gate_truth_after_successful_rebuild ... ok test rebuild_target_state_transition_blocked ... ok test rebuild_target_race_detected ... ok test rebuild_target_race_retries_and_rehydrates_verify_command ... ok test result: ok. 48 passed; 0 failed; 0 ignored; 0 measured; 181 filtered out; finished in 5.62s
**Invalidation Reason:** N/A

### Task 5 Step 3
#### Attempt 1
**Status:** Invalidated
**Recorded At:** 2026-03-30T20:10:13.976215Z
**Execution Source:** featureforge:executing-plans
**Task Number:** 5
**Step Number:** 3
**Packet Fingerprint:** bd07e5a1516886d53b42a5ecec8c071682388b56e351c2b10b05f270abc6626d
**Head SHA:** 5527e0d7d94e617dc9d44b77194aa7f0a958b98d
**Base SHA:** 5527e0d7d94e617dc9d44b77194aa7f0a958b98d
**Claim:** Added partial-failure resume coverage proving successful targets commit while failed targets remain recoverable under continue-on-error, including verify_command_failed, artifact_read_error, and state_transition_blocked mixed-batch cases, with dedicated target_race coverage retained separately.
**Files Proven:**
- tests/plan_execution.rs | sha256:7a06368ff608d3942d77d0f93d871aa31e0cd3d76bb593922c21a48855081b27
**Verify Command:** cargo test --test plan_execution -- rebuild_evidence_partial_failure_resume --exact && cargo test --test plan_execution rebuild_
**Verification Summary:** `cargo test --test plan_execution -- rebuild_evidence_partial_failure_resume --exact && cargo test --test plan_execution rebuild_` -> partial-failure resume regression passed and rebuild-focused regression slice stayed green
**Invalidation Reason:** Evidence rebuild: packet_fingerprint_mismatch

#### Attempt 2
**Status:** Invalidated
**Recorded At:** 2026-03-31T01:51:48.241703Z
**Execution Source:** featureforge:executing-plans
**Task Number:** 5
**Step Number:** 3
**Packet Fingerprint:** 223ccdb865f70203bfe387cab34da6dea04eef3d8ec0db825da3db94834d3f0a
**Head SHA:** 5527e0d7d94e617dc9d44b77194aa7f0a958b98d
**Base SHA:** 5527e0d7d94e617dc9d44b77194aa7f0a958b98d
**Claim:** Added partial-failure resume coverage proving successful targets commit while failed targets remain recoverable under continue-on-error, including verify_command_failed, artifact_read_error, and state_transition_blocked mixed-batch cases, with dedicated target_race coverage retained separately.
**Files Proven:**
- tests/plan_execution.rs | sha256:c665e38721a4d0a23bbd1ea089837183e32fa1b126582b9eab792652ebf5b0f6
**Verify Command:** cargo test --test plan_execution -- rebuild_evidence_partial_failure_resume --exact && cargo test --test plan_execution rebuild_
**Verification Summary:** `cargo test --test plan_execution -- rebuild_evidence_partial_failure_resume --exact && cargo test --test plan_execution rebuild_` -> passed: running 1 test test rebuild_evidence_partial_failure_resume ... ok test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 197 filtered out; finished in 2.20s running 31 tests test rebuild_evidence_command_shape ... ok test rebuild_candidate_filtering ... ok test rebuild_candidate_discovery_plan_fingerprint_drift ... ok test rebuild_candidate_discovery_unreadable_artifact ... ok test rebuild_candidate_discovery_source_spec_fingerprint_drift ... ok test rebuild_evidence_invalid_scope ... ok test rebuild_candidate_discovery_stale_targets ... ok test rebuild_evidence_json_output_fields ... ok test rebuild_evidence_dry_run_is_noop ... ok test rebuild_evidence_rejects_parallel_max_jobs ... ok test rebuild_evidence_manual_required_default ... ok test rebuild_evidence_json_schema ... ok test rebuild_evidence_legacy_summary_command_replays ... ok test rebuild_evidence_rejects_zero_max_jobs ... ok test rebuild_evidence_manual_required_rerun_resumes_open_step ... ok test rebuild_evidence_session_not_found ... ok test rebuild_evidence_scope_empty ... ok test rebuild_evidence_refreshes_prior_task_closure_receipts_across_tasks ... ok test rebuild_evidence_text_output_summary ... ok test rebuild_evidence_verify_command_failed_rerun_resumes_open_step ... ok test rebuild_evidence_state_transition_blocked_rerun_resumes_open_step ... ok test rebuild_executor_no_output_summary ... ok test rebuild_executor_reopens_and_recompletes ... ok test rebuild_evidence_text_failure_output ... ok test rebuild_state_transition_retry_rehydrates_verify_command ... ok test rebuild_target_race_detected ... ok test rebuild_target_state_transition_blocked ... ok test rebuild_target_race_retries_and_rehydrates_verify_command ... ok test rebuild_evidence_partial_failure_resume ... ok test rebuild_evidence_exit_statuses ... ok test rebuild_evidence_noop_and_partial_failures ... ok test result: ok. 31 passed; 0 failed; 0 ignored; 0 measured; 167 filtered out; finished in 3.53s
**Invalidation Reason:** Evidence rebuild: files_proven_drifted

#### Attempt 3
**Status:** Invalidated
**Recorded At:** 2026-03-31T19:20:10.574633Z
**Execution Source:** featureforge:executing-plans
**Task Number:** 5
**Step Number:** 3
**Packet Fingerprint:** 223ccdb865f70203bfe387cab34da6dea04eef3d8ec0db825da3db94834d3f0a
**Head SHA:** 3a6a1610f1d611a85cc50964438053167b832265
**Base SHA:** 3a6a1610f1d611a85cc50964438053167b832265
**Claim:** Added partial-failure resume coverage proving successful targets commit while failed targets remain recoverable under continue-on-error, including verify_command_failed, artifact_read_error, and state_transition_blocked mixed-batch cases, with dedicated target_race coverage retained separately.
**Files Proven:**
- tests/plan_execution.rs | sha256:1c9ef0d722ac2844abf382057fd3a3b921e7b41d94d78736f18a323a6f88d867
**Verify Command:** cargo test --test plan_execution -- rebuild_evidence_partial_failure_resume --exact && cargo test --test plan_execution rebuild_
**Verification Summary:** `cargo test --test plan_execution -- rebuild_evidence_partial_failure_resume --exact && cargo test --test plan_execution rebuild_` -> passed: running 1 test test rebuild_evidence_partial_failure_resume ... ok test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 205 filtered out; finished in 2.07s running 35 tests test rebuild_candidate_filtering ... ok test rebuild_evidence_command_shape ... ok test rebuild_candidate_discovery_unreadable_artifact ... ok test rebuild_candidate_discovery_source_spec_fingerprint_drift ... ok test rebuild_candidate_discovery_stale_targets ... ok test rebuild_candidate_discovery_plan_fingerprint_drift ... ok test rebuild_evidence_dry_run_is_noop ... ok test rebuild_evidence_does_not_publish_contract_bound_receipts_without_active_contract ... ok test rebuild_evidence_invalid_scope ... ok test rebuild_evidence_clears_later_interrupted_step_before_reopening_earlier_target ... ok test rebuild_evidence_manual_required_default ... ok test rebuild_evidence_json_schema ... ok test rebuild_evidence_legacy_summary_command_replays ... ok test rebuild_evidence_json_output_fields ... ok test rebuild_evidence_manual_required_rerun_resumes_open_step ... ok test rebuild_evidence_session_not_found ... ok test rebuild_evidence_rejects_parallel_max_jobs ... ok test rebuild_evidence_rejects_zero_max_jobs ... ok test rebuild_evidence_scope_empty ... ok test rebuild_evidence_refreshes_prior_task_closure_receipts_across_tasks ... ok test rebuild_evidence_text_output_summary ... ok test rebuild_evidence_refreshes_preflight_acceptance_before_task_boundary_receipt_recovery ... ok test rebuild_evidence_verify_command_failed_rerun_resumes_open_step ... ok test rebuild_evidence_state_transition_blocked_rerun_resumes_open_step ... ok test rebuild_evidence_reuses_active_contract_for_serial_unit_review_receipts ... ok test rebuild_evidence_text_failure_output ... ok test rebuild_executor_no_output_summary ... ok test rebuild_executor_reopens_and_recompletes ... ok test rebuild_state_transition_retry_rehydrates_verify_command ... ok test rebuild_target_state_transition_blocked ... ok test rebuild_target_race_detected ... ok test rebuild_target_race_retries_and_rehydrates_verify_command ... ok test rebuild_evidence_partial_failure_resume ... ok test rebuild_evidence_exit_statuses ... ok test rebuild_evidence_noop_and_partial_failures ... ok test result: ok. 35 passed; 0 failed; 0 ignored; 0 measured; 171 filtered out; finished in 4.17s
**Invalidation Reason:** Evidence rebuild: packet_fingerprint_mismatch

#### Attempt 4
**Status:** Invalidated
**Recorded At:** 2026-04-01T06:04:41.079577Z
**Execution Source:** featureforge:executing-plans
**Task Number:** 5
**Step Number:** 3
**Packet Fingerprint:** 2e80aadda1ba85965e27671e794b2ed814dba3c864348ffa5f838114a82efbec
**Head SHA:** 2f97045889529eeb7d7214a0500963d34e9cf47d
**Base SHA:** 2f97045889529eeb7d7214a0500963d34e9cf47d
**Claim:** Added partial-failure resume coverage proving successful targets commit while failed targets remain recoverable under continue-on-error, including verify_command_failed, artifact_read_error, and state_transition_blocked mixed-batch cases, with dedicated target_race coverage retained separately.
**Files Proven:**
- tests/plan_execution.rs | sha256:16d6e788dd8c83391c96898ba801e1e7f8ba03589a0c33802e00ef596e2814a4
**Verify Command:** cargo test --test plan_execution -- rebuild_evidence_partial_failure_resume --exact && cargo test --test plan_execution rebuild_
**Verification Summary:** `cargo test --test plan_execution -- rebuild_evidence_partial_failure_resume --exact && cargo test --test plan_execution rebuild_` -> passed: running 1 test test rebuild_evidence_partial_failure_resume ... ok test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 220 filtered out; finished in 6.93s running 41 tests test rebuild_candidate_filtering ... ok test rebuild_candidate_discovery_plan_fingerprint_drift ... ok test rebuild_candidate_discovery_stale_targets ... ok test rebuild_candidate_discovery_source_spec_fingerprint_drift ... ok test rebuild_evidence_command_shape ... ok test rebuild_candidate_discovery_unreadable_artifact ... ok test rebuild_evidence_dry_run_is_noop ... ok test rebuild_evidence_continue_on_error_clears_failed_earlier_interrupted_target ... ok test rebuild_evidence_does_not_publish_contract_bound_receipts_without_active_contract ... ok test rebuild_evidence_invalid_scope ... ok test rebuild_evidence_clears_later_interrupted_step_before_reopening_earlier_target ... ok test rebuild_evidence_manual_required_default ... ok test rebuild_evidence_json_output_fields ... ok test rebuild_evidence_json_schema ... ok test rebuild_evidence_legacy_summary_command_replays ... ok test rebuild_evidence_manual_required_rerun_resumes_open_step ... ok test rebuild_evidence_manual_required_does_not_block_later_command_targets ... ok test rebuild_evidence_noop_refreshes_receipt_only_strategy_checkpoint_drift ... ok test rebuild_evidence_rejects_parallel_max_jobs ... ok test rebuild_evidence_rejects_zero_max_jobs ... ok test rebuild_evidence_refreshes_prior_task_closure_receipts_across_tasks ... ok test rebuild_evidence_scope_empty ... ok test rebuild_evidence_refreshes_malformed_prior_task_review_receipt_before_task_boundary_retry ... ok test rebuild_evidence_refreshes_preflight_acceptance_before_task_boundary_receipt_recovery ... ok test rebuild_evidence_refreshes_non_independent_prior_task_review_receipt_before_task_boundary_retry ... ok test rebuild_evidence_session_not_found ... ok test rebuild_evidence_reuses_active_contract_for_serial_unit_review_receipts ... ok test rebuild_evidence_restores_post_execution_state_when_prior_task_review_dispatch_missing ... ok test rebuild_evidence_text_output_summary ... ok test rebuild_evidence_state_transition_blocked_rerun_resumes_open_step ... ok test rebuild_evidence_verify_command_failed_rerun_resumes_open_step ... ok test rebuild_executor_no_output_summary ... ok test rebuild_evidence_partial_failure_resume ... ok test rebuild_evidence_text_failure_output ... ok test rebuild_executor_reopens_and_recompletes ... ok test rebuild_state_transition_retry_rehydrates_verify_command ... ok test rebuild_target_race_detected ... ok test rebuild_target_state_transition_blocked ... ok test rebuild_target_race_retries_and_rehydrates_verify_command ... ok test rebuild_evidence_noop_and_partial_failures ... ok test rebuild_evidence_exit_statuses ... ok test result: ok. 41 passed; 0 failed; 0 ignored; 0 measured; 180 filtered out; finished in 7.53s
**Invalidation Reason:** Evidence rebuild: plan_fingerprint_mismatch

#### Attempt 5
**Status:** Completed
**Recorded At:** 2026-04-01T06:04:51.76946Z
**Execution Source:** featureforge:executing-plans
**Task Number:** 5
**Step Number:** 3
**Packet Fingerprint:** 7a777f9f666bc6f86e072e74c990445d5e5607d6c4c5a7b2622dfe0604b9f6ea
**Head SHA:** 3cb97e9af57fb687bc8b01d3be18664e28101118
**Base SHA:** 3cb97e9af57fb687bc8b01d3be18664e28101118
**Claim:** Added partial-failure resume coverage proving successful targets commit while failed targets remain recoverable under continue-on-error, including verify_command_failed, artifact_read_error, and state_transition_blocked mixed-batch cases, with dedicated target_race coverage retained separately.
**Files Proven:**
- tests/plan_execution.rs | sha256:cee706e9b3195e2468b78c09114b0752288fc66ce6af374795ed37047177f995
**Verify Command:** cargo test --test plan_execution -- rebuild_evidence_partial_failure_resume --exact && cargo test --test plan_execution rebuild_
**Verification Summary:** `cargo test --test plan_execution -- rebuild_evidence_partial_failure_resume --exact && cargo test --test plan_execution rebuild_` -> passed: running 1 test test rebuild_evidence_partial_failure_resume ... ok test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 228 filtered out; finished in 2.46s running 48 tests test rebuild_candidate_discovery_unreadable_artifact ... ok test rebuild_evidence_command_shape ... ok test rebuild_candidate_discovery_plan_fingerprint_drift ... ok test rebuild_candidate_filtering ... ok test rebuild_candidate_discovery_source_spec_fingerprint_drift ... ok test rebuild_candidate_discovery_stale_targets ... ok test rebuild_evidence_continue_on_error_clears_failed_earlier_interrupted_target ... ok test rebuild_evidence_dry_run_is_noop ... ok test rebuild_evidence_does_not_publish_contract_bound_receipts_without_active_contract ... ok test rebuild_evidence_invalid_scope ... ok test rebuild_evidence_clears_later_interrupted_step_before_reopening_earlier_target ... ok test rebuild_evidence_manual_required_default ... ok test rebuild_evidence_json_output_fields ... ok test rebuild_evidence_json_schema ... ok test rebuild_evidence_legacy_summary_command_replays ... ok test rebuild_evidence_manual_required_does_not_block_later_command_targets ... ok test rebuild_evidence_manual_required_rerun_resumes_open_step ... ok test rebuild_evidence_noop_allows_intermediate_test_plan_only_state ... ok test rebuild_evidence_noop_refreshes_receipt_only_strategy_checkpoint_drift ... ok test rebuild_evidence_manual_required_keeps_downstream_truth_stale_until_repaired ... ok test rebuild_evidence_noop_refreshes_final_review_without_requiring_release_readiness ... ok test rebuild_evidence_refreshes_malformed_prior_task_review_receipt_before_task_boundary_retry ... ok test rebuild_evidence_noop_rebinds_late_gate_artifacts_after_rebase_only_head_drift ... ok test rebuild_evidence_refreshes_prior_task_closure_receipts_across_tasks ... ok test rebuild_evidence_noop_rebinds_late_gate_artifacts_after_replayed_rebase_changes ... ok test rebuild_evidence_noop_restores_authoritative_late_gate_truth ... ok test rebuild_evidence_refreshes_non_independent_prior_task_review_receipt_before_task_boundary_retry ... ok test rebuild_evidence_refreshes_preflight_acceptance_before_task_boundary_receipt_recovery ... ok test rebuild_evidence_rejects_parallel_max_jobs ... ok test rebuild_evidence_rejects_zero_max_jobs ... ok test rebuild_evidence_partial_failure_resume ... ok test rebuild_evidence_session_not_found ... ok test rebuild_evidence_scope_empty ... ok test rebuild_evidence_state_transition_blocked_rerun_resumes_open_step ... ok test rebuild_evidence_exit_statuses ... ok test rebuild_evidence_restores_post_execution_state_when_prior_task_review_dispatch_missing ... ok test rebuild_evidence_reuses_active_contract_for_serial_unit_review_receipts ... ok test rebuild_evidence_noop_and_partial_failures ... ok test rebuild_evidence_text_output_summary ... ok test rebuild_executor_no_output_summary ... ok test rebuild_evidence_verify_command_failed_rerun_resumes_open_step ... ok test rebuild_evidence_text_failure_output ... ok test rebuild_executor_reopens_and_recompletes ... ok test rebuild_evidence_restores_authoritative_late_gate_truth_after_successful_rebuild ... ok test rebuild_state_transition_retry_rehydrates_verify_command ... ok test rebuild_target_state_transition_blocked ... ok test rebuild_target_race_detected ... ok test rebuild_target_race_retries_and_rehydrates_verify_command ... ok test result: ok. 48 passed; 0 failed; 0 ignored; 0 measured; 181 filtered out; finished in 7.00s
**Invalidation Reason:** N/A

### Task 5 Step 4
#### Attempt 1
**Status:** Invalidated
**Recorded At:** 2026-03-30T20:10:20.711999Z
**Execution Source:** featureforge:executing-plans
**Task Number:** 5
**Step Number:** 4
**Packet Fingerprint:** 7c168ab741b6f16b9928476bd3c46a34559d6861f83a889c94cb51fcfa53bb73
**Head SHA:** 5527e0d7d94e617dc9d44b77194aa7f0a958b98d
**Base SHA:** 5527e0d7d94e617dc9d44b77194aa7f0a958b98d
**Claim:** Added exact JSON schema coverage for rebuild-evidence output, including stable top-level and nested key order for structured parsing consumers.
**Files Proven:**
- tests/plan_execution.rs | sha256:f9966328bde0612789f8e3e2a5492b8fe5d0aa5aa598be54d5adc364c7f6f70b
**Verify Command:** cargo test --test plan_execution -- rebuild_evidence_json_schema --exact && cargo test --test plan_execution rebuild_
**Verification Summary:** `cargo test --test plan_execution -- rebuild_evidence_json_schema --exact && cargo test --test plan_execution rebuild_` -> json schema regression passed and rebuild-focused regression slice stayed green
**Invalidation Reason:** Evidence rebuild: packet_fingerprint_mismatch

#### Attempt 2
**Status:** Invalidated
**Recorded At:** 2026-03-30T21:03:12.883456Z
**Execution Source:** featureforge:executing-plans
**Task Number:** 5
**Step Number:** 4
**Packet Fingerprint:** 31ceabb9f2729c0e6c9c5b8173881a64a91057d2d9823269e86620059a9e571d
**Head SHA:** 5527e0d7d94e617dc9d44b77194aa7f0a958b98d
**Base SHA:** 5527e0d7d94e617dc9d44b77194aa7f0a958b98d
**Claim:** Added exact JSON schema coverage for rebuild-evidence output, including stable top-level and nested key order for structured parsing consumers.
**Files Proven:**
- tests/plan_execution.rs | sha256:c665e38721a4d0a23bbd1ea089837183e32fa1b126582b9eab792652ebf5b0f6
**Verify Command:** cargo test --test plan_execution -- rebuild_evidence_json_schema --exact && cargo test --test plan_execution rebuild_
**Verification Summary:** `cargo test --test plan_execution -- rebuild_evidence_json_schema --exact && cargo test --test plan_execution rebuild_` -> passed: running 1 test test rebuild_evidence_json_schema ... ok test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 197 filtered out; finished in 1.00s running 31 tests test rebuild_candidate_filtering ... ok test rebuild_candidate_discovery_source_spec_fingerprint_drift ... ok test rebuild_candidate_discovery_unreadable_artifact ... ok test rebuild_evidence_invalid_scope ... ok test rebuild_candidate_discovery_stale_targets ... ok test rebuild_candidate_discovery_plan_fingerprint_drift ... ok test rebuild_evidence_command_shape ... ok test rebuild_evidence_json_output_fields ... ok test rebuild_evidence_dry_run_is_noop ... ok test rebuild_evidence_rejects_parallel_max_jobs ... ok test rebuild_evidence_manual_required_default ... ok test rebuild_evidence_legacy_summary_command_replays ... ok test rebuild_evidence_json_schema ... ok test rebuild_evidence_manual_required_rerun_resumes_open_step ... ok test rebuild_evidence_rejects_zero_max_jobs ... ok test rebuild_evidence_session_not_found ... ok test rebuild_evidence_scope_empty ... ok test rebuild_evidence_refreshes_prior_task_closure_receipts_across_tasks ... ok test rebuild_evidence_text_output_summary ... ok test rebuild_evidence_verify_command_failed_rerun_resumes_open_step ... ok test rebuild_evidence_state_transition_blocked_rerun_resumes_open_step ... ok test rebuild_executor_no_output_summary ... ok test rebuild_executor_reopens_and_recompletes ... ok test rebuild_evidence_text_failure_output ... ok test rebuild_state_transition_retry_rehydrates_verify_command ... ok test rebuild_target_race_detected ... ok test rebuild_target_race_retries_and_rehydrates_verify_command ... ok test rebuild_target_state_transition_blocked ... ok test rebuild_evidence_partial_failure_resume ... ok test rebuild_evidence_exit_statuses ... ok test rebuild_evidence_noop_and_partial_failures ... ok test result: ok. 31 passed; 0 failed; 0 ignored; 0 measured; 167 filtered out; finished in 3.44s
**Invalidation Reason:** Evidence rebuild: files_proven_drifted

#### Attempt 3
**Status:** Invalidated
**Recorded At:** 2026-03-30T21:57:40.901775Z
**Execution Source:** featureforge:executing-plans
**Task Number:** 5
**Step Number:** 4
**Packet Fingerprint:** 31ceabb9f2729c0e6c9c5b8173881a64a91057d2d9823269e86620059a9e571d
**Head SHA:** 1f93d03d042759e81f9a22b95edc26a6b8d40bdc
**Base SHA:** 1f93d03d042759e81f9a22b95edc26a6b8d40bdc
**Claim:** Added exact JSON schema coverage for rebuild-evidence output, including stable top-level and nested key order for structured parsing consumers.
**Files Proven:**
- tests/plan_execution.rs | sha256:349a9525649bb6107203aaa542dd82d54a2f69a7e0ae66dbdbbdce3ae05fa70f
**Verify Command:** cargo test --test plan_execution -- rebuild_evidence_json_schema --exact && cargo test --test plan_execution rebuild_
**Verification Summary:** `cargo test --test plan_execution -- rebuild_evidence_json_schema --exact && cargo test --test plan_execution rebuild_` -> passed: running 1 test test rebuild_evidence_json_schema ... ok test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 199 filtered out; finished in 1.09s running 31 tests test rebuild_candidate_discovery_source_spec_fingerprint_drift ... ok test rebuild_candidate_filtering ... ok test rebuild_evidence_command_shape ... ok test rebuild_candidate_discovery_stale_targets ... ok test rebuild_candidate_discovery_plan_fingerprint_drift ... ok test rebuild_candidate_discovery_unreadable_artifact ... ok test rebuild_evidence_invalid_scope ... ok test rebuild_evidence_json_output_fields ... ok test rebuild_evidence_dry_run_is_noop ... ok test rebuild_evidence_rejects_parallel_max_jobs ... ok test rebuild_evidence_manual_required_default ... ok test rebuild_evidence_json_schema ... ok test rebuild_evidence_manual_required_rerun_resumes_open_step ... ok test rebuild_evidence_rejects_zero_max_jobs ... ok test rebuild_evidence_legacy_summary_command_replays ... ok test rebuild_evidence_session_not_found ... ok test rebuild_evidence_scope_empty ... ok test rebuild_evidence_refreshes_prior_task_closure_receipts_across_tasks ... ok test rebuild_evidence_text_output_summary ... ok test rebuild_evidence_verify_command_failed_rerun_resumes_open_step ... ok test rebuild_evidence_state_transition_blocked_rerun_resumes_open_step ... ok test rebuild_executor_no_output_summary ... ok test rebuild_executor_reopens_and_recompletes ... ok test rebuild_evidence_text_failure_output ... ok test rebuild_state_transition_retry_rehydrates_verify_command ... ok test rebuild_target_race_detected ... ok test rebuild_target_race_retries_and_rehydrates_verify_command ... ok test rebuild_target_state_transition_blocked ... ok test rebuild_evidence_partial_failure_resume ... ok test rebuild_evidence_exit_statuses ... ok test rebuild_evidence_noop_and_partial_failures ... ok test result: ok. 31 passed; 0 failed; 0 ignored; 0 measured; 169 filtered out; finished in 3.60s
**Invalidation Reason:** Evidence rebuild: files_proven_drifted

#### Attempt 4
**Status:** Invalidated
**Recorded At:** 2026-03-31T01:09:16.313101Z
**Execution Source:** featureforge:executing-plans
**Task Number:** 5
**Step Number:** 4
**Packet Fingerprint:** 31ceabb9f2729c0e6c9c5b8173881a64a91057d2d9823269e86620059a9e571d
**Head SHA:** 1f93d03d042759e81f9a22b95edc26a6b8d40bdc
**Base SHA:** 1f93d03d042759e81f9a22b95edc26a6b8d40bdc
**Claim:** Added exact JSON schema coverage for rebuild-evidence output, including stable top-level and nested key order for structured parsing consumers.
**Files Proven:**
- tests/plan_execution.rs | sha256:61a62e274acb4404534c434fe25936e0cc9f813839631bf0de795fe3aec10d74
**Verify Command:** cargo test --test plan_execution -- rebuild_evidence_json_schema --exact && cargo test --test plan_execution rebuild_
**Verification Summary:** `cargo test --test plan_execution -- rebuild_evidence_json_schema --exact && cargo test --test plan_execution rebuild_` -> passed: running 1 test test rebuild_evidence_json_schema ... ok test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 201 filtered out; finished in 0.91s running 33 tests test rebuild_evidence_command_shape ... ok test rebuild_evidence_invalid_scope ... ok test rebuild_candidate_discovery_stale_targets ... ok test rebuild_candidate_discovery_unreadable_artifact ... ok test rebuild_candidate_discovery_plan_fingerprint_drift ... ok test rebuild_candidate_discovery_source_spec_fingerprint_drift ... ok test rebuild_candidate_filtering ... ok test rebuild_evidence_dry_run_is_noop ... ok test rebuild_evidence_does_not_publish_contract_bound_receipts_without_active_contract ... ok test rebuild_evidence_manual_required_default ... ok test rebuild_evidence_json_output_fields ... ok test rebuild_evidence_legacy_summary_command_replays ... ok test rebuild_evidence_manual_required_rerun_resumes_open_step ... ok test rebuild_evidence_json_schema ... ok test rebuild_evidence_rejects_parallel_max_jobs ... ok test rebuild_evidence_rejects_zero_max_jobs ... ok test rebuild_evidence_session_not_found ... ok test rebuild_evidence_scope_empty ... ok test rebuild_evidence_refreshes_prior_task_closure_receipts_across_tasks ... ok test rebuild_evidence_state_transition_blocked_rerun_resumes_open_step ... ok test rebuild_evidence_text_output_summary ... ok test rebuild_evidence_verify_command_failed_rerun_resumes_open_step ... ok test rebuild_executor_no_output_summary ... ok test rebuild_evidence_reuses_active_contract_for_serial_unit_review_receipts ... ok test rebuild_evidence_text_failure_output ... ok test rebuild_executor_reopens_and_recompletes ... ok test rebuild_state_transition_retry_rehydrates_verify_command ... ok test rebuild_evidence_partial_failure_resume ... ok test rebuild_target_race_detected ... ok test rebuild_target_state_transition_blocked ... ok test rebuild_target_race_retries_and_rehydrates_verify_command ... ok test rebuild_evidence_exit_statuses ... ok test rebuild_evidence_noop_and_partial_failures ... ok test result: ok. 33 passed; 0 failed; 0 ignored; 0 measured; 169 filtered out; finished in 3.81s
**Invalidation Reason:** Evidence rebuild: files_proven_drifted

#### Attempt 5
**Status:** Invalidated
**Recorded At:** 2026-03-31T01:15:47.541966Z
**Execution Source:** featureforge:executing-plans
**Task Number:** 5
**Step Number:** 4
**Packet Fingerprint:** 31ceabb9f2729c0e6c9c5b8173881a64a91057d2d9823269e86620059a9e571d
**Head SHA:** 3a6a1610f1d611a85cc50964438053167b832265
**Base SHA:** 3a6a1610f1d611a85cc50964438053167b832265
**Claim:** Added exact JSON schema coverage for rebuild-evidence output, including stable top-level and nested key order for structured parsing consumers.
**Files Proven:**
- tests/plan_execution.rs | sha256:96a93d5707e93ae57952c6f9a4dd3fca6834895a936d20fb83555fc1d6969452
**Verify Command:** cargo test --test plan_execution -- rebuild_evidence_json_schema --exact && cargo test --test plan_execution rebuild_
**Verification Summary:** `cargo test --test plan_execution -- rebuild_evidence_json_schema --exact && cargo test --test plan_execution rebuild_` -> passed: running 1 test test rebuild_evidence_json_schema ... ok test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 204 filtered out; finished in 1.19s running 35 tests test rebuild_candidate_discovery_source_spec_fingerprint_drift ... ok test rebuild_candidate_discovery_unreadable_artifact ... ok test rebuild_evidence_command_shape ... ok test rebuild_candidate_filtering ... ok test rebuild_candidate_discovery_plan_fingerprint_drift ... ok test rebuild_candidate_discovery_stale_targets ... ok test rebuild_evidence_dry_run_is_noop ... ok test rebuild_evidence_does_not_publish_contract_bound_receipts_without_active_contract ... ok test rebuild_evidence_invalid_scope ... ok test rebuild_evidence_clears_later_interrupted_step_before_reopening_earlier_target ... ok test rebuild_evidence_manual_required_default ... ok test rebuild_evidence_json_output_fields ... ok test rebuild_evidence_legacy_summary_command_replays ... ok test rebuild_evidence_json_schema ... ok test rebuild_evidence_manual_required_rerun_resumes_open_step ... ok test rebuild_evidence_rejects_parallel_max_jobs ... ok test rebuild_evidence_session_not_found ... ok test rebuild_evidence_rejects_zero_max_jobs ... ok test rebuild_evidence_scope_empty ... ok test rebuild_evidence_refreshes_prior_task_closure_receipts_across_tasks ... ok test rebuild_evidence_refreshes_preflight_acceptance_before_task_boundary_receipt_recovery ... ok test rebuild_evidence_text_output_summary ... ok test rebuild_evidence_verify_command_failed_rerun_resumes_open_step ... ok test rebuild_evidence_state_transition_blocked_rerun_resumes_open_step ... ok test rebuild_evidence_reuses_active_contract_for_serial_unit_review_receipts ... ok test rebuild_evidence_text_failure_output ... ok test rebuild_executor_no_output_summary ... ok test rebuild_executor_reopens_and_recompletes ... ok test rebuild_state_transition_retry_rehydrates_verify_command ... ok test rebuild_target_state_transition_blocked ... ok test rebuild_target_race_detected ... ok test rebuild_target_race_retries_and_rehydrates_verify_command ... ok test rebuild_evidence_partial_failure_resume ... ok test rebuild_evidence_exit_statuses ... ok test rebuild_evidence_noop_and_partial_failures ... ok test result: ok. 35 passed; 0 failed; 0 ignored; 0 measured; 170 filtered out; finished in 3.89s
**Invalidation Reason:** Evidence rebuild: files_proven_drifted

#### Attempt 6
**Status:** Invalidated
**Recorded At:** 2026-03-31T02:18:26.895248Z
**Execution Source:** featureforge:executing-plans
**Task Number:** 5
**Step Number:** 4
**Packet Fingerprint:** 31ceabb9f2729c0e6c9c5b8173881a64a91057d2d9823269e86620059a9e571d
**Head SHA:** 3a6a1610f1d611a85cc50964438053167b832265
**Base SHA:** 3a6a1610f1d611a85cc50964438053167b832265
**Claim:** Added exact JSON schema coverage for rebuild-evidence output, including stable top-level and nested key order for structured parsing consumers.
**Files Proven:**
- tests/plan_execution.rs | sha256:1c9ef0d722ac2844abf382057fd3a3b921e7b41d94d78736f18a323a6f88d867
**Verify Command:** cargo test --test plan_execution -- rebuild_evidence_json_schema --exact && cargo test --test plan_execution rebuild_
**Verification Summary:** `cargo test --test plan_execution -- rebuild_evidence_json_schema --exact && cargo test --test plan_execution rebuild_` -> passed: running 1 test test rebuild_evidence_json_schema ... ok test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 205 filtered out; finished in 0.90s running 35 tests test rebuild_candidate_discovery_plan_fingerprint_drift ... ok test rebuild_candidate_filtering ... ok test rebuild_candidate_discovery_source_spec_fingerprint_drift ... ok test rebuild_evidence_command_shape ... ok test rebuild_candidate_discovery_stale_targets ... ok test rebuild_candidate_discovery_unreadable_artifact ... ok test rebuild_evidence_dry_run_is_noop ... ok test rebuild_evidence_does_not_publish_contract_bound_receipts_without_active_contract ... ok test rebuild_evidence_invalid_scope ... ok test rebuild_evidence_clears_later_interrupted_step_before_reopening_earlier_target ... ok test rebuild_evidence_manual_required_default ... ok test rebuild_evidence_json_schema ... ok test rebuild_evidence_manual_required_rerun_resumes_open_step ... ok test rebuild_evidence_legacy_summary_command_replays ... ok test rebuild_evidence_json_output_fields ... ok test rebuild_evidence_rejects_parallel_max_jobs ... ok test rebuild_evidence_session_not_found ... ok test rebuild_evidence_rejects_zero_max_jobs ... ok test rebuild_evidence_scope_empty ... ok test rebuild_evidence_refreshes_prior_task_closure_receipts_across_tasks ... ok test rebuild_evidence_text_output_summary ... ok test rebuild_evidence_refreshes_preflight_acceptance_before_task_boundary_receipt_recovery ... ok test rebuild_evidence_state_transition_blocked_rerun_resumes_open_step ... ok test rebuild_evidence_reuses_active_contract_for_serial_unit_review_receipts ... ok test rebuild_evidence_verify_command_failed_rerun_resumes_open_step ... ok test rebuild_evidence_text_failure_output ... ok test rebuild_executor_no_output_summary ... ok test rebuild_executor_reopens_and_recompletes ... ok test rebuild_state_transition_retry_rehydrates_verify_command ... ok test rebuild_target_race_detected ... ok test rebuild_target_state_transition_blocked ... ok test rebuild_target_race_retries_and_rehydrates_verify_command ... ok test rebuild_evidence_partial_failure_resume ... ok test rebuild_evidence_exit_statuses ... ok test rebuild_evidence_noop_and_partial_failures ... ok test result: ok. 35 passed; 0 failed; 0 ignored; 0 measured; 171 filtered out; finished in 3.89s
**Invalidation Reason:** Evidence rebuild: files_proven_drifted

#### Attempt 7
**Status:** Invalidated
**Recorded At:** 2026-03-31T02:56:53.046046Z
**Execution Source:** featureforge:executing-plans
**Task Number:** 5
**Step Number:** 4
**Packet Fingerprint:** 31ceabb9f2729c0e6c9c5b8173881a64a91057d2d9823269e86620059a9e571d
**Head SHA:** 3a6a1610f1d611a85cc50964438053167b832265
**Base SHA:** 3a6a1610f1d611a85cc50964438053167b832265
**Claim:** Added exact JSON schema coverage for rebuild-evidence output, including stable top-level and nested key order for structured parsing consumers.
**Files Proven:**
- tests/plan_execution.rs | sha256:4fd9b03c352413cb54bbdcf1f9b35645095cce7f423c354201095f9cf5691247
**Verify Command:** cargo test --test plan_execution -- rebuild_evidence_json_schema --exact && cargo test --test plan_execution rebuild_
**Verification Summary:** `cargo test --test plan_execution -- rebuild_evidence_json_schema --exact && cargo test --test plan_execution rebuild_` -> passed: running 1 test test rebuild_evidence_json_schema ... ok test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 207 filtered out; finished in 0.95s running 37 tests test rebuild_evidence_command_shape ... ok test rebuild_candidate_discovery_source_spec_fingerprint_drift ... ok test rebuild_candidate_discovery_plan_fingerprint_drift ... ok test rebuild_candidate_discovery_unreadable_artifact ... ok test rebuild_candidate_discovery_stale_targets ... ok test rebuild_candidate_filtering ... ok test rebuild_evidence_dry_run_is_noop ... ok test rebuild_evidence_does_not_publish_contract_bound_receipts_without_active_contract ... ok test rebuild_evidence_invalid_scope ... ok test rebuild_evidence_clears_later_interrupted_step_before_reopening_earlier_target ... ok test rebuild_evidence_manual_required_default ... ok test rebuild_evidence_manual_required_rerun_resumes_open_step ... ok test rebuild_evidence_json_schema ... ok test rebuild_evidence_json_output_fields ... ok test rebuild_evidence_legacy_summary_command_replays ... ok test rebuild_evidence_rejects_parallel_max_jobs ... ok test rebuild_evidence_rejects_zero_max_jobs ... ok test rebuild_evidence_session_not_found ... ok test rebuild_evidence_scope_empty ... ok test rebuild_evidence_refreshes_prior_task_closure_receipts_across_tasks ... ok test rebuild_evidence_refreshes_malformed_prior_task_review_receipt_before_task_boundary_retry ... ok test rebuild_evidence_reuses_active_contract_for_serial_unit_review_receipts ... ok test rebuild_evidence_refreshes_non_independent_prior_task_review_receipt_before_task_boundary_retry ... ok test rebuild_evidence_refreshes_preflight_acceptance_before_task_boundary_receipt_recovery ... ok test rebuild_evidence_state_transition_blocked_rerun_resumes_open_step ... ok test rebuild_evidence_text_output_summary ... ok test rebuild_evidence_verify_command_failed_rerun_resumes_open_step ... ok test rebuild_executor_no_output_summary ... ok test rebuild_executor_reopens_and_recompletes ... ok test rebuild_evidence_text_failure_output ... ok test rebuild_state_transition_retry_rehydrates_verify_command ... ok test rebuild_evidence_partial_failure_resume ... ok test rebuild_target_race_detected ... ok test rebuild_target_race_retries_and_rehydrates_verify_command ... ok test rebuild_target_state_transition_blocked ... ok test rebuild_evidence_exit_statuses ... ok test rebuild_evidence_noop_and_partial_failures ... ok test result: ok. 37 passed; 0 failed; 0 ignored; 0 measured; 171 filtered out; finished in 4.12s
**Invalidation Reason:** Evidence rebuild: files_proven_drifted

#### Attempt 8
**Status:** Invalidated
**Recorded At:** 2026-03-31T03:30:47.637602Z
**Execution Source:** featureforge:executing-plans
**Task Number:** 5
**Step Number:** 4
**Packet Fingerprint:** 31ceabb9f2729c0e6c9c5b8173881a64a91057d2d9823269e86620059a9e571d
**Head SHA:** 3a6a1610f1d611a85cc50964438053167b832265
**Base SHA:** 3a6a1610f1d611a85cc50964438053167b832265
**Claim:** Added exact JSON schema coverage for rebuild-evidence output, including stable top-level and nested key order for structured parsing consumers.
**Files Proven:**
- tests/plan_execution.rs | sha256:e5681ed1b1658fd0badb93e2a8ddba9481a316027ea01fc313ee8f5c98fe4a3e
**Verify Command:** cargo test --test plan_execution -- rebuild_evidence_json_schema --exact && cargo test --test plan_execution rebuild_
**Verification Summary:** `cargo test --test plan_execution -- rebuild_evidence_json_schema --exact && cargo test --test plan_execution rebuild_` -> passed: running 1 test test rebuild_evidence_json_schema ... ok test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 208 filtered out; finished in 1.18s running 38 tests test rebuild_candidate_filtering ... ok test rebuild_candidate_discovery_plan_fingerprint_drift ... ok test rebuild_candidate_discovery_stale_targets ... ok test rebuild_evidence_command_shape ... ok test rebuild_candidate_discovery_source_spec_fingerprint_drift ... ok test rebuild_candidate_discovery_unreadable_artifact ... ok test rebuild_evidence_dry_run_is_noop ... ok test rebuild_evidence_does_not_publish_contract_bound_receipts_without_active_contract ... ok test rebuild_evidence_invalid_scope ... ok test rebuild_evidence_clears_later_interrupted_step_before_reopening_earlier_target ... ok test rebuild_evidence_manual_required_default ... ok test rebuild_evidence_json_output_fields ... ok test rebuild_evidence_json_schema ... ok test rebuild_evidence_legacy_summary_command_replays ... ok test rebuild_evidence_manual_required_does_not_block_later_command_targets ... ok test rebuild_evidence_manual_required_rerun_resumes_open_step ... ok test rebuild_evidence_rejects_parallel_max_jobs ... ok test rebuild_evidence_rejects_zero_max_jobs ... ok test rebuild_evidence_scope_empty ... ok test rebuild_evidence_session_not_found ... ok test rebuild_evidence_refreshes_prior_task_closure_receipts_across_tasks ... ok test rebuild_evidence_refreshes_malformed_prior_task_review_receipt_before_task_boundary_retry ... ok test rebuild_evidence_refreshes_non_independent_prior_task_review_receipt_before_task_boundary_retry ... ok test rebuild_evidence_refreshes_preflight_acceptance_before_task_boundary_receipt_recovery ... ok test rebuild_evidence_reuses_active_contract_for_serial_unit_review_receipts ... ok test rebuild_evidence_state_transition_blocked_rerun_resumes_open_step ... ok test rebuild_evidence_text_output_summary ... ok test rebuild_evidence_verify_command_failed_rerun_resumes_open_step ... ok test rebuild_executor_no_output_summary ... ok test rebuild_executor_reopens_and_recompletes ... ok test rebuild_evidence_text_failure_output ... ok test rebuild_evidence_partial_failure_resume ... ok test rebuild_state_transition_retry_rehydrates_verify_command ... ok test rebuild_target_race_detected ... ok test rebuild_target_race_retries_and_rehydrates_verify_command ... ok test rebuild_target_state_transition_blocked ... ok test rebuild_evidence_exit_statuses ... ok test rebuild_evidence_noop_and_partial_failures ... ok test result: ok. 38 passed; 0 failed; 0 ignored; 0 measured; 171 filtered out; finished in 4.28s
**Invalidation Reason:** Evidence rebuild: files_proven_drifted

#### Attempt 9
**Status:** Invalidated
**Recorded At:** 2026-03-31T19:20:28.700944Z
**Execution Source:** featureforge:executing-plans
**Task Number:** 5
**Step Number:** 4
**Packet Fingerprint:** 31ceabb9f2729c0e6c9c5b8173881a64a91057d2d9823269e86620059a9e571d
**Head SHA:** 3a6a1610f1d611a85cc50964438053167b832265
**Base SHA:** 3a6a1610f1d611a85cc50964438053167b832265
**Claim:** Added exact JSON schema coverage for rebuild-evidence output, including stable top-level and nested key order for structured parsing consumers.
**Files Proven:**
- tests/plan_execution.rs | sha256:ee07e11ff22b072a892162470aadcc88b925459e3daab7ad4e7aaee38679fe36
**Verify Command:** cargo test --test plan_execution -- rebuild_evidence_json_schema --exact && cargo test --test plan_execution rebuild_
**Verification Summary:** `cargo test --test plan_execution -- rebuild_evidence_json_schema --exact && cargo test --test plan_execution rebuild_` -> passed: running 1 test test rebuild_evidence_json_schema ... ok test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 209 filtered out; finished in 0.94s running 39 tests test rebuild_candidate_discovery_stale_targets ... ok test rebuild_candidate_discovery_plan_fingerprint_drift ... ok test rebuild_candidate_discovery_unreadable_artifact ... ok test rebuild_candidate_discovery_source_spec_fingerprint_drift ... ok test rebuild_candidate_filtering ... ok test rebuild_evidence_command_shape ... ok test rebuild_evidence_dry_run_is_noop ... ok test rebuild_evidence_does_not_publish_contract_bound_receipts_without_active_contract ... ok test rebuild_evidence_invalid_scope ... ok test rebuild_evidence_clears_later_interrupted_step_before_reopening_earlier_target ... ok test rebuild_evidence_manual_required_default ... ok test rebuild_evidence_json_schema ... ok test rebuild_evidence_json_output_fields ... ok test rebuild_evidence_legacy_summary_command_replays ... ok test rebuild_evidence_manual_required_does_not_block_later_command_targets ... ok test rebuild_evidence_manual_required_rerun_resumes_open_step ... ok test rebuild_evidence_rejects_zero_max_jobs ... ok test rebuild_evidence_rejects_parallel_max_jobs ... ok test rebuild_evidence_noop_refreshes_receipt_only_strategy_checkpoint_drift ... ok test rebuild_evidence_scope_empty ... ok test rebuild_evidence_session_not_found ... ok test rebuild_evidence_refreshes_prior_task_closure_receipts_across_tasks ... ok test rebuild_evidence_refreshes_malformed_prior_task_review_receipt_before_task_boundary_retry ... ok test rebuild_evidence_refreshes_non_independent_prior_task_review_receipt_before_task_boundary_retry ... ok test rebuild_evidence_refreshes_preflight_acceptance_before_task_boundary_receipt_recovery ... ok test rebuild_evidence_text_output_summary ... ok test rebuild_evidence_reuses_active_contract_for_serial_unit_review_receipts ... ok test rebuild_evidence_state_transition_blocked_rerun_resumes_open_step ... ok test rebuild_evidence_verify_command_failed_rerun_resumes_open_step ... ok test rebuild_executor_no_output_summary ... ok test rebuild_executor_reopens_and_recompletes ... ok test rebuild_evidence_text_failure_output ... ok test rebuild_evidence_partial_failure_resume ... ok test rebuild_state_transition_retry_rehydrates_verify_command ... ok test rebuild_target_race_detected ... ok test rebuild_target_state_transition_blocked ... ok test rebuild_target_race_retries_and_rehydrates_verify_command ... ok test rebuild_evidence_exit_statuses ... ok test rebuild_evidence_noop_and_partial_failures ... ok test result: ok. 39 passed; 0 failed; 0 ignored; 0 measured; 171 filtered out; finished in 4.32s
**Invalidation Reason:** Evidence rebuild: packet_fingerprint_mismatch

#### Attempt 10
**Status:** Invalidated
**Recorded At:** 2026-03-31T21:46:06.531353Z
**Execution Source:** featureforge:executing-plans
**Task Number:** 5
**Step Number:** 4
**Packet Fingerprint:** 84cb458a087238be04f6f019228b83e31e89cd544cba8e8c666e31227eac6e00
**Head SHA:** 2f97045889529eeb7d7214a0500963d34e9cf47d
**Base SHA:** 2f97045889529eeb7d7214a0500963d34e9cf47d
**Claim:** Added exact JSON schema coverage for rebuild-evidence output, including stable top-level and nested key order for structured parsing consumers.
**Files Proven:**
- tests/plan_execution.rs | sha256:16d6e788dd8c83391c96898ba801e1e7f8ba03589a0c33802e00ef596e2814a4
**Verify Command:** cargo test --test plan_execution -- rebuild_evidence_json_schema --exact && cargo test --test plan_execution rebuild_
**Verification Summary:** `cargo test --test plan_execution -- rebuild_evidence_json_schema --exact && cargo test --test plan_execution rebuild_` -> passed: running 1 test test rebuild_evidence_json_schema ... ok test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 220 filtered out; finished in 1.24s running 41 tests test rebuild_candidate_discovery_plan_fingerprint_drift ... ok test rebuild_evidence_command_shape ... ok test rebuild_candidate_discovery_stale_targets ... ok test rebuild_candidate_discovery_unreadable_artifact ... ok test rebuild_candidate_discovery_source_spec_fingerprint_drift ... ok test rebuild_candidate_filtering ... ok test rebuild_evidence_continue_on_error_clears_failed_earlier_interrupted_target ... ok test rebuild_evidence_dry_run_is_noop ... ok test rebuild_evidence_does_not_publish_contract_bound_receipts_without_active_contract ... ok test rebuild_evidence_invalid_scope ... ok test rebuild_evidence_clears_later_interrupted_step_before_reopening_earlier_target ... ok test rebuild_evidence_manual_required_default ... ok test rebuild_evidence_json_output_fields ... ok test rebuild_evidence_legacy_summary_command_replays ... ok test rebuild_evidence_json_schema ... ok test rebuild_evidence_manual_required_rerun_resumes_open_step ... ok test rebuild_evidence_manual_required_does_not_block_later_command_targets ... ok test rebuild_evidence_rejects_parallel_max_jobs ... ok test rebuild_evidence_noop_refreshes_receipt_only_strategy_checkpoint_drift ... ok test rebuild_evidence_rejects_zero_max_jobs ... ok test rebuild_evidence_refreshes_prior_task_closure_receipts_across_tasks ... ok test rebuild_evidence_scope_empty ... ok test rebuild_evidence_refreshes_preflight_acceptance_before_task_boundary_receipt_recovery ... ok test rebuild_evidence_refreshes_malformed_prior_task_review_receipt_before_task_boundary_retry ... ok test rebuild_evidence_refreshes_non_independent_prior_task_review_receipt_before_task_boundary_retry ... ok test rebuild_evidence_session_not_found ... ok test rebuild_evidence_restores_post_execution_state_when_prior_task_review_dispatch_missing ... ok test rebuild_evidence_reuses_active_contract_for_serial_unit_review_receipts ... ok test rebuild_evidence_state_transition_blocked_rerun_resumes_open_step ... ok test rebuild_evidence_text_output_summary ... ok test rebuild_evidence_verify_command_failed_rerun_resumes_open_step ... ok test rebuild_executor_no_output_summary ... ok test rebuild_evidence_partial_failure_resume ... ok test rebuild_evidence_text_failure_output ... ok test rebuild_executor_reopens_and_recompletes ... ok test rebuild_state_transition_retry_rehydrates_verify_command ... ok test rebuild_target_race_detected ... ok test rebuild_target_state_transition_blocked ... ok test rebuild_target_race_retries_and_rehydrates_verify_command ... ok test rebuild_evidence_noop_and_partial_failures ... ok test rebuild_evidence_exit_statuses ... ok test result: ok. 41 passed; 0 failed; 0 ignored; 0 measured; 180 filtered out; finished in 6.24s
**Invalidation Reason:** Evidence rebuild: files_proven_drifted

#### Attempt 11
**Status:** Invalidated
**Recorded At:** 2026-03-31T22:58:15.411341Z
**Execution Source:** featureforge:executing-plans
**Task Number:** 5
**Step Number:** 4
**Packet Fingerprint:** 84cb458a087238be04f6f019228b83e31e89cd544cba8e8c666e31227eac6e00
**Head SHA:** 2f97045889529eeb7d7214a0500963d34e9cf47d
**Base SHA:** 2f97045889529eeb7d7214a0500963d34e9cf47d
**Claim:** Added exact JSON schema coverage for rebuild-evidence output, including stable top-level and nested key order for structured parsing consumers.
**Files Proven:**
- tests/plan_execution.rs | sha256:80321c51e5813a2375223df35d682651d11b9de3580392a86c691b77a4845010
**Verify Command:** cargo test --test plan_execution -- rebuild_evidence_json_schema --exact && cargo test --test plan_execution rebuild_
**Verification Summary:** `cargo test --test plan_execution -- rebuild_evidence_json_schema --exact && cargo test --test plan_execution rebuild_` -> passed: running 1 test test rebuild_evidence_json_schema ... ok test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 221 filtered out; finished in 0.94s running 42 tests test rebuild_candidate_discovery_source_spec_fingerprint_drift ... ok test rebuild_candidate_discovery_unreadable_artifact ... ok test rebuild_candidate_filtering ... ok test rebuild_evidence_command_shape ... ok test rebuild_candidate_discovery_plan_fingerprint_drift ... ok test rebuild_candidate_discovery_stale_targets ... ok test rebuild_evidence_continue_on_error_clears_failed_earlier_interrupted_target ... ok test rebuild_evidence_dry_run_is_noop ... ok test rebuild_evidence_does_not_publish_contract_bound_receipts_without_active_contract ... ok test rebuild_evidence_invalid_scope ... ok test rebuild_evidence_clears_later_interrupted_step_before_reopening_earlier_target ... ok test rebuild_evidence_manual_required_default ... ok test rebuild_evidence_json_output_fields ... ok test rebuild_evidence_json_schema ... ok test rebuild_evidence_legacy_summary_command_replays ... ok test rebuild_evidence_manual_required_rerun_resumes_open_step ... ok test rebuild_evidence_manual_required_does_not_block_later_command_targets ... ok test rebuild_evidence_noop_refreshes_receipt_only_strategy_checkpoint_drift ... ok test rebuild_evidence_rejects_parallel_max_jobs ... ok test rebuild_evidence_rejects_zero_max_jobs ... ok test rebuild_evidence_refreshes_prior_task_closure_receipts_across_tasks ... ok test rebuild_evidence_refreshes_preflight_acceptance_before_task_boundary_receipt_recovery ... ok test rebuild_evidence_refreshes_malformed_prior_task_review_receipt_before_task_boundary_retry ... ok test rebuild_evidence_refreshes_non_independent_prior_task_review_receipt_before_task_boundary_retry ... ok test rebuild_evidence_scope_empty ... ok test rebuild_evidence_session_not_found ... ok test rebuild_evidence_restores_post_execution_state_when_prior_task_review_dispatch_missing ... ok test rebuild_evidence_reuses_active_contract_for_serial_unit_review_receipts ... ok test rebuild_evidence_text_output_summary ... ok test rebuild_evidence_partial_failure_resume ... ok test rebuild_evidence_state_transition_blocked_rerun_resumes_open_step ... ok test rebuild_evidence_verify_command_failed_rerun_resumes_open_step ... ok test rebuild_executor_no_output_summary ... ok test rebuild_evidence_text_failure_output ... ok test rebuild_executor_reopens_and_recompletes ... ok test rebuild_evidence_restores_authoritative_late_gate_truth_after_successful_rebuild ... ok test rebuild_state_transition_retry_rehydrates_verify_command ... ok test rebuild_target_race_detected ... ok test rebuild_target_race_retries_and_rehydrates_verify_command ... ok test rebuild_target_state_transition_blocked ... ok test rebuild_evidence_noop_and_partial_failures ... ok test rebuild_evidence_exit_statuses ... ok test result: ok. 42 passed; 0 failed; 0 ignored; 0 measured; 180 filtered out; finished in 5.01s
**Invalidation Reason:** Evidence rebuild: files_proven_drifted

#### Attempt 12
**Status:** Invalidated
**Recorded At:** 2026-03-31T23:47:30.597814Z
**Execution Source:** featureforge:executing-plans
**Task Number:** 5
**Step Number:** 4
**Packet Fingerprint:** 84cb458a087238be04f6f019228b83e31e89cd544cba8e8c666e31227eac6e00
**Head SHA:** 2f97045889529eeb7d7214a0500963d34e9cf47d
**Base SHA:** 2f97045889529eeb7d7214a0500963d34e9cf47d
**Claim:** Added exact JSON schema coverage for rebuild-evidence output, including stable top-level and nested key order for structured parsing consumers.
**Files Proven:**
- tests/plan_execution.rs | sha256:fa1ea9d0d4c8771f7f8a241591a09f7553339601b85eb410bdc7ae26630f3d7c
**Verify Command:** cargo test --test plan_execution -- rebuild_evidence_json_schema --exact && cargo test --test plan_execution rebuild_
**Verification Summary:** `cargo test --test plan_execution -- rebuild_evidence_json_schema --exact && cargo test --test plan_execution rebuild_` -> passed: running 1 test test rebuild_evidence_json_schema ... ok test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 222 filtered out; finished in 0.95s running 43 tests test rebuild_candidate_discovery_stale_targets ... ok test rebuild_candidate_discovery_source_spec_fingerprint_drift ... ok test rebuild_candidate_discovery_unreadable_artifact ... ok test rebuild_evidence_command_shape ... ok test rebuild_candidate_discovery_plan_fingerprint_drift ... ok test rebuild_candidate_filtering ... ok test rebuild_evidence_continue_on_error_clears_failed_earlier_interrupted_target ... ok test rebuild_evidence_dry_run_is_noop ... ok test rebuild_evidence_does_not_publish_contract_bound_receipts_without_active_contract ... ok test rebuild_evidence_invalid_scope ... ok test rebuild_evidence_clears_later_interrupted_step_before_reopening_earlier_target ... ok test rebuild_evidence_manual_required_default ... ok test rebuild_evidence_json_output_fields ... ok test rebuild_evidence_json_schema ... ok test rebuild_evidence_legacy_summary_command_replays ... ok test rebuild_evidence_manual_required_rerun_resumes_open_step ... ok test rebuild_evidence_manual_required_does_not_block_later_command_targets ... ok test rebuild_evidence_noop_refreshes_receipt_only_strategy_checkpoint_drift ... ok test rebuild_evidence_rejects_parallel_max_jobs ... ok test rebuild_evidence_rejects_zero_max_jobs ... ok test rebuild_evidence_refreshes_prior_task_closure_receipts_across_tasks ... ok test rebuild_evidence_refreshes_preflight_acceptance_before_task_boundary_receipt_recovery ... ok test rebuild_evidence_refreshes_malformed_prior_task_review_receipt_before_task_boundary_retry ... ok test rebuild_evidence_refreshes_non_independent_prior_task_review_receipt_before_task_boundary_retry ... ok test rebuild_evidence_scope_empty ... ok test rebuild_evidence_session_not_found ... ok test rebuild_evidence_noop_restores_authoritative_late_gate_truth ... ok test rebuild_evidence_restores_post_execution_state_when_prior_task_review_dispatch_missing ... ok test rebuild_evidence_state_transition_blocked_rerun_resumes_open_step ... ok test rebuild_evidence_partial_failure_resume ... ok test rebuild_evidence_reuses_active_contract_for_serial_unit_review_receipts ... ok test rebuild_evidence_text_output_summary ... ok test rebuild_evidence_verify_command_failed_rerun_resumes_open_step ... ok test rebuild_evidence_restores_authoritative_late_gate_truth_after_successful_rebuild ... ok test rebuild_evidence_text_failure_output ... ok test rebuild_executor_no_output_summary ... ok test rebuild_executor_reopens_and_recompletes ... ok test rebuild_state_transition_retry_rehydrates_verify_command ... ok test rebuild_target_race_detected ... ok test rebuild_target_state_transition_blocked ... ok test rebuild_target_race_retries_and_rehydrates_verify_command ... ok test rebuild_evidence_exit_statuses ... ok test rebuild_evidence_noop_and_partial_failures ... ok test result: ok. 43 passed; 0 failed; 0 ignored; 0 measured; 180 filtered out; finished in 5.09s
**Invalidation Reason:** Evidence rebuild: files_proven_drifted

#### Attempt 13
**Status:** Invalidated
**Recorded At:** 2026-04-01T00:14:01.841899Z
**Execution Source:** featureforge:executing-plans
**Task Number:** 5
**Step Number:** 4
**Packet Fingerprint:** 84cb458a087238be04f6f019228b83e31e89cd544cba8e8c666e31227eac6e00
**Head SHA:** 2f97045889529eeb7d7214a0500963d34e9cf47d
**Base SHA:** 2f97045889529eeb7d7214a0500963d34e9cf47d
**Claim:** Added exact JSON schema coverage for rebuild-evidence output, including stable top-level and nested key order for structured parsing consumers.
**Files Proven:**
- tests/plan_execution.rs | sha256:3160dd51010756e39f120d7bd011c8c31ca696a0f56404d7d21fd0846ec54b7a
**Verify Command:** cargo test --test plan_execution -- rebuild_evidence_json_schema --exact && cargo test --test plan_execution rebuild_
**Verification Summary:** `cargo test --test plan_execution -- rebuild_evidence_json_schema --exact && cargo test --test plan_execution rebuild_` -> passed: running 1 test test rebuild_evidence_json_schema ... ok test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 223 filtered out; finished in 0.99s running 44 tests test rebuild_candidate_discovery_source_spec_fingerprint_drift ... ok test rebuild_candidate_discovery_unreadable_artifact ... ok test rebuild_evidence_command_shape ... ok test rebuild_candidate_discovery_plan_fingerprint_drift ... ok test rebuild_candidate_filtering ... ok test rebuild_candidate_discovery_stale_targets ... ok test rebuild_evidence_continue_on_error_clears_failed_earlier_interrupted_target ... ok test rebuild_evidence_dry_run_is_noop ... ok test rebuild_evidence_invalid_scope ... ok test rebuild_evidence_does_not_publish_contract_bound_receipts_without_active_contract ... ok test rebuild_evidence_clears_later_interrupted_step_before_reopening_earlier_target ... ok test rebuild_evidence_manual_required_default ... ok test rebuild_evidence_json_output_fields ... ok test rebuild_evidence_legacy_summary_command_replays ... ok test rebuild_evidence_json_schema ... ok test rebuild_evidence_manual_required_rerun_resumes_open_step ... ok test rebuild_evidence_manual_required_does_not_block_later_command_targets ... ok test rebuild_evidence_noop_refreshes_receipt_only_strategy_checkpoint_drift ... ok test rebuild_evidence_rejects_parallel_max_jobs ... ok test rebuild_evidence_refreshes_malformed_prior_task_review_receipt_before_task_boundary_retry ... ok test rebuild_evidence_refreshes_non_independent_prior_task_review_receipt_before_task_boundary_retry ... ok test rebuild_evidence_refreshes_prior_task_closure_receipts_across_tasks ... ok test rebuild_evidence_refreshes_preflight_acceptance_before_task_boundary_receipt_recovery ... ok test rebuild_evidence_rejects_zero_max_jobs ... ok test rebuild_evidence_noop_rebinds_late_gate_artifacts_after_rebase_only_head_drift ... ok test rebuild_evidence_noop_restores_authoritative_late_gate_truth ... ok test rebuild_evidence_scope_empty ... ok test rebuild_evidence_session_not_found ... ok test rebuild_evidence_partial_failure_resume ... ok test rebuild_evidence_state_transition_blocked_rerun_resumes_open_step ... ok test rebuild_evidence_text_output_summary ... ok test rebuild_evidence_restores_post_execution_state_when_prior_task_review_dispatch_missing ... ok test rebuild_evidence_reuses_active_contract_for_serial_unit_review_receipts ... ok test rebuild_evidence_verify_command_failed_rerun_resumes_open_step ... ok test rebuild_evidence_text_failure_output ... ok test rebuild_executor_no_output_summary ... ok test rebuild_executor_reopens_and_recompletes ... ok test rebuild_evidence_noop_and_partial_failures ... ok test rebuild_evidence_exit_statuses ... ok test rebuild_target_race_detected ... ok test rebuild_target_state_transition_blocked ... ok test rebuild_state_transition_retry_rehydrates_verify_command ... ok test rebuild_target_race_retries_and_rehydrates_verify_command ... ok test rebuild_evidence_restores_authoritative_late_gate_truth_after_successful_rebuild ... ok test result: ok. 44 passed; 0 failed; 0 ignored; 0 measured; 180 filtered out; finished in 5.57s
**Invalidation Reason:** Evidence rebuild: files_proven_drifted

#### Attempt 14
**Status:** Invalidated
**Recorded At:** 2026-04-01T00:31:07.805043Z
**Execution Source:** featureforge:executing-plans
**Task Number:** 5
**Step Number:** 4
**Packet Fingerprint:** 84cb458a087238be04f6f019228b83e31e89cd544cba8e8c666e31227eac6e00
**Head SHA:** 2f97045889529eeb7d7214a0500963d34e9cf47d
**Base SHA:** 2f97045889529eeb7d7214a0500963d34e9cf47d
**Claim:** Added exact JSON schema coverage for rebuild-evidence output, including stable top-level and nested key order for structured parsing consumers.
**Files Proven:**
- tests/plan_execution.rs | sha256:50f7d7bf9a2cec97ffca9899087009a10a798c325f00c8933c4e0a7e45d90842
**Verify Command:** cargo test --test plan_execution -- rebuild_evidence_json_schema --exact && cargo test --test plan_execution rebuild_
**Verification Summary:** `cargo test --test plan_execution -- rebuild_evidence_json_schema --exact && cargo test --test plan_execution rebuild_` -> passed: running 1 test test rebuild_evidence_json_schema ... ok test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 224 filtered out; finished in 1.02s running 45 tests test rebuild_candidate_filtering ... ok test rebuild_candidate_discovery_stale_targets ... ok test rebuild_candidate_discovery_source_spec_fingerprint_drift ... ok test rebuild_candidate_discovery_plan_fingerprint_drift ... ok test rebuild_evidence_command_shape ... ok test rebuild_candidate_discovery_unreadable_artifact ... ok test rebuild_evidence_continue_on_error_clears_failed_earlier_interrupted_target ... ok test rebuild_evidence_dry_run_is_noop ... ok test rebuild_evidence_does_not_publish_contract_bound_receipts_without_active_contract ... ok test rebuild_evidence_invalid_scope ... ok test rebuild_evidence_clears_later_interrupted_step_before_reopening_earlier_target ... ok test rebuild_evidence_manual_required_default ... ok test rebuild_evidence_json_output_fields ... ok test rebuild_evidence_json_schema ... ok test rebuild_evidence_legacy_summary_command_replays ... ok test rebuild_evidence_manual_required_rerun_resumes_open_step ... ok test rebuild_evidence_manual_required_does_not_block_later_command_targets ... ok test rebuild_evidence_noop_refreshes_receipt_only_strategy_checkpoint_drift ... ok test rebuild_evidence_refreshes_malformed_prior_task_review_receipt_before_task_boundary_retry ... ok test rebuild_evidence_refreshes_preflight_acceptance_before_task_boundary_receipt_recovery ... ok test rebuild_evidence_refreshes_non_independent_prior_task_review_receipt_before_task_boundary_retry ... ok test rebuild_evidence_noop_rebinds_late_gate_artifacts_after_rebase_only_head_drift ... ok test rebuild_evidence_noop_restores_authoritative_late_gate_truth ... ok test rebuild_evidence_refreshes_prior_task_closure_receipts_across_tasks ... ok test rebuild_evidence_rejects_parallel_max_jobs ... ok test rebuild_evidence_noop_rebinds_late_gate_artifacts_after_replayed_rebase_changes ... ok test rebuild_evidence_rejects_zero_max_jobs ... ok test rebuild_evidence_session_not_found ... ok test rebuild_evidence_scope_empty ... ok test rebuild_evidence_partial_failure_resume ... ok test rebuild_evidence_state_transition_blocked_rerun_resumes_open_step ... ok test rebuild_evidence_restores_post_execution_state_when_prior_task_review_dispatch_missing ... ok test rebuild_evidence_text_output_summary ... ok test rebuild_executor_no_output_summary ... ok test rebuild_evidence_reuses_active_contract_for_serial_unit_review_receipts ... ok test rebuild_evidence_verify_command_failed_rerun_resumes_open_step ... ok test rebuild_evidence_text_failure_output ... ok test rebuild_evidence_exit_statuses ... ok test rebuild_evidence_noop_and_partial_failures ... ok test rebuild_executor_reopens_and_recompletes ... ok test rebuild_evidence_restores_authoritative_late_gate_truth_after_successful_rebuild ... ok test rebuild_state_transition_retry_rehydrates_verify_command ... ok test rebuild_target_state_transition_blocked ... ok test rebuild_target_race_detected ... ok test rebuild_target_race_retries_and_rehydrates_verify_command ... ok test result: ok. 45 passed; 0 failed; 0 ignored; 0 measured; 180 filtered out; finished in 6.13s
**Invalidation Reason:** Evidence rebuild: files_proven_drifted

#### Attempt 15
**Status:** Invalidated
**Recorded At:** 2026-04-01T05:18:05.850061Z
**Execution Source:** featureforge:executing-plans
**Task Number:** 5
**Step Number:** 4
**Packet Fingerprint:** 84cb458a087238be04f6f019228b83e31e89cd544cba8e8c666e31227eac6e00
**Head SHA:** 2f97045889529eeb7d7214a0500963d34e9cf47d
**Base SHA:** 2f97045889529eeb7d7214a0500963d34e9cf47d
**Claim:** Added exact JSON schema coverage for rebuild-evidence output, including stable top-level and nested key order for structured parsing consumers.
**Files Proven:**
- tests/plan_execution.rs | sha256:2588e9f3943f025ed73c17a6203749fc186259095ee794c8b75907c93eb5ebee
**Verify Command:** cargo test --test plan_execution -- rebuild_evidence_json_schema --exact && cargo test --test plan_execution rebuild_
**Verification Summary:** `cargo test --test plan_execution -- rebuild_evidence_json_schema --exact && cargo test --test plan_execution rebuild_` -> passed: running 1 test test rebuild_evidence_json_schema ... ok test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 225 filtered out; finished in 0.96s running 45 tests test rebuild_candidate_discovery_stale_targets ... ok test rebuild_candidate_discovery_source_spec_fingerprint_drift ... ok test rebuild_candidate_filtering ... ok test rebuild_evidence_command_shape ... ok test rebuild_candidate_discovery_unreadable_artifact ... ok test rebuild_candidate_discovery_plan_fingerprint_drift ... ok test rebuild_evidence_continue_on_error_clears_failed_earlier_interrupted_target ... ok test rebuild_evidence_dry_run_is_noop ... ok test rebuild_evidence_does_not_publish_contract_bound_receipts_without_active_contract ... ok test rebuild_evidence_invalid_scope ... ok test rebuild_evidence_clears_later_interrupted_step_before_reopening_earlier_target ... ok test rebuild_evidence_manual_required_default ... ok test rebuild_evidence_json_schema ... ok test rebuild_evidence_json_output_fields ... ok test rebuild_evidence_legacy_summary_command_replays ... ok test rebuild_evidence_manual_required_rerun_resumes_open_step ... ok test rebuild_evidence_manual_required_does_not_block_later_command_targets ... ok test rebuild_evidence_noop_refreshes_receipt_only_strategy_checkpoint_drift ... ok test rebuild_evidence_refreshes_malformed_prior_task_review_receipt_before_task_boundary_retry ... ok test rebuild_evidence_refreshes_non_independent_prior_task_review_receipt_before_task_boundary_retry ... ok test rebuild_evidence_refreshes_preflight_acceptance_before_task_boundary_receipt_recovery ... ok test rebuild_evidence_noop_rebinds_late_gate_artifacts_after_rebase_only_head_drift ... ok test rebuild_evidence_rejects_parallel_max_jobs ... ok test rebuild_evidence_noop_restores_authoritative_late_gate_truth ... ok test rebuild_evidence_refreshes_prior_task_closure_receipts_across_tasks ... ok test rebuild_evidence_rejects_zero_max_jobs ... ok test rebuild_evidence_noop_rebinds_late_gate_artifacts_after_replayed_rebase_changes ... ok test rebuild_evidence_session_not_found ... ok test rebuild_evidence_partial_failure_resume ... ok test rebuild_evidence_scope_empty ... ok test rebuild_evidence_state_transition_blocked_rerun_resumes_open_step ... ok test rebuild_evidence_restores_post_execution_state_when_prior_task_review_dispatch_missing ... ok test rebuild_evidence_text_output_summary ... ok test rebuild_executor_no_output_summary ... ok test rebuild_evidence_verify_command_failed_rerun_resumes_open_step ... ok test rebuild_evidence_reuses_active_contract_for_serial_unit_review_receipts ... ok test rebuild_evidence_exit_statuses ... ok test rebuild_evidence_text_failure_output ... ok test rebuild_evidence_noop_and_partial_failures ... ok test rebuild_executor_reopens_and_recompletes ... ok test rebuild_evidence_restores_authoritative_late_gate_truth_after_successful_rebuild ... ok test rebuild_state_transition_retry_rehydrates_verify_command ... ok test rebuild_target_state_transition_blocked ... ok test rebuild_target_race_detected ... ok test rebuild_target_race_retries_and_rehydrates_verify_command ... ok test result: ok. 45 passed; 0 failed; 0 ignored; 0 measured; 181 filtered out; finished in 6.29s
**Invalidation Reason:** Evidence rebuild: files_proven_drifted

#### Attempt 16
**Status:** Invalidated
**Recorded At:** 2026-04-01T06:04:52.156175Z
**Execution Source:** featureforge:executing-plans
**Task Number:** 5
**Step Number:** 4
**Packet Fingerprint:** 84cb458a087238be04f6f019228b83e31e89cd544cba8e8c666e31227eac6e00
**Head SHA:** 2f97045889529eeb7d7214a0500963d34e9cf47d
**Base SHA:** 2f97045889529eeb7d7214a0500963d34e9cf47d
**Claim:** Added exact JSON schema coverage for rebuild-evidence output, including stable top-level and nested key order for structured parsing consumers.
**Files Proven:**
- tests/plan_execution.rs | sha256:cee706e9b3195e2468b78c09114b0752288fc66ce6af374795ed37047177f995
**Verify Command:** cargo test --test plan_execution -- rebuild_evidence_json_schema --exact && cargo test --test plan_execution rebuild_
**Verification Summary:** `cargo test --test plan_execution -- rebuild_evidence_json_schema --exact && cargo test --test plan_execution rebuild_` -> passed: running 1 test test rebuild_evidence_json_schema ... ok test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 228 filtered out; finished in 0.91s running 48 tests test rebuild_candidate_discovery_source_spec_fingerprint_drift ... ok test rebuild_candidate_filtering ... ok test rebuild_candidate_discovery_plan_fingerprint_drift ... ok test rebuild_candidate_discovery_stale_targets ... ok test rebuild_evidence_command_shape ... ok test rebuild_candidate_discovery_unreadable_artifact ... ok test rebuild_evidence_continue_on_error_clears_failed_earlier_interrupted_target ... ok test rebuild_evidence_dry_run_is_noop ... ok test rebuild_evidence_does_not_publish_contract_bound_receipts_without_active_contract ... ok test rebuild_evidence_invalid_scope ... ok test rebuild_evidence_clears_later_interrupted_step_before_reopening_earlier_target ... ok test rebuild_evidence_manual_required_default ... ok test rebuild_evidence_legacy_summary_command_replays ... ok test rebuild_evidence_json_output_fields ... ok test rebuild_evidence_json_schema ... ok test rebuild_evidence_manual_required_rerun_resumes_open_step ... ok test rebuild_evidence_manual_required_does_not_block_later_command_targets ... ok test rebuild_evidence_noop_allows_intermediate_test_plan_only_state ... ok test rebuild_evidence_noop_refreshes_receipt_only_strategy_checkpoint_drift ... ok test rebuild_evidence_manual_required_keeps_downstream_truth_stale_until_repaired ... ok test rebuild_evidence_noop_refreshes_final_review_without_requiring_release_readiness ... ok test rebuild_evidence_refreshes_malformed_prior_task_review_receipt_before_task_boundary_retry ... ok test rebuild_evidence_noop_rebinds_late_gate_artifacts_after_rebase_only_head_drift ... ok test rebuild_evidence_refreshes_prior_task_closure_receipts_across_tasks ... ok test rebuild_evidence_noop_rebinds_late_gate_artifacts_after_replayed_rebase_changes ... ok test rebuild_evidence_noop_restores_authoritative_late_gate_truth ... ok test rebuild_evidence_refreshes_preflight_acceptance_before_task_boundary_receipt_recovery ... ok test rebuild_evidence_rejects_parallel_max_jobs ... ok test rebuild_evidence_refreshes_non_independent_prior_task_review_receipt_before_task_boundary_retry ... ok test rebuild_evidence_rejects_zero_max_jobs ... ok test rebuild_evidence_partial_failure_resume ... ok test rebuild_evidence_scope_empty ... ok test rebuild_evidence_session_not_found ... ok test rebuild_evidence_state_transition_blocked_rerun_resumes_open_step ... ok test rebuild_evidence_exit_statuses ... ok test rebuild_evidence_restores_post_execution_state_when_prior_task_review_dispatch_missing ... ok test rebuild_evidence_noop_and_partial_failures ... ok test rebuild_evidence_text_output_summary ... ok test rebuild_executor_no_output_summary ... ok test rebuild_evidence_reuses_active_contract_for_serial_unit_review_receipts ... ok test rebuild_evidence_verify_command_failed_rerun_resumes_open_step ... ok test rebuild_evidence_text_failure_output ... ok test rebuild_executor_reopens_and_recompletes ... ok test rebuild_state_transition_retry_rehydrates_verify_command ... ok test rebuild_target_state_transition_blocked ... ok test rebuild_target_race_detected ... ok test rebuild_evidence_restores_authoritative_late_gate_truth_after_successful_rebuild ... ok test rebuild_target_race_retries_and_rehydrates_verify_command ... ok test result: ok. 48 passed; 0 failed; 0 ignored; 0 measured; 181 filtered out; finished in 5.74s
**Invalidation Reason:** Evidence rebuild: plan_fingerprint_mismatch

#### Attempt 17
**Status:** Completed
**Recorded At:** 2026-04-01T06:05:00.26664Z
**Execution Source:** featureforge:executing-plans
**Task Number:** 5
**Step Number:** 4
**Packet Fingerprint:** 3e663d5b90856589073c0ff19fcb97ea73e46b9394a7c7b5164ada50fa1a268c
**Head SHA:** 3cb97e9af57fb687bc8b01d3be18664e28101118
**Base SHA:** 3cb97e9af57fb687bc8b01d3be18664e28101118
**Claim:** Added exact JSON schema coverage for rebuild-evidence output, including stable top-level and nested key order for structured parsing consumers.
**Files Proven:**
- tests/plan_execution.rs | sha256:cee706e9b3195e2468b78c09114b0752288fc66ce6af374795ed37047177f995
**Verify Command:** cargo test --test plan_execution -- rebuild_evidence_json_schema --exact && cargo test --test plan_execution rebuild_
**Verification Summary:** `cargo test --test plan_execution -- rebuild_evidence_json_schema --exact && cargo test --test plan_execution rebuild_` -> passed: running 1 test test rebuild_evidence_json_schema ... ok test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 228 filtered out; finished in 0.89s running 48 tests test rebuild_candidate_filtering ... ok test rebuild_candidate_discovery_unreadable_artifact ... ok test rebuild_candidate_discovery_plan_fingerprint_drift ... ok test rebuild_candidate_discovery_source_spec_fingerprint_drift ... ok test rebuild_candidate_discovery_stale_targets ... ok test rebuild_evidence_command_shape ... ok test rebuild_evidence_continue_on_error_clears_failed_earlier_interrupted_target ... ok test rebuild_evidence_dry_run_is_noop ... ok test rebuild_evidence_does_not_publish_contract_bound_receipts_without_active_contract ... ok test rebuild_evidence_invalid_scope ... ok test rebuild_evidence_clears_later_interrupted_step_before_reopening_earlier_target ... ok test rebuild_evidence_manual_required_default ... ok test rebuild_evidence_json_schema ... ok test rebuild_evidence_json_output_fields ... ok test rebuild_evidence_legacy_summary_command_replays ... ok test rebuild_evidence_manual_required_does_not_block_later_command_targets ... ok test rebuild_evidence_manual_required_rerun_resumes_open_step ... ok test rebuild_evidence_noop_allows_intermediate_test_plan_only_state ... ok test rebuild_evidence_noop_refreshes_receipt_only_strategy_checkpoint_drift ... ok test rebuild_evidence_manual_required_keeps_downstream_truth_stale_until_repaired ... ok test rebuild_evidence_noop_refreshes_final_review_without_requiring_release_readiness ... ok test rebuild_evidence_refreshes_malformed_prior_task_review_receipt_before_task_boundary_retry ... ok test rebuild_evidence_noop_rebinds_late_gate_artifacts_after_rebase_only_head_drift ... ok test rebuild_evidence_refreshes_prior_task_closure_receipts_across_tasks ... ok test rebuild_evidence_noop_rebinds_late_gate_artifacts_after_replayed_rebase_changes ... ok test rebuild_evidence_noop_restores_authoritative_late_gate_truth ... ok test rebuild_evidence_refreshes_preflight_acceptance_before_task_boundary_receipt_recovery ... ok test rebuild_evidence_rejects_parallel_max_jobs ... ok test rebuild_evidence_refreshes_non_independent_prior_task_review_receipt_before_task_boundary_retry ... ok test rebuild_evidence_rejects_zero_max_jobs ... ok test rebuild_evidence_session_not_found ... ok test rebuild_evidence_partial_failure_resume ... ok test rebuild_evidence_scope_empty ... ok test rebuild_evidence_state_transition_blocked_rerun_resumes_open_step ... ok test rebuild_evidence_exit_statuses ... ok test rebuild_evidence_reuses_active_contract_for_serial_unit_review_receipts ... ok test rebuild_evidence_restores_post_execution_state_when_prior_task_review_dispatch_missing ... ok test rebuild_evidence_noop_and_partial_failures ... ok test rebuild_evidence_text_output_summary ... ok test rebuild_executor_no_output_summary ... ok test rebuild_evidence_verify_command_failed_rerun_resumes_open_step ... ok test rebuild_evidence_text_failure_output ... ok test rebuild_executor_reopens_and_recompletes ... ok test rebuild_state_transition_retry_rehydrates_verify_command ... ok test rebuild_target_race_detected ... ok test rebuild_target_state_transition_blocked ... ok test rebuild_evidence_restores_authoritative_late_gate_truth_after_successful_rebuild ... ok test rebuild_target_race_retries_and_rehydrates_verify_command ... ok test result: ok. 48 passed; 0 failed; 0 ignored; 0 measured; 181 filtered out; finished in 5.93s
**Invalidation Reason:** N/A

### Task 6 Step 1
#### Attempt 1
**Status:** Invalidated
**Recorded At:** 2026-03-30T20:10:26.26827Z
**Execution Source:** featureforge:executing-plans
**Task Number:** 6
**Step Number:** 1
**Packet Fingerprint:** 3b63f47b946e0c62d4dced20313a6d9e167ef095e2bba28a3f160adae0588c6f
**Head SHA:** 5527e0d7d94e617dc9d44b77194aa7f0a958b98d
**Base SHA:** 5527e0d7d94e617dc9d44b77194aa7f0a958b98d
**Claim:** Ran the skill-doc generator after implementation changes and confirmed no generated doc drift because the command-facing templates for this slice were unchanged.
**Files Proven:**
- scripts/gen-skill-docs.mjs | sha256:3dc945f455a0c9287fa95a8e397ec016e5101a85d68f211eecdc50ba11003ae3
- tests/codex-runtime/skill-doc-generation.test.mjs | sha256:96d1aa70d290a1f749372b6e7bf56292667e78a80cc651d5a1c5b3f1b3cf55d4
**Verify Command:** node scripts/gen-skill-docs.mjs
**Verification Summary:** `node scripts/gen-skill-docs.mjs` -> generator completed with no output and no additional generated-doc changes
**Invalidation Reason:** Evidence rebuild: packet_fingerprint_mismatch

#### Attempt 2
**Status:** Invalidated
**Recorded At:** 2026-03-31T19:20:38.228743Z
**Execution Source:** featureforge:executing-plans
**Task Number:** 6
**Step Number:** 1
**Packet Fingerprint:** af6ae654bc31dd40fb66f4772462b6d37afe903a1c5a54e7f92bde523757f117
**Head SHA:** 5527e0d7d94e617dc9d44b77194aa7f0a958b98d
**Base SHA:** 5527e0d7d94e617dc9d44b77194aa7f0a958b98d
**Claim:** Ran the skill-doc generator after implementation changes and confirmed no generated doc drift because the command-facing templates for this slice were unchanged.
**Files Proven:**
- scripts/gen-skill-docs.mjs | sha256:3dc945f455a0c9287fa95a8e397ec016e5101a85d68f211eecdc50ba11003ae3
- tests/codex-runtime/skill-doc-generation.test.mjs | sha256:96d1aa70d290a1f749372b6e7bf56292667e78a80cc651d5a1c5b3f1b3cf55d4
**Verify Command:** node scripts/gen-skill-docs.mjs
**Verification Summary:** `node scripts/gen-skill-docs.mjs` -> passed
**Invalidation Reason:** Evidence rebuild: packet_fingerprint_mismatch

#### Attempt 3
**Status:** Invalidated
**Recorded At:** 2026-04-01T06:05:00.635133Z
**Execution Source:** featureforge:executing-plans
**Task Number:** 6
**Step Number:** 1
**Packet Fingerprint:** 761fa4be8ac5874b0545d59dc6735fc8f0f81cc2ede416e14ebed577e396ea77
**Head SHA:** 2f97045889529eeb7d7214a0500963d34e9cf47d
**Base SHA:** 2f97045889529eeb7d7214a0500963d34e9cf47d
**Claim:** Ran the skill-doc generator after implementation changes and confirmed no generated doc drift because the command-facing templates for this slice were unchanged.
**Files Proven:**
- scripts/gen-skill-docs.mjs | sha256:dad4b4aba1f58fe091f4ebf976144872a458baa25304ab593e721bbce07d72c9
- tests/codex-runtime/skill-doc-generation.test.mjs | sha256:96d1aa70d290a1f749372b6e7bf56292667e78a80cc651d5a1c5b3f1b3cf55d4
**Verify Command:** node scripts/gen-skill-docs.mjs
**Verification Summary:** `node scripts/gen-skill-docs.mjs` -> passed
**Invalidation Reason:** Evidence rebuild: plan_fingerprint_mismatch

#### Attempt 4
**Status:** Completed
**Recorded At:** 2026-04-01T06:05:01.276468Z
**Execution Source:** featureforge:executing-plans
**Task Number:** 6
**Step Number:** 1
**Packet Fingerprint:** 07063eb03e29e72539e301e9cfeece946e1766a60cf32141d8fcb53c34189f11
**Head SHA:** 3cb97e9af57fb687bc8b01d3be18664e28101118
**Base SHA:** 3cb97e9af57fb687bc8b01d3be18664e28101118
**Claim:** Ran the skill-doc generator after implementation changes and confirmed no generated doc drift because the command-facing templates for this slice were unchanged.
**Files Proven:**
- scripts/gen-skill-docs.mjs | sha256:dad4b4aba1f58fe091f4ebf976144872a458baa25304ab593e721bbce07d72c9
- tests/codex-runtime/skill-doc-generation.test.mjs | sha256:96d1aa70d290a1f749372b6e7bf56292667e78a80cc651d5a1c5b3f1b3cf55d4
**Verify Command:** node scripts/gen-skill-docs.mjs
**Verification Summary:** `node scripts/gen-skill-docs.mjs` -> passed
**Invalidation Reason:** N/A

### Task 6 Step 2
#### Attempt 1
**Status:** Invalidated
**Recorded At:** 2026-03-30T18:27:57.796502Z
**Execution Source:** featureforge:executing-plans
**Task Number:** 6
**Step Number:** 2
**Packet Fingerprint:** f77219bb5865cb6602f0d83d58a8bbc06547c634207f3e923d5bf2e8782bc845
**Head SHA:** 5527e0d7d94e617dc9d44b77194aa7f0a958b98d
**Base SHA:** 5527e0d7d94e617dc9d44b77194aa7f0a958b98d
**Claim:** Ran the plan-spec contract lint against the approved spec and plan and confirmed the rebuild-evidence plan remains contract-clean after implementation and review remediation.
**Files Proven:**
- docs/featureforge/plans/2026-03-30-evidence-rebuild-command.md | sha256:718055b82ab52edf711cfcd32cf511ffea3e3b4cf2d3688ef43b5faf430f97ac
- docs/featureforge/specs/2026-03-30-evidence-rebuild-command-spec.md | sha256:0c81195281217c4dcf1c00a67d5c0da8d23250c416b317db314a86c76b7ea52f
**Verify Command:** /Users/dmulcahey/.featureforge/install/bin/featureforge plan contract lint --spec docs/featureforge/specs/2026-03-30-evidence-rebuild-command-spec.md --plan docs/featureforge/plans/2026-03-30-evidence-rebuild-command.md
**Verification Summary:** `/Users/dmulcahey/.featureforge/install/bin/featureforge plan contract lint --spec docs/featureforge/specs/2026-03-30-evidence-rebuild-command-spec.md --plan docs/featureforge/plans/2026-03-30-evidence-rebuild-command.md` -> contract lint returned ok with zero errors and zero warnings
**Invalidation Reason:** Task 6 review remediation: refresh contract-lint evidence after plan/spec documentation edits.

#### Attempt 2
**Status:** Invalidated
**Recorded At:** 2026-03-31T19:20:39.321659Z
**Execution Source:** featureforge:executing-plans
**Task Number:** 6
**Step Number:** 2
**Packet Fingerprint:** bfe3c8c2b63ffcd1d6ec46cfcd4f25fd7d608ca3c192794576540e839afdc7b1
**Head SHA:** 5527e0d7d94e617dc9d44b77194aa7f0a958b98d
**Base SHA:** 5527e0d7d94e617dc9d44b77194aa7f0a958b98d
**Claim:** Refreshed the plan-spec contract lint evidence against the current approved spec and plan after documentation review remediation.
**Files Proven:**
- docs/featureforge/plans/2026-03-30-evidence-rebuild-command.md | sha256:5bd6c3a04ec40a9c6efa4966e1569d90dced972045ac9e60c1f05a37a46aceb0
- docs/featureforge/specs/2026-03-30-evidence-rebuild-command-spec.md | sha256:987c2a51ebd4b2b15d44d3c79f25d29d755dbb3033581d731322bb9eb79d76f1
**Verify Command:** /Users/dmulcahey/.featureforge/install/bin/featureforge plan contract lint --spec docs/featureforge/specs/2026-03-30-evidence-rebuild-command-spec.md --plan docs/featureforge/plans/2026-03-30-evidence-rebuild-command.md
**Verification Summary:** `/Users/dmulcahey/.featureforge/install/bin/featureforge plan contract lint --spec docs/featureforge/specs/2026-03-30-evidence-rebuild-command-spec.md --plan docs/featureforge/plans/2026-03-30-evidence-rebuild-command.md` -> contract lint returned ok with zero errors and zero warnings after Task 6 doc remediation
**Invalidation Reason:** Evidence rebuild: packet_fingerprint_mismatch

#### Attempt 3
**Status:** Invalidated
**Recorded At:** 2026-04-01T06:05:01.732727Z
**Execution Source:** featureforge:executing-plans
**Task Number:** 6
**Step Number:** 2
**Packet Fingerprint:** efee36923841556f75c7aa49051067fea64662899965c98b443a6e087d79e4ec
**Head SHA:** 2f97045889529eeb7d7214a0500963d34e9cf47d
**Base SHA:** 2f97045889529eeb7d7214a0500963d34e9cf47d
**Claim:** Refreshed the plan-spec contract lint evidence against the current approved spec and plan after documentation review remediation.
**Files Proven:**
- docs/featureforge/plans/2026-03-30-evidence-rebuild-command.md | sha256:5bd6c3a04ec40a9c6efa4966e1569d90dced972045ac9e60c1f05a37a46aceb0
- docs/featureforge/specs/2026-03-30-evidence-rebuild-command-spec.md | sha256:703523948e6b4ff16c90c48dd2db06141040deb1837af211d0316cf8175d753a
**Verify Command:** /Users/dmulcahey/.featureforge/install/bin/featureforge plan contract lint --spec docs/featureforge/specs/2026-03-30-evidence-rebuild-command-spec.md --plan docs/featureforge/plans/2026-03-30-evidence-rebuild-command.md
**Verification Summary:** `/Users/dmulcahey/.featureforge/install/bin/featureforge plan contract lint --spec docs/featureforge/specs/2026-03-30-evidence-rebuild-command-spec.md --plan docs/featureforge/plans/2026-03-30-evidence-rebuild-command.md` -> passed: {"status":"ok","errors":[],"warnings":[],"spec_requirement_count":11,"plan_task_count":6,"coverage":{"REQ-001":[1,2,5],"REQ-002":[1,2,5],"REQ-003":[2,3],"REQ-004":[3,5],"REQ-005":[3,4,5],"REQ-006":[1,2,5],"REQ-007":[2,3],"REQ-008":[1,2],"REQ-009":[2,4,5],"REQ-010":[4,6],"REQ-011":[4,5,6]}}
**Invalidation Reason:** Evidence rebuild: plan_fingerprint_mismatch

#### Attempt 4
**Status:** Completed
**Recorded At:** 2026-04-01T06:05:02.271462Z
**Execution Source:** featureforge:executing-plans
**Task Number:** 6
**Step Number:** 2
**Packet Fingerprint:** c93fde8f42b94ab57059cd18bd9627cfdefefd62892dae6775a6e9f4d7af14ba
**Head SHA:** 3cb97e9af57fb687bc8b01d3be18664e28101118
**Base SHA:** 3cb97e9af57fb687bc8b01d3be18664e28101118
**Claim:** Refreshed the plan-spec contract lint evidence against the current approved spec and plan after documentation review remediation.
**Files Proven:**
- docs/featureforge/plans/2026-03-30-evidence-rebuild-command.md | sha256:856cffa860f34457f7a53b9794e83a7687741bb43b4cc65ae9590b7bdd80a806
- docs/featureforge/specs/2026-03-30-evidence-rebuild-command-spec.md | sha256:703523948e6b4ff16c90c48dd2db06141040deb1837af211d0316cf8175d753a
**Verify Command:** /Users/dmulcahey/.featureforge/install/bin/featureforge plan contract lint --spec docs/featureforge/specs/2026-03-30-evidence-rebuild-command-spec.md --plan docs/featureforge/plans/2026-03-30-evidence-rebuild-command.md
**Verification Summary:** `/Users/dmulcahey/.featureforge/install/bin/featureforge plan contract lint --spec docs/featureforge/specs/2026-03-30-evidence-rebuild-command-spec.md --plan docs/featureforge/plans/2026-03-30-evidence-rebuild-command.md` -> passed: {"status":"ok","errors":[],"warnings":[],"spec_requirement_count":11,"plan_task_count":6,"coverage":{"REQ-001":[1,2,5],"REQ-002":[1,2,5],"REQ-003":[2,3],"REQ-004":[3,5],"REQ-005":[3,4,5],"REQ-006":[1,2,5],"REQ-007":[2,3],"REQ-008":[1,2],"REQ-009":[2,4,5],"REQ-010":[4,6],"REQ-011":[4,5,6]}}
**Invalidation Reason:** N/A

### Task 6 Step 3
#### Attempt 1
**Status:** Invalidated
**Recorded At:** 2026-03-30T18:30:47.867896Z
**Execution Source:** featureforge:executing-plans
**Task Number:** 6
**Step Number:** 3
**Packet Fingerprint:** 0a8754f0d640a081cdd86e3b7fbdc879d76e1c3abe066dcc991212702cace2c2
**Head SHA:** 5527e0d7d94e617dc9d44b77194aa7f0a958b98d
**Base SHA:** 5527e0d7d94e617dc9d44b77194aa7f0a958b98d
**Claim:** Synced the approved plan artifact into workflow routing and confirmed the rebuild-evidence work is now in implementation-ready workflow state.
**Files Proven:**
- docs/featureforge/plans/2026-03-30-evidence-rebuild-command.md | sha256:0bda1ef21a86cea7f7ed342cf3d5040e2dfa5ade223917ff82793ea8bb5a8f19
**Verify Command:** /Users/dmulcahey/.featureforge/install/bin/featureforge workflow sync --artifact plan --path docs/featureforge/plans/2026-03-30-evidence-rebuild-command.md
**Verification Summary:** `/Users/dmulcahey/.featureforge/install/bin/featureforge workflow sync --artifact plan --path docs/featureforge/plans/2026-03-30-evidence-rebuild-command.md` -> workflow sync returned implementation_ready for the approved plan artifact
**Invalidation Reason:** Task 6 review remediation: refresh workflow-sync evidence after plan/spec documentation edits.

#### Attempt 2
**Status:** Invalidated
**Recorded At:** 2026-03-31T19:20:40.718249Z
**Execution Source:** featureforge:executing-plans
**Task Number:** 6
**Step Number:** 3
**Packet Fingerprint:** 92272c919e3c0aac66dc44c7d7c515d4a5f9a5ddd18919a42d8d6933368f9201
**Head SHA:** 5527e0d7d94e617dc9d44b77194aa7f0a958b98d
**Base SHA:** 5527e0d7d94e617dc9d44b77194aa7f0a958b98d
**Claim:** Refreshed the workflow-sync evidence against the current approved plan artifact after documentation review remediation.
**Files Proven:**
- docs/featureforge/plans/2026-03-30-evidence-rebuild-command.md | sha256:71171e9bd29320d305b28fc1dd0d9513f0c83d628c8b0e9ce42f4c5b14db9d8c
**Verify Command:** /Users/dmulcahey/.featureforge/install/bin/featureforge workflow sync --artifact plan --path docs/featureforge/plans/2026-03-30-evidence-rebuild-command.md
**Verification Summary:** `/Users/dmulcahey/.featureforge/install/bin/featureforge workflow sync --artifact plan --path docs/featureforge/plans/2026-03-30-evidence-rebuild-command.md` -> workflow sync returned implementation_ready after Task 6 doc remediation
**Invalidation Reason:** Evidence rebuild: packet_fingerprint_mismatch

#### Attempt 3
**Status:** Invalidated
**Recorded At:** 2026-04-01T06:05:02.675278Z
**Execution Source:** featureforge:executing-plans
**Task Number:** 6
**Step Number:** 3
**Packet Fingerprint:** 877a860cba99aedaf95f79b46e8c9d846af58a3da799c65ce7acc87f4d5e43e6
**Head SHA:** 2f97045889529eeb7d7214a0500963d34e9cf47d
**Base SHA:** 2f97045889529eeb7d7214a0500963d34e9cf47d
**Claim:** Refreshed the workflow-sync evidence against the current approved plan artifact after documentation review remediation.
**Files Proven:**
- docs/featureforge/plans/2026-03-30-evidence-rebuild-command.md | sha256:71171e9bd29320d305b28fc1dd0d9513f0c83d628c8b0e9ce42f4c5b14db9d8c
**Verify Command:** /Users/dmulcahey/.featureforge/install/bin/featureforge workflow sync --artifact plan --path docs/featureforge/plans/2026-03-30-evidence-rebuild-command.md
**Verification Summary:** `/Users/dmulcahey/.featureforge/install/bin/featureforge workflow sync --artifact plan --path docs/featureforge/plans/2026-03-30-evidence-rebuild-command.md` -> passed: {"schema_version":2,"status":"implementation_ready","next_skill":"","spec_path":"docs/featureforge/specs/2026-03-30-evidence-rebuild-command-spec.md","plan_path":"docs/featureforge/plans/2026-03-30-evidence-rebuild-command.md","contract_state":"valid","reason_codes":["implementation_ready"],"diagnostics":[],"scan_truncated":false,"spec_candidate_count":2,"plan_candidate_count":1,"manifest_path":"/Users/dmulcahey/.featureforge/projects/dmulcahey-superpowers/dmulcahey-codex-add-evidence-rebuild-command-63a10237e151-workflow-state.json","root":"/Users/dmulcahey/development/skills/featureforge","reason":"implementation_ready","note":"implementation_ready"}
**Invalidation Reason:** Evidence rebuild: plan_fingerprint_mismatch

#### Attempt 4
**Status:** Completed
**Recorded At:** 2026-04-01T06:05:03.200366Z
**Execution Source:** featureforge:executing-plans
**Task Number:** 6
**Step Number:** 3
**Packet Fingerprint:** 9caa372d86289493e57aba97c73464aadce335d9a6b11dd17599e2196531bd15
**Head SHA:** 3cb97e9af57fb687bc8b01d3be18664e28101118
**Base SHA:** 3cb97e9af57fb687bc8b01d3be18664e28101118
**Claim:** Refreshed the workflow-sync evidence against the current approved plan artifact after documentation review remediation.
**Files Proven:**
- docs/featureforge/plans/2026-03-30-evidence-rebuild-command.md | sha256:9a419ffe4105fe01008183abfc52affc771e3589e84742a911d4c187edbcd8e0
**Verify Command:** /Users/dmulcahey/.featureforge/install/bin/featureforge workflow sync --artifact plan --path docs/featureforge/plans/2026-03-30-evidence-rebuild-command.md
**Verification Summary:** `/Users/dmulcahey/.featureforge/install/bin/featureforge workflow sync --artifact plan --path docs/featureforge/plans/2026-03-30-evidence-rebuild-command.md` -> passed: {"schema_version":2,"status":"implementation_ready","next_skill":"","spec_path":"docs/featureforge/specs/2026-03-30-evidence-rebuild-command-spec.md","plan_path":"docs/featureforge/plans/2026-03-30-evidence-rebuild-command.md","contract_state":"valid","reason_codes":["implementation_ready"],"diagnostics":[],"scan_truncated":false,"spec_candidate_count":2,"plan_candidate_count":1,"manifest_path":"/Users/dmulcahey/.featureforge/projects/dmulcahey-superpowers/dmulcahey-codex-add-evidence-rebuild-command-63a10237e151-workflow-state.json","root":"/Users/dmulcahey/development/skills/featureforge","reason":"implementation_ready","note":"implementation_ready"}
**Invalidation Reason:** N/A
