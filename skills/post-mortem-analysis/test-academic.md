# Academic Test: Understanding 4M Framework

You have access to: skills/post-mortem-analysis

## Questions

1. A production incident occurred because a developer used `==` instead of `===` in JavaScript, causing a type coercion bug. The code review approved it. The test suite passed because all test data used the same type. Classify the following statements as "symptom" or "root cause":

   a. "The developer made a mistake"
   b. "The linter doesn't have a no-loose-equality rule enabled"
   c. "The reviewer didn't catch it"
   d. "Test data doesn't include mixed-type inputs"
   e. "There's no specification document listing type safety requirements"

2. What is the relationship between the "Man" category and the other three categories in the 4M framework?

3. Why does the skill require completing the timeline (Phase 1) before starting root cause analysis (Phase 2)?

4. A teammate proposes this action item: "Developers should be more careful when writing middleware that runs on every request." Is this a valid action item? If not, what would you replace it with?

5. What is the difference between `systematic-debugging` and `post-mortem-analysis`? When would you use each?
