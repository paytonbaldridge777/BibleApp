# 🚀 Deployment Guide — Shepherd (Cloudflare Pages + Cloudflare Worker)

This guide walks you through deploying Shepherd end-to-end using only GitHub and the Cloudflare dashboard — no local tooling required.

**Architecture**

```
Browser → Cloudflare Pages (Next.js frontend)
                ↓ fetch + Authorization: Bearer <supabase-jwt>
         Cloudflare Worker (BibleApp-api — REST API)
                ↓ supabase-js (service role or anon + RLS)
         Supabase (PostgreSQL + Auth)
```

---

## Prerequisites

| Service | What you need |
|---------|---------------|
| [Supabase](https://supabase.com) | Project URL + anon key + service-role key |
| [OpenAI](https://platform.openai.com) | API key |
| [Cloudflare](https://dash.cloudflare.com) | Free account |
| GitHub | Both repos pushed to your account |

---

## Part 1 — Supabase Setup

1. Go to [app.supabase.com](https://app.supabase.com) and create a new project.
2. In **SQL Editor**, paste and run the entire contents of `supabase/schema.sql` from the frontend repo.
3. In **Authentication → Providers**, ensure **Email** is enabled.
4. Copy the following from **Settings → API**:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon / public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY` *(Worker only — never expose in frontend)*

---

## Part 2 — Cloudflare Worker (BibleApp-api)

The Worker handles the three API endpoints (`/onboarding`, `/guidance`, `/feedback`).  
It lives in the **paytonbaldridge777/BibleApp-api** repository.

### 2a. Connect the repo to Cloudflare Workers

1. In the [Cloudflare dashboard](https://dash.cloudflare.com), go to **Workers & Pages → Create application → Pages → Connect to Git** (or use the Workers section for a standalone Worker).
2. Alternatively, use **Workers & Pages → Import a Worker** and select the `BibleApp-api` repository.
3. Set the **build command** (if using a build step) or leave blank for a pure JS/TS Worker.

### 2b. Add Worker secrets

In **Workers & Pages → BibleApp-api → Settings → Variables**, add these as **encrypted secrets**:

| Secret name | Value |
|-------------|-------|
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Your Supabase service-role key |
| `OPENAI_API_KEY` | Your OpenAI API key |

### 2c. Note the Worker URL

After deploying the Worker you will receive a URL such as:

```
https://bibleapp-api.<your-subdomain>.workers.dev
```

Save this — you will use it as `NEXT_PUBLIC_API_BASE_URL` for the frontend.

### 2d. CORS configuration

The Worker must return the following headers on every response (including preflight `OPTIONS` requests):

```
Access-Control-Allow-Origin: https://<your-pages-domain>.pages.dev
Access-Control-Allow-Methods: GET, POST, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
```

Replace `<your-pages-domain>` with your actual Cloudflare Pages domain once it is known.

### 2e. Worker endpoints

The Worker must implement these endpoints (the frontend calls them with a Supabase JWT in the `Authorization: Bearer` header):

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/onboarding` | Save onboarding answers, generate & save spiritual profile, mark onboarding complete |
| `GET`  | `/guidance`   | Fetch today's guidance record for the authenticated user |
| `POST` | `/guidance`   | Generate or regenerate daily guidance (`{ "action": "generate" or "regenerate" }`) |
| `POST` | `/feedback`   | Save guidance feedback (`{ "guidance_id": "...", "feedback_type": "helpful" or "not_relevant" or "favorite" }`) |

All endpoints authenticate the caller by verifying the JWT with Supabase:

```typescript
// Example auth check in Worker
const authHeader = request.headers.get('Authorization') ?? '';
const token = authHeader.replace('Bearer ', '');
const { data: { user }, error } = await supabase.auth.getUser(token);
if (error || !user) return new Response('Unauthorized', { status: 401 });
```

The business logic for the Worker is already implemented in the frontend repo as reference:

- `lib/ai/openai.ts` — OpenAI content generation
- `lib/ai/prompts.ts` — system & user prompts
- `lib/profiles/generate.ts` — onboarding → spiritual profile conversion
- `lib/scripture/selector.ts` — smart theme selection
- `lib/scripture/themes.ts` — scripture theme data

---

## Part 3 — Cloudflare Pages (Frontend)

### 3a. Connect the frontend repo

1. In the Cloudflare dashboard go to **Workers & Pages → Create application → Pages**.
2. Click **Connect to Git** and select the **paytonbaldridge777/BibleApp** repository.
3. Choose the branch to deploy (e.g. `main`).

### 3b. Build settings

| Setting | Value |
|---------|-------|
| Framework preset | **Next.js** |
| Build command | `npx @cloudflare/next-on-pages` |
| Build output directory | `.vercel/output/static` |
| Node.js version | `20` |

> **Note:** Cloudflare Pages uses `@cloudflare/next-on-pages` to adapt Next.js for the edge runtime.  
> Add the package to the project: in the Cloudflare Pages build settings you can add a custom install command of  
> `npm install && npm install --save-dev @cloudflare/next-on-pages`.

### 3c. Add environment variables

In **Workers & Pages → BibleApp → Settings → Environment variables**, add these for the **Production** environment:

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon key |
| `NEXT_PUBLIC_API_BASE_URL` | Your Worker URL from Part 2c (e.g. `https://bibleapp-api.<subdomain>.workers.dev`) |
| `NEXT_PUBLIC_APP_URL` | Your Pages URL (e.g. `https://bibleapp.pages.dev`) |

> `OPENAI_API_KEY` is **not** needed in the frontend — only in the Worker.

### 3d. Deploy

Click **Save and Deploy**. Cloudflare will build and deploy the site. After the first deployment you will receive a `*.pages.dev` URL.

### 3e. Update CORS in the Worker

Once you know your Pages URL, go back to the Worker (Part 2d) and update the `Access-Control-Allow-Origin` header to match your Pages domain.

### 3f. Update Supabase redirect URLs

In Supabase **Authentication → URL Configuration**:

- **Site URL**: your Pages URL (e.g. `https://bibleapp.pages.dev`)
- **Redirect URLs**: add `https://bibleapp.pages.dev/auth/callback`

---

## Part 4 — Custom Domain (Optional)

1. In Cloudflare **Pages → BibleApp → Custom domains**, add your domain.
2. In Worker → **Custom domains**, add an API subdomain such as `api.yourdomain.com`.
3. Update `NEXT_PUBLIC_API_BASE_URL` in Pages environment variables to the custom domain.
4. Update CORS in the Worker and Supabase redirect URLs accordingly.

---

## Environment Variables Summary

### Frontend (Cloudflare Pages)

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Supabase public anon key |
| `NEXT_PUBLIC_API_BASE_URL` | ✅ | Cloudflare Worker base URL (no trailing slash) |
| `NEXT_PUBLIC_APP_URL` | ✅ | Frontend public URL |

### Backend Worker (Cloudflare Workers — BibleApp-api)

| Variable | Required | Description |
|----------|----------|-------------|
| `SUPABASE_URL` | ✅ | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Supabase service-role key (keep secret) |
| `OPENAI_API_KEY` | ⚠️ Optional | OpenAI key — fallback templates used if absent |

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| `401 Unauthorized` from Worker | Ensure the Supabase JWT is being sent — check `NEXT_PUBLIC_API_BASE_URL` is set correctly in Pages env vars |
| CORS errors in browser | Verify `Access-Control-Allow-Origin` in the Worker matches the Pages domain exactly |
| Supabase auth redirect fails | Add the Pages URL to **Supabase → Authentication → URL Configuration → Redirect URLs** |
| Pages build fails | Ensure `@cloudflare/next-on-pages` is installed and the build command is set correctly |
| Worker 500 errors | Check Worker logs in **Cloudflare dashboard → Workers & Pages → BibleApp-api → Logs** |
