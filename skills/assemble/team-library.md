# Assemble — Team Library

The PM selects teams from this library based on the project. Not all teams are needed for every project. The PM picks the minimum set that covers the work.

---

## Selection Rule

For each team, ask: does this project need this function? If yes, include it. If the work is thin enough that one team can absorb it, merge rather than add overhead.

---

## Default Teams

### Research Team
- **Mission focus:** Understand the problem space — competitive landscape, technical options, feasibility, risks
- **Lead role:** Research Lead
- **Specialist roles:** Domain Analyst, Technical Researcher
- **Output artifact:** `docs/research-notes.md`
- **Common tasks:** Literature review, vendor comparison, technical feasibility, risk assessment

### Product Team
- **Mission focus:** Define what to build — feature set, user stories, success metrics, scope boundaries
- **Lead role:** Product Lead
- **Specialist roles:** UX Researcher, Product Analyst
- **Output artifact:** `docs/product-spec.md`
- **Common tasks:** Requirements definition, user stories, success metrics, MVP scope

### Design Team
- **Mission focus:** Define how it feels — UX flows, interaction patterns, design decisions
- **Lead role:** Design Lead
- **Specialist roles:** UX Designer, Interaction Designer
- **Output artifact:** `docs/ux-flows.md`
- **Common tasks:** User journey mapping, interaction flows, design decisions, accessibility notes

### Engineering Team
- **Mission focus:** Build it — implementation plan, architecture decisions, code
- **Lead role:** Engineering Lead
- **Specialist roles:** Backend Engineer, Frontend Engineer
- **Output artifacts:** `docs/implementation-plan.md`, code files as needed
- **Common tasks:** Architecture design, implementation plan, core feature code, API design
- **Dependencies:** Typically depends on Research and Product

### Infra Team
- **Mission focus:** Make it run — environments, deployment, infrastructure, DevOps
- **Lead role:** Infra Lead
- **Specialist roles:** DevOps Engineer, Cloud Architect
- **Output artifact:** `docs/infra-plan.md`
- **Common tasks:** Environment setup, deployment pipeline, cloud infrastructure, monitoring plan
- **Dependencies:** Typically depends on Research

### QA Team
- **Mission focus:** Make it right — test strategy, acceptance criteria, quality gates
- **Lead role:** QA Lead
- **Specialist roles:** Test Engineer, Automation Engineer
- **Output artifact:** `docs/qa-checklist.md`
- **Common tasks:** Test strategy, acceptance criteria, test cases, automation plan
- **Dependencies:** Typically depends on Engineering and Product

### Analysis Team
- **Mission focus:** Understand the data — analysis, metrics, insights, reporting
- **Lead role:** Analysis Lead
- **Specialist roles:** Data Analyst, BI Engineer
- **Output artifact:** `docs/analysis-report.md`
- **Common tasks:** Data analysis, metrics definition, insight generation, dashboard spec
- **Dependencies:** None

### Program Management Team
- **Mission focus:** Keep it on track — risk register, timeline, cross-team dependencies, status
- **Lead role:** Program Manager
- **Specialist roles:** Risk Analyst, Dependency Tracker
- **Output artifact:** `docs/risk-register.md`
- **Common tasks:** Risk identification, timeline planning, dependency mapping, status tracking
- **Dependencies:** None
