---
name: Predict Issues
description: Proactive problem identification through forward-looking risk analysis with likelihood, impact, timeline, and effort assessment
when_to_use: after implementing features, before deployment, during architecture reviews, or when evaluating technical decisions
version: 1.0.0
---

# Predictive Code Analysis

I'll analyze your codebase to predict potential problems before they impact your project.

## Strategic Thinking Process

<think>
To make accurate predictions, I need to consider:

1. **Pattern Recognition**
   - Which code patterns commonly lead to problems?
   - Are there growing complexity hotspots?
   - Do I see anti-patterns that will cause issues at scale?
   - Are there ticking time bombs (hardcoded values, assumptions)?

2. **Risk Assessment Framework**
   - Likelihood: How probable is this issue to occur?
   - Impact: How severe would the consequences be?
   - Timeline: When might this become a problem?
   - Effort: How hard would it be to fix now vs later?

3. **Common Problem Categories**
   - Performance: O(n²) algorithms, memory leaks, inefficient queries
   - Maintainability: High complexity, poor naming, tight coupling
   - Security: Input validation gaps, exposed secrets, weak auth
   - Scalability: Hardcoded limits, single points of failure

4. **Prediction Strategy**
   - Start with highest risk areas (critical path code)
   - Look for patterns that break at 10x, 100x scale
   - Check for technical debt accumulation
   - Identify brittleness in integration points
</think>

Based on this analysis framework, I'll use native tools for comprehensive analysis:
- **Grep tool** to search for problematic patterns
- **Glob tool** to analyze file structures and growth
- **Read tool** to examine complex functions and hotspots

I'll examine:
- Code complexity trends and potential hotspots
- Performance bottleneck patterns forming
- Maintenance difficulty indicators
- Architecture stress points and scaling issues
- Error handling gaps

For each prediction, I'll:
- Show specific code locations with file references
- Explain why it's likely to cause future issues
- Estimate potential timeline and impact
- Suggest preventive measures with priority levels

When I find multiple issues, I'll create a TodoWrite list for systematic review and prioritization.

Analysis areas:
- Functions approaching complexity thresholds
- Files with high change frequency (potential hotspots)
- Dependencies with known issues or update requirements
- Performance patterns that don't scale
- Code duplication leading to maintenance issues

After analysis, I'll ask: "How would you like to track these predictions?"
- Document in memory: I'll store risk assessments for future reference
- Create tracking items: I'll generate a structured list of issues to address
- Summary only: I'll provide actionable report without task creation

**Important**: I will NEVER:
- Add "Created by Claude" or any AI attribution to issues
- Include "Generated with Claude Code" in descriptions
- Modify repository settings or permissions
- Add any AI/assistant signatures or watermarks

Predictions will include:
- Risk level assessment (Critical/High/Medium/Low)
- Estimated timeline for potential issues
- Specific remediation recommendations
- Impact assessment on project goals

This helps prevent problems before they impact your project, saving time and maintaining code quality proactively.
