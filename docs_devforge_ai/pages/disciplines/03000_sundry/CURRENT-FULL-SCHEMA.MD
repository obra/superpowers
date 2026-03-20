# Supabase Database Schema

**Generated:** 2026-03-12T03:45:30.553Z

**Total Tables:** 461

**Source:** Supabase OpenAPI Specification

---

## Table of Contents

1. [a_00102_admin_data](#a-00102-admin-data)
2. [a_00102_admin_vector](#a-00102-admin-vector)
3. [a_00105_travel_vector](#a-00105-travel-vector)
4. [a_00106_timesheet_vector](#a-00106-timesheet-vector)
5. [a_00200_commercial_vector](#a-00200-commercial-vector)
6. [a_00300_construction_vector](#a-00300-construction-vector)
7. [a_00425_contracts_pre_vector](#a-00425-contracts-pre-vector)
8. [a_00435_contracts_post_data](#a-00435-contracts-post-data)
9. [a_00435_contracts_post_vector](#a-00435-contracts-post-vector)
10. [a_00800_design_vector](#a-00800-design-vector)
11. [a_00825_architectural_vector](#a-00825-architectural-vector)
12. [a_00835_chemeng_vector](#a-00835-chemeng-vector)
13. [a_00850_civileng_vector](#a-00850-civileng-vector)
14. [a_00860_eleceng_vector](#a-00860-eleceng-vector)
15. [a_00870_mecheng_vector](#a-00870-mecheng-vector)
16. [a_00871_processeng_vector](#a-00871-processeng-vector)
17. [a_00872_developer_vector](#a-00872-developer-vector)
18. [a_00875_sales_vector](#a-00875-sales-vector)
19. [a_00877_sundry_vector](#a-00877-sundry-vector)
20. [a_00880_boarddir_vector](#a-00880-boarddir-vector)
21. [a_00882_dirconst_vector](#a-00882-dirconst-vector)
22. [a_00883_dircontracts_vector](#a-00883-dircontracts-vector)
23. [a_00884_1_dirfinance_vector](#a-00884-1-dirfinance-vector)
24. [a_00884_direng_vector](#a-00884-direng-vector)
25. [a_00885_dirhse_vector](#a-00885-dirhse-vector)
26. [a_00886_dirlogistics_vector](#a-00886-dirlogistics-vector)
27. [a_00888_dirprocurement_vector](#a-00888-dirprocurement-vector)
28. [a_00889_dirfinance_vector](#a-00889-dirfinance-vector)
29. [a_00890_dirprojects_vector](#a-00890-dirprojects-vector)
30. [a_00895_dirproject_vector](#a-00895-dirproject-vector)
31. [a_00900_doccontrol_approval_rule_steps](#a-00900-doccontrol-approval-rule-steps)
32. [a_00900_doccontrol_approval_rules](#a-00900-doccontrol-approval-rules)
33. [a_00900_doccontrol_approvals](#a-00900-doccontrol-approvals)
34. [a_00900_doccontrol_data](#a-00900-doccontrol-data)
35. [a_00900_doccontrol_document_embeddings](#a-00900-doccontrol-document-embeddings)
36. [a_00900_doccontrol_document_versions](#a-00900-doccontrol-document-versions)
37. [a_00900_doccontrol_documents](#a-00900-doccontrol-documents)
38. [a_00900_doccontrol_langchain_jobs](#a-00900-doccontrol-langchain-jobs)
39. [a_00900_doccontrol_vector](#a-00900-doccontrol-vector)
40. [a_00900_user_langchain_settings](#a-00900-user-langchain-settings)
41. [a_00test](#a-00test)
42. [a_01000_environmental_vector](#a-01000-environmental-vector)
43. [a_01100_ethics_vector](#a-01100-ethics-vector)
44. [a_01200_finance_vector](#a-01200-finance-vector)
45. [a_01300_governance_vector](#a-01300-governance-vector)
46. [a_01400_health_vector](#a-01400-health-vector)
47. [a_01500_hr_candidate_evaluation](#a-01500-hr-candidate-evaluation)
48. [a_01500_hr_vector](#a-01500-hr-vector)
49. [a_01600_localcontent_vector](#a-01600-localcontent-vector)
50. [a_01700_logistics_vector](#a-01700-logistics-vector)
51. [a_01750_legal_vector](#a-01750-legal-vector)
52. [a_01800_operations_vector](#a-01800-operations-vector)
53. [a_01850_otherparties_vector](#a-01850-otherparties-vector)
54. [a_01900_procurement_vector](#a-01900-procurement-vector)
55. [a_02000_projctrl_vector](#a-02000-projctrl-vector)
56. [a_02025_invoice_processing](#a-02025-invoice-processing)
57. [a_02025_qs_data](#a-02025-qs-data)
58. [a_02025_qs_vector](#a-02025-qs-vector)
59. [a_02035_scheduling_vector](#a-02035-scheduling-vector)
60. [a_02050_it_vector](#a-02050-it-vector)
61. [a_02050_logistics_data](#a-02050-logistics-data)
62. [a_02075_inspection_data](#a-02075-inspection-data)
63. [a_02075_inspection_vector](#a-02075-inspection-vector)
64. [a_02075_knowledge_base](#a-02075-knowledge-base)
65. [a_02075_knowledge_base_data](#a-02075-knowledge-base-data)
66. [a_02076_qa_vector](#a-02076-qa-vector)
67. [a_02100_pr_media](#a-02100-pr-media)
68. [a_02100_publicrel_vector](#a-02100-publicrel-vector)
69. [a_02200_qa_vector](#a-02200-qa-vector)
70. [a_02250_qc_vector](#a-02250-qc-vector)
71. [a_02400_contractor_vetting_data](#a-02400-contractor-vetting-data)
72. [a_02400_contractor_vetting_document_versions](#a-02400-contractor-vetting-document-versions)
73. [a_02400_contractor_vetting_documents](#a-02400-contractor-vetting-documents)
74. [a_02400_safety_data](#a-02400-safety-data)
75. [a_02400_safety_vector](#a-02400-safety-vector)
76. [a_02500_security_vector](#a-02500-security-vector)
77. [a_03000_landscaping_vector](#a-03000-landscaping-vector)
78. [a_performance_docs_vector](#a-performance-docs-vector)
79. [accordion_options](#accordion-options)
80. [accordion_sections](#accordion-sections)
81. [accordion_sections_directors_backup_20250726](#accordion-sections-directors-backup-20250726)
82. [accordion_structure](#accordion-structure)
83. [active_entities](#active-entities)
84. [active_security_alerts](#active-security-alerts)
85. [active_templates](#active-templates)
86. [active_users_travel_docs](#active-users-travel-docs)
87. [agent_activity_log](#agent-activity-log)
88. [agent_context_boundaries](#agent-context-boundaries)
89. [agent_modal_assignments](#agent-modal-assignments)
90. [agent_permissions](#agent-permissions)
91. [agent_profiles](#agent-profiles)
92. [agent_roles](#agent-roles)
93. [agent_sequence_operations](#agent-sequence-operations)
94. [agent_sessions](#agent-sessions)
95. [agent_template_integrations](#agent-template-integrations)
96. [agents_tracking](#agents-tracking)
97. [agents_unified](#agents-unified)
98. [ai_training_data](#ai-training-data)
99. [alert_configurations](#alert-configurations)
100. [api_health_checks](#api-health-checks)
101. [api_usage_metrics](#api-usage-metrics)
102. [api_usage_summary](#api-usage-summary)
103. [approval_cover_sheets](#approval-cover-sheets)
104. [approval_delegations](#approval-delegations)
105. [approval_document_links](#approval-document-links)
106. [approval_history_log](#approval-history-log)
107. [approval_instances](#approval-instances)
108. [approval_steps](#approval-steps)
109. [approval_workflow_templates](#approval-workflow-templates)
110. [approval_workflows](#approval-workflows)
111. [audit_log](#audit-log)
112. [available_companies](#available-companies)
113. [button_options](#button-options)
114. [chat_analytics](#chat-analytics)
115. [chat_messages](#chat-messages)
116. [chat_sessions](#chat-sessions)
117. [chatbot_audit_logs](#chatbot-audit-logs)
118. [chatbot_interactions](#chatbot-interactions)
119. [chatbot_messages](#chatbot-messages)
120. [chatbot_pages](#chatbot-pages)
121. [chatbot_performance_metrics](#chatbot-performance-metrics)
122. [chatbot_performance_summary](#chatbot-performance-summary)
123. [chatbot_permissions](#chatbot-permissions)
124. [chatbot_sessions](#chatbot-sessions)
125. [chatbot_usage_analytics](#chatbot-usage-analytics)
126. [chatbot_vector_configs](#chatbot-vector-configs)
127. [chatbots](#chatbots)
128. [chatbots_backup](#chatbots-backup)
129. [civil_engineering_document_links](#civil-engineering-document-links)
130. [civil_engineering_documents](#civil-engineering-documents)
131. [companies](#companies)
132. [complete_epcm_accordion](#complete-epcm-accordion)
133. [compliance_checks](#compliance-checks)
134. [compliance_reports](#compliance-reports)
135. [consolidated_documents](#consolidated-documents)
136. [consultants](#consultants)
137. [contacts](#contacts)
138. [containers](#containers)
139. [continual_learning_data](#continual-learning-data)
140. [contractor_evaluation_results](#contractor-evaluation-results)
141. [contractor_evaluations](#contractor-evaluations)
142. [contractor_vetting](#contractor-vetting)
143. [contractor_vetting_chat_messages](#contractor-vetting-chat-messages)
144. [contractor_vetting_dashboard_stats](#contractor-vetting-dashboard-stats)
145. [contractor_vetting_document_hashes](#contractor-vetting-document-hashes)
146. [contractor_vetting_document_parts](#contractor-vetting-document-parts)
147. [contractor_vetting_documents](#contractor-vetting-documents)
148. [contractor_vetting_ingestion_registry](#contractor-vetting-ingestion-registry)
149. [contractor_vetting_sections](#contractor-vetting-sections)
150. [contractors](#contractors)
151. [contractors_backup_before_uuid_migration](#contractors-backup-before-uuid-migration)
152. [contracts](#contracts)
153. [contracts_post_summary](#contracts-post-summary)
154. [contributor_assignments](#contributor-assignments)
155. [contributors](#contributors)
156. [correspondence_training_data](#correspondence-training-data)
157. [credential_rotation_logs](#credential-rotation-logs)
158. [custom_assignments](#custom-assignments)
159. [custom_document_types](#custom-document-types)
160. [customized](#customized)
161. [cv_analyses](#cv-analyses)
162. [cv_application_stats](#cv-application-stats)
163. [cv_applications](#cv-applications)
164. [dashboard_progress](#dashboard-progress)
165. [data_sheet_specifications](#data-sheet-specifications)
166. [defects](#defects)
167. [discipline_document_paths](#discipline-document-paths)
168. [discipline_document_sections](#discipline-document-sections)
169. [discipline_evaluation_weights](#discipline-evaluation-weights)
170. [discipline_extraction_prompts](#discipline-extraction-prompts)
171. [discipline_template_config](#discipline-template-config)
172. [discipline_template_constraints](#discipline-template-constraints)
173. [disciplines](#disciplines)
174. [document_access_logs](#document-access-logs)
175. [document_ai_analysis](#document-ai-analysis)
176. [document_analysis_feedback](#document-analysis-feedback)
177. [document_analysis_prompts](#document-analysis-prompts)
178. [document_categories](#document-categories)
179. [document_comparisons](#document-comparisons)
180. [document_download_queue](#document-download-queue)
181. [document_embeddings](#document-embeddings)
182. [document_hashes](#document-hashes)
183. [document_hierarchy_definitions](#document-hierarchy-definitions)
184. [document_number_audit_log](#document-number-audit-log)
185. [document_number_sequences](#document-number-sequences)
186. [document_numbering_methodologies](#document-numbering-methodologies)
187. [document_numbering_sequences](#document-numbering-sequences)
188. [document_processing_history](#document-processing-history)
189. [document_processing_log](#document-processing-log)
190. [document_processing_queue](#document-processing-queue)
191. [document_references](#document-references)
192. [document_routing_history](#document-routing-history)
193. [document_routing_templates](#document-routing-templates)
194. [document_routing_workflows](#document-routing-workflows)
195. [document_sections](#document-sections)
196. [document_stores](#document-stores)
197. [document_type_relationships](#document-type-relationships)
198. [document_types](#document-types)
199. [document_types_by_discipline](#document-types-by-discipline)
200. [document_variation_sections](#document-variation-sections)
201. [document_variations](#document-variations)
202. [document_versions](#document-versions)
203. [dropdown_options](#dropdown-options)
204. [email_access_logs](#email-access-logs)
205. [email_ai_processing_queue](#email-ai-processing-queue)
206. [email_attachments](#email-attachments)
207. [email_content_storage](#email-content-storage)
208. [email_drafts](#email-drafts)
209. [email_notification_queue](#email-notification-queue)
210. [email_notifications](#email-notifications)
211. [email_providers](#email-providers)
212. [email_search_history](#email-search-history)
213. [email_send_attachments](#email-send-attachments)
214. [email_sends](#email-sends)
215. [email_signatures](#email-signatures)
216. [email_sync_log](#email-sync-log)
217. [email_templates](#email-templates)
218. [email_threads](#email-threads)
219. [email_vector](#email-vector)
220. [emails](#emails)
221. [equipment_documentation](#equipment-documentation)
222. [error_implementations](#error-implementations)
223. [error_metrics](#error-metrics)
224. [error_trackings](#error-trackings)
225. [esignature_audit](#esignature-audit)
226. [evaluation_packages](#evaluation-packages)
227. [external_api_configurations](#external-api-configurations)
228. [external_party_document_instances](#external-party-document-instances)
229. [field_attribute_compliance](#field-attribute-compliance)
230. [financial_records](#financial-records)
231. [flowise_documents](#flowise-documents)
232. [flowise_documents_with_stores](#flowise-documents-with-stores)
233. [flowise_record_manager](#flowise-record-manager)
234. [form_completions](#form-completions)
235. [form_instances](#form-instances)
236. [form_templates](#form-templates)
237. [form_templates_audit](#form-templates-audit)
238. [fuel_lubricants](#fuel-lubricants)
239. [governance_approval_instances](#governance-approval-instances)
240. [governance_approval_matrices](#governance-approval-matrices)
241. [governance_approval_steps](#governance-approval-steps)
242. [governance_document_templates](#governance-document-templates)
243. [governance_document_templates_backup_20251121](#governance-document-templates-backup-20251121)
244. [governance_document_templates-old](#governance-document-templates-old)
245. [governance_template_usage](#governance-template-usage)
246. [hitl_performance_metrics](#hitl-performance-metrics)
247. [imported_emails_with_placeholder_users](#imported-emails-with-placeholder-users)
248. [inspection_items](#inspection-items)
249. [inspection_media](#inspection-media)
250. [inspections](#inspections)
251. [integration_sources](#integration-sources)
252. [integration_sync_history](#integration-sync-history)
253. [internal_notifications](#internal-notifications)
254. [job_descriptions](#job-descriptions)
255. [legal_reviews](#legal-reviews)
256. [limits_of_authority](#limits-of-authority)
257. [llm_configurations](#llm-configurations)
258. [llm_document_type_mappings](#llm-document-type-mappings)
259. [llm_functions](#llm-functions)
260. [logistics_alerts](#logistics-alerts)
261. [logistics_approval_steps](#logistics-approval-steps)
262. [logistics_approval_workflows](#logistics-approval-workflows)
263. [logistics_context_data](#logistics-context-data)
264. [logistics_coordination_monitor](#logistics-coordination-monitor)
265. [logistics_document_versions](#logistics-document-versions)
266. [logistics_documents](#logistics-documents)
267. [logistics_shipments](#logistics-shipments)
268. [maintenance_assets](#maintenance-assets)
269. [maintenance_history](#maintenance-history)
270. [maintenance_schedules](#maintenance-schedules)
271. [maintenance_work_orders](#maintenance-work-orders)
272. [master_engineering_templates](#master-engineering-templates)
273. [master_templates](#master-templates)
274. [match_all_documents](#match-all-documents)
275. [materials](#materials)
276. [migration_rename_log](#migration-rename-log)
277. [migration_validation_results](#migration-validation-results)
278. [modal_configurations](#modal-configurations)
279. [monthly_documents_created](#monthly-documents-created)
280. [multi_source_tenders](#multi-source-tenders)
281. [notifications](#notifications)
282. [numbering_config](#numbering-config)
283. [numbering_methodologies](#numbering-methodologies)
284. [numbering_patterns](#numbering-patterns)
285. [operations_equipment](#operations-equipment)
286. [order_derived_template_usage](#order-derived-template-usage)
287. [organisations_backup](#organisations-backup)
288. [organization_collaborations](#organization-collaborations)
289. [organization_db_configs](#organization-db-configs)
290. [organization_users](#organization-users)
291. [organizations](#organizations)
292. [page_permissions](#page-permissions)
293. [pages](#pages)
294. [pages_directors_backup_20250726](#pages-directors-backup-20250726)
295. [pages_with_clear_columns](#pages-with-clear-columns)
296. [pages_with_organization_mapping](#pages-with-organization-mapping)
297. [path_configurations](#path-configurations)
298. [performance_alerts](#performance-alerts)
299. [performance_metrics](#performance-metrics)
300. [personnel_records](#personnel-records)
301. [petty_cash](#petty-cash)
302. [ports](#ports)
303. [processing_statistics](#processing-statistics)
304. [procurement_approvals](#procurement-approvals)
305. [procurement_categories](#procurement-categories)
306. [procurement_contributions](#procurement-contributions)
307. [procurement_order_documents](#procurement-order-documents)
308. [procurement_orders](#procurement-orders)
309. [procurement_signatures](#procurement-signatures)
310. [procurement_templates](#procurement-templates)
311. [procurement_templates_backup_20251121](#procurement-templates-backup-20251121)
312. [progress_logs](#progress-logs)
313. [project_engineering_templates](#project-engineering-templates)
314. [project_permissions](#project-permissions)
315. [project_phase_assignments](#project-phase-assignments)
316. [project_phases](#project-phases)
317. [project_procurement_templates](#project-procurement-templates)
318. [project_template_preparation](#project-template-preparation)
319. [project_templates](#project-templates)
320. [projects](#projects)
321. [prompt_usage_audit](#prompt-usage-audit)
322. [prompt_usage_summary](#prompt-usage-summary)
323. [prompts](#prompts)
324. [prompts_enhanced](#prompts-enhanced)
325. [prompts_with_rbac](#prompts-with-rbac)
326. [push_notifications](#push-notifications)
327. [quality_checks](#quality-checks)
328. [rate_limits](#rate-limits)
329. [recent_audit_activity](#recent-audit-activity)
330. [record _manager](#record -manager)
331. [resource_documentation](#resource-documentation)
332. [resource_prompts](#resource-prompts)
333. [risk_assessments](#risk-assessments)
334. [role_definitions](#role-definitions)
335. [routing_notifications](#routing-notifications)
336. [routing_step_actions](#routing-step-actions)
337. [routing_step_participants](#routing-step-participants)
338. [routing_template_steps](#routing-template-steps)
339. [safety_incidents](#safety-incidents)
340. [safety_template_categories](#safety-template-categories)
341. [safety_template_dependencies](#safety-template-dependencies)
342. [safety_template_usage](#safety-template-usage)
343. [safety_templates](#safety-templates)
344. [safety_templates_backup_20251121](#safety-templates-backup-20251121)
345. [schema_migrations](#schema-migrations)
346. [scope_of_work](#scope-of-work)
347. [scope_of_work_relationships](#scope-of-work-relationships)
348. [section_hierarchy](#section-hierarchy)
349. [section_organization_mapping](#section-organization-mapping)
350. [section_pages](#section-pages)
351. [sections](#sections)
352. [sectors](#sectors)
353. [security_alerts](#security-alerts)
354. [security_audit_log](#security-audit-log)
355. [sequence_overrides](#sequence-overrides)
356. [shipment_containers](#shipment-containers)
357. [signature_audit_trail](#signature-audit-trail)
358. [signature_documents](#signature-documents)
359. [signature_requests](#signature-requests)
360. [signature_templates](#signature-templates)
361. [signature_webhooks](#signature-webhooks)
362. [sow_appendices](#sow-appendices)
363. [sow_document_transfers](#sow-document-transfers)
364. [sow_templates](#sow-templates)
365. [sql_file_tracking](#sql-file-tracking)
366. [supplier_verifications](#supplier-verifications)
367. [suppliers](#suppliers)
368. [sync_history](#sync-history)
369. [task_attachments](#task-attachments)
370. [task_comments](#task-comments)
371. [task_history](#task-history)
372. [task_messages](#task-messages)
373. [task_sequence_execution](#task-sequence-execution)
374. [tasks](#tasks)
375. [technical_document_categories](#technical-document-categories)
376. [template_analytics](#template-analytics)
377. [template_approval_rules](#template-approval-rules)
378. [template_approval_workflows](#template-approval-workflows)
379. [template_assignments](#template-assignments)
380. [template_categories](#template-categories)
381. [template_customization_rules](#template-customization-rules)
382. [template_dependencies](#template-dependencies)
383. [template_deployments](#template-deployments)
384. [template_derivations](#template-derivations)
385. [template_document_structures](#template-document-structures)
386. [template_relationships](#template-relationships)
387. [template_reviews](#template-reviews)
388. [template_usage_logs](#template-usage-logs)
389. [template_usage_stats](#template-usage-stats)
390. [template_usage_tracking](#template-usage-tracking)
391. [template_variation_sequences](#template-variation-sequences)
392. [template_versions](#template-versions)
393. [templates](#templates)
394. [temporary_uploads](#temporary-uploads)
395. [tender_approvals](#tender-approvals)
396. [tender_documents](#tender-documents)
397. [tender_evaluation](#tender-evaluation)
398. [tender_items](#tender-items)
399. [tender_monitors](#tender-monitors)
400. [tender_notification_logs](#tender-notification-logs)
401. [tender_suppliers](#tender-suppliers)
402. [tenders](#tenders)
403. [timesheet_amendments](#timesheet-amendments)
404. [timesheet_audit_logs](#timesheet-audit-logs)
405. [timesheet_descriptions](#timesheet-descriptions)
406. [timesheet_entries](#timesheet-entries)
407. [timesheet_submissions](#timesheet-submissions)
408. [timesheet_templates](#timesheet-templates)
409. [timesheets](#timesheets)
410. [tracking_events](#tracking-events)
411. [training_materials](#training-materials)
412. [training_pipeline_dashboard](#training-pipeline-dashboard)
413. [training_pipeline_status](#training-pipeline-status)
414. [travel_airports](#travel-airports)
415. [travel_equipment_filters](#travel-equipment-filters)
416. [travel_ground_routes](#travel-ground-routes)
417. [travel_hazard_alerts](#travel-hazard-alerts)
418. [travel_helipads](#travel-helipads)
419. [travel_requests](#travel-requests)
420. [travel_templates](#travel-templates)
421. [ui_button_settings](#ui-button-settings)
422. [ui_display_settings](#ui-display-settings)
423. [user_accordion_settings](#user-accordion-settings)
424. [user_companies](#user-companies)
425. [user_company_access](#user-company-access)
426. [user_department_access](#user-department-access)
427. [user_discipline_access](#user-discipline-access)
428. [user_email_accounts](#user-email-accounts)
429. [user_email_aliases](#user-email-aliases)
430. [user_emails](#user-emails)
431. [user_langchain_settings](#user-langchain-settings)
432. [user_management](#user-management)
433. [user_organization_access](#user-organization-access)
434. [user_organizations](#user-organizations)
435. [user_profiles](#user-profiles)
436. [user_project_access](#user-project-access)
437. [user_project_assignments](#user-project-assignments)
438. [user_role_assignments](#user-role-assignments)
439. [user_roles](#user-roles)
440. [user_vetting_permissions](#user-vetting-permissions)
441. [v_chat_issues](#v-chat-issues)
442. [v_chat_session_summary](#v-chat-session-summary)
443. [v_company_project_chat_usage](#v-company-project-chat-usage)
444. [v_daily_chat_stats](#v-daily-chat-stats)
445. [v_discipline_performance](#v-discipline-performance)
446. [v_document_types_lookup](#v-document-types-lookup)
447. [v_document_usage_analytics](#v-document-usage-analytics)
448. [v_financial_overdue](#v-financial-overdue)
449. [v_financial_summary](#v-financial-summary)
450. [v_realtime_chat_activity](#v-realtime-chat-activity)
451. [vector_deletion_audit](#vector-deletion-audit)
452. [vector_deletion_policies](#vector-deletion-policies)
453. [vector_search_criteria](#vector-search-criteria)
454. [vector_system_health](#vector-system-health)
455. [vector_workspaces](#vector-workspaces)
456. [vessels](#vessels)
457. [vetting_access_log](#vetting-access-log)
458. [vetting_access_summary](#vetting-access-summary)
459. [vetting_evaluation_audit](#vetting-evaluation-audit)
460. [workflow_routing_steps](#workflow-routing-steps)
461. [workspace_members](#workspace-members)

---

## a_00102_admin_data

**Description:** Administration data

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 2

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | integer | bigint | ✗ | Note:
This is a Primary Key.<pk/> |
| created_at | string | timestamp with time zone | ✗ | - |

---

## a_00102_admin_vector

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 16

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| embedding | string | extensions.vector | ✓ | - |
| metadata | unknown | jsonb | ✓ | - |
| content | string | text | ✓ | - |
| organization_id | string | uuid | ✓ | - |
| user_id | string | uuid | ✓ | - |
| created_by_user_id | integer | integer | ✓ | ID of the user who created this vector record |
| access_scope | string | character varying | ✓ | Access scope level for this vector record |
| organisation_id | integer | integer | ✓ | Organization ID this vector record belongs to |
| shared_with_disciplines | string | text | ✓ | JSON/text field indicating which disciplines can access this record |
| chunks | unknown | jsonb | ✓ | - |
| discipline_code | string | text | ✓ | - |
| isolation_metadata | unknown | jsonb | ✓ | - |
| project_id | integer | integer | ✓ | - |
| workspace_id | integer | integer | ✓ | - |
| workspace_type | string | text | ✓ | - |

---

## a_00105_travel_vector

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 8

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | text | ✓ | - |
| embedding | string | text | ✓ | - |
| metadata | unknown | jsonb | ✓ | - |
| content | string | text | ✓ | - |
| created_by_user_id | integer | integer | ✓ | - |
| access_scope | string | text | ✓ | - |
| organisation_id | integer | integer | ✓ | - |
| shared_with_disciplines | unknown | jsonb | ✓ | - |

---

## a_00106_timesheet_vector

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 8

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | text | ✓ | - |
| embedding | string | text | ✓ | - |
| metadata | unknown | jsonb | ✓ | - |
| content | string | text | ✓ | - |
| created_by_user_id | integer | integer | ✓ | - |
| access_scope | string | text | ✓ | - |
| organisation_id | integer | integer | ✓ | - |
| shared_with_disciplines | unknown | jsonb | ✓ | - |

---

## a_00200_commercial_vector

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 8

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| embedding | string | extensions.vector | ✓ | - |
| metadata | unknown | jsonb | ✓ | - |
| content | string | text | ✓ | - |
| created_by_user_id | integer | integer | ✓ | - |
| access_scope | string | character varying | ✓ | - |
| organisation_id | integer | integer | ✓ | - |
| shared_with_disciplines | string | text | ✓ | - |

---

## a_00300_construction_vector

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 9

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| embedding | string | extensions.vector | ✓ | - |
| metadata | unknown | jsonb | ✓ | - |
| content | string | text | ✓ | - |
| created_by_user_id | integer | integer | ✓ | - |
| access_scope | string | character varying | ✓ | - |
| organisation_id | integer | integer | ✓ | - |
| shared_with_disciplines | string | text | ✓ | - |
| chunks | unknown | jsonb | ✓ | - |

---

## a_00425_contracts_pre_vector

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 9

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | text | ✓ | - |
| embedding | string | text | ✓ | - |
| metadata | unknown | jsonb | ✓ | - |
| content | string | text | ✓ | - |
| created_by_user_id | integer | integer | ✓ | - |
| access_scope | string | text | ✓ | - |
| organisation_id | integer | integer | ✓ | - |
| shared_with_disciplines | unknown | jsonb | ✓ | - |
| chunks | unknown | jsonb | ✓ | - |

---

## a_00435_contracts_post_data

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 33

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| document_number | string | character varying | ✗ | - |
| contract_title | string | character varying | ✗ | - |
| contract_type | string | character varying | ✓ | - |
| contractor_name | string | character varying | ✓ | - |
| contract_value | number | numeric | ✓ | - |
| currency_code | string | character varying | ✓ | - |
| project_code | string | character varying | ✓ | - |
| project_name | string | character varying | ✓ | - |
| site_location | string | text | ✓ | - |
| award_date | string | date | ✓ | - |
| commencement_date | string | date | ✓ | - |
| completion_date | string | date | ✓ | - |
| original_value | number | numeric | ✓ | - |
| variations | number | numeric | ✓ | - |
| current_value | number | numeric | ✓ | - |
| contract_status | string | character varying | ✓ | - |
| progress_percentage | number | numeric | ✓ | - |
| days_remaining | integer | integer | ✓ | - |
| required_approvals | unknown | jsonb | ✓ | - |
| approval_status | string | character varying | ✓ | - |
| governance_category | string | character varying | ✓ | - |
| document_count | integer | integer | ✓ | - |
| last_document_date | string | timestamp with time zone | ✓ | - |
| template_used_id | string | uuid | ✓ | - |
| created_by | string | uuid | ✓ | - |
| approved_by | string | uuid | ✓ | - |
| organization_id | string | uuid | ✓ | - |
| tags | array | text[] | ✓ | - |
| notes | string | text | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |
| signed_at | string | timestamp with time zone | ✓ | - |

---

## a_00435_contracts_post_vector

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 19

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| embedding | string | extensions.vector(1536) | ✓ | - |
| metadata | unknown | jsonb | ✓ | - |
| content | string | text | ✓ | - |
| organisation_id | string | uuid | ✓ | - |
| project_id | string | uuid | ✓ | - |
| project_phase_assignment_id | string | uuid | ✓ | - |
| isolation_metadata | unknown | jsonb | ✓ | - |
| created_by_user_id | string | uuid | ✓ | - |
| access_scope | string | text | ✓ | - |
| shared_with_disciplines | array | text[] | ✓ | - |
| workspace_id | string | uuid | ✓ | - |
| workspace_type | string | text | ✓ | - |
| deleted_at | string | timestamp with time zone | ✓ | - |
| deleted_by | string | uuid | ✓ | - |
| deletion_reason | string | text | ✓ | - |
| scheduled_hard_delete_at | string | timestamp with time zone | ✓ | - |
| chunks | unknown | jsonb | ✓ | - |
| discipline_code | string | text | ✓ | - |

---

## a_00800_design_vector

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 11

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| embedding | string | extensions.vector(1536) | ✓ | - |
| metadata | unknown | jsonb | ✓ | - |
| content | string | text | ✓ | - |
| organization_id | string | uuid | ✓ | - |
| user_id | string | uuid | ✓ | - |
| created_by_user_id | integer | integer | ✓ | - |
| access_scope | string | character varying | ✓ | - |
| organisation_id | string | uuid | ✓ | - |
| shared_with_disciplines | string | text | ✓ | - |
| chunks | unknown | jsonb | ✓ | - |

---

## a_00825_architectural_vector

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 9

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| embedding | string | extensions.vector | ✓ | - |
| metadata | unknown | jsonb | ✓ | - |
| content | string | text | ✓ | - |
| created_by_user_id | integer | integer | ✓ | - |
| access_scope | string | character varying | ✓ | - |
| organisation_id | integer | integer | ✓ | - |
| shared_with_disciplines | string | text | ✓ | - |
| chunks | unknown | jsonb | ✓ | - |

---

## a_00835_chemeng_vector

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 14

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| embedding | string | extensions.vector | ✓ | - |
| metadata | unknown | jsonb | ✓ | - |
| content | string | text | ✓ | - |
| created_by_user_id | integer | integer | ✓ | - |
| access_scope | string | character varying | ✓ | - |
| organisation_id | integer | integer | ✓ | - |
| shared_with_disciplines | string | text | ✓ | - |
| chunks | unknown | jsonb | ✓ | - |
| discipline_code | string | text | ✓ | - |
| isolation_metadata | unknown | jsonb | ✓ | - |
| project_id | integer | integer | ✓ | - |
| workspace_id | integer | integer | ✓ | - |
| workspace_type | string | text | ✓ | - |

---

## a_00850_civileng_vector

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 18

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| embedding | string | extensions.vector | ✓ | - |
| metadata | unknown | jsonb | ✓ | - |
| content | string | text | ✓ | - |
| created_by_user_id | integer | integer | ✓ | - |
| access_scope | string | character varying | ✓ | - |
| organisation_id | integer | integer | ✓ | - |
| shared_with_disciplines | string | text | ✓ | - |
| workspace_id | string | uuid | ✓ | Note:
This is a Foreign Key to `vector_workspaces.id`.<fk table='vector_workspaces' column='id'/> |
| workspace_type | string | text | ✓ | - |
| deleted_at | string | timestamp with time zone | ✓ | - |
| deleted_by | string | uuid | ✓ | - |
| deletion_reason | string | text | ✓ | - |
| scheduled_hard_delete_at | string | timestamp with time zone | ✓ | - |
| isolation_metadata | unknown | jsonb | ✓ | - |
| chunks | unknown | jsonb | ✓ | - |
| discipline_code | string | text | ✓ | - |
| project_id | integer | integer | ✓ | - |

---

## a_00860_eleceng_vector

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 14

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| embedding | string | extensions.vector | ✓ | - |
| metadata | unknown | jsonb | ✓ | - |
| content | string | text | ✓ | - |
| created_by_user_id | integer | integer | ✓ | - |
| access_scope | string | character varying | ✓ | - |
| organisation_id | integer | integer | ✓ | - |
| shared_with_disciplines | string | text | ✓ | - |
| chunks | unknown | jsonb | ✓ | - |
| discipline_code | string | text | ✓ | - |
| isolation_metadata | unknown | jsonb | ✓ | - |
| project_id | integer | integer | ✓ | - |
| workspace_id | integer | integer | ✓ | - |
| workspace_type | string | text | ✓ | - |

---

## a_00870_mecheng_vector

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 14

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| embedding | string | extensions.vector | ✓ | - |
| metadata | unknown | jsonb | ✓ | - |
| content | string | text | ✓ | - |
| created_by_user_id | integer | integer | ✓ | - |
| access_scope | string | character varying | ✓ | - |
| organisation_id | integer | integer | ✓ | - |
| shared_with_disciplines | string | text | ✓ | - |
| chunks | unknown | jsonb | ✓ | - |
| discipline_code | string | text | ✓ | - |
| isolation_metadata | unknown | jsonb | ✓ | - |
| project_id | integer | integer | ✓ | - |
| workspace_id | integer | integer | ✓ | - |
| workspace_type | string | text | ✓ | - |

---

## a_00871_processeng_vector

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 14

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | text | ✓ | - |
| embedding | string | text | ✓ | - |
| metadata | unknown | jsonb | ✓ | - |
| content | string | text | ✓ | - |
| created_by_user_id | integer | integer | ✓ | - |
| access_scope | string | text | ✓ | - |
| organisation_id | integer | integer | ✓ | - |
| shared_with_disciplines | unknown | jsonb | ✓ | - |
| chunks | unknown | jsonb | ✓ | - |
| discipline_code | string | text | ✓ | - |
| isolation_metadata | unknown | jsonb | ✓ | - |
| project_id | integer | integer | ✓ | - |
| workspace_id | integer | integer | ✓ | - |
| workspace_type | string | text | ✓ | - |

---

## a_00872_developer_vector

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 14

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| embedding | string | extensions.vector | ✓ | - |
| metadata | unknown | jsonb | ✓ | - |
| content | string | text | ✓ | - |
| created_by_user_id | integer | integer | ✓ | - |
| access_scope | string | character varying | ✓ | - |
| organisation_id | integer | integer | ✓ | - |
| shared_with_disciplines | string | text | ✓ | - |
| chunks | unknown | jsonb | ✓ | - |
| discipline_code | string | text | ✓ | - |
| isolation_metadata | unknown | jsonb | ✓ | - |
| project_id | integer | integer | ✓ | - |
| workspace_id | integer | integer | ✓ | - |
| workspace_type | string | text | ✓ | - |

---

## a_00875_sales_vector

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 14

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| embedding | string | extensions.vector | ✓ | - |
| metadata | unknown | jsonb | ✓ | - |
| content | string | text | ✓ | - |
| created_by_user_id | integer | integer | ✓ | - |
| access_scope | string | character varying | ✓ | - |
| organisation_id | integer | integer | ✓ | - |
| shared_with_disciplines | string | text | ✓ | - |
| chunks | unknown | jsonb | ✓ | - |
| discipline_code | string | text | ✓ | - |
| isolation_metadata | unknown | jsonb | ✓ | - |
| project_id | integer | integer | ✓ | - |
| workspace_id | integer | integer | ✓ | - |
| workspace_type | string | text | ✓ | - |

---

## a_00877_sundry_vector

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 14

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| embedding | string | extensions.vector | ✓ | - |
| metadata | unknown | jsonb | ✓ | - |
| content | string | text | ✓ | - |
| created_by_user_id | integer | integer | ✓ | - |
| access_scope | string | character varying | ✓ | - |
| organisation_id | integer | integer | ✓ | - |
| shared_with_disciplines | string | text | ✓ | - |
| chunks | unknown | jsonb | ✓ | - |
| discipline_code | string | text | ✓ | - |
| isolation_metadata | unknown | jsonb | ✓ | - |
| project_id | integer | integer | ✓ | - |
| workspace_id | integer | integer | ✓ | - |
| workspace_type | string | text | ✓ | - |

---

## a_00880_boarddir_vector

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 14

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| embedding | string | extensions.vector | ✓ | - |
| metadata | unknown | jsonb | ✓ | - |
| content | string | text | ✓ | - |
| created_by_user_id | integer | integer | ✓ | - |
| access_scope | string | character varying | ✓ | - |
| organisation_id | integer | integer | ✓ | - |
| shared_with_disciplines | string | text | ✓ | - |
| chunks | unknown | jsonb | ✓ | - |
| discipline_code | string | text | ✓ | - |
| isolation_metadata | unknown | jsonb | ✓ | - |
| project_id | integer | integer | ✓ | - |
| workspace_id | integer | integer | ✓ | - |
| workspace_type | string | text | ✓ | - |

---

## a_00882_dirconst_vector

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 14

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| embedding | string | extensions.vector | ✓ | - |
| metadata | unknown | jsonb | ✓ | - |
| content | string | text | ✓ | - |
| created_by_user_id | integer | integer | ✓ | - |
| access_scope | string | character varying | ✓ | - |
| organisation_id | integer | integer | ✓ | - |
| shared_with_disciplines | string | text | ✓ | - |
| chunks | unknown | jsonb | ✓ | - |
| discipline_code | string | text | ✓ | - |
| isolation_metadata | unknown | jsonb | ✓ | - |
| project_id | integer | integer | ✓ | - |
| workspace_id | integer | integer | ✓ | - |
| workspace_type | string | text | ✓ | - |

---

## a_00883_dircontracts_vector

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 14

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| embedding | string | extensions.vector | ✓ | - |
| metadata | unknown | jsonb | ✓ | - |
| content | string | text | ✓ | - |
| created_by_user_id | integer | integer | ✓ | - |
| access_scope | string | character varying | ✓ | - |
| organisation_id | integer | integer | ✓ | - |
| shared_with_disciplines | string | text | ✓ | - |
| chunks | unknown | jsonb | ✓ | - |
| discipline_code | string | text | ✓ | - |
| isolation_metadata | unknown | jsonb | ✓ | - |
| project_id | integer | integer | ✓ | - |
| workspace_id | integer | integer | ✓ | - |
| workspace_type | string | text | ✓ | - |

---

## a_00884_1_dirfinance_vector

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 8

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| embedding | string | extensions.vector | ✓ | - |
| metadata | unknown | jsonb | ✓ | - |
| content | string | text | ✓ | - |
| created_by_user_id | integer | integer | ✓ | - |
| access_scope | string | character varying | ✓ | - |
| organisation_id | integer | integer | ✓ | - |
| shared_with_disciplines | string | text | ✓ | - |

---

## a_00884_direng_vector

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 14

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| embedding | string | extensions.vector | ✓ | - |
| metadata | unknown | jsonb | ✓ | - |
| content | string | text | ✓ | - |
| created_by_user_id | integer | integer | ✓ | - |
| access_scope | string | character varying | ✓ | - |
| organisation_id | integer | integer | ✓ | - |
| shared_with_disciplines | string | text | ✓ | - |
| chunks | unknown | jsonb | ✓ | - |
| discipline_code | string | text | ✓ | - |
| isolation_metadata | unknown | jsonb | ✓ | - |
| project_id | integer | integer | ✓ | - |
| workspace_id | integer | integer | ✓ | - |
| workspace_type | string | text | ✓ | - |

---

## a_00885_dirhse_vector

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 14

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| embedding | string | extensions.vector | ✓ | - |
| metadata | unknown | jsonb | ✓ | - |
| content | string | text | ✓ | - |
| created_by_user_id | integer | integer | ✓ | - |
| access_scope | string | character varying | ✓ | - |
| organisation_id | integer | integer | ✓ | - |
| shared_with_disciplines | string | text | ✓ | - |
| chunks | unknown | jsonb | ✓ | - |
| discipline_code | string | text | ✓ | - |
| isolation_metadata | unknown | jsonb | ✓ | - |
| project_id | integer | integer | ✓ | - |
| workspace_id | integer | integer | ✓ | - |
| workspace_type | string | text | ✓ | - |

---

## a_00886_dirlogistics_vector

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 14

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| embedding | string | extensions.vector | ✓ | - |
| metadata | unknown | jsonb | ✓ | - |
| content | string | text | ✓ | - |
| created_by_user_id | integer | integer | ✓ | - |
| access_scope | string | character varying | ✓ | - |
| organisation_id | integer | integer | ✓ | - |
| shared_with_disciplines | string | text | ✓ | - |
| chunks | unknown | jsonb | ✓ | - |
| discipline_code | string | text | ✓ | - |
| isolation_metadata | unknown | jsonb | ✓ | - |
| project_id | integer | integer | ✓ | - |
| workspace_id | integer | integer | ✓ | - |
| workspace_type | string | text | ✓ | - |

---

## a_00888_dirprocurement_vector

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 14

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| embedding | string | extensions.vector | ✓ | - |
| metadata | unknown | jsonb | ✓ | - |
| content | string | text | ✓ | - |
| created_by_user_id | integer | integer | ✓ | - |
| access_scope | string | character varying | ✓ | - |
| organisation_id | integer | integer | ✓ | - |
| shared_with_disciplines | string | text | ✓ | - |
| chunks | unknown | jsonb | ✓ | - |
| discipline_code | string | text | ✓ | - |
| isolation_metadata | unknown | jsonb | ✓ | - |
| project_id | integer | integer | ✓ | - |
| workspace_id | integer | integer | ✓ | - |
| workspace_type | string | text | ✓ | - |

---

## a_00889_dirfinance_vector

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 14

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | text | ✓ | - |
| embedding | string | text | ✓ | - |
| metadata | unknown | jsonb | ✓ | - |
| content | string | text | ✓ | - |
| created_by_user_id | integer | integer | ✓ | - |
| access_scope | string | text | ✓ | - |
| organisation_id | integer | integer | ✓ | - |
| shared_with_disciplines | unknown | jsonb | ✓ | - |
| chunks | unknown | jsonb | ✓ | - |
| discipline_code | string | text | ✓ | - |
| isolation_metadata | unknown | jsonb | ✓ | - |
| project_id | integer | integer | ✓ | - |
| workspace_id | integer | integer | ✓ | - |
| workspace_type | string | text | ✓ | - |

---

## a_00890_dirprojects_vector

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 14

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| embedding | string | extensions.vector | ✓ | - |
| metadata | unknown | jsonb | ✓ | - |
| content | string | text | ✓ | - |
| created_by_user_id | integer | integer | ✓ | - |
| access_scope | string | character varying | ✓ | - |
| organisation_id | integer | integer | ✓ | - |
| shared_with_disciplines | string | text | ✓ | - |
| chunks | unknown | jsonb | ✓ | - |
| discipline_code | string | text | ✓ | - |
| isolation_metadata | unknown | jsonb | ✓ | - |
| project_id | integer | integer | ✓ | - |
| workspace_id | integer | integer | ✓ | - |
| workspace_type | string | text | ✓ | - |

---

## a_00895_dirproject_vector

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 14

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| embedding | string | extensions.vector | ✓ | - |
| metadata | unknown | jsonb | ✓ | - |
| content | string | text | ✓ | - |
| created_by_user_id | integer | integer | ✓ | - |
| access_scope | string | character varying | ✓ | - |
| organisation_id | integer | integer | ✓ | - |
| shared_with_disciplines | string | text | ✓ | - |
| chunks | unknown | jsonb | ✓ | - |
| discipline_code | string | text | ✓ | - |
| isolation_metadata | unknown | jsonb | ✓ | - |
| project_id | integer | integer | ✓ | - |
| workspace_id | integer | integer | ✓ | - |
| workspace_type | string | text | ✓ | - |

---

## a_00900_doccontrol_approval_rule_steps

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 6

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | integer | bigint | ✗ | Note:
This is a Primary Key.<pk/> |
| rule_id | integer | bigint | ✗ | Note:
This is a Foreign Key to `a_00900_doccontrol_approval_rules.id`.<fk table='a_00900_doccontrol_approval_rules' column='id'/> |
| step_order | integer | integer | ✗ | - |
| role_slug | string | text | ✓ | - |
| required | boolean | boolean | ✗ | - |
| parallel_group_id | integer | integer | ✓ | - |

---

## a_00900_doccontrol_approval_rules

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 7

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | integer | bigint | ✗ | Note:
This is a Primary Key.<pk/> |
| discipline_id | integer | bigint | ✓ | - |
| store_id | integer | bigint | ✓ | - |
| doc_type | string | text | ✓ | - |
| routing_mode | string | text | ✗ | - |
| created_by | string | uuid | ✓ | - |
| created_at | string | timestamp with time zone | ✗ | - |

---

## a_00900_doccontrol_approvals

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 11

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | integer | bigint | ✗ | Note:
This is a Primary Key.<pk/> |
| version_id | integer | bigint | ✗ | Note:
This is a Foreign Key to `a_00900_doccontrol_document_versions.id`.<fk table='a_00900_doccontrol_document_versions' column='id'/> |
| step_order | integer | integer | ✗ | - |
| role_slug | string | text | ✓ | - |
| approver_id | string | uuid | ✓ | - |
| required | boolean | boolean | ✗ | - |
| status | string | text | ✗ | - |
| acted_by | string | uuid | ✓ | - |
| acted_at | string | timestamp with time zone | ✓ | - |
| comment | string | text | ✓ | - |
| created_at | string | timestamp with time zone | ✗ | - |

---

## a_00900_doccontrol_data

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 8

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| document_id | string | uuid | ✗ | Note:
This is a Foreign Key to `a_00900_doccontrol_documents.id`.<fk table='a_00900_doccontrol_documents' column='id'/> |
| transmittal_number | string | text | ✓ | - |
| revision_code | string | text | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |
| organization_id | string | uuid | ✓ | - |
| user_id | string | uuid | ✓ | - |

---

## a_00900_doccontrol_document_embeddings

**Description:** Stores text chunks and their vector embeddings for semantic search

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 12

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| document_id | string | uuid | ✗ | Note:
This is a Foreign Key to `a_00900_doccontrol_documents.id`.<fk table='a_00900_doccontrol_documents' column='id'/> |
| chunk_index | integer | integer | ✗ | - |
| chunk_text | string | text | ✗ | - |
| chunk_metadata | unknown | jsonb | ✓ | - |
| embedding | string | extensions.vector(1536) | ✓ | - |
| embedding_model | string | character varying | ✗ | - |
| embedding_provider | string | character varying | ✗ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |
| organization_id | string | uuid | ✓ | - |
| user_id | string | uuid | ✓ | - |

---

## a_00900_doccontrol_document_versions

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 14

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | integer | bigint | ✗ | Note:
This is a Primary Key.<pk/> |
| document_id | string | uuid | ✗ | Note:
This is a Foreign Key to `a_00900_doccontrol_documents.id`.<fk table='a_00900_doccontrol_documents' column='id'/> |
| version_number | integer | integer | ✗ | - |
| file_path | string | text | ✗ | - |
| status | string | text | ✗ | - |
| submitted_at | string | timestamp with time zone | ✓ | - |
| approved_at | string | timestamp with time zone | ✓ | - |
| uploaded_at | string | timestamp with time zone | ✗ | - |
| uploaded_by | string | uuid | ✓ | - |
| changes_summary | string | text | ✓ | - |
| created_at | string | timestamp with time zone | ✗ | - |
| updated_at | string | timestamp with time zone | ✗ | - |
| organization_id | string | uuid | ✓ | - |
| user_id | string | uuid | ✓ | - |

---

## a_00900_doccontrol_documents

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 42

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| file_path | string | text | ✗ | - |
| file_name | string | text | ✗ | - |
| file_extension | string | text | ✓ | - |
| uploaded_by | string | uuid | ✓ | - |
| uploaded_at | string | timestamp with time zone | ✓ | - |
| discipline | string | text | ✗ | - |
| page_number | string | text | ✗ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |
| status | string | text | ✓ | - |
| metadata_table_id | string | uuid | ✓ | - |
| flowise_store_id | string | uuid | ✓ | - |
| flowise_loader_id | string | uuid | ✓ | - |
| flowise_doc_id | string | uuid | ✓ | - |
| flowise_file_id | string | uuid | ✓ | - |
| total_chunks | integer | integer | ✓ | - |
| total_characters | integer | integer | ✓ | - |
| flowise_status | string | text | ✓ | - |
| size | integer | integer | ✓ | - |
| original_filename | string | text | ✓ | - |
| storage_url | string | text | ✓ | - |
| category_id | string | uuid | ✓ | - |
| embedding_details | unknown | jsonb | ✓ | Metadata about embedding process |
| is_embedded | boolean | boolean | ✓ | Whether document has been processed for vector search |
| metadata | unknown | jsonb | ✓ | - |
| storage_type | string | text | ✓ | Type of storage used: flowise_store or supabase_bucket |
| flowise_document_id | string | text | ✓ | ID returned by Flowise after document upsert |
| storage_path | string | text | ✓ | - |
| store_id | string | uuid | ✓ | Reference to the document store this document belongs to

Note:
This is a Foreign Key to `document_stores.id`.<fk table='document_stores' column='id'/> |
| title | string | text | ✓ | Document title for display purposes |
| company_id | string | uuid | ✓ | Links document to specific company for filtering

Note:
This is a Foreign Key to `companies.id`.<fk table='companies' column='id'/> |
| organization_id | string | uuid | ✓ | Links document to specific organization for filtering |
| langchain_metadata | unknown | jsonb | ✓ | Complete LangChain processing metadata in JSON format |
| langchain_loader_type | string | character varying | ✓ | LangChain loader used for processing (PyPDFLoader, Docx2txtLoader, etc.) |
| langchain_processing_status | string | character varying | ✓ | Current processing status (pending, processing, completed, failed) |
| langchain_trace_id | string | uuid | ✓ | LangSmith trace ID for observability |
| langchain_chunk_count | integer | integer | ✓ | - |
| langchain_embedding_model | string | character varying | ✓ | - |
| langchain_embedding_provider | string | character varying | ✓ | - |
| langchain_processed_at | string | timestamp with time zone | ✓ | - |
| user_id | string | uuid | ✓ | - |

---

## a_00900_doccontrol_langchain_jobs

**Description:** Manages async LangChain processing jobs for documents

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 15

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| document_id | string | uuid | ✗ | Note:
This is a Foreign Key to `a_00900_doccontrol_documents.id`.<fk table='a_00900_doccontrol_documents' column='id'/> |
| job_type | string | character varying | ✗ | - |
| status | string | character varying | ✗ | - |
| priority | integer | integer | ✓ | - |
| job_config | unknown | jsonb | ✓ | - |
| started_at | string | timestamp with time zone | ✓ | - |
| completed_at | string | timestamp with time zone | ✓ | - |
| error_message | string | text | ✓ | - |
| retry_count | integer | integer | ✓ | - |
| max_retries | integer | integer | ✓ | - |
| trace_id | string | uuid | ✓ | - |
| langsmith_run_id | string | character varying | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |

---

## a_00900_doccontrol_vector

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 18

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| embedding | string | extensions.vector | ✓ | - |
| metadata | unknown | jsonb | ✓ | - |
| content | string | text | ✓ | - |
| created_by_user_id | integer | integer | ✓ | - |
| access_scope | string | character varying | ✓ | - |
| organisation_id | integer | integer | ✓ | - |
| shared_with_disciplines | string | text | ✓ | - |
| workspace_id | string | uuid | ✓ | Note:
This is a Foreign Key to `vector_workspaces.id`.<fk table='vector_workspaces' column='id'/> |
| workspace_type | string | text | ✓ | - |
| deleted_at | string | timestamp with time zone | ✓ | - |
| deleted_by | string | uuid | ✓ | - |
| deletion_reason | string | text | ✓ | - |
| scheduled_hard_delete_at | string | timestamp with time zone | ✓ | - |
| isolation_metadata | unknown | jsonb | ✓ | - |
| chunks | unknown | jsonb | ✓ | - |
| discipline_code | string | text | ✓ | - |
| project_id | integer | integer | ✓ | - |

---

## a_00900_user_langchain_settings

**Description:** Stores user-specific LangChain configuration settings

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 40

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| user_id | string | uuid | ✗ | - |
| organization_id | string | uuid | ✓ | - |
| llm_provider | string | character varying | ✓ | - |
| llm_model | string | character varying | ✓ | - |
| llm_api_key_encrypted | string | text | ✓ | - |
| llm_base_url | string | character varying | ✓ | - |
| llm_temperature | number | numeric | ✓ | - |
| llm_max_tokens | integer | integer | ✓ | - |
| llm_timeout | integer | integer | ✓ | - |
| embedding_provider | string | character varying | ✓ | - |
| embedding_model | string | character varying | ✓ | - |
| embedding_api_key_encrypted | string | text | ✓ | - |
| embedding_base_url | string | character varying | ✓ | - |
| embedding_dimensions | integer | integer | ✓ | - |
| embedding_batch_size | integer | integer | ✓ | - |
| text_chunk_size | integer | integer | ✓ | - |
| text_chunk_overlap | integer | integer | ✓ | - |
| text_separators | unknown | jsonb | ✓ | - |
| text_keep_separator | boolean | boolean | ✓ | - |
| text_length_function | string | character varying | ✓ | - |
| enable_embeddings | boolean | boolean | ✓ | - |
| enable_summarization | boolean | boolean | ✓ | - |
| enable_keyword_extraction | boolean | boolean | ✓ | - |
| enable_entity_extraction | boolean | boolean | ✓ | - |
| batch_processing | boolean | boolean | ✓ | - |
| max_concurrent_jobs | integer | integer | ✓ | - |
| retry_attempts | integer | integer | ✓ | - |
| retry_delay | integer | integer | ✓ | - |
| langsmith_enabled | boolean | boolean | ✓ | - |
| langsmith_api_key_encrypted | string | text | ✓ | - |
| langsmith_project_name | string | character varying | ✓ | - |
| langsmith_endpoint | string | character varying | ✓ | - |
| langsmith_tracing_enabled | boolean | boolean | ✓ | - |
| langsmith_evaluation_enabled | boolean | boolean | ✓ | - |
| vector_store_provider | string | character varying | ✓ | - |
| vector_store_connection_string_encrypted | string | text | ✓ | - |
| vector_store_table_name | string | character varying | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |

---

## a_00test

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 4

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| content | string | text | ✗ | - |
| metadata | unknown | jsonb | ✓ | - |
| embedding | string | extensions.vector(1024) | ✓ | - |

---

## a_01000_environmental_vector

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 14

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| embedding | string | extensions.vector | ✓ | - |
| metadata | unknown | jsonb | ✓ | - |
| content | string | text | ✓ | - |
| created_by_user_id | integer | integer | ✓ | - |
| access_scope | string | character varying | ✓ | - |
| organisation_id | integer | integer | ✓ | - |
| shared_with_disciplines | string | text | ✓ | - |
| chunks | unknown | jsonb | ✓ | - |
| discipline_code | string | text | ✓ | - |
| isolation_metadata | unknown | jsonb | ✓ | - |
| project_id | integer | integer | ✓ | - |
| workspace_id | integer | integer | ✓ | - |
| workspace_type | string | text | ✓ | - |

---

## a_01100_ethics_vector

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 14

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| embedding | string | extensions.vector | ✓ | - |
| metadata | unknown | jsonb | ✓ | - |
| content | string | text | ✓ | - |
| created_by_user_id | integer | integer | ✓ | - |
| access_scope | string | character varying | ✓ | - |
| organisation_id | integer | integer | ✓ | - |
| shared_with_disciplines | string | text | ✓ | - |
| chunks | unknown | jsonb | ✓ | - |
| discipline_code | string | text | ✓ | - |
| isolation_metadata | unknown | jsonb | ✓ | - |
| project_id | integer | integer | ✓ | - |
| workspace_id | integer | integer | ✓ | - |
| workspace_type | string | text | ✓ | - |

---

## a_01200_finance_vector

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 14

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| embedding | string | extensions.vector | ✓ | - |
| metadata | unknown | jsonb | ✓ | - |
| content | string | text | ✓ | - |
| created_by_user_id | integer | integer | ✓ | - |
| access_scope | string | character varying | ✓ | - |
| organisation_id | integer | integer | ✓ | - |
| shared_with_disciplines | string | text | ✓ | - |
| chunks | unknown | jsonb | ✓ | - |
| discipline_code | string | text | ✓ | - |
| isolation_metadata | unknown | jsonb | ✓ | - |
| project_id | integer | integer | ✓ | - |
| workspace_id | integer | integer | ✓ | - |
| workspace_type | string | text | ✓ | - |

---

## a_01300_governance_vector

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 14

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| embedding | string | extensions.vector | ✓ | - |
| metadata | unknown | jsonb | ✓ | - |
| content | string | text | ✓ | - |
| created_by_user_id | integer | integer | ✓ | - |
| access_scope | string | character varying | ✓ | - |
| organisation_id | integer | integer | ✓ | - |
| shared_with_disciplines | string | text | ✓ | - |
| chunks | unknown | jsonb | ✓ | - |
| discipline_code | string | text | ✓ | - |
| isolation_metadata | unknown | jsonb | ✓ | - |
| project_id | integer | integer | ✓ | - |
| workspace_id | integer | integer | ✓ | - |
| workspace_type | string | text | ✓ | - |

---

## a_01400_health_vector

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 14

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| embedding | string | extensions.vector | ✓ | - |
| metadata | unknown | jsonb | ✓ | - |
| content | string | text | ✓ | - |
| created_by_user_id | integer | integer | ✓ | - |
| access_scope | string | character varying | ✓ | - |
| organisation_id | integer | integer | ✓ | - |
| shared_with_disciplines | string | text | ✓ | - |
| chunks | unknown | jsonb | ✓ | - |
| discipline_code | string | text | ✓ | - |
| isolation_metadata | unknown | jsonb | ✓ | - |
| project_id | integer | integer | ✓ | - |
| workspace_id | integer | integer | ✓ | - |
| workspace_type | string | text | ✓ | - |

---

## a_01500_hr_candidate_evaluation

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 18

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| submission_date | string | timestamp without time zone | ✓ | - |
| first_name | string | text | ✓ | - |
| surname | string | text | ✓ | - |
| phone | string | text | ✓ | - |
| city | string | text | ✓ | - |
| province_state | string | text | ✓ | - |
| country | string | text | ✓ | - |
| job_reference_no | string | text | ✓ | - |
| discipline | string | text | ✓ | - |
| email | string | text | ✓ | - |
| educational | string | text | ✓ | - |
| job_history | string | text | ✓ | - |
| skills | string | text | ✓ | - |
| summarize | string | text | ✓ | - |
| vote | number | numeric | ✓ | - |
| consideration | string | text | ✓ | - |
| full_name | string | text | ✓ | - |

---

## a_01500_hr_vector

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 15

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| embedding | string | extensions.vector | ✓ | - |
| metadata | unknown | jsonb | ✓ | - |
| content | string | text | ✓ | - |
| organisation_id | string | uuid | ✓ | - |
| project_id | string | uuid | ✓ | - |
| project_phase_assignment_id | string | uuid | ✓ | - |
| created_by_user_id | integer | integer | ✓ | - |
| access_scope | string | character varying | ✓ | - |
| shared_with_disciplines | string | text | ✓ | - |
| chunks | unknown | jsonb | ✓ | - |
| discipline_code | string | text | ✓ | - |
| isolation_metadata | unknown | jsonb | ✓ | - |
| workspace_id | integer | integer | ✓ | - |
| workspace_type | string | text | ✓ | - |

---

## a_01600_localcontent_vector

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 14

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| embedding | string | extensions.vector | ✓ | - |
| metadata | unknown | jsonb | ✓ | - |
| content | string | text | ✓ | - |
| created_by_user_id | integer | integer | ✓ | - |
| access_scope | string | character varying | ✓ | - |
| organisation_id | integer | integer | ✓ | - |
| shared_with_disciplines | string | text | ✓ | - |
| chunks | unknown | jsonb | ✓ | - |
| discipline_code | string | text | ✓ | - |
| isolation_metadata | unknown | jsonb | ✓ | - |
| project_id | integer | integer | ✓ | - |
| workspace_id | integer | integer | ✓ | - |
| workspace_type | string | text | ✓ | - |

---

## a_01700_logistics_vector

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 15

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| embedding | string | extensions.vector | ✓ | - |
| metadata | unknown | jsonb | ✓ | - |
| content | string | text | ✓ | - |
| created_by_user_id | integer | integer | ✓ | - |
| access_scope | string | character varying | ✓ | - |
| organisation_id | string | uuid | ✓ | - |
| shared_with_disciplines | string | text | ✓ | - |
| chunks | unknown | jsonb | ✓ | - |
| discipline_code | string | text | ✓ | - |
| isolation_metadata | unknown | jsonb | ✓ | - |
| project_id | integer | integer | ✓ | - |
| workspace_id | integer | integer | ✓ | - |
| workspace_type | string | text | ✓ | - |
| project_phase_assignment_id | string | uuid | ✓ | - |

---

## a_01750_legal_vector

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 14

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| embedding | string | extensions.vector | ✓ | - |
| metadata | unknown | jsonb | ✓ | - |
| content | string | text | ✓ | - |
| created_by_user_id | integer | integer | ✓ | - |
| access_scope | string | character varying | ✓ | - |
| organisation_id | integer | integer | ✓ | - |
| shared_with_disciplines | string | text | ✓ | - |
| chunks | unknown | jsonb | ✓ | - |
| discipline_code | string | text | ✓ | - |
| isolation_metadata | unknown | jsonb | ✓ | - |
| project_id | integer | integer | ✓ | - |
| workspace_id | integer | integer | ✓ | - |
| workspace_type | string | text | ✓ | - |

---

## a_01800_operations_vector

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 14

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| embedding | string | extensions.vector | ✓ | - |
| metadata | unknown | jsonb | ✓ | - |
| content | string | text | ✓ | - |
| created_by_user_id | integer | integer | ✓ | - |
| access_scope | string | character varying | ✓ | - |
| organisation_id | integer | integer | ✓ | - |
| shared_with_disciplines | string | text | ✓ | - |
| chunks | unknown | jsonb | ✓ | - |
| discipline_code | string | text | ✓ | - |
| isolation_metadata | unknown | jsonb | ✓ | - |
| project_id | integer | integer | ✓ | - |
| workspace_id | integer | integer | ✓ | - |
| workspace_type | string | text | ✓ | - |

---

## a_01850_otherparties_vector

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 14

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| embedding | string | extensions.vector | ✓ | - |
| metadata | unknown | jsonb | ✓ | - |
| content | string | text | ✓ | - |
| created_by_user_id | integer | integer | ✓ | - |
| access_scope | string | character varying | ✓ | - |
| organisation_id | integer | integer | ✓ | - |
| shared_with_disciplines | string | text | ✓ | - |
| chunks | unknown | jsonb | ✓ | - |
| discipline_code | string | text | ✓ | - |
| isolation_metadata | unknown | jsonb | ✓ | - |
| project_id | integer | integer | ✓ | - |
| workspace_id | integer | integer | ✓ | - |
| workspace_type | string | text | ✓ | - |

---

## a_01900_procurement_vector

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 18

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| embedding | string | extensions.vector | ✓ | - |
| metadata | unknown | jsonb | ✓ | - |
| content | string | text | ✓ | - |
| created_by_user_id | string | uuid | ✓ | - |
| access_scope | string | text | ✓ | - |
| organisation_id | string | uuid | ✓ | - |
| shared_with_disciplines | string | text | ✓ | - |
| workspace_id | string | uuid | ✓ | - |
| workspace_type | string | text | ✓ | - |
| deleted_at | string | timestamp with time zone | ✓ | - |
| deleted_by | string | uuid | ✓ | - |
| deletion_reason | string | text | ✓ | - |
| scheduled_hard_delete_at | string | timestamp with time zone | ✓ | - |
| isolation_metadata | unknown | jsonb | ✓ | - |
| discipline_code | string | text | ✓ | - |
| chunks | unknown | jsonb | ✓ | - |
| project_id | integer | integer | ✓ | - |

---

## a_02000_projctrl_vector

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 14

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | text | ✓ | - |
| embedding | string | text | ✓ | - |
| metadata | unknown | jsonb | ✓ | - |
| content | string | text | ✓ | - |
| created_by_user_id | integer | integer | ✓ | - |
| access_scope | string | text | ✓ | - |
| organisation_id | integer | integer | ✓ | - |
| shared_with_disciplines | unknown | jsonb | ✓ | - |
| chunks | unknown | jsonb | ✓ | - |
| discipline_code | string | text | ✓ | - |
| isolation_metadata | unknown | jsonb | ✓ | - |
| project_id | integer | integer | ✓ | - |
| workspace_id | integer | integer | ✓ | - |
| workspace_type | string | text | ✓ | - |

---

## a_02025_invoice_processing

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 14

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| invoice_no | string | character varying | ✗ | - |
| amount | number | numeric | ✗ | - |
| due_date | string | date | ✗ | - |
| supplier_name | string | character varying | ✗ | - |
| category | string | character varying | ✓ | - |
| company | string | character varying | ✓ | - |
| project | string | character varying | ✓ | - |
| contract_type | string | character varying | ✓ | - |
| contractor | string | character varying | ✓ | - |
| contract | string | character varying | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |
| description | string | text | ✓ | - |

---

## a_02025_qs_data

**Description:** QuantUM Quantity Surveying Data Table - Stores drawings and measurements with full audit trails and compliance tracking

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 30

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | integer | bigint | ✗ | Note:
This is a Primary Key.<pk/> |
| created_at | string | timestamp with time zone | ✗ | - |
| company_id | string | uuid | ✓ | - |
| project_id | string | uuid | ✓ | - |
| contract_type | string | text | ✓ | - |
| contractor_id | string | uuid | ✓ | - |
| contract_id | string | uuid | ✓ | - |
| identifier | string | text | ✓ | - |
| allocation_values | array | text[] | ✓ | - |
| selected_storage_id | string | text | ✓ | - |
| data_storage_update_mode | string | text | ✓ | - |
| doc_type_value | string | text | ✓ | - |
| doc_type_values | array | text[] | ✓ | - |
| text_input | string | text | ✓ | - |
| selected_file | string | text | ✓ | - |
| text_class_value | string | text | ✓ | - |
| data_type | string | text | ✓ | - |
| title | string | text | ✓ | - |
| scale | string | text | ✓ | - |
| approval_status | string | text | ✓ | - |
| measurement_type | string | text | ✓ | - |
| value | number | numeric | ✓ | - |
| unit | string | text | ✓ | - |
| status | string | text | ✓ | - |
| element_type | string | text | ✓ | - |
| element_identifier | string | text | ✓ | - |
| asaqs_compliant | boolean | boolean | ✓ | - |
| sans_compliant | boolean | boolean | ✓ | - |
| measured_by | string | text | ✓ | - |
| recorded_by | string | text | ✓ | - |

---

## a_02025_qs_vector

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 14

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| embedding | string | extensions.vector | ✓ | - |
| metadata | unknown | jsonb | ✓ | - |
| content | string | text | ✓ | - |
| created_by_user_id | integer | integer | ✓ | - |
| access_scope | string | character varying | ✓ | - |
| organisation_id | integer | integer | ✓ | - |
| shared_with_disciplines | string | text | ✓ | - |
| chunks | unknown | jsonb | ✓ | - |
| discipline_code | string | text | ✓ | - |
| isolation_metadata | unknown | jsonb | ✓ | - |
| project_id | integer | integer | ✓ | - |
| workspace_id | integer | integer | ✓ | - |
| workspace_type | string | text | ✓ | - |

---

## a_02035_scheduling_vector

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 14

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| embedding | string | extensions.vector | ✓ | - |
| metadata | unknown | jsonb | ✓ | - |
| content | string | text | ✓ | - |
| created_by_user_id | integer | integer | ✓ | - |
| access_scope | string | character varying | ✓ | - |
| organisation_id | integer | integer | ✓ | - |
| shared_with_disciplines | string | text | ✓ | - |
| chunks | unknown | jsonb | ✓ | - |
| discipline_code | string | text | ✓ | - |
| isolation_metadata | unknown | jsonb | ✓ | - |
| project_id | integer | integer | ✓ | - |
| workspace_id | integer | integer | ✓ | - |
| workspace_type | string | text | ✓ | - |

---

## a_02050_it_vector

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 14

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| embedding | string | extensions.vector | ✓ | - |
| metadata | unknown | jsonb | ✓ | - |
| content | string | text | ✓ | - |
| created_by_user_id | integer | integer | ✓ | - |
| access_scope | string | character varying | ✓ | - |
| organisation_id | integer | integer | ✓ | - |
| shared_with_disciplines | string | text | ✓ | - |
| chunks | unknown | jsonb | ✓ | - |
| discipline_code | string | text | ✓ | - |
| isolation_metadata | unknown | jsonb | ✓ | - |
| project_id | integer | integer | ✓ | - |
| workspace_id | integer | integer | ✓ | - |
| workspace_type | string | text | ✓ | - |

---

## a_02050_logistics_data

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 2

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | integer | bigint | ✗ | Note:
This is a Primary Key.<pk/> |
| created_at | string | timestamp with time zone | ✗ | - |

---

## a_02075_inspection_data

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 20

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| inspection_date | string | timestamp with time zone | ✗ | - |
| inspector_name | string | text | ✓ | - |
| inspection_type | string | character varying | ✓ | - |
| location | string | text | ✓ | - |
| status | string | character varying | ✓ | - |
| findings | string | text | ✓ | - |
| recommendations | string | text | ✓ | - |
| company | string | character varying | ✓ | - |
| project | string | character varying | ✓ | - |
| contract_type | string | character varying | ✓ | - |
| contractor | string | character varying | ✓ | - |
| contract | string | character varying | ✓ | - |
| attachments | unknown | jsonb | ✓ | - |
| metadata | unknown | jsonb | ✓ | - |
| category | string | character varying | ✓ | - |
| processing_status | string | character varying | ✓ | - |
| error_message | string | text | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |

---

## a_02075_inspection_vector

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 14

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| embedding | string | extensions.vector | ✓ | - |
| metadata | unknown | jsonb | ✓ | - |
| content | string | text | ✓ | - |
| created_by_user_id | integer | integer | ✓ | - |
| access_scope | string | character varying | ✓ | - |
| organisation_id | integer | integer | ✓ | - |
| shared_with_disciplines | string | text | ✓ | - |
| chunks | unknown | jsonb | ✓ | - |
| discipline_code | string | text | ✓ | - |
| isolation_metadata | unknown | jsonb | ✓ | - |
| project_id | integer | integer | ✓ | - |
| workspace_id | integer | integer | ✓ | - |
| workspace_type | string | text | ✓ | - |

---

## a_02075_knowledge_base

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 19

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| doc_types | string | character varying | ✓ | - |
| type_equipment | string | character varying | ✓ | - |
| type_component | string | character varying | ✓ | - |
| type_item | string | character varying | ✓ | - |
| revision_date | string | date | ✓ | - |
| media | string | character varying | ✓ | - |
| research_frequency | string | character varying | ✓ | - |
| last_search_date | string | date | ✓ | - |
| time | string | character varying | ✓ | - |
| external_sources | string | text | ✓ | - |
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| next_search_date | string | date | ✓ | - |
| comments | string | text | ✓ | - |
| knowledge_type | unknown | jsonb | ✓ | - |
| knowledge_owner | string | character varying | ✓ | - |
| owner_email | string | character varying | ✓ | - |
| owner_first_name | string | character varying | ✓ | - |
| owner_last_name | string | character varying | ✓ | - |
| source_url | string | character varying | ✓ | - |

---

## a_02075_knowledge_base_data

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 19

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| url | string | text | ✓ | - |
| original_search_result | string | text | ✓ | - |
| original_search_summary | string | text | ✓ | - |
| search_intent | string | text | ✓ | - |
| writing_style | string | text | ✓ | - |
| writing_tone | string | text | ✓ | - |
| hidden_insight | string | text | ✓ | - |
| target_audience | string | text | ✓ | - |
| goal_of_article | string | text | ✓ | - |
| semantic_analysis | string | text | ✓ | - |
| common_subtopics | string | text | ✓ | - |
| related_questions | string | text | ✓ | - |
| keywords | string | text | ✓ | - |
| primary_keyword | string | text | ✓ | - |
| secondary_keywords | string | text | ✓ | - |
| semantic_keywords | string | text | ✓ | - |
| long_tail_keywords | string | text | ✓ | - |
| re_written_article | string | text | ✓ | - |

---

## a_02076_qa_vector

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 17

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| content | string | text | ✗ | - |
| metadata | unknown | jsonb | ✓ | - |
| embedding | string | extensions.vector(1536) | ✓ | - |
| organisation_id | integer | integer | ✓ | - |
| project_id | integer | integer | ✓ | - |
| project_phase_assignment_id | integer | integer | ✓ | - |
| created_by_user_id | integer | integer | ✓ | - |
| access_scope | string | text | ✓ | - |
| shared_with_disciplines | array | text[] | ✓ | - |
| workspace_id | integer | integer | ✓ | - |
| workspace_type | string | text | ✓ | - |
| isolation_metadata | unknown | jsonb | ✓ | - |
| chunks | unknown | jsonb | ✓ | - |
| discipline_code | string | text | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |

---

## a_02100_pr_media

**Description:** Table storing platform content data including video metrics and related content

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 17

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | integer | bigint | ✗ | Note:
This is a Primary Key.<pk/> |
| platform | string | text | ✗ | - |
| channel_name | string | text | ✓ | - |
| channel_url | string | text | ✓ | - |
| views | integer | bigint | ✓ | - |
| likes | integer | bigint | ✓ | - |
| comments | integer | bigint | ✓ | - |
| video_url | string | text | ✓ | - |
| video_description | string | text | ✓ | - |
| video_title | string | text | ✓ | - |
| video_tags | array | text[] | ✓ | - |
| video_summary | string | text | ✓ | - |
| script_summary | string | text | ✓ | - |
| transcript | string | text | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |
| image_title | string | text | ✓ | - |

---

## a_02100_publicrel_vector

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 14

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| embedding | string | extensions.vector | ✓ | - |
| metadata | unknown | jsonb | ✓ | - |
| content | string | text | ✓ | - |
| created_by_user_id | integer | integer | ✓ | - |
| access_scope | string | character varying | ✓ | - |
| organisation_id | integer | integer | ✓ | - |
| shared_with_disciplines | string | text | ✓ | - |
| chunks | unknown | jsonb | ✓ | - |
| discipline_code | string | text | ✓ | - |
| isolation_metadata | unknown | jsonb | ✓ | - |
| project_id | integer | integer | ✓ | - |
| workspace_id | integer | integer | ✓ | - |
| workspace_type | string | text | ✓ | - |

---

## a_02200_qa_vector

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 14

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| embedding | string | extensions.vector | ✓ | - |
| metadata | unknown | jsonb | ✓ | - |
| content | string | text | ✓ | - |
| created_by_user_id | integer | integer | ✓ | - |
| access_scope | string | character varying | ✓ | - |
| organisation_id | integer | integer | ✓ | - |
| shared_with_disciplines | string | text | ✓ | - |
| chunks | unknown | jsonb | ✓ | - |
| discipline_code | string | text | ✓ | - |
| isolation_metadata | unknown | jsonb | ✓ | - |
| project_id | integer | integer | ✓ | - |
| workspace_id | integer | integer | ✓ | - |
| workspace_type | string | text | ✓ | - |

---

## a_02250_qc_vector

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 14

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| embedding | string | extensions.vector | ✓ | - |
| metadata | unknown | jsonb | ✓ | - |
| content | string | text | ✓ | - |
| created_by_user_id | integer | integer | ✓ | - |
| access_scope | string | character varying | ✓ | - |
| organisation_id | integer | integer | ✓ | - |
| shared_with_disciplines | string | text | ✓ | - |
| chunks | unknown | jsonb | ✓ | - |
| discipline_code | string | text | ✓ | - |
| isolation_metadata | unknown | jsonb | ✓ | - |
| project_id | integer | integer | ✓ | - |
| workspace_id | integer | integer | ✓ | - |
| workspace_type | string | text | ✓ | - |

---

## a_02400_contractor_vetting_data

**Description:** Contractor vetting specific metadata

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 10

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| document_id | string | uuid | ✗ | Reference to main document

Note:
This is a Foreign Key to `a_02400_contractor_vetting_documents.id`.<fk table='a_02400_contractor_vetting_documents' column='id'/> |
| contractor_name | string | text | ✓ | Name of contractor |
| evaluation_score | integer | integer | ✓ | Evaluation score (0-100) |
| confidence_level | integer | integer | ✓ | AI confidence level (0-100) |
| commentary | string | text | ✓ | AI generated commentary |
| extracted_data | unknown | jsonb | ✓ | JSON data extracted from documents |
| ai_analysis | unknown | jsonb | ✓ | AI analysis results |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |

---

## a_02400_contractor_vetting_document_versions

**Description:** Version history for contractor vetting documents

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 9

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| document_id | string | uuid | ✗ | Reference to main document

Note:
This is a Foreign Key to `a_02400_contractor_vetting_documents.id`.<fk table='a_02400_contractor_vetting_documents' column='id'/> |
| version_number | integer | integer | ✗ | Version sequence number |
| file_path | string | text | ✗ | - |
| uploaded_at | string | timestamp with time zone | ✓ | - |
| uploaded_by | string | uuid | ✓ | - |
| changes_summary | string | text | ✓ | Summary of changes in this version |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |

---

## a_02400_contractor_vetting_documents

**Description:** Contractor vetting documents integrated with 00900 document control system

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 25

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| file_path | string | text | ✗ | - |
| file_name | string | text | ✗ | - |
| file_extension | string | text | ✓ | - |
| uploaded_by | string | uuid | ✓ | - |
| uploaded_at | string | timestamp with time zone | ✓ | - |
| current_version_id | string | uuid | ✓ | Note:
This is a Foreign Key to `a_02400_contractor_vetting_document_versions.id`.<fk table='a_02400_contractor_vetting_document_versions' column='id'/> |
| discipline | string | text | ✗ | Discipline (Safety) |
| page_number | string | text | ✗ | Associated with Safety page (02400) |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |
| status | string | text | ✓ | - |
| metadata_table_id | string | uuid | ✓ | - |
| vetting_id | integer | integer | ✓ | Reference to contractor vetting record

Note:
This is a Foreign Key to `contractor_vetting.id`.<fk table='contractor_vetting' column='id'/> |
| section_id | integer | integer | ✓ | Reference to specific vetting section

Note:
This is a Foreign Key to `contractor_vetting_sections.id`.<fk table='contractor_vetting_sections' column='id'/> |
| document_type | string | character varying | ✓ | Type of document (financial, licensing, etc.) |
| processing_status | string | text | ✓ | Document processing status |
| processing_result | string | text | ✓ | - |
| document_hash | string | text | ✓ | - |
| content_hash | string | text | ✓ | - |
| storage_path | string | text | ✓ | - |
| department_id | string | uuid | ✓ | Note:
This is a Foreign Key to `organizations.id`.<fk table='organizations' column='id'/> |
| version_number | string | text | ✓ | - |
| retention_policy | string | text | ✓ | - |
| legal_hold | boolean | boolean | ✓ | - |

---

## a_02400_safety_data

**Description:** RLS disabled for testing

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 14

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | integer | bigint | ✗ | Note:
This is a Primary Key.<pk/> |
| filename | string | text | ✗ | - |
| originalname | string | text | ✗ | - |
| filetype | string | text | ✗ | - |
| companyid | integer | integer | ✗ | - |
| projectid | integer | integer | ✗ | - |
| contractid | integer | integer | ✗ | - |
| contracttypeid | integer | integer | ✗ | - |
| mimetype | string | text | ✗ | - |
| filesize | integer | integer | ✗ | - |
| filepath | string | text | ✗ | - |
| uploaddate | string | timestamp with time zone | ✗ | - |
| userrole | string | text | ✗ | - |
| created_at | string | timestamp with time zone | ✓ | - |

---

## a_02400_safety_vector

**Description:** RLS disabled for testing

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 20

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | integer | bigint | ✗ | Note:
This is a Primary Key.<pk/> |
| content | string | text | ✗ | - |
| safetydataid | integer | integer | ✓ | Note:
This is a Foreign Key to `a_02400_safety_data.id`.<fk table='a_02400_safety_data' column='id'/> |
| companyid | integer | integer | ✗ | - |
| projectid | integer | integer | ✗ | - |
| contractid | integer | integer | ✗ | - |
| contracttypeid | integer | integer | ✗ | - |
| embedding | string | extensions.vector(1536) | ✓ | - |
| userrole | string | text | ✗ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| created_by_user_id | integer | integer | ✓ | - |
| access_scope | string | character varying | ✓ | - |
| organisation_id | integer | integer | ✓ | - |
| shared_with_disciplines | string | text | ✓ | - |
| chunks | unknown | jsonb | ✓ | - |
| discipline_code | string | text | ✓ | - |
| isolation_metadata | unknown | jsonb | ✓ | - |
| project_id | integer | integer | ✓ | - |
| workspace_id | integer | integer | ✓ | - |
| workspace_type | string | text | ✓ | - |

---

## a_02500_security_vector

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 14

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| embedding | string | extensions.vector | ✓ | - |
| metadata | unknown | jsonb | ✓ | - |
| content | string | text | ✓ | - |
| created_by_user_id | integer | integer | ✓ | - |
| access_scope | string | character varying | ✓ | - |
| organisation_id | integer | integer | ✓ | - |
| shared_with_disciplines | string | text | ✓ | - |
| chunks | unknown | jsonb | ✓ | - |
| discipline_code | string | text | ✓ | - |
| isolation_metadata | unknown | jsonb | ✓ | - |
| project_id | integer | integer | ✓ | - |
| workspace_id | integer | integer | ✓ | - |
| workspace_type | string | text | ✓ | - |

---

## a_03000_landscaping_vector

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 14

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| embedding | string | extensions.vector | ✓ | - |
| metadata | unknown | jsonb | ✓ | - |
| content | string | text | ✓ | - |
| created_by_user_id | integer | integer | ✓ | - |
| access_scope | string | character varying | ✓ | - |
| organisation_id | integer | integer | ✓ | - |
| shared_with_disciplines | string | text | ✓ | - |
| chunks | unknown | jsonb | ✓ | - |
| discipline_code | string | text | ✓ | - |
| isolation_metadata | unknown | jsonb | ✓ | - |
| project_id | integer | integer | ✓ | - |
| workspace_id | integer | integer | ✓ | - |
| workspace_type | string | text | ✓ | - |

---

## a_performance_docs_vector

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 9

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| discipline_code | string | character varying | ✓ | - |
| document_type | string | character varying | ✓ | - |
| title | string | text | ✓ | - |
| content | string | text | ✓ | - |
| embedding | string | extensions.vector(1536) | ✓ | - |
| metadata | unknown | jsonb | ✓ | - |
| tags | array | text[] | ✓ | - |
| last_updated | string | timestamp with time zone | ✓ | - |

---

## accordion_options

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 5

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | integer | integer | ✗ | Note:
This is a Primary Key.<pk/> |
| name | string | character varying | ✗ | - |
| parent_id | integer | integer | ✓ | Note:
This is a Foreign Key to `accordion_options.id`.<fk table='accordion_options' column='id'/> |
| menu_level | integer | integer | ✗ | - |
| display_order | integer | integer | ✗ | - |

---

## accordion_sections

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 15

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| section_key | string | character varying | ✗ | - |
| title | string | character varying | ✗ | - |
| option_id | integer | integer | ✗ | - |
| sector | string | character varying | ✗ | - |
| parent_section_key | string | character varying | ✓ | - |
| display_order | integer | integer | ✗ | - |
| is_active | boolean | boolean | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |
| hierarchy_level | integer | integer | ✓ | - |
| is_virtual | boolean | boolean | ✓ | - |
| description | string | text | ✓ | - |
| icon_class | string | text | ✓ | - |
| organization_id | string | uuid | ✓ | Note:
This is a Foreign Key to `organizations.id`.<fk table='organizations' column='id'/> |

---

## accordion_sections_directors_backup_20250726

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 10

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✓ | - |
| section_key | string | character varying | ✓ | - |
| title | string | character varying | ✓ | - |
| option_id | integer | integer | ✓ | - |
| sector | string | character varying | ✓ | - |
| parent_section_key | string | character varying | ✓ | - |
| display_order | integer | integer | ✓ | - |
| is_active | boolean | boolean | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |

---

## accordion_structure

**Description:** Complete view of accordion structure using existing section_organization_mapping

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 19

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| section_id | string | uuid | ✓ | Note:
This is a Primary Key.<pk/> |
| section_key | string | character varying | ✓ | - |
| section_name | string | character varying | ✓ | - |
| section_description | string | text | ✓ | - |
| section_icon | string | character varying | ✓ | - |
| organization_id | string | uuid | ✓ | Note:
This is a Foreign Key to `organizations.id`.<fk table='organizations' column='id'/> |
| project_id | string | uuid | ✓ | - |
| phase_id | string | uuid | ✓ | - |
| section_display_order | integer | integer | ✓ | - |
| is_visible | boolean | boolean | ✓ | - |
| page_id | string | uuid | ✓ | Note:
This is a Primary Key.<pk/> |
| page_name | string | character varying | ✓ | - |
| page_slug | string | character varying | ✓ | - |
| page_display_order | integer | integer | ✓ | - |
| is_subsection | boolean | boolean | ✓ | - |
| parent_page_id | string | uuid | ✓ | Note:
This is a Foreign Key to `pages.page_id`.<fk table='pages' column='page_id'/> |
| organization_name | string | character varying | ✓ | - |
| project_name | string | character varying | ✓ | - |
| phase_name | string | character varying | ✓ | - |

---

## active_entities

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 9

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| user_id | string | uuid | ✓ | - |
| company_id | string | uuid | ✓ | Note:
This is a Foreign Key to `companies.id`.<fk table='companies' column='id'/> |
| organisation_id | string | uuid | ✓ | Note:
This is a Foreign Key to `organizations.id`.<fk table='organizations' column='id'/> |
| project_id | string | uuid | ✓ | Note:
This is a Foreign Key to `projects.id`.<fk table='projects' column='id'/> |
| project_phase_id | string | uuid | ✓ | Note:
This is a Foreign Key to `project_phases.id`.<fk table='project_phases' column='id'/> |
| created_at | string | timestamp with time zone | ✗ | - |
| updated_at | string | timestamp with time zone | ✗ | - |
| organization_id | string | uuid | ✓ | Note:
This is a Foreign Key to `organizations.id`.<fk table='organizations' column='id'/> |

---

## active_security_alerts

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 16

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✓ | Note:
This is a Primary Key.<pk/> |
| alert_type | string | text | ✓ | - |
| severity | string | text | ✓ | - |
| title | string | text | ✓ | - |
| description | string | text | ✓ | - |
| user_id | string | uuid | ✓ | - |
| api_config_id | string | uuid | ✓ | - |
| ip_address | string | inet | ✓ | - |
| user_agent | string | text | ✓ | - |
| metadata | unknown | jsonb | ✓ | - |
| acknowledged | boolean | boolean | ✓ | - |
| acknowledged_by | string | uuid | ✓ | - |
| acknowledged_at | string | timestamp with time zone | ✓ | - |
| resolved | boolean | boolean | ✓ | - |
| resolved_at | string | timestamp with time zone | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |

---

## active_templates

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 32

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✓ | Note:
This is a Primary Key.<pk/> |
| type | string | character varying | ✓ | - |
| name | string | character varying | ✓ | - |
| description | string | text | ✓ | - |
| version | string | character varying | ✓ | - |
| prompt_template | string | text | ✓ | - |
| validation_config | unknown | jsonb | ✓ | - |
| ui_config | unknown | jsonb | ✓ | - |
| is_active | boolean | boolean | ✓ | - |
| is_public | boolean | boolean | ✓ | - |
| created_by | string | uuid | ✓ | - |
| updated_by | string | uuid | ✓ | - |
| usage_count | integer | integer | ✓ | - |
| success_rate | number | numeric | ✓ | - |
| average_generation_time | integer | integer | ✓ | - |
| tags | array | text[] | ✓ | - |
| created_at | string | timestamp without time zone | ✓ | - |
| updated_at | string | timestamp without time zone | ✓ | - |
| discipline_code | string | character varying | ✓ | - |
| document_type | string | character varying | ✓ | - |
| discipline | string | character varying | ✓ | - |
| copied_from_template_id | string | uuid | ✓ | Note:
This is a Foreign Key to `templates.id`.<fk table='templates' column='id'/> |
| template_scope | string | character varying | ✓ | - |
| target_discipline | string | character varying | ✓ | - |
| copy_metadata | unknown | jsonb | ✓ | - |
| processing_status | string | text | ✓ | - |
| organization_id | string | uuid | ✓ | - |
| suitable_for_document_types | array | text[] | ✓ | - |
| category | string | character varying | ✓ | - |
| deleted_at | string | timestamp without time zone | ✓ | - |
| deleted_by | string | uuid | ✓ | - |
| deletion_reason | string | text | ✓ | - |

---

## active_users_travel_docs

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 12

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| user_id | string | uuid | ✓ | Note:
This is a Primary Key.<pk/> |
| email | string | text | ✓ | - |
| full_name | string | character varying | ✓ | - |
| passport_number | string | character varying | ✓ | - |
| passport_expiry_date | string | date | ✓ | - |
| passport_issuing_country | string | character varying | ✓ | - |
| alternative_travel_docs | unknown | jsonb | ✓ | - |
| nationality | string | character varying | ✓ | - |
| residence_country | string | character varying | ✓ | - |
| emergency_contact | unknown | jsonb | ✓ | - |
| active | boolean | boolean | ✓ | - |
| updated_at | string | timestamp without time zone | ✓ | - |

---

## agent_activity_log

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 14

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| agent_id | string | uuid | ✗ | - |
| human_user_id | string | uuid | ✓ | - |
| session_id | string | uuid | ✓ | Note:
This is a Foreign Key to `agent_sessions.id`.<fk table='agent_sessions' column='id'/> |
| action_type | string | text | ✗ | - |
| resource_type | string | text | ✗ | - |
| resource_id | string | uuid | ✓ | - |
| action_details | unknown | jsonb | ✓ | - |
| safety_metrics | unknown | jsonb | ✓ | - |
| ip_address | string | inet | ✓ | - |
| user_agent | string | text | ✓ | - |
| confidence_score | number | numeric | ✓ | - |
| processing_time_ms | integer | integer | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |

---

## agent_context_boundaries

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 7

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| agent_id | string | uuid | ✗ | - |
| boundary_type | string | text | ✗ | - |
| boundary_id | string | uuid | ✗ | - |
| access_level | string | text | ✓ | - |
| created_by | string | uuid | ✗ | - |
| created_at | string | timestamp with time zone | ✓ | - |

---

## agent_modal_assignments

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 7

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | integer | integer | ✗ | Note:
This is a Primary Key.<pk/> |
| modal_configuration_id | string | uuid | ✗ | Note:
This is a Foreign Key to `modal_configurations.id`.<fk table='modal_configurations' column='id'/> |
| page_id | string | uuid | ✗ | Note:
This is a Foreign Key to `pages.page_id`.<fk table='pages' column='page_id'/> |
| created_at | string | timestamp with time zone | ✗ | - |
| updated_at | string | timestamp with time zone | ✗ | - |
| last_used | string | timestamp with time zone | ✓ | - |
| agent_name | string | character varying | ✗ | - |

---

## agent_permissions

**Description:** Manages role-based access control for AI agents

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 8

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| agent_id | string | text | ✗ | Identifier for the AI agent |
| role_id | integer | integer | ✗ | Reference to role_definitions.id

Note:
This is a Foreign Key to `role_definitions.id`.<fk table='role_definitions' column='id'/> |
| has_access | boolean | boolean | ✗ | Whether the role has access to this agent |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |
| created_by | string | text | ✓ | - |
| updated_by | string | text | ✓ | - |

---

## agent_profiles

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 5

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| user_type | string | text | ✓ | - |
| agent_metadata | unknown | jsonb | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |

---

## agent_roles

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 9

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| role_name | string | text | ✗ | - |
| description | string | text | ✓ | - |
| capabilities | unknown | jsonb | ✓ | - |
| safety_restrictions | unknown | jsonb | ✓ | - |
| max_requests_per_hour | integer | integer | ✓ | - |
| context_isolation_level | string | text | ✓ | - |
| audit_level | string | text | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |

---

## agent_sequence_operations

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 17

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| organization_id | string | uuid | ✓ | Note:
This is a Foreign Key to `organizations.id`.<fk table='organizations' column='id'/> |
| agent_id | string | character varying | ✗ | - |
| agent_version | string | character varying | ✓ | - |
| operation | string | character varying | ✗ | - |
| resource_type | string | character varying | ✗ | - |
| resource_id | string | uuid | ✓ | - |
| disciplines | unknown | jsonb | ✓ | - |
| input_data | unknown | jsonb | ✓ | - |
| output_data | unknown | jsonb | ✓ | - |
| processing_time_ms | integer | integer | ✓ | - |
| confidence_score | number | numeric | ✓ | - |
| success | boolean | boolean | ✓ | - |
| error_message | string | text | ✓ | - |
| ip_address | string | inet | ✓ | - |
| user_agent | string | text | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |

---

## agent_sessions

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 8

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| agent_id | string | uuid | ✗ | - |
| human_user_id | string | uuid | ✓ | - |
| session_context | unknown | jsonb | ✓ | - |
| started_at | string | timestamp with time zone | ✓ | - |
| expires_at | string | timestamp with time zone | ✓ | - |
| is_active | boolean | boolean | ✓ | - |
| safety_metrics | unknown | jsonb | ✓ | - |

---

## agent_template_integrations

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 9

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| form_template_id | string | uuid | ✓ | - |
| agent_id | string | uuid | ✓ | Note:
This is a Foreign Key to `agents_tracking.id`.<fk table='agents_tracking' column='id'/> |
| integration_type | string | text | ✗ | - |
| trigger_fields | unknown | jsonb | ✓ | - |
| agent_actions | unknown | jsonb | ✓ | - |
| is_active | boolean | boolean | ✓ | - |
| priority | integer | integer | ✓ | - |
| error_handling | string | text | ✓ | - |

---

## agents_tracking

**Description:** Tracks AI agents by company, sector, organization, phase, and page assignments

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 17

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| agent_name | string | character varying | ✗ | Name of the AI agent |
| company | string | character varying | ✓ | Company the agent is assigned to |
| sector | string | character varying | ✓ | Sector the agent operates in |
| organization | string | character varying | ✓ | Organization within the company |
| phase | string | character varying | ✓ | Project phase the agent is active in |
| page_id | string | uuid | ✓ | Reference to the page the agent is associated with

Note:
This is a Foreign Key to `pages.page_id`.<fk table='pages' column='page_id'/> |
| page_name | string | character varying | ✓ | Name of the associated page |
| page_prefix | string | character varying | ✓ | Prefix of the associated page |
| contributor_id | string | uuid | ✓ | ID of the contributor responsible for this agent |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |
| is_active | boolean | boolean | ✓ | - |
| notes | string | text | ✓ | Additional notes about the agent |
| last_used | string | timestamp with time zone | ✓ | Timestamp when the agent was last used |
| organization_id | string | uuid | ✓ | - |
| user_id | string | uuid | ✓ | - |

---

## agents_unified

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 14

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✓ | Note:
This is a Primary Key.<pk/> |
| agent_name | string | character varying | ✓ | - |
| company | string | character varying | ✓ | - |
| sector | string | character varying | ✓ | - |
| organization | string | character varying | ✓ | - |
| phase | string | character varying | ✓ | - |
| page_name | string | character varying | ✓ | - |
| page_prefix | string | character varying | ✓ | - |
| is_active | boolean | boolean | ✓ | - |
| notes | string | text | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |
| last_used | string | timestamp with time zone | ✓ | - |
| modal_assignments | integer | bigint | ✓ | - |

---

## ai_training_data

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 16

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| discipline_code | string | character varying | ✗ | - |
| instruction | string | text | ✗ | - |
| input | string | text | ✓ | - |
| output | string | text | ✗ | - |
| quality_score | number | numeric | ✓ | - |
| training_status | string | character varying | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |
| created_by | string | uuid | ✓ | - |
| reviewed_by | string | uuid | ✓ | - |
| metadata | unknown | jsonb | ✓ | - |
| status | string | text | ✓ | - |
| processed_at | string | timestamp without time zone | ✓ | - |
| human_correction | string | text | ✓ | - |
| agent_output | string | text | ✓ | - |

---

## alert_configurations

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 9

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| alert_type | string | text | ✗ | - |
| threshold_value | number | numeric | ✗ | - |
| threshold_operator | string | text | ✗ | - |
| enabled | boolean | boolean | ✗ | - |
| notification_channels | array | text[] | ✓ | - |
| discipline_code | string | text | ✓ | - |
| created_by | string | uuid | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |

---

## api_health_checks

**Description:** Automated health monitoring results for API endpoints

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 10

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| api_config_id | string | uuid | ✗ | - |
| check_type | string | text | ✗ | - |
| status | string | text | ✗ | - |
| response_time | integer | integer | ✓ | - |
| status_code | integer | integer | ✓ | - |
| error_message | string | text | ✓ | - |
| metadata | unknown | jsonb | ✓ | - |
| checked_at | string | timestamp with time zone | ✗ | - |
| next_check_at | string | timestamp with time zone | ✓ | - |

---

## api_usage_metrics

**Description:** Detailed usage metrics and performance data for API configurations

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 16

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| api_config_id | string | uuid | ✗ | - |
| user_id | string | uuid | ✓ | - |
| discipline_code | string | text | ✓ | - |
| request_count | integer | integer | ✗ | - |
| success_count | integer | integer | ✗ | - |
| error_count | integer | integer | ✗ | - |
| average_response_time | integer | integer | ✓ | - |
| total_tokens_used | integer | integer | ✓ | - |
| cost_estimate | number | numeric | ✓ | - |
| rate_limit_hits | integer | integer | ✗ | - |
| last_request_at | string | timestamp with time zone | ✓ | - |
| period_start | string | timestamp with time zone | ✗ | - |
| period_end | string | timestamp with time zone | ✗ | - |
| metadata | unknown | jsonb | ✓ | - |
| created_at | string | timestamp with time zone | ✗ | - |

---

## api_usage_summary

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 7

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| api_config_id | string | uuid | ✓ | - |
| discipline_code | string | text | ✓ | - |
| total_requests | integer | bigint | ✓ | - |
| total_success | integer | bigint | ✓ | - |
| total_errors | integer | bigint | ✓ | - |
| avg_response_time | number | numeric | ✓ | - |
| last_request | string | timestamp with time zone | ✓ | - |

---

## approval_cover_sheets

**Description:** Generated approval cover sheets for procurement orders

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 8

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| procurement_order_id | string | uuid | ✗ | Reference to the procurement order

Note:
This is a Foreign Key to `procurement_orders.id`.<fk table='procurement_orders' column='id'/> |
| html_content | string | text | ✗ | Generated HTML content of the cover sheet |
| approval_matrix | unknown | jsonb | ✓ | JSON array of required approvers and their roles |
| generated_at | string | timestamp with time zone | ✓ | - |
| status | string | character varying | ✓ | Status of the cover sheet (generated, sent, approved, etc.) |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |

---

## approval_delegations

**Description:** Approval delegation management for when users are unavailable

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 11

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| delegator_user_id | string | uuid | ✓ | - |
| delegate_user_id | string | uuid | ✓ | - |
| role_filter | string | character varying | ✓ | - |
| department_filter | string | character varying | ✓ | - |
| start_date | string | timestamp with time zone | ✓ | - |
| end_date | string | timestamp with time zone | ✓ | - |
| is_active | boolean | boolean | ✓ | - |
| reason | string | text | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |

---

## approval_document_links

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 7

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| approval_instance_id | string | uuid | ✗ | Note:
This is a Foreign Key to `governance_approval_instances.id`.<fk table='governance_approval_instances' column='id'/> |
| document_id | string | uuid | ✓ | - |
| document_source | string | text | ✓ | - |
| version_number | string | text | ✓ | - |
| file_path | string | text | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |

---

## approval_history_log

**Description:** Complete audit trail of all approval actions

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 12

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| approval_instance_id | string | uuid | ✓ | Note:
This is a Foreign Key to `approval_instances.id`.<fk table='approval_instances' column='id'/> |
| approval_step_id | string | uuid | ✓ | Note:
This is a Foreign Key to `approval_steps.id`.<fk table='approval_steps' column='id'/> |
| action | string | character varying | ✗ | - |
| actor_user_id | string | uuid | ✓ | - |
| target_user_id | string | uuid | ✓ | - |
| old_values | unknown | jsonb | ✓ | - |
| new_values | unknown | jsonb | ✓ | - |
| comments | string | text | ✓ | - |
| ip_address | string | inet | ✓ | - |
| user_agent | string | text | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |

---

## approval_instances

**Description:** Individual approval instances for specific documents

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 18

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| workflow_template_id | string | uuid | ✓ | Note:
This is a Foreign Key to `approval_workflow_templates.id`.<fk table='approval_workflow_templates' column='id'/> |
| document_id | string | uuid | ✓ | - |
| document_type | string | character varying | ✗ | - |
| document_reference | string | character varying | ✗ | - |
| document_title | string | character varying | ✓ | - |
| current_step | integer | integer | ✓ | - |
| total_steps | integer | integer | ✓ | - |
| status | string | character varying | ✓ | - |
| priority | string | character varying | ✓ | - |
| initiated_by | string | uuid | ✗ | - |
| initiated_at | string | timestamp with time zone | ✓ | - |
| due_date | string | timestamp with time zone | ✓ | - |
| completed_at | string | timestamp with time zone | ✓ | - |
| metadata | unknown | jsonb | ✓ | JSONB containing document-specific data used for routing decisions |
| notes | string | text | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |

---

## approval_steps

**Description:** Individual approval steps within an approval workflow

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 19

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| approval_instance_id | string | uuid | ✓ | Note:
This is a Foreign Key to `approval_instances.id`.<fk table='approval_instances' column='id'/> |
| step_order | integer | integer | ✗ | - |
| step_name | string | character varying | ✓ | - |
| approver_role | string | character varying | ✗ | - |
| approver_user_id | string | uuid | ✓ | - |
| assigned_at | string | timestamp with time zone | ✓ | - |
| status | string | character varying | ✓ | - |
| decision_date | string | timestamp with time zone | ✓ | - |
| comments | string | text | ✓ | - |
| rejection_reason | string | text | ✓ | - |
| esignature_data | unknown | jsonb | ✓ | JSONB containing encrypted e-signature metadata |
| escalation_date | string | timestamp with time zone | ✓ | - |
| escalated_at | string | timestamp with time zone | ✓ | - |
| escalated_to | string | uuid | ✓ | - |
| is_required | boolean | boolean | ✓ | - |
| is_parallel | boolean | boolean | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |

---

## approval_workflow_templates

**Description:** Governance-managed approval workflow templates for different document types

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 13

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| name | string | character varying | ✗ | - |
| department | string | character varying | ✗ | - |
| document_type | string | character varying | ✗ | - |
| approval_matrix | unknown | jsonb | ✗ | JSONB containing the complete approval routing rules |
| conditions | unknown | jsonb | ✓ | JSONB containing conditional routing logic (amount thresholds, etc.) |
| requires_esignature | boolean | boolean | ✓ | - |
| escalation_hours | integer | integer | ✓ | - |
| is_active | boolean | boolean | ✓ | - |
| created_by | string | uuid | ✓ | - |
| updated_by | string | uuid | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |

---

## approval_workflows

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 11

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| name | string | character varying | ✗ | - |
| department | string | character varying | ✓ | - |
| role | string | character varying | ✓ | - |
| approvers | unknown | jsonb | ✓ | - |
| escalation_rules | unknown | jsonb | ✓ | - |
| is_active | boolean | boolean | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |
| organization_id | string | uuid | ✓ | - |
| user_id | string | uuid | ✓ | - |

---

## audit_log

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 7

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | integer | integer | ✗ | Note:
This is a Primary Key.<pk/> |
| action | string | text | ✗ | - |
| table_name | string | text | ✓ | - |
| user_id | string | text | ✓ | - |
| record_id | string | text | ✓ | - |
| details | unknown | jsonb | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |

---

## available_companies

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 2

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| company_name | string | character varying | ✓ | - |
| source | string | text | ✓ | - |

---

## button_options

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 8

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | integer | integer | ✗ | Note:
This is a Primary Key.<pk/> |
| name | string | character varying | ✗ | - |
| button_id | string | character varying | ✗ | - |
| page_id | string | character varying | ✗ | - |
| display_order | integer | integer | ✗ | - |
| is_active | boolean | boolean | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |

---

## chat_analytics

**Description:** Analytics data for IT dashboard and usage monitoring

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 30

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| session_id | string | uuid | ✓ | Note:
This is a Foreign Key to `chat_sessions.id`.<fk table='chat_sessions' column='id'/> |
| user_id | string | uuid | ✓ | - |
| discipline_code | string | character varying | ✗ | - |
| chatbot_type | string | character varying | ✗ | - |
| company_id | string | uuid | ✓ | - |
| company_name | string | character varying | ✓ | - |
| organisation_id | string | uuid | ✓ | - |
| organisation_name | string | character varying | ✓ | - |
| project_id | string | uuid | ✓ | - |
| project_name | string | character varying | ✓ | - |
| project_phase_id | string | uuid | ✓ | - |
| project_phase_name | string | character varying | ✓ | - |
| query_type | string | character varying | ✓ | - |
| query_category | string | character varying | ✓ | - |
| response_quality_score | number | numeric | ✓ | - |
| user_satisfaction_rating | integer | integer | ✓ | - |
| response_time_ms | integer | integer | ✓ | - |
| documents_found | integer | integer | ✓ | - |
| documents_relevant | integer | integer | ✓ | - |
| session_duration_minutes | integer | integer | ✓ | - |
| messages_in_session | integer | integer | ✓ | - |
| time_of_day | integer | integer | ✓ | - |
| day_of_week | integer | integer | ✓ | - |
| user_feedback | string | text | ✓ | - |
| improvement_suggestions | string | text | ✓ | - |
| error_occurred | boolean | boolean | ✓ | - |
| error_type | string | character varying | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| metadata | unknown | jsonb | ✓ | - |

---

## chat_messages

**Description:** Stores individual chat messages with AI processing metadata

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 18

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| session_id | string | uuid | ✓ | Note:
This is a Foreign Key to `chat_sessions.id`.<fk table='chat_sessions' column='id'/> |
| role | string | character varying | ✗ | - |
| content | string | text | ✗ | - |
| citations | unknown | jsonb | ✓ | - |
| document_count | integer | integer | ✓ | - |
| documents_accessed | unknown | jsonb | ✓ | - |
| ai_model_used | string | character varying | ✓ | - |
| processing_time_ms | integer | integer | ✓ | - |
| token_count | integer | integer | ✓ | - |
| search_query | string | text | ✓ | - |
| search_results_count | integer | integer | ✓ | - |
| vector_similarity_scores | unknown | jsonb | ✓ | - |
| user_rating | integer | integer | ✓ | - |
| user_feedback | string | text | ✓ | - |
| was_helpful | boolean | boolean | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| metadata | unknown | jsonb | ✓ | - |

---

## chat_sessions

**Description:** Stores chat sessions with full project context from active_entities

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 25

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| user_id | string | uuid | ✓ | - |
| discipline_code | string | character varying | ✗ | - |
| chatbot_type | string | character varying | ✗ | - |
| company_id | string | uuid | ✓ | Note:
This is a Foreign Key to `companies.id`.<fk table='companies' column='id'/> |
| company_name | string | character varying | ✓ | Denormalized company name for performance |
| organisation_id | string | uuid | ✓ | Note:
This is a Foreign Key to `organizations.id`.<fk table='organizations' column='id'/> |
| organisation_name | string | character varying | ✓ | Denormalized organisation name for performance |
| project_id | string | uuid | ✓ | Note:
This is a Foreign Key to `projects.id`.<fk table='projects' column='id'/> |
| project_name | string | character varying | ✓ | Denormalized project name for performance |
| project_phase_id | string | uuid | ✓ | Note:
This is a Foreign Key to `project_phases.id`.<fk table='project_phases' column='id'/> |
| project_phase_name | string | character varying | ✓ | Denormalized project phase name for performance |
| session_title | string | character varying | ✓ | - |
| session_summary | string | text | ✓ | - |
| total_messages | integer | integer | ✓ | - |
| total_documents_referenced | integer | integer | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |
| last_activity_at | string | timestamp with time zone | ✓ | - |
| is_active | boolean | boolean | ✓ | - |
| is_archived | boolean | boolean | ✓ | - |
| metadata | unknown | jsonb | ✓ | - |
| avg_response_time_ms | integer | integer | ✓ | - |
| total_processing_time_ms | integer | bigint | ✓ | - |
| session_id | string | text | ✗ | Text-based session identifier for API compatibility |

---

## chatbot_audit_logs

**Description:** Comprehensive audit trail for all chatbot and API access activities

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 13

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| user_id | string | uuid | ✓ | - |
| user_email | string | text | ✓ | - |
| action | string | text | ✗ | - |
| resource_type | string | text | ✗ | - |
| resource_id | string | text | ✓ | - |
| discipline_code | string | text | ✓ | - |
| ip_address | string | inet | ✓ | - |
| user_agent | string | text | ✓ | - |
| success | boolean | boolean | ✗ | - |
| error_message | string | text | ✓ | - |
| metadata | unknown | jsonb | ✓ | - |
| created_at | string | timestamp with time zone | ✗ | - |

---

## chatbot_interactions

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 8

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| interaction_id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| session_id | string | uuid | ✗ | Note:
This is a Foreign Key to `chatbot_sessions.session_id`.<fk table='chatbot_sessions' column='session_id'/> |
| user_id | string | uuid | ✗ | - |
| page_id | string | character varying | ✗ | - |
| interaction_type | string | character varying | ✗ | - |
| content | string | text | ✗ | - |
| metadata | unknown | jsonb | ✓ | - |
| created_at | string | timestamp with time zone | ✗ | - |

---

## chatbot_messages

**Description:** Stores chatbot messages for workflow progress notifications

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 10

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| user_id | string | uuid | ✗ | - |
| order_id | string | uuid | ✓ | - |
| message | string | text | ✗ | - |
| message_type | string | character varying | ✓ | - |
| metadata | unknown | jsonb | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| read_at | string | timestamp with time zone | ✓ | - |
| organization_id | string | uuid | ✓ | - |
| session_id | string | uuid | ✓ | - |

---

## chatbot_pages

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 10

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| page_id | string | text | ✗ | - |
| page_name | string | text | ✗ | - |
| category | string | text | ✗ | - |
| chatbot_type | string | text | ✗ | - |
| has_chatbot | boolean | boolean | ✗ | - |
| vector_table_name | string | text | ✓ | - |
| description | string | text | ✓ | - |
| created_at | string | timestamp with time zone | ✗ | - |
| updated_at | string | timestamp with time zone | ✗ | - |

---

## chatbot_performance_metrics

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 8

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| metric_id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| page_id | string | character varying | ✗ | - |
| user_id | string | uuid | ✓ | - |
| session_id | string | uuid | ✓ | Note:
This is a Foreign Key to `chatbot_sessions.session_id`.<fk table='chatbot_sessions' column='session_id'/> |
| metric_type | string | character varying | ✗ | - |
| metric_value | number | numeric | ✓ | - |
| metadata | unknown | jsonb | ✓ | - |
| recorded_at | string | timestamp with time zone | ✗ | - |

---

## chatbot_performance_summary

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 7

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| page_id | string | character varying | ✓ | - |
| metric_type | string | character varying | ✓ | - |
| metric_count | integer | bigint | ✓ | - |
| avg_value | number | numeric | ✓ | - |
| min_value | number | numeric | ✓ | - |
| max_value | number | numeric | ✓ | - |
| hour_recorded | string | timestamp with time zone | ✓ | - |

---

## chatbot_permissions

**Description:** Fine-grained permissions for chatbot access by page and role

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 10

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| page_id | string | text | ✗ | - |
| role_id | integer | integer | ✗ | - |
| has_access | boolean | boolean | ✗ | - |
| granted_by | string | uuid | ✓ | - |
| granted_at | string | timestamp with time zone | ✗ | - |
| expires_at | string | timestamp with time zone | ✓ | - |
| metadata | unknown | jsonb | ✓ | - |
| created_at | string | timestamp with time zone | ✗ | - |
| updated_at | string | timestamp with time zone | ✗ | - |

---

## chatbot_sessions

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 11

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| session_id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| user_id | string | uuid | ✗ | - |
| page_id | string | character varying | ✗ | - |
| discipline_code | string | character varying | ✗ | - |
| chat_type | string | character varying | ✗ | - |
| current_state | string | character varying | ✓ | - |
| session_data | unknown | jsonb | ✓ | - |
| started_at | string | timestamp with time zone | ✗ | - |
| ended_at | string | timestamp with time zone | ✓ | - |
| total_interactions | integer | integer | ✓ | - |
| last_activity_at | string | timestamp with time zone | ✓ | - |

---

## chatbot_usage_analytics

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 8

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| page_id | string | character varying | ✓ | - |
| total_sessions | integer | bigint | ✓ | - |
| unique_users | integer | bigint | ✓ | - |
| total_interactions | integer | bigint | ✓ | - |
| avg_session_minutes | number | numeric | ✓ | - |
| chat_type | string | character varying | ✓ | - |
| discipline_code | string | character varying | ✓ | - |
| session_date | string | timestamp with time zone | ✓ | - |

---

## chatbot_vector_configs

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 9

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| config_id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| page_id | string | character varying | ✗ | - |
| vector_table_name | string | character varying | ✗ | - |
| search_enabled | boolean | boolean | ✓ | - |
| search_threshold | number | numeric | ✓ | - |
| max_results | integer | integer | ✓ | - |
| filters | unknown | jsonb | ✓ | - |
| created_at | string | timestamp with time zone | ✗ | - |
| updated_at | string | timestamp with time zone | ✗ | - |

---

## chatbots

**Description:** Stores configurations for chatbots, mapping pages and states to Flowise flow IDs.

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 7

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| page | string | character varying | ✗ | Note:
This is a Primary Key.<pk/> |
| state | string | character varying | ✗ | Note:
This is a Primary Key.<pk/> |
| flow_id | string | character varying | ✗ | - |
| input_placeholder | string | text | ✓ | Optional placeholder text for the chat input field. |
| sector | string | text | ✓ | - |
| sector_id | string | uuid | ✓ | Note:
This is a Foreign Key to `sectors.sector_id`.<fk table='sectors' column='sector_id'/> |
| updated_at | string | date | ✓ | - |

---

## chatbots_backup

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 7

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| page | string | character varying | ✓ | - |
| state | string | character varying | ✓ | - |
| flow_id | string | character varying | ✓ | - |
| input_placeholder | string | text | ✓ | - |
| sector | string | text | ✓ | - |
| sector_id | string | uuid | ✓ | - |
| updated_at | string | date | ✓ | - |

---

## civil_engineering_document_links

**Description:** Junction table for linking civil engineering documents to other documents and references

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 11

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| document_id | string | uuid | ✗ | Note:
This is a Foreign Key to `civil_engineering_documents.id`.<fk table='civil_engineering_documents' column='id'/> |
| linked_document_id | string | uuid | ✓ | - |
| linked_document_type | string | character varying | ✓ | - |
| reference_type | string | character varying | ✓ | Type of relationship: reference, supersedes, related, supporting |
| link_description | string | text | ✓ | - |
| link_created_by | string | uuid | ✓ | - |
| link_created_at | string | timestamp with time zone | ✓ | - |
| project_phase | string | character varying | ✓ | - |
| document_section | string | character varying | ✓ | - |
| organization_id | string | uuid | ✓ | Note:
This is a Foreign Key to `organizations.id`.<fk table='organizations' column='id'/> |

---

## civil_engineering_documents

**Description:** Dedicated table for civil engineering technical documents (adapted from procurement orders workflow)

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 26

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| document_number | string | character varying | ✓ | Auto-generated unique document number (SP-2025-001, CA-2025-001, DR-2025-001, etc.) |
| document_type | string | character varying | ✗ | Type of engineering document: specifications, calculations, drawings, reports, technical_notes, method_statements |
| title | string | character varying | ✗ | - |
| description | string | text | ✓ | - |
| discipline | string | character varying | ✓ | Engineering discipline: civil, structural, geotechnical, transportation, etc. |
| priority | string | character varying | ✓ | - |
| engineering_standard | string | character varying | ✓ | Applicable engineering standard (BS, SANS, Eurocode, etc.) |
| design_code | string | character varying | ✓ | Specific design code reference |
| project_phase | string | character varying | ✓ | Current project phase for document filtering and suggestions |
| project_id | string | uuid | ✓ | Reference to projects table for project context awareness

Note:
This is a Foreign Key to `projects.id`.<fk table='projects' column='id'/> |
| project_location | string | character varying | ✓ | - |
| project_scale | string | character varying | ✓ | - |
| template_id | string | uuid | ✓ | Note:
This is a Foreign Key to `master_engineering_templates.id`.<fk table='master_engineering_templates' column='id'/> |
| linked_documents | unknown | jsonb | ✓ | JSON array of linked documents with metadata for document integration feature |
| approval_status | string | character varying | ✓ | - |
| issue_date | string | date | ✓ | - |
| revision_date | string | date | ✓ | - |
| review_deadline | string | date | ✓ | - |
| technical_requirements | string | text | ✓ | - |
| compliance_requirements | string | text | ✓ | - |
| quality_standards | string | text | ✓ | - |
| created_by | string | uuid | ✗ | - |
| organization_id | string | uuid | ✓ | Note:
This is a Foreign Key to `organizations.id`.<fk table='organizations' column='id'/> |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |

---

## companies

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 7

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| name | string | character varying | ✗ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |
| active | boolean | boolean | ✓ | - |
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| organization_id | string | uuid | ✓ | - |
| user_id | string | uuid | ✓ | - |

---

## complete_epcm_accordion

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 11

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| section_key | string | character varying | ✓ | - |
| title | string | character varying | ✓ | - |
| option_id | integer | integer | ✓ | - |
| sector | string | character varying | ✓ | - |
| parent_section_key | string | character varying | ✓ | - |
| display_order | integer | integer | ✓ | - |
| organization_id | string | uuid | ✓ | Note:
This is a Foreign Key to `organizations.id`.<fk table='organizations' column='id'/> |
| is_visible | boolean | boolean | ✓ | - |
| organization_name | string | character varying | ✓ | - |
| section_type | string | text | ✓ | - |
| page_number | integer | integer | ✓ | - |

---

## compliance_checks

**Description:** Compliance monitoring results for various regulatory frameworks

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 12

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| check_type | string | text | ✗ | - |
| resource_type | string | text | ✗ | - |
| resource_id | string | text | ✓ | - |
| status | string | text | ✗ | - |
| check_result | unknown | jsonb | ✗ | - |
| checked_by | string | uuid | ✓ | - |
| checked_at | string | timestamp with time zone | ✗ | - |
| next_check_at | string | timestamp with time zone | ✓ | - |
| remediation_required | boolean | boolean | ✗ | - |
| remediation_notes | string | text | ✓ | - |
| metadata | unknown | jsonb | ✓ | - |

---

## compliance_reports

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 19

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | integer | integer | ✗ | Note:
This is a Primary Key.<pk/> |
| report_id | string | character varying | ✗ | - |
| project_id | string | character varying | ✗ | - |
| inspection_id | string | character varying | ✓ | - |
| report_period | string | character varying | ✓ | - |
| compliance_rate | number | numeric | ✓ | - |
| inspections_completed | integer | integer | ✓ | - |
| total_inspections | integer | integer | ✓ | - |
| defects_found | integer | integer | ✓ | - |
| critical_findings | integer | integer | ✓ | - |
| recommendations | unknown | jsonb | ✓ | - |
| regulations | unknown | jsonb | ✓ | - |
| status | string | character varying | ✓ | - |
| generated_at | string | timestamp without time zone | ✓ | - |
| created_by | string | character varying | ✓ | - |
| created_at | string | timestamp without time zone | ✓ | - |
| updated_at | string | timestamp without time zone | ✓ | - |
| organization_id | string | uuid | ✓ | - |
| user_id | string | uuid | ✓ | - |

---

## consolidated_documents

**Description:** Unified view of document embeddings with store and processing information

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 21

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| embedding_id | integer | bigint | ✓ | Note:
This is a Primary Key.<pk/> |
| source | string | text | ✓ | - |
| content | string | text | ✓ | - |
| metadata | unknown | jsonb | ✓ | - |
| discipline_code | string | text | ✓ | - |
| embedding_created_at | string | timestamp with time zone | ✓ | - |
| document_store_uuid | string | uuid | ✓ | Note:
This is a Primary Key.<pk/> |
| document_store_name | string | text | ✓ | - |
| document_store_description | string | text | ✓ | - |
| security_level | string | character varying | ✓ | - |
| access_roles | unknown | jsonb | ✓ | - |
| flowise_document_id | string | uuid | ✓ | Note:
This is a Primary Key.<pk/> |
| document_name | string | text | ✓ | - |
| original_filename | string | text | ✓ | - |
| file_size | integer | bigint | ✓ | - |
| mime_type | string | text | ✓ | - |
| total_chunks | integer | integer | ✓ | - |
| total_characters | integer | integer | ✓ | - |
| processing_status | string | text | ✓ | - |
| uploaded_at | string | timestamp with time zone | ✓ | - |
| processed_at | string | timestamp with time zone | ✓ | - |

---

## consultants

**Description:** Consultants table with procurement entity fields for approval workflow

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 19

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | integer | integer | ✗ | Note:
This is a Primary Key.<pk/> |
| name | string | character varying | ✗ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |
| address | string | text | ✓ | - |
| email | string | text | ✓ | - |
| phone | string | text | ✓ | - |
| contact_person | string | text | ✓ | - |
| project_id | string | uuid | ✓ | Note:
This is a Foreign Key to `projects.id`.<fk table='projects' column='id'/> |
| consultant_type | string | text | ✓ | Type of consultant (e.g., engineering, architectural, legal) |
| organization_id | string | uuid | ✓ | Note:
This is a Foreign Key to `organizations.id`.<fk table='organizations' column='id'/> |
| services_offered | string | text | ✓ | - |
| license_number | string | text | ✓ | - |
| insurance_status | string | text | ✓ | - |
| registration_date | string | date | ✓ | - |
| approval_status | string | text | ✓ | - |
| compliance_status | string | text | ✓ | - |
| last_activity | string | timestamp with time zone | ✓ | - |
| scraped_at | string | timestamp with time zone | ✓ | - |

---

## contacts

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 17

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| contact_id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| users_name | string | character varying | ✓ | - |
| email | string | character varying | ✓ | - |
| first_name | string | character varying | ✓ | - |
| last_name | string | character varying | ✓ | - |
| phone_number | string | character varying | ✓ | - |
| company | string | character varying | ✓ | - |
| job_title | string | character varying | ✓ | - |
| address | string | character varying | ✓ | - |
| city | string | character varying | ✓ | - |
| province | string | character varying | ✓ | - |
| postal_code | string | character varying | ✓ | - |
| country | string | character varying | ✓ | - |
| created_at | string | timestamp without time zone | ✓ | - |
| updated_at | string | timestamp without time zone | ✓ | - |
| notes | string | text | ✓ | - |
| organization_id | string | uuid | ✓ | Note:
This is a Foreign Key to `organizations.id`.<fk table='organizations' column='id'/> |

---

## containers

**Description:** Stores container information and tracking data

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 38

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| container_number | string | character varying | ✗ | - |
| container_type | string | character varying | ✓ | - |
| container_size | string | character varying | ✓ | - |
| iso_code | string | character varying | ✓ | - |
| tare_weight | number | numeric | ✓ | - |
| max_payload | number | numeric | ✓ | - |
| current_status | string | character varying | ✓ | - |
| current_location | string | character varying | ✓ | - |
| current_latitude | number | numeric | ✓ | - |
| current_longitude | number | numeric | ✓ | - |
| vessel_id | string | uuid | ✓ | Note:
This is a Foreign Key to `vessels.id`.<fk table='vessels' column='id'/> |
| vessel_name | string | character varying | ✓ | - |
| cargo_description | string | text | ✓ | - |
| cargo_weight | number | numeric | ✓ | - |
| cargo_value | number | numeric | ✓ | - |
| cargo_currency | string | character varying | ✓ | - |
| booking_reference | string | character varying | ✓ | - |
| bill_of_lading | string | character varying | ✓ | - |
| shipper_name | string | character varying | ✓ | - |
| consignee_name | string | character varying | ✓ | - |
| notify_party | string | character varying | ✓ | - |
| port_of_loading | string | character varying | ✓ | - |
| port_of_discharge | string | character varying | ✓ | - |
| final_destination | string | character varying | ✓ | - |
| estimated_arrival | string | timestamp with time zone | ✓ | - |
| actual_arrival | string | timestamp with time zone | ✓ | - |
| container_tracking_id | string | character varying | ✓ | - |
| last_tracking_update | string | timestamp with time zone | ✓ | - |
| api_data | unknown | jsonb | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |
| created_by | string | uuid | ✓ | - |
| is_active | boolean | boolean | ✓ | - |
| company_id | string | uuid | ✓ | - |
| organisation_id | string | uuid | ✓ | - |
| project_id | string | uuid | ✓ | - |
| organization_id | string | uuid | ✓ | - |

---

## continual_learning_data

**Description:** Stores HITL corrections for continual learning pipeline

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 14

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| instruction | string | text | ✗ | The original user instruction/query |
| agent_output | string | text | ✓ | The AI agent response that was corrected |
| human_correction | string | text | ✓ | The corrected response from human feedback |
| quality_score | number | double precision | ✓ | Quality score of the correction (0-1) |
| status | string | text | ✓ | Processing status: pending, processing, completed, failed |
| project_id | string | uuid | ✓ | - |
| discipline | string | text | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| processed_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |
| training_session_id | string | uuid | ✓ | Links to specific training session |
| model_version | string | text | ✓ | Model version this data was used to train |
| error_message | string | text | ✓ | - |

---

## contractor_evaluation_results

**Description:** Evaluation results for contractor vetting display

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 16

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | integer | integer | ✗ | Note:
This is a Primary Key.<pk/> |
| vetting_id | integer | integer | ✓ | Reference to vetting record

Note:
This is a Foreign Key to `contractor_vetting.id`.<fk table='contractor_vetting' column='id'/> |
| document_id | integer | integer | ✓ | Reference to specific document

Note:
This is a Foreign Key to `contractor_vetting_documents.id`.<fk table='contractor_vetting_documents' column='id'/> |
| contractor_name | string | character varying | ✓ | Name of the contractor |
| document_type | string | character varying | ✓ | Type of document evaluated |
| document_path | string | text | ✓ | Path to the evaluated document |
| processing_status | string | character varying | ✓ | Status of the evaluation process |
| score | integer | integer | ✓ | Evaluation score (0-100) |
| confidence | integer | integer | ✓ | Confidence level in the evaluation (0-100) |
| commentary | string | text | ✓ | Detailed commentary on the evaluation |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |
| questions | unknown | jsonb | ✓ | - |
| answers | unknown | jsonb | ✓ | - |
| document_name | string | text | ✓ | - |
| form_submission_data | unknown | jsonb | ✓ | - |

---

## contractor_evaluations

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 10

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| contractor_name | string | text | ✗ | - |
| document_name | string | text | ✓ | - |
| evaluation_type | string | text | ✗ | - |
| answers | unknown | jsonb | ✓ | - |
| score | integer | integer | ✓ | - |
| confidence | integer | integer | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |
| organization_id | string | uuid | ✓ | Note:
This is a Foreign Key to `organizations.id`.<fk table='organizations' column='id'/> |

---

## contractor_vetting

**Description:** Main table for contractor vetting information and status tracking

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 13

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | integer | integer | ✗ | Note:
This is a Primary Key.<pk/> |
| contractor_id | integer | integer | ✓ | Reference to the main contractors table |
| company_name | string | character varying | ✗ | - |
| contact_person | string | character varying | ✓ | - |
| phone | string | character varying | ✓ | - |
| email | string | character varying | ✓ | - |
| business_address | string | text | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |
| vetting_status | string | text | ✓ | Current vetting status of the contractor |
| overall_score | integer | integer | ✓ | Overall vetting score (0-100) |
| notes | string | text | ✓ | General notes about the vetting process |
| organization_id | string | uuid | ✓ | Note:
This is a Foreign Key to `organizations.id`.<fk table='organizations' column='id'/> |

---

## contractor_vetting_chat_messages

**Description:** Chat messages for contractor vetting assistance

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 8

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | integer | integer | ✗ | Note:
This is a Primary Key.<pk/> |
| vetting_id | integer | integer | ✓ | Reference to vetting record

Note:
This is a Foreign Key to `contractor_vetting.id`.<fk table='contractor_vetting' column='id'/> |
| message_type | string | character varying | ✓ | Type of message |
| sender | string | character varying | ✓ | Name of the message sender |
| message_text | string | text | ✗ | Content of the message |
| timestamp | string | timestamp with time zone | ✓ | - |
| session_id | string | character varying | ✓ | Session identifier |
| organization_id | string | uuid | ✓ | Note:
This is a Foreign Key to `organizations.id`.<fk table='organizations' column='id'/> |

---

## contractor_vetting_dashboard_stats

**Description:** Dashboard statistics for contractor vetting

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 9

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | integer | integer | ✗ | Note:
This is a Primary Key.<pk/> |
| stat_date | string | date | ✓ | Date for which statistics are recorded |
| total_contractors | integer | integer | ✓ | Total number of contractors in system |
| average_score | integer | integer | ✓ | Average vetting score |
| high_scores_count | integer | integer | ✓ | Count of contractors with high scores (85+) |
| pending_reviews_count | integer | integer | ✓ | Count of pending reviews |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |
| organization_id | string | uuid | ✓ | Note:
This is a Foreign Key to `organizations.id`.<fk table='organizations' column='id'/> |

---

## contractor_vetting_document_hashes

**Description:** Document hashes for deduplication and incremental ingestion per 1300_00220

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 13

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| document_id | string | uuid | ✓ | Reference to main document

Note:
This is a Foreign Key to `a_02400_contractor_vetting_documents.id`.<fk table='a_02400_contractor_vetting_documents' column='id'/> |
| version | string | text | ✗ | Document version for hash uniqueness |
| document_hash | string | text | ✗ | SHA-256 hash of entire document for deduplication |
| content_hash | string | text | ✗ | SHA-256 hash of content for incremental ingestion |
| chunk_id | string | text | ✓ | Chunk identifier for vector store deduplication |
| file_size | integer | bigint | ✓ | - |
| mime_type | string | text | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |
| source_path | string | text | ✓ | Original file path for tracking |
| department_id | string | uuid | ✓ | Note:
This is a Foreign Key to `organizations.id`.<fk table='organizations' column='id'/> |
| organization_id | string | uuid | ✓ | Note:
This is a Foreign Key to `organizations.id`.<fk table='organizations' column='id'/> |

---

## contractor_vetting_document_parts

**Description:** Document parts for discrete additions per 1300_00220

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 15

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| document_id | string | uuid | ✓ | Reference to main document

Note:
This is a Foreign Key to `a_02400_contractor_vetting_documents.id`.<fk table='a_02400_contractor_vetting_documents' column='id'/> |
| part_number | string | text | ✗ | Part identifier |
| part_title | string | text | ✓ | - |
| content_hash | string | text | ✗ | Hash of this specific part |
| part_content | string | text | ✓ | Extracted content for this part |
| start_page | integer | integer | ✓ | - |
| end_page | integer | integer | ✓ | - |
| word_count | integer | integer | ✓ | - |
| character_count | integer | integer | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |
| version | string | text | ✓ | - |
| parent_part_id | string | uuid | ✓ | Parent part for hierarchical structure

Note:
This is a Foreign Key to `contractor_vetting_document_parts.id`.<fk table='contractor_vetting_document_parts' column='id'/> |
| organization_id | string | uuid | ✓ | Note:
This is a Foreign Key to `organizations.id`.<fk table='organizations' column='id'/> |

---

## contractor_vetting_documents

**Description:** Uploaded documents for contractor vetting

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 14

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | integer | integer | ✗ | Note:
This is a Primary Key.<pk/> |
| vetting_id | integer | integer | ✓ | Reference to the vetting record

Note:
This is a Foreign Key to `contractor_vetting.id`.<fk table='contractor_vetting' column='id'/> |
| section_id | integer | integer | ✓ | Reference to the specific section this document belongs to

Note:
This is a Foreign Key to `contractor_vetting_sections.id`.<fk table='contractor_vetting_sections' column='id'/> |
| file_name | string | character varying | ✗ | Stored file name |
| original_file_name | string | character varying | ✓ | Original uploaded file name |
| file_path | string | text | ✓ | Path to the stored file |
| file_size | integer | bigint | ✓ | File size in bytes |
| mime_type | string | character varying | ✓ | MIME type of the file |
| upload_timestamp | string | timestamp with time zone | ✓ | - |
| document_type | string | character varying | ✓ | Type of document (financial, license, etc.) |
| processing_status | string | text | ✓ | Status of document processing |
| processing_result | string | text | ✓ | Results from document processing |
| extracted_data | unknown | jsonb | ✓ | JSON data extracted from the document |
| organization_id | string | uuid | ✓ | Note:
This is a Foreign Key to `organizations.id`.<fk table='organizations' column='id'/> |

---

## contractor_vetting_ingestion_registry

**Description:** Registry for tracking document ingestion status per 1300_00220

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 11

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| document_hash | string | text | ✗ | Document hash for deduplication |
| content_hash | string | text | ✗ | Content hash for incremental processing |
| ingestion_status | string | text | ✓ | Current ingestion status |
| ingestion_timestamp | string | timestamp with time zone | ✓ | - |
| completion_timestamp | string | timestamp with time zone | ✓ | - |
| error_message | string | text | ✓ | - |
| retry_count | integer | integer | ✓ | - |
| vector_store_id | string | text | ✓ | Reference to vector store record |
| metadata | unknown | jsonb | ✓ | Additional ingestion metadata |
| department_id | string | uuid | ✓ | Note:
This is a Foreign Key to `organizations.id`.<fk table='organizations' column='id'/> |

---

## contractor_vetting_sections

**Description:** Individual sections of the contractor vetting process

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 9

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | integer | integer | ✗ | Note:
This is a Primary Key.<pk/> |
| vetting_id | integer | integer | ✓ | Note:
This is a Foreign Key to `contractor_vetting.id`.<fk table='contractor_vetting' column='id'/> |
| section_name | string | character varying | ✗ | Internal section identifier (details, financial, licensing, etc.) |
| section_title | string | character varying | ✗ | Display title for the section |
| status | string | text | ✓ | Status of this section |
| score | integer | integer | ✓ | Score for this section (0-100) |
| analysis_text | string | text | ✓ | AI analysis output for this section |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |

---

## contractors

**Description:** Table to store contractor information for projects

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 14

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| name | string | character varying | ✗ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |
| address | string | text | ✓ | Physical address of the contractor. |
| email | string | text | ✓ | Primary contact email address for the contractor. |
| phone | string | text | ✓ | Primary contact phone number for the contractor. |
| contact_person | string | text | ✓ | Name of the primary contact person at the contractor. |
| project_id | string | uuid | ✓ | Note:
This is a Foreign Key to `projects.id`.<fk table='projects' column='id'/> |
| contractor_type | string | text | ✓ | Type of contractor (e.g., general, electrical, plumbing) |
| construction_type | string | text | ✓ | Type of construction (EPCM, EPC, Construction Only, Design-Build) |
| sector | string | text | ✓ | Industry sector (Mining, Oil & Gas, Power Generation, etc) |
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| organization_id | string | uuid | ✓ | - |
| user_id | string | uuid | ✓ | - |

---

## contractors_backup_before_uuid_migration

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 12

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | integer | integer | ✓ | - |
| name | string | character varying | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |
| address | string | text | ✓ | - |
| email | string | text | ✓ | - |
| phone | string | text | ✓ | - |
| contact_person | string | text | ✓ | - |
| project_id | string | uuid | ✓ | - |
| contractor_type | string | text | ✓ | - |
| construction_type | string | text | ✓ | - |
| sector | string | text | ✓ | - |

---

## contracts

**Description:** Contracts associated with contractors on projects

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 13

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | integer | integer | ✗ | Note:
This is a Primary Key.<pk/> |
| contractor_id | integer | integer | ✓ | - |
| contract_number | string | character varying | ✗ | - |
| contract_type | string | character varying | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |
| contract_type_id | string | uuid | ✓ | Note:
This is a Foreign Key to `dropdown_options.id`.<fk table='dropdown_options' column='id'/> |
| category | string | text | ✓ | Category associated with the contract, e.g., Contracts information. |
| working_zones | array | text[] | ✓ | Array of working zones or areas applicable to the contract. |
| project_id | string | uuid | ✓ | Note:
This is a Foreign Key to `projects.id`.<fk table='projects' column='id'/> |
| organization_id | string | uuid | ✓ | - |
| user_id | string | uuid | ✓ | - |
| assigned_to | string | character varying | ✓ | - |

---

## contracts_post_summary

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 6

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| contract_status | string | character varying | ✓ | - |
| contract_count | integer | bigint | ✓ | - |
| total_value | number | numeric | ✓ | - |
| avg_progress | number | numeric | ✓ | - |
| total_documents | integer | bigint | ✓ | - |
| latest_contract | string | timestamp with time zone | ✓ | - |

---

## contributor_assignments

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 13

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| contributor_id | string | uuid | ✓ | Note:
This is a Foreign Key to `contributors.id`.<fk table='contributors' column='id'/> |
| page_id | string | uuid | ✓ | - |
| branch_name | string | character varying | ✓ | - |
| status | string | character varying | ✓ | - |
| assigned_at | string | timestamp without time zone | ✓ | - |
| completed_at | string | timestamp without time zone | ✓ | - |
| modal_configuration_id | string | uuid | ✓ | - |
| github_branch_url | string | text | ✓ | - |
| auto_generated_files | unknown | jsonb | ✓ | - |
| notes | string | text | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |

---

## contributors

**Description:** Enhanced contributors table with full GitHub integration

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 23

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| name | string | text | ✗ | - |
| github_username | string | text | ✓ | - |
| email | string | text | ✓ | - |
| avatar_url | string | text | ✓ | - |
| created_at | string | timestamp with time zone | ✗ | - |
| updated_at | string | timestamp with time zone | ✗ | - |
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| bio | string | text | ✓ | - |
| github_id | integer | integer | ✓ | GitHub user ID (unique identifier) |
| github_login | string | text | ✓ | GitHub username/login |
| display_name | string | text | ✓ | Display name (GitHub name or fallback to login) |
| company | string | text | ✓ | Company from GitHub profile |
| location | string | text | ✓ | Location from GitHub profile |
| blog | string | text | ✓ | Blog/website URL from GitHub profile |
| twitter_username | string | text | ✓ | Twitter username from GitHub profile |
| public_repos | integer | integer | ✓ | - |
| public_gists | integer | integer | ✓ | - |
| followers | integer | integer | ✓ | - |
| following | integer | integer | ✓ | - |
| hireable | boolean | boolean | ✓ | Whether user is available for hire |
| github_created_at | string | timestamp with time zone | ✓ | When GitHub account was created |
| github_updated_at | string | timestamp with time zone | ✓ | When GitHub profile was last updated |
| organization_id | string | uuid | ✓ | Note:
This is a Foreign Key to `organizations.id`.<fk table='organizations' column='id'/> |

---

## correspondence_training_data

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 15

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| simulation_id | string | text | ✗ | - |
| step_id | string | text | ✗ | - |
| specialist | string | text | ✗ | - |
| correspondence_text | string | text | ✗ | - |
| extracted_identifiers | unknown | jsonb | ✓ | - |
| retrieved_documents | unknown | jsonb | ✓ | - |
| specialist_analysis | string | text | ✗ | - |
| confidence | number | numeric | ✓ | - |
| citations | unknown | jsonb | ✓ | - |
| quality_score | integer | integer | ✓ | - |
| domain_relevance_score | number | numeric | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| model_version | string | text | ✓ | - |
| training_status | string | text | ✓ | - |

---

## credential_rotation_logs

**Description:** Audit trail for API credential rotation activities

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 11

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| api_config_id | string | uuid | ✗ | - |
| rotation_type | string | text | ✗ | - |
| old_key_hash | string | text | ✓ | - |
| new_key_hash | string | text | ✓ | - |
| rotated_by | string | uuid | ✓ | - |
| rotated_at | string | timestamp with time zone | ✗ | - |
| reason | string | text | ✓ | - |
| success | boolean | boolean | ✗ | - |
| error_message | string | text | ✓ | - |
| metadata | unknown | jsonb | ✓ | - |

---

## custom_assignments

**Description:** Stores custom discipline assignments for SOW templates, replacing localStorage usage

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 8

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| template_id | string | uuid | ✗ | Reference to sow_templates.id |
| order_type | string | text | ✗ | Order type (purchase_order, work_order, service_order) |
| organization_id | string | uuid | ✗ | Organization that owns these custom assignments |
| assignments | unknown | jsonb | ✗ | JSON object containing appendix-to-discipline mappings |
| created_by | string | uuid | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |

---

## custom_document_types

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 11

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| organization_id | string | uuid | ✓ | Note:
This is a Foreign Key to `organizations.id`.<fk table='organizations' column='id'/> |
| discipline_code | string | text | ✗ | - |
| document_type | string | character varying | ✗ | - |
| document_type_code | string | character varying | ✗ | - |
| category | string | character varying | ✓ | - |
| description | string | text | ✓ | - |
| is_active | boolean | boolean | ✓ | - |
| created_by | string | uuid | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |

---

## customized

**Description:** App-wide dropdown options shared across multiple modals

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 5

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| dropdown_id | string | character varying | ✗ | - |
| options | string | text | ✗ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |

---

## cv_analyses

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 11

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| candidate_name | string | text | ✓ | - |
| position_applied | string | text | ✓ | - |
| experience_level | string | text | ✓ | - |
| years_experience | integer | integer | ✓ | - |
| job_title | string | text | ✓ | - |
| job_department | string | text | ✓ | - |
| overall_rating | number | numeric | ✓ | - |
| analysis_data | unknown | jsonb | ✓ | - |
| ai_model | string | text | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |

---

## cv_application_stats

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 10

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| total_applications | integer | bigint | ✓ | - |
| pending_count | integer | bigint | ✓ | - |
| under_review_count | integer | bigint | ✓ | - |
| interview_scheduled_count | integer | bigint | ✓ | - |
| approved_count | integer | bigint | ✓ | - |
| rejected_count | integer | bigint | ✓ | - |
| on_hold_count | integer | bigint | ✓ | - |
| average_rating | number | numeric | ✓ | - |
| applications_this_week | integer | bigint | ✓ | - |
| applications_this_month | integer | bigint | ✓ | - |

---

## cv_applications

**Description:** Stores CV/job application data for HR CV Processing system

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 66

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| applicant_name | string | character varying | ✗ | - |
| email | string | character varying | ✗ | - |
| phone | string | character varying | ✓ | - |
| position_applied | string | character varying | ✗ | - |
| status | string | character varying | ✗ | Application status: pending, under_review, interview_scheduled, approved, rejected, on_hold |
| years_experience | integer | integer | ✓ | - |
| education_level | string | character varying | ✓ | - |
| skills | array | text[] | ✓ | Array of candidate skills and competencies |
| certifications | array | text[] | ✓ | Professional certifications data |
| salary_expectation | number | numeric | ✓ | - |
| currency | string | character varying | ✓ | - |
| availability_date | string | date | ✓ | - |
| employment_type | string | character varying | ✓ | Type of employment: full_time, part_time, contract, freelance, internship |
| location | string | character varying | ✓ | - |
| remote_work_preference | string | character varying | ✓ | Remote work preference: on_site, remote, hybrid |
| cv_file_url | string | text | ✓ | - |
| cover_letter_url | string | text | ✓ | - |
| portfolio_url | string | text | ✓ | - |
| additional_documents_urls | array | text[] | ✓ | - |
| interview_stage | string | character varying | ✓ | - |
| interview_date | string | timestamp with time zone | ✓ | Scheduled interview date |
| interview_notes | string | text | ✓ | - |
| interviewer_id | string | uuid | ✓ | - |
| technical_score | integer | integer | ✓ | - |
| communication_score | integer | integer | ✓ | - |
| culture_fit_score | integer | integer | ✓ | - |
| overall_rating | number | numeric | ✓ | - |
| hr_notes | string | text | ✓ | - |
| feedback | string | text | ✓ | - |
| rejection_reason | string | text | ✓ | - |
| application_source | string | character varying | ✓ | - |
| referral_source | string | character varying | ✓ | - |
| priority_level | string | character varying | ✓ | Priority level for processing: low, normal, high, urgent |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |
| applied_date | string | date | ✓ | - |
| last_contact_date | string | date | ✓ | - |
| created_by | string | uuid | ✓ | - |
| updated_by | string | uuid | ✓ | - |
| organization_id | string | uuid | ✓ | - |
| additional_info | unknown | jsonb | ✓ | Additional flexible information stored as JSON |
| custom_fields | unknown | jsonb | ✓ | Custom fields for organization-specific data |
| discipline | string | character varying | ✓ | Applicant's discipline or department (formerly department) |
| address | string | text | ✓ | - |
| scoring_details | unknown | jsonb | ✓ | - |
| analysis_type | string | character varying | ✓ | - |
| analysis_timestamp | string | timestamp with time zone | ✓ | - |
| original_notes | string | text | ✓ | - |
| openai_feedback | string | text | ✓ | AI-generated feedback |
| date_of_birth | string | date | ✓ | Candidate date of birth |
| professional_summary | string | text | ✓ | Professional summary from CV |
| work_experience | unknown | jsonb | ✓ | Structured work history data |
| education | unknown | jsonb | ✓ | Education history data |
| projects | unknown | jsonb | ✓ | Key projects from resume |
| extracted_emails | string | text | ✓ | - |
| extracted_phones | string | text | ✓ | - |
| application_date | string | date | ✓ | When the application was submitted |
| linkedin | string | character varying | ✓ | - |
| cv_file | string | character varying | ✓ | - |
| availability | string | character varying | ✓ | Available start date or notice period |
| cover_letter | string | text | ✓ | Cover letter content if provided |
| experience_level | string | character varying | ✓ | Entry, mid, or senior level |
| notes | string | text | ✓ | - |
| rating | number | numeric | ✓ | - |
| opennai_feedback | string | text | ✓ | OpenAI feedback (typo from CV processing code) |

---

## dashboard_progress

**Description:** Stores progress data displayed on user dashboards

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 6

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| user_id | string | uuid | ✗ | - |
| order_id | string | uuid | ✓ | - |
| progress_data | unknown | jsonb | ✗ | - |
| last_updated | string | timestamp with time zone | ✓ | - |
| organization_id | string | uuid | ✓ | - |

---

## data_sheet_specifications

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 18

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| template_id | string | uuid | ✓ | - |
| spec_type | string | text | ✓ | - |
| spec_code | string | text | ✓ | - |
| spec_name | string | text | ✓ | - |
| specifications | unknown | jsonb | ✓ | - |
| compliance_standards | array | text[] | ✓ | - |
| safety_requirements | array | text[] | ✓ | - |
| supplier_name | string | text | ✓ | - |
| manufacturer | string | text | ✓ | - |
| model_number | string | text | ✓ | - |
| serial_number | string | text | ✓ | - |
| issue_date | string | date | ✓ | - |
| expiry_date | string | date | ✓ | - |
| revision_number | integer | integer | ✓ | - |
| procurement_code | string | text | ✓ | - |
| created_by | string | uuid | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |

---

## defects

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 19

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | integer | integer | ✗ | Note:
This is a Primary Key.<pk/> |
| defect_id | string | character varying | ✗ | - |
| inspection_item_id | string | character varying | ✗ | Note:
This is a Foreign Key to `inspection_items.item_id`.<fk table='inspection_items' column='item_id'/> |
| defect_type | string | character varying | ✗ | - |
| severity | string | character varying | ✓ | - |
| description | string | text | ✗ | - |
| location | string | character varying | ✓ | - |
| assigned_to | string | character varying | ✓ | - |
| status | string | character varying | ✓ | - |
| priority | string | character varying | ✓ | - |
| due_date | string | date | ✓ | - |
| resolved_date | string | date | ✓ | - |
| resolution_notes | string | text | ✓ | - |
| cost_estimate | number | numeric | ✓ | - |
| media_urls | unknown | jsonb | ✓ | - |
| created_at | string | timestamp without time zone | ✓ | - |
| updated_at | string | timestamp without time zone | ✓ | - |
| created_by | string | character varying | ✓ | - |
| updated_by | string | character varying | ✓ | - |

---

## discipline_document_paths

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 12

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| organisation_id | string | uuid | ✗ | Note:
This is a Foreign Key to `organizations.id`.<fk table='organizations' column='id'/> |
| discipline_id | string | uuid | ✗ | - |
| document_type_id | string | uuid | ✗ | Note:
This is a Foreign Key to `document_types_by_discipline.id`.<fk table='document_types_by_discipline' column='id'/> |
| path_configuration | unknown | jsonb | ✗ | - |
| path_template | string | character varying | ✗ | - |
| is_active | boolean | boolean | ✓ | - |
| is_default | boolean | boolean | ✓ | - |
| created_by | string | uuid | ✗ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |
| organization_id | string | uuid | ✓ | - |

---

## discipline_document_sections

**Description:** Flexible document sections system allowing disciplines to define their own appendix, schedule, and attachment structures

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 15

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| discipline_code | string | character varying | ✗ | - |
| organization_id | string | uuid | ✗ | - |
| section_code | string | character varying | ✗ | Unique code within discipline (e.g., appendix_a, schedule_1) |
| section_name | string | character varying | ✗ | - |
| section_type | string | character varying | ✗ | Type of section: appendix, schedule, attachment, exhibit, policy, procedure |
| display_order | integer | integer | ✗ | - |
| required | boolean | boolean | ✓ | - |
| allows_multiple_types | boolean | boolean | ✓ | - |
| available_document_types | unknown | jsonb | ✓ | JSON array of allowed document types for this section |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |
| contract_type | string | character varying | ✓ | Contract type for filtering: po (procurement orders), wo (work orders), so (service orders), general (general sections) |
| default_document_type | string | character varying | ✓ | - |
| parent_template_id | string | uuid | ✓ | Note:
This is a Foreign Key to `discipline_document_sections.id`.<fk table='discipline_document_sections' column='id'/> |

---

## discipline_evaluation_weights

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 14

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| organization_id | string | uuid | ✓ | Note:
This is a Foreign Key to `organizations.id`.<fk table='organizations' column='id'/> |
| evaluation_context | string | character varying | ✗ | - |
| discipline_code | string | character varying | ✗ | - |
| discipline_name | string | character varying | ✗ | - |
| weight_percentage | number | numeric | ✗ | - |
| scoring_criteria | unknown | jsonb | ✓ | - |
| max_score | integer | integer | ✓ | - |
| passing_score | integer | integer | ✓ | - |
| is_active | boolean | boolean | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| created_by | string | uuid | ✓ | Note:
This is a Foreign Key to `user_management.user_id`.<fk table='user_management' column='user_id'/> |
| updated_at | string | timestamp with time zone | ✓ | - |
| updated_by | string | uuid | ✓ | Note:
This is a Foreign Key to `user_management.user_id`.<fk table='user_management' column='user_id'/> |

---

## discipline_extraction_prompts

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 12

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| discipline_code | string | character varying | ✗ | - |
| display_name | string | character varying | ✗ | - |
| system_prompt | string | text | ✗ | - |
| extraction_fields | unknown | jsonb | ✗ | - |
| extraction_focus | unknown | jsonb | ✗ | - |
| document_types | unknown | jsonb | ✗ | - |
| is_active | boolean | boolean | ✓ | - |
| version | integer | integer | ✓ | - |
| created_by | string | uuid | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |

---

## discipline_template_config

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 7

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| discipline | string | character varying | ✗ | Note:
This is a Primary Key.<pk/> |
| allowed_template_types | array | text[] | ✗ | - |
| requires_approval | boolean | boolean | ✓ | - |
| max_templates_per_user | integer | integer | ✓ | - |
| description | string | text | ✓ | - |
| created_at | string | timestamp without time zone | ✓ | - |
| updated_at | string | timestamp without time zone | ✓ | - |

---

## discipline_template_constraints

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 9

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| discipline_name | string | text | ✗ | - |
| table_name | string | text | ✗ | - |
| allowed_template_types | array | text[] | ✓ | - |
| description | string | text | ✓ | - |
| is_active | integer | integer | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |
| organization_id | string | uuid | ✓ | Note:
This is a Foreign Key to `organizations.id`.<fk table='organizations' column='id'/> |

---

## disciplines

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 20

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| page_id | string | uuid | ✗ | - |
| name | string | text | ✗ | - |
| code | string | text | ✗ | - |
| slug | string | text | ✓ | - |
| organization_id | string | uuid | ✗ | - |
| organization_name | string | text | ✓ | - |
| sector_id | string | uuid | ✓ | - |
| sector_name | string | text | ✓ | - |
| parent_discipline_id | string | uuid | ✓ | - |
| hierarchy_level | integer | integer | ✓ | - |
| display_order | integer | integer | ✓ | - |
| is_active | boolean | boolean | ✓ | - |
| is_standard_link | boolean | boolean | ✓ | - |
| is_virtual | boolean | boolean | ✓ | - |
| organization_ids | array | uuid[] | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |
| created_by | string | uuid | ✓ | Note:
This is a Foreign Key to `user_management.user_id`.<fk table='user_management' column='user_id'/> |
| updated_by | string | uuid | ✓ | Note:
This is a Foreign Key to `user_management.user_id`.<fk table='user_management' column='user_id'/> |

---

## document_access_logs

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 6

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| document_id | string | uuid | ✗ | - |
| user_id | string | text | ✓ | - |
| tender_id | string | uuid | ✗ | - |
| access_type | string | character varying | ✗ | - |
| accessed_at | string | timestamp without time zone | ✓ | - |

---

## document_ai_analysis

**Description:** Stores AI analysis results for uploaded documents including confidence scores and human corrections

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 8

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| document_id | string | uuid | ✓ | Note:
This is a Foreign Key to `a_00900_doccontrol_documents.id`.<fk table='a_00900_doccontrol_documents' column='id'/> |
| analysis_results | unknown | jsonb | ✗ | JSON containing AI extracted metadata, document type, entities, etc. |
| confidence_scores | unknown | jsonb | ✗ | JSON containing confidence scores for each AI prediction |
| human_corrections | unknown | jsonb | ✓ | JSON containing any manual corrections made by users |
| processing_status | string | text | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |

---

## document_analysis_feedback

**Description:** Tracks AI learning from user corrections and feedback

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 9

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| user_id | string | uuid | ✗ | - |
| original_analysis | unknown | jsonb | ✓ | - |
| user_correction | unknown | jsonb | ✓ | - |
| document_content | string | text | ✓ | - |
| feedback_type | string | text | ✓ | - |
| confidence_score | number | numeric | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| organization_id | string | uuid | ✓ | - |

---

## document_analysis_prompts

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 12

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| prompt_type | string | character varying | ✗ | - |
| document_type | string | character varying | ✗ | - |
| discipline_id | string | character varying | ✓ | - |
| prompt_text | string | text | ✗ | - |
| model_parameters | unknown | jsonb | ✓ | - |
| is_active | boolean | boolean | ✓ | - |
| created_by | string | uuid | ✓ | - |
| updated_by | string | uuid | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |
| organization_id | string | uuid | ✓ | - |

---

## document_categories

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 7

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| category_code | string | character varying | ✗ | - |
| category_name | string | text | ✗ | - |
| description | string | text | ✓ | - |
| is_active | boolean | boolean | ✓ | - |
| created_at | string | timestamp without time zone | ✓ | - |
| organization_id | string | uuid | ✓ | Note:
This is a Foreign Key to `organizations.id`.<fk table='organizations' column='id'/> |

---

## document_comparisons

**Description:** Table for storing document comparison results

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 7

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Unique identifier for each comparison

Note:
This is a Primary Key.<pk/> |
| document_ids | array | uuid[] | ✗ | Array of document IDs that were compared |
| mode | string | text | ✗ | Comparison mode: pairwise or consolidated |
| result | unknown | jsonb | ✓ | JSON result of the comparison |
| created_at | string | timestamp with time zone | ✓ | Timestamp when comparison was created |
| created_by | string | uuid | ✓ | User ID who created the comparison |
| options | unknown | jsonb | ✓ | Options used for the comparison |

---

## document_download_queue

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 23

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| tender_id | string | uuid | ✗ | - |
| document_url | string | text | ✗ | - |
| document_type | string | character varying | ✗ | - |
| source_name | string | character varying | ✓ | - |
| priority | integer | integer | ✓ | - |
| status | string | character varying | ✓ | - |
| queue_order | integer | integer | ✓ | - |
| download_options | unknown | jsonb | ✓ | - |
| expected_file_size | integer | integer | ✓ | - |
| retry_count | integer | integer | ✓ | - |
| max_retries | integer | integer | ✓ | - |
| error_message | string | text | ✓ | - |
| started_at | string | timestamp without time zone | ✓ | - |
| scheduled_at | string | timestamp without time zone | ✓ | - |
| completed_at | string | timestamp without time zone | ✓ | - |
| created_at | string | timestamp without time zone | ✓ | - |
| created_by | string | text | ✓ | - |
| user_ip | string | text | ✓ | - |
| user_agent | string | text | ✓ | - |
| document_name | string | text | ✓ | - |
| source | string | character varying | ✓ | - |
| organization_id | string | uuid | ✓ | - |

---

## document_embeddings

**Description:** Direct embeddings storage bypassing Flowise document store system

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 13

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | integer | bigint | ✗ | Note:
This is a Primary Key.<pk/> |
| content | string | text | ✗ | - |
| embedding | string | extensions.vector(1536) | ✓ | Vector embedding (1536 dimensions for OpenAI text-embedding-ada-002) |
| metadata | unknown | jsonb | ✓ | JSON metadata including pagePrefix, discipline, security level, etc. |
| source | string | text | ✓ | - |
| page | integer | integer | ✓ | - |
| section | string | text | ✓ | - |
| chunk_id | string | text | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |
| document_store_id | string | uuid | ✓ | UUID reference to document_stores table for department routing

Note:
This is a Foreign Key to `document_stores.id`.<fk table='document_stores' column='id'/> |
| discipline_code | string | text | ✓ | Page prefix/discipline code for department-specific routing |
| flowise_store_id | string | text | ✓ | Flowise store ID for integration when available |

---

## document_hashes

**Description:** Table for storing document content hashes to prevent duplication during ingestion

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 8

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Unique identifier for each hash record

Note:
This is a Primary Key.<pk/> |
| doc_id | string | uuid | ✗ | Reference to the document this hash belongs to |
| version | string | text | ✗ | Version of the document (semver-like format) |
| hash | string | text | ✗ | SHA-256 hash of document content |
| chunk_id | string | text | ✓ | Identifier for document chunk (if applicable) |
| timestamp | string | timestamp with time zone | ✓ | Timestamp when hash was created |
| source_path | string | text | ✓ | Original path of the document source |
| department_id | string | uuid | ✓ | Department associated with this document |

---

## document_hierarchy_definitions

**Description:** Defines hierarchical structures for different document types (Part/Section/Clause/etc.)

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 9

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| discipline_id | string | text | ✗ | - |
| document_type | string | text | ✗ | - |
| hierarchy_levels | unknown | jsonb | ✗ | - |
| is_active | boolean | boolean | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |
| created_by | string | uuid | ✓ | - |
| organization_id | string | uuid | ✓ | - |

---

## document_number_audit_log

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 11

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | integer | integer | ✗ | Note:
This is a Primary Key.<pk/> |
| discipline_code | string | text | ✗ | - |
| document_type | string | text | ✗ | - |
| organization_id | string | text | ✗ | - |
| company_id | integer | integer | ✗ | - |
| generated_number | string | text | ✗ | - |
| sequence_number | integer | integer | ✗ | - |
| context | unknown | jsonb | ✓ | - |
| generated_at | string | timestamp with time zone | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| user_id | string | uuid | ✓ | - |

---

## document_number_sequences

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 4

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| discipline_code | string | character varying | ✗ | Note:
This is a Primary Key.<pk/> |
| document_type | string | character varying | ✗ | Note:
This is a Primary Key.<pk/> |
| organization_id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| current_value | integer | integer | ✗ | - |

---

## document_numbering_methodologies

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 12

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| organization_id | string | character varying | ✗ | - |
| company_id | integer | integer | ✓ | - |
| methodology_name | string | character varying | ✗ | - |
| methodology_description | string | text | ✓ | - |
| default_pattern | string | text | ✗ | - |
| pattern_variables | unknown | jsonb | ✓ | - |
| is_default | boolean | boolean | ✓ | - |
| is_active | boolean | boolean | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |
| created_by | string | uuid | ✓ | - |

---

## document_numbering_sequences

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 6

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| document_type_id | string | uuid | ✓ | Note:
This is a Foreign Key to `document_types_by_discipline.id`.<fk table='document_types_by_discipline' column='id'/> |
| sequence_key | string | character varying | ✗ | - |
| current_number | integer | integer | ✓ | - |
| last_generated_at | string | timestamp with time zone | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |

---

## document_processing_history

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 11

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| tender_id | string | uuid | ✗ | - |
| document_id | string | uuid | ✓ | - |
| document_url | string | text | ✗ | - |
| operation_type | string | character varying | ✗ | - |
| status | string | character varying | ✗ | - |
| error_message | string | text | ✓ | - |
| processing_time_ms | integer | integer | ✓ | - |
| file_size_processed | integer | integer | ✓ | - |
| metadata_collected | unknown | jsonb | ✓ | - |
| created_at | string | timestamp without time zone | ✓ | - |

---

## document_processing_log

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 21

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| instance_id | string | uuid | ✓ | Note:
This is a Foreign Key to `form_instances.id`.<fk table='form_instances' column='id'/> |
| template_id | string | uuid | ✓ | Note:
This is a Foreign Key to `governance_document_templates.id`.<fk table='governance_document_templates' column='id'/> |
| file_name | string | text | ✗ | - |
| file_type | string | text | ✓ | - |
| organization_name | string | text | ✓ | - |
| discipline_name | string | text | ✓ | - |
| processing_type | string | text | ✗ | - |
| processing_status | string | text | ✗ | - |
| processing_message | string | text | ✓ | - |
| processing_details | unknown | jsonb | ✓ | - |
| processing_time_ms | integer | integer | ✓ | - |
| file_size | integer | integer | ✓ | - |
| extracted_fields_count | integer | integer | ✓ | - |
| error_details | unknown | jsonb | ✓ | - |
| stack_trace | string | text | ✓ | - |
| user_agent | string | text | ✓ | - |
| user_ip | string | text | ✓ | - |
| created_by | string | text | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| organization_id | string | uuid | ✓ | - |

---

## document_processing_queue

**Description:** Queue for tracking document processing status and progress

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 10

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| file_id | string | text | ✗ | Unique identifier for the file being processed (before document creation) |
| document_id | string | uuid | ✓ | Note:
This is a Foreign Key to `a_00900_doccontrol_documents.id`.<fk table='a_00900_doccontrol_documents' column='id'/> |
| status | string | text | ✓ | - |
| progress | integer | integer | ✓ | Processing progress percentage (0-100) |
| metadata | unknown | jsonb | ✓ | - |
| ai_analysis | unknown | jsonb | ✓ | Temporary storage for AI analysis results during processing |
| error_message | string | text | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| processed_at | string | timestamp with time zone | ✓ | - |

---

## document_references

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 11

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| identifier | string | text | ✗ | - |
| document_type_id | string | uuid | ✗ | - |
| title | string | text | ✗ | - |
| file_path | string | text | ✓ | - |
| metadata | unknown | jsonb | ✓ | - |
| vector_doc_ids | array | text[] | ✓ | - |
| organization_id | string | uuid | ✗ | Note:
This is a Foreign Key to `organizations.id`.<fk table='organizations' column='id'/> |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |
| user_id | string | uuid | ✓ | - |

---

## document_routing_history

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 13

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | integer | bigint | ✗ | Note:
This is a Primary Key.<pk/> |
| workflow_id | integer | bigint | ✓ | Note:
This is a Foreign Key to `document_routing_workflows.id`.<fk table='document_routing_workflows' column='id'/> |
| document_id | string | uuid | ✓ | Note:
This is a Foreign Key to `a_00900_doccontrol_documents.id`.<fk table='a_00900_doccontrol_documents' column='id'/> |
| version_id | integer | bigint | ✓ | Note:
This is a Foreign Key to `a_00900_doccontrol_document_versions.id`.<fk table='a_00900_doccontrol_document_versions' column='id'/> |
| action_type | string | character varying | ✗ | - |
| action_description | string | text | ✓ | - |
| actor_id | string | uuid | ✓ | Note:
This is a Foreign Key to `user_management.user_id`.<fk table='user_management' column='user_id'/> |
| actor_role | string | character varying | ✓ | - |
| old_status | string | character varying | ✓ | - |
| new_status | string | character varying | ✓ | - |
| step_name | string | character varying | ✓ | - |
| action_metadata | unknown | jsonb | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |

---

## document_routing_templates

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 11

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | integer | bigint | ✗ | Note:
This is a Primary Key.<pk/> |
| template_name | string | character varying | ✗ | - |
| template_description | string | text | ✓ | - |
| document_type | string | character varying | ✓ | - |
| organization_id | integer | bigint | ✓ | - |
| creator_id | string | uuid | ✓ | Note:
This is a Foreign Key to `user_management.user_id`.<fk table='user_management' column='user_id'/> |
| is_active | boolean | boolean | ✓ | - |
| is_default | boolean | boolean | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |
| user_id | string | uuid | ✓ | - |

---

## document_routing_workflows

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 12

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | integer | bigint | ✗ | Note:
This is a Primary Key.<pk/> |
| document_id | string | uuid | ✓ | Note:
This is a Foreign Key to `a_00900_doccontrol_documents.id`.<fk table='a_00900_doccontrol_documents' column='id'/> |
| version_id | integer | bigint | ✓ | Note:
This is a Foreign Key to `a_00900_doccontrol_document_versions.id`.<fk table='a_00900_doccontrol_document_versions' column='id'/> |
| template_id | integer | bigint | ✓ | Note:
This is a Foreign Key to `document_routing_templates.id`.<fk table='document_routing_templates' column='id'/> |
| workflow_name | string | character varying | ✓ | - |
| workflow_status | string | character varying | ✓ | - |
| current_step_order | integer | integer | ✓ | - |
| initiated_by | string | uuid | ✓ | Note:
This is a Foreign Key to `user_management.user_id`.<fk table='user_management' column='user_id'/> |
| deadline | string | timestamp with time zone | ✓ | - |
| completed_at | string | timestamp with time zone | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |

---

## document_sections

**Description:** Stores detailed section content within hierarchical document structures

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 15

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| structure_id | string | uuid | ✗ | Note:
This is a Foreign Key to `template_document_structures.id`.<fk table='template_document_structures' column='id'/> |
| section_path | string | text | ✗ | - |
| level_name | string | text | ✗ | - |
| level_number | string | text | ✗ | - |
| title | string | text | ✓ | - |
| content | unknown | jsonb | ✓ | - |
| metadata | unknown | jsonb | ✓ | - |
| parent_section_id | string | uuid | ✓ | Note:
This is a Foreign Key to `document_sections.id`.<fk table='document_sections' column='id'/> |
| sort_order | integer | integer | ✓ | - |
| is_required | boolean | boolean | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |
| organization_id | string | uuid | ✓ | - |
| user_id | string | uuid | ✓ | - |

---

## document_stores

**Description:** Logical grouping for documents to be managed and upserted via Flowise

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 15

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| name | string | text | ✗ | Unique name for the document store |
| description | string | text | ✓ | Human-readable description of the store purpose |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |
| metadata | unknown | jsonb | ✓ | Additional configuration and metadata for the store |
| is_active | boolean | boolean | ✓ | Whether this store is currently active for new documents |
| flowise_id | string | character varying | ✓ | - |
| discipline_code | string | character varying | ✓ | - |
| security_level | string | character varying | ✓ | - |
| access_roles | unknown | jsonb | ✓ | - |
| store_type | string | character varying | ✓ | - |
| doc_id | string | uuid | ✓ | - |
| organization_id | string | uuid | ✓ | - |
| user_id | string | uuid | ✓ | - |

---

## document_type_relationships

**Description:** Defines relationships between document types (e.g., scope_of_work can be part of purchase_order)

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 8

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| child_type | string | text | ✗ | - |
| parent_type | string | text | ✗ | - |
| relationship_type | string | text | ✗ | - |
| is_common | boolean | boolean | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| organization_id | string | uuid | ✓ | - |
| user_id | string | uuid | ✓ | - |

---

## document_types

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 8

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| name | string | text | ✗ | - |
| code | string | text | ✗ | - |
| discipline_code | string | text | ✗ | - |
| category | string | text | ✗ | - |
| description | string | text | ✓ | - |
| is_active | boolean | boolean | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |

---

## document_types_by_discipline

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 21

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| discipline_code | string | character varying | ✗ | - |
| discipline_name | string | character varying | ✗ | - |
| document_type | string | character varying | ✗ | - |
| document_type_code | string | character varying | ✗ | - |
| numbering_pattern | string | text | ✗ | - |
| numbering_explanation | string | text | ✗ | - |
| organization_id | string | character varying | ✗ | - |
| is_active | boolean | boolean | ✓ | - |
| auto_increment_start | integer | integer | ✓ | - |
| auto_increment_current | integer | integer | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |
| created_by | string | uuid | ✓ | - |
| company_id | string | uuid | ✓ | Note:
This is a Foreign Key to `companies.id`.<fk table='companies' column='id'/> |
| supported_file_types | array | text[] | ✓ | Array of allowed file extensions for this document type (e.g., ["pdf", "docx"]) |
| template_categories | array | text[] | ✓ | Array of available template categories for this discipline (e.g., ["scope_of_work", "method_statement"]) |
| notification_templates | unknown | jsonb | ✓ | JSON configuration for email/SMS notification templates used in workflows |
| workflow_rules | unknown | jsonb | ✓ | JSON configuration for assignment and approval workflows (auto-evaluation, clarification requirements, etc.) |
| ui_labels | unknown | jsonb | ✓ | JSON configuration for user interface help text and labels |
| validation_rules | unknown | jsonb | ✓ | JSON configuration for file validation rules (max size, required fields, etc.) |

---

## document_variation_sections

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 9

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| variation_id | string | uuid | ✗ | Note:
This is a Foreign Key to `document_variations.id`.<fk table='document_variations' column='id'/> |
| section_code | string | character varying | ✗ | - |
| section_name | string | character varying | ✗ | - |
| section_type | string | character varying | ✗ | - |
| display_order | integer | integer | ✗ | - |
| required | boolean | boolean | ✓ | - |
| organization_id | string | uuid | ✗ | - |
| created_at | string | timestamp with time zone | ✓ | - |

---

## document_variations

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 8

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| name | string | character varying | ✗ | - |
| discipline_code | string | character varying | ✗ | - |
| contract_type | string | character varying | ✓ | - |
| template_variation | string | character varying | ✓ | - |
| organization_id | string | uuid | ✗ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |

---

## document_versions

**Description:** Tracks all versions of documents for version control system

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 17

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| document_id | string | uuid | ✗ | Reference to the parent document

Note:
This is a Foreign Key to `a_00900_doccontrol_documents.id`.<fk table='a_00900_doccontrol_documents' column='id'/> |
| version_number | string | text | ✗ | Semantic version number (e.g., 1.0.0, 1.2.3) |
| previous_version_id | string | uuid | ✓ | Reference to the previous version for rollback/compare

Note:
This is a Foreign Key to `document_versions.id`.<fk table='document_versions' column='id'/> |
| author_id | string | uuid | ✓ | User who created this version

Note:
This is a Foreign Key to `user_management.user_id`.<fk table='user_management' column='user_id'/> |
| author_name | string | text | ✓ | Name of the author (cached for display) |
| version_notes | string | text | ✓ | Mandatory notes explaining changes in this version |
| change_summary | string | text | ✓ | Auto-generated or user-provided summary of changes |
| status | string | text | ✓ | Version status: draft, review, approved, archived, superseded |
| file_path | string | text | ✓ | Storage path for this version of the document |
| file_hash | string | text | ✓ | Content hash for integrity verification |
| file_size | integer | bigint | ✓ | Size of the document file in bytes |
| content_type | string | text | ✓ | MIME type of the document |
| metadata | unknown | jsonb | ✓ | Additional version-specific metadata |
| created_at | string | timestamp with time zone | ✓ | Timestamp when this version was created |
| updated_at | string | timestamp with time zone | ✓ | Timestamp when this version was last updated |
| organization_id | string | uuid | ✓ | Note:
This is a Foreign Key to `organizations.id`.<fk table='organizations' column='id'/> |

---

## dropdown_options

**Description:** Modal-specific dropdown options

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 14

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| modal_id | string | character varying | ✗ | - |
| type | string | character varying | ✗ | - |
| value | string | text | ✗ | - |
| company_id | integer | integer | ✓ | - |
| contractor_id | integer | integer | ✓ | - |
| field_label | string | character varying | ✓ | - |
| project | string | character varying | ✓ | - |
| modal_name | string | character varying | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |
| type_contract | string | character varying | ✓ | - |
| language | string | character varying | ✓ | - |
| project_id | string | uuid | ✓ | Note:
This is a Foreign Key to `projects.id`.<fk table='projects' column='id'/> |

---

## email_access_logs

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 7

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| email_send_id | string | uuid | ✗ | Note:
This is a Foreign Key to `email_sends.id`.<fk table='email_sends' column='id'/> |
| doc_id | string | text | ✗ | - |
| actor_id | string | uuid | ✓ | Note:
This is a Foreign Key to `user_management.user_id`.<fk table='user_management' column='user_id'/> |
| accessed_at | string | timestamp with time zone | ✗ | - |
| ip | string | text | ✓ | - |
| user_agent | string | text | ✓ | - |

---

## email_ai_processing_queue

**Description:** Queue for AI processing tasks on emails with user and organization-based access control

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 17

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| email_id | string | uuid | ✗ | Note:
This is a Foreign Key to `emails.id`.<fk table='emails' column='id'/> |
| user_id | string | uuid | ✗ | Note:
This is a Foreign Key to `user_management.user_id`.<fk table='user_management' column='user_id'/> |
| processing_type | string | character varying | ✗ | - |
| priority | integer | integer | ✓ | - |
| status | string | character varying | ✓ | - |
| result | unknown | jsonb | ✓ | - |
| confidence_score | number | numeric | ✓ | - |
| attempts | integer | integer | ✓ | - |
| max_attempts | integer | integer | ✓ | - |
| started_at | string | timestamp with time zone | ✓ | - |
| completed_at | string | timestamp with time zone | ✓ | - |
| error_message | string | text | ✓ | - |
| last_error_at | string | timestamp with time zone | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |
| organization_id | string | uuid | ✓ | Organization context for email processing (for shared access)

Note:
This is a Foreign Key to `organizations.id`.<fk table='organizations' column='id'/> |

---

## email_attachments

**Description:** Stores email attachment metadata and references to Supabase storage

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 18

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| email_id | string | uuid | ✗ | Note:
This is a Foreign Key to `emails.id`.<fk table='emails' column='id'/> |
| user_id | string | uuid | ✗ | Note:
This is a Foreign Key to `user_management.user_id`.<fk table='user_management' column='user_id'/> |
| filename | string | character varying | ✗ | - |
| content_type | string | character varying | ✓ | - |
| file_size | integer | bigint | ✓ | - |
| attachment_id | string | character varying | ✓ | - |
| storage_path | string | text | ✓ | - |
| storage_bucket | string | character varying | ✓ | - |
| is_inline | boolean | boolean | ✓ | - |
| content_id | string | character varying | ✓ | - |
| is_safe | boolean | boolean | ✓ | - |
| virus_scan_result | string | character varying | ✓ | - |
| virus_scan_at | string | timestamp with time zone | ✓ | - |
| download_count | integer | integer | ✓ | - |
| last_downloaded_at | string | timestamp with time zone | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |

---

## email_content_storage

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 15

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| email_id | string | uuid | ✗ | Note:
This is a Foreign Key to `emails.id`.<fk table='emails' column='id'/> |
| user_id | string | uuid | ✗ | Note:
This is a Foreign Key to `user_management.user_id`.<fk table='user_management' column='user_id'/> |
| content_type | string | character varying | ✗ | - |
| original_size | integer | bigint | ✗ | - |
| compressed_size | integer | bigint | ✓ | - |
| compression_type | string | character varying | ✓ | - |
| storage_bucket | string | character varying | ✗ | - |
| storage_path | string | text | ✗ | - |
| encoding | string | character varying | ✓ | - |
| language | string | character varying | ✓ | - |
| access_count | integer | integer | ✓ | - |
| last_accessed_at | string | timestamp with time zone | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |

---

## email_drafts

**Description:** Draft emails that haven't been sent yet

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 18

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| user_id | string | uuid | ✗ | Note:
This is a Foreign Key to `user_management.user_id`.<fk table='user_management' column='user_id'/> |
| account_id | string | uuid | ✗ | Note:
This is a Foreign Key to `user_email_accounts.id`.<fk table='user_email_accounts' column='id'/> |
| to_emails | array | text[] | ✗ | - |
| cc_emails | array | text[] | ✓ | - |
| bcc_emails | array | text[] | ✓ | - |
| subject | string | text | ✗ | - |
| body_text | string | text | ✓ | - |
| body_html | string | text | ✓ | - |
| is_reply | boolean | boolean | ✓ | - |
| is_forward | boolean | boolean | ✓ | - |
| original_email_id | string | uuid | ✓ | Note:
This is a Foreign Key to `emails.id`.<fk table='emails' column='id'/> |
| priority | string | character varying | ✓ | - |
| scheduled_send_at | string | timestamp with time zone | ✓ | - |
| is_scheduled | boolean | boolean | ✓ | - |
| auto_saved_at | string | timestamp with time zone | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |

---

## email_notification_queue

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 9

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| approval_instance_id | string | uuid | ✓ | Note:
This is a Foreign Key to `governance_approval_instances.id`.<fk table='governance_approval_instances' column='id'/> |
| user_id | string | text | ✓ | - |
| email_type | string | text | ✗ | - |
| email_subject | string | text | ✓ | - |
| email_body | string | text | ✓ | - |
| send_after | string | timestamp with time zone | ✓ | - |
| sent_at | string | timestamp with time zone | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |

---

## email_notifications

**Description:** Stores email notifications sent to users about workflow events

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 11

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| user_id | string | uuid | ✗ | - |
| order_id | string | uuid | ✓ | - |
| subject | string | character varying | ✗ | - |
| body | string | text | ✗ | - |
| email_type | string | character varying | ✓ | - |
| metadata | unknown | jsonb | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| sent | boolean | boolean | ✓ | - |
| sent_at | string | timestamp with time zone | ✓ | - |
| organization_id | string | uuid | ✓ | - |

---

## email_providers

**Description:** Supported email providers (Gmail, Outlook, IMAP, etc.)

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 8

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| name | string | character varying | ✗ | - |
| display_name | string | character varying | ✗ | - |
| provider_type | string | character varying | ✗ | - |
| is_active | boolean | boolean | ✓ | - |
| configuration | unknown | jsonb | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |

---

## email_search_history

**Description:** User search history for analytics and quick access

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 10

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| user_id | string | uuid | ✗ | Note:
This is a Foreign Key to `user_management.user_id`.<fk table='user_management' column='user_id'/> |
| search_query | string | text | ✗ | - |
| search_type | string | character varying | ✓ | - |
| search_filters | unknown | jsonb | ✓ | - |
| results_count | integer | integer | ✓ | - |
| execution_time_ms | integer | integer | ✓ | - |
| ai_interpretation | string | text | ✓ | - |
| ai_confidence | number | numeric | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |

---

## email_send_attachments

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 10

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| email_send_id | string | uuid | ✗ | Note:
This is a Foreign Key to `email_sends.id`.<fk table='email_sends' column='id'/> |
| doc_id | string | text | ✗ | - |
| version_id | string | text | ✓ | - |
| file_key | string | text | ✓ | - |
| delivery_mode | string | text | ✗ | - |
| signed_url | string | text | ✓ | - |
| expires_at | string | timestamp with time zone | ✓ | - |
| size_bytes | integer | bigint | ✓ | - |
| created_at | string | timestamp with time zone | ✗ | - |

---

## email_sends

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 11

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| actor_id | string | uuid | ✗ | Note:
This is a Foreign Key to `user_management.user_id`.<fk table='user_management' column='user_id'/> |
| recipients_json | unknown | jsonb | ✗ | - |
| lists_json | unknown | jsonb | ✗ | - |
| template_id | string | text | ✓ | - |
| subject | string | text | ✗ | - |
| mode | string | text | ✗ | - |
| sent_at | string | timestamp with time zone | ✓ | - |
| provider_message_id | string | text | ✓ | - |
| created_at | string | timestamp with time zone | ✗ | - |
| updated_at | string | timestamp with time zone | ✗ | - |

---

## email_signatures

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 6

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| user_id | string | uuid | ✗ | - |
| content | string | text | ✗ | - |
| is_default | boolean | boolean | ✓ | - |
| type | string | text | ✗ | - |
| created_at | string | timestamp with time zone | ✓ | - |

---

## email_sync_log

**Description:** Logs of email synchronization operations

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 17

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| account_id | string | uuid | ✗ | Note:
This is a Foreign Key to `user_email_accounts.id`.<fk table='user_email_accounts' column='id'/> |
| user_id | string | uuid | ✗ | Note:
This is a Foreign Key to `user_management.user_id`.<fk table='user_management' column='user_id'/> |
| sync_type | string | character varying | ✗ | - |
| sync_status | string | character varying | ✗ | - |
| emails_fetched | integer | integer | ✓ | - |
| emails_processed | integer | integer | ✓ | - |
| emails_failed | integer | integer | ✓ | - |
| new_emails | integer | integer | ✓ | - |
| updated_emails | integer | integer | ✓ | - |
| started_at | string | timestamp with time zone | ✗ | - |
| completed_at | string | timestamp with time zone | ✓ | - |
| duration_seconds | integer | integer | ✓ | - |
| error_message | string | text | ✓ | - |
| error_details | unknown | jsonb | ✓ | - |
| provider_response | unknown | jsonb | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |

---

## email_templates

**Description:** Email templates for quick composition

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 15

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| user_id | string | uuid | ✗ | Note:
This is a Foreign Key to `user_management.user_id`.<fk table='user_management' column='user_id'/> |
| name | string | character varying | ✗ | - |
| description | string | text | ✓ | - |
| category | string | character varying | ✓ | - |
| subject_template | string | text | ✓ | - |
| body_template | string | text | ✓ | - |
| variables | unknown | jsonb | ✓ | - |
| usage_count | integer | integer | ✓ | - |
| last_used_at | string | timestamp with time zone | ✓ | - |
| is_public | boolean | boolean | ✓ | - |
| is_system_template | boolean | boolean | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |
| organization_id | string | uuid | ✓ | - |

---

## email_threads

**Description:** Groups related emails into conversation threads

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 20

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| user_id | string | uuid | ✗ | Note:
This is a Foreign Key to `user_management.user_id`.<fk table='user_management' column='user_id'/> |
| thread_id | string | character varying | ✗ | - |
| subject | string | text | ✗ | - |
| participants | array | text[] | ✓ | - |
| message_count | integer | integer | ✓ | - |
| unread_count | integer | integer | ✓ | - |
| has_attachments | boolean | boolean | ✓ | - |
| priority | string | character varying | ✓ | - |
| labels | array | text[] | ✓ | - |
| last_activity_at | string | timestamp with time zone | ✓ | - |
| is_archived | boolean | boolean | ✓ | - |
| is_deleted | boolean | boolean | ✓ | - |
| ai_summary | string | text | ✓ | - |
| ai_sentiment | string | character varying | ✓ | - |
| ai_priority_score | number | numeric | ✓ | - |
| ai_action_items | array | text[] | ✓ | - |
| ai_processed_at | string | timestamp with time zone | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |

---

## email_vector

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 4

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| embedding | string | extensions.vector | ✗ | - |
| metadata | unknown | jsonb | ✓ | - |
| content | string | text | ✓ | - |

---

## emails

**Description:** Main table storing all email messages with full content and metadata

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 44

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| user_id | string | uuid | ✓ | Note:
This is a Foreign Key to `user_management.user_id`.<fk table='user_management' column='user_id'/> |
| account_id | string | uuid | ✓ | Note:
This is a Foreign Key to `user_email_accounts.id`.<fk table='user_email_accounts' column='id'/> |
| thread_id | string | uuid | ✓ | Note:
This is a Foreign Key to `email_threads.id`.<fk table='email_threads' column='id'/> |
| message_id | string | character varying | ✓ | - |
| provider_thread_id | string | uuid | ✓ | - |
| subject | string | text | ✗ | - |
| sender_email | string | character varying | ✗ | - |
| sender_name | string | character varying | ✓ | - |
| recipient_email | string | character varying | ✗ | - |
| recipient_name | string | character varying | ✓ | - |
| cc_emails | array | text[] | ✓ | - |
| bcc_emails | array | text[] | ✓ | - |
| reply_to_email | string | character varying | ✓ | - |
| body_text | string | text | ✓ | - |
| body_html | string | text | ✓ | - |
| snippet | string | text | ✓ | - |
| sent_date | string | timestamp with time zone | ✗ | - |
| received_date | string | timestamp with time zone | ✓ | - |
| is_read | boolean | boolean | ✓ | - |
| is_flagged | boolean | boolean | ✓ | - |
| is_important | boolean | boolean | ✓ | - |
| is_draft | boolean | boolean | ✓ | - |
| is_sent | boolean | boolean | ✓ | - |
| is_archived | boolean | boolean | ✓ | - |
| is_deleted | boolean | boolean | ✓ | - |
| is_spam | boolean | boolean | ✓ | - |
| has_attachments | boolean | boolean | ✓ | - |
| attachment_count | integer | integer | ✓ | - |
| priority | string | character varying | ✓ | - |
| labels | array | text[] | ✓ | - |
| ai_summary | string | text | ✓ | - |
| ai_sentiment | string | character varying | ✓ | - |
| ai_priority_score | number | numeric | ✓ | - |
| ai_action_items | array | text[] | ✓ | - |
| ai_entities | unknown | jsonb | ✓ | - |
| ai_processed_at | string | timestamp with time zone | ✓ | - |
| provider_data | unknown | jsonb | ✓ | - |
| search_vector | string | tsvector | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |
| sender_email_normalized | string | public.citext | ✓ | - |
| recipient_email_normalized | string | public.citext | ✓ | - |
| resolution_debug | unknown | jsonb | ✓ | - |

---

## equipment_documentation

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 9

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| equipment_id | string | uuid | ✗ | Note:
This is a Foreign Key to `operations_equipment.id`.<fk table='operations_equipment' column='id'/> |
| storage_service | string | public.storage_service_type | ✗ | - |
| storage_url | string | text | ✗ | - |
| document_id | string | character varying | ✗ | - |
| sections | unknown | jsonb | ✗ | - |
| compliance_standards | array | text[] | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |

---

## error_implementations

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 12

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| error_tracking_id | string | uuid | ✗ | Note:
This is a Foreign Key to `error_trackings.id`.<fk table='error_trackings' column='id'/> |
| implementation_type | string | character varying | ✗ | - |
| status | string | character varying | ✗ | - |
| priority | string | character varying | ✓ | - |
| code_example | string | text | ✓ | - |
| technical_notes | string | text | ✓ | - |
| developer_assigned | string | character varying | ✓ | - |
| qa_validation_status | string | character varying | ✓ | - |
| deployment_status | string | character varying | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |

---

## error_metrics

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 8

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| error_tracking_id | string | uuid | ✗ | Note:
This is a Foreign Key to `error_trackings.id`.<fk table='error_trackings' column='id'/> |
| metric_type | string | character varying | ✗ | - |
| value | number | numeric | ✗ | - |
| unit | string | character varying | ✓ | - |
| measured_at | string | timestamp with time zone | ✓ | - |
| measurement_context | string | text | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |

---

## error_trackings

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 18

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| error_id | string | character varying | ✗ | - |
| title | string | character varying | ✗ | - |
| category | string | character varying | ✗ | - |
| severity | string | character varying | ✗ | - |
| status | string | character varying | ✗ | - |
| description | string | text | ✓ | - |
| root_cause | string | text | ✓ | - |
| solution | string | text | ✓ | - |
| impact_assessment | string | text | ✓ | - |
| error_pattern | string | character varying | ✓ | - |
| affected_system | string | character varying | ✓ | - |
| resolution_timestamp | string | timestamp with time zone | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |
| resolved_at | string | timestamp with time zone | ✓ | - |
| fingerprint | string | text | ✓ | Hash of error signature for deduplication and similarity detection |
| batch_id | string | uuid | ✓ | Groups related errors that occurred in the same batch/request |

---

## esignature_audit

**Description:** Complete audit trail for all e-signatures

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 17

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| approval_step_id | string | uuid | ✓ | Note:
This is a Foreign Key to `approval_steps.id`.<fk table='approval_steps' column='id'/> |
| approval_instance_id | string | uuid | ✓ | Note:
This is a Foreign Key to `approval_instances.id`.<fk table='approval_instances' column='id'/> |
| signer_user_id | string | uuid | ✓ | - |
| signature_method | string | character varying | ✗ | - |
| signature_data | unknown | jsonb | ✗ | Encrypted signature data for compliance and verification |
| signature_hash | string | character varying | ✓ | - |
| ip_address | string | inet | ✓ | - |
| user_agent | string | text | ✓ | - |
| location_data | unknown | jsonb | ✓ | - |
| signed_at | string | timestamp with time zone | ✓ | - |
| document_hash | string | character varying | ✗ | - |
| document_version | string | character varying | ✓ | - |
| certificate_data | unknown | jsonb | ✓ | - |
| is_valid | boolean | boolean | ✓ | - |
| invalidated_at | string | timestamp with time zone | ✓ | - |
| invalidation_reason | string | text | ✓ | - |

---

## evaluation_packages

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 27

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| package_context | string | character varying | ✗ | - |
| context_reference_id | string | character varying | ✓ | - |
| package_name | string | character varying | ✗ | - |
| package_description | string | text | ✓ | - |
| party_email | string | character varying | ✗ | - |
| party_name | string | character varying | ✓ | - |
| party_org_name | string | character varying | ✓ | - |
| party_type | string | character varying | ✓ | - |
| party_id | string | uuid | ✓ | Optional UUID reference to external party. May reference contractors table, user_management, or other party tables. Not a foreign key to allow flexibility. The party_email field is the primary identifier. |
| organization_id | string | uuid | ✓ | Note:
This is a Foreign Key to `organizations.id`.<fk table='organizations' column='id'/> |
| overall_status | string | character varying | ✓ | - |
| discipline_scores | unknown | jsonb | ✓ | - |
| final_weighted_score | number | numeric | ✓ | - |
| final_weighted_percentage | number | numeric | ✓ | - |
| scoring_calculation | unknown | jsonb | ✓ | - |
| final_decision | string | character varying | ✓ | - |
| final_decision_by | string | uuid | ✓ | Note:
This is a Foreign Key to `user_management.user_id`.<fk table='user_management' column='user_id'/> |
| final_decision_at | string | timestamp with time zone | ✓ | - |
| final_decision_comments | string | text | ✓ | - |
| context_metadata | unknown | jsonb | ✓ | - |
| created_by | string | uuid | ✓ | Note:
This is a Foreign Key to `user_management.user_id`.<fk table='user_management' column='user_id'/> |
| created_at | string | timestamp with time zone | ✓ | - |
| due_date | string | date | ✓ | - |
| completed_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |
| updated_by | string | uuid | ✓ | Note:
This is a Foreign Key to `user_management.user_id`.<fk table='user_management' column='user_id'/> |

---

## external_api_configurations

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 11

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| api_name | string | text | ✗ | - |
| api_type | string | text | ✗ | - |
| endpoint_url | string | text | ✗ | - |
| api_key | string | text | ✗ | - |
| organization_id | string | text | ✓ | - |
| is_active | boolean | boolean | ✓ | - |
| description | string | text | ✓ | - |
| metadata | unknown | jsonb | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |

---

## external_party_document_instances

**Description:** Standardized External Party Documents - HTML content in html_content TEXT, schema in content_schema JSONB

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 58

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| document_context | string | character varying | ✗ | - |
| context_reference_id | string | character varying | ✓ | - |
| source_table | string | character varying | ✗ | - |
| source_template_id | string | uuid | ✗ | - |
| template_snapshot | unknown | jsonb | ✗ | - |
| discipline_code | string | character varying | ✗ | - |
| discipline_owner_id | string | uuid | ✓ | Note:
This is a Foreign Key to `user_management.user_id`.<fk table='user_management' column='user_id'/> |
| organization_id | string | uuid | ✓ | Note:
This is a Foreign Key to `organizations.id`.<fk table='organizations' column='id'/> |
| document_name | string | character varying | ✗ | - |
| document_description | string | text | ✓ | - |
| document_type | string | character varying | ✓ | - |
| assigned_to_party_id | string | uuid | ✓ | Optional UUID reference to external party. May reference contractors table, user_management, or other party tables. Not a foreign key to allow flexibility. The assigned_to_party_email field is the primary identifier. |
| assigned_to_party_email | string | character varying | ✗ | - |
| assigned_to_party_name | string | character varying | ✓ | - |
| assigned_to_party_org_name | string | character varying | ✓ | - |
| assigned_to_party_type | string | character varying | ✓ | - |
| created_by | string | uuid | ✓ | Note:
This is a Foreign Key to `user_management.user_id`.<fk table='user_management' column='user_id'/> |
| created_at | string | timestamp with time zone | ✓ | - |
| reviewed_before_issue_by | string | uuid | ✓ | Note:
This is a Foreign Key to `user_management.user_id`.<fk table='user_management' column='user_id'/> |
| reviewed_before_issue_at | string | timestamp with time zone | ✓ | - |
| pre_issue_review_notes | string | text | ✓ | - |
| issued_by | string | uuid | ✓ | Note:
This is a Foreign Key to `user_management.user_id`.<fk table='user_management' column='user_id'/> |
| issued_at | string | timestamp with time zone | ✓ | - |
| due_date | string | date | ✓ | - |
| assignment_instructions | string | text | ✓ | - |
| html_content | string | text | ✗ | - |
| form_schema | unknown | jsonb | ✓ | DEPRECATED: Use content_schema. Remove post-migration. |
| party_responses | unknown | jsonb | ✓ | - |
| response_metadata | unknown | jsonb | ✓ | - |
| started_at | string | timestamp with time zone | ✓ | - |
| last_saved_at | string | timestamp with time zone | ✓ | - |
| submitted_at | string | timestamp with time zone | ✓ | - |
| reviewed_after_submission_by | string | uuid | ✓ | Note:
This is a Foreign Key to `user_management.user_id`.<fk table='user_management' column='user_id'/> |
| reviewed_after_submission_at | string | timestamp with time zone | ✓ | - |
| post_submission_review_notes | string | text | ✓ | - |
| review_decision | string | character varying | ✓ | - |
| discipline_score | integer | integer | ✓ | - |
| discipline_max_score | integer | integer | ✓ | - |
| discipline_score_percentage | number | numeric | ✓ | - |
| score_breakdown | unknown | jsonb | ✓ | - |
| scoring_comments | string | text | ✓ | - |
| scored_by | string | uuid | ✓ | Note:
This is a Foreign Key to `user_management.user_id`.<fk table='user_management' column='user_id'/> |
| scored_at | string | timestamp with time zone | ✓ | - |
| revision_count | integer | integer | ✓ | - |
| revision_history | unknown | jsonb | ✓ | - |
| status | string | character varying | ✓ | - |
| access_token | string | character varying | ✓ | - |
| access_expires_at | string | timestamp with time zone | ✓ | - |
| access_revoked | boolean | boolean | ✓ | - |
| evaluation_package_id | string | uuid | ✓ | - |
| evaluation_package_name | string | character varying | ✓ | - |
| context_metadata | unknown | jsonb | ✓ | - |
| version | string | character varying | ✓ | - |
| is_active | boolean | boolean | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |
| updated_by | string | uuid | ✓ | Note:
This is a Foreign Key to `user_management.user_id`.<fk table='user_management' column='user_id'/> |
| content_schema | unknown | jsonb | ✓ | - |

---

## field_attribute_compliance

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 11

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| template_id | string | uuid | ✓ | Note:
This is a Foreign Key to `procurement_templates.id`.<fk table='procurement_templates' column='id'/> |
| procurement_order_id | string | uuid | ✓ | Note:
This is a Foreign Key to `procurement_orders.id`.<fk table='procurement_orders' column='id'/> |
| field_name | string | character varying | ✓ | - |
| attribute_type | string | character varying | ✓ | - |
| ai_action_taken | string | character varying | ✓ | - |
| confidence_score | number | numeric | ✓ | - |
| user_override | boolean | boolean | ✓ | - |
| enforcement_timestamp | string | timestamp without time zone | ✓ | - |
| workflow_execution_id | string | uuid | ✓ | - |
| organization_id | string | uuid | ✓ | Note:
This is a Foreign Key to `organizations.id`.<fk table='organizations' column='id'/> |

---

## financial_records

**Description:** Financial records management table for invoices, payments, expenses, contracts, budgets, and assets

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 19

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| type | string | character varying | ✗ | Record type: invoice, payment, expense, contract, budget, asset |
| reference | string | character varying | ✗ | Unique reference number for the financial record |
| description | string | text | ✗ | - |
| amount | number | numeric | ✗ | - |
| currency | string | character varying | ✓ | - |
| date | string | date | ✗ | - |
| due_date | string | date | ✓ | - |
| status | string | character varying | ✓ | Status: pending, approved, paid, overdue, cancelled |
| vendor | string | character varying | ✓ | - |
| project | string | character varying | ✓ | - |
| category | string | character varying | ✓ | - |
| created_by | string | uuid | ✓ | - |
| updated_by | string | uuid | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |
| active | boolean | boolean | ✓ | - |
| notes | string | text | ✓ | - |
| organization_id | string | uuid | ✓ | Note:
This is a Foreign Key to `organizations.id`.<fk table='organizations' column='id'/> |

---

## flowise_documents

**Description:** Local tracking of individual documents and loaders within Flowise document stores

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 22

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| document_store_id | string | uuid | ✗ | Reference to the document store containing this document

Note:
This is a Foreign Key to `document_stores.id`.<fk table='document_stores' column='id'/> |
| flowise_loader_id | string | text | ✗ | Flowise loader ID that processed this document |
| flowise_file_id | string | text | ✓ | Flowise file ID (if available) |
| document_name | string | text | ✗ | Display name for the document |
| original_filename | string | text | ✓ | Original filename when uploaded |
| file_size | integer | bigint | ✓ | File size in bytes |
| mime_type | string | text | ✓ | MIME type of the document |
| loader_name | string | text | ✓ | Human-readable name of the loader |
| loader_type | string | text | ✓ | Type of loader (pdfFile, textFile, etc.) |
| splitter_name | string | text | ✓ | Text splitter used for chunking |
| total_chunks | integer | integer | ✓ | Number of chunks created from this document |
| total_characters | integer | integer | ✓ | Total character count in the document |
| status | string | text | ✓ | Processing status in Flowise |
| uploaded_at | string | timestamp with time zone | ✓ | When the document was uploaded to Flowise |
| processed_at | string | timestamp with time zone | ✓ | When the document was processed/embedded |
| loader_config | unknown | jsonb | ✓ | Flowise loader configuration |
| document_metadata | unknown | jsonb | ✓ | Document metadata from Flowise |
| splitter_config | unknown | jsonb | ✓ | Text splitter configuration |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |
| last_synced_at | string | timestamp with time zone | ✓ | Last time this record was synced from Flowise |

---

## flowise_documents_with_stores

**Description:** View combining Flowise documents with their document store information

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 25

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✓ | Note:
This is a Primary Key.<pk/> |
| document_store_id | string | uuid | ✓ | Note:
This is a Foreign Key to `document_stores.id`.<fk table='document_stores' column='id'/> |
| flowise_loader_id | string | text | ✓ | - |
| flowise_file_id | string | text | ✓ | - |
| document_name | string | text | ✓ | - |
| original_filename | string | text | ✓ | - |
| file_size | integer | bigint | ✓ | - |
| mime_type | string | text | ✓ | - |
| loader_name | string | text | ✓ | - |
| loader_type | string | text | ✓ | - |
| splitter_name | string | text | ✓ | - |
| total_chunks | integer | integer | ✓ | - |
| total_characters | integer | integer | ✓ | - |
| status | string | text | ✓ | - |
| uploaded_at | string | timestamp with time zone | ✓ | - |
| processed_at | string | timestamp with time zone | ✓ | - |
| loader_config | unknown | jsonb | ✓ | - |
| document_metadata | unknown | jsonb | ✓ | - |
| splitter_config | unknown | jsonb | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |
| last_synced_at | string | timestamp with time zone | ✓ | - |
| store_name | string | text | ✓ | - |
| store_description | string | text | ✓ | - |
| store_metadata | unknown | jsonb | ✓ | - |

---

## flowise_record_manager

**Description:** Record Manager table for Flowise Document Store to track document chunks and prevent duplicates

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 6

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| uuid | string | uuid | ✗ | Primary key UUID

Note:
This is a Primary Key.<pk/> |
| key | string | text | ✗ | Unique identifier for the document chunk (typically hash of content + metadata) |
| group_id | string | text | ✓ | Group identifier for related documents (e.g., document store ID or page prefix) |
| updated_at | string | timestamp with time zone | ✓ | Timestamp when the record was last updated |
| created_at | string | timestamp with time zone | ✓ | Timestamp when the record was created |
| metadata | unknown | jsonb | ✓ | Additional metadata about the document chunk |

---

## form_completions

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 18

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| title | string | character varying | ✗ | - |
| description | string | text | ✓ | - |
| template_type | string | character varying | ✓ | - |
| status | string | character varying | ✗ | - |
| priority | string | character varying | ✓ | - |
| project_id | string | uuid | ✓ | - |
| project_name | string | character varying | ✓ | - |
| assigned_to | string | uuid | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |
| completed_date | string | timestamp with time zone | ✓ | - |
| created_by | string | uuid | ✓ | - |
| updated_by | string | uuid | ✓ | - |
| reference_number | string | character varying | ✓ | - |
| tags | array | text[] | ✓ | - |
| form_data | unknown | jsonb | ✓ | - |
| comments | string | text | ✓ | - |

---

## form_instances

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 23

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| template_id | string | uuid | ✓ | Note:
This is a Foreign Key to `governance_document_templates.id`.<fk table='governance_document_templates' column='id'/> |
| organization_name | string | text | ✓ | - |
| instance_name | string | text | ✗ | - |
| instance_slug | string | text | ✓ | - |
| source_file_name | string | text | ✗ | - |
| source_file_type | string | text | ✓ | - |
| source_file_size | integer | integer | ✓ | - |
| processed_data | unknown | jsonb | ✓ | - |
| submission_data | unknown | jsonb | ✓ | - |
| html_form | string | text | ✓ | - |
| json_form | unknown | jsonb | ✓ | - |
| processing_status | string | text | ✓ | - |
| version | integer | integer | ✓ | - |
| is_submitted | boolean | boolean | ✓ | - |
| submitted_by | string | text | ✓ | - |
| submitted_at | string | timestamp with time zone | ✓ | - |
| created_by | string | text | ✓ | - |
| updated_by | string | text | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |
| deleted_at | string | timestamp with time zone | ✓ | - |
| organization_id | string | uuid | ✓ | Note:
This is a Foreign Key to `organizations.id`.<fk table='organizations' column='id'/> |

---

## form_templates

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 13

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| template_name | string | text | ✗ | - |
| html_content | string | text | ✓ | - |
| json_schema | unknown | jsonb | ✓ | - |
| processing_status | string | text | ✓ | - |
| organization_name | string | text | ✓ | - |
| discipline_id | string | uuid | ✓ | Note:
This is a Foreign Key to `disciplines.id`.<fk table='disciplines' column='id'/> |
| discipline_name | string | text | ✓ | - |
| created_by | string | text | ✓ | - |
| created_at | string | timestamp without time zone | ✓ | - |
| updated_at | string | timestamp without time zone | ✓ | - |
| form_metadata | unknown | jsonb | ✓ | - |
| organization_id | string | uuid | ✓ | Note:
This is a Foreign Key to `organizations.id`.<fk table='organizations' column='id'/> |

---

## form_templates_audit

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 11

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| form_template_id | string | uuid | ✓ | - |
| action | string | text | ✗ | - |
| old_data | unknown | jsonb | ✓ | - |
| new_data | unknown | jsonb | ✓ | - |
| changed_by | string | text | ✓ | - |
| changed_at | string | timestamp with time zone | ✓ | - |
| user_role | string | text | ✓ | - |
| organization_id | string | uuid | ✓ | - |
| is_dev_mode | boolean | boolean | ✓ | - |
| user_id | string | uuid | ✓ | - |

---

## fuel_lubricants

**Description:** ✅ MASTER GUIDE COMPLIANT: Organization-isolated fuel/lubricants management
with creator ownership, audit trails, and approval workflow patterns.
Reference: procurement_templates table standard.

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 55

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| name | string | character varying | ✗ | - |
| product_code | string | character varying | ✓ | - |
| category | string | character varying | ✗ | - |
| subtype | string | character varying | ✓ | - |
| supplier_id | integer | integer | ✓ | Note:
This is a Foreign Key to `suppliers.id`.<fk table='suppliers' column='id'/> |
| supplier_name | string | character varying | ✓ | - |
| supplier_contact | string | character varying | ✓ | - |
| supplier_email | string | character varying | ✓ | - |
| viscosity | string | character varying | ✓ | - |
| viscosity_class | string | character varying | ✓ | - |
| grade | string | character varying | ✓ | - |
| specification_standard | string | character varying | ✓ | - |
| specifications | unknown | jsonb | ✓ | JSON object containing detailed technical specifications |
| current_stock_quantity | number | numeric | ✓ | - |
| minimum_stock_level | number | numeric | ✓ | - |
| maximum_stock_level | number | numeric | ✓ | - |
| unit_of_measure | string | character varying | ✓ | - |
| reorder_quantity | number | numeric | ✓ | - |
| quality_status | string | character varying | ✓ | - |
| compliance_certificate | string | character varying | ✓ | - |
| batch_number | string | character varying | ✓ | - |
| expiry_date | string | date | ✓ | - |
| production_date | string | date | ✓ | - |
| purchase_price | number | numeric | ✓ | - |
| selling_price | number | numeric | ✓ | - |
| purchase_date | string | date | ✓ | - |
| purchase_order_number | string | character varying | ✓ | - |
| invoice_number | string | character varying | ✓ | - |
| consumption_rate | number | numeric | ✓ | - |
| last_used_date | string | date | ✓ | - |
| total_consumed | number | numeric | ✓ | - |
| approval_status | string | character varying | ✓ | - |
| approved_by | string | uuid | ✓ | - |
| approval_date | string | timestamp with time zone | ✓ | - |
| rejection_reason | string | text | ✓ | - |
| equipment_assigned | unknown | jsonb | ✓ | JSON array of equipment IDs compatible with this fuel/lubricant |
| project_assigned | string | character varying | ✓ | - |
| storage_location | string | character varying | ✓ | - |
| storage_temperature | string | character varying | ✓ | - |
| storage_conditions | string | text | ✓ | - |
| scheduled_changes | unknown | jsonb | ✓ | JSON object with change schedules and reminders |
| last_change_date | string | date | ✓ | - |
| change_frequency_days | integer | integer | ✓ | - |
| hazard_classification | string | character varying | ✓ | - |
| sds_url | string | character varying | ✓ | - |
| environmental_impact | string | character varying | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |
| created_by | string | uuid | ✓ | - |
| updated_by | string | uuid | ✓ | - |
| active | boolean | boolean | ✓ | - |
| archived | boolean | boolean | ✓ | - |
| critical_item | boolean | boolean | ✓ | - |
| organization_id | string | uuid | ✓ | - |

---

## governance_approval_instances

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 23

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| matrix_id | string | uuid | ✓ | Note:
This is a Foreign Key to `governance_approval_matrices.id`.<fk table='governance_approval_matrices' column='id'/> |
| document_id | string | uuid | ✓ | - |
| document_title | string | text | ✗ | - |
| document_number | string | text | ✓ | - |
| department_code | string | text | ✗ | - |
| requester_id | string | text | ✓ | - |
| requester_name | string | text | ✗ | - |
| current_level | integer | integer | ✓ | - |
| status | string | text | ✓ | - |
| started_at | string | timestamp with time zone | ✓ | - |
| deadline_at | string | timestamp with time zone | ✓ | - |
| escalated_at | string | timestamp with time zone | ✓ | - |
| approved_at | string | timestamp with time zone | ✓ | - |
| approved_by | string | text | ✓ | - |
| rejection_reason | string | text | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |
| document_version_major | integer | integer | ✓ | - |
| document_version_minor | integer | integer | ✓ | - |
| document_version_revision | string | text | ✓ | - |
| organization_id | string | uuid | ✓ | - |
| created_by | string | uuid | ✓ | - |

---

## governance_approval_matrices

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 13

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| organization_id | string | text | ✓ | - |
| department_code | string | text | ✗ | - |
| document_type | string | text | ✗ | - |
| approval_levels | unknown | jsonb | ✗ | - |
| auto_approval_threshold | number | numeric | ✓ | - |
| deadline_days | integer | integer | ✓ | - |
| escalation_rules | unknown | jsonb | ✓ | - |
| email_templates | unknown | jsonb | ✓ | - |
| is_active | boolean | boolean | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |
| created_by | string | uuid | ✓ | - |

---

## governance_approval_steps

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 17

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| approval_instance_id | string | uuid | ✗ | Note:
This is a Foreign Key to `governance_approval_instances.id`.<fk table='governance_approval_instances' column='id'/> |
| step_number | integer | integer | ✗ | - |
| approver_role | string | text | ✗ | - |
| approver_user_id | string | text | ✓ | - |
| approver_name | string | text | ✓ | - |
| status | string | text | ✓ | - |
| action_taken | string | text | ✓ | - |
| action_timestamp | string | timestamp with time zone | ✓ | - |
| notified_at | string | timestamp with time zone | ✓ | - |
| reminder_sent_at | string | timestamp with time zone | ✓ | - |
| comments | string | text | ✓ | - |
| attachment_urls | array | text[] | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |
| organization_id | string | uuid | ✓ | - |
| created_by | string | uuid | ✓ | - |

---

## governance_document_templates

**Description:** Standardized Governance Form Templates - HTML content in html_content TEXT, schema in content_schema JSONB

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 29

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| organization_id | string | uuid | ✓ | Note:
This is a Foreign Key to `organizations.id`.<fk table='organizations' column='id'/> |
| organization_name | string | text | ✓ | - |
| discipline_id | string | uuid | ✓ | Note:
This is a Foreign Key to `disciplines.id`.<fk table='disciplines' column='id'/> |
| discipline_name | string | text | ✓ | - |
| template_name | string | text | ✗ | - |
| template_slug | string | text | ✓ | - |
| html_content | string | text | ✓ | - |
| json_schema | unknown | jsonb | ✓ | DEPRECATED: Use content_schema. Remove post-migration. |
| form_metadata | unknown | jsonb | ✓ | - |
| source_file_name | string | text | ✓ | - |
| source_file_type | string | text | ✓ | - |
| extracted_fields_count | integer | integer | ✓ | - |
| extraction_method | string | text | ✓ | - |
| processing_status | string | text | ✓ | - |
| version | integer | integer | ✓ | - |
| parent_template_id | string | uuid | ✓ | Note:
This is a Foreign Key to `governance_document_templates.id`.<fk table='governance_document_templates' column='id'/> |
| is_default | boolean | boolean | ✓ | - |
| is_active | boolean | boolean | ✓ | - |
| created_by | string | text | ✓ | - |
| updated_by | string | text | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |
| deleted_at | string | timestamp with time zone | ✓ | - |
| content_schema | unknown | jsonb | ✓ | - |
| processing_method | string | text | ✓ | Method used to process the document (e.g., structured_excel_parsing, ai_generated) |
| document_type | string | text | ✓ | Document type selected during upload (e.g., PO, Contract, SOW) |
| document_type_label | string | text | ✓ | Human-readable label for the document type |
| source_governance_template_id | string | uuid | ✓ | - |

---

## governance_document_templates_backup_20251121

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 29

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✓ | - |
| organization_id | string | uuid | ✓ | - |
| organization_name | string | text | ✓ | - |
| discipline_id | string | uuid | ✓ | - |
| discipline_name | string | text | ✓ | - |
| template_name | string | text | ✓ | - |
| template_slug | string | text | ✓ | - |
| html_content | string | text | ✓ | - |
| json_schema | unknown | jsonb | ✓ | - |
| form_metadata | unknown | jsonb | ✓ | - |
| source_file_name | string | text | ✓ | - |
| source_file_type | string | text | ✓ | - |
| extracted_fields_count | integer | integer | ✓ | - |
| extraction_method | string | text | ✓ | - |
| processing_status | string | text | ✓ | - |
| version | integer | integer | ✓ | - |
| parent_template_id | string | uuid | ✓ | - |
| is_default | boolean | boolean | ✓ | - |
| is_active | boolean | boolean | ✓ | - |
| created_by | string | text | ✓ | - |
| updated_by | string | text | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |
| deleted_at | string | timestamp with time zone | ✓ | - |
| content_schema | unknown | jsonb | ✓ | - |
| processing_method | string | text | ✓ | - |
| document_type | string | text | ✓ | - |
| document_type_label | string | text | ✓ | - |
| source_governance_template_id | string | uuid | ✓ | - |

---

## governance_document_templates-old

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 19

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| name | string | character varying | ✗ | - |
| description | string | text | ✓ | - |
| category | string | character varying | ✗ | - |
| template_type | string | character varying | ✓ | - |
| fields | unknown | jsonb | ✓ | - |
| settings | unknown | jsonb | ✓ | - |
| content | string | text | ✓ | - |
| status | string | character varying | ✓ | - |
| version | integer | integer | ✓ | - |
| usage_count | integer | integer | ✓ | - |
| created_by | string | uuid | ✓ | - |
| updated_by | string | uuid | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |
| organizations | unknown | jsonb | ✓ | - |
| disciplines | unknown | jsonb | ✓ | - |
| sectors | unknown | jsonb | ✓ | - |
| metadata | unknown | jsonb | ✓ | - |

---

## governance_template_usage

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 6

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| template_id | string | uuid | ✓ | Note:
This is a Foreign Key to `governance_document_templates-old.id`.<fk table='governance_document_templates-old' column='id'/> |
| user_id | string | uuid | ✓ | - |
| action | string | character varying | ✗ | - |
| metadata | unknown | jsonb | ✓ | - |
| used_at | string | timestamp with time zone | ✓ | - |

---

## hitl_performance_metrics

**Description:** Performance metrics and analytics for HITL task resolutions

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 13

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| task_id | string | uuid | ✓ | Reference to the resolved HITL task

Note:
This is a Foreign Key to `tasks.id`.<fk table='tasks' column='id'/> |
| resolver_id | string | uuid | ✓ | User who resolved the HITL task |
| discipline | string | text | ✓ | - |
| intervention_type | string | text | ✓ | - |
| decision | string | text | ✓ | - |
| ai_confidence_before | number | numeric | ✓ | - |
| human_confidence_after | number | numeric | ✓ | - |
| decision_alignment | boolean | boolean | ✓ | Whether human decision aligned with AI recommendation |
| time_to_resolution_minutes | integer | integer | ✓ | Time taken to resolve the task in minutes |
| quality_rating | integer | integer | ✓ | Human-rated quality of the resolution (1-5) |
| complexity_level | string | text | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |

---

## imported_emails_with_placeholder_users

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 9

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| email_id | string | uuid | ✓ | Note:
This is a Primary Key.<pk/> |
| subject | string | text | ✓ | - |
| sender_email | string | character varying | ✓ | - |
| recipient_email | string | character varying | ✓ | - |
| sent_date | string | timestamp with time zone | ✓ | - |
| user_id | string | uuid | ✓ | Note:
This is a Primary Key.<pk/> |
| user_email | string | text | ✓ | - |
| user_active | boolean | boolean | ✓ | - |
| is_placeholder_user | boolean | boolean | ✓ | - |

---

## inspection_items

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 17

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | integer | integer | ✗ | Note:
This is a Primary Key.<pk/> |
| inspection_id | string | character varying | ✗ | Note:
This is a Foreign Key to `inspections.inspection_id`.<fk table='inspections' column='inspection_id'/> |
| item_id | string | character varying | ✗ | - |
| item_type | string | character varying | ✗ | - |
| description | string | text | ✓ | - |
| location | string | character varying | ✓ | - |
| status | string | character varying | ✓ | - |
| priority | string | character varying | ✓ | - |
| assigned_to | string | character varying | ✓ | - |
| due_date | string | date | ✓ | - |
| completed_date | string | date | ✓ | - |
| notes | string | text | ✓ | - |
| media_urls | unknown | jsonb | ✓ | - |
| created_at | string | timestamp without time zone | ✓ | - |
| updated_at | string | timestamp without time zone | ✓ | - |
| organization_id | string | uuid | ✓ | - |
| user_id | string | uuid | ✓ | - |

---

## inspection_media

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 17

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | integer | integer | ✗ | Note:
This is a Primary Key.<pk/> |
| media_id | string | character varying | ✗ | - |
| inspection_id | string | character varying | ✓ | - |
| inspection_item_id | string | character varying | ✓ | - |
| defect_id | string | character varying | ✓ | - |
| file_name | string | character varying | ✗ | - |
| file_type | string | character varying | ✗ | - |
| file_size | integer | integer | ✓ | - |
| file_url | string | text | ✗ | - |
| storage_path | string | text | ✓ | - |
| description | string | text | ✓ | - |
| tags | unknown | jsonb | ✓ | - |
| uploaded_by | string | character varying | ✓ | - |
| upload_date | string | timestamp without time zone | ✓ | - |
| created_at | string | timestamp without time zone | ✓ | - |
| updated_at | string | timestamp without time zone | ✓ | - |
| organization_id | string | uuid | ✓ | Note:
This is a Foreign Key to `organizations.id`.<fk table='organizations' column='id'/> |

---

## inspections

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 17

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | integer | integer | ✗ | Note:
This is a Primary Key.<pk/> |
| inspection_id | string | character varying | ✗ | - |
| project_id | string | character varying | ✗ | - |
| inspection_type | string | character varying | ✗ | - |
| scheduled_date | string | date | ✗ | - |
| completed_date | string | date | ✓ | - |
| inspector_id | string | character varying | ✓ | - |
| facility | string | character varying | ✓ | - |
| status | string | character varying | ✓ | - |
| priority | string | character varying | ✓ | - |
| notes | string | text | ✓ | - |
| findings_count | integer | integer | ✓ | - |
| created_at | string | timestamp without time zone | ✓ | - |
| updated_at | string | timestamp without time zone | ✓ | - |
| created_by | string | character varying | ✓ | - |
| updated_by | string | character varying | ✓ | - |
| organization_id | string | uuid | ✓ | - |

---

## integration_sources

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 20

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| source_id | string | character varying | ✗ | - |
| name | string | character varying | ✗ | - |
| description | string | text | ✓ | - |
| base_url | string | character varying | ✓ | - |
| api_key_encrypted | string | text | ✓ | - |
| username_encrypted | string | text | ✓ | - |
| password_encrypted | string | text | ✓ | - |
| integration_type | string | character varying | ✗ | - |
| status | string | character varying | ✓ | - |
| config | unknown | jsonb | ✓ | - |
| last_sync_at | string | timestamp with time zone | ✓ | - |
| last_successful_sync_at | string | timestamp with time zone | ✓ | - |
| last_error | string | text | ✓ | - |
| sync_interval_minutes | integer | integer | ✓ | - |
| rate_limit_per_minute | integer | integer | ✓ | - |
| timeout_seconds | integer | integer | ✓ | - |
| retry_attempts | integer | integer | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |

---

## integration_sync_history

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 14

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| integration_source_id | string | uuid | ✓ | Note:
This is a Foreign Key to `integration_sources.id`.<fk table='integration_sources' column='id'/> |
| sync_type | string | character varying | ✓ | - |
| status | string | character varying | ✗ | - |
| records_processed | integer | integer | ✓ | - |
| records_created | integer | integer | ✓ | - |
| records_updated | integer | integer | ✓ | - |
| records_failed | integer | integer | ✓ | - |
| start_time | string | timestamp with time zone | ✗ | - |
| end_time | string | timestamp with time zone | ✓ | - |
| duration_seconds | integer | integer | ✓ | - |
| error_message | string | text | ✓ | - |
| sync_metadata | unknown | jsonb | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |

---

## internal_notifications

**Description:** Internal notification system to avoid email dependency

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 15

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| user_id | string | uuid | ✓ | - |
| type | string | character varying | ✗ | - |
| category | string | character varying | ✓ | - |
| title | string | character varying | ✗ | - |
| message | string | text | ✗ | - |
| approval_instance_id | string | uuid | ✓ | Note:
This is a Foreign Key to `approval_instances.id`.<fk table='approval_instances' column='id'/> |
| approval_step_id | string | uuid | ✓ | Note:
This is a Foreign Key to `approval_steps.id`.<fk table='approval_steps' column='id'/> |
| priority | string | character varying | ✓ | - |
| is_read | boolean | boolean | ✓ | - |
| read_at | string | timestamp with time zone | ✓ | - |
| action_required | boolean | boolean | ✓ | - |
| action_url | string | character varying | ✓ | Direct link to the approval action page |
| created_at | string | timestamp with time zone | ✓ | - |
| expires_at | string | timestamp with time zone | ✓ | - |

---

## job_descriptions

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 18

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| title | string | text | ✗ | - |
| location | string | text | ✓ | - |
| employment_type | string | text | ✓ | - |
| salary_range_min | number | numeric | ✓ | - |
| salary_range_max | number | numeric | ✓ | - |
| job_description | string | text | ✓ | - |
| requirements | string | text | ✓ | - |
| responsibilities | string | text | ✓ | - |
| benefits | string | text | ✓ | - |
| application_deadline | string | date | ✓ | - |
| contact_person | string | text | ✓ | - |
| status | string | text | ✓ | - |
| created_by | string | uuid | ✓ | - |
| updated_by | string | uuid | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |
| discipline | string | text | ✓ | Discipline or division (formerly department) |

---

## legal_reviews

**Description:** Legal reviews and compliance checks for contracts and documents

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 15

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| title | string | character varying | ✗ | - |
| description | string | text | ✓ | - |
| review_type | string | character varying | ✓ | - |
| document_type | string | character varying | ✓ | - |
| urgency | string | character varying | ✓ | - |
| status | string | character varying | ✓ | - |
| assigned_to | string | uuid | ✓ | - |
| organization_id | string | uuid | ✓ | Note:
This is a Foreign Key to `organizations.id`.<fk table='organizations' column='id'/> |
| project_id | string | uuid | ✓ | Note:
This is a Foreign Key to `projects.id`.<fk table='projects' column='id'/> |
| due_date | string | timestamp with time zone | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |
| created_by | string | uuid | ✓ | - |
| updated_by | string | uuid | ✓ | - |

---

## limits_of_authority

**Description:** Defines organizational limits of authority for document approvals

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 13

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| organization_id | string | uuid | ✗ | Organization this limit applies to

Note:
This is a Foreign Key to `organizations.id`.<fk table='organizations' column='id'/> |
| department_code | string | character varying | ✓ | Department code (optional - null means applies to all) |
| document_type | string | character varying | ✗ | Type of document (procurement_order, work_order, etc.) |
| min_amount | number | numeric | ✓ | Minimum amount threshold (inclusive) |
| max_amount | number | numeric | ✓ | Maximum amount threshold (exclusive) |
| required_approvals | unknown | jsonb | ✗ | JSON array of required approval roles |
| conditions | unknown | jsonb | ✓ | Additional conditions for approval routing |
| is_active | boolean | boolean | ✓ | - |
| created_by | string | uuid | ✓ | Note:
This is a Foreign Key to `user_profiles.user_id`.<fk table='user_profiles' column='user_id'/> |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |
| updated_by | string | uuid | ✓ | Note:
This is a Foreign Key to `user_profiles.user_id`.<fk table='user_profiles' column='user_id'/> |

---

## llm_configurations

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 13

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | character varying | ✗ | Note:
This is a Primary Key.<pk/> |
| name | string | character varying | ✗ | - |
| provider | string | character varying | ✗ | - |
| model | string | character varying | ✗ | - |
| api_key | string | character varying | ✓ | - |
| status | string | character varying | ✗ | - |
| usage_count | integer | integer | ✓ | - |
| last_used | string | timestamp without time zone | ✓ | - |
| created_at | string | timestamp without time zone | ✗ | - |
| updated_at | string | timestamp without time zone | ✗ | - |
| created_by | string | character varying | ✓ | - |
| updated_by | string | character varying | ✓ | - |
| purposes | array | text[] | ✓ | - |

---

## llm_document_type_mappings

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 10

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | integer | integer | ✗ | Note:
This is a Primary Key.<pk/> |
| llm_configuration_id | string | character varying | ✓ | Note:
This is a Foreign Key to `llm_configurations.id`.<fk table='llm_configurations' column='id'/> |
| document_type | string | character varying | ✗ | - |
| analysis_type | string | character varying | ✗ | - |
| created_at | string | timestamp without time zone | ✗ | - |
| updated_at | string | timestamp without time zone | ✗ | - |
| file_format | string | character varying | ✓ | - |
| default_format | boolean | boolean | ✓ | - |
| organization_id | string | uuid | ✓ | - |
| user_id | string | uuid | ✓ | - |

---

## llm_functions

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 10

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| name | string | text | ✗ | - |
| description | string | text | ✓ | - |
| function_type | string | public.llm_function_type | ✗ | - |
| model_name | string | text | ✗ | - |
| api_config | unknown | jsonb | ✗ | - |
| is_active | boolean | boolean | ✓ | - |
| created_at | string | timestamp with time zone | ✗ | - |
| updated_at | string | timestamp with time zone | ✗ | - |
| created_by | string | uuid | ✓ | - |

---

## logistics_alerts

**Description:** System-generated alerts and notifications

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 24

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| alert_type | string | character varying | ✗ | - |
| severity | string | character varying | ✗ | - |
| shipment_id | string | uuid | ✓ | Note:
This is a Foreign Key to `logistics_shipments.id`.<fk table='logistics_shipments' column='id'/> |
| vessel_id | string | uuid | ✓ | Note:
This is a Foreign Key to `vessels.id`.<fk table='vessels' column='id'/> |
| container_id | string | uuid | ✓ | Note:
This is a Foreign Key to `containers.id`.<fk table='containers' column='id'/> |
| alert_title | string | character varying | ✗ | - |
| alert_description | string | text | ✓ | - |
| alert_timestamp | string | timestamp with time zone | ✓ | - |
| status | string | character varying | ✓ | - |
| acknowledged_at | string | timestamp with time zone | ✓ | - |
| acknowledged_by | string | uuid | ✓ | - |
| resolved_at | string | timestamp with time zone | ✓ | - |
| resolved_by | string | uuid | ✓ | - |
| action_required | boolean | boolean | ✓ | - |
| action_description | string | text | ✓ | - |
| due_date | string | timestamp with time zone | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |
| company_id | string | uuid | ✓ | - |
| organisation_id | string | uuid | ✓ | - |
| project_id | string | uuid | ✓ | - |
| organization_id | string | uuid | ✓ | - |
| user_id | string | uuid | ✓ | - |

---

## logistics_approval_steps

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 11

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| workflow_id | string | uuid | ✓ | Note:
This is a Foreign Key to `logistics_approval_workflows.id`.<fk table='logistics_approval_workflows' column='id'/> |
| step_number | integer | integer | ✗ | - |
| step_type | string | text | ✗ | - |
| assigned_to | string | uuid | ✓ | - |
| status | string | text | ✓ | - |
| decision | string | text | ✓ | - |
| comments | string | text | ✓ | - |
| decision_at | string | timestamp with time zone | ✓ | - |
| time_spent_minutes | integer | integer | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |

---

## logistics_approval_workflows

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 12

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| document_id | string | uuid | ✓ | Note:
This is a Foreign Key to `logistics_documents.id`.<fk table='logistics_documents' column='id'/> |
| workflow_type | string | text | ✗ | - |
| current_step | string | text | ✗ | - |
| status | string | text | ✓ | - |
| priority | string | text | ✓ | - |
| assigned_to | string | uuid | ✓ | - |
| assigned_at | string | timestamp with time zone | ✓ | - |
| due_date | string | timestamp with time zone | ✓ | - |
| escalation_level | integer | integer | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |

---

## logistics_context_data

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 20

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| procurement_order_id | string | uuid | ✓ | - |
| orderid | string | uuid | ✓ | - |
| ordernumber | string | text | ✓ | - |
| orderdate | string | timestamp with time zone | ✓ | - |
| exporterdetails | unknown | jsonb | ✓ | - |
| importerdetails | unknown | jsonb | ✓ | - |
| cargodescription | string | text | ✓ | - |
| hscode | string | text | ✓ | - |
| quantity | number | numeric | ✓ | - |
| unit | string | text | ✓ | - |
| value | number | numeric | ✓ | - |
| currency | string | text | ✓ | - |
| weight | number | numeric | ✓ | - |
| deliveryterms | string | text | ✓ | - |
| transportmode | string | text | ✓ | - |
| deliveryaddress | unknown | jsonb | ✓ | - |
| lastupdated | string | timestamp with time zone | ✓ | - |
| source | string | text | ✓ | - |
| exportdeclarationrequired | boolean | boolean | ✓ | - |

---

## logistics_coordination_monitor

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 11

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| task_id | string | uuid | ✓ | Note:
This is a Primary Key.<pk/> |
| title | string | character varying | ✓ | - |
| task_status | string | character varying | ✓ | - |
| priority | string | character varying | ✓ | - |
| assigned_to_discipline | string | text | ✓ | - |
| procurement_order_id | string | uuid | ✓ | Note:
This is a Foreign Key to `procurement_orders.id`.<fk table='procurement_orders' column='id'/> |
| procurement_description | string | text | ✓ | - |
| documents_generated | integer | bigint | ✓ | - |
| last_document_generated | string | timestamp with time zone | ✓ | - |
| total_messages | integer | bigint | ✓ | - |
| last_message_date | string | timestamp with time zone | ✓ | - |

---

## logistics_document_versions

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 10

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| document_id | string | uuid | ✓ | Note:
This is a Foreign Key to `logistics_documents.id`.<fk table='logistics_documents' column='id'/> |
| version_number | integer | integer | ✗ | - |
| content | unknown | jsonb | ✓ | - |
| metadata | unknown | jsonb | ✓ | - |
| generated_by_ai | boolean | boolean | ✓ | - |
| ai_model | string | text | ✓ | - |
| ai_confidence | number | numeric | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| created_by | string | uuid | ✓ | - |

---

## logistics_documents

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 12

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| procurement_order_id | string | uuid | ✓ | Note:
This is a Foreign Key to `procurement_orders.id`.<fk table='procurement_orders' column='id'/> |
| document_type | string | text | ✗ | - |
| direction | string | text | ✗ | - |
| content | string | text | ✗ | - |
| metadata | unknown | jsonb | ✓ | - |
| status | string | text | ✓ | - |
| shared_with | string | text | ✓ | - |
| shared_at | string | timestamp with time zone | ✓ | - |
| generated_by | string | uuid | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |

---

## logistics_shipments

**Description:** High-level shipment records

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 36

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| shipment_number | string | character varying | ✗ | - |
| shipment_name | string | character varying | ✓ | - |
| shipment_type | string | character varying | ✓ | - |
| shipper_name | string | character varying | ✓ | - |
| shipper_address | string | text | ✓ | - |
| consignee_name | string | character varying | ✓ | - |
| consignee_address | string | text | ✓ | - |
| freight_forwarder | string | character varying | ✓ | - |
| origin_port | string | character varying | ✓ | - |
| destination_port | string | character varying | ✓ | - |
| transit_ports | array | text[] | ✓ | - |
| booking_date | string | date | ✓ | - |
| planned_departure_date | string | date | ✓ | - |
| actual_departure_date | string | date | ✓ | - |
| planned_arrival_date | string | date | ✓ | - |
| actual_arrival_date | string | date | ✓ | - |
| total_value | number | numeric | ✓ | - |
| currency | string | character varying | ✓ | - |
| incoterms | string | character varying | ✓ | - |
| payment_terms | string | character varying | ✓ | - |
| shipment_status | string | character varying | ✓ | - |
| priority_level | string | character varying | ✓ | - |
| documents_complete | boolean | boolean | ✓ | - |
| customs_cleared | boolean | boolean | ✓ | - |
| insurance_reference | string | character varying | ✓ | - |
| notes | string | text | ✓ | - |
| special_instructions | string | text | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |
| created_by | string | uuid | ✓ | - |
| is_active | boolean | boolean | ✓ | - |
| company_id | string | uuid | ✓ | - |
| organisation_id | string | uuid | ✓ | - |
| project_id | string | uuid | ✓ | - |
| organization_id | string | uuid | ✓ | - |

---

## maintenance_assets

**Description:** Equipment and plant assets for maintenance tracking

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 20

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| name | string | character varying | ✗ | - |
| type | string | character varying | ✗ | - |
| manufacturer | string | character varying | ✓ | - |
| model | string | character varying | ✓ | - |
| serial_number | string | character varying | ✓ | - |
| year | integer | integer | ✓ | - |
| location | string | character varying | ✓ | - |
| status | string | character varying | ✓ | - |
| description | string | text | ✓ | - |
| purchase_date | string | date | ✓ | - |
| purchase_cost | number | numeric | ✓ | - |
| warranty_expiry | string | date | ✓ | - |
| last_maintenance | string | date | ✓ | - |
| next_due | string | date | ✓ | - |
| user_id | string | uuid | ✓ | - |
| project_id | string | uuid | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |
| organization_id | string | uuid | ✓ | - |

---

## maintenance_history

**Description:** Historical record of completed maintenance

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 17

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| asset_id | string | uuid | ✓ | Note:
This is a Foreign Key to `maintenance_assets.id`.<fk table='maintenance_assets' column='id'/> |
| work_order_id | string | uuid | ✓ | Note:
This is a Foreign Key to `maintenance_work_orders.id`.<fk table='maintenance_work_orders' column='id'/> |
| schedule_id | string | uuid | ✓ | Note:
This is a Foreign Key to `maintenance_schedules.id`.<fk table='maintenance_schedules' column='id'/> |
| maintenance_type | string | character varying | ✗ | - |
| description | string | text | ✗ | - |
| performed_by | string | uuid | ✓ | - |
| performed_by_name | string | character varying | ✓ | - |
| performed_date | string | date | ✗ | - |
| hours_spent | number | numeric | ✓ | - |
| cost | number | numeric | ✓ | - |
| parts_used | string | text | ✓ | - |
| notes | string | text | ✓ | - |
| project_id | string | uuid | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| organization_id | string | uuid | ✓ | - |
| user_id | string | uuid | ✓ | - |

---

## maintenance_schedules

**Description:** Scheduled maintenance for assets

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 20

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| asset_id | string | uuid | ✓ | Note:
This is a Foreign Key to `maintenance_assets.id`.<fk table='maintenance_assets' column='id'/> |
| asset_name | string | character varying | ✗ | - |
| maintenance_type | string | character varying | ✗ | - |
| frequency | integer | integer | ✗ | - |
| frequency_unit | string | character varying | ✓ | - |
| description | string | text | ✗ | - |
| last_completed | string | date | ✓ | - |
| next_due | string | date | ✓ | - |
| status | string | character varying | ✓ | - |
| assigned_to | string | uuid | ✓ | - |
| assigned_to_name | string | character varying | ✓ | - |
| created_by | string | uuid | ✓ | - |
| estimated_hours | number | numeric | ✓ | - |
| cost_per_service | number | numeric | ✓ | - |
| instructions | string | text | ✓ | - |
| project_id | string | uuid | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |
| organization_id | string | uuid | ✓ | - |

---

## maintenance_work_orders

**Description:** Work orders for maintenance tasks

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 23

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| asset_id | string | uuid | ✓ | Note:
This is a Foreign Key to `maintenance_assets.id`.<fk table='maintenance_assets' column='id'/> |
| asset_name | string | character varying | ✗ | - |
| type | string | character varying | ✗ | - |
| priority | string | character varying | ✓ | - |
| status | string | character varying | ✓ | - |
| title | string | character varying | ✗ | - |
| description | string | text | ✗ | - |
| assigned_to | string | uuid | ✓ | - |
| assigned_to_name | string | character varying | ✓ | - |
| created_by | string | uuid | ✓ | - |
| due_date | string | date | ✓ | - |
| start_date | string | date | ✓ | - |
| completion_date | string | date | ✓ | - |
| estimated_hours | number | numeric | ✓ | - |
| actual_hours | number | numeric | ✓ | - |
| cost | number | numeric | ✓ | - |
| parts_used | string | text | ✓ | - |
| notes | string | text | ✓ | - |
| project_id | string | uuid | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |
| organization_id | string | uuid | ✓ | - |

---

## master_engineering_templates

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 28

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| template_name | string | character varying | ✗ | - |
| template_description | string | text | ✓ | - |
| discipline | string | character varying | ✗ | - |
| template_category | string | character varying | ✗ | - |
| template_type | string | character varying | ✗ | - |
| risk_level | string | character varying | ✓ | - |
| status | string | character varying | ✓ | - |
| html_content | string | text | ✓ | - |
| json_content | unknown | jsonb | ✓ | - |
| file_attachments | unknown | jsonb | ✓ | - |
| tags | array | text[] | ✓ | - |
| version | integer | integer | ✓ | - |
| is_active | boolean | boolean | ✓ | - |
| is_latest | boolean | boolean | ✓ | - |
| project_id | string | uuid | ✓ | Note:
This is a Foreign Key to `projects.id`.<fk table='projects' column='id'/> |
| approval_required | boolean | boolean | ✓ | - |
| approved_by | string | uuid | ✓ | - |
| approved_at | string | timestamp with time zone | ✓ | - |
| published_to_procurement_at | string | timestamp with time zone | ✓ | - |
| dcs_document_id | string | character varying | ✓ | - |
| dcs_version | string | character varying | ✓ | - |
| organization_id | string | uuid | ✗ | - |
| company_id | string | uuid | ✗ | - |
| created_by | string | uuid | ✓ | - |
| updated_by | string | uuid | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |

---

## master_templates

**Description:** Approved organizational template standards for procurement documents

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 14

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| template_name | string | character varying | ✗ | - |
| template_type | string | character varying | ✗ | - |
| procurement_category | string | character varying | ✗ | - |
| category_code | string | character varying | ✓ | - |
| status | string | character varying | ✗ | - |
| content | unknown | jsonb | ✓ | - |
| approval_workflow | unknown | jsonb | ✓ | - |
| version | integer | integer | ✓ | - |
| is_active | boolean | boolean | ✓ | - |
| tags | array | text[] | ✓ | - |
| language_support | array | character varying[] | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |

---

## match_all_documents

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 4

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| source_table | string | text | ✓ | - |
| id | string | text | ✓ | - |
| content | string | text | ✓ | - |
| similarity | number | double precision | ✓ | - |

---

## materials

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 7

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| name | string | text | ✗ | - |
| type | string | text | ✗ | - |
| specifications | unknown | jsonb | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| organization_id | string | uuid | ✓ | - |
| user_id | string | uuid | ✓ | - |

---

## migration_rename_log

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 6

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | integer | integer | ✗ | Note:
This is a Primary Key.<pk/> |
| old_table_name | string | text | ✓ | - |
| new_table_name | string | text | ✓ | - |
| rename_status | string | text | ✓ | - |
| error_message | string | text | ✓ | - |
| renamed_at | string | timestamp without time zone | ✓ | - |

---

## migration_validation_results

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 6

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | integer | integer | ✗ | Note:
This is a Primary Key.<pk/> |
| check_name | string | text | ✓ | - |
| check_type | string | text | ✓ | - |
| status | string | text | ✓ | - |
| details | string | text | ✓ | - |
| checked_at | string | timestamp without time zone | ✓ | - |

---

## modal_configurations

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 25

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Unique identifier for the modal configuration

Note:
This is a Primary Key.<pk/> |
| modal_key | string | text | ✓ | Unique, human-readable key used for registration and triggering (e.g., "RiskAssessmentModal") |
| display_name | string | text | ✓ | User-friendly name shown in the UI (e.g., "Risk Assessment") |
| component_path | string | text | ✓ | The dynamic import path for the React component file (e.g., "@pages/2400-safety/components/modals/2400-RiskAssessmentModal.js") |
| description | string | text | ✓ | Optional text describing the modal's purpose |
| target_page_prefix | string | text | ✓ | The 4-digit page prefix the modal is primarily associated with (e.g., "2400") |
| chatbot_id | string | text | ✓ | The Flowise/Agent ID associated with this modal (nullable) |
| integration_type | string | text | ✗ | Type of integration, if any (e.g., "Flowise", "n8n", "None") |
| interaction_style | string | text | ✗ | Interaction style for integration modals (e.g., "Input Form", "No Input Form", "None") |
| is_legacy | boolean | boolean | ✗ | Flag to indicate if this configuration represents a legacy (non-React) modal |
| created_at | string | timestamp with time zone | ✗ | Timestamp of when the record was created |
| updated_at | string | timestamp with time zone | ✗ | Timestamp of when the record was last updated |
| target_state | string | text | ✓ | The state group the modal button belongs to (e.g., "Workspace", "Upsert", "Agent", nullable) |
| sector | string | text | ✓ | - |
| sector_id | string | uuid | ✓ | Note:
This is a Foreign Key to `sectors.sector_id`.<fk table='sectors' column='sector_id'/> |
| created_by | string | uuid | ✓ | Reference to the contributor who created this modal configuration |
| updated_by | string | uuid | ✓ | Reference to the contributor who last updated this modal configuration |
| is_active | boolean | boolean | ✓ | - |
| is_deleted | boolean | boolean | ✓ | - |
| sort_order | integer | integer | ✓ | - |
| tags | array | text[] | ✓ | - |
| metadata | unknown | jsonb | ✓ | - |
| modal_type | string | text | ✓ | - |
| page_name | string | text | ✓ | - |
| page_prefix | string | text | ✓ | - |

---

## monthly_documents_created

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 2

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| month_year | string | timestamp with time zone | ✓ | - |
| documents_created | integer | bigint | ✓ | - |

---

## multi_source_tenders

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 14

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| tender_id | string | uuid | ✓ | Note:
This is a Foreign Key to `tenders.id`.<fk table='tenders' column='id'/> |
| source_id | string | uuid | ✓ | Note:
This is a Foreign Key to `integration_sources.id`.<fk table='integration_sources' column='id'/> |
| external_id | string | character varying | ✗ | - |
| source_system | string | character varying | ✗ | - |
| source_data | unknown | jsonb | ✗ | - |
| transformed_data | unknown | jsonb | ✓ | - |
| data_quality_score | number | numeric | ✓ | - |
| conflict_resolution | string | character varying | ✓ | - |
| last_conflict_at | string | timestamp with time zone | ✓ | - |
| conflict_notes | string | text | ✓ | - |
| is_active | boolean | boolean | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |

---

## notifications

**Description:** User notifications for tender opportunities and system alerts

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 10

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| user_id | string | character varying | ✗ | - |
| type | string | character varying | ✓ | - |
| title | string | character varying | ✓ | - |
| message | string | text | ✓ | - |
| data | unknown | jsonb | ✓ | Additional structured data for notifications (e.g., tender details, monitor info) |
| is_read | boolean | boolean | ✓ | - |
| read_at | string | timestamp with time zone | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| organization_id | string | uuid | ✓ | Note:
This is a Foreign Key to `organizations.id`.<fk table='organizations' column='id'/> |

---

## numbering_config

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 4

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| organization_id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| config | unknown | jsonb | ✗ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |

---

## numbering_methodologies

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 8

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| name | string | character varying | ✗ | - |
| description | string | text | ✓ | - |
| organization_id | string | uuid | ✗ | - |
| pattern_template | string | text | ✗ | - |
| is_default | boolean | boolean | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |

---

## numbering_patterns

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 8

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| name | string | character varying | ✗ | - |
| description | string | text | ✓ | - |
| organization_id | string | uuid | ✗ | - |
| pattern | string | text | ✗ | - |
| is_active | boolean | boolean | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |

---

## operations_equipment

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 8

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| name | string | text | ✗ | - |
| type | string | text | ✗ | - |
| specifications | unknown | jsonb | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |
| organization_id | string | uuid | ✓ | - |
| user_id | string | uuid | ✓ | - |

---

## order_derived_template_usage

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 9

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| template_id | string | uuid | ✓ | Note:
This is a Foreign Key to `procurement_templates.id`.<fk table='procurement_templates' column='id'/> |
| order_id | string | uuid | ✓ | Note:
This is a Foreign Key to `procurement_orders.id`.<fk table='procurement_orders' column='id'/> |
| user_id | string | uuid | ✓ | Note:
This is a Foreign Key to `user_management.user_id`.<fk table='user_management' column='user_id'/> |
| action_type | string | character varying | ✓ | - |
| time_saved_minutes | integer | integer | ✓ | - |
| fields_modified | unknown | jsonb | ✓ | - |
| created_at | string | timestamp without time zone | ✓ | - |
| organization_id | string | uuid | ✓ | Note:
This is a Foreign Key to `organizations.id`.<fk table='organizations' column='id'/> |

---

## organisations_backup

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 10

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | integer | integer | ✓ | - |
| name | string | character varying | ✓ | - |
| sector_id | string | uuid | ✓ | - |
| is_active | boolean | boolean | ✓ | - |
| is_template | boolean | boolean | ✓ | - |
| created_at | string | timestamp without time zone | ✓ | - |
| updated_at | string | timestamp without time zone | ✓ | - |
| uuid | string | uuid | ✓ | - |
| organization_id | string | uuid | ✓ | - |
| user_id | string | uuid | ✓ | - |

---

## organization_collaborations

**Description:** Defines collaborations between organizations for cross-organizational accordion sharing

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 13

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| primary_organization_id | string | uuid | ✗ | The organization that owns the primary accordion structure

Note:
This is a Foreign Key to `organizations.id`.<fk table='organizations' column='id'/> |
| collaborating_organization_id | string | uuid | ✗ | The organization that collaborates with the primary organization

Note:
This is a Foreign Key to `organizations.id`.<fk table='organizations' column='id'/> |
| shared_sections | array | text[] | ✓ | Array of section IDs that are shared between organizations |
| agent_sharing_permissions | array | text[] | ✓ | Array of agent IDs that can be shared between organizations |
| is_active | boolean | boolean | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |
| primary_org_supabase_config | unknown | jsonb | ✓ | Supabase configuration for the primary organization (cached for performance) |
| context_mapping | unknown | jsonb | ✓ | Mapping of sections to database contexts for this collaboration |
| page_precedence | string | text | ✓ | Determines which organization's pages take precedence when there are conflicts: 'host' or 'collaborator' |
| organization_id | string | uuid | ✓ | - |
| user_id | string | uuid | ✓ | - |

---

## organization_db_configs

**Description:** View of organizations with valid Supabase database configurations for multi-database context switching

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 8

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✓ | Note:
This is a Primary Key.<pk/> |
| name | string | character varying | ✓ | - |
| supabase_url | string | text | ✓ | - |
| supabase_anon_key | string | text | ✓ | - |
| supabase_service_key | string | text | ✓ | - |
| is_active | boolean | boolean | ✓ | - |
| created_at | string | timestamp without time zone | ✓ | - |
| updated_at | string | timestamp without time zone | ✓ | - |

---

## organization_users

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 10

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| organization_id | string | uuid | ✗ | Note:
This is a Foreign Key to `organizations.id`.<fk table='organizations' column='id'/> |
| user_id | string | uuid | ✗ | Note:
This is a Foreign Key to `user_management.user_id`.<fk table='user_management' column='user_id'/> |
| discipline_id | string | uuid | ✗ | Note:
This is a Foreign Key to `disciplines.id`.<fk table='disciplines' column='id'/> |
| role | string | character varying | ✓ | - |
| status | string | character varying | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |
| created_by | string | uuid | ✓ | Note:
This is a Foreign Key to `user_management.user_id`.<fk table='user_management' column='user_id'/> |
| updated_by | string | uuid | ✓ | Note:
This is a Foreign Key to `user_management.user_id`.<fk table='user_management' column='user_id'/> |

---

## organizations

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 12

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| name | string | character varying | ✗ | - |
| sector_id | string | uuid | ✓ | Note:
This is a Foreign Key to `sectors.sector_id`.<fk table='sectors' column='sector_id'/> |
| is_active | boolean | boolean | ✓ | - |
| is_template | boolean | boolean | ✓ | - |
| created_at | string | timestamp without time zone | ✓ | - |
| updated_at | string | timestamp without time zone | ✓ | - |
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| supabase_url | string | text | ✓ | Supabase project URL for this organization |
| supabase_anon_key | string | text | ✓ | Supabase anonymous key for this organization |
| supabase_service_key | string | text | ✓ | Supabase service key for this organization (server-side operations) |
| organization_id | string | uuid | ✓ | - |
| user_id | string | uuid | ✓ | - |

---

## page_permissions

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 8

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| page_path | string | text | ✗ | - |
| role_id | integer | integer | ✗ | Note:
This is a Foreign Key to `role_definitions.id`.<fk table='role_definitions' column='id'/> |
| has_access | boolean | boolean | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |
| created_by | string | text | ✓ | - |
| updated_by | string | text | ✓ | - |

---

## pages

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 20

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| page_id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| page_prefix | string | character varying | ✗ | Page prefix - up to 6 characters (e.g., 00100, E00200, D00300) |
| page_name | string | character varying | ✗ | - |
| page_slug | string | character varying | ✗ | - |
| sector_id | string | uuid | ✓ | Note:
This is a Foreign Key to `sectors.sector_id`.<fk table='sectors' column='sector_id'/> |
| organization_id | string | uuid | ✓ | UUID of the organization this page belongs to (references organizations.id)

Note:
This is a Foreign Key to `organizations.id`.<fk table='organizations' column='id'/> |
| organisation_name | string | character varying | ✓ | - |
| sector_name | string | character varying | ✓ | - |
| created_at | string | timestamp with time zone | ✗ | - |
| updated_at | string | timestamp with time zone | ✗ | - |
| display_order | integer | integer | ✓ | - |
| parent_page_id | string | uuid | ✓ | Note:
This is a Foreign Key to `pages.page_id`.<fk table='pages' column='page_id'/> |
| organisation_id | string | uuid | ✓ | DEPRECATED: Contains sector UUID - use sector_uuid instead

Note:
This is a Foreign Key to `organizations.id`.<fk table='organizations' column='id'/> |
| sector_uuid | string | uuid | ✓ | UUID of the sector for this page

Note:
This is a Foreign Key to `organizations.id`.<fk table='organizations' column='id'/> |
| is_active | boolean | boolean | ✓ | Whether this page is active |
| hierarchy_level | integer | integer | ✓ | Level in the hierarchy (0 = top level, 1 = subsection, etc.) |
| is_standard_link | boolean | boolean | ✓ | Whether this is a standard link (e.g., All Documents, Email Management) |
| is_virtual | boolean | boolean | ✓ | Whether this is a virtual page (not directly linked to a folder) |
| organisation_ids | array | text[] | ✓ | Array of organization IDs that this page belongs to - supports multi-organization access control |
| page_type | string | text | ✓ | Page type according to Page Implementation Procedure (discipline_pages, data_management, workflow_processing, etc.) |

---

## pages_directors_backup_20250726

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 15

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| page_id | string | uuid | ✓ | - |
| page_prefix | string | character varying | ✓ | - |
| page_name | string | character varying | ✓ | - |
| page_slug | string | character varying | ✓ | - |
| sector_id | string | uuid | ✓ | - |
| organization_id | string | uuid | ✓ | - |
| organisation_name | string | character varying | ✓ | - |
| sector_name | string | character varying | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |
| display_order | integer | integer | ✓ | - |
| parent_page_id | string | uuid | ✓ | - |
| organisation_id | string | uuid | ✓ | - |
| sector_uuid | string | uuid | ✓ | - |
| is_active | boolean | boolean | ✓ | - |

---

## pages_with_clear_columns

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 15

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| page_id | string | uuid | ✓ | Note:
This is a Primary Key.<pk/> |
| page_prefix | string | character varying | ✓ | - |
| page_name | string | character varying | ✓ | - |
| page_slug | string | character varying | ✓ | - |
| sector_id | string | uuid | ✓ | Note:
This is a Foreign Key to `sectors.sector_id`.<fk table='sectors' column='sector_id'/> |
| organization_id | string | uuid | ✓ | Note:
This is a Foreign Key to `organizations.id`.<fk table='organizations' column='id'/> |
| sector_uuid | string | uuid | ✓ | Note:
This is a Foreign Key to `organizations.id`.<fk table='organizations' column='id'/> |
| old_sector_id | string | uuid | ✓ | Note:
This is a Foreign Key to `organizations.id`.<fk table='organizations' column='id'/> |
| organisation_name | string | character varying | ✓ | - |
| sector_name | string | character varying | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |
| display_order | integer | integer | ✓ | - |
| parent_page_id | string | uuid | ✓ | Note:
This is a Foreign Key to `pages.page_id`.<fk table='pages' column='page_id'/> |
| data_consistency | string | text | ✓ | - |

---

## pages_with_organization_mapping

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 16

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| page_id | string | uuid | ✓ | Note:
This is a Primary Key.<pk/> |
| page_prefix | string | character varying | ✓ | - |
| page_name | string | character varying | ✓ | - |
| page_slug | string | character varying | ✓ | - |
| sector_id | string | uuid | ✓ | Note:
This is a Foreign Key to `sectors.sector_id`.<fk table='sectors' column='sector_id'/> |
| organization_id | string | uuid | ✓ | Note:
This is a Foreign Key to `organizations.id`.<fk table='organizations' column='id'/> |
| sector_uuid | string | uuid | ✓ | Note:
This is a Foreign Key to `organizations.id`.<fk table='organizations' column='id'/> |
| old_sector_id | string | uuid | ✓ | Note:
This is a Foreign Key to `organizations.id`.<fk table='organizations' column='id'/> |
| organisation_name | string | character varying | ✓ | - |
| sector_name | string | character varying | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |
| display_order | integer | integer | ✓ | - |
| parent_page_id | string | uuid | ✓ | Note:
This is a Foreign Key to `pages.page_id`.<fk table='pages' column='page_id'/> |
| organization_name | string | character varying | ✓ | - |
| sector_name_clear | string | character varying | ✓ | - |

---

## path_configurations

**Description:** Template configurations for generating document storage paths per organization

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 8

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| organization_id | string | uuid | ✓ | Note:
This is a Foreign Key to `organizations.id`.<fk table='organizations' column='id'/> |
| name | string | text | ✗ | - |
| components | unknown | jsonb | ✗ | JSON array defining path structure with placeholders for dynamic values |
| is_default | boolean | boolean | ✓ | Whether this is the default path configuration for the organization |
| created_by | string | uuid | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |

---

## performance_alerts

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 12

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| alert_type | string | text | ✗ | - |
| severity | string | text | ✗ | - |
| title | string | text | ✗ | - |
| description | string | text | ✓ | - |
| metadata | unknown | jsonb | ✓ | - |
| is_active | boolean | boolean | ✗ | - |
| discipline_code | string | text | ✓ | - |
| created_by | string | uuid | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| resolved_at | string | timestamp with time zone | ✓ | - |
| resolved_by | string | uuid | ✓ | - |

---

## performance_metrics

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 7

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| metric_type | string | text | ✗ | - |
| value | number | numeric | ✓ | - |
| metadata | unknown | jsonb | ✓ | - |
| user_id | string | uuid | ✓ | - |
| discipline_code | string | text | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |

---

## personnel_records

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 17

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| user_id | string | uuid | ✓ | - |
| employee_id | string | character varying | ✓ | - |
| department | string | character varying | ✓ | - |
| position | string | character varying | ✓ | - |
| hire_date | string | date | ✓ | - |
| termination_date | string | date | ✓ | - |
| manager_id | string | uuid | ✓ | - |
| salary | number | numeric | ✓ | - |
| employment_type | string | character varying | ✓ | - |
| location | string | character varying | ✓ | - |
| phone | string | character varying | ✓ | - |
| emergency_contact_name | string | character varying | ✓ | - |
| emergency_contact_phone | string | character varying | ✓ | - |
| created_at | string | timestamp without time zone | ✓ | - |
| updated_at | string | timestamp without time zone | ✓ | - |
| organization_id | string | uuid | ✓ | - |

---

## petty_cash

**Description:** Petty cash reimbursement requests with approval workflow

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 21

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | text | ✗ | Unique identifier for petty cash request

Note:
This is a Primary Key.<pk/> |
| project_id | string | text | ✓ | Associated project identifier |
| user_id | string | uuid | ✓ | User who submitted the request

Note:
This is a Foreign Key to `user_management.user_id`.<fk table='user_management' column='user_id'/> |
| date | string | date | ✗ | Date when the expense occurred |
| amount | number | numeric | ✗ | Amount in local currency (ZAR) |
| category | string | character varying | ✗ | Expense category for reporting |
| description | string | text | ✗ | Detailed description of the expense |
| receipt_url | string | text | ✓ | URL to uploaded receipt document |
| receipt_filename | string | character varying | ✓ | - |
| status | string | character varying | ✓ | Current approval status of the request |
| submitted_at | string | timestamp with time zone | ✓ | - |
| approved_at | string | timestamp with time zone | ✓ | - |
| rejected_at | string | timestamp with time zone | ✓ | - |
| approver_id | string | uuid | ✓ | Note:
This is a Foreign Key to `user_management.user_id`.<fk table='user_management' column='user_id'/> |
| rejection_reason | string | text | ✓ | Reason provided when request is rejected |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |
| project_name | string | character varying | ✓ | - |
| user_name | string | character varying | ✓ | - |
| phase_id | string | uuid | ✓ | References project_phases table, defaults to FEED phase when not provided

Note:
This is a Foreign Key to `project_phases.id`.<fk table='project_phases' column='id'/> |
| organization_id | string | uuid | ✓ | - |

---

## ports

**Description:** Reference table for ports and terminals

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 21

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| port_code | string | character varying | ✗ | - |
| port_name | string | character varying | ✗ | - |
| country_code | string | character varying | ✓ | - |
| country_name | string | character varying | ✓ | - |
| latitude | number | numeric | ✓ | - |
| longitude | number | numeric | ✓ | - |
| time_zone | string | character varying | ✓ | - |
| port_type | string | character varying | ✓ | - |
| facilities | array | text[] | ✓ | - |
| max_vessel_length | number | numeric | ✓ | - |
| max_vessel_beam | number | numeric | ✓ | - |
| max_draft | number | numeric | ✓ | - |
| working_hours | string | character varying | ✓ | - |
| customs_hours | string | character varying | ✓ | - |
| services | array | text[] | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |
| is_active | boolean | boolean | ✓ | - |
| organization_id | string | uuid | ✓ | - |
| user_id | string | uuid | ✓ | - |

---

## processing_statistics

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 9

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| organization_name | string | text | ✓ | - |
| processing_type | string | text | ✓ | - |
| processing_status | string | text | ✓ | - |
| file_type | string | text | ✓ | - |
| total_count | integer | bigint | ✓ | - |
| avg_processing_time | number | numeric | ✓ | - |
| avg_extracted_fields | number | numeric | ✓ | - |
| earliest_entry | string | timestamp with time zone | ✓ | - |
| latest_entry | string | timestamp with time zone | ✓ | - |

---

## procurement_approvals

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 10

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| procurement_order_id | string | uuid | ✗ | Note:
This is a Foreign Key to `procurement_orders.id`.<fk table='procurement_orders' column='id'/> |
| approver_role | string | character varying | ✗ | - |
| user_id | string | uuid | ✓ | - |
| status | string | character varying | ✓ | - |
| approval_level | integer | integer | ✗ | - |
| comments | string | text | ✓ | - |
| approved_at | string | timestamp with time zone | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |

---

## procurement_categories

**Description:** Hierarchical procurement categories system with i18n support (English/French)

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 14

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| level1_code | string | character varying | ✓ | Main category code (A-M) as defined in Excel |
| level1_name | string | character varying | ✓ | English name for main category |
| level1_name_fr | string | character varying | ✓ | French translation for main category |
| level2_code | string | character varying | ✓ | Subcategory code (e.g., A00, B01, C06) |
| level2_name | string | character varying | ✓ | English name for subcategory |
| level2_name_fr | string | character varying | ✓ | French translation for subcategory |
| level3_code | string | character varying | ✓ | Detailed category code (e.g., C0601 for Engine Oil) |
| level3_name | string | character varying | ✓ | English name for detailed category |
| level3_name_fr | string | character varying | ✓ | French translation for detailed category |
| is_active | boolean | boolean | ✓ | - |
| display_order | integer | integer | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| organization_id | string | uuid | ✓ | - |

---

## procurement_contributions

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 11

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| procurement_order_id | string | uuid | ✗ | Note:
This is a Foreign Key to `procurement_orders.id`.<fk table='procurement_orders' column='id'/> |
| appendix_key | string | character varying | ✗ | - |
| discipline_id | string | uuid | ✗ | Note:
This is a Foreign Key to `disciplines.id`.<fk table='disciplines' column='id'/> |
| user_id | string | uuid | ✗ | - |
| content | string | text | ✓ | - |
| status | string | character varying | ✓ | - |
| assigned_at | string | timestamp with time zone | ✓ | - |
| completed_at | string | timestamp with time zone | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |

---

## procurement_order_documents

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 16

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| procurement_order_id | string | uuid | ✗ | Note:
This is a Foreign Key to `procurement_orders.id`.<fk table='procurement_orders' column='id'/> |
| document_id | string | uuid | ✗ | - |
| document_type | string | character varying | ✗ | - |
| reference_type | string | character varying | ✗ | - |
| project_phase | string | character varying | ✓ | - |
| procurement_category | string | character varying | ✓ | - |
| added_at | string | timestamp with time zone | ✓ | - |
| added_by | string | uuid | ✗ | Note:
This is a Foreign Key to `user_profiles.user_id`.<fk table='user_profiles' column='user_id'/> |
| notes | string | text | ✓ | - |
| organization_id | string | uuid | ✓ | - |
| user_id | string | uuid | ✓ | - |
| template_reference_id | string | uuid | ✓ | Note:
This is a Foreign Key to `procurement_templates.id`.<fk table='procurement_templates' column='id'/> |
| appendix_order | integer | integer | ✓ | - |
| generated_html | string | text | ✓ | - |
| version_number | integer | integer | ✓ | - |

---

## procurement_orders

**Description:** Dedicated table for actual procurement orders (separate from reusable templates)

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 43

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| order_number | string | character varying | ✓ | Auto-generated unique order number (PO-2025-001, SO-2025-001, WO-2025-001) |
| order_type | string | character varying | ✗ | Type of procurement order: purchase_order, service_order, work_order |
| title | string | character varying | ✗ | - |
| description | string | text | ✓ | - |
| department | string | character varying | ✓ | - |
| priority | string | character varying | ✓ | - |
| estimated_value | number | numeric | ✓ | - |
| currency | string | character varying | ✓ | - |
| supplier_name | string | character varying | ✓ | - |
| supplier_contact | string | character varying | ✓ | - |
| project_id | string | uuid | ✓ | Reference to projects table for project context awareness

Note:
This is a Foreign Key to `projects.id`.<fk table='projects' column='id'/> |
| project_phase | string | character varying | ✓ | Current project phase for document filtering and suggestions |
| template_id | string | uuid | ✓ | Note:
This is a Foreign Key to `procurement_templates.id`.<fk table='procurement_templates' column='id'/> |
| linked_documents | unknown | jsonb | ✓ | JSON array of linked documents with metadata for document integration feature |
| approval_status | string | character varying | ✓ | - |
| delivery_date | string | date | ✓ | - |
| special_requirements | string | text | ✓ | - |
| created_by | string | uuid | ✗ | Note:
This is a Foreign Key to `user_profiles.user_id`.<fk table='user_profiles' column='user_id'/> |
| organization_id | string | uuid | ✓ | Note:
This is a Foreign Key to `organizations.id`.<fk table='organizations' column='id'/> |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |
| sow_id | string | uuid | ✓ | - |
| sow_template_id | string | uuid | ✓ | Reference to the SOW template used for this order

Note:
This is a Foreign Key to `templates.id`.<fk table='templates' column='id'/> |
| appendix_a_content | string | text | ✓ | - |
| appendix_b_content | string | text | ✓ | - |
| appendix_c_content | string | text | ✓ | - |
| appendix_d_content | string | text | ✓ | - |
| appendix_e_content | string | text | ✓ | - |
| appendix_f_content | string | text | ✓ | - |
| approval_cover_content | string | text | ✓ | - |
| main_order_content | string | text | ✓ | - |
| discipline_assignments | unknown | jsonb | ✓ | JSON mapping of disciplines to SOW appendices |
| contribution_status | unknown | jsonb | ✓ | - |
| approval_matrix | unknown | jsonb | ✓ | JSON object defining approval workflow matrix |
| approval_routing_type | string | character varying | ✓ | - |
| approval_config | unknown | jsonb | ✓ | JSON configuration for approval workflow settings |
| user_assignments | unknown | jsonb | ✓ | JSON mapping of users to specific appendix sections |
| task_sequence | unknown | jsonb | ✓ | - |
| template_variation | string | character varying | ✓ | - |
| sequence_override_id | string | uuid | ✓ | - |
| estimated_completion_time | string | interval | ✓ | - |
| sequence_execution_id | string | uuid | ✓ | - |

---

## procurement_signatures

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 18

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| contract_id | string | uuid | ✓ | - |
| signature_document_id | string | uuid | ✓ | Note:
This is a Foreign Key to `signature_documents.id`.<fk table='signature_documents' column='id'/> |
| procurement_phase | string | character varying | ✗ | - |
| procurement_stage | string | character varying | ✗ | - |
| required_signatories | integer | integer | ✗ | - |
| collected_signatures | integer | integer | ✓ | - |
| deadline | string | timestamp with time zone | ✓ | - |
| status | string | character varying | ✓ | - |
| completed_at | string | timestamp with time zone | ✓ | - |
| expired_at | string | timestamp with time zone | ✓ | - |
| initiated_by | string | uuid | ✓ | - |
| business_case | string | text | ✓ | - |
| special_conditions | string | text | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |
| organization_id | string | uuid | ✓ | - |
| created_by | string | uuid | ✓ | - |

---

## procurement_templates

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 47

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| document_id | string | uuid | ✓ | - |
| organization_id | string | character varying | ✓ | - |
| created_by | string | uuid | ✓ | - |
| updated_by | string | uuid | ✓ | - |
| template_name | string | text | ✗ | - |
| template_description | string | text | ✓ | - |
| template_type | string | text | ✗ | - |
| template_category | string | text | ✓ | - |
| level1_code | string | text | ✓ | - |
| level2_code | string | text | ✓ | - |
| level3_code | string | text | ✓ | - |
| template_content | unknown | jsonb | ✓ | - |
| field_protection | unknown | jsonb | ✓ | - |
| protection_enabled | boolean | boolean | ✓ | - |
| is_latest | boolean | boolean | ✓ | - |
| version_number | integer | integer | ✓ | - |
| approval_status | string | text | ✓ | - |
| approved_by | string | uuid | ✓ | - |
| approved_at | string | timestamp with time zone | ✓ | - |
| related_documents | unknown | jsonb | ✓ | - |
| compliance_requirements | unknown | jsonb | ✓ | - |
| lifecycle_stage | string | text | ✓ | - |
| tags | array | text[] | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |
| access_level | string | character varying | ✓ | - |
| discipline | string | character varying | ✓ | - |
| allowed_roles | unknown | jsonb | ✓ | - |
| component_type | string | character varying | ✓ | - |
| mandatory | boolean | boolean | ✓ | - |
| approval_workflow | unknown | jsonb | ✓ | JSONB containing approval workflow configuration including required approvals, hierarchy, and notification settings |
| html_content | string | text | ✓ | Generated HTML content from template fields for document processing. Indexed using MD5 hash for performance. |
| document_type | string | text | ✓ | Document type copied from governance template (e.g., PO, Contract, SOW) |
| document_type_label | string | text | ✓ | Human-readable label for the document type |
| discipline_code | string | text | ✓ | Discipline code (e.g., 00850 for Civil Engineering) for discipline-aware template filtering |
| appendix_letter | string | character | ✓ | - |
| sow_integration_enabled | boolean | boolean | ✓ | - |
| organization_name | string | text | ✓ | - |
| discipline_name | string | text | ✓ | - |
| source_governance_template_id | string | uuid | ✓ | - |
| source_order_id | string | uuid | ✓ | Note:
This is a Foreign Key to `procurement_orders.id`.<fk table='procurement_orders' column='id'/> |
| source_project_id | string | uuid | ✓ | Note:
This is a Foreign Key to `projects.id`.<fk table='projects' column='id'/> |
| populated_data | unknown | jsonb | ✓ | - |
| variable_fields | unknown | jsonb | ✓ | - |
| derivation_metadata | unknown | jsonb | ✓ | - |
| derivation_confidence | number | numeric | ✓ | - |

---

## procurement_templates_backup_20251121

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 41

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✓ | - |
| document_id | string | uuid | ✓ | - |
| organization_id | string | character varying | ✓ | - |
| created_by | string | uuid | ✓ | - |
| updated_by | string | uuid | ✓ | - |
| template_name | string | text | ✓ | - |
| template_description | string | text | ✓ | - |
| template_type | string | text | ✓ | - |
| template_category | string | text | ✓ | - |
| level1_code | string | text | ✓ | - |
| level2_code | string | text | ✓ | - |
| level3_code | string | text | ✓ | - |
| template_content | unknown | jsonb | ✓ | - |
| field_protection | unknown | jsonb | ✓ | - |
| protection_enabled | boolean | boolean | ✓ | - |
| is_latest | boolean | boolean | ✓ | - |
| version_number | integer | integer | ✓ | - |
| approval_status | string | text | ✓ | - |
| approved_by | string | uuid | ✓ | - |
| approved_at | string | timestamp with time zone | ✓ | - |
| related_documents | unknown | jsonb | ✓ | - |
| compliance_requirements | unknown | jsonb | ✓ | - |
| lifecycle_stage | string | text | ✓ | - |
| tags | array | text[] | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |
| access_level | string | character varying | ✓ | - |
| discipline | string | character varying | ✓ | - |
| allowed_roles | unknown | jsonb | ✓ | - |
| component_type | string | character varying | ✓ | - |
| mandatory | boolean | boolean | ✓ | - |
| approval_workflow | unknown | jsonb | ✓ | - |
| html_content | string | text | ✓ | - |
| document_type | string | text | ✓ | - |
| document_type_label | string | text | ✓ | - |
| discipline_code | string | text | ✓ | - |
| appendix_letter | string | character | ✓ | - |
| sow_integration_enabled | boolean | boolean | ✓ | - |
| organization_name | string | text | ✓ | - |
| discipline_name | string | text | ✓ | - |
| source_governance_template_id | string | uuid | ✓ | - |

---

## progress_logs

**Description:** Comprehensive audit trail of all workflow progress updates

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 10

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| order_id | string | uuid | ✗ | - |
| progress_data | unknown | jsonb | ✗ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| organization_id | string | uuid | ✓ | - |
| user_id | string | uuid | ✓ | - |
| agent_id | string | character varying | ✓ | - |
| operation | string | character varying | ✓ | - |
| status | string | character varying | ✓ | - |
| message | string | text | ✓ | - |

---

## project_engineering_templates

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 18

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| template_id | string | uuid | ✗ | Note:
This is a Foreign Key to `master_engineering_templates.id`.<fk table='master_engineering_templates' column='id'/> |
| project_id | string | uuid | ✗ | Note:
This is a Foreign Key to `projects.id`.<fk table='projects' column='id'/> |
| custom_name | string | character varying | ✓ | - |
| custom_description | string | text | ✓ | - |
| custom_html_content | string | text | ✓ | - |
| custom_json_content | unknown | jsonb | ✓ | - |
| is_required | boolean | boolean | ✓ | - |
| required_by | string | date | ✓ | - |
| completed_at | string | timestamp with time zone | ✓ | - |
| completed_by | string | uuid | ✓ | - |
| project_approval_status | string | character varying | ✓ | - |
| project_approved_by | string | uuid | ✓ | - |
| project_approved_at | string | timestamp with time zone | ✓ | - |
| organization_id | string | uuid | ✗ | - |
| company_id | string | uuid | ✗ | - |
| created_by | string | uuid | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |

---

## project_permissions

**Description:** User-based project access control with phase-level permissions

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 8

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| project_id | string | uuid | ✗ | Project ID reference |
| user_id | string | character varying | ✗ | User ID (UUID as text) |
| has_access | boolean | boolean | ✗ | Whether user has project access |
| phases_access | unknown | jsonb | ✓ | Array of accessible phase IDs |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |
| created_by | string | text | ✓ | - |
| updated_by | string | text | ✓ | - |

---

## project_phase_assignments

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 10

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| project_id | string | uuid | ✓ | Note:
This is a Foreign Key to `projects.id`.<fk table='projects' column='id'/> |
| phase_id | string | uuid | ✓ | Note:
This is a Foreign Key to `project_phases.id`.<fk table='project_phases' column='id'/> |
| custom_name | string | character varying | ✓ | - |
| is_active | boolean | boolean | ✓ | - |
| start_date | string | date | ✓ | - |
| end_date | string | date | ✓ | - |
| sort_order | integer | integer | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |

---

## project_phases

**Description:** Standard project phases used across all projects

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 11

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Unique identifier for the project phase

Note:
This is a Primary Key.<pk/> |
| name | string | character varying | ✗ | Human-readable name of the project phase |
| description | string | text | ✓ | Detailed description of the project phase |
| phase_code | string | character varying | ✓ | Unique code for the project phase |
| sort_order | integer | integer | ✓ | Order in which phases should be displayed/executed |
| is_active | boolean | boolean | ✓ | Whether this phase is currently active/available for use |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |
| created_by | string | uuid | ✓ | - |
| updated_by | string | uuid | ✓ | - |
| organization_id | string | uuid | ✓ | - |

---

## project_procurement_templates

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 51

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| document_id | string | uuid | ✓ | - |
| organization_id | string | character varying | ✓ | - |
| created_by | string | uuid | ✓ | - |
| updated_by | string | uuid | ✓ | - |
| template_name | string | text | ✗ | - |
| template_description | string | text | ✓ | - |
| template_type | string | text | ✗ | - |
| template_category | string | text | ✓ | - |
| level1_code | string | text | ✓ | - |
| level2_code | string | text | ✓ | - |
| level3_code | string | text | ✓ | - |
| template_content | unknown | jsonb | ✓ | - |
| field_protection | unknown | jsonb | ✓ | - |
| protection_enabled | boolean | boolean | ✓ | - |
| is_latest | boolean | boolean | ✓ | - |
| version_number | integer | integer | ✓ | - |
| approval_status | string | text | ✓ | - |
| approved_by | string | uuid | ✓ | - |
| approved_at | string | timestamp with time zone | ✓ | - |
| related_documents | unknown | jsonb | ✓ | - |
| compliance_requirements | unknown | jsonb | ✓ | - |
| lifecycle_stage | string | text | ✓ | - |
| tags | array | text[] | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |
| access_level | string | character varying | ✓ | - |
| discipline | string | character varying | ✓ | - |
| allowed_roles | unknown | jsonb | ✓ | - |
| component_type | string | character varying | ✓ | - |
| mandatory | boolean | boolean | ✓ | - |
| project_id | string | uuid | ✗ | Note:
This is a Foreign Key to `projects.id`.<fk table='projects' column='id'/> |
| prepared_by | string | uuid | ✓ | - |
| prepared_at | string | timestamp with time zone | ✓ | - |
| template_scope | string | text | ✓ | - |
| approval_workflow | unknown | jsonb | ✓ | - |
| html_content | string | text | ✓ | - |
| document_type | string | text | ✓ | - |
| document_type_label | string | text | ✓ | - |
| discipline_code | string | text | ✓ | - |
| appendix_letter | string | character | ✓ | - |
| sow_integration_enabled | boolean | boolean | ✓ | - |
| organization_name | string | text | ✓ | - |
| discipline_name | string | text | ✓ | - |
| source_governance_template_id | string | uuid | ✓ | - |
| source_order_id | string | uuid | ✓ | - |
| source_project_id | string | uuid | ✓ | - |
| populated_data | unknown | jsonb | ✓ | - |
| variable_fields | unknown | jsonb | ✓ | - |
| derivation_metadata | unknown | jsonb | ✓ | - |
| derivation_confidence | number | numeric | ✓ | - |

---

## project_template_preparation

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 9

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| project_id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/>
This is a Foreign Key to `projects.id`.<fk table='projects' column='id'/> |
| prepared_at | string | timestamp with time zone | ✓ | - |
| prepared_by | string | uuid | ✓ | - |
| disciplines_prepared | array | text[] | ✓ | - |
| total_templates | integer | integer | ✓ | - |
| status | string | text | ✓ | - |
| agent_notifications_sent | boolean | boolean | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |

---

## project_templates

**Description:** Project-specific template copies with auto-populated data from SOW

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 30

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| project_id | string | uuid | ✗ | Note:
This is a Foreign Key to `projects.id`.<fk table='projects' column='id'/> |
| master_template_id | string | uuid | ✓ | Note:
This is a Foreign Key to `master_templates.id`.<fk table='master_templates' column='id'/> |
| template_name | string | character varying | ✗ | - |
| template_type | string | character varying | ✗ | - |
| category | string | character varying | ✓ | - |
| status | string | character varying | ✓ | - |
| content | unknown | jsonb | ✓ | - |
| populated_data | unknown | jsonb | ✓ | - |
| sow_reference | string | uuid | ✓ | Note:
This is a Foreign Key to `scope_of_work.id`.<fk table='scope_of_work' column='id'/> |
| auto_populated_at | string | timestamp with time zone | ✓ | - |
| reviewed_at | string | timestamp with time zone | ✓ | - |
| approved_at | string | timestamp with time zone | ✓ | - |
| executed_at | string | timestamp with time zone | ✓ | - |
| total_value | number | numeric | ✓ | - |
| currency | string | character varying | ✓ | - |
| vendor_id | string | uuid | ✓ | - |
| contract_number | string | character varying | ✓ | - |
| notes | string | text | ✓ | - |
| priority | string | character varying | ✓ | - |
| requires_technical_review | boolean | boolean | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |
| form_template_id | string | uuid | ✓ | - |
| customized_content | unknown | jsonb | ✓ | - |
| deployment_rules | unknown | jsonb | ✓ | - |
| deployed_to_doc_control | boolean | boolean | ✓ | - |
| deployed_at | string | timestamp without time zone | ✓ | - |
| created_by | string | uuid | ✓ | - |
| updated_by | string | uuid | ✓ | - |

---

## projects

**Description:** Projects belonging to companies

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 16

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| company_id | integer | integer | ✓ | - |
| name | string | character varying | ✗ | - |
| project_type | string | character varying | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| project_number | string | text | ✓ | - |
| project_description | string | text | ✓ | - |
| site_location | string | text | ✓ | - |
| delivery_date | string | date | ✓ | - |
| completion_date | string | date | ✓ | - |
| cost_center | string | text | ✓ | - |
| budget_code | string | text | ✓ | - |
| workflow_status | string | text | ✓ | - |
| organization_id | string | uuid | ✓ | - |
| user_id | string | uuid | ✓ | - |

---

## prompt_usage_audit

**Description:** Detailed audit trail of prompt usage by scripts and services for analytics and debugging

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 8

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| prompt_id | string | uuid | ✗ | Note:
This is a Foreign Key to `prompts.id`.<fk table='prompts' column='id'/> |
| script_name | string | text | ✗ | - |
| operation_type | string | text | ✓ | - |
| metadata | unknown | jsonb | ✓ | - |
| response_time_ms | integer | integer | ✓ | - |
| success | boolean | boolean | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |

---

## prompt_usage_summary

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 9

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| prompt_name | string | text | ✓ | - |
| prompt_id | string | uuid | ✓ | Note:
This is a Primary Key.<pk/> |
| is_active | boolean | boolean | ✓ | - |
| total_calls | integer | bigint | ✓ | - |
| successful_calls | integer | bigint | ✓ | - |
| avg_response_time_ms | number | numeric | ✓ | - |
| last_used | string | timestamp with time zone | ✓ | - |
| unique_scripts | integer | bigint | ✓ | - |
| scripts_using | string | text | ✓ | - |

---

## prompts

**Description:** Stores AI prompts and templates used throughout the system for various AI-powered features

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 31

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Unique identifier for the prompt

Note:
This is a Primary Key.<pk/> |
| name | string | text | ✗ | Human-readable name for the prompt |
| content | string | text | ✗ | The actual prompt text/template |
| description | string | text | ✓ | Brief description of the prompt purpose |
| organization_id | string | uuid | ✓ | Associated organization (optional) |
| sector_id | string | uuid | ✓ | Associated sector (optional) |
| type | string | text | ✓ | Type of prompt (coding, analysis, chat, etc.) |
| category | string | text | ✓ | Category of prompt (development, legal, etc.) |
| tags | array | text[] | ✓ | Array of tags for categorization and search |
| is_active | boolean | boolean | ✓ | Whether the prompt is currently active/available |
| metadata | unknown | jsonb | ✓ | Additional metadata stored as JSON |
| created_at | string | timestamp with time zone | ✓ | Timestamp when prompt was created |
| updated_at | string | timestamp with time zone | ✓ | Timestamp when prompt was last updated |
| key | string | text | ✓ | - |
| role_type | string | text | ✓ | Type of prompt: system (dev-only) or user (accessible to end users) |
| access_permissions | unknown | jsonb | ✓ | JSON object defining granular access permissions for different user roles |
| created_by | string | text | ✓ | User ID of the prompt creator (for ownership tracking) |
| cross_reference_id | string | uuid | ✓ | - |
| pages_used | array | text[] | ✓ | - |
| date_added | string | timestamp with time zone | ✓ | - |
| date_modified | string | timestamp with time zone | ✓ | - |
| script_usage | unknown | jsonb | ✓ | JSONB tracking which scripts/services use this prompt with usage statistics |
| usage_statistics | unknown | jsonb | ✓ | Aggregated metrics including total usage, success rates, and performance data |
| workflow_context | unknown | jsonb | ✓ | Workflow integration context including triggers, dependencies, and outputs |
| performance_requirements | unknown | jsonb | ✓ | Performance expectations including accuracy targets and processing time limits |
| agent_capabilities | unknown | jsonb | ✓ | Agent capabilities including supported disciplines and document types |
| integration_points | unknown | jsonb | ✓ | System integration points including pages, APIs, and databases |
| success_criteria | unknown | jsonb | ✓ | Success criteria and quality metrics for prompt evaluation |
| prompt_version | string | text | ✓ | Version identifier for prompt versioning and tracking |
| last_tested | string | timestamp with time zone | ✓ | Timestamp of last testing/validation of the prompt |
| test_results | unknown | jsonb | ✓ | Latest test results and performance metrics |

---

## prompts_enhanced

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 48

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✓ | Note:
This is a Primary Key.<pk/> |
| name | string | text | ✓ | - |
| content | string | text | ✓ | - |
| description | string | text | ✓ | - |
| organization_id | string | uuid | ✓ | - |
| sector_id | string | uuid | ✓ | - |
| type | string | text | ✓ | - |
| category | string | text | ✓ | - |
| tags | array | text[] | ✓ | - |
| is_active | boolean | boolean | ✓ | - |
| metadata | unknown | jsonb | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |
| key | string | text | ✓ | - |
| role_type | string | text | ✓ | - |
| access_permissions | unknown | jsonb | ✓ | - |
| created_by | string | text | ✓ | - |
| cross_reference_id | string | uuid | ✓ | - |
| pages_used | array | text[] | ✓ | - |
| date_added | string | timestamp with time zone | ✓ | - |
| date_modified | string | timestamp with time zone | ✓ | - |
| script_usage | unknown | jsonb | ✓ | - |
| usage_statistics | unknown | jsonb | ✓ | - |
| workflow_context | unknown | jsonb | ✓ | - |
| performance_requirements | unknown | jsonb | ✓ | - |
| agent_capabilities | unknown | jsonb | ✓ | - |
| integration_points | unknown | jsonb | ✓ | - |
| success_criteria | unknown | jsonb | ✓ | - |
| prompt_version | string | text | ✓ | - |
| last_tested | string | timestamp with time zone | ✓ | - |
| test_results | unknown | jsonb | ✓ | - |
| workflow_triggers | string | text | ✓ | - |
| workflow_dependencies | string | text | ✓ | - |
| workflow_outputs | string | text | ✓ | - |
| target_accuracy | number | numeric | ✓ | - |
| max_processing_time | integer | integer | ✓ | - |
| expected_field_count | integer | integer | ✓ | - |
| supported_disciplines | string | text | ✓ | - |
| supported_document_types | string | text | ✓ | - |
| supports_multi_agent | boolean | boolean | ✓ | - |
| integrated_pages | string | text | ✓ | - |
| integrated_apis | string | text | ✓ | - |
| integrated_databases | string | text | ✓ | - |
| accuracy_threshold | number | numeric | ✓ | - |
| quality_score_min | number | numeric | ✓ | - |
| last_success_rate | number | numeric | ✓ | - |
| avg_processing_time | number | numeric | ✓ | - |
| total_tests_run | integer | integer | ✓ | - |

---

## prompts_with_rbac

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 22

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✓ | Note:
This is a Primary Key.<pk/> |
| name | string | text | ✓ | - |
| content | string | text | ✓ | - |
| description | string | text | ✓ | - |
| organization_id | string | uuid | ✓ | - |
| sector_id | string | uuid | ✓ | - |
| type | string | text | ✓ | - |
| category | string | text | ✓ | - |
| tags | array | text[] | ✓ | - |
| is_active | boolean | boolean | ✓ | - |
| metadata | unknown | jsonb | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |
| key | string | text | ✓ | - |
| role_type | string | text | ✓ | - |
| access_permissions | unknown | jsonb | ✓ | - |
| created_by | string | text | ✓ | - |
| role_description | string | text | ✓ | - |
| dev_can_access | boolean | boolean | ✓ | - |
| user_can_edit | boolean | boolean | ✓ | - |
| user_can_create | boolean | boolean | ✓ | - |
| user_can_delete | boolean | boolean | ✓ | - |

---

## push_notifications

**Description:** Stores push notifications sent to users about workflow updates

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 11

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| user_id | string | uuid | ✗ | - |
| order_id | string | uuid | ✓ | - |
| title | string | character varying | ✗ | - |
| body | string | text | ✗ | - |
| notification_type | string | character varying | ✓ | - |
| metadata | unknown | jsonb | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| read | boolean | boolean | ✓ | - |
| read_at | string | timestamp with time zone | ✓ | - |
| organization_id | string | uuid | ✓ | - |

---

## quality_checks

**Description:** Quality inspection and validation tasks across projects

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 15

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| title | string | character varying | ✗ | - |
| description | string | text | ✓ | - |
| check_type | string | character varying | ✓ | - |
| severity | string | character varying | ✓ | - |
| location | string | text | ✓ | - |
| status | string | character varying | ✓ | - |
| assigned_to | string | uuid | ✓ | - |
| organization_id | string | uuid | ✓ | Note:
This is a Foreign Key to `organizations.id`.<fk table='organizations' column='id'/> |
| project_id | string | uuid | ✓ | Note:
This is a Foreign Key to `projects.id`.<fk table='projects' column='id'/> |
| due_date | string | timestamp with time zone | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |
| created_by | string | uuid | ✓ | - |
| updated_by | string | uuid | ✓ | - |

---

## rate_limits

**Description:** Rate limiting data to prevent abuse and ensure fair usage

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 13

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| user_id | string | uuid | ✗ | - |
| api_config_id | string | uuid | ✓ | - |
| discipline_code | string | text | ✓ | - |
| limit_type | string | text | ✗ | - |
| request_count | integer | integer | ✗ | - |
| limit_value | integer | integer | ✗ | - |
| window_start | string | timestamp with time zone | ✗ | - |
| window_end | string | timestamp with time zone | ✗ | - |
| blocked_until | string | timestamp with time zone | ✓ | - |
| metadata | unknown | jsonb | ✓ | - |
| created_at | string | timestamp with time zone | ✗ | - |
| updated_at | string | timestamp with time zone | ✗ | - |

---

## recent_audit_activity

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 13

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✓ | Note:
This is a Primary Key.<pk/> |
| user_id | string | uuid | ✓ | - |
| user_email | string | text | ✓ | - |
| action | string | text | ✓ | - |
| resource_type | string | text | ✓ | - |
| resource_id | string | text | ✓ | - |
| discipline_code | string | text | ✓ | - |
| ip_address | string | inet | ✓ | - |
| user_agent | string | text | ✓ | - |
| success | boolean | boolean | ✓ | - |
| error_message | string | text | ✓ | - |
| metadata | unknown | jsonb | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |

---

## record _manager

**Description:** to manage records within the database

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 4

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | integer | bigint | ✗ | Note:
This is a Primary Key.<pk/> |
| created_at | string | timestamp with time zone | ✗ | - |
| group_id | string | text | ✓ | - |
| source_id_key | string | text | ✓ | - |

---

## resource_documentation

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 10

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| resource_id | string | uuid | ✗ | - |
| resource_type | string | public.resource_type | ✗ | - |
| storage_service | string | public.storage_service_type | ✗ | - |
| storage_url | string | text | ✗ | - |
| document_id | string | character varying | ✗ | - |
| sections | unknown | jsonb | ✗ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| organization_id | string | uuid | ✓ | - |
| user_id | string | uuid | ✓ | - |

---

## resource_prompts

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 5

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| resource_id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| resource_type | string | public.resource_type | ✗ | Note:
This is a Primary Key.<pk/> |
| prompt_id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/>
This is a Foreign Key to `prompts.id`.<fk table='prompts' column='id'/> |
| applicable_sections | array | text[] | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |

---

## risk_assessments

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 19

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | integer | integer | ✗ | Note:
This is a Primary Key.<pk/> |
| risk_id | string | character varying | ✗ | - |
| inspection_id | string | character varying | ✗ | Note:
This is a Foreign Key to `inspections.inspection_id`.<fk table='inspections' column='inspection_id'/> |
| project_id | string | character varying | ✗ | - |
| risk_level | string | character varying | ✗ | - |
| probability | number | numeric | ✓ | - |
| impact | number | numeric | ✓ | - |
| description | string | text | ✓ | - |
| mitigation_plan | string | text | ✓ | - |
| assigned_to | string | character varying | ✓ | - |
| status | string | character varying | ✓ | - |
| review_date | string | date | ✓ | - |
| closed_date | string | date | ✓ | - |
| created_at | string | timestamp without time zone | ✓ | - |
| updated_at | string | timestamp without time zone | ✓ | - |
| created_by | string | character varying | ✓ | - |
| updated_by | string | character varying | ✓ | - |
| organization_id | string | uuid | ✓ | - |
| user_id | string | uuid | ✓ | - |

---

## role_definitions

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 7

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | integer | integer | ✗ | Note:
This is a Primary Key.<pk/> |
| role_name | string | character varying | ✗ | - |
| permissions | unknown | jsonb | ✗ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |
| description | string | text | ✓ | - |
| is_active | boolean | boolean | ✓ | - |

---

## routing_notifications

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 16

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | integer | bigint | ✗ | Note:
This is a Primary Key.<pk/> |
| workflow_id | integer | bigint | ✓ | Note:
This is a Foreign Key to `document_routing_workflows.id`.<fk table='document_routing_workflows' column='id'/> |
| routing_step_id | integer | bigint | ✓ | Note:
This is a Foreign Key to `workflow_routing_steps.id`.<fk table='workflow_routing_steps' column='id'/> |
| recipient_id | string | uuid | ✓ | Note:
This is a Foreign Key to `user_management.user_id`.<fk table='user_management' column='user_id'/> |
| recipient_role | string | character varying | ✓ | - |
| notification_type | string | character varying | ✗ | - |
| notification_priority | string | character varying | ✓ | - |
| subject | string | character varying | ✓ | - |
| message | string | text | ✓ | - |
| notification_data | unknown | jsonb | ✓ | - |
| sent | boolean | boolean | ✓ | - |
| sent_at | string | timestamp with time zone | ✓ | - |
| read_at | string | timestamp with time zone | ✓ | - |
| response_url | string | text | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |

---

## routing_step_actions

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 13

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | integer | bigint | ✗ | Note:
This is a Primary Key.<pk/> |
| routing_step_id | integer | bigint | ✓ | Note:
This is a Foreign Key to `workflow_routing_steps.id`.<fk table='workflow_routing_steps' column='id'/> |
| participant_id | string | uuid | ✓ | Note:
This is a Foreign Key to `user_management.user_id`.<fk table='user_management' column='user_id'/> |
| participant_role | string | character varying | ✓ | - |
| action_type | string | character varying | ✗ | - |
| action_status | string | character varying | ✓ | - |
| action_comment | string | text | ✓ | - |
| action_data | unknown | jsonb | ✓ | - |
| deadline | string | timestamp with time zone | ✓ | - |
| reminded_at | string | timestamp with time zone | ✓ | - |
| completed_at | string | timestamp with time zone | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |

---

## routing_step_participants

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 8

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | integer | bigint | ✗ | Note:
This is a Primary Key.<pk/> |
| step_id | integer | bigint | ✓ | Note:
This is a Foreign Key to `routing_template_steps.id`.<fk table='routing_template_steps' column='id'/> |
| participant_type | string | character varying | ✗ | - |
| participant_identifier | string | character varying | ✓ | - |
| required | boolean | boolean | ✓ | - |
| notification_enabled | boolean | boolean | ✓ | - |
| notification_priority | string | character varying | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |

---

## routing_template_steps

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 17

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | integer | bigint | ✗ | Note:
This is a Primary Key.<pk/> |
| template_id | integer | bigint | ✓ | Note:
This is a Foreign Key to `document_routing_templates.id`.<fk table='document_routing_templates' column='id'/> |
| step_order | integer | integer | ✗ | - |
| step_name | string | character varying | ✗ | - |
| step_description | string | text | ✓ | - |
| step_type | string | character varying | ✗ | - |
| routing_mode | string | character varying | ✗ | - |
| required_approvals | integer | integer | ✓ | - |
| deadline_hours | integer | integer | ✓ | - |
| escalate_after_hours | integer | integer | ✓ | - |
| escalate_to_role | string | character varying | ✓ | - |
| is_optional | boolean | boolean | ✓ | - |
| auto_advance | boolean | boolean | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |
| organization_id | string | uuid | ✓ | - |
| user_id | string | uuid | ✓ | - |

---

## safety_incidents

**Description:** Safety incidents requiring investigation and resolution

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 17

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| title | string | character varying | ✗ | - |
| description | string | text | ✓ | - |
| incident_type | string | character varying | ✓ | - |
| severity | string | character varying | ✓ | - |
| location | string | text | ✓ | - |
| status | string | character varying | ✓ | - |
| assigned_to | string | uuid | ✓ | - |
| organization_id | string | uuid | ✓ | Note:
This is a Foreign Key to `organizations.id`.<fk table='organizations' column='id'/> |
| project_id | string | uuid | ✓ | Note:
This is a Foreign Key to `projects.id`.<fk table='projects' column='id'/> |
| reported_by | string | uuid | ✓ | - |
| incident_date | string | timestamp with time zone | ✓ | - |
| due_date | string | timestamp with time zone | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |
| created_by | string | uuid | ✓ | - |
| updated_by | string | uuid | ✓ | - |

---

## safety_template_categories

**Description:** Categorization system for safety templates

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 8

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| category_code | string | character varying | ✗ | - |
| category_name | string | character varying | ✗ | - |
| category_description | string | text | ✓ | - |
| parent_category_id | string | uuid | ✓ | Note:
This is a Foreign Key to `safety_template_categories.id`.<fk table='safety_template_categories' column='id'/> |
| is_active | boolean | boolean | ✓ | - |
| sort_order | integer | integer | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |

---

## safety_template_dependencies

**Description:** Relationships and dependencies between safety templates

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 11

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| parent_template_id | string | uuid | ✓ | Note:
This is a Foreign Key to `safety_templates.id`.<fk table='safety_templates' column='id'/> |
| dependent_template_id | string | uuid | ✓ | Note:
This is a Foreign Key to `safety_templates.id`.<fk table='safety_templates' column='id'/> |
| dependency_type | string | character varying | ✗ | - |
| description | string | text | ✓ | - |
| applies_to_sites | array | text[] | ✓ | - |
| is_active | boolean | boolean | ✓ | - |
| valid_from | string | date | ✓ | - |
| valid_to | string | date | ✓ | - |
| created_by | string | uuid | ✓ | Note:
This is a Foreign Key to `user_management.user_id`.<fk table='user_management' column='user_id'/> |
| created_at | string | timestamp with time zone | ✓ | - |

---

## safety_template_usage

**Description:** Audit trail and analytics for safety template usage

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 10

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| template_id | string | uuid | ✓ | Note:
This is a Foreign Key to `safety_templates.id`.<fk table='safety_templates' column='id'/> |
| user_id | string | text | ✓ | - |
| action_type | string | character varying | ✗ | - |
| site_location | string | character varying | ✓ | - |
| contractor_name | string | character varying | ✓ | - |
| session_id | string | character varying | ✓ | - |
| user_agent | string | text | ✓ | - |
| ip_address | string | inet | ✓ | - |
| timestamp | string | timestamp with time zone | ✓ | - |

---

## safety_templates

**Description:** Standardized HSE Safety Templates - HTML content in html_content TEXT, schema in content_schema JSONB

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 32

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| organization_id | string | uuid | ✓ | Note:
This is a Foreign Key to `organizations.id`.<fk table='organizations' column='id'/> |
| discipline_id | string | uuid | ✓ | Note:
This is a Foreign Key to `disciplines.id`.<fk table='disciplines' column='id'/> |
| template_name | string | character varying | ✗ | - |
| template_description | string | text | ✓ | - |
| template_type | string | character varying | ✗ | - |
| template_category | string | character varying | ✓ | - |
| template_content | unknown | jsonb | ✓ | DEPRECATED: Use html_content for HTML, content_metadata for structured data. Remove post-migration. |
| form_schema | unknown | jsonb | ✓ | - |
| html_content | string | text | ✓ | - |
| risk_level | string | character varying | ✓ | - |
| applicable_sites | array | text[] | ✓ | - |
| required_certifications | array | text[] | ✓ | - |
| review_frequency | string | interval | ✓ | - |
| status | string | character varying | ✓ | - |
| is_active | boolean | boolean | ✓ | - |
| approval_status | string | character varying | ✓ | - |
| version | string | character varying | ✓ | - |
| is_latest | boolean | boolean | ✓ | - |
| created_by | string | uuid | ✓ | Note:
This is a Foreign Key to `user_management.user_id`.<fk table='user_management' column='user_id'/> |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_by | string | uuid | ✓ | Note:
This is a Foreign Key to `user_management.user_id`.<fk table='user_management' column='user_id'/> |
| updated_at | string | timestamp with time zone | ✓ | - |
| approved_by | string | uuid | ✓ | Note:
This is a Foreign Key to `user_management.user_id`.<fk table='user_management' column='user_id'/> |
| approved_at | string | timestamp with time zone | ✓ | - |
| content_schema | unknown | jsonb | ✓ | - |
| content_metadata | unknown | jsonb | ✓ | - |
| document_type | string | text | ✓ | Document type copied from governance template (e.g., Risk Assessment, Safety Inspection, Incident Report) |
| document_type_label | string | text | ✓ | Human-readable label for the document type |
| organization_name | string | text | ✓ | - |
| discipline_name | string | text | ✓ | - |
| source_governance_template_id | string | uuid | ✓ | - |

---

## safety_templates_backup_20251121

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 32

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✓ | - |
| organization_id | string | uuid | ✓ | - |
| discipline_id | string | uuid | ✓ | - |
| template_name | string | character varying | ✓ | - |
| template_description | string | text | ✓ | - |
| template_type | string | character varying | ✓ | - |
| template_category | string | character varying | ✓ | - |
| template_content | unknown | jsonb | ✓ | - |
| form_schema | unknown | jsonb | ✓ | - |
| html_content | string | text | ✓ | - |
| risk_level | string | character varying | ✓ | - |
| applicable_sites | array | text[] | ✓ | - |
| required_certifications | array | text[] | ✓ | - |
| review_frequency | string | interval | ✓ | - |
| status | string | character varying | ✓ | - |
| is_active | boolean | boolean | ✓ | - |
| approval_status | string | character varying | ✓ | - |
| version | string | character varying | ✓ | - |
| is_latest | boolean | boolean | ✓ | - |
| created_by | string | uuid | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_by | string | uuid | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |
| approved_by | string | uuid | ✓ | - |
| approved_at | string | timestamp with time zone | ✓ | - |
| content_schema | unknown | jsonb | ✓ | - |
| content_metadata | unknown | jsonb | ✓ | - |
| document_type | string | text | ✓ | - |
| document_type_label | string | text | ✓ | - |
| organization_name | string | text | ✓ | - |
| discipline_name | string | text | ✓ | - |
| source_governance_template_id | string | uuid | ✓ | - |

---

## schema_migrations

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 3

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| version | integer | integer | ✗ | Note:
This is a Primary Key.<pk/> |
| applied_at | string | timestamp with time zone | ✓ | - |
| description | string | text | ✓ | - |

---

## scope_of_work

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 22

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| title | string | character varying | ✗ | - |
| description | string | text | ✓ | - |
| project_id | string | uuid | ✓ | Note:
This is a Foreign Key to `projects.id`.<fk table='projects' column='id'/> |
| status | string | character varying | ✓ | - |
| priority | string | character varying | ✓ | - |
| estimated_cost | number | numeric | ✓ | - |
| target_completion_date | string | date | ✓ | - |
| assigned_to | string | uuid | ✓ | Note:
This is a Foreign Key to `user_management.user_id`.<fk table='user_management' column='user_id'/> |
| scope_type | string | character varying | ✗ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |
| additional_context | string | text | ✓ | - |
| project_specifications | string | text | ✓ | - |
| compliance_requirements | string | text | ✓ | - |
| reference_urls | string | text | ✓ | - |
| reference_documents | string | text | ✓ | - |
| content | string | text | ✓ | - |
| draft_saved | boolean | boolean | ✓ | - |
| category | string | character varying | ✓ | - |
| discipline_id | string | uuid | ✓ | Note:
This is a Foreign Key to `disciplines.id`.<fk table='disciplines' column='id'/> |
| organization_id | string | uuid | ✓ | Note:
This is a Foreign Key to `organizations.id`.<fk table='organizations' column='id'/> |

---

## scope_of_work_relationships

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 9

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| scope_of_work_id | string | uuid | ✓ | - |
| related_document_id | string | uuid | ✓ | - |
| relationship_type | string | text | ✓ | - |
| procurement_code | string | text | ✓ | - |
| description | string | text | ✓ | - |
| is_active | boolean | boolean | ✓ | - |
| created_by | string | uuid | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |

---

## section_hierarchy

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 7

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| parent_section_key | string | text | ✓ | Note:
This is a Foreign Key to `accordion_sections.section_key`.<fk table='accordion_sections' column='section_key'/> |
| child_section_key | string | text | ✓ | Note:
This is a Foreign Key to `accordion_sections.section_key`.<fk table='accordion_sections' column='section_key'/> |
| display_order | integer | integer | ✓ | - |
| is_virtual | boolean | boolean | ✓ | - |
| created_at | string | timestamp without time zone | ✓ | - |
| updated_at | string | timestamp without time zone | ✓ | - |

---

## section_organization_mapping

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 6

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| section_key | string | character varying | ✗ | Note:
This is a Foreign Key to `accordion_sections.section_key`.<fk table='accordion_sections' column='section_key'/> |
| organization_id | string | uuid | ✗ | Note:
This is a Foreign Key to `organizations.id`.<fk table='organizations' column='id'/> |
| is_visible | boolean | boolean | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |

---

## section_pages

**Description:** Maps pages to sections using section_key

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 8

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| section_key | string | character varying | ✗ | - |
| page_id | string | uuid | ✗ | Note:
This is a Foreign Key to `pages.page_id`.<fk table='pages' column='page_id'/> |
| display_order | integer | integer | ✗ | - |
| is_subsection | boolean | boolean | ✓ | - |
| parent_page_id | string | uuid | ✓ | Note:
This is a Foreign Key to `pages.page_id`.<fk table='pages' column='page_id'/> |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |

---

## sections

**Description:** Defines accordion sections with metadata, linked by section_key

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 9

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| section_key | string | character varying | ✗ | - |
| section_name | string | character varying | ✗ | - |
| section_description | string | text | ✓ | - |
| section_icon | string | character varying | ✓ | - |
| display_order | integer | integer | ✗ | - |
| is_active | boolean | boolean | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |

---

## sectors

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 7

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| sector_id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| sector_name | string | character varying | ✗ | - |
| is_active | boolean | boolean | ✗ | - |
| page_number_prefix_start | integer | integer | ✗ | - |
| page_number_prefix_end | integer | integer | ✗ | - |
| created_at | string | timestamp with time zone | ✗ | - |
| updated_at | string | timestamp with time zone | ✗ | - |

---

## security_alerts

**Description:** Security alerts and incidents requiring attention

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 16

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| alert_type | string | text | ✗ | - |
| severity | string | text | ✗ | - |
| title | string | text | ✗ | - |
| description | string | text | ✗ | - |
| user_id | string | uuid | ✓ | - |
| api_config_id | string | uuid | ✓ | - |
| ip_address | string | inet | ✓ | - |
| user_agent | string | text | ✓ | - |
| metadata | unknown | jsonb | ✓ | - |
| acknowledged | boolean | boolean | ✗ | - |
| acknowledged_by | string | uuid | ✓ | - |
| acknowledged_at | string | timestamp with time zone | ✓ | - |
| resolved | boolean | boolean | ✗ | - |
| resolved_at | string | timestamp with time zone | ✓ | - |
| created_at | string | timestamp with time zone | ✗ | - |

---

## security_audit_log

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 9

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| audit_type | string | text | ✗ | - |
| audit_date | string | date | ✗ | - |
| results | unknown | jsonb | ✗ | - |
| execution_time | string | interval | ✓ | - |
| tables_scanned | integer | integer | ✓ | - |
| policies_found | integer | integer | ✓ | - |
| critical_issues | integer | integer | ✓ | - |
| created_at | string | timestamp without time zone | ✓ | - |

---

## sequence_overrides

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 16

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| organization_id | string | uuid | ✓ | Note:
This is a Foreign Key to `organizations.id`.<fk table='organizations' column='id'/> |
| procurement_order_id | string | uuid | ✓ | Note:
This is a Foreign Key to `procurement_orders.id`.<fk table='procurement_orders' column='id'/> |
| template_variation_id | string | uuid | ✓ | Note:
This is a Foreign Key to `template_variation_sequences.id`.<fk table='template_variation_sequences' column='id'/> |
| original_sequence | unknown | jsonb | ✗ | - |
| overridden_sequence | unknown | jsonb | ✗ | - |
| override_reason | string | text | ✗ | - |
| override_type | string | character varying | ✗ | - |
| overridden_by | string | uuid | ✓ | - |
| approval_status | string | character varying | ✓ | - |
| approved_by | string | uuid | ✓ | - |
| approved_at | string | timestamp with time zone | ✓ | - |
| approval_notes | string | text | ✓ | - |
| validation_results | unknown | jsonb | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |

---

## shipment_containers

**Description:** Junction table linking shipments to containers

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 8

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| shipment_id | string | uuid | ✓ | Note:
This is a Foreign Key to `logistics_shipments.id`.<fk table='logistics_shipments' column='id'/> |
| container_id | string | uuid | ✓ | Note:
This is a Foreign Key to `containers.id`.<fk table='containers' column='id'/> |
| sequence_number | integer | integer | ✓ | - |
| loading_order | integer | integer | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| created_by | string | uuid | ✓ | - |
| organization_id | string | uuid | ✓ | - |

---

## signature_audit_trail

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 15

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| signature_document_id | string | uuid | ✓ | Note:
This is a Foreign Key to `signature_documents.id`.<fk table='signature_documents' column='id'/> |
| signature_request_id | string | uuid | ✓ | Note:
This is a Foreign Key to `signature_requests.id`.<fk table='signature_requests' column='id'/> |
| action_type | string | character varying | ✗ | - |
| action_description | string | text | ✓ | - |
| actor_id | string | uuid | ✓ | - |
| actor_email | string | character varying | ✓ | - |
| actor_ip_address | string | inet | ✓ | - |
| actor_user_agent | string | text | ✓ | - |
| previous_status | string | character varying | ✓ | - |
| new_status | string | character varying | ✓ | - |
| additional_data | unknown | jsonb | ✓ | - |
| compliance_flags | unknown | jsonb | ✓ | - |
| blockchain_hash | string | character varying | ✓ | - |
| performed_at | string | timestamp with time zone | ✓ | - |

---

## signature_documents

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 15

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| document_id | string | uuid | ✓ | Note:
This is a Foreign Key to `a_00900_doccontrol_documents.id`.<fk table='a_00900_doccontrol_documents' column='id'/> |
| documenso_document_id | string | character varying | ✗ | - |
| status | string | character varying | ✓ | - |
| workflow_type | string | character varying | ✓ | - |
| document_name | string | text | ✗ | - |
| document_url | string | text | ✓ | - |
| file_path | string | text | ✓ | - |
| created_by | string | uuid | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| expires_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |
| organization_id | integer | bigint | ✓ | - |
| contract_id | integer | bigint | ✓ | - |
| procurement_phase | string | character varying | ✓ | - |

---

## signature_requests

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 14

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| signature_document_id | string | uuid | ✓ | Note:
This is a Foreign Key to `signature_documents.id`.<fk table='signature_documents' column='id'/> |
| signer_email | string | character varying | ✗ | - |
| signer_name | string | character varying | ✓ | - |
| signer_role | string | character varying | ✓ | - |
| signing_order | integer | integer | ✓ | - |
| signature_status | string | character varying | ✓ | - |
| signed_at | string | timestamp with time zone | ✓ | - |
| declined_at | string | timestamp with time zone | ✓ | - |
| decline_reason | string | text | ✓ | - |
| documenso_recipient_id | string | character varying | ✓ | - |
| signature_field_id | string | character varying | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |

---

## signature_templates

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 15

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| organization_id | integer | bigint | ✓ | - |
| template_name | string | character varying | ✗ | - |
| template_description | string | text | ✓ | - |
| applicable_msic_codes | array | text[] | ✓ | - |
| applicable_contract_types | array | text[] | ✓ | - |
| applicable_procurement_phases | array | text[] | ✓ | - |
| required_signers | unknown | jsonb | ✓ | - |
| default_deadline_hours | integer | integer | ✓ | - |
| is_active | boolean | boolean | ✓ | - |
| is_default_for_msic | array | text[] | ✓ | - |
| created_by | string | uuid | ✓ | - |
| version | string | character varying | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |

---

## signature_webhooks

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 12

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| webhook_provider | string | character varying | ✓ | - |
| webhook_event_type | string | character varying | ✓ | - |
| webhook_id | string | character varying | ✓ | - |
| webhook_data | unknown | jsonb | ✓ | - |
| processed | boolean | boolean | ✓ | - |
| processed_at | string | timestamp with time zone | ✓ | - |
| processing_errors | unknown | jsonb | ✓ | - |
| signature_document_id | string | uuid | ✓ | Note:
This is a Foreign Key to `signature_documents.id`.<fk table='signature_documents' column='id'/> |
| contract_id | string | uuid | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |

---

## sow_appendices

**Description:** SOW appendices that require contribution and review from different disciplines

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 12

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| sow_id | string | uuid | ✓ | Note:
This is a Foreign Key to `scope_of_work.id`.<fk table='scope_of_work' column='id'/> |
| appendix_type | string | character varying | ✗ | - |
| title | string | character varying | ✗ | - |
| description | string | text | ✓ | - |
| status | string | character varying | ✓ | - |
| assigned_to | string | uuid | ✓ | - |
| organization_id | string | uuid | ✓ | Note:
This is a Foreign Key to `organizations.id`.<fk table='organizations' column='id'/> |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |
| created_by | string | uuid | ✓ | - |
| updated_by | string | uuid | ✓ | - |

---

## sow_document_transfers

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 23

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| scope_of_work_id | string | uuid | ✗ | Note:
This is a Foreign Key to `scope_of_work.id`.<fk table='scope_of_work' column='id'/> |
| document_type | string | character varying | ✗ | - |
| document_title | string | text | ✗ | - |
| document_version | string | character varying | ✓ | - |
| html_content | string | text | ✓ | - |
| css_styles | string | text | ✓ | - |
| generated_pdf_url | string | text | ✓ | - |
| cloud_storage_url | string | text | ✓ | - |
| generated_at | string | timestamp with time zone | ✓ | - |
| last_modified_at | string | timestamp with time zone | ✓ | - |
| generated_by | string | uuid | ✓ | Note:
This is a Foreign Key to `user_management.user_id`.<fk table='user_management' column='user_id'/> |
| approved_by | string | uuid | ✓ | Note:
This is a Foreign Key to `user_management.user_id`.<fk table='user_management' column='user_id'/> |
| approval_status | string | character varying | ✓ | - |
| routed_for_signature | boolean | boolean | ✓ | - |
| signature_status | string | character varying | ✓ | - |
| route_id | string | uuid | ✓ | - |
| transfer_status | string | character varying | ✓ | - |
| processing_errors | string | text | ✓ | - |
| file_size_bytes | integer | integer | ✓ | - |
| content_hash | string | character varying | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |

---

## sow_templates

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 11

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| template_name | string | character varying | ✗ | - |
| description | string | text | ✓ | - |
| order_type | string | character varying | ✗ | - |
| appendix_definitions | unknown | jsonb | ✗ | - |
| discipline_defaults | unknown | jsonb | ✓ | - |
| is_active | boolean | boolean | ✓ | - |
| organization_id | string | uuid | ✓ | Note:
This is a Foreign Key to `organizations.id`.<fk table='organizations' column='id'/> |
| created_by | string | uuid | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |

---

## sql_file_tracking

**Description:** Tracks SQL files and their corresponding Supabase table versions

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 4

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| file_path | string | character varying | ✗ | Note:
This is a Primary Key.<pk/> |
| supabase_table | string | character varying | ✗ | - |
| last_validated | string | timestamp with time zone | ✓ | - |
| schema_hash | string | character | ✗ | - |

---

## supplier_verifications

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 16

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| supplier_id | integer | integer | ✓ | Note:
This is a Foreign Key to `suppliers.id`.<fk table='suppliers' column='id'/> |
| source_id | string | uuid | ✓ | Note:
This is a Foreign Key to `integration_sources.id`.<fk table='integration_sources' column='id'/> |
| external_supplier_id | string | character varying | ✗ | - |
| source_system | string | character varying | ✗ | - |
| verification_data | unknown | jsonb | ✗ | - |
| verification_status | string | character varying | ✓ | - |
| bbbee_level | string | character varying | ✓ | - |
| tax_compliant | boolean | boolean | ✓ | - |
| bbbee_compliant | boolean | boolean | ✓ | - |
| cidb_registered | boolean | boolean | ✓ | - |
| expiry_date | string | date | ✓ | - |
| last_verified_at | string | timestamp with time zone | ✓ | - |
| verification_certificate_url | string | text | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |

---

## suppliers

**Description:** Table to store supplier information for procurement

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 24

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | integer | integer | ✗ | Note:
This is a Primary Key.<pk/> |
| name | string | character varying | ✗ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |
| address | string | text | ✓ | - |
| email | string | text | ✓ | - |
| phone | string | text | ✓ | - |
| contact_person | string | text | ✓ | - |
| project_id | string | uuid | ✓ | Note:
This is a Foreign Key to `projects.id`.<fk table='projects' column='id'/> |
| supplier_type | string | text | ✓ | Type of supplier (e.g., materials, equipment, services) |
| website | string | text | ✓ | Supplier website URL |
| approval_status | string | text | ✓ | Current approval status of the supplier |
| goods_services | string | text | ✓ | Description of goods and services provided |
| rating | number | numeric | ✓ | Supplier rating (0-5 scale) |
| completed_projects | integer | integer | ✓ | Number of completed projects |
| registration_date | string | date | ✓ | Date when supplier was registered |
| last_activity | string | timestamp with time zone | ✓ | Timestamp of last activity/update |
| tax_number | string | text | ✓ | Tax/VAT registration number |
| compliance_status | string | text | ✓ | Current compliance status |
| source_url | string | text | ✓ | URL where supplier information was scraped from |
| scrape_method | string | text | ✓ | Method used for scraping (e.g., tavily_search, manual) |
| scraped_at | string | timestamp with time zone | ✓ | Timestamp when supplier was scraped |
| organization_id | string | uuid | ✓ | - |
| user_id | string | uuid | ✓ | - |

---

## sync_history

**Description:** History of synchronization activities with external tender sources

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 8

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| source | string | character varying | ✓ | - |
| sync_type | string | character varying | ✓ | - |
| sync_completed_at | string | timestamp with time zone | ✓ | - |
| tenders_found | integer | integer | ✓ | - |
| tenders_new | integer | integer | ✓ | - |
| errors | unknown | jsonb | ✓ | - |
| metadata | unknown | jsonb | ✓ | - |

---

## task_attachments

**Description:** File attachments associated with tasks

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 8

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| task_id | string | uuid | ✗ | Note:
This is a Foreign Key to `tasks.id`.<fk table='tasks' column='id'/> |
| filename | string | character varying | ✗ | - |
| file_path | string | text | ✗ | - |
| file_size | integer | bigint | ✓ | - |
| mime_type | string | character varying | ✓ | - |
| uploaded_by | string | uuid | ✗ | - |
| created_at | string | timestamp with time zone | ✓ | - |

---

## task_comments

**Description:** Comments and notes added to tasks for collaboration

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 7

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| task_id | string | uuid | ✗ | Note:
This is a Foreign Key to `tasks.id`.<fk table='tasks' column='id'/> |
| user_id | string | uuid | ✗ | - |
| comment | string | text | ✗ | - |
| is_internal | boolean | boolean | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |

---

## task_history

**Description:** Audit trail of all changes made to tasks

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 8

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| task_id | string | uuid | ✗ | Note:
This is a Foreign Key to `tasks.id`.<fk table='tasks' column='id'/> |
| user_id | string | uuid | ✗ | - |
| action | string | character varying | ✗ | - |
| old_value | unknown | jsonb | ✓ | - |
| new_value | unknown | jsonb | ✓ | - |
| notes | string | text | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |

---

## task_messages

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 8

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| task_id | string | uuid | ✗ | Note:
This is a Foreign Key to `tasks.id`.<fk table='tasks' column='id'/> |
| message | string | text | ✗ | - |
| message_type | string | text | ✓ | - |
| from_discipline | string | text | ✗ | - |
| to_discipline | string | text | ✗ | - |
| created_by | string | uuid | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |

---

## task_sequence_execution

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 22

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| organization_id | string | uuid | ✓ | Note:
This is a Foreign Key to `organizations.id`.<fk table='organizations' column='id'/> |
| procurement_order_id | string | uuid | ✓ | Note:
This is a Foreign Key to `procurement_orders.id`.<fk table='procurement_orders' column='id'/> |
| template_variation | string | character varying | ✗ | - |
| template_variation_id | string | uuid | ✓ | Note:
This is a Foreign Key to `template_variation_sequences.id`.<fk table='template_variation_sequences' column='id'/> |
| planned_sequence | unknown | jsonb | ✗ | - |
| actual_sequence | unknown | jsonb | ✓ | - |
| sequence_adherence | number | numeric | ✓ | - |
| total_tasks | integer | integer | ✓ | - |
| completed_tasks | integer | integer | ✓ | - |
| current_task_position | integer | integer | ✓ | - |
| parallel_groups_active | integer | integer | ✓ | - |
| estimated_completion_time | string | timestamp with time zone | ✓ | - |
| actual_completion_time | string | timestamp with time zone | ✓ | - |
| deviations | unknown | jsonb | ✓ | - |
| bottlenecks | unknown | jsonb | ✓ | - |
| performance_metrics | unknown | jsonb | ✓ | - |
| status | string | character varying | ✓ | - |
| started_at | string | timestamp with time zone | ✓ | - |
| completed_at | string | timestamp with time zone | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |

---

## tasks

**Description:** Central repository for all tasks across the procurement and project management system

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 30

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Unique identifier for the task

Note:
This is a Primary Key.<pk/> |
| organization_id | string | uuid | ✗ | Organization context for multi-tenant isolation - references organizations(id)

Note:
This is a Foreign Key to `organizations.id`.<fk table='organizations' column='id'/> |
| task_type | string | character varying | ✗ | Type of task (procurement_review, appendix_contribution, hitl, etc.) |
| title | string | character varying | ✗ | - |
| description | string | text | ✓ | - |
| business_object_type | string | character varying | ✓ | Type of business object this task relates to |
| business_object_id | string | uuid | ✓ | ID of the specific business object |
| assigned_to | string | uuid | ✓ | User currently assigned to complete this task - references auth.users(id) |
| assigned_by | string | uuid | ✓ | User who assigned this task - references auth.users(id) |
| discipline | string | character varying | ✓ | Discipline this task belongs to (engineering, procurement, etc.) |
| priority | string | character varying | ✓ | - |
| status | string | character varying | ✓ | - |
| due_date | string | timestamp with time zone | ✓ | - |
| is_hitl | boolean | boolean | ✓ | Whether this task requires human intervention |
| intervention_type | string | character varying | ✓ | Type of human intervention required |
| chatbot_session_id | string | uuid | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |
| completed_at | string | timestamp with time zone | ✓ | - |
| escalated_at | string | timestamp with time zone | ✓ | - |
| metadata | unknown | jsonb | ✓ | Flexible storage for task-specific additional data |
| sequence_position | integer | integer | ✓ | - |
| sequence_group | string | character varying | ✓ | - |
| sequence_dependencies | unknown | jsonb | ✓ | - |
| sequence_execution_id | string | uuid | ✓ | - |
| estimated_duration_minutes | integer | integer | ✓ | - |
| actual_duration_minutes | integer | integer | ✓ | - |
| assigned_to_discipline | string | text | ✓ | - |
| procurement_order_id | string | uuid | ✓ | Note:
This is a Foreign Key to `procurement_orders.id`.<fk table='procurement_orders' column='id'/> |
| created_by | string | uuid | ✓ | - |

---

## technical_document_categories

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 11

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| category_code | string | character varying | ✗ | - |
| category_name | string | character varying | ✗ | - |
| category_description | string | text | ✓ | - |
| discipline | string | character varying | ✗ | - |
| document_type | string | character varying | ✗ | - |
| template_count | integer | integer | ✓ | - |
| is_active | boolean | boolean | ✓ | - |
| sort_order | integer | integer | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |

---

## template_analytics

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 11

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| template_id | string | uuid | ✓ | Note:
This is a Foreign Key to `templates.id`.<fk table='templates' column='id'/> |
| date | string | date | ✗ | - |
| total_uses | integer | integer | ✓ | - |
| successful_uses | integer | integer | ✓ | - |
| failed_uses | integer | integer | ✓ | - |
| unique_users | integer | integer | ✓ | - |
| average_generation_time | number | numeric | ✓ | - |
| total_tokens_used | integer | integer | ✓ | - |
| created_at | string | timestamp without time zone | ✓ | - |
| updated_at | string | timestamp without time zone | ✓ | - |

---

## template_approval_rules

**Description:** Workflow rules for template approvals based on type and value

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 10

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| template_type | string | character varying | ✗ | - |
| category | string | character varying | ✓ | - |
| value_threshold | number | numeric | ✓ | - |
| required_roles | array | text[] | ✓ | - |
| requires_technical_review | boolean | boolean | ✓ | - |
| requires_legal_review | boolean | boolean | ✓ | - |
| approval_order | string | character varying | ✓ | - |
| is_active | boolean | boolean | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |

---

## template_approval_workflows

**Description:** Approval workflow instances for procurement templates

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 13

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| template_id | string | uuid | ✓ | Note:
This is a Foreign Key to `procurement_templates.id`.<fk table='procurement_templates' column='id'/> |
| workflow_type | unknown | jsonb | ✓ | - |
| status | string | text | ✓ | - |
| current_step | integer | integer | ✓ | - |
| created_by | string | uuid | ✓ | - |
| updated_by | string | uuid | ✓ | - |
| approved_at | string | timestamp with time zone | ✓ | - |
| rejected_at | string | timestamp with time zone | ✓ | - |
| required_approvals | unknown | jsonb | ✓ | - |
| metadata | unknown | jsonb | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |

---

## template_assignments

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 18

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| template_id | string | uuid | ✗ | Note:
This is a Foreign Key to `templates.id`.<fk table='templates' column='id'/> |
| assigned_to_type | string | character varying | ✗ | - |
| assigned_to_id | string | uuid | ✗ | - |
| assigned_by | string | uuid | ✓ | - |
| assigned_at | string | timestamp without time zone | ✓ | - |
| status | string | character varying | ✓ | - |
| due_date | string | date | ✓ | - |
| priority | string | character varying | ✓ | - |
| submitted_data | unknown | jsonb | ✓ | - |
| submitted_at | string | timestamp without time zone | ✓ | - |
| contractor_comments | string | text | ✓ | - |
| reviewed_by | string | uuid | ✓ | - |
| reviewed_at | string | timestamp without time zone | ✓ | - |
| review_status | string | character varying | ✓ | - |
| reviewer_comments | string | text | ✓ | - |
| created_at | string | timestamp without time zone | ✓ | - |
| updated_at | string | timestamp without time zone | ✓ | - |

---

## template_categories

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 11

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | character varying | ✗ | Note:
This is a Primary Key.<pk/> |
| name | string | character varying | ✗ | - |
| description | string | text | ✓ | - |
| count | integer | integer | ✓ | - |
| category_type | string | character varying | ✓ | - |
| parent_category_id | string | character varying | ✓ | Note:
This is a Foreign Key to `template_categories.id`.<fk table='template_categories' column='id'/> |
| is_active | boolean | boolean | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |
| organization_id | string | uuid | ✓ | - |
| user_id | string | uuid | ✓ | - |

---

## template_customization_rules

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 11

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| template_category | string | text | ✗ | - |
| customization_type | string | text | ✗ | - |
| field_name | string | text | ✗ | - |
| field_type | string | text | ✗ | - |
| is_required | boolean | boolean | ✓ | - |
| validation_rules | unknown | jsonb | ✓ | - |
| auto_populate_from | string | text | ✓ | - |
| created_at | string | timestamp without time zone | ✓ | - |
| organization_id | string | uuid | ✓ | - |
| user_id | string | uuid | ✓ | - |

---

## template_dependencies

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 8

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| template_id | string | uuid | ✓ | - |
| parent_template_id | string | uuid | ✓ | - |
| dependent_template_id | string | uuid | ✓ | - |
| dependency_type | string | text | ✓ | - |
| dependency_condition | unknown | jsonb | ✓ | - |
| is_required | boolean | boolean | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |

---

## template_deployments

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 8

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| project_template_id | string | uuid | ✓ | Note:
This is a Foreign Key to `project_templates.id`.<fk table='project_templates' column='id'/> |
| deployment_type | string | text | ✗ | - |
| source_system | string | text | ✗ | - |
| target_system | string | text | ✗ | - |
| status | string | text | ✓ | - |
| error_message | string | text | ✓ | - |
| executed_at | string | timestamp without time zone | ✓ | - |

---

## template_derivations

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 8

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| parent_template_id | string | uuid | ✓ | Note:
This is a Foreign Key to `procurement_templates.id`.<fk table='procurement_templates' column='id'/> |
| derived_template_id | string | uuid | ✓ | Note:
This is a Foreign Key to `procurement_templates.id`.<fk table='procurement_templates' column='id'/> |
| derivation_type | string | character varying | ✓ | - |
| derivation_date | string | timestamp without time zone | ✓ | - |
| derived_by | string | uuid | ✓ | Note:
This is a Foreign Key to `user_management.user_id`.<fk table='user_management' column='user_id'/> |
| derivation_reason | string | text | ✓ | - |
| organization_id | string | uuid | ✓ | Note:
This is a Foreign Key to `organizations.id`.<fk table='organizations' column='id'/> |

---

## template_document_structures

**Description:** Links templates to their hierarchical document structures

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 10

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| template_id | string | uuid | ✗ | - |
| discipline_table | string | text | ✗ | - |
| hierarchy_definition_id | string | uuid | ✓ | Note:
This is a Foreign Key to `document_hierarchy_definitions.id`.<fk table='document_hierarchy_definitions' column='id'/> |
| structure_data | unknown | jsonb | ✓ | - |
| is_active | boolean | boolean | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |
| created_by | string | uuid | ✓ | - |
| organization_id | string | uuid | ✓ | - |

---

## template_relationships

**Description:** Links templates together for complex document assemblies

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 10

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| parent_template_id | string | uuid | ✗ | - |
| child_template_id | string | uuid | ✗ | - |
| relationship_type | string | text | ✗ | - |
| section_path | string | text | ✓ | - |
| is_required | boolean | boolean | ✓ | - |
| sort_order | integer | integer | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| created_by | string | uuid | ✓ | - |
| organization_id | string | uuid | ✓ | - |

---

## template_reviews

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 7

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| template_id | string | uuid | ✓ | Note:
This is a Foreign Key to `templates.id`.<fk table='templates' column='id'/> |
| user_id | string | uuid | ✓ | - |
| rating | integer | integer | ✓ | - |
| review_text | string | text | ✓ | - |
| is_helpful | boolean | boolean | ✓ | - |
| created_at | string | timestamp without time zone | ✓ | - |

---

## template_usage_logs

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 10

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| template_id | string | uuid | ✓ | Note:
This is a Foreign Key to `templates.id`.<fk table='templates' column='id'/> |
| template_type | string | character varying | ✗ | - |
| user_id | string | uuid | ✓ | - |
| session_id | string | character varying | ✓ | - |
| generation_time | integer | integer | ✓ | - |
| success | boolean | boolean | ✓ | - |
| error_message | string | text | ✓ | - |
| metadata | unknown | jsonb | ✓ | - |
| created_at | string | timestamp without time zone | ✓ | - |

---

## template_usage_stats

**Description:** Analytics and usage statistics for templates

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 10

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| template_type | string | character varying | ✗ | - |
| category | string | character varying | ✓ | - |
| usage_count | integer | integer | ✓ | - |
| last_used | string | timestamp with time zone | ✓ | - |
| average_population_time | string | interval | ✓ | - |
| success_rate | number | numeric | ✓ | - |
| common_populations | unknown | jsonb | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |

---

## template_usage_tracking

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 10

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| user_id | string | uuid | ✓ | - |
| template_id | string | uuid | ✓ | - |
| action_type | string | text | ✗ | - |
| procurement_code | string | text | ✓ | - |
| department_code | string | character varying | ✓ | - |
| session_id | string | text | ✓ | - |
| user_agent | string | text | ✓ | - |
| ip_address | string | inet | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |

---

## template_variation_sequences

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 21

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| organization_id | string | uuid | ✓ | Note:
This is a Foreign Key to `organizations.id`.<fk table='organizations' column='id'/> |
| discipline_code | string | character varying | ✗ | - |
| template_variation | string | character varying | ✗ | - |
| variation_name | string | character varying | ✗ | - |
| description | string | text | ✓ | - |
| complexity_level | string | character varying | ✗ | - |
| sequence_definition | unknown | jsonb | ✗ | - |
| parallel_groups | unknown | jsonb | ✓ | - |
| dependencies | unknown | jsonb | ✓ | - |
| estimated_duration_minutes | integer | integer | ✓ | - |
| estimated_duration_display | string | character varying | ✓ | - |
| appendices_included | unknown | jsonb | ✓ | - |
| skip_tasks | unknown | jsonb | ✓ | - |
| business_rules | unknown | jsonb | ✓ | - |
| is_default | boolean | boolean | ✓ | - |
| is_active | boolean | boolean | ✓ | - |
| created_by | string | uuid | ✓ | - |
| updated_by | string | uuid | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |

---

## template_versions

**Description:** Version history for master template changes

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 6

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| template_id | string | uuid | ✓ | Note:
This is a Foreign Key to `master_templates.id`.<fk table='master_templates' column='id'/> |
| version_number | integer | integer | ✗ | - |
| changes | string | text | ✗ | - |
| content | unknown | jsonb | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |

---

## templates

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 33

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| type | string | character varying | ✗ | Template type (form_template, questionnaire, etc.) - not unique since same types can be used across disciplines |
| name | string | character varying | ✗ | - |
| description | string | text | ✓ | - |
| version | string | character varying | ✓ | - |
| prompt_template | string | text | ✗ | - |
| validation_config | unknown | jsonb | ✓ | - |
| ui_config | unknown | jsonb | ✓ | - |
| is_active | boolean | boolean | ✓ | - |
| is_public | boolean | boolean | ✓ | - |
| created_by | string | uuid | ✓ | - |
| updated_by | string | uuid | ✓ | - |
| usage_count | integer | integer | ✓ | - |
| success_rate | number | numeric | ✓ | - |
| average_generation_time | integer | integer | ✓ | - |
| tags | array | text[] | ✓ | - |
| created_at | string | timestamp without time zone | ✓ | - |
| updated_at | string | timestamp without time zone | ✓ | - |
| discipline_code | string | character varying | ✓ | EPCM discipline code (01300=Governance, 00850=Civil, 01900=Procurement, 02400=HSSE) |
| document_type | string | character varying | ✓ | Specific document type within the discipline (questionnaire, form, assessment, etc.) |
| discipline | string | character varying | ✓ | - |
| copied_from_template_id | string | uuid | ✓ | References the original template this was copied from

Note:
This is a Foreign Key to `templates.id`.<fk table='templates' column='id'/> |
| template_scope | string | character varying | ✓ | Indicates if template is original, copied, or project-specific |
| target_discipline | string | character varying | ✓ | The discipline this template was copied to (for copied templates) |
| copy_metadata | unknown | jsonb | ✓ | Additional metadata about the copy operation |
| processing_status | string | text | ✓ | - |
| organization_id | string | uuid | ✓ | - |
| suitable_for_document_types | array | text[] | ✓ | Array of document types this template is suitable for (purchase_order, work_order, service_order) |
| category | string | character varying | ✓ | - |
| deleted_at | string | timestamp without time zone | ✓ | - |
| deleted_by | string | uuid | ✓ | - |
| deletion_reason | string | text | ✓ | - |
| metadata | unknown | jsonb | ✓ | Discipline-specific metadata and configuration (e.g., procurement codes, category mappings, protection settings) |

---

## temporary_uploads

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 11

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| user_id | string | uuid | ✗ | - |
| organization_id | string | uuid | ✓ | - |
| company_id | string | uuid | ✓ | - |
| file_name | string | text | ✗ | - |
| file_path | string | text | ✗ | - |
| file_size | integer | integer | ✗ | - |
| file_type | string | character varying | ✗ | - |
| document_type | string | character varying | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| expires_at | string | timestamp with time zone | ✗ | - |

---

## tender_approvals

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 13

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| tender_id | string | uuid | ✗ | Note:
This is a Foreign Key to `tenders.id`.<fk table='tenders' column='id'/> |
| approval_level | integer | integer | ✗ | - |
| approver_id | string | uuid | ✓ | - |
| approver_name | string | text | ✓ | - |
| approver_role | string | text | ✓ | - |
| approval_status | string | character varying | ✓ | - |
| approval_date | string | timestamp without time zone | ✓ | - |
| comments | string | text | ✓ | - |
| approval_document_url | string | text | ✓ | - |
| delegation_to | string | uuid | ✓ | - |
| created_at | string | timestamp without time zone | ✓ | - |
| updated_at | string | timestamp without time zone | ✓ | - |

---

## tender_documents

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 18

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| tender_id | string | uuid | ✗ | - |
| document_type | string | character varying | ✗ | - |
| document_name | string | text | ✗ | - |
| document_category | string | character varying | ✓ | - |
| file_path | string | text | ✗ | - |
| file_url | string | text | ✓ | - |
| file_size | integer | integer | ✓ | - |
| mime_type | string | character varying | ✓ | - |
| original_url | string | text | ✓ | - |
| original_filename | string | text | ✓ | - |
| download_status | string | character varying | ✓ | - |
| checksum_hash | string | text | ✓ | - |
| processing_status | string | character varying | ✓ | - |
| metadata | unknown | jsonb | ✓ | - |
| created_by | string | text | ✓ | - |
| created_at | string | timestamp without time zone | ✓ | - |
| updated_at | string | timestamp without time zone | ✓ | - |

---

## tender_evaluation

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 9

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| tender_id | string | uuid | ✗ | Note:
This is a Foreign Key to `tenders.id`.<fk table='tenders' column='id'/> |
| criterion_name | string | text | ✗ | - |
| criterion_description | string | text | ✓ | - |
| weightage | number | numeric | ✗ | - |
| max_score | number | numeric | ✗ | - |
| evaluation_method | string | character varying | ✓ | - |
| is_mandatory | boolean | boolean | ✓ | - |
| created_at | string | timestamp without time zone | ✓ | - |

---

## tender_items

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 13

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| tender_id | string | uuid | ✗ | Note:
This is a Foreign Key to `tenders.id`.<fk table='tenders' column='id'/> |
| item_number | string | character varying | ✗ | - |
| description | string | text | ✗ | - |
| quantity | number | numeric | ✗ | - |
| unit | string | character varying | ✗ | - |
| estimated_unit_price | number | numeric | ✓ | - |
| estimated_total_price | number | numeric | ✓ | - |
| specifications | string | text | ✓ | - |
| delivery_timeline | string | text | ✓ | - |
| quality_standards | string | text | ✓ | - |
| created_at | string | timestamp without time zone | ✓ | - |
| updated_at | string | timestamp without time zone | ✓ | - |

---

## tender_monitors

**Description:** Stores automated tender monitoring configurations with filter criteria

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 10

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| name | string | character varying | ✗ | - |
| description | string | text | ✓ | - |
| frequency | string | character varying | ✓ | Check frequency: hourly, daily, or weekly |
| filters | unknown | jsonb | ✓ | JSON object containing filter criteria for matched tenders |
| is_active | boolean | boolean | ✓ | - |
| created_by_user_id | string | character varying | ✓ | - |
| user_ids | unknown | jsonb | ✓ | JSON array of user IDs to notify (in addition to created_by_user_id) |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |

---

## tender_notification_logs

**Description:** Logs all notifications sent to users about new tenders

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 10

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| monitor_id | string | uuid | ✓ | Note:
This is a Foreign Key to `tender_monitors.id`.<fk table='tender_monitors' column='id'/> |
| tender_id | string | character varying | ✓ | - |
| tender_title | string | character varying | ✓ | - |
| tender_number | string | character varying | ✓ | - |
| issuing_organization | string | character varying | ✓ | - |
| estimated_value | number | numeric | ✓ | - |
| currency | string | character varying | ✓ | - |
| location | string | text | ✓ | - |
| notification_sent_at | string | timestamp with time zone | ✓ | - |

---

## tender_suppliers

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 25

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| tender_id | string | uuid | ✗ | Note:
This is a Foreign Key to `tenders.id`.<fk table='tenders' column='id'/> |
| supplier_id | string | uuid | ✓ | - |
| supplier_name | string | text | ✗ | - |
| contact_person | string | text | ✓ | - |
| contact_email | string | text | ✓ | - |
| contact_phone | string | text | ✓ | - |
| bid_amount | number | numeric | ✓ | - |
| bid_currency | string | character varying | ✓ | - |
| bid_validity_period | integer | integer | ✓ | - |
| technical_score | number | numeric | ✓ | - |
| financial_score | number | numeric | ✓ | - |
| overall_score | number | numeric | ✓ | - |
| bid_status | string | character varying | ✓ | - |
| submission_date | string | timestamp without time zone | ✓ | - |
| bid_document_url | string | text | ✓ | - |
| technical_proposal | string | text | ✓ | - |
| financial_proposal | string | text | ✓ | - |
| clarifications_requested | array | text[] | ✓ | - |
| clarifications_provided | array | text[] | ✓ | - |
| evaluation_notes | string | text | ✓ | - |
| ranking | integer | integer | ✓ | - |
| is_preferred | boolean | boolean | ✓ | - |
| created_at | string | timestamp without time zone | ✓ | - |
| updated_at | string | timestamp without time zone | ✓ | - |

---

## tenders

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 54

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| tender_number | string | character varying | ✗ | - |
| title | string | text | ✗ | - |
| description | string | text | ✓ | - |
| tender_type | string | character varying | ✗ | - |
| procurement_method | string | character varying | ✗ | - |
| status | string | character varying | ✗ | - |
| priority | string | character varying | ✗ | - |
| estimated_value | number | numeric | ✓ | - |
| currency | string | character varying | ✓ | - |
| budget_allocated | number | numeric | ✓ | - |
| issue_date | string | date | ✗ | - |
| pre_bid_meeting_date | string | date | ✓ | - |
| bid_submission_deadline | string | date | ✗ | - |
| bid_opening_date | string | date | ✓ | - |
| evaluation_completion_date | string | date | ✓ | - |
| award_date | string | date | ✓ | - |
| contract_start_date | string | date | ✓ | - |
| contract_end_date | string | date | ✓ | - |
| location | string | text | ✓ | - |
| scope_of_work | string | text | ✓ | - |
| technical_specifications | string | text | ✓ | - |
| evaluation_criteria | string | text | ✓ | - |
| procurement_officer_id | string | uuid | ✓ | - |
| project_id | string | uuid | ✓ | - |
| department_id | string | uuid | ✓ | - |
| approval_status | string | character varying | ✓ | - |
| approval_workflow_id | string | uuid | ✓ | - |
| current_approval_level | integer | integer | ✓ | - |
| number_of_bids | integer | integer | ✓ | - |
| awarded_supplier_id | string | uuid | ✓ | - |
| awarded_supplier_name | string | text | ✓ | - |
| contract_value | number | numeric | ✓ | - |
| created_by | string | uuid | ✓ | - |
| created_at | string | timestamp without time zone | ✓ | - |
| updated_by | string | uuid | ✓ | - |
| updated_at | string | timestamp without time zone | ✓ | - |
| version | integer | integer | ✓ | - |
| eligibility_requirements | string | text | ✓ | - |
| bid_security_amount | number | numeric | ✓ | - |
| bid_security_currency | string | character varying | ✓ | - |
| performance_security_percentage | number | numeric | ✓ | - |
| payment_terms | string | text | ✓ | - |
| delivery_timeline | string | text | ✓ | - |
| warranty_requirements | string | text | ✓ | - |
| tender_document_url | string | text | ✓ | - |
| addendum_urls | unknown | jsonb | ✓ | - |
| clarification_responses | unknown | jsonb | ✓ | - |
| compliance_requirements | string | text | ✓ | - |
| legal_requirements | string | text | ✓ | - |
| is_active | boolean | boolean | ✓ | - |
| tags | array | text[] | ✓ | - |
| notes | string | text | ✓ | - |
| organization_id | string | uuid | ✓ | Note:
This is a Foreign Key to `organizations.id`.<fk table='organizations' column='id'/> |

---

## timesheet_amendments

**Description:** Amendments to timesheet entries

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 11

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| timesheet_id | string | uuid | ✓ | Timesheet this amendment is for

Note:
This is a Foreign Key to `timesheets.id`.<fk table='timesheets' column='id'/> |
| requested_by | string | uuid | ✓ | User who requested the amendment

Note:
This is a Foreign Key to `user_management.user_id`.<fk table='user_management' column='user_id'/> |
| reason | string | text | ✗ | Reason for the amendment |
| status | string | character varying | ✓ | Status of the amendment |
| approved_by | string | uuid | ✓ | User who approved the amendment

Note:
This is a Foreign Key to `user_management.user_id`.<fk table='user_management' column='user_id'/> |
| approved_at | string | timestamp with time zone | ✓ | When the amendment was approved |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |
| organization_id | string | uuid | ✓ | - |
| user_id | string | uuid | ✓ | - |

---

## timesheet_audit_logs

**Description:** Audit logs for timesheet changes

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 10

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| timesheet_id | string | uuid | ✓ | Timesheet this log entry is for

Note:
This is a Foreign Key to `timesheets.id`.<fk table='timesheets' column='id'/> |
| user_id | string | uuid | ✓ | User who made the change

Note:
This is a Foreign Key to `user_management.user_id`.<fk table='user_management' column='user_id'/> |
| action | string | character varying | ✗ | Action performed |
| old_values | unknown | jsonb | ✓ | Old values before the change |
| new_values | unknown | jsonb | ✓ | New values after the change |
| ip_address | string | inet | ✓ | IP address of the user |
| user_agent | string | text | ✓ | User agent of the request |
| created_at | string | timestamp with time zone | ✓ | - |
| organization_id | string | uuid | ✓ | Note:
This is a Foreign Key to `organizations.id`.<fk table='organizations' column='id'/> |

---

## timesheet_descriptions

**Description:** Timesheet task descriptions and codes per project

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 10

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Unique identifier for the description

Note:
This is a Primary Key.<pk/> |
| project_id | string | uuid | ✓ | Reference to the project

Note:
This is a Foreign Key to `projects.id`.<fk table='projects' column='id'/> |
| code | string | character varying | ✗ | Task code for timesheet entry |
| description | string | text | ✗ | Detailed task description |
| category | string | character varying | ✓ | Task category for grouping |
| is_active | boolean | boolean | ✓ | Whether the description is active for use |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |
| created_by | string | uuid | ✓ | - |
| updated_by | string | uuid | ✓ | - |

---

## timesheet_entries

**Description:** Timesheet entries for user work hours tracking (new implementation)

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 16

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| user_id | string | uuid | ✓ | User who owns this timesheet entry |
| week_start_date | string | date | ✗ | Start date of the week (Monday) for this timesheet |
| description | string | character varying | ✗ | Description of the task or work performed |
| project | string | character varying | ✓ | Project associated with this task |
| monday_hours | number | numeric | ✓ | Hours worked on Monday |
| tuesday_hours | number | numeric | ✓ | Hours worked on Tuesday |
| wednesday_hours | number | numeric | ✓ | Hours worked on Wednesday |
| thursday_hours | number | numeric | ✓ | Hours worked on Thursday |
| friday_hours | number | numeric | ✓ | Hours worked on Friday |
| saturday_hours | number | numeric | ✓ | Hours worked on Saturday |
| sunday_hours | number | numeric | ✓ | Hours worked on Sunday |
| total_hours | number | numeric | ✓ | Total hours calculated automatically |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |
| organization_id | string | uuid | ✓ | - |

---

## timesheet_submissions

**Description:** Timesheet submissions for approval workflow

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 16

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Unique identifier for the submission

Note:
This is a Primary Key.<pk/> |
| user_id | string | uuid | ✓ | Reference to the user who submitted |
| week_key | string | character varying | ✗ | Week identifier in YYYY-WXX format |
| week_start_date | string | date | ✗ | Start date of the week |
| week_end_date | string | date | ✗ | End date of the week |
| tasks | unknown | jsonb | ✗ | JSON array of tasks for the week |
| total_hours | number | numeric | ✓ | Total hours for the week |
| status | string | character varying | ✓ | Current status: draft, submitted, approved, rejected |
| submitted_at | string | timestamp with time zone | ✓ | When the timesheet was submitted |
| approved_at | string | timestamp with time zone | ✓ | When the timesheet was approved |
| rejected_at | string | timestamp with time zone | ✓ | When the timesheet was rejected |
| approver_id | string | uuid | ✓ | Reference to the approver |
| rejection_reason | string | text | ✓ | Reason for rejection if rejected |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |
| organization_id | string | uuid | ✓ | - |

---

## timesheet_templates

**Description:** Templates for creating timesheet entries

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 7

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| user_id | string | uuid | ✓ | User who owns this template |
| name | string | character varying | ✗ | Name of the template |
| tasks | unknown | jsonb | ✓ | JSON array of task templates |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |
| organization_id | string | uuid | ✓ | - |

---

## timesheets

**Description:** Timesheet entries for employee work hours tracking

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 19

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| employee_id | string | uuid | ✗ | Employee who owns this timesheet entry

Note:
This is a Foreign Key to `user_management.user_id`.<fk table='user_management' column='user_id'/> |
| date | string | date | ✗ | Date of the work |
| hours | number | numeric | ✗ | Hours worked on this date |
| project | string | character varying | ✗ | Project associated with this work |
| task | string | character varying | ✓ | Task associated with this work |
| client | string | character varying | ✓ | Client associated with this work |
| comments | string | text | ✓ | Comments about this work |
| currency | string | character varying | ✓ | Currency for any monetary values |
| status | string | character varying | ✓ | Status of this timesheet entry |
| template_id | string | uuid | ✓ | Template used to create this entry |
| approved_by | string | uuid | ✓ | User who approved this entry

Note:
This is a Foreign Key to `user_management.user_id`.<fk table='user_management' column='user_id'/> |
| approved_at | string | timestamp with time zone | ✓ | When this entry was approved |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |
| locked | boolean | boolean | ✓ | Whether this entry is locked from editing |
| locked_at | string | timestamp with time zone | ✓ | When this entry was locked |
| user_id | string | uuid | ✓ | - |
| organization_id | string | uuid | ✓ | - |

---

## tracking_events

**Description:** Historical tracking events for vessels and containers

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 23

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| event_type | string | character varying | ✗ | - |
| event_category | string | character varying | ✗ | - |
| vessel_id | string | uuid | ✓ | Note:
This is a Foreign Key to `vessels.id`.<fk table='vessels' column='id'/> |
| container_id | string | uuid | ✓ | Note:
This is a Foreign Key to `containers.id`.<fk table='containers' column='id'/> |
| event_timestamp | string | timestamp with time zone | ✗ | - |
| event_description | string | text | ✓ | - |
| event_location | string | character varying | ✓ | - |
| latitude | number | numeric | ✓ | - |
| longitude | number | numeric | ✓ | - |
| status_code | string | character varying | ✓ | - |
| status_description | string | character varying | ✓ | - |
| port_code | string | character varying | ✓ | - |
| port_name | string | character varying | ✓ | - |
| facility_name | string | character varying | ✓ | - |
| event_data | unknown | jsonb | ✓ | - |
| data_source | string | character varying | ✓ | - |
| api_reference | string | character varying | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| created_by | string | uuid | ✓ | - |
| company_id | string | uuid | ✓ | - |
| organisation_id | string | uuid | ✓ | - |
| project_id | string | uuid | ✓ | - |

---

## training_materials

**Description:** Training materials for procurement processes with full compliance and certification tracking

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 27

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| purpose | string | text | ✗ | Primary purpose and objective of the training material |
| target_audience | string | text | ✗ | Target audience for the training material |
| description | string | text | ✓ | - |
| content | string | text | ✓ | - |
| status | string | text | ✗ | - |
| priority | string | text | ✗ | - |
| certification | unknown | jsonb | ✓ | Certification details including type and issuing authority |
| compliance_requirements | unknown | jsonb | ✓ | Specific compliance requirements that must be met |
| regulatory_standards | array | text[] | ✓ | Array of regulatory standards this training material addresses |
| estimated_duration | string | interval | ✓ | - |
| scheduled_date | string | timestamp with time zone | ✓ | - |
| completion_deadline | string | timestamp with time zone | ✓ | - |
| procurement_order_id | string | uuid | ✓ | Note:
This is a Foreign Key to `procurement_orders.id`.<fk table='procurement_orders' column='id'/> |
| scope_of_work_id | string | uuid | ✓ | Note:
This is a Foreign Key to `scope_of_work.id`.<fk table='scope_of_work' column='id'/> |
| project_id | string | uuid | ✓ | Note:
This is a Foreign Key to `projects.id`.<fk table='projects' column='id'/> |
| organization_id | string | uuid | ✓ | Note:
This is a Foreign Key to `organizations.id`.<fk table='organizations' column='id'/> |
| assigned_to | string | uuid | ✓ | Note:
This is a Foreign Key to `user_profiles.user_id`.<fk table='user_profiles' column='user_id'/> |
| created_by | string | uuid | ✓ | Note:
This is a Foreign Key to `user_profiles.user_id`.<fk table='user_profiles' column='user_id'/> |
| approved_by | string | uuid | ✓ | Note:
This is a Foreign Key to `user_profiles.user_id`.<fk table='user_profiles' column='user_id'/> |
| category | string | text | ✓ | - |
| subcategory | string | text | ✓ | - |
| tags | array | text[] | ✓ | - |
| metadata | unknown | jsonb | ✓ | Additional metadata for tracking test data, versions, etc. |
| notes | string | text | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |

---

## training_pipeline_dashboard

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 12

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| discipline_code | string | text | ✓ | - |
| discipline_name | string | text | ✓ | - |
| training_examples_count | integer | integer | ✓ | - |
| local_scan_status | string | text | ✓ | - |
| hf_upload_status | string | text | ✓ | - |
| runpod_training_status | string | text | ✓ | - |
| production_deployment_status | string | text | ✓ | - |
| training_duration_hours | number | numeric | ✓ | - |
| estimated_cost_usd | number | numeric | ✓ | - |
| improvement_percentage | number | numeric | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |
| pipeline_status | string | text | ✓ | - |

---

## training_pipeline_status

**Description:** Tracks training data pipeline status from local storage through production deployment

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 30

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| discipline_code | string | text | ✗ | Unique identifier for the discipline (e.g., procurement, safety) |
| discipline_name | string | text | ✓ | - |
| training_examples_count | integer | integer | ✓ | Number of training examples in the dataset |
| file_size_bytes | integer | integer | ✓ | - |
| file_hash | string | text | ✓ | SHA256 hash for file integrity verification |
| quality_score_min | number | numeric | ✓ | - |
| quality_score_max | number | numeric | ✓ | - |
| quality_score_avg | number | numeric | ✓ | - |
| file_last_modified | string | timestamp with time zone | ✓ | - |
| local_scan_status | string | text | ✓ | - |
| local_scan_timestamp | string | timestamp with time zone | ✓ | - |
| hf_upload_status | string | text | ✓ | - |
| hf_upload_timestamp | string | timestamp with time zone | ✓ | - |
| hf_repository_url | string | text | ✓ | - |
| runpod_training_status | string | text | ✓ | - |
| runpod_training_timestamp | string | timestamp with time zone | ✓ | - |
| training_duration_hours | number | numeric | ✓ | - |
| estimated_cost_usd | number | numeric | ✓ | - |
| runpod_job_id | string | text | ✓ | - |
| production_deployment_status | string | text | ✓ | - |
| production_deployment_timestamp | string | timestamp with time zone | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |
| last_updated_by | string | text | ✓ | - |
| notes | string | text | ✓ | - |
| tags | array | text[] | ✓ | - |
| baseline_accuracy | number | numeric | ✓ | - |
| trained_accuracy | number | numeric | ✓ | - |
| improvement_percentage | number | numeric | ✓ | - |

---

## travel_airports

**Description:** List of airports for travel routing

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 8

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| name | string | character varying | ✗ | - |
| code | string | character varying | ✗ | - |
| hazards | array | text[] | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |
| organization_id | string | uuid | ✓ | - |
| user_id | string | uuid | ✓ | - |

---

## travel_equipment_filters

**Description:** Equipment filters for travel routes

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 7

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| name | string | character varying | ✗ | - |
| required_for | array | text[] | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |
| organization_id | string | uuid | ✓ | - |
| user_id | string | uuid | ✓ | - |

---

## travel_ground_routes

**Description:** List of ground routes for travel routing

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 8

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| name | string | character varying | ✗ | - |
| type | string | character varying | ✗ | - |
| hazards | array | text[] | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |
| organization_id | string | uuid | ✓ | - |
| user_id | string | uuid | ✓ | - |

---

## travel_hazard_alerts

**Description:** Hazard alerts for travel routes

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 8

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| type | string | character varying | ✗ | - |
| message | string | text | ✗ | - |
| routes | array | text[] | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |
| organization_id | string | uuid | ✓ | - |
| user_id | string | uuid | ✓ | - |

---

## travel_helipads

**Description:** List of helipads for travel routing

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 8

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| name | string | character varying | ✗ | - |
| coordinates | string | character varying | ✓ | - |
| equipment | array | text[] | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |
| organization_id | string | uuid | ✓ | - |
| user_id | string | uuid | ✓ | - |

---

## travel_requests

**Description:** Travel requests submitted by users

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 34

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| user_id | string | uuid | ✓ | User who submitted the request |
| purpose | string | character varying | ✗ | Purpose of the travel |
| destination | string | character varying | ✗ | Travel destination |
| start_date | string | date | ✗ | Start date of travel |
| end_date | string | date | ✗ | End date of travel |
| travelers | array | text[] | ✓ | List of travelers |
| transport_mode | string | character varying | ✗ | Type of transport (domestic, international, project-specific) |
| domestic_transport | string | character varying | ✓ | Specific domestic transport type |
| international_transport | string | character varying | ✓ | Specific international transport type |
| project_transport | string | character varying | ✓ | Specific project transport type |
| accommodation | string | character varying | ✓ | Accommodation details |
| special_requirements | string | text | ✓ | Special requirements for the trip |
| citizenship | string | character varying | ✓ | Citizenship of the traveler |
| security_clearance | string | character varying | ✓ | Security clearance level |
| frequent_traveler | boolean | boolean | ✓ | Whether the user is a frequent traveler |
| frequent_flyer_numbers | array | text[] | ✓ | Frequent flyer numbers |
| project_site | string | character varying | ✓ | Project site location |
| visa_required | boolean | boolean | ✓ | Whether a visa is required |
| visa_check_completed | boolean | boolean | ✓ | Whether visa check is completed |
| departure_location | string | character varying | ✓ | Departure location |
| arrival_location | string | character varying | ✓ | Arrival location |
| route_preferences | array | text[] | ✓ | Preferred routes and equipment |
| status | string | character varying | ✓ | Request status (pending, approved, rejected) |
| submitted_at | string | timestamp with time zone | ✓ | When the request was submitted |
| approved_at | string | timestamp with time zone | ✓ | When the request was approved |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |
| flight_segments | unknown | jsonb | ✓ | - |
| has_return_leg | boolean | boolean | ✓ | - |
| return_segments | unknown | jsonb | ✓ | - |
| health_check_required | boolean | boolean | ✓ | - |
| health_check_passed | boolean | boolean | ✓ | - |
| organization_id | string | uuid | ✓ | - |

---

## travel_templates

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 30

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| user_id | string | uuid | ✓ | - |
| name | string | character varying | ✗ | - |
| purpose | string | character varying | ✓ | - |
| destination | string | character varying | ✓ | - |
| travelers | array | text[] | ✓ | - |
| transport_mode | string | character varying | ✓ | - |
| domestic_transport | string | character varying | ✓ | - |
| international_transport | string | character varying | ✓ | - |
| project_transport | string | character varying | ✓ | - |
| accommodation | string | character varying | ✓ | - |
| special_requirements | string | text | ✓ | - |
| citizenship | string | character varying | ✓ | - |
| security_clearance | string | character varying | ✓ | - |
| frequent_traveler | boolean | boolean | ✓ | - |
| frequent_flyer_numbers | array | text[] | ✓ | - |
| project_site | string | character varying | ✓ | - |
| visa_required | boolean | boolean | ✓ | - |
| visa_check_completed | boolean | boolean | ✓ | - |
| departure_location | string | character varying | ✓ | - |
| arrival_location | string | character varying | ✓ | - |
| route_preferences | array | text[] | ✓ | - |
| flight_segments | unknown | jsonb | ✓ | - |
| has_return_leg | boolean | boolean | ✓ | - |
| return_segments | unknown | jsonb | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |
| health_check_required | boolean | boolean | ✓ | - |
| health_check_passed | boolean | boolean | ✓ | - |
| organization_id | string | uuid | ✓ | - |

---

## ui_button_settings

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 9

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | integer | integer | ✗ | Note:
This is a Primary Key.<pk/> |
| company_id | integer | integer | ✗ | - |
| button_option_id | integer | integer | ✓ | Note:
This is a Foreign Key to `button_options.id`.<fk table='button_options' column='id'/> |
| is_visible | boolean | boolean | ✓ | - |
| user_type | string | character varying | ✗ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |
| organization_id | string | uuid | ✓ | - |
| user_id | string | uuid | ✓ | - |

---

## ui_display_settings

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 7

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | integer | integer | ✗ | Note:
This is a Primary Key.<pk/> |
| company_id | integer | integer | ✗ | - |
| accordion_option_id | integer | integer | ✓ | - |
| is_visible | boolean | boolean | ✓ | - |
| user_type | string | character varying | ✗ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |

---

## user_accordion_settings

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 8

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | integer | integer | ✗ | Note:
This is a Primary Key.<pk/> |
| user_id | string | uuid | ✗ | - |
| user_type | string | character varying | ✗ | - |
| accordion_id | integer | integer | ✓ | - |
| is_visible | boolean | boolean | ✓ | - |
| contractor_name | string | character varying | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |

---

## user_companies

**Description:** Maps users to their assigned companies

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 4

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| user_id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| company_id | integer | bigint | ✗ | Note:
This is a Primary Key.<pk/> |
| created_at | string | timestamp with time zone | ✓ | - |
| organization_id | string | uuid | ✓ | - |

---

## user_company_access

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 7

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| user_id | string | uuid | ✗ | - |
| company_id | string | text | ✗ | - |
| role | string | text | ✗ | - |
| is_active | boolean | boolean | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |

---

## user_department_access

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 6

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| user_id | string | text | ✗ | - |
| department_code | string | text | ✗ | - |
| role_level | string | text | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| organization_id | string | uuid | ✓ | - |

---

## user_discipline_access

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 10

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| user_id | string | uuid | ✗ | Note:
This is a Foreign Key to `user_management.user_id`.<fk table='user_management' column='user_id'/> |
| organization_id | string | uuid | ✓ | Note:
This is a Foreign Key to `organizations.id`.<fk table='organizations' column='id'/> |
| discipline_code | string | character varying | ✗ | - |
| access_level | string | character varying | ✓ | - |
| is_active | boolean | boolean | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| created_by | string | uuid | ✓ | Note:
This is a Foreign Key to `user_management.user_id`.<fk table='user_management' column='user_id'/> |
| updated_at | string | timestamp with time zone | ✓ | - |
| updated_by | string | uuid | ✓ | Note:
This is a Foreign Key to `user_management.user_id`.<fk table='user_management' column='user_id'/> |

---

## user_email_accounts

**Description:** User email account configurations and credentials

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 24

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| user_id | string | uuid | ✗ | Note:
This is a Foreign Key to `user_management.user_id`.<fk table='user_management' column='user_id'/> |
| provider_id | string | uuid | ✗ | Note:
This is a Foreign Key to `email_providers.id`.<fk table='email_providers' column='id'/> |
| email_address | string | character varying | ✗ | - |
| display_name | string | character varying | ✓ | - |
| is_primary | boolean | boolean | ✓ | - |
| is_active | boolean | boolean | ✓ | - |
| access_token | string | text | ✓ | - |
| refresh_token | string | text | ✓ | - |
| token_expires_at | string | timestamp with time zone | ✓ | - |
| imap_host | string | character varying | ✓ | - |
| imap_port | integer | integer | ✓ | - |
| imap_username | string | character varying | ✓ | - |
| imap_password_encrypted | string | text | ✓ | - |
| smtp_host | string | character varying | ✓ | - |
| smtp_port | integer | integer | ✓ | - |
| smtp_username | string | character varying | ✓ | - |
| smtp_password_encrypted | string | text | ✓ | - |
| last_sync_at | string | timestamp with time zone | ✓ | - |
| sync_enabled | boolean | boolean | ✓ | - |
| sync_frequency_minutes | integer | integer | ✓ | - |
| settings | unknown | jsonb | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |

---

## user_email_aliases

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 6

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| user_id | string | uuid | ✗ | Note:
This is a Foreign Key to `user_management.user_id`.<fk table='user_management' column='user_id'/> |
| email | string | public.citext | ✗ | - |
| normalized_email | string | public.citext | ✗ | - |
| created_at | string | timestamp with time zone | ✗ | - |
| organization_id | string | uuid | ✓ | - |

---

## user_emails

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 16

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | integer | bigint | ✗ | Note:
This is a Primary Key.<pk/> |
| created_at | string | timestamp with time zone | ✗ | - |
| thread_id | string | text | ✓ | Unique identifier for email thread |
| cc_recipients | array | text[] | ✓ | Array of CC email addresses |
| bcc_recipients | array | text[] | ✓ | Array of BCC email addresses |
| body_html | string | text | ✓ | HTML formatted email body content |
| status | string | text | ✓ | Current status of the email |
| is_starred | boolean | boolean | ✓ | Flag for starred/important emails |
| is_important | boolean | boolean | ✓ | Flag for priority emails |
| folder | string | text | ✓ | Current folder location of email |
| attachments | unknown | jsonb | ✓ | JSON array of attachment metadata |
| raw_headers | string | text | ✓ | Complete email headers in raw format |
| in_reply_to | string | text | ✓ | Message-ID this email is replying to |
| message_references | array | text[] | ✓ | Array of Message-IDs in thread |
| user_id | string | uuid | ✓ | - |
| organization_id | string | uuid | ✓ | - |

---

## user_langchain_settings

**Description:** Secure storage for user-specific LangChain AI configurations with encrypted API keys

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 19

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| user_id | string | uuid | ✓ | - |
| organization_id | string | text | ✓ | - |
| openai_api_key | string | text | ✓ | Encrypted OpenAI API key |
| anthropic_api_key | string | text | ✓ | Encrypted Anthropic API key |
| cohere_api_key | string | text | ✓ | - |
| llm_provider | string | text | ✓ | Primary LLM provider (openai, anthropic, etc.) |
| llm_model | string | text | ✓ | - |
| embeddings_provider | string | text | ✓ | - |
| embeddings_model | string | text | ✓ | - |
| temperature | number | numeric | ✓ | AI creativity/randomness setting (0.0-2.0) |
| max_tokens | integer | integer | ✓ | - |
| dimensions | integer | integer | ✓ | - |
| chunk_size | integer | integer | ✓ | - |
| chunk_overlap | integer | integer | ✓ | - |
| langsmith_enabled | boolean | boolean | ✓ | - |
| langsmith_project | string | text | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |

---

## user_management

**Description:** Comprehensive user management table with profile, contact, auth, and business fields

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 80

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| user_id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| email | string | text | ✗ | - |
| role | string | text | ✓ | - |
| active | boolean | boolean | ✓ | - |
| status | string | character varying | ✓ | - |
| created_at | string | timestamp without time zone | ✓ | - |
| updated_at | string | timestamp without time zone | ✓ | - |
| created_by | string | uuid | ✓ | - |
| updated_by | string | uuid | ✓ | - |
| employer | string | text | ✓ | - |
| first_name | string | character varying | ✓ | - |
| last_name | string | character varying | ✓ | - |
| display_name | string | character varying | ✓ | User preferred display name, overrides full_name |
| full_name | string | character varying | ✓ | Auto-generated from first_name + last_name via trigger |
| preferred_name | string | character varying | ✓ | - |
| phone | string | character varying | ✓ | - |
| mobile | string | character varying | ✓ | - |
| address | string | text | ✓ | - |
| city | string | character varying | ✓ | - |
| state_province | string | character varying | ✓ | - |
| postal_code | string | character varying | ✓ | - |
| country | string | character varying | ✓ | - |
| job_title | string | character varying | ✓ | - |
| department | string | character varying | ✓ | - |
| division | string | character varying | ✓ | - |
| cost_center | string | character varying | ✓ | - |
| manager_id | string | uuid | ✓ | Note:
This is a Foreign Key to `user_management.user_id`.<fk table='user_management' column='user_id'/> |
| employee_id | string | character varying | ✓ | - |
| hire_date | string | date | ✓ | - |
| employment_type | string | character varying | ✓ | employee, contractor, consultant, intern, etc. |
| security_clearance | string | character varying | ✓ | - |
| password_hash | string | character varying | ✓ | - |
| password_salt | string | character varying | ✓ | - |
| last_login | string | timestamp with time zone | ✓ | - |
| login_count | integer | integer | ✓ | - |
| failed_login_attempts | integer | integer | ✓ | - |
| account_locked_until | string | timestamp with time zone | ✓ | - |
| password_reset_token | string | character varying | ✓ | - |
| password_reset_expires | string | timestamp with time zone | ✓ | - |
| email_verified | boolean | boolean | ✓ | - |
| email_verification_token | string | character varying | ✓ | - |
| two_factor_enabled | boolean | boolean | ✓ | - |
| two_factor_secret | string | character varying | ✓ | - |
| avatar_url | string | text | ✓ | - |
| bio | string | text | ✓ | - |
| timezone | string | character varying | ✓ | - |
| locale | string | character varying | ✓ | - |
| theme_preference | string | character varying | ✓ | - |
| notification_preferences | unknown | jsonb | ✓ | JSON object for email/push notification settings |
| user_preferences | unknown | jsonb | ✓ | JSON object for user UI/UX preferences |
| last_activity | string | timestamp with time zone | ✓ | - |
| session_token | string | character varying | ✓ | - |
| session_expires | string | timestamp with time zone | ✓ | - |
| terms_accepted_at | string | timestamp with time zone | ✓ | - |
| privacy_policy_accepted_at | string | timestamp with time zone | ✓ | - |
| data_retention_policy | string | character varying | ✓ | - |
| account_deletion_requested_at | string | timestamp with time zone | ✓ | - |
| contractor_company | string | character varying | ✓ | - |
| consultant_rate | number | numeric | ✓ | - |
| billing_currency | string | character varying | ✓ | - |
| project_access_level | string | character varying | ✓ | standard, elevated, restricted, admin |
| disciplines | unknown | jsonb | ✓ | JSON array of engineering disciplines user works in |
| certifications | unknown | jsonb | ✓ | - |
| emergency_contact | unknown | jsonb | ✓ | - |
| passport_number | string | character varying | ✓ | Primary passport number for international travel |
| passport_expiry_date | string | date | ✓ | Passport expiry date - must be validated before booking flights |
| passport_issue_date | string | date | ✓ | - |
| passport_issuing_country | string | character varying | ✓ | - |
| alternative_travel_docs | unknown | jsonb | ✓ | JSON array of alternative travel documents (visa, green card, resident permit, etc.) |
| date_of_birth | string | date | ✓ | - |
| gender | string | character varying | ✓ | - |
| nationality | string | character varying | ✓ | - |
| residence_country | string | character varying | ✓ | - |
| title | string | character varying | ✓ | - |
| visa_requirements | unknown | jsonb | ✓ | JSON array of visa requirements for different destinations |
| frequent_flyer_programs | unknown | jsonb | ✓ | JSON array of frequent flyer program memberships and account numbers |
| medical_info | unknown | jsonb | ✓ | - |
| dietary_restrictions | array | text[] | ✓ | - |
| special_assistance | string | text | ✓ | - |
| organization_id | string | uuid | ✓ | - |

---

## user_organization_access

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 5

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| user_id | string | text | ✗ | - |
| organization_id | string | text | ✗ | - |
| is_primary | boolean | boolean | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |

---

## user_organizations

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 7

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| user_id | string | uuid | ✗ | - |
| organization_id | string | uuid | ✗ | Note:
This is a Foreign Key to `organizations.id`.<fk table='organizations' column='id'/> |
| role | string | character varying | ✓ | - |
| is_active | boolean | boolean | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |

---

## user_profiles

**Description:** User profile data for SOW Association Modal and user management

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 19

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| user_id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| name | string | character varying | ✓ | - |
| role | string | text | ✓ | User role (Technical Director, Project Manager, etc.) |
| project_site | string | text | ✓ | - |
| citizenship | string | character varying | ✓ | - |
| security_clearance | string | character varying | ✓ | - |
| frequent_traveler | boolean | boolean | ✓ | - |
| frequent_flyer_numbers | array | text[] | ✓ | - |
| created_at | string | timestamp without time zone | ✓ | - |
| updated_at | string | timestamp without time zone | ✓ | - |
| organization_id | string | uuid | ✓ | - |
| email | string | text | ✓ | - |
| first_name | string | text | ✓ | - |
| last_name | string | text | ✓ | - |
| avatar_url | string | text | ✓ | - |
| id | string | uuid | ✓ | Unique user identifier |
| company_id | string | uuid | ✓ | Company/organization identifier |
| settings | unknown | jsonb | ✓ | User settings and profile data as JSONB |
| last_login | string | timestamp with time zone | ✓ | Timestamp of last login |

---

## user_project_access

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 7

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| user_id | string | uuid | ✗ | - |
| project_id | string | text | ✗ | - |
| role | string | text | ✗ | - |
| is_active | boolean | boolean | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |

---

## user_project_assignments

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 11

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| user_id | string | uuid | ✗ | - |
| project_id | string | uuid | ✗ | Note:
This is a Foreign Key to `projects.id`.<fk table='projects' column='id'/> |
| assigned_role | string | text | ✗ | - |
| phases_access | unknown | jsonb | ✓ | - |
| assigned_by | string | uuid | ✓ | - |
| assigned_at | string | timestamp without time zone | ✓ | - |
| expires_at | string | timestamp without time zone | ✓ | - |
| is_active | boolean | boolean | ✓ | - |
| created_at | string | timestamp without time zone | ✓ | - |
| updated_at | string | timestamp without time zone | ✓ | - |

---

## user_role_assignments

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 10

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | integer | integer | ✗ | Note:
This is a Primary Key.<pk/> |
| user_id | string | uuid | ✗ | - |
| role_name | string | character varying | ✗ | Note:
This is a Foreign Key to `role_definitions.role_name`.<fk table='role_definitions' column='role_name'/> |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |
| company_id | string | uuid | ✓ | - |
| assigned_at | string | timestamp without time zone | ✓ | - |
| assigned_by | string | uuid | ✓ | - |
| is_active | boolean | boolean | ✓ | - |
| organization_id | string | uuid | ✓ | - |

---

## user_roles

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 7

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| user_id | string | text | ✗ | - |
| role | string | text | ✗ | - |
| department_code | string | text | ✓ | - |
| level | integer | integer | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| organization_id | string | uuid | ✓ | - |

---

## user_vetting_permissions

**Description:** Cached user permissions to improve performance and reduce database load. Auto-expires after 1 hour.

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 7

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| user_id | string | uuid | ✗ | - |
| permissions | unknown | jsonb | ✗ | - |
| last_updated | string | timestamp with time zone | ✓ | - |
| expires_at | string | timestamp with time zone | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |

---

## v_chat_issues

**Description:** Identifies chat sessions with performance or satisfaction issues

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 11

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| session_id | string | uuid | ✓ | Note:
This is a Primary Key.<pk/> |
| discipline_code | string | character varying | ✓ | - |
| chatbot_type | string | character varying | ✓ | - |
| company_name | string | character varying | ✓ | - |
| project_name | string | character varying | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| performance_issue | string | text | ✓ | - |
| avg_response_time_ms | integer | integer | ✓ | - |
| total_messages | integer | integer | ✓ | - |
| avg_rating | number | numeric | ✓ | - |
| error_message_count | integer | bigint | ✓ | - |

---

## v_chat_session_summary

**Description:** Summary of chat sessions with project context for IT dashboard

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 18

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✓ | Note:
This is a Primary Key.<pk/> |
| user_id | string | uuid | ✓ | - |
| discipline_code | string | character varying | ✓ | - |
| chatbot_type | string | character varying | ✓ | - |
| company_name | string | character varying | ✓ | - |
| organisation_name | string | character varying | ✓ | - |
| project_name | string | character varying | ✓ | - |
| project_phase_name | string | character varying | ✓ | - |
| session_title | string | character varying | ✓ | - |
| total_messages | integer | integer | ✓ | - |
| total_documents_referenced | integer | integer | ✓ | - |
| avg_response_time_ms | integer | integer | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| last_activity_at | string | timestamp with time zone | ✓ | - |
| is_active | boolean | boolean | ✓ | - |
| session_duration_minutes | number | numeric | ✓ | - |
| latest_message | string | text | ✓ | - |
| avg_user_rating | number | numeric | ✓ | - |

---

## v_company_project_chat_usage

**Description:** Chat usage analytics grouped by company and project

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 14

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| company_name | string | character varying | ✓ | - |
| organisation_name | string | character varying | ✓ | - |
| project_name | string | character varying | ✓ | - |
| project_phase_name | string | character varying | ✓ | - |
| discipline_code | string | character varying | ✓ | - |
| chatbot_type | string | character varying | ✓ | - |
| total_sessions | integer | bigint | ✓ | - |
| total_messages | integer | bigint | ✓ | - |
| total_documents_referenced | integer | bigint | ✓ | - |
| avg_response_time_ms | number | numeric | ✓ | - |
| unique_users | integer | bigint | ✓ | - |
| last_activity | string | timestamp with time zone | ✓ | - |
| sessions_last_7_days | integer | bigint | ✓ | - |
| sessions_previous_7_days | integer | bigint | ✓ | - |

---

## v_daily_chat_stats

**Description:** Daily aggregated chat statistics by discipline and project

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 11

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| date | string | date | ✓ | - |
| discipline_code | string | character varying | ✓ | - |
| chatbot_type | string | character varying | ✓ | - |
| company_name | string | character varying | ✓ | - |
| organisation_name | string | character varying | ✓ | - |
| project_name | string | character varying | ✓ | - |
| sessions_count | integer | bigint | ✓ | - |
| total_messages | integer | bigint | ✓ | - |
| total_documents_referenced | integer | bigint | ✓ | - |
| avg_response_time_ms | number | numeric | ✓ | - |
| unique_users | integer | bigint | ✓ | - |

---

## v_discipline_performance

**Description:** Performance metrics for each discipline chatbot type

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 15

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| discipline_code | string | character varying | ✓ | - |
| chatbot_type | string | character varying | ✓ | - |
| total_sessions | integer | bigint | ✓ | - |
| total_messages | integer | bigint | ✓ | - |
| avg_messages_per_session | number | numeric | ✓ | - |
| total_documents_referenced | integer | bigint | ✓ | - |
| avg_documents_per_session | number | numeric | ✓ | - |
| avg_response_time_ms | number | numeric | ✓ | - |
| unique_users | integer | bigint | ✓ | - |
| unique_companies | integer | bigint | ✓ | - |
| unique_projects | integer | bigint | ✓ | - |
| avg_user_satisfaction | number | numeric | ✓ | - |
| last_activity | string | timestamp with time zone | ✓ | - |
| active_today | integer | bigint | ✓ | - |
| active_this_week | integer | bigint | ✓ | - |

---

## v_document_types_lookup

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 8

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✓ | Note:
This is a Primary Key.<pk/> |
| document_type_code | string | character varying | ✓ | - |
| document_type | string | character varying | ✓ | - |
| numbering_pattern | string | text | ✓ | - |
| description | string | text | ✓ | - |
| discipline_code | string | character varying | ✓ | - |
| discipline_name | string | character varying | ✓ | - |
| company_id | string | uuid | ✓ | Note:
This is a Foreign Key to `companies.id`.<fk table='companies' column='id'/> |

---

## v_document_usage_analytics

**Description:** Analytics on which documents are most referenced in chats

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 9

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| discipline_code | string | character varying | ✓ | - |
| company_name | string | character varying | ✓ | - |
| project_name | string | character varying | ✓ | - |
| document_reference | string | text | ✓ | - |
| reference_count | integer | bigint | ✓ | - |
| sessions_referencing | integer | bigint | ✓ | - |
| users_referencing | integer | bigint | ✓ | - |
| avg_rating_when_referenced | number | numeric | ✓ | - |
| last_referenced | string | timestamp with time zone | ✓ | - |

---

## v_financial_overdue

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 9

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✓ | Note:
This is a Primary Key.<pk/> |
| reference | string | character varying | ✓ | - |
| description | string | text | ✓ | - |
| amount | number | numeric | ✓ | - |
| due_date | string | date | ✓ | - |
| vendor | string | character varying | ✓ | - |
| project | string | character varying | ✓ | - |
| category | string | character varying | ✓ | - |
| days_overdue | integer | integer | ✓ | - |

---

## v_financial_summary

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 10

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| type | string | character varying | ✓ | - |
| status | string | character varying | ✓ | - |
| record_count | integer | bigint | ✓ | - |
| total_amount | number | numeric | ✓ | - |
| avg_amount | number | numeric | ✓ | - |
| min_amount | number | numeric | ✓ | - |
| max_amount | number | numeric | ✓ | - |
| categories | string | text | ✓ | - |
| earliest_date | string | date | ✓ | - |
| latest_date | string | date | ✓ | - |

---

## v_realtime_chat_activity

**Description:** Real-time view of active chat sessions

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 14

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| session_id | string | uuid | ✓ | Note:
This is a Primary Key.<pk/> |
| user_id | string | uuid | ✓ | - |
| discipline_code | string | character varying | ✓ | - |
| chatbot_type | string | character varying | ✓ | - |
| company_name | string | character varying | ✓ | - |
| project_name | string | character varying | ✓ | - |
| session_title | string | character varying | ✓ | - |
| last_activity_at | string | timestamp with time zone | ✓ | - |
| minutes_since_last_activity | number | numeric | ✓ | - |
| activity_status | string | text | ✓ | - |
| latest_message_role | string | character varying | ✓ | - |
| latest_message_preview | string | text | ✓ | - |
| total_messages | integer | integer | ✓ | - |
| avg_response_time_ms | integer | integer | ✓ | - |

---

## vector_deletion_audit

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 9

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| vector_id | string | uuid | ✗ | - |
| table_name | string | text | ✗ | - |
| deleted_by | string | uuid | ✓ | - |
| deletion_reason | string | text | ✓ | - |
| deletion_type | string | text | ✓ | - |
| restored_at | string | timestamp with time zone | ✓ | - |
| restored_by | string | uuid | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |

---

## vector_deletion_policies

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 8

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| policy_name | string | text | ✗ | - |
| applies_to_scope | string | text | ✓ | - |
| retention_period | string | interval | ✓ | - |
| auto_delete | boolean | boolean | ✓ | - |
| requires_approval | boolean | boolean | ✓ | - |
| created_by | string | uuid | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |

---

## vector_search_criteria

**Description:** Stores dynamic search criteria for vector similarity searches across all disciplines

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 9

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| discipline | string | text | ✗ | Discipline identifier (e.g., contracts_post_award, civil_engineering) |
| table_name | string | text | ✗ | Name of the vector table to search (e.g., a_00435_contracts_post_vector) |
| search_name | string | text | ✗ | Unique identifier for this search configuration within the discipline |
| description | string | text | ✓ | - |
| filter_criteria | unknown | jsonb | ✗ | JSONB object containing the filter criteria for the search |
| is_active | boolean | boolean | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |

---

## vector_system_health

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 2

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| component | string | text | ✓ | - |
| total_tables | integer | bigint | ✓ | - |

---

## vector_workspaces

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 12

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| name | string | text | ✗ | - |
| description | string | text | ✓ | - |
| workspace_type | string | text | ✓ | - |
| created_by | string | uuid | ✓ | - |
| organisation_id | string | uuid | ✓ | - |
| project_id | string | uuid | ✓ | - |
| discipline_restrictions | array | text[] | ✓ | - |
| auto_cleanup_after | string | interval | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| expires_at | string | timestamp with time zone | ✓ | - |
| is_active | boolean | boolean | ✓ | - |

---

## vessels

**Description:** Stores vessel/ship information from VesselFinder API

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 33

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| imo | string | character varying | ✓ | - |
| mmsi | string | character varying | ✓ | - |
| vessel_name | string | character varying | ✗ | - |
| call_sign | string | character varying | ✓ | - |
| vessel_type | string | character varying | ✓ | - |
| vessel_class | string | character varying | ✓ | - |
| flag_country | string | character varying | ✓ | - |
| gross_tonnage | integer | integer | ✓ | - |
| deadweight_tonnage | integer | integer | ✓ | - |
| length_overall | number | numeric | ✓ | - |
| beam | number | numeric | ✓ | - |
| draught | number | numeric | ✓ | - |
| built_year | integer | integer | ✓ | - |
| latitude | number | numeric | ✓ | - |
| longitude | number | numeric | ✓ | - |
| speed_knots | number | numeric | ✓ | - |
| course | number | numeric | ✓ | - |
| heading | number | numeric | ✓ | - |
| status | string | character varying | ✓ | - |
| destination | string | character varying | ✓ | - |
| eta | string | timestamp with time zone | ✓ | - |
| vesselfinder_id | string | character varying | ✓ | - |
| last_position_update | string | timestamp with time zone | ✓ | - |
| api_data | unknown | jsonb | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |
| created_by | string | uuid | ✓ | - |
| is_active | boolean | boolean | ✓ | - |
| company_id | string | uuid | ✓ | - |
| organisation_id | string | uuid | ✓ | - |
| project_id | string | uuid | ✓ | - |
| organization_id | string | uuid | ✓ | - |

---

## vetting_access_log

**Description:** Audit log for all user access attempts to contractor vetting functionality. Used for security compliance and monitoring.

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 15

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| user_id | string | uuid | ✗ | - |
| contractor_id | string | uuid | ✓ | - |
| action | string | character varying | ✗ | - |
| resource | string | character varying | ✗ | - |
| access_granted | boolean | boolean | ✓ | - |
| reason_denied | string | text | ✓ | - |
| discipline | string | character varying | ✓ | - |
| company_count | integer | integer | ✓ | - |
| project_count | integer | integer | ✓ | - |
| ip_address | string | inet | ✓ | - |
| user_agent | string | text | ✓ | - |
| session_id | string | text | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| expires_at | string | timestamp with time zone | ✓ | - |

---

## vetting_access_summary

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 6

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| access_date | string | timestamp with time zone | ✓ | - |
| discipline | string | character varying | ✓ | - |
| action | string | character varying | ✓ | - |
| access_granted | boolean | boolean | ✓ | - |
| access_count | integer | bigint | ✓ | - |
| unique_users | integer | bigint | ✓ | - |

---

## vetting_evaluation_audit

**Description:** Detailed audit trail for vetting evaluation actions, linking evaluations with user permissions at time of action.

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 11

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| evaluation_id | string | uuid | ✗ | - |
| user_id | string | uuid | ✗ | - |
| action | string | character varying | ✗ | - |
| section | string | character varying | ✓ | - |
| changes | unknown | jsonb | ✓ | - |
| user_discipline | string | character varying | ✓ | - |
| user_company_affiliations | integer | integer | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| ip_address | string | inet | ✓ | - |
| session_id | string | text | ✓ | - |

---

## workflow_routing_steps

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 16

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | integer | bigint | ✗ | Note:
This is a Primary Key.<pk/> |
| workflow_id | integer | bigint | ✓ | Note:
This is a Foreign Key to `document_routing_workflows.id`.<fk table='document_routing_workflows' column='id'/> |
| step_id | integer | bigint | ✓ | Note:
This is a Foreign Key to `routing_template_steps.id`.<fk table='routing_template_steps' column='id'/> |
| step_order | integer | integer | ✗ | - |
| step_name | string | character varying | ✗ | - |
| step_status | string | character varying | ✓ | - |
| routing_mode | string | character varying | ✓ | - |
| required_actions | integer | integer | ✓ | - |
| completed_actions | integer | integer | ✓ | - |
| deadline | string | timestamp with time zone | ✓ | - |
| started_at | string | timestamp with time zone | ✓ | - |
| completed_at | string | timestamp with time zone | ✓ | - |
| esculated_at | string | timestamp with time zone | ✓ | - |
| escalated_to | string | character varying | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |

---

## workspace_members

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 6

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| workspace_id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/>
This is a Foreign Key to `vector_workspaces.id`.<fk table='vector_workspaces' column='id'/> |
| user_id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| access_level | string | text | ✓ | - |
| added_by | string | uuid | ✓ | - |
| added_at | string | timestamp with time zone | ✓ | - |
| expires_at | string | timestamp with time zone | ✓ | - |

---

