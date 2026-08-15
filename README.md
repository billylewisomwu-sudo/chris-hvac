# Chris the Master HVAC Tech — Glacier Air Inc.

A simple, installable app. Employees open it, ask an HVAC question (or snap a
photo of the unit / data plate / gauges), and get expert answers from an AI tuned
to act like a master HVAC tech for Glacier Air. That's it — no logins, no database.

---

## What I need from you to finish it

1. **An OpenAI API key.** Sign in at https://platform.openai.com → **API keys** →
   create one → add a little billing (pay-as-you-go). This is the only paid piece.
2. **A GitHub account and a Vercel account** (both free) to put it online. Or tell
   me you'd rather host it another way.
3. **(Optional) A team access code** — one word/phrase so only your crew can use it
   (keeps strangers from spending your OpenAI credits if the link gets shared).
4. **(Optional) A domain** like `app.glacierairinc.com`. Without it you still get a
   free `…vercel.app` web address that works fine on the Home Screen.
5. **(Optional) Confirm the name/wording** — right now it says "Chris the Master
   HVAC Tech · Glacier Air Inc." Tell me if you want anything changed.

Give me the key (and optional code), and I can finish setup, or you can follow the
steps below yourself.

---

## Put it online (about 10 minutes)

1. Create a project on Vercel from this code (upload to GitHub, then in Vercel:
   **Add New → Project → import the repo**). Framework auto-detects as Next.js.
2. In Vercel, add **Environment Variables**:
   - `OPENAI_API_KEY` = your key
   - `OPENAI_MODEL` = `gpt-5.6-terra` (balanced; `gpt-5.6-sol` = smartest, `gpt-5.6-luna` = cheapest)
   - `ACCESS_CODE` = your team code (or leave blank for none)
3. Click **Deploy**. Vercel gives you a live web address.
4. (Optional) Add your domain under **Settings → Domains** and follow the one DNS step.

## Add to iPhone Home Screen

1. Open the web address in **Safari**.
2. Tap **Share** → **Add to Home Screen**.
3. Name it **Chris HVAC** → **Add**. It opens full-screen like a real app.

Android/Chrome: open the site → menu (⋮) → **Install app**.

## Run it on your computer first (optional)

```bash
npm install
cp .env.example .env.local      # put your OPENAI_API_KEY in this file
npm run dev                      # open http://localhost:3000
```

---

## Notes
- The OpenAI key lives only on the server — it's never exposed in the app, so it
  can't be stolen from a phone.
- Photos are shrunk on the phone before sending, to save data and cost.
- Uses OpenAI's current **Responses API** with the **GPT-5.6** models (they read
  images, so data-plate and gauge photos work).
- This wasn't run through a full build here, so budget a few minutes on the first
  `npm run dev` for any small fix. It's real, complete code — one screen, one API route.

**Files:** `app/page.tsx` (the screen), `app/api/chat/route.ts` (the AI, with the
HVAC expert instructions you can tweak), `public/` (icons + install files).
