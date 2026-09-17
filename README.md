# Ghar ka Khana — Website (AI-powered lead-gen version)

This is a different, separate product from the personal meal-planner PWA:
a public website that asks a visitor's goal and household, generates a real
weekly plan (using the same rule-based logic as the app — no onion/garlic,
low oil, rotation-aware), shows a preview, and asks for phone/email before
unlocking the full week.

## What this costs to run (be aware before deploying)

- **Hosting:** free, on Vercel's free tier, for normal personal-project traffic.
- **OpenAI text calls:** one short call per visitor's "generate my plan" click
  (writes a 2-3 sentence personalization note only — not the plan itself).
  Check OpenAI's current per-token pricing before launch; at a small number of
  visitors this is pennies, but it scales with traffic, so keep an eye on it.
- **Dish images:** a one-time cost when you run `scripts/generate-images.js`
  (≈48 images, once). Not a per-visitor cost — the images are static files
  after that.
- **Google Sheet leads:** free.

If the OpenAI key isn't set, the site still works fully — plans generate
normally, just without the short personalization note.

## 1. Deploy to Vercel

1. Push this folder to a new GitHub repository.
2. Go to [vercel.com](https://vercel.com) → **Add New → Project** → import that repo.
3. Vercel auto-detects Next.js — leave build settings as default.
4. Before the first deploy (or right after, then redeploy), add environment
   variables under **Project Settings → Environment Variables**:
   - `OPENAI_API_KEY` — from https://platform.openai.com/api-keys
   - `GOOGLE_SHEET_WEBHOOK_URL` — see step 2 below
5. Deploy. You'll get a live URL like `https://your-project.vercel.app`.

## 2. Set up the Google Sheet for leads

1. Create a new Google Sheet.
2. Go to **Extensions → Apps Script**.
3. Delete the placeholder code and paste in the contents of
   `scripts/google-apps-script.gs`.
4. Click **Deploy → New deployment**.
5. Type: **Web app**. Execute as: **Me**. Who has access: **Anyone**.
6. Click **Deploy**, authorize it, and copy the Web App URL it gives you.
7. Paste that URL as `GOOGLE_SHEET_WEBHOOK_URL` in Vercel.

Every submitted lead appears as a new row in that Sheet automatically.

## 3. Generate dish images

Two ways to do this now:

### Option A — on-site admin page (no terminal needed)

1. Add `ADMIN_PASSWORD` to your Vercel environment variables (any password
   you choose) and redeploy.
2. Visit `https://your-site.vercel.app/admin/images`, enter that password.
3. Click **Generate** on a dish, then **Download** the result.
4. Save the downloaded file into `public/images/` in your repo with the
   exact filename shown (e.g. `sab_bhindi.jpg`), then commit and push (via
   GitHub Desktop, same as any other file change).

**Why you still have to manually save each one:** Vercel's serverless
functions run on a filesystem that resets on every request — a file the
server writes doesn't stick around for other visitors or survive the next
deploy. So generation happens live on your site, but saving the result into
your repo is still a manual (quick) step. If you want that last step
automated too, the standard next step is a persistent storage add-on like
Vercel Blob — worth doing once you know the site gets real traffic, not
before.

### Option B — batch script, once, locally

```bash
npm install
export OPENAI_API_KEY=sk-...
node scripts/generate-images.js
```

This creates `public/images/<recipe-id>.jpg` for each recipe in one run.
Commit those files and push. Either option leaves the site working fine
with emoji icons if you skip images entirely.

## 4. Add YouTube recipe videos (optional, manual — by design)

Open `lib/recipes.js`, find `YOUTUBE_LINKS` near the bottom, and add entries:

```js
const YOUTUBE_LINKS = {
  sab_bhindi: "https://www.youtube.com/watch?v=XXXXXXXXXXX",
};
```

This is deliberately manual rather than an automatic YouTube search — an
automated search could easily surface a video that uses onion/garlic or
heavy oil, which would undercut the entire point of this planner. Pick
videos from a channel you trust, once, per dish.

## Features in this version

- **Goal → household → meals → plan** onboarding, with the first day free
  to preview and the rest unlocked after phone/email capture.
- **BMI reference per adult member** (age, optional gender/weight/height).
  This is a standard weight÷height² screening number with WHO's usual
  categories — not a diagnosis, and the UI says so. It does not change what
  the generator cooks; your stated **goal** already controls oil level and
  dish mix. Gender is collected but doesn't affect the BMI number itself
  (it never does — that's just how BMI is defined). For under-18 members,
  no adult category is shown, since children need age/sex-specific growth
  charts instead.
- **Swap** any single dish for another from the same course (a dal only
  ever swaps for another dal), still respecting the visitor's goal (e.g. a
  "gentle" plan will never swap in a high-oil dish) and season.
- **Grocery list**, aggregated across the whole unlocked week, grouped by
  Sabzi Mandi / Kirana / Dairy, with a "Copy list" button.
- **Desktop-first layout**: navbar, hero, how-it-works, features, and a
  multi-column week grid — collapses cleanly to one column on mobile.
- **On-site admin image generator** at `/admin/images` (see above).

## Local development

```bash
npm install
cp .env.example .env.local   # fill in your keys
npm run dev
```

Visit http://localhost:3000.

## Notes on the "Other" goal

The "Other" option (old age / BP / cholesterol) applies a hard filter that
excludes every high-oil and fried recipe — it does not give clinical dietary
advice, and the site says so on-screen. If you want it to say something more
specific for a particular condition, that's a copy change in `pages/index.js`
and `pages/api/generate-plan.js` (the `GOAL_LABELS` and the OpenAI prompt) —
worth having a dietitian review any wording before this goes live publicly.

## What's NOT in this v1 (on purpose)

- No plan history/accounts — every visit is a fresh session.
- No real database — leads go straight to a Google Sheet.
- No duplicate-lead detection.
- No admin dashboard for adding/editing recipes — that's still done by
  editing `lib/recipes.js` directly.

These are reasonable v2 additions once you know the site gets real traffic.
