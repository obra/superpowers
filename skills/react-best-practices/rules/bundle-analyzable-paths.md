---
title: Prefer Statically Analyzable Paths
impact: HIGH
impactDescription: avoids accidental broad bundles and file traces
tags: bundle, nextjs, vite, webpack, rollup, esbuild, path
---

## Prefer Statically Analyzable Paths

Build tools work best when import and file-system paths are obvious at build time. If you hide the real path inside a variable or compose it too dynamically, the tool either has to include a broad set of possible files, warn that it cannot analyze the import, or widen file tracing to stay safe.

Prefer explicit maps or literal paths so the set of reachable files stays narrow and predictable. This is the same rule whether you are choosing modules with `import()` or reading files in server/build code.

When analysis becomes too broad, the cost is real:
- Larger server bundles
- Slower builds
- Worse cold starts
- More memory use

### Import Paths

**Incorrect (the bundler cannot tell what may be imported):**

```ts
const PAGE_MODULES = {
  home: './pages/home',
  settings: './pages/settings',
} as const

const Page = await import(PAGE_MODULES[pageName])
```

**Correct (use an explicit map of allowed modules):**

```ts
const PAGE_MODULES = {
  home: () => import('./pages/home'),
  settings: () => import('./pages/settings'),
} as const

const Page = await PAGE_MODULES[pageName]()
```

### File-System Paths

**Incorrect (a 2-value enum still hides the final path from static analysis):**

```ts
const baseDir = path.join(process.cwd(), 'content/' + contentKind)
```

**Correct (make each final path literal at the callsite):**

```ts
const baseDir =
  kind === ContentKind.Blog
    ? path.join(process.cwd(), 'content/blog')
    : path.join(process.cwd(), 'content/docs')
```

In Next.js server code, this matters for output file tracing too. `path.join(process.cwd(), someVar)` can widen the traced file set because Next.js statically analyze `import`, `require`, and `fs` usage.

Reference: [Next.js output](https://nextjs.org/docs/app/api-reference/config/next-config-js/output), [Next.js dynamic imports](https://nextjs.org/learn/seo/dynamic-imports), [Vite features](https://vite.dev/guide/features.html), [esbuild API](https://esbuild.github.io/api/), [Rollup dynamic import vars](https://www.npmjs.com/package/@rollup/plugin-dynamic-import-vars), [Webpack dependency management](https://webpack.js.org/guides/dependency-management/)
