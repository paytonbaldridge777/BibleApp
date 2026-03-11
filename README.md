# 🌿 Shepherd — Personalized Bible Guidance

Shepherd is a production-ready web application that delivers daily, personalized Bible guidance based on each user's spiritual journey, needs, and preferences. It combines Scripture curation with AI-generated devotionals, prayers, and reflections.
*Bump3 to force new build

---

## ✨ Features

- **Personalized Onboarding**: 5-step questionnaire capturing spiritual needs, Bible familiarity, tone preferences, and devotional length
- **Daily Guidance**: Curated Scripture verses paired with AI-generated devotionals, prayers, and reflection prompts
- **Smart Theme Selection**: Intelligent verse selection based on user needs, feedback history, and variety
- **Feedback & Favorites**: Mark guidance as helpful, save favorites, and flag irrelevant content
- **Streak Tracking**: Visual streak counter to encourage daily engagement
- **Crisis Detection**: Built-in detection of crisis-related text with immediate display of mental health resources
- **Mobile Responsive**: Beautiful, warm design that works on all screen sizes
- **Row-Level Security**: All user data protected with Supabase RLS policies

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| AI | OpenAI GPT-4o-mini |
| Forms | React Hook Form + Zod |
| Frontend Hosting | Cloudflare Pages |
| Backend API | Cloudflare Worker (paytonbaldridge777/BibleApp-api) |

---

## 🚀 Local Setup

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd shepherd
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

```bash
cp .env.example .env.local
```

Edit `.env.local` with your values:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_API_BASE_URL=https://your-worker.your-subdomain.workers.dev
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Set up Supabase

1. Go to [supabase.com](https://supabase.com) and create a new project
2. In the SQL Editor, run the contents of `supabase/schema.sql`
3. In **Authentication > Settings**, enable Email auth provider
4. (Optional) Set up email confirmation settings

### 5. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔑 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | ✅ Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anonymous key | ✅ Yes |
| `NEXT_PUBLIC_API_BASE_URL` | Base URL of the Cloudflare Worker API (no trailing slash) | ✅ Yes |
| `NEXT_PUBLIC_APP_URL` | Your app's public URL | ✅ Yes |

> `OPENAI_API_KEY` is only needed in the **Cloudflare Worker** (BibleApp-api), not in the frontend.

---

## 🗄 Supabase Setup Steps

1. Create a new Supabase project at [app.supabase.com](https://app.supabase.com)
2. Copy your **Project URL** and **anon/public key** from Settings > API
3. Go to **SQL Editor** and paste the entire contents of `supabase/schema.sql`, then run it
4. Go to **Authentication > Providers** and ensure **Email** is enabled
5. Optionally configure email templates in **Authentication > Email Templates**

---

## 📦 Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for the full step-by-step guide to deploy the frontend to **Cloudflare Pages** and the backend API to a **Cloudflare Worker**.

## 🗺 App Routes

| Route | Description |
|-------|-------------|
| `/` | Landing page |
| `/auth/login` | Login |
| `/auth/signup` | Sign up |
| `/auth/callback` | OAuth callback |
| `/onboarding` | 5-step spiritual profile questionnaire |
| `/dashboard` | Daily guidance dashboard |
| `/favorites` | Saved favorite guidance |
| `/settings/profile` | View and update spiritual profile |

> The `/api/*` routes have been removed from the frontend. All backend API calls are handled by the Cloudflare Worker in [paytonbaldridge777/BibleApp-api](https://github.com/paytonbaldridge777/BibleApp-api).

---

## 🔒 Safety & Disclaimer

Shepherd includes built-in **crisis detection** that monitors free-text input for keywords indicating distress. When detected, users are shown compassionate resources before continuing:

- **988 Suicide & Crisis Lifeline**: Call or text 988 (US)
- **Crisis Text Line**: Text HOME to 741741
- **Emergency**: Call 911

> **Important**: Shepherd is for spiritual encouragement and study assistance only. It is **not** a substitute for pastoral counseling, professional mental health support, or crisis intervention.

---

## 💡 Future Improvements

- [ ] Email digest — send daily guidance to email
- [ ] Bible translation selection (NIV, ESV, KJV, etc.)
- [ ] Community features — share verses with friends
- [ ] Progress tracking — spiritual journal
- [ ] Push notifications for daily reminders
- [ ] Admin dashboard for content moderation
- [ ] Multi-language support
- [ ] Dark mode

---

## 📄 License

MIT License — see LICENSE file for details.
