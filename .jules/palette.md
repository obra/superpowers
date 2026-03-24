## 2025-02-26 - Sync aria-pressed with visual selection states
**Learning:** When using custom visual classes like `selected` on elements acting as buttons (`role="button"`), screen readers do not automatically announce the state change.
**Action:** Always manually sync `aria-pressed="true"` or `"false"` when toggling the visual selection class to ensure complete accessibility for interactive toggle elements.
