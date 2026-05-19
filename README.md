# Desi Try-On

A virtual fitting room for desi clothing. Users upload a photo (or pick a demo
model), choose a saree / lehnga choli / anarkali frock from a curated catalogue,
and an AI generates a fitted try-on image. Ships with an admin panel for
managing the catalogue.

## Stack

| Layer | Tech |
|---|---|
| Web | Next.js 16 (App Router), React 19, Tailwind v4 |
| Admin auth | Single password + signed cookie (iron-session) |
| Image storage + metadata | Cloudinary (folder = catalogue, tags = category, context = name/description) |
| Try-on engine | Pluggable: `mock` for offline dev, `huggingface` (Leffa Space) for real AI |
| Hosting | Vercel — serverless-compatible (no filesystem writes) |

## How it works

- **Seed garments** (the two defaults) ship as JPEGs in `public/garments/` and are referenced from [src/data/seed-clothes.ts](src/data/seed-clothes.ts). They are part of the build artifact, so they work on Vercel without any external service.
- **Admin-uploaded garments** go to Cloudinary. The image bytes are stored as Cloudinary assets; the metadata (name, category, description) is stored on the same asset via Cloudinary tags and context. There is **no separate database**.
- **Demo models** (the row of thumbnails on the upload page) live in `public/models/` and are configured in [src/data/seed-models.ts](src/data/seed-models.ts). The store auto-prefers a sibling `.jpg`/`.png` over an `.svg` placeholder, so dropping in a real photo upgrades the slot with no code change.
- **User photos** are streamed multipart through `/api/tryon` and forwarded to the try-on engine. They are never persisted.
- **Try-on results** are served directly from the Hugging Face Space URL — we don't re-upload them. Fast, but the URL may not be permanent (good enough for a thesis demo).

## Project layout

```
src/
  app/
    page.tsx                       # Landing
    try-on/                        # User flow (photo → pick garment → result)
    admin/                         # Admin (login, list, new)
    api/
      tryon/                       # POST: multipart → try-on engine
      admin/                       # login, logout, clothes CRUD
  data/
    seed-clothes.ts                # Bundled default garments
    seed-models.ts                 # Bundled demo model presets
  lib/
    categories.ts
    cloudinary.ts                  # Configured SDK + enabled() check
    auth/admin-session.ts
    store/clothes.ts               # Cloudinary-backed clothes + seed fallback
    tryon/                         # Provider interface + mock + HF
  proxy.ts                         # Gates /admin/* (Next.js 16 "proxy" replaces old "middleware")
public/
  garments/
    seed-lehnga.jpeg               # Default catalogue items
    seed-saree.jpeg
  models/
    model-pink-jacket.jpg          # Demo model
    model-placeholder-*.svg        # Empty slots (replace with real JPGs)
```

## Local dev

```powershell
copy .env.example .env.local
```

Fill `.env.local`. Minimum to get a working catalogue + admin flow with the mock try-on:

```
ADMIN_PASSWORD=changeme
ADMIN_SESSION_SECRET=<32+ char random>
TRYON_PROVIDER=mock
```

Generate the secret:

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Then:

```powershell
npm install
npm run dev
```

- Site: <http://localhost:3000>
- Admin: <http://localhost:3000/admin/login> (password = `ADMIN_PASSWORD`)

## Going beyond seeds: enable Cloudinary

The catalogue shows the two seeds out of the box. To let admins add more
garments through the UI, you need a Cloudinary account.

1. Sign up at <https://cloudinary.com> (free tier is 25 GB storage + 25 GB bandwidth/month — plenty).
2. **Dashboard → Product Environment Credentials.** Copy:
   - Cloud name
   - API Key
   - API Secret
3. Paste into `.env.local`:

```
CLOUDINARY_CLOUD_NAME=xxx
CLOUDINARY_API_KEY=xxx
CLOUDINARY_API_SECRET=xxx
CLOUDINARY_FOLDER=desi-tryon
```

4. Restart `npm run dev`. The admin "+ Add garment" form now works; uploads go to `desi-tryon/garments` in your Cloudinary library.

## Enable real AI try-on

```
TRYON_PROVIDER=huggingface
HF_SPACE_ID=franciszzj/Leffa
HF_TOKEN=hf_xxx
```

- `HF_TOKEN` is free at <https://huggingface.co/settings/tokens> (Read scope is enough). Anonymous users get ~5 min of GPU time per day; a signed-in token raises that ceiling significantly. **Required for production.**
- Default Space is `franciszzj/Leffa`. If it goes down or changes its API, edit the `predict()` call in [src/lib/tryon/huggingface.ts](src/lib/tryon/huggingface.ts).

## Deploy to Vercel

1. Push the repo to GitHub.
2. <https://vercel.com> → **Import project** → pick the repo. Framework auto-detected as Next.js.
3. **Project Settings → Environment Variables**, add (all 8 are required for full functionality):

   | Key | Value |
   |---|---|
   | `ADMIN_PASSWORD` | A strong password — *not* `changeme` |
   | `ADMIN_SESSION_SECRET` | 32+ char random hex |
   | `TRYON_PROVIDER` | `huggingface` |
   | `HF_TOKEN` | Your HF token |
   | `HF_SPACE_ID` | `franciszzj/Leffa` |
   | `CLOUDINARY_CLOUD_NAME` | From Cloudinary dashboard |
   | `CLOUDINARY_API_KEY` | From Cloudinary dashboard |
   | `CLOUDINARY_API_SECRET` | From Cloudinary dashboard |
   | `CLOUDINARY_FOLDER` | `desi-tryon` (or whatever folder you want) |

4. Deploy.

### Vercel quirks to know

- **Serverless function duration**: Try-on calls can take 30-90s (HF cold start). Free tier caps at 60s; Hobby plan is fine for sporadic traffic; Pro lifts to 300s. If you see timeouts, upgrade or warm the Space with a periodic ping.
- **Body size limit**: Vercel free/hobby caps request bodies at 4.5 MB. The try-on upload sends the user's full photo, so a 6 MB iPhone shot will be rejected. The UI doesn't yet resize client-side — TODO.
- **Filesystem is read-only**: That's the whole reason we're on Cloudinary. Anything in `/public` works (it's built); nothing else can be written at runtime.

## Adding more demo models

Drop a JPG into `public/models/` and add an entry to [src/data/seed-models.ts](src/data/seed-models.ts):

```ts
{ id: 'preset-x', name: 'Studio shot', path: 'models/my-model.jpg' }
```

If `path` points to an `.svg` placeholder but a sibling `.jpg` exists, the JPG wins. So you can also just save a JPG at the same name as one of the existing placeholders (e.g. `model-placeholder-a.jpg`) and the slot upgrades automatically.

## Known limitations

- **AI try-on quality** depends on the garment image. Clean flat-lay or
  mannequin shots beat editorial photos with a model. The admin "+ Add garment"
  form reminds you of this.
- **Pose sensitivity**: the user's photo needs to be roughly front-facing,
  full body, plain background. The pose guide in the upload step nudges this
  but cannot enforce it.
- **HF Space SLA**: zero. Public Spaces can disappear or change their API.
  The provider interface in [src/lib/tryon/types.ts](src/lib/tryon/types.ts)
  makes swapping in FASHN.ai or Replicate a one-file change.
- **No try-on history**: results are not saved anywhere by us. If you want to
  show users their past try-ons, upload results to Cloudinary too and key by
  a user/session id.
