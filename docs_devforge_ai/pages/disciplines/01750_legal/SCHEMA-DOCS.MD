# Database Schema Documentation

Generated: 2026-01-27T11:08:47.764Z

Total Tables: 461

## Table of Contents

1. [a_00850_civileng_vector](#a_00850_civileng_vector)
2. [approval_workflows](#approval_workflows)
3. [user_langchain_settings](#user_langchain_settings)
4. [dashboard_progress](#dashboard_progress)
5. [inspections](#inspections)
6. [shipment_containers](#shipment_containers)
7. [api_health_checks](#api_health_checks)
8. [chatbots_backup](#chatbots_backup)
9. [sectors](#sectors)
10. [logistics_document_versions](#logistics_document_versions)
11. [available_companies](#available_companies)
12. [safety_template_categories](#safety_template_categories)
13. [integration_sources](#integration_sources)
14. [discipline_document_paths](#discipline_document_paths)
15. [approval_document_links](#approval_document_links)
16. [signature_documents](#signature_documents)
17. [logistics_shipments](#logistics_shipments)
18. [travel_equipment_filters](#travel_equipment_filters)
19. [vector_workspaces](#vector_workspaces)
20. [civil_engineering_document_links](#civil_engineering_document_links)
21. [pages_directors_backup_20250726](#pages_directors_backup_20250726)
22. [template_versions](#template_versions)
23. [a_00875_sales_vector](#a_00875_sales_vector)
24. [contractor_vetting_chat_messages](#contractor_vetting_chat_messages)
25. [job_descriptions](#job_descriptions)
26. [cv_analyses](#cv_analyses)
27. [a_00825_architectural_vector](#a_00825_architectural_vector)
28. [a_01800_operations_vector](#a_01800_operations_vector)
29. [maintenance_assets](#maintenance_assets)
30. [template_approval_rules](#template_approval_rules)
31. [a_01400_health_vector](#a_01400_health_vector)
32. [user_department_access](#user_department_access)
33. [contracts_post_summary](#contracts_post_summary)
34. [timesheet_submissions](#timesheet_submissions)
35. [flowise_documents_with_stores](#flowise_documents_with_stores)
36. [performance_metrics](#performance_metrics)
37. [llm_document_type_mappings](#llm_document_type_mappings)
38. [prompts_enhanced](#prompts_enhanced)
39. [agent_profiles](#agent_profiles)
40. [a_00882_dirconst_vector](#a_00882_dirconst_vector)
41. [containers](#containers)
42. [discipline_evaluation_weights](#discipline_evaluation_weights)
43. [a_00900_doccontrol_document_embeddings](#a_00900_doccontrol_document_embeddings)
44. [section_organization_mapping](#section_organization_mapping)
45. [email_access_logs](#email_access_logs)
46. [logistics_context_data](#logistics_context_data)
47. [push_notifications](#push_notifications)
48. [chatbot_vector_configs](#chatbot_vector_configs)
49. [task_comments](#task_comments)
50. [chatbot_pages](#chatbot_pages)
51. [numbering_patterns](#numbering_patterns)
52. [document_processing_history](#document_processing_history)
53. [organization_collaborations](#organization_collaborations)
54. [agent_modal_assignments](#agent_modal_assignments)
55. [section_pages](#section_pages)
56. [vector_deletion_policies](#vector_deletion_policies)
57. [document_categories](#document_categories)
58. [tender_approvals](#tender_approvals)
59. [contacts](#contacts)
60. [organization_db_configs](#organization_db_configs)
61. [email_sync_log](#email_sync_log)
62. [tender_suppliers](#tender_suppliers)
63. [training_pipeline_status](#training_pipeline_status)
64. [recent_audit_activity](#recent_audit_activity)
65. [template_customization_rules](#template_customization_rules)
66. [page_permissions](#page_permissions)
67. [a_00885_dirhse_vector](#a_00885_dirhse_vector)
68. [task_attachments](#task_attachments)
69. [a_02400_contractor_vetting_document_versions](#a_02400_contractor_vetting_document_versions)
70. [continual_learning_data](#continual_learning_data)
71. [record _manager](#record _manager)
72. [workspace_members](#workspace_members)
73. [project_templates](#project_templates)
74. [a_00106_timesheet_vector](#a_00106_timesheet_vector)
75. [document_analysis_feedback](#document_analysis_feedback)
76. [task_messages](#task_messages)
77. [safety_template_dependencies](#safety_template_dependencies)
78. [fuel_lubricants](#fuel_lubricants)
79. [technical_document_categories](#technical_document_categories)
80. [document_routing_history](#document_routing_history)
81. [document_embeddings](#document_embeddings)
82. [user_discipline_access](#user_discipline_access)
83. [logistics_alerts](#logistics_alerts)
84. [a_00880_boarddir_vector](#a_00880_boarddir_vector)
85. [a_00884_1_dirfinance_vector](#a_00884_1_dirfinance_vector)
86. [a_00877_sundry_vector](#a_00877_sundry_vector)
87. [timesheets](#timesheets)
88. [customized](#customized)
89. [button_options](#button_options)
90. [flowise_record_manager](#flowise_record_manager)
91. [resource_documentation](#resource_documentation)
92. [document_stores](#document_stores)
93. [ai_training_data](#ai_training_data)
94. [user_organization_access](#user_organization_access)
95. [chat_messages](#chat_messages)
96. [progress_logs](#progress_logs)
97. [logistics_approval_workflows](#logistics_approval_workflows)
98. [contractor_vetting_dashboard_stats](#contractor_vetting_dashboard_stats)
99. [approval_workflow_templates](#approval_workflow_templates)
100. [email_vector](#email_vector)
101. [project_template_preparation](#project_template_preparation)
102. [cv_applications](#cv_applications)
103. [credential_rotation_logs](#credential_rotation_logs)
104. [a_00860_eleceng_vector](#a_00860_eleceng_vector)
105. [v_financial_summary](#v_financial_summary)
106. [a_00435_contracts_post_vector](#a_00435_contracts_post_vector)
107. [training_pipeline_dashboard](#training_pipeline_dashboard)
108. [operations_equipment](#operations_equipment)
109. [document_hashes](#document_hashes)
110. [inspection_media](#inspection_media)
111. [template_variation_sequences](#template_variation_sequences)
112. [inspection_items](#inspection_items)
113. [external_api_configurations](#external_api_configurations)
114. [a_02025_invoice_processing](#a_02025_invoice_processing)
115. [user_companies](#user_companies)
116. [travel_ground_routes](#travel_ground_routes)
117. [ports](#ports)
118. [supplier_verifications](#supplier_verifications)
119. [approval_history_log](#approval_history_log)
120. [field_attribute_compliance](#field_attribute_compliance)
121. [approval_steps](#approval_steps)
122. [travel_templates](#travel_templates)
123. [document_numbering_sequences](#document_numbering_sequences)
124. [schema_migrations](#schema_migrations)
125. [compliance_checks](#compliance_checks)
126. [a_01300_governance_vector](#a_01300_governance_vector)
127. [travel_requests](#travel_requests)
128. [user_project_assignments](#user_project_assignments)
129. [personnel_records](#personnel_records)
130. [a_02100_publicrel_vector](#a_02100_publicrel_vector)
131. [a_00900_user_langchain_settings](#a_00900_user_langchain_settings)
132. [rate_limits](#rate_limits)
133. [v_document_types_lookup](#v_document_types_lookup)
134. [sql_file_tracking](#sql_file_tracking)
135. [tenders](#tenders)
136. [path_configurations](#path_configurations)
137. [active_security_alerts](#active_security_alerts)
138. [signature_requests](#signature_requests)
139. [tender_monitors](#tender_monitors)
140. [chatbot_permissions](#chatbot_permissions)
141. [document_processing_log](#document_processing_log)
142. [form_instances](#form_instances)
143. [chat_analytics](#chat_analytics)
144. [document_variations](#document_variations)
145. [v_company_project_chat_usage](#v_company_project_chat_usage)
146. [v_realtime_chat_activity](#v_realtime_chat_activity)
147. [procurement_contributions](#procurement_contributions)
148. [audit_log](#audit_log)
149. [tasks](#tasks)
150. [contributor_assignments](#contributor_assignments)
151. [a_00425_contracts_pre_vector](#a_00425_contracts_pre_vector)
152. [companies](#companies)
153. [a_03000_landscaping_vector](#a_03000_landscaping_vector)
154. [form_completions](#form_completions)
155. [active_templates](#active_templates)
156. [contracts](#contracts)
157. [discipline_template_config](#discipline_template_config)
158. [organization_users](#organization_users)
159. [a_01700_logistics_vector](#a_01700_logistics_vector)
160. [procurement_signatures](#procurement_signatures)
161. [template_usage_tracking](#template_usage_tracking)
162. [a_01900_procurement_vector](#a_01900_procurement_vector)
163. [vetting_access_log](#vetting_access_log)
164. [modal_configurations](#modal_configurations)
165. [defects](#defects)
166. [routing_step_actions](#routing_step_actions)
167. [approval_cover_sheets](#approval_cover_sheets)
168. [contractor_vetting](#contractor_vetting)
169. [consultants](#consultants)
170. [prompt_usage_summary](#prompt_usage_summary)
171. [v_daily_chat_stats](#v_daily_chat_stats)
172. [evaluation_packages](#evaluation_packages)
173. [a_02076_qa_vector](#a_02076_qa_vector)
174. [tracking_events](#tracking_events)
175. [a_00900_doccontrol_approvals](#a_00900_doccontrol_approvals)
176. [llm_functions](#llm_functions)
177. [document_processing_queue](#document_processing_queue)
178. [procurement_orders](#procurement_orders)
179. [prompts_with_rbac](#prompts_with_rbac)
180. [contractors_backup_before_uuid_migration](#contractors_backup_before_uuid_migration)
181. [a_00900_doccontrol_approval_rule_steps](#a_00900_doccontrol_approval_rule_steps)
182. [a_01500_hr_vector](#a_01500_hr_vector)
183. [a_00102_admin_data](#a_00102_admin_data)
184. [user_role_assignments](#user_role_assignments)
185. [hitl_performance_metrics](#hitl_performance_metrics)
186. [a_02035_scheduling_vector](#a_02035_scheduling_vector)
187. [travel_helipads](#travel_helipads)
188. [v_discipline_performance](#v_discipline_performance)
189. [agent_roles](#agent_roles)
190. [a_02050_it_vector](#a_02050_it_vector)
191. [dropdown_options](#dropdown_options)
192. [prompts](#prompts)
193. [template_usage_logs](#template_usage_logs)
194. [a_00884_direng_vector](#a_00884_direng_vector)
195. [vetting_access_summary](#vetting_access_summary)
196. [procurement_templates](#procurement_templates)
197. [a_00435_contracts_post_data](#a_00435_contracts_post_data)
198. [a_02025_qs_vector](#a_02025_qs_vector)
199. [discipline_document_sections](#discipline_document_sections)
200. [governance_approval_matrices](#governance_approval_matrices)
201. [section_hierarchy](#section_hierarchy)
202. [safety_templates_backup_20251121](#safety_templates_backup_20251121)
203. [petty_cash](#petty_cash)
204. [safety_incidents](#safety_incidents)
205. [travel_airports](#travel_airports)
206. [migration_rename_log](#migration_rename_log)
207. [a_02400_contractor_vetting_data](#a_02400_contractor_vetting_data)
208. [processing_statistics](#processing_statistics)
209. [a_00872_developer_vector](#a_00872_developer_vector)
210. [chatbot_performance_summary](#chatbot_performance_summary)
211. [templates](#templates)
212. [a_00895_dirproject_vector](#a_00895_dirproject_vector)
213. [performance_alerts](#performance_alerts)
214. [compliance_reports](#compliance_reports)
215. [agents_tracking](#agents_tracking)
216. [accordion_sections](#accordion_sections)
217. [project_permissions](#project_permissions)
218. [task_sequence_execution](#task_sequence_execution)
219. [quality_checks](#quality_checks)
220. [order_derived_template_usage](#order_derived_template_usage)
221. [email_drafts](#email_drafts)
222. [role_definitions](#role_definitions)
223. [civil_engineering_documents](#civil_engineering_documents)
224. [chatbot_audit_logs](#chatbot_audit_logs)
225. [governance_document_templates_backup_20251121](#governance_document_templates_backup_20251121)
226. [chatbots](#chatbots)
227. [maintenance_work_orders](#maintenance_work_orders)
228. [alert_configurations](#alert_configurations)
229. [user_vetting_permissions](#user_vetting_permissions)
230. [numbering_methodologies](#numbering_methodologies)
231. [cv_application_stats](#cv_application_stats)
232. [governance_approval_instances](#governance_approval_instances)
233. [a_02400_safety_vector](#a_02400_safety_vector)
234. [suppliers](#suppliers)
235. [template_relationships](#template_relationships)
236. [form_templates](#form_templates)
237. [a_01000_environmental_vector](#a_01000_environmental_vector)
238. [tender_evaluation](#tender_evaluation)
239. [user_management](#user_management)
240. [timesheet_descriptions](#timesheet_descriptions)
241. [migration_validation_results](#migration_validation_results)
242. [accordion_sections_directors_backup_20250726](#accordion_sections_directors_backup_20250726)
243. [discipline_extraction_prompts](#discipline_extraction_prompts)
244. [document_variation_sections](#document_variation_sections)
245. [pages_with_clear_columns](#pages_with_clear_columns)
246. [v_document_usage_analytics](#v_document_usage_analytics)
247. [ui_button_settings](#ui_button_settings)
248. [document_routing_workflows](#document_routing_workflows)
249. [document_number_sequences](#document_number_sequences)
250. [document_ai_analysis](#document_ai_analysis)
251. [v_chat_session_summary](#v_chat_session_summary)
252. [accordion_structure](#accordion_structure)
253. [document_sections](#document_sections)
254. [scope_of_work_relationships](#scope_of_work_relationships)
255. [integration_sync_history](#integration_sync_history)
256. [contractors](#contractors)
257. [v_chat_issues](#v_chat_issues)
258. [a_02200_qa_vector](#a_02200_qa_vector)
259. [email_notification_queue](#email_notification_queue)
260. [legal_reviews](#legal_reviews)
261. [imported_emails_with_placeholder_users](#imported_emails_with_placeholder_users)
262. [v_financial_overdue](#v_financial_overdue)
263. [sow_appendices](#sow_appendices)
264. [template_usage_stats](#template_usage_stats)
265. [a_02000_projctrl_vector](#a_02000_projctrl_vector)
266. [a_00900_doccontrol_vector](#a_00900_doccontrol_vector)
267. [external_party_document_instances](#external_party_document_instances)
268. [projects](#projects)
269. [document_hierarchy_definitions](#document_hierarchy_definitions)
270. [sow_templates](#sow_templates)
271. [api_usage_summary](#api_usage_summary)
272. [a_00900_doccontrol_approval_rules](#a_00900_doccontrol_approval_rules)
273. [email_signatures](#email_signatures)
274. [data_sheet_specifications](#data_sheet_specifications)
275. [a_01200_finance_vector](#a_01200_finance_vector)
276. [equipment_documentation](#equipment_documentation)
277. [a_00800_design_vector](#a_00800_design_vector)
278. [task_history](#task_history)
279. [vector_search_criteria](#vector_search_criteria)
280. [a_02400_contractor_vetting_documents](#a_02400_contractor_vetting_documents)
281. [a_00883_dircontracts_vector](#a_00883_dircontracts_vector)
282. [a_00888_dirprocurement_vector](#a_00888_dirprocurement_vector)
283. [user_accordion_settings](#user_accordion_settings)
284. [signature_templates](#signature_templates)
285. [routing_step_participants](#routing_step_participants)
286. [travel_hazard_alerts](#travel_hazard_alerts)
287. [discipline_template_constraints](#discipline_template_constraints)
288. [template_deployments](#template_deployments)
289. [pages](#pages)
290. [document_numbering_methodologies](#document_numbering_methodologies)
291. [agent_sessions](#agent_sessions)
292. [a_00105_travel_vector](#a_00105_travel_vector)
293. [signature_audit_trail](#signature_audit_trail)
294. [agent_context_boundaries](#agent_context_boundaries)
295. [a_00200_commercial_vector](#a_00200_commercial_vector)
296. [a_00test](#a_00test)
297. [vessels](#vessels)
298. [sync_history](#sync_history)
299. [custom_assignments](#custom_assignments)
300. [contractor_vetting_document_hashes](#contractor_vetting_document_hashes)
301. [agent_activity_log](#agent_activity_log)
302. [logistics_coordination_monitor](#logistics_coordination_monitor)
303. [a_00835_chemeng_vector](#a_00835_chemeng_vector)
304. [email_templates](#email_templates)
305. [a_00900_doccontrol_data](#a_00900_doccontrol_data)
306. [error_implementations](#error_implementations)
307. [a_00900_doccontrol_langchain_jobs](#a_00900_doccontrol_langchain_jobs)
308. [email_sends](#email_sends)
309. [active_entities](#active_entities)
310. [template_analytics](#template_analytics)
311. [agent_permissions](#agent_permissions)
312. [document_references](#document_references)
313. [a_02075_knowledge_base_data](#a_02075_knowledge_base_data)
314. [user_profiles](#user_profiles)
315. [logistics_approval_steps](#logistics_approval_steps)
316. [maintenance_schedules](#maintenance_schedules)
317. [template_dependencies](#template_dependencies)
318. [contractor_vetting_sections](#contractor_vetting_sections)
319. [pages_with_organization_mapping](#pages_with_organization_mapping)
320. [user_roles](#user_roles)
321. [security_alerts](#security_alerts)
322. [governance_approval_steps](#governance_approval_steps)
323. [vector_deletion_audit](#vector_deletion_audit)
324. [document_number_audit_log](#document_number_audit_log)
325. [routing_template_steps](#routing_template_steps)
326. [materials](#materials)
327. [maintenance_history](#maintenance_history)
328. [template_approval_workflows](#template_approval_workflows)
329. [a_00900_doccontrol_documents](#a_00900_doccontrol_documents)
330. [safety_templates](#safety_templates)
331. [a_00886_dirlogistics_vector](#a_00886_dirlogistics_vector)
332. [contractor_evaluation_results](#contractor_evaluation_results)
333. [ui_display_settings](#ui_display_settings)
334. [timesheet_entries](#timesheet_entries)
335. [user_emails](#user_emails)
336. [a_00889_dirfinance_vector](#a_00889_dirfinance_vector)
337. [tender_notification_logs](#tender_notification_logs)
338. [a_01100_ethics_vector](#a_01100_ethics_vector)
339. [form_templates_audit](#form_templates_audit)
340. [organisations_backup](#organisations_backup)
341. [master_templates](#master_templates)
342. [document_access_logs](#document_access_logs)
343. [a_02500_security_vector](#a_02500_security_vector)
344. [agent_template_integrations](#agent_template_integrations)
345. [document_types](#document_types)
346. [governance_document_templates-old](#governance_document_templates-old)
347. [document_download_queue](#document_download_queue)
348. [template_document_structures](#template_document_structures)
349. [agents_unified](#agents_unified)
350. [contractor_vetting_ingestion_registry](#contractor_vetting_ingestion_registry)
351. [project_phase_assignments](#project_phase_assignments)
352. [organizations](#organizations)
353. [a_00890_dirprojects_vector](#a_00890_dirprojects_vector)
354. [a_02250_qc_vector](#a_02250_qc_vector)
355. [logistics_documents](#logistics_documents)
356. [a_01500_hr_candidate_evaluation](#a_01500_hr_candidate_evaluation)
357. [llm_configurations](#llm_configurations)
358. [email_content_storage](#email_content_storage)
359. [sections](#sections)
360. [prompt_usage_audit](#prompt_usage_audit)
361. [routing_notifications](#routing_notifications)
362. [a_01850_otherparties_vector](#a_01850_otherparties_vector)
363. [document_comparisons](#document_comparisons)
364. [resource_prompts](#resource_prompts)
365. [vector_system_health](#vector_system_health)
366. [chatbot_messages](#chatbot_messages)
367. [project_engineering_templates](#project_engineering_templates)
368. [safety_template_usage](#safety_template_usage)
369. [error_trackings](#error_trackings)
370. [template_reviews](#template_reviews)
371. [internal_notifications](#internal_notifications)
372. [template_categories](#template_categories)
373. [email_attachments](#email_attachments)
374. [a_00900_doccontrol_document_versions](#a_00900_doccontrol_document_versions)
375. [agent_sequence_operations](#agent_sequence_operations)
376. [emails](#emails)
377. [a_performance_docs_vector](#a_performance_docs_vector)
378. [approval_delegations](#approval_delegations)
379. [a_02100_pr_media](#a_02100_pr_media)
380. [timesheet_templates](#timesheet_templates)
381. [procurement_templates_backup_20251121](#procurement_templates_backup_20251121)
382. [complete_epcm_accordion](#complete_epcm_accordion)
383. [risk_assessments](#risk_assessments)
384. [chat_sessions](#chat_sessions)
385. [chatbot_performance_metrics](#chatbot_performance_metrics)
386. [document_routing_templates](#document_routing_templates)
387. [vetting_evaluation_audit](#vetting_evaluation_audit)
388. [accordion_options](#accordion_options)
389. [workflow_routing_steps](#workflow_routing_steps)
390. [a_02025_qs_data](#a_02025_qs_data)
391. [governance_template_usage](#governance_template_usage)
392. [email_ai_processing_queue](#email_ai_processing_queue)
393. [custom_document_types](#custom_document_types)
394. [document_versions](#document_versions)
395. [user_organizations](#user_organizations)
396. [monthly_documents_created](#monthly_documents_created)
397. [user_email_accounts](#user_email_accounts)
398. [email_providers](#email_providers)
399. [contributors](#contributors)
400. [training_materials](#training_materials)
401. [scope_of_work](#scope_of_work)
402. [procurement_categories](#procurement_categories)
403. [project_procurement_templates](#project_procurement_templates)
404. [tender_items](#tender_items)
405. [chatbot_interactions](#chatbot_interactions)
406. [a_00871_processeng_vector](#a_00871_processeng_vector)
407. [error_metrics](#error_metrics)
408. [chatbot_sessions](#chatbot_sessions)
409. [user_company_access](#user_company_access)
410. [document_type_relationships](#document_type_relationships)
411. [governance_document_templates](#governance_document_templates)
412. [contractor_evaluations](#contractor_evaluations)
413. [a_02400_safety_data](#a_02400_safety_data)
414. [timesheet_amendments](#timesheet_amendments)
415. [document_analysis_prompts](#document_analysis_prompts)
416. [a_02075_knowledge_base](#a_02075_knowledge_base)
417. [disciplines](#disciplines)
418. [consolidated_documents](#consolidated_documents)
419. [email_send_attachments](#email_send_attachments)
420. [sow_document_transfers](#sow_document_transfers)
421. [a_00300_construction_vector](#a_00300_construction_vector)
422. [procurement_approvals](#procurement_approvals)
423. [email_notifications](#email_notifications)
424. [project_phases](#project_phases)
425. [a_02075_inspection_vector](#a_02075_inspection_vector)
426. [document_types_by_discipline](#document_types_by_discipline)
427. [active_users_travel_docs](#active_users_travel_docs)
428. [flowise_documents](#flowise_documents)
429. [temporary_uploads](#temporary_uploads)
430. [a_01750_legal_vector](#a_01750_legal_vector)
431. [user_project_access](#user_project_access)
432. [tender_documents](#tender_documents)
433. [esignature_audit](#esignature_audit)
434. [api_usage_metrics](#api_usage_metrics)
435. [multi_source_tenders](#multi_source_tenders)
436. [template_derivations](#template_derivations)
437. [email_threads](#email_threads)
438. [match_all_documents](#match_all_documents)
439. [procurement_order_documents](#procurement_order_documents)
440. [signature_webhooks](#signature_webhooks)
441. [template_assignments](#template_assignments)
442. [chatbot_usage_analytics](#chatbot_usage_analytics)
443. [financial_records](#financial_records)
444. [correspondence_training_data](#correspondence_training_data)
445. [email_search_history](#email_search_history)
446. [approval_instances](#approval_instances)
447. [contractor_vetting_documents](#contractor_vetting_documents)
448. [timesheet_audit_logs](#timesheet_audit_logs)
449. [numbering_config](#numbering_config)
450. [a_02050_logistics_data](#a_02050_logistics_data)
451. [master_engineering_templates](#master_engineering_templates)
452. [a_00102_admin_vector](#a_00102_admin_vector)
453. [security_audit_log](#security_audit_log)
454. [notifications](#notifications)
455. [a_00870_mecheng_vector](#a_00870_mecheng_vector)
456. [limits_of_authority](#limits_of_authority)
457. [user_email_aliases](#user_email_aliases)
458. [contractor_vetting_document_parts](#contractor_vetting_document_parts)
459. [a_02075_inspection_data](#a_02075_inspection_data)
460. [a_01600_localcontent_vector](#a_01600_localcontent_vector)
461. [sequence_overrides](#sequence_overrides)

---

## a_00850_civileng_vector

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| embedding | string | No | - |
| metadata | unknown | No | - |
| content | string | No | - |
| created_by_user_id | integer | No | - |
| access_scope | string | No | - |
| organisation_id | integer | No | - |
| shared_with_disciplines | string | No | - |
| workspace_id | string | No | Note:
This is a Foreign Key to `vector_workspaces.id`.<fk table='vector_workspaces' column='id'/> |
| workspace_type | string | No | - |
| deleted_at | string | No | - |
| deleted_by | string | No | - |
| deletion_reason | string | No | - |
| scheduled_hard_delete_at | string | No | - |
| isolation_metadata | unknown | No | - |
| chunks | unknown | No | - |
| discipline_code | string | No | - |
| project_id | integer | No | - |

---

## approval_workflows

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| name | string | Yes | - |
| department | string | No | - |
| role | string | No | - |
| approvers | unknown | No | - |
| escalation_rules | unknown | No | - |
| is_active | boolean | No | - |
| created_at | string | No | - |
| updated_at | string | No | - |
| organization_id | string | No | - |
| user_id | string | No | - |

---

## user_langchain_settings

Secure storage for user-specific LangChain AI configurations with encrypted API keys

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| user_id | string | No | - |
| organization_id | string | No | - |
| openai_api_key | string | No | Encrypted OpenAI API key |
| anthropic_api_key | string | No | Encrypted Anthropic API key |
| cohere_api_key | string | No | - |
| llm_provider | string | No | Primary LLM provider (openai, anthropic, etc.) |
| llm_model | string | No | - |
| embeddings_provider | string | No | - |
| embeddings_model | string | No | - |
| temperature | number | No | AI creativity/randomness setting (0.0-2.0) |
| max_tokens | integer | No | - |
| dimensions | integer | No | - |
| chunk_size | integer | No | - |
| chunk_overlap | integer | No | - |
| langsmith_enabled | boolean | No | - |
| langsmith_project | string | No | - |
| created_at | string | No | - |
| updated_at | string | No | - |

---

## dashboard_progress

Stores progress data displayed on user dashboards

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| user_id | string | Yes | - |
| order_id | string | No | - |
| progress_data | unknown | Yes | - |
| last_updated | string | No | - |
| organization_id | string | No | - |

---

## inspections

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | integer | Yes | Note:
This is a Primary Key.<pk/> |
| inspection_id | string | Yes | - |
| project_id | string | Yes | - |
| inspection_type | string | Yes | - |
| scheduled_date | string | Yes | - |
| completed_date | string | No | - |
| inspector_id | string | No | - |
| facility | string | No | - |
| status | string | No | - |
| priority | string | No | - |
| notes | string | No | - |
| findings_count | integer | No | - |
| created_at | string | No | - |
| updated_at | string | No | - |
| created_by | string | No | - |
| updated_by | string | No | - |
| organization_id | string | No | - |

---

## shipment_containers

Junction table linking shipments to containers

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| shipment_id | string | No | Note:
This is a Foreign Key to `logistics_shipments.id`.<fk table='logistics_shipments' column='id'/> |
| container_id | string | No | Note:
This is a Foreign Key to `containers.id`.<fk table='containers' column='id'/> |
| sequence_number | integer | No | - |
| loading_order | integer | No | - |
| created_at | string | No | - |
| created_by | string | No | - |
| organization_id | string | No | - |

---

## api_health_checks

Automated health monitoring results for API endpoints

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| api_config_id | string | Yes | - |
| check_type | string | Yes | - |
| status | string | Yes | - |
| response_time | integer | No | - |
| status_code | integer | No | - |
| error_message | string | No | - |
| metadata | unknown | No | - |
| checked_at | string | Yes | - |
| next_check_at | string | No | - |

---

## chatbots_backup

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| page | string | No | - |
| state | string | No | - |
| flow_id | string | No | - |
| input_placeholder | string | No | - |
| sector | string | No | - |
| sector_id | string | No | - |
| updated_at | string | No | - |

---

## sectors

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| sector_id | string | Yes | Note:
This is a Primary Key.<pk/> |
| sector_name | string | Yes | - |
| is_active | boolean | Yes | - |
| page_number_prefix_start | integer | Yes | - |
| page_number_prefix_end | integer | Yes | - |
| created_at | string | Yes | - |
| updated_at | string | Yes | - |

---

## logistics_document_versions

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| document_id | string | No | Note:
This is a Foreign Key to `logistics_documents.id`.<fk table='logistics_documents' column='id'/> |
| version_number | integer | Yes | - |
| content | unknown | No | - |
| metadata | unknown | No | - |
| generated_by_ai | boolean | No | - |
| ai_model | string | No | - |
| ai_confidence | number | No | - |
| created_at | string | No | - |
| created_by | string | No | - |

---

## available_companies

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| company_name | string | No | - |
| source | string | No | - |

---

## safety_template_categories

Categorization system for safety templates

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| category_code | string | Yes | - |
| category_name | string | Yes | - |
| category_description | string | No | - |
| parent_category_id | string | No | Note:
This is a Foreign Key to `safety_template_categories.id`.<fk table='safety_template_categories' column='id'/> |
| is_active | boolean | No | - |
| sort_order | integer | No | - |
| created_at | string | No | - |

---

## integration_sources

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| source_id | string | Yes | - |
| name | string | Yes | - |
| description | string | No | - |
| base_url | string | No | - |
| api_key_encrypted | string | No | - |
| username_encrypted | string | No | - |
| password_encrypted | string | No | - |
| integration_type | string | Yes | - |
| status | string | No | - |
| config | unknown | No | - |
| last_sync_at | string | No | - |
| last_successful_sync_at | string | No | - |
| last_error | string | No | - |
| sync_interval_minutes | integer | No | - |
| rate_limit_per_minute | integer | No | - |
| timeout_seconds | integer | No | - |
| retry_attempts | integer | No | - |
| created_at | string | No | - |
| updated_at | string | No | - |

---

## discipline_document_paths

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| organisation_id | string | Yes | Note:
This is a Foreign Key to `organizations.id`.<fk table='organizations' column='id'/> |
| discipline_id | string | Yes | - |
| document_type_id | string | Yes | Note:
This is a Foreign Key to `document_types_by_discipline.id`.<fk table='document_types_by_discipline' column='id'/> |
| path_configuration | unknown | Yes | - |
| path_template | string | Yes | - |
| is_active | boolean | No | - |
| is_default | boolean | No | - |
| created_by | string | Yes | - |
| created_at | string | No | - |
| updated_at | string | No | - |
| organization_id | string | No | - |

---

## approval_document_links

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| approval_instance_id | string | Yes | Note:
This is a Foreign Key to `governance_approval_instances.id`.<fk table='governance_approval_instances' column='id'/> |
| document_id | string | No | - |
| document_source | string | No | - |
| version_number | string | No | - |
| file_path | string | No | - |
| created_at | string | No | - |

---

## signature_documents

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| document_id | string | No | Note:
This is a Foreign Key to `a_00900_doccontrol_documents.id`.<fk table='a_00900_doccontrol_documents' column='id'/> |
| documenso_document_id | string | Yes | - |
| status | string | No | - |
| workflow_type | string | No | - |
| document_name | string | Yes | - |
| document_url | string | No | - |
| file_path | string | No | - |
| created_by | string | No | - |
| created_at | string | No | - |
| expires_at | string | No | - |
| updated_at | string | No | - |
| organization_id | integer | No | - |
| contract_id | integer | No | - |
| procurement_phase | string | No | - |

---

## logistics_shipments

High-level shipment records

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| shipment_number | string | Yes | - |
| shipment_name | string | No | - |
| shipment_type | string | No | - |
| shipper_name | string | No | - |
| shipper_address | string | No | - |
| consignee_name | string | No | - |
| consignee_address | string | No | - |
| freight_forwarder | string | No | - |
| origin_port | string | No | - |
| destination_port | string | No | - |
| transit_ports | array | No | - |
| booking_date | string | No | - |
| planned_departure_date | string | No | - |
| actual_departure_date | string | No | - |
| planned_arrival_date | string | No | - |
| actual_arrival_date | string | No | - |
| total_value | number | No | - |
| currency | string | No | - |
| incoterms | string | No | - |
| payment_terms | string | No | - |
| shipment_status | string | No | - |
| priority_level | string | No | - |
| documents_complete | boolean | No | - |
| customs_cleared | boolean | No | - |
| insurance_reference | string | No | - |
| notes | string | No | - |
| special_instructions | string | No | - |
| created_at | string | No | - |
| updated_at | string | No | - |
| created_by | string | No | - |
| is_active | boolean | No | - |
| company_id | string | No | - |
| organisation_id | string | No | - |
| project_id | string | No | - |
| organization_id | string | No | - |

---

## travel_equipment_filters

Equipment filters for travel routes

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| name | string | Yes | - |
| required_for | array | No | - |
| created_at | string | No | - |
| updated_at | string | No | - |
| organization_id | string | No | - |
| user_id | string | No | - |

---

## vector_workspaces

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| name | string | Yes | - |
| description | string | No | - |
| workspace_type | string | No | - |
| created_by | string | No | - |
| organisation_id | string | No | - |
| project_id | string | No | - |
| discipline_restrictions | array | No | - |
| auto_cleanup_after | string | No | - |
| created_at | string | No | - |
| expires_at | string | No | - |
| is_active | boolean | No | - |

---

## civil_engineering_document_links

Junction table for linking civil engineering documents to other documents and references

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| document_id | string | Yes | Note:
This is a Foreign Key to `civil_engineering_documents.id`.<fk table='civil_engineering_documents' column='id'/> |
| linked_document_id | string | No | - |
| linked_document_type | string | No | - |
| reference_type | string | No | Type of relationship: reference, supersedes, related, supporting |
| link_description | string | No | - |
| link_created_by | string | No | - |
| link_created_at | string | No | - |
| project_phase | string | No | - |
| document_section | string | No | - |
| organization_id | string | No | Note:
This is a Foreign Key to `organizations.id`.<fk table='organizations' column='id'/> |

---

## pages_directors_backup_20250726

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| page_id | string | No | - |
| page_prefix | string | No | - |
| page_name | string | No | - |
| page_slug | string | No | - |
| sector_id | string | No | - |
| organization_id | string | No | - |
| organisation_name | string | No | - |
| sector_name | string | No | - |
| created_at | string | No | - |
| updated_at | string | No | - |
| display_order | integer | No | - |
| parent_page_id | string | No | - |
| organisation_id | string | No | - |
| sector_uuid | string | No | - |
| is_active | boolean | No | - |

---

## template_versions

Version history for master template changes

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| template_id | string | No | Note:
This is a Foreign Key to `master_templates.id`.<fk table='master_templates' column='id'/> |
| version_number | integer | Yes | - |
| changes | string | Yes | - |
| content | unknown | No | - |
| created_at | string | No | - |

---

## a_00875_sales_vector

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| embedding | string | No | - |
| metadata | unknown | No | - |
| content | string | No | - |
| created_by_user_id | integer | No | - |
| access_scope | string | No | - |
| organisation_id | integer | No | - |
| shared_with_disciplines | string | No | - |
| chunks | unknown | No | - |
| discipline_code | string | No | - |
| isolation_metadata | unknown | No | - |
| project_id | integer | No | - |
| workspace_id | integer | No | - |
| workspace_type | string | No | - |

---

## contractor_vetting_chat_messages

Chat messages for contractor vetting assistance

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | integer | Yes | Note:
This is a Primary Key.<pk/> |
| vetting_id | integer | No | Reference to vetting record

Note:
This is a Foreign Key to `contractor_vetting.id`.<fk table='contractor_vetting' column='id'/> |
| message_type | string | No | Type of message |
| sender | string | No | Name of the message sender |
| message_text | string | Yes | Content of the message |
| timestamp | string | No | - |
| session_id | string | No | Session identifier |
| organization_id | string | No | Note:
This is a Foreign Key to `organizations.id`.<fk table='organizations' column='id'/> |

---

## job_descriptions

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| title | string | Yes | - |
| location | string | No | - |
| employment_type | string | No | - |
| salary_range_min | number | No | - |
| salary_range_max | number | No | - |
| job_description | string | No | - |
| requirements | string | No | - |
| responsibilities | string | No | - |
| benefits | string | No | - |
| application_deadline | string | No | - |
| contact_person | string | No | - |
| status | string | No | - |
| created_by | string | No | - |
| updated_by | string | No | - |
| created_at | string | No | - |
| updated_at | string | No | - |
| discipline | string | No | Discipline or division (formerly department) |

---

## cv_analyses

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| candidate_name | string | No | - |
| position_applied | string | No | - |
| experience_level | string | No | - |
| years_experience | integer | No | - |
| job_title | string | No | - |
| job_department | string | No | - |
| overall_rating | number | No | - |
| analysis_data | unknown | No | - |
| ai_model | string | No | - |
| created_at | string | No | - |

---

## a_00825_architectural_vector

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| embedding | string | No | - |
| metadata | unknown | No | - |
| content | string | No | - |
| created_by_user_id | integer | No | - |
| access_scope | string | No | - |
| organisation_id | integer | No | - |
| shared_with_disciplines | string | No | - |
| chunks | unknown | No | - |

---

## a_01800_operations_vector

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| embedding | string | No | - |
| metadata | unknown | No | - |
| content | string | No | - |
| created_by_user_id | integer | No | - |
| access_scope | string | No | - |
| organisation_id | integer | No | - |
| shared_with_disciplines | string | No | - |
| chunks | unknown | No | - |
| discipline_code | string | No | - |
| isolation_metadata | unknown | No | - |
| project_id | integer | No | - |
| workspace_id | integer | No | - |
| workspace_type | string | No | - |

---

## maintenance_assets

Equipment and plant assets for maintenance tracking

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| name | string | Yes | - |
| type | string | Yes | - |
| manufacturer | string | No | - |
| model | string | No | - |
| serial_number | string | No | - |
| year | integer | No | - |
| location | string | No | - |
| status | string | No | - |
| description | string | No | - |
| purchase_date | string | No | - |
| purchase_cost | number | No | - |
| warranty_expiry | string | No | - |
| last_maintenance | string | No | - |
| next_due | string | No | - |
| user_id | string | No | - |
| project_id | string | No | - |
| created_at | string | No | - |
| updated_at | string | No | - |
| organization_id | string | No | - |

---

## template_approval_rules

Workflow rules for template approvals based on type and value

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| template_type | string | Yes | - |
| category | string | No | - |
| value_threshold | number | No | - |
| required_roles | array | No | - |
| requires_technical_review | boolean | No | - |
| requires_legal_review | boolean | No | - |
| approval_order | string | No | - |
| is_active | boolean | No | - |
| created_at | string | No | - |

---

## a_01400_health_vector

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| embedding | string | No | - |
| metadata | unknown | No | - |
| content | string | No | - |
| created_by_user_id | integer | No | - |
| access_scope | string | No | - |
| organisation_id | integer | No | - |
| shared_with_disciplines | string | No | - |
| chunks | unknown | No | - |
| discipline_code | string | No | - |
| isolation_metadata | unknown | No | - |
| project_id | integer | No | - |
| workspace_id | integer | No | - |
| workspace_type | string | No | - |

---

## user_department_access

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| user_id | string | Yes | - |
| department_code | string | Yes | - |
| role_level | string | No | - |
| created_at | string | No | - |
| organization_id | string | No | - |

---

## contracts_post_summary

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| contract_status | string | No | - |
| contract_count | integer | No | - |
| total_value | number | No | - |
| avg_progress | number | No | - |
| total_documents | integer | No | - |
| latest_contract | string | No | - |

---

## timesheet_submissions

Timesheet submissions for approval workflow

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Unique identifier for the submission

Note:
This is a Primary Key.<pk/> |
| user_id | string | No | Reference to the user who submitted |
| week_key | string | Yes | Week identifier in YYYY-WXX format |
| week_start_date | string | Yes | Start date of the week |
| week_end_date | string | Yes | End date of the week |
| tasks | unknown | Yes | JSON array of tasks for the week |
| total_hours | number | No | Total hours for the week |
| status | string | No | Current status: draft, submitted, approved, rejected |
| submitted_at | string | No | When the timesheet was submitted |
| approved_at | string | No | When the timesheet was approved |
| rejected_at | string | No | When the timesheet was rejected |
| approver_id | string | No | Reference to the approver |
| rejection_reason | string | No | Reason for rejection if rejected |
| created_at | string | No | - |
| updated_at | string | No | - |
| organization_id | string | No | - |

---

## flowise_documents_with_stores

View combining Flowise documents with their document store information

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | No | Note:
This is a Primary Key.<pk/> |
| document_store_id | string | No | Note:
This is a Foreign Key to `document_stores.id`.<fk table='document_stores' column='id'/> |
| flowise_loader_id | string | No | - |
| flowise_file_id | string | No | - |
| document_name | string | No | - |
| original_filename | string | No | - |
| file_size | integer | No | - |
| mime_type | string | No | - |
| loader_name | string | No | - |
| loader_type | string | No | - |
| splitter_name | string | No | - |
| total_chunks | integer | No | - |
| total_characters | integer | No | - |
| status | string | No | - |
| uploaded_at | string | No | - |
| processed_at | string | No | - |
| loader_config | unknown | No | - |
| document_metadata | unknown | No | - |
| splitter_config | unknown | No | - |
| created_at | string | No | - |
| updated_at | string | No | - |
| last_synced_at | string | No | - |
| store_name | string | No | - |
| store_description | string | No | - |
| store_metadata | unknown | No | - |

---

## performance_metrics

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| metric_type | string | Yes | - |
| value | number | No | - |
| metadata | unknown | No | - |
| user_id | string | No | - |
| discipline_code | string | No | - |
| created_at | string | No | - |

---

## llm_document_type_mappings

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | integer | Yes | Note:
This is a Primary Key.<pk/> |
| llm_configuration_id | string | No | Note:
This is a Foreign Key to `llm_configurations.id`.<fk table='llm_configurations' column='id'/> |
| document_type | string | Yes | - |
| analysis_type | string | Yes | - |
| created_at | string | Yes | - |
| updated_at | string | Yes | - |
| file_format | string | No | - |
| default_format | boolean | No | - |
| organization_id | string | No | - |
| user_id | string | No | - |

---

## prompts_enhanced

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | No | Note:
This is a Primary Key.<pk/> |
| name | string | No | - |
| content | string | No | - |
| description | string | No | - |
| organization_id | string | No | - |
| sector_id | string | No | - |
| type | string | No | - |
| category | string | No | - |
| tags | array | No | - |
| is_active | boolean | No | - |
| metadata | unknown | No | - |
| created_at | string | No | - |
| updated_at | string | No | - |
| key | string | No | - |
| role_type | string | No | - |
| access_permissions | unknown | No | - |
| created_by | string | No | - |
| cross_reference_id | string | No | - |
| pages_used | array | No | - |
| date_added | string | No | - |
| date_modified | string | No | - |
| script_usage | unknown | No | - |
| usage_statistics | unknown | No | - |
| workflow_context | unknown | No | - |
| performance_requirements | unknown | No | - |
| agent_capabilities | unknown | No | - |
| integration_points | unknown | No | - |
| success_criteria | unknown | No | - |
| prompt_version | string | No | - |
| last_tested | string | No | - |
| test_results | unknown | No | - |
| workflow_triggers | string | No | - |
| workflow_dependencies | string | No | - |
| workflow_outputs | string | No | - |
| target_accuracy | number | No | - |
| max_processing_time | integer | No | - |
| expected_field_count | integer | No | - |
| supported_disciplines | string | No | - |
| supported_document_types | string | No | - |
| supports_multi_agent | boolean | No | - |
| integrated_pages | string | No | - |
| integrated_apis | string | No | - |
| integrated_databases | string | No | - |
| accuracy_threshold | number | No | - |
| quality_score_min | number | No | - |
| last_success_rate | number | No | - |
| avg_processing_time | number | No | - |
| total_tests_run | integer | No | - |

---

## agent_profiles

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| user_type | string | No | - |
| agent_metadata | unknown | No | - |
| created_at | string | No | - |
| updated_at | string | No | - |

---

## a_00882_dirconst_vector

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| embedding | string | No | - |
| metadata | unknown | No | - |
| content | string | No | - |
| created_by_user_id | integer | No | - |
| access_scope | string | No | - |
| organisation_id | integer | No | - |
| shared_with_disciplines | string | No | - |
| chunks | unknown | No | - |
| discipline_code | string | No | - |
| isolation_metadata | unknown | No | - |
| project_id | integer | No | - |
| workspace_id | integer | No | - |
| workspace_type | string | No | - |

---

## containers

Stores container information and tracking data

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| container_number | string | Yes | - |
| container_type | string | No | - |
| container_size | string | No | - |
| iso_code | string | No | - |
| tare_weight | number | No | - |
| max_payload | number | No | - |
| current_status | string | No | - |
| current_location | string | No | - |
| current_latitude | number | No | - |
| current_longitude | number | No | - |
| vessel_id | string | No | Note:
This is a Foreign Key to `vessels.id`.<fk table='vessels' column='id'/> |
| vessel_name | string | No | - |
| cargo_description | string | No | - |
| cargo_weight | number | No | - |
| cargo_value | number | No | - |
| cargo_currency | string | No | - |
| booking_reference | string | No | - |
| bill_of_lading | string | No | - |
| shipper_name | string | No | - |
| consignee_name | string | No | - |
| notify_party | string | No | - |
| port_of_loading | string | No | - |
| port_of_discharge | string | No | - |
| final_destination | string | No | - |
| estimated_arrival | string | No | - |
| actual_arrival | string | No | - |
| container_tracking_id | string | No | - |
| last_tracking_update | string | No | - |
| api_data | unknown | No | - |
| created_at | string | No | - |
| updated_at | string | No | - |
| created_by | string | No | - |
| is_active | boolean | No | - |
| company_id | string | No | - |
| organisation_id | string | No | - |
| project_id | string | No | - |
| organization_id | string | No | - |

---

## discipline_evaluation_weights

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| organization_id | string | No | Note:
This is a Foreign Key to `organizations.id`.<fk table='organizations' column='id'/> |
| evaluation_context | string | Yes | - |
| discipline_code | string | Yes | - |
| discipline_name | string | Yes | - |
| weight_percentage | number | Yes | - |
| scoring_criteria | unknown | No | - |
| max_score | integer | No | - |
| passing_score | integer | No | - |
| is_active | boolean | No | - |
| created_at | string | No | - |
| created_by | string | No | Note:
This is a Foreign Key to `user_management.user_id`.<fk table='user_management' column='user_id'/> |
| updated_at | string | No | - |
| updated_by | string | No | Note:
This is a Foreign Key to `user_management.user_id`.<fk table='user_management' column='user_id'/> |

---

## a_00900_doccontrol_document_embeddings

Stores text chunks and their vector embeddings for semantic search

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| document_id | string | Yes | Note:
This is a Foreign Key to `a_00900_doccontrol_documents.id`.<fk table='a_00900_doccontrol_documents' column='id'/> |
| chunk_index | integer | Yes | - |
| chunk_text | string | Yes | - |
| chunk_metadata | unknown | No | - |
| embedding | string | No | - |
| embedding_model | string | Yes | - |
| embedding_provider | string | Yes | - |
| created_at | string | No | - |
| updated_at | string | No | - |
| organization_id | string | No | - |
| user_id | string | No | - |

---

## section_organization_mapping

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| section_key | string | Yes | Note:
This is a Foreign Key to `accordion_sections.section_key`.<fk table='accordion_sections' column='section_key'/> |
| organization_id | string | Yes | Note:
This is a Foreign Key to `organizations.id`.<fk table='organizations' column='id'/> |
| is_visible | boolean | No | - |
| created_at | string | No | - |
| updated_at | string | No | - |

---

## email_access_logs

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| email_send_id | string | Yes | Note:
This is a Foreign Key to `email_sends.id`.<fk table='email_sends' column='id'/> |
| doc_id | string | Yes | - |
| actor_id | string | No | Note:
This is a Foreign Key to `user_management.user_id`.<fk table='user_management' column='user_id'/> |
| accessed_at | string | Yes | - |
| ip | string | No | - |
| user_agent | string | No | - |

---

## logistics_context_data

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| procurement_order_id | string | No | - |
| orderid | string | No | - |
| ordernumber | string | No | - |
| orderdate | string | No | - |
| exporterdetails | unknown | No | - |
| importerdetails | unknown | No | - |
| cargodescription | string | No | - |
| hscode | string | No | - |
| quantity | number | No | - |
| unit | string | No | - |
| value | number | No | - |
| currency | string | No | - |
| weight | number | No | - |
| deliveryterms | string | No | - |
| transportmode | string | No | - |
| deliveryaddress | unknown | No | - |
| lastupdated | string | No | - |
| source | string | No | - |
| exportdeclarationrequired | boolean | No | - |

---

## push_notifications

Stores push notifications sent to users about workflow updates

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| user_id | string | Yes | - |
| order_id | string | No | - |
| title | string | Yes | - |
| body | string | Yes | - |
| notification_type | string | No | - |
| metadata | unknown | No | - |
| created_at | string | No | - |
| read | boolean | No | - |
| read_at | string | No | - |
| organization_id | string | No | - |

---

## chatbot_vector_configs

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| config_id | string | Yes | Note:
This is a Primary Key.<pk/> |
| page_id | string | Yes | - |
| vector_table_name | string | Yes | - |
| search_enabled | boolean | No | - |
| search_threshold | number | No | - |
| max_results | integer | No | - |
| filters | unknown | No | - |
| created_at | string | Yes | - |
| updated_at | string | Yes | - |

---

## task_comments

Comments and notes added to tasks for collaboration

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| task_id | string | Yes | Note:
This is a Foreign Key to `tasks.id`.<fk table='tasks' column='id'/> |
| user_id | string | Yes | - |
| comment | string | Yes | - |
| is_internal | boolean | No | - |
| created_at | string | No | - |
| updated_at | string | No | - |

---

## chatbot_pages

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| page_id | string | Yes | - |
| page_name | string | Yes | - |
| category | string | Yes | - |
| chatbot_type | string | Yes | - |
| has_chatbot | boolean | Yes | - |
| vector_table_name | string | No | - |
| description | string | No | - |
| created_at | string | Yes | - |
| updated_at | string | Yes | - |

---

## numbering_patterns

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| name | string | Yes | - |
| description | string | No | - |
| organization_id | string | Yes | - |
| pattern | string | Yes | - |
| is_active | boolean | No | - |
| created_at | string | No | - |
| updated_at | string | No | - |

---

## document_processing_history

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| tender_id | string | Yes | - |
| document_id | string | No | - |
| document_url | string | Yes | - |
| operation_type | string | Yes | - |
| status | string | Yes | - |
| error_message | string | No | - |
| processing_time_ms | integer | No | - |
| file_size_processed | integer | No | - |
| metadata_collected | unknown | No | - |
| created_at | string | No | - |

---

## organization_collaborations

Defines collaborations between organizations for cross-organizational accordion sharing

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| primary_organization_id | string | Yes | The organization that owns the primary accordion structure

Note:
This is a Foreign Key to `organizations.id`.<fk table='organizations' column='id'/> |
| collaborating_organization_id | string | Yes | The organization that collaborates with the primary organization

Note:
This is a Foreign Key to `organizations.id`.<fk table='organizations' column='id'/> |
| shared_sections | array | No | Array of section IDs that are shared between organizations |
| agent_sharing_permissions | array | No | Array of agent IDs that can be shared between organizations |
| is_active | boolean | No | - |
| created_at | string | No | - |
| updated_at | string | No | - |
| primary_org_supabase_config | unknown | No | Supabase configuration for the primary organization (cached for performance) |
| context_mapping | unknown | No | Mapping of sections to database contexts for this collaboration |
| page_precedence | string | No | Determines which organization's pages take precedence when there are conflicts: 'host' or 'collaborator' |
| organization_id | string | No | - |
| user_id | string | No | - |

---

## agent_modal_assignments

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | integer | Yes | Note:
This is a Primary Key.<pk/> |
| modal_configuration_id | string | Yes | Note:
This is a Foreign Key to `modal_configurations.id`.<fk table='modal_configurations' column='id'/> |
| page_id | string | Yes | Note:
This is a Foreign Key to `pages.page_id`.<fk table='pages' column='page_id'/> |
| created_at | string | Yes | - |
| updated_at | string | Yes | - |
| last_used | string | No | - |
| agent_name | string | Yes | - |

---

## section_pages

Maps pages to sections using section_key

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| section_key | string | Yes | - |
| page_id | string | Yes | Note:
This is a Foreign Key to `pages.page_id`.<fk table='pages' column='page_id'/> |
| display_order | integer | Yes | - |
| is_subsection | boolean | No | - |
| parent_page_id | string | No | Note:
This is a Foreign Key to `pages.page_id`.<fk table='pages' column='page_id'/> |
| created_at | string | No | - |
| updated_at | string | No | - |

---

## vector_deletion_policies

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| policy_name | string | Yes | - |
| applies_to_scope | string | No | - |
| retention_period | string | No | - |
| auto_delete | boolean | No | - |
| requires_approval | boolean | No | - |
| created_by | string | No | - |
| created_at | string | No | - |

---

## document_categories

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| category_code | string | Yes | - |
| category_name | string | Yes | - |
| description | string | No | - |
| is_active | boolean | No | - |
| created_at | string | No | - |
| organization_id | string | No | Note:
This is a Foreign Key to `organizations.id`.<fk table='organizations' column='id'/> |

---

## tender_approvals

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| tender_id | string | Yes | Note:
This is a Foreign Key to `tenders.id`.<fk table='tenders' column='id'/> |
| approval_level | integer | Yes | - |
| approver_id | string | No | - |
| approver_name | string | No | - |
| approver_role | string | No | - |
| approval_status | string | No | - |
| approval_date | string | No | - |
| comments | string | No | - |
| approval_document_url | string | No | - |
| delegation_to | string | No | - |
| created_at | string | No | - |
| updated_at | string | No | - |

---

## contacts

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| contact_id | string | Yes | Note:
This is a Primary Key.<pk/> |
| users_name | string | No | - |
| email | string | No | - |
| first_name | string | No | - |
| last_name | string | No | - |
| phone_number | string | No | - |
| company | string | No | - |
| job_title | string | No | - |
| address | string | No | - |
| city | string | No | - |
| province | string | No | - |
| postal_code | string | No | - |
| country | string | No | - |
| created_at | string | No | - |
| updated_at | string | No | - |
| notes | string | No | - |
| organization_id | string | No | Note:
This is a Foreign Key to `organizations.id`.<fk table='organizations' column='id'/> |

---

## organization_db_configs

View of organizations with valid Supabase database configurations for multi-database context switching

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | No | Note:
This is a Primary Key.<pk/> |
| name | string | No | - |
| supabase_url | string | No | - |
| supabase_anon_key | string | No | - |
| supabase_service_key | string | No | - |
| is_active | boolean | No | - |
| created_at | string | No | - |
| updated_at | string | No | - |

---

## email_sync_log

Logs of email synchronization operations

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| account_id | string | Yes | Note:
This is a Foreign Key to `user_email_accounts.id`.<fk table='user_email_accounts' column='id'/> |
| user_id | string | Yes | Note:
This is a Foreign Key to `user_management.user_id`.<fk table='user_management' column='user_id'/> |
| sync_type | string | Yes | - |
| sync_status | string | Yes | - |
| emails_fetched | integer | No | - |
| emails_processed | integer | No | - |
| emails_failed | integer | No | - |
| new_emails | integer | No | - |
| updated_emails | integer | No | - |
| started_at | string | Yes | - |
| completed_at | string | No | - |
| duration_seconds | integer | No | - |
| error_message | string | No | - |
| error_details | unknown | No | - |
| provider_response | unknown | No | - |
| created_at | string | No | - |

---

## tender_suppliers

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| tender_id | string | Yes | Note:
This is a Foreign Key to `tenders.id`.<fk table='tenders' column='id'/> |
| supplier_id | string | No | - |
| supplier_name | string | Yes | - |
| contact_person | string | No | - |
| contact_email | string | No | - |
| contact_phone | string | No | - |
| bid_amount | number | No | - |
| bid_currency | string | No | - |
| bid_validity_period | integer | No | - |
| technical_score | number | No | - |
| financial_score | number | No | - |
| overall_score | number | No | - |
| bid_status | string | No | - |
| submission_date | string | No | - |
| bid_document_url | string | No | - |
| technical_proposal | string | No | - |
| financial_proposal | string | No | - |
| clarifications_requested | array | No | - |
| clarifications_provided | array | No | - |
| evaluation_notes | string | No | - |
| ranking | integer | No | - |
| is_preferred | boolean | No | - |
| created_at | string | No | - |
| updated_at | string | No | - |

---

## training_pipeline_status

Tracks training data pipeline status from local storage through production deployment

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| discipline_code | string | Yes | Unique identifier for the discipline (e.g., procurement, safety) |
| discipline_name | string | No | - |
| training_examples_count | integer | No | Number of training examples in the dataset |
| file_size_bytes | integer | No | - |
| file_hash | string | No | SHA256 hash for file integrity verification |
| quality_score_min | number | No | - |
| quality_score_max | number | No | - |
| quality_score_avg | number | No | - |
| file_last_modified | string | No | - |
| local_scan_status | string | No | - |
| local_scan_timestamp | string | No | - |
| hf_upload_status | string | No | - |
| hf_upload_timestamp | string | No | - |
| hf_repository_url | string | No | - |
| runpod_training_status | string | No | - |
| runpod_training_timestamp | string | No | - |
| training_duration_hours | number | No | - |
| estimated_cost_usd | number | No | - |
| runpod_job_id | string | No | - |
| production_deployment_status | string | No | - |
| production_deployment_timestamp | string | No | - |
| created_at | string | No | - |
| updated_at | string | No | - |
| last_updated_by | string | No | - |
| notes | string | No | - |
| tags | array | No | - |
| baseline_accuracy | number | No | - |
| trained_accuracy | number | No | - |
| improvement_percentage | number | No | - |

---

## recent_audit_activity

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | No | Note:
This is a Primary Key.<pk/> |
| user_id | string | No | - |
| user_email | string | No | - |
| action | string | No | - |
| resource_type | string | No | - |
| resource_id | string | No | - |
| discipline_code | string | No | - |
| ip_address | string | No | - |
| user_agent | string | No | - |
| success | boolean | No | - |
| error_message | string | No | - |
| metadata | unknown | No | - |
| created_at | string | No | - |

---

## template_customization_rules

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| template_category | string | Yes | - |
| customization_type | string | Yes | - |
| field_name | string | Yes | - |
| field_type | string | Yes | - |
| is_required | boolean | No | - |
| validation_rules | unknown | No | - |
| auto_populate_from | string | No | - |
| created_at | string | No | - |
| organization_id | string | No | - |
| user_id | string | No | - |

---

## page_permissions

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| page_path | string | Yes | - |
| role_id | integer | Yes | Note:
This is a Foreign Key to `role_definitions.id`.<fk table='role_definitions' column='id'/> |
| has_access | boolean | No | - |
| created_at | string | No | - |
| updated_at | string | No | - |
| created_by | string | No | - |
| updated_by | string | No | - |

---

## a_00885_dirhse_vector

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| embedding | string | No | - |
| metadata | unknown | No | - |
| content | string | No | - |
| created_by_user_id | integer | No | - |
| access_scope | string | No | - |
| organisation_id | integer | No | - |
| shared_with_disciplines | string | No | - |
| chunks | unknown | No | - |
| discipline_code | string | No | - |
| isolation_metadata | unknown | No | - |
| project_id | integer | No | - |
| workspace_id | integer | No | - |
| workspace_type | string | No | - |

---

## task_attachments

File attachments associated with tasks

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| task_id | string | Yes | Note:
This is a Foreign Key to `tasks.id`.<fk table='tasks' column='id'/> |
| filename | string | Yes | - |
| file_path | string | Yes | - |
| file_size | integer | No | - |
| mime_type | string | No | - |
| uploaded_by | string | Yes | - |
| created_at | string | No | - |

---

## a_02400_contractor_vetting_document_versions

Version history for contractor vetting documents

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| document_id | string | Yes | Reference to main document

Note:
This is a Foreign Key to `a_02400_contractor_vetting_documents.id`.<fk table='a_02400_contractor_vetting_documents' column='id'/> |
| version_number | integer | Yes | Version sequence number |
| file_path | string | Yes | - |
| uploaded_at | string | No | - |
| uploaded_by | string | No | - |
| changes_summary | string | No | Summary of changes in this version |
| created_at | string | No | - |
| updated_at | string | No | - |

---

## continual_learning_data

Stores HITL corrections for continual learning pipeline

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| instruction | string | Yes | The original user instruction/query |
| agent_output | string | No | The AI agent response that was corrected |
| human_correction | string | No | The corrected response from human feedback |
| quality_score | number | No | Quality score of the correction (0-1) |
| status | string | No | Processing status: pending, processing, completed, failed |
| project_id | string | No | - |
| discipline | string | No | - |
| created_at | string | No | - |
| processed_at | string | No | - |
| updated_at | string | No | - |
| training_session_id | string | No | Links to specific training session |
| model_version | string | No | Model version this data was used to train |
| error_message | string | No | - |

---

## record _manager

to manage records within the database

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | integer | Yes | Note:
This is a Primary Key.<pk/> |
| created_at | string | Yes | - |
| group_id | string | No | - |
| source_id_key | string | No | - |

---

## workspace_members

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| workspace_id | string | Yes | Note:
This is a Primary Key.<pk/>
This is a Foreign Key to `vector_workspaces.id`.<fk table='vector_workspaces' column='id'/> |
| user_id | string | Yes | Note:
This is a Primary Key.<pk/> |
| access_level | string | No | - |
| added_by | string | No | - |
| added_at | string | No | - |
| expires_at | string | No | - |

---

## project_templates

Project-specific template copies with auto-populated data from SOW

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| project_id | string | Yes | Note:
This is a Foreign Key to `projects.id`.<fk table='projects' column='id'/> |
| master_template_id | string | No | Note:
This is a Foreign Key to `master_templates.id`.<fk table='master_templates' column='id'/> |
| template_name | string | Yes | - |
| template_type | string | Yes | - |
| category | string | No | - |
| status | string | No | - |
| content | unknown | No | - |
| populated_data | unknown | No | - |
| sow_reference | string | No | Note:
This is a Foreign Key to `scope_of_work.id`.<fk table='scope_of_work' column='id'/> |
| auto_populated_at | string | No | - |
| reviewed_at | string | No | - |
| approved_at | string | No | - |
| executed_at | string | No | - |
| total_value | number | No | - |
| currency | string | No | - |
| vendor_id | string | No | - |
| contract_number | string | No | - |
| notes | string | No | - |
| priority | string | No | - |
| requires_technical_review | boolean | No | - |
| created_at | string | No | - |
| updated_at | string | No | - |
| form_template_id | string | No | - |
| customized_content | unknown | No | - |
| deployment_rules | unknown | No | - |
| deployed_to_doc_control | boolean | No | - |
| deployed_at | string | No | - |
| created_by | string | No | - |
| updated_by | string | No | - |

---

## a_00106_timesheet_vector

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | No | - |
| embedding | string | No | - |
| metadata | unknown | No | - |
| content | string | No | - |
| created_by_user_id | integer | No | - |
| access_scope | string | No | - |
| organisation_id | integer | No | - |
| shared_with_disciplines | unknown | No | - |

---

## document_analysis_feedback

Tracks AI learning from user corrections and feedback

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| user_id | string | Yes | - |
| original_analysis | unknown | No | - |
| user_correction | unknown | No | - |
| document_content | string | No | - |
| feedback_type | string | No | - |
| confidence_score | number | No | - |
| created_at | string | No | - |
| organization_id | string | No | - |

---

## task_messages

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| task_id | string | Yes | Note:
This is a Foreign Key to `tasks.id`.<fk table='tasks' column='id'/> |
| message | string | Yes | - |
| message_type | string | No | - |
| from_discipline | string | Yes | - |
| to_discipline | string | Yes | - |
| created_by | string | No | - |
| created_at | string | No | - |

---

## safety_template_dependencies

Relationships and dependencies between safety templates

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| parent_template_id | string | No | Note:
This is a Foreign Key to `safety_templates.id`.<fk table='safety_templates' column='id'/> |
| dependent_template_id | string | No | Note:
This is a Foreign Key to `safety_templates.id`.<fk table='safety_templates' column='id'/> |
| dependency_type | string | Yes | - |
| description | string | No | - |
| applies_to_sites | array | No | - |
| is_active | boolean | No | - |
| valid_from | string | No | - |
| valid_to | string | No | - |
| created_by | string | No | Note:
This is a Foreign Key to `user_management.user_id`.<fk table='user_management' column='user_id'/> |
| created_at | string | No | - |

---

## fuel_lubricants

✅ MASTER GUIDE COMPLIANT: Organization-isolated fuel/lubricants management
with creator ownership, audit trails, and approval workflow patterns.
Reference: procurement_templates table standard.

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| name | string | Yes | - |
| product_code | string | No | - |
| category | string | Yes | - |
| subtype | string | No | - |
| supplier_id | integer | No | Note:
This is a Foreign Key to `suppliers.id`.<fk table='suppliers' column='id'/> |
| supplier_name | string | No | - |
| supplier_contact | string | No | - |
| supplier_email | string | No | - |
| viscosity | string | No | - |
| viscosity_class | string | No | - |
| grade | string | No | - |
| specification_standard | string | No | - |
| specifications | unknown | No | JSON object containing detailed technical specifications |
| current_stock_quantity | number | No | - |
| minimum_stock_level | number | No | - |
| maximum_stock_level | number | No | - |
| unit_of_measure | string | No | - |
| reorder_quantity | number | No | - |
| quality_status | string | No | - |
| compliance_certificate | string | No | - |
| batch_number | string | No | - |
| expiry_date | string | No | - |
| production_date | string | No | - |
| purchase_price | number | No | - |
| selling_price | number | No | - |
| purchase_date | string | No | - |
| purchase_order_number | string | No | - |
| invoice_number | string | No | - |
| consumption_rate | number | No | - |
| last_used_date | string | No | - |
| total_consumed | number | No | - |
| approval_status | string | No | - |
| approved_by | string | No | - |
| approval_date | string | No | - |
| rejection_reason | string | No | - |
| equipment_assigned | unknown | No | JSON array of equipment IDs compatible with this fuel/lubricant |
| project_assigned | string | No | - |
| storage_location | string | No | - |
| storage_temperature | string | No | - |
| storage_conditions | string | No | - |
| scheduled_changes | unknown | No | JSON object with change schedules and reminders |
| last_change_date | string | No | - |
| change_frequency_days | integer | No | - |
| hazard_classification | string | No | - |
| sds_url | string | No | - |
| environmental_impact | string | No | - |
| created_at | string | No | - |
| updated_at | string | No | - |
| created_by | string | No | - |
| updated_by | string | No | - |
| active | boolean | No | - |
| archived | boolean | No | - |
| critical_item | boolean | No | - |
| organization_id | string | No | - |

---

## technical_document_categories

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| category_code | string | Yes | - |
| category_name | string | Yes | - |
| category_description | string | No | - |
| discipline | string | Yes | - |
| document_type | string | Yes | - |
| template_count | integer | No | - |
| is_active | boolean | No | - |
| sort_order | integer | No | - |
| created_at | string | No | - |
| updated_at | string | No | - |

---

## document_routing_history

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | integer | Yes | Note:
This is a Primary Key.<pk/> |
| workflow_id | integer | No | Note:
This is a Foreign Key to `document_routing_workflows.id`.<fk table='document_routing_workflows' column='id'/> |
| document_id | string | No | Note:
This is a Foreign Key to `a_00900_doccontrol_documents.id`.<fk table='a_00900_doccontrol_documents' column='id'/> |
| version_id | integer | No | Note:
This is a Foreign Key to `a_00900_doccontrol_document_versions.id`.<fk table='a_00900_doccontrol_document_versions' column='id'/> |
| action_type | string | Yes | - |
| action_description | string | No | - |
| actor_id | string | No | Note:
This is a Foreign Key to `user_management.user_id`.<fk table='user_management' column='user_id'/> |
| actor_role | string | No | - |
| old_status | string | No | - |
| new_status | string | No | - |
| step_name | string | No | - |
| action_metadata | unknown | No | - |
| created_at | string | No | - |

---

## document_embeddings

Direct embeddings storage bypassing Flowise document store system

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | integer | Yes | Note:
This is a Primary Key.<pk/> |
| content | string | Yes | - |
| embedding | string | No | Vector embedding (1536 dimensions for OpenAI text-embedding-ada-002) |
| metadata | unknown | No | JSON metadata including pagePrefix, discipline, security level, etc. |
| source | string | No | - |
| page | integer | No | - |
| section | string | No | - |
| chunk_id | string | No | - |
| created_at | string | No | - |
| updated_at | string | No | - |
| document_store_id | string | No | UUID reference to document_stores table for department routing

Note:
This is a Foreign Key to `document_stores.id`.<fk table='document_stores' column='id'/> |
| discipline_code | string | No | Page prefix/discipline code for department-specific routing |
| flowise_store_id | string | No | Flowise store ID for integration when available |

---

## user_discipline_access

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| user_id | string | Yes | Note:
This is a Foreign Key to `user_management.user_id`.<fk table='user_management' column='user_id'/> |
| organization_id | string | No | Note:
This is a Foreign Key to `organizations.id`.<fk table='organizations' column='id'/> |
| discipline_code | string | Yes | - |
| access_level | string | No | - |
| is_active | boolean | No | - |
| created_at | string | No | - |
| created_by | string | No | Note:
This is a Foreign Key to `user_management.user_id`.<fk table='user_management' column='user_id'/> |
| updated_at | string | No | - |
| updated_by | string | No | Note:
This is a Foreign Key to `user_management.user_id`.<fk table='user_management' column='user_id'/> |

---

## logistics_alerts

System-generated alerts and notifications

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| alert_type | string | Yes | - |
| severity | string | Yes | - |
| shipment_id | string | No | Note:
This is a Foreign Key to `logistics_shipments.id`.<fk table='logistics_shipments' column='id'/> |
| vessel_id | string | No | Note:
This is a Foreign Key to `vessels.id`.<fk table='vessels' column='id'/> |
| container_id | string | No | Note:
This is a Foreign Key to `containers.id`.<fk table='containers' column='id'/> |
| alert_title | string | Yes | - |
| alert_description | string | No | - |
| alert_timestamp | string | No | - |
| status | string | No | - |
| acknowledged_at | string | No | - |
| acknowledged_by | string | No | - |
| resolved_at | string | No | - |
| resolved_by | string | No | - |
| action_required | boolean | No | - |
| action_description | string | No | - |
| due_date | string | No | - |
| created_at | string | No | - |
| updated_at | string | No | - |
| company_id | string | No | - |
| organisation_id | string | No | - |
| project_id | string | No | - |
| organization_id | string | No | - |
| user_id | string | No | - |

---

## a_00880_boarddir_vector

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| embedding | string | No | - |
| metadata | unknown | No | - |
| content | string | No | - |
| created_by_user_id | integer | No | - |
| access_scope | string | No | - |
| organisation_id | integer | No | - |
| shared_with_disciplines | string | No | - |
| chunks | unknown | No | - |
| discipline_code | string | No | - |
| isolation_metadata | unknown | No | - |
| project_id | integer | No | - |
| workspace_id | integer | No | - |
| workspace_type | string | No | - |

---

## a_00884_1_dirfinance_vector

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| embedding | string | No | - |
| metadata | unknown | No | - |
| content | string | No | - |
| created_by_user_id | integer | No | - |
| access_scope | string | No | - |
| organisation_id | integer | No | - |
| shared_with_disciplines | string | No | - |

---

## a_00877_sundry_vector

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| embedding | string | No | - |
| metadata | unknown | No | - |
| content | string | No | - |
| created_by_user_id | integer | No | - |
| access_scope | string | No | - |
| organisation_id | integer | No | - |
| shared_with_disciplines | string | No | - |
| chunks | unknown | No | - |
| discipline_code | string | No | - |
| isolation_metadata | unknown | No | - |
| project_id | integer | No | - |
| workspace_id | integer | No | - |
| workspace_type | string | No | - |

---

## timesheets

Timesheet entries for employee work hours tracking

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| employee_id | string | Yes | Employee who owns this timesheet entry

Note:
This is a Foreign Key to `user_management.user_id`.<fk table='user_management' column='user_id'/> |
| date | string | Yes | Date of the work |
| hours | number | Yes | Hours worked on this date |
| project | string | Yes | Project associated with this work |
| task | string | No | Task associated with this work |
| client | string | No | Client associated with this work |
| comments | string | No | Comments about this work |
| currency | string | No | Currency for any monetary values |
| status | string | No | Status of this timesheet entry |
| template_id | string | No | Template used to create this entry |
| approved_by | string | No | User who approved this entry

Note:
This is a Foreign Key to `user_management.user_id`.<fk table='user_management' column='user_id'/> |
| approved_at | string | No | When this entry was approved |
| created_at | string | No | - |
| updated_at | string | No | - |
| locked | boolean | No | Whether this entry is locked from editing |
| locked_at | string | No | When this entry was locked |
| user_id | string | No | - |
| organization_id | string | No | - |

---

## customized

App-wide dropdown options shared across multiple modals

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| dropdown_id | string | Yes | - |
| options | string | Yes | - |
| created_at | string | No | - |
| updated_at | string | No | - |

---

## button_options

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | integer | Yes | Note:
This is a Primary Key.<pk/> |
| name | string | Yes | - |
| button_id | string | Yes | - |
| page_id | string | Yes | - |
| display_order | integer | Yes | - |
| is_active | boolean | No | - |
| created_at | string | No | - |
| updated_at | string | No | - |

---

## flowise_record_manager

Record Manager table for Flowise Document Store to track document chunks and prevent duplicates

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| uuid | string | Yes | Primary key UUID

Note:
This is a Primary Key.<pk/> |
| key | string | Yes | Unique identifier for the document chunk (typically hash of content + metadata) |
| group_id | string | No | Group identifier for related documents (e.g., document store ID or page prefix) |
| updated_at | string | No | Timestamp when the record was last updated |
| created_at | string | No | Timestamp when the record was created |
| metadata | unknown | No | Additional metadata about the document chunk |

---

## resource_documentation

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| resource_id | string | Yes | - |
| resource_type | string | Yes | - |
| storage_service | string | Yes | - |
| storage_url | string | Yes | - |
| document_id | string | Yes | - |
| sections | unknown | Yes | - |
| created_at | string | No | - |
| organization_id | string | No | - |
| user_id | string | No | - |

---

## document_stores

Logical grouping for documents to be managed and upserted via Flowise

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| name | string | Yes | Unique name for the document store |
| description | string | No | Human-readable description of the store purpose |
| created_at | string | No | - |
| updated_at | string | No | - |
| metadata | unknown | No | Additional configuration and metadata for the store |
| is_active | boolean | No | Whether this store is currently active for new documents |
| flowise_id | string | No | - |
| discipline_code | string | No | - |
| security_level | string | No | - |
| access_roles | unknown | No | - |
| store_type | string | No | - |
| doc_id | string | No | - |
| organization_id | string | No | - |
| user_id | string | No | - |

---

## ai_training_data

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| discipline_code | string | Yes | - |
| instruction | string | Yes | - |
| input | string | No | - |
| output | string | Yes | - |
| quality_score | number | No | - |
| training_status | string | No | - |
| created_at | string | No | - |
| updated_at | string | No | - |
| created_by | string | No | - |
| reviewed_by | string | No | - |
| metadata | unknown | No | - |
| status | string | No | - |
| processed_at | string | No | - |
| human_correction | string | No | - |
| agent_output | string | No | - |

---

## user_organization_access

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| user_id | string | Yes | - |
| organization_id | string | Yes | - |
| is_primary | boolean | No | - |
| created_at | string | No | - |

---

## chat_messages

Stores individual chat messages with AI processing metadata

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| session_id | string | No | Note:
This is a Foreign Key to `chat_sessions.id`.<fk table='chat_sessions' column='id'/> |
| role | string | Yes | - |
| content | string | Yes | - |
| citations | unknown | No | - |
| document_count | integer | No | - |
| documents_accessed | unknown | No | - |
| ai_model_used | string | No | - |
| processing_time_ms | integer | No | - |
| token_count | integer | No | - |
| search_query | string | No | - |
| search_results_count | integer | No | - |
| vector_similarity_scores | unknown | No | - |
| user_rating | integer | No | - |
| user_feedback | string | No | - |
| was_helpful | boolean | No | - |
| created_at | string | No | - |
| metadata | unknown | No | - |

---

## progress_logs

Comprehensive audit trail of all workflow progress updates

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| order_id | string | Yes | - |
| progress_data | unknown | Yes | - |
| created_at | string | No | - |
| organization_id | string | No | - |
| user_id | string | No | - |
| agent_id | string | No | - |
| operation | string | No | - |
| status | string | No | - |
| message | string | No | - |

---

## logistics_approval_workflows

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| document_id | string | No | Note:
This is a Foreign Key to `logistics_documents.id`.<fk table='logistics_documents' column='id'/> |
| workflow_type | string | Yes | - |
| current_step | string | Yes | - |
| status | string | No | - |
| priority | string | No | - |
| assigned_to | string | No | - |
| assigned_at | string | No | - |
| due_date | string | No | - |
| escalation_level | integer | No | - |
| created_at | string | No | - |
| updated_at | string | No | - |

---

## contractor_vetting_dashboard_stats

Dashboard statistics for contractor vetting

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | integer | Yes | Note:
This is a Primary Key.<pk/> |
| stat_date | string | No | Date for which statistics are recorded |
| total_contractors | integer | No | Total number of contractors in system |
| average_score | integer | No | Average vetting score |
| high_scores_count | integer | No | Count of contractors with high scores (85+) |
| pending_reviews_count | integer | No | Count of pending reviews |
| created_at | string | No | - |
| updated_at | string | No | - |
| organization_id | string | No | Note:
This is a Foreign Key to `organizations.id`.<fk table='organizations' column='id'/> |

---

## approval_workflow_templates

Governance-managed approval workflow templates for different document types

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| name | string | Yes | - |
| department | string | Yes | - |
| document_type | string | Yes | - |
| approval_matrix | unknown | Yes | JSONB containing the complete approval routing rules |
| conditions | unknown | No | JSONB containing conditional routing logic (amount thresholds, etc.) |
| requires_esignature | boolean | No | - |
| escalation_hours | integer | No | - |
| is_active | boolean | No | - |
| created_by | string | No | - |
| updated_by | string | No | - |
| created_at | string | No | - |
| updated_at | string | No | - |

---

## email_vector

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| embedding | string | Yes | - |
| metadata | unknown | No | - |
| content | string | No | - |

---

## project_template_preparation

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| project_id | string | Yes | Note:
This is a Primary Key.<pk/>
This is a Foreign Key to `projects.id`.<fk table='projects' column='id'/> |
| prepared_at | string | No | - |
| prepared_by | string | No | - |
| disciplines_prepared | array | No | - |
| total_templates | integer | No | - |
| status | string | No | - |
| agent_notifications_sent | boolean | No | - |
| created_at | string | No | - |
| updated_at | string | No | - |

---

## cv_applications

Stores CV/job application data for HR CV Processing system

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| applicant_name | string | Yes | - |
| email | string | Yes | - |
| phone | string | No | - |
| position_applied | string | Yes | - |
| status | string | Yes | Application status: pending, under_review, interview_scheduled, approved, rejected, on_hold |
| years_experience | integer | No | - |
| education_level | string | No | - |
| skills | array | No | Array of candidate skills and competencies |
| certifications | array | No | Professional certifications data |
| salary_expectation | number | No | - |
| currency | string | No | - |
| availability_date | string | No | - |
| employment_type | string | No | Type of employment: full_time, part_time, contract, freelance, internship |
| location | string | No | - |
| remote_work_preference | string | No | Remote work preference: on_site, remote, hybrid |
| cv_file_url | string | No | - |
| cover_letter_url | string | No | - |
| portfolio_url | string | No | - |
| additional_documents_urls | array | No | - |
| interview_stage | string | No | - |
| interview_date | string | No | Scheduled interview date |
| interview_notes | string | No | - |
| interviewer_id | string | No | - |
| technical_score | integer | No | - |
| communication_score | integer | No | - |
| culture_fit_score | integer | No | - |
| overall_rating | number | No | - |
| hr_notes | string | No | - |
| feedback | string | No | - |
| rejection_reason | string | No | - |
| application_source | string | No | - |
| referral_source | string | No | - |
| priority_level | string | No | Priority level for processing: low, normal, high, urgent |
| created_at | string | No | - |
| updated_at | string | No | - |
| applied_date | string | No | - |
| last_contact_date | string | No | - |
| created_by | string | No | - |
| updated_by | string | No | - |
| organization_id | string | No | - |
| additional_info | unknown | No | Additional flexible information stored as JSON |
| custom_fields | unknown | No | Custom fields for organization-specific data |
| discipline | string | No | Applicant's discipline or department (formerly department) |
| address | string | No | - |
| scoring_details | unknown | No | - |
| analysis_type | string | No | - |
| analysis_timestamp | string | No | - |
| original_notes | string | No | - |
| openai_feedback | string | No | AI-generated feedback |
| date_of_birth | string | No | Candidate date of birth |
| professional_summary | string | No | Professional summary from CV |
| work_experience | unknown | No | Structured work history data |
| education | unknown | No | Education history data |
| projects | unknown | No | Key projects from resume |
| extracted_emails | string | No | - |
| extracted_phones | string | No | - |
| application_date | string | No | When the application was submitted |
| linkedin | string | No | - |
| cv_file | string | No | - |
| availability | string | No | Available start date or notice period |
| cover_letter | string | No | Cover letter content if provided |
| experience_level | string | No | Entry, mid, or senior level |
| notes | string | No | - |
| rating | number | No | - |
| opennai_feedback | string | No | OpenAI feedback (typo from CV processing code) |

---

## credential_rotation_logs

Audit trail for API credential rotation activities

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| api_config_id | string | Yes | - |
| rotation_type | string | Yes | - |
| old_key_hash | string | No | - |
| new_key_hash | string | No | - |
| rotated_by | string | No | - |
| rotated_at | string | Yes | - |
| reason | string | No | - |
| success | boolean | Yes | - |
| error_message | string | No | - |
| metadata | unknown | No | - |

---

## a_00860_eleceng_vector

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| embedding | string | No | - |
| metadata | unknown | No | - |
| content | string | No | - |
| created_by_user_id | integer | No | - |
| access_scope | string | No | - |
| organisation_id | integer | No | - |
| shared_with_disciplines | string | No | - |
| chunks | unknown | No | - |
| discipline_code | string | No | - |
| isolation_metadata | unknown | No | - |
| project_id | integer | No | - |
| workspace_id | integer | No | - |
| workspace_type | string | No | - |

---

## v_financial_summary

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| type | string | No | - |
| status | string | No | - |
| record_count | integer | No | - |
| total_amount | number | No | - |
| avg_amount | number | No | - |
| min_amount | number | No | - |
| max_amount | number | No | - |
| categories | string | No | - |
| earliest_date | string | No | - |
| latest_date | string | No | - |

---

## a_00435_contracts_post_vector

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| embedding | string | No | - |
| metadata | unknown | No | - |
| content | string | No | - |
| organisation_id | string | No | - |
| project_id | string | No | - |
| project_phase_assignment_id | string | No | - |
| isolation_metadata | unknown | No | - |
| created_by_user_id | string | No | - |
| access_scope | string | No | - |
| shared_with_disciplines | array | No | - |
| workspace_id | string | No | - |
| workspace_type | string | No | - |
| deleted_at | string | No | - |
| deleted_by | string | No | - |
| deletion_reason | string | No | - |
| scheduled_hard_delete_at | string | No | - |
| chunks | unknown | No | - |
| discipline_code | string | No | - |

---

## training_pipeline_dashboard

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| discipline_code | string | No | - |
| discipline_name | string | No | - |
| training_examples_count | integer | No | - |
| local_scan_status | string | No | - |
| hf_upload_status | string | No | - |
| runpod_training_status | string | No | - |
| production_deployment_status | string | No | - |
| training_duration_hours | number | No | - |
| estimated_cost_usd | number | No | - |
| improvement_percentage | number | No | - |
| updated_at | string | No | - |
| pipeline_status | string | No | - |

---

## operations_equipment

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| name | string | Yes | - |
| type | string | Yes | - |
| specifications | unknown | No | - |
| created_at | string | No | - |
| updated_at | string | No | - |
| organization_id | string | No | - |
| user_id | string | No | - |

---

## document_hashes

Table for storing document content hashes to prevent duplication during ingestion

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Unique identifier for each hash record

Note:
This is a Primary Key.<pk/> |
| doc_id | string | Yes | Reference to the document this hash belongs to |
| version | string | Yes | Version of the document (semver-like format) |
| hash | string | Yes | SHA-256 hash of document content |
| chunk_id | string | No | Identifier for document chunk (if applicable) |
| timestamp | string | No | Timestamp when hash was created |
| source_path | string | No | Original path of the document source |
| department_id | string | No | Department associated with this document |

---

## inspection_media

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | integer | Yes | Note:
This is a Primary Key.<pk/> |
| media_id | string | Yes | - |
| inspection_id | string | No | - |
| inspection_item_id | string | No | - |
| defect_id | string | No | - |
| file_name | string | Yes | - |
| file_type | string | Yes | - |
| file_size | integer | No | - |
| file_url | string | Yes | - |
| storage_path | string | No | - |
| description | string | No | - |
| tags | unknown | No | - |
| uploaded_by | string | No | - |
| upload_date | string | No | - |
| created_at | string | No | - |
| updated_at | string | No | - |
| organization_id | string | No | Note:
This is a Foreign Key to `organizations.id`.<fk table='organizations' column='id'/> |

---

## template_variation_sequences

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| organization_id | string | No | Note:
This is a Foreign Key to `organizations.id`.<fk table='organizations' column='id'/> |
| discipline_code | string | Yes | - |
| template_variation | string | Yes | - |
| variation_name | string | Yes | - |
| description | string | No | - |
| complexity_level | string | Yes | - |
| sequence_definition | unknown | Yes | - |
| parallel_groups | unknown | No | - |
| dependencies | unknown | No | - |
| estimated_duration_minutes | integer | No | - |
| estimated_duration_display | string | No | - |
| appendices_included | unknown | No | - |
| skip_tasks | unknown | No | - |
| business_rules | unknown | No | - |
| is_default | boolean | No | - |
| is_active | boolean | No | - |
| created_by | string | No | - |
| updated_by | string | No | - |
| created_at | string | No | - |
| updated_at | string | No | - |

---

## inspection_items

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | integer | Yes | Note:
This is a Primary Key.<pk/> |
| inspection_id | string | Yes | Note:
This is a Foreign Key to `inspections.inspection_id`.<fk table='inspections' column='inspection_id'/> |
| item_id | string | Yes | - |
| item_type | string | Yes | - |
| description | string | No | - |
| location | string | No | - |
| status | string | No | - |
| priority | string | No | - |
| assigned_to | string | No | - |
| due_date | string | No | - |
| completed_date | string | No | - |
| notes | string | No | - |
| media_urls | unknown | No | - |
| created_at | string | No | - |
| updated_at | string | No | - |
| organization_id | string | No | - |
| user_id | string | No | - |

---

## external_api_configurations

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| api_name | string | Yes | - |
| api_type | string | Yes | - |
| endpoint_url | string | Yes | - |
| api_key | string | Yes | - |
| organization_id | string | No | - |
| is_active | boolean | No | - |
| description | string | No | - |
| metadata | unknown | No | - |
| created_at | string | No | - |
| updated_at | string | No | - |

---

## a_02025_invoice_processing

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| invoice_no | string | Yes | - |
| amount | number | Yes | - |
| due_date | string | Yes | - |
| supplier_name | string | Yes | - |
| category | string | No | - |
| company | string | No | - |
| project | string | No | - |
| contract_type | string | No | - |
| contractor | string | No | - |
| contract | string | No | - |
| created_at | string | No | - |
| updated_at | string | No | - |
| description | string | No | - |

---

## user_companies

Maps users to their assigned companies

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| user_id | string | Yes | Note:
This is a Primary Key.<pk/> |
| company_id | integer | Yes | Note:
This is a Primary Key.<pk/> |
| created_at | string | No | - |
| organization_id | string | No | - |

---

## travel_ground_routes

List of ground routes for travel routing

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| name | string | Yes | - |
| type | string | Yes | - |
| hazards | array | No | - |
| created_at | string | No | - |
| updated_at | string | No | - |
| organization_id | string | No | - |
| user_id | string | No | - |

---

## ports

Reference table for ports and terminals

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| port_code | string | Yes | - |
| port_name | string | Yes | - |
| country_code | string | No | - |
| country_name | string | No | - |
| latitude | number | No | - |
| longitude | number | No | - |
| time_zone | string | No | - |
| port_type | string | No | - |
| facilities | array | No | - |
| max_vessel_length | number | No | - |
| max_vessel_beam | number | No | - |
| max_draft | number | No | - |
| working_hours | string | No | - |
| customs_hours | string | No | - |
| services | array | No | - |
| created_at | string | No | - |
| updated_at | string | No | - |
| is_active | boolean | No | - |
| organization_id | string | No | - |
| user_id | string | No | - |

---

## supplier_verifications

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| supplier_id | integer | No | Note:
This is a Foreign Key to `suppliers.id`.<fk table='suppliers' column='id'/> |
| source_id | string | No | Note:
This is a Foreign Key to `integration_sources.id`.<fk table='integration_sources' column='id'/> |
| external_supplier_id | string | Yes | - |
| source_system | string | Yes | - |
| verification_data | unknown | Yes | - |
| verification_status | string | No | - |
| bbbee_level | string | No | - |
| tax_compliant | boolean | No | - |
| bbbee_compliant | boolean | No | - |
| cidb_registered | boolean | No | - |
| expiry_date | string | No | - |
| last_verified_at | string | No | - |
| verification_certificate_url | string | No | - |
| created_at | string | No | - |
| updated_at | string | No | - |

---

## approval_history_log

Complete audit trail of all approval actions

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| approval_instance_id | string | No | Note:
This is a Foreign Key to `approval_instances.id`.<fk table='approval_instances' column='id'/> |
| approval_step_id | string | No | Note:
This is a Foreign Key to `approval_steps.id`.<fk table='approval_steps' column='id'/> |
| action | string | Yes | - |
| actor_user_id | string | No | - |
| target_user_id | string | No | - |
| old_values | unknown | No | - |
| new_values | unknown | No | - |
| comments | string | No | - |
| ip_address | string | No | - |
| user_agent | string | No | - |
| created_at | string | No | - |

---

## field_attribute_compliance

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| template_id | string | No | Note:
This is a Foreign Key to `procurement_templates.id`.<fk table='procurement_templates' column='id'/> |
| procurement_order_id | string | No | Note:
This is a Foreign Key to `procurement_orders.id`.<fk table='procurement_orders' column='id'/> |
| field_name | string | No | - |
| attribute_type | string | No | - |
| ai_action_taken | string | No | - |
| confidence_score | number | No | - |
| user_override | boolean | No | - |
| enforcement_timestamp | string | No | - |
| workflow_execution_id | string | No | - |
| organization_id | string | No | Note:
This is a Foreign Key to `organizations.id`.<fk table='organizations' column='id'/> |

---

## approval_steps

Individual approval steps within an approval workflow

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| approval_instance_id | string | No | Note:
This is a Foreign Key to `approval_instances.id`.<fk table='approval_instances' column='id'/> |
| step_order | integer | Yes | - |
| step_name | string | No | - |
| approver_role | string | Yes | - |
| approver_user_id | string | No | - |
| assigned_at | string | No | - |
| status | string | No | - |
| decision_date | string | No | - |
| comments | string | No | - |
| rejection_reason | string | No | - |
| esignature_data | unknown | No | JSONB containing encrypted e-signature metadata |
| escalation_date | string | No | - |
| escalated_at | string | No | - |
| escalated_to | string | No | - |
| is_required | boolean | No | - |
| is_parallel | boolean | No | - |
| created_at | string | No | - |
| updated_at | string | No | - |

---

## travel_templates

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| user_id | string | No | - |
| name | string | Yes | - |
| purpose | string | No | - |
| destination | string | No | - |
| travelers | array | No | - |
| transport_mode | string | No | - |
| domestic_transport | string | No | - |
| international_transport | string | No | - |
| project_transport | string | No | - |
| accommodation | string | No | - |
| special_requirements | string | No | - |
| citizenship | string | No | - |
| security_clearance | string | No | - |
| frequent_traveler | boolean | No | - |
| frequent_flyer_numbers | array | No | - |
| project_site | string | No | - |
| visa_required | boolean | No | - |
| visa_check_completed | boolean | No | - |
| departure_location | string | No | - |
| arrival_location | string | No | - |
| route_preferences | array | No | - |
| flight_segments | unknown | No | - |
| has_return_leg | boolean | No | - |
| return_segments | unknown | No | - |
| created_at | string | No | - |
| updated_at | string | No | - |
| health_check_required | boolean | No | - |
| health_check_passed | boolean | No | - |
| organization_id | string | No | - |

---

## document_numbering_sequences

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| document_type_id | string | No | Note:
This is a Foreign Key to `document_types_by_discipline.id`.<fk table='document_types_by_discipline' column='id'/> |
| sequence_key | string | Yes | - |
| current_number | integer | No | - |
| last_generated_at | string | No | - |
| created_at | string | No | - |

---

## schema_migrations

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| version | integer | Yes | Note:
This is a Primary Key.<pk/> |
| applied_at | string | No | - |
| description | string | No | - |

---

## compliance_checks

Compliance monitoring results for various regulatory frameworks

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| check_type | string | Yes | - |
| resource_type | string | Yes | - |
| resource_id | string | No | - |
| status | string | Yes | - |
| check_result | unknown | Yes | - |
| checked_by | string | No | - |
| checked_at | string | Yes | - |
| next_check_at | string | No | - |
| remediation_required | boolean | Yes | - |
| remediation_notes | string | No | - |
| metadata | unknown | No | - |

---

## a_01300_governance_vector

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| embedding | string | No | - |
| metadata | unknown | No | - |
| content | string | No | - |
| created_by_user_id | integer | No | - |
| access_scope | string | No | - |
| organisation_id | integer | No | - |
| shared_with_disciplines | string | No | - |
| chunks | unknown | No | - |
| discipline_code | string | No | - |
| isolation_metadata | unknown | No | - |
| project_id | integer | No | - |
| workspace_id | integer | No | - |
| workspace_type | string | No | - |

---

## travel_requests

Travel requests submitted by users

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| user_id | string | No | User who submitted the request |
| purpose | string | Yes | Purpose of the travel |
| destination | string | Yes | Travel destination |
| start_date | string | Yes | Start date of travel |
| end_date | string | Yes | End date of travel |
| travelers | array | No | List of travelers |
| transport_mode | string | Yes | Type of transport (domestic, international, project-specific) |
| domestic_transport | string | No | Specific domestic transport type |
| international_transport | string | No | Specific international transport type |
| project_transport | string | No | Specific project transport type |
| accommodation | string | No | Accommodation details |
| special_requirements | string | No | Special requirements for the trip |
| citizenship | string | No | Citizenship of the traveler |
| security_clearance | string | No | Security clearance level |
| frequent_traveler | boolean | No | Whether the user is a frequent traveler |
| frequent_flyer_numbers | array | No | Frequent flyer numbers |
| project_site | string | No | Project site location |
| visa_required | boolean | No | Whether a visa is required |
| visa_check_completed | boolean | No | Whether visa check is completed |
| departure_location | string | No | Departure location |
| arrival_location | string | No | Arrival location |
| route_preferences | array | No | Preferred routes and equipment |
| status | string | No | Request status (pending, approved, rejected) |
| submitted_at | string | No | When the request was submitted |
| approved_at | string | No | When the request was approved |
| created_at | string | No | - |
| updated_at | string | No | - |
| flight_segments | unknown | No | - |
| has_return_leg | boolean | No | - |
| return_segments | unknown | No | - |
| health_check_required | boolean | No | - |
| health_check_passed | boolean | No | - |
| organization_id | string | No | - |

---

## user_project_assignments

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| user_id | string | Yes | - |
| project_id | string | Yes | Note:
This is a Foreign Key to `projects.id`.<fk table='projects' column='id'/> |
| assigned_role | string | Yes | - |
| phases_access | unknown | No | - |
| assigned_by | string | No | - |
| assigned_at | string | No | - |
| expires_at | string | No | - |
| is_active | boolean | No | - |
| created_at | string | No | - |
| updated_at | string | No | - |

---

## personnel_records

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| user_id | string | No | - |
| employee_id | string | No | - |
| department | string | No | - |
| position | string | No | - |
| hire_date | string | No | - |
| termination_date | string | No | - |
| manager_id | string | No | - |
| salary | number | No | - |
| employment_type | string | No | - |
| location | string | No | - |
| phone | string | No | - |
| emergency_contact_name | string | No | - |
| emergency_contact_phone | string | No | - |
| created_at | string | No | - |
| updated_at | string | No | - |
| organization_id | string | No | - |

---

## a_02100_publicrel_vector

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| embedding | string | No | - |
| metadata | unknown | No | - |
| content | string | No | - |
| created_by_user_id | integer | No | - |
| access_scope | string | No | - |
| organisation_id | integer | No | - |
| shared_with_disciplines | string | No | - |
| chunks | unknown | No | - |
| discipline_code | string | No | - |
| isolation_metadata | unknown | No | - |
| project_id | integer | No | - |
| workspace_id | integer | No | - |
| workspace_type | string | No | - |

---

## a_00900_user_langchain_settings

Stores user-specific LangChain configuration settings

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| user_id | string | Yes | - |
| organization_id | string | No | - |
| llm_provider | string | No | - |
| llm_model | string | No | - |
| llm_api_key_encrypted | string | No | - |
| llm_base_url | string | No | - |
| llm_temperature | number | No | - |
| llm_max_tokens | integer | No | - |
| llm_timeout | integer | No | - |
| embedding_provider | string | No | - |
| embedding_model | string | No | - |
| embedding_api_key_encrypted | string | No | - |
| embedding_base_url | string | No | - |
| embedding_dimensions | integer | No | - |
| embedding_batch_size | integer | No | - |
| text_chunk_size | integer | No | - |
| text_chunk_overlap | integer | No | - |
| text_separators | unknown | No | - |
| text_keep_separator | boolean | No | - |
| text_length_function | string | No | - |
| enable_embeddings | boolean | No | - |
| enable_summarization | boolean | No | - |
| enable_keyword_extraction | boolean | No | - |
| enable_entity_extraction | boolean | No | - |
| batch_processing | boolean | No | - |
| max_concurrent_jobs | integer | No | - |
| retry_attempts | integer | No | - |
| retry_delay | integer | No | - |
| langsmith_enabled | boolean | No | - |
| langsmith_api_key_encrypted | string | No | - |
| langsmith_project_name | string | No | - |
| langsmith_endpoint | string | No | - |
| langsmith_tracing_enabled | boolean | No | - |
| langsmith_evaluation_enabled | boolean | No | - |
| vector_store_provider | string | No | - |
| vector_store_connection_string_encrypted | string | No | - |
| vector_store_table_name | string | No | - |
| created_at | string | No | - |
| updated_at | string | No | - |

---

## rate_limits

Rate limiting data to prevent abuse and ensure fair usage

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| user_id | string | Yes | - |
| api_config_id | string | No | - |
| discipline_code | string | No | - |
| limit_type | string | Yes | - |
| request_count | integer | Yes | - |
| limit_value | integer | Yes | - |
| window_start | string | Yes | - |
| window_end | string | Yes | - |
| blocked_until | string | No | - |
| metadata | unknown | No | - |
| created_at | string | Yes | - |
| updated_at | string | Yes | - |

---

## v_document_types_lookup

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | No | Note:
This is a Primary Key.<pk/> |
| document_type_code | string | No | - |
| document_type | string | No | - |
| numbering_pattern | string | No | - |
| description | string | No | - |
| discipline_code | string | No | - |
| discipline_name | string | No | - |
| company_id | string | No | Note:
This is a Foreign Key to `companies.id`.<fk table='companies' column='id'/> |

---

## sql_file_tracking

Tracks SQL files and their corresponding Supabase table versions

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| file_path | string | Yes | Note:
This is a Primary Key.<pk/> |
| supabase_table | string | Yes | - |
| last_validated | string | No | - |
| schema_hash | string | Yes | - |

---

## tenders

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| tender_number | string | Yes | - |
| title | string | Yes | - |
| description | string | No | - |
| tender_type | string | Yes | - |
| procurement_method | string | Yes | - |
| status | string | Yes | - |
| priority | string | Yes | - |
| estimated_value | number | No | - |
| currency | string | No | - |
| budget_allocated | number | No | - |
| issue_date | string | Yes | - |
| pre_bid_meeting_date | string | No | - |
| bid_submission_deadline | string | Yes | - |
| bid_opening_date | string | No | - |
| evaluation_completion_date | string | No | - |
| award_date | string | No | - |
| contract_start_date | string | No | - |
| contract_end_date | string | No | - |
| location | string | No | - |
| scope_of_work | string | No | - |
| technical_specifications | string | No | - |
| evaluation_criteria | string | No | - |
| procurement_officer_id | string | No | - |
| project_id | string | No | - |
| department_id | string | No | - |
| approval_status | string | No | - |
| approval_workflow_id | string | No | - |
| current_approval_level | integer | No | - |
| number_of_bids | integer | No | - |
| awarded_supplier_id | string | No | - |
| awarded_supplier_name | string | No | - |
| contract_value | number | No | - |
| created_by | string | No | - |
| created_at | string | No | - |
| updated_by | string | No | - |
| updated_at | string | No | - |
| version | integer | No | - |
| eligibility_requirements | string | No | - |
| bid_security_amount | number | No | - |
| bid_security_currency | string | No | - |
| performance_security_percentage | number | No | - |
| payment_terms | string | No | - |
| delivery_timeline | string | No | - |
| warranty_requirements | string | No | - |
| tender_document_url | string | No | - |
| addendum_urls | unknown | No | - |
| clarification_responses | unknown | No | - |
| compliance_requirements | string | No | - |
| legal_requirements | string | No | - |
| is_active | boolean | No | - |
| tags | array | No | - |
| notes | string | No | - |
| organization_id | string | No | Note:
This is a Foreign Key to `organizations.id`.<fk table='organizations' column='id'/> |

---

## path_configurations

Template configurations for generating document storage paths per organization

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| organization_id | string | No | Note:
This is a Foreign Key to `organizations.id`.<fk table='organizations' column='id'/> |
| name | string | Yes | - |
| components | unknown | Yes | JSON array defining path structure with placeholders for dynamic values |
| is_default | boolean | No | Whether this is the default path configuration for the organization |
| created_by | string | No | - |
| created_at | string | No | - |
| updated_at | string | No | - |

---

## active_security_alerts

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | No | Note:
This is a Primary Key.<pk/> |
| alert_type | string | No | - |
| severity | string | No | - |
| title | string | No | - |
| description | string | No | - |
| user_id | string | No | - |
| api_config_id | string | No | - |
| ip_address | string | No | - |
| user_agent | string | No | - |
| metadata | unknown | No | - |
| acknowledged | boolean | No | - |
| acknowledged_by | string | No | - |
| acknowledged_at | string | No | - |
| resolved | boolean | No | - |
| resolved_at | string | No | - |
| created_at | string | No | - |

---

## signature_requests

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| signature_document_id | string | No | Note:
This is a Foreign Key to `signature_documents.id`.<fk table='signature_documents' column='id'/> |
| signer_email | string | Yes | - |
| signer_name | string | No | - |
| signer_role | string | No | - |
| signing_order | integer | No | - |
| signature_status | string | No | - |
| signed_at | string | No | - |
| declined_at | string | No | - |
| decline_reason | string | No | - |
| documenso_recipient_id | string | No | - |
| signature_field_id | string | No | - |
| created_at | string | No | - |
| updated_at | string | No | - |

---

## tender_monitors

Stores automated tender monitoring configurations with filter criteria

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| name | string | Yes | - |
| description | string | No | - |
| frequency | string | No | Check frequency: hourly, daily, or weekly |
| filters | unknown | No | JSON object containing filter criteria for matched tenders |
| is_active | boolean | No | - |
| created_by_user_id | string | No | - |
| user_ids | unknown | No | JSON array of user IDs to notify (in addition to created_by_user_id) |
| created_at | string | No | - |
| updated_at | string | No | - |

---

## chatbot_permissions

Fine-grained permissions for chatbot access by page and role

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| page_id | string | Yes | - |
| role_id | integer | Yes | - |
| has_access | boolean | Yes | - |
| granted_by | string | No | - |
| granted_at | string | Yes | - |
| expires_at | string | No | - |
| metadata | unknown | No | - |
| created_at | string | Yes | - |
| updated_at | string | Yes | - |

---

## document_processing_log

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| instance_id | string | No | Note:
This is a Foreign Key to `form_instances.id`.<fk table='form_instances' column='id'/> |
| template_id | string | No | Note:
This is a Foreign Key to `governance_document_templates.id`.<fk table='governance_document_templates' column='id'/> |
| file_name | string | Yes | - |
| file_type | string | No | - |
| organization_name | string | No | - |
| discipline_name | string | No | - |
| processing_type | string | Yes | - |
| processing_status | string | Yes | - |
| processing_message | string | No | - |
| processing_details | unknown | No | - |
| processing_time_ms | integer | No | - |
| file_size | integer | No | - |
| extracted_fields_count | integer | No | - |
| error_details | unknown | No | - |
| stack_trace | string | No | - |
| user_agent | string | No | - |
| user_ip | string | No | - |
| created_by | string | No | - |
| created_at | string | No | - |
| organization_id | string | No | - |

---

## form_instances

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| template_id | string | No | Note:
This is a Foreign Key to `governance_document_templates.id`.<fk table='governance_document_templates' column='id'/> |
| organization_name | string | No | - |
| instance_name | string | Yes | - |
| instance_slug | string | No | - |
| source_file_name | string | Yes | - |
| source_file_type | string | No | - |
| source_file_size | integer | No | - |
| processed_data | unknown | No | - |
| submission_data | unknown | No | - |
| html_form | string | No | - |
| json_form | unknown | No | - |
| processing_status | string | No | - |
| version | integer | No | - |
| is_submitted | boolean | No | - |
| submitted_by | string | No | - |
| submitted_at | string | No | - |
| created_by | string | No | - |
| updated_by | string | No | - |
| created_at | string | No | - |
| updated_at | string | No | - |
| deleted_at | string | No | - |
| organization_id | string | No | Note:
This is a Foreign Key to `organizations.id`.<fk table='organizations' column='id'/> |

---

## chat_analytics

Analytics data for IT dashboard and usage monitoring

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| session_id | string | No | Note:
This is a Foreign Key to `chat_sessions.id`.<fk table='chat_sessions' column='id'/> |
| user_id | string | No | - |
| discipline_code | string | Yes | - |
| chatbot_type | string | Yes | - |
| company_id | string | No | - |
| company_name | string | No | - |
| organisation_id | string | No | - |
| organisation_name | string | No | - |
| project_id | string | No | - |
| project_name | string | No | - |
| project_phase_id | string | No | - |
| project_phase_name | string | No | - |
| query_type | string | No | - |
| query_category | string | No | - |
| response_quality_score | number | No | - |
| user_satisfaction_rating | integer | No | - |
| response_time_ms | integer | No | - |
| documents_found | integer | No | - |
| documents_relevant | integer | No | - |
| session_duration_minutes | integer | No | - |
| messages_in_session | integer | No | - |
| time_of_day | integer | No | - |
| day_of_week | integer | No | - |
| user_feedback | string | No | - |
| improvement_suggestions | string | No | - |
| error_occurred | boolean | No | - |
| error_type | string | No | - |
| created_at | string | No | - |
| metadata | unknown | No | - |

---

## document_variations

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| name | string | Yes | - |
| discipline_code | string | Yes | - |
| contract_type | string | No | - |
| template_variation | string | No | - |
| organization_id | string | Yes | - |
| created_at | string | No | - |
| updated_at | string | No | - |

---

## v_company_project_chat_usage

Chat usage analytics grouped by company and project

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| company_name | string | No | - |
| organisation_name | string | No | - |
| project_name | string | No | - |
| project_phase_name | string | No | - |
| discipline_code | string | No | - |
| chatbot_type | string | No | - |
| total_sessions | integer | No | - |
| total_messages | integer | No | - |
| total_documents_referenced | integer | No | - |
| avg_response_time_ms | number | No | - |
| unique_users | integer | No | - |
| last_activity | string | No | - |
| sessions_last_7_days | integer | No | - |
| sessions_previous_7_days | integer | No | - |

---

## v_realtime_chat_activity

Real-time view of active chat sessions

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| session_id | string | No | Note:
This is a Primary Key.<pk/> |
| user_id | string | No | - |
| discipline_code | string | No | - |
| chatbot_type | string | No | - |
| company_name | string | No | - |
| project_name | string | No | - |
| session_title | string | No | - |
| last_activity_at | string | No | - |
| minutes_since_last_activity | number | No | - |
| activity_status | string | No | - |
| latest_message_role | string | No | - |
| latest_message_preview | string | No | - |
| total_messages | integer | No | - |
| avg_response_time_ms | integer | No | - |

---

## procurement_contributions

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| procurement_order_id | string | Yes | Note:
This is a Foreign Key to `procurement_orders.id`.<fk table='procurement_orders' column='id'/> |
| appendix_key | string | Yes | - |
| discipline_id | string | Yes | Note:
This is a Foreign Key to `disciplines.id`.<fk table='disciplines' column='id'/> |
| user_id | string | Yes | - |
| content | string | No | - |
| status | string | No | - |
| assigned_at | string | No | - |
| completed_at | string | No | - |
| created_at | string | No | - |
| updated_at | string | No | - |

---

## audit_log

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | integer | Yes | Note:
This is a Primary Key.<pk/> |
| action | string | Yes | - |
| table_name | string | No | - |
| user_id | string | No | - |
| record_id | string | No | - |
| details | unknown | No | - |
| created_at | string | No | - |

---

## tasks

Central repository for all tasks across the procurement and project management system

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Unique identifier for the task

Note:
This is a Primary Key.<pk/> |
| organization_id | string | Yes | Organization context for multi-tenant isolation - references organizations(id)

Note:
This is a Foreign Key to `organizations.id`.<fk table='organizations' column='id'/> |
| task_type | string | Yes | Type of task (procurement_review, appendix_contribution, hitl, etc.) |
| title | string | Yes | - |
| description | string | No | - |
| business_object_type | string | No | Type of business object this task relates to |
| business_object_id | string | No | ID of the specific business object |
| assigned_to | string | No | User currently assigned to complete this task - references auth.users(id) |
| assigned_by | string | No | User who assigned this task - references auth.users(id) |
| discipline | string | No | Discipline this task belongs to (engineering, procurement, etc.) |
| priority | string | No | - |
| status | string | No | - |
| due_date | string | No | - |
| is_hitl | boolean | No | Whether this task requires human intervention |
| intervention_type | string | No | Type of human intervention required |
| chatbot_session_id | string | No | - |
| created_at | string | No | - |
| updated_at | string | No | - |
| completed_at | string | No | - |
| escalated_at | string | No | - |
| metadata | unknown | No | Flexible storage for task-specific additional data |
| sequence_position | integer | No | - |
| sequence_group | string | No | - |
| sequence_dependencies | unknown | No | - |
| sequence_execution_id | string | No | - |
| estimated_duration_minutes | integer | No | - |
| actual_duration_minutes | integer | No | - |
| assigned_to_discipline | string | No | - |
| procurement_order_id | string | No | Note:
This is a Foreign Key to `procurement_orders.id`.<fk table='procurement_orders' column='id'/> |
| created_by | string | No | - |

---

## contributor_assignments

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| contributor_id | string | No | Note:
This is a Foreign Key to `contributors.id`.<fk table='contributors' column='id'/> |
| page_id | string | No | - |
| branch_name | string | No | - |
| status | string | No | - |
| assigned_at | string | No | - |
| completed_at | string | No | - |
| modal_configuration_id | string | No | - |
| github_branch_url | string | No | - |
| auto_generated_files | unknown | No | - |
| notes | string | No | - |
| created_at | string | No | - |
| updated_at | string | No | - |

---

## a_00425_contracts_pre_vector

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | No | - |
| embedding | string | No | - |
| metadata | unknown | No | - |
| content | string | No | - |
| created_by_user_id | integer | No | - |
| access_scope | string | No | - |
| organisation_id | integer | No | - |
| shared_with_disciplines | unknown | No | - |
| chunks | unknown | No | - |

---

## companies

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| name | string | Yes | - |
| created_at | string | No | - |
| updated_at | string | No | - |
| active | boolean | No | - |
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| organization_id | string | No | - |
| user_id | string | No | - |

---

## a_03000_landscaping_vector

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| embedding | string | No | - |
| metadata | unknown | No | - |
| content | string | No | - |
| created_by_user_id | integer | No | - |
| access_scope | string | No | - |
| organisation_id | integer | No | - |
| shared_with_disciplines | string | No | - |
| chunks | unknown | No | - |
| discipline_code | string | No | - |
| isolation_metadata | unknown | No | - |
| project_id | integer | No | - |
| workspace_id | integer | No | - |
| workspace_type | string | No | - |

---

## form_completions

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| title | string | Yes | - |
| description | string | No | - |
| template_type | string | No | - |
| status | string | Yes | - |
| priority | string | No | - |
| project_id | string | No | - |
| project_name | string | No | - |
| assigned_to | string | No | - |
| created_at | string | No | - |
| updated_at | string | No | - |
| completed_date | string | No | - |
| created_by | string | No | - |
| updated_by | string | No | - |
| reference_number | string | No | - |
| tags | array | No | - |
| form_data | unknown | No | - |
| comments | string | No | - |

---

## active_templates

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | No | Note:
This is a Primary Key.<pk/> |
| type | string | No | - |
| name | string | No | - |
| description | string | No | - |
| version | string | No | - |
| prompt_template | string | No | - |
| validation_config | unknown | No | - |
| ui_config | unknown | No | - |
| is_active | boolean | No | - |
| is_public | boolean | No | - |
| created_by | string | No | - |
| updated_by | string | No | - |
| usage_count | integer | No | - |
| success_rate | number | No | - |
| average_generation_time | integer | No | - |
| tags | array | No | - |
| created_at | string | No | - |
| updated_at | string | No | - |
| discipline_code | string | No | - |
| document_type | string | No | - |
| discipline | string | No | - |
| copied_from_template_id | string | No | Note:
This is a Foreign Key to `templates.id`.<fk table='templates' column='id'/> |
| template_scope | string | No | - |
| target_discipline | string | No | - |
| copy_metadata | unknown | No | - |
| processing_status | string | No | - |
| organization_id | string | No | - |
| suitable_for_document_types | array | No | - |
| category | string | No | - |
| deleted_at | string | No | - |
| deleted_by | string | No | - |
| deletion_reason | string | No | - |

---

## contracts

Contracts associated with contractors on projects

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | integer | Yes | Note:
This is a Primary Key.<pk/> |
| contractor_id | integer | No | - |
| contract_number | string | Yes | - |
| contract_type | string | No | - |
| created_at | string | No | - |
| updated_at | string | No | - |
| contract_type_id | string | No | Note:
This is a Foreign Key to `dropdown_options.id`.<fk table='dropdown_options' column='id'/> |
| category | string | No | Category associated with the contract, e.g., Contracts information. |
| working_zones | array | No | Array of working zones or areas applicable to the contract. |
| project_id | string | No | Note:
This is a Foreign Key to `projects.id`.<fk table='projects' column='id'/> |
| organization_id | string | No | - |
| user_id | string | No | - |
| assigned_to | string | No | - |

---

## discipline_template_config

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| discipline | string | Yes | Note:
This is a Primary Key.<pk/> |
| allowed_template_types | array | Yes | - |
| requires_approval | boolean | No | - |
| max_templates_per_user | integer | No | - |
| description | string | No | - |
| created_at | string | No | - |
| updated_at | string | No | - |

---

## organization_users

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| organization_id | string | Yes | Note:
This is a Foreign Key to `organizations.id`.<fk table='organizations' column='id'/> |
| user_id | string | Yes | Note:
This is a Foreign Key to `user_management.user_id`.<fk table='user_management' column='user_id'/> |
| discipline_id | string | Yes | Note:
This is a Foreign Key to `disciplines.id`.<fk table='disciplines' column='id'/> |
| role | string | No | - |
| status | string | No | - |
| created_at | string | No | - |
| updated_at | string | No | - |
| created_by | string | No | Note:
This is a Foreign Key to `user_management.user_id`.<fk table='user_management' column='user_id'/> |
| updated_by | string | No | Note:
This is a Foreign Key to `user_management.user_id`.<fk table='user_management' column='user_id'/> |

---

## a_01700_logistics_vector

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| embedding | string | No | - |
| metadata | unknown | No | - |
| content | string | No | - |
| created_by_user_id | integer | No | - |
| access_scope | string | No | - |
| organisation_id | string | No | - |
| shared_with_disciplines | string | No | - |
| chunks | unknown | No | - |
| discipline_code | string | No | - |
| isolation_metadata | unknown | No | - |
| project_id | integer | No | - |
| workspace_id | integer | No | - |
| workspace_type | string | No | - |
| project_phase_assignment_id | string | No | - |

---

## procurement_signatures

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| contract_id | string | No | - |
| signature_document_id | string | No | Note:
This is a Foreign Key to `signature_documents.id`.<fk table='signature_documents' column='id'/> |
| procurement_phase | string | Yes | - |
| procurement_stage | string | Yes | - |
| required_signatories | integer | Yes | - |
| collected_signatures | integer | No | - |
| deadline | string | No | - |
| status | string | No | - |
| completed_at | string | No | - |
| expired_at | string | No | - |
| initiated_by | string | No | - |
| business_case | string | No | - |
| special_conditions | string | No | - |
| created_at | string | No | - |
| updated_at | string | No | - |
| organization_id | string | No | - |
| created_by | string | No | - |

---

## template_usage_tracking

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| user_id | string | No | - |
| template_id | string | No | - |
| action_type | string | Yes | - |
| procurement_code | string | No | - |
| department_code | string | No | - |
| session_id | string | No | - |
| user_agent | string | No | - |
| ip_address | string | No | - |
| created_at | string | No | - |

---

## a_01900_procurement_vector

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| embedding | string | No | - |
| metadata | unknown | No | - |
| content | string | No | - |
| created_by_user_id | string | No | - |
| access_scope | string | No | - |
| organisation_id | string | No | - |
| shared_with_disciplines | string | No | - |
| workspace_id | string | No | - |
| workspace_type | string | No | - |
| deleted_at | string | No | - |
| deleted_by | string | No | - |
| deletion_reason | string | No | - |
| scheduled_hard_delete_at | string | No | - |
| isolation_metadata | unknown | No | - |
| discipline_code | string | No | - |
| chunks | unknown | No | - |
| project_id | integer | No | - |

---

## vetting_access_log

Audit log for all user access attempts to contractor vetting functionality. Used for security compliance and monitoring.

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| user_id | string | Yes | - |
| contractor_id | string | No | - |
| action | string | Yes | - |
| resource | string | Yes | - |
| access_granted | boolean | No | - |
| reason_denied | string | No | - |
| discipline | string | No | - |
| company_count | integer | No | - |
| project_count | integer | No | - |
| ip_address | string | No | - |
| user_agent | string | No | - |
| session_id | string | No | - |
| created_at | string | No | - |
| expires_at | string | No | - |

---

## modal_configurations

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Unique identifier for the modal configuration

Note:
This is a Primary Key.<pk/> |
| modal_key | string | No | Unique, human-readable key used for registration and triggering (e.g., "RiskAssessmentModal") |
| display_name | string | No | User-friendly name shown in the UI (e.g., "Risk Assessment") |
| component_path | string | No | The dynamic import path for the React component file (e.g., "@pages/2400-safety/components/modals/2400-RiskAssessmentModal.js") |
| description | string | No | Optional text describing the modal's purpose |
| target_page_prefix | string | No | The 4-digit page prefix the modal is primarily associated with (e.g., "2400") |
| chatbot_id | string | No | The Flowise/Agent ID associated with this modal (nullable) |
| integration_type | string | Yes | Type of integration, if any (e.g., "Flowise", "n8n", "None") |
| interaction_style | string | Yes | Interaction style for integration modals (e.g., "Input Form", "No Input Form", "None") |
| is_legacy | boolean | Yes | Flag to indicate if this configuration represents a legacy (non-React) modal |
| created_at | string | Yes | Timestamp of when the record was created |
| updated_at | string | Yes | Timestamp of when the record was last updated |
| target_state | string | No | The state group the modal button belongs to (e.g., "Workspace", "Upsert", "Agent", nullable) |
| sector | string | No | - |
| sector_id | string | No | Note:
This is a Foreign Key to `sectors.sector_id`.<fk table='sectors' column='sector_id'/> |
| created_by | string | No | Reference to the contributor who created this modal configuration |
| updated_by | string | No | Reference to the contributor who last updated this modal configuration |
| is_active | boolean | No | - |
| is_deleted | boolean | No | - |
| sort_order | integer | No | - |
| tags | array | No | - |
| metadata | unknown | No | - |
| modal_type | string | No | - |
| page_name | string | No | - |
| page_prefix | string | No | - |

---

## defects

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | integer | Yes | Note:
This is a Primary Key.<pk/> |
| defect_id | string | Yes | - |
| inspection_item_id | string | Yes | Note:
This is a Foreign Key to `inspection_items.item_id`.<fk table='inspection_items' column='item_id'/> |
| defect_type | string | Yes | - |
| severity | string | No | - |
| description | string | Yes | - |
| location | string | No | - |
| assigned_to | string | No | - |
| status | string | No | - |
| priority | string | No | - |
| due_date | string | No | - |
| resolved_date | string | No | - |
| resolution_notes | string | No | - |
| cost_estimate | number | No | - |
| media_urls | unknown | No | - |
| created_at | string | No | - |
| updated_at | string | No | - |
| created_by | string | No | - |
| updated_by | string | No | - |

---

## routing_step_actions

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | integer | Yes | Note:
This is a Primary Key.<pk/> |
| routing_step_id | integer | No | Note:
This is a Foreign Key to `workflow_routing_steps.id`.<fk table='workflow_routing_steps' column='id'/> |
| participant_id | string | No | Note:
This is a Foreign Key to `user_management.user_id`.<fk table='user_management' column='user_id'/> |
| participant_role | string | No | - |
| action_type | string | Yes | - |
| action_status | string | No | - |
| action_comment | string | No | - |
| action_data | unknown | No | - |
| deadline | string | No | - |
| reminded_at | string | No | - |
| completed_at | string | No | - |
| created_at | string | No | - |
| updated_at | string | No | - |

---

## approval_cover_sheets

Generated approval cover sheets for procurement orders

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| procurement_order_id | string | Yes | Reference to the procurement order

Note:
This is a Foreign Key to `procurement_orders.id`.<fk table='procurement_orders' column='id'/> |
| html_content | string | Yes | Generated HTML content of the cover sheet |
| approval_matrix | unknown | No | JSON array of required approvers and their roles |
| generated_at | string | No | - |
| status | string | No | Status of the cover sheet (generated, sent, approved, etc.) |
| created_at | string | No | - |
| updated_at | string | No | - |

---

## contractor_vetting

Main table for contractor vetting information and status tracking

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | integer | Yes | Note:
This is a Primary Key.<pk/> |
| contractor_id | integer | No | Reference to the main contractors table |
| company_name | string | Yes | - |
| contact_person | string | No | - |
| phone | string | No | - |
| email | string | No | - |
| business_address | string | No | - |
| created_at | string | No | - |
| updated_at | string | No | - |
| vetting_status | string | No | Current vetting status of the contractor |
| overall_score | integer | No | Overall vetting score (0-100) |
| notes | string | No | General notes about the vetting process |
| organization_id | string | No | Note:
This is a Foreign Key to `organizations.id`.<fk table='organizations' column='id'/> |

---

## consultants

Consultants table with procurement entity fields for approval workflow

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | integer | Yes | Note:
This is a Primary Key.<pk/> |
| name | string | Yes | - |
| created_at | string | No | - |
| updated_at | string | No | - |
| address | string | No | - |
| email | string | No | - |
| phone | string | No | - |
| contact_person | string | No | - |
| project_id | string | No | Note:
This is a Foreign Key to `projects.id`.<fk table='projects' column='id'/> |
| consultant_type | string | No | Type of consultant (e.g., engineering, architectural, legal) |
| organization_id | string | No | Note:
This is a Foreign Key to `organizations.id`.<fk table='organizations' column='id'/> |
| services_offered | string | No | - |
| license_number | string | No | - |
| insurance_status | string | No | - |
| registration_date | string | No | - |
| approval_status | string | No | - |
| compliance_status | string | No | - |
| last_activity | string | No | - |
| scraped_at | string | No | - |

---

## prompt_usage_summary

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| prompt_name | string | No | - |
| prompt_id | string | No | Note:
This is a Primary Key.<pk/> |
| is_active | boolean | No | - |
| total_calls | integer | No | - |
| successful_calls | integer | No | - |
| avg_response_time_ms | number | No | - |
| last_used | string | No | - |
| unique_scripts | integer | No | - |
| scripts_using | string | No | - |

---

## v_daily_chat_stats

Daily aggregated chat statistics by discipline and project

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| date | string | No | - |
| discipline_code | string | No | - |
| chatbot_type | string | No | - |
| company_name | string | No | - |
| organisation_name | string | No | - |
| project_name | string | No | - |
| sessions_count | integer | No | - |
| total_messages | integer | No | - |
| total_documents_referenced | integer | No | - |
| avg_response_time_ms | number | No | - |
| unique_users | integer | No | - |

---

## evaluation_packages

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| package_context | string | Yes | - |
| context_reference_id | string | No | - |
| package_name | string | Yes | - |
| package_description | string | No | - |
| party_email | string | Yes | - |
| party_name | string | No | - |
| party_org_name | string | No | - |
| party_type | string | No | - |
| party_id | string | No | Optional UUID reference to external party. May reference contractors table, user_management, or other party tables. Not a foreign key to allow flexibility. The party_email field is the primary identifier. |
| organization_id | string | No | Note:
This is a Foreign Key to `organizations.id`.<fk table='organizations' column='id'/> |
| overall_status | string | No | - |
| discipline_scores | unknown | No | - |
| final_weighted_score | number | No | - |
| final_weighted_percentage | number | No | - |
| scoring_calculation | unknown | No | - |
| final_decision | string | No | - |
| final_decision_by | string | No | Note:
This is a Foreign Key to `user_management.user_id`.<fk table='user_management' column='user_id'/> |
| final_decision_at | string | No | - |
| final_decision_comments | string | No | - |
| context_metadata | unknown | No | - |
| created_by | string | No | Note:
This is a Foreign Key to `user_management.user_id`.<fk table='user_management' column='user_id'/> |
| created_at | string | No | - |
| due_date | string | No | - |
| completed_at | string | No | - |
| updated_at | string | No | - |
| updated_by | string | No | Note:
This is a Foreign Key to `user_management.user_id`.<fk table='user_management' column='user_id'/> |

---

## a_02076_qa_vector

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| content | string | Yes | - |
| metadata | unknown | No | - |
| embedding | string | No | - |
| organisation_id | integer | No | - |
| project_id | integer | No | - |
| project_phase_assignment_id | integer | No | - |
| created_by_user_id | integer | No | - |
| access_scope | string | No | - |
| shared_with_disciplines | array | No | - |
| workspace_id | integer | No | - |
| workspace_type | string | No | - |
| isolation_metadata | unknown | No | - |
| chunks | unknown | No | - |
| discipline_code | string | No | - |
| created_at | string | No | - |
| updated_at | string | No | - |

---

## tracking_events

Historical tracking events for vessels and containers

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| event_type | string | Yes | - |
| event_category | string | Yes | - |
| vessel_id | string | No | Note:
This is a Foreign Key to `vessels.id`.<fk table='vessels' column='id'/> |
| container_id | string | No | Note:
This is a Foreign Key to `containers.id`.<fk table='containers' column='id'/> |
| event_timestamp | string | Yes | - |
| event_description | string | No | - |
| event_location | string | No | - |
| latitude | number | No | - |
| longitude | number | No | - |
| status_code | string | No | - |
| status_description | string | No | - |
| port_code | string | No | - |
| port_name | string | No | - |
| facility_name | string | No | - |
| event_data | unknown | No | - |
| data_source | string | No | - |
| api_reference | string | No | - |
| created_at | string | No | - |
| created_by | string | No | - |
| company_id | string | No | - |
| organisation_id | string | No | - |
| project_id | string | No | - |

---

## a_00900_doccontrol_approvals

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | integer | Yes | Note:
This is a Primary Key.<pk/> |
| version_id | integer | Yes | Note:
This is a Foreign Key to `a_00900_doccontrol_document_versions.id`.<fk table='a_00900_doccontrol_document_versions' column='id'/> |
| step_order | integer | Yes | - |
| role_slug | string | No | - |
| approver_id | string | No | - |
| required | boolean | Yes | - |
| status | string | Yes | - |
| acted_by | string | No | - |
| acted_at | string | No | - |
| comment | string | No | - |
| created_at | string | Yes | - |

---

## llm_functions

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| name | string | Yes | - |
| description | string | No | - |
| function_type | string | Yes | - |
| model_name | string | Yes | - |
| api_config | unknown | Yes | - |
| is_active | boolean | No | - |
| created_at | string | Yes | - |
| updated_at | string | Yes | - |
| created_by | string | No | - |

---

## document_processing_queue

Queue for tracking document processing status and progress

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| file_id | string | Yes | Unique identifier for the file being processed (before document creation) |
| document_id | string | No | Note:
This is a Foreign Key to `a_00900_doccontrol_documents.id`.<fk table='a_00900_doccontrol_documents' column='id'/> |
| status | string | No | - |
| progress | integer | No | Processing progress percentage (0-100) |
| metadata | unknown | No | - |
| ai_analysis | unknown | No | Temporary storage for AI analysis results during processing |
| error_message | string | No | - |
| created_at | string | No | - |
| processed_at | string | No | - |

---

## procurement_orders

Dedicated table for actual procurement orders (separate from reusable templates)

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| order_number | string | No | Auto-generated unique order number (PO-2025-001, SO-2025-001, WO-2025-001) |
| order_type | string | Yes | Type of procurement order: purchase_order, service_order, work_order |
| title | string | Yes | - |
| description | string | No | - |
| department | string | No | - |
| priority | string | No | - |
| estimated_value | number | No | - |
| currency | string | No | - |
| supplier_name | string | No | - |
| supplier_contact | string | No | - |
| project_id | string | No | Reference to projects table for project context awareness

Note:
This is a Foreign Key to `projects.id`.<fk table='projects' column='id'/> |
| project_phase | string | No | Current project phase for document filtering and suggestions |
| template_id | string | No | Note:
This is a Foreign Key to `procurement_templates.id`.<fk table='procurement_templates' column='id'/> |
| linked_documents | unknown | No | JSON array of linked documents with metadata for document integration feature |
| approval_status | string | No | - |
| delivery_date | string | No | - |
| special_requirements | string | No | - |
| created_by | string | Yes | Note:
This is a Foreign Key to `user_profiles.user_id`.<fk table='user_profiles' column='user_id'/> |
| organization_id | string | No | Note:
This is a Foreign Key to `organizations.id`.<fk table='organizations' column='id'/> |
| created_at | string | No | - |
| updated_at | string | No | - |
| sow_id | string | No | - |
| sow_template_id | string | No | Reference to the SOW template used for this order

Note:
This is a Foreign Key to `templates.id`.<fk table='templates' column='id'/> |
| appendix_a_content | string | No | - |
| appendix_b_content | string | No | - |
| appendix_c_content | string | No | - |
| appendix_d_content | string | No | - |
| appendix_e_content | string | No | - |
| appendix_f_content | string | No | - |
| approval_cover_content | string | No | - |
| main_order_content | string | No | - |
| discipline_assignments | unknown | No | JSON mapping of disciplines to SOW appendices |
| contribution_status | unknown | No | - |
| approval_matrix | unknown | No | JSON object defining approval workflow matrix |
| approval_routing_type | string | No | - |
| approval_config | unknown | No | JSON configuration for approval workflow settings |
| user_assignments | unknown | No | JSON mapping of users to specific appendix sections |
| task_sequence | unknown | No | - |
| template_variation | string | No | - |
| sequence_override_id | string | No | - |
| estimated_completion_time | string | No | - |
| sequence_execution_id | string | No | - |

---

## prompts_with_rbac

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | No | Note:
This is a Primary Key.<pk/> |
| name | string | No | - |
| content | string | No | - |
| description | string | No | - |
| organization_id | string | No | - |
| sector_id | string | No | - |
| type | string | No | - |
| category | string | No | - |
| tags | array | No | - |
| is_active | boolean | No | - |
| metadata | unknown | No | - |
| created_at | string | No | - |
| updated_at | string | No | - |
| key | string | No | - |
| role_type | string | No | - |
| access_permissions | unknown | No | - |
| created_by | string | No | - |
| role_description | string | No | - |
| dev_can_access | boolean | No | - |
| user_can_edit | boolean | No | - |
| user_can_create | boolean | No | - |
| user_can_delete | boolean | No | - |

---

## contractors_backup_before_uuid_migration

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | integer | No | - |
| name | string | No | - |
| created_at | string | No | - |
| updated_at | string | No | - |
| address | string | No | - |
| email | string | No | - |
| phone | string | No | - |
| contact_person | string | No | - |
| project_id | string | No | - |
| contractor_type | string | No | - |
| construction_type | string | No | - |
| sector | string | No | - |

---

## a_00900_doccontrol_approval_rule_steps

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | integer | Yes | Note:
This is a Primary Key.<pk/> |
| rule_id | integer | Yes | Note:
This is a Foreign Key to `a_00900_doccontrol_approval_rules.id`.<fk table='a_00900_doccontrol_approval_rules' column='id'/> |
| step_order | integer | Yes | - |
| role_slug | string | No | - |
| required | boolean | Yes | - |
| parallel_group_id | integer | No | - |

---

## a_01500_hr_vector

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| embedding | string | No | - |
| metadata | unknown | No | - |
| content | string | No | - |
| organisation_id | string | No | - |
| project_id | string | No | - |
| project_phase_assignment_id | string | No | - |
| created_by_user_id | integer | No | - |
| access_scope | string | No | - |
| shared_with_disciplines | string | No | - |
| chunks | unknown | No | - |
| discipline_code | string | No | - |
| isolation_metadata | unknown | No | - |
| workspace_id | integer | No | - |
| workspace_type | string | No | - |

---

## a_00102_admin_data

Administration data

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | integer | Yes | Note:
This is a Primary Key.<pk/> |
| created_at | string | Yes | - |

---

## user_role_assignments

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | integer | Yes | Note:
This is a Primary Key.<pk/> |
| user_id | string | Yes | - |
| role_name | string | Yes | Note:
This is a Foreign Key to `role_definitions.role_name`.<fk table='role_definitions' column='role_name'/> |
| created_at | string | No | - |
| updated_at | string | No | - |
| company_id | string | No | - |
| assigned_at | string | No | - |
| assigned_by | string | No | - |
| is_active | boolean | No | - |
| organization_id | string | No | - |

---

## hitl_performance_metrics

Performance metrics and analytics for HITL task resolutions

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| task_id | string | No | Reference to the resolved HITL task

Note:
This is a Foreign Key to `tasks.id`.<fk table='tasks' column='id'/> |
| resolver_id | string | No | User who resolved the HITL task |
| discipline | string | No | - |
| intervention_type | string | No | - |
| decision | string | No | - |
| ai_confidence_before | number | No | - |
| human_confidence_after | number | No | - |
| decision_alignment | boolean | No | Whether human decision aligned with AI recommendation |
| time_to_resolution_minutes | integer | No | Time taken to resolve the task in minutes |
| quality_rating | integer | No | Human-rated quality of the resolution (1-5) |
| complexity_level | string | No | - |
| created_at | string | No | - |

---

## a_02035_scheduling_vector

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| embedding | string | No | - |
| metadata | unknown | No | - |
| content | string | No | - |
| created_by_user_id | integer | No | - |
| access_scope | string | No | - |
| organisation_id | integer | No | - |
| shared_with_disciplines | string | No | - |
| chunks | unknown | No | - |
| discipline_code | string | No | - |
| isolation_metadata | unknown | No | - |
| project_id | integer | No | - |
| workspace_id | integer | No | - |
| workspace_type | string | No | - |

---

## travel_helipads

List of helipads for travel routing

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| name | string | Yes | - |
| coordinates | string | No | - |
| equipment | array | No | - |
| created_at | string | No | - |
| updated_at | string | No | - |
| organization_id | string | No | - |
| user_id | string | No | - |

---

## v_discipline_performance

Performance metrics for each discipline chatbot type

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| discipline_code | string | No | - |
| chatbot_type | string | No | - |
| total_sessions | integer | No | - |
| total_messages | integer | No | - |
| avg_messages_per_session | number | No | - |
| total_documents_referenced | integer | No | - |
| avg_documents_per_session | number | No | - |
| avg_response_time_ms | number | No | - |
| unique_users | integer | No | - |
| unique_companies | integer | No | - |
| unique_projects | integer | No | - |
| avg_user_satisfaction | number | No | - |
| last_activity | string | No | - |
| active_today | integer | No | - |
| active_this_week | integer | No | - |

---

## agent_roles

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| role_name | string | Yes | - |
| description | string | No | - |
| capabilities | unknown | No | - |
| safety_restrictions | unknown | No | - |
| max_requests_per_hour | integer | No | - |
| context_isolation_level | string | No | - |
| audit_level | string | No | - |
| created_at | string | No | - |

---

## a_02050_it_vector

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| embedding | string | No | - |
| metadata | unknown | No | - |
| content | string | No | - |
| created_by_user_id | integer | No | - |
| access_scope | string | No | - |
| organisation_id | integer | No | - |
| shared_with_disciplines | string | No | - |
| chunks | unknown | No | - |
| discipline_code | string | No | - |
| isolation_metadata | unknown | No | - |
| project_id | integer | No | - |
| workspace_id | integer | No | - |
| workspace_type | string | No | - |

---

## dropdown_options

Modal-specific dropdown options

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| modal_id | string | Yes | - |
| type | string | Yes | - |
| value | string | Yes | - |
| company_id | integer | No | - |
| contractor_id | integer | No | - |
| field_label | string | No | - |
| project | string | No | - |
| modal_name | string | No | - |
| created_at | string | No | - |
| updated_at | string | No | - |
| type_contract | string | No | - |
| language | string | No | - |
| project_id | string | No | Note:
This is a Foreign Key to `projects.id`.<fk table='projects' column='id'/> |

---

## prompts

Stores AI prompts and templates used throughout the system for various AI-powered features

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Unique identifier for the prompt

Note:
This is a Primary Key.<pk/> |
| name | string | Yes | Human-readable name for the prompt |
| content | string | Yes | The actual prompt text/template |
| description | string | No | Brief description of the prompt purpose |
| organization_id | string | No | Associated organization (optional) |
| sector_id | string | No | Associated sector (optional) |
| type | string | No | Type of prompt (coding, analysis, chat, etc.) |
| category | string | No | Category of prompt (development, legal, etc.) |
| tags | array | No | Array of tags for categorization and search |
| is_active | boolean | No | Whether the prompt is currently active/available |
| metadata | unknown | No | Additional metadata stored as JSON |
| created_at | string | No | Timestamp when prompt was created |
| updated_at | string | No | Timestamp when prompt was last updated |
| key | string | No | - |
| role_type | string | No | Type of prompt: system (dev-only) or user (accessible to end users) |
| access_permissions | unknown | No | JSON object defining granular access permissions for different user roles |
| created_by | string | No | User ID of the prompt creator (for ownership tracking) |
| cross_reference_id | string | No | - |
| pages_used | array | No | - |
| date_added | string | No | - |
| date_modified | string | No | - |
| script_usage | unknown | No | JSONB tracking which scripts/services use this prompt with usage statistics |
| usage_statistics | unknown | No | Aggregated metrics including total usage, success rates, and performance data |
| workflow_context | unknown | No | Workflow integration context including triggers, dependencies, and outputs |
| performance_requirements | unknown | No | Performance expectations including accuracy targets and processing time limits |
| agent_capabilities | unknown | No | Agent capabilities including supported disciplines and document types |
| integration_points | unknown | No | System integration points including pages, APIs, and databases |
| success_criteria | unknown | No | Success criteria and quality metrics for prompt evaluation |
| prompt_version | string | No | Version identifier for prompt versioning and tracking |
| last_tested | string | No | Timestamp of last testing/validation of the prompt |
| test_results | unknown | No | Latest test results and performance metrics |

---

## template_usage_logs

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| template_id | string | No | Note:
This is a Foreign Key to `templates.id`.<fk table='templates' column='id'/> |
| template_type | string | Yes | - |
| user_id | string | No | - |
| session_id | string | No | - |
| generation_time | integer | No | - |
| success | boolean | No | - |
| error_message | string | No | - |
| metadata | unknown | No | - |
| created_at | string | No | - |

---

## a_00884_direng_vector

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| embedding | string | No | - |
| metadata | unknown | No | - |
| content | string | No | - |
| created_by_user_id | integer | No | - |
| access_scope | string | No | - |
| organisation_id | integer | No | - |
| shared_with_disciplines | string | No | - |
| chunks | unknown | No | - |
| discipline_code | string | No | - |
| isolation_metadata | unknown | No | - |
| project_id | integer | No | - |
| workspace_id | integer | No | - |
| workspace_type | string | No | - |

---

## vetting_access_summary

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| access_date | string | No | - |
| discipline | string | No | - |
| action | string | No | - |
| access_granted | boolean | No | - |
| access_count | integer | No | - |
| unique_users | integer | No | - |

---

## procurement_templates

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| document_id | string | No | - |
| organization_id | string | No | - |
| created_by | string | No | - |
| updated_by | string | No | - |
| template_name | string | Yes | - |
| template_description | string | No | - |
| template_type | string | Yes | - |
| template_category | string | No | - |
| level1_code | string | No | - |
| level2_code | string | No | - |
| level3_code | string | No | - |
| template_content | unknown | No | - |
| field_protection | unknown | No | - |
| protection_enabled | boolean | No | - |
| is_latest | boolean | No | - |
| version_number | integer | No | - |
| approval_status | string | No | - |
| approved_by | string | No | - |
| approved_at | string | No | - |
| related_documents | unknown | No | - |
| compliance_requirements | unknown | No | - |
| lifecycle_stage | string | No | - |
| tags | array | No | - |
| created_at | string | No | - |
| updated_at | string | No | - |
| access_level | string | No | - |
| discipline | string | No | - |
| allowed_roles | unknown | No | - |
| component_type | string | No | - |
| mandatory | boolean | No | - |
| approval_workflow | unknown | No | JSONB containing approval workflow configuration including required approvals, hierarchy, and notification settings |
| html_content | string | No | Generated HTML content from template fields for document processing. Indexed using MD5 hash for performance. |
| document_type | string | No | Document type copied from governance template (e.g., PO, Contract, SOW) |
| document_type_label | string | No | Human-readable label for the document type |
| discipline_code | string | No | Discipline code (e.g., 00850 for Civil Engineering) for discipline-aware template filtering |
| appendix_letter | string | No | - |
| sow_integration_enabled | boolean | No | - |
| organization_name | string | No | - |
| discipline_name | string | No | - |
| source_governance_template_id | string | No | - |
| source_order_id | string | No | Note:
This is a Foreign Key to `procurement_orders.id`.<fk table='procurement_orders' column='id'/> |
| source_project_id | string | No | Note:
This is a Foreign Key to `projects.id`.<fk table='projects' column='id'/> |
| populated_data | unknown | No | - |
| variable_fields | unknown | No | - |
| derivation_metadata | unknown | No | - |
| derivation_confidence | number | No | - |

---

## a_00435_contracts_post_data

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| document_number | string | Yes | - |
| contract_title | string | Yes | - |
| contract_type | string | No | - |
| contractor_name | string | No | - |
| contract_value | number | No | - |
| currency_code | string | No | - |
| project_code | string | No | - |
| project_name | string | No | - |
| site_location | string | No | - |
| award_date | string | No | - |
| commencement_date | string | No | - |
| completion_date | string | No | - |
| original_value | number | No | - |
| variations | number | No | - |
| current_value | number | No | - |
| contract_status | string | No | - |
| progress_percentage | number | No | - |
| days_remaining | integer | No | - |
| required_approvals | unknown | No | - |
| approval_status | string | No | - |
| governance_category | string | No | - |
| document_count | integer | No | - |
| last_document_date | string | No | - |
| template_used_id | string | No | - |
| created_by | string | No | - |
| approved_by | string | No | - |
| organization_id | string | No | - |
| tags | array | No | - |
| notes | string | No | - |
| created_at | string | No | - |
| updated_at | string | No | - |
| signed_at | string | No | - |

---

## a_02025_qs_vector

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| embedding | string | No | - |
| metadata | unknown | No | - |
| content | string | No | - |
| created_by_user_id | integer | No | - |
| access_scope | string | No | - |
| organisation_id | integer | No | - |
| shared_with_disciplines | string | No | - |
| chunks | unknown | No | - |
| discipline_code | string | No | - |
| isolation_metadata | unknown | No | - |
| project_id | integer | No | - |
| workspace_id | integer | No | - |
| workspace_type | string | No | - |

---

## discipline_document_sections

Flexible document sections system allowing disciplines to define their own appendix, schedule, and attachment structures

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| discipline_code | string | Yes | - |
| organization_id | string | Yes | - |
| section_code | string | Yes | Unique code within discipline (e.g., appendix_a, schedule_1) |
| section_name | string | Yes | - |
| section_type | string | Yes | Type of section: appendix, schedule, attachment, exhibit, policy, procedure |
| display_order | integer | Yes | - |
| required | boolean | No | - |
| allows_multiple_types | boolean | No | - |
| available_document_types | unknown | No | JSON array of allowed document types for this section |
| created_at | string | No | - |
| updated_at | string | No | - |
| contract_type | string | No | Contract type for filtering: po (procurement orders), wo (work orders), so (service orders), general (general sections) |
| default_document_type | string | No | - |
| parent_template_id | string | No | Note:
This is a Foreign Key to `discipline_document_sections.id`.<fk table='discipline_document_sections' column='id'/> |

---

## governance_approval_matrices

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| organization_id | string | No | - |
| department_code | string | Yes | - |
| document_type | string | Yes | - |
| approval_levels | unknown | Yes | - |
| auto_approval_threshold | number | No | - |
| deadline_days | integer | No | - |
| escalation_rules | unknown | No | - |
| email_templates | unknown | No | - |
| is_active | boolean | No | - |
| created_at | string | No | - |
| updated_at | string | No | - |
| created_by | string | No | - |

---

## section_hierarchy

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| parent_section_key | string | No | Note:
This is a Foreign Key to `accordion_sections.section_key`.<fk table='accordion_sections' column='section_key'/> |
| child_section_key | string | No | Note:
This is a Foreign Key to `accordion_sections.section_key`.<fk table='accordion_sections' column='section_key'/> |
| display_order | integer | No | - |
| is_virtual | boolean | No | - |
| created_at | string | No | - |
| updated_at | string | No | - |

---

## safety_templates_backup_20251121

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | No | - |
| organization_id | string | No | - |
| discipline_id | string | No | - |
| template_name | string | No | - |
| template_description | string | No | - |
| template_type | string | No | - |
| template_category | string | No | - |
| template_content | unknown | No | - |
| form_schema | unknown | No | - |
| html_content | string | No | - |
| risk_level | string | No | - |
| applicable_sites | array | No | - |
| required_certifications | array | No | - |
| review_frequency | string | No | - |
| status | string | No | - |
| is_active | boolean | No | - |
| approval_status | string | No | - |
| version | string | No | - |
| is_latest | boolean | No | - |
| created_by | string | No | - |
| created_at | string | No | - |
| updated_by | string | No | - |
| updated_at | string | No | - |
| approved_by | string | No | - |
| approved_at | string | No | - |
| content_schema | unknown | No | - |
| content_metadata | unknown | No | - |
| document_type | string | No | - |
| document_type_label | string | No | - |
| organization_name | string | No | - |
| discipline_name | string | No | - |
| source_governance_template_id | string | No | - |

---

## petty_cash

Petty cash reimbursement requests with approval workflow

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Unique identifier for petty cash request

Note:
This is a Primary Key.<pk/> |
| project_id | string | No | Associated project identifier |
| user_id | string | No | User who submitted the request

Note:
This is a Foreign Key to `user_management.user_id`.<fk table='user_management' column='user_id'/> |
| date | string | Yes | Date when the expense occurred |
| amount | number | Yes | Amount in local currency (ZAR) |
| category | string | Yes | Expense category for reporting |
| description | string | Yes | Detailed description of the expense |
| receipt_url | string | No | URL to uploaded receipt document |
| receipt_filename | string | No | - |
| status | string | No | Current approval status of the request |
| submitted_at | string | No | - |
| approved_at | string | No | - |
| rejected_at | string | No | - |
| approver_id | string | No | Note:
This is a Foreign Key to `user_management.user_id`.<fk table='user_management' column='user_id'/> |
| rejection_reason | string | No | Reason provided when request is rejected |
| created_at | string | No | - |
| updated_at | string | No | - |
| project_name | string | No | - |
| user_name | string | No | - |
| phase_id | string | No | References project_phases table, defaults to FEED phase when not provided

Note:
This is a Foreign Key to `project_phases.id`.<fk table='project_phases' column='id'/> |
| organization_id | string | No | - |

---

## safety_incidents

Safety incidents requiring investigation and resolution

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| title | string | Yes | - |
| description | string | No | - |
| incident_type | string | No | - |
| severity | string | No | - |
| location | string | No | - |
| status | string | No | - |
| assigned_to | string | No | - |
| organization_id | string | No | Note:
This is a Foreign Key to `organizations.id`.<fk table='organizations' column='id'/> |
| project_id | string | No | Note:
This is a Foreign Key to `projects.id`.<fk table='projects' column='id'/> |
| reported_by | string | No | - |
| incident_date | string | No | - |
| due_date | string | No | - |
| created_at | string | No | - |
| updated_at | string | No | - |
| created_by | string | No | - |
| updated_by | string | No | - |

---

## travel_airports

List of airports for travel routing

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| name | string | Yes | - |
| code | string | Yes | - |
| hazards | array | No | - |
| created_at | string | No | - |
| updated_at | string | No | - |
| organization_id | string | No | - |
| user_id | string | No | - |

---

## migration_rename_log

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | integer | Yes | Note:
This is a Primary Key.<pk/> |
| old_table_name | string | No | - |
| new_table_name | string | No | - |
| rename_status | string | No | - |
| error_message | string | No | - |
| renamed_at | string | No | - |

---

## a_02400_contractor_vetting_data

Contractor vetting specific metadata

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| document_id | string | Yes | Reference to main document

Note:
This is a Foreign Key to `a_02400_contractor_vetting_documents.id`.<fk table='a_02400_contractor_vetting_documents' column='id'/> |
| contractor_name | string | No | Name of contractor |
| evaluation_score | integer | No | Evaluation score (0-100) |
| confidence_level | integer | No | AI confidence level (0-100) |
| commentary | string | No | AI generated commentary |
| extracted_data | unknown | No | JSON data extracted from documents |
| ai_analysis | unknown | No | AI analysis results |
| created_at | string | No | - |
| updated_at | string | No | - |

---

## processing_statistics

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| organization_name | string | No | - |
| processing_type | string | No | - |
| processing_status | string | No | - |
| file_type | string | No | - |
| total_count | integer | No | - |
| avg_processing_time | number | No | - |
| avg_extracted_fields | number | No | - |
| earliest_entry | string | No | - |
| latest_entry | string | No | - |

---

## a_00872_developer_vector

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| embedding | string | No | - |
| metadata | unknown | No | - |
| content | string | No | - |
| created_by_user_id | integer | No | - |
| access_scope | string | No | - |
| organisation_id | integer | No | - |
| shared_with_disciplines | string | No | - |
| chunks | unknown | No | - |
| discipline_code | string | No | - |
| isolation_metadata | unknown | No | - |
| project_id | integer | No | - |
| workspace_id | integer | No | - |
| workspace_type | string | No | - |

---

## chatbot_performance_summary

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| page_id | string | No | - |
| metric_type | string | No | - |
| metric_count | integer | No | - |
| avg_value | number | No | - |
| min_value | number | No | - |
| max_value | number | No | - |
| hour_recorded | string | No | - |

---

## templates

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| type | string | Yes | Template type (form_template, questionnaire, etc.) - not unique since same types can be used across disciplines |
| name | string | Yes | - |
| description | string | No | - |
| version | string | No | - |
| prompt_template | string | Yes | - |
| validation_config | unknown | No | - |
| ui_config | unknown | No | - |
| is_active | boolean | No | - |
| is_public | boolean | No | - |
| created_by | string | No | - |
| updated_by | string | No | - |
| usage_count | integer | No | - |
| success_rate | number | No | - |
| average_generation_time | integer | No | - |
| tags | array | No | - |
| created_at | string | No | - |
| updated_at | string | No | - |
| discipline_code | string | No | EPCM discipline code (01300=Governance, 00850=Civil, 01900=Procurement, 02400=HSSE) |
| document_type | string | No | Specific document type within the discipline (questionnaire, form, assessment, etc.) |
| discipline | string | No | - |
| copied_from_template_id | string | No | References the original template this was copied from

Note:
This is a Foreign Key to `templates.id`.<fk table='templates' column='id'/> |
| template_scope | string | No | Indicates if template is original, copied, or project-specific |
| target_discipline | string | No | The discipline this template was copied to (for copied templates) |
| copy_metadata | unknown | No | Additional metadata about the copy operation |
| processing_status | string | No | - |
| organization_id | string | No | - |
| suitable_for_document_types | array | No | Array of document types this template is suitable for (purchase_order, work_order, service_order) |
| category | string | No | - |
| deleted_at | string | No | - |
| deleted_by | string | No | - |
| deletion_reason | string | No | - |
| metadata | unknown | No | Discipline-specific metadata and configuration (e.g., procurement codes, category mappings, protection settings) |

---

## a_00895_dirproject_vector

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| embedding | string | No | - |
| metadata | unknown | No | - |
| content | string | No | - |
| created_by_user_id | integer | No | - |
| access_scope | string | No | - |
| organisation_id | integer | No | - |
| shared_with_disciplines | string | No | - |
| chunks | unknown | No | - |
| discipline_code | string | No | - |
| isolation_metadata | unknown | No | - |
| project_id | integer | No | - |
| workspace_id | integer | No | - |
| workspace_type | string | No | - |

---

## performance_alerts

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| alert_type | string | Yes | - |
| severity | string | Yes | - |
| title | string | Yes | - |
| description | string | No | - |
| metadata | unknown | No | - |
| is_active | boolean | Yes | - |
| discipline_code | string | No | - |
| created_by | string | No | - |
| created_at | string | No | - |
| resolved_at | string | No | - |
| resolved_by | string | No | - |

---

## compliance_reports

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | integer | Yes | Note:
This is a Primary Key.<pk/> |
| report_id | string | Yes | - |
| project_id | string | Yes | - |
| inspection_id | string | No | - |
| report_period | string | No | - |
| compliance_rate | number | No | - |
| inspections_completed | integer | No | - |
| total_inspections | integer | No | - |
| defects_found | integer | No | - |
| critical_findings | integer | No | - |
| recommendations | unknown | No | - |
| regulations | unknown | No | - |
| status | string | No | - |
| generated_at | string | No | - |
| created_by | string | No | - |
| created_at | string | No | - |
| updated_at | string | No | - |
| organization_id | string | No | - |
| user_id | string | No | - |

---

## agents_tracking

Tracks AI agents by company, sector, organization, phase, and page assignments

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| agent_name | string | Yes | Name of the AI agent |
| company | string | No | Company the agent is assigned to |
| sector | string | No | Sector the agent operates in |
| organization | string | No | Organization within the company |
| phase | string | No | Project phase the agent is active in |
| page_id | string | No | Reference to the page the agent is associated with

Note:
This is a Foreign Key to `pages.page_id`.<fk table='pages' column='page_id'/> |
| page_name | string | No | Name of the associated page |
| page_prefix | string | No | Prefix of the associated page |
| contributor_id | string | No | ID of the contributor responsible for this agent |
| created_at | string | No | - |
| updated_at | string | No | - |
| is_active | boolean | No | - |
| notes | string | No | Additional notes about the agent |
| last_used | string | No | Timestamp when the agent was last used |
| organization_id | string | No | - |
| user_id | string | No | - |

---

## accordion_sections

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| section_key | string | Yes | - |
| title | string | Yes | - |
| option_id | integer | Yes | - |
| sector | string | Yes | - |
| parent_section_key | string | No | - |
| display_order | integer | Yes | - |
| is_active | boolean | No | - |
| created_at | string | No | - |
| updated_at | string | No | - |
| hierarchy_level | integer | No | - |
| is_virtual | boolean | No | - |
| description | string | No | - |
| icon_class | string | No | - |
| organization_id | string | No | Note:
This is a Foreign Key to `organizations.id`.<fk table='organizations' column='id'/> |

---

## project_permissions

User-based project access control with phase-level permissions

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| project_id | string | Yes | Project ID reference |
| user_id | string | Yes | User ID (UUID as text) |
| has_access | boolean | Yes | Whether user has project access |
| phases_access | unknown | No | Array of accessible phase IDs |
| created_at | string | No | - |
| updated_at | string | No | - |
| created_by | string | No | - |
| updated_by | string | No | - |

---

## task_sequence_execution

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| organization_id | string | No | Note:
This is a Foreign Key to `organizations.id`.<fk table='organizations' column='id'/> |
| procurement_order_id | string | No | Note:
This is a Foreign Key to `procurement_orders.id`.<fk table='procurement_orders' column='id'/> |
| template_variation | string | Yes | - |
| template_variation_id | string | No | Note:
This is a Foreign Key to `template_variation_sequences.id`.<fk table='template_variation_sequences' column='id'/> |
| planned_sequence | unknown | Yes | - |
| actual_sequence | unknown | No | - |
| sequence_adherence | number | No | - |
| total_tasks | integer | No | - |
| completed_tasks | integer | No | - |
| current_task_position | integer | No | - |
| parallel_groups_active | integer | No | - |
| estimated_completion_time | string | No | - |
| actual_completion_time | string | No | - |
| deviations | unknown | No | - |
| bottlenecks | unknown | No | - |
| performance_metrics | unknown | No | - |
| status | string | No | - |
| started_at | string | No | - |
| completed_at | string | No | - |
| created_at | string | No | - |
| updated_at | string | No | - |

---

## quality_checks

Quality inspection and validation tasks across projects

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| title | string | Yes | - |
| description | string | No | - |
| check_type | string | No | - |
| severity | string | No | - |
| location | string | No | - |
| status | string | No | - |
| assigned_to | string | No | - |
| organization_id | string | No | Note:
This is a Foreign Key to `organizations.id`.<fk table='organizations' column='id'/> |
| project_id | string | No | Note:
This is a Foreign Key to `projects.id`.<fk table='projects' column='id'/> |
| due_date | string | No | - |
| created_at | string | No | - |
| updated_at | string | No | - |
| created_by | string | No | - |
| updated_by | string | No | - |

---

## order_derived_template_usage

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| template_id | string | No | Note:
This is a Foreign Key to `procurement_templates.id`.<fk table='procurement_templates' column='id'/> |
| order_id | string | No | Note:
This is a Foreign Key to `procurement_orders.id`.<fk table='procurement_orders' column='id'/> |
| user_id | string | No | Note:
This is a Foreign Key to `user_management.user_id`.<fk table='user_management' column='user_id'/> |
| action_type | string | No | - |
| time_saved_minutes | integer | No | - |
| fields_modified | unknown | No | - |
| created_at | string | No | - |
| organization_id | string | No | Note:
This is a Foreign Key to `organizations.id`.<fk table='organizations' column='id'/> |

---

## email_drafts

Draft emails that haven't been sent yet

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| user_id | string | Yes | Note:
This is a Foreign Key to `user_management.user_id`.<fk table='user_management' column='user_id'/> |
| account_id | string | Yes | Note:
This is a Foreign Key to `user_email_accounts.id`.<fk table='user_email_accounts' column='id'/> |
| to_emails | array | Yes | - |
| cc_emails | array | No | - |
| bcc_emails | array | No | - |
| subject | string | Yes | - |
| body_text | string | No | - |
| body_html | string | No | - |
| is_reply | boolean | No | - |
| is_forward | boolean | No | - |
| original_email_id | string | No | Note:
This is a Foreign Key to `emails.id`.<fk table='emails' column='id'/> |
| priority | string | No | - |
| scheduled_send_at | string | No | - |
| is_scheduled | boolean | No | - |
| auto_saved_at | string | No | - |
| created_at | string | No | - |
| updated_at | string | No | - |

---

## role_definitions

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | integer | Yes | Note:
This is a Primary Key.<pk/> |
| role_name | string | Yes | - |
| permissions | unknown | Yes | - |
| created_at | string | No | - |
| updated_at | string | No | - |
| description | string | No | - |
| is_active | boolean | No | - |

---

## civil_engineering_documents

Dedicated table for civil engineering technical documents (adapted from procurement orders workflow)

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| document_number | string | No | Auto-generated unique document number (SP-2025-001, CA-2025-001, DR-2025-001, etc.) |
| document_type | string | Yes | Type of engineering document: specifications, calculations, drawings, reports, technical_notes, method_statements |
| title | string | Yes | - |
| description | string | No | - |
| discipline | string | No | Engineering discipline: civil, structural, geotechnical, transportation, etc. |
| priority | string | No | - |
| engineering_standard | string | No | Applicable engineering standard (BS, SANS, Eurocode, etc.) |
| design_code | string | No | Specific design code reference |
| project_phase | string | No | Current project phase for document filtering and suggestions |
| project_id | string | No | Reference to projects table for project context awareness

Note:
This is a Foreign Key to `projects.id`.<fk table='projects' column='id'/> |
| project_location | string | No | - |
| project_scale | string | No | - |
| template_id | string | No | Note:
This is a Foreign Key to `master_engineering_templates.id`.<fk table='master_engineering_templates' column='id'/> |
| linked_documents | unknown | No | JSON array of linked documents with metadata for document integration feature |
| approval_status | string | No | - |
| issue_date | string | No | - |
| revision_date | string | No | - |
| review_deadline | string | No | - |
| technical_requirements | string | No | - |
| compliance_requirements | string | No | - |
| quality_standards | string | No | - |
| created_by | string | Yes | - |
| organization_id | string | No | Note:
This is a Foreign Key to `organizations.id`.<fk table='organizations' column='id'/> |
| created_at | string | No | - |
| updated_at | string | No | - |

---

## chatbot_audit_logs

Comprehensive audit trail for all chatbot and API access activities

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| user_id | string | No | - |
| user_email | string | No | - |
| action | string | Yes | - |
| resource_type | string | Yes | - |
| resource_id | string | No | - |
| discipline_code | string | No | - |
| ip_address | string | No | - |
| user_agent | string | No | - |
| success | boolean | Yes | - |
| error_message | string | No | - |
| metadata | unknown | No | - |
| created_at | string | Yes | - |

---

## governance_document_templates_backup_20251121

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | No | - |
| organization_id | string | No | - |
| organization_name | string | No | - |
| discipline_id | string | No | - |
| discipline_name | string | No | - |
| template_name | string | No | - |
| template_slug | string | No | - |
| html_content | string | No | - |
| json_schema | unknown | No | - |
| form_metadata | unknown | No | - |
| source_file_name | string | No | - |
| source_file_type | string | No | - |
| extracted_fields_count | integer | No | - |
| extraction_method | string | No | - |
| processing_status | string | No | - |
| version | integer | No | - |
| parent_template_id | string | No | - |
| is_default | boolean | No | - |
| is_active | boolean | No | - |
| created_by | string | No | - |
| updated_by | string | No | - |
| created_at | string | No | - |
| updated_at | string | No | - |
| deleted_at | string | No | - |
| content_schema | unknown | No | - |
| processing_method | string | No | - |
| document_type | string | No | - |
| document_type_label | string | No | - |
| source_governance_template_id | string | No | - |

---

## chatbots

Stores configurations for chatbots, mapping pages and states to Flowise flow IDs.

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| page | string | Yes | Note:
This is a Primary Key.<pk/> |
| state | string | Yes | Note:
This is a Primary Key.<pk/> |
| flow_id | string | Yes | - |
| input_placeholder | string | No | Optional placeholder text for the chat input field. |
| sector | string | No | - |
| sector_id | string | No | Note:
This is a Foreign Key to `sectors.sector_id`.<fk table='sectors' column='sector_id'/> |
| updated_at | string | No | - |

---

## maintenance_work_orders

Work orders for maintenance tasks

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| asset_id | string | No | Note:
This is a Foreign Key to `maintenance_assets.id`.<fk table='maintenance_assets' column='id'/> |
| asset_name | string | Yes | - |
| type | string | Yes | - |
| priority | string | No | - |
| status | string | No | - |
| title | string | Yes | - |
| description | string | Yes | - |
| assigned_to | string | No | - |
| assigned_to_name | string | No | - |
| created_by | string | No | - |
| due_date | string | No | - |
| start_date | string | No | - |
| completion_date | string | No | - |
| estimated_hours | number | No | - |
| actual_hours | number | No | - |
| cost | number | No | - |
| parts_used | string | No | - |
| notes | string | No | - |
| project_id | string | No | - |
| created_at | string | No | - |
| updated_at | string | No | - |
| organization_id | string | No | - |

---

## alert_configurations

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| alert_type | string | Yes | - |
| threshold_value | number | Yes | - |
| threshold_operator | string | Yes | - |
| enabled | boolean | Yes | - |
| notification_channels | array | No | - |
| discipline_code | string | No | - |
| created_by | string | No | - |
| created_at | string | No | - |

---

## user_vetting_permissions

Cached user permissions to improve performance and reduce database load. Auto-expires after 1 hour.

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| user_id | string | Yes | - |
| permissions | unknown | Yes | - |
| last_updated | string | No | - |
| expires_at | string | No | - |
| created_at | string | No | - |
| updated_at | string | No | - |

---

## numbering_methodologies

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| name | string | Yes | - |
| description | string | No | - |
| organization_id | string | Yes | - |
| pattern_template | string | Yes | - |
| is_default | boolean | No | - |
| created_at | string | No | - |
| updated_at | string | No | - |

---

## cv_application_stats

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| total_applications | integer | No | - |
| pending_count | integer | No | - |
| under_review_count | integer | No | - |
| interview_scheduled_count | integer | No | - |
| approved_count | integer | No | - |
| rejected_count | integer | No | - |
| on_hold_count | integer | No | - |
| average_rating | number | No | - |
| applications_this_week | integer | No | - |
| applications_this_month | integer | No | - |

---

## governance_approval_instances

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| matrix_id | string | No | Note:
This is a Foreign Key to `governance_approval_matrices.id`.<fk table='governance_approval_matrices' column='id'/> |
| document_id | string | No | - |
| document_title | string | Yes | - |
| document_number | string | No | - |
| department_code | string | Yes | - |
| requester_id | string | No | - |
| requester_name | string | Yes | - |
| current_level | integer | No | - |
| status | string | No | - |
| started_at | string | No | - |
| deadline_at | string | No | - |
| escalated_at | string | No | - |
| approved_at | string | No | - |
| approved_by | string | No | - |
| rejection_reason | string | No | - |
| created_at | string | No | - |
| updated_at | string | No | - |
| document_version_major | integer | No | - |
| document_version_minor | integer | No | - |
| document_version_revision | string | No | - |
| organization_id | string | No | - |
| created_by | string | No | - |

---

## a_02400_safety_vector

RLS disabled for testing

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | integer | Yes | Note:
This is a Primary Key.<pk/> |
| content | string | Yes | - |
| safetydataid | integer | No | Note:
This is a Foreign Key to `a_02400_safety_data.id`.<fk table='a_02400_safety_data' column='id'/> |
| companyid | integer | Yes | - |
| projectid | integer | Yes | - |
| contractid | integer | Yes | - |
| contracttypeid | integer | Yes | - |
| embedding | string | No | - |
| userrole | string | Yes | - |
| created_at | string | No | - |
| created_by_user_id | integer | No | - |
| access_scope | string | No | - |
| organisation_id | integer | No | - |
| shared_with_disciplines | string | No | - |
| chunks | unknown | No | - |
| discipline_code | string | No | - |
| isolation_metadata | unknown | No | - |
| project_id | integer | No | - |
| workspace_id | integer | No | - |
| workspace_type | string | No | - |

---

## suppliers

Table to store supplier information for procurement

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | integer | Yes | Note:
This is a Primary Key.<pk/> |
| name | string | Yes | - |
| created_at | string | No | - |
| updated_at | string | No | - |
| address | string | No | - |
| email | string | No | - |
| phone | string | No | - |
| contact_person | string | No | - |
| project_id | string | No | Note:
This is a Foreign Key to `projects.id`.<fk table='projects' column='id'/> |
| supplier_type | string | No | Type of supplier (e.g., materials, equipment, services) |
| website | string | No | Supplier website URL |
| approval_status | string | No | Current approval status of the supplier |
| goods_services | string | No | Description of goods and services provided |
| rating | number | No | Supplier rating (0-5 scale) |
| completed_projects | integer | No | Number of completed projects |
| registration_date | string | No | Date when supplier was registered |
| last_activity | string | No | Timestamp of last activity/update |
| tax_number | string | No | Tax/VAT registration number |
| compliance_status | string | No | Current compliance status |
| source_url | string | No | URL where supplier information was scraped from |
| scrape_method | string | No | Method used for scraping (e.g., tavily_search, manual) |
| scraped_at | string | No | Timestamp when supplier was scraped |
| organization_id | string | No | - |
| user_id | string | No | - |

---

## template_relationships

Links templates together for complex document assemblies

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| parent_template_id | string | Yes | - |
| child_template_id | string | Yes | - |
| relationship_type | string | Yes | - |
| section_path | string | No | - |
| is_required | boolean | No | - |
| sort_order | integer | No | - |
| created_at | string | No | - |
| created_by | string | No | - |
| organization_id | string | No | - |

---

## form_templates

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| template_name | string | Yes | - |
| html_content | string | No | - |
| json_schema | unknown | No | - |
| processing_status | string | No | - |
| organization_name | string | No | - |
| discipline_id | string | No | Note:
This is a Foreign Key to `disciplines.id`.<fk table='disciplines' column='id'/> |
| discipline_name | string | No | - |
| created_by | string | No | - |
| created_at | string | No | - |
| updated_at | string | No | - |
| form_metadata | unknown | No | - |
| organization_id | string | No | Note:
This is a Foreign Key to `organizations.id`.<fk table='organizations' column='id'/> |

---

## a_01000_environmental_vector

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| embedding | string | No | - |
| metadata | unknown | No | - |
| content | string | No | - |
| created_by_user_id | integer | No | - |
| access_scope | string | No | - |
| organisation_id | integer | No | - |
| shared_with_disciplines | string | No | - |
| chunks | unknown | No | - |
| discipline_code | string | No | - |
| isolation_metadata | unknown | No | - |
| project_id | integer | No | - |
| workspace_id | integer | No | - |
| workspace_type | string | No | - |

---

## tender_evaluation

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| tender_id | string | Yes | Note:
This is a Foreign Key to `tenders.id`.<fk table='tenders' column='id'/> |
| criterion_name | string | Yes | - |
| criterion_description | string | No | - |
| weightage | number | Yes | - |
| max_score | number | Yes | - |
| evaluation_method | string | No | - |
| is_mandatory | boolean | No | - |
| created_at | string | No | - |

---

## user_management

Comprehensive user management table with profile, contact, auth, and business fields

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| user_id | string | Yes | Note:
This is a Primary Key.<pk/> |
| email | string | Yes | - |
| role | string | No | - |
| active | boolean | No | - |
| status | string | No | - |
| created_at | string | No | - |
| updated_at | string | No | - |
| created_by | string | No | - |
| updated_by | string | No | - |
| employer | string | No | - |
| first_name | string | No | - |
| last_name | string | No | - |
| display_name | string | No | User preferred display name, overrides full_name |
| full_name | string | No | Auto-generated from first_name + last_name via trigger |
| preferred_name | string | No | - |
| phone | string | No | - |
| mobile | string | No | - |
| address | string | No | - |
| city | string | No | - |
| state_province | string | No | - |
| postal_code | string | No | - |
| country | string | No | - |
| job_title | string | No | - |
| department | string | No | - |
| division | string | No | - |
| cost_center | string | No | - |
| manager_id | string | No | Note:
This is a Foreign Key to `user_management.user_id`.<fk table='user_management' column='user_id'/> |
| employee_id | string | No | - |
| hire_date | string | No | - |
| employment_type | string | No | employee, contractor, consultant, intern, etc. |
| security_clearance | string | No | - |
| password_hash | string | No | - |
| password_salt | string | No | - |
| last_login | string | No | - |
| login_count | integer | No | - |
| failed_login_attempts | integer | No | - |
| account_locked_until | string | No | - |
| password_reset_token | string | No | - |
| password_reset_expires | string | No | - |
| email_verified | boolean | No | - |
| email_verification_token | string | No | - |
| two_factor_enabled | boolean | No | - |
| two_factor_secret | string | No | - |
| avatar_url | string | No | - |
| bio | string | No | - |
| timezone | string | No | - |
| locale | string | No | - |
| theme_preference | string | No | - |
| notification_preferences | unknown | No | JSON object for email/push notification settings |
| user_preferences | unknown | No | JSON object for user UI/UX preferences |
| last_activity | string | No | - |
| session_token | string | No | - |
| session_expires | string | No | - |
| terms_accepted_at | string | No | - |
| privacy_policy_accepted_at | string | No | - |
| data_retention_policy | string | No | - |
| account_deletion_requested_at | string | No | - |
| contractor_company | string | No | - |
| consultant_rate | number | No | - |
| billing_currency | string | No | - |
| project_access_level | string | No | standard, elevated, restricted, admin |
| disciplines | unknown | No | JSON array of engineering disciplines user works in |
| certifications | unknown | No | - |
| emergency_contact | unknown | No | - |
| passport_number | string | No | Primary passport number for international travel |
| passport_expiry_date | string | No | Passport expiry date - must be validated before booking flights |
| passport_issue_date | string | No | - |
| passport_issuing_country | string | No | - |
| alternative_travel_docs | unknown | No | JSON array of alternative travel documents (visa, green card, resident permit, etc.) |
| date_of_birth | string | No | - |
| gender | string | No | - |
| nationality | string | No | - |
| residence_country | string | No | - |
| title | string | No | - |
| visa_requirements | unknown | No | JSON array of visa requirements for different destinations |
| frequent_flyer_programs | unknown | No | JSON array of frequent flyer program memberships and account numbers |
| medical_info | unknown | No | - |
| dietary_restrictions | array | No | - |
| special_assistance | string | No | - |
| organization_id | string | No | - |

---

## timesheet_descriptions

Timesheet task descriptions and codes per project

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Unique identifier for the description

Note:
This is a Primary Key.<pk/> |
| project_id | string | No | Reference to the project

Note:
This is a Foreign Key to `projects.id`.<fk table='projects' column='id'/> |
| code | string | Yes | Task code for timesheet entry |
| description | string | Yes | Detailed task description |
| category | string | No | Task category for grouping |
| is_active | boolean | No | Whether the description is active for use |
| created_at | string | No | - |
| updated_at | string | No | - |
| created_by | string | No | - |
| updated_by | string | No | - |

---

## migration_validation_results

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | integer | Yes | Note:
This is a Primary Key.<pk/> |
| check_name | string | No | - |
| check_type | string | No | - |
| status | string | No | - |
| details | string | No | - |
| checked_at | string | No | - |

---

## accordion_sections_directors_backup_20250726

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | No | - |
| section_key | string | No | - |
| title | string | No | - |
| option_id | integer | No | - |
| sector | string | No | - |
| parent_section_key | string | No | - |
| display_order | integer | No | - |
| is_active | boolean | No | - |
| created_at | string | No | - |
| updated_at | string | No | - |

---

## discipline_extraction_prompts

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| discipline_code | string | Yes | - |
| display_name | string | Yes | - |
| system_prompt | string | Yes | - |
| extraction_fields | unknown | Yes | - |
| extraction_focus | unknown | Yes | - |
| document_types | unknown | Yes | - |
| is_active | boolean | No | - |
| version | integer | No | - |
| created_by | string | No | - |
| created_at | string | No | - |
| updated_at | string | No | - |

---

## document_variation_sections

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| variation_id | string | Yes | Note:
This is a Foreign Key to `document_variations.id`.<fk table='document_variations' column='id'/> |
| section_code | string | Yes | - |
| section_name | string | Yes | - |
| section_type | string | Yes | - |
| display_order | integer | Yes | - |
| required | boolean | No | - |
| organization_id | string | Yes | - |
| created_at | string | No | - |

---

## pages_with_clear_columns

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| page_id | string | No | Note:
This is a Primary Key.<pk/> |
| page_prefix | string | No | - |
| page_name | string | No | - |
| page_slug | string | No | - |
| sector_id | string | No | Note:
This is a Foreign Key to `sectors.sector_id`.<fk table='sectors' column='sector_id'/> |
| organization_id | string | No | Note:
This is a Foreign Key to `organizations.id`.<fk table='organizations' column='id'/> |
| sector_uuid | string | No | Note:
This is a Foreign Key to `organizations.id`.<fk table='organizations' column='id'/> |
| old_sector_id | string | No | Note:
This is a Foreign Key to `organizations.id`.<fk table='organizations' column='id'/> |
| organisation_name | string | No | - |
| sector_name | string | No | - |
| created_at | string | No | - |
| updated_at | string | No | - |
| display_order | integer | No | - |
| parent_page_id | string | No | Note:
This is a Foreign Key to `pages.page_id`.<fk table='pages' column='page_id'/> |
| data_consistency | string | No | - |

---

## v_document_usage_analytics

Analytics on which documents are most referenced in chats

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| discipline_code | string | No | - |
| company_name | string | No | - |
| project_name | string | No | - |
| document_reference | string | No | - |
| reference_count | integer | No | - |
| sessions_referencing | integer | No | - |
| users_referencing | integer | No | - |
| avg_rating_when_referenced | number | No | - |
| last_referenced | string | No | - |

---

## ui_button_settings

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | integer | Yes | Note:
This is a Primary Key.<pk/> |
| company_id | integer | Yes | - |
| button_option_id | integer | No | Note:
This is a Foreign Key to `button_options.id`.<fk table='button_options' column='id'/> |
| is_visible | boolean | No | - |
| user_type | string | Yes | - |
| created_at | string | No | - |
| updated_at | string | No | - |
| organization_id | string | No | - |
| user_id | string | No | - |

---

## document_routing_workflows

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | integer | Yes | Note:
This is a Primary Key.<pk/> |
| document_id | string | No | Note:
This is a Foreign Key to `a_00900_doccontrol_documents.id`.<fk table='a_00900_doccontrol_documents' column='id'/> |
| version_id | integer | No | Note:
This is a Foreign Key to `a_00900_doccontrol_document_versions.id`.<fk table='a_00900_doccontrol_document_versions' column='id'/> |
| template_id | integer | No | Note:
This is a Foreign Key to `document_routing_templates.id`.<fk table='document_routing_templates' column='id'/> |
| workflow_name | string | No | - |
| workflow_status | string | No | - |
| current_step_order | integer | No | - |
| initiated_by | string | No | Note:
This is a Foreign Key to `user_management.user_id`.<fk table='user_management' column='user_id'/> |
| deadline | string | No | - |
| completed_at | string | No | - |
| created_at | string | No | - |
| updated_at | string | No | - |

---

## document_number_sequences

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| discipline_code | string | Yes | Note:
This is a Primary Key.<pk/> |
| document_type | string | Yes | Note:
This is a Primary Key.<pk/> |
| organization_id | string | Yes | Note:
This is a Primary Key.<pk/> |
| current_value | integer | Yes | - |

---

## document_ai_analysis

Stores AI analysis results for uploaded documents including confidence scores and human corrections

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| document_id | string | No | Note:
This is a Foreign Key to `a_00900_doccontrol_documents.id`.<fk table='a_00900_doccontrol_documents' column='id'/> |
| analysis_results | unknown | Yes | JSON containing AI extracted metadata, document type, entities, etc. |
| confidence_scores | unknown | Yes | JSON containing confidence scores for each AI prediction |
| human_corrections | unknown | No | JSON containing any manual corrections made by users |
| processing_status | string | No | - |
| created_at | string | No | - |
| updated_at | string | No | - |

---

## v_chat_session_summary

Summary of chat sessions with project context for IT dashboard

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | No | Note:
This is a Primary Key.<pk/> |
| user_id | string | No | - |
| discipline_code | string | No | - |
| chatbot_type | string | No | - |
| company_name | string | No | - |
| organisation_name | string | No | - |
| project_name | string | No | - |
| project_phase_name | string | No | - |
| session_title | string | No | - |
| total_messages | integer | No | - |
| total_documents_referenced | integer | No | - |
| avg_response_time_ms | integer | No | - |
| created_at | string | No | - |
| last_activity_at | string | No | - |
| is_active | boolean | No | - |
| session_duration_minutes | number | No | - |
| latest_message | string | No | - |
| avg_user_rating | number | No | - |

---

## accordion_structure

Complete view of accordion structure using existing section_organization_mapping

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| section_id | string | No | Note:
This is a Primary Key.<pk/> |
| section_key | string | No | - |
| section_name | string | No | - |
| section_description | string | No | - |
| section_icon | string | No | - |
| organization_id | string | No | Note:
This is a Foreign Key to `organizations.id`.<fk table='organizations' column='id'/> |
| project_id | string | No | - |
| phase_id | string | No | - |
| section_display_order | integer | No | - |
| is_visible | boolean | No | - |
| page_id | string | No | Note:
This is a Primary Key.<pk/> |
| page_name | string | No | - |
| page_slug | string | No | - |
| page_display_order | integer | No | - |
| is_subsection | boolean | No | - |
| parent_page_id | string | No | Note:
This is a Foreign Key to `pages.page_id`.<fk table='pages' column='page_id'/> |
| organization_name | string | No | - |
| project_name | string | No | - |
| phase_name | string | No | - |

---

## document_sections

Stores detailed section content within hierarchical document structures

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| structure_id | string | Yes | Note:
This is a Foreign Key to `template_document_structures.id`.<fk table='template_document_structures' column='id'/> |
| section_path | string | Yes | - |
| level_name | string | Yes | - |
| level_number | string | Yes | - |
| title | string | No | - |
| content | unknown | No | - |
| metadata | unknown | No | - |
| parent_section_id | string | No | Note:
This is a Foreign Key to `document_sections.id`.<fk table='document_sections' column='id'/> |
| sort_order | integer | No | - |
| is_required | boolean | No | - |
| created_at | string | No | - |
| updated_at | string | No | - |
| organization_id | string | No | - |
| user_id | string | No | - |

---

## scope_of_work_relationships

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| scope_of_work_id | string | No | - |
| related_document_id | string | No | - |
| relationship_type | string | No | - |
| procurement_code | string | No | - |
| description | string | No | - |
| is_active | boolean | No | - |
| created_by | string | No | - |
| created_at | string | No | - |

---

## integration_sync_history

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| integration_source_id | string | No | Note:
This is a Foreign Key to `integration_sources.id`.<fk table='integration_sources' column='id'/> |
| sync_type | string | No | - |
| status | string | Yes | - |
| records_processed | integer | No | - |
| records_created | integer | No | - |
| records_updated | integer | No | - |
| records_failed | integer | No | - |
| start_time | string | Yes | - |
| end_time | string | No | - |
| duration_seconds | integer | No | - |
| error_message | string | No | - |
| sync_metadata | unknown | No | - |
| created_at | string | No | - |

---

## contractors

Table to store contractor information for projects

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| name | string | Yes | - |
| created_at | string | No | - |
| updated_at | string | No | - |
| address | string | No | Physical address of the contractor. |
| email | string | No | Primary contact email address for the contractor. |
| phone | string | No | Primary contact phone number for the contractor. |
| contact_person | string | No | Name of the primary contact person at the contractor. |
| project_id | string | No | Note:
This is a Foreign Key to `projects.id`.<fk table='projects' column='id'/> |
| contractor_type | string | No | Type of contractor (e.g., general, electrical, plumbing) |
| construction_type | string | No | Type of construction (EPCM, EPC, Construction Only, Design-Build) |
| sector | string | No | Industry sector (Mining, Oil & Gas, Power Generation, etc) |
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| organization_id | string | No | - |
| user_id | string | No | - |

---

## v_chat_issues

Identifies chat sessions with performance or satisfaction issues

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| session_id | string | No | Note:
This is a Primary Key.<pk/> |
| discipline_code | string | No | - |
| chatbot_type | string | No | - |
| company_name | string | No | - |
| project_name | string | No | - |
| created_at | string | No | - |
| performance_issue | string | No | - |
| avg_response_time_ms | integer | No | - |
| total_messages | integer | No | - |
| avg_rating | number | No | - |
| error_message_count | integer | No | - |

---

## a_02200_qa_vector

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| embedding | string | No | - |
| metadata | unknown | No | - |
| content | string | No | - |
| created_by_user_id | integer | No | - |
| access_scope | string | No | - |
| organisation_id | integer | No | - |
| shared_with_disciplines | string | No | - |
| chunks | unknown | No | - |
| discipline_code | string | No | - |
| isolation_metadata | unknown | No | - |
| project_id | integer | No | - |
| workspace_id | integer | No | - |
| workspace_type | string | No | - |

---

## email_notification_queue

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| approval_instance_id | string | No | Note:
This is a Foreign Key to `governance_approval_instances.id`.<fk table='governance_approval_instances' column='id'/> |
| user_id | string | No | - |
| email_type | string | Yes | - |
| email_subject | string | No | - |
| email_body | string | No | - |
| send_after | string | No | - |
| sent_at | string | No | - |
| created_at | string | No | - |

---

## legal_reviews

Legal reviews and compliance checks for contracts and documents

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| title | string | Yes | - |
| description | string | No | - |
| review_type | string | No | - |
| document_type | string | No | - |
| urgency | string | No | - |
| status | string | No | - |
| assigned_to | string | No | - |
| organization_id | string | No | Note:
This is a Foreign Key to `organizations.id`.<fk table='organizations' column='id'/> |
| project_id | string | No | Note:
This is a Foreign Key to `projects.id`.<fk table='projects' column='id'/> |
| due_date | string | No | - |
| created_at | string | No | - |
| updated_at | string | No | - |
| created_by | string | No | - |
| updated_by | string | No | - |

---

## imported_emails_with_placeholder_users

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| email_id | string | No | Note:
This is a Primary Key.<pk/> |
| subject | string | No | - |
| sender_email | string | No | - |
| recipient_email | string | No | - |
| sent_date | string | No | - |
| user_id | string | No | Note:
This is a Primary Key.<pk/> |
| user_email | string | No | - |
| user_active | boolean | No | - |
| is_placeholder_user | boolean | No | - |

---

## v_financial_overdue

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | No | Note:
This is a Primary Key.<pk/> |
| reference | string | No | - |
| description | string | No | - |
| amount | number | No | - |
| due_date | string | No | - |
| vendor | string | No | - |
| project | string | No | - |
| category | string | No | - |
| days_overdue | integer | No | - |

---

## sow_appendices

SOW appendices that require contribution and review from different disciplines

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| sow_id | string | No | Note:
This is a Foreign Key to `scope_of_work.id`.<fk table='scope_of_work' column='id'/> |
| appendix_type | string | Yes | - |
| title | string | Yes | - |
| description | string | No | - |
| status | string | No | - |
| assigned_to | string | No | - |
| organization_id | string | No | Note:
This is a Foreign Key to `organizations.id`.<fk table='organizations' column='id'/> |
| created_at | string | No | - |
| updated_at | string | No | - |
| created_by | string | No | - |
| updated_by | string | No | - |

---

## template_usage_stats

Analytics and usage statistics for templates

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| template_type | string | Yes | - |
| category | string | No | - |
| usage_count | integer | No | - |
| last_used | string | No | - |
| average_population_time | string | No | - |
| success_rate | number | No | - |
| common_populations | unknown | No | - |
| created_at | string | No | - |
| updated_at | string | No | - |

---

## a_02000_projctrl_vector

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | No | - |
| embedding | string | No | - |
| metadata | unknown | No | - |
| content | string | No | - |
| created_by_user_id | integer | No | - |
| access_scope | string | No | - |
| organisation_id | integer | No | - |
| shared_with_disciplines | unknown | No | - |
| chunks | unknown | No | - |
| discipline_code | string | No | - |
| isolation_metadata | unknown | No | - |
| project_id | integer | No | - |
| workspace_id | integer | No | - |
| workspace_type | string | No | - |

---

## a_00900_doccontrol_vector

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| embedding | string | No | - |
| metadata | unknown | No | - |
| content | string | No | - |
| created_by_user_id | integer | No | - |
| access_scope | string | No | - |
| organisation_id | integer | No | - |
| shared_with_disciplines | string | No | - |
| workspace_id | string | No | Note:
This is a Foreign Key to `vector_workspaces.id`.<fk table='vector_workspaces' column='id'/> |
| workspace_type | string | No | - |
| deleted_at | string | No | - |
| deleted_by | string | No | - |
| deletion_reason | string | No | - |
| scheduled_hard_delete_at | string | No | - |
| isolation_metadata | unknown | No | - |
| chunks | unknown | No | - |
| discipline_code | string | No | - |
| project_id | integer | No | - |

---

## external_party_document_instances

Standardized External Party Documents - HTML content in html_content TEXT, schema in content_schema JSONB

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| document_context | string | Yes | - |
| context_reference_id | string | No | - |
| source_table | string | Yes | - |
| source_template_id | string | Yes | - |
| template_snapshot | unknown | Yes | - |
| discipline_code | string | Yes | - |
| discipline_owner_id | string | No | Note:
This is a Foreign Key to `user_management.user_id`.<fk table='user_management' column='user_id'/> |
| organization_id | string | No | Note:
This is a Foreign Key to `organizations.id`.<fk table='organizations' column='id'/> |
| document_name | string | Yes | - |
| document_description | string | No | - |
| document_type | string | No | - |
| assigned_to_party_id | string | No | Optional UUID reference to external party. May reference contractors table, user_management, or other party tables. Not a foreign key to allow flexibility. The assigned_to_party_email field is the primary identifier. |
| assigned_to_party_email | string | Yes | - |
| assigned_to_party_name | string | No | - |
| assigned_to_party_org_name | string | No | - |
| assigned_to_party_type | string | No | - |
| created_by | string | No | Note:
This is a Foreign Key to `user_management.user_id`.<fk table='user_management' column='user_id'/> |
| created_at | string | No | - |
| reviewed_before_issue_by | string | No | Note:
This is a Foreign Key to `user_management.user_id`.<fk table='user_management' column='user_id'/> |
| reviewed_before_issue_at | string | No | - |
| pre_issue_review_notes | string | No | - |
| issued_by | string | No | Note:
This is a Foreign Key to `user_management.user_id`.<fk table='user_management' column='user_id'/> |
| issued_at | string | No | - |
| due_date | string | No | - |
| assignment_instructions | string | No | - |
| html_content | string | Yes | - |
| form_schema | unknown | No | DEPRECATED: Use content_schema. Remove post-migration. |
| party_responses | unknown | No | - |
| response_metadata | unknown | No | - |
| started_at | string | No | - |
| last_saved_at | string | No | - |
| submitted_at | string | No | - |
| reviewed_after_submission_by | string | No | Note:
This is a Foreign Key to `user_management.user_id`.<fk table='user_management' column='user_id'/> |
| reviewed_after_submission_at | string | No | - |
| post_submission_review_notes | string | No | - |
| review_decision | string | No | - |
| discipline_score | integer | No | - |
| discipline_max_score | integer | No | - |
| discipline_score_percentage | number | No | - |
| score_breakdown | unknown | No | - |
| scoring_comments | string | No | - |
| scored_by | string | No | Note:
This is a Foreign Key to `user_management.user_id`.<fk table='user_management' column='user_id'/> |
| scored_at | string | No | - |
| revision_count | integer | No | - |
| revision_history | unknown | No | - |
| status | string | No | - |
| access_token | string | No | - |
| access_expires_at | string | No | - |
| access_revoked | boolean | No | - |
| evaluation_package_id | string | No | - |
| evaluation_package_name | string | No | - |
| context_metadata | unknown | No | - |
| version | string | No | - |
| is_active | boolean | No | - |
| updated_at | string | No | - |
| updated_by | string | No | Note:
This is a Foreign Key to `user_management.user_id`.<fk table='user_management' column='user_id'/> |
| content_schema | unknown | No | - |

---

## projects

Projects belonging to companies

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| company_id | integer | No | - |
| name | string | Yes | - |
| project_type | string | No | - |
| created_at | string | No | - |
| updated_at | string | No | - |
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| project_number | string | No | - |
| project_description | string | No | - |
| site_location | string | No | - |
| delivery_date | string | No | - |
| completion_date | string | No | - |
| cost_center | string | No | - |
| budget_code | string | No | - |
| workflow_status | string | No | - |
| organization_id | string | No | - |
| user_id | string | No | - |

---

## document_hierarchy_definitions

Defines hierarchical structures for different document types (Part/Section/Clause/etc.)

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| discipline_id | string | Yes | - |
| document_type | string | Yes | - |
| hierarchy_levels | unknown | Yes | - |
| is_active | boolean | No | - |
| created_at | string | No | - |
| updated_at | string | No | - |
| created_by | string | No | - |
| organization_id | string | No | - |

---

## sow_templates

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| template_name | string | Yes | - |
| description | string | No | - |
| order_type | string | Yes | - |
| appendix_definitions | unknown | Yes | - |
| discipline_defaults | unknown | No | - |
| is_active | boolean | No | - |
| organization_id | string | No | Note:
This is a Foreign Key to `organizations.id`.<fk table='organizations' column='id'/> |
| created_by | string | No | - |
| created_at | string | No | - |
| updated_at | string | No | - |

---

## api_usage_summary

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| api_config_id | string | No | - |
| discipline_code | string | No | - |
| total_requests | integer | No | - |
| total_success | integer | No | - |
| total_errors | integer | No | - |
| avg_response_time | number | No | - |
| last_request | string | No | - |

---

## a_00900_doccontrol_approval_rules

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | integer | Yes | Note:
This is a Primary Key.<pk/> |
| discipline_id | integer | No | - |
| store_id | integer | No | - |
| doc_type | string | No | - |
| routing_mode | string | Yes | - |
| created_by | string | No | - |
| created_at | string | Yes | - |

---

## email_signatures

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| user_id | string | Yes | - |
| content | string | Yes | - |
| is_default | boolean | No | - |
| type | string | Yes | - |
| created_at | string | No | - |

---

## data_sheet_specifications

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| template_id | string | No | - |
| spec_type | string | No | - |
| spec_code | string | No | - |
| spec_name | string | No | - |
| specifications | unknown | No | - |
| compliance_standards | array | No | - |
| safety_requirements | array | No | - |
| supplier_name | string | No | - |
| manufacturer | string | No | - |
| model_number | string | No | - |
| serial_number | string | No | - |
| issue_date | string | No | - |
| expiry_date | string | No | - |
| revision_number | integer | No | - |
| procurement_code | string | No | - |
| created_by | string | No | - |
| created_at | string | No | - |

---

## a_01200_finance_vector

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| embedding | string | No | - |
| metadata | unknown | No | - |
| content | string | No | - |
| created_by_user_id | integer | No | - |
| access_scope | string | No | - |
| organisation_id | integer | No | - |
| shared_with_disciplines | string | No | - |
| chunks | unknown | No | - |
| discipline_code | string | No | - |
| isolation_metadata | unknown | No | - |
| project_id | integer | No | - |
| workspace_id | integer | No | - |
| workspace_type | string | No | - |

---

## equipment_documentation

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| equipment_id | string | Yes | Note:
This is a Foreign Key to `operations_equipment.id`.<fk table='operations_equipment' column='id'/> |
| storage_service | string | Yes | - |
| storage_url | string | Yes | - |
| document_id | string | Yes | - |
| sections | unknown | Yes | - |
| compliance_standards | array | No | - |
| created_at | string | No | - |
| updated_at | string | No | - |

---

## a_00800_design_vector

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| embedding | string | No | - |
| metadata | unknown | No | - |
| content | string | No | - |
| organization_id | string | No | - |
| user_id | string | No | - |
| created_by_user_id | integer | No | - |
| access_scope | string | No | - |
| organisation_id | string | No | - |
| shared_with_disciplines | string | No | - |
| chunks | unknown | No | - |

---

## task_history

Audit trail of all changes made to tasks

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| task_id | string | Yes | Note:
This is a Foreign Key to `tasks.id`.<fk table='tasks' column='id'/> |
| user_id | string | Yes | - |
| action | string | Yes | - |
| old_value | unknown | No | - |
| new_value | unknown | No | - |
| notes | string | No | - |
| created_at | string | No | - |

---

## vector_search_criteria

Stores dynamic search criteria for vector similarity searches across all disciplines

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| discipline | string | Yes | Discipline identifier (e.g., contracts_post_award, civil_engineering) |
| table_name | string | Yes | Name of the vector table to search (e.g., a_00435_contracts_post_vector) |
| search_name | string | Yes | Unique identifier for this search configuration within the discipline |
| description | string | No | - |
| filter_criteria | unknown | Yes | JSONB object containing the filter criteria for the search |
| is_active | boolean | No | - |
| created_at | string | No | - |
| updated_at | string | No | - |

---

## a_02400_contractor_vetting_documents

Contractor vetting documents integrated with 00900 document control system

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| file_path | string | Yes | - |
| file_name | string | Yes | - |
| file_extension | string | No | - |
| uploaded_by | string | No | - |
| uploaded_at | string | No | - |
| current_version_id | string | No | Note:
This is a Foreign Key to `a_02400_contractor_vetting_document_versions.id`.<fk table='a_02400_contractor_vetting_document_versions' column='id'/> |
| discipline | string | Yes | Discipline (Safety) |
| page_number | string | Yes | Associated with Safety page (02400) |
| created_at | string | No | - |
| updated_at | string | No | - |
| status | string | No | - |
| metadata_table_id | string | No | - |
| vetting_id | integer | No | Reference to contractor vetting record

Note:
This is a Foreign Key to `contractor_vetting.id`.<fk table='contractor_vetting' column='id'/> |
| section_id | integer | No | Reference to specific vetting section

Note:
This is a Foreign Key to `contractor_vetting_sections.id`.<fk table='contractor_vetting_sections' column='id'/> |
| document_type | string | No | Type of document (financial, licensing, etc.) |
| processing_status | string | No | Document processing status |
| processing_result | string | No | - |
| document_hash | string | No | - |
| content_hash | string | No | - |
| storage_path | string | No | - |
| department_id | string | No | Note:
This is a Foreign Key to `organizations.id`.<fk table='organizations' column='id'/> |
| version_number | string | No | - |
| retention_policy | string | No | - |
| legal_hold | boolean | No | - |

---

## a_00883_dircontracts_vector

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| embedding | string | No | - |
| metadata | unknown | No | - |
| content | string | No | - |
| created_by_user_id | integer | No | - |
| access_scope | string | No | - |
| organisation_id | integer | No | - |
| shared_with_disciplines | string | No | - |
| chunks | unknown | No | - |
| discipline_code | string | No | - |
| isolation_metadata | unknown | No | - |
| project_id | integer | No | - |
| workspace_id | integer | No | - |
| workspace_type | string | No | - |

---

## a_00888_dirprocurement_vector

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| embedding | string | No | - |
| metadata | unknown | No | - |
| content | string | No | - |
| created_by_user_id | integer | No | - |
| access_scope | string | No | - |
| organisation_id | integer | No | - |
| shared_with_disciplines | string | No | - |
| chunks | unknown | No | - |
| discipline_code | string | No | - |
| isolation_metadata | unknown | No | - |
| project_id | integer | No | - |
| workspace_id | integer | No | - |
| workspace_type | string | No | - |

---

## user_accordion_settings

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | integer | Yes | Note:
This is a Primary Key.<pk/> |
| user_id | string | Yes | - |
| user_type | string | Yes | - |
| accordion_id | integer | No | - |
| is_visible | boolean | No | - |
| contractor_name | string | No | - |
| created_at | string | No | - |
| updated_at | string | No | - |

---

## signature_templates

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| organization_id | integer | No | - |
| template_name | string | Yes | - |
| template_description | string | No | - |
| applicable_msic_codes | array | No | - |
| applicable_contract_types | array | No | - |
| applicable_procurement_phases | array | No | - |
| required_signers | unknown | No | - |
| default_deadline_hours | integer | No | - |
| is_active | boolean | No | - |
| is_default_for_msic | array | No | - |
| created_by | string | No | - |
| version | string | No | - |
| created_at | string | No | - |
| updated_at | string | No | - |

---

## routing_step_participants

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | integer | Yes | Note:
This is a Primary Key.<pk/> |
| step_id | integer | No | Note:
This is a Foreign Key to `routing_template_steps.id`.<fk table='routing_template_steps' column='id'/> |
| participant_type | string | Yes | - |
| participant_identifier | string | No | - |
| required | boolean | No | - |
| notification_enabled | boolean | No | - |
| notification_priority | string | No | - |
| created_at | string | No | - |

---

## travel_hazard_alerts

Hazard alerts for travel routes

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| type | string | Yes | - |
| message | string | Yes | - |
| routes | array | No | - |
| created_at | string | No | - |
| updated_at | string | No | - |
| organization_id | string | No | - |
| user_id | string | No | - |

---

## discipline_template_constraints

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| discipline_name | string | Yes | - |
| table_name | string | Yes | - |
| allowed_template_types | array | No | - |
| description | string | No | - |
| is_active | integer | No | - |
| created_at | string | No | - |
| updated_at | string | No | - |
| organization_id | string | No | Note:
This is a Foreign Key to `organizations.id`.<fk table='organizations' column='id'/> |

---

## template_deployments

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| project_template_id | string | No | Note:
This is a Foreign Key to `project_templates.id`.<fk table='project_templates' column='id'/> |
| deployment_type | string | Yes | - |
| source_system | string | Yes | - |
| target_system | string | Yes | - |
| status | string | No | - |
| error_message | string | No | - |
| executed_at | string | No | - |

---

## pages

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| page_id | string | Yes | Note:
This is a Primary Key.<pk/> |
| page_prefix | string | Yes | Page prefix - up to 6 characters (e.g., 00100, E00200, D00300) |
| page_name | string | Yes | - |
| page_slug | string | Yes | - |
| sector_id | string | No | Note:
This is a Foreign Key to `sectors.sector_id`.<fk table='sectors' column='sector_id'/> |
| organization_id | string | No | UUID of the organization this page belongs to (references organizations.id)

Note:
This is a Foreign Key to `organizations.id`.<fk table='organizations' column='id'/> |
| organisation_name | string | No | - |
| sector_name | string | No | - |
| created_at | string | Yes | - |
| updated_at | string | Yes | - |
| display_order | integer | No | - |
| parent_page_id | string | No | Note:
This is a Foreign Key to `pages.page_id`.<fk table='pages' column='page_id'/> |
| organisation_id | string | No | DEPRECATED: Contains sector UUID - use sector_uuid instead

Note:
This is a Foreign Key to `organizations.id`.<fk table='organizations' column='id'/> |
| sector_uuid | string | No | UUID of the sector for this page

Note:
This is a Foreign Key to `organizations.id`.<fk table='organizations' column='id'/> |
| is_active | boolean | No | Whether this page is active |
| hierarchy_level | integer | No | Level in the hierarchy (0 = top level, 1 = subsection, etc.) |
| is_standard_link | boolean | No | Whether this is a standard link (e.g., All Documents, Email Management) |
| is_virtual | boolean | No | Whether this is a virtual page (not directly linked to a folder) |
| organisation_ids | array | No | Array of organization IDs that this page belongs to - supports multi-organization access control |
| page_type | string | No | Page type according to Page Implementation Procedure (discipline_pages, data_management, workflow_processing, etc.) |

---

## document_numbering_methodologies

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| organization_id | string | Yes | - |
| company_id | integer | No | - |
| methodology_name | string | Yes | - |
| methodology_description | string | No | - |
| default_pattern | string | Yes | - |
| pattern_variables | unknown | No | - |
| is_default | boolean | No | - |
| is_active | boolean | No | - |
| created_at | string | No | - |
| updated_at | string | No | - |
| created_by | string | No | - |

---

## agent_sessions

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| agent_id | string | Yes | - |
| human_user_id | string | No | - |
| session_context | unknown | No | - |
| started_at | string | No | - |
| expires_at | string | No | - |
| is_active | boolean | No | - |
| safety_metrics | unknown | No | - |

---

## a_00105_travel_vector

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | No | - |
| embedding | string | No | - |
| metadata | unknown | No | - |
| content | string | No | - |
| created_by_user_id | integer | No | - |
| access_scope | string | No | - |
| organisation_id | integer | No | - |
| shared_with_disciplines | unknown | No | - |

---

## signature_audit_trail

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| signature_document_id | string | No | Note:
This is a Foreign Key to `signature_documents.id`.<fk table='signature_documents' column='id'/> |
| signature_request_id | string | No | Note:
This is a Foreign Key to `signature_requests.id`.<fk table='signature_requests' column='id'/> |
| action_type | string | Yes | - |
| action_description | string | No | - |
| actor_id | string | No | - |
| actor_email | string | No | - |
| actor_ip_address | string | No | - |
| actor_user_agent | string | No | - |
| previous_status | string | No | - |
| new_status | string | No | - |
| additional_data | unknown | No | - |
| compliance_flags | unknown | No | - |
| blockchain_hash | string | No | - |
| performed_at | string | No | - |

---

## agent_context_boundaries

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| agent_id | string | Yes | - |
| boundary_type | string | Yes | - |
| boundary_id | string | Yes | - |
| access_level | string | No | - |
| created_by | string | Yes | - |
| created_at | string | No | - |

---

## a_00200_commercial_vector

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| embedding | string | No | - |
| metadata | unknown | No | - |
| content | string | No | - |
| created_by_user_id | integer | No | - |
| access_scope | string | No | - |
| organisation_id | integer | No | - |
| shared_with_disciplines | string | No | - |

---

## a_00test

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| content | string | Yes | - |
| metadata | unknown | No | - |
| embedding | string | No | - |

---

## vessels

Stores vessel/ship information from VesselFinder API

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| imo | string | No | - |
| mmsi | string | No | - |
| vessel_name | string | Yes | - |
| call_sign | string | No | - |
| vessel_type | string | No | - |
| vessel_class | string | No | - |
| flag_country | string | No | - |
| gross_tonnage | integer | No | - |
| deadweight_tonnage | integer | No | - |
| length_overall | number | No | - |
| beam | number | No | - |
| draught | number | No | - |
| built_year | integer | No | - |
| latitude | number | No | - |
| longitude | number | No | - |
| speed_knots | number | No | - |
| course | number | No | - |
| heading | number | No | - |
| status | string | No | - |
| destination | string | No | - |
| eta | string | No | - |
| vesselfinder_id | string | No | - |
| last_position_update | string | No | - |
| api_data | unknown | No | - |
| created_at | string | No | - |
| updated_at | string | No | - |
| created_by | string | No | - |
| is_active | boolean | No | - |
| company_id | string | No | - |
| organisation_id | string | No | - |
| project_id | string | No | - |
| organization_id | string | No | - |

---

## sync_history

History of synchronization activities with external tender sources

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| source | string | No | - |
| sync_type | string | No | - |
| sync_completed_at | string | No | - |
| tenders_found | integer | No | - |
| tenders_new | integer | No | - |
| errors | unknown | No | - |
| metadata | unknown | No | - |

---

## custom_assignments

Stores custom discipline assignments for SOW templates, replacing localStorage usage

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| template_id | string | Yes | Reference to sow_templates.id |
| order_type | string | Yes | Order type (purchase_order, work_order, service_order) |
| organization_id | string | Yes | Organization that owns these custom assignments |
| assignments | unknown | Yes | JSON object containing appendix-to-discipline mappings |
| created_by | string | No | - |
| created_at | string | No | - |
| updated_at | string | No | - |

---

## contractor_vetting_document_hashes

Document hashes for deduplication and incremental ingestion per 1300_00220

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| document_id | string | No | Reference to main document

Note:
This is a Foreign Key to `a_02400_contractor_vetting_documents.id`.<fk table='a_02400_contractor_vetting_documents' column='id'/> |
| version | string | Yes | Document version for hash uniqueness |
| document_hash | string | Yes | SHA-256 hash of entire document for deduplication |
| content_hash | string | Yes | SHA-256 hash of content for incremental ingestion |
| chunk_id | string | No | Chunk identifier for vector store deduplication |
| file_size | integer | No | - |
| mime_type | string | No | - |
| created_at | string | No | - |
| updated_at | string | No | - |
| source_path | string | No | Original file path for tracking |
| department_id | string | No | Note:
This is a Foreign Key to `organizations.id`.<fk table='organizations' column='id'/> |
| organization_id | string | No | Note:
This is a Foreign Key to `organizations.id`.<fk table='organizations' column='id'/> |

---

## agent_activity_log

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| agent_id | string | Yes | - |
| human_user_id | string | No | - |
| session_id | string | No | Note:
This is a Foreign Key to `agent_sessions.id`.<fk table='agent_sessions' column='id'/> |
| action_type | string | Yes | - |
| resource_type | string | Yes | - |
| resource_id | string | No | - |
| action_details | unknown | No | - |
| safety_metrics | unknown | No | - |
| ip_address | string | No | - |
| user_agent | string | No | - |
| confidence_score | number | No | - |
| processing_time_ms | integer | No | - |
| created_at | string | No | - |

---

## logistics_coordination_monitor

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| task_id | string | No | Note:
This is a Primary Key.<pk/> |
| title | string | No | - |
| task_status | string | No | - |
| priority | string | No | - |
| assigned_to_discipline | string | No | - |
| procurement_order_id | string | No | Note:
This is a Foreign Key to `procurement_orders.id`.<fk table='procurement_orders' column='id'/> |
| procurement_description | string | No | - |
| documents_generated | integer | No | - |
| last_document_generated | string | No | - |
| total_messages | integer | No | - |
| last_message_date | string | No | - |

---

## a_00835_chemeng_vector

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| embedding | string | No | - |
| metadata | unknown | No | - |
| content | string | No | - |
| created_by_user_id | integer | No | - |
| access_scope | string | No | - |
| organisation_id | integer | No | - |
| shared_with_disciplines | string | No | - |
| chunks | unknown | No | - |
| discipline_code | string | No | - |
| isolation_metadata | unknown | No | - |
| project_id | integer | No | - |
| workspace_id | integer | No | - |
| workspace_type | string | No | - |

---

## email_templates

Email templates for quick composition

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| user_id | string | Yes | Note:
This is a Foreign Key to `user_management.user_id`.<fk table='user_management' column='user_id'/> |
| name | string | Yes | - |
| description | string | No | - |
| category | string | No | - |
| subject_template | string | No | - |
| body_template | string | No | - |
| variables | unknown | No | - |
| usage_count | integer | No | - |
| last_used_at | string | No | - |
| is_public | boolean | No | - |
| is_system_template | boolean | No | - |
| created_at | string | No | - |
| updated_at | string | No | - |
| organization_id | string | No | - |

---

## a_00900_doccontrol_data

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| document_id | string | Yes | Note:
This is a Foreign Key to `a_00900_doccontrol_documents.id`.<fk table='a_00900_doccontrol_documents' column='id'/> |
| transmittal_number | string | No | - |
| revision_code | string | No | - |
| created_at | string | No | - |
| updated_at | string | No | - |
| organization_id | string | No | - |
| user_id | string | No | - |

---

## error_implementations

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| error_tracking_id | string | Yes | Note:
This is a Foreign Key to `error_trackings.id`.<fk table='error_trackings' column='id'/> |
| implementation_type | string | Yes | - |
| status | string | Yes | - |
| priority | string | No | - |
| code_example | string | No | - |
| technical_notes | string | No | - |
| developer_assigned | string | No | - |
| qa_validation_status | string | No | - |
| deployment_status | string | No | - |
| created_at | string | No | - |
| updated_at | string | No | - |

---

## a_00900_doccontrol_langchain_jobs

Manages async LangChain processing jobs for documents

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| document_id | string | Yes | Note:
This is a Foreign Key to `a_00900_doccontrol_documents.id`.<fk table='a_00900_doccontrol_documents' column='id'/> |
| job_type | string | Yes | - |
| status | string | Yes | - |
| priority | integer | No | - |
| job_config | unknown | No | - |
| started_at | string | No | - |
| completed_at | string | No | - |
| error_message | string | No | - |
| retry_count | integer | No | - |
| max_retries | integer | No | - |
| trace_id | string | No | - |
| langsmith_run_id | string | No | - |
| created_at | string | No | - |
| updated_at | string | No | - |

---

## email_sends

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| actor_id | string | Yes | Note:
This is a Foreign Key to `user_management.user_id`.<fk table='user_management' column='user_id'/> |
| recipients_json | unknown | Yes | - |
| lists_json | unknown | Yes | - |
| template_id | string | No | - |
| subject | string | Yes | - |
| mode | string | Yes | - |
| sent_at | string | No | - |
| provider_message_id | string | No | - |
| created_at | string | Yes | - |
| updated_at | string | Yes | - |

---

## active_entities

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| user_id | string | No | - |
| company_id | string | No | Note:
This is a Foreign Key to `companies.id`.<fk table='companies' column='id'/> |
| organisation_id | string | No | Note:
This is a Foreign Key to `organizations.id`.<fk table='organizations' column='id'/> |
| project_id | string | No | Note:
This is a Foreign Key to `projects.id`.<fk table='projects' column='id'/> |
| project_phase_id | string | No | Note:
This is a Foreign Key to `project_phases.id`.<fk table='project_phases' column='id'/> |
| created_at | string | Yes | - |
| updated_at | string | Yes | - |
| organization_id | string | No | Note:
This is a Foreign Key to `organizations.id`.<fk table='organizations' column='id'/> |

---

## template_analytics

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| template_id | string | No | Note:
This is a Foreign Key to `templates.id`.<fk table='templates' column='id'/> |
| date | string | Yes | - |
| total_uses | integer | No | - |
| successful_uses | integer | No | - |
| failed_uses | integer | No | - |
| unique_users | integer | No | - |
| average_generation_time | number | No | - |
| total_tokens_used | integer | No | - |
| created_at | string | No | - |
| updated_at | string | No | - |

---

## agent_permissions

Manages role-based access control for AI agents

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| agent_id | string | Yes | Identifier for the AI agent |
| role_id | integer | Yes | Reference to role_definitions.id

Note:
This is a Foreign Key to `role_definitions.id`.<fk table='role_definitions' column='id'/> |
| has_access | boolean | Yes | Whether the role has access to this agent |
| created_at | string | No | - |
| updated_at | string | No | - |
| created_by | string | No | - |
| updated_by | string | No | - |

---

## document_references

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| identifier | string | Yes | - |
| document_type_id | string | Yes | - |
| title | string | Yes | - |
| file_path | string | No | - |
| metadata | unknown | No | - |
| vector_doc_ids | array | No | - |
| organization_id | string | Yes | Note:
This is a Foreign Key to `organizations.id`.<fk table='organizations' column='id'/> |
| created_at | string | No | - |
| updated_at | string | No | - |
| user_id | string | No | - |

---

## a_02075_knowledge_base_data

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| url | string | No | - |
| original_search_result | string | No | - |
| original_search_summary | string | No | - |
| search_intent | string | No | - |
| writing_style | string | No | - |
| writing_tone | string | No | - |
| hidden_insight | string | No | - |
| target_audience | string | No | - |
| goal_of_article | string | No | - |
| semantic_analysis | string | No | - |
| common_subtopics | string | No | - |
| related_questions | string | No | - |
| keywords | string | No | - |
| primary_keyword | string | No | - |
| secondary_keywords | string | No | - |
| semantic_keywords | string | No | - |
| long_tail_keywords | string | No | - |
| re_written_article | string | No | - |

---

## user_profiles

User profile data for SOW Association Modal and user management

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| user_id | string | Yes | Note:
This is a Primary Key.<pk/> |
| name | string | No | - |
| role | string | No | User role (Technical Director, Project Manager, etc.) |
| project_site | string | No | - |
| citizenship | string | No | - |
| security_clearance | string | No | - |
| frequent_traveler | boolean | No | - |
| frequent_flyer_numbers | array | No | - |
| created_at | string | No | - |
| updated_at | string | No | - |
| organization_id | string | No | - |
| email | string | No | - |
| first_name | string | No | - |
| last_name | string | No | - |
| avatar_url | string | No | - |
| id | string | No | Unique user identifier |
| company_id | string | No | Company/organization identifier |
| settings | unknown | No | User settings and profile data as JSONB |
| last_login | string | No | Timestamp of last login |

---

## logistics_approval_steps

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| workflow_id | string | No | Note:
This is a Foreign Key to `logistics_approval_workflows.id`.<fk table='logistics_approval_workflows' column='id'/> |
| step_number | integer | Yes | - |
| step_type | string | Yes | - |
| assigned_to | string | No | - |
| status | string | No | - |
| decision | string | No | - |
| comments | string | No | - |
| decision_at | string | No | - |
| time_spent_minutes | integer | No | - |
| created_at | string | No | - |

---

## maintenance_schedules

Scheduled maintenance for assets

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| asset_id | string | No | Note:
This is a Foreign Key to `maintenance_assets.id`.<fk table='maintenance_assets' column='id'/> |
| asset_name | string | Yes | - |
| maintenance_type | string | Yes | - |
| frequency | integer | Yes | - |
| frequency_unit | string | No | - |
| description | string | Yes | - |
| last_completed | string | No | - |
| next_due | string | No | - |
| status | string | No | - |
| assigned_to | string | No | - |
| assigned_to_name | string | No | - |
| created_by | string | No | - |
| estimated_hours | number | No | - |
| cost_per_service | number | No | - |
| instructions | string | No | - |
| project_id | string | No | - |
| created_at | string | No | - |
| updated_at | string | No | - |
| organization_id | string | No | - |

---

## template_dependencies

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| template_id | string | No | - |
| parent_template_id | string | No | - |
| dependent_template_id | string | No | - |
| dependency_type | string | No | - |
| dependency_condition | unknown | No | - |
| is_required | boolean | No | - |
| created_at | string | No | - |

---

## contractor_vetting_sections

Individual sections of the contractor vetting process

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | integer | Yes | Note:
This is a Primary Key.<pk/> |
| vetting_id | integer | No | Note:
This is a Foreign Key to `contractor_vetting.id`.<fk table='contractor_vetting' column='id'/> |
| section_name | string | Yes | Internal section identifier (details, financial, licensing, etc.) |
| section_title | string | Yes | Display title for the section |
| status | string | No | Status of this section |
| score | integer | No | Score for this section (0-100) |
| analysis_text | string | No | AI analysis output for this section |
| created_at | string | No | - |
| updated_at | string | No | - |

---

## pages_with_organization_mapping

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| page_id | string | No | Note:
This is a Primary Key.<pk/> |
| page_prefix | string | No | - |
| page_name | string | No | - |
| page_slug | string | No | - |
| sector_id | string | No | Note:
This is a Foreign Key to `sectors.sector_id`.<fk table='sectors' column='sector_id'/> |
| organization_id | string | No | Note:
This is a Foreign Key to `organizations.id`.<fk table='organizations' column='id'/> |
| sector_uuid | string | No | Note:
This is a Foreign Key to `organizations.id`.<fk table='organizations' column='id'/> |
| old_sector_id | string | No | Note:
This is a Foreign Key to `organizations.id`.<fk table='organizations' column='id'/> |
| organisation_name | string | No | - |
| sector_name | string | No | - |
| created_at | string | No | - |
| updated_at | string | No | - |
| display_order | integer | No | - |
| parent_page_id | string | No | Note:
This is a Foreign Key to `pages.page_id`.<fk table='pages' column='page_id'/> |
| organization_name | string | No | - |
| sector_name_clear | string | No | - |

---

## user_roles

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| user_id | string | Yes | - |
| role | string | Yes | - |
| department_code | string | No | - |
| level | integer | No | - |
| created_at | string | No | - |
| organization_id | string | No | - |

---

## security_alerts

Security alerts and incidents requiring attention

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| alert_type | string | Yes | - |
| severity | string | Yes | - |
| title | string | Yes | - |
| description | string | Yes | - |
| user_id | string | No | - |
| api_config_id | string | No | - |
| ip_address | string | No | - |
| user_agent | string | No | - |
| metadata | unknown | No | - |
| acknowledged | boolean | Yes | - |
| acknowledged_by | string | No | - |
| acknowledged_at | string | No | - |
| resolved | boolean | Yes | - |
| resolved_at | string | No | - |
| created_at | string | Yes | - |

---

## governance_approval_steps

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| approval_instance_id | string | Yes | Note:
This is a Foreign Key to `governance_approval_instances.id`.<fk table='governance_approval_instances' column='id'/> |
| step_number | integer | Yes | - |
| approver_role | string | Yes | - |
| approver_user_id | string | No | - |
| approver_name | string | No | - |
| status | string | No | - |
| action_taken | string | No | - |
| action_timestamp | string | No | - |
| notified_at | string | No | - |
| reminder_sent_at | string | No | - |
| comments | string | No | - |
| attachment_urls | array | No | - |
| created_at | string | No | - |
| updated_at | string | No | - |
| organization_id | string | No | - |
| created_by | string | No | - |

---

## vector_deletion_audit

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| vector_id | string | Yes | - |
| table_name | string | Yes | - |
| deleted_by | string | No | - |
| deletion_reason | string | No | - |
| deletion_type | string | No | - |
| restored_at | string | No | - |
| restored_by | string | No | - |
| created_at | string | No | - |

---

## document_number_audit_log

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | integer | Yes | Note:
This is a Primary Key.<pk/> |
| discipline_code | string | Yes | - |
| document_type | string | Yes | - |
| organization_id | string | Yes | - |
| company_id | integer | Yes | - |
| generated_number | string | Yes | - |
| sequence_number | integer | Yes | - |
| context | unknown | No | - |
| generated_at | string | No | - |
| created_at | string | No | - |
| user_id | string | No | - |

---

## routing_template_steps

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | integer | Yes | Note:
This is a Primary Key.<pk/> |
| template_id | integer | No | Note:
This is a Foreign Key to `document_routing_templates.id`.<fk table='document_routing_templates' column='id'/> |
| step_order | integer | Yes | - |
| step_name | string | Yes | - |
| step_description | string | No | - |
| step_type | string | Yes | - |
| routing_mode | string | Yes | - |
| required_approvals | integer | No | - |
| deadline_hours | integer | No | - |
| escalate_after_hours | integer | No | - |
| escalate_to_role | string | No | - |
| is_optional | boolean | No | - |
| auto_advance | boolean | No | - |
| created_at | string | No | - |
| updated_at | string | No | - |
| organization_id | string | No | - |
| user_id | string | No | - |

---

## materials

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| name | string | Yes | - |
| type | string | Yes | - |
| specifications | unknown | No | - |
| created_at | string | No | - |
| organization_id | string | No | - |
| user_id | string | No | - |

---

## maintenance_history

Historical record of completed maintenance

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| asset_id | string | No | Note:
This is a Foreign Key to `maintenance_assets.id`.<fk table='maintenance_assets' column='id'/> |
| work_order_id | string | No | Note:
This is a Foreign Key to `maintenance_work_orders.id`.<fk table='maintenance_work_orders' column='id'/> |
| schedule_id | string | No | Note:
This is a Foreign Key to `maintenance_schedules.id`.<fk table='maintenance_schedules' column='id'/> |
| maintenance_type | string | Yes | - |
| description | string | Yes | - |
| performed_by | string | No | - |
| performed_by_name | string | No | - |
| performed_date | string | Yes | - |
| hours_spent | number | No | - |
| cost | number | No | - |
| parts_used | string | No | - |
| notes | string | No | - |
| project_id | string | No | - |
| created_at | string | No | - |
| organization_id | string | No | - |
| user_id | string | No | - |

---

## template_approval_workflows

Approval workflow instances for procurement templates

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| template_id | string | No | Note:
This is a Foreign Key to `procurement_templates.id`.<fk table='procurement_templates' column='id'/> |
| workflow_type | unknown | No | - |
| status | string | No | - |
| current_step | integer | No | - |
| created_by | string | No | - |
| updated_by | string | No | - |
| approved_at | string | No | - |
| rejected_at | string | No | - |
| required_approvals | unknown | No | - |
| metadata | unknown | No | - |
| created_at | string | No | - |
| updated_at | string | No | - |

---

## a_00900_doccontrol_documents

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| file_path | string | Yes | - |
| file_name | string | Yes | - |
| file_extension | string | No | - |
| uploaded_by | string | No | - |
| uploaded_at | string | No | - |
| discipline | string | Yes | - |
| page_number | string | Yes | - |
| created_at | string | No | - |
| updated_at | string | No | - |
| status | string | No | - |
| metadata_table_id | string | No | - |
| flowise_store_id | string | No | - |
| flowise_loader_id | string | No | - |
| flowise_doc_id | string | No | - |
| flowise_file_id | string | No | - |
| total_chunks | integer | No | - |
| total_characters | integer | No | - |
| flowise_status | string | No | - |
| size | integer | No | - |
| original_filename | string | No | - |
| storage_url | string | No | - |
| category_id | string | No | - |
| embedding_details | unknown | No | Metadata about embedding process |
| is_embedded | boolean | No | Whether document has been processed for vector search |
| metadata | unknown | No | - |
| storage_type | string | No | Type of storage used: flowise_store or supabase_bucket |
| flowise_document_id | string | No | ID returned by Flowise after document upsert |
| storage_path | string | No | - |
| store_id | string | No | Reference to the document store this document belongs to

Note:
This is a Foreign Key to `document_stores.id`.<fk table='document_stores' column='id'/> |
| title | string | No | Document title for display purposes |
| company_id | string | No | Links document to specific company for filtering

Note:
This is a Foreign Key to `companies.id`.<fk table='companies' column='id'/> |
| organization_id | string | No | Links document to specific organization for filtering |
| langchain_metadata | unknown | No | Complete LangChain processing metadata in JSON format |
| langchain_loader_type | string | No | LangChain loader used for processing (PyPDFLoader, Docx2txtLoader, etc.) |
| langchain_processing_status | string | No | Current processing status (pending, processing, completed, failed) |
| langchain_trace_id | string | No | LangSmith trace ID for observability |
| langchain_chunk_count | integer | No | - |
| langchain_embedding_model | string | No | - |
| langchain_embedding_provider | string | No | - |
| langchain_processed_at | string | No | - |
| user_id | string | No | - |

---

## safety_templates

Standardized HSE Safety Templates - HTML content in html_content TEXT, schema in content_schema JSONB

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| organization_id | string | No | Note:
This is a Foreign Key to `organizations.id`.<fk table='organizations' column='id'/> |
| discipline_id | string | No | Note:
This is a Foreign Key to `disciplines.id`.<fk table='disciplines' column='id'/> |
| template_name | string | Yes | - |
| template_description | string | No | - |
| template_type | string | Yes | - |
| template_category | string | No | - |
| template_content | unknown | No | DEPRECATED: Use html_content for HTML, content_metadata for structured data. Remove post-migration. |
| form_schema | unknown | No | - |
| html_content | string | No | - |
| risk_level | string | No | - |
| applicable_sites | array | No | - |
| required_certifications | array | No | - |
| review_frequency | string | No | - |
| status | string | No | - |
| is_active | boolean | No | - |
| approval_status | string | No | - |
| version | string | No | - |
| is_latest | boolean | No | - |
| created_by | string | No | Note:
This is a Foreign Key to `user_management.user_id`.<fk table='user_management' column='user_id'/> |
| created_at | string | No | - |
| updated_by | string | No | Note:
This is a Foreign Key to `user_management.user_id`.<fk table='user_management' column='user_id'/> |
| updated_at | string | No | - |
| approved_by | string | No | Note:
This is a Foreign Key to `user_management.user_id`.<fk table='user_management' column='user_id'/> |
| approved_at | string | No | - |
| content_schema | unknown | No | - |
| content_metadata | unknown | No | - |
| document_type | string | No | Document type copied from governance template (e.g., Risk Assessment, Safety Inspection, Incident Report) |
| document_type_label | string | No | Human-readable label for the document type |
| organization_name | string | No | - |
| discipline_name | string | No | - |
| source_governance_template_id | string | No | - |

---

## a_00886_dirlogistics_vector

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| embedding | string | No | - |
| metadata | unknown | No | - |
| content | string | No | - |
| created_by_user_id | integer | No | - |
| access_scope | string | No | - |
| organisation_id | integer | No | - |
| shared_with_disciplines | string | No | - |
| chunks | unknown | No | - |
| discipline_code | string | No | - |
| isolation_metadata | unknown | No | - |
| project_id | integer | No | - |
| workspace_id | integer | No | - |
| workspace_type | string | No | - |

---

## contractor_evaluation_results

Evaluation results for contractor vetting display

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | integer | Yes | Note:
This is a Primary Key.<pk/> |
| vetting_id | integer | No | Reference to vetting record

Note:
This is a Foreign Key to `contractor_vetting.id`.<fk table='contractor_vetting' column='id'/> |
| document_id | integer | No | Reference to specific document

Note:
This is a Foreign Key to `contractor_vetting_documents.id`.<fk table='contractor_vetting_documents' column='id'/> |
| contractor_name | string | No | Name of the contractor |
| document_type | string | No | Type of document evaluated |
| document_path | string | No | Path to the evaluated document |
| processing_status | string | No | Status of the evaluation process |
| score | integer | No | Evaluation score (0-100) |
| confidence | integer | No | Confidence level in the evaluation (0-100) |
| commentary | string | No | Detailed commentary on the evaluation |
| created_at | string | No | - |
| updated_at | string | No | - |
| questions | unknown | No | - |
| answers | unknown | No | - |
| document_name | string | No | - |
| form_submission_data | unknown | No | - |

---

## ui_display_settings

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | integer | Yes | Note:
This is a Primary Key.<pk/> |
| company_id | integer | Yes | - |
| accordion_option_id | integer | No | - |
| is_visible | boolean | No | - |
| user_type | string | Yes | - |
| created_at | string | No | - |
| updated_at | string | No | - |

---

## timesheet_entries

Timesheet entries for user work hours tracking (new implementation)

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| user_id | string | No | User who owns this timesheet entry |
| week_start_date | string | Yes | Start date of the week (Monday) for this timesheet |
| description | string | Yes | Description of the task or work performed |
| project | string | No | Project associated with this task |
| monday_hours | number | No | Hours worked on Monday |
| tuesday_hours | number | No | Hours worked on Tuesday |
| wednesday_hours | number | No | Hours worked on Wednesday |
| thursday_hours | number | No | Hours worked on Thursday |
| friday_hours | number | No | Hours worked on Friday |
| saturday_hours | number | No | Hours worked on Saturday |
| sunday_hours | number | No | Hours worked on Sunday |
| total_hours | number | No | Total hours calculated automatically |
| created_at | string | No | - |
| updated_at | string | No | - |
| organization_id | string | No | - |

---

## user_emails

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | integer | Yes | Note:
This is a Primary Key.<pk/> |
| created_at | string | Yes | - |
| thread_id | string | No | Unique identifier for email thread |
| cc_recipients | array | No | Array of CC email addresses |
| bcc_recipients | array | No | Array of BCC email addresses |
| body_html | string | No | HTML formatted email body content |
| status | string | No | Current status of the email |
| is_starred | boolean | No | Flag for starred/important emails |
| is_important | boolean | No | Flag for priority emails |
| folder | string | No | Current folder location of email |
| attachments | unknown | No | JSON array of attachment metadata |
| raw_headers | string | No | Complete email headers in raw format |
| in_reply_to | string | No | Message-ID this email is replying to |
| message_references | array | No | Array of Message-IDs in thread |
| user_id | string | No | - |
| organization_id | string | No | - |

---

## a_00889_dirfinance_vector

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | No | - |
| embedding | string | No | - |
| metadata | unknown | No | - |
| content | string | No | - |
| created_by_user_id | integer | No | - |
| access_scope | string | No | - |
| organisation_id | integer | No | - |
| shared_with_disciplines | unknown | No | - |
| chunks | unknown | No | - |
| discipline_code | string | No | - |
| isolation_metadata | unknown | No | - |
| project_id | integer | No | - |
| workspace_id | integer | No | - |
| workspace_type | string | No | - |

---

## tender_notification_logs

Logs all notifications sent to users about new tenders

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| monitor_id | string | No | Note:
This is a Foreign Key to `tender_monitors.id`.<fk table='tender_monitors' column='id'/> |
| tender_id | string | No | - |
| tender_title | string | No | - |
| tender_number | string | No | - |
| issuing_organization | string | No | - |
| estimated_value | number | No | - |
| currency | string | No | - |
| location | string | No | - |
| notification_sent_at | string | No | - |

---

## a_01100_ethics_vector

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| embedding | string | No | - |
| metadata | unknown | No | - |
| content | string | No | - |
| created_by_user_id | integer | No | - |
| access_scope | string | No | - |
| organisation_id | integer | No | - |
| shared_with_disciplines | string | No | - |
| chunks | unknown | No | - |
| discipline_code | string | No | - |
| isolation_metadata | unknown | No | - |
| project_id | integer | No | - |
| workspace_id | integer | No | - |
| workspace_type | string | No | - |

---

## form_templates_audit

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| form_template_id | string | No | - |
| action | string | Yes | - |
| old_data | unknown | No | - |
| new_data | unknown | No | - |
| changed_by | string | No | - |
| changed_at | string | No | - |
| user_role | string | No | - |
| organization_id | string | No | - |
| is_dev_mode | boolean | No | - |
| user_id | string | No | - |

---

## organisations_backup

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | integer | No | - |
| name | string | No | - |
| sector_id | string | No | - |
| is_active | boolean | No | - |
| is_template | boolean | No | - |
| created_at | string | No | - |
| updated_at | string | No | - |
| uuid | string | No | - |
| organization_id | string | No | - |
| user_id | string | No | - |

---

## master_templates

Approved organizational template standards for procurement documents

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| template_name | string | Yes | - |
| template_type | string | Yes | - |
| procurement_category | string | Yes | - |
| category_code | string | No | - |
| status | string | Yes | - |
| content | unknown | No | - |
| approval_workflow | unknown | No | - |
| version | integer | No | - |
| is_active | boolean | No | - |
| tags | array | No | - |
| language_support | array | No | - |
| created_at | string | No | - |
| updated_at | string | No | - |

---

## document_access_logs

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| document_id | string | Yes | - |
| user_id | string | No | - |
| tender_id | string | Yes | - |
| access_type | string | Yes | - |
| accessed_at | string | No | - |

---

## a_02500_security_vector

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| embedding | string | No | - |
| metadata | unknown | No | - |
| content | string | No | - |
| created_by_user_id | integer | No | - |
| access_scope | string | No | - |
| organisation_id | integer | No | - |
| shared_with_disciplines | string | No | - |
| chunks | unknown | No | - |
| discipline_code | string | No | - |
| isolation_metadata | unknown | No | - |
| project_id | integer | No | - |
| workspace_id | integer | No | - |
| workspace_type | string | No | - |

---

## agent_template_integrations

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| form_template_id | string | No | - |
| agent_id | string | No | Note:
This is a Foreign Key to `agents_tracking.id`.<fk table='agents_tracking' column='id'/> |
| integration_type | string | Yes | - |
| trigger_fields | unknown | No | - |
| agent_actions | unknown | No | - |
| is_active | boolean | No | - |
| priority | integer | No | - |
| error_handling | string | No | - |

---

## document_types

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| name | string | Yes | - |
| code | string | Yes | - |
| discipline_code | string | Yes | - |
| category | string | Yes | - |
| description | string | No | - |
| is_active | boolean | No | - |
| created_at | string | No | - |

---

## governance_document_templates-old

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| name | string | Yes | - |
| description | string | No | - |
| category | string | Yes | - |
| template_type | string | No | - |
| fields | unknown | No | - |
| settings | unknown | No | - |
| content | string | No | - |
| status | string | No | - |
| version | integer | No | - |
| usage_count | integer | No | - |
| created_by | string | No | - |
| updated_by | string | No | - |
| created_at | string | No | - |
| updated_at | string | No | - |
| organizations | unknown | No | - |
| disciplines | unknown | No | - |
| sectors | unknown | No | - |
| metadata | unknown | No | - |

---

## document_download_queue

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| tender_id | string | Yes | - |
| document_url | string | Yes | - |
| document_type | string | Yes | - |
| source_name | string | No | - |
| priority | integer | No | - |
| status | string | No | - |
| queue_order | integer | No | - |
| download_options | unknown | No | - |
| expected_file_size | integer | No | - |
| retry_count | integer | No | - |
| max_retries | integer | No | - |
| error_message | string | No | - |
| started_at | string | No | - |
| scheduled_at | string | No | - |
| completed_at | string | No | - |
| created_at | string | No | - |
| created_by | string | No | - |
| user_ip | string | No | - |
| user_agent | string | No | - |
| document_name | string | No | - |
| source | string | No | - |
| organization_id | string | No | - |

---

## template_document_structures

Links templates to their hierarchical document structures

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| template_id | string | Yes | - |
| discipline_table | string | Yes | - |
| hierarchy_definition_id | string | No | Note:
This is a Foreign Key to `document_hierarchy_definitions.id`.<fk table='document_hierarchy_definitions' column='id'/> |
| structure_data | unknown | No | - |
| is_active | boolean | No | - |
| created_at | string | No | - |
| updated_at | string | No | - |
| created_by | string | No | - |
| organization_id | string | No | - |

---

## agents_unified

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | No | Note:
This is a Primary Key.<pk/> |
| agent_name | string | No | - |
| company | string | No | - |
| sector | string | No | - |
| organization | string | No | - |
| phase | string | No | - |
| page_name | string | No | - |
| page_prefix | string | No | - |
| is_active | boolean | No | - |
| notes | string | No | - |
| created_at | string | No | - |
| updated_at | string | No | - |
| last_used | string | No | - |
| modal_assignments | integer | No | - |

---

## contractor_vetting_ingestion_registry

Registry for tracking document ingestion status per 1300_00220

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| document_hash | string | Yes | Document hash for deduplication |
| content_hash | string | Yes | Content hash for incremental processing |
| ingestion_status | string | No | Current ingestion status |
| ingestion_timestamp | string | No | - |
| completion_timestamp | string | No | - |
| error_message | string | No | - |
| retry_count | integer | No | - |
| vector_store_id | string | No | Reference to vector store record |
| metadata | unknown | No | Additional ingestion metadata |
| department_id | string | No | Note:
This is a Foreign Key to `organizations.id`.<fk table='organizations' column='id'/> |

---

## project_phase_assignments

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| project_id | string | No | Note:
This is a Foreign Key to `projects.id`.<fk table='projects' column='id'/> |
| phase_id | string | No | Note:
This is a Foreign Key to `project_phases.id`.<fk table='project_phases' column='id'/> |
| custom_name | string | No | - |
| is_active | boolean | No | - |
| start_date | string | No | - |
| end_date | string | No | - |
| sort_order | integer | No | - |
| created_at | string | No | - |
| updated_at | string | No | - |

---

## organizations

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| name | string | Yes | - |
| sector_id | string | No | Note:
This is a Foreign Key to `sectors.sector_id`.<fk table='sectors' column='sector_id'/> |
| is_active | boolean | No | - |
| is_template | boolean | No | - |
| created_at | string | No | - |
| updated_at | string | No | - |
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| supabase_url | string | No | Supabase project URL for this organization |
| supabase_anon_key | string | No | Supabase anonymous key for this organization |
| supabase_service_key | string | No | Supabase service key for this organization (server-side operations) |
| organization_id | string | No | - |
| user_id | string | No | - |

---

## a_00890_dirprojects_vector

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| embedding | string | No | - |
| metadata | unknown | No | - |
| content | string | No | - |
| created_by_user_id | integer | No | - |
| access_scope | string | No | - |
| organisation_id | integer | No | - |
| shared_with_disciplines | string | No | - |
| chunks | unknown | No | - |
| discipline_code | string | No | - |
| isolation_metadata | unknown | No | - |
| project_id | integer | No | - |
| workspace_id | integer | No | - |
| workspace_type | string | No | - |

---

## a_02250_qc_vector

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| embedding | string | No | - |
| metadata | unknown | No | - |
| content | string | No | - |
| created_by_user_id | integer | No | - |
| access_scope | string | No | - |
| organisation_id | integer | No | - |
| shared_with_disciplines | string | No | - |
| chunks | unknown | No | - |
| discipline_code | string | No | - |
| isolation_metadata | unknown | No | - |
| project_id | integer | No | - |
| workspace_id | integer | No | - |
| workspace_type | string | No | - |

---

## logistics_documents

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| procurement_order_id | string | No | Note:
This is a Foreign Key to `procurement_orders.id`.<fk table='procurement_orders' column='id'/> |
| document_type | string | Yes | - |
| direction | string | Yes | - |
| content | string | Yes | - |
| metadata | unknown | No | - |
| status | string | No | - |
| shared_with | string | No | - |
| shared_at | string | No | - |
| generated_by | string | No | - |
| created_at | string | No | - |
| updated_at | string | No | - |

---

## a_01500_hr_candidate_evaluation

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| submission_date | string | No | - |
| first_name | string | No | - |
| surname | string | No | - |
| phone | string | No | - |
| city | string | No | - |
| province_state | string | No | - |
| country | string | No | - |
| job_reference_no | string | No | - |
| discipline | string | No | - |
| email | string | No | - |
| educational | string | No | - |
| job_history | string | No | - |
| skills | string | No | - |
| summarize | string | No | - |
| vote | number | No | - |
| consideration | string | No | - |
| full_name | string | No | - |

---

## llm_configurations

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| name | string | Yes | - |
| provider | string | Yes | - |
| model | string | Yes | - |
| api_key | string | No | - |
| status | string | Yes | - |
| usage_count | integer | No | - |
| last_used | string | No | - |
| created_at | string | Yes | - |
| updated_at | string | Yes | - |
| created_by | string | No | - |
| updated_by | string | No | - |
| purposes | array | No | - |

---

## email_content_storage

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| email_id | string | Yes | Note:
This is a Foreign Key to `emails.id`.<fk table='emails' column='id'/> |
| user_id | string | Yes | Note:
This is a Foreign Key to `user_management.user_id`.<fk table='user_management' column='user_id'/> |
| content_type | string | Yes | - |
| original_size | integer | Yes | - |
| compressed_size | integer | No | - |
| compression_type | string | No | - |
| storage_bucket | string | Yes | - |
| storage_path | string | Yes | - |
| encoding | string | No | - |
| language | string | No | - |
| access_count | integer | No | - |
| last_accessed_at | string | No | - |
| created_at | string | No | - |
| updated_at | string | No | - |

---

## sections

Defines accordion sections with metadata, linked by section_key

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| section_key | string | Yes | - |
| section_name | string | Yes | - |
| section_description | string | No | - |
| section_icon | string | No | - |
| display_order | integer | Yes | - |
| is_active | boolean | No | - |
| created_at | string | No | - |
| updated_at | string | No | - |

---

## prompt_usage_audit

Detailed audit trail of prompt usage by scripts and services for analytics and debugging

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| prompt_id | string | Yes | Note:
This is a Foreign Key to `prompts.id`.<fk table='prompts' column='id'/> |
| script_name | string | Yes | - |
| operation_type | string | No | - |
| metadata | unknown | No | - |
| response_time_ms | integer | No | - |
| success | boolean | No | - |
| created_at | string | No | - |

---

## routing_notifications

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | integer | Yes | Note:
This is a Primary Key.<pk/> |
| workflow_id | integer | No | Note:
This is a Foreign Key to `document_routing_workflows.id`.<fk table='document_routing_workflows' column='id'/> |
| routing_step_id | integer | No | Note:
This is a Foreign Key to `workflow_routing_steps.id`.<fk table='workflow_routing_steps' column='id'/> |
| recipient_id | string | No | Note:
This is a Foreign Key to `user_management.user_id`.<fk table='user_management' column='user_id'/> |
| recipient_role | string | No | - |
| notification_type | string | Yes | - |
| notification_priority | string | No | - |
| subject | string | No | - |
| message | string | No | - |
| notification_data | unknown | No | - |
| sent | boolean | No | - |
| sent_at | string | No | - |
| read_at | string | No | - |
| response_url | string | No | - |
| created_at | string | No | - |
| updated_at | string | No | - |

---

## a_01850_otherparties_vector

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| embedding | string | No | - |
| metadata | unknown | No | - |
| content | string | No | - |
| created_by_user_id | integer | No | - |
| access_scope | string | No | - |
| organisation_id | integer | No | - |
| shared_with_disciplines | string | No | - |
| chunks | unknown | No | - |
| discipline_code | string | No | - |
| isolation_metadata | unknown | No | - |
| project_id | integer | No | - |
| workspace_id | integer | No | - |
| workspace_type | string | No | - |

---

## document_comparisons

Table for storing document comparison results

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Unique identifier for each comparison

Note:
This is a Primary Key.<pk/> |
| document_ids | array | Yes | Array of document IDs that were compared |
| mode | string | Yes | Comparison mode: pairwise or consolidated |
| result | unknown | No | JSON result of the comparison |
| created_at | string | No | Timestamp when comparison was created |
| created_by | string | No | User ID who created the comparison |
| options | unknown | No | Options used for the comparison |

---

## resource_prompts

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| resource_id | string | Yes | Note:
This is a Primary Key.<pk/> |
| resource_type | string | Yes | Note:
This is a Primary Key.<pk/> |
| prompt_id | string | Yes | Note:
This is a Primary Key.<pk/>
This is a Foreign Key to `prompts.id`.<fk table='prompts' column='id'/> |
| applicable_sections | array | No | - |
| created_at | string | No | - |

---

## vector_system_health

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| component | string | No | - |
| total_tables | integer | No | - |

---

## chatbot_messages

Stores chatbot messages for workflow progress notifications

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| user_id | string | Yes | - |
| order_id | string | No | - |
| message | string | Yes | - |
| message_type | string | No | - |
| metadata | unknown | No | - |
| created_at | string | No | - |
| read_at | string | No | - |
| organization_id | string | No | - |
| session_id | string | No | - |

---

## project_engineering_templates

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| template_id | string | Yes | Note:
This is a Foreign Key to `master_engineering_templates.id`.<fk table='master_engineering_templates' column='id'/> |
| project_id | string | Yes | Note:
This is a Foreign Key to `projects.id`.<fk table='projects' column='id'/> |
| custom_name | string | No | - |
| custom_description | string | No | - |
| custom_html_content | string | No | - |
| custom_json_content | unknown | No | - |
| is_required | boolean | No | - |
| required_by | string | No | - |
| completed_at | string | No | - |
| completed_by | string | No | - |
| project_approval_status | string | No | - |
| project_approved_by | string | No | - |
| project_approved_at | string | No | - |
| organization_id | string | Yes | - |
| company_id | string | Yes | - |
| created_by | string | No | - |
| created_at | string | No | - |

---

## safety_template_usage

Audit trail and analytics for safety template usage

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| template_id | string | No | Note:
This is a Foreign Key to `safety_templates.id`.<fk table='safety_templates' column='id'/> |
| user_id | string | No | - |
| action_type | string | Yes | - |
| site_location | string | No | - |
| contractor_name | string | No | - |
| session_id | string | No | - |
| user_agent | string | No | - |
| ip_address | string | No | - |
| timestamp | string | No | - |

---

## error_trackings

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| error_id | string | Yes | - |
| title | string | Yes | - |
| category | string | Yes | - |
| severity | string | Yes | - |
| status | string | Yes | - |
| description | string | No | - |
| root_cause | string | No | - |
| solution | string | No | - |
| impact_assessment | string | No | - |
| error_pattern | string | No | - |
| affected_system | string | No | - |
| resolution_timestamp | string | No | - |
| created_at | string | No | - |
| updated_at | string | No | - |
| resolved_at | string | No | - |
| fingerprint | string | No | Hash of error signature for deduplication and similarity detection |
| batch_id | string | No | Groups related errors that occurred in the same batch/request |

---

## template_reviews

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| template_id | string | No | Note:
This is a Foreign Key to `templates.id`.<fk table='templates' column='id'/> |
| user_id | string | No | - |
| rating | integer | No | - |
| review_text | string | No | - |
| is_helpful | boolean | No | - |
| created_at | string | No | - |

---

## internal_notifications

Internal notification system to avoid email dependency

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| user_id | string | No | - |
| type | string | Yes | - |
| category | string | No | - |
| title | string | Yes | - |
| message | string | Yes | - |
| approval_instance_id | string | No | Note:
This is a Foreign Key to `approval_instances.id`.<fk table='approval_instances' column='id'/> |
| approval_step_id | string | No | Note:
This is a Foreign Key to `approval_steps.id`.<fk table='approval_steps' column='id'/> |
| priority | string | No | - |
| is_read | boolean | No | - |
| read_at | string | No | - |
| action_required | boolean | No | - |
| action_url | string | No | Direct link to the approval action page |
| created_at | string | No | - |
| expires_at | string | No | - |

---

## template_categories

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| name | string | Yes | - |
| description | string | No | - |
| count | integer | No | - |
| category_type | string | No | - |
| parent_category_id | string | No | Note:
This is a Foreign Key to `template_categories.id`.<fk table='template_categories' column='id'/> |
| is_active | boolean | No | - |
| created_at | string | No | - |
| updated_at | string | No | - |
| organization_id | string | No | - |
| user_id | string | No | - |

---

## email_attachments

Stores email attachment metadata and references to Supabase storage

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| email_id | string | Yes | Note:
This is a Foreign Key to `emails.id`.<fk table='emails' column='id'/> |
| user_id | string | Yes | Note:
This is a Foreign Key to `user_management.user_id`.<fk table='user_management' column='user_id'/> |
| filename | string | Yes | - |
| content_type | string | No | - |
| file_size | integer | No | - |
| attachment_id | string | No | - |
| storage_path | string | No | - |
| storage_bucket | string | No | - |
| is_inline | boolean | No | - |
| content_id | string | No | - |
| is_safe | boolean | No | - |
| virus_scan_result | string | No | - |
| virus_scan_at | string | No | - |
| download_count | integer | No | - |
| last_downloaded_at | string | No | - |
| created_at | string | No | - |
| updated_at | string | No | - |

---

## a_00900_doccontrol_document_versions

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | integer | Yes | Note:
This is a Primary Key.<pk/> |
| document_id | string | Yes | Note:
This is a Foreign Key to `a_00900_doccontrol_documents.id`.<fk table='a_00900_doccontrol_documents' column='id'/> |
| version_number | integer | Yes | - |
| file_path | string | Yes | - |
| status | string | Yes | - |
| submitted_at | string | No | - |
| approved_at | string | No | - |
| uploaded_at | string | Yes | - |
| uploaded_by | string | No | - |
| changes_summary | string | No | - |
| created_at | string | Yes | - |
| updated_at | string | Yes | - |
| organization_id | string | No | - |
| user_id | string | No | - |

---

## agent_sequence_operations

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| organization_id | string | No | Note:
This is a Foreign Key to `organizations.id`.<fk table='organizations' column='id'/> |
| agent_id | string | Yes | - |
| agent_version | string | No | - |
| operation | string | Yes | - |
| resource_type | string | Yes | - |
| resource_id | string | No | - |
| disciplines | unknown | No | - |
| input_data | unknown | No | - |
| output_data | unknown | No | - |
| processing_time_ms | integer | No | - |
| confidence_score | number | No | - |
| success | boolean | No | - |
| error_message | string | No | - |
| ip_address | string | No | - |
| user_agent | string | No | - |
| created_at | string | No | - |

---

## emails

Main table storing all email messages with full content and metadata

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| user_id | string | No | Note:
This is a Foreign Key to `user_management.user_id`.<fk table='user_management' column='user_id'/> |
| account_id | string | No | Note:
This is a Foreign Key to `user_email_accounts.id`.<fk table='user_email_accounts' column='id'/> |
| thread_id | string | No | Note:
This is a Foreign Key to `email_threads.id`.<fk table='email_threads' column='id'/> |
| message_id | string | No | - |
| provider_thread_id | string | No | - |
| subject | string | Yes | - |
| sender_email | string | Yes | - |
| sender_name | string | No | - |
| recipient_email | string | Yes | - |
| recipient_name | string | No | - |
| cc_emails | array | No | - |
| bcc_emails | array | No | - |
| reply_to_email | string | No | - |
| body_text | string | No | - |
| body_html | string | No | - |
| snippet | string | No | - |
| sent_date | string | Yes | - |
| received_date | string | No | - |
| is_read | boolean | No | - |
| is_flagged | boolean | No | - |
| is_important | boolean | No | - |
| is_draft | boolean | No | - |
| is_sent | boolean | No | - |
| is_archived | boolean | No | - |
| is_deleted | boolean | No | - |
| is_spam | boolean | No | - |
| has_attachments | boolean | No | - |
| attachment_count | integer | No | - |
| priority | string | No | - |
| labels | array | No | - |
| ai_summary | string | No | - |
| ai_sentiment | string | No | - |
| ai_priority_score | number | No | - |
| ai_action_items | array | No | - |
| ai_entities | unknown | No | - |
| ai_processed_at | string | No | - |
| provider_data | unknown | No | - |
| search_vector | string | No | - |
| created_at | string | No | - |
| updated_at | string | No | - |
| sender_email_normalized | string | No | - |
| recipient_email_normalized | string | No | - |
| resolution_debug | unknown | No | - |

---

## a_performance_docs_vector

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| discipline_code | string | No | - |
| document_type | string | No | - |
| title | string | No | - |
| content | string | No | - |
| embedding | string | No | - |
| metadata | unknown | No | - |
| tags | array | No | - |
| last_updated | string | No | - |

---

## approval_delegations

Approval delegation management for when users are unavailable

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| delegator_user_id | string | No | - |
| delegate_user_id | string | No | - |
| role_filter | string | No | - |
| department_filter | string | No | - |
| start_date | string | No | - |
| end_date | string | No | - |
| is_active | boolean | No | - |
| reason | string | No | - |
| created_at | string | No | - |
| updated_at | string | No | - |

---

## a_02100_pr_media

Table storing platform content data including video metrics and related content

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | integer | Yes | Note:
This is a Primary Key.<pk/> |
| platform | string | Yes | - |
| channel_name | string | No | - |
| channel_url | string | No | - |
| views | integer | No | - |
| likes | integer | No | - |
| comments | integer | No | - |
| video_url | string | No | - |
| video_description | string | No | - |
| video_title | string | No | - |
| video_tags | array | No | - |
| video_summary | string | No | - |
| script_summary | string | No | - |
| transcript | string | No | - |
| created_at | string | No | - |
| updated_at | string | No | - |
| image_title | string | No | - |

---

## timesheet_templates

Templates for creating timesheet entries

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| user_id | string | No | User who owns this template |
| name | string | Yes | Name of the template |
| tasks | unknown | No | JSON array of task templates |
| created_at | string | No | - |
| updated_at | string | No | - |
| organization_id | string | No | - |

---

## procurement_templates_backup_20251121

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | No | - |
| document_id | string | No | - |
| organization_id | string | No | - |
| created_by | string | No | - |
| updated_by | string | No | - |
| template_name | string | No | - |
| template_description | string | No | - |
| template_type | string | No | - |
| template_category | string | No | - |
| level1_code | string | No | - |
| level2_code | string | No | - |
| level3_code | string | No | - |
| template_content | unknown | No | - |
| field_protection | unknown | No | - |
| protection_enabled | boolean | No | - |
| is_latest | boolean | No | - |
| version_number | integer | No | - |
| approval_status | string | No | - |
| approved_by | string | No | - |
| approved_at | string | No | - |
| related_documents | unknown | No | - |
| compliance_requirements | unknown | No | - |
| lifecycle_stage | string | No | - |
| tags | array | No | - |
| created_at | string | No | - |
| updated_at | string | No | - |
| access_level | string | No | - |
| discipline | string | No | - |
| allowed_roles | unknown | No | - |
| component_type | string | No | - |
| mandatory | boolean | No | - |
| approval_workflow | unknown | No | - |
| html_content | string | No | - |
| document_type | string | No | - |
| document_type_label | string | No | - |
| discipline_code | string | No | - |
| appendix_letter | string | No | - |
| sow_integration_enabled | boolean | No | - |
| organization_name | string | No | - |
| discipline_name | string | No | - |
| source_governance_template_id | string | No | - |

---

## complete_epcm_accordion

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| section_key | string | No | - |
| title | string | No | - |
| option_id | integer | No | - |
| sector | string | No | - |
| parent_section_key | string | No | - |
| display_order | integer | No | - |
| organization_id | string | No | Note:
This is a Foreign Key to `organizations.id`.<fk table='organizations' column='id'/> |
| is_visible | boolean | No | - |
| organization_name | string | No | - |
| section_type | string | No | - |
| page_number | integer | No | - |

---

## risk_assessments

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | integer | Yes | Note:
This is a Primary Key.<pk/> |
| risk_id | string | Yes | - |
| inspection_id | string | Yes | Note:
This is a Foreign Key to `inspections.inspection_id`.<fk table='inspections' column='inspection_id'/> |
| project_id | string | Yes | - |
| risk_level | string | Yes | - |
| probability | number | No | - |
| impact | number | No | - |
| description | string | No | - |
| mitigation_plan | string | No | - |
| assigned_to | string | No | - |
| status | string | No | - |
| review_date | string | No | - |
| closed_date | string | No | - |
| created_at | string | No | - |
| updated_at | string | No | - |
| created_by | string | No | - |
| updated_by | string | No | - |
| organization_id | string | No | - |
| user_id | string | No | - |

---

## chat_sessions

Stores chat sessions with full project context from active_entities

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| user_id | string | No | - |
| discipline_code | string | Yes | - |
| chatbot_type | string | Yes | - |
| company_id | string | No | Note:
This is a Foreign Key to `companies.id`.<fk table='companies' column='id'/> |
| company_name | string | No | Denormalized company name for performance |
| organisation_id | string | No | Note:
This is a Foreign Key to `organizations.id`.<fk table='organizations' column='id'/> |
| organisation_name | string | No | Denormalized organisation name for performance |
| project_id | string | No | Note:
This is a Foreign Key to `projects.id`.<fk table='projects' column='id'/> |
| project_name | string | No | Denormalized project name for performance |
| project_phase_id | string | No | Note:
This is a Foreign Key to `project_phases.id`.<fk table='project_phases' column='id'/> |
| project_phase_name | string | No | Denormalized project phase name for performance |
| session_title | string | No | - |
| session_summary | string | No | - |
| total_messages | integer | No | - |
| total_documents_referenced | integer | No | - |
| created_at | string | No | - |
| updated_at | string | No | - |
| last_activity_at | string | No | - |
| is_active | boolean | No | - |
| is_archived | boolean | No | - |
| metadata | unknown | No | - |
| avg_response_time_ms | integer | No | - |
| total_processing_time_ms | integer | No | - |
| session_id | string | Yes | Text-based session identifier for API compatibility |

---

## chatbot_performance_metrics

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| metric_id | string | Yes | Note:
This is a Primary Key.<pk/> |
| page_id | string | Yes | - |
| user_id | string | No | - |
| session_id | string | No | Note:
This is a Foreign Key to `chatbot_sessions.session_id`.<fk table='chatbot_sessions' column='session_id'/> |
| metric_type | string | Yes | - |
| metric_value | number | No | - |
| metadata | unknown | No | - |
| recorded_at | string | Yes | - |

---

## document_routing_templates

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | integer | Yes | Note:
This is a Primary Key.<pk/> |
| template_name | string | Yes | - |
| template_description | string | No | - |
| document_type | string | No | - |
| organization_id | integer | No | - |
| creator_id | string | No | Note:
This is a Foreign Key to `user_management.user_id`.<fk table='user_management' column='user_id'/> |
| is_active | boolean | No | - |
| is_default | boolean | No | - |
| created_at | string | No | - |
| updated_at | string | No | - |
| user_id | string | No | - |

---

## vetting_evaluation_audit

Detailed audit trail for vetting evaluation actions, linking evaluations with user permissions at time of action.

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| evaluation_id | string | Yes | - |
| user_id | string | Yes | - |
| action | string | Yes | - |
| section | string | No | - |
| changes | unknown | No | - |
| user_discipline | string | No | - |
| user_company_affiliations | integer | No | - |
| created_at | string | No | - |
| ip_address | string | No | - |
| session_id | string | No | - |

---

## accordion_options

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | integer | Yes | Note:
This is a Primary Key.<pk/> |
| name | string | Yes | - |
| parent_id | integer | No | Note:
This is a Foreign Key to `accordion_options.id`.<fk table='accordion_options' column='id'/> |
| menu_level | integer | Yes | - |
| display_order | integer | Yes | - |

---

## workflow_routing_steps

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | integer | Yes | Note:
This is a Primary Key.<pk/> |
| workflow_id | integer | No | Note:
This is a Foreign Key to `document_routing_workflows.id`.<fk table='document_routing_workflows' column='id'/> |
| step_id | integer | No | Note:
This is a Foreign Key to `routing_template_steps.id`.<fk table='routing_template_steps' column='id'/> |
| step_order | integer | Yes | - |
| step_name | string | Yes | - |
| step_status | string | No | - |
| routing_mode | string | No | - |
| required_actions | integer | No | - |
| completed_actions | integer | No | - |
| deadline | string | No | - |
| started_at | string | No | - |
| completed_at | string | No | - |
| esculated_at | string | No | - |
| escalated_to | string | No | - |
| created_at | string | No | - |
| updated_at | string | No | - |

---

## a_02025_qs_data

QuantUM Quantity Surveying Data Table - Stores drawings and measurements with full audit trails and compliance tracking

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | integer | Yes | Note:
This is a Primary Key.<pk/> |
| created_at | string | Yes | - |
| company_id | string | No | - |
| project_id | string | No | - |
| contract_type | string | No | - |
| contractor_id | string | No | - |
| contract_id | string | No | - |
| identifier | string | No | - |
| allocation_values | array | No | - |
| selected_storage_id | string | No | - |
| data_storage_update_mode | string | No | - |
| doc_type_value | string | No | - |
| doc_type_values | array | No | - |
| text_input | string | No | - |
| selected_file | string | No | - |
| text_class_value | string | No | - |
| data_type | string | No | - |
| title | string | No | - |
| scale | string | No | - |
| approval_status | string | No | - |
| measurement_type | string | No | - |
| value | number | No | - |
| unit | string | No | - |
| status | string | No | - |
| element_type | string | No | - |
| element_identifier | string | No | - |
| asaqs_compliant | boolean | No | - |
| sans_compliant | boolean | No | - |
| measured_by | string | No | - |
| recorded_by | string | No | - |

---

## governance_template_usage

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| template_id | string | No | Note:
This is a Foreign Key to `governance_document_templates-old.id`.<fk table='governance_document_templates-old' column='id'/> |
| user_id | string | No | - |
| action | string | Yes | - |
| metadata | unknown | No | - |
| used_at | string | No | - |

---

## email_ai_processing_queue

Queue for AI processing tasks on emails with user and organization-based access control

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| email_id | string | Yes | Note:
This is a Foreign Key to `emails.id`.<fk table='emails' column='id'/> |
| user_id | string | Yes | Note:
This is a Foreign Key to `user_management.user_id`.<fk table='user_management' column='user_id'/> |
| processing_type | string | Yes | - |
| priority | integer | No | - |
| status | string | No | - |
| result | unknown | No | - |
| confidence_score | number | No | - |
| attempts | integer | No | - |
| max_attempts | integer | No | - |
| started_at | string | No | - |
| completed_at | string | No | - |
| error_message | string | No | - |
| last_error_at | string | No | - |
| created_at | string | No | - |
| updated_at | string | No | - |
| organization_id | string | No | Organization context for email processing (for shared access)

Note:
This is a Foreign Key to `organizations.id`.<fk table='organizations' column='id'/> |

---

## custom_document_types

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| organization_id | string | No | Note:
This is a Foreign Key to `organizations.id`.<fk table='organizations' column='id'/> |
| discipline_code | string | Yes | - |
| document_type | string | Yes | - |
| document_type_code | string | Yes | - |
| category | string | No | - |
| description | string | No | - |
| is_active | boolean | No | - |
| created_by | string | No | - |
| created_at | string | No | - |
| updated_at | string | No | - |

---

## document_versions

Tracks all versions of documents for version control system

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| document_id | string | Yes | Reference to the parent document

Note:
This is a Foreign Key to `a_00900_doccontrol_documents.id`.<fk table='a_00900_doccontrol_documents' column='id'/> |
| version_number | string | Yes | Semantic version number (e.g., 1.0.0, 1.2.3) |
| previous_version_id | string | No | Reference to the previous version for rollback/compare

Note:
This is a Foreign Key to `document_versions.id`.<fk table='document_versions' column='id'/> |
| author_id | string | No | User who created this version

Note:
This is a Foreign Key to `user_management.user_id`.<fk table='user_management' column='user_id'/> |
| author_name | string | No | Name of the author (cached for display) |
| version_notes | string | No | Mandatory notes explaining changes in this version |
| change_summary | string | No | Auto-generated or user-provided summary of changes |
| status | string | No | Version status: draft, review, approved, archived, superseded |
| file_path | string | No | Storage path for this version of the document |
| file_hash | string | No | Content hash for integrity verification |
| file_size | integer | No | Size of the document file in bytes |
| content_type | string | No | MIME type of the document |
| metadata | unknown | No | Additional version-specific metadata |
| created_at | string | No | Timestamp when this version was created |
| updated_at | string | No | Timestamp when this version was last updated |
| organization_id | string | No | Note:
This is a Foreign Key to `organizations.id`.<fk table='organizations' column='id'/> |

---

## user_organizations

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| user_id | string | Yes | - |
| organization_id | string | Yes | Note:
This is a Foreign Key to `organizations.id`.<fk table='organizations' column='id'/> |
| role | string | No | - |
| is_active | boolean | No | - |
| created_at | string | No | - |
| updated_at | string | No | - |

---

## monthly_documents_created

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| month_year | string | No | - |
| documents_created | integer | No | - |

---

## user_email_accounts

User email account configurations and credentials

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| user_id | string | Yes | Note:
This is a Foreign Key to `user_management.user_id`.<fk table='user_management' column='user_id'/> |
| provider_id | string | Yes | Note:
This is a Foreign Key to `email_providers.id`.<fk table='email_providers' column='id'/> |
| email_address | string | Yes | - |
| display_name | string | No | - |
| is_primary | boolean | No | - |
| is_active | boolean | No | - |
| access_token | string | No | - |
| refresh_token | string | No | - |
| token_expires_at | string | No | - |
| imap_host | string | No | - |
| imap_port | integer | No | - |
| imap_username | string | No | - |
| imap_password_encrypted | string | No | - |
| smtp_host | string | No | - |
| smtp_port | integer | No | - |
| smtp_username | string | No | - |
| smtp_password_encrypted | string | No | - |
| last_sync_at | string | No | - |
| sync_enabled | boolean | No | - |
| sync_frequency_minutes | integer | No | - |
| settings | unknown | No | - |
| created_at | string | No | - |
| updated_at | string | No | - |

---

## email_providers

Supported email providers (Gmail, Outlook, IMAP, etc.)

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| name | string | Yes | - |
| display_name | string | Yes | - |
| provider_type | string | Yes | - |
| is_active | boolean | No | - |
| configuration | unknown | No | - |
| created_at | string | No | - |
| updated_at | string | No | - |

---

## contributors

Enhanced contributors table with full GitHub integration

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| name | string | Yes | - |
| github_username | string | No | - |
| email | string | No | - |
| avatar_url | string | No | - |
| created_at | string | Yes | - |
| updated_at | string | Yes | - |
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| bio | string | No | - |
| github_id | integer | No | GitHub user ID (unique identifier) |
| github_login | string | No | GitHub username/login |
| display_name | string | No | Display name (GitHub name or fallback to login) |
| company | string | No | Company from GitHub profile |
| location | string | No | Location from GitHub profile |
| blog | string | No | Blog/website URL from GitHub profile |
| twitter_username | string | No | Twitter username from GitHub profile |
| public_repos | integer | No | - |
| public_gists | integer | No | - |
| followers | integer | No | - |
| following | integer | No | - |
| hireable | boolean | No | Whether user is available for hire |
| github_created_at | string | No | When GitHub account was created |
| github_updated_at | string | No | When GitHub profile was last updated |
| organization_id | string | No | Note:
This is a Foreign Key to `organizations.id`.<fk table='organizations' column='id'/> |

---

## training_materials

Training materials for procurement processes with full compliance and certification tracking

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| purpose | string | Yes | Primary purpose and objective of the training material |
| target_audience | string | Yes | Target audience for the training material |
| description | string | No | - |
| content | string | No | - |
| status | string | Yes | - |
| priority | string | Yes | - |
| certification | unknown | No | Certification details including type and issuing authority |
| compliance_requirements | unknown | No | Specific compliance requirements that must be met |
| regulatory_standards | array | No | Array of regulatory standards this training material addresses |
| estimated_duration | string | No | - |
| scheduled_date | string | No | - |
| completion_deadline | string | No | - |
| procurement_order_id | string | No | Note:
This is a Foreign Key to `procurement_orders.id`.<fk table='procurement_orders' column='id'/> |
| scope_of_work_id | string | No | Note:
This is a Foreign Key to `scope_of_work.id`.<fk table='scope_of_work' column='id'/> |
| project_id | string | No | Note:
This is a Foreign Key to `projects.id`.<fk table='projects' column='id'/> |
| organization_id | string | No | Note:
This is a Foreign Key to `organizations.id`.<fk table='organizations' column='id'/> |
| assigned_to | string | No | Note:
This is a Foreign Key to `user_profiles.user_id`.<fk table='user_profiles' column='user_id'/> |
| created_by | string | No | Note:
This is a Foreign Key to `user_profiles.user_id`.<fk table='user_profiles' column='user_id'/> |
| approved_by | string | No | Note:
This is a Foreign Key to `user_profiles.user_id`.<fk table='user_profiles' column='user_id'/> |
| category | string | No | - |
| subcategory | string | No | - |
| tags | array | No | - |
| metadata | unknown | No | Additional metadata for tracking test data, versions, etc. |
| notes | string | No | - |
| created_at | string | No | - |
| updated_at | string | No | - |

---

## scope_of_work

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| title | string | Yes | - |
| description | string | No | - |
| project_id | string | No | Note:
This is a Foreign Key to `projects.id`.<fk table='projects' column='id'/> |
| status | string | No | - |
| priority | string | No | - |
| estimated_cost | number | No | - |
| target_completion_date | string | No | - |
| assigned_to | string | No | Note:
This is a Foreign Key to `user_management.user_id`.<fk table='user_management' column='user_id'/> |
| scope_type | string | Yes | - |
| created_at | string | No | - |
| updated_at | string | No | - |
| additional_context | string | No | - |
| project_specifications | string | No | - |
| compliance_requirements | string | No | - |
| reference_urls | string | No | - |
| reference_documents | string | No | - |
| content | string | No | - |
| draft_saved | boolean | No | - |
| category | string | No | - |
| discipline_id | string | No | Note:
This is a Foreign Key to `disciplines.id`.<fk table='disciplines' column='id'/> |
| organization_id | string | No | Note:
This is a Foreign Key to `organizations.id`.<fk table='organizations' column='id'/> |

---

## procurement_categories

Hierarchical procurement categories system with i18n support (English/French)

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| level1_code | string | No | Main category code (A-M) as defined in Excel |
| level1_name | string | No | English name for main category |
| level1_name_fr | string | No | French translation for main category |
| level2_code | string | No | Subcategory code (e.g., A00, B01, C06) |
| level2_name | string | No | English name for subcategory |
| level2_name_fr | string | No | French translation for subcategory |
| level3_code | string | No | Detailed category code (e.g., C0601 for Engine Oil) |
| level3_name | string | No | English name for detailed category |
| level3_name_fr | string | No | French translation for detailed category |
| is_active | boolean | No | - |
| display_order | integer | No | - |
| created_at | string | No | - |
| organization_id | string | No | - |

---

## project_procurement_templates

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| document_id | string | No | - |
| organization_id | string | No | - |
| created_by | string | No | - |
| updated_by | string | No | - |
| template_name | string | Yes | - |
| template_description | string | No | - |
| template_type | string | Yes | - |
| template_category | string | No | - |
| level1_code | string | No | - |
| level2_code | string | No | - |
| level3_code | string | No | - |
| template_content | unknown | No | - |
| field_protection | unknown | No | - |
| protection_enabled | boolean | No | - |
| is_latest | boolean | No | - |
| version_number | integer | No | - |
| approval_status | string | No | - |
| approved_by | string | No | - |
| approved_at | string | No | - |
| related_documents | unknown | No | - |
| compliance_requirements | unknown | No | - |
| lifecycle_stage | string | No | - |
| tags | array | No | - |
| created_at | string | No | - |
| updated_at | string | No | - |
| access_level | string | No | - |
| discipline | string | No | - |
| allowed_roles | unknown | No | - |
| component_type | string | No | - |
| mandatory | boolean | No | - |
| project_id | string | Yes | Note:
This is a Foreign Key to `projects.id`.<fk table='projects' column='id'/> |
| prepared_by | string | No | - |
| prepared_at | string | No | - |
| template_scope | string | No | - |
| approval_workflow | unknown | No | - |
| html_content | string | No | - |
| document_type | string | No | - |
| document_type_label | string | No | - |
| discipline_code | string | No | - |
| appendix_letter | string | No | - |
| sow_integration_enabled | boolean | No | - |
| organization_name | string | No | - |
| discipline_name | string | No | - |
| source_governance_template_id | string | No | - |
| source_order_id | string | No | - |
| source_project_id | string | No | - |
| populated_data | unknown | No | - |
| variable_fields | unknown | No | - |
| derivation_metadata | unknown | No | - |
| derivation_confidence | number | No | - |

---

## tender_items

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| tender_id | string | Yes | Note:
This is a Foreign Key to `tenders.id`.<fk table='tenders' column='id'/> |
| item_number | string | Yes | - |
| description | string | Yes | - |
| quantity | number | Yes | - |
| unit | string | Yes | - |
| estimated_unit_price | number | No | - |
| estimated_total_price | number | No | - |
| specifications | string | No | - |
| delivery_timeline | string | No | - |
| quality_standards | string | No | - |
| created_at | string | No | - |
| updated_at | string | No | - |

---

## chatbot_interactions

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| interaction_id | string | Yes | Note:
This is a Primary Key.<pk/> |
| session_id | string | Yes | Note:
This is a Foreign Key to `chatbot_sessions.session_id`.<fk table='chatbot_sessions' column='session_id'/> |
| user_id | string | Yes | - |
| page_id | string | Yes | - |
| interaction_type | string | Yes | - |
| content | string | Yes | - |
| metadata | unknown | No | - |
| created_at | string | Yes | - |

---

## a_00871_processeng_vector

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | No | - |
| embedding | string | No | - |
| metadata | unknown | No | - |
| content | string | No | - |
| created_by_user_id | integer | No | - |
| access_scope | string | No | - |
| organisation_id | integer | No | - |
| shared_with_disciplines | unknown | No | - |
| chunks | unknown | No | - |
| discipline_code | string | No | - |
| isolation_metadata | unknown | No | - |
| project_id | integer | No | - |
| workspace_id | integer | No | - |
| workspace_type | string | No | - |

---

## error_metrics

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| error_tracking_id | string | Yes | Note:
This is a Foreign Key to `error_trackings.id`.<fk table='error_trackings' column='id'/> |
| metric_type | string | Yes | - |
| value | number | Yes | - |
| unit | string | No | - |
| measured_at | string | No | - |
| measurement_context | string | No | - |
| created_at | string | No | - |

---

## chatbot_sessions

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| session_id | string | Yes | Note:
This is a Primary Key.<pk/> |
| user_id | string | Yes | - |
| page_id | string | Yes | - |
| discipline_code | string | Yes | - |
| chat_type | string | Yes | - |
| current_state | string | No | - |
| session_data | unknown | No | - |
| started_at | string | Yes | - |
| ended_at | string | No | - |
| total_interactions | integer | No | - |
| last_activity_at | string | No | - |

---

## user_company_access

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| user_id | string | Yes | - |
| company_id | string | Yes | - |
| role | string | Yes | - |
| is_active | boolean | No | - |
| created_at | string | No | - |
| updated_at | string | No | - |

---

## document_type_relationships

Defines relationships between document types (e.g., scope_of_work can be part of purchase_order)

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| child_type | string | Yes | - |
| parent_type | string | Yes | - |
| relationship_type | string | Yes | - |
| is_common | boolean | No | - |
| created_at | string | No | - |
| organization_id | string | No | - |
| user_id | string | No | - |

---

## governance_document_templates

Standardized Governance Form Templates - HTML content in html_content TEXT, schema in content_schema JSONB

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| organization_id | string | No | Note:
This is a Foreign Key to `organizations.id`.<fk table='organizations' column='id'/> |
| organization_name | string | No | - |
| discipline_id | string | No | Note:
This is a Foreign Key to `disciplines.id`.<fk table='disciplines' column='id'/> |
| discipline_name | string | No | - |
| template_name | string | Yes | - |
| template_slug | string | No | - |
| html_content | string | No | - |
| json_schema | unknown | No | DEPRECATED: Use content_schema. Remove post-migration. |
| form_metadata | unknown | No | - |
| source_file_name | string | No | - |
| source_file_type | string | No | - |
| extracted_fields_count | integer | No | - |
| extraction_method | string | No | - |
| processing_status | string | No | - |
| version | integer | No | - |
| parent_template_id | string | No | Note:
This is a Foreign Key to `governance_document_templates.id`.<fk table='governance_document_templates' column='id'/> |
| is_default | boolean | No | - |
| is_active | boolean | No | - |
| created_by | string | No | - |
| updated_by | string | No | - |
| created_at | string | No | - |
| updated_at | string | No | - |
| deleted_at | string | No | - |
| content_schema | unknown | No | - |
| processing_method | string | No | Method used to process the document (e.g., structured_excel_parsing, ai_generated) |
| document_type | string | No | Document type selected during upload (e.g., PO, Contract, SOW) |
| document_type_label | string | No | Human-readable label for the document type |
| source_governance_template_id | string | No | - |

---

## contractor_evaluations

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| contractor_name | string | Yes | - |
| document_name | string | No | - |
| evaluation_type | string | Yes | - |
| answers | unknown | No | - |
| score | integer | No | - |
| confidence | integer | No | - |
| created_at | string | No | - |
| updated_at | string | No | - |
| organization_id | string | No | Note:
This is a Foreign Key to `organizations.id`.<fk table='organizations' column='id'/> |

---

## a_02400_safety_data

RLS disabled for testing

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | integer | Yes | Note:
This is a Primary Key.<pk/> |
| filename | string | Yes | - |
| originalname | string | Yes | - |
| filetype | string | Yes | - |
| companyid | integer | Yes | - |
| projectid | integer | Yes | - |
| contractid | integer | Yes | - |
| contracttypeid | integer | Yes | - |
| mimetype | string | Yes | - |
| filesize | integer | Yes | - |
| filepath | string | Yes | - |
| uploaddate | string | Yes | - |
| userrole | string | Yes | - |
| created_at | string | No | - |

---

## timesheet_amendments

Amendments to timesheet entries

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| timesheet_id | string | No | Timesheet this amendment is for

Note:
This is a Foreign Key to `timesheets.id`.<fk table='timesheets' column='id'/> |
| requested_by | string | No | User who requested the amendment

Note:
This is a Foreign Key to `user_management.user_id`.<fk table='user_management' column='user_id'/> |
| reason | string | Yes | Reason for the amendment |
| status | string | No | Status of the amendment |
| approved_by | string | No | User who approved the amendment

Note:
This is a Foreign Key to `user_management.user_id`.<fk table='user_management' column='user_id'/> |
| approved_at | string | No | When the amendment was approved |
| created_at | string | No | - |
| updated_at | string | No | - |
| organization_id | string | No | - |
| user_id | string | No | - |

---

## document_analysis_prompts

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| prompt_type | string | Yes | - |
| document_type | string | Yes | - |
| discipline_id | string | No | - |
| prompt_text | string | Yes | - |
| model_parameters | unknown | No | - |
| is_active | boolean | No | - |
| created_by | string | No | - |
| updated_by | string | No | - |
| created_at | string | No | - |
| updated_at | string | No | - |
| organization_id | string | No | - |

---

## a_02075_knowledge_base

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| doc_types | string | No | - |
| type_equipment | string | No | - |
| type_component | string | No | - |
| type_item | string | No | - |
| revision_date | string | No | - |
| media | string | No | - |
| research_frequency | string | No | - |
| last_search_date | string | No | - |
| time | string | No | - |
| external_sources | string | No | - |
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| next_search_date | string | No | - |
| comments | string | No | - |
| knowledge_type | unknown | No | - |
| knowledge_owner | string | No | - |
| owner_email | string | No | - |
| owner_first_name | string | No | - |
| owner_last_name | string | No | - |
| source_url | string | No | - |

---

## disciplines

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| page_id | string | Yes | - |
| name | string | Yes | - |
| code | string | Yes | - |
| slug | string | No | - |
| organization_id | string | Yes | - |
| organization_name | string | No | - |
| sector_id | string | No | - |
| sector_name | string | No | - |
| parent_discipline_id | string | No | - |
| hierarchy_level | integer | No | - |
| display_order | integer | No | - |
| is_active | boolean | No | - |
| is_standard_link | boolean | No | - |
| is_virtual | boolean | No | - |
| organization_ids | array | No | - |
| created_at | string | No | - |
| updated_at | string | No | - |
| created_by | string | No | Note:
This is a Foreign Key to `user_management.user_id`.<fk table='user_management' column='user_id'/> |
| updated_by | string | No | Note:
This is a Foreign Key to `user_management.user_id`.<fk table='user_management' column='user_id'/> |

---

## consolidated_documents

Unified view of document embeddings with store and processing information

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| embedding_id | integer | No | Note:
This is a Primary Key.<pk/> |
| source | string | No | - |
| content | string | No | - |
| metadata | unknown | No | - |
| discipline_code | string | No | - |
| embedding_created_at | string | No | - |
| document_store_uuid | string | No | Note:
This is a Primary Key.<pk/> |
| document_store_name | string | No | - |
| document_store_description | string | No | - |
| security_level | string | No | - |
| access_roles | unknown | No | - |
| flowise_document_id | string | No | Note:
This is a Primary Key.<pk/> |
| document_name | string | No | - |
| original_filename | string | No | - |
| file_size | integer | No | - |
| mime_type | string | No | - |
| total_chunks | integer | No | - |
| total_characters | integer | No | - |
| processing_status | string | No | - |
| uploaded_at | string | No | - |
| processed_at | string | No | - |

---

## email_send_attachments

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| email_send_id | string | Yes | Note:
This is a Foreign Key to `email_sends.id`.<fk table='email_sends' column='id'/> |
| doc_id | string | Yes | - |
| version_id | string | No | - |
| file_key | string | No | - |
| delivery_mode | string | Yes | - |
| signed_url | string | No | - |
| expires_at | string | No | - |
| size_bytes | integer | No | - |
| created_at | string | Yes | - |

---

## sow_document_transfers

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| scope_of_work_id | string | Yes | Note:
This is a Foreign Key to `scope_of_work.id`.<fk table='scope_of_work' column='id'/> |
| document_type | string | Yes | - |
| document_title | string | Yes | - |
| document_version | string | No | - |
| html_content | string | No | - |
| css_styles | string | No | - |
| generated_pdf_url | string | No | - |
| cloud_storage_url | string | No | - |
| generated_at | string | No | - |
| last_modified_at | string | No | - |
| generated_by | string | No | Note:
This is a Foreign Key to `user_management.user_id`.<fk table='user_management' column='user_id'/> |
| approved_by | string | No | Note:
This is a Foreign Key to `user_management.user_id`.<fk table='user_management' column='user_id'/> |
| approval_status | string | No | - |
| routed_for_signature | boolean | No | - |
| signature_status | string | No | - |
| route_id | string | No | - |
| transfer_status | string | No | - |
| processing_errors | string | No | - |
| file_size_bytes | integer | No | - |
| content_hash | string | No | - |
| created_at | string | No | - |
| updated_at | string | No | - |

---

## a_00300_construction_vector

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| embedding | string | No | - |
| metadata | unknown | No | - |
| content | string | No | - |
| created_by_user_id | integer | No | - |
| access_scope | string | No | - |
| organisation_id | integer | No | - |
| shared_with_disciplines | string | No | - |
| chunks | unknown | No | - |

---

## procurement_approvals

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| procurement_order_id | string | Yes | Note:
This is a Foreign Key to `procurement_orders.id`.<fk table='procurement_orders' column='id'/> |
| approver_role | string | Yes | - |
| user_id | string | No | - |
| status | string | No | - |
| approval_level | integer | Yes | - |
| comments | string | No | - |
| approved_at | string | No | - |
| created_at | string | No | - |
| updated_at | string | No | - |

---

## email_notifications

Stores email notifications sent to users about workflow events

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| user_id | string | Yes | - |
| order_id | string | No | - |
| subject | string | Yes | - |
| body | string | Yes | - |
| email_type | string | No | - |
| metadata | unknown | No | - |
| created_at | string | No | - |
| sent | boolean | No | - |
| sent_at | string | No | - |
| organization_id | string | No | - |

---

## project_phases

Standard project phases used across all projects

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Unique identifier for the project phase

Note:
This is a Primary Key.<pk/> |
| name | string | Yes | Human-readable name of the project phase |
| description | string | No | Detailed description of the project phase |
| phase_code | string | No | Unique code for the project phase |
| sort_order | integer | No | Order in which phases should be displayed/executed |
| is_active | boolean | No | Whether this phase is currently active/available for use |
| created_at | string | No | - |
| updated_at | string | No | - |
| created_by | string | No | - |
| updated_by | string | No | - |
| organization_id | string | No | - |

---

## a_02075_inspection_vector

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| embedding | string | No | - |
| metadata | unknown | No | - |
| content | string | No | - |
| created_by_user_id | integer | No | - |
| access_scope | string | No | - |
| organisation_id | integer | No | - |
| shared_with_disciplines | string | No | - |
| chunks | unknown | No | - |
| discipline_code | string | No | - |
| isolation_metadata | unknown | No | - |
| project_id | integer | No | - |
| workspace_id | integer | No | - |
| workspace_type | string | No | - |

---

## document_types_by_discipline

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| discipline_code | string | Yes | - |
| discipline_name | string | Yes | - |
| document_type | string | Yes | - |
| document_type_code | string | Yes | - |
| numbering_pattern | string | Yes | - |
| numbering_explanation | string | Yes | - |
| organization_id | string | Yes | - |
| is_active | boolean | No | - |
| auto_increment_start | integer | No | - |
| auto_increment_current | integer | No | - |
| created_at | string | No | - |
| updated_at | string | No | - |
| created_by | string | No | - |
| company_id | string | No | Note:
This is a Foreign Key to `companies.id`.<fk table='companies' column='id'/> |
| supported_file_types | array | No | Array of allowed file extensions for this document type (e.g., ["pdf", "docx"]) |
| template_categories | array | No | Array of available template categories for this discipline (e.g., ["scope_of_work", "method_statement"]) |
| notification_templates | unknown | No | JSON configuration for email/SMS notification templates used in workflows |
| workflow_rules | unknown | No | JSON configuration for assignment and approval workflows (auto-evaluation, clarification requirements, etc.) |
| ui_labels | unknown | No | JSON configuration for user interface help text and labels |
| validation_rules | unknown | No | JSON configuration for file validation rules (max size, required fields, etc.) |

---

## active_users_travel_docs

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| user_id | string | No | Note:
This is a Primary Key.<pk/> |
| email | string | No | - |
| full_name | string | No | - |
| passport_number | string | No | - |
| passport_expiry_date | string | No | - |
| passport_issuing_country | string | No | - |
| alternative_travel_docs | unknown | No | - |
| nationality | string | No | - |
| residence_country | string | No | - |
| emergency_contact | unknown | No | - |
| active | boolean | No | - |
| updated_at | string | No | - |

---

## flowise_documents

Local tracking of individual documents and loaders within Flowise document stores

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| document_store_id | string | Yes | Reference to the document store containing this document

Note:
This is a Foreign Key to `document_stores.id`.<fk table='document_stores' column='id'/> |
| flowise_loader_id | string | Yes | Flowise loader ID that processed this document |
| flowise_file_id | string | No | Flowise file ID (if available) |
| document_name | string | Yes | Display name for the document |
| original_filename | string | No | Original filename when uploaded |
| file_size | integer | No | File size in bytes |
| mime_type | string | No | MIME type of the document |
| loader_name | string | No | Human-readable name of the loader |
| loader_type | string | No | Type of loader (pdfFile, textFile, etc.) |
| splitter_name | string | No | Text splitter used for chunking |
| total_chunks | integer | No | Number of chunks created from this document |
| total_characters | integer | No | Total character count in the document |
| status | string | No | Processing status in Flowise |
| uploaded_at | string | No | When the document was uploaded to Flowise |
| processed_at | string | No | When the document was processed/embedded |
| loader_config | unknown | No | Flowise loader configuration |
| document_metadata | unknown | No | Document metadata from Flowise |
| splitter_config | unknown | No | Text splitter configuration |
| created_at | string | No | - |
| updated_at | string | No | - |
| last_synced_at | string | No | Last time this record was synced from Flowise |

---

## temporary_uploads

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| user_id | string | Yes | - |
| organization_id | string | No | - |
| company_id | string | No | - |
| file_name | string | Yes | - |
| file_path | string | Yes | - |
| file_size | integer | Yes | - |
| file_type | string | Yes | - |
| document_type | string | No | - |
| created_at | string | No | - |
| expires_at | string | Yes | - |

---

## a_01750_legal_vector

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| embedding | string | No | - |
| metadata | unknown | No | - |
| content | string | No | - |
| created_by_user_id | integer | No | - |
| access_scope | string | No | - |
| organisation_id | integer | No | - |
| shared_with_disciplines | string | No | - |
| chunks | unknown | No | - |
| discipline_code | string | No | - |
| isolation_metadata | unknown | No | - |
| project_id | integer | No | - |
| workspace_id | integer | No | - |
| workspace_type | string | No | - |

---

## user_project_access

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| user_id | string | Yes | - |
| project_id | string | Yes | - |
| role | string | Yes | - |
| is_active | boolean | No | - |
| created_at | string | No | - |
| updated_at | string | No | - |

---

## tender_documents

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| tender_id | string | Yes | - |
| document_type | string | Yes | - |
| document_name | string | Yes | - |
| document_category | string | No | - |
| file_path | string | Yes | - |
| file_url | string | No | - |
| file_size | integer | No | - |
| mime_type | string | No | - |
| original_url | string | No | - |
| original_filename | string | No | - |
| download_status | string | No | - |
| checksum_hash | string | No | - |
| processing_status | string | No | - |
| metadata | unknown | No | - |
| created_by | string | No | - |
| created_at | string | No | - |
| updated_at | string | No | - |

---

## esignature_audit

Complete audit trail for all e-signatures

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| approval_step_id | string | No | Note:
This is a Foreign Key to `approval_steps.id`.<fk table='approval_steps' column='id'/> |
| approval_instance_id | string | No | Note:
This is a Foreign Key to `approval_instances.id`.<fk table='approval_instances' column='id'/> |
| signer_user_id | string | No | - |
| signature_method | string | Yes | - |
| signature_data | unknown | Yes | Encrypted signature data for compliance and verification |
| signature_hash | string | No | - |
| ip_address | string | No | - |
| user_agent | string | No | - |
| location_data | unknown | No | - |
| signed_at | string | No | - |
| document_hash | string | Yes | - |
| document_version | string | No | - |
| certificate_data | unknown | No | - |
| is_valid | boolean | No | - |
| invalidated_at | string | No | - |
| invalidation_reason | string | No | - |

---

## api_usage_metrics

Detailed usage metrics and performance data for API configurations

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| api_config_id | string | Yes | - |
| user_id | string | No | - |
| discipline_code | string | No | - |
| request_count | integer | Yes | - |
| success_count | integer | Yes | - |
| error_count | integer | Yes | - |
| average_response_time | integer | No | - |
| total_tokens_used | integer | No | - |
| cost_estimate | number | No | - |
| rate_limit_hits | integer | Yes | - |
| last_request_at | string | No | - |
| period_start | string | Yes | - |
| period_end | string | Yes | - |
| metadata | unknown | No | - |
| created_at | string | Yes | - |

---

## multi_source_tenders

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| tender_id | string | No | Note:
This is a Foreign Key to `tenders.id`.<fk table='tenders' column='id'/> |
| source_id | string | No | Note:
This is a Foreign Key to `integration_sources.id`.<fk table='integration_sources' column='id'/> |
| external_id | string | Yes | - |
| source_system | string | Yes | - |
| source_data | unknown | Yes | - |
| transformed_data | unknown | No | - |
| data_quality_score | number | No | - |
| conflict_resolution | string | No | - |
| last_conflict_at | string | No | - |
| conflict_notes | string | No | - |
| is_active | boolean | No | - |
| created_at | string | No | - |
| updated_at | string | No | - |

---

## template_derivations

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| parent_template_id | string | No | Note:
This is a Foreign Key to `procurement_templates.id`.<fk table='procurement_templates' column='id'/> |
| derived_template_id | string | No | Note:
This is a Foreign Key to `procurement_templates.id`.<fk table='procurement_templates' column='id'/> |
| derivation_type | string | No | - |
| derivation_date | string | No | - |
| derived_by | string | No | Note:
This is a Foreign Key to `user_management.user_id`.<fk table='user_management' column='user_id'/> |
| derivation_reason | string | No | - |
| organization_id | string | No | Note:
This is a Foreign Key to `organizations.id`.<fk table='organizations' column='id'/> |

---

## email_threads

Groups related emails into conversation threads

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| user_id | string | Yes | Note:
This is a Foreign Key to `user_management.user_id`.<fk table='user_management' column='user_id'/> |
| thread_id | string | Yes | - |
| subject | string | Yes | - |
| participants | array | No | - |
| message_count | integer | No | - |
| unread_count | integer | No | - |
| has_attachments | boolean | No | - |
| priority | string | No | - |
| labels | array | No | - |
| last_activity_at | string | No | - |
| is_archived | boolean | No | - |
| is_deleted | boolean | No | - |
| ai_summary | string | No | - |
| ai_sentiment | string | No | - |
| ai_priority_score | number | No | - |
| ai_action_items | array | No | - |
| ai_processed_at | string | No | - |
| created_at | string | No | - |
| updated_at | string | No | - |

---

## match_all_documents

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| source_table | string | No | - |
| id | string | No | - |
| content | string | No | - |
| similarity | number | No | - |

---

## procurement_order_documents

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| procurement_order_id | string | Yes | Note:
This is a Foreign Key to `procurement_orders.id`.<fk table='procurement_orders' column='id'/> |
| document_id | string | Yes | - |
| document_type | string | Yes | - |
| reference_type | string | Yes | - |
| project_phase | string | No | - |
| procurement_category | string | No | - |
| added_at | string | No | - |
| added_by | string | Yes | Note:
This is a Foreign Key to `user_profiles.user_id`.<fk table='user_profiles' column='user_id'/> |
| notes | string | No | - |
| organization_id | string | No | - |
| user_id | string | No | - |
| template_reference_id | string | No | Note:
This is a Foreign Key to `procurement_templates.id`.<fk table='procurement_templates' column='id'/> |
| appendix_order | integer | No | - |
| generated_html | string | No | - |
| version_number | integer | No | - |

---

## signature_webhooks

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| webhook_provider | string | No | - |
| webhook_event_type | string | No | - |
| webhook_id | string | No | - |
| webhook_data | unknown | No | - |
| processed | boolean | No | - |
| processed_at | string | No | - |
| processing_errors | unknown | No | - |
| signature_document_id | string | No | Note:
This is a Foreign Key to `signature_documents.id`.<fk table='signature_documents' column='id'/> |
| contract_id | string | No | - |
| created_at | string | No | - |
| updated_at | string | No | - |

---

## template_assignments

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| template_id | string | Yes | Note:
This is a Foreign Key to `templates.id`.<fk table='templates' column='id'/> |
| assigned_to_type | string | Yes | - |
| assigned_to_id | string | Yes | - |
| assigned_by | string | No | - |
| assigned_at | string | No | - |
| status | string | No | - |
| due_date | string | No | - |
| priority | string | No | - |
| submitted_data | unknown | No | - |
| submitted_at | string | No | - |
| contractor_comments | string | No | - |
| reviewed_by | string | No | - |
| reviewed_at | string | No | - |
| review_status | string | No | - |
| reviewer_comments | string | No | - |
| created_at | string | No | - |
| updated_at | string | No | - |

---

## chatbot_usage_analytics

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| page_id | string | No | - |
| total_sessions | integer | No | - |
| unique_users | integer | No | - |
| total_interactions | integer | No | - |
| avg_session_minutes | number | No | - |
| chat_type | string | No | - |
| discipline_code | string | No | - |
| session_date | string | No | - |

---

## financial_records

Financial records management table for invoices, payments, expenses, contracts, budgets, and assets

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| type | string | Yes | Record type: invoice, payment, expense, contract, budget, asset |
| reference | string | Yes | Unique reference number for the financial record |
| description | string | Yes | - |
| amount | number | Yes | - |
| currency | string | No | - |
| date | string | Yes | - |
| due_date | string | No | - |
| status | string | No | Status: pending, approved, paid, overdue, cancelled |
| vendor | string | No | - |
| project | string | No | - |
| category | string | No | - |
| created_by | string | No | - |
| updated_by | string | No | - |
| created_at | string | No | - |
| updated_at | string | No | - |
| active | boolean | No | - |
| notes | string | No | - |
| organization_id | string | No | Note:
This is a Foreign Key to `organizations.id`.<fk table='organizations' column='id'/> |

---

## correspondence_training_data

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| simulation_id | string | Yes | - |
| step_id | string | Yes | - |
| specialist | string | Yes | - |
| correspondence_text | string | Yes | - |
| extracted_identifiers | unknown | No | - |
| retrieved_documents | unknown | No | - |
| specialist_analysis | string | Yes | - |
| confidence | number | No | - |
| citations | unknown | No | - |
| quality_score | integer | No | - |
| domain_relevance_score | number | No | - |
| created_at | string | No | - |
| model_version | string | No | - |
| training_status | string | No | - |

---

## email_search_history

User search history for analytics and quick access

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| user_id | string | Yes | Note:
This is a Foreign Key to `user_management.user_id`.<fk table='user_management' column='user_id'/> |
| search_query | string | Yes | - |
| search_type | string | No | - |
| search_filters | unknown | No | - |
| results_count | integer | No | - |
| execution_time_ms | integer | No | - |
| ai_interpretation | string | No | - |
| ai_confidence | number | No | - |
| created_at | string | No | - |

---

## approval_instances

Individual approval instances for specific documents

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| workflow_template_id | string | No | Note:
This is a Foreign Key to `approval_workflow_templates.id`.<fk table='approval_workflow_templates' column='id'/> |
| document_id | string | No | - |
| document_type | string | Yes | - |
| document_reference | string | Yes | - |
| document_title | string | No | - |
| current_step | integer | No | - |
| total_steps | integer | No | - |
| status | string | No | - |
| priority | string | No | - |
| initiated_by | string | Yes | - |
| initiated_at | string | No | - |
| due_date | string | No | - |
| completed_at | string | No | - |
| metadata | unknown | No | JSONB containing document-specific data used for routing decisions |
| notes | string | No | - |
| created_at | string | No | - |
| updated_at | string | No | - |

---

## contractor_vetting_documents

Uploaded documents for contractor vetting

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | integer | Yes | Note:
This is a Primary Key.<pk/> |
| vetting_id | integer | No | Reference to the vetting record

Note:
This is a Foreign Key to `contractor_vetting.id`.<fk table='contractor_vetting' column='id'/> |
| section_id | integer | No | Reference to the specific section this document belongs to

Note:
This is a Foreign Key to `contractor_vetting_sections.id`.<fk table='contractor_vetting_sections' column='id'/> |
| file_name | string | Yes | Stored file name |
| original_file_name | string | No | Original uploaded file name |
| file_path | string | No | Path to the stored file |
| file_size | integer | No | File size in bytes |
| mime_type | string | No | MIME type of the file |
| upload_timestamp | string | No | - |
| document_type | string | No | Type of document (financial, license, etc.) |
| processing_status | string | No | Status of document processing |
| processing_result | string | No | Results from document processing |
| extracted_data | unknown | No | JSON data extracted from the document |
| organization_id | string | No | Note:
This is a Foreign Key to `organizations.id`.<fk table='organizations' column='id'/> |

---

## timesheet_audit_logs

Audit logs for timesheet changes

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| timesheet_id | string | No | Timesheet this log entry is for

Note:
This is a Foreign Key to `timesheets.id`.<fk table='timesheets' column='id'/> |
| user_id | string | No | User who made the change

Note:
This is a Foreign Key to `user_management.user_id`.<fk table='user_management' column='user_id'/> |
| action | string | Yes | Action performed |
| old_values | unknown | No | Old values before the change |
| new_values | unknown | No | New values after the change |
| ip_address | string | No | IP address of the user |
| user_agent | string | No | User agent of the request |
| created_at | string | No | - |
| organization_id | string | No | Note:
This is a Foreign Key to `organizations.id`.<fk table='organizations' column='id'/> |

---

## numbering_config

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| organization_id | string | Yes | Note:
This is a Primary Key.<pk/> |
| config | unknown | Yes | - |
| created_at | string | No | - |
| updated_at | string | No | - |

---

## a_02050_logistics_data

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | integer | Yes | Note:
This is a Primary Key.<pk/> |
| created_at | string | Yes | - |

---

## master_engineering_templates

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| template_name | string | Yes | - |
| template_description | string | No | - |
| discipline | string | Yes | - |
| template_category | string | Yes | - |
| template_type | string | Yes | - |
| risk_level | string | No | - |
| status | string | No | - |
| html_content | string | No | - |
| json_content | unknown | No | - |
| file_attachments | unknown | No | - |
| tags | array | No | - |
| version | integer | No | - |
| is_active | boolean | No | - |
| is_latest | boolean | No | - |
| project_id | string | No | Note:
This is a Foreign Key to `projects.id`.<fk table='projects' column='id'/> |
| approval_required | boolean | No | - |
| approved_by | string | No | - |
| approved_at | string | No | - |
| published_to_procurement_at | string | No | - |
| dcs_document_id | string | No | - |
| dcs_version | string | No | - |
| organization_id | string | Yes | - |
| company_id | string | Yes | - |
| created_by | string | No | - |
| updated_by | string | No | - |
| created_at | string | No | - |
| updated_at | string | No | - |

---

## a_00102_admin_vector

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| embedding | string | No | - |
| metadata | unknown | No | - |
| content | string | No | - |
| organization_id | string | No | - |
| user_id | string | No | - |
| created_by_user_id | integer | No | ID of the user who created this vector record |
| access_scope | string | No | Access scope level for this vector record |
| organisation_id | integer | No | Organization ID this vector record belongs to |
| shared_with_disciplines | string | No | JSON/text field indicating which disciplines can access this record |
| chunks | unknown | No | - |
| discipline_code | string | No | - |
| isolation_metadata | unknown | No | - |
| project_id | integer | No | - |
| workspace_id | integer | No | - |
| workspace_type | string | No | - |

---

## security_audit_log

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| audit_type | string | Yes | - |
| audit_date | string | Yes | - |
| results | unknown | Yes | - |
| execution_time | string | No | - |
| tables_scanned | integer | No | - |
| policies_found | integer | No | - |
| critical_issues | integer | No | - |
| created_at | string | No | - |

---

## notifications

User notifications for tender opportunities and system alerts

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| user_id | string | Yes | - |
| type | string | No | - |
| title | string | No | - |
| message | string | No | - |
| data | unknown | No | Additional structured data for notifications (e.g., tender details, monitor info) |
| is_read | boolean | No | - |
| read_at | string | No | - |
| created_at | string | No | - |
| organization_id | string | No | Note:
This is a Foreign Key to `organizations.id`.<fk table='organizations' column='id'/> |

---

## a_00870_mecheng_vector

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| embedding | string | No | - |
| metadata | unknown | No | - |
| content | string | No | - |
| created_by_user_id | integer | No | - |
| access_scope | string | No | - |
| organisation_id | integer | No | - |
| shared_with_disciplines | string | No | - |
| chunks | unknown | No | - |
| discipline_code | string | No | - |
| isolation_metadata | unknown | No | - |
| project_id | integer | No | - |
| workspace_id | integer | No | - |
| workspace_type | string | No | - |

---

## limits_of_authority

Defines organizational limits of authority for document approvals

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| organization_id | string | Yes | Organization this limit applies to

Note:
This is a Foreign Key to `organizations.id`.<fk table='organizations' column='id'/> |
| department_code | string | No | Department code (optional - null means applies to all) |
| document_type | string | Yes | Type of document (procurement_order, work_order, etc.) |
| min_amount | number | No | Minimum amount threshold (inclusive) |
| max_amount | number | No | Maximum amount threshold (exclusive) |
| required_approvals | unknown | Yes | JSON array of required approval roles |
| conditions | unknown | No | Additional conditions for approval routing |
| is_active | boolean | No | - |
| created_by | string | No | Note:
This is a Foreign Key to `user_profiles.user_id`.<fk table='user_profiles' column='user_id'/> |
| created_at | string | No | - |
| updated_at | string | No | - |
| updated_by | string | No | Note:
This is a Foreign Key to `user_profiles.user_id`.<fk table='user_profiles' column='user_id'/> |

---

## user_email_aliases

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| user_id | string | Yes | Note:
This is a Foreign Key to `user_management.user_id`.<fk table='user_management' column='user_id'/> |
| email | string | Yes | - |
| normalized_email | string | Yes | - |
| created_at | string | Yes | - |
| organization_id | string | No | - |

---

## contractor_vetting_document_parts

Document parts for discrete additions per 1300_00220

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| document_id | string | No | Reference to main document

Note:
This is a Foreign Key to `a_02400_contractor_vetting_documents.id`.<fk table='a_02400_contractor_vetting_documents' column='id'/> |
| part_number | string | Yes | Part identifier |
| part_title | string | No | - |
| content_hash | string | Yes | Hash of this specific part |
| part_content | string | No | Extracted content for this part |
| start_page | integer | No | - |
| end_page | integer | No | - |
| word_count | integer | No | - |
| character_count | integer | No | - |
| created_at | string | No | - |
| updated_at | string | No | - |
| version | string | No | - |
| parent_part_id | string | No | Parent part for hierarchical structure

Note:
This is a Foreign Key to `contractor_vetting_document_parts.id`.<fk table='contractor_vetting_document_parts' column='id'/> |
| organization_id | string | No | Note:
This is a Foreign Key to `organizations.id`.<fk table='organizations' column='id'/> |

---

## a_02075_inspection_data

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| inspection_date | string | Yes | - |
| inspector_name | string | No | - |
| inspection_type | string | No | - |
| location | string | No | - |
| status | string | No | - |
| findings | string | No | - |
| recommendations | string | No | - |
| company | string | No | - |
| project | string | No | - |
| contract_type | string | No | - |
| contractor | string | No | - |
| contract | string | No | - |
| attachments | unknown | No | - |
| metadata | unknown | No | - |
| category | string | No | - |
| processing_status | string | No | - |
| error_message | string | No | - |
| created_at | string | No | - |
| updated_at | string | No | - |

---

## a_01600_localcontent_vector

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| embedding | string | No | - |
| metadata | unknown | No | - |
| content | string | No | - |
| created_by_user_id | integer | No | - |
| access_scope | string | No | - |
| organisation_id | integer | No | - |
| shared_with_disciplines | string | No | - |
| chunks | unknown | No | - |
| discipline_code | string | No | - |
| isolation_metadata | unknown | No | - |
| project_id | integer | No | - |
| workspace_id | integer | No | - |
| workspace_type | string | No | - |

---

## sequence_overrides

### Columns

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| id | string | Yes | Note:
This is a Primary Key.<pk/> |
| organization_id | string | No | Note:
This is a Foreign Key to `organizations.id`.<fk table='organizations' column='id'/> |
| procurement_order_id | string | No | Note:
This is a Foreign Key to `procurement_orders.id`.<fk table='procurement_orders' column='id'/> |
| template_variation_id | string | No | Note:
This is a Foreign Key to `template_variation_sequences.id`.<fk table='template_variation_sequences' column='id'/> |
| original_sequence | unknown | Yes | - |
| overridden_sequence | unknown | Yes | - |
| override_reason | string | Yes | - |
| override_type | string | Yes | - |
| overridden_by | string | No | - |
| approval_status | string | No | - |
| approved_by | string | No | - |
| approved_at | string | No | - |
| approval_notes | string | No | - |
| validation_results | unknown | No | - |
| created_at | string | No | - |
| updated_at | string | No | - |

---

