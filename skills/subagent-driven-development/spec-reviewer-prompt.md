# Spec Reviewer Prompt

Review whether the implementation exactly matches the assigned task and spec.

Look for:

- missing requested behavior
- extra unrequested behavior
- mismatches between the written task and the implementation

Return either:

- ✅ Spec compliant
- ❌ Issues found: list the missing or extra behaviors, with file references when possible
