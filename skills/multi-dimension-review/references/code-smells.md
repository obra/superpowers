# Code Smells Reference

Load this before reviewing for the code-smells dimension. Report a smell
only when it has impact — the code is about to be edited repeatedly, or the
smell is itself a bug nest. When unsure, drop it.

## Before the smell pass — measure the touched files

Run `wc -l` on every file listed in package.files, in the repository
working tree. Each source or test file around 500 lines or more gets
one full read with one question: does it carry several unrelated
responsibilities? Do this first — the diff's own smells will consume
your attention if you let them go first.

Record the pass in the findings file even when clean: one line per
measured file — `# measure: <path> <n> lines — cohesive | mixed
responsibilities`. If mixed, write the god-file finding and do not
drop it against the impact bar: a file that accretes one
responsibility per PR is edited repeatedly by construction, and the
diff under review is one more of those edits. Cohesion is the
criterion — size alone is never a finding.

## Structure

- Long method — does several jobs, nesting deeper than 3 levels (arrow
  anti-pattern)
- God class — one class carrying many responsibilities
- God file — one module (or test file) carrying several unrelated
  responsibilities; found by the measure-first pass above
- Long parameter list — more than 4-5 parameters
- Data clump — the same group of fields/params travels together everywhere
- Primitive obsession — strings/ints standing in for a domain type

## Duplication and dead weight

- Duplicated code — copy-paste blocks differing in a few names
- Dead code — uncalled functions, unreachable branches, commented-out code
- Speculative generality — abstraction/params kept "just in case"
- Middle man / lazy class — classes that only delegate or are nearly empty
- Comment as deodorant — long comments explaining tangled code instead of
  fixing it

## Coupling

- Feature envy — a method touches another class's data more than its own
- Inappropriate intimacy — reaching into another class's internals
- Message chains — a.getB().getC().getD().run()
- Shotgun surgery — one change forces edits across many files
- Divergent change — one class changes for many unrelated reasons
- Global mutable state / hidden side effects not implied by the name

## Conditionals and flow

- Switch-on-type — repeated case/isinstance chains instead of polymorphism
- Boolean flag parameter — one function, two behaviors
- Unnamed complex conditionals — extract a named variable or function
- Swallowed exception — empty catch, or log-and-ignore
- Magic numbers and strings
- Mixed error strategies — null returns and error codes interleaved
  inconsistently
- Inconsistent naming — one concept, several names

## Language spot-checks (apply to the languages in the diff)

- Python: mutable default arguments, bare `except`, string concatenation
  in loops
- JS/TS: loose `==`, sequential `await` in loops that should be parallel,
  `any` leakage, wrong `useEffect` dependencies
- Go: discarded errors (`_`), empty error branches

## Out of scope

Anything a linter, typechecker, or compiler catches: formatting, imports,
type errors, mechanical naming. CI already runs those; reporting them is
noise.
