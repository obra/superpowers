---
title: Frontend Fundamentals - Improve Core Web Vitals with Lazy Loading
date: 2024-06-18
categories:
- Frontend Fundamentals
tags:
- core web vitals
- LCP
- CLS
- lazy-loading
- performance
- turbo
ready: true
description: Smartly use image lazy loading to improve core web vitals such as LCP and CLS
---

## Table of Contents

- [Overview](#overview)
- [Key Principles](#key-principles)
- [Implementation](#implementation)
  - [Inline Script for Above-the-Fold Images](#inline-script-for-above-the-fold-images)
  - [Preconnect for Image Domains](#preconnect-for-image-domains)
  - [Complete HTML Example](#complete-html-example)
- [Important Considerations for Turbo](#important-considerations-for-turbo)


## Overview

Core Web Vitals measure real-world user experience. This document covers optimizing Largest Contentful Paint (LCP) and Cumulative Layout Shift (CLS) through proper image lazy loading, which is critical for Turbo-driven applications.

## Key Principles

- Lazy load offscreen images using `loading="lazy"` but avoid lazy loading for the LCP element (typically the hero image)
- The `loading` attribute must be rendered server-side, not added via JavaScript on `turbo:load` or `DOMContentLoaded`, as images will have already started loading
- Always include `width` and `height` attributes on images to prevent layout shift
- Browser viewport thresholds for "off screen" vary between browsers, devices, and resolutions

## Implementation

### Inline Script for Above-the-Fold Images

An inline `<script>` tag must be placed at the bottom of the `<body>` element (before closing `</body>`) to detect and remove the `loading` attribute from images above the fold. This script runs before image fetching begins, which is critical for Turbo navigation where pages load dynamically.

```html
<script type="text/javascript">    
  const images = document.querySelectorAll('img');
  images.forEach(img => {
      if(img.width > 640) {
        img.removeAttribute("loading");
      }
  });
</script>
```

This script filters images by width (640px threshold) and removes the `loading` attribute from larger images that are likely to be above the fold and contribute to LCP.

### Preconnect for Image Domains

Use `rel="preconnect"` in the `<head>` to establish an SSL handshake ahead of time for the domain serving images:

```html
<link rel="preconnect" href="https://picsum.photos" />
```

For LCP images, consider using `rel="preload"` instead, though this requires proper CORS headers.

### Complete HTML Example

```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Hotwire Starter</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />

    <link rel="stylesheet" href="styles.css" />
    <link rel="preconnect" href="https://picsum.photos" />

    <script type="importmap" data-turbo-track="reload">
      {
        "imports": {
          "@hotwired/turbo": "https://ga.jspm.io/npm:@hotwired/turbo@8.0.4/dist/turbo.es2017-esm.js",
          "@hotwired/stimulus": "https://ga.jspm.io/npm:@hotwired/stimulus@3.2.2/dist/stimulus.js"
        }
      }
    </script>

    <script type="module">
      import 'app';
    </script>
  </head>
  <body>
    <main class="container">
      <h1>Hero Section</h1>
      <img alt="hero" src="https://picsum.photos/id/552/1280/720" loading="lazy" width="1280" height="720"></img>
    </main>
    <footer class="container">
      <div class="grid">
        <article>
          <header>Article Title</header>
          <img src="https://picsum.photos/id/500/640/480.webp" loading="lazy" width="640" height="480"></img>
        </article>
      </div>
    </footer>
    <script type="text/javascript">    
      const images = document.querySelectorAll('img');
      images.forEach(img => {
          if(img.width > 640) {
            img.removeAttribute("loading");
          }
      });
    </script>
  </body>
</html>
```

## Important Considerations for Turbo

- The inline script must be in the HTML before images begin loading. Using `window.onload`, `DOMContentLoaded`, or `turbo:load` is too late
- The `loading` attribute must be present in the server-rendered HTML. Adding it via JavaScript after page load or Turbo navigation will not prevent initial image loading
- Use `data-turbo-track="reload"` on script elements that should be reloaded on Turbo navigation, such as import maps
