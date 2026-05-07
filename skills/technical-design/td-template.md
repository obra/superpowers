# Technical Design Markdown Template

Extracted from `[TD]Sample.pdf`, with additional optional sections for implementation completeness. Prefer the live Feishu template when available; use this as the local fallback/checklist.

## Header

- Title: `[TD][APPlifier] <Title> / <名称>`
- Task title/link:
- Product/module:
- PM:
- RD:
- BE:
- FE:
- QA:
- Timeline: TD Review / Start Dev / Dev & Self Testing / Complete / QA Start

## Change Log

| Version | Date | Description | Updated By | Color / Highlight |
|---------|------|-------------|------------|-------------------|
| V0.9 |  | Initial version |  |  |

## 1. Background / 背景

Describe task background, current state, problem, scope constraints, and why this work is needed.

## 2. Overview

High-level module design. Include when useful:

- System architecture / component diagram.
- High-level flow / system interaction diagram.
- Data flow diagram.
- Text summary of key decisions and boundaries.

## 3. Feature List

List all TD target features. Every technical and non-technical PRD/TRD requirement must be represented and confirmed via brainstorming.

| # | Feature / Requirement | Source | Priority | Confirmation | Remarks / TD Coverage |
|---|-----------------------|--------|----------|--------------|-----------------------|

## 4. External-Interaction Design / 对外交互设计

Overview for other services/modules that interact with this service.

### 4.1 External-Facing APIs / MQs

| # | Priority | External API / MQ | APPlifier API / Topic | Remarks |
|---|----------|-------------------|------------------------|---------|

### 4.2 Error Codes / 错误码

| Error Code | Name | Message | Remarks |
|------------|------|---------|---------|

## 5. Detailed Design / 详细设计

Segment by sub-module/component for large systems, or by feature for specific modules/FRs. Required when applicable: API contracts, detailed logic flow, data design, data size/QPS estimates, cache, MQ, system config.

### 5.x <Feature / Module / Component>

#### 5.x.1 API Design / API 设计

| Category | Priority | API / RPC | Description | Request | Response | Error Codes | Remarks |
|----------|----------|-----------|-------------|---------|----------|-------------|---------|

#### 5.x.2 Key Flow / 关键流程

- Summary:
- Flow chart:
- Text description:
- Edge cases:
- Idempotency / concurrency:
- Complex algorithm steps:
- Failure and retry behavior:

#### 5.x.3 Data Store / 数据存储设计

| DB / Store | Table / Key / Topic | Data Size Estimation | QPS Estimation | Schema / Contract | Index / TTL / Partition | Remarks |
|------------|---------------------|----------------------|----------------|-------------------|-------------------------|---------|

#### 5.x.4 Cache

| Description | Value |
|-------------|-------|
| Redis Key | `<tenant_id>:<module>:<entity>:<identifier>` |
| Data Type |  |
| Value Schema |  |
| TTL |  |
| Invalidation |  |

#### 5.x.5 MQ

| Field | Value |
|-------|-------|
| Topic | `applifier.<module>.<topic>` |
| Producer |  |
| Consumer |  |
| QPS |  |
| Message Schema |  |
| Retry / DLQ |  |

#### 5.x.6 System Configuration / 系统配置

| Key | Description | Structure | Default | Rollout / Compatibility |
|-----|-------------|-----------|---------|-------------------------|

### 5.y Metrics & Alerts / 监控告警

| Metric | Tags | Type | Description | Alerts |
|--------|------|------|-------------|--------|

## 6. Release Checklist / 发布清单

| Step # | Services / Components | Operation | Verification | Rollback Operation |
|--------|-----------------------|-----------|--------------|--------------------|

## 7. References

- PRD:
- TRD:
- BE guidelines:
- API schema:
- Related TDs:

## Optional Completeness Sections

Add these when not covered above:

- Security / permissions / privacy.
- Multi-tenancy.
- Migration / backfill.
- Compatibility.
- Test plan: unit, integration, E2E, performance, data verification.
- Risks, open questions, and `待定` ledger.
