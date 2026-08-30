# Budget

A personal budgeting app built around a variable income: you always have a
guaranteed minimum, and anything above that gets split according to rules
you set once. No transaction logging, no bank connection — you glance at it,
not maintain it.

- **Today** — where you stand right now: guaranteed monthly breathing room,
  buffer progress, DUO balance, and a live calculator for splitting any
  extra income you get paid.
- **What-if** — play with different extra-income and split assumptions to
  see projected buffer growth and DUO payoff over time. Nothing here is saved.
- **DUO** — a fully manual payment log (no fixed monthly assumption, since
  paying it off faster isn't the priority right now).
- **Settings** — the one place you edit your rules: minimum income, fixed
  costs, buffer target, and the percentages extra income gets split into.

## Tech

Next.js 16 (App Router) + Tailwind + Recharts, with a tiny Postgres-backed
API route (`/api/state`) storing everything as one JSON blob — there's only
one user, so a full relational schema would be overkill. Uses
[`@neondatabase/serverless`](https://github.com/neondatabase/serverless),
which is what Vercel's own Postgres integration runs on.

## Deploying

1. **Push this to GitHub.** Create a new repo and push this folder to it
   (or use the GitHub CLI: `gh repo create budget-app --private --source=. --push`).

2. **Import into Vercel.** Go to [vercel.com/new](https://vercel.com/new),
   pick the repo, and deploy — no configuration needed, it'll auto-detect
   Next.js.

3. **Attach a database.** In your new Vercel project, go to the **Storage**
   tab → **Create Database** → choose **Postgres** (powered by Neon, free
   tier is plenty for this). Once created, attach it to the project — Vercel
   automatically sets the `DATABASE_URL` environment variable for you.

4. **Redeploy.** Trigger a redeploy (Vercel usually does this automatically
   after attaching a database; if not, go to Deployments → click the latest
   → Redeploy). The app will create its one table automatically on first
   request.

5. **Open the app on your phone.** Visit your `*.vercel.app` URL (add it to
   your home screen for an app-like feel: Safari → Share → Add to Home
   Screen). Your data is the same everywhere since it lives in the database,
   not on the device.

### First-time setup in the app

Once it's live, go to **Settings** and fill in your real minimum income,
fixed costs, buffer target, and how you want extra income split. Everything
defaults to placeholder numbers from our conversation — replace them with
your own.

## Local development

```bash
npm install
vercel env pull .env.local   # after attaching a database on Vercel
npm run dev
```

Without a `DATABASE_URL` set, the app still runs and shows placeholder data,
but nothing will save — you'll see a banner on the Today page pointing this out.

## Adding a passcode later

If you ever want to lock the URL down, the simplest approach is a
[Vercel Edge Middleware](https://nextjs.org/docs/app/building-your-application/routing/middleware)
that checks a cookie against a password you set as an environment variable,
redirecting to a simple login form if it's missing. Ask if you want this
added — it's a small addition.
