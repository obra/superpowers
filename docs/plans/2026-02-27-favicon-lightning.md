# Favicon Lightning Bolt Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the existing kanban favicons with a purple→blue gradient rounded-square lightning bolt icon.

**Architecture:** Two SVG files (light/dark), pure vector, no build step required. Drop-in replacement for existing `favicon-vk-light.svg` and `favicon-vk-dark.svg` in the public package.

**Tech Stack:** SVG, linearGradient, feGaussianBlur (dark glow variant)

---

### Task 1: Write light mode favicon

**Files:**
- Modify: `kanban/frontend/packages/public/favicon-vk-light.svg`

**Step 1: Write the SVG**

Replace file content with:

```svg
<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#7C3AED"/>
      <stop offset="100%" stop-color="#3B82F6"/>
    </linearGradient>
  </defs>
  <rect width="32" height="32" rx="7" fill="url(#grad)"/>
  <path d="M19 3L10 18H16L13 30L22 15H16L19 3Z" fill="white"/>
</svg>
```

**Step 2: Verify in browser**

Open `kanban/frontend/packages/public/favicon-vk-light.svg` in browser — should show purple→blue rounded square with white lightning bolt.

**Step 3: Commit**

```bash
git add kanban/frontend/packages/public/favicon-vk-light.svg
git commit -m "feat: replace favicon with gradient lightning bolt (light)"
```

---

### Task 2: Write dark mode favicon

**Files:**
- Modify: `kanban/frontend/packages/public/favicon-vk-dark.svg`

**Step 1: Write the SVG**

Replace file content with (same gradient + subtle glow on bolt):

```svg
<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#7C3AED"/>
      <stop offset="100%" stop-color="#3B82F6"/>
    </linearGradient>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="1.5" result="blur"/>
      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>
  <rect width="32" height="32" rx="7" fill="url(#grad)"/>
  <path d="M19 3L10 18H16L13 30L22 15H16L19 3Z" fill="white" filter="url(#glow)"/>
</svg>
```

**Step 2: Verify in browser**

Open file in browser — lightning bolt should have a soft white glow.

**Step 3: Commit**

```bash
git add kanban/frontend/packages/public/favicon-vk-dark.svg
git commit -m "feat: replace favicon with gradient lightning bolt (dark)"
```
