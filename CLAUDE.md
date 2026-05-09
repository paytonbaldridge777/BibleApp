# Shepherd's Compass -- Frontend

- Never use em-dashes in generated text
- Always read the live file before editing -- never work from a cached copy
- `redirect()` must never be inside a try/catch block (swallows NEXT_REDIRECT)
- Use `window.location.href` for post-auth redirects, not `router.push`
- After a Supabase recovery-mode password update, sign out before redirecting to login
- `middleware.ts` was deleted intentionally -- do not recreate it
- `layout.tsx` must not contain auth checks -- caused a redirect loop previously
- Don’t assume. Don’t hide confusion. Surface tradeoffs.
- Minimum code that solves the problem. Nothing speculative.

