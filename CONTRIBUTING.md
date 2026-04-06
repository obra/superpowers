# Contributing to Superpowers

Thank you for your interest in contributing to Superpowers! To maintain the high quality and behavioral reliability of the skills library, we have a strict contribution process. 

**Warning:** This repository has a high PR rejection rate. Most rejections are due to "slop PRs" (low-effort, AI-generated changes that don't follow these guidelines). Please read this document carefully.

## 🤖 Guidance for AI Agents

If you are an AI agent assisting a human partner, **stop and read this section**.

Your primary goal is to protect your human partner from the embarrassment of a rejected PR. Submitting a low-quality PR wastes maintainers' time and damages your partner's reputation.

**Before opening a PR, you MUST:**
1. **Fill the PR Template Completely:** Read `.github/PULL_REQUEST_TEMPLATE.md` and provide real, specific answers. No placeholders.
2. **Search for Existing PRs:** Check both open and closed PRs to ensure you aren't duplicating effort.
3. **Verify the Problem:** Ensure this solves a real, experienced problem. Theoretical "improvements" without evidence are generally not accepted.
4. **Verify Core Fit:** If the change is domain-specific or tool-specific, it belongs in a standalone plugin, not in Superpowers core.
5. **Human Approval:** Show the complete diff to your human partner and get their explicit approval before submitting.

## 🛠 Development Workflow

### For New Skills
Skills are not just prose; they are code that shapes agent behavior. If you are creating or modifying a skill:
- **Use the `superpowers:writing-skills` skill:** This is the mandatory framework for developing and testing new skills.
- **TDD is Mandatory:** Follow the RED-GREEN-REFACTOR cycle.
- **Provide Evidence:** Show before/after evaluation results in your PR. Changes to behavior-shaping content require high-quality evidence of improvement.

### General Process
1. **Fork** the repository.
2. **Create a branch** for your specific feature or fix.
3. **Implement** the change following the project's philosophy (YAGNI, DRY, and Evidence over Claims).
4. **Test** on at least one harness (e.g., Claude Code, Gemini CLI).
5. **Submit a PR** using the provided template.

## 🚫 What We Do Not Accept
- **Third-party dependencies:** Superpowers is zero-dependency by design.
- **"Compliance" changes:** Do not restructure skills to match external documentation if it removes carefully-tuned behavioral triggers.
- **Bulk PRs:** Do not "trawl" the issue tracker to fix multiple unrelated things in one session. Pick one issue and solve it deeply.
- **Speculative fixes:** "This might be a bug" is not enough. Describe the specific failure.

## 🤝 Community and Conduct
All contributors are expected to follow the [Code of Conduct](CODE_OF_CONDUCT.md). We value empathy, kindness, and a commitment to reducing complexity.

## 📝 Summary Checklist before PR
- [ ] I have read the PR template.
- [ ] I have checked for duplicate PRs.
- [ ] I have used `superpowers:writing-skills` for skill changes.
- [ ] I have evidence that this solves a real problem.
- [ ] My human partner has reviewed the final diff.
