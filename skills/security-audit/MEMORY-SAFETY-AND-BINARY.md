# Memory Safety, Binary, and Kernel Hunting

#### When to use this file

Reach for this file when the target processes untrusted bytes in a memory-unsafe or privileged context: C/C++/Objective-C, Rust `unsafe`, FFI, kernel modules and drivers, parsers and decoders, network daemons, firmware, binary loaders, language runtimes, and JITs. Use `PROTOCOLS-RPC-AND-MESSAGING.md` for protocol authorization and state-machine logic, and this file for process integrity, memory safety, ABI boundaries, and loader behavior.

Pick relevant classes from Phase 1 and split large targets by parser, allocator/lifetime, FFI, concurrency, loader, runtime, or privileged interface.

## Core discipline (include in every agent prompt for this domain)

```
- Re-derive every bound and lifetime from attacker-controlled inputs and all callers. Validate against the worst accepted case, not a typical test vector.
- A panic, sanitizer finding, or crash proves a defect only when a realistic untrusted input reaches it. Do not infer memory corruption, code execution, or shared availability impact from a label alone.
- Validate in a local harness with sanitizers, deterministic concurrency tests, existing fuzz targets, and debugger-assisted fault classification. Stop after proving the violated invariant and observable impact; do not develop post-corruption techniques.
- Assembly, JIT code, custom allocators, intra-object accesses, and foreign libraries can escape sanitizer coverage. Identify which relevant instructions are instrumented.
- Classify as `confirmed` only after source evidence and bounded local validation establish the defect and effect. Use `needs_validation` when ABI, allocator, architecture, feature, deployment, or reachability facts remain unknown.
```

## Bounds, integer, and representation attack classes (subagent_type: `general`)

**Out-of-bounds read or write**
A length, offset, index, or terminator reaches a fixed or allocated buffer without a correct bound. Recalculate available headroom after prefixes, alignment, padding, and terminators. Check both source and destination capacity, and whether a short input is read before its declared length is trusted.

**Integer overflow, underflow, truncation, and signedness**
Review attacker-controlled arithmetic before allocation, copy, loop, indexing, and pointer operations. High-hit patterns include `a - b` with `b > a`, `count * element_size`, additions near the type maximum, negative values converted to unsigned, 64-bit lengths narrowed to 32-bit fields, and sentinel values such as `-1` becoming a large size. Confirm which checked representation is later used.

**Unit and pointer-depth confusion**
Code mixes bytes, elements, code units, pages, words, wire units, or nested pointer element sizes. Compare the unit at parse, validation, allocation, API boundary, and copy. A bounds check using the same wrong unit as the allocation is still wrong.

**Uninitialized or partially initialized data**
A buffer, padding, struct field, or vector capacity is returned, compared, hashed, serialized, or passed across a trust boundary before initialization. Require an observable consumer and realistic output length; stack allocation by itself is not disclosure.

## Lifetime, type, and concurrency attack classes (subagent_type: `general`)

**Use-after-free, stale view, and double free**
Owners are released while callbacks, wait queues, timers, iterators, borrowed slices, or cached raw pointers can still use them. Review every error, cancellation, close, and realloc path. For embedded notification anchors, each free path must drain or detach all observers.

**Type confusion and invalid downcast**
A tag, vtable, union discriminator, object kind, or foreign handle is checked differently from the representation later read. Look for unchecked dynamic casts, stale tags after reuse, and serialized types whose validated element differs from the element consumed. Confirm a wrong-type read or write locally without extending the test beyond the violated invariant.

**Reference-count and ownership races**
Non-atomic retain/release, a check followed by an unlocked use, or inconsistent ownership across threads can free or mutate an object during access. Compare fast, error, shutdown, and compatibility paths for the same lock and ownership rules.

**Shared-state races and TOCTOU**
Concurrent parser streams, global caches, lazy initialization, signal handlers, and resource teardown can invalidate bounds, policy, or pointers established earlier. Verify the race with a repeatable local schedule, barrier, or thread sanitizer; a hypothetical interleaving without a security-relevant state transition remains `needs_validation`.

**Lock-order, deadlock, and starvation**
Externally reachable operations acquire locks in inconsistent order or hold them across callbacks and blocking I/O. Report under availability only when bounded input can stop shared progress; otherwise record it for fixing as a concurrency defect.

## FFI and ABI attack classes (subagent_type: `general`)

**Pointer-length and ownership contract mismatch**
Caller and callee disagree on who allocates, frees, pins, or mutates a buffer, how long a pointer remains valid, or whether a length is bytes or elements. Trace both sides of every `extern`, CGo/JNI/Python/native binding, and generated wrapper. Check null, zero length, aliasing, and callback retention.

**Layout, alignment, and enum disagreement**
Foreign code receives a struct, bitfield, packed record, callback signature, integer width, enum, or calling convention that differs by architecture or build flag. Verify `repr`, packing, alignment, endianness, and ABI-specific types. An in-repo declaration mismatch can be confirmed locally; an opaque foreign implementation requires `needs_validation`.

**Unwind, exception, and thread-affinity violations**
Exceptions or panics cross an ABI that forbids unwinding, callbacks run after teardown, or APIs requiring one runtime thread are invoked elsewhere. Review error conversion and cancellation. Confirm whether the process aborts or state is corrupted before assigning impact.

## Binary loading and runtime attack classes (subagent_type: `general`)

**Library, plugin, and executable search-order trust**
A privileged process loads a library, plugin, runtime image, or helper from a path writable by a less-trusted principal, or resolves a bare name through an attacker-influenceable working directory or environment. Compare intended installation ownership with each fallback and compatibility search path. A user loading their own plugin into their own process is not a boundary violation.

**Missing artifact identity or signature binding**
A loader verifies one file or metadata record but maps a different image because path resolution, file replacement, architecture slices, or embedded resources are not bound to the check. Supply-channel authenticity belongs in `SUPPLY-CHAIN-AND-RELEASE.md`; this class covers the local verification-to-map gap.

**Malformed binary metadata and relocation handling**
Offsets, counts, sections, relocations, symbols, bytecode, or debug metadata are trusted before range, overlap, and representation checks. Test parsers with bounded local fixtures and sanitizers. Separate memory corruption from a safely rejected malformed file.

**JIT and generated-code consistency**
Validator, interpreter, optimizer, and generated code disagree about types, bounds, side effects, or lifetime. Diff optimized and unoptimized paths using the same local input. Confirm a process-integrity effect; output variance that stays within language semantics is not a finding.

**Unload, reload, and teardown safety**
Live function pointers, callbacks, worker threads, or data views survive module unload or runtime reset. Review shutdown and failed-load cleanup as closely as startup.

## Kernel and privileged-interface attack classes (subagent_type: `general`)

**User-copy bounds and repeated reads**
A syscall, ioctl, driver, or kernel parser derives a trusted fact from user memory then reads the same mutable address again. Copy the full request once or revalidate the later copy. Also audit size, direction, and access checks at each user-copy primitive.

**Privileged object lifecycle and dispatch consistency**
Externally reachable objects have unbalanced retain/release, teardown without observer drain, unchecked selector/table indices, or duplicated compatibility paths that omit a guard. Diff each dispatch and free path side by side.

**Under-authorized powerful interfaces**
A device node, admin socket, helper, or management API validates shape but not the caller's authority over the resource. Establish actual interface ownership and reachability; permissions or sandbox policy outside the repository make this `needs_validation`.

## Universal moves (apply across the above)

- Audit fixes and duplicated paths for the same source-to-sink shape. A check in one caller, architecture, protocol role, feature flag, or compatibility path does not protect its siblings.
- Build a table for every parser or FFI boundary: accepted length/type, checked representation, allocation owner, consumer, thread, and teardown. Most native findings are one disagreement in that table.
- Use existing corpora and small locally generated boundary fixtures. Save exact sanitizer/runtime output and the input property that triggers it; avoid large resource consumption and any live target.

## Validation rules (apply before reporting ANY finding here)

1. Establish a realistic untrusted entry and exact operation that violates a bounds, type, lifetime, ABI, concurrency, loader, or authority invariant.
2. Classify the observable effect: invalid read, invalid write, stale alias, wrong object, uninitialized output, unauthorized image load, deadlock, or safe process termination. Do not claim a stronger effect than observed.
3. Run the narrowest local harness, existing test, sanitizer, or fuzzer needed to reproduce the effect. Verify sanitizer coverage of the faulting operation and record architecture/build conditions.
4. For concurrency, use a deterministic schedule or sanitizer trace. For binary loading, prove the checked identity differs from the mapped identity and name the lower-trust writer.
5. Return `confirmed` findings only with exact input, source trace, and observed result. Return `needs_validation` for a specific unresolved reachability, ABI, build, deployment, or runtime fact and state the bounded check needed.
