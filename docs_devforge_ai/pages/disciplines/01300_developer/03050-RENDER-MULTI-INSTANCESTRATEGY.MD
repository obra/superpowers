# Render Multi‑Instance Strategy with render.yaml

This document describes the simplest, repeatable way to run multiple instances (prod, staging, and optional customer-specific instances) of this app on Render using a single codebase, standardized build/start commands, and a render.yaml file for declarative setup.

## Goals

- One codebase, multiple instances
- Consistent build/start across environments
- Easy to add more instances later
- Keep secrets per instance in Render
- Support both single multi-tenant instance (subdomain-based) and separate services per customer

---

## Standard Build/Start Commands

All instances should use the same commands so the client is built and the server serves the SPA:

Build Command:
```
npm ci
npm --prefix client ci
npm --prefix client run build
```

Start Command:
```
cd server && npm start
```

Notes:
- The client webpack build outputs to `client/dist2` (as per client/config/webpack.config.cjs).
- The server (server/app.js) serves `client/dist2` statically and includes an SPA fallback so `/` and client routes work.
- The server binds to `process.env.PORT` (Render sets this automatically).

---

## render.yaml Template

Create a `render.yaml` at the repo root. Example with two web services (prod and staging). You can add customer instances similarly.

```yaml
services:
  - type: web
    name: construct-ai-prod
    env: node
    branch: main
    buildCommand: |
      npm ci
      npm --prefix client ci
      npm --prefix client run build
    startCommand: cd server && npm start
    autoDeploy: true
    plan: free
    region: oregon
    envVars:
      - key: NODE_ENV
        value: production
      - key: SUPABASE_URL
        sync: false
      - key: SUPABASE_ANON_KEY
        sync: false
      - key: FLOWISE_API_ENDPOINT
        sync: false
      - key: FLOWISE_API_KEY
        sync: false
      - key: FLOW_ID
        sync: false
      - key: POSTGRES_HOST
        sync: false

  - type: web
    name: construct-ai-staging
    env: node
    branch: develop
    buildCommand: |
      npm ci
      npm --prefix client ci
      npm --prefix client run build
    startCommand: cd server && npm start
    autoDeploy: true
    plan: free
    region: oregon
    envVars:
      - key: NODE_ENV
        value: staging
      - key: SUPABASE_URL
        sync: false
      - key: SUPABASE_ANON_KEY
        sync: false
      - key: FLOWISE_API_ENDPOINT
        sync: false
      - key: FLOWISE_API_KEY
        sync: false
      - key: FLOW_ID
        sync: false
      - key: POSTGRES_HOST
        sync: false
```

How to use:
1) Commit this file to the branch Render uses to create services (or create them manually then link to this YAML).
2) For each service listed, Render will create or update a Web Service when you click "New +" → "Blueprint" in the Render dashboard and point to your repo branch with this render.yaml.
3) After creation, go to each service’s Environment tab and set the `sync: false` variables securely.

Adding more instances (e.g., per customer):
- Copy one of the service blocks and change:
  - `name` (e.g., `construct-ai-customer1`)
  - `branch` (optional; can stay on main)
  - Set customer-specific env vars:
    - Either use default `SUPABASE_URL` and `SUPABASE_ANON_KEY`
    - Or add namespaced variants (e.g., `SUPABASE_URL_CUSTOMER1`) and update server behavior accordingly if you want strict isolation.
- Optionally attach a custom domain per instance (Render dashboard → "Custom Domains").

---

## Multi‑Tenant vs Per‑Customer Services

You have two patterns:

A) Single Multi‑Tenant Instance (subdomain-based)
- Run one production service.
- Use wildcard subdomain `*.construct-ai.yourdomain.com` mapped to the service.
- Your existing `getCustomerId()` and `getCustomerConfig()` can select per-customer config based on subdomain.
- Pros: Fewer services, easier ops.
- Cons: Shared resources; careful testing for tenant isolation; heavier single service.

B) Separate Services Per Customer
- Create one Render service per customer via additional blocks in `render.yaml`.
- Each gets its own env vars, optional custom domain.
- Pros: Isolation, separate scaling, less blast radius.
- Cons: More services to manage.

Recommended:
- Start with separate services per environment (prod/staging) using the YAML above.
- Add per-customer services only where isolation is required.

---

## Environment Variables Checklist

Set per instance in Render:
- SUPABASE_URL, SUPABASE_ANON_KEY
- FLOWISE_API_ENDPOINT, FLOWISE_API_KEY, FLOW_ID
- POSTGRES_HOST
- Optional customer-specific keys (if using namespaced config)
- You typically do NOT need to set `PORT` on Render (it injects this automatically).

Server-side sanity logs (already present in server/src/index.js) display whether critical envs are SET/MISSING on startup.

---

## Deploy Flow

1) Push changes to the branch(s) your services track (main for prod, develop for staging).
2) Render auto-deploys (autoDeploy: true) or click Manual Deploy.
3) Verify:
   - `/` serves the SPA.
   - `/index.html` returns 200.
   - `/health` returns `{"status":"healthy"}`.
   - A known API under `/api/...` responds.

---

## Troubleshooting

- "Cannot GET /" or "Cannot GET /index.html"
  - Confirm the Build Command ran the client build and webpack produced files under `client/dist2`.
  - Confirm `express.static` is mounted after `const app = express();` and SPA fallback is present.
- API 404 when navigating the SPA:
  - Ensure SPA fallback is after API routes (so it doesn’t shadow `/api`).

---

## FAQ

Q: Do I need Docker?
- No. You can ignore the Python Dockerfile in this repo. Render’s Node environment with the above Build/Start commands is sufficient.

Q: How do I add a new customer instance quickly?
- Duplicate a service block in `render.yaml`, change its `name`, set env vars, and create via Render Blueprint. Optionally assign a custom domain.

Q: Can each instance use a different branch?
- Yes; set the `branch` field per service (e.g., `main` for prod, `develop` for staging, customer-specific branches if needed).

---

## Summary

- Use `render.yaml` to define prod/staging (+optional customer services).
- Standardize Build/Start commands to guarantee the client is built and served.
- Keep secrets in Render’s environment for each service.
- Choose multi-tenant or per-customer deployment based on isolation needs.
